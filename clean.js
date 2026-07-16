(function () {
    'use strict';

    if (window.clean_lampa_ui_v15) return;
    window.clean_lampa_ui_v15 = true;

    // --- 1. CSS ЧАСТЬ ---
    var css = `
        /* Шапка: только поиск, настройки и навигация */
        .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { display: none !important; }
        .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; }

        /* Кнопка "Смотреть" всегда развернута */
        .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
        .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }

        /* Вырезаем Shots и Трейлеры из всех меню (Настройки, Источник/Смотреть) через системные атрибуты */
        [data-action="shots"], [data-type="shots"], .button--shots,
        [data-action="trailer"], [data-type="trailer"], .button--trailer,
        .settings__item[data-action="shots"] {
            display: none !important;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // --- 2. JS ЧАСТЬ (Умный перехватчик) ---
    function checkAndHide(node) {
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;

        // 1. Убираем мусор из поиска
        if (node.classList && (node.classList.contains('selector__item') || node.classList.contains('search__source') || node.classList.contains('search-sources__item'))) {
            var text = (node.textContent || '').trim().toLowerCase();
            if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент') {
                node.style.setProperty('display', 'none', 'important');
            }
        }

        // 2. Резервная зачистка Трейлеров и Shots по тексту (если CSS не справится)
        if (node.classList && (node.classList.contains('button') || node.classList.contains('settings__item') || node.classList.contains('selector__item'))) {
            var btnText = (node.textContent || '').trim().toLowerCase();
            if (btnText.indexOf('трейлеры') !== -1 || btnText === 'shots' || btnText.indexOf('смотреть нарезки') !== -1) {
                node.style.setProperty('display', 'none', 'important');
            }
        }

        // 3. Убираем целые строки с Главной (раздел Shots и подборки по Актёрам)
        if (node.classList && (node.classList.contains('line__title') || node.classList.contains('scroll__title') || node.classList.contains('card__title'))) {
            var titleText = (node.textContent || '').trim().toLowerCase();
            
            // Проверяем, есть ли картинка внутри заголовка (это верный признак, что это строка актёра)
            var hasAvatar = node.querySelector('img') || node.querySelector('.line__avatar');
            
            if (titleText === 'shots' || hasAvatar) {
                // Ищем контейнер всей этой строки (саму карусель) и прячем её целиком
                var rowContainer = node.closest('.line, .scroll, .scroll-line, .section');
                if (rowContainer) {
                    rowContainer.style.setProperty('display', 'none', 'important');
                } else {
                    // Резервный метод: прячем заголовок и следующий за ним блок контента
                    node.style.setProperty('display', 'none', 'important');
                    if (node.nextElementSibling) node.nextElementSibling.style.setProperty('display', 'none', 'important');
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
                        // Проверяем вложенные элементы
                        var children = node.querySelectorAll('*');
                        for (var i = 0; i < children.length; i++) {
                            checkAndHide(children[i]);
                        }
                    }
                });
            }
        });
    });

    // Запуск слежки за изменениями интерфейса
    observer.observe(document.body, { childList: true, subtree: true });

    // Первичный проход по уже загруженным элементам
    var existingNodes = document.querySelectorAll('*');
    for (var j = 0; j < existingNodes.length; j++) {
        if (existingNodes[j].nodeType === Node.ELEMENT_NODE) {
            checkAndHide(existingNodes[j]);
        }
    }

    console.log('Clean Lampa UI Plugin v15 loaded: Shots, Trailers and Actor lines nuked.');
})();
