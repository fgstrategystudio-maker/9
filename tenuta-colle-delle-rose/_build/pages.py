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
    "g1": ("/guida/comprare-agriturismo-vicino-roma", "agriturismo-riano-porticato", "Guida",
           "Comprare un agriturismo vicino Roma: cosa controllare", "Documenti, autorizzazioni, fabbricati e trappole da evitare."),
    "g2": ("/guida/quanto-rende-un-agriturismo-nel-lazio", "agriturismo-riano-sala-colazioni", "Guida",
           "Quanto rende un agriturismo nel Lazio", "Ricavi, costi e fiscalità agevolata, con un esempio su 8 camere."),
    "g3": ("/guida/bonifica-amianto-azienda-agricola", "tenuta-riano-corte-fienile-tufo", "Guida",
           "Bonifica dell'amianto in un'azienda agricola", "Procedura, costi indicativi e contributi per stalle e fienili."),
    "g4": ("/guida/agevolazioni-acquisto-terreni-agricoli", "tenuta-riano-terreni-uliveto", "Guida",
           "Agevolazioni per comprare terreni agricoli", "Piccola proprietà contadina, imposte, prelazione e mutui ISMEA."),
    "g5": ("/guida/vivere-a-roma-nord-tra-flaminia-e-tevere", "tenuta-riano-vista-aerea-colline", "Guida",
           "Vivere a Roma Nord tra Flaminia e Tevere", "Riano, Malborghetto, il Parco di Veio e i collegamenti con Roma."),
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
<p>Con 8 camere a 110 euro a notte e un'occupazione del 45%, le sole camere valgono circa 144.000 euro lordi l'anno. Quindici eventi da 80 invitati a 70 euro a persona aggiungono circa 84.000 euro. Puoi provare altre combinazioni con il <a href="/#rendimento">simulatore dei ricavi</a> e leggere la <a href="/guida/quanto-rende-un-agriturismo-nel-lazio">guida su quanto rende un agriturismo nel Lazio</a>.</p>
<h2>Cosa sapere prima di comprare</h2>
<p>Le coperture di stalla e fienile sono in cemento-amianto e vanno bonificate. È un costo noto, che riguarda gli edifici agricoli e non l'agriturismo. Ne parliamo in dettaglio nella <a href="/guida/bonifica-amianto-azienda-agricola">guida alla bonifica dell'amianto</a>. Per tutti gli altri controlli, ecco <a href="/guida/comprare-agriturismo-vicino-roma">cosa verificare quando compri un agriturismo</a>.</p>
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
    related=rel("matr", "g1", "g2"),
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
    related=rel("terr", "agri", "g3"),
    aside_links=links("agri", "matr", "terr", "g3", "g4"),
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
<p>Prima del rogito vanno fatti i passaggi tipici della vendita di terreni agricoli: certificato di destinazione urbanistica, notifica della <a href="/guida/agevolazioni-acquisto-terreni-agricoli">prelazione agraria</a> ai confinanti aventi diritto e verifica delle eventuali agevolazioni fiscali.</p>
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
    related=rel("g4", "equi", "agri"),
    aside_links=links("agri", "matr", "equi", "g4", "g5"),
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
# GUIDA
# ---------------------------------------------------------------------------
G = "/guida/"
CR_G = ("Guida all'acquisto", G)

# G1 -------------------------------------------------------------------------
path = P["g1"][0]
body = f'''<p>Comprare un agriturismo non è come comprare una casa. Insieme agli edifici acquisti un'attività regolata da leggi regionali, terreni agricoli soggetti a regole proprie e spesso una società con la sua storia. Questa è la lista dei controlli da fare prima di firmare, pensata per chi cerca un agriturismo nella campagna intorno a Roma.</p>
<h2>1. Immobili o società: cosa stai comprando</h2>
<p>Ci sono due strade. Puoi comprare <strong>solo gli immobili</strong> e avviare una nuova attività a tuo nome, oppure <strong>rilevare la società agricola</strong> che gestisce l'agriturismo, con le sue autorizzazioni. La seconda strada fa risparmiare tempo, perché i permessi esistono già. Richiede però una verifica dei conti della società: debiti, contratti, dipendenti, contributi ricevuti e vincoli collegati.</p>
<h2>2. I documenti urbanistici e catastali</h2>
<ul>
  <li><strong>Visure e planimetrie catastali</strong> di terreni e fabbricati, da confrontare con lo stato reale.</li>
  <li><strong>Certificato di destinazione urbanistica (CDU)</strong>: dice se l'area è agricola e se ci sono vincoli, ad esempio paesaggistici o idrogeologici.</li>
  <li><strong>Conformità urbanistica</strong> dei fabbricati: titoli edilizi, eventuali condoni o sanatorie. Le difformità vanno regolarizzate prima del rogito.</li>
  <li><strong>APE</strong>, l'attestato di prestazione energetica, per le parti abitative.</li>
</ul>
<h2>3. Le autorizzazioni dell'agriturismo</h2>
<p>Nel Lazio l'agriturismo è regolato da una legge regionale e richiede l'iscrizione nell'elenco degli operatori agrituristici e la segnalazione di inizio attività al Comune. Il punto chiave è il <strong>legame con l'agricoltura</strong>: l'attività agricola deve restare principale rispetto a quella ricettiva. Chiedi copia di tutti i titoli: agriturismo, somministrazione di pasti, eventuali laboratori o macelleria aziendale, e verifica con il Comune come si trasferiscono.</p>
<h2>4. Lo stato dei fabbricati</h2>
<ul>
  <li><strong>Coperture</strong>: molte stalle e fienili costruiti tra gli anni '60 e '80 hanno tetti in cemento-amianto. Non è un motivo per scartare la proprietà, ma va messo nel conto. <a href="/guida/bonifica-amianto-azienda-agricola">Qui spieghiamo procedura e costi</a>.</li>
  <li><strong>Impianti</strong>: elettrico, termico e cucina professionale, con le relative certificazioni.</li>
  <li><strong>Scarichi</strong>: in campagna si usano fosse Imhoff o depuratori. Verifica quante sono, cosa servono e se sono autorizzate.</li>
  <li><strong>Acqua</strong>: allaccio all'acquedotto o pozzo, e per quale uso è autorizzato.</li>
</ul>
<h2>5. I terreni</h2>
<p>Controlla accesso, confini, servitù di passaggio, sistemi di scolo e contratti di affitto in corso. Ricorda la <strong>prelazione agraria</strong>: i confinanti coltivatori diretti con i requisiti di legge possono acquistare al tuo stesso prezzo, e vanno informati prima del rogito. Se sei coltivatore diretto o IAP puoi avere <a href="/guida/agevolazioni-acquisto-terreni-agricoli">imposte ridotte</a>.</p>
<h2>6. I numeri</h2>
<p>Fatti dare, se esistono, presenze, ricavi e costi degli ultimi anni. Se l'attività è ferma, costruisci un piano tuo partendo da camere, coperti e stagionalità. Nella <a href="/guida/quanto-rende-un-agriturismo-nel-lazio">guida su quanto rende un agriturismo</a> trovi un metodo semplice.</p>
<h2>Un esempio concreto</h2>
<p>La <a href="/agriturismo-in-vendita-roma">Tenuta Colle delle Rose</a> a Riano è in vendita con la società agricola e le autorizzazioni per agriturismo, ristorazione e macelleria. Ha 8 camere, una sala da 70 coperti e 21 ettari. Nella scheda tecnica indichiamo in modo chiaro anche i punti di attenzione, come le coperture in amianto di stalla e fienile.</p>
<p class="caption">Questa guida ha scopo informativo e non sostituisce il parere di notaio, tecnico e commercialista.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Comprare un agriturismo vicino Roma: cosa controllare prima di firmare",
    desc="Guida pratica per comprare un agriturismo vicino Roma: immobili o società, documenti urbanistici, autorizzazioni nel Lazio, amianto, scarichi, terreni e prelazione agraria.",
    h1="Comprare un agriturismo vicino Roma: cosa controllare", eyebrow="Guida all'acquisto",
    lead="Documenti, autorizzazioni, fabbricati e terreni: i controlli da fare prima di comprare un agriturismo nella campagna romana.",
    hero="agriturismo-riano-porticato", hero_alt="Porticato di un agriturismo nella campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, CR_G, ("Comprare un agriturismo vicino Roma", None)],
    related=rel("g2", "g3", "agri"),
    aside_links=links("g2", "g3", "g4", "g5", "agri"),
    schema=[article(path, "Comprare un agriturismo vicino Roma: cosa controllare", "Guida ai controlli prima di comprare un agriturismo vicino Roma.", "agriturismo-riano-porticato")]))

# G2 -------------------------------------------------------------------------
path = P["g2"][0]
body = f'''<p>Quanto rende un agriturismo? La risposta onesta è che dipende da tre cose: quante camere hai, quanto riesci a riempirle e quante altre attività ci costruisci intorno. Qui ti diamo un metodo semplice per fare i conti, con un esempio su una struttura reale di 8 camere a nord di Roma.</p>
<h2>Le voci di ricavo</h2>
<ul>
  <li><strong>Camere</strong>: numero di camere × prezzo medio a notte × percentuale di occupazione × 365.</li>
  <li><strong>Ristorazione</strong>: pranzi e cene per gli ospiti e per chi arriva da fuori, soprattutto nel fine settimana.</li>
  <li><strong>Eventi</strong>: matrimoni, compleanni, eventi aziendali. Pochi eventi l'anno spostano molto il risultato.</li>
  <li><strong>Prodotti</strong>: olio, carni, ortaggi venduti in azienda o serviti a tavola.</li>
  <li><strong>Esperienze</strong>: corsi di cucina, raccolta delle olive, passeggiate a cavallo.</li>
</ul>
<h2>Un esempio con 8 camere</h2>
<div class="table-wrap"><table>
<thead><tr><th>Scenario</th><th class="num">Prezzo / notte</th><th class="num">Occupazione</th><th class="num">Ricavi camere / anno</th></tr></thead>
<tbody>
<tr><td>Agriturismo classico</td><td class="num">€ 90</td><td class="num">35%</td><td class="num">€ 91.980</td></tr>
<tr><td>Restyling contemporaneo</td><td class="num">€ 120</td><td class="num">45%</td><td class="num">€ 157.680</td></tr>
<tr><td>Boutique e matrimoni</td><td class="num">€ 180</td><td class="num">50%</td><td class="num">€ 262.800</td></tr>
</tbody></table></div>
<p>A questi numeri si aggiungono gli eventi: 15 ricevimenti da 80 invitati a 70 euro a testa valgono 84.000 euro. Puoi provare le tue ipotesi con il <a href="/#rendimento">simulatore della Tenuta Colle delle Rose</a>.</p>
<h2>I costi da mettere in conto</h2>
<ul>
  <li><strong>Personale</strong>: è la voce più pesante, soprattutto con la ristorazione.</li>
  <li><strong>Commissioni</strong> dei portali di prenotazione, in genere tra il 15% e il 20% delle prenotazioni che portano.</li>
  <li><strong>Utenze, lavanderia, colazioni, manutenzione</strong>.</li>
  <li><strong>Marketing</strong>: sito, foto, Google, social.</li>
  <li><strong>Gestione agricola</strong>: l'attività agricola deve restare principale, quindi va lavorata davvero.</li>
</ul>
<h2>La fiscalità agevolata dell'agriturismo</h2>
<p>Gli agriturismi possono usare un regime forfettario previsto dalla legge 413 del 1991: il reddito imponibile si calcola come il 25% dei ricavi e l'IVA si detrae in modo forfettario. È uno dei vantaggi principali rispetto a un B&amp;B o a un hotel. Requisiti e convenienza vanno valutati con il commercialista, caso per caso.</p>
<h2>Come aumentare il rendimento</h2>
<ol>
  <li><strong>Alzare il prezzo medio</strong> con un restyling curato e belle foto. Spesso conta più di avere camere in più.</li>
  <li><strong>Riempire i giorni feriali</strong> con eventi aziendali, gruppi e soggiorni lunghi.</li>
  <li><strong>Vendere i prodotti</strong> dell'azienda, che hanno margini alti e raccontano la storia del posto.</li>
  <li><strong>Usare gli spazi esterni</strong> per eventi nella bella stagione.</li>
</ol>
<p>La <a href="/agriturismo-in-vendita-roma">Tenuta Colle delle Rose</a> parte già con 8 camere, una sala da 70 coperti e le autorizzazioni per ristorazione e macelleria.</p>
<p class="caption">Gli importi sono esempi di calcolo e non previsioni di reddito.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Quanto rende un agriturismo nel Lazio: ricavi, costi ed esempio con 8 camere",
    desc="Come calcolare quanto rende un agriturismo nel Lazio: voci di ricavo, costi, regime fiscale forfettario e un esempio con 8 camere vicino Roma.",
    h1="Quanto rende un agriturismo nel Lazio", eyebrow="Guida all'acquisto",
    lead="Un metodo semplice per stimare ricavi e costi, con tre scenari su una struttura di 8 camere a 25 km da Roma.",
    hero="agriturismo-riano-sala-colazioni", hero_alt="Sala colazioni di un agriturismo nel Lazio",
    body=body, crumbs=[CR_HOME, CR_G, ("Quanto rende un agriturismo", None)],
    related=rel("g1", "agri", "matr"),
    aside_links=links("g1", "g3", "g4", "agri", "matr"),
    schema=[article(path, "Quanto rende un agriturismo nel Lazio", "Ricavi, costi e fiscalità di un agriturismo nel Lazio con esempio su 8 camere.", "agriturismo-riano-sala-colazioni")]))

# G3 -------------------------------------------------------------------------
path = P["g3"][0]
body = f'''<p>Molte aziende agricole italiane hanno stalle, fienili e capannoni coperti con lastre in cemento-amianto, il cosiddetto eternit. Se stai comprando una tenuta con queste coperture, la domanda è sempre la stessa: quanto costa toglierle e cosa comporta? Ecco come funziona, in parole semplici.</p>
<h2>È obbligatorio rimuovere l'amianto?</h2>
<p>L'amianto è vietato in Italia dal 1992, ma le coperture esistenti non vanno sempre rimosse subito. Il proprietario deve farne valutare lo stato di conservazione. Se le lastre sono degradate, con fibre che possono disperdersi, bisogna intervenire. In ogni caso, se vuoi <strong>riutilizzare o trasformare l'edificio</strong>, la bonifica è il primo passo.</p>
<h2>Le tre possibilità</h2>
<ul>
  <li><strong>Rimozione</strong>: le lastre vengono smontate e smaltite in discarica autorizzata. È la soluzione definitiva e quella che aumenta di più il valore dell'edificio.</li>
  <li><strong>Incapsulamento</strong>: si trattano le lastre con prodotti che bloccano le fibre. Costa meno ma va ripetuto nel tempo.</li>
  <li><strong>Confinamento</strong>: si copre la vecchia copertura con una nuova. L'amianto resta sotto.</li>
</ul>
<h2>Come si svolge la rimozione</h2>
<ol>
  <li>Si incarica una <strong>ditta specializzata</strong>, iscritta all'Albo nazionale gestori ambientali per la bonifica dell'amianto.</li>
  <li>La ditta presenta un <strong>piano di lavoro all'ASL</strong>, di norma almeno 30 giorni prima dell'inizio.</li>
  <li>Le lastre vengono trattate, smontate senza romperle, imballate e portate in <strong>discarica autorizzata</strong>.</li>
  <li>A fine lavori si rifà la copertura, ad esempio con pannelli isolati o con un tetto che ospita pannelli fotovoltaici.</li>
</ol>
<h2>Quanto costa</h2>
<p>Per coperture agricole semplici, rimozione e smaltimento costano indicativamente <strong>tra 15 e 35 euro al metro quadro</strong>. Il prezzo dipende da superficie, altezza, accessibilità e distanza dalla discarica. La nuova copertura è un costo a parte e varia molto secondo il materiale scelto. Servono sempre preventivi su misura.</p>
<h2>Ci sono contributi?</h2>
<p>Negli ultimi anni la bonifica dell'amianto nelle aziende agricole è stata finanziata da più strumenti. I <strong>bandi ISI dell'INAIL</strong> hanno finanziato a più riprese la rimozione dell'amianto. Il programma <strong>Parco Agrisolare</strong> del PNRR ha sostenuto l'installazione di fotovoltaico sui tetti agricoli, anche insieme alla rimozione dell'amianto. I bandi cambiano ogni anno: conviene verificare quelli aperti al momento dell'acquisto.</p>
<h2>Un caso reale: stalla e fienile a Riano</h2>
<p>Alla <a href="/">Tenuta Colle delle Rose</a> le coperture di stalla (750 mq) e fienile (400 mq) sono in cemento-amianto. Lo diciamo chiaramente fin dalla prima pagina. La bonifica è un costo prevedibile. In cambio libera due grandi volumi già accatastati come fabbricati agricoli, utilizzabili per una <a href="/centro-equestre-in-vendita-roma">scuderia</a>, una <a href="/location-matrimoni-in-vendita-roma">sala per eventi</a> o un tetto fotovoltaico al servizio dell'azienda.</p>
<figure>{img("riqualificazione-fienile", "Fienile in tufo prima e dopo: ipotesi di recupero con nuova copertura", 900, 507)}<figcaption class="caption">Il fienile in tufo: ipotesi di recupero con nuova copertura (simulazione).</figcaption></figure>
<p class="caption">Questa guida ha scopo informativo. Per obblighi e procedure fa fede la normativa vigente e il parere dei tecnici e dell'ASL competente.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Bonifica amianto in azienda agricola: procedura, costi e contributi",
    desc="Come funziona la bonifica dell'amianto su stalle e fienili: obblighi, rimozione, incapsulamento, piano di lavoro ASL, costi indicativi al metro quadro e contributi.",
    h1="Bonifica dell'amianto in un'azienda agricola", eyebrow="Guida all'acquisto",
    lead="Obblighi, procedura, costi indicativi e contributi per togliere le coperture in eternit da stalle e fienili.",
    hero="tenuta-riano-corte-fienile-tufo", hero_alt="Corte di un'azienda agricola con fienile in tufo vicino Roma",
    body=body, crumbs=[CR_HOME, CR_G, ("Bonifica dell'amianto", None)],
    related=rel("equi", "matr", "g1"),
    aside_links=links("g1", "g2", "g4", "equi", "matr"),
    schema=[article(path, "Bonifica dell'amianto in un'azienda agricola", "Procedura, costi e contributi per la bonifica dell'amianto su stalle e fienili.", "tenuta-riano-corte-fienile-tufo")]))

# G4 -------------------------------------------------------------------------
path = P["g4"][0]
body = f'''<p>Chi compra terreni agricoli in Italia può pagare imposte molto diverse secondo chi è e cosa farà del terreno. In più esiste un diritto, la prelazione agraria, che chi compra deve conoscere. Ecco le regole principali.</p>
<h2>Le imposte sull'acquisto di terreni agricoli</h2>
<div class="table-wrap"><table>
<thead><tr><th>Chi compra</th><th class="num">Registro</th><th class="num">Ipotecaria</th><th class="num">Catastale</th></tr></thead>
<tbody>
<tr><td>Coltivatore diretto o IAP (piccola proprietà contadina)</td><td class="num">€ 200</td><td class="num">€ 200</td><td class="num">1%</td></tr>
<tr><td>Altri acquirenti</td><td class="num">15%</td><td class="num">€ 50</td><td class="num">€ 50</td></tr>
</tbody></table></div>
<p>La differenza è enorme. Su un terreno che vale 600.000 euro, chi ha i requisiti paga circa 6.400 euro di imposte, mentre un altro acquirente ne paga circa 90.000.</p>
<h2>Chi ha diritto alla piccola proprietà contadina</h2>
<ul>
  <li><strong>Coltivatori diretti</strong> e <strong>imprenditori agricoli professionali (IAP)</strong> iscritti alla gestione previdenziale agricola.</li>
  <li>Le <strong>società agricole</strong> con i requisiti di legge.</li>
  <li>L'acquirente deve <strong>coltivare il terreno per almeno 5 anni</strong>: se lo vende o smette prima, perde le agevolazioni.</li>
</ul>
<p>I fabbricati compresi nella vendita seguono regole proprie. Le abitazioni, ad esempio, hanno aliquote diverse e possono godere dell'agevolazione prima casa. Il notaio calcola le imposte per ogni bene.</p>
<h2>La prelazione agraria</h2>
<p>Quando si vende un terreno agricolo, alcuni soggetti possono comprarlo al posto tuo, alle stesse condizioni:</p>
<ul>
  <li>l'<strong>affittuario</strong> coltivatore diretto che lavora il terreno;</li>
  <li>in mancanza di affittuari, i <strong>confinanti coltivatori diretti</strong> con i requisiti di legge.</li>
</ul>
<p>Il venditore notifica la proposta di vendita con prezzo e condizioni. Chi ha diritto ha <strong>30 giorni</strong> per accettare. Se nessuno risponde, si procede con il rogito. Saltare questo passaggio espone a contestazioni anche dopo la vendita.</p>
<h2>Mutui e aiuti per i giovani</h2>
<p>ISMEA, l'istituto pubblico per il mercato agricolo, gestisce da anni strumenti per aiutare i giovani agricoltori a comprare terreni, come il programma <strong>Generazione Terra</strong>, con mutui a lungo termine e condizioni agevolate. Requisiti e scadenze cambiano: conviene verificare i bandi attivi.</p>
<h2>Un esempio: la tenuta di Riano</h2>
<p>La <a href="/terreno-agricolo-in-vendita-riano">Tenuta Colle delle Rose</a> comprende 208.930 mq di terreni, i fabbricati e la società agricola. Chi ha i requisiti di coltivatore diretto o IAP può valutare con il notaio le agevolazioni sulla parte agricola.</p>
<p class="caption">Questa guida ha scopo informativo: aliquote e requisiti vanno verificati con il notaio al momento dell'acquisto.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Agevolazioni per comprare terreni agricoli: imposte, PPC e prelazione",
    desc="Imposte sull'acquisto di terreni agricoli, agevolazioni della piccola proprietà contadina per coltivatori diretti e IAP, prelazione agraria e mutui ISMEA.",
    h1="Agevolazioni per comprare terreni agricoli", eyebrow="Guida all'acquisto",
    lead="Quanto si paga di imposte, chi ha diritto alla piccola proprietà contadina e come funziona la prelazione agraria.",
    hero="tenuta-riano-terreni-seminativo", hero_alt="Terreni agricoli seminativi nella campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, CR_G, ("Agevolazioni per terreni agricoli", None)],
    related=rel("terr", "g1", "g5"),
    aside_links=links("g1", "g2", "g3", "terr", "agri"),
    schema=[article(path, "Agevolazioni per comprare terreni agricoli", "Imposte, piccola proprietà contadina, prelazione agraria e mutui ISMEA.", "tenuta-riano-terreni-seminativo")]))

# G5 -------------------------------------------------------------------------
path = P["g5"][0]
body = f'''<p>A nord di Roma, appena fuori dal Grande Raccordo Anulare, la città lascia il posto a colline, uliveti e valli boscose. È la campagna tra la <strong>Via Flaminia</strong> e il <strong>Tevere</strong>, dove si trovano comuni come Riano, Sacrofano, Castelnuovo di Porto e Morlupo. Ecco perché sempre più persone la scelgono per vivere, lavorare o investire.</p>
<h2>Riano e Colle delle Rose</h2>
<p>Riano è un comune della città metropolitana di Roma, con un centro storico su uno sperone di tufo sopra la valle del Tevere. Il suo territorio si estende fino alla Flaminia, dove si trovano frazioni e località residenziali immerse nel verde, come Colle delle Rose. Qui la campagna è ancora agricola: prati, seminativi e uliveti, separati da fossi alberati.</p>
<h2>La storia lungo la Flaminia</h2>
<p>La Via Flaminia, aperta nel 220 a.C., era la grande strada romana verso l'Adriatico. Lungo il suo percorso, poco a sud di Colle delle Rose, si trova l'<strong>Arco di Malborghetto</strong>, un arco a quattro fronti legato alla vittoria di Costantino del 312 d.C. Più vicino a Roma, a Prima Porta, ci sono i resti della <strong>Villa di Livia</strong>, la moglie dell'imperatore Augusto.</p>
<h2>Natura a due passi</h2>
<ul>
  <li><strong>Parco Regionale di Veio</strong>: boschi, forre di tufo e sentieri tra i comuni a nord di Roma.</li>
  <li><strong>Valle del Tevere</strong>: percorsi in bicicletta e a piedi lungo il fiume.</li>
  <li><strong>Lago di Bracciano</strong>, a circa 25 km, per spiagge, vela e borghi sull'acqua.</li>
  <li><strong>Borghi della Tuscia e della Sabina</strong>, raggiungibili in poco tempo.</li>
</ul>
<h2>Collegamenti con Roma</h2>
<ul>
  <li><strong>In auto</strong>: la Flaminia porta al Grande Raccordo Anulare e al centro di Roma in 30–40 minuti.</li>
  <li><strong>In treno</strong>: la ferrovia Roma–Civita Castellana–Viterbo corre lungo la Flaminia, con fermate nei comuni della zona e arrivo a Piazzale Flaminio, vicino a Piazza del Popolo.</li>
  <li><strong>Aeroporto</strong>: Fiumicino è a circa 50 km.</li>
</ul>
<h2>Perché investire qui</h2>
<p>Roma Nord unisce due cose che di rado stanno insieme: <strong>campagna vera</strong> e <strong>vicinanza a una capitale</strong> con milioni di abitanti e di turisti. Per chi vuole aprire un agriturismo, una location per eventi o un centro equestre, il bacino di clienti è a mezz'ora di strada. Per chi cerca terra come investimento, le proprietà agricole grandi e intere vicino a Roma sono sempre meno.</p>
<figure>{img("tenuta-riano-inquadramento-roma-nord", "Mappa della campagna a nord di Roma tra Via Flaminia, Tevere e Formello con la tenuta di Colle delle Rose")}<figcaption class="caption">La Tenuta Colle delle Rose tra la Flaminia e il Tevere.</figcaption></figure>
<p>Se questa zona ti interessa, guarda la <a href="/">Tenuta Colle delle Rose</a>: 21 ettari, agriturismo con 8 camere e oltre 1.600 mq di fabbricati a Riano.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Vivere a Roma Nord tra Flaminia e Tevere: Riano, natura e collegamenti",
    desc="Riano e la campagna a nord di Roma tra Via Flaminia e Tevere: storia, Arco di Malborghetto, Parco di Veio, collegamenti con Roma e perché investire.",
    h1="Vivere a Roma Nord tra Flaminia e Tevere", eyebrow="Il territorio",
    lead="Riano, Colle delle Rose e la campagna a mezz'ora da Roma: storia, natura, collegamenti e opportunità.",
    hero="tenuta-riano-vista-aerea-colline", hero_alt="Colline e campagna a nord di Roma vicino a Riano",
    body=body, crumbs=[CR_HOME, CR_G, ("Vivere a Roma Nord", None)],
    related=rel("terr", "agri", "g4"),
    aside_links=links("g1", "g2", "g4", "terr", "agri"),
    schema=[article(path, "Vivere a Roma Nord tra Flaminia e Tevere", "Riano e la campagna a nord di Roma: storia, natura e collegamenti.", "tenuta-riano-vista-aerea-colline")]))

# Indice guida ---------------------------------------------------------------
path = G
cards = "\n".join(
    '<a class="card" href="%s">%s<div><span class="eyebrow">%s</span><h3>%s</h3><p>%s</p></div></a>'
    % (h, img(im, ti, sizes="(max-width: 860px) 100vw, 380px"), ey, ti, tx)
    for h, im, ey, ti, tx in [P[k] for k in ("g1", "g2", "g3", "g4", "g5")])
body = f'''<p>Comprare una tenuta agricola vicino Roma vuol dire mettere insieme immobili, terreni, autorizzazioni e progetti. In queste guide spieghiamo in modo semplice cosa controllare, quanto costa e come fare i conti.</p>
<div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
{cards}
</div>
<h2>Le proprietà</h2>
<ul>
  <li><a href="/agriturismo-in-vendita-roma">Agriturismo in vendita a Roma Nord</a></li>
  <li><a href="/location-matrimoni-in-vendita-roma">Location per matrimoni in vendita vicino Roma</a></li>
  <li><a href="/centro-equestre-in-vendita-roma">Centro equestre in vendita a Roma Nord</a></li>
  <li><a href="/terreno-agricolo-in-vendita-riano">Terreno agricolo in vendita a Riano</a></li>
</ul>'''
write(path, page(
    lang="it", path=path,
    title="Guida all'acquisto di tenute e agriturismi vicino Roma",
    desc="Guide pratiche per comprare un agriturismo o una tenuta agricola vicino Roma: controlli, rendimento, bonifica amianto, agevolazioni fiscali e territorio.",
    h1="Guida all'acquisto di una tenuta vicino Roma", eyebrow="Guida",
    lead="Controlli, numeri, agevolazioni e territorio: tutto quello che serve sapere prima di comprare.",
    hero="tenuta-riano-vista-aerea-nord", hero_alt="Prati e colline della campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, ("Guida all'acquisto", None)],
    aside_links=links("agri", "matr", "equi", "terr"),
    schema=[{"@type": "CollectionPage", "@id": SITE + G, "url": SITE + G, "name": "Guida all'acquisto di una tenuta vicino Roma", "inLanguage": "it-IT"}]))

# Privacy --------------------------------------------------------------------
path = "/privacy"
body = f'''<h2>Titolare del trattamento</h2>
<p>Il titolare del trattamento dei dati raccolti con questo sito è il referente della vendita della Tenuta Colle delle Rose, contattabile all'indirizzo <a href="mailto:{EMAIL}">{EMAIL}</a> e al numero {PHONE}.</p>
<h2>Quali dati raccogliamo</h2>
<p>Raccogliamo solo i dati che ci invii volontariamente con il modulo contatti, via email o WhatsApp: nome, email, telefono, profilo e contenuto del messaggio. Il sito non usa cookie di profilazione.</p>
<h2>Perché li usiamo</h2>
<p>Usiamo i dati solo per rispondere alla tua richiesta di informazioni sulla tenuta, inviarti il dossier e organizzare eventuali visite. La base giuridica è la tua richiesta e il consenso che dai inviando il modulo (art. 6, par. 1, lett. a e b del Regolamento UE 2016/679).</p>
<h2>Per quanto tempo</h2>
<p>Conserviamo i dati per il tempo necessario a gestire la trattativa e comunque non oltre 24 mesi dall'ultimo contatto, salvo obblighi di legge.</p>
<h2>A chi li comunichiamo</h2>
<p>I dati non vengono venduti né diffusi. Possono essere condivisi solo con i professionisti coinvolti nella vendita, come notaio e tecnici, se procedi con la trattativa. I servizi di posta e messaggistica che usiamo possono trattare i dati anche fuori dall'Unione Europea, con le garanzie previste dal Regolamento.</p>
<h2>I tuoi diritti</h2>
<p>Puoi chiedere in ogni momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne l'uso o opporti al trattamento, scrivendo a <a href="mailto:{EMAIL}">{EMAIL}</a>. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.</p>
<h2>English summary</h2>
<p>We only collect the data you send us through the contact form, email or WhatsApp, and use it solely to answer your enquiry about the estate, send the dossier and arrange viewings. We keep it for up to 24 months after the last contact and never sell it. To access, correct or delete your data, write to <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>'''
write(path, page(
    lang="it", path=path,
    title="Privacy · Tenuta Colle delle Rose",
    desc="Informativa sul trattamento dei dati personali raccolti dal sito della Tenuta Colle delle Rose.",
    h1="Informativa privacy", eyebrow="Tenuta Colle delle Rose",
    lead="Come trattiamo i dati che ci invii per avere informazioni sulla tenuta.",
    hero="tenuta-riano-terreni-seminativo", hero_alt="Campagna della tenuta",
    body=body, crumbs=[CR_HOME, ("Privacy", None)],
    aside_links=links("agri", "terr"),
    schema=[]))
