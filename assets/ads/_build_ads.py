#!/usr/bin/env python3
"""Genera le creativita' pubblicitarie nei formati richiesti da Meta e ChatGPT Ads."""
import os

TPL = """<!doctype html><html lang="it"><head><meta charset="utf-8">
<style>
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-400-normal.woff2)format('woff2');font-weight:400}}
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-500-normal.woff2)format('woff2');font-weight:500}}
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-600-normal.woff2)format('woff2');font-weight:600}}
@font-face{{font-family:SG;src:url(schibsted-grotesk-latin-700-normal.woff2)format('woff2');font-weight:700}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px}}
body{{background:{BG};font-family:SG,system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  position:relative;overflow:hidden;display:flex;flex-direction:column;
  padding:{PAD}px;padding-bottom:{PADB}px;color:{INK}}}

/* La struttura del marchio, ingrandita e quasi muta: due direzioni che si
   raccolgono in un asse che sale. Si legge solo se la si cerca. */
.struttura{{position:absolute;right:{SX}px;top:{SY}px;width:{SW}px;height:{SW}px;
  opacity:{SOP};pointer-events:none}}

header{{display:flex;align-items:flex-start;justify-content:space-between;gap:40px}}
.logo{{width:{LOGO}px;height:auto;display:block}}
.coord{{font-size:{MICRO}px;font-weight:500;letter-spacing:.34em;text-transform:uppercase;
  color:{FAINT};text-align:right;line-height:1.9;white-space:nowrap}}

main{{margin-top:auto;position:relative;z-index:2;max-width:{TXTW}px}}
h1{{font-size:{H1}px;line-height:1.02;letter-spacing:-.035em;font-weight:600;
  text-wrap:balance}}
h1 em{{font-style:normal;color:{BRONZE}}}
.sub{{margin-top:{GAP}px;font-size:{SUB}px;line-height:1.45;font-weight:400;
  color:{MUTED};max-width:{SUBW}px}}

.cta{{margin-top:{CTAGAP}px;display:inline-flex;align-items:center;gap:{MICRO}px;
  background:{BRONZE};color:{CTAINK};font-size:{CTA}px;font-weight:600;
  letter-spacing:-.01em;padding:{CTAPY}px {CTAPX}px;border-radius:999px}}
.cta svg{{width:{CTA}px;height:{CTA}px;flex:none}}

footer{{margin-top:{FGAP}px;display:flex;align-items:center;justify-content:space-between;
  gap:30px;border-top:1px solid {LINE};padding-top:{MICRO}px;position:relative;z-index:2}}
footer span{{font-size:{MICRO}px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;
  color:{FAINT};white-space:nowrap}}
</style></head><body>

<svg class="struttura" viewBox="0 0 100 100" aria-hidden="true">
  <path d="M18 94 L50 56 M82 94 L50 56" fill="none" stroke="{INK}" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M50 56 V8" fill="none" stroke="{BRONZE}" stroke-width="3.2" stroke-linecap="round"/>
</svg>

<header>
  <img class="logo" src="{LOGOSRC}" alt="Francesco Gizzi">
  <div class="coord">Marketing · Dati<br>Sales · Strategia</div>
</header>

<main>
  <h1>{TITOLO}</h1>
  <p class="sub">{SOTTO}</p>
  <div class="cta">Richiedi un audit
    <svg viewBox="0 0 24 24" fill="none" stroke="{CTAINK}" stroke-width="2.4"
         stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
  </div>
</main>

<footer>
  <span>francescogizzi.com</span>
  <span>Roma · Milano</span>
</footer>
</body></html>"""

CHIARO = dict(BG="#F7F6F2", INK="#121212", MUTED="#4A463F", FAINT="#8A867E",
              BRONZE="#8A6F4E", CTAINK="#F7F6F2", LINE="#DEDBD3", SOP="0.10",
              LOGOSRC="fg-logo-orizzontale.svg")
SCURO = dict(BG="#121212", INK="#F4F1EA", MUTED="#B4AEA3", FAINT="#8C8880",
             BRONZE="#C2A276", CTAINK="#121212", LINE="#2E2A24", SOP="0.13",
             LOGOSRC="fg-logo-orizzontale-negativo.svg")

TITOLO = "Marketing, dati e sales<br>che non si parlano.<br><em>Un audit dice dove.</em>"
SOTTO = ("Aiuto PMI e scale-up a vedere dove si perdono opportunità "
         "tra acquisizione, numeri e vendita. Poi a rimetterle in riga.")

FORMATI = [
    # nome, larghezza, altezza, scala tipografica
    ("1x1",  1080, 1080, dict(PAD=84,  H1=82,  SUB=30, CTA=27, MICRO=15, LOGO=310,
                              TXTW=830, SUBW=690, GAP=30, CTAGAP=46, FGAP=64,
                              CTAPY=22, CTAPX=40, PADB=84,  SW=560, SX=-150, SY=150)),
    ("4x5",  1080, 1350, dict(PAD=88,  H1=88,  SUB=32, CTA=28, MICRO=15, LOGO=320,
                              TXTW=860, SUBW=720, GAP=34, CTAGAP=52, FGAP=76,
                              CTAPY=24, CTAPX=44, PADB=88,  SW=640, SX=-170, SY=190)),
    ("9x16", 1080, 1920, dict(PAD=92,  H1=92,  SUB=34, CTA=30, MICRO=16, LOGO=330,
                              TXTW=880, SUBW=740, GAP=38, CTAGAP=58, FGAP=110,
                              CTAPY=26, CTAPX=48, PADB=400, SW=720, SX=-190, SY=320)),
]

def main():
    for nome, w, h, s in FORMATI:
        for tema, pal in (("chiaro", CHIARO), ("scuro", SCURO)):
            html = TPL.format(W=w, H=h, TITOLO=TITOLO, SOTTO=SOTTO, **s, **pal)
            f = f"ad-{nome}-{tema}.html"
            open(f, "w", encoding="utf-8").write(html)
            print("scritto", f)

if __name__ == "__main__":
    main()
