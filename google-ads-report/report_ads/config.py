"""Caricamento della configurazione clienti (clienti.yaml).

Un cliente può avere un solo account Google Ads oppure più locali (`locali:`),
ognuno con il suo account: in quel caso riceve un unico report di gruppo.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from pathlib import Path

import yaml

from .periodi import MOMENTI


@dataclass
class Cliente:
    """Un account Google Ads (per i gruppi: un locale)."""
    nome: str
    customer_id: str
    obiettivo: str = "lead"  # lead | ecommerce | negozio
    budget_mensile: float | None = None
    cpa_target: float | None = None
    roas_target: float | None = None
    email: list[str] = field(default_factory=list)
    # False: il report cliente arriva a te da inoltrare. True: parte direttamente al cliente.
    invio_automatico: bool = False
    report_cliente: list[str] = field(default_factory=lambda: ["inizio"])
    note: str = ""  # contesto per l'analisi (stagionalità, obiettivi, vincoli)
    # Obiettivo "negozio": se Google non misura le visite al negozio, si stimano
    # come questa quota delle indicazioni stradali.
    quota_visite_indicazioni: float = 0.27
    # Report dei locali: descrizione sotto il nome, fasce orarie di servizio e
    # parametri per il fatturato attribuibile (visite × coperti × scontrino).
    descrizione: str = ""
    fasce: list[list[int]] = field(default_factory=lambda: [[12, 14], [18, 20]])
    coperti_per_visita: float | None = None
    scontrino_medio: float | None = None
    # Contratto del locale: le visite contano da `contratto_dal` (AAAA-MM-GG); obiettivo di
    # visite da raggiungere entro `obiettivo_fino`; compenso fisso mensile (oneri esclusi).
    contratto_dal: str | None = None
    obiettivo_visite: int | None = None
    obiettivo_fino: str | None = None
    compenso_fisso: float | None = None

    @property
    def ecommerce(self) -> bool:
        return self.obiettivo == "ecommerce"

    @property
    def negozio(self) -> bool:
        return self.obiettivo == "negozio"


@dataclass
class Compenso:
    """Come si calcola il compenso nel report cliente.

    - percentuale: `percentuale` del fatturato attribuibile. Con base "mese_precedente"
      si usano le visite del mese prima, ormai consolidate (fino a 30 giorni di attribuzione);
      con base "mese" le visite del mese chiuso registrate a oggi.
    - fisso: `importo` fisso; il report mostra margine, ROI e ROAS (serve `margine`).
    """
    tipo: str = "percentuale"  # percentuale | fisso
    percentuale: float = 0.0
    base: str = "mese_precedente"  # mese_precedente | mese
    importo: float = 0.0
    margine: float | None = None


@dataclass
class Gruppo:
    """Un cliente: riceve un report con uno o più locali."""
    nome: str
    locali: list[Cliente]
    sottotitolo: str = ""
    colore: str = ""
    report_cliente: list[str] = field(default_factory=lambda: ["inizio"])
    email: list[str] = field(default_factory=list)
    invio_automatico: bool = False
    # Numerazione: {mese: "2026-09", numero: 3} significa che settembre 2026 è il report N.3.
    report_n: dict | None = None
    target_costo_visita: float | None = None
    # Quota di visite che Google registra in ritardo (fino a 30 giorni): stima consolidata = rilevate / (1 - x).
    sottostima_visite: float = 0.30
    compenso: Compenso | None = None
    # Testi del mese scritti da te: cosa è stato fatto e prossimi passi aggiuntivi.
    fatto: str = ""
    prossimi_passi: list[str] = field(default_factory=list)

    @property
    def negozio(self) -> bool:
        return all(loc.negozio for loc in self.locali)

    def numero_report(self, anno: int, mese: int) -> int | None:
        if not self.report_n:
            return None
        a, m = (int(x) for x in str(self.report_n["mese"]).split("-"))
        return int(self.report_n["numero"]) + (anno - a) * 12 + (mese - m)


@dataclass
class Agenzia:
    nome: str = "Francesco Gizzi"
    sito: str = ""
    email_interna: str = ""
    colore: str = "#173b7a"


@dataclass
class Configurazione:
    agenzia: Agenzia
    gruppi: list[Gruppo]

    @property
    def clienti(self) -> list[Cliente]:
        """Tutti gli account, uno per locale."""
        return [loc for g in self.gruppi for loc in g.locali]


CAMPI_CLIENTE = {f.name for f in fields(Cliente)}
CAMPI_GRUPPO = {f.name for f in fields(Gruppo)} - {"locali", "nome", "compenso"}


def _cliente(dati: dict, ereditati: dict, posizione: str) -> Cliente:
    c = {**{k: v for k, v in ereditati.items() if k in CAMPI_CLIENTE}, **dati}
    if not c.get("nome") or not c.get("customer_id"):
        raise ValueError(f"{posizione}: 'nome' e 'customer_id' sono obbligatori")
    sconosciuti = set(c) - CAMPI_CLIENTE
    if sconosciuti:
        raise ValueError(f"{posizione}: campi sconosciuti {sorted(sconosciuti)}")
    if isinstance(c.get("email"), str):
        c["email"] = [c["email"]]
    cliente = Cliente(**c)
    cliente.customer_id = str(cliente.customer_id)
    if cliente.obiettivo not in ("lead", "ecommerce", "negozio"):
        raise ValueError(f"{cliente.nome}: obiettivo deve essere 'lead', 'ecommerce' o 'negozio'")
    sconosciuti = set(cliente.report_cliente) - set(MOMENTI)
    if sconosciuti:
        raise ValueError(f"{cliente.nome}: report_cliente contiene valori non validi {sconosciuti}")
    return cliente


def carica(percorso: str | Path) -> Configurazione:
    dati = yaml.safe_load(Path(percorso).read_text(encoding="utf-8")) or {}
    agenzia = Agenzia(**(dati.get("agenzia") or {}))
    gruppi = []
    for i, voce in enumerate(dati.get("clienti") or [], start=1):
        voce = dict(voce)
        compenso = Compenso(**voce.pop("compenso")) if voce.get("compenso") else None
        if isinstance(voce.get("email"), str):
            voce["email"] = [voce["email"]]
        if "locali" in voce:
            locali_dati = voce.pop("locali") or []
            if not voce.get("nome") or not locali_dati:
                raise ValueError(f"Cliente n. {i}: un gruppo richiede 'nome' e almeno un locale")
            comuni = {k: v for k, v in voce.items() if k != "nome"}
            locali = [_cliente(loc, comuni, f"Cliente n. {i}, locale n. {j}")
                      for j, loc in enumerate(locali_dati, start=1)]
        else:
            locali = [_cliente({k: v for k, v in voce.items() if k in CAMPI_CLIENTE}, {}, f"Cliente n. {i}")]
        extra = {k: v for k, v in voce.items() if k in CAMPI_GRUPPO}
        sconosciuti = set(voce) - CAMPI_CLIENTE - CAMPI_GRUPPO - {"nome"}
        if sconosciuti:
            raise ValueError(f"Cliente n. {i}: campi sconosciuti {sorted(sconosciuti)}")
        gruppi.append(Gruppo(nome=voce["nome"], locali=locali, compenso=compenso, **extra))
    if not gruppi:
        raise ValueError("Nessun cliente configurato")
    return Configurazione(agenzia, gruppi)
