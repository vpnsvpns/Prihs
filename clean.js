(function () {
    'use strict';

    if (window.lampa_custom_cleaner_v18) return;
    window.lampa_custom_cleaner_v18 = true;

    function initAll() {
        console.log('Custom Cleaner', 'Запуск v18: Полная аннигиляция мусора');

        // --- 1. ЖЕЛЕЗНЫЙ CSS ---
        $('body').append(`
            <style id="custom-cleaner-styles">
                /* Шапка: глушим всё, кроме поиска, настроек, меню и "назад" */
                .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }
                
                /* Шапка: скрываем статусы (точки) */
                .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }

                /* Кнопка "Смотреть" */
                .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
                .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }

                /* Резерв для Shots */
                .content-rows [data-type="favorite"][data-title*="Shots"],
                .content-rows [data-type="created"][data-title*="Shots"],
                .line[data-name="shots_main"], .line[data-type*="shots"] { display: none !important; }
            </style>
        `);

        // --- 2. РОДНЫЕ МЕТОДЫ (Трейлеры и Shots) ---
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                e.object.activity.render().find('.view--trailer').remove();
            }
        });

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
                                calls.splice(i, 1);
                            }
                        }
                    }
                }
                return result;
            };
        }

        Lampa.Listener.follow('menu', (e) => {
            if (e.type === 'end' || e.type === 'start') {
                setTimeout(() => {
                    const menu = Lampa.Menu.render();
                    if (menu && menu.length) {
                        menu.find('.menu__item').each(function() {
                            const $item = $(this);
                            const text = $item.find('.menu__text').text();
                            const hasShotsIcon = $item.find('use[xlink\\:href="#sprite-shots"]').length > 0;
                            if ((text && text.toLowerCase().indexOf('shots') >= 0) || hasShotsIcon) $item.remove();
                        });
                    }
                }, 100);
            }
        });

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
                        if (item.title && item.title.toLowerCase().indexOf('shots') >= 0) return false;
                        if (item.icon && item.icon.indexOf('sprite-shots') >= 0) return false;
                        return true;
                    });
                }
                return originalSelectShow.call(this, options);
            };
        }

        if (Lampa.Component && Lampa.Component.remove) {
            ['shots_list', 'shots_card', 'shots_channel'].forEach(compName => {
                try { Lampa.Component.remove(compName); } catch (e) {}
            });
        }

        function removeShotsPlayerButton() {
            const selector = '[data-controller="player_panel"]';
            if (Lampa.PlayerPanel && Lampa.PlayerPanel.render) {
                const panel = Lampa.PlayerPanel.render();
                panel.find(selector).each(function() {
                    const $btn = $(this);
                    const hasRedCircle = $btn.find('circle[fill="#FF0707"]').length > 0 || $btn.find('circle[fill="#ff0707"]').length > 0 || $btn.find('circle[fill="red"]').length > 0 || $btn.find('svg circle').length === 2 && $btn.find('svg circle').eq(1).attr('fill') === '#FF0707';
                    if (hasRedCircle) $btn.remove();
                });
                panel.find('.shots-player-segments, [class*="shots-player"]').remove();
            }
            $(selector).each(function() {
                const $btn = $(this);
                const hasRedCircle = $btn.find('circle[fill="#FF0707"]').length > 0 || $btn.find('circle[fill="#ff0707"]').length > 0 || $btn.find('circle[fill="red"]').length > 0 || ($btn.find('svg circle').length === 2 && $btn.find('svg circle').eq(1).attr('fill') === '#FF0707');
                if (hasRedCircle) $btn.remove();
            });
        }

        if (Lampa.PlayerPanel && Lampa.PlayerPanel.render) {
            const originalRender = Lampa.PlayerPanel.render;
            Lampa.PlayerPanel.render = function() {
                const result = originalRender.call(this);
                setTimeout(removeShotsPlayerButton, 10);
                return result;
            };
        }

        Lampa.Listener.follow('player', (e) => {
            if (e.type === 'render' || e.type === 'ready' || e.type === 'open' || e.type === 'start') {
                setTimeout(() => {
                    $('.shots-player-segments, .shots-player-recorder, [class*="shots-player"]').remove();
                    removeShotsPlayerButton();
                }, 50);
            }
        });

        // --- 3. АГРЕССИВНЫЙ ЦИКЛ ПОДАВЛЕНИЯ ---
        setInterval(() => {
            // 1. Шапка: дополнительная проверка (удаляем физически, если вылезло)
            $('.head__action').not('.open--search, .open--settings, .open--menu, .head__back, [data-action="back"]').remove();
            $('.head__status, .head__state, .head__server, .cub-status, .sync-status').remove();

            // 2. Поиск: вшиваем нулевые стили в источники (чтобы не сломать навигацию пультом)
            $('.search__source, .search-sources__item, .selector__item').each(function() {
                const txt = ($(this).text() || '').trim().toLowerCase();
                if (txt === 'cinema' || txt === 'cinema - anime' || txt === 'ai-ассистент') {
                    $(this).attr('style', 'display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important; opacity: 0 !important;');
                }
            });

            // 3. Главный экран: полки актеров и остатки Shots (физическое удаление)
            $('.line, .scroll, .section').each(function() {
                const title = $(this).find('.line__title, .scroll__title');
                if (title.length) {
                    const titleTxt = (title.text() || '').trim().toLowerCase();
                    // Если строка Shots или есть картинка (актер)
                    if (titleTxt === 'shots' || title.find('img, .line__avatar, .avatar, [class*="avatar"]').length > 0) {
                        $(this).remove();
                    }
                }
            });

            // 4. Добиваем мусорные кнопки
            $('[class*="shots-"], [id*="shots-"], [data-shots], .shots-view-button, .shots-player-segments, .shots-player-recorder, .shots-modal, .shots-lenta').remove();
            
        }, 100); // Скорость сканирования: 10 раз в секунду
    }

    if (window.appready) {
        initAll();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') initAll();
        });
    }

})();
