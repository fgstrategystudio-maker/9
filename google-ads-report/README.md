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

- obiettivo: `lead` oppure `ecommerce`;
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
| `ANTHROPIC_API_KEY` | *facoltativo*: attiva il commento scritto da Claude |

Facoltativo, sotto la scheda **Variables**: `SMTP_FROM_NAME`, il nome del mittente (es. "Francesco Gizzi").

### 8. Prova

Vai in **Actions → Report Google Ads → Run workflow**:

1. Prima con `demo` attivo: arrivano le email con dati di esempio, così vedi il formato.
2. Poi senza demo, con `momento` = `inizio`: il report usa i dati reali del mese scorso.

Da quel momento parte da solo nei giorni 1, 15 e a fine mese, verso le 7 del mattino. Se un account non si scarica, il report interno lo segnala e il workflow risulta in errore, quindi GitHub ti avvisa via email.

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
