/**
 * Voice Search v1.0.1
 * Приём голосовых запросов от Android-приложения «Lampa Voice» (папка lampa-voice/).
 *
 * Как это работает:
 *   1. Зажимаешь кнопку микрофона на пульте -> «Lampa Voice» распознаёт фразу
 *      и спрашивает, где искать (Lampa / YouTube / Google).
 *   2. Выбрал Lampa -> приложение кладёт фразу в маленький HTTP-сервер на
 *      127.0.0.1:39876 (живёт ~90 секунд) и выводит Lampa на передний план.
 *   3. Этот плагин забирает фразу (одноразово) и открывает поиск Lampa с ней.
 *
 * Почему опрос localhost, а не intent/deep link: официальный APK Lampa закрытый,
 * и передать ему текст поиска через intent документированного способа нет.
 * Локальный сервер — канал, который мы контролируем целиком.
 *
 * ES5 — совместимость со старыми WebView/ТВ, как и у остальных плагинов репо.
 */
(function () {
    'use strict';

    var ID = 'voice_search';
    var VERSION = '1.0.1';

    /** Должен совпадать с HandoffServer.PORT в APK. */
    var PORT = 39876;
    var BASE = 'http://127.0.0.1:' + PORT + '/lampa-voice/v1/';

    /** Запрос длиннее не принимаем: защита от мусора, Lampa всё равно не ищет по абзацам. */
    var MAX_QUERY = 200;

    /** Частый опрос сразу после старта / возврата в Lampa — чтобы поиск открылся без заметной паузы. */
    var BURST = [0, 300, 800, 1500, 3000, 5000];

    /** Не перезапускать всплеск, если focus и visibilitychange пришли подряд. */
    var BURST_DEBOUNCE = 400;

    var XHR_TIMEOUT = 1500;

    /** Если транспорт так и не вызвал колбэк — через столько мс разрешаем новый запрос. */
    var BUSY_LIMIT = 5000;

    var lastId = '';
    var busySince = 0;
    var lastBurstAt = 0;
    var burstTimers = [];
    var xhrBlocked = false;

    /* ------------------------------------------------------------------ *
     * Окружение и настройки
     * ------------------------------------------------------------------ */

    /** Приложение Lampa Voice существует только на Android и открывает Android APK Lampa. */
    function isAndroid() {
        return typeof AndroidJS !== 'undefined' ||
            Boolean(window.Lampa && Lampa.Platform && typeof Lampa.Platform.is === 'function' && Lampa.Platform.is('android'));
    }

    function hasNative() {
        return typeof AndroidJS !== 'undefined' && Boolean(window.Lampa && Lampa.Reguest);
    }

    function isHttps() {
        return Boolean(window.location && window.location.protocol === 'https:');
    }

    function canUseXhr() {
        if (xhrBlocked) return false;
        // С HTTPS запрос на http://127.0.0.1 блокируется как mixed content и спамит ошибками;
        // при наличии AndroidJS сразу идём через нативный HTTP-клиент.
        if (isHttps() && hasNative()) return false;
        return true;
    }

    function key(name) {
        return ID + '_' + name;
    }

    function get(name, def) {
        return Lampa.Storage.get(key(name), def);
    }

    function enabled() {
        var value = get('enabled', true);
        return value === true || value === 'true';
    }

    /* ------------------------------------------------------------------ *
     * Транспорт
     * ------------------------------------------------------------------ */

    function parse(data) {
        if (data && typeof data === 'object') return data;
        if (typeof data !== 'string' || !data) return null;
        try {
            return JSON.parse(data);
        }
        catch (e) {
            return null;
        }
    }

    /**
     * Обычный XHR. Используется на HTTP/file-страницах, если не заблокирован WebView.
     */
    function viaXhr(url, ok, fail) {
        var done = false;
        var xhr;

        function finish(cb, arg) {
            if (done) return;
            done = true;
            cb(arg);
        }

        try {
            xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = XHR_TIMEOUT;
            xhr.onload = function () {
                var json = xhr.status === 200 ? parse(xhr.responseText) : null;
                if (json) finish(ok, json);
                else finish(fail);
            };
            xhr.onerror = function () { finish(fail); };
            xhr.ontimeout = function () { finish(fail); };
            xhr.send();
        }
        catch (e) {
            xhrBlocked = true;
            finish(fail);
        }
    }

    /**
     * Нативный запрос через AndroidJS (HTTP-клиент внутри APK Lampa).
     * Обходит ограничения WebView для http://127.0.0.1 (mixed content / Local Network Access).
     */
    function viaNative(url, ok, fail) {
        if (!hasNative()) return fail();

        try {
            var network = new Lampa.Reguest();
            network.timeout(XHR_TIMEOUT);
            network.native(url, function (data) {
                var json = parse(data);
                if (json) ok(json);
                else fail();
            }, function () {
                fail();
            }, false, { dataType: 'text' });
        }
        catch (e) {
            fail();
        }
    }

    function request(url, ok, fail) {
        if (!canUseXhr()) {
            viaNative(url, ok, fail);
            return;
        }

        viaXhr(url, ok, function () {
            if (!hasNative()) return fail();

            viaNative(url, function (json) {
                // Нативный клиент достучался, а XHR нет — значит XHR заблокирован политикой WebView.
                xhrBlocked = true;
                ok(json);
            }, fail);
        });
    }

    /* ------------------------------------------------------------------ *
     * Открытие поиска
     * ------------------------------------------------------------------ */

    function clean(query) {
        return String(query || '')
            .replace(/[\u0000-\u001f\u007f]+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^\s+|\s+$/g, '')
            .slice(0, MAX_QUERY);
    }

    function openSearch(query) {
        try {
            if (Lampa.Player && Lampa.Player.opened && Lampa.Player.opened()) Lampa.Player.close();
        }
        catch (e) {}

        try {
            // Поиск уже открыт: закрываем, иначе Search.open() наложит второй экземпляр.
            if (document.body.classList.contains('search--open') && Lampa.Search.close) Lampa.Search.close();
        }
        catch (e) {}

        Lampa.Search.open({ input: query });
    }

    function handle(data) {
        if (!data || typeof data.query !== 'string') return false;

        var id = typeof data.id === 'string' ? data.id : '';
        if (id && id === lastId) return false;

        var query = clean(data.query);
        if (!query) return false;

        lastId = id;
        stopBurst();

        console.log('Voice Search', 'query:', query);
        openSearch(query);
        return true;
    }

    /** Одна попытка забрать фразу. */
    function poll() {
        var now = Date.now();
        if (now - busySince < BUSY_LIMIT || !enabled() || !window.appready) return;
        if (!canUseXhr() && !hasNative()) {
            stopBurst();
            return;
        }
        busySince = now;

        var url = BASE + 'pending?_=' + now;

        function release() {
            busySince = 0;
        }

        request(url, function (json) {
            release();
            handle(json);
        }, release);
    }

    function stopBurst() {
        for (var i = 0; i < burstTimers.length; i++) clearTimeout(burstTimers[i]);
        burstTimers = [];
    }

    function burst() {
        if (!enabled()) return;
        var now = Date.now();
        if (burstTimers.length && now - lastBurstAt < BURST_DEBOUNCE) return;
        lastBurstAt = now;

        stopBurst();
        for (var i = 0; i < BURST.length; i++) {
            burstTimers.push(setTimeout(poll, BURST[i]));
        }
    }

    /* ------------------------------------------------------------------ *
     * Проверка связи (кнопка в настройках)
     * ------------------------------------------------------------------ */

    function ping() {
        if (!isAndroid()) {
            Lampa.Noty.show('Lampa Voice работает только в приложении Lampa для Android');
            return;
        }

        var url = BASE + 'ping?_=' + Date.now();

        function ok(json) {
            if (json && json.ok) Lampa.Noty.show('Lampa Voice на связи, версия ' + (json.version || '?'));
            else Lampa.Noty.show('Lampa Voice ответил что-то странное');
        }

        function fail() {
            Lampa.Noty.show('Нет связи. Сервер Lampa Voice живёт ~90 с после голосового запроса — ' +
                'скажите фразу, выберите Lampa и проверьте снова');
        }

        request(url, ok, fail);
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: 'Голосовой поиск',
            icon: '<svg viewBox="0 0 24 31" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<rect x="5" width="14" height="23" rx="7" fill="currentColor"/>' +
                '<path d="M2 19c2 5 6 7 10 7s8-2 10-7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
                '<rect x="10" y="25" width="4" height="6" rx="2" fill="currentColor"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('enabled'), type: 'trigger', default: true },
            field: {
                name: 'Принимать запросы от Lampa Voice',
                description: 'Фраза, сказанная в системное голосовое меню, сразу открывает поиск Lampa'
            }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('ping'), type: 'button' },
            field: {
                name: 'Проверить связь',
                description: 'Порт 127.0.0.1:' + PORT
            },
            onChange: ping
        });
    }

    /* ------------------------------------------------------------------ *
     * Старт
     * ------------------------------------------------------------------ */

    function start() {
        if (window.__voice_search_ready) return;
        window.__voice_search_ready = true;

        try {
            addSettings();
        }
        catch (error) {
            console.log('Voice Search', 'settings error', error);
        }

        if (isAndroid()) {
            // Возврат в Lampa из «Lampa Voice»: страница снова видима / окно в фокусе.
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden) burst();
            });
            window.addEventListener('focus', burst);
            window.addEventListener('pageshow', burst);

            // Холодный старт: Lampa могла быть запущена самим «Lampa Voice».
            burst();
        }

        Lampa.Manifest.plugins = {
            type: 'other',
            version: VERSION,
            name: 'Voice Search',
            description: 'Поиск в Lampa из системного голосового меню Android (нужно приложение Lampa Voice)'
        };
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
