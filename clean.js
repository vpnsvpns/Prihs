(function () {
    'use strict';

    function startPlugin() {
        // 1. CSS-стили для точечной настройки интерфейса
        var style = document.createElement('style');
        style.innerHTML = `
            /* === ШАПКА (ВЕРХНЯЯ ПАНЕЛЬ) === */
            /* Скрываем всё лишнее: логотип, меню, трансляцию (cast), уведомления, профиль и полноэкранный режим */
            .header__logo, 
            .header__logo-box, 
            .header__menu, 
            .header__nav, 
            .header__cast, 
            .header__bell, 
            .header__user, 
            .header__profile, 
            .header__fullscreen,
            .header__notification,
            .header__icon:has(svg[class*="cast"]),
            .header__icon:has(svg[class*="bell"]),
            .header__icon:has(svg[class*="user"]),
            .header__icon:has(svg[class*="fullscreen"]) { 
                display: none !important; 
            }
            
            /* Гарантируем, что Поиск, Настройки и Время/Дата всегда видны */
            .header__search, 
            .header__settings, 
            .header__time {
                display: flex !important;
            }

            /* === КНОПКА "СМОТРЕТЬ" === */
            /* Показываем текст ТОЛЬКО у главной кнопки "Смотреть" (.full-start__button) */
            .full-start__button span {
                display: inline-block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: auto !important;
                transform: none !important;
                margin-left: 0.8em !important;
            }
        `;
        document.head.appendChild(style);

        // 2. JS-логика для скрытия кнопок "Подписаться" (колокольчик) и "Три точки" (ещё)
        function cleanCardButtons() {
            // Находим все кнопки в блоке действий на странице фильма
            var buttons = document.querySelectorAll('.full-start__buttons .button, .full-start__button-more');
            buttons.forEach(function (btn) {
                var svg = btn.querySelector('svg use');
                var btnText = (btn.innerText || btn.textContent || '').toLowerCase();
                
                if (svg) {
                    var href = (svg.getAttribute('xlink:href') || svg.getAttribute('href') || '').toLowerCase();
                    
                    // Скрываем по иконке (колокольчик или три точки)
                    if (
                        href.indexOf('bell') !== -1 || 
                        href.indexOf('subscribe') !== -1 || 
                        href.indexOf('more') !== -1 ||
                        href.indexOf('dots') !== -1
                    ) {
                        btn.style.setProperty('display', 'none', 'important');
                    }
                }
                
                // Дополнительная проверка по тексту кнопки на случай изменений в шаблоне
                if (btnText.indexOf('подписаться') !== -1 || btnText.indexOf('еще') !== -1 || btnText.indexOf('ещё') !== -1) {
                    btn.style.setProperty('display', 'none', 'important');
                }
            });
        }

        // Следим за открытием карточек через MutationObserver (работает моментально)
        var observer = new MutationObserver(function () {
            if (document.querySelector('.full-start__buttons')) {
                cleanCardButtons();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Запуск плагина
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
