(function () {
    'use strict';

    if (window.clean_header_plugin_v8) return;
    window.clean_header_plugin_v8 = true;

    var css = `
        /* 1. Шапка: только поиск, настройки и навигация */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }

        /* 2. Шапка: скрываем точки соединения */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status {
            display: none !important;
        }

        /* 3. Карточка фильма: кнопка "Смотреть" всегда развернута */
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

        /* 4. ЖЕСТКОЕ УДАЛЕНИЕ 3 ТОЧЕК */
        /* Бьем по порядковому номеру: скрываем 4-ю кнопку и все последующие в этом блоке */
        .full-start__buttons > *:nth-child(n+4) {
            display: none !important;
        }
        
        /* Добивочные правила по всем возможным названиям */
        [data-action="more"],
        .button--more,
        .open--more,
        .full-start__button[data-action="more"] {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log('Clean Header & UI Plugin v8 loaded: Bruteforce removed the 3 dots');
})();
