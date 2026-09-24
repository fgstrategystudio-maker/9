# Dieta – diario alimentare (PWA)

App per il telefono all'indirizzo `/dieta` del sito. Non richiede build: sono file statici.

- **Foto → cibo**: scatta o scegli una foto; Claude riconosce gli alimenti e stima porzioni, calorie e macro.
- **Testo → calorie e macro**: descrivi il pasto a parole ("80 g di pasta al pomodoro e una mela").
- **Prodotti di marca**: ricerca per nome e lettura del codice a barre nel database gratuito Open Food Facts; se un prodotto manca, l'AI legge l'etichetta dalla foto.
- **Ricerca rapida** tra alimenti recenti e comuni (funziona anche offline) e inserimento manuale.
- **Attività fisica**: allenamenti occasionali (27 sport, kcal stimate con i MET in base a peso, durata e intensità, oppure kcal dello smartwatch) che si aggiungono al budget del giorno; l'attività fissa quotidiana (es. 200 kcal) e lo stile di vita entrano nel fabbisogno.
- **Obiettivi**: giornalieri (kcal, proteine, carboidrati, grassi, fibre, acqua), del mese (peso a fine mese, giorni in target) e a lungo termine (peso e massa grassa obiettivo con data), con il calcolo del fabbisogno (Mifflin-St Jeor + giornata tipo + attività fissa ± obiettivo) che si aggiorna da solo quando cambia il peso.
- **Corpo**: peso, massa grassa, massa muscolare, acqua corporea, grasso viscerale e circonferenze, con grafici, BMI, massa magra e rapporti vita/fianchi e vita/altezza.
- **Progressi**: medie su 7/30/90/365 giorni, giorni in target, grafici calorie e peso, andamento settimanale e data di arrivo stimata.

## Installazione sul telefono
Apri `https://<tuo-dominio>/dieta` e poi:
- **iPhone (Safari)**: Condividi → "Aggiungi alla schermata Home".
- **Android (Chrome)**: menu ⋮ → "Installa app".

## Intelligenza artificiale
In **Obiettivi → Intelligenza artificiale** scegli:
- **Google Gemini (gratis)**: chiave da aistudio.google.com, senza carta. Ha un limite di richieste al giorno e sul piano
  gratuito Google può usare i dati inviati. "Prova" aggiorna l'elenco dei modelli disponibili.
- **Claude (a pagamento)**: chiave da console.anthropic.com, pochi centesimi a foto, riconoscimento più preciso.

Le chiavi restano solo sul telefono (localStorage) e vengono inviate solo al servizio scelto.

## Dati
Diario, misure e obiettivi restano nel browser del telefono. Usa "Esporta backup" per salvarli o spostarli su un altro dispositivo.
Quando modifichi i file, aumenta `VERSION` in `sw.js` così il telefono scarica la nuova versione.
