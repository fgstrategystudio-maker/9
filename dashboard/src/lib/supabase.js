// Il sync passa dall'API serverless (/api/db) che usa la service key lato
// server: nessuna chiave Supabase nel bundle client, RLS chiusa per anon.

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

export async function loadFromSupabase() {
  try {
    return await dbCall('load')
  } catch {
    return null
  }
}

export async function syncToSupabase(key, value) {
  try {
    await dbCall('sync', { key, value })
  } catch { }
}
