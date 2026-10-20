"""Dati di esempio realistici, per provare i report senza credenziali Google Ads.

Sono deterministici: lo stesso cliente e lo stesso periodo producono sempre
gli stessi numeri.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta

from .modello import (
    Campagna, Canale, DatiAccount, DatiPeriodo, Dettaglio, GruppoAsset, Keyword, Metriche, Modifica,
    TermineRicerca,
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


LINGUE = ["Italiano", "Inglese", "Spagnolo", "Francese", "Tedesco"]

# Profilo orario delle conversioni di un ristorante (pranzo e cena).
PROFILO_ORE = [4, 2, 2, 1, 1, 1, 1, 2, 5, 10, 20, 45, 95, 90, 50, 30, 25, 40, 65, 100, 70, 35, 14, 7]


def _rng(*chiavi) -> random.Random:
    return random.Random("|".join(str(c) for c in chiavi))


class FonteDemo:
    def __init__(self, locali: set[str] | None = None):
        # Account di ristoranti e locali: dati demo coerenti con l'obiettivo negozio anche a metà e fine mese.
        self.locali = {str(x) for x in (locali or ())}

    def _periodo(self, cid: str, intervallo: Intervallo, fattore: float) -> DatiPeriodo:
        # Circa metà degli account demo ha le visite al negozio misurate da Google.
        con_visite = _rng(cid, "visite").random() < 0.5
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
                indicazioni = clic * r.uniform(0.03, 0.09)
                m.indicazioni += indicazioni
                if con_visite:
                    m.visite_reali += indicazioni * r.uniform(0.2, 0.4)
                c0, v0 = giorni.get(g, (0.0, 0.0))
                giorni[g] = (c0 + costo, v0 + conv)
            if tipo == "SEARCH":
                m.persa_budget = r.uniform(0.02, 0.35)
                m.persa_ranking = r.uniform(0.10, 0.45)
                m.quota_impr = max(0.1, 1 - m.persa_budget - m.persa_ranking)
            campagne[id_] = Campagna(id_, nome, "ENABLED", tipo, float(budget), m)

        totale = Metriche()
        for c in campagne.values():
            for campo in ("costo", "impressioni", "clic", "conversioni", "valore_conv", "indicazioni", "visite_reali"):
                setattr(totale, campo, getattr(totale, campo) + getattr(c.metriche, campo))
        search = [c.metriche for c in campagne.values() if c.metriche.quota_impr is not None]
        if search:
            totale.quota_impr = sum(m.quota_impr for m in search) / len(search)
            totale.persa_budget = sum(m.persa_budget for m in search) / len(search)
            totale.persa_ranking = sum(m.persa_ranking for m in search) / len(search)
        giornaliero = [(g, c, v) for g, (c, v) in sorted(giorni.items())]
        return DatiPeriodo(totale, campagne, giornaliero)

    def _periodo_locale(self, cid: str, intervallo: Intervallo, fattore: float) -> DatiPeriodo:
        """Un ristorante con una campagna Performance Max."""
        r = _rng(cid, "locale", intervallo.inizio)
        base = _rng(cid, "dimensione")
        budget = base.choice([23, 30, 50, 65])
        con_visite = base.random() < 0.7
        m = Metriche()
        giornaliero = []
        for i in range(intervallo.giorni):
            g = intervallo.inizio + timedelta(days=i)
            costo = budget * r.uniform(0.9, 1.05)
            clic = round(costo / r.uniform(0.09, 0.16))
            impr = round(clic / r.uniform(0.035, 0.085))
            indicazioni = clic * r.uniform(0.25, 0.4) * fattore
            contatti = clic * r.uniform(0.08, 0.16) * fattore
            m.costo += costo
            m.clic += clic
            m.impressioni += impr
            m.indicazioni += round(indicazioni)
            m.contatti += round(contatti)
            m.conversioni += round(indicazioni) + round(contatti)
            if con_visite:
                m.visite_reali += round(indicazioni * r.uniform(0.18, 0.3))
            giornaliero.append((g, costo, round(indicazioni) + round(contatti)))
        stato, motivi = ("LIMITED", ["BUDGET_CONSTRAINED"]) if base.random() < 0.6 else ("ELIGIBLE", [])
        if base.random() < 0.3:
            stato, motivi = "LEARNING", ["BIDDING_STRATEGY_LEARNING", "BUDGET_CONSTRAINED"]
        c = Campagna("2001", f"Performance Max | {cid[-4:]}", "ENABLED", "PERFORMANCE_MAX", float(budget), m,
                     stato_primario=stato, motivi_stato=motivi)
        totale = Metriche(**{k: getattr(m, k) for k in ("costo", "impressioni", "clic", "conversioni",
                                                         "indicazioni", "visite_reali", "contatti")})
        return DatiPeriodo(totale, {c.id: c}, giornaliero)

    def _dettaglio(self, cid: str, dati: DatiAccount) -> Dettaglio:
        """Ripartizioni coerenti con i totali (canali, lingue, ore e giorni sommano al totale)."""
        r = _rng(cid, "dettaglio", dati.corrente.giornaliero[0][0])
        d = Dettaglio()

        def ripartisci(pesi: list[float], totale: float, intero: bool = True) -> list[float]:
            s = sum(pesi)
            valori = [totale * p / s for p in pesi]
            if intero:
                valori = [round(v) for v in valori]
                valori[0] += round(totale) - sum(valori)
            return valori

        def canali(t: Metriche, seme: str) -> list[Canale]:
            rr = _rng(cid, "canali", seme)
            nomi = ["Rete di Ricerca", "Google Maps", "YouTube, Discover e altro"]
            q_ric = rr.uniform(0.35, 0.65)
            p_impr = [1 - q_ric, q_ric, 0.003]
            p_spesa = [rr.uniform(0.5, 0.65), rr.uniform(0.33, 0.45), 0.01]
            p_az = [rr.uniform(0.5, 0.7), rr.uniform(0.3, 0.45), 0.005]
            vals = {k: ripartisci(pesi, getattr(t, k), k != "costo") for k, pesi in (
                ("impressioni", p_impr), ("clic", p_spesa), ("costo", p_spesa), ("conversioni", p_az),
                ("indicazioni", p_az), ("visite_reali", p_spesa))}
            return [Canale(n, Metriche(**{k: v[i] for k, v in vals.items()})) for i, n in enumerate(nomi)]

        d.canali = canali(dati.corrente.totale, "cor")
        d.canali_precedente = canali(dati.precedente.totale, "pre")
        t = dati.corrente.totale
        pesi = [r.uniform(0.5, 2) for _ in LINGUE]
        conv = ripartisci(pesi, t.conversioni)
        clic = ripartisci([p * r.uniform(0.9, 1.1) for p in pesi], t.clic)
        impr = ripartisci([p * r.uniform(0.8, 1.2) for p in pesi], t.impressioni)
        costo = ripartisci(pesi, t.costo, False)
        for i, nome in enumerate(LINGUE):
            m = Metriche(impressioni=impr[i], clic=clic[i], costo=costo[i], conversioni=conv[i])
            d.gruppi_asset.append(GruppoAsset(nome, m, round(conv[i] * r.uniform(0.6, 1.1))))
        d.gruppi_asset.sort(key=lambda g: -g.metriche.conversioni)
        d.conversioni_per_ora = ripartisci([p * r.uniform(0.85, 1.15) for p in PROFILO_ORE], t.conversioni)
        d.spesa_per_ora = ripartisci([max(p, 3) * r.uniform(0.8, 1.2) for p in PROFILO_ORE], t.costo, False)
        conteggio = [0] * 7
        for g, _, _ in dati.corrente.giornaliero:
            conteggio[g.weekday()] += 1
        settimana = [0.85, 0.85, 0.9, 1.0, 1.15, 1.35, 1.1]
        d.conversioni_giorno_totale = ripartisci([f * c for f, c in zip(settimana, conteggio)], t.conversioni)
        d.spesa_per_giorno = ripartisci([c * r.uniform(0.9, 1.1) for c in conteggio], t.costo, False)
        d.giorni_corrente = [v / c if c else 0.0 for v, c in zip(d.conversioni_giorno_totale, conteggio)]
        d.giorni_precedente = [x * r.uniform(0.7, 0.95) for x in d.giorni_corrente]
        return d

    def scarica(self, customer_id: str, periodi: Periodi, dettaglio: bool = False) -> DatiAccount:
        cid = str(customer_id)
        if dettaglio or cid in self.locali:
            return self._scarica_locale(cid, periodi)
        r = _rng(cid, periodi.corrente.inizio, "extra")
        corrente = self._periodo(cid, periodi.corrente, 1.0)
        precedente = self._periodo(cid, periodi.precedente, r.uniform(0.8, 1.15))
        anno_prec = self._periodo(cid, periodi.anno_prec, r.uniform(0.6, 0.9)) if periodi.anno_prec else None

        termini = []
        for t in TERMINI:
            clic = r.randint(3, 40)
            conv = 0 if any(p in t for p in ("gratis", "lavoro", "stage", "cos'è", "corso")) else r.choice([0, 1, 2, 3])
            termini.append(TermineRicerca(t, "Search | Servizi principali", "Generico", clic * r.uniform(1.5, 3.0), clic, conv,
                                          conv + (0 if conv == 0 else r.choice([0, 1]))))
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

    def _scarica_locale(self, cid: str, periodi: Periodi) -> DatiAccount:
        r = _rng(cid, periodi.corrente.inizio, "locale-extra")
        corrente = self._periodo_locale(cid, periodi.corrente, 1.0)
        precedente = self._periodo_locale(cid, periodi.precedente, r.uniform(0.6, 0.85))
        anno_prec = self._periodo_locale(cid, periodi.anno_prec, 0.5) if periodi.anno_prec else None
        due = self._periodo_locale(cid, periodi.due_mesi_prima, r.uniform(0.5, 0.7)) if periodi.due_mesi_prima else None
        termini = [TermineRicerca(t, corrente.campagne["2001"].nome, "Italiano", r.uniform(5, 30), r.randint(10, 60), 0,
                                  0 if "gratis" in t else r.randint(0, 4))
                   for t in ("sushi vicino a me", "ristorante giapponese", "sushi gratis", "all you can eat roma")]
        base = datetime.combine(periodi.corrente.fine, datetime.min.time())
        modifiche = [Modifica(base - timedelta(days=d), "tu@esempio.it", ris, "UPDATE", corrente.campagne["2001"].nome, campi)
                     for d, ris, campi in ((3, "ASSET_GROUP", ["search_themes"]), (12, "CAMPAIGN", ["negative_keywords"]))]
        dati = DatiAccount(
            nome=f"Ristorante demo {cid}", valuta="EUR", punteggio_ottimizzazione=r.uniform(0.7, 0.95),
            corrente=corrente, precedente=precedente, anno_prec=anno_prec,
            termini_ricerca=termini, keyword=[], modifiche=modifiche, due_mesi_prima=due,
        )
        dati.dettaglio = self._dettaglio(cid, dati)
        return dati
