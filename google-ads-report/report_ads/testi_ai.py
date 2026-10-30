"""Testi dei report PDF dei locali scritti da Claude.

I report vengono prima costruiti con i testi automatici (regole). Se ANTHROPIC_API_KEY è
configurata, Claude riceve il report già impaginato (tabelle, riquadri, testi), lo storico dei
mesi e le note del consulente, e riscrive ogni testo ragionando sui risultati del mese. Se la
chiamata non riesce, restano i testi automatici: il report parte comunque.
"""

from __future__ import annotations

import html
import json
import logging
import os


from .analisi import Analisi
from .commento import MODELLO_PREDEFINITO
from .report_locali import Passo, Riga, VistaGruppo, md

log = logging.getLogger(__name__)

ISTRUZIONI = """Sei il consulente Google Ads che segue questi ristoranti e scrivi, in italiano, i testi del \
report mensile per il cliente. Ricevi il report già impaginato (tabelle e riquadri con i numeri), lo storico \
dei mesi, lo stato delle campagne, le note del consulente e i testi attuali, scritti da regole automatiche.

Il report fa parte di una serie: il cliente ha già letto i report dei mesi precedenti.
- "storia_del_cliente" (del gruppo) e "storia_del_locale" sono scritte dal consulente: quando è partita la gestione, \
le decisioni prese, cosa abbiamo già detto al cliente nei report precedenti e con quali numeri, le regole \
concordate. Usala per dare continuità al racconto (riprendi ciò che avevamo annunciato e dì com'è andata), per \
spiegare le variazioni con i cambiamenti fatti e per non contraddire i report già inviati. È materiale interno: \
non citarla come documento e non riportare al cliente considerazioni sul compenso o sui ricavi del consulente, \
trattative o valutazioni interne, salvo ciò che è già stato detto al cliente.
- "storico_mensile" ha i totali mese per mese dall'inizio della gestione (il primo e l'ultimo mese possono \
essere parziali: guarda "giorni" e confronta le medie al giorno). Le visite dei mesi passati sono consolidate, \
quelle dell'ultimo mese no.
- "report_precedenti" contiene i numeri e i testi dei report inviati nei mesi scorsi: riprendi il filo \
(cosa avevamo annunciato, cosa è successo dopo) senza ripetere le stesse frasi.
- "visite_mese_precedente" confronta le visite scritte nel report del mese scorso con quelle di oggi.
- Se un locale ha più campagne (per esempio Performance Max e Search brand), il risultato da commentare è il \
totale del locale; spiega il ruolo di ciascuna campagna e perché la Performance Max può sembrare peggiorare \
quando le ricerche sul nome passano alla campagna brand.

Riscrivi ogni testo indicato in "testi_da_scrivere", mantenendo la stessa chiave e lo stesso tipo \
(paragrafo, elenco di punti, elenco di passi). Per ogni testo:
- Ragiona sui numeri: spiega cosa è successo, perché (canali, lingue, giorni, budget, apprendimento, \
stagionalità, modifiche fatte), cosa significa per il ristorante. Collega il mese allo storico \
(tendenza di più mesi, anno precedente se presente), non limitarti a ripetere la tabella.
- Usa solo numeri presenti nei dati, scritti all'italiana come nel report (€1.234,56; 12,5%; +8%). \
Non inventare dati, cause certe o interventi non indicati nelle note o nelle modifiche.
- Tono: professionale, concreto, chiaro per un ristoratore; niente gergo non spiegato, niente allarmismi, \
onesto sui cali. Niente dettagli interni (errori di tracciamento, problemi di configurazione).
- Lunghezza simile al testo attuale (al massimo poco di più). Puoi usare **grassetto** per i numeri chiave, \
niente altro markdown. Gli elenchi hanno 2-5 punti brevi.
- Le visite dell'ultimo mese sono provvisorie (Google le attribuisce fino a 30 giorni dopo): non presentarle \
come un calo definitivo. Se sono stimate dalle indicazioni stradali, dillo senza sminuirle.
- I prossimi passi sono azioni concrete del consulente; includi sempre quelli scritti nelle note del \
consulente, con parole tue se serve."""


def _testo(x) -> str:
    """Markup del report -> markdown semplice, per Claude."""
    s = str(x)
    return html.unescape(s.replace("<strong>", "**").replace("</strong>", "**"))


def _schema(slot: dict) -> dict:
    voce_passo = {"type": "object", "properties": {"titolo": {"type": "string"}, "dettaglio": {"type": "string"}},
                  "required": ["titolo", "dettaglio"], "additionalProperties": False}
    tipi = {"paragrafo": {"type": "string"},
            "elenco": {"type": "array", "items": {"type": "string"}},
            "passi": {"type": "array", "items": voce_passo}}
    return {"type": "object", "properties": {k: tipi[v["tipo"]] for k, v in slot.items()},
            "required": list(slot), "additionalProperties": False}


def _chiama(contesto: dict, slot: dict, istruzioni: str | None = None) -> dict | None:
    if not os.environ.get("ANTHROPIC_API_KEY") or not slot:
        return None
    import anthropic

    contesto = dict(contesto, testi_da_scrivere=slot)
    try:
        # In streaming: con risposte lunghe la libreria non accetta la chiamata semplice.
        with anthropic.Anthropic().beta.messages.stream(
            model=os.environ.get("CLAUDE_MODEL", MODELLO_PREDEFINITO),
            max_tokens=32000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": os.environ.get("CLAUDE_EFFORT", "high"),
                           "format": {"type": "json_schema", "schema": _schema(slot)}},
            system=istruzioni or ISTRUZIONI,
            messages=[{"role": "user", "content": json.dumps(contesto, ensure_ascii=False, default=str)}],
        ) as flusso:
            risposta = flusso.get_final_message()
    except anthropic.APIStatusError as e:
        # Il messaggio di errore dell'API descrive la richiesta (schema, limiti), non i dati dei clienti.
        dettaglio = ""
        try:
            dettaglio = str((e.body or {}).get("error", {}).get("message", ""))[:200]
        except Exception:  # noqa: BLE001
            pass
        log.warning("Testi AI del report non disponibili (HTTP %s %s): uso i testi automatici", e.status_code, dettaglio)
        return None
    except anthropic.APIConnectionError:
        log.warning("Testi AI del report non disponibili (connessione): uso i testi automatici")
        return None
    except Exception as e:  # qualunque altro errore: il report parte con i testi automatici
        log.warning("Testi AI del report non disponibili (%s): uso i testi automatici", type(e).__name__)
        return None
    if risposta.stop_reason != "end_turn":
        log.warning("Testi AI del report interrotti (%s): uso i testi automatici", risposta.stop_reason)
        return None
    try:
        dati = json.loads(next((b.text for b in risposta.content if b.type == "text"), ""))
    except json.JSONDecodeError:
        log.warning("Testi AI del report non leggibili: uso i testi automatici")
        return None
    # Si tengono solo i testi validi; quelli vuoti restano automatici.
    buoni = {}
    for k, v in dati.items():
        if k not in slot:
            continue
        if isinstance(v, str) and v.strip():
            buoni[k] = v.strip()
        elif isinstance(v, list) and v and all((x.strip() if isinstance(x, str) else x.get("titolo", "").strip()) for x in v):
            buoni[k] = v
    return buoni


def _storico(a: Analisi) -> dict:
    """Totali per mese (ultimi mesi e stesso mese dell'anno precedente) e contesto del locale."""
    from .report_locali import azioni

    d, per = a.dati, a.periodi
    mesi = []
    for nome, intervallo, dp in (("due mesi prima", per.due_mesi_prima, d.due_mesi_prima),
                                 ("mese precedente", per.precedente, d.precedente),
                                 ("mese del report", per.corrente, d.corrente),
                                 ("stesso mese, anno precedente", per.anno_prec, d.anno_prec)):
        if not intervallo or not dp or dp.totale.costo <= 0:
            continue
        m = dp.totale
        mesi.append({"periodo": nome, "date": intervallo.etichetta(), "giorni": intervallo.giorni,
                     "spesa": round(m.costo, 2), "impressioni": round(m.impressioni), "clic": round(m.clic),
                     "conversioni_azioni": round(azioni(m), 1), "indicazioni_stradali": round(m.indicazioni, 1),
                     "visite_in_negozio": round(m.conversioni, 1), "contatti": round(m.contatti, 1)})
    campagne = [{"nome": c.nome, "tipo": c.tipo, "stato": c.stato_primario, "motivi": c.motivi_stato,
                 "budget_giornaliero": c.budget_giornaliero, "spesa": round(c.metriche.costo, 2),
                 "azioni": round(azioni(c.metriche), 1), "visite": round(c.metriche.conversioni, 1)}
                for c in d.corrente.campagne.values() if c.metriche.costo > 0]
    return {
        "locale": a.cliente.nome,
        "descrizione": a.cliente.descrizione,
        "visite": "stimate dalle indicazioni stradali" if d.visite_stimate else "misurate da Google",
        "mese_chiuso": per.mese_chiuso,
        "mesi_del_report": mesi,
        "storico_mensile": [{
            "mese": f"{s.mese:%Y-%m}", "giorni": s.giorni, "spesa": round(s.metriche.costo, 2),
            "impressioni": round(s.metriche.impressioni), "clic": round(s.metriche.clic),
            "azioni": round(azioni(s.metriche), 1), "indicazioni_stradali": round(s.metriche.indicazioni, 1),
            "contatti": round(s.metriche.contatti, 1), "visite_in_negozio": round(s.metriche.conversioni, 1),
        } for s in d.storico if s.metriche.costo > 0],
        "visite_mese_precedente": None if not a.attribuzione else {
            "scritte_nel_report_precedente": a.attribuzione[0], "oggi_consolidate": round(a.attribuzione[1], 1)},
        "storia_del_locale": a.cliente.contesto or None,
        "campagne": campagne,
        "modifiche_del_periodo": sorted({f"{m.risorsa} {m.operazione}" for m in d.modifiche})[:20],
        "nota_del_consulente": a.cliente.nota_mese or None,
        "punti_attenzione": [pt.titolo for pt in a.punti][:8],
    }


def _note_gruppo(gruppo) -> dict:
    return {"fatto_nel_mese": gruppo.fatto or None, "prossimi_passi": list(gruppo.prossimi_passi),
            "focus_del_mese": gruppo.focus or None, "storia_del_cliente": gruppo.contesto or None,
            "visite_escluse_dal_compenso": list(gruppo.compenso.escludi) if gruppo.compenso else [],
            "report_precedenti": gruppo.memoria or None}


# ---------------------------------------------------------------- layout Grano

def testi_grano(vista, a: Analisi) -> bool:
    """Riscrive i testi di una VistaGrano. False se restano quelli automatici."""
    report, slot = [], {}
    for i, s in enumerate(vista.sezioni):
        blocchi = []
        for j, (tipo, x) in enumerate(s.blocchi):
            if tipo == "tabella":
                blocchi.append({"tabella": [x.colonne] + [[c.testo for c in r] for r in x.righe]})
            elif tipo == "riquadri":
                blocchi.append({"riquadri": [[v[0], v[1]] for v in x[0]]})
            elif tipo == "nota":
                blocchi.append({"nota": [x[0], _testo(x[1])]})
            elif j in s.testi:
                chiave = f"s{i}_b{j}"
                originale = s.testi[j]
                slot[chiave] = {"sezione": s.titolo, "tipo": "elenco" if isinstance(originale, list) else "paragrafo",
                                "testo_attuale": originale}
                blocchi.append({"testo_da_scrivere": chiave})
            else:
                blocchi.append({tipo: _testo(x) if tipo != "elenco" else [_testo(v) for v in x]})
        report.append({"titolo": s.titolo, "contenuto": blocchi})
    contesto = {"report": {"nome": vista.nome, "periodo": vista.periodo, "confronto": vista.confronto,
                           "sezioni": report},
                "dati": _storico(a), "note_del_consulente": _note_gruppo(vista.gruppo)}
    nuovi = _chiama(contesto, slot)
    if not nuovi:
        return False
    for i, s in enumerate(vista.sezioni):
        for j in list(s.testi):
            v = nuovi.get(f"s{i}_b{j}")
            if v is None:
                continue
            tipo = s.blocchi[j][0]
            if tipo == "elenco" and isinstance(v, list):
                s.blocchi[j] = ("elenco", [md(x) for x in v])
            elif tipo == "p" and isinstance(v, str):
                s.blocchi[j] = ("p", md(v))
    vista.testi_ai = True
    return True


# ---------------------------------------------------------------- layout Advisory (gruppi di locali)

CAMPI_LOCALE = ("intro", "lettura_conversioni", "lettura_numeri", "costo_visita", "lettura_lingue",
                "testo_ore", "budget", "richiamo_budget")


def _righe(righe: list[Riga]) -> list[list[str]]:
    return [[r.etichetta, *r.valori] + ([r.variazione] if r.variazione else []) for r in righe]


def testi_gruppo(vg: VistaGruppo, analisi: list[Analisi]) -> bool:
    """Riscrive i testi di una VistaGruppo (layout Advisory). False se restano quelli automatici."""
    slot, locali = {}, []
    for n, (l, a) in enumerate(zip(vg.locali, analisi), start=1):
        testi = {}
        for campo in CAMPI_LOCALE:
            x = getattr(l, campo)
            if x:
                chiave = f"l{n}_{campo}"
                slot[chiave] = {"locale": l.nome, "tipo": "paragrafo", "testo_attuale": _testo(x)}
                testi[campo] = chiave
        if l.passi:
            slot[f"l{n}_passi"] = {"locale": l.nome, "tipo": "passi",
                                   "testo_attuale": [{"titolo": p.titolo, "dettaglio": p.dettaglio} for p in l.passi]}
        locali.append({
            "nome": l.nome, "stato": l.stati,
            "riquadri": [list(t) for t in l.tiles_principali] + [list(t) for t in l.tiles_secondari],
            "mesi": l.mesi, "confronto_mesi": _righe(l.confronto),
            "canali": [l.canali_colonne] + _righe(l.canali),
            "lingue_o_gruppi": _righe(l.lingue), "giorni": _righe(l.giorni),
            "cosa_abbiamo_fatto": _testo(l.fatto) if l.fatto else None,
            "testi": testi, "dati": _storico(a),
        })
    if vg.intro_gruppo:
        slot["gruppo_intro"] = {"locale": "gruppo", "tipo": "paragrafo", "testo_attuale": _testo(vg.intro_gruppo)}
    if vg.priorita:
        slot["gruppo_priorita"] = {"locale": "gruppo", "tipo": "passi",
                                   "testo_attuale": [{"titolo": p.titolo, "dettaglio": p.dettaglio} for p in vg.priorita]}
    contesto = {"report": {"gruppo": vg.titolo, "sottotitolo": vg.sottotitolo,
                           "insegne": _righe(vg.insegne), "confronto_gruppo": _righe(vg.confronto_gruppo),
                           "compenso": [vg.compenso_colonne] + _righe(vg.compenso) if vg.compenso else None,
                           "locali": locali},
                "note_del_consulente": _note_gruppo(vg.gruppo)}
    nuovi = _chiama(contesto, slot)
    if not nuovi:
        return False
    for n, l in enumerate(vg.locali, start=1):
        for campo in CAMPI_LOCALE:
            v = nuovi.get(f"l{n}_{campo}")
            if isinstance(v, str) and getattr(l, campo):
                setattr(l, campo, md(v))
        if isinstance(nuovi.get(f"l{n}_passi"), list):
            l.passi = [Passo(p["titolo"], p["dettaglio"]) for p in nuovi[f"l{n}_passi"] if isinstance(p, dict)]
    if isinstance(nuovi.get("gruppo_intro"), str):
        vg.intro_gruppo = md(nuovi["gruppo_intro"])
    if isinstance(nuovi.get("gruppo_priorita"), list):
        vg.priorita = [Passo(p["titolo"], p["dettaglio"]) for p in nuovi["gruppo_priorita"] if isinstance(p, dict)]
    return True




# ---------------------------------------------------------------- memoria dei report inviati

def testi_scritti(vista) -> list[str]:
    """I testi del report (non le tabelle), da ricordare per il mese dopo."""
    testi = []
    if isinstance(vista, VistaGruppo):
        for l in vista.locali:
            for campo in CAMPI_LOCALE + ("fatto",):
                x = getattr(l, campo)
                if x:
                    testi.append(f"{l.nome}: {_testo(x)}")
            testi += [f"{l.nome}, prossimo passo: {p.titolo}. {p.dettaglio}" for p in l.passi]
        for x in (vista.intro_gruppo, vista.fatto):
            if x:
                testi.append(_testo(x))
        testi += [f"Priorità: {p.titolo}. {p.dettaglio}" for p in vista.priorita]
    else:
        for s in vista.sezioni:
            for tipo, x in s.blocchi:
                if tipo == "p":
                    testi.append(f"{s.titolo}: {_testo(x)}")
                elif tipo == "elenco":
                    testi += [f"{s.titolo}: {_testo(v)}" for v in x]
    return testi
