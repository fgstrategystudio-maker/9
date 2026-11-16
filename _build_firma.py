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
- La GIF ha un solo bit di trasparenza: un pixel o e' pieno o e' vuoto,
  le mezze tinte non esistono. Un filo da un pixel e' quasi tutto bordo,
  e su fondo trasparente si sgrana in una fila di puntini. Per questo il
  fondo qui e' BIANCO OPACO: sul bianco della posta non si vede, e le
  linee restano sfumate e continue.
  Il prezzo si paga in tema scuro: Gmail inverte la luminosita'
  dell'immagine - per questo il bronzo resta bronzo e non diventa blu -
  e il bianco diventa nero, cioe' un pannello scuro appena visibile sul
  fondo della pagina. Nei client che non invertono resta chiaro. Si e'
  scelto cosi' perche' la posta si legge su fondo chiaro quasi sempre,
  e la versione trasparente sgranava le linee sempre.
  Per ridurre quel pannello i fotogrammi sono ritagliati al disegno.
- Gli asset sono in doppia risoluzione e vengono mostrati a meta': sugli
  schermi retina, dove si legge la posta, restano nitidi.

Uso:  python3.13 _build_firma.py
"""
import math
import os

from PIL import Image, ImageChops, ImageDraw

OUT = "assets/firma"
RITRATTO = "assets/img/ritratto.jpg"   # il ritratto pieno: le misure sotto sono sue

# Palette del sito (home.css)
FONDO = (255, 255, 255)     # bianco opaco: sul fondo della posta sparisce,
                            # e permette le mezze tinte che la trasparenza
                            # della GIF non consente (vedi in testa)
INCHIOSTRO = (18, 18, 18)
ARMATURA = (58, 54, 47)     # i bracci del marchio: scuri sul chiaro,
                            # ancora visibili sullo scuro
BRONZO = (138, 111, 78)
LINEA = (222, 219, 211)
GRAFITE = (108, 105, 97)
LAMPO = (58, 43, 27)        # il nodo quando le quattro correnti si uniscono
ACCESO = (96, 72, 43)       # il bronzo del marchio quando l'impulso arriva   # inchiostro schiarito: quattro fili a tutto
                            # inchiostro peserebbero troppo accanto al testo

SS = 4   # supersampling: si disegna in grande e si rimpicciolisce


def tela(w, h, colore=FONDO):
    return Image.new("RGB", (w, h), colore)


def maschera(w, h):
    return Image.new("L", (w * SS, h * SS), 0)


def giu(m, w, h):
    return m.resize((w, h), Image.LANCZOS)


def tinta(base, m, colore):
    """Posa `colore` su `base` usando `m` come copertura.

    La copertura e' graduale, non tutto-o-niente: senza le mezze tinte un
    filo da un pixel si sgrana. E' il motivo per cui il fondo e' opaco e
    non trasparente, spiegato in testa al file.
    """
    base.paste(Image.new("RGB", base.size, colore), (0, 0), m)


def morbido(t):
    """Smoothstep: parte e arriva senza spigoli."""
    return t * t * (3 - 2 * t)


# ─────────────────────────────────────────────────────────── avatar

# Misurati sul ritratto a 900x900, con una griglia sopra: l'asse del viso
# (meta' fra gli occhi) e le due quote della testa. Il tondo della firma
# precedente era tagliato con l'asse del viso 22px a sinistra del centro,
# e si vedeva. Qui il cerchio si costruisce da queste tre misure, invece
# che a occhio.
VISO_X, CRANIO, MENTO = 428, 50, 378
ARIA = 0.08          # quanta parte del cerchio resta sopra il cranio
TESTA = 0.60         # quanta parte del cerchio occupa la testa


def avatar(lato=108):
    """Il ritratto tondo della firma, col viso centrato e l'anello bronzo.

    Il cerchio e' centrato sull'asse del viso, non sul centro della foto:
    e' l'unica cosa che l'occhio verifica davvero in un'immagine tonda.
    In verticale la testa sta un po' sopra la meta', con le spalle sotto,
    come in un ritratto: il cranio a __ARIA__ dal bordo alto.

    L'anello e' nel bronzo del sito, non nell'oro della vecchia palette,
    che accanto al resto della firma stonava. Lo spessore resta quello di
    prima in proporzione: dieci pixel su un raggio di 240.

    Il cerchio e' cotto nel PNG invece di essere fatto con border-radius,
    che Outlook ignora mostrando un quadrato; gli angoli restano
    trasparenti, cosi' la scheda ci passa sotto.
    """
    D = (MENTO - CRANIO) / TESTA
    alto = CRANIO - ARIA * D
    taglio = (VISO_X - D / 2, alto, VISO_X + D / 2, alto + D)

    GRANDE = lato * SS
    spessore = round(GRANDE / 2 * 10 / 240)   # stesso rapporto dell'originale

    foto = Image.open(RITRATTO).convert("RGB")
    assert min(taglio) >= 0 and max(taglio) <= min(foto.size), \
        f"il cerchio esce dalla foto: {taglio}"
    foto = foto.crop([round(v) for v in taglio]).resize((GRANDE, GRANDE),
                                                        Image.LANCZOS)

    disco = Image.new("L", (GRANDE, GRANDE), 0)
    ImageDraw.Draw(disco).ellipse([spessore, spessore,
                                   GRANDE - 1 - spessore,
                                   GRANDE - 1 - spessore], fill=255)
    anello = Image.new("L", (GRANDE, GRANDE), 0)
    ImageDraw.Draw(anello).ellipse([spessore / 2, spessore / 2,
                                    GRANDE - 1 - spessore / 2,
                                    GRANDE - 1 - spessore / 2],
                                   outline=255, width=spessore)

    fuori = Image.new("RGBA", (GRANDE, GRANDE), (0, 0, 0, 0))
    fuori.paste(foto, (0, 0), disco)
    fuori.paste(Image.new("RGB", (GRANDE, GRANDE), BRONZO), (0, 0), anello)

    fuori = fuori.resize((lato, lato), Image.LANCZOS)
    fuori.save(f"{OUT}/firma-avatar.png")
    print("firma-avatar.png", fuori.size)


# ─────────────────────────────────────────── banda "allineamento"

W, H = 880, 88          # spazio di disegno
CY = H // 2
PARTENZE = (19, 35, 53, 69)
X_DRITTO, X_NODO, X_FINE = 170, 410, 800
X_MARCHIO, SCALA_MARCHIO = 822, 0.62     # il marchio chiude la banda


def _percorsi():
    """I quattro tracciati, punto per punto: servono anche all'animazione."""
    fuori = []
    for y0 in PARTENZE:
        punti = [(0, y0), (X_DRITTO, y0)]
        for i in range(1, 41):
            t = i / 40
            # Non smoothstep: quella arriva al centro con pendenza zero,
            # e i quattro fili restano appaiati per l'ultimo terzo,
            # fondendosi in una sbarra grigia invece di confluire. Questa
            # parte piatta e arriva in diagonale: si incontrano in un punto.
            punti.append((X_DRITTO + t * (X_NODO - X_DRITTO),
                          y0 + (CY - y0) * t ** 2))
        fuori.append(punti)
    return fuori


def _misure(punti):
    """Lunghezze cumulate lungo un tracciato."""
    L = [0.0]
    for (x1, y1), (x2, y2) in zip(punti, punti[1:]):
        L.append(L[-1] + math.hypot(x2 - x1, y2 - y1))
    return L


def _tratto(punti, L, a, b):
    """Il pezzo di tracciato fra le frazioni a e b della sua lunghezza.

    Si ritaglia per lunghezza e non per indice perche' i segmenti della
    curva non sono tutti uguali: andando per indice l'impulso rallenterebbe
    dove i punti sono fitti.
    """
    tot = L[-1]
    a, b = max(0.0, a) * tot, min(1.0, b) * tot
    if b <= a:
        return []
    fuori = []
    for i in range(len(punti) - 1):
        if L[i + 1] < a or L[i] > b:
            continue
        passo = L[i + 1] - L[i]
        if passo <= 0:
            continue
        (x1, y1), (x2, y2) = punti[i], punti[i + 1]
        t0 = max(0.0, (a - L[i]) / passo)
        t1 = min(1.0, (b - L[i]) / passo)
        if not fuori:
            fuori.append((x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0))
        fuori.append((x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1))
    return fuori


def _fitto(punti, L, passo=1.5):
    """Ridistribuisce i punti di un tracciato a distanza regolare."""
    tot = L[-1]
    n = max(2, int(tot / passo))
    fuori = []
    j = 0
    for i in range(n + 1):
        d = tot * i / n
        while j < len(L) - 2 and L[j + 1] < d:
            j += 1
        seg = L[j + 1] - L[j]
        t = 0 if seg <= 0 else (d - L[j]) / seg
        (x1, y1), (x2, y2) = punti[j], punti[j + 1]
        fuori.append((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t))
    return fuori


def _traccia(d, punti, L, da, a):
    """Disegna un tracciato con spessore che passa da `da` ad `a`.

    I quattro fili arrivano al nodo quasi sovrapposti. A spessore
    costante, e con le tinte piene che servono alla trasparenza, li'
    si fondono in un grumo grigio invece di confluire. Assottigliandoli
    mentre si avvicinano, la confluenza torna a leggersi.
    """
    fitti = _fitto(punti, L)
    for i, (x, y) in enumerate(fitti):
        t = i / (len(fitti) - 1)
        r = (da + (a - da) * t) / 2 * SS
        d.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r], fill=255)


def _sfumatura():
    """I fili nascono dal nulla invece che dal bordo tagliato."""
    s = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(s)
    for x in range(0, 150):
        d.line([(x, 0), (x, H)], fill=int(255 * morbido(x / 150)))
    return s


def _fili():
    """I quattro fili che convergono, piu' la spina di bronzo."""
    m = maschera(W, H)
    d = ImageDraw.Draw(m)
    for punti in _percorsi():
        _traccia(d, punti, _misure(punti), 2.1, 1.1)
    fili = Image.composite(giu(m, W, H), Image.new("L", (W, H), 0),
                           _sfumatura())

    m2 = maschera(W, H)
    d2 = ImageDraw.Draw(m2)
    d2.line([(X_NODO * SS, CY * SS), (X_FINE * SS, CY * SS)], fill=255,
            width=int(3.2 * SS))
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


def _fusto_banda(d, k=1.0):
    """Il fusto di bronzo del marchio. k lo ingrossa quando l'impulso arriva:
    a questa misura il fusto e' due pixel, e un cambio di sola tinta non si
    vedrebbe."""
    p, s = _posa_marchio()
    d.line([p(50, 56), p(50, 8)], fill=255, width=int(8 * k * s * SS))
    for q in ((50, 56), (50, 8)):
        x, y = p(*q)
        r = 4 * k * s * SS
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)


# L'impulso e' un pezzo di linea ridisegnato piu' scuro, non una pallina
# che ci scorre sopra: su un filo di un pixel una pallina diventa una
# perlina, un tratto piu' scuro si legge come corrente che passa. Tre
# lunghezze sovrapposte fanno la coda, dalla piu' lunga e chiara alla piu'
# corta e densa. Nessuna tinta e' piu' chiara della linea sotto: un pezzo
# piu' chiaro sembrerebbe un buco, non un riflesso.
CODA_FILI = ((0.22, (156, 139, 116)), (0.12, BRONZO), (0.05, (104, 80, 54)))
CODA_SPINA = ((0.17, (122, 97, 67)), (0.09, (92, 71, 47)), (0.04, (58, 43, 27)))


def _nodo(f, forza):
    """Il lampo sul punto di convergenza.

    Senza, fra l'arrivo della corrente sui fili e la partenza lungo la
    spina restava un battito vuoto, e il passaggio sembrava un salto.
    E' anche il momento che conta: quattro cose che diventano una.
    """
    if forza <= 0:
        return
    forza = min(1.0, forza)
    m = maschera(W, H)
    r = (4.5 + 3.5 * forza) * SS
    ImageDraw.Draw(m).ellipse([X_NODO * SS - r, CY * SS - r,
                               X_NODO * SS + r, CY * SS + r], fill=255)
    c = tuple(round(BRONZO[k] + (LAMPO[k] - BRONZO[k]) * forza) for k in range(3))
    tinta(f, giu(m, W, H), c)


def _impulso(percorsi, misure, testa, coda, largh, sfumato):
    """I tre strati della coda, come maschere gia' pronte da tingere."""
    strati = []
    for lung, colore in coda:
        m = maschera(W, H)
        d = ImageDraw.Draw(m)
        vuoto = True
        for punti, L in zip(percorsi, misure):
            p = _tratto(punti, L, testa - lung, testa)
            if len(p) >= 2:
                d.line([(x * SS, y * SS) for x, y in p], fill=255,
                       width=int(largh * SS), joint="curve")
                vuoto = False
        if vuoto:
            continue
        m = giu(m, W, H)
        if sfumato:
            m = Image.composite(m, Image.new("L", (W, H), 0), _sfumatura())
        strati.append((m, colore))
    return strati


def _stringi(frames, aria=3):
    """Ritaglia i fotogrammi ai bordi del disegno, tutti allo stesso modo.

    Il riquadro e' l'unione su tutti i fotogrammi, non solo sul primo:
    il lampo sul nodo e quello sul marchio sporgono oltre il disegno a
    riposo, e tagliare sul primo li amputerebbe.
    """
    box = None
    bianco = Image.new("RGB", frames[0].size, FONDO)
    for f in frames:
        b = ImageChops.difference(f, bianco).getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    w, h = frames[0].size
    box = (max(0, box[0] - aria), max(0, box[1] - aria),
           min(w, box[2] + aria), min(h, box[3] + aria))
    print(f"  banda ritagliata a {box[2]-box[0]}x{box[3]-box[1]}")
    return [f.crop(box) for f in frames]


def banda():
    fili, spina, bracci = _fili()

    fermo = tela(W, H)
    tinta(fermo, fili, GRAFITE)
    tinta(fermo, bracci, INCHIOSTRO)
    tinta(fermo, spina, BRONZO)

    percorsi = _percorsi()
    misure = [_misure(p) for p in percorsi]
    spina_pt = [[(X_NODO, CY), (X_FINE, CY)]]
    spina_L = [_misure(spina_pt[0])]

    # Fotogramma 1: il disegno finito. Outlook si ferma qui.
    frames, durate = [fermo], [1100]

    # 1. La corrente sale lungo i quattro fili tutta insieme. Prima era
    #    ferma meta' banda, e il movimento si notava appena.
    N = 11
    for i in range(N):
        t = morbido((i + 1) / N)
        f = fermo.copy()
        for m, c in _impulso(percorsi, misure, t, CODA_FILI, 2.0, True):
            tinta(f, m, c)
        _nodo(f, max(0.0, (i - 7) / 3))
        frames.append(f)
        durate.append(55)

    # 2. Dal nodo in poi corre una sola linea: le quattro cose sono
    #    diventate una direzione.
    N = 13
    for i in range(N):
        t = morbido((i + 1) / N)
        f = fermo.copy()
        for m, c in _impulso(spina_pt, spina_L, t, CODA_SPINA, 3.6, False):
            tinta(f, m, c)
        _nodo(f, max(0.0, 1 - i / 4))
        frames.append(f)
        durate.append(55)

    # 3. L'arrivo: il marchio si accende. E' il senso dell'animazione -
    #    le quattro discipline arrivano da qualche parte - e serve anche
    #    a chiudere lo sguardo sul marchio invece che sul bordo.
    for forza, durata in ((1.0, 90), (1.0, 70), (0.7, 60), (0.42, 60), (0.2, 60), (0.0, 60)):
        f = fermo.copy()
        if forza:
            m = maschera(W, H)
            d = ImageDraw.Draw(m)
            _fusto_banda(d, k=1 + 0.5 * forza)
            p, s = _posa_marchio()
            r = (4 + 7 * forza) * s * SS
            x, y = p(50, 56)
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)
            acceso = tuple(round(BRONZO[k] + (ACCESO[k] - BRONZO[k]) * forza)
                           for k in range(3))
            tinta(f, giu(m, W, H), acceso)
        frames.append(f)
        durate.append(durata)

    frames = _stringi(frames)

    tinte = [GRAFITE, BRONZO, INCHIOSTRO, ACCESO, LAMPO]
    tinte += [c for _, c in CODA_FILI] + [c for _, c in CODA_SPINA]
    salva_gif(frames, durate, f"{OUT}/firma-allineamento.gif", tinte)


# ──────────────────────────────────────────────────────────── uscita

def tavolozza(tinte, passi=10):
    """Tavolozza fissa: il fondo esatto piu' una rampa verso ogni tinta.

    Serve perche' la quantizzazione automatica sposta il fondo di un paio
    di punti, e il fondo deve restare l'indice 0 esatto, che e'
    quello dichiarato trasparente. Qui e' il primo colore,
    e le rampe coprono i bordi sfumati senza retinatura.
    """
    colori = [FONDO]
    for c in tinte:
        for i in range(1, passi + 1):
            t = i / passi
            colori.append(tuple(round(FONDO[k] + (c[k] - FONDO[k]) * t)
                                for k in range(3)))
    assert len(colori) <= 256
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
    assert fondo == FONDO, f"{path}: fondo {fondo}, atteso {FONDO}"
    kb = os.path.getsize(path) / 1024
    print(f"{path.split('/')[-1]}  {q[0].size}  {len(q)} fotogrammi  {kb:.0f} KB")


def misure_html():
    """Riporta nella firma le misure vere della banda.

    Stanno scritte a mano nell'HTML - servono a Outlook, che ignora il
    CSS - e se il disegno cambia proporzioni senza che cambino loro
    l'immagine si deforma.
    """
    import re
    g = Image.open(f"{OUT}/firma-allineamento.gif")
    largo = 390
    alto = round(largo * g.size[1] / g.size[0])
    f = f"{OUT}/firma.html"
    s = open(f, encoding="utf-8").read()
    s2 = re.sub(r'(firma-allineamento\.gif" width=")\d+(" height=")\d+(")',
                lambda m: f"{m.group(1)}{largo}{m.group(2)}{alto}{m.group(3)}", s)
    assert s2 != s or f'width="{largo}" height="{alto}"' in s, "misure non trovate"
    if s2 != s:
        open(f, "w", encoding="utf-8").write(s2)
    print(f"  banda nell'HTML: {largo}x{alto}")


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
    misure_html()
    pagina()


if __name__ == "__main__":
    main()
