/* ==========================================================================
   FindMyCar — Vision Concept
   All interactions. Vanilla JS, no dependencies, no network calls.
   Every "intelligent" behaviour here (search parsing, match scores, the
   live ticker, etc.) is a scripted simulation over fixed mock data —
   nothing here talks to a server.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

  ready(function () {
    initNavBurger();
    initActiveNav();
    initWordReveal();
    initReveal();
    initCounters();
    initMatchRings();
    initBars();
    initSvgDraw();
    initMarqueeHoverPause();
    initSearchConsole();
    initCompareSlider();
    initRadarChart();
    initJourneysRail();
    initNewsletterForm();
    initBackToTop();

    if (finePointer && !reduceMotion) {
      initCursor();
      initMagnetic();
      initTilt();
      initHeroParallax();
    }
  });

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ------------------------------------------------------------------ *
   * Mobile nav toggle
   * ------------------------------------------------------------------ */
  function initNavBurger() {
    var burger = document.getElementById('navBurger');
    var nav = document.querySelector('.nav-links');
    if (!burger || !nav) return;

    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      nav.style.display = !open ? 'flex' : '';
      if (!open) {
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.flexDirection = 'column';
        nav.style.padding = '10px var(--gutter) 18px';
        nav.style.background = 'rgba(10,9,8,0.92)';
        nav.style.backdropFilter = 'blur(18px)';
        nav.style.borderBottom = '1px solid var(--hairline)';
      }
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        nav.style.display = '';
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Highlight nav link for the section currently in view
   * ------------------------------------------------------------------ */
  function initActiveNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      if (id) map[id] = a;
    });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------ *
   * Hero headline — staggered word reveal (sets --w per word)
   * ------------------------------------------------------------------ */
  function initWordReveal() {
    var words = document.querySelectorAll('.hero-title .word-reveal');
    words.forEach(function (w, i) { w.style.setProperty('--w', i); });
  }

  /* ------------------------------------------------------------------ *
   * Generic scroll-reveal: adds .is-visible to [data-reveal] and
   * [data-reveal-group] elements once they enter the viewport.
   * ------------------------------------------------------------------ */
  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach(function (t) { t.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (t) { io.observe(t); });
  }

  /* ------------------------------------------------------------------ *
   * Animated counters — count up from 0 to data-count-to once visible
   * ------------------------------------------------------------------ */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count-to]');
    if (!nodes.length) return;

    function animate(node) {
      var target = parseFloat(node.getAttribute('data-count-to'));
      if (isNaN(target) || node.dataset.counted) return;
      node.dataset.counted = '1';

      if (reduceMotion) { node.textContent = formatNumber(target); return; }

      var start = null;
      var duration = 1400 + Math.min(target, 2000) * 0.25;

      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = formatNumber(Math.floor(eased * target));
        if (p < 1) requestAnimationFrame(frame);
        else node.textContent = formatNumber(target);
      }
      requestAnimationFrame(frame);
    }

    function formatNumber(n) {
      return n.toLocaleString('en-US');
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(animate);
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------------------------ *
   * Match-score rings — translate data-value into a CSS custom property
   * that the stroke-dashoffset transition reads.
   * ------------------------------------------------------------------ */
  function initMatchRings() {
    document.querySelectorAll('.ring-fg[data-value]').forEach(function (circle) {
      circle.style.setProperty('--pct', circle.getAttribute('data-value'));
    });
  }

  /* ------------------------------------------------------------------ *
   * Comparison bars — translate data-a / data-b into custom properties
   * ------------------------------------------------------------------ */
  function initBars() {
    document.querySelectorAll('[data-bars]').forEach(function (row) {
      var a = row.querySelector('.bar--a');
      var b = row.querySelector('.bar--b');
      if (a) a.style.setProperty('--va', row.getAttribute('data-a') || 0);
      if (b) b.style.setProperty('--vb', row.getAttribute('data-b') || 0);
    });
  }

  /* ------------------------------------------------------------------ *
   * Hero silhouette — measured stroke "draw" animation
   * ------------------------------------------------------------------ */
  function initSvgDraw() {
    var path = document.getElementById('heroCarPath');
    if (!path || typeof path.getTotalLength !== 'function') return;

    if (reduceMotion) return; // leave silhouette fully visible

    drawStroke(path, 2.4, 0.35);
    var wheels = document.querySelectorAll('.hero-wheel');
    wheels.forEach(function (c, i) { drawStroke(c, 0.9, 1.85 + i * 0.18); });

    function drawStroke(el, duration, delay) {
      try {
        var len = el.getTotalLength();
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        el.getBoundingClientRect(); // force reflow
        el.style.transition = 'stroke-dashoffset ' + duration + 's ' + ease + ' ' + delay + 's';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { el.style.strokeDashoffset = '0'; });
        });
      } catch (e) { /* SVG not ready in some browsers pre-paint — fail silently, path stays visible */ }
    }
  }

  /* ------------------------------------------------------------------ *
   * Marquees — pause the scroll on hover/focus for readability
   * ------------------------------------------------------------------ */
  function initMarqueeHoverPause() {
    document.querySelectorAll('[data-marquee]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { pauseTracks(el, true); });
      el.addEventListener('mouseleave', function () { pauseTracks(el, false); });
    });
    function pauseTracks(el, pause) {
      el.querySelectorAll('.marquee-track, .ticker-list').forEach(function (t) {
        t.style.animationPlayState = pause ? 'paused' : 'running';
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Smart-search concept console — a scripted, looping simulation:
   * type a query → parse it into chips → "think" → reveal mock results
   * ------------------------------------------------------------------ */
  function initSearchConsole() {
    var typeEl = document.getElementById('searchTypewriter');
    var chipsEl = document.getElementById('searchChips');
    var resultsEl = document.getElementById('searchResults');
    var section = document.getElementById('search');
    if (!typeEl || !chipsEl || !resultsEl || !section) return;

    var scenarios = [
      {
        query: 'Something fun for backroads, but it still has to fit a dog crate…',
        chips: [
          { label: 'Body: Estate / Wagon', tone: 'a' },
          { label: 'Budget: €35k – 50k', tone: 'b' },
          { label: 'Priority: Driving feel', tone: 'a' },
          { label: 'Within 150 km of Amsterdam', tone: 'b' }
        ],
        results: [
          { name: 'Audi A4 Avant 40 TFSI', meta: 'Estate · Petrol · 204 hp', pct: '95% match' },
          { name: 'Volvo V60 B4 Plus', meta: 'Estate · Mild-hybrid · 197 hp', pct: '91% match' },
          { name: 'Skoda Octavia Combi RS', meta: 'Estate · Petrol · 245 hp', pct: '89% match' }
        ]
      },
      {
        query: 'Quiet, efficient, good for long autobahn runs to see my parents…',
        chips: [
          { label: 'Body: Sedan / Liftback', tone: 'b' },
          { label: 'Priority: Comfort & range', tone: 'a' },
          { label: 'Fuel: Hybrid or Electric', tone: 'b' },
          { label: 'Driver profile: Long-distance', tone: 'a' }
        ],
        results: [
          { name: 'Mercedes-Benz E 300 e', meta: 'Sedan · Plug-in hybrid · 313 hp', pct: '94% match' },
          { name: 'BMW 520d Touring', meta: 'Estate · Diesel · 197 hp', pct: '92% match' },
          { name: 'Polestar 2 Long Range', meta: 'Fastback · Electric · 540 km', pct: '88% match' }
        ]
      },
      {
        query: "I need a family SUV that doesn't feel like a minivan…",
        chips: [
          { label: 'Body: SUV (5–7 seats)', tone: 'a' },
          { label: 'Priority: Style + space', tone: 'b' },
          { label: 'Budget: up to €60k', tone: 'a' },
          { label: 'Markets: NL · BE · DE', tone: 'b' }
        ],
        results: [
          { name: 'Volvo XC60 Recharge', meta: 'SUV · Plug-in hybrid · 455 hp', pct: '93% match' },
          { name: 'BMW X3 xDrive30e', meta: 'SUV · Plug-in hybrid · 292 hp', pct: '90% match' },
          { name: 'Kia Sorento Hybrid', meta: 'SUV · 7 seats · 230 hp', pct: '87% match' }
        ]
      },
      {
        query: 'Something special for my first proper weekend car…',
        chips: [
          { label: 'Body: Coupé / Roadster', tone: 'a' },
          { label: 'Priority: Character', tone: 'b' },
          { label: 'Use: Weekends only', tone: 'a' },
          { label: 'Budget: €25k – 40k', tone: 'b' }
        ],
        results: [
          { name: 'Mazda MX-5 2.0 Skyactiv', meta: 'Roadster · Petrol · 184 hp', pct: '96% match' },
          { name: 'BMW Z4 sDrive30i', meta: 'Roadster · Petrol · 258 hp', pct: '90% match' },
          { name: 'Toyota GR86', meta: 'Coupé · Petrol · 234 hp', pct: '88% match' }
        ]
      }
    ];

    var idx = 0;
    var running = false;
    var timers = [];
    var typingTimer = null;

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
      if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    }
    function after(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }

    function typewrite(text, cb) {
      typeEl.textContent = '';
      if (reduceMotion) { typeEl.textContent = text; cb(); return; }
      var i = 0;
      typingTimer = setInterval(function () {
        i++;
        typeEl.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(typingTimer); typingTimer = null; cb(); }
      }, 26);
    }

    function chipMarkup(label, tone) {
      var icon = tone === 'a'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';
      return '<span class="chip-in">' + icon + label + '</span>';
    }

    function renderChips(chips) {
      chipsEl.innerHTML = '';
      chips.forEach(function (c, i) {
        after(reduceMotion ? 0 : i * 160, function () {
          var span = document.createElement('span');
          span.className = 'chip-in';
          span.style.animationDelay = '0ms';
          span.innerHTML = chipMarkup(c.label, c.tone).replace(/^<span class="chip-in">|<\/span>$/g, '');
          chipsEl.appendChild(span);
        });
      });
    }

    function renderThinking() {
      resultsEl.innerHTML = '<p class="console-thinking"><span class="think-dot"></span><span class="think-dot"></span><span class="think-dot"></span> matching against the concept inventory…</p>';
    }

    function renderResults(results) {
      resultsEl.innerHTML = '';
      results.forEach(function (r, i) {
        after(reduceMotion ? 0 : i * 150, function () {
          var card = document.createElement('div');
          card.className = 'result-card';
          card.style.animationDelay = '0ms';
          card.innerHTML =
            '<span class="rc-pct mono">' + r.pct + '</span>' +
            '<span class="rc-name font-display">' + r.name + '</span>' +
            '<span class="rc-meta mono">' + r.meta + '</span>';
          resultsEl.appendChild(card);
        });
      });
    }

    function runScenario() {
      var s = scenarios[idx % scenarios.length];
      idx++;
      chipsEl.innerHTML = '';
      resultsEl.innerHTML = '';

      typewrite(s.query, function () {
        after(420, function () {
          renderChips(s.chips);
          after(s.chips.length * 160 + 500, function () {
            renderThinking();
            after(1500, function () {
              renderResults(s.results);
              after(s.results.length * 150 + 5200, function () {
                fadeOutThen(runScenario);
              });
            });
          });
        });
      });
    }

    function fadeOutThen(cb) {
      [typeEl.parentElement, chipsEl, resultsEl].forEach(function (el) {
        el.style.transition = 'opacity .5s ease';
        el.style.opacity = '0.18';
      });
      after(550, function () {
        [typeEl.parentElement, chipsEl, resultsEl].forEach(function (el) { el.style.opacity = ''; });
        cb();
      });
    }

    function start() {
      if (running) return;
      running = true;
      runScenario();
    }
    function stop() {
      running = false;
      clearTimers();
    }

    if (!('IntersectionObserver' in window)) { start(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0.3 });
    io.observe(section);
  }

  /* ------------------------------------------------------------------ *
   * Drag-to-compare slider — pointer + keyboard accessible
   * ------------------------------------------------------------------ */
  function initCompareSlider() {
    var wrap = document.querySelector('.compare-slider');
    var handle = document.getElementById('csHandle');
    var rightPanel = wrap ? wrap.querySelector('.cs-panel--right') : null;
    if (!wrap || !handle || !rightPanel) return;

    var dragging = false;

    function setSplit(pct) {
      pct = Math.min(96, Math.max(4, pct));
      handle.style.left = pct + '%';
      rightPanel.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      handle.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
    setSplit(50);

    function pctFromEvent(clientX) {
      var rect = wrap.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function onMove(e) {
      if (!dragging) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX);
      setSplit(pctFromEvent(x));
      e.preventDefault();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('is-dragging-compare');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    function onDown(e) {
      dragging = true;
      document.body.classList.add('is-dragging-compare');
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      e.preventDefault();
    }

    handle.addEventListener('pointerdown', onDown);
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('#csHandle')) return;
      var current = parseFloat(handle.style.left) || 50;
      var target = pctFromEvent(e.clientX);
      animateSplit(current, target);
    });

    handle.addEventListener('keydown', function (e) {
      var current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft') { setSplit(current - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setSplit(current + 4); e.preventDefault(); }
      if (e.key === 'Home') { setSplit(4); e.preventDefault(); }
      if (e.key === 'End') { setSplit(96); e.preventDefault(); }
    });

    function animateSplit(from, to) {
      if (reduceMotion) { setSplit(to); return; }
      var start = null;
      var duration = 420;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        setSplit(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    // Gentle idle nudge once revealed, so the affordance reads as draggable
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var nudged = false;
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !nudged) {
            nudged = true;
            after_(900, function () { animateSplit(50, 38); });
            after_(1500, function () { animateSplit(38, 58); });
            after_(2100, function () { animateSplit(58, 50); });
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      io.observe(wrap);
    }
    function after_(ms, fn) { setTimeout(fn, ms); }
  }

  /* ------------------------------------------------------------------ *
   * Radar / character chart — renders an SVG polygon comparison from
   * data-values="a,b,c,d,e,f" (each 0–100), plus a hexagonal grid
   * ------------------------------------------------------------------ */
  function initRadarChart() {
    var svg = document.getElementById('radarChart');
    if (!svg) return;
    var cx = 120, cy = 120, radius = 86;
    var labels = ['Performance', 'Comfort', 'Efficiency', 'Tech', 'Value', 'Character'];
    var n = labels.length;
    var grid = svg.querySelector('.radar-grid');
    var labelGroup = svg.querySelector('.radar-labels');

    function pointAt(i, frac) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x: cx + Math.cos(angle) * radius * frac,
        y: cy + Math.sin(angle) * radius * frac
      };
    }

    // grid rings
    [0.33, 0.66, 1].forEach(function (frac) {
      var pts = [];
      for (var i = 0; i < n; i++) { var p = pointAt(i, frac); pts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1)); }
      var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', pts.join(' '));
      grid.appendChild(poly);
    });
    // spokes
    for (var i = 0; i < n; i++) {
      var p = pointAt(i, 1);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', p.x); line.setAttribute('y2', p.y);
      grid.appendChild(line);

      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      var lp = pointAt(i, 1.2);
      label.setAttribute('x', lp.x);
      label.setAttribute('y', lp.y);
      label.setAttribute('text-anchor', i === 0 || i === n / 2 ? 'middle' : (lp.x > cx ? 'start' : 'end'));
      label.textContent = labels[i];
      labelGroup.appendChild(label);
    }

    svg.querySelectorAll('.radar-shape').forEach(function (shape) {
      var values = (shape.getAttribute('data-values') || '').split(',').map(Number);
      var pts = values.map(function (v, i) {
        var p = pointAt(i, Math.max(0, Math.min(100, v)) / 100);
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      });
      shape.setAttribute('points', pts.join(' '));
    });
  }

  /* ------------------------------------------------------------------ *
   * Discovery journeys — horizontal cinematic scroller with controls,
   * drag-to-scroll and a progress indicator
   * ------------------------------------------------------------------ */
  function initJourneysRail() {
    var rail = document.getElementById('journeysRail');
    var prev = document.getElementById('journeyPrev');
    var next = document.getElementById('journeyNext');
    var bar = document.getElementById('journeysProgressBar');
    if (!rail) return;

    function cardWidth() {
      var card = rail.querySelector('.journey-card');
      if (!card) return rail.clientWidth * 0.8;
      var style = window.getComputedStyle(card);
      return card.getBoundingClientRect().width + parseFloat(style.marginRight || 0) + 20;
    }
    function scrollByCards(n) {
      rail.scrollBy({ left: n * cardWidth(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function updateProgress() {
      var max = rail.scrollWidth - rail.clientWidth;
      var pct = max > 0 ? (rail.scrollLeft / max) * 100 : 0;
      if (bar) bar.style.width = Math.max(12, pct) + '%';
    }

    if (prev) prev.addEventListener('click', function () { scrollByCards(-1); });
    if (next) next.addEventListener('click', function () { scrollByCards(1); });
    rail.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    // Drag-to-scroll for mouse users (touch already scrolls natively)
    var isDown = false, startX = 0, startScroll = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      isDown = true; moved = false;
      startX = e.clientX;
      startScroll = rail.scrollLeft;
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
      rail.addEventListener(evt, function () { isDown = false; });
    });
    // Prevent accidental link/card clicks right after a drag
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    rail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { scrollByCards(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { scrollByCards(-1); e.preventDefault(); }
    });
  }

  /* ------------------------------------------------------------------ *
   * Mock newsletter form — fully client-side, nothing transmitted
   * ------------------------------------------------------------------ */
  function initNewsletterForm() {
    var form = document.getElementById('ctaForm');
    var note = document.getElementById('ctaNote');
    var input = document.getElementById('ctaEmail');
    if (!form || !note || !input) return;

    var defaultText = note.textContent;
    var resetTimer = null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(resetTimer);
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());

      if (!valid) {
        note.textContent = 'That doesn’t quite look like an email — try again? (Still nothing is sent — this is a concept.)';
        note.classList.remove('is-success');
        input.focus();
        return;
      }

      note.textContent = '✓ Noted — in spirit only. This concept form stores nothing and calls no server.';
      note.classList.add('is-success');
      form.reset();
      resetTimer = setTimeout(function () {
        note.textContent = defaultText;
        note.classList.remove('is-success');
      }, 6000);
    });
  }

  /* ------------------------------------------------------------------ *
   * Back-to-top — replays the hero word/SVG reveal for a nice "loop"
   * ------------------------------------------------------------------ */
  function initBackToTop() {
    var link = document.querySelector('.back-to-top');
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var words = document.querySelectorAll('.hero-title .word-reveal');
      words.forEach(function (w) {
        w.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        w.offsetHeight;
        w.style.animation = '';
      });
    });
  }

  /* ================================================================== *
   * Below: enhancements gated on fine-pointer + motion-allowed devices
   * ================================================================== */

  /* Custom cursor — a small dot + ring that follows the pointer and
     morphs over interactive elements (data-cursor="link" | "drag") */
  function initCursor() {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    var x = 0, y = 0, rx = 0, ry = 0;
    var active = false;

    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!active) { active = true; document.body.classList.add('cursor-active'); }
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    });
    window.addEventListener('pointerdown', function () { ring.style.transform += ' scale(0.85)'; });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-active'); });

    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('pointerover', function (e) {
      var target = e.target.closest ? e.target.closest('[data-cursor]') : null;
      document.body.classList.remove('cursor-link', 'cursor-drag');
      if (target) {
        var kind = target.getAttribute('data-cursor');
        if (kind === 'link') document.body.classList.add('cursor-link');
        if (kind === 'drag') document.body.classList.add('cursor-drag');
      }
    });
  }

  /* Magnetic buttons — gently pull toward the cursor within a radius */
  function initMagnetic() {
    var els = document.querySelectorAll('[data-magnetic]');
    var radius = 70;
    els.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var pull = Math.max(0, 1 - dist / (rect.width + radius));
        el.style.transform = 'translate(' + (dx * 0.28 * pull) + 'px,' + (dy * 0.34 * pull) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* Tilt cards — subtle 3D rotation that follows the pointer */
  function initTilt() {
    var cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(function (card) {
      var raf = null;
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform =
            'perspective(900px) rotateX(' + (-py * 6) + 'deg) rotateY(' + (px * 8) + 'deg) translateY(-4px)';
        });
      });
      card.addEventListener('pointerleave', function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      });
    });
  }

  /* Hero parallax — layered elements drift opposite the cursor */
  function initHeroParallax() {
    var hero = document.getElementById('hero');
    var layers = document.querySelectorAll('[data-parallax]');
    if (!hero || !layers.length) return;

    var raf = null;
    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        layers.forEach(function (layer) {
          var depth = parseFloat(layer.getAttribute('data-parallax')) || 0.3;
          var tx = px * 36 * depth;
          var ty = py * 26 * depth;
          layer.style.transform = (layer.classList.contains('hero-silhouette') ? 'translateX(-50%) ' : '') +
            'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0)';
        });
      });
    });
    hero.addEventListener('pointerleave', function () {
      layers.forEach(function (layer) {
        layer.style.transform = layer.classList.contains('hero-silhouette') ? 'translateX(-50%)' : '';
      });
    });
  }
})();
