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
from html import escape
import sys
import unicodedata
from datetime import date
from pathlib import Path

from . import config as cfg
from .analisi import analizza
from .commento import scrivi_commenti
from .invio import Mittente
from .periodi import MOMENTI, calcola_periodi, momento_automatico
from .pdf import html_a_pdf
from .render import report_cliente, report_interno, report_locali
from .report_locali import vista_gruppo

log = logging.getLogger("report_ads")


def _slug(testo: str) -> str:
    ascii_ = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_.lower()).strip("-") or "cliente"


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
    logging.getLogger("fontTools").setLevel(logging.WARNING)
    logging.getLogger("weasyprint").setLevel(logging.ERROR)
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
    n = 0
    for gruppo in configurazione.gruppi:
        report_gruppo = momento in gruppo.report_cliente
        dettaglio = report_gruppo and gruppo.negozio
        analisi_gruppo = []
        for cliente in gruppo.locali:
            n += 1
            try:
                dati = fonte.scarica(cliente.customer_id, periodi, dettaglio=dettaglio)
                a = analizza(cliente, dati, periodi)
                scrivi_commenti(a)
            except Exception as e:  # un account in errore non deve bloccare gli altri
                log.error("Account %d/%d: errore (%s)", n, totale, type(e).__name__)
                errori.append((cliente.nome, _descrivi_errore(e)))
                continue
            analisi.append(a)
            analisi_gruppo.append(a)
            log.info("Account %d/%d: ok (%d punti di attenzione, commento %s)",
                     n, totale, len(a.punti), "AI" if a.commento_ai else "automatico")
        if not report_gruppo:
            continue
        if len(analisi_gruppo) < len(gruppo.locali):
            log.error("Report cliente %d non generato: uno o più account del gruppo sono in errore", len(per_cliente) + 1)
            continue
        if gruppo.negozio:
            # Ristoranti e locali: un unico report PDF per il cliente, anche con più locali.
            try:
                html = report_locali(vista_gruppo(gruppo, analisi_gruppo, agenzia))
            except Exception as e:
                log.error("Report cliente non generato (%s)", type(e).__name__)
                errori.append((gruppo.nome, "Report cliente: " + _descrivi_errore(e)))
                continue
            base = cartella / f"cliente-{_slug(gruppo.nome)}-{suffisso}"
            base.with_suffix(".html").write_text(html, encoding="utf-8")
            pdf = base.with_suffix(".pdf")
            percorso = pdf if html_a_pdf(html, pdf) else base.with_suffix(".html")
            per_cliente.append((gruppo, percorso, None))
        else:
            for a in analisi_gruppo:
                percorso = cartella / f"cliente-{_slug(a.cliente.nome)}-{suffisso}.html"
                percorso.write_text(report_cliente(a, agenzia), encoding="utf-8")
                per_cliente.append((gruppo, percorso, a))

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
        for gruppo, percorso, a in per_cliente:
            nome = a.cliente.nome if a else gruppo.nome
            destinatari = (a.cliente.email if a else gruppo.email) or []
            automatico = a.cliente.invio_automatico if a else gruppo.invio_automatico
            oggetto = f"Report Google Ads · {nome} · {periodi.corrente.etichetta()}"
            if percorso.suffix == ".pdf":
                html = (f"<p>Report Google Ads di <strong>{escape(nome)}</strong>, {periodi.titolo}.</p>"
                        "<p>Il report completo è nel PDF allegato.</p>")
            else:
                html = percorso.read_text(encoding="utf-8")
            if automatico and destinatari and not args.demo:
                mittente.invia(destinatari, oggetto, html, allegato=percorso, ccn=[email_interna])
            else:
                mittente.invia([email_interna], f"{demo}[Da inoltrare] {oggetto}", html, allegato=percorso)
        log.info("Email inviate: 1 interna, %d report cliente", len(per_cliente))

    # Un errore su un account fa fallire il workflow, così GitHub ti avvisa.
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
