"""Dati del mese che Google Ads API non fornisce, letti dalla mail dei report (IMAP, stessa password per
le app usata per spedire).

Basta mandare alla casella dei report una mail con oggetto che inizia con "Dati report" (es. "Dati report
Locale ottobre"). Nel testo, il nome del locale su una riga e sotto i dati:

    Locale Uno Roma
    temi italiano: 29 > 37
    temi inglese: 22 > 28
    concorrenza: il concorrente X resta il più presente su Maps...
    profilo: 4,5 su 11.235 recensioni, profilo da completare (foto esterno)...

In allegato, con il nome del locale nel nome del file (es. "aste roma.csv", "profilo roma.png"):
- l'export Informazioni aste della campagna Brand (CSV);
- screenshot PNG o JPG: con "profilo" nel nome vanno nella sezione profili, gli altri nella concorrenza.

Le mail di mesi diversi da quello del report non vengono lette. Nei log solo conteggi, mai contenuti.
"""

from __future__ import annotations

import csv
import email
import imaplib
import io
import logging
import os
import re
import unicodedata
from datetime import date
from email.header import decode_header
from pathlib import Path

log = logging.getLogger(__name__)


def _norma(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def _intestazione(v) -> str:
    return "".join((t.decode(c or "utf-8", "replace") if isinstance(t, bytes) else t) for t, c in decode_header(v or ""))


def chiavi_locali(nomi: list[tuple[str, str]]) -> dict[str, list[str]]:
    """Parole che identificano ogni locale nel testo e nei nomi dei file: il nome intero, il nome breve e
    le parole che ha solo lui (es. "roma" per "Locale Uno Roma")."""
    parole = {nome: set(_norma(nome).split()) | set(_norma(breve).split()) for nome, breve in nomi}
    out = {}
    for nome, breve in nomi:
        altre = set().union(*(v for k, v in parole.items() if k != nome)) if len(parole) > 1 else set()
        uniche = {w for w in parole[nome] - altre if len(w) >= 4}
        chiavi = {_norma(nome), _norma(breve)} | uniche
        out[nome] = sorted((k for k in chiavi if k), key=len, reverse=True)
    return out


def _trova_locale(testo: str, locali: dict[str, list[str]]) -> str | None:
    t = f" {_norma(testo)} "
    for nome, chiavi in locali.items():
        if any(f" {k} " in t for k in chiavi):
            return nome
    return None


def leggi_aste(dati: bytes) -> list[list[str]]:
    """Export "Informazioni aste" di Google Ads -> righe [dominio, quota, in cima, primo posto, ci supera]."""
    for cod in ("utf-16", "utf-8-sig", "utf-8"):
        try:
            testo = dati.decode(cod)
            break
        except UnicodeDecodeError:
            continue
    else:
        return []
    sep = "\t" if testo.count("\t") > testo.count(",") else ","
    righe = list(csv.reader(io.StringIO(testo), delimiter=sep))
    for i, r in enumerate(righe):
        bassa = [c.lower() for c in r]
        if any("dominio" in c or "display url" in c for c in bassa):
            testata, corpo = bassa, righe[i + 1:]
            break
    else:
        return []

    def col(*parole):
        for j, c in enumerate(testata):
            if all(p in c for p in parole):
                return j
        return None

    cols = [col("dominio") if col("dominio") is not None else col("display url"),
            col("quota impressioni") if col("quota impressioni") is not None else col("impression share"),
            col("superiore della pagina") if col("superiore della pagina") is not None else col("top of page"),
            col("assoluta") if col("assoluta") is not None else col("absolute"),
            col("superamento") if col("superamento") is not None else col("outranking")]
    if cols[0] is None:
        return []
    out = []
    for r in corpo:
        if len(r) <= cols[0] or not r[cols[0]].strip() or r[cols[0]].lower().startswith("totale"):
            continue
        riga = [r[j].strip().replace("--", "") if j is not None and j < len(r) else "" for j in cols]
        if riga[0].lower() in ("tu", "you"):
            riga[0], riga[4] = "(noi)", ""
        out.append(riga)
    return out


def leggi_testo(corpo: str, locali: dict[str, list[str]]) -> dict:
    risultato: dict = {}
    corrente, campo = None, None
    for riga in corpo.splitlines():
        r = riga.strip()
        if not r:
            campo = None
            continue
        loc = _trova_locale(r, locali) if len(r) < 40 and ":" not in r else None
        if loc:
            corrente, campo = loc, None
            continue
        if corrente is None:
            continue
        voce = risultato.setdefault(corrente, {})
        m = re.match(r"(?i)temi\s+([^:]+):\s*(\d+)\s*(?:>|->|→|a)\s*(\d+)", r)
        if m:
            temi = voce.setdefault("temi", {"lingue": [], "prima": [], "dopo": []})
            temi["lingue"].append(m.group(1).strip().capitalize())
            temi["prima"].append(int(m.group(2)))
            temi["dopo"].append(int(m.group(3)))
            campo = None
            continue
        m = re.match(r"(?i)(concorrenza|profilo|profili)\s*:\s*(.*)", r)
        if m:
            campo = "profilo" if m.group(1).lower().startswith("profil") else "concorrenza"
            voce[campo] = (voce.get(campo, "") + "\n" + m.group(2)).strip()
            continue
        if campo:
            voce[campo] = voce[campo] + "\n" + r
    return risultato


def leggi_mail(mese: date, locali: dict[str, list[str]], cartella: Path) -> dict:
    """{nome locale: {temi, aste, concorrenza, profilo, immagini_concorrenza, immagini_profilo}}."""
    utente, password = os.environ.get("SMTP_USER"), os.environ.get("SMTP_PASSWORD")
    if not utente or not password:
        return {}
    risultato: dict = {}
    try:
        imap = imaplib.IMAP4_SSL(os.environ.get("IMAP_HOST", "imap.gmail.com"), timeout=60)
        imap.login(utente, password)
    except Exception as e:  # noqa: BLE001
        log.warning("Mail dei dati non leggibile (%s): sezioni manuali da completare", type(e).__name__)
        return {}
    try:
        imap.select("INBOX", readonly=True)
        dal = mese.replace(day=1).strftime("%d-%b-%Y")
        _, ids = imap.search(None, f'(SINCE "{dal}" SUBJECT "Dati report")')
        cartella.mkdir(parents=True, exist_ok=True)
        n_mail = 0
        for id_ in (ids[0].split() if ids and ids[0] else []):
            _, parti = imap.fetch(id_, "(RFC822)")
            msg = email.message_from_bytes(parti[0][1])
            n_mail += 1
            corpo = ""
            for p in msg.walk():
                nome_file = _intestazione(p.get_filename()) if p.get_filename() else ""
                if p.get_content_type() == "text/plain" and not nome_file:
                    corpo += (p.get_payload(decode=True) or b"").decode(p.get_content_charset() or "utf-8", "replace")
                elif nome_file:
                    loc = _trova_locale(Path(nome_file).stem, locali)
                    if not loc:
                        continue
                    dati = p.get_payload(decode=True) or b""
                    voce = risultato.setdefault(loc, {})
                    est = Path(nome_file).suffix.lower()
                    if est in (".csv", ".tsv", ".txt"):
                        aste = leggi_aste(dati)
                        if aste:
                            voce["aste"] = aste
                    elif est in (".png", ".jpg", ".jpeg"):
                        file = cartella / f"{_norma(Path(nome_file).stem).replace(' ', '_')}{est}"
                        file.write_bytes(dati)
                        tipo = "profilo" if "profil" in nome_file.lower() else "concorrenza"
                        voce.setdefault(f"immagini_{tipo}", []).append((str(file), Path(nome_file).stem))
            for loc, voce in leggi_testo(corpo, locali).items():
                risultato.setdefault(loc, {}).update(voce)
        log.info("Mail dei dati: %d mail, dati per %d locali", n_mail, len(risultato))
    except Exception as e:  # noqa: BLE001
        log.warning("Mail dei dati non letta (%s): sezioni manuali da completare", type(e).__name__)
    finally:
        try:
            imap.logout()
        except Exception:  # noqa: BLE001
            pass
    return risultato
