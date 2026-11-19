---
name: Francesco Gizzi
description: Consulenza che allinea marketing, dati, vendite e strategia. Avorio, inchiostro, un solo bronzo.
colors:
  avorio: "#F7F6F2"
  avorio-fondo: "#EFEDE7"
  avorio-scheda: "#FBFAF7"
  inchiostro: "#121212"
  grafite: "#625F58"
  grafite-tenue: "#67635C"
  filo: "#DEDBD3"
  filo-marcato: "#CFC8BC"
  bronzo: "#8A6F4E"
  bronzo-testo: "#765F43"
  sabbia: "#E8DFD2"
typography:
  display:
    fontFamily: "Geist, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(40px, 6.9vw, 96px)"
    fontWeight: 300
    lineHeight: 0.99
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(30px, 4vw, 46px)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  filo: "4px"
  piccolo: "6px"
  campo: "10px"
  pillola: "999px"
spacing:
  sezione: "clamp(48px, 6vw, 80px)"
  blocco: "34px"
  gruppo: "12px"
components:
  bottone-primario:
    backgroundColor: "{colors.inchiostro}"
    textColor: "{colors.avorio}"
    rounded: "{rounded.pillola}"
    padding: "18px 26px"
    typography: "{typography.label}"
  bottone-primario-hover:
    backgroundColor: "{colors.bronzo}"
    textColor: "{colors.avorio}"
  campo:
    backgroundColor: "{colors.avorio}"
    textColor: "{colors.inchiostro}"
    rounded: "{rounded.campo}"
    padding: "13px 14px"
  campo-focus:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.inchiostro}"
  occhiello:
    textColor: "{colors.bronzo-testo}"
    typography: "{typography.label}"
  cella-logo:
    backgroundColor: "{colors.avorio-fondo}"
---

# Design System: Francesco Gizzi

## Overview

**Creative North Star: "Convergenza Quieta"**

Esiste una forma di autorevolezza che non alza la voce. Nasce dal vuoto tenuto
con disciplina, dalla linea tracciata una volta sola, dal silenzio intorno a una
sola affermazione. Dove tutto grida, il sussurro composto è l'unica cosa che si
sente. Il sito di un consulente che entra in azienda a mettere ordine deve
sembrare già in ordine: la sobrietà qui non è pudore, è la dimostrazione.

Il sistema si costruisce per sottrazione. Tre valori di colore, un carattere
solo, nessuna ombra a riposo, nessuna scheda dentro un'altra scheda. Le
separazioni sono fili da un pixel, non contenitori. Il bronzo compare dove lo
sguardo deve andare per primo e in nessun altro posto: è l'unico gesto di colore
concesso, e la sua rarità è il motivo per cui funziona.

L'anti-riferimento è il sito di agenzia: gradienti, schede uguali in fila con
l'icona sopra il titolo, numeri grandi senza nulla sotto. Il documento di
riferimento originale è `assets/ads/filosofia-visiva.md`.

**Key Characteristics:**
- Avorio caldo che non è mai bianco, inchiostro che non è mai nero puro.
- Un solo carattere, Geist, in peso 300 per i titoli e 400 per il testo.
- Titoli grandi con crenatura stretta fino a −0.05em; nessun peso intermedio.
- Fili da un pixel al posto di bordi e schede.
- Piatto a riposo: l'ombra è una risposta a uno stato, non un materiale.
- Il bronzo marca, non decora.

## Colors

Una palette ristretta a tre famiglie, calibrata con ossessione: un avorio caldo,
un inchiostro profondo, e un bronzo usato con l'avarizia con cui un orafo usa la
foglia d'oro.

### Primary
- **Bronzo** (#8A6F4E): il marchio, i bordi del ritratto, il fusto del simbolo,
  gli accenti grafici. È il colore della marca, non del testo.
- **Bronzo testo** (#765F43): lo stesso bronzo, scurito quanto basta per passare
  4,5:1 su tutti e tre i fondi. Si usa ovunque il bronzo faccia testo:
  occhielli, etichette, date, numeri di passo, il payoff nel footer.

### Neutral
- **Inchiostro** (#121212): titoli, testo forte, fondo dei bottoni primari.
- **Grafite** (#625F58): testo secondario, sottotitoli, voci di menu a riposo.
- **Grafite tenue** (#67635C): segnaposto dei campi e didascalie minime. Più
  chiaro di così non si scende: a #706C65 reggeva sull'avorio ma cadeva a
  4,46 sul fondo secondario e a 3,96 sul sabbia.
- **Avorio** (#F7F6F2): il fondo di tutto.
- **Avorio fondo** (#EFEDE7): sezioni alternate e celle dei loghi.
- **Avorio scheda** (#FBFAF7): le poche superfici che devono staccare appena.
- **Sabbia** (#E8DFD2): superfici calde, riquadri delle icone istituzionali.
- **Filo** (#DEDBD3) e **Filo marcato** (#CFC8BC): separazioni e bordi dei campi.

### Named Rules

**La regola delle due bronzi.** Il bronzo è uno solo nell'occhio, due nel codice:
`--accent` per la grafica e `--accent-testo` per il testo. Non si scambiano. Il
primo tiene il marchio allineato agli SVG, il secondo tiene il testo sopra la
soglia di contrasto.

**La regola dell'avarizia.** Il bronzo non copre mai più del dieci per cento di
una schermata. Se una pagina ne ha bisogno di più, il problema è la gerarchia,
non il colore.

**La regola del fondo caldo.** Non esiste il bianco puro come fondo di pagina. Il
bianco compare solo dentro un campo che ha il fuoco, per dire che è attivo.

## Typography

**Display Font:** Geist (con Helvetica Neue, Arial)
**Body Font:** Geist (lo stesso)
**Label Font:** Geist (lo stesso)

**Character:** un carattere solo per tutto. La gerarchia nasce dal salto di
scala e dalla crenatura, non dall'alternanza di famiglie: una parola grande,
molte parole piccole, niente in mezzo. I titoli sono leggeri e stretti, il testo
è normale e arioso.

### Hierarchy
- **Display** (300, `clamp(40px, 6.9vw, 96px)`, 0.99, −0.04em): il titolo
  dell'hero, uno per pagina. I 96px e il −0.04em sono soglie, non gusto:
  oltre, il titolo smette di essere leggibile come testo e le lettere si
  toccano.
- **Headline** (300, `clamp(30px, 4vw, 46px)`, 1.1, −0.04em): i titoli di
  sezione.
- **Title** (500, 18–22px): titoli dei passi del metodo e delle schede.
- **Body** (400, 17px, 1.65): il testo corrente. Misura massima 33em per il
  sottotitolo dell'hero, 65–75 caratteri altrove.
- **Label** (500, 13px, +0.01em): occhielli, categorie, date. In bronzo testo.
- **Micro-etichetta** (500, 10.5px, +0.26em, maiuscolo): l'occhiello della
  striscia marchi e le etichette della firma email.

### Named Rules

**La regola del peso unico.** I titoli sono sempre 300. Non esiste un titolo in
600 che chiede più attenzione di un altro: se deve pesare di più, diventa più
grande.

**La regola della crenatura.** Più grande è il testo, più stretta la crenatura.
Il pavimento è −0.05em sull'hero. Al contrario, le micro-etichette si aprono
fino a +0.26em: sotto i dodici pixel, lo spazio fra le lettere è ciò che le
rende leggibili.

## Layout

Contenitore massimo 1200px con margini laterali `clamp(16px, 4vw, 48px)`. Le
sezioni respirano di `clamp(48px, 6vw, 80px)` sopra e sotto: il ritmo è stretto
di proposito, perché una pagina lunga che costringe a scorrere a vuoto fra un
blocco e l'altro perde chi legge.

La griglia cambia natura per blocco invece di ripetere tre colonne uguali: i
risultati sono righe a tre campi di larghezza diversa separate da un filo; i
loghi dei clienti sono una griglia di celle con bordo destro e inferiore, senza
spazio fra loro; il metodo è tre colonne numerate.

Il ritmo verticale dentro un blocco è 34px fra le righe e 12px dentro un gruppo:
gruppi stretti, separazioni generose.

Punti di rottura: 1080px (il menu collassa), 980px, 760px (le griglie passano a
una colonna), 620px e 360px. Sotto i 780px la striscia marchi dell'hero diventa
una griglia 4×2 invece di una riga sola.

## Elevation & Depth

**Il sistema è piatto a riposo.** La profondità si ottiene per tono e per filo,
non per ombra: un fondo leggermente più scuro, una riga da un pixel, un bordo.
Non c'è un vocabolario di elevazioni e non ne va inventato uno.

Le uniche due ombre del sistema sono risposte a uno stato o a un ruolo:

### Shadow Vocabulary
- **Barra fissa** (`box-shadow: 0 1px 0 var(--line)`): un solo pixel, quando la
  navigazione si stacca dalla pagina scorrendo.
- **Elemento che galleggia** (`box-shadow: 0 30px 60px rgba(18,18,18,.08)`):
  offset lungo e sfocatura morbida, per il banner cookie e il pannello del menu.
  Non si usa per le schede.

### Named Rules

**La regola del piatto per difetto.** Una superficie non ha ombra finché non
esce dal flusso della pagina. Se una scheda sembra aver bisogno di un'ombra per
distinguersi, le manca un filo o un fondo, non una luce.

## Shapes

Tre raggi e basta. **Pillola** (999px) per i bottoni e per tutto ciò che si
tocca: è la forma che dice "premimi". **Campo** (10px) per gli ingressi del
modulo. **Piccolo** (6px) per i riquadri minori e le voci del selettore di
lingua. Le celle dei loghi non hanno raggio: sono rettangoli separati da fili,
come le caselle di una tabella.

I bordi sono sempre da un pixel e sempre di un grigio della palette, mai
dell'inchiostro. Un bordo nero in questo sistema significa fuoco da tastiera.

Il marchio dà al sistema la sua unica geometria organica: due bracci che salgono
a un vertice e un fusto che prosegue verso l'alto. Quella convergenza ricompare
nella striscia dei marchi e nelle creatività pubblicitarie, ed è l'unico gesto
narrativo concesso alla grafica.

## Components

**Bottone primario.** Deciso e senza decorazione. Pillola inchiostro su avorio,
testo 500 a 15px, 18px per 26px di respiro. Al passaggio del mouse il bronzo sale
dal basso per sostituire l'inchiostro, e la freccia avanza di quattro pixel: una
sola animazione, non due effetti separati.

**Collegamento di testo.** La sottolineatura è un gradiente da un pixel che si
ritira da sinistra verso destra al passaggio del mouse, invece di accendersi e
spegnersi. L'area da toccare è più alta del testo di dieci pixel, ottenuti con
riempimento e margine negativo perché la sottolineatura non si sposti.

**Campo del modulo.** Fondo avorio, bordo filo, raggio 10px. Al passaggio del
mouse il bordo si scurisce appena; al fuoco diventa inchiostro e il fondo passa
a bianco puro. È l'unico posto del sistema dove il bianco puro è ammesso.

**Cella del logo.** Rettangolo su fondo avorio secondario, bordo destro e
inferiore, immagine in scala di grigi con fusione a moltiplicare al 75%. Il
trattamento è il motivo per cui ogni logo fornito va convertito a inchiostro su
trasparente prima di entrare: un marchio chiaro su fondo scuro, lì dentro,
diventa un rettangolo nero.

**Occhiello di sezione.** Etichetta in bronzo testo preceduta da un trattino da
22 pixel. È una convenzione del sistema esistente, presente su quasi ogni
sezione del sito.

**Riga di risultato.** Tre campi di larghezza diversa separati da fili
orizzontali, senza scheda intorno. La cifra è grande e leggera, la freccia di
variazione è in bronzo testo, la data è allineata a destra.

## Do's and Don'ts

**Do**
- Separare con un filo prima di pensare a una scheda.
- Usare il salto di scala per la gerarchia, mai un peso in più.
- Convertire ogni logo cliente a inchiostro su trasparente prima di inserirlo.
- Tenere il contrasto del testo sopra 4,5:1 e i bersagli da toccare a 24px.
- Far rispondere il movimento a `prefers-reduced-motion`.

**Don't**
- Schede dentro schede, o file di schede uguali con l'icona sopra il titolo.
- Gradienti, vetro, ombre colorate, testo in gradiente.
- Bianco puro come fondo di pagina.
- Un secondo carattere "per dare personalità": la personalità è la scala.
- Numeri grandi senza una prova sotto.
- Emoji al posto di un'icona disegnata.
