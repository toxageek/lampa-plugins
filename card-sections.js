/**
 * Card Sections v1.0.0
 * Плагин для Lampa: управление отображением разделов в карточке фильма/сериала.
 *
 * Позволяет в настройках включать и отключать отдельные разделы карточки
 * (Подробно, Комментарии, Метаданные, Настроения, Выход серий, Режиссёр,
 * Актёры, Коллекция, Рекомендации, Похожие / Подібні).
 *
 * Как это работает:
 *   - В Lampa 3.x перехватывает событие full:start и фильтрует массив e.link.rows
 *     непосредственно перед вызовом e.link.build — отключённые разделы не
 *     создаются в DOM, не грузят картинки и не ломают навигацию пультом.
 *   - В Lampa 2.x перехватывает метод build экземпляра компонента full и
 *     пропускает отключённые разделы без изменения исходного объекта data.
 *   - При изменении настроек, когда открыта карточка фильма, карточка
 *     автоматически обновляется после закрытия меню настроек.
 *
 * ES5 — совместимость со старыми WebOS, Tizen и Android WebView.
 */
(function () {
    'use strict';

    var ID = 'card_sections';
    var VERSION = '1.0.0';

    var dirty = false;
    var refreshTimer = null;

    /**
     * Список управляемых разделов карточки в порядке отображения в Lampa.
     * Главный блок (start: постер, название, кнопки) никогда не отключается.
     */
    var SECTIONS = [
        {
            id: 'description',
            langKey: 'full_detail',
            fallback: 'Подробно',
            descrKey: 'card_sections_descr_description'
        },
        {
            id: 'discuss',
            langKey: 'title_comments',
            fallback: 'Комментарии',
            descrKey: 'card_sections_descr_discuss'
        },
        {
            id: 'metadata_chart',
            langKey: 'title_metadata',
            fallback: 'Метаданные',
            descrKey: 'card_sections_descr_metadata_chart'
        },
        {
            id: 'metadata_tags',
            langKey: 'title_moods',
            fallback: 'Настроения',
            descrKey: 'card_sections_descr_metadata_tags'
        },
        {
            id: 'episodes',
            langKey: 'full_series_release',
            fallback: 'Выход серий',
            descrKey: 'card_sections_descr_episodes'
        },
        {
            id: 'directors',
            langKey: 'title_producer',
            fallback: 'Режиссер',
            descrKey: 'card_sections_descr_directors'
        },
        {
            id: 'actors',
            langKey: 'title_actors',
            fallback: 'Актеры',
            descrKey: 'card_sections_descr_actors'
        },
        {
            id: 'collection',
            langKey: 'title_collection',
            fallback: 'Коллекция',
            descrKey: 'card_sections_descr_collection'
        },
        {
            id: 'recomend',
            langKey: 'title_recomendations',
            fallback: 'Рекомендации',
            descrKey: 'card_sections_descr_recomend'
        },
        {
            id: 'simular',
            langKey: 'title_similar',
            fallback: 'Похожие',
            descrKey: 'card_sections_descr_simular'
        }
    ];

    /* ------------------------------------------------------------------ *
     * Локализация
     * ------------------------------------------------------------------ */

    var TRANSLATIONS = {
        card_sections_title: {
            ru: 'Разделы карточки',
            uk: 'Розділи картки',
            en: 'Card sections',
            be: 'Раздзелы карткі'
        },
        card_sections_manifest_descr: {
            ru: 'Включение и отключение разделов в карточке фильма и сериала',
            uk: 'Увімкнення та вимкнення розділів у картці фільму та серіалу',
            en: 'Enable or disable sections on movie and TV show cards',
            be: 'Уключэнне і адключэнне раздзелаў у картцы фільма і серыяла'
        },
        card_sections_enabled: {
            ru: 'Включить плагин',
            uk: 'Увімкнути плагін',
            en: 'Enable plugin',
            be: 'Уключыць плагін'
        },
        card_sections_enabled_descr: {
            ru: 'Скрывать отключённые ниже разделы в карточке фильма и сериала',
            uk: 'Приховувати вимкнені нижче розділи в картці фільму та серіалу',
            en: 'Hide disabled sections below on movie and TV show cards',
            be: 'Хаваць адключаныя ніжэй раздзелы ў картцы фільма і серыяла'
        },
        card_sections_group_sections: {
            ru: 'Отображаемые разделы',
            uk: 'Відображувані розділи',
            en: 'Visible sections',
            be: 'Раздзелы для паказу'
        },
        card_sections_group_actions: {
            ru: 'Быстрые действия',
            uk: 'Швидкі дії',
            en: 'Quick actions',
            be: 'Хуткія дзеянні'
        },
        card_sections_descr_description: {
            ru: 'Описание, дата выхода, бюджет, страны, жанры и теги',
            uk: 'Опис, дата виходу, бюджет, країни, жанри та теги',
            en: 'Overview, release date, budget, countries, genres and tags',
            be: 'Апісанне, дата выхаду, бюджэт, краіны, жанры і тэгі'
        },
        card_sections_descr_discuss: {
            ru: 'Комментарии и отзывы пользователей',
            uk: 'Коментарі та відгуки користувачів',
            en: 'User comments and reviews',
            be: 'Каментарыі і водгукі карыстальнікаў'
        },
        card_sections_descr_metadata_chart: {
            ru: 'Шкалы метаданных (юмор, напряжение, экшен и др.)',
            uk: 'Шкали метаданих (гумор, напруга, екшен тощо)',
            en: 'Metadata charts (humor, tension, action, etc.)',
            be: 'Шкалы метаданых (гумар, напружанне, экшэн і інш.)'
        },
        card_sections_descr_metadata_tags: {
            ru: 'Теги настроений фильма или сериала',
            uk: 'Теги настроїв фільму або серіалу',
            en: 'Mood tags for the movie or TV show',
            be: 'Тэгі настрояў фільма або серыяла'
        },
        card_sections_descr_episodes: {
            ru: 'Список и расписание выхода серий (для сериалов)',
            uk: 'Список та розклад виходу серій (для серіалів)',
            en: 'Episodes list and release schedule (for TV shows)',
            be: 'Спіс і расклад выхаду серый (для серыялаў)'
        },
        card_sections_descr_directors: {
            ru: 'Блок режиссёров',
            uk: 'Блок режисерів',
            en: 'Directors row',
            be: 'Блок рэжысёраў'
        },
        card_sections_descr_actors: {
            ru: 'Актёрский состав',
            uk: 'Акторський склад',
            en: 'Cast members row',
            be: 'Акцёрскі склад'
        },
        card_sections_descr_collection: {
            ru: 'Другие фильмы этой франшизы / серии',
            uk: 'Інші фільми цієї франшизи / серії',
            en: 'Other movies from the same collection',
            be: 'Іншыя фільмы гэтай франшызы / серыі'
        },
        card_sections_descr_recomend: {
            ru: 'Подборка рекомендованных фильмов и сериалов',
            uk: 'Добірка рекомендованих фільмів та серіалів',
            en: 'Recommended movies and TV shows',
            be: 'Падборка рэкамендаваных фільмаў і серыялаў'
        },
        card_sections_descr_simular: {
            ru: 'Похожие фильмы и сериалы в конце карточки',
            uk: 'Подібні фільми та серіали в кінці картки',
            en: 'Similar movies and TV shows at the bottom of the card',
            be: 'Падобныя фільмы і серыялы ў канцы карткі'
        },
        card_sections_show_all: {
            ru: 'Показать все разделы',
            uk: 'Показати всі розділи',
            en: 'Show all sections',
            be: 'Паказаць усе раздзелы'
        },
        card_sections_show_all_descr: {
            ru: 'Включить отображение всех разделов карточки',
            uk: 'Увімкнути відображення всіх розділів картки',
            en: 'Enable all movie card sections',
            be: 'Уключыць паказ усіх раздзелаў карткі'
        },
        card_sections_hide_all: {
            ru: 'Скрыть все разделы',
            uk: 'Приховати всі розділи',
            en: 'Hide all sections',
            be: 'Схаваць усе раздзелы'
        },
        card_sections_hide_all_descr: {
            ru: 'Оставить только главный блок с постером и кнопками',
            uk: 'Залишити лише головний блок із постером та кнопками',
            en: 'Keep only the main header with poster and action buttons',
            be: 'Пакінуць толькі галоўны блок з постэрам і кнопкамі'
        },
        card_sections_noty_shown: {
            ru: 'Все разделы карточки включены',
            uk: 'Усі розділи картки увімкнено',
            en: 'All card sections enabled',
            be: 'Усе раздзелы карткі ўключаны'
        },
        card_sections_noty_hidden: {
            ru: 'Все дополнительные разделы карточки скрыты',
            uk: 'Усі додаткові розділи картки приховано',
            en: 'All extra card sections hidden',
            be: 'Усе дадатковыя раздзелы карткі схаваны'
        }
    };

    function registerTranslations() {
        try {
            if (Lampa.Lang && typeof Lampa.Lang.add === 'function') {
                Lampa.Lang.add(TRANSLATIONS);
            }
        }
        catch (e) {}
    }

    function t(langKey, fallback) {
        try {
            if (Lampa.Lang && typeof Lampa.Lang.translate === 'function') {
                var val = Lampa.Lang.translate(langKey);
                if (val && val !== langKey) return val;
            }
        }
        catch (e) {}

        if (fallback) return fallback;

        var entry = TRANSLATIONS[langKey];
        if (entry) return entry.ru || entry.en || langKey;

        return langKey;
    }

    /* ------------------------------------------------------------------ *
     * Хранилище (Storage)
     * ------------------------------------------------------------------ */

    function key(name) {
        return ID + '_' + name;
    }

    function getBool(name, def) {
        var val = Lampa.Storage.get(key(name), def);

        if (val === true || val === 'true') return true;
        if (val === false || val === 'false') return false;

        return !!def;
    }

    function isPluginEnabled() {
        return getBool('enabled', true);
    }

    function isSectionEnabled(sectionId) {
        return getBool('show_' + sectionId, true);
    }

    function isArray(val) {
        return Object.prototype.toString.call(val) === '[object Array]';
    }

    /* ------------------------------------------------------------------ *
     * Определение и фильтрация разделов карточки
     * ------------------------------------------------------------------ */

    function isDirectorList(list) {
        if (!isArray(list) || !list.length) return false;
        return !!(list[0] && list[0].job === 'Director');
    }

    /**
     * Определяет идентификатор раздела для строки в full.js (Lampa 3.x и 2.x).
     * Возвращает null для главного блока ('start') и сторонних плагинов,
     * чтобы они всегда оставались на месте.
     */
    function identifySection(name, rowData, fullData, legacyParams) {
        if (!name || name === 'start') return null;

        if (name === 'description' || name === 'descr') return 'description';
        if (name === 'metadata_chart') return 'metadata_chart';
        if (name === 'metadata_tags') return 'metadata_tags';
        if (name === 'episodes') return 'episodes';
        if (name === 'discuss' || name === 'comments') return 'discuss';
        if (name === 'simular') return 'simular';

        if (name === 'persons') {
            var persons = fullData && fullData.persons;

            // Lampa 3.x: rowData = { results: [...], title: '...' }
            if (rowData && !isArray(rowData)) {
                if (persons && rowData.results === persons.cast) return 'actors';
                if (rowData.title && rowData.title === t('title_producer', '')) return 'directors';
                if (rowData.title && rowData.title === t('title_actors', '')) return 'actors';
                if (isDirectorList(rowData.results)) return 'directors';
                return null;
            }

            // Lampa 2.x: rowData = [...], legacyParams = { title: '...' }
            if (persons && rowData === persons.cast) return 'actors';
            if (legacyParams && legacyParams.title && legacyParams.title === t('title_producer', '')) return 'directors';
            if (isDirectorList(rowData)) return 'directors';
            if (isArray(rowData)) return 'actors';

            return null;
        }

        if (name === 'cards' || name === 'recomend') {
            if (fullData && rowData) {
                if (rowData === fullData.collection) return 'collection';
                if (rowData === fullData.recomend) return 'recomend';
                if (rowData === fullData.simular) return 'simular';
            }

            if (rowData && rowData.title) {
                if (rowData.title === t('title_collection', '')) return 'collection';
                if (rowData.title === t('title_recomendations', '')) return 'recomend';
                if (rowData.title === t('title_similar', '')) return 'simular';
            }

            if (name === 'recomend') return 'recomend';

            return null;
        }

        return null;
    }

    function shouldKeepSection(sectionId, fullData) {
        if (!sectionId) return true;

        // В Lampa 3.x предупреждение 18+ с кнопкой подтверждения рендерится внутри блока description.
        // Не скрываем его, чтобы пользователь мог подтвердить просмотр.
        if (sectionId === 'description' && fullData && fullData.movie && fullData.movie.adult) {
            return true;
        }

        return isSectionEnabled(sectionId);
    }

    function filterRows(rows, fullData) {
        if (!isArray(rows)) return rows;

        var result = [];

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var name = isArray(row) ? row[0] : row;
            var rowData = isArray(row) ? row[1] : null;
            var sectionId = identifySection(name, rowData, fullData, null);

            if (shouldKeepSection(sectionId, fullData)) {
                result.push(row);
            }
        }

        return result;
    }

    /**
     * Lampa 3.x: перехватываем link.build, который вызывается после наполнения link.rows.
     */
    function hookModernFull(link, fullData) {
        if (link.__card_sections_patched) return;
        link.__card_sections_patched = true;

        var origBuild = link.build;

        link.build = function () {
            link.build = origBuild;

            if (isPluginEnabled()) {
                try {
                    link.rows = filterRows(link.rows, fullData);
                }
                catch (err) {
                    console.log('Card Sections', 'filter error', err);
                }
            }

            var limit = typeof this.view === 'number' && this.view > 0 ? this.view : link.rows.length;
            return origBuild.call(this, link.rows.slice(0, limit));
        };
    }

    /**
     * Lampa 2.x: перехватываем comp.build(name, data, params) и пропускаем отключённые разделы.
     */
    function hookLegacyFull(comp, fullData) {
        if (comp.__card_sections_patched) return;
        comp.__card_sections_patched = true;

        var origBuild = comp.build;
        comp.__card_sections_orig_build = origBuild;

        comp.build = function (name, rowData, params) {
            if (isPluginEnabled()) {
                try {
                    var sectionId = identifySection(name, rowData, fullData, params);
                    if (!shouldKeepSection(sectionId, fullData)) return;
                }
                catch (err) {
                    console.log('Card Sections', 'legacy filter error', err);
                }
            }

            return origBuild.apply(this, arguments);
        };
    }

    function onFullEvent(e) {
        if (!e) return;

        if (e.type === 'start') {
            if (!isPluginEnabled()) return;

            try {
                // Lampa 3.x
                if (e.link && isArray(e.link.rows) && typeof e.link.build === 'function') {
                    hookModernFull(e.link, e.data);
                    return;
                }

                // Lampa 2.x
                var comp = e.object && e.object.activity && typeof e.object.activity.component === 'function'
                    ? e.object.activity.component()
                    : null;

                if (comp && typeof comp.build === 'function') {
                    hookLegacyFull(comp, e.data);
                }
            }
            catch (err) {
                console.log('Card Sections', 'start hook error', err);
            }

            return;
        }

        if (e.type === 'complite') {
            // Восстанавливаем оригинальный build в Lampa 2.x после построения стандартных разделов
            try {
                var legacyComp = !e.link && e.object && e.object.activity && typeof e.object.activity.component === 'function'
                    ? e.object.activity.component()
                    : null;

                if (legacyComp && legacyComp.__card_sections_orig_build) {
                    legacyComp.build = legacyComp.__card_sections_orig_build;
                    delete legacyComp.__card_sections_orig_build;
                }
            }
            catch (err) {}
        }
    }

    /* ------------------------------------------------------------------ *
     * Обновление открытой карточки после изменения настроек
     * ------------------------------------------------------------------ */

    function refreshFullActivities() {
        var active = Lampa.Activity && typeof Lampa.Activity.active === 'function'
            ? Lampa.Activity.active()
            : null;

        // Помечаем к обновлению карточки в истории активностей
        if (Lampa.Activity && typeof Lampa.Activity.all === 'function') {
            var all = Lampa.Activity.all() || [];

            for (var i = 0; i < all.length; i++) {
                var item = all[i];
                if (!item || item.component !== 'full' || !item.activity) continue;
                if (item === active) continue;

                try {
                    if (typeof item.activity.refresh === 'function') item.activity.refresh();
                    else if (typeof item.activity.needRefresh === 'function') item.activity.needRefresh();
                }
                catch (e) {}
            }
        }

        // Обновляем текущую открытую карточку
        if (active && active.component === 'full') {
            try {
                if (typeof Lampa.Activity.replace === 'function') {
                    Lampa.Activity.replace({});
                }
            }
            catch (e) {}
        }
    }

    function scheduleRefreshIfDirty() {
        if (!dirty) return;
        dirty = false;

        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
            refreshTimer = null;
            refreshFullActivities();
        }, 60);
    }

    function markDirty() {
        dirty = true;
    }

    function setAllSections(visible) {
        for (var i = 0; i < SECTIONS.length; i++) {
            Lampa.Storage.set(key('show_' + SECTIONS[i].id), !!visible);
        }

        markDirty();

        try {
            if (Lampa.Settings && typeof Lampa.Settings.update === 'function') {
                Lampa.Settings.update();
            }
        }
        catch (e) {}

        if (Lampa.Noty && typeof Lampa.Noty.show === 'function') {
            Lampa.Noty.show(t(visible ? 'card_sections_noty_shown' : 'card_sections_noty_hidden'));
        }
    }

    /* ------------------------------------------------------------------ *
     * Настройки в меню Lampa
     * ------------------------------------------------------------------ */

    var SETTINGS_ICON =
        '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="4" y="4" width="28" height="9" rx="2.5" stroke="currentColor" stroke-width="2.4"/>' +
        '<rect x="4" y="17" width="19" height="5" rx="2" stroke="currentColor" stroke-width="2.2"/>' +
        '<rect x="4" y="26" width="19" height="5" rx="2" stroke="currentColor" stroke-width="2.2"/>' +
        '<path d="M27 19.5h5M27 28.5h5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
        '</svg>';

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: t('card_sections_title'),
            icon: SETTINGS_ICON
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('enabled'), type: 'trigger', default: true },
            field: {
                name: t('card_sections_enabled'),
                description: t('card_sections_enabled_descr')
            },
            onChange: markDirty
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('title_sections'), type: 'title' },
            field: { name: t('card_sections_group_sections') }
        });

        for (var i = 0; i < SECTIONS.length; i++) {
            var sec = SECTIONS[i];

            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key('show_' + sec.id), type: 'trigger', default: true },
                field: {
                    name: t(sec.langKey, sec.fallback),
                    description: t(sec.descrKey)
                },
                onChange: markDirty
            });
        }

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('title_actions'), type: 'title' },
            field: { name: t('card_sections_group_actions') }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('show_all'), type: 'button' },
            field: {
                name: t('card_sections_show_all'),
                description: t('card_sections_show_all_descr')
            },
            onChange: function () {
                setAllSections(true);
            }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('hide_all'), type: 'button' },
            field: {
                name: t('card_sections_hide_all'),
                description: t('card_sections_hide_all_descr')
            },
            onChange: function () {
                setAllSections(false);
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * Старт
     * ------------------------------------------------------------------ */

    function start() {
        if (window.__card_sections_ready) return;
        window.__card_sections_ready = true;

        registerTranslations();

        // Подписка идёт первой: даже если SettingsApi выбросит исключение, фильтрация продолжит работать.
        Lampa.Listener.follow('full', onFullEvent);

        try {
            addSettings();
        }
        catch (err) {
            console.log('Card Sections', 'settings error', err);
        }

        // Обновляем открытую карточку после закрытия настроек (Back, Left или клик по фону).
        if (Lampa.Settings && Lampa.Settings.listener) {
            Lampa.Settings.listener.follow('close', scheduleRefreshIfDirty);
        }

        if (Lampa.Controller && Lampa.Controller.listener) {
            Lampa.Controller.listener.follow('toggle', function (e) {
                if (!dirty || !e || !e.name) return;

                var name = e.name;
                if (name === 'content' || name === 'head' || name === 'menu') {
                    scheduleRefreshIfDirty();
                }
            });
        }

        Lampa.Manifest.plugins = {
            type: 'other',
            version: VERSION,
            name: 'Card Sections',
            description: t('card_sections_manifest_descr')
        };
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
