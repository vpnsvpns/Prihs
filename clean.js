(function () {
    'use strict';

    if (window.clean_lampa_ui_v11) return;
    window.clean_lampa_ui_v11 = true;

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
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // --- 2. JS ЧАСТЬ (Мгновенное скрытие без моргания) ---
    var observer = new MutationObserver(function(mutations) {
        // Ищем все элементы, которые похожи на кнопки в поиске
        var searchItems = document.querySelectorAll('.selector__item, .search__source, .search-sources__item, .button');
        
        searchItems.forEach(function(el) {
            // Если мы уже скрыли эту кнопку, пропускаем, чтобы не грузить процессор
            if (el.dataset.hiddenByPlugin) return; 
            
            var text = (el.textContent || el.innerText || '').trim().toLowerCase();
            
            // Если текст совпадает — мгновенно глушим
            if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент') {
                el.style.setProperty('display', 'none', 'important');
                el.dataset.hiddenByPlugin = 'true'; // Ставим метку
            }
        });
    });

    // Запускаем наблюдатель за всем интерфейсом Lampa
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Clean Lampa UI Plugin v11 loaded: Observer active (no blink).');
})();
