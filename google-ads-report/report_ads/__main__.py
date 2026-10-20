"""Generazione e invio dei report Google Ads.

Esempi:
    python -m report_ads --demo --momento meta          # prova con dati finti
    python -m report_ads --momento auto --invia         # uso in GitHub Actions
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
from datetime import date
from pathlib import Path

from . import config as cfg
from .analisi import analizza
from .commento import scrivi_commenti
from .invio import Mittente
from .periodi import MOMENTI, calcola_periodi, momento_automatico
from .render import report_cliente, report_interno

log = logging.getLogger("report_ads")


def _slug(testo: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", testo.lower()).strip("-") or "cliente"


def _descrivi_errore(e: Exception) -> str:
    try:
        from google.ads.googleads.errors import GoogleAdsException
    except ImportError:
        GoogleAdsException = ()  # noqa: N806
    if GoogleAdsException and isinstance(e, GoogleAdsException):
        return "; ".join(err.message for err in e.failure.errors) + f" (request_id {e.request_id})"
    return f"{type(e).__name__}: {e}"[:600]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="report_ads", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--config", default="clienti.yaml", help="file di configurazione clienti")
    parser.add_argument("--momento", default="auto", choices=("auto",) + MOMENTI)
    parser.add_argument("--data", help="data di esecuzione simulata (AAAA-MM-GG), utile per i test")
    parser.add_argument("--demo", action="store_true", help="usa dati di esempio invece della Google Ads API")
    parser.add_argument("--invia", action="store_true", help="invia i report via email")
    parser.add_argument("--output", default="output", help="cartella dove salvare i report HTML")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpx2").setLevel(logging.WARNING)
    oggi = date.fromisoformat(args.data) if args.data else date.today()
    momento = momento_automatico(oggi) if args.momento == "auto" else args.momento
    if momento is None:
        log.info("Oggi (%s) non è giorno di report: niente da fare.", oggi)
        return 0
    periodi = calcola_periodi(momento, oggi)
    configurazione = cfg.carica(args.config)
    agenzia = configurazione.agenzia
    email_interna = os.environ.get("REPORT_EMAIL_INTERNA") or agenzia.email_interna

    if args.demo:
        from .fonte_demo import FonteDemo
        fonte = FonteDemo()
    else:
        from .fonte_google_ads import FonteGoogleAds
        try:
            fonte = FonteGoogleAds()
        except Exception as e:
            # Errori di credenziali (refresh token scaduto, client OAuth errato): nessun dato cliente nel testo.
            log.error("Accesso a Google Ads non riuscito: %s", _descrivi_errore(e))
            return 1

    cartella = Path(args.output)
    cartella.mkdir(parents=True, exist_ok=True)
    suffisso = f"{momento}-{oggi:%Y-%m-%d}"
    totale = len(configurazione.clienti)
    # Nei log niente nomi o dati dei clienti: su un repository pubblico i log di Actions sono visibili a tutti.
    log.info("Report '%s' per %d account, periodo %s", momento, totale, periodi.corrente.etichetta())

    analisi, errori, per_cliente = [], [], []
    for i, cliente in enumerate(configurazione.clienti, start=1):
        try:
            dati = fonte.scarica(cliente.customer_id, periodi)
            a = analizza(cliente, dati, periodi)
            scrivi_commenti(a)
        except Exception as e:  # un account in errore non deve bloccare gli altri
            log.error("Account %d/%d: errore (%s)", i, totale, type(e).__name__)
            errori.append((cliente.nome, _descrivi_errore(e)))
            continue
        analisi.append(a)
        log.info("Account %d/%d: ok (%d punti di attenzione, commento %s)",
                 i, totale, len(a.punti), "AI" if a.commento_ai else "automatico")
        if momento in cliente.report_cliente:
            percorso = cartella / f"cliente-{_slug(cliente.nome)}-{suffisso}.html"
            percorso.write_text(report_cliente(a, agenzia), encoding="utf-8")
            per_cliente.append((a, percorso))

    interno = cartella / f"interno-{suffisso}.html"
    interno.write_text(report_interno(analisi, errori, periodi, agenzia, args.demo), encoding="utf-8")
    log.info("Report salvati in %s: 1 interno, %d cliente", cartella, len(per_cliente))

    if args.invia:
        mittente = Mittente()
        if not mittente.configurato or not email_interna:
            log.error("Invio richiesto ma SMTP_USER/SMTP_PASSWORD o l'email interna non sono configurati")
            return 1
        demo = "[DEMO] " if args.demo else ""
        mittente.invia([email_interna], f"{demo}Google Ads · report interno · {periodi.titolo}",
                       interno.read_text(encoding="utf-8"))
        for a, percorso in per_cliente:
            oggetto = f"Report Google Ads · {a.cliente.nome} · {periodi.corrente.etichetta()}"
            html = percorso.read_text(encoding="utf-8")
            if a.cliente.invio_automatico and a.cliente.email and not args.demo:
                mittente.invia(a.cliente.email, oggetto, html, allegato=percorso, ccn=[email_interna])
            else:
                mittente.invia([email_interna], f"{demo}[Da inoltrare] {oggetto}", html, allegato=percorso)
        log.info("Email inviate: 1 interna, %d report cliente", len(per_cliente))

    # Un errore su un account fa fallire il workflow, così GitHub ti avvisa.
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
