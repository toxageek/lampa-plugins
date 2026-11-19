package io.github.toxageek.lampavoice;

import android.accessibilityservice.AccessibilityService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Перехват кнопки микрофона пульта — для прошивок, где её обрабатывает не роль ассистента,
 * а сам Google (лаунчер / katniss). Если их отключить, кнопка просто молчит.
 * Пример: Xiaomi Google TV отдаёт микрофон как keyCode 186 со scanCode 217.
 * Включается в «Специальных возможностях» или через adb (см. README).
 *
 * Ещё служба помнит приложение на экране (только пакет, не содержимое): из YouTube или Twitch
 * фраза уходит сразу в их поиск, а не в Lampa.
 */
public final class KeyService extends AccessibilityService {

    /** Linux KEY_SEARCH: так приходит кнопка микрофона с BLE-пультов, как бы её ни перекодировала прошивка. */
    private static final int SCAN_SEARCH = 217;

    /** Пакет активити на переднем плане; {@code null} — ещё не знаем. */
    private String foreground;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence pkg = event.getPackageName();
        CharSequence cls = event.getClassName();
        if (pkg == null || cls == null || pkg.toString().equals(getPackageName())) return;
        // Только активити: клавиатура, тосты и диалоги поверх приложения его не подменяют.
        try {
            getPackageManager().getActivityInfo(new ComponentName(pkg.toString(), cls.toString()), 0);
            foreground = pkg.toString();
        } catch (PackageManager.NameNotFoundException ignored) {
        }
    }

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (!isVoiceKey(event)) return false;
        if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
            startActivity(new Intent(this, VoiceActivity.class)
                    .putExtra(VoiceActivity.EXTRA_SOURCE, foreground)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        // Съедаем и DOWN, и UP: иначе система получит половину нажатия.
        return true;
    }

    private static boolean isVoiceKey(KeyEvent event) {
        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_ASSIST:
            case KeyEvent.KEYCODE_VOICE_ASSIST:
            case KeyEvent.KEYCODE_SEARCH:
                return true;
            default:
                // Не по keyCode 186: на других пультах это синяя кнопка.
                return event.getScanCode() == SCAN_SEARCH;
        }
    }

    /** Включена ли служба в системных настройках. */
    static boolean isEnabled(Context context) {
        String enabled = Settings.Secure.getString(context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return enabled != null && enabled.contains(context.getPackageName() + "/");
    }

    @Override
    public void onInterrupt() {
    }
}
