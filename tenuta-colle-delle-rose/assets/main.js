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
  email: "",
  phone: "",
  whatsapp: "",
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
    if (kind === "whatsapp") { el.textContent = "+" + val; el.href = "https://wa.me/" + val; }
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
