#!/usr/bin/env python3
"""
Porta il payoff "Allineati per crescere" nel footer di tutto il sito, e
allinea alla stessa formula i file del marchio.

Perche' il footer: il posto canonico di un payoff e' accanto al marchio,
e nell'intestazione non c'e' spazio (logo, menu a tendina, lingue e
pulsante contatti stanno gia' stretti). Nell'hero sarebbe un doppione:
il titolo dice gia' "allineati per far crescere la tua azienda". Il
footer e' l'altro posto dove un payoff sta di casa, ed e' su tutte le
pagine.

I file del marchio portavano "Allineare per crescere", all'infinito:
due versioni della stessa frase. Qui si tiene quella del proprietario.

Idempotente: si puo' rilanciare.

Uso:  python3.13 _build_payoff.py
"""
import glob

VECCHIO = "Allineare per crescere"
NUOVO = "Allineati per crescere"

# L'ancora e' la riga del marchio nel footer, che esiste in quattro
# versioni, una per lingua. Il payoff segue la stessa lingua: le altre
# tre riprendono la formula gia' usata nei titoli di quelle home.
FOOTER = [
    ("<span>Francesco Gizzi · Marketing · Data · Sales · Strategy · Roma · Milano</span>",
     "Allineati per crescere"),
    ("<span>Francesco Gizzi · Marketing · Data · Sales · Strategy · Rome · Milan</span>",
     "Aligned to grow"),
    ("<span>Francesco Gizzi · Marketing · Data · Sales · Strategy · Roma · Milão</span>",
     "Alinhados para crescer"),
    ("<span>Francesco Gizzi · Marketing · Data · Sales · Strategy · Roma · Milán</span>",
     "Alineados para crecer"),
]

CSS = {
    "home.css": (
        "footer.foot a:hover { color: var(--ink); }",
        "\nfooter.foot .payoff { display: block; margin-top: 7px; color: var(--accent); }"),
    "site.css": (
        ".sitefoot a:hover { color: var(--av-ink) !important; }",
        "\n.sitefoot .payoff { display: block; margin-top: 7px; color: var(--av-accent) !important; }"),
}


def pagine():
    fatte = 0
    for f in glob.glob("**/*.html", recursive=True):
        if f.startswith(("dashboard/", "backups/", "node_modules/")):
            continue
        s = open(f, encoding="utf-8").read()
        o = s
        for ancora, testo in FOOTER:
            if ancora in s:
                s = s.replace(ancora, ancora.replace(
                    "</span>", f'<span class="payoff">{testo}</span></span>'), 1)
        # i file del marchio dicevano la stessa cosa in un altro modo
        s = s.replace(VECCHIO, NUOVO)
        if s != o:
            open(f, "w", encoding="utf-8").write(s)
            fatte += 1
    print(f"pagine: {fatte}")


def stili():
    for f, (ancora, regola) in CSS.items():
        s = open(f, encoding="utf-8").read()
        if ".payoff" in s:
            continue
        assert ancora in s, f"{f}: ancora non trovata"
        open(f, "w", encoding="utf-8").write(s.replace(ancora, ancora + regola, 1))
        print(f, "ok")


def marchio():
    n = 0
    for f in glob.glob("assets/brand/*"):
        if not f.endswith((".svg", ".txt")):
            continue
        s = open(f, encoding="utf-8").read()
        if VECCHIO in s:
            open(f, "w", encoding="utf-8").write(s.replace(VECCHIO, NUOVO))
            n += 1
    print(f"file del marchio: {n}")


if __name__ == "__main__":
    pagine()
    stili()
    marchio()
