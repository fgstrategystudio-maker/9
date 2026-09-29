#!/usr/bin/env python3
"""
Applica al sito il marchio "Radice" (variante 2b) consegnato da Francesco.

Cosa fa, tutto in modo idempotente:
  1. copia i file del marchio in assets/brand/
  2. sostituisce la favicon del sito con l'icona scura del nuovo marchio
  3. aggiunge il link apple-touch-icon dove manca
  4. mette il simbolo accanto al nome nell'header di ogni pagina
  5. aggiorna le icone in manifest.json

Rilanciarlo non duplica niente: ogni passo controlla prima se e' gia' fatto.
"""
import glob
import json
import os
import re
import shutil

SRC = os.environ.get(
    "LOGO_SRC",
    "/tmp/claude-0/-home-user-9/b8100d92-a5ae-5bc3-822c-6102838db2b7/"
    "scratchpad/uploaded/export/fg-logo-2b",
)
DEST = "assets/brand"
SYMBOL_URL = "/assets/brand/fg-simbolo.svg"
TOUCH_URL = "/assets/brand/fg-apple-touch-180.png"

ICON_LINK = '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'
TOUCH_LINK = f'<link rel="apple-touch-icon" href="{TOUCH_URL}" />'

# <a class="brand|tb-brand" href="…">Francesco Gizzi</a>, in tutte le lingue
BRAND_RE = re.compile(
    r'(<a class="(?:tb-)?brand" href="[^"]*">)(Francesco Gizzi</a>)')
IMG = (f'<img src="{SYMBOL_URL}" alt="" width="24" height="24" '
       f'decoding="async" />')


def pages():
    return sorted(glob.glob("*.html") + glob.glob("en/*.html")
                  + glob.glob("es/*.html") + glob.glob("pt/*.html"))


def copy_assets():
    os.makedirs(DEST, exist_ok=True)
    n = 0
    for sub in ("svg", "png"):
        for f in sorted(glob.glob(os.path.join(SRC, sub, "*"))):
            shutil.copy2(f, os.path.join(DEST, os.path.basename(f)))
            n += 1
    leggimi = os.path.join(SRC, "LEGGIMI.txt")
    if os.path.exists(leggimi):
        shutil.copy2(leggimi, os.path.join(DEST, "LEGGIMI.txt"))
        n += 1
    print(f"1. copiati {n} file in {DEST}/")


def swap_favicon():
    """La favicon del sito diventa l'icona scura del marchio."""
    src = os.path.join(DEST, "fg-icona-scura.svg")
    shutil.copy2(src, "favicon.svg")
    print("2. favicon.svg sostituita con l'icona del marchio")


def add_touch_icon():
    done = skip = 0
    for f in pages():
        s = open(f, encoding="utf-8").read()
        if "apple-touch-icon" in s:
            skip += 1
            continue
        if ICON_LINK not in s:
            skip += 1
            continue
        open(f, "w", encoding="utf-8").write(
            s.replace(ICON_LINK, ICON_LINK + "\n  " + TOUCH_LINK, 1))
        done += 1
    print(f"3. apple-touch-icon: aggiunto a {done} pagine, {skip} gia' a posto o senza link icon")


def add_symbol_to_header():
    done = skip = 0
    for f in pages():
        s = open(f, encoding="utf-8").read()
        if SYMBOL_URL in s:
            skip += 1
            continue
        new, n = BRAND_RE.subn(r"\1" + IMG + r"\2", s)
        if n:
            open(f, "w", encoding="utf-8").write(new)
            done += 1
        else:
            skip += 1
    print(f"4. simbolo nell'header: {done} pagine aggiornate, {skip} senza header brand")


def update_manifest():
    with open("manifest.json", encoding="utf-8") as fh:
        m = json.load(fh)
    icons = [
        {"src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml",
         "purpose": "any"},
        {"src": "/assets/brand/fg-icona-512.png", "sizes": "512x512",
         "type": "image/png", "purpose": "any"},
        {"src": TOUCH_URL, "sizes": "180x180", "type": "image/png",
         "purpose": "any"},
        {"src": "/og-image.jpg", "sizes": "1200x630", "type": "image/jpeg",
         "purpose": "any"},
    ]
    if m.get("icons") == icons:
        print("5. manifest.json gia' aggiornato")
        return
    m["icons"] = icons
    m["theme_color"] = "#121212"          # era l'oro della vecchia palette
    m["background_color"] = "#F7F6F2"     # avorio del sito
    with open("manifest.json", "w", encoding="utf-8") as fh:
        json.dump(m, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("5. manifest.json: icone, theme_color e background_color aggiornati")


if __name__ == "__main__":
    copy_assets()
    swap_favicon()
    add_touch_icon()
    add_symbol_to_header()
    update_manifest()
