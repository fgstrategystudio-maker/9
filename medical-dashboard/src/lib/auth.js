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

export async function loadUserData(userId) {
  // dati in localStorage, niente da caricare
}

export async function syncKey(key, data) {
  // sync disabilitato
}

export async function getPin(userId) {
  return localStorage.getItem(`mcd_pin_${userId}`) ?? null
}

export async function setPin(userId, pin) {
  localStorage.setItem(`mcd_pin_${userId}`, pin)
}
