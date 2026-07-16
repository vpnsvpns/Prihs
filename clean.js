(function () {
    'use strict';

    if (window.clean_lampa_ui_v9) return;
    window.clean_lampa_ui_v9 = true;

    // --- 1. CSS ЧАСТЬ (Шапка и кнопка Play) ---
    var css = `
        /* Шапка: только поиск, настройки и навигация */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
            display: none !important;
        }

        /* Шапка: скрываем точки соединения (статусы) */
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status {
            display: none !important;
        }

        /* Кнопка "Смотреть" всегда развернута и с текстом */
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
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // --- 2. JS ЧАСТЬ (Скрытие источников в поиске) ---
    // Проверяем интерфейс каждые полсекунды на наличие лишних кнопок в поиске
    setInterval(function() {
        var searchItems = document.querySelectorAll('.search__source, .search__tab, .selector__item');
        
        searchItems.forEach(function(el) {
            var text = (el.innerText || el.textContent || '').trim().toLowerCase();
            
            if (text === 'cinema' || text === 'cinema anime' || text === 'ai ассистент') {
                el.style.display = 'none';
            }
        });
    }, 500);

    console.log('Clean Lampa UI Plugin v9 loaded: Header cleaned, Play expanded, Search filtered.');
})();
