(function () {
    'use strict';

    if (window.lampa_nuke_v22) return;
    window.lampa_nuke_v22 = true;

    // =========================================================================
    // ЧАСТЬ 1: МГНОВЕННАЯ ОЧИСТКА ИНТЕРФЕЙСА (Без ожиданий и зависимостей)
    // =========================================================================

    // 1. Вшиваем стили мгновенно
    var css = `
        /* Шапка: убиваем всё, кроме лупы, шестеренки, меню и кнопки назад */
        .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { 
            display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important;
        }
        
        /* Убиваем статусы и зеленую точку */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; }
        
        /* Кнопка "Смотреть" */
        .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
        .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }
        
        /* Три точки */
        .full-start__button.button--more, [data-action="more"] { display: none !important; }
    `;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // 2. Мгновенный агрессивный цикл (каждые 50мс)
    setInterval(function() {
        // Вырезаем источники из поиска
        var items = document.querySelectorAll('.selector__item, .search__source, .search-sources__item, .search__tab, .button');
        for (var i = 0; i < items.length; i++) {
            var txt = (items[i].textContent || '').trim().toLowerCase();
            if (txt === 'cinema' || txt === 'cinema - anime' || txt === 'ai-ассистент') {
                items[i].setAttribute('style', 'display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important;');
            }
        }

        // Вырезаем актеров и остатки Shots с главной
        var lines = document.querySelectorAll('.line, .scroll, .section');
        for (var j = 0; j < lines.length; j++) {
            var title = lines[j].querySelector('.line__title, .scroll__title');
            if (title) {
                var t = (title.textContent || '').trim().toLowerCase();
                if (t === 'shots' || lines[j].querySelector('img, .line__avatar, .avatar, [class*="avatar"]')) {
                    lines[j].setAttribute('style', 'display: none !important;');
                }
            }
        }
    }, 50);


    // =========================================================================
    // ЧАСТЬ 2: ТРЕЙЛЕРЫ И SHOTS (Безопасный запуск)
    // =========================================================================
    
    function initNativeCode() {
        try {
            // --- УДАЛЕНИЕ ТРЕЙЛЕРОВ ---
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite') {
                    e.object.activity.render().find('.view--trailer').remove();
                }
            });

            // --- УДАЛЕНИЕ SHOTS ---
            Lampa.Storage.set('content_rows_shots_main', 'false');
            
            const originalAdd = Lampa.ContentRows.add;
            Lampa.ContentRows.add = function(row) {
                if (row) {
                    if (row.name === 'shots_main') return;
                    if (row.screen && Lampa.Arrays.isArray(row.screen) && row.screen.indexOf('bookmarks') >= 0) {
                        if (typeof row.call === 'function') {
                            const callStr = row.call.toString();
                            if (callStr.indexOf('shots_title_favorite') >= 0 || callStr.indexOf('shots_title_created') >= 0 || (callStr.indexOf('Favorite.get') >= 0 && callStr.indexOf('Created.get') >= 0 && callStr.indexOf('shots') >= 0)) {
                                return;
                            }
                        }
                    }
                }
                return originalAdd.call(this, row);
            };
            
            const originalCall = Lampa.ContentRows.call;
            Lampa.ContentRows.call = function(screen, params, calls) {
                Lampa.Storage.set('content_rows_shots_main', 'false');
                const result = originalCall.call(this, screen, params, calls);
                if (Lampa.Arrays.isArray(calls)) {
                    for (let i = calls.length - 1; i >= 0; i--) {
                        const callItem = calls[i];
                        if (callItem && typeof callItem === 'object') {
                            if (callItem.title === 'Shots' || (callItem.icon_svg && callItem.icon_svg.indexOf('sprite-shots') >= 0) || (callItem.results && Lampa.Arrays.isArray(callItem.results) && callItem.results.length > 0 && callItem.results[0].type === 'shot')) {
                                calls.splice(i, 1);
                            }
                        }
                    }
                }
                return result;
            };

            Lampa.Listener.follow('menu', (e) => {
                if (e.type === 'end' || e.type === 'start') {
                    setTimeout(() => {
                        const menu = Lampa.Menu.render();
                        if (menu && menu.length) {
                            menu.find('.menu__item').each(function() {
                                const $item =$(this);
                                const text = $item.find('.menu__text').text();
                                const hasShotsIcon = $item.find('use[xlink\\:href="#sprite-shots"]').length > 0;
                                if ((text && text.toLowerCase().indexOf('shots') >= 0) || hasShotsIcon) $item.remove();
                            });
                        }
                    }, 100);
                }
            });

            setInterval(() => {
                const menu = Lampa.Menu.render();
                if (menu && menu.length) {
                    menu.find('.menu__item').each(function() {
                        const $item =$(this);
                        const text = $item.find('.menu__text').text();
                        const hasShotsIcon = $item.find('use[xlink\\:href="#sprite-shots"]').length > 0;
                        if ((text && text.toLowerCase().indexOf('shots') >= 0) || hasShotsIcon) $item.remove();
                    });
                }
            }, 1000);

            Lampa.Listener.follow('full', (e) => {
                if (e.type === 'complite') {
                    const render = e.object.activity.render();
                    if (render && render.length) {
                        render.find('.shots-view-button, [class*="shots-view"], .view--online.shots-view-button').remove();
                        const buttonsContainer = render.find('.buttons--container');
                        if (buttonsContainer.length) {
                            buttonsContainer.find('.shots-view-button, [class*="shots-view"], .view--online.shots-view-button').remove();
                        }
                    }
                }
            });

            if (Lampa.Select && Lampa.Select.show) {
                const originalSelectShow = Lampa.Select.show;
                Lampa.Select.show = function(options) {
                    if (options && Lampa.Arrays.isArray(options.items)) {
                        options.items = options.items.filter(item => {
                            if (item.btn) {
                                const btn = $(item.btn);
                                const isShots = btn.hasClass('shots-view-button') || btn.hasClass('view--online') && btn.find('use[xlink\\:href="#sprite-shots"]').length > 0 || btn.find('.shots-view-button__title').length > 0 || (item.title && item.title.toLowerCase().indexOf('shots') >= 0);
                                if (isShots) return false;
                            }
                            if (
