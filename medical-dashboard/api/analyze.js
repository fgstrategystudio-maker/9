import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ error: 'Configura ANTHROPIC_API_KEY su Vercel per usare questa funzione' })
  }

  const { profile, episodes, allergies, conditions, medications, family, lifestyle, measurements, diary } = req.body

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const payload = JSON.stringify({
    profilo: profile,
    episodi: episodes,
    allergie: allergies,
    patologie: conditions,
    farmaci: medications,
    storia_familiare: family,
    stile_di_vita: lifestyle,
    misurazioni: measurements,
    diario: diary,
  }, null, 2)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `Sei un assistente medico italiano. Analizza questa storia clinica personale e identifica pattern, correlazioni e osservazioni clinicamente rilevanti. NON fare diagnosi. Evidenzia: ricorrenze stagionali, correlazioni tra stile di vita e sintomi, pattern di infortuni, progressioni nel tempo, aree di attenzione preventiva. Rispondi in italiano, in modo chiaro e leggibile, usando sezioni con emoji. Massimo 400 parole.`,
      messages: [{
        role: 'user',
        content: `Analizza questa storia clinica personale:\n\n${payload}`,
      }],
    })

    return res.status(200).json({ analysis: message.content[0].text })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Errore durante l\'analisi' })
  }
}
