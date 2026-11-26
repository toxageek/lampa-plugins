package io.github.toxageek.goveesync;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Фоновая служба синхронизации: слушает события экрана и сна телевизора
 * (ACTION_SCREEN_ON/OFF, DREAMING_STARTED/STOPPED, SHUTDOWN) и отправляет
 * команды включения/выключения на подсветку Govee через OpenAPI.
 */
public final class MonitorService extends Service {

    private static final String TAG = "GoveeSync";
    private static final String CHANNEL_ID = "govee_sync_monitor";
    private static final int NOTIF_ID = 1097;

    public static final String ACTION_STATUS_CHANGED = "io.github.toxageek.goveesync.STATUS_CHANGED";

    private static final String EXTRA_SEND_POWER = "send_power";
    private static final String EXTRA_POWER_ON = "power_on";
    private static final String EXTRA_REASON = "reason";

    /** Задержки повторов при сетевой ошибке (например, Wi-Fi поднимается после сна ТВ). */
    private static final long[] RETRY_DELAYS_MS = {0L, 1_500L, 3_000L, 5_000L, 8_000L};
    private static final long WAKELOCK_TIMEOUT_MS = 25_000L;

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final AtomicInteger COMMAND_SEQ = new AtomicInteger(0);
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private static volatile boolean running = false;

    private boolean receiverRegistered = false;

    public interface PowerCallback {
        void onComplete(boolean success, String statusLine);
    }

    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || intent.getAction() == null) return;
            Prefs prefs = Prefs.of(context);
            if (!prefs.isEnabled() || !prefs.isConfigured()) return;

            String action = intent.getAction();
            if (Intent.ACTION_SCREEN_ON.equals(action)) {
                sendPowerAsync(context, true, "SCREEN_ON", true, null);
            } else if (Intent.ACTION_SCREEN_OFF.equals(action)) {
                sendPowerAsync(context, false, "SCREEN_OFF", false, null);
            } else if (Intent.ACTION_DREAMING_STARTED.equals(action)) {
                if (prefs.isOffOnDream()) {
                    sendPowerAsync(context, false, "SCREENSAVER_ON", false, null);
                }
            } else if (Intent.ACTION_DREAMING_STOPPED.equals(action)) {
                if (prefs.isOffOnDream()) {
                    sendPowerAsync(context, true, "SCREENSAVER_OFF", true, null);
                }
            } else if (Intent.ACTION_SHUTDOWN.equals(action)) {
                sendPowerAsync(context, false, "SHUTDOWN", false, null);
            }
        }
    };

    public static boolean isRunning() {
        return running;
    }

    /** Запускает службу, если синхронизация включена, либо останавливает её. */
    public static void syncState(Context context) {
        Prefs prefs = Prefs.of(context);
        if (prefs.isEnabled()) {
            start(context, false, false, null);
        } else {
            stop(context);
        }
    }

    /** Запускает службу и опционально отправляет команду питания. */
    public static void start(Context context, boolean sendPower, boolean powerOn, String reason) {
        Context app = context.getApplicationContext();
        Intent intent = new Intent(app, MonitorService.class);
        if (sendPower) {
            intent.putExtra(EXTRA_SEND_POWER, true);
            intent.putExtra(EXTRA_POWER_ON, powerOn);
            intent.putExtra(EXTRA_REASON, reason != null ? reason : "START");
        }
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                app.startForegroundService(intent);
            } else {
                app.startService(intent);
            }
        } catch (RuntimeException e) {
            Log.e(TAG, "cannot start MonitorService", e);
        }
    }

    public static void stop(Context context) {
        Context app = context.getApplicationContext();
        app.stopService(new Intent(app, MonitorService.class));
    }

    /**
     * Отправляет команду включения/выключения в фоновом потоке.
     * Держит короткий PARTIAL_WAKE_LOCK, чтобы запрос успел уйти до глубокого сна ТВ.
     * При сетевой ошибке (например, Wi-Fi ещё поднимается) повторяет попытку с паузой;
     * если за время ожидания пришла более новая команда — старая автоматически отменяется.
     */
    public static void sendPowerAsync(
            final Context context,
            final boolean on,
            final String reason,
            final boolean allowNetworkRetries,
            final PowerCallback callback
    ) {
        final Context app = context.getApplicationContext();
        final int seq = COMMAND_SEQ.incrementAndGet();

        EXECUTOR.execute(new Runnable() {
            @Override
            public void run() {
                if (COMMAND_SEQ.get() != seq) return;

                Prefs prefs = Prefs.of(app);
                String apiKey = prefs.apiKey();
                String sku = prefs.deviceSku();
                String deviceId = prefs.deviceId();

                if (apiKey.isEmpty() || sku.isEmpty() || deviceId.isEmpty()) {
                    String line = formatStatus(on, reason, "не настроено (укажите API-ключ и устройство)");
                    saveAndNotify(app, line, false, callback);
                    return;
                }

                PowerManager.WakeLock wakeLock = acquireWakeLock(app);
                try {
                    int maxAttempts = allowNetworkRetries ? RETRY_DELAYS_MS.length : 2;
                    String lastError = null;

                    for (int attempt = 0; attempt < maxAttempts; attempt++) {
                        if (COMMAND_SEQ.get() != seq) {
                            Log.d(TAG, "superseded command " + reason);
                            return;
                        }

                        long delay = attempt < RETRY_DELAYS_MS.length ? RETRY_DELAYS_MS[attempt] : 2_000L;
                        if (delay > 0) {
                            try {
                                Thread.sleep(delay);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                return;
                            }
                            if (COMMAND_SEQ.get() != seq) return;
                        }

                        try {
                            GoveeApi.setPower(apiKey, sku, deviceId, on);
                            String line = formatStatus(on, reason, "OK");
                            Log.i(TAG, line);
                            saveAndNotify(app, line, true, callback);
                            return;
                        } catch (GoveeApi.ApiException e) {
                            lastError = e.getMessage();
                            Log.w(TAG, "Govee API error (" + reason + ", attempt " + (attempt + 1) + "): " + lastError);
                            if (!e.retryable) break;
                        } catch (IOException e) {
                            lastError = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                            Log.w(TAG, "Network error (" + reason + ", attempt " + (attempt + 1) + "): " + lastError);
                        }
                    }

                    String line = formatStatus(on, reason, "ошибка: " + (lastError != null ? lastError : "нет сети"));
                    saveAndNotify(app, line, false, callback);
                } finally {
                    releaseWakeLock(wakeLock);
                }
            }
        });
    }

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundInternal();
        registerScreenReceiver();
        running = true;
        notifyStatusChanged(this);
        Log.i(TAG, "MonitorService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!Prefs.of(this).isEnabled()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null && intent.getBooleanExtra(EXTRA_SEND_POWER, false)) {
            boolean on = intent.getBooleanExtra(EXTRA_POWER_ON, true);
            String reason = intent.getStringExtra(EXTRA_REASON);
            sendPowerAsync(this, on, reason != null ? reason : "START", on, null);
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        if (receiverRegistered) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (IllegalArgumentException ignored) {}
            receiverRegistered = false;
        }
        notifyStatusChanged(this);
        Log.i(TAG, "MonitorService destroyed");
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void registerScreenReceiver() {
        if (receiverRegistered) return;

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_DREAMING_STARTED);
        filter.addAction(Intent.ACTION_DREAMING_STOPPED);
        filter.addAction(Intent.ACTION_SHUTDOWN);

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screenReceiver, filter);
        }
        receiverRegistered = true;
    }

    @SuppressWarnings("deprecation")
    private void startForegroundInternal() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL_ID,
                        getString(R.string.notif_channel_name),
                        NotificationManager.IMPORTANCE_MIN
                );
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
        }

        Intent openIntent = new Intent(this, SettingsActivity.class);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) piFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, openIntent, piFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        Notification notif = builder
                .setSmallIcon(R.drawable.ic_notif)
                .setContentTitle(getString(R.string.notif_title))
                .setContentText(getString(R.string.notif_text))
                .setContentIntent(pi)
                .setOngoing(true)
                .build();

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIF_ID, notif);
        }
    }

    private static PowerManager.WakeLock acquireWakeLock(Context context) {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm == null) return null;
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "GoveeSync:PowerCmd");
            wl.setReferenceCounted(false);
            wl.acquire(WAKELOCK_TIMEOUT_MS);
            return wl;
        } catch (RuntimeException e) {
            Log.w(TAG, "cannot acquire wake lock", e);
            return null;
        }
    }

    private static void releaseWakeLock(PowerManager.WakeLock wl) {
        if (wl == null) return;
        try {
            if (wl.isHeld()) wl.release();
        } catch (RuntimeException ignored) {}
    }

    private static String formatStatus(boolean on, String reason, String result) {
        String time = new SimpleDateFormat("HH:mm:ss", Locale.US).format(new Date());
        return time + " · " + (on ? "ВКЛ" : "ВЫКЛ") + " (" + reason + "): " + result;
    }

    private static void saveAndNotify(final Context app, final String line, final boolean ok, final PowerCallback cb) {
        Prefs.of(app).setLastStatus(line);
        notifyStatusChanged(app);
        if (cb != null) {
            MAIN.post(new Runnable() {
                @Override
                public void run() {
                    cb.onComplete(ok, line);
                }
            });
        }
    }

    private static void notifyStatusChanged(Context app) {
        Intent i = new Intent(ACTION_STATUS_CHANGED);
        i.setPackage(app.getPackageName());
        app.sendBroadcast(i);
    }
}
