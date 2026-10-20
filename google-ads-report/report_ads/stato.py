"""Memoria tra un report e l'altro: cosa abbiamo scritto al cliente ogni mese.

Dopo l'invio dei report del 1° del mese si salvano, per ogni locale, le visite e i numeri principali
scritti nel report e i testi del report. Il mese dopo servono per l'attribuzione a 30 giorni, per il
conguaglio della fee e per dare continuità ai testi di Claude.

Il file è cifrato: GitHub Actions lo tiene su un ramo a parte del repository (pubblico), quindi senza
la chiave non si legge. La chiave è il Secret STATO_CHIAVE se c'è, altrimenti viene ricavata da
GOOGLE_ADS_CLIENT_SECRET (così non serve configurare nulla).
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
from pathlib import Path

log = logging.getLogger(__name__)

VERSIONE = 1
MESI_TENUTI = 24


def _chiave() -> bytes | None:
    segreto = os.environ.get("STATO_CHIAVE") or os.environ.get("GOOGLE_ADS_CLIENT_SECRET")
    if not segreto:
        return None
    return base64.urlsafe_b64encode(hashlib.sha256(("report-ads-stato:" + segreto).encode()).digest())


def carica(percorso: str | Path) -> dict:
    """Stato salvato ({} se manca o non si può leggere: il report parte comunque)."""
    file = Path(percorso)
    if not file.exists() or not file.read_bytes().strip():
        return {}
    chiave = _chiave()
    if chiave is None:
        log.warning("Memoria dei report non letta: manca la chiave")
        return {}
    from cryptography.fernet import Fernet, InvalidToken

    try:
        dati = json.loads(Fernet(chiave).decrypt(file.read_bytes().strip()))
    except (InvalidToken, ValueError):
        log.warning("Memoria dei report non leggibile (chiave cambiata?): si riparte da zero")
        return {}
    return dati if dati.get("versione") == VERSIONE else {}


def salva(percorso: str | Path, stato: dict) -> bool:
    chiave = _chiave()
    if chiave is None:
        log.warning("Memoria dei report non salvata: manca la chiave")
        return False
    from cryptography.fernet import Fernet

    stato["versione"] = VERSIONE
    for gruppo in stato.get("clienti", {}).values():
        for mese in sorted(gruppo)[:-MESI_TENUTI]:
            del gruppo[mese]
    Path(percorso).write_bytes(Fernet(chiave).encrypt(json.dumps(stato, ensure_ascii=False).encode()))
    return True


def mesi(stato: dict, cliente: str) -> dict:
    """{"AAAA-MM": report di quel mese} per un cliente (gruppo)."""
    return stato.get("clienti", {}).get(cliente, {})


def registra(stato: dict, cliente: str, mese: str, report: dict) -> None:
    stato.setdefault("clienti", {}).setdefault(cliente, {})[mese] = report
