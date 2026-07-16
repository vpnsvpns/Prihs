(function () {
    'use strict';

    if (window.clean_lampa_ui_v13) return;
    window.clean_lampa_ui_v13 = true;

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

        /* Меню онлайн-просмотра: скрываем локальную кнопку поиска (возле фильтра) */
        .view--online .button--search,
        .view--online [data-action="search"],
        .online-search,
        .full-start__buttons [data-action="search"]:not(.head__action) {
            display: none !important;
        }

        /* Меню онлайн-просмотра: скрываем блок истории (страховка для JS) */
        .online-history,
        .view--history,
        .history-item,
        .torrent-item[data-id="history"] {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // --- 2. JS ЧАСТЬ (Мгновенное скрытие по тексту) ---
    function checkAndHide(node) {
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;

        var text = (node.textContent || '').trim().toLowerCase();
        
        // Добавили 'нет истории просмотра' в расстрельный список
        if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент' || text === 'нет истории просмотра') {
            node.style.setProperty('display', 'none', 'important');
            
            if (node.parentElement) {
                var parentText = (node.parentElement.textContent || '').trim().toLowerCase();
                if (parentText === text) {
                    node.parentElement.style.setProperty('display', 'none', 'important');
                }
            }
        }
    }

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        checkAndHide(node);
                        var children = node.querySelectorAll('*');
                        for (var i = 0; i < children.length; i++) {
                            checkAndHide(children[i]);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    var existingNodes = document.querySelectorAll('*');
    for (var j = 0; j < existingNodes.length; j++) {
        checkAndHide(existingNodes[j]);
    }

    console.log('Clean Lampa UI Plugin v13 loaded: Online search and history nuked.');
})();
