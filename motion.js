// Home: sezione "Quattro aree" animata dallo scorrimento, come nel video del brand.
// Le aree entrano, le linee convergono al centro e sale l'asse in bronzo.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var leve = document.querySelector('.leve');
  if (reduce || !leve) return;

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var out = function (x) { return 1 - Math.pow(1 - x, 3); };
  var inOut = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var NS = 'http://www.w3.org/2000/svg';

  // Da 0 a 1: parte quando la sezione arriva a metà schermo, finisce quando smette di essere fissata
  function progress(el) {
    var r = el.getBoundingClientRect(), lead = window.innerHeight * .5;
    return clamp((lead - r.top) / (r.height - window.innerHeight + lead));
  }
  function splitWords(el) {
    var spans = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = t;
            w.appendChild(s); frag.appendChild(w); spans.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return spans;
  }

  leve.classList.add('live');
  var map = leve.querySelector('.leve-map');
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  map.insertBefore(svg, map.firstChild);
  var mk = function (tag, cls) { var e = document.createElementNS(NS, tag); e.setAttribute('class', cls); svg.appendChild(e); return e; };
  var items = [].slice.call(map.querySelectorAll('.lv'));
  var lines = items.map(function () { return mk('path', 'lv-line'); });
  var stem = mk('path', 'lv-stem'), dot = mk('circle', 'lv-dot'), top = mk('circle', 'lv-dot');
  var words = splitWords(leve.querySelector('h2'));
  var lens = [], stemLen = 0;

  function layout() {
    var b = map.getBoundingClientRect(), W = b.width, H = b.height;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var cx = W / 2, cy = H * .64, ty = H * .04;
    items.forEach(function (it, i) {
      // la linea parte dall'angolo del blocco rivolto verso il centro
      var r = it.getBoundingClientRect(), left = i % 2 === 0, upper = i < 2;
      var x = (left ? r.right : r.left) - b.left;
      var y = (upper ? r.bottom + 12 : r.top - 12) - b.top;
      lines[i].setAttribute('d', 'M' + x + ' ' + y + ' L' + cx + ' ' + cy);
      lens[i] = Math.hypot(cx - x, cy - y);
      lines[i].style.strokeDasharray = lens[i];
    });
    stem.setAttribute('d', 'M' + cx + ' ' + cy + ' L' + cx + ' ' + ty);
    stemLen = cy - ty;
    stem.style.strokeDasharray = stemLen;
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    top.setAttribute('cx', cx); top.setAttribute('cy', ty);
  }
  // Tutto si completa entro i due terzi dello scorrimento, poi resta fermo
  function render(p) {
    words.forEach(function (s, i) {
      var k = out(seg(p, i * .02, .12 + i * .02));
      s.style.transform = 'translateY(' + (1 - k) * 105 + '%)';
    });
    items.forEach(function (it, i) {
      var k = out(seg(p, .04 + i * .03, .2 + i * .03));
      it.style.opacity = k;
      it.style.transform = 'translateX(' + (i % 2 === 0 ? -1 : 1) * (1 - k) * 40 + 'px)';
      lines[i].style.strokeDashoffset = lens[i] * (1 - inOut(seg(p, .18 + i * .02, .4 + i * .02)));
    });
    dot.setAttribute('r', 6 * out(seg(p, .42, .47)));
    stem.style.strokeDashoffset = stemLen * (1 - out(seg(p, .45, .64)));
    top.setAttribute('r', 4 * out(seg(p, .62, .67)));
  }

  var queued = false;
  function frame() { queued = false; render(progress(leve)); }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  function onResize() { layout(); frame(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(onResize);
  onResize();
})();
