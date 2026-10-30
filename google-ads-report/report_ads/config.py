"""Caricamento della configurazione clienti (clienti.yaml).

Un cliente può avere un solo account Google Ads oppure più locali (`locali:`),
ognuno con il suo account: in quel caso riceve un unico report di gruppo.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from pathlib import Path

import yaml

from .periodi import MOMENTI


@dataclass
class Cliente:
    """Un account Google Ads (per i gruppi: un locale)."""
    nome: str
    customer_id: str
    obiettivo: str = "lead"  # lead | ecommerce | negozio
    budget_mensile: float | None = None
    cpa_target: float | None = None
    roas_target: float | None = None
    email: list[str] = field(default_factory=list)
    # False: il report cliente arriva a te da inoltrare. True: parte direttamente al cliente.
    invio_automatico: bool = False
    report_cliente: list[str] = field(default_factory=lambda: ["inizio"])
    note: str = ""  # contesto per l'analisi (stagionalità, obiettivi, vincoli)
    # Obiettivo "negozio": se Google non misura le visite al negozio, si stimano
    # come questa quota delle indicazioni stradali.
    quota_visite_indicazioni: float = 0.27
    # Visite: "auto" usa quelle misurate da Google se ci sono, altrimenti la stima;
    # "stimate" forza la stima (per esempio se il tracciamento è partito da poco ed è incompleto).
    visite: str = "auto"  # auto | rilevate | stimate
    # Report dei locali: descrizione sotto il nome, fasce orarie di servizio e
    # parametri per il fatturato attribuibile (visite × coperti × scontrino).
    descrizione: str = ""
    fasce: list[list[int]] = field(default_factory=lambda: [[12, 14], [18, 20]])
    # Layout Grano: fasce della tabella "Giorni e orari", come [nome, dalle, alle].
    fasce_tabella: list = field(default_factory=lambda: [
        ["Mattina (fino alle 10)", 0, 10], ["Pranzo (dalle 11 alle 15)", 11, 15],
        ["Pomeriggio (dalle 16 alle 18)", 16, 18], ["Sera (dalle 19 in poi)", 19, 23]])
    coperti_per_visita: float | None = None
    scontrino_medio: float | None = None
    # Contratto del locale: le visite contano per la fee da `contratto_dal` (AAAA-MM-GG);
    # compenso fisso mensile, con l'eventuale contributo INPS (es. 0.04 = +4%).
    contratto_dal: str | None = None
    compenso_fisso: float | None = None
    inps_fisso: float = 0.0
    # Testo libero del mese per questo locale (dalle note del mese): "Cosa abbiamo fatto".
    nota_mese: str = ""
    contesto: str = ""  # storia e strategia del locale (Secret CONTESTO_CLIENTI)
    contesto_gruppo: str = ""  # storia del cliente a cui appartiene il locale
    # Espressione regolare delle ricerche sul nome del locale (es. "d[oòó]m[oòó]"): serve a calcolare
    # la quota di conversioni Performance Max sul nome, da escludere dalla fee.
    nome_ricerche: str = ""
    nome_breve: str = ""  # nome nei grafici e nelle tabelle (es. "Locale Roma")
    # Visite scritte nei report già inviati, per mese ("2026-09": 1215): il report successivo le confronta
    # con il dato consolidato (attribuzione a 30 giorni) e calcola l'eventuale conguaglio.
    visite_comunicate: dict = field(default_factory=dict)

    @property
    def ecommerce(self) -> bool:
        return self.obiettivo == "ecommerce"

    @property
    def negozio(self) -> bool:
        return self.obiettivo == "negozio"


@dataclass
class Compenso:
    """Come si calcola il compenso nel report cliente.

    - percentuale: `percentuale` del fatturato attribuibile. Con base "mese_precedente"
      si usano le visite del mese prima, ormai consolidate (fino a 30 giorni di attribuzione);
      con base "mese" le visite del mese chiuso registrate a oggi.
    - fisso: `importo` fisso; il report mostra margine, ROI e ROAS (serve `margine`).
    """
    tipo: str = "percentuale"  # percentuale | fisso
    percentuale: float = 0.0
    base: str = "mese_precedente"  # mese_precedente | mese
    importo: float = 0.0
    margine: float | None = None
    # Tipi di campagna le cui visite restano fuori dal fatturato attribuibile (es. [SEARCH] per le
    # campagne sul nome del locale, che proteggono clienti già acquisiti).
    escludi: list[str] = field(default_factory=list)
    # True: esclude anche la quota di visite Performance Max arrivate da ricerche del nome del locale.
    escludi_nome: bool = False
    escludi_dal: str = ""  # "AAAA-MM": le esclusioni valgono dai mesi da qui in poi (prima no)


@dataclass
class Gruppo:
    """Un cliente: riceve un report con uno o più locali."""
    nome: str
    locali: list[Cliente]
    sottotitolo: str = ""
    # Impostazione del report cliente: "advisory" (una sezione per locale) o "grano" (sezioni numerate).
    layout: str = "advisory"
    # Formato del report cliente: pdf (layout advisory o grano), docx (Word orizzontale antracite e oro),
    # pptx (presentazione 16:9 nella palette del cliente).
    formato: str = "pdf"
    fisso_mensile: float = 0.0  # compenso fisso del cliente (solo nel report interno)
    colore: str = ""
    colore_titoletti: str = ""  # layout grano: colore dei sottotitoli (es. rosso chiaro, ocra)
    report_cliente: list[str] = field(default_factory=lambda: ["inizio"])
    email: list[str] = field(default_factory=list)
    invio_automatico: bool = False
    # Numerazione: {mese: "2026-09", numero: 3} significa che settembre 2026 è il report N.3.
    report_n: dict | None = None
    target_costo_visita: float | None = None
    # Quota di visite che Google registra in ritardo (fino a 30 giorni): stima consolidata = rilevate / (1 - x).
    sottostima_visite: float = 0.30
    compenso: Compenso | None = None
    # Testi del mese scritti da te: cosa è stato fatto e prossimi passi aggiuntivi.
    fatto: str = ""
    prossimi_passi: list[str] = field(default_factory=list)
    focus: str = ""  # "Focus del mese" in copertina
    sezioni: list[dict] = field(default_factory=list)  # sezioni libere: [{titolo, testo}]
    # Storia e strategia del cliente (Secret CONTESTO_CLIENTI): la legge Claude per scrivere i testi.
    contesto: str = ""
    # Report già inviati (dalla memoria salvata dopo ogni invio): numeri e testi, per la continuità dei testi.
    memoria: list = field(default_factory=list)

    @property
    def negozio(self) -> bool:
        return all(loc.negozio for loc in self.locali)

    def numero_report(self, anno: int, mese: int) -> int | None:
        if not self.report_n:
            return None
        a, m = (int(x) for x in str(self.report_n["mese"]).split("-"))
        return int(self.report_n["numero"]) + (anno - a) * 12 + (mese - m)


@dataclass
class Agenzia:
    nome: str = "Francesco Gizzi"
    sito: str = ""
    email_interna: str = ""
    colore: str = "#173b7a"


@dataclass
class Configurazione:
    agenzia: Agenzia
    gruppi: list[Gruppo]

    @property
    def clienti(self) -> list[Cliente]:
        """Tutti gli account, uno per locale."""
        return [loc for g in self.gruppi for loc in g.locali]


CAMPI_CLIENTE = {f.name for f in fields(Cliente)}
CAMPI_GRUPPO = {f.name for f in fields(Gruppo)} - {"locali", "nome", "compenso"}


def _cliente(dati: dict, ereditati: dict, posizione: str) -> Cliente:
    c = {**{k: v for k, v in ereditati.items() if k in CAMPI_CLIENTE}, **dati}
    if not c.get("nome") or not c.get("customer_id"):
        raise ValueError(f"{posizione}: 'nome' e 'customer_id' sono obbligatori")
    sconosciuti = set(c) - CAMPI_CLIENTE
    if sconosciuti:
        raise ValueError(f"{posizione}: campi sconosciuti {sorted(sconosciuti)}")
    if isinstance(c.get("email"), str):
        c["email"] = [c["email"]]
    cliente = Cliente(**c)
    cliente.customer_id = str(cliente.customer_id)
    if cliente.visite not in ("auto", "rilevate", "stimate"):
        raise ValueError(f"{cliente.nome}: visite deve essere 'auto', 'rilevate' o 'stimate'")
    if cliente.obiettivo not in ("lead", "ecommerce", "negozio"):
        raise ValueError(f"{cliente.nome}: obiettivo deve essere 'lead', 'ecommerce' o 'negozio'")
    sconosciuti = set(cliente.report_cliente) - set(MOMENTI)
    if sconosciuti:
        raise ValueError(f"{cliente.nome}: report_cliente contiene valori non validi {sconosciuti}")
    return cliente


def carica(percorso: str | Path) -> Configurazione:
    dati = yaml.safe_load(Path(percorso).read_text(encoding="utf-8")) or {}
    agenzia = Agenzia(**(dati.get("agenzia") or {}))
    gruppi = []
    for i, voce in enumerate(dati.get("clienti") or [], start=1):
        voce = dict(voce)
        compenso = Compenso(**voce.pop("compenso")) if voce.get("compenso") else None
        if isinstance(voce.get("email"), str):
            voce["email"] = [voce["email"]]
        if "locali" in voce:
            locali_dati = voce.pop("locali") or []
            if not voce.get("nome") or not locali_dati:
                raise ValueError(f"Cliente n. {i}: un gruppo richiede 'nome' e almeno un locale")
            comuni = {k: v for k, v in voce.items() if k != "nome"}
            locali = [_cliente(loc, comuni, f"Cliente n. {i}, locale n. {j}")
                      for j, loc in enumerate(locali_dati, start=1)]
        else:
            locali = [_cliente({k: v for k, v in voce.items() if k in CAMPI_CLIENTE}, {}, f"Cliente n. {i}")]
        extra = {k: v for k, v in voce.items() if k in CAMPI_GRUPPO}
        sconosciuti = set(voce) - CAMPI_CLIENTE - CAMPI_GRUPPO - {"nome"}
        if sconosciuti:
            raise ValueError(f"Cliente n. {i}: campi sconosciuti {sorted(sconosciuti)}")
        gruppo = Gruppo(nome=voce["nome"], locali=locali, compenso=compenso, **extra)
        if gruppo.formato not in ("pdf", "docx", "pptx"):
            raise ValueError(f"Cliente n. {i}: formato deve essere 'pdf', 'docx' o 'pptx'")
        if gruppo.layout not in ("advisory", "grano"):
            raise ValueError(f"Cliente n. {i}: layout deve essere 'advisory' o 'grano'")
        gruppi.append(gruppo)
    if not gruppi:
        raise ValueError("Nessun cliente configurato")
    return Configurazione(agenzia, gruppi)


def applica_note(conf: Configurazione, percorso: str | Path, mese: str) -> list[str]:
    """Aggiunge i testi del mese (Secret NOTE_MESE) ai clienti e ai locali.

    Formato:
        mese: "2026-10"            # il mese di cui parla il report (quello del 1° novembre è ottobre)
        Gruppo Esempio:            # nome del cliente: testi della sintesi finale
          fatto: Pulizia dei termini e nuovi temi di ricerca su tutte le insegne.
          prossimi_passi:
            - "Difesa del brand: attivare campagne sul nome dei locali."
        Locale Uno:                # nome di un locale: "Cosa abbiamo fatto" nella sua sezione
          fatto: Nuovi temi di ricerca in francese e spagnolo.

    Le note di un altro mese vengono ignorate, così non finiscono per sbaglio nel report sbagliato.
    Restituisce gli avvisi (senza nomi dei clienti, perché i log sono pubblici).
    """
    file = Path(percorso)
    if not file.exists() or not file.read_text(encoding="utf-8").strip():
        return []
    dati = yaml.safe_load(file.read_text(encoding="utf-8")) or {}
    if str(dati.get("mese", "")) != mese:
        return [f"Note del mese ignorate: sono per '{dati.get('mese', '?')}', il report è su {mese}"]
    avvisi = []
    gruppi = {g.nome: g for g in conf.gruppi}
    locali = {loc.nome: loc for g in conf.gruppi for loc in g.locali if len(g.locali) > 1}
    for nome, testi in dati.items():
        if nome == "mese":
            continue
        testi = testi or {}
        if isinstance(testi.get("prossimi_passi"), str):
            testi["prossimi_passi"] = [testi["prossimi_passi"]]
        if nome in gruppi:
            g = gruppi[nome]
            g.fatto = str(testi.get("fatto", g.fatto) or "")
            g.prossimi_passi = list(testi.get("prossimi_passi", g.prossimi_passi) or [])
            g.focus = str(testi.get("focus", g.focus) or "")
            sezioni = testi.get("sezioni") or []
            g.sezioni = [{"titolo": str(x.get("titolo", "")), "testo": str(x.get("testo", ""))}
                         for x in sezioni if isinstance(x, dict) and x.get("titolo")]
        elif nome in locali:
            locali[nome].nota_mese = str(testi.get("fatto", "") or "")
        else:
            avvisi.append("Note del mese: un nome non corrisponde a nessun cliente o locale")
    return avvisi


def applica_contesto(conf: Configurazione, percorso: str | Path) -> list[str]:
    """Aggiunge la storia e la strategia dei clienti (Secret CONTESTO_CLIENTI), valide finché non le cambi.

    Formato: nome del cliente o del locale, poi il testo (anche lungo, con | per andare a capo).
    Per un locale si possono indicare anche le visite scritte nei report già inviati:
        Gruppo Esempio: |
          Da luglio una Performance Max per locale; da ottobre anche una campagna sul nome del locale...
        Locale Uno:
          visite_comunicate: {"2026-09": 1215}
          testo: |
            In apprendimento, budget minimo.

    Il testo serve solo a Claude per ragionare sui numeri: non viene stampato nei report.
    """
    file = Path(percorso)
    if not file.exists() or not file.read_text(encoding="utf-8").strip():
        return []
    dati = yaml.safe_load(file.read_text(encoding="utf-8")) or {}
    if not isinstance(dati, dict):
        return ["Contesto clienti ignorato: il formato non è nome: testo"]
    avvisi = []
    gruppi = {g.nome: g for g in conf.gruppi}
    locali = {loc.nome: loc for g in conf.gruppi for loc in g.locali}
    for nome, voce in dati.items():
        testo, visite = (voce.get("testo", ""), voce.get("visite_comunicate") or {}) if isinstance(voce, dict) else (voce, {})
        if nome in gruppi:
            gruppi[nome].contesto = str(testo or "")
            for loc in gruppi[nome].locali:
                loc.contesto_gruppo = gruppi[nome].contesto
            if len(gruppi[nome].locali) == 1:
                gruppi[nome].locali[0].visite_comunicate = {str(k): float(v) for k, v in visite.items()}
        elif nome in locali:
            locali[nome].contesto = str(testo or "")
            locali[nome].visite_comunicate = {str(k): float(v) for k, v in visite.items()}
        else:
            avvisi.append("Contesto clienti: un nome non corrisponde a nessun cliente o locale")
    return avvisi
