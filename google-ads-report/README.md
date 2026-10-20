# Report automatici Google Ads

Ogni mese, senza interventi manuali:

| Quando | Report | Periodo analizzato |
|---|---|---|
| **Giorno 1** | Chiusura mese | Mese precedente completo, confronto con il mese prima e con lo stesso mese dell'anno scorso |
| **Giorno 15** | Controllo di metà mese | Dal giorno 1 a ieri, confronto con gli stessi giorni del mese prima, proiezione della spesa |
| **Ultimo giorno** | Pre-chiusura | Dal giorno 1 a ieri, proiezione finale e impostazione del mese successivo |

Per ogni esecuzione vengono prodotti:

- **Report interno** (una sola email, per te). Contiene una tabella di tutti i clienti con un semaforo e, per ciascun account:
  - punti di attenzione in ordine di priorità, ognuno con l'azione consigliata;
  - cosa è cambiato: KPI, campagne e cronologia delle modifiche;
  - cosa migliorare;
  - candidati keyword negative e keyword con punteggio di qualità basso.
- **Report cliente**: un report classico con i numeri principali, il budget, un commento in linguaggio semplice, la tabella delle campagne e i prossimi passi. Per ogni cliente scegli in quali momenti riceverlo. Il report arriva a te da inoltrare oppure parte direttamente al cliente.
- **Report cliente per ristoranti e locali** (obiettivo `negozio`): un PDF in uno di due layout, scelto per cliente con `layout:`:
  - `advisory` (predefinito): una sezione per locale, adatto ai gruppi con più insegne;
  - `grano`: copertina centrata e sezioni numerate (sintesi, tre mesi a confronto, canali, lingue, giorni e orari, ritorno economico, prossimi passi), con `colore` per titoli e tabelle e `colore_titoletti` per i sottotitoli.

  Ogni report contiene:
  - visite al negozio (rilevate o stimate) e la stima consolidata;
  - azioni ad alto intento: indicazioni stradali, contatti, ordini;
  - confronto con i due mesi precedenti;
  - canali (Ricerca, Maps, YouTube) e lingue (gruppi di asset);
  - orari e giorni di conversione;
  - stato della campagna ("Limitato dal budget", "In apprendimento") e prossimi passi.

  Più locali dello stesso cliente (`locali:`) finiscono in un unico report, con la sintesi del gruppo e il calcolo del fatturato attribuibile e del compenso (fee in percentuale oppure compenso fisso con ROI e ROAS). Non sono disponibili via API, e vanno aggiunti a mano se servono:
  - aste e concorrenza (TheFork, JustEat);
  - fasce d'età delle campagne Performance Max;
  - temi di ricerca "incrementali".

Tutto gira gratis su GitHub Actions con le API ufficiali. L'unico costo facoltativo è il commento scritto da Claude (vedi [Costi](#costi)).

## Come funziona

```
GitHub Actions (cron) ──► Google Ads API ──► analisi.py (regole) ──► commento.py ──► render.py ──► email
                          (fonte_google_ads)   punti di attenzione     regole o Claude   HTML          (invio.py)
```

- `report_ads/periodi.py`: quali giorni analizzare e con cosa confrontarli.
- `report_ads/fonte_google_ads.py`: le query alla Google Ads API (GAQL).
- `report_ads/fonte_demo.py`: dati finti realistici per provare tutto senza credenziali.
- `report_ads/analisi.py`: KPI, ritmo di spesa e **regole dei punti di attenzione**. Le soglie sono in cima al file.
- `report_ads/commento.py`: testi automatici (gratis) oppure commento di Claude, se c'è la chiave.
- `report_ads/templates/`: i due report HTML, compatibili con le email.

## Configurazione (una volta sola)

> **Novità 2026:** Google ha ritirato il *developer token* il 9 settembre 2026. Il livello di accesso
> alla API ora dipende dal **progetto Google Cloud** con cui generi le credenziali OAuth, e si
> richiede dalla Cloud Console, non più dal Centro API di Google Ads.

### 1. Account amministratore Google Ads (MCC)

Se non lo hai già, crea un [account amministratore](https://ads.google.com/home/tools/manager-accounts/) (è gratuito). Collega gli account dei clienti e il tuo: dall'MCC invii una richiesta di collegamento e il cliente la accetta. Con un MCC basta un solo accesso per leggere tutti gli account.

### 2. Progetto Google Cloud e client OAuth (gratuito)

1. Su [console.cloud.google.com](https://console.cloud.google.com) crea un progetto, ad esempio "report-google-ads". Poi vai in **API e servizi → Libreria** e abilita la **Google Ads API**.
2. Vai in **API e servizi → Schermata consenso OAuth** (oggi si chiama "Google Auth Platform"):
   - imposta il pubblico su **Esterno** e aggiungi la tua email;
   - pubblica l'app nello stato **In produzione**. Se resta in "Test", il refresh token scade dopo 7 giorni e i report smettono di funzionare;
   - nella scheda **Branding** inserisci nome dell'app, logo, il sito `francescogizzi.com` e i link a privacy e termini, poi avvia la **verifica del brand**. Serve per ottenere l'accesso Basic.
3. In **Client → Crea client** scegli il tipo "App desktop" e copia Client ID e Client Secret.

### 3. Livello di accesso alla Google Ads API

Nella Cloud Console apri la pagina **Google Ads API** (panoramica dell'API): lì vedi il livello attuale del progetto e c'è il pannello per richiedere un livello superiore ("Upgrade access level").

| Livello | Account reali | Limite | Come si ottiene |
|---|---|---|---|
| Test | no, solo account di test | – | automatico |
| **Explorer** | **sì** | 2.880 operazioni al giorno | richiesta dalla Cloud Console |
| Basic | sì | 15.000 operazioni al giorno | richiesta con verifica del brand, approvazione automatica |
| Standard | sì | illimitato | revisione manuale |

**Per i report basta Explorer**: ogni esecuzione usa circa 12 richieste per cliente, quindi anche con 30 clienti resti sotto le 400 al giorno. Explorer esclude solo creazione di account, gestione utenti, fatturazione e Keyword Planner, che qui non servono. Nella richiesta descrivi l'uso: "reportistica interna in sola lettura sui miei account e su quelli dei miei clienti, gestiti tramite il mio account amministratore".

Finché il progetto è al livello Test puoi provare tutto con `--demo`.

### 4. Refresh token

Sul tuo computer:

```bash
pip install google-auth-oauthlib
python google-ads-report/genera_refresh_token.py
```

Accedi con l'utente Google che gestisce l'MCC: lo script stampa il refresh token. Il token è legato al progetto Cloud del passo 2, ed è da quel progetto che dipende il livello di accesso.

### 5. Email (Gmail, gratuito)

Sull'account Gmail che invierà i report attiva la verifica in due passaggi e crea una [password per le app](https://myaccount.google.com/apppasswords). Gmail permette circa 500 invii al giorno, molti più di quelli che servono.

### 6. Configurazione clienti

Parti da `clienti.esempio.yaml`. Per ogni cliente puoi impostare:

- obiettivo: `lead`, `ecommerce` oppure `negozio`. Con `negozio` (ristoranti e locali fisici) il risultato principale sono le **visite al negozio**: se Google le misura sull'account si usano quelle, altrimenti vengono stimate come il 27% delle indicazioni stradali (la percentuale si cambia con `quota_visite_indicazioni`). Il campo `cpa_target` diventa il costo per visita target;
- budget mensile, CPA o ROAS target;
- email del cliente e momenti in cui ricevere il report;
- se l'invio al cliente è automatico;
- note di contesto per il commento.

> **Il repository è pubblico.** Non mettere nomi, ID o email dei clienti in file del repository: la configurazione reale va **solo** nel Secret `CLIENTI_YAML`. Per le prove in locale usa `clienti.yaml`, che è escluso da git.

### 7. Secrets su GitHub

Vai in **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valore |
|---|---|
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` | client OAuth (passo 2) |
| `GOOGLE_ADS_REFRESH_TOKEN` | refresh token (passo 4) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ID dell'MCC, es. `123-456-7890` |
| `SMTP_USER` / `SMTP_PASSWORD` | indirizzo Gmail e password per le app (passo 5) |
| `REPORT_EMAIL_INTERNA` | dove ricevi il report interno e i report da inoltrare |
| `CLIENTI_YAML` | il contenuto completo del tuo file clienti |
| `ANTHROPIC_API_KEY` | *facoltativo*: Claude scrive i testi dei report ragionando su risultati e storico |

Facoltativo, sotto la scheda **Variables**: `SMTP_FROM_NAME`, il nome del mittente (es. "Francesco Gizzi").

### 8. Prova

Vai in **Actions → Report Google Ads → Run workflow**:

1. Prima con `demo` attivo: arrivano le email con dati di esempio, così vedi il formato.
2. Poi senza demo, con `momento` = `inizio`: il report usa i dati reali del mese scorso.

Da quel momento parte da solo nei giorni 1, 15 e a fine mese, verso le 7 del mattino. Se un account non si scarica, il report interno lo segnala e il workflow risulta in errore, quindi GitHub ti avvisa via email.

## Testi del mese nei report (Secret `NOTE_MESE`)

Le azioni fatte nel mese e le priorità che vuoi scrivere tu vanno nel Secret **`NOTE_MESE`**: non serve toccare `CLIENTI_YAML`. Prima del report del 1° del mese aggiorna il Secret con un testo come questo:

```yaml
mese: "2026-10"            # il mese di cui parla il report (quello del 1° novembre è ottobre)
Gruppo Esempio:            # nome del cliente: compare nella sintesi finale
  fatto: Pulizia dei termini di ricerca e nuovi temi per lingua su tutte le insegne.
  prossimi_passi:
    - "Difesa del brand: attivare campagne sul nome dei locali."
    - "Gestire le recensioni: risposte regolari su tutti i profili."
Locale Uno:                # nome di un locale del gruppo: "Cosa abbiamo fatto" nella sua sezione
  fatto: Nuovi temi di ricerca in francese e spagnolo.
Ristorante Esempio:
  fatto: Aggiornati 24 temi in tedesco e 18 in spagnolo.
```

- I nomi devono essere identici a quelli di `CLIENTI_YAML`.
- In `prossimi_passi`, il testo prima dei due punti diventa il titolo e quello dopo la descrizione.
- Se scrivi le note di un locale, sostituiscono il testo automatico ricavato dalla cronologia delle modifiche.
- Se il `mese` non corrisponde al report, le note vengono ignorate: così quelle vecchie non finiscono nel report sbagliato.
- Se dimentichi di aggiornarle, il report parte comunque, con i soli testi automatici.
- Per un cliente puoi aggiungere anche `focus` (riga in copertina) e `sezioni`, sezioni libere con titolo e testo per ciò che l'API non fornisce (aste e concorrenza, fasce d'età, temi di ricerca):

```yaml
Ristorante Esempio:
  focus: lingue e temi di ricerca
  sezioni:
    - titolo: La concorrenza
      testo: |
        TheFork resta il primo concorrente nelle aste, con una quota di impressioni del 45%.
```

## Storia dei clienti (Secret `CONTESTO_CLIENTI`, facoltativo)

Qui scrivi una volta sola la storia di ogni cliente, e la aggiorni solo quando cambia qualcosa di importante. Va indicato quando è partita la gestione, le decisioni prese, cosa hai già detto nei report precedenti e le regole concordate. Claude la legge per dare continuità ai testi, ma non viene stampata nei report.

```yaml
Gruppo Esempio: |
  Gestione partita a luglio. Dal 2 ottobre ogni locale ha anche una campagna Search sul proprio nome...
Locale Uno:
  visite_comunicate: {"2026-09": 1215}   # visite scritte nei report già inviati, per mese
  testo: |
    Tracking visite attivo da agosto, limitato dal budget.
```

`visite_comunicate` serve solo per i report inviati prima dell'automazione. Da lì in poi il programma ricorda da solo cosa ha scritto (vedi sotto). Con questi numeri il report del mese dopo mostra l'attribuzione a 30 giorni, cioè le visite scritte nel report precedente confrontate con quelle consolidate di oggi. Con la fee in percentuale sulle visite del mese (`base: mese`), calcola anche il conguaglio.

## Memoria dei report inviati (automatica)

Dopo l'invio dei report del 1° del mese il programma salva, per ogni locale, le visite e i numeri scritti nel report e i testi. Il mese dopo li usa per l'attribuzione a 30 giorni e il conguaglio, e li passa a Claude per dare continuità ai testi. Non devi fare nulla.

- Il file è cifrato (`stato.enc`) e sta sul ramo `stato-report` del repository, che contiene solo quel file. Senza la chiave non si legge.
- La chiave è ricavata dal Secret `GOOGLE_ADS_CLIENT_SECRET`. Se preferisci una chiave separata, crea il Secret `STATO_CHIAVE`; cambiando chiave la memoria riparte da zero.
- I numeri scritti a mano in `visite_comunicate` valgono solo per i mesi che la memoria non ha.

Per tenere fuori dal fatturato attribuibile le visite di alcune campagne, per esempio le Search sul nome del locale, aggiungi `escludi: [SEARCH]` al `compenso` del cliente.

## Testi scritti da Claude

Con il Secret `ANTHROPIC_API_KEY` i testi dei report PDF (letture delle tabelle, sintesi, prossimi passi) e il commento interno sono scritti da Claude ogni volta, partendo dai numeri del report, dai mesi precedenti, dallo stesso mese dell'anno prima, dallo stato delle campagne e dalle note del mese. Tabelle, numeri e testi delle note restano quelli calcolati. Se la chiamata non riesce, il report parte con i testi automatici; il log dice quali testi sono stati usati.

## Prova in locale

```bash
cd google-ads-report
pip install -r requirements.txt
python -m report_ads --config clienti.esempio.yaml --demo --momento meta --data 2026-10-15
# i report sono in google-ads-report/output/
```

Opzioni:

- `--momento auto|inizio|meta|fine`;
- `--data AAAA-MM-GG` per simulare un giorno;
- `--demo`;
- `--invia`, che richiede le variabili SMTP.

## Costi

| Voce | Costo |
|---|---|
| Google Ads API (livello Explorer o Basic), Google Cloud, OAuth | 0 € |
| GitHub Actions | 0 €: su un repository pubblico i minuti sono illimitati, ogni esecuzione dura 1-2 minuti |
| Invio email con Gmail | 0 € |
| Commento AI (facoltativo) | circa 0,05-0,10 € per cliente per report con il modello predefinito (`claude-opus-5-5`, effort `medium`) |

Con 10 clienti e 3 report al mese il commento AI costa circa 2-3 € al mese. Per spendere ancora meno puoi:

- usare un modello più economico, impostando la variabile d'ambiente `CLAUDE_MODEL` (es. `claude-haiku-5-5`, circa 40 volte meno);
- lasciare vuoto `ANTHROPIC_API_KEY`: i commenti vengono generati dalle regole, a costo zero.

## Personalizzare

- **Sensibilità degli avvisi**: modifica le costanti `SOGLIA_*` in cima a `report_ads/analisi.py`.
- **Nuove regole**: aggiungi un blocco in `analizza()` che crea un `Punto(gravita, area, titolo, dettaglio, azione)`. Se l'area è nuova, aggiungi in `commento.py` (`PASSI_CLIENTE`) come presentarla al cliente.
- **Grafica**: i template sono in `report_ads/templates/`. Il colore del report cliente si imposta in `agenzia.colore`.

## Limiti da conoscere

- La cronologia delle modifiche via API copre solo gli **ultimi 30 giorni**. Nel report di inizio mese, quindi, mostra le modifiche dal 30° giorno precedente in poi.
- I termini di ricerca riguardano solo le campagne Search e Shopping. Per Performance Max Google espone dati più limitati.
- La quota impressioni è disponibile solo per le campagne Search.
