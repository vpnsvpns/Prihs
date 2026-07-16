(function () {
    'use strict';

    if (window.lampa_mega_cleaner_v20) return;
    window.lampa_mega_cleaner_v20 = true;

    console.log('Mega Cleaner v20', 'Запуск изолированных модулей...');

    // =========================================================================
    // БЛОК 1: ОЧИСТКА ИНТЕРФЕЙСА (Шапка, Поиск, Актеры, Кнопка Смотреть)
    // =========================================================================
    try {
        function cleanMyUI() {
            // Вшиваем жесткие стили для шапки и кнопок
            $('body').append(`
                <style id="custom-ui-cleaner">
                    /* Убиваем профиль, уведомления, трансляции, три точки ленты */
                    .head__action.open--profile, .head__action.open--notice, 
                    .head__action.open--broadcast, .head__action.open--feed, 
                    .head__action.open--premium { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }
                    
                    /* Убиваем зеленую точку и статусы соединения */
                    .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }
                    
                    /* Делаем кнопку "Смотреть" всегда широкой с текстом */
                    .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
                    .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }
                    
                    /* На всякий случай вырезаем три точки (Ещё) в карточке фильма */
                    .full-start__button.button--more, [data-action="more"] { display: none !important; }
                </style>
            `);

            // Безостановочный цикл для динамических элементов (Поиск и Актеры)
            setInterval(function() {
                // 1. Убиваем источники поиска (Cinema, Anime, AI)
                $('.selector__item, .search__source, .search-sources__item, .search__tab, .button').each(function() {
                    var text = ($(this).text() || '').trim().toLowerCase();
                    if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент') {
                        $(this).hide(); // Глушим надежным методом Lampa (jQuery)
                    }
                });

                // 2. Убиваем полки актеров на главном экране (поиск аватарки в заголовке)
                $('.line, .scroll, .section').each(function() {
                    var title = $(this).find('.line__title, .scroll__title');
                    if (title.length && title.find('img, .line__avatar, .avatar, [class*="avatar"]').length > 0) {
                        $(this).hide();
                    }
                });

                // 3. Страховочный удар по профилю и точке (если стили слетят)
                $('.head__action.open--profile, .head__action.open--feed, .head__status').hide();
            }, 200); // Проверяет каждые 200мс
        }

        // Запуск первого блока
        if (window.appready) { cleanMyUI(); } 
        else { Lampa.Listener.follow('app', function(e) { if (e.type == 'ready') cleanMyUI(); }); }
        
    } catch(e) {
        console.log('Error in Block 1', e);
    }

    // =========================================================================
    // БЛОК 2: УДАЛЕНИЕ ТРЕЙЛЕРОВ (ТВОЙ КОД)
    // =========================================================================
    try {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                e.object.activity.render().find('.view--trailer').
