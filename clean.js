(function () {
    'use strict';

    if (window.clean_header_plugin) return;
    window.clean_header_plugin = true;

    var css = `
        /* Скрываем трансляцию, уведомления, полноэкранный режим и премиум-иконку */
        .head__action.open--broadcast,
        .head__action.open--notice,
        .head__action[data-action="fullscreen"],
        .head__action.open--premium {
            display: none !important;
        }
        
        /* На случай если появятся другие нестандартные иконки справа, 
           скрываем всё, кроме нужных нам и базовой навигации */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--profile):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log('Clean Header Plugin loaded');
})();