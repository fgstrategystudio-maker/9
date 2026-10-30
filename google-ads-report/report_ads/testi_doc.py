"""Testi dei report Word e PowerPoint scritti da Claude.

I testi automatici (testi_base di report_docx e report_pptx) sono una struttura annidata: qui la si
appiattisce in "testi da scrivere", Claude li riscrive sui numeri del mese, sullo storico e sulla storia
del cliente, e la struttura torna com'era. Se la chiamata non riesce restano i testi automatici.
"""

from __future__ import annotations

import copy
import json
import logging
import os

from . import testi_ai

log = logging.getLogger(__name__)

PER_RICHIESTA = 10  # testi per richiesta a Claude

REGOLE = """

Regole di scrittura di questo report (vincolanti):
- Niente trattini lunghi o medi come separatori: usa virgole o punti. Gli intervalli si scrivono a parole \
("da 40 a 50 €", "dalle 11 alle 15").
- Niente analogie e niente metafore. Frasi chiare per un ristoratore, numeri sempre con la loro fonte.
- Non inventare dati su concorrenti o spese altrui: usa solo quelli in "dati_inviati_dal_consulente".
- Non mostrare al cliente l'efficacia degli annunci né limiti sugli alcolici.
- "Titolo" brevi (massimo 8 parole), "testo" di una o due frasi. I paragrafi restano della lunghezza di quelli attuali.
- Nelle proposte usa i budget e i costi per clic dei dati; se non ci sono dati per proporre un cambio, scrivi \
"invariata" o "da valutare".
- Se un testo attuale è vuoto, scrivilo solo se i dati lo permettono, altrimenti lascialo vuoto."""


def _appiattisci(base: dict) -> tuple[dict, dict]:
    """{chiave_slot: {tipo, sezione, testo_attuale}} e {chiave_slot: percorso nella struttura}."""
    slot, percorsi = {}, {}

    def visita(x, percorso):
        if isinstance(x, dict):
            for k, v in x.items():
                visita(v, percorso + [k])
            return
        chiave = f"t{len(slot)}"
        if isinstance(x, str):
            tipo, attuale = "paragrafo", x
        elif isinstance(x, list) and all(isinstance(v, str) for v in x):
            tipo, attuale = "elenco", x
        elif isinstance(x, list) and all(isinstance(v, list) and len(v) == 2 for v in x):
            tipo, attuale = "passi", [{"titolo": a, "dettaglio": b} for a, b in x]
        elif isinstance(x, list) and all(isinstance(v, list) for v in x):
            return  # tabelle (es. proposte a più colonne): restano automatiche
        else:
            return
        slot[chiave] = {"dove": " / ".join(percorso), "tipo": tipo, "testo_attuale": attuale}
        percorsi[chiave] = percorso

    visita(base, [])
    return slot, percorsi


def riscrivi(base: dict, numeri: dict, contesto: dict) -> tuple[dict, bool]:
    """Testi riscritti da Claude (o quelli di base, se non disponibile)."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return base, False
    slot, percorsi = _appiattisci(base)
    # Più richieste piccole invece di una grande: lo schema di risposta resta semplice.
    chiavi = list(slot)
    nuovi: dict = {}
    for i in range(0, len(chiavi), PER_RICHIESTA):
        parte = {k: slot[k] for k in chiavi[i:i + PER_RICHIESTA]}
        nuovi.update(testi_ai._chiama({"numeri_del_report": numeri, **contesto}, parte,
                                      testi_ai.ISTRUZIONI + REGOLE) or {})
    if not nuovi:
        return base, False
    out = copy.deepcopy(base)
    for chiave, valore in nuovi.items():
        percorso = percorsi[chiave]
        nodo = out
        for p in percorso[:-1]:
            nodo = nodo[p]
        if slot[chiave]["tipo"] == "passi":
            valore = [[v.get("titolo", ""), v.get("dettaglio", "")] for v in valore if isinstance(v, dict)]
        nodo[percorso[-1]] = valore
    return out, True


def numeri_compatti(d: dict) -> dict:
    """I numeri del report arrotondati, per tenere la richiesta leggera."""
    def tondo(x):
        if isinstance(x, float):
            return round(x, 4 if abs(x) < 1 else 2)
        if isinstance(x, dict):
            return {k: tondo(v) for k, v in x.items() if k not in ("ore", "giorni_spesa")}
        if isinstance(x, list):
            return [tondo(v) for v in x]
        return x
    return json.loads(json.dumps(tondo(d), default=str))
