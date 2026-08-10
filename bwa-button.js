/**
 * BWA Button v3.1.0
 * Кнопка-ярлык в карточке фильма для запуска плагина BwaRC (bwa.ad/rc).
 *
 * Логика выбора источника:
 *   1. Для карточки уже сохранён балансер в online_last_balanser -> не трогаем,
 *      BwaRC возьмёт его сам.
 *   2. Не сохранён -> пишем в online_balanser значение по типу контента
 *      (аниме -> animebesst, остальное -> filmix), BwaRC подхватит его как фолбэк.
 *
 * Написано под BwaRC 1.7.1. ES5 — совместимость с WebOS 3–4 и Tizen 2.4.
 */
(function () {
    'use strict';

    var ID = 'bwa_button';
    var VERSION = '3.1.0';

    /** Компонент BwaRC: Lampa.Component.add('bwarch', component). */
    var COMPONENT = 'bwarch';

    /** Родная кнопка BwaRC в карточке. */
    var NATIVE_BUTTON = '.lampac--button';

    /** Ключи BwaRC, с которыми работаем. */
    var K_LAST = 'online_last_balanser';   // { [movie.id]: 'balanser' } — приоритетный
    var K_GLOBAL = 'online_balanser';      // 'balanser' — фолбэк

    /**
     * Источники BwaRC — строки из balansers_sync в rc.js
     * (сервер отдаёт их как balanser || name.split(' ')[0] в нижнем регистре).
     */
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
        play: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 4.5v15l13-7.5-13-7.5z" fill="currentColor"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 18h10a4 4 0 000-8 6 6 0 00-11.6 1.5A3.5 3.5 0 007 18z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
        monitor: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        bolt: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor"/></svg>',
        star: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z" fill="currentColor"/></svg>'
    };

    var ICON_NAMES = {
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
        // Тот же признак, что BwaRC шлёт на сервер параметром anime=1.
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
     * BwaRC.startSource():
     *   online_last_balanser[movie.id]  ->  online_balanser  ->  filter_sources[0]
     *
     * Поэтому для «источника по умолчанию» достаточно записать online_balanser:
     * если у карточки есть своя запись, она перебьёт наш фолбэк автоматически.
     * Историю не читаем на запись и не мутируем — только смотрим, есть ли запись.
     * ------------------------------------------------------------------ */

    function savedSource(movie) {
        var last = Lampa.Storage.get(K_LAST, '{}');
        return last[movie.id] || '';
    }

    function applySource(movie) {
        var saved = savedSource(movie);
        var force = get('force', false);

        if (saved && !force) return saved;

        var type = detectType(movie);
        var fallback = get('src_' + type, DEFAULTS[type] || '');

        if (!fallback) return saved;

        Lampa.Storage.set(K_GLOBAL, fallback);

        // Принудительный режим: перебиваем и персональную запись карточки.
        if (force && saved) {
            var last = Lampa.Storage.get(K_LAST, '{}');
            last[movie.id] = fallback;
            Lampa.Storage.set(K_LAST, last);
        }

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
     * Прямой push. Повторяет то, что делает сам BwaRC, включая clarification_search.
     * object.balanser НЕ передаём: в BwaRC он включает режим прямой ссылки
     * (требует object.url) и ломает обычный поиск.
     * lampac_custom_select не даёт сбросить источник, помеченный сервером как show:false.
     */
    function push(movie, source) {
        var hash = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
        var clarification = Lampa.Storage.get('clarification_search', '{}');

        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: COMPONENT,
            search: clarification[hash] ? clarification[hash] : movie.title,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            clarification: clarification[hash] ? true : false,
            lampac_custom_select: source || undefined
        });
    }

    function open(render, movie) {
        if (!window.bwarch_plugin) {
            Lampa.Noty.show('Плагин BwaRC не установлен или не загрузился');
            return;
        }

        var source = applySource(movie);

        // Совместимый режим: BwaRC перед запуском вызывает resetTemplates(),
        // восстанавливая свои шаблоны, если их перетёр другой lampac-совместимый плагин.
        if (get('mode', 'native') === 'native') {
            var native = nativeButton(render);

            if (native) {
                native.trigger('hover:enter');
                return;
            }
        }

        push(movie, source);
    }

    /* ------------------------------------------------------------------ *
     * Кнопка
     * ------------------------------------------------------------------ */

    function buildIcon() {
        var name = get('icon', 'play');

        if (name === 'custom') {
            var custom = (get('icon_custom', '') || '').trim();

            if (custom.indexOf('<svg') === 0) return custom;
            if (custom) return '<img src="' + custom.replace(/"/g, '&quot;') + '" />';
        }

        return ICONS[name] || ICONS.play;
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
        button.find('span').text(get('title', 'BWA'));

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
        param('title', 'input', 'BWA', 'Текст кнопки');
        param('icon', 'select', 'play', 'Иконка', '', ICON_NAMES);
        param('icon_custom', 'input', '', 'Своя иконка', 'Вставьте <svg>…</svg> или ссылку на картинку');
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

        addSettings();

        Lampa.Manifest.plugins = {
            type: 'other',
            version: VERSION,
            name: 'BWA Button',
            description: 'Кнопка быстрого запуска BwaRC с выбором источника по типу контента'
        };

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
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
