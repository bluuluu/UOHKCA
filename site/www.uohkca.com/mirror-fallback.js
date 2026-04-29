(function () {
  'use strict';

  var REPEATER_STYLE_CLASS = 'mirror-repeater-fallback';
  var REPEATER_NODE_CLASS = 'mirror-repeater-fallback-root';
  var KNOWN_MEDIA_URLS = null;
  var WARMUP_DATA_CACHE = null;
  var MEDIA_URL_RE = /https:\/\/static\.wixstatic\.com\/media\/[^"')\s<>]+/g;

  function normalizeSlashes(path) {
    return (path || '/').replace(/\/{2,}/g, '/');
  }

  function normalizeRouteForMatch(route) {
    var normalized = normalizeSlashes((route || '/').toLowerCase());
    normalized = normalized.replace(/\/index\.html$/, '/');
    if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized || '/';
  }

  function isForcedGalleryRoute(route) {
    var normalized = normalizeRouteForMatch(route);
    return normalized === '/events' || normalized === '/sponsor';
  }

  function detectSiteRoot(pathname) {
    var markers = ['/site/www.uohkca.com', '/www.uohkca.com'];
    for (var i = 0; i < markers.length; i += 1) {
      var marker = markers[i];
      var idx = pathname.indexOf(marker);
      if (idx !== -1) {
        var end = idx + marker.length;
        var next = pathname.charAt(end);
        if (!next || next === '/') {
          return pathname.slice(0, end);
        }
      }
    }
    return '';
  }

  function getRouteInfo() {
    var pathname = location.pathname || '/';
    var rootPrefix = detectSiteRoot(pathname);
    var route = rootPrefix ? pathname.slice(rootPrefix.length) : pathname;

    if (!route || route === '') {
      route = '/';
    }
    if (route.charAt(0) !== '/') {
      route = '/' + route;
    }
    route = normalizeSlashes(route);

    var lang = 'en';
    if (route === '/fr' || route.indexOf('/fr/') === 0) {
      lang = 'fr';
      route = route.slice(3) || '/';
    } else if (route === '/zh' || route.indexOf('/zh/') === 0) {
      lang = 'zh';
      route = route.slice(3) || '/';
    }

    if (!route || route === '') {
      route = '/';
    }
    if (route.charAt(0) !== '/') {
      route = '/' + route;
    }

    return {
      rootPrefix: rootPrefix,
      lang: lang,
      route: normalizeSlashes(route)
    };
  }

  function buildLocalizedPath(rootPrefix, localePrefix, route) {
    var path = normalizeSlashes((rootPrefix || '') + (localePrefix || '') + (route || '/'));
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    return path;
  }

  function findHeaderLanguageHost() {
    return document.querySelector('#SITE_HEADER [data-mesh-id="comp-mkvepsyrinlineContent-gridContainer"]');
  }

  function hasNativeLanguageSelector() {
    var nativeRoot = document.getElementById('comp-mkuqsiou');
    if (!nativeRoot) {
      return false;
    }

    var interactive = nativeRoot.querySelector('a[href], button, [role="button"]');
    if (!interactive) {
      return false;
    }

    var rect = nativeRoot.getBoundingClientRect();
    return rect.width > 20 && rect.height > 20;
  }

  function removeFallbackIfNativeSelectorExists() {
    if (!hasNativeLanguageSelector()) {
      return;
    }
    var fallback = document.getElementById('mirror-lang-switcher');
    if (fallback) {
      fallback.remove();
    }
  }

  function addLanguageSwitcher() {
    if (!document.body || document.getElementById('mirror-lang-switcher')) {
      return;
    }

    var info = getRouteInfo();
    var links = [
      { lang: 'en', label: 'EN', prefix: '' },
      { lang: 'fr', label: 'FR', prefix: '/fr' },
      { lang: 'zh', label: '中文', prefix: '/zh' }
    ];

    var nav = document.createElement('nav');
    nav.id = 'mirror-lang-switcher';
    nav.setAttribute('aria-label', 'Language Switcher');

    for (var i = 0; i < links.length; i += 1) {
      var def = links[i];
      var a = document.createElement('a');
      a.href = buildLocalizedPath(info.rootPrefix, def.prefix, info.route) + location.search + location.hash;
      a.textContent = def.label;
      if (info.lang === def.lang) {
        a.setAttribute('aria-current', 'page');
      }
      nav.appendChild(a);
    }

    var headerHost = findHeaderLanguageHost();
    if (headerHost) {
      nav.classList.add('mirror-lang-inline');
      headerHost.appendChild(nav);
    } else {
      document.body.appendChild(nav);
    }
  }

  function getLocalMediaPrefix() {
    var info = getRouteInfo();
    if (info.rootPrefix && info.rootPrefix.indexOf('/site/www.uohkca.com') !== -1) {
      return info.rootPrefix.replace('/www.uohkca.com', '/static.wixstatic.com') + '/media/';
    }
    if (info.rootPrefix && info.rootPrefix.indexOf('/www.uohkca.com') !== -1) {
      return info.rootPrefix.replace('/www.uohkca.com', '/static.wixstatic.com') + '/media/';
    }
    return '/site/static.wixstatic.com/media/';
  }

  function rewriteMediaUrlString(value) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    ensureKnownMediaUrls();
    var localPrefix = getLocalMediaPrefix();
    return value.replace(MEDIA_URL_RE, function (url) {
      if (!KNOWN_MEDIA_URLS || !KNOWN_MEDIA_URLS[url]) {
        return url;
      }
      return url.replace('https://static.wixstatic.com/media/', localPrefix);
    });
  }

  function ensureKnownMediaUrls() {
    if (KNOWN_MEDIA_URLS) {
      return;
    }

    KNOWN_MEDIA_URLS = Object.create(null);
    var html = '';
    if (document.documentElement) {
      html = document.documentElement.outerHTML || '';
    }

    var matches = html.match(MEDIA_URL_RE) || [];
    for (var i = 0; i < matches.length; i += 1) {
      KNOWN_MEDIA_URLS[matches[i]] = true;
    }

    var imgs = document.querySelectorAll('img[src], source[srcset], video[poster]');
    for (var j = 0; j < imgs.length; j += 1) {
      var node = imgs[j];
      var attrs = ['src', 'srcset', 'poster'];
      for (var a = 0; a < attrs.length; a += 1) {
        var val = node.getAttribute(attrs[a]);
        if (!val) {
          continue;
        }
        var attrMatches = val.match(MEDIA_URL_RE) || [];
        for (var m = 0; m < attrMatches.length; m += 1) {
          KNOWN_MEDIA_URLS[attrMatches[m]] = true;
        }
      }
    }
  }

  function getWarmupData() {
    if (WARMUP_DATA_CACHE) {
      return WARMUP_DATA_CACHE;
    }

    var node = document.getElementById('wix-warmup-data');
    if (!node || !node.textContent) {
      return null;
    }

    try {
      WARMUP_DATA_CACHE = JSON.parse(node.textContent);
    } catch (e) {
      WARMUP_DATA_CACHE = null;
    }

    return WARMUP_DATA_CACHE;
  }

  function getGalleryItemsFromWarmup(compId) {
    if (!compId) {
      return [];
    }

    var warmup = getWarmupData();
    if (!warmup || !warmup.appsWarmupData) {
      return [];
    }

    var targetKey = compId + '_galleryData';
    var apps = warmup.appsWarmupData;
    for (var appId in apps) {
      if (!Object.prototype.hasOwnProperty.call(apps, appId)) {
        continue;
      }
      var appData = apps[appId];
      if (!appData || !appData[targetKey] || !appData[targetKey].items) {
        continue;
      }
      return appData[targetKey].items || [];
    }

    return [];
  }

  function pickKnownMediaUrlForId(mediaId) {
    if (!mediaId) {
      return '';
    }

    ensureKnownMediaUrls();
    if (!KNOWN_MEDIA_URLS) {
      return '';
    }

    var needle = '/media/' + mediaId + '/';
    var bestUrl = '';
    var bestWidth = -1;

    for (var url in KNOWN_MEDIA_URLS) {
      if (!Object.prototype.hasOwnProperty.call(KNOWN_MEDIA_URLS, url)) {
        continue;
      }
      if (url.indexOf(needle) === -1) {
        continue;
      }

      var width = 0;
      var m = url.match(/\/w_(\d+)/);
      if (m && m[1]) {
        width = parseInt(m[1], 10) || 0;
      }

      if (width >= bestWidth) {
        bestWidth = width;
        bestUrl = url;
      }
    }

    if (!bestUrl) {
      return '';
    }
    return rewriteMediaUrlString(bestUrl);
  }

  function rewriteStaticWixMediaUrls() {
    if (!document.body) {
      return;
    }

    var selectors = [
      'img[src]',
      'img[srcset]',
      'img[data-src]',
      'img[data-image-src]',
      'img[data-lazy-src]',
      'img[data-srcset]',
      'img[data-lazy-srcset]',
      'source[srcset]',
      'video[poster]'
    ];

    var nodes = document.querySelectorAll(selectors.join(','));
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];

      var attrs = [
        'src',
        'srcset',
        'data-src',
        'data-image-src',
        'data-lazy-src',
        'data-srcset',
        'data-lazy-srcset',
        'poster'
      ];

      for (var a = 0; a < attrs.length; a += 1) {
        var attr = attrs[a];
        var val = node.getAttribute(attr);
        if (!val || val.indexOf('https://static.wixstatic.com/media/') === -1) {
          continue;
        }
        node.setAttribute(attr, rewriteMediaUrlString(val));
      }

    }
  }

  function isElementActuallyVisible(el) {
    if (!el) {
      return false;
    }
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    if (parseFloat(style.opacity || '1') < 0.05) {
      return false;
    }
    var rect = el.getBoundingClientRect();
    return rect.width > 16 && rect.height > 16;
  }

  function galleryHasVisibleImage(gallery) {
    var imgs = gallery.querySelectorAll('img[data-hook="gallery-item-image-img"], img');
    for (var i = 0; i < imgs.length; i += 1) {
      var img = imgs[i];
      if (!(img.currentSrc || img.src)) {
        continue;
      }
      if (isElementActuallyVisible(img)) {
        return true;
      }
    }
    return false;
  }

  function makeNodeVisible(node) {
    if (!node || !node.style) {
      return;
    }

    node.style.setProperty('visibility', 'visible', 'important');
    node.style.setProperty('opacity', '1', 'important');
    node.style.setProperty('pointer-events', 'auto', 'important');
    node.removeAttribute('hidden');
    node.setAttribute('aria-hidden', 'false');
  }

  function unhideAncestorChain(node, depth) {
    var current = node;
    var remaining = depth;

    while (current && remaining > 0 && current !== document.body) {
      makeNodeVisible(current);

      var inline = (current.getAttribute('style') || '').toLowerCase();
      if (inline.indexOf('display:none') !== -1 || inline.indexOf('display: none') !== -1) {
        current.style.setProperty('display', 'block', 'important');
      }

      current = current.parentElement;
      remaining -= 1;
    }
  }

  function shouldForceGalleryFallback() {
    var info = getRouteInfo();
    var forceByRoute = isForcedGalleryRoute(info.route);
    var galleries = document.querySelectorAll('.pro-gallery');
    if (!galleries.length) {
      return false;
    }

    for (var i = 0; i < galleries.length; i += 1) {
      var gallery = galleries[i];
      if (forceByRoute && !galleryHasVisibleImage(gallery)) {
        return true;
      }

      var containers = gallery.querySelectorAll('[data-hook="item-container"], .gallery-item-container');
      if (!containers.length) {
        continue;
      }

      for (var j = 0; j < containers.length; j += 1) {
        var style = window.getComputedStyle(containers[j]);
        if (!style) {
          continue;
        }
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') < 0.05) {
          return true;
        }
      }
    }

    return false;
  }

  function forceShowProGallery() {
    var galleries = document.querySelectorAll('.pro-gallery');

    for (var i = 0; i < galleries.length; i += 1) {
      var gallery = galleries[i];
      unhideAncestorChain(gallery, 6);
      makeNodeVisible(gallery);

      var nodes = gallery.querySelectorAll(
        '[data-hook="group-view"], [data-hook="item-container"], .gallery-item-container, [data-hook="item-wrapper"], [data-hook="image-item"], .gallery-parent-container, .gallery-item-wrapper, .gallery-item-content'
      );

      for (var j = 0; j < nodes.length; j += 1) {
        makeNodeVisible(nodes[j]);
      }

      var mediaNodes = gallery.querySelectorAll('picture, img, source');
      for (var k = 0; k < mediaNodes.length; k += 1) {
        makeNodeVisible(mediaNodes[k]);

        if (mediaNodes[k].tagName === 'IMG') {
          var img = mediaNodes[k];
          img.loading = 'eager';
          img.decoding = 'sync';
        }
      }
    }
  }

  function fixSponsorBottomGalleryLayout() {
    var info = getRouteInfo();
    if (normalizeRouteForMatch(info.route) !== '/sponsor') {
      return;
    }

    var host = document.getElementById('comp-mmcvbf2c');
    if (!host) {
      return;
    }

    // Keep this host fluid so hidden Wix gallery layout does not create empty space.
    host.style.setProperty('height', 'auto', 'important');
    host.style.setProperty('min-height', '0', 'important');
    host.style.setProperty('max-height', 'none', 'important');
    host.style.setProperty('overflow', 'visible', 'important');

    var wrappers = host.querySelectorAll('.pro-gallery, .pro-gallery-parent-container, [data-hook="group-view"]');
    for (var i = 0; i < wrappers.length; i += 1) {
      wrappers[i].style.setProperty('height', 'auto', 'important');
      wrappers[i].style.setProperty('min-height', '0', 'important');
      wrappers[i].style.setProperty('max-height', 'none', 'important');
      wrappers[i].style.setProperty('overflow', 'visible', 'important');
      wrappers[i].style.setProperty('visibility', 'visible', 'important');
      wrappers[i].style.setProperty('opacity', '1', 'important');
    }
  }

  function setupSponsorBottomCarouselNav(fallback, track) {
    if (!fallback || !track) {
      return;
    }

    var prev = fallback.querySelector('.mirror-sponsor-bottom-prev');
    var next = fallback.querySelector('.mirror-sponsor-bottom-next');
    if (!prev || !next) {
      return;
    }

    function scrollByStep(direction) {
      var firstCard = track.querySelector('.mirror-sponsor-bottom-card');
      var cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
      var step = Math.max(track.clientWidth * 0.84, cardWidth + 14, 280);
      var delta = direction < 0 ? -step : step;
      try {
        track.scrollBy({ left: delta, behavior: 'smooth' });
      } catch (err) {
        track.scrollLeft += delta;
      }
    }

    function updateButtons() {
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      var canGoPrev = track.scrollLeft > 2;
      var canGoNext = track.scrollLeft < maxScroll - 2;

      prev.disabled = !canGoPrev;
      next.disabled = !canGoNext;
      prev.setAttribute('aria-disabled', canGoPrev ? 'false' : 'true');
      next.setAttribute('aria-disabled', canGoNext ? 'false' : 'true');

      if (maxScroll <= 4) {
        prev.style.display = 'none';
        next.style.display = 'none';
      } else {
        prev.style.display = '';
        next.style.display = '';
      }
    }

    if (!fallback.__mirrorSponsorNavBound) {
      prev.addEventListener('click', function () {
        scrollByStep(-1);
      });
      next.addEventListener('click', function () {
        scrollByStep(1);
      });
      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);
      fallback.__mirrorSponsorNavBound = true;
    }

    updateButtons();
  }

  function renderSponsorBottomCarouselFallback() {
    var info = getRouteInfo();
    if (normalizeRouteForMatch(info.route) !== '/sponsor') {
      return;
    }

    var host = document.getElementById('comp-mmcvbf2c');
    if (!host) {
      return;
    }

    var images = host.querySelectorAll('.pro-gallery img');
    var nativeGallery = host.querySelector('#pro-gallery-comp-mmcvbf2c');
    var visibleCount = 0;
    for (var i = 0; i < images.length; i += 1) {
      if (isElementActuallyVisible(images[i])) {
        visibleCount += 1;
      }
    }

    var fallback = document.getElementById('mirror-sponsor-bottom-carousel');
    if (visibleCount >= 2) {
      if (nativeGallery) {
        nativeGallery.style.removeProperty('display');
      }
      if (fallback) {
        fallback.style.display = 'none';
      }
      return;
    }

    var items = getGalleryItemsFromWarmup('comp-mmcvbf2c');
    if (!items.length) {
      return;
    }

    if (!fallback) {
      fallback = document.createElement('div');
      fallback.id = 'mirror-sponsor-bottom-carousel';
      fallback.className = 'mirror-sponsor-bottom-carousel';
      fallback.innerHTML =
        '<button type="button" class="mirror-sponsor-bottom-nav mirror-sponsor-bottom-prev" aria-label="Previous sponsor images">&lt;</button>' +
        '<div class="mirror-sponsor-bottom-track"></div>' +
        '<button type="button" class="mirror-sponsor-bottom-nav mirror-sponsor-bottom-next" aria-label="Next sponsor images">&gt;</button>';
      host.appendChild(fallback);
    }

    fallback.style.display = 'block';
    host.style.setProperty('height', 'auto', 'important');
    host.style.setProperty('min-height', '0', 'important');
    host.style.setProperty('overflow', 'visible', 'important');
    host.style.setProperty('visibility', 'visible', 'important');
    host.style.setProperty('opacity', '1', 'important');
    if (nativeGallery) {
      nativeGallery.style.setProperty('display', 'none', 'important');
    }

    var track = fallback.querySelector('.mirror-sponsor-bottom-track');
    var prevBtn = fallback.querySelector('.mirror-sponsor-bottom-prev');
    var nextBtn = fallback.querySelector('.mirror-sponsor-bottom-next');
    if ((!prevBtn || !nextBtn) && track) {
      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'mirror-sponsor-bottom-nav mirror-sponsor-bottom-prev';
      prevBtn.setAttribute('aria-label', 'Previous sponsor images');
      prevBtn.textContent = '<';
      fallback.insertBefore(prevBtn, track);

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'mirror-sponsor-bottom-nav mirror-sponsor-bottom-next';
      nextBtn.setAttribute('aria-label', 'Next sponsor images');
      nextBtn.textContent = '>';
      fallback.appendChild(nextBtn);
    }

    if (!track) {
      return;
    }

    setupSponsorBottomCarouselNav(fallback, track);

    if (track.childElementCount === items.length) {
      return;
    }

    track.innerHTML = '';
    for (var j = 0; j < items.length; j += 1) {
      var item = items[j];
      if (!item || !item.mediaUrl) {
        continue;
      }

      var src = pickKnownMediaUrlForId(item.mediaUrl);
      if (!src) {
        continue;
      }

      var card = document.createElement('figure');
      card.className = 'mirror-sponsor-bottom-card';

      var img = document.createElement('img');
      img.className = 'mirror-sponsor-bottom-image';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = src;
      img.alt = (item.metaData && (item.metaData.alt || item.metaData.fileName)) || 'Sponsor image';

      card.appendChild(img);
      track.appendChild(card);
    }

    setupSponsorBottomCarouselNav(fallback, track);
  }

  function runGalleryFix() {
    rewriteStaticWixMediaUrls();

    var info = getRouteInfo();
    var forcedRoute = isForcedGalleryRoute(info.route);
    var hasGallery = document.querySelector('.pro-gallery');

    if ((forcedRoute && hasGallery) || shouldForceGalleryFallback()) {
      forceShowProGallery();
    }

    fixSponsorBottomGalleryLayout();
    renderSponsorBottomCarouselFallback();
  }

  function shouldForceRepeaterFallback() {
    var repeaters = document.querySelectorAll('fluid-columns-repeater');
    for (var i = 0; i < repeaters.length; i += 1) {
      var repeater = repeaters[i];
      var inline = (repeater.getAttribute('style') || '').toLowerCase();
      var hasHiddenStyle =
        inline.indexOf('visibility:hidden') !== -1 ||
        inline.indexOf('display:none') !== -1 ||
        inline.indexOf('opacity:0') !== -1;
      if (!hasHiddenStyle) {
        continue;
      }

      var hasMediaOrLinks = repeater.querySelector('img, picture, a[href]');
      if (hasMediaOrLinks) {
        return true;
      }
    }
    return false;
  }

  function forceShowRepeaters() {
    var root = document.documentElement;
    if (root) {
      root.classList.add(REPEATER_STYLE_CLASS);
    }
    if (document.body) {
      document.body.classList.add(REPEATER_STYLE_CLASS);
    }

    var repeaters = document.querySelectorAll('fluid-columns-repeater');
    for (var i = 0; i < repeaters.length; i += 1) {
      var repeater = repeaters[i];
      repeater.classList.add(REPEATER_NODE_CLASS);
      repeater.setAttribute('data-mirror-repeater-fallback', '1');
      repeater.style.setProperty('visibility', 'visible', 'important');
      repeater.style.setProperty('opacity', '1', 'important');
      repeater.style.setProperty('display', 'flex', 'important');
      repeater.style.setProperty('flex-wrap', 'wrap', 'important');
      repeater.style.setProperty('justify-content', 'center', 'important');
      repeater.style.setProperty('height', 'auto', 'important');
      repeater.style.setProperty('overflow', 'visible', 'important');
      repeater.style.setProperty('pointer-events', 'auto', 'important');
      repeater.removeAttribute('hidden');
      repeater.setAttribute('aria-hidden', 'false');
    }

    var hiddenNodes = document.querySelectorAll(
      'fluid-columns-repeater [style*="visibility:hidden"], fluid-columns-repeater [style*="visibility: hidden"], fluid-columns-repeater [style*="display:none"], fluid-columns-repeater [style*="display: none"], fluid-columns-repeater [style*="opacity:0"], fluid-columns-repeater [style*="opacity: 0"]'
    );
    for (var j = 0; j < hiddenNodes.length; j += 1) {
      hiddenNodes[j].style.setProperty('visibility', 'visible', 'important');
      hiddenNodes[j].style.setProperty('opacity', '1', 'important');
      hiddenNodes[j].style.setProperty('display', 'block', 'important');
      hiddenNodes[j].removeAttribute('hidden');
      hiddenNodes[j].setAttribute('aria-hidden', 'false');
    }

    var links = document.querySelectorAll('fluid-columns-repeater a[href]');
    for (var k = 0; k < links.length; k += 1) {
      links[k].style.setProperty('pointer-events', 'auto', 'important');
    }
  }

  function runRepeaterFix() {
    rewriteStaticWixMediaUrls();
    if (shouldForceRepeaterFallback()) {
      forceShowRepeaters();
    }
  }

  function onReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb, { once: true });
    } else {
      cb();
    }
  }

  function setupHydrationFallbackObserver() {
    if (!window.MutationObserver || !document.body) {
      return;
    }

    var scheduled = false;
    function scheduleFix() {
      if (scheduled) {
        return;
      }
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        rewriteStaticWixMediaUrls();
        runRepeaterFix();
        runGalleryFix();
      }, 80);
    }

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i += 1) {
        var mutation = mutations[i];
        if (mutation.type === 'childList') {
          scheduleFix();
          return;
        }

        if (mutation.type === 'attributes') {
          var target = mutation.target;
          if (!target || !target.closest) {
            continue;
          }

          var inGallery = target.closest('.pro-gallery');
          var inRepeater = target.closest('fluid-columns-repeater');
          var isMediaNode =
            target.tagName === 'IMG' ||
            target.tagName === 'SOURCE' ||
            target.tagName === 'PICTURE' ||
            false;

          if (inGallery || inRepeater || target.tagName === 'FLUID-COLUMNS-REPEATER' || isMediaNode) {
            scheduleFix();
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden', 'src', 'srcset', 'data-src', 'data-srcset']
    });
  }

  function setupShortPersistentFix() {
    var runs = 0;
    var maxRuns = 30;
    var interval = setInterval(function () {
      runs += 1;
      rewriteStaticWixMediaUrls();
      runRepeaterFix();
      runGalleryFix();
      if (runs >= maxRuns) {
        clearInterval(interval);
      }
    }, 500);
  }

  onReady(function () {
    addLanguageSwitcher();
    rewriteStaticWixMediaUrls();
    setupHydrationFallbackObserver();
    setupShortPersistentFix();
    setTimeout(removeFallbackIfNativeSelectorExists, 1200);
    setTimeout(removeFallbackIfNativeSelectorExists, 2500);
    setTimeout(runRepeaterFix, 500);
    setTimeout(runRepeaterFix, 1400);
    setTimeout(runGalleryFix, 900);
    setTimeout(runGalleryFix, 2000);
    window.addEventListener(
      'load',
      function () {
        rewriteStaticWixMediaUrls();
        runRepeaterFix();
        runGalleryFix();
      },
      { once: true }
    );
  });
})();
