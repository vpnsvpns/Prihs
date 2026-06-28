(function () {
  "use strict";

  var PLUGIN_ID = "lampa_adblock";
  var PLUGIN_NAME = "Lampa AdBlock";

  if (window[PLUGIN_ID + "_ready"]) return;
  window[PLUGIN_ID + "_ready"] = true;

  var original = {};
  var premiumBypass = {
    account: null,
    original: null,
    patched: null,
    timer: 0
  };

  var blockedUrlRules = [
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
    /adsystem\./i,
    /adserver/i,
    /adfox/i,
    /an\.yandex\./i,
    /yandex\.[a-z.]+\/ads/i,
    /criteo/i,
    /pubmatic/i,
    /rubiconproject/i,
    /openx\.net/i,
    /serving-sys\.com/i,
    /betweendigital/i,
    /\/vast(?:\/|\?|$)/i,
    /[?&](?:vast|vmap|vpaid|adTagUrl)=/i,
    /\/(?:preroll|banner|advert)(?:\/|\?|$)/i,
    /(?:^|[./_-])ads?(?:[./_-]|$)/i
  ];

  var adDataKeys = {
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

  var adSelectors = [
    ".ad-preroll",
    ".ad-video-block",
    ".ad-video-block__vast",
    ".ad-video-block__skip",
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
    "[class*='banner']",
    "iframe[src*='imasdk']",
    "iframe[src*='doubleclick']",
    "iframe[src*='googlesyndication']",
    "script[src*='imasdk.googleapis.com']",
    "script[src*='doubleclick']",
    "script[src*='googlesyndication']"
  ];

  var manifest = {
    type: "other",
    version: "1.0.0",
    name: PLUGIN_NAME,
    description: "Blocks Lampa ad banners, VAST/IMA prerolls and ad scripts.",
    component: PLUGIN_ID
  };

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isObject(value) {
    return value && typeof value == "object";
  }

  function getUrl(value) {
    if (typeof value == "string") return value;
    if (value && typeof value.url == "string") return value.url;
    if (value && typeof value.href == "string") return value.href;
    if (value && typeof value.src == "string") return value.src;
    return "";
  }

  function isBlockedUrl(value) {
    var url = getUrl(value);
    if (!url) return false;

    for (var i = 0; i < blockedUrlRules.length; i++) {
      if (blockedUrlRules[i].test(url)) return true;
    }

    return false;
  }

  function isAdDataKey(key) {
    var name = (key + "").toLowerCase().replace(/[-\s]/g, "_");

    return adDataKeys[name] || name.indexOf("vast_") === 0 || name.indexOf("ad_") === 0 || name.indexOf("ads_") === 0;
  }

  function sanitizeMedia(value, seen) {
    if (!isObject(value)) return value;

    seen = seen || [];
    if (seen.indexOf(value) >= 0) return value;
    seen.push(value);

    if (Array.isArray(value)) {
      value.forEach(function (item) {
        sanitizeMedia(item, seen);
      });
      return value;
    }

    Object.keys(value).forEach(function (key) {
      if (isAdDataKey(key)) {
        delete value[key];
      } else {
        sanitizeMedia(value[key], seen);
      }
    });

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
    if (!window.Lampa || !Lampa.Manifest) return;

    var exists = false;
    var list = Lampa.Manifest.plugins || [];

    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].component == PLUGIN_ID) exists = true;
    }

    if (!exists) Lampa.Manifest.plugins = manifest;
  }

  function installCss() {
    if (typeof document == "undefined" || document.getElementById(PLUGIN_ID + "_css")) return;

    var style = document.createElement("style");
    style.id = PLUGIN_ID + "_css";
    style.textContent = [
      ".ad-preroll,.ad-video-block,.ad-video-block__vast,.adsbygoogle,ins.adsbygoogle,",
      "[data-ad],[data-ad-slot],[data-ad-client],",
      "[id^='ad-'],[id*='-ad-'],[id*='advert'],",
      "[class^='ad-'],[class*=' ad-'],[class*='-ad-'],[class*='advert'],[class*='banner'],",
      "iframe[src*='imasdk'],iframe[src*='doubleclick'],iframe[src*='googlesyndication']{",
      "display:none!important;visibility:hidden!important;opacity:0!important;",
      "pointer-events:none!important;width:0!important;height:0!important;",
      "max-width:0!important;max-height:0!important;margin:0!important;padding:0!important;",
      "overflow:hidden!important;position:absolute!important;left:-99999px!important;top:-99999px!important;",
      "}"
    ].join("");

    (document.head || document.documentElement || document.body).appendChild(style);
  }

  function matchesAdSelector(element) {
    if (!element || element.nodeType !== 1 || !element.matches) return false;

    for (var i = 0; i < adSelectors.length; i++) {
      try {
        if (element.matches(adSelectors[i])) return true;
      } catch (e) {}
    }

    return false;
  }

  function elementUrlBlocked(element) {
    if (!element || element.nodeType !== 1) return false;

    return isBlockedUrl(element.getAttribute && (element.getAttribute("src") || element.getAttribute("href"))) || isBlockedUrl(element.src) || isBlockedUrl(element.href);
  }

  function isAdElement(element) {
    return element && element.nodeType === 1 && (element.__lampaAdblockBlocked || matchesAdSelector(element) || elementUrlBlocked(element));
  }

  function notifyBlockedElement(element) {
    setTimeout(function () {
      try {
        if (typeof element.onerror == "function") element.onerror(new Error("Blocked by " + PLUGIN_NAME));
      } catch (e) {}
    }, 0);
  }

  function removeElement(element) {
    if (!element || element.nodeType !== 1 || element.id == PLUGIN_ID + "_css") return;

    element.__lampaAdblockBlocked = true;
    notifyBlockedElement(element);

    try {
      if (element.parentNode) element.parentNode.removeChild(element);
      else if (element.remove) element.remove();
    } catch (e) {}
  }

  function cleanupAds(root) {
    if (typeof document == "undefined") return;

    var scope = root && root.nodeType === 1 ? root : document;

    if (scope !== document && isAdElement(scope)) {
      removeElement(scope);
      return;
    }

    if (!scope.querySelectorAll) return;

    var query = adSelectors.join(",");
    var nodes = [];

    try {
      nodes = scope.querySelectorAll(query);
    } catch (e) {}

    for (var i = 0; i < nodes.length; i++) {
      if (isAdElement(nodes[i]) || matchesAdSelector(nodes[i])) removeElement(nodes[i]);
    }

    var media = [];
    try {
      media = scope.querySelectorAll("script[src],iframe[src],img[src],source[src],link[href]");
    } catch (e) {}

    for (var j = 0; j < media.length; j++) {
      if (elementUrlBlocked(media[j])) removeElement(media[j]);
    }
  }

  function patchDom() {
    if (typeof Node == "undefined" || typeof Element == "undefined") return;

    if (!original.appendChild && Node.prototype.appendChild) {
      original.appendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (child) {
        if (isAdElement(child)) {
          notifyBlockedElement(child);
          return child;
        }

        return original.appendChild.apply(this, arguments);
      };
    }

    if (!original.insertBefore && Node.prototype.insertBefore) {
      original.insertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (child) {
        if (isAdElement(child)) {
          notifyBlockedElement(child);
          return child;
        }

        return original.insertBefore.apply(this, arguments);
      };
    }

    if (!original.setAttribute && Element.prototype.setAttribute) {
      original.setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (name, value) {
        var attr = (name + "").toLowerCase();

        if ((attr == "src" || attr == "href") && isBlockedUrl(value)) {
          this.__lampaAdblockBlocked = true;
          notifyBlockedElement(this);
          return;
        }

        return original.setAttribute.apply(this, arguments);
      };
    }
  }

  function observeDom() {
    if (typeof MutationObserver == "undefined" || typeof document == "undefined") return;
    if (window[PLUGIN_ID + "_observer"]) return;

    var target = document.documentElement || document.body;
    if (!target) return;

    window[PLUGIN_ID + "_observer"] = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type == "childList") {
          for (var i = 0; i < mutation.addedNodes.length; i++) cleanupAds(mutation.addedNodes[i]);
        } else if (mutation.type == "attributes") {
          cleanupAds(mutation.target);
        }
      });
    });

    window[PLUGIN_ID + "_observer"].observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "href", "class", "id", "style"]
    });
  }

  function patchFetch() {
    if (!window.fetch || original.fetch) return;

    original.fetch = window.fetch;
    window.fetch = function (input) {
      if (isBlockedUrl(input)) {
        return Promise.reject(new Error("Blocked by " + PLUGIN_NAME + ": " + getUrl(input)));
      }

      return original.fetch.apply(this, arguments);
    };
  }

  function patchAjax() {
    if (!window.$ || !$.ajax || $.ajax.__lampaAdblockWrapped) return;

    var nativeAjax = $.ajax;

    $.ajax = function (options) {
      var settings = typeof options == "string" ? arguments[1] || {} : options || {};
      var url = typeof options == "string" ? options : settings.url;

      if (isBlockedUrl(url)) {
        var request = {
          readyState: 0,
          status: 0,
          statusText: "blocked",
          abort: function () {}
        };

        setTimeout(function () {
          if (typeof settings.error == "function") settings.error(request, "abort", "Blocked by " + PLUGIN_NAME);
          if (typeof settings.complete == "function") settings.complete(request, "abort");
        }, 0);

        return request;
      }

      return nativeAjax.apply(this, arguments);
    };

    $.ajax.__lampaAdblockWrapped = true;
    $.ajax.__lampaAdblockOriginal = nativeAjax;
  }

  function patchXhr() {
    if (!window.XMLHttpRequest || !XMLHttpRequest.prototype || original.xhrOpen) return;

    original.xhrOpen = XMLHttpRequest.prototype.open;
    original.xhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__lampaAdblockUrl = url;
      this.__lampaAdblockBlocked = isBlockedUrl(url);

      if (this.__lampaAdblockBlocked) {
        return original.xhrOpen.call(this, method, "about:blank", true);
      }

      return original.xhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      var xhr = this;

      if (xhr.__lampaAdblockBlocked) {
        setTimeout(function () {
          try {
            xhr.abort();
          } catch (e) {}

          try {
            if (typeof xhr.onerror == "function") xhr.onerror(new Error("Blocked by " + PLUGIN_NAME));
            if (typeof xhr.onloadend == "function") xhr.onloadend();
          } catch (e) {}
        }, 0);

        return;
      }

      return original.xhrSend.apply(this, arguments);
    };
  }

  function patchScriptLoader() {
    if (!window.Lampa || !Lampa.Utils || !Lampa.Utils.putScriptAsync || Lampa.Utils.putScriptAsync.__lampaAdblockWrapped) return false;

    var nativePutScriptAsync = Lampa.Utils.putScriptAsync;

    Lampa.Utils.putScriptAsync = function (items, complite, error, success, show_logs) {
      var list = Array.isArray(items) ? items : [items];
      var allowed = [];
      var blocked = [];

      list.forEach(function (url) {
        if (isBlockedUrl(url)) blocked.push(url);
        else allowed.push(url);
      });

      if (blocked.length) {
        setTimeout(function () {
          blocked.forEach(function (url) {
            if (typeof error == "function") error(url);
          });

          if (!allowed.length && typeof complite == "function") complite();
        }, 0);
      }

      if (!allowed.length) return;

      return nativePutScriptAsync.call(this, allowed, complite, error, success, show_logs);
    };

    Lampa.Utils.putScriptAsync.__lampaAdblockWrapped = true;
    Lampa.Utils.putScriptAsync.__lampaAdblockOriginal = nativePutScriptAsync;

    return true;
  }

  function enablePremiumBypass(time) {
    var account = window.Lampa && Lampa.Account;
    if (!account || typeof account.hasPremium != "function") return;

    if (premiumBypass.patched && account.hasPremium === premiumBypass.patched) {
      clearTimeout(premiumBypass.timer);
    } else {
      premiumBypass.account = account;
      premiumBypass.original = account.hasPremium;
      premiumBypass.patched = function () {
        return true;
      };
      premiumBypass.patched.__lampaAdblockWrapped = true;
      account.hasPremium = premiumBypass.patched;
    }

    premiumBypass.timer = setTimeout(function () {
      if (premiumBypass.account && premiumBypass.account.hasPremium === premiumBypass.patched) {
        premiumBypass.account.hasPremium = premiumBypass.original;
      }

      premiumBypass.account = null;
      premiumBypass.original = null;
      premiumBypass.patched = null;
      premiumBypass.timer = 0;
    }, time || 1500);
  }

  function withAdBypass(call) {
    enablePremiumBypass(1500);
    return call();
  }

  function wrapMethod(object, name, wrapper) {
    if (!object || typeof object[name] != "function" || object[name].__lampaAdblockWrapped) return false;

    var nativeMethod = object[name];
    var wrapped = function () {
      return wrapper.call(this, nativeMethod, arguments);
    };

    wrapped.__lampaAdblockWrapped = true;
    wrapped.__lampaAdblockOriginal = nativeMethod;
    object[name] = wrapped;

    return true;
  }

  function patchPlayer() {
    if (!window.Lampa || !Lampa.Player) return false;

    wrapMethod(Lampa.Player, "play", function (nativeMethod, args) {
      sanitizeMedia(args[0]);

      return withAdBypass(function () {
        return nativeMethod.apply(Lampa.Player, args);
      });
    });

    wrapMethod(Lampa.Player, "iptv", function (nativeMethod, args) {
      sanitizeMedia(args[0]);

      return withAdBypass(function () {
        return nativeMethod.apply(Lampa.Player, args);
      });
    });

    wrapMethod(Lampa.Player, "playlist", function (nativeMethod, args) {
      sanitizeMedia(args[0]);
      return nativeMethod.apply(Lampa.Player, args);
    });

    if (Lampa.Player.listener && !Lampa.Player.listener.__lampaAdblockWrapped) {
      Lampa.Player.listener.follow("create,start,ready", function (event) {
        sanitizeMedia(event && event.data ? event.data : event);
        cleanupAds();
      });

      Lampa.Player.listener.__lampaAdblockWrapped = true;
    }

    return true;
  }

  function patchController() {
    if (!window.Lampa || !Lampa.Controller) return false;

    wrapMethod(Lampa.Controller, "add", function (nativeMethod, args) {
      if (args[0] == "ad_preroll" || args[0] == "ad_video_block") {
        cleanupAds();
        return;
      }

      return nativeMethod.apply(Lampa.Controller, args);
    });

    wrapMethod(Lampa.Controller, "toggle", function (nativeMethod, args) {
      if (args[0] == "ad_preroll" || args[0] == "ad_video_block") {
        cleanupAds();
        return;
      }

      return nativeMethod.apply(Lampa.Controller, args);
    });

    return true;
  }

  function noticeLooksLikeAd(notice) {
    if (!notice) return false;

    var id = (notice.id || "") + "";
    if (/extend_premium|(?:^|[_-])ad(?:[_-]|$)|advert|premium/i.test(id)) return true;

    var text = "";
    ["title", "text", "name", "description"].forEach(function (key) {
      var value = notice[key];
      if (typeof value == "string") text += " " + value;
      else if (isObject(value)) {
        Object.keys(value).forEach(function (lang) {
          if (typeof value[lang] == "string") text += " " + value[lang];
        });
      }
    });

    return /advert|premium|subscribe|subscription|adblock|ad block/i.test(text);
  }

  function patchNotice() {
    if (!window.Lampa || !Lampa.Notice || !Lampa.Notice.pushNotice || Lampa.Notice.pushNotice.__lampaAdblockWrapped) return false;

    var nativePushNotice = Lampa.Notice.pushNotice;

    Lampa.Notice.pushNotice = function (type, notice, success) {
      if (noticeLooksLikeAd(notice)) {
        if (typeof success == "function") setTimeout(success, 0);
        return;
      }

      return nativePushNotice.apply(this, arguments);
    };

    Lampa.Notice.pushNotice.__lampaAdblockWrapped = true;
    Lampa.Notice.pushNotice.__lampaAdblockOriginal = nativePushNotice;

    try {
      var classes = Lampa.Notice.classes || {};
      Object.keys(classes).forEach(function (key) {
        var notices = classes[key] && classes[key].notices;
        if (Array.isArray(notices)) {
          for (var i = notices.length - 1; i >= 0; i--) {
            if (noticeLooksLikeAd(notices[i])) notices.splice(i, 1);
          }
        }
      });
    } catch (e) {}

    return true;
  }

  function patchAll() {
    hardenSettings();
    registerManifest();
    installCss();
    patchDom();
    observeDom();
    patchFetch();
    patchAjax();
    patchXhr();
    patchScriptLoader();
    patchPlayer();
    patchController();
    patchNotice();
    cleanupAds();
  }

  function boot() {
    patchAll();

    var attempts = 0;
    var timer = setInterval(function () {
      patchAll();

      attempts++;
      if (attempts > 30 && window.Lampa && Lampa.Player && Lampa.Utils && (!window.$ || $.ajax && $.ajax.__lampaAdblockWrapped)) {
        clearInterval(timer);
      }
    }, 500);

    setInterval(cleanupAds, 3000);
  }

  window.lampa_adblock = {
    manifest: manifest,
    isBlockedUrl: isBlockedUrl,
    sanitizeMedia: sanitizeMedia,
    cleanup: cleanupAds,
    patch: patchAll
  };

  boot();
})();
