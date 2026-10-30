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
  // Scorre anche con "riduci movimento" attivo (es. Windows con le animazioni di sistema spente):
  // è un movimento lento e continuo, che si ferma passando sopra con il mouse.
  document.querySelectorAll('.hero-proof-row').forEach(function (row) {
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

// Griglia clienti: "tessere che girano". Ogni tanto una tessera si gira come una carta e sul retro
// mostra il settore del cliente (e, se il sito lo dice già, una riga sul lavoro fatto); dopo qualche
// secondo torna al logo. Con "riduci movimento" attivo la tessera non ruota: dissolvenza morbida (CSS).
(function () {
  // ===== Testi del retro: UNICO punto da modificare, per tutte le lingue =====
  // Chiave = nome del cliente come appare sotto il logo; valore = [settore, riga sul lavoro (facoltativa)].
  // Un cliente senza voce qui resta fermo.
  var BACKS = {
    it: {
      "TIM": ["Telecomunicazioni"],
      "Peekaboo": ["Incubatore", "CMO e advisory marketing"],
      "L'Assistedile Group Brasil": ["Edilizia", "Export dell'edilizia italiana"],
      "L'Assistedile 2": ["Edilizia", "Edilizia innovativa e nanotecnologia"],
      "Moshe 3000": ["Joint venture italo-brasiliana"],
      "Aria Tattoo Lab": ["Tattoo & body art"],
      "Totale.one": ["Brand di consulenza"],
      "Welyk": ["Tech", "HR"],
      "Ospita.re": ["Intermediazione ricettiva"],
      "Dropper.io": ["IoT"],
      "Mangrovia.shop": ["E-commerce", "Sostenibilità"],
      "Roma Capitale": ["Pubblica amministrazione", "Advisory startup"],
      "Santaniello": ["Moda", "Brand di lusso"],
      "Torripa Group": ["Property e turismo"],
      "Liquinvex": ["Investimenti", "Vini pregiati"],
      "Cyclando": ["Cicloturismo"],
      "Crediticash.it": ["Crediti · fintech"],
      "Homever": ["Hospitality", "Marketing e sales, Roma e Milano"],
      "Edil Mec Srl": ["Edilizia"],
      "Trackting": ["Tech", "Device"],
      "Domò Sushi Roma": ["Ristorazione", "Sushi"],
      "Domò Sushi Milano": ["Ristorazione", "Sushi"],
      "Rama by Domò": ["Ristorazione"],
      "GoUp Agency": ["Agenzia di comunicazione"],
      "Grano Trattoria": ["Ristorazione"]
    },
    en: {
      "TIM": ["Telecommunications"],
      "Peekaboo": ["Incubator", "CMO and marketing advisory"],
      "L'Assistedile Group Brasil": ["Construction", "Exporting Italian construction"],
      "L'Assistedile 2": ["Construction", "Innovative building and nanotechnology"],
      "Moshe 3000": ["Italian-Brazilian joint venture"],
      "Aria Tattoo Lab": ["Tattoo & body art"],
      "Totale.one": ["Consulting brand"],
      "Welyk": ["Tech", "HR"],
      "Ospita.re": ["Hospitality brokerage"],
      "Dropper.io": ["IoT"],
      "Mangrovia.shop": ["E-commerce", "Sustainability"],
      "Roma Capitale": ["Public administration", "Startup advisory"],
      "Santaniello": ["Fashion", "Luxury brand"],
      "Torripa Group": ["Property and tourism"],
      "Liquinvex": ["Investments", "Fine wines"],
      "Cyclando": ["Cycling tourism"],
      "Crediticash.it": ["Credit · fintech"],
      "Homever": ["Hospitality", "Marketing and sales, Rome and Milan"],
      "Edil Mec Srl": ["Construction"],
      "Trackting": ["Tech", "Devices"],
      "Domò Sushi Roma": ["Restaurants", "Sushi"],
      "Domò Sushi Milano": ["Restaurants", "Sushi"],
      "Rama by Domò": ["Restaurants"],
      "GoUp Agency": ["Communication agency"],
      "Grano Trattoria": ["Restaurants"]
    },
    pt: {
      "TIM": ["Telecomunicações"],
      "Peekaboo": ["Incubadora", "CMO e advisory de marketing"],
      "L'Assistedile Group Brasil": ["Construção civil", "Exportação da construção italiana"],
      "L'Assistedile 2": ["Construção civil", "Construção inovadora e nanotecnologia"],
      "Moshe 3000": ["Joint venture ítalo-brasileira"],
      "Aria Tattoo Lab": ["Tatuagem & body art"],
      "Totale.one": ["Marca de consultoria"],
      "Welyk": ["Tecnologia", "RH"],
      "Ospita.re": ["Intermediação de hospedagem"],
      "Dropper.io": ["IoT"],
      "Mangrovia.shop": ["E-commerce", "Sustentabilidade"],
      "Roma Capitale": ["Administração pública", "Advisory para startups"],
      "Santaniello": ["Moda", "Marca de luxo"],
      "Torripa Group": ["Imóveis e turismo"],
      "Liquinvex": ["Investimentos", "Vinhos finos"],
      "Cyclando": ["Cicloturismo"],
      "Crediticash.it": ["Créditos · fintech"],
      "Homever": ["Hospitalidade", "Marketing e vendas, Roma e Milão"],
      "Edil Mec Srl": ["Construção civil"],
      "Trackting": ["Tecnologia", "Dispositivos"],
      "Domò Sushi Roma": ["Restaurantes", "Sushi"],
      "Domò Sushi Milano": ["Restaurantes", "Sushi"],
      "Rama by Domò": ["Restaurantes"],
      "GoUp Agency": ["Agência de comunicação"],
      "Grano Trattoria": ["Restaurantes"]
    },
    es: {
      "TIM": ["Telecomunicaciones"],
      "Peekaboo": ["Incubadora", "CMO y asesoría de marketing"],
      "L'Assistedile Group Brasil": ["Construcción", "Exportación de la construcción italiana"],
      "L'Assistedile 2": ["Construcción", "Construcción innovadora y nanotecnología"],
      "Moshe 3000": ["Joint venture ítalo-brasileña"],
      "Aria Tattoo Lab": ["Tatuaje & body art"],
      "Totale.one": ["Marca de consultoría"],
      "Welyk": ["Tecnología", "RR. HH."],
      "Ospita.re": ["Intermediación de alojamientos"],
      "Dropper.io": ["IoT"],
      "Mangrovia.shop": ["E-commerce", "Sostenibilidad"],
      "Roma Capitale": ["Administración pública", "Asesoría a startups"],
      "Santaniello": ["Moda", "Marca de lujo"],
      "Torripa Group": ["Inmobiliario y turismo"],
      "Liquinvex": ["Inversiones", "Vinos de calidad"],
      "Cyclando": ["Cicloturismo"],
      "Crediticash.it": ["Créditos · fintech"],
      "Homever": ["Hospitality", "Marketing y ventas, Roma y Milán"],
      "Edil Mec Srl": ["Construcción"],
      "Trackting": ["Tecnología", "Dispositivos"],
      "Domò Sushi Roma": ["Restauración", "Sushi"],
      "Domò Sushi Milano": ["Restauración", "Sushi"],
      "Rama by Domò": ["Restauración"],
      "GoUp Agency": ["Agencia de comunicación"],
      "Grano Trattoria": ["Restauración"]
    }
  };

  var grid = document.querySelector('.logos');
  if (!grid) return;
  var lang = (document.documentElement.lang || 'it').slice(0, 2).toLowerCase();
  var texts = BACKS[lang] || BACKS.it;

  // Ritmo: una nuova tessera ogni 1,2–2 s, retro visibile ~2,5–3 s, al massimo 2 girate insieme
  var GAP_MIN = 1200, GAP_MAX = 2000, SHOW_MIN = 2500, SHOW_MAX = 3000, MAX_ON = 2, TURN = 800;
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var tiles = [];
  Array.prototype.forEach.call(grid.children, function (logo) {
    if (!logo.classList.contains('logo')) return;
    var plate = logo.querySelector('.plate'), name = logo.querySelector('.plate + span');
    if (!plate || !name) return;
    var label = name.textContent.trim(), t = texts[label];
    if (!t) return;
    var inner = document.createElement('div'), front = document.createElement('div'), back = document.createElement('div');
    inner.className = 'tile-inner';
    front.className = 'tile-face tile-front';
    back.className = 'tile-face tile-back';
    back.setAttribute('aria-hidden', 'true'); // ripete il nome: gli screen reader leggono solo il fronte
    front.appendChild(plate); front.appendChild(name);
    function add(tag, cls, text) { var n = document.createElement(tag); n.className = cls; if (text) n.textContent = text; back.appendChild(n); }
    add('small', 'tile-name', label);
    add('i', 'tile-rule');
    add('b', 'tile-sector', t[0]);
    if (t[1]) add('span', 'tile-work', t[1]);
    // Il settore resta leggibile dagli screen reader come testo nascosto sul fronte
    var sr = document.createElement('span');
    sr.className = 'tile-sr';
    sr.textContent = ' · ' + t[0] + (t[1] ? ' · ' + t[1] : '');
    name.appendChild(sr);
    inner.appendChild(front); inner.appendChild(back);
    logo.appendChild(inner);
    logo.classList.add('tile');
    tiles.push({ el: logo, on: false, hover: false, timer: 0 });
  });
  if (!tiles.length) return;

  var visible = !('IntersectionObserver' in window), last = null, loop = 0;

  function flipBack(tile) { tile.on = false; tile.timer = 0; if (!tile.hover) tile.el.classList.remove('is-flipped'); }
  function step() {
    loop = 0;
    if (!visible || document.hidden) return;
    var on = tiles.filter(function (t) { return t.on; }).length;
    var pool = tiles.filter(function (t) { return !t.on && !t.hover && t !== last; });
    // Già 2 tessere girate: si riprova a breve, appena una torna al logo
    if (on >= MAX_ON || !pool.length) { loop = setTimeout(step, 250); return; }
    var tile = pool[Math.floor(Math.random() * pool.length)];
    last = tile; tile.on = true;
    tile.el.classList.add('is-flipped');
    // Il retro diventa leggibile a metà rotazione: da lì resta visibile 2,5–3 s
    tile.timer = setTimeout(function () { flipBack(tile); }, TURN / 3 + rnd(SHOW_MIN, SHOW_MAX));
    schedule();
  }
  function schedule() { if (!loop) loop = setTimeout(step, rnd(GAP_MIN, GAP_MAX)); }
  function pause() { clearTimeout(loop); loop = 0; }
  function resume() { if (visible && !document.hidden) schedule(); }

  // Mouse sopra (o focus da tastiera): la tessera si gira subito e resta girata finché ci si resta
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  tiles.forEach(function (tile) {
    function enter() { tile.hover = true; clearTimeout(tile.timer); tile.on = false; tile.el.classList.add('is-flipped'); }
    function leave() { tile.hover = false; tile.el.classList.remove('is-flipped'); }
    if (canHover) { tile.el.addEventListener('mouseenter', enter); tile.el.addEventListener('mouseleave', leave); }
    tile.el.addEventListener('focus', enter);
    tile.el.addEventListener('blur', leave);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) resume(); else pause();
    }, { threshold: 0.15 }).observe(grid);
  } else resume();
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else resume(); });
})();
