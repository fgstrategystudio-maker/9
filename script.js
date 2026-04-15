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
    link.addEventListener("click", closeMenu);
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
