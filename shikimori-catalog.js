/**
 * Shikimori Catalog v1.2.0
 * Каталог онгоингов с Shikimori в боковом меню Lampa.
 * По нажатию на постер находит тайтл в TMDB и открывает встроенную карточку Lampa
 * (со всеми её кнопками: онлайн, торренты, трейлеры, закладки).
 *
 * Сопоставление Shikimori -> TMDB (по порядку, до первого успеха):
 *   1. Кэш в Storage — однажды найденное повторно не ищем.
 *   2. ARM (arm.haglund.dev): id Shikimori совпадает с id MyAnimeList,
 *      ARM отдаёт imdb/tvdb, по ним TMDB /find возвращает точный id.
 *   3. Поиск TMDB по названиям (японское, ромадзи, английское, русское)
 *      с отсечением «2nd Season», «第2期» и т.п.: в TMDB сезоны аниме обычно
 *      живут внутри одного сериала, а на Shikimori — отдельными тайтлами.
 *   4. Уверенного совпадения нет — показываем список кандидатов.
 *
 * История просмотра: после сопоставления карточка каталога получает поля TMDB,
 * поэтому на ней видно, на какой серии остановились (как на обычных карточках).
 *
 * Долгое нажатие на карточку: открыть, скрыть из каталога, подобрать TMDB вручную.
 * Скрытые возвращаются в Настройки -> Shikimori -> «Скрытые аниме».
 *
 * Поддерживает Lampa 3.x (Lampa.Maker) и 2.x (InteractionCategory).
 * ES5 — совместимость с WebOS 3–4 и Tizen 2.4.
 */
(function () {
    'use strict';

    var ID = 'shikimori_catalog';
    var VERSION = '1.2.0';
    var COMPONENT = 'shikimori_catalog';

    /** Зеркала Shikimori: при сетевой ошибке пробуем следующее. */
    var MIRRORS = ['shikimori.io', 'shikimori.one', 'shikimori.me'];

    /** Максимум, который отдаёт API Shikimori за запрос. */
    var PAGE_LIMIT = 50;

    /** Сколько сопоставлений Shikimori -> TMDB хранить. */
    var CACHE_LIMIT = 500;

    var ARM_URL = 'https://arm.haglund.dev/api/v2/ids?source=myanimelist&id=';

    /** Сколько поисковых запросов к TMDB максимум делаем на один тайтл. */
    var MAX_QUERIES = 6;

    /** Порог очков: выше — открываем сразу, ниже ACCEPT — спрашиваем пользователя. */
    var CONFIDENT = 6;
    var ACCEPT = 5;

    var KINDS = {
        tv: 'tv',
        tv_ona: 'tv,ona',
        all: 'tv,ona,ova,movie,special,tv_special'
    };

    var ORDERS = {
        popularity: 'По популярности',
        ranked: 'По рейтингу',
        aired_on: 'По дате выхода'
    };

    var ICON = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">' +
        '<circle cx="12" cy="5.6" r="3.6"/><circle cx="18.1" cy="10" r="3.6"/><circle cx="15.8" cy="17.2" r="3.6"/>' +
        '<circle cx="8.2" cy="17.2" r="3.6"/><circle cx="5.9" cy="10" r="3.6"/></g></svg>';

    /* ------------------------------------------------------------------ *
     * Утилиты
     * ------------------------------------------------------------------ */

    function key(name) { return ID + '_' + name; }
    function get(name, def) { return Lampa.Storage.get(key(name), def); }

    function isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }

    /** Внешние строки уходят в шаблоны Lampa (Template.get, Noty) как HTML. */
    function escape(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function yearOf(date) {
        var year = parseInt(String(date || '').slice(0, 4), 10);
        return year > 1900 ? year : 0;
    }

    /** Источник для полной карточки: id из TMDB понимают только tmdb и cub. */
    function cardSource() {
        var active = Lampa.Storage.field('source');
        return active === 'cub' || active === 'tmdb' ? active : 'tmdb';
    }

    /* ------------------------------------------------------------------ *
     * Сеть
     * ------------------------------------------------------------------ */

    /** Последнее зеркало, ответившее в этой сессии. */
    var aliveMirror = '';

    function mirrorList() {
        var preferred = aliveMirror || get('domain', MIRRORS[0]);
        var list = [preferred];

        for (var i = 0; i < MIRRORS.length; i++) {
            if (MIRRORS[i] !== preferred) list.push(MIRRORS[i]);
        }

        return list;
    }

    function request(net, url, timeout, ok, fail) {
        net.timeout(timeout);
        net.silent(url, ok, fail);
    }

    /**
     * GET к API Shikimori с перебором зеркал.
     * На 404/422 зеркала не перебираем: ответ осмысленный, другой домен его не изменит.
     */
    function shikimori(net, path, ok, fail) {
        var list = mirrorList();
        var index = 0;

        function attempt() {
            var host = list[index];

            request(net, 'https://' + host + path, 15000, function (json) {
                aliveMirror = host;
                ok(json, host);
            }, function (xhr) {
                var status = xhr && xhr.status;
                var retry = !status || status === 403 || status === 429 || status >= 500;

                index++;

                if (retry && index < list.length) attempt();
                else fail(xhr);
            });
        }

        attempt();
    }

    /** Запрос к TMDB через Lampa: учитывает прокси TMDB из настроек Lampa. */
    function tmdb(net, path, ok, fail) {
        var lang = Lampa.Storage.field('tmdb_lang') || 'ru';
        var url = path + (path.indexOf('?') >= 0 ? '&' : '?') +
            'api_key=' + Lampa.TMDB.key() + '&language=' + encodeURIComponent(lang);

        request(net, Lampa.TMDB.api(url), 10000, ok, fail);
    }

    /* ------------------------------------------------------------------ *
     * Каталог Shikimori
     * ------------------------------------------------------------------ */

    function listPath(page) {
        var order = get('order', 'popularity');

        var params = [
            'page=' + page,
            'limit=' + PAGE_LIMIT,
            'status=ongoing',
            'order=' + (ORDERS[order] ? order : 'popularity'),
            'kind=' + (KINDS[get('kind', 'tv_ona')] || KINDS.tv_ona)
        ];

        if (get('censored', true)) params.push('censored=true');

        return '/api/animes?' + params.join('&');
    }

    function toCard(anime, host, modern) {
        var image = anime.image ? anime.image.original || anime.image.preview || '' : '';

        var card = {
            // Пока нет сопоставления — строковый id: числовой мог бы совпасть
            // с id TMDB и подхватить чужие закладки. После — настоящий id TMDB (linkCard).
            id: 'shikimori_' + anime.id,
            shikimori: anime,
            title: anime.russian || anime.name,
            poster: image && image.indexOf('http') !== 0 ? 'https://' + host + image : image,
            release_date: anime.aired_on || '',
            vote_average: parseFloat(anime.score) || 0
        };

        // Lampa 3: модули отрисовки, событий и «просмотренных серий» (Watched).
        // Без избранного и контекстного меню: до сопоставления они бы писали
        // в закладки данные Shikimori вместо TMDB.
        if (modern) {
            var mask = Lampa.Maker.module('Card');
            card.params = { module: mask.only('Card', 'Release', 'Ratting', 'Style', 'Watched', 'Callback') };
        }

        var cached = cacheGet(anime.id);
        if (cached) linkCard(card, cached);

        return card;
    }

    /**
     * Страница каталога в формате Lampa: {results, page, more}.
     * Shikimori не отдаёт общее количество, поэтому признак «есть ещё» —
     * полная страница. Онгоинги без вышедших серий не показываем.
     */
    function loadPage(net, page, modern, ok, fail) {
        shikimori(net, listPath(page), function (json, host) {
            var list = isArray(json) ? json : [];
            var hidden = hiddenAll();
            var results = [];

            for (var i = 0; i < list.length && i < PAGE_LIMIT; i++) {
                var anime = list[i];
                if (!anime || !anime.id || hidden[anime.id]) continue;
                if ((anime.episodes_aired || 0) > 0) results.push(toCard(anime, host, modern));
            }

            ok({
                results: results,
                page: page,
                more: list.length >= PAGE_LIMIT
            });
        }, fail);
    }

    /** Плашка «вышло/всего серий» поверх постера. */
    function addBadge(root, card) {
        if (!root || !root.querySelector) return;

        var view = root.querySelector('.card__view');
        var anime = card.shikimori;
        if (!view || !anime) return;

        // Lampa 2 сама рисует «TV» для карточек с original_name — заменяем своей плашкой.
        var old = view.querySelector('.card__type');
        if (old) old.parentNode.removeChild(old);

        var badge = document.createElement('div');
        badge.className = 'card__type';
        badge.textContent = (anime.episodes_aired || 0) + (anime.episodes ? '/' + anime.episodes : '') + ' эп.';
        view.appendChild(badge);
    }

    /* ------------------------------------------------------------------ *
     * История просмотра
     *
     * Прогресс в Lampa привязан к карточке TMDB: Timeline ищет по id и хэшу
     * оригинального названия, онлайн-плагины пишут последнюю серию в
     * online_watched_last по хэшу original_name (фильм — original_title).
     * Поэтому сопоставленной карточке отдаём поля TMDB — и родной модуль
     * Watched, и наша метка читают те же данные, что и у обычных карточек.
     * ------------------------------------------------------------------ */

    function linkCard(card, entry) {
        if (!entry || !entry.original) return;

        card.id = entry.id;
        card.source = cardSource();
        card.original_title = entry.original;

        // original_name есть только у сериалов: по нему Lampa отличает их от фильмов.
        if (entry.method === 'tv') card.original_name = entry.original;
        else delete card.original_name;
    }

    function unlinkCard(card) {
        card.id = 'shikimori_' + card.shikimori.id;
        delete card.source;
        delete card.original_name;
        delete card.original_title;
    }

    function isLinked(card) {
        return typeof card.id === 'number' && !!card.original_title;
    }

    var watchedLast = null;
    var watchedLastTime = 0;

    /**
     * online_watched_last целиком: Storage.get каждый раз парсит JSON, а метка
     * обновляется при каждом появлении карточки — держим копию пару секунд.
     */
    function readWatchedLast() {
        var now = Date.now();

        if (!watchedLast || now - watchedLastTime > 2000) {
            var all = Lampa.Storage.get('online_watched_last', '{}');
            watchedLast = all && typeof all === 'object' ? all : {};
            watchedLastTime = now;
        }

        return watchedLast;
    }

    /** Текст метки прогресса или '' — если карточку ещё не смотрели. */
    function progressText(card) {
        if (!isLinked(card)) return '';

        var serial = !!card.original_name;
        var saved = readWatchedLast()[Lampa.Utils.hash(card.original_title)];

        if (serial && saved && saved.episode) {
            return (saved.season > 1 ? 'S' + saved.season + ' · ' : '') + 'Эп. ' + saved.episode;
        }

        if (!Lampa.Timeline || !Lampa.Timeline.watched) return '';

        try {
            if (serial) {
                // Серии 1-го сезона с прогрессом: [{ep, view}] — берём последнюю.
                var list = Lampa.Timeline.watched(card, true);
                if (isArray(list) && list.length) return 'Эп. ' + list[list.length - 1].ep;
            }
            else {
                var time = Lampa.Timeline.watched(card, true);
                if (time && time.percent) return time.percent >= 90 ? 'Просмотрено' : time.percent + '%';
            }
        }
        catch (error) {}

        return '';
    }

    /** Постоянная метка «на какой серии остановился» внизу постера. */
    function refreshProgress(root, card) {
        if (!root || !root.querySelector) return;

        var view = root.querySelector('.card__view');
        if (!view) return;

        var text = progressText(card);
        var marker = view.querySelector('.' + ID + '__progress');

        if (!text) {
            if (marker) marker.parentNode.removeChild(marker);
            return;
        }

        if (!marker) {
            // Родные классы маркера закладок: так метка выглядит как «Смотрю» у обычных карточек.
            marker = document.createElement('div');
            marker.className = 'card__marker card__marker--look ' + ID + '__progress';
            marker.appendChild(document.createElement('span'));
            view.appendChild(marker);
        }

        marker.firstChild.textContent = text;
    }

    /* ------------------------------------------------------------------ *
     * Кэш сопоставлений
     * ------------------------------------------------------------------ */

    function cacheAll() {
        var all = Lampa.Storage.get(key('map'), '{}');
        return all && typeof all === 'object' ? all : {};
    }

    function cacheGet(shikimoriId) {
        var entry = cacheAll()[shikimoriId];
        return entry && entry.id && (entry.method === 'tv' || entry.method === 'movie') ? entry : null;
    }

    function cacheSet(shikimoriId, match) {
        var all = cacheAll();
        var ids = [];

        all[shikimoriId] = {
            id: match.id,
            method: match.method,
            title: match.title || '',
            // Оригинальное название TMDB — ключ истории просмотра (см. linkCard).
            original: match.original || '',
            time: Date.now()
        };

        for (var id in all) ids.push(id);

        if (ids.length > CACHE_LIMIT) {
            ids.sort(function (a, b) { return (all[a].time || 0) - (all[b].time || 0); });
            for (var i = 0; i < ids.length - CACHE_LIMIT; i++) delete all[ids[i]];
        }

        Lampa.Storage.set(key('map'), all);
    }

    function cacheRemove(shikimoriId) {
        var all = cacheAll();
        delete all[shikimoriId];
        Lampa.Storage.set(key('map'), all);
    }

    /* ------------------------------------------------------------------ *
     * Скрытые аниме: { [shikimoriId]: {title, time} }
     * ------------------------------------------------------------------ */

    function hiddenAll() {
        var all = Lampa.Storage.get(key('hidden'), '{}');
        return all && typeof all === 'object' ? all : {};
    }

    function hideAnime(card) {
        var all = hiddenAll();
        all[card.shikimori.id] = { title: card.title, time: Date.now() };
        Lampa.Storage.set(key('hidden'), all);
    }

    function unhideAnime(shikimoriId) {
        var all = hiddenAll();
        delete all[shikimoriId];
        Lampa.Storage.set(key('hidden'), all);
    }

    /** Список скрытых из настроек: выбор возвращает тайтл в каталог. */
    function showHidden() {
        var controller = Lampa.Controller.enabled().name;
        var all = hiddenAll();
        var ids = [];
        var id;

        for (id in all) ids.push(id);

        if (!ids.length) {
            Lampa.Noty.show('Скрытых аниме нет');
            return;
        }

        ids.sort(function (a, b) { return (all[b].time || 0) - (all[a].time || 0); });

        var items = [];

        if (ids.length > 1) items.push({ title: 'Вернуть все (' + ids.length + ')', all: true });

        for (var i = 0; i < ids.length; i++) {
            items.push({ title: escape(all[ids[i]].title || 'Shikimori #' + ids[i]), id: ids[i] });
        }

        Lampa.Select.show({
            title: 'Скрытые аниме',
            items: items,
            onSelect: function (item) {
                if (item.all) Lampa.Storage.set(key('hidden'), {});
                else unhideAnime(item.id);

                Lampa.Noty.show('Вернётся в каталог при следующем открытии');
                Lampa.Controller.toggle(controller);
            },
            onBack: function () {
                Lampa.Controller.toggle(controller);
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * Сопоставление с TMDB: названия
     * ------------------------------------------------------------------ */

    /**
     * Маркеры продолжений. \b в ES5 не работает с кириллицей,
     * поэтому границы слов заданы пробелом/началом строки.
     */
    var SEQUEL_PATTERNS = [
        /(^|\s)\d+(st|nd|rd|th)\s+season/gi,
        /(^|\s)(season|part|cour)\s*\d+/gi,
        /(^|\s)\d+[\s-]*(й|ий|ой)?\s*сезон/gi,
        /(^|\s)(сезон|часть)\s*\d+/gi,
        /\s*第\s*[0-9０-９一二三四五六七八九十]+\s*(期|シーズン|クール|部|章)/g,
        /\s+(ii|iii|iv|v|vi)$/i
    ];

    function cleanTitle(title) {
        var result = String(title || '');

        for (var i = 0; i < SEQUEL_PATTERNS.length; i++) {
            result = result.replace(SEQUEL_PATTERNS[i], ' ');
        }

        return result.replace(/[\s:：\-–—(（]+$/, '').replace(/\s{2,}/g, ' ').trim();
    }

    /** Для сравнения: регистр, пунктуация и пробелы не важны. */
    function normalize(title) {
        return String(title || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[\s.,:;!?'"`‘’«»“”„()\[\]{}\/\\|~_*&^%$#@+=<>\-–—・、。！？：（）「」『』【】☆★♪×]/g, '');
    }

    function first(list) {
        return isArray(list) && list.length ? list[0] : '';
    }

    /**
     * Контекст поиска: запросы, все варианты названий для сравнения, год и тип.
     * Порядок запросов: названия без маркеров продолжения (так тайтл называется
     * в TMDB), затем часть до двоеточия, и только потом исходные названия.
     * Японское первым: в TMDB оно лежит в original_name и совпадает точно.
     */
    function searchContext(anime) {
        var names = [first(anime.japanese), anime.name, first(anime.english), anime.russian];
        var cleanedQueries = [];
        var colonQueries = [];
        var rawQueries = [];
        var norms = {};
        var sequel = false;
        var i;

        function addQuery(list, query) {
            query = String(query || '').trim();
            if (query.length >= 2 && list.indexOf(query) < 0) list.push(query);
        }

        function addNorm(title) {
            var n = normalize(title);
            if (n.length >= 2) norms[n] = true;
        }

        for (i = 0; i < names.length; i++) {
            if (!names[i]) continue;

            var cleaned = cleanTitle(names[i]);
            if (cleaned !== names[i]) sequel = true;

            addQuery(cleanedQueries, cleaned);
            addQuery(rawQueries, names[i]);
            addNorm(names[i]);
            addNorm(cleaned);

            // «Тайтл: подзаголовок» — в TMDB часто только «Тайтл».
            var colon = cleaned.split(/[:：]/)[0].trim();
            if (colon !== cleaned && colon.length >= 4) {
                addNorm(colon);
                addQuery(colonQueries, colon);
            }
        }

        var extra = (anime.synonyms || []).concat(anime.english || [], anime.japanese || []);
        if (anime.license_name_ru) extra.push(anime.license_name_ru);
        for (i = 0; i < extra.length; i++) addNorm(extra[i]);

        var queries = [];
        var all = cleanedQueries.concat(colonQueries, rawQueries);
        for (i = 0; i < all.length; i++) addQuery(queries, all[i]);

        return {
            queries: queries.slice(0, MAX_QUERIES),
            norms: norms,
            year: yearOf(anime.aired_on),
            movie: anime.kind === 'movie',
            sequel: sequel
        };
    }

    function hasGenre(item, id) {
        var genres = item.genre_ids || [];
        for (var i = 0; i < genres.length; i++) if (genres[i] === id) return true;
        return false;
    }

    /**
     * Очки кандидата TMDB. -1 — точно не аниме (игровая экранизация и т.п.).
     * Точное название даёт 4, «анимация» и азиатский язык — по 1, совпадение
     * типа — 1, года — 2. Так экранизации и одноимённые фильмы не перебивают сериал.
     */
    function score(item, ctx) {
        var method = item.media_type;
        var lang = item.original_language;
        var anime = hasGenre(item, 16);
        var asian = lang === 'ja' || lang === 'zh' || lang === 'ko';

        if (method !== 'tv' && method !== 'movie') return -1;
        if (!anime && !asian) return -1;

        var points = (anime ? 1 : 0) + (asian ? 1 : 0);
        var titles = [item.name, item.original_name, item.title, item.original_title];
        var exact = false;
        var partial = false;

        for (var i = 0; i < titles.length; i++) {
            var n = normalize(titles[i]);
            if (!n) continue;
            if (ctx.norms[n]) exact = true;

            for (var known in ctx.norms) {
                if (known.length >= 4 && n.length >= 4 && (known.indexOf(n) >= 0 || n.indexOf(known) >= 0)) partial = true;
            }
        }

        if (exact) points += 4;
        else if (partial) points += 1;

        if ((method === 'movie') === ctx.movie) points += 1;

        var year = yearOf(item.first_air_date || item.release_date);

        if (year && ctx.year) {
            if (year === ctx.year) points += 2;
            else if (ctx.sequel && year < ctx.year) points += 1;
            else if (Math.abs(year - ctx.year) > 1) points -= 2;
        }

        return points;
    }

    function toMatch(item, method, points) {
        return {
            id: item.id,
            method: method,
            title: item.name || item.title || item.original_name || item.original_title || '',
            original: item.original_name || item.original_title || '',
            year: yearOf(item.first_air_date || item.release_date),
            score: points || 0,
            card: item
        };
    }

    /**
     * Перебирает запросы к TMDB search/multi.
     * stopEarly: остановиться на первом уверенном совпадении (обычное открытие);
     * без него собираются все кандидаты (ручной выбор).
     */
    function searchByTitles(net, anime, stopEarly, done) {
        var ctx = searchContext(anime);
        var found = {};
        var list = [];
        var index = 0;

        function finish() {
            list.sort(function (a, b) { return b.score - a.score; });
            done(list);
        }

        function next() {
            if (index >= ctx.queries.length) return finish();

            var query = ctx.queries[index++];

            tmdb(net, 'search/multi?include_adult=false&query=' + encodeURIComponent(query), function (json) {
                var results = json && isArray(json.results) ? json.results : [];
                var confident = false;

                for (var i = 0; i < results.length; i++) {
                    var item = results[i];
                    var points = score(item, ctx);
                    if (points < 0) continue;

                    var uid = item.media_type + item.id;

                    if (!found[uid]) {
                        found[uid] = toMatch(item, item.media_type, points);
                        list.push(found[uid]);
                    }
                    else if (points > found[uid].score) found[uid].score = points;

                    if (points >= CONFIDENT) confident = true;
                }

                if (confident && stopEarly) finish();
                else next();
            }, next);
        }

        next();
    }

    /* ------------------------------------------------------------------ *
     * Сопоставление с TMDB: ARM (MyAnimeList -> imdb / tvdb)
     * ------------------------------------------------------------------ */

    function pickFound(json, movie) {
        if (!json) return null;

        var movies = json.movie_results || [];
        var shows = json.tv_results || [];
        var seasons = (json.tv_season_results || []).concat(json.tv_episode_results || []);

        if (movie && movies.length) return toMatch(movies[0], 'movie');
        if (shows.length) return toMatch(shows[0], 'tv');
        if (seasons.length && seasons[0].show_id) return { id: seasons[0].show_id, method: 'tv', title: '' };
        if (movies.length) return toMatch(movies[0], 'movie');

        return null;
    }

    function searchByArm(net, anime, done) {
        if (!get('arm', true)) return done(null);

        request(net, ARM_URL + encodeURIComponent(anime.id), 6000, function (ids) {
            if (!ids || typeof ids !== 'object') return done(null);

            var movie = anime.kind === 'movie';
            var lookups = [];

            if (ids.imdb) lookups.push(['imdb_id', ids.imdb]);
            if (ids.thetvdb) lookups.push(['tvdb_id', ids.thetvdb]);

            function next() {
                var lookup = lookups.shift();

                if (!lookup) {
                    // Прямой id TMDB берём только для фильмов: тип id в ARM не указан.
                    return done(movie && ids.themoviedb ? { id: ids.themoviedb, method: 'movie', title: '' } : null);
                }

                tmdb(net, 'find/' + encodeURIComponent(lookup[1]) + '?external_source=' + lookup[0], function (json) {
                    var match = pickFound(json, movie);
                    if (match) done(match);
                    else next();
                }, next);
            }

            next();
        }, function () {
            done(null);
        });
    }

    /* ------------------------------------------------------------------ *
     * Полная информация о тайтле (английское и японское названия)
     * ------------------------------------------------------------------ */

    function loadDetails(net, anime, done) {
        if (anime.japanese || anime.english) return done(anime);

        shikimori(net, '/api/animes/' + encodeURIComponent(anime.id), function (full) {
            done(full && full.id ? full : anime);
        }, function () {
            done(anime);
        });
    }

    /* ------------------------------------------------------------------ *
     * Открытие карточки
     * ------------------------------------------------------------------ */

    /** Карточка каталога, для которой открыта полная карточка TMDB (см. onFullLoaded). */
    var opened = null;

    /** Запомнить сопоставление и сразу привязать карточку каталога к TMDB. */
    function remember(card, match) {
        cacheSet(card.shikimori.id, match);
        linkCard(card, cacheGet(card.shikimori.id));
    }

    function openFull(match, catalogCard) {
        var source = cardSource();
        var card = match.card || { id: match.id };

        card.source = source;

        opened = catalogCard ? { card: catalogCard, id: match.id } : null;

        Lampa.Activity.push({
            url: '',
            component: 'full',
            id: match.id,
            method: match.method,
            card: card,
            source: source
        });
    }

    /**
     * Полная карточка загрузилась: дописываем в кэш оригинальное название.
     * Нужно, когда TMDB id пришёл без названия (ARM -> сезон или фильм)
     * или сопоставление сохранено старой версией плагина.
     */
    function onFullLoaded(movie) {
        if (!opened || !movie || movie.id !== opened.id) return;

        var card = opened.card;
        var original = movie.original_name || movie.original_title;
        var entry = cacheGet(card.shikimori.id);

        opened = null;

        if (!entry || entry.id !== movie.id || !original || entry.original === original) return;

        remember(card, {
            id: movie.id,
            method: movie.original_name ? 'tv' : 'movie',
            title: movie.name || movie.title || entry.title,
            original: original
        });
    }

    /**
     * Долгая операция под слоем загрузки с отменой по «Назад».
     * work(net, finish): finish срабатывает один раз; после отмены результат игнорируется.
     */
    function withLoading(work, after) {
        var net = new Lampa.Reguest();
        var done = false;

        Lampa.Loading.start(function () {
            done = true;
            net.clear();
            Lampa.Loading.stop();
        });

        work(net, function (result) {
            if (done) return;

            done = true;
            Lampa.Loading.stop();
            after(result);
        });
    }

    function chooseMatch(card, matches) {
        var controller = Lampa.Controller.enabled().name;
        var items = [];

        for (var i = 0; i < matches.length && i < 15; i++) {
            var m = matches[i];

            items.push({
                title: escape(m.title + (m.year ? ' (' + m.year + ')' : '')),
                subtitle: escape((m.method === 'tv' ? 'Сериал' : 'Фильм') + (m.original && m.original !== m.title ? ' · ' + m.original : '')),
                match: m
            });
        }

        Lampa.Select.show({
            title: 'TMDB: ' + card.title,
            items: items,
            onSelect: function (item) {
                remember(card, item.match);
                openFull(item.match, card);
            },
            onBack: function () {
                Lampa.Controller.toggle(controller);
            }
        });
    }

    function notFound(card) {
        Lampa.Noty.show('Не нашёл «' + escape(card.title) + '» в TMDB');
    }

    function openCard(card) {
        var anime = card.shikimori;
        var cached = cacheGet(anime.id);

        if (cached) return openFull(cached, card);

        withLoading(function (net, finish) {
            searchByArm(net, anime, function (match) {
                if (match) return finish({ match: match, list: [] });

                loadDetails(net, anime, function (full) {
                    searchByTitles(net, full, true, function (list) {
                        var best = list[0];
                        finish({ match: best && best.score >= ACCEPT ? best : null, list: list });
                    });
                });
            });
        }, function (result) {
            if (result.match) {
                remember(card, result.match);
                openFull(result.match, card);
            }
            else if (result.list.length) chooseMatch(card, result.list);
            else notFound(card);
        });
    }

    function chooseManually(card) {
        withLoading(function (net, finish) {
            loadDetails(net, card.shikimori, function (full) {
                searchByTitles(net, full, false, finish);
            });
        }, function (list) {
            if (list.length) chooseMatch(card, list);
            else notFound(card);
        });
    }

    /**
     * Меню по долгому нажатию.
     * onHide(): убрать карточку с экрана — у Lampa 3 и 2 это делается по-разному.
     */
    function showMenu(card, onHide) {
        var controller = Lampa.Controller.enabled().name;
        var anime = card.shikimori;
        var cached = cacheGet(anime.id);

        var items = [
            { title: 'Открыть карточку', action: 'open' },
            { title: 'Скрыть', subtitle: 'Вернуть можно в Настройки → Shikimori', action: 'hide' },
            { title: 'Подобрать в TMDB вручную', subtitle: 'Если открылось не то аниме', action: 'manual' }
        ];

        if (cached) {
            items.push({
                title: 'Сбросить сопоставление',
                subtitle: escape('Сейчас: ' + (cached.title || 'TMDB #' + cached.id)),
                action: 'reset'
            });
        }

        Lampa.Select.show({
            title: card.title,
            items: items,
            onSelect: function (item) {
                Lampa.Controller.toggle(controller);

                if (item.action === 'open') openCard(card);
                if (item.action === 'manual') chooseManually(card);
                if (item.action === 'hide') {
                    hideAnime(card);
                    if (onHide) onHide();
                    Lampa.Noty.show('«' + escape(card.title) + '» скрыто');
                }
                if (item.action === 'reset') {
                    cacheRemove(anime.id);
                    unlinkCard(card);
                    Lampa.Noty.show('Сопоставление сброшено');
                }
            },
            onBack: function () {
                Lampa.Controller.toggle(controller);
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * Компонент каталога
     * ------------------------------------------------------------------ */

    function isModern() {
        return !!(Lampa.Maker && Lampa.Maker.make && Lampa.Manifest && Lampa.Manifest.app_digital >= 300);
    }

    /**
     * Общая логика страниц. Точного числа страниц Shikimori не отдаёт: пока
     * страницы полные, обещаем ещё. После последней отвечаем пустым списком
     * без сети — категория продолжает звать «следующую» при прокрутке до конца.
     */
    function pager(net, modern) {
        var ended = false;

        return function (page, ok, fail) {
            if (ended) return ok({ results: [], page: page, total_pages: page });

            loadPage(net, page, modern, function (data) {
                ended = !data.more;
                data.total_pages = ended ? page : page + 100;
                ok(data);
            }, fail);
        };
    }

    /**
     * Lampa 3: убрать карточку из сетки на лету. Готового метода в категории нет,
     * поэтому чистим её списки (items, pages) сами: иначе навигация пультом
     * и подгрузка страниц продолжали бы видеть удалённый элемент.
     * Фокус переходит на соседнюю карточку.
     */
    function removeItem(comp, item, controller) {
        var index = comp.items ? comp.items.indexOf(item) : -1;
        if (index < 0) return;

        var neighbour = comp.items[index + 1] || comp.items[index - 1] || null;

        comp.items.splice(index, 1);

        for (var page in comp.pages) {
            var list = comp.pages[page].items;
            var at = list.indexOf(item);
            if (at >= 0) list.splice(at, 1);
        }

        item.destroy();

        comp.last = neighbour ? neighbour.render(true) : null;
        comp.active = neighbour ? comp.items.indexOf(neighbour) : 0;

        // Контроллер категории пересобирает коллекцию из DOM и фокусирует comp.last.
        Lampa.Controller.toggle(controller);
    }

    /** Lampa 3.x: модульная категория (как «Релизы» в самой Lampa). */
    function componentModern(object) {
        var comp = Lampa.Maker.make('Category', object);
        var net = new Lampa.Reguest();
        var load = pager(net, true);

        comp.use({
            onCreate: function () {
                load(object.page || 1, this.build.bind(this), this.empty.bind(this));
            },
            onNext: function (resolve, reject) {
                var self = this;

                load(object.page, function (data) {
                    // Модуль Next сам total_pages не обновляет — останавливаем подгрузку.
                    if (data.total_pages <= object.page) self.total_pages = object.page;
                    resolve.call(self, data);
                }, reject.bind(this));
            },
            onInstance: function (item, card) {
                var self = this;

                item.use({
                    onCreate: function () {
                        addBadge(this.html, card);
                        refreshProgress(this.html, card);
                    },
                    // Watched шлёт update, когда меняется прогресс просмотра.
                    onUpdate: function () {
                        refreshProgress(this.html, card);
                    },
                    onFocus: function () {
                        refreshProgress(this.html, card);
                        Lampa.Background.change(Lampa.Utils.cardImgBackground(card));
                    },
                    onEnter: function () {
                        openCard(card);
                    },
                    onLong: function () {
                        var controller = Lampa.Controller.enabled().name;

                        showMenu(card, function () {
                            removeItem(self, item, controller);
                        });
                    }
                });
            },
            onDestroy: function () {
                net.clear();
            }
        });

        return comp;
    }

    /**
     * Lampa 2: список карточек старой категории закрыт в замыкании, и удалённый
     * элемент остался бы в навигации — фокус мог бы уйти на невидимую карточку.
     * Поэтому только гасим её; при следующем открытии каталога её не будет.
     */
    function fadeHidden(root) {
        if (!root || !root.querySelector) return;

        root.style.opacity = '0.3';

        var view = root.querySelector('.card__view');
        if (!view || view.querySelector('.' + ID + '__hidden')) return;

        var marker = document.createElement('div');
        marker.className = 'card__marker card__marker--thrown ' + ID + '__hidden';
        marker.appendChild(document.createElement('span'));
        marker.firstChild.textContent = 'Скрыто';
        view.appendChild(marker);
    }

    /** Lampa 2.x: классическая категория. */
    function componentLegacy(object) {
        var comp = new Lampa.InteractionCategory(object);
        var net = new Lampa.Reguest();
        var load = pager(net, false);
        var destroy = comp.destroy;

        comp.create = function () {
            this.activity.loader(true);
            load(object.page || 1, this.build.bind(this), this.empty.bind(this));
            return this.render();
        };

        comp.nextPageReuest = function (params, resolve, reject) {
            load(params.page, resolve.bind(comp), reject.bind(comp));
        };

        comp.cardRender = function (params, card, item) {
            var focus = item.onFocus;

            item.onEnter = function () { openCard(card); };
            item.onMenu = function () {
                showMenu(card, function () { fadeHidden(item.render(true)); });
            };
            item.onFocus = function (target, data) {
                refreshProgress(item.render(true), card);
                if (focus) focus.call(item, target, data);
            };

            addBadge(item.render(true), card);
            refreshProgress(item.render(true), card);
        };

        comp.destroy = function () {
            net.clear();
            destroy.call(comp);
        };

        return comp;
    }

    /* ------------------------------------------------------------------ *
     * Меню и настройки
     * ------------------------------------------------------------------ */

    function openCatalog() {
        Lampa.Activity.push({
            url: '',
            title: 'Shikimori — онгоинги',
            component: COMPONENT,
            page: 1
        });
    }

    function addMenu() {
        if ($('.menu .menu__item[data-action="' + ID + '"]').length) return;

        var button = $(
            '<li class="menu__item selector" data-action="' + ID + '">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">Shikimori</div>' +
            '</li>'
        );

        button.on('hover:enter', openCatalog);

        // Рядом с родным «Аниме», если оно есть в меню.
        var anime = $('.menu .menu__item[data-action="anime"]').eq(0);

        if (anime.length) anime.after(button);
        else $('.menu .menu__list').eq(0).append(button);
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: 'Shikimori',
            icon: ICON
        });

        function param(name, type, def, title, description, values, onChange) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: key(name), type: type, values: values, default: def },
                field: { name: title, description: description },
                onChange: onChange
            });
        }

        var domains = {};
        for (var i = 0; i < MIRRORS.length; i++) domains[MIRRORS[i]] = MIRRORS[i];

        param('order', 'select', 'popularity', 'Сортировка', '', ORDERS);
        param('kind', 'select', 'tv_ona', 'Форматы', '', {
            tv: 'Только TV-сериалы',
            tv_ona: 'TV + ONA (веб-сериалы)',
            all: 'Все, включая фильмы и OVA'
        });
        param('censored', 'trigger', true, 'Скрывать 18+');
        param('domain', 'select', MIRRORS[0], 'Домен Shikimori',
            'При недоступности автоматически пробуются остальные зеркала', domains, function () {
                aliveMirror = '';
            });
        param('arm', 'trigger', true, 'Точное сопоставление через ARM',
            'Ищет TMDB по id MyAnimeList (arm.haglund.dev). Выключите, если сервис недоступен');
        param('hidden', 'button', '', 'Скрытые аниме',
            'Вернуть в каталог то, что скрыто долгим нажатием на карточку', undefined, showHidden);
        param('reset', 'button', '', 'Сбросить все сопоставления',
            'Карточки будут заново найдены в TMDB', undefined, function () {
                Lampa.Storage.set(key('map'), {});
                Lampa.Noty.show('Сопоставления сброшены');
            });
    }

    /* ------------------------------------------------------------------ *
     * Старт
     * ------------------------------------------------------------------ */

    function start() {
        if (window.__shikimori_catalog_ready) return;
        window.__shikimori_catalog_ready = true;

        Lampa.Component.add(COMPONENT, isModern() ? componentModern : componentLegacy);

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && e.data) onFullLoaded(e.data.movie);
        });

        addMenu();

        try {
            addSettings();
        }
        catch (error) {
            console.log('Shikimori', 'settings error', error);
        }

        // Для отладки из консоли: shikimori_catalog.clean('Sousou no Frieren 2nd Season')
        window.shikimori_catalog = {
            version: VERSION,
            clean: cleanTitle,
            normalize: normalize,
            context: searchContext,
            score: score,
            progress: progressText,
            open: openCatalog
        };

        Lampa.Manifest.plugins = {
            type: 'other',
            version: VERSION,
            name: 'Shikimori Catalog',
            description: 'Каталог онгоингов с Shikimori, открытие во встроенной карточке Lampa'
        };
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
