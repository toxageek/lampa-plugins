package io.github.toxageek.lampavoice;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import java.io.IOException;

/**
 * Держит {@link HandoffServer} ровно столько, сколько нужно плагину, чтобы забрать фразу.
 *
 * Почему обычный (не foreground) сервис: он запускается, пока наша активити на экране,
 * а лимиты фонового выполнения Android 8+ дают ему около минуты после ухода в фон —
 * этого хватает с запасом. Foreground-сервис потребовал бы уведомление и
 * отдельный тип сервиса на Android 14 ради пары секунд работы.
 * Плюс запущенный сервис не даёт системе «заморозить» процесс (cached apps freezer),
 * в отличие от голого потока.
 */
public final class HandoffService extends Service {

    private static final String TAG = "LampaVoice";
    private static final String EXTRA_QUERY = "query";

    /** Сколько живёт сервер без доставки. Холодный старт Lampa с плагинами — до ~20 с. */
    private static final long LIFETIME_MS = 90_000L;

    /** Пауза после доставки: даём плагину повторить запрос, если ответ потерялся. */
    private static final long AFTER_DELIVERY_MS = 3_000L;

    private final Handler main = new Handler(Looper.getMainLooper());
    private HandoffServer server;

    private final Runnable stopper = new Runnable() {
        @Override
        public void run() {
            stopSelf();
        }
    };

    static void deliver(Context context, String query) {
        Intent intent = new Intent(context, HandoffService.class).putExtra(EXTRA_QUERY, query);
        context.startService(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String query = intent == null ? null : intent.getStringExtra(EXTRA_QUERY);
        if (query != null && !query.isEmpty()) HandoffServer.offer(query);

        if (server == null) {
            try {
                server = HandoffServer.start(new HandoffServer.Listener() {
                    @Override
                    public void onDelivered() {
                        main.post(new Runnable() {
                            @Override
                            public void run() {
                                main.removeCallbacks(stopper);
                                main.postDelayed(stopper, AFTER_DELIVERY_MS);
                            }
                        });
                    }
                }, versionName());
            } catch (IOException e) {
                // Порт занят (например, предыдущий экземпляр ещё закрывается) — плагин просто не получит фразу.
                Log.e(TAG, "cannot bind 127.0.0.1:" + HandoffServer.PORT, e);
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        main.removeCallbacks(stopper);
        main.postDelayed(stopper, LIFETIME_MS);
        // Не перезапускать после убийства процесса: фраза к тому моменту уже неактуальна.
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        main.removeCallbacks(stopper);
        if (server != null) {
            server.shutdown();
            server = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private String versionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "?";
        }
    }
}
