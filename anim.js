(function(){
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('body > header');

  // barra di avanzamento
  var bar = document.createElement('div'); bar.className='scroll-progress'; document.body.appendChild(bar);
  function onScroll(){
    if(header) header.classList.toggle('scrolled', window.scrollY > 8);
    var d = document.documentElement, sc = d.scrollHeight - d.clientHeight;
    bar.style.width = (sc > 0 ? (window.scrollY / sc * 100) : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // reveal on scroll (solo elementi sotto la piega, nessun flash)
  if(!RM && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('reveal-in'); io.unobserve(e.target); } });
    }, {threshold:0.1, rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('section').forEach(function(s){
      if(s.getBoundingClientRect().top > window.innerHeight * 0.88){ s.classList.add('reveal-init'); io.observe(s); }
    });
  }

  // hover lift su card e chip
  try{
    document.querySelectorAll('.card, #blog-grid > a, .brand-chip, .sector-chip, a[style*="border-top:1px solid var(--line-strong)"], main a[style*="border:1px solid var(--line-strong)"]').forEach(function(e){ e.classList.add('lift'); });
  }catch(e){}

  // contatori animati (statistiche home)
  if(!RM){
    var stats = document.querySelector('.home-stats');
    if(stats && 'IntersectionObserver' in window){
      var so = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ runCounters(); so.disconnect(); } });
      }, {threshold:0.4});
      so.observe(stats);
    }
  }
  function runCounters(){
    document.querySelectorAll('.home-stats > div > div:first-child').forEach(function(el){
      var m = el.textContent.trim().match(/^(\D*)(\d+)(\D*)$/); if(!m) return;
      var pre=m[1], target=parseInt(m[2],10), suf=m[3], t0=null, dur=1100;
      function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var e=1-Math.pow(1-p,3);
        el.textContent = pre + Math.round(e*target) + suf; if(p<1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }

  // menu hamburger mobile
  if(header){
    header.classList.add('site-header');
    var inner = header.firstElementChild, nav = header.querySelector('nav');
    if(inner && nav){
      nav.classList.add('site-nav');
      var btn = document.createElement('button');
      btn.className='nav-toggle'; btn.type='button';
      btn.setAttribute('aria-label','Apri il menu'); btn.setAttribute('aria-expanded','false');
      btn.innerHTML='<span></span><span></span><span></span>';
      inner.appendChild(btn);
      var bd = document.createElement('div'); bd.className='nav-backdrop'; header.appendChild(bd);
      function set(o){ header.classList.toggle('nav-open', o); btn.setAttribute('aria-expanded', o?'true':'false'); document.body.style.overflow = o?'hidden':''; }
      btn.addEventListener('click', function(){ set(!header.classList.contains('nav-open')); });
      bd.addEventListener('click', function(){ set(false); });
      nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ set(false); }); });
      document.documentElement.classList.add('js-nav');
    }
  }
})();
