// ── Language switcher: highlight active lang + smart links ──
(function(){
  var path = window.location.pathname;
  var lang = 'it';
  if(path.startsWith('/en')) lang = 'en';
  else if(path.startsWith('/pt')) lang = 'pt';

  // Highlight active language
  document.querySelectorAll('.lang-sw a').forEach(function(a){
    var href = a.getAttribute('href');
    if((lang==='it' && href==='/') ||
       (lang==='en' && href==='/en/') ||
       (lang==='pt' && href==='/pt/')){
      a.classList.add('active');
    }
  });

  // Make switcher links point to same page in other language
  // Use (\/|$) so /en (no trailing slash, Vercel trailingSlash:false) is also stripped
  var page = path.replace(/^\/(en|pt)(\/|$)/, '/') || '/';
  document.querySelectorAll('.lang-sw a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href==='/') a.setAttribute('href', page === '/' ? '/' : page);
    else if(href==='/en/') a.setAttribute('href', page === '/' ? '/en' : '/en' + page);
    else if(href==='/pt/') a.setAttribute('href', page === '/' ? '/pt' : '/pt' + page);
  });


  // Preserve scroll position across language switches
  var savedScroll = sessionStorage.getItem('langScrollPos');
  if(savedScroll !== null){
    sessionStorage.removeItem('langScrollPos');
    window.addEventListener('load', function(){
      window.scrollTo(0, parseInt(savedScroll, 10));
    });
  }
  document.querySelectorAll('.lang-sw a').forEach(function(a){
    a.addEventListener('click', function(){
      sessionStorage.setItem('langScrollPos', window.scrollY);
    });
  });
})();

document.addEventListener("DOMContentLoaded", function () {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".site-header");
  if (!button || !nav || !header) return;

  function closeMenu() {
    nav.classList.remove("is-open");
    header.classList.remove("nav-open");
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", function () {
    const isOpen = nav.classList.toggle("is-open");
    header.classList.toggle("nav-open", isOpen);
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach(function (link) {
    if (!link.classList.contains("nav-dropdown-toggle")) {
      link.addEventListener("click", closeMenu);
    }
  });

  // Dropdown: hover desktop con delay per permettere di raggiungere le opzioni
  nav.querySelectorAll(".has-dropdown").forEach(function (item) {
    const toggle = item.querySelector(".nav-dropdown-toggle");
    if (!toggle) return;
    let closeTimer = null;

    // Desktop: hover con delay
    item.addEventListener("mouseenter", function () {
      if (window.innerWidth > 680) {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        item.classList.add("is-hovering");
      }
    });
    item.addEventListener("mouseleave", function () {
      if (window.innerWidth > 680) {
        closeTimer = setTimeout(function () {
          item.classList.remove("is-hovering");
        }, 180);
      }
    });

    // Mobile: click toggle
    toggle.addEventListener("click", function (e) {
      if (window.innerWidth <= 680) {
        e.preventDefault();
        item.classList.toggle("is-open");
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!header.contains(event.target)) closeMenu();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 680) closeMenu();
  });
});

// ── 1. Scroll reveal ──
document.addEventListener("DOMContentLoaded", function () {
  var revealSelectors = [
    ".section-title", "section h2", ".page-hero h1", ".page-hero p",
    ".service-card", ".project-row", ".blog-card", ".compare-card",
    ".blog-row", ".metrics", ".logo-marquee-header", ".precontact-box",
    ".lead-form-wrap", ".rich p", ".feature", ".soft-card"
  ].join(",");

  var els = document.querySelectorAll(revealSelectors);
  els.forEach(function (el) {
    // Non applicare nell'hero e nei caroselli orizzontali (evita movimento verticale su mobile)
    if (el.closest(".hero")) return;
    if (el.closest(".services-grid") || el.closest(".projects") ||
        el.closest("#blogHomeTrack") || el.closest(".logo-marquee")) return;
    el.classList.add("reveal");
    // Stagger per elementi fratelli nella stessa griglia
    var parent = el.parentNode;
    var revealSiblings = Array.from(parent.children).filter(function (c) {
      return c.classList.contains("reveal");
    });
    var idx = revealSiblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = (idx * 0.09) + "s";
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -32px 0px" });

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });
});

// ── 2. Counter animato per le metriche ──
document.addEventListener("DOMContentLoaded", function () {
  function animateCounter(el) {
    var raw = el.textContent.trim();
    var prefix = raw.startsWith("+") ? "+" : "";
    var suffix = raw.endsWith("+") ? "+" : "";
    var target = parseInt(raw.replace(/\D/g, ""), 10);
    if (!target) return;
    var duration = 1400;
    var startTs = null;
    function step(ts) {
      if (!startTs) startTs = ts;
      var p = Math.min((ts - startTs) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.floor(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll(".metric-value").forEach(function (el) {
    counterObserver.observe(el);
  });
});

// Pagination dots per caroselli mobile (progetti e servizi)
document.addEventListener("DOMContentLoaded", function () {
  function initDots(container, childSelector) {
    if (!container) return;
    var cards = container.querySelectorAll(childSelector);
    if (cards.length < 2) return;

    var wrap = document.createElement("div");
    wrap.className = "carousel-dots";
    var dots = [];
    cards.forEach(function (_, i) {
      var d = document.createElement("button");
      d.className = "carousel-dot" + (i === 0 ? " active" : "");
      d.setAttribute("aria-label", "Elemento " + (i + 1));
      d.addEventListener("click", function () {
        container.scrollTo({ left: cards[i].offsetLeft, behavior: "smooth" });
      });
      dots.push(d);
      wrap.appendChild(d);
    });
    container.parentNode.insertBefore(wrap, container.nextSibling);

    container.addEventListener("scroll", function () {
      var cardW = cards[0].offsetWidth + 14;
      var idx = Math.min(cards.length - 1, Math.round(container.scrollLeft / cardW));
      dots.forEach(function (d, i) { d.classList.toggle("active", i === idx); });
    }, { passive: true });
  }

  initDots(document.querySelector(".projects"), ".project-row");
  initDots(document.querySelector(".services-grid"), ".service-card");
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('form').forEach(function (form) {
    const nextInput = form.querySelector('input[data-next-target="grazie"]');
    if (nextInput) nextInput.value = window.location.origin + '/grazie.html';
  });
});

// Logo marquee: auto-scroll JS (funziona su tutti i dispositivi, swipe su mobile)
document.addEventListener("DOMContentLoaded", function () {
  var marquee = document.querySelector('.logo-marquee');
  if (!marquee) return;

  var speed = 1.1; // px per frame (~66px/s a 60fps, simile all'animazione CSS originale)
  var paused = false;

  function step() {
    if (!paused) {
      marquee.scrollLeft += speed;
      // Loop senza stacco: quando raggiungi la metà (i duplicati), torna all'inizio
      if (marquee.scrollLeft >= marquee.scrollWidth / 2) {
        marquee.scrollLeft -= marquee.scrollWidth / 2;
      }
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  // Desktop: pausa su hover
  marquee.addEventListener('mouseenter', function () { paused = true; });
  marquee.addEventListener('mouseleave', function () { paused = false; });

  // Mobile: pausa su touch, riprende 1s dopo
  marquee.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  marquee.addEventListener('touchend', function () {
    setTimeout(function () { paused = false; }, 1000);
  }, { passive: true });
  // Mantieni il loop anche durante lo scroll manuale
  marquee.addEventListener('scroll', function () {
    if (marquee.scrollLeft >= marquee.scrollWidth / 2) {
      marquee.scrollLeft -= marquee.scrollWidth / 2;
    }
    if (marquee.scrollLeft < 0) {
      marquee.scrollLeft += marquee.scrollWidth / 2;
    }
  }, { passive: true });
});

// ── Hero H1 split-text word reveal ──
document.addEventListener("DOMContentLoaded", function () {
  var h1 = document.querySelector(".hero h1");
  if (!h1) return;
  var words = h1.textContent.trim().split(/\s+/);
  h1.innerHTML = words.map(function (w, i) {
    return '<span class="word" style="opacity:0;transform:translateY(14px) scale(.97);transition:opacity .55s cubic-bezier(.22,1,.36,1) ' + (0.08 + i * 0.055) + 's,transform .55s cubic-bezier(.22,1,.36,1) ' + (0.08 + i * 0.055) + 's">' + w + '</span>';
  }).join(' ');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      h1.querySelectorAll(".word").forEach(function (w) {
        w.style.opacity = "1";
        w.style.transform = "translateY(0) scale(1)";
      });
    });
  });
});

// ── Magnetic buttons ──
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".btn.primary").forEach(function (btn) {
    btn.addEventListener("mousemove", function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = "translate(" + (x * 0.22) + "px," + (y * 0.28) + "px)";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.transform = "";
    });
  });
});

// ── Hero image parallax ──
document.addEventListener("DOMContentLoaded", function () {
  var heroPhoto = document.querySelector(".hero .hero-photo");
  if (!heroPhoto) return;
  window.addEventListener("scroll", function () {
    heroPhoto.style.transform = "translateY(" + (window.scrollY * 0.12) + "px)";
  }, { passive: true });
});

// Blog filtri categoria
document.addEventListener("DOMContentLoaded", function () {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".blog-card, .blog-featured, .blog-row");
  if (!filterBtns.length) return;

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      cards.forEach(function (card) {
        if (filter === "tutti" || card.dataset.category === filter) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
});

// Sidebar articoli correlati
document.addEventListener("DOMContentLoaded", function () {
  var articleEl = document.querySelector(".container.article");
  if (!articleEl) return;
  var currentFile = location.pathname.split("/").pop() || "";
  if (!currentFile.startsWith("blog-") || currentFile === "blog.html") return;

  var arts = [
    {c:"Marketing",f:"blog-consulenza-marketing-per-aziende-che-vogliono-crescere-meglio.html",t:"Consulenza marketing per aziende che vogliono crescere davvero"},
    {c:"Marketing",f:"blog-audit-marketing-per-capire-cosa-sta-bloccando-la-crescita.html",t:"Audit marketing per capire cosa sta bloccando la crescita"},
    {c:"Marketing",f:"blog-come-costruire-un-marketing-piu-chiaro-misurabile-e-sostenibile.html",t:"Come costruire un marketing più chiaro, misurabile e sostenibile"},
    {c:"Marketing",f:"blog-consulente-marketing-per-posizionamento-acquisition-ed-execution.html",t:"Consulente marketing per posizionamento, acquisition ed execution"},
    {c:"Marketing",f:"blog-strategia-marketing-per-pmi-e-aziende-in-fase-di-crescita.html",t:"Strategia marketing per PMI e aziende in fase di crescita"},
    {c:"Data",f:"blog-kpi-e-dashboard-per-aziende-che-vogliono-decidere-meglio.html",t:"KPI e dashboard per aziende che vogliono decidere meglio"},
    {c:"Data",f:"blog-tracking-dashboard-e-reportistica-per-aziende-in-crescita.html",t:"Tracking, dashboard e reportistica per aziende in crescita"},
    {c:"Data",f:"blog-dati-e-reporting-per-una-crescita-piu-leggibile-e-sostenibile.html",t:"Dati e reporting per una crescita più leggibile e sostenibile"},
    {c:"Data",f:"blog-consulenza-data-driven-per-kpi-dashboard-e-decisioni-migliori.html",t:"Consulenza data driven per KPI, dashboard e decisioni migliori"},
    {c:"Data",f:"blog-come-leggere-i-kpi-giusti-senza-fare-reporting-inutile.html",t:"Come leggere i KPI giusti senza fare reporting inutile"},
    {c:"Sales",f:"blog-business-development-e-sales-strategy-per-la-crescita-aziendale.html",t:"Business development e sales strategy per la crescita aziendale"},
    {c:"Sales",f:"blog-come-migliorare-vendite-e-conversione-in-aziende-b2b.html",t:"Come migliorare vendite e conversione in aziende B2B"},
    {c:"Sales",f:"blog-come-strutturare-un-processo-sales-piu-chiaro-e-piu-efficace.html",t:"Come strutturare un processo sales più chiaro e più efficace"},
    {c:"Sales",f:"blog-consulenza-sales-per-migliorare-pipeline-conversione-e-processo-commerciale.html",t:"Consulenza sales per migliorare pipeline, conversione e processo commerciale"},
    {c:"Sales",f:"blog-sales-enablement-per-aziende-che-vogliono-crescere-con-piu-ordine.html",t:"Sales enablement per aziende che vogliono crescere con più ordine"},
    {c:"Strategy",f:"blog-come-costruire-una-roadmap-strategica-utile-alla-crescita-aziendale.html",t:"Come costruire una roadmap strategica utile alla crescita aziendale"},
    {c:"Strategy",f:"blog-consulenza-per-sviluppo-del-business-partnership-e-crescita-sostenibile.html",t:"Consulenza per sviluppo del business, partnership e crescita sostenibile"},
    {c:"Strategy",f:"blog-consulenza-strategica-per-aziende-che-vogliono-crescere-con-piu-direzione.html",t:"Consulenza strategica per aziende che vogliono crescere con più direzione"},
    {c:"Strategy",f:"blog-strategy-per-allineare-marketing-sales-dati-e-obiettivi-di-business.html",t:"Strategy per allineare marketing, sales, dati e obiettivi di business"},
    {c:"Strategy",f:"blog-sviluppo-del-business-per-aziende-che-vogliono-aprire-nuove-opportunita.html",t:"Sviluppo del business per aziende che vogliono aprire nuove opportunità"},
    {c:"Controllo di gestione",f:"blog-come-impostare-un-controllo-di-gestione-utile-al-management.html",t:"Come impostare un controllo di gestione utile al management"},
    {c:"Controllo di gestione",f:"blog-come-leggere-numeri-e-marginalita-senza-decidere-a-sensazione.html",t:"Come leggere numeri e marginalità senza decidere a sensazione"},
    {c:"Controllo di gestione",f:"blog-controllo-di-gestione-per-capire-margini-costi-e-priorita.html",t:"Controllo di gestione per capire margini, costi e priorità"},
    {c:"Controllo di gestione",f:"blog-controllo-di-gestione-per-pmi-e-aziende-in-fase-di-crescita.html",t:"Controllo di gestione per PMI e aziende in fase di crescita"},
    {c:"Controllo di gestione",f:"blog-margini-costi-e-sostenibilita-il-valore-del-controllo-di-gestione.html",t:"Margini, costi e sostenibilità: il valore del controllo di gestione"},
    {c:"Redazione articoli SEO",f:"blog-articoli-seo-per-migliorare-posizionamento-e-autorevolezza.html",t:"Articoli SEO per migliorare posizionamento e autorevolezza"},
    {c:"Redazione articoli SEO",f:"blog-come-scrivere-articoli-seo-che-portano-traffico-qualificato.html",t:"Come scrivere articoli SEO che portano traffico qualificato"},
    {c:"Redazione articoli SEO",f:"blog-piano-editoriale-e-redazione-articoli-per-la-crescita-organica.html",t:"Piano editoriale e redazione articoli per la crescita organica"},
    {c:"Redazione articoli SEO",f:"blog-redazione-articoli-seo-per-aziende-che-vogliono-crescere.html",t:"Redazione articoli SEO per aziende che vogliono crescere"},
    {c:"Redazione articoli SEO",f:"blog-servizio-di-redazione-articoli-per-blog-aziendali-b2b.html",t:"Servizio di redazione articoli per blog aziendali B2B"}
  ];

  var currentCat = "";
  arts.forEach(function(a) { if (a.f === currentFile) currentCat = a.c; });

  var others = arts.filter(function(a) { return a.f !== currentFile; });

  // One random article per category, reshuffled on every page load
  var byCategory = {};
  others.forEach(function(a) {
    if (!byCategory[a.c]) byCategory[a.c] = [];
    byCategory[a.c].push(a);
  });
  var picks = Object.keys(byCategory).map(function(cat) {
    var arr = byCategory[cat];
    return arr[Math.floor(Math.random() * arr.length)];
  });
  picks.sort(function() { return Math.random() - 0.5; });
  if (!picks.length) return;

  var html = '<aside class="article-sidebar"><div class="sidebar-widget"><span class="sidebar-label">Leggi anche</span>';
  picks.forEach(function(a) {
    html += '<a class="sidebar-article-link" href="' + a.f + '"><span class="sidebar-article-cat">' + a.c + '</span>' + a.t + '</a>';
  });
  html += '</div></aside>';

  var wrap = document.createElement("div");
  wrap.className = "article-page-wrap";
  articleEl.parentNode.insertBefore(wrap, articleEl);
  wrap.appendChild(articleEl);
  wrap.insertAdjacentHTML("beforeend", html);
});

