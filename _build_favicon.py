#!/usr/bin/env python3
"""
Genera le icone del sito dal marchio.

Perche' non basta l'SVG: il crawler delle favicon di Google, diversi social e
i browser vecchi cercano /favicon.ico alla radice e non gestiscono l'SVG.
Google inoltre preferisce icone quadrate in multipli di 48px.

Alle misure minime il marchio va ridisegnato, non solo rimpicciolito: a 16px
i tratti originali (6 e 8 unita' su 100) scenderebbero sotto il pixel e si
impasterebbero. Per 16 e 32 px si usa una versione con tratti piu' spessi e
simbolo piu' grande dentro la placca.
"""
import io
import os
import cairosvg
from PIL import Image

OUT = "assets/brand"

# Placca + marchio. I parametri cambiano con la misura: piu' piccola e'
# l'icona, piu' spessi i tratti e piu' grande il simbolo.
TPL = """<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" rx="{rx}" fill="#121212"/>
<g transform="translate({tx} {ty}) scale({s})">
  <path d="M18 94 L50 56 M82 94 L50 56" fill="none" stroke="#F4F1EA" stroke-width="{w1}"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M50 56 V8" fill="none" stroke="#C2A276" stroke-width="{w2}" stroke-linecap="round"/>
</g></svg>"""


def art(scala, w1, w2, rx=112):
    """Centra il simbolo (100x100, ottico spostato di -3) nella placca."""
    lato = 100 * scala
    tx = (512 - lato) / 2
    ty = (512 - lato) / 2 + 3 * scala
    return TPL.format(rx=rx, tx=tx, ty=ty, s=scala, w1=w1, w2=w2)


PICCOLA = art(scala=4.1, w1=9.5, w2=12, rx=96)   # 16 e 32 px
GRANDE = art(scala=3.2, w1=6, w2=8, rx=112)      # 48 px in su


def png(svg, px):
    return Image.open(io.BytesIO(
        cairosvg.svg2png(bytestring=svg.encode(), output_width=px, output_height=px)
    )).convert("RGBA")


def main():
    os.makedirs(OUT, exist_ok=True)

    # ICO multi-risoluzione alla radice: e' il percorso che i crawler provano.
    # Il frame base deve essere il piu' grande, gli altri si accodano: Pillow
    # scarta le misure superiori a quella dell'immagine di partenza.
    base = png(GRANDE, 48)
    base.save("favicon.ico", format="ICO", sizes=[(48, 48), (32, 32), (16, 16)],
              append_images=[png(PICCOLA, 32), png(PICCOLA, 16)])
    print("favicon.ico  16+32+48")

    # PNG in multipli di 48, come preferisce Google.
    for px in (48, 96, 192):
        png(GRANDE, px).save(f"{OUT}/fg-icona-{px}.png")
        print(f"fg-icona-{px}.png")

    # L'SVG resta per i browser moderni: nitido a qualsiasi zoom.
    open("favicon.svg", "w", encoding="utf-8").write(GRANDE.replace("\n", ""))
    print("favicon.svg")


if __name__ == "__main__":
    main()
