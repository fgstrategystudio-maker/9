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
from . import stato as memoria
from .analisi import analizza
from .commento import scrivi_commenti
from .invio import Mittente
from .periodi import MOMENTI, Intervallo, calcola_periodi, momento_automatico
from .pdf import html_a_pdf
from .render import report_cliente, report_grano, report_interno, report_locali
from .report_grano import vista_grano
from .report_locali import vista_gruppo
from .testi_ai import testi_grano, testi_gruppo, testi_scritti
from .verifica import controlla

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


def _prepara_contratto(fonte, a, gruppo) -> None:
    """Fee del primo mese: le visite contano dal giorno di inizio del contratto."""
    c, per = a.cliente, a.periodi
    try:
        dal = date.fromisoformat(c.contratto_dal)
    except ValueError:
        log.error("contratto_dal non valido: usa il formato AAAA-MM-GG")
        return

    def visite(intervallo: Intervallo) -> float:
        reali, indicazioni = fonte.visite_intervallo(c.customer_id, intervallo)
        return indicazioni * c.quota_visite_indicazioni if a.dati.visite_stimate else reali

    try:
        base_prec = gruppo.compenso is not None and gruppo.compenso.base == "mese_precedente"
        base = per.precedente if base_prec else per.corrente
        if dal > base.fine:
            a.fuori_contratto = True
        elif dal > base.inizio:
            a.visite_base_fee = visite(Intervallo(dal, base.fine))
    except Exception as e:  # noqa: BLE001
        log.warning("Visite dall'inizio del contratto non disponibili (%s)", type(e).__name__)


def _prepara_attribuzione(fonte, a) -> None:
    """Visite del mese precedente: quelle scritte nel report già inviato e quelle di oggi, consolidate.

    Se il locale è partito a metà del mese prima (es. dal 26 agosto, con il primo report fino al 30
    settembre), il dato di oggi copre lo stesso periodo del report.
    """
    c, per = a.cliente, a.periodi
    comunicate = c.visite_comunicate.get(f"{per.precedente.inizio:%Y-%m}")
    if comunicate is None:
        return
    inizio = per.precedente.inizio
    if c.contratto_dal:
        try:
            dal = date.fromisoformat(c.contratto_dal)
        except ValueError:
            dal = inizio
        if (inizio - dal).days < 31 and dal < inizio:
            inizio = dal
    oggi = a.dati.precedente.totale.conversioni
    if inizio != per.precedente.inizio:
        try:
            reali, indicazioni = fonte.visite_intervallo(c.customer_id, Intervallo(inizio, per.precedente.fine))
            oggi = indicazioni * c.quota_visite_indicazioni if a.dati.visite_stimate else reali
        except Exception as e:  # noqa: BLE001
            log.warning("Visite consolidate dall'inizio non disponibili (%s)", type(e).__name__)
    a.attribuzione = (comunicate, oggi)


def _applica_memoria(conf, stato: dict, mese_report: str) -> None:
    """Visite scritte nei report già inviati e testi degli ultimi report, dalla memoria salvata.

    Le visite scritte a mano in CONTESTO_CLIENTI vincono sulla memoria: servono per i mesi precedenti
    all'automazione e per i mesi in cui al cliente è andato un report fatto a mano."""
    for gruppo in conf.gruppi:
        mesi = {m: r for m, r in memoria.mesi(stato, gruppo.nome).items() if m < mese_report}
        for mese, rep in mesi.items():
            for loc in gruppo.locali:
                voce = rep.get("locali", {}).get(loc.nome)
                if voce and voce.get("visite") is not None:
                    loc.visite_comunicate.setdefault(mese, float(voce["visite"]))
        gruppo.memoria = [dict(rep, mese=m) for m, rep in sorted(mesi.items())[-3:]]


def _dati_manuali(conf, periodi, cartella) -> dict:
    """Aste, temi incrementali, concorrenza e profili dalla mail "Dati report" del mese."""
    from .posta import chiavi_locali, leggi_mail

    nomi = [(loc.nome, loc.nome_breve or loc.nome) for g in conf.gruppi for loc in g.locali]
    try:
        return leggi_mail(periodi.corrente.inizio, chiavi_locali(nomi), cartella)
    except Exception as e:  # noqa: BLE001
        log.warning("Mail dei dati non letta (%s)", type(e).__name__)
        return {}


def _report_documento(gruppo, analisi_gruppo, periodi, manuali, cartella, suffisso):
    """Report Word o PowerPoint: numeri, testi (Claude o automatici), file. Restituisce (percorso, testi, ai)."""
    from . import dati_doc, testi_doc

    numero = gruppo.numero_report(periodi.corrente.inizio.year, periodi.corrente.inizio.month)
    dati = dati_doc.dati_report(gruppo, analisi_gruppo, numero)
    contesto = {
        "storia_del_cliente": gruppo.contesto or None,
        "storia_dei_locali": {loc.nome: loc.contesto for loc in gruppo.locali if loc.contesto} or None,
        "report_precedenti": gruppo.memoria or None,
        "note_del_mese": {"fatto": gruppo.fatto, "prossimi_passi": gruppo.prossimi_passi, "focus": gruppo.focus,
                          "locali": {loc.nome: loc.nota_mese for loc in gruppo.locali if loc.nota_mese}},
        "dati_inviati_dal_consulente": {k: {c: v for c, v in x.items() if not c.startswith("immagini")}
                                        for k, x in manuali.items() if k in {loc.nome for loc in gruppo.locali}},
        "modifiche_registrate": {a.cliente.nome: sorted({f"{m.risorsa} {m.operazione}" for m in a.dati.modifiche})[:20]
                                 for a in analisi_gruppo},
    }
    base = cartella / f"cliente-{_slug(gruppo.nome)}-{suffisso}"
    if gruppo.formato == "docx":
        from . import report_docx

        testi = report_docx.testi_base(dati, manuali)
        testi, ai = testi_doc.riscrivi(testi, testi_doc.numeri_compatti(dati), contesto)
        spec = report_docx.blocchi_word(dati, testi, manuali, cartella / f"grafici-{_slug(gruppo.nome)}")
        return report_docx.scrivi_docx(spec, base.with_suffix(".docx")), testi, ai
    from . import report_pptx

    x = dati["locali"][0]
    testi = report_pptx.testi_base(dati, x, manuali)
    testi, ai = testi_doc.riscrivi(testi, testi_doc.numeri_compatti(dati), contesto)
    return report_pptx.deck_grano(dati, x, testi, manuali, gruppo.colore, base.with_suffix(".pptx")), testi, ai


def _testi_piatti(x) -> list[str]:
    if isinstance(x, str):
        return [x] if x.strip() else []
    if isinstance(x, dict):
        return [t for v in x.values() for t in _testi_piatti(v)]
    if isinstance(x, list):
        return [t for v in x for t in _testi_piatti(v)]
    return []


def _da_ricordare(gruppo, analisi_gruppo, vista, periodi) -> dict:
    """Numeri e testi del report appena creato, da salvare dopo l'invio."""
    from .report_locali import azioni

    locali = {}
    for a in analisi_gruppo:
        m = a.dati.corrente.totale
        locali[a.cliente.nome] = {
            "visite": round(m.conversioni, 1), "stimate": a.dati.visite_stimate, "azioni": round(azioni(m), 1),
            "indicazioni": round(m.indicazioni, 1), "spesa": round(m.costo, 2),
            "campagne": {c.nome: {"tipo": c.tipo, "spesa": round(c.metriche.costo, 2),
                                  "visite": round(c.metriche.conversioni, 1)}
                         for c in a.dati.corrente.campagne.values() if c.metriche.costo > 0},
        }
    testi = _testi_piatti(vista) if isinstance(vista, dict) else testi_scritti(vista)
    while testi and sum(len(t) for t in testi) > 8000:
        testi.pop()
    return {"numero": gruppo.numero_report(periodi.corrente.inizio.year, periodi.corrente.inizio.month),
            "periodo": periodi.corrente.etichetta(), "locali": locali, "testi": testi}


def _testi_ai(funzione, vista, analisi) -> bool:
    """Testi scritti da Claude; un errore qui non deve mai bloccare il report."""
    try:
        return funzione(vista, analisi)
    except Exception as e:
        log.warning("Testi AI non applicati (%s): uso i testi automatici", type(e).__name__)
        return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="report_ads", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--config", default="clienti.yaml", help="file di configurazione clienti")
    parser.add_argument("--momento", default="auto", choices=("auto",) + MOMENTI)
    parser.add_argument("--data", help="data di esecuzione simulata (AAAA-MM-GG), utile per i test")
    parser.add_argument("--demo", action="store_true", help="usa dati di esempio invece della Google Ads API")
    parser.add_argument("--invia", action="store_true", help="invia i report via email")
    parser.add_argument("--output", default="output", help="cartella dove salvare i report HTML")
    parser.add_argument("--note", default="note.yaml", help="testi del mese (se il file esiste)")
    parser.add_argument("--contesto", default="contesto.yaml", help="storia e strategia dei clienti (se il file esiste)")
    parser.add_argument("--stato", default="stato.enc", help="memoria cifrata dei report già inviati")
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
    for avviso in cfg.applica_note(configurazione, args.note, f"{periodi.corrente.inizio:%Y-%m}"):
        log.warning(avviso)
    for avviso in cfg.applica_contesto(configurazione, args.contesto):
        log.warning(avviso)
    stato = memoria.carica(args.stato)
    _applica_memoria(configurazione, stato, f"{periodi.corrente.inizio:%Y-%m}")
    da_ricordare = []
    agenzia = configurazione.agenzia
    email_interna = os.environ.get("REPORT_EMAIL_INTERNA") or agenzia.email_interna

    if args.demo:
        from .fonte_demo import FonteDemo
        fonte = FonteDemo(locali={c.customer_id for c in configurazione.clienti if c.negozio})
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
    manuali = None  # dati della mail del mese, letti solo se serve
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
            if dettaglio and cliente.contratto_dal:
                _prepara_contratto(fonte, a, gruppo)
            if dettaglio:
                _prepara_attribuzione(fonte, a)
            if dettaglio and gruppo.formato in ("docx", "pptx") and hasattr(fonte, "extra"):
                try:
                    a.dati.extra = fonte.extra(cliente.customer_id, periodi, cliente.nome_ricerche)
                    if a.dati.extra.get("errori"):
                        log.warning("Account %d/%d: dati aggiuntivi parziali (%s)", n, totale,
                                    ", ".join(a.dati.extra["errori"]))
                except Exception as e:  # noqa: BLE001
                    log.warning("Account %d/%d: dati aggiuntivi non disponibili (%s)", n, totale, type(e).__name__)
            a.controlli = controlla(a)
            analisi.append(a)
            analisi_gruppo.append(a)
            superati = sum(c.ok for c in a.controlli)
            log.info("Account %d/%d: ok (%d punti di attenzione, commento %s, controlli %d/%d%s)",
                     n, totale, len(a.punti), "AI" if a.commento_ai else "automatico", superati,
                     len(a.controlli), "" if superati == len(a.controlli) else
                     " · non superati: " + ", ".join(c.nome for c in a.controlli if not c.ok))
        if not report_gruppo:
            continue
        if len(analisi_gruppo) < len(gruppo.locali):
            log.error("Report cliente %d non generato: uno o più account del gruppo sono in errore", len(per_cliente) + 1)
            continue
        if gruppo.negozio and gruppo.formato in ("docx", "pptx"):
            # Word (formato "advisory") o PowerPoint (formato "grano"): bozza da rivedere prima dell'invio.
            if manuali is None:
                manuali = _dati_manuali(configurazione, periodi, cartella / "manuali")
            try:
                percorso, testi, ai = _report_documento(gruppo, analisi_gruppo, periodi, manuali, cartella, suffisso)
                log.info("Report cliente %d: %s, testi %s", len(per_cliente) + 1, gruppo.formato,
                         "AI" if ai else "automatici")
            except Exception as e:
                log.error("Report cliente non generato (%s)", type(e).__name__)
                errori.append((gruppo.nome, "Report cliente: " + _descrivi_errore(e)))
                continue
            per_cliente.append((gruppo, percorso, None))
            if periodi.mese_chiuso:
                da_ricordare.append((gruppo.nome, f"{periodi.corrente.inizio:%Y-%m}",
                                     _da_ricordare(gruppo, analisi_gruppo, testi, periodi)))
        elif gruppo.negozio:
            # Ristoranti e locali: un unico report PDF per il cliente, anche con più locali.
            try:
                if gruppo.layout == "grano" and len(analisi_gruppo) == 1:
                    vista = vista_grano(gruppo, analisi_gruppo[0], agenzia)
                    ai = _testi_ai(testi_grano, vista, analisi_gruppo[0])
                    html = report_grano(vista)
                else:
                    vista = vista_gruppo(gruppo, analisi_gruppo, agenzia)
                    ai = _testi_ai(testi_gruppo, vista, analisi_gruppo)
                    html = report_locali(vista)
                log.info("Report cliente %d: testi %s", len(per_cliente) + 1, "AI" if ai else "automatici")
            except Exception as e:
                log.error("Report cliente non generato (%s)", type(e).__name__)
                errori.append((gruppo.nome, "Report cliente: " + _descrivi_errore(e)))
                continue
            base = cartella / f"cliente-{_slug(gruppo.nome)}-{suffisso}"
            base.with_suffix(".html").write_text(html, encoding="utf-8")
            pdf = base.with_suffix(".pdf")
            percorso = pdf if html_a_pdf(html, pdf) else base.with_suffix(".html")
            per_cliente.append((gruppo, percorso, None))
            if periodi.mese_chiuso:
                da_ricordare.append((gruppo.nome, f"{periodi.corrente.inizio:%Y-%m}",
                                     _da_ricordare(gruppo, analisi_gruppo, vista, periodi)))
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
            if percorso.suffix in (".docx", ".pptx"):
                html = (f"<p>Report Google Ads di <strong>{escape(nome)}</strong>, {periodi.titolo}.</p>"
                        f"<p>Bozza nel file {'Word' if percorso.suffix == '.docx' else 'PowerPoint'} allegato: "
                        "rivedi i testi e completa le parti segnate \"Da completare\" prima di inviarlo.</p>")
            elif percorso.suffix == ".pdf":
                html = (f"<p>Report Google Ads di <strong>{escape(nome)}</strong>, {periodi.titolo}.</p>"
                        "<p>Il report completo è nel PDF allegato.</p>")
            else:
                html = percorso.read_text(encoding="utf-8")
            if automatico and destinatari and not args.demo:
                mittente.invia(destinatari, oggetto, html, allegato=percorso, ccn=[email_interna])
            else:
                mittente.invia([email_interna], f"{demo}[Da inoltrare] {oggetto}", html, allegato=percorso)
        log.info("Email inviate: 1 interna, %d report cliente", len(per_cliente))
        if da_ricordare and not args.demo:
            for nome, mese, dati in da_ricordare:
                memoria.registra(stato, nome, mese, dati)
            if memoria.salva(args.stato, stato):
                Path(args.stato).with_suffix(".aggiornato").write_text("1")
                log.info("Memoria dei report aggiornata: %d report", len(da_ricordare))

    # Un errore su un account fa fallire il workflow, così GitHub ti avvisa.
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
