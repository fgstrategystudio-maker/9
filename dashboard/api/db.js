const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

async function sb(method, path, body) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers.Prefer = 'resolution=merge-duplicates,return=minimal'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  if (method === 'POST') return null
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { action, ...p } = req.body

  try {
    let result
    switch (action) {
      case 'load': {
        result = await sb('GET', 'freelance_kv?select=key,value')
        break
      }
      case 'sync': {
        await sb('POST', 'freelance_kv', { key: p.key, value: p.value })
        result = true
        break
      }
      case 'ping': {
        result = 'ok'
        break
      }
      default:
        return res.status(400).json({ error: 'Unknown action' })
    }
    res.json({ result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
