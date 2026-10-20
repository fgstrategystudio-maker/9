"""Calcolo dei periodi da analizzare per ciascun momento del mese.

- inizio (giorno 1): chiusura del mese precedente, confronto con il mese
  prima e con lo stesso mese dell'anno scorso.
- meta (giorno 15): andamento dal giorno 1 a ieri, confronto con gli stessi
  giorni del mese precedente, proiezione a fine mese.
- fine (ultimo giorno): pre-chiusura, dal giorno 1 a ieri, proiezione e
  impostazione del mese successivo.

I dati si fermano sempre a ieri: il giorno in corso è incompleto.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta

MESI = [
    "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
]

MOMENTI = ("inizio", "meta", "fine")

NOMI_MOMENTO = {
    "inizio": "Chiusura mese",
    "meta": "Controllo di metà mese",
    "fine": "Pre-chiusura mese",
}


@dataclass(frozen=True)
class Intervallo:
    inizio: date
    fine: date

    @property
    def giorni(self) -> int:
        return (self.fine - self.inizio).days + 1

    def gaql(self) -> str:
        return f"segments.date BETWEEN '{self.inizio:%Y-%m-%d}' AND '{self.fine:%Y-%m-%d}'"

    def etichetta(self) -> str:
        a, b = self.inizio, self.fine
        if a.day == 1 and b.day == giorni_nel_mese(b) and (a.year, a.month) == (b.year, b.month):
            return f"{MESI[a.month - 1].capitalize()} {a.year}"
        if (a.year, a.month) == (b.year, b.month):
            return f"{a.day}–{b.day} {MESI[a.month - 1]} {a.year}"
        return f"{a.day} {MESI[a.month - 1]} {a.year} – {b.day} {MESI[b.month - 1]} {b.year}"


@dataclass(frozen=True)
class Periodi:
    momento: str
    oggi: date
    corrente: Intervallo
    precedente: Intervallo
    anno_prec: Intervallo | None
    giorni_mese: int  # giorni del mese a cui si riferisce il budget

    @property
    def mese_chiuso(self) -> bool:
        return self.momento == "inizio"

    @property
    def quota_trascorsa(self) -> float:
        """Frazione del mese coperta dai dati (1.0 a mese chiuso)."""
        return self.corrente.giorni / self.giorni_mese

    @property
    def titolo(self) -> str:
        return f"{NOMI_MOMENTO[self.momento]} · {self.corrente.etichetta()}"


def giorni_nel_mese(d: date) -> int:
    return calendar.monthrange(d.year, d.month)[1]


def ultimo_giorno_del_mese(d: date) -> bool:
    return d.day == giorni_nel_mese(d)


def momento_automatico(oggi: date) -> str | None:
    """Il momento che corrisponde a oggi, oppure None se oggi non è giorno di report."""
    if oggi.day == 1:
        return "inizio"
    if oggi.day == 15:
        return "meta"
    if ultimo_giorno_del_mese(oggi):
        return "fine"
    return None


def _mese_precedente(d: date) -> date:
    """Il primo giorno del mese prima di quello di d."""
    primo = d.replace(day=1)
    return (primo - timedelta(days=1)).replace(day=1)


def _stesso_tratto(primo_del_mese: date, giorni: int) -> Intervallo:
    """I primi `giorni` giorni del mese, troncati alla sua lunghezza."""
    n = min(giorni, giorni_nel_mese(primo_del_mese))
    return Intervallo(primo_del_mese, primo_del_mese + timedelta(days=n - 1))


def calcola_periodi(momento: str, oggi: date) -> Periodi:
    if momento not in MOMENTI:
        raise ValueError(f"Momento sconosciuto: {momento} (validi: {', '.join(MOMENTI)})")

    if momento == "inizio":
        primo = _mese_precedente(oggi)
        corrente = Intervallo(primo, primo.replace(day=giorni_nel_mese(primo)))
        prima = _mese_precedente(primo)
        precedente = Intervallo(prima, prima.replace(day=giorni_nel_mese(prima)))
        try:
            ap = primo.replace(year=primo.year - 1)
        except ValueError:  # non succede col giorno 1, ma per sicurezza
            ap = primo.replace(year=primo.year - 1, day=28)
        anno_prec = Intervallo(ap, ap.replace(day=giorni_nel_mese(ap)))
        return Periodi(momento, oggi, corrente, precedente, anno_prec, giorni_nel_mese(primo))

    if oggi.day == 1:
        raise ValueError("Il report di metà/fine mese richiede almeno un giorno di dati nel mese.")
    ieri = oggi - timedelta(days=1)
    corrente = Intervallo(oggi.replace(day=1), ieri)
    precedente = _stesso_tratto(_mese_precedente(oggi), corrente.giorni)
    return Periodi(momento, oggi, corrente, precedente, None, giorni_nel_mese(oggi))
