const SESSION_KEY = 'mcd_session'

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch { return null }
}

export function setSession(userId, userName) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, userName }))
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

async function dbCall(action, params = {}) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  })
  if (!res.ok) throw new Error('DB error')
  const json = await res.json()
  return json.result
}

function clearMcdKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    // Non toccare mai i PIN salvati localmente
    if (k?.startsWith('mcd_') && !k.startsWith('mcd_pin_')) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export async function loadUserData(userId) {
  try {
    const rows = await dbCall('loadUserData', { userId })
    // Clear solo dopo aver ricevuto i dati dal server (offline: mantieni localStorage)
    clearMcdKeys()
    if (rows) rows.forEach(row => localStorage.setItem(row.key, JSON.stringify(row.data)))
  } catch { /* offline — usa localStorage locale */ }
}

export async function syncKey(key, data) {
  const session = getSession()
  if (!session) return
  try {
    await dbCall('syncKey', { userId: session.userId, key, data })
  } catch { /* sync silenzioso */ }
}

export async function getPin(userId) {
  // Prova KV, poi localStorage come fallback
  try {
    const kvPin = await dbCall('getPin', { userId })
    if (kvPin !== null && kvPin !== undefined) return kvPin
  } catch { /* ignora errori KV */ }
  return localStorage.getItem(`mcd_pin_${userId}`) ?? null
}

export async function setPin(userId, pin) {
  // Salva sempre in locale come sicurezza, poi anche su KV
  localStorage.setItem(`mcd_pin_${userId}`, pin)
  try {
    await dbCall('setPin', { userId, pin })
  } catch { /* già salvato in localStorage */ }
}
