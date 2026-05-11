import { supabase } from './supabase'

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

function clearMcdKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('mcd_')) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export async function loadUserData(userId) {
  if (!supabase) return
  clearMcdKeys()
  const { data } = await supabase.from('user_data').select('key,data').eq('user_id', userId)
  if (data) data.forEach(row => localStorage.setItem(row.key, JSON.stringify(row.data)))
}

export async function syncKey(key, data) {
  if (!supabase) return
  const session = getSession()
  if (!session) return
  supabase.from('user_data').upsert({ user_id: session.userId, key, data, updated_at: new Date().toISOString() }).then(() => {})
}

export async function getPin(userId) {
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('pin').eq('id', userId).single()
  return data?.pin ?? null
}

export async function setPin(userId, pin) {
  if (!supabase) return
  await supabase.from('profiles').update({ pin }).eq('id', userId)
}
