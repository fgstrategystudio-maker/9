// Animazioni delle pagine interne (stile Avorio): header in vetro, menu mobile,
// comparsa morbida dei contenuti allo scorrimento. Il contenuto è sempre
// visibile di base: l'animazione parte solo quando un elemento entra nello schermo.
(function () {
  var bar = document.querySelector('.topbar');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var btn = bar.querySelector('.tb-menu');
    if (btn) btn.addEventListener('click', function () {
      var open = bar.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
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
  // (le pagine EN/PT/ES lo tracciano già in script.js)
  if (!document.querySelector('script[src*="script.js"]')) {
    document.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function () {
        if (window.gtag) gtag('event', 'generate_lead', { form_location: location.pathname });
      });
    });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var sel = 'main h1, main h2, section h1, section h2, .blog-row, .blog-card, .service-card, .project-card, ' +
            '.inst-service-card, .audience-card, .soft-card, .compare-item, .article-cover, .home-card-cover, ' +
            'section figure, section form';
  var seen = [];
  document.querySelectorAll(sel).forEach(function (el) {
    if (el.closest('.topbar') || el.closest('#cookie-banner')) return;
    // niente animazioni annidate: se un antenato è già animato, salta
    for (var i = 0; i < seen.length; i++) if (seen[i].contains(el)) return;
    seen.push(el);
  });
  var io = new IntersectionObserver(function (entries) {
    var k = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      en.target.style.setProperty('--fx-d', Math.min(k++, 6) * 70 + 'ms');
      en.target.classList.add('fx-in');
    });
  }, { rootMargin: '0px 0px 6% 0px' });
  // ciò che è già sullo schermo all'apertura resta fermo: si anima solo il resto
  var vh = window.innerHeight;
  seen.forEach(function (el) { if (el.getBoundingClientRect().top > vh) io.observe(el); });
})();
