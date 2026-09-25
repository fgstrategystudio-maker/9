// Endpoint AI (Google Gemini, tier gratuito di AI Studio): interpreta
// un'istruzione in linguaggio naturale e propone azioni strutturate su
// commesse/incassi. La chiave resta lato server (env GEMINI_API_KEY su
// Vercel). L'app mostra le azioni proposte e le applica solo dopo conferma
// dell'utente: qui non si scrive mai nulla.
//
// Due modalità, come nell'app dieta:
//  - veloce (default): modello lite, risposta in ~1-2 s
//  - preciso: modello pieno con un po' di ragionamento, per casi ambigui
// Se un modello è sovraccarico o non disponibile si passa da soli al
// successivo della catena (fino ai 2.5 come rete di sicurezza).

const CATENE = {
  veloce: ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'],
  preciso: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
}
// Timeout per singola chiamata: un modello che "ragiona" troppo o è appeso
// viene abortito e si passa al successivo della catena.
const TIMEOUT_CALL_MS = { veloce: 12000, preciso: 25000 }
// Tetto complessivo: oltre questo non si provano altri modelli (le funzioni
// Vercel hanno comunque una durata massima).
const DEADLINE_MS = 45000

// Schema della risposta JSON (subset OpenAPI supportato da Gemini)
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    spiegazione: {
      type: 'STRING',
      description: 'Spiegazione breve e chiara, in italiano, di cosa proponi e perché.',
    },
    azioni: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tipo: {
            type: 'STRING',
            enum: ['registra_incasso', 'aggiorna_commessa', 'aggiungi_nota', 'nessuna_azione'],
          },
          mese: { type: 'STRING', description: 'Per registra_incasso: mese in italiano con anno, es. "Settembre 2026".' },
          lordo: { type: 'NUMBER', description: 'Per registra_incasso: totale lordo REALE incassato in quel mese (tutti i clienti).' },
          id: { type: 'NUMBER', description: 'Per aggiorna_commessa/aggiungi_nota: id della commessa.' },
          campi: {
            type: 'OBJECT',
            description: 'Per aggiorna_commessa: solo i campi da cambiare.',
            properties: {
              lordoMensile: { type: 'NUMBER' },
              lordoProgetto: { type: 'NUMBER' },
              oreMensili: { type: 'NUMBER' },
              upsellTarget: { type: 'NUMBER' },
              stato: { type: 'STRING' },
              tipo: { type: 'STRING' },
              inizio: { type: 'STRING', description: 'YYYY-MM-DD' },
              fine: { type: 'STRING', description: 'YYYY-MM-DD' },
              splitMezzoMese: { type: 'BOOLEAN' },
              priorita: { type: 'STRING' },
              servizio: { type: 'STRING' },
              note: { type: 'STRING' },
            },
          },
          testo: { type: 'STRING', description: 'Per aggiungi_nota: testo della nota da aggiungere alla commessa.' },
          motivo: { type: 'STRING', description: 'Motivazione sintetica di questa azione.' },
        },
        required: ['tipo'],
      },
    },
  },
  required: ['spiegazione', 'azioni'],
}

function systemPrompt(ctx) {
  return `Sei l'assistente della Freelance Dashboard di un freelance italiano (SEO/Ads).
Interpreti richieste in linguaggio naturale e rispondi SOLO con il JSON richiesto (spiegazione + azioni).

REGOLE DI DOMINIO
- "incassatoStorico" registra il TOTALE lordo incassato per mese (tutti i clienti insieme); il netto lo calcola l'app (fattore ${Math.round((ctx.fattoreNetto ?? 0.7) * 100)}%). Per registra_incasso indica sempre il totale mese, non il singolo pagamento: se un cliente ha pagato una cifra diversa dal previsto, parti dalla stima o dal valore già registrato del mese e applica la differenza.
- Pagamento insolito UNA TANTUM (acconto, sconto, cifra concordata diversa per questo mese): NON cambiare la fee della commessa; proponi registra_incasso col totale reale del mese + aggiungi_nota sulla commessa per tenerne traccia.
- Cambio DURATURO di accordo (nuova fee mensile, rinnovo, chiusura): proponi aggiorna_commessa (es. lordoMensile, fine, stato).
- Stati validi commessa: "In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso".
- Mesi in italiano con anno, es. "Settembre 2026". Date campi in formato YYYY-MM-DD. Oggi è ${ctx.oggi}.
- Se la richiesta è ambigua o mancano dati per agire in sicurezza, usa nessuna_azione e spiega nel campo motivo cosa manca. Meglio chiedere che sbagliare su dati economici.
- Non inventare importi: usa i numeri della richiesta e del contesto.

CONTESTO ATTUALE (JSON)
${JSON.stringify(ctx, null, 1)}`
}

async function chiamaModello(apiKey, model, system, istruzione, thinkingConfig, timeoutMs) {
  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema: RESPONSE_SCHEMA,
    // Ampio: sui modelli con "thinking" i token di ragionamento contano nel
    // limite di output, e un limite basso tronca il JSON finale.
    maxOutputTokens: 8000,
    temperature: 0.2,
  }
  if (thinkingConfig) generationConfig.thinkingConfig = thinkingConfig
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: istruzione }] }],
          generationConfig,
        }),
      }
    )
    if (!r.ok) return { ok: false, status: r.status, text: await r.text() }
    return { ok: true, data: await r.json() }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, text: `timeout dopo ${Math.round(timeoutMs / 1000)}s` }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function estrai(data) {
  let text = (data.candidates?.[0]?.content?.parts || [])
    .filter((p) => !p.thought) // esclude eventuali riassunti di ragionamento
    .map((p) => p.text || '')
    .join('')
    .trim()
  // Difensivo: alcuni modelli avvolgono comunque il JSON in un fence markdown
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (fence) text = fence[1]
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed.spiegazione === 'string' && Array.isArray(parsed.azioni)) return parsed
  } catch { /* output non JSON: si prova il modello successivo */ }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'missing_api_key', message: 'GEMINI_API_KEY non configurata su Vercel.' })
  }

  const { istruzione, contesto, modalita: modalitaRaw } = req.body || {}
  if (!istruzione || typeof istruzione !== 'string' || istruzione.length > 2000) {
    return res.status(400).json({ error: 'bad_request' })
  }
  const modalita = modalitaRaw === 'preciso' ? 'preciso' : 'veloce'
  const system = systemPrompt(contesto || {})

  // Configurazioni thinking da provare in ordine sullo stesso modello: prima il
  // parametro dei 2.5 (thinkingBudget), poi quello delle generazioni nuove
  // (thinkingLevel), infine nessuna config. Un 400 su "thinking" costa
  // pochissimo e passa subito al tentativo successivo.
  const configThinking = modalita === 'veloce'
    ? [{ thinkingBudget: 0 }, { thinkingLevel: 'low' }, null]
    : [{ thinkingBudget: 512 }, null]

  const t0 = Date.now()
  const errori = []
  const catena = CATENE[modalita]
  for (let i = 0; i < catena.length; i++) {
    if (Date.now() - t0 > DEADLINE_MS) {
      errori.push('tempo esaurito, modelli restanti saltati')
      break
    }
    const model = catena[i]
    try {
      let r = null
      for (const cfg of configThinking) {
        r = await chiamaModello(apiKey, model, system, istruzione, cfg, TIMEOUT_CALL_MS[modalita])
        // Config thinking non supportata da questo modello → prova la successiva
        if (!r.ok && r.status === 400 && /thinking/i.test(r.text || '')) continue
        break
      }
      if (!r.ok) {
        errori.push(`${model}: ${r.status ? `HTTP ${r.status}` : r.text}`)
        continue // sovraccarico (429/503), modello non disponibile (404), timeout, ecc. → prossimo
      }
      const parsed = estrai(r.data)
      if (!parsed) {
        errori.push(`${model}: output non valido`)
        continue
      }
      return res.json({ result: parsed, modello: model, fallback: i > 0, ms: Date.now() - t0 })
    } catch (err) {
      errori.push(`${model}: ${err.message}`)
    }
  }
  res.status(502).json({ error: 'all_models_failed', message: errori.join(' · ') || 'nessun modello disponibile' })
}
