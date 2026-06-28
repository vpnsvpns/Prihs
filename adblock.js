(function () {
  "use strict";

  var ID = "lampa_adblock";
  var NAME = "Lampa AdBlock";

  if (window[ID + "_ready"]) return;
  window[ID + "_ready"] = true;

  var state = {
    patched: {},
    premiumOriginal: null,
    premiumTimer: 0
  };

  var manifest = {
    type: "other",
    version: "1.0.1",
    name: NAME,
    description: "Blocks Lampa ads, banners and VAST/IMA prerolls.",
    component: ID
  };

  var blockedRules = [
    /imasdk\.googleapis\.com/i,
    /\/sdkloader\/ima\d*\.js/i,
    /\/vender\/vast\/vast\.js/i,
    /\/api\/ad\/get\//i,
    /\/api\/ad(?:\/|\?|$)/i,
    /doubleclick\.net/i,
    /googlesyndication\.com/i,
    /googleadservices\.com/i,
    /googletagservices\.com/i,
    /adservice\.google\./i,
    /adfox/i,
    /an\.yandex\./i,
    /yandex\.[a-z.]+\/ads/i,
    /\/vast(?:\/|\?|$)/i,
    /[?&](?:vast|vmap|vpaid|adTagUrl)=/i,
    /\/(?:preroll|banner|advert)(?:\/|\?|$)/i
  ];

  var adKeys = {
    vast_url: true,
    vast_api: true,
    vast_msg: true,
    vast_region: true,
    vast_platform: true,
    vast_screen: true,
    ad_url: true,
    ad_tag: true,
    adtagurl: true,
    adtag: true,
    ad: true,
    ads: true,
    advert: true,
    advertising: true,
    preroll: true,
    pre_roll: true,
    banner: true,
    banners: true,
    ima: true,
    vmap: true,
    vpaid: true
  };

  var selectors = [
    ".ad-preroll",
    ".ad-video-block",
    ".ad-video-block__vast",
    ".ad-video-block__status",
    ".adsbygoogle",
    "ins.adsbygoogle",
    "[data-ad]",
    "[data-ad-slot]",
    "[data-ad-client]",
    "[id^='ad-']",
    "[id*='-ad-']",
    "[id*='advert']",
    "[class^='ad-']",
    "[class*=' ad-']",
    "[class*='-ad-']",
    "[class*='advert']",
    "iframe[src*='imasdk']",
    "iframe[src*='doubleclick']",
    "iframe[src*='googlesyndication']",
    "script[src*='imasdk.googleapis.com']",
    "script[src*='doubleclick']",
    "script[src*='googlesyndication']"
  ];

  function log() {
    try {
      if (window.console && console.log) console.log.apply(console, arguments);
    } catch (e) {}
  }

  function safe(name, fn) {
    try {
      return fn();
    } catch (e) {
      try {
        if (window.console && console.warn) console.warn(NAME, name, e && e.message ? e.message : e);
      } catch (x) {}
    }
  }

  function isArray(value) {
    return Object.prototype.toString.call(value) == "[object Array]";
  }

  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function keys(object) {
    var result = [];
    var key;

    if (!object) return result;

    for (key in object) {
      if (own(object, key)) result.push(key);
    }

    return result;
  }

  function getUrl(value) {
    if (typeof value == "string") return value;
    if (value && typeof value.url == "string") return value.url;
    if (value && typeof value.href == "string") return value.href;
    if (value && typeof value.src == "string") return value.src;
    return "";
  }

  function blockedUrl(value) {
    var url = getUrl(value);
    var i;

    if (!url) return false;

    for (i = 0; i < blockedRules.length; i++) {
      if (blockedRules[i].test(url)) return true;
    }

    return false;
  }

  function adKey(key) {
    var name = (key + "").toLowerCase().replace(/[-\s]/g, "_");

    return adKeys[name] || name.indexOf("vast_") === 0 || name.indexOf("ad_") === 0 || name.indexOf("ads_") === 0;
  }

  function sanitize(value, seen) {
    var list;
    var i;
    var key;

    if (!value || typeof value != "object") return value;

    seen = seen || [];
    if (seen.indexOf(value) >= 0) return value;
    seen.push(value);

    if (isArray(value)) {
      for (i = 0; i < value.length; i++) sanitize(value[i], seen);
      return value;
    }

    list = keys(value);
    for (i = 0; i < list.length; i++) {
      key = list[i];

      if (adKey(key)) {
        try {
          delete value[key];
        } catch (e) {
          value[key] = undefined;
        }
      } else {
        sanitize(value[key], seen);
      }
    }

    return value;
  }

  function hardenSettings() {
    window.lampa_settings = window.lampa_settings || {};
    window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};
    window.lampa_settings.developer = window.lampa_settings.developer || {};

    window.lampa_settings.disable_features.ads = true;
    window.lampa_settings.developer.ads = false;
  }

  function registerManifest() {
    var list;
    var i;

    if (!window.Lampa || !Lampa.Manifest) return;

    list = Lampa.Manifest.plugins || [];
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].component == ID) return;
    }

    Lampa.Manifest.plugins = manifest;
  }

  function installCss() {
    var style;
    var css;
    var parent;

    if (!window.document || document.getElementById(ID + "_css")) return;

    css = selectors.join(",") + "{" +
      "display:none!important;visibility:hidden!important;opacity:0!important;" +
      "pointer-events:none!important;width:0!important;height:0!important;" +
      "max-width:0!important;max-height:0!important;margin:0!important;padding:0!important;" +
      "overflow:hidden!important;position:absolute!important;left:-99999px!important;top:-99999px!important;" +
      "}";

    style = document.createElement("style");
    style.id = ID + "_css";
    style.type = "text/css";

    if (style.styleSheet) style.styleSheet.cssText = css;
    else style.appendChild(document.createTextNode(css));

    parent = document.head || document.getElementsByTagName("head")[0] || document.documentElement || document.body;
    if (parent) parent.appendChild(style);
  }

  function removeNode(node) {
    try {
      if (node && node.parentNode) node.parentNode.removeChild(node);
      else if (node && node.remove) node.remove();
    } catch (e) {}
  }

  function cleanupDom() {
    var i;
    var j;
    var nodes;
    var media;
    var node;

    if (!window.document || !document.querySelectorAll) return;

    for (i = 0; i < selectors.length; i++) {
      try {
        nodes = document.querySelectorAll(selectors[i]);
        for (j = 0; j < nodes.length; j++) removeNode(nodes[j]);
      } catch (e) {}
    }

    try {
      media = document.querySelectorAll("script[src],iframe[src],img[src],source[src],link[href]");
      for (i = 0; i < media.length; i++) {
        node = media[i];
        if (blockedUrl(node.getAttribute("src") || node.getAttribute("href") || node.src || node.href)) removeNode(node);
      }
    } catch (x) {}
  }

  function patchAjax() {
    var nativeAjax;

    if (!window.$ || !$.ajax || $.ajax.__lampaAdblock) return;

    nativeAjax = $.ajax;

    $.ajax = function (options) {
      var settings = typeof options == "string" ? arguments[1] || {} : options || {};
      var url = typeof options == "string" ? options : settings.url;
      var request;

      if (blockedUrl(url)) {
        request = {
          readyState: 0,
          status: 0,
          statusText: "blocked",
          abort: function () {}
        };

        setTimeout(function () {
          if (typeof settings.error == "function") settings.error(request, "abort", "blocked");
          if (typeof settings.complete == "function") settings.complete(request, "abort");
        }, 0);

        return request;
      }

      return nativeAjax.apply(this, arguments);
    };

    $.ajax.__lampaAdblock = true;
    $.ajax.__lampaAdblockOriginal = nativeAjax;
  }

  function patchScriptLoader() {
    var nativeLoader;

    if (!window.Lampa || !Lampa.Utils || !Lampa.Utils.putScriptAsync || Lampa.Utils.putScriptAsync.__lampaAdblock) return;

    nativeLoader = Lampa.Utils.putScriptAsync;

    Lampa.Utils.putScriptAsync = function (items, complete, error, success, showLogs) {
      var list = isArray(items) ? items : [items];
      var allowed = [];
      var blocked = [];
      var i;

      for (i = 0; i < list.length; i++) {
        if (blockedUrl(list[i])) blocked.push(list[i]);
        else allowed.push(list[i]);
      }

      if (blocked.length) {
        setTimeout(function () {
          var j;

          for (j = 0; j < blocked.length; j++) {
            if (typeof error == "function") error(blocked[j]);
          }

          if (!allowed.length && typeof complete == "function") complete();
        }, 0);
      }

      if (!allowed.length) return;

      return nativeLoader.call(this, allowed, complete, error, success, showLogs);
    };

    Lampa.Utils.putScriptAsync.__lampaAdblock = true;
    Lampa.Utils.putScriptAsync.__lampaAdblockOriginal = nativeLoader;
  }

  function temporaryPremium() {
    if (!window.Lampa || !Lampa.Account || typeof Lampa.Account.hasPremium != "function") return;

    clearTimeout(state.premiumTimer);

    if (!state.premiumOriginal) {
      state.premiumOriginal = Lampa.Account.hasPremium;
      Lampa.Account.hasPremium = function () {
        return true;
      };
    }

    state.premiumTimer = setTimeout(function () {
      if (state.premiumOriginal && window.Lampa && Lampa.Account) {
        Lampa.Account.hasPremium = state.premiumOriginal;
      }

      state.premiumOriginal = null;
      state.premiumTimer = 0;
    }, 2500);
  }

  function wrap(object, name, id, handler) {
    var nativeMethod;

    if (!object || typeof object[name] != "function" || state.patched[id]) return;

    nativeMethod = object[name];

    object[name] = function () {
      return handler.call(this, nativeMethod, arguments);
    };

    object[name].__lampaAdblockOriginal = nativeMethod;
    state.patched[id] = true;
  }

  function patchPlayer() {
    if (!window.Lampa || !Lampa.Player) return;

    wrap(Lampa.Player, "play", "player_play", function (nativeMethod, args) {
      sanitize(args[0]);
      temporaryPremium();
      cleanupDom();
      return nativeMethod.apply(this, args);
    });

    wrap(Lampa.Player, "iptv", "player_iptv", function (nativeMethod, args) {
      sanitize(args[0]);
      temporaryPremium();
      cleanupDom();
      return nativeMethod.apply(this, args);
    });

    wrap(Lampa.Player, "playlist", "player_playlist", function (nativeMethod, args) {
      sanitize(args[0]);
      return nativeMethod.apply(this, args);
    });

    if (Lampa.Player.listener && !Lampa.Player.listener.__lampaAdblock) {
      Lampa.Player.listener.follow("create,start,ready", function (event) {
        sanitize(event && event.data ? event.data : event);
        cleanupDom();
      });

      Lampa.Player.listener.__lampaAdblock = true;
    }
  }

  function patchController() {
    if (!window.Lampa || !Lampa.Controller) return;

    wrap(Lampa.Controller, "add", "controller_add", function (nativeMethod, args) {
      if (args[0] == "ad_preroll" || args[0] == "ad_video_block") {
        cleanupDom();
        return;
      }

      return nativeMethod.apply(this, args);
    });

    wrap(Lampa.Controller, "toggle", "controller_toggle", function (nativeMethod, args) {
      if (args[0] == "ad_preroll" || args[0] == "ad_video_block") {
        cleanupDom();
        return;
      }

      return nativeMethod.apply(this, args);
    });
  }

  function adNotice(notice) {
    var text = "";
    var list;
    var i;
    var key;
    var value;
    var sub;
    var id;

    if (!notice) return false;

    id = (notice.id || "") + "";
    if (/extend_premium|(?:^|[_-])ad(?:[_-]|$)|advert|premium/i.test(id)) return true;

    list = ["title", "text", "name", "description"];

    for (i = 0; i < list.length; i++) {
      value = notice[list[i]];

      if (typeof value == "string") text += " " + value;
      else if (value && typeof value == "object") {
        for (key in value) {
          if (own(value, key)) {
            sub = value[key];
            if (typeof sub == "string") text += " " + sub;
          }
        }
      }
    }

    return /advert|premium|subscribe|subscription|реклам|премиум|подпис/i.test(text);
  }

  function patchNotice() {
    var nativePush;
    var classes;
    var names;
    var notices;
    var i;
    var j;

    if (!window.Lampa || !Lampa.Notice || !Lampa.Notice.pushNotice || Lampa.Notice.pushNotice.__lampaAdblock) return;

    nativePush = Lampa.Notice.pushNotice;

    Lampa.Notice.pushNotice = function (type, notice, success) {
      if (adNotice(notice)) {
        if (typeof success == "function") setTimeout(success, 0);
        return;
      }

      return nativePush.apply(this, arguments);
    };

    Lampa.Notice.pushNotice.__lampaAdblock = true;
    Lampa.Notice.pushNotice.__lampaAdblockOriginal = nativePush;

    classes = Lampa.Notice.classes || {};
    names = keys(classes);

    for (i = 0; i < names.length; i++) {
      notices = classes[names[i]] && classes[names[i]].notices;

      if (isArray(notices)) {
        for (j = notices.length - 1; j >= 0; j--) {
          if (adNotice(notices[j])) notices.splice(j, 1);
        }
      }
    }
  }

  function patchAll() {
    safe("settings", hardenSettings);
    safe("manifest", registerManifest);
    safe("css", installCss);
    safe("ajax", patchAjax);
    safe("script-loader", patchScriptLoader);
    safe("player", patchPlayer);
    safe("controller", patchController);
    safe("notice", patchNotice);
    safe("cleanup", cleanupDom);
  }

  function boot() {
    patchAll();

    setInterval(patchAll, 1000);
    setInterval(function () {
      safe("cleanup-loop", cleanupDom);
    }, 2000);

    log(NAME, "enabled");
  }

  window.lampa_adblock = {
    manifest: manifest,
    blockedUrl: blockedUrl,
    sanitize: sanitize,
    cleanup: cleanupDom,
    patch: patchAll
  };

  safe("boot", boot);
})();
