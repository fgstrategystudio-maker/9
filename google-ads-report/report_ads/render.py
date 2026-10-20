"""Trasforma le analisi in HTML (report cliente e report interno)."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .analisi import Analisi
from .config import Agenzia
from .periodi import Periodi

CARTELLA_TEMPLATE = Path(__file__).parent / "templates"


def _numero_it(x: float, decimali: int) -> str:
    return f"{x:,.{decimali}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def valuta(x, decimali=2):
    return "–" if x is None else f"{_numero_it(x, decimali)} €"


def numero(x, decimali=0):
    if x is None:
        return "–"
    if decimali and abs(x - round(x)) < 0.05:  # 12,0 conversioni → 12
        decimali = 0
    return _numero_it(x, decimali)


def perc(x, decimali=1):
    return "–" if x is None else f"{_numero_it(x * 100, decimali)}%"


def variazione(x):
    if x is None:
        return "–"
    freccia = "▲" if x > 0.005 else "▼" if x < -0.005 else "■"
    return f"{freccia} {_numero_it(abs(x) * 100, 0)}%"


def formatta(v, formato):
    if formato == "valuta":
        return valuta(v)
    if formato == "percentuale":
        return perc(v)
    if formato == "roas":
        return numero(v, 2)
    if formato == "decimale":
        return numero(v, 1)
    return numero(v)


def kpi(k):
    return formatta(k.valore, k.formato)


def colore_delta(delta, meglio):
    """Verde se la variazione va nella direzione buona, rosso altrimenti."""
    if delta is None or meglio is None or abs(delta) < 0.03:
        return "#6b7280"
    buono = delta > 0 if meglio == "su" else delta < 0
    return "#15803d" if buono else "#b91c1c"


def paragrafi(testo: str) -> list[str]:
    return [p.strip() for p in (testo or "").split("\n") if p.strip()]


_env = Environment(
    loader=FileSystemLoader(CARTELLA_TEMPLATE),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)
_env.filters.update(valuta=valuta, numero=numero, perc=perc, variazione=variazione, kpi=kpi, formatta=formatta,
                    colore_delta=colore_delta, paragrafi=paragrafi)


def report_cliente(a: Analisi, agenzia: Agenzia) -> str:
    return _env.get_template("report_cliente.html").render(a=a, agenzia=agenzia, generato=datetime.now())


def report_grano(vista) -> str:
    return _env.get_template("report_grano.html").render(v=vista)


def report_locali(vista) -> str:
    return _env.get_template("report_locali.html").render(v=vista)


def report_interno(analisi: list[Analisi], errori: list[tuple[str, str]], periodi: Periodi,
                   agenzia: Agenzia, demo: bool) -> str:
    return _env.get_template("report_interno.html").render(
        analisi=analisi, errori=errori, periodi=periodi, agenzia=agenzia, demo=demo, generato=datetime.now(),
    )
