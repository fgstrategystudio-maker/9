import crypto from 'node:crypto'

// Accesso: il PIN si verifica qui sul server, che in cambio dà un token
// firmato (HMAC) valido 30 giorni. /api/db e /api/ai rispondono solo con un
// token valido, quindi i dati non sono leggibili da chi conosce solo l'URL.
//
// Variabili d'ambiente (Vercel):
// - DASHBOARD_PIN: il PIN (4 cifre). Se manca vale ancora il PIN storico.
// - DASHBOARD_SECRET: chiave per firmare i token (facoltativa: altrimenti
//   si usa SUPABASE_SERVICE_KEY, che è già segreta).
const PIN_HASH_STORICO = '3f7e05acc03b0893efd9bbb4990cd9d20b1451ab549633510c427f96c40e7143'
const DURATA_MS = 30 * 24 * 60 * 60 * 1000

const segreto = () => process.env.DASHBOARD_SECRET || process.env.SUPABASE_SERVICE_KEY || ''

function uguali(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const firma = (testo) => crypto.createHmac('sha256', segreto()).update(testo).digest('hex')

export function pinValido(pin) {
  if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) return false
  if (process.env.DASHBOARD_PIN) return uguali(pin, process.env.DASHBOARD_PIN)
  return uguali(crypto.createHash('sha256').update(pin).digest('hex'), PIN_HASH_STORICO)
}

export function creaToken() {
  const scadenza = String(Date.now() + DURATA_MS)
  return `${scadenza}.${firma(scadenza)}`
}

export function tokenValido(req) {
  if (!segreto()) return false
  const m = /^Bearer (\d{13})\.([a-f0-9]{64})$/.exec(req.headers?.authorization || '')
  if (!m || Number(m[1]) < Date.now()) return false
  return uguali(m[2], firma(m[1]))
}
