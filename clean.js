(function () {
    'use strict';

    if (window.clean_header_plugin_v3) return;
    window.clean_header_plugin_v3 = true;

    var css = `
        /* Оставляем только поиск, настройки и навигацию. Все остальные кнопки скрываем */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }

        /* Скрываем индикаторы статуса (те самые три некликабельные точки) */
        .head__status,
        .head__state,
        .head__server,
        .cub-status,
        .sync-status,
        .head .status {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log('Clean Header Plugin v3 loaded: Action buttons and Status indicator removed');
})();
