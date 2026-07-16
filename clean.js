(function () {
    'use strict';

    // Защита от дублей при перезагрузках
    if (window.lampa_mega_plugin_v18) return;
    window.lampa_mega_plugin_v18 = true;

    console.log('Mega Plugin', 'v18.0: Очистка UI + Auto Skip Intro');

    // =========================================================================
    // БЛОК 1: ОЧИСТКА ИНТЕРФЕЙСА (База v17.1.1)
    // =========================================================================
    function initCleaner() {
        try {
            // CSS Стили
            $('body').append(`
                <style id="custom-cleaner-styles">
                    .head .head__action:not(.open--search):not(.open--settings):not(.open--menu):not(.head__back):not([data-action="back"]) { display: none !important; }
                    .head__status, .head__state, .head__server, .cub-status, .sync-status, .head .status { display: none !important; }
                    .full-start__button.button--play { width: auto !important; min-width: 160px !important; padding-left: 20px !important; padding-right: 20px !important; }
                    .full-start__button.button--play span, .full-start__button.button--play div:not(.full-start__icon) { display: inline-block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; margin-left: 10px !important; }
                    .content-rows [data-type="favorite"][data-title*="Shots"], .content-rows [data-type="created"][data-title*="Shots"], .line[data-name="shots_main"], .line[data-type*="shots"] { display: none !important; }
                </style>
            `);

            // Трейлеры
            Lampa.Listener.follow('full', function (e) { 
                if (e.type == 'complite') e.object.activity.render().find('.view--trailer').remove(); 
            }); 

            // Удаление Shots
            Lampa.Storage.set('content_rows_shots_main', 'false');
            const originalAdd = Lampa.ContentRows.add;
            if (originalAdd) {
                Lampa.ContentRows.add = function(row) {
                    if (row && row.name === 'shots_main') return;
                    if (row && row.screen && Lampa.Arrays.isArray(row.screen) && row.screen.indexOf('bookmarks') >= 0) {
                        if (typeof row.call === 'function') {
                            const callStr = row.call.toString();
                            if (callStr.indexOf('shots_title_favorite') >= 0 || callStr.indexOf('shots_title_created') >= 0 || (callStr.indexOf('Favorite.get') >= 0 && callStr.indexOf('Created.get') >= 0 && callStr.indexOf('shots') >= 0)) return;
                        }
                    }
                    return originalAdd.call(this, row);
                };
            }

            const originalCall = Lampa.ContentRows.call;
            if (originalCall) {
                Lampa.ContentRows.call = function(screen, params, calls) {
                    Lampa.Storage.set('content_rows_shots_main', 'false');
                    const result = originalCall.call(this, screen, params, calls);
                    if (Lampa.Arrays.isArray(calls)) {
                        for (let i = calls.length - 1; i >= 0; i--) {
                            const callItem = calls[i];
                            if (callItem && typeof callItem === 'object') {
                                if (callItem.title === 'Shots' || (callItem.icon_svg && callItem.icon_svg.indexOf('sprite-shots') >= 0) || (callItem.results && Lampa.Arrays.isArray(callItem.results) && callItem.results.length > 0 && callItem.results[0].type === 'shot')) {
                                    calls.splice(i, 1);
                                }
                            }
                        }
                    }
                    return result;
                };
            }

            Lampa.Listener.follow('menu', (e) => {
                if (e.type === 'end' || e.type === 'start') {
                    setTimeout(() => {
                        const menu = Lampa.Menu.render();
                        if (menu && menu.length) {
                            menu.find('.menu__item').each(function() {
                                const $item = $(this);
                                const text = $item.find('.menu__text').text();
                                const hasShotsIcon = $item.find('use[xlink\\:href="#sprite-shots"]').length > 0;
                                if ((text && text.toLowerCase().indexOf('shots') >= 0) || hasShotsIcon) $item.remove();
                            });
                        }
                    }, 100);
                }
            });

            Lampa.Listener.follow('full', (e) => {
                if (e.type === 'complite') {
                    const render = e.object.activity.render();
                    if (render && render.length) {
                        render.find('.shots-view-button, [class*="shots-view"], .view--online.shots-view-button').remove();
                        const buttonsContainer = render.find('.buttons--container');
                        if (buttonsContainer.length) buttonsContainer.find('.shots-view-button, [class*="shots-view"], .view--online.shots-view-button').remove();
                    }
                }
            });

            if (Lampa.Select && Lampa.Select.show) {
                const originalSelectShow = Lampa.Select.show;
                Lampa.Select.show = function(options) {
                    if (options && Lampa.Arrays.isArray(options.items)) {
                        options.items = options.items.filter(item => {
                            if (item.btn) {
                                const btn = $(item.btn);
                                const isShots = btn.hasClass('shots-view-button') || btn.hasClass('view--online') && btn.find('use[xlink\\:href="#sprite-shots"]').length > 0 || btn.find('.shots-view-button__title').length > 0 || (item.title && item.title.toLowerCase().indexOf('shots') >= 0);
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

            if (Lampa.Component && Lampa.Component.remove) {
                ['shots_list', 'shots_card', 'shots_channel'].forEach(compName => {
                    try { Lampa.Component.remove(compName); } catch (e) {}
                });
            }

            // Динамическая очистка
            setInterval(() => {
                $('[class*="shots-"], [id*="shots-"], [data-shots], .shots-view-button, .shots-player-segments, .shots-player-recorder, .shots-modal, .shots-lenta').remove();
                
                $('.selector__item, .search__source, .search-sources__item, .button').each(function() {
                    const txt = ($(this).text() || '').trim().toLowerCase();
                    if (txt === 'cinema' || txt === 'cinema - anime' || txt === 'ai-ассистент') $(this).hide();
                });

                $('.line, .scroll, .section').each(function() {
                    const title = $(this).find('.line__title, .scroll__title');
                    if (title.length) {
                        const titleTxt = (title.text() || '').trim().toLowerCase();
                        if (titleTxt === 'shots' || title.find('img, .line__avatar, .avatar, [class*="avatar"]').length > 0) $(this).hide();
                    }
                });

                const selector = '[data-controller="player_panel"]';
                if (Lampa.PlayerPanel && Lampa.PlayerPanel.render) {
                    const panel = Lampa.PlayerPanel.render();
                    panel.find(selector).each(function() {
                        const $btn = $(this);
                        const hasRedCircle = $btn.find('circle[fill="#FF0707"]').length > 0 || $btn.find('circle[fill="#ff0707"]').length > 0 || $btn.find('circle[fill="red"]').length > 0 || $btn.find('svg circle').length === 2 && $btn.find('svg circle').eq(1).attr('fill') === '#FF0707';
                        if (hasRedCircle) $btn.remove();
                    });
                }
            }, 300);

        } catch(e) { console.log('Cleaner Error', e); }
    }

    // =========================================================================
    // БЛОК 2: АВТОПРОПУСК ЗАСТАВОК (Деобфусцированный)
    // ==========================================
    function initSkipIntro() {
        if (window.__skipIntroLoaded) return;
        window.__skipIntroLoaded = true;

        try {
            // Очистка старых конфликтующих плагинов
            var pluginsStr = Lampa.Storage.get("plugins", "[]");
            if (typeof pluginsStr == "string") pluginsStr = JSON.parse(pluginsStr);
            if (Array.isArray(pluginsStr)) {
                var changed = false;
                pluginsStr.forEach(function (p) {
                    if (p.url && p.url.indexOf("lampa-auto-skip") !== -1) {
                        if (p.name !== "Skip Intro/Outro") { p.name = "Skip Intro/Outro"; changed = true; }
                        if (p.author !== "@vahagn") { p.author = "@vahagn"; changed = true; }
                    }
                });
                if (changed) Lampa.Storage.set("plugins", JSON.stringify(pluginsStr));
            }
        } catch (e) {}

        var API_URL = "https://api.introdb.app";
        var API_TIMEOUT = 5000;
        var MAX_DURATION = 360;
        var LABELS = {
            intro: "Пропустить заставку",
            recap: "Пропустить рекап",
            credits: "Пропустить титры",
            preview: "Пропустить превью"
        };
        var TYPES = ["intro", "recap", "credits", "preview"];

        // Модуль настроек
        var Settings = {
            init: function () {
                Lampa.SettingsApi.addComponent({
                    component: "skip_intro",
                    name: "Пропуск заставок",
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>'
                });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_enabled", type: "trigger", default: true }, field: { name: "Включить плагин", description: "Показывать кнопку пропуска заставок и титров" } });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_auto", type: "trigger", default: false }, field: { name: "Всегда автопропуск", description: "Всегда перематывать без кнопки" } });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_detect", type: "trigger", default: true }, field: { name: "Умное обнаружение", description: "Определять по субтитрам и звуку" } });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_type_intro", type: "trigger", default: true }, field: { name: "Пропускать заставку" } });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_type_recap", type: "trigger", default: true }, field: { name: "Пропускать рекап" } });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_type_credits", type: "trigger", default: true }, field: { name: "Пропускать титры" } });
                Lampa.SettingsApi.addParam({ component: "skip_intro", param: { name: "skip_intro_type_preview", type: "trigger", default: false }, field: { name: "Пропускать превью" } });
                Lampa.SettingsApi.addParam({
                    component: "skip_intro",
                    param: { name: "skip_intro_key_skip", type: "select", values: { enter: "Enter / OK", space: "Пробел", red: "Красная кнопка", green: "Зелёная кнопка", yellow: "Жёлтая кнопка", blue: "Синяя кнопка" }, default: "enter" },
                    field: { name: "Кнопка «Пропустить»" }
                });
                Lampa.SettingsApi.addParam({
                    component: "skip_intro",
                    param: { name: "skip_intro_key_cancel", type: "select", values: { back: "Назад (Back)", red: "Красная кнопка", green: "Зелёная кнопка", yellow: "Жёлтая кнопка", blue: "Синяя кнопка" }, default: "back" },
                    field: { name: "Кнопка «Отменить»" }
                });
            },
            isEnabled: function () { return Lampa.Storage.field("skip_intro_enabled") !== false; },
            isAutoSkip: function () { return Lampa.Storage.field("skip_intro_auto") === true; },
            isDetectEnabled: function () { return Lampa.Storage.field("skip_intro_detect") !== false; },
            isTypeEnabled: function (type) { return Lampa.Storage.field("skip_intro_type_" + type) !== false; },
            _keyMap: { enter: [13], space: [32], back: [8, 27, 10009, 461, 4], red: [403], green: [404], yellow: [405], blue: [406] },
            getSkipKeys: function () { return this._keyMap[Lampa.Storage.field("skip_intro_key_skip") || "enter"] || this._keyMap.enter; },
            getCancelKeys: function () { return this._keyMap[Lampa.Storage.field("skip_intro_key_cancel") || "back"] || this._keyMap.back; }
        };

        // Модуль памяти (запоминает, пропускал ли пользователь заставку в этом сериале ранее)
        var SmartMemory = {
            _storageKey: "skip_intro_smart",
            _getAll: function () {
                try {
                    var data = Lampa.Storage.get(this._storageKey, "{}");
                    if (typeof data == "string") data = JSON.parse(data);
                    return data || {};
                } catch (e) { return {}; }
            },
            _saveAll: function (data) { try { Lampa.Storage.set(this._storageKey, JSON.stringify(data)); } catch (e) {} },
            hasSkipped: function (id, type) { return this._getAll()[id + "_" + type] === true; },
            rememberSkip: function (id, type) {
                var data = this._getAll();
                data[id + "_" + type] = true;
                this._saveAll(data);
            },
            forgetSkip: function (id, type) {
                var data = this._getAll();
                delete data[id + "_" + type];
                this._saveAll(data);
            }
        };

        // Кэш базы
        var Cache = {
            _key: function (t, s, e) { return "skip_" + t + "_s" + s + "_e" + e; },
            get: function (t, s, e) {
                try {
                    var data = localStorage.getItem(this._key(t, s, e));
                    if (!data) return null;
                    var parsed = JSON.parse(data);
                    if (parsed && parsed._ts) {
                        if (Date.now() - parsed._ts > 604800000) { localStorage.removeItem(this._key(t, s, e)); return null; }
                        return parsed.segments || [];
                    }
                    return null;
                } catch (err) { return null; }
            },
            set: function (t, s, e, segs) {
                try { localStorage.setItem(this._key(t, s, e), JSON.stringify({ segments: segs, _ts: Date.now() })); } catch (err) {}
            }
        };

        // Кэш обнаруженных субтитров/звука
        var DetectedCache = {
            _storageKey: "skip_intro_detected",
            _getAll: function () {
                try {
                    var data = Lampa.Storage.get(this._storageKey, "{}");
                    if (typeof data == "string") data = JSON.parse(data);
                    return data || {};
                } catch (e) { return {}; }
            },
            _saveAll: function (data) { try { Lampa.Storage.set(this._storageKey, JSON.stringify(data)); } catch (e) {} },
            _ttl: 2592000000,
            get: function (id, s, e) {
                var data = this._getAll(), record = data[id + "_s" + s + "_e" + e];
                if (record) {
                    if (record._ts && Date.now() - record._ts > this._ttl) {
                        delete data[id + "_s" + s + "_e" + e];
                        this._saveAll(data);
                        return null;
                    }
                    return record.segments || null;
                }
                return null;
            },
            set: function (id, s, e, segs) {
                var data = this._getAll();
                data[id + "_s" + s + "_e" + e] = { segments: segs, _ts: Date.now() };
                this._saveAll(data);
            }
        };

        // Детектор по субтитрам
        var SubDetector = {
            detect: function (videoEl) {
                var duration = videoEl.duration || 0;
                return new Promise(function (resolve) {
                    try {
                        var subs = videoEl.customSubs;
                        if (!subs || !subs.length) {
                            var tracks = videoEl.textTracks;
                            if (tracks && tracks.length) {
                                for (var i = 0; i < tracks.length; i++) {
                                    if (tracks[i].cues && tracks[i].cues.length > 5) return resolve(SubDetector._analyzeTextTrack(tracks[i], duration));
                                }
                            }
                            return resolve([]);
                        }
                        var subObj = null;
                        for (var j = 0; j < subs.length; j++) { if (subs[j].url) { subObj = subs[j]; break; } }
                        if (!subObj || !subObj.url) return resolve([]);
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", subObj.url, true);
                        xhr.responseType = "text";
                        xhr.onload = function () {
                            if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) resolve(SubDetector._analyzeSrtText(xhr.responseText, duration));
                            else resolve([]);
                        };
                        xhr.onerror = function () { resolve([]); };
                        xhr.timeout = 8000;
                        xhr.ontimeout = function () { resolve([]); };
                        xhr.send();
                    } catch (e) { resolve([]); }
                });
            },
            _analyzeTextTrack: function (track, dur) {
                var arr = [];
                for (var i = 0; i < track.cues.length; i++) arr.push({ start: track.cues[i].startTime, end: track.cues[i].endTime });
                return this._findSegments(arr, dur);
            },
            _parseSrtTime: function (t) {
                var m = t.match(/(\d+):(\d{2}):(\d{2})[.,](\d{3})/);
                return m ? 3600 * parseInt(m[1]) + 60 * parseInt(m[2]) + parseInt(m[3]) + parseInt(m[4]) / 1000 : 0;
            },
            _analyzeSrtText: function (text, dur) {
                text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                var arr = [], match, regex = /(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{3})/g;
                while ((match = regex.exec(text)) !== null) {
                    var s = this._parseSrtTime(match[1]), e = this._parseSrtTime(match[2]);
                    if (e > s) arr.push({ start: s, end: e });
                }
                return arr.length < 5 ? [] : this._findSegments(arr, dur);
            },
            _findSegments: function (arr, dur) {
                arr.sort(function (a, b) { return a.start - b.start; });
                var segs = [], intro = null, maxGap = 0;
                if (arr.length > 0 && arr[0].start >= 15 && arr[0].start <= 150) {
                    maxGap = arr[0].start;
                    intro = { type: "intro", start: 0, end: Math.round(arr[0].start) };
                }
                for (var i = 0; i < arr.length - 1 && !(arr[i].end > MAX_DURATION); i++) {
                    var gap = arr[i + 1].start - arr[i].end;
                    if (gap >= 15 && gap <= 150 && arr[i].end < MAX_DURATION && gap > maxGap) {
                        maxGap = gap;
                        intro = { type: "intro", start: Math.round(arr[i].end), end: Math.round(arr[i + 1].start) };
                    }
                }
                if (intro) segs.push(intro);

                if (dur > 600 && arr.length > 0) {
                    var last = arr[arr.length - 1], endGap = dur - last.end;
                    if (endGap >= 30) segs.push({ type: "credits", start: Math.round(last.end), end: Math.round(dur) });
                    var credits = null, maxCredGap = 0;
                    for (var j = 0; j < arr.length - 1; j++) {
                        if (arr[j].end < dur - 600) continue;
                        var cGap = arr[j + 1].start - arr[j].end;
                        if (cGap >= 30 && cGap > maxCredGap) {
                            maxCredGap = cGap;
                            credits = { type: "credits", start: Math.round(arr[j].end), end: Math.round(arr[j + 1].start) };
                        }
                    }
                    if (credits && maxCredGap > endGap) {
                        for (var k = segs.length - 1; k >= 0; k--) { if (segs[k].type === "credits") { segs.splice(k, 1); break; } }
                        segs.push(credits);
                    }
                }
                return segs;
            }
        };

        // Детектор по звуку
        var AudioDetector = {
            _context: null, _analyser: null, _source: null, _connected: false, _sampleTimer: null, _timeoutTimer: null,
            _stopSampling: function () {
                if (this._sampleTimer) { clearInterval(this._sampleTimer); this._sampleTimer = null; }
                if (this._timeoutTimer) { clearTimeout(this._timeoutTimer); this._timeoutTimer = null; }
            },
            detect: function (videoEl) {
                var self = this;
                this._stopSampling();
                return new Promise(function (resolve) {
                    var done = false;
                    function finish(res) { if (!done) { done = true; resolve(res); } }
                    try {
                        if (!window.AudioContext && !window.webkitAudioContext) return finish(null);
                        if (!self._context || self._context.state === "closed") self._context = new (window.AudioContext || window.webkitAudioContext)();
                        if (!self._connected || !self._analyser) {
                            self._source = null; self._analyser = null; self._connected = false;
                            self._source = self._context.createMediaElementSource(videoEl);
                            self._analyser = self._context.createAnalyser();
                            self._analyser.fftSize = 2048;
                            self._source.connect(self._analyser);
                            self._analyser.connect(self._context.destination);
                            self._connected = true;
                        }
                        if (!self._analyser) return finish(null);
                        var data = [], array = new Uint8Array(self._analyser.frequencyBinCount), startTime = videoEl.currentTime;
                        self._sampleTimer = setInterval(function () {
                            if (!self._analyser) { self._stopSampling(); return finish(data.length > 10 ? self._analyzeEnergy(data) : null); }
                            try {
                                var cTime = videoEl.currentTime;
                                if (cTime - startTime > MAX_DURATION || cTime > 420) { self._stopSampling(); return finish(self._analyzeEnergy(data)); }
                                self._analyser.getByteFrequencyData(array);
                                var sum = 0;
                                for (var i = 0; i < array.length; i++) sum += array[i];
                                data.push({ time: cTime, energy: sum / array.length });
                            } catch (e) { self._stopSampling(); finish(null); }
                        }, 500);
                        self._timeoutTimer = setTimeout(function () { self._stopSampling(); finish(data.length > 10 ? self._analyzeEnergy(data) : null); }, 370000);
                    } catch (e) { finish(null); }
                });
            },
            _analyzeEnergy: function (data) {
                if (data.length < 20) return null;
                var smoothed = [];
                for (var i = 2; i < data.length - 2; i++) {
                    var avg = (data[i - 2].energy + data[i - 1].energy + data[i].energy + data[i + 1].energy + data[i + 2].energy) / 5;
                    smoothed.push({ time: data[i].time, energy: avg });
                }
                if (smoothed.length < 10) return null;
                var sorted = smoothed.map(function (d) { return d.energy; }).sort(function (a, b) { return a - b; });
                var median = sorted[Math.floor(sorted.length / 2)], high = median * 1.3, low = median * 0.8;
                var start = null, end = null, active = 0, isHigh = false;
                for (var j = 0; j < smoothed.length; j++) {
                    var pt = smoothed[j];
                    if (pt.time > MAX_DURATION) break;
                    if (pt.energy > high) { if (!isHigh) { isHigh = true; start = pt.time; active = 0; } active++; }
                    else if (isHigh && pt.energy < low) {
                        var dur = pt.time - start;
                        if (dur >= 15 && dur <= 150 && active >= 10) { end = pt.time; break; }
                        isHigh = false; start = null; active = 0;
                    }
                }
                return (start !== null && end !== null) ? { type: "intro", start: Math.round(start), end: Math.round(end) } : null;
            },
            destroy: function () {
                this._stopSampling();
                try {
                    if (this._source) { this._source.disconnect(); this._source = null; }
                    if (this._analyser) { this._analyser.disconnect(); this._analyser = null; }
                    if (this._context) { this._context.close(); this._context = null; }
                    this._connected = false;
                } catch (e) {}
            }
        };

        // Загрузчик API (Тянет данные с серверов)
        var API = {
            _fetch: function (url) {
                return new Promise(function (resolve, reject) {
                    var aborted = false, timer = setTimeout(function () { aborted = true; reject(new Error("timeout")); }, API_TIMEOUT);
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url, true);
                    xhr.setRequestHeader("Accept", "application/json");
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (aborted) return;
                            clearTimeout(timer);
                            if (xhr.status >= 200 && xhr.status < 300) {
                                try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }
                            } else {
                                if (xhr.status === 204 || xhr.status === 404) resolve(null);
                                else reject(new Error("HTTP " + xhr.status));
                            }
                        }
                    };
                    xhr.onerror = function () { clearTimeout(timer); reject(new Error("network")); };
                    xhr.send();
                });
            },
            _normIntroDB: function (data) {
                var arr = [];
                if (data) {
                    TYPES.forEach(function (t) {
                        var items = data[t];
                        if (Array.isArray(items)) {
                            items.forEach(function (i) {
                                var s = i.start_ms != null ? i.start_ms / 1000 : i.start || 0;
                                var e = i.end_ms != null ? i.end_ms / 1000 : i.end || 0;
                                if (e > s) arr.push({ type: t, start: s, end: e });
                            });
                        }
                    });
                }
                return arr;
            },
            load: function (tmdb, imdb, s, e) {
                var cached = Cache.get(tmdb, s, e);
                if (cached !== null) return Promise.resolve(cached);
                var self = this;
                function save(data) { Cache.set(tmdb, s, e, data || []); return data || []; }
                return this._fetch("https://api.theintrodb.org/v2/media?tmdb_id=" + tmdb + "&season=" + s + "&episode=" + e)
                    .then(function (data) { return save(self._normIntroDB(data)); })
                    .catch(function () { return save([]); });
            }
        };

        // UI Кнопка поверх плеера
        var UI = {
            _button: null, _visible: false, _fadeTimer: null, _countdownTimer: null, _progressBar: null, _mode: null,
            _injectCSS: function () {
                if (!document.getElementById("skip-intro-css")) {
                    var style = document.createElement("style");
                    style.id = "skip-intro-css";
                    style.textContent = ".skip-intro-button{position:absolute;right:40px;bottom:180px;padding:0;background:rgba(0,0,0,.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.2);border-radius:12px;color:#fff;font-size:1em;cursor:pointer;z-index:9999;transition:opacity .4s ease,transform .4s ease,border-color .3s ease;opacity:0;pointer-events:none;transform:translateX(20px);outline:none;display:flex;flex-direction:column;box-shadow:0 4px 24px rgba(0,0,0,.4)}.skip-intro-button.visible{opacity:1;pointer-events:auto;transform:translateX(0)}.skip-intro-button:focus,.skip-intro-button:hover{border-color:rgba(255,255,255,.6);background:rgba(0,0,0,.8)}.skip-intro-content{display:flex;align-items:center;padding:14px 28px;gap:10px;position:relative;z-index:2}.skip-intro-progress{position:absolute;bottom:0;left:0;height:3px;background:linear-gradient(90deg,rgba(255,255,255,.9),rgba(200,200,255,.7));border-radius:0 0 10px 10px;transition:width .1s linear;z-index:3}.skip-intro-badge{font-size:.7em;opacity:.45;margin-left:6px;font-weight:300}.skip-intro-hint{font-size:.7em;opacity:.4;margin-left:8px;font-weight:300;border:1px solid rgba(255,255,255,.25);border-radius:4px;padding:1px 6px}";
                    document.head.appendChild(style);
                }
            },
            showNormal: function (text, onSkip, badge) {
                this._clearCountdown(); this._injectCSS(); this._mode = "normal";
                if (this._button) {
                    this._updateLabel(text, badge);
                    this._button._onSkip = onSkip; this._button._onCancel = null; this._button._withCancel = false;
                    this._button.classList.remove("countdown");
                    if (this._progressBar) this._progressBar.style.width = "0%";
                    this._updateHint(false);
                    if (!this._visible) this._setVisible(true);
                    return;
                }
                this._createButton(text, onSkip, false, null, badge);
            },
            showCountdown: function (text, onSkip, onCancel, badge) {
                this._clearCountdown(); this._injectCSS(); this._mode = "countdown";
                if (this._button) {
                    this._updateLabel(text, badge);
                    this._button._onSkip = onSkip; this._button._onCancel = onCancel; this._button._withCancel = true;
                    this._button.classList.add("countdown");
                    if (this._progressBar) this._progressBar.style.width = "0%";
                    this._updateHint(true);
                    if (!this._visible) this._setVisible(true);
                    this._startCountdown(onSkip);
                    return;
                }
                this._createButton(text, onSkip, true, onCancel, badge);
                this._startCountdown(onSkip);
            },
            _updateHint: function (isCancel) {
                if (!this._button || !this._button._hintEl) return;
                if (isCancel) {
                    var k = Lampa.Storage.field("skip_intro_key_cancel") || "back";
                    this._button._hintEl.textContent = "нажмите " + ({ back: "Назад", red: "Красная", green: "Зелёная", yellow: "Жёлтая", blue: "Синяя" }[k] || "Назад") + " для отмены";
                } else {
                    var keys = Settings.getSkipKeys(), name = "OK", map = { 13: "OK", 29443: "OK", 65385: "OK" };
                    for (var i = 0; i < keys.length; i++) { if (map[keys[i]]) { name = map[keys[i]]; break; } }
                    this._button._hintEl.textContent = "нажмите " + name;
                }
            },
            _createButton: function (text, onSkip, isCountdown, onCancel, badge) {
                var btn = document.createElement("div");
                btn.className = "skip-intro-button" + (isCountdown ? " countdown" : "");
                btn.setAttribute("tabindex", "1");
                
                var content = document.createElement("div"); content.className = "skip-intro-content";
                var label = document.createElement("span"); label.className = "skip-intro-label"; label.textContent = text;
                content.appendChild(label);
                
                if (badge) { var b = document.createElement("span"); b.className = "skip-intro-badge"; b.textContent = badge; content.appendChild(b); }
                
                var hint = document.createElement("span"); hint.className = "skip-intro-hint";
                content.appendChild(hint); btn._hintEl = hint;
                
                var prog = document.createElement("div"); prog.className = "skip-intro-progress"; prog.style.width = "0%";
                btn.appendChild(content); btn.appendChild(prog); this._progressBar = prog;
                
                btn._onSkip = onSkip; btn._onCancel = onCancel || null; btn._withCancel = !!isCountdown;
                content.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); if (btn._onSkip) btn._onSkip(); });
                
                function hasKey(arr, k) { return arr.indexOf(k) !== -1; }
                btn._domKeyHandler = function (e) {
                    if (btn.classList.contains("visible")) {
                        if (hasKey(Settings.getSkipKeys(), e.keyCode)) { e.preventDefault(); e.stopPropagation(); if (btn._onSkip) btn._onSkip(); }
                        else if (btn._withCancel && hasKey(Settings.getCancelKeys(), e.keyCode)) { e.preventDefault(); e.stopPropagation(); if (btn._onCancel) btn._onCancel(); }
                    }
                };
                document.addEventListener("keydown", btn._domKeyHandler, true);
                
                this._button = btn; this._updateHint(isCountdown);
                var player = document.querySelector(".player");
                if (player) player.appendChild(btn); else document.body.appendChild(btn);
                
                var self = this; setTimeout(function () { self._setVisible(true); }, 50);
            },
            _updateLabel: function (t, b) {
                if (this._button) {
                    var el = this._button.querySelector(".skip-intro-label"); if (el) el.textContent = t;
                    var bdg = this._button.querySelector(".skip-intro-badge"); if (bdg) bdg.textContent = b || "";
                }
            },
            _startCountdown: function (cb) {
                var self = this, start = Date.now();
                this._countdownTimer = setInterval(function () {
                    var diff = Date.now() - start, r = Math.min(1, diff / 4000);
                    if (self._progressBar) self._progressBar.style.width = (r * 100) + "%";
                    if (diff >= 4000) { self._clearCountdown(); if (cb) cb(); }
                }, 50);
            },
            _clearCountdown: function () { if (this._countdownTimer) { clearInterval(this._countdownTimer); this._countdownTimer = null; } },
            _setVisible: function (st) { this._visible = st; if (this._button) st ? this._button.classList.add("visible") : this._button.classList.remove("visible"); },
            hide: function () {
                this._clearCountdown();
                if (this._button) {
                    this._setVisible(false);
                    var b = this._button, self = this;
                    clearTimeout(this._fadeTimer);
                    this._fadeTimer = setTimeout(function () {
                        if (b._domKeyHandler) document.removeEventListener("keydown", b._domKeyHandler, true);
                        if (b.parentNode) b.parentNode.removeChild(b);
                        if (self._button === b) { self._button = null; self._progressBar = null; }
                    }, 350);
                }
            },
            destroy: function () { this.hide(); }
        };

        // Главный контроллер плеера
        var MainCore = {
            _segments: [], _active: null, _lastSkipped: null, _data: null, _tmdb: null, _inited: false,
            init: function () {
                if (!this._inited) {
                    this._inited = true; Settings.init();
                    var self = this;
                    Lampa.Player.listener.follow("start", function (e) { self._onStart(e); });
                    Lampa.Player.listener.follow("destroy", function () { self._onDestroy(); });
                    if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) Lampa.PlayerVideo.listener.follow("timeupdate", function (e) { self._onTime(e); });
                }
            },
            _extractMeta: function (data) {
                var res = { tmdb_id: null, season: null, episode: null, is_series: false }, card = data.card || null;
                if (!card) {
                    var act = Lampa.Activity.active();
                    if (act) { if (act.card) card = act.card; else if (act.movie) card = act.movie; }
                }
                if (card) {
                    res.tmdb_id = card.id;
                    if ((card.name && !card.title) || card.number_of_seasons || card.first_air_date) res.is_series = true;
                }
                if (data.season != null) res.season = parseInt(data.season);
                if (data.episode != null) res.episode = parseInt(data.episode);
                if (res.season != null && res.episode != null) res.is_series = true;
                return res;
            },
            _onStart: function (data) {
                this._segments = []; this._active = null; this._lastSkipped = null; this._data = data; this._tmdb = null;
                if (Settings.isEnabled()) {
                    var meta = this._extractMeta(data);
                    if (meta.tmdb_id && meta.is_series && meta.season != null && meta.episode != null) {
                        this._tmdb = meta.tmdb_id;
                        var self = this, apiDone = false, detDone = false, apiSegs = [], detSegs = [];
                        
                        function merge() {
                            if (apiDone && detDone && self._data === data) {
                                var merged = apiSegs.slice();
                                detSegs.forEach(function (ds) {
                                    var found = false;
                                    for (var i = 0; i < merged.length; i++) {
                                        if (merged[i].type === ds.type) { if (ds.start < merged[i].start) merged[i] = ds; found = true; break; }
                                    }
                                    if (!found) merged.push(ds);
                                });
                                self._segments = merged;
                            }
                        }

                        API.load(meta.tmdb_id, null, meta.season, meta.episode).then(function (res) {
                            if (self._data === data) { apiSegs = res || []; apiDone = true; merge(); }
                        }).catch(function () { apiDone = true; merge(); });

                        if (Settings.isDetectEnabled()) {
                            this._runDetection(data, meta, function (res) {
                                if (self._data === data) { detSegs = res || []; detDone = true; merge(); }
                            });
                        } else { detDone = true; }
                    }
                }
            },
            _runDetection: function (data, meta, cb) {
                var cached = DetectedCache.get(meta.tmdb_id, meta.season, meta.episode);
                if (cached && cached.length > 0) return cb(cached);
                var self = this, attempts = 0;
                function tryDetect() {
                    var vid = null; try { vid = Lampa.PlayerVideo.video(); } catch (e) {}
                    if (!vid || !vid.duration) {
                        if (++attempts < 20 && self._data === data) setTimeout(tryDetect, 500); else cb([]);
                        return;
                    }
                    SubDetector.detect(vid).then(function (res) {
                        if (self._data === data) {
                            if (res && res.length > 0) { DetectedCache.set(meta.tmdb_id, meta.season, meta.episode, res); return cb(res); }
                            AudioDetector.detect(vid).then(function (res2) {
                                if (self._data === data) { if (res2) { var arr = [res2]; DetectedCache.set(meta.tmdb_id, meta.season, meta.episode, arr); cb(arr); } else cb([]); }
                            }).catch(function () { cb([]); });
                        }
                    }).catch(function () { cb([]); });
                }
                tryDetect();
            },
            _onTime: function (e) {
                if (Settings.isEnabled() && this._segments.length) {
                    var time = e.current;
                    if (time != null && !isNaN(time)) {
                        var active = null;
                        for (var i = 0; i < this._segments.length; i++) {
                            if (time >= this._segments[i].start && time < this._segments[i].end) { active = this._segments[i]; break; }
                        }
                        if (active) {
                            if (!Settings.isTypeEnabled(active.type)) { if (this._active) this._hideBtn(); return; }
                            if (this._lastSkipped === active) return;
                            if (Settings.isAutoSkip()) return this._doSkip(active, true);
                            if (this._active !== active) {
                                this._active = active;
                                if (this._tmdb && SmartMemory.hasSkipped(this._tmdb, active.type)) this._showBtn(active, true);
                                else this._showBtn(active, false);
                            }
                        } else if (this._active) this._hideBtn();
                    }
                }
            },
            _showBtn: function (seg, isCountdown) {
                var lbl = LABELS[seg.type] || "Пропустить", self = this;
                if (isCountdown) {
                    UI.showCountdown(lbl, function () { self._doSkip(seg, true); }, function () {
                        if (self._tmdb) SmartMemory.forgetSkip(self._tmdb, seg.type);
                        self._lastSkipped = seg; UI.hide(); self._active = null;
                    });
                } else {
                    UI.showNormal(lbl, function () {
                        if (self._tmdb) SmartMemory.rememberSkip(self._tmdb, seg.type);
                        self._doSkip(seg, false);
                    });
                }
            },
            _hideBtn: function () { this._active = null; UI.hide(); },
            _doSkip: function (seg, auto) {
                this._lastSkipped = seg; this._active = null; UI.hide();
                try {
                    var vid = Lampa.PlayerVideo.video();
                    if (vid) {
                        var pos = Math.min(seg.end, vid.duration || seg.end);
                        vid.currentTime = pos;
                        setTimeout(function () { try { if (vid.paused) vid.play(); } catch (e) {} }, 100);
                    }
                } catch (e) {}
            },
            _onDestroy: function () {
                this._segments = []; this._active = null; this._lastSkipped = null; this._data = null; this._tmdb = null;
                UI.destroy(); AudioDetector.destroy();
            }
        };

        // Запуск
        var waitLampa = setInterval(function () {
            if (window.Lampa && window.Lampa.SettingsApi && window.Lampa.Player && window.Lampa.Storage) {
                clearInterval(waitLampa);
                MainCore.init();
            }
        }, 500);
    }

    // =========================================================================
    // ТОЧКА ВХОДА (Запускаем оба блока одновременно)
    // =========================================================================
    function startAll() {
        initCleaner();
        initSkipIntro();
    }

    if (window.appready && window.Lampa) {
        startAll();
    } else {
        var wait = setInterval(function() {
            if (window.Lampa && window.Lampa.Listener) {
                clearInterval(wait);
                Lampa.Listener.follow('app', function(e) {
                    if (e.type == 'ready') startAll();
                });
            }
        }, 100);
    }

})();
