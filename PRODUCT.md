# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Imprenditori e titolari di PMI italiane, confermato dal proprietario come cliente
tipo. Aziende avviate, non startup in cerca del primo cliente: hanno un prodotto
che funziona e una struttura che gira, ma la crescita si è fermata e dentro non
c'è nessuno che tenga insieme marketing e vendite. Chi scrive è quasi sempre chi
decide e chi paga, non un reparto che deve poi far approvare la scelta.

Pubblici secondari presenti nel sito ma non confermati come primari: direzioni
marketing e commerciali di aziende già strutturate, e istituzioni e gruppi
internazionali (la sezione Institutional e le pagine
sull'internazionalizzazione).

## Product Purpose

La pratica di consulenza di Francesco Gizzi. Il sito esiste per far arrivare una
richiesta di contatto qualificata, quasi sempre tramite il modulo che porta a un
audit iniziale. Non vende un prodotto né un abbonamento: vende l'ingresso di una
persona in azienda, come consulente esterno o come fractional CMO, fino a che i
risultati non si vedono nei numeri.

Successo: una richiesta di contatto da chi ha davvero un'azienda da far crescere.
Nel periodo misurato le richieste sono una manciata al mese, non un flusso: il
sito deve convincere pochi lettori giusti, non convertirne molti.

## Positioning

**La visione d'insieme.** Il proprietario, a cui è stato chiesto di sceglierne
uno, ha risposto che le cose valgono tutte insieme e che è l'insieme a
funzionare: tenere marketing, dati, vendite e strategia nella testa di una
persona sola, invece di quattro fornitori che ottimizzano ciascuno il proprio
pezzo senza vedere gli altri.

Da questo discendono, come parti della stessa cosa e non come argomenti
alternativi: si parte dai numeri già esistenti invece che da una campagna; si
lavora dentro l'azienda accanto al management invece di servirla da fuori; e il
mestiere viene da un percorso tech e manageriale, non dalla pubblicità.

Il payoff che lo dice in tre parole è **Allineati per crescere**.

## Operating Context

- Roma e Milano, con aziende di tutta Italia, in presenza e da remoto.
- Progetti internazionali, in particolare fra Italia e Brasile.
- Si lavora in italiano, inglese e portoghese. Il sito è in quattro lingue:
  italiano (radice), inglese, spagnolo, portoghese. Lo spagnolo non ha pagine
  legali proprie e rimanda a quelle italiane.
- L'ingresso tipico è l'audit iniziale: prima si legge lo storico, poi si
  decide. Il sito deve poter reggere questa sequenza, non saltarla.

## Capabilities and Constraints

- Sito statico: HTML, CSS e JavaScript scritti a mano, nessun framework,
  nessuna build. Circa 160 pagine, servite da Vercel con `cleanUrls`.
- Convivono due sistemi di fogli di stile: `home.css` + `site.css` (la
  direzione Avorio, usata dalle home e dalle pagine nuove) e `premium.css` +
  `style.css` (il template precedente, ancora usato da molte pagine interne).
  È un debito reale, non una scelta: ogni modifica trasversale va fatta due
  volte.
- Modulo contatti servito da Web3Forms, inviato in sottofondo senza uscire dal
  sito, con l'invio classico come riserva. Recapito via email.
- Misurazione: Google Analytics 4 con Consent Mode v2 e pixel di ChatGPT Ads,
  entrambi subordinati al consenso. Un interruttore per browser esclude le
  visite del proprietario dalle statistiche.
- Una firma email e una pagina da cui copiarla vivono nello stesso progetto
  (`/firma`), insieme alla pagina che gestisce l'esclusione (`/notrack`).
  Sono strumenti interni, non indicizzati.

## Brand Commitments

Il proprietario ha dichiarato intoccabili, nell'ordine in cui gli sono stati
proposti, tutti e quattro i punti seguenti.

- **I numeri**: 25+ clienti seguiti, 30+ settori, 15+ anni di esperienza. Si
  aggiornano quando cambiano, non si gonfiano. Devono restare coerenti su tutte
  le pagine che li citano.
- **I loghi dei clienti**: sono aziende vere. Nessun logo di riempimento,
  nessun marchio inventato per riempire una griglia.
- **Il payoff "Allineati per crescere"** e il marchio Radice, il simbolo a tre
  tratti con il fusto di bronzo.
- **Marketing · Data · Sales · Strategy** come impalcatura: è l'ordine con cui
  il sito presenta il lavoro, non un elenco riordinabile.

Nome: Francesco Gizzi, persona e marchio insieme. Non esiste una ragione
sociale da esporre al posto del nome.

## Evidence on Hand

- **Clienti reali, con logo**: TIM, Roma Capitale (Casa delle Tecnologie
  Emergenti), Peekaboo, Trackting, Domò Sushi (Roma e Milano), Rama by Domò,
  GoUp Agency, Grano Trattoria, Aria Tattoo Lab, L'Assistedile Group Brasil,
  L'Assistedile 2, Moshe 3000, Cyclando, Totale.one, Welyk, Ospita.re,
  Dropper, Mangrovia, Torripa Group, Liquinvex, Santaniello, Crediticash,
  Homever, Edil Mec. In `assets/img/clienti/` e `assets/img/`.
- **Risultati** nella home, descritti per tipo di azienda e non per nome:
  startup proptech, azienda finanziaria, gruppo ristorazione, società di
  consulenza.
- **Ritratto** del proprietario in `assets/img/ritratto.jpg`.
- **Marchio** completo in `assets/brand/`, con le varianti orizzontale,
  verticale, simbolo e negativo, più il file `LEGGIMI.txt`.
- **Blog**: una ventina di articoli propri, in quattro lingue.

Cosa non esiste e non va inventato: testimonianze firmate, prezzi, numeri di
fatturato dei clienti, premi, certificazioni, dimensione di un team. Lavora da
solo, e il sito non deve far credere il contrario.

## Product Principles

1. **L'insieme prima del pezzo.** Ogni pagina deve lasciar vedere che le quattro
   discipline stanno in una testa sola. Una pagina che vende solo marketing, o
   solo dati, tradisce il posizionamento anche quando è vera.
2. **I numeri prima della promessa.** Il mestiere parte dallo storico del
   cliente. Il sito segue la stessa regola: prima la prova, poi l'affermazione.
3. **Niente che non si possa dimostrare.** Clienti veri, risultati veri, numeri
   veri. In assenza di una prova si toglie la frase, non si ammorbidisce.
4. **Pochi lettori giusti.** Il sito parla a chi decide in un'azienda avviata.
   Chiarezza e credibilità valgono più del volume.
5. **Sobrio, non timido.** L'autorevolezza qui si esprime per sottrazione, ma
   sottrarre non vuol dire non avere un punto di vista.

## Accessibility & Inclusion

Obiettivo dichiarato: WCAG 2.1 AA. L'audit del 19 novembre 2026 ha corretto le
violazioni di contrasto, i bersagli tattili sotto i 24px, il movimento continuo
senza modo di fermarlo e i punti di riferimento mancanti. Le modifiche future
non devono riaprirle. Il sito si legge in quattro lingue e va mantenuto
utilizzabile da telefono: la maggior parte delle visite non arriva da desktop.
