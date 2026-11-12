#!/usr/bin/env python3
"""
Genera gli asset della firma email (assets/firma/).

Vincoli della posta, che spiegano quasi ogni scelta qui dentro:

- L'unica animazione che passa ovunque e' la GIF: CSS e SVG animati li
  tolgono tutti i client seri.
- Outlook per Windows disegna il PRIMO fotogramma e si ferma li'. Quindi il
  fotogramma 1 e' sempre la composizione finita: l'animazione e' una luce
  che passa su un disegno gia' completo, non un disegno che si costruisce.
  Chi ha Outlook vede una grafica statica corretta, non un lavoro a meta'.
- La GIF non ha trasparenza vera (solo 1 bit), e un filo di un pixel con
  bordo seghettato si vede. Per questo il fondo e' opaco, dell'avorio
  esatto della scheda: e' la scheda a permettere il trucco.
- Gli asset sono in doppia risoluzione e vengono mostrati a meta': sugli
  schermi retina, dove si legge la posta, restano nitidi.

Tavolozza ristretta e niente sfumature continue: la GIF ha 256 colori e le
sfumature si impastano. Qui bastano otto tinte e il file resta leggero.

Uso:  python3.13 _build_firma.py
"""
import os

from PIL import Image, ImageDraw

OUT = "assets/firma"
FOTO = "assets/img/ritratto.jpg"

# Palette del sito (home.css)
AVORIO = (247, 246, 242)
INCHIOSTRO = (18, 18, 18)
BRONZO = (138, 111, 78)
LINEA = (222, 219, 211)
GRAFITE = (138, 135, 127)   # inchiostro schiarito: quattro fili a tutto
                            # inchiostro peserebbero troppo accanto al testo

SS = 4   # supersampling: si disegna in grande e si rimpicciolisce


def tela(w, h, colore=AVORIO):
    return Image.new("RGB", (w, h), colore)


def maschera(w, h):
    return Image.new("L", (w * SS, h * SS), 0)


def giu(m, w, h):
    return m.resize((w, h), Image.LANCZOS)


def tinta(base, m, colore):
    """Posa `colore` su `base` usando `m` come copertura."""
    base.paste(Image.new("RGB", base.size, colore), (0, 0), m)


def morbido(t):
    """Smoothstep: parte e arriva senza spigoli."""
    return t * t * (3 - 2 * t)


# ─────────────────────────────────────────────────────────── avatar

def avatar(lato=156):
    """Ritratto circolare su disco inchiostro, dentro un quadrato avorio.

    Il cerchio e' cotto nel PNG invece di essere fatto con border-radius:
    Outlook ignora border-radius e mostrerebbe un quadrato. Gli angoli sono
    dell'avorio della scheda, quindi spariscono dentro di essa.
    """
    im = Image.open(FOTO).convert("RGB").crop((215, 70, 645, 500))
    im = im.resize((lato * SS, lato * SS), Image.LANCZOS)

    tondo = maschera(lato, lato)
    d = ImageDraw.Draw(tondo)
    bordo = 3 * SS                      # il filo di bronzo attorno
    d.ellipse([0, 0, lato * SS - 1, lato * SS - 1], fill=255)

    fuori = tela(lato, lato)
    fuori.paste(im.resize((lato, lato), Image.LANCZOS), (0, 0),
                giu(tondo, lato, lato))

    anello = maschera(lato, lato)
    da = ImageDraw.Draw(anello)
    da.ellipse([bordo // 2, bordo // 2, lato * SS - 1 - bordo // 2,
                lato * SS - 1 - bordo // 2], outline=255, width=bordo)
    tinta(fuori, giu(anello, lato, lato), BRONZO)

    fuori.save(f"{OUT}/firma-avatar.png")
    print("firma-avatar.png", fuori.size)


# ─────────────────────────────────────────── banda "allineamento"

W, H = 880, 88          # mostrata a 440x44
CY = H // 2
PARTENZE = (19, 35, 53, 69)
X_DRITTO, X_NODO, X_FINE = 170, 410, 800
X_MARCHIO, SCALA_MARCHIO = 824, 0.56     # il marchio chiude la banda


def _fili():
    """I quattro fili che convergono, piu' la spina di bronzo."""
    m = maschera(W, H)
    d = ImageDraw.Draw(m)
    for y0 in PARTENZE:
        punti = [(0, y0), (X_DRITTO, y0)]
        for i in range(1, 41):
            t = i / 40
            punti.append((X_DRITTO + t * (X_NODO - X_DRITTO),
                          y0 + (CY - y0) * morbido(t)))
        d.line([(x * SS, y * SS) for x, y in punti], fill=255,
               width=int(1.6 * SS), joint="curve")
    fili = giu(m, W, H)

    # I fili nascono dal nulla invece che dal bordo tagliato.
    sfuma = Image.new("L", (W, H), 255)
    ds = ImageDraw.Draw(sfuma)
    for x in range(0, 150):
        ds.line([(x, 0), (x, H)], fill=int(255 * morbido(x / 150)))
    fili = Image.composite(fili, Image.new("L", (W, H), 0), sfuma)

    m2 = maschera(W, H)
    d2 = ImageDraw.Draw(m2)
    d2.line([(X_NODO * SS, CY * SS), (X_FINE * SS, CY * SS)], fill=255,
            width=int(3.0 * SS))
    d2.ellipse([(X_NODO - 4.5) * SS, (CY - 4.5) * SS,
                (X_NODO + 4.5) * SS, (CY + 4.5) * SS], fill=255)
    _fusto_banda(d2)

    mk = maschera(W, H)
    _bracci_banda(ImageDraw.Draw(mk))
    return fili, giu(m2, W, H), giu(mk, W, H)


def _posa_marchio():
    """Il simbolo su griglia 100, portato dove va dentro la banda.

    Sta nella stessa immagine della riga, non accanto come file a parte:
    cosi' rimpicciolisce insieme a lei invece di restare fisso e
    sovrastarla sugli schermi stretti, e il filo di bronzo lo raggiunge
    sempre alla stessa distanza.
    """
    s = SCALA_MARCHIO
    x0 = X_MARCHIO - 15 * s
    y0 = CY - 93 * s / 2 - 4 * s
    return (lambda px, py: ((x0 + px * s) * SS, (y0 + py * s) * SS)), s


def _bracci_banda(d):
    p, s = _posa_marchio()
    for a in ((18, 94), (82, 94)):
        d.line([p(*a), p(50, 56)], fill=255, width=int(6 * s * SS))
    for q in ((18, 94), (82, 94), (50, 56)):
        x, y = p(*q)
        r = 3 * s * SS
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)


def _fusto_banda(d):
    p, s = _posa_marchio()
    d.line([p(50, 56), p(50, 8)], fill=255, width=int(8 * s * SS))
    for q in ((50, 56), (50, 8)):
        x, y = p(*q)
        r = 4 * s * SS
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)


def banda():
    fili, spina, bracci = _fili()

    fermo = tela(W, H)
    tinta(fermo, fili, GRAFITE)
    tinta(fermo, bracci, INCHIOSTRO)
    tinta(fermo, spina, BRONZO)

    # La luce che corre: un nodo scuro con una scia corta che si spegne
    # dentro il bronzo della riga. Le tinte non salgono mai sopra il bronzo:
    # un eco piu' chiaro della riga sembrerebbe un buco, non un riflesso.
    echi = [(0, (74, 56, 36), 4.6), (6, (90, 69, 46), 4.3),
            (12, (106, 83, 56), 3.9), (18, (119, 94, 65), 3.5),
            (24, (130, 104, 73), 3.1), (30, BRONZO, 2.7)]

    frames = [fermo]                      # fotogramma 1: disegno finito
    durate = [1800]                       # e una lunga pausa prima di partire
    PASSI = 26
    for i in range(PASSI):
        t = morbido(i / (PASSI - 1))
        testa = X_NODO + t * (X_FINE - X_NODO)
        f = fermo.copy()
        d = ImageDraw.Draw(f)
        for dietro, colore, r in reversed(echi):
            x = testa - dietro
            if x <= X_NODO:
                continue
            # verso la fine la luce si spegne invece di sbattere sul bordo
            if t > 0.8 and dietro == 0:
                r *= 1 - (t - 0.8) / 0.2 * 0.6
            d.ellipse([x - r, CY - r, x + r, CY + r], fill=colore)
        frames.append(f)
        durate.append(45)

    salva_gif(frames, durate, f"{OUT}/firma-allineamento.gif",
              [GRAFITE, BRONZO, INCHIOSTRO] + [c for _, c, _ in echi])


# ──────────────────────────────────────────────────────────── uscita

def tavolozza(tinte, passi=10):
    """Tavolozza fissa: l'avorio esatto piu' una rampa verso ogni tinta.

    Serve perche' la quantizzazione automatica sposta il fondo di un paio
    di punti, e un fondo quasi-avorio dentro una scheda avorio si vede
    come un rettangolo. Qui l'avorio e' il primo colore e resta esatto,
    e le rampe coprono i bordi sfumati senza retinatura.
    """
    colori = [AVORIO]
    for c in tinte:
        for i in range(1, passi + 1):
            t = i / passi
            colori.append(tuple(round(AVORIO[k] + (c[k] - AVORIO[k]) * t)
                                for k in range(3)))
    p = Image.new("P", (1, 1))
    dati = [v for c in colori[:256] for v in c]
    p.putpalette(dati + [0] * (768 - len(dati)))
    return p


def salva_gif(frames, durate, path, tinte):
    tav = tavolozza(tinte)
    q = [f.quantize(palette=tav, dither=Image.NONE) for f in frames]
    q[0].save(path, save_all=True, append_images=q[1:], duration=durate,
              loop=0, optimize=True, disposal=1)
    fondo = Image.open(path).convert("RGB").getpixel((1, 1))
    assert fondo == AVORIO, f"{path}: fondo {fondo}, atteso {AVORIO}"
    kb = os.path.getsize(path) / 1024
    print(f"{path.split('/')[-1]}  {q[0].size}  {len(q)} fotogrammi  {kb:.0f} KB")


def pagina():
    """Cuce la firma dentro /firma, la pagina da cui si copia.

    Una sola fonte: il sorgente della firma sta in un file solo e la
    pagina lo ospita, cosi' non esistono due versioni che divergono.
    """
    firma = open(f"{OUT}/firma.html", encoding="utf-8").read().strip()
    pag = open("firma.html", encoding="utf-8").read()
    a = pag.index("<!--FIRMA-->")
    b = pag.index("<!--/FIRMA-->") if "<!--/FIRMA-->" in pag else a + len("<!--FIRMA-->")
    pag = pag[:a] + "<!--FIRMA-->\n" + firma + "\n<!--/FIRMA-->" + pag[b + (len("<!--/FIRMA-->") if "<!--/FIRMA-->" in pag else 0):]
    open("firma.html", "w", encoding="utf-8").write(pag)
    print("firma.html  pagina aggiornata")


def main():
    os.makedirs(OUT, exist_ok=True)
    avatar()
    banda()
    pagina()


if __name__ == "__main__":
    main()
