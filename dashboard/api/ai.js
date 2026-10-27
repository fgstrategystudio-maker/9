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

import { tokenValido } from './_auth.js'

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
          tipo: { type: 'string', enum: ['registra_pagamento', 'registra_incasso', 'aggiorna_commessa', 'nuova_commessa', 'aggiungi_nota', 'aggiorna_patrimonio', 'nessuna_azione'] },
          mese: { type: 'string' },
          lordo: { type: 'number' },
          importo: { type: 'number' },
          ore: { type: 'number' },
          id: { type: 'number' },
          voce: { type: 'string', enum: ['cassa', 'crypto', 'bene'] },
          nome: { type: 'string' },
          valore: { type: 'number' },
          campi: {
            type: 'object',
            properties: {
              cliente: { type: 'string' },
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
- registra_pagamento: { tipo, id, mese, importo, ore, testo, motivo } — un singolo pagamento ricevuto da UN cliente (commessa "id") nel "mese"; "ore" = ore REALMENTE lavorate per quel cliente in quel mese, se l'utente le dice (altrimenti ometti il campo); "testo" = nota breve facoltativa (es. "fisso mensile", "extra non chiaro").
- registra_incasso: { tipo, mese, lordo, motivo } — "mese" in italiano con anno (es. "Settembre 2026"); "lordo" = TOTALE lordo REALE incassato in quel mese da tutti i clienti insieme. Sostituisce il valore già registrato per quel mese.
- aggiorna_commessa: { tipo, id, campi, motivo } — "campi" contiene SOLO i campi da cambiare; date inizio/fine in YYYY-MM-DD.
- nuova_commessa: { tipo, campi, motivo } — crea una commessa che NON esiste nel contesto; "campi" con almeno "cliente", e se noti: servizio, tipo ("Mensile" o "Progetto"), inizio, fine, lordoMensile o lordoProgetto, oreMensili, stato (di solito "In corso"). Prima controlla bene che il cliente non sia già tra le commesse (anche con nome scritto diversamente).
- aggiungi_nota: { tipo, id, testo, motivo } — aggiunge una nota alla commessa.
- aggiorna_patrimonio: { tipo, voce, nome, valore, motivo } — aggiorna il patrimonio: voce "cassa" (liquidità sul conto) o "crypto" con il nuovo valore totale in euro; voce "bene" per altri beni (es. "Carte Pokémon", "Orologio") con "nome" e valore attuale. Usalo solo se l'utente dà un valore.
- nessuna_azione: { tipo, motivo } — quando è meglio non agire.

AGGIORNAMENTO MENSILE (il caso più frequente)
Una volta al mese l'utente scrive, per ogni commessa, cose come: incassato lordo del mese, ore lavorate, quando finisce, quanto incasserà nei prossimi mesi e con quante ore. Per ciascuna commessa nominata:
- incassato del mese → registra_pagamento (con "ore" se le ha dette). Se il mese non è indicato, è il mese corrente; se l'utente scrive a inizio mese parlando del mese appena chiuso, usa quel mese.
- data di fine / durata ("finisce a marzo", "altri 3 mesi") → aggiorna_commessa con "fine" (ultimo giorno del mese indicato, YYYY-MM-DD).
- quanto percepirà d'ora in poi (fee mensile) → aggiorna_commessa "lordoMensile" se diverso da quello attuale; per un progetto a corpo usa "lordoProgetto".
- ore previste al mese d'ora in poi → aggiorna_commessa "oreMensili" se diverse. Se dice solo le ore lavorate questo mese e non ha una stima, puoi usarle anche come oreMensili.
- commessa finita → aggiorna_commessa stato "Concluso" (e fine se nota). Cliente nuovo → nuova_commessa.
- Alla fine, se ha dato gli incassi di TUTTI i clienti del mese, aggiungi registra_incasso con la somma esatta (vedi regole sotto); se ne manca qualcuno, dillo nella spiegazione e non inventare.
- Non proporre aggiornamenti per campi che non cambiano.

REGOLE SUGLI INCASSI (importanti: sono soldi veri)
- Per ogni pagamento che l'utente dice di aver ricevuto da un cliente proponi un registra_pagamento su quella commessa (anche due pagamenti dello stesso cliente nello stesso mese = due azioni). Controlla nel contesto "pagamenti" della commessa per non registrare due volte un pagamento già presente.
- Il totale del mese (registra_incasso) è la SOMMA ESATTA dei pagamenti del mese: quelli già registrati nel contesto + quelli nuovi. Nella "spiegazione" scrivi SEMPRE il calcolo esplicito, es. "2.071 + 1.690 + 1.000 + 750 = 5.511 €".
- NON usare mai la stima dai contratti (fee mensili) per riempire il totale del mese, e non sommare fee previste a pagamenti reali. Se l'utente vuole aggiornare il totale del mese ma non sai cosa ha incassato dagli altri clienti attivi, NON indovinare: registra i pagamenti che conosci e usa nessuna_azione per chiedere gli importi mancanti (elencando i clienti attivi senza pagamento nel mese).
- Se l'utente dà direttamente il totale del mese (es. "il totale di settembre è 5.511"), usa quel numero per registra_incasso.
- Il netto lo calcola l'app (fattore ${Math.round((ctx.fattoreNetto ?? 0.7) * 100)}%): tu lavori solo sul lordo.
- Pagamento insolito UNA TANTUM (acconto, sconto, cifra diversa solo per questo mese): NON cambiare la fee della commessa; registra il pagamento reale + aggiungi_nota per tenerne traccia.
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
  if (req.method !== 'POST') return res.status(405).end()
  if (!tokenValido(req)) return res.status(401).json({ error: 'non_autorizzato' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'missing_api_key', message: 'GEMINI_API_KEY non configurata su Vercel.' })
  }

  const { istruzione, contesto, modalita: modalitaRaw } = req.body || {}
  if (!istruzione || typeof istruzione !== 'string' || istruzione.length > 6000) {
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
