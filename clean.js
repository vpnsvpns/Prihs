(function () {
    'use strict';

    // Защита от дублей
    if (window.lampa_custom_cleaner_v17_3) return;
    window.lampa_custom_cleaner_v17_3 = true;

    function initAll() {
        console.log('Custom Cleaner', 'v17.3: Умное скрытие без краша пространственной навигации');

        // --- 1. CSS: ШАПКА, КНОПКА PLAY И КЛАСС-УБИЙЦА ---
        $('body').append(`
            <style id="custom-cleaner-styles">
                /* Шапка: только поиск, настройки и навигация */
                .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { display: none !important; }
                .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; }

                /* Кнопка "Смотреть" всегда развернута */
                .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
                .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }

                /* Три точки (Еще) */
                .full-start__button.button--more, [data-action="more"] { display: none !important; }

                /* Резервное скрытие через стили */
                .content-rows [data-type="favorite"][data-title*="Shots"],
                .content-rows [data-type="created"][data-title*="Shots"],
                .line[data-name="shots_main"], .line[data-type*="shots"] { display: none !important; }

                /* Системный класс для полного глушения элемента */
                .nuked-element { 
                    display: none !important; 
                    width: 0 !important; 
                    height: 0 !important; 
                    padding: 0 !important; 
                    margin: 0 !important; 
                    position: absolute !important; 
                    pointer-events: none !important; 
                    opacity: 0 !important;
                }
            </style>
        `);

        // --- 2. УДАЛЕНИЕ ТРЕЙЛЕРОВ ---
        (function () { 
            'use strict';	 
            Lampa.Listener.follow('full', function (e) { 
                if (e.type == 'complite') { 
                    e.object.activity.render().find('.view--trailer').remove(); 
                } 
            }); 
        })();

        // --- 3. ГЛУБОКОЕ УДАЛЕНИЕ SHOTS И ФИЛЬТРЫ МЕНЮ ---
        Lampa.Storage.set('content_rows_shots_main', 'false');
        
        const originalAdd = Lampa.ContentRows.add;
        if (originalAdd) {
            Lampa.ContentRows.add = function(row) {
                if (row && row.name === 'shots_main') return;
                if (row && row.screen && Lampa.Arrays.isArray(row.screen) && row.screen.indexOf('bookmarks') >= 0) {
                    if (typeof row.call === 'function') {
                        const callStr = row.call.toString();
                        if (callStr.indexOf('shots_title_favorite') >= 0 || callStr.indexOf('shots_title_created') >= 0 || (callStr.indexOf('Favorite.get') >= 0 && callStr.indexOf('Created.get') >= 0 && callStr.indexOf('shots') >= 0)) {
                            return;
                        }
                    }
                }
                return originalAdd.call(this, row);
            };
        }

        const originalCall = Lampa.ContentRows.call;
        if (originalCall) {
            Lampa.ContentRows.call = function(screen, params, calls) {
                Lampa.Storage.set('content_rows_shots_main', 'false');
                const result = originalCall.call(this, screen, params, calls);
                if (Lampa.Arrays.isArray(calls)) {
                    for (let i = calls.length - 1; i >= 0; i--) {
                        const callItem = calls[i];
                        if (callItem && typeof callItem === 'object') {
                            if (callItem.title === 'Shots' || (callItem.icon_svg && callItem.icon_svg.indexOf('sprite-shots') >= 0) || (callItem.results && Lampa.Arrays.isArray(callItem.results) && callItem.results.length > 0 && callItem.results[0].type === 'shot')) {
