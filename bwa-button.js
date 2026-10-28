/**
 * BWA Button v3.2.0
 * Кнопка-ярлык в карточке фильма для запуска плагина BWA Online (bwa.ad/rc).
 *
 * Логика выбора источника:
 *   1. Для карточки уже сохранён балансер в bwa_title_src -> не трогаем,
 *      BWA возьмёт его сам.
 *   2. Не сохранён -> пишем в bwa_title_src[movie.id] значение по типу контента
 *      (аниме -> animevost, остальное -> filmix).
 *
 * Написано под BWA 2.27.34. ES5 — совместимость с WebOS 3–4 и Tizen 2.4.
 */
(function () {
    'use strict';

    var ID = 'bwa_button';
    var VERSION = '3.2.0';

    /** Компонент BWA: Lampa.Component.add('bwa_online', component). */
    var COMPONENT = 'bwa_online';

    /** Родная кнопка BWA в карточке. */
    var NATIVE_BUTTON = '.view--bwa';

    /** Ключ BWA: { [movie.id]: 'balanser' } — источник, выбранный для карточки. */
    var K_LAST = 'bwa_title_src';

    /** Источники BWA — поле balanser из ответа сервера /lite/events. */
    var SOURCES = {
        filmix: 'Filmix',
        collaps: 'Collaps',
        hdvb: 'HDVB',
        kodik: 'Kodik',
        remux: 'Remux',
        eneyida: 'Eneyida (UA)',
        kinoukr: 'KinoUkr (UA)',
        uafilm: 'UAFilm (UA)',
        uakino: 'UAKino (UA)',
        animebesst: 'AnimeBesst',
        anilibria: 'Anilibria',
        animedia: 'Animedia',
        animego: 'AnimeGo',
        animevost: 'Animevost',
        animelib: 'AnimeLib',
        moonanime: 'MoonAnime',
        kinogo: 'Kinogo'
    };

    /** Источник по умолчанию для каждого типа контента. */
    var DEFAULTS = {
        movie: 'filmix',
        serial: 'filmix',
        cartoon: 'filmix',
        cartoon_serial: 'filmix',
        anime: 'animevost'
    };

    /* ------------------------------------------------------------------ *
     * Иконки
     * ------------------------------------------------------------------ */

    var ICONS = {
        trailer: '<svg><use xlink:href="#sprite-trailer"></use></svg>',
        tv: '<svg><use xlink:href="#sprite-tv"></use></svg>',
        hd: '<svg><use xlink:href="#sprite-hd"></use></svg>',
        anime: '<svg><use xlink:href="#sprite-anime"></use></svg>',
        movie: '<svg><use xlink:href="#sprite-movie"></use></svg>',
        online: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 392.697 392.697"><path d="M21.837,83.419l36.496,16.678L227.72,19.886c1.229-0.592,2.002-1.846,1.98-3.209c-0.021-1.365-0.834-2.592-2.082-3.145L197.766,0.3c-0.903-0.4-1.933-0.4-2.837,0L21.873,77.036c-1.259,0.559-2.073,1.803-2.081,3.18C19.784,81.593,20.584,82.847,21.837,83.419z" fill="currentColor"/><path d="M185.689,177.261l-64.988-30.01v91.617c0,0.856-0.44,1.655-1.167,2.114c-0.406,0.257-0.869,0.386-1.333,0.386c-0.368,0-0.736-0.082-1.079-0.244l-68.874-32.625c-0.869-0.416-1.421-1.293-1.421-2.256v-92.229L6.804,95.5c-1.083-0.496-2.344-0.406-3.347,0.238c-1.002,0.645-1.608,1.754-1.608,2.944v208.744c0,1.371,0.799,2.615,2.045,3.185l178.886,81.768c0.464,0.211,0.96,0.315,1.455,0.315c0.661,0,1.318-0.188,1.892-0.555c1.002-0.645,1.608-1.754,1.608-2.945V180.445C187.735,179.076,186.936,177.831,185.689,177.261z" fill="currentColor"/><path d="M389.24,95.74c-1.002-0.644-2.264-0.732-3.347-0.238l-178.876,81.76c-1.246,0.57-2.045,1.814-2.045,3.185v208.751c0,1.191,0.606,2.302,1.608,2.945c0.572,0.367,1.23,0.555,1.892,0.555c0.495,0,0.991-0.104,1.455-0.315l178.876-81.768c1.246-0.568,2.045-1.813,2.045-3.185V98.685C390.849,97.494,390.242,96.384,389.24,95.74z" fill="currentColor"/><path d="M372.915,80.216c-0.009-1.377-0.823-2.621-2.082-3.18l-60.182-26.681c-0.938-0.418-2.013-0.399-2.938,0.045l-173.755,82.992l60.933,29.117c0.462,0.211,0.958,0.316,1.455,0.316s0.993-0.105,1.455-0.316l173.066-79.092C372.122,82.847,372.923,81.593,372.915,80.216z" fill="currentColor"/></svg>',
        play: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 4.5v15l13-7.5-13-7.5z" fill="currentColor"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 18h10a4 4 0 000-8 6 6 0 00-11.6 1.5A3.5 3.5 0 007 18z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
        monitor: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        bolt: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor"/></svg>',
        star: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z" fill="currentColor"/></svg>'
    };

    var ICON_NAMES = {
        trailer: 'Трейлер',
        tv: 'TV',
        hd: 'HD',
        anime: 'Аниме',
        movie: 'Фильм',
        online: 'Онлайн',
        play: 'Треугольник (play)',
        cloud: 'Облако',
        monitor: 'Монитор',
        bolt: 'Молния',
        star: 'Звезда',
        custom: 'Свой SVG / URL картинки'
    };

    /* ------------------------------------------------------------------ *
     * Storage
     * ------------------------------------------------------------------ */

    function key(name) { return ID + '_' + name; }
    function get(name, def) { return Lampa.Storage.get(key(name), def); }

    /* ------------------------------------------------------------------ *
     * Тип контента
     * ------------------------------------------------------------------ */

    function hasGenre(movie, id) {
        var genres = movie.genres || movie.genre_ids || [];

        for (var i = 0; i < genres.length; i++) {
            var g = genres[i];
            if (g === id) return true;
            if (g && typeof g === 'object' && g.id === id) return true;
        }

        return false;
    }

    function isAsian(movie) {
        var lang = movie.original_language;
        if (lang === 'ja' || lang === 'zh' || lang === 'ko') return true;

        var list = [];
        var i;

        if (movie.origin_country) {
            for (i = 0; i < movie.origin_country.length; i++) list.push(movie.origin_country[i]);
        }

        if (movie.production_countries) {
            for (i = 0; i < movie.production_countries.length; i++) {
                list.push(movie.production_countries[i].iso_3166_1);
            }
        }

        for (i = 0; i < list.length; i++) {
            if (list[i] === 'JP' || list[i] === 'CN' || list[i] === 'KR') return true;
        }

        return false;
    }

    function hasAnimeKeyword(movie) {
        // Тот же признак, что старый BwaRC слал на сервер параметром anime=1.
        if (!movie.keywords || !movie.keywords.results) return false;

        for (var i = 0; i < movie.keywords.results.length; i++) {
            if (movie.keywords.results[i].name === 'anime') return true;
        }

        return false;
    }

    function detectType(movie) {
        var serial = !!(movie.number_of_seasons || movie.name);

        if (hasAnimeKeyword(movie)) return 'anime';

        if (hasGenre(movie, 16)) {
            if (isAsian(movie)) return 'anime';
            return serial ? 'cartoon_serial' : 'cartoon';
        }

        return serial ? 'serial' : 'movie';
    }

    /* ------------------------------------------------------------------ *
     * Выбор источника
     *
     * BWA при старте:
     *   bwa_title_src[movie.id]  ->  peregon  ->  bwa_balanser  ->  первый доступный
     *
     * peregon перебивает общий bwa_balanser, поэтому пишем прямо в запись карточки.
     * Если источника для тайтла нет, BWA проигнорирует запись и пойдёт дальше по цепочке.
     * Ручной выбор источника в BWA перезаписывает эту запись.
     * ------------------------------------------------------------------ */

    function applySource(movie) {
        var last = Lampa.Storage.get(K_LAST, '{}') || {};
        var saved = last[movie.id] || '';

        if (saved && !get('force', false)) return saved;

        var type = detectType(movie);
        var fallback = get('src_' + type, DEFAULTS[type] || '');

        if (!fallback) return saved;

        last[movie.id] = fallback;
        Lampa.Storage.set(K_LAST, last);

        return fallback;
    }

    /* ------------------------------------------------------------------ *
     * Запуск
     * ------------------------------------------------------------------ */

    function nativeButton(render) {
        var found = render.find(NATIVE_BUTTON);
        return found.length ? found.eq(0) : null;
    }

    /**
     * Прямой push. Повторяет то, что делает родная кнопка BWA, включая
     * уточнённый поиск из bwa_clarify (ключ 's:<id>' для сериалов, 'm:<id>' для фильмов).
     */
    function push(movie) {
        var serial = movie.name || movie.first_air_date || movie.number_of_seasons || movie.seasons;
        var clarify = (Lampa.Storage.get('bwa_clarify', '{}') || {})[(serial ? 's:' : 'm:') + movie.id] || '';

        Lampa.Activity.push({
            url: '',
            title: 'BWA',
            component: COMPONENT,
            search: clarify || movie.title || movie.name,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            clarification: !!clarify
        });
    }

    function open(render, movie) {
        if (!window.bwa_plugin) {
            Lampa.Noty.show('Плагин BWA не установлен или не загрузился');
            return;
        }

        applySource(movie);

        if (get('mode', 'native') === 'native') {
            var native = nativeButton(render);

            if (native) {
                native.trigger('hover:enter');
                return;
            }
        }

        push(movie);
    }

    /* ------------------------------------------------------------------ *
     * Кнопка
     * ------------------------------------------------------------------ */

    function buildIcon() {
        var name = get('icon', 'trailer');

        if (name === 'custom') {
            var custom = (get('icon_custom', '') || '').trim();

            if (custom.indexOf('<svg') === 0) return custom;
            if (custom) return '<img src="' + custom.replace(/"/g, '&quot;') + '" />';
        }

        return ICONS[name] || ICONS.trailer;
    }

    function attach(render, movie) {
        var box = render.find('.full-start-new__buttons');
        if (!box.length) box = render.find('.full-start__buttons');
        if (!box.length) return;
        if (box.find('.' + ID + '__button').length) return;

        var button = $(
            '<div class="full-start__button selector ' + ID + '__button" data-subtitle="BWA Button v' + VERSION + '">' +
            buildIcon() +
            '<span></span>' +
            '</div>'
        );

        // Текст через .text(): пользовательский ввод не должен попадать в HTML.
        button.find('span').text(get('title', 'Онлайн'));

        button.on('hover:enter', function () {
            open(render, movie);
        });

        if (get('position', 'first') === 'first') box.prepend(button);
        else box.append(button);

        if (get('hide_native', false)) {
            // Скрываем через CSS, а не remove(): в совместимом режиме обработчик ещё нужен.
            var native = nativeButton(box);
            if (native) native.css('display', 'none');
        }
    }

    /* ------------------------------------------------------------------ *
     * Настройки
     * ------------------------------------------------------------------ */

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: 'BWA Кнопка',
            icon: ICONS.bolt
        });

        function param(name, type, def, title, description, values) {
            // Lampa для type:'input' регистрирует param.values через Params.select(),
            // а при отрисовке делает values[name][key]. Если values не задано,
            // это undefined[key] -> TypeError. Строка уводит в ветку «показать как есть».
            if (type === 'input' && typeof values !== 'string') values = 'input';

            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key(name), type: type, values: values, default: def },
                field: { name: title, description: description }
            });
        }

        function separator(title) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key('sep_' + title), type: 'title' },
                field: { name: title }
            });
        }

        param('enabled', 'trigger', true, 'Показывать кнопку');
        param('title', 'input', 'Онлайн', 'Текст кнопки');
        param('icon', 'select', 'trailer', 'Иконка', '', ICON_NAMES);
        param('icon_custom', 'input', '', 'Своя иконка', 'Вставьте &lt;svg&gt;…&lt;/svg&gt; или ссылку на картинку');
        param('position', 'select', 'first', 'Позиция', '', { first: 'Первая', last: 'Последняя' });
        param('hide_native', 'trigger', false, 'Скрыть родную кнопку BWA', 'Чтобы не дублировать');

        separator('Источник по умолчанию');

        param('src_movie', 'select', DEFAULTS.movie, 'Фильмы', '', SOURCES);
        param('src_serial', 'select', DEFAULTS.serial, 'Сериалы', '', SOURCES);
        param('src_anime', 'select', DEFAULTS.anime, 'Аниме', '', SOURCES);
        param('src_cartoon', 'select', DEFAULTS.cartoon, 'Мультфильмы', '', SOURCES);
        param('src_cartoon_serial', 'select', DEFAULTS.cartoon_serial, 'Мультсериалы', '', SOURCES);

        param('force', 'trigger', false, 'Всегда навязывать',
            'По умолчанию источник из истории карточки имеет приоритет. Включите, чтобы всегда использовать источник по типу');

        separator('Дополнительно');

        param('mode', 'select', 'native', 'Способ запуска',
            'Совместимый — клик по родной кнопке BWA. Прямой — своя активность',
            { native: 'Совместимый', push: 'Прямой' });
    }

    /* ------------------------------------------------------------------ *
     * Старт
     * ------------------------------------------------------------------ */

    function start() {
        if (window.__bwa_button_ready) return;
        window.__bwa_button_ready = true;

        // Подписка идёт ПЕРВОЙ: если SettingsApi в этой сборке чего-то не умеет
        // и бросит исключение, кнопка всё равно будет работать.
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            if (!get('enabled', true)) return;

            try {
                attach(e.object.activity.render(), e.data.movie);
            }
            catch (error) {
                // Карточка не должна падать из-за кнопки
                console.log('BWA Button', 'attach error', error);
            }
        });

        // Карточка уже открыта на момент загрузки плагина (перезапуск через консоль).
        try {
            var active = Lampa.Activity.active();

            if (active && active.component === 'full' && active.activity) {
                attach(active.activity.render(), active.card || active.movie);
            }
        }
        catch (error) {}

        try {
            addSettings();
        }
        catch (error) {
            console.log('BWA Button', 'settings error', error);
        }

        Lampa.Manifest.plugins = {
            type: 'other',
            version: VERSION,
            name: 'BWA Button',
            description: 'Кнопка быстрого запуска BWA с выбором источника по типу контента'
        };
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
