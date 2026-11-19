package io.github.toxageek.lampavoice;

import android.os.SystemClock;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.nio.charset.Charset;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Крошечный HTTP-сервер на 127.0.0.1, через который плагин Lampa забирает фразу.
 *
 * Почему свой сервер на сокетах, а не NanoHTTPD и т.п.: нужны два GET-эндпоинта,
 * зависимость весила бы больше всего приложения.
 *
 * Безопасность:
 *  - слушаем только loopback — с других устройств в сети порт недоступен;
 *  - фраза одноразовая и живёт {@link #QUERY_TTL_MS};
 *  - проверяем Host, чтобы страница в браузере ТВ не дотянулась через DNS rebinding;
 *  - лимит на размер заголовков и тайм-аут чтения — медленный клиент не повесит поток.
 */
final class HandoffServer extends Thread {

    /** Должен совпадать с PORT в voice-search.js. */
    static final int PORT = 39876;

    private static final String TAG = "LampaVoice";
    private static final String PREFIX = "/lampa-voice/v1/";
    private static final long QUERY_TTL_MS = 60_000L;
    private static final int MAX_HEADER_BYTES = 8 * 1024;
    private static final int READ_TIMEOUT_MS = 2_000;
    private static final Charset UTF_8 = Charset.forName("UTF-8");
    private static final Charset LATIN_1 = Charset.forName("ISO-8859-1");

    interface Listener {
        /** Плагин забрал фразу. Вызывается в потоке сервера. */
        void onDelivered();
    }

    /** Фраза, ожидающая плагин. */
    private static final class Pending {
        final String query;
        final String id;
        final long createdAt;

        Pending(String query) {
            this.query = query;
            this.id = UUID.randomUUID().toString();
            this.createdAt = SystemClock.elapsedRealtime();
        }

        boolean expired() {
            return SystemClock.elapsedRealtime() - createdAt > QUERY_TTL_MS;
        }
    }

    private static final AtomicReference<Pending> PENDING = new AtomicReference<>();

    /** Новая фраза вытесняет старую: важна только последняя. */
    static void offer(String query) {
        PENDING.set(new Pending(query));
    }

    /** Атомарно забрать фразу: два одновременных запроса не получат её дважды. */
    private static Pending take() {
        Pending pending = PENDING.getAndSet(null);
        return pending == null || pending.expired() ? null : pending;
    }

    private final ServerSocket socket;
    private final Listener listener;
    private final String version;

    private HandoffServer(ServerSocket socket, Listener listener, String version) {
        super("lampa-voice-handoff");
        this.socket = socket;
        this.listener = listener;
        this.version = version;
        setDaemon(true);
    }

    static HandoffServer start(Listener listener, String version) throws IOException {
        ServerSocket socket = new ServerSocket();
        socket.setReuseAddress(true);
        socket.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), PORT), 8);
        HandoffServer server = new HandoffServer(socket, listener, version);
        server.start();
        return server;
    }

    void shutdown() {
        interrupt();
        try {
            socket.close();
        } catch (IOException ignored) {
        }
    }

    @Override
    public void run() {
        while (!isInterrupted()) {
            Socket client;
            try {
                client = socket.accept();
            } catch (SocketException closed) {
                return;
            } catch (IOException e) {
                Log.w(TAG, "accept failed", e);
                continue;
            }
            try {
                serve(client);
            } catch (IOException e) {
                Log.d(TAG, "client error: " + e.getMessage());
            } finally {
                try {
                    client.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private void serve(Socket client) throws IOException {
        client.setSoTimeout(READ_TIMEOUT_MS);
        String head = readHead(client.getInputStream());
        OutputStream out = client.getOutputStream();
        if (head == null) {
            respond(out, 400, "Bad Request", null);
            return;
        }

        String[] lines = head.split("\r\n");
        String[] request = lines[0].split(" ");
        if (request.length < 2) {
            respond(out, 400, "Bad Request", null);
            return;
        }
        String method = request[0];
        String path = request[1];
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);

        if (!hostAllowed(lines)) {
            respond(out, 403, "Forbidden", null);
            return;
        }

        if ("OPTIONS".equals(method)) {
            respond(out, 204, "No Content", null);
            return;
        }
        if (!"GET".equals(method)) {
            respond(out, 405, "Method Not Allowed", null);
            return;
        }

        try {
            if ((PREFIX + "pending").equals(path)) {
                Pending pending = take();
                JSONObject body = new JSONObject();
                if (pending == null) {
                    body.put("query", JSONObject.NULL);
                } else {
                    body.put("query", pending.query);
                    body.put("id", pending.id);
                }
                respond(out, 200, "OK", body);
                if (pending != null && listener != null) listener.onDelivered();
            } else if ((PREFIX + "ping").equals(path)) {
                JSONObject body = new JSONObject();
                body.put("ok", true);
                body.put("app", "lampa-voice");
                body.put("version", version);
                respond(out, 200, "OK", body);
            } else {
                respond(out, 404, "Not Found", null);
            }
        } catch (JSONException e) {
            respond(out, 500, "Internal Server Error", null);
        }
    }

    /** Заголовки запроса до пустой строки; {@code null}, если клиент прислал мусор или слишком много. */
    private static String readHead(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream(512);
        int matched = 0;
        final byte[] end = {'\r', '\n', '\r', '\n'};
        while (buffer.size() < MAX_HEADER_BYTES) {
            int b = in.read();
            if (b < 0) return null;
            buffer.write(b);
            matched = b == end[matched] ? matched + 1 : (b == '\r' ? 1 : 0);
            if (matched == end.length) return new String(buffer.toByteArray(), LATIN_1);
        }
        return null;
    }

    private static boolean hostAllowed(String[] lines) {
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i];
            int colon = line.indexOf(':');
            if (colon <= 0) continue;
            if (!line.substring(0, colon).trim().equalsIgnoreCase("host")) continue;
            String host = line.substring(colon + 1).trim().toLowerCase(Locale.ROOT);
            return host.equals("127.0.0.1:" + PORT) || host.equals("localhost:" + PORT);
        }
        return false;
    }

    private static void respond(OutputStream out, int code, String reason, JSONObject body) throws IOException {
        byte[] payload = body == null ? new byte[0] : body.toString().getBytes(UTF_8);
        StringBuilder head = new StringBuilder(384)
                .append("HTTP/1.1 ").append(code).append(' ').append(reason).append("\r\n")
                // Фраза — не секрет, а origin Lampa заранее неизвестен (файл, lampa.mx, зеркала).
                .append("Access-Control-Allow-Origin: *\r\n")
                .append("Access-Control-Allow-Methods: GET, OPTIONS\r\n")
                .append("Access-Control-Allow-Headers: *\r\n")
                // Chromium/WebView: разрешение публичной странице обращаться к localhost (Private Network Access).
                .append("Access-Control-Allow-Private-Network: true\r\n")
                .append("Cache-Control: no-store\r\n")
                .append("Connection: close\r\n")
                .append("Content-Length: ").append(payload.length).append("\r\n");
        if (body != null) head.append("Content-Type: application/json; charset=utf-8\r\n");
        head.append("\r\n");

        out.write(head.toString().getBytes(LATIN_1));
        out.write(payload);
        out.flush();
    }
}
