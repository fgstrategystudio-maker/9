#!/usr/bin/env python3
"""
Sfondi per videochiamata, 1920x1080.

La composizione nasce dai vincoli del mezzo, non dall'estetica:
 - al centro ci sta la persona, quindi il centro resta vuoto;
 - Meet scrive il nome in basso a sinistra e i comandi in basso al centro:
   la fascia inferiore (circa il 18%) resta libera;
 - in vista a griglia il riquadro scende sotto i 400px: niente testo piccolo,
   il marchio deve reggere ridotto;
 - lo sfondo non deve competere con chi parla: contrasto basso, nessun
   motivo vicino alla testa.
"""
TPL = """<!doctype html><html lang="it"><head><meta charset="utf-8">
<style>
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-500-normal.woff2)format('woff2');font-weight:500}}
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-600-normal.woff2)format('woff2');font-weight:600}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1920px;height:1080px}}
body{{background:{BG};font-family:SG,system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  position:relative;overflow:hidden;color:{INK}}}

/* Alone appena percepibile dietro la persona: la stacca dal fondo senza
   disegnare niente di riconoscibile. */
.alone{{position:absolute;left:50%;top:46%;width:1500px;height:1100px;
  transform:translate(-50%,-50%);
  background:radial-gradient(ellipse at center, {HALO} 0%, transparent 62%);}}

/* Il simbolo del marchio, grande e quasi muto, fuori dall'area della persona. */
.struttura{{position:absolute;right:130px;top:200px;width:440px;height:440px;
  opacity:{SOP}}}

.marchio{{position:absolute;left:96px;top:84px;display:flex;align-items:center;gap:26px}}
.marchio img{{height:84px;width:auto;display:block}}

.firma{{position:absolute;left:96px;bottom:150px}}
.firma{{max-width:460px}}
.firma .nome{{font:600 40px/1.05 SG;letter-spacing:-.03em}}
.firma .ruolo{{margin-top:13px;font:500 15px/1.7 SG;letter-spacing:.2em;
  text-transform:uppercase;color:{BRONZE}}}
.firma .sito{{margin-top:26px;font:500 16px/1 SG;letter-spacing:.2em;
  text-transform:uppercase;color:{FAINT}}}

/* Filetto verticale: ancora la firma al bordo, come nel sito. */
.filo{{position:absolute;left:62px;bottom:140px;width:2px;height:200px;background:{BRONZE};opacity:.55}}
</style></head><body>
<div class="alone"></div>
<svg class="struttura" viewBox="0 0 100 100" aria-hidden="true">
  <g transform="translate(0 -3)">
    <path d="M18 94 L50 56 M82 94 L50 56" fill="none" stroke="{INK}" stroke-width="2.6"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M50 56 V8" fill="none" stroke="{BRONZE}" stroke-width="3.4" stroke-linecap="round"/>
  </g>
</svg>
{CONTENUTO}
</body></html>"""

MARCHIO = '<div class="marchio"><img src="{LOGO}" alt=""></div>'
FIRMA = ('<div class="filo"></div><div class="firma">'
         '<div class="nome">Francesco Gizzi</div>'
         '<div class="ruolo">Marketing · Dati<br>Sales · Strategia</div>'
         '<div class="sito">francescogizzi.com</div></div>')

CHIARO = dict(BG="#F7F6F2", INK="#121212", BRONZE="#8A6F4E", FAINT="#8A867E",
              SOP="0.10", HALO="rgba(255,255,255,.75)",
              LOGO="fg-logo-orizzontale.svg")
SCURO = dict(BG="#121212", INK="#F4F1EA", BRONZE="#C2A276", FAINT="#8C8880",
             SOP="0.14", HALO="rgba(255,255,255,.05)",
             LOGO="fg-logo-orizzontale-negativo.svg")

VARIANTI = {
    "meet-avorio":          (CHIARO, MARCHIO),
    "meet-inchiostro":      (SCURO,  MARCHIO),
    "meet-avorio-firma":    (CHIARO, MARCHIO + FIRMA),
    "meet-inchiostro-firma":(SCURO,  MARCHIO + FIRMA),
}

for nome, (pal, contenuto) in VARIANTI.items():
    html = TPL.format(CONTENUTO=contenuto.format(LOGO=pal["LOGO"]), **pal)
    open(f"{nome}.html", "w", encoding="utf-8").write(html)
    print("scritto", nome)
