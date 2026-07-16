(function () {
    'use strict';

    if (window.lampa_nuke_v21) return;
    window.lampa_nuke_v21 = true;

    // САМОЕ ВАЖНОЕ: Безопасный старт. 
    // Ждем, пока Лампа и jQuery полностью загрузятся, чтобы избежать Script Error.
    var startInterval = setInterval(function() {
        if (window.appready && window.Lampa && window.$) {
            clearInterval(startInterval);
            runMegaCleaner();
        }
    }, 100);

    function runMegaCleaner() {
        console.log('Cleaner', 'v21: Успешный запуск без крашей');

        // ==========================================
        // БЛОК 1: ОЧИСТКА ШАПКИ, ПОИСКА И АКТЕРОВ
        // ==========================================
        try {
            var css = `
                /* Шапка */
                .head__action.open--profile, .head__action.open--notice, 
                .head__action.open--broadcast, .head__action.open--feed, 
                .head__action.open--premium { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }
                
                /* Статусы */
                .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }
                
                /* Кнопка Смотреть */
                .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
                .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }
                
                /* 3 точки */
                .full-start__button.button--more, [data-action="more"] { display: none !important; }
            `;
            var style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);

            setInterval(function() {
                // Вырезаем мусор из поиска
                var searchItems = document.querySelectorAll('.selector__item, .search__source, .search-sources__item, .search__tab, .button');
                for (var i = 0; i < searchItems.length; i++) {
                    var txt = (searchItems[i].textContent || '').trim().toLowerCase();
                    if (txt === 'cinema' || txt === 'cinema - anime' || txt === 'ai-ассистент') {
                        searchItems[i].style.setProperty('display', 'none', 'important');
                    }
                }

                // Вырезаем полки актеров
                var lines = document.querySelectorAll('.line, .scroll, .section');
                for (var j = 0; j < lines.length; j++) {
                    var title = lines[j].querySelector('.line__title, .scroll__title');
                    if (title) {
                        var titleTxt = (title.textContent || '').trim().toLowerCase();
                        if (titleTxt === 'shots' || lines[j].querySelector('img, .line__avatar, .avatar, [class*="avatar"]')) {
                            lines[j].style.setProperty('display', 'none', 'important');
                        }
                    }
                }
            }, 200);
        } catch(e) { console.log('Clean UI Error:', e); }

        // ==========================================
        // БЛОК 2: УДАЛЕНИЕ ТРЕЙЛЕРОВ (Твой код)
        // ==========================================
        try {
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite') {
                    e.object.activity.render().find('.view--trailer').remove();
                }
            });
        } catch(e) { console.log('Trailers Error:', e); }

        // ==========================================
        // БЛОК 3: УДАЛЕНИЕ SHOTS (Твой код)
        // ==========================================
        try {
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
                                const $item = $(this);
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
                        const $item = $(this);
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
                            if (item.title && item.title.toLowerCase().indexOf('shots') >= 0) return false;
                            if (item.icon && item.icon.indexOf('sprite-shots') >= 0) return false;
                            return true;
                        });
                    }
                    return originalSelectShow.call(this, options);
                };
            }

            setInterval(() => {
                $('.shots-view-button, .view--online.shots-view-button, [class*="shots-view"]').remove();
                $('.buttons--container .shots-view-button, .buttons--container .view--online.shots-view-button').remove();
            }, 500);

            if (Lampa.Component && Lampa.Component.remove) {
                ['shots_list', 'shots_card', 'shots_channel'].forEach(compName => {
                    try { Lampa.Component.remove(compName); } catch (e) {}
                });
            }

            $('body').append(`
                <style id="no-shots-styles">
                    .content-rows [data-type="favorite"][data-title*="Shots"],
                    .content-rows [data-type="created"][data-title*="Shots"],
                    .line[data-name="shots_main"], .line[data-type*="shots"],
                    .shots-view-button, .full-start__button.shots-view-button, [class*="shots-view"],
                    .shots-player-segments, .shots-player-recorder, .shots-player--recording, [class*="shots-player"],
                    [data-controller="player_panel"]:has(circle[fill="#FF0707"]),
                    [data-controller="player_panel"]:has(circle[fill="#ff0707"]),
                    [data-controller="player_panel"]:has(circle[fill="red"]),
                    .player-panel__settings + [data-controller="player_panel"],
                    .shots-modal, .shots-lenta, [class*="shots-modal"], [class*="shots-lenta"],
                    [class*="shots-"], [id*="shots-"], [data-shots] {
                        display: none !important; visibility: hidden !important;
                    }
                </style>
            `);

            setInterval(() => {
                $('[class*="shots-"], [id*="shots-"], [data-shots], .shots-view-button, .shots-player-segments, .shots-player-recorder, .shots-modal, .shots-lenta').remove();
                $('[data-controller="player_panel"]').each(function() {
                    const $btn = $(this);
                    const hasRedCircle = $btn.find('circle[fill="#FF0707"]').length > 0 || $btn.find('circle[fill="#ff0707"]').length > 0 || $btn.find('circle[fill="red"]').length > 0 || ($btn.find('svg circle').length === 2 && $btn.find('svg circle').eq(1).attr('fill') === '#FF0707');
                    if (hasRedCircle) $btn.remove();
                });
            }, 200);

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

            if (Lampa.PlayerPanel && Lampa.PlayerPanel.listener) {
                Lampa.PlayerPanel.listener.follow('render', () => { setTimeout(removeShotsPlayerButton, 10); });
            }

            setInterval(() => {
                $('.shots-player-segments, .shots-player-recorder, [class*="shots-player"]').remove();
                removeShotsPlayerButton();
            }, 200);

        } catch(e) { console.log('Shots Error:', e); }
    }
})();
