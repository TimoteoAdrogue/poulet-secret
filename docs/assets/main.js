(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (u, a, b) => clamp((u - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const eout = t => 1 - Math.pow(1 - t, 3);
  const back = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  // ponytail: the site's Lightspeed link (mylightspeed.app/PPKJXNGL/C-ordering/menu) answered "page not found"
  // on 3 Nov 2026 and is missing from their Linktree; paste a working ordering URL here to show every "Commander".
  const ORDER_URL = '';
  if (ORDER_URL) $$('[data-order]').forEach(a => { a.href = ORDER_URL; a.hidden = false; });

  /* ---------------------------------------------------------------- opening hours (HORAIRES story, Linktree) */
  const HOURS = { 1: [['11:30', '14:00'], ['18:00', '21:30']], 2: [['11:30', '14:00'], ['18:00', '21:30']], 3: [['11:30', '14:00'], ['18:00', '21:30']],
    4: [['11:30', '14:00'], ['18:00', '21:30']], 5: [['11:30', '14:00'], ['18:00', '22:00']], 6: [['11:30', '22:00']], 0: [['11:30', '21:30']] };
  const mins = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  function zurich() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map(p => [p.type, p.value]));
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), m: +parts.hour * 60 + +parts.minute };
  }
  function status() {
    const { day, m } = zurich();
    for (const [a, b] of HOURS[day]) if (m >= mins(a) && m < mins(b)) return { open: true, short: `Ouvert · jusqu'à ${b}`, sub: `jusqu'à ${b}`, day };
    const later = HOURS[day].find(([a]) => mins(a) > m);
    const next = later ? `ouvre à ${later[0]}` : `ouvre demain à ${HOURS[(day + 1) % 7][0][0]}`;
    return { open: false, short: `Fermé · ${next}`, sub: next, day };
  }
  function paintStatus() {
    const s = status();
    $$('[data-status]').forEach(el => { el.classList.toggle('is-open', s.open); $('.status-txt', el).textContent = s.short; });
    const neon = $('[data-neon]');
    neon.classList.toggle('is-open', s.open);
    $('.neon-word', neon).textContent = s.open ? 'Ouvert' : 'Fermé';
    $('.neon-sub', neon).textContent = s.sub;
    $$('.hours [data-days]').forEach(r => r.toggleAttribute('data-today', r.dataset.days.split(' ').includes(String(s.day))));
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------------------------------------------------------------- menu board: tabs + "en menu" prices */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(.2,.7,.2,1)';
  const tabs = $$('.tabs [role=tab]'), tabBar = $('.tabs'), pill = $('.tab-pill'), panels = $('.panels');
  const placePill = t => { pill.style.width = t.offsetWidth + 'px'; pill.style.transform = `translate(${t.offsetLeft}px,${t.offsetTop}px)`; };
  let swapping = [];
  function selectTab(t, focus) {
    const cur = tabs.find(b => b.getAttribute('aria-selected') === 'true');
    if (focus) t.focus();
    if (cur === t) return;
    swapping.forEach(a => a.finish());
    const from = $('#' + cur.getAttribute('aria-controls')), to = $('#' + t.getAttribute('aria-controls'));
    tabs.forEach(b => { const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    placePill(t);
    tabBar.scrollTo({ left: t.offsetLeft - (tabBar.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    if (reduce) { from.hidden = true; to.hidden = false; return; }
    // the old board fades out, the box eases to the new height, the new rows come in one after another
    const out = from.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 150, easing: 'ease-in' });
    swapping = [out];
    out.onfinish = () => {
      const h0 = panels.offsetHeight;
      from.hidden = true; to.hidden = false;
      const h1 = panels.offsetHeight;
      swapping = [panels.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 420, easing: ease }),
        ...$$('.bar-title, li, .note, .plus', to).map((el, i) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 460, delay: i * 32, easing: ease, fill: 'backwards' }))];
      swapping[0].onfinish = () => window.ScrollTrigger && ScrollTrigger.refresh();
    };
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  placePill(tabs[0]);
  // on wide screens the board keeps the height of its tallest tab, so switching tabs never moves the page below
  // (a moved page leaves every scroll trigger after it stale: the story pin then engages late and snaps)
  function sizePanels() {
    panels.style.minHeight = '';
    if (innerWidth < 900) return;
    const all = $$('.panel', panels), shown = all.find(p => !p.hidden);
    const max = Math.max(...all.map(p => { all.forEach(q => q.hidden = q !== p); return panels.offsetHeight; }));
    all.forEach(q => q.hidden = q !== shown);
    panels.style.minHeight = max + 'px';
  }
  sizePanels();
  addEventListener('resize', () => placePill(tabs.find(b => b.getAttribute('aria-selected') === 'true')));
  document.fonts && document.fonts.ready.then(() => { sizePanels(); placePill(tabs.find(b => b.getAttribute('aria-selected') === 'true')); window.ScrollTrigger && ScrollTrigger.refresh(); });

  // prices count to their "en menu" value instead of jumping
  const toggle = $('[data-menu-toggle]');
  $$('i[data-p]').forEach(i => { i.innerHTML = '<span class="v"></span><small>en menu</small>'; });
  function paintPrices(animate) {
    $('.board').classList.toggle('menu-on', toggle.checked);
    $$('.panel').forEach(p => {
      const plus = toggle.checked ? parseFloat(p.dataset.plus || 0) : 0;
      $$('i[data-p]', p).forEach(i => {
        const to = parseFloat(i.dataset.p) + plus, from = i._v ?? to, v = $('.v', i), tok = {};
        i._v = to; i._tok = tok;
        i.classList.toggle('is-menu', !!plus);
        if (!animate || reduce || from === to) { v.textContent = `CHF ${to.toFixed(2)}`; return; }
        const t0 = performance.now();
        const step = now => {
          if (i._tok !== tok) return;
          const k = Math.min(1, (now - t0) / 560), e = 1 - Math.pow(1 - k, 3);
          v.textContent = `CHF ${(from + (to - from) * e).toFixed(2)}`;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });
  }
  toggle.addEventListener('change', () => paintPrices(true));
  paintPrices(false);

  /* ---------------------------------------------------------------- map loads only when it is close */
  const map = $('[data-map]');
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    const f = document.createElement('iframe');
    f.src = map.dataset.map; f.title = 'Poulet Secret — Grand-Rue 8, Neuchâtel'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.addEventListener('load', () => f.classList.add('is-loaded'));
    map.append(f);
  }, { rootMargin: '600px' }).observe(map);

  // photos fade in as they arrive instead of popping
  $$('.shot img').forEach(img => { const done = () => img.classList.add('is-loaded'); img.complete ? done() : (img.addEventListener('load', done), img.addEventListener('error', done)); });

  /* ---------------------------------------------------------------- the drawing: built from code, red ink over riso fills */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.append(n); return n; };
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const f1 = n => Math.round(n * 10) / 10;
  function closed(pts) { // Catmull-Rom through the points, closed
    const n = pts.length; let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + 'Z';
  }
  function blob(cx, cy, rx, ry, n, amp, ex = 2.6) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const r = 1 + (rnd() - .5) * amp;
      pts.push([cx + Math.sign(c) * Math.pow(Math.abs(c), 2 / ex) * rx * r, cy + Math.sign(s) * Math.pow(Math.abs(s), 2 / ex) * ry * r]);
    }
    return closed(pts);
  }
  const dome = x => 416 - 154 * Math.pow(Math.max(0, 1 - Math.pow((x - 300) / 196, 2)), .62);

  // each layer: a real food texture clipped to the drawn shape, shaded for volume, then the red ink line on top
  function layer(svg, cls, d, fill, extra, tint) {
    const g = el('g', { class: 'L ' + cls }, svg);
    el('path', { class: 'fill', d, fill }, g);
    if (tint) el('path', { class: 'fill', d, fill: tint }, g);
    el('path', { class: 'fill', d, fill: 'url(#shade)' }, g);
    el('path', { class: 'ink', d, pathLength: 1 }, g);
    if (extra) el('path', { class: 'ink', d: extra, pathLength: 1 }, g);
    return g;
  }
  function textures(svg) {
    const defs = el('defs', {}, svg);
    const grad = (id, stops) => { const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs); stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); };
    grad('shade', [[0, '#fff', .32], [.35, '#fff', 0], [.7, '#000', 0], [1, '#000', .34]]);
    grad('sauce', [[0, '#FFC27A', 1], [1, '#E2702A', 1]]);
    // textures: brioche and crust from Unsplash (README credits); cheddar, bacon and pickle from the client's own Cheesy Bacon
    [['bunT', 'bun-top', 96, 255, 408, 180], ['bunB', 'bun-top', 112, 505, 376, 82], ['chk', 'chicken', 80, 430, 440, 96],
     ['baconA', 'bacon', 112, 404, 200, 56], ['baconB', 'bacon', 288, 400, 200, 56], ['pickle', 'pickle', 115, 410, 74, 20],
     ['cheese', 'cheese', 118, 250, 364, 190], ['bits', 'bits', 150, 258, 300, 90]].forEach(([id, f, x, y, w, h]) => {
      const pt = el('pattern', { id: 'tx-' + id, patternUnits: 'userSpaceOnUse', x, y, width: w, height: h }, defs);
      el('image', { href: `assets/img/tx-${f}.webp`, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, pt);
    });
  }

  function drawBurger(svg) {
    const L = {};
    textures(svg);
    el('ellipse', { class: 'contact', cx: 300, cy: 584, rx: 196, ry: 10 }, svg);
    L.bunB = layer(svg, 'bunB', 'M118 522C118 514 126 512 134 512L466 512C474 512 482 514 482 522L478 546C472 572 448 580 420 580L180 580C152 580 128 572 122 546Z', 'url(#tx-bunB)', 'M136 524L464 524', 'rgba(255,238,210,.38)');
    // the fillet: smooth when raw, craggy once fried
    L.raw = el('g', { class: 'L raw' }, svg);
    el('path', { class: 'fill', d: blob(300, 478, 198, 30, 24, .03), fill: '#F6D5C6' }, L.raw);
    el('path', { class: 'ink', d: blob(300, 478, 198, 30, 24, .03), pathLength: 1, 'stroke-dasharray': '.012 .01' }, L.raw);
    let crumbs = '';
    for (let i = 0; i < 46; i++) {
      const x = 130 + rnd() * 340, y = 462 + rnd() * 34, s = 4 + rnd() * 6;
      crumbs += `M${f1(x)} ${f1(y)}q${f1(s / 2)} ${f1(-s / 2)} ${f1(s)} 0`;
    }
    L.chk = layer(svg, 'chk', blob(300, 478, 214, 36, 58, .1), 'url(#tx-chk)', crumbs);
    L.oil = el('g', { class: 'L oil' }, svg);
    el('rect', { class: 'oil-body', x: 24, y: 470, width: 552, height: 170 }, L.oil);
    const wave = (y, a, ph) => { let d = `M28 ${y}`; for (let x = 28; x <= 572; x += 12) d += `L${x} ${f1(y + Math.sin(x / 26 + ph) * a)}`; return d; };
    el('path', { class: 'oil-line ink', d: wave(470, 4, 0), pathLength: 1 }, L.oil);
    el('path', { class: 'oil-line ink', d: wave(520, 2.5, 2), pathLength: 1, opacity: .45 }, L.oil);
    el('path', { class: 'oil-line ink', d: wave(568, 2, 4), pathLength: 1, opacity: .3 }, L.oil);
    L.bubbles = el('g', { class: 'bubbles' }, L.oil);
    for (let i = 0; i < 16; i++) {
      const c = el('circle', { class: 'bubble', cx: f1(80 + rnd() * 440), cy: f1(540 + rnd() * 70), r: f1(3 + rnd() * 6) }, L.bubbles);
      c.style.animationDelay = (-rnd() * 1.6).toFixed(2) + 's';
      c.style.animationDuration = (1.2 + rnd()).toFixed(2) + 's';
    }
    // sauce Poulet Secret along the top of the fillet, with drips
    const top = [], bot = [];
    for (let x = 108; x <= 492; x += 12) top.push([x, 444 + Math.sin(x / 19) * 3]);
    const drips = [[150, 22], [214, 30], [290, 18], [356, 34], [432, 24]];
    for (let x = 492; x >= 108; x -= 6) {
      let y = 456 + Math.sin(x / 15) * 2;
      for (const [dx, dl] of drips) y += dl * Math.exp(-Math.pow((x - dx) / 8, 2));
      bot.push([x, y]);
    }
    L.sauce = layer(svg, 'sauce', closed([...top, ...bot]), 'url(#sauce)');
    // bacon croustillant: two wavy ribbons
    L.bacon = el('g', { class: 'L bacon' }, svg);
    const ribbon = (x0, x1, yc, ph) => {
      const t = [], b = []; for (let x = x0; x <= x1; x += 10) t.push([x, yc + Math.sin(x / 17 + ph) * 6 - 7]);
      for (let x = x1; x >= x0; x -= 10) b.push([x, yc + Math.sin(x / 17 + ph) * 6 + 7]);
      let fat = `M${x0 + 8} ${yc}`; for (let x = x0 + 8; x <= x1 - 8; x += 10) fat += `L${x} ${f1(yc + Math.sin(x / 17 + ph) * 6 + 1)}`;
      return [closed([...t, ...b]), fat];
    };
    const [dA, fA] = ribbon(112, 312, 432, 0), [dB, fB] = ribbon(288, 488, 428, 1.6);
    L.baconA = layer(L.bacon, 'baconA', dA, 'url(#tx-baconA)', fA);
    L.baconB = layer(L.bacon, 'baconB', dB, 'url(#tx-baconB)', fB);
    // cornichons
    L.pickles = [];
    [[152, 420], [226, 416], [300, 421], [374, 415], [448, 420]].forEach(([x, y]) => {
      const seeds = `M${x - 10} ${y}l1 0M${x + 2} ${y - 2}l1 0M${x + 12} ${y + 1}l1 0`;
      L.pickles.push(layer(svg, 'pickle', `M${x - 36} ${y}a36 9 0 1 0 72 0a36 9 0 1 0 -72 0Z`, 'url(#tx-pickle)', `M${x - 26} ${y}a26 5.5 0 1 0 52 0a26 5.5 0 1 0 -52 0` + seeds));
    });
    L.bunT = layer(svg, 'bunT', 'M104 416C100 330 180 266 300 262C420 266 500 330 496 416C420 430 180 430 104 416Z', 'url(#tx-bunT)', 'M168 322C196 294 236 282 268 280', 'rgba(255,214,150,.22)');
    // Melty Cheddar nappé sur le dessus
    const ct = [], cb = [];
    for (let x = 124; x <= 476; x += 8) ct.push([x, dome(x) - 5]);
    const cd = [[146, 46], [196, 30], [252, 58], [318, 36], [372, 64], [430, 40], [466, 26]];
    for (let x = 476; x >= 124; x -= 4) {
      let y = dome(x) + 18;
      for (const [dx, dl] of cd) y += dl * Math.exp(-Math.pow((x - dx) / 9, 2));
      cb.push([x, y]);
    }
    L.cheese = layer(svg, 'cheese', closed([...ct, ...cb]), 'url(#tx-cheese)');
    // éclats de bacon
    L.bits = [];
    for (let i = 0; i < 20; i++) {
      const x = 150 + rnd() * 300, y = dome(x) + 4 + rnd() * 22, s = 6 + rnd() * 6, a = rnd() * Math.PI;
      const pts = [0, 1, 2, 3].map(k => { const t = a + k * Math.PI / 2 + (rnd() - .5) * .6, r = s * (.6 + rnd() * .5); return [x + Math.cos(t) * r, y + Math.sin(t) * r * .7]; });
      L.bits.push(layer(svg, 'bit', `M${pts.map(p => p.map(f1).join(' ')).join('L')}Z`, 'url(#tx-bits)'));
    }
    return L;
  }

  /* ---------------------------------------------------------------- motion (skipped for reduced motion: the static layout is the page) */
  if (reduce || !window.gsap || !window.ScrollTrigger) { $$('.star').forEach(s => s.classList.add('is-in')); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.addEventListener('refreshInit', sizePanels);
  document.documentElement.classList.add('motion');

  const lenis = window.Lenis ? new Lenis({ lerp: .11, smoothWheel: true }) : null;
  if (lenis) {
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    // Lenis caches the page height; a ScrollTrigger refresh briefly removes the pins, so re-measure after it
    // (otherwise Lenis later clamps the scroll to the short page: a deep link to #lieu ended 8600 px early)
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // short moves glide, with a duration that follows the distance; long ones pass behind a red curtain,
  // so a click never fast-forwards through 6000 px of pinned animation
  const curtain = $('.curtain');
  const nowY = () => lenis ? lenis.scroll : scrollY;
  let holdBar = 0; // the bar stays put during a scroll the visitor asked for
  const glide = y => {
    const d = clamp(Math.abs(y - nowY()) / 1600, .6, 1.8);
    holdBar = performance.now() + d * 1000 + 300;
    lenis ? lenis.scrollTo(y, { duration: d, easing: eio }) : window.scrollTo({ top: y, behavior: 'smooth' });
  };
  function jump(t) {
    const y = t === document.body ? 0 : t.getBoundingClientRect().top + nowY();
    if (Math.abs(y - nowY()) < innerHeight * 1.8) return glide(y);
    holdBar = performance.now() + 1600;
    gsap.timeline()
      .fromTo(curtain, { clipPath: 'inset(100% 0 0% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: .5, ease: 'power3.inOut' })
      .fromTo(curtain.firstChild, { scale: .8, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: 'power3.out' }, .15)
      .add(() => { lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); ScrollTrigger.update(); })
      .to(curtain, { clipPath: 'inset(0% 0 100% 0)', duration: .6, ease: 'power3.inOut' }, '+=.12')
      .to(curtain.firstChild, { scale: 1.1, opacity: 0, duration: .35, ease: 'power2.in' }, '<');
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = a.getAttribute('href') === '#top' ? document.body : $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    jump(t);
  }));

  const mobile = () => innerWidth < 900;

  /* HERO: zoom through the chicken's body (its deepest point, tools/pole.py) until the shop fills the screen */
  const veil = $('.hero-veil'), holeG = $('.hole-g'), rimG = $('.rim-g'), photo = $('.hero-photo'), copy = $('.hero-copy'), making = $('.making'), cue = $('.scroll-cue');
  const F = { x: 846, y: 1186 }, S_MAX = 12;
  let G = {};
  function heroGeo() {
    const vw = innerWidth, vh = innerHeight, m = mobile();
    const h0 = m ? vh * .39 : vh * .9, k = h0 / 2200, w0 = 1824 * k;
    const cx = m ? vw * .5 : vw * .735, top = m ? vh * .08 : (vh - h0) / 2 + vh * .03;
    veil.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    const crustH = 1500 * Math.max(vw / 1800, vh / 2400); // the crust area of hero-chicken.webp, at cover size
    G = { vw, vh, m, k, fs0: { x: cx - w0 / 2 + k * F.x, y: top + k * F.y }, pc: { x: cx - vw / 2, y: top + h0 / 2 - vh / 2 }, k0: Math.max(h0 * 1.05 / crustH, h0 * 1.06 / vh, w0 * 1.06 / vw) };
  }
  function heroAt(p) {
    const z = eio(seg(p, .04, .86)), s = Math.exp(Math.log(S_MAX) * z), c = eio(seg(p, .2, .86));
    const fx = lerp(G.fs0.x, G.vw / 2, c), fy = lerp(G.fs0.y, G.vh / 2, c), a = G.k * s;
    const m = `matrix(${a} 0 0 ${a} ${fx - a * F.x} ${fy - a * F.y})`;
    holeG.setAttribute('transform', m);
    rimG.setAttribute('transform', m);
    rimG.style.opacity = 1 - seg(p, .02, .2);
    rimG.style.visibility = p > .2 ? 'hidden' : '';
    // the photo reaches full cover before the hole outgrows it, then keeps pushing in slowly
    const pz = eio(seg(p, .03, .5));
    photo.style.transform = `translate3d(${G.pc.x * (1 - pz)}px,${G.pc.y * (1 - pz)}px,0) scale(${lerp(G.k0, 1, pz) * lerp(1, 1.08, seg(p, .5, 1))})`;
    const o = seg(p, 0, .22);
    copy.style.opacity = 1 - o;
    copy.style.translate = `${-60 * eout(o)}px 0`;
    cue.style.opacity = 1 - seg(p, 0, .05);
  }
  heroGeo(); heroAt(0);
  // the copy enters once on load
  gsap.from('.hero-title .l', { yPercent: 60, opacity: 0, duration: 1.1, stagger: .09, ease: 'expo.out', delay: .15 });
  gsap.from(['.hero-copy .eyebrow', '.hero-sub', '.hero-copy .ctas', '.hero-tags'], { y: 24, opacity: 0, duration: .9, stagger: .07, ease: 'power3.out', delay: .45 });

  /* LE SECRET DU MOIS: one progress value drives every layer, so jumps and reversals stay exact */
  const flash = $('.flash'), build = $('.build'), svg = $('.build-svg'), bphoto = $('.build-photo'), steps = $$('.step'), reveal = $('.reveal'), rail = $('.rail'), railB = $$('.rail button'), redact = $('.redact');
  const L = drawBurger(svg);
  const UNITS = 9, STARTS = [.15, 1.8, 2.8, 3.8, 4.8, 5.8, 6.8, 7.85];
  const move = (g, y, r = 0, s = 1, ox = 300, oy = 480) => g.setAttribute('transform', `translate(0 ${f1(y)}) rotate(${f1(r)} ${ox} ${oy}) translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})`);
  const draw = (g, d) => {
    $$('.ink', g).forEach(p => { p.style.strokeDashoffset = 1 - d; });
    $$('.fill', g).forEach(p => { p.style.opacity = seg(d, .35, 1); });
    g.style.opacity = d > 0 ? 1 : 0;
  };
  function makingAt(u) {
    // 01 poulet frit: raw fillet into the oil, crust forms, lifted out, oil drains
    const oilIn = seg(u, 0, .45), drain = seg(u, 1.4, 1.85);
    draw(L.oil, oilIn);
    L.oil.style.opacity = oilIn * (1 - drain);
    L.oil.setAttribute('transform', `translate(0 ${f1(eio(drain) * 180)})`);
    const dropIn = eout(seg(u, .2, .6)), dip = eio(seg(u, .6, 1)), lift = eio(seg(u, 1.35, 1.75));
    const fy = lerp(-330, -40, dropIn) + 76 * dip - 36 * lift;
    move(L.raw, fy); draw(L.raw, seg(u, .2, .5)); L.raw.style.opacity = (u > .2 ? 1 : 0) * (1 - seg(u, 1, 1.3));
    move(L.chk, fy); draw(L.chk, eio(seg(u, 1, 1.4)));
    // 02 pain brioché: bottom rises under, top waits above
    move(L.bunB, 260 * (1 - eout(seg(u, 1.85, 2.35)))); draw(L.bunB, seg(u, 1.85, 2.3));
    svg.style.setProperty('--contact', seg(u, 2.05, 2.35).toFixed(3));
    const topIn = back(seg(u, 2.1, 2.6)), topLand = eio(seg(u, 5.85, 6.2));
    move(L.bunT, lerp(lerp(-480, -176, topIn), 0, topLand)); draw(L.bunT, seg(u, 2.1, 2.5));
    // 03 sauce Poulet Secret, and the redaction bar
    draw(L.sauce, eio(seg(u, 2.9, 3.5)));
    redact.style.setProperty('--r', eio(seg(u, 3.15, 3.55)).toFixed(3));
    // 04 bacon, 05 cornichons
    move(L.baconA, -320 * (1 - back(seg(u, 3.9, 4.35))), -8 * (1 - seg(u, 3.9, 4.35))); draw(L.baconA, seg(u, 3.9, 4.25));
    move(L.baconB, -320 * (1 - back(seg(u, 4.05, 4.5))), 7 * (1 - seg(u, 4.05, 4.5))); draw(L.baconB, seg(u, 4.05, 4.4));
    L.pickles.forEach((g, i) => { const t = seg(u, 4.9 + i * .1, 5.3 + i * .1); move(g, -300 * (1 - back(t))); draw(g, t); });
    // 06 cheddar poured over the closed bun, 07 the bacon bits
    move(L.cheese, -14 * (1 - eout(seg(u, 6.15, 6.75)))); draw(L.cheese, eio(seg(u, 6.15, 6.75)));
    L.bits.forEach((g, i) => { const t = seg(u, 6.9 + i * .035, 7.15 + i * .035); move(g, -50 * (1 - eout(t)), 0, back(t) || .001, 300, 300); draw(g, t); });
    // reveal: the drawing turns into the real burger
    const rv = eio(seg(u, 7.85, 8.45)), fl = seg(u, 7.95, 8.45);
    svg.style.setProperty('--ink', (1 - seg(u, 7.8, 8.02)).toFixed(3));
    flash.style.opacity = Math.sin(Math.PI * fl).toFixed(3);
    svg.style.opacity = 1 - seg(u, 8.14, 8.24);
    bphoto.style.opacity = seg(u, 8.16, 8.26);
    bphoto.style.transform = `scale(${lerp(1.05, 1, eout(seg(u, 8.16, 8.6)))})`;
    build.style.scale = mobile() ? lerp(1, .66, rv) : '';
    const cur = STARTS.findLastIndex(s => u >= s) + 1;
    steps.forEach((s, i) => { s.classList.toggle('is-on', cur === i + 1); s.classList.toggle('is-past', cur > i + 1); });
    reveal.classList.toggle('is-on', cur === 8);
    railB.forEach((b, i) => b.classList.toggle('is-on', cur === i + 1));
    rail.classList.toggle('is-off', cur === 8);
  }
  makingAt(0);

  /* one pin for both scenes, in screen heights: dive 0-1.3, the tray paper slides up 1.1-1.6, the build from 1.45 */
  const DIVE = 1.3, BUILD = 1.45, UNIT = .62, TOTAL = BUILD + UNITS * UNIT;
  function introAt(v) {
    heroAt(seg(v, 0, DIVE));
    making.style.transform = `translate3d(0,calc(${(1 - eout(seg(v, 1.1, 1.6))) * 100}% + ${(1 - eout(seg(v, 1.1, 1.6))) * 30}px),0)`;
    makingAt(clamp((v - BUILD) / UNIT, 0, UNITS));
  }
  const intro = ScrollTrigger.create({ trigger: '.intro', start: 'top top', end: `+=${TOTAL * 100}%`, pin: '.intro-pin', scrub: true,
    onUpdate: s => introAt(s.progress * TOTAL), onRefresh: s => { heroGeo(); introAt(s.progress * TOTAL); } });
  const MIDS = [1.2, 2.4, 3.45, 4.5, 5.45, 6.55, 7.45];
  railB.forEach((b, i) => b.addEventListener('click', () => glide(intro.start + (BUILD + MIDS[i] * UNIT) / TOTAL * (intro.end - intro.start))));

  /* STORY: the festival road scrolls sideways on wide screens */
  const mmq = gsap.matchMedia();
  mmq.add('(min-width: 900px)', () => {
    const track = $('.story .track');
    const dist = () => track.scrollWidth - innerWidth;
    // a short hold on the story text before the road starts moving, and on the last panel before it leaves
    gsap.timeline({ scrollTrigger: { trigger: '.story-pin', start: 'top top', end: () => '+=' + dist() * 1.3, pin: true, scrub: true, invalidateOnRefresh: true } })
      .to(track, { x: () => -dist(), ease: 'power1.inOut', duration: 1 }, .15)
      .to({}, { duration: .15 });
  });

  /* one-shot reveals; ScrollTrigger (not an IntersectionObserver) so a jump past them still fires */
  $$('.star').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 80%', once: true, onEnter: () => s.classList.add('is-in') }));
  ScrollTrigger.create({ trigger: '[data-neon]', start: 'top 70%', once: true, onEnter: () => $('[data-neon]').classList.add('flick') });

  /* MENU BOARD: the screen lights up line by line as it scrolls in */
  const tvIn = $('.tv-inner');
  ScrollTrigger.create({ trigger: tvIn, start: 'top 92%', end: 'top 12%', scrub: true, onUpdate: s => {
    tvIn.style.setProperty('--scan', s.progress.toFixed(4));
    tvIn.style.setProperty('--beam', s.progress > .001 && s.progress < .999 ? 1 : 0);
  }, onRefresh: s => tvIn.style.setProperty('--scan', s.progress.toFixed(4)) });

  /* HANDOVERS: while a section comes in, the one it covers lags behind and dims (CSS reads --ho) */
  [['.making', '.stars'], ['.stars', '.board'], ['.board', '.story'], ['.story', '.visit'], ['.visit', '.contact'], ['.contact', '.foot']].forEach(([a, b]) => {
    const out = $(a);
    ScrollTrigger.create({ trigger: b, start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: s => out.style.setProperty('--ho', eio(s.progress).toFixed(4)), onLeaveBack: () => out.style.setProperty('--ho', 0) });
  });

  /* each block rises in with the scroll (scrubbed, so a jump or a reversal always shows the right state) */
  $$('[data-rise]').forEach(el => gsap.fromTo(el, { y: 70, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 97%', end: 'top 64%', scrub: true } }));

  /* festival names marquee, faster with scroll speed */
  const row = $('.marquee-row');
  row.append(...[...row.children].map(n => n.cloneNode(true)));
  let mx = 0, vel = 0;
  gsap.ticker.add(() => {
    vel = lerp(vel, lenis ? Math.abs(lenis.velocity) : 0, .1);
    mx -= .6 + vel * .25;
    const half = row.scrollWidth / 2;
    if (-mx > half) mx += half;
    row.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* bar + dock: solid after the hero, bar tucks away while scrolling down */
  const bar = $('.bar'), dock = $('.dock');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY, past = y > innerHeight * 1.4;
    bar.classList.toggle('is-solid', past);
    if (performance.now() > holdBar) bar.classList.toggle('is-away', past && y > lastY + 2 && !mobile());
    else bar.classList.remove('is-away');
    dock.classList.toggle('is-on', past);
    lastY = y;
  }, { passive: true });

  // deep links (/#menu): the browser jumps before the pins add their height, so land again once they exist
  addEventListener('load', () => {
    ScrollTrigger.refresh();
    const t = location.hash && $(location.hash);
    if (t) lenis ? lenis.scrollTo(t, { immediate: true, force: true }) : t.scrollIntoView();
  });
})();
