package io.github.toxageek.goveesync;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Мини-вебсервер для удобной настройки с телефона или ПК (вставка API-ключа,
 * выбор устройства H6097 и проверка включения/выключения).
 * Работает только пока на телевизоре открыт экран SettingsActivity.
 */
public final class WebConfigServer {

    public static final int PORT = 8765;
    private static final String TAG = "GoveeSync";
    private static final int MAX_BODY_BYTES = 32 * 1024;
    private static final int SOCKET_TIMEOUT_MS = 12_000;

    public interface OnChangeListener {
        void onConfigChanged();
    }

    private final Context app;
    private final OnChangeListener listener;
    private final ServerSocket serverSocket;
    private volatile boolean stopped = false;

    private WebConfigServer(Context app, OnChangeListener listener, ServerSocket ss) {
        this.app = app.getApplicationContext();
        this.listener = listener;
        this.serverSocket = ss;
    }

    public static WebConfigServer start(Context context, OnChangeListener listener) throws IOException {
        ServerSocket ss = new ServerSocket(PORT);
        ss.setReuseAddress(true);
        final WebConfigServer srv = new WebConfigServer(context, listener, ss);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                srv.acceptLoop();
            }
        }, "GoveeWebConfig");
        t.setDaemon(true);
        t.start();
        return srv;
    }

    public void shutdown() {
        stopped = true;
        try {
            serverSocket.close();
        } catch (IOException ignored) {}
    }

    /** Возвращает локальный IPv4-адрес ТВ в домашней сети или null. */
    public static String findLocalIpv4() {
        try {
            String fallback = null;
            Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
            if (ifaces == null) return null;
            while (ifaces.hasMoreElements()) {
                NetworkInterface iface = ifaces.nextElement();
                if (!iface.isUp() || iface.isLoopback() || iface.isVirtual()) continue;
                Enumeration<InetAddress> addrs = iface.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
                    String ip = addr.getHostAddress();
                    if (ip == null) continue;
                    if (addr.isSiteLocalAddress()) return ip;
                    if (fallback == null) fallback = ip;
                }
            }
            return fallback;
        } catch (Exception e) {
            return null;
        }
    }

    private void acceptLoop() {
        while (!stopped) {
            try {
                final Socket client = serverSocket.accept();
                Thread worker = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        handleClient(client);
                    }
                }, "GoveeWebClient");
                worker.setDaemon(true);
                worker.start();
            } catch (IOException e) {
                if (!stopped) Log.w(TAG, "WebConfigServer accept error", e);
                break;
            }
        }
    }

    private void handleClient(Socket socket) {
        try {
            socket.setSoTimeout(SOCKET_TIMEOUT_MS);
            InputStream in = new BufferedInputStream(socket.getInputStream());
            OutputStream out = socket.getOutputStream();

            String requestLine = readLine(in);
            if (requestLine == null || requestLine.isEmpty()) return;

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                writeResponse(out, 400, "text/plain; charset=utf-8", "Bad Request");
                return;
            }

            String method = parts[0].toUpperCase(Locale.US);
            String path = parts[1];
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);

            int contentLength = 0;
            String line;
            while ((line = readLine(in)) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon > 0) {
                    String name = line.substring(0, colon).trim().toLowerCase(Locale.US);
                    String val = line.substring(colon + 1).trim();
                    if ("content-length".equals(name)) {
                        try {
                            contentLength = Integer.parseInt(val);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            String body = "";
            if (contentLength > 0) {
                if (contentLength > MAX_BODY_BYTES) {
                    writeResponse(out, 413, "text/plain; charset=utf-8", "Payload Too Large");
                    return;
                }
                body = new String(readExact(in, contentLength), StandardCharsets.UTF_8);
            }

            route(method, path, body, out);
        } catch (IOException ignored) {
        } finally {
            try {
                socket.close();
            } catch (IOException ignored) {}
        }
    }

    private void route(String method, String path, String body, OutputStream out) throws IOException {
        if ("GET".equals(method) && "/".equals(path)) {
            writeResponse(out, 200, "text/html; charset=utf-8", HTML_PAGE);
            return;
        }

        if ("GET".equals(method) && "/api/state".equals(path)) {
            writeJson(out, 200, buildStateJson());
            return;
        }

        if ("POST".equals(method) && "/api/devices".equals(path)) {
            handleFetchDevices(body, out);
            return;
        }

        if ("POST".equals(method) && "/api/save".equals(path)) {
            handleSave(body, out);
            return;
        }

        if ("POST".equals(method) && "/api/power".equals(path)) {
            handlePower(body, out);
            return;
        }

        writeResponse(out, 404, "text/plain; charset=utf-8", "Not Found");
    }

    private JSONObject buildStateJson() {
        Prefs prefs = Prefs.of(app);
        JSONObject o = new JSONObject();
        try {
            o.put("enabled", prefs.isEnabled());
            o.put("hasApiKey", !prefs.apiKey().isEmpty());
            o.put("maskedApiKey", prefs.maskedApiKey());
            o.put("deviceSku", prefs.deviceSku());
            o.put("deviceId", prefs.deviceId());
            o.put("deviceName", prefs.deviceName());
            o.put("offOnDream", prefs.isOffOnDream());
            o.put("onOnBoot", prefs.isOnOnBoot());
            o.put("serviceRunning", MonitorService.isRunning());
            o.put("lastStatus", prefs.lastStatus());
        } catch (JSONException ignored) {}
        return o;
    }

    private void handleFetchDevices(String body, OutputStream out) throws IOException {
        String apiKey = "";
        try {
            if (!body.trim().isEmpty()) {
                JSONObject req = new JSONObject(body);
                apiKey = req.optString("apiKey", "").trim();
            }
        } catch (JSONException ignored) {}

        if (apiKey.isEmpty()) apiKey = Prefs.of(app).apiKey();

        try {
            List<GoveeApi.Device> devices = GoveeApi.fetchDevices(apiKey);
            JSONArray arr = new JSONArray();
            for (GoveeApi.Device d : devices) {
                JSONObject item = new JSONObject();
                item.put("sku", d.sku);
                item.put("device", d.device);
                item.put("name", d.name);
                item.put("label", d.displayLabel());
                arr.put(item);
            }
            JSONObject resp = new JSONObject();
            resp.put("ok", true);
            resp.put("devices", arr);
            writeJson(out, 200, resp);
        } catch (Exception e) {
            writeErrorJson(out, e.getMessage());
        }
    }

    private void handleSave(String body, OutputStream out) throws IOException {
        try {
            JSONObject req = new JSONObject(body);
            Prefs prefs = Prefs.of(app);

            String apiKey = req.optString("apiKey", "").trim();
            if (!apiKey.isEmpty()) {
                prefs.setApiKey(apiKey);
            }
            if (req.has("deviceSku") && req.has("deviceId")) {
                prefs.setDevice(
                        req.optString("deviceSku", ""),
                        req.optString("deviceId", ""),
                        req.optString("deviceName", "")
                );
            }
            if (req.has("enabled")) prefs.setEnabled(req.optBoolean("enabled", true));
            if (req.has("offOnDream")) prefs.setOffOnDream(req.optBoolean("offOnDream", false));
            if (req.has("onOnBoot")) prefs.setOnOnBoot(req.optBoolean("onOnBoot", true));

            MonitorService.syncState(app);
            if (listener != null) listener.onConfigChanged();

            JSONObject resp = buildStateJson();
            resp.put("ok", true);
            writeJson(out, 200, resp);
        } catch (JSONException e) {
            writeErrorJson(out, "Некорректный JSON");
        }
    }

    private void handlePower(String body, OutputStream out) throws IOException {
        boolean on;
        try {
            JSONObject req = new JSONObject(body);
            on = req.optBoolean("on", true);
        } catch (JSONException e) {
            writeErrorJson(out, "Некорректный JSON");
            return;
        }

        final CountDownLatch latch = new CountDownLatch(1);
        final boolean[] okHolder = {false};
        final String[] msgHolder = {"Таймаут ожидания ответа"};

        MonitorService.sendPowerAsync(app, on, "WEB_TEST", false, new MonitorService.PowerCallback() {
            @Override
            public void onComplete(boolean success, String statusLine) {
                okHolder[0] = success;
                msgHolder[0] = statusLine;
                latch.countDown();
            }
        });

        try {
            latch.await(15, TimeUnit.SECONDS);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }

        if (listener != null) listener.onConfigChanged();

        JSONObject resp = new JSONObject();
        try {
            resp.put("ok", okHolder[0]);
            resp.put("status", msgHolder[0]);
        } catch (JSONException ignored) {}
        writeJson(out, 200, resp);
    }

    private static void writeErrorJson(OutputStream out, String message) throws IOException {
        JSONObject resp = new JSONObject();
        try {
            resp.put("ok", false);
            resp.put("error", message != null ? message : "Неизвестная ошибка");
        } catch (JSONException ignored) {}
        writeJson(out, 200, resp);
    }

    private static void writeJson(OutputStream out, int code, JSONObject obj) throws IOException {
        writeResponse(out, code, "application/json; charset=utf-8", obj.toString());
    }

    private static void writeResponse(OutputStream out, int code, String contentType, String text) throws IOException {
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        String statusText = code == 200 ? "OK" : (code == 400 ? "Bad Request" : (code == 413 ? "Payload Too Large" : "Not Found"));
        String header = "HTTP/1.1 " + code + " " + statusText + "\r\n"
                + "Content-Type: " + contentType + "\r\n"
                + "Content-Length: " + bytes.length + "\r\n"
                + "Cache-Control: no-store\r\n"
                + "Connection: close\r\n\r\n";
        out.write(header.getBytes(StandardCharsets.US_ASCII));
        out.write(bytes);
        out.flush();
    }

    private static String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        int prev = -1;
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break;
            if (prev == '\r') buf.write('\r');
            if (b != '\r') buf.write(b);
            prev = b;
            if (buf.size() > 8192) break;
        }
        if (b == -1 && buf.size() == 0) return null;
        return new String(buf.toByteArray(), StandardCharsets.UTF_8);
    }

    private static byte[] readExact(InputStream in, int length) throws IOException {
        byte[] data = new byte[length];
        int offset = 0;
        while (offset < length) {
            int n = in.read(data, offset, length - offset);
            if (n < 0) break;
            offset += n;
        }
        return data;
    }

    private static final String HTML_PAGE =
            "<!doctype html><html lang=\"ru\"><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<title>Govee TV Sync</title><style>"
            + "body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#10141f;color:#eef2f9}"
            + ".card{max-width:520px;margin:0 auto;background:#181e2e;border:1px solid #283148;border-radius:14px;padding:20px}"
            + "h1{margin:0 0 6px;font-size:22px}p.sub{margin:0 0 18px;color:#9aa7c2;font-size:14px}"
            + "label{display:block;margin:14px 0 6px;font-size:14px;color:#c7d2e8}"
            + "input[type=text],select{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:9px;border:1px solid #33405f;background:#0e121d;color:#fff;font-size:15px}"
            + ".row{display:flex;gap:10px;margin-top:12px}"
            + "button{flex:1;padding:11px 14px;border:0;border-radius:9px;background:#3a7afe;color:#fff;font-size:15px;font-weight:600;cursor:pointer}"
            + "button.sec{background:#2a344c}button.on{background:#1f9d63}button.off{background:#c94545}"
            + ".chk{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:15px;color:#eef2f9}"
            + ".chk input{width:18px;height:18px}"
            + ".msg{margin-top:14px;padding:10px 12px;border-radius:9px;background:#101624;border:1px solid #283148;font-size:13px;color:#b8c7e4;min-height:18px;white-space:pre-wrap}"
            + "</style></head><body><div class=\"card\">"
            + "<h1>Govee TV Sync</h1><p class=\"sub\">Настройка синхронизации подсветки H6097 с телевизором</p>"
            + "<label for=\"apiKey\">Govee API Key <span id=\"keyHint\" style=\"color:#7f92b8\"></span></label>"
            + "<input id=\"apiKey\" type=\"text\" placeholder=\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\" autocomplete=\"off\">"
            + "<div class=\"row\"><button class=\"sec\" type=\"button\" onclick=\"loadDevices()\">Найти устройства Govee</button></div>"
            + "<label for=\"deviceSel\">Устройство</label>"
            + "<select id=\"deviceSel\"><option value=\"\">— сначала нажмите «Найти устройства» —</option></select>"
            + "<label class=\"chk\"><input id=\"enabled\" type=\"checkbox\"> Включить автосинхронизацию</label>"
            + "<label class=\"chk\"><input id=\"offOnDream\" type=\"checkbox\"> Выключать при заставке (Ambient Mode)</label>"
            + "<label class=\"chk\"><input id=\"onOnBoot\" type=\"checkbox\"> Включать при загрузке ТВ</label>"
            + "<div class=\"row\"><button type=\"button\" onclick=\"save()\">Сохранить</button></div>"
            + "<div class=\"row\"><button class=\"on\" type=\"button\" onclick=\"testPower(true)\">Тест: Вкл</button>"
            + "<button class=\"off\" type=\"button\" onclick=\"testPower(false)\">Тест: Выкл</button></div>"
            + "<div class=\"msg\" id=\"msg\">Загрузка…</div></div><script>"
            + "var currentDevices=[];"
            + "function setMsg(t){document.getElementById('msg').textContent=t;}"
            + "function renderDevices(list,selSku,selDev){"
            + "var s=document.getElementById('deviceSel');s.innerHTML='';"
            + "if(!list.length){var o=document.createElement('option');o.value='';o.textContent=selSku?(selSku+' ('+selDev+')'):'— не выбрано —';s.appendChild(o);return;}"
            + "for(var i=0;i<list.length;i++){var d=list[i];var o=document.createElement('option');"
            + "o.value=i;o.textContent=d.label;if(selSku&&d.sku===selSku&&d.device===selDev)o.selected=true;s.appendChild(o);}}"
            + "function loadState(){fetch('/api/state').then(function(r){return r.json()}).then(function(st){"
            + "document.getElementById('enabled').checked=!!st.enabled;"
            + "document.getElementById('offOnDream').checked=!!st.offOnDream;"
            + "document.getElementById('onOnBoot').checked=!!st.onOnBoot;"
            + "document.getElementById('keyHint').textContent=st.hasApiKey?('(сохранён: '+st.maskedApiKey+')'):'(не задан)';"
            + "if(st.deviceSku){currentDevices=[{sku:st.deviceSku,device:st.deviceId,name:st.deviceName,label:st.deviceSku+(st.deviceName?' — '+st.deviceName:'')}];"
            + "renderDevices(currentDevices,st.deviceSku,st.deviceId);}"
            + "setMsg('Служба: '+(st.serviceRunning?'работает':'остановлена')+(st.lastStatus?'\\n'+st.lastStatus:''));"
            + "}).catch(function(e){setMsg('Ошибка: '+e)});}"
            + "function loadDevices(){setMsg('Запрашиваю устройства у Govee…');"
            + "var key=document.getElementById('apiKey').value.trim();"
            + "fetch('/api/devices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key})})"
            + ".then(function(r){return r.json()}).then(function(res){"
            + "if(!res.ok){setMsg('Ошибка: '+res.error);return;}"
            + "currentDevices=res.devices||[];renderDevices(currentDevices);"
            + "setMsg('Найдено устройств: '+currentDevices.length+'. Выберите нужное и нажмите «Сохранить».');"
            + "}).catch(function(e){setMsg('Ошибка сети: '+e)});}"
            + "function save(){var idx=document.getElementById('deviceSel').value;"
            + "var payload={apiKey:document.getElementById('apiKey').value.trim(),"
            + "enabled:document.getElementById('enabled').checked,"
            + "offOnDream:document.getElementById('offOnDream').checked,"
            + "onOnBoot:document.getElementById('onOnBoot').checked};"
            + "if(idx!==''&&currentDevices[+idx]){var d=currentDevices[+idx];payload.deviceSku=d.sku;payload.deviceId=d.device;payload.deviceName=d.name||'';}"
            + "fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})"
            + ".then(function(r){return r.json()}).then(function(res){"
            + "if(!res.ok){setMsg('Ошибка: '+res.error);return;}"
            + "document.getElementById('apiKey').value='';"
            + "document.getElementById('keyHint').textContent=res.hasApiKey?('(сохранён: '+res.maskedApiKey+')'):'(не задан)';"
            + "setMsg('Сохранено! Служба: '+(res.serviceRunning?'работает':'остановлена'));"
            + "}).catch(function(e){setMsg('Ошибка: '+e)});}"
            + "function testPower(on){setMsg('Отправка команды '+(on?'ВКЛ':'ВЫКЛ')+'…');"
            + "fetch('/api/power',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({on:on})})"
            + ".then(function(r){return r.json()}).then(function(res){"
            + "setMsg(res.status||res.error||'Готово');"
            + "}).catch(function(e){setMsg('Ошибка: '+e)});}"
            + "loadState();"
            + "</script></body></html>";
}
