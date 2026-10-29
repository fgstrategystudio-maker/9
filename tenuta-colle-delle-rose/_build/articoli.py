# Articoli aggiuntivi della guida + indice per categorie. Eseguito da pages.py dopo guida.py.
import re as _re

def md(src):
    """Markdown minimo: ## titoli, - elenchi, 1. elenchi numerati, > citazioni,
    !img:nome|alt|didascalia, **grassetto**, [testo](link)."""
    def inline(t):
        t = _re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
        t = _re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', t)
        return t
    out, lst = [], None
    for block in src.strip().split("\n\n"):
        lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
        if not lines:
            continue
        if lines[0].startswith("## "):
            out.append("<h2>%s</h2>" % inline(lines[0][3:]))
            lines = lines[1:]
            if not lines:
                continue
        if all(l.startswith("- ") for l in lines):
            out.append("<ul>\n" + "\n".join("  <li>%s</li>" % inline(l[2:]) for l in lines) + "\n</ul>")
        elif all(_re.match(r"\d+\. ", l) for l in lines):
            out.append("<ol>\n" + "\n".join("  <li>%s</li>" % inline(_re.sub(r"^\d+\. ", "", l)) for l in lines) + "\n</ol>")
        elif lines[0].startswith("> "):
            out.append("<blockquote>%s</blockquote>" % inline(" ".join(l[2:] for l in lines)))
        elif lines[0].startswith("!img:"):
            name, alt, cap = lines[0][5:].split("|")
            out.append('<figure>%s<figcaption class="caption">%s</figcaption></figure>' % (img(name, alt), cap))
        else:
            out.append("<p>%s</p>" % inline(" ".join(lines)))
    return "\n".join(out)

TENUTA_IT = ("La [Tenuta Colle delle Rose](/) a Riano, 25 km da Roma, ha 21 ettari, quattro abitazioni, "
             "un agriturismo con 8 camere e sala da 70 coperti, stalla e fienile. È in vendita a **€ 869.000**, "
             "con la società agricola e le autorizzazioni per agriturismo, ristorazione e macelleria.")

CATS = [
    ("vita", "Cambiare vita"),
    ("animali", "Animali, orto e terra"),
    ("ospitalita", "Agriturismo, eventi e ospitalità"),
    ("acquisto", "Comprare e investire"),
    ("incentivi", "Incentivi e fisco"),
    ("territorio", "Il territorio"),
]
# articoli già esistenti, assegnati alle categorie
CAT_OF = {"g2": "vita", "g5": "vita", "g6": "animali", "g1": "ospitalita", "g4": "incentivi", "g3": "acquisto"}

A = []  # (key, cat, slug, title, desc, kw, h1, lead, hero, card, body_md, related)

def art(key, cat, slug, title, desc, kw, h1, lead, hero, card, body, related):
    A.append((key, cat, slug, title, desc, kw, h1, lead, hero, card, body, related))

# =========================== CAMBIARE VITA ===========================
art("casale", "vita", "casale-in-campagna-vicino-roma",
    "Casale in campagna vicino Roma: cosa cercare prima di comprare",
    "Come scegliere un casale in campagna vicino Roma: posizione, accessi, acqua, terreno, stato dei fabbricati e possibilità di farne anche un'attività.",
    "casale in vendita vicino Roma, casale in campagna Roma, casale con terreno Roma nord, rustico in vendita Roma, casale con ettari",
    "Casale in campagna vicino Roma: cosa cercare", "Posizione, terra, acqua, fabbricati e futuro: le domande giuste prima di innamorarsi di un casale.",
    "agriturismo-riano-casale-facciata", "Le domande giuste prima di innamorarsi di un casale.",
    f"""
Il casale in campagna è il sogno di molti romani e di tanti stranieri che si innamorano dell'Italia. Muri spessi, tetti in coppi, un viale alberato, il silenzio. Ma un casale non si sceglie solo con il cuore. Ecco cosa guardare.

## La posizione, prima di tutto
Un casale bellissimo a due ore da tutto rischia di diventare una casa per le vacanze che si usa poco. Chiediti quanto tempo ci metti per arrivare a Roma, a una scuola, a un ospedale, a un supermercato. A nord di Roma, lungo la Via Flaminia, si trovano ancora proprietà agricole a mezz'ora dal centro.

## La strada e l'accesso
- La strada di accesso è asfaltata o sterrata? Chi la mantiene?
- In inverno, con la pioggia, si passa senza problemi?
- C'è spazio per parcheggiare, girare con un furgone, far arrivare un camion per i lavori?

## Acqua, luce e scarichi
In campagna non sono scontati. Verifica se c'è l'allaccio all'acquedotto o un pozzo autorizzato, se arriva la corrente e con quale potenza, come sono gestiti gli scarichi. Le fosse Imhoff sono la soluzione più comune per i casali isolati.

## Il terreno intorno
Un casale con pochi metri di giardino è una villa. Un casale con ettari di terra è un'altra vita: puoi avere ulivi, orto, animali, privacy vera. Più terra significa anche più manutenzione, ma i prati si possono affidare a un agricoltore della zona.

## Lo stato dei fabbricati
- **Tetti**: coppi da rivedere, travi, eventuali coperture in amianto sugli annessi agricoli.
- **Muri e umidità**: nei casali in tufo e pietra è normale, ma va gestita.
- **Impianti**: elettrico, riscaldamento, isolamento.
- **Regolarità**: i fabbricati devono corrispondere ai titoli edilizi e al catasto.

## Pensare al futuro
I casali più interessanti sono quelli che possono crescere con te: più unità abitative per i figli o gli ospiti, annessi da recuperare, la possibilità di ospitare persone o produrre qualcosa. Un casale che può diventare anche un'attività tiene meglio il suo valore.

!img:tenuta-riano-fronte-fabbricati|Casale con annessi agricoli in campagna vicino Roma|Il nucleo di fabbricati della Tenuta Colle delle Rose.

{TENUTA_IT}
""", ("g2", "terr", "famiglia"))

art("smart", "vita", "lavorare-da-remoto-in-campagna-vicino-roma",
    "Lavorare da remoto in campagna vicino Roma: come organizzarsi",
    "Smart working dalla campagna a nord di Roma: connessione, spazi di lavoro, ritmo delle giornate e come tenere un piede in città.",
    "smart working in campagna, lavorare da remoto in campagna, vivere in campagna e lavorare a Roma, casa in campagna smart working",
    "Lavorare da remoto, con la campagna fuori dalla finestra", "Connessione, spazi e ritmo: come rendere la campagna il tuo ufficio, senza perdere Roma.",
    "tenuta-riano-vista-aerea-nord", "Connessione, spazi e ritmo per lavorare dalla campagna.",
    f"""
Il lavoro da remoto ha cambiato le regole. Se non devi essere in ufficio ogni giorno, puoi scegliere dove vivere in base a come vuoi vivere. Per molti la risposta è la campagna, ma non troppo lontano dalla città.

## Il vantaggio di stare a mezz'ora da Roma
Chi lavora da remoto spesso deve comunque andare in ufficio uno o due giorni a settimana, incontrare clienti, prendere un aereo. A nord di Roma la Flaminia e il Grande Raccordo portano in centro in 30–40 minuti, e Fiumicino è a circa 50 km. Lavori dalla campagna e quando serve sei in città.

## La connessione
È la prima cosa da verificare, prima ancora di innamorarsi della vista. Oggi nelle zone rurali esistono più soluzioni: fibra dove arriva, collegamenti radio (FWA) e 5G. Durante la visita controlla il segnale del telefono e chiedi quali operatori coprono la zona. Una seconda linea di riserva è una buona idea per chi fa videochiamate tutto il giorno.

## Uno spazio solo per lavorare
In campagna lo spazio non manca, ed è uno dei vantaggi più grandi. Uno studio separato dalla casa, magari in un annesso recuperato, aiuta a separare il lavoro dalla vita. Con più unità abitative puoi trasformarne una in ufficio o in spazio di coworking per amici e colleghi.

## Il ritmo delle giornate
- Una passeggiata tra gli ulivi prima di accendere il computer.
- Pranzo all'aperto da aprile a ottobre.
- Le chiamate fatte camminando nei prati.
- Il tempo risparmiato nel traffico, restituito alla famiglia.

## Non isolarsi
Il rischio del lavoro da remoto in campagna è la solitudine. Aiuta avere una vita sociale in paese, ospitare amici, avere un'attività che porta persone, come un agriturismo o degli eventi.

{TENUTA_IT}
""", ("g2", "casale", "famiglia"))

art("famiglia", "vita", "crescere-i-figli-in-campagna-vicino-roma",
    "Crescere i figli in campagna vicino Roma: libertà, natura e scuole",
    "Perché sempre più famiglie scelgono di crescere i figli in campagna vicino Roma: spazio, animali, autonomia, e come organizzare scuola e attività.",
    "crescere i figli in campagna, vivere in campagna con bambini, famiglia in campagna vicino Roma, casa con giardino grande Roma",
    "Crescere i figli in campagna, a mezz'ora da Roma", "Spazio, animali, autonomia e stagioni: cosa cambia per i bambini, e come organizzarsi con scuola e attività.",
    "tenuta-riano-terreni-uliveto", "Spazio, animali e stagioni per crescere liberi.",
    f"""
Prati dove correre, alberi dove arrampicarsi, animali da accudire, il cielo pieno di stelle la sera. Per molti genitori crescere i figli in campagna è il regalo più bello che possono fare. Vicino Roma si può fare senza rinunciare alla città.

## Cosa cambia per i bambini
- **Spazio e movimento**: non serve organizzare il parco, il parco è fuori dalla porta.
- **Responsabilità**: dare da mangiare alle galline, curare l'orto, occuparsi di un cavallo insegnano più di molte lezioni.
- **Le stagioni**: la raccolta delle olive in autunno, la semina in primavera, la frutta d'estate.
- **Meno schermi**, più tempo all'aperto.

## La scuola e le attività
Il dubbio più comune è come organizzarsi con scuola, sport e amici. Nei comuni a nord di Roma ci sono scuole di ogni grado, e nel quadrante nord della città si trovano anche scuole internazionali. Con un po' di organizzazione, tra genitori e trasporti, la campagna diventa la base e la città il luogo delle attività.

## Una casa per più generazioni
Una tenuta con più abitazioni permette di vivere vicini ai nonni o ai figli grandi, ognuno a casa sua. È un modello di famiglia che in campagna torna naturale: ci si aiuta, ci si vede ogni giorno, ma si ha la propria privacy.

## La sicurezza
Recinzioni intorno alla casa, attenzione ai mezzi agricoli e agli animali grandi, un piano chiaro su dove si può andare da soli. Le regole sono poche e semplici, e i bambini le imparano presto.

!img:tenuta-riano-viale-ulivi-drone|Viale di ulivi e prati di una tenuta in campagna vicino Roma|Il viale di ulivi della Tenuta Colle delle Rose.

{TENUTA_IT}
""", ("g6", "multigen", "g2"))

art("procontro", "vita", "vivere-in-campagna-pro-e-contro",
    "Vivere in campagna: pro e contro, detti con onestà",
    "I veri pro e contro di vivere in campagna: spazio, salute e tempo contro distanze, manutenzione e servizi. E come la vicinanza a Roma cambia il bilancio.",
    "vivere in campagna pro e contro, vantaggi vivere in campagna, svantaggi vivere in campagna, trasferirsi in campagna",
    "Vivere in campagna: pro e contro", "Cosa si guadagna e cosa si lascia, senza filtri. E perché vicino a Roma il bilancio cambia.",
    "tenuta-riano-vista-aerea-colline", "Cosa si guadagna e cosa si lascia, senza filtri.",
    f"""
Chi sogna la campagna di solito pensa solo ai lati belli. Chi ci vive sa che ci sono anche le fatiche. Ecco un bilancio onesto, per decidere con gli occhi aperti.

## I vantaggi
- **Spazio**: dentro e fuori casa, per te, la famiglia, gli animali, i progetti.
- **Silenzio e aria pulita**: si dorme meglio, si respira meglio.
- **Tempo**: meno traffico, meno code, più ore per quello che conta.
- **Cibo vero**: olio, verdure, uova, frutta, a pochi metri dalla cucina.
- **Costo dello spazio**: a parità di prezzo, in campagna hai molti più metri quadri e terra.

## Gli svantaggi
- **Distanze**: per molte commissioni serve l'auto.
- **Manutenzione**: prati, siepi, strade interne, impianti. Va messa in conto, in tempo o in denaro.
- **Servizi**: negozi, medici e scuole sono meno a portata di mano.
- **Isolamento**: se non si cura la vita sociale, la campagna può pesare.

## Perché vicino a Roma il bilancio cambia
La maggior parte degli svantaggi nasce dalla distanza. A nord di Roma, a 25 km dal centro, la distanza si accorcia: la città è a 30–40 minuti, i comuni vicini hanno i servizi di base, l'aeroporto è raggiungibile. Rimangono i vantaggi, mentre gli svantaggi si riducono molto.

## E la manutenzione?
Su una proprietà grande la soluzione è organizzarsi: affidare i terreni a un agricoltore, avere un aiuto per il verde, oppure fare della proprietà un'attività che si ripaga, come un agriturismo, gli eventi o un centro equestre.

{TENUTA_IT}
""", ("g2", "casale", "pensione"))

art("pensione", "vita", "andare-in-pensione-in-campagna-vicino-roma",
    "Andare in pensione in campagna vicino Roma: una nuova stagione",
    "Andare in pensione in campagna: perché vicino Roma, come scegliere la casa, l'orto e gli animali, la vicinanza a figli, nipoti e servizi sanitari.",
    "pensione in campagna, trasferirsi in campagna in pensione, vivere in campagna da pensionati, casa in campagna per pensionati Roma",
    "Andare in pensione in campagna", "Tempo, orto, ulivi e nipoti in visita: come scegliere il posto giusto per la nuova stagione della vita.",
    "tenuta-riano-terreni-seminativo", "Tempo, orto e nipoti in visita, vicino ai servizi.",
    f"""
La pensione è il momento in cui finalmente il tempo è tuo. Per molti è anche il momento di realizzare un sogno rimasto in un cassetto: vivere in campagna. Coltivare l'orto, fare il proprio olio, avere un cane, ospitare figli e nipoti.

## Perché non troppo lontano
Con gli anni contano di più la vicinanza ai servizi sanitari, alla famiglia e agli amici. Una campagna a mezz'ora da Roma permette di avere tutto: la quiete fuori dalla finestra e la città a portata di mano quando serve.

## La casa giusta
- **Su un piano**, o con camere al piano terra, per gli anni a venire.
- **Facile da scaldare** e da tenere.
- **Spazio per gli ospiti**: figli e nipoti vengono più volentieri se c'è posto per tutti.
- **Un giardino o un orto** gestibile, con la possibilità di affidare il resto della terra.

## Un progetto, non solo una casa
Molti pensionati scoprono in campagna una seconda attività: produrre olio, ospitare qualche turista, organizzare corsi di cucina o di orto. Non per necessità, ma per il piacere di fare e di incontrare persone.

## Vivere vicini alla famiglia
Una proprietà con più abitazioni è la soluzione ideale per stare vicino a figli e nipoti senza vivere insieme. Ognuno ha la sua casa, ma ci si ritrova a cena sotto la veranda.

{TENUTA_IT}
""", ("multigen", "orto", "procontro"))

art("multigen", "vita", "una-tenuta-per-tutta-la-famiglia",
    "Una tenuta per tutta la famiglia: vivere vicini, ognuno a casa sua",
    "Perché una tenuta con più abitazioni è la soluzione per famiglie allargate: genitori, figli e nipoti vicini, ognuno con la sua casa, e una terra in comune.",
    "casa per più famiglie, tenuta con più abitazioni, casale con più unità abitative, vivere vicino ai genitori, casale bifamiliare Roma",
    "Una tenuta per tutta la famiglia", "Genitori, figli e nipoti vicini, ognuno a casa sua, con una terra in comune da vivere insieme.",
    "tenuta-riano-complesso-fabbricati-alto", "Genitori, figli e nipoti vicini, ognuno a casa sua.",
    f"""
Un tempo le famiglie italiane vivevano nello stesso casale, generazioni diverse sotto tetti vicini. Oggi questo modello torna di moda, per ragioni molto concrete: aiutarsi con i bambini, stare vicino ai genitori anziani, condividere spazi e costi.

## Il vantaggio di avere più abitazioni
- Ogni nucleo ha la **sua casa**, la sua cucina, la sua porta.
- Gli spazi esterni, la piscina o l'orto si **condividono**.
- I nonni aiutano con i nipoti, i figli aiutano i genitori.
- Le spese di manutenzione e di gestione si **dividono**.

## Come organizzarsi
Conviene mettersi d'accordo fin da subito su chi usa cosa, come si dividono le spese comuni e chi si occupa di cosa. Anche la forma di proprietà va scelta bene, ad esempio con un notaio: comproprietà, società, donazioni future.

## Quando la famiglia cambia
Le abitazioni che oggi servono ai figli domani possono diventare camere per gli ospiti, un ufficio, oppure un'attività di ospitalità. Una tenuta con più unità si adatta alle fasi della vita.

## Un esempio
Alla Tenuta Colle delle Rose ci sono **quattro unità abitative** nel casale (76, 77, 85 e 90 mq catastali), oltre all'agriturismo con 8 camere. È la configurazione ideale per una famiglia allargata che vuole vivere vicina e magari avviare insieme un'attività.

{TENUTA_IT}
""", ("famiglia", "pensione", "casale"))

# =========================== ANIMALI, ORTO E TERRA ===========================
art("cavalli", "animali", "tenere-i-cavalli-a-casa-propria",
    "Tenere i cavalli a casa propria: spazi, regole e gestione",
    "Come tenere i cavalli nella propria proprietà: box, paddock, fieno, registrazioni ASL, gestione quotidiana e cosa cercare in una tenuta vicino Roma.",
    "tenere cavalli a casa, casa con terreno per cavalli, proprietà per cavalli vicino Roma, casale con stalla, paddock cavalli",
    "Tenere i cavalli a casa propria", "Il sogno di vedere il proprio cavallo dalla finestra: spazi, regole e gestione quotidiana.",
    "riqualificazione-stalla", "Spazi, regole e gestione quotidiana dei cavalli.",
    f"""
Per chi ama i cavalli non c'è niente di più bello che averli a casa: vederli al pascolo dalla finestra, montare quando vuoi, non dipendere da un maneggio. Serve però una proprietà adatta.

## Gli spazi necessari
- **Box**: uno per cavallo, ampio, ventilato, con una corsia comoda.
- **Paddock e pascoli**: in genere si consiglia almeno mezzo ettaro a cavallo, diviso in più recinti da far riposare.
- **Fienile**: per fieno e lettiera, al riparo dalla pioggia.
- **Selleria** e un'area per lavare e curare i cavalli.
- **Un campo** per lavorare, all'aperto o coperto.

## Le regole
Ogni cavallo ha un passaporto e va iscritto all'anagrafe degli equidi. Il luogo dove vivono va registrato presso il servizio veterinario dell'ASL. Se i cavalli sono più di quelli di famiglia, o se ospiti cavalli di altri, conviene farlo attraverso un'azienda agricola.

## La gestione di ogni giorno
Pulizia dei box, fieno e acqua, uscite al paddock, controllo di zoccoli e salute. Con uno o due cavalli si fa da soli. Con di più serve un aiuto, che spesso si trova ospitando qualche cavallo di amici o vicini.

## Il fieno in casa
Avere terreni propri permette di produrre il fieno, che è la spesa principale. È uno dei motivi per cui una proprietà con ettari di prati è molto più comoda di una casa con un piccolo recinto.

!img:riqualificazione-stalla|Stalla trasformata in scuderia con box|Ipotesi di recupero della stalla da 750 mq della Tenuta Colle delle Rose.

La Tenuta Colle delle Rose ha una **stalla da 750 mq**, un **fienile da 400 mq** e **19,5 ettari** di prati. Leggi anche la pagina sul [centro equestre in vendita a Roma Nord](/centro-equestre-in-vendita-roma).
""", ("equi", "g6", "centroeq"))

art("olio", "animali", "produrre-il-proprio-olio-extravergine",
    "Produrre il proprio olio extravergine: dall'uliveto al frantoio",
    "Come produrre il proprio olio extravergine d'oliva: cura dell'uliveto, potatura, raccolta, frantoio e conservazione. Una guida per chi ha qualche decina di ulivi.",
    "produrre olio in proprio, uliveto vicino Roma, olio extravergine fatto in casa, raccolta olive, casale con uliveto",
    "Produrre il proprio olio extravergine", "Dalla potatura alla bottiglia: cosa serve per fare il tuo olio con qualche decina di ulivi.",
    "tenuta-riano-terreni-uliveto", "Dalla potatura alla bottiglia, con qualche decina di ulivi.",
    f"""
Pochi gesti raccontano la campagna italiana come la raccolta delle olive. Con qualche decina di piante puoi fare il tuo olio extravergine, regalarlo agli amici e portarlo in tavola tutto l'anno.

## Quanti ulivi servono
Dipende dall'annata e dalle piante. Come ordine di grandezza, da 100 kg di olive si ottengono in genere tra 12 e 18 litri di olio. Una settantina di ulivi in buona produzione possono dare più olio di quanto una famiglia consumi in un anno.

## La cura dell'uliveto
- **Potatura** a fine inverno, per far entrare luce e aria.
- **Pulizia** dell'erba intorno alle piante.
- **Concimazione** leggera, anche organica.
- **Controllo** dei parassiti, come la mosca dell'olivo.

## La raccolta
Nel Lazio si raccoglie di solito tra ottobre e novembre. Si stendono le reti sotto le piante e si fanno cadere le olive a mano o con piccoli attrezzi. È un lavoro faticoso ma allegro, da fare con amici e famiglia.

## Il frantoio
Le olive vanno portate al frantoio entro pochi giorni dalla raccolta: più sono fresche, migliore è l'olio. Nella campagna romana ci sono molti frantoi che lavorano anche piccole quantità per conto dei privati.

## Conservare l'olio
Al buio, al fresco, in contenitori di acciaio o vetro scuro. Così l'olio mantiene profumo e qualità fino alla raccolta successiva.

La Tenuta Colle delle Rose ha **circa 70 ulivi**, che a pieno regime arrivano a circa 13 quintali di olive. Molti sono lungo il viale d'ingresso.

{TENUTA_IT}
""", ("orto", "g6", "multifunz"))

art("orto", "animali", "orto-e-frutteto-familiare-in-campagna",
    "Orto e frutteto in campagna: come iniziare e cosa piantare",
    "Come avviare un orto e un frutteto familiare in campagna vicino Roma: scelta del posto, acqua, cosa piantare nelle varie stagioni e come organizzarsi.",
    "orto in campagna, frutteto familiare, autosufficienza alimentare, vivere in campagna orto, casa con orto vicino Roma",
    "Orto e frutteto in campagna", "Il primo passo verso un po' di autosufficienza: come iniziare, cosa piantare, quanto tempo serve.",
    "tenuta-riano-terreni-seminativo", "Il primo passo verso un po' di autosufficienza.",
    f"""
Un orto è spesso il primo progetto di chi si trasferisce in campagna. Dà soddisfazione in fretta, mette in tavola cibo vero e insegna i ritmi delle stagioni.

## Scegliere il posto
- **Sole**: almeno sei ore al giorno.
- **Acqua** vicina, per irrigare senza fatica.
- **Riparo** dal vento e, se ci sono animali, una recinzione.
- **Vicino a casa**: un orto che vedi ogni giorno è un orto curato.

## Cosa piantare
Nel clima mite di Roma l'orto produce quasi tutto l'anno:
- **Primavera ed estate**: pomodori, zucchine, melanzane, peperoni, fagiolini, basilico.
- **Autunno e inverno**: cavoli, broccoli, carciofi, finocchi, lattughe, fave.
- **Erbe aromatiche** tutto l'anno: rosmarino, salvia, alloro.

## Il frutteto
Fichi, peschi, albicocchi, susini, melograni, agrumi nei punti più riparati. Un piccolo frutteto di dieci o venti piante dà frutta per tutta la famiglia e per le marmellate.

## Quanto tempo serve
Un orto familiare di qualche centinaio di metri quadri richiede alcune ore a settimana, di più in primavera. Un impianto di irrigazione a goccia fa risparmiare molto tempo e acqua.

## Dall'orto alla tavola degli ospiti
Chi ha un agriturismo può servire le verdure dell'orto ai propri ospiti: è uno degli aspetti più apprezzati della cucina in campagna.

{TENUTA_IT}
""", ("olio", "g6", "fattoriadid"))

art("multifunz", "animali", "azienda-agricola-multifunzionale",
    "Azienda agricola multifunzionale: agricoltura, ospitalità e servizi",
    "Cos'è un'azienda agricola multifunzionale e perché conviene: agricoltura insieme ad agriturismo, vendita diretta, fattoria didattica, eventi ed energia.",
    "azienda agricola multifunzionale, multifunzionalità agricola, diversificazione azienda agricola, azienda agricola in vendita Roma",
    "L'azienda agricola multifunzionale", "Coltivare, ospitare, vendere, insegnare: perché le aziende agricole più solide fanno più cose insieme.",
    "tenuta-riano-fronte-fabbricati", "Coltivare, ospitare, vendere e insegnare insieme.",
    f"""
Per decenni l'azienda agricola ha fatto una cosa sola: produrre. Oggi le aziende più solide ne fanno molte. La legge italiana riconosce questa **multifunzionalità**: un'azienda agricola può affiancare alla coltivazione e all'allevamento una serie di attività connesse.

## Le attività che si possono affiancare
- **Agriturismo**: alloggio e ristorazione con i prodotti dell'azienda.
- **Vendita diretta**: olio, carne, verdure, uova, trasformati.
- **Fattoria didattica**: visite per scuole e famiglie.
- **Agricoltura sociale**: inserimento lavorativo e attività terapeutiche.
- **Eventi** e attività ricreative in campagna.
- **Energia**: impianti fotovoltaici sui tetti agricoli.

## Perché conviene
Ogni attività rafforza le altre. Gli ospiti dell'agriturismo comprano i prodotti, le scuole che visitano la fattoria tornano con le famiglie, gli eventi fanno conoscere l'azienda. E se un'annata agricola va male, le altre attività aiutano.

## La regola da rispettare
L'agricoltura deve restare l'attività principale. Le altre sono "connesse" e devono usare in prevalenza i prodotti e le risorse dell'azienda. È questo legame che permette di accedere al regime fiscale agevolato.

## Partire da un'azienda già avviata
Rilevare un'azienda che ha già autorizzazioni e strutture fa risparmiare anni. La Tenuta Colle delle Rose ha una società agricola con autorizzazioni per **agriturismo, ristorazione e macelleria**, oltre a stalla, fienile, magazzino e 21 ettari.

{TENUTA_IT}
""", ("g1", "fattoriadid", "filiera"))

art("fattoriadid", "animali", "aprire-una-fattoria-didattica-vicino-roma",
    "Aprire una fattoria didattica vicino Roma: come funziona",
    "Cos'è una fattoria didattica, chi può aprirla, cosa serve e perché vicino Roma c'è una grande domanda da parte di scuole e famiglie.",
    "fattoria didattica, aprire una fattoria didattica, fattoria didattica Roma, fattoria didattica Lazio, attività per scuole in campagna",
    "Aprire una fattoria didattica vicino Roma", "Scuole, famiglie e bambini di città che scoprono gli animali e la terra: un'attività bella e richiesta.",
    "tenuta-riano-vista-aerea-nord", "Scuole e famiglie che scoprono gli animali e la terra.",
    f"""
Per un bambino di città, toccare un asino, raccogliere un uovo o vedere come cresce il grano è un'esperienza che non dimentica. Le **fattorie didattiche** nascono per questo: aziende agricole che aprono le porte a scuole e famiglie.

## Chi può aprirla
Una fattoria didattica è un'azienda agricola che svolge anche attività educative. Molte regioni, tra cui il Lazio, prevedono un elenco o un riconoscimento specifico, con requisiti su sicurezza, spazi e formazione degli operatori.

## Cosa serve
- **Animali** facili da avvicinare: asini, capre, pecore, galline, conigli.
- **Un orto** e qualche coltivazione da mostrare.
- **Spazi coperti** per laboratori e pranzi, in caso di pioggia.
- **Servizi igienici** e aree sicure per i bambini.
- **Parcheggio** per pullman e auto.

## Perché vicino Roma
Roma ha centinaia di scuole e milioni di abitanti. Una fattoria a mezz'ora dalla città è perfetta per le gite scolastiche, i centri estivi e le domeniche in famiglia. Più si è vicini, più è facile organizzare.

## Un'attività che si sposa con le altre
La fattoria didattica funziona bene insieme a un agriturismo, che offre il pranzo, e ai prodotti dell'azienda, che le famiglie comprano tornando a casa.

{TENUTA_IT}
""", ("multifunz", "g6", "famiglia"))

art("filiera", "animali", "allevare-e-vendere-in-azienda-filiera-corta",
    "Allevare e vendere in azienda: macelleria aziendale e filiera corta",
    "Come funziona la filiera corta in un'azienda agricola: allevamento, macelleria aziendale autorizzata, vendita diretta e ristorazione con le proprie carni.",
    "filiera corta, vendita diretta carne azienda agricola, macelleria aziendale, allevamento e vendita diretta, azienda agricola con macelleria",
    "Allevare e vendere in azienda: la filiera corta", "Dall'allevamento al banco della macelleria aziendale, fino al piatto dell'agriturismo.",
    "tenuta-riano-corte-fienile-tufo", "Dall'allevamento al piatto, senza intermediari.",
    f"""
Sempre più persone vogliono sapere da dove viene la carne che mangiano. La **filiera corta** risponde a questa domanda: l'animale nasce e cresce in azienda e viene venduto direttamente a chi lo mangia, senza passaggi intermedi.

## Come funziona
1. **Allevamento** in azienda, con pascoli e fieno prodotti sul posto.
2. **Macellazione** presso strutture autorizzate.
3. **Lavorazione e vendita** in un locale aziendale autorizzato.
4. **Ristorazione**: le carni arrivano anche sulla tavola dell'agriturismo.

## Il valore dell'autorizzazione
Aprire una macelleria aziendale richiede locali a norma, autorizzazioni sanitarie e procedure precise. Per questo un'azienda che ha già l'autorizzazione parte con un vantaggio importante.

## Perché i clienti la scelgono
- **Fiducia**: conoscono l'allevatore e vedono gli animali.
- **Qualità**: animali allevati con calma, al pascolo.
- **Racconto**: un prodotto con una storia vale di più.

## Vicino a Roma
Una macelleria aziendale a mezz'ora da Roma può contare su clienti privati, ristoranti e gruppi di acquisto. Insieme all'agriturismo, permette di chiudere il cerchio: allevi, vendi e cucini.

La società agricola della Tenuta Colle delle Rose ha l'**autorizzazione alla macelleria**, oltre a quelle per agriturismo e ristorazione.

{TENUTA_IT}
""", ("multifunz", "g1", "agri"))

# =========================== OSPITALITÀ ===========================
art("bb", "ospitalita", "agriturismo-o-bb-in-campagna-differenze",
    "Agriturismo o B&B in campagna: le differenze da conoscere",
    "Agriturismo, B&B, casa vacanze o country house: le differenze tra le forme di ospitalità in campagna, chi può aprirle e quale conviene.",
    "differenza agriturismo B&B, country house, casa vacanze in campagna, aprire un B&B in campagna, ospitalità rurale",
    "Agriturismo o B&B in campagna?", "Agriturismo, B&B, casa vacanze, country house: cosa cambia e quale forma scegliere.",
    "agriturismo-riano-sala-colazioni", "Cosa cambia tra le forme di ospitalità in campagna.",
    f"""
Chi vuole ospitare persone in campagna si trova davanti a molte possibilità. Si somigliano, ma hanno regole molto diverse.

## Agriturismo
- È gestito da un **imprenditore agricolo**.
- L'agricoltura deve restare l'attività principale.
- Può offrire alloggio, ristorazione con prodotti dell'azienda, degustazioni, attività.
- Gode di un **regime fiscale agevolato**.

## B&amp;B
- Di solito è gestito nella propria abitazione, in forma non imprenditoriale o imprenditoriale secondo le regole regionali.
- Offre camere e colazione, con un numero limitato di posti letto.
- Non richiede un'attività agricola.

## Casa vacanze e affitti brevi
Si affittano appartamenti interi, senza servizi di ristorazione. Sono semplici da gestire ma con meno valore aggiunto.

## Country house e altre strutture
Strutture ricettive in zona rurale che non sono agriturismi: seguono le regole del turismo ordinario, con più libertà ma senza le agevolazioni agricole.

## Quale scegliere
Se hai terra e vuoi coltivarla o allevare, l'**agriturismo** è la forma più completa e conveniente: unisce ospitalità, cucina e prodotti in un'unica storia. Se vuoi solo ospitare qualche persona in casa, il B&B è più semplice.

{TENUTA_IT}
""", ("g1", "agri", "turismorur"))

art("wedding", "ospitalita", "aprire-una-location-per-matrimoni-in-campagna",
    "Aprire una location per matrimoni in campagna vicino Roma",
    "Cosa serve per aprire una location per matrimoni ed eventi in campagna vicino Roma: spazi, permessi, servizi, stagionalità e come farsi conoscere.",
    "aprire una location per matrimoni, location matrimoni in campagna Roma, location eventi in vendita, casale per matrimoni, wedding venue Roma",
    "Aprire una location per matrimoni in campagna", "Spazi, permessi, servizi e stagioni: come trasformare una tenuta in un luogo dove le persone si sposano.",
    "restyling-stile-boutique-sala", "Come trasformare una tenuta in un luogo dove sposarsi.",
    f"""
Sposarsi in campagna, in un casale circondato da ulivi, è il desiderio di moltissime coppie italiane e straniere. Roma, con il suo fascino e il suo aeroporto, è una delle mete più richieste. Ecco cosa serve per aprire una location di successo.

## Gli spazi
- **Un luogo per il rito**: un prato con vista, un viale alberato, un pergolato.
- **Uno spazio per l'aperitivo**, all'aperto ma vicino a un riparo.
- **Una sala per la cena**, anche per i mesi freddi o in caso di pioggia.
- **Camere** per gli sposi e gli ospiti che arrivano da lontano.
- **Parcheggio** e accessi comodi per fornitori e invitati.

## I permessi
Per un'attività di eventi stabile servono le verifiche di agibilità e sicurezza dei locali, le autorizzazioni per la somministrazione di cibo e bevande e attenzione all'impatto acustico. I requisiti dipendono dal numero di persone e vanno verificati con il Comune.

## I servizi
Molte location offrono un catering interno, altre lavorano con catering esterni selezionati. Con una cucina e i prodotti dell'azienda puoi offrire un menu a filiera corta, che le coppie apprezzano molto.

## Le stagioni
La stagione principale va da maggio a ottobre. Il resto dell'anno si riempie con eventi aziendali, compleanni, battesimi, cene private e feste di Natale.

## Farsi conoscere
Belle fotografie, recensioni, collaborazioni con wedding planner e fotografi, presenza sui portali dedicati ai matrimoni.

!img:restyling-stile-boutique-sala|Sala e veranda allestite per un matrimonio in campagna|Ipotesi di allestimento della Tenuta Colle delle Rose (simulazione).

Leggi anche la pagina sulla [location per matrimoni in vendita vicino Roma](/location-matrimoni-in-vendita-roma).

{TENUTA_IT}
""", ("matr", "g1", "bb"))

art("ritiri", "ospitalita", "ritiri-yoga-e-wellness-in-campagna-vicino-roma",
    "Ritiri yoga e wellness in campagna vicino Roma: un'opportunità",
    "Perché i ritiri yoga, di meditazione e di benessere cercano luoghi in campagna vicino Roma, e cosa serve a una tenuta per ospitarli.",
    "ritiri yoga Roma, ritiro yoga in campagna, struttura per ritiri, retreat center Italia, wellness in campagna vicino Roma",
    "Ritiri yoga e wellness in campagna", "Silenzio, natura e cibo sano a mezz'ora da Roma: perché i ritiri cercano luoghi come questo.",
    "tenuta-riano-vista-aerea-colline", "Silenzio e natura a mezz'ora da Roma.",
    f"""
Yoga, meditazione, digital detox, ritiri per aziende: il turismo del benessere è cresciuto molto negli ultimi anni. Chi organizza questi ritiri cerca sempre le stesse cose: silenzio, natura, spazi raccolti e cibo genuino.

## Cosa cercano gli organizzatori
- **Una sala** luminosa e tranquilla per la pratica, per 15–30 persone.
- **Camere** confortevoli, anche condivise.
- **Spazi all'aperto**: prati, alberi, sentieri per camminare.
- **Cucina** sana, con prodotti dell'orto e dell'azienda.
- **Facilità di arrivo**, soprattutto per chi viene dall'estero.

## Perché vicino Roma
Molti ritiri sono organizzati da insegnanti stranieri che portano gruppi internazionali. Una location a 50 km da Fiumicino e a 25 km da Roma permette di unire il ritiro a qualche giorno in città. È un vantaggio che le strutture isolate non hanno.

## Come iniziare
Non serve costruire una spa. Si parte da camere curate, una sala polivalente, una cucina attenta e la collaborazione con alcuni insegnanti e organizzatori. Con il tempo si possono aggiungere piscina, sauna o percorsi benessere.

## Come si sposa con le altre attività
I ritiri riempiono i periodi tranquilli dell'anno e i giorni feriali, complementari ai matrimoni e agli ospiti del fine settimana.

{TENUTA_IT}
""", ("bb", "turismorur", "g1"))

art("turismorur", "ospitalita", "turismo-rurale-intorno-a-roma",
    "Turismo rurale intorno a Roma: chi lo cerca e perché",
    "Chi sono i turisti che cercano la campagna intorno a Roma, cosa vogliono trovare e come una tenuta può accoglierli: famiglie, stranieri, romani, aziende.",
    "turismo rurale Roma, campagna romana turismo, agriturismo vicino Roma, weekend in campagna vicino Roma, turismo esperienziale Lazio",
    "Turismo rurale intorno a Roma", "Romani in cerca di aria, turisti stranieri, famiglie, aziende: chi sceglie la campagna intorno alla capitale.",
    "agriturismo-riano-porticato", "Chi sceglie la campagna intorno alla capitale, e perché.",
    f"""
Roma è una delle città più visitate al mondo. Ma accanto al turismo dei monumenti cresce quello di chi vuole vivere la **campagna romana**: dormire tra gli ulivi, mangiare prodotti del territorio, fare un'esperienza autentica.

## Chi sono i turisti rurali
- **I romani**: pranzi della domenica, weekend fuori porta, feste e compleanni.
- **I turisti stranieri**: vogliono vedere Roma ma dormire in campagna, o aggiungere qualche giorno di relax.
- **Le famiglie**: cercano spazio, animali e attività per i bambini.
- **Le aziende**: team building, riunioni, cene aziendali.
- **I camminatori e i ciclisti**: percorsi nella natura e lungo antiche strade.

## Cosa cercano
Autenticità, cibo vero, paesaggio, silenzio. E la comodità di arrivare in fretta da Roma o dall'aeroporto.

## Le esperienze che funzionano
- Raccolta delle olive e degustazione dell'olio.
- Corsi di cucina con i prodotti dell'orto.
- Passeggiate a cavallo o a piedi.
- Cene sotto le stelle in veranda.

## Il vantaggio della vicinanza
Una tenuta a 25 km da Roma può intercettare tutti questi pubblici. Una struttura a due ore dalla città ne raggiunge solo una parte.

{TENUTA_IT}
""", ("bb", "ritiri", "g1"))

art("centroeq", "ospitalita", "avviare-un-centro-equestre",
    "Avviare un centro equestre: strutture, permessi e attività",
    "Cosa serve per avviare un centro equestre: scuderia, campi, paddock, istruttori, permessi, attività di pensione, scuola e turismo equestre.",
    "avviare un centro equestre, aprire un maneggio, centro equestre requisiti, pensione cavalli, maneggio vicino Roma",
    "Avviare un centro equestre", "Scuderia, campi, istruttori e permessi: cosa serve per trasformare una proprietà in un centro per cavalli e cavalieri.",
    "riqualificazione-stalla", "Scuderia, campi, istruttori e permessi.",
    f"""
Roma ha una grande comunità di appassionati di equitazione, dai bambini delle scuole di equitazione ai cavalieri che cercano una pensione per il proprio cavallo. Un centro equestre vicino alla città risponde a una domanda costante.

## Le strutture
- **Scuderia** con box, selleria, deposito del fieno e infermeria.
- **Campi**: almeno un campo all'aperto, meglio se anche uno coperto.
- **Paddock** per far uscire i cavalli ogni giorno.
- **Club house**: spogliatoi, servizi, un punto ristoro.
- **Parcheggio** anche per i van dei cavalli.

## Le persone
Istruttori qualificati e un responsabile della scuderia sono il cuore di un centro equestre. Per le attività sportive conviene affiliarsi a una federazione o a un ente di promozione sportiva.

## Le attività
- **Pensione** per cavalli di privati.
- **Scuola di equitazione** per bambini e adulti.
- **Centri estivi** e feste di compleanno.
- **Turismo equestre**: passeggiate e trekking.
- **Gare** e manifestazioni.

## I permessi
Registrazione della struttura presso l'ASL, rispetto delle norme sul benessere animale, verifiche urbanistiche per campi, recinzioni e strutture coperte. Farlo all'interno di un'azienda agricola semplifica molti aspetti.

Leggi la pagina sul [centro equestre in vendita a Roma Nord](/centro-equestre-in-vendita-roma): stalla da 750 mq, fienile da 400 mq e 19,5 ettari di prati.

{TENUTA_IT}
""", ("equi", "cavalli", "multifunz"))

# =========================== COMPRARE E INVESTIRE ===========================
art("passi", "acquisto", "comprare-una-tenuta-agricola-passo-passo",
    "Comprare una tenuta agricola: i passi dall'offerta al rogito",
    "Come si compra una tenuta agricola in Italia: visita, documenti, proposta, compromesso, prelazione agraria, rogito dal notaio e costi da prevedere.",
    "comprare una tenuta agricola, acquisto azienda agricola, come comprare un terreno agricolo, compromesso terreno agricolo, rogito tenuta",
    "Comprare una tenuta agricola, passo dopo passo", "Dalla prima visita al rogito: cosa succede, chi fa cosa e quali documenti chiedere.",
    "tenuta-riano-mappa-catastale", "Dalla prima visita al rogito, chi fa cosa.",
    f"""
Comprare una tenuta agricola è più articolato che comprare un appartamento: ci sono terreni, fabbricati di tipo diverso, a volte una società e regole speciali come la prelazione agraria. Ecco il percorso, passo dopo passo.

## 1. Visita e primo esame
Visita la proprietà più di una volta, in stagioni diverse se puoi. Chiedi il dossier con planimetrie, visure catastali e foto. Fatti accompagnare da un tecnico di fiducia.

## 2. I controlli
- **Catasto e conformità urbanistica** dei fabbricati.
- **Certificato di destinazione urbanistica** dei terreni.
- **Vincoli** paesaggistici o idrogeologici.
- **Autorizzazioni** delle attività, se compri anche un'azienda.
- **Situazione della società**, se rilevi quote o un'azienda avviata.

## 3. La proposta d'acquisto
Una proposta scritta con il prezzo e le condizioni, spesso con un piccolo deposito. Se il venditore la accetta, diventa vincolante.

## 4. Il compromesso
Il contratto preliminare fissa prezzo, tempi e caparra. Conviene registrarlo e, nei casi più complessi, trascriverlo.

## 5. La prelazione agraria
Prima del rogito il venditore deve offrire il terreno, alle stesse condizioni, agli aventi diritto: l'affittuario coltivatore diretto o i confinanti coltivatori diretti con i requisiti di legge. Hanno 30 giorni per rispondere.

## 6. Il rogito
Si firma davanti al notaio, che verifica tutto, calcola e versa le imposte e registra il passaggio di proprietà.

## I costi da prevedere
Imposte (molto diverse se sei coltivatore diretto o IAP), notaio, tecnici, eventuale mediazione. Ne parliamo nella [guida agli sgravi e agli incentivi](/guida/sgravi-fiscali-e-incentivi-agricoltura).

{TENUTA_IT}
""", ("prelazione", "societa", "g4"))

art("prelazione", "acquisto", "prelazione-agraria-come-funziona",
    "Prelazione agraria: come funziona e cosa rischia chi compra",
    "Cos'è la prelazione agraria, chi ne ha diritto (affittuario e confinante coltivatore diretto), come si notifica, i 30 giorni e il riscatto.",
    "prelazione agraria, prelazione agraria confinante, prelazione agraria come funziona, diritto di prelazione terreni agricoli, riscatto agrario",
    "Prelazione agraria: come funziona", "Chi può comprare al posto tuo, come si notifica e perché non va mai saltata.",
    "tenuta-riano-terreni-seminativo", "Chi può comprare al posto tuo, e come si notifica.",
    f"""
Quando si vende un terreno agricolo in Italia, alcuni soggetti hanno il diritto di comprarlo **prima** di chiunque altro, allo stesso prezzo e alle stesse condizioni. È la **prelazione agraria**, nata per favorire chi coltiva la terra.

## Chi ne ha diritto
1. **L'affittuario** coltivatore diretto che lavora il terreno da almeno due anni.
2. In mancanza di affittuari, i **confinanti** coltivatori diretti o IAP che coltivano il terreno vicino, con i requisiti di legge.

## Come funziona
1. Venditore e acquirente si accordano sul prezzo, di solito con un preliminare.
2. Il venditore notifica la proposta agli aventi diritto, con prezzo e condizioni.
3. Chi ha diritto ha **30 giorni** per dire se vuole comprare.
4. Se nessuno esercita la prelazione, si procede con il rogito.

## Cosa succede se non si notifica
Se la prelazione non viene rispettata, l'avente diritto può esercitare il **riscatto**: entro un certo tempo può subentrare all'acquirente pagando lo stesso prezzo. Per chi compra è un rischio serio.

## Quando non si applica
Ci sono casi di esclusione, ad esempio per terreni con destinazione diversa da quella agricola o quando l'acquirente stesso ha certi requisiti. Va valutato caso per caso con il notaio.

## Il consiglio
Fai gestire la notifica dal notaio o dal tuo legale, conserva le prove dell'invio e aspetta la scadenza dei 30 giorni prima del rogito.

{TENUTA_IT}
""", ("passi", "g4", "terreni"))

art("terreni", "acquisto", "investire-in-terreni-agricoli-vicino-roma",
    "Investire in terreni agricoli vicino Roma: perché la terra tiene valore",
    "Perché investire in terreni agricoli vicino a Roma: scarsità, protezione del patrimonio, rendita da affitto, opzioni future e cosa valutare.",
    "investire in terreni agricoli, terreni agricoli vicino Roma, investimento in terra, comprare terreno agricolo come investimento, riserva di valore",
    "Investire in terreni agricoli vicino Roma", "La terra non si produce più: perché un grande terreno vicino a una capitale è un bene raro.",
    "tenuta-riano-vista-aerea-nord", "Perché un grande terreno vicino a Roma è un bene raro.",
    f"""
La terra è uno dei beni più antichi su cui investire, e uno dei pochi che non si può produrre. Vicino alle grandi città, gli appezzamenti agricoli ampi e interi sono sempre meno: si frazionano, si costruiscono, si vincolano.

## Perché la terra vicino Roma
- **Scarsità**: proprietà sopra i venti ettari a mezz'ora da Roma sono rare.
- **Domanda**: agricoltura, turismo, eventi, cavalli, energia, residenza.
- **Stabilità**: la terra non segue le mode dei mercati finanziari.
- **Uso**: a differenza di altri investimenti, la puoi vivere.

## Come rende
La terra si può affittare a un coltivatore diretto con contratti pluriennali, lavorare direttamente o usare per attività connesse come agriturismo ed eventi. Anche quando rende poco, mantiene il suo valore e tiene aperte tutte le opzioni.

## Cosa valutare
- **Accesso** e strade.
- **Acqua** e sistemi di scolo.
- **Destinazione urbanistica** e vincoli.
- **Fabbricati**: un terreno con strutture vale di più e offre più usi.
- **Agevolazioni fiscali**, se hai i requisiti di coltivatore diretto o IAP.

## Una strategia di lungo periodo
Molti investitori comprano la terra pensando ai figli: un patrimonio che resta, che si può vivere nel frattempo e che si può trasformare quando cambiano le esigenze.

{TENUTA_IT}
""", ("terr", "passi", "g4"))

art("societa", "acquisto", "rilevare-una-societa-agricola",
    "Rilevare una società agricola: vantaggi e controlli da fare",
    "Comprare una società agricola già avviata invece dei soli immobili: vantaggi (autorizzazioni, tempi, agevolazioni) e verifiche da fare prima.",
    "rilevare una società agricola, comprare una società agricola, cessione azienda agricola, subentro azienda agricola, società agricola in vendita",
    "Rilevare una società agricola", "Autorizzazioni già pronte e tempi più brevi: perché conviene, e cosa controllare prima di firmare.",
    "tenuta-riano-fronte-fabbricati", "Autorizzazioni pronte e tempi più brevi.",
    f"""
Quando compri una proprietà agricola puoi scegliere tra due strade: comprare solo gli immobili e partire da zero, oppure rilevare anche la **società agricola** che li gestisce. La seconda strada ha vantaggi importanti.

## I vantaggi
- **Autorizzazioni esistenti**: agriturismo, ristorazione, vendita diretta, macelleria. Ottenerle da zero richiede tempo e progetti.
- **Tempi più brevi** per ripartire con le attività.
- **Qualifica agricola**: la società può avere già i requisiti per agevolazioni e bandi.
- **Storia**: un'azienda con un nome e una clientela parte avvantaggiata.

## I controlli da fare
- **Bilanci e debiti**: con le quote si eredita anche il passato.
- **Contratti in corso**: affitti, fornitori, dipendenti.
- **Contributi pubblici ricevuti**: alcuni hanno vincoli di durata.
- **Situazione fiscale e previdenziale**.
- **Autorizzazioni**: verifica con Comune e Regione che restino valide con i nuovi soci.

## Come si fa
Si possono acquistare le quote della società oppure l'azienda, cioè l'insieme di beni e contratti. Le due strade hanno effetti fiscali e legali diversi: vanno valutate con un commercialista e un notaio.

## Un esempio
La Tenuta Colle delle Rose è proposta insieme alla **società agricola** e alle autorizzazioni per agriturismo, ristorazione e macelleria. I dettagli sono nel dossier riservato.

{TENUTA_IT}
""", ("passi", "g1", "multifunz"))

art("fotovoltaico", "incentivi", "fotovoltaico-sui-tetti-agricoli",
    "Fotovoltaico sui tetti agricoli: energia e risparmio per l'azienda",
    "Installare il fotovoltaico sui tetti di stalle e fienili: vantaggi, rimozione dell'amianto, autoconsumo, contributi come Parco Agrisolare e cosa valutare.",
    "fotovoltaico agricolo, fotovoltaico su tetti agricoli, Parco Agrisolare, fotovoltaico stalla, sostituzione amianto con fotovoltaico",
    "Fotovoltaico sui tetti agricoli", "Stalle e fienili che producono energia: come si fa, quando conviene e quali contributi esistono.",
    "tenuta-riano-corte-fienile-tufo", "Stalle e fienili che producono energia.",
    f"""
I tetti delle stalle e dei fienili sono grandi, spesso ben esposti e inutilizzati. Coprirli con pannelli fotovoltaici permette a un'azienda agricola di produrre energia per sé e ridurre i costi.

## Perché proprio i tetti agricoli
- **Superfici ampie** senza consumare terreno coltivabile.
- **Autoconsumo**: l'energia serve a cucina, celle frigo, impianti, abitazioni.
- **Valore**: un'azienda con energia propria è più efficiente e più appetibile.

## L'occasione dell'amianto
Molti fabbricati agricoli hanno ancora coperture in cemento-amianto. Rimuoverle e sostituirle con un nuovo tetto con pannelli risolve due problemi insieme: la bonifica e l'energia.

## I contributi
Negli ultimi anni il programma **Parco Agrisolare** del PNRR ha finanziato il fotovoltaico sui tetti agricoli, comprendendo anche la rimozione dell'amianto e l'isolamento. Altri bandi regionali e nazionali sostengono l'efficienza energetica delle aziende. I bandi cambiano: va verificato cosa è aperto.

## Cosa valutare
- **Orientamento e inclinazione** del tetto.
- **Statica** della struttura, che deve reggere il nuovo peso.
- **Consumi** dell'azienda, per dimensionare l'impianto.
- **Allaccio** alla rete e pratiche con il gestore.

Alla Tenuta Colle delle Rose la stalla (750 mq) e il fienile (400 mq) hanno coperture in amianto da bonificare. Leggi anche la [scheda sulla bonifica dell'amianto](/guida/bonifica-amianto-azienda-agricola).

{TENUTA_IT}
""", ("g3", "g4", "giovani"))

art("giovani", "incentivi", "giovani-agricoltori-come-iniziare",
    "Giovani agricoltori: come iniziare con gli aiuti ISMEA e regionali",
    "Hai meno di 41 anni e vuoi lavorare la terra? Gli aiuti per giovani agricoltori: ISMEA Generazione Terra e Più Impresa, premio di primo insediamento, sgravi.",
    "giovani agricoltori incentivi, ISMEA Generazione Terra, ISMEA Più Impresa, primo insediamento giovani agricoltori Lazio, aiuti per aprire azienda agricola",
    "Giovani agricoltori: come iniziare", "Mutui agevolati, contributi e sgravi: gli strumenti per chi ha meno di 41 anni e vuole lavorare la terra.",
    "tenuta-riano-terreni-uliveto", "Mutui, contributi e sgravi per chi ha meno di 41 anni.",
    f"""
L'agricoltura italiana ha bisogno di giovani, e lo Stato e le Regioni lo sanno. Per chi ha meno di 41 anni esistono strumenti pensati apposta per comprare terra e avviare un'azienda.

## Comprare la terra: Generazione Terra
ISMEA, l'istituto pubblico per il mercato agricolo, con **Generazione Terra** finanzia l'acquisto di terreni da parte di giovani agricoltori, con mutui a lungo termine e condizioni agevolate.

## Avviare l'azienda: Più Impresa
Con **Più Impresa** ISMEA sostiene giovani e donne che avviano o ampliano un'azienda agricola, con mutui a tasso agevolato e una parte a fondo perduto.

## Il premio di primo insediamento
Le Regioni, attraverso i programmi di sviluppo rurale, danno un **premio** ai giovani che si insediano per la prima volta come capo di un'azienda agricola, legato a un piano aziendale.

## Gli sgravi
- **Imposte ridotte** sull'acquisto di terreni per coltivatori diretti e IAP.
- **Esenzione IMU** sui terreni posseduti e coltivati.
- **Esoneri contributivi** che negli anni sono stati più volte previsti per i giovani agricoltori.

## Il percorso
1. Definisci il progetto e il piano aziendale.
2. Acquisisci i requisiti, come la qualifica di IAP o coltivatore diretto.
3. Verifica i bandi aperti con un'associazione di categoria.
4. Cerca la proprietà adatta, meglio se con strutture già pronte.

I bandi cambiano ogni anno: verifica sempre requisiti e scadenze sui siti di ISMEA e della Regione Lazio.

{TENUTA_IT}
""", ("g4", "fotovoltaico", "societa"))

# =========================== TERRITORIO ===========================
art("riano", "territorio", "riano-storia-natura-cosa-vedere",
    "Riano: storia, natura e cosa vedere a nord di Roma",
    "Riano, borgo della valle del Tevere a nord di Roma: il centro storico sul tufo, la campagna, il Parco di Veio, la Flaminia e cosa vedere nei dintorni.",
    "Riano, Riano cosa vedere, vivere a Riano, Riano Roma Nord, Colle delle Rose Riano, campagna di Riano",
    "Riano: storia e natura a nord di Roma", "Un borgo sul tufo affacciato sul Tevere, colline coltivate e la Flaminia: il territorio della tenuta.",
    "tenuta-riano-vista-aerea-colline", "Un borgo sul tufo e colline coltivate sopra il Tevere.",
    f"""
Riano è un comune della città metropolitana di Roma, nella valle del Tevere, a circa 25 km a nord della capitale. Il suo territorio va dal centro storico, arroccato su uno sperone di tufo, fino alla Via Flaminia, tra colline coltivate, valli boscose e piccole località immerse nel verde.

## Il borgo
Il centro storico conserva l'impianto di un borgo medievale, con vicoli, scorci sulla valle e la vista che spazia verso i monti della Sabina. Intorno, i quartieri più recenti e le frazioni residenziali.

## La campagna
Il paesaggio è quello tipico dell'Agro romano a nord della città: colline dolci, seminativi, uliveti, fossi alberati che scendono verso il Tevere. Molte aziende agricole producono olio, cereali e foraggi.

## Colle delle Rose
Verso la Flaminia si trova la località **Colle delle Rose**, una zona collinare con case immerse nel verde e terreni agricoli. Qui si trova la tenuta in vendita: 21 ettari tra la Via Flaminia e Via Codette.

## I dintorni
- **Arco di Malborghetto**, monumento romano legato a Costantino, sulla Flaminia.
- **Parco Regionale di Veio**, con boschi e sentieri.
- **Valle del Tevere**, per passeggiate e percorsi in bicicletta.
- **Borghi vicini** come Sacrofano, Castelnuovo di Porto e Morlupo.

## I collegamenti
La Flaminia porta a Roma in 30–40 minuti; la ferrovia Roma–Viterbo collega i comuni della zona con Piazzale Flaminio; Fiumicino è a circa 50 km.

{TENUTA_IT}
""", ("g5", "flaminia", "veio"))

art("flaminia", "territorio", "via-flaminia-da-roma-a-riano",
    "La Via Flaminia da Roma a Riano: duemila anni di strada",
    "La storia della Via Flaminia, la consolare aperta nel 220 a.C., da Ponte Milvio a Prima Porta, Malborghetto e Riano: monumenti e paesaggi lungo il percorso.",
    "Via Flaminia storia, Arco di Malborghetto, Villa di Livia Prima Porta, Flaminia Roma Nord, strade consolari romane",
    "La Via Flaminia, da Roma a Riano", "La strada consolare che da duemila anni porta fuori Roma verso nord, tra ponti, ville imperiali e archi.",
    "tenuta-riano-inquadramento-roma-nord", "La consolare che da duemila anni porta verso nord.",
    f"""
Pochi luoghi raccontano la storia come le strade consolari romane. La **Via Flaminia**, aperta nel 220 a.C. dal censore Gaio Flaminio, collegava Roma all'Adriatico. Ancora oggi è la strada che dalla città porta verso la campagna a nord, fino a Riano e oltre.

## Ponte Milvio
La Flaminia esce da Roma attraversando il Tevere a **Ponte Milvio**, uno dei ponti più antichi della città. Qui nel 312 d.C. Costantino sconfisse Massenzio, nella battaglia che cambiò la storia dell'Impero.

## Prima Porta e la Villa di Livia
A Prima Porta si trovano i resti della **villa di Livia**, moglie dell'imperatore Augusto. Da qui provengono gli affreschi del giardino dipinto e la celebre statua di Augusto, oggi conservati nei musei di Roma.

## L'Arco di Malborghetto
Più a nord, lungo la strada, si incontra l'**Arco di Malborghetto**, un arco a quattro fronti legato alla vittoria di Costantino. Nel tempo è stato trasformato in casale e stazione di posta, e oggi ospita uno spazio museale.

## La campagna
Superato il Grande Raccordo, la Flaminia entra nella campagna: colline, uliveti, valli boscose, piccoli borghi sul tufo. È il paesaggio in cui si trova la Tenuta Colle delle Rose, poco sopra Malborghetto.

## Una strada da vivere
Oltre a essere un collegamento comodo con Roma, la Flaminia è una strada da scoprire: in bicicletta, a piedi lungo i tratti antichi, fermandosi nei borghi e nelle aziende agricole.

{TENUTA_IT}
""", ("riano", "veio", "g5"))

art("veio", "territorio", "parco-di-veio-natura-a-nord-di-roma",
    "Il Parco di Veio: natura e storia a nord di Roma",
    "Il Parco Regionale di Veio a nord di Roma: boschi, forre di tufo, cascate, l'antica città etrusca e i sentieri per scoprirlo.",
    "Parco di Veio, Parco Regionale di Veio, natura a nord di Roma, Veio etrusca, sentieri vicino Roma",
    "Il Parco di Veio, natura a nord di Roma", "Forre di tufo, boschi, cascate e una città etrusca: la grande area verde a due passi dalla tenuta.",
    "tenuta-riano-terreni-uliveto", "Forre di tufo, boschi e una città etrusca.",
    f"""
A nord di Roma si estende uno dei parchi più belli e meno conosciuti del Lazio: il **Parco Regionale di Veio**. Comprende il territorio di diversi comuni, tra cui Riano, Sacrofano, Formello, Campagnano, Castelnuovo di Porto, Magliano Romano, Mazzano Romano, Morlupo e una parte di Roma.

## Il paesaggio
Il parco è segnato dalle **forre**, valli strette e profonde scavate nel tufo dai corsi d'acqua, coperte di boschi. Tra una forra e l'altra si aprono pianori coltivati, pascoli e uliveti.

## La storia
Il parco prende il nome da **Veio**, una delle più importanti città etrusche, rivale di Roma fino al IV secolo a.C. Oggi se ne visitano i resti, tra cui l'area del santuario di Portonaccio, oltre a necropoli e antiche vie.

## Cosa fare
- **Passeggiate e trekking** lungo i sentieri del parco.
- **Cascate** e corsi d'acqua nelle forre.
- **Bicicletta e cavallo** sulle strade bianche.
- **Borghi** come Calcata, Formello e Sacrofano.

## Vivere vicino al parco
Chi vive nella campagna a nord di Roma ha questa natura a portata di mano: un'uscita a cavallo, una camminata la domenica, una gita con i bambini.

{TENUTA_IT}
""", ("riano", "flaminia", "g6"))

# =========================== INGLESE ===========================
EN_ARTS = []
EN_ARTS.append(("/en/guide/why-buy-an-agriturismo-in-italy",
    "Why Buy an Agriturismo in Italy: A Guide for International Buyers",
    "What an agriturismo is, why it is one of the best ways to own a country property in Italy, how foreigners can buy and run one, and an 8-room agriturismo for sale near Rome.",
    "buy agriturismo Italy, agriturismo for sale Italy, Italian farm stay for sale, buy a farm in Italy, country estate Italy for sale",
    "Why buy an agriturismo in Italy", "A home, a business and a piece of Italian countryside in one: what international buyers should know.",
    "agriturismo-riano-porticato",
    f"""
An **agriturismo** is a working Italian farm that also welcomes guests: rooms, meals made with its own produce, and life in the countryside. For many international buyers, it is the ideal way to own a property in Italy.

## Why an agriturismo
- **A home and a business**: you live on the land and it can support itself.
- **Authentic**: guests come for real food, real landscape and real farming.
- **Favourable rules**: Italian law supports agritourism with simplified tax treatment.
- **Lasting value**: land and farm buildings close to major cities are increasingly rare.

## Who can run one
An agriturismo must be run by an agricultural business, and farming must remain the main activity. Foreign owners usually run it through an Italian farm company, often with a local manager or partner. Buying a property that comes with its farm company and licences saves a great deal of time.

## How buying works
1. Get an Italian tax code (codice fiscale).
2. Make a written offer.
3. Sign a preliminary contract (compromesso) with a deposit.
4. Complete the deed (rogito) before a notary.

When farmland is involved, neighbouring farmers may have a right of first refusal, which the notary handles.

## Why near Rome
Rome brings millions of visitors every year. An agriturismo 25 km from the city and about 50 km from Fiumicino airport can welcome guests who want countryside and Rome in the same trip.

!img:agriturismo-riano-sala-ristorante-camino|Dining room with fireplace in an agriturismo near Rome|The dining room at Colle delle Rose.

[Colle delle Rose](/en/) in Riano is for sale with its farm company and licences for agritourism, food service and butchery: 21 hectares, 8 guest rooms, a 70-cover dining room, four apartments, a stable and a tuff-stone barn, at **€869,000**.
"""))

# =========================== GENERAZIONE ===========================
KEYS = {}
for key, cat, slug, *_ in A:
    KEYS[key] = "/guida/" + slug

# registra in P per le card collegate
for key, cat, slug, title, desc, kw, h1, lead, hero, card, body, related in A:
    P[key] = ("/guida/" + slug, hero, dict(CATS)[cat], h1, card)

CAT_LABEL = dict(CATS)
for key, cat, slug, title, desc, kw, h1, lead, hero, card, body, related in A:
    path = "/guida/" + slug
    others = [k for k, *_ in A if k != key and dict((a[0], a[1]) for a in A)[k] == cat][:3]
    write(path, page(
        lang="it", path=path, date=DATE, title=title, desc=desc, keywords=kw,
        h1=h1, eyebrow=CAT_LABEL[cat], lead=lead, hero=hero, hero_alt=h1,
        body=md(body), crumbs=[CR_HOME, CR_G, (h1, None)],
        related=rel(*related),
        aside_links=links(*(others + ["agri", "terr"]))[:5],
        schema=[article(path, h1, desc, hero)]))

for path, title, desc, kw, h1, lead, hero, body in EN_ARTS:
    write(path, page(
        lang="en", path=path, date="29 October 2026", title=title, desc=desc, keywords=kw,
        h1=h1, eyebrow="Buyer's guide", lead=lead, hero=hero, hero_alt=h1,
        body=md(body), crumbs=[("Home", "/en/"), (h1, None)],
        related=[("/en/", "tenuta-riano-viale-ulivi-drone", "Estate", "Colle delle Rose Estate", "Photos, video, maps and key facts."),
                 ("/en/agriturismo-for-sale-near-rome", "agriturismo-riano-sala-ristorante-camino", "Agriturismo", "Agriturismo for sale near Rome", "8 rooms, a 70-cover dining room and active licences."),
                 ("/en/guide/moving-to-italy-countryside-near-rome", "tenuta-riano-vista-aerea-colline", "Relocating", "Moving to Italy", "A life in nature, 30 minutes from Rome.")],
        aside_links=[("Main listing", "/en/"), ("Agriturismo for sale near Rome", "/en/agriturismo-for-sale-near-rome"), ("Moving to Italy", "/en/guide/moving-to-italy-countryside-near-rome"), ("Contact", "/en/#contact")],
        schema=[{"@type": "Article", "headline": h1, "inLanguage": "en-GB", "datePublished": DATE_ISO,
                 "dateModified": DATE_ISO, "mainEntityOfPage": SITE + path, "image": SITE + "/img/" + hero + ".webp",
                 "author": {"@type": "Organization", "name": "Colle delle Rose Estate"}}]))

# ---------------- Indice della guida per categorie ----------------
path = "/guida/"
def _card(k):
    h, im, ey, ti, tx = P[k]
    return ('<a class="card" href="%s">%s<div><span class="eyebrow">%s</span><h3>%s</h3><p>%s</p></div></a>'
            % (h, img(im, ti, sizes="(max-width: 860px) 100vw, 380px"), ey, ti, tx))
sections = []
for cid, label in CATS:
    keys = [k for k, c in CAT_OF.items() if c == cid] + [a[0] for a in A if a[1] == cid]
    sections.append('<section class="guide-cat"><h2>%s</h2><div class="guide-list">\n%s\n</div></section>'
                    % (label, "\n".join(_card(k) for k in keys)))
en_cards = "\n".join(
    '<a class="card" href="%s">%s<div><span class="eyebrow">Guide</span><h3>%s</h3><p>%s</p></div></a>' % (h, img(im, t, sizes="380px"), t, d)
    for h, im, t, d in [("/en/guide/moving-to-italy-countryside-near-rome", "tenuta-riano-vista-aerea-colline", "Moving to Italy: countryside living near Rome", "A life in nature, 30 minutes from Rome."),
                        ("/en/guide/why-buy-an-agriturismo-in-italy", "agriturismo-riano-porticato", "Why buy an agriturismo in Italy", "What international buyers should know.")])
sections.append('<section class="guide-cat"><h2>In English</h2><div class="guide-list">\n%s\n</div></section>' % en_cards)
total = len(CAT_OF) + len(A) + 2
body = ('<p class="lead" style="max-width:62ch">Ognuno arriva in campagna con un sogno diverso. In queste %d guide trovi idee e informazioni pratiche per trasformarlo in un progetto concreto, a mezz\'ora da Roma.</p>\n' % total
        + "\n".join(sections))
html_index = page(
    lang="it", path=path,
    title="Vivere in campagna vicino Roma: guide a cambiare vita, animali, agriturismo e incentivi",
    desc="Guide per chi vuole cambiare vita e vivere in campagna vicino Roma: casali, famiglia, animali, olio, agriturismo, matrimoni, cavalli, incentivi, terreni e territorio.",
    h1="Vivere in campagna vicino Roma", eyebrow="La guida",
    lead="Cambiare vita, crescere i figli tra gli ulivi, vivere con gli animali, aprire un agriturismo, investire nella terra.",
    hero="tenuta-riano-vista-aerea-nord", hero_alt="Prati e colline della campagna a nord di Roma",
    body=body, crumbs=[CR_HOME, ("Guida", None)],
    aside_links=links("agri", "matr", "equi", "terr"),
    schema=[{"@type": "CollectionPage", "@id": SITE + path, "url": SITE + path, "name": "Vivere in campagna vicino Roma", "inLanguage": "it-IT"}])
# indice a tutta larghezza: niente colonna laterale
html_index = html_index.replace('<div class="wrap article">', '<div class="wrap">', 1)
html_index = _re.sub(r'\s*<aside class="aside">.*?</aside>', '', html_index, count=1, flags=_re.S)
html_index = html_index.replace('<article class="body">', '<div>', 1).replace('</article>', '</div>', 1)
write(path, html_index)
print("articoli totali:", total)
