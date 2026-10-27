// Token di accesso alle API (/api/db, /api/ai), ottenuto con il PIN da /api/auth.
const KEY = "freelance_token";

export function getToken() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function setToken(t) {
  try { localStorage.setItem(KEY, t); } catch { /* storage non disponibile */ }
}
export function clearToken() {
  try { localStorage.removeItem(KEY); } catch { /* storage non disponibile */ }
}

export function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Il server rifiuta il token (scaduto o PIN cambiato): torna alla schermata del PIN
export function segnalaAccessoScaduto() {
  clearToken();
  window.dispatchEvent(new Event("accesso-scaduto"));
}

// "ok" | "errato" | "bloccato" | "offline" (server non raggiungibile: solo in locale)
export async function accedi(pin) {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const { token } = await res.json();
      if (!token) return "offline";
      setToken(token);
      return "ok";
    }
    if (res.status === 401) return "errato";
    if (res.status === 429) return "bloccato";
    return "offline";
  } catch {
    return "offline";
  }
}
