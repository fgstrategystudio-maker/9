#!/usr/bin/env python3
"""
Replace logo marquee section with two-row version + industry tags + formation subsection.
Updates index.html (IT), en/index.html, pt/index.html.
"""

GF = "https://www.google.com/s2/favicons?domain={}&sz=128"

# ── Companies ──────────────────────────────────────────────────────────────────

ROW1 = [  # existing
    {"name": "L'Assistedile Group Brasil", "domain": "lassistedilegroupbrasil.com.br", "url": "https://lassistedilegroupbrasil.com.br/"},
    {"name": "Moshe 3000",      "domain": "moshe3000.com",          "url": "https://moshe3000.com/"},
    {"name": "Aria Tattoo Lab", "domain": "ariatattoolab.com",      "url": "https://www.ariatattoolab.com/"},
    {"name": "Totale.one",      "domain": "totale.one",             "url": "https://www.totale.one/"},
    {"name": "Welyk",           "domain": "welyk.tech",             "url": "https://welyk.tech/"},
    {"name": "Ospita.re",       "domain": "ospita.re",              "url": "https://landing.ospita.re/venditori-1/"},
    {"name": "Dropper.ai",      "domain": "dropper.ai",             "url": "https://www.dropper.ai/"},
    {"name": "Mangrovia.shop",  "domain": "mangroviashop.com",      "url": "https://mangroviashop.com/"},
    {"name": "Santaniello",     "domain": "biagiosantaniello.com",  "url": "https://biagiosantaniello.com/"},
    {"name": "Torripa Group",   "domain": "torripagroup.com",       "url": "https://www.torripagroup.com/en/homepage/"},
    {"name": "Liquinvex",       "domain": "liquinvex.com",          "url": "https://www.liquinvex.com/"},
    {"name": "Cyclando",        "domain": "cyclando.com",           "url": "https://cyclando.com/en/"},
]

ROW2 = [  # new (Fabio Lenci removed; Homever uses local logo file)
    {"name": "Deply",             "domain": "deply.it",               "url": "https://deply.it/"},
    {"name": "PMI Doctors",       "domain": "pmidoctors.it",          "url": "https://pmidoctors.it/"},
    {"name": "Daplace Group",     "domain": "staydaplace.com",        "url": "https://staydaplace.com/"},
    {"name": "Studio Polpo",      "domain": "studiopolpo.it",         "url": "https://studiopolpo.it/"},
    {"name": "ProntoPro",         "domain": "prontopro.it",           "url": "https://prontopro.it/"},
    {"name": "CTE Roma",          "domain": "cteroma.it",             "url": "https://cteroma.it/"},
    {"name": "Peekaboo",          "domain": "peekaboovision.com",     "url": "https://peekaboovision.com/"},
    {"name": "Homever",           "domain": None,                     "url": None,  "img": "homever-logo.webp"},
    {"name": "Atlantide Video",   "domain": "atlantidevideo.it",      "url": "https://atlantidevideo.it/"},
    {"name": "Grano Trattoria",   "domain": "granotrattoria.com",     "url": "https://granotrattoria.com/"},
    {"name": "Garibaldi dal 1970","domain": "garibaldidal1970.com",   "url": "https://garibaldidal1970.com/"},
    {"name": "Zest Group",        "domain": "zestgroup.vc",           "url": "https://zestgroup.vc/"},
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def esc(s):
    return s.replace("'", "&#x27;")

def initials(name):
    words = name.split()
    return "".join(w[0] for w in words[:2]).upper()

def chip(co, img_prefix=""):
    name = esc(co["name"])
    if co.get("img"):
        src = img_prefix + co["img"]
        img = f'<img src="{src}" alt="{name}" width="48" height="48" loading="lazy" />'
    elif co.get("domain"):
        img = f'<img src="{GF.format(co["domain"])}" alt="{name}" width="48" height="48" loading="lazy" />'
    else:
        ini = initials(co["name"])
        img = f'<span class="chip-initials">{ini}</span>'
    domain_span = f'<span>{co["domain"]}</span>' if co.get("domain") else '<span></span>'
    inner = f'{img}<strong>{name}</strong>{domain_span}'
    if co.get("url"):
        return f'<a class="logo-chip" href="{co["url"]}" target="_blank" rel="noreferrer noopener">{inner}</a>'
    return f'<div class="logo-chip">{inner}</div>'

def track(companies, img_prefix=""):
    chips = "\n        ".join(chip(c, img_prefix) for c in companies)
    # duplicate for seamless loop
    return f"        {chips}\n        {chips}"

# ── Formation logos HTML ───────────────────────────────────────────────────────

FORMATION_LOGOS = (
    '<div class="formation-logos">'
    '<a href="https://zestgroup.vc/" target="_blank" rel="noreferrer noopener" class="formation-logo-chip">'
    f'<img src="{GF.format("zestgroup.vc")}" alt="Zest Group" width="32" height="32" loading="lazy" />'
    '<span>Zest Group</span></a>'
    '<a href="https://startupwiseguys.com/" target="_blank" rel="noreferrer noopener" class="formation-logo-chip">'
    f'<img src="{GF.format("startupwiseguys.com")}" alt="Startup Wise Guys" width="32" height="32" loading="lazy" />'
    '<span>Startup Wise Guys</span></a>'
    '</div>'
)

# ── Per-language content ───────────────────────────────────────────────────────

INDUSTRIES = {
    "it": [
        "Edilizia & Real Estate", "Food & Ristorazione", "Hospitality & Travel",
        "Startup & Innovation", "Marketplace", "Healthcare",
        "Creatività & Design", "Finance & Investimenti", "SaaS & Tech",
        "Comunicazione & Media", "E-commerce & Retail", "Fashion & Lusso",
        "Sport & Outdoor", "Consulenza", "Pubblica Amministrazione",
    ],
    "en": [
        "Construction & Real Estate", "Food & Restaurants", "Hospitality & Travel",
        "Startup & Innovation", "Marketplace", "Healthcare",
        "Creativity & Design", "Finance & Investments", "SaaS & Tech",
        "Media & Communication", "E-commerce & Retail", "Fashion & Luxury",
        "Sport & Outdoor", "Consulting", "Public Administration",
    ],
    "pt": [
        "Construção & Imóveis", "Alimentação & Restauração", "Hospitalidade & Viagens",
        "Startup & Inovação", "Marketplace", "Saúde",
        "Criatividade & Design", "Finanças & Investimentos", "SaaS & Tech",
        "Comunicação & Mídia", "E-commerce & Varejo", "Moda & Luxo",
        "Esporte & Outdoor", "Consultoria", "Administração Pública",
    ],
}

TEXTS = {
    "it": {
        "section_title": "Esperienze su progetti diversi",
        "h2": "Brand, aziende e piattaforme con cui ho lavorato nel tempo.",
        "copy": "Una selezione di contesti tra edilizia, hospitality, startup, SaaS, marketplace, servizi creativi e progetti digitali.",
        "row1_label": "Aziende e brand — riga 1",
        "row2_label": "Aziende e brand — riga 2",
        "industries_title": "Settori",
        "formation_title": "Ecosistema Startup & Formazione",
        "formation_text": (
            "Mi sono formato ed ho collaborato con realtà che accelerano il tessuto imprenditoriale "
            "nazionale ed internazionale come "
            '<a href="https://zestgroup.vc/" target="_blank" rel="noreferrer noopener"><strong>Zest Group</strong></a>, '
            "fondo di venture capital e acceleratore per startup italiane, e "
            '<a href="https://startupwiseguys.com/" target="_blank" rel="noreferrer noopener"><strong>Startup Wise Guys</strong></a>, '
            "uno dei principali acceleratori europei B2B e SaaS."
        ),
    },
    "en": {
        "section_title": "Experience across different projects",
        "h2": "Brands, companies and platforms I've worked with over the years.",
        "copy": "A selection of contexts spanning construction, hospitality, startups, SaaS, marketplaces, creative services and digital projects.",
        "row1_label": "Companies and brands — row 1",
        "row2_label": "Companies and brands — row 2",
        "industries_title": "Industries",
        "formation_title": "Startup & Training Ecosystem",
        "formation_text": (
            "I trained and worked with organisations that accelerate national and international "
            "entrepreneurship like "
            '<a href="https://zestgroup.vc/" target="_blank" rel="noreferrer noopener"><strong>Zest Group</strong></a>, '
            "a venture capital fund and accelerator for Italian startups, and "
            '<a href="https://startupwiseguys.com/" target="_blank" rel="noreferrer noopener"><strong>Startup Wise Guys</strong></a>, '
            "one of Europe's leading B2B and SaaS accelerators."
        ),
    },
    "pt": {
        "section_title": "Experiência em projetos variados",
        "h2": "Marcas, empresas e plataformas com quem trabalhei ao longo dos anos.",
        "copy": "Uma seleção de contextos entre construção, hospitalidade, startups, SaaS, marketplaces, serviços criativos e projetos digitais.",
        "row1_label": "Empresas e marcas — linha 1",
        "row2_label": "Empresas e marcas — linha 2",
        "industries_title": "Setores",
        "formation_title": "Ecossistema Startup & Formação",
        "formation_text": (
            "Me formei e colaborei com organizações que aceleram o empreendedorismo nacional e "
            "internacional como "
            '<a href="https://zestgroup.vc/" target="_blank" rel="noreferrer noopener"><strong>Zest Group</strong></a>, '
            "fundo de venture capital e aceleradora de startups italianas, e "
            '<a href="https://startupwiseguys.com/" target="_blank" rel="noreferrer noopener"><strong>Startup Wise Guys</strong></a>, '
            "uma das principais aceleradoras europeias B2B e SaaS."
        ),
    },
}

# ── Section builder ────────────────────────────────────────────────────────────

def build_section(lang, img_prefix=""):
    t = TEXTS[lang]
    inds = INDUSTRIES[lang]
    ind_tags = "\n      ".join(f'<span class="industry-tag">{i}</span>' for i in inds)
    row1 = track(ROW1, img_prefix)
    row2 = track(ROW2, img_prefix)
    return f"""<section class="section">
  <div class="container">
    <div class="logo-marquee-header">
      <p class="section-title">{t["section_title"]}</p>
      <h2>{t["h2"]}</h2>
      <div class="industry-tags-wrap">
      {ind_tags}
      </div>
    </div>

    <div class="logo-marquee-grid">
      <div class="logo-marquee logo-marquee--fwd" aria-label="{t["row1_label"]}">
        <div class="logo-track">
{row1}
        </div>
      </div>
      <div class="logo-marquee logo-marquee--rev" aria-label="{t["row2_label"]}">
        <div class="logo-track">
{row2}
        </div>
      </div>
    </div>

    <div class="formation-box">
      <p class="section-title">{t["formation_title"]}</p>
      <p class="formation-text">{t["formation_text"]}</p>
      {FORMATION_LOGOS}
    </div>
  </div>
</section>"""

# ── Apply to HTML files ────────────────────────────────────────────────────────

FILES = [
    ("/home/user/9/index.html",    "it", ""),
    ("/home/user/9/en/index.html", "en", "../"),
    ("/home/user/9/pt/index.html", "pt", "../"),
]

SECTION_START = '<section class="section">\n  <div class="container">\n    <div class="logo-marquee-header">'

for path, lang, img_prefix in FILES:
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()

    s = c.find(SECTION_START)
    if s == -1:
        print(f"SKIP (not found): {path}")
        continue

    e = c.find("</section>", s) + len("</section>")
    new_section = build_section(lang, img_prefix)
    c2 = c[:s] + new_section + c[e:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(c2)
    print(f"OK: {path}  ({len(c)} → {len(c2)} chars)")

print("Done.")
