"""Dati di esempio realistici, per provare i report senza credenziali Google Ads.

Sono deterministici: lo stesso cliente e lo stesso periodo producono sempre
gli stessi numeri.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta

from .modello import (
    Campagna, DatiAccount, DatiPeriodo, Keyword, Metriche, Modifica, TermineRicerca,
)
from .periodi import Intervallo, Periodi

CAMPAGNE = [
    ("1001", "Search | Brand", "SEARCH", 15, 0.09, 0.85, 0.16),
    ("1002", "Search | Servizi principali", "SEARCH", 45, 0.05, 2.10, 0.07),
    ("1003", "Search | Concorrenti", "SEARCH", 20, 0.03, 2.90, 0.02),
    ("1004", "Performance Max | Lead", "PERFORMANCE_MAX", 35, 0.012, 0.70, 0.05),
    ("1005", "Display | Remarketing", "DISPLAY", 10, 0.004, 0.35, 0.03),
]

TERMINI = [
    "consulenza marketing", "consulente aziendale roma", "agenzia marketing prezzi",
    "corso marketing gratis", "lavoro consulente marketing", "consulenza strategica pmi",
    "come fare un business plan", "consulente vendite b2b", "marketing cos'è",
    "fractional cmo", "audit marketing aziendale", "stage marketing roma",
]


def _rng(*chiavi) -> random.Random:
    return random.Random("|".join(str(c) for c in chiavi))


class FonteDemo:
    def _periodo(self, cid: str, intervallo: Intervallo, fattore: float) -> DatiPeriodo:
        campagne: dict[str, Campagna] = {}
        giorni: dict = {}
        for id_, nome, tipo, budget, ctr, cpc, tconv in CAMPAGNE:
            r = _rng(cid, id_, intervallo.inizio)
            m = Metriche()
            for i in range(intervallo.giorni):
                g = intervallo.inizio + timedelta(days=i)
                costo = budget * r.uniform(0.75, 1.0) * fattore
                clic = max(1, round(costo / (cpc * r.uniform(0.85, 1.2))))
                impr = round(clic / (ctr * r.uniform(0.85, 1.15)))
                conv = sum(1 for _ in range(clic) if r.random() < tconv * fattore ** 0.5)
                m.costo += costo
                m.clic += clic
                m.impressioni += impr
                m.conversioni += conv
                m.valore_conv += conv * r.uniform(90, 160)
                c0, v0 = giorni.get(g, (0.0, 0.0))
                giorni[g] = (c0 + costo, v0 + conv)
            if tipo == "SEARCH":
                m.persa_budget = r.uniform(0.02, 0.35)
                m.persa_ranking = r.uniform(0.10, 0.45)
                m.quota_impr = max(0.1, 1 - m.persa_budget - m.persa_ranking)
            campagne[id_] = Campagna(id_, nome, "ENABLED", tipo, float(budget), m)

        totale = Metriche()
        for c in campagne.values():
            for campo in ("costo", "impressioni", "clic", "conversioni", "valore_conv"):
                setattr(totale, campo, getattr(totale, campo) + getattr(c.metriche, campo))
        search = [c.metriche for c in campagne.values() if c.metriche.quota_impr is not None]
        if search:
            totale.quota_impr = sum(m.quota_impr for m in search) / len(search)
            totale.persa_budget = sum(m.persa_budget for m in search) / len(search)
            totale.persa_ranking = sum(m.persa_ranking for m in search) / len(search)
        giornaliero = [(g, c, v) for g, (c, v) in sorted(giorni.items())]
        return DatiPeriodo(totale, campagne, giornaliero)

    def scarica(self, customer_id: str, periodi: Periodi) -> DatiAccount:
        cid = str(customer_id)
        r = _rng(cid, periodi.corrente.inizio, "extra")
        corrente = self._periodo(cid, periodi.corrente, 1.0)
        precedente = self._periodo(cid, periodi.precedente, r.uniform(0.8, 1.15))
        anno_prec = self._periodo(cid, periodi.anno_prec, r.uniform(0.6, 0.9)) if periodi.anno_prec else None

        termini = []
        for t in TERMINI:
            clic = r.randint(3, 40)
            conv = 0 if any(p in t for p in ("gratis", "lavoro", "stage", "cos'è", "corso")) else r.choice([0, 1, 2, 3])
            termini.append(TermineRicerca(t, "Search | Servizi principali", "Generico", clic * r.uniform(1.5, 3.0), clic, conv))
        termini.sort(key=lambda t: -t.costo)

        keyword = [
            Keyword(t, "Search | Servizi principali", "Generico", r.choice([3, 4, 5, 6, 7, 8, 9, None]),
                    r.uniform(20, 180), r.choice([0, 0, 1, 2, 4]))
            for t in TERMINI[:8]
        ]

        modifiche = []
        base = datetime.combine(periodi.corrente.fine, datetime.min.time())
        for i, (ris, op, camp, campi) in enumerate([
            ("CAMPAIGN_BUDGET", "UPDATE", "Search | Servizi principali", ["amount_micros"]),
            ("AD_GROUP_CRITERION", "CREATE", "Search | Servizi principali", ["keyword.text"]),
            ("CAMPAIGN", "UPDATE", "Search | Concorrenti", ["status"]),
            ("AD", "CREATE", "Search | Brand", ["responsive_search_ad"]),
        ]):
            modifiche.append(Modifica(base - timedelta(days=3 * i + 1, hours=i), "tu@esempio.it", ris, op, camp, campi))

        return DatiAccount(
            nome=f"Account demo {cid}", valuta="EUR", punteggio_ottimizzazione=r.uniform(0.62, 0.92),
            corrente=corrente, precedente=precedente, anno_prec=anno_prec,
            termini_ricerca=termini, keyword=keyword, modifiche=modifiche,
        )
