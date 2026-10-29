"""Rigenera sitemap.xml e la lista guide di llms.txt dai file HTML presenti."""
import glob, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SITE = "https://www.tenutacolledellerose.it"
PAIRS = {"/": "/en/", "/guida/vivere-a-roma-con-la-natura-intorno": "/en/guide/moving-to-italy-countryside-near-rome"}
PAIRS.update({v: k for k, v in list(PAIRS.items())})
def url(f):
    u = "/" + f[:-5]
    if u.endswith("/index"): u = u[:-5]
    return "/" if u == "/index" else u
files = sorted(f for f in glob.glob("**/*.html", recursive=True) if not f.startswith(("_build", "dossier", "marketing")))
prio = lambda u: "1.0" if u == "/" else "0.9" if u in ("/en/",) else "0.8" if u.count("/") == 1 or u.startswith("/en/agri") else "0.2" if u == "/privacy" else "0.6"
out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for f in files:
    u = url(f)
    out.append("  <url>\n    <loc>%s%s</loc>\n    <lastmod>2026-10-29</lastmod>\n    <priority>%s</priority>" % (SITE, u, prio(u)))
    if u in PAIRS:
        it, en = (u, PAIRS[u]) if not u.startswith("/en/") else (PAIRS[u], u)
        out.append('    <xhtml:link rel="alternate" hreflang="it" href="%s%s"/>\n    <xhtml:link rel="alternate" hreflang="en" href="%s%s"/>' % (SITE, it, SITE, en))
    out.append("  </url>")
out.append("</urlset>")
open("sitemap.xml", "w").write("\n".join(out) + "\n")
# llms.txt: lista guide
lines = []
for f in files:
    if f.startswith(("guida/", "en/guide/")) and not f.endswith("index.html"):
        t = re.search(r"<h1[^>]*>(.*?)</h1>", open(f).read(), re.S).group(1)
        lines.append("- [%s](%s%s)" % (t, SITE, url(f)))
s = open("llms.txt").read()
i, j = s.index("## Guide"), s.index("## Contatti")
open("llms.txt", "w").write(s[:i] + "## Guide\n" + "\n".join(lines) + "\n\n" + s[j:])
print(len(files), "url;", len(lines), "guide")
