import { pinValido, creaToken } from './_auth.js'

// Tentativi sbagliati per IP (in memoria: limite "di cortesia", il vero
// freno è l'attesa a ogni errore e il blocco nel client)
const errori = new Map()
const FINESTRA_MS = 15 * 60 * 1000
const MAX_ERRORI = 10

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ignoto'
  const ora = Date.now()
  const stato = errori.get(ip)
  if (stato && ora - stato.da < FINESTRA_MS && stato.n >= MAX_ERRORI) {
    return res.status(429).json({ error: 'troppi_tentativi' })
  }
  const { pin } = req.body || {}
  if (!pinValido(pin)) {
    const s = stato && ora - stato.da < FINESTRA_MS ? stato : { n: 0, da: ora }
    s.n++
    errori.set(ip, s)
    await new Promise((r) => setTimeout(r, 600))
    return res.status(401).json({ error: 'pin_errato' })
  }
  errori.delete(ip)
  res.json({ token: creaToken() })
}
