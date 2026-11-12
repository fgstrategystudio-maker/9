#!/usr/bin/env python3
"""
Costruisce /cookie-policy (it, en, pt) e aggancia il link in giro per il sito.

La pagina nasce dalla corrispondente privacy.html invece che da zero: cosi'
eredita header, mega-menu, footer e fogli di stile esatti di quella lingua,
e non resta indietro quando il menu cambia. Si sostituisce solo il corpo e
si rifanno i tag di testa.

Lo spagnolo non ha pagine legali proprie: il banner gia' rimanda alle
italiane, e qui si fa lo stesso invece di inventare una /es/cookie-policy
senza la /es/privacy che le sta accanto.

Idempotente: si puo' rilanciare.

Uso:  python3.13 _build_cookie.py
"""
import re

DATA = {"it": "12 novembre 2026", "en": "12 November 2026", "pt": "12 de novembro de 2026"}

TITOLO = {"it": "Cookie Policy", "en": "Cookie Policy", "pt": "Política de Cookies"}

DESCR = {
    "it": "Quali cookie usa francescogizzi.com, a cosa servono e come cambiare idea.",
    "en": "Which cookies francescogizzi.com uses, what they are for and how to change your mind.",
    "pt": "Quais cookies o francescogizzi.com usa, para que servem e como mudar de ideia.",
}

BOTTONE = {"it": "Gestisci le preferenze",
           "en": "Manage your preferences",
           "pt": "Gerir as preferências"}

# Il link alla privacy nella lingua giusta.
PRIV = {"it": "/privacy", "en": "/en/privacy", "pt": "/pt/privacy"}

STILE_BOTTONE = """
    .cookie-gestisci{font:500 15px/1 inherit;background:#121212;color:#F7F6F2;border:0;
      border-radius:999px;padding:13px 24px;cursor:pointer;transition:background .25s}
    .cookie-gestisci:hover{background:#8A6F4E}
    .cookie-gestisci:focus-visible{outline:2px solid #8A6F4E;outline-offset:3px}
    .cookie-nota{font-size:13px;color:var(--muted)}"""


CORPO = {}

CORPO["it"] = """
  <p>Questa pagina dice quali cookie usa francescogizzi.com, a cosa servono e come cambiare idea in qualsiasi momento. Per il trattamento dei dati personali in generale vedi la <a href="/privacy">Privacy policy</a>.</p>

  <h2>1. Le tue scelte</h2>
  <p>Al primo accesso compare un banner con tre possibilit&agrave;: <strong>Accetta</strong>, <strong>Rifiuta</strong> e <strong>Personalizza</strong>, da cui puoi accendere o spegnere le singole categorie. Finch&eacute; non scegli non viene installato nessun cookie analitico o pubblicitario, e lo script del pixel pubblicitario non viene nemmeno scaricato.</p>
  <p>La scelta resta memorizzata nel tuo browser. Puoi cambiarla quando vuoi:</p>
  <p><button type="button" class="cookie-gestisci" id="gestisci-cookie">__BOTTONE__</button></p>
  <p class="cookie-nota">Se il tasto non risponde, i cookie sono bloccati dal browser: in quel caso non viene salvato nulla e non c&rsquo;&egrave; niente da gestire.</p>
  <p>Rifiutare non limita in nessun modo l&rsquo;uso del sito.</p>

  <h2>2. Cookie necessari</h2>
  <p>Fanno funzionare il sito e ricordano la tua scelta. Non richiedono consenso e non si possono disattivare. Sono salvati nella memoria locale del browser (<em>localStorage</em>), non vengono inviati a nessun server e restano finch&eacute; non cancelli i dati del sito.</p>
  <table class="privacy-table">
    <thead><tr><th>Nome</th><th>Scopo</th><th>Durata</th></tr></thead>
    <tbody>
      <tr><td>fg_consent</td><td>La tua scelta sui cookie di marketing</td><td>Finch&eacute; non cancelli i dati del sito</td></tr>
      <tr><td>fg_consent_pref</td><td>La tua scelta categoria per categoria, con la data</td><td>Finch&eacute; non cancelli i dati del sito</td></tr>
      <tr><td>fg_notrack</td><td>Presente solo se hai aperto il sito con <code>?notrack=1</code>: esclude le tue visite dalle statistiche</td><td>Finch&eacute; non cancelli i dati del sito</td></tr>
    </tbody>
  </table>

  <h2>3. Cookie analitici</h2>
  <p>Attivi <strong>solo con il tuo consenso</strong>. Servono a capire quali pagine vengono lette davvero, da dove arriva chi visita il sito e dove si ferma. I dati sono aggregati e non servono a identificarti.</p>
  <p>Fornitore: <strong>Google Analytics 4</strong> (Google Ireland Limited, con trattamenti anche da parte di Google LLC negli Stati Uniti). &Egrave; attivo il <em>Consent Mode v2</em>: finch&eacute; non acconsenti, Google non riceve dati di navigazione.</p>
  <table class="privacy-table">
    <thead><tr><th>Nome</th><th>Scopo</th><th>Durata</th></tr></thead>
    <tbody>
      <tr><td>_ga</td><td>Distingue un visitatore dall&rsquo;altro</td><td>2 anni</td></tr>
      <tr><td>_ga_G-BDW0NNT2XH</td><td>Stato della sessione di navigazione</td><td>2 anni</td></tr>
    </tbody>
  </table>

  <h2>4. Cookie di marketing</h2>
  <p>Attivi <strong>solo con il tuo consenso</strong>. Il pixel di <strong>ChatGPT Ads</strong> (OpenAI) serve a capire quali visite arrivano dagli annunci e quali si trasformano in una richiesta di contatto.</p>
  <p>Finch&eacute; non acconsenti, lo script non viene scaricato: nessun dato lascia il tuo browser. Dopo il consenso il codice &egrave; caricato da <code>bzrcdn.openai.com</code> e gli eventi sono inviati a <code>bzr.openai.com</code>. Gli identificativi che il pixel imposta sono gestiti da OpenAI e salvati nel tuo browser; se revochi il consenso lo script smette di essere caricato e di inviare eventi.</p>

  <h2>5. Chi riceve i dati</h2>
  <ul>
    <li><strong>Google</strong> (Google Ireland Limited e Google LLC, USA), statistiche di utilizzo. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Informativa di Google</a>.</li>
    <li><strong>OpenAI</strong> (USA), misurazione delle campagne pubblicitarie.</li>
    <li><strong>Vercel Inc.</strong> (USA), hosting del sito: registra dati di accesso (indirizzo IP, user agent) nei log tecnici, per sicurezza e affidabilit&agrave;. Non dipendono dal consenso ai cookie.</li>
  </ul>
  <p>Alcuni di questi fornitori hanno sede negli Stati Uniti. Il trasferimento avviene nel rispetto delle garanzie previste dal GDPR (Clausole Contrattuali Standard o accordi equivalenti).</p>

  <h2>6. Intervenire dal browser</h2>
  <p>Oltre al banner, puoi cancellare o bloccare i cookie dalle impostazioni del browser: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Chrome</a>, <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a>, <a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop" target="_blank" rel="noopener">Firefox</a>, <a href="https://support.microsoft.com/it-it/microsoft-edge" target="_blank" rel="noopener">Edge</a>. Bloccando tutto, per&ograve;, alcune funzioni di altri siti possono smettere di funzionare.</p>
  <p>Per le sole statistiche esiste anche il <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">componente aggiuntivo di Google per la disattivazione di Analytics</a>.</p>

  <h2>7. Modifiche</h2>
  <p>Questa pagina viene aggiornata se cambiano gli strumenti usati dal sito o le norme che li riguardano. La data di ultima modifica &egrave; sempre in cima.</p>
  <p>Per qualsiasi domanda: <a href="mailto:fgstrategystudio@gmail.com">fgstrategystudio@gmail.com</a>.</p>
"""

CORPO["en"] = """
  <p>This page sets out which cookies francescogizzi.com uses, what they are for and how to change your mind at any time. For the handling of personal data in general, see the <a href="/en/privacy">Privacy policy</a>.</p>

  <h2>1. Your choices</h2>
  <p>On your first visit a banner appears with three options: <strong>Accept</strong>, <strong>Decline</strong> and <strong>Customise</strong>, where you can switch each category on or off. Until you choose, no analytics or advertising cookie is installed, and the advertising pixel&rsquo;s script is not even downloaded.</p>
  <p>Your choice is stored in your browser. You can change it whenever you like:</p>
  <p><button type="button" class="cookie-gestisci" id="gestisci-cookie">__BOTTONE__</button></p>
  <p class="cookie-nota">If the button does nothing, cookies are blocked by your browser: in that case nothing is stored and there is nothing to manage.</p>
  <p>Declining does not limit your use of the site in any way.</p>

  <h2>2. Necessary cookies</h2>
  <p>They make the site work and remember your choice. They need no consent and cannot be switched off. They are kept in your browser&rsquo;s local storage (<em>localStorage</em>), are never sent to any server, and stay until you clear the site&rsquo;s data.</p>
  <table class="privacy-table">
    <thead><tr><th>Name</th><th>Purpose</th><th>Duration</th></tr></thead>
    <tbody>
      <tr><td>fg_consent</td><td>Your choice about marketing cookies</td><td>Until you clear the site&rsquo;s data</td></tr>
      <tr><td>fg_consent_pref</td><td>Your choice category by category, with the date</td><td>Until you clear the site&rsquo;s data</td></tr>
      <tr><td>fg_notrack</td><td>Present only if you opened the site with <code>?notrack=1</code>: keeps your visits out of the statistics</td><td>Until you clear the site&rsquo;s data</td></tr>
    </tbody>
  </table>

  <h2>3. Analytics cookies</h2>
  <p>Active <strong>only with your consent</strong>. They show which pages are actually read, where visitors come from and where they stop. The data is aggregated and is not used to identify you.</p>
  <p>Provider: <strong>Google Analytics 4</strong> (Google Ireland Limited, with processing also by Google LLC in the United States). <em>Consent Mode v2</em> is in place: until you consent, Google receives no browsing data.</p>
  <table class="privacy-table">
    <thead><tr><th>Name</th><th>Purpose</th><th>Duration</th></tr></thead>
    <tbody>
      <tr><td>_ga</td><td>Tells one visitor from another</td><td>2 years</td></tr>
      <tr><td>_ga_G-BDW0NNT2XH</td><td>State of the browsing session</td><td>2 years</td></tr>
    </tbody>
  </table>

  <h2>4. Marketing cookies</h2>
  <p>Active <strong>only with your consent</strong>. The <strong>ChatGPT Ads</strong> pixel (OpenAI) shows which visits come from adverts and which turn into an enquiry.</p>
  <p>Until you consent the script is not downloaded: no data leaves your browser. After consent the code is loaded from <code>bzrcdn.openai.com</code> and events are sent to <code>bzr.openai.com</code>. The identifiers the pixel sets are managed by OpenAI and stored in your browser; if you withdraw consent the script stops being loaded and stops sending events.</p>

  <h2>5. Who receives the data</h2>
  <ul>
    <li><strong>Google</strong> (Google Ireland Limited and Google LLC, USA), usage statistics. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google&rsquo;s privacy notice</a>.</li>
    <li><strong>OpenAI</strong> (USA), measurement of advertising campaigns.</li>
    <li><strong>Vercel Inc.</strong> (USA), hosting: records access data (IP address, user agent) in technical logs, for security and reliability. These do not depend on cookie consent.</li>
  </ul>
  <p>Some of these providers are based in the United States. Transfers take place under the safeguards required by the GDPR (Standard Contractual Clauses or equivalent arrangements).</p>

  <h2>6. Acting from your browser</h2>
  <p>Besides the banner, you can delete or block cookies in your browser settings: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Chrome</a>, <a href="https://support.apple.com/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a>, <a href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener">Firefox</a>, <a href="https://support.microsoft.com/microsoft-edge" target="_blank" rel="noopener">Edge</a>. Block everything, though, and some features of other sites may stop working.</p>
  <p>For statistics alone there is also <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google&rsquo;s Analytics opt-out add-on</a>.</p>

  <h2>7. Changes</h2>
  <p>This page is updated when the tools the site uses change, or the rules that govern them do. The date of the last change is always at the top.</p>
  <p>Any questions: <a href="mailto:fgstrategystudio@gmail.com">fgstrategystudio@gmail.com</a>.</p>
"""

CORPO["pt"] = """
  <p>Esta página diz quais cookies o francescogizzi.com usa, para que servem e como mudar de ideia a qualquer momento. Para o tratamento de dados pessoais em geral, veja a <a href="/pt/privacy">Política de privacidade</a>.</p>

  <h2>1. As suas escolhas</h2>
  <p>No primeiro acesso aparece um banner com três opções: <strong>Aceito</strong>, <strong>Recusar</strong> e <strong>Personalizar</strong>, onde pode ligar ou desligar cada categoria. Enquanto não escolher, nenhum cookie analítico ou publicitário é instalado, e o script do pixel publicitário nem sequer é descarregado.</p>
  <p>A escolha fica guardada no seu navegador. Pode alterá-la quando quiser:</p>
  <p><button type="button" class="cookie-gestisci" id="gestisci-cookie">__BOTTONE__</button></p>
  <p class="cookie-nota">Se o botão não responder, os cookies estão bloqueados pelo navegador: nesse caso nada é guardado e não há nada para gerir.</p>
  <p>Recusar não limita de forma nenhuma o uso do site.</p>

  <h2>2. Cookies necessários</h2>
  <p>Fazem o site funcionar e guardam a sua escolha. Não exigem consentimento e não podem ser desativados. Ficam na memória local do navegador (<em>localStorage</em>), não são enviados a nenhum servidor e permanecem até limpar os dados do site.</p>
  <table class="privacy-table">
    <thead><tr><th>Nome</th><th>Finalidade</th><th>Duração</th></tr></thead>
    <tbody>
      <tr><td>fg_consent</td><td>A sua escolha sobre cookies de marketing</td><td>Até limpar os dados do site</td></tr>
      <tr><td>fg_consent_pref</td><td>A sua escolha categoria a categoria, com a data</td><td>Até limpar os dados do site</td></tr>
      <tr><td>fg_notrack</td><td>Presente apenas se abriu o site com <code>?notrack=1</code>: mantém as suas visitas fora das estatísticas</td><td>Até limpar os dados do site</td></tr>
    </tbody>
  </table>

  <h2>3. Cookies analíticos</h2>
  <p>Ativos <strong>apenas com o seu consentimento</strong>. Mostram quais páginas são realmente lidas, de onde vem quem visita o site e onde para. Os dados são agregados e não servem para o identificar.</p>
  <p>Fornecedor: <strong>Google Analytics 4</strong> (Google Ireland Limited, com tratamento também pela Google LLC nos Estados Unidos). O <em>Consent Mode v2</em> está ativo: enquanto não consentir, a Google não recebe dados de navegação.</p>
  <table class="privacy-table">
    <thead><tr><th>Nome</th><th>Finalidade</th><th>Duração</th></tr></thead>
    <tbody>
      <tr><td>_ga</td><td>Distingue um visitante do outro</td><td>2 anos</td></tr>
      <tr><td>_ga_G-BDW0NNT2XH</td><td>Estado da sessão de navegação</td><td>2 anos</td></tr>
    </tbody>
  </table>

  <h2>4. Cookies de marketing</h2>
  <p>Ativos <strong>apenas com o seu consentimento</strong>. O pixel do <strong>ChatGPT Ads</strong> (OpenAI) mostra quais visitas vêm dos anúncios e quais se transformam num pedido de contacto.</p>
  <p>Enquanto não consentir, o script não é descarregado: nenhum dado sai do seu navegador. Depois do consentimento o código é carregado de <code>bzrcdn.openai.com</code> e os eventos são enviados para <code>bzr.openai.com</code>. Os identificadores que o pixel define são geridos pela OpenAI e guardados no seu navegador; se retirar o consentimento, o script deixa de ser carregado e de enviar eventos.</p>

  <h2>5. Quem recebe os dados</h2>
  <ul>
    <li><strong>Google</strong> (Google Ireland Limited e Google LLC, EUA), estatísticas de utilização. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Política da Google</a>.</li>
    <li><strong>OpenAI</strong> (EUA), medição das campanhas publicitárias.</li>
    <li><strong>Vercel Inc.</strong> (EUA), alojamento do site: regista dados de acesso (endereço IP, user agent) nos registos técnicos, por segurança e fiabilidade. Não dependem do consentimento aos cookies.</li>
  </ul>
  <p>Alguns destes fornecedores têm sede nos Estados Unidos. A transferência respeita as garantias previstas pelo RGPD (Cláusulas Contratuais-Tipo ou acordos equivalentes).</p>

  <h2>6. Agir a partir do navegador</h2>
  <p>Além do banner, pode apagar ou bloquear os cookies nas definições do navegador: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Chrome</a>, <a href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a>, <a href="https://support.mozilla.org/pt-PT/kb/protecao-aprimorada-contra-rastreamento-firefox-desktop" target="_blank" rel="noopener">Firefox</a>, <a href="https://support.microsoft.com/pt-pt/microsoft-edge" target="_blank" rel="noopener">Edge</a>. Bloqueando tudo, porém, algumas funções de outros sites podem deixar de funcionar.</p>
  <p>Só para as estatísticas existe também o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">complemento da Google para desativar o Analytics</a>.</p>

  <h2>7. Alterações</h2>
  <p>Esta página é atualizada quando mudam as ferramentas usadas pelo site ou as normas que as regulam. A data da última alteração está sempre no topo.</p>
  <p>Para qualquer questão: <a href="mailto:fgstrategystudio@gmail.com">fgstrategystudio@gmail.com</a>.</p>
"""

SCRIPT = """
<script>
// Il pannello e' quello vero del banner: lo apre consent.js, che e' gia'
// caricato in fondo a questa pagina.
document.getElementById('gestisci-cookie').addEventListener('click', function () {
  if (typeof window.fgCookiePrefs === 'function') window.fgCookiePrefs();
});
</script>
"""


def sorgente(lang):
    return ("privacy.html" if lang == "it" else f"{lang}/privacy.html")


def destinazione(lang):
    return ("cookie-policy.html" if lang == "it" else f"{lang}/cookie-policy.html")


def url(lang, pagina):
    return "https://francescogizzi.com" + ("" if lang == "it" else "/" + lang) + "/" + pagina


def costruisci(lang):
    s = open(sorgente(lang), encoding="utf-8").read()

    # ── testa ──
    s = re.sub(r"<title>.*?</title>",
               f"<title>{TITOLO[lang]}, Francesco Gizzi</title>", s, count=1)
    s = re.sub(r'(<meta name="description" content=")[^"]*(")',
               lambda m: m.group(1) + DESCR[lang] + m.group(2), s, count=1)
    s = s.replace(f'<link rel="canonical" href="{url(lang, "privacy")}" />',
                  f'<link rel="canonical" href="{url(lang, "cookie-policy")}" />', 1)
    for l in ("it", "en", "pt"):
        s = s.replace(f'hreflang="{l}" href="{url(l, "privacy")}"',
                      f'hreflang="{l}" href="{url(l, "cookie-policy")}"', 1)

    # Il selettore di lingua in alto resta sulla stessa pagina, non rimanda
    # alla privacy. Lo spagnolo punta alla pagina italiana, come gia' fa qui.
    testa, corpo = s.split("</head>", 1)
    s = testa + "</head>" + corpo.replace(
        '<div class="tb-langs">', '<div class="tb-langs">', 1)
    for l, href in (("it", "/cookie-policy"), ("en", "/en/cookie-policy"),
                    ("pt", "/pt/cookie-policy")):
        vecchio = ("/privacy" if l == "it" else f"/{l}/privacy")
        s = re.sub(r'(<a href=")' + re.escape(vecchio) + r'(" hreflang="' + l + '")',
                   lambda m, h=href: m.group(1) + h + m.group(2), s, count=1)

    # ── stile del bottone, in coda a quello della pagina ──
    if ".cookie-gestisci" not in s:
        s = s.replace("\n  </style>", STILE_BOTTONE + "\n  </style>", 1)

    # ── corpo ──
    a = s.index('<div class="privacy-wrap">') + len('<div class="privacy-wrap">')
    b = s.index("\n</div>\n</div>\n</main>", a)
    s = s[:a] + "\n\n  <h1>" + TITOLO[lang] + "</h1>\n  <p class=\"privacy-date\">" + \
        {"it": "Ultimo aggiornamento: ", "en": "Last updated: ",
         "pt": "Última atualização: "}[lang] + DATA[lang] + "</p>\n" + \
        CORPO[lang].replace("__BOTTONE__", BOTTONE[lang]) + s[b:]

    # Il piccolo script va dopo consent.js, che definisce fgCookiePrefs.
    if "gestisci-cookie'" not in s:
        s = s.replace('<script src="consent.js"></script>',
                      '<script src="consent.js"></script>' + SCRIPT.rstrip(), 1)

    open(destinazione(lang), "w", encoding="utf-8").write(s)
    print(destinazione(lang), "ok")


# ── link nel footer di tutto il sito ────────────────────────────────────

# Una scelta sui cookie si deve poter cambiare, e finche' il link non c'e'
# in fondo a ogni pagina l'unico modo e' cancellare i dati del browser.
FOOTER = [
    ('aria-label="Footer"><a href="/privacy">Privacy</a>',
     '<a href="/cookie-policy">Cookie</a>'),
    ('aria-label="Footer"><a href="/en/privacy">Privacy</a>',
     '<a href="/en/cookie-policy">Cookie</a>'),
    ('aria-label="Footer"><a href="/pt/privacy">Privacidade</a>',
     '<a href="/pt/cookie-policy">Cookies</a>'),
    ('aria-label="Footer"><a href="/privacy">Privacidad</a>',
     '<a href="/cookie-policy">Cookies</a>'),
]


def footer():
    import glob
    fatte = 0
    for f in glob.glob("**/*.html", recursive=True):
        if f.startswith(("dashboard/", "backups/", "node_modules/")):
            continue
        s = open(f, encoding="utf-8").read()
        if "/cookie-policy" in s and "aria-label=\"Footer\"" in s and \
           any(a + b in s for a, b in FOOTER):
            continue
        o = s
        for ancora, link in FOOTER:
            if ancora in s and ancora + link not in s:
                s = s.replace(ancora, ancora + link, 1)
        if s != o:
            open(f, "w", encoding="utf-8").write(s)
            fatte += 1
    print(f"link nel footer: {fatte} pagine")


def main():
    for lang in ("it", "en", "pt"):
        costruisci(lang)
    footer()


if __name__ == "__main__":
    main()
