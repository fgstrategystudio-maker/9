// Endpoint AI (Google Gemini, tier gratuito di AI Studio): interpreta
// un'istruzione in linguaggio naturale e propone azioni strutturate su
// commesse/incassi. La chiave resta lato server (env GEMINI_API_KEY su
// Vercel). L'app mostra le azioni proposte e le applica solo dopo conferma
// dell'utente: qui non si scrive mai nulla.
//
// Il formato della richiesta ricalca ESATTAMENTE quello dell'app dieta
// (v16), verificato funzionante sugli stessi modelli con la stessa chiave:
//  - responseSchema "spoglio" (solo type/enum/items/properties/required +
//    propertyOrdering, in maiuscolo, SENZA description: i 3.5 rifiutano
//    campi extra con 400)
//  - thinking: per i gemini-3* solo thinkingLevel (minimal per i lite,
//    low per i full), mai thinkingBudget; su 400 si ritenta senza
//  - niente maxOutputTokens né temperature nel payload
// In più: timeout per chiamata, catena di fallback tra modelli ed errori
// con il corpo esatto della risposta di Google.

const MODELLO_VELOCE = 'gemini-3.5-flash-lite'
const MODELLO_PRECISO = 'gemini-3.5-flash'
const CATENE = {
  veloce: [MODELLO_VELOCE, MODELLO_PRECISO],
  preciso: [MODELLO_PRECISO, MODELLO_VELOCE],
}
// Timeout per singola chiamata: un modello appeso o che ragiona troppo viene
// abortito e si passa al successivo della catena.
const TIMEOUT_CALL_MS = { veloce: 15000, preciso: 30000 }
// Tetto complessivo (le funzioni Vercel hanno comunque una durata massima).
const DEADLINE_MS = 45000

// Schema delle azioni in stile JSON Schema minimale; viene convertito nel
// formato Gemini da toGeminiSchema (come nell'app dieta). Le semantiche dei
// campi sono spiegate nel prompt, NON qui: le description causano 400.
const AZIONI_SCHEMA = {
  type: 'object',
  properties: {
    spiegazione: { type: 'string' },
    azioni: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['registra_incasso', 'aggiorna_commessa', 'aggiungi_nota', 'nessuna_azione'] },
          mese: { type: 'string' },
          lordo: { type: 'number' },
          id: { type: 'number' },
          campi: {
            type: 'object',
            properties: {
              lordoMensile: { type: 'number' },
              lordoProgetto: { type: 'number' },
              oreMensili: { type: 'number' },
              upsellTarget: { type: 'number' },
              stato: { type: 'string' },
              tipo: { type: 'string' },
              inizio: { type: 'string' },
              fine: { type: 'string' },
              splitMezzoMese: { type: 'boolean' },
              priorita: { type: 'string' },
              servizio: { type: 'string' },
              note: { type: 'string' },
            },
          },
          testo: { type: 'string' },
          motivo: { type: 'string' },
        },
        required: ['tipo'],
      },
    },
  },
  required: ['spiegazione', 'azioni'],
}

// Conversione nello schema Gemini (identica a quella dell'app dieta):
// tiene solo i campi accettati, tipi in maiuscolo, aggiunge propertyOrdering.
function toGeminiSchema(sc) {
  const out = { type: sc.type.toUpperCase() }
  if (sc.enum) out.enum = sc.enum
  if (sc.items) out.items = toGeminiSchema(sc.items)
  if (sc.properties) {
    out.properties = Object.fromEntries(Object.entries(sc.properties).map(([k, v]) => [k, toGeminiSchema(v)]))
    out.propertyOrdering = Object.keys(sc.properties)
  }
  if (sc.required) out.required = sc.required
  return out
}

function systemPrompt(ctx) {
  return `Sei l'assistente della Freelance Dashboard di un freelance italiano (SEO/Ads).
Interpreti richieste in linguaggio naturale e rispondi SOLO col JSON richiesto: "spiegazione" (breve, in italiano) e "azioni".

TIPI DI AZIONE
- registra_incasso: { tipo, mese, lordo, motivo } — "mese" in italiano con anno (es. "Settembre 2026"); "lordo" = totale lordo REALE incassato in quel mese (tutti i clienti insieme).
- aggiorna_commessa: { tipo, id, campi, motivo } — "campi" contiene SOLO i campi da cambiare; date inizio/fine in YYYY-MM-DD.
- aggiungi_nota: { tipo, id, testo, motivo } — aggiunge una nota alla commessa.
- nessuna_azione: { tipo, motivo } — quando è meglio non agire.

REGOLE DI DOMINIO
- "incassatoStorico" registra il TOTALE lordo per mese; il netto lo calcola l'app (fattore ${Math.round((ctx.fattoreNetto ?? 0.7) * 100)}%). Per registra_incasso indica sempre il totale mese, non il singolo pagamento: se un cliente ha pagato una cifra diversa dal previsto, parti dalla stima o dal valore già registrato del mese e applica la differenza.
- Pagamento insolito UNA TANTUM (acconto, sconto, cifra concordata diversa per questo mese): NON cambiare la fee della commessa; proponi registra_incasso col totale reale del mese + aggiungi_nota sulla commessa per tenerne traccia.
- Cambio DURATURO di accordo (nuova fee mensile, rinnovo, chiusura): proponi aggiorna_commessa (es. lordoMensile, fine, stato).
- Stati validi commessa: "In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso".
- Oggi è ${ctx.oggi}.
- Se la richiesta è ambigua o mancano dati per agire in sicurezza, usa nessuna_azione e spiega nel motivo cosa manca. Meglio chiedere che sbagliare su dati economici.
- Non inventare importi: usa i numeri della richiesta e del contesto. Sii diretto.

CONTESTO ATTUALE (JSON)
${JSON.stringify(ctx, null, 1)}`
}

async function chiamaModello(apiKey, model, system, istruzione, withThinking, timeoutMs) {
  // Meno "ragionamento" = risposta molto più rapida; per proporre 1-2 azioni basta.
  const thinking = /^gemini-3/.test(model) ? { thinkingLevel: /lite/.test(model) ? 'minimal' : 'low' } : null
  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema: toGeminiSchema(AZIONI_SCHEMA),
    ...(withThinking && thinking ? { thinkingConfig: thinking } : {}),
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        signal: ctrl.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: istruzione }] }],
          generationConfig,
        }),
      }
    )
    if (!r.ok) return { ok: false, status: r.status, text: await r.text(), hadThinking: !!(withThinking && thinking) }
    return { ok: true, data: await r.json() }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, text: `timeout dopo ${Math.round(timeoutMs / 1000)}s` }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function estrai(data) {
  if (data.promptFeedback?.blockReason) return { errore: 'richiesta bloccata dal modello, prova a riformularla' }
  const cand = data.candidates?.[0]
  const text = (cand?.content?.parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join('')
  if (!text) return { errore: cand?.finishReason === 'MAX_TOKENS' ? 'risposta troppo lunga' : 'risposta vuota' }
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed.spiegazione === 'string' && Array.isArray(parsed.azioni)) return { parsed }
  } catch { /* output non JSON: si prova il modello successivo */ }
  return { errore: 'output non valido' }
}

// Compatta il corpo d'errore di Google in una riga leggibile
function dettaglio(text) {
  return String(text || '').replace(/\s+/g, ' ').slice(0, 160)
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
      let r = await chiamaModello(apiKey, model, system, istruzione, true, TIMEOUT_CALL_MS[modalita])
      // Come nell'app dieta: 400 con thinking incluso → ritenta senza thinking
      if (!r.ok && r.status === 400 && r.hadThinking) {
        r = await chiamaModello(apiKey, model, system, istruzione, false, TIMEOUT_CALL_MS[modalita])
      }
      if (!r.ok) {
        errori.push(`${model}: ${r.status ? `HTTP ${r.status} — ${dettaglio(r.text)}` : dettaglio(r.text)}`)
        continue // sovraccarico (429/503), modello non disponibile (404), timeout, ecc. → prossimo
      }
      const { parsed, errore } = estrai(r.data)
      if (!parsed) {
        errori.push(`${model}: ${errore}`)
        continue
      }
      return res.json({ result: parsed, modello: model, fallback: i > 0, ms: Date.now() - t0 })
    } catch (err) {
      errori.push(`${model}: ${err.message}`)
    }
  }
  res.status(502).json({ error: 'all_models_failed', message: errori.join(' · ') || 'nessun modello disponibile' })
}
