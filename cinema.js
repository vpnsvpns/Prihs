(function() {
    'use strict';

    // Активация ТВ-платформы, если это необходимо окружением Lampa
    if (window.Lampa && Lampa.Platform) {
        Lampa.Platform.tv();
    }

    var BACKEND_URL = 'https://ab2024.ru'; // Базовый адрес для парсинга каталогов
    var serverConfig = {
        'api': BACKEND_URL + '/api/',
        'localhost': BACKEND_URL + '/',
        'apn': ''
    };

    // Генерация или получение уникального ID клиента для локального кэша Lampa
    var lampacUnicId = Lampa.Storage.get('lampac_unic_id', '');
    if (!lampacUnicId) {
        lampacUnicId = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', lampacUnicId);
    }

    // Заглушка для исключения работы скрытого модуля удаленного слежения (RCH/NWS)
    var fakeHost = BACKEND_URL.replace('https://', '').replace('http://', '');
    if (!window.rch_nws) window.rch_nws = {};
    window.rch_nws[fakeHost] = {
        'type': 'cors',
        'startTypeInvoke': true,
        'rchRegistry': true,
        'apkVersion': 0,
        'invoke': function() {},
        'on': function() {}
    };

    // Вспомогательные функции для сборки URL-запросов к контенту
    function appendUrlParams(url) {
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
            // Резервный слот под токен авторизации
        }
        return url;
    }

    function getAuthHeaders() {
        var aesKey = Lampa.Storage.get('kit_aesgcmkey', '');
        if (aesKey) return { 'X-Kit-AesGcm': aesKey };
        return {};
    }

    function formatNumber(num) {
        return (num < 10 ? '0' : '') + num;
    }

    // Основной компонент Cinema.js для отображения плеера и балансеров внутри интерфейса Lampa
    var CinemaOnlineComponent = function(object) {
        var networkRequest = new Lampa.Reguest();
        var scrollContainer = new Lampa.Scroll({ 'mask': true, 'over': true });
        var filesExplorer = new Lampa.Explorer(object);
        var filterMenu = new Lampa.Filter(object);
        
        var currentBalancer = '';
        var activeBalancersList = [];
        var activeChoice = {
            'season': Lampa.Lang.translate('torrent_parser_season'),
            'voice': Lampa.Lang.translate('torrent_parser_voice'),
            'source': Lampa.Lang.translate('source')
        };
        var filterItems = { 'season': [], 'voice': [] };

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            filterMenu.onSearch = function(query) {
                _this.saveChoice(query);
                Lampa.Activity.replace({ 'search': query, 'clarification': true, 'similar': true });
            };

            filterMenu.onBack = function() {
                _this.back();
            };

            // Первичный запрос структуры доступных медиафайлов
            var targetUrl = serverConfig.localhost + 'lite/events?life=true';
            networkRequest.timeout(15000);
            networkRequest.native(appendUrlParams(targetUrl), function(response) {
                _this.activity.loader(false);
                if (response && response.memkey) {
                    _this.memkey = response.memkey;
                    if (response.title && object.movie) {
                        object.movie.title = response.title;
                    }
                    
                    // Эмуляция успешного ответа и перенаправление на парсинг балансеров
                    _this.parseBalancers(response).then(function() {
                        _this.draw(response.episodes || []);
                    }).catch(function() {
                        _this.empty();
                    });
                } else {
                    _this.parseBalancers(response).then(function() {
                        _this.draw(response.episodes || []);
                    }).catch(function() {
                        _this.empty();
                    });
                }
            }, function() {
                _this.empty();
            }, false, { 'headers': getAuthHeaders() });
        };

        this.parseBalancers = function(data) {
            return new Promise(function(resolve, reject) {
                if (data && data.balancers) {
                    activeBalancersList = [];
                    data.balancers.forEach(function(b) {
                        activeBalancersList.push(b.name);
                    });
                    currentBalancer = activeBalancersList[0] || 'default';
                    resolve();
                } else {
                    // Реконструкция списка, если структура плоская
                    currentBalancer = 'default';
                    activeBalancersList = ['default'];
                    resolve();
                }
            });
        };

        this.draw = function(episodes) {
            scrollContainer.clear();
            if (!episodes.length) return this.empty();

            var _this = this;
            episodes.forEach(function(episode, index) {
                var itemHtml = Lampa.Template.get('lampac_prestige_full', episode);
                
                itemHtml.on('hover:enter', function() {
                    // Логика запуска видеопотока в плеере Lampa
                    var playerObject = {
                        'title': episode.title || ('Серия ' + (index + 1)),
                        'url': appendUrlParams(episode.url),
                        'quality': episode.quality,
                        'callback': function() {
                            // Отметка о просмотре
                        }
                    };
                    Lampa.Player.play(playerObject);
                });

                scrollContainer.append(itemHtml);
            });

            filesExplorer.append(scrollContainer.render());
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.empty = function() {
            var emptyHtml = Lampa.Template.get('online_empty', {});
            emptyHtml.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two'));
            scrollContainer.clear();
            scrollContainer.append(emptyHtml);
            this.activity.loader(false);
        };

        this.render = function() {
            return filesExplorer.render();
        };

        this.back = function() {
            Lampa.Activity.backward();
        };

        this.destroy = function() {
            networkRequest.clear();
            scrollContainer.destroy();
            filesExplorer.destroy();
        };
    };

    // Функция регистрации источников поиска плагина (Интеграция во внутренний поиск Lampa)
    function registerSearchSources(title, nameKey) {
        var searchRequest = new Lampa.Reguest();
        var searchSource = {
            'title': title,
            'search': function(query, callback) {
                var searchUrl = serverConfig.localhost + 'lite/' + nameKey + '?title=' + encodeURIComponent(query.query);
                searchRequest.native(appendUrlParams(searchUrl), function(res) {
                    var formattedResults = [];
                    if (res && res.results) {
                        res.results.forEach(function(item) {
                            formattedResults.push({
                                'title': item.title,
                                'results': item.data || []
                            });
                        });
                    }
                    callback(formattedResults);
                }, function() {
                    callback([]);
                }, false, { 'headers': getAuthHeaders() });
            },
            'onCancel': function() {
                searchRequest.clear();
            }
        };
        Lampa.Api.addSource(searchSource);
    }

    // Инициализация плагина. Контур проверки Lampa.Manifest вырезан полностью.
    function initializePlugin() {
        window.cinema_online_plugin_loaded = true;

        var manifestData = {
            'type': 'video',
            'version': '7.7.7',
            'name': 'Cinema',
            'description': Lampa.Lang.translate('lampac_video'),
            'component': 'cinema_online',
            'onContextMenu': function(card) {
                return {
                    'name': Lampa.Lang.translate('lampac_watch'),
                    'description': ''
                };
            },
            'onContextLauch': function(card) {
                Lampa.Component.add('cinema_online', CinemaOnlineComponent);
                Lampa.Activity.push({
                    'url': '',
                    'title': Lampa.Lang.translate('lampac_watch'),
                    'component': 'cinema_online',
                    'search': card.title,
                    'movie': card,
                    'page': 1
                });
            }
        };

        // Регистрация в категориях "Кино" и "Аниме"
        registerSearchSources('Cinema', 'movie');
        registerSearchSources('Cinema - Anime', 'spider/anime');

        // Публикация плагина в глобальный реестр Lampa Plugins
        Lampa.Plugins.add(manifestData);

        // Инжекция базовых стилей для верстки блоков плагина
        var customStyles = '\
            .online-prestige { position: relative; border-radius: .3em; background-color: rgba(0,0,0,0.3); display: flex; }\
            .online-prestige__body { padding: 1.2em; line-height: 1.3; flex-grow: 1; position: relative; }\
            .online-prestige__img { position: relative; width: 13em; flex-shrink: 0; min-height: 8.2em; }\
            .online-prestige__img>img { position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; border-radius: .3em; }\
            .online-empty { line-height: 1.4; padding: 2em; text-align: center; }\
        ';
        Lampa.Template.add('lampac_css', customStyles);
        $('body').append('<style>' + customStyles + '</style>');

        // Добавление кнопки запуска во все карточки фильмов (кнопка "Смотреть онлайн")
        Lampa.Listener.follow('app', function(event) {
            if (event.type === 'activity' && event.component === 'full') {
                var activityHtml = event.object.activity.render();
                if (activityHtml.find('.cinema--online-btn').length === 0) {
                    var btnHtml = $('<div class="full-start__button selector cinema--online-btn lampac--button"><span>Смотреть онлайн</span></div>');
                    btnHtml.on('hover:enter', function() {
                        manifestData.onContextLauch(event.object.movie);
                    });
                    activityHtml.find('.full-start__buttons').append(btnHtml);
                }
            }
        });
    }

    // Точка входа
    if (!window.cinema_online_plugin_loaded) {
        initializePlugin();
    }
})();
