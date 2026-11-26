/**
 * Card Sections v1.1.0
 * Плагин для Lampa: управление отображением и порядком разделов в карточке фильма/сериала.
 *
 * Позволяет в настройках включать/отключать отдельные разделы карточки
 * (Подробно, Комментарии, Метаданные, Настроения, Выход серий, Режиссёр,
 * Актёры, Коллекция, Рекомендации, Похожие / Подібні) и менять их порядок.
 *
 * Как это работает:
 *   - В Lampa 3.x перехватывает событие full:start и фильтрует/сортирует массив
 *     e.link.rows непосредственно перед вызовом e.link.build — отключённые разделы
 *     не создаются в DOM, не грузят картинки и не ломают навигацию пультом.
 *   - В Lampa 2.x перехватывает build/visible экземпляра компонента full и
 *     применяет фильтрацию и пользовательский порядок без изменения исходного data.
 *   - Если пользовательский порядок не задан, сохраняется родной порядок Lampa
 *     (включая автоматический перенос пустых комментариев в конец карточки).
 *   - При изменении настроек, когда открыта карточка фильма, карточка
 *     автоматически обновляется после закрытия меню настроек.
 *
 * ES5 — совместимость со старыми WebOS, Tizen и Android WebView.
 */
(function () {
    'use strict';

    var ID = 'card_sections';
    var VERSION = '1.1.0';

    var dirty = false;
    var refreshTimer = null;

    /**
     * Список управляемых разделов карточки в порядке отображения по умолчанию.
     * Главный блок (start: постер, название, кнопки) всегда остаётся первым и не отключается.
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

    var SECTIONS_BY_ID = {};
    for (var sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
        SECTIONS_BY_ID[SECTIONS[sIdx].id] = SECTIONS[sIdx];
    }

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
            ru: 'Включение, отключение и настройка порядка разделов в карточке фильма и сериала',
            uk: 'Увімкнення, вимкнення та зміна порядку розділів у картці фільму та серіалу',
            en: 'Toggle visibility and reorder sections on movie and TV show cards',
            be: 'Уключэнне, адключэнне і парадак раздзелаў у картцы фільма і серыяла'
        },
        card_sections_enabled: {
            ru: 'Включить плагин',
            uk: 'Увімкнути плагін',
            en: 'Enable plugin',
            be: 'Уключыць плагін'
        },
        card_sections_enabled_descr: {
            ru: 'Применять настройки видимости и порядка разделов в карточке фильма и сериала',
            uk: 'Застосовувати налаштування видимості та порядку розділів у картці фільму та серіалу',
            en: 'Apply section visibility and order settings on movie and TV show cards',
            be: 'Ужываць налады бачнасці і парадку раздзелаў у картцы фільма і серыяла'
        },
        card_sections_order: {
            ru: 'Порядок разделов',
            uk: 'Порядок розділів',
            en: 'Section order',
            be: 'Парадак раздзелаў'
        },
        card_sections_order_descr: {
            ru: 'Изменить порядок отображения разделов в карточке',
            uk: 'Змінити порядок відображення розділів у картці',
            en: 'Change the display order of sections on the card',
            be: 'Змяніць парадак адлюстравання раздзелаў у картцы'
        },
        card_sections_order_pick_hint: {
            ru: 'Нажмите, чтобы переместить',
            uk: 'Натисніть, щоб перемістити',
            en: 'Select to move',
            be: 'Націсніце, каб перамясціць'
        },
        card_sections_order_hidden_tag: {
            ru: 'Скрыт',
            uk: 'Приховано',
            en: 'Hidden',
            be: 'Схаваны'
        },
        card_sections_order_move_title: {
            ru: 'Куда переместить:',
            uk: 'Куди перемістити:',
            en: 'Move to position:',
            be: 'Куды перамясціць:'
        },
        card_sections_order_place_here: {
            ru: 'Поставить на позицию',
            uk: 'Поставити на позицію',
            en: 'Place at position',
            be: 'Паставіць на пазіцыю'
        },
        card_sections_order_cancel: {
            ru: 'Отменить перемещение',
            uk: 'Скасувати переміщення',
            en: 'Cancel move',
            be: 'Скасаваць перамяшчэнне'
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
        card_sections_reset_order: {
            ru: 'Сбросить порядок разделов',
            uk: 'Скинути порядок розділів',
            en: 'Reset section order',
            be: 'Скінуць парадак раздзелаў'
        },
        card_sections_reset_order_descr: {
            ru: 'Вернуть стандартный порядок разделов Lampa',
            uk: 'Повернути стандартний порядок розділів Lampa',
            en: 'Restore default Lampa section order',
            be: 'Вярнуць стандартны парадак раздзелаў Lampa'
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
        },
        card_sections_noty_order_reset: {
            ru: 'Порядок разделов сброшен по умолчанию',
            uk: 'Порядок розділів скинуто за замовчуванням',
            en: 'Section order reset to default',
            be: 'Парадак раздзелаў скінуты па змаўчанні'
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

    function sectionTitle(sectionId) {
        var sec = SECTIONS_BY_ID[sectionId];
        if (!sec) return sectionId;
        return t(sec.langKey, sec.fallback);
    }

    /* ------------------------------------------------------------------ *
     * Хранилище (Storage) и порядок разделов
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

    function hasCustomOrder() {
        var raw = Lampa.Storage.get(key('order'), '');
        if (!raw) return false;
        if (isArray(raw)) return raw.length > 0;
        return (raw + '').replace(/\s+/g, '').length > 0;
    }

    function getOrder() {
        var raw = Lampa.Storage.get(key('order'), '');
        var parsed = [];

        if (isArray(raw)) {
            parsed = raw;
        }
        else if (raw && typeof raw === 'string') {
            parsed = raw.split(',');
        }

        var result = [];
        var seen = {};
        var i, id;

        for (i = 0; i < parsed.length; i++) {
            id = (parsed[i] + '').replace(/^\s+|\s+$/g, '');
            if (id && SECTIONS_BY_ID[id] && !seen[id]) {
                seen[id] = true;
                result.push(id);
            }
        }

        for (i = 0; i < SECTIONS.length; i++) {
            id = SECTIONS[i].id;
            if (!seen[id]) {
                seen[id] = true;
                result.push(id);
            }
        }

        return result;
    }

    function getOrderRankMap() {
        var order = getOrder();
        var rank = {};

        for (var i = 0; i < order.length; i++) {
            rank[order[i]] = i;
        }

        return rank;
    }

    function saveOrder(orderIds) {
        Lampa.Storage.set(key('order'), orderIds.join(','));
        markDirty();
    }

    function moveInOrder(fromIndex, toIndex) {
        var order = getOrder();

        if (fromIndex < 0 || fromIndex >= order.length) return order;
        if (toIndex < 0 || toIndex >= order.length) return order;
        if (fromIndex === toIndex) return order;

        var moved = order.splice(fromIndex, 1)[0];
        order.splice(toIndex, 0, moved);
        saveOrder(order);

        return order;
    }

    /* ------------------------------------------------------------------ *
     * Определение, фильтрация и сортировка разделов карточки
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

    /**
     * Сортирует массив обёрток { item, sectionId, index } по пользовательскому порядку.
     * Неизвестные разделы сторонних плагинов сохраняют исходный порядок в конце списка.
     */
    function sortEntries(entries) {
        var rank = getOrderRankMap();
        var fallbackBase = SECTIONS.length + 100;

        entries.sort(function (a, b) {
            var ra = a.sectionId && typeof rank[a.sectionId] === 'number'
                ? rank[a.sectionId]
                : fallbackBase + a.index;
            var rb = b.sectionId && typeof rank[b.sectionId] === 'number'
                ? rank[b.sectionId]
                : fallbackBase + b.index;

            if (ra !== rb) return ra - rb;
            return a.index - b.index;
        });

        return entries;
    }

    function processRows(rows, fullData) {
        if (!isArray(rows)) return rows;

        var startRows = [];
        var entries = [];
        var i;

        for (i = 0; i < rows.length; i++) {
            var row = rows[i];
            var name = isArray(row) ? row[0] : row;
            var rowData = isArray(row) ? row[1] : null;

            if (name === 'start') {
                startRows.push(row);
                continue;
            }

            var sectionId = identifySection(name, rowData, fullData, null);

            if (shouldKeepSection(sectionId, fullData)) {
                entries.push({
                    item: row,
                    sectionId: sectionId,
                    index: i
                });
            }
        }

        if (hasCustomOrder()) {
            sortEntries(entries);
        }

        var result = startRows.slice();
        for (i = 0; i < entries.length; i++) {
            result.push(entries[i].item);
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
                    link.rows = processRows(link.rows, fullData);
                }
                catch (err) {
                    console.log('Card Sections', 'processRows error', err);
                }
            }

            var limit = typeof this.view === 'number' && this.view > 0 ? this.view : link.rows.length;
            return origBuild.call(this, link.rows.slice(0, limit));
        };
    }

    /**
     * Lampa 2.x: перехватываем comp.build и comp.visible для фильтрации и сортировки разделов.
     */
    function hookLegacyFull(comp, fullData) {
        if (comp.__card_sections_patched) return;
        comp.__card_sections_patched = true;

        var origBuild = comp.build;
        var origVisible = typeof comp.visible === 'function' ? comp.visible : null;
        var useCustomOrder = hasCustomOrder() && !!origVisible;
        var queue = [];
        var seq = 0;
        var flushed = false;

        function restoreAndFlush() {
            if (flushed) return;
            flushed = true;

            comp.build = origBuild;
            if (origVisible) comp.visible = origVisible;
            delete comp.__card_sections_flush;

            if (queue.length) {
                sortEntries(queue);
                for (var i = 0; i < queue.length; i++) {
                    origBuild.apply(comp, queue[i].item);
                }
                queue = [];
            }
        }

        comp.__card_sections_flush = restoreAndFlush;

        comp.build = function (name, rowData, params) {
            if (!isPluginEnabled() || name === 'start') {
                return origBuild.apply(this, arguments);
            }

            var sectionId = null;
            try {
                sectionId = identifySection(name, rowData, fullData, params);
                if (!shouldKeepSection(sectionId, fullData)) return;
            }
            catch (err) {
                console.log('Card Sections', 'legacy filter error', err);
            }

            if (useCustomOrder) {
                var argsCopy = [];
                for (var i = 0; i < arguments.length; i++) argsCopy.push(arguments[i]);

                queue.push({
                    item: argsCopy,
                    sectionId: sectionId,
                    index: seq++
                });
                return;
            }

            return origBuild.apply(this, arguments);
        };

        if (useCustomOrder) {
            comp.visible = function () {
                restoreAndFlush();
                return origVisible.apply(this, arguments);
            };
        }
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
            try {
                var legacyComp = !e.link && e.object && e.object.activity && typeof e.object.activity.component === 'function'
                    ? e.object.activity.component()
                    : null;

                if (legacyComp && typeof legacyComp.__card_sections_flush === 'function') {
                    legacyComp.__card_sections_flush();
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

    function updateSettingsView() {
        try {
            if (Lampa.Settings && typeof Lampa.Settings.update === 'function') {
                Lampa.Settings.update();
            }
        }
        catch (e) {}
    }

    function rebuildSettingsParams() {
        try {
            if (Lampa.SettingsApi && typeof Lampa.SettingsApi.removeParams === 'function') {
                Lampa.SettingsApi.removeParams(ID);
                addSettingsParams();
                return true;
            }
        }
        catch (e) {}

        return false;
    }

    function setAllSections(visible) {
        for (var i = 0; i < SECTIONS.length; i++) {
            Lampa.Storage.set(key('show_' + SECTIONS[i].id), !!visible);
        }

        markDirty();
        updateSettingsView();

        if (Lampa.Noty && typeof Lampa.Noty.show === 'function') {
            Lampa.Noty.show(t(visible ? 'card_sections_noty_shown' : 'card_sections_noty_hidden'));
        }
    }

    function resetOrder(silentSettingsUpdate) {
        Lampa.Storage.set(key('order'), '');
        markDirty();

        if (!silentSettingsUpdate) {
            rebuildSettingsParams();
            updateSettingsView();
        }

        if (Lampa.Noty && typeof Lampa.Noty.show === 'function') {
            Lampa.Noty.show(t('card_sections_noty_order_reset'));
        }
    }

    /* ------------------------------------------------------------------ *
     * Интерактивный редактор порядка разделов (Pick & Place через Select)
     * ------------------------------------------------------------------ */

    function openOrderEditor(pickedId, focusId, changedInModal) {
        if (!Lampa.Select || typeof Lampa.Select.show !== 'function') return;

        var order = getOrder();
        var pickedIndex = pickedId ? order.indexOf(pickedId) : -1;
        var items = [];
        var i;

        for (i = 0; i < order.length; i++) {
            (function (secId, index) {
                var visible = isSectionEnabled(secId);
                var title = (index + 1) + '. ' + sectionTitle(secId);
                var subtitle = '';

                if (pickedIndex >= 0) {
                    if (index === pickedIndex) {
                        subtitle = t('card_sections_order_cancel');
                    }
                    else {
                        subtitle = t('card_sections_order_place_here') + ' ' + (index + 1);
                    }
                }
                else {
                    subtitle = visible
                        ? t('card_sections_order_pick_hint')
                        : t('card_sections_order_hidden_tag') + ' · ' + t('card_sections_order_pick_hint');
                }

                items.push({
                    title: title,
                    subtitle: subtitle,
                    selected: focusId ? secId === focusId : (pickedIndex >= 0 && index === pickedIndex),
                    picked: pickedIndex >= 0 && index === pickedIndex,
                    ghost: !visible,
                    onSelect: function () {
                        if (pickedIndex < 0) {
                            openOrderEditor(secId, secId, changedInModal);
                        }
                        else if (index === pickedIndex) {
                            openOrderEditor(null, secId, changedInModal);
                        }
                        else {
                            moveInOrder(pickedIndex, index);
                            openOrderEditor(null, pickedId, true);
                        }
                    }
                });
            })(order[i], i);
        }

        if (pickedIndex < 0) {
            items.push({
                title: t('card_sections_group_actions'),
                separator: true
            });

            items.push({
                title: t('card_sections_reset_order'),
                subtitle: t('card_sections_reset_order_descr'),
                onSelect: function () {
                    resetOrder(true);
                    openOrderEditor(null, null, true);
                }
            });
        }

        var modalTitle = pickedIndex >= 0
            ? t('card_sections_order_move_title') + ' ' + sectionTitle(pickedId)
            : t('card_sections_order');

        Lampa.Select.show({
            title: modalTitle,
            items: items,
            onBack: function () {
                if (pickedIndex >= 0) {
                    openOrderEditor(null, pickedId, changedInModal);
                    return;
                }

                try {
                    if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                        Lampa.Controller.toggle('settings_component');
                    }
                }
                catch (e) {}

                if (changedInModal && rebuildSettingsParams()) {
                    updateSettingsView();
                }
            }
        });
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

    function addSettingsParams() {
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
            param: { name: key('order_editor'), type: 'button' },
            field: {
                name: t('card_sections_order'),
                description: t('card_sections_order_descr')
            },
            onChange: function () {
                openOrderEditor(null, null, false);
            }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('title_sections'), type: 'title' },
            field: { name: t('card_sections_group_sections') }
        });

        var order = getOrder();

        for (var i = 0; i < order.length; i++) {
            var sec = SECTIONS_BY_ID[order[i]];
            if (!sec) continue;

            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key('show_' + sec.id), type: 'trigger', default: true },
                field: {
                    name: (i + 1) + '. ' + t(sec.langKey, sec.fallback),
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

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: key('reset_order'), type: 'button' },
            field: {
                name: t('card_sections_reset_order'),
                description: t('card_sections_reset_order_descr')
            },
            onChange: function () {
                resetOrder(false);
            }
        });
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: t('card_sections_title'),
            icon: SETTINGS_ICON
        });

        addSettingsParams();
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
