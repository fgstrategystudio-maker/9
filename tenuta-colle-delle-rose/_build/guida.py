# Articoli della guida. Eseguito da pages.py (usa page, img, P, rel, links, write, article...).

G = "/guida/"
CR_G = ("Guida", G)

# ---------------------------------------------------------------------------
# Cambiare vita
# ---------------------------------------------------------------------------
path = P["g2"][0]
body = f'''<p>Succede a molti, prima o poi. Il traffico per andare al lavoro, un appartamento dove manca sempre una stanza, i figli che crescono senza un prato. E la voglia di <strong>cambiare vita</strong>: più spazio, più tempo, un ritmo che segue le stagioni invece delle riunioni.</p>
<p>Spesso però l'idea si ferma qui, perché "andare in campagna" sembra voler dire andare lontano: lontano dal lavoro, dalle scuole, dagli amici, dall'aeroporto. A nord di Roma non è così. Tra la Via Flaminia e il Tevere ci sono colline, uliveti e boschi a mezz'ora dal centro.</p>
<h2>Non devi scegliere tra città e campagna</h2>
<p>Il vero vantaggio di vivere alle porte di Roma è che tieni tutte e due le cose:</p>
<ul>
  <li><strong>La mattina</strong> apri la finestra su prati e ulivi, fai colazione fuori, porti il cane a correre.</li>
  <li><strong>In 30–40 minuti</strong> sei in città per lavoro, una cena, un museo o un concerto.</li>
  <li><strong>L'aeroporto di Fiumicino</strong> è a circa 50 km, per chi viaggia spesso o ha la famiglia lontana.</li>
  <li><strong>Il clima</strong> è quello di Roma: inverni miti, primavere lunghe, estati in cui all'ombra si sta bene.</li>
</ul>
<h2>Come si fa, in pratica</h2>
<p>Chi ha cambiato vita con successo di solito non ha fatto un salto nel vuoto. Ha fatto un percorso a tappe:</p>
<ol>
  <li><strong>Prima i weekend.</strong> Si passa in campagna il fine settimana e le vacanze, per capire se quel ritmo piace davvero.</li>
  <li><strong>Poi il lavoro da remoto.</strong> Due o tre giorni a settimana da casa, il resto in città. Prima di comprare, verifica sul posto la copertura internet disponibile, fissa o mobile.</li>
  <li><strong>Infine il trasferimento.</strong> Quando la vita in campagna funziona, la casa in città si affitta o si vende.</li>
</ol>
<h2>E come si vive, economicamente?</h2>
<p>Una tenuta non è solo una casa: può essere anche un reddito. È la differenza tra "comprare una villa in campagna" e "comprare una vita in campagna". Alcuni esempi:</p>
<ul>
  <li><strong>Ospitare</strong>: affittare camere a chi cerca un weekend fuori Roma.</li>
  <li><strong>Produrre</strong>: olio, ortaggi, uova, carne, venduti a chi passa o ai ristoranti della zona.</li>
  <li><strong>Organizzare</strong>: feste, matrimoni, corsi, ritiri.</li>
  <li><strong>Affittare la terra</strong> a un agricoltore, se preferisci non coltivarla tu.</li>
</ul>
<h2>Le domande da farsi prima</h2>
<ul>
  <li>Quanto tempo voglio dedicare alla terra e agli animali, ogni settimana?</li>
  <li>Voglio un'attività o solo una casa con tanto spazio intorno?</li>
  <li>Chi della famiglia deve andare in città ogni giorno, e come?</li>
  <li>Ho bisogno di qualcuno che mi aiuti con la manutenzione?</li>
</ul>
<p>Rispondere con sincerità aiuta a scegliere la proprietà giusta: un casale con un ettaro è molto diverso da una tenuta di venti.</p>
<h2>Un esempio: la Tenuta Colle delle Rose</h2>
<figure>{img("tenuta-riano-complesso-fabbricati-alto", "Il casale e i fabbricati della Tenuta Colle delle Rose a Riano, vicino Roma")}<figcaption class="caption">Il borgo della tenuta, in cima al viale di ulivi.</figcaption></figure>
<p>A Riano, a 25 km da Roma, la <a href="/">Tenuta Colle delle Rose</a> è pensata proprio per chi vuole cambiare vita senza rinunciare alla città. Ci sono <strong>quattro abitazioni</strong>, così una è per te e le altre per figli, genitori o amici. C'è un <strong>agriturismo con 8 camere</strong> e una sala da 70 coperti che può darti un reddito. E ci sono <strong>21 ettari</strong> di prati, ulivi e boschi, con stalla e fienile per chi vuole tenere animali.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Cambiare vita e trasferirsi in campagna vicino Roma: come farlo davvero",
    desc="Lasciare la città per la campagna senza rinunciare a Roma: come cambiare vita a tappe, come mantenersi con una tenuta e cosa chiedersi prima di comprare.",
    keywords="cambiare vita campagna, trasferirsi in campagna vicino Roma, vivere in campagna vicino Roma, casale in campagna vicino Roma, lasciare la città",
    h1="Cambiare vita: dalla città alla campagna, a 30 minuti da Roma", eyebrow="Cambiare vita",
    lead="Più spazio, più tempo e un ritmo diverso, senza perdere il lavoro, le scuole e gli amici di Roma.",
    hero="tenuta-riano-viale-ulivi-drone", hero_alt="Viale di ulivi che sale verso un casale nella campagna vicino Roma",
    body=body, crumbs=[CR_HOME, CR_G, ("Cambiare vita", None)],
    related=rel("g6", "g1", "g5"),
    aside_links=links("g6", "g1", "g4", "g5", "agri"),
    schema=[article(path, "Cambiare vita: dalla città alla campagna, a 30 minuti da Roma", "Come trasferirsi in campagna vicino Roma senza rinunciare alla città.", "tenuta-riano-viale-ulivi-drone")]))

# ---------------------------------------------------------------------------
# Vivere con gli animali
# ---------------------------------------------------------------------------
path = P["g6"][0]
body = f'''<p>Per molti, la campagna vuol dire soprattutto <strong>animali</strong>: un cavallo da montare la mattina, le galline che fanno le uova, un paio di capre che tengono pulito il prato, i cani liberi di correre. È una vita bellissima, ma richiede spazi adatti, un po' di organizzazione e alcune regole da conoscere.</p>
<h2>Cavalli e asini</h2>
<p>Il cavallo è spesso il sogno numero uno. Servono tre cose:</p>
<ul>
  <li><strong>Un ricovero</strong>: un box per ogni animale, coperto e ventilato, con una zona per selle e fieno.</li>
  <li><strong>Prati e paddock</strong>: si consiglia di solito almeno mezzo ettaro di pascolo a cavallo, meglio se diviso in più recinti da far riposare a turno.</li>
  <li><strong>Fieno</strong>: è la spesa principale. Chi ha terreni può produrlo da sé.</li>
</ul>
<p>In Italia ogni equide ha il suo <strong>passaporto</strong> e va registrato all'anagrafe, e il luogo dove vive va censito presso il servizio veterinario dell'ASL. Gli asini seguono le stesse regole e sono ottimi compagni per i cavalli e per i bambini.</p>
<h2>Galline, oche e animali da cortile</h2>
<p>Un pollaio è il modo più semplice per cominciare: uova fresche ogni giorno, poca spesa, tanta soddisfazione per i bambini. Serve un ricovero chiuso per la notte, protetto dalle volpi, e un recinto all'aperto. Anche per pochi animali tenuti per uso familiare molte regioni chiedono la <strong>registrazione all'ASL</strong>: è una pratica semplice, ma va fatta.</p>
<h2>Capre e pecore</h2>
<p>Sono i "tosaerba" naturali della campagna: tengono basso il prato e puliscono i margini del bosco. Danno latte e formaggi, se ti va di imparare. Anche loro vanno registrate e identificate, e hanno bisogno di recinzioni solide, perché le capre sono maestre nelle fughe.</p>
<h2>Cani e gatti</h2>
<p>In campagna i cani cambiano vita insieme a te. Servono recinzioni sicure intorno alla casa, soprattutto se ci sono strade o altri animali, e un veterinario di fiducia in zona. I gatti, dal canto loro, tengono lontani i topi da fienili e magazzini.</p>
<h2>L'orto e gli ulivi</h2>
<p>Gli animali e la terra lavorano insieme: il letame concima l'orto, gli animali puliscono i prati, il fieno dei campi li nutre d'inverno. Un uliveto, anche piccolo, ti dà il tuo olio ogni autunno, e la raccolta delle olive diventa una festa con amici e famiglia.</p>
<h2>Quanto tempo serve</h2>
<ul>
  <li><strong>Galline</strong>: pochi minuti al giorno.</li>
  <li><strong>Capre e pecore</strong>: una mezz'ora al giorno, più la gestione dei pascoli.</li>
  <li><strong>Cavalli</strong>: almeno un'ora o due al giorno, oppure qualcuno che se ne occupi.</li>
</ul>
<p>Se vuoi tenere più animali o farne un'attività, come una pensione per cavalli o un piccolo allevamento, conviene farlo con un'<strong>azienda agricola</strong>. Così gli animali rientrano in un'attività regolare, con le agevolazioni previste.</p>
<h2>Un posto pensato per gli animali</h2>
<figure>{img("riqualificazione-stalla", "Stalla della Tenuta Colle delle Rose: ipotesi di scuderia con box", 900, 507)}<figcaption class="caption">La stalla da 750 mq: ipotesi di recupero come scuderia (simulazione).</figcaption></figure>
<p>La <a href="/">Tenuta Colle delle Rose</a> a Riano ha già gli spazi: una <strong>stalla da 750 mq</strong>, un <strong>fienile da 400 mq</strong>, <strong>19,5 ettari di prati</strong> per paddock e fieno, circa <strong>70 ulivi</strong> e un viale alberato. La vendita comprende anche la società agricola, con l'autorizzazione alla macelleria per chi vuole allevare. Leggi anche la pagina sul <a href="/centro-equestre-in-vendita-roma">centro equestre</a>.</p>
<p class="caption">Le regole su registrazione e benessere animale variano per specie e regione: verifica sempre con il servizio veterinario dell'ASL.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Vivere in campagna con gli animali: cavalli, galline, capre e orto",
    desc="Come vivere in campagna con gli animali vicino Roma: spazi per cavalli, galline, capre e cani, regole di registrazione, tempo necessario e una tenuta già attrezzata.",
    keywords="vivere in campagna con animali, casa con terreno per cavalli Roma, casale con stalla vicino Roma, tenere cavalli in campagna, pollaio in campagna",
    h1="Vivere in campagna con gli animali", eyebrow="La vita in campagna",
    lead="Cavalli, galline, capre, cani e un orto: cosa serve davvero, quanto tempo richiede e quali regole seguire.",
    hero="tenuta-riano-terreni-uliveto", hero_alt="Prati, uliveto e boschi nella campagna a nord di Roma, adatti agli animali",
    body=body, crumbs=[CR_HOME, CR_G, ("Vivere con gli animali", None)],
    related=rel("equi", "g2", "terr"),
    aside_links=links("g2", "g1", "g4", "equi", "terr"),
    schema=[article(path, "Vivere in campagna con gli animali", "Spazi, regole e tempo per vivere in campagna con cavalli, galline e capre.", "tenuta-riano-terreni-uliveto")]))

# ---------------------------------------------------------------------------
# Aprire e gestire un agriturismo
# ---------------------------------------------------------------------------
path = P["g1"][0]
body = f'''<p>Ospitare persone in campagna, cucinare con quello che produci, raccontare il tuo territorio: aprire un agriturismo è uno dei modi più belli di vivere la terra. È anche un'attività con regole precise. Ecco cosa serve per aprirne uno, o per gestirne uno già avviato, nel Lazio.</p>
<h2>Chi può aprire un agriturismo</h2>
<p>L'agriturismo non è un B&amp;B in campagna. Per legge è un'attività svolta da un <strong>imprenditore agricolo</strong>, singolo o in società, e deve restare legata all'agricoltura: il lavoro nei campi e con gli animali deve essere <strong>principale</strong> rispetto all'ospitalità. Nel Lazio le regole sono fissate da una legge regionale.</p>
<p>Non sei agricoltore? Hai tre strade:</p>
<ul>
  <li><strong>Diventarlo</strong>, aprendo un'azienda agricola e acquisendo i requisiti.</li>
  <li><strong>Rilevare una società agricola</strong> che ha già l'agriturismo autorizzato, ed è la strada più rapida.</li>
  <li><strong>Affidare la gestione</strong> a un imprenditore agricolo, ad esempio con un affitto d'azienda, restando proprietario degli immobili.</li>
</ul>
<h2>I passi per aprire</h2>
<ol>
  <li><strong>Azienda agricola attiva</strong>, con partita IVA, iscrizione alla Camera di commercio e alla previdenza agricola.</li>
  <li><strong>Iscrizione all'elenco regionale</strong> degli operatori agrituristici.</li>
  <li><strong>Segnalazione di inizio attività (SCIA)</strong> al Comune per alloggio e ristorazione.</li>
  <li><strong>Requisiti igienico-sanitari</strong> della cucina e formazione HACCP per chi manipola alimenti.</li>
  <li><strong>Sicurezza e agibilità</strong> dei locali, impianti a norma e assicurazione.</li>
</ol>
<p>Se compri una struttura che ha già autorizzazioni e società, molti di questi passi sono già fatti: va verificato con il Comune come avviene il subentro.</p>
<h2>Gestire bene: quello che fa la differenza</h2>
<ul>
  <li><strong>Le foto e le recensioni</strong>: oggi si sceglie un agriturismo da telefono. Belle immagini e ospiti contenti valgono più di qualsiasi pubblicità.</li>
  <li><strong>La cucina</strong>: piatti semplici con i prodotti dell'azienda. È quello che le persone cercano e ricordano.</li>
  <li><strong>Le esperienze</strong>: raccolta delle olive, passeggiate a cavallo, corsi di cucina. Allungano il soggiorno e fanno tornare gli ospiti.</li>
  <li><strong>I giorni feriali</strong>: eventi aziendali, gruppi e soggiorni lunghi riempiono la settimana.</li>
  <li><strong>Le persone</strong>: una piccola squadra fidata, soprattutto in cucina e nelle pulizie.</li>
</ul>
<h2>La fiscalità agevolata</h2>
<p>Gli agriturismi possono contare su un <strong>regime fiscale agevolato</strong>, di cui parliamo nella <a href="/guida/sgravi-fiscali-e-incentivi-agricoltura">guida agli sgravi e agli incentivi</a>.</p>
<h2>Un agriturismo pronto a ripartire</h2>
<figure>{img("agriturismo-riano-sala-ristorante-camino", "Sala ristorante con camino dell'agriturismo in vendita a Riano")}<figcaption class="caption">La sala da 70 coperti della Tenuta Colle delle Rose.</figcaption></figure>
<p>La <a href="/agriturismo-in-vendita-roma">Tenuta Colle delle Rose</a> a Riano, 25 km da Roma, è in vendita con la <strong>società agricola</strong> e le autorizzazioni per <strong>agriturismo, ristorazione e macelleria</strong>. Ha 8 camere, una sala da 70 coperti con camino, una veranda e 21 ettari di terra. È il modo più rapido per aprire un agriturismo vicino Roma senza partire da zero.</p>
<p class="caption">Questa guida ha scopo informativo: requisiti e procedure vanno verificati con Comune, Regione Lazio e un consulente.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Aprire o gestire un agriturismo nel Lazio: requisiti, passi e consigli",
    desc="Come aprire o gestire un agriturismo vicino Roma: chi può farlo, i passi per le autorizzazioni, come gestirlo bene e una struttura con 8 camere pronta a ripartire.",
    keywords="aprire un agriturismo, come aprire un agriturismo nel Lazio, gestire un agriturismo, requisiti agriturismo, rilevare un agriturismo",
    h1="Aprire o gestire un agriturismo", eyebrow="Agriturismo",
    lead="Chi può farlo, cosa serve per partire e come gestirlo bene: una guida pratica per il Lazio.",
    hero="agriturismo-riano-porticato", hero_alt="Porticato di un agriturismo nella campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, CR_G, ("Aprire o gestire un agriturismo", None)],
    related=rel("agri", "g4", "matr"),
    aside_links=links("agri", "g2", "g4", "g6", "matr"),
    schema=[article(path, "Aprire o gestire un agriturismo", "Requisiti, passi e gestione di un agriturismo nel Lazio.", "agriturismo-riano-porticato")]))

# ---------------------------------------------------------------------------
# Sgravi fiscali e incentivi
# ---------------------------------------------------------------------------
path = P["g4"][0]
body = f'''<p>Chi sceglie di vivere e lavorare la terra in Italia trova un sistema di <strong>agevolazioni fiscali e incentivi</strong> pensato per chi fa agricoltura. Se ne conoscono poche, perché sono sparse tra leggi diverse. Le abbiamo raccolte qui, in parole semplici. Molte valgono se sei <strong>coltivatore diretto</strong> o <strong>imprenditore agricolo professionale (IAP)</strong>, o se compri tramite una società agricola.</p>
<h2>1. Meno imposte quando compri il terreno</h2>
<div class="table-wrap"><table>
<thead><tr><th>Chi compra il terreno agricolo</th><th class="num">Registro</th><th class="num">Ipotecaria</th><th class="num">Catastale</th></tr></thead>
<tbody>
<tr><td>Coltivatore diretto o IAP (piccola proprietà contadina)</td><td class="num">€ 200</td><td class="num">€ 200</td><td class="num">1%</td></tr>
<tr><td>Altri acquirenti</td><td class="num">15%</td><td class="num">€ 50</td><td class="num">€ 50</td></tr>
</tbody></table></div>
<p>Su un terreno da 600.000 euro sono circa <strong>6.400 euro</strong> di imposte invece di circa 90.000. In cambio bisogna coltivare il terreno per almeno 5 anni. I fabbricati seguono regole proprie, e per l'abitazione puoi avere l'agevolazione prima casa.</p>
<h2>2. Niente IMU sui terreni</h2>
<p>I terreni agricoli <strong>posseduti e coltivati</strong> da coltivatori diretti e IAP iscritti alla previdenza agricola sono <strong>esenti dall'IMU</strong>. I fabbricati rurali strumentali, come stalle e fienili, hanno un'aliquota molto bassa, che i Comuni possono anche azzerare.</p>
<h2>3. Tasse leggere sui redditi agricoli</h2>
<ul>
  <li>Il reddito dei terreni si calcola sui <strong>valori catastali</strong>, non su quanto incassi davvero. Negli ultimi anni per coltivatori diretti e IAP è stato esente del tutto o in parte: verifica le regole dell'anno in corso.</li>
  <li>L'<strong>agriturismo</strong> può usare un regime forfettario: il reddito imponibile è il <strong>25% dei ricavi</strong> e l'IVA si detrae in modo forfettario.</li>
  <li>Molte attività connesse, come la vendita diretta dei prodotti, rientrano nel reddito agricolo.</li>
</ul>
<h2>4. Incentivi per i giovani</h2>
<p>Se hai meno di 41 anni, l'agricoltura ha strumenti dedicati:</p>
<ul>
  <li><strong>ISMEA – Generazione Terra</strong>: mutui a lungo termine per comprare terreni.</li>
  <li><strong>ISMEA – Più Impresa</strong>: mutui a tasso zero e contributi a fondo perduto per avviare o ampliare un'azienda agricola, anche per le donne.</li>
  <li><strong>Premio di primo insediamento</strong>: un contributo della Regione per i giovani che avviano un'azienda agricola.</li>
  <li><strong>Sconti sui contributi previdenziali</strong>: più volte i giovani coltivatori diretti e IAP sono stati esonerati per i primi anni.</li>
</ul>
<h2>5. Contributi per lavori e investimenti</h2>
<ul>
  <li><strong>Bandi regionali per lo sviluppo rurale</strong>: macchinari, ammodernamento dei fabbricati, agriturismo e diversificazione.</li>
  <li><strong>Parco Agrisolare</strong> (PNRR): fotovoltaico sui tetti agricoli, anche insieme alla rimozione dell'amianto.</li>
  <li><strong>Bandi ISI dell'INAIL</strong>: sicurezza sul lavoro e, più volte, bonifica dell'amianto.</li>
</ul>
<p>I bandi aprono e chiudono ogni anno: conviene affidarsi a un'associazione di categoria o a un consulente che li segua.</p>
<h2>Come sfruttarli con una tenuta già avviata</h2>
<p>Comprare un'azienda che ha già una <strong>società agricola</strong> permette di accedere prima a molte di queste agevolazioni. Alla <a href="/">Tenuta Colle delle Rose</a> la società è compresa nella vendita, con 21 ettari di terreni e le autorizzazioni per agriturismo, ristorazione e macelleria. Le coperture in amianto di stalla e fienile sono un'occasione per i bandi su fotovoltaico e bonifica: ne parliamo nella <a href="/guida/bonifica-amianto-azienda-agricola">scheda sull'amianto</a>.</p>
<p class="caption">Questa guida ha scopo informativo: aliquote, requisiti e bandi cambiano nel tempo e vanno verificati con notaio, commercialista o associazione di categoria.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Sgravi fiscali e incentivi in agricoltura: imposte, IMU, ISMEA e contributi",
    desc="Tutte le agevolazioni per chi compra un'azienda agricola o apre un agriturismo: imposte ridotte, esenzione IMU, regime forfettario, mutui ISMEA per giovani e contributi.",
    keywords="sgravi fiscali agricoltura, incentivi agricoltura giovani, agevolazioni acquisto terreni agricoli, piccola proprietà contadina, esenzione IMU terreni agricoli, ISMEA Generazione Terra, regime fiscale agriturismo",
    h1="Sgravi fiscali e incentivi per chi sceglie l'agricoltura", eyebrow="Incentivi",
    lead="Imposte ridotte sull'acquisto, niente IMU sui terreni, tasse leggere e contributi per i giovani: cosa spetta a chi lavora la terra.",
    hero="tenuta-riano-terreni-seminativo", hero_alt="Terreni agricoli seminativi nella campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, CR_G, ("Sgravi fiscali e incentivi", None)],
    related=rel("g1", "terr", "g3"),
    aside_links=links("g1", "g2", "g6", "g3", "terr"),
    schema=[article(path, "Sgravi fiscali e incentivi per chi sceglie l'agricoltura", "Imposte ridotte, IMU, regime agriturismo, ISMEA e contributi per l'agricoltura.", "tenuta-riano-terreni-seminativo")]))

# ---------------------------------------------------------------------------
# Trasferirsi a Roma con la natura intorno
# ---------------------------------------------------------------------------
path = P["g5"][0]
body = f'''<p>Roma attira chi arriva da Milano, da Londra, da New York o da un piccolo paese di provincia. È la città della bellezza, del buon cibo, di un clima mite quasi tutto l'anno. Ma chi ci si trasferisce scopre presto anche l'altro lato: il traffico, gli appartamenti piccoli, il rumore.</p>
<p>C'è un modo per avere Roma senza rinunciare alla natura: vivere appena fuori, nella campagna a nord della città. Qui ci sono colline, uliveti e boschi, e il centro è a mezz'ora di strada.</p>
<h2>Perché Roma Nord</h2>
<ul>
  <li><strong>Collegamenti</strong>: la Via Flaminia e il Grande Raccordo Anulare portano in centro in 30–40 minuti. La ferrovia Roma–Viterbo arriva a Piazzale Flaminio, a due passi da Piazza del Popolo.</li>
  <li><strong>Natura</strong>: il Parco Regionale di Veio, la valle del Tevere e il Lago di Bracciano sono vicini.</li>
  <li><strong>Storia</strong>: lungo la Flaminia, strada romana del 220 a.C., si incontrano l'Arco di Malborghetto, legato a Costantino, e la Villa di Livia a Prima Porta.</li>
  <li><strong>Servizi</strong>: nel quadrante nord di Roma ci sono scuole, anche internazionali, ospedali, centri commerciali e impianti sportivi.</li>
  <li><strong>Aeroporto</strong>: Fiumicino è a circa 50 km, e anche il volo per tornare a casa non è un problema.</li>
</ul>
<h2>Com'è la vita di tutti i giorni</h2>
<p>Ti svegli con il silenzio e la luce sulle colline. Fai la spesa nei paesi vicini o direttamente dai produttori. Vai in città quando serve: per lavoro, per una mostra, per una cena a Trastevere. La sera torni dove c'è spazio, aria e un cielo pieno di stelle. Gli inverni sono miti e si mangia all'aperto da aprile a ottobre.</p>
<h2>Se arrivi dall'estero</h2>
<ul>
  <li><strong>Comprare casa in Italia</strong> si può anche senza residenza: serve un codice fiscale e un notaio, che in Italia è obbligatorio per il rogito e tutela entrambe le parti.</li>
  <li><strong>Cittadini dell'Unione Europea</strong>: possono trasferirsi liberamente.</li>
  <li><strong>Cittadini extra UE</strong>: esistono visti per chi vive di rendita (residenza elettiva), per chi lavora da remoto (nomadi digitali) e per chi investe o avvia un'impresa.</li>
  <li><strong>Fisco</strong>: l'Italia prevede regimi agevolati per chi trasferisce qui la residenza, in base alla situazione personale. Vanno valutati con un consulente prima del trasferimento.</li>
</ul>
<h2>Una casa, o una tenuta?</h2>
<p>Molti partono cercando una villa con giardino, poi si accorgono che con una cifra simile possono avere molto di più: una <strong>tenuta</strong> con più abitazioni per la famiglia e gli ospiti, terra per l'orto, gli ulivi e gli animali, e magari un'attività che produce reddito.</p>
<figure>{img("tenuta-riano-inquadramento-roma-nord", "Mappa della campagna a nord di Roma tra Via Flaminia e Tevere, con la Tenuta Colle delle Rose")}<figcaption class="caption">La Tenuta Colle delle Rose tra la Flaminia e il Tevere.</figcaption></figure>
<p>La <a href="/">Tenuta Colle delle Rose</a> a Riano è a 25 km da Roma: 21 ettari, quattro abitazioni, un agriturismo con 8 camere e una sala da 70 coperti, stalla e fienile. Chi arriva dall'estero può leggere la <a href="/en/guide/moving-to-italy-countryside-near-rome">versione in inglese</a> di questa guida.</p>'''
write(path, page(
    lang="it", path=path, date=DATE,
    title="Trasferirsi a Roma con la natura intorno: vivere nella campagna di Roma Nord",
    desc="Trasferirsi a Roma senza traffico e cemento: perché scegliere la campagna di Roma Nord, com'è la vita di tutti i giorni, collegamenti, servizi e consigli per chi arriva dall'estero.",
    keywords="trasferirsi a Roma, vivere vicino Roma nella natura, vivere a Roma Nord, casa in campagna vicino Roma, trasferirsi in Italia, vivere in Italia in campagna",
    h1="Trasferirsi a Roma con la natura intorno", eyebrow="Trasferirsi",
    lead="Per chi arriva da un'altra città o da un altro Paese e vuole Roma a mezz'ora, ma colline e silenzio fuori dalla finestra.",
    hero="tenuta-riano-vista-aerea-colline", hero_alt="Colline e campagna a nord di Roma vicino a Riano",
    body=body, crumbs=[CR_HOME, CR_G, ("Trasferirsi a Roma", None)],
    related=rel("g2", "g6", "agri"),
    aside_links=links("g2", "g6", "g1", "g4", "terr"),
    alternates={"it": path, "en": "/en/guide/moving-to-italy-countryside-near-rome"},
    schema=[article(path, "Trasferirsi a Roma con la natura intorno", "Vivere nella campagna di Roma Nord: collegamenti, servizi, natura e consigli per chi arriva dall'estero.", "tenuta-riano-vista-aerea-colline")]))

# ---------------------------------------------------------------------------
# EN: Moving to Italy
# ---------------------------------------------------------------------------
path = "/en/guide/moving-to-italy-countryside-near-rome"
body = f'''<p>Many people dream of <strong>moving to Italy</strong>: the food, the light, the history, a slower rhythm of life. Rome is often the first choice, but life in the city centre means traffic, small apartments and noise. There is another way: living in the countryside just north of Rome, with hills, olive groves and woods around you, and the Colosseum 30 minutes away.</p>
<h2>Why the countryside north of Rome</h2>
<ul>
  <li><strong>Close to everything</strong>: the ancient Via Flaminia and the Rome ring road take you to the centre in 30–40 minutes. A local railway runs to Piazzale Flaminio, next to Piazza del Popolo.</li>
  <li><strong>Nature</strong>: Veio Regional Park, the Tiber valley and Lake Bracciano are all nearby.</li>
  <li><strong>History on your doorstep</strong>: the Arch of Malborghetto, linked to Emperor Constantine, and the Villa of Livia, wife of Augustus.</li>
  <li><strong>International</strong>: Rome Fiumicino airport is about 50 km away, and northern Rome has international schools, hospitals and services.</li>
  <li><strong>Climate</strong>: mild winters, long springs and outdoor dining from April to October.</li>
</ul>
<h2>Buying property in Italy</h2>
<ol>
  <li><strong>Get an Italian tax code</strong> (codice fiscale), available from an Italian consulate or tax office.</li>
  <li><strong>Make an offer</strong>: a written purchase proposal, often with a small deposit.</li>
  <li><strong>Sign the preliminary contract</strong> (compromesso) with a larger deposit.</li>
  <li><strong>Complete the deed</strong> (rogito) before a notary, who checks the property and registers the sale.</li>
</ol>
<p>Foreigners can buy property in Italy: EU citizens on the same terms as Italians, and most others under reciprocity agreements. When farmland is involved, neighbouring farmers may have a legal right of first refusal, which the notary handles.</p>
<h2>Residency and taxes</h2>
<ul>
  <li><strong>EU citizens</strong> can move freely and register as residents.</li>
  <li><strong>Non-EU citizens</strong> can apply for visas such as the elective residence visa (for people with independent income), the digital nomad visa (for remote workers) or visas for investors and entrepreneurs.</li>
  <li><strong>Tax</strong>: Italy offers special tax regimes for people who move their tax residence here, depending on personal circumstances. Speak to an adviser before you move.</li>
</ul>
<h2>A house, or an estate?</h2>
<p>For the price of a villa with a garden, you can often have much more: an estate with several homes for family and guests, land for olives, a vegetable garden and animals, and a business that earns an income.</p>
<figure>{img("tenuta-riano-viale-ulivi-drone", "Olive-lined drive leading to the Colle delle Rose estate near Rome")}<figcaption class="caption">The olive drive of the Colle delle Rose estate.</figcaption></figure>
<p><a href="/en/">Colle delle Rose</a> in Riano, 25 km from Rome, is exactly that: 21 hectares, four apartments, an <a href="/en/agriturismo-for-sale-near-rome">agriturismo with 8 rooms</a> and a 70-cover dining room, a stable and a tuff-stone barn. We speak English and can introduce you to English-speaking notaries and advisers.</p>
<p class="caption">This guide is for general information. Visa, tax and legal rules change: always check with a qualified adviser.</p>'''
write(path, page(
    lang="en", path=path, date="29 October 2026",
    title="Moving to Italy: Countryside Living near Rome",
    desc="Thinking of moving to Italy? Why the countryside north of Rome works: nature, connections, buying property as a foreigner, residency options and a country estate for sale.",
    keywords="moving to Italy, move to Rome, living in the Italian countryside, buy property in Italy as a foreigner, country house near Rome, relocate to Italy",
    h1="Moving to Italy: a life in nature, 30 minutes from Rome", eyebrow="Relocating to Italy",
    lead="How to have Rome close by and hills, olive trees and quiet all around: practical notes for people moving from abroad.",
    hero="tenuta-riano-vista-aerea-colline", hero_alt="Rolling hills and countryside north of Rome",
    body=body, crumbs=[("Home", "/en/"), ("Moving to Italy", None)],
    related=[("/en/", "tenuta-riano-viale-ulivi-drone", "Estate", "Colle delle Rose Estate", "Photos, video, maps and key facts."),
             ("/en/agriturismo-for-sale-near-rome", "agriturismo-riano-sala-ristorante-camino", "Agriturismo", "Agriturismo for sale near Rome", "8 rooms, a 70-cover dining room and active licences."),
             ("/en/#before-after", "restyling-stile-boutique-sala", "Concepts", "Before and after", "Interior styles and the conversion of the farm buildings.")],
    aside_links=[("Main listing", "/en/"), ("Agriturismo for sale near Rome", "/en/agriturismo-for-sale-near-rome"), ("Video tour", "/en/#video"), ("Contact", "/en/#contact")],
    alternates={"it": P["g5"][0], "en": path},
    schema=[{"@type": "Article", "headline": "Moving to Italy: a life in nature, 30 minutes from Rome", "inLanguage": "en-GB",
             "datePublished": DATE_ISO, "dateModified": DATE_ISO, "mainEntityOfPage": SITE + path,
             "image": SITE + "/img/tenuta-riano-vista-aerea-colline.webp",
             "author": {"@type": "Organization", "name": "Colle delle Rose Estate"}}]))

# ---------------------------------------------------------------------------
# Scheda tecnica amianto (invariata)
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
path = G
def _cards(keys):
    return "\n".join(
        '<a class="card" href="%s">%s<div><span class="eyebrow">%s</span><h3>%s</h3><p>%s</p></div></a>'
        % (h, img(im, ti, sizes="(max-width: 860px) 100vw, 380px"), ey, ti, tx)
        for h, im, ey, ti, tx in [P[k] for k in keys])
body = f'''<p>Ognuno arriva in campagna con un sogno diverso: cambiare ritmo, crescere i figli all'aria aperta, vivere con gli animali, aprire un agriturismo, trasferirsi in Italia. Queste guide ti aiutano a capire come trasformarlo in un progetto concreto.</p>
<div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
{_cards(("g2", "g6", "g1", "g4", "g5"))}
</div>
<h2>Schede tecniche</h2>
<ul>
  <li><a href="{P['g3'][0]}">Bonifica dell'amianto in un'azienda agricola</a></li>
  <li><a href="/en/guide/moving-to-italy-countryside-near-rome">Moving to Italy: countryside living near Rome (English)</a></li>
</ul>
<h2>La tenuta, progetto per progetto</h2>
<ul>
  <li><a href="/agriturismo-in-vendita-roma">Agriturismo in vendita a Roma Nord</a></li>
  <li><a href="/location-matrimoni-in-vendita-roma">Location per matrimoni in vendita vicino Roma</a></li>
  <li><a href="/centro-equestre-in-vendita-roma">Centro equestre in vendita a Roma Nord</a></li>
  <li><a href="/terreno-agricolo-in-vendita-riano">Terreno agricolo in vendita a Riano</a></li>
</ul>'''
write(path, page(
    lang="it", path=path,
    title="Guida alla vita in campagna vicino Roma: cambiare vita, animali, agriturismo, incentivi",
    desc="Guide per chi vuole cambiare vita e vivere in campagna vicino Roma: animali, aprire un agriturismo, sgravi fiscali e incentivi, trasferirsi a Roma o in Italia.",
    h1="Vivere in campagna vicino Roma: la guida", eyebrow="Guida",
    lead="Cambiare vita, vivere con gli animali, aprire un agriturismo, trasferirsi in Italia: idee e informazioni pratiche.",
    hero="tenuta-riano-vista-aerea-nord", hero_alt="Prati e colline della campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, ("Guida", None)],
    aside_links=links("agri", "matr", "equi", "terr"),
    schema=[{"@type": "CollectionPage", "@id": SITE + G, "url": SITE + G, "name": "Vivere in campagna vicino Roma: la guida", "inLanguage": "it-IT"}]))

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

