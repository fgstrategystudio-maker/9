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

