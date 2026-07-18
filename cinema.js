(function () {
  'use strict';

  if (window.lampac_plugin) return;
  window.lampac_plugin = true;

  if (window.Lampa && Lampa.Platform) {
    Lampa.Platform.tv();
  }

  var BACKEND_URL = "https://ab2024.ru";
  var serverConfig = {
    "api": "lampac",
    "localhost": BACKEND_URL + "/",
    "apn": ""
  };

  var lampacUid = Lampa.Storage.get("lampac_unic_id", "");
  if (!lampacUid) {
    lampacUid = Lampa.Utils.uid(8).toLowerCase();
    Lampa.Storage.set("lampac_unic_id", lampacUid);
  }

  function appendAuthParams(url) {
    url = url + "";
    var email = Lampa.Storage.get("account_email");
    if (email && url.indexOf("account_email=") == -1) {
      url = Lampa.Utils.addUrlComponent(url, "account_email=" + encodeURIComponent(email));
    }
    if (url.indexOf("uid=") == -1) {
      url = Lampa.Utils.addUrlComponent(url, "uid=" + encodeURIComponent(lampacUid));
    }
    return url;
  }

  function getHeaders() {
    var aesKey = Lampa.Storage.get("kit_aesgcmkey", "");
    if (aesKey) return { "X-Kit-AesGcm": aesKey };
    return {};
  }

  function formatTime(num) {
    return (num < 10 ? "0" : "") + num;
  }

  var CinemaOnlineComponent = function (_0x1140bc) {
    var _this = this;
    var _request = new Lampa.Reguest(),
      _scroll = new Lampa.Scroll({ "mask": true, "over": true }),
      _explorer = new Lampa.Explorer(_0x1140bc),
      _filter = new Lampa.Filter(_0x1140bc);

    var _balancers = {},
      _activeBalancer,
      _episodesList = [],
      _filterData = { "season": [], "voice": [] };

    this.initialize = function () {
      this.loading(true);

      _filter.onSearch = function (query) {
        var hash = Lampa.Utils.hash(_0x1140bc.movie.number_of_seasons ? _0x1140bc.movie.original_name : _0x1140bc.movie.original_title);
        var searchCache = Lampa.Storage.get("clarification_search", "{}");
        searchCache[hash] = query;
        Lampa.Storage.set("clarification_search", searchCache);

        Lampa.Activity.replace({ "search": query, "clarification": true, "similar": true });
      };

      _filter.onBack = function () {
        _this.start();
      };

      _filter.onSelect = function (type, item, element) {
        if (type == "filter") {
          if (item.reset) {
            var hash = Lampa.Utils.hash(_0x1140bc.movie.number_of_seasons ? _0x1140bc.movie.original_name : _0x1140bc.movie.original_title);
            var searchCache = Lampa.Storage.get("clarification_search", "{}");
            delete searchCache[hash];
            Lampa.Storage.set("clarification_search", searchCache);

            _this.replaceChoice({ "season": 0, "voice": 0, "voice_url": "", "voice_name": "" });
            setTimeout(function () {
              Lampa.Select.close();
              Lampa.Activity.replace({ "clarification": 0, "similar": 0 });
            }, 10);
          } else {
            var url = _filterData[item.stype][element.index].url;
            var choice = _this.getChoice();
            if (item.stype == "voice") {
              choice.voice_name = _filterData.voice[element.index].title;
              choice.voice_url = url;
            }
            choice[item.stype] = element.index;
            _this.saveChoice(choice);
            _this.reset();
            _this.request(url);
            setTimeout(Lampa.Select.close, 10);
          }
        } else if (type == "sort") {
          Lampa.Select.close();
          _0x1140bc.lampac_custom_select = item.source;
          _this.changeBalanser(item.source);
        }
      };

      _filter.render().find(".filter--sort span").text(Lampa.Lang.translate("lampac_balanser"));
      _scroll.body().addClass("torrent-list");
      _explorer.appendFiles(_scroll.render());
      _explorer.appendHead(_filter.render());
      _scroll.minus(_explorer.render().find(".explorer__files-head"));
      _scroll.body().append(Lampa.Template.get("lampac_content_loading"));
      Lampa.Controller.enable("content");
      this.loading(false);

      var paramsUrl = _this.requestParams(serverConfig.localhost + "lite/events?life=true");
      _request.timeout(15000);
      _request.silent(appendAuthParams(paramsUrl), function (response) {
        if (response && response.online) {
          _balancers = {};
          var sortItems = [];
          response.online.forEach(function (item) {
            var name = (item.balanser || item.name || "").toLowerCase();
            _balancers[name] = { "url": item.url, "name": item.name, "show": item.show !== false };
            sortItems.push({ "title": item.name, "source": name, "selected": name == _activeBalancer, "ghost": !item.show });
          });
          var balancersKeys = Lampa.Arrays.getKeys(_balancers);
          _activeBalancer = Lampa.Storage.get("online_balanser", balancersKeys[0]);
          if (!_balancers[_activeBalancer]) _activeBalancer = balancersKeys[0];
          _filter.set("sort", sortItems);
          _filter.chosen("sort", [_balancers[_activeBalancer] ? _balancers[_activeBalancer].name : _activeBalancer]);
          
          _this.request(_balancers[_activeBalancer].url);
        } else if (response && response.episodes) {
          _this.draw(response.episodes);
        } else {
          _this.empty();
        }
      }, function () {
        _this.empty();
      }, false, { "headers": getHeaders() });
    };

    this.changeBalanser = function (source) {
      Lampa.Storage.set("online_balanser", source);
      var activeChoice = this.getChoice(source);
      this.saveChoice(activeChoice, source);
      Lampa.Activity.replace();
    };

    this.requestParams = function (basePath) {
      var params = [];
      params.push("id=" + encodeURIComponent(_0x1140bc.movie.id));
      if (_0x1140bc.movie.imdb_id) params.push("imdb_id=" + _0x1140bc.movie.imdb_id);
      if (_0x1140bc.movie.kinopoisk_id) params.push("kinopoisk_id=" + _0x1140bc.movie.kinopoisk_id);
      params.push("title=" + encodeURIComponent(_0x1140bc.movie.title || _0x1140bc.movie.name));
      params.push("original_title=" + encodeURIComponent(_0x1140bc.movie.original_title || _0x1140bc.movie.original_name));
      params.push("serial=" + (_0x1140bc.movie.name ? 1 : 0));
      params.push("year=" + ((_0x1140bc.movie.release_date || _0x1140bc.movie.first_air_date || "0000") + "").slice(0, 4));
      return basePath + (basePath.indexOf("?") >= 0 ? "&" : "?") + params.join("&");
    };

    this.request = function (url) {
      _request.native(appendAuthParams(this.requestParams(url)), this.parse.bind(this), this.empty.bind(this), false, {
        "dataType": "text",
        "headers": getHeaders()
      });
    };

    this.parse = function (htmlData) {
      try {
        var wrapper = $("<div>" + htmlData + "</div>");
        var items = [];
        wrapper.find(".videos__item").each(function () {
          var el = $(this);
          var data = JSON.parse(el.attr("data-json") || "{}");
          data.text = el.text();
          data.episode = parseInt(el.attr("e") || "0");
          data.season = parseInt(el.attr("s") || "0");
          items.push(data);
        });
        this.draw(items);
      } catch (e) {
        this.empty();
      }
    };

    this.draw = function (episodes) {
      _scroll.clear();
      if (!episodes || !episodes.length) return this.empty();

      episodes.forEach(function (ep, idx) {
        var card = Lampa.Template.get("lampac_prestige_full", {
          title: ep.text || "Серия " + (ep.episode || (idx + 1)),
          time: ep.time || "",
          quality: "HD",
          info: ep.voice_name || ""
        });

        card.find(".online-prestige__img").hide();

        card.on("hover:enter", function () {
          Lampa.Player.play({
            title: ep.text || _0x1140bc.movie.title,
            url: appendAuthParams(ep.url),
            mark: function () {}
          });
        });
        _scroll.append(card);
      });

      _explorer.clear();
      _explorer.append(_scroll.render());
      this.activity.loader(false);
      this.activity.toggle();
    };

    this.getChoice = function (bal) {
      var cache = Lampa.Storage.cache("online_choice_" + (bal || _activeBalancer), 3000, {});
      var movieChoice = cache[_0x1140bc.movie.id] || {};
      return Lampa.Arrays.extend(movieChoice, { "season": 0, "voice": 0, "voice_name": "", "voice_url": "" });
    };

    this.saveChoice = function (choice, bal) {
      var cache = Lampa.Storage.cache("online_choice_" + (bal || _activeBalancer), 3000, {});
      cache[_0x1140bc.movie.id] = choice;
      Lampa.Storage.set("online_choice_" + (bal || _activeBalancer), cache);
    };

    this.replaceChoice = function (obj, bal) {
      var choice = this.getChoice(bal);
      Lampa.Arrays.extend(choice, obj, true);
      this.saveChoice(choice, bal);
    };

    this.reset = function () {
      _request.clear();
      _scroll.clear();
      _scroll.body().append(Lampa.Template.get("lampac_content_loading"));
    };

    this.loading = function (state) {
      this.activity.loader(state);
    };

    this.empty = function () {
      _scroll.clear();
      var emptyView = Lampa.Template.get("lampac_does_not_answer", {});
      emptyView.find(".online-empty__buttons").remove();
      _scroll.append(emptyView);
      _explorer.clear();
      _explorer.append(_scroll.render());
      this.activity.loader(false);
    };

    this.start = function () {
      if (Lampa.Activity.active().activity !== this.activity) return;
      if (!_0x1f70e9) {
        _0x1f70e9 = true;
        this.initialize();
      }
      Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(_0x1140bc.movie));
      Lampa.Controller.add("content", {
        "toggle": function () {
          Lampa.Controller.collectionSet(_0scroll.render(), _explorer.render());
        },
        "gone": function () {},
        "up": function () { Lampa.Controller.toggle("head"); },
        "down": function () {},
        "right": function () {},
        "left": function () { Lampa.Controller.toggle("menu"); },
        "back": _this.back.bind(_this)
      });
      Lampa.Controller.toggle("content");
    };

    this.render = function () { return _explorer.render(); };
    this.back = function () { Lampa.Activity.backward(); };
    this.destroy = function () { _request.clear(); _scroll.destroy(); _explorer.destroy(); };
  };

  function initPlugin() {
    // Внедрение разметки HTML-шаблонов без использования относительных путей до картинок (CORS Safe)
    Lampa.Template.add("lampac_prestige_full", '<div class="online-prestige online-prestige--full selector"><div class="online-prestige__img"></div><div class="online-prestige__body"><div class="online-prestige__head"><div class="online-prestige__title">{title}</div><div class="online-prestige__time">{time}</div></div><div class="online-prestige__timeline"></div><div class="online-prestige__footer"><div class="online-prestige__info">{info}</div><div class="online-prestige__quality">{quality}</div></div></div></div>');
    Lampa.Template.add("lampac_content_loading", '<div class="online-empty"><div class="broadcast__scan"><div></div></div><div class="online-empty__templates"><div class="online-empty-template selector"><div class="online-empty-template__body" style="width:100%">Загрузка контента...</div></div></div></div>');
    Lampa.Template.add("lampac_does_not_answer", '<div class="online-empty"><div class="online-empty__title">Поиск не дал результатов</div><div class="online-empty__time">Попробуйте сменить балансер или повторить попытку позже.</div></div>');

    var manifest = {
      "type": "video",
      "version": "7.7.7",
      "name": "Cinema",
      "description": "Плагин для просмотра фильмов онлайн",
      "component": "cinema_online",
      "onContextMenu": function () { return { "name": "Смотреть онлайн", "description": "" }; },
      "onContextLauch": function (card) {
        Lampa.Component.add("cinema_online", CinemaOnlineComponent);
        Lampa.Activity.push({
          "url": "",
          "title": "Онлайн",
          "component": "cinema_online",
          "movie": card,
          "page": 1
        });
      }
    };

    Lampa.Manifest.plugins = manifest;
    Lampa.Lang.add({ "lampac_balanser": { "ru": "Источник", "en": "Source" } });

    function injectButton(target, movie) {
      if (target.find(".cinema--online").length) return;
      var btn = $('<div class="full-start__button selector cinema--online lampac--button"><span>Смотреть онлайн</span></div>');
      btn.on("hover:enter", function () {
        manifest.onContextLauch(movie);
      });
      target.append(btn);
    }

    Lampa.Listener.follow("full", function (e) {
      if (e.type == "complite") {
        injectButton(e.object.activity.render().find(".view--torrent"), e.data.movie);
      }
    });

    try {
      if (Lampa.Activity.active().component == "full") {
        injectButton(Lampa.Activity.active().activity.render().find(".view--torrent"), Lampa.Activity.active().card);
      }
    } catch (err) {}
  }

  initPlugin();
})();
