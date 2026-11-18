# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Un solo utente: Francesco, consulente freelance (strategia, SEO, advertising) con 3–5 commesse attive in parallelo, in regime forfettario. La usa una volta al mese al computer per l'aggiornamento con l'assistente (incassi, ore, date di fine, cassa), e durante il mese con occhiate veloci dal telefono.

## Product Purpose

Una dashboard privata che, a partire da un messaggio mensile in linguaggio naturale, tiene aggiornati commesse, incassi, ore e patrimonio e risponde a tre domande insieme, con lo stesso peso:

1. quanto vale la sua ora, per cliente e in generale (€/h lordo, netto e reale);
2. quanto tempo libero ha da vendere, mese per mese, e quando finiscono i contratti;
3. quanto durano i soldi: cassa, tasse e scadenze F24, riserve vendibili (crypto, carte Pokémon), autonomia in mesi.

Successo: dopo l'aggiornamento mensile capisce in pochi secondi se è coperto, dove sta guadagnando bene e se deve cercare nuovi clienti o rinegoziare.

## Positioning

Non è un gestionale contabile: è il cruscotto di un freelance che ragiona in ore e mesi. L'input è una frase scritta all'assistente, non un modulo; il risultato collega tempo, guadagno orario e cassa nella stessa vista dei prossimi 12 mesi.

## Operating Context

- Rituale mensile: inizio mese, al computer, scrive all'assistente cosa è successo per ogni commessa; controlla e applica le modifiche proposte.
- Durante il mese: consultazione da telefono, sola lettura o piccole correzioni.
- Commesse con fee fissa mensile, a volte con una parte variabile; progetti a corpo; mesi con ore lavorate senza incasso.
- Tasse forfettario con acconti 50% giugno / 50% novembre; importi reali F24 dal commercialista.
- Accesso con PIN; dati sincronizzati su Supabase tramite API protetta; tema chiaro e scuro.

## Capabilities and Constraints

- React 19 + Vite, deploy su Vercel; calcoli condivisi in `src/components/Dashboard/calcoli.js`.
- Tre versioni nel menu: Orario (predefinita), Classica, e la nuova versione da questo rifacimento come terza scelta; nessuna va rimossa.
- Funzioni da mantenere: assistente in cima, riepilogo del mese, avvisi "Da sapere", griglia dei 12 mesi, €/h per cliente (anche reale da ore registrate), fisso + variabile, pipeline e simulatore, tasse/F24 modificabili, riserve con prezzo di vendita, obiettivi, anno mese per mese, riquadri di dettaglio modificabili, report PDF, promemoria .ics.
- Lingua dell'interfaccia: italiano.

## Brand Commitments

Nessun vincolo visivo: colori e stile lasciati alla scelta del designer. L'utente apprezza la Classica (crema e terracotta) più dei colori usati finora in Orario.

## Evidence on Hand

Dati reali dell'utente solo nel suo account (non nel repository). Per prove e screenshot si usano dati di esempio; nessun cliente, importo o claim va inventato nell'interfaccia.

## Product Principles

1. Le tre risposte (valore dell'ora, tempo libero, durata dei soldi) stanno insieme e si leggono in pochi secondi.
2. Scrivere all'assistente è l'azione principale: sempre in cima, sempre pronta.
3. I numeri veri battono le stime: ore e incassi registrati sostituiscono le previsioni dove esistono, e si vede quale è quale.
4. Ogni numero porta a un dettaglio dove si può correggere.
5. Funziona bene dal telefono per le occhiate, al computer per il rituale mensile.
