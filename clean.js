(function () {
    'use strict';

    if (window.clean_header_plugin_v6) return;
    window.clean_header_plugin_v6 = true;

    var css = `
        /* 1. Шапка: оставляем только поиск, настройки и навигацию */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }

        /* 2. Шапка: скрываем индикаторы статуса (точки соединения) */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status {
            display: none !important;
        }

        /* 3. Карточка фильма: скрываем кнопку с 3 точками (меню "Ещё") */
        .full-start__button.button--more, 
        .full-start__buttons [data-action="more"],
        .button--more {
            display: none !important;
        }

        /* 4. Карточка фильма: делаем кнопку "Смотреть" всегда широкой и с текстом */
        .full-start__button.button--play {
            width: auto !important;
            min-width: 160px !important; /* Задаем минимальную ширину, чтобы текст точно влез */
            padding-left: 20px !important;
            padding-right: 20px !important;
        }
        
        /* Жестко заставляем текст внутри кнопки отображаться */
        .full-start__button.button--play span,
        .full-start__button.button--play div:not(.full-start__icon) {
            display: inline-block !important;
            opacity: 1 !important;
            visibility: visible !important;
            width: auto !important;
            margin-left: 10px !important; /* Небольшой отступ от иконки */
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log('Clean Header & UI Plugin v6 loaded');
})();
