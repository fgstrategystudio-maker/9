(function(){
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(pointer:fine)').matches; // mouse desktop
  var IO = 'IntersectionObserver' in window;
  var header = document.querySelector('body > header');
  var innerH = window.innerHeight;

  // ---- barra avanzamento + header sticky + parallax hero + cursor glow ----
  var bar = document.createElement('div'); bar.className='scroll-progress'; document.body.appendChild(bar);
  var heroImg = document.querySelector('.hero-photo-box img');
  var ticking=false;
  function onScroll(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      if(header) header.classList.toggle('scrolled', window.scrollY > 8);
      var d = document.documentElement, sc = d.scrollHeight - d.clientHeight;
      bar.style.width = (sc>0 ? (window.scrollY/sc*100) : 0) + '%';
      if(heroImg && !RM){ heroImg.style.transform = 'translateY(' + (window.scrollY*0.06) + 'px)'; }
      ticking=false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  if(!RM){
    // ---- aloni oro fluttuanti (sfondo ambient) ----
    var fx=document.createElement('div'); fx.className='fx-bg';
    fx.innerHTML='<div class="fx-blob b1"></div><div class="fx-blob b2"></div>';
    document.body.appendChild(fx);

    // ---- glow che segue il cursore (solo mouse) ----
    if(FINE){
      var glow=document.createElement('div'); glow.className='cursor-glow'; document.body.appendChild(glow);
      var gx=0,gy=0,cx=0,cy=0,graf=false;
      window.addEventListener('mousemove', function(e){
        gx=e.clientX; gy=e.clientY; glow.classList.add('on');
        if(!graf){ graf=true; requestAnimationFrame(function loop(){
          cx+=(gx-cx)*0.15; cy+=(gy-cy)*0.15;
          glow.style.transform='translate('+cx+'px,'+cy+'px)';
          if(Math.abs(gx-cx)>0.5||Math.abs(gy-cy)>0.5){ requestAnimationFrame(loop); } else graf=false;
        }); }
      }, {passive:true});
    }
  }

  // ---- helper: split titolo in parole (preserva em/markup) ----
  function prepWords(h){
    var words=[];
    [].slice.call(h.childNodes).forEach(function(n){
      if(n.nodeType===3){
        var parts=n.textContent.split(/(\s+)/), frag=document.createDocumentFragment();
        parts.forEach(function(p){
          if(p==='' ) return;
          if(/^\s+$/.test(p)){ frag.appendChild(document.createTextNode(p)); }
          else { var s=document.createElement('span'); s.className='word reveal-init'; s.textContent=p; frag.appendChild(s); words.push(s); }
        });
        h.replaceChild(frag,n);
      } else if(n.nodeType===1){ n.classList.add('word','reveal-init'); words.push(n); }
    });
    h.__words=words; return words;
  }

  // ---- reveal on scroll: titoli parola-per-parola, card in stagger, blocchi in fade ----
  if(!RM && IO){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var idx=0, units=e.target.__units||[e.target];
        units.forEach(function(u){
          if(u.__words){
            u.__words.forEach(function(w,j){ w.style.transitionDelay=(idx*45 + j*26)+'ms'; w.classList.add('reveal-in'); });
            idx++;
          } else {
            var d=Math.min(idx,10)*55; u.style.transitionDelay=d+'ms'; u.classList.add('reveal-in');
            var el=u; setTimeout(function(){ el.style.transitionDelay=''; }, 900+d); idx++;
          }
        });
        io.unobserve(e.target);
      });
    }, {threshold:0.06, rootMargin:'0px 0px -5% 0px'});

    document.querySelectorAll('section').forEach(function(sec){
      var wrap=sec.querySelector(':scope > div'); if(!wrap) return;
      if(sec.getBoundingClientRect().top <= innerH*0.9) return; // sopra la piega: resta visibile
      var units=[];
      [].slice.call(wrap.children).forEach(function(b){
        var st=b.getAttribute('style')||'';
        if(/grid-template-columns/.test(st) && b.children.length>=2 && b.children.length<=12){
          [].slice.call(b.children).forEach(function(c){ c.classList.add('reveal-init'); units.push(c); });
        } else if(b.matches('h1,h2')){
          prepWords(b); units.push(b);
        } else { b.classList.add('reveal-init'); units.push(b); }
      });
      sec.__units=units; io.observe(sec);
    });
  }

  // ---- hover lift + tilt 3D sulle card (solo mouse) ----
  var cards=[].slice.call(document.querySelectorAll('.card, #blog-grid > a, a[style*="border-top:1px solid var(--line-strong)"], main a[style*="border:1px solid var(--line-strong)"]'));
  cards.forEach(function(e){ e.classList.add('lift'); });
  if(FINE && !RM){
    cards.forEach(function(el){ el.classList.add('tilt');
      el.addEventListener('mousemove', function(ev){
        var r=el.getBoundingClientRect();
        var px=(ev.clientX-r.left)/r.width-0.5, py=(ev.clientY-r.top)/r.height-0.5;
        el.style.transform='perspective(760px) rotateX('+(-py*4.5)+'deg) rotateY('+(px*4.5)+'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform=''; });
    });
  }

  // ---- bottoni magnetici (solo mouse) ----
  if(FINE && !RM){
    document.querySelectorAll('a[style*="var(--cta)"], a[style*="background:var(--gold)"]').forEach(function(b){
      b.addEventListener('mousemove', function(ev){
        var r=b.getBoundingClientRect();
        var x=(ev.clientX-(r.left+r.width/2))*0.25, y=(ev.clientY-(r.top+r.height/2))*0.3;
        b.style.transform='translate('+x+'px,'+y+'px)';
      });
      b.addEventListener('mouseleave', function(){ b.style.transform=''; });
    });
  }

  // ---- contatori animati (statistiche home) ----
  if(!RM && IO){
    var stats=document.querySelector('.home-stats');
    if(stats){ var so=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ runCounters(); so.disconnect(); } }); },{threshold:0.4}); so.observe(stats); }
  }
  function runCounters(){
    document.querySelectorAll('.home-stats > div > div:first-child').forEach(function(el){
      var m=el.textContent.trim().match(/^(\D*)(\d+)(\D*)$/); if(!m) return;
      var pre=m[1], target=parseInt(m[2],10), suf=m[3], t0=null, dur=1200;
      function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1);
        var val = p<0.72 ? Math.floor(Math.random()*(target+1)) : Math.round((1-Math.pow(1-p,3))*target); // slot poi assesta
        if(p>=1) val=target;
        el.textContent=pre+val+suf; if(p<1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }

  // ---- menu hamburger mobile (senza slide al load) ----
  if(header){
    header.classList.add('site-header');
    var inner=header.firstElementChild, nav=header.querySelector('nav');
    if(inner && nav){
      nav.classList.add('site-nav');
      var tg=document.createElement('button'); tg.className='nav-toggle'; tg.type='button';
      tg.setAttribute('aria-label','Apri il menu'); tg.setAttribute('aria-expanded','false');
      tg.innerHTML='<span></span><span></span><span></span>'; inner.appendChild(tg);
      var bd=document.createElement('div'); bd.className='nav-backdrop'; header.appendChild(bd);
      function setNav(o){ header.classList.toggle('nav-open',o); tg.setAttribute('aria-expanded',o?'true':'false'); document.body.style.overflow=o?'hidden':''; }
      tg.addEventListener('click', function(){ setNav(!header.classList.contains('nav-open')); });
      bd.addEventListener('click', function(){ setNav(false); });
      nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setNav(false); }); });
      document.documentElement.classList.add('js-nav');
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ document.documentElement.classList.add('nav-ready'); }); });
    }
  }

  // ---- transizione di pagina in uscita (fade), con guardie di sicurezza ----
  if(!RM){
    document.addEventListener('click', function(ev){
      if(ev.defaultPrevented || ev.button!==0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var a=ev.target.closest && ev.target.closest('a'); if(!a) return;
      var href=a.getAttribute('href')||'';
      if(!href || href.charAt(0)==='#' || a.target==='_blank' || /^(mailto:|tel:|javascript:)/.test(href)) return;
      if(a.hostname && a.hostname!==location.hostname) return;
      if(a.hasAttribute('download')) return;
      ev.preventDefault();
      document.body.classList.add('page-out');
      var go=function(){ window.location.href=a.href; };
      setTimeout(go, 170);
      setTimeout(go, 500); // failsafe
    });
    window.addEventListener('pageshow', function(e){ if(e.persisted) document.body.classList.remove('page-out'); });
  }
})();
