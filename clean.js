(function () {
    'use strict';

    // Защита от дублей при перезагрузках
    if (window.lampa_custom_cleaner_v17_2) return;
    window.lampa_custom_cleaner_v17_2 = true;

    function initAll() {
        console.log('Custom Cleaner', 'Инициализация плагина очистки (Откат к V17 + Жесткий выпил поиска)...');

        // --- 1. CSS: ШАПКА И КНОПКА PLAY ---
        $('body').append(`
            <style id="custom-cleaner-styles">
                /* Шапка: только поиск, настройки и навигация */
                .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { display: none !important; }
                .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; }

                /* Кнопка "Смотреть" всегда развернута */
                .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
                .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }

                /* Резервное скрытие через стили */
                .content-rows [data-type="favorite"][data-title*="Shots"],
                .content-rows [data-type="created"][data-title*="Shots"],
                .line[data-name="shots_main"], .line[data-type*="shots"] { display: none !important; }
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
        
        // Перехват добавления строк
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

        // Очистка бокового меню
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

        // Очистка карточки фильма от кнопок Shots
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

        // Перехват всплывающего окна "Смотреть"
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

        // Интеграция в плеер (удаление красной кнопки записи)
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

        // --- 4. ДИНАМИЧЕСКАЯ ОЧИСТКА АКТЕРОВ И МУСОРА В ПОИСКЕ ---
        setInterval(() => {
            // Подчищаем остатки Shots
            $('[class*="shots-"], [id*="shots-"], [data-shots], .shots-view-button, .shots-player-segments, .shots-player-recorder, .shots-modal, .shots-lenta').remove();
            
            // Физическое удаление мусора в поиске (Cinema, AI)
            $('.selector__item, .search__source, .search-sources__item, .button').each(function() {
                const txt = ($(this).text() || '').trim().toLowerCase();
                if (txt === 'cinema' || txt === 'cinema - anime' || txt === 'ai-ассистент') {
                    $(this).remove(); // Полное удаление элемента из кода
                }
            });

            // Физическое удаление полок актеров на главном экране
            $('.line, .scroll, .section').each(function() {
                const title = $(this).find('.line__title, .scroll__title');
                if (title.length) {
                    const titleTxt = (title.text() || '').trim().toLowerCase();
                    // Если название полки Shots ИЛИ в заголовке есть картинка (аватар актера)
                    if (titleTxt === 'shots' || title.find('img, .line__avatar, .avatar, [class*="avatar"]').length > 0) {
                        $(this).remove(); // Полное удаление строки
                    }
                }
            });
        }, 100); // Проверка 10 раз в секунду
    }

    // Запуск плагина когда Lampa готова
    if (window.appready) {
        initAll();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') initAll();
        });
    }

})();
