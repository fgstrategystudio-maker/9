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
