package io.github.toxageek.goveesync;

import android.content.Context;
import android.content.SharedPreferences;

/** Настройки приложения и последний статус синхронизации. */
public final class Prefs {

    private static final String FILE = "govee_sync_prefs";

    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_API_KEY = "api_key";
    private static final String KEY_DEVICE_SKU = "device_sku";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_DEVICE_NAME = "device_name";
    private static final String KEY_OFF_ON_DREAM = "off_on_dream";
    private static final String KEY_ON_ON_BOOT = "on_on_boot";
    private static final String KEY_LAST_STATUS = "last_status";

    private final SharedPreferences sp;

    private Prefs(SharedPreferences sp) {
        this.sp = sp;
    }

    public static Prefs of(Context context) {
        Context app = context.getApplicationContext();
        return new Prefs(app.getSharedPreferences(FILE, Context.MODE_PRIVATE));
    }

    public boolean isEnabled() {
        return sp.getBoolean(KEY_ENABLED, true);
    }

    public void setEnabled(boolean value) {
        sp.edit().putBoolean(KEY_ENABLED, value).apply();
    }

    public String apiKey() {
        return trimOrEmpty(sp.getString(KEY_API_KEY, ""));
    }

    public void setApiKey(String value) {
        sp.edit().putString(KEY_API_KEY, trimOrEmpty(value)).apply();
    }

    public String deviceSku() {
        return trimOrEmpty(sp.getString(KEY_DEVICE_SKU, ""));
    }

    public String deviceId() {
        return trimOrEmpty(sp.getString(KEY_DEVICE_ID, ""));
    }

    public String deviceName() {
        return trimOrEmpty(sp.getString(KEY_DEVICE_NAME, ""));
    }

    public void setDevice(String sku, String id, String name) {
        sp.edit()
                .putString(KEY_DEVICE_SKU, trimOrEmpty(sku))
                .putString(KEY_DEVICE_ID, trimOrEmpty(id))
                .putString(KEY_DEVICE_NAME, trimOrEmpty(name))
                .apply();
    }

    public boolean isConfigured() {
        return !apiKey().isEmpty() && !deviceSku().isEmpty() && !deviceId().isEmpty();
    }

    public boolean isOffOnDream() {
        return sp.getBoolean(KEY_OFF_ON_DREAM, false);
    }

    public void setOffOnDream(boolean value) {
        sp.edit().putBoolean(KEY_OFF_ON_DREAM, value).apply();
    }

    public boolean isOnOnBoot() {
        return sp.getBoolean(KEY_ON_ON_BOOT, true);
    }

    public void setOnOnBoot(boolean value) {
        sp.edit().putBoolean(KEY_ON_ON_BOOT, value).apply();
    }

    public String lastStatus() {
        return trimOrEmpty(sp.getString(KEY_LAST_STATUS, ""));
    }

    public void setLastStatus(String text) {
        sp.edit().putString(KEY_LAST_STATUS, trimOrEmpty(text)).apply();
    }

    public String maskedApiKey() {
        String key = apiKey();
        if (key.isEmpty()) return "";
        if (key.length() <= 8) return "****";
        return key.substring(0, 4) + "…" + key.substring(key.length() - 4);
    }

    public String deviceDisplay() {
        String sku = deviceSku();
        String name = deviceName();
        if (sku.isEmpty() && name.isEmpty()) return "";
        if (name.isEmpty()) return sku;
        if (sku.isEmpty()) return name;
        return sku + " — " + name;
    }

    private static String trimOrEmpty(String s) {
        return s == null ? "" : s.trim();
    }
}
