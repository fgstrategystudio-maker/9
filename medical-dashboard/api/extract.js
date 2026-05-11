import Anthropic from '@anthropic-ai/sdk'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { base64, mediaType, filename } = req.body

  if (!base64 || !mediaType) {
    return res.status(400).json({ error: 'base64 e mediaType richiesti' })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const isImage = mediaType.startsWith('image/')
  const isPdf = mediaType === 'application/pdf'

  if (!isImage && !isPdf) {
    return res.status(400).json({ error: 'Formato non supportato. Usa PDF o immagine.' })
  }

  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `Sei un assistente medico. Estrai strutturalmente le informazioni mediche da questo documento.
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo aggiuntivo.
Campi possibili (tutti opzionali):
{
  "date": "YYYY-MM-DD",
  "type": "tipo di esame o documento",
  "diagnosis": "diagnosi",
  "body_area": "area del corpo",
  "symptoms": "sintomi descritti",
  "result_summary": "sintesi del risultato",
  "doctor": "nome medico",
  "facility": "struttura sanitaria",
  "medications": ["farmaco1", "farmaco2"],
  "notes": "altre note rilevanti"
}`,
    messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Estrai le informazioni mediche da questo documento: ${filename || 'documento'}` }] }],
  })

  try {
    const text = message.content[0].text.trim()
    const json = JSON.parse(text)
    return res.status(200).json(json)
  } catch {
    return res.status(200).json({ notes: message.content[0].text })
  }
}
