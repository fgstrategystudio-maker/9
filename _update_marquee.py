#!/usr/bin/env python3
"""
Replace logo marquee section: two logo rows + third slow sector-tag row.
Updates index.html (IT), en/index.html, pt/index.html.
"""

GF = "https://www.google.com/s2/favicons?domain={}&sz=128"

# ── Companies ──────────────────────────────────────────────────────────────────

ROW1 = [
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

ROW2 = [
    {"name": "Deply",             "domain": "deply.it",               "url": "https://deply.it/"},
    {"name": "PMI Doctors",       "domain": "pmidoctors.it",          "url": "https://pmidoctors.it/"},
    {"name": "Daplace Group",     "domain": "staydaplace.com",        "url": "https://staydaplace.com/"},
    {"name": "Studio Polpo",      "domain": "studiopolpo.it",         "url": "https://studiopolpo.it/"},
    {"name": "ProntoPro",         "domain": "prontopro.it",           "url": "https://prontopro.it/"},
    {"name": "CTE Roma",          "domain": "cteroma.it",             "url": "https://cteroma.it/"},
    {"name": "Peekaboo",          "domain": "peekaboovision.com",     "url": "https://peekaboovision.com/"},
    {"name": "Homever",           "domain": None,                     "url": None, "img": "homever-logo.webp"},
    {"name": "Atlantide Video",   "domain": "atlantidevideo.it",      "url": "https://atlantidevideo.it/"},
    {"name": "Grano Trattoria",   "domain": "granotrattoria.com",     "url": "https://granotrattoria.com/"},
    {"name": "Garibaldi dal 1970","domain": "garibaldidal1970.com",   "url": "https://garibaldidal1970.com/"},
    {"name": "Zest Group",        "domain": "zestgroup.vc",           "url": "https://zestgroup.vc/"},
]

SECTORS = {
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

# ── Helpers ────────────────────────────────────────────────────────────────────

def esc(s):
    return s.replace("'", "&#x27;")

def initials(name):
    return "".join(w[0] for w in name.split()[:2]).upper()

def logo_chip(co, img_prefix=""):
    name = esc(co["name"])
    if co.get("img"):
        img = f'<img src="{img_prefix}{co["img"]}" alt="{name}" width="48" height="48" loading="lazy" />'
    elif co.get("domain"):
        img = f'<img src="{GF.format(co["domain"])}" alt="{name}" width="48" height="48" loading="lazy" />'
    else:
        img = f'<span class="chip-initials">{initials(co["name"])}</span>'
    domain_span = f'<span>{co["domain"]}</span>' if co.get("domain") else '<span></span>'
    inner = f'{img}<strong>{name}</strong>{domain_span}'
    if co.get("url"):
        return f'<a class="logo-chip" href="{co["url"]}" target="_blank" rel="noreferrer noopener">{inner}</a>'
    return f'<div class="logo-chip">{inner}</div>'

def logo_track(companies, img_prefix=""):
    chips = "\n        ".join(logo_chip(c, img_prefix) for c in companies)
    return f"        {chips}\n        {chips}"

def sector_track(sectors):
    chips = "\n        ".join(f'<span class="sector-chip">{s}</span>' for s in sectors)
    return f"        {chips}\n        {chips}"

# ── Formation logos ────────────────────────────────────────────────────────────

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

# ── Per-language text ──────────────────────────────────────────────────────────

TEXTS = {
    "it": {
        "section_title": "Esperienze su progetti diversi",
        "h2": "Brand, aziende e piattaforme con cui ho lavorato nel tempo.",
        "row1_label": "Aziende e brand — riga 1",
        "row2_label": "Aziende e brand — riga 2",
        "row3_label": "Settori",
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
        "row1_label": "Companies and brands — row 1",
        "row2_label": "Companies and brands — row 2",
        "row3_label": "Industries",
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
        "row1_label": "Empresas e marcas — linha 1",
        "row2_label": "Empresas e marcas — linha 2",
        "row3_label": "Setores",
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
    row1 = logo_track(ROW1, img_prefix)
    row2 = logo_track(ROW2, img_prefix)
    row3 = sector_track(SECTORS[lang])
    return f"""<section class="section">
  <div class="container">
    <div class="logo-marquee-header">
      <p class="section-title">{t["section_title"]}</p>
      <h2>{t["h2"]}</h2>
    </div>

    <div class="logo-marquee-grid">
      <div class="logo-marquee logo-marquee--fwd" data-speed="1" aria-label="{t["row1_label"]}">
        <div class="logo-track">
{row1}
        </div>
      </div>
      <div class="logo-marquee logo-marquee--rev" data-speed="1" aria-label="{t["row2_label"]}">
        <div class="logo-track">
{row2}
        </div>
      </div>
    </div>

    <div class="logo-marquee logo-marquee--fwd sector-marquee" data-speed="0.45" aria-label="{t["row3_label"]}">
      <div class="logo-track sector-track">
{row3}
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
        print(f"SKIP: {path}")
        continue
    e = c.find("</section>", s) + len("</section>")
    c2 = c[:s] + build_section(lang, img_prefix) + c[e:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(c2)
    print(f"OK: {path}  ({len(c)} → {len(c2)} chars)")

print("Done.")
