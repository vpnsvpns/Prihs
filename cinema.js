(function () {
  'use strict';

  Lampa.Platform.tv();
  (function () {
    "use strict";
    var domain = "https://ab2024.ru",
      config = {
        "api": "lampac",
        "localhost": domain + "/",
        "apn": ""
      },
      eventsData,
      unic_id = Lampa.Storage.get("lampac_unic_id", "");
      
    if (!unic_id) {
      unic_id = Lampa.Utils.uid(8).toLowerCase();
      Lampa.Storage.set("lampac_unic_id", unic_id);
    }

    function getApkVersion() {
      if (Lampa.Platform.is("android")) {
        try {
          var appVersion = AndroidJS.appVersion().split("-");
          return parseInt(appVersion.pop());
        } catch (e) {
          return 0;
        }
      } else return 0;
    }

    var hostName = domain.replace("http://", "").replace("https://", "");
    if (!window.rch_nws || !window.rch_nws[hostName]) {
      if (!window.rch_nws) window.rch_nws = {};
      window.rch_nws[hostName] = {
        "type": Lampa.Platform.is("android") ? "apk" : Lampa.Platform.is("tizen") ? "cors" : undefined,
        "startTypeInvoke": false,
        "rchRegistry": false,
        "apkVersion": getApkVersion()
      };
    }

    window.rch_nws[hostName].typeInvoke = function (_domain, callback) {
      if (!window.rch_nws[hostName].startTypeInvoke) {
        window.rch_nws[hostName].startTypeInvoke = true;
        var setType = function (isCors) {
          window.rch_nws[hostName].type = Lampa.Platform.is("android") ? "apk" : isCors ? "cors" : "web";
          callback();
        };
        if (Lampa.Platform.is("android") || Lampa.Platform.is("tizen")) {
            setType(true);
        } else {
          var req = new Lampa.Reguest();
          req.silent(domain.indexOf(location.host) >= 0 ? "https://github.com/" : _domain + "/cors/check", function () {
            setType(true);
          }, function () {
            setType(false);
          }, false, {
            "dataType": "text"
          });
        }
      } else callback();
    };

    window.rch_nws[hostName].Registry = function (client, callback) {
      window.rch_nws[hostName].typeInvoke(domain, function () {
        client.invoke("RchRegistry", {
          "host": location.host,
          "rchtype": Lampa.Platform.is("android") ? "apk" : Lampa.Platform.is("tizen") ? "cors" : window.rch_nws[hostName].type || "web",
          "apkVersion": Lampa.Platform.is("android") ? window.rch_nws[hostName].apkVersion || 0 : 0,
          "player": Lampa.Storage.field("player")
        });
        if (window.rch_nws[hostName].rchRegistry) return;
        window.rch_nws[hostName].rchRegistry = true;
        var isRegistered = false;
        
        client.on("RchRegistry", function (a, b, c) {
          if (callback && !isRegistered) {
              isRegistered = true;
              callback();
          }
        });
        
        client.on("RchClient", function (id, method, data, headers, returnHeaders) {
          var req = new Lampa.Reguest();
          function sendResult(path, resultData) {
            $.ajax({
              "url": domain + "/rch/" + path + "?id=" + id,
              "type": "POST",
              "data": resultData,
              "async": true,
              "cache": false,
              "contentType": false,
              "processData": false,
              "success": function () {},
              "error": function () {
                client.invoke("RchResult", id, "");
              }
            });
          }
          function processResult(res) {
            (Lampa.Arrays.isObject(res) || Lampa.Arrays.isArray(res)) && (res = JSON.stringify(res));
            if (typeof CompressionStream !== "undefined" && res && res.length > 1000) {
              var gzip = new CompressionStream("gzip"),
                encoder = new TextEncoder(),
                stream = new ReadableStream({
                  "start": function (controller) {
                    controller.enqueue(encoder.encode(res));
                    controller.close();
                  }
                }),
                compressedStream = stream.pipeThrough(gzip);
                
              new Response(compressedStream).arrayBuffer().then(function (buffer) {
                var compressedData = new Uint8Array(buffer);
                compressedData.length > res.length ? sendResult("result", res) : sendResult("gzresult", compressedData);
              })["catch"](function () {
                sendResult("result", res);
              });
            } else sendResult("result", res);
          }
          
          if (method == "eval") {
              console.log("RCH", method, data);
              processResult(eval(data));
          } else if (method == "evalrun") {
              console.log("RCH", method, data);
              eval(data);
          } else if (method == "ping") {
              processResult("pong");
          } else {
              console.log("RCH", method);
              req.native(method, processResult, function (err) {
                console.log("RCH", "result empty, " + err.status);
                processResult("");
              }, data, {
                "dataType": "text",
                "timeout": 1000 * 8,
                "headers": headers,
                "returnHeaders": returnHeaders
              });
          }
        });
        
        client.on("Connected", function (connId) {
          console.log("RCH", "ConnectionId: " + connId);
          window.rch_nws[hostName].connectionId = connId;
        });
        
        client.on("Closed", function () {
          console.log("RCH", "Connection closed");
        });
        
        client.on("Error", function (err) {
          console.log("RCH", "error:", err);
        });
      });
    };

    window.rch_nws[hostName].typeInvoke(domain, function () {});

    function connectNws(domainData, callback) {
      if (!window.nwsClient) window.nwsClient = {};
      var client = window.nwsClient[hostName];
      if (client && client.connectionId != null) {
          callback();
      } else if (client) {
          console.log("RCH", "Reconnecting...");
          client.reconnect(function () {
            callback();
          });
      } else {
          window.nwsClient[hostName] = new NativeWsClient(domainData.nws, {
            "autoReconnect": true
          });
          window.nwsClient[hostName].on("Connected", function (data) {
            window.rch_nws[hostName].Registry(window.nwsClient[hostName], function () {
              callback();
            });
          });
          window.nwsClient[hostName].connect();
      }
    }

    function initClient(domainData, callback) {
      typeof NativeWsClient == "undefined" ? Lampa.Utils.putScript([domain + "/js/nws-client-es5.js?v21042026"], function () {}, false, function () {
        connectNws(domainData, callback);
      }, true) : connectNws(domainData, callback);
    }

    function appendUrlParams(url) {
      url = url + "";
      if (url.indexOf("account_email=") == -1) {
        var email = Lampa.Storage.get("account_email");
        if (email) url = Lampa.Utils.addUrlComponent(url, "account_email=" + encodeURIComponent(email));
      }
      if (url.indexOf("uid=") == -1) {
        var uid = Lampa.Storage.get("lampac_unic_id", "");
        if (uid) url = Lampa.Utils.addUrlComponent(url, "uid=" + encodeURIComponent(uid));
      }
      if (url.indexOf("token=") == -1) {
        var token = "";
        if (token != "") url = Lampa.Utils.addUrlComponent(url, "token=");
      }
      if (url.indexOf("nws_id=") == -1) {
        var nws_id = Lampa.Storage.get("lampac_nws_id", "");
        if (nws_id) url = Lampa.Utils.addUrlComponent(url, "nws_id=" + encodeURIComponent(nws_id));
      }
      return url;
    }

    function getHeaders() {
      var key = Lampa.Storage.get("kit_aesgcmkey", "");
      if (key) return {
        "X-Kit-AesGcm": key
      };
      return {};
    }

    function formatNumber(num) {
      return (num < 10 ? "0" : "") + num;
    }

    var RequestClass = Lampa.Reguest;

    function CinemaComponent(object) {
      var network = new RequestClass(),
        scroll = new Lampa.Scroll({
          "mask": true,
          "over": true
        }),
        explorer = new Lampa.Explorer(object),
        filter = new Lampa.Filter(object),
        sourcesData = {},
        activeItem,
        activeUrl,
        activeBalanser,
        isStarted,
        checkInterval,
        imagesList = [],
        requestCount = 0,
        requestTimeout,
        lifeAttempts = 0,
        lifeTimeout,
        balanserList = {},
        translation = {
          "season": Lampa.Lang.translate("torrent_serial_season"),
          "voice": Lampa.Lang.translate("torrent_parser_voice"),
          "source": Lampa.Lang.translate("settings_rest_source")
        },
        currentChoices = {
          "season": [],
          "voice": []
        };

      if (eventsData == undefined) {
          network.timeout(10000);
          network.silent(appendUrlParams(domain + "/lite/withsearch"), function (res) {
            eventsData = res;
          }, function () {
            eventsData = [];
          });
      }

      function getSourceName(source) {
        var bName = source.balanser,
            sName = source.name.split(" ")[0];
        return (bName || sName).toLowerCase();
      }

      function saveClarification(data) {
        var hash = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title),
            store = Lampa.Storage.get("clarification_search", "{}");
        store[hash] = data;
        Lampa.Storage.set("clarification_search", store);
      }

      function resetClarification() {
        var hash = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title),
            store = Lampa.Storage.get("clarification_search", "{}");
        delete store[hash];
        Lampa.Storage.set("clarification_search", store);
      }

      this.initialize = function () {
        var _this = this;
        this.loading(true);
        
        filter.onSearch = function (query) {
          saveClarification(query);
          Lampa.Activity.replace({
            "search": query,
            "clarification": true,
            "similar": true
          });
        };
        
        filter.onBack = function () {
          _this.start();
        };
        
        filter.render().find(".selector").on("hover:enter", function () {
          clearInterval(checkInterval);
        });
        
        filter.render().find(".filter--search").appendTo(filter.render().find(".torrent-filter"));
        
        filter.onSelect = function (type, data, item) {
          if (type == "filter") {
            if (data.reset) {
                resetClarification();
                _this.replaceChoice({
                  "season": 0,
                  "voice": 0,
                  "voice_url": "",
                  "voice_name": ""
                });
                setTimeout(function () {
                  Lampa.Select.close();
                  Lampa.Activity.replace({
                    "clarification": 0,
                    "similar": 0
                  });
                }, 10);
            } else {
              var url = currentChoices[data.stype][item.index].url,
                  choice = _this.getChoice();
                  
              if (data.stype == "voice") {
                  choice.voice_name = currentChoices.voice[item.index].title;
                  choice.voice_url = url;
              }
              choice[data.stype] = item.index;
              _this.saveChoice(choice);
              _this.reset();
              _this.request(url);
              setTimeout(Lampa.Select.close, 10);
            }
          } else if (type == "sort") {
              Lampa.Select.close();
              object.lampac_custom_select = data.source;
              _this.changeBalanser(data.source);
          }
        };

        if (filter.addButtonBack) filter.addButtonBack();
        
        filter.render().find(".filter--sort span").text(Lampa.Lang.translate("lampac_balanser"));
        scroll.body().addClass("torrent-list");
        explorer.appendFiles(scroll.render());
        explorer.appendHead(filter.render());
        scroll.minus(explorer.render().find(".explorer__files-head"));
        scroll.body().append(Lampa.Template.get("lampac_content_loading"));
        Lampa.Controller.enable("content");
        this.loading(false);

        if (object.balanser) {
            explorer.render().find(".filter--search").remove();
            sourcesData = {};
            sourcesData[object.balanser] = {
              "name": object.balanser
            };
            activeBalanser = object.balanser;
            balanserList = [];
            network.native(appendUrlParams(object.url.replace("rjson=", "nojson=")), this.parse.bind(this), function () {
              explorer.render().find(".torrent-filter").remove();
              _this.empty();
            }, false, {
              "dataType": "text",
              "headers": getHeaders()
            });
            return;
        }

        this.externalids().then(function () {
          return _this.createSource();
        }).then(function () {
          !eventsData.find(function (ev) {
            return activeBalanser.slice(0, ev.length) == ev;
          }) && filter.render().find(".filter--search").addClass("hide");
          _this.search();
        })["catch"](function (err) {
          _this.noConnectToServer(err);
        });
      };

      this.rch = function (data, callback) {
        var _this = this;
        initClient(data, function () {
          if (!callback) _this.find(); else callback();
        });
      };

      this.externalids = function () {
        return new Promise(function (resolve) {
          if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
            var params = [];
            params.push("id=" + encodeURIComponent(object.movie.id));
            params.push("serial=" + (object.movie.name ? 1 : 0));
            if (object.movie.imdb_id) params.push("imdb_id=" + (object.movie.imdb_id || ""));
            if (object.movie.kinopoisk_id) params.push("kinopoisk_id=" + (object.movie.kinopoisk_id || ""));
            
            var url = config.localhost + "externalids?" + params.join("&");
            network.timeout(10000);
            network.silent(appendUrlParams(url), function (res) {
              for (var key in res) {
                object.movie[key] = res[key];
              }
              resolve();
            }, function () {
              resolve();
            }, false, {
              "headers": getHeaders()
            });
          } else resolve();
        });
      };

      this.updateBalanser = function (name) {
        var cache = Lampa.Storage.cache("online_last_balanser", 3000, {});
        cache[object.movie.id] = name;
        Lampa.Storage.set("online_last_balanser", cache);
      };

      this.changeBalanser = function (name) {
        this.updateBalanser(name);
        Lampa.Storage.set("online_balanser", name);
        var newChoice = this.getChoice(name),
            oldChoice = this.getChoice();
        if (oldChoice.voice_name) newChoice.voice_name = oldChoice.voice_name;
        this.saveChoice(newChoice, name);
        Lampa.Activity.replace();
      };

      this.requestParams = function (base) {
        var params = [],
            source = object.movie.source || "tmdb";
            
        params.push("id=" + encodeURIComponent(object.movie.id));
        if (object.movie.imdb_id) params.push("imdb_id=" + (object.movie.imdb_id || ""));
        if (object.movie.kinopoisk_id) params.push("kinopoisk_id=" + (object.movie.kinopoisk_id || ""));
        if (object.movie.tmdb_id) params.push("tmdb_id=" + (object.movie.tmdb_id || ""));
        
        if (object.movie.keywords && object.movie.keywords.results) {
            for (var i = 0; i < object.movie.keywords.results.length; i++) {
              if (object.movie.keywords.results[i].name == "anime") {
                params.push("anime=1");
                break;
              }
            }
        }
        
        params.push("title=" + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
        params.push("original_title=" + encodeURIComponent(object.movie.original_title || object.movie.original_name));
        params.push("serial=" + (object.movie.name ? 1 : 0));
        params.push("original_language=" + (object.movie.original_language || ""));
        params.push("year=" + ((object.movie.release_date || object.movie.first_air_date || "0000") + "").slice(0, 4));
        params.push("source=" + source);
        params.push("clarification=" + (object.clarification ? 1 : 0));
        params.push("similar=" + (object.similar ? true : false));
        params.push("rchtype=" + ((window.rch_nws && window.rch_nws[hostName] ? window.rch_nws[hostName].type : window.rch && window.rch[hostName] ? window.rch[hostName].type : "") || ""));
        
        if (Lampa.Storage.get("account_email", "")) {
            params.push("cub_id=" + Lampa.Utils.hash(Lampa.Storage.get("account_email", "")));
        }
        return base + (base.indexOf("?") >= 0 ? "&" : "?") + params.join("&");
      };

      this.getLastChoiceBalanser = function () {
        var cache = Lampa.Storage.cache("online_last_balanser", 3000, {});
        return cache[object.movie.id] ? cache[object.movie.id] : Lampa.Storage.get("online_balanser", balanserList.length ? balanserList[0] : "");
      };

      this.startSource = function (data) {
        return new Promise(function (resolve, reject) {
          data.forEach(function (item) {
            var name = getSourceName(item);
            sourcesData[name] = {
              "url": item.url,
              "name": item.name,
              "show": typeof item.show == "undefined" ? true : item.show
            };
          });
          balanserList = Lampa.Arrays.getKeys(sourcesData);
          
          if (balanserList.length) {
            var cache = Lampa.Storage.cache("online_last_balanser", 3000, {});
            if (cache[object.movie.id]) {
                activeBalanser = cache[object.movie.id];
            } else {
                activeBalanser = Lampa.Storage.get("online_balanser", balanserList[0]);
            }
            if (!sourcesData[activeBalanser]) activeBalanser = balanserList[0];
            if (!sourcesData[activeBalanser].show && !object.lampac_custom_select) activeBalanser = balanserList[0];
            
            activeUrl = sourcesData[activeBalanser].url;
            Lampa.Storage.set("active_balanser", activeBalanser);
            resolve(data);
          } else reject();
        });
      };

      this.lifeSource = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
          var url = _this.requestParams(config.localhost + "lifeevents?memkey=" + (_this.memkey || "")),
              isFound = false,
              processData = function (data, checkShow) {
                if (data.accsdb) return reject(data);
                var lastChoice = _this.getLastChoiceBalanser();
                if (!isFound) {
                  var filtered = data.online.filter(function (item) {
                    return checkShow ? item.show : item.show && item.name.toLowerCase() == lastChoice;
                  });
                  if (filtered.length) {
                      isFound = true;
                      resolve(data.online.filter(function (i) { return i.show; }));
                  } else if (checkShow) {
                      reject();
                  }
                }
              },
              requestLife = function () {
                network.timeout(3000);
                network.silent(appendUrlParams(url), function (res) {
                  lifeAttempts++;
                  balanserList = [];
                  sourcesData = {};
                  res.online.forEach(function (item) {
                    var name = getSourceName(item);
                    sourcesData[name] = {
                      "url": item.url,
                      "name": item.name,
                      "show": typeof item.show == "undefined" ? true : item.show
                    };
                  });
                  balanserList = Lampa.Arrays.getKeys(sourcesData);
                  filter.set("sort", balanserList.map(function (k) {
                    return {
                      "title": sourcesData[k].name,
                      "source": k,
                      "selected": k == activeBalanser,
                      "ghost": !sourcesData[k].show
                    };
                  }));
                  filter.chosen("sort", [sourcesData[activeBalanser] ? sourcesData[activeBalanser].name : activeBalanser]);
                  processData(res);
                  
                  var currentBalanser = _this.getLastChoiceBalanser();
                  if (lifeAttempts > 15 || res.ready) {
                      filter.render().find(".lampac-balanser-loader").remove();
                      processData(res, true);
                  } else if (!isFound && sourcesData[currentBalanser] && sourcesData[currentBalanser].show) {
                      processData(res, true);
                      lifeTimeout = setTimeout(requestLife, 1000);
                  } else {
                      lifeTimeout = setTimeout(requestLife, 1000);
                  }
                }, function () {
                  lifeAttempts++;
                  lifeAttempts > 15 ? reject() : lifeTimeout = setTimeout(requestLife, 1000);
                }, false, {
                  "headers": getHeaders()
                });
              };
          requestLife();
        });
      };

      this.createSource = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
          var url = _this.requestParams(config.localhost + "lite/events?life=true");
          network.timeout(15000);
          network.silent(appendUrlParams(url), function (res) {
            if (res.accsdb) return reject(res);
            if (res.life) {
              _this.memkey = res.memkey;
              if (res.title) {
                if (object.movie.name) object.movie.name = res.title;
                if (object.movie.title) object.movie.title = res.title;
              }
              filter.render().find(".filter--sort").append("<span class=\"lampac-balanser-loader\" style=\"width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em\"></span>");
              _this.lifeSource().then(_this.startSource.bind(_this)).then(resolve)["catch"](reject);
            } else {
                _this.startSource(res).then(resolve)["catch"](reject);
            }
          }, reject, false, {
            "headers": getHeaders()
          });
        });
      };

      this.create = function () {
        return this.render();
      };

      this.search = function () {
        this.filter({
          "source": balanserList
        }, this.getChoice());
        this.find();
      };

      this.find = function () {
        this.request(this.requestParams(activeUrl));
      };

      this.request = function (url) {
        requestCount++;
        if (requestCount < 10) {
            network.native(appendUrlParams(url), this.parse.bind(this), this.doesNotAnswer.bind(this), false, {
              "dataType": "text",
              "headers": getHeaders()
            });
            clearTimeout(requestTimeout);
            requestTimeout = setTimeout(function () {
              requestCount = 0;
            }, 4000);
        } else {
            this.empty();
        }
      };

      this.parseJsonDate = function (html, selector) {
        try {
          var container = $("<div>" + html + "</div>"),
              items = [];
          container.find(selector).each(function () {
            var el = $(this),
                data = JSON.parse(el.attr("data-json")),
                s = el.attr("s"),
                e = el.attr("e"),
                text = el.text();
                
            if (!object.movie.name) {
                if (text.match(/\d+p/i)) {
                    if (!data.quality) {
                        data.quality = {};
                        data.quality[text] = data.url;
                    }
                    text = object.movie.title;
                }
                if (text == "По умолчанию") text = object.movie.title;
            }
            if (e) data.episode = parseInt(e);
            if (s) data.season = parseInt(s);
            if (text) data.text = text;
            data.active = el.hasClass("active");
            items.push(data);
          });
          return items;
        } catch (e) {
          return [];
        }
      };

      this.getFileUrl = function (item, callback, isRchCallback) {
        var _this = this;
        if (Lampa.Storage.field("player") !== "inner" && item.stream && Lampa.Platform.is("apple")) {
          var clone = Lampa.Arrays.clone(item);
          clone.method = "play";
          clone.url = item.stream;
          callback(clone, {});
        } else {
          if (item.method == "play") {
              callback(item, {});
          } else {
              Lampa.Loading.start(function () {
                Lampa.Loading.stop();
                Lampa.Controller.toggle("content");
                network.clear();
              });
              network.native(appendUrlParams(item.url), function (res) {
                if (res.rch) {
                    if (isRchCallback) {
                        isRchCallback = false;
                        Lampa.Loading.stop();
                        callback(false, {});
                    } else {
                        _this.rch(res, function () {
                          Lampa.Loading.stop();
                          _this.getFileUrl(item, callback, true);
                        });
                    }
                } else {
                    Lampa.Loading.stop();
                    callback(res, res);
                }
              }, function () {
                Lampa.Loading.stop();
                callback(false, {});
              }, false, {
                "headers": getHeaders()
              });
          }
        }
      };

      this.toPlayElement = function (item) {
        return {
          "title": item.title,
          "url": item.url,
          "quality": item.qualitys,
          "timeline": item.timeline,
          "subtitles": item.subtitles,
          "segments": item.segments,
          "callback": item.mark,
          "season": item.season,
          "episode": item.episode,
          "voice_name": item.voice_name,
          "thumbnail": item.thumbnail
        };
      };

      this.orUrlReserve = function (item) {
        if (item.url && typeof item.url == "string" && item.url.indexOf(" or ") !== -1) {
          var parts = item.url.split(" or ");
          item.url = parts[0];
          item.url_reserve = parts[1];
        }
      };

      this.setDefaultQuality = function (item) {
        if (item.quality && Lampa.Arrays.getKeys(item.quality).length) {
            for (var key in item.quality) {
              if (parseInt(key) == Lampa.Storage.field("video_quality_default")) {
                  item.url = item.quality[key];
                  this.orUrlReserve(item);
              }
              if (item.quality[key].indexOf(" or ") !== -1) {
                  item.quality[key] = item.quality[key].split(" or ")[0];
              }
            }
        }
      };

      this.display = function (items) {
        var _this = this;
        this.draw(items, {
          "onEnter": function (item, html) {
            _this.getFileUrl(item, function (res, options) {
              if (res && res.url) {
                var playlist = [],
                    playElement = _this.toPlayElement(item);
                    
                playElement.url = res.url;
                playElement.headers = options.headers || res.headers;
                playElement.quality = options.quality || item.qualitys;
                playElement.segments = options.segments || item.segments;
                playElement.hls_manifest_timeout = options.hls_manifest_timeout || res.hls_manifest_timeout;
                playElement.subtitles = res.subtitles;
                playElement.subtitles_call = options.subtitles_call || res.subtitles_call;
                
                if (res.vast && res.vast.url) {
                    playElement.vast_url = res.vast.url;
                    playElement.vast_msg = res.vast.msg;
                    playElement.vast_region = res.vast.region;
                    playElement.vast_platform = res.vast.platform;
                    playElement.vast_screen = res.vast.screen;
                }
                
                _this.orUrlReserve(playElement);
                _this.setDefaultQuality(playElement);
                
                if (item.season) {
                    items.forEach(function (sibling) {
                      var siblingElement = _this.toPlayElement(sibling);
                      if (sibling == item) {
                          siblingElement.url = res.url;
                      } else if (sibling.method == "call") {
                          if (Lampa.Storage.field("player") !== "inner") {
                              siblingElement.url = sibling.stream;
                              delete siblingElement.quality;
                          } else {
                              siblingElement.url = function (done) {
                                _this.getFileUrl(sibling, function (sRes, sOpt) {
                                  if (sRes.url) {
                                      siblingElement.url = sRes.url;
                                      siblingElement.quality = sOpt.quality || sibling.qualitys;
                                      siblingElement.segments = sOpt.segments || sibling.segments;
                                      siblingElement.subtitles = sRes.subtitles;
                                      _this.orUrlReserve(siblingElement);
                                      _this.setDefaultQuality(siblingElement);
                                      sibling.mark();
                                  } else {
                                      siblingElement.url = "";
                                      Lampa.Noty.show(Lampa.Lang.translate("lampac_nolink"));
                                  }
                                  done();
                                }, function () {
                                  siblingElement.url = "";
                                  done();
                                });
                              };
                          }
                      } else {
                          siblingElement.url = sibling.url;
                      }
                      _this.orUrlReserve(siblingElement);
                      _this.setDefaultQuality(siblingElement);
                      playlist.push(siblingElement);
                    });
                } else {
                    playlist.push(playElement);
                }
                
                if (playlist.length > 1) playElement.playlist = playlist;
                
                if (playElement.url) {
                  playElement.isonline = true;
                  Lampa.Player.play(playElement);
                  Lampa.Player.playlist(playlist);
                  if (playElement.subtitles_call) _this.loadSubtitles(playElement.subtitles_call);
                  item.mark();
                  _this.updateBalanser(activeBalanser);
                } else {
                  Lampa.Noty.show(Lampa.Lang.translate("lampac_nolink"));
                }
              } else {
                  Lampa.Noty.show(Lampa.Lang.translate("lampac_nolink"));
              }
            }, true);
          },
          "onContextMenu": function (item, html, target, setContext) {
            _this.getFileUrl(item, function (res) {
              setContext({
                "file": res.url,
                "quality": item.qualitys
              });
            }, true);
          }
        });
        
        this.filter({
          "season": currentChoices.season.map(function (i) { return i.title; }),
          "voice": currentChoices.voice.map(function (i) { return i.title; })
        }, this.getChoice());
      };

      this.loadSubtitles = function (url) {
        network.silent(appendUrlParams(url), function (res) {
          Lampa.Player.subtitles(res);
        }, function () {}, false, {
          "headers": getHeaders()
        });
      };

      this.parse = function (html) {
        var data = Lampa.Arrays.decodeJson(html, {});
        if (Lampa.Arrays.isObject(html) && html.rch) data = html;
        if (data.rch) return this.rch(data);
        try {
          var items = this.parseJsonDate(html, ".videos__item"),
              buttons = this.parseJsonDate(html, ".videos__button");
              
          if (items.length == 1 && items[0].method == "link" && !items[0].similar) {
              currentChoices.season = items.map(function (i) {
                return { "title": i.text, "url": i.url };
              });
              this.replaceChoice({ "season": 0 });
              this.request(items[0].url);
          } else {
            this.activity.loader(false);
            var playable = items.filter(function (i) {
                return i.method == "play" || i.method == "call";
              }),
              similar = items.filter(function (i) {
                return i.similar;
              });
              
            if (playable.length) {
              if (buttons.length) {
                currentChoices.voice = buttons.map(function (b) {
                  return { "title": b.text, "url": b.url };
                });
                var currentChoice = this.getChoice(activeBalanser),
                    voiceUrl = currentChoice.voice_url,
                    voiceName = currentChoice.voice_name,
                    foundByUrl = buttons.find(function (b) { return b.url == voiceUrl; }),
                    foundByName = buttons.find(function (b) { return b.text == voiceName; }),
                    activeBtn = buttons.find(function (b) { return b.active; });
                    
                if (foundByUrl && !foundByUrl.active) {
                    this.replaceChoice({
                      "voice": buttons.indexOf(foundByUrl),
                      "voice_name": foundByUrl.text
                    });
                    this.request(foundByUrl.url);
                } else if (foundByName && !foundByName.active) {
                    this.replaceChoice({
                      "voice": buttons.indexOf(foundByName),
                      "voice_name": foundByName.text
                    });
                    this.request(foundByName.url);
                } else if (activeBtn) {
                    this.replaceChoice({
                      "voice": buttons.indexOf(activeBtn),
                      "voice_name": activeBtn.text
                    });
                    this.display(playable);
                } else {
                    this.display(playable);
                }
              } else {
                this.replaceChoice({
                  "voice": 0,
                  "voice_url": "",
                  "voice_name": ""
                });
                this.display(playable);
              }
            } else {
              if (items.length) {
                if (similar.length) {
                    this.similars(similar);
                    this.activity.loader(false);
                } else {
                  currentChoices.season = items.map(function (i) {
                    return { "title": i.text, "url": i.url };
                  });
                  var seasonIdx = this.getChoice(activeBalanser).season,
                      seasonItem = currentChoices.season[seasonIdx];
                  if (!seasonItem) seasonItem = currentChoices.season[0];
                  this.request(seasonItem.url);
                }
              } else {
                  this.doesNotAnswer(data);
              }
            }
          }
        } catch (e) {
          this.doesNotAnswer(e);
        }
      };

      this.similars = function (data) {
        var _this = this;
        scroll.clear();
        data.forEach(function (item) {
          item.title = item.text;
          item.info = "";
          var infoArr = [],
              year = ((item.start_date || item.year || object.movie.release_date || object.movie.first_air_date || "") + "").slice(0, 4);
          if (year) infoArr.push(year);
          if (item.details) infoArr.push(item.details);
          var title = item.title || item.text;
          item.title = title;
          item.time = item.time || "";
          item.info = infoArr.join("<span class=\"online-prestige-split\">●</span>");
          
          var html = Lampa.Template.get("lampac_prestige_folder", item);
          if (item.img) {
            var img = $("<img style=\"height: 7em; width: 7em; border-radius: 0.3em;\"/>");
            html.find(".online-prestige__folder").empty().append(img);
            if (item.img !== undefined) {
              if (item.img.charAt(0) === "/") item.img = config.localhost + item.img.substring(1);
              if (item.img.indexOf("/proxyimg") !== -1) item.img = appendUrlParams(item.img);
            }
            Lampa.Utils.imgLoad(img, item.img);
          }
          
          html.on("hover:enter", function () {
            _this.reset();
            _this.request(item.url);
          }).on("hover:focus", function (e) {
            activeItem = e.target;
            scroll.update($(e.target), true);
          });
          scroll.append(html);
        });
        
        this.filter({
          "season": currentChoices.season.map(function (i) { return i.title; }),
          "voice": currentChoices.voice.map(function (i) { return i.title; })
        }, this.getChoice());
        Lampa.Controller.enable("content");
      };

      this.getChoice = function (balanserName) {
        var cache = Lampa.Storage.cache("online_choice_" + (balanserName || activeBalanser), 3000, {}),
            choice = cache[object.movie.id] || {};
        return Lampa.Arrays.extend(choice, {
          "season": 0,
          "voice": 0,
          "voice_name": "",
          "voice_id": 0,
          "episodes_view": {},
          "movie_view": ""
        }), choice;
      };

      this.saveChoice = function (choice, balanserName) {
        var cache = Lampa.Storage.cache("online_choice_" + (balanserName || activeBalanser), 3000, {});
        cache[object.movie.id] = choice;
        Lampa.Storage.set("online_choice_" + (balanserName || activeBalanser), cache);
        this.updateBalanser(balanserName || activeBalanser);
      };

      this.replaceChoice = function (data, balanserName) {
        var choice = this.getChoice(balanserName);
        Lampa.Arrays.extend(choice, data, true);
        this.saveChoice(choice, balanserName);
      };

      this.clearImages = function () {
        imagesList.forEach(function (img) {
          img.onerror = function () {};
          img.onload = function () {};
          img.src = "";
        });
        imagesList = [];
      };

      this.reset = function () {
        activeItem = false;
        clearInterval(checkInterval);
        network.clear();
        this.clearImages();
        scroll.render().find(".empty").remove();
        scroll.clear();
        scroll.reset();
        scroll.body().append(Lampa.Template.get("lampac_content_loading"));
      };

      this.loading = function (isLoading) {
        if (isLoading) {
            this.activity.loader(true);
        } else {
            this.activity.loader(false);
            this.activity.toggle();
        }
      };

      this.filter = function (data, choice) {
        var _this = this,
            filters = [],
            addFilter = function (type, title) {
              var ch = _this.getChoice(),
                  src = data[type],
                  items = [],
                  selected = ch[type];
              src.forEach(function (val, idx) {
                items.push({
                  "title": val,
                  "selected": selected == idx,
                  "index": idx
                });
              });
              filters.push({
                "title": title,
                "subtitle": src[selected],
                "items": items,
                "stype": type
              });
            };
            
        data.source = balanserList;
        filters.push({
          "title": Lampa.Lang.translate("torrent_parser_reset"),
          "reset": true
        });
        this.saveChoice(choice);
        
        if (data.voice && data.voice.length) addFilter("voice", Lampa.Lang.translate("torrent_parser_voice"));
        if (data.season && data.season.length) addFilter("season", Lampa.Lang.translate("torrent_serial_season"));
        
        filter.set("filter", filters);
        filter.set("sort", balanserList.map(function (k) {
          return {
            "title": sourcesData[k].name,
            "source": k,
            "selected": k == activeBalanser,
            "ghost": !sourcesData[k].show
          };
        }));
        this.selected(data);
      };

      this.selected = function (data) {
        var choice = this.getChoice(),
            arr = [];
        for (var key in choice) {
          if (data[key] && data[key].length) {
            if (key == "voice") {
                arr.push(translation[key] + ": " + data[key][choice[key]]);
            } else if (key !== "source" && data.season.length >= 1) {
                arr.push(translation.season + ": " + data[key][choice[key]]);
            }
          }
        }
        filter.chosen("filter", arr);
        filter.chosen("sort", [sourcesData[activeBalanser].name]);
      };

      this.getEpisodes = function (season, callback) {
        var eps = [],
            id = object.movie.id;
        if (["cub", "tmdb"].indexOf(object.movie.source || "tmdb") == -1) id = object.movie.tmdb_id;
        if (typeof id == "number" && object.movie.name) {
            Lampa.Api.sources.tmdb.get("tv/" + id + "/season/" + season, {}, function (res) {
              eps = res.episodes || [];
              callback(eps);
            }, function () {
              callback(eps);
            });
        } else {
            callback(eps);
        }
      };

      this.watched = function (data) {
        var hash = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title),
            cache = Lampa.Storage.cache("online_watched_last", 5000, {});
        if (data) {
          if (!cache[hash]) cache[hash] = {};
          Lampa.Arrays.extend(cache[hash], data, true);
          Lampa.Storage.set("online_watched_last", cache);
          this.updateWatched();
        } else return cache[hash];
      };

      this.updateWatched = function () {
        var last = this.watched(),
            container = scroll.body().find(".online-prestige-watched .online-prestige-watched__body").empty();
        if (last) {
          var arr = [];
          if (last.balanser_name) arr.push(last.balanser_name);
          if (last.voice_name) arr.push(last.voice_name);
          if (last.season) arr.push(Lampa.Lang.translate("torrent_serial_season") + " " + last.season);
          if (last.episode) arr.push(Lampa.Lang.translate("torrent_serial_episode") + " " + last.episode);
          arr.forEach(function (str) {
            container.append("<span>" + str + "</span>");
          });
        } else {
            container.append("<span>" + Lampa.Lang.translate("lampac_no_watch_history") + "</span>");
        }
      };

      this.draw = function (items, options) {
        var _this = this;
        options = options || {};
        if (!items.length) return this.empty();
        scroll.clear();
        if (!object.balanser) scroll.append(Lampa.Template.get("lampac_prestige_watched", {}));
        
        this.updateWatched();
        this.getEpisodes(items[0].season, function (eps) {
          var viewCache = Lampa.Storage.cache("online_view", 5000, []),
              isSerial = object.movie.name ? true : false,
              choice = _this.getChoice(),
              isWide = window.innerWidth > 480,
              focusItem = false,
              viewedItem = false;
              
          items.forEach(function (item, idx) {
            var epData = isSerial && eps.length && !options.similars ? eps.find(function (e) {
                return e.episode_number == item.episode;
              }) : false,
              epNum = item.episode || idx + 1,
              viewedEp = choice.episodes_view[item.season],
              vName = choice.voice_name || (currentChoices.voice[0] ? currentChoices.voice[0].title : false) || item.voice_name || (isSerial ? "Неизвестно" : item.text) || "Неизвестно";
              
            if (item.quality) {
                item.qualitys = item.quality;
                item.quality = Lampa.Arrays.getKeys(item.quality)[0];
            }
            
            Lampa.Arrays.extend(item, {
              "voice_name": vName,
              "info": vName.length > 60 ? vName.substr(0, 60) + "..." : vName,
              "quality": "",
              "time": Lampa.Utils.secondsToTime((epData ? epData.runtime : object.movie.runtime) * 60, true)
            });
            
            var hashT = Lampa.Utils.hash(item.season ? [item.season, item.season > 10 ? ":" : "", item.episode, object.movie.original_title].join("") : object.movie.original_title),
                hashB = Lampa.Utils.hash(item.season ? [item.season, item.season > 10 ? ":" : "", item.episode, object.movie.original_title, item.voice_name].join("") : object.movie.original_title + item.voice_name),
                hashes = {
                  "hash_timeline": hashT,
                  "hash_behold": hashB
                },
                infoArr = [];
                
            if (item.season) {
                item.translate_episode_end = _this.getLastEpisode(items);
                item.translate_voice = item.voice_name;
            }
            if (item.text && !epData) item.title = item.text;
            item.timeline = Lampa.Timeline.view(hashT);
            
            if (epData) {
              item.title = epData.name;
              if (item.info.length < 30 && epData.vote_average) {
                  infoArr.push(Lampa.Template.get("lampac_prestige_rate", {
                    "rate": parseFloat(epData.vote_average + "").toFixed(1)
                  }, true));
              }
              if (epData.air_date && isWide) infoArr.push(Lampa.Utils.parseTime(epData.air_date).full);
            } else if (object.movie.release_date && isWide) {
                infoArr.push(Lampa.Utils.parseTime(object.movie.release_date).full);
            }
            
            if (!isSerial && object.movie.tagline && item.info.length < 30) infoArr.push(object.movie.tagline);
            if (item.info) infoArr.push(item.info);
            
            if (infoArr.length) {
                item.info = infoArr.map(function (i) {
                  return "<span>" + i + "</span>";
                }).join("<span class=\"online-prestige-split\">●</span>");
            }
            
            var html = Lampa.Template.get("lampac_prestige_full", item),
                loader = html.find(".online-prestige__loader"),
                imgWrap = html.find(".online-prestige__img");
                
            if (object.balanser) imgWrap.hide();
            
            if (!isSerial) {
              if (choice.movie_view == hashB) focusItem = html;
            } else if (typeof viewedEp !== "undefined" && viewedEp == epNum) {
              focusItem = html;
            }
            
            if (isSerial && !epData) {
                imgWrap.append("<div class=\"online-prestige__episode-number\">" + formatNumber(item.episode || idx + 1) + "</div>");
                loader.remove();
            } else {
              if (!isSerial && object.movie.backdrop_path == "undefined") {
                  loader.remove();
              } else {
                var imgObj = html.find("img")[0];
                imgObj.onerror = function () {
                  imgObj.src = "./img/img_broken.svg";
                };
                imgObj.onload = function () {
                  imgWrap.addClass("online-prestige__img--loaded");
                  loader.remove();
                  if (isSerial) imgWrap.append("<div class=\"online-prestige__episode-number\">" + formatNumber(item.episode || idx + 1) + "</div>");
                };
                imgObj.src = Lampa.TMDB.image("t/p/w300" + (epData ? epData.still_path : object.movie.backdrop_path));
                imagesList.push(imgObj);
                item.thumbnail = imgObj.src;
              }
            }
            
            html.find(".online-prestige__timeline").append(Lampa.Timeline.render(item.timeline));
            if (viewCache.indexOf(hashB) !== -1) {
                viewedItem = html;
                html.find(".online-prestige__img").append("<div class=\"online-prestige__viewed\">" + Lampa.Template.get("icon_viewed", {}, true) + "</div>");
            }
            
            item.mark = function () {
              viewCache = Lampa.Storage.cache("online_view", 5000, []);
              if (viewCache.indexOf(hashB) == -1) {
                  viewCache.push(hashB);
                  Lampa.Storage.set("online_view", viewCache);
                  if (html.find(".online-prestige__viewed").length == 0) {
                      html.find(".online-prestige__img").append("<div class=\"online-prestige__viewed\">" + Lampa.Template.get("icon_viewed", {}, true) + "</div>");
                  }
              }
              choice = _this.getChoice();
              if (!isSerial) {
                  choice.movie_view = hashB;
              } else {
                  choice.episodes_view[item.season] = epNum;
              }
              _this.saveChoice(choice);
              
              var v_name = choice.voice_name || item.voice_name || item.title;
              if (v_name.length > 30) v_name = v_name.slice(0, 30) + "...";
              
              _this.watched({
                "balanser": activeBalanser,
                "balanser_name": Lampa.Utils.capitalizeFirstLetter(sourcesData[activeBalanser] ? sourcesData[activeBalanser].name.split(" ")[0] : activeBalanser),
                "voice_id": choice.voice_id,
                "voice_name": v_name,
                "episode": item.episode,
                "season": item.season
              });
            };
            
            item.unmark = function () {
              viewCache = Lampa.Storage.cache("online_view", 5000, []);
              if (viewCache.indexOf(hashB) !== -1) {
                  Lampa.Arrays.remove(viewCache, hashB);
                  Lampa.Storage.set("online_view", viewCache);
                  Lampa.Storage.remove("online_view", hashB);
                  html.find(".online-prestige__viewed").remove();
              }
            };
            
            item.timeclear = function () {
              item.timeline.percent = 0;
              item.timeline.time = 0;
              item.timeline.duration = 0;
              Lampa.Timeline.update(item.timeline);
            };
            
            html.on("hover:enter", function () {
              if (object.movie.id) Lampa.Favorite.add("history", object.movie, 100);
              if (options.onEnter) options.onEnter(item, html, hashes);
            }).on("hover:focus", function (e) {
              activeItem = e.target;
              if (options.onFocus) options.onFocus(item, html, hashes);
              scroll.update($(e.target), true);
            });
            
            if (options.onRender) options.onRender(item, html, hashes);
            
            _this.contextMenu({
              "html": html,
              "element": item,
              "onFile": function (ctx) {
                if (options.onContextMenu) options.onContextMenu(item, html, hashes, ctx);
              },
              "onClearAllMark": function () {
                items.forEach(function (i) { i.unmark(); });
              },
              "onClearAllTime": function () {
                items.forEach(function (i) { i.timeclear(); });
              }
            });
            scroll.append(html);
          });
          
          if (isSerial && eps.length > items.length && !options.similars) {
            var rest = eps.slice(items.length);
            rest.forEach(function (ep) {
              var info = [];
              if (ep.vote_average) info.push(Lampa.Template.get("lampac_prestige_rate", {
                "rate": parseFloat(ep.vote_average + "").toFixed(1)
              }, true));
              if (ep.air_date) info.push(Lampa.Utils.parseTime(ep.air_date).full);
              
              var dDate = new Date((ep.air_date + "").replace(/-/g, "/")),
                  now = Date.now(),
                  diff = Math.round((dDate.getTime() - now) / (24 * 60 * 60 * 1000)),
                  diffStr = Lampa.Lang.translate("full_episode_days_left") + ": " + diff,
                  epHtml = Lampa.Template.get("lampac_prestige_full", {
                    "time": Lampa.Utils.secondsToTime((ep ? ep.runtime : object.movie.runtime) * 60, true),
                    "info": info.length ? info.map(function (i) { return "<span>" + i + "</span>"; }).join("<span class=\"online-prestige-split\">●</span>") : "",
                    "title": ep.name,
                    "quality": diff > 0 ? diffStr : ""
                  }),
                  epLoader = epHtml.find(".online-prestige__loader"),
                  epImgWrap = epHtml.find(".online-prestige__img"),
                  baseSeason = items[0] ? items[0].season : 1;
                  
              epHtml.find(".online-prestige__timeline").append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([baseSeason, ep.episode_number, object.movie.original_title].join("")))));
              var epImg = epHtml.find("img")[0];
              if (ep.still_path) {
                epImg.onerror = function () { epImg.src = "./img/img_broken.svg"; };
                epImg.onload = function () {
                  epImgWrap.addClass("online-prestige__img--loaded");
                  epLoader.remove();
                  epImgWrap.append("<div class=\"online-prestige__episode-number\">" + formatNumber(ep.episode_number) + "</div>");
                };
                epImg.src = Lampa.TMDB.image("t/p/w300" + ep.still_path);
                imagesList.push(epImg);
              } else {
                epLoader.remove();
                epImgWrap.append("<div class=\"online-prestige__episode-number\">" + formatNumber(ep.episode_number) + "</div>");
              }
              
              epHtml.on("hover:focus", function (e) {
                activeItem = e.target;
                scroll.update($(e.target), true);
              });
              epHtml.css("opacity", "0.5");
              scroll.append(epHtml);
            });
          }
          if (focusItem) activeItem = focusItem[0];
          else if (viewedItem) activeItem = viewedItem[0];
          Lampa.Controller.enable("content");
        });
      };

      this.contextMenu = function (ctxData) {
        ctxData.html.on("hover:long", function () {
          var showMenu = function (fileData) {
            var activeController = Lampa.Controller.enabled().name,
                menuItems = [];
                
            if (Lampa.Platform.is("webos")) menuItems.push({ "title": Lampa.Lang.translate("player_lauch") + " - Webos", "player": "webos" });
            if (Lampa.Platform.is("android")) menuItems.push({ "title": Lampa.Lang.translate("player_lauch") + " - Android", "player": "android" });
            
            menuItems.push({ "title": Lampa.Lang.translate("player_lauch") + " - Lampa", "player": "lampa" });
            menuItems.push({ "title": Lampa.Lang.translate("lampac_video"), "separator": true });
            menuItems.push({ "title": Lampa.Lang.translate("torrent_parser_label_title"), "mark": true });
            menuItems.push({ "title": Lampa.Lang.translate("torrent_parser_label_cancel_title"), "unmark": true });
            menuItems.push({ "title": Lampa.Lang.translate("time_reset"), "timeclear": true });
            
            if (fileData) menuItems.push({ "title": Lampa.Lang.translate("copy_link"), "copylink": true });
            if (window.lampac_online_context_menu) window.lampac_online_context_menu.push(menuItems, fileData, ctxData);
            
            menuItems.push({ "title": Lampa.Lang.translate("more"), "separator": true });
            
            if (Lampa.Account.logged() && ctxData.element && typeof ctxData.element.season !== "undefined" && ctxData.element.translate_voice) {
                menuItems.push({ "title": Lampa.Lang.translate("lampac_voice_subscribe"), "subscribe": true });
            }
            
            menuItems.push({ "title": Lampa.Lang.translate("lampac_clear_all_marks"), "clearallmark": true });
            menuItems.push({ "title": Lampa.Lang.translate("lampac_clear_all_timecodes"), "timeclearall": true });
            
            Lampa.Select.show({
              "title": Lampa.Lang.translate("title_action"),
              "items": menuItems,
              "onBack": function () {
                Lampa.Controller.toggle(activeController);
              },
              "onSelect": function (sel) {
                if (sel.mark) ctxData.element.mark();
                if (sel.unmark) ctxData.element.unmark();
                if (sel.timeclear) ctxData.element.timeclear();
                if (sel.clearallmark) ctxData.onClearAllMark();
                if (sel.timeclearall) ctxData.onClearAllTime();
                if (window.lampac_online_context_menu) window.lampac_online_context_menu.onSelect(sel, ctxData);
                
                Lampa.Controller.toggle(activeController);
                if (sel.player) {
                    Lampa.Player.runas(sel.player);
                    ctxData.html.trigger("hover:enter");
                }
                if (sel.copylink) {
                  if (fileData.quality) {
                    var links = [];
                    for (var q in fileData.quality) {
                      links.push({ "title": q, "file": fileData.quality[q] });
                    }
                    Lampa.Select.show({
                      "title": Lampa.Lang.translate("settings_server_links"),
                      "items": links,
                      "onBack": function () { Lampa.Controller.toggle(activeController); },
                      "onSelect": function (qSel) {
                        Lampa.Utils.copyTextToClipboard(qSel.file, function () {
                          Lampa.Noty.show(Lampa.Lang.translate("copy_secuses"));
                        }, function () {
                          Lampa.Noty.show(Lampa.Lang.translate("copy_error"));
                        });
                      }
                    });
                  } else {
                    Lampa.Utils.copyTextToClipboard(fileData.file, function () {
                      Lampa.Noty.show(Lampa.Lang.translate("copy_secuses"));
                    }, function () {
                      Lampa.Noty.show(Lampa.Lang.translate("copy_error"));
                    });
                  }
                }
                if (sel.subscribe) {
                  Lampa.Account.subscribeToTranslation({
                    "card": object.movie,
                    "season": ctxData.element.season,
                    "episode": ctxData.element.translate_episode_end,
                    "voice": ctxData.element.translate_voice
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate("lampac_voice_success"));
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate("lampac_voice_error"));
                  });
                }
              }
            });
          };
          ctxData.onFile(showMenu);
        }).on("hover:focus", function () {
          if (Lampa.Helper) Lampa.Helper.show("online_file", Lampa.Lang.translate("helper_online_file"), ctxData.html);
        });
      };

      this.empty = function () {
        var html = Lampa.Template.get("lampac_does_not_answer", {});
        html.find(".online-empty__buttons").remove();
        html.find(".online-empty__title").text(Lampa.Lang.translate("empty_title_two"));
        html.find(".online-empty__time").text(Lampa.Lang.translate("empty_text"));
        scroll.clear();
        scroll.append(html);
        this.loading(false);
      };

      this.noConnectToServer = function (err) {
        var html = Lampa.Template.get("lampac_does_not_answer", {});
        html.find(".online-empty__buttons").remove();
        html.find(".online-empty__title").text(Lampa.Lang.translate("title_error"));
        html.find(".online-empty__time").text(err && err.accsdb ? err.msg : Lampa.Lang.translate("lampac_does_not_answer_text").replace("{balanser}", sourcesData[activeBalanser].name));
        scroll.clear();
        scroll.append(html);
        this.loading(false);
      };

      this.doesNotAnswer = function (err) {
        var _this = this;
        this.reset();
        var html = Lampa.Template.get("lampac_does_not_answer", { "balanser": activeBalanser });
        if (err && err.accsdb) html.find(".online-empty__title").html(err.msg);
        
        var timer = err && err.accsdb ? 10 : 5;
        html.find(".cancel").on("hover:enter", function () {
          clearInterval(checkInterval);
        });
        html.find(".change").on("hover:enter", function () {
          clearInterval(checkInterval);
          filter.render().find(".filter--sort").trigger("hover:enter");
        });
        
        scroll.clear();
        scroll.append(html);
        this.loading(false);
        
        checkInterval = setInterval(function () {
          timer--;
          html.find(".timeout").text(timer);
          if (timer == 0) {
            clearInterval(checkInterval);
            var keys = Lampa.Arrays.getKeys(sourcesData),
                idx = keys.indexOf(activeBalanser),
                next = keys[idx + 1];
            if (!next) next = keys[0];
            activeBalanser = next;
            if (Lampa.Activity.active().activity == _this.activity) _this.changeBalanser(activeBalanser);
          }
        }, 1000);
      };

      this.getLastEpisode = function (items) {
        var max = 0;
        items.forEach(function (i) {
          if (typeof i.episode !== "undefined") max = Math.max(max, parseInt(i.episode));
        });
        return max;
      };

      this.start = function () {
        if (Lampa.Activity.active().activity !== this.activity) return;
        if (!isStarted) {
            isStarted = true;
            this.initialize();
        }
        Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
        Lampa.Controller.add("content", {
          "toggle": function () {
            Lampa.Controller.collectionSet(scroll.render(), explorer.render());
            Lampa.Controller.collectionFocus(activeItem || false, scroll.render());
          },
          "gone": function () {
            clearTimeout(checkInterval);
          },
          "up": function () {
            if (Navigator.canmove("up")) Navigator.move("up");
            else Lampa.Controller.toggle("head");
          },
          "down": function () {
            Navigator.move("down");
          },
          "right": function () {
            if (Navigator.canmove("right")) Navigator.move("right");
            else filter.show(Lampa.Lang.translate("title_filter"), "filter");
          },
          "left": function () {
            if (Navigator.canmove("left")) Navigator.move("left");
            else Lampa.Controller.toggle("menu");
          },
          "back": this.back.bind(this)
        });
        Lampa.Controller.toggle("content");
      };

      this.render = function () {
        return explorer.render();
      };

      this.back = function () {
        Lampa.Activity.backward();
      };

      this.pause = function () {};
      this.stop = function () {};

      this.destroy = function () {
        network.clear();
        this.clearImages();
        explorer.destroy();
        scroll.destroy();
        clearInterval(checkInterval);
        clearTimeout(lifeTimeout);
      };
    }

    function initSearchPlugin(title, balanserKey) {
      var searchReq = new Lampa.Reguest(),
          searchSource = {
            "title": title,
            "search": function (reqData, callback) {
              function parseResults(data) {
                var keys = Lampa.Arrays.getKeys(data);
                if (keys.length) {
                  var status = new Lampa.Status(keys.length);
                  status.onComplite = function (res) {
                    var finalRes = [];
                    keys.forEach(function (k) {
                      var d = res[k];
                      if (d && d.data && d.type == "similar") {
                        var parsedData = d.data.map(function (i) {
                          i.title = Lampa.Utils.capitalizeFirstLetter(i.title);
                          i.release_date = i.year || "0000";
                          i.balanser = balanserKey;
                          if (i.img !== undefined) {
                            if (i.img.charAt(0) === "/") i.img = config.localhost + i.img.substring(1);
                            if (i.img.indexOf("/proxyimg") !== -1) i.img = appendUrlParams(i.img);
                          }
                          return i;
                        });
                        finalRes.push({ "title": k, "results": parsedData });
                      }
                    });
                    callback(finalRes);
                  };
                  keys.forEach(function (k) {
                    searchReq.silent(appendUrlParams(data[k]), function (sRes) {
                      status.append(k, sRes);
                    }, function () {
                      status.error();
                    }, false, { "headers": getHeaders() });
                  });
                } else callback([]);
              }
              searchReq.silent(appendUrlParams(config.localhost + "lite/" + balanserKey + "?title=" + reqData.query), function (res) {
                if (res.rch) {
                  initClient(res, function () {
                    searchReq.silent(appendUrlParams(config.localhost + "lite/" + balanserKey + "?title=" + reqData.query), function (sRes) {
                      parseResults(sRes);
                    }, function () { callback([]); }, false, { "headers": getHeaders() });
                  });
                } else parseResults(res);
              }, function () { callback([]); }, false, { "headers": getHeaders() });
            },
            "onCancel": function () { searchReq.clear(); },
            "params": {
              "lazy": true,
              "align_left": true,
              "card_events": { "onMenu": function () {} }
            },
            "onMore": function (a, cb) { cb(); },
            "onSelect": function (item, cb) {
              cb();
              Lampa.Activity.push({
                "url": item.element.url,
                "title": "Lampac - " + item.element.title,
                "component": "lampac",
                "movie": item.element,
                "page": 1,
                "search": item.element.title,
                "clarification": true,
                "balanser": item.element.balanser,
                "noinfo": true
              });
            }
          };
      Lampa.Search.addSource(searchSource);
    }

    function initPlugin() {
      // Игнорируем привязку, включаем плагин безусловно
      window.lampac_plugin = true;

      var manifest = {
        "type": "video",
        "version": "7.7.7",
        "name": "Cinema",
        "description": "Плагин для просмотра онлайн сериалов и фильмов",
        "component": "cinema_online",
        "onContextMenu": function (data) {
          return { "name": Lampa.Lang.translate("lampac_watch"), "description": "" };
        },
        "onContextLauch": function (data) {
          setupTemplates();
          Lampa.Component.add("cinema_online", CinemaComponent);
          var hash = Lampa.Utils.hash(data.number_of_seasons ? data.original_name : data.original_title),
              clarification = Lampa.Storage.get("clarification_search", "{}");
          Lampa.Activity.push({
            "url": "",
            "title": Lampa.Lang.translate("title_online"),
            "component": "cinema_online",
            "search": clarification[hash] ? clarification[hash] : data.title,
            "search_one": data.title,
            "search_two": data.original_title,
            "movie": data,
            "page": 1,
            "clarification": clarification[hash] ? true : false
          });
        }
      };

      initSearchPlugin("Cinema", "spider");
      initSearchPlugin("Cinema - Anime", "spider/anime");
      
      Lampa.Manifest.plugins = manifest;
      Lampa.Lang.add({
        "lampac_watch": { "ru": "Смотреть онлайн", "en": "Watch online", "uk": "Дивитися онлайн", "zh": "在线观看" },
        "lampac_video": { "ru": "Видео", "en": "Video", "uk": "Відео", "zh": "视频" },
        "lampac_no_watch_history": { "ru": "Нет истории просмотра", "en": "No browsing history", "ua": "Немає історії перегляду", "zh": "没有浏览历史" },
        "lampac_nolink": { "ru": "Не удалось извлечь ссылку", "uk": "Неможливо отримати посилання", "en": "Failed to fetch link", "zh": "获取链接失败" },
        "lampac_balanser": { "ru": "Источник", "uk": "Джерело", "en": "Source", "zh": "来源" },
        "helper_online_file": { "ru": "Удерживайте клавишу \"ОК\" для вызова контекстного меню", "uk": "Утримуйте клавішу \"ОК\" для виклику контекстного меню", "en": "Hold the \"OK\" key to bring up the context menu", "zh": "按住\"确定\"键调出上下文菜单" },
        "title_online": { "ru": "Онлайн", "uk": "Онлайн", "en": "Online", "zh": "在线的" },
        "lampac_voice_subscribe": { "ru": "Подписаться на перевод", "uk": "Підписатися на переклад", "en": "Subscribe to translation", "zh": "订阅翻译" },
        "lampac_voice_success": { "ru": "Вы успешно подписались", "uk": "Ви успішно підписалися", "en": "You have successfully subscribed", "zh": "您已成功订阅" },
        "lampac_voice_error": { "ru": "Возникла ошибка", "uk": "Виникла помилка", "en": "An error has occurred", "zh": "发生了错误" },
        "lampac_clear_all_marks": { "ru": "Очистить все метки", "uk": "Очистити всі мітки", "en": "Clear all labels", "zh": "清除所有标签" },
        "lampac_clear_all_timecodes": { "ru": "Очистить все тайм-коды", "uk": "Очистити всі тайм-коди", "en": "Clear all timecodes", "zh": "清除所有时间代码" },
        "lampac_change_balanser": { "ru": "Изменить балансер", "uk": "Змінити балансер", "en": "Change balancer", "zh": "更改平衡器" },
        "lampac_balanser_dont_work": { "ru": "Поиск на ({balanser}) не дал результатов", "uk": "Пошук на ({balanser}) не дав результатів", "en": "Search on ({balanser}) did not return any results", "zh": "搜索 ({balanser}) 未返回任何结果" },
        "lampac_balanser_timeout": { "ru": "Источник будет переключен автоматически через <span class=\"timeout\">10</span> секунд.", "uk": "Джерело буде автоматично переключено через <span class=\"timeout\">10</span> секунд.", "en": "The source will be switched automatically after <span class=\"timeout\">10</span> seconds.", "zh": "平衡器将在<span class=\"timeout\">10</span>秒内自动切换。" },
        "lampac_does_not_answer_text": { "ru": "Поиск на ({balanser}) не дал результатов", "uk": "Пошук на ({balanser}) не дав результатів", "en": "Search on ({balanser}) did not return any results", "zh": "搜索 ({balanser}) 未返回任何结果" }
      });

      Lampa.Template.add("lampac_css", "\n        <style>\n        @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");
      $("body").append(Lampa.Template.get("lampac_css", {}, true));

      function setupTemplates() {
        Lampa.Template.add("lampac_prestige_full", "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__timeline\"></div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__quality\">{quality}</div>\n                </div>\n            </div>\n        </div>");
        Lampa.Template.add("lampac_content_loading", "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
        Lampa.Template.add("lampac_does_not_answer", "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">\n                #{lampac_balanser_dont_work}\n            </div>\n            <div class=\"online-empty__time\">\n                #{lampac_balanser_timeout}\n            </div>\n            <div class=\"online-empty__buttons\">\n                <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n                <div class=\"online-empty__button selector change\">#{lampac_change_balanser}</div>\n            </div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
        Lampa.Template.add("lampac_prestige_rate", "<div class=\"online-prestige-rate\">\n            <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z\" fill=\"#fff\"></path>\n            </svg>\n            <span>{rate}</span>\n        </div>");
        Lampa.Template.add("lampac_prestige_folder", "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
        Lampa.Template.add("lampac_prestige_watched", "<div class=\"online-prestige online-prestige-watched selector\">\n            <div class=\"online-prestige-watched__icon\">\n                <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"online-prestige-watched__body\"></div>\n        </div>");
      }

      var buttonHtml = "<div class=\"full-start__button selector cinema--online lampac--button\" data-subtitle=\"" + manifest.name + " v" + manifest.version + "\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"29\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M11.585.031c-.342.087-.603.22-.94.478c-.354.273-.644.582-1.038 1.11c-.748 1.01-1.475 2.337-2.332 4.265c-.105.236-.198.43-.205.43a10 10 0 0 1-.211-.655c-.442-1.47-.77-2.426-1.095-3.196C5.254 1.25 4.793.638 4.234.43a1.25 1.25 0 0 0-.795.007c-.565.23-.985.838-1.318 1.914c-.522 1.676-.96 4.53-1.472 9.6c-.478 4.69-.675 7.526-.646 9.257c.012.835.045 1.181.15 1.62c.187.792.622 1.206 1.225 1.163c.159-.013.216-.03.392-.134c.173-.102.247-.17.434-.391c.504-.602.976-1.62 1.952-4.22c.364-.967 1.967-5.397 1.967-5.434c0-.026-.703-2.417-.822-2.8l-.04-.123l-.034.076c-.064.143-.72 1.934-1.448 3.952c-1 2.772-1.577 4.32-1.884 5.06l-.097.239l.012-.267c.01-.146.026-.495.038-.773c.086-1.766.33-4.554.703-8.068c.375-3.536.708-5.842 1.043-7.227c.1-.414.26-.959.294-1.004c.024-.027.233.424.404.871c.356.934.636 1.816 1.515 4.774c1.083 3.651 1.627 5.265 2.325 6.901c.61 1.436 1.104 2.305 1.72 3.036c.432.512.84.835 1.294 1.029a2.03 2.03 0 0 0 1.626.017c1.385-.557 2.565-2.553 3.971-6.719c.378-1.122.691-2.122 1.35-4.32c.911-3.045 1.313-4.251 1.7-5.128a7 7 0 0 1 .211-.447l.057-.098l.038.11c.33.916.663 2.636.971 5.02c.333 2.552.81 7.354.988 9.89c.057.818.12 1.976.117 2.192v.155l-.074-.169c-.235-.534-.779-1.999-1.9-5.102c-.869-2.404-1.484-4.076-1.515-4.113c-.011-.013-.029.014-.043.057c-.574 1.9-.836 2.777-.836 2.81c0 .04.976 2.756 1.686 4.69c.606 1.647 1.152 3.041 1.416 3.618c.349.764.605 1.206.888 1.543c.164.194.242.264.413.365c.376.213.704.16.97.007c.84-.495.985-1.903.66-6.39c-.164-2.229-.523-5.94-.834-8.602c-.494-4.228-1.017-6.645-1.66-7.671c-.254-.408-.601-.7-.938-.793a1.44 1.44 0 0 0-.668.017c-.876.298-1.548 1.546-2.557 4.75c-.136.434-.262.836-.276.892c-.016.059-.038.107-.045.107c-.01 0-.073-.13-.145-.29C15.516 3.2 14.494 1.523 13.542.677c-.278-.247-.729-.52-.995-.604c-.245-.076-.739-.098-.962-.04zm.682 2.15c.726.38 1.918 2.452 3.322 5.778l.44 1.04l-.345 1.099c-.639 2.046-1.05 3.227-1.534 4.382c-.672 1.605-1.316 2.657-1.812 2.958a.73.73 0 0 1-.615.042c-.798-.335-1.798-2.198-2.881-5.375a77 77 0 0 1-.805-2.51l-.135-.442l.346-.837c1.344-3.239 2.541-5.417 3.297-6.008c.273-.213.484-.25.722-.126Z\"/></svg>\n\n        <span>#{title_online}</span>\n    </div>";

      Lampa.Component.add("cinema_online", CinemaComponent);
      setupTemplates();

      function bindCinemaButton(viewData) {
        if (viewData.render.find(".lampac--button").length) return;
        var btn = $(Lampa.Lang.translate(buttonHtml));
        btn.on("hover:enter", function () {
          setupTemplates();
          Lampa.Component.add("cinema_online", CinemaComponent);
          var hash = Lampa.Utils.hash(viewData.movie.number_of_seasons ? viewData.movie.original_name : viewData.movie.original_title),
              clarification = Lampa.Storage.get("clarification_search", "{}");
          Lampa.Activity.push({
            "url": "",
            "title": Lampa.Lang.translate("title_online"),
            "component": "cinema_online",
            "search": clarification[hash] ? clarification[hash] : viewData.movie.title,
            "search_one": viewData.movie.title,
            "search_two": viewData.movie.original_title,
            "movie": viewData.movie,
            "page": 1,
            "clarification": clarification[hash] ? true : false
          });
        });
        viewData.render.after(btn);
      }

      Lampa.Listener.follow("full", function (event) {
        if (event.type == "complite") bindCinemaButton({
          "render": event.object.activity.render().find(".view--torrent"),
          "movie": event.data.movie
        });
      });

      try {
        if (Lampa.Activity.active().component == "full") bindCinemaButton({
          "render": Lampa.Activity.active().activity.render().find(".view--torrent"),
          "movie": Lampa.Activity.active().card
        });
      } catch (e) {}

      if (Lampa.Manifest.app_digital >= 177) {
        var balanserKeys = ["filmix", "filmixtv", "fxapi", "rezka", "pizdatoehd", "getstv", "kinopub", "zetflixdb", "collaps", "hdvb", "kodik", "bamboo", "eneyida", "kinoukr", "uafilm", "uakino", "kinotochka", "remux", "anilibria", "animedia", "animego", "animevost", "animebesst", "alloha", "mirage", "phantom", "animelib", "moonanime", "vibix", "fancdn", "cdnvideohub", "vokino", "hydraflix", "videasy", "vidsrc", "movpi", "vidlink", "smashystream", "autoembed", "pidtor", "videoseed", "iptvonline", "veoveo", "kinoflix", "leproduction", "vkmovie", "videoseed", "veoveo", "kinogo", "kinobase", "fancdn", "asiage", "geosaitebi", "mikai", "dreamerscast"];
        balanserKeys.forEach(function (k) {
          Lampa.Storage.sync("online_choice_" + k, "object_object");
        });
        Lampa.Storage.sync("online_watched_last", "object_object");
      }
    }

    if (!window.lampac_plugin) initPlugin();
  })();
})();
