// Endpoint AI (Google Gemini, tier gratuito di AI Studio): interpreta
// un'istruzione in linguaggio naturale e propone azioni strutturate su
// commesse/incassi. La chiave resta lato server (env GEMINI_API_KEY su
// Vercel). L'app mostra le azioni proposte e le applica solo dopo conferma
// dell'utente: qui non si scrive mai nulla.
//
// Due modalità, come nell'app dieta:
//  - veloce (default): modello lite, risposta in pochi secondi
//  - preciso: modello pieno, per casi ambigui
//
// Massima compatibilità tra generazioni di modelli:
//  - niente responseSchema (le generazioni nuove lo rifiutano): JSON forzato
//    con responseMimeType + contratto descritto nel prompt, validato poi qui
//    e nel client prima di applicare qualunque modifica
//  - cascata di config "thinking" per modello (budget → level → nessuna)
//  - timeout per chiamata e tetto complessivo; su errore si passa al
//    modello successivo, con gli alias -latest come paracadute
//  - in caso di fallimento totale, l'errore riporta la risposta esatta di
//    Google per ogni modello provato

const CATENE = {
  veloce: ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest'],
  preciso: ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'],
}
// Config thinking da provare in ordine sullo stesso modello: prima il
// parametro dei 2.5 (thinkingBudget), poi quello delle generazioni nuove
// (thinkingLevel), infine nessuna. Un 400 su "thinking" costa ~0 e passa
// subito al tentativo successivo.
const CONFIG_THINKING = {
  veloce: [{ thinkingBudget: 0 }, { thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }, null],
  preciso: [{ thinkingBudget: 512 }, { thinkingLevel: 'low' }, null],
}
// Timeout per singola chiamata: un modello appeso o che ragiona troppo viene
// abortito e si passa al successivo della catena.
const TIMEOUT_CALL_MS = { veloce: 15000, preciso: 30000 }
// Tetto complessivo (le funzioni Vercel hanno comunque una durata massima).
const DEADLINE_MS = 45000

function systemPrompt(ctx) {
  return `Sei l'assistente della Freelance Dashboard di un freelance italiano (SEO/Ads).
Interpreti richieste in linguaggio naturale e rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo prima o dopo e senza blocchi markdown.

FORMATO DELLA RISPOSTA (JSON)
{
  "spiegazione": "spiegazione breve e chiara, in italiano, di cosa proponi e perché",
  "azioni": [
    // una o più azioni, ciascuna con "tipo" tra:
    // 1) registra_incasso — { "tipo": "registra_incasso", "mese": "Settembre 2026", "lordo": 4100, "motivo": "..." }
    //    "mese" in italiano con anno; "lordo" = totale lordo REALE incassato in quel mese (tutti i clienti).
    // 2) aggiorna_commessa — { "tipo": "aggiorna_commessa", "id": 3, "campi": { ... }, "motivo": "..." }
    //    "campi" contiene SOLO i campi da cambiare tra: lordoMensile, lordoProgetto, oreMensili,
    //    upsellTarget, stato, tipo, inizio (YYYY-MM-DD), fine (YYYY-MM-DD), splitMezzoMese, priorita, servizio, note.
    // 3) aggiungi_nota — { "tipo": "aggiungi_nota", "id": 3, "testo": "...", "motivo": "..." }
    // 4) nessuna_azione — { "tipo": "nessuna_azione", "motivo": "cosa manca o perché non agire" }
  ]
}

REGOLE DI DOMINIO
- "incassatoStorico" registra il TOTALE lordo incassato per mese (tutti i clienti insieme); il netto lo calcola l'app (fattore ${Math.round((ctx.fattoreNetto ?? 0.7) * 100)}%). Per registra_incasso indica sempre il totale mese, non il singolo pagamento: se un cliente ha pagato una cifra diversa dal previsto, parti dalla stima o dal valore già registrato del mese e applica la differenza.
- Pagamento insolito UNA TANTUM (acconto, sconto, cifra concordata diversa per questo mese): NON cambiare la fee della commessa; proponi registra_incasso col totale reale del mese + aggiungi_nota sulla commessa per tenerne traccia.
- Cambio DURATURO di accordo (nuova fee mensile, rinnovo, chiusura): proponi aggiorna_commessa (es. lordoMensile, fine, stato).
- Stati validi commessa: "In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso".
- Mesi in italiano con anno, es. "Settembre 2026". Oggi è ${ctx.oggi}.
- Se la richiesta è ambigua o mancano dati per agire in sicurezza, usa nessuna_azione e spiega nel campo motivo cosa manca. Meglio chiedere che sbagliare su dati economici.
- Non inventare importi: usa i numeri della richiesta e del contesto. Sii diretto, niente premesse.

CONTESTO ATTUALE (JSON)
${JSON.stringify(ctx, null, 1)}`
}

async function chiamaModello(apiKey, model, system, istruzione, thinkingConfig, timeoutMs) {
  const generationConfig = {
    responseMimeType: 'application/json',
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
      let r = null
      for (const cfg of CONFIG_THINKING[modalita]) {
        r = await chiamaModello(apiKey, model, system, istruzione, cfg, TIMEOUT_CALL_MS[modalita])
        // Config thinking non supportata da questo modello → prova la successiva
        if (!r.ok && r.status === 400 && /thinking/i.test(r.text || '')) continue
        break
      }
      if (!r.ok) {
        errori.push(`${model}: ${r.status ? `HTTP ${r.status} — ${dettaglio(r.text)}` : dettaglio(r.text)}`)
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
