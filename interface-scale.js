/**
 * Interface Scale & Overscan v1.0.0
 * Плагин для Lampa: масштабирование интерфейса (50%–150%, шаг 5%) и настройка
 * отступов по краям экрана (overscan / safe area) для телевизоров, которые
 * обрезают края изображения.
 *
 * Как это работает:
 *   1. Масштаб: Lampa строит весь интерфейс в единицах em от font-size тега body
 *      (база в Lampa: Math.max(width / 84.17, 10.6) px). Плагин вычисляет базовый
 *      размер от ширины рабочей области и умножает на выбранный процент 50%–150%.
 *   2. Отступы по краям (overscan): сжимает body до безопасной области и задаёт
 *      transform: translate3d(0, 0, 0), делая body containing block для всех
 *      position: fixed элементов (шапка, настройки, меню, модалки, поиск,
 *      уведомления, плеер). Обёртка над Lampa.Layer.update подгоняет размеры
 *      .layer--width / .layer--height / .layer--wheight под безопасную область.
 *
 * ES5 — совместимость со старыми WebOS, Tizen и Android WebView.
 */
(function () {
    'use strict';

    var ID = 'interface_scale';
    var VERSION = '1.0.0';

    var STYLE_ID = 'interface-scale-style';
    var FRAME_ID = 'interface-scale-frame';

    var SCALE_MIN = 50;
    var SCALE_MAX = 150;
    var SCALE_STEP = 5;
    var DEFAULT_SCALE = '100%';

    var MARGIN_MAX = 10;
    var MARGIN_STEPS = 20; // 0..10% с шагом 0.5%
    var DEFAULT_MARGIN = '0%';

    /** Длительность автоматического показа рамки при изменении отступов (мс). */
    var FLASH_DURATION = 3000;

    var LAYOUT_STORAGE_KEYS = {
        interface_size: true,
        menu_always: true,
        light_version: true
    };

    var resizeTimer = null;
    var layoutTimer = null;
    var flashTimer = null;
    var flashVisible = false;
    var layerPatched = false;
    var origLayerUpdate = null;

    /* ------------------------------------------------------------------ *
     * Списки значений (нечисловые ключи — чтобы JS не пересортировал порядок)
     * ------------------------------------------------------------------ */

    function buildScaleValues() {
        var map = {};

        for (var v = SCALE_MIN; v <= SCALE_MAX; v += SCALE_STEP) {
            var label = v + '%';
            map[label] = label;
        }

        return map;
    }

    function buildMarginValues(withAuto) {
        var map = {};

        if (withAuto) map.auto = 'Как общий';

        for (var i = 0; i <= MARGIN_STEPS; i++) {
            var num = (i * 5) / 10;
            var label = num + '%';
            map[label] = label;
        }

        return map;
    }

    var SCALE_VALUES = buildScaleValues();
    var MARGIN_ALL_VALUES = buildMarginValues(false);
    var MARGIN_SIDE_VALUES = buildMarginValues(true);

    /* ------------------------------------------------------------------ *
     * Настройки (Storage)
     * ------------------------------------------------------------------ */

    function key(name) {
        return ID + '_' + name;
    }

    function get(name, def) {
        return Lampa.Storage.get(key(name), def);
    }

    function getBool(name, def) {
        var val = get(name, def);

        if (val === true || val === 'true') return true;
        if (val === false || val === 'false') return false;

        return !!def;
    }

    function clamp(num, min, max) {
        if (isNaN(num)) return min;
        if (num < min) return min;
        if (num > max) return max;
        return num;
    }

    function parseScale(raw) {
        var num = parseFloat(raw);
        if (isNaN(num)) return 100;
        return clamp(num, SCALE_MIN, SCALE_MAX);
    }

    function parseMargin(raw, fallback) {
        if (raw === 'auto' || raw === '' || raw === null || typeof raw === 'undefined') {
            return fallback;
        }

        var num = parseFloat(raw);
        if (isNaN(num)) return fallback;
        return clamp(num, 0, MARGIN_MAX);
    }

    function readState() {
        var all = parseMargin(get('margin_all', DEFAULT_MARGIN), 0);

        return {
            scale: parseScale(get('scale', DEFAULT_SCALE)),
            top: parseMargin(get('margin_top', 'auto'), all),
            right: parseMargin(get('margin_right', 'auto'), all),
            bottom: parseMargin(get('margin_bottom', 'auto'), all),
            left: parseMargin(get('margin_left', 'auto'), all),
            showFrame: getBool('show_frame', false),
            overscanPlayer: getBool('overscan_player', true)
        };
    }

    /* ------------------------------------------------------------------ *
     * Расчёт метрик экрана и безопасной области
     * ------------------------------------------------------------------ */

    function calcMetrics(state) {
        var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
        var vh = window.innerHeight || document.documentElement.clientHeight || 720;

        var topPx = Math.round(vh * state.top / 100);
        var bottomPx = Math.round(vh * state.bottom / 100);
        var leftPx = Math.round(vw * state.left / 100);
        var rightPx = Math.round(vw * state.right / 100);

        // Защита от вырожденного окна на слишком маленьких экранах
        var minW = Math.min(vw, 320);
        var minH = Math.min(vh, 200);

        if (vw - leftPx - rightPx < minW) {
            var maxHInset = Math.max(0, vw - minW);
            var hSum = leftPx + rightPx || 1;
            leftPx = Math.round(maxHInset * (leftPx / hSum));
            rightPx = maxHInset - leftPx;
        }

        if (vh - topPx - bottomPx < minH) {
            var maxVInset = Math.max(0, vh - minH);
            var vSum = topPx + bottomPx || 1;
            topPx = Math.round(maxVInset * (topPx / vSum));
            bottomPx = maxVInset - topPx;
        }

        var safeW = vw - leftPx - rightPx;
        var safeH = vh - topPx - bottomPx;
        var hasOverscan = topPx > 0 || bottomPx > 0 || leftPx > 0 || rightPx > 0;

        // Базовая формула Lampa: Math.max(width / 84.17, 10.6), затем масштаб 50%..150%.
        // Базу берём от ширины безопасной области, чтобы сетка 84.17em сохраняла пропорции.
        var baseFull = Math.max(vw / 84.17, 10.6);
        var baseSafe = Math.max((hasOverscan ? safeW : vw) / 84.17, 10.6);
        var factor = state.scale / 100;

        return {
            vw: vw,
            vh: vh,
            topPx: topPx,
            rightPx: rightPx,
            bottomPx: bottomPx,
            leftPx: leftPx,
            safeW: safeW,
            safeH: safeH,
            hasOverscan: hasOverscan,
            fontSizeFull: Math.max(baseFull * factor, 5),
            fontSizeSafe: Math.max(baseSafe * factor, 5)
        };
    }

    function isOverscanActiveNow(state, metrics) {
        if (!metrics.hasOverscan) return false;
        if (!state.overscanPlayer && document.body && document.body.classList.contains('player--viewing')) {
            return false;
        }
        return true;
    }

    /* ------------------------------------------------------------------ *
     * Применение CSS и калибровочной рамки
     * ------------------------------------------------------------------ */

    function ensureStyleEl() {
        var el = document.getElementById(STYLE_ID);

        if (!el) {
            el = document.createElement('style');
            el.id = STYLE_ID;
            el.type = 'text/css';
            (document.head || document.documentElement).appendChild(el);
        }

        return el;
    }

    function buildCss(state, m) {
        var rules = [];

        rules.push(
            'html body { font-size: ' + m.fontSizeSafe.toFixed(2) + 'px !important; }'
        );

        if (m.hasOverscan && !state.overscanPlayer) {
            rules.push(
                'html body.player--viewing { font-size: ' + m.fontSizeFull.toFixed(2) + 'px !important; }'
            );
        }

        if (m.hasOverscan) {
            var bodySel = state.overscanPlayer ? 'html body' : 'html body:not(.player--viewing)';

            rules.push(
                'html {' +
                ' background: #000 !important;' +
                ' overflow: hidden !important;' +
                ' width: 100% !important;' +
                ' height: 100% !important;' +
                '}'
            );

            rules.push(
                bodySel + ' {' +
                ' position: fixed !important;' +
                ' top: ' + m.topPx + 'px !important;' +
                ' left: ' + m.leftPx + 'px !important;' +
                ' right: auto !important;' +
                ' bottom: auto !important;' +
                ' width: ' + m.safeW + 'px !important;' +
                ' height: ' + m.safeH + 'px !important;' +
                ' margin: 0 !important;' +
                ' padding: 0 !important;' +
                ' overflow: hidden !important;' +
                ' -webkit-transform: translate3d(0, 0, 0) !important;' +
                ' transform: translate3d(0, 0, 0) !important;' +
                '}'
            );
        }

        // Стили калибровочной рамки границ экрана
        rules.push(
            '#' + FRAME_ID + ' {' +
            ' position: fixed;' +
            ' top: 0; left: 0; right: 0; bottom: 0;' +
            ' pointer-events: none;' +
            ' z-index: 99999;' +
            ' box-sizing: border-box;' +
            ' border: 2px solid #00e5ff;' +
            ' box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.75);' +
            '}' +
            '#' + FRAME_ID + ' .is-corner {' +
            ' position: absolute;' +
            ' width: 24px; height: 24px;' +
            ' border-color: #ffea00;' +
            ' border-style: solid;' +
            ' border-width: 0;' +
            '}' +
            '#' + FRAME_ID + ' .is-corner--tl { top: 0; left: 0; border-top-width: 4px; border-left-width: 4px; }' +
            '#' + FRAME_ID + ' .is-corner--tr { top: 0; right: 0; border-top-width: 4px; border-right-width: 4px; }' +
            '#' + FRAME_ID + ' .is-corner--bl { bottom: 0; left: 0; border-bottom-width: 4px; border-left-width: 4px; }' +
            '#' + FRAME_ID + ' .is-corner--br { bottom: 0; right: 0; border-bottom-width: 4px; border-right-width: 4px; }' +
            '#' + FRAME_ID + ' .is-badge {' +
            ' position: absolute;' +
            ' bottom: 14px; left: 50%;' +
            ' -webkit-transform: translateX(-50%);' +
            ' transform: translateX(-50%);' +
            ' background: rgba(0, 0, 0, 0.85);' +
            ' color: #fff;' +
            ' border: 1px solid rgba(0, 229, 255, 0.75);' +
            ' border-radius: 6px;' +
            ' padding: 6px 14px;' +
            ' font-size: 14px;' +
            ' line-height: 1.3;' +
            ' white-space: nowrap;' +
            '}'
        );

        return rules.join('\n');
    }

    function updateFrame(state) {
        var visible = state.showFrame || flashVisible;
        var el = document.getElementById(FRAME_ID);

        if (!visible) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            return;
        }

        if (!el && document.body) {
            el = document.createElement('div');
            el.id = FRAME_ID;
            el.innerHTML =
                '<div class="is-corner is-corner--tl"></div>' +
                '<div class="is-corner is-corner--tr"></div>' +
                '<div class="is-corner is-corner--bl"></div>' +
                '<div class="is-corner is-corner--br"></div>' +
                '<div class="is-badge"></div>';
            document.body.appendChild(el);
        }

        if (el) {
            var badge = el.querySelector('.is-badge');

            if (badge) {
                badge.textContent =
                    'Масштаб ' + state.scale + '%  ·  Отступы: ' +
                    'В ' + state.top + '% / П ' + state.right + '% / Н ' + state.bottom + '% / Л ' + state.left + '%';
            }
        }
    }

    function flashFrame() {
        flashVisible = true;
        if (flashTimer) clearTimeout(flashTimer);

        flashTimer = setTimeout(function () {
            flashVisible = false;
            flashTimer = null;
            updateFrame(readState());
        }, FLASH_DURATION);
    }

    /* ------------------------------------------------------------------ *
     * Коррекция Lampa.Layer под безопасную область (overscan)
     * ------------------------------------------------------------------ */

    function toNode(el) {
        if (!el) return null;
        if (typeof jQuery !== 'undefined' && el instanceof jQuery) return el[0] || null;
        return el;
    }

    function collectLayerNodes(target, className) {
        var list = Array.prototype.slice.call(target.querySelectorAll('.' + className));

        if (target.classList && target.classList.contains(className)) {
            list.push(target);
        }

        return list;
    }

    function getMHeight(elem) {
        var attr = elem.mheight;

        if (!attr && typeof $ !== 'undefined') {
            try {
                attr = $(elem).data('mheight');
            }
            catch (e) {}
        }

        var node = toNode(attr);
        if (node && node.getBoundingClientRect) {
            return node.getBoundingClientRect().height || 0;
        }

        return 0;
    }

    function fixLayers(where) {
        if (!document.body) return;

        var state = readState();
        var m = calcMetrics(state);
        var active = isOverscanActiveNow(state, m);

        var target = toNode(where) || document.body;
        if (!target || !target.querySelectorAll) target = document.body;

        var availW = active ? m.safeW : m.vw;
        var availH = active ? m.safeH : m.vh;
        var landscape = availW > availH && availH < 768;

        var bodyRect = document.body.getBoundingClientRect();
        var wrap = document.querySelector('.wrap__left');
        var head = document.querySelector('.head');
        var navi = document.querySelector('.navigation-bar');

        var menuLeft = wrap ? wrap.getBoundingClientRect().left : bodyRect.left;
        var menuWidth = wrap ? wrap.getBoundingClientRect().width : 0;
        var headHeight = head ? head.getBoundingClientRect().height : 0;
        var naviHeight = navi && !landscape ? navi.getBoundingClientRect().height : 0;
        var naviWidth = navi && landscape ? navi.getBoundingClientRect().width : 0;

        var menuAlways = document.body.classList.contains('menu--always');
        var isLight = Lampa.Platform && Lampa.Platform.screen && Lampa.Platform.screen('light');
        var menuAtLeft = Math.abs(menuLeft - bodyRect.left) < 2;
        var menuOffset = (isLight && menuAtLeft) ? menuWidth : (menuAlways ? menuWidth : 0);

        var layerWidth = collectLayerNodes(target, 'layer--width');
        var layerWHeight = collectLayerNodes(target, 'layer--wheight');
        var layerHeight = collectLayerNodes(target, 'layer--height');

        var i, elem, val;

        for (i = 0; i < layerWidth.length; i++) {
            elem = layerWidth[i];
            val = Math.max(Math.round(availW - menuOffset - naviWidth), 0);
            if (parseFloat(elem.style.width) !== val) elem.style.width = val + 'px';
        }

        for (i = 0; i < layerWHeight.length; i++) {
            elem = layerWHeight[i];
            val = Math.max(Math.round(availH - headHeight - naviHeight - getMHeight(elem)), 0);
            if (parseFloat(elem.style.height) !== val) elem.style.height = val + 'px';
        }

        for (i = 0; i < layerHeight.length; i++) {
            elem = layerHeight[i];
            val = Math.max(Math.round(availH - getMHeight(elem)), 0);
            if (parseFloat(elem.style.height) !== val) elem.style.height = val + 'px';
        }
    }

    function patchLayer() {
        if (layerPatched || !Lampa.Layer || typeof Lampa.Layer.update !== 'function') return;

        origLayerUpdate = Lampa.Layer.update;
        layerPatched = true;

        Lampa.Layer.update = function (where) {
            var res = origLayerUpdate.apply(this, arguments);

            try {
                var state = readState();
                var m = calcMetrics(state);
                if (m.hasOverscan) fixLayers(where);
            }
            catch (e) {}

            return res;
        };
    }

    /* ------------------------------------------------------------------ *
     * Применение всех параметров
     * ------------------------------------------------------------------ */

    function refreshLayout() {
        try {
            if (Lampa.Layer && typeof Lampa.Layer.update === 'function') {
                Lampa.Layer.update();
            }
            fixLayers(document.body);

            if (Lampa.Layer && typeof Lampa.Layer.visible === 'function') {
                Lampa.Layer.visible();
            }
        }
        catch (e) {}
    }

    function apply(showFlash) {
        var state = readState();
        var m = calcMetrics(state);

        ensureStyleEl().textContent = buildCss(state, m);

        if (showFlash) flashFrame();
        updateFrame(state);

        refreshLayout();

        // Повторный пересчёт после перерисовки браузера (когда .head примет новую высоту em)
        if (layoutTimer) clearTimeout(layoutTimer);
        layoutTimer = setTimeout(function () {
            layoutTimer = null;
            refreshLayout();

            try {
                if (document.body && document.body.classList.contains('settings--open') &&
                    Lampa.Params && Lampa.Params.listener) {
                    Lampa.Params.listener.send('update_scroll_position');
                }
            }
            catch (e) {}
        }, 60);
    }

    function scheduleResizeApply() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            apply(false);
        }, 140);
    }

    function resetAll() {
        Lampa.Storage.set(key('scale'), DEFAULT_SCALE);
        Lampa.Storage.set(key('margin_all'), DEFAULT_MARGIN);
        Lampa.Storage.set(key('margin_top'), 'auto');
        Lampa.Storage.set(key('margin_bottom'), 'auto');
        Lampa.Storage.set(key('margin_left'), 'auto');
        Lampa.Storage.set(key('margin_right'), 'auto');
        Lampa.Storage.set(key('show_frame'), false);
        Lampa.Storage.set(key('overscan_player'), true);

        flashVisible = false;
        if (flashTimer) {
            clearTimeout(flashTimer);
            flashTimer = null;
        }

        apply(false);

        try {
            if (Lampa.Settings && typeof Lampa.Settings.update === 'function') {
                Lampa.Settings.update();
            }
        }
        catch (e) {}

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('Масштаб и отступы сброшены');
        }
    }

    /* ------------------------------------------------------------------ *
     * Настройки в меню Lampa
     * ------------------------------------------------------------------ */

    var SETTINGS_ICON =
        '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="3" y="5" width="30" height="22" rx="3" stroke="currentColor" stroke-width="2.6"/>' +
        '<path d="M12 31h12M18 27v4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M8 13V10h3M25 10h3v3M8 19v3h3M25 22h3v-3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: 'Масштаб и отступы',
            icon: SETTINGS_ICON
        });

        function addSelect(name, def, values, title, description, isMargin) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key(name), type: 'select', values: values, default: def },
                field: { name: title, description: description },
                onChange: function () {
                    apply(!!isMargin);
                }
            });
        }

        function addTrigger(name, def, title, description) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key(name), type: 'trigger', default: def },
                field: { name: title, description: description },
                onChange: function () {
                    apply(false);
                }
            });
        }

        function addTitle(idSuffix, title) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key('title_' + idSuffix), type: 'title' },
                field: { name: title }
            });
        }

        addSelect(
            'scale',
            DEFAULT_SCALE,
            SCALE_VALUES,
            'Масштаб интерфейса',
            'От 50% до 150% с шагом 5%. Переопределяет стандартный размер интерфейса Lampa',
            false
        );

        addTitle('overscan', 'Отступы по краям экрана (Overscan)');

        addSelect(
            'margin_all',
            DEFAULT_MARGIN,
            MARGIN_ALL_VALUES,
            'Общий отступ по краям',
            'Сдвигает интерфейс от всех четырёх сторон — для телевизоров, которые обрезают края экрана',
            true
        );

        addSelect('margin_top', 'auto', MARGIN_SIDE_VALUES, 'Отступ сверху', 'Отдельно для верхнего края', true);
        addSelect('margin_bottom', 'auto', MARGIN_SIDE_VALUES, 'Отступ снизу', 'Отдельно для нижнего края', true);
        addSelect('margin_left', 'auto', MARGIN_SIDE_VALUES, 'Отступ слева', 'Отдельно для левого края', true);
        addSelect('margin_right', 'auto', MARGIN_SIDE_VALUES, 'Отступ справа', 'Отдельно для правого края', true);

        addTitle('calibration', 'Калибровка и поведение');

        addTrigger(
            'show_frame',
            false,
            'Показать рамку границ',
            'Отображать яркую рамку по краям рабочей области для точной подгонки под экран ТВ'
        );

        addTrigger(
            'overscan_player',
            true,
            'Отступы в плеере',
            'Применять отступы и во время просмотра видео (если ТВ обрезает плеер и субтитры)'
        );

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('reset'), type: 'button' },
            field: {
                name: 'Сбросить настройки',
                description: 'Вернуть масштаб 100% и убрать все отступы по краям'
            },
            onChange: resetAll
        });
    }

    /* ------------------------------------------------------------------ *
     * Старт
     * ------------------------------------------------------------------ */

    function start() {
        if (window.__interface_scale_ready) return;
        window.__interface_scale_ready = true;

        patchLayer();
        apply(false);

        try {
            addSettings();
        }
        catch (error) {
            console.log('Interface Scale', 'settings error', error);
        }

        window.addEventListener('resize', scheduleResizeApply);
        window.addEventListener('orientationchange', scheduleResizeApply);

        Lampa.Listener.follow('resize_end', function () {
            apply(false);
        });

        if (Lampa.Storage && Lampa.Storage.listener) {
            Lampa.Storage.listener.follow('change', function (e) {
                if (!e || !e.name) return;

                if (LAYOUT_STORAGE_KEYS[e.name]) {
                    apply(false);
                }
            });
        }

        if (Lampa.Player && Lampa.Player.listener) {
            Lampa.Player.listener.follow('start', function () {
                setTimeout(refreshLayout, 50);
            });
            Lampa.Player.listener.follow('destroy', function () {
                setTimeout(refreshLayout, 50);
            });
        }

        Lampa.Manifest.plugins = {
            type: 'other',
            version: VERSION,
            name: 'Interface Scale',
            description: 'Масштабирование интерфейса (50%–150%) и настройка отступов по краям экрана (overscan)'
        };
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
