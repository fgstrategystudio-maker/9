"""Strutture dati comuni: le fonti (API reale o demo) producono questi oggetti,
l'analisi e i template li leggono."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class Metriche:
    costo: float = 0.0
    impressioni: int = 0
    clic: int = 0
    conversioni: float = 0.0
    valore_conv: float = 0.0
    # Quote impressioni (0-1). None quando Google non le fornisce
    # (campagne non Search o volumi troppo bassi).
    quota_impr: float | None = None
    persa_budget: float | None = None
    persa_ranking: float | None = None

    @property
    def ctr(self) -> float | None:
        return self.clic / self.impressioni if self.impressioni else None

    @property
    def cpc(self) -> float | None:
        return self.costo / self.clic if self.clic else None

    @property
    def cpa(self) -> float | None:
        return self.costo / self.conversioni if self.conversioni else None

    @property
    def roas(self) -> float | None:
        return self.valore_conv / self.costo if self.costo else None

    @property
    def tasso_conv(self) -> float | None:
        return self.conversioni / self.clic if self.clic else None


@dataclass
class Campagna:
    id: str
    nome: str
    stato: str  # ENABLED, PAUSED
    tipo: str  # SEARCH, PERFORMANCE_MAX, DISPLAY, ...
    budget_giornaliero: float | None
    metriche: Metriche = field(default_factory=Metriche)


@dataclass
class DatiPeriodo:
    totale: Metriche
    campagne: dict[str, Campagna]
    giornaliero: list[tuple[date, float, float]] = field(default_factory=list)  # (giorno, costo, conversioni)


@dataclass
class TermineRicerca:
    termine: str
    campagna: str
    gruppo: str
    costo: float
    clic: int
    conversioni: float


@dataclass
class Keyword:
    testo: str
    campagna: str
    gruppo: str
    punteggio_qualita: int | None
    costo: float
    conversioni: float


@dataclass
class Modifica:
    quando: datetime
    utente: str
    risorsa: str  # CAMPAIGN, AD_GROUP, AD, CAMPAIGN_BUDGET, ...
    operazione: str  # CREATE, UPDATE, REMOVE
    campagna: str
    campi: list[str]


@dataclass
class DatiAccount:
    nome: str
    valuta: str
    punteggio_ottimizzazione: float | None
    corrente: DatiPeriodo
    precedente: DatiPeriodo
    anno_prec: DatiPeriodo | None
    termini_ricerca: list[TermineRicerca]
    keyword: list[Keyword]
    modifiche: list[Modifica]
