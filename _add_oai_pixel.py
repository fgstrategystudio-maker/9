#!/usr/bin/env python3
"""
Installa il pixel ChatGPT Ads (OpenAI, oaiq) nella <head> di tutte le pagine
del sito, subito dopo il meta charset. Idempotente: salta le pagine che lo
hanno gia'. Esclude la firma email (non e' una pagina del sito) e il file di
verifica Search Console.
"""
import glob

PIXEL_ID = "TPh7S38n3afeCFQCzq5nxM"
ANCHOR = '<meta charset="utf-8" />'
SNIPPET = (
    '\n  <!-- ChatGPT Ads pixel (OpenAI) -->\n'
    '  <script>!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};'
    'q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;'
    'var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}'
    '(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");'
    'oaiq("init",{pixelId:"' + PIXEL_ID + '"});</script>'
)

SKIP = {"firma-email.html", "google643280b504548f64.html"}

files = sorted(glob.glob("*.html") + glob.glob("en/*.html")
               + glob.glob("es/*.html") + glob.glob("pt/*.html"))

done = skipped = already = noanchor = 0
for f in files:
    if f.split("/")[-1] in SKIP:
        skipped += 1
        continue
    s = open(f, encoding="utf-8").read()
    if "oaiq" in s:
        already += 1
        continue
    if s.count(ANCHOR) != 1:
        noanchor += 1
        print("  ! anchor non trovato (o duplicato):", f)
        continue
    open(f, "w", encoding="utf-8").write(s.replace(ANCHOR, ANCHOR + SNIPPET, 1))
    done += 1

print(f"pixel inserito: {done} | gia' presente: {already} | esclusi: {skipped} | anchor mancante: {noanchor}")
