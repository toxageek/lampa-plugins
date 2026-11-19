package io.github.toxageek.lampavoice;

import android.content.Context;
import android.content.SharedPreferences;

/** Типизированная обёртка над SharedPreferences: ключи и допустимые значения в одном месте. */
final class Prefs {

    /** Что делать после распознавания. */
    enum Mode {
        ASK("ask"),
        LAMPA("lampa");

        final String value;

        Mode(String value) {
            this.value = value;
        }

        static Mode parse(String value) {
            for (Mode mode : values()) {
                if (mode.value.equals(value)) return mode;
            }
            return ASK;
        }
    }

    /** Языки распознавания. Пустая строка — язык системы. */
    static final String[] LANGUAGES = {"", "ru-RU", "uk-UA", "en-US"};
    static final String[] LANGUAGE_NAMES = {null, "Русский", "Українська", "English"};

    private static final String FILE = "lampa_voice";
    private static final String KEY_TARGET = "target_package";
    private static final String KEY_MODE = "mode";
    private static final String KEY_LANGUAGE = "language";

    private final SharedPreferences sp;

    private Prefs(SharedPreferences sp) {
        this.sp = sp;
    }

    static Prefs of(Context context) {
        return new Prefs(context.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE));
    }

    /** Пакет Lampa, выбранный вручную; {@code null} — автоопределение. */
    String targetPackage() {
        String value = sp.getString(KEY_TARGET, null);
        return value == null || value.isEmpty() ? null : value;
    }

    void setTargetPackage(String pkg) {
        sp.edit().putString(KEY_TARGET, pkg == null ? "" : pkg).apply();
    }

    Mode mode() {
        return Mode.parse(sp.getString(KEY_MODE, Mode.ASK.value));
    }

    void setMode(Mode mode) {
        sp.edit().putString(KEY_MODE, mode.value).apply();
    }

    /** Код языка BCP-47 или пустая строка. */
    String language() {
        String value = sp.getString(KEY_LANGUAGE, "");
        for (String known : LANGUAGES) {
            if (known.equals(value)) return value;
        }
        return "";
    }

    void setLanguage(String language) {
        sp.edit().putString(KEY_LANGUAGE, language == null ? "" : language).apply();
    }
}
