"""Grafici PNG dei report Word (senza assi né griglie, titolo a sinistra,
valori sulle barre, barre arrotondate)."""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib import font_manager  # noqa: E402
from matplotlib.patches import FancyBboxPatch  # noqa: E402

INK, GOLD, PALE, MUTE, BAND = "#1A1A1A", "#D8B86A", "#DDD8CC", "#6B6B6B", "#F7F2E4"

_FONT = "Inter" if any("Inter" in f.name for f in font_manager.fontManager.ttflist) else "DejaVu Sans"
plt.rcParams.update({"font.family": _FONT, "font.size": 11, "xtick.color": MUTE, "ytick.color": MUTE,
                     "axes.spines.top": False, "axes.spines.right": False, "axes.spines.left": False,
                     "axes.spines.bottom": False})


def _n(v: float) -> str:
    return f"{v:,.0f}".replace(",", ".")


def _arrotonda(ax, r=0.12):
    fig = ax.figure
    fig.canvas.draw()
    bb = ax.get_window_extent()
    x0, x1 = ax.get_xlim()
    y0, y1 = ax.get_ylim()
    asp = ((y1 - y0) / bb.height) / ((x1 - x0) / bb.width)
    for p in list(ax.patches):
        if type(p).__name__ != "Rectangle" or p.get_height() <= 0 or p.get_width() > 5:
            continue
        x, y, wd, h = p.get_x(), p.get_y(), p.get_width(), p.get_height()
        rr = min(r, wd / 2, h / asp / 2)
        fb = FancyBboxPatch((x, y), wd, h, boxstyle=f"round,pad=0,rounding_size={rr}", mutation_aspect=asp,
                            facecolor=p.get_facecolor(), edgecolor="none", zorder=p.get_zorder())
        p.remove()
        ax.add_patch(fb)


def _titolo(ax, t, sub=None):
    ax.set_title(t, loc="left", fontsize=14, fontweight="bold", color=INK, pad=18 if sub else 10)
    if sub:
        ax.text(0, 1.02, sub, transform=ax.transAxes, fontsize=10, color=MUTE)


def _salva(percorso: Path) -> Path:
    plt.tight_layout()
    plt.savefig(percorso, dpi=200, facecolor="white")
    plt.close()
    return percorso


def visite_impilate(cartella: Path, nomi, pmax, brand, mese: str) -> Path:
    fig, ax = plt.subplots(figsize=(7, 3.6))
    ax.bar(nomi, pmax, color=INK, width=.55, label="Performance Max")
    ax.bar(nomi, brand, bottom=pmax, color=GOLD, width=.55, label="Brand")
    top = max([a + b for a, b in zip(pmax, brand)] or [1])
    for i, (a, b) in enumerate(zip(pmax, brand)):
        ax.text(i, a + b + top * .02, _n(a + b), ha="center", fontsize=13, fontweight="bold", color=INK)
    ax.yaxis.set_visible(False)
    ax.set_ylim(0, top * 1.18)
    ax.tick_params(axis="x", length=0)
    ax.legend(frameon=False, fontsize=9)
    _titolo(ax, "Visite in negozio", f"{mese.capitalize()}, Performance Max e Brand")
    return _salva(cartella / "visite.png")


def ripartizione_spesa(cartella: Path, nomi, pmax, brand) -> Path:
    fig, ax = plt.subplots(figsize=(7, 3.6))
    for i in range(len(nomi)):
        tot = (pmax[i] + brand[i]) or 1
        a = pmax[i] / tot * 100
        ax.barh(i, a, color=INK, height=.5)
        ax.barh(i, 100 - a, left=a, color=GOLD, height=.5)
        ax.text(2, i, f"{a:.0f}%", color="white", va="center", fontweight="bold", fontsize=10)
        ax.text(98, i, f"{100 - a:.0f}%", color=INK, va="center", ha="right", fontweight="bold", fontsize=10)
    ax.set_yticks(range(len(nomi)))
    ax.set_yticklabels(nomi)
    ax.invert_yaxis()
    ax.set_xlim(0, 100)
    ax.xaxis.set_visible(False)
    ax.tick_params(axis="y", length=0)
    _titolo(ax, "Ripartizione della spesa", "Performance Max e Brand")
    return _salva(cartella / "spesa.png")


def consolidamento(cartella: Path, nomi, prima, ora, mese_prec: str) -> Path:
    w = .34
    x = np.arange(len(nomi))
    fig, ax = plt.subplots(figsize=(7, 3.6))
    ax.bar(x - w / 2, prima, w, color=PALE, label="Report precedente")
    ax.bar(x + w / 2, ora, w, color=INK, label="Consolidato")
    top = max(list(prima) + list(ora) + [1])
    for i in range(len(nomi)):
        ax.text(x[i] - w / 2, prima[i] + top * .02, _n(prima[i]), ha="center", fontsize=9, color=MUTE)
        ax.text(x[i] + w / 2, ora[i] + top * .02, _n(ora[i]), ha="center", fontsize=11, fontweight="bold", color=INK)
    ax.set_xticks(x)
    ax.set_xticklabels(nomi)
    ax.tick_params(axis="x", length=0)
    ax.yaxis.set_visible(False)
    ax.set_ylim(0, top * 1.18)
    ax.legend(frameon=False, fontsize=9)
    _titolo(ax, f"Visite in negozio di {mese_prec}", "Letture a fine mese e dati consolidati")
    _arrotonda(ax)
    return _salva(cartella / "consolidamento.png")


def ciambelle(cartella: Path, chiave: str, nome: str, spesa: tuple, visite: tuple) -> Path:
    fig, axs = plt.subplots(1, 2, figsize=(6, 3.0))
    for ax, (a, b), lab in zip(axs, [spesa, visite], ["della spesa", "delle visite"]):
        tot = (a + b) or 1
        ax.pie([a or 0.0001, b or 0.0001], colors=[INK, GOLD], startangle=90, counterclock=False,
               wedgeprops=dict(width=.28, edgecolor="white", linewidth=2))
        ax.text(0, .08, f"{b / tot * 100:.0f}%", ha="center", va="center", fontsize=22, fontweight="bold", color=INK)
        ax.text(0, -.22, "Brand", ha="center", va="center", fontsize=9, color=MUTE)
        ax.set_title(f"Quota {lab}", fontsize=11, color=INK, fontweight="bold")
    fig.suptitle(f"{nome}: peso della campagna Brand", x=0.02, ha="left", fontsize=13, fontweight="bold", color=INK)
    return _salva(cartella / f"ciambelle_{chiave}.png")


def orari(cartella: Path, chiave: str, nome: str, ore: list[float]) -> Path | None:
    tot = sum(ore)
    if tot <= 0:
        return None
    pc = [v / tot * 100 for v in ore]
    mx = max(pc)
    fig, ax = plt.subplots(figsize=(7, 2.9))
    ax.bar(range(24), pc, color=[GOLD if v == mx else INK for v in pc], width=.7)
    ax.text(12.5, mx * 1.12, f"Pranzo {sum(pc[11:15]):.0f}%", ha="center", fontsize=10, color=INK, fontweight="bold")
    ax.text(19.5, mx * 1.12, f"Cena {sum(pc[18:22]):.0f}%", ha="center", fontsize=10, color=INK, fontweight="bold")
    ax.set_xticks(range(0, 24, 3))
    ax.set_xticklabels([f"{h}:00" for h in range(0, 24, 3)])
    ax.tick_params(length=0)
    ax.yaxis.set_visible(False)
    ax.set_ylim(0, mx * 1.3)
    ax.set_xlim(-.6, 23.6)
    _titolo(ax, f"{nome}: quando arrivano le conversioni",
            f"Quota delle conversioni per ora del giorno, picco alle {pc.index(mx)}:00")
    _arrotonda(ax, 0.25)
    ax.axvspan(10.5, 14.5, color=BAND, zorder=0)
    ax.axvspan(17.5, 21.5, color=BAND, zorder=0)
    return _salva(cartella / f"ore_{chiave}.png")


def temi(cartella: Path, chiave: str, nome: str, lingue: list[str], prima: list[int], dopo: list[int],
         etichette=("Inizio mese", "Fine mese")) -> Path:
    w = .34
    x = np.arange(len(lingue))
    fig, ax = plt.subplots(figsize=(7, 3.2))
    ax.bar(x - w / 2, prima, w, color=PALE, label=etichette[0])
    ax.bar(x + w / 2, dopo, w, color=GOLD, label=etichette[1])
    top = max(prima + dopo + [1])
    for i in range(len(lingue)):
        ax.text(x[i] - w / 2, prima[i] + top * .02, str(prima[i]), ha="center", fontsize=9, color=MUTE)
        ax.text(x[i] + w / 2, dopo[i] + top * .02, str(dopo[i]), ha="center", fontsize=11, fontweight="bold", color=INK)
    ax.set_xticks(x)
    ax.set_xticklabels(lingue)
    ax.tick_params(axis="x", length=0)
    ax.legend(frameon=False, fontsize=9)
    ax.yaxis.set_visible(False)
    ax.set_ylim(0, top * 1.25)
    _titolo(ax, f"{nome}: temi che portano traffico nuovo", f"Da {sum(prima)} a {sum(dopo)} temi incrementali")
    _arrotonda(ax)
    return _salva(cartella / f"temi_{chiave}.png")
