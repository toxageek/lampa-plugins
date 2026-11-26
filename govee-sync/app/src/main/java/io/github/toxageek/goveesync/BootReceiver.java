package io.github.toxageek.goveesync;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

/**
 * Автозапуск службы при загрузке ТВ / обновлении пакета и выключение подсветки
 * при полном выключении телевизора (ACTION_SHUTDOWN).
 */
public final class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "GoveeSync";

    @Override
    public void onReceive(final Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        final String action = intent.getAction();
        final Prefs prefs = Prefs.of(context);
        if (!prefs.isEnabled()) return;

        if (Intent.ACTION_SHUTDOWN.equals(action)
                || "android.intent.action.QUICKBOOT_POWEROFF".equals(action)) {
            if (!prefs.isConfigured()) return;

            final PendingResult pending = goAsync();
            MonitorService.sendPowerAsync(context, false, "SHUTDOWN", false, new MonitorService.PowerCallback() {
                @Override
                public void onComplete(boolean success, String statusLine) {
                    try {
                        pending.finish();
                    } catch (RuntimeException ignored) {}
                }
            });
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {

            boolean isBoot = !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action);
            boolean sendOn = isBoot && prefs.isConfigured() && prefs.isOnOnBoot() && isScreenInteractive(context);

            Log.i(TAG, "BootReceiver: " + action + ", sendOn=" + sendOn);
            MonitorService.start(context, sendOn, true, "BOOT");
        }
    }

    private static boolean isScreenInteractive(Context context) {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            return pm == null || pm.isInteractive();
        } catch (RuntimeException e) {
            return true;
        }
    }
}
