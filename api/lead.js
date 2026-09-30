// Notifica una nuova lead senza passare per la posta di terzi.
//
// Perche' esiste: le notifiche di Web3Forms partono da un indirizzo condiviso
// su un dominio che non e' il nostro, e Gmail le classifica come spam. Qui il
// messaggio arriva o su Telegram (nessun concetto di spam, notifica immediata
// sul telefono) o via email da un mittente sul dominio francescogizzi.com, con
// SPF e DKIM allineati.
//
// Entrambi i canali sono opzionali: si attivano se ci sono le variabili
// d'ambiente. Se non ce n'e' nessuna la funzione risponde comunque 200, cosi'
// l'invio del form non fallisce mai per colpa nostra.
//
// Variabili d'ambiente (su Vercel, mai nel repository):
//   TELEGRAM_BOT_TOKEN   token del bot creato con @BotFather
//   TELEGRAM_CHAT_ID     id della chat dove ricevere le lead
//   RESEND_API_KEY       chiave Resend (piano gratuito: 3.000 email al mese)
//   LEAD_FROM            es. "Sito Francesco Gizzi <lead@francescogizzi.com>"
//   LEAD_TO              dove recapitare le lead

const CAMPI = [
  "Nome", "Cognome", "Azienda", "Città",
  "Servizio richiesto", "Email", "Telefono", "Messaggio",
];

const MAX_LEN = 2000;

function pulisci(v) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/\s+$/g, "").slice(0, MAX_LEN);
}

function leggiCorpo(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 100000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        resolve(Object.fromEntries(new URLSearchParams(raw)));
      }
    });
    req.on("error", () => resolve({}));
  });
}

function componi(d) {
  const righe = [];
  for (const c of CAMPI) {
    const v = pulisci(d[c]);
    if (v) righe.push(`${c}: ${v}`);
  }
  const pagina = pulisci(d._page);
  if (pagina) righe.push(`Pagina: ${pagina}`);
  righe.push(`Ricevuta: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`);
  return righe.join("\n");
}

async function viaTelegram(testo) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return null;
  // Niente parse_mode: il testo arriva cosi' com'e', quindi un messaggio che
  // contenga caratteri speciali non puo' rompere la formattazione ne' iniettare
  // markup nella chat.
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text: `🔔 Nuova lead dal sito\n\n${testo}`,
      disable_web_page_preview: true,
    }),
  });
  return { canale: "telegram", ok: r.ok, stato: r.status };
}

async function viaEmail(testo, d) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM;
  const to = process.env.LEAD_TO;
  if (!key || !from || !to) return null;
  const nome = [pulisci(d.Nome), pulisci(d.Cognome)].filter(Boolean).join(" ");
  const email = pulisci(d.Email);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      // Rispondendo si scrive direttamente alla lead, non a se stessi.
      reply_to: email || undefined,
      subject: nome ? `Nuova lead: ${nome}` : "Nuova lead dal sito",
      text: testo,
    }),
  });
  return { canale: "email", ok: r.ok, stato: r.status };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const d = await leggiCorpo(req);

  // Honeypot: il campo e' nascosto, se e' pieno ha scritto un bot.
  if (pulisci(d.botcheck)) return res.status(200).json({ ok: true });

  // Senza nessun contatto non c'e' una lead da notificare.
  if (!pulisci(d.Email) && !pulisci(d.Telefono)) {
    return res.status(200).json({ ok: true, ignorata: true });
  }

  const testo = componi(d);
  const esiti = [];
  for (const invia of [viaTelegram, viaEmail]) {
    try {
      const esito = await invia(testo, d);
      if (esito) esiti.push(esito);
    } catch (e) {
      esiti.push({ canale: invia.name, ok: false, errore: String(e).slice(0, 200) });
    }
  }

  // Sempre 200: il visitatore ha gia' inviato il form, un errore qui non deve
  // tradursi in un errore per lui. Gli esiti restano nei log di Vercel.
  if (esiti.some((e) => !e.ok)) console.error("lead: invio fallito", esiti);
  return res.status(200).json({ ok: true, canali: esiti.length });
};
