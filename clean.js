(function () {
    'use strict';

    if (window.clean_header_plugin_v5) return;
    window.clean_header_plugin_v5 = true;

    var css = `
        /* Скрываем всё лишнее в верхней панели */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }

        /* Скрываем индикаторы статуса (точки) */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status {
            display: none !important;
        }

        /* Скрываем кнопки Жанр, Производство, Теги в карточке фильма */
        .full-start__tags,
        .full-info__tags,
        .info__tags,
        .button--tag {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log('Clean Header & UI Plugin v5 loaded');
})();
