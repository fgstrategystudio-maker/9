#!/usr/bin/env python3
"""
Traccia in GA4 l'invio del form contatti. Il form (Web3Forms) reindirizza alla
pagina di ringraziamento, quindi l'evento generate_lead scatta al caricamento
di /grazie: conta solo gli invii andati a buon fine. Idempotente.
"""
PIXEL_TAG_END = 'oaiq("init",{pixelId:"TPh7S38n3afeCFQCzq5nxM",debug:true});</script>'

PAGES = {
    "grazie.html": "it",
    "en/grazie.html": "en",
    "es/grazie.html": "es",
    "pt/grazie.html": "pt",
}

for f, lang in PAGES.items():
    s = open(f, encoding="utf-8").read()
    if "generate_lead" in s:
        print("gia' presente:", f)
        continue
    assert s.count(PIXEL_TAG_END) == 1, f
    event = (
        '\n  <!-- Conversione: invio form contatti (redirect Web3Forms) -->\n'
        "  <script>gtag('event','generate_lead',{method:'web3forms',form:'contatti',"
        "language:'" + lang + "'});</script>"
    )
    open(f, "w", encoding="utf-8").write(s.replace(PIXEL_TAG_END, PIXEL_TAG_END + event, 1))
    print("evento aggiunto:", f)
