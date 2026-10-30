"""Commenti testuali dei report.

Senza ANTHROPIC_API_KEY i testi sono generati da regole (costo zero).
Con la chiave, Claude scrive il commento per il cliente e la lettura interna
partendo dagli stessi numeri e punti di attenzione calcolati da analisi.py.
"""

from __future__ import annotations

import json
import logging
import os

from .analisi import Analisi, Kpi

log = logging.getLogger(__name__)

MODELLO_PREDEFINITO = "claude-opus-5-5"


def _fmt(k: Kpi) -> str:
    v = k.valore
    if v is None:
        return "n.d."
    if k.formato == "valuta":
        return f"{v:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
    if k.formato == "percentuale":
        return f"{v * 100:.1f}%".replace(".", ",")
    if k.formato == "roas":
        return f"{v:.2f}".replace(".", ",")
    if k.formato == "decimale":
        if abs(v - round(v)) < 0.05:
            return f"{v:,.0f}".replace(",", ".")
        return f"{v:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{v:,.0f}".replace(",", ".")


def _var(d: float | None) -> str:
    if d is None:
        return ""
    if abs(d) < 0.005:
        return " (stabile)"
    return f" ({d * 100:+.0f}%)".replace(".", ",")


# ---------------------------------------------------------------- senza AI

# Come presentare al cliente le azioni che nascono dai punti di attenzione
# (le aree puramente interne, come il tracciamento, non compaiono).
PASSI_CLIENTE = {
    "Budget": "Riallineare la spesa giornaliera al budget mensile concordato.",
    "Efficienza": "Concentrare il budget sulle campagne che portano risultati al costo più basso.",
    "Risultati": "Analizzare le campagne che hanno perso risultati e intervenire su offerte e annunci.",
    "Annunci": "Aggiornare i testi degli annunci per renderli più pertinenti e aumentare i clic.",
    "Costi": "Rivedere la strategia di offerta per contenere il costo per clic.",
    "Campagne": "Ottimizzare o ridimensionare le campagne meno efficienti.",
    "Crescita": "Valutare un aumento di budget sulle campagne più redditizie, oggi limitate dal budget.",
    "Competitività": "Migliorare qualità di annunci e pagine di destinazione per guadagnare visibilità.",
    "Qualità": "Migliorare qualità di annunci e pagine di destinazione per guadagnare visibilità.",
    "Keyword negative": "Escludere le ricerche non pertinenti per ridurre la spesa inutile.",
}


def _andamento(d: float, su: str = "aumentate", giu: str = "diminuite", fermo: str = "stabili") -> str:
    if abs(d) < 0.03:
        return fermo
    return f"{su if d > 0 else giu} del {abs(d) * 100:.0f}%"


def commento_regole(a: Analisi) -> None:
    k = a.kpi_per_chiave
    p = a.periodi
    risultato = "valore delle conversioni" if a.cliente.ecommerce else "conversioni"
    e = a.etichette
    frasi = [
        f"Nel periodo {p.corrente.etichetta()} l'investimento in Google Ads è stato di "
        f"{_fmt(k['costo'])}, con {_fmt(k['clic'])} clic e {_fmt(k['conversioni'])} {e['risultati']}"
        + (f" a un costo medio di {_fmt(k['cpa'])} ciascuna." if k["cpa"].valore else ".")
    ]
    if a.cliente.negozio:
        frasi.append(
            f"Le persone che hanno chiesto le indicazioni stradali per raggiungere il locale sono state "
            f"{_fmt(k['indicazioni'])}{_var(k['indicazioni'].delta)}."
            + (f" Le visite sono stimate come il {a.cliente.quota_visite_indicazioni * 100:.0f}% delle "
               "indicazioni stradali." if a.dati.visite_stimate else " Le visite sono misurate da Google.")
        )
    if k["conversioni"].delta is not None:
        frase = (f"Rispetto al periodo precedente ({p.precedente.etichetta()}) le {e['risultati']} giornaliere "
                 f"sono {_andamento(k['conversioni'].delta)}")
        if k["cpa"].delta is not None:
            frase += f" e il {e['costo_lungo'].lower()} è {_andamento(k['cpa'].delta, 'salito', 'sceso', 'stabile')}"
        frasi.append(frase + ".")
    if a.cliente.ecommerce and k.get("roas") and k["roas"].valore:
        frasi.append(f"Il ROAS è {_fmt(k['roas'])}{_var(k['roas'].delta)}, misurato sul {risultato}.")
    if a.pacing and not p.mese_chiuso:
        frasi.append(
            f"Il budget del mese è stato utilizzato al {a.pacing.quota_spesa * 100:.0f}%; "
            f"al ritmo attuale la spesa a fine mese sarà di circa {a.pacing.proiezione:,.0f} €.".replace(",", ".")
        )
    a.commento_cliente = " ".join(frasi)
    passi = []
    for pt in a.punti:
        passo = PASSI_CLIENTE.get(pt.area)
        if passo and passo not in passi:
            passi.append(passo)
    a.prossimi_passi = passi[:4] or ["Proseguire con l'ottimizzazione continua di keyword, annunci e offerte."]

    alte = sum(1 for pt in a.punti if pt.gravita == "alta" and not pt.opportunita)
    medie = sum(1 for pt in a.punti if pt.gravita == "media" and not pt.opportunita)
    a.sintesi_interna = (
        f"{alte} punti ad alta priorità, {medie} a media priorità. "
        + (f"Primo da guardare: {a.punti[0].titolo.lower()}." if a.punti else "Nessuna anomalia rilevata dalle regole.")
    )
    migliori = sorted((k_ for k_ in a.kpi if k_.esito != "neutro"), key=lambda x: -abs(x.delta or 0))[:4]
    a.cosa_e_cambiato = [f"{x.nome}: {_fmt(x)}{_var(x.delta)} vs periodo precedente" for x in migliori]
    a.cosa_migliorare = [pt.azione for pt in a.punti][:5]


# ---------------------------------------------------------------- con Claude

SCHEMA = {
    "type": "object",
    "properties": {
        "commento_cliente": {"type": "string"},
        "prossimi_passi": {"type": "array", "items": {"type": "string"}},
        "sintesi_interna": {"type": "string"},
        "cosa_e_cambiato": {"type": "array", "items": {"type": "string"}},
        "cosa_migliorare": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["commento_cliente", "prossimi_passi", "sintesi_interna", "cosa_e_cambiato", "cosa_migliorare"],
    "additionalProperties": False,
}

ISTRUZIONI = """Sei un consulente Google Ads senior che lavora in Italia. Ricevi i dati di un account \
(KPI, confronti, campagne, punti di attenzione già calcolati da regole, termini di ricerca, modifiche) \
e scrivi due cose diverse, in italiano:

1. Per il CLIENTE (commento_cliente, prossimi_passi): linguaggio chiaro e professionale, niente gergo \
tecnico non spiegato, 2-3 paragrafi brevi. Racconta i risultati del periodo e il confronto, spiega le \
cause probabili, onesto sui problemi ma senza allarmismi e senza dettagli operativi interni (errori di \
tracciamento, sprechi, modifiche fatte o non fatte). prossimi_passi: 3-4 azioni concrete che faremo.

2. Per il CONSULENTE (sintesi_interna, cosa_e_cambiato, cosa_migliorare): un ragionamento completo, \
spiegato bene, come lo scriverebbe un analista senior al titolare dell'agenzia. Non elencare numeri: \
spiega cosa significano, perché sono successi e cosa comportano.
- sintesi_interna: tre paragrafi separati da una riga vuota. Il primo: com'è andato il periodo e il \
risultato principale, con i 2-3 numeri che contano e il confronto con il periodo precedente. Il secondo: \
il perché, collegando i numeri alle cause (campagne nuove o cambiate, budget, posizione nelle aste, \
canali, giorni e orari, stagionalità, attribuzione ancora da chiudere) e dicendo quanto sei sicuro. \
Il terzo: la priorità numero uno e cosa succede se non si interviene.
- cosa_e_cambiato: 4-6 punti; ognuno di 2-3 frasi con il numero, la causa probabile e cosa implica.
- cosa_migliorare: 3-5 azioni ordinate per impatto; per ognuna cosa fare in concreto (campagna, \
importo, keyword), perché, l'effetto atteso e come lo verifichiamo il mese dopo.

storia_del_cliente, se presente, è scritta dal consulente: decisioni prese, campagne aggiunte, cosa è \
già stato detto al cliente. Usala per spiegare le variazioni (per esempio una campagna nuova o una pulizia dei \
termini) e non attribuire a stagionalità ciò che è spiegato da un intervento.

Il risultato principale è indicato in risultato_principale: per i locali sono le visite al negozio \
(se come_si_misura indica una stima, dillo in modo chiaro ma senza sminuire il dato) e le indicazioni \
stradali sono il segnale che le alimenta. Usa solo i numeri forniti, non inventarne. Le variazioni dei volumi sono già calcolate sulla media \
giornaliera. Formatta importi e percentuali all'italiana (1.234,56 €; 12,5%)."""


def _contesto(a: Analisi) -> dict:
    p = a.periodi
    return {
        "cliente": a.cliente.nome,
        "obiettivo": a.cliente.obiettivo,
        "risultato_principale": a.etichette["risultati"],
        "come_si_misura": (
            None if not a.cliente.negozio else
            f"stima: {a.cliente.quota_visite_indicazioni * 100:.0f}% delle indicazioni stradali"
            if a.dati.visite_stimate else "visite al negozio misurate da Google"
        ),
        "note_cliente": a.cliente.note,
        "storia_del_cliente": "\n\n".join(x for x in (a.cliente.contesto_gruppo, a.cliente.contesto) if x) or None,
        "target": {"budget_mensile": a.cliente.budget_mensile, "cpa": a.cliente.cpa_target,
                   "roas": a.cliente.roas_target},
        "momento": p.titolo,
        "periodo": p.corrente.etichetta(),
        "confronto": p.precedente.etichetta(),
        "confronto_anno_precedente": p.anno_prec.etichetta() if p.anno_prec else None,
        "kpi": [{"nome": k.nome, "valore": _fmt(k), "variazione": k.delta, "variazione_anno": k.delta_ap}
                for k in a.kpi],
        "budget": None if not a.pacing else {
            "budget": round(a.pacing.budget), "speso": round(a.pacing.speso),
            "proiezione_fine_mese": round(a.pacing.proiezione), "stimato": a.pacing.budget_stimato,
        },
        "campagne": [{
            "nome": r.nome, "tipo": r.tipo, "costo": round(r.m.costo, 2), "risultati": round(r.m.conversioni, 1),
            "indicazioni_stradali": round(r.m.indicazioni, 1) if a.cliente.negozio else None,
            "cpa": round(r.m.cpa, 2) if r.m.cpa else None, "roas": round(r.m.roas, 2) if r.m.roas else None,
            "costo_prec": round(r.prec.costo, 2) if r.prec else None,
            "risultati_prec": round(r.prec.conversioni, 1) if r.prec else None,
            "persa_budget": r.m.persa_budget, "persa_ranking": r.m.persa_ranking,
        } for r in a.campagne[:15]],
        "punti_attenzione": [{"gravita": pt.gravita, "titolo": pt.titolo, "dettaglio": pt.dettaglio,
                              "opportunita": pt.opportunita} for pt in a.punti],
        "termini_senza_risultati": [{"termine": t.termine, "costo": round(t.costo, 2)} for t in a.sprechi[:15]],
        "modifiche": [{"quando": m.quando.strftime("%Y-%m-%d"), "risorsa": m.risorsa, "operazione": m.operazione,
                       "campagna": m.campagna, "campi": m.campi[:5]} for m in a.modifiche],
    }


def commento_ai(a: Analisi) -> bool:
    """Prova a scrivere i commenti con Claude. Restituisce False se non configurato o in errore
    (in quel caso restano i testi delle regole)."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False
    import anthropic

    client = anthropic.Anthropic()
    try:
        risposta = client.beta.messages.create(
            model=os.environ.get("CLAUDE_MODEL", MODELLO_PREDEFINITO),
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={
                "effort": os.environ.get("CLAUDE_EFFORT", "medium"),
                "format": {"type": "json_schema", "schema": SCHEMA},
            },
            system=ISTRUZIONI,
            messages=[{"role": "user", "content": json.dumps(_contesto(a), ensure_ascii=False, default=str)}],
        )
    except anthropic.APIStatusError as e:
        log.warning("Commento AI non disponibile (HTTP %s): uso i testi automatici", e.status_code)
        return False
    except anthropic.APIConnectionError:
        log.warning("Commento AI non disponibile (connessione): uso i testi automatici")
        return False

    if risposta.stop_reason != "end_turn":
        log.warning("Commento AI interrotto (%s): uso i testi automatici", risposta.stop_reason)
        return False
    testo = next((b.text for b in risposta.content if b.type == "text"), "")
    try:
        dati = json.loads(testo)
    except json.JSONDecodeError:
        log.warning("Commento AI non leggibile: uso i testi automatici")
        return False

    a.commento_cliente = dati["commento_cliente"]
    a.prossimi_passi = dati["prossimi_passi"]
    a.sintesi_interna = dati["sintesi_interna"]
    a.cosa_e_cambiato = dati["cosa_e_cambiato"]
    a.cosa_migliorare = dati["cosa_migliorare"]
    a.commento_ai = True
    return True


def scrivi_commenti(a: Analisi) -> None:
    commento_regole(a)
    commento_ai(a)
