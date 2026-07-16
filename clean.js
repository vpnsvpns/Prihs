(function () {
    'use strict';

    if (window.clean_lampa_ui_v10) return;
    window.clean_lampa_ui_v10 = true;

    // --- 1. CSS ЧАСТЬ ---
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

        /* Пытаемся скрыть источники поиска через CSS атрибуты (на случай, если они есть) */
        [data-name="Cinema"], [data-name="cinema"],
        [data-name="Cinema - Anime"], [data-name="cinema - anime"],
        [data-name="AI-ассистент"], [data-name="ai-ассистент"] {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // --- 2. АГРЕССИВНЫЙ JS ЧАСТЬ ---
    setInterval(function() {
        // Берем все элементы, которые могут быть кнопками выбора в Lampa
        var items = document.querySelectorAll('.selector__item, .search-sources__item, .search__source, .button, [class*="source"]');
        
        items.forEach(function(el) {
            if (el.innerText) {
                var text = el.innerText.trim().toLowerCase();
                
                // Ищем точное совпадение с учетом дефисов и пробелов
                if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент') {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }, 300); // Таймер на 300мс, чтобы убивать кнопки быстрее, чем глаз заметит

    console.log('Clean Lampa UI Plugin v10 loaded: Bruteforce search cleanup active.');
})();
