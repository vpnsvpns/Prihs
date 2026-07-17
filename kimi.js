
(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // Lampa UI Cleaner & Shots Remover v17.1.8
    // Senior JavaScript Developer Edition — FIXED v8
    // Auto-click Cinema in source panel + unified Select interception
    // ═══════════════════════════════════════════════════════════════

    const PLUGIN_NAME = 'LampaCleanUI';
    const PLUGIN_VERSION = '17.1.8';

    // ─── Guard against double initialization ───
    if (window.__lampaCleanUIInitialized) {
        console.log('[' + PLUGIN_NAME + ' v' + PLUGIN_VERSION + '] Already initialized, skipping.');
        return;
    }
    window.__lampaCleanUIInitialized = true;

    console.log('[' + PLUGIN_NAME + ' v' + PLUGIN_VERSION + '] Initializing...');

    // ═══════════════════════════════════════════════════════════════
    // 1. INJECT CSS STYLES (Static UI cleanup)
    // ═══════════════════════════════════════════════════════════════

    function injectStyles() {
        const css = `
            /* ─── HEADER: Hide status indicators (green dot etc.) ─── */
            .head__status,
            .head__state,
            .head__server,
            .cub-status,
            .sync-status,
            .head .status,
            .head__action .status,
            .head__action.status,
            [class*="status"] {
                display: none !important;
            }

            /* ─── HEADER: Hide unwanted buttons ONLY inside .head__actions container ─── */
            .head__actions .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) {
                display: none !important;
            }

            /* ─── WATCH BUTTON EXPANSION ─── */
            .full-start__button.button--play {
                width: auto !important;
                min-width: 160px !important;
            }

            .full-start__button.button--play .icon,
            .full-start__button.button--play svg,
            .full-start__button.button--play span {
                display: inline-block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            /* ─── FULL CARD: Hide Genre, Production, Tags buttons ─── */
            .full-start__tags,
            .full-start__tag,
            .full-start__button.tag-button,
            .full-start__button[data-type="genre"],
            .full-start__button[data-type="production"],
            .full-start__button[data-type="tag"],
            .full-start__tags .button,
            .full-start__tags .full-start__button {
                display: none !important;
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = 'lampa-clean-ui-styles';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. INSTANT DYNAMIC CLEANUP via MutationObserver
    // ═══════════════════════════════════════════════════════════════

    function startMutationObserver() {
        var observer = new MutationObserver(function(mutations) {
            var needsCleanup = false;
            var hasNewNodes = false;

            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    needsCleanup = true;
                    hasNewNodes = true;
                }
            });

            if (needsCleanup) {
                cleanupSearchSources();
                cleanupMainScreenLines();
                cleanupFullCardButtons();
                cleanupMoreButton();
            }

            // Auto-click Cinema in source panel whenever DOM changes
            if (hasNewNodes) {
                autoClickCinemaSource();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Run once immediately
        cleanupSearchSources();
        cleanupMainScreenLines();
        cleanupFullCardButtons();
        cleanupMoreButton();
        autoClickCinemaSource();
    }

    // Fallback interval
    function startFallbackInterval() {
        setInterval(function() {
            try {
                cleanupSearchSources();
                cleanupMainScreenLines();
                cleanupFullCardButtons();
                cleanupMoreButton();
                autoClickCinemaSource();
            } catch (e) {}
        }, 300);
    }

    function cleanupSearchSources() {
        var allButtons = document.querySelectorAll('.button, .item, .selector__item, [class*="source"], [class*="selector"]');

        for (var i = 0; i < allButtons.length; i++) {
            var el = allButtons[i];
            var text = (el.textContent || '').toLowerCase().trim();

            if (text === 'cinema' || text === 'cinema - anime' || text === 'ai-ассистент') {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.setAttribute('hidden', 'hidden');
            }
        }
    }

    function cleanupMainScreenLines() {
        var lines = document.querySelectorAll('.line, .scroll, .section');

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            var titleEl = line.querySelector('.line__title, .scroll__title, .section__title');
            var titleText = titleEl ? (titleEl.textContent || '').toLowerCase().trim() : '';

            var hasAvatarInTitle = false;
            if (titleEl) {
                var avatars = titleEl.querySelectorAll('img, .line__avatar, .avatar, [class*="avatar"]');
                hasAvatarInTitle = avatars.length > 0;
            }

            if (titleText === 'shots' || hasAvatarInTitle) {
                line.style.display = 'none';
            }
        }
    }

    function cleanupFullCardButtons() {
        var tagButtons = document.querySelectorAll('.full-start__tags .button, .full-start__tags .full-start__button, .full-start__tag, .full-start__tags .item');

        for (var i = 0; i < tagButtons.length; i++) {
            var el = tagButtons[i];
            var text = (el.textContent || '').toLowerCase().trim();

            if (text.indexOf('жанр') >= 0 || 
                text.indexOf('производство') >= 0 || 
                text.indexOf('тег') >= 0 ||
                text.indexOf('genre') >= 0 ||
                text.indexOf('production') >= 0 ||
                text.indexOf('tag') >= 0) {
                el.style.display = 'none';
            }
        }
    }

    function cleanupMoreButton() {
        var buttons = document.querySelectorAll('.full-start__buttons .full-start__button');

        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var btnText = (btn.textContent || '').trim();
            var dataAction = btn.getAttribute('data-action') || '';

            var svg = btn.querySelector('svg');
            var circles = svg ? svg.querySelectorAll('circle').length : 0;

            var isEmptyWithCircles = btnText === '' && circles >= 3;
            var isMoreAction = dataAction === 'more' || dataAction.indexOf('more') >= 0;

            if (isEmptyWithCircles || isMoreAction) {
                btn.style.display = 'none';
            }
        }

        var buttonContainers = document.querySelectorAll('.full-start__buttons');
        for (var j = 0; j < buttonContainers.length; j++) {
            var container = buttonContainers[j];
            var btnList = container.querySelectorAll('.full-start__button');
            if (btnList.length >= 4) {
                var lastBtn = btnList[btnList.length - 1];
                var lastText = (lastBtn.textContent || '').trim();
                var lastSvg = lastBtn.querySelector('svg');
                if (lastText === '' && lastSvg && lastSvg.querySelectorAll('circle').length >= 3) {
                    lastBtn.style.display = 'none';
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. AUTO-CLICK CINEMA IN SOURCE PANEL
    // When source panel opens with Cinema as only option, auto-click it
    // ═══════════════════════════════════════════════════════════════

    var autoClickTriggered = false;

    function autoClickCinemaSource() {
        // Find source panels that are currently visible
        // Look for panels with title "Источник" or "Source" or "Онлайн"
        var panels = document.querySelectorAll('.select, .selector, .modal, [class*="source"], [class*="online"]');

        for (var i = 0; i < panels.length; i++) {
            var panel = panels[i];

            // Check if panel is visible
            var style = window.getComputedStyle(panel);
            if (style.display === 'none' || style.visibility === 'hidden') continue;

            // Check panel title
            var titleEl = panel.querySelector('.select__title, .modal__title, .selector__title, h1, h2, h3, .title');
            var titleText = titleEl ? (titleEl.textContent || '').toLowerCase() : '';

            var isSourcePanel = titleText.indexOf('источник') >= 0 || 
                               titleText.indexOf('source') >= 0 || 
                               titleText.indexOf('онлайн') >= 0 ||
                               titleText.indexOf('online') >= 0;

            // Also check if this is the right-side panel (source panel in full card)
            var rect = panel.getBoundingClientRect();
            var isRightPanel = rect.left > window.innerWidth * 0.5;

            if (isSourcePanel || isRightPanel) {
                // Find Cinema item in this panel
                var items = panel.querySelectorAll('.item, .button, .selector__item, .select__item');
                var cinemaItems = [];

                for (var j = 0; j < items.length; j++) {
                    var item = items[j];
                    var itemText = (item.textContent || '').toLowerCase().trim();

                    if (itemText.indexOf('cinema') >= 0) {
                        cinemaItems.push(item);
                    }
                }

                // If only Cinema is present (or Cinema + hidden items), auto-click it
                if (cinemaItems.length > 0 && !autoClickTriggered) {
                    autoClickTriggered = true;
                    console.log('[' + PLUGIN_NAME + '] Auto-clicking Cinema source...');

                    // Simulate click on Cinema item
                    setTimeout(function() {
                        var cinemaItem = cinemaItems[0];

                        // Try jQuery click first
                        if (window.$ && $(cinemaItem).length) {
                            $(cinemaItem).trigger('click');
                            $(cinemaItem).trigger('hover:enter');
                        }

                        // Try native click
                        var clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        cinemaItem.dispatchEvent(clickEvent);

                        // Try hover:enter event (Lampa's spatial navigation)
                        var hoverEvent = new CustomEvent('hover:enter', {
                            bubbles: true,
                            cancelable: true
                        });
                        cinemaItem.dispatchEvent(hoverEvent);

                        // Reset flag after a delay
                        setTimeout(function() {
                            autoClickTriggered = false;
                        }, 1000);
                    }, 100);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. UNIFIED Select.show INTERCEPTION
    // Handles: Shots removal + Cinema auto-select in modal selectors
    // ═══════════════════════════════════════════════════════════════

    function initSelectInterception() {
        if (!Lampa.Select || !Lampa.Select.show) return;

        var originalSelectShow = Lampa.Select.show;

        Lampa.Select.show = function(options) {
            if (!options) return originalSelectShow.call(this, options);

            // ─── Step 1: Filter out Shots items ───
            if (options.items && Lampa.Arrays.isArray(options.items)) {
                options.items = options.items.filter(function(item) {
                    if (!item) return true;

                    if (item.btn) {
                        var btn = $(item.btn);
                        var isShots = btn.hasClass('shots-view-button') || 
                            (btn.hasClass('view--online') && btn.find('use[xlink\:href="#sprite-shots"]').length > 0) ||
                            btn.find('.shots-view-button__title').length > 0;
                        if (isShots) return false;
                    }

                    var itemTitle = (item.title || item.text || item.name || '').toLowerCase();
                    if (itemTitle.indexOf('shots') >= 0) return false;
                    if (item.icon && item.icon.indexOf('sprite-shots') >= 0) return false;

                    return true;
                });
            }

            // ─── Step 2: Detect if this is a source selector ───
            var isSourceSelector = false;
            var selectorTitle = '';

            if (options.title) {
                selectorTitle = options.title.toLowerCase();
                if (selectorTitle.indexOf('источник') >= 0 || 
                    selectorTitle.indexOf('source') >= 0 || 
                    selectorTitle.indexOf('онлайн') >= 0 ||
                    selectorTitle.indexOf('online') >= 0) {
                    isSourceSelector = true;
                }
            }

            var hasCinema = false;
            var cinemaIndex = -1;
            var cinemaItem = null;

            if (options.items && Lampa.Arrays.isArray(options.items)) {
                for (var i = 0; i < options.items.length; i++) {
                    var item = options.items[i];
                    if (!item) continue;

                    var itemTitle = (item.title || item.text || item.name || '').toLowerCase();

                    if (itemTitle.indexOf('cinema') >= 0) {
                        hasCinema = true;
                        cinemaIndex = i;
                        cinemaItem = item;
                    }
                }
            }

            // ─── Step 3: Auto-select Cinema if this is a source selector ───
            if (isSourceSelector && hasCinema && cinemaIndex >= 0 && cinemaItem) {
                console.log('[' + PLUGIN_NAME + '] Auto-selecting Cinema from Select.show...');

                setTimeout(function() {
                    if (typeof options.onSelect === 'function') {
                        options.onSelect(cinemaItem, cinemaIndex);
                        return;
                    }
                    if (cinemaItem.onSelect) {
                        cinemaItem.onSelect(cinemaItem, cinemaIndex);
                        return;
                    }
                    if (typeof cinemaItem.select === 'function') {
                        cinemaItem.select();
                        return;
                    }
                }, 10);
            }

            return originalSelectShow.call(this, options);
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. TRAILER REMOVAL (Native Lampa event)
    // ═══════════════════════════════════════════════════════════════

    function initTrailerRemoval() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                try {
                    e.object.activity.render().find('.view--trailer').remove();
                } catch (err) {}
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. DEEP SHOTS REMOVAL (Storage, Menu, Player, Components)
    // ═══════════════════════════════════════════════════════════════

    function initDeepShotsRemoval() {
        // Disable shots in storage
        Lampa.Storage.set('content_rows_shots_main', 'false');

        // ─── Intercept ContentRows.add ───
        var originalAdd = Lampa.ContentRows.add;
        if (originalAdd) {
            Lampa.ContentRows.add = function(row) {
                if (row && row.name === 'shots_main') return;

                if (row && row.screen && Lampa.Arrays.isArray(row.screen) && 
                    row.screen.indexOf('bookmarks') >= 0) {
                    if (typeof row.call === 'function') {
                        var callStr = row.call.toString();
                        if (callStr.indexOf('shots_title_favorite') >= 0 || 
                            callStr.indexOf('shots_title_created') >= 0 || 
                            (callStr.indexOf('Favorite.get') >= 0 && 
                             callStr.indexOf('Created.get') >= 0 && 
                             callStr.indexOf('shots') >= 0)) {
                            return;
                        }
                    }
                }
                return originalAdd.call(this, row);
            };
        }

        // ─── Intercept ContentRows.call ───
        var originalCall = Lampa.ContentRows.call;
        if (originalCall) {
            Lampa.ContentRows.call = function(screen, params, calls) {
                Lampa.Storage.set('content_rows_shots_main', 'false');
                var result = originalCall.call(this, screen, params, calls);

                if (Lampa.Arrays.isArray(calls)) {
                    for (var i = calls.length - 1; i >= 0; i--) {
                        var callItem = calls[i];
                        if (callItem && typeof callItem === 'object') {
                            if (callItem.title === 'Shots' || 
                                (callItem.icon_svg && callItem.icon_svg.indexOf('sprite-shots') >= 0) || 
                                (callItem.results && Lampa.Arrays.isArray(callItem.results) && 
                                 callItem.results.length > 0 && 
                                 callItem.results[0].type === 'shot')) {
                                calls.splice(i, 1);
                            }
                        }
                    }
                }
                return result;
            };
        }

        // ─── Menu cleanup ───
        Lampa.Listener.follow('menu', function(e) {
            if (e.type === 'end' || e.type === 'start') {
                setTimeout(function() {
                    try {
                        var menu = Lampa.Menu.render();
                        if (menu && menu.length) {
                            menu.find('.menu__item').each(function() {
                                var $item = $(this);
                                var text = $item.find('.menu__text').text();
                                var hasShotsIcon = $item.find('use[xlink\:href="#sprite-shots"]').length > 0;

                                if ((text && text.toLowerCase().indexOf('shots') >= 0) || hasShotsIcon) {
                                    $item.remove();
                                }
                            });
                        }
                    } catch (err) {}
                }, 100);
            }
        });

        // ─── Full card cleanup ───
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                try {
                    var render = e.object.activity.render();
                    if (render && render.length) {
                        render.find('.shots-view-button, [class*="shots-view"], .view--online.shots-view-button').remove();

                        var buttonsContainer = render.find('.buttons--container');
                        if (buttonsContainer.length) {
                            buttonsContainer.find('.shots-view-button, [class*="shots-view"], .view--online.shots-view-button').remove();
                        }
                    }
                } catch (err) {}
            }
        });

        // ─── Remove Shots components ───
        if (Lampa.Component && Lampa.Component.remove) {
            ['shots_list', 'shots_card', 'shots_channel'].forEach(function(compName) {
                try {
                    Lampa.Component.remove(compName);
                } catch (e) {}
            });
        }

        // ─── Player Shots button removal ───
        function removeShotsPlayerButton() {
            var selector = '[data-controller="player_panel"]';

            if (Lampa.PlayerPanel && Lampa.PlayerPanel.render) {
                var panel = Lampa.PlayerPanel.render();
                panel.find(selector).each(function() {
                    var $btn = $(this);
                    var hasRedCircle = $btn.find('circle[fill="#FF0707"]').length > 0 || 
                        $btn.find('circle[fill="#ff0707"]').length > 0 || 
                        $btn.find('circle[fill="red"]').length > 0 || 
                        ($btn.find('svg circle').length === 2 && 
                         $btn.find('svg circle').eq(1).attr('fill') === '#FF0707');
                    if (hasRedCircle) $btn.remove();
                });
                panel.find('.shots-player-segments, [class*="shots-player"]').remove();
            }

            $(selector).each(function() {
                var $btn = $(this);
                var hasRedCircle = $btn.find('circle[fill="#FF0707"]').length > 0 || 
                    $btn.find('circle[fill="#ff0707"]').length > 0 || 
                    $btn.find('circle[fill="red"]').length > 0 || 
                    ($btn.find('svg circle').length === 2 && 
                     $btn.find('svg circle').eq(1).attr('fill') === '#FF0707');
                if (hasRedCircle) $btn.remove();
            });
        }

        if (Lampa.PlayerPanel && Lampa.PlayerPanel.render) {
            var originalRender = Lampa.PlayerPanel.render;
            Lampa.PlayerPanel.render = function() {
                var result = originalRender.call(this);
                setTimeout(removeShotsPlayerButton, 10);
                return result;
            };
        }

        // ─── Player event cleanup ───
        Lampa.Listener.follow('player', function(e) {
            if (e.type === 'render' || e.type === 'ready' || e.type === 'open' || e.type === 'start') {
                setTimeout(function() {
                    try {
                        $('.shots-player-segments, .shots-player-recorder, [class*="shots-player"]').remove();
                        removeShotsPlayerButton();
                    } catch (err) {}
                }, 50);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    function initAll() {
        console.log('[' + PLUGIN_NAME + ' v' + PLUGIN_VERSION + '] initAll() executing...');

        injectStyles();
        startMutationObserver();
        startFallbackInterval();
        initSelectInterception();
        initTrailerRemoval();
        initDeepShotsRemoval();

        console.log('[' + PLUGIN_NAME + ' v' + PLUGIN_VERSION + '] Initialization complete.');
    }

    // ─── Entry point with app readiness check ───
    if (window.appready) {
        initAll();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                initAll();
            }
        });
    }

})();
