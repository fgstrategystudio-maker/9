import Anthropic from '@anthropic-ai/sdk'

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { base64, mediaType, filename } = req.body
  if (!base64 || !mediaType) return res.status(400).json({ error: 'base64 e mediaType richiesti' })

  const isImage = mediaType.startsWith('image/')
  const isPdf = mediaType === 'application/pdf'
  if (!isImage && !isPdf) return res.status(400).json({ error: 'Formato non supportato.' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Sei un assistente medico italiano. Analizza questo documento sanitario ed estrai tutte le informazioni rilevanti.
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo aggiuntivo.

Struttura del JSON:
{
  "source_type": "uno di: referto_esame, analisi_sangue, radiologia, lettera_medica, ricetta, foto_documento, prescrizione, cartella_clinica, altro",
  "date": "YYYY-MM-DD se presente",
  "type": "tipo di esame o documento (es: RMN ginocchio, Emocromo, Visita ortopedica)",
  "diagnosis": "diagnosi principale se presente",
  "body_area": "zona del corpo interessata (es: ginocchio dx, lombare, polmoni)",
  "symptoms": "sintomi descritti nel documento",
  "result_summary": "sintesi leggibile del risultato o referto",
  "doctor": "nome del medico",
  "facility": "nome della struttura sanitaria",
  "medications": [
    { "name": "nome farmaco", "dosage": "dosaggio", "frequency": "frequenza", "reason": "motivo" }
  ],
  "allergies": [
    { "name": "sostanza", "type": "farmaco|alimento|altro", "severity": "lieve|moderata|grave" }
  ],
  "suggested_sections": ["documenti", "timeline", "farmaci", "allergie"],
  "notes": "altre informazioni clinicamente rilevanti"
}

Regole per suggested_sections:
- Includi sempre "documenti"
- Aggiungi "timeline" se c'è una diagnosi, sintomi, o un evento clinico databile
- Aggiungi "farmaci" se ci sono farmaci prescritti o in uso
- Aggiungi "allergie" se ci sono allergie o reazioni avverse menzionate`,
    messages: [{
      role: 'user',
      content: [contentBlock, { type: 'text', text: `Estrai le informazioni mediche da questo documento: ${filename || 'documento'}` }]
    }],
  })

  try {
    const text = message.content[0].text.trim()
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    return res.status(200).json(JSON.parse(cleaned))
  } catch {
    return res.status(200).json({ source_type: 'altro', suggested_sections: ['documenti'], notes: message.content[0].text })
  }
}
