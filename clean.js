(function () {
    'use strict';

    if (window.clean_header_plugin_v7) return;
    window.clean_header_plugin_v7 = true;

    var css = `
        /* 1. Шапка: оставляем только поиск, настройки и навигацию */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }

        /* 2. Шапка: скрываем индикаторы статуса (точки соединения) */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status {
            display: none !important;
        }

        /* 3. Карточка фильма: кнопка "Смотреть" всегда широкая с текстом */
        .full-start__button.button--play {
            width: auto !important;
            min-width: 160px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
        }
        .full-start__button.button--play span,
        .full-start__button.button--play div:not(.full-start__icon) {
            display: inline-block !important;
            opacity: 1 !important;
            visibility: visible !important;
            width: auto !important;
            margin-left: 10px !important;
        }

        /* 4. Карточка фильма: ЖЕСТКО УБИВАЕМ 3 ТОЧКИ */
        /* Бьем по всем известным атрибутам этой кнопки в разных версиях Lampa */
        .full-start__buttons > div[data-action="more"],
        .full-start__buttons > div[data-action="menu"],
        .full-start__buttons > div.button--more,
        .full-start__buttons > div[class*="more"],
        /* Если классы другие, просто глушим 4-ю кнопку в ряду */
        .full-start__buttons > div:nth-child(4) {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log('Clean Header & UI Plugin v7 loaded: Nuked the 3 dots');
})();
