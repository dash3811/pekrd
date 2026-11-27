/* Peak Events by KRD — site interactions. No dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BASE = root.getAttribute('data-base') || '/';
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };

  /* ---------- Storage-safe quote list ---------- */
  var KEY = 'pekrd-quote-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return memory; } }
  var memory = [];
  function save(list) { memory = list; try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function totalCount(list) { return list.reduce(function (n, i) { return n + (i.qty > 0 ? 1 : 0); }, 0); }
  var live = doc.getElementById('live');
  function announce(msg) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  function renderCount(pulse) {
    var n = totalCount(load());
    $$('.quote-count').forEach(function (el) {
      el.textContent = n; el.classList.toggle('is-empty', n === 0);
      if (pulse) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
    });
    var bar = $('.quote-bar');
    if (bar) {
      $('.quote-bar-count', bar).textContent = n + (n === 1 ? ' item' : ' items') + ' in your quote';
      bar.classList.toggle('is-visible', n > 0 && !doc.body.classList.contains('page-quote'));
    }
  }

  function addItem(data) {
    var list = load();
    var id = data.slug + '|' + (data.variant || '') + (data.custom ? '|' + Date.now() : '');
    var found = list.filter(function (i) { return i.id === id; })[0];
    if (found) { found.qty += data.qty || 1; }
    else { list.push({ id: id, slug: data.slug, name: data.name, variant: data.variant || '', img: data.img, url: data.url, qty: data.qty || 1, notes: data.notes || '' }); }
    save(list);
    renderCount(true);
    announce(data.name + (data.variant ? ', ' + data.variant : '') + ' added to your quote.');
  }

  function fly(fromEl) {
    var target = $('.site-header .quote-bag');
    if (reduce || !fromEl || !target) return;
    var a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    var size = 64;
    var d = doc.createElement('div');
    d.className = 'fly';
    d.style.width = d.style.height = size + 'px';
    d.style.left = (a.left + a.width / 2 - size / 2) + 'px';
    d.style.top = (a.top + a.height / 2 - size / 2) + 'px';
    var img = fromEl.querySelector('img.cut') || fromEl.querySelector('img');
    if (img) d.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
    doc.body.appendChild(d);
    requestAnimationFrame(function () {
      var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      d.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.25)';
      d.style.opacity = '.4';
    });
    setTimeout(function () { d.remove(); }, 600);
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    e.preventDefault();
    var scope = btn.closest('[data-item]');
    var qtyInput = scope && scope.querySelector('.stepper input');
    var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
    addItem({ slug: btn.dataset.slug, name: btn.dataset.name, variant: btn.dataset.variant, img: btn.dataset.img, url: btn.dataset.url, qty: qty });
    fly(scope && (scope.querySelector('.card-media') || scope.querySelector('.product-main')));
    var label = btn.querySelector('.add-label');
    btn.classList.add('is-added');
    if (label) { var old = label.dataset.text || label.textContent; label.dataset.text = old; label.textContent = 'Added'; setTimeout(function () { label.textContent = old; btn.classList.remove('is-added'); }, 1600); }
  });

  /* ---------- Header + menu ---------- */
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var menuBtn = $('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = doc.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && doc.body.classList.contains('menu-open')) { doc.body.classList.remove('menu-open'); menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Intro monogram (once per session, home only) ---------- */
  var intro = $('.intro');
  if (intro) {
    var seen = false; try { seen = sessionStorage.getItem('pekrd-intro') === '1'; } catch (e) {}
    if (seen || reduce) { intro.remove(); }
    else {
      try { sessionStorage.setItem('pekrd-intro', '1'); } catch (e) {}
      $$('path', intro).forEach(function (p) { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); });
      setTimeout(function () { intro.classList.add('is-done'); }, 1700);
      setTimeout(function () { intro.remove(); }, 2600);
    }
  }

  /* ---------- Split headline words ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="word" aria-hidden="true"><span style="transition-delay:' + (i * 70 + 200) + 'ms">' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('[data-reveal], .script-reveal, .checker, [data-split]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('is-in'); }); }
  // Stagger groups
  $$('[data-stagger]').forEach(function (g) {
    $$('[data-reveal]', g).forEach(function (el, i) { el.style.setProperty('--d', (i % 8) * 70 + 'ms'); });
  });

  /* ---------- Parallax collage ---------- */
  var layers = $$('[data-speed]');
  if (layers.length && !reduce) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      if (window.innerWidth < 760) { layers.forEach(function (l) { l.style.transform = ''; }); ticking = false; return; }
      layers.forEach(function (l) {
        var r = l.parentElement.getBoundingClientRect();
        var center = r.top + r.height / 2 - vh / 2;
        var s = parseFloat(l.dataset.speed);
        var t = Math.max(-50, Math.min(50, center * (s - 1)));
        l.style.transform = 'translate3d(0,' + t.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update); update();
  }

  /* ---------- Finish swatches ---------- */
  doc.addEventListener('click', function (e) {
    var sw = e.target.closest('.swatch');
    if (!sw) return;
    var scope = sw.closest('[data-item]');
    $$('.swatch', scope).forEach(function (s) { s.setAttribute('aria-pressed', s === sw ? 'true' : 'false'); });
    var img = scope.querySelector('img.cut');
    if (img && img.getAttribute('src') !== sw.dataset.img) {
      img.style.opacity = '0';
      var next = new Image();
      next.onload = function () { img.src = sw.dataset.img; img.alt = sw.dataset.alt; img.style.opacity = ''; };
      next.src = sw.dataset.img;
    }
    var add = scope.querySelector('[data-add]');
    if (add) { add.dataset.variant = sw.dataset.label; add.dataset.img = sw.dataset.img; }
    var lbl = scope.querySelector('.finish-label b');
    if (lbl) lbl.textContent = sw.dataset.label;
  });

  /* ---------- Steppers ---------- */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('.stepper button');
    if (!b) return;
    var input = b.parentElement.querySelector('input');
    var v = (parseInt(input.value, 10) || 0) + (b.dataset.step === '+' ? 1 : -1);
    input.value = Math.max(parseInt(input.min || '1', 10), v);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Catalog filtering ---------- */
  var catalog = $('[data-catalog]');
  if (catalog) {
    var cards = $$('.card', catalog);
    var state = { cat: catalog.dataset.fixedCat || 'all', style: 'all', q: '' };
    var count = $('.result-count');
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (state.cat === 'all' || c.dataset.cat === state.cat) &&
          (state.style === 'all' || (' ' + c.dataset.style + ' ').indexOf(' ' + state.style + ' ') > -1) &&
          (!state.q || c.dataset.search.indexOf(state.q) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n + (n === 1 ? ' piece' : ' pieces');
    };
    $$('[data-filter-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cat = b.dataset.filterCat;
        $$('[data-filter-cat]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        try { history.replaceState(null, '', state.cat === 'all' ? location.pathname : '#' + state.cat); } catch (e) {}
        apply();
      });
    });
    $$('[data-filter-style]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.style = b.dataset.filterStyle;
        $$('[data-filter-style]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    var search = $('.search input');
    if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(); });
    var hash = location.hash.replace('#', '');
    var hb = hash && $('[data-filter-cat="' + hash + '"]');
    if (hb) hb.click(); else apply();
  }

  /* ---------- Lightbox ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lightbox]');
    if (!t) return;
    var lb = doc.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', t.dataset.title);
    lb.innerHTML = '<img src="' + t.dataset.lightbox + '" alt=""><span class="wm" aria-hidden="true"></span><p></p><button type="button" aria-label="Close">×</button>';
    lb.querySelector('img').alt = t.dataset.title; lb.querySelector('p').textContent = t.dataset.title;
    doc.body.appendChild(lb);
    var close = function () { lb.classList.remove('is-open'); setTimeout(function () { lb.remove(); t.focus(); }, 250); doc.removeEventListener('keydown', esc); };
    var esc = function (ev) { if (ev.key === 'Escape') close(); };
    lb.addEventListener('click', function (ev) { if (ev.target === lb || ev.target.tagName === 'BUTTON') close(); });
    doc.addEventListener('keydown', esc);
    requestAnimationFrame(function () { lb.classList.add('is-open'); lb.querySelector('button').focus(); });
  });

  /* ---------- Custom build picker ---------- */
  var builder = $('[data-builder]');
  if (builder) {
    var stage = $('.builder-stage img', builder), tint = $('.builder-stage .tint', builder);
    var sync = function () {
      var style = $('input[name="b-style"]:checked', builder);
      var use = $('input[name="b-use"]:checked', builder);
      var color = $('input[name="b-color"]:checked', builder);
      if (style && stage.getAttribute('src') !== style.dataset.img) {
        stage.style.opacity = '0'; stage.style.transform = 'translateX(-16px)';
        setTimeout(function () { stage.src = style.dataset.img; stage.alt = style.value + ' facade'; stage.style.opacity = ''; stage.style.transform = ''; }, 220);
      }
      if (color) { tint.style.setProperty('--c', color.dataset.c); $('span', tint).textContent = color.value + ' palette'; }
      var add = $('[data-add-custom]', builder);
      add.dataset.summary = (style ? style.value : '') + ' ' + (use ? use.value.toLowerCase() : '') + ', ' + (color ? color.value.toLowerCase() : '') + ' palette';
    };
    builder.addEventListener('change', sync); sync();
    $('[data-add-custom]', builder).addEventListener('click', function (e) {
      var style = $('input[name="b-style"]:checked', builder);
      var notes = $('#b-notes', builder).value.trim();
      addItem({ slug: 'custom-build', custom: true, name: 'Custom ' + style.value + ' build', variant: e.currentTarget.dataset.summary.replace(style.value + ' ', ''), img: style.dataset.img, url: location.pathname, qty: 1, notes: notes });
      fly($('.builder-stage', builder));
      var b = e.currentTarget; b.textContent = 'Added to your quote'; setTimeout(function () { b.textContent = 'Add this build to my quote'; }, 1800);
    });
  }

  /* ---------- Quote page ---------- */
  var qpage = $('[data-quote-page]');
  if (qpage) {
    var listEl = $('.qlist', qpage), emptyEl = $('.empty', qpage);
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var draw = function () {
      var list = load();
      emptyEl.hidden = list.length > 0;
      listEl.innerHTML = list.map(function (i) {
        return '<li class="qitem" data-id="' + esc(i.id) + '"><img src="' + esc(i.img) + '" alt="" width="72" height="72">' +
          '<div><h3><a href="' + esc(i.url || '#') + '">' + esc(i.name) + '</a></h3><div class="meta">' + esc(i.variant) + (i.notes ? ' · ' + esc(i.notes) : '') + '</div>' +
          '<button type="button" class="remove">Remove</button></div>' +
          '<div class="stepper" role="group" aria-label="Quantity for ' + esc(i.name) + '"><button type="button" data-step="-" aria-label="Decrease">−</button>' +
          '<input type="number" min="1" inputmode="numeric" value="' + i.qty + '" aria-label="Quantity"><button type="button" data-step="+" aria-label="Increase">+</button></div></li>';
      }).join('');
      var summary = $('#q-items');
      if (summary) summary.value = list.map(function (i) { return i.qty + ' × ' + i.name + (i.variant ? ' (' + i.variant + ')' : '') + (i.notes ? ' — notes: ' + i.notes : ''); }).join('\n');
      renderCount(false);
    };
    listEl.addEventListener('change', function (e) {
      var li = e.target.closest('.qitem'); if (!li) return;
      var list = load(); list.forEach(function (i) { if (i.id === li.dataset.id) i.qty = Math.max(1, parseInt(e.target.value, 10) || 1); });
      save(list); draw();
    });
    listEl.addEventListener('click', function (e) {
      if (!e.target.classList.contains('remove')) return;
      var li = e.target.closest('.qitem');
      save(load().filter(function (i) { return i.id !== li.dataset.id; })); draw(); announce('Item removed from your quote.');
    });
    draw();

    var form = $('form', qpage), msg = $('.form-msg', qpage);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = $('button[type="submit"]', form); btn.disabled = true; btn.textContent = 'Sending…';
      var fd = new FormData(form);
      var endpoint = form.dataset.endpoint;
      var req = endpoint
        ? fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        : fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() });
      var done = function (sent) {
        btn.disabled = false; btn.textContent = 'Send my quote request';
        var name = (fd.get('name') || '').toString().split(' ')[0];
        msg.innerHTML = sent
          ? '<h3>Thank you' + (name ? ', ' + esc(name) : '') + '.</h3><p>Your request is in. We will review availability and reply with a tailored quote, usually within two business days.</p>'
          : '<h3>Almost there.</h3><p>This preview isn’t connected to an inbox yet, so nothing was sent. You can email your list instead: <a href="mailto:' + esc(form.dataset.email) + '?subject=Quote%20request&body=' + encodeURIComponent(fd.get('items') + '\n\nEvent date: ' + fd.get('date') + '\nVenue: ' + fd.get('venue') + '\nGuests: ' + fd.get('guests') + '\n\n' + fd.get('message')) + '">' + esc(form.dataset.email) + '</a>.</p>';
        msg.classList.add('is-visible'); msg.setAttribute('tabindex', '-1'); msg.focus();
        if (sent) { save([]); draw(); form.reset(); }
      };
      req.then(function (r) { done(r.ok); }).catch(function () { done(false); });
    });
  }

  /* ---------- Content protection (deterrent only; a browser can't fully block copying or screenshots) ---------- */
  var editable = function (el) { return el && el.closest && el.closest('input, textarea, select, [contenteditable], .allow-select'); };
  document.addEventListener('contextmenu', function (e) { if (!editable(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG' || e.target.tagName === 'A') e.preventDefault(); });
  document.addEventListener('copy', function (e) { if (!editable(e.target)) { e.preventDefault(); if (e.clipboardData) e.clipboardData.setData('text/plain', '© ' + document.title + ' | peakeventsbykrd.com'); } });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if ((mod && ['s', 'u', 'p'].indexOf(k) > -1) || (mod && e.shiftKey && ['i', 'j', 'c'].indexOf(k) > -1) || k === 'f12') { e.preventDefault(); }
    if (k === 'printscreen') shield(true, 1500);
  });
  document.addEventListener('keyup', function (e) { if ((e.key || '').toLowerCase() === 'printscreen') { shield(true, 1500); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('').catch(function () {}); } });
  var shieldTimer;
  function shield(on, ms) {
    clearTimeout(shieldTimer);
    document.documentElement.classList.toggle('shield-on', on);
    if (on && ms) shieldTimer = setTimeout(function () { shield(false); }, ms);
  }
  // Blur photos while the window isn't focused (deters snipping tools that take focus)
  window.addEventListener('blur', function () { shield(true); });
  window.addEventListener('focus', function () { shield(false); });
  document.addEventListener('visibilitychange', function () { shield(document.hidden); });

  renderCount(false);
})();
