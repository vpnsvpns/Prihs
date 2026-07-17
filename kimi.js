
(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // Lampa UI Cleaner & Shots Remover v17.1.2
    // Senior JavaScript Developer Edition — FIXED
    // ═══════════════════════════════════════════════════════════════

    const PLUGIN_NAME = 'LampaCleanUI';
    const PLUGIN_VERSION = '17.1.2';

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
            /* ─── HEADER: Hide status indicators ─── */
            .head__status,
            .head__state,
            .head__server,
            .cub-status,
            .sync-status,
            .head .status {
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
        `;

        const styleEl = document.createElement('style');
        styleEl.id = 'lampa-clean-ui-styles';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. DYNAMIC CLEANUP VIA setInterval (300ms)
    // ═══════════════════════════════════════════════════════════════

    let dynamicInterval = null;

    function startDynamicCleanup() {
        dynamicInterval = setInterval(function() {
            try {
                cleanupSearchSources();
                cleanupMainScreenLines();
            } catch (e) {
                // Silently ignore errors to prevent crashes
            }
        }, 300);
    }

    function cleanupSearchSources() {
        // Selectors for search source items — only inside search-related containers
        var selectors = '.search__body .selector__item, .search__body .search__source, .search__body .search-sources__item, .search__body .button, .search-sources .selector__item, .search-sources .search__source, .search-sources .search-sources__item, .search-sources .button';

        $(selectors).each(function() {
            var $this = $(this);
            var text = $this.text().toLowerCase().trim();

            // Exact match for forbidden sources
            if (text === 'cinema' || 
                text === 'cinema - anime' || 
                text === 'ai-ассистент') {
                $this.hide();
            }
        });
    }

    function cleanupMainScreenLines() {
        // Find all line/scroll/section containers that are DIRECT children of main content area
        // Avoid affecting search, settings, or other screens
        $('.content__body .line, .content__body .scroll, .content__body .section, .layer--wheight .line, .layer--wheight .scroll, .layer--wheight .section, [data-component="main"] .line, [data-component="main"] .scroll, [data-component="main"] .section').each(function() {
            var $this = $(this);

            // Check title text
            var titleText = '';
            var $title = $this.find('.line__title, .scroll__title, .section__title').first();
            if ($title.length) {
                titleText = $title.text().toLowerCase().trim();
            }

            // Check for avatar images ONLY inside the title element (actor shelves)
            // Regular movie shelves have images in cards, NOT in the title
            var hasAvatarInTitle = $title.find('img, .line__avatar, .avatar, [class*="avatar"]').length > 0;

            // Hide if title is exactly "shots" OR title contains avatar (actor shelf)
            if (titleText === 'shots' || hasAvatarInTitle) {
                $this.hide();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. TRAILER REMOVAL (Native Lampa event)
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
    // 4. DEEP SHOTS REMOVAL (Storage, Menu, Player, Components)
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

        // ─── Select.show cleanup ───
        if (Lampa.Select && Lampa.Select.show) {
            var originalSelectShow = Lampa.Select.show;
            Lampa.Select.show = function(options) {
                if (options && Lampa.Arrays.isArray(options.items)) {
                    options.items = options.items.filter(function(item) {
                        if (item.btn) {
                            var btn = $(item.btn);
                            var isShots = btn.hasClass('shots-view-button') || 
                                (btn.hasClass('view--online') && btn.find('use[xlink\:href="#sprite-shots"]').length > 0) ||
                                btn.find('.shots-view-button__title').length > 0 ||
                                (item.title && item.title.toLowerCase().indexOf('shots') >= 0);
                            if (isShots) return false;
                        }
                        if (item.title && item.title.toLowerCase().indexOf('shots') >= 0) return false;
                        if (item.icon && item.icon.indexOf('sprite-shots') >= 0) return false;
                        return true;
                    });
                }
                return originalSelectShow.call(this, options);
            };
        }

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
    // 5. MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    function initAll() {
        console.log('[' + PLUGIN_NAME + ' v' + PLUGIN_VERSION + '] initAll() executing...');

        // Inject static CSS styles
        injectStyles();

        // Start dynamic cleanup loop
        startDynamicCleanup();

        // Initialize trailer removal
        initTrailerRemoval();

        // Initialize deep Shots removal
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
