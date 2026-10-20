"""Analisi deterministica: KPI, confronti, ritmo di spesa e punti di attenzione.

Le regole qui sono la base affidabile del report: il commento AI (se attivo)
le spiega e le arricchisce, ma non le sostituisce.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from .config import Cliente
from .modello import DatiAccount, DatiPeriodo, Keyword, Metriche, Modifica, TermineRicerca
from .periodi import Periodi

# Soglie delle regole: modificale qui per rendere il sistema più o meno sensibile.
SOGLIA_CALO_CONVERSIONI = 0.20
SOGLIA_CALO_CTR = 0.15
SOGLIA_AUMENTO_CPC = 0.20
SOGLIA_SFORAMENTO_BUDGET = 0.10
SOGLIA_SOTTOUTILIZZO_BUDGET = 0.15
SOGLIA_PERSA_BUDGET = 0.20
SOGLIA_PERSA_RANKING = 0.40
SOGLIA_QS_BASSO = 4
MIN_CONVERSIONI_SIGNIFICATIVE = 5

ORDINE_GRAVITA = {"alta": 0, "media": 1, "bassa": 2}

# Come si chiama il "risultato" nei testi: conversioni, oppure visite al negozio per i locali.
ETICHETTE = {
    False: {"risultati": "conversioni", "Risultati": "Conversioni", "breve": "Conv.",
            "singolare": "conversione", "costo": "CPA", "costo_lungo": "Costo per conversione"},
    True: {"risultati": "visite al negozio", "Risultati": "Visite al negozio", "breve": "Visite",
           "singolare": "visita", "costo": "costo per visita", "costo_lungo": "Costo per visita"},
}


@dataclass
class Kpi:
    chiave: str
    nome: str
    valore: float | None
    prec: float | None
    anno_prec: float | None
    formato: str  # valuta | numero | decimale | percentuale | roas
    meglio: str | None  # "su", "giu" o None (neutro, es. la spesa)
    delta: float | None = None
    delta_ap: float | None = None

    @property
    def esito(self) -> str:
        if self.delta is None or self.meglio is None or abs(self.delta) < 0.03:
            return "neutro"
        migliora = self.delta > 0 if self.meglio == "su" else self.delta < 0
        return "buono" if migliora else "cattivo"


@dataclass
class Punto:
    gravita: str  # alta | media | bassa
    area: str
    titolo: str
    dettaglio: str
    azione: str
    # Opportunità (positive) e problemi hanno la stessa forma; il flag cambia solo la grafica.
    opportunita: bool = False


@dataclass
class Pacing:
    budget: float
    budget_stimato: bool  # True se ricavato dai budget giornalieri delle campagne
    speso: float
    atteso_ad_oggi: float
    proiezione: float

    @property
    def scostamento(self) -> float:
        return self.proiezione / self.budget - 1 if self.budget else 0.0

    @property
    def quota_spesa(self) -> float:
        return self.speso / self.budget if self.budget else 0.0


@dataclass
class RigaCampagna:
    nome: str
    tipo: str
    stato: str
    m: Metriche
    prec: Metriche | None
    budget_giornaliero: float | None

    def delta(self, attr: str, giorni: int, giorni_prec: int) -> float | None:
        return variazione(getattr(self.m, attr), getattr(self.prec, attr) if self.prec else None,
                          giorni if attr in VOLUMI else 1, giorni_prec if attr in VOLUMI else 1)


@dataclass
class Analisi:
    cliente: Cliente
    dati: DatiAccount
    periodi: Periodi
    kpi: list[Kpi]
    pacing: Pacing | None
    campagne: list[RigaCampagna]
    punti: list[Punto]
    sprechi: list[TermineRicerca]
    spreco_totale: float
    keyword_qs_bassa: list[Keyword]
    modifiche: list[Modifica]
    modifiche_per_tipo: list[tuple[str, int]]
    commento_cliente: str = ""
    prossimi_passi: list[str] = field(default_factory=list)
    sintesi_interna: str = ""
    cosa_e_cambiato: list[str] = field(default_factory=list)
    cosa_migliorare: list[str] = field(default_factory=list)
    commento_ai: bool = False
    # Contratto (solo report dei locali): se il contratto parte a metà del mese su cui si
    # calcola la fee, le visite di quel mese dal giorno di inizio.
    visite_base_fee: float | None = None
    controlli: list = field(default_factory=list)  # verifica.Controllo
    fuori_contratto: bool = False

    @property
    def stato(self) -> str:
        gravita = {p.gravita for p in self.punti if not p.opportunita}
        return "rosso" if "alta" in gravita else "giallo" if "media" in gravita else "verde"

    @property
    def etichette(self) -> dict[str, str]:
        return ETICHETTE[self.cliente.negozio]

    @property
    def kpi_per_chiave(self) -> dict[str, Kpi]:
        return {k.chiave: k for k in self.kpi}


VOLUMI = {"costo", "impressioni", "clic", "conversioni", "valore_conv", "indicazioni"}


def variazione(attuale, precedente, giorni=1, giorni_prec=1) -> float | None:
    """Variazione relativa. Per i volumi si confrontano le medie giornaliere,
    così un mese di 31 giorni non sembra migliore di uno di 30."""
    if attuale is None or precedente is None or giorni_prec == 0:
        return None
    a, p = attuale / giorni, precedente / giorni_prec
    if p == 0:
        return None
    return a / p - 1


def prepara_negozio(cliente: Cliente, dati: DatiAccount) -> None:
    """Obiettivo negozio: il risultato diventa la visita al negozio.

    Se Google misura le visite sull'account si usano quelle; altrimenti si stimano
    come quota delle indicazioni stradali (27% salvo diversa configurazione).
    La scelta vale per tutti i periodi, così i confronti restano omogenei.
    """
    reali = cliente.visite == "rilevate" or (cliente.visite == "auto" and dati.corrente.totale.visite_reali > 0)
    dati.visite_stimate = not reali
    quota = cliente.quota_visite_indicazioni
    periodi = [dati.corrente, dati.precedente] + [p for p in (dati.anno_prec, dati.due_mesi_prima) if p]
    for periodo in periodi:
        for m in [periodo.totale] + [c.metriche for c in periodo.campagne.values()]:
            m.conversioni_google = m.conversioni
            m.conversioni = m.visite_reali if reali else m.indicazioni * quota
    # I termini di ricerca non hanno il dettaglio per categoria: si usano tutte le conversioni,
    # che includono le indicazioni stradali.
    for t in dati.termini_ricerca:
        t.conversioni = t.conversioni_tutte
    for kw in dati.keyword:
        kw.conversioni = kw.conversioni_tutte


def _kpi(cliente: Cliente, dati: DatiAccount, periodi: Periodi) -> list[Kpi]:
    definizioni = [
        ("costo", "Investimento", "valuta", None),
        ("impressioni", "Impressioni", "numero", "su"),
        ("clic", "Clic", "numero", "su"),
        ("ctr", "CTR", "percentuale", "su"),
        ("cpc", "CPC medio", "valuta", "giu"),
    ]
    if cliente.negozio:
        stima = " (stimate)" if dati.visite_stimate else ""
        definizioni += [
            ("indicazioni", "Indicazioni stradali", "numero", "su"),
            ("conversioni", f"Visite al negozio{stima}", "numero", "su"),
            ("cpa", "Costo per visita", "valuta", "giu"),
        ]
    else:
        definizioni += [
            ("conversioni", "Conversioni", "decimale", "su"),
            ("tasso_conv", "Tasso di conversione", "percentuale", "su"),
            ("cpa", "Costo per conversione", "valuta", "giu"),
        ]
    if cliente.ecommerce:
        definizioni += [
            ("valore_conv", "Valore conversioni", "valuta", "su"),
            ("roas", "ROAS", "roas", "su"),
        ]
    if dati.corrente.totale.quota_impr is not None:
        definizioni.append(("quota_impr", "Quota impressioni (Search)", "percentuale", "su"))

    g = periodi.corrente.giorni
    gp = periodi.precedente.giorni
    ga = periodi.anno_prec.giorni if periodi.anno_prec else 1
    out = []
    for chiave, nome, formato, meglio in definizioni:
        v = getattr(dati.corrente.totale, chiave)
        p = getattr(dati.precedente.totale, chiave)
        ap = getattr(dati.anno_prec.totale, chiave) if dati.anno_prec else None
        vol = chiave in VOLUMI
        out.append(Kpi(
            chiave, nome, v, p, ap, formato, meglio,
            delta=variazione(v, p, g if vol else 1, gp if vol else 1),
            delta_ap=variazione(v, ap, g if vol else 1, ga if vol else 1),
        ))
    return out


def _pacing(cliente: Cliente, corrente: DatiPeriodo, periodi: Periodi) -> Pacing | None:
    budget, stimato = cliente.budget_mensile, False
    if not budget:
        giornalieri = [c.budget_giornaliero for c in corrente.campagne.values()
                       if c.stato == "ENABLED" and c.budget_giornaliero]
        if not giornalieri:
            return None
        budget, stimato = sum(giornalieri) * periodi.giorni_mese, True
    speso = corrente.totale.costo
    if periodi.mese_chiuso:
        return Pacing(budget, stimato, speso, budget, speso)
    proiezione = speso / periodi.corrente.giorni * periodi.giorni_mese
    return Pacing(budget, stimato, speso, budget * periodi.quota_trascorsa, proiezione)


def _euro(x: float) -> str:
    return f"{x:,.0f} €".replace(",", ".")


def _perc(x: float) -> str:
    return f"{x * 100:+.0f}%".replace(".", ",")


def analizza(cliente: Cliente, dati: DatiAccount, periodi: Periodi) -> Analisi:
    if cliente.negozio:
        prepara_negozio(cliente, dati)
    e = ETICHETTE[cliente.negozio]
    cor, pre = dati.corrente.totale, dati.precedente.totale
    g, gp = periodi.corrente.giorni, periodi.precedente.giorni
    kpi = _kpi(cliente, dati, periodi)
    k = {x.chiave: x for x in kpi}
    pacing = _pacing(cliente, dati.corrente, periodi)
    punti: list[Punto] = []

    # 1. Tracciamento: spesa senza risultati quando prima ce n'erano.
    if cor.costo > 0 and cor.conversioni == 0 and pre.conversioni >= 3:
        punti.append(Punto(
            "alta", "Tracciamento", f"Nessuna {e['singolare']} registrata",
            f"Nel periodo sono stati spesi {_euro(cor.costo)} senza {e['risultati']}, "
            f"contro {pre.conversioni:.0f} nel periodo precedente.",
            "Verifica il collegamento al Profilo dell'attività su Google e le azioni di conversione locali "
            "(indicazioni stradali, visite)." if cliente.negozio else
            "Verifica subito tag di conversione, Google Tag Manager e le azioni di conversione in Google Ads.",
        ))

    # 2. Spesa ferma negli ultimi giorni (carta rifiutata, campagne in pausa, annunci respinti).
    gior = dati.corrente.giornaliero
    if not periodi.mese_chiuso and len(gior) >= 5:
        media = sum(c for _, c, _ in gior[:-2]) / len(gior[:-2])
        if media > 0 and all(c == 0 for _, c, _ in gior[-2:]):
            punti.append(Punto(
                "alta", "Erogazione", "Spesa ferma negli ultimi 2 giorni",
                f"Media giornaliera precedente {_euro(media)}, ultimi 2 giorni a zero.",
                "Controlla metodo di pagamento, stato delle campagne e annunci non approvati.",
            ))

    # 3. Ritmo di spesa rispetto al budget.
    if pacing:
        fonte = " (stimato dai budget giornalieri)" if pacing.budget_stimato else ""
        if periodi.mese_chiuso:
            if abs(pacing.scostamento) > SOGLIA_SFORAMENTO_BUDGET:
                punti.append(Punto(
                    "bassa", "Budget", "Spesa del mese lontana dal budget",
                    f"Speso {_euro(pacing.speso)} su un budget di {_euro(pacing.budget)}{fonte} "
                    f"({_perc(pacing.scostamento)}).",
                    "Allinea i budget giornalieri al budget mensile per il nuovo mese.",
                ))
        elif pacing.scostamento > SOGLIA_SFORAMENTO_BUDGET:
            punti.append(Punto(
                "alta" if pacing.scostamento > 0.25 else "media", "Budget", "Budget in sforamento",
                f"Proiezione a fine mese {_euro(pacing.proiezione)} su {_euro(pacing.budget)}{fonte} "
                f"({_perc(pacing.scostamento)}).",
                "Riduci i budget giornalieri delle campagne meno efficienti per rientrare.",
            ))
        elif pacing.scostamento < -SOGLIA_SOTTOUTILIZZO_BUDGET:
            punti.append(Punto(
                "media", "Budget", "Budget sotto-utilizzato",
                f"Proiezione a fine mese {_euro(pacing.proiezione)} su {_euro(pacing.budget)}{fonte} "
                f"({_perc(pacing.scostamento)}).",
                f"Valuta di aumentare budget o offerte sulle campagne con {e['costo']} in target.",
            ))

    # 4. Efficienza rispetto ai target.
    if cliente.cpa_target and cor.cpa:
        r = cor.cpa / cliente.cpa_target
        if r > 1.0:
            punti.append(Punto(
                "alta" if r > 1.2 else "media", "Efficienza", f"{e['costo_lungo']} sopra il target",
                f"{e['costo_lungo']} {_euro(cor.cpa)} contro un target di {_euro(cliente.cpa_target)} ({_perc(r - 1)}).",
                f"Sposta budget verso le campagne con {e['costo']} migliore e aggiungi keyword negative sui termini che non portano risultati.",
            ))
    if cliente.ecommerce and cliente.roas_target and cor.roas is not None:
        r = cor.roas / cliente.roas_target
        if r < 1.0:
            punti.append(Punto(
                "alta" if r < 0.8 else "media", "Efficienza", "ROAS sotto il target",
                f"ROAS {cor.roas:.2f} contro un target di {cliente.roas_target:.2f}.".replace(".", ","),
                "Rivedi i target di offerta (tROAS), esclusioni di prodotti a basso margine e feed.",
            ))

    # 5. Tendenze rispetto al periodo precedente.
    dconv = k["conversioni"].delta
    if dconv is not None and pre.conversioni >= MIN_CONVERSIONI_SIGNIFICATIVE and dconv < -SOGLIA_CALO_CONVERSIONI:
        punti.append(Punto(
            "alta" if dconv < -0.4 else "media", "Risultati", f"{e['Risultati']} in calo",
            f"{e['Risultati']} {_perc(dconv)} (media giornaliera) rispetto a {periodi.precedente.etichetta()}.",
            f"Incrocia il calo con le modifiche recenti e con le campagne che hanno perso più {e['risultati']}.",
        ))
    dctr = k["ctr"].delta
    if dctr is not None and dctr < -SOGLIA_CALO_CTR and cor.impressioni > 1000:
        punti.append(Punto(
            "media", "Annunci", "CTR in calo",
            f"CTR {_perc(dctr)} rispetto al periodo precedente.",
            "Aggiorna titoli e descrizioni degli annunci, verifica estensioni e la pertinenza delle keyword.",
        ))
    dcpc = k["cpc"].delta
    if dcpc is not None and dcpc > SOGLIA_AUMENTO_CPC and cor.clic > 50:
        punti.append(Punto(
            "media", "Costi", "CPC medio in aumento",
            f"CPC medio {_perc(dcpc)} rispetto al periodo precedente.",
            "Controlla la pressione competitiva (Analisi aste) e la strategia di offerta.",
        ))

    # 6. Campagne.
    righe = []
    for id_, c in sorted(dati.corrente.campagne.items(), key=lambda kv: -kv[1].metriche.costo):
        if c.metriche.costo == 0 and c.metriche.impressioni == 0:
            continue
        prec = dati.precedente.campagne.get(id_)
        righe.append(RigaCampagna(c.nome, c.tipo, c.stato, c.metriche, prec.metriche if prec else None,
                                  c.budget_giornaliero))
    soglia_costo = max(50.0, cor.costo * 0.05)
    for r in righe:
        m = r.m
        if m.costo >= soglia_costo and m.conversioni == 0:
            punti.append(Punto(
                "media", "Campagne", f"«{r.nome}» spende senza {e['risultati']}",
                f"{_euro(m.costo)} spesi e nessuna {e['singolare']} nel periodo.",
                "Rivedi targeting, keyword e pagina di destinazione, oppure riduci il budget.",
            ))
        elif cliente.cpa_target and m.cpa and m.cpa > cliente.cpa_target * 1.5 and m.costo >= soglia_costo:
            punti.append(Punto(
                "media", "Campagne", f"«{r.nome}» con {e['costo']} molto alto",
                f"{e['costo_lungo']} {_euro(m.cpa)} (target {_euro(cliente.cpa_target)}).",
                "Abbassa le offerte o restringi il targeting su questa campagna.",
            ))
        efficiente = m.conversioni > 0 and (not cliente.cpa_target or (m.cpa or 0) <= cliente.cpa_target)
        if m.persa_budget is not None and m.persa_budget > SOGLIA_PERSA_BUDGET and efficiente:
            punti.append(Punto(
                "bassa", "Crescita", f"«{r.nome}» è limitata dal budget",
                f"Perde il {m.persa_budget * 100:.0f}% delle impressioni per budget con {e['costo']} "
                f"di {_euro(m.cpa)}.",
                f"Aumenta il budget di questa campagna: è il modo più sicuro per ottenere più {e['risultati']}.",
                opportunita=True,
            ))
        if m.persa_ranking is not None and m.persa_ranking > SOGLIA_PERSA_RANKING and m.costo >= soglia_costo:
            punti.append(Punto(
                "media", "Competitività", f"«{r.nome}» perde quota per ranking",
                f"Perde il {m.persa_ranking * 100:.0f}% delle impressioni per ranking (qualità/offerte).",
                "Migliora punteggio di qualità e annunci, o alza le offerte sulle keyword migliori.",
            ))

    # 7. Termini di ricerca che spendono senza convertire: candidati a keyword negative.
    soglia_termine = max(10.0, (cliente.cpa_target or 0) * 0.5)
    sprechi = [t for t in dati.termini_ricerca if t.conversioni == 0 and t.costo >= soglia_termine]
    spreco_totale = sum(t.costo for t in sprechi)
    if sprechi:
        quota = spreco_totale / cor.costo if cor.costo else 0
        punti.append(Punto(
            "media" if quota > 0.05 else "bassa", "Keyword negative",
            f"{len(sprechi)} termin{'e' if len(sprechi) == 1 else 'i'} di ricerca senza risultati",
            f"Hanno speso {_euro(spreco_totale)} ({quota * 100:.0f}% della spesa) senza "
            f"{'conversioni né azioni locali' if cliente.negozio else 'conversioni'}.",
            "Valuta i termini nella tabella dedicata e aggiungi come negative quelli non pertinenti.",
        ))

    # 8. Punteggio di qualità.
    qs_bassa = [kw for kw in dati.keyword if kw.punteggio_qualita is not None and kw.punteggio_qualita <= SOGLIA_QS_BASSO]
    costo_qs_bassa = sum(kw.costo for kw in qs_bassa)
    if qs_bassa and cor.costo and costo_qs_bassa / cor.costo > 0.10:
        punti.append(Punto(
            "media", "Qualità", "Spesa su keyword con punteggio di qualità basso",
            f"{len(qs_bassa)} keyword con QS ≤ {SOGLIA_QS_BASSO} pesano {_euro(costo_qs_bassa)} "
            f"({costo_qs_bassa / cor.costo * 100:.0f}% della spesa).",
            "Crea gruppi di annunci più specifici e allinea annunci e landing page a queste keyword.",
        ))

    # 9. Punteggio di ottimizzazione di Google (solo indicativo).
    if dati.punteggio_ottimizzazione is not None and dati.punteggio_ottimizzazione < 0.70:
        punti.append(Punto(
            "bassa", "Account", "Punteggio di ottimizzazione basso",
            f"Google indica {dati.punteggio_ottimizzazione * 100:.0f}%.",
            "Passa in rassegna i consigli di Google e applica solo quelli coerenti con gli obiettivi.",
        ))

    # 10. Nessuna attività sull'account.
    if cor.costo > 0 and not dati.modifiche and g >= 10:
        punti.append(Punto(
            "bassa", "Gestione", "Nessuna modifica registrata nel periodo",
            "L'account non risulta modificato negli ultimi giorni analizzati.",
            "Pianifica una sessione di ottimizzazione (negative, annunci, offerte).",
        ))

    punti.sort(key=lambda p: (p.opportunita, ORDINE_GRAVITA[p.gravita]))
    tipi = Counter(f"{m.risorsa} · {m.operazione}" for m in dati.modifiche)

    return Analisi(
        cliente=cliente, dati=dati, periodi=periodi, kpi=kpi, pacing=pacing, campagne=righe,
        punti=punti, sprechi=sprechi[:25], spreco_totale=spreco_totale,
        keyword_qs_bassa=sorted(qs_bassa, key=lambda kw: -kw.costo)[:15],
        modifiche=dati.modifiche[:20], modifiche_per_tipo=tipi.most_common(),
    )
