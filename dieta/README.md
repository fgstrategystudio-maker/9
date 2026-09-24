# Dieta – diario alimentare (PWA)

App per il telefono all'indirizzo `/dieta` del sito. Non richiede build: sono file statici.

- **Foto → cibo**: scatta o scegli una foto; Claude riconosce gli alimenti e stima porzioni, calorie e macro.
- **Testo → calorie e macro**: descrivi il pasto a parole ("80 g di pasta al pomodoro e una mela").
- **Ricerca rapida** tra alimenti recenti e comuni (funziona anche offline) e inserimento manuale.
- **Obiettivi**: giornalieri (kcal, proteine, carboidrati, grassi, fibre, acqua), del mese (peso a fine mese, giorni in target) e a lungo termine (peso e massa grassa obiettivo con data), con un calcolatore (Mifflin-St Jeor).
- **Corpo**: peso, massa grassa, massa muscolare, acqua corporea, grasso viscerale e circonferenze, con grafici, BMI, massa magra e rapporti vita/fianchi e vita/altezza.
- **Progressi**: medie su 7/30/90/365 giorni, giorni in target, grafici calorie e peso, andamento settimanale e data di arrivo stimata.

## Installazione sul telefono
Apri `https://<tuo-dominio>/dieta` e poi:
- **iPhone (Safari)**: Condividi → "Aggiungi alla schermata Home".
- **Android (Chrome)**: menu ⋮ → "Installa app".

## Chiave API
In **Obiettivi → Impostazioni** incolla una chiave creata su console.anthropic.com. Resta salvata solo sul telefono
(localStorage) e viene inviata solo a `api.anthropic.com`. Il costo è per richiesta. Con Claude Opus 5 una foto
costa pochi centesimi; con Sonnet 5 o Haiku 4.5 costa meno.

## Dati
Diario, misure e obiettivi restano nel browser del telefono. Usa "Esporta backup" per salvarli o spostarli su un altro dispositivo.
Quando modifichi i file, aumenta `VERSION` in `sw.js` così il telefono scarica la nuova versione.
