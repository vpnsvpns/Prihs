/**
 * Lampa UI Modifier Plugin
 * Убирает лишние элементы из верхней панели и удаляет трейлеры
 */

(function() {
    'use strict';

    const Plugin = {
        name: 'UI Modifier',
        version: '1.0.0',
        description: 'Оставляет только поиск, настройки и время в верхней панели. Убирает трейлеры.',

        init: function() {
            this.modifyTopPanel();
            this.removeTrailers();
            this.observeDOM();
        },

        // Модификация верхней панели
        modifyTopPanel: function() {
            const self = this;
            
            function cleanTopBar() {
                // Находим верхнюю панель
                const topBar = document.querySelector('.top-panel, .header, .top-bar, [class*="top"], [class*="header"]');
                
                if (topBar) {
                    // Находим все элементы в панели
                    const allElements = topBar.querySelectorAll('*');
                    
                    allElements.forEach(function(el) {
                        // Проверяем каждый элемент
                        const isSearch = el.querySelector('[class*="search"]') || 
                                       el.querySelector('[class*="поиск"]') ||
                                       el.querySelector('svg') && el.textContent.includes('search');
                        
                        const isSettings = el.querySelector('[class*="settings"]') || 
                                         el.querySelector('[class*="настройки"]') ||
                                         el.querySelector('.gear, .cog') ||
                                         (el.querySelector('svg') && el.getAttribute('aria-label') === 'Settings');
                        
                        const isDateTime = el.querySelector('[class*="time"]') || 
                                         el.querySelector('[class*="date"]') ||
                                         el.querySelector('.clock') ||
                                         /\d{1,2}:\d{2}/.test(el.textContent);
                        
                        // Если элемент не поиск, не настройки и не время - скрываем
                        if (!isSearch && !isSettings && !isDateTime) {
                            // Проверяем, не является ли это контейнером для важных элементов
                            const hasImportantChildren = el.querySelector('[class*="search"], [class*="settings"], [class*="time"], .clock');
                            
                            if (!hasImportantChildren && el.children.length > 0) {
                                // Если есть дети, проверяем их
                                Array.from(el.children).forEach(function(child) {
                                    if (!self.isElementImportant(child)) {
                                        self.hideElement(child);
                                    }
                                });
                            } else if (!hasImportantChildren) {
                                self.hideElement(el);
                            }
                        }
                    });
                }
            }

            // Альтернативный подход - по конкретным селекторам
            function removeSpecificElements() {
                // Селекторы для элементов, которые нужно убрать
                const selectorsToRemove = [
                    '[class*="notification"]',
                    '[class*="bell"]',
                    '[class*="profile"]',
                    '[class*="user"]',
                    '[class*="account"]',
                    '[aria-label*="notifications"]',
                    '[aria-label*="profile"]',
                    '.icon-bell',
                    '.icon-notification',
                    '.user-profile',
                    '.account-btn'
                ];

                selectorsToRemove.forEach(function(selector) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(function(el) {
                        // Проверяем, не является ли это частью настроек или поиска
                        if (!el.closest('[class*="settings"]') && !el.closest('[class*="search"]')) {
                            self.hideElement(el);
                        }
                    });
                });
            }

            // Запускаем сразу
            cleanTopBar();
            removeSpecificElements();
            
            // И повторяем через небольшие интервалы для надежности
            setTimeout(cleanTopBar, 1000);
            setTimeout(removeSpecificElements, 1000);
            setTimeout(cleanTopBar, 2000);
            setTimeout(removeSpecificElements, 2000);
        },

        // Проверка важности элемента
        isElementImportant: function(el) {
            return el.querySelector('[class*="search"]') || 
                   el.querySelector('[class*="settings"]') ||
                   el.querySelector('[class*="time"]') ||
                   el.querySelector('.clock') ||
                   /\d{1,2}:\d{2}/.test(el.textContent);
        },

        // Скрытие элемента
        hideElement: function(el) {
            if (el && el.style) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.removeAttribute('aria-hidden');
            }
        },

        // Удаление трейлеров
        removeTrailers: function() {
            const self = this;

            function removeTrailersFromSources() {
                // Ищем меню источников
                const sourceMenu = document.querySelector('.source-menu, .sources-list, [class*="источник"]');
                
                if (sourceMenu) {
                    // Ищем элементы с трейлерами
                    const trailerElements = sourceMenu.querySelectorAll('*');
                    trailerElements.forEach(function(el) {
                        const text = el.textContent || el.innerText || '';
                        if (text.toLowerCase().includes('трейлер') || 
                            text.toLowerCase().includes('trailer') ||
                            text.toLowerCase().includes('shots')) {
                            self.hideElement(el);
                            
                            // Также убираем из parent элементов
                            const parent = el.closest('button, div[class*="source-item"], li');
                            if (parent) {
                                self.hideElement(parent);
                            }
                        }
                    });
                }

                // Альтернативные селекторы для трейлеров
                const trailerSelectors = [
                    '[class*="trailer"]',
                    '[class*="трейлер"]',
                    '[class*="shots"]',
                    '[data-type="trailer"]',
                    '[data-type="shots"]',
                    '.trailer-btn',
                    '.watch-trailers',
                    '[aria-label*="trailer"]',
                    '[aria-label*="трейлер"]'
                ];

                trailerSelectors.forEach(function(selector) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(function(el) {
                        self.hideElement(el);
                    });
                });
            }

            // Запускаем сразу
            removeTrailersFromSources();
            
            // И повторяем
            setTimeout(removeTrailersFromSources, 1000);
            setTimeout(removeTrailersFromSources, 2000);
            setTimeout(removeTrailersFromSources, 5000);
        },

        // Наблюдение за изменениями DOM
        observeDOM: function() {
            const self = this;
            
            // Создаем Observer для отслеживания изменений
            const observer = new MutationObserver(function(mutations) {
                let shouldClean = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        shouldClean = true;
                    }
                });
                
                if (shouldClean) {
                    // Небольшая задержка чтобы дать DOM обновиться
                    setTimeout(function() {
                        self.modifyTopPanel();
                        self.removeTrailers();
                    }, 100);
                }
            });

            // Начинаем наблюдение
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Также наблюдаем за навигацией
            const navObserver = new MutationObserver(function() {
                setTimeout(function() {
                    self.modifyTopPanel();
                    self.removeTrailers();
                }, 300);
            });

            // Находим навигационные элементы
            const navElements = document.querySelectorAll('nav, .navigation, .menu');
            navElements.forEach(function(nav) {
                navObserver.observe(nav, {
                    childList: true,
                    subtree: true
                });
            });
        }
    };

    // Инициализация плагина
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Plugin.init();
        });
    } else {
        Plugin.init();
    }

    // Экспортируем для возможного использования
    if (typeof window.LampaPlugins === 'undefined') {
        window.LampaPlugins = {};
    }
    window.LampaPlugins.UIModifier = Plugin;

})();