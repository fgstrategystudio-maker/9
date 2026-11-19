#!/usr/bin/env python3.13
"""Il quadratino da inquadrare per escludere un telefono dalle statistiche.

Esiste per aggirare un problema preciso: un link aperto dentro WhatsApp o
LinkedIn non apre Safari, apre una finestra interna all'app, con una memoria
separata che si svuota da sola. L'esclusione finisce li' dentro e sparisce.
La fotocamera invece passa sempre dal browser di sistema, che e' quello che
conta.

    python3.13 _build_qr.py
"""
import segno

INDIRIZZO = 'https://francescogizzi.com/escludimi'
USCITA = 'assets/img/qr-escludimi.svg'
INCHIOSTRO = '#121212'

# Correzione d'errore media: regge il riflesso dello schermo e una fotocamera
# storta senza gonfiare il disegno piu' del necessario.
codice = segno.make(INDIRIZZO, error='m')
codice.save(USCITA, scale=10, border=3, dark=INCHIOSTRO, light='#ffffff',
            svgclass=None, lineclass=None, xmldecl=False, svgns=True)

print(USCITA, '-', codice.designator, '-', INDIRIZZO)
