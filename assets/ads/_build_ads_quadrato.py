#!/usr/bin/env python3
"""
Creativita' quadrata per ChatGPT Ads.

Il formato mostra l'immagine in piccolo e prende titolo e descrizione da campi
separati: quindi qui niente testo lungo, solo il marchio a scala grande e una
sola riga. Deve restare leggibile a 256px, che e' il minimo dichiarato dal
pannello.
"""
TPL = """<!doctype html><html lang="it"><head><meta charset="utf-8">
<style>
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-500-normal.woff2)format('woff2');font-weight:500}}
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-600-normal.woff2)format('woff2');font-weight:600}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1080px}}
body{{background:{BG};font-family:SG,system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:{GAP}px;color:{INK};position:relative;overflow:hidden}}

/* Cornice sottile: da' un bordo alla miniatura, che nei feed finisce spesso
   su fondi dello stesso tono e altrimenti si confonde. */
.bordo{{position:absolute;inset:{INSET}px;border:2px solid {LINE};border-radius:{RAD}px}}

svg.marchio{{width:{MARK}px;height:{MARK}px;display:block}}
.nome{{font-size:{NOME}px;font-weight:600;letter-spacing:-.03em;line-height:1}}
.claim{{font-size:{CLAIM}px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;
  color:{BRONZE};line-height:1}}
</style></head><body>
<div class="bordo"></div>
<svg class="marchio" viewBox="0 0 100 100" aria-hidden="true">
  <g transform="translate(0 -3)">
    <path d="M18 94 L50 56 M82 94 L50 56" fill="none" stroke="{INK}" stroke-width="6"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M50 56 V8" fill="none" stroke="{BRONZE}" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>
<div class="nome">Francesco Gizzi</div>
<div class="claim">Allineare per crescere</div>
</body></html>"""

VARIANTI = {
    "sq-scuro":  dict(BG="#121212", INK="#F4F1EA", BRONZE="#C2A276", LINE="#2E2A24"),
    "sq-chiaro": dict(BG="#F7F6F2", INK="#121212", BRONZE="#8A6F4E", LINE="#DEDBD3"),
}
SCALA = dict(MARK=340, NOME=92, CLAIM=35, GAP=54, INSET=46, RAD=28)

for nome, pal in VARIANTI.items():
    open(f"ad-{nome}.html", "w", encoding="utf-8").write(TPL.format(**SCALA, **pal))
    print("scritto", f"ad-{nome}.html")
