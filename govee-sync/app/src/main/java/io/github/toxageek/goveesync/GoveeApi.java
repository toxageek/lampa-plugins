package io.github.toxageek.goveesync;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Клиент официального облачного Govee OpenAPI v1 (https://openapi.api.govee.com).
 *
 * H6097 (TV Backlight 3 Lite) не поддерживает локальный UDP LAN API, но официально
 * поддерживается облачным OpenAPI через capability devices.capabilities.on_off / powerSwitch.
 */
public final class GoveeApi {

    private static final String BASE_URL = "https://openapi.api.govee.com";
    private static final String PATH_DEVICES = "/router/api/v1/user/devices";
    private static final String PATH_CONTROL = "/router/api/v1/device/control";

    private static final int CONNECT_TIMEOUT_MS = 8_000;
    private static final int READ_TIMEOUT_MS = 10_000;

    private GoveeApi() {}

    public static final class Device {
        public final String sku;
        public final String device;
        public final String name;
        public final boolean supportsPower;

        public Device(String sku, String device, String name, boolean supportsPower) {
            this.sku = sku;
            this.device = device;
            this.name = name;
            this.supportsPower = supportsPower;
        }

        public String displayLabel() {
            if (name != null && !name.isEmpty()) return sku + " — " + name;
            return sku + " (" + device + ")";
        }
    }

    public static final class ApiException extends IOException {
        public final int httpCode;
        public final boolean retryable;

        public ApiException(String message, int httpCode, boolean retryable) {
            super(message);
            this.httpCode = httpCode;
            this.retryable = retryable;
        }
    }

    /** Запрашивает список устройств аккаунта Govee; H6097 и TV-подсветки ставятся первыми. */
    public static List<Device> fetchDevices(String apiKey) throws IOException {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new ApiException("API-ключ не задан", 0, false);
        }

        String responseText = request("GET", PATH_DEVICES, apiKey.trim(), null);

        try {
            JSONObject root = new JSONObject(responseText);
            int code = root.optInt("code", 200);
            if (code != 200) {
                String msg = root.optString("message", root.optString("msg", "Ошибка API (" + code + ")"));
                throw new ApiException(msg, code, code >= 500 || code == 429);
            }

            JSONArray data = root.optJSONArray("data");
            List<Device> list = new ArrayList<Device>();
            if (data != null) {
                for (int i = 0; i < data.length(); i++) {
                    JSONObject obj = data.optJSONObject(i);
                    if (obj == null) continue;

                    String sku = obj.optString("sku", "").trim();
                    String device = obj.optString("device", "").trim();
                    String name = obj.optString("deviceName", "").trim();
                    if (sku.isEmpty() || device.isEmpty()) continue;

                    boolean hasPower = hasPowerCapability(obj.optJSONArray("capabilities"));
                    list.add(new Device(sku, device, name, hasPower));
                }
            }

            Collections.sort(list, new Comparator<Device>() {
                @Override
                public int compare(Device a, Device b) {
                    int pa = priority(a);
                    int pb = priority(b);
                    if (pa != pb) return pa - pb;
                    return a.displayLabel().compareToIgnoreCase(b.displayLabel());
                }

                private int priority(Device d) {
                    if ("H6097".equalsIgnoreCase(d.sku)) return 0;
                    if (d.sku.toUpperCase().startsWith("H609") || d.sku.toUpperCase().startsWith("H619")) return 1;
                    if (d.name.toLowerCase().contains("tv") || d.name.toLowerCase().contains("backlight")) return 2;
                    return d.supportsPower ? 3 : 4;
                }
            });

            return list;
        } catch (JSONException e) {
            throw new ApiException("Некорректный ответ Govee API: " + e.getMessage(), 0, false);
        }
    }

    /** Отправляет команду включения (on=true) или выключения (on=false) на устройство Govee. */
    public static void setPower(String apiKey, String sku, String deviceId, boolean on) throws IOException {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new ApiException("API-ключ не задан", 0, false);
        }
        if (sku == null || sku.trim().isEmpty() || deviceId == null || deviceId.trim().isEmpty()) {
            throw new ApiException("Устройство не выбрано", 0, false);
        }

        String body;
        try {
            JSONObject capability = new JSONObject();
            capability.put("type", "devices.capabilities.on_off");
            capability.put("instance", "powerSwitch");
            capability.put("value", on ? 1 : 0);

            JSONObject payload = new JSONObject();
            payload.put("sku", sku.trim());
            payload.put("device", deviceId.trim());
            payload.put("capability", capability);

            JSONObject root = new JSONObject();
            root.put("requestId", UUID.randomUUID().toString());
            root.put("payload", payload);

            body = root.toString();
        } catch (JSONException e) {
            throw new ApiException("Ошибка формирования JSON", 0, false);
        }

        String responseText = request("POST", PATH_CONTROL, apiKey.trim(), body);

        try {
            JSONObject resp = new JSONObject(responseText);
            int code = resp.optInt("code", 200);
            if (code != 200) {
                String msg = resp.optString("message", resp.optString("msg", "Ошибка API (" + code + ")"));
                throw new ApiException(msg, code, code >= 500 || code == 429);
            }
        } catch (JSONException e) {
            // Иногда сервер возвращает пустое тело при 200 OK — это не ошибка.
            if (!responseText.trim().isEmpty()) {
                throw new ApiException("Некорректный ответ Govee API", 0, false);
            }
        }
    }

    private static boolean hasPowerCapability(JSONArray caps) {
        if (caps == null) return true;
        for (int i = 0; i < caps.length(); i++) {
            JSONObject cap = caps.optJSONObject(i);
            if (cap == null) continue;
            if ("devices.capabilities.on_off".equals(cap.optString("type"))
                    && "powerSwitch".equals(cap.optString("instance"))) {
                return true;
            }
        }
        return false;
    }

    private static String request(String method, String path, String apiKey, String jsonBody) throws IOException {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BASE_URL + path);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod(method);
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(READ_TIMEOUT_MS);
            conn.setUseCaches(false);
            conn.setRequestProperty("Govee-API-Key", apiKey);
            conn.setRequestProperty("Accept", "application/json");

            if (jsonBody != null) {
                byte[] bytes = jsonBody.getBytes(StandardCharsets.UTF_8);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                conn.setFixedLengthStreamingMode(bytes.length);
                OutputStream os = conn.getOutputStream();
                try {
                    os.write(bytes);
                    os.flush();
                } finally {
                    os.close();
                }
            }

            int status = conn.getResponseCode();
            InputStream stream = status >= 200 && status < 400 ? conn.getInputStream() : conn.getErrorStream();
            String text = readAll(stream);

            if (status == 401 || status == 403) {
                throw new ApiException("Неверный Govee API-ключ (HTTP " + status + ")", status, false);
            }
            if (status == 429) {
                throw new ApiException("Превышен лимит запросов Govee API (HTTP 429)", status, true);
            }
            if (status < 200 || status >= 300) {
                String msg = extractErrorMessage(text, status);
                throw new ApiException(msg, status, status >= 500);
            }

            return text;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String extractErrorMessage(String text, int status) {
        if (text != null && !text.trim().isEmpty()) {
            try {
                JSONObject obj = new JSONObject(text);
                String m = obj.optString("message", obj.optString("msg", ""));
                if (!m.isEmpty()) return m + " (HTTP " + status + ")";
            } catch (JSONException ignored) {}
        }
        return "Ошибка Govee API (HTTP " + status + ")";
    }

    private static String readAll(InputStream stream) throws IOException {
        if (stream == null) return "";
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        try {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } finally {
            reader.close();
        }
    }
}
