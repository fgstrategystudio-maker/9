#!/usr/bin/env python3
"""
Genera i file del marchio FG Strategy Studio in assets/brand/.

Il simbolo e' il concept "Due in uno": due direzioni che si allineano in un
punto e da li' proseguono come una sola linea che sale piu' ripida di
entrambe. Il testo viene convertito in tracciati con il font Geist reale,
cosi' il logo non dipende da font installati.

Serve: fonttools, uharfbuzz, cairosvg, e i .ttf di Geist (pacchetto npm geist).
"""
import os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
import cairosvg

FONT_DIR = os.environ.get("GEIST_DIR", "/tmp/geist/package/dist/fonts/geist-sans")
SEMIBOLD = os.path.join(FONT_DIR, "Geist-SemiBold.ttf")
MEDIUM = os.path.join(FONT_DIR, "Geist-Medium.ttf")
OUT = "assets/brand"

# ── Palette ───────────────────────────────────────────────────────────────────
INK = "#121212"
BRONZE = "#8A6F4E"
QUIET = "#8A867E"          # payoff su fondo chiaro
IVORY = "#F4F1EA"
BRONZE_LT = "#C2A276"      # bronzo schiarito, per fondo scuro
QUIET_DK = "#8C8880"       # payoff su fondo scuro

# ── Simbolo ───────────────────────────────────────────────────────────────────
# I due ingressi arrivano gia' paralleli: l'allineamento si legge prima della
# convergenza, e la 'V' che faceva sembrare il segno una spunta sparisce.
# Piegano in J(33,44); la risultante parte a -58 gradi, 24 gradi piu' ripida
# del raccordo che la precede, ed e' piu' spessa (8 contro 6): l'esito pesa
# piu' degli ingressi.
SYMBOL = """<path d="M6 36 H21 L33 44" fill="none" stroke="{ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6 52 H21 L33 44" fill="none" stroke="{ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M33 44 L53 12" fill="none" stroke="{acc}" stroke-width="8" stroke-linecap="round"/>"""

def sym(ink=INK, acc=BRONZE):
    return SYMBOL.format(ink=ink, acc=acc)


# ── Testo in tracciati ────────────────────────────────────────────────────────
_cache = {}


def _font(path):
    if path not in _cache:
        blob = hb.Blob.from_file_path(path)
        face = hb.Face(blob)
        _cache[path] = (hb.Font(face), TTFont(path))
    return _cache[path]


def text_path(text, font_path, size, tracking_em=0.0):
    """Restituisce (path_d, larghezza, cap_height) con baseline a y=0."""
    hbfont, tt = _font(font_path)
    upem = tt["head"].unitsPerEm
    cap = tt["OS/2"].sCapHeight * size / upem
    scale = size / upem
    track = tracking_em * upem

    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf)

    glyphset = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    x = 0.0
    parts = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphset)
        tpen = TransformPen(
            pen, Transform(scale, 0, 0, -scale,
                           (x + pos.x_offset) * scale, -pos.y_offset * scale))
        glyphset[order[info.codepoint]].draw(tpen)
        d = pen.getCommands()
        if d:
            parts.append(d)
        x += pos.x_advance + track
    width = (x - track) * scale if parts else 0.0
    return " ".join(parts), width, cap


NAME = "FG Strategy Studio"
PAYOFF = "ALLINEARE PER CRESCERE"
NAME_SIZE, NAME_TRACK = 22.5, -0.03
PAY_SIZE, PAY_TRACK = 10.0, 0.2
GAP_MARK = 17.0      # tra simbolo e testo
GAP_LINES = 7.5      # tra nome e payoff


def svg(w, h, body, pad=0):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" '
            f'viewBox="0 0 {w:.2f} {h:.2f}" role="img" '
            f'aria-label="FG Strategy Studio">\n{body}\n</svg>\n')


def lockup_h(ink, acc, quiet):
    """Marchio orizzontale: simbolo a sinistra, nome e payoff a destra."""
    nd, nw, ncap = text_path(NAME, SEMIBOLD, NAME_SIZE, NAME_TRACK)
    pd, pw, pcap = text_path(PAYOFF, MEDIUM, PAY_SIZE, PAY_TRACK)

    block = ncap + GAP_LINES + pcap
    top = 32 - block / 2                 # centrato sull'asse del simbolo
    n_base = top + ncap
    p_base = n_base + GAP_LINES + pcap
    tx = 64 + GAP_MARK

    w, h = tx + max(nw, pw), 64
    body = (f'<g>{sym(ink, acc)}</g>\n'
            f'<path transform="translate({tx:.2f} {n_base:.2f})" fill="{ink}" d="{nd}"/>\n'
            f'<path transform="translate({tx:.2f} {p_base:.2f})" fill="{quiet}" d="{pd}"/>')
    return svg(w, h, body)


def lockup_v(ink, acc, quiet):
    """Marchio verticale: simbolo sopra, testo centrato sotto."""
    nd, nw, ncap = text_path(NAME, SEMIBOLD, NAME_SIZE, NAME_TRACK)
    pd, pw, pcap = text_path(PAYOFF, MEDIUM, PAY_SIZE, PAY_TRACK)

    w = max(64.0, nw, pw)
    n_base = 64 + 20 + ncap
    p_base = n_base + GAP_LINES + pcap
    h = p_base + 2
    body = (f'<g transform="translate({(w - 64) / 2:.2f} 0)">{sym(ink, acc)}</g>\n'
            f'<path transform="translate({(w - nw) / 2:.2f} {n_base:.2f})" fill="{ink}" d="{nd}"/>\n'
            f'<path transform="translate({(w - pw) / 2:.2f} {p_base:.2f})" fill="{quiet}" d="{pd}"/>')
    return svg(w, h, body)


def symbol_only(ink, acc):
    return svg(64, 64, sym(ink, acc))


def tile(ink_bg, ink, acc, radius=14):
    """Simbolo dentro una placca: favicon, avatar social, app icon."""
    body = (f'<rect width="64" height="64" rx="{radius}" fill="{ink_bg}"/>\n'
            f'<g transform="translate(32 32) scale(0.74) translate(-32 -32)">{sym(ink, acc)}</g>')
    return svg(64, 64, body)


FILES = {
    "fg-logo-orizzontale.svg":           lockup_h(INK, BRONZE, QUIET),
    "fg-logo-orizzontale-negativo.svg":  lockup_h(IVORY, BRONZE_LT, QUIET_DK),
    "fg-logo-verticale.svg":             lockup_v(INK, BRONZE, QUIET),
    "fg-logo-verticale-negativo.svg":    lockup_v(IVORY, BRONZE_LT, QUIET_DK),
    "fg-simbolo.svg":                    symbol_only(INK, BRONZE),
    "fg-simbolo-negativo.svg":           symbol_only(IVORY, BRONZE_LT),
    "fg-icona.svg":                      tile(INK, IVORY, BRONZE_LT),
}

# PNG: (sorgente, nome, larghezza, fondo)
RASTER = [
    ("fg-logo-orizzontale.svg",          "fg-logo-orizzontale.png",  1600, "#F7F6F2"),
    ("fg-logo-orizzontale-negativo.svg", "fg-logo-negativo.png",     1600, "#121212"),
    ("fg-logo-verticale.svg",            "fg-logo-verticale.png",     900, "#F7F6F2"),
    ("fg-simbolo.svg",                   "fg-simbolo.png",            512, None),
    ("fg-simbolo-negativo.svg",          "fg-simbolo-negativo.png",   512, None),
    ("fg-icona.svg",                     "fg-icona-512.png",          512, None),
    ("fg-icona.svg",                     "fg-avatar-400.png",         400, None),
    ("fg-icona.svg",                     "fg-apple-touch-180.png",    180, None),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, content in FILES.items():
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(content)
        print("svg  ", name)
    for src, dst, width, bg in RASTER:
        cairosvg.svg2png(url=os.path.join(OUT, src),
                         write_to=os.path.join(OUT, dst),
                         output_width=width, background_color=bg)
        print("png  ", dst, f"{width}px")


if __name__ == "__main__":
    main()
