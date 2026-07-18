(function () {
    'use strict';

    if (window.cinema_online_plugin_loaded) return;
    window.cinema_online_plugin_loaded = true;

    // Автоматическая инициализация ТВ-интерфейса, если метод доступен
    if (window.Lampa && Lampa.Platform && typeof Lampa.Platform.tv === 'function') {
        Lampa.Platform.tv();
    }

    // Базовый рабочий адрес API бэкенда для парсинга каталогов и балансеров
    var BACKEND_URL = 'https://ab2024.ru/';

    // Генерация или извлечение UID устройства
    var lampacUid = Lampa.Storage.get('lampac_unic_id', '');
    if (!lampacUid) {
        lampacUid = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', lampacUid);
    }

    // Вспомогательная функция сборки URL-адресов с параметрами авторизации Lampa
    function prepareUrl(path) {
        var url = path.indexOf('http') === 0 ? path : BACKEND_URL + path;
        if (url.indexOf('account_email=') === -1) {
            var email = Lampa.Storage.get('account_email', '');
            if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
        }
        if (url.indexOf('uid=') === -1) {
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(lampacUid));
        }
        return url;
    }

    function getHeaders() {
        var aesKey = Lampa.Storage.get('kit_aesgcmkey', '');
        if (aesKey) return { 'X-Kit-AesGcm': aesKey };
        return {};
    }

    // Основной UI-компонент отображения балансеров и серий внутри Lampa
    var CinemaOnlineComponent = function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var explorer = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        
        var activeBalancer = 'default';
        var balancersMap = {};
        var currentEpisodes = [];

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            // Обработчик системной кнопки Назад
            filter.onBack = function () {
                _this.back();
            };

            // Поиск по ручному вводу в фильтре
            filter.onSearch = function (query) {
                Lampa.Activity.replace({ search: query, clarification: true, similar: true });
            };

            // Запрос структуры медиафайлов (lite-события)
            var eventsUrl = prepareUrl('lite/events?life=true');
            network.timeout(10000);
            network.native(eventsUrl, function (response) {
                if (response && response.balancers) {
                    _this.buildBalancers(response.balancers);
                }
                
                var episodesList = response && response.episodes ? response.episodes : [];
                _this.draw(episodesList);
            }, function () {
                _this.empty();
            }, false, { headers: getHeaders() });
        };

        this.buildBalancers = function (balancers) {
            var _this = this;
            balancersMap = {};
            var filterItems = [];

            balancers.forEach(function (b) {
                balancersMap[b.name] = b.url;
                filterItems.push({
                    title: b.name,
                    source: b.name,
                    selected: b.name === activeBalancer
                });
            });

            filter.set('sort', filterItems);
        };

        this.draw = function (episodes) {
            var _this = this;
            scroll.clear();
            currentEpisodes = episodes;

            if (!episodes || !episodes.length) {
                return this.empty();
            }

            episodes.forEach(function (ep, index) {
                // Создание стандартной карточки файла в стиле Lampac
                var item = Lampa.Template.get('lampac_prestige_full', {
                    title: ep.title || 'Серия ' + (ep.episode || (index + 1)),
                    time: ep.time || '',
                    quality: ep.quality || 'HD',
                    info: ep.info || ''
                });

                item.on('hover:enter', function () {
                    var playParam = {
                        title: ep.title || object.movie.title,
                        url: prepareUrl(ep.url),
                        quality: ep.quality,
                        timeline: ep.timeline,
                        mark: function () {
                            item.find('.online-prestige__img').addClass('online-prestige-watched');
                        }
                    };
                    Lampa.Player.play(playParam);
                });

                scroll.append(item);
            });

            explorer.clear();
            explorer.append(scroll.render());
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.empty = function () {
            scroll.clear();
            var emptyView = Lampa.Template.get('online_empty', {});
            scroll.append(emptyView);
            explorer.clear();
            explorer.append(scroll.render());
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.render = function () {
            return explorer.render();
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            explorer.destroy();
        };
    };

    // Интеграция плагина во внутренний глобальный поиск Lampa
    function addSearchCategory(title, endpoint) {
        var req = new Lampa.Reguest();
        Lampa.Api.addSource({
            title: title,
            search: function (query, callback) {
                var searchUrl = prepareUrl('lite/' + endpoint + '?title=' + encodeURIComponent(query.query));
                req.native(searchUrl, function (res) {
                    var output = [];
                    if (res && res.results) {
                        res.results.forEach(function (item) {
                            output.push({
                                title: item.title,
                                results: item.data || []
                            });
                        });
                    }
                    callback(output);
                }, function () {
                    callback([]);
                }, false, { headers: getHeaders() });
            },
            onCancel: function () {
                req.clear();
            }
        });
    }

    // Регистрация плагина и инжекция UI-элементов
    function init() {
        var manifest = {
            type: 'video',
            version: '1.0.0',
            name: 'Cinema',
            description: 'Просмотр онлайн фильмов и сериалов без цензуры и привязок.',
            component: 'cinema_online',
            onContextMenu: function () {
                return { name: 'Смотреть онлайн', description: '' };
            },
            onContextLauch: function (card) {
                Lampa.Component.add('cinema_online', CinemaOnlineComponent);
                Lampa.Activity.push({
                    url: '',
                    title: 'Смотреть онлайн',
                    component: 'cinema_online',
                    search: card.title,
                    movie: card,
                    page: 1
                });
            }
        };

        // Регистрация поисковых категорий
        addSearchCategory('Cinema', 'movie');
        addSearchCategory('Cinema - Anime', 'spider/anime');

        Lampa.Plugins.add(manifest);

        // Добавление локализаций интерфейса
        Lampa.Lang.add({
            lampac_watch: { ru: 'Смотреть онлайн', en: 'Watch Online', uk: 'Дивитися онлайн' },
            lampac_video: { ru: 'Видео', en: 'Video' }
        });

        // Создание кнопки "Смотреть онлайн" внутри карточки фильма
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'activity' && e.component === 'full') {
                var container = e.object.activity.render();
                if (container.find('.cinema--online-pure').length === 0) {
                    var button = $('<div class="full-start__button selector cinema--online-pure lampac--button"><span>Смотреть онлайн</span></div>');
                    button.on('hover:enter', function () {
                        manifest.onContextLauch(e.object.movie);
                    });
                    container.find('.full-start__buttons').append(button);
                }
            }
        });
    }

    init();
})();
