"""Layout comune delle pagine interne (landing e guida).

Le pagine si rigenerano con:  python3 _build/pages.py
"""
import html, json

SITE = "https://www.tenutacolledellerose.it"
PHONE = "+39 351 704 8540"
WA = "393517048540"
EMAIL = "fgstrategystudio@gmail.com"
FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Jost:wght@400;500&display=swap"

T = {
    "it": dict(skip="Vai al contenuto", brand_sub="Tenuta in vendita · Riano · Roma",
               nav=[("La tenuta", "/#tenuta"), ("Potenziale", "/#potenziale"), ("Guida", "/guida/")],
               cta="Prenota una visita", cta_href="/#contatti", lang_label="EN", lang_href="/en/",
               home="Home", aside_title="Tenuta Colle delle Rose",
               aside_text="21 ettari · agriturismo con 8 camere · sala da 70 coperti · 25 km da Roma",
               aside_price="€ 869.000", aside_btn="Scopri la tenuta", aside_wa="Scrivi su WhatsApp",
               related="Continua a leggere", band="Vuoi vedere la tenuta dal vivo?",
               band_btn="Richiedi il dossier", foot="Tenuta agricola con agriturismo in vendita a Roma Nord",
               privacy="Privacy", guide="Guida all'acquisto", updated="Aggiornato il"),
    "en": dict(skip="Skip to content", brand_sub="Estate for sale · Riano · Rome",
               nav=[("The estate", "/en/#estate"), ("Potential", "/en/#potential"), ("Guides (IT)", "/guida/")],
               cta="Book a viewing", cta_href="/en/#contact", lang_label="IT", lang_href="/",
               home="Home", aside_title="Colle delle Rose Estate",
               aside_text="21 hectares · 8-room agriturismo · 70-cover restaurant · 25 km from Rome",
               aside_price="€869,000", aside_btn="Discover the estate", aside_wa="Message on WhatsApp",
               related="Keep reading", band="Would you like to see the estate in person?",
               band_btn="Request the dossier", foot="Country estate with agriturismo for sale near Rome",
               privacy="Privacy", guide="Buyer's guide", updated="Updated"),
}


def esc(s):
    return html.escape(s, quote=True)


def img(name, alt, w=900, h=506, cls="", eager=False, sizes="(max-width: 960px) 100vw, 760px"):
    return ('<img%s src="/img/%s-sm.webp" srcset="/img/%s-sm.webp 900w, /img/%s.webp 1920w" sizes="%s" '
            'width="%d" height="%d"%s alt="%s">') % (
        ' class="%s"' % cls if cls else "", name, name, name, sizes, w, h,
        "" if eager else ' loading="lazy"', esc(alt))


def page(*, lang, path, title, desc, h1, eyebrow, lead, hero, hero_alt, body, crumbs,
         related=(), schema=(), aside_links=(), date=None, alternates=None, keywords=None):
    t = T[lang]
    url = SITE + path
    home = "/" if lang == "it" else "/en/"
    nav = "\n".join('      <a href="%s">%s</a>' % (h, l) for l, h in t["nav"])
    crumb_html = " <span aria-hidden=\"true\">/</span> ".join(
        '<a href="%s">%s</a>' % (h, esc(l)) if h else '<span>%s</span>' % esc(l) for l, h in crumbs)

    bc = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": l, "item": SITE + (h or path)}
        for i, (l, h) in enumerate(crumbs)]}
    graph = [bc] + list(schema)
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)

    alt_links = ""
    if alternates:
        alt_links = "\n".join('<link rel="alternate" hreflang="%s" href="%s">' % (k, SITE + v)
                              for k, v in alternates.items()) + "\n"

    rel = ""
    if related:
        cards = "\n".join(
            '      <a class="card" href="%s">%s<div><span class="eyebrow">%s</span><h3>%s</h3><p>%s</p></div></a>'
            % (h, img(im, ti, sizes="(max-width: 860px) 100vw, 380px"), esc(ey), esc(ti), esc(tx))
            for h, im, ey, ti, tx in related)
        rel = '''<section class="section alt" aria-labelledby="h-rel">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-rel">%s</h2></div>
    <div class="cards">
%s
    </div>
  </div>
</section>
''' % (t["related"], cards)

    links = "\n".join('        <a href="%s">%s</a>' % (h, esc(l)) for l, h in aside_links)
    meta_date = '<p class="meta">%s %s</p>\n' % (t["updated"], date) if date else ""

    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
{('<meta name="keywords" content="%s">' % esc(keywords)) if keywords else ''}
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
{alt_links}<meta property="og:type" content="{'article' if date else 'website'}">
<meta property="og:locale" content="{'it_IT' if lang == 'it' else 'en_GB'}">
<meta property="og:site_name" content="Tenuta Colle delle Rose">
<meta property="og:title" content="{esc(h1)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/img/{hero}.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#18201b">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
<a class="skip" href="#main">{t['skip']}</a>

<header class="site-head">
  <div class="wrap">
    <a class="brand" href="{home}">
      <b>Colle delle Rose</b>
      <span>{t['brand_sub']}</span>
    </a>
    <nav class="nav" aria-label="Menu">
{nav}
      <a class="lang" href="{t['lang_href']}" hreflang="{'en' if lang == 'it' else 'it'}">{t['lang_label']}</a>
      <a class="btn btn-primary" href="{t['cta_href']}">{t['cta']}</a>
    </nav>
  </div>
</header>

<main id="main">
<section class="page-hero" aria-labelledby="h1">
  {img(hero, hero_alt, 1920, 1080, eager=True, sizes="100vw")}
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">{crumb_html}</nav>
    <p class="eyebrow">{eyebrow}</p>
    <h1 id="h1">{h1}</h1>
    <p class="lead">{lead}</p>
  </div>
</section>

<section class="section">
  <div class="wrap article">
    <article class="body">
{meta_date}{body}
    </article>
    <aside class="aside">
      <div class="aside-card">
        {img("tenuta-riano-viale-ulivi-drone", t["aside_title"], sizes="300px")}
        <b>{t['aside_title']}</b>
        <p>{t['aside_text']}</p>
        <span class="price">{t['aside_price']}</span>
        <a class="btn btn-primary" href="{home}">{t['aside_btn']}</a>
        <a class="btn btn-ghost" style="color:var(--night-fg)" href="https://wa.me/{WA}">{t['aside_wa']}</a>
      </div>
      <nav class="aside-links" aria-label="{t['guide']}">
{links}
      </nav>
    </aside>
  </div>
</section>

{rel}
<section class="cta-band">
  <div class="wrap">
    <h2>{t['band']}</h2>
    <div class="hero-actions">
      <a class="btn btn-primary" href="{t['cta_href']}">{t['band_btn']}</a>
      <a class="btn btn-ghost" href="tel:+393517048540">{PHONE}</a>
    </div>
  </div>
</section>
</main>

<footer class="site-foot">
  <div class="wrap">
    <span>© 2026 Tenuta Colle delle Rose · Riano (RM) · {t['foot']}</span>
    <span class="foot-links"><a href="mailto:{EMAIL}">{EMAIL}</a><a href="/guida/">{T['it']['guide']}</a><a href="/privacy">{t['privacy']}</a></span>
  </div>
</footer>

<div class="mobile-cta">
  <a class="btn btn-ghost" href="https://wa.me/{WA}">WhatsApp</a>
  <a class="btn btn-primary" href="{t['cta_href']}">{t['cta']}</a>
</div>
<script src="/assets/main.js" defer></script>
</body>
</html>
'''
