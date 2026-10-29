/* ============================================================
   CONTATTI — modifica solo questo blocco.
   - email / phone: mostrati sul sito e usati dal modulo
   - whatsapp: numero in formato internazionale senza + e spazi (es. 393331234567)
   - formEndpoint: facoltativo. Se incolli l'URL di un servizio moduli
     (es. Formspree: https://formspree.io/f/xxxxxx) le richieste arrivano via email
     senza aprire il programma di posta. Se resta vuoto, il modulo prepara
     un'email / un messaggio WhatsApp precompilato.
   ============================================================ */
const CONFIG = {
  email: "fgstrategystudio@gmail.com",
  phone: "+39 351 704 8540",
  whatsapp: "393517048540",
  formEndpoint: ""
};

(function () {
  const lang = document.documentElement.lang === "en" ? "en" : "it";
  const T = {
    it: {
      missing: "in fase di attivazione",
      ok: "Grazie, richiesta inviata. Ti ricontattiamo entro 24 ore lavorative.",
      fail: "Invio non riuscito. Scrivici direttamente all'indirizzo indicato a sinistra.",
      draft: "Abbiamo preparato il messaggio: completalo e invialo dalla tua app.",
      need: "Compila nome, contatto e accetta il trattamento dei dati.",
      subject: "Richiesta informazioni – Tenuta Colle delle Rose, Riano",
      noChannel: "I contatti diretti sono in fase di attivazione: riprova a breve.",
      close: "Chiudi", prev: "Foto precedente", next: "Foto successiva"
    },
    en: {
      missing: "coming soon",
      ok: "Thank you, your request has been sent. We will reply within one business day.",
      fail: "Sending failed. Please write to us directly at the address on the left.",
      draft: "Your message is ready: review it and send it from your app.",
      need: "Please fill in your name, a contact detail and accept the privacy notice.",
      subject: "Enquiry – Colle delle Rose Estate, Riano (Rome)",
      noChannel: "Direct contacts are being set up: please try again shortly.",
      close: "Close", prev: "Previous photo", next: "Next photo"
    }
  }[lang];

  /* Contatti in pagina */
  document.querySelectorAll("[data-contact]").forEach((el) => {
    const kind = el.dataset.contact;
    const val = CONFIG[kind];
    if (!val) { el.textContent = T.missing; el.removeAttribute("href"); return; }
    if (kind === "email") { el.textContent = val; el.href = "mailto:" + val; }
    if (kind === "phone") { el.textContent = val; el.href = "tel:" + val.replace(/\s+/g, ""); }
    if (kind === "whatsapp") { el.textContent = CONFIG.phone || "+" + val; el.href = "https://wa.me/" + val; }
  });
  document.querySelectorAll("[data-wa-link]").forEach((el) => {
    if (CONFIG.whatsapp) el.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(T.subject);
  });

  /* Schede stili prima/dopo */
  const tabs = document.querySelectorAll("[role=tab]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    });
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const list = Array.from(tabs);
      const i = list.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1);
      const next = list[(i + list.length) % list.length];
      next.click(); next.focus();
    });
  });

  /* Lightbox */
  const zoomables = Array.from(document.querySelectorAll("[data-full]"));
  let idx = 0, box = null;
  function render() {
    const b = zoomables[idx];
    box.querySelector("img").src = b.dataset.full;
    box.querySelector("img").alt = b.querySelector("img").alt;
    box.querySelector("p").textContent = b.querySelector("img").alt;
  }
  function open(i) {
    idx = i;
    box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<div><img alt=""><p></p></div>' +
      '<button class="lb-close" aria-label="' + T.close + '">×</button>' +
      '<button class="lb-nav lb-prev" aria-label="' + T.prev + '">‹</button>' +
      '<button class="lb-nav lb-next" aria-label="' + T.next + '">›</button>';
    document.body.appendChild(box);
    render();
    box.querySelector(".lb-close").focus();
    box.addEventListener("click", (e) => {
      if (e.target === box || e.target.classList.contains("lb-close")) close();
      if (e.target.classList.contains("lb-prev")) step(-1);
      if (e.target.classList.contains("lb-next")) step(1);
    });
    document.addEventListener("keydown", onKey);
  }
  function step(d) { idx = (idx + d + zoomables.length) % zoomables.length; render(); }
  function close() { box.remove(); box = null; document.removeEventListener("keydown", onKey); zoomables[idx].focus(); }
  function onKey(e) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  }
  zoomables.forEach((b, i) => b.addEventListener("click", () => open(i)));

  /* Modulo contatti */
  const form = document.getElementById("lead-form");
  if (form) {
    const status = document.getElementById("form-status");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (!d.nome || !(d.email || d.telefono) || !d.privacy) { status.textContent = T.need; return; }
      const body = [
        (lang === "en" ? "Name: " : "Nome: ") + d.nome,
        "Email: " + (d.email || "-"),
        (lang === "en" ? "Phone: " : "Telefono: ") + (d.telefono || "-"),
        (lang === "en" ? "Profile: " : "Profilo: ") + (d.profilo || "-"),
        (lang === "en" ? "Request: " : "Richiesta: ") + (d.richiesta || "-"),
        "",
        d.messaggio || ""
      ].join("\n");
      const via = e.submitter && e.submitter.dataset.via;

      if (CONFIG.formEndpoint && via !== "whatsapp") {
        try {
          const r = await fetch(CONFIG.formEndpoint, {
            method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ ...d, _subject: T.subject, lingua: lang })
          });
          if (!r.ok) throw new Error(r.status);
          form.reset(); status.textContent = T.ok;
          if (window.gtag) window.gtag("event", "generate_lead");
          return;
        } catch (err) { status.textContent = T.fail; return; }
      }
      if (via === "whatsapp" && CONFIG.whatsapp) {
        window.location.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(T.subject + "\n\n" + body);
        status.textContent = T.draft; return;
      }
      if (CONFIG.email) {
        window.location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(T.subject) + "&body=" + encodeURIComponent(body);
        status.textContent = T.draft; return;
      }
      status.textContent = T.noChannel;
    });
  }

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ---------- Effetti e strumenti interattivi ---------- */
(function () {
  const en = document.documentElement.lang === "en";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => (en ? "€" : "€ ") + Math.round(n).toLocaleString(en ? "en-GB" : "it-IT");

  /* Comparsa allo scroll: solo gli elementi sotto la piega, così la pagina è completa anche ferma */
  if ("IntersectionObserver" in window && !reduce) {
    const els = document.querySelectorAll(".sec-head, .split > *, .asset, .vision, .duo > *, .maps > *, .gallery > *, .explorer, .compare, .sim, .tour, .tech-grid > *, .faq, .price-card");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.documentElement.classList.add("js-reveal");
    els.forEach((el, i) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  }

  /* Contatori dei numeri chiave */
  const nums = document.querySelectorAll(".cippo .n");
  if ("IntersectionObserver" in window && !reduce) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io2.unobserve(e.target);
        const el = e.target, txt = el.textContent.trim();
        const m = txt.match(/^(~?)([\d.,]+)$/);
        if (!m) return;
        const raw = m[2], dec = /,\d$/.test(raw) || /\.\d$/.test(raw) && raw.length < 5;
        const target = parseFloat(raw.replace(/\.(?=\d{3})/g, "").replace(/,(?=\d{3})/g, "").replace(",", "."));
        const t0 = performance.now(), D = 1400;
        (function tick(t) {
          const k = Math.min(1, (t - t0) / D), v = target * (1 - Math.pow(1 - k, 3));
          let out = dec ? v.toFixed(1) : Math.round(v).toLocaleString(en ? "en-GB" : "it-IT");
          if (dec && !en) out = out.replace(".", ",");
          el.textContent = m[1] + (k < 1 ? out : raw);
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io2.observe(n));
  }

  /* Video di apertura: in pausa quando non è visibile */
  const hv = document.querySelector(".hero-video");
  if (hv) {
    if (reduce) { hv.removeAttribute("autoplay"); hv.pause(); }
    else if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { e.isIntersecting ? hv.play().catch(() => {}) : hv.pause(); }).observe(hv);
    }
  }

  /* Esplora la tenuta */
  const pins = document.querySelectorAll(".pin");
  const items = document.querySelectorAll(".explorer-list li");
  function select(i) {
    pins.forEach((p) => p.classList.toggle("on", p.dataset.pin === String(i)));
    items.forEach((li) => li.classList.toggle("on", li.dataset.pin === String(i)));
  }
  pins.forEach((p) => p.addEventListener("click", () => select(p.dataset.pin)));
  items.forEach((li) => li.querySelector("button").addEventListener("click", () => select(li.dataset.pin)));
  if (pins.length) select(0);

  /* Confronto prima / dopo */
  document.querySelectorAll(".compare").forEach((c) => {
    const range = c.querySelector("input[type=range]");
    const frame = c.querySelector(".compare-frame");
    const fade = c.dataset.mode === "fade";
    const set = (v) => {
      range.value = v;
      if (fade) frame.style.setProperty("--op", v / 100);
      else frame.style.setProperty("--pos", (100 - v) + "%");
    };
    // nel "fade" 0 = oggi, 100 = dopo; nello "slide" la parte destra mostra il dopo
    set(fade ? 0 : 50);
    range.addEventListener("input", () => set(+range.value));
    if (!fade) {
      const drag = (e) => {
        const r = frame.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        set(Math.max(0, Math.min(100, 100 - (x / r.width) * 100)));
      };
      let down = false;
      frame.addEventListener("pointerdown", (e) => { down = true; drag(e); });
      window.addEventListener("pointerup", () => (down = false));
      frame.addEventListener("pointermove", (e) => { if (down) drag(e); });
    } else {
      frame.addEventListener("click", () => set(+range.value > 50 ? 0 : 100));
      frame.style.cursor = "pointer";
    }
    // breve dimostrazione automatica la prima volta che il confronto entra in vista
    if ("IntersectionObserver" in window && !reduce) {
      const io3 = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io3.disconnect();
        const from = fade ? 0 : 50, to = fade ? 100 : 15, t0 = performance.now();
        (function tick(t) {
          const k = Math.min(1, (t - t0) / 1600), ease = 0.5 - Math.cos(Math.PI * k) / 2;
          set(from + (to - from) * ease);
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      }, { threshold: 0.6 });
      io3.observe(frame);
    }
  });

  /* Simulatore ricavi */
  const sim = document.getElementById("sim");
  if (sim) {
    const $ = (id) => document.getElementById(id);
    const ROOMS = 8, GUESTS = 80;
    const calc = () => {
      const adr = +$("s-adr").value, occ = +$("s-occ").value, ev = +$("s-ev").value, pp = +$("s-pp").value;
      $("o-adr").textContent = fmt(adr); $("o-occ").textContent = occ + "%";
      $("o-ev").textContent = ev; $("o-pp").textContent = fmt(pp);
      const rooms = ROOMS * adr * (occ / 100) * 365, events = ev * GUESTS * pp, tot = rooms + events;
      $("r-rooms").textContent = fmt(rooms); $("r-events").textContent = fmt(events); $("r-total").textContent = fmt(tot);
      $("b-rooms").style.width = (tot ? rooms / tot * 100 : 0) + "%";
      $("b-events").style.width = (tot ? events / tot * 100 : 0) + "%";
    };
    sim.addEventListener("input", calc);
    calc();
  }
})();
