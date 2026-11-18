---
name: Freelance Dashboard · Olivetti
description: Il cruscotto di un freelance come una macchina d'ufficio italiana ben disegnata
colors:
  grigio-macchina: "#E9E7E1"
  grigio-macchina-2: "#E1DED6"
  bianco-carta: "#FBFAF7"
  carta-ombra: "#F1EFEA"
  nero-tasti: "#1B1C1E"
  inchiostro-2: "#44454A"
  inchiostro-3: "#66675F"
  filo: "#D3D0C8"
  filo-tenue: "#E4E1DA"
  giallo-pintori: "#F2B705"
  petrolio: "#22695F"
  petrolio-velo: "#DCEFEA"
  blu-cassa: "#2357A6"
  blu-cassa-velo: "#E1E9F6"
  rosso-allarme: "#C8302A"
  rosso-allarme-velo: "#F9E0DD"
  ora-g1: "#DCEFEA"
  ora-g2: "#A9D5CB"
  ora-g3: "#6FB2A5"
  ora-g4: "#2F7F72"
  ora-g5: "#164E46"
  rail: "#1B1C1E"
  rail-2: "#26272A"
  rail-ink: "#ECEAE4"
  rail-ink-2: "#A9A7A0"
  rail-filo: "#34353A"
  bianco: "#FFFFFF"
  dark-grigio-macchina: "#141516"
  dark-grigio-macchina-2: "#1A1B1D"
  dark-carta: "#1D1E20"
  dark-carta-ombra: "#26272A"
  dark-inchiostro: "#ECEAE4"
  dark-inchiostro-2: "#C9C7C1"
  dark-inchiostro-3: "#9C9A94"
  dark-filo: "#34353A"
  dark-filo-tenue: "#2A2B2F"
  dark-petrolio: "#6FC2B3"
  dark-petrolio-velo: "#17302C"
  dark-blu-cassa: "#8FB0EE"
  dark-blu-cassa-velo: "#1B2436"
  dark-rosso-allarme: "#FF7A6E"
  dark-rosso-allarme-velo: "#3A1E1B"
  dark-ora-g1: "#183531"
  dark-ora-g2: "#1F4D46"
  dark-ora-g3: "#2E7268"
  dark-ora-g4: "#6FB2A5"
  dark-ora-g5: "#BFE3DA"
  dark-rail: "#0E0F10"
  dark-rail-2: "#18191B"
typography:
  display:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "clamp(40px, 5vw, 64px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.2vw, 40px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1"
  title:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  key-figure:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.005em"
  body-sm:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  key-label:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.04em"
  caption:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "99px"
spacing:
  hair: "2px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.nero-tasti}"
    textColor: "{colors.bianco-carta}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-dark:
    backgroundColor: "{colors.dark-inchiostro}"
    textColor: "{colors.dark-grigio-macchina}"
  button-ghost:
    backgroundColor: "{colors.bianco-carta}"
    textColor: "{colors.nero-tasti}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.bianco-carta}"
    textColor: "{colors.nero-tasti}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  month-key:
    backgroundColor: "{colors.bianco-carta}"
    textColor: "{colors.nero-tasti}"
    rounded: "{rounded.md}"
    padding: "10px 8px 12px"
    height: "104px"
  month-key-pressed:
    backgroundColor: "{colors.giallo-pintori}"
    textColor: "{colors.nero-tasti}"
  answer-band-ora:
    backgroundColor: "{colors.ora-g4}"
    textColor: "{colors.bianco}"
    padding: "10px 20px"
    typography: "{typography.label}"
  answer-band-tempo:
    backgroundColor: "{colors.giallo-pintori}"
    textColor: "{colors.nero-tasti}"
    padding: "10px 20px"
  answer-band-cassa:
    backgroundColor: "{colors.blu-cassa}"
    textColor: "{colors.bianco}"
    padding: "10px 20px"
  answer-band-cassa-dark:
    backgroundColor: "{colors.dark-blu-cassa}"
    textColor: "{colors.dark-grigio-macchina}"
  block:
    backgroundColor: "{colors.bianco-carta}"
    rounded: "{rounded.lg}"
    padding: "20px"
  rate-chip:
    rounded: "{rounded.sm}"
    padding: "3px 8px"
    width: "46px"
---

# Design System: Freelance Dashboard · Olivetti

## Overview

**Creative North Star: "La macchina d'ufficio"**

La dashboard è disegnata come un oggetto della grafica d'ufficio italiana (Pintori, Ballmer, Lettera 22): un corpo grigio macchina, fogli bianco carta, tasti neri, e pochi campi di colore pieno che dicono subito di cosa si parla. Non è un cruscotto di card KPI tutte uguali né un pannello finanziario blu generico: tre risposte con lo stesso peso stanno in un solo corpo, e sotto c'è una tastiera di dodici mesi da premere.

La densità è quella di un registro: numeri tabellari pesanti, righe separate da fili sottili, totali chiusi da una riga nera spessa. Il colore non decora: ogni tinta è un ruolo (tempo, valore dell'ora, cassa, allarme) e resta tale ovunque compaia. La profondità viene dal gesto del tasto, non dalle ombre: le superfici sono piatte, i tasti hanno una base più spessa e si abbassano quando li premi.

Il sistema vale in chiaro e in scuro con gli stessi ruoli; in scuro i campi d'accento si schiariscono e la scala del €/h si inverte (più chiaro = più alto). L'app offre anche altre versioni selezionabili ("Pagine rosa", "Standard", Orario, Classica): questo documento descrive solo Olivetti.

**Key Characteristics:**
- Grigio macchina come fondo, bianco carta per i blocchi, nero dei tasti per testo e azioni.
- Colore pieno solo come ruolo: giallo = tempo, verde acqua→petrolio = €/h, blu = cassa, rosso = allarmi.
- Una sola famiglia, Albert Sans, con cifre tabellari e pesi 700–800 per i numeri.
- Angoli 6/10/14px; tasti con base inferiore di 4px che si schiaccia alla pressione.
- Piatto per default: nessuna ombra sui blocchi, separazione con fili e campi di colore.

## Colors

Una macchina grigia e nera con quattro tinte di servizio, ciascuna legata a una sola grandezza.

### Primary
- **Nero dei tasti** (nero-tasti): testo principale, pulsante primario ("Chiedi"), riga dei totali, divisori verticali tra le tre risposte, anello di focus. In scuro diventa il bianco caldo dark-inchiostro.

### Secondary
- **Giallo Pintori** (giallo-pintori, uguale in chiaro e scuro): il tempo. Banda "il tuo tempo", barre delle ore nei 12 mesi, tasto del mese premuto, colonna "questo mese" nel grafico dell'anno, voce attiva nel selettore di versione del rail. Il testo su giallo è sempre nero dei tasti.
- **Scala dell'ora, verde acqua→petrolio** (ora-g1…ora-g5; in scuro dark-ora-g1…g5, invertita in luminosità): il valore del €/h. Gradini 1–5 calcolati tra il €/h minimo e massimo visibili; g4 è anche la banda "la tua ora" e la colonna "registrato" del grafico annuale. Testo nero su g1–g3, bianco su g4–g5 (in scuro: chiaro su g1–g3, scuro su g4–g5).
- **Petrolio** (petrolio / dark-petrolio): esiti positivi in denaro (variazioni +%, risparmio dell'anno, obiettivo raggiunto). Velo: petrolio-velo.

### Tertiary
- **Blu cassa** (blu-cassa / dark-blu-cassa): la cassa e i suoi eventi. Banda "i tuoi soldi", barre della cassa a fine mese, marcatore "F24" sui tasti e nel dettaglio, puntini degli avvisi informativi e di scadenza. Gli F24 sono eventi di cassa, quindi blu, non arancio.
- **Rosso allarme** (rosso-allarme / dark-rosso-allarme): solo allarmi. Cassa negativa (cifra e barra), avvisi di livello "danger".

### Neutral
- **Grigio macchina** (grigio-macchina, grigio-macchina-2): il fondo della pagina; il secondo tono è il velo neutro.
- **Bianco carta** (bianco-carta) e **carta in ombra** (carta-ombra): superficie dei blocchi e dei tasti; carta-ombra per tracce delle barre, hover delle risposte, chip g0 (nessun dato).
- **Inchiostri** (inchiostro-2, inchiostro-3): testo secondario e note/etichette di colonna.
- **Fili** (filo, filo-tenue): bordo dei blocchi e dei tasti; filo-tenue per le righe interne di tabelle e registri.
- **Rail** (rail, rail-2, rail-ink, rail-ink-2, rail-filo): la barra laterale nera, uguale in chiaro e in scuro salvo i fondi dark-rail.

### Named Rules
**La Regola Un Colore, Una Grandezza.** Giallo = tempo (ore libere, mese premuto, mese corrente). Verde acqua→petrolio = €/h e guadagno. Blu = cassa, F24 compresi. Rosso = solo allarmi. Una tinta non cambia mai grandezza, e una grandezza non cambia mai tinta.

**La Regola del Campo Pieno.** Il colore entra come campo pieno a tutta larghezza (le bande delle tre risposte, il tasto premuto, le barre), non come sottolineatura, bordino laterale o icona colorata.

**La Regola del Rosso Raro.** Se nulla è in allarme, sullo schermo non c'è rosso.

## Typography

**Display Font:** Albert Sans (con system-ui, sans-serif)
**Body Font:** Albert Sans
**Label/Mono Font:** Albert Sans con cifre tabellari (`tnum`), nessun monospazio

**Character:** Un grottesco unico, da targhetta e da tastiera: pesante e compresso nei numeri, piano e leggibile nelle frasi. La gerarchia si fa con peso e tracking negativo, non con un secondo carattere.

### Hierarchy
- **Display** (700, clamp(40px, 5vw, 64px), 1, −0.03em): il mese come targhetta, titolo della pagina.
- **Headline** (800, clamp(30px, 3.2vw, 40px), 1.05): il numero delle tre risposte; l'unità ("€/h", "h libere") a 0.45em, 600, inchiostro-3.
- **Title** (800, 19px, minuscolo, −0.02em): titoli dei blocchi ("i prossimi 12 mesi", "soldi").
- **Key figure** (700, 24px, −0.03em): le ore libere sul tasto del mese.
- **Body** (400, 15px, 1.6, max 90ch): la riga di riepilogo con i numeri cliccabili (700, sottolineati 1px a offset 4px).
- **Body small** (14px): righe di registri, tabelle, avvisi; cifre in 700.
- **Label** (700, 13px, minuscolo): testo delle bande colorate. **Key label** (700, 12.5px, MAIUSCOLO, +0.04em): il nome del mese sul tasto, unica etichetta in maiuscolo.
- **Caption** (12.5px, inchiostro-3): note, intestazioni di colonna (600), legende.

### Named Rules
**La Regola dei Numeri Pesanti.** Ogni cifra significativa è tabellare e in 700–800; il testo intorno resta 400–600. Il numero è sempre la cosa più nera della riga.

**La Regola del Minuscolo.** Titoli dei blocchi e bande parlano in minuscolo; il maiuscolo è riservato ai nomi dei mesi sui tasti.

## Layout

Colonna unica nel contenuto principale con ritmo verticale di 20px tra i blocchi: titolo del mese e azioni, assistente a tutta larghezza, riga di riepilogo, le tre risposte, avvisi, obiettivi, la tastiera con il dettaglio del mese, poi una griglia a due colonne (anno, commesse, riserve | soldi) con gap 20px. Le tre risposte sono una griglia 3×1fr senza gap dentro un solo corpo; il dettaglio del mese è 1.4fr | 1fr con gap 24px. La tastiera è una griglia di 12 colonne con gap 6px.

Spaziature osservate: 2, 6, 8, 12, 16, 20, 24px. Blocchi con padding 20px (16px sotto 760px); risposte 18px/20px.

Responsive: sotto 1000px le tre risposte, il blocco a due colonne e il dettaglio diventano una colonna sola, e il divisorio nero tra le risposte passa da verticale a orizzontale. Sotto 760px la tastiera diventa una fila scorrevole con scroll-snap (tasti da 84px × 96px), i pulsanti ghost dell'intestazione mostrano solo l'icona, il grafico annuale scende a 160px.

## Elevation & Depth

Il sistema è piatto. In Olivetti `--sh-sm` è `none`: blocchi, risposte, pulsanti ghost e tasti non hanno ombra a riposo. La profondità è meccanica: la base inferiore di 4px dei tasti, l'ombra interna del pulsante primario, e lo spostamento verticale alla pressione.

### Shadow Vocabulary
- **Base del tasto primario** (`box-shadow: inset 0 -3px 0 rgba(0,0,0,.55)`; premuto `inset 0 -1px 0 rgba(0,0,0,.55)`): solo sul pulsante primario.
- **Sollevato** (`box-shadow: 0 1px 0 rgba(0,0,0,.08), 0 8px 18px -10px rgba(0,0,0,.25)`): token `--sh`, per elementi che fluttuano (banner dell'assistente in hover); non per i blocchi.
- **Segno di corrente** (`box-shadow: inset 0 0 0 2px var(--ink)`): contorno interno nero sulla prima barra delle mini-serie e (1.5px) sulla colonna gialla del mese corrente.

### Named Rules
**La Regola del Tasto.** La profondità si guadagna con la pressione: un elemento premibile ha una base più spessa e si abbassa di 2–3px quando lo premi. Niente ombre sfumate per dire "cliccabile".

## Shapes

Angoli morbidi ma da oggetto industriale: 6px per chip e bordi piccoli, 10px per tasti, pulsanti e campi, 14px per i blocchi e il corpo delle tre risposte; 99px solo per tracce di barre orizzontali. Le barre verticali hanno angoli superiori di 2–3px e base piatta. Bordi a 1px filo; il tasto ha bordo inferiore a 4px. I totali di registro chiudono con una riga di 2px nero dei tasti. Il corpo delle tre risposte ritaglia (overflow hidden) le bande colorate al proprio raggio.

## Components

### Buttons
Tasti da macchina: neri, pieni, che si schiacciano.
- **Shape:** 10px.
- **Primary:** nero dei tasti con testo bianco carta (in scuro: dark-inchiostro con testo dark-grigio-macchina), 13.5px/600, padding 10px 16px, senza bordo, base interna di 3px.
- **Hover / Active:** hover sale di 1px; active scende di 2px e la base si riduce a 1px (transizione .12s ease-out).
- **Ghost:** bianco carta, bordo filo, testo nero; hover bordo inchiostro-3 e +1px. Usato per Report PDF e Promemoria.
- **Link di testo:** 600, 13.5px, sottolineato 1px a offset 4px, altezza minima 32px.

### Chips (scala del €/h)
- **Style:** larghezza minima 46px, padding 3px 8px, raggio 6px, 700/13px, centrato, sfondo dal gradino g1–g5 con il suo inchiostro; g0 = carta-ombra con inchiostro-2 quando il €/h non c'è.
- **State:** nessuno; il gradino è dato, non interazione.

### Cards / Containers (blocchi)
- **Corner Style:** 14px.
- **Background:** bianco carta.
- **Shadow Strategy:** nessuna (vedi Elevation).
- **Border:** 1px filo.
- **Internal Padding:** 20px (16px su telefono), gap interno 14px; testata con titolo minuscolo 19/800 e nota 13.5px inchiostro-3.

### Inputs / Fields
- **Style:** bianco carta, bordo 1px filo, raggio 10px, padding 9px 12px, 14px; cifre tabellari.
- **Focus:** bordo nero dei tasti più anello di 3px grigio-macchina-2.

### Navigation
Rail nero a sinistra (rail), voci in rail-ink-2; la voce attiva sta su rail-2 con un segno giallo Pintori (rail-active) a sinistra. Il selettore di versione evidenzia la versione attiva con un campo giallo e testo nero. Nel rail il giallo segna "dove sei", coerente con il mese premuto.

### Le tre risposte (signature)
Un solo corpo bianco carta (bordo filo, raggio 14px) diviso in tre colonne uguali da fili neri verticali. In testa a ogni colonna una banda piena a tutta larghezza, 10px 20px, 13px/700 minuscolo, senza icona: "la tua ora" su ora-g4 con testo bianco, "il tuo tempo" su giallo Pintori con testo nero, "i tuoi soldi" su blu cassa con testo bianco (in scuro testo #141516). Sotto: il numero Headline in 800, una riga di sotto-testo, e una mini-serie in fondo (barre per commessa con colore di gradino, 12 barre gialle delle ore, 12 barre blu della cassa con rosso per i mesi sotto zero). Hover: fondo carta-ombra. Focus: contorno 2px nero rientrato di 3px.

### Il tasto del mese (signature)
Dodici tasti in fila, ruolo tab. Ogni tasto: bianco carta, bordo 1px filo con base inferiore 4px, raggio 10px, padding 10px 8px 12px, altezza minima 104px. Contenuto allineato a sinistra: nome del mese (Key label, con l'anno a 10.5px per gennaio e il mese corrente), ore libere in Key figure con "h" a 12px, cassa abbreviata 12.5px/600 in inchiostro-2 (rossa se negativa), e "F24" 10.5px/700 in blu cassa nei mesi di versamento.
- **Hover:** bordo inchiostro-3. **Active:** scende di 2px. **Focus:** contorno 2px nero, offset 2px.
- **Premuto (selezionato):** campo giallo Pintori, testo e bordo nero dei tasti, base ridotta a 1px e abbassato di 3px; tutte le cifre interne diventano nere. Il tasto premuto guida il dettaglio del mese sotto.

### Dettaglio del mese e registro
Tabella delle commesse (Ore, Incasso, chip €/h) affiancata a un registro di voci: righe 14px separate da filo-tenue, etichetta inchiostro-2 a sinistra, cifra 700 a destra; il totale ("Cassa a fine mese", "Da tenere da parte") chiude con 2px nero. Nel blocco "soldi" ogni riga del registro è un pulsante che apre il dettaglio modificabile; hover sottolinea l'etichetta.

### Grafico dell'anno
Dodici colonne (gap 5px, altezza 190px): registrato in ora-g4 pieno, mese corrente in giallo con contorno nero 1.5px, previsto in velo g4 al 14% con contorno g4. Il valore compare in hover/focus e sempre sul mese corrente.

## Do's and Don'ts

### Do:
- **Do** usare il giallo Pintori solo per il tempo e per il mese premuto o corrente, sempre con testo nero dei tasti.
- **Do** esprimere il €/h con la scala g1–g5 a cinque gradini, testo nero su g1–g3 e bianco su g4–g5 (invertito in scuro).
- **Do** colorare di blu cassa ogni evento di cassa, F24 compresi.
- **Do** dare a ogni elemento premibile la base inferiore spessa e la discesa di 2–3px alla pressione (.12s ease-out).
- **Do** chiudere ogni totale di registro con una riga di 2px nero dei tasti.
- **Do** tenere cifre tabellari in 700–800 e titoli dei blocchi in minuscolo 19/800.

### Don't:
- **Don't** usare il rosso per altro che allarmi (cassa negativa, avvisi danger).
- **Don't** colorare gli F24 di arancio o giallo: sono cassa, quindi blu.
- **Don't** aggiungere ombre sfumate a blocchi, risposte o tasti a riposo.
- **Don't** spezzare le tre risposte in tre card separate con pesi diversi: è un solo corpo con tre colonne uguali.
- **Don't** introdurre un secondo carattere o un serif: Albert Sans fa tutto.
