export function formatCurrency(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// Toni del design system (Crema & Terracotta)
export function getStatoColor(stato) {
  const map = {
    "In corso": "#5E7E5A",      // pos
    "In scadenza": "#B5862F",   // warn
    "Da chiarire": "#B5654A",   // accent
    Sospeso: "#9A8F7E",         // ink-3
    Concluso: "#5B7088",        // info
    Perso: "#AE4A3A",           // danger
  };
  return map[stato] || "#9A8F7E";
}

// Tono pill (classi globali .pill.s-*)
export function getStatoTone(stato) {
  const map = {
    "In corso": "pos",
    "In scadenza": "warn",
    "Da chiarire": "accent",
    Sospeso: "ink",
    Concluso: "info",
    Perso: "danger",
  };
  return map[stato] || "ink";
}

export function getPrioritaColor(priorita) {
  const map = {
    Alta: "#AE4A3A",
    Media: "#B5862F",
    Bassa: "#5E7E5A",
  };
  return map[priorita] || "#9A8F7E";
}

// Tinte piatte per avatar a iniziali (palette design, ordinate per massimo contrasto tra adiacenti)
export const AVATAR_COLORS = [
  "#B5654A", // terracotta
  "#5E7E5A", // salvia
  "#5B7088", // blu polvere
  "#B5862F", // ocra/oro
  "#8A5A8A", // prugna
  "#46897A", // verde acqua
  "#8a6b52", // taupe/caffè
  "#4C6948", // salvia scuro
  "#97503A", // terracotta scuro
  "#6E6456", // taupe scuro
];

// Colore stabile per indice: commesse adiacenti hanno sempre colori diversi
export function getAvatarColorByIndex(i) {
  return AVATAR_COLORS[((i % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length];
}

export function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function getInitials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function calcNetto(lordo, fattore) {
  if (lordo == null) return null;
  return Math.round(lordo * fattore);
}

export function getCommessaLordoMensile(commessa) {
  if (commessa.lordoMensile) return commessa.lordoMensile;
  if (commessa.lordoProgetto && commessa.inizio && commessa.fine) {
    const mesi = monthsBetween(commessa.inizio, commessa.fine);
    return mesi > 0 ? Math.round(commessa.lordoProgetto / mesi) : commessa.lordoProgetto;
  }
  return null;
}

// Ricavo orario da fee mensile (o mensilizzata per i progetti) e ore stimate
export function getRicavoOrario(commessa, fattoreNetto) {
  const lordo = getCommessaLordoMensile(commessa);
  const ore = Number(commessa.oreMensili);
  if (!lordo || !ore || ore <= 0) return null;
  return {
    lordoOra: Math.round(lordo / ore),
    nettoOra: Math.round((lordo * fattoreNetto) / ore),
  };
}

const MESI_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function getMeseCorrente() {
  const now = new Date();
  return `${MESI_IT[now.getMonth()]} ${now.getFullYear()}`;
}

export function getMesePrecedente() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${MESI_IT[d.getMonth()]} ${d.getFullYear()}`;
}

// Parsa date ISO come orario locale (evita shift UTC → problemi con date a mezzanotte)
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getLordoPerMese(monthIdx, year, commesse) {
  const monthStart = new Date(year, monthIdx, 1);
  const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59);
  return commesse
    .filter((c) => {
      const end = c.fine ? parseLocalDate(c.fine) : null;
      if (c.stato === "Concluso") {
        const hasLordo = c.lordoMensile || c.lordoProgetto;
        return hasLordo && end && end >= monthStart && end <= monthEnd;
      }
      if (c.stato !== "In corso" && c.stato !== "In scadenza") return false;
      const lordo = getCommessaLordoMensile(c);
      if (!lordo) return false;
      const start = c.inizio ? parseLocalDate(c.inizio) : null;
      if (end && end < monthStart) return false;
      if (start && start > monthEnd) return false;
      return true;
    })
    .reduce((sum, c) => {
      if (c.stato === "Concluso") {
        // per commesse concluse usa il totale progetto (pagato in quell'unico mese)
        return sum + (c.lordoProgetto || c.lordoMensile || 0);
      }
      return sum + (getCommessaLordoMensile(c) || 0);
    }, 0);
}

export function monthsBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}
