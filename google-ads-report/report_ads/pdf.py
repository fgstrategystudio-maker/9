"""Conversione del report cliente in PDF (WeasyPrint, gratuito e senza browser)."""

from __future__ import annotations

import logging
from pathlib import Path

log = logging.getLogger(__name__)


def html_a_pdf(html: str, percorso: Path) -> bool:
    """Scrive il PDF e restituisce True; False se WeasyPrint non è disponibile o fallisce
    (in quel caso il report resta in HTML)."""
    try:
        from weasyprint import HTML
    except (ImportError, OSError) as e:  # OSError: librerie di sistema (Pango) mancanti
        log.warning("PDF non disponibile (%s): il report resta in HTML", type(e).__name__)
        return False
    try:
        HTML(string=html, base_url=str(percorso.parent)).write_pdf(percorso)
    except Exception as e:  # noqa: BLE001 - un PDF fallito non deve bloccare gli invii
        log.warning("Creazione del PDF non riuscita (%s): il report resta in HTML", type(e).__name__)
        return False
    return True
