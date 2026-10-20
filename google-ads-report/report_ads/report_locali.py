"""Report cliente per ristoranti e locali (obiettivo "negozio").
Layout "advisory": una sezione per locale, la sintesi del gruppo e il compenso.

Qui si preparano numeri e testi; l'impaginazione è in templates/report_locali.html.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime

from markupsafe import Markup, escape

from .analisi import Analisi
from .config import Agenzia, Gruppo
from .modello import Campagna, DatiPeriodo, Metriche
from .periodi import MESI, Intervallo, Periodi

GIORNI_BREVI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
GIORNI_LUNGHI = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]
LINGUE_NOTE = {"italiano", "inglese", "spagnolo", "francese", "tedesco", "cinese", "giapponese",
               "portoghese", "russo", "coreano", "arabo", "olandese"}

# Come si raccontano al cliente le modifiche registrate nell'account.
MODIFICHE = {
    "ASSET_GROUP": "gruppi di asset e temi di ricerca",
    "ASSET_GROUP_SIGNAL": "segnali e temi di ricerca",
    "ASSET_GROUP_ASSET": "testi e immagini degli annunci",
    "ASSET": "testi e immagini degli annunci",
    "AD": "annunci",
    "AD_GROUP_AD": "annunci",
    "CAMPAIGN": "impostazioni della campagna",
    "CAMPAIGN_CRITERION": "esclusioni e targeting",
    "AD_GROUP_CRITERION": "keyword",
    "CAMPAIGN_BUDGET": "budget",
    "CUSTOMER_ASSET": "estensioni dell'account",
    "CAMPAIGN_ASSET": "estensioni della campagna",
}


# ---------------------------------------------------------------- formattazione

def _it(x: float, dec: int) -> str:
    return f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def eur(x: float | None, dec: int = 2) -> str:
    if x is None:
        return "–"
    return f"−€{_it(-x, dec)}" if x < 0 and round(x, dec) != 0 else f"€{_it(abs(x) if round(x, dec) == 0 else x, dec)}"


def num(x: float | None, dec: int = 0) -> str:
    return "–" if x is None else _it(x, dec)


def pct(x: float | None, dec: int = 1) -> str:
    return "–" if x is None else f"{_it(x * 100, dec)}%"


def var(x: float | None) -> str:
    if x is None:
        return "–"
    if abs(x) < 0.005:
        return "0%"
    return f"{'+' if x >= 0 else '−'}{_it(abs(x) * 100, 0)}%"


def _art_pct(x: float) -> str:
    """Articolo davanti a una percentuale: "l'1%", "l'8%", "l'11%", "il 10%"."""
    n = _it(x * 100, 0)
    return "l'" if n in ("1", "11", "18") or n.startswith("8") else "il "


def elenco(nomi: list[str]) -> str:
    return nomi[0] if len(nomi) == 1 else ", ".join(nomi[:-1]) + " e " + nomi[-1]


def a_mese(mese: str) -> str:
    """"a settembre", "ad agosto"."""
    return ("ad " if mese[:1] in "aeiou" else "a ") + mese


def il_giorno(i: int) -> str:
    return ("la " if i == 6 else "il ") + GIORNI_LUNGHI[i]


def md(testo: str) -> Markup:
    """Testo con **grassetto**, con escape del resto."""
    return Markup(re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", str(escape(testo))))


def _mese(i: Intervallo) -> str:
    return MESI[i.inizio.month - 1]


def _per_giorno(attuale: float, giorni: int, prec: float, giorni_prec: int) -> float | None:
    if not prec or not giorni_prec:
        return None
    return (attuale / giorni) / (prec / giorni_prec) - 1


def _verso(d: float | None, su: str, giu: str, fermo: str) -> str:
    if d is None or abs(d) < 0.03:
        return fermo
    return f"{su} del {_it(abs(d) * 100, 0)}%" if d > 0 else f"{giu} del {_it(abs(d) * 100, 0)}%"


def azioni(m: Metriche) -> float:
    """Azioni ad alto intento (indicazioni, contatti, ordini...): le Conversioni di Google
    senza le visite al negozio, che si contano a parte."""
    conv = m.conversioni_google if m.conversioni_google is not None else m.conversioni
    return conv - m.visite_in_conversioni


# ---------------------------------------------------------------- strutture per il template

@dataclass
class Riga:
    etichetta: str
    valori: list[str]
    variazione: str = ""
    colore: str = ""  # verde / blu (miglioramento di un costo) / rosso
    forte: bool = False


@dataclass
class Passo:
    titolo: str
    dettaglio: str


@dataclass
class VistaLocale:
    numero: int
    nome: str
    descrizione: str
    campagna: str
    stimate: bool
    intro: Markup
    tiles_principali: list[tuple[str, str, str]]  # valore, etichetta, nota
    tiles_secondari: list[tuple[str, str]]
    lettura_conversioni: Markup
    mesi: list[str]
    confronto: list[Riga]
    lettura_numeri: Markup
    canali: list[Riga]
    canali_colonne: list[str]
    sottotitolo_canali: str
    costo_visita: Markup | None
    titolo_lingue: str
    sottotitolo_lingue: str
    lingue: list[Riga]
    lettura_lingue: Markup | None
    ore: list[tuple[int, float, bool]]
    testo_ore: Markup
    legenda_ore: str
    giorni: list[Riga]
    sottotitolo_giorni: str
    budget: Markup
    richiamo_budget: Markup | None
    campagne: list[Riga]  # Performance Max, Search brand e totale, se le campagne sono più di una
    nota_campagne: str
    fatto: Markup | None
    passi: list[Passo]
    stati: list[str]
    # per la sintesi del gruppo
    spesa: float = 0.0
    n_azioni: float = 0.0
    visite: float = 0.0
    m: Metriche | None = None
    p: Metriche | None = None


@dataclass
class VistaGruppo:
    gruppo: Gruppo
    agenzia: Agenzia
    periodi: Periodi
    colore: str
    titolo: str
    sottotitolo: str
    meta: list[tuple[str, str]]
    nota_attribuzione: Markup | None
    locali: list[VistaLocale]
    piede: str
    insegne: list[Riga] = field(default_factory=list)
    intro_gruppo: Markup | None = None
    nota_insegne: str = ""
    confronto_gruppo: list[Riga] = field(default_factory=list)
    mesi_gruppo: list[str] = field(default_factory=list)
    compenso_titolo: str = ""
    compenso_sottotitolo: str = ""
    compenso_colonne: list[str] = field(default_factory=list)
    compenso: list[Riga] = field(default_factory=list)
    compenso_riquadri: list[tuple[str, str, str]] = field(default_factory=list)
    compenso_nota: Markup | None = None
    attribuzione_titolo: str = ""
    attribuzione_colonne: list[str] = field(default_factory=list)
    attribuzione: list[Riga] = field(default_factory=list)
    attribuzione_nota: Markup | None = None
    fatto: Markup | None = None
    priorita: list[Passo] = field(default_factory=list)
    generato: datetime = field(default_factory=datetime.now)

    @property
    def piede_css(self) -> Markup:
        """Piè di pagina dentro una stringa CSS: niente escape HTML, niente doppi apici."""
        testo = f"{self.agenzia.nome} Advisory  ·  Marketing · Data · Strategy        {self.piede}"
        return Markup(testo.replace("\\", "").replace('"', "'"))


# ---------------------------------------------------------------- campagne del locale

TIPI_CAMPAGNA = {"PERFORMANCE_MAX": "Performance Max", "SEARCH": "Rete di Ricerca", "DISPLAY": "Display",
                 "VIDEO": "Video", "LOCAL": "Locale", "SMART": "Smart"}


def nome_campagna(c: Campagna, gruppo: Gruppo | None = None) -> str:
    """Etichetta leggibile: le campagne Search sul nome del locale diventano "Search brand"."""
    escluse = {t.upper() for t in (gruppo.compenso.escludi if gruppo and gruppo.compenso else [])}
    if c.tipo == "SEARCH" and ("brand" in c.nome.lower() or "SEARCH" in escluse):
        return "Search brand"
    return TIPI_CAMPAGNA.get(c.tipo, c.tipo.title())


def escluse_dal_compenso(periodo: DatiPeriodo, gruppo: Gruppo) -> float:
    """Visite delle campagne che restano fuori dal fatturato attribuibile (es. Search brand)."""
    tipi = {t.upper() for t in (gruppo.compenso.escludi if gruppo.compenso else [])}
    return sum(c.metriche.conversioni for c in periodo.campagne.values() if c.tipo in tipi)


def righe_campagne_locale(periodo: DatiPeriodo, gruppo: Gruppo) -> list[Riga]:
    """Una riga per campagna e il totale, solo se le campagne con spesa sono più di una."""
    attive = sorted((c for c in periodo.campagne.values() if c.metriche.costo > 0), key=lambda c: -c.metriche.costo)
    if len(attive) < 2:
        return []
    righe = []
    for c in attive:
        m = c.metriche
        a_ = azioni(m)
        righe.append(Riga(nome_campagna(c, gruppo), [eur(m.costo), num(a_), eur(m.costo / a_ if a_ else None),
                                             num(m.conversioni), eur(m.costo / m.conversioni if m.conversioni else None)]))
    t = periodo.totale
    a_ = azioni(t)
    righe.append(Riga("Totale locale", [eur(t.costo), num(a_), eur(t.costo / a_ if a_ else None), num(t.conversioni),
                                        eur(t.costo / t.conversioni if t.conversioni else None)], forte=True))
    return righe


def nota_campagne(periodo: DatiPeriodo, gruppo: Gruppo, stimate: bool) -> str:
    attive = [c for c in periodo.campagne.values() if c.metriche.costo > 0]
    if len(attive) < 2:
        return ""
    testo = ("La Performance Max cerca clienti nuovi su Ricerca e Maps; la campagna sul nome del locale protegge chi "
             "ci cerca già. Il risultato da guardare è il totale del locale.")
    if escluse_dal_compenso(periodo, gruppo) and gruppo.compenso and gruppo.compenso.tipo == "percentuale":
        testo += " Le visite della campagna sul nome del locale restano fuori dal fatturato attribuibile."
    if stimate:
        testo += " Visite stimate dalle indicazioni stradali."
    return testo


# ---------------------------------------------------------------- un locale

def _stato(a: Analisi) -> tuple[bool, bool, float]:
    """(in apprendimento, limitata dal budget, budget giornaliero)."""
    campagne = [c for c in a.dati.corrente.campagne.values() if c.stato == "ENABLED" and c.metriche.costo > 0]
    apprendimento = any(c.stato_primario == "LEARNING" or "BIDDING_STRATEGY_LEARNING" in c.motivi_stato
                        for c in campagne)
    budget_limitato = any("BUDGET_CONSTRAINED" in c.motivi_stato for c in campagne)
    budget = sum(c.budget_giornaliero or 0 for c in campagne)
    return apprendimento, budget_limitato, budget


def _riga_confronto(etichetta: str, serie: list[float | None], giorni: list[int], formato: str,
                    meglio: str | None, volume: bool, forte: bool = False) -> Riga:
    fmt = {"num": lambda x: num(x), "eur": lambda x: eur(x), "pct": lambda x: pct(x, 2)}[formato]
    valori = [fmt(v) for v in serie]
    cur, prev = serie[-1], serie[-2] if len(serie) > 1 else None
    variazione, colore = "", ""
    if cur is not None and prev:
        if formato == "pct":
            d = cur - prev
            variazione = f"{'+' if d >= 0 else '−'}{_it(abs(d) * 100, 1)} pt"
            delta = d
        else:
            delta = _per_giorno(cur, giorni[-1], prev, giorni[-2]) if volume else cur / prev - 1
            variazione = var(delta)
        if meglio and abs(delta) >= 0.03:
            buono = delta > 0 if meglio == "su" else delta < 0
            colore = ("verde" if meglio == "su" else "blu") if buono else "rosso"
    return Riga(etichetta, valori, variazione, colore, forte)


def _data(iso: str | None) -> str:
    if not iso:
        return ""
    a, m, g = (int(x) for x in iso.split("-"))
    return f"{g} {MESI[m - 1]} {a}"


def _vista_locale(n: int, a: Analisi, gruppo: Gruppo) -> VistaLocale:
    c, d, per = a.cliente, a.dati, a.periodi
    m, p = d.corrente.totale, d.precedente.totale
    p2 = d.due_mesi_prima.totale if d.due_mesi_prima and d.due_mesi_prima.totale.costo > 0 else None
    g, gp = per.corrente.giorni, per.precedente.giorni
    stimate = d.visite_stimate
    quota = c.quota_visite_indicazioni
    mese, mese_prec = _mese(per.corrente), _mese(per.precedente)
    chiuso = per.mese_chiuso
    apprendimento, budget_limitato, budget_g = _stato(a)
    campagne_attive = [x for x in sorted(d.corrente.campagne.values(), key=lambda x: -x.metriche.costo)
                       if x.metriche.costo > 0] or sorted(d.corrente.campagne.values(), key=lambda x: -x.metriche.costo)[:1]
    campagna = "” e “".join(x.nome for x in campagne_attive)
    righe_campagne = righe_campagne_locale(d.corrente, gruppo)

    az, az_p = azioni(m), azioni(p)
    costo_az = m.costo / az if az else None
    visite = m.conversioni  # dopo prepara_negozio: visite rilevate o stimate
    consolidate = visite / (1 - gruppo.sottostima_visite) if chiuso and not stimate and visite else None
    cpv = m.costo / visite if visite else None
    cpv_cons = m.costo / consolidate if consolidate else None
    etichetta_visite = f"Visite stimate ({_it(quota * 100, 0)}%)" if stimate else "Visite in negozio (rilevate)"

    # --- introduzione
    d_az = _per_giorno(az, g, az_p, gp)
    d_spesa = _per_giorno(m.costo, g, p.costo, gp)
    frasi = []
    if apprendimento:
        frasi.append("La campagna è ancora **in fase di apprendimento**, quindi non tocchiamo la struttura.")
    if d_az is not None:
        spesa_txt = ("con una spesa quasi invariata" if d_spesa is not None and abs(d_spesa) < 0.08
                     else f"con una spesa {_verso(d_spesa, 'in aumento', 'in calo', 'stabile')} al giorno")
        frasi.append(f"Rispetto {a_mese(mese_prec)}, {spesa_txt}, le azioni al giorno sono "
                     f"{_verso(d_az, 'cresciute', 'calate', 'stabili')}.")
    numeri = (f"In {g} giorni: **{num(m.impressioni)} impressioni**, **{num(m.clic)} clic** e "
              f"**{num(az)} azioni ad alto intento** a **{eur(costo_az)} per azione**")
    if stimate:
        numeri += (f". Il tracciamento delle visite non è attivo, quindi le visite sono stimate al "
                   f"{_it(quota * 100, 0)}% delle indicazioni ({num(visite)})")
    else:
        numeri += f", con **{num(visite)} visite in negozio rilevate** a oggi"
    numeri += "."
    if budget_limitato:
        numeri += " La campagna è **limitata dal budget**."
    intro = md(" ".join(frasi[:1] + [numeri] + frasi[1:]))

    # --- riquadri
    nota_visite = f"Stima consolidata circa {num(consolidate)}" if consolidate else (
        "Alto intento locale" if stimate else "")
    tiles = [(num(visite), etichetta_visite, nota_visite),
             (num(az), "Azioni di conversione", ""),
             (eur(costo_az), "Costo per azione", ""),
             (pct(az / m.clic if m.clic else None), "Tasso di conversione sui clic", "")]
    tiles2 = [(eur(m.costo), "Spesa totale"), (num(m.impressioni), "Impressioni"),
              (num(m.clic), "Clic"), (pct(m.ctr, 2), "CTR")]

    # --- le "conversioni"
    parti = [f"**{num(m.indicazioni)} richieste di indicazioni stradali**", f"**{num(m.contatti)} contatti o chiamate**"]
    if m.ordini:
        parti.append(f"**{num(m.ordini)} ordini o prenotazioni avviati**")
    altre = az - m.indicazioni - m.contatti - m.ordini
    testo = f"**Le {num(az)} “conversioni”.** Azioni ad alto intento: " + ", ".join(parti[:-1]) + f" e {parti[-1]}"
    if altre >= 1:
        testo += f", più {num(altre)} altre azioni"
    testo += ". "
    if stimate:
        testo += f"Il tracciamento delle visite non è attivo, quindi le visite sono stimate al {_it(quota * 100, 0)}% delle indicazioni ({num(visite)})."
    elif consolidate:
        testo += (f"Le visite in negozio sono misurate a parte: {num(visite)} rilevate a oggi, che a finestra chiusa "
                  f"diventeranno circa {num(consolidate)} (i dati attuali segnano circa il "
                  f"{_it(gruppo.sottostima_visite * 100, 0)}% in meno).")
    else:
        testo += f"Le visite in negozio sono misurate a parte: {num(visite)} rilevate a oggi."
    lettura_conv = md(testo)

    # --- confronto mensile
    periodi_serie = [(per.due_mesi_prima, d.due_mesi_prima.totale)] if p2 else []
    periodi_serie += [(per.precedente, p), (per.corrente, m)]
    mesi = [_mese(i).capitalize() for i, _ in periodi_serie]
    giorni = [i.giorni for i, _ in periodi_serie]
    ms = [x for _, x in periodi_serie]
    vis = [x.conversioni for x in ms]
    conf = [
        _riga_confronto("Azioni di conversione", [azioni(x) for x in ms], giorni, "num", "su", True, True),
        _riga_confronto("Richieste indicazioni stradali", [x.indicazioni for x in ms], giorni, "num", "su", True),
        _riga_confronto("Contatti e chiamate", [x.contatti for x in ms], giorni, "num", "su", True),
        _riga_confronto(etichetta_visite.replace(" (rilevate)", " rilevate"), vis, giorni, "num", "su", True, True),
        _riga_confronto("Spesa", [x.costo for x in ms], giorni, "eur", None, True),
        _riga_confronto("Costo per azione", [x.costo / azioni(x) if azioni(x) else None for x in ms], giorni, "eur", "giu", False),
        _riga_confronto("Costo per visita" + (" (stima)" if stimate else ""),
                        [x.costo / v if v else None for x, v in zip(ms, vis)], giorni, "eur", "giu", False, True),
        _riga_confronto("CTR", [x.ctr for x in ms], giorni, "pct", "su", False),
        _riga_confronto("Impressioni", [x.impressioni for x in ms], giorni, "num", None, True),
        _riga_confronto("Clic", [x.clic for x in ms], giorni, "num", "su", True),
    ]

    # --- cosa dicono i numeri
    d_cont = _per_giorno(m.contatti, g, p.contatti, gp)
    d_vis = _per_giorno(visite, g, p.conversioni, gp)
    frase = "**Cosa dicono i numeri.** "
    if d_az is not None:
        spesa_txt = ("Con una spesa quasi invariata" if d_spesa is not None and abs(d_spesa) < 0.08
                     else f"Con una spesa al giorno {_verso(d_spesa, 'in aumento', 'in calo', 'stabile')}")
        frase += f"{spesa_txt}, le azioni al giorno sono {_verso(d_az, 'cresciute', 'calate', 'stabili')}"
        if d_cont is not None:
            frase += f", i contatti {_verso(d_cont, 'cresciuti', 'calati', 'stabili')}"
        if d_vis is not None:
            frase += f" e le visite {'stimate ' if stimate else ''}{_verso(d_vis, 'cresciute', 'calate', 'stabili')}"
        frase += f" rispetto {a_mese(mese_prec)}. "
    if not stimate and m.indicazioni:
        rapporto = visite / m.indicazioni
        confronto = "in linea con" if abs(rapporto - quota) < 0.05 else "sopra" if rapporto > quota else "sotto"
        frase += (f"Il rapporto tra visite e indicazioni stradali è al {_it(rapporto * 100, 1)}%, {confronto} "
                  f"la stima del {_it(quota * 100, 0)}% usata dove il tracciamento manca.")
    lettura_numeri = md(frase)

    # --- canali
    det = d.dettaglio
    canali, colonne = [], ["Canale", "Impressioni", "Clic", "Spesa", "Azioni"]
    colonne.append("Costo/az." if stimate else "Visite neg.")
    sottotitolo_canali = ""
    if det and det.canali:
        tot_impr = sum(x.metriche.impressioni for x in det.canali) or 1
        tot_az = sum(x.metriche.conversioni for x in det.canali) or 1
        for ch in det.canali:
            cm = ch.metriche
            ultima = eur(cm.costo / cm.conversioni if cm.conversioni else None) if stimate else num(cm.visite_reali)
            canali.append(Riga(ch.nome, [num(cm.impressioni), num(cm.clic), eur(cm.costo), num(cm.conversioni), ultima],
                               forte=ch.nome != "YouTube, Discover e altro"))
        principali = [x for x in det.canali if x.nome != "YouTube, Discover e altro"]
        if len(principali) == 2:
            ric, maps = principali
            q_maps = maps.metriche.impressioni / tot_impr
            piu_az = max(principali, key=lambda x: x.metriche.conversioni)
            sottotitolo_canali = (f"Google Maps porta il {_it(q_maps * 100, 0)}% delle impressioni, "
                                  f"{piu_az.nome} il {_it(piu_az.metriche.conversioni / tot_az * 100, 0)}% delle azioni.")

    # --- costo per visita
    costo_visita = None
    if cpv:
        if stimate:
            t = f"**Costo per visita:** {eur(cpv)} (stimato, su {num(visite)} visite)."
        elif cpv_cons:
            t = f"**Costo per visita:** {eur(cpv)} sul dato rilevato oggi, circa {eur(cpv_cons)} a finestra chiusa."
        else:
            t = f"**Costo per visita:** {eur(cpv)} sulle visite rilevate a oggi."
        cpv_p = p.costo / p.conversioni if p.conversioni else None
        if cpv_p:
            t += f" Era {eur(cpv_p)} {a_mese(mese_prec)}."
        if gruppo.target_costo_visita:
            sotto = (cpv_cons or cpv) <= gruppo.target_costo_visita
            t += (f" {'Sotto' if sotto else 'Sopra'} l'obiettivo contrattuale di "
                  f"{eur(gruppo.target_costo_visita)} per visita.")
        costo_visita = md(t)

    # --- lingue / gruppi di asset
    lingue, lettura_lingue = [], None
    gruppi_asset = det.gruppi_asset if det else []
    sono_lingue = bool(gruppi_asset) and sum(
        any(l in ga.nome.lower() for l in LINGUE_NOTE) for ga in gruppi_asset) >= len(gruppi_asset) / 2
    titolo_lingue = "Lingue" if sono_lingue else "Gruppi di asset"
    sottotitolo_lingue = ""
    if gruppi_asset:
        for ga in gruppi_asset:
            gm = ga.metriche
            lingue.append(Riga(ga.nome, [num(gm.clic), pct(gm.ctr, 2), eur(gm.costo), num(gm.conversioni),
                                         eur(gm.costo / gm.conversioni if gm.conversioni else None)], forte=True))
        tot = sum(ga.metriche.conversioni for ga in gruppi_asset) or 1
        primo = gruppi_asset[0]
        con_az = [ga for ga in gruppi_asset if ga.metriche.conversioni >= 10]
        frasi = [f"**Letture chiave.** {primo.nome} guida con {num(primo.metriche.conversioni)} azioni "
                 f"({_it(primo.metriche.conversioni / tot * 100, 0)}% del totale)"]
        if con_az:
            eff = min(con_az, key=lambda x: x.metriche.costo / x.metriche.conversioni)
            if eff is not primo:
                frasi.append(f", {eff.nome} è il più efficiente "
                             f"({eur(eff.metriche.costo / eff.metriche.conversioni)} per azione)")
        crescite = [(ga, ga.metriche.conversioni / ga.conversioni_prec - 1) for ga in gruppi_asset
                    if ga.conversioni_prec and ga.conversioni_prec >= 20]
        testo = "".join(frasi) + "."
        if crescite:
            top = max(crescite, key=lambda x: x[1])
            if top[1] > 0.15:
                testo += (f" {top[0].nome} cresce più di tutti: {num(top[0].metriche.conversioni)} azioni "
                          f"contro {num(top[0].conversioni_prec)} {a_mese(mese_prec)}.")
        if sono_lingue:
            ita = next((ga for ga in gruppi_asset if "italian" in ga.nome.lower()), None)
            if ita:
                quota_estere = 1 - ita.metriche.conversioni / tot
                sottotitolo_lingue = f"Il {_it(quota_estere * 100, 0)}% delle azioni arriva da lingue non italiane."
        lettura_lingue = md(testo)

    # --- orari
    ore = []
    fasce = c.fasce or []
    in_fascia = lambda h: any(a_ <= h <= b_ for a_, b_ in fasce)  # noqa: E731
    per_ora = det.conversioni_per_ora if det else [0.0] * 24
    tot_ore = sum(per_ora) or 1
    for h, v in enumerate(per_ora):
        ore.append((h, v, in_fascia(h)))
    descr = []
    for a_, b_ in fasce:
        quota_f = sum(per_ora[h] for h in range(a_, b_ + 1)) / tot_ore
        nome_f = "pranzo" if a_ < 16 else "cena"
        descr.append(f"**{nome_f} (dalle {a_} alle {b_}) {_it(quota_f * 100, 0)}%**")
    picchi = sorted(range(24), key=lambda h: -per_ora[h])[:2]
    testo_ore = md(("Le fasce di servizio: " + " e ".join(descr) + " delle conversioni. " if descr else "")
                   + "Picchi alle " + " e alle ".join(f"{h} ({num(per_ora[h])})" for h in sorted(picchi)) + ".")
    legenda = "Fasce di servizio (" + ", ".join(
        ("pranzo" if a_ < 16 else "cena") for a_, _ in fasce) + ")" if fasce else ""

    # --- giorni della settimana
    giorni_righe, sott_giorni = [], ""
    if det:
        gc, gpv = det.giorni_corrente, det.giorni_precedente
        cresciuti = [i for i in range(7) if gpv[i] and gc[i] > gpv[i] * 1.1]
        if any(gpv):
            giorni_righe.append(Riga(mese_prec.capitalize(), [num(x) for x in gpv]))
        giorni_righe.append(Riga(mese.capitalize(), [num(x) for x in gc], forte=True))
        best, worst = max(range(7), key=lambda i: gc[i]), min(range(7), key=lambda i: gc[i])
        sott_giorni = f"Media al giorno. {il_giorno(best).capitalize()} è il giorno più forte, {il_giorno(worst)} il più debole."
        if any(gpv):
            sott_giorni += f" Crescono {len(cresciuti)} giorni su 7 rispetto {a_mese(mese_prec)}."

    # --- budget, stato e prossimi passi
    al_giorno = m.costo / g if g else 0
    t = f"Spesa di **{eur(m.costo)}** in {g} giorni, circa **{eur(al_giorno, 0)} al giorno**"
    if budget_g:
        t += f" su un budget di {eur(budget_g, 0)} al giorno"
    t += "."
    if budget_limitato:
        t += (" La campagna è in stato **“Limitato dal budget”**: Google segnala che ci sono ricerche e clienti "
              "che oggi non raggiungiamo perché il budget si esaurisce.")
    if apprendimento:
        t += " È ancora **in fase di apprendimento**."
    budget = md(t)
    richiamo = None
    if budget_limitato:
        richiamo = md(f"**Serve più budget su {c.nome}.** "
                      + ("L'aumento ha senso a fine apprendimento, per non farlo ripartire."
                         if apprendimento else
                         f"Con il costo per azione a {eur(costo_az)}, il limite oggi non è l'efficienza ma la spesa: "
                         "la proposta è aumentarlo in modo graduale, misurando l'effetto sulle visite reali."))
    passi = []
    if apprendimento:
        passi.append(Passo("Completare la fase di apprendimento", "Nessun intervento strutturale fino a fine finestra."))
    peggiore = None
    if gruppi_asset:
        utili = [ga for ga in gruppi_asset if ga.metriche.conversioni >= 10]
        if len(utili) > 1:
            peggiore = max(utili, key=lambda x: x.metriche.costo / x.metriche.conversioni)
    passi.append(Passo("Testare nuovi termini di ricerca",
                       ("Appena fuori dall'apprendimento, inserire" if apprendimento else "Inserire")
                       + " nuovi temi nei gruppi di asset togliendo i meno performanti"
                       + (f", a partire da {peggiore.nome.lower() if sono_lingue else peggiore.nome}." if peggiore else ".")))
    if budget_limitato:
        passi.append(Passo("Aumentare il budget",
                           "La campagna è limitata dal budget: " + (
                               "aumento a fine apprendimento." if apprendimento else
                               "è dove più budget renderebbe di più.")))

    # --- cosa abbiamo fatto (dalle modifiche registrate)
    fatto = None
    tipi = []
    for mod in d.modifiche:
        voce = MODIFICHE.get(mod.risorsa)
        if voce and voce not in tipi:
            tipi.append(voce)
    if c.nota_mese:
        fatto = md(f"**Cosa abbiamo fatto {a_mese(mese)}.** {c.nota_mese}")
    elif tipi:
        fatto = md(f"**Cosa abbiamo fatto {a_mese(mese)}.** Interventi su " + ", ".join(tipi[:-1])
                   + (" e " if len(tipi) > 1 else "") + tipi[-1] + f" ({len(d.modifiche)} modifiche registrate).")

    stati = []
    if apprendimento:
        stati.append("apprendimento")
    if budget_limitato:
        stati.append("limitata dal budget")
    if not stati:
        stati.append("ottimizzata")

    return VistaLocale(
        numero=n, nome=c.nome, descrizione=c.descrizione, campagna=campagna, stimate=stimate,
        intro=intro, tiles_principali=tiles, tiles_secondari=tiles2, lettura_conversioni=lettura_conv,
        mesi=mesi, confronto=conf, lettura_numeri=lettura_numeri,
        canali=canali, canali_colonne=colonne, sottotitolo_canali=sottotitolo_canali, costo_visita=costo_visita,
        titolo_lingue=titolo_lingue, sottotitolo_lingue=sottotitolo_lingue, lingue=lingue, lettura_lingue=lettura_lingue,
        ore=ore, testo_ore=testo_ore, legenda_ore=legenda, giorni=giorni_righe, sottotitolo_giorni=sott_giorni,
        budget=budget, richiamo_budget=richiamo, fatto=fatto, passi=passi, stati=stati,
        campagne=righe_campagne, nota_campagne=nota_campagne(d.corrente, gruppo, stimate),
        spesa=m.costo, n_azioni=az, visite=visite, m=m, p=p,
    )


# ---------------------------------------------------------------- il gruppo

def vista_gruppo(gruppo: Gruppo, analisi: list[Analisi], agenzia: Agenzia) -> VistaGruppo:
    per = analisi[0].periodi
    mese, mese_prec = _mese(per.corrente), _mese(per.precedente)
    anno = per.corrente.inizio.year
    numero = gruppo.numero_report(anno, per.corrente.inizio.month)
    locali = [_vista_locale(i, a, gruppo) for i, a in enumerate(analisi, start=1)]
    n_loc = len(locali)
    chiuso = per.mese_chiuso

    periodo_txt = (f"{per.corrente.inizio.day}-{per.corrente.fine.day} {mese} {anno}"
                   if per.corrente.inizio.month == per.corrente.fine.month else per.corrente.etichetta())
    n_txt = f"Report N.{numero}, mese di {mese}" if numero else f"Report del mese di {mese}"
    sottotitolo = (f"{n_txt}. Andamento rispetto {a_mese(mese_prec)}, valore generato e attribuzione delle visite"
                   + (f" per le {['', 'una', 'due', 'tre', 'quattro', 'cinque', 'sei'][n_loc] if n_loc < 7 else n_loc} insegne del gruppo."
                      if n_loc > 1 else "."))
    tipi = sorted({c.tipo for a in analisi for c in a.dati.corrente.campagne.values() if c.metriche.costo > 0})
    nomi_tipo = {"PERFORMANCE_MAX": "Performance Max", "SEARCH": "Rete di Ricerca", "DISPLAY": "Display",
                 "VIDEO": "Video", "LOCAL": "Locale", "SMART": "Smart"}
    meta = [("Periodo", periodo_txt),
            ("Report", f"N.{numero} · {mese.capitalize()}" if numero else mese.capitalize()),
            ("Campagne", ", ".join(nomi_tipo.get(t, t.title()) for t in tipi) or "–")]
    if n_loc > 1:
        meta.append(("Insegne", str(n_loc)))
    nota = None
    if chiuso:
        nota = md(f"**Nota sull'attribuzione, da tenere a mente.** I dati di {mese} sono ancora parziali: Google impiega "
                  "fino a 30 giorni dall'ultimo clic per attribuire conversioni e, soprattutto, visite in negozio. "
                  f"I numeri di oggi sono quindi sottostimati, le visite di circa il {_it(gruppo.sottostima_visite * 100, 0)}%, "
                  "e cresceranno a finestra chiusa. Le tendenze restano valide, i valori assoluti vanno letti come una "
                  "fotografia attuale.")
    piede = f"{gruppo.nome}, Report Google Ads" + (f" N.{numero}" if numero else f" · {mese.capitalize()} {anno}")
    colore = gruppo.colore or "#c9a25a"
    vg = VistaGruppo(gruppo=gruppo, agenzia=agenzia, periodi=per, colore=colore, titolo=gruppo.nome,
                     sottotitolo=sottotitolo, meta=meta, nota_attribuzione=nota, locali=locali, piede=piede)

    # --- sintesi del gruppo
    if n_loc > 1:
        tot_spesa = sum(x.spesa for x in locali)
        tot_az = sum(x.n_azioni for x in locali)
        tot_vis = sum(x.visite for x in locali)
        for x in locali:
            vg.insegne.append(Riga(x.nome, [eur(x.spesa), num(x.n_azioni), eur(x.spesa / x.n_azioni if x.n_azioni else None),
                                            num(x.visite), eur(x.spesa / x.visite if x.visite else None), ", ".join(x.stati)]))
        vg.insegne.append(Riga("Totale gruppo", [eur(tot_spesa), num(tot_az), eur(tot_spesa / tot_az if tot_az else None),
                                                 num(tot_vis), eur(tot_spesa / tot_vis if tot_vis else None), ""], forte=True))
        stimate = [x.nome for x in locali if x.stimate]
        vg.nota_insegne = ("Visite rilevate a oggi, quindi circa il "
                           f"{_it(gruppo.sottostima_visite * 100, 0)}% sotto il dato finale."
                           + (f" {elenco(stimate)} sul {_it(analisi[0].cliente.quota_visite_indicazioni * 100, 0)}% "
                              "delle indicazioni stradali." if stimate else ""))
        if gruppo.target_costo_visita:
            vg.nota_insegne += f" Obiettivo contrattuale: {eur(gruppo.target_costo_visita)} per visita."
        g, gp = per.corrente.giorni, per.precedente.giorni
        p_spesa = sum(x.p.costo for x in locali)
        p_az = sum(azioni(x.p) for x in locali)
        p_vis = sum(x.p.conversioni for x in locali)
        vg.mesi_gruppo = [mese_prec.capitalize(), mese.capitalize()]
        def riga(et, a_, b_, fmt, meglio, forte=False):
            d_ = b_ / a_ - 1 if a_ else None
            col = ""
            if d_ is not None and meglio and abs(d_) >= 0.03:
                buono = d_ > 0 if meglio == "su" else d_ < 0
                col = ("verde" if meglio == "su" else "blu") if buono else "rosso"
            return Riga(et, [fmt(a_), fmt(b_)], var(d_), col, forte)
        vg.confronto_gruppo = [
            riga("Spesa", p_spesa / gp, tot_spesa / g, eur, None),
            riga("Azioni di conversione", p_az / gp, tot_az / g, lambda x: num(x, 1), "su", True),
            riga("Visite in negozio", p_vis / gp, tot_vis / g, lambda x: num(x, 1), "su", True),
            riga("Costo per azione", p_spesa / p_az if p_az else None, tot_spesa / tot_az if tot_az else None, eur, "giu"),
        ]
        d_az = _per_giorno(tot_az, g, p_az, gp)
        d_vis = _per_giorno(tot_vis, g, p_vis, gp)
        d_sp = _per_giorno(tot_spesa, g, p_spesa, gp)
        if d_az is not None:
            vg.intro_gruppo = md(
                f"Le {n_loc} insegne, con una spesa al giorno {_verso(d_sp, 'in aumento', 'in calo', 'quasi invariata')} "
                f"rispetto {a_mese(mese_prec)}, generano azioni al giorno {_verso(d_az, 'in crescita', 'in calo', 'stabili')}"
                + (f" e visite al giorno {_verso(d_vis, 'in crescita', 'in calo', 'stabili')}" if d_vis is not None else "")
                + f", con il costo per azione da {eur(p_spesa / p_az if p_az else None)} a **{eur(tot_spesa / tot_az if tot_az else None)}**.")

    # --- attribuzione a 30 giorni del mese precedente
    if chiuso and any(a.attribuzione for a in analisi):
        rif = f"Report N.{numero - 1}" if numero and numero > 1 else f"Report di {mese_prec}"
        vg.attribuzione_titolo = f"Attribuzione di {mese_prec} a 30 giorni"
        vg.attribuzione_colonne = ["Insegna", rif, "Oggi, consolidato", "Variazione"]
        for a, x in zip(analisi, locali):
            if not a.attribuzione:
                continue
            prima, oggi = a.attribuzione
            base = f" (stima {_it(a.cliente.quota_visite_indicazioni * 100, 0)}%)" if x.stimate else " (rilevate)"
            d_ = oggi / prima - 1 if prima else None
            vg.attribuzione.append(Riga(x.nome, [num(prima) + base, num(oggi) + base], var(d_),
                                        "verde" if d_ is not None and d_ > 0.005 else ""))
        vg.attribuzione_nota = md(
            f"Visite di {mese_prec} come risultavano nel report del mese scorso e come risultano oggi, a 30 giorni "
            "dal clic: Google le attribuisce con ritardo, quindi il dato del mese appena chiuso cresce sempre.")

    # --- compenso (solo report di chiusura mese)
    if chiuso and gruppo.compenso:
        _compenso(vg, gruppo, analisi, locali)

    # --- cosa abbiamo fatto e priorità
    if gruppo.fatto:
        vg.fatto = md(f"**{mese.capitalize()}, in sintesi.** {gruppo.fatto}")
    priorita: list[Passo] = []
    limitati = [x.nome for x in locali if "limitata dal budget" in x.stati]
    in_appr = [x.nome for x in locali if "apprendimento" in x.stati]
    if n_loc > 1:
        attivi = [x.nome for x in locali if x.nome not in in_appr]
        priorita.append(Passo("Testare nuovi termini di ricerca",
                              "Inserire nuovi termini nei gruppi di asset togliendo i meno performanti"
                              + (f", subito su {elenco(attivi)}" if attivi else "")
                              + (f", a fine apprendimento su {elenco(in_appr)}." if in_appr else ".")))
        if limitati:
            subito = [x for x in limitati if x not in in_appr]
            dopo = [x for x in limitati if x in in_appr]
            parti = ([f"subito su {elenco(subito)}"] if subito else []) + (
                [f"a fine apprendimento su {elenco(dopo)}"] if dopo else [])
            priorita.append(Passo("Aumentare, se possibile, il budget dove è limitato",
                                  f"{elenco(limitati)} {'sono limitate' if len(limitati) > 1 else 'è limitata'} "
                                  f"dal budget: aumento {' e '.join(parti)}."))
    priorita += [Passo(p_.split(":", 1)[0].strip(), p_.split(":", 1)[1].strip() if ":" in p_ else "")
                 for p_ in gruppo.prossimi_passi]
    vg.priorita = priorita
    return vg


def _compenso(vg: VistaGruppo, gruppo: Gruppo, analisi: list[Analisi], locali: list[VistaLocale]) -> None:
    comp = gruppo.compenso
    per = analisi[0].periodi
    mese, mese_prec = _mese(per.corrente), _mese(per.precedente)
    if comp.tipo == "percentuale":
        base_prec = comp.base == "mese_precedente"
        mese_base = mese_prec if base_prec else mese
        vg.compenso_titolo = f"Fatturato attribuibile e fee di {mese_base}"
        vg.compenso_sottotitolo = (
            f"Modello: fatturato attribuibile = visite × coperti × scontrino medio del locale; la fee è "
            f"{_art_pct(comp.percentuale)}{_it(comp.percentuale * 100, 0)}% di quel valore. "
            + ("Come concordato, l'attribuibile si calcola 30 giorni dopo la fine del mese, a dati consolidati."
               if base_prec else
               f"Sono incluse le visite registrate a oggi; quelle che Google registrerà nei prossimi 30 giorni "
               f"saranno conteggiate a conguaglio nel report successivo.")
            + (" Le visite delle campagne sul nome del locale (Search brand) restano fuori dall'attribuibile."
               if comp.escludi else ""))
        vg.compenso_colonne = ["Locale", "Visite", "Base", "Coperti", "Scontrino", "Fatturato attrib.",
                               f"Fee {_it(comp.percentuale * 100, 0)}%"]
        tot_v = tot_f = tot_fee = 0.0
        for a, x in zip(analisi, locali):
            c = a.cliente
            if not (c.coperti_per_visita and c.scontrino_medio) or a.fuori_contratto:
                continue
            visite = (x.p.conversioni if base_prec else x.visite)
            if a.visite_base_fee is not None:
                visite = a.visite_base_fee
            senza_brand = escluse_dal_compenso(a.dati.precedente if base_prec else a.dati.corrente, gruppo)
            visite = max(visite - senza_brand, 0.0)
            coperti = visite * c.coperti_per_visita
            fatturato = coperti * c.scontrino_medio
            fee = fatturato * comp.percentuale
            base = f"stima {_it(c.quota_visite_indicazioni * 100, 0)}%" if x.stimate else "rilevate"
            if a.visite_base_fee is not None:
                base += f" dal {_data(c.contratto_dal).rsplit(' ', 1)[0]}"
            if senza_brand:
                base += ", senza brand"
            vg.compenso.append(Riga(c.nome, [num(visite), base, f"{num(coperti, 1)} (×{_it(c.coperti_per_visita, 1)})",
                                             eur(c.scontrino_medio), eur(fatturato), eur(fee)]))
            tot_v, tot_f, tot_fee = tot_v + visite, tot_f + fatturato, tot_fee + fee
        if vg.compenso:
            vg.compenso.append(Riga(f"Totale {mese_base}", [num(tot_v), "", "", "", eur(tot_f), eur(tot_fee)], forte=True))
        fissi = []
        for a in analisi:
            c = a.cliente
            if c.compenso_fisso and (not c.contratto_dal or date.fromisoformat(c.contratto_dal) <= per.corrente.fine):
                inps = f" + {_it(c.inps_fisso * 100, 0)}% INPS" if c.inps_fisso else ""
                fissi.append(f"{c.nome} {eur(c.compenso_fisso, 0)}{inps}")
        if fissi:
            vg.compenso_nota = md(f"**Compenso fisso di {mese}:** {elenco(fissi)}, da sommare alla fee.")
        if not base_prec and len(analisi) == 1:
            x = locali[0]
            vg.compenso_nota = md(f"**Conguaglio.** Le visite di {mese_prec} risultano oggi {num(x.p.conversioni)} a dato "
                                  "consolidato: la differenza rispetto a quanto fatturato il mese scorso va a conguaglio.")
    else:
        # Compenso fisso: ritorno economico con margine, ROI e ROAS.
        vg.compenso_titolo = "Il ritorno economico del mese"
        a, x = analisi[0], locali[0]
        c = a.cliente
        if not (c.coperti_per_visita and c.scontrino_medio):
            return
        margine = comp.margine or 0.0
        vg.compenso_sottotitolo = (f"Parametri del ristorante: {_it(c.coperti_per_visita, 1)} coperti per visita, "
                                   f"{eur(c.scontrino_medio, 0)} di spesa media a persona"
                                   + (f", margine del {_it(margine * 100, 0)}%" if margine else "")
                                   + ". Le visite sono ancora provvisorie, quindi il calcolo è prudente.")
        vg.compenso_colonne = ["Voce", "Operazione", "Valore"]

        def calcolo(visite: float, spesa: float):
            coperti = visite * c.coperti_per_visita
            fatt = coperti * c.scontrino_medio
            marg = fatt * margine
            costo_tot = spesa + comp.importo
            profitto = marg - costo_tot
            return coperti, fatt, marg, profitto, (profitto / costo_tot if costo_tot else None), (fatt / costo_tot if costo_tot else None)

        coperti, fatt, marg, profitto, roi, roas = calcolo(x.visite, x.spesa)
        _, _, _, _, roi_p, roas_p = calcolo(x.p.conversioni, x.p.costo)
        vg.compenso = [
            Riga("Visite in negozio (provvisorie)", ["stimate" if x.stimate else "tracciate", num(x.visite)]),
            Riga("Coperti stimati", [f"{num(x.visite)} × {_it(c.coperti_per_visita, 1)}", num(coperti)]),
            Riga("Fatturato attribuibile", [f"{num(coperti)} × {eur(c.scontrino_medio, 0)}", eur(fatt, 0)], forte=True),
        ]
        if margine:
            vg.compenso += [
                Riga(f"Margine generato ({_it(margine * 100, 0)}%)", [f"{eur(fatt, 0)} × {_it(margine, 2)}", eur(marg, 0)]),
                Riga("Spesa Google Ads", ["speso", "− " + eur(x.spesa, 0)]),
                Riga("Compenso gestione", ["fisso", "− " + eur(comp.importo, 0)]),
                Riga("Profitto netto attribuito", [f"{eur(marg, 0)} − {eur(x.spesa + comp.importo, 0)}", eur(profitto, 0)], forte=True),
            ]
            vg.compenso_riquadri = [
                ("ROI sul margine", pct(roi, 0), "profitto netto ÷ (spesa Google Ads + compenso)"
                 + (f" · {mese_prec} {pct(roi_p, 0)}" if roi_p is not None else "")),
                ("ROAS", f"{num(roas, 1)} ×", "fatturato attribuibile ÷ (spesa Google Ads + compenso)"
                 + (f" · {mese_prec} {num(roas_p, 1)} ×" if roas_p is not None else "")),
            ]
