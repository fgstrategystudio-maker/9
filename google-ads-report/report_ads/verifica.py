"""Controlli di coerenza sui dati scaricati: le parti devono tornare con i totali.

L'esito completo (con i numeri) va nel report interno; nei log, che sono pubblici,
finisce solo il conteggio dei controlli superati.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from .analisi import Analisi
from .report_locali import azioni


@dataclass
class Controllo:
    nome: str
    ok: bool
    dettaglio: str


def _uguali(a: float, b: float, tolleranza: float = 0.02, minimo: float = 2.0) -> bool:
    return abs(a - b) <= max(minimo, abs(b) * tolleranza)


def _fmt(x: float) -> str:
    return f"{x:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _controllo(nome: str, parte: float, totale: float, etichette: tuple[str, str], **kw) -> Controllo:
    ok = _uguali(parte, totale, **kw)
    return Controllo(nome, ok, f"{etichette[0]} {_fmt(parte)} · {etichette[1]} {_fmt(totale)}")


def controlla(a: Analisi) -> list[Controllo]:
    d = a.dati
    t = d.corrente.totale
    campagne = list(d.corrente.campagne.values())
    risultati = [
        _controllo("Spesa delle campagne = spesa dell'account", sum(c.metriche.costo for c in campagne), t.costo,
                   ("campagne", "account"), tolleranza=0.01, minimo=1.0),
        _controllo("Clic delle campagne = clic dell'account", sum(c.metriche.clic for c in campagne), t.clic,
                   ("campagne", "account"), tolleranza=0.01),
    ]
    if not a.cliente.negozio:
        return risultati

    az = azioni(t)
    parti = t.indicazioni + t.contatti + t.ordini
    risultati.append(Controllo(
        "Azioni = indicazioni + contatti + ordini",
        parti <= az + 2 and (az - parti) <= max(2.0, az * 0.05),
        f"indicazioni {_fmt(t.indicazioni)} + contatti {_fmt(t.contatti)} + ordini {_fmt(t.ordini)} "
        f"= {_fmt(parti)} · azioni {_fmt(az)}",
    ))
    if not d.visite_stimate:
        risultati.append(Controllo(
            "Visite: colonna Risultati di Google",
            t.visite_in_conversioni == 0 or _uguali(t.visite_reali, t.visite_in_conversioni, 0.0, 0.5),
            f"visite usate {_fmt(t.visite_reali)} · visite nella colonna Conversioni {_fmt(t.visite_in_conversioni)}",
        ))

    det = d.dettaglio
    if not det:
        return risultati
    if det.canali:
        ch = [c.metriche for c in det.canali]
        risultati += [
            _controllo("Canali: spesa = totale", sum(m.costo for m in ch), t.costo, ("canali", "totale"),
                       tolleranza=0.01, minimo=1.0),
            _controllo("Canali: clic = totale", sum(m.clic for m in ch), t.clic, ("canali", "totale"), tolleranza=0.01),
            _controllo("Canali: azioni = totale", sum(m.conversioni for m in ch), az, ("canali", "totale")),
        ]
        if not d.visite_stimate:
            risultati.append(_controllo("Canali: visite = totale", sum(m.visite_reali for m in ch), t.visite_reali,
                                        ("canali", "totale")))
    if det.gruppi_asset:
        pmax = [c.metriche for c in campagne if c.tipo == "PERFORMANCE_MAX"]
        if pmax:
            risultati += [
                _controllo("Lingue: spesa = campagne Performance Max", sum(g.metriche.costo for g in det.gruppi_asset),
                           sum(m.costo for m in pmax), ("lingue", "Performance Max"), tolleranza=0.01, minimo=1.0),
                _controllo("Lingue: azioni = campagne Performance Max",
                           sum(g.metriche.conversioni for g in det.gruppi_asset), sum(azioni(m) for m in pmax),
                           ("lingue", "Performance Max")),
            ]
    if any(det.conversioni_per_ora):
        risultati.append(_controllo("Orari: somma = azioni", sum(det.conversioni_per_ora), az, ("orari", "azioni")))
    if any(det.giorni_corrente):
        # I giorni sono medie: si moltiplicano per quante volte quel giorno cade nel periodo.
        intervallo = a.periodi.corrente
        conteggio = [0] * 7
        for i in range(intervallo.giorni):
            conteggio[(intervallo.inizio + timedelta(days=i)).weekday()] += 1
        somma = sum(m * c for m, c in zip(det.giorni_corrente, conteggio))
        risultati.append(_controllo("Giorni: somma = azioni", somma, az, ("giorni", "azioni")))
    return risultati
