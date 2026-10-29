"""Genera pagine dedicate, guida e privacy della Tenuta Colle delle Rose.

Uso:  python3 _build/pages.py   (dalla cartella tenuta-colle-delle-rose)
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from layout import page, img, SITE, EMAIL, PHONE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATE = "29 ottobre 2026"
DATE_ISO = "2026-10-29"

LISTING = {"@id": SITE + "/#listing"}


def webpage(path, name, desc, lang="it-IT"):
    return {"@type": "WebPage", "@id": SITE + path, "url": SITE + path, "name": name,
            "description": desc, "inLanguage": lang, "about": LISTING,
            "isPartOf": {"@id": SITE + "/#website"}}


def article(path, headline, desc, image):
    return {"@type": "Article", "@id": SITE + path + "#article", "headline": headline,
            "description": desc, "inLanguage": "it-IT", "image": SITE + "/img/" + image + ".webp",
            "datePublished": DATE_ISO, "dateModified": DATE_ISO, "mainEntityOfPage": SITE + path,
            "author": {"@type": "Organization", "name": "Tenuta Colle delle Rose", "url": SITE + "/"},
            "publisher": {"@type": "Organization", "name": "Tenuta Colle delle Rose", "url": SITE + "/"}}


def faq(items, lang="it-IT"):
    return {"@type": "FAQPage", "inLanguage": lang, "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}


def faq_html(items):
    return "\n".join('<details><summary>%s</summary><div class="ans"><p>%s</p></div></details>' % (q, a)
                     for q, a in items)


# ---------------------------------------------------------------------------
# Collegamenti comuni
# ---------------------------------------------------------------------------
P = {
    "agri": ("/agriturismo-in-vendita-roma", "agriturismo-riano-sala-ristorante-camino", "Agriturismo",
             "Agriturismo in vendita a Roma Nord", "8 camere, sala da 70 coperti e società agricola con autorizzazioni."),
    "matr": ("/location-matrimoni-in-vendita-roma", "restyling-stile-boutique-sala", "Eventi",
             "Location per matrimoni in vendita vicino Roma", "Sala, veranda, prati panoramici e un fienile in tufo da trasformare."),
    "equi": ("/centro-equestre-in-vendita-roma", "riqualificazione-stalla", "Equitazione",
             "Centro equestre in vendita a Roma Nord", "Stalla da 750 mq, fienile e 21 ettari per paddock e percorsi."),
    "terr": ("/terreno-agricolo-in-vendita-riano", "tenuta-riano-terreni-seminativo", "Terreni",
             "Terreno agricolo in vendita a Riano", "20,9 ettari di seminativo e bosco in un solo corpo, con fabbricati."),
    "g2": ("/guida/cambiare-vita-trasferirsi-in-campagna-vicino-roma", "tenuta-riano-viale-ulivi-drone", "Cambiare vita",
           "Cambiare vita: dalla città alla campagna, a 30 minuti da Roma", "Più spazio e più tempo, senza rinunciare a Roma. Come farlo davvero."),
    "g6": ("/guida/vivere-in-campagna-con-gli-animali", "tenuta-riano-terreni-uliveto", "Animali",
           "Vivere in campagna con gli animali", "Cavalli, galline, capre, cani e un orto: spazi, regole e costi."),
    "g1": ("/guida/aprire-e-gestire-un-agriturismo", "agriturismo-riano-porticato", "Agriturismo",
           "Aprire o gestire un agriturismo: requisiti, passi e numeri", "Chi può farlo, cosa serve e quanto può rendere."),
    "g4": ("/guida/sgravi-fiscali-e-incentivi-agricoltura", "tenuta-riano-terreni-seminativo", "Incentivi",
           "Sgravi fiscali e incentivi per chi sceglie l'agricoltura", "Imposte ridotte, IMU, mutui agevolati e contributi per giovani."),
    "g5": ("/guida/vivere-a-roma-con-la-natura-intorno", "tenuta-riano-vista-aerea-colline", "Trasferirsi",
           "Trasferirsi a Roma con la natura intorno", "Per chi arriva da un'altra città o dall'estero e non vuole vivere nel traffico."),
    "g3": ("/guida/bonifica-amianto-azienda-agricola", "tenuta-riano-corte-fienile-tufo", "Scheda tecnica",
           "Bonifica dell'amianto in un'azienda agricola", "Procedura, costi indicativi e contributi per stalle e fienili."),
}


def rel(*keys):
    return [P[k] for k in keys]


def links(*keys):
    return [(P[k][3], P[k][0]) for k in keys]


def write(path, content):
    fp = os.path.join(ROOT, path.lstrip("/") + ("index.html" if path.endswith("/") else ".html"))
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w").write(content)
    print("scritto", fp.replace(ROOT + "/", ""))


CR_HOME = ("Home", "/")

# ---------------------------------------------------------------------------
# 1. Agriturismo in vendita a Roma
# ---------------------------------------------------------------------------
path = "/agriturismo-in-vendita-roma"
F1 = [
    ("L'agriturismo è già attivo?", "La tenuta è proposta insieme alla società agricola, che ha le autorizzazioni per agriturismo, ristorazione e macelleria. Le camere e la sala sono arredate. I tempi per riaprire dipendono dal subentro e vanno verificati in trattativa."),
    ("Quante camere ha l'agriturismo?", "Otto camere per gli ospiti, oltre a quattro unità abitative che possono ospitare la famiglia, il personale o nuove camere."),
    ("Quanto costa l'agriturismo?", "La tenuta completa, con 21 ettari, fabbricati e società agricola, è in vendita a 869.000 euro, sotto la stima di mercato di oltre un milione."),
]
body = f'''<p>Cerchi un <strong>agriturismo in vendita a Roma</strong> che non sia un rudere da ricostruire? La Tenuta Colle delle Rose, a Riano, ha già quello che di solito richiede anni: le camere, una sala ristorante arredata, i permessi e la terra intorno. È a 25 km dal centro di Roma, lungo la Via Flaminia.</p>
<dl class="facts">
  <div><dt>Camere</dt><dd>8</dd></div>
  <div><dt>Coperti</dt><dd>~70</dd></div>
  <div><dt>Terreni</dt><dd>20,9 ha</dd></div>
  <div><dt>Da Roma</dt><dd>25 km</dd></div>
  <div><dt>Prezzo</dt><dd>€ 869.000</dd></div>
</dl>
<h2>Cosa trovi già pronto</h2>
<ul>
  <li><strong>8 camere</strong> per gli ospiti, arredate, con pavimenti in cotto.</li>
  <li><strong>Sala ristorante da circa 70 coperti</strong> con camino in mattoni, credenze e tavoli in legno.</li>
  <li><strong>Sala colazioni</strong> con portafinestra sul giardino e <strong>veranda coperta</strong> per cene all'aperto.</li>
  <li><strong>Società agricola</strong> con autorizzazioni per agriturismo, ristorazione e macelleria: puoi servire e vendere le carni allevate in azienda.</li>
  <li><strong>Quattro unità abitative</strong> (328 mq catastali) per chi gestisce la struttura o per ampliare l'offerta.</li>
</ul>
<figure>{img("agriturismo-riano-sala-ristorante-camino", "Sala ristorante dell'agriturismo in vendita a Riano con camino e tavoli in legno")}<figcaption class="caption">La sala ristorante con il camino, oggi.</figcaption></figure>
<h2>Perché un agriturismo a Roma Nord</h2>
<p>Roma è una delle città più visitate al mondo, ma chi alloggia in centro cerca sempre più spesso un giorno o un weekend in campagna. A Riano la campagna è vera: prati, uliveti e boschi lungo i fossi. Allo stesso tempo, la Flaminia e il Grande Raccordo Anulare portano a Roma in 30–40 minuti. È la distanza giusta per tre tipi di clienti:</p>
<ul>
  <li>i <strong>romani</strong> che cercano pranzi della domenica, feste e weekend vicino casa;</li>
  <li>i <strong>turisti</strong> che vogliono dormire in campagna e visitare Roma in giornata;</li>
  <li>le <strong>aziende</strong> che organizzano eventi e giornate di team building fuori città.</li>
</ul>
<h2>Cosa serve per ripartire</h2>
<p>Il grosso dell'investimento, cioè edifici, arredi e permessi, è già fatto. Per riaprire servono tre passaggi:</p>
<ol>
  <li><strong>Subentro nella società agricola</strong> e verifica delle autorizzazioni con Comune e Regione Lazio. Nel Lazio l'agriturismo deve restare collegato all'attività agricola, che quindi va mantenuta attiva.</li>
  <li><strong>Restyling degli interni</strong>: da 2 a 6 settimane secondo lo stile scelto, senza lavori strutturali. Nella pagina principale trovi <a href="/#prima-dopo">tre stili con prima e dopo</a>.</li>
  <li><strong>Promozione</strong>: sito, portali di prenotazione, Google e social, partendo dalle foto e dai video già disponibili.</li>
</ol>
<h2>Quanto può incassare</h2>
<p>Con 8 camere a 110 euro a notte e un'occupazione del 45%, le sole camere valgono circa 144.000 euro lordi l'anno. Quindici eventi da 80 invitati a 70 euro a persona aggiungono circa 84.000 euro. Puoi provare altre combinazioni con il <a href="/#rendimento">simulatore dei ricavi</a> e leggere la <a href="/guida/aprire-e-gestire-un-agriturismo#numeri">guida su come aprire e gestire un agriturismo</a>.</p>
<h2>Cosa sapere prima di comprare</h2>
<p>Le coperture di stalla e fienile sono in cemento-amianto e vanno bonificate. È un costo noto, che riguarda gli edifici agricoli e non l'agriturismo. Ne parliamo in dettaglio nella <a href="/guida/bonifica-amianto-azienda-agricola">guida alla bonifica dell'amianto</a>. Per tutti gli altri controlli, ecco <a href="/guida/aprire-e-gestire-un-agriturismo">cosa serve per aprire e gestire un agriturismo</a>.</p>
<h2>Domande frequenti</h2>
<div class="faq">
{faq_html(F1)}
</div>'''
write(path, page(
    lang="it", path=path,
    title="Agriturismo in vendita a Roma Nord · 8 camere e 21 ettari | Riano",
    desc="Agriturismo in vendita a Riano, 25 km da Roma: 8 camere, sala ristorante da 70 coperti, società agricola con autorizzazioni e 21 ettari di terreno. € 869.000.",
    keywords="agriturismo in vendita Roma, agriturismo in vendita Roma nord, agriturismo in vendita Lazio, agriturismo con terreno in vendita, vendita agriturismo Riano",
    h1="Agriturismo in vendita a Roma Nord", eyebrow="Riano · 25 km da Roma · € 869.000",
    lead="Otto camere, una sala da 70 coperti, le autorizzazioni e 21 ettari di terra. Un agriturismo da far ripartire, non da costruire.",
    hero="agriturismo-riano-porticato", hero_alt="Porticato e terrazza dell'agriturismo in vendita a Riano, Roma Nord",
    body=body, crumbs=[CR_HOME, ("Agriturismo in vendita a Roma", None)],
    related=rel("g1", "g2", "matr"),
    aside_links=links("matr", "equi", "terr", "g1", "g2"),
    schema=[webpage(path, "Agriturismo in vendita a Roma Nord", "Agriturismo con 8 camere e 21 ettari in vendita a Riano (Roma)."), faq(F1)]))

# ---------------------------------------------------------------------------
# 2. Location matrimoni in vendita
# ---------------------------------------------------------------------------
path = "/location-matrimoni-in-vendita-roma"
F2 = [
    ("Si possono già organizzare matrimoni?", "La sala da circa 70 coperti, la veranda e i prati si prestano a ricevimenti. Per un'attività di eventi stabile vanno verificati con il Comune i permessi e le condizioni di sicurezza per il numero di invitati previsto."),
    ("Quanti invitati può ospitare?", "La sala interna conta circa 70 coperti. Veranda, prati e il fienile da 400 mq, una volta recuperato, permettono di progettare spazi per ricevimenti più grandi."),
    ("Ci sono camere per gli sposi e gli ospiti?", "Sì, l'agriturismo ha 8 camere, più quattro unità abitative nel casale."),
]
body = f'''<p>Le coppie che si sposano a Roma cercano sempre più spesso una <strong>location in campagna</strong>: un casale vero, prati per l'aperitivo, una sala per la cena e camere dove fermarsi. La Tenuta Colle delle Rose ha tutto questo a mezz'ora dal centro. Se stai cercando una <strong>location per matrimoni in vendita vicino Roma</strong>, qui la base c'è già.</p>
<dl class="facts">
  <div><dt>Sala</dt><dd>~70 coperti</dd></div>
  <div><dt>Fienile</dt><dd>400 mq</dd></div>
  <div><dt>Camere</dt><dd>8</dd></div>
  <div><dt>Terreni</dt><dd>20,9 ha</dd></div>
</dl>
<h2>Gli spazi per un matrimonio</h2>
<ul>
  <li><strong>Viale di ulivi</strong> all'ingresso: il primo colpo d'occhio per gli invitati e lo sfondo per le foto.</li>
  <li><strong>Prati panoramici</strong> sul crinale, con vista sulle colline verso Roma: perfetti per il rito civile all'aperto, l'aperitivo e il taglio della torta.</li>
  <li><strong>Sala con camino</strong> da circa 70 coperti per la cena o per i mesi freddi.</li>
  <li><strong>Veranda coperta</strong> in mattoni e legno: con luci e piante diventa uno spazio da cena sotto le stelle.</li>
  <li><strong>Fienile in tufo da 400 mq</strong>: dopo la bonifica del tetto e il recupero, può diventare una grande sala ricevimenti coperta con pareti in pietra a vista.</li>
  <li><strong>8 camere</strong> per gli sposi, i familiari e gli ospiti che arrivano da fuori.</li>
</ul>
<figure>{img("restyling-stile-boutique-sala", "Ipotesi di allestimento per matrimoni della sala e della veranda dell'agriturismo", 900, 675)}<figcaption class="caption">Simulazione di allestimento in stile country chic: salone, angolo camino e veranda.</figcaption></figure>
<h2>Perché funziona come investimento</h2>
<p>Una location per eventi guadagna su più fronti: affitto degli spazi, catering, pernottamenti e servizi come fiori, musica e allestimenti. In più la tenuta lavora anche fuori stagione, con eventi aziendali, compleanni, battesimi e cene private. Con la cucina e la macelleria dell'azienda puoi servire un menu a filiera corta, che oggi molte coppie chiedono.</p>
<p>La posizione aiuta: 25 km dal centro di Roma lungo la Flaminia, circa 50 km dall'aeroporto di Fiumicino per gli invitati dall'estero. I fornitori di Roma arrivano senza problemi e gli ospiti possono tornare in città la sera stessa.</p>
<h2>Cosa prevedere</h2>
<ul>
  <li><strong>Restyling</strong> della sala e delle camere: da poche settimane, senza opere strutturali.</li>
  <li><strong>Bonifica dell'amianto</strong> sui tetti di stalla e fienile prima di recuperarli. <a href="/guida/bonifica-amianto-azienda-agricola">Qui la procedura e i costi indicativi</a>.</li>
  <li><strong>Permessi per gli eventi</strong>: agibilità, sicurezza e impatto acustico vanno verificati con il Comune in base al numero di invitati.</li>
</ul>
<h2>Domande frequenti</h2>
<div class="faq">
{faq_html(F2)}
</div>'''
write(path, page(
    lang="it", path=path,
    title="Location per matrimoni in vendita vicino Roma · Tenuta con sala e 8 camere",
    desc="Tenuta in vendita a Riano, 25 km da Roma, ideale come location per matrimoni ed eventi: sala da 70 coperti, veranda, prati panoramici, fienile in tufo e 8 camere. € 869.000.",
    keywords="location matrimoni in vendita Roma, location eventi in vendita Roma, casale per matrimoni in vendita, villa per eventi in vendita Roma nord, tenuta per matrimoni Lazio",
    h1="Location per matrimoni in vendita vicino Roma", eyebrow="Sala · veranda · prati · fienile in tufo",
    lead="Un casale in collina a 30 minuti da Roma, con sala per 70 invitati, 8 camere e spazi esterni pronti per diventare una location di matrimoni.",
    hero="tenuta-riano-vista-aerea-colline", hero_alt="La tenuta in collina a Riano vista dall'alto, possibile location per matrimoni vicino Roma",
    body=body, crumbs=[CR_HOME, ("Location per matrimoni in vendita", None)],
    related=rel("agri", "equi", "g3"),
    aside_links=links("agri", "equi", "terr", "g2", "g3"),
    schema=[webpage(path, "Location per matrimoni in vendita vicino Roma", "Tenuta con sala, veranda e 8 camere in vendita a Riano, adatta a matrimoni ed eventi."), faq(F2)]))

# ---------------------------------------------------------------------------
# 3. Centro equestre in vendita
# ---------------------------------------------------------------------------
path = "/centro-equestre-in-vendita-roma"
F3 = [
    ("Quanti box si possono ricavare nella stalla?", "Dipende dal progetto: misure dei box, corsie e locali di servizio. Con 750 mq a una campata si ragiona su alcune decine di box; il numero esatto va definito con un tecnico."),
    ("I terreni sono adatti ai paddock?", "Sì, sono 19,5 ettari di prati e seminativo in leggera collina, con sistemi di scolo e confini naturali alberati."),
    ("Si può fare un maneggio coperto?", "Il fienile da 400 mq, alto e aperto, si presta a un piccolo campo coperto o al ricovero di fieno e attrezzature, dopo la bonifica della copertura."),
]
body = f'''<p>Roma ha una lunga tradizione equestre e una domanda costante di <strong>pensioni per cavalli, scuole di equitazione e maneggi</strong> raggiungibili dalla città. La Tenuta Colle delle Rose offre gli spazi giusti: una stalla da 750 mq, un fienile, 21 ettari di prati e la vicinanza a percorsi nella campagna di Roma Nord.</p>
<dl class="facts">
  <div><dt>Stalla</dt><dd>750 mq</dd></div>
  <div><dt>Fienile</dt><dd>400 mq</dd></div>
  <div><dt>Prati e seminativo</dt><dd>19,5 ha</dd></div>
  <div><dt>Da Roma</dt><dd>25 km</dd></div>
</dl>
<h2>Gli spazi per i cavalli</h2>
<ul>
  <li><strong>Stalla da 750 mq</strong> a una campata, già accatastata come fabbricato agricolo: si presta a una scuderia con box, selleria e locale per il maniscalco.</li>
  <li><strong>Fienile da 400 mq</strong> per fieno e lettiera, oppure campo coperto per lavorare con il maltempo.</li>
  <li><strong>19,5 ettari</strong> di prati per paddock, campo prova all'aperto e produzione di foraggio.</li>
  <li><strong>Quattro abitazioni</strong> per chi gestisce il centro e per il personale che deve stare vicino agli animali.</li>
  <li><strong>Agriturismo con 8 camere</strong> e sala ristorante, per turismo equestre, stage e gare.</li>
</ul>
<figure>{img("riqualificazione-stalla", "Stalla della tenuta prima e dopo: ipotesi di scuderia con box", 900, 507)}<figcaption class="caption">Ipotesi di recupero della stalla come scuderia ordinata (simulazione).</figcaption></figure>
<h2>Le fonti di ricavo di un centro equestre</h2>
<ul>
  <li><strong>Pensione cavalli</strong>: il ricavo più stabile, con contratti mensili.</li>
  <li><strong>Scuola di equitazione</strong> per bambini e adulti, con corsi e centri estivi.</li>
  <li><strong>Turismo equestre</strong>: passeggiate e trekking, abbinati a pranzi e pernottamenti in agriturismo.</li>
  <li><strong>Produzione di fieno</strong> sui terreni dell'azienda, che riduce il costo più pesante della gestione.</li>
</ul>
<h2>Cosa prevedere</h2>
<p>Prima di trasformare la stalla va <a href="/guida/bonifica-amianto-azienda-agricola">bonificata la copertura in cemento-amianto</a>, come per il fienile. I volumi sono già accatastati come fabbricati agricoli e l'attività con i cavalli rientra bene nell'azienda agricola. Le nuove strutture, come recinzioni, paddock e campi, vanno comunque verificate con il Comune.</p>
<h2>Domande frequenti</h2>
<div class="faq">
{faq_html(F3)}
</div>'''
write(path, page(
    lang="it", path=path,
    title="Centro equestre in vendita a Roma Nord · Stalla 750 mq e 21 ettari",
    desc="Tenuta in vendita a Riano, 25 km da Roma, ideale come centro equestre: stalla da 750 mq, fienile da 400 mq, 19,5 ettari di prati, abitazioni e agriturismo. € 869.000.",
    keywords="centro equestre in vendita Roma, maneggio in vendita Roma, scuderia in vendita Roma nord, tenuta con stalla in vendita, terreno per cavalli in vendita Roma",
    h1="Centro equestre in vendita a Roma Nord", eyebrow="Stalla · fienile · 21 ettari · Riano",
    lead="Una stalla da 750 mq, un fienile e 21 ettari di prati a 25 km da Roma: la base per pensione cavalli, scuola e turismo equestre.",
    hero="tenuta-riano-fronte-fabbricati", hero_alt="Stalla, fienile e casale della tenuta in vendita a Riano, possibile centro equestre",
    body=body, crumbs=[CR_HOME, ("Centro equestre in vendita", None)],
    related=rel("g6", "terr", "g3"),
    aside_links=links("agri", "matr", "terr", "g6", "g4"),
    schema=[webpage(path, "Centro equestre in vendita a Roma Nord", "Tenuta con stalla da 750 mq e 21 ettari in vendita a Riano (Roma)."), faq(F3)]))

# ---------------------------------------------------------------------------
# 4. Terreno agricolo in vendita a Riano
# ---------------------------------------------------------------------------
path = "/terreno-agricolo-in-vendita-riano"
F4 = [
    ("Il terreno si può comprare senza i fabbricati?", "No, la tenuta è venduta come un unico compendio: terreni, fabbricati e società agricola."),
    ("Chi ha diritto di prelazione?", "Per legge i confinanti coltivatori diretti che ne hanno i requisiti possono esercitare la prelazione agraria. Vanno informati prima del rogito e hanno 30 giorni per rispondere."),
    ("Ci sono agevolazioni fiscali?", "Coltivatori diretti e IAP iscritti alla previdenza agricola possono accedere alle agevolazioni della piccola proprietà contadina. Le spieghiamo nella guida dedicata."),
]
body = f'''<p>Trovare un <strong>terreno agricolo in vendita</strong> sopra i 20 ettari, tutto in un corpo, a 25 km da Roma, è sempre più raro. A Riano, in località Colle delle Rose, la tenuta offre <strong>208.930 mq</strong> tra seminativo e bosco ceduo, con accesso carrabile, sistemi di scolo e un nucleo di fabbricati agricoli e abitativi.</p>
<dl class="facts">
  <div><dt>Superficie</dt><dd>208.930 mq</dd></div>
  <div><dt>Seminativo</dt><dd>19,5 ha</dd></div>
  <div><dt>Bosco ceduo</dt><dd>1,4 ha</dd></div>
  <div><dt>Foglio catastale</dt><dd>5 · Riano</dd></div>
</dl>
<h2>Com'è fatto il terreno</h2>
<ul>
  <li><strong>Andamento leggermente collinare</strong>, con prati aperti e una parte bassa pianeggiante.</li>
  <li><strong>Sistemi di scolo</strong> primari e secondari per regolare le acque.</li>
  <li><strong>Bosco ceduo</strong> lungo i fossi, che fa da confine naturale su due lati.</li>
  <li><strong>Uliveto</strong> di circa 70 piante, fino a 13 quintali di olive a pieno regime.</li>
  <li><strong>Accesso carrabile</strong> da Via Colle delle Rose e allaccio elettrico.</li>
</ul>
<figure>{img("tenuta-riano-mappa-catastale", "Perimetro del terreno agricolo in vendita a Riano su mappa catastale, tra Via Flaminia e Via Codette")}<figcaption class="caption">Il perimetro della proprietà sulla mappa catastale.</figcaption></figure>
<h2>Le particelle</h2>
<div class="table-wrap"><table>
<thead><tr><th>Particella</th><th>Qualità</th><th class="num">Mq</th></tr></thead>
<tbody>
<tr><td>617</td><td>Seminativo</td><td class="num">121.917</td></tr>
<tr><td>619</td><td>Seminativo</td><td class="num">33.092</td></tr>
<tr><td>14</td><td>Bosco ceduo</td><td class="num">13.450</td></tr>
<tr><td>290 · 287 · 288</td><td>Seminativo</td><td class="num">31.775</td></tr>
<tr><td>621 · 285 · 286</td><td>Seminativo</td><td class="num">7.484</td></tr>
<tr><td>20 · 21 · 22</td><td>Seminativo e bosco ceduo</td><td class="num">1.212</td></tr>
</tbody>
<tfoot><tr><td>Totale</td><td></td><td class="num">208.930</td></tr></tfoot>
</table></div>
<h2>Cosa ci puoi fare</h2>
<ul>
  <li><strong>Coltivare</strong>: cereali, foraggere, legumi, nuovi uliveti. Per seminare con le agevolazioni previste l'attività agricola deve essere attiva, e la società agricola è compresa nella vendita.</li>
  <li><strong>Allevare</strong>: c'è la stalla, c'è il fienile e la società ha l'autorizzazione alla macelleria.</li>
  <li><strong>Affittare</strong> a un coltivatore diretto con contratto pluriennale, mantenendo la proprietà come riserva di valore.</li>
  <li><strong>Diversificare</strong> con agriturismo, eventi o cavalli, sfruttando i fabbricati esistenti.</li>
</ul>
<h2>Prezzo e stima</h2>
<p>La stima di mercato del luglio 2025 valuta i soli terreni <strong>€ 689.469</strong>, applicando ai valori agricoli medi della zona un incremento del 32% per posizione, dimensione, pendenze, accesso ed elettricità. Con i fabbricati il valore supera il milione. La tenuta completa è in vendita a <strong>€ 869.000</strong>.</p>
<p>Prima del rogito vanno fatti i passaggi tipici della vendita di terreni agricoli: certificato di destinazione urbanistica, notifica della <a href="/guida/sgravi-fiscali-e-incentivi-agricoltura">prelazione agraria</a> ai confinanti aventi diritto e verifica delle eventuali agevolazioni fiscali.</p>
<h2>Domande frequenti</h2>
<div class="faq">
{faq_html(F4)}
</div>'''
write(path, page(
    lang="it", path=path,
    title="Terreno agricolo in vendita a Riano (Roma) · 21 ettari con fabbricati",
    desc="Terreno agricolo in vendita a Riano, località Colle delle Rose: 208.930 mq di seminativo e bosco ceduo in un solo corpo, con stalla, fienile, abitazioni e agriturismo. € 869.000.",
    keywords="terreno agricolo in vendita Riano, terreno agricolo in vendita Roma nord, terreni agricoli in vendita Roma, 20 ettari in vendita Roma, azienda agricola in vendita Roma",
    h1="Terreno agricolo in vendita a Riano", eyebrow="208.930 mq · Colle delle Rose · Roma Nord",
    lead="Ventuno ettari di seminativo e bosco in un solo corpo, a 25 km da Roma, con fabbricati agricoli, abitazioni e società agricola.",
    hero="tenuta-riano-terreni-uliveto", hero_alt="Terreno agricolo in vendita a Riano con prati, uliveto e boschi lungo i fossi",
    body=body, crumbs=[CR_HOME, ("Terreno agricolo in vendita a Riano", None)],
    related=rel("g4", "g6", "g2"),
    aside_links=links("agri", "matr", "equi", "g4", "g2"),
    schema=[webpage(path, "Terreno agricolo in vendita a Riano", "208.930 mq di terreno agricolo con fabbricati in vendita a Riano (Roma)."), faq(F4)]))

# ---------------------------------------------------------------------------
# 5. EN: agriturismo for sale near Rome
# ---------------------------------------------------------------------------
path = "/en/agriturismo-for-sale-near-rome"
F5 = [
    ("Can a foreigner run an agriturismo in Italy?", "Yes. An agriturismo must be run by an agricultural business, and here that business is included in the sale. Many foreign owners run it through the company with a local manager or partner."),
    ("How does buying property in Italy work?", "You sign a purchase proposal, then a preliminary contract (compromesso) with a deposit, and finally the deed (rogito) before a notary. You need an Italian tax code (codice fiscale) and usually an Italian bank account."),
    ("How far is it from Rome airport?", "About 50 km from Rome Fiumicino airport and 25 km from central Rome."),
]
body = f'''<p>An <strong>agriturismo</strong> is an Italian farm that also hosts guests: rooms, meals made with its own produce, and life in the countryside. Colle delle Rose is one for sale just <strong>25 km north of Rome</strong>, with 8 guest rooms, a 70-cover dining room, a licensed farm company and 21 hectares of land.</p>
<dl class="facts">
  <div><dt>Guest rooms</dt><dd>8</dd></div>
  <div><dt>Covers</dt><dd>~70</dd></div>
  <div><dt>Land</dt><dd>20.9 ha</dd></div>
  <div><dt>To Rome</dt><dd>25 km</dd></div>
  <div><dt>Price</dt><dd>€869,000</dd></div>
</dl>
<h2>What is already in place</h2>
<ul>
  <li><strong>8 furnished guest rooms</strong> with terracotta floors.</li>
  <li><strong>A dining room for about 70 guests</strong> with a brick fireplace, plus a breakfast room and a covered veranda.</li>
  <li><strong>A farm company</strong> licensed for agritourism, food service and butchery. In Italy this is the hardest part to obtain from scratch.</li>
  <li><strong>Four apartments</strong> in the farmhouse, a 750 m² stable, a 400 m² tuff-stone barn and a 200 m² warehouse.</li>
</ul>
<figure>{img("agriturismo-riano-sala-ristorante-camino", "Dining room with fireplace in the agriturismo for sale near Rome")}<figcaption class="caption">The dining room today.</figcaption></figure>
<h2>Why north of Rome</h2>
<p>Rome draws visitors from all over the world, and more of them want to sleep in the countryside and visit the city by day. The estate sits along the ancient Via Flaminia, 30–40 minutes from the centre, about 50 km from Fiumicino airport, with Lake Bracciano and the hill towns of northern Lazio close by.</p>
<h2>What it could become</h2>
<ul>
  <li><strong>A boutique agriturismo</strong> with refreshed rooms and a farm-to-table kitchen.</li>
  <li><strong>A wedding venue</strong>: destination weddings near Rome are in steady demand.</li>
  <li><strong>An equestrian centre</strong> using the stable and 21 hectares of meadows.</li>
  <li><strong>A retreat</strong> for yoga, wellness and slow travel.</li>
</ul>
<p>See the before-and-after concepts and the revenue simulator on the <a href="/en/#before-after">main page</a>.</p>
<h2>Good to know</h2>
<p>The stable and barn roofs are asbestos-cement and must be removed by a licensed contractor before those buildings are converted. As with any Italian farmland sale, neighbouring farmers may have pre-emption rights and must be notified before completion. We work with English-speaking notaries and advisers and can guide you through each step.</p>
<h2>Frequently asked questions</h2>
<div class="faq">
{faq_html(F5)}
</div>'''
write(path, page(
    lang="en", path=path,
    title="Agriturismo for Sale near Rome, Italy · 8 Rooms and 21 Hectares",
    desc="Agriturismo for sale 25 km from Rome: 8 guest rooms, 70-cover restaurant, licensed farm company, stable, barn and 21 hectares of land in Riano, Lazio. €869,000.",
    keywords="agriturismo for sale near Rome, agriturismo for sale Italy, farm for sale near Rome, farmhouse for sale Lazio, country estate for sale Rome Italy, wedding venue for sale Italy",
    h1="Agriturismo for sale near Rome", eyebrow="Riano · 25 km from Rome · €869,000",
    lead="Eight guest rooms, a 70-cover dining room, a licensed farm company and 21 hectares of land, half an hour from the Colosseum.",
    hero="agriturismo-riano-porticato", hero_alt="Portico and terrace of the agriturismo for sale near Rome",
    body=body, crumbs=[("Home", "/en/"), ("Agriturismo for sale near Rome", None)],
    related=[("/en/", "tenuta-riano-viale-ulivi-drone", "Estate", "Colle delle Rose Estate", "The full listing: photos, video, maps and key facts."),
             ("/en/#before-after", "restyling-stile-boutique-sala", "Concepts", "Before and after", "Three interior styles and the conversion of the barn and stable."),
             ("/en/#returns", "agriturismo-riano-sala-colazioni", "Simulator", "What could it earn?", "Estimate yearly revenue from rooms and events.")],
    aside_links=[("Main listing (English)", "/en/"), ("Video tour", "/en/#video"), ("Key facts", "/en/#facts"), ("Contact", "/en/#contact")],
    schema=[webpage(path, "Agriturismo for sale near Rome", "8-room agriturismo with 21 hectares for sale in Riano, near Rome.", "en-GB"), faq(F5, "en-GB")]))

# ---------------------------------------------------------------------------

exec(open(os.path.join(os.path.dirname(__file__), "guida.py")).read())
