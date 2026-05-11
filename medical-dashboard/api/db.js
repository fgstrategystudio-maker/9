import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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
        const { data } = await supabase.from('profiles').select('pin').eq('id', p.userId).single()
        result = data?.pin ?? null
        break
      }
      case 'setPin': {
        await supabase.from('profiles').update({ pin: p.pin }).eq('id', p.userId)
        result = true
        break
      }
      case 'loadUserData': {
        const { data } = await supabase.from('user_data').select('key,data').eq('user_id', p.userId)
        result = data ?? []
        break
      }
      case 'syncKey': {
        await supabase.from('user_data').upsert({
          user_id: p.userId,
          key: p.key,
          data: p.data,
          updated_at: new Date().toISOString()
        })
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
