import { kv } from '@vercel/kv'

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
      case 'getPin': {
        result = await kv.get(`pin:${p.userId}`) ?? null
        break
      }
      case 'setPin': {
        await kv.set(`pin:${p.userId}`, p.pin)
        result = true
        break
      }
      case 'loadUserData': {
        const keys = await kv.keys(`data:${p.userId}:*`)
        if (!keys.length) { result = []; break }
        const values = await kv.mget(...keys)
        result = keys.map((k, i) => ({
          key: k.replace(`data:${p.userId}:`, ''),
          data: values[i]
        }))
        break
      }
      case 'syncKey': {
        await kv.set(`data:${p.userId}:${p.key}`, p.data)
        result = true
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
