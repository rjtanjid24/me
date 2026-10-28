/* Tanjid Shuvro Portfolio: main script
   Sections: helpers, navigation, reveal, events, author logos, contact dialog, gallery, lightbox */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Navigation ---------- */
  var nav = $('#nav');
  var toTop = $('#toTop');
  var menuBtn = $('#menuBtn');
  var mobileMenu = $('#mobileMenu');

  function onScroll() {
    var y = window.scrollY || 0;
    nav.classList.toggle('scrolled', y > 8);
    toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    mobileMenu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন');
  }
  menuBtn.addEventListener('click', function () { setMenu(!mobileMenu.classList.contains('open')); });
  $$('a', mobileMenu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* Active link while scrolling */
  var links = $$('#navLinks a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });

    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    $$('.reveal').forEach(function (el) { rev.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Year (Bengali digits) ---------- */
  var yearEl = $('#year');
  if (yearEl) {
    try { yearEl.textContent = new Intl.NumberFormat('bn-BD', { useGrouping: false }).format(new Date().getFullYear()); } catch (e) { /* keep default */ }
  }

  /* ---------- Event status (upcoming / today / done) ---------- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  $$('[data-event-date]').forEach(function (el) {
    var d = new Date(el.getAttribute('data-event-date') + 'T00:00:00');
    var diff = Math.round((d - today) / 86400000);
    var badge = $('.event-status', el);
    if (!badge) return;
    badge.classList.remove('done');
    if (diff > 1) badge.textContent = 'আসন্ন';
    else if (diff === 1) badge.textContent = 'আগামীকাল';
    else if (diff === 0) badge.textContent = 'আজ';
    else { badge.textContent = 'সম্পন্ন'; badge.classList.add('done'); }
  });

  /* ---------- Author logos: text fallback if an image fails ---------- */
  $$('img[data-fallback]').forEach(function (img) {
    function swap() {
      var span = document.createElement('span');
      span.className = 'text-logo';
      span.textContent = img.getAttribute('data-fallback');
      if (img.parentNode) img.parentNode.replaceChild(span, img);
    }
    img.addEventListener('error', swap);
    if (img.complete && img.naturalWidth === 0) swap();
  });

  /* ---------- Contact dialog ---------- */
  var dlg = $('#contactDialog');
  $$('[data-open-contact]').forEach(function (b) {
    b.addEventListener('click', function () {
      setMenu(false);
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });
  });
  $('#contactClose').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  /* ---------- Gallery ---------- */
  var DATA_URL = 'data/gallery.json';
  var PAGE_SIZE = 12;
  var FEATURED_LIMIT = 8;
  var BASE = 'https://rjtanjid24.github.io/me/images/';

  /* Used only if data/gallery.json cannot be loaded (for example when opened from file://) */
  var FALLBACK = [
    { src: BASE + 'ta_cm.jpg', title: 'ক্যারিয়ার মিটআপ ঢাকা', category: 'ক্যারিয়ার', featured: true },
    { src: BASE + 'assessment.jpg', title: 'অ্যাসেসমেন্ট সেশন', category: 'অ্যাসেসমেন্ট', featured: true },
    { src: BASE + 'btclf.jpg', title: 'বাংলাদেশ তরুণ কলাম লেখক ফোরাম', category: 'সংগঠন', featured: true }
  ];

  var allPhotos = [];
  var shown = 0;
  var activeCat = 'সব';
  var swiper = null;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  function tile(photo, index, list, extraClass) {
    var img = el('img', { src: photo.thumb || photo.src, alt: photo.title || 'ছবি', loading: 'lazy' });
    var cap = el('span', { 'class': 'g-cap', text: photo.title || '' });
    var b = el('button', { type: 'button', 'class': 'g-slide ' + (extraClass || ''), 'aria-label': (photo.title || 'ছবি') + ' বড় করে দেখুন' }, [img, cap]);
    b.addEventListener('click', function () { openLightbox(list, index, b); });
    return b;
  }

  function renderSlider(photos) {
    var wrap = $('#gallerySlides');
    wrap.innerHTML = '';
    var featured = photos.filter(function (p) { return p.featured; });
    if (!featured.length) featured = photos;
    featured = featured.slice(0, FEATURED_LIMIT);
    featured.forEach(function (p, i) {
      var slide = el('div', { 'class': 'swiper-slide' }, [tile(p, i, featured)]);
      wrap.appendChild(slide);
    });
    var root = $('#gallerySwiper');
    if (typeof Swiper === 'function') {
      if (swiper) swiper.destroy(true, true);
      swiper = new Swiper(root, {
        slidesPerView: 1.1,
        spaceBetween: 16,
        loop: featured.length > 4,
        grabCursor: true,
        autoplay: { delay: 4200, pauseOnMouseEnter: true, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
      });
    } else {
      root.classList.add('no-swiper');
    }
  }

  function filtered() {
    return activeCat === 'সব' ? allPhotos : allPhotos.filter(function (p) { return p.category === activeCat; });
  }

  function renderGrid(reset) {
    var grid = $('#galleryGrid');
    var list = filtered();
    if (reset) { grid.innerHTML = ''; shown = 0; }
    var next = list.slice(shown, shown + PAGE_SIZE);
    next.forEach(function (p, i) { grid.appendChild(tile(p, shown + i, list)); });
    shown += next.length;
    $('#galleryMore').parentNode.hidden = shown >= list.length;
    if (!list.length) grid.appendChild(el('p', { 'class': 'empty-note', text: 'এই বিভাগে এখনো কোনো ছবি নেই।' }));
  }

  function renderChips() {
    var chips = $('#galleryChips');
    chips.innerHTML = '';
    var cats = ['সব'];
    allPhotos.forEach(function (p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
    cats.forEach(function (c) {
      var b = el('button', { type: 'button', 'class': 'chip', 'aria-pressed': String(c === activeCat), text: c });
      b.addEventListener('click', function () {
        activeCat = c;
        $$('.chip', chips).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderGrid(true);
      });
      chips.appendChild(b);
    });
  }

  function loadGallery() {
    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (j) { return Array.isArray(j) ? j : (j.photos || []); })
      .catch(function () { return FALLBACK; });
  }

  loadGallery().then(function (photos) {
    allPhotos = photos.filter(function (p) { return p && p.src; });
    renderSlider(allPhotos);
    renderChips();
    renderGrid(true);
  });

  var toggle = $('#galleryToggle');
  var panel = $('#galleryAll');
  toggle.addEventListener('click', function () {
    var open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'ছবি লুকান' : 'সব ছবি দেখুন';
    if (open) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#galleryMore').addEventListener('click', function () { renderGrid(false); });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCap');
  var lbList = [];
  var lbIdx = 0;
  var lbReturn = null;

  function paint() {
    var p = lbList[lbIdx];
    if (!p) return;
    lbImg.src = p.src;
    lbImg.alt = p.title || 'ছবি';
    lbCap.textContent = p.title || '';
    if (p.date || p.category) {
      var small = document.createElement('small');
      small.textContent = [p.category, p.date].filter(Boolean).join(' | ');
      lbCap.appendChild(small);
    }
  }
  function openLightbox(list, index, trigger) {
    lbList = list; lbIdx = index; lbReturn = trigger || null;
    paint();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
    if (lbReturn && lbReturn.focus) lbReturn.focus();
  }
  function step(d) { lbIdx = (lbIdx + d + lbList.length) % lbList.length; paint(); }

  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', function () { step(-1); });
  $('#lbNext').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
