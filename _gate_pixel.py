#!/usr/bin/env python3
"""
Mette il pixel ChatGPT Ads dietro il consenso, e porta il banner cookie su
tutte le pagine.

Tre passi, tutti idempotenti:
  1. lo snippet del pixel nella <head> non scarica piu' l'SDK da solo: crea
     solo la coda (cosi' oaiq() resta sempre chiamabile e lead_created non
     esplode su /grazie) e definisce fgLoadAds, che inietta lo script. Se il
     consenso e' gia' in localStorage lo carica subito, senza aspettare
     consent.js: cosi' i visitatori di ritorno vengono tracciati dal primo
     istante.
  2. consent.js viene aggiunto alle pagine che non ce l'hanno.
  3. controllo finale di copertura.
"""
import glob
import re

PIXEL_ID = "TPh7S38n3afeCFQCzq5nxM"
SDK = "https://bzrcdn.openai.com/sdk/oaiq.min.js"

OLD = ('<script>!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};'
       'q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;'
       'var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}'
       f'(window,document,"script","{SDK}");'
       f'oaiq("init",{{pixelId:"{PIXEL_ID}"}});</script>')

NEW = ('<script>!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};'
       'q.q=[];w.oaiq=q;w.fgLoadAds=function(){if(w.__fgAds)return;w.__fgAds=1;'
       'var j=d.createElement(s);j.async=1;j.src=u;'
       'var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)};'
       f'oaiq("init",{{pixelId:"{PIXEL_ID}"}});'
       'try{if(localStorage.getItem("fg_consent")==="granted")w.fgLoadAds()}catch(e){}}'
       f'(window,document,"script","{SDK}");</script>')

OLD_COMMENT = "<!-- ChatGPT Ads pixel (OpenAI) -->"
NEW_COMMENT = "<!-- ChatGPT Ads pixel (OpenAI) - l'SDK parte solo col consenso -->"

CONSENT_TAG = '<script src="/consent.js"></script>'
SKIP = {"firma-email.html", "google643280b504548f64.html"}


def pages():
    return sorted(glob.glob("*.html") + glob.glob("en/*.html")
                  + glob.glob("es/*.html") + glob.glob("pt/*.html"))


def gate_pixel():
    done = already = missing = 0
    for f in pages():
        if f.split("/")[-1] in SKIP:
            continue
        s = open(f, encoding="utf-8").read()
        if "fgLoadAds" in s:
            already += 1
            continue
        if OLD not in s:
            missing += 1
            print("  ! snippet non riconosciuto:", f)
            continue
        s = s.replace(OLD_COMMENT, NEW_COMMENT, 1).replace(OLD, NEW, 1)
        open(f, "w", encoding="utf-8").write(s)
        done += 1
    print(f"1. pixel dietro consenso: {done} pagine, {already} gia' fatte, {missing} non riconosciute")


def spread_banner():
    done = already = missing = 0
    for f in pages():
        if f.split("/")[-1] in SKIP:
            continue
        s = open(f, encoding="utf-8").read()
        if "consent.js" in s:
            already += 1
            continue
        m = re.search(r"</body>", s)
        if not m:
            missing += 1
            print("  ! niente </body>:", f)
            continue
        s = s[:m.start()] + CONSENT_TAG + "\n" + s[m.start():]
        open(f, "w", encoding="utf-8").write(s)
        done += 1
    print(f"2. banner cookie: aggiunto a {done} pagine, {already} gia' presenti, {missing} senza body")


def check():
    tot = gated = banner = 0
    for f in pages():
        if f.split("/")[-1] in SKIP:
            continue
        s = open(f, encoding="utf-8").read()
        tot += 1
        gated += "fgLoadAds" in s
        banner += "consent.js" in s
    print(f"3. copertura: {gated}/{tot} pagine col pixel gated, {banner}/{tot} col banner")


if __name__ == "__main__":
    gate_pixel()
    spread_banner()
    check()
