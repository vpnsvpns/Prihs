(function () {
    'use strict';

    function startPlugin() {
        // 1. Внедряем CSS-стили для изменения шапки и кнопки "Смотреть"
        var style = document.createElement('style');
        style.innerHTML = `
            /* === ВЕРХНЯЯ ПАНЕЛЬ === */
            /* Скрываем логотип */
            .header__logo, .header__logo-box { 
                display: none !important; 
            }
            
            /* Скрываем вкладки навигации (Фильмы, Сериалы, Аниме и т.д.) */
            .header__menu, .header__nav { 
                display: none !important; 
            }
            
            /* Оставляем видимыми только Поиск, Настройки и Время */
            .header__search, .header__settings, .header__time {
                display: flex !important;
            }

            /* === КНОПКА "СМОТРЕТЬ" === */
            /* Заставляем текст внутри кнопки "Смотреть" (и соседних) быть видимым всегда, а не только при наведении */
            .full-start__button span,
            .full-start__buttons .button span {
                display: inline-block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: auto !important;
                transform: none !important;
                margin-left: 0.5em !important;
            }
        `;
        document.head.appendChild(style);

        // 2. JS-логика для скрытия кнопок "Колокольчик" и "Три точки" на странице фильма
        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'start' && e.component === 'full') {
                // Ждем рендера карточки и скрываем ненужные кнопки
                setTimeout(function () {
                    var buttons = document.querySelectorAll('.full-start__buttons .button, .full-start__button');
                    buttons.forEach(function (btn) {
                        var svg = btn.querySelector('svg use');
                        if (svg) {
                            var href = svg.getAttribute('xlink:href') || svg.getAttribute('href') || '';
                            // Скрываем колокольчик (подписка) и три точки (еще)
                            if (href.indexOf('bell') !== -1 || href.indexOf('subscribe') !== -1 || href.indexOf('more') !== -1) {
                                btn.style.display = 'none';
                            }
                        }
                    });
                }, 10);
            }
        });
    }

    // Запуск плагина после готовности Lampa
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
