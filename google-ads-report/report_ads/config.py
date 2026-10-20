"""Caricamento della configurazione clienti (clienti.yaml)."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

from .periodi import MOMENTI


@dataclass
class Cliente:
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

    @property
    def ecommerce(self) -> bool:
        return self.obiettivo == "ecommerce"

    @property
    def negozio(self) -> bool:
        return self.obiettivo == "negozio"


@dataclass
class Agenzia:
    nome: str = "Francesco Gizzi"
    sito: str = ""
    email_interna: str = ""
    colore: str = "#173b7a"


@dataclass
class Configurazione:
    agenzia: Agenzia
    clienti: list[Cliente]


def carica(percorso: str | Path) -> Configurazione:
    dati = yaml.safe_load(Path(percorso).read_text(encoding="utf-8")) or {}
    agenzia = Agenzia(**(dati.get("agenzia") or {}))
    clienti = []
    for i, c in enumerate(dati.get("clienti") or [], start=1):
        if not c.get("nome") or not c.get("customer_id"):
            raise ValueError(f"Cliente n. {i}: 'nome' e 'customer_id' sono obbligatori")
        if isinstance(c.get("email"), str):
            c["email"] = [c["email"]]
        cliente = Cliente(**c)
        cliente.customer_id = str(cliente.customer_id)
        if cliente.obiettivo not in ("lead", "ecommerce", "negozio"):
            raise ValueError(f"{cliente.nome}: obiettivo deve essere 'lead', 'ecommerce' o 'negozio'")
        sconosciuti = set(cliente.report_cliente) - set(MOMENTI)
        if sconosciuti:
            raise ValueError(f"{cliente.nome}: report_cliente contiene valori non validi {sconosciuti}")
        clienti.append(cliente)
    if not clienti:
        raise ValueError("Nessun cliente configurato")
    return Configurazione(agenzia, clienti)
