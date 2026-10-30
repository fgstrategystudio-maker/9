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
    # Azioni locali (tutte le conversioni, anche secondarie). Servono all'obiettivo "negozio".
    indicazioni: float = 0.0  # clic su indicazioni stradali
    visite_reali: float = 0.0  # visite al negozio misurate da Google
    contatti: float = 0.0  # chiamate e contatti
    ordini: float = 0.0  # ordini e prenotazioni avviati
    # Visite al negozio già incluse nella colonna Conversioni (quando sono un obiettivo principale):
    # vanno tolte per ottenere le azioni ad alto intento.
    visite_in_conversioni: float = 0.0
    # Per l'obiettivo "negozio" `conversioni` diventa il numero di visite (reali o stimate):
    # qui resta il valore originale delle conversioni Google Ads.
    conversioni_google: float | None = None

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
    # Stato secondo Google (es. LIMITED / LEARNING) e motivi (es. BUDGET_CONSTRAINED).
    stato_primario: str = ""
    motivi_stato: list[str] = field(default_factory=list)


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
    conversioni_tutte: float = 0.0  # include le azioni secondarie (es. indicazioni stradali)


@dataclass
class Keyword:
    testo: str
    campagna: str
    gruppo: str
    punteggio_qualita: int | None
    costo: float
    conversioni: float
    conversioni_tutte: float = 0.0


@dataclass
class Modifica:
    quando: datetime
    utente: str
    risorsa: str  # CAMPAIGN, AD_GROUP, AD, CAMPAIGN_BUDGET, ...
    operazione: str  # CREATE, UPDATE, REMOVE
    campagna: str
    campi: list[str]


@dataclass
class Canale:
    nome: str  # Rete di Ricerca, Google Maps, YouTube e altro
    metriche: Metriche


@dataclass
class GruppoAsset:
    """Gruppo di asset Performance Max (nei tuoi account: uno per lingua)."""
    nome: str
    metriche: Metriche
    conversioni_prec: float | None = None


@dataclass
class Dettaglio:
    """Dati aggiuntivi per il report dei locali (solo obiettivo negozio)."""
    canali: list[Canale] = field(default_factory=list)
    gruppi_asset: list[GruppoAsset] = field(default_factory=list)
    conversioni_per_ora: list[float] = field(default_factory=lambda: [0.0] * 24)
    # Media giornaliera di conversioni per giorno della settimana (lun..dom).
    giorni_corrente: list[float] = field(default_factory=lambda: [0.0] * 7)
    giorni_precedente: list[float] = field(default_factory=lambda: [0.0] * 7)
    # Totali del mese per giorno della settimana e spesa per ora (tabelle "Giorni e orari").
    conversioni_giorno_totale: list[float] = field(default_factory=lambda: [0.0] * 7)
    spesa_per_giorno: list[float] = field(default_factory=lambda: [0.0] * 7)
    spesa_per_ora: list[float] = field(default_factory=lambda: [0.0] * 24)
    # Canali del mese precedente, per il confronto tra mesi.
    canali_precedente: list[Canale] = field(default_factory=list)


@dataclass
class MeseStorico:
    """Totali di un mese, per lo storico dall'inizio della gestione."""
    mese: date  # primo giorno del mese
    giorni: int  # giorni del mese letti (l'ultimo mese può essere parziale)
    metriche: Metriche


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
    visite_stimate: bool = False  # obiettivo negozio: visite ricavate dalle indicazioni stradali
    due_mesi_prima: DatiPeriodo | None = None  # solo report di chiusura mese
    dettaglio: Dettaglio | None = None
    storico: list[MeseStorico] = field(default_factory=list)  # mesi più vecchi prima
    # Dati per i report Word/PowerPoint: posizione delle campagne, budget consigliato,
    # quota delle conversioni Performance Max su ricerche del nome del locale (vedi FonteGoogleAds.extra).
    extra: dict = field(default_factory=dict)
