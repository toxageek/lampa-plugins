/**
 * TV Plugin v1.0.0
 * Переработка карточки фильма и сериала для Lampa с встроенным Filmix,
 * выбором сезонов/озвучек, новым рейтингом по реакциям, поддержкой Shikimori
 * и фоновым воспроизведением трейлера.
 *
 * ES5 — совместимость со старыми WebOS, Tizen и Android WebView.
 */
(function () {
    'use strict';

    var PLUGIN_ID = 'tv_plugin';
    var VERSION = '1.0.0';
    var FILMIX_COMPONENT = 'tv_filmix';
    var FILMIX_API_URL = 'http://filmixapp.vip/api/v2/';
    var DEFAULT_PROXY = 'https://cors.jacred.stream/';

    /* ------------------------------------------------------------------ *
     * Локализация
     * ------------------------------------------------------------------ */

    var TRANSLATIONS = {
        tv_settings_title: {
            ru: 'TV интерфейс',
            uk: 'TV інтерфейс',
            en: 'TV Interface',
            be: 'TV інтэрфейс'
        },
        tv_manifest_descr: {
            ru: 'Новый дизайн карточки фильма и сериала с встроенным Filmix, рейтингом реакций и фоновым трейлером',
            uk: 'Новий дизайн картки фільму та серіалу з вбудованим Filmix, рейтингом реакцій та фоновим трейлером',
            en: 'Redesigned movie and TV card with built-in Filmix, reaction rating bar, and background trailer',
            be: 'Новы дызайн карткі фільма і серыяла з убудаваным Filmix, рэйтынгам рэакцый і фонавым трэйлерам'
        },
        tv_sub_filmix_title: {
            ru: 'Привязка Filmix',
            uk: 'Прив’язка Filmix',
            en: 'Filmix Account',
            be: 'Прывязка Filmix'
        },
        tv_sub_filmix_descr: {
            ru: 'Авторизация устройства, токен, профиль подписки и CORS-прокси',
            uk: 'Авторизація пристрою, токен, профіль підписки та CORS-проксі',
            en: 'Device pairing, token, subscription profile, and CORS proxy',
            be: 'Аўтарызацыя прылады, токен, профіль падпіскі і CORS-проксі'
        },
        tv_sub_ratings_title: {
            ru: 'Рейтинги и бейджи',
            uk: 'Рейтинги та бейджі',
            en: 'Ratings & Badges',
            be: 'Рэйтынгі і бэйджы'
        },
        tv_sub_ratings_descr: {
            ru: 'Отображение и скрытие IMDB, Shikimori, рейтинга реакций, PG и статуса',
            uk: 'Відображення та приховування IMDB, Shikimori, рейтингу реакцій, PG та статусу',
            en: 'Show or hide IMDB, Shikimori, reaction rating bar, PG, and status',
            be: 'Адлюстраванне і ўтойванне IMDB, Shikimori, рэйтынгу рэакцый, PG і статусу'
        },
        tv_setting_show_imdb: {
            ru: 'Рейтинг IMDB',
            uk: 'Рейтинг IMDB',
            en: 'IMDB rating',
            be: 'Рэйтынг IMDB'
        },
        tv_setting_show_imdb_descr: {
            ru: 'Показывать рейтинг IMDB в правой колонке фильмов и сериалов',
            uk: 'Показувати рейтинг IMDB у правій колонці фільмів і серіалів',
            en: 'Show IMDB rating in the right column for movies and series',
            be: 'Паказваць рэйтынг IMDB у правай калонцы фільмаў і серыялаў'
        },
        tv_setting_show_shikimori: {
            ru: 'Рейтинг Shikimori (для аниме)',
            uk: 'Рейтинг Shikimori (для аніме)',
            en: 'Shikimori rating (for anime)',
            be: 'Рэйтынг Shikimori (для анімэ)'
        },
        tv_setting_show_shikimori_descr: {
            ru: 'Брать рейтинг из плагина shikimori-catalog.js, если он установлен',
            uk: 'Брати рейтинг із плагіна shikimori-catalog.js, якщо він встановлений',
            en: 'Pull anime score from shikimori-catalog.js when installed',
            be: 'Браць рэйтынг з плагіна shikimori-catalog.js, калі ён усталяваны'
        },
        tv_setting_show_new_rating: {
            ru: 'Рейтинг реакций (лайки / дизлайки)',
            uk: 'Рейтинг реакцій (лайки / дизлайки)',
            en: 'Reactions rating bar',
            be: 'Рэйтынг рэакцый (лайкі / дызлайкі)'
        },
        tv_setting_show_new_rating_descr: {
            ru: 'Шкала положительных и отрицательных оценок на основе реакций',
            uk: 'Шкала позитивних і негативних оцінок на основі реакцій',
            en: 'Weighted positive/negative bar calculated from Lampa reactions',
            be: 'Шкала станоўчых і адмоўных ацэнак на аснове рэакцый'
        },
        tv_setting_show_badges: {
            ru: 'Возрастной рейтинг (PG) и статус',
            uk: 'Віковий рейтинг (PG) і статус',
            en: 'Age rating (PG) and status',
            be: 'Узроставы рэйтынг (PG) і статус'
        },
        tv_setting_bg_trailer: {
            ru: 'Фоновый трейлер в карточке',
            uk: 'Фоновий трейлер у картці',
            en: 'Background trailer on card',
            be: 'Фонавы трэйлер у картцы'
        },
        tv_setting_bg_trailer_descr: {
            ru: 'Автозапуск последнего трейлера из TMDB без звука на фоне после загрузки карточки',
            uk: 'Автозапуск останнього трейлера з TMDB без звуку на фоні після завантаження картки',
            en: 'Auto-play the latest TMDB trailer muted in the background after page load',
            be: 'Аўтазапуск апошняга трэйлера з TMDB без гуку на фоне пасля загрузкі карткі'
        },
        tv_setting_show_logo: {
            ru: 'Логотип вместо названия',
            uk: 'Логотип замість назви',
            en: 'Logo instead of title',
            be: 'Лагатып замест назвы'
        },
        tv_setting_show_logo_descr: {
            ru: 'Показывать название текстом и заменять на логотип из TMDB после загрузки',
            uk: 'Показувати назву текстом і замінювати на логотип з TMDB після завантаження',
            en: 'Show text title first and swap with TMDB logo once loaded',
            be: 'Паказваць назву тэкстам і замяняць на лагатып з TMDB пасля загрузкі'
        },
        tv_section_general: {
            ru: 'Основные',
            uk: 'Основні',
            en: 'General',
            be: 'Асноўныя'
        },
        tv_section_submenus: {
            ru: 'Подразделы',
            uk: 'Підрозділи',
            en: 'Subsections',
            be: 'Падраздзелы'
        },
        card_sections_title: {
            ru: 'Разделы карточки',
            uk: 'Розділи картки',
            en: 'Card sections',
            be: 'Раздзелы карткі'
        },
        card_sections_sub_descr: {
            ru: 'Включение, отключение и настройка порядка разделов в карточке',
            uk: 'Увімкнення, вимкнення та зміна порядку розділів у картці',
            en: 'Toggle visibility and reorder movie/series card sections',
            be: 'Уключэнне, адключэнне і парадак раздзелаў у картцы'
        },
        card_sections_enabled: {
            ru: 'Управление разделами',
            uk: 'Керування розділами',
            en: 'Manage sections',
            be: 'Кіраванне раздзеламі'
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
        card_sections_name_series_choice: {
            ru: 'Выбор серий (Filmix)',
            uk: 'Вибір серій (Filmix)',
            en: 'Episode picker (Filmix)',
            be: 'Выбар серый (Filmix)'
        },
        card_sections_descr_series_choice: {
            ru: 'Сезоны, озвучки и горизонтальный список серий с Filmix',
            uk: 'Сезони, озвучки та горизонтальний список серій з Filmix',
            en: 'Seasons, voices, and horizontal episode cards from Filmix',
            be: 'Сезоны, агучкі і гарызантальны спіс серый з Filmix'
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
            ru: 'Вернуть стандартный порядок разделов по умолчанию',
            uk: 'Повернути стандартний порядок розділів за замовчуванням',
            en: 'Restore default section order',
            be: 'Вярнуць стандартны парадак раздзелаў па змаўчанні'
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
        },
        tv_head_title: {
            ru: 'Настройка шапки',
            uk: 'Налаштування шапки',
            en: 'Header elements',
            be: 'Налада шапкі'
        },
        tv_head_descr: {
            ru: 'Отображение и скрытие кнопок и элементов в верхней панели',
            uk: 'Відображення та приховування кнопок і елементів у верхній панелі',
            en: 'Show or hide buttons and indicators in the top header bar',
            be: 'Адлюстраванне і ўтойванне кнопак і элементаў у верхняй панэлі'
        },
        tv_head_group: {
            ru: 'Отображать в шапке',
            uk: 'Відображати у шапці',
            en: 'Display in header',
            be: 'Паказваць у шапцы'
        },
        tv_head_search: { ru: 'Поиск', uk: 'Пошук', en: 'Search', be: 'Пошук' },
        tv_head_settings: { ru: 'Настройки', uk: 'Налаштування', en: 'Settings', be: 'Налады' },
        tv_head_premium: { ru: 'Премиум', uk: 'Преміум', en: 'Premium', be: 'Прэміум' },
        tv_head_profile: { ru: 'Профиль', uk: 'Профіль', en: 'Profile', be: 'Профіль' },
        tv_head_feed: { ru: 'Новости', uk: 'Новини', en: 'Feed', be: 'Навіны' },
        tv_head_notice: { ru: 'Уведомления', uk: 'Сповіщення', en: 'Notifications', be: 'Апавяшчэнні' },
        tv_head_broadcast: { ru: 'Вещание', uk: 'Мовлення', en: 'Broadcast', be: 'Вяшчанне' },
        tv_head_fullscreen: { ru: 'Полноэкранный режим', uk: 'Повноекранний режим', en: 'Fullscreen mode', be: 'Поўнаэкранны рэжым' },
        tv_head_reload: { ru: 'Обновление страницы', uk: 'Оновлення сторінки', en: 'Page reload', be: 'Абнаўленне старонкі' },
        tv_head_blackfriday: { ru: 'Черная пятница', uk: 'Чорна п’ятниця', en: 'Black Friday', be: 'Чорная пятніца' },
        tv_head_split: { ru: 'Разделитель', uk: 'Розділювач', en: 'Divider', be: 'Падзяляльнік' },
        tv_head_time: { ru: 'Время', uk: 'Годинник', en: 'Time', be: 'Час' },
        tv_watch: {
            ru: 'Смотреть',
            uk: 'Дивитись',
            en: 'Watch',
            be: 'Глядзець'
        },
        tv_season_short: {
            ru: 'Сезон',
            uk: 'Сезон',
            en: 'Season',
            be: 'Сезон'
        },
        tv_episode_short: {
            ru: 'Серия',
            uk: 'Серія',
            en: 'Episode',
            be: 'Серыя'
        },
        tv_episode_upper: {
            ru: 'СЕРИЯ',
            uk: 'СЕРІЯ',
            en: 'EPISODE',
            be: 'СЕРЫЯ'
        },
        tv_voice_label: {
            ru: 'Озвучка:',
            uk: 'Озвучка:',
            en: 'Audio:',
            be: 'Агучка:'
        },
        tv_min_short: {
            ru: 'мин',
            uk: 'хв',
            en: 'min',
            be: 'хв'
        },
        tv_days_left: {
            ru: 'Осталось дней',
            uk: 'Залишилось днів',
            en: 'Days left',
            be: 'Засталося дзён'
        },
        tv_episode_not_released: {
            ru: 'Серия ещё не вышла',
            uk: 'Серія ще не вийшла',
            en: 'Episode is not released yet',
            be: 'Серыя яшчэ не выйшла'
        },
        tv_episode_not_on_filmix: {
            ru: 'Серия пока недоступна на Filmix',
            uk: 'Серія поки недоступна на Filmix',
            en: 'Episode is not yet available on Filmix',
            be: 'Серыя пакуль недаступная на Filmix'
        },
        tv_loading_filmix: {
            ru: 'Загрузка Filmix...',
            uk: 'Завантаження Filmix...',
            en: 'Loading Filmix...',
            be: 'Загрузка Filmix...'
        },
        tv_not_found_filmix: {
            ru: 'Не найдено на Filmix',
            uk: 'Не знайдено на Filmix',
            en: 'Not found on Filmix',
            be: 'Не знойдзена на Filmix'
        },
        tv_open_filmix: {
            ru: 'Найти на Filmix',
            uk: 'Знайти на Filmix',
            en: 'Search on Filmix',
            be: 'Знайсці на Filmix'
        },
        tv_sources_separator: {
            ru: 'Смотреть',
            uk: 'Дивитись',
            en: 'Watch',
            be: 'Глядзець'
        },
        tv_other_separator: {
            ru: 'Дополнительно',
            uk: 'Додатково',
            en: 'More',
            be: 'Дадаткова'
        },
        tv_filmix_name: {
            ru: 'Filmix',
            uk: 'Filmix',
            en: 'Filmix',
            be: 'Filmix'
        },
        tv_filmix_subtitle: {
            ru: 'Выбор озвучки и поиск',
            uk: 'Вибір озвучки та пошук',
            en: 'Audio selection & search',
            be: 'Выбар агучкі і пошук'
        },
        tv_filmix_watch: {
            ru: 'Смотреть на Filmix',
            uk: 'Дивитись на Filmix',
            en: 'Watch on Filmix',
            be: 'Глядзець на Filmix'
        },
        tv_filmix_video: {
            ru: 'Видео',
            uk: 'Відео',
            en: 'Video',
            be: 'Відэа'
        },
        tv_filmix_nolink: {
            ru: 'Не удалось извлечь ссылку',
            uk: 'Неможливо отримати посилання',
            en: 'Failed to fetch link',
            be: 'Не ўдалося атрымаць спасылку'
        },
        tv_filmix_helper: {
            ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
            uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
            en: 'Hold "OK" to open context menu',
            be: 'Утрымлівайце "ОК" для выкліку кантэкстнага меню'
        },
        tv_filmix_modal_text: {
            ru: 'Введите код на странице https://filmix.my/consoles',
            uk: 'Введіть код на сторінці https://filmix.my/consoles',
            en: 'Enter the code on https://filmix.my/consoles',
            be: 'Увядзіце код на старонцы https://filmix.my/consoles'
        },
        tv_filmix_modal_wait: {
            ru: 'Ожидаем код',
            uk: 'Очікуємо код',
            en: 'Waiting for code',
            be: 'Чакаем код'
        },
        tv_filmix_copy_ok: {
            ru: 'Скопировано в буфер обмена',
            uk: 'Скопійовано в буфер обміну',
            en: 'Copied to clipboard',
            be: 'Скапіравана ў буфер абмену'
        },
        tv_filmix_copy_fail: {
            ru: 'Ошибка при копировании',
            uk: 'Помилка при копіюванні',
            en: 'Copy error',
            be: 'Памылка капіравання'
        },
        tv_filmix_voice_subscribe: {
            ru: 'Подписаться на перевод',
            uk: 'Підписатися на переклад',
            en: 'Subscribe to translation',
            be: 'Падпісацца на пераклад'
        },
        tv_filmix_voice_ok: {
            ru: 'Вы успешно подписались',
            uk: 'Ви успішно підписалися',
            en: 'Successfully subscribed',
            be: 'Вы паспяхова падпісаліся'
        },
        tv_filmix_voice_err: {
            ru: 'Возникла ошибка',
            uk: 'Виникла помилка',
            en: 'An error occurred',
            be: 'Узнікла памылка'
        },
        tv_filmix_clear_marks: {
            ru: 'Очистить все метки',
            uk: 'Очистити всі мітки',
            en: 'Clear all labels',
            be: 'Ачысціць усе пазнакі'
        },
        tv_filmix_clear_timecodes: {
            ru: 'Очистить все тайм-коды',
            uk: 'Очистити всі тайм-коди',
            en: 'Clear all timecodes',
            be: 'Ачысціць усе тайм-коды'
        },
        tv_filmix_no_results: {
            ru: 'Поиск не дал результатов',
            uk: 'Пошук не дав результатів',
            en: 'Search returned no results',
            be: 'Пошук не даў вынікаў'
        },
        tv_filmix_nostreams: {
            ru: 'Контент найден, но ссылки на видео недоступны. Проверьте CORS-прокси или авторизацию Filmix.',
            uk: 'Контент знайдено, але посилання на відео недоступні. Перевірте CORS-проксі або авторизацію Filmix.',
            en: 'Content found, but streams are unavailable. Check CORS proxy or Filmix authorization.',
            be: 'Кантэнт знойдзены, але спасылкі на відэа недаступныя. Праверце CORS-проксі або аўтарызацыю Filmix.'
        },
        tv_filmix_proxy_title: {
            ru: 'CORS прокси Filmix',
            uk: 'CORS проксі Filmix',
            en: 'Filmix CORS proxy',
            be: 'CORS проксі Filmix'
        },
        tv_filmix_proxy_descr: {
            ru: 'Прокси должен подменять User-Agent для filmixapp',
            uk: 'Проксі має підміняти User-Agent для filmixapp',
            en: 'Proxy must override User-Agent for filmixapp',
            be: 'Проксі павінен падмяняць User-Agent для filmixapp'
        },
        tv_filmix_token_title: {
            ru: 'Токен Filmix',
            uk: 'Токен Filmix',
            en: 'Filmix Token',
            be: 'Токен Filmix'
        },
        tv_filmix_token_descr: {
            ru: 'Добавьте токен вручную для подключения подписки',
            uk: 'Додайте токен вручну для підключення підписки',
            en: 'Add token manually to connect subscription',
            be: 'Дадайце токен уручную для падключэння падпіскі'
        },
        tv_filmix_token_placeholder: {
            ru: 'Например: nxjekeb57385b..',
            uk: 'Наприклад: nxjekeb57385b..',
            en: 'Example: nxjekeb57385b..',
            be: 'Напрыклад: nxjekeb57385b..'
        },
        tv_filmix_add_device: {
            ru: 'Добавить устройство на Filmix',
            uk: 'Додати пристрій на Filmix',
            en: 'Pair device on Filmix',
            be: 'Дадаць прыладу на Filmix'
        },
        tv_filmix_nodevice: {
            ru: 'Устройство не авторизовано',
            uk: 'Пристрій не авторизований',
            en: 'Device not authorized',
            be: 'Прылада не аўтарызавана'
        },
        tv_filmix_sub_free: {
            ru: 'Бесплатно',
            uk: 'Безкоштовно',
            en: 'Free',
            be: 'Бясплатна'
        },
        tv_filmix_sub_days: {
            ru: 'Осталось дней',
            uk: 'Залишилось днів',
            en: 'Days left',
            be: 'Засталося дзён'
        },
        tv_filmix_max_quality: {
            ru: 'Макс. качество',
            uk: 'Макс. якість',
            en: 'Max quality',
            be: 'Макс. якасць'
        },
        tv_filmix_video_server: {
            ru: 'Видео сервер',
            uk: 'Відео сервер',
            en: 'Video server',
            be: 'Відэа сервер'
        },
        tv_filmix_refresh: {
            ru: 'Обновить профиль Filmix',
            uk: 'Оновити профіль Filmix',
            en: 'Refresh Filmix profile',
            be: 'Абнавіць профіль Filmix'
        },
        tv_filmix_pro_until: {
            ru: 'Подписка до',
            uk: 'Підписка до',
            en: 'Subscription until',
            be: 'Падпіска да'
        },
        tv_filmix_profile_updated: {
            ru: 'Профиль Filmix обновлён',
            uk: 'Профіль Filmix оновлено',
            en: 'Filmix profile updated',
            be: 'Профіль Filmix абноўлены'
        }
    };

    /* ------------------------------------------------------------------ *
     * SVG-иконки (в стиле Figma-макета, с currentColor для фокуса)
     * ------------------------------------------------------------------ */

    var SVG = {
        play: '<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="17" cy="17" r="14.5" stroke="currentColor" stroke-width="2.5"/><path d="M22.2 16.13C22.87 16.52 22.87 17.48 22.2 17.87L14.8 22.14C14.13 22.53 13.3 22.04 13.3 21.27V12.73C13.3 11.96 14.13 11.47 14.8 11.86L22.2 16.13Z" fill="currentColor"/></svg>',
        book: '<svg viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 2.5H21.5C21.78 2.5 22 2.72 22 3V30.1C22 30.52 21.52 30.76 21.18 30.5L13.52 24.66C12.62 23.97 11.38 23.97 10.48 24.66L2.82 30.5C2.48 30.76 2 30.52 2 30.1V3C2 2.72 2.22 2.5 2.5 2.5Z" stroke="currentColor" stroke-width="2.5"/></svg>',
        reaction: '<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="17" cy="17" r="14.5" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="14" r="2" fill="currentColor"/><circle cx="22" cy="14" r="2" fill="currentColor"/><path d="M11.5 20.5C13 23 15 24 17 24C19 24 21 23 22.5 20.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
        options: '<svg viewBox="0 0 34 10" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4.7" cy="5" r="4" fill="currentColor"/><circle cx="17" cy="5" r="4" fill="currentColor"/><circle cx="29.3" cy="5" r="4" fill="currentColor"/></svg>',
        subscribe: '<svg viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.02 24C6.27 27.36 9.08 30 12.5 30C15.92 30 18.73 27.36 18.98 24H15.96C15.72 25.7 14.26 27 12.5 27C10.74 27 9.28 25.7 9.04 24H6.02Z" fill="currentColor"/><path d="M3.82 14.6V10.27C3.82 5.41 7.72 1.5 12.5 1.5C17.28 1.5 21.18 5.41 21.18 10.27V14.6C21.18 15.85 21.54 17.07 22.22 18.12L23.07 19.45C24.21 21.21 22.94 23.5 20.91 23.5H4.09C2.06 23.5 0.79 21.21 1.93 19.45L2.78 18.12C3.46 17.07 3.82 15.85 3.82 14.6Z" stroke="currentColor" stroke-width="2.5"/></svg>',
        like: '<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 14.2V28.2H5.6C4.16 28.2 3 27.04 3 25.6V16.8C3 15.36 4.16 14.2 5.6 14.2H9.5ZM12.3 13.4L17.45 5.4C18.1 4.4 19.55 4.25 20.4 5.1C21.12 5.82 21.35 6.88 21.02 7.85L19.65 11.9H27.15C29.15 11.9 30.65 13.72 30.25 15.68L28.55 24.48C28.18 26.64 26.3 28.2 24.1 28.2H12.3V13.4Z" fill="#75c71b"/></svg>',
        dislike: '<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.5 19.8V5.8H28.4C29.84 5.8 31 6.96 31 8.4V17.2C31 18.64 29.84 19.8 28.4 19.8H24.5ZM21.7 20.6L16.55 28.6C15.9 29.6 14.45 29.75 13.6 28.9C12.88 28.18 12.65 27.12 12.98 26.15L14.35 22.1H6.85C4.85 22.1 3.35 20.28 3.75 18.32L5.45 9.52C5.82 7.36 7.7 5.8 9.9 5.8H21.7V20.6Z" fill="#ff293d"/></svg>',
        chevron: '<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        filter: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.33 5H16.67M5.83 10H14.17M8.33 15H11.67" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
        settings: '<svg viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="33" height="25" rx="4" stroke="currentColor" stroke-width="2.6"/><rect x="5.5" y="13.5" width="16" height="3.6" rx="1.8" fill="currentColor"/><rect x="5.5" y="19.5" width="9.5" height="2.8" rx="1.4" fill="currentColor"/><rect x="24.5" y="19.5" width="6" height="2.8" rx="1.4" fill="currentColor"/></svg>',
        filmixIcon: '<svg viewBox="0 0 135 147" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M121.5 96.88C139.5 86.49 139.5 60.51 121.5 50.12L41.25 3.78C23.25 -6.61 0.75 6.38 0.75 27.17V51.97C4.7 35.75 23.62 26.81 39.05 35.77L94.85 68.15C110.25 77.09 111.91 97.87 99.87 109.37L121.5 96.88Z" fill="currentColor"/><path d="M63 84.98C80.33 94.99 80.33 120.01 63 130.02L39.75 143.44C22.42 153.45 0.75 140.94 0.75 120.92V94.08C0.75 74.06 22.42 61.55 39.75 71.56L63 84.98Z" fill="currentColor"/></svg>'
    };

    /* ------------------------------------------------------------------ *
     * Утилиты
     * ------------------------------------------------------------------ */

    function t(key, fallback) {
        try {
            var val = Lampa.Lang.translate(key);
            if (val && val !== key) return val;
        } catch (e) {}
        return fallback !== undefined ? fallback : key;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getBoolSetting(name, def) {
        var val = Lampa.Storage.get(name, def ? 'true' : 'false');
        if (val === '' || val === null || typeof val === 'undefined') return !!def;
        return val === true || val === 'true' || val === 1 || val === '1';
    }

    function isSerialMovie(movie) {
        if (!movie) return false;
        return !!(movie.original_name || movie.name || movie.first_air_date || movie.number_of_seasons);
    }

    function isAnimeMovie(movie) {
        if (!movie) return false;
        var lang = movie.original_language;
        var genres = movie.genres || [];
        var hasAnimation = false;
        for (var i = 0; i < genres.length; i++) {
            if (genres[i] === 16 || (genres[i] && genres[i].id === 16)) {
                hasAnimation = true;
                break;
            }
        }
        return hasAnimation && (lang === 'ja' || lang === 'zh' || lang === 'ko');
    }

    function normalizeTitle(str) {
        return String(str || '').toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
    }

    function arrayFind(arr, predicate) {
        if (!Array.isArray(arr)) return null;
        for (var i = 0; i < arr.length; i++) {
            if (predicate(arr[i], i)) return arr[i];
        }
        return null;
    }

    function formatQualityBadge(q) {
        var num = parseInt(q, 10) || 0;
        if (num >= 2160) return '4K';
        if (num > 0) return num + 'p';
        return '';
    }

    function getOriginalTitle(movie) {
        if (!movie) return '';
        return movie.original_name || movie.original_title || movie.name || movie.title || '';
    }

    function makeEpisodeTimelineHash(movie, season, episode) {
        var orig = getOriginalTitle(movie);
        var sep = season > 10 ? ':' : '';
        return Lampa.Utils.hash([season, sep, episode, orig].join(''));
    }

    function makeLegacyEpisodeTimelineHash(movie, season, episode) {
        var orig = movie.original_title || movie.original_name || '';
        return Lampa.Utils.hash([season, episode, orig].join(''));
    }

    function getEpisodeTimeline(movie, season, episode) {
        var hash = makeEpisodeTimelineHash(movie, season, episode);
        var view = Lampa.Timeline.view(hash);
        if ((!view || !view.percent) && season > 10) {
            var legacy = Lampa.Timeline.view(makeLegacyEpisodeTimelineHash(movie, season, episode));
            if (legacy && legacy.percent > 0) return legacy;
        }
        return view || { hash: hash, percent: 0, time: 0, duration: 0 };
    }

    function makeMovieTimelineHash(movie) {
        return Lampa.Utils.hash(getOriginalTitle(movie));
    }

    function formatDaysLeft(airDateStr) {
        if (!airDateStr) return null;
        var parsed = new Date(String(airDateStr).replace(/-/g, '/'));
        if (isNaN(parsed.getTime())) return null;
        var diff = Math.ceil((parsed.getTime() - Date.now()) / 86400000);
        return diff;
    }

    /* ------------------------------------------------------------------ *
     * Встроенный модуль Filmix (собственная реализация на базе fx.js)
     * ------------------------------------------------------------------ */

    var Filmix = (function () {
        var pingAuthTimer = null;
        var postCache = {};
        var searchCache = {};
        var state = {
            maxQuality: 720,
            profileChecked: false
        };

        function getUid() {
            var uid = Lampa.Storage.value('tv_filmix_uid', '');
            if (!uid) {
                var legacyUid = Lampa.Storage.value('fxapi_uid', '');
                uid = legacyUid || Lampa.Utils.uid(16);
                Lampa.Storage.set('tv_filmix_uid', uid);
            }
            return uid;
        }

        function getProxy() {
            var raw = Lampa.Storage.value('tv_filmix_proxy', '');
            if (!raw) {
                raw = Lampa.Storage.value('fxapi_proxy', '') || DEFAULT_PROXY;
            }
            raw = String(raw || DEFAULT_PROXY).trim();
            if (raw && raw.charAt(raw.length - 1) !== '/') raw += '/';
            return raw;
        }

        function getToken() {
            var token = Lampa.Storage.value('tv_filmix_token', '');
            if (!token) {
                var seeded = Lampa.Storage.get('tv_filmix_token_seeded', false);
                if (!seeded) {
                    var legacyToken = Lampa.Storage.value('fxapi_token', '');
                    Lampa.Storage.set('tv_filmix_token_seeded', true);
                    if (legacyToken) {
                        Lampa.Storage.set('tv_filmix_token', legacyToken);
                        return legacyToken;
                    }
                }
            }
            return token;
        }

        function devToken(token) {
            var tok = typeof token === 'string' ? token : getToken();
            return 'app_lang=ru_RU&user_dev_apk=2.2.13&user_dev_id=' + getUid() +
                '&user_dev_name=Xiaomi+24069PC21G&user_dev_os=12&user_dev_token=' + tok +
                '&user_dev_vendor=Xiaomi';
        }

        function apiPath(path) {
            return getProxy() + FILMIX_API_URL + path;
        }

        function proxyPhotoUrl(url) {
            if (!url) return '';
            if (url.indexOf('//') === 0) url = 'https:' + url;
            else if (url.charAt(0) === '/') url = 'https://filmixapp.vip' + url;
            else if (url.indexOf('http://') === 0) url = 'https://' + url.substring(7);
            if (url.indexOf('filmix') > -1 || url.indexOf('thumbs.') > -1) {
                return getProxy() + url;
            }
            return url;
        }

        function isPlaylistMap(playlist) {
            return !!(playlist && !Array.isArray(playlist) && Object.keys(playlist).length > 0);
        }

        function normalizePostResponse(data) {
            if (!data || !data.player_links) return data;
            if (Array.isArray(data.player_links.playlist) && !data.player_links.playlist.length) {
                data.player_links.playlist = null;
            }
            return data;
        }

        function seasonLabelNum(key) {
            return key === '-1' ? 1 : (parseInt(key, 10) || 1);
        }

        function playlistSeasonKeys(playlist) {
            if (!isPlaylistMap(playlist)) return [];
            return Object.keys(playlist).sort(function (a, b) {
                return parseInt(a, 10) - parseInt(b, 10);
            });
        }

        function episodeMap(episodeVoice) {
            if (!episodeVoice) return {};
            if (Array.isArray(episodeVoice)) {
                var mapped = {};
                for (var i = 0; i < episodeVoice.length; i++) {
                    mapped[String(i + 1)] = episodeVoice[i];
                }
                return mapped;
            }
            return episodeVoice;
        }

        function isBlockedTranslation(name) {
            return typeof name === 'string' && name.toLowerCase().indexOf('заблокировано ') === 0;
        }

        function hasStreamLinks(data) {
            var pl = data && data.player_links;
            if (!pl) return false;
            if (pl.movie && pl.movie.length) return true;
            if (isPlaylistMap(pl.playlist)) return true;
            return false;
        }

        function getProDaysLeft(proDate) {
            if (proDate == null || proDate === '') return null;
            if (typeof proDate === 'number') {
                var ms = proDate > 9999999999 ? proDate : proDate * 1000;
                return Math.max(0, Math.ceil((ms - Date.now()) / 86400000));
            }
            var str = String(proDate).trim();
            var match = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (match) str = match[3] + '-' + match[2] + '-' + match[1];
            var ts = Date.parse(str);
            if (isNaN(ts)) return null;
            return Math.max(0, Math.ceil((ts - Date.now()) / 86400000));
        }

        function normalizeProfile(raw) {
            if (!raw || typeof raw !== 'object') return null;
            var user = raw.user_data || raw;
            if (!user || typeof user !== 'object') return null;
            var login = user.login || user.user_login || '';
            var name = user.display_name || user.name || user.username || login;
            if (!login && !name) return null;

            var photo = user.avatar || user.photo || user.avatar_url || user.user_photo || user.img || user.foto || user.image || user.avatarUrl || '';
            photo = proxyPhotoUrl(photo);

            var proDays = null;
            var directDays = user.pro_days != null ? user.pro_days :
                (user.days_left != null ? user.days_left :
                    (user.days != null ? user.days : user.day_count));
            if (directDays != null && directDays !== '') {
                proDays = parseInt(directDays, 10);
                if (isNaN(proDays)) proDays = null;
            }
            if (proDays == null && user.pro_date) proDays = getProDaysLeft(user.pro_date);

            return {
                login: login,
                name: name,
                photo: photo,
                is_pro: !!user.is_pro,
                is_pro_plus: !!user.is_pro_plus,
                pro_date: user.pro_date || '',
                pro_days: proDays,
                quality: user.is_pro_plus ? 2160 : (user.is_pro ? 1080 : 720),
                videoserver: user.videoserver || '',
                email: user.email || user.mail || '',
                id: user.id || user.user_id || ''
            };
        }

        function applyQualityFromProfile(user) {
            state.maxQuality = 720;
            if (user && user.is_pro_plus) state.maxQuality = 2160;
            else if (user && user.is_pro) state.maxQuality = 1080;
        }

        function getSubscriptionLabel(profile) {
            if (!profile) return t('tv_filmix_sub_free');
            if (profile.is_pro_plus) return 'PRO+';
            if (profile.is_pro) return 'PRO';
            return t('tv_filmix_sub_free');
        }

        function renderProfileBox() {
            var box = $('[data-name="tv_filmix_profile"]');
            if (!box.length) return;

            var profile = normalizeProfile(Lampa.Storage.get('tv_filmix_status', {}));
            var html = '';

            if (!profile) {
                html = '<div class="tv-fx-profile tv-fx-profile--empty">' + escapeHtml(t('tv_filmix_nodevice')) + '</div>';
            } else {
                var rows = [];
                rows.push('<div class="tv-fx-profile__badge">' + escapeHtml(getSubscriptionLabel(profile)) + '</div>');
                if ((profile.is_pro || profile.is_pro_plus) && profile.pro_days != null) {
                    rows.push(escapeHtml(t('tv_filmix_sub_days')) + ': <b>' + profile.pro_days + '</b>');
                }
                if ((profile.is_pro || profile.is_pro_plus) && profile.pro_date) {
                    rows.push(escapeHtml(t('tv_filmix_pro_until')) + ' ' + escapeHtml(profile.pro_date));
                }
                rows.push(escapeHtml(t('tv_filmix_max_quality')) + ': <b>' + profile.quality + 'p</b>');
                if (profile.videoserver) {
                    rows.push(escapeHtml(t('tv_filmix_video_server')) + ': ' + escapeHtml(profile.videoserver));
                }
                if (profile.email) {
                    rows.push(escapeHtml(profile.email));
                }

                var avatarLetter = escapeHtml((profile.name || profile.login).charAt(0).toUpperCase() || '?');
                var avatar = profile.photo
                    ? '<img src="' + escapeHtml(profile.photo) + '" alt="">'
                    : '<div class="tv-fx-profile__placeholder">' + avatarLetter + '</div>';

                html = '<div class="tv-fx-profile">' +
                    '<div class="tv-fx-profile__wrap">' +
                    '<div class="tv-fx-profile__avatar">' + avatar + '</div>' +
                    '<div class="tv-fx-profile__body">' +
                    '<div class="tv-fx-profile__title">' + escapeHtml(profile.name || profile.login) + '</div>' +
                    (profile.login && profile.login !== profile.name ? '<div class="tv-fx-profile__login">@' + escapeHtml(profile.login) + '</div>' : '') +
                    '<div class="tv-fx-profile__meta">' + rows.join('<br>') + '</div>' +
                    '</div></div></div>';
            }

            box.html(html);
            box.find('img').on('error', function () {
                var letter = escapeHtml(box.find('.tv-fx-profile__title').text().charAt(0).toUpperCase() || '?');
                $(this).replaceWith('<div class="tv-fx-profile__placeholder">' + letter + '</div>');
            });
        }

        function fetchUserProfile(token, callback, onError) {
            var network = new Lampa.Reguest();
            network.timeout(8000);
            network.silent(Lampa.Utils.addUrlComponent(apiPath('user_profile'), devToken(token)), function (json) {
                state.profileChecked = true;
                if (json && json.user_data) {
                    applyQualityFromProfile(json.user_data);
                    Lampa.Storage.set('tv_filmix_status', json.user_data);
                    var profile = normalizeProfile(json);
                    if (callback) callback(profile, json.user_data);
                } else {
                    Lampa.Storage.set('tv_filmix_status', {});
                    state.maxQuality = 720;
                    if (callback) callback(null);
                }
                renderProfileBox();
            }, function (a, c) {
                if (onError) onError(a, c);
                else Lampa.Noty.show(network.errorDecode(a, c));
            });
        }

        function ensureProfileReady(done) {
            var token = getToken();
            if (!state.profileChecked && token) {
                fetchUserProfile(token, function () {
                    done();
                }, function () {
                    done();
                });
            } else {
                var saved = Lampa.Storage.get('tv_filmix_status', {});
                if (saved && (saved.is_pro || saved.is_pro_plus)) applyQualityFromProfile(saved);
                done();
            }
        }

        function parseLinkQualities(link) {
            var match = link && link.match(/\[([\d,\s]*)\]/);
            if (!match) return [];
            return match[1].split(',').map(function (q) {
                return parseInt(q, 10);
            }).filter(function (q) {
                return q > 0 && q <= state.maxQuality;
            });
        }

        function maxOfList(list) {
            if (!list || !list.length) return 0;
            return Math.max.apply(null, list);
        }

        function buildQualityMap(fileUrl, maxQuality, allowedQualities) {
            var maxQ = parseInt(maxQuality, 10) || 720;
            if (!fileUrl) return { file: '', quality: false };

            var qIdx = fileUrl.indexOf('?');
            var baseUrl = qIdx > -1 ? fileUrl.slice(0, qIdx) : fileUrl;
            var queryStr = qIdx > -1 ? fileUrl.slice(qIdx) : '';
            var lastUnderscore = baseUrl.lastIndexOf('_');
            if (lastUnderscore === -1) return { file: fileUrl, quality: false };

            var linkPrefix = baseUrl.slice(0, lastUnderscore) + '_';
            var qualitiesList;

            if (allowedQualities && allowedQualities.length) {
                qualitiesList = allowedQualities.slice().filter(function (q) {
                    return q > 0 && q <= state.maxQuality;
                }).sort(function (a, b) {
                    return b - a;
                });
            } else {
                var standard = [2160, 1440, 1080, 720, 480, 360];
                var startIdx = standard.indexOf(maxQ);
                qualitiesList = startIdx > -1 ? standard.slice(startIdx) : [maxQ];
            }

            if (!qualitiesList.length) qualitiesList = [maxQ];

            var qualityMap = {};
            for (var i = 0; i < qualitiesList.length; i++) {
                qualityMap[qualitiesList[i] + 'p'] = linkPrefix + qualitiesList[i] + '.mp4' + queryStr;
            }

            var file = qualityMap[qualitiesList[0] + 'p'] || (linkPrefix + maxQ + '.mp4' + queryStr);
            var preferred = Lampa.Storage.get('video_quality_default', '1080') + 'p';
            if (qualityMap[preferred]) file = qualityMap[preferred];

            return {
                file: file,
                quality: qualityMap
            };
        }

        function parsePost(data) {
            data = normalizePostResponse(data);
            if (!data || !hasStreamLinks(data)) return null;

            var pl = data.player_links;
            var parsed = {
                id: data.id,
                title: data.title || '',
                isSerial: false,
                seasons: [],
                movies: [],
                raw: data
            };

            if (isPlaylistMap(pl.playlist)) {
                parsed.isSerial = true;
                var seasonKeys = playlistSeasonKeys(pl.playlist);

                for (var s = 0; s < seasonKeys.length; s++) {
                    var sKey = seasonKeys[s];
                    var sNum = seasonLabelNum(sKey);
                    var voicesObj = pl.playlist[sKey];
                    if (!voicesObj) continue;

                    var voicesArr = [];
                    var voiceNames = Object.keys(voicesObj);

                    for (var v = 0; v < voiceNames.length; v++) {
                        var voiceName = voiceNames[v];
                        if (isBlockedTranslation(voiceName)) continue;

                        var epMap = episodeMap(voicesObj[voiceName]);
                        var epKeys = Object.keys(epMap);
                        var episodes = [];
                        var voiceMaxQ = 0;

                        for (var e = 0; e < epKeys.length; e++) {
                            var epId = epKeys[e];
                            var epFile = epMap[epId];
                            if (!epFile || !epFile.link) continue;

                            var rawQuals = Array.isArray(epFile.qualities) ? epFile.qualities : parseLinkQualities(epFile.link);
                            var quals = rawQuals.filter(function (q) {
                                return q > 0 && q <= state.maxQuality;
                            });
                            if (!quals.length) continue;

                            var epMaxQ = maxOfList(quals);
                            if (epMaxQ > voiceMaxQ) voiceMaxQ = epMaxQ;

                            var streamUrl = epFile.link.replace('%s.mp4', epMaxQ + '.mp4');
                            var tail = streamUrl.slice(streamUrl.lastIndexOf('/'));
                            var seMatch = tail.match(/s(\d+)e(\d+?)_\d+\.mp4/i);
                            var realSeason = sNum;
                            var realEp = parseInt(epId, 10);

                            if (seMatch) {
                                realSeason = parseInt(seMatch[1], 10);
                                realEp = parseInt(seMatch[2], 10);
                            } else if (isNaN(realEp)) {
                                continue;
                            }

                            episodes.push({
                                id: realSeason + '_' + realEp,
                                season: realSeason,
                                episode: realEp,
                                rawKey: epId,
                                file: streamUrl,
                                quality: epMaxQ,
                                qualities: quals,
                                voice_name: voiceName
                            });
                        }

                        episodes.sort(function (a, b) {
                            return a.episode - b.episode;
                        });

                        if (episodes.length) {
                            voicesArr.push({
                                name: voiceName,
                                maxQuality: voiceMaxQ,
                                episodes: episodes
                            });
                        }
                    }

                    if (voicesArr.length) {
                        parsed.seasons.push({
                            key: sKey,
                            num: sNum,
                            label: t('tv_season_short') + ' ' + sNum,
                            voices: voicesArr
                        });
                    }
                }
            } else if (pl.movie && pl.movie.length) {
                for (var m = 0; m < pl.movie.length; m++) {
                    var item = pl.movie[m];
                    if (!item || isBlockedTranslation(item.translation)) continue;
                    var mQuals = parseLinkQualities(item.link);
                    var mMaxQ = maxOfList(mQuals);
                    if (!mMaxQ) continue;
                    var mUrl = item.link.replace(/_\[([\d,\s]*)\]\.mp4/i, '_' + mMaxQ + '.mp4');
                    parsed.movies.push({
                        translation: item.translation || 'Original',
                        file: mUrl,
                        quality: mMaxQ,
                        qualities: mQuals
                    });
                }
            }

            if (!parsed.seasons.length && !parsed.movies.length) return null;
            return parsed;
        }

        function getChoiceStore() {
            return Lampa.Storage.cache('tv_filmix_choice', 3000, {});
        }

        function getChoice(movieId) {
            var store = getChoiceStore();
            var entry = store[String(movieId)] || {};
            var copy = {};
            Lampa.Arrays.extend(copy, {
                filmix_id: 0,
                season: 0,
                voice: 0,
                voice_name: '',
                last_season: 0,
                last_episode: 0,
                episodes_view: {},
                movie_view: '',
                movie_voice_name: ''
            });
            Lampa.Arrays.extend(copy, entry, true);
            if (!copy.episodes_view || typeof copy.episodes_view !== 'object') copy.episodes_view = {};
            return copy;
        }

        function saveChoice(movieId, patch) {
            if (!movieId) return;
            var store = getChoiceStore();
            var current = getChoice(movieId);
            Lampa.Arrays.extend(current, patch, true);
            store[String(movieId)] = current;
            Lampa.Storage.set('tv_filmix_choice', store);
            return current;
        }

        function markEpisodeWatched(movie, season, episode, voiceName) {
            if (!movie || !movie.id) return;
            var orig = getOriginalTitle(movie);
            var hashBehold = Lampa.Utils.hash([season, episode, orig, voiceName || ''].join(''));
            var viewed = Lampa.Storage.cache('tv_filmix_viewed', 5000, []);
            if (viewed.indexOf(hashBehold) === -1) {
                viewed.push(hashBehold);
                Lampa.Storage.set('tv_filmix_viewed', viewed);
            }
            var choice = getChoice(movie.id);
            choice.episodes_view[season] = episode;
            choice.last_season = season;
            choice.last_episode = episode;
            if (voiceName) choice.voice_name = voiceName;
            saveChoice(movie.id, choice);
        }

        function isEpisodeMarked(movie, season, episode, voiceName) {
            var orig = getOriginalTitle(movie);
            var hashBehold = Lampa.Utils.hash([season, episode, orig, voiceName || ''].join(''));
            var viewed = Lampa.Storage.cache('tv_filmix_viewed', 5000, []);
            return viewed.indexOf(hashBehold) !== -1;
        }

        function unmarkEpisodeWatched(movie, season, episode, voiceName) {
            var orig = getOriginalTitle(movie);
            var hashBehold = Lampa.Utils.hash([season, episode, orig, voiceName || ''].join(''));
            var viewed = Lampa.Storage.cache('tv_filmix_viewed', 5000, []);
            var idx = viewed.indexOf(hashBehold);
            if (idx !== -1) {
                viewed.splice(idx, 1);
                Lampa.Storage.set('tv_filmix_viewed', viewed);
            }
        }

        function pickBestSearchMatch(json, movie) {
            if (!Array.isArray(json) || !json.length) return null;
            var year = parseInt(String(movie.release_date || movie.first_air_date || '0000').slice(0, 4), 10) || 0;
            var origNorm = normalizeTitle(movie.original_name || movie.original_title || '');
            var titleNorm = normalizeTitle(movie.name || movie.title || '');

            var cards = json.filter(function (c) {
                var cYear = parseInt(c.year || (c.alt_name ? String(c.alt_name).split('-').pop() : 0), 10) || 0;
                c._parsedYear = cYear;
                if (!year || !cYear) return true;
                return cYear > year - 2 && cYear < year + 2;
            });

            var card = null;
            if (origNorm) {
                card = arrayFind(cards, function (c) {
                    return (!year || c._parsedYear === year) && normalizeTitle(c.original_title) === origNorm;
                }) || arrayFind(cards, function (c) {
                    return normalizeTitle(c.original_title) === origNorm;
                });
            }
            if (!card && titleNorm) {
                card = arrayFind(cards, function (c) {
                    return (!year || c._parsedYear === year) && normalizeTitle(c.title) === titleNorm;
                }) || arrayFind(cards, function (c) {
                    return normalizeTitle(c.title) === titleNorm;
                });
            }
            if (!card && cards.length === 1) card = cards[0];
            return card;
        }

        function fetchPostById(filmixId, net, onDone) {
            var cacheKey = String(filmixId) + '_' + state.maxQuality;
            if (postCache[cacheKey]) {
                onDone(postCache[cacheKey], null);
                return;
            }
            ensureProfileReady(function () {
                var cKey = String(filmixId) + '_' + state.maxQuality;
                if (postCache[cKey]) {
                    onDone(postCache[cKey], null);
                    return;
                }
                net.timeout(10000);
                net.silent(Lampa.Utils.addUrlComponent(apiPath('post/' + filmixId), devToken()), function (found) {
                    var parsed = parsePost(found);
                    if (parsed) postCache[cKey] = parsed;
                    onDone(parsed, found);
                }, function () {
                    onDone(null, null);
                });
            });
        }

        function resolveForMovie(movie, net, onDone) {
            if (!movie) return onDone(null, []);
            var choice = getChoice(movie.id);

            if (choice.filmix_id) {
                fetchPostById(choice.filmix_id, net, function (parsed) {
                    if (parsed) onDone(parsed, []);
                    else searchFlow();
                });
                return;
            }

            searchFlow();

            function searchFlow() {
                var query = movie.original_name || movie.original_title || movie.name || movie.title || '';
                var fallbackQuery = movie.name || movie.title || '';
                if (!query) return onDone(null, []);

                var searchKey = String(movie.id) + ':' + query;
                if (searchCache[searchKey]) {
                    var cachedId = searchCache[searchKey];
                    fetchPostById(cachedId, net, function (parsed) {
                        onDone(parsed, []);
                    });
                    return;
                }

                runSearch(query, function (json) {
                    var match = pickBestSearchMatch(json, movie);
                    if (match) {
                        searchCache[searchKey] = match.id;
                        fetchPostById(match.id, net, function (parsed) {
                            onDone(parsed, json || []);
                        });
                    } else if (fallbackQuery && fallbackQuery !== query) {
                        runSearch(fallbackQuery, function (json2) {
                            var match2 = pickBestSearchMatch(json2, movie);
                            if (match2) {
                                searchCache[searchKey] = match2.id;
                                fetchPostById(match2.id, net, function (parsed) {
                                    onDone(parsed, json2 || []);
                                });
                            } else {
                                onDone(null, (json2 && json2.length) ? json2 : (json || []));
                            }
                        });
                    } else {
                        onDone(null, json || []);
                    }
                });
            }

            function runSearch(q, cb) {
                var url = Lampa.Utils.addUrlComponent(apiPath('search'), 'story=' + encodeURIComponent(q));
                url = Lampa.Utils.addUrlComponent(url, devToken());
                net.timeout(10000);
                net.silent(url, function (json) {
                    cb(Array.isArray(json) ? json : []);
                }, function () {
                    cb([]);
                });
            }
        }

        function findVoiceInSeason(seasonObj, preferredVoiceName) {
            if (!seasonObj || !seasonObj.voices || !seasonObj.voices.length) return null;
            if (preferredVoiceName) {
                var low = preferredVoiceName.toLowerCase();
                for (var i = 0; i < seasonObj.voices.length; i++) {
                    if (seasonObj.voices[i].name.toLowerCase() === low) {
                        return { index: i, voice: seasonObj.voices[i] };
                    }
                }
            }
            return { index: 0, voice: seasonObj.voices[0] };
        }

        function findResumeTarget(movie, parsed) {
            if (!parsed || !parsed.isSerial || !parsed.seasons.length) return null;

            var choice = getChoice(movie.id);
            var preferredVoice = choice.voice_name || '';

            // 1. Сначала проверим сохранённый last_season/last_episode или таймлайны
            var targetSeasonIdx = -1;
            var targetEpNum = 0;

            if (choice.last_season && choice.last_episode) {
                for (var s = 0; s < parsed.seasons.length; s++) {
                    if (parsed.seasons[s].num === choice.last_season) {
                        targetSeasonIdx = s;
                        targetEpNum = choice.last_episode;
                        break;
                    }
                }
            }

            // Проверяем, не досмотрена ли последняя серия (>= 90%), чтобы перейти к следующей
            if (targetSeasonIdx !== -1 && targetEpNum > 0) {
                var sObj = parsed.seasons[targetSeasonIdx];
                var vMatch = findVoiceInSeason(sObj, preferredVoice);
                var eps = vMatch ? vMatch.voice.episodes : [];
                var tl = getEpisodeTimeline(movie, sObj.num, targetEpNum);
                var epIdx = -1;
                for (var i = 0; i < eps.length; i++) {
                    if (eps[i].episode === targetEpNum) {
                        epIdx = i;
                        break;
                    }
                }

                if (epIdx !== -1) {
                    if (tl && tl.percent >= 90) {
                        // Переходим на следующую серию
                        if (epIdx + 1 < eps.length) {
                            return {
                                seasonIndex: targetSeasonIdx,
                                season: sObj,
                                voiceIndex: vMatch.index,
                                voice: vMatch.voice,
                                episode: eps[epIdx + 1],
                                episodeIndex: epIdx + 1
                            };
                        } else if (targetSeasonIdx + 1 < parsed.seasons.length) {
                            var nextS = parsed.seasons[targetSeasonIdx + 1];
                            var nextV = findVoiceInSeason(nextS, preferredVoice);
                            if (nextV && nextV.voice.episodes.length) {
                                return {
                                    seasonIndex: targetSeasonIdx + 1,
                                    season: nextS,
                                    voiceIndex: nextV.index,
                                    voice: nextV.voice,
                                    episode: nextV.voice.episodes[0],
                                    episodeIndex: 0
                                };
                            }
                        }
                    }
                    return {
                        seasonIndex: targetSeasonIdx,
                        season: sObj,
                        voiceIndex: vMatch.index,
                        voice: vMatch.voice,
                        episode: eps[epIdx],
                        episodeIndex: epIdx
                    };
                }
            }

            // 2. Если нет сохранённого last_episode — ищем по Lampa.Timeline последний начатый/просмотренный эпизод
            var latestUpdated = 0;
            var latestMatch = null;
            for (var si = 0; si < parsed.seasons.length; si++) {
                var sea = parsed.seasons[si];
                var vm = findVoiceInSeason(sea, preferredVoice);
                if (!vm) continue;
                for (var ei = 0; ei < vm.voice.episodes.length; ei++) {
                    var ep = vm.voice.episodes[ei];
                    var tView = getEpisodeTimeline(movie, ep.season, ep.episode);
                    if (tView && tView.percent > 0) {
                        var upd = tView.updated || (si * 1000 + ei + 1);
                        if (upd >= latestUpdated) {
                            latestUpdated = upd;
                            latestMatch = { si: si, sea: sea, vm: vm, ei: ei, ep: ep, percent: tView.percent };
                        }
                    }
                }
            }

            if (latestMatch) {
                if (latestMatch.percent >= 90) {
                    if (latestMatch.ei + 1 < latestMatch.vm.voice.episodes.length) {
                        return {
                            seasonIndex: latestMatch.si,
                            season: latestMatch.sea,
                            voiceIndex: latestMatch.vm.index,
                            voice: latestMatch.vm.voice,
                            episode: latestMatch.vm.voice.episodes[latestMatch.ei + 1],
                            episodeIndex: latestMatch.ei + 1
                        };
                    } else if (latestMatch.si + 1 < parsed.seasons.length) {
                        var ns = parsed.seasons[latestMatch.si + 1];
                        var nv = findVoiceInSeason(ns, preferredVoice);
                        if (nv && nv.voice.episodes.length) {
                            return {
                                seasonIndex: latestMatch.si + 1,
                                season: ns,
                                voiceIndex: nv.index,
                                voice: nv.voice,
                                episode: nv.voice.episodes[0],
                                episodeIndex: 0
                            };
                        }
                    }
                }
                return {
                    seasonIndex: latestMatch.si,
                    season: latestMatch.sea,
                    voiceIndex: latestMatch.vm.index,
                    voice: latestMatch.vm.voice,
                    episode: latestMatch.ep,
                    episodeIndex: latestMatch.ei
                };
            }

            // 3. По умолчанию — первый сезон, первая серия
            var defSIdx = (choice.season >= 0 && choice.season < parsed.seasons.length) ? choice.season : 0;
            var defS = parsed.seasons[defSIdx];
            var defV = findVoiceInSeason(defS, preferredVoice);
            if (!defV || !defV.voice.episodes.length) return null;

            return {
                seasonIndex: defSIdx,
                season: defS,
                voiceIndex: defV.index,
                voice: defV.voice,
                episode: defV.voice.episodes[0],
                episodeIndex: 0
            };
        }

        function playEpisode(movie, voiceObj, epIndex, tmdbMap, onAfterMark) {
            if (!voiceObj || !voiceObj.episodes || !voiceObj.episodes[epIndex]) {
                Lampa.Noty.show(t('tv_filmix_nolink'));
                return;
            }

            var playlist = [];
            var makePlayItem = function (ep) {
                var extra = buildQualityMap(ep.file, ep.quality, ep.qualities);
                var tmdbEp = tmdbMap && tmdbMap[ep.episode];
                var epTitle = tmdbEp && tmdbEp.name
                    ? (t('tv_season_short') + ' ' + ep.season + ', ' + t('tv_episode_short') + ' ' + ep.episode + ' — ' + tmdbEp.name)
                    : (t('tv_season_short') + ' ' + ep.season + ', ' + t('tv_episode_short') + ' ' + ep.episode);
                var timeline = getEpisodeTimeline(movie, ep.season, ep.episode);

                return {
                    title: epTitle,
                    url: extra.file,
                    quality: extra.quality,
                    timeline: timeline,
                    card: movie,
                    season: ep.season,
                    episode: ep.episode,
                    callback: function () {
                        markEpisodeWatched(movie, ep.season, ep.episode, voiceObj.name);
                        if (onAfterMark) onAfterMark(ep);
                    }
                };
            };

            for (var i = 0; i < voiceObj.episodes.length; i++) {
                playlist.push(makePlayItem(voiceObj.episodes[i]));
            }

            var first = playlist[epIndex];
            if (!first || !first.url) {
                Lampa.Noty.show(t('tv_filmix_nolink'));
                return;
            }

            if (movie && movie.id) Lampa.Favorite.add('history', movie, 100);
            markEpisodeWatched(movie, voiceObj.episodes[epIndex].season, voiceObj.episodes[epIndex].episode, voiceObj.name);
            if (onAfterMark) onAfterMark(voiceObj.episodes[epIndex]);

            if (playlist.length > 1) first.playlist = playlist;
            Lampa.Player.play(first);
            Lampa.Player.playlist(playlist);
        }

        function openFilmixPage(movie) {
            resetFilmixTemplates();
            Lampa.Component.add(FILMIX_COMPONENT, FilmixComponent);
            Lampa.Activity.push({
                url: '',
                title: t('tv_filmix_name'),
                component: FILMIX_COMPONENT,
                search: movie.title || movie.name || '',
                search_one: movie.title || movie.name || '',
                search_two: movie.original_title || movie.original_name || '',
                movie: movie,
                page: 1
            });
        }

        function startDevicePairing(onPaired) {
            var network = new Lampa.Reguest();
            var userCode = '';
            var userToken = '';
            var modal = $('<div><div class="broadcast__text">' + escapeHtml(t('tv_filmix_modal_text')) + '</div><div class="broadcast__device selector" style="text-align: center">' + escapeHtml(t('tv_filmix_modal_wait')) + '...</div><br><div class="broadcast__scan"><div></div></div></div>');

            clearInterval(pingAuthTimer);

            Lampa.Modal.open({
                title: '',
                html: modal,
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('settings_component');
                    clearInterval(pingAuthTimer);
                    network.clear();
                },
                onSelect: function () {
                    if (!userCode) return;
                    Lampa.Utils.copyTextToClipboard(userCode, function () {
                        Lampa.Noty.show(t('tv_filmix_copy_ok'));
                    }, function () {
                        Lampa.Noty.show(t('tv_filmix_copy_fail'));
                    });
                }
            });

            pingAuthTimer = setInterval(function () {
                if (!userToken) return;
                network.silent(Lampa.Utils.addUrlComponent(apiPath('user_profile'), devToken(userToken)), function (json) {
                    if (json && json.user_data) {
                        Lampa.Modal.close();
                        clearInterval(pingAuthTimer);
                        Lampa.Storage.set('tv_filmix_token', userToken);
                        state.profileChecked = false;
                        fetchUserProfile(userToken, function (profile) {
                            if (onPaired) onPaired(userToken, profile);
                        });
                        Lampa.Controller.toggle('settings_component');
                    }
                }, function () {});
            }, 2000);

            network.clear();
            network.timeout(10000);
            network.quiet(Lampa.Utils.addUrlComponent(apiPath('token_request'), devToken('')), function (found) {
                if (found && found.status === 'ok') {
                    userToken = found.code;
                    userCode = found.user_code;
                    modal.find('.selector').text(userCode);
                } else {
                    Lampa.Noty.show(String(found || 'Error'));
                }
            }, function (a, c) {
                Lampa.Noty.show(network.errorDecode(a, c));
            });
        }

        function resetFilmixTemplates() {
            Lampa.Template.add('tv_fx_full', '<div class="online-prestige online-prestige--full selector">' +
                '<div class="online-prestige__img"><img alt=""><div class="online-prestige__loader"></div></div>' +
                '<div class="online-prestige__body">' +
                '<div class="online-prestige__head"><div class="online-prestige__title">{title}</div><div class="online-prestige__time">{time}</div></div>' +
                '<div class="online-prestige__timeline"></div>' +
                '<div class="online-prestige__footer"><div class="online-prestige__info">{info}</div><div class="online-prestige__quality">{quality}</div></div>' +
                '</div></div>');
            Lampa.Template.add('tv_fx_empty', '<div class="online-empty">' +
                '<div class="online-empty__title" style="font-size: 2em; margin-bottom: .9em;">#{tv_filmix_no_results}</div>' +
                '<div class="online-empty__templates">' +
                '<div class="online-empty-template"><div class="online-empty-template__ico"></div><div class="online-empty-template__body"></div></div>' +
                '<div class="online-empty-template"><div class="online-empty-template__ico"></div><div class="online-empty-template__body"></div></div>' +
                '<div class="online-empty-template"><div class="online-empty-template__ico"></div><div class="online-empty-template__body"></div></div>' +
                '</div></div>');
            Lampa.Template.add('tv_fx_rate', '<div class="online-prestige-rate">' +
                '<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z" fill="#fff"></path></svg>' +
                '<span>{rate}</span></div>');
            Lampa.Template.add('tv_fx_folder', '<div class="online-prestige online-prestige--folder selector">' +
                '<div class="online-prestige__folder"><svg viewBox="0 0 128 112" fill="none" xmlns="http://www.w3.org/2000/svg"><rect y="20" width="128" height="92" rx="13" fill="white"></rect><path d="M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z" fill="white" fill-opacity="0.23"></path><rect x="11" y="8" width="106" height="76" rx="13" fill="white" fill-opacity="0.51"></rect></svg></div>' +
                '<div class="online-prestige__body">' +
                '<div class="online-prestige__head"><div class="online-prestige__title">{title}</div><div class="online-prestige__time">{time}</div></div>' +
                '<div class="online-prestige__footer"><div class="online-prestige__info">{info}</div></div>' +
                '</div></div>');
        }

        /**
         * Полноценная страница Filmix (поиск, уточнение названия, выбор сезонов, озвучек, серий)
         */
        function FilmixComponent(object) {
            var self = this;
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var files = new Lampa.Explorer(object);
            var filter = new Lampa.Filter(object);
            var last = false;
            var initialized = false;
            var images = [];
            var parsedPost = null;
            var waitSimilars = false;
            var selectedFilmixId = 0;
            var choice = {
                season: 0,
                voice: 0,
                voice_name: ''
            };
            var filterItems = {
                season: [],
                voice: []
            };

            this.initialize = function () {
                filter.onSearch = function (value) {
                    Lampa.Activity.replace({
                        search: value,
                        clarification: true
                    });
                };

                filter.onBack = function () {
                    self.start();
                };

                filter.onSelect = function (type, a, b) {
                    if (type === 'filter') {
                        if (a.reset) {
                            choice.season = 0;
                            choice.voice = 0;
                            choice.voice_name = '';
                            saveChoice(object.movie.id, { season: 0, voice: 0, voice_name: '' });
                            renderParsed();
                        } else if (a.stype === 'season') {
                            choice.season = b.index;
                            saveChoice(object.movie.id, { season: choice.season });
                            renderParsed();
                        } else if (a.stype === 'voice') {
                            choice.voice = b.index;
                            choice.voice_name = filterItems.voice[b.index] || '';
                            saveChoice(object.movie.id, { voice: choice.voice, voice_name: choice.voice_name });
                            renderParsed();
                        }
                    } else if (type === 'sort') {
                        Lampa.Select.close();
                    }
                };

                if (filter.addButtonBack) filter.addButtonBack();
                filter.render().find('.filter--sort').remove();
                files.appendFiles(scroll.render());
                files.appendHead(filter.render());
                scroll.body().addClass('torrent-list');
                scroll.minus(files.render().find('.explorer__files-head'));

                var saved = getChoice(object.movie.id);
                choice.season = saved.season || 0;
                choice.voice = saved.voice || 0;
                choice.voice_name = saved.voice_name || '';
                selectedFilmixId = saved.filmix_id || 0;

                self.search();
            };

            this.create = function () {
                return this.render();
            };

            this.search = function () {
                this.activity.loader(true);
                waitSimilars = false;

                if (!object.clarification && selectedFilmixId) {
                    loadFilmixPost(selectedFilmixId);
                    return;
                }

                var query = object.clarification
                    ? object.search
                    : (object.search || object.movie.original_title || object.movie.original_name || object.movie.title || object.movie.name || '');

                var url = Lampa.Utils.addUrlComponent(apiPath('search'), 'story=' + encodeURIComponent(query));
                url = Lampa.Utils.addUrlComponent(url, devToken());
                network.clear();
                network.timeout(10000);
                network.silent(url, function (json) {
                    if (!json || !Array.isArray(json) || !json.length) {
                        showEmpty(t('tv_filmix_no_results'));
                        return;
                    }

                    if (!object.clarification) {
                        var match = pickBestSearchMatch(json, object.movie);
                        if (match) {
                            selectedFilmixId = match.id;
                            saveChoice(object.movie.id, { filmix_id: match.id });
                            loadFilmixPost(match.id);
                            return;
                        }
                    }

                    waitSimilars = true;
                    drawSimilars(json);
                    self.loading(false);
                }, function () {
                    showEmpty(t('tv_filmix_no_results'));
                });
            };

            function loadFilmixPost(filmixId) {
                fetchPostById(filmixId, network, function (parsed, raw) {
                    if (parsed) {
                        parsedPost = parsed;
                        waitSimilars = false;
                        renderParsed();
                        self.loading(false);
                    } else if (raw && raw.id) {
                        showEmpty(t('tv_filmix_nostreams'));
                    } else {
                        showEmpty(t('tv_filmix_no_results'));
                    }
                });
            }

            function renderParsed() {
                if (!parsedPost) return;
                self.reset();

                filterItems = { season: [], voice: [] };

                if (parsedPost.isSerial) {
                    for (var i = 0; i < parsedPost.seasons.length; i++) {
                        filterItems.season.push(parsedPost.seasons[i].label);
                    }
                    if (choice.season >= parsedPost.seasons.length) choice.season = 0;
                    var seasonObj = parsedPost.seasons[choice.season];
                    if (seasonObj) {
                        for (var v = 0; v < seasonObj.voices.length; v++) {
                            filterItems.voice.push(seasonObj.voices[v].name);
                        }
                        var vm = findVoiceInSeason(seasonObj, choice.voice_name);
                        choice.voice = vm ? vm.index : 0;
                        choice.voice_name = vm ? vm.voice.name : '';
                    }
                    saveChoice(object.movie.id, {
                        filmix_id: parsedPost.id,
                        season: choice.season,
                        voice: choice.voice,
                        voice_name: choice.voice_name
                    });
                    updateFilterUI();
                    if (seasonObj && seasonObj.voices[choice.voice]) {
                        drawSerialEpisodes(seasonObj, seasonObj.voices[choice.voice]);
                    } else {
                        showEmpty(t('tv_filmix_no_results'));
                    }
                } else {
                    saveChoice(object.movie.id, { filmix_id: parsedPost.id });
                    updateFilterUI();
                    drawMovieVoices(parsedPost.movies);
                }
            }

            function updateFilterUI() {
                var select = [{ title: Lampa.Lang.translate('torrent_parser_reset'), reset: true }];
                var chosen = [];

                if (filterItems.voice.length) {
                    var vSub = [];
                    for (var i = 0; i < filterItems.voice.length; i++) {
                        vSub.push({ title: escapeHtml(filterItems.voice[i]), selected: choice.voice === i, index: i });
                    }
                    select.push({
                        title: Lampa.Lang.translate('torrent_parser_voice'),
                        subtitle: escapeHtml(filterItems.voice[choice.voice] || ''),
                        items: vSub,
                        stype: 'voice'
                    });
                    chosen.push(Lampa.Lang.translate('torrent_parser_voice') + ': ' + (filterItems.voice[choice.voice] || ''));
                }

                if (filterItems.season.length) {
                    var sSub = [];
                    for (var s = 0; s < filterItems.season.length; s++) {
                        sSub.push({ title: escapeHtml(filterItems.season[s]), selected: choice.season === s, index: s });
                    }
                    select.push({
                        title: Lampa.Lang.translate('torrent_serial_season'),
                        subtitle: escapeHtml(filterItems.season[choice.season] || ''),
                        items: sSub,
                        stype: 'season'
                    });
                    chosen.push(Lampa.Lang.translate('torrent_serial_season') + ': ' + (filterItems.season[choice.season] || ''));
                }

                filter.set('filter', select);
                filter.chosen('filter', chosen);
            }

            function fetchTmdbSeason(seasonNum, cb) {
                if (typeof object.movie.id === 'number' && isSerialMovie(object.movie)) {
                    var url = Lampa.TMDB.api('tv/' + object.movie.id + '/season/' + seasonNum + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru'));
                    network.timeout(10000);
                    network['native'](url, function (data) {
                        cb(data && data.episodes ? data.episodes : []);
                    }, function () {
                        cb([]);
                    });
                } else {
                    cb([]);
                }
            }

            function drawSerialEpisodes(seasonObj, voiceObj) {
                fetchTmdbSeason(seasonObj.num, function (tmdbEpisodes) {
                    var tmdbMap = {};
                    for (var tIdx = 0; tIdx < tmdbEpisodes.length; tIdx++) {
                        tmdbMap[tmdbEpisodes[tIdx].episode_number] = tmdbEpisodes[tIdx];
                    }

                    var savedChoice = getChoice(object.movie.id);
                    var fully = window.innerWidth > 480;
                    var scrollToEl = false;
                    var scrollToMark = false;

                    voiceObj.episodes.forEach(function (ep, index) {
                        var tmdbEp = tmdbMap[ep.episode] || null;
                        var info = [];
                        if (tmdbEp && tmdbEp.vote_average) {
                            info.push(Lampa.Template.get('tv_fx_rate', { rate: parseFloat(tmdbEp.vote_average + '').toFixed(1) }, true));
                        }
                        if (tmdbEp && tmdbEp.air_date && fully) {
                            info.push(Lampa.Utils.parseTime(tmdbEp.air_date).full);
                        }
                        info.push(escapeHtml(voiceObj.name));

                        var timeline = getEpisodeTimeline(object.movie, ep.season, ep.episode);
                        var epTitle = tmdbEp && tmdbEp.name
                            ? tmdbEp.name
                            : (t('tv_episode_short') + ' ' + ep.episode);

                        var html = Lampa.Template.get('tv_fx_full', {
                            title: escapeHtml(epTitle),
                            time: Lampa.Utils.secondsToTime(((tmdbEp && tmdbEp.runtime) || object.movie.runtime || 0) * 60, true),
                            info: info.map(function (x) { return '<span>' + x + '</span>'; }).join('<span class="online-prestige-split">●</span>'),
                            quality: formatQualityBadge(ep.quality)
                        });

                        var loader = html.find('.online-prestige__loader');
                        var image = html.find('.online-prestige__img');
                        var img = html.find('img')[0];

                        if (savedChoice.episodes_view[ep.season] === ep.episode) scrollToEl = html;

                        if (tmdbEp && tmdbEp.still_path) {
                            img.onerror = function () { img.src = './img/img_broken.svg'; };
                            img.onload = function () {
                                image.addClass('online-prestige__img--loaded');
                                loader.remove();
                                image.append('<div class="online-prestige__episode-number">' + ('0' + ep.episode).slice(-2) + '</div>');
                            };
                            img.src = Lampa.TMDB.image('t/p/w300' + tmdbEp.still_path);
                            images.push(img);
                        } else {
                            loader.remove();
                            image.append('<div class="online-prestige__episode-number">' + ('0' + ep.episode).slice(-2) + '</div>');
                        }

                        html.find('.online-prestige__timeline').append(Lampa.Timeline.render(timeline));

                        if (isEpisodeMarked(object.movie, ep.season, ep.episode, voiceObj.name)) {
                            scrollToMark = html;
                            image.append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
                        }

                        html.on('hover:enter', function () {
                            playEpisode(object.movie, voiceObj, index, tmdbMap, function () {
                                if (!image.find('.online-prestige__viewed').length) {
                                    image.append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
                                }
                            });
                        }).on('hover:focus', function (e) {
                            last = e.target;
                            scroll.update($(e.target), true);
                        });

                        attachItemContextMenu(html, {
                            season: ep.season,
                            episode: ep.episode,
                            voiceName: voiceObj.name,
                            lastEpisode: voiceObj.episodes[voiceObj.episodes.length - 1].episode,
                            timeline: timeline,
                            getExtra: function () { return buildQualityMap(ep.file, ep.quality, ep.qualities); },
                            mark: function () {
                                markEpisodeWatched(object.movie, ep.season, ep.episode, voiceObj.name);
                                if (!image.find('.online-prestige__viewed').length) {
                                    image.append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
                                }
                            },
                            unmark: function () {
                                unmarkEpisodeWatched(object.movie, ep.season, ep.episode, voiceObj.name);
                                image.find('.online-prestige__viewed').remove();
                            },
                            clearAllMarks: function () {
                                voiceObj.episodes.forEach(function (x) {
                                    unmarkEpisodeWatched(object.movie, x.season, x.episode, voiceObj.name);
                                });
                                scroll.render().find('.online-prestige__viewed').remove();
                            },
                            clearAllTime: function () {
                                voiceObj.episodes.forEach(function (x) {
                                    var tl = getEpisodeTimeline(object.movie, x.season, x.episode);
                                    tl.percent = 0; tl.time = 0; tl.duration = 0;
                                    Lampa.Timeline.update(tl);
                                });
                            }
                        });

                        scroll.append(html);
                    });

                    // Невышедшие серии из TMDB
                    if (tmdbEpisodes.length > voiceObj.episodes.length) {
                        var maxEp = voiceObj.episodes.length ? voiceObj.episodes[voiceObj.episodes.length - 1].episode : 0;
                        tmdbEpisodes.forEach(function (tmdbEp) {
                            if (tmdbEp.episode_number <= maxEp) return;
                            var day = formatDaysLeft(tmdbEp.air_date);
                            var info = [];
                            if (tmdbEp.air_date) info.push(Lampa.Utils.parseTime(tmdbEp.air_date).full);
                            var html = Lampa.Template.get('tv_fx_full', {
                                title: escapeHtml(tmdbEp.name || (t('tv_episode_short') + ' ' + tmdbEp.episode_number)),
                                time: Lampa.Utils.secondsToTime((tmdbEp.runtime || object.movie.runtime || 0) * 60, true),
                                info: info.map(function (x) { return '<span>' + x + '</span>'; }).join('<span class="online-prestige-split">●</span>'),
                                quality: (day && day > 0) ? (t('tv_days_left') + ': ' + day) : ''
                            });
                            var loader = html.find('.online-prestige__loader');
                            var image = html.find('.online-prestige__img');
                            var img = html.find('img')[0];
                            if (tmdbEp.still_path) {
                                img.onload = function () {
                                    image.addClass('online-prestige__img--loaded');
                                    loader.remove();
                                    image.append('<div class="online-prestige__episode-number">' + ('0' + tmdbEp.episode_number).slice(-2) + '</div>');
                                };
                                img.src = Lampa.TMDB.image('t/p/w300' + tmdbEp.still_path);
                                images.push(img);
                            } else {
                                loader.remove();
                                image.append('<div class="online-prestige__episode-number">' + ('0' + tmdbEp.episode_number).slice(-2) + '</div>');
                            }
                            html.on('hover:focus', function (e) {
                                last = e.target;
                                scroll.update($(e.target), true);
                            });
                            scroll.append(html);
                        });
                    }

                    if (scrollToEl) last = scrollToEl[0];
                    else if (scrollToMark) last = scrollToMark[0];
                    Lampa.Controller.enable('content');
                    self.loading(false);
                });
            }

            function drawMovieVoices(moviesList) {
                var savedChoice = getChoice(object.movie.id);
                var fully = window.innerWidth > 480;
                var scrollToEl = false;
                var timeline = Lampa.Timeline.view(makeMovieTimelineHash(object.movie));

                moviesList.forEach(function (mv) {
                    var info = [];
                    if (object.movie.release_date && fully) info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
                    if (object.movie.tagline) info.push(escapeHtml(object.movie.tagline));

                    var html = Lampa.Template.get('tv_fx_full', {
                        title: escapeHtml(mv.translation),
                        time: Lampa.Utils.secondsToTime((object.movie.runtime || 0) * 60, true),
                        info: info.map(function (x) { return '<span>' + x + '</span>'; }).join('<span class="online-prestige-split">●</span>'),
                        quality: formatQualityBadge(mv.quality)
                    });

                    var loader = html.find('.online-prestige__loader');
                    var image = html.find('.online-prestige__img');
                    var img = html.find('img')[0];

                    if (savedChoice.movie_voice_name && savedChoice.movie_voice_name === mv.translation) {
                        scrollToEl = html;
                    }

                    if (object.movie.backdrop_path) {
                        img.onerror = function () { img.src = './img/img_broken.svg'; };
                        img.onload = function () {
                            image.addClass('online-prestige__img--loaded');
                            loader.remove();
                        };
                        img.src = Lampa.TMDB.image('t/p/w300' + object.movie.backdrop_path);
                        images.push(img);
                    } else {
                        loader.remove();
                    }

                    html.find('.online-prestige__timeline').append(Lampa.Timeline.render(timeline));

                    html.on('hover:enter', function () {
                        var extra = buildQualityMap(mv.file, mv.quality, mv.qualities);
                        if (!extra.file) {
                            Lampa.Noty.show(t('tv_filmix_nolink'));
                            return;
                        }
                        if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
                        saveChoice(object.movie.id, { filmix_id: parsedPost.id, movie_voice_name: mv.translation });

                        var playObj = {
                            title: (object.movie.title || object.movie.name || '') + ' (' + mv.translation + ')',
                            url: extra.file,
                            quality: extra.quality,
                            timeline: timeline,
                            card: object.movie
                        };
                        Lampa.Player.play(playObj);
                        Lampa.Player.playlist([playObj]);
                    }).on('hover:focus', function (e) {
                        last = e.target;
                        scroll.update($(e.target), true);
                    });

                    attachItemContextMenu(html, {
                        timeline: timeline,
                        getExtra: function () { return buildQualityMap(mv.file, mv.quality, mv.qualities); }
                    });

                    scroll.append(html);
                });

                if (scrollToEl) last = scrollToEl[0];
                Lampa.Controller.enable('content');
            }

            function drawSimilars(json) {
                self.reset();
                json.forEach(function (elem) {
                    var info = [];
                    var year = String(elem.start_date || elem.year || '').slice(0, 4);
                    if (year) info.push(year);
                    if (elem.countries && elem.countries.length) info.push(escapeHtml(elem.countries.join(', ')));
                    if (elem.categories && elem.categories.length) info.push(escapeHtml(elem.categories.slice(0, 4).join(', ')));

                    var name = elem.title || elem.ru_title || elem.en_title || '';
                    var orig = elem.original_title || elem.orig_title || '';
                    var fullTitle = name + (orig && orig !== name ? ' / ' + orig : '');

                    var item = Lampa.Template.get('tv_fx_folder', {
                        title: escapeHtml(fullTitle),
                        time: escapeHtml(elem.filmLength || ''),
                        info: info.join('<span class="online-prestige-split">●</span>')
                    });

                    item.on('hover:enter', function () {
                        self.activity.loader(true);
                        self.reset();
                        selectedFilmixId = elem.id;
                        saveChoice(object.movie.id, { filmix_id: elem.id });
                        loadFilmixPost(elem.id);
                    }).on('hover:focus', function (e) {
                        last = e.target;
                        scroll.update($(e.target), true);
                    });

                    scroll.append(item);
                });
            }

            function attachItemContextMenu(html, cfg) {
                html.on('hover:long', function () {
                    var enabled = Lampa.Controller.enabled().name;
                    var extra = cfg.getExtra ? cfg.getExtra() : null;
                    var menu = [];

                    if (Lampa.Platform.is('webos')) menu.push({ title: Lampa.Lang.translate('player_lauch') + ' - WebOS', player: 'webos' });
                    if (Lampa.Platform.is('android')) menu.push({ title: Lampa.Lang.translate('player_lauch') + ' - Android', player: 'android' });
                    menu.push({ title: Lampa.Lang.translate('player_lauch') + ' - Lampa', player: 'lampa' });
                    menu.push({ title: t('tv_filmix_video'), separator: true });

                    if (cfg.mark) menu.push({ title: Lampa.Lang.translate('torrent_parser_label_title'), mark: true });
                    if (cfg.unmark) menu.push({ title: Lampa.Lang.translate('torrent_parser_label_cancel_title'), unmark: true });
                    if (cfg.timeline) menu.push({ title: Lampa.Lang.translate('time_reset'), timeclear: true });
                    if (extra && extra.file) menu.push({ title: Lampa.Lang.translate('copy_link'), copylink: true });

                    if (cfg.clearAllMarks || cfg.clearAllTime || (Lampa.Account.logged() && cfg.season && cfg.voiceName)) {
                        menu.push({ title: Lampa.Lang.translate('more'), separator: true });
                        if (Lampa.Account.logged() && cfg.season && cfg.voiceName) {
                            menu.push({ title: t('tv_filmix_voice_subscribe'), subscribe: true });
                        }
                        if (cfg.clearAllMarks) menu.push({ title: t('tv_filmix_clear_marks'), clearallmark: true });
                        if (cfg.clearAllTime) menu.push({ title: t('tv_filmix_clear_timecodes'), timeclearall: true });
                    }

                    Lampa.Select.show({
                        title: Lampa.Lang.translate('title_action'),
                        items: menu,
                        onBack: function () { Lampa.Controller.toggle(enabled); },
                        onSelect: function (a) {
                            if (a.mark && cfg.mark) cfg.mark();
                            if (a.unmark && cfg.unmark) cfg.unmark();
                            if (a.timeclear && cfg.timeline) {
                                cfg.timeline.percent = 0; cfg.timeline.time = 0; cfg.timeline.duration = 0;
                                Lampa.Timeline.update(cfg.timeline);
                            }
                            if (a.clearallmark && cfg.clearAllMarks) cfg.clearAllMarks();
                            if (a.timeclearall && cfg.clearAllTime) cfg.clearAllTime();

                            Lampa.Controller.toggle(enabled);

                            if (a.player) {
                                Lampa.Player.runas(a.player);
                                html.trigger('hover:enter');
                            }
                            if (a.copylink && extra) {
                                if (extra.quality) {
                                    var qual = [];
                                    for (var qKey in extra.quality) {
                                        qual.push({ title: qKey, file: extra.quality[qKey] });
                                    }
                                    Lampa.Select.show({
                                        title: Lampa.Lang.translate('settings_server_links'),
                                        items: qual,
                                        onBack: function () { Lampa.Controller.toggle(enabled); },
                                        onSelect: function (b) {
                                            Lampa.Utils.copyTextToClipboard(b.file, function () {
                                                Lampa.Noty.show(t('tv_filmix_copy_ok'));
                                            }, function () {
                                                Lampa.Noty.show(t('tv_filmix_copy_fail'));
                                            });
                                            Lampa.Controller.toggle(enabled);
                                        }
                                    });
                                } else {
                                    Lampa.Utils.copyTextToClipboard(extra.file, function () {
                                        Lampa.Noty.show(t('tv_filmix_copy_ok'));
                                    }, function () {
                                        Lampa.Noty.show(t('tv_filmix_copy_fail'));
                                    });
                                }
                            }
                            if (a.subscribe && Lampa.Account.subscribeToTranslation) {
                                Lampa.Account.subscribeToTranslation({
                                    card: object.movie,
                                    season: cfg.season,
                                    episode: cfg.lastEpisode || cfg.episode,
                                    voice: cfg.voiceName
                                }, function () {
                                    Lampa.Noty.show(t('tv_filmix_voice_ok'));
                                }, function () {
                                    Lampa.Noty.show(t('tv_filmix_voice_err'));
                                });
                            }
                        }
                    });
                }).on('hover:focus', function () {
                    if (Lampa.Helper) Lampa.Helper.show('online_file', t('tv_filmix_helper'), html);
                });
            }

            function showEmpty(msg) {
                self.reset();
                var html = Lampa.Template.get('tv_fx_empty', {});
                if (msg) html.find('.online-empty__title').text(msg);
                scroll.append(html);
                self.loading(false);
            }

            this.clearImages = function () {
                for (var i = 0; i < images.length; i++) {
                    images[i].onerror = null;
                    images[i].onload = null;
                    images[i].src = '';
                }
                images = [];
            };

            this.reset = function () {
                last = false;
                network.clear();
                this.clearImages();
                scroll.render().find('.empty').remove();
                scroll.clear();
            };

            this.loading = function (status) {
                if (status) this.activity.loader(true);
                else {
                    this.activity.loader(false);
                    this.activity.toggle();
                }
            };

            this.start = function () {
                if (Lampa.Activity.active().activity !== this.activity) return;
                if (!initialized) {
                    initialized = true;
                    this.initialize();
                }
                Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render(), files.render());
                        Lampa.Controller.collectionFocus(last || false, scroll.render());
                    },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () {
                        Navigator.move('down');
                    },
                    right: function () {
                        if (Navigator.canmove('right')) Navigator.move('right');
                        else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    back: this.back
                });
                Lampa.Controller.toggle('content');
            };

            this.render = function () {
                return files.render();
            };

            this.back = function () {
                Lampa.Activity.backward();
            };

            this.pause = function () {};
            this.stop = function () {};

            this.destroy = function () {
                network.clear();
                this.clearImages();
                files.destroy();
                scroll.destroy();
                clearInterval(pingAuthTimer);
            };
        }

        function resetCache() {
            postCache = {};
            searchCache = {};
            state.profileChecked = false;
        }

        return {
            getToken: getToken,
            getProxy: getProxy,
            fetchUserProfile: fetchUserProfile,
            renderProfileBox: renderProfileBox,
            startDevicePairing: startDevicePairing,
            resolveForMovie: resolveForMovie,
            findResumeTarget: findResumeTarget,
            findVoiceInSeason: findVoiceInSeason,
            getChoice: getChoice,
            saveChoice: saveChoice,
            playEpisode: playEpisode,
            buildQualityMap: buildQualityMap,
            markEpisodeWatched: markEpisodeWatched,
            unmarkEpisodeWatched: unmarkEpisodeWatched,
            isEpisodeMarked: isEpisodeMarked,
            openFilmixPage: openFilmixPage,
            resetFilmixTemplates: resetFilmixTemplates,
            FilmixComponent: FilmixComponent,
            resetCache: resetCache
        };
    })();

    /* ------------------------------------------------------------------ *
     * Рейтинги: IMDB, Shikimori (из shikimori-catalog.js), New Rating
     * ------------------------------------------------------------------ */

    function isShikimoriPluginInstalled() {
        try {
            if (Lampa.Component && Lampa.Component.get && Lampa.Component.get('shikimori_catalog')) return true;
        } catch (e) {}
        return false;
    }

    function getShikimoriScore(movie, $root) {
        if (!movie || !isAnimeMovie(movie)) return null;
        if (!getBoolSetting('tv_show_shikimori', true)) return null;

        // 1. Проверяем DOM (shikimori-catalog.js добавляет .rate--shikimori в .full-start-new__rate-line)
        if ($root && $root.length) {
            var domScore = $root.find('.full-start-new__rate-line .rate--shikimori > div').eq(0).text().trim();
            if (domScore && parseFloat(domScore) > 0) {
                return parseFloat(domScore) >= 10 ? '10' : parseFloat(domScore).toFixed(1);
            }
        }

        // 2. Проверяем кэш shikimori-catalog.js в Storage (только если плагин установлен)
        if (isShikimoriPluginInstalled()) {
            var all = Lampa.Storage.get('shikimori_catalog_ratings', '{}');
            if (all && typeof all === 'object') {
                var key = (isSerialMovie(movie) ? 'tv' : 'movie') + '_' + movie.id;
                var entry = all[key];
                if (entry && parseFloat(entry.score) > 0) {
                    var sc = parseFloat(entry.score);
                    return sc >= 10 ? '10' : sc.toFixed(1);
                }
            }
        }

        return null;
    }

    function getImdbScore(movie, $root) {
        if (!getBoolSetting('tv_show_imdb', true)) return null;
        if (movie && movie.imdb_rating && parseFloat(movie.imdb_rating) > 0) {
            var sc = parseFloat(movie.imdb_rating);
            return sc >= 10 ? '10' : sc.toFixed(1);
        }
        if ($root && $root.length) {
            var domScore = $root.find('.full-start-new__rate-line .rate--imdb > div').eq(0).text().trim();
            if (domScore && parseFloat(domScore) > 0) {
                var dsc = parseFloat(domScore);
                return dsc >= 10 ? '10' : dsc.toFixed(1);
            }
        }
        return null;
    }

    /**
     * Расчёт нового рейтинга по реакциям Lampa:
     * fire (+2), nice (+1), think (0), bore (-1), shit (-2)
     */
    function calculateReactionsRating(reactionsData) {
        var list = (reactionsData && Array.isArray(reactionsData.result)) ? reactionsData.result : [];
        var fire = 0;
        var nice = 0;
        var think = 0;
        var bore = 0;
        var shit = 0;

        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            if (!r) continue;
            var cnt = parseInt(r.counter, 10) || 0;
            if (r.type === 'fire') fire += cnt;
            else if (r.type === 'nice') nice += cnt;
            else if (r.type === 'think') think += cnt;
            else if (r.type === 'bore') bore += cnt;
            else if (r.type === 'shit') shit += cnt;
        }

        var posPoints = fire * 2 + nice * 1;
        var negPoints = bore * 1 + shit * 2;
        var totalPoints = posPoints + negPoints;
        var totalVotes = fire + nice + think + bore + shit;

        var posPercent = 0;
        var negPercent = 0;

        if (totalPoints > 0) {
            posPercent = Math.round((posPoints / totalPoints) * 100);
            negPercent = 100 - posPercent;
        } else if (totalVotes > 0) {
            posPercent = 50;
            negPercent = 50;
        }

        return {
            posPercent: posPercent,
            negPercent: negPercent,
            totalVotes: totalVotes,
            hasData: totalVotes > 0
        };
    }

    function updateRightColumnRatings($root, movie, fullData) {
        if (!$root || !$root.length) return;

        // 1. Основной рейтинг (Shikimori для аниме при наличии плагина, иначе IMDB)
        var $rateBox = $root.find('.tv-main-rate');
        if ($rateBox.length) {
            var score = null;
            var label = '';

            if (isAnimeMovie(movie)) {
                var shiki = getShikimoriScore(movie, $root);
                if (shiki) {
                    score = shiki;
                    label = 'Shikimori';
                }
            }

            if (!score) {
                var imdb = getImdbScore(movie, $root);
                if (imdb) {
                    score = imdb;
                    label = 'IMDB';
                }
            }

            if (score) {
                $rateBox.find('.tv-main-rate__score').text(score);
                $rateBox.find('.tv-main-rate__label').text(label);
                $rateBox.removeClass('hide');
            } else {
                $rateBox.addClass('hide');
            }
        }

        // 2. Бейджи PG и Статус
        var showBadges = getBoolSetting('tv_show_badges', true);
        $root.find('.tv-badges-stack').toggleClass('tv-setting-hidden', !showBadges);

        // 3. Новый рейтинг (реакции)
        var $newRating = $root.find('.tv-new-rating');
        if ($newRating.length) {
            var showNew = getBoolSetting('tv_show_new_rating', true) &&
                Lampa.Storage.field('card_interfice_reactions') &&
                !(window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.reactions);

            if (!showNew) {
                $newRating.addClass('hide');
            } else {
                var calc = calculateReactionsRating(fullData && fullData.reactions);
                $newRating.removeClass('hide').toggleClass('tv-new-rating--empty', !calc.hasData);
                $newRating.find('.tv-new-rating__pct--pos').text(calc.posPercent + '%');
                $newRating.find('.tv-new-rating__pct--neg').text(calc.negPercent + '%');
                $newRating.find('.tv-new-rating__bar-pos').css('width', calc.hasData ? (calc.posPercent + '%') : '0%');
                $newRating.find('.tv-new-rating__bar-neg').css('width', calc.hasData ? (calc.negPercent + '%') : '0%');
                $newRating.find('.tv-new-rating__total').text(Lampa.Utils.numberWithSpaces(calc.totalVotes));
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * Фоновый тихий трейлер (YouTube IFrame API)
     * ------------------------------------------------------------------ */

    var ytApiLoading = false;
    var ytApiCallbacks = [];

    function ensureYouTubeApi(cb) {
        if (typeof window.YT !== 'undefined' && window.YT.Player) {
            cb();
            return;
        }
        ytApiCallbacks.push(cb);
        if (ytApiLoading) return;
        ytApiLoading = true;

        var prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof prevReady === 'function') {
                try { prevReady(); } catch (e) {}
            }
            var list = ytApiCallbacks.slice();
            ytApiCallbacks = [];
            for (var i = 0; i < list.length; i++) {
                try { list[i](); } catch (e2) {}
            }
        };

        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
    }

    /* ------------------------------------------------------------------ *
     * TMDB медиа: случайный задник, логотип вместо названия и трейлеры
     * ------------------------------------------------------------------ */

    var lastBackdropByMovie = {};

    function getTmdbLang() {
        return (Lampa.Storage.field('tmdb_lang') || Lampa.Storage.get('language', 'ru') || 'ru').split('-')[0].toLowerCase();
    }

    function pickLatestTrailerFromList(results) {
        if (!Array.isArray(results) || !results.length) return null;
        var items = [];
        for (var i = 0; i < results.length; i++) {
            var el = results[i];
            if (!el || !el.key) continue;
            if (el.site && String(el.site).toLowerCase() !== 'youtube') continue;
            items.push({
                id: el.key,
                lang: String(el.iso_639_1 || '').toLowerCase(),
                type: String(el.type || '').toLowerCase(),
                official: !!el.official,
                time: el.published_at ? (new Date(el.published_at).getTime() || 0) : 0
            });
        }
        if (!items.length) return null;

        items.sort(function (a, b) {
            return b.time - a.time;
        });

        var trailersOnly = items.filter(function (x) { return x.type === 'trailer'; });
        var pool = trailersOnly.length ? trailersOnly : items;

        var tmdbLang = getTmdbLang();
        var byLang = pool.filter(function (x) { return x.lang === tmdbLang; });
        if (byLang.length) return byLang[0];

        var byEn = pool.filter(function (x) { return x.lang === 'en'; });
        if (byEn.length) return byEn[0];

        return pool[0];
    }

    function fetchTmdbLatestTrailer(movie, fallbackVideos, net, cb) {
        var fallbackList = (fallbackVideos && Array.isArray(fallbackVideos.results)) ? fallbackVideos.results : [];
        if (!movie || !movie.id || !Lampa.TMDB || !Lampa.TMDB.api) {
            cb(pickLatestTrailerFromList(fallbackList));
            return;
        }

        var media = isSerialMovie(movie) ? 'tv' : 'movie';
        var userLang = getTmdbLang();

        function requestLang(langCode, done) {
            var path = media + '/' + movie.id + '/videos?api_key=' + Lampa.TMDB.key() + '&language=' + encodeURIComponent(langCode);
            net.timeout(10000);
            net['native'](Lampa.TMDB.api(path), function (json) {
                done(json && Array.isArray(json.results) ? json.results : []);
            }, function () {
                done([]);
            });
        }

        requestLang(userLang, function (primaryList) {
            var primaryPick = pickLatestTrailerFromList(primaryList);
            if (primaryPick && primaryPick.type === 'trailer') {
                cb(primaryPick);
                return;
            }

            if (userLang !== 'en') {
                requestLang('en', function (enList) {
                    var combined = primaryList.concat(enList);
                    var pick = pickLatestTrailerFromList(combined);
                    cb(pick || pickLatestTrailerFromList(fallbackList));
                });
            } else {
                cb(primaryPick || pickLatestTrailerFromList(fallbackList));
            }
        });
    }

    function pickRandomBackdrop(movie, backdrops) {
        if (!Array.isArray(backdrops) || !backdrops.length) return null;

        var valid = backdrops.filter(function (b) { return b && b.file_path; });
        if (!valid.length) return null;

        // Предпочитаем чистые широкоформатные задники без текста
        var cleanWide = valid.filter(function (b) {
            return (!b.iso_639_1) && (!b.aspect_ratio || b.aspect_ratio >= 1.5);
        });
        var pool = cleanWide.length >= 2 ? cleanWide : valid.filter(function (b) {
            return !b.aspect_ratio || b.aspect_ratio >= 1.5;
        });
        if (!pool.length) pool = valid;

        var hdPool = pool.filter(function (b) { return b.width && b.width >= 1280; });
        if (hdPool.length >= 2) pool = hdPool;

        // Исключаем последний показанный задник, чтобы каждый раз подгружался другой при наличии выбора
        var movieKey = String(movie.id);
        var prevPath = lastBackdropByMovie[movieKey] || movie.backdrop_path || '';
        var candidates = pool;
        if (pool.length > 1 && prevPath) {
            var filtered = pool.filter(function (b) { return b.file_path !== prevPath; });
            if (filtered.length) candidates = filtered;
        }

        var chosen = candidates[Math.floor(Math.random() * candidates.length)];
        if (chosen && chosen.file_path) {
            lastBackdropByMovie[movieKey] = chosen.file_path;
            return chosen.file_path;
        }
        return null;
    }

    function pickBestLogo(movie, logos) {
        if (!Array.isArray(logos) || !logos.length) return null;

        var valid = logos.filter(function (l) { return l && l.file_path; });
        if (!valid.length) return null;

        var userLang = getTmdbLang();
        var origLang = String(movie.original_language || '').toLowerCase();

        var buckets = [
            valid.filter(function (l) { return String(l.iso_639_1 || '').toLowerCase() === userLang; }),
            valid.filter(function (l) { return String(l.iso_639_1 || '').toLowerCase() === 'en'; }),
            valid.filter(function (l) { return !l.iso_639_1; }),
            origLang ? valid.filter(function (l) { return String(l.iso_639_1 || '').toLowerCase() === origLang; }) : [],
            valid
        ];

        var bucket = null;
        for (var i = 0; i < buckets.length; i++) {
            if (buckets[i] && buckets[i].length) {
                bucket = buckets[i];
                break;
            }
        }
        if (!bucket || !bucket.length) return null;

        // Предпочитаем PNG-логотипы с хорошим рейтингом и шириной
        var pngOnly = bucket.filter(function (l) { return !/\.svg$/i.test(l.file_path); });
        var sorted = (pngOnly.length ? pngOnly : bucket).slice().sort(function (a, b) {
            var va = (a.vote_average || 0) * 10 + Math.min(a.vote_count || 0, 20);
            var vb = (b.vote_average || 0) * 10 + Math.min(b.vote_count || 0, 20);
            if (vb !== va) return vb - va;
            return (b.width || 0) - (a.width || 0);
        });

        var path = sorted[0].file_path;
        if (/\.svg$/i.test(path)) {
            path = path.replace(/\.svg$/i, '.png');
        }
        return path;
    }

    function loadTmdbImagesForCard(movie, $activityRoot, $start, net, isDestroyedFn) {
        if (!movie || !movie.id || !Lampa.TMDB || !Lampa.TMDB.api) return;

        var media = isSerialMovie(movie) ? 'tv' : 'movie';
        var path = media + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key();
        net.timeout(10000);
        net['native'](Lampa.TMDB.api(path), function (json) {
            if (isDestroyedFn() || !json) return;

            // 1. Случайный задник с TMDB
            if (window.innerWidth > 790 && !Lampa.Storage.field('light_version') && json.backdrops && json.backdrops.length) {
                var bgPath = pickRandomBackdrop(movie, json.backdrops);
                if (bgPath) {
                    var bgUrl = Lampa.TMDB.image('t/p/w1280' + bgPath);
                    var preloadBg = new Image();
                    preloadBg.onload = function () {
                        if (isDestroyedFn()) return;
                        var $bg = $activityRoot.find('.full-start__background');
                        if (!$bg.length) {
                            $bg = $('<img class="full-start__background tv-card__background">');
                            $activityRoot.prepend($bg);
                        }
                        $bg.attr('src', bgUrl).addClass('loaded tv-card__background');
                    };
                    preloadBg.src = bgUrl;
                }
            }

            // 2. Логотип вместо текстового названия (если включено в настройках)
            if (getBoolSetting('tv_show_logo', true) && json.logos && json.logos.length) {
                var logoPath = pickBestLogo(movie, json.logos);
                if (logoPath) {
                    var logoUrl = Lampa.TMDB.image('t/p/w500' + logoPath);
                    var preloadLogo = new Image();
                    preloadLogo.onload = function () {
                        if (isDestroyedFn()) return;
                        if (!preloadLogo.naturalWidth) return;
                        var $title = $start.find('.full-start-new__title');
                        if (!$title.length) return;
                        var titleText = movie.title || movie.name || $title.text() || '';
                        var $img = $('<img class="tv-title-logo" alt="">').attr('src', logoUrl).attr('alt', titleText);
                        $title.addClass('tv-title--logo').empty().append($img);
                        setTimeout(function () {
                            $img.addClass('tv-title-logo--loaded');
                        }, 30);
                    };
                    preloadLogo.src = logoUrl;
                }
            }
        }, function () {});
    }

    function BackgroundTrailer(activityObj, $activityRoot, fullData) {
        var self = this;
        var destroyed = false;
        var started = false;
        var startTimer = null;
        var showTimer = null;
        var pollTimer = null;
        var ytPlayer = null;
        var $layer = null;
        var video = null;
        var netVideos = new Lampa.Reguest();

        var START_OFFSET = 7;
        var END_CUTOFF = 7;

        function getBgEl() {
            return $activityRoot.find('.full-start__background');
        }

        function isStillActiveAndTop() {
            if (destroyed) return false;
            var active = Lampa.Activity.active();
            if (!active || active.activity !== activityObj.activity) return false;
            if (Lampa.Player && Lampa.Player.opened && Lampa.Player.opened()) return false;
            if ($('body').hasClass('settings--open') || $('body').hasClass('search--open') || $('body').hasClass('player--viewing')) return false;
            if (getBgEl().hasClass('dim')) return false;
            return true;
        }

        function stopAndRestorePoster() {
            clearTimeout(startTimer);
            clearTimeout(showTimer);
            clearInterval(pollTimer);
            if ($layer) {
                $layer.removeClass('tv-bg-trailer--visible');
            }
            getBgEl().removeClass('tv-bg--hidden');

            var playerRef = ytPlayer;
            var layerRef = $layer;
            ytPlayer = null;
            $layer = null;

            setTimeout(function () {
                if (playerRef) {
                    try { playerRef.stopVideo(); } catch (e) {}
                    try { playerRef.destroy(); } catch (e2) {}
                }
                if (layerRef) layerRef.remove();
            }, 500);
        }

        function launch() {
            if (started || !isStillActiveAndTop() || !video) return;
            started = true;

            ensureYouTubeApi(function () {
                if (!isStillActiveAndTop()) return;
                if (typeof window.YT === 'undefined' || !window.YT.Player) return;

                var $bg = getBgEl();
                var frameId = 'tv-yt-bg-' + Lampa.Utils.uid(8);
                $layer = $('<div class="tv-bg-trailer"><div class="tv-bg-trailer__wrap"><div id="' + frameId + '"></div></div></div>');
                if ($bg.length) $bg.after($layer);
                else $activityRoot.prepend($layer);

                try {
                    ytPlayer = new window.YT.Player(frameId, {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        videoId: video.id,
                        playerVars: {
                            autoplay: 1,
                            mute: 1,
                            controls: 0,
                            showinfo: 0,
                            autohide: 1,
                            modestbranding: 1,
                            iv_load_policy: 3,
                            rel: 0,
                            fs: 0,
                            disablekb: 1,
                            playsinline: 1,
                            enablejsapi: 1,
                            start: START_OFFSET
                        },
                        events: {
                            onReady: function (ev) {
                                if (destroyed) {
                                    stopAndRestorePoster();
                                    return;
                                }
                                try {
                                    ev.target.mute();
                                    ev.target.setVolume(0);
                                    ev.target.setPlaybackQuality('hd1080');
                                    var dur = ev.target.getDuration();
                                    if (dur && dur > START_OFFSET + END_CUTOFF + 6) {
                                        ev.target.seekTo(START_OFFSET, true);
                                    }
                                    ev.target.playVideo();
                                } catch (e) {}
                            },
                            onStateChange: function (st) {
                                if (destroyed) return;
                                if (st.data === window.YT.PlayerState.PLAYING) {
                                    try { st.target.mute(); st.target.setVolume(0); } catch (e) {}

                                    clearTimeout(showTimer);
                                    showTimer = setTimeout(function () {
                                        if (!isStillActiveAndTop()) {
                                            stopAndRestorePoster();
                                            return;
                                        }
                                        if ($layer) $layer.addClass('tv-bg-trailer--visible');
                                        getBgEl().addClass('tv-bg--hidden');
                                    }, 450);

                                    clearInterval(pollTimer);
                                    pollTimer = setInterval(function () {
                                        if (!ytPlayer || !isStillActiveAndTop()) {
                                            stopAndRestorePoster();
                                            return;
                                        }
                                        try {
                                            var duration = ytPlayer.getDuration();
                                            var current = ytPlayer.getCurrentTime();
                                            if (duration > END_CUTOFF + 8 && (duration - current) <= END_CUTOFF) {
                                                stopAndRestorePoster();
                                            }
                                        } catch (e) {}
                                    }, 400);
                                } else if (st.data === window.YT.PlayerState.ENDED) {
                                    stopAndRestorePoster();
                                }
                            },
                            onError: function () {
                                stopAndRestorePoster();
                            }
                        }
                    });
                } catch (e) {
                    stopAndRestorePoster();
                }
            });
        }

        function onActivityEvent(e) {
            if (e.type === 'destroy' && e.object && e.object.activity === activityObj.activity) {
                self.destroy();
            } else if (e.type === 'start' && e.object && e.object.activity !== activityObj.activity) {
                stopAndRestorePoster();
            }
        }

        function onPlayerCreate() {
            stopAndRestorePoster();
        }

        this.start = function () {
            if (!getBoolSetting('tv_bg_trailer', true)) return;
            if (window.innerWidth <= 790 || Lampa.Storage.field('light_version')) return;
            if (fullData && fullData.movie && fullData.movie.adult) return;

            Lampa.Listener.follow('activity', onActivityEvent);
            if (Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.follow('create', onPlayerCreate);
            }

            // Загружаем последний трейлер напрямую с TMDB
            fetchTmdbLatestTrailer(fullData && fullData.movie, fullData && fullData.videos, netVideos, function (foundVideo) {
                if (destroyed || !foundVideo) return;
                video = foundVideo;
                startTimer = setTimeout(launch, 1500);
            });
        };

        this.onScrollDim = function (isDim) {
            if (isDim && (ytPlayer || $layer)) {
                stopAndRestorePoster();
            }
        };

        this.destroy = function () {
            if (destroyed) return;
            destroyed = true;
            netVideos.clear();
            Lampa.Listener.remove('activity', onActivityEvent);
            if (Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.remove('create', onPlayerCreate);
            }
            stopAndRestorePoster();
        };
    }

    /* ------------------------------------------------------------------ *
     * Секция "series choice" под Hero (выбор сезона, озвучки и серии)
     * ------------------------------------------------------------------ */

    function SeriesChoiceSection(fullLink, movie, onStateChange) {
        var self = this;
        var callbacks = {
            onDown: null,
            onUp: null,
            onBack: null,
            onLeft: null,
            onActive: null,
            onToggle: null
        };

        var destroyed = false;
        var netTmdb = new Lampa.Reguest();
        var epScroll = new Lampa.Scroll({ horizontal: true, step: 380, nopadding: true });
        var $html = $('<div class="items-line tv-series-choice">' +
            '<div class="tv-series-choice__header">' +
            '<div class="tv-pill tv-pill--season selector"><span class="tv-pill__text">' + escapeHtml(t('tv_loading_filmix')) + '</span><span class="tv-pill__chev">' + SVG.chevron + '</span></div>' +
            '<div class="tv-pill tv-pill--voice selector hide"><span class="tv-pill__muted">' + escapeHtml(t('tv_voice_label')) + '</span><span class="tv-pill__voice-name"></span><span class="tv-pill__dot">●</span><span class="tv-pill__quality"></span><span class="tv-pill__chev">' + SVG.chevron + '</span></div>' +
            '<div class="tv-pill tv-pill--fx selector">' + SVG.filter + '</div>' +
            '</div>' +
            '<div class="tv-series-choice__cards"></div>' +
            '</div>');

        var $header = $html.find('.tv-series-choice__header');
        var $seasonPill = $html.find('.tv-pill--season');
        var $voicePill = $html.find('.tv-pill--voice');
        var $fxPill = $html.find('.tv-pill--fx');
        var $cardsWrap = $html.find('.tv-series-choice__cards');
        $cardsWrap.append(epScroll.render());
        epScroll.body().addClass('tv-ep-cards');

        var parsedPost = null;
        var selectedSeasonIdx = 0;
        var selectedVoiceIdx = 0;
        var tmdbSeasonCache = {};
        var activeRow = 0; // 0 = header pills, 1 = episode cards
        var lastHeaderEl = null;
        var lastCardEl = null;
        var ctrlName = 'tv_series_choice_' + Lampa.Utils.uid(6);

        function notifyChange() {
            if (onStateChange && parsedPost) {
                onStateChange(parsedPost, selectedSeasonIdx, selectedVoiceIdx, tmdbSeasonCache);
            }
        }

        function getCurrentSeason() {
            if (!parsedPost || !parsedPost.seasons.length) return null;
            return parsedPost.seasons[selectedSeasonIdx] || parsedPost.seasons[0];
        }

        function getCurrentVoice() {
            var s = getCurrentSeason();
            if (!s || !s.voices.length) return null;
            return s.voices[selectedVoiceIdx] || s.voices[0];
        }

        function updatePillsUI() {
            var s = getCurrentSeason();
            var v = getCurrentVoice();

            if (!parsedPost || !s) {
                var emptyLabel = (parsedPost && !parsedPost.isSerial && parsedPost.movies && parsedPost.movies.length)
                    ? t('tv_filmix_watch')
                    : t('tv_not_found_filmix');
                $seasonPill.find('.tv-pill__text').text(emptyLabel);
                $seasonPill.find('.tv-pill__chev').addClass('hide');
                $voicePill.addClass('hide');
                return;
            }

            $seasonPill.find('.tv-pill__text').text(s.label);
            $seasonPill.find('.tv-pill__chev').removeClass('hide');

            if (v) {
                var qLabel = formatQualityBadge(v.maxQuality);
                $voicePill.removeClass('hide');
                $voicePill.find('.tv-pill__voice-name').text(v.name);
                $voicePill.find('.tv-pill__dot').toggleClass('hide', !qLabel);
                $voicePill.find('.tv-pill__quality').text(qLabel).toggleClass('hide', !qLabel);
            } else {
                $voicePill.addClass('hide');
            }
        }

        function fetchTmdbSeason(seasonNum, cb) {
            if (tmdbSeasonCache[seasonNum]) {
                cb(tmdbSeasonCache[seasonNum]);
                return;
            }
            if (typeof movie.id !== 'number') {
                cb([]);
                return;
            }
            var url = Lampa.TMDB.api('tv/' + movie.id + '/season/' + seasonNum + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru'));
            netTmdb.timeout(10000);
            netTmdb['native'](url, function (data) {
                var eps = (data && Array.isArray(data.episodes)) ? data.episodes : [];
                tmdbSeasonCache[seasonNum] = eps;
                cb(eps);
            }, function () {
                cb([]);
            });
        }

        function renderCards() {
            var s = getCurrentSeason();
            var v = getCurrentVoice();
            epScroll.clear();
            lastCardEl = null;

            if (!s || !v) {
                $cardsWrap.addClass('hide');
                return;
            }
            $cardsWrap.removeClass('hide');

            // Рисуем сначала сразу (или с кэшем TMDB), затем дополняем TMDB-метаданными
            drawCardsWithTmdb(s, v, tmdbSeasonCache[s.num] || null);

            if (!tmdbSeasonCache[s.num]) {
                var targetSeasonNum = s.num;
                var targetVoiceName = v.name;
                fetchTmdbSeason(targetSeasonNum, function (tmdbEps) {
                    if (destroyed) return;
                    var curS = getCurrentSeason();
                    var curV = getCurrentVoice();
                    if (curS && curV && curS.num === targetSeasonNum && curV.name === targetVoiceName) {
                        drawCardsWithTmdb(curS, curV, tmdbEps);
                        if (Lampa.Controller.enabled().name === ctrlName) {
                            refreshControllerCollection();
                        }
                    }
                });
            }
        }

        function drawCardsWithTmdb(seasonObj, voiceObj, tmdbEpisodes) {
            epScroll.clear();
            var tmdbMap = {};
            if (Array.isArray(tmdbEpisodes)) {
                for (var i = 0; i < tmdbEpisodes.length; i++) {
                    tmdbMap[tmdbEpisodes[i].episode_number] = tmdbEpisodes[i];
                }
            }

            var focusTargetCard = null;
            var resume = Filmix.findResumeTarget(movie, parsedPost);

            voiceObj.episodes.forEach(function (ep, idx) {
                var tmdbEp = tmdbMap[ep.episode] || null;
                var tl = getEpisodeTimeline(movie, ep.season, ep.episode);
                var percent = tl && tl.percent ? Math.min(100, Math.max(0, Math.round(tl.percent))) : 0;
                if (!percent && Filmix.isEpisodeMarked(movie, ep.season, ep.episode, voiceObj.name)) {
                    percent = 100;
                }

                var runtime = (tmdbEp && tmdbEp.runtime) || (movie.episode_run_time && movie.episode_run_time[0]) || 0;
                var epTitle = t('tv_episode_upper') + ' ' + ep.episode + (tmdbEp && tmdbEp.name ? ' • ' + tmdbEp.name : '');

                var $card = $('<div class="tv-ep-card selector" data-season="' + ep.season + '" data-episode="' + ep.episode + '">' +
                    '<div class="tv-ep-card__thumb">' +
                    '<img class="tv-ep-card__img" alt="">' +
                    '<div class="tv-ep-card__shade"></div>' +
                    (runtime ? '<div class="tv-ep-card__duration">' + runtime + ' ' + escapeHtml(t('tv_min_short')) + '</div>' : '') +
                    '<div class="tv-ep-card__progress' + (percent > 0 ? '' : ' hide') + '"><div class="tv-ep-card__progress-fill" style="width:' + percent + '%"></div></div>' +
                    '</div>' +
                    '<div class="tv-ep-card__title">' + escapeHtml(epTitle) + '</div>' +
                    '</div>');

                var imgEl = $card.find('img')[0];
                var stillPath = (tmdbEp && tmdbEp.still_path) ? tmdbEp.still_path : movie.backdrop_path;
                if (stillPath) {
                    imgEl.onload = function () { $card.find('.tv-ep-card__img').addClass('loaded'); };
                    imgEl.src = Lampa.TMDB.image('t/p/w500' + stillPath);
                }

                if (resume && resume.season.num === ep.season && resume.episode.episode === ep.episode) {
                    focusTargetCard = $card[0];
                }

                $card.on('hover:focus hover:hover hover:touch', function () {
                    activeRow = 1;
                    lastCardEl = $card[0];
                    epScroll.update($card, true);
                    if (callbacks.onActive) callbacks.onActive();
                }).on('hover:enter', function () {
                    Filmix.saveChoice(movie.id, {
                        filmix_id: parsedPost.id,
                        season: selectedSeasonIdx,
                        voice: selectedVoiceIdx,
                        voice_name: voiceObj.name,
                        last_season: ep.season,
                        last_episode: ep.episode
                    });
                    Filmix.playEpisode(movie, voiceObj, idx, tmdbMap, function () {
                        self.refreshProgress();
                        notifyChange();
                    });
                }).on('hover:long', function () {
                    var enabled = Lampa.Controller.enabled().name;
                    var extra = Filmix.buildQualityMap(ep.file, ep.quality, ep.qualities);
                    var menu = [
                        { title: Lampa.Lang.translate('torrent_parser_label_title'), mark: true },
                        { title: Lampa.Lang.translate('torrent_parser_label_cancel_title'), unmark: true },
                        { title: Lampa.Lang.translate('time_reset'), timeclear: true }
                    ];
                    if (extra && extra.file) menu.push({ title: Lampa.Lang.translate('copy_link'), copylink: true });

                    Lampa.Select.show({
                        title: epTitle,
                        items: menu,
                        onBack: function () { Lampa.Controller.toggle(enabled); },
                        onSelect: function (a) {
                            if (a.mark) Filmix.markEpisodeWatched(movie, ep.season, ep.episode, voiceObj.name);
                            if (a.unmark) Filmix.unmarkEpisodeWatched(movie, ep.season, ep.episode, voiceObj.name);
                            if (a.timeclear) {
                                var curTl = getEpisodeTimeline(movie, ep.season, ep.episode);
                                curTl.percent = 0; curTl.time = 0; curTl.duration = 0;
                                Lampa.Timeline.update(curTl);
                            }
                            if (a.copylink && extra && extra.file) {
                                Lampa.Utils.copyTextToClipboard(extra.file, function () {
                                    Lampa.Noty.show(t('tv_filmix_copy_ok'));
                                }, function () {
                                    Lampa.Noty.show(t('tv_filmix_copy_fail'));
                                });
                            }
                            self.refreshProgress();
                            notifyChange();
                            Lampa.Controller.toggle(enabled);
                        }
                    });
                });

                epScroll.append($card);
            });

            // Невышедшие / ещё не появившиеся на Filmix серии из TMDB
            if (Array.isArray(tmdbEpisodes) && tmdbEpisodes.length) {
                var maxFilmixEp = voiceObj.episodes.length ? voiceObj.episodes[voiceObj.episodes.length - 1].episode : 0;
                for (var u = 0; u < tmdbEpisodes.length; u++) {
                    var upEp = tmdbEpisodes[u];
                    if (!upEp || upEp.episode_number <= maxFilmixEp) continue;

                    (function (tmdbItem) {
                        var days = formatDaysLeft(tmdbItem.air_date);
                        var badgeText = '';
                        if (days !== null && days > 0) {
                            badgeText = t('tv_days_left') + ': ' + days;
                        } else if (tmdbItem.air_date) {
                            badgeText = Lampa.Utils.parseTime(tmdbItem.air_date).short;
                        }
                        var upTitle = t('tv_episode_upper') + ' ' + tmdbItem.episode_number + (tmdbItem.name ? ' • ' + tmdbItem.name : '');

                        var $uCard = $('<div class="tv-ep-card tv-ep-card--upcoming selector">' +
                            '<div class="tv-ep-card__thumb">' +
                            '<img class="tv-ep-card__img" alt="">' +
                            '<div class="tv-ep-card__shade"></div>' +
                            (badgeText ? '<div class="tv-ep-card__upcoming-badge">' + escapeHtml(badgeText) + '</div>' : '') +
                            '</div>' +
                            '<div class="tv-ep-card__title">' + escapeHtml(upTitle) + '</div>' +
                            '</div>');

                        var uImg = $uCard.find('img')[0];
                        var uStill = tmdbItem.still_path || movie.backdrop_path;
                        if (uStill) {
                            uImg.onload = function () { $uCard.find('.tv-ep-card__img').addClass('loaded'); };
                            uImg.src = Lampa.TMDB.image('t/p/w500' + uStill);
                        }

                        $uCard.on('hover:focus hover:hover hover:touch', function () {
                            activeRow = 1;
                            lastCardEl = $uCard[0];
                            epScroll.update($uCard, true);
                            if (callbacks.onActive) callbacks.onActive();
                        }).on('hover:enter', function () {
                            var msg = (days !== null && days > 0)
                                ? (t('tv_episode_not_released') + ' (' + t('tv_days_left') + ': ' + days + ')')
                                : t('tv_episode_not_on_filmix');
                            Lampa.Noty.show(msg);
                        });

                        epScroll.append($uCard);
                    })(upEp);
                }
            }

            if (focusTargetCard) {
                lastCardEl = focusTargetCard;
                epScroll.immediate($(focusTargetCard), false);
            } else {
                var firstCard = epScroll.body().find('.tv-ep-card.selector')[0];
                if (firstCard) lastCardEl = firstCard;
            }
        }

        function refreshControllerCollection() {
            var $targetWrap = (activeRow === 1 && epScroll.body().find('.selector').length) ? epScroll.render() : $header;
            var targetEl = (activeRow === 1 && epScroll.body().find('.selector').length)
                ? (lastCardEl || epScroll.body().find('.selector')[0])
                : (lastHeaderEl || $header.find('.selector:not(.hide)')[0]);

            Lampa.Controller.collectionSet($targetWrap);
            Lampa.Controller.collectionFocus(targetEl || false, $targetWrap);
        }

        // Обработчики пилюль управления
        $seasonPill.on('hover:focus hover:hover hover:touch', function () {
            activeRow = 0;
            lastHeaderEl = $seasonPill[0];
            if (callbacks.onActive) callbacks.onActive();
        }).on('hover:enter', function () {
            if (!parsedPost || !parsedPost.seasons.length) {
                Filmix.openFilmixPage(movie);
                return;
            }
            var items = [];
            for (var i = 0; i < parsedPost.seasons.length; i++) {
                var s = parsedPost.seasons[i];
                var epCount = s.voices.length ? s.voices[0].episodes.length : 0;
                items.push({
                    title: escapeHtml(s.label),
                    subtitle: epCount ? (epCount + ' ' + t('tv_episode_short').toLowerCase()) : '',
                    selected: i === selectedSeasonIdx,
                    index: i
                });
            }
            Lampa.Select.show({
                title: t('tv_season_short'),
                items: items,
                onSelect: function (item) {
                    selectedSeasonIdx = item.index;
                    var curSeason = getCurrentSeason();
                    var savedVoice = Filmix.getChoice(movie.id).voice_name;
                    var vm = Filmix.findVoiceInSeason(curSeason, savedVoice);
                    selectedVoiceIdx = vm ? vm.index : 0;
                    Filmix.saveChoice(movie.id, {
                        filmix_id: parsedPost.id,
                        season: selectedSeasonIdx,
                        voice: selectedVoiceIdx,
                        voice_name: vm ? vm.voice.name : savedVoice
                    });
                    updatePillsUI();
                    renderCards();
                    notifyChange();
                    self.toggle();
                },
                onBack: function () {
                    self.toggle();
                }
            });
        });

        $voicePill.on('hover:focus hover:hover hover:touch', function () {
            activeRow = 0;
            lastHeaderEl = $voicePill[0];
            if (callbacks.onActive) callbacks.onActive();
        }).on('hover:enter', function () {
            var s = getCurrentSeason();
            if (!s || !s.voices.length) return;
            var items = [];
            for (var i = 0; i < s.voices.length; i++) {
                var v = s.voices[i];
                var qStr = formatQualityBadge(v.maxQuality);
                items.push({
                    title: escapeHtml(v.name),
                    subtitle: escapeHtml((qStr ? qStr + ' • ' : '') + v.episodes.length + ' ' + t('tv_episode_short').toLowerCase()),
                    selected: i === selectedVoiceIdx,
                    index: i
                });
            }
            Lampa.Select.show({
                title: Lampa.Lang.translate('torrent_parser_voice'),
                items: items,
                onSelect: function (item) {
                    selectedVoiceIdx = item.index;
                    var chosenVoice = s.voices[selectedVoiceIdx];
                    Filmix.saveChoice(movie.id, {
                        filmix_id: parsedPost.id,
                        season: selectedSeasonIdx,
                        voice: selectedVoiceIdx,
                        voice_name: chosenVoice ? chosenVoice.name : ''
                    });
                    updatePillsUI();
                    renderCards();
                    notifyChange();
                    self.toggle();
                },
                onBack: function () {
                    self.toggle();
                }
            });
        });

        $fxPill.on('hover:focus hover:hover hover:touch', function () {
            activeRow = 0;
            lastHeaderEl = $fxPill[0];
            if (callbacks.onActive) callbacks.onActive();
        }).on('hover:enter', function () {
            Filmix.openFilmixPage(movie);
        });

        this.setFilmixData = function (parsed) {
            if (destroyed) return;
            parsedPost = parsed;
            if (parsed && parsed.isSerial && parsed.seasons.length) {
                var resume = Filmix.findResumeTarget(movie, parsed);
                if (resume) {
                    selectedSeasonIdx = resume.seasonIndex;
                    selectedVoiceIdx = resume.voiceIndex;
                } else {
                    var ch = Filmix.getChoice(movie.id);
                    selectedSeasonIdx = (ch.season >= 0 && ch.season < parsed.seasons.length) ? ch.season : 0;
                    var vm = Filmix.findVoiceInSeason(parsed.seasons[selectedSeasonIdx], ch.voice_name);
                    selectedVoiceIdx = vm ? vm.index : 0;
                }
            }
            updatePillsUI();
            renderCards();
            notifyChange();
        };

        this.refreshProgress = function () {
            if (destroyed || !parsedPost) return;
            var curVoice = getCurrentVoice();
            var voiceName = curVoice ? curVoice.name : '';
            epScroll.body().find('.tv-ep-card[data-episode]').each(function () {
                var $c = $(this);
                var sNum = parseInt($c.attr('data-season'), 10);
                var eNum = parseInt($c.attr('data-episode'), 10);
                var tl = getEpisodeTimeline(movie, sNum, eNum);
                var pct = tl && tl.percent ? Math.min(100, Math.max(0, Math.round(tl.percent))) : 0;
                if (!pct && Filmix.isEpisodeMarked(movie, sNum, eNum, voiceName)) pct = 100;
                var $prog = $c.find('.tv-ep-card__progress');
                $prog.toggleClass('hide', pct <= 0);
                $prog.find('.tv-ep-card__progress-fill').css('width', pct + '%');
            });
        };

        this.getTmdbMapForSeason = function (seasonNum) {
            var eps = tmdbSeasonCache[seasonNum];
            if (!eps) return {};
            var map = {};
            for (var i = 0; i < eps.length; i++) map[eps[i].episode_number] = eps[i];
            return map;
        };

        this.use = function (mod) {
            if (!mod) return;
            if (mod.onDown) callbacks.onDown = mod.onDown;
            if (mod.onUp) callbacks.onUp = mod.onUp;
            if (mod.onBack) callbacks.onBack = mod.onBack;
            if (mod.onLeft) callbacks.onLeft = mod.onLeft;
            if (mod.onActive) callbacks.onActive = mod.onActive;
            if (mod.onToggle) callbacks.onToggle = mod.onToggle;
        };

        this.emit = function () {};

        this.toggle = function () {
            if (destroyed) return;
            Lampa.Controller.add(ctrlName, {
                link: self,
                toggle: function () {
                    refreshControllerCollection();
                    if (callbacks.onToggle) callbacks.onToggle();
                },
                right: function () {
                    Navigator.move('right');
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else if (callbacks.onLeft) callbacks.onLeft();
                },
                up: function () {
                    if (activeRow === 1) {
                        activeRow = 0;
                        refreshControllerCollection();
                    } else if (callbacks.onUp) {
                        callbacks.onUp();
                    }
                },
                down: function () {
                    if (activeRow === 0 && epScroll.body().find('.selector').length) {
                        activeRow = 1;
                        refreshControllerCollection();
                    } else if (callbacks.onDown) {
                        callbacks.onDown();
                    }
                },
                back: function () {
                    if (callbacks.onBack) callbacks.onBack();
                }
            });
            Lampa.Controller.toggle(ctrlName);
        };

        this.render = function (js) {
            return js ? $html[0] : $html;
        };

        this.destroy = function () {
            destroyed = true;
            netTmdb.clear();
            epScroll.destroy();
            $html.remove();
        };
    }

    /* ------------------------------------------------------------------ *
     * Переработка блока "Подробно" (.full-descr) — Жанры раскрыты сразу
     * ------------------------------------------------------------------ */

    function enhanceDescriptionBlock($descrRoot, movie, descrItem) {
        if (!$descrRoot || !$descrRoot.length || !movie) return;
        var $descr = $descrRoot.hasClass('full-descr') ? $descrRoot : $descrRoot.find('.full-descr');
        if (!$descr.length || $descr.data('tv-enhanced')) return;
        $descr.data('tv-enhanced', true);
        $descr.addClass('tv-descr');

        var $left = $descr.find('.full-descr__left');
        var $details = $descr.find('.full-descr__details');
        var $tags = $descr.find('.full-descr__tags');
        var media = isSerialMovie(movie) ? 'tv' : 'movie';

        // Переносим .full-descr__details в отдельную правую колонку (как в Figma)
        var $right = $descr.find('.tv-descr__right');
        if (!$right.length) {
            $right = $('<div class="tv-descr__right"></div>');
            $descr.append($right);
        }
        if ($details.length) {
            $right.append($details);
        }

        // Создаём блок жанров (раскрытых) + свёрнутых остальных тегов (Производство, Теги)
        var $tagsArea = $('<div class="tv-descr__tags-area"></div>');
        var $genresLabel = $('<div class="tv-descr__genres-label">' + escapeHtml(Lampa.Lang.translate('full_genre')) + '</div>');
        var $tagsRow = $('<div class="tv-descr__tags-row"></div>');
        var $genresGroup = $('<div class="tv-descr__genres-list"></div>');
        var $otherTagsGroup = $('<div class="tv-descr__other-tags"></div>');

        var genres = Array.isArray(movie.genres) ? movie.genres : [];
        if (genres.length) {
            for (var i = 0; i < genres.length; i++) {
                (function (genre) {
                    if (!genre || !genre.name) return;
                    var $pill = $('<div class="tag-count tv-genre-pill selector"><div class="tag-count__name">' + escapeHtml(Lampa.Utils.capitalizeFirstLetter(genre.name)) + '</div></div>');
                    $pill.on('hover:focus hover:hover hover:touch', function (ev) {
                        if (descrItem) descrItem.last = ev.target;
                    }).on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: genre.url || media,
                            title: Lampa.Utils.capitalizeFirstLetter(genre.name),
                            component: movie.source === 'cub' ? 'category' : 'category_full',
                            genres: genre.id,
                            source: movie.source,
                            page: 1
                        });
                    });
                    $genresGroup.append($pill);
                })(genres[i]);
            }
        }

        // Переносим все .tag-count из .full-descr__tags, КРОМЕ "Жанры" (они уже раскрыты)
        var genreTagName = Lampa.Lang.translate('full_genre');
        $tags.find('.tag-count').each(function () {
            var $tag = $(this);
            var tagTitle = $tag.find('.tag-count__name').text().trim();
            if (tagTitle === genreTagName) {
                $tag.remove();
            } else {
                $otherTagsGroup.append($tag);
            }
        });
        $tags.remove();

        if ($genresGroup.children().length) {
            $tagsArea.append($genresLabel);
            $tagsRow.append($genresGroup);
        }
        if ($otherTagsGroup.children().length) {
            $tagsRow.append($otherTagsGroup);
        }
        if ($tagsRow.children().length) {
            $tagsArea.append($tagsRow);
            $left.append($tagsArea);
        }
    }

    /* ------------------------------------------------------------------ *
     * Инициализация карточки фильма / сериала (full:complite / full:build)
     * ------------------------------------------------------------------ */

    function setupFullCard(e) {
        var movie = e.data && e.data.movie;
        var link = e.link;
        if (!movie || !link || !e.object || !e.object.activity) return;

        var $activityRoot = e.object.activity.render();
        var $start = $activityRoot.find('.full-start-new');
        if (!$start.length) return;

        $start.addClass('tv-card');
        $activityRoot.find('.full-start__background').addClass('tv-card__background');

        // 1. Форматируем .full-start-new__head под Figma: "2014 — США, Великобритания"
        var release = String(movie.release_date || movie.first_air_date || '');
        var year = release ? release.slice(0, 4) : '';
        var countries = (Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb && Lampa.Api.sources.tmdb.parseCountries)
            ? Lampa.Api.sources.tmdb.parseCountries(movie)
            : (movie.production_countries || []).map(function (c) { return c.name || c.iso_3166_1; });

        var headHtml = '';
        if (year) headHtml += '<span>' + escapeHtml(year) + '</span>';
        if (countries && countries.length) {
            headHtml += (year ? ' — ' : '') + escapeHtml(countries.slice(0, 5).join(', '));
        }
        if (headHtml) {
            $start.find('.full-start-new__head').removeClass('hide').html(headHtml);
        }

        // 2. Скрываем стандартную кнопку .button--play и .button--priority (перенесены в Options)
        $start.find('.button--play').removeClass('selector').addClass('hide');
        $start.find('.button--priority').removeClass('selector').addClass('hide');

        // Добавляем кнопку Filmix в скрытый .buttons--container, чтобы она также была в Options
        var $btnContainer = $start.find('.buttons--container');
        if ($btnContainer.length && !$btnContainer.find('.view--tv-filmix').length) {
            var $fxSrcBtn = $('<div class="full-start__button selector view--tv-filmix" data-subtitle="' + escapeHtml(t('tv_filmix_subtitle')) + '">' +
                SVG.filmixIcon + '<span>' + escapeHtml(t('tv_filmix_name')) + '</span></div>');
            $fxSrcBtn.on('hover:enter', function () {
                Filmix.openFilmixPage(movie);
            });
            $btnContainer.prepend($fxSrcBtn);
        }

        // 3. Настраиваем главную кнопку воспроизведения (.button--tv-play)
        var serial = isSerialMovie(movie);
        var $tvPlay = $start.find('.button--tv-play');
        var $tvPlayLabel = $tvPlay.find('span');
        var loadedFilmixPost = null;
        var seriesSection = null;
        var filmixNet = new Lampa.Reguest();

        function updateHeroPlayLabel() {
            if (!serial) {
                $tvPlayLabel.text(t('tv_watch'));
                return;
            }
            if (loadedFilmixPost && loadedFilmixPost.isSerial) {
                var resume = Filmix.findResumeTarget(movie, loadedFilmixPost);
                if (resume) {
                    $tvPlayLabel.text(t('tv_season_short') + ' ' + resume.season.num + ', ' + t('tv_episode_short') + ' ' + resume.episode.episode);
                    return;
                }
            }
            var saved = Filmix.getChoice(movie.id);
            var sNum = saved.last_season || 1;
            var eNum = saved.last_episode || 1;
            $tvPlayLabel.text(t('tv_season_short') + ' ' + sNum + ', ' + t('tv_episode_short') + ' ' + eNum);
        }

        updateHeroPlayLabel();

        // Ставим начальный фокус в start-секции на нашу кнопку .button--tv-play
        if (link.items && link.items[0]) {
            link.items[0].last = $tvPlay[0];
            if (typeof link.items[0].use === 'function') {
                link.items[0].use({
                    onGroupButtons: function () {
                        $start.find('.full-start-new__buttons > .button--priority').remove();
                        $start.find('.button--play').removeClass('selector');
                    }
                });
            }
        }

        $tvPlay.on('hover:focus hover:hover hover:touch', function () {
            if (link.items && link.items[0]) link.items[0].last = $tvPlay[0];
        }).on('hover:enter', function () {
            if (!serial) {
                Filmix.openFilmixPage(movie);
                return;
            }
            if (loadedFilmixPost && loadedFilmixPost.isSerial) {
                var resume = Filmix.findResumeTarget(movie, loadedFilmixPost);
                if (resume) {
                    var tmdbMap = seriesSection ? seriesSection.getTmdbMapForSeason(resume.season.num) : {};
                    Filmix.saveChoice(movie.id, {
                        filmix_id: loadedFilmixPost.id,
                        season: resume.seasonIndex,
                        voice: resume.voiceIndex,
                        voice_name: resume.voice.name,
                        last_season: resume.season.num,
                        last_episode: resume.episode.episode
                    });
                    Filmix.playEpisode(movie, resume.voice, resume.episodeIndex, tmdbMap, function () {
                        updateHeroPlayLabel();
                        if (seriesSection) seriesSection.refreshProgress();
                    });
                    return;
                }
            }
            // Если Filmix ещё не загрузился или сериал не найден автоматически — открываем страницу Filmix
            Filmix.openFilmixPage(movie);
        });

        // 4. Вставляем секцию "series choice" для сериалов с учётом настроек видимости и порядка разделов
        var pendingSeriesInsertIndex = -1;

        function mountSeriesSectionAt(insertIdx) {
            if (!seriesSection || !link.items || !link.items.length) return;
            var clamped = Math.max(1, Math.min(insertIdx, link.items.length));
            var parentNode = link.items[0].render(true) && link.items[0].render(true).parentNode;
            if (parentNode) {
                if (clamped < link.items.length) {
                    var refEl = link.items[clamped].render(true);
                    parentNode.insertBefore(seriesSection.render(true), refEl || null);
                } else {
                    var prevEl = link.items[clamped - 1].render(true);
                    parentNode.insertBefore(seriesSection.render(true), prevEl ? prevEl.nextSibling : null);
                }
            }
            // Синхронно вставляем в link.items и link.rows, чтобы lazy-скролл full.js не пропустил ни одной секции!
            link.items.splice(clamped, 0, seriesSection);
            if (Array.isArray(link.rows)) {
                link.rows.splice(clamped, 0, 'tv_series_choice_placeholder');
            }
            pendingSeriesInsertIndex = -1;
        }

        if (serial && link.items && link.items.length && CardSections.shouldShowSeriesChoice()) {
            seriesSection = new SeriesChoiceSection(link, movie, function () {
                updateHeroPlayLabel();
            });

            // Привязываем стандартные переходы как в items.js
            seriesSection.use({
                onDown: function () { link.emit('down'); },
                onUp: function () { link.emit('up'); },
                onBack: function () { link.emit('back'); },
                onLeft: function () { link.emit('left'); },
                onActive: function () {
                    var idx = link.items.indexOf(seriesSection);
                    if (idx !== -1) link.active = idx;
                },
                onToggle: function () {
                    if (link.scroll) link.scroll.update(seriesSection.render(true));
                }
            });

            var targetIdx = CardSections.getSeriesChoiceInsertIndex(link, e.data);
            if (targetIdx <= link.items.length) {
                mountSeriesSectionAt(targetIdx);
            } else {
                pendingSeriesInsertIndex = targetIdx;
            }
        }

        // 5. Загружаем данные Filmix в фоне для сериалов (и фильмов для качества)
        var loadedFilmixId = 0;

        function loadFilmixData() {
            filmixNet.clear();
            Filmix.resolveForMovie(movie, filmixNet, function (parsed) {
                loadedFilmixPost = parsed;
                loadedFilmixId = parsed ? parsed.id : 0;
                if (serial) {
                    updateHeroPlayLabel();
                    if (seriesSection) seriesSection.setFilmixData(parsed);
                } else if (parsed && parsed.movies && parsed.movies.length) {
                    // Если у фильма не указано качество в деталях — добавим макс. качество с Filmix
                    if (!movie.release_quality && !movie.quality) {
                        var bestQ = 0;
                        for (var i = 0; i < parsed.movies.length; i++) {
                            if (parsed.movies[i].quality > bestQ) bestQ = parsed.movies[i].quality;
                        }
                        var qText = formatQualityBadge(bestQ);
                        if (qText) {
                            var $det = $start.find('.full-start-new__details');
                            if ($det.length && !$det.find('.tv-filmix-quality').length) {
                                if ($det.children().length) $det.append('<span class="full-start-new__split">●</span>');
                                $det.append('<span class="tv-filmix-quality">' + escapeHtml(qText) + '</span>');
                            }
                        }
                    }
                }
            });
        }

        loadFilmixData();

        // 6. Обновляем правую колонку рейтингов и подписываемся на асинхронные изменения (Shikimori, IMDB, Reactions)
        updateRightColumnRatings($start, movie, e.data);

        var observers = [];
        if (typeof MutationObserver !== 'undefined') {
            var rateLineEl = $start.find('.full-start-new__rate-line')[0];
            if (rateLineEl) {
                var rateObs = new MutationObserver(function () {
                    updateRightColumnRatings($start, movie, e.data);
                });
                rateObs.observe(rateLineEl, { childList: true, subtree: true, characterData: true });
                observers.push(rateObs);
            }

            var reactEl = $start.find('.full-start-new__reactions')[0];
            if (reactEl) {
                var reactObs = new MutationObserver(function () {
                    updateRightColumnRatings($start, movie, e.data);
                });
                reactObs.observe(reactEl, { childList: true, subtree: true });
                observers.push(reactObs);
            }
        }

        // 7. Улучшаем блок описания (если уже отрендерен)
        var descrItem = null;
        if (link.items) {
            for (var di = 0; di < link.items.length; di++) {
                if (link.items[di] && link.items[di].render && $(link.items[di].render()).find('.full-descr').length) {
                    descrItem = link.items[di];
                    break;
                }
            }
        }
        enhanceDescriptionBlock($activityRoot, movie, descrItem);

        // 8. Случайный задник, логотип (TMDB /images) и фоновый тихий трейлер (TMDB /videos)
        var cardDestroyed = false;
        var tmdbImagesNet = new Lampa.Reguest();
        loadTmdbImagesForCard(movie, $activityRoot, $start, tmdbImagesNet, function () {
            return cardDestroyed;
        });

        var bgTrailer = new BackgroundTrailer(e.object, $activityRoot, e.data);
        bgTrailer.start();

        // Останавливаем фоновый трейлер при скролле вниз и при необходимости подставляем отложенный series_choice
        if (link.scroll) {
            var origOnScroll = link.scroll.onScroll;
            link.scroll.onScroll = function (pos) {
                if (typeof origOnScroll === 'function') origOnScroll.apply(this, arguments);
                bgTrailer.onScrollDim(pos > 0);
                if (pendingSeriesInsertIndex > 0 && link.items && link.items.length >= pendingSeriesInsertIndex) {
                    mountSeriesSectionAt(pendingSeriesInsertIndex);
                }
            };
        }

        // 9. Обновление прогресса и кнопки Play после возврата из плеера
        function onPlayerClose() {
            updateHeroPlayLabel();
            if (seriesSection) seriesSection.refreshProgress();
        }
        if (Lampa.Player && Lampa.Player.listener) {
            Lampa.Player.listener.follow('close', onPlayerClose);
        }

        // 10. Очистка ресурсов и синхронизация при возврате на экран карточки (напр. со страницы Filmix)
        function onActivityLifecycle(ev) {
            if (!ev || !ev.object || ev.object.activity !== e.object.activity) return;

            if (ev.type === 'start') {
                var savedCh = Filmix.getChoice(movie.id);
                if (savedCh.filmix_id && savedCh.filmix_id !== loadedFilmixId) {
                    loadFilmixData();
                } else if (serial && loadedFilmixPost) {
                    if (seriesSection) seriesSection.setFilmixData(loadedFilmixPost);
                    updateHeroPlayLabel();
                }
            } else if (ev.type === 'destroy') {
                cardDestroyed = true;
                Lampa.Listener.remove('activity', onActivityLifecycle);
                if (Lampa.Player && Lampa.Player.listener) {
                    Lampa.Player.listener.remove('close', onPlayerClose);
                }
                filmixNet.clear();
                tmdbImagesNet.clear();
                bgTrailer.destroy();
                for (var oi = 0; oi < observers.length; oi++) {
                    try { observers[oi].disconnect(); } catch (err) {}
                }
            }
        }
        Lampa.Listener.follow('activity', onActivityLifecycle);
    }

    /* ------------------------------------------------------------------ *
     * Перенос источников кнопки "Смотреть" в меню Options (.button--options)
     * ------------------------------------------------------------------ */

    function onFullOptions(e) {
        if (!e || !e.link || !e.link.html || !Array.isArray(e.options)) return;

        var $btns = e.link.html.find('.buttons--container > .full-start__button').not('.hide');
        if (!$btns.length) return;

        var sourceItems = [];
        $btns.each(function () {
            var $btn = $(this);
            var title = $btn.find('span').text().trim() || $btn.text().trim();
            if (!title) return;
            var subtitle = $btn.data('subtitle') || '';
            var iconHtml = $btn.find('svg').prop('outerHTML');

            var item = {
                title: escapeHtml(title),
                onSelect: function () {
                    Lampa.Controller.toggle('content');
                    $btn.trigger('hover:enter', [{}]);
                }
            };
            if (subtitle) item.subtitle = subtitle;
            if (iconHtml && iconHtml !== 'undefined') {
                item.template = 'selectbox_icon';
                item.icon = iconHtml;
            }
            sourceItems.push(item);
        });

        if (!sourceItems.length) return;

        var prepend = [{ title: t('tv_sources_separator'), separator: true }].concat(sourceItems);
        if (e.options.length) {
            prepend.push({ title: t('tv_other_separator'), separator: true });
        }

        for (var i = prepend.length - 1; i >= 0; i--) {
            e.options.unshift(prepend[i]);
        }
    }

    /* ------------------------------------------------------------------ *
     * Управление разделами карточки (интеграция card-sections.js)
     * ------------------------------------------------------------------ */

    var CardSections = (function () {
        var CS_ID = 'card_sections';
        var SUB_COMPONENT = 'tv_plugin_sections';

        var SECTIONS = [
            { id: 'series_choice', langKey: 'card_sections_name_series_choice', fallback: 'Выбор серий (Filmix)', descrKey: 'card_sections_descr_series_choice' },
            { id: 'description', langKey: 'full_detail', fallback: 'Подробно', descrKey: 'card_sections_descr_description' },
            { id: 'discuss', langKey: 'title_comments', fallback: 'Комментарии', descrKey: 'card_sections_descr_discuss' },
            { id: 'metadata_chart', langKey: 'title_metadata', fallback: 'Метаданные', descrKey: 'card_sections_descr_metadata_chart' },
            { id: 'metadata_tags', langKey: 'title_moods', fallback: 'Настроения', descrKey: 'card_sections_descr_metadata_tags' },
            { id: 'episodes', langKey: 'full_series_release', fallback: 'Выход серий', descrKey: 'card_sections_descr_episodes' },
            { id: 'directors', langKey: 'title_producer', fallback: 'Режиссер', descrKey: 'card_sections_descr_directors' },
            { id: 'actors', langKey: 'title_actors', fallback: 'Актеры', descrKey: 'card_sections_descr_actors' },
            { id: 'collection', langKey: 'title_collection', fallback: 'Коллекция', descrKey: 'card_sections_descr_collection' },
            { id: 'recomend', langKey: 'title_recomendations', fallback: 'Рекомендации', descrKey: 'card_sections_descr_recomend' },
            { id: 'simular', langKey: 'title_similar', fallback: 'Похожие', descrKey: 'card_sections_descr_simular' }
        ];

        var SECTIONS_BY_ID = {};
        for (var i = 0; i < SECTIONS.length; i++) {
            SECTIONS_BY_ID[SECTIONS[i].id] = SECTIONS[i];
        }

        function csKey(name) {
            return CS_ID + '_' + name;
        }

        function csBool(name, def) {
            var val = Lampa.Storage.get(csKey(name), def);
            if (val === true || val === 'true') return true;
            if (val === false || val === 'false') return false;
            return !!def;
        }

        function isPluginEnabled() {
            return csBool('enabled', true);
        }

        function isSectionEnabled(sectionId) {
            return csBool('show_' + sectionId, true);
        }

        function shouldShowSeriesChoice() {
            if (!isPluginEnabled()) return true;
            return isSectionEnabled('series_choice');
        }

        function isArr(val) {
            return Object.prototype.toString.call(val) === '[object Array]';
        }

        function hasCustomOrder() {
            var raw = Lampa.Storage.get(csKey('order'), '');
            if (!raw) return false;
            if (isArr(raw)) return raw.length > 0;
            return String(raw).replace(/\s+/g, '').length > 0;
        }

        function getOrder() {
            var raw = Lampa.Storage.get(csKey('order'), '');
            var parsed = [];
            if (isArr(raw)) parsed = raw;
            else if (raw && typeof raw === 'string') parsed = raw.split(',');

            var result = [];
            var seen = {};
            var idx, id;
            for (idx = 0; idx < parsed.length; idx++) {
                id = String(parsed[idx]).replace(/^\s+|\s+$/g, '');
                if (id && SECTIONS_BY_ID[id] && !seen[id]) {
                    seen[id] = true;
                    result.push(id);
                }
            }
            for (idx = 0; idx < SECTIONS.length; idx++) {
                id = SECTIONS[idx].id;
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
            for (var r = 0; r < order.length; r++) rank[order[r]] = r;
            return rank;
        }

        function saveOrder(orderIds) {
            Lampa.Storage.set(csKey('order'), orderIds.join(','));
            markSettingsDirty();
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

        function sectionTitle(sectionId) {
            var sec = SECTIONS_BY_ID[sectionId];
            if (!sec) return sectionId;
            return t(sec.langKey, sec.fallback);
        }

        function isDirectorList(list) {
            if (!isArr(list) || !list.length) return false;
            return !!(list[0] && list[0].job === 'Director');
        }

        function identifySection(name, rowData, fullData, legacyParams) {
            if (!name || name === 'start') return null;
            if (name === 'tv_series_choice_placeholder') return 'series_choice';
            if (name === 'description' || name === 'descr') return 'description';
            if (name === 'metadata_chart') return 'metadata_chart';
            if (name === 'metadata_tags') return 'metadata_tags';
            if (name === 'episodes') return 'episodes';
            if (name === 'discuss' || name === 'comments') return 'discuss';
            if (name === 'simular') return 'simular';

            if (name === 'persons') {
                var persons = fullData && fullData.persons;
                if (rowData && !isArr(rowData)) {
                    if (persons && rowData.results === persons.cast) return 'actors';
                    if (rowData.title && rowData.title === t('title_producer', '')) return 'directors';
                    if (rowData.title && rowData.title === t('title_actors', '')) return 'actors';
                    if (isDirectorList(rowData.results)) return 'directors';
                    return null;
                }
                if (persons && rowData === persons.cast) return 'actors';
                if (legacyParams && legacyParams.title && legacyParams.title === t('title_producer', '')) return 'directors';
                if (isDirectorList(rowData)) return 'directors';
                if (isArr(rowData)) return 'actors';
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
            if (sectionId === 'description' && fullData && fullData.movie && fullData.movie.adult) return true;
            return isSectionEnabled(sectionId);
        }

        function sortEntries(entries) {
            var rank = getOrderRankMap();
            var fallbackBase = SECTIONS.length + 100;
            entries.sort(function (a, b) {
                var ra = a.sectionId && typeof rank[a.sectionId] === 'number' ? rank[a.sectionId] : fallbackBase + a.index;
                var rb = b.sectionId && typeof rank[b.sectionId] === 'number' ? rank[b.sectionId] : fallbackBase + b.index;
                if (ra !== rb) return ra - rb;
                return a.index - b.index;
            });
            return entries;
        }

        function processRows(rows, fullData) {
            if (!isArr(rows)) return rows;
            var startRows = [];
            var entries = [];
            var idx;

            for (idx = 0; idx < rows.length; idx++) {
                var row = rows[idx];
                var name = isArr(row) ? row[0] : row;
                var rowData = isArr(row) ? row[1] : null;
                if (name === 'start') {
                    startRows.push(row);
                    continue;
                }
                var sectionId = identifySection(name, rowData, fullData, null);
                if (shouldKeepSection(sectionId, fullData)) {
                    entries.push({ item: row, sectionId: sectionId, index: idx });
                }
            }

            if (hasCustomOrder()) sortEntries(entries);

            var result = startRows.slice();
            for (idx = 0; idx < entries.length; idx++) result.push(entries[idx].item);
            return result;
        }

        function getSeriesChoiceInsertIndex(link, fullData) {
            if (!isPluginEnabled() || !hasCustomOrder() || !link || !isArr(link.rows)) return 1;
            var rank = getOrderRankMap();
            var myRank = typeof rank.series_choice === 'number' ? rank.series_choice : 0;
            var fallbackBase = SECTIONS.length + 100;

            for (var idx = 1; idx < link.rows.length; idx++) {
                var row = link.rows[idx];
                var name = isArr(row) ? row[0] : row;
                var rowData = isArr(row) ? row[1] : null;
                var secId = identifySection(name, rowData, fullData, null);
                var r = (secId && typeof rank[secId] === 'number') ? rank[secId] : (fallbackBase + idx);
                if (r > myRank) return idx;
            }
            return link.rows.length;
        }

        function hookModernFull(link, fullData) {
            if (link.__card_sections_patched) return;
            link.__card_sections_patched = true;

            var origBuild = link.build;
            link.build = function () {
                link.build = origBuild;
                if (isPluginEnabled()) {
                    try {
                        link.rows = processRows(link.rows, fullData);
                    } catch (err) {}
                }
                var limit = typeof this.view === 'number' && this.view > 0 ? this.view : link.rows.length;
                return origBuild.call(this, link.rows.slice(0, limit));
            };
        }

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
                    for (var q = 0; q < queue.length; q++) origBuild.apply(comp, queue[q].item);
                    queue = [];
                }
            }

            comp.__card_sections_flush = restoreAndFlush;
            comp.build = function (name, rowData, params) {
                if (!isPluginEnabled() || name === 'start') return origBuild.apply(this, arguments);
                var sectionId = null;
                try {
                    sectionId = identifySection(name, rowData, fullData, params);
                    if (!shouldKeepSection(sectionId, fullData)) return;
                } catch (err) {}
                if (useCustomOrder) {
                    var argsCopy = [];
                    for (var a = 0; a < arguments.length; a++) argsCopy.push(arguments[a]);
                    queue.push({ item: argsCopy, sectionId: sectionId, index: seq++ });
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
                    if (e.link && isArr(e.link.rows) && typeof e.link.build === 'function') {
                        hookModernFull(e.link, e.data);
                        return;
                    }
                    var comp = e.object && e.object.activity && typeof e.object.activity.component === 'function'
                        ? e.object.activity.component()
                        : null;
                    if (comp && typeof comp.build === 'function') hookLegacyFull(comp, e.data);
                } catch (err) {}
            } else if (e.type === 'complite') {
                try {
                    var legacyComp = !e.link && e.object && e.object.activity && typeof e.object.activity.component === 'function'
                        ? e.object.activity.component()
                        : null;
                    if (legacyComp && typeof legacyComp.__card_sections_flush === 'function') {
                        legacyComp.__card_sections_flush();
                    }
                } catch (err2) {}
            }
        }

        function refreshSubsectionView(backIndex) {
            var $body = $('.settings__body');
            var $sels = $body.find('.selector');
            var lastIdx = $sels.index($body.find('.selector.focus'));
            if (lastIdx < 0) lastIdx = 0;
            Lampa.Settings.create(SUB_COMPONENT, {
                last_index: lastIdx,
                onBack: function () {
                    Lampa.Settings.create(PLUGIN_ID, { last_index: backIndex });
                    $('.settings__title').text(t('tv_settings_title'));
                }
            });
            $('.settings__title').text(t('card_sections_title'));
        }

        function rebuildSettingsParams(backIndex) {
            try {
                if (Lampa.SettingsApi && typeof Lampa.SettingsApi.removeParams === 'function') {
                    Lampa.SettingsApi.removeParams(SUB_COMPONENT);
                    addSettingsParams(backIndex);
                    return true;
                }
            } catch (e) {}
            return false;
        }

        function setAllSections(visible, backIndex) {
            for (var s = 0; s < SECTIONS.length; s++) {
                Lampa.Storage.set(csKey('show_' + SECTIONS[s].id), !!visible);
            }
            markSettingsDirty();
            refreshSubsectionView(backIndex);
            Lampa.Noty.show(t(visible ? 'card_sections_noty_shown' : 'card_sections_noty_hidden'));
        }

        function resetOrder(silentSettingsUpdate, backIndex) {
            Lampa.Storage.set(csKey('order'), '');
            markSettingsDirty();
            if (!silentSettingsUpdate) {
                rebuildSettingsParams(backIndex);
                refreshSubsectionView(backIndex);
            }
            Lampa.Noty.show(t('card_sections_noty_order_reset'));
        }

        function openOrderEditor(pickedId, focusId, changedInModal, backIndex) {
            if (!Lampa.Select || typeof Lampa.Select.show !== 'function') return;
            var order = getOrder();
            var pickedIndex = pickedId ? order.indexOf(pickedId) : -1;
            var items = [];

            for (var idx = 0; idx < order.length; idx++) {
                (function (secId, index) {
                    var visible = isSectionEnabled(secId);
                    var title = (index + 1) + '. ' + sectionTitle(secId);
                    var subtitle = '';

                    if (pickedIndex >= 0) {
                        subtitle = index === pickedIndex
                            ? t('card_sections_order_cancel')
                            : (t('card_sections_order_place_here') + ' ' + (index + 1));
                    } else {
                        subtitle = visible
                            ? t('card_sections_order_pick_hint')
                            : (t('card_sections_order_hidden_tag') + ' · ' + t('card_sections_order_pick_hint'));
                    }

                    items.push({
                        title: escapeHtml(title),
                        subtitle: escapeHtml(subtitle),
                        selected: focusId ? secId === focusId : (pickedIndex >= 0 && index === pickedIndex),
                        picked: pickedIndex >= 0 && index === pickedIndex,
                        ghost: !visible,
                        onSelect: function () {
                            if (pickedIndex < 0) openOrderEditor(secId, secId, changedInModal, backIndex);
                            else if (index === pickedIndex) openOrderEditor(null, secId, changedInModal, backIndex);
                            else {
                                moveInOrder(pickedIndex, index);
                                openOrderEditor(null, pickedId, true, backIndex);
                            }
                        }
                    });
                })(order[idx], idx);
            }

            if (pickedIndex < 0) {
                items.push({ title: escapeHtml(t('card_sections_group_actions')), separator: true });
                items.push({
                    title: escapeHtml(t('card_sections_reset_order')),
                    subtitle: escapeHtml(t('card_sections_reset_order_descr')),
                    onSelect: function () {
                        resetOrder(true, backIndex);
                        openOrderEditor(null, null, true, backIndex);
                    }
                });
            }

            var modalTitle = pickedIndex >= 0
                ? (t('card_sections_order_move_title') + ' ' + sectionTitle(pickedId))
                : t('card_sections_order');

            Lampa.Select.show({
                title: modalTitle,
                items: items,
                onBack: function () {
                    if (pickedIndex >= 0) {
                        openOrderEditor(null, pickedId, changedInModal, backIndex);
                        return;
                    }
                    try { Lampa.Controller.toggle('settings_component'); } catch (e) {}
                    if (changedInModal && rebuildSettingsParams(backIndex)) {
                        refreshSubsectionView(backIndex);
                    }
                }
            });
        }

        function addSettingsParams(backIndex) {
            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('enabled'), type: 'trigger', 'default': true },
                field: {
                    name: t('card_sections_enabled'),
                    description: t('card_sections_enabled_descr')
                },
                onChange: markSettingsDirty
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('order_editor'), type: 'button' },
                field: {
                    name: t('card_sections_order'),
                    description: t('card_sections_order_descr')
                },
                onChange: function () {
                    openOrderEditor(null, null, false, backIndex);
                }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('title_sections'), type: 'title' },
                field: { name: t('card_sections_group_sections') }
            });

            var order = getOrder();
            for (var idx = 0; idx < order.length; idx++) {
                var sec = SECTIONS_BY_ID[order[idx]];
                if (!sec) continue;
                Lampa.SettingsApi.addParam({
                    component: SUB_COMPONENT,
                    param: { name: csKey('show_' + sec.id), type: 'trigger', 'default': true },
                    field: {
                        name: (idx + 1) + '. ' + t(sec.langKey, sec.fallback),
                        description: t(sec.descrKey)
                    },
                    onChange: markSettingsDirty
                });
            }

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('title_actions'), type: 'title' },
                field: { name: t('card_sections_group_actions') }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('show_all'), type: 'button' },
                field: {
                    name: t('card_sections_show_all'),
                    description: t('card_sections_show_all_descr')
                },
                onChange: function () { setAllSections(true, backIndex); }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('hide_all'), type: 'button' },
                field: {
                    name: t('card_sections_hide_all'),
                    description: t('card_sections_hide_all_descr')
                },
                onChange: function () { setAllSections(false, backIndex); }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { name: csKey('reset_order'), type: 'button' },
                field: {
                    name: t('card_sections_reset_order'),
                    description: t('card_sections_reset_order_descr')
                },
                onChange: function () { resetOrder(false, backIndex); }
            });
        }

        return {
            SUB_COMPONENT: SUB_COMPONENT,
            onFullEvent: onFullEvent,
            shouldShowSeriesChoice: shouldShowSeriesChoice,
            getSeriesChoiceInsertIndex: getSeriesChoiceInsertIndex,
            addSettingsParams: addSettingsParams
        };
    })();

    /* ------------------------------------------------------------------ *
     * Настройка элементов шапки (интеграция head_filter.js)
     * ------------------------------------------------------------------ */

    var HeadFilter = (function () {
        var SUB_COMPONENT = 'tv_plugin_head';

        var ITEMS = [
            { key: 'head_filter_show_search', lang: 'tv_head_search', selector: '.open--search' },
            { key: 'head_filter_show_settings', lang: 'tv_head_settings', selector: '.open--settings' },
            { key: 'head_filter_show_premium', lang: 'tv_head_premium', selector: '.open--premium' },
            { key: 'head_filter_show_profile', lang: 'tv_head_profile', selector: '.open--profile' },
            { key: 'head_filter_show_feed', lang: 'tv_head_feed', selector: '.open--feed' },
            { key: 'head_filter_show_notice', lang: 'tv_head_notice', selector: '.notice--icon' },
            { key: 'head_filter_show_broadcast', lang: 'tv_head_broadcast', selector: '.open--broadcast' },
            { key: 'head_filter_show_fullscreen', lang: 'tv_head_fullscreen', selector: '.full-screen' },
            { key: 'head_filter_show_reload', lang: 'tv_head_reload', selector: '.m-reload-screen' },
            { key: 'head_filter_show_blackfriday', lang: 'tv_head_blackfriday', selector: '.black-friday__button' },
            { key: 'head_filter_show_split', lang: 'tv_head_split', selector: '.head__split' },
            { key: 'head_filter_show_time', lang: 'tv_head_time', selector: '.head__time' }
        ];

        var ITEMS_BY_KEY = {};
        for (var i = 0; i < ITEMS.length; i++) {
            ITEMS_BY_KEY[ITEMS[i].key] = ITEMS[i];
        }

        function applyItem(item) {
            if (!item) return;
            var show = getBoolSetting(item.key, true);
            $('.head ' + item.selector + ', ' + item.selector).toggleClass('tv-head-hidden', !show);
        }

        function applyAll() {
            for (var idx = 0; idx < ITEMS.length; idx++) {
                applyItem(ITEMS[idx]);
            }
        }

        function init() {
            applyAll();
            setTimeout(applyAll, 600);
            setTimeout(applyAll, 1500);

            Lampa.Storage.listener.follow('change', function (event) {
                try {
                    if (!event || !event.name) return;
                    if (event.name === 'activity') {
                        setTimeout(applyAll, 500);
                    } else if (ITEMS_BY_KEY[event.name]) {
                        applyItem(ITEMS_BY_KEY[event.name]);
                    }
                } catch (e) {}
            });

            Lampa.Listener.follow('activity', function (event) {
                try {
                    if (event && event.type === 'start') {
                        setTimeout(applyAll, 150);
                    }
                } catch (e) {}
            });
        }

        function addSettingsParams() {
            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { type: 'title' },
                field: { name: t('tv_head_group') }
            });

            for (var idx = 0; idx < ITEMS.length; idx++) {
                (function (item) {
                    Lampa.SettingsApi.addParam({
                        component: SUB_COMPONENT,
                        param: {
                            name: item.key,
                            type: 'trigger',
                            'default': true
                        },
                        field: {
                            name: t(item.lang)
                        },
                        onChange: function () {
                            applyItem(item);
                        }
                    });
                })(ITEMS[idx]);
            }
        }

        return {
            SUB_COMPONENT: SUB_COMPONENT,
            init: init,
            applyAll: applyAll,
            addSettingsParams: addSettingsParams
        };
    })();

    /* ------------------------------------------------------------------ *
     * Единый раздел настроек плагина с подразделами
     * ------------------------------------------------------------------ */

    var settingsDirty = false;
    var settingsRefreshTimer = null;

    function markSettingsDirty() {
        settingsDirty = true;
    }

    function refreshFullActivities() {
        var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;

        if (Lampa.Activity && typeof Lampa.Activity.all === 'function') {
            var all = Lampa.Activity.all() || [];
            for (var i = 0; i < all.length; i++) {
                var item = all[i];
                if (!item || item.component !== 'full' || !item.activity || item === active) continue;
                try {
                    if (typeof item.activity.refresh === 'function') item.activity.refresh();
                    else if (typeof item.activity.needRefresh === 'function') item.activity.needRefresh();
                } catch (e) {}
            }
        }

        if (active && active.component === 'full') {
            try {
                if (typeof Lampa.Activity.replace === 'function') Lampa.Activity.replace({});
            } catch (e2) {}
        }
    }

    function maybeRefreshActiveCard() {
        if (!settingsDirty) return;
        settingsDirty = false;
        if (settingsRefreshTimer) clearTimeout(settingsRefreshTimer);
        settingsRefreshTimer = setTimeout(function () {
            settingsRefreshTimer = null;
            refreshFullActivities();
        }, 60);
    }

    function registerSettings() {
        // Регистрируем значения по умолчанию для инпутов Filmix
        Lampa.Params.select('tv_filmix_token', '', '');
        Lampa.Params.select('tv_filmix_proxy', DEFAULT_PROXY, '');

        // Главный единый пункт плагина в меню настроек Lampa
        Lampa.SettingsApi.addComponent({
            component: PLUGIN_ID,
            name: t('tv_settings_title'),
            icon: SVG.settings
        });

        // Шаблоны подразделов (не добавляются в главный список SettingsApi — открываются из TV)
        Lampa.Template.add('settings_tv_plugin_filmix', '<div>' +
            '<div class="settings-param" data-name="tv_filmix_profile" data-static="true"></div>' +
            '<div class="settings-param selector" data-name="tv_filmix_refresh" data-static="true"><div class="settings-param__name">#{tv_filmix_refresh}</div></div>' +
            '<div class="settings-param selector" data-name="tv_filmix_proxy" data-type="input" data-string="true" placeholder="https://cors.example.com/">' +
            '<div class="settings-param__name">#{tv_filmix_proxy_title}</div><div class="settings-param__value"></div><div class="settings-param__descr">#{tv_filmix_proxy_descr}</div></div>' +
            '<div class="settings-param selector" data-name="tv_filmix_token" data-type="input" data-string="true" placeholder="#{tv_filmix_token_placeholder}">' +
            '<div class="settings-param__name">#{tv_filmix_token_title}</div><div class="settings-param__value"></div><div class="settings-param__descr">#{tv_filmix_token_descr}</div></div>' +
            '<div class="settings-param selector" data-name="tv_filmix_add_device" data-static="true"><div class="settings-param__name">#{tv_filmix_add_device}</div></div>' +
            '</div>');

        Lampa.Template.add('settings_tv_plugin_ratings', '<div></div>');
        Lampa.Template.add('settings_tv_plugin_sections', '<div></div>');
        Lampa.Template.add('settings_tv_plugin_head', '<div></div>');

        function openSubSection(subId, subTitle, backIndex) {
            Lampa.Settings.create(subId, {
                onBack: function () {
                    Lampa.Settings.create(PLUGIN_ID, { last_index: backIndex });
                    $('.settings__title').text(t('tv_settings_title'));
                }
            });
            $('.settings__title').text(subTitle);
        }

        // --- Главный экран настроек TV ---
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { type: 'title' },
            field: { name: t('tv_section_submenus') }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { type: 'static' },
            field: {
                name: t('tv_sub_filmix_title'),
                description: t('tv_sub_filmix_descr')
            },
            onRender: function (item) {
                item.on('hover:enter', function () {
                    openSubSection('tv_plugin_filmix', t('tv_sub_filmix_title'), 0);
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { type: 'static' },
            field: {
                name: t('tv_sub_ratings_title'),
                description: t('tv_sub_ratings_descr')
            },
            onRender: function (item) {
                item.on('hover:enter', function () {
                    openSubSection('tv_plugin_ratings', t('tv_sub_ratings_title'), 1);
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { type: 'static' },
            field: {
                name: t('card_sections_title'),
                description: t('card_sections_sub_descr')
            },
            onRender: function (item) {
                item.on('hover:enter', function () {
                    openSubSection(CardSections.SUB_COMPONENT, t('card_sections_title'), 2);
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { type: 'static' },
            field: {
                name: t('tv_head_title'),
                description: t('tv_head_descr')
            },
            onRender: function (item) {
                item.on('hover:enter', function () {
                    openSubSection(HeadFilter.SUB_COMPONENT, t('tv_head_title'), 3);
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { type: 'title' },
            field: { name: t('tv_section_general') }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: {
                name: 'tv_show_logo',
                type: 'trigger',
                'default': true
            },
            field: {
                name: t('tv_setting_show_logo'),
                description: t('tv_setting_show_logo_descr')
            },
            onChange: markSettingsDirty
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: {
                name: 'tv_bg_trailer',
                type: 'trigger',
                'default': true
            },
            field: {
                name: t('tv_setting_bg_trailer'),
                description: t('tv_setting_bg_trailer_descr')
            },
            onChange: markSettingsDirty
        });

        // --- Подраздел: Рейтинги ---
        Lampa.SettingsApi.addParam({
            component: 'tv_plugin_ratings',
            param: {
                name: 'tv_show_imdb',
                type: 'trigger',
                'default': true
            },
            field: {
                name: t('tv_setting_show_imdb'),
                description: t('tv_setting_show_imdb_descr')
            },
            onChange: markSettingsDirty
        });

        Lampa.SettingsApi.addParam({
            component: 'tv_plugin_ratings',
            param: {
                name: 'tv_show_shikimori',
                type: 'trigger',
                'default': true
            },
            field: {
                name: t('tv_setting_show_shikimori'),
                description: t('tv_setting_show_shikimori_descr')
            },
            onChange: markSettingsDirty
        });

        Lampa.SettingsApi.addParam({
            component: 'tv_plugin_ratings',
            param: {
                name: 'tv_show_new_rating',
                type: 'trigger',
                'default': true
            },
            field: {
                name: t('tv_setting_show_new_rating'),
                description: t('tv_setting_show_new_rating_descr')
            },
            onChange: markSettingsDirty
        });

        Lampa.SettingsApi.addParam({
            component: 'tv_plugin_ratings',
            param: {
                name: 'tv_show_badges',
                type: 'trigger',
                'default': true
            },
            field: {
                name: t('tv_setting_show_badges')
            },
            onChange: markSettingsDirty
        });

        // --- Обработчики подраздела Filmix ---
        Lampa.Settings.listener.follow('open', function (e) {
            try {
                if (e.name !== 'tv_plugin_filmix') return;

                Filmix.renderProfileBox();
                var tok = Filmix.getToken();
                if (tok) Filmix.fetchUserProfile(tok);

                e.body.find('[data-name="tv_filmix_refresh"]').unbind('hover:enter').on('hover:enter', function () {
                    var curToken = Filmix.getToken();
                    if (!curToken) {
                        Lampa.Noty.show(t('tv_filmix_nodevice'));
                        return;
                    }
                    Filmix.fetchUserProfile(curToken, function (profile) {
                        if (profile) Lampa.Noty.show(t('tv_filmix_profile_updated'));
                    });
                });

                e.body.find('[data-name="tv_filmix_add_device"]').unbind('hover:enter').on('hover:enter', function () {
                    Filmix.startDevicePairing(function (newToken) {
                        e.body.find('[data-name="tv_filmix_token"] .settings-param__value').text(newToken);
                        Filmix.resetCache();
                        markSettingsDirty();
                    });
                });
            } catch (err) {}
        });

        Lampa.Storage.listener.follow('change', function (e) {
            try {
                if (e.name === 'tv_filmix_proxy') {
                    Filmix.resetCache();
                    markSettingsDirty();
                } else if (e.name === 'tv_filmix_token') {
                    Filmix.resetCache();
                    markSettingsDirty();
                    if (e.value) Filmix.fetchUserProfile(e.value);
                    else {
                        Lampa.Storage.set('tv_filmix_status', {});
                        Filmix.renderProfileBox();
                    }
                }
            } catch (err) {}
        });

        // --- Подраздел: Разделы карточки ---
        CardSections.addSettingsParams(2);

        // --- Подраздел: Настройка шапки ---
        HeadFilter.addSettingsParams();

        // Обновляем открытую карточку при выходе из настроек, если что-то меняли
        if (Lampa.Settings && Lampa.Settings.listener) {
            Lampa.Settings.listener.follow('close', maybeRefreshActiveCard);
        }
        Lampa.Controller.listener.follow('toggle', function (e) {
            if (e && e.name !== 'settings' && e.name !== 'settings_component' && e.name !== 'modal' && e.name !== 'keybord' && e.name !== 'select') {
                maybeRefreshActiveCard();
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * Шаблон full_start_new и CSS-стили
     * ------------------------------------------------------------------ */

    function registerTemplatesAndStyles() {
        var fullStartTpl = '<div class="full-start-new tv-card">' +
            '<div class="full-start-new__body">' +
            '<div class="full-start-new__left hide">' +
            '<div class="full-start-new__poster"><img class="full-start-new__img full--poster" /></div>' +
            '</div>' +
            '<div class="full-start-new__right tv-hero__columns">' +
            '<div class="tv-hero__left">' +
            '<div class="full-start-new__head"></div>' +
            '<div class="full-start-new__title">{title}</div>' +
            '<div class="tv-hero__details"><div class="full-start-new__details"></div></div>' +
            '<div class="full-start-new__buttons">' +
            '<div class="full-start__button selector button--tv-play">' + SVG.play + '<span>#{tv_watch}</span></div>' +
            '<div class="full-start__button selector button--book">' + SVG.book + '<span>#{settings_input_links}</span></div>' +
            '<div class="full-start__button selector button--reaction">' + SVG.reaction + '<span>#{title_reactions}</span></div>' +
            '<div class="full-start__button selector button--subscribe hide">' + SVG.subscribe + '<span>#{title_subscribe}</span></div>' +
            '<div class="full-start__button selector button--options">' + SVG.options + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="tv-hero__right">' +
            '<div class="tv-hero__meta-row">' +
            '<div class="tv-main-rate hide"><div class="tv-main-rate__score"></div><div class="tv-main-rate__label"></div></div>' +
            '<div class="tv-badges-stack">' +
            '<div class="full-start__pg hide"></div>' +
            '<div class="full-start__status hide"></div>' +
            '</div>' +
            '</div>' +
            '<div class="tv-new-rating hide">' +
            '<div class="tv-new-rating__side tv-new-rating__side--pos">' +
            '<div class="tv-new-rating__icon">' + SVG.like + '</div>' +
            '<div class="tv-new-rating__pct tv-new-rating__pct--pos">0%</div>' +
            '</div>' +
            '<div class="tv-new-rating__center">' +
            '<div class="tv-new-rating__bar">' +
            '<div class="tv-new-rating__bar-pos"></div>' +
            '<div class="tv-new-rating__bar-neg"></div>' +
            '</div>' +
            '<div class="tv-new-rating__total">0</div>' +
            '</div>' +
            '<div class="tv-new-rating__side tv-new-rating__side--neg">' +
            '<div class="tv-new-rating__icon">' + SVG.dislike + '</div>' +
            '<div class="tv-new-rating__pct tv-new-rating__pct--neg">0%</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="hide tv-hidden-compat">' +
            '<div class="full-start__button button--play"><span>#{title_watch}</span></div>' +
            '<div class="full-start-new__reactions"><div>#{reactions_none}</div></div>' +
            '<div class="full-start-new__rate-line">' +
            '<div class="full-start__rate rate--tmdb hide"><div>{rating}</div><div>TMDB</div></div>' +
            '<div class="full-start__rate rate--imdb hide"><div></div><div>IMDB</div></div>' +
            '<div class="full-start__rate rate--kp hide"><div></div><div>KP</div></div>' +
            '</div>' +
            '</div>' +
            '<div class="hide buttons--container">' +
            '<div class="full-start__button view--torrent hide">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px"><path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/></svg>' +
            '<span>#{full_torrents}</span></div>' +
            '<div class="full-start__button selector view--trailer">' +
            '<svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"></path></svg>' +
            '<span>#{full_trailers}</span></div>' +
            '</div>' +
            '</div>';

        Lampa.Template.add('full_start_new', fullStartTpl);

        var css = '' +
            /* --- Head Filter --- */
            '.tv-head-hidden{display:none !important}' +

            /* --- Background & Trailer --- */
            '.tv-card__background{left:0 !important;top:-5em !important;width:100% !important;height:105vh !important;object-fit:cover;-webkit-mask-image:-webkit-linear-gradient(top,#fff 48%,rgba(255,255,255,0) 98%) !important;mask-image:linear-gradient(to bottom,#fff 48%,rgba(255,255,255,0) 98%) !important;-webkit-transition:opacity .6s ease;transition:opacity .6s ease}' +
            '.tv-card__background.loaded:not(.dim){opacity:1 !important}' +
            '.tv-card__background.tv-bg--hidden{opacity:0 !important}' +
            '.tv-bg-trailer{position:absolute;left:0;top:-5em;width:100%;height:105vh;z-index:-1;overflow:hidden;pointer-events:none;opacity:0;-webkit-transition:opacity .7s ease;transition:opacity .7s ease;-webkit-mask-image:-webkit-linear-gradient(top,#fff 48%,rgba(255,255,255,0) 98%);mask-image:linear-gradient(to bottom,#fff 48%,rgba(255,255,255,0) 98%)}' +
            '.tv-bg-trailer.tv-bg-trailer--visible{opacity:1}' +
            '.tv-bg-trailer__wrap{position:absolute;top:50%;left:50%;width:120vw;height:120vh;-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);pointer-events:none}' +
            '.tv-bg-trailer__wrap iframe{width:100%;height:100%;border:0;pointer-events:none}' +

            /* --- Hero Layout --- */
            '.full-start-new.tv-card{padding-bottom:2.8em}' +
            '.full-start-new.tv-card .full-start-new__body{min-height:76vh;height:78vh;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end}' +
            '.full-start-new.tv-card .tv-hero__columns{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;width:100%}' +
            '.tv-hero__left{-webkit-box-flex:1;-webkit-flex:1 1 auto;flex:1 1 auto;min-width:0;padding-right:2em}' +
            '.tv-hero__right{-webkit-flex-shrink:0;flex-shrink:0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;padding-bottom:.3em}' +
            '.full-start-new.tv-card .full-start-new__head{font-size:1.22em;color:rgba(255,255,255,.68);margin-bottom:.15em;text-shadow:0 1px 6px rgba(0,0,0,.45)}' +
            '.full-start-new.tv-card .full-start-new__head span{color:#fff}' +
            '.full-start-new.tv-card .full-start-new__title{font-size:4.1em;font-weight:600;line-height:1.15;margin-bottom:.25em;text-shadow:0 .06em .28em rgba(0,0,0,.45);max-width:100%}' +
            '.full-start-new.tv-card .full-start-new__title.tv-title--logo{display:block;overflow:visible;max-height:none;-webkit-line-clamp:unset;line-clamp:unset;margin-left:0;margin-bottom:.85em;font-size:1em}' +
            '.tv-title-logo{display:block;max-height:10em;max-width:24em;width:auto;height:auto;object-fit:contain;object-position:left bottom;-webkit-filter:drop-shadow(0 .1em .35em rgba(0,0,0,.55));filter:drop-shadow(0 .1em .35em rgba(0,0,0,.55));opacity:0;-webkit-transition:opacity .35s ease;transition:opacity .35s ease}' +
            '.tv-title-logo.tv-title-logo--loaded{opacity:1}' +
            '.tv-hero__details{margin-bottom:1.2em}' +
            '.full-start-new.tv-card .full-start-new__details{margin:0;font-size:1.1em;color:rgba(255,255,255,.95);display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.45em .75em;text-shadow:0 1px 4px rgba(0,0,0,.4)}' +
            '.full-start-new.tv-card .full-start-new__details>*{margin:0}' +
            '.full-start-new.tv-card .full-start-new__split{font-size:.6em;color:rgba(255,255,255,.55)}' +

            /* --- Hero Buttons --- */
            '.full-start-new.tv-card .full-start-new__buttons{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.8em}' +
            '.full-start-new.tv-card .full-start-new__buttons>.button--play,.full-start-new.tv-card .full-start-new__buttons>.button--priority{display:none !important}' +
            '.full-start-new.tv-card .full-start-new__buttons .full-start__button{margin:0;height:3.6em;border-radius:1.14em;background-color:rgba(0,0,0,.38);color:#fff;display:-webkit-inline-box;display:-webkit-inline-flex;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center;-webkit-transition:background-color .18s,color .18s,-webkit-transform .18s;transition:background-color .18s,color .18s,transform .18s}' +
            '.full-start-new.tv-card .full-start-new__buttons .full-start__button:not(.button--tv-play){width:3.85em;padding:0}' +
            '.full-start-new.tv-card .full-start-new__buttons .full-start__button:not(.button--tv-play) span{display:none !important}' +
            '.full-start-new.tv-card .full-start-new__buttons .full-start__button>svg{width:1.45em;height:1.45em}' +
            '.full-start-new.tv-card .full-start-new__buttons .button--options>svg{width:1.45em;height:.5em}' +
            '.full-start-new.tv-card .full-start-new__buttons .button--book>svg{width:1.05em;height:1.45em}' +
            '.full-start-new.tv-card .full-start-new__buttons .button--tv-play{padding:0 1.4em 0 1.2em;background-color:rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}' +
            '.full-start-new.tv-card .full-start-new__buttons .button--tv-play span{display:inline-block !important;margin-left:.65em;margin-top:0;font-size:1em;font-weight:500;white-space:nowrap}' +
            '.full-start-new.tv-card .full-start-new__buttons .full-start__button.focus{background-color:#fff !important;color:#000 !important}' +

            /* --- Hero Right Column: Rating, Badges, New Rating --- */
            '.tv-hero__meta-row{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;-webkit-box-pack:end;-webkit-justify-content:flex-end;justify-content:flex-end;gap:.95em}' +
            '.tv-main-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:inline-flex;-webkit-box-align:stretch;-webkit-align-items:stretch;align-items:stretch;height:2.28em;border-radius:.32em;background:rgba(0,0,0,.32);overflow:hidden}' +
            '.tv-main-rate__score{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center;min-width:2.7em;padding:0 .45em;background:rgba(0,0,0,.32);border-radius:.32em;font-size:1.3em;font-weight:500;color:#fff}' +
            '.tv-main-rate__label{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;padding:0 .65em;font-size:.96em;color:rgba(255,255,255,.92);letter-spacing:.02em}' +
            '.tv-badges-stack{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;gap:.75em}' +
            '.tv-badges-stack.tv-setting-hidden{display:none !important}' +
            '.full-start-new.tv-card .tv-badges-stack .full-start__pg,.full-start-new.tv-card .tv-badges-stack .full-start__status{margin:0;font-size:1.08em;line-height:1.1;padding:.38em .58em;border:1.5px solid rgba(255,255,255,.9);border-radius:.24em;color:#fff;white-space:nowrap}' +

            /* --- New Rating (Reactions Bar) --- */
            '.tv-new-rating{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;gap:.45em;margin-top:.95em;width:17.9em}' +
            '.tv-new-rating--empty{opacity:.55}' +
            '.tv-new-rating__side{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.2em;width:1.7em;-webkit-flex-shrink:0;flex-shrink:0}' +
            '.tv-new-rating__icon{width:1.45em;height:1.45em;display:-webkit-box;display:-webkit-flex;display:flex}' +
            '.tv-new-rating__icon svg{width:100%;height:100%}' +
            '.tv-new-rating__pct{font-size:.7em;font-weight:700;line-height:1}' +
            '.tv-new-rating__pct--pos{color:rgba(117,199,27,.95)}' +
            '.tv-new-rating__pct--neg{color:rgba(255,41,61,.95)}' +
            '.tv-new-rating__center{-webkit-box-flex:1;-webkit-flex:1 1 auto;flex:1 1 auto;padding-top:.42em;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.24em}' +
            '.tv-new-rating__bar{width:100%;height:.86em;border-radius:.52em;background:rgba(255,255,255,.18);overflow:hidden;display:-webkit-box;display:-webkit-flex;display:flex}' +
            '.tv-new-rating__bar-pos{height:100%;background:rgba(117,199,27,.92);-webkit-transition:width .3s ease;transition:width .3s ease;border-right:1px solid rgba(255,255,255,.85)}' +
            '.tv-new-rating__bar-neg{height:100%;background:rgba(255,41,61,.92);-webkit-transition:width .3s ease;transition:width .3s ease}' +
            '.tv-new-rating--empty .tv-new-rating__bar-pos{border-right:none}' +
            '.tv-new-rating__total{font-size:.62em;font-weight:500;color:rgba(255,255,255,.75)}' +

            /* --- Series Choice Shelf --- */
            '.tv-series-choice{padding:0 1.5em 2.5em 1.5em}' +
            '.tv-series-choice__header{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.65em;margin-bottom:1.35em;-webkit-flex-wrap:wrap;flex-wrap:wrap}' +
            '.tv-pill{display:-webkit-inline-box;display:-webkit-inline-flex;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.5em;height:2.55em;padding:0 1.05em;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);color:#fff;font-size:.92em;font-weight:600;-webkit-transition:background-color .16s,color .16s,border-color .16s;transition:background-color .16s,color .16s,border-color .16s}' +
            '.tv-pill__muted{font-weight:400;color:rgba(255,255,255,.6)}' +
            '.tv-pill__dot{font-size:.5em;opacity:.85}' +
            '.tv-pill__quality{font-weight:400}' +
            '.tv-pill__chev{width:.85em;height:.85em;display:-webkit-inline-box;display:-webkit-inline-flex;display:inline-flex}' +
            '.tv-pill__chev svg{width:100%;height:100%}' +
            '.tv-pill--fx{padding:0 .95em}' +
            '.tv-pill--fx svg{width:.95em;height:.95em}' +
            '.tv-pill.focus{background:#fff !important;border-color:#fff !important;color:#0b0c0e !important}' +
            '.tv-pill.focus .tv-pill__muted{color:rgba(11,12,14,.6)}' +
            '.tv-series-choice__cards{margin:0 -1.5em}' +
            '.tv-series-choice__cards .scroll__content{padding:.3em 1.5em}' +
            '.tv-ep-cards{display:-webkit-box;display:-webkit-flex;display:flex;gap:.95em}' +
            '.tv-ep-card{width:16.1em;-webkit-flex-shrink:0;flex-shrink:0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;gap:.45em}' +
            '.tv-ep-card__thumb{position:relative;width:100%;height:9.03em;border-radius:.72em;overflow:hidden;background:-webkit-linear-gradient(135deg,#1d2c45 0%,#0f1624 100%);background:linear-gradient(135deg,#1d2c45 0%,#0f1624 100%);-webkit-transition:box-shadow .18s,-webkit-transform .18s;transition:box-shadow .18s,transform .18s}' +
            '.tv-ep-card--upcoming .tv-ep-card__thumb{background:-webkit-linear-gradient(135deg,#1b3b26 0%,#121916 100%);background:linear-gradient(135deg,#1b3b26 0%,#121916 100%)}' +
            '.tv-ep-card__img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;-webkit-transition:opacity .3s;transition:opacity .3s}' +
            '.tv-ep-card__img.loaded{opacity:1}' +
            '.tv-ep-card__shade{position:absolute;left:0;right:0;bottom:0;height:42%;background:-webkit-linear-gradient(top,rgba(0,0,0,0) 0%,rgba(0,0,0,.78) 100%);background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.78) 100%)}' +
            '.tv-ep-card__duration{position:absolute;left:1.06em;bottom:1.75em;font-size:.66em;font-weight:500;color:rgba(255,255,255,.86);z-index:2}' +
            '.tv-ep-card__upcoming-badge{position:absolute;right:1.06em;bottom:1.75em;font-size:.66em;font-weight:500;color:rgba(255,255,255,.86);z-index:2}' +
            '.tv-ep-card__progress{position:absolute;left:.7em;right:.7em;bottom:.48em;height:.22em;border-radius:.22em;background:rgba(255,255,255,.24);overflow:hidden;z-index:2}' +
            '.tv-ep-card__progress-fill{height:100%;background:#e2e2e2;border-radius:.22em}' +
            '.tv-ep-card__title{font-size:.84em;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
            '.tv-ep-card--upcoming .tv-ep-card__title{color:rgba(255,255,255,.5)}' +
            '.tv-ep-card.focus .tv-ep-card__thumb{box-shadow:0 0 0 .22em #fff}' +

            /* --- Description & Expanded Genres --- */
            '.full-descr.tv-descr{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;gap:2.4em}' +
            '.full-descr.tv-descr .full-descr__left{-webkit-box-flex:1;-webkit-flex:1 1 auto;flex:1 1 auto;min-width:0}' +
            '.full-descr.tv-descr .full-descr__text{width:100%;font-size:1.25em;line-height:1.42;font-weight:300;color:rgba(255,255,255,.86);max-height:none;-webkit-mask-image:none;mask-image:none;margin-bottom:1.1em}' +
            '.tv-descr__right{width:23em;-webkit-flex-shrink:0;flex-shrink:0}' +
            '.full-descr.tv-descr .full-descr__details{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;margin:-.75em -1.2em}' +
            '.full-descr.tv-descr .full-descr__details>.full-descr__info{margin:.75em 1.2em}' +
            '.full-descr.tv-descr .full-descr__info-name{font-size:1.05em;color:rgba(255,255,255,.55);margin-bottom:.3em}' +
            '.full-descr.tv-descr .full-descr__info-body{font-size:1.22em;font-weight:300;color:rgba(255,255,255,.95)}' +
            '.tv-descr__tags-area{margin-top:.6em}' +
            '.tv-descr__genres-label{font-size:1.05em;color:rgba(255,255,255,.55);margin-bottom:.6em}' +
            '.tv-descr__tags-row{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:stretch;-webkit-align-items:stretch;align-items:stretch;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;-webkit-flex-wrap:wrap;flex-wrap:wrap;gap:.65em}' +
            '.tv-descr__genres-list,.tv-descr__other-tags{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-align:stretch;-webkit-align-items:stretch;align-items:stretch;gap:.55em}' +
            '.tv-descr__tags-row .tag-count{margin:0;min-height:2.85em;display:-webkit-inline-box;display:-webkit-inline-flex;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}' +
            '.tv-genre-pill .tag-count__name{padding-left:.85em;padding-right:.85em}' +

            /* --- Filmix Profile Card & List Styles --- */
            '.tv-fx-profile{margin:1em 0;padding:1em;background:rgba(255,255,255,.08);border-radius:.6em;line-height:1.35}' +
            '.tv-fx-profile--empty{opacity:.75;padding:1.2em 1em}' +
            '.tv-fx-profile__wrap{display:-webkit-box;display:-webkit-flex;display:flex;gap:1em;-webkit-box-align:center;-webkit-align-items:center;align-items:center}' +
            '.tv-fx-profile__avatar{width:4.5em;height:4.5em;border-radius:50%;overflow:hidden;background:rgba(0,0,0,.35);-webkit-flex-shrink:0;flex-shrink:0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center}' +
            '.tv-fx-profile__avatar img{width:100%;height:100%;object-fit:cover}' +
            '.tv-fx-profile__placeholder{font-size:1.8em;font-weight:600;text-transform:uppercase}' +
            '.tv-fx-profile__title{font-size:1.25em;font-weight:600}' +
            '.tv-fx-profile__login{opacity:.75;font-size:.95em;margin-top:.15em}' +
            '.tv-fx-profile__meta{opacity:.85;font-size:.92em;margin-top:.45em}' +
            '.tv-fx-profile__badge{display:inline-block;margin-bottom:.35em;padding:.15em .55em;border-radius:.3em;background:rgba(255,255,255,.14);font-size:.88em;font-weight:600}' +
            '.online-prestige{position:relative;border-radius:.3em;background-color:rgba(0,0,0,.3);display:-webkit-box;display:-webkit-flex;display:flex}' +
            '.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;flex-grow:1;position:relative}' +
            '.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;flex-shrink:0;min-height:8.2em}' +
            '.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;transition:opacity .3s}' +
            '.online-prestige__img--loaded>img{opacity:1}' +
            '.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;flex-shrink:0}' +
            '.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}' +
            '.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,.45);border-radius:100%;padding:.25em;font-size:.76em}' +
            '.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}' +
            '.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center;font-size:2em}' +
            '.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;background-size:contain}' +
            '.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;align-items:center}' +
            '.online-prestige__timeline{margin:.8em 0}' +
            '.online-prestige__timeline>.time-line{display:block !important}' +
            '.online-prestige__title{font-size:1.7em;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}' +
            '.online-prestige__time{padding-left:2em}' +
            '.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}' +
            '.online-prestige__quality{padding-left:1em;white-space:nowrap}' +
            '.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;flex-shrink:0}' +
            '.online-prestige.focus::after{content:"";position:absolute;top:-.6em;left:-.6em;right:-.6em;bottom:-.6em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}' +
            '.online-prestige+.online-prestige{margin-top:1.5em}' +
            '.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}' +
            '.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}' +
            '.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}' +
            '.online-empty{line-height:1.4}.online-empty__title{font-size:2em;margin-bottom:.9em}' +
            '.online-empty-template{background-color:rgba(255,255,255,.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;border-radius:.3em}' +
            '.online-empty-template>*{background:rgba(0,0,0,.3);border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}' +

            /* --- Responsive fallback for small screens --- */
            '@media screen and (max-width:767px){' +
            '.full-start-new.tv-card .full-start-new__body{height:auto;min-height:0;padding-top:3em}' +
            '.full-start-new.tv-card .tv-hero__columns{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;gap:1.5em}' +
            '.tv-hero__left{padding-right:0;width:100%}' +
            '.tv-hero__right{-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;width:100%}' +
            '.full-descr.tv-descr{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column}' +
            '.tv-descr__right{width:100%}' +
            '}';

        $('#tv-plugin-styles').remove();
        $('body').append('<style id="tv-plugin-styles">' + css + '</style>');
    }

    /* ------------------------------------------------------------------ *
     * Инициализация плагина
     * ------------------------------------------------------------------ */

    function startPlugin() {
        if (window['__' + PLUGIN_ID + '_ready']) return;
        window['__' + PLUGIN_ID + '_ready'] = true;

        Lampa.Lang.add(TRANSLATIONS);

        Lampa.Manifest.plugins = {
            type: 'video',
            version: VERSION,
            name: 'TV',
            description: t('tv_manifest_descr'),
            component: FILMIX_COMPONENT,
            onContextMenu: function () {
                return {
                    name: t('tv_filmix_watch'),
                    description: ''
                };
            },
            onContextLauch: function (card) {
                Filmix.openFilmixPage(card);
            }
        };

        // Регистрация встроенного компонента Filmix и шаблонов
        Filmix.resetFilmixTemplates();
        Lampa.Component.add(FILMIX_COMPONENT, Filmix.FilmixComponent);

        if (Lampa.Manifest && Lampa.Manifest.app_digital >= 177 && Lampa.Storage.sync) {
            try { Lampa.Storage.sync('tv_filmix_choice', 'object_object'); } catch (e) {}
        }

        registerTemplatesAndStyles();
        HeadFilter.init();

        // Подписки на события карточки фильма/сериала
        Lampa.Listener.follow('full', function (e) {
            try {
                CardSections.onFullEvent(e);

                if (e.type === 'complite') {
                    setupFullCard(e);
                } else if (e.type === 'build' && e.name === 'description') {
                    var movie = e.data && e.data.movie ? e.data.movie : (e.props && e.props.get ? e.props.get('movie') : null);
                    var $body = e.item && e.item.render ? e.item.render() : e.body;
                    enhanceDescriptionBlock($body, movie, e.item);
                } else if (e.type === 'options') {
                    onFullOptions(e);
                }
            } catch (err) {
                if (window.console && console.error) console.error('[TV Plugin]', err);
            }
        });

        // Обновление профиля Filmix при старте (если токен задан)
        var initialToken = Filmix.getToken();
        if (initialToken) {
            Filmix.fetchUserProfile(initialToken, null, function () {});
        }

        // Регистрация настроек
        try {
            registerSettings();
        } catch (err) {
            if (window.console && console.error) console.error('[TV Plugin Settings]', err);
        }
    }

    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
