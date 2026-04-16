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

// Carousel scroll arrows
document.addEventListener("DOMContentLoaded", function () {
  function makeScroller(trackEl, prevBtn, nextBtn, amount) {
    if (!trackEl) return;
    if (prevBtn) prevBtn.addEventListener("click", function () {
      trackEl.scrollBy({ left: -amount, behavior: "smooth" });
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      trackEl.scrollBy({ left: amount, behavior: "smooth" });
    });
  }
  makeScroller(
    document.querySelector(".logo-marquee"),
    document.querySelector(".logo-btn-prev"),
    document.querySelector(".logo-btn-next"),
    280
  );
  makeScroller(
    document.getElementById("blogHomeTrack"),
    document.querySelector(".blog-btn-prev"),
    document.querySelector(".blog-btn-next"),
    290
  );
});
