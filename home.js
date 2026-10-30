// Home francescogizzi.com: nav in vetro, comparse allo scorrimento, contatori.
(function () {
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var menu = nav.querySelector('.nav-menu');
    if (menu) {
      menu.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.querySelectorAll('.nav-panel a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); });
      });
    }
  }

  // Menu Servizi: apertura al clic (tastiera e touch), chiusura con Esc o clic fuori
  document.querySelectorAll('.has-mega').forEach(function (m) {
    var t = m.querySelector('.mega-trigger');
    t.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = !m.classList.contains('open');
      document.querySelectorAll('.has-mega.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('.mega-trigger').setAttribute('aria-expanded', 'false'); });
      m.classList.toggle('open', open); t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    m.addEventListener('mouseleave', function () { m.classList.remove('open'); t.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('click', function (ev) {
    document.querySelectorAll('.has-mega.open').forEach(function (m) { if (!m.contains(ev.target)) { m.classList.remove('open'); m.querySelector('.mega-trigger').setAttribute('aria-expanded', 'false'); } });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    document.querySelectorAll('.has-mega.open').forEach(function (m) { m.classList.remove('open'); var t = m.querySelector('.mega-trigger'); t.setAttribute('aria-expanded', 'false'); t.focus(); });
  });

  // Richiesta inviata dal modulo: evento "generate_lead" per Google Analytics
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function () {
      if (window.gtag) gtag('event', 'generate_lead', { form_location: location.pathname });
    });
  });

  // Loghi: comparsa a cascata riga per riga
  document.querySelectorAll('.logo').forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--d', (i % 6) * 60 + 'ms');
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Striscia dei marchi: scorrimento continuo da destra a sinistra a velocità costante.
  // I marchi si ripetono finché la riga è più larga dello schermo, poi la serie viene
  // duplicata (copia nascosta agli screen reader) e il CSS la sposta di metà: il giro è senza scatti.
  if (!reduce) document.querySelectorAll('.hero-proof-row').forEach(function (row) {
    var items = Array.prototype.slice.call(row.children);
    if (!items.length) return;
    var track = document.createElement('div'), group = document.createElement('div');
    track.className = 'marquee-track'; group.className = 'marquee-group';
    items.forEach(function (el) { group.appendChild(el); });
    track.appendChild(group); row.appendChild(track); row.classList.add('is-marquee');
    var lastW = 0, SPEED = 40; // pixel al secondo
    function mute(n) { n.setAttribute('aria-hidden', 'true'); if (n.tagName === 'IMG') n.alt = ''; n.querySelectorAll('img').forEach(function (i) { i.alt = ''; }); return n; }
    function build() {
      var w = row.clientWidth;
      if (!w || w === lastW) return;
      lastW = w;
      while (track.children.length > 1) track.removeChild(track.lastChild);
      group.querySelectorAll('[data-rep]').forEach(function (n) { n.remove(); });
      for (var k = 0; group.getBoundingClientRect().width < w && k < 6; k++) {
        items.forEach(function (el) { var c = mute(el.cloneNode(true)); c.setAttribute('data-rep', ''); group.appendChild(c); });
      }
      track.appendChild(mute(group.cloneNode(true)));
      track.style.setProperty('--marquee-dur', (group.getBoundingClientRect().width / SPEED).toFixed(2) + 's');
    }
    build();
    window.addEventListener('load', function () { lastW = 0; build(); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); }, { passive: true });
  });

  if (reduce || !('IntersectionObserver' in window)) return;

  // Il valore finale è già nell'HTML: si riparte da 0 solo quando il numero entra nello schermo
  function countUp(el) {
    var to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      io.unobserve(el);
      if (el.dataset.count) countUp(el);
      else el.classList.add('in');
    });
  }, { rootMargin: '0px 0px 8% 0px' });
  document.querySelectorAll('.reveal, .reveal-only, [data-count]').forEach(function (el) { io.observe(el); });
})();
