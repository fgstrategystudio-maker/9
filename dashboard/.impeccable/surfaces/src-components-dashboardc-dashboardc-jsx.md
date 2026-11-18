---
version: 1
slug: "src-components-dashboardc-dashboardc-jsx"
primary_target: "src/components/DashboardC/DashboardC.jsx"
related_targets: ["src/components/DashboardC/temi.css","src/components/DashboardC/DashboardC.module.css"]
---

# Dashboard · direzione Olivetti

Scope: la vista Dashboard nella versione "Olivetti" (data-versione="olivetti"), file DashboardC.jsx con variante "olivetti" e temi.css. Modalità: Operate.
Audience e compito: un freelance, una volta al mese al computer (aggiornamento con l'assistente), occhiate da telefono durante il mese. Deve leggere insieme valore dell'ora, tempo libero e durata dei soldi.
Vincoli: italiano; stesse funzioni e calcoli delle altre versioni (calcoli.js); tema chiaro e scuro; nessun dato inventato.

## Direction contract

THESIS: la dashboard come una macchina d'ufficio italiana ben disegnata: tre risposte uguali in alto e una tastiera di dodici mesi da premere. Rifiuta la griglia di card KPI tutte uguali e il cruscotto finanziario blu generico.

OWN-WORLD: grigio macchina (#E9E7E1) e bianco carta, nero dei tasti per azioni e testo, giallo Pintori solo per il tempo (ore libere, mese premuto), verde acqua→petrolio per la scala del €/h, blu per la cassa, rosso solo per allarmi. Albert Sans, numeri tabellari pesanti, angoli 10–14px, tasti con base più spessa.

STORY: scrivi all'assistente cosa è successo; leggi in tre colonne quanto vale la tua ora, quante ore hai libere, fino a quando bastano i soldi; premi un mese e vedi commesse, €/h e conti di quel mese; correggi un numero cliccandolo.

FIRST VIEWPORT: titolo del mese; assistente a tutta larghezza; riga di riepilogo con numeri cliccabili; tre risposte affiancate con lo stesso peso (ora con barre per commessa, tempo con dodici barre gialle, soldi con il mese di fine cassa). Azione primaria: "Chiedi" nell'assistente.

FORM: candidato 3 di 7 (grafica Olivetti: Pintori, Ballmer, Lettera 22); seed:a94d85963d488159. Mossa firma: la tastiera dei 12 mesi, tasti premibili con ore libere, cassa e F24, che guidano il dettaglio del mese.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Decisioni aperte: nessuna immagine raster; tiro senza catalogo (servizio non raggiungibile da questa sessione).
