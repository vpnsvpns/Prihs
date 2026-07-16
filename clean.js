(function () {
    'use strict';

    if (window.lampa_pure_cleaner_v19) return;
    window.lampa_pure_cleaner_v19 = true;

    console.log('Custom Cleaner', 'Запуск v19: Чистый Vanilla JS (Без крашей)');

    // === 1. ВШИВАЕМ ЖЕЛЕЗОБЕТОННЫЙ CSS (БЕЗ JQUERY) ===
    var css = `
        /* Глушим профиль, уведомления, трансляции и всё лишнее в шапке */
        .head__action.open--profile,
        .head__action.open--broadcast,
        .head__action.open--notice,
        .head__action.open--feed,
        .head__action[data-action="profile"],
        .head__action[data-action="fullscreen"],
        .head__action.open--premium { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }

        /* Оставляем только поиск, настройки и меню (если классы нестандартные - перестраховка) */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { display: none !important; }

        /* Убиваем зеленую точку соединения и статусы */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; }

        /* Кнопка "Смотреть" всегда с текстом */
        .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
        .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // === 2. БРУТФОРС ЦИКЛ (КАЖДЫЕ 50 МИЛЛИСЕКУНД) ===
    // Этот цикл будет безостановочно искать мусор и гасить его, даже если Лампа его перерисует
    setInterval(function() {
        // 1. Поиск: Убиваем источники Cinema, Anime, AI
        var searchItems = document.querySelectorAll('.selector__item, .search__source, .search-sources__item, .search__tab, .button');
        for (var i = 0; i < searchItems.length; i++) {
            var txt = (searchItems[i].textContent || searchItems[i].innerText || '').trim().toLowerCase();
            if (txt === 'cinema' || txt === 'cinema - anime' || txt === 'ai-ассистент') {
                searchItems[i].style.setProperty('display', 'none', 'important');
            }
        }

        // 2. Шапка: Убиваем иконку профиля и зеленую точку скриптом (если CSS не взял)
        var headIcons = document.querySelectorAll('.head .head__action');
        for (var k = 0; k < headIcons.length; k++) {
            var icon = headIcons[k];
            var action = icon.getAttribute('data-action') || '';
            // Если это не поиск, не настройки и не меню - в мусорку
            if (!icon.classList.contains('open--search') && 
                !icon.classList.contains('open--settings') && 
                !icon.classList.contains('open--menu') && 
                !icon.classList.contains('head__back') && 
                action !== 'back' && action !== 'search' && action !== 'settings') {
                icon.style.setProperty('display', 'none', 'important');
            }
        }
        
        var dots = document.querySelectorAll('.head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status');
        for (var d = 0; d < dots.length; d++) {
            dots[d].style.setProperty('display', 'none', 'important');
        }

        // 3. Главный экран: Убиваем полки Shots и Актеров
        var lines = document.querySelectorAll('.line, .scroll, .section');
        for (var j = 0; j < lines.length; j++) {
            var titleEl = lines[j].querySelector('.line__title, .scroll__title');
            if (titleEl) {
                var titleTxt = (titleEl.textContent || titleEl.innerText || '').trim().toLowerCase();
                // Если название "shots" ИЛИ есть аватарка актера
                if (titleTxt === 'shots' || lines[j].querySelector('img, .line__avatar, .avatar, [class*="avatar"]')) {
                    lines[j].style.setProperty('display', 'none', 'important');
                }
            }
        }

        // 4. Добиваем кнопки Shots где бы они ни вылезли
        var shotsBtns = document.querySelectorAll('[class*="shots-"], [id*="shots-"], [data-shots], .shots-view-button');
        for (var s = 0; s < shotsBtns.length; s++) {
            shotsBtns[s].style.setProperty('display', 'none', 'important');
        }
    }, 50);

    // === 3. РОДНЫЕ ХУКИ ЛАМПЫ (ДЛЯ ТРЕЙЛЕРОВ И SHOTS) ===
    // Обернуты в try-catch, чтобы если Лампа затупит, наш плагин не крашнулся
    function initLampaHooks() {
        try {
            // Удаляем кнопку Трейлеры
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite') {
                    e.object.activity.render().find('.view--trailer').remove();
                }
            });

            // Отключаем строки Shots в ядре
            Lampa.Storage.set('content_rows_shots_main', 'false');
            
            const originalAdd = Lampa.ContentRows.add;
            if (originalAdd) {
                Lampa.ContentRows.add = function(row) {
                    if (row && row.name === 'shots_main') return;
                    return originalAdd.call(this, row);
                };
            }

            // Вырезаем Shots из бокового меню
            Lampa.Listener.follow('menu', (e) => {
                if (e.type === 'end' || e.type === 'start') {
                    setTimeout(() => {
                        const menu = Lampa.Menu.render();
                        if (menu && menu.length) {
                            menu.find('.menu__item').each(function() {
                                const $item = $(this);
                                const text = $item.find('.menu__text').text();
                                if (text && text.toLowerCase().indexOf('shots') >= 0) $item.remove();
                            });
                        }
                    }, 100);
                }
            });
            
        } catch (e) {
            console.log('Custom Cleaner Error', e);
        }
    }

    // Запускаем хуки, когда Лампа готова
    if (window.appready) {
        initLampaHooks();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') initLampaHooks();
        });
    }

})();
