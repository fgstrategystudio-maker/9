#!/usr/bin/env python3
"""
Converte un logo cliente in inchiostro su trasparente.

Perche' serve: nella griglia clienti e nella striscia dell'hero i marchi
passano per `grayscale(1)` + `mix-blend-mode: multiply`. Il multiply fa
sparire il bianco - ed e' voluto, cosi' i file con fondo bianco si fondono
col fondo - ma schiarisce tutto il resto in proporzione alla luminosita':
un marchio colorato chiaro (il verde Assistedile, lum ~180) si riduce a un
fantasma, e un marchio chiaro su fondo scuro diventa un rettangolo nero.

La conversione porta a inchiostro pieno tutto cio' che e' piu' scuro del
bianco, e lascia vuoto il bianco: le scritte in negativo dentro un simbolo
restano leggibili perche' il fondo avorio della pagina ci passa attraverso.

Uso:  python3 _inchiostra_logo.py sorgente.png assets/img/clienti/nome.png
"""
import sys
import numpy as np
from PIL import Image

INCHIOSTRO = (18, 18, 18)   # --ink del sito
# Sotto 200 di luminosita' e' inchiostro pieno, sopra 240 e' vuoto: in mezzo
# una rampa, cosi' i bordi antialiasati non si seghettano.
PIENO, VUOTO = 200.0, 240.0


def inchiostra(src, dst):
    a = np.array(Image.open(src).convert("RGBA")).astype(float)
    lum = (a[..., :3] * [.2126, .7152, .0722]).sum(2)
    cop = np.clip((VUOTO - lum) / (VUOTO - PIENO), 0, 1)

    out = np.zeros(a.shape, np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = INCHIOSTRO
    out[..., 3] = (cop * a[..., 3]).round()
    Image.fromarray(out, "RGBA").save(dst)
    print(dst, Image.open(dst).size)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    inchiostra(sys.argv[1], sys.argv[2])
