"""Report cliente nel layout "grano": copertina centrata, sezioni numerate, tabelle con intestazione colorata.

Qui si preparano numeri e testi; l'impaginazione è in templates/report_grano.html.
I testi sono automatici e vengono sostituiti da quelli scritti da Claude, se disponibili.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from markupsafe import Markup

from .analisi import Analisi
from .config import Agenzia, Gruppo
from .modello import Metriche
from .periodi import MESI, Intervallo
from .report_locali import (
    GIORNI_LUNGHI, LINGUE_NOTE, _it, _mese, _stato, a_mese, azioni, elenco, eur, md, nota_campagne, num, pct,
    righe_campagne_locale, var,
)

GIORNI_TABELLA = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
CANALI_GRANO = {"Rete di Ricerca": "Ricerca Google", "Google Maps": "Google Maps",
                "YouTube, Discover e altro": "Altri (Discover, Display, YouTube)"}


@dataclass
class Cella:
    testo: str
    classe: str = ""  # forte | verde | rosso | ocra | tenue


@dataclass
class Tabella:
    colonne: list[str]
    righe: list[list[Cella]]
    evidenzia: list[str] = field(default_factory=list)  # per riga: "" | verde | ocra | rosa


@dataclass
class Sezione:
    titolo: str
    blocchi: list = field(default_factory=list)  # (tipo, contenuto)
    insieme: bool = False  # sezione breve da tenere su una sola pagina
    # Testi automatici che Claude può riscrivere: indice del blocco -> testo (o voci) in markdown.
    testi: dict = field(default_factory=dict)

    def p(self, testo, fisso=False):
        if not fisso:
            self.testi[len(self.blocchi)] = testo
        self.blocchi.append(("p", md(testo) if isinstance(testo, str) else testo))

    def h3(self, testo):
        self.blocchi.append(("h3", testo))

    def tabella(self, t: Tabella):
        self.blocchi.append(("tabella", t))

    def elenco(self, voci, fisso=False):
        if not fisso:
            self.testi[len(self.blocchi)] = list(voci)
        self.blocchi.append(("elenco", [md(v) for v in voci]))

    def nota(self, titolo, testo):
        self.blocchi.append(("nota", (titolo, md(testo))))

    def riquadri(self, voci, stile="verde"):
        self.blocchi.append(("riquadri", (voci, stile)))


@dataclass
class VistaGrano:
    gruppo: Gruppo
    agenzia: Agenzia
    colore: str
    colore_titoletti: str
    intestazione: str
    occhiello: str
    nome: str
    indirizzo: str
    periodo: str
    confronto: str
    focus: str
    sezioni: list[Sezione]
    testi_ai: bool = False
    generato: datetime = field(default_factory=datetime.now)

    @property
    def intestazione_css(self) -> Markup:
        return Markup(self.intestazione.replace("\\", "").replace('"', "'"))

    @property
    def colore_riquadro(self) -> str:
        """Fondo del secondo riquadro: rosato per i colori caldi, verde-grigio per gli altri."""
        try:
            r, g = int(self.colore[1:3], 16), int(self.colore[3:5], 16)
        except ValueError:
            return "#eef0ee"
        return "#f6e3e3" if r > g else "#e3ece8"


def _periodo_esteso(i: Intervallo) -> str:
    if i.inizio.month == i.fine.month:
        return f"Dal {i.inizio.day} al {i.fine.day} {MESI[i.fine.month - 1]} {i.fine.year}"
    return f"Dal {i.inizio.day} {MESI[i.inizio.month - 1]} al {i.fine.day} {MESI[i.fine.month - 1]} {i.fine.year}"


def _delta_txt(cur: float | None, prev: float | None, pt: bool = False) -> tuple[str, str]:
    """Variazione sul totale del mese, come nei report Grano, con la classe di colore."""
    if cur is None or not prev:
        return "–", ""
    if pt:
        d = (cur - prev) * 100
        return f"{'+' if d >= 0 else '−'}{_it(abs(d), 1)} punti", "verde" if d > 0.05 else ("rosso" if d < -0.05 else "")
    d = cur / prev - 1
    return var(d), ""


def _fatti(a: Analisi) -> dict:
    """I numeri del locale in forma semplice, per i testi automatici e per Claude."""
    d, per = a.dati, a.periodi
    serie = []
    for intervallo, dp in ((per.due_mesi_prima, d.due_mesi_prima), (per.precedente, d.precedente), (per.corrente, d.corrente)):
        if not intervallo or not dp or dp.totale.costo <= 0:
            continue
        m = dp.totale
        az = azioni(m)
        serie.append({
            "mese": _mese(intervallo), "giorni": intervallo.giorni,
            "conversioni": az, "indicazioni": m.indicazioni, "contatti": m.contatti, "ordini": m.ordini,
            "visite": m.conversioni, "spesa": m.costo, "impressioni": m.impressioni, "clic": m.clic,
            "ctr": m.ctr, "costo_conversione": m.costo / az if az else None,
            "costo_visita": m.costo / m.conversioni if m.conversioni else None,
        })
    return {"serie": serie}


def vista_grano(gruppo: Gruppo, a: Analisi, agenzia: Agenzia) -> VistaGrano:
    c, d, per = a.cliente, a.dati, a.periodi
    m, p = d.corrente.totale, d.precedente.totale
    mese, mese_prec = _mese(per.corrente), _mese(per.precedente)
    anno = per.corrente.inizio.year
    numero = gruppo.numero_report(anno, per.corrente.inizio.month)
    det = d.dettaglio
    stimate = d.visite_stimate
    apprendimento, budget_limitato, budget_g = _stato(a)
    serie = _fatti(a)["serie"]
    cur = serie[-1]
    prev = serie[-2] if len(serie) > 1 else None
    az, az_p = cur["conversioni"], (prev or {}).get("conversioni")

    intestazione = (f"{gruppo.nome}, Report Google Ads" + (f" N.{numero}" if numero else f", {mese.capitalize()} {anno}"))
    occhiello = f"REPORT GOOGLE ADS · N.{numero}" if numero else "REPORT MENSILE GOOGLE ADS"
    mesi_confronto = [s["mese"] for s in serie[:-1]][::-1]
    confronto = ("Confronto con " + " e ".join(mesi_confronto) + f" {anno}") if mesi_confronto else ""
    sezioni: list[Sezione] = []

    def nuova(titolo: str) -> Sezione:
        s = Sezione(f"{len(sezioni) + 1}. {titolo}")
        sezioni.append(s)
        return s

    # --- 1. Il mese in sintesi
    s1 = nuova("Il mese in sintesi")
    d_az = (az / az_p - 1) if az_p else None
    d_ind = (m.indicazioni / p.indicazioni - 1) if p.indicazioni else None
    d_vis = (m.conversioni / p.conversioni - 1) if p.conversioni else None
    d_cont = (m.contatti / p.contatti - 1) if p.contatti else None
    d_spesa = (m.costo / p.costo - 1) if p.costo else None
    cpc_storico = [s["costo_conversione"] for s in serie if s["costo_conversione"]]
    minimo = cur["costo_conversione"] and cur["costo_conversione"] <= min(cpc_storico) + 1e-9 and len(cpc_storico) > 1
    massimo_conv = len(serie) > 1 and az >= max(s["conversioni"] for s in serie)
    sintesi = (f"{mese.capitalize()} chiude con **{num(az)} conversioni** a **{eur(cur['costo_conversione'])}** "
               f"l'una e **{num(m.indicazioni)} richieste di indicazioni stradali**"
               + (f", con una spesa {_verso_breve(d_spesa)} rispetto {a_mese(mese_prec)}" if d_spesa is not None else "")
               + ".")
    if apprendimento:
        sintesi += " La campagna è ancora in fase di apprendimento."
    s1.p(sintesi)
    s1.riquadri([
        (eur(cur["costo_conversione"]), "costo per conversione" + (", il più basso degli ultimi mesi" if minimo else "")),
        (num(az), "conversioni" + (f", record ({var(d_az)} su {mese_prec})" if massimo_conv and d_az is not None
                                   else (f" ({var(d_az)} su {mese_prec})" if d_az is not None else ""))),
        (num(m.indicazioni), "indicazioni stradali" + (f" ({var(d_ind)} su {mese_prec})" if d_ind is not None else "")),
    ], "verde")
    ctr_prev = prev["ctr"] if prev else None
    s1.riquadri([
        (num(m.conversioni), ("Visite stimate" if stimate else "Visite in negozio") + (f" ({var(d_vis)})" if d_vis is not None else "")),
        (pct(m.ctr, 2), "CTR" + (f" (era {pct(ctr_prev, 2)})" if ctr_prev else "")),
        (num(m.contatti), "Contatti diretti" + (f" ({var(d_cont)})" if d_cont is not None else "")),
        (eur(m.costo, 0), "Spesa Google Ads"),
    ], "secondario")
    if d_az is not None:
        s1.p(f"**In una riga:** con una spesa {_verso_breve(d_spesa)} la campagna porta "
             f"{_verso_parole(d_az, 'più', 'meno')} conversioni, {_verso_parole(d_ind, 'più', 'meno')} indicazioni stradali "
             f"e {_verso_parole(d_vis, 'più', 'meno')} visite rispetto {a_mese(mese_prec)}.")
    s1.h3("Nota sui dati")
    s1.p(f"Come ogni mese, le visite in negozio dell'ultimo mese sono ancora in fase di validazione da parte di Google "
         f"e tendono a salire nelle settimane successive. Il dato di {mese} ({num(m.conversioni)}) va letto come un "
         "valore minimo. Le indicazioni stradali, che non sono modellate, restano il riferimento più solido per il confronto."
         if not stimate else
         f"Le visite in negozio sono stimate al {_it(c.quota_visite_indicazioni * 100, 0)}% delle indicazioni stradali, "
         "perché su questo account Google non le misura ancora.", fisso=True)

    # --- 2. Mesi a confronto
    titolo_mesi = {1: "Il mese", 2: "Due mesi a confronto", 3: "Tre mesi a confronto"}[len(serie)]
    s2 = nuova(titolo_mesi)
    colonne = ["Metrica"] + [s["mese"].capitalize() for s in serie] + ([f"Δ su {mese_prec}"] if prev else [])
    righe, evid = [], []

    def riga(nome, chiave, fmt, buono, verde_riga=True, pt=False):
        valori = [Cella(nome, "forte" if verde_riga else "")]
        for i, s in enumerate(serie):
            v = s[chiave]
            valori.append(Cella(fmt(v), "forte" if i == len(serie) - 1 and verde_riga else ""))
        if prev:
            txt, cls = _delta_txt(cur[chiave], prev[chiave], pt)
            if not pt and cur[chiave] is not None and prev[chiave]:
                dlt = cur[chiave] / prev[chiave] - 1
                if abs(dlt) >= 0.005 and buono:
                    cls = "verde" if (dlt > 0) == (buono == "su") else "rosso"
            valori.append(Cella(txt, cls + (" forte" if cls else "")))
        righe.append(valori)
        evid.append("verde" if verde_riga else "")

    riga("Conversioni", "conversioni", lambda x: num(x), "su")
    riga("Indicazioni stradali", "indicazioni", lambda x: num(x), "su")
    riga("Visite stimate" if stimate else "Visite in negozio", "visite", lambda x: num(x), "su")
    riga("Costo per conversione", "costo_conversione", lambda x: eur(x), "giu")
    riga("Costo per visita", "costo_visita", lambda x: eur(x), "giu")
    riga("CTR", "ctr", lambda x: pct(x, 2), "su", pt=True)
    riga("Contatti diretti", "contatti", lambda x: num(x), "su")
    riga("Spesa", "spesa", lambda x: eur(x, 0), None, verde_riga=False)
    riga("Impressioni", "impressioni", lambda x: num(x), None, verde_riga=False)
    s2.tabella(Tabella(colonne, righe, evid))
    if a.attribuzione and per.mese_chiuso:
        prima, oggi = a.attribuzione
        s2.nota(f"Le visite di {mese_prec} a 30 giorni",
                f"Nel report del mese scorso le visite di {mese_prec} erano **{num(prima)}**; oggi, a dato consolidato, "
                f"sono **{num(oggi)}** ({var(oggi / prima - 1 if prima else None)}). Google attribuisce le visite "
                f"fino a 30 giorni dopo il clic: anche il dato di {mese} crescerà nelle prossime settimane.")
    if prev:
        d_impr = (m.impressioni / p.impressioni - 1) if p.impressioni else None
        s2.p(f"**La lettura.** Rispetto {a_mese(mese_prec)} le conversioni sono {_verso(d_az)}, le indicazioni "
             f"{_verso(d_ind)} e le visite {_verso(d_vis)}, con impressioni {_verso(d_impr)}"
             + (" e un costo per conversione in calo." if cur["costo_conversione"] and prev["costo_conversione"]
                and cur["costo_conversione"] < prev["costo_conversione"] else "."))

    # --- Campagne (se oltre alla Performance Max ce n'è un'altra, es. Search brand)
    righe_c = righe_campagne_locale(d.corrente, gruppo)
    if righe_c:
        sc = nuova("Le campagne")
        sc.p(nota_campagne(d.corrente, gruppo, stimate), fisso=True)
        sc.tabella(Tabella(["Campagna", "Spesa", "Azioni", "Costo per azione", "Visite", "Costo per visita"],
                           [[Cella(r.etichetta, "forte")] + [Cella(v, "forte" if r.forte else "") for v in r.valori]
                            for r in righe_c], ["verde" if r.forte else "" for r in righe_c]))

    # --- 3. Canali
    if det and det.canali:
        s3 = nuova("I canali")
        ricerca = next((x.metriche for x in det.canali if x.nome == "Rete di Ricerca"), None)
        ricerca_p = next((x.metriche for x in det.canali_precedente if x.nome == "Rete di Ricerca"), None)
        if ricerca and ricerca_p and ricerca_p.costo > 0:
            s3.h3(f"Ricerca Google, {mese_prec} e {mese}")
            righe, evid = [], []
            for nome, attr, fmt in (("Impressioni", "impressioni", num), ("Clic", "clic", num),
                                    ("Indicazioni stradali", "indicazioni", num),
                                    ("Visite in negozio", "visite_reali", num), ("Spesa", "costo", lambda x: eur(x, 0))):
                v0, v1 = getattr(ricerca_p, attr), getattr(ricerca, attr)
                dlt = (v1 / v0 - 1) if v0 else None
                cls = "" if attr == "costo" or dlt is None else ("verde forte" if dlt > 0.005 else "rosso forte")
                righe.append([Cella(nome, "forte" if attr != "costo" else ""), Cella(fmt(v0)), Cella(fmt(v1), "forte"),
                              Cella(var(dlt), cls)])
                evid.append("verde" if attr != "costo" else "")
            s3.tabella(Tabella(["Ricerca Google", mese_prec.capitalize(), mese.capitalize(), "Variazione"], righe, evid))
        tot_spesa = sum(x.metriche.costo for x in det.canali) or 1
        tot_ind = sum(x.metriche.indicazioni for x in det.canali) or 1
        righe = []
        for ch in det.canali:
            cm = ch.metriche
            altro = ch.nome == "YouTube, Discover e altro"
            righe.append([Cella(CANALI_GRANO.get(ch.nome, ch.nome), "tenue" if altro else "forte"),
                          Cella(f"{eur(cm.costo, 0)} ({_it(cm.costo / tot_spesa * 100, 0)}%)", "tenue" if altro else ""),
                          Cella(num(cm.indicazioni), "tenue" if altro else ""),
                          Cella(num(cm.visite_reali) if not stimate else num(cm.indicazioni * c.quota_visite_indicazioni),
                                "tenue" if altro else "")])
        s3.tabella(Tabella(["Canale", "Spesa", "Indicazioni", "Visite in negozio"], righe))
        principali = sorted((x for x in det.canali if x.nome != "YouTube, Discover e altro"),
                            key=lambda x: -x.metriche.indicazioni)
        if principali:
            top = principali[0]
            testo = (f"Oggi {CANALI_GRANO[top.nome]} porta il {_it(top.metriche.indicazioni / tot_ind * 100, 0)}% "
                     "delle indicazioni stradali della campagna.")
            cpv = [(x, x.metriche.costo / x.metriche.visite_reali) for x in principali if x.metriche.visite_reali]
            if cpv and not stimate:
                migliore = min(cpv, key=lambda t: t[1])
                testo += (f" {CANALI_GRANO[migliore[0].nome]} è il canale con il costo per visita più basso "
                          f"({eur(migliore[1])}, {num(migliore[0].metriche.visite_reali)} visite).")
            s3.p(testo)

    # --- 4. Lingue
    gruppi_asset = det.gruppi_asset if det else []
    if gruppi_asset:
        sono_lingue = sum(any(l in g.nome.lower() for l in LINGUE_NOTE) for g in gruppi_asset) >= len(gruppi_asset) / 2
        s4 = nuova(f"Le lingue {a_mese(mese)}" if sono_lingue else f"I gruppi di asset {a_mese(mese)}")
        righe, evid = [], []
        for g in gruppi_asset:
            gm = g.metriche
            dlt = (gm.conversioni / g.conversioni_prec - 1) if g.conversioni_prec else None
            cls = "" if dlt is None else ("verde forte" if dlt > 0.005 else "ocra forte")
            righe.append([Cella(g.nome, "forte"), Cella(num(g.conversioni_prec) if g.conversioni_prec is not None else "–", "tenue"),
                          Cella(num(gm.conversioni), "forte"), Cella(var(dlt), cls), Cella(pct(gm.ctr, 2)),
                          Cella(pct(gm.conversioni / gm.clic if gm.clic else None)),
                          Cella(eur(gm.costo / gm.conversioni if gm.conversioni else None))])
            evid.append("verde" if dlt is not None and dlt > 0.1 else ("ocra" if dlt is not None and dlt < 0 else ""))
        s4.tabella(Tabella([("Lingua" if sono_lingue else "Gruppo"), f"Conv. {mese_prec}", f"Conv. {mese}",
                            "Variazione", f"CTR {mese[:4]}.", "Tasso conv.", "CPA"], righe, evid))
        voci = []
        tot = sum(g.metriche.conversioni for g in gruppi_asset) or 1
        primo = gruppi_asset[0]
        voci.append(f"{primo.nome} resta il motore con il {_it(primo.metriche.conversioni / tot * 100, 0)}% delle conversioni.")
        crescite = [(g, g.metriche.conversioni / g.conversioni_prec - 1) for g in gruppi_asset if g.conversioni_prec]
        if crescite:
            su = [g.nome for g, x in sorted(crescite, key=lambda t: -t[1]) if x > 0.1][:2]
            giu = [g.nome for g, x in crescite if x < 0]
            if su:
                voci.append(f"{elenco(su)} {'sono le crescite' if len(su) > 1 else 'è la crescita'} del mese.")
            if giu:
                voci.append(f"{elenco(giu)} {'sono in calo' if len(giu) > 1 else 'è in calo'}: "
                            f"{'sono i gruppi' if len(giu) > 1 else 'è il gruppo'} su cui intervenire con nuovi temi di ricerca.")
        con_tasso = [g for g in gruppi_asset if g.metriche.clic >= 100]
        if con_tasso:
            best = max(con_tasso, key=lambda g: g.metriche.conversioni / g.metriche.clic)
            voci.append(f"{best.nome} ha il tasso di conversione più alto "
                        f"({pct(best.metriche.conversioni / best.metriche.clic)}).")
        s4.elenco(voci)

    # --- sezioni libere dalle note del mese (temi di ricerca, pubblico, concorrenza...)
    for libera in gruppo.sezioni:
        sl = nuova(libera["titolo"])
        for paragrafo in [x.strip() for x in libera["testo"].split("\n") if x.strip()]:
            sl.p(paragrafo, fisso=True)

    # --- Giorni e orari
    if det and any(det.conversioni_giorno_totale):
        s5 = nuova("Giorni e orari")
        conv_g, spesa_g = det.conversioni_giorno_totale, det.spesa_per_giorno
        cpa_g = [sp / cv if cv else None for sp, cv in zip(spesa_g, conv_g)]
        i_max = max(range(7), key=lambda i: conv_g[i])
        validi = [i for i in range(7) if cpa_g[i] is not None]
        i_eff = min(validi, key=lambda i: cpa_g[i]) if validi else None
        righe, evid = [], []
        for i in range(7):
            righe.append([Cella(GIORNI_TABELLA[i], "forte" if i in (i_max, i_eff) else ""),
                          Cella(num(conv_g[i]), "rosso forte" if i == i_max else ""),
                          Cella(eur(spesa_g[i], 0)), Cella(eur(cpa_g[i]), "forte" if i == i_eff else "")])
            evid.append("verde" if i in (i_max, i_eff) else "")
        s5.tabella(Tabella(["Giorno", "Conversioni", "Spesa", "CPA"], righe, evid))
        testo = f"Il {GIORNI_LUNGHI[i_max]} è il giorno con più conversioni ({num(conv_g[i_max])})"
        if i_eff is not None and i_eff != i_max:
            testo += f", {('la ' if i_eff == 6 else 'il ')}{GIORNI_LUNGHI[i_eff]} il più efficiente ({eur(cpa_g[i_eff])} per conversione)"
        s5.p(testo + ".")
        fasce = c.fasce_tabella or []
        tot_sp = sum(sum(det.spesa_per_ora[h] for h in range(da, a_ + 1)) for _, da, a_ in fasce) or 1
        tot_cv = sum(sum(det.conversioni_per_ora[h] for h in range(da, a_ + 1)) for _, da, a_ in fasce) or 1
        righe, evid = [], []
        quote = []
        for nome_f, da, a_ in fasce:
            sp = sum(det.spesa_per_ora[h] for h in range(da, a_ + 1)) / tot_sp
            cv = sum(det.conversioni_per_ora[h] for h in range(da, a_ + 1)) / tot_cv
            quote.append((nome_f, sp, cv))
        i_top = max(range(len(quote)), key=lambda i: quote[i][2]) if quote else None
        for i, (nome_f, sp, cv) in enumerate(quote):
            righe.append([Cella(nome_f, "forte" if i == i_top else ""), Cella(pct(sp), "forte" if i == i_top else ""),
                          Cella(pct(cv), "forte" if i == i_top else "")])
            evid.append("verde" if i == i_top else "")
        if quote:
            s5.tabella(Tabella(["Fascia", "Quota di spesa", "Quota conversioni"], righe, evid))
            ore = sorted(sorted(range(24), key=lambda h: -det.conversioni_per_ora[h])[:2])
            quota_ore = sum(det.conversioni_per_ora[h] for h in ore) / (sum(det.conversioni_per_ora) or 1)
            s5.p(f"Le {ore[0]} e le {ore[1]} sono le ore regine: insieme valgono "
                 f"{num(sum(det.conversioni_per_ora[h] for h in ore))} conversioni, il {_it(quota_ore * 100, 0)}% del mese.")

    # --- Ritorno economico / compenso (solo report di chiusura mese)
    if per.mese_chiuso and gruppo.compenso and c.coperti_per_visita and c.scontrino_medio:
        _sezione_compenso(nuova, gruppo, a, mese, mese_prec)

    # --- In sintesi e prossimi passi
    sf = nuova("In sintesi e prossimi passi")
    sf.h3(mese.capitalize())
    punti = []
    if d_az is not None:
        punti.append(f"{num(az)} conversioni ({var(d_az)} su {mese_prec}) e {num(m.indicazioni)} indicazioni stradali, "
                     f"a {eur(cur['costo_conversione'])} per conversione.")
    if d_vis is not None:
        punti.append(f"Visite in negozio {_verso(d_vis)} ({num(m.conversioni)}){', con dato ancora da consolidare' if not stimate else ''}.")
    if gruppi_asset and len(gruppi_asset) > 1:
        punti.append(f"{gruppi_asset[0].nome} guida per lingua.")
    if gruppo.fatto:
        punti.append(gruppo.fatto)
    sf.elenco(punti)
    mese_succ = MESI[per.corrente.fine.month % 12]
    sf.h3(mese_succ.capitalize())
    prossimi = list(gruppo.prossimi_passi)
    if apprendimento:
        prossimi.append("Completare la fase di apprendimento senza interventi strutturali.")
    if budget_limitato:
        prossimi.append(f"Valutare un aumento del budget: la campagna è limitata dal budget ({eur(budget_g, 0)} al giorno).")
    if gruppi_asset and crescite:
        giu = [g.nome for g, x in crescite if x < 0]
        if giu:
            prossimi.append(f"Rivedere i temi di ricerca di {elenco(giu)}.")
    if not stimate:
        prossimi.append(f"Rivedere le visite di {mese} a dato consolidato.")
    sf.elenco(prossimi)

    colore = gruppo.colore or "#8b0000"
    return VistaGrano(
        gruppo=gruppo, agenzia=agenzia, colore=colore, colore_titoletti=gruppo.colore_titoletti or colore,
        intestazione=intestazione, occhiello=occhiello, nome=gruppo.nome, indirizzo=c.descrizione,
        periodo=_periodo_esteso(per.corrente), confronto=confronto, focus=gruppo.focus, sezioni=sezioni,
    )


def _sezione_compenso(nuova, gruppo: Gruppo, a: Analisi, mese: str, mese_prec: str) -> None:
    c, comp = a.cliente, gruppo.compenso
    m, p = a.dati.corrente.totale, a.dati.precedente.totale
    if comp.tipo == "fisso":
        s = nuova("Il ritorno economico del mese")
        s.insieme = True
        margine = comp.margine or 0.0
        s.p(f"Parametri reali del ristorante: {_it(c.coperti_per_visita, 1)} coperti per visita, "
            f"{_it(c.scontrino_medio, 0)} euro di spesa media a persona"
            + (f", margine del {_it(margine * 100, 0)}%" if margine else "")
            + ". Le visite sono ancora provvisorie, quindi il calcolo è prudente.", fisso=True)

        def calcolo(visite, spesa):
            coperti = visite * c.coperti_per_visita
            fatt = coperti * c.scontrino_medio
            marg = fatt * margine
            costo_tot = spesa + comp.importo
            return coperti, fatt, marg, marg - costo_tot, costo_tot

        coperti, fatt, marg, profitto, costo_tot = calcolo(m.conversioni, m.costo)
        _, fatt_p, _, profitto_p, costo_p = calcolo(p.conversioni, p.costo)
        righe = [
            [Cella("Visite in negozio (provvisorie)"), Cella("stimate" if a.dati.visite_stimate else "tracciate", "tenue"), Cella(num(m.conversioni), "forte")],
            [Cella("Coperti stimati"), Cella(f"{num(m.conversioni)} × {_it(c.coperti_per_visita, 1)}", "tenue"), Cella(num(coperti), "forte")],
            [Cella("Fatturato attribuibile", "forte"), Cella(f"{num(coperti)} × {eur(c.scontrino_medio, 0)}", "tenue"), Cella(eur(fatt, 0), "rosso forte")],
        ]
        evid = ["", "", "verde"]
        if margine:
            righe += [
                [Cella(f"Margine generato ({_it(margine * 100, 0)}%)"), Cella(f"{eur(fatt, 0)} × {_it(margine, 2)}", "tenue"), Cella(eur(marg, 0), "forte")],
                [Cella("Spesa Google Ads"), Cella("speso", "tenue"), Cella("− " + eur(m.costo, 0), "forte")],
                [Cella("Compenso gestione"), Cella("fisso", "tenue"), Cella("− " + eur(comp.importo, 0), "forte")],
                [Cella("PROFITTO NETTO ATTRIBUITO", "forte"), Cella(f"{eur(marg, 0)} − {eur(costo_tot, 0)}", "tenue"), Cella(eur(profitto, 0), "rosso forte")],
            ]
            evid += ["", "", "", "rosa"]
        s.tabella(Tabella(["Voce", "Operazione", "Valore"], righe, evid))
        if margine and costo_tot:
            roi, roas = profitto / costo_tot, fatt / costo_tot
            roi_p = profitto_p / costo_p if costo_p else None
            roas_p = fatt_p / costo_p if costo_p else None
            s.riquadri([
                (pct(roi, 0), "ROI sul margine",
                 (f"{mese_prec} {pct(roi_p, 0)}  ·  " if roi_p is not None else "") + f"ogni € investito, € {_it(roi, 0)} di profitto"),
                (f"{_it(roas, 1)} ×", "ROAS",
                 (f"{mese_prec} {_it(roas_p, 1)} ×  ·  " if roas_p is not None else "") + f"ogni € investito, € {_it(roas, 0)} di fatturato"),
            ], "roi")
    else:
        s = nuova("Fatturato attribuibile e compenso")
        s.insieme = True
        visite = m.conversioni if comp.base == "mese" else p.conversioni
        mese_base = mese if comp.base == "mese" else mese_prec
        s.p(f"Come da accordo, il compenso è il {_it(comp.percentuale * 100, 0)}% del fatturato attribuibile alla campagna, "
            f"calcolato sulle visite in negozio, con {_it(c.coperti_per_visita, 1)} coperti per visita e "
            f"{eur(c.scontrino_medio, 0)} a persona.", fisso=True)
        coperti = visite * c.coperti_per_visita
        fatt = coperti * c.scontrino_medio
        fee = fatt * comp.percentuale
        righe = [
            [Cella(f"Visite in negozio {mese_base}" + (" (registrate a oggi)" if comp.base == "mese" else " (consolidate)")),
             Cella("dato " + ("stimato" if a.dati.visite_stimate else "Google"), "tenue"), Cella(num(visite), "forte")],
            [Cella("Coperti"), Cella(f"{num(visite)} × {_it(c.coperti_per_visita, 1)}", "tenue"), Cella(num(coperti), "forte")],
            [Cella("Fatturato attribuibile", "forte"), Cella(f"{num(coperti)} × {eur(c.scontrino_medio, 0)}", "tenue"), Cella(eur(fatt, 0), "verde forte")],
            [Cella(f"COMPENSO ({_it(comp.percentuale * 100, 0)}%)", "forte"),
             Cella(f"{eur(fatt, 0)} × {_it(comp.percentuale * 100, 0)}%", "tenue"), Cella(eur(fee), "forte")],
        ]
        evid = ["", "", "verde", "grigio"]
        if comp.base == "mese" and a.attribuzione:
            prima, oggi = a.attribuzione
            delta = oggi - prima
            fee_cong = delta * c.coperti_per_visita * c.scontrino_medio * comp.percentuale
            righe.insert(-1, [Cella(f"Conguaglio {mese_prec}: visite consolidate"),
                              Cella(f"{num(oggi)} oggi − {num(prima)} già fatturate = {num(delta)}", "tenue"),
                              Cella(eur(fee_cong), "forte")])
            evid.insert(-1, "")
            righe[-1] = [Cella("COMPENSO DI QUESTA FATTURA", "forte"),
                         Cella(f"{eur(fee)} + {eur(fee_cong)}", "tenue"), Cella(eur(fee + fee_cong), "forte")]
        s.tabella(Tabella(["Voce", "Operazione", "Valore"], righe, evid))
        if comp.base == "mese":
            s.nota("Nota sulla fatturazione",
                   "Google continua a registrare le visite in negozio fino a circa 30 giorni dopo il contatto con "
                   f"l'annuncio. Sono incluse solo le visite già registrate a oggi; quelle di {mese} che verranno registrate "
                   f"nei prossimi 30 giorni saranno conteggiate a conguaglio. Le visite di {mese_prec} risultano oggi "
                   f"{num(a.attribuzione[1] if a.attribuzione else p.conversioni)} a dato consolidato.")


def _verso(d: float | None) -> str:
    if d is None:
        return "stabili"
    if abs(d) < 0.03:
        return "stabili"
    return f"in crescita ({var(d)})" if d > 0 else f"in calo ({var(d)})"


def _verso_breve(d: float | None) -> str:
    if d is None or abs(d) < 0.03:
        return "quasi invariata"
    return f"in aumento ({var(d)})" if d > 0 else f"in calo ({var(d)})"


def _verso_parole(d: float | None, piu: str, meno: str) -> str:
    if d is None or abs(d) < 0.03:
        return "le stesse"
    return piu if d > 0 else meno
