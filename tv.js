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
            ru: 'Штатный блок «Сезон N» и расписание выхода серий (для сериалов)',
            uk: 'Штатний блок «Сезон N» та розклад виходу серій (для серіалів)',
            en: 'Default "Season N" row and episode release schedule (for TV shows)',
            be: 'Штатны блок «Сезон N» і расклад выхаду серый (для серыялаў)'
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
        tv_loading_bwa: {
            ru: 'Поиск в BWA...',
            uk: 'Пошук у BWA...',
            en: 'Searching BWA...',
            be: 'Пошук у BWA...'
        },
        tv_not_found_filmix: {
            ru: 'Не найдено на Filmix',
            uk: 'Не знайдено на Filmix',
            en: 'Not found on Filmix',
            be: 'Не знойдзена на Filmix'
        },
        tv_not_found_sources: {
            ru: 'Не найдено в источниках',
            uk: 'Не знайдено у джерелах',
            en: 'Not found in sources',
            be: 'Не знойдзена ў крыніцах'
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
        },
        tv_home_title: {
            ru: 'Главный экран',
            uk: 'Головний екран',
            en: 'Home Screen',
            be: 'Галоўны экран'
        },
        tv_home_descr: {
            ru: 'Netflix-главная, порядок и скрытие блоков',
            uk: 'Netflix-головна, порядок та приховування блоків',
            en: 'Netflix home layout, block order and visibility',
            be: 'Netflix-галоўная, парадак і схаванне блокаў'
        },
        tv_home_enabled_title: {
            ru: 'Netflix-стиль главного экрана',
            uk: 'Netflix-стиль головного екрана',
            en: 'Netflix-style home screen',
            be: 'Netflix-стыль галоўнага экрана'
        },
        tv_home_enabled_descr: {
            ru: 'Hero-блок с логотипом, каруселью задников и карточками как в макете',
            uk: 'Hero-блок з логотипом, каруселлю фонів та картками як у макеті',
            en: 'Hero panel with logo, backdrop carousel and wide continue watching row',
            be: 'Hero-блок з лагатыпам, каруселлю фонаў і карткамі як у макеце'
        },
        tv_home_carousel_title: {
            ru: 'Карусель задников в Hero',
            uk: 'Карусель фонів у Hero',
            en: 'Hero backdrop carousel',
            be: 'Карусель фонаў у Hero'
        },
        tv_home_carousel_descr: {
            ru: 'Плавная смена фоновых кадров на главном экране каждые 5 секунд',
            uk: 'Плавна зміна фонових кадрів на головному екрані кожні 5 секунд',
            en: 'Smoothly rotate background stills on the home screen every 5 seconds',
            be: 'Плаўная змена фонавых кадраў на галоўным экране кожныя 5 секунд'
        },
        tv_home_continue_title: {
            ru: 'Продолжить просмотр',
            uk: 'Продовжити перегляд',
            en: 'Continue Watching',
            be: 'Працягнуць прагляд'
        },
        tv_home_new_episodes_title: {
            ru: 'Новые серии',
            uk: 'Нові серії',
            en: 'New Episodes',
            be: 'Новыя серыі'
        },
        tv_home_new_episodes_sub: {
            ru: 'Обновления подписок',
            uk: 'Оновлення підписок',
            en: 'Subscription updates',
            be: 'Абнаўленні падпісак'
        },
        tv_home_mark_watched: {
            ru: 'Просмотрено',
            uk: 'Переглянуто',
            en: 'Mark as watched',
            be: 'Прагледжана'
        },
        tv_home_mark_watched_sub: {
            ru: 'Скрыть из «Продолжить просмотр»',
            uk: 'Приховати з «Продовжити перегляд»',
            en: 'Hide from Continue Watching',
            be: 'Схаваць з «Працягнуць прагляд»'
        },
        tv_home_marked_watched_noty: {
            ru: 'Отмечено как просмотрено',
            uk: 'Позначено як переглянуто',
            en: 'Marked as watched',
            be: 'Пазначана як прагледжана'
        },
        tv_home_remaining: {
            ru: 'Осталось',
            uk: 'Залишилось',
            en: 'Left',
            be: 'Засталося'
        },
        tv_home_watched_pct: {
            ru: 'Просмотрено',
            uk: 'Переглянуто',
            en: 'Watched',
            be: 'Прагледжана'
        },
        tv_home_season_word: {
            ru: 'Сезон',
            uk: 'Сезон',
            en: 'Season',
            be: 'Сезон'
        },
        tv_home_episode_word: {
            ru: 'Серия',
            uk: 'Серія',
            en: 'Episode',
            be: 'Серыя'
        },
        tv_home_ep_short: {
            ru: 'эп.',
            uk: 'еп.',
            en: 'ep.',
            be: 'эп.'
        },
        tv_home_top10_badge: {
            ru: 'ТОП-10',
            uk: 'ТОП-10',
            en: 'TOP 10',
            be: 'ТОП-10'
        },
        tv_home_top_today: {
            ru: 'сегодня',
            uk: 'сьогодні',
            en: 'today',
            be: 'сёння'
        },
        tv_home_more_action: {
            ru: 'Еще',
            uk: 'Ще',
            en: 'More',
            be: 'Яшчэ'
        },
        tv_home_more_all: {
            ru: 'Открыть весь раздел',
            uk: 'Відкрити весь розділ',
            en: 'Open full section',
            be: 'Адкрыць увесь раздзел'
        },
        tv_home_order_btn: {
            ru: 'Порядок блоков',
            uk: 'Порядок блоків',
            en: 'Block order',
            be: 'Парадак блокаў'
        },
        tv_home_order_descr: {
            ru: 'Нажмите OK на блоке, переставьте стрелками и нажмите OK',
            uk: 'Натисніть OK на блоці, переставте стрілками та натисніть OK',
            en: 'Press OK on a block, move with arrows and press OK',
            be: 'Націсніце OK на блоку, перастаўце стрэлкамі і націсніце OK'
        },
        tv_home_order_pick_hint: {
            ru: 'Выберите блок и нажмите OK для перемещения',
            uk: 'Виберіть блок і натисніть OK для переміщення',
            en: 'Select a block and press OK to move it',
            be: 'Выберыце блок і націсніце OK для перамяшчэння'
        },
        tv_home_order_move_hint: {
            ru: 'Переместите ▲/▼ и нажмите OK для фиксации',
            uk: 'Перемістіть ▲/▼ та натисніть OK для фіксації',
            en: 'Move with ▲/▼ and press OK to place',
            be: 'Перамясціце ▲/▼ і націсніце OK для фіксацыі'
        },
        tv_home_blocks_title: {
            ru: 'Отображение блоков главного экрана',
            uk: 'Відображення блоків головного екрана',
            en: 'Home screen block visibility',
            be: 'Адлюстраванне блокаў галоўнага экрана'
        },
        tv_home_block_now_watch: {
            ru: 'Сейчас смотрят',
            uk: 'Зараз дивляться',
            en: 'Now Watching',
            be: 'Зараз глядзяць'
        },
        tv_home_block_latest: {
            ru: 'Новинки',
            uk: 'Новинки',
            en: 'Latest',
            be: 'Навінкі'
        },
        tv_home_block_fire: {
            ru: 'В огне',
            uk: 'У вогні',
            en: 'Trending Fire',
            be: 'У агні'
        },
        tv_home_block_high_quality: {
            ru: 'В высоком качестве',
            uk: 'У високій якості',
            en: 'In High Quality',
            be: 'У высокай якасці'
        },
        tv_home_block_top_movies: {
            ru: 'Топ 100 — Фильмы',
            uk: 'Топ 100 — Фільми',
            en: 'Top 100 — Movies',
            be: 'Топ 100 — Фільмы'
        },
        tv_home_block_top_tv: {
            ru: 'Топ 100 — Сериалы',
            uk: 'Топ 100 — Серіали',
            en: 'Top 100 — TV Shows',
            be: 'Топ 100 — Серыялы'
        },
        tv_home_block_trend_day: {
            ru: 'В тренде за день',
            uk: 'У тренді за день',
            en: 'Trending Today',
            be: 'У трэндзе за дзень'
        },
        tv_home_block_trend_week: {
            ru: 'В тренде за неделю',
            uk: 'У тренді за тиждень',
            en: 'Trending This Week',
            be: 'У трэндзе за тыдзень'
        },
        tv_home_block_upcoming: {
            ru: 'Скоро на экранах',
            uk: 'Скоро на екранах',
            en: 'Upcoming',
            be: 'Хутка на экранах'
        },
        tv_home_block_popular_movie: {
            ru: 'Популярные фильмы',
            uk: 'Популярні фільми',
            en: 'Popular Movies',
            be: 'Папулярныя фільмы'
        },
        tv_home_block_popular_tv: {
            ru: 'Популярные сериалы',
            uk: 'Популярні серіали',
            en: 'Popular TV Shows',
            be: 'Папулярныя серыялы'
        },
        tv_home_open_card: {
            ru: 'Открыть',
            uk: 'Відкрити',
            en: 'Open',
            be: 'Адкрыць'
        },
        tv_search_open_action: {
            ru: 'Поиск',
            uk: 'Пошук',
            en: 'Search',
            be: 'Пошук'
        },
        tv_search_open_sub: {
            ru: 'Открыть поиск',
            uk: 'Відкрити пошук',
            en: 'Open search',
            be: 'Адкрыць пошук'
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
        like: '<svg viewBox="0 0 30.9881 27.7732" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.75424 26.7634C3.90424 26.7634 3.47924 26.7634 3.11091 26.6643C2.62368 26.5371 2.17914 26.2823 1.82307 25.9263C1.467 25.5702 1.21226 25.1257 1.08508 24.6384C1.00008 24.2984 1.00008 23.8593 1.00008 23.0093V15.1468C1.00008 14.2968 1.00008 13.8576 1.08508 13.5034C1.21226 13.0162 1.467 12.5717 1.82307 12.2156C2.17914 11.8595 2.62368 11.6048 3.11091 11.4776C3.46508 11.3926 3.89008 11.3926 4.75424 11.3926L5.16508 11.4068C5.28535 11.4405 5.39457 11.5054 5.48165 11.595C5.56873 11.6846 5.63057 11.7956 5.66091 11.9168C5.6798 11.9923 5.68924 12.1293 5.68924 12.3276V25.8284C5.68924 26.0173 5.6798 26.1543 5.66091 26.2393C5.6284 26.3578 5.56559 26.4659 5.47865 26.5528C5.39172 26.6398 5.28365 26.7026 5.16508 26.7351C5.06591 26.7634 4.96674 26.7634 4.74008 26.7634M17.4901 26.7493H12.4892C11.1434 26.7493 10.4776 26.7493 10.0667 26.3526C9.64174 25.9276 9.64174 25.2618 9.64174 23.9301V12.3843C9.64174 11.6334 9.64174 11.2509 9.72674 10.9109C9.81174 10.5709 10.0101 10.2026 10.4067 9.45175C10.9026 8.50259 11.5117 7.24175 11.7951 6.20759C12.0217 5.45675 12.1209 4.63509 12.1634 3.87009C12.2342 2.42509 12.2767 1.70259 12.7442 1.32009C13.2117 0.909252 13.7501 0.980086 14.8267 1.10759C16.0734 1.24925 17.4192 1.68842 18.0851 2.80759C18.8359 4.08259 18.8642 5.92425 18.6517 7.58175C18.4109 9.53675 18.2976 10.5143 18.7226 10.9818C19.1476 11.4493 20.0117 11.4634 21.7684 11.4634H22.9017C26.8542 11.4634 28.8234 11.4634 29.6592 12.7526C30.4951 14.0559 29.6876 15.8551 28.0726 19.4534L27.8034 20.0484C26.3584 23.3068 25.6217 24.9218 24.2192 25.8284C22.8167 26.7351 21.0459 26.7493 17.4901 26.7493Z" fill="currentColor"/><path d="M12.4892 26.762L17.4901 26.7478C21.0317 26.7478 22.8167 26.7478 24.2192 25.827C25.6359 24.9203 26.3442 23.2912 27.8034 20.047L28.0867 19.452C29.6876 15.8537 30.4951 14.0545 29.6451 12.7512C28.8234 11.4762 26.8542 11.4762 22.9017 11.4762H21.7684C20.0117 11.4762 19.1476 11.4762 18.7226 10.9803C18.2976 10.5128 18.4109 9.53534 18.6659 7.58034C18.8642 5.92284 18.8359 4.08117 18.0851 2.80617C17.4192 1.687 16.0734 1.24784 14.8267 1.10617C13.7501 0.964504 13.2117 0.907838 12.7442 1.3045C12.2767 1.70117 12.2342 2.43784 12.1634 3.86867C12.1209 4.63367 12.0217 5.45534 11.7951 6.20617C11.5117 7.24034 10.9026 8.50117 10.4067 9.46451C10.1263 9.919 9.89821 10.4037 9.72674 10.9095C9.64174 11.2495 9.64174 11.6178 9.64174 12.3828V23.9287C9.64174 25.2603 9.64174 25.9262 10.0667 26.337C10.4776 26.762 11.1434 26.762 12.4751 26.762M5.68924 25.827V12.3262C5.68924 12.1278 5.6798 11.9862 5.66091 11.9012C5.6284 11.7826 5.56559 11.6745 5.47865 11.5876C5.39172 11.5007 5.28365 11.4378 5.16508 11.4053L4.74008 11.3912C3.89008 11.3912 3.46508 11.3912 3.11091 11.4762C2.62368 11.6034 2.17914 11.8581 1.82307 12.2142C1.467 12.5702 1.21226 13.0148 1.08508 13.502C1.00008 13.8562 1.00008 14.2812 1.00008 15.1453V23.0078C1.00008 23.8578 1.00008 24.2828 1.08508 24.637C1.21226 25.1242 1.467 25.5688 1.82307 25.9248C2.17914 26.2809 2.62368 26.5357 3.11091 26.6628C3.65297 26.7597 4.20447 26.7929 4.75424 26.762C4.96674 26.762 5.06591 26.762 5.16508 26.7337C5.28365 26.7012 5.39172 26.6384 5.47865 26.5514C5.56559 26.4645 5.6284 26.3564 5.66091 26.2378C5.68924 26.1387 5.68924 26.0395 5.68924 25.8128" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        dislike: '<svg viewBox="0 0 30.888 27.6771" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.1987 15.4784V1.93507L25.227 1.53841C25.2586 1.41551 25.3225 1.30335 25.4123 1.21363C25.502 1.12392 25.6141 1.05995 25.737 1.02841C25.8126 1.00952 25.9495 1.00007 26.1479 1.00007C26.9837 1.00007 27.4087 1.00007 27.7629 1.08507C28.2544 1.21124 28.7031 1.46713 29.062 1.82599C29.4208 2.18484 29.6767 2.6335 29.8029 3.12507C29.8879 3.46507 29.8879 3.89007 29.8879 4.74007V12.6734C29.8879 13.5092 29.8879 13.9342 29.8029 14.2884C29.6745 14.7774 29.4176 15.2231 29.0589 15.5793C28.7002 15.9355 28.2527 16.1893 27.7629 16.3142C27.4229 16.4134 26.9979 16.4134 26.1479 16.4134C25.9495 16.4134 25.8126 16.404 25.737 16.3851C25.6141 16.3535 25.502 16.2896 25.4123 16.1998C25.3225 16.1101 25.2586 15.998 25.227 15.8751C25.2081 15.7995 25.1987 15.6673 25.1987 15.4784Z" fill="currentColor"/><path d="M13.4687 1.01424L18.427 1.00007C19.7587 1.00007 20.4245 1.00007 20.8495 1.42507C21.2604 1.83591 21.2604 2.50174 21.2604 3.84757V15.3226C21.2604 16.0876 21.2604 16.4559 21.1895 16.7959C21.1045 17.1217 20.9062 17.5042 20.5095 18.2551C20.0137 19.2042 19.4045 20.4651 19.1212 21.4851C18.9229 22.2501 18.8048 23.0245 18.767 23.8084L18.7663 23.8206C18.6818 25.2434 18.6382 25.977 18.172 26.3726C17.7045 26.7692 17.1662 26.7126 16.1037 26.5709C14.8429 26.4151 13.5112 25.9901 12.8595 24.8851C12.1087 23.6101 12.0804 21.7826 12.2787 20.1251L12.2877 20.0524C12.5227 18.1598 12.6417 17.2007 12.222 16.7251C11.797 16.2434 10.9187 16.2434 9.1762 16.2434H8.08537C4.13287 16.2434 2.17787 16.2434 1.32787 14.9542C0.506205 13.6509 1.29954 11.8659 2.91454 8.26757L3.15537 7.71507L3.19965 7.61663C4.6293 4.43786 5.3513 2.83252 6.73954 1.93507C8.14204 1.01424 9.92704 1.01424 13.4687 1.01424Z" fill="currentColor"/><path d="M25.1987 1.93507V15.4784C25.1987 15.6673 25.2081 15.7995 25.227 15.8751C25.2586 15.998 25.3225 16.1101 25.4123 16.1998C25.502 16.2896 25.6141 16.3535 25.737 16.3851C25.8126 16.404 25.9495 16.4134 26.1479 16.4134C26.9979 16.4134 27.4229 16.4134 27.7629 16.3142C28.2527 16.1893 28.7002 15.9355 29.0589 15.5793C29.4176 15.2231 29.6745 14.7774 29.8029 14.2884C29.8879 13.9342 29.8879 13.5092 29.8879 12.6734V4.74007C29.8879 3.89007 29.8879 3.46507 29.8029 3.12507C29.6767 2.6335 29.4208 2.18484 29.062 1.82599C28.7031 1.46713 28.2544 1.21124 27.7629 1.08507C27.4087 1.00007 26.9837 1.00007 26.1479 1.00007C25.9495 1.00007 25.8126 1.00952 25.737 1.02841C25.6141 1.05995 25.502 1.12392 25.4123 1.21363C25.3225 1.30335 25.2586 1.41551 25.227 1.53841L25.1987 1.93507ZM18.427 1.00007L13.4687 1.01424C9.92704 1.01424 8.14204 1.01424 6.73954 1.93507C5.3513 2.83252 4.6293 4.43786 3.19965 7.61663L3.15537 7.71507L2.91454 8.26757C1.29954 11.8659 0.506205 13.6509 1.32787 14.9542C2.17787 16.2434 4.13287 16.2434 8.08537 16.2434H9.1762C10.9187 16.2434 11.797 16.2434 12.222 16.7251C12.6417 17.2007 12.5227 18.1598 12.2877 20.0524L12.2787 20.1251C12.0804 21.7826 12.1087 23.6101 12.8595 24.8851C13.5112 25.9901 14.8429 26.4151 16.1037 26.5709C17.1662 26.7126 17.7045 26.7692 18.172 26.3726C18.6382 25.977 18.6818 25.2434 18.7663 23.8206L18.767 23.8084C18.8048 23.0245 18.9229 22.2501 19.1212 21.4851C19.4045 20.4651 20.0137 19.2042 20.5095 18.2551C20.9062 17.5042 21.1045 17.1217 21.1895 16.7959C21.2604 16.4559 21.2604 16.0876 21.2604 15.3226V3.84757C21.2604 2.50174 21.2604 1.83591 20.8495 1.42507C20.4245 1.00007 19.7587 1.00007 18.427 1.00007Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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

    function clonePlayItem(item) {
        var copy = {};
        if (!item) return copy;
        for (var k in item) {
            if (Object.prototype.hasOwnProperty.call(item, k) && k !== 'playlist') {
                copy[k] = item[k];
            }
        }
        return copy;
    }

    function formatDaysLeft(airDateStr) {
        if (!airDateStr) return null;
        var m = String(airDateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
        var parsed;
        if (m) {
            parsed = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
        } else {
            parsed = new Date(String(airDateStr).replace(/-/g, '/'));
        }
        if (isNaN(parsed.getTime())) return null;
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((parsed.getTime() - today.getTime()) / 86400000);
    }

    function findNextUpcomingAirDate(movie, fullData, extraEpisodes) {
        var bestDate = '';
        var bestDays = null;

        function consider(airDate) {
            if (!airDate) return;
            var d = formatDaysLeft(airDate);
            if (d === null || d < 0) return;
            if (bestDays === null || d < bestDays) {
                bestDays = d;
                bestDate = String(airDate);
            }
        }

        if (movie && movie.next_episode_to_air && movie.next_episode_to_air.air_date) {
            consider(movie.next_episode_to_air.air_date);
        }

        var epSources = [];
        if (fullData && fullData.episodes && Array.isArray(fullData.episodes.episodes)) {
            epSources.push(fullData.episodes.episodes);
        }
        if (Array.isArray(extraEpisodes)) {
            epSources.push(extraEpisodes);
        }
        for (var s = 0; s < epSources.length; s++) {
            var arr = epSources[s];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] && arr[i].air_date) consider(arr[i].air_date);
            }
        }

        if (bestDays === null || !bestDate) return null;
        return { air_date: bestDate, days: bestDays };
    }

    function formatNextEpisodeLine(airDateStr, days) {
        var nextLabel = Lampa.Lang.translate('full_next_episode') || 'Следующая';
        var leftLabel = Lampa.Lang.translate('full_episode_days_left') || 'Осталось дней';
        var shortDate = '';
        try {
            shortDate = Lampa.Utils.parseTime(airDateStr)['short'] || '';
        } catch (e) {}
        if (!shortDate) shortDate = airDateStr;
        return nextLabel + ': ' + shortDate + ' / ' + leftLabel + ': ' + days;
    }

    function fetchTmdbSeasonEpisodes(movie, seasonNum, preferEpisodeGroups, net, cacheObj, cb) {
        var tmdbId = parseInt(movie && movie.id, 10);
        if (!tmdbId || !isSerialMovie(movie) || !Lampa.TMDB || !Lampa.TMDB.api) {
            cb([]);
            return;
        }
        if (!cacheObj.seasons) cacheObj.seasons = {};
        if (cacheObj.seasons[seasonNum]) {
            cb(cacheObj.seasons[seasonNum]);
            return;
        }

        var lang = Lampa.Storage.get('language', 'ru');

        function loadEpisodeGroups(done) {
            if (cacheObj.groupsLoaded) {
                done(cacheObj.groupsMap);
                return;
            }
            var listUrl = Lampa.TMDB.api('tv/' + tmdbId + '/episode_groups?api_key=' + Lampa.TMDB.key());
            net.timeout(10000);
            net['native'](listUrl, function (egJson) {
                var results = (egJson && Array.isArray(egJson.results)) ? egJson.results : [];
                var picked = null;
                for (var i = 0; i < results.length; i++) {
                    if (results[i] && results[i].type === 6) {
                        picked = results[i];
                        break;
                    }
                }
                if (!picked) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j] && /season/i.test(String(results[j].name || ''))) {
                            picked = results[j];
                            break;
                        }
                    }
                }
                if (!picked || !picked.id) {
                    cacheObj.groupsLoaded = true;
                    cacheObj.groupsMap = null;
                    done(null);
                    return;
                }
                var detailUrl = Lampa.TMDB.api('tv/episode_group/' + picked.id + '?api_key=' + Lampa.TMDB.key() + '&language=' + encodeURIComponent(lang));
                net.timeout(10000);
                net['native'](detailUrl, function (detailJson) {
                    var map = {};
                    var groups = (detailJson && Array.isArray(detailJson.groups)) ? detailJson.groups : [];
                    for (var g = 0; g < groups.length; g++) {
                        var grp = groups[g];
                        if (!grp || !grp.order || grp.order <= 0 || !Array.isArray(grp.episodes)) continue;
                        var sorted = grp.episodes.slice().sort(function (a, b) {
                            return (a.order || 0) - (b.order || 0);
                        });
                        var mapped = [];
                        for (var e = 0; e < sorted.length; e++) {
                            var src = sorted[e];
                            if (!src) continue;
                            mapped.push({
                                id: src.id,
                                episode_number: e + 1,
                                season_number: grp.order,
                                name: src.name || '',
                                overview: src.overview || '',
                                still_path: src.still_path || null,
                                air_date: src.air_date || '',
                                runtime: src.runtime || null
                            });
                        }
                        map[grp.order] = mapped;
                    }
                    cacheObj.groupsLoaded = true;
                    cacheObj.groupsMap = map;
                    done(map);
                }, function () {
                    cacheObj.groupsLoaded = true;
                    cacheObj.groupsMap = null;
                    done(null);
                });
            }, function () {
                cacheObj.groupsLoaded = true;
                cacheObj.groupsMap = null;
                done(null);
            });
        }

        function fetchStandardSeason(onDone) {
            var url = Lampa.TMDB.api('tv/' + tmdbId + '/season/' + seasonNum + '?api_key=' + Lampa.TMDB.key() + '&language=' + encodeURIComponent(lang));
            net.timeout(10000);
            net['native'](url, function (data) {
                var eps = (data && Array.isArray(data.episodes)) ? data.episodes : [];
                onDone(eps);
            }, function () {
                onDone([]);
            });
        }

        if (preferEpisodeGroups) {
            loadEpisodeGroups(function (map) {
                if (map && map[seasonNum] && map[seasonNum].length) {
                    cacheObj.seasons[seasonNum] = map[seasonNum];
                    cb(map[seasonNum]);
                    return;
                }
                fetchStandardSeason(function (eps) {
                    cacheObj.seasons[seasonNum] = eps;
                    cb(eps);
                });
            });
            return;
        }

        fetchStandardSeason(function (eps) {
            if (eps.length) {
                cacheObj.seasons[seasonNum] = eps;
                cb(eps);
                return;
            }
            loadEpisodeGroups(function (map) {
                var grpEps = (map && map[seasonNum]) ? map[seasonNum] : [];
                cacheObj.seasons[seasonNum] = grpEps;
                cb(grpEps);
            });
        });
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

            var firstItem = playlist[epIndex];
            if (!firstItem || !firstItem.url) {
                Lampa.Noty.show(t('tv_filmix_nolink'));
                return;
            }

            if (movie && movie.id) Lampa.Favorite.add('history', movie, 100);
            markEpisodeWatched(movie, voiceObj.episodes[epIndex].season, voiceObj.episodes[epIndex].episode, voiceObj.name);
            if (onAfterMark) onAfterMark(voiceObj.episodes[epIndex]);

            var first = clonePlayItem(firstItem);
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

            var fxTmdbCache = {};

            function fetchTmdbSeason(seasonNum, cb) {
                var preferGroups = !!(parsedPost && parsedPost.seasons && parsedPost.seasons.length > 1 && (object.movie.number_of_seasons || 0) <= 1);
                fetchTmdbSeasonEpisodes(object.movie, seasonNum, preferGroups, network, fxTmdbCache, cb);
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
     * Резервный провайдер BWA (bwa_online): перебор всех включённых источников
     * ------------------------------------------------------------------ */

    var BwaFallback = (function () {
        var BWA_COMPONENT = 'bwa_online';
        var DEFAULT_SERVER = 'https://api.bwa.ad';
        var ANIME_BALANSERS = ['animevost', 'anilibria', 'animedia', 'animego', 'animelib', 'kodik', 'animebesst', 'moonanime'];
        var epStreamCache = {};

        function isInstalled() {
            try {
                if (window.bwa_plugin) return true;
                if (Lampa.Component && typeof Lampa.Component.get === 'function' && Lampa.Component.get(BWA_COMPONENT)) return true;
            } catch (e) {}
            return false;
        }

        function getServerBase() {
            var srv = Lampa.Storage.value('bwa_server', '');
            if (srv && /^https?:\/\//i.test(srv)) {
                return srv.replace(/\/+$/, '');
            }
            var cached = Lampa.Storage.get('bwa_node_cache', null);
            if (cached) {
                var cUrl = typeof cached === 'string' ? cached : (cached.url || cached.host || cached.server || '');
                if (cUrl && /^https?:\/\//i.test(cUrl)) return cUrl.replace(/\/+$/, '');
            }
            return DEFAULT_SERVER;
        }

        function getUid() {
            var uid = Lampa.Storage.value('bwa_uid', '');
            if (!uid) uid = Lampa.Utils.uid(16);
            return uid;
        }

        function getHiddenMap() {
            var raw = Lampa.Storage.get('bwa_sources_hidden', []);
            var map = {};
            if (Array.isArray(raw)) {
                for (var i = 0; i < raw.length; i++) {
                    if (raw[i]) map[String(raw[i]).toLowerCase()] = true;
                }
            } else if (raw && typeof raw === 'object') {
                for (var k in raw) {
                    if (raw[k]) map[String(k).toLowerCase()] = true;
                }
            }
            return map;
        }

        function parseQualityNum(q) {
            var str = String(q || '');
            if (/4k|2160|uhd/i.test(str)) return 2160;
            var num = parseInt(str.replace(/[^\d]/g, ''), 10);
            return num > 0 ? num : 720;
        }

        function buildQuery(movie, extra) {
            var serial = isSerialMovie(movie);
            var clarifyMap = Lampa.Storage.get('bwa_clarify', {}) || {};
            var clarify = clarifyMap[(serial ? 's:' : 'm:') + movie.id] || '';
            var title = clarify || movie.title || movie.name || '';
            var orig = movie.original_title || movie.original_name || title;
            var year = String(movie.release_date || movie.first_air_date || '0000').slice(0, 4);

            var q = [
                'id=' + encodeURIComponent(movie.id || ''),
                'tmdb_id=' + encodeURIComponent(movie.id || ''),
                'title=' + encodeURIComponent(title),
                'original_title=' + encodeURIComponent(orig),
                'serial=' + (serial ? 1 : 0),
                'year=' + encodeURIComponent(year),
                'uid=' + encodeURIComponent(getUid()),
                'rchtype=cors',
                'dalt=2'
            ];

            if (movie.imdb_id) q.push('imdb_id=' + encodeURIComponent(movie.imdb_id));
            if (movie.kinopoisk_id) q.push('kinopoisk_id=' + encodeURIComponent(movie.kinopoisk_id));
            if (movie.original_language) q.push('original_language=' + encodeURIComponent(movie.original_language));
            if (clarify) q.push('clarification=1');

            var kitKey = Lampa.Storage.value('bwa_kitkey', '');
            if (kitKey) q.push('kit=' + encodeURIComponent(kitKey));

            var email = Lampa.Storage.value('account_email', '');
            if (email) q.push('cub_id=' + encodeURIComponent(Lampa.Utils.hash(email)));

            if (extra) {
                for (var ek in extra) {
                    if (extra[ek] !== undefined && extra[ek] !== null && extra[ek] !== '') {
                        q.push(encodeURIComponent(ek) + '=' + encodeURIComponent(extra[ek]));
                    }
                }
            }

            return q.join('&');
        }

        function resolveUrl(base, path, query) {
            var full = /^https?:\/\//i.test(path) ? path : (base + (path.charAt(0) === '/' ? path : '/' + path));
            if (!query) return full;
            return full + (full.indexOf('?') >= 0 ? '&' : '?') + query;
        }

        function requestJson(net, url, timeoutMs, onOk, onErr) {
            net.timeout(timeoutMs || 7000);
            var method = (Lampa.Platform && Lampa.Platform.is && Lampa.Platform.is('android')) ? 'native' : 'silent';
            net[method](url, function (res) {
                var json = res;
                if (typeof res === 'string') {
                    try { json = JSON.parse(res); } catch (e) { json = null; }
                }
                if (json && typeof json === 'object') onOk(json);
                else onErr();
            }, function () {
                onErr();
            });
        }

        function groupStreamsByVoice(streams) {
            if (!Array.isArray(streams) || !streams.length) return [];
            var map = {};
            var order = [];

            for (var i = 0; i < streams.length; i++) {
                var st = streams[i];
                if (!st || !st.url) continue;
                var vName = String(st.voice || st.translate || st.translation || 'По умолчанию').trim() || 'По умолчанию';
                if (!map[vName]) {
                    map[vName] = {
                        name: vName,
                        maxQuality: 0,
                        qualitiesMap: {},
                        bestUrl: '',
                        subtitles: null
                    };
                    order.push(vName);
                }
                var entry = map[vName];
                var qNum = parseQualityNum(st.quality);
                var qLabel = qNum >= 2160 ? '2160p' : (qNum + 'p');
                if (!entry.qualitiesMap[qLabel]) entry.qualitiesMap[qLabel] = st.url;
                if (qNum > entry.maxQuality) {
                    entry.maxQuality = qNum;
                    entry.bestUrl = st.url;
                }
                if (!entry.bestUrl) entry.bestUrl = st.url;
                if (st.subtitles && Array.isArray(st.subtitles) && st.subtitles.length && !entry.subtitles) {
                    entry.subtitles = st.subtitles;
                }
            }

            var preferred = Lampa.Storage.get('video_quality_default', '1080') + 'p';
            var result = [];
            for (var j = 0; j < order.length; j++) {
                var item = map[order[j]];
                if (item.qualitiesMap[preferred]) item.bestUrl = item.qualitiesMap[preferred];
                result.push(item);
            }
            return result;
        }

        function extractSeasonNumbers(movie, srcSeasons) {
            var nums = [];
            var seen = {};
            var i, n;

            if (Array.isArray(srcSeasons) && srcSeasons.length) {
                for (i = 0; i < srcSeasons.length; i++) {
                    var s = srcSeasons[i];
                    n = parseInt(typeof s === 'object' && s ? (s.season || s.season_number || s.number || s.id) : s, 10);
                    if (n > 0 && !seen[n]) { seen[n] = true; nums.push(n); }
                }
            }
            if (!nums.length && movie && Array.isArray(movie.seasons) && movie.seasons.length) {
                for (i = 0; i < movie.seasons.length; i++) {
                    n = parseInt(movie.seasons[i] && movie.seasons[i].season_number, 10);
                    if (n > 0 && !seen[n]) { seen[n] = true; nums.push(n); }
                }
            }
            if (!nums.length && movie && movie.number_of_seasons > 0) {
                for (i = 1; i <= movie.number_of_seasons; i++) nums.push(i);
            }
            if (!nums.length) nums.push(1);

            nums.sort(function (a, b) { return a - b; });
            return nums;
        }

        function extractEpisodeNumbers(movie, seasonNum, jsonEpisodes) {
            var nums = [];
            var seen = {};
            var i, n;

            if (Array.isArray(jsonEpisodes) && jsonEpisodes.length) {
                for (i = 0; i < jsonEpisodes.length; i++) {
                    var ep = jsonEpisodes[i];
                    n = parseInt(typeof ep === 'object' && ep ? (ep.episode || ep.episode_number || ep.number || ep.id) : ep, 10);
                    if (n > 0 && !seen[n]) { seen[n] = true; nums.push(n); }
                }
            }
            if (!nums.length && movie && Array.isArray(movie.seasons)) {
                for (i = 0; i < movie.seasons.length; i++) {
                    var ms = movie.seasons[i];
                    if (ms && parseInt(ms.season_number, 10) === seasonNum && ms.episode_count > 0) {
                        for (var e = 1; e <= ms.episode_count; e++) nums.push(e);
                        break;
                    }
                }
            }
            if (!nums.length) nums.push(1);

            nums.sort(function (a, b) { return a - b; });
            return nums;
        }

        function orderSources(movie, list) {
            if (!Array.isArray(list) || !list.length) return [];
            var hidden = getHiddenMap();
            var titleSrcMap = Lampa.Storage.get('bwa_title_src', {}) || {};
            var savedForMovie = String(titleSrcMap[movie.id] || '').toLowerCase();
            var globalBalanser = String(Lampa.Storage.value('bwa_balanser', '') || '').toLowerCase();
            var anime = isAnimeMovie(movie);

            var enabled = [];
            for (var i = 0; i < list.length; i++) {
                var s = list[i];
                if (!s || !s.balanser || !s.url) continue;
                if (s.show === false) continue;
                if (s.account_only && !s.bound) continue;
                if (hidden[String(s.balanser).toLowerCase()]) continue;
                enabled.push(s);
            }

            function priority(src, idx) {
                var key = String(src.balanser).toLowerCase();
                if (savedForMovie && key === savedForMovie) return 0;
                if (globalBalanser && key === globalBalanser) return 10;
                if (anime && ANIME_BALANSERS.indexOf(key) !== -1) return 20 + ANIME_BALANSERS.indexOf(key);
                if (src.avoid) return 500 + idx;
                return 100 + idx;
            }

            return enabled.map(function (s, idx) {
                return { src: s, p: priority(s, idx) };
            }).sort(function (a, b) {
                return a.p - b.p;
            }).map(function (x) {
                return x.src;
            });
        }

        function buildSeasonVoices(src, seasonNum, epNums, groupedVoices, probedEpNum) {
            var voices = [];
            for (var v = 0; v < groupedVoices.length; v++) {
                var gv = groupedVoices[v];
                var eps = [];
                for (var e = 0; e < epNums.length; e++) {
                    var eNum = epNums[e];
                    eps.push({
                        id: seasonNum + '_' + eNum,
                        season: seasonNum,
                        episode: eNum,
                        quality: gv.maxQuality,
                        qualities: [gv.maxQuality],
                        voice_name: gv.name,
                        provider: 'bwa',
                        bwaSource: src,
                        file: eNum === probedEpNum ? gv.bestUrl : '',
                        bwaQualitiesMap: eNum === probedEpNum ? gv.qualitiesMap : null,
                        bwaSubtitles: eNum === probedEpNum ? gv.subtitles : null
                    });
                }
                voices.push({
                    name: gv.name,
                    maxQuality: gv.maxQuality,
                    episodes: eps,
                    provider: 'bwa'
                });
            }
            return voices;
        }

        function cacheGroupedVoices(balanser, movieId, seasonNum, epNum, groupedVoices) {
            var key = balanser + ':' + movieId + ':' + seasonNum + ':' + epNum;
            epStreamCache[key] = groupedVoices;
        }

        function getCachedVoiceStream(balanser, movieId, seasonNum, epNum, voiceName) {
            var key = balanser + ':' + movieId + ':' + seasonNum + ':' + epNum;
            var list = epStreamCache[key];
            if (!list || !list.length) return null;
            if (voiceName) {
                var low = voiceName.toLowerCase();
                for (var i = 0; i < list.length; i++) {
                    if (list[i].name.toLowerCase() === low) return list[i];
                }
            }
            return list[0];
        }

        function saveTitleSource(movieId, balanser) {
            if (!movieId || !balanser) return;
            var map = Lampa.Storage.get('bwa_title_src', {}) || {};
            map[movieId] = balanser;
            Lampa.Storage.set('bwa_title_src', map);
        }

        function resolveForMovie(movie, net, onProgress, onDone) {
            if (!isInstalled() || !movie) {
                onDone(null);
                return;
            }

            var base = getServerBase();
            var serial = isSerialMovie(movie);
            var eventsUrl = resolveUrl(base, '/lite/events', buildQuery(movie));

            requestJson(net, eventsUrl, 8000, function (eventsList) {
                var sources = orderSources(movie, eventsList);
                if (!sources.length) {
                    onDone(null);
                    return;
                }

                var savedChoice = Filmix.getChoice(movie.id);
                var probeSeason = serial ? (savedChoice.last_season || 1) : 0;
                var probeEpisode = serial ? (savedChoice.last_episode || 1) : 0;

                var idx = 0;

                function tryNext() {
                    if (idx >= sources.length) {
                        onDone(null);
                        return;
                    }

                    var src = sources[idx++];
                    if (onProgress) onProgress(src.name || src.balanser);

                    function probeSource(sNum, eNum, canFallbackToS1E1) {
                        var extra = serial ? { season: sNum, episode: eNum } : null;
                        var url = resolveUrl(base, src.url, buildQuery(movie, extra));

                        requestJson(net, url, 6500, function (json) {
                            var grouped = json && Array.isArray(json.streams) ? groupStreamsByVoice(json.streams) : [];
                            if (!grouped.length) {
                                if (serial && canFallbackToS1E1 && (sNum !== 1 || eNum !== 1)) {
                                    probeSource(1, 1, false);
                                } else {
                                    tryNext();
                                }
                                return;
                            }

                            saveTitleSource(movie.id, src.balanser);

                            if (serial) {
                                cacheGroupedVoices(src.balanser, movie.id, sNum, eNum, grouped);
                                var seasonNums = extractSeasonNumbers(movie, json.src_seasons);
                                if (seasonNums.indexOf(sNum) === -1) {
                                    seasonNums.push(sNum);
                                    seasonNums.sort(function (a, b) { return a - b; });
                                }
                                var epNums = extractEpisodeNumbers(movie, sNum, json.episodes);
                                if (epNums.indexOf(eNum) === -1) {
                                    epNums.push(eNum);
                                    epNums.sort(function (a, b) { return a - b; });
                                }

                                var seasons = [];
                                for (var si = 0; si < seasonNums.length; si++) {
                                    var curS = seasonNums[si];
                                    var isProbed = (curS === sNum);
                                    var curEps = isProbed ? epNums : extractEpisodeNumbers(movie, curS, null);
                                    seasons.push({
                                        key: String(curS),
                                        num: curS,
                                        label: t('tv_season_short') + ' ' + curS,
                                        voices: buildSeasonVoices(src, curS, curEps, grouped, isProbed ? eNum : -1),
                                        bwaLoaded: isProbed
                                    });
                                }

                                onDone({
                                    id: 'bwa_' + src.balanser,
                                    provider: 'bwa',
                                    bwaSource: src,
                                    sourceName: src.name || src.balanser,
                                    title: movie.name || movie.title || '',
                                    isSerial: true,
                                    seasons: seasons,
                                    movies: []
                                });
                            } else {
                                var moviesList = [];
                                for (var mi = 0; mi < grouped.length; mi++) {
                                    moviesList.push({
                                        translation: grouped[mi].name,
                                        file: grouped[mi].bestUrl,
                                        quality: grouped[mi].maxQuality,
                                        qualities: [grouped[mi].maxQuality],
                                        qualitiesMap: grouped[mi].qualitiesMap,
                                        subtitles: grouped[mi].subtitles
                                    });
                                }
                                onDone({
                                    id: 'bwa_' + src.balanser,
                                    provider: 'bwa',
                                    bwaSource: src,
                                    sourceName: src.name || src.balanser,
                                    title: movie.title || movie.name || '',
                                    isSerial: false,
                                    seasons: [],
                                    movies: moviesList
                                });
                            }
                        }, function () {
                            tryNext();
                        });
                    }

                    probeSource(probeSeason, probeEpisode, true);
                }

                tryNext();
            }, function () {
                onDone(null);
            });
        }

        function loadSeason(movie, parsedPost, seasonIndex, net, onDone) {
            if (!parsedPost || !parsedPost.bwaSource || !parsedPost.seasons[seasonIndex]) {
                onDone(false);
                return;
            }
            var seasonObj = parsedPost.seasons[seasonIndex];
            if (seasonObj.bwaLoaded) {
                onDone(true);
                return;
            }

            var src = parsedPost.bwaSource;
            var base = getServerBase();
            var url = resolveUrl(base, src.url, buildQuery(movie, { season: seasonObj.num, episode: 1 }));

            requestJson(net, url, 8000, function (json) {
                var grouped = json && Array.isArray(json.streams) ? groupStreamsByVoice(json.streams) : [];
                if (grouped.length) {
                    cacheGroupedVoices(src.balanser, movie.id, seasonObj.num, 1, grouped);
                    var epNums = extractEpisodeNumbers(movie, seasonObj.num, json.episodes);
                    seasonObj.voices = buildSeasonVoices(src, seasonObj.num, epNums, grouped, 1);
                    seasonObj.bwaLoaded = true;
                    onDone(true);
                } else {
                    onDone(false);
                }
            }, function () {
                onDone(false);
            });
        }

        function fetchEpisodeStream(movie, bwaSource, seasonNum, epNum, voiceName, net, cb) {
            var cached = getCachedVoiceStream(bwaSource.balanser, movie.id, seasonNum, epNum, voiceName);
            if (cached && cached.bestUrl) {
                cb({ file: cached.bestUrl, quality: cached.qualitiesMap, subtitles: cached.subtitles });
                return;
            }

            var base = getServerBase();
            var url = resolveUrl(base, bwaSource.url, buildQuery(movie, { season: seasonNum, episode: epNum }));

            requestJson(net, url, 10000, function (json) {
                var grouped = json && Array.isArray(json.streams) ? groupStreamsByVoice(json.streams) : [];
                if (!grouped.length) {
                    cb(null);
                    return;
                }
                cacheGroupedVoices(bwaSource.balanser, movie.id, seasonNum, epNum, grouped);
                var picked = getCachedVoiceStream(bwaSource.balanser, movie.id, seasonNum, epNum, voiceName);
                if (picked && picked.bestUrl) {
                    cb({ file: picked.bestUrl, quality: picked.qualitiesMap, subtitles: picked.subtitles });
                } else {
                    cb(null);
                }
            }, function () {
                cb(null);
            });
        }

        function playEpisode(movie, parsedPost, voiceObj, epIndex, tmdbMap, onAfterMark) {
            if (!parsedPost || !parsedPost.bwaSource || !voiceObj || !voiceObj.episodes || !voiceObj.episodes[epIndex]) {
                Lampa.Noty.show(t('tv_filmix_nolink'));
                return;
            }

            var src = parsedPost.bwaSource;
            var targetEp = voiceObj.episodes[epIndex];
            var loadNet = new Lampa.Reguest();
            var cancelled = false;

            function makeEpTitle(ep) {
                var tmdbEp = tmdbMap && tmdbMap[ep.episode];
                return tmdbEp && tmdbEp.name
                    ? (t('tv_season_short') + ' ' + ep.season + ', ' + t('tv_episode_short') + ' ' + ep.episode + ' — ' + tmdbEp.name)
                    : (t('tv_season_short') + ' ' + ep.season + ', ' + t('tv_episode_short') + ' ' + ep.episode);
            }

            function launchWithStream(streamData) {
                if (cancelled) return;
                if (!streamData || !streamData.file) {
                    Lampa.Noty.show(t('tv_filmix_nolink'));
                    return;
                }

                var playlist = [];
                for (var i = 0; i < voiceObj.episodes.length; i++) {
                    (function (ep, idx) {
                        var timeline = getEpisodeTimeline(movie, ep.season, ep.episode);
                        var item = {
                            title: makeEpTitle(ep),
                            timeline: timeline,
                            card: movie,
                            season: ep.season,
                            episode: ep.episode,
                            callback: function () {
                                Filmix.markEpisodeWatched(movie, ep.season, ep.episode, voiceObj.name);
                                if (onAfterMark) onAfterMark(ep);
                            }
                        };

                        if (idx === epIndex) {
                            item.url = streamData.file;
                            if (streamData.quality) item.quality = streamData.quality;
                            if (streamData.subtitles) item.subtitles = streamData.subtitles;
                        } else {
                            var cached = getCachedVoiceStream(src.balanser, movie.id, ep.season, ep.episode, voiceObj.name);
                            if (cached && cached.bestUrl) {
                                item.url = cached.bestUrl;
                                if (cached.qualitiesMap) item.quality = cached.qualitiesMap;
                                if (cached.subtitles) item.subtitles = cached.subtitles;
                            } else {
                                item.url = function (done) {
                                    var nextNet = new Lampa.Reguest();
                                    fetchEpisodeStream(movie, src, ep.season, ep.episode, voiceObj.name, nextNet, function (res) {
                                        if (res && res.file) {
                                            item.url = res.file;
                                            if (res.quality) item.quality = res.quality;
                                            if (res.subtitles) item.subtitles = res.subtitles;
                                        }
                                        done();
                                    });
                                };
                            }
                        }

                        playlist.push(item);
                    })(voiceObj.episodes[i], i);
                }

                var first = clonePlayItem(playlist[epIndex]);
                if (movie && movie.id) Lampa.Favorite.add('history', movie, 100);
                Filmix.markEpisodeWatched(movie, targetEp.season, targetEp.episode, voiceObj.name);
                if (onAfterMark) onAfterMark(targetEp);

                if (playlist.length > 1) first.playlist = playlist;
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);
            }

            // Если поток уже в кэше — запускаем мгновенно без экрана загрузки
            var immediate = getCachedVoiceStream(src.balanser, movie.id, targetEp.season, targetEp.episode, voiceObj.name);
            if (immediate && immediate.bestUrl) {
                launchWithStream({ file: immediate.bestUrl, quality: immediate.qualitiesMap, subtitles: immediate.subtitles });
                return;
            }

            Lampa.Loading.start(function () {
                cancelled = true;
                loadNet.clear();
                Lampa.Loading.stop();
            });

            fetchEpisodeStream(movie, src, targetEp.season, targetEp.episode, voiceObj.name, loadNet, function (res) {
                if (cancelled) return;
                Lampa.Loading.stop();
                launchWithStream(res);
            });
        }

        function openBwaPage(movie) {
            if (!isInstalled() || !movie) return;
            var serial = isSerialMovie(movie);
            var clarifyMap = Lampa.Storage.get('bwa_clarify', {}) || {};
            var clarify = clarifyMap[(serial ? 's:' : 'm:') + movie.id] || '';

            Lampa.Activity.push({
                url: '',
                title: 'BWA',
                component: BWA_COMPONENT,
                search: clarify || movie.title || movie.name || '',
                search_one: movie.title || movie.name || '',
                search_two: movie.original_title || movie.original_name || '',
                movie: movie,
                page: 1,
                clarification: !!clarify
            });
        }

        return {
            isInstalled: isInstalled,
            resolveForMovie: resolveForMovie,
            loadSeason: loadSeason,
            playEpisode: playEpisode,
            openBwaPage: openBwaPage
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
            var formatted = sc >= 10 ? '10' : sc.toFixed(1);
            if (typeof ImdbCardRatings !== 'undefined' && ImdbCardRatings && ImdbCardRatings.remember) {
                ImdbCardRatings.remember(movie, formatted);
            }
            return formatted;
        }
        if ($root && $root.length) {
            var domScore = $root.find('.full-start-new__rate-line .rate--imdb > div').eq(0).text().trim();
            if (domScore && parseFloat(domScore) > 0) {
                var dsc = parseFloat(domScore);
                var dFormatted = dsc >= 10 ? '10' : dsc.toFixed(1);
                if (typeof ImdbCardRatings !== 'undefined' && ImdbCardRatings && ImdbCardRatings.remember) {
                    ImdbCardRatings.remember(movie, dFormatted);
                }
                return dFormatted;
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
                var posLead = calc.hasData && calc.posPercent >= calc.negPercent;
                var negLead = calc.hasData && calc.negPercent >= calc.posPercent;
                $newRating.removeClass('hide').toggleClass('tv-new-rating--empty', !calc.hasData);
                $newRating.find('.tv-new-rating__side--pos').toggleClass('tv-new-rating__side--lead', posLead);
                $newRating.find('.tv-new-rating__side--neg').toggleClass('tv-new-rating__side--lead', negLead);
                $newRating.find('.tv-new-rating__pct--pos').text(calc.posPercent + '%');
                $newRating.find('.tv-new-rating__pct--neg').text(calc.negPercent + '%');
                $newRating.find('.tv-new-rating__bar-pos').css('width', calc.hasData ? (calc.posPercent + '%') : '0%');
                $newRating.find('.tv-new-rating__total').text(Lampa.Utils.numberWithSpaces(calc.totalVotes));
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * Фоновый тихий трейлер (через официальный YouTube-мост Lampa)
     * ------------------------------------------------------------------ */

    var ytBridgeSeq = 0;

    function getYouTubeBridgeUrl(bridgeId, videoId, startSec) {
        var base = (Lampa.Manifest && Lampa.Manifest.github_lampa) ? String(Lampa.Manifest.github_lampa) : 'https://yumata.github.io/lampa/';
        if (base.charAt(base.length - 1) !== '/') base += '/';
        if (window.location && window.location.protocol === 'https:' && base.indexOf('http://') === 0) {
            base = 'https://yumata.github.io/lampa/';
        }
        return base + 'youtube.html' +
            '?bridgeId=' + encodeURIComponent(bridgeId) +
            '&videoId=' + encodeURIComponent(videoId) +
            '&autoplay=1&controls=0&mute=1&start=' + (startSec || 0);
    }

    /* ------------------------------------------------------------------ *
     * TMDB медиа: случайный задник, логотип вместо названия и трейлеры
     * ------------------------------------------------------------------ */

    var TMDB_IMAGES_CACHE_KEY = 'tv_tmdb_img_cache';
    var TMDB_IMAGES_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 день
    var TMDB_IMAGES_CACHE_MAX = 60;
    var TMDB_BACKDROP_ROTATE_MS = 5000;
    var tmdbImagesMemCache = null;

    function loadTmdbImagesStore() {
        if (tmdbImagesMemCache) return tmdbImagesMemCache;
        var stored = null;
        try {
            stored = Lampa.Storage.get(TMDB_IMAGES_CACHE_KEY, null);
        } catch (e) {}
        tmdbImagesMemCache = (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
        return tmdbImagesMemCache;
    }

    function saveTmdbImagesStore(store) {
        var now = Date.now();
        var keys = Object.keys(store);
        var validKeys = [];
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var entry = store[k];
            if (!entry || !entry.ts || (now - entry.ts) > TMDB_IMAGES_CACHE_TTL) {
                delete store[k];
            } else {
                validKeys.push(k);
            }
        }
        if (validKeys.length > TMDB_IMAGES_CACHE_MAX) {
            validKeys.sort(function (a, b) {
                return (store[a].ts || 0) - (store[b].ts || 0);
            });
            var toRemove = validKeys.length - TMDB_IMAGES_CACHE_MAX;
            for (var r = 0; r < toRemove; r++) {
                delete store[validKeys[r]];
            }
        }
        tmdbImagesMemCache = store;
        try {
            Lampa.Storage.set(TMDB_IMAGES_CACHE_KEY, store);
        } catch (e) {}
    }

    function getCachedTmdbImages(movie) {
        if (!movie || !movie.id) return null;
        var store = loadTmdbImagesStore();
        var key = (isSerialMovie(movie) ? 'tv' : 'movie') + '_' + movie.id;
        var entry = store[key];
        if (!entry || !entry.ts) return null;
        if ((Date.now() - entry.ts) > TMDB_IMAGES_CACHE_TTL) {
            delete store[key];
            return null;
        }
        if (entry.lang && entry.lang !== getTmdbLang()) return null;
        return entry;
    }

    function packBackdropsForCache(backdrops) {
        if (!Array.isArray(backdrops) || !backdrops.length) return [];
        var seen = {};
        var valid = [];
        for (var i = 0; i < backdrops.length; i++) {
            var b = backdrops[i];
            if (!b || !b.file_path || seen[b.file_path]) continue;
            seen[b.file_path] = true;
            valid.push(b);
        }
        // Сначала чистые широкоформатные без текста, затем по убыванию разрешения
        valid.sort(function (a, b) {
            var ca = (!a.iso_639_1 && (!a.aspect_ratio || a.aspect_ratio >= 1.5)) ? 1 : 0;
            var cb = (!b.iso_639_1 && (!b.aspect_ratio || b.aspect_ratio >= 1.5)) ? 1 : 0;
            if (cb !== ca) return cb - ca;
            return ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0));
        });
        var out = [];
        var limit = Math.min(valid.length, 40);
        for (var j = 0; j < limit; j++) {
            var item = valid[j];
            out.push([
                item.file_path,
                item.width || 0,
                item.height || 0,
                item.aspect_ratio ? Math.round(item.aspect_ratio * 100) / 100 : 0,
                item.iso_639_1 || ''
            ]);
        }
        return out;
    }

    function setCachedTmdbImages(movie, backdrops, logoPath) {
        if (!movie || !movie.id) return;
        var store = loadTmdbImagesStore();
        var key = (isSerialMovie(movie) ? 'tv' : 'movie') + '_' + movie.id;
        store[key] = {
            ts: Date.now(),
            lang: getTmdbLang(),
            logo: logoPath || '',
            backdrops: packBackdropsForCache(backdrops)
        };
        saveTmdbImagesStore(store);
    }

    function shuffleArray(list) {
        var arr = list.slice();
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function getTmdbLang() {
        return (Lampa.Storage.field('tmdb_lang') || Lampa.Storage.get('language', 'ru') || 'ru').split('-')[0].toLowerCase();
    }

    function sortTrailerCandidates(results) {
        if (!Array.isArray(results) || !results.length) return [];
        var seen = {};
        var items = [];
        for (var i = 0; i < results.length; i++) {
            var el = results[i];
            if (!el || !el.key || seen[el.key]) continue;
            if (el.site && String(el.site).toLowerCase() !== 'youtube') continue;
            seen[el.key] = true;
            items.push({
                id: el.key,
                lang: String(el.iso_639_1 || '').toLowerCase(),
                type: String(el.type || '').toLowerCase(),
                official: !!el.official,
                time: el.published_at ? (new Date(el.published_at).getTime() || 0) : 0
            });
        }
        if (!items.length) return [];

        var tmdbLang = getTmdbLang();

        function scoreItem(x) {
            var s = 0;
            if (x.type === 'trailer') s += 100;
            else if (x.type === 'teaser') s += 50;
            if (x.lang === tmdbLang) s += 30;
            else if (x.lang === 'en') s += 20;
            if (x.official) s += 5;
            return s;
        }

        items.sort(function (a, b) {
            var sa = scoreItem(a);
            var sb = scoreItem(b);
            if (sb !== sa) return sb - sa;
            return b.time - a.time;
        });

        return items;
    }

    function fetchTmdbTrailers(movie, fallbackVideos, net, cb) {
        var fallbackList = (fallbackVideos && Array.isArray(fallbackVideos.results)) ? fallbackVideos.results : [];
        if (!movie || !movie.id || !Lampa.TMDB || !Lampa.TMDB.api) {
            cb(sortTrailerCandidates(fallbackList));
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
            if (userLang !== 'en') {
                requestLang('en', function (enList) {
                    cb(sortTrailerCandidates(primaryList.concat(enList).concat(fallbackList)));
                });
            } else {
                cb(sortTrailerCandidates(primaryList.concat(fallbackList)));
            }
        });
    }

    function getRequiredBackdropSize() {
        var dpr = window.devicePixelRatio || 1;
        return {
            w: Math.round((window.innerWidth || 1280) * dpr),
            h: Math.round((window.innerHeight || 720) * dpr)
        };
    }

    function normalizeBackdropItem(item) {
        if (!item) return null;
        if (Array.isArray(item)) {
            if (!item[0]) return null;
            return {
                file_path: item[0],
                width: item[1] || 0,
                height: item[2] || 0,
                aspect_ratio: item[3] || 0,
                iso_639_1: item[4] || ''
            };
        }
        if (!item.file_path) return null;
        return item;
    }

    function filterBackdropsForScreen(backdrops) {
        if (!Array.isArray(backdrops) || !backdrops.length) return [];

        var seen = {};
        var valid = [];
        for (var i = 0; i < backdrops.length; i++) {
            var item = normalizeBackdropItem(backdrops[i]);
            if (!item || !item.file_path || seen[item.file_path]) continue;
            seen[item.file_path] = true;
            valid.push(item);
        }
        if (!valid.length) return [];

        // Предпочитаем чистые широкоформатные задники без текста
        var cleanWide = valid.filter(function (b) {
            return (!b.iso_639_1) && (!b.aspect_ratio || b.aspect_ratio >= 1.5);
        });
        var pool = cleanWide.length ? cleanWide : valid.filter(function (b) {
            return !b.aspect_ratio || b.aspect_ratio >= 1.5;
        });
        if (!pool.length) pool = valid;

        // Отбираем фото не меньше разрешения экрана; если таких нет — берём самые большие
        var req = getRequiredBackdropSize();
        var fitPool = pool.filter(function (b) {
            return (b.width || 0) >= req.w && (b.height || 0) >= req.h;
        });
        if (fitPool.length) {
            return fitPool;
        }
        var allFit = valid.filter(function (b) {
            return (b.width || 0) >= req.w && (b.height || 0) >= req.h;
        });
        if (allFit.length) {
            return allFit;
        }
        var maxArea = 0;
        for (var mi = 0; mi < pool.length; mi++) {
            var area = (pool[mi].width || 0) * (pool[mi].height || 0);
            if (area > maxArea) maxArea = area;
        }
        if (maxArea > 0) {
            var largestPool = pool.filter(function (b) {
                return ((b.width || 0) * (b.height || 0)) >= maxArea * 0.95;
            });
            if (largestPool.length) return largestPool;
        }
        return pool;
    }

    function buildBackdropSlides(movie, rawBackdrops, $activityRoot) {
        var reqSize = getRequiredBackdropSize();
        var sizeSeg = reqSize.w > 1280 ? 'original' : 'w1280';
        var primaryPath = (movie && movie.backdrop_path) ? movie.backdrop_path : '';
        var primaryUrl = primaryPath ? Lampa.TMDB.image('t/p/' + sizeSeg + primaryPath) : '';

        if (!primaryUrl) {
            var $curBg = $activityRoot.find('.full-start__background').first();
            var curSrc = $curBg.length ? ($curBg.attr('src') || '') : '';
            if (curSrc) primaryUrl = curSrc;
        }

        var eligible = filterBackdropsForScreen(rawBackdrops);
        var others = [];
        var seenUrl = {};
        if (primaryUrl) seenUrl[primaryUrl] = true;

        for (var i = 0; i < eligible.length; i++) {
            var fp = eligible[i].file_path;
            if (!fp || fp === primaryPath) continue;
            var url = Lampa.TMDB.image('t/p/' + sizeSeg + fp);
            if (seenUrl[url]) continue;
            seenUrl[url] = true;
            others.push(url);
        }

        var shuffledOthers = shuffleArray(others);
        if (primaryUrl) {
            return [primaryUrl].concat(shuffledOthers);
        }
        return shuffledOthers;
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

    function applyTitleLogo(movie, logoPath, $start, isDestroyedFn) {
        if (!logoPath || !getBoolSetting('tv_show_logo', true)) return;
        var logoUrl = Lampa.TMDB.image('t/p/w500' + logoPath);
        var preloadLogo = new Image();
        preloadLogo.onload = function () {
            if (isDestroyedFn()) return;
            if (!preloadLogo.naturalWidth) return;
            var $title = $start.find('.full-start-new__title');
            if (!$title.length || $title.hasClass('tv-title--logo') || $title.hasClass('tv-title--exiting')) return;
            var titleText = movie.title || movie.name || $title.text() || '';
            var $img = $('<img class="tv-title-logo" alt="">').attr('src', logoUrl).attr('alt', titleText);

            if ($('body').hasClass('no--animation')) {
                $title.addClass('tv-title--logo').empty().append($img);
                $img.addClass('tv-title-logo--loaded');
                return;
            }

            var titleEl = $title[0];
            var oldH = titleEl.offsetHeight;
            var oldMb = 0;
            if (window.getComputedStyle) {
                oldMb = parseFloat(window.getComputedStyle(titleEl).marginBottom) || 0;
            }

            $title.addClass('tv-title--exiting');

            setTimeout(function () {
                if (isDestroyedFn()) return;
                if (!titleEl || !document.body || !document.body.contains(titleEl)) return;

                $title.addClass('tv-title--measure').removeClass('tv-title--exiting').addClass('tv-title--logo').empty().append($img);

                var targetH = titleEl.offsetHeight;
                var targetMb = 0;
                if (window.getComputedStyle) {
                    targetMb = parseFloat(window.getComputedStyle(titleEl).marginBottom) || 0;
                }

                var animateHeight = oldH > 0 && targetH > 0 && (Math.abs(targetH - oldH) > 1 || Math.abs(targetMb - oldMb) > 1);
                if (animateHeight) {
                    titleEl.style.height = oldH + 'px';
                    titleEl.style.marginBottom = oldMb + 'px';
                    $title.addClass('tv-title--animating');
                    void titleEl.offsetHeight;
                }

                $title.removeClass('tv-title--measure');

                if (animateHeight) {
                    titleEl.style.height = targetH + 'px';
                    titleEl.style.marginBottom = targetMb + 'px';
                }
                $img.addClass('tv-title-logo--loaded');

                if (animateHeight) {
                    setTimeout(function () {
                        if (isDestroyedFn()) return;
                        $title.removeClass('tv-title--animating');
                        titleEl.style.height = '';
                        titleEl.style.marginBottom = '';
                    }, 460);
                }
            }, 220);
        };
        preloadLogo.src = logoUrl;
    }

    function loadTmdbImagesForCard(movie, activityObj, $activityRoot, $start, net, isDestroyedFn) {
        var stopped = false;
        var rotateTimer = null;
        var decodeTimer = null;
        var fadeTimer = null;
        var activePreload = null;
        var activeDecodedImg = null;
        var warmPreloadImg = null;
        var openedAt = Date.now();

        function cleanupSlideshow() {
            stopped = true;
            clearTimeout(rotateTimer);
            clearTimeout(decodeTimer);
            clearTimeout(fadeTimer);
            if (activePreload) {
                activePreload.onload = null;
                activePreload.onerror = null;
                activePreload = null;
            }
            activeDecodedImg = null;
            warmPreloadImg = null;
            var $bg = $activityRoot.find('.full-start__background');
            if ($bg.length && $bg[0]) {
                $bg[0].onload = null;
                $bg[0].onerror = null;
            }
            $bg.removeClass('tv-bg--fading');
        }

        function getMainBg() {
            return $activityRoot.find('.full-start__background').first();
        }

        function isCardVisibleForBg() {
            if (stopped || isDestroyedFn()) return false;
            var active = Lampa.Activity && Lampa.Activity.active ? Lampa.Activity.active() : null;
            if (activityObj && active && active.activity !== activityObj.activity) return false;
            if (Lampa.Player && Lampa.Player.opened && Lampa.Player.opened()) return false;
            var $bg = getMainBg();
            if ($bg.length && $bg.hasClass('tv-bg--hidden')) return false;
            return true;
        }

        function preloadAndDecodeImage(url, onReady, onError) {
            // Если уже заранее скачана и декодирована в warmPreloadImg — используем сразу
            if (warmPreloadImg && warmPreloadImg._tvSrc === url && warmPreloadImg.complete && warmPreloadImg.naturalWidth > 0) {
                var readyImg = warmPreloadImg;
                if (typeof readyImg.decode === 'function') {
                    try {
                        var wp = readyImg.decode();
                        if (wp && typeof wp.then === 'function') {
                            wp.then(function () { onReady(readyImg); }, function () { onReady(readyImg); });
                            return;
                        }
                    } catch (e) {}
                }
                onReady(readyImg);
                return;
            }

            if (activePreload) {
                activePreload.onload = null;
                activePreload.onerror = null;
            }
            var img = new Image();
            img._tvSrc = url;
            activePreload = img;

            img.onload = function () {
                if (activePreload === img) activePreload = null;
                if (stopped || isDestroyedFn()) return;
                if (!img.naturalWidth) {
                    onError();
                    return;
                }
                if (typeof img.decode === 'function') {
                    try {
                        var p = img.decode();
                        if (p && typeof p.then === 'function') {
                            p.then(function () { onReady(img); }, function () { onReady(img); });
                            return;
                        }
                    } catch (e2) {}
                }
                onReady(img);
            };

            img.onerror = function () {
                if (activePreload === img) activePreload = null;
                if (stopped || isDestroyedFn()) return;
                onError();
            };

            img.src = url;
        }

        function fadeToBg(nextUrl, decodedImg, onRevealed) {
            if (stopped || isDestroyedFn()) return;
            var $bg = getMainBg();
            if (!$bg.length) {
                $bg = $('<img class="full-start__background tv-card__background">');
                $activityRoot.prepend($bg);
            }

            var currentSrc = $bg.attr('src') || '';
            if (currentSrc === nextUrl) {
                if (onRevealed) onRevealed();
                return;
            }

            // Держим ссылку на декодированный Image до следующей смены, чтобы браузер не выгрузил битмап
            if (decodedImg) activeDecodedImg = decodedImg;

            if ($('body').hasClass('no--animation') || !currentSrc || !$bg.hasClass('loaded')) {
                $bg.removeClass('tv-bg--fading').attr('src', nextUrl).addClass('loaded tv-card__background');
                if (onRevealed) onRevealed();
                return;
            }

            clearTimeout(fadeTimer);
            clearTimeout(decodeTimer);

            // 1. Плавно гасим текущий фон до opacity: 0
            $bg.addClass('tv-bg--fading');

            // 2. В темноте подменяем src, дожидаемся полной готовности/декодирования на самом <img> и плавно проявляем
            fadeTimer = setTimeout(function () {
                if (stopped || isDestroyedFn()) {
                    $bg.removeClass('tv-bg--fading');
                    return;
                }

                var bgEl = $bg[0];
                var revealed = false;

                function revealNow() {
                    if (revealed) return;
                    revealed = true;
                    clearTimeout(decodeTimer);
                    bgEl.onload = null;
                    bgEl.onerror = null;
                    if (stopped || isDestroyedFn()) {
                        $bg.removeClass('tv-bg--fading');
                        return;
                    }
                    var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
                    raf(function () {
                        if (stopped || isDestroyedFn()) {
                            $bg.removeClass('tv-bg--fading');
                            return;
                        }
                        raf(function () {
                            $bg.removeClass('tv-bg--fading');
                            if (onRevealed) onRevealed();
                        });
                    });
                }

                function waitDecodeAndReveal() {
                    if (typeof bgEl.decode === 'function') {
                        try {
                            var dp = bgEl.decode();
                            if (dp && typeof dp.then === 'function') {
                                dp.then(revealNow, revealNow);
                                return;
                            }
                        } catch (e) {}
                    }
                    revealNow();
                }

                decodeTimer = setTimeout(revealNow, 1500);

                bgEl.onload = function () {
                    waitDecodeAndReveal();
                };
                bgEl.onerror = function () {
                    revealNow();
                };

                bgEl.src = nextUrl;
                $bg.addClass('loaded tv-card__background');

                if (bgEl.complete && bgEl.naturalWidth > 0) {
                    waitDecodeAndReveal();
                }
            }, 680);
        }

        function startBackdropSlideshow(rawBackdrops) {
            if (stopped || isDestroyedFn()) return;
            if (window.innerWidth <= 790 || Lampa.Storage.field('light_version')) return;

            var slides = buildBackdropSlides(movie, rawBackdrops, $activityRoot);
            if (!slides.length) return;

            var currentIdx = 0;
            var consecutiveErrors = 0;

            // Если у карточки вообще нет стандартного фона — скачиваем и показываем первый сразу
            var $initialBg = getMainBg();
            if (!$initialBg.length || !$initialBg.attr('src')) {
                preloadAndDecodeImage(slides[0], function (img) {
                    if (stopped || isDestroyedFn()) return;
                    fadeToBg(slides[0], img);
                }, function () {});
            }

            if (slides.length <= 1) return;

            function warmNext(idx) {
                var nextUrl = slides[(idx + 1) % slides.length];
                if (!nextUrl) return;
                var wImg = new Image();
                wImg._tvSrc = nextUrl;
                wImg.onload = function () {
                    if (typeof wImg.decode === 'function') {
                        try {
                            var p = wImg.decode();
                            if (p && typeof p.then === 'function') p.then(function () {}, function () {});
                        } catch (e) {}
                    }
                };
                wImg.src = nextUrl;
                warmPreloadImg = wImg;
            }

            function scheduleNext(delayMs) {
                clearTimeout(rotateTimer);
                if (stopped || isDestroyedFn()) return;
                rotateTimer = setTimeout(runStep, delayMs);
            }

            function runStep() {
                if (stopped || isDestroyedFn()) return;
                if (!isCardVisibleForBg()) {
                    scheduleNext(TMDB_BACKDROP_ROTATE_MS);
                    return;
                }

                var nextIdx = (currentIdx + 1) % slides.length;
                var nextUrl = slides[nextIdx];

                // Сначала полностью скачиваем и декодируем картинку, и только потом запускаем fade-смену
                preloadAndDecodeImage(nextUrl, function (decodedImg) {
                    if (stopped || isDestroyedFn()) return;
                    if (!isCardVisibleForBg()) {
                        scheduleNext(TMDB_BACKDROP_ROTATE_MS);
                        return;
                    }
                    consecutiveErrors = 0;
                    currentIdx = nextIdx;
                    fadeToBg(nextUrl, decodedImg, function () {
                        if (stopped || isDestroyedFn()) return;
                        warmNext(currentIdx);
                        scheduleNext(TMDB_BACKDROP_ROTATE_MS + 680);
                    });
                }, function () {
                    if (stopped || isDestroyedFn()) return;
                    consecutiveErrors++;
                    currentIdx = nextIdx;
                    if (consecutiveErrors < slides.length) {
                        scheduleNext(1500);
                    }
                });
            }

            // Стандартный фон остаётся первым; заранее скачиваем и декодируем второй слайд и меняем через 5 сек
            warmNext(0);
            var elapsed = Date.now() - openedAt;
            var firstDelay = Math.max(1500, TMDB_BACKDROP_ROTATE_MS - elapsed);
            scheduleNext(firstDelay);
        }

        if (!movie || !movie.id || !Lampa.TMDB || !Lampa.TMDB.api) {
            return { destroy: cleanupSlideshow };
        }

        // 1. Проверяем суточный кеш ссылок на фоны и логотип
        var cached = getCachedTmdbImages(movie);
        if (cached) {
            if (cached.backdrops && cached.backdrops.length) {
                startBackdropSlideshow(cached.backdrops);
            }
            if (cached.logo) {
                applyTitleLogo(movie, cached.logo, $start, isDestroyedFn);
            }
            return { destroy: cleanupSlideshow };
        }

        // 2. Запрашиваем TMDB /images, кешируем на 24 часа и запускаем ротацию + логотип
        var media = isSerialMovie(movie) ? 'tv' : 'movie';
        var path = media + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key();
        net.timeout(10000);
        net['native'](Lampa.TMDB.api(path), function (json) {
            if (stopped || isDestroyedFn() || !json) return;

            var rawBackdrops = Array.isArray(json.backdrops) ? json.backdrops : [];
            var logoPath = (json.logos && json.logos.length) ? pickBestLogo(movie, json.logos) : '';

            setCachedTmdbImages(movie, rawBackdrops, logoPath);

            if (rawBackdrops.length) {
                startBackdropSlideshow(rawBackdrops);
            }
            if (logoPath) {
                applyTitleLogo(movie, logoPath, $start, isDestroyedFn);
            }
        }, function () {});

        return { destroy: cleanupSlideshow };
    }

    function BackgroundTrailer(activityObj, fullLink, $activityRoot, fullData) {
        var self = this;
        var destroyed = false;
        var finished = false;
        var scrolledDown = false;
        var isPlaying = false;
        var isPausedByScroll = false;
        var seekAdjusted = false;
        var frameReady = false;
        var startTimer = null;
        var showTimer = null;
        var watchdogTimer = null;
        var bridgeId = '';
        var frameEl = null;
        var $layer = null;
        var candidates = [];
        var candidateIdx = 0;
        var netVideos = new Lampa.Reguest();

        var START_OFFSET = 7;
        var END_CUTOFF = 7;
        var MAX_TRIES = 6;

        function getBgEl() {
            return $activityRoot.find('.full-start__background');
        }

        function isAtTopOfCard() {
            if (scrolledDown) return false;
            if (fullLink && typeof fullLink.active === 'number' && fullLink.active > 0) return false;
            if (getBgEl().hasClass('dim')) return false;
            return true;
        }

        function isStillActiveAndTop() {
            if (destroyed || finished) return false;
            var active = Lampa.Activity.active();
            if (!active || active.activity !== activityObj.activity) return false;
            if (Lampa.Player && Lampa.Player.opened && Lampa.Player.opened()) return false;
            if ($('body').hasClass('settings--open') || $('body').hasClass('search--open') || $('body').hasClass('player--viewing')) return false;
            if (!isAtTopOfCard()) return false;
            return true;
        }

        function postToBridge(type, data) {
            if (!frameEl || !frameEl.contentWindow || !bridgeId) return;
            try {
                frameEl.contentWindow.postMessage({
                    bridgeId: bridgeId,
                    type: type,
                    data: data || {}
                }, '*');
            } catch (e) {}
        }

        function cleanupCurrentPlayer() {
            clearTimeout(showTimer);
            clearTimeout(watchdogTimer);
            isPlaying = false;
            isPausedByScroll = false;
            seekAdjusted = false;
            frameReady = false;

            var oldBridgeId = bridgeId;
            var oldFrame = frameEl;
            var layerRef = $layer;
            bridgeId = '';
            frameEl = null;
            $layer = null;

            if (layerRef) {
                layerRef.removeClass('tv-bg-trailer--visible');
            }

            setTimeout(function () {
                if (oldFrame && oldFrame.contentWindow && oldBridgeId) {
                    try {
                        oldFrame.contentWindow.postMessage({
                            bridgeId: oldBridgeId,
                            type: 'destroy',
                            data: {}
                        }, '*');
                    } catch (e) {}
                }
                if (layerRef) layerRef.remove();
            }, 450);
        }

        function stopAndRestorePoster(markFinished) {
            clearTimeout(startTimer);
            if (markFinished) finished = true;
            getBgEl().removeClass('tv-bg--hidden');
            cleanupCurrentPlayer();
        }

        function pauseForScroll() {
            clearTimeout(startTimer);
            clearTimeout(showTimer);
            getBgEl().removeClass('tv-bg--hidden');
            if ($layer) {
                $layer.removeClass('tv-bg-trailer--visible').addClass('tv-bg-trailer--paused');
            }
            if (frameEl) {
                isPausedByScroll = true;
                postToBridge('pause');
            }
        }

        function resumeFromScroll() {
            if (destroyed || finished || !isStillActiveAndTop()) return;
            if (frameEl && isPausedByScroll) {
                isPausedByScroll = false;
                if ($layer) $layer.removeClass('tv-bg-trailer--paused');
                postToBridge('setVolume', { volume: 0 });
                postToBridge('play');
            } else if (!frameEl && candidates.length && candidateIdx < Math.min(candidates.length, MAX_TRIES)) {
                clearTimeout(startTimer);
                startTimer = setTimeout(tryNextCandidate, 800);
            }
        }

        function handlePlayingState() {
            isPlaying = true;
            clearTimeout(watchdogTimer);
            postToBridge('setVolume', { volume: 0 });

            if (!isStillActiveAndTop()) {
                pauseForScroll();
                return;
            }

            clearTimeout(showTimer);
            showTimer = setTimeout(function () {
                if (!isStillActiveAndTop()) {
                    pauseForScroll();
                    return;
                }
                if ($layer) $layer.removeClass('tv-bg-trailer--paused').addClass('tv-bg-trailer--visible');
                getBgEl().addClass('tv-bg--hidden');
            }, 450);
        }

        function onBridgeMessage(ev) {
            if (destroyed || finished || !bridgeId) return;
            if (!ev || !ev.data || ev.data.bridgeId !== bridgeId) return;

            var type = ev.data.type;
            var data = ev.data.data || {};

            if (type === 'ready') {
                frameReady = true;
                if (destroyed || finished) {
                    stopAndRestorePoster(true);
                    return;
                }
                postToBridge('setVolume', { volume: 0 });
                applyFrameSize(true);
                if (isStillActiveAndTop()) {
                    postToBridge('play');
                } else {
                    pauseForScroll();
                }
                return;
            }

            if (type === 'stateChange') {
                var state = typeof data.state === 'number' ? data.state : -1;
                if (state === 1) {
                    handlePlayingState();
                } else if (state === 0) {
                    stopAndRestorePoster(true);
                }
                return;
            }

            if (type === 'time') {
                if (!frameReady) return;
                var duration = data.duration || 0;
                var current = data.currentTime || 0;
                var pState = data.playerState;

                if (pState === 1) {
                    if (!isPlaying) handlePlayingState();
                    if (!isStillActiveAndTop()) {
                        pauseForScroll();
                        return;
                    }
                    if (!seekAdjusted && duration > START_OFFSET + END_CUTOFF + 6 && current < 2) {
                        seekAdjusted = true;
                        postToBridge('seekTo', { time: START_OFFSET });
                    }
                    if (duration > END_CUTOFF + 8 && (duration - current) <= END_CUTOFF) {
                        stopAndRestorePoster(true);
                    }
                }
                return;
            }

            if (type === 'error') {
                clearTimeout(watchdogTimer);
                if (!destroyed && !finished && isStillActiveAndTop()) {
                    tryNextCandidate();
                } else {
                    stopAndRestorePoster(true);
                }
            }
        }

        function getBridgeMetrics() {
            var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
            var winW = window.innerWidth || 1920;
            var winH = window.innerHeight || 1080;
            // youtube.html умножает innerWidth на 2 (screen_size = 2): ограничиваем физический viewport до 1920x1080 (Full HD),
            // чтобы YouTube ABR не выбирал 4K (2160p) и не тормозил на ТВ
            var maxPhysW = Math.min(1920, Math.round(winW * dpr));
            var bridgeW = Math.max(320, Math.floor(maxPhysW / (2 * dpr)));
            var bridgeH = Math.round(bridgeW * 9 / 16);
            var cw = ($layer && $layer[0] && $layer[0].offsetWidth) ? $layer[0].offsetWidth : winW;
            var ch = ($layer && $layer[0] && $layer[0].offsetHeight) ? $layer[0].offsetHeight : Math.round(winH * 1.05);
            var scale = Math.max(cw / bridgeW, ch / bridgeH);
            return {
                bridgeW: bridgeW,
                bridgeH: bridgeH,
                innerW: bridgeW * 2,
                innerH: (bridgeH + 600) * 2,
                scale: scale
            };
        }

        function applyFrameSize(notifyBridge) {
            if (!frameEl || !$layer) return;
            var m = getBridgeMetrics();
            frameEl.style.width = m.bridgeW + 'px';
            frameEl.style.height = m.bridgeH + 'px';
            var tf = 'translate(-50%,-50%) scale(' + m.scale.toFixed(4) + ')';
            frameEl.style.webkitTransform = tf;
            frameEl.style.transform = tf;
            if (notifyBridge && frameReady) {
                postToBridge('resize', { width: m.innerW, height: m.innerH });
            }
        }

        function onWindowResize() {
            applyFrameSize(true);
        }

        function tryNextCandidate() {
            if (destroyed || finished || !isStillActiveAndTop()) return;
            if (candidateIdx >= candidates.length || candidateIdx >= MAX_TRIES) {
                stopAndRestorePoster(true);
                return;
            }

            var currentVideo = candidates[candidateIdx++];
            cleanupCurrentPlayer();

            bridgeId = 'tv_yt_' + (++ytBridgeSeq) + '_' + Date.now();

            var $bg = getBgEl().first();
            $layer = $('<div class="tv-bg-trailer"><div class="tv-bg-trailer__wrap"></div></div>');
            if ($bg.length) $bg.before($layer);
            else $activityRoot.prepend($layer);

            var iframe = document.createElement('iframe');
            iframe.className = 'tv-bg-trailer__frame';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            frameEl = iframe;

            $layer.find('.tv-bg-trailer__wrap')[0].appendChild(iframe);
            applyFrameSize(false);
            iframe.src = getYouTubeBridgeUrl(bridgeId, currentVideo.id, START_OFFSET);

            // Если видео не начало играть за 8 сек (напр. заблокировано/не грузится) — пробуем следующий трейлер
            clearTimeout(watchdogTimer);
            watchdogTimer = setTimeout(function () {
                if (!isPlaying && !destroyed && !finished && isStillActiveAndTop()) {
                    tryNextCandidate();
                }
            }, 8000);
        }

        function onActivityEvent(e) {
            if (e.type === 'destroy' && e.object && e.object.activity === activityObj.activity) {
                self.destroy();
            } else if (e.type === 'start' && e.object && e.object.activity !== activityObj.activity) {
                stopAndRestorePoster(false);
            }
        }

        function onControllerToggle(e) {
            if (destroyed || finished) return;
            var active = Lampa.Activity.active();
            if (!active || active.activity !== activityObj.activity) return;

            if (e && e.name === 'full_start' && !scrolledDown && (!fullLink || !fullLink.active)) {
                resumeFromScroll();
            } else if (fullLink && fullLink.active > 0) {
                pauseForScroll();
            }
        }

        function onPlayerCreate() {
            stopAndRestorePoster(false);
        }

        this.start = function () {
            if (!getBoolSetting('tv_bg_trailer', true)) return;
            if (window.innerWidth <= 790 || Lampa.Storage.field('light_version')) return;
            if (fullData && fullData.movie && fullData.movie.adult) return;

            window.addEventListener('message', onBridgeMessage);
            window.addEventListener('resize', onWindowResize);
            Lampa.Listener.follow('activity', onActivityEvent);
            if (Lampa.Controller && Lampa.Controller.listener) {
                Lampa.Controller.listener.follow('toggle', onControllerToggle);
            }
            if (Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.follow('create', onPlayerCreate);
            }

            // Загружаем список трейлеров с TMDB (с запасными кандидатами на случай запрета встраивания)
            fetchTmdbTrailers(fullData && fullData.movie, fullData && fullData.videos, netVideos, function (list) {
                if (destroyed || !list || !list.length) return;
                candidates = list;
                candidateIdx = 0;
                startTimer = setTimeout(tryNextCandidate, 1200);
            });
        };

        this.onScrollState = function (isDown) {
            scrolledDown = !!isDown;
            if (scrolledDown) {
                pauseForScroll();
            } else {
                resumeFromScroll();
            }
        };

        this.destroy = function () {
            if (destroyed) return;
            destroyed = true;
            finished = true;
            netVideos.clear();
            window.removeEventListener('message', onBridgeMessage);
            window.removeEventListener('resize', onWindowResize);
            Lampa.Listener.remove('activity', onActivityEvent);
            if (Lampa.Controller && Lampa.Controller.listener) {
                Lampa.Controller.listener.remove('toggle', onControllerToggle);
            }
            if (Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.remove('create', onPlayerCreate);
            }
            stopAndRestorePoster(true);
        };
    }

    /* ------------------------------------------------------------------ *
     * Секция "series choice" под Hero (выбор сезона, озвучки и серии)
     * ------------------------------------------------------------------ */

    function SeriesChoiceSection(fullLink, movie, onStateChange, onTmdbEpisodes) {
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
        var netBwaSeason = new Lampa.Reguest();
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
                    : (BwaFallback.isInstalled() ? t('tv_not_found_sources') : t('tv_not_found_filmix'));
                $seasonPill.find('.tv-pill__text').text(emptyLabel);
                $seasonPill.find('.tv-pill__chev').addClass('hide');
                $voicePill.addClass('hide');
                return;
            }

            $seasonPill.find('.tv-pill__text').text(s.label);
            $seasonPill.find('.tv-pill__chev').removeClass('hide');

            if (v) {
                var qLabel = formatQualityBadge(v.maxQuality);
                var voiceDisplay = parsedPost.provider === 'bwa' && parsedPost.sourceName
                    ? (v.name + ' (' + parsedPost.sourceName + ')')
                    : v.name;
                $voicePill.removeClass('hide');
                $voicePill.find('.tv-pill__voice-name').text(voiceDisplay);
                $voicePill.find('.tv-pill__dot').toggleClass('hide', !qLabel);
                $voicePill.find('.tv-pill__quality').text(qLabel).toggleClass('hide', !qLabel);
            } else {
                $voicePill.addClass('hide');
            }
        }

        function fetchTmdbSeason(seasonNum, cb) {
            var preferGroups = !!(parsedPost && parsedPost.seasons && parsedPost.seasons.length > 1 && (movie.number_of_seasons || 0) <= 1);
            fetchTmdbSeasonEpisodes(movie, seasonNum, preferGroups, netTmdb, tmdbSeasonCache, cb);
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

            var cachedSeasonEps = (tmdbSeasonCache.seasons && tmdbSeasonCache.seasons[s.num]) ? tmdbSeasonCache.seasons[s.num] : null;

            // Рисуем сначала сразу (или с кэшем TMDB), затем дополняем TMDB-метаданными
            drawCardsWithTmdb(s, v, cachedSeasonEps);

            if (!cachedSeasonEps) {
                var targetSeasonNum = s.num;
                var targetVoiceName = v.name;
                fetchTmdbSeason(targetSeasonNum, function (tmdbEps) {
                    if (destroyed) return;
                    if (typeof onTmdbEpisodes === 'function' && tmdbEps && tmdbEps.length) {
                        onTmdbEpisodes(tmdbEps);
                    }
                    var curS = getCurrentSeason();
                    var curV = getCurrentVoice();
                    if (curS && curV && curS.num === targetSeasonNum && curV.name === targetVoiceName) {
                        drawCardsWithTmdb(curS, curV, tmdbEps);
                        if (Lampa.Controller.enabled().name === ctrlName) {
                            refreshControllerCollection();
                        }
                    }
                });
            } else if (typeof onTmdbEpisodes === 'function' && cachedSeasonEps.length) {
                onTmdbEpisodes(cachedSeasonEps);
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
                    var savePatch = {
                        season: selectedSeasonIdx,
                        voice: selectedVoiceIdx,
                        voice_name: voiceObj.name,
                        last_season: ep.season,
                        last_episode: ep.episode
                    };
                    if (parsedPost.provider !== 'bwa') savePatch.filmix_id = parsedPost.id;
                    Filmix.saveChoice(movie.id, savePatch);

                    var afterPlay = function () {
                        self.refreshProgress();
                        notifyChange();
                    };
                    if (parsedPost.provider === 'bwa') {
                        BwaFallback.playEpisode(movie, parsedPost, voiceObj, idx, tmdbMap, afterPlay);
                    } else {
                        Filmix.playEpisode(movie, voiceObj, idx, tmdbMap, afterPlay);
                    }
                }).on('hover:long', function () {
                    var enabled = Lampa.Controller.enabled().name;
                    var extra = ep.provider === 'bwa'
                        ? (ep.file ? { file: ep.file } : null)
                        : Filmix.buildQualityMap(ep.file, ep.quality, ep.qualities);
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
                if (BwaFallback.isInstalled()) BwaFallback.openBwaPage(movie);
                else Filmix.openFilmixPage(movie);
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

                    function applySeasonSelection() {
                        var savedVoice = Filmix.getChoice(movie.id).voice_name;
                        var vm = Filmix.findVoiceInSeason(curSeason, savedVoice);
                        selectedVoiceIdx = vm ? vm.index : 0;
                        var savePatch = {
                            season: selectedSeasonIdx,
                            voice: selectedVoiceIdx,
                            voice_name: vm ? vm.voice.name : savedVoice
                        };
                        if (parsedPost.provider !== 'bwa') savePatch.filmix_id = parsedPost.id;
                        Filmix.saveChoice(movie.id, savePatch);
                        updatePillsUI();
                        renderCards();
                        notifyChange();
                    }

                    if (parsedPost.provider === 'bwa' && curSeason && !curSeason.bwaLoaded) {
                        $voicePill.find('.tv-pill__voice-name').text(t('tv_loading_bwa'));
                        netBwaSeason.clear();
                        BwaFallback.loadSeason(movie, parsedPost, selectedSeasonIdx, netBwaSeason, function () {
                            if (destroyed) return;
                            applySeasonSelection();
                        });
                    } else {
                        applySeasonSelection();
                    }
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
                var subParts = [];
                if (parsedPost && parsedPost.provider === 'bwa' && parsedPost.sourceName) subParts.push('BWA · ' + parsedPost.sourceName);
                if (qStr) subParts.push(qStr);
                subParts.push(v.episodes.length + ' ' + t('tv_episode_short').toLowerCase());
                items.push({
                    title: escapeHtml(v.name),
                    subtitle: escapeHtml(subParts.join(' • ')),
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
                    var savePatch = {
                        season: selectedSeasonIdx,
                        voice: selectedVoiceIdx,
                        voice_name: chosenVoice ? chosenVoice.name : ''
                    };
                    if (parsedPost.provider !== 'bwa') savePatch.filmix_id = parsedPost.id;
                    Filmix.saveChoice(movie.id, savePatch);
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
            if (parsedPost && parsedPost.provider === 'bwa') {
                BwaFallback.openBwaPage(movie);
            } else {
                Filmix.openFilmixPage(movie);
            }
        });

        this.setStatusText = function (txt) {
            if (destroyed || parsedPost) return;
            $seasonPill.find('.tv-pill__text').text(txt);
            $seasonPill.find('.tv-pill__chev').addClass('hide');
            $voicePill.addClass('hide');
        };

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
            var eps = tmdbSeasonCache.seasons && tmdbSeasonCache.seasons[seasonNum];
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
            netBwaSeason.clear();
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

        // Заменяем заголовок "Подробно" над описанием на название фильма/сериала
        var movieTitle = movie.title || movie.name || movie.original_title || movie.original_name || '';
        if (movieTitle) {
            var $lineTitle = $descr.closest('.items-line').find('.items-line__title').first();
            if (!$lineTitle.length && descrItem && descrItem.render) {
                $lineTitle = $(descrItem.render()).find('.items-line__title').first();
            }
            if ($lineTitle.length) $lineTitle.text(movieTitle);
        }

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
        var cardDestroyed = false;
        var tmdbDetailsNet = new Lampa.Reguest();
        var tmdbGroupsNet = new Lampa.Reguest();

        // 3.1. Оформляем детали под Figma (bold для цифр сезонов/серий + "Следующая: <дата> / Осталось дней: <N>")
        var $detailsEl = $start.find('.full-start-new__details');
        var seasonsLbl = Lampa.Lang.translate('title_seasons') || 'Сезоны';
        var episodesLbl = Lampa.Lang.translate('title_episodes') || 'Серии';
        var nextLblPrefix = (Lampa.Lang.translate('full_next_episode') || 'Следующая') + ':';
        var displayedSeasons = 0;
        var displayedEpisodes = 0;

        $detailsEl.children('span:not(.full-start-new__split)').each(function () {
            var $sp = $(this);
            var txt = $sp.text().trim();
            if (txt.indexOf(seasonsLbl + ':') === 0 || txt.indexOf(episodesLbl + ':') === 0) {
                var isSeasonsSpan = txt.indexOf(seasonsLbl + ':') === 0;
                var colonIdx = txt.indexOf(':');
                var labelPart = txt.slice(0, colonIdx + 1);
                var valPart = txt.slice(colonIdx + 1).trim();
                var numVal = parseInt(valPart, 10) || 0;
                if (isSeasonsSpan) {
                    $sp.addClass('tv-details__seasons');
                    displayedSeasons = numVal;
                } else {
                    $sp.addClass('tv-details__episodes');
                    displayedEpisodes = numVal;
                }
                if (valPart) {
                    $sp.html(escapeHtml(labelPart) + ' <span class="tv-details__val">' + escapeHtml(valPart) + '</span>');
                }
            } else if (txt.indexOf(nextLblPrefix) === 0) {
                $sp.addClass('tv-next-episode');
            }
        });

        function updateHeroSeasonsAndEpisodes(seasonsCount, episodesCount) {
            if (!$detailsEl.length) return;
            if (seasonsCount && seasonsCount > displayedSeasons) {
                displayedSeasons = seasonsCount;
                var $sSpan = $detailsEl.find('.tv-details__seasons').first();
                if ($sSpan.length) {
                    $sSpan.html(escapeHtml(seasonsLbl + ':') + ' <span class="tv-details__val">' + escapeHtml(String(displayedSeasons)) + '</span>');
                }
            }
            if (episodesCount && episodesCount > displayedEpisodes) {
                displayedEpisodes = episodesCount;
                var $eSpan = $detailsEl.find('.tv-details__episodes').first();
                if ($eSpan.length) {
                    $eSpan.html(escapeHtml(episodesLbl + ':') + ' <span class="tv-details__val">' + escapeHtml(String(displayedEpisodes)) + '</span>');
                }
            }
        }

        function extractMaxSeasonFromData(dataObj) {
            var maxS = 0;
            if (!dataObj || !dataObj.episodes) return 0;
            var epBlock = dataObj.episodes;
            if (epBlock.seasons_count && epBlock.seasons_count > maxS) maxS = epBlock.seasons_count;
            if (epBlock.season_number && epBlock.season_number > maxS) maxS = epBlock.season_number;
            if (epBlock.name) {
                var mName = String(epBlock.name).match(/(?:сезон|season)\s*(\d+)|(\d+)\s*(?:сезон|season)/i);
                var parsedN = mName ? (parseInt(mName[1] || mName[2], 10) || 0) : 0;
                if (parsedN > maxS) maxS = parsedN;
            }
            if (Array.isArray(epBlock.episodes)) {
                for (var ei = 0; ei < epBlock.episodes.length; ei++) {
                    var sn = epBlock.episodes[ei] && epBlock.episodes[ei].season_number;
                    if (sn && sn > maxS) maxS = sn;
                }
            }
            return maxS;
        }

        function renderNextEpisodeBadge(nextInfo) {
            if (!nextInfo || !nextInfo.air_date || !$detailsEl.length) return;
            var text = formatNextEpisodeLine(nextInfo.air_date, nextInfo.days);
            var $existing = $detailsEl.find('.tv-next-episode').first();
            if ($existing.length) {
                $existing.text(text);
                return;
            }
            if ($detailsEl.children().length) {
                $detailsEl.append('<span class="full-start-new__split">●</span>');
            }
            $detailsEl.append('<span class="tv-next-episode">' + escapeHtml(text) + '</span>');
        }

        if (serial) {
            // 1) Уточняем число сезонов по e.data.episodes (если CUB/Lampa знает более высокий сезон, чем movie.number_of_seasons)
            var dataMaxSeason = extractMaxSeasonFromData(e.data);
            if (dataMaxSeason > displayedSeasons) {
                updateHeroSeasonsAndEpisodes(dataMaxSeason, 0);
            }

            // 2) Для аниме/сериалов, где TMDB слил несколько сезонов в 1 (напр. 1 сезон / 60 серий), проверяем TMDB episode_groups ("Seasons", type=6)
            if (displayedSeasons <= 1 && displayedEpisodes >= 14 && movie.id && Lampa.TMDB && Lampa.TMDB.api) {
                var egListUrl = Lampa.TMDB.api('tv/' + movie.id + '/episode_groups?api_key=' + Lampa.TMDB.key());
                tmdbGroupsNet.timeout(10000);
                tmdbGroupsNet['native'](egListUrl, function (egJson) {
                    if (cardDestroyed || !egJson || !Array.isArray(egJson.results) || !egJson.results.length) return;
                    var seasonGroup = null;
                    for (var gi = 0; gi < egJson.results.length; gi++) {
                        var g = egJson.results[gi];
                        if (g && g.type === 6) {
                            seasonGroup = g;
                            break;
                        }
                    }
                    if (!seasonGroup) {
                        for (var gj = 0; gj < egJson.results.length; gj++) {
                            if (egJson.results[gj] && /season/i.test(String(egJson.results[gj].name || ''))) {
                                seasonGroup = egJson.results[gj];
                                break;
                            }
                        }
                    }
                    if (!seasonGroup || !seasonGroup.id) return;

                    var egDetailUrl = Lampa.TMDB.api('tv/episode_group/' + seasonGroup.id + '?api_key=' + Lampa.TMDB.key());
                    tmdbGroupsNet.timeout(10000);
                    tmdbGroupsNet['native'](egDetailUrl, function (detailJson) {
                        if (cardDestroyed || !detailJson || !Array.isArray(detailJson.groups)) return;
                        var realSeasons = 0;
                        var totalEps = 0;
                        for (var k = 0; k < detailJson.groups.length; k++) {
                            var grp = detailJson.groups[k];
                            if (!grp || !grp.order || grp.order <= 0) continue; // пропускаем order=0 (Specials)
                            var epCount = Array.isArray(grp.episodes) ? grp.episodes.length : 0;
                            if (epCount > 0) {
                                realSeasons++;
                                totalEps += epCount;
                            }
                        }
                        if (realSeasons > displayedSeasons) {
                            updateHeroSeasonsAndEpisodes(realSeasons, totalEps);
                        }
                    }, function () {});
                }, function () {});
            }

            // 3) Строка "Следующая: <дата> / Осталось дней: <N>"
            var nextEpInfo = findNextUpcomingAirDate(movie, e.data, null);
            if (nextEpInfo) {
                renderNextEpisodeBadge(nextEpInfo);
            } else if (movie.id && Lampa.TMDB && Lampa.TMDB.api) {
                var statusLower = String(movie.status || '').toLowerCase();
                var mayHaveNext = (typeof movie.next_episode_to_air === 'undefined') ||
                    (statusLower !== 'ended' && statusLower !== 'canceled');
                if (mayHaveNext) {
                    var tvInfoUrl = Lampa.TMDB.api('tv/' + movie.id + '?api_key=' + Lampa.TMDB.key() + '&language=' + getTmdbLang());
                    tmdbDetailsNet.timeout(10000);
                    tmdbDetailsNet['native'](tvInfoUrl, function (tvJson) {
                        if (cardDestroyed || !tvJson) return;
                        if (tvJson.next_episode_to_air && tvJson.next_episode_to_air.air_date) {
                            movie.next_episode_to_air = tvJson.next_episode_to_air;
                            var found = findNextUpcomingAirDate(tvJson, e.data, null);
                            if (found) renderNextEpisodeBadge(found);
                        }
                    }, function () {});
                }
            }
        }

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
                if (loadedFilmixPost && loadedFilmixPost.provider === 'bwa') {
                    BwaFallback.openBwaPage(movie);
                } else if (!loadedFilmixPost && filmixResolved && BwaFallback.isInstalled()) {
                    BwaFallback.openBwaPage(movie);
                } else {
                    Filmix.openFilmixPage(movie);
                }
                return;
            }
            if (loadedFilmixPost && loadedFilmixPost.isSerial) {
                var resume = Filmix.findResumeTarget(movie, loadedFilmixPost);
                if (resume) {
                    var tmdbMap = seriesSection ? seriesSection.getTmdbMapForSeason(resume.season.num) : {};
                    var savePatch = {
                        season: resume.seasonIndex,
                        voice: resume.voiceIndex,
                        voice_name: resume.voice.name,
                        last_season: resume.season.num,
                        last_episode: resume.episode.episode
                    };
                    if (loadedFilmixPost.provider !== 'bwa') savePatch.filmix_id = loadedFilmixPost.id;
                    Filmix.saveChoice(movie.id, savePatch);

                    var afterLaunch = function () {
                        updateHeroPlayLabel();
                        if (seriesSection) seriesSection.refreshProgress();
                    };

                    if (loadedFilmixPost.provider === 'bwa') {
                        BwaFallback.playEpisode(movie, loadedFilmixPost, resume.voice, resume.episodeIndex, tmdbMap, afterLaunch);
                    } else {
                        Filmix.playEpisode(movie, resume.voice, resume.episodeIndex, tmdbMap, afterLaunch);
                    }
                    return;
                }
            }
            // Если не найдено на Filmix и установлен BWA — открываем BWA, иначе страницу Filmix
            if (filmixResolved && BwaFallback.isInstalled()) BwaFallback.openBwaPage(movie);
            else Filmix.openFilmixPage(movie);
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
            }, function (tmdbEps) {
                if (cardDestroyed || $detailsEl.find('.tv-next-episode').length) return;
                var nextFromSeason = findNextUpcomingAirDate(movie, e.data, tmdbEps);
                if (nextFromSeason) renderNextEpisodeBadge(nextFromSeason);
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

        // 5. Загружаем данные Filmix в фоне; если не найдено и установлен BWA — перебираем включённые источники BWA
        var loadedFilmixId = 0;
        var filmixResolved = false;
        var bwaNet = new Lampa.Reguest();

        function applyResolvedSource(parsed) {
            loadedFilmixPost = parsed;
            loadedFilmixId = (parsed && parsed.provider !== 'bwa') ? parsed.id : 0;

            if (serial) {
                updateHeroPlayLabel();
                if (seriesSection) seriesSection.setFilmixData(parsed);
                if (parsed && parsed.isSerial && Array.isArray(parsed.seasons) && parsed.seasons.length) {
                    var srcSeasons = 0;
                    var srcEpisodes = 0;
                    for (var si = 0; si < parsed.seasons.length; si++) {
                        var sObj = parsed.seasons[si];
                        if (!sObj || sObj.num <= 0) continue;
                        srcSeasons++;
                        var bestVoiceEps = 0;
                        if (Array.isArray(sObj.voices)) {
                            for (var vi = 0; vi < sObj.voices.length; vi++) {
                                var vLen = (sObj.voices[vi] && Array.isArray(sObj.voices[vi].episodes)) ? sObj.voices[vi].episodes.length : 0;
                                if (vLen > bestVoiceEps) bestVoiceEps = vLen;
                            }
                        }
                        srcEpisodes += bestVoiceEps;
                    }
                    updateHeroSeasonsAndEpisodes(srcSeasons, srcEpisodes);
                }
            } else if (parsed && parsed.movies && parsed.movies.length) {
                // Если у фильма не указано качество в деталях — добавим макс. качество с найденного источника
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
        }

        function loadFilmixData() {
            filmixNet.clear();
            bwaNet.clear();
            filmixResolved = false;

            Filmix.resolveForMovie(movie, filmixNet, function (parsed) {
                if (cardDestroyed) return;
                filmixResolved = true;

                if (parsed) {
                    applyResolvedSource(parsed);
                    return;
                }

                // На Filmix не нашлось — пробуем все включённые источники BWA (если установлен bwa_online)
                if (BwaFallback.isInstalled()) {
                    if (serial && seriesSection) seriesSection.setStatusText(t('tv_loading_bwa'));
                    BwaFallback.resolveForMovie(movie, bwaNet, function (srcName) {
                        if (cardDestroyed) return;
                        if (serial && seriesSection) {
                            seriesSection.setStatusText('BWA: ' + srcName + '...');
                        }
                    }, function (bwaParsed) {
                        if (cardDestroyed) return;
                        applyResolvedSource(bwaParsed);
                    });
                } else {
                    applyResolvedSource(null);
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

        // 8. Ротация задников (кеш 24ч, старт со стандартного), логотип (TMDB /images) и фоновый тихий трейлер (TMDB /videos)
        var tmdbImagesNet = new Lampa.Reguest();
        var tmdbImagesCtrl = loadTmdbImagesForCard(movie, e.object, $activityRoot, $start, tmdbImagesNet, function () {
            return cardDestroyed;
        });

        var bgTrailer = new BackgroundTrailer(e.object, link, $activityRoot, e.data);
        bgTrailer.start();

        // Возвращаем задник при скролле вниз и при необходимости подставляем отложенный series_choice
        if (link.scroll) {
            var origOnScroll = link.scroll.onScroll;
            link.scroll.onScroll = function (pos) {
                if (typeof origOnScroll === 'function') origOnScroll.apply(this, arguments);
                bgTrailer.onScrollState(Math.abs(pos) > 5);
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
                var curBwaSrcMap = Lampa.Storage.get('bwa_title_src', {}) || {};
                var curBwaBalanser = curBwaSrcMap[movie.id] || '';
                var loadedBwaBalanser = (loadedFilmixPost && loadedFilmixPost.provider === 'bwa' && loadedFilmixPost.bwaSource)
                    ? loadedFilmixPost.bwaSource.balanser
                    : '';

                if (savedCh.filmix_id && savedCh.filmix_id !== loadedFilmixId) {
                    loadFilmixData();
                } else if (BwaFallback.isInstalled() && curBwaBalanser && curBwaBalanser !== loadedBwaBalanser && (!loadedFilmixPost || loadedFilmixPost.provider === 'bwa')) {
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
                bwaNet.clear();
                tmdbDetailsNet.clear();
                tmdbGroupsNet.clear();
                tmdbImagesNet.clear();
                if (tmdbImagesCtrl && tmdbImagesCtrl.destroy) tmdbImagesCtrl.destroy();
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
     * Глобальная кнопка «Еще» в контекстном меню (долгое нажатие на карточку)
     * Работает во всём приложении во всех горизонтальных рядах с «Еще»
     * ------------------------------------------------------------------ */

    var GlobalMoreMenu = (function () {
        var initialized = false;
        var lastCardContext = { lineEl: null, cardEl: null, ts: 0 };
        var lastLongPressTs = 0;

        function dispatchHoverEnter(dom) {
            if (!dom) return;
            var el = dom.jquery ? dom[0] : dom;
            if (!el) return;
            try {
                var ev;
                if (typeof CustomEvent === 'function') {
                    ev = new CustomEvent('hover:enter', { bubbles: true, cancelable: true });
                } else if (document.createEvent) {
                    ev = document.createEvent('Event');
                    ev.initEvent('hover:enter', true, true);
                }
                if (ev && el.dispatchEvent) {
                    el.dispatchEvent(ev);
                    return;
                }
            } catch (e) {}
            try { $(el).trigger('hover:enter'); } catch (e2) {}
        }

        function findLineContainer(el) {
            if (!el) return null;
            var $el = el.jquery ? el : $(el);
            if (!$el.length) return null;
            if ($el.hasClass('card-more') || $el.closest('.card-more').length) return null;
            var $line = $el.closest('.items-line, .tv-home-row');
            return $line.length ? $line : null;
        }

        function isCardLike(el) {
            if (!el) return false;
            var $el = el.jquery ? el : $(el);
            if (!$el.length) return false;
            if ($el.hasClass('card-more') || $el.closest('.card-more').length) return false;
            return $el.hasClass('card') ||
                $el.hasClass('card-episode') ||
                $el.hasClass('tv-home-card') ||
                $el.hasClass('tv-home-wide') ||
                $el.hasClass('selector') && $el.closest('.items-line__body, .tv-home-row__track').length > 0;
        }

        function resolveActiveLine() {
            var $focused = $('.items-line .focus, .tv-home-row .focus').first();
            if ($focused.length && isCardLike($focused)) {
                var $fl = findLineContainer($focused);
                if ($fl && $fl.length) return $fl;
            }
            if (lastCardContext.lineEl && (Date.now() - lastCardContext.ts) < 2500) {
                var $ll = $(lastCardContext.lineEl);
                if ($ll.length && document.body && document.body.contains($ll[0])) {
                    return $ll;
                }
            }
            return null;
        }

        function getMoreHandler($line) {
            if (!$line || !$line.length) return null;

            var customMore = $line.data('tv_more_fn');
            if (typeof customMore === 'function') {
                return customMore;
            }

            var lineRef = $line.data('tv_line_ref');
            var $moreBtn = $line.find('.items-line__more, .card-more').first();

            if (lineRef) {
                var hasPages = lineRef.data && parseInt(lineRef.data.total_pages, 10) > 1;
                var hasMoreObj = !!lineRef.more;
                if (hasPages || hasMoreObj || $moreBtn.length) {
                    return function () {
                        if (typeof lineRef.emit === 'function') {
                            lineRef.emit('more', lineRef.data);
                        } else if ($moreBtn.length) {
                            dispatchHoverEnter($moreBtn[0]);
                        }
                    };
                }
            }

            if ($moreBtn.length) {
                return function () {
                    dispatchHoverEnter($moreBtn[0]);
                };
            }

            return null;
        }

        function getLineTitle($line) {
            if (!$line || !$line.length) return '';
            var title = $line.find('.items-line__title, .tv-home-row__title').first().text();
            if (title) title = String(title).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
            if (!title) {
                var lineRef = $line.data('tv_line_ref');
                if (lineRef && lineRef.data && lineRef.data.title) {
                    title = String(lineRef.data.title);
                }
            }
            return title || '';
        }

        function injectMoreItem(selectObj) {
            if (!selectObj || !Array.isArray(selectObj.items) || !selectObj.items.length) return;
            if (selectObj.__tv_skip_more) return;

            for (var i = 0; i < selectObj.items.length; i++) {
                if (selectObj.items[i] && selectObj.items[i].__tv_more_action) return;
            }

            var $line = resolveActiveLine();
            if (!$line || !$line.length) return;

            var invokeMore = getMoreHandler($line);
            if (typeof invokeMore !== 'function') return;

            var moreTitle = (Lampa.Lang && Lampa.Lang.translate('more')) || t('tv_home_more_action');
            var lineTitle = getLineTitle($line);

            var moreAction = {
                title: moreTitle,
                subtitle: lineTitle || t('tv_home_more_all'),
                __tv_more_action: true,
                onSelect: function () {
                    setTimeout(function () {
                        try {
                            invokeMore();
                        } catch (err) {
                            if (window.console && console.error) console.error('[TV More]', err);
                        }
                    }, 35);
                }
            };

            selectObj.items.unshift(moreAction);
        }

        function isContextMenuForSearch(selectObj) {
            if (!selectObj || !Array.isArray(selectObj.items) || !selectObj.items.length) return false;
            if (selectObj.__tv_skip_search) return false;
            if (!Lampa.Search || typeof Lampa.Search.open !== 'function') return false;

            try {
                if ($('body').hasClass('search--open')) return false;
            } catch (e) {}

            try {
                if (Lampa.Player && typeof Lampa.Player.opened === 'function' && Lampa.Player.opened()) return false;
            } catch (e2) {}

            var ctrlName = '';
            try {
                var en = Lampa.Controller && typeof Lampa.Controller.enabled === 'function' ? Lampa.Controller.enabled() : null;
                ctrlName = en && en.name ? String(en.name) : '';
            } catch (e3) {}

            if (ctrlName === 'settings' || ctrlName === 'settings_component' || ctrlName === 'modal' || ctrlName === 'search' || ctrlName === 'player') {
                return false;
            }

            for (var i = 0; i < selectObj.items.length; i++) {
                if (selectObj.items[i] && selectObj.items[i].__tv_search_action) return false;
            }

            if ((Date.now() - lastLongPressTs) <= 1000) return true;

            var actionTitle = (Lampa.Lang && typeof Lampa.Lang.translate === 'function')
                ? String(Lampa.Lang.translate('title_action') || '')
                : '';
            if (actionTitle && selectObj.title && String(selectObj.title) === actionTitle) return true;

            return false;
        }

        function injectSearchItem(selectObj) {
            if (!isContextMenuForSearch(selectObj)) return;

            var prevCtrl = '';
            try {
                var en = Lampa.Controller && typeof Lampa.Controller.enabled === 'function' ? Lampa.Controller.enabled() : null;
                if (en && en.name && en.name !== 'select' && en.name !== 'search') prevCtrl = en.name;
            } catch (e) {}

            var searchTitle = (Lampa.Lang && Lampa.Lang.translate('search')) || t('tv_search_open_action');
            var searchAction = {
                title: searchTitle,
                subtitle: t('tv_search_open_sub'),
                __tv_search_action: true,
                onSelect: function () {
                    setTimeout(function () {
                        try {
                            if (Lampa.Search && typeof Lampa.Search.open === 'function') {
                                if (prevCtrl && prevCtrl !== 'content') {
                                    Lampa.Search.open({
                                        onBack: function () {
                                            Lampa.Controller.toggle(prevCtrl);
                                        }
                                    });
                                } else {
                                    Lampa.Search.open();
                                }
                            }
                        } catch (err) {
                            if (window.console && console.error) console.error('[TV Search]', err);
                        }
                    }, 35);
                }
            };

            var insertAt = 0;
            while (insertAt < selectObj.items.length &&
                selectObj.items[insertAt] &&
                (selectObj.items[insertAt].__tv_more_action || selectObj.items[insertAt].__tv_mark_watched_action)) {
                insertAt++;
            }
            selectObj.items.splice(insertAt, 0, searchAction);
        }

        function onSelectPreshow(selectObj) {
            injectMoreItem(selectObj);
            injectSearchItem(selectObj);
        }

        function recordLongPressTarget(target) {
            lastLongPressTs = Date.now();
            if (!target) return;
            var $line = findLineContainer(target);
            if ($line && $line.length && isCardLike(target)) {
                lastCardContext = { lineEl: $line[0], cardEl: target, ts: lastLongPressTs };
            }
        }

        function init() {
            if (initialized) return;
            initialized = true;

            if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
                Lampa.Listener.follow('line', function (e) {
                    try {
                        if (e && e.line && e.line.html) {
                            $(e.line.html).data('tv_line_ref', e.line);
                        }
                    } catch (err) {}
                });
            }

            try {
                document.addEventListener('hover:long', function (ev) {
                    recordLongPressTarget(ev && ev.target ? ev.target : null);
                }, true);

                document.addEventListener('contextmenu', function (ev) {
                    recordLongPressTarget(ev && ev.target ? ev.target : null);
                }, true);

                document.addEventListener('hover:focus', function (ev) {
                    var target = ev && ev.target ? ev.target : null;
                    if (!target) return;
                    var $line = findLineContainer(target);
                    if ($line && $line.length && isCardLike(target)) {
                        lastCardContext = { lineEl: $line[0], cardEl: target, ts: Date.now() };
                    }
                }, true);
            } catch (e) {}

            try {
                $(document).on('hover:long contextmenu', function (ev) {
                    recordLongPressTarget(ev && ev.target ? ev.target : null);
                });
            } catch (e2) {}

            if (Lampa.Select && Lampa.Select.listener && typeof Lampa.Select.listener.follow === 'function') {
                Lampa.Select.listener.follow('preshow', function (e) {
                    try {
                        if (e && e.active) onSelectPreshow(e.active);
                    } catch (err) {}
                });
            } else if (Lampa.Select && typeof Lampa.Select.show === 'function' && !Lampa.Select.__tv_more_wrapped) {
                Lampa.Select.__tv_more_wrapped = true;
                var origShow = Lampa.Select.show;
                Lampa.Select.show = function (params) {
                    try { onSelectPreshow(params); } catch (err) {}
                    return origShow.apply(this, arguments);
                };
            }
        }

        return {
            init: init,
            injectMoreItem: injectMoreItem,
            injectSearchItem: injectSearchItem,
            recordLongPressTarget: recordLongPressTarget,
            dispatchHoverEnter: dispatchHoverEnter
        };
    })();

    /* ------------------------------------------------------------------ *
     * IMDb-рейтинги карточек (кэш 7 дней + приоритет IMDb) и жанры TMDB
     * ------------------------------------------------------------------ */

    var ImdbCardRatings = (function () {
        var CACHE_KEY = 'tv_imdb_rating_cache';
        var CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
        var CACHE_MAX = 300;
        var memCache = null;

        var GENRES_RU = {
            28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
            80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
            14: 'Фэнтези', 36: 'История', 27: 'Ужасы', 10402: 'Музыка',
            9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика', 10770: 'ТВ фильм',
            53: 'Триллер', 10752: 'Военный', 37: 'Вестерн',
            10759: 'Боевик и приключения', 10762: 'Детский', 10763: 'Новости',
            10764: 'Реалити', 10765: 'Фантастика', 10766: 'Мелодрама',
            10767: 'Ток-шоу', 10768: 'Военный'
        };

        var GENRES_EN = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
            14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
            53: 'Thriller', 10752: 'War', 37: 'Western',
            10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
            10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
            10767: 'Talk', 10768: 'War & Politics'
        };

        function loadCache() {
            if (memCache) return memCache;
            var stored = null;
            try { stored = Lampa.Storage.get(CACHE_KEY, null); } catch (e) {}
            memCache = (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
            return memCache;
        }

        function saveCache(store) {
            var now = Date.now();
            var keys = Object.keys(store);
            var valid = [];
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var e = store[k];
                if (!e || !e.ts || (now - e.ts) > CACHE_TTL) delete store[k];
                else valid.push(k);
            }
            if (valid.length > CACHE_MAX) {
                valid.sort(function (a, b) { return (store[a].ts || 0) - (store[b].ts || 0); });
                var over = valid.length - CACHE_MAX;
                for (var r = 0; r < over; r++) delete store[valid[r]];
            }
            memCache = store;
            try { Lampa.Storage.set(CACHE_KEY, store); } catch (e) {}
        }

        function cardKey(card) {
            if (!card || !card.id) return '';
            return (isSerialMovie(card) ? 'tv_' : 'mv_') + card.id;
        }

        function formatScore(val) {
            var n = parseFloat(val);
            if (!n || isNaN(n) || n <= 0) return '';
            return n >= 10 ? '10' : n.toFixed(1);
        }

        function remember(card, score) {
            var k = cardKey(card);
            var sc = formatScore(score);
            if (!k || !sc) return;
            var store = loadCache();
            if (store[k] && store[k].s === sc && (Date.now() - (store[k].ts || 0)) < 24 * 60 * 60 * 1000) return;
            store[k] = { s: sc, ts: Date.now() };
            saveCache(store);
        }

        function readExternalRatingPluginCache(card) {
            if (!card || !card.id) return '';
            try {
                var ext = Lampa.Storage.cache('kp_rating', 500, {});
                if (ext && ext[card.id] && ext[card.id].imdb) {
                    var f = formatScore(ext[card.id].imdb);
                    if (f) return f;
                }
            } catch (e) {}
            try {
                var favCard = Lampa.Favorite && typeof Lampa.Favorite.find === 'function' ? Lampa.Favorite.find({ id: card.id }) : null;
                if (favCard && favCard.imdb_rating) {
                    var ff = formatScore(favCard.imdb_rating);
                    if (ff) return ff;
                }
            } catch (e2) {}
            return '';
        }

        function getRating(card) {
            if (!card) return { score: '', source: '' };

            if (card.imdb_rating) {
                var direct = formatScore(card.imdb_rating);
                if (direct) {
                    remember(card, direct);
                    return { score: direct, source: 'IMDb' };
                }
            }

            var k = cardKey(card);
            var store = loadCache();
            if (k && store[k] && store[k].s && (Date.now() - (store[k].ts || 0)) <= CACHE_TTL) {
                return { score: store[k].s, source: 'IMDb' };
            }

            var ext = readExternalRatingPluginCache(card);
            if (ext) {
                remember(card, ext);
                return { score: ext, source: 'IMDb' };
            }

            if (card.vote_average) {
                var tmdb = formatScore(card.vote_average);
                if (tmdb) return { score: tmdb, source: 'TMDB' };
            }

            return { score: '', source: '' };
        }

        function getCardGenres(card, maxCount) {
            var out = [];
            if (!card) return out;
            var limit = maxCount || 3;
            var lang = getTmdbLang();
            var map = (lang === 'en') ? GENRES_EN : GENRES_RU;

            if (Array.isArray(card.genres) && card.genres.length) {
                for (var i = 0; i < card.genres.length && out.length < limit; i++) {
                    var g = card.genres[i];
                    var name = g && g.name ? String(g.name) : (typeof g === 'string' ? g : '');
                    if (name) {
                        name = name.charAt(0).toUpperCase() + name.slice(1);
                        out.push(name);
                    }
                }
            } else if (Array.isArray(card.genre_ids) && card.genre_ids.length) {
                for (var j = 0; j < card.genre_ids.length && out.length < limit; j++) {
                    var gid = card.genre_ids[j];
                    if (map[gid]) out.push(map[gid]);
                }
            }
            return out;
        }

        return {
            remember: remember,
            getRating: getRating,
            getCardGenres: getCardGenres,
            formatScore: formatScore
        };
    })();

    /* ------------------------------------------------------------------ *
     * «Продолжить просмотр» (фильтр <= 80% + скрытие по «Просмотрено»)
     * ------------------------------------------------------------------ */

    var ContinueWatching = (function () {
        var HIDDEN_KEY = 'tv_home_watched_hidden';
        var HIDDEN_MAX = 250;
        var MAX_PERCENT = 80;

        function loadHidden() {
            var stored = null;
            try { stored = Lampa.Storage.get(HIDDEN_KEY, null); } catch (e) {}
            return (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
        }

        function saveHidden(map) {
            var keys = Object.keys(map);
            if (keys.length > HIDDEN_MAX) {
                keys.sort(function (a, b) {
                    return ((map[a] && map[a].ts) || 0) - ((map[b] && map[b].ts) || 0);
                });
                var over = keys.length - HIDDEN_MAX;
                for (var i = 0; i < over; i++) delete map[keys[i]];
            }
            try { Lampa.Storage.set(HIDDEN_KEY, map); } catch (e) {}
        }

        function isHiddenEntry(hiddenMap, cardId, sig, updatedTs) {
            var entry = hiddenMap[String(cardId)];
            if (!entry) return false;
            if (entry.sig !== sig) return false;
            if (updatedTs && entry.ts && updatedTs > entry.ts + 2000) return false;
            return true;
        }

        function makeEpisodeHash(card, season, episode) {
            var orig = card.original_name || card.original_title || card.name || card.title || '';
            return Lampa.Utils.hash([season, season > 10 ? ':' : '', episode, orig].join(''));
        }

        function formatRemainingTime(timeSec, durSec) {
            var tSec = parseFloat(timeSec) || 0;
            var dSec = parseFloat(durSec) || 0;
            if (dSec <= 0 || dSec <= tSec) return '';
            var leftMin = Math.max(1, Math.round((dSec - tSec) / 60));
            var h = Math.floor(leftMin / 60);
            var m = leftMin % 60;
            var lang = getTmdbLang();
            var hWord = (lang === 'en') ? 'h' : ((lang === 'uk') ? 'год' : 'ч');
            var mWord = (lang === 'en') ? 'm' : ((lang === 'uk') ? 'хв' : 'мин');
            if (h > 0 && m > 0) return t('tv_home_remaining') + ' ' + h + ' ' + hWord + ' ' + m + ' ' + mWord;
            if (h > 0) return t('tv_home_remaining') + ' ' + h + ' ' + hWord;
            return t('tv_home_remaining') + ' ' + m + ' ' + mWord;
        }

        function findBestSeriesEpisode(card) {
            var best = null;
            var checked = {};

            function consider(s, e, tl, stillPath) {
                if (!s || !e || !tl) return;
                var pct = parseFloat(tl.percent) || 0;
                if (pct <= 0) return;
                var upd = parseFloat(tl.updated) || 0;
                var score = upd > 0 ? upd : (s * 10000 + e);
                if (!best || score > best._score) {
                    best = {
                        season: s,
                        episode: e,
                        percent: Math.min(100, Math.round(pct)),
                        time: parseFloat(tl.time) || 0,
                        duration: parseFloat(tl.duration) || 0,
                        updated: upd,
                        still_path: stillPath || '',
                        hash: makeEpisodeHash(card, s, e),
                        _score: score
                    };
                }
            }

            function checkSE(s, e, stillPath) {
                var key = s + ':' + e;
                if (checked[key]) return;
                checked[key] = true;
                var tl = getEpisodeTimeline(card, s, e);
                if (tl && tl.percent > 0) {
                    consider(s, e, tl, stillPath);
                }
            }

            // 1. Проверяем последний сохранённый выбор Filmix (если есть)
            try {
                if (typeof Filmix !== 'undefined' && Filmix && typeof Filmix.getChoice === 'function') {
                    var choice = Filmix.getChoice(card);
                    if (choice && choice.season && choice.episode) {
                        var cs = parseInt(choice.season, 10);
                        var ce = parseInt(choice.episode, 10);
                        if (cs > 0 && ce > 0) {
                            checkSE(cs, ce, '');
                            if (ce > 1) checkSE(cs, ce - 1, '');
                            checkSE(cs, ce + 1, '');
                        }
                    }
                }
            } catch (e1) {}

            // 2. Проверяем эпизоды из Lampa.TimeTable (если есть)
            try {
                if (Lampa.TimeTable && typeof Lampa.TimeTable.get === 'function') {
                    var tt = Lampa.TimeTable.get(card);
                    if (Array.isArray(tt)) {
                        for (var i = 0; i < tt.length; i++) {
                            var ep = tt[i];
                            if (ep && ep.season_number && ep.episode_number) {
                                checkSE(ep.season_number, ep.episode_number, ep.still_path || '');
                            }
                        }
                    }
                }
            } catch (e2) {}

            // 3. Проверяем встроенный Lampa.Timeline.watched (1-й сезон)
            try {
                if (Lampa.Timeline && typeof Lampa.Timeline.watched === 'function') {
                    var wList = Lampa.Timeline.watched(card, true);
                    if (Array.isArray(wList)) {
                        for (var w = 0; w < wList.length; w++) {
                            var entry = wList[w];
                            if (entry && entry.ep && entry.view && entry.view.percent > 0) {
                                consider(1, entry.ep, entry.view, '');
                            }
                        }
                    }
                }
            } catch (e3) {}

            // 4. Быстрый ограниченный проход по сезонам (если ещё не найдено или сезонов > 1)
            var maxSeasons = Math.min(parseInt(card.number_of_seasons, 10) || 4, 10);
            var maxEps = 24;
            for (var s = 1; s <= maxSeasons; s++) {
                var misses = 0;
                for (var e = 1; e <= maxEps; e++) {
                    var k = s + ':' + e;
                    if (checked[k]) continue;
                    checked[k] = true;
                    var tl = getEpisodeTimeline(card, s, e);
                    if (tl && tl.percent > 0) {
                        consider(s, e, tl, '');
                        misses = 0;
                    } else {
                        misses++;
                        if (misses >= 6 && e > 6) break;
                    }
                }
            }

            return best;
        }

        function inspectMovieProgress(card) {
            var hash = makeMovieTimelineHash(card);
            var tl = null;
            try {
                if (Lampa.Timeline && typeof Lampa.Timeline.view === 'function') {
                    tl = Lampa.Timeline.view(hash);
                }
            } catch (e) {}

            if ((!tl || !tl.percent) && Lampa.Timeline && typeof Lampa.Timeline.watched === 'function') {
                try {
                    var w = Lampa.Timeline.watched(card, true);
                    if (w && typeof w === 'object' && w.percent > 0) tl = w;
                } catch (e2) {}
            }

            if (!tl) return null;
            var pct = parseFloat(tl.percent) || 0;
            if (pct <= 0) return null;

            return {
                percent: Math.min(100, Math.round(pct)),
                time: parseFloat(tl.time) || 0,
                duration: parseFloat(tl.duration) || 0,
                updated: parseFloat(tl.updated) || 0,
                hash: hash
            };
        }

        function collectItems() {
            var out = [];
            if (!Lampa.Favorite || typeof Lampa.Favorite.get !== 'function') return out;

            var history = Lampa.Favorite.get({ type: 'history' }) || [];
            var continued = Lampa.Favorite.get({ type: 'continued' }) || [];
            var viewed = Lampa.Favorite.get({ type: 'viewed' }) || [];
            var thrown = Lampa.Favorite.get({ type: 'thrown' }) || [];
            var hiddenMap = loadHidden();

            var excludedIds = {};
            var idx;
            for (idx = 0; idx < viewed.length; idx++) {
                if (viewed[idx] && viewed[idx].id) excludedIds[String(viewed[idx].id)] = true;
            }
            for (idx = 0; idx < thrown.length; idx++) {
                if (thrown[idx] && thrown[idx].id) excludedIds[String(thrown[idx].id)] = true;
            }

            var merged = [];
            var seenIds = {};
            for (idx = 0; idx < history.length; idx++) {
                var hc = history[idx];
                if (hc && hc.id && !seenIds[String(hc.id)]) {
                    seenIds[String(hc.id)] = true;
                    merged.push(hc);
                }
            }
            for (idx = 0; idx < continued.length; idx++) {
                var cc = continued[idx];
                if (cc && cc.id && !seenIds[String(cc.id)]) {
                    seenIds[String(cc.id)] = true;
                    merged.push(cc);
                }
            }

            for (idx = 0; idx < merged.length && out.length < 20; idx++) {
                var card = merged[idx];
                if (!card || !card.id) continue;
                if (excludedIds[String(card.id)]) continue;

                var serial = isSerialMovie(card);
                if (serial) {
                    var ep = findBestSeriesEpisode(card);
                    if (!ep || ep.percent <= 0 || ep.percent > MAX_PERCENT) continue;
                    var epSig = 's' + ep.season + 'e' + ep.episode;
                    if (isHiddenEntry(hiddenMap, card.id, epSig, ep.updated)) continue;

                    var remEp = formatRemainingTime(ep.time, ep.duration);
                    var subEp = t('tv_home_season_word') + ' ' + ep.season + ', ' + t('tv_home_episode_word') + ' ' + ep.episode;
                    if (remEp) subEp += ' • ' + remEp;
                    else subEp += ' • ' + ep.percent + '%';

                    out.push({
                        card: card,
                        isSerial: true,
                        season: ep.season,
                        episode: ep.episode,
                        percent: ep.percent,
                        time: ep.time,
                        duration: ep.duration,
                        hash: ep.hash,
                        sig: epSig,
                        badge: 'S' + ep.season + ' • E' + ep.episode,
                        subtitle: subEp,
                        still_path: ep.still_path || ''
                    });
                } else {
                    var mv = inspectMovieProgress(card);
                    if (!mv || mv.percent <= 0 || mv.percent > MAX_PERCENT) continue;
                    var mvSig = 'movie';
                    if (isHiddenEntry(hiddenMap, card.id, mvSig, mv.updated)) continue;

                    var remMv = formatRemainingTime(mv.time, mv.duration);
                    var subMv = remMv || (t('tv_home_watched_pct') + ' ' + mv.percent + '%');
                    var qual = card.release_quality ? String(card.release_quality).toUpperCase() : '';

                    out.push({
                        card: card,
                        isSerial: false,
                        season: 0,
                        episode: 0,
                        percent: mv.percent,
                        time: mv.time,
                        duration: mv.duration,
                        hash: mv.hash,
                        sig: mvSig,
                        badge: qual,
                        subtitle: subMv,
                        still_path: ''
                    });
                }
            }

            return out;
        }

        function markAsWatched(item) {
            if (!item || !item.card || !item.card.id) return;

            // 1. Обновляем Lampa.Timeline до 100%
            try {
                if (Lampa.Timeline && typeof Lampa.Timeline.update === 'function' && item.hash) {
                    var dur = item.duration > 0 ? item.duration : 100;
                    Lampa.Timeline.update({
                        hash: item.hash,
                        percent: 100,
                        time: dur,
                        duration: dur,
                        profile: 0
                    });
                }
            } catch (e) {}

            // 2. Сохраняем в локальный список скрытых просмотренных для надёжного скрытия
            var hiddenMap = loadHidden();
            hiddenMap[String(item.card.id)] = {
                sig: item.sig || (item.isSerial ? ('s' + item.season + 'e' + item.episode) : 'movie'),
                ts: Date.now()
            };
            saveHidden(hiddenMap);
        }

        function formatCountSubtitle(count) {
            var n = Math.abs(parseInt(count, 10) || 0);
            var lang = getTmdbLang();
            if (lang === 'en') return n + (n === 1 ? ' title' : ' titles');
            if (lang === 'uk') {
                var m10u = n % 10;
                var m100u = n % 100;
                if (m10u === 1 && m100u !== 11) return n + ' фільм або серіал';
                return n + ' фільмів і серіалів';
            }
            var m10 = n % 10;
            var m100 = n % 100;
            if (m10 === 1 && m100 !== 11) return n + ' фильм или сериал';
            return n + ' фильмов и сериалов';
        }

        return {
            MAX_PERCENT: MAX_PERCENT,
            collectItems: collectItems,
            markAsWatched: markAsWatched,
            formatCountSubtitle: formatCountSubtitle
        };
    })();

    /* ------------------------------------------------------------------ *
     * Настройки главного экрана: порядок и скрытие блоков (HomeSections)
     * ------------------------------------------------------------------ */

    var HomeSections = (function () {
        var HS_PREFIX = 'tv_home_';
        var SUB_COMPONENT = 'tv_plugin_home';
        var KNOWN_KEY = 'tv_home_known_blocks';

        var BASE_BLOCKS = [
            { id: 'now_watch', langKey: 'tv_home_block_now_watch', fallback: 'Сейчас смотрят' },
            { id: 'continue_watching', langKey: 'tv_home_continue_title', fallback: 'Продолжить просмотр' },
            { id: 'new_episodes', langKey: 'tv_home_new_episodes_title', fallback: 'Новые серии' },
            { id: 'latest', langKey: 'tv_home_block_latest', fallback: 'Новинки' },
            { id: 'fire', langKey: 'tv_home_block_fire', fallback: 'В огне' },
            { id: 'high_quality', langKey: 'tv_home_block_high_quality', fallback: 'В высоком качестве' },
            { id: 'top_movies', langKey: 'tv_home_block_top_movies', fallback: 'Топ 100 — Фильмы' },
            { id: 'top_tv', langKey: 'tv_home_block_top_tv', fallback: 'Топ 100 — Сериалы' },
            { id: 'trend_day', langKey: 'tv_home_block_trend_day', fallback: 'В тренде за день' },
            { id: 'trend_week', langKey: 'tv_home_block_trend_week', fallback: 'В тренде за неделю' },
            { id: 'upcoming', langKey: 'tv_home_block_upcoming', fallback: 'Скоро на экранах' },
            { id: 'popular_movie', langKey: 'tv_home_block_popular_movie', fallback: 'Популярные фильмы' },
            { id: 'popular_tv', langKey: 'tv_home_block_popular_tv', fallback: 'Популярные сериалы' }
        ];

        var BASE_BY_ID = {};
        for (var i = 0; i < BASE_BLOCKS.length; i++) {
            BASE_BY_ID[BASE_BLOCKS[i].id] = BASE_BLOCKS[i];
        }

        function hsBool(key, def) {
            var val = Lampa.Storage.get(HS_PREFIX + key, def);
            if (val === true || val === 'true') return true;
            if (val === false || val === 'false') return false;
            return !!def;
        }

        function isHomeEnabled() {
            return hsBool('enabled', true);
        }

        function isHeroCarouselEnabled() {
            return hsBool('hero_carousel', true);
        }

        function isBlockEnabled(blockId) {
            return hsBool('show_' + blockId, true);
        }

        function loadKnownDynamic() {
            var stored = null;
            try { stored = Lampa.Storage.get(KNOWN_KEY, null); } catch (e) {}
            return (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
        }

        function saveKnownDynamic(map) {
            try { Lampa.Storage.set(KNOWN_KEY, map); } catch (e) {}
        }

        function registerDiscoveredBlock(blockId, title) {
            if (!blockId || BASE_BY_ID[blockId]) return;
            var map = loadKnownDynamic();
            if (map[blockId] === title) return;
            map[blockId] = title || blockId;
            saveKnownDynamic(map);
        }

        function getAllKnownBlocks() {
            var list = [];
            var seen = {};
            var idx;
            for (idx = 0; idx < BASE_BLOCKS.length; idx++) {
                list.push({
                    id: BASE_BLOCKS[idx].id,
                    title: t(BASE_BLOCKS[idx].langKey, BASE_BLOCKS[idx].fallback)
                });
                seen[BASE_BLOCKS[idx].id] = true;
            }
            var dyn = loadKnownDynamic();
            var keys = Object.keys(dyn);
            for (idx = 0; idx < keys.length; idx++) {
                var k = keys[idx];
                if (!seen[k]) {
                    seen[k] = true;
                    list.push({ id: k, title: dyn[k] || k });
                }
            }
            return list;
        }

        function getBlockTitle(blockId) {
            if (BASE_BY_ID[blockId]) {
                return t(BASE_BY_ID[blockId].langKey, BASE_BY_ID[blockId].fallback);
            }
            var dyn = loadKnownDynamic();
            return dyn[blockId] || blockId;
        }

        function getOrder() {
            var all = getAllKnownBlocks();
            var allById = {};
            var idx;
            for (idx = 0; idx < all.length; idx++) allById[all[idx].id] = true;

            var raw = Lampa.Storage.get(HS_PREFIX + 'order', '');
            var parsed = [];
            if (Array.isArray(raw)) parsed = raw;
            else if (raw && typeof raw === 'string') parsed = raw.split(',');

            var result = [];
            var seen = {};
            for (idx = 0; idx < parsed.length; idx++) {
                var id = String(parsed[idx]).replace(/^\s+|\s+$/g, '');
                if (id && allById[id] && !seen[id]) {
                    seen[id] = true;
                    result.push(id);
                }
            }
            for (idx = 0; idx < all.length; idx++) {
                var bid = all[idx].id;
                if (!seen[bid]) {
                    seen[bid] = true;
                    result.push(bid);
                }
            }
            return result;
        }

        function saveOrder(orderIds) {
            Lampa.Storage.set(HS_PREFIX + 'order', orderIds.join(','));
            markHomeSettingsDirty();
        }

        function getRankMap() {
            var order = getOrder();
            var rank = {};
            for (var r = 0; r < order.length; r++) rank[order[r]] = r;
            return rank;
        }

        function normalizeStr(str) {
            return String(str || '').toLowerCase().replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        }

        function isNativeContinueRow(rowData) {
            if (!rowData) return false;
            var title = normalizeStr(rowData.title);
            var contTitle = normalizeStr(Lampa.Lang && Lampa.Lang.translate('title_continue'));
            var watchedTitle = normalizeStr(Lampa.Lang && Lampa.Lang.translate('title_watched'));
            if (title && (title === contTitle || title === watchedTitle || title === 'продолжить просмотр' || title === 'продовжити перегляд' || title === 'continue watching')) {
                return true;
            }
            return false;
        }

        function identifyApiRowBlockId(rowData) {
            if (!rowData) return '';
            var title = normalizeStr(rowData.title);
            var url = normalizeStr(rowData.url);

            function matchLang(key) {
                var val = Lampa.Lang ? normalizeStr(Lampa.Lang.translate(key)) : '';
                return val && title === val;
            }

            if (matchLang('title_now_watch') || url.indexOf('now_playing') >= 0) return 'now_watch';
            if (matchLang('title_latest') || url.indexOf('sort=latest') >= 0 && url.indexOf('uhd=true') < 0) return 'latest';
            if (matchLang('title_fire') || url.indexOf('top/fire') >= 0) return 'fire';
            if (matchLang('title_in_high_quality') || url.indexOf('uhd=true') >= 0) return 'high_quality';
            if (url.indexOf('top/hundred/movie') >= 0 || (title.indexOf('100') >= 0 && title.indexOf('фильм') >= 0)) return 'top_movies';
            if (url.indexOf('top/hundred/tv') >= 0 || (title.indexOf('100') >= 0 && title.indexOf('сериал') >= 0)) return 'top_tv';
            if (matchLang('title_trend_day') || url.indexOf('trending/movie/day') >= 0) return 'trend_day';
            if (matchLang('title_trend_week') || url.indexOf('trending/movie/week') >= 0) return 'trend_week';
            if (matchLang('title_upcoming') || url.indexOf('movie/upcoming') >= 0) return 'upcoming';
            if (matchLang('title_popular_movie') || url.indexOf('movie/popular') >= 0) return 'popular_movie';
            if (matchLang('title_popular_tv') || url.indexOf('trending/tv/week') >= 0 || url.indexOf('tv/popular') >= 0) return 'popular_tv';

            var slugSrc = title || url || 'row';
            var id = 'dyn_' + Lampa.Utils.hash(slugSrc);
            registerDiscoveredBlock(id, rowData.title || id);
            return id;
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

        function refreshSubsectionView(backIndex) {
            Lampa.Settings.create(SUB_COMPONENT, {
                onBack: function () {
                    Lampa.Settings.create(PLUGIN_ID, { last_index: backIndex });
                    $('.settings__title').text(t('tv_settings_title'));
                }
            });
            $('.settings__title').text(t('tv_home_title'));
        }

        function rebuildDynamicSettingsParams(backIndex) {
            try {
                if (Lampa.SettingsApi && typeof Lampa.SettingsApi.removeParams === 'function') {
                    Lampa.SettingsApi.removeParams(SUB_COMPONENT);
                }
            } catch (e) {}
            addSettingsParams(backIndex);
        }

        function openOrderEditor(backIndex) {
            var pickedIndex = -1;
            var activeIndex = 0;
            var modalBody = $('<div class="cs-order-editor"></div>');
            var hintEl = $('<div class="cs-order-hint"></div>');
            var listEl = $('<div class="cs-order-list"></div>');
            modalBody.append(hintEl).append(listEl);

            var modalOpen = false;
            var scrollBox = null;

            function syncFocusAndScroll(targetEl) {
                if (!targetEl) return;
                Lampa.Controller.collectionFocus(targetEl, modalBody);
                if (scrollBox && typeof scrollBox.update === 'function') {
                    scrollBox.update($(targetEl), true);
                }
            }

            function renderList() {
                var order = getOrder();
                if (activeIndex < 0) activeIndex = 0;
                if (activeIndex >= order.length) activeIndex = order.length - 1;

                hintEl.text(pickedIndex >= 0 ? t('tv_home_order_move_hint') : t('tv_home_order_pick_hint'));
                listEl.empty();

                var items = [];
                for (var idx = 0; idx < order.length; idx++) {
                    (function (i, bid) {
                        var enabled = isBlockEnabled(bid);
                        var isPicked = (i === pickedIndex);
                        var row = $('<div class="cs-order-item selector"></div>');
                        if (!enabled) row.addClass('is-hidden-sec');
                        if (isPicked) row.addClass('is-picked');

                        var arrows = isPicked ? '<span class="cs-order-arrows">▲▼</span>' : '';
                        var stateBadge = !enabled ? '<span class="cs-order-badge">' + t('card_sections_hidden_badge') + '</span>' : '';

                        row.html(
                            '<span class="cs-order-num">' + (i + 1) + '</span>' +
                            '<span class="cs-order-name"></span>' +
                            stateBadge + arrows
                        );
                        row.find('.cs-order-name').text(getBlockTitle(bid));

                        row.on('hover:focus', function () {
                            activeIndex = i;
                            if (scrollBox && typeof scrollBox.update === 'function') {
                                scrollBox.update(row, true);
                            }
                        });

                        row.on('hover:enter', function () {
                            if (pickedIndex === -1) {
                                pickedIndex = i;
                                activeIndex = i;
                                renderList();
                            } else {
                                pickedIndex = -1;
                                activeIndex = i;
                                renderList();
                            }
                        });

                        listEl.append(row);
                        items.push(row[0]);
                    })(idx, order[idx]);
                }

                if (modalOpen) {
                    Lampa.Controller.collectionSet(modalBody);
                    if (items[activeIndex]) syncFocusAndScroll(items[activeIndex]);
                }
            }

            function moveStep(delta) {
                var order = getOrder();
                if (!order.length) return;
                if (pickedIndex >= 0) {
                    var target = pickedIndex + delta;
                    if (target < 0 || target >= order.length) return;
                    moveInOrder(pickedIndex, target);
                    pickedIndex = target;
                    activeIndex = target;
                    renderList();
                } else {
                    var next = activeIndex + delta;
                    if (next < 0 || next >= order.length) return;
                    activeIndex = next;
                    var el = listEl.find('.cs-order-item').eq(activeIndex)[0];
                    if (el) syncFocusAndScroll(el);
                }
            }

            function closeEditor() {
                modalOpen = false;
                Lampa.Modal.close();
                Lampa.Controller.toggle('settings_component');
            }

            renderList();

            Lampa.Modal.open({
                title: t('tv_home_order_btn'),
                html: modalBody,
                size: 'medium',
                onBack: function () {
                    if (pickedIndex >= 0) {
                        pickedIndex = -1;
                        renderList();
                    } else {
                        closeEditor();
                    }
                }
            });

            modalOpen = true;
            scrollBox = modalBody.closest('.scroll').data('scroll') || null;

            Lampa.Controller.add('modal', {
                toggle: function () {
                    Lampa.Controller.collectionSet(modalBody);
                    var el = listEl.find('.cs-order-item').eq(activeIndex)[0];
                    if (el) syncFocusAndScroll(el);
                },
                up: function () { moveStep(-1); },
                down: function () { moveStep(1); },
                left: function () {
                    if (pickedIndex >= 0) {
                        pickedIndex = -1;
                        renderList();
                    }
                },
                right: function () {},
                back: function () {
                    if (pickedIndex >= 0) {
                        pickedIndex = -1;
                        renderList();
                    } else {
                        closeEditor();
                    }
                }
            });
            Lampa.Controller.toggle('modal');
        }

        function addSettingsParams(backIndex) {
            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: {
                    name: HS_PREFIX + 'enabled',
                    type: 'trigger',
                    'default': true
                },
                field: {
                    name: t('tv_home_enabled_title'),
                    description: t('tv_home_enabled_descr')
                },
                onChange: markHomeSettingsDirty
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: {
                    name: HS_PREFIX + 'hero_carousel',
                    type: 'trigger',
                    'default': true
                },
                field: {
                    name: t('tv_home_carousel_title'),
                    description: t('tv_home_carousel_descr')
                },
                onChange: markHomeSettingsDirty
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: {
                    name: HS_PREFIX + 'order_editor',
                    type: 'button'
                },
                field: {
                    name: t('tv_home_order_btn'),
                    description: t('tv_home_order_descr')
                },
                onChange: function () {
                    openOrderEditor(backIndex);
                }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: { type: 'title' },
                field: { name: t('tv_home_blocks_title') }
            });

            var order = getOrder();
            for (var idx = 0; idx < order.length; idx++) {
                (function (bid) {
                    Lampa.SettingsApi.addParam({
                        component: SUB_COMPONENT,
                        param: {
                            name: HS_PREFIX + 'show_' + bid,
                            type: 'trigger',
                            'default': true
                        },
                        field: {
                            name: getBlockTitle(bid)
                        },
                        onChange: markHomeSettingsDirty
                    });
                })(order[idx]);
            }

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: {
                    name: HS_PREFIX + 'show_all',
                    type: 'button'
                },
                field: { name: t('card_sections_show_all') },
                onChange: function () {
                    var all = getAllKnownBlocks();
                    for (var i = 0; i < all.length; i++) {
                        Lampa.Storage.set(HS_PREFIX + 'show_' + all[i].id, true);
                    }
                    markHomeSettingsDirty();
                    refreshSubsectionView(backIndex);
                }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: {
                    name: HS_PREFIX + 'hide_all',
                    type: 'button'
                },
                field: { name: t('card_sections_hide_all') },
                onChange: function () {
                    var all = getAllKnownBlocks();
                    for (var i = 0; i < all.length; i++) {
                        Lampa.Storage.set(HS_PREFIX + 'show_' + all[i].id, false);
                    }
                    markHomeSettingsDirty();
                    refreshSubsectionView(backIndex);
                }
            });

            Lampa.SettingsApi.addParam({
                component: SUB_COMPONENT,
                param: {
                    name: HS_PREFIX + 'reset_order',
                    type: 'button'
                },
                field: { name: t('card_sections_reset_order') },
                onChange: function () {
                    Lampa.Storage.set(HS_PREFIX + 'order', '');
                    markHomeSettingsDirty();
                    refreshSubsectionView(backIndex);
                }
            });
        }

        return {
            SUB_COMPONENT: SUB_COMPONENT,
            isHomeEnabled: isHomeEnabled,
            isHeroCarouselEnabled: isHeroCarouselEnabled,
            isBlockEnabled: isBlockEnabled,
            getOrder: getOrder,
            getRankMap: getRankMap,
            getBlockTitle: getBlockTitle,
            isNativeContinueRow: isNativeContinueRow,
            identifyApiRowBlockId: identifyApiRowBlockId,
            registerDiscoveredBlock: registerDiscoveredBlock,
            rebuildDynamicSettingsParams: rebuildDynamicSettingsParams,
            addSettingsParams: addSettingsParams
        };
    })();

    /* ------------------------------------------------------------------ *
     * Netflix-стиль главного экрана (Figma 169:3460 / 169:3501 / 169:3542)
     * ------------------------------------------------------------------ */

    var HomeScreen = (function () {
        var origMainComponent = null;
        var initialized = false;

        function resolveImgUrl(path, size) {
            if (!path) return '';
            var p = String(path);
            if (p.indexOf('http://') === 0 || p.indexOf('https://') === 0) return p;
            if (p.charAt(0) !== '/') p = '/' + p;
            try {
                if (Lampa.TMDB && typeof Lampa.TMDB.image === 'function') {
                    return Lampa.TMDB.image('t/p/' + (size || 'w500') + p);
                }
                if (Lampa.Api && typeof Lampa.Api.img === 'function') {
                    return Lampa.Api.img(p, size || 'w500');
                }
            } catch (e) {}
            return 'https://image.tmdb.org/t/p/' + (size || 'w500') + p;
        }

        function getCardTitle(card) {
            if (!card) return '';
            return card.title || card.name || card.original_title || card.original_name || '';
        }

        function getCardYear(card) {
            if (!card) return '';
            var d = card.release_date || card.first_air_date || '';
            return d ? String(d).slice(0, 4) : '';
        }

        function getCardQualityBadge(card) {
            if (!card) return '';
            var q = card.release_quality || card.quality || '';
            if (!q) return '';
            q = String(q).toUpperCase().replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
            if (q.length > 8) q = q.slice(0, 8);
            return q;
        }

        function getCardEpisodeBadge(card) {
            if (!card || !isSerialMovie(card)) return '';
            var totalEp = parseInt(card.number_of_episodes, 10) || 0;
            var watchedCount = 0;
            try {
                if (Lampa.Timeline && typeof Lampa.Timeline.watched === 'function') {
                    watchedCount = parseInt(Lampa.Timeline.watched(card), 10) || 0;
                }
            } catch (e) {}
            if (watchedCount > 0 && totalEp > 0) {
                return watchedCount + '/' + totalEp + ' ' + t('tv_home_ep_short');
            }
            if (totalEp > 0) {
                return totalEp + ' ' + t('tv_home_ep_short');
            }
            if (watchedCount > 0) {
                return watchedCount + ' ' + t('tv_home_ep_short');
            }
            return '';
        }

        function getCardWatchPercent(card) {
            if (!card) return 0;
            try {
                if (!isSerialMovie(card)) {
                    var tl = Lampa.Timeline && typeof Lampa.Timeline.view === 'function'
                        ? Lampa.Timeline.view(makeMovieTimelineHash(card))
                        : null;
                    return tl && tl.percent > 0 ? Math.min(100, Math.round(tl.percent)) : 0;
                }
                if (Lampa.Timeline && typeof Lampa.Timeline.watched === 'function') {
                    var w = Lampa.Timeline.watched(card, true);
                    if (Array.isArray(w) && w.length) {
                        var last = w[w.length - 1];
                        if (last && last.view && last.view.percent > 0) {
                            return Math.min(100, Math.round(last.view.percent));
                        }
                    }
                }
            } catch (e) {}
            return 0;
        }

        function formatShortDate(dateStr) {
            if (!dateStr) return '';
            try {
                var d = Lampa.Utils && typeof Lampa.Utils.parseToDate === 'function'
                    ? Lampa.Utils.parseToDate(dateStr)
                    : new Date(dateStr);
                if (!d || isNaN(d.getTime())) return '';
                var monthsRu = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
                var monthsUk = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
                var monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                var lang = getTmdbLang();
                var mArr = lang === 'en' ? monthsEn : (lang === 'uk' ? monthsUk : monthsRu);
                return d.getDate() + ' ' + mArr[d.getMonth()];
            } catch (e) {
                return '';
            }
        }

        function formatHeroRuntime(card) {
            if (!card) return '';
            if (isSerialMovie(card)) {
                var seasons = parseInt(card.number_of_seasons, 10) || 0;
                if (seasons > 0) {
                    var lang = getTmdbLang();
                    if (lang === 'en') return seasons + (seasons === 1 ? ' season' : ' seasons');
                    var m10 = seasons % 10;
                    var m100 = seasons % 100;
                    if (m10 === 1 && m100 !== 11) return seasons + ' сезон';
                    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return seasons + ' сезона';
                    return seasons + ' сезонов';
                }
                return '';
            }
            var rt = parseInt(card.runtime, 10) || 0;
            if (rt <= 0) return '';
            var h = Math.floor(rt / 60);
            var m = rt % 60;
            var l = getTmdbLang();
            var hw = l === 'en' ? 'h' : (l === 'uk' ? 'год' : 'ч');
            var mw = l === 'en' ? 'm' : (l === 'uk' ? 'хв' : 'мин');
            if (h > 0 && m > 0) return h + ' ' + hw + ' ' + m + ' ' + mw;
            if (h > 0) return h + ' ' + hw;
            return m + ' ' + mw;
        }

        function openMovieCard(card) {
            if (!card) return;
            if (Lampa.Router && typeof Lampa.Router.call === 'function') {
                Lampa.Router.call('full', card);
                return;
            }
            Lampa.Activity.push({
                url: card.url || '',
                component: 'full',
                id: card.id,
                method: isSerialMovie(card) ? 'tv' : 'movie',
                card: card,
                source: card.source || Lampa.Storage.field('source')
            });
        }

        function openRowMore(rowData, sourceFallback) {
            if (!rowData) return;
            if (Lampa.Router && typeof Lampa.Router.call === 'function') {
                Lampa.Router.call('category_full', rowData);
                return;
            }
            Lampa.Activity.push({
                url: rowData.url || '',
                title: rowData.title || Lampa.Lang.translate('title_category'),
                component: 'category_full',
                genres: rowData.genres || '',
                keywords: rowData.keywords || '',
                companies: rowData.companies || '',
                query: rowData.query || '',
                filter: rowData.filter || '',
                source: rowData.source || sourceFallback || Lampa.Storage.field('source'),
                page: rowData.page || 1
            });
        }

        function collectNewEpisodes() {
            var list = [];
            try {
                if (Lampa.TimeTable && typeof Lampa.TimeTable.recently === 'function') {
                    var recent = Lampa.TimeTable.recently() || [];
                    for (var i = 0; i < recent.length && list.length < 18; i++) {
                        var r = recent[i];
                        if (!r || !r.card || !r.episode) continue;
                        list.push({
                            card: r.card,
                            episode: r.episode,
                            badge: 'S' + (r.episode.season_number || 1) + ' • E' + (r.episode.episode_number || 1),
                            dateText: formatShortDate(r.episode.air_date),
                            still_path: r.episode.still_path || ''
                        });
                    }
                }
            } catch (e) {}
            return list;
        }

        function toggleFavoriteMark(type, card) {
            if (!Lampa.Favorite || !card) return;
            try {
                if (typeof Lampa.Favorite.toggle === 'function') {
                    Lampa.Favorite.toggle(type, card);
                } else if (typeof Lampa.Favorite.add === 'function') {
                    Lampa.Favorite.add(type, card);
                }
            } catch (e) {}
        }

        function hasFavoriteMark(type, card) {
            if (!Lampa.Favorite || !card) return false;
            try {
                if (typeof Lampa.Favorite.check === 'function') {
                    var res = Lampa.Favorite.check(card);
                    return !!(res && res[type]);
                }
            } catch (e) {}
            return false;
        }

        function NetflixMainComponent(object) {
            var self = this;
            this.__is_tv_home = true;

            var destroyed = false;
            var paused = false;
            var built = false;
            var nextBatchFn = null;
            var loadingNext = false;

            var rows = [];
            var seenBlockIds = {};
            var activeRow = 0;
            var heroSeq = 0;
            var heroDebounceTimer = null;
            var carouselTimer = null;
            var carouselSlides = [];
            var carouselIdx = 0;
            var currentHeroCardId = null;
            var activeBgUrl = '';
            var activeDecodedImg = null;
            var bgTransitionSeq = 0;
            var tmdbNetwork = null;

            var $root = $(
                '<div class="tv-home">' +
                    '<div class="tv-home__bg">' +
                        '<img class="tv-home__bg-img" alt="" />' +
                        '<div class="tv-home__bg-grad-x"></div>' +
                        '<div class="tv-home__bg-grad-y"></div>' +
                    '</div>' +
                    '<div class="tv-home__viewport">' +
                        '<div class="tv-home__scroll">' +
                            '<div class="tv-home-hero">' +
                                '<div class="tv-home-hero__eyebrow hide">' +
                                    '<span class="tv-home-hero__top-pill hide"></span>' +
                                    '<span class="tv-home-hero__eyebrow-text"></span>' +
                                '</div>' +
                                '<div class="tv-home-hero__brand">' +
                                    '<div class="tv-home-hero__title"></div>' +
                                    '<img class="tv-home-hero__logo hide" alt="" />' +
                                '</div>' +
                                '<div class="tv-home-hero__meta"></div>' +
                                '<div class="tv-home-hero__desc"></div>' +
                            '</div>' +
                            '<div class="tv-home__rows"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );

            var $bgImg = $root.find('.tv-home__bg-img');
            var $scroll = $root.find('.tv-home__scroll');
            var $hero = $root.find('.tv-home-hero');
            var $eyebrow = $hero.find('.tv-home-hero__eyebrow');
            var $topPill = $hero.find('.tv-home-hero__top-pill');
            var $eyebrowText = $hero.find('.tv-home-hero__eyebrow-text');
            var $heroTitle = $hero.find('.tv-home-hero__title');
            var $heroLogo = $hero.find('.tv-home-hero__logo');
            var $heroMeta = $hero.find('.tv-home-hero__meta');
            var $heroDesc = $hero.find('.tv-home-hero__desc');
            var $rowsWrap = $root.find('.tv-home__rows');

            function stopCarousel() {
                if (carouselTimer) {
                    clearInterval(carouselTimer);
                    carouselTimer = null;
                }
            }

            function abortTmdbNet() {
                if (tmdbNetwork && typeof tmdbNetwork.clear === 'function') {
                    try { tmdbNetwork.clear(); } catch (e) {}
                }
            }

            function setHeroBackgroundSmooth(url, immediate) {
                if (!url || destroyed) return;
                if (url === activeBgUrl && $bgImg.hasClass('is-ready')) return;
                var mySeq = ++bgTransitionSeq;

                function applyDecoded(decodedImg) {
                    if (destroyed || mySeq !== bgTransitionSeq) return;
                    activeBgUrl = url;
                    activeDecodedImg = decodedImg || null;

                    var wasReady = $bgImg.hasClass('is-ready');
                    if (immediate || !wasReady) {
                        $bgImg.removeClass('is-fading');
                        $bgImg.attr('src', url);
                        requestAnimationFrame(function () {
                            if (destroyed || mySeq !== bgTransitionSeq) return;
                            $bgImg.addClass('is-ready');
                        });
                        return;
                    }

                    $bgImg.addClass('is-fading');
                    setTimeout(function () {
                        if (destroyed || mySeq !== bgTransitionSeq) return;
                        var el = $bgImg[0];
                        function reveal() {
                            if (destroyed || mySeq !== bgTransitionSeq) return;
                            requestAnimationFrame(function () {
                                requestAnimationFrame(function () {
                                    if (destroyed || mySeq !== bgTransitionSeq) return;
                                    $bgImg.removeClass('is-fading').addClass('is-ready');
                                });
                            });
                        }
                        if (el) {
                            el.onload = function () {
                                el.onload = null;
                                if (typeof el.decode === 'function') {
                                    el.decode().then(reveal, reveal);
                                } else {
                                    reveal();
                                }
                            };
                            el.src = url;
                            if (el.complete && el.naturalWidth > 0) {
                                el.onload = null;
                                reveal();
                            }
                        } else {
                            reveal();
                        }
                    }, 380);
                }

                preloadAndDecodeImage(url, applyDecoded, function () {});
            }

            function startCarousel(slides) {
                stopCarousel();
                carouselSlides = Array.isArray(slides) ? slides : [];
                carouselIdx = 0;
                if (!carouselSlides.length) return;

                setHeroBackgroundSmooth(carouselSlides[0], !activeBgUrl);

                if (!HomeSections.isHeroCarouselEnabled() || carouselSlides.length <= 1 || activeRow !== 0 || paused || destroyed) {
                    return;
                }

                carouselTimer = setInterval(function () {
                    if (destroyed || paused || activeRow !== 0 || carouselSlides.length <= 1) {
                        stopCarousel();
                        return;
                    }
                    carouselIdx = (carouselIdx + 1) % carouselSlides.length;
                    setHeroBackgroundSmooth(carouselSlides[carouselIdx], false);
                }, TMDB_BACKDROP_ROTATE_MS);
            }

            function showHeroLogo(logoUrl) {
                if (!logoUrl || destroyed) return;
                var mySeq = heroSeq;
                preloadAndDecodeImage(logoUrl, function () {
                    if (destroyed || mySeq !== heroSeq) return;
                    $heroLogo.attr('src', logoUrl).removeClass('hide');
                    requestAnimationFrame(function () {
                        if (destroyed || mySeq !== heroSeq) return;
                        $heroLogo.addClass('is-visible');
                        $heroTitle.addClass('is-hidden');
                    });
                }, function () {});
            }

            function resetHeroBrandToTitle(titleText) {
                $heroTitle.text(titleText || '').removeClass('is-hidden');
                $heroLogo.removeClass('is-visible').addClass('hide').attr('src', '');
            }

            function applyCachedOrFetchedTmdbMedia(card, mySeq) {
                if (!card || !card.id || destroyed || mySeq !== heroSeq) return;
                var cached = getCachedTmdbImages(card);
                if (cached) {
                    if (cached.logo && getBoolSetting('tv_show_logo', true)) {
                        showHeroLogo(Lampa.TMDB.image('t/p/w500' + cached.logo));
                    }
                    var cachedSlides = buildBackdropSlides(card, cached.backdrops, $root);
                    if (cachedSlides.length) startCarousel(cachedSlides);
                    return;
                }

                if (typeof Lampa.TMDB === 'undefined' || typeof Lampa.TMDB.api !== 'function') return;
                abortTmdbNet();
                if (!tmdbNetwork) tmdbNetwork = new Lampa.Reguest();
                var method = isSerialMovie(card) ? 'tv' : 'movie';
                var url = Lampa.TMDB.api(method + '/' + card.id + '/images?api_key=' + Lampa.TMDB.key() + '&include_image_language=' + getTmdbLang() + ',en,ru,null');
                tmdbNetwork.silent(url, function (data) {
                    if (destroyed || mySeq !== heroSeq) return;
                    var bestLogo = pickBestLogo(card, data && data.logos);
                    setCachedTmdbImages(card, data && data.backdrops, bestLogo);

                    if (bestLogo && getBoolSetting('tv_show_logo', true)) {
                        showHeroLogo(Lampa.TMDB.image('t/p/w500' + bestLogo));
                    }
                    var slides = buildBackdropSlides(card, data && data.backdrops, $root);
                    if (slides.length) startCarousel(slides);
                }, function () {});
            }

            function updateHeroForCard(card, cardIndex) {
                if (!card || destroyed) return;
                var cardKeyStr = (isSerialMovie(card) ? 'tv_' : 'mv_') + card.id;
                if (cardKeyStr === currentHeroCardId && $heroTitle.text()) return;
                currentHeroCardId = cardKeyStr;

                var mySeq = ++heroSeq;
                if (heroDebounceTimer) {
                    clearTimeout(heroDebounceTimer);
                    heroDebounceTimer = null;
                }
                stopCarousel();

                // 1. Eyebrow (ТОП-10 + жанры)
                var genres = ImdbCardRatings.getCardGenres(card, 3);
                var rankNum = (typeof cardIndex === 'number' && cardIndex >= 0 && cardIndex < 10) ? (cardIndex + 1) : 0;
                var eyebrowParts = [];
                if (rankNum > 0) {
                    $topPill.text(t('tv_home_top10_badge')).removeClass('hide');
                    eyebrowParts.push('№' + rankNum + ' ' + t('tv_home_top_today'));
                } else {
                    $topPill.addClass('hide');
                }
                for (var g = 0; g < genres.length; g++) eyebrowParts.push(genres[g]);
                if (eyebrowParts.length) {
                    $eyebrowText.text(eyebrowParts.join(' • '));
                    $eyebrow.removeClass('hide');
                } else {
                    $eyebrow.addClass('hide');
                }

                // 2. Название / кэшированный логотип
                resetHeroBrandToTitle(getCardTitle(card));

                // 3. Мета-строка (IMDb • 8.6, год, хронометраж/сезоны, PG, качество)
                var metaHtml = '';
                var ratingInfo = ImdbCardRatings.getRating(card);
                if (ratingInfo.score) {
                    metaHtml += '<span class="tv-home-hero__chip tv-home-hero__chip--rate">' +
                        escapeHtml(ratingInfo.source) + ' • ' + escapeHtml(ratingInfo.score) +
                        '</span>';
                }
                var yr = getCardYear(card);
                if (yr) {
                    metaHtml += '<span class="tv-home-hero__year">' + escapeHtml(yr) + '</span>';
                }
                var rt = formatHeroRuntime(card);
                if (rt) {
                    metaHtml += '<span class="tv-home-hero__dot">•</span><span class="tv-home-hero__runtime">' + escapeHtml(rt) + '</span>';
                }
                if (card.pg) {
                    metaHtml += '<span class="tv-home-hero__chip">' + escapeHtml(String(card.pg)) + '</span>';
                }
                var qual = getCardQualityBadge(card);
                if (qual) {
                    metaHtml += '<span class="tv-home-hero__chip">' + escapeHtml(qual) + '</span>';
                }
                $heroMeta.html(metaHtml);

                // 4. Описание (3 строки)
                $heroDesc.text(card.overview || '');

                // 5. Немедленный задник из карточки + дебаунс на TMDB /images (логотип + карусель)
                var cached = getCachedTmdbImages(card);
                if (cached) {
                    applyCachedOrFetchedTmdbMedia(card, mySeq);
                } else {
                    if (card.backdrop_path) {
                        var fallbackBg = resolveImgUrl(card.backdrop_path, getRequiredBackdropSize($root));
                        setHeroBackgroundSmooth(fallbackBg, !activeBgUrl);
                    }
                    heroDebounceTimer = setTimeout(function () {
                        heroDebounceTimer = null;
                        applyCachedOrFetchedTmdbMedia(card, mySeq);
                    }, 180);
                }
            }

            function updateHorizontalScroll(rowObj) {
                if (!rowObj || !rowObj.$track || !rowObj.elements.length) return;
                var idx = rowObj.activeCardIdx;
                if (idx < 0) idx = 0;
                if (idx >= rowObj.elements.length) idx = rowObj.elements.length - 1;
                var cardEl = rowObj.elements[idx];
                if (!cardEl) return;

                var viewportW = rowObj.$viewport ? rowObj.$viewport[0].clientWidth : window.innerWidth;
                var trackW = rowObj.$track[0].scrollWidth;
                var maxX = Math.max(0, trackW - viewportW);
                var targetX = Math.max(0, cardEl.offsetLeft - 8);
                if (targetX > maxX) targetX = maxX;
                rowObj.$track.css({
                    '-webkit-transform': 'translate3d(' + (-Math.round(targetX)) + 'px, 0, 0)',
                    'transform': 'translate3d(' + (-Math.round(targetX)) + 'px, 0, 0)'
                });
            }

            function updateVerticalScroll() {
                if (!rows.length) return;
                var isFirst = (activeRow === 0);
                $root.toggleClass('tv-home--scrolled', !isFirst);

                if (isFirst) {
                    $scroll.css({
                        '-webkit-transform': 'translate3d(0, 0, 0)',
                        'transform': 'translate3d(0, 0, 0)'
                    });
                    if (!carouselTimer && carouselSlides.length > 1 && HomeSections.isHeroCarouselEnabled() && !paused && !destroyed) {
                        startCarousel(carouselSlides);
                    }
                    return;
                }

                stopCarousel();
                var rowObj = rows[activeRow];
                if (!rowObj || !rowObj.$el || !rowObj.$el[0]) return;

                var headOffset = Math.round((parseFloat($('body').css('font-size')) || 16) * 4.8);
                var rowTop = rowObj.$el[0].offsetTop;
                var targetY = Math.max(0, rowTop - headOffset);
                $scroll.css({
                    '-webkit-transform': 'translate3d(0, ' + (-Math.round(targetY)) + 'px, 0)',
                    'transform': 'translate3d(0, ' + (-Math.round(targetY)) + 'px, 0)'
                });
            }

            function openCardContextMenu(rowObj, card, cwItem, cardEl) {
                if (!card) return;
                var menu = [];

                if (cwItem) {
                    menu.push({
                        title: t('tv_home_mark_watched'),
                        subtitle: t('tv_home_mark_watched_sub'),
                        __tv_mark_watched_action: true,
                        onSelect: function () {
                            ContinueWatching.markAsWatched(cwItem);
                            removeContinueCard(rowObj, cardEl);
                            Lampa.Noty.show(t('tv_home_marked_watched_noty'));
                        }
                    });
                }

                menu.push({
                    title: t('tv_home_open_card'),
                    onSelect: function () {
                        openMovieCard(card);
                    }
                });

                var marks = [
                    { type: 'book', label: Lampa.Lang.translate('title_book') || 'Закладки' },
                    { type: 'wath', label: Lampa.Lang.translate('title_wath') || 'Позже' },
                    { type: 'like', label: Lampa.Lang.translate('title_like') || 'Нравится' }
                ];
                for (var m = 0; m < marks.length; m++) {
                    (function (mk) {
                        var active = hasFavoriteMark(mk.type, card);
                        menu.push({
                            title: mk.label,
                            subtitle: active ? '✓' : '',
                            onSelect: function () {
                                toggleFavoriteMark(mk.type, card);
                            }
                        });
                    })(marks[m]);
                }

                // Плагины с контекстным меню (например, Filmix)
                try {
                    if (Lampa.Manifest && Array.isArray(Lampa.Manifest.plugins)) {
                        for (var p = 0; p < Lampa.Manifest.plugins.length; p++) {
                            var pl = Lampa.Manifest.plugins[p];
                            if (pl && pl.type === 'video' && typeof pl.onContextMenu === 'function' && typeof pl.onContextLauch === 'function') {
                                (function (plugin) {
                                    var meta = plugin.onContextMenu(card) || {};
                                    menu.push({
                                        title: meta.name || plugin.name || 'Plugin',
                                        subtitle: meta.description || '',
                                        onSelect: function () {
                                            plugin.onContextLauch(card);
                                        }
                                    });
                                })(pl);
                            }
                        }
                    }
                } catch (e) {}

                var prevCtrl = Lampa.Controller.enabled() ? Lampa.Controller.enabled().name : 'content';

                Lampa.Select.show({
                    title: Lampa.Lang.translate('title_action') || 'Действие',
                    items: menu,
                    onBack: function () {
                        Lampa.Controller.toggle(prevCtrl);
                    },
                    onBeforeClose: function () {
                        Lampa.Controller.toggle(prevCtrl);
                        return true;
                    }
                });
            }

            function removeContinueCard(rowObj, cardEl) {
                if (!rowObj || !cardEl) return;
                var idx = rowObj.elements.indexOf(cardEl);
                if (idx === -1) return;

                rowObj.elements.splice(idx, 1);
                if (rowObj.items && rowObj.items.length > idx) {
                    rowObj.items.splice(idx, 1);
                }
                $(cardEl).remove();

                if (!rowObj.elements.length) {
                    // Вся строка «Продолжить просмотр» стала пустой — удаляем строку и переводим фокус
                    var rIdx = rows.indexOf(rowObj);
                    if (rIdx >= 0) {
                        rowObj.$el.remove();
                        rows.splice(rIdx, 1);
                        if (rows.length) {
                            var nextRow = Math.min(rIdx, rows.length - 1);
                            focusRowCard(nextRow, rows[nextRow].activeCardIdx || 0);
                        }
                    }
                    return;
                }

                // Обновляем счётчик в заголовке и смещаем фокус на соседнюю карточку
                if (rowObj.$sub) {
                    rowObj.$sub.text(ContinueWatching.formatCountSubtitle(rowObj.elements.length));
                }
                var nextIdx = Math.min(idx, rowObj.elements.length - 1);
                rowObj.activeCardIdx = nextIdx;
                var curRowIdx = rows.indexOf(rowObj);
                if (curRowIdx >= 0) {
                    focusRowCard(curRowIdx, nextIdx);
                }
            }

            function bindCardEvents($card, rowObj, card, cardIdx, cwItem, onEnterFn) {
                var dom = $card[0];
                $card.on('hover:focus', function () {
                    var rIdx = rows.indexOf(rowObj);
                    if (rIdx >= 0) activeRow = rIdx;
                    var cIdx = rowObj.elements.indexOf(dom);
                    if (cIdx >= 0) rowObj.activeCardIdx = cIdx;

                    updateHorizontalScroll(rowObj);
                    updateVerticalScroll();

                    if (activeRow === 0 && card) {
                        updateHeroForCard(card, cIdx >= 0 ? cIdx : cardIdx);
                    }

                    if (activeRow >= rows.length - 2) {
                        maybeLoadNextBatch();
                    }
                });

                $card.on('hover:enter', function () {
                    if (typeof onEnterFn === 'function') onEnterFn();
                    else if (card) openMovieCard(card);
                });

                $card.on('hover:long', function () {
                    if (card) openCardContextMenu(rowObj, card, cwItem || null, dom);
                });

                $card.on('contextmenu', function (ev) {
                    if (ev && ev.preventDefault) ev.preventDefault();
                    if (card) openCardContextMenu(rowObj, card, cwItem || null, dom);
                });
            }

            function createPosterCard(card, rowObj, cardIdx) {
                var posterUrl = resolveImgUrl(card.poster_path || card.img, 'w342');
                var ratingInfo = ImdbCardRatings.getRating(card);
                var quality = getCardQualityBadge(card);
                var epBadge = getCardEpisodeBadge(card);
                var watchPct = getCardWatchPercent(card);
                var title = getCardTitle(card);
                var year = getCardYear(card);
                var genres = ImdbCardRatings.getCardGenres(card, 1);
                var metaText = year && genres.length ? (year + ' • ' + genres[0]) : (year || (genres[0] || ''));

                var $card = $(
                    '<div class="tv-home-card selector">' +
                        '<div class="tv-home-card__box">' +
                            '<img class="tv-home-card__img" loading="lazy" alt="" />' +
                            '<div class="tv-home-card__top-left"></div>' +
                            (ratingInfo.score ? '<div class="tv-home-card__rating">' + escapeHtml(ratingInfo.score) + '</div>' : '') +
                            (watchPct > 0 ? '<div class="tv-home-card__progress"><div class="tv-home-card__progress-bar" style="width:' + watchPct + '%"></div></div>' : '') +
                        '</div>' +
                        '<div class="tv-home-card__title"></div>' +
                        (metaText ? '<div class="tv-home-card__meta"></div>' : '') +
                    '</div>'
                );

                var $tl = $card.find('.tv-home-card__top-left');
                if (quality) $tl.append('<div class="tv-home-card__badge">' + escapeHtml(quality) + '</div>');
                if (epBadge) $tl.append('<div class="tv-home-card__badge">' + escapeHtml(epBadge) + '</div>');

                var $img = $card.find('.tv-home-card__img');
                if (posterUrl) {
                    $img.on('load', function () { $img.addClass('is-loaded'); });
                    $img.attr('src', posterUrl);
                }
                $card.find('.tv-home-card__title').text(title);
                if (metaText) $card.find('.tv-home-card__meta').text(metaText);

                bindCardEvents($card, rowObj, card, cardIdx, null, function () {
                    openMovieCard(card);
                });

                return $card;
            }

            function createContinueCard(cwItem, rowObj, cardIdx) {
                var card = cwItem.card;
                var imgPath = cwItem.still_path || card.backdrop_path || card.poster_path;
                var imgUrl = resolveImgUrl(imgPath, 'w500');
                var pct = Math.max(2, Math.min(80, cwItem.percent || 0));

                var $card = $(
                    '<div class="tv-home-wide selector">' +
                        '<div class="tv-home-wide__box">' +
                            '<img class="tv-home-wide__img" loading="lazy" alt="" />' +
                            '<div class="tv-home-wide__vignette"></div>' +
                            (cwItem.badge ? '<div class="tv-home-wide__badge">' + escapeHtml(cwItem.badge) + '</div>' : '') +
                            '<div class="tv-home-wide__progress">' +
                                '<div class="tv-home-wide__progress-bar" style="width:' + pct + '%"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="tv-home-wide__title"></div>' +
                        '<div class="tv-home-wide__sub"></div>' +
                    '</div>'
                );

                var $img = $card.find('.tv-home-wide__img');
                if (imgUrl) {
                    $img.on('load', function () { $img.addClass('is-loaded'); });
                    $img.attr('src', imgUrl);
                }
                $card.find('.tv-home-wide__title').text(getCardTitle(card));
                $card.find('.tv-home-wide__sub').text(cwItem.subtitle || '');

                bindCardEvents($card, rowObj, card, cardIdx, cwItem, function () {
                    openMovieCard(card);
                });

                return $card;
            }

            function createNewEpisodeCard(epItem, rowObj, cardIdx) {
                var card = epItem.card;
                var imgPath = epItem.still_path || card.backdrop_path || card.poster_path;
                var imgUrl = resolveImgUrl(imgPath, 'w500');

                var $card = $(
                    '<div class="tv-home-wide tv-home-wide--ep selector">' +
                        '<div class="tv-home-wide__box">' +
                            '<img class="tv-home-wide__img" loading="lazy" alt="" />' +
                            '<div class="tv-home-wide__vignette"></div>' +
                            (epItem.badge ? '<div class="tv-home-wide__badge">' + escapeHtml(epItem.badge) + '</div>' : '') +
                            (epItem.dateText ? '<div class="tv-home-wide__date">' + escapeHtml(epItem.dateText) + '</div>' : '') +
                        '</div>' +
                        '<div class="tv-home-wide__title"></div>' +
                    '</div>'
                );

                var $img = $card.find('.tv-home-wide__img');
                if (imgUrl) {
                    $img.on('load', function () { $img.addClass('is-loaded'); });
                    $img.attr('src', imgUrl);
                }
                $card.find('.tv-home-wide__title').text(getCardTitle(card));

                bindCardEvents($card, rowObj, card, cardIdx, null, function () {
                    openMovieCard(card);
                });

                return $card;
            }

            function createMoreTile(rowObj, isWide, onMoreFn) {
                var moreText = (Lampa.Lang && Lampa.Lang.translate('more')) || t('tv_home_more_action');
                var $tile = $(
                    '<div class="card-more tv-home-more selector' + (isWide ? ' tv-home-more--wide' : '') + '">' +
                        '<div class="card-more__box tv-home-more__box">' +
                            '<div class="card-more__title tv-home-more__title"></div>' +
                        '</div>' +
                    '</div>'
                );
                $tile.find('.tv-home-more__title').text(moreText);
                var dom = $tile[0];
                $tile.on('hover:focus', function () {
                    var rIdx = rows.indexOf(rowObj);
                    if (rIdx >= 0) activeRow = rIdx;
                    var cIdx = rowObj.elements.indexOf(dom);
                    if (cIdx >= 0) rowObj.activeCardIdx = cIdx;
                    updateHorizontalScroll(rowObj);
                    updateVerticalScroll();
                });
                $tile.on('hover:enter', function () {
                    if (typeof onMoreFn === 'function') onMoreFn();
                });
                return $tile;
            }

            function buildRowObject(spec, isFirstRow) {
                var $row = $(
                    '<div class="tv-home-row' + (isFirstRow ? ' tv-home-row--first' : '') + '" data-block-id="' + escapeHtml(spec.id) + '">' +
                        '<div class="tv-home-row__head' + (isFirstRow ? ' hide' : '') + '">' +
                            '<div class="tv-home-row__title"></div>' +
                            '<div class="tv-home-row__sub"></div>' +
                        '</div>' +
                        '<div class="tv-home-row__viewport">' +
                            '<div class="tv-home-row__track"></div>' +
                        '</div>' +
                    '</div>'
                );

                var $title = $row.find('.tv-home-row__title');
                var $sub = $row.find('.tv-home-row__sub');
                var $viewport = $row.find('.tv-home-row__viewport');
                var $track = $row.find('.tv-home-row__track');

                $title.text(spec.title || '');
                if (spec.subtitle) $sub.text(spec.subtitle);

                var rowObj = {
                    id: spec.id,
                    type: spec.type,
                    title: spec.title || '',
                    data: spec.data || null,
                    items: spec.items || [],
                    $el: $row,
                    $sub: $sub,
                    $viewport: $viewport,
                    $track: $track,
                    elements: [],
                    activeCardIdx: 0,
                    onMore: spec.onMore || null
                };

                if (typeof spec.onMore === 'function') {
                    $row.data('tv_more_fn', spec.onMore);
                }

                var i, $c;
                if (spec.type === 'continue') {
                    for (i = 0; i < spec.items.length; i++) {
                        $c = createContinueCard(spec.items[i], rowObj, i);
                        $track.append($c);
                        rowObj.elements.push($c[0]);
                    }
                } else if (spec.type === 'new_episodes') {
                    for (i = 0; i < spec.items.length; i++) {
                        $c = createNewEpisodeCard(spec.items[i], rowObj, i);
                        $track.append($c);
                        rowObj.elements.push($c[0]);
                    }
                } else {
                    var cards = spec.items || [];
                    var maxCards = Math.min(cards.length, 24);
                    for (i = 0; i < maxCards; i++) {
                        $c = createPosterCard(cards[i], rowObj, i);
                        $track.append($c);
                        rowObj.elements.push($c[0]);
                    }
                    if (typeof spec.onMore === 'function') {
                        var $more = createMoreTile(rowObj, false, spec.onMore);
                        $track.append($more);
                        rowObj.elements.push($more[0]);
                    }
                }

                return rowObj;
            }

            function focusRowCard(rowIdx, cardIdx) {
                if (!rows.length || destroyed) return;
                if (rowIdx < 0) rowIdx = 0;
                if (rowIdx >= rows.length) rowIdx = rows.length - 1;
                var rowObj = rows[rowIdx];
                if (!rowObj || !rowObj.elements.length) return;

                if (cardIdx < 0) cardIdx = 0;
                if (cardIdx >= rowObj.elements.length) cardIdx = rowObj.elements.length - 1;

                activeRow = rowIdx;
                rowObj.activeCardIdx = cardIdx;
                var targetEl = rowObj.elements[cardIdx];

                Lampa.Controller.collectionSet(rowObj.$track);
                Lampa.Controller.collectionFocus(targetEl, rowObj.$track);

                updateHorizontalScroll(rowObj);
                updateVerticalScroll();

                if (activeRow === 0) {
                    var heroItem = rowObj.items && rowObj.items[cardIdx];
                    var heroCard = heroItem && heroItem.card ? heroItem.card : heroItem;
                    if (heroCard) updateHeroForCard(heroCard, cardIdx);
                }

                if (activeRow >= rows.length - 2) {
                    maybeLoadNextBatch();
                }
            }

            function appendSpecsOrdered(specs) {
                if (!specs || !specs.length) return;
                var rank = HomeSections.getRankMap();
                var fallbackBase = 1000;

                var filtered = [];
                for (var i = 0; i < specs.length; i++) {
                    var sp = specs[i];
                    if (!sp || !sp.id || !sp.items || !sp.items.length) continue;
                    if (seenBlockIds[sp.id]) continue;
                    if (!HomeSections.isBlockEnabled(sp.id)) continue;
                    seenBlockIds[sp.id] = true;
                    filtered.push({
                        spec: sp,
                        rank: typeof rank[sp.id] === 'number' ? rank[sp.id] : (fallbackBase + i),
                        seq: i
                    });
                }

                filtered.sort(function (a, b) {
                    if (a.rank !== b.rank) return a.rank - b.rank;
                    return a.seq - b.seq;
                });

                for (var k = 0; k < filtered.length; k++) {
                    var isFirst = (rows.length === 0);
                    var rowObj = buildRowObject(filtered[k].spec, isFirst);
                    if (rowObj.elements.length) {
                        rows.push(rowObj);
                        $rowsWrap.append(rowObj.$el);
                    }
                }
            }

            function buildApiSpecs(apiRows) {
                var specs = [];
                if (!Array.isArray(apiRows)) return specs;
                for (var i = 0; i < apiRows.length; i++) {
                    var r = apiRows[i];
                    if (!r || !Array.isArray(r.results) || !r.results.length) continue;
                    if (HomeSections.isNativeContinueRow(r)) continue;

                    var blockId = HomeSections.identifyApiRowBlockId(r);
                    var hasMore = (parseInt(r.total_pages, 10) > 1) || !!r.url;
                    (function (rowData, bId, canMore) {
                        specs.push({
                            id: bId,
                            type: 'poster',
                            title: rowData.title || HomeSections.getBlockTitle(bId),
                            subtitle: '',
                            items: rowData.results,
                            data: rowData,
                            onMore: canMore ? function () {
                                openRowMore(rowData, object && object.source);
                            } : null
                        });
                    })(r, blockId, hasMore);
                }
                return specs;
            }

            function maybeLoadNextBatch() {
                if (destroyed || loadingNext || typeof nextBatchFn !== 'function') return;
                loadingNext = true;
                try {
                    nextBatchFn(function (moreData) {
                        loadingNext = false;
                        if (destroyed) return;
                        var moreSpecs = buildApiSpecs(moreData);
                        if (moreSpecs.length) {
                            appendSpecsOrdered(moreSpecs);
                        }
                    }, function () {
                        loadingNext = false;
                        nextBatchFn = null;
                    });
                } catch (e) {
                    loadingNext = false;
                }
            }

            function refreshContinueRowLive() {
                if (destroyed || !built) return;
                if (!HomeSections.isBlockEnabled('continue_watching')) return;

                var existingIdx = -1;
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].id === 'continue_watching') {
                        existingIdx = i;
                        break;
                    }
                }

                var freshItems = ContinueWatching.collectItems();
                if (!freshItems.length) {
                    if (existingIdx >= 0) {
                        rows[existingIdx].$el.remove();
                        rows.splice(existingIdx, 1);
                        if (activeRow >= rows.length) activeRow = Math.max(0, rows.length - 1);
                    }
                    return;
                }

                var newSpec = {
                    id: 'continue_watching',
                    type: 'continue',
                    title: t('tv_home_continue_title'),
                    subtitle: ContinueWatching.formatCountSubtitle(freshItems.length),
                    items: freshItems
                };

                if (existingIdx >= 0) {
                    var oldRow = rows[existingIdx];
                    var isFirst = (existingIdx === 0);
                    var rebuilt = buildRowObject(newSpec, isFirst);
                    rebuilt.activeCardIdx = Math.min(oldRow.activeCardIdx, Math.max(0, rebuilt.elements.length - 1));
                    oldRow.$el.replaceWith(rebuilt.$el);
                    rows[existingIdx] = rebuilt;
                }
            }

            function buildInitial(apiData) {
                if (destroyed) return;
                built = true;

                var initialSpecs = buildApiSpecs(apiData);

                var cwItems = ContinueWatching.collectItems();
                if (cwItems.length) {
                    initialSpecs.push({
                        id: 'continue_watching',
                        type: 'continue',
                        title: t('tv_home_continue_title'),
                        subtitle: ContinueWatching.formatCountSubtitle(cwItems.length),
                        items: cwItems
                    });
                }

                var epItems = collectNewEpisodes();
                if (epItems.length) {
                    initialSpecs.push({
                        id: 'new_episodes',
                        type: 'new_episodes',
                        title: t('tv_home_new_episodes_title'),
                        subtitle: t('tv_home_new_episodes_sub'),
                        items: epItems
                    });
                }

                appendSpecsOrdered(initialSpecs);

                if (!rows.length && initialSpecs.length) {
                    // Если пользователь скрыл все блоки — аккуратно покажем пустое состояние
                    $rowsWrap.append('<div class="tv-home__empty">' + escapeHtml(Lampa.Lang.translate('empty_title') || 'Нет отображаемых блоков') + '</div>');
                }

                if (self.activity) {
                    self.activity.loader(false);
                    self.activity.toggle();
                }

                if (rows.length) {
                    var firstItem = rows[0].items && rows[0].items[0];
                    var firstCard = firstItem && firstItem.card ? firstItem.card : firstItem;
                    if (firstCard) updateHeroForCard(firstCard, 0);
                    setTimeout(function () {
                        if (!destroyed && !paused) focusRowCard(0, 0);
                    }, 30);
                }
            }

            function onWheelHandler(ev) {
                if (destroyed || paused || !rows.length) return;
                if (Lampa.Select && typeof Lampa.Select.opened === 'function' && Lampa.Select.opened()) return;
                var dy = ev.deltaY || (ev.originalEvent && ev.originalEvent.deltaY) || 0;
                if (Math.abs(dy) < 10) return;
                if (dy > 0) {
                    if (activeRow < rows.length - 1) focusRowCard(activeRow + 1, rows[activeRow + 1].activeCardIdx || 0);
                } else {
                    if (activeRow > 0) focusRowCard(activeRow - 1, rows[activeRow - 1].activeCardIdx || 0);
                }
            }

            this.create = function () {
                if (self.activity) self.activity.loader(true);
                $root.on('wheel', onWheelHandler);

                var nextCall = Lampa.Api.main(object || {}, function (data) {
                    buildInitial(data);
                }, function () {
                    if (destroyed) return;
                    if (self.activity) {
                        self.activity.loader(false);
                        self.activity.toggle();
                    }
                    $rowsWrap.append('<div class="tv-home__empty">' + escapeHtml(Lampa.Lang.translate('empty_title') || 'Пусто') + '</div>');
                });

                if (typeof nextCall === 'function') nextBatchFn = nextCall;
            };

            this.start = function () {
                paused = false;
                $('body').addClass('tv-home-active');

                if (built) {
                    refreshContinueRowLive();
                }

                Lampa.Controller.add('content', {
                    toggle: function () {
                        if (rows.length) {
                            var r = Math.min(activeRow, rows.length - 1);
                            var c = Math.min(rows[r].activeCardIdx || 0, Math.max(0, rows[r].elements.length - 1));
                            focusRowCard(r, c);
                        } else {
                            Lampa.Controller.collectionSet($root);
                        }
                    },
                    left: function () {
                        if (!rows.length) {
                            Lampa.Controller.toggle('menu');
                            return;
                        }
                        var rowObj = rows[activeRow];
                        if (rowObj && rowObj.activeCardIdx > 0) {
                            focusRowCard(activeRow, rowObj.activeCardIdx - 1);
                        } else {
                            Lampa.Controller.toggle('menu');
                        }
                    },
                    right: function () {
                        if (!rows.length) return;
                        var rowObj = rows[activeRow];
                        if (rowObj && rowObj.activeCardIdx < rowObj.elements.length - 1) {
                            focusRowCard(activeRow, rowObj.activeCardIdx + 1);
                        }
                    },
                    up: function () {
                        if (activeRow > 0) {
                            var targetRow = activeRow - 1;
                            focusRowCard(targetRow, rows[targetRow].activeCardIdx || 0);
                        } else {
                            Lampa.Controller.toggle('head');
                        }
                    },
                    down: function () {
                        if (activeRow < rows.length - 1) {
                            var targetRow = activeRow + 1;
                            focusRowCard(targetRow, rows[targetRow].activeCardIdx || 0);
                        } else {
                            maybeLoadNextBatch();
                        }
                    },
                    back: function () {
                        if (activeRow > 0) {
                            focusRowCard(0, rows[0].activeCardIdx || 0);
                        } else {
                            Lampa.Controller.toggle('menu');
                        }
                    }
                });

                Lampa.Controller.toggle('content');
            };

            this.pause = function () {
                paused = true;
                stopCarousel();
                $('body').removeClass('tv-home-active');
            };

            this.stop = function () {
                paused = true;
                stopCarousel();
                $('body').removeClass('tv-home-active');
            };

            this.render = function (js) {
                return js ? $root[0] : $root;
            };

            this.destroy = function () {
                destroyed = true;
                paused = true;
                stopCarousel();
                abortTmdbNet();
                if (heroDebounceTimer) {
                    clearTimeout(heroDebounceTimer);
                    heroDebounceTimer = null;
                }
                activeDecodedImg = null;
                $('body').removeClass('tv-home-active');
                $root.off('wheel', onWheelHandler);
                $root.remove();
            };
        }

        function init() {
            if (initialized) return;
            initialized = true;

            if (!Lampa.Component || typeof Lampa.Component.get !== 'function' || typeof Lampa.Component.add !== 'function') {
                return;
            }

            origMainComponent = Lampa.Component.get('main');

            Lampa.Component.add('main', function (object) {
                if (HomeSections.isHomeEnabled()) {
                    return new NetflixMainComponent(object);
                }
                if (origMainComponent) {
                    return new origMainComponent(object);
                }
                return new NetflixMainComponent(object);
            });

            // Если главный экран уже открыт на момент загрузки плагина — мягко перезапустим его в Netflix-стиле
            try {
                if (HomeSections.isHomeEnabled() && Lampa.Activity && typeof Lampa.Activity.active === 'function') {
                    var act = Lampa.Activity.active();
                    if (act && act.component === 'main') {
                        var curComp = act.activity && typeof act.activity.component === 'function' ? act.activity.component() : null;
                        if (!curComp || !curComp.__is_tv_home) {
                            setTimeout(function () {
                                try {
                                    var nowAct = Lampa.Activity.active();
                                    if (nowAct && nowAct.component === 'main') {
                                        var nowComp = nowAct.activity && typeof nowAct.activity.component === 'function' ? nowAct.activity.component() : null;
                                        if (!nowComp || !nowComp.__is_tv_home) {
                                            Lampa.Activity.replace({});
                                        }
                                    }
                                } catch (e2) {}
                            }, 80);
                        }
                    }
                }
            } catch (e) {}
        }

        return {
            init: init
        };
    })();

    /* ------------------------------------------------------------------ *
     * Единый раздел настроек плагина с подразделами
     * ------------------------------------------------------------------ */

    var settingsDirty = false;
    var homeSettingsDirty = false;
    var settingsRefreshTimer = null;

    function markSettingsDirty() {
        settingsDirty = true;
    }

    function markHomeSettingsDirty() {
        homeSettingsDirty = true;
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

    function refreshMainActivities() {
        var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;

        if (Lampa.Activity && typeof Lampa.Activity.all === 'function') {
            var all = Lampa.Activity.all() || [];
            for (var i = 0; i < all.length; i++) {
                var item = all[i];
                if (!item || item.component !== 'main' || !item.activity || item === active) continue;
                try {
                    if (typeof item.activity.refresh === 'function') item.activity.refresh();
                    else if (typeof item.activity.needRefresh === 'function') item.activity.needRefresh();
                } catch (e) {}
            }
        }

        if (active && active.component === 'main') {
            try {
                if (typeof Lampa.Activity.replace === 'function') Lampa.Activity.replace({});
            } catch (e2) {}
        }
    }

    function maybeRefreshActiveCard() {
        if (!settingsDirty && !homeSettingsDirty) return;
        var doFull = settingsDirty;
        var doMain = homeSettingsDirty;
        settingsDirty = false;
        homeSettingsDirty = false;
        if (settingsRefreshTimer) clearTimeout(settingsRefreshTimer);
        settingsRefreshTimer = setTimeout(function () {
            settingsRefreshTimer = null;
            if (doFull) refreshFullActivities();
            if (doMain) refreshMainActivities();
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
        Lampa.Template.add('settings_tv_plugin_home', '<div></div>');

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
            param: { type: 'static' },
            field: {
                name: t('tv_home_title'),
                description: t('tv_home_descr')
            },
            onRender: function (item) {
                item.on('hover:enter', function () {
                    HomeSections.rebuildDynamicSettingsParams(4);
                    openSubSection(HomeSections.SUB_COMPONENT, t('tv_home_title'), 4);
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

        // --- Подраздел: Главный экран ---
        HomeSections.addSettingsParams(4);

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
            '.full-start__background.tv-card__background{left:0 !important;top:-5em !important;width:100% !important;height:105vh !important;object-fit:cover;z-index:-1 !important;-webkit-mask-image:-webkit-linear-gradient(top,#fff 48%,rgba(255,255,255,0) 98%) !important;mask-image:linear-gradient(to bottom,#fff 48%,rgba(255,255,255,0) 98%) !important;-webkit-transition:opacity .65s ease,filter .3s ease !important;transition:opacity .65s ease,filter .3s ease !important}' +
            '.full-start__background.tv-card__background.loaded:not(.dim):not(.tv-bg--hidden):not(.tv-bg--fading){opacity:1 !important}' +
            '.full-start__background.tv-card__background.tv-bg--fading{opacity:0 !important}' +
            '.full-start__background.tv-card__background.tv-bg--hidden{opacity:0 !important}' +
            '.tv-bg-trailer{position:absolute;left:0;top:-5em;width:100%;height:105vh;z-index:-2;overflow:hidden;pointer-events:none;opacity:.01;-webkit-transition:opacity .7s ease;transition:opacity .7s ease;-webkit-mask-image:-webkit-linear-gradient(top,#fff 48%,rgba(255,255,255,0) 98%);mask-image:linear-gradient(to bottom,#fff 48%,rgba(255,255,255,0) 98%)}' +
            '.tv-bg-trailer.tv-bg-trailer--visible{opacity:1;z-index:-1}' +
            '.tv-bg-trailer.tv-bg-trailer--paused{opacity:0 !important;z-index:-2}' +
            '.tv-bg-trailer__wrap{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none}' +
            '.tv-bg-trailer__wrap iframe{position:absolute;left:50%;top:50%;border:0;display:block;pointer-events:none;-webkit-transform-origin:center center;transform-origin:center center}' +

            /* --- Hero Layout --- */
            '.full-start-new.tv-card{padding-bottom:2.8em}' +
            '.full-start-new.tv-card .full-start-new__body{min-height:76vh;height:78vh;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end}' +
            '.full-start-new.tv-card .tv-hero__columns{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;width:100%}' +
            '.tv-hero__left{-webkit-box-flex:1;-webkit-flex:1 1 auto;flex:1 1 auto;min-width:0;padding-right:2em}' +
            '.tv-hero__right{-webkit-flex-shrink:0;flex-shrink:0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;padding-bottom:.3em}' +
            '.full-start-new.tv-card .full-start-new__head{font-size:1.22em;color:rgba(255,255,255,.68);margin-bottom:.75em;text-shadow:0 1px 6px rgba(0,0,0,.45)}' +
            '.full-start-new.tv-card .full-start-new__head span{color:#fff}' +
            '.full-start-new.tv-card .full-start-new__title{font-size:4.1em;font-weight:600;line-height:1.15;margin-bottom:.25em;text-shadow:0 .06em .28em rgba(0,0,0,.45);max-width:100%;-webkit-transition:opacity .22s ease,-webkit-transform .22s ease;transition:opacity .22s ease,transform .22s ease}' +
            '.full-start-new.tv-card .full-start-new__title.tv-title--exiting{opacity:0;-webkit-transform:translate3d(0,-.12em,0);transform:translate3d(0,-.12em,0)}' +
            '.full-start-new.tv-card .full-start-new__title.tv-title--measure{-webkit-transition:none !important;transition:none !important}' +
            '.full-start-new.tv-card .full-start-new__title.tv-title--logo{display:block;overflow:visible;max-height:none;-webkit-line-clamp:unset;line-clamp:unset;margin-left:0;margin-bottom:.85em;font-size:1em}' +
            '.full-start-new.tv-card .full-start-new__title.tv-title--animating{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end;-webkit-transition:height .42s cubic-bezier(.22,1,.36,1),margin-bottom .42s cubic-bezier(.22,1,.36,1);transition:height .42s cubic-bezier(.22,1,.36,1),margin-bottom .42s cubic-bezier(.22,1,.36,1)}' +
            '.tv-title-logo{display:block;-webkit-flex:0 0 auto;flex:0 0 auto;max-height:10em;max-width:24em;width:auto;height:auto;object-fit:contain;object-position:left bottom;-webkit-filter:drop-shadow(0 .1em .35em rgba(0,0,0,.55));filter:drop-shadow(0 .1em .35em rgba(0,0,0,.55));opacity:0;-webkit-transform:translate3d(0,.35em,0) scale(.96);transform:translate3d(0,.35em,0) scale(.96);-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transition:opacity .45s cubic-bezier(.22,1,.36,1),-webkit-transform .45s cubic-bezier(.22,1,.36,1);transition:opacity .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1)}' +
            '.tv-title-logo.tv-title-logo--loaded{opacity:1;-webkit-transform:translate3d(0,0,0) scale(1);transform:translate3d(0,0,0) scale(1)}' +
            '.tv-hero__details{margin-bottom:1.2em}' +
            '.full-start-new.tv-card .full-start-new__details{margin:0;font-size:1.1em;color:rgba(255,255,255,.95);display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.45em .75em;text-shadow:0 1px 4px rgba(0,0,0,.4)}' +
            '.full-start-new.tv-card .full-start-new__details>*{margin:0}' +
            '.full-start-new.tv-card .tv-details__val{font-weight:600}' +
            '.full-start-new.tv-card .tv-next-episode{white-space:nowrap}' +
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
            '.tv-new-rating{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;gap:.44em;margin-top:.95em;width:17.9em}' +
            '.tv-new-rating--empty{opacity:.55}' +
            '.tv-new-rating__side{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.18em;min-width:1.55em;-webkit-flex-shrink:0;flex-shrink:0;color:#cacbcb;-webkit-transition:color .2s ease;transition:color .2s ease}' +
            '.tv-new-rating__icon{width:1.49em;height:1.49em;padding:.14em .09em;box-sizing:border-box;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center;color:inherit}' +
            '.tv-new-rating__icon svg{width:100%;height:100%;display:block}' +
            '.tv-new-rating__pct{font-size:.7em;font-weight:700;line-height:.9;white-space:nowrap;color:inherit}' +
            '.tv-new-rating__side--lead .tv-new-rating__icon{color:#fff}' +
            '.tv-new-rating__side--lead .tv-new-rating__pct{color:rgba(255,255,255,.9)}' +
            '.tv-new-rating__center{-webkit-box-flex:1;-webkit-flex:1 1 auto;flex:1 1 auto;padding-top:.44em;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:center;-webkit-align-items:center;align-items:center;gap:.18em}' +
            '.tv-new-rating__bar{width:100%;height:.88em;border-radius:.53em;background:#272929;padding:.18em .2em;box-sizing:border-box;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}' +
            '.tv-new-rating__bar-pos{height:100%;border-radius:.53em;background:rgba(255,255,255,.9);-webkit-transition:width .3s ease;transition:width .3s ease}' +
            '.tv-new-rating__total{font-size:.62em;font-weight:500;color:rgba(255,255,255,.75);line-height:1.2;white-space:nowrap}' +

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

            /* --- Netflix Main Screen (Figma 169:3460 / 169:3501 / 169:3542 / 169:3663) --- */
            'body.tv-home-active .background{opacity:0 !important;pointer-events:none !important}' +
            'body.tv-home-active .wrap__content{padding-top:0 !important}' +
            'body.tv-home-active .head{background:-webkit-linear-gradient(top,rgba(13,14,17,.78) 0%,rgba(13,14,17,0) 100%) !important;background:linear-gradient(180deg,rgba(13,14,17,.78) 0%,rgba(13,14,17,0) 100%) !important;z-index:20}' +
            '.tv-home{position:relative;width:100%;height:100vh;background:#0d0e11;color:#fff;overflow:hidden;z-index:1}' +
            '.tv-home__bg{position:absolute;top:0;left:0;right:0;height:78vh;overflow:hidden;z-index:0;pointer-events:none;-webkit-transition:opacity .45s ease;transition:opacity .45s ease}' +
            '.tv-home--scrolled .tv-home__bg{opacity:.14}' +
            '.tv-home__bg-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center 22%;opacity:0;-webkit-transition:opacity .65s ease;transition:opacity .65s ease;will-change:opacity}' +
            '.tv-home__bg-img.is-ready{opacity:1}' +
            '.tv-home__bg-img.is-fading{opacity:0 !important}' +
            '.tv-home__bg-grad-x{position:absolute;top:0;left:0;right:0;bottom:0;background:-webkit-linear-gradient(left,rgba(13,14,17,.96) 0%,rgba(13,14,17,.72) 38%,rgba(13,14,17,.14) 78%,rgba(13,14,17,.04) 100%);background:linear-gradient(90deg,rgba(13,14,17,.96) 0%,rgba(13,14,17,.72) 38%,rgba(13,14,17,.14) 78%,rgba(13,14,17,.04) 100%)}' +
            '.tv-home__bg-grad-y{position:absolute;top:0;left:0;right:0;bottom:0;background:-webkit-linear-gradient(top,rgba(13,14,17,.58) 0%,rgba(13,14,17,.08) 32%,rgba(13,14,17,.86) 80%,#0d0e11 100%);background:linear-gradient(180deg,rgba(13,14,17,.58) 0%,rgba(13,14,17,.08) 32%,rgba(13,14,17,.86) 80%,#0d0e11 100%)}' +
            '.tv-home__viewport{position:relative;z-index:2;width:100%;height:100%;overflow:hidden}' +
            '.tv-home__scroll{position:relative;padding:4.6em 0 8em 0;will-change:transform;-webkit-transition:-webkit-transform .34s cubic-bezier(.22,1,.36,1);transition:transform .34s cubic-bezier(.22,1,.36,1)}' +

            /* Hero Featured Panel (169:3501 — без кнопок, с логотипом TMDB и каруселью задников) */
            '.tv-home-hero{position:relative;padding:1.2em 3.6em 1.7em 3.6em;min-height:17.2em;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-pack:end;-webkit-justify-content:flex-end;justify-content:flex-end;-webkit-transition:opacity .32s ease;transition:opacity .32s ease}' +
            '.tv-home--scrolled .tv-home-hero{opacity:0;pointer-events:none}' +
            '.tv-home-hero__eyebrow{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;margin-bottom:.75em;font-size:.92em;color:rgba(255,255,255,.86);font-weight:500;letter-spacing:.01em}' +
            '.tv-home-hero__eyebrow.hide{display:none}' +
            '.tv-home-hero__top-pill{display:inline-block;background:#e50914;color:#fff;font-size:.76em;font-weight:700;padding:.24em .58em;border-radius:.3em;letter-spacing:.06em;margin-right:.7em;text-transform:uppercase}' +
            '.tv-home-hero__top-pill.hide{display:none}' +
            '.tv-home-hero__brand{position:relative;min-height:4.4em;margin-bottom:.85em;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;align-items:flex-end}' +
            '.tv-home-hero__title{font-size:3.1em;font-weight:800;line-height:1.08;letter-spacing:-.015em;color:#fff;max-width:14em;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;-webkit-transition:opacity .3s ease;transition:opacity .3s ease}' +
            '.tv-home-hero__title.is-hidden{opacity:0;position:absolute;pointer-events:none}' +
            '.tv-home-hero__logo{max-height:5.8em;max-width:26em;width:auto;height:auto;object-fit:contain;object-position:left bottom;opacity:0;-webkit-transform:translateY(.22em);transform:translateY(.22em);-webkit-transition:opacity .42s ease,-webkit-transform .42s ease;transition:opacity .42s ease,transform .42s ease}' +
            '.tv-home-hero__logo.is-visible{opacity:1;-webkit-transform:translateY(0);transform:translateY(0)}' +
            '.tv-home-hero__logo.hide{display:none}' +
            '.tv-home-hero__meta{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-flex-wrap:wrap;flex-wrap:wrap;margin-bottom:.75em;font-size:.94em;color:rgba(255,255,255,.88)}' +
            '.tv-home-hero__meta>*{margin-right:.65em;margin-bottom:.2em}' +
            '.tv-home-hero__chip{display:inline-block;padding:.24em .6em;border-radius:.38em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.32);font-size:.86em;font-weight:600;color:#fff;letter-spacing:.02em}' +
            '.tv-home-hero__chip--rate{border-color:rgba(255,255,255,.46)}' +
            '.tv-home-hero__year{font-weight:700;color:#fff}' +
            '.tv-home-hero__dot{color:rgba(255,255,255,.45)}' +
            '.tv-home-hero__runtime{color:rgba(255,255,255,.82)}' +
            '.tv-home-hero__desc{max-width:36em;font-size:1em;line-height:1.45;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical}' +

            /* Home Rows */
            '.tv-home__rows{position:relative;padding:0 3.6em}' +
            '.tv-home__empty{padding:4em 0;font-size:1.4em;color:rgba(255,255,255,.6)}' +
            '.tv-home-row{position:relative;margin-bottom:2.1em}' +
            '.tv-home-row--first{margin-bottom:2.3em}' +
            '.tv-home-row__head{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:baseline;-webkit-align-items:baseline;align-items:baseline;margin-bottom:.9em}' +
            '.tv-home-row__head.hide{display:none}' +
            '.tv-home-row__title{font-size:1.38em;font-weight:700;color:#fff;letter-spacing:-.01em;margin-right:.8em}' +
            '.tv-home-row__sub{font-size:.92em;color:rgba(255,255,255,.48);font-weight:500}' +
            '.tv-home-row__viewport{position:relative;overflow:visible}' +
            '.tv-home-row__track{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;will-change:transform;-webkit-transition:-webkit-transform .28s cubic-bezier(.22,1,.36,1);transition:transform .28s cubic-bezier(.22,1,.36,1)}' +

            /* 2:3 Poster Cards (Figma 169:3460 + IMDb badge 169:3663) */
            '.tv-home-card{position:relative;width:10.4em;-webkit-flex-shrink:0;flex-shrink:0;margin-right:1.15em;cursor:pointer;-webkit-transition:-webkit-transform .2s ease;transition:transform .2s ease}' +
            '.tv-home-card__box{position:relative;width:100%;padding-bottom:150%;border-radius:.62em;overflow:hidden;background:#191b22;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-transition:box-shadow .18s ease;transition:box-shadow .18s ease}' +
            '.tv-home-card.focus{-webkit-transform:scale(1.045);transform:scale(1.045);z-index:5}' +
            '.tv-home-card.focus .tv-home-card__box{box-shadow:0 0 0 .16em #fff,0 14px 32px rgba(0,0,0,.68)}' +
            '.tv-home-card__img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;-webkit-transition:opacity .28s ease;transition:opacity .28s ease}' +
            '.tv-home-card__img.is-loaded{opacity:1}' +
            '.tv-home-card__top-left{position:absolute;top:.5em;left:.5em;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;-webkit-box-align:start;-webkit-align-items:flex-start;align-items:flex-start;z-index:2}' +
            '.tv-home-card__badge{background:rgba(0,0,0,.66);color:rgba(255,255,255,.94);font-size:.68em;font-weight:700;padding:.22em .46em;border-radius:.38em;margin-bottom:.3em;letter-spacing:.02em;line-height:1.1}' +
            '.tv-home-card__rating{position:absolute;top:.5em;right:.5em;background:rgba(0,0,0,.62);color:#fff;font-size:.76em;font-weight:700;padding:.24em .48em;border-radius:.42em;line-height:1.1;z-index:2;letter-spacing:.01em}' +
            '.tv-home-card__progress{position:absolute;left:.5em;right:.5em;bottom:.48em;height:.2em;background:rgba(255,255,255,.24);border-radius:99px;overflow:hidden;z-index:2}' +
            '.tv-home-card__progress-bar{height:100%;background:#fff;border-radius:99px}' +
            '.tv-home-card__title{margin-top:.55em;font-size:.94em;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25}' +
            '.tv-home-card__meta{margin-top:.18em;font-size:.78em;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}' +

            /* Wide 16:9 Cards — Продолжить просмотр (169:3542) и Новые серии */
            '.tv-home-wide{position:relative;width:15.4em;-webkit-flex-shrink:0;flex-shrink:0;margin-right:1.2em;cursor:pointer;-webkit-transition:-webkit-transform .2s ease;transition:transform .2s ease}' +
            '.tv-home-wide__box{position:relative;width:100%;padding-bottom:56.25%;border-radius:.68em;overflow:hidden;background:#191b22;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-transition:box-shadow .18s ease;transition:box-shadow .18s ease}' +
            '.tv-home-wide.focus{-webkit-transform:scale(1.045);transform:scale(1.045);z-index:5}' +
            '.tv-home-wide.focus .tv-home-wide__box{box-shadow:0 0 0 .16em #fff,0 14px 32px rgba(0,0,0,.68)}' +
            '.tv-home-wide__img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;-webkit-transition:opacity .28s ease;transition:opacity .28s ease}' +
            '.tv-home-wide__img.is-loaded{opacity:1}' +
            '.tv-home-wide__vignette{position:absolute;left:0;right:0;bottom:0;height:52%;background:-webkit-linear-gradient(top,rgba(0,0,0,0) 0%,rgba(0,0,0,.74) 100%);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.74) 100%);pointer-events:none;z-index:1}' +
            '.tv-home-wide__badge{position:absolute;top:.55em;right:.55em;background:rgba(0,0,0,.68);color:#fff;font-size:.74em;font-weight:700;padding:.26em .55em;border-radius:.4em;line-height:1.1;z-index:2;letter-spacing:.02em}' +
            '.tv-home-wide__date{position:absolute;right:.65em;bottom:.55em;color:rgba(255,255,255,.9);font-size:.82em;font-weight:600;z-index:2;text-shadow:0 1px 4px rgba(0,0,0,.7)}' +
            '.tv-home-wide__progress{position:absolute;left:.65em;right:.65em;bottom:.6em;height:.24em;background:rgba(255,255,255,.26);border-radius:99px;overflow:hidden;z-index:2}' +
            '.tv-home-wide__progress-bar{height:100%;background:#fff;border-radius:99px}' +
            '.tv-home-wide__title{margin-top:.55em;font-size:.98em;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25}' +
            '.tv-home-wide__sub{margin-top:.2em;font-size:.8em;color:rgba(255,255,255,.58);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}' +

            /* «Еще» tile inside Netflix Main Screen rows */
            '.tv-home-more{position:relative;width:10.4em;-webkit-flex-shrink:0;flex-shrink:0;margin-right:1.15em;cursor:pointer;-webkit-transition:-webkit-transform .2s ease;transition:transform .2s ease}' +
            '.tv-home-more__box{position:relative;width:100%;padding-bottom:150%;border-radius:.62em;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);-webkit-transition:background .18s ease,box-shadow .18s ease;transition:background .18s ease,box-shadow .18s ease}' +
            '.tv-home-more.focus{-webkit-transform:scale(1.045);transform:scale(1.045);z-index:5}' +
            '.tv-home-more.focus .tv-home-more__box{background:rgba(255,255,255,.16);box-shadow:0 0 0 .16em #fff}' +
            '.tv-home-more__title{position:absolute;top:50%;left:0;right:0;-webkit-transform:translateY(-50%);transform:translateY(-50%);text-align:center;font-size:1.15em;font-weight:700;color:#fff}' +

            /* --- Responsive fallback for small screens --- */
            '@media screen and (max-width:767px){' +
            '.tv-home-hero{padding:.8em 1.2em 1.2em 1.2em;min-height:14em}' +
            '.tv-home__rows{padding:0 1.2em}' +
            '.tv-home-hero__title{font-size:2em}' +
            '.tv-home-card,.tv-home-more{width:8.6em}' +
            '.tv-home-wide{width:13.2em}' +
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
        GlobalMoreMenu.init();
        HomeScreen.init();

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
