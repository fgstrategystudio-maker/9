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
    if (k?.startsWith('mcd_')) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export async function loadUserData(userId) {
  try {
    clearMcdKeys()
    const rows = await dbCall('loadUserData', { userId })
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
  return await dbCall('getPin', { userId })
}

export async function setPin(userId, pin) {
  await dbCall('setPin', { userId, pin })
}
