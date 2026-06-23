// Il sync passa dall'API serverless (/api/db) che usa la service key lato
// server: nessuna chiave Supabase nel bundle client, RLS chiusa per anon.

// Il sync verso il cloud resta DISABILITATO finché non abbiamo caricato con
// successo lo stato dal cloud (vedi enableSync). Così un dispositivo con dati
// locali vecchi (es. il telefono) non può sovrascrivere i dati buoni nel cloud
// prima di averli letti.
let syncEnabled = false
export function enableSync() { syncEnabled = true }

async function dbCall(action, params = {}) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  if (!res.ok) throw new Error('DB error')
  const json = await res.json()
  return json.result
}

// Ritorna l'array di righe, [] se il cloud è vuoto, oppure null se il
// caricamento è fallito (per non confondere "vuoto" con "errore di rete").
// Riprova qualche volta: su mobile una singola richiesta può fallire.
export async function loadFromSupabase() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await dbCall('load')
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  return null
}

export async function syncToSupabase(key, value) {
  if (!syncEnabled) return
  try {
    await dbCall('sync', { key, value })
  } catch {
    // best-effort: un errore di sync non deve bloccare l'UI
  }
}
