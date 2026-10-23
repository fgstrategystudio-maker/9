// Home: sezioni animate dallo scorrimento, come le scene del video del brand.
// "Quattro aree" disegna le linee che convergono e fa salire l'asse in bronzo;
// la citazione si accende parola per parola mentre il ritratto si apre.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var leve = document.querySelector('.leve');
  var mf = document.querySelector('.manifesto');
  if (reduce || (!leve && !mf)) return;

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var out = function (x) { return 1 - Math.pow(1 - x, 3); };
  var inOut = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var NS = 'http://www.w3.org/2000/svg';

  // Quanto della sezione fissata è stato scorso, da 0 a 1
  function progress(el) {
    var r = el.getBoundingClientRect(), span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : (r.top < 0 ? 1 : 0);
  }
  function splitWords(el) {
    var spans = [];
    (function walk(node, accent) {
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

  // ---- Quattro aree ----
  var L = null;
  if (leve) {
    leve.classList.add('live');
    var map = leve.querySelector('.leve-map');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    map.insertBefore(svg, map.firstChild);
    var mk = function (tag, cls) { var e = document.createElementNS(NS, tag); e.setAttribute('class', cls); svg.appendChild(e); return e; };
    L = {
      items: [].slice.call(map.querySelectorAll('.lv')),
      lines: [mk('path', 'lv-line'), mk('path', 'lv-line'), mk('path', 'lv-line'), mk('path', 'lv-line')],
      stem: mk('path', 'lv-stem'), dot: mk('circle', 'lv-dot'), top: mk('circle', 'lv-dot'),
      words: splitWords(leve.querySelector('h2')), lens: [], stemLen: 0
    };
    L.layout = function () {
      var b = map.getBoundingClientRect(), W = b.width, H = b.height;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var cx = W / 2, cy = H * .64, ty = H * .04;
      L.items.forEach(function (it, i) {
        // la linea parte dall'angolo del blocco rivolto verso il centro
        var r = it.getBoundingClientRect(), left = i % 2 === 0, upper = i < 2;
        var x = (left ? r.right : r.left) - b.left;
        var y = (upper ? r.bottom + 12 : r.top - 12) - b.top;
        L.lines[i].setAttribute('d', 'M' + x + ' ' + y + ' L' + cx + ' ' + cy);
        L.lens[i] = Math.hypot(cx - x, cy - y);
        L.lines[i].style.strokeDasharray = L.lens[i];
      });
      L.stem.setAttribute('d', 'M' + cx + ' ' + cy + ' L' + cx + ' ' + ty);
      L.stemLen = cy - ty;
      L.stem.style.strokeDasharray = L.stemLen;
      L.dot.setAttribute('cx', cx); L.dot.setAttribute('cy', cy);
      L.top.setAttribute('cx', cx); L.top.setAttribute('cy', ty);
    };
    L.render = function (p) {
      L.words.forEach(function (s, i) {
        var k = out(seg(p, .02 + i * .025, .2 + i * .025));
        s.style.transform = 'translateY(' + (1 - k) * 105 + '%)';
      });
      L.items.forEach(function (it, i) {
        var k = out(seg(p, .12 + i * .05, .32 + i * .05));
        it.style.opacity = k;
        it.style.transform = 'translateX(' + (i % 2 === 0 ? -1 : 1) * (1 - k) * 40 + 'px)';
        L.lines[i].style.strokeDashoffset = L.lens[i] * (1 - inOut(seg(p, .3 + i * .03, .58 + i * .03)));
      });
      L.dot.setAttribute('r', 6 * out(seg(p, .58, .64)));
      L.stem.style.strokeDashoffset = L.stemLen * (1 - out(seg(p, .62, .86)));
      L.top.setAttribute('r', 4 * out(seg(p, .84, .9)));
    };
  }

  // ---- Citazione con ritratto ----
  var M = null;
  if (mf) {
    mf.classList.add('live');
    M = { photo: mf.querySelector('.mf-photo'), img: mf.querySelector('.mf-photo img'),
          words: splitWords(mf.querySelector('.mf-quote')), sign: mf.querySelector('.mf-sign') };
    M.render = function (p) {
      var k = inOut(seg(p, 0, .35)), inset = (1 - k) * 50;
      M.photo.style.clipPath = 'inset(' + inset + '% 0 ' + inset + '% 0)';
      M.img.style.transform = 'scale(' + (1.18 - .14 * out(seg(p, 0, 1))) + ')';
      var n = M.words.length;
      M.words.forEach(function (s, i) {
        var a = .15 + (i / n) * .6;
        s.style.opacity = .16 + .84 * seg(p, a, a + .08);
      });
      var g = out(seg(p, .78, .9));
      M.sign.style.opacity = g;
      M.sign.style.transform = 'translateY(' + (1 - g) * 14 + 'px)';
    };
  }

  var queued = false;
  function frame() {
    queued = false;
    if (L) L.render(progress(leve));
    if (M) M.render(progress(mf));
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  function onResize() { if (L) L.layout(); frame(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(onResize);
  onResize();
})();
