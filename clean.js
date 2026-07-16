(function () {
    'use strict';

    if (window.clean_lampa_ui_v12) return;
    window.clean_lampa_ui_v12 = true;

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

    // --- 2. JS ЧАСТЬ (Мгновенное скрытие без моргания) ---
    function checkAndHide(node) {
        // Игнорируем технические узлы браузера
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;

        var text = (node.textContent || '').trim().toLowerCase();
        
        // Бьем точно по тексту
        if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент') {
            node.style.setProperty('display', 'none', 'important');
            
            // Если мы скрыли внутренний текст (например, <span>), 
            // скрываем и саму кнопку (родительский <div>), чтобы не было пустых квадратов
            if (node.parentElement) {
                var parentText = (node.parentElement.textContent || '').trim().toLowerCase();
                if (parentText === text) {
                    node.parentElement.style.setProperty('display', 'none', 'important');
                }
            }
        }
    }

    // Наблюдатель, который ловит элементы ДО их отрисовки на экране
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        checkAndHide(node);
                        // Проверяем все внутренние теги добавленного блока
                        var children = node.querySelectorAll('*');
                        for (var i = 0; i < children.length; i++) {
                            checkAndHide(children[i]);
                        }
                    }
                });
            }
        });
    });

    // Запускаем перехватчик на весь интерфейс
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Делаем один проход по уже отрисованным элементам (если скрипт загрузился чуть позже интерфейса)
    var existingNodes = document.querySelectorAll('*');
    for (var j = 0; j < existingNodes.length; j++) {
        checkAndHide(existingNodes[j]);
    }

    console.log('Clean Lampa UI Plugin v12 loaded: Zero-delay observer active.');
})();
