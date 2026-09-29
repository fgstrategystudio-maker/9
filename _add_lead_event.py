#!/usr/bin/env python3
"""
Traccia l'invio del form contatti come conversione, su GA4 e sul pixel
ChatGPT Ads. Il form (Web3Forms) reindirizza alla pagina di ringraziamento,
quindi gli eventi scattano al caricamento di /grazie: contano solo gli invii
andati a buon fine. I due eventi stanno in tag separati, cosi' un errore in
uno non impedisce all'altro di partire. Idempotente.
"""
PIXEL_TAG_END = 'oaiq("init",{pixelId:"TPh7S38n3afeCFQCzq5nxM",debug:true});</script>'
OAI_EVENT = '  <script>oaiq("measure","lead_created",{type:"customer_action"});</script>'

PAGES = {
    "grazie.html": "it",
    "en/grazie.html": "en",
    "es/grazie.html": "es",
    "pt/grazie.html": "pt",
}

for f, lang in PAGES.items():
    s = open(f, encoding="utf-8").read()
    changed = False

    if "generate_lead" not in s:
        assert s.count(PIXEL_TAG_END) == 1, f
        ga = (
            '\n  <!-- Conversione: invio form contatti (redirect Web3Forms) -->\n'
            "  <script>gtag('event','generate_lead',{method:'web3forms',form:'contatti',"
            "language:'" + lang + "'});</script>"
        )
        s = s.replace(PIXEL_TAG_END, PIXEL_TAG_END + ga, 1)
        changed = True

    if "lead_created" not in s:
        ga_tag = ("  <script>gtag('event','generate_lead',{method:'web3forms',"
                  "form:'contatti',language:'" + lang + "'});</script>")
        assert s.count(ga_tag) == 1, f
        s = s.replace(ga_tag, ga_tag + "\n" + OAI_EVENT, 1)
        changed = True

    if changed:
        open(f, "w", encoding="utf-8").write(s)
        print("aggiornato:", f)
    else:
        print("gia' a posto:", f)
