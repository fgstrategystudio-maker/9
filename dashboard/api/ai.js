// Endpoint AI: interpreta un'istruzione in linguaggio naturale e propone
// azioni strutturate sulle commesse/incassi. La chiave API resta lato server
// (env ANTHROPIC_API_KEY su Vercel). L'app mostra le azioni proposte e le
// applica solo dopo conferma dell'utente: qui non si scrive mai nulla.

const MODEL = 'claude-sonnet-5'

const TOOL = {
  name: 'proponi_azioni',
  description: 'Proponi le azioni da applicare ai dati della dashboard in base alla richiesta.',
  input_schema: {
    type: 'object',
    properties: {
      spiegazione: {
        type: 'string',
        description: 'Spiegazione breve e chiara, in italiano, di cosa proponi e perché.',
      },
      azioni: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['registra_incasso', 'aggiorna_commessa', 'aggiungi_nota', 'nessuna_azione'],
            },
            mese: { type: 'string', description: 'Per registra_incasso: mese in italiano con anno, es. "Settembre 2026".' },
            lordo: { type: 'number', description: 'Per registra_incasso: totale lordo REALE incassato in quel mese (tutti i clienti).' },
            id: { type: 'number', description: 'Per aggiorna_commessa/aggiungi_nota: id della commessa.' },
            campi: {
              type: 'object',
              description: 'Per aggiorna_commessa: solo i campi da cambiare. Ammessi: lordoMensile, lordoProgetto, oreMensili, upsellTarget, stato, tipo, inizio (YYYY-MM-DD), fine (YYYY-MM-DD), splitMezzoMese, priorita, servizio, note.',
            },
            testo: { type: 'string', description: 'Per aggiungi_nota: testo della nota da aggiungere alla commessa.' },
            motivo: { type: 'string', description: 'Motivazione sintetica di questa azione.' },
          },
          required: ['tipo'],
        },
      },
    },
    required: ['spiegazione', 'azioni'],
  },
}

function systemPrompt(ctx) {
  return `Sei l'assistente della Freelance Dashboard di un freelance italiano (SEO/Ads).
Interpreti richieste in linguaggio naturale e proponi azioni sui suoi dati usando SOLO il tool proponi_azioni.

REGOLE DI DOMINIO
- "incassatoStorico" registra il TOTALE lordo incassato per mese (tutti i clienti insieme); il netto lo calcola l'app (fattore ${Math.round((ctx.fattoreNetto ?? 0.7) * 100)}%). Per registra_incasso indica sempre il totale mese, non il singolo pagamento: se un cliente ha pagato una cifra diversa dal previsto, parti dalla stima o dal valore già registrato del mese e applica la differenza.
- Pagamento insolito UNA TANTUM (acconto, sconto, cifra concordata diversa per questo mese): NON cambiare la fee della commessa; proponi registra_incasso col totale reale del mese + aggiungi_nota sulla commessa per tenerne traccia.
- Cambio DURATURO di accordo (nuova fee mensile, rinnovo, chiusura): proponi aggiorna_commessa (es. lordoMensile, fine, stato).
- Stati validi commessa: "In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso".
- Mesi in italiano con anno, es. "Settembre 2026". Date campi in formato YYYY-MM-DD. Oggi è ${ctx.oggi}.
- Se la richiesta è ambigua o mancano dati per agire in sicurezza, usa nessuna_azione e spiega cosa manca. Meglio chiedere che sbagliare su dati economici.
- Non inventare importi: usa i numeri della richiesta e del contesto.

CONTESTO ATTUALE (JSON)
${JSON.stringify(ctx, null, 1)}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'missing_api_key', message: 'ANTHROPIC_API_KEY non configurata su Vercel.' })
  }

  const { istruzione, contesto } = req.body || {}
  if (!istruzione || typeof istruzione !== 'string' || istruzione.length > 2000) {
    return res.status(400).json({ error: 'bad_request' })
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: systemPrompt(contesto || {}),
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'proponi_azioni' },
        messages: [{ role: 'user', content: istruzione }],
      }),
    })
    if (!r.ok) {
      const txt = await r.text()
      return res.status(502).json({ error: 'anthropic_error', message: txt.slice(0, 500) })
    }
    const data = await r.json()
    const toolUse = (data.content || []).find((b) => b.type === 'tool_use' && b.name === 'proponi_azioni')
    if (!toolUse) return res.status(502).json({ error: 'no_tool_use' })
    res.json({ result: toolUse.input })
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}
