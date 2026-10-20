"""Lettura dei dati dalla Google Ads API (libreria ufficiale `google-ads`).

Le credenziali arrivano da variabili d'ambiente (in GitHub Actions dai
Secrets): nessuna chiave sta nel codice o nel repository.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

from .modello import (
    Campagna, Canale, DatiAccount, DatiPeriodo, Dettaglio, GruppoAsset, Keyword, Metriche, Modifica,
    TermineRicerca,
)
from .periodi import Intervallo, Periodi

log = logging.getLogger(__name__)

MICRO = 1_000_000

METRICHE_GAQL = """
    metrics.cost_micros, metrics.impressions, metrics.clicks,
    metrics.conversions, metrics.conversions_value,
    metrics.search_impression_share,
    metrics.search_budget_lost_impression_share,
    metrics.search_rank_lost_impression_share
"""

VARIABILI = {
    "client_id": "GOOGLE_ADS_CLIENT_ID",
    "client_secret": "GOOGLE_ADS_CLIENT_SECRET",
    "refresh_token": "GOOGLE_ADS_REFRESH_TOKEN",
}
# Facoltative. Il developer token è stato ritirato da Google il 9/9/2026: l'accesso
# dipende dal livello del progetto Google Cloud. Se lo imposti viene inviato e ignorato.
# login_customer_id serve quando gli account si leggono tramite l'account amministratore (MCC).
VARIABILI_FACOLTATIVE = {
    "developer_token": "GOOGLE_ADS_DEVELOPER_TOKEN",
    "login_customer_id": "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
}


# Categorie di conversione raggruppate come nei report dei locali.
CATEGORIE = {
    "GET_DIRECTIONS": "indicazioni",
    "PHONE_CALL_LEAD": "contatti", "CONTACT": "contatti", "MESSAGE_LEAD": "contatti",
    "SUBMIT_LEAD_FORM": "contatti",
    "BEGIN_CHECKOUT": "ordini", "PURCHASE": "ordini", "BOOK_APPOINTMENT": "ordini",
}

CANALI = {"SEARCH": "Rete di Ricerca", "SEARCH_PARTNERS": "Rete di Ricerca", "MAPS": "Google Maps"}
ALTRI_CANALI = "YouTube, Discover e altro"

GIORNI = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]


def pulisci_id(customer_id: str) -> str:
    return str(customer_id).replace("-", "").strip()


def _opzionale(msg, campo: str) -> float | None:
    return getattr(msg, campo) if campo in msg else None


def _metriche(m) -> Metriche:
    return Metriche(
        costo=m.cost_micros / MICRO,
        impressioni=m.impressions,
        clic=m.clicks,
        conversioni=m.conversions,
        valore_conv=m.conversions_value,
        quota_impr=_opzionale(m, "search_impression_share"),
        persa_budget=_opzionale(m, "search_budget_lost_impression_share"),
        persa_ranking=_opzionale(m, "search_rank_lost_impression_share"),
    )


class FonteGoogleAds:
    def __init__(self) -> None:
        from google.ads.googleads.client import GoogleAdsClient

        mancanti = [v for v in VARIABILI.values() if not os.environ.get(v)]
        if mancanti:
            raise RuntimeError(
                "Credenziali Google Ads mancanti: " + ", ".join(mancanti)
                + ". Vedi google-ads-report/README.md (oppure usa --demo)."
            )
        config = {k: os.environ[v] for k, v in VARIABILI.items()}
        for k, v in VARIABILI_FACOLTATIVE.items():
            if os.environ.get(v):
                config[k] = os.environ[v]
        if "login_customer_id" in config:
            config["login_customer_id"] = pulisci_id(config["login_customer_id"])
        config["use_proto_plus"] = True
        self.client = GoogleAdsClient.load_from_dict(config)
        self.servizio = self.client.get_service("GoogleAdsService")

    def _query(self, customer_id: str, query: str):
        for batch in self.servizio.search_stream(customer_id=customer_id, query=query):
            yield from batch.results

    def _periodo(self, cid: str, intervallo: Intervallo, con_giornaliero: bool) -> DatiPeriodo:
        totale = Metriche()
        for row in self._query(cid, f"SELECT {METRICHE_GAQL} FROM customer WHERE {intervallo.gaql()}"):
            totale = _metriche(row.metrics)

        campagne: dict[str, Campagna] = {}
        q = f"""
            SELECT campaign.id, campaign.name, campaign.status,
                   campaign.advertising_channel_type, campaign_budget.amount_micros,
                   campaign.primary_status, campaign.primary_status_reasons,
                   {METRICHE_GAQL}
            FROM campaign
            WHERE {intervallo.gaql()} AND campaign.status != 'REMOVED'
        """
        for row in self._query(cid, q):
            c = row.campaign
            budget = row.campaign_budget.amount_micros / MICRO if row.campaign_budget.amount_micros else None
            campagne[str(c.id)] = Campagna(
                id=str(c.id), nome=c.name, stato=c.status.name,
                tipo=c.advertising_channel_type.name,
                budget_giornaliero=budget, metriche=_metriche(row.metrics),
                stato_primario=c.primary_status.name,
                motivi_stato=[m.name for m in c.primary_status_reasons],
            )

        self._azioni_locali(cid, intervallo, totale, campagne)

        giornaliero = []
        if con_giornaliero:
            q = f"""
                SELECT segments.date, metrics.cost_micros, metrics.conversions
                FROM customer WHERE {intervallo.gaql()} ORDER BY segments.date
            """
            for row in self._query(cid, q):
                giornaliero.append((
                    datetime.strptime(row.segments.date, "%Y-%m-%d").date(),
                    row.metrics.cost_micros / MICRO,
                    row.metrics.conversions,
                ))
        return DatiPeriodo(totale, campagne, giornaliero)

    def _azioni_locali(self, cid: str, intervallo: Intervallo, totale: Metriche,
                       campagne: dict[str, Campagna]) -> None:
        """Azioni per categoria: indicazioni stradali, contatti, ordini e visite al negozio.

        Come la colonna "Risultati" di Google Ads: si usa la colonna Conversioni, cioè solo le azioni
        che sono obiettivi principali. Fanno eccezione le indicazioni stradali: se sono secondarie si
        leggono da "tutte le conversioni", perché servono comunque a stimare le visite.
        Le visite al negozio contate tra le Conversioni vanno poi tolte dalle azioni (vedi
        `visite_in_conversioni`), perché le azioni sono solo indicazioni, contatti e ordini.
        """
        def accumula(m: Metriche, categoria: str, conv: float, tutte: float, secondarie: dict) -> None:
            if categoria == "STORE_VISIT":
                m.visite_in_conversioni += conv
                secondarie["visite_reali"] = secondarie.get("visite_reali", 0.0) + tutte
            elif categoria in CATEGORIE:
                campo = CATEGORIE[categoria]
                setattr(m, campo, getattr(m, campo) + conv)
                secondarie[campo] = secondarie.get(campo, 0.0) + tutte

        def chiudi(m: Metriche, secondarie: dict) -> None:
            m.visite_reali = m.visite_in_conversioni or secondarie.get("visite_reali", 0.0)
            if m.indicazioni == 0:
                m.indicazioni = secondarie.get("indicazioni", 0.0)

        sec_totale: dict = {}
        q = f"""
            SELECT segments.conversion_action_category, metrics.conversions, metrics.all_conversions
            FROM customer WHERE {intervallo.gaql()}
        """
        for row in self._query(cid, q):
            accumula(totale, row.segments.conversion_action_category.name,
                     row.metrics.conversions, row.metrics.all_conversions, sec_totale)
        chiudi(totale, sec_totale)

        sec_campagne: dict = {}
        q = f"""
            SELECT campaign.id, segments.conversion_action_category, metrics.conversions,
                   metrics.all_conversions
            FROM campaign WHERE {intervallo.gaql()} AND campaign.status != 'REMOVED'
        """
        for row in self._query(cid, q):
            c = campagne.get(str(row.campaign.id))
            if c:
                accumula(c.metriche, row.segments.conversion_action_category.name,
                         row.metrics.conversions, row.metrics.all_conversions,
                         sec_campagne.setdefault(c.id, {}))
        for id_, sec in sec_campagne.items():
            chiudi(campagne[id_].metriche, sec)

    def _dettaglio(self, cid: str, periodi: Periodi) -> Dettaglio:
        """Ogni blocco è indipendente: se Google rifiuta una query si perde solo quella sezione."""
        d = Dettaglio()
        for nome, blocco in (("canali", self._canali), ("gruppi di asset", self._gruppi_asset),
                             ("orari", self._orari)):
            try:
                blocco(cid, periodi, d)
            except Exception as e:  # noqa: BLE001
                log.warning("Dettaglio '%s' non disponibile (%s)", nome, type(e).__name__)
        return d

    def _canali(self, cid: str, periodi: Periodi, d: Dettaglio) -> None:
        cor = periodi.corrente
        # Canali (Performance Max: Ricerca, Maps, YouTube...), con le visite per canale.
        canali: dict[str, Metriche] = {}
        q = f"""
            SELECT segments.ad_network_type, metrics.impressions, metrics.clicks,
                   metrics.cost_micros, metrics.conversions
            FROM campaign WHERE {cor.gaql()} AND campaign.status != 'REMOVED'
        """
        for row in self._query(cid, q):
            nome = CANALI.get(row.segments.ad_network_type.name, ALTRI_CANALI)
            m = canali.setdefault(nome, Metriche())
            m.impressioni += row.metrics.impressions
            m.clic += row.metrics.clicks
            m.costo += row.metrics.cost_micros / MICRO
            m.conversioni += row.metrics.conversions
        q = f"""
            SELECT segments.ad_network_type, segments.conversion_action_category, metrics.conversions,
                   metrics.all_conversions
            FROM campaign WHERE {cor.gaql()} AND campaign.status != 'REMOVED'
        """
        visite_tutte: dict[str, float] = {}
        for row in self._query(cid, q):
            if row.segments.conversion_action_category.name == "STORE_VISIT":
                nome = CANALI.get(row.segments.ad_network_type.name, ALTRI_CANALI)
                canali.setdefault(nome, Metriche()).visite_in_conversioni += row.metrics.conversions
                visite_tutte[nome] = visite_tutte.get(nome, 0.0) + row.metrics.all_conversions
        usa_conversioni = any(m.visite_in_conversioni for m in canali.values())
        for nome, m in canali.items():
            m.visite_reali = m.visite_in_conversioni if usa_conversioni else visite_tutte.get(nome, 0.0)
            m.conversioni -= m.visite_in_conversioni  # azioni senza le visite
        ordine = ["Rete di Ricerca", "Google Maps", ALTRI_CANALI]
        d.canali = [Canale(n, canali[n]) for n in ordine if n in canali]

    def _gruppi_asset(self, cid: str, periodi: Periodi, d: Dettaglio) -> None:
        cor, pre = periodi.corrente, periodi.precedente
        # Gruppi di asset (una lingua per gruppo), con le conversioni del mese prima.
        gruppi: dict[str, GruppoAsset] = {}
        q = f"""
            SELECT asset_group.id, asset_group.name, metrics.impressions, metrics.clicks,
                   metrics.cost_micros, metrics.conversions
            FROM asset_group WHERE {cor.gaql()} AND asset_group.status != 'REMOVED'
        """
        for row in self._query(cid, q):
            g = gruppi.setdefault(row.asset_group.name, GruppoAsset(row.asset_group.name, Metriche()))
            g.metriche.impressioni += row.metrics.impressions
            g.metriche.clic += row.metrics.clicks
            g.metriche.costo += row.metrics.cost_micros / MICRO
            g.metriche.conversioni += row.metrics.conversions
        q = f"""
            SELECT asset_group.name, metrics.conversions
            FROM asset_group WHERE {pre.gaql()} AND asset_group.status != 'REMOVED'
        """
        for row in self._query(cid, q):
            g = gruppi.get(row.asset_group.name)
            if g:
                g.conversioni_prec = (g.conversioni_prec or 0.0) + row.metrics.conversions
        # Le visite al negozio contate tra le Conversioni non sono azioni.
        for intervallo, corrente in ((cor, True), (pre, False)):
            q = f"""
                SELECT asset_group.name, segments.conversion_action_category, metrics.conversions
                FROM asset_group WHERE {intervallo.gaql()} AND asset_group.status != 'REMOVED'
            """
            for row in self._query(cid, q):
                g = gruppi.get(row.asset_group.name)
                if g and row.segments.conversion_action_category.name == "STORE_VISIT":
                    if corrente:
                        g.metriche.conversioni -= row.metrics.conversions
                    elif g.conversioni_prec is not None:
                        g.conversioni_prec -= row.metrics.conversions
        d.gruppi_asset = sorted((g for g in gruppi.values() if g.metriche.impressioni),
                                key=lambda g: -g.metriche.conversioni)

    def _orari(self, cid: str, periodi: Periodi, d: Dettaglio) -> None:
        cor, pre = periodi.corrente, periodi.precedente
        # Quando converte: per ora e per giorno della settimana (media al giorno).
        q = f"""
            SELECT segments.hour, segments.conversion_action_category, metrics.conversions
            FROM customer WHERE {cor.gaql()}
        """
        for row in self._query(cid, q):
            if row.segments.conversion_action_category.name != "STORE_VISIT":
                d.conversioni_per_ora[row.segments.hour] += row.metrics.conversions
        d.giorni_corrente = self._per_giorno(cid, cor)
        d.giorni_precedente = self._per_giorno(cid, pre)

    def _per_giorno(self, cid: str, intervallo: Intervallo) -> list[float]:
        totali = [0.0] * 7
        q = f"""
            SELECT segments.day_of_week, segments.conversion_action_category, metrics.conversions
            FROM customer WHERE {intervallo.gaql()}
        """
        for row in self._query(cid, q):
            nome = row.segments.day_of_week.name
            if nome in GIORNI and row.segments.conversion_action_category.name != "STORE_VISIT":
                totali[GIORNI.index(nome)] += row.metrics.conversions
        conteggio = [0] * 7
        for i in range(intervallo.giorni):
            conteggio[(intervallo.inizio + timedelta(days=i)).weekday()] += 1
        return [t / c if c else 0.0 for t, c in zip(totali, conteggio)]

    def visite_intervallo(self, customer_id: str, intervallo: Intervallo) -> tuple[float, float]:
        """(visite al negozio misurate, indicazioni stradali) in un intervallo qualsiasi."""
        visite = visite_tutte = ind = ind_tutte = 0.0
        q = f"""
            SELECT segments.conversion_action_category, metrics.conversions, metrics.all_conversions
            FROM customer WHERE {intervallo.gaql()}
        """
        for row in self._query(pulisci_id(customer_id), q):
            categoria = row.segments.conversion_action_category.name
            if categoria == "STORE_VISIT":
                visite += row.metrics.conversions
                visite_tutte += row.metrics.all_conversions
            elif categoria == "GET_DIRECTIONS":
                ind += row.metrics.conversions
                ind_tutte += row.metrics.all_conversions
        return visite or visite_tutte, ind or ind_tutte

    def scarica(self, customer_id: str, periodi: Periodi, dettaglio: bool = False) -> DatiAccount:
        cid = pulisci_id(customer_id)

        nome, valuta, punteggio = cid, "EUR", None
        q = "SELECT customer.descriptive_name, customer.currency_code, customer.optimization_score FROM customer"
        for row in self._query(cid, q):
            nome = row.customer.descriptive_name or cid
            valuta = row.customer.currency_code or "EUR"
            punteggio = _opzionale(row.customer, "optimization_score")

        corrente = self._periodo(cid, periodi.corrente, con_giornaliero=True)
        precedente = self._periodo(cid, periodi.precedente, con_giornaliero=False)
        anno_prec = self._periodo(cid, periodi.anno_prec, con_giornaliero=False) if periodi.anno_prec else None
        due_mesi_prima = det = None
        if dettaglio:
            if periodi.due_mesi_prima:
                due_mesi_prima = self._periodo(cid, periodi.due_mesi_prima, con_giornaliero=False)
            det = self._dettaglio(cid, periodi)

        termini = []
        q = f"""
            SELECT search_term_view.search_term, campaign.name, ad_group.name,
                   metrics.cost_micros, metrics.clicks, metrics.conversions, metrics.all_conversions
            FROM search_term_view
            WHERE {periodi.corrente.gaql()} AND metrics.cost_micros > 0
            ORDER BY metrics.cost_micros DESC
            LIMIT 300
        """
        for row in self._query(cid, q):
            termini.append(TermineRicerca(
                termine=row.search_term_view.search_term, campagna=row.campaign.name,
                gruppo=row.ad_group.name, costo=row.metrics.cost_micros / MICRO,
                clic=row.metrics.clicks, conversioni=row.metrics.conversions,
                conversioni_tutte=row.metrics.all_conversions,
            ))

        keyword = []
        q = f"""
            SELECT ad_group_criterion.keyword.text, ad_group_criterion.quality_info.quality_score,
                   campaign.name, ad_group.name, metrics.cost_micros, metrics.conversions,
                   metrics.all_conversions
            FROM keyword_view
            WHERE {periodi.corrente.gaql()} AND ad_group_criterion.status = 'ENABLED'
              AND metrics.cost_micros > 0
            ORDER BY metrics.cost_micros DESC
            LIMIT 300
        """
        for row in self._query(cid, q):
            crit = row.ad_group_criterion
            keyword.append(Keyword(
                testo=crit.keyword.text, campagna=row.campaign.name, gruppo=row.ad_group.name,
                punteggio_qualita=_opzionale(crit.quality_info, "quality_score"),
                costo=row.metrics.cost_micros / MICRO, conversioni=row.metrics.conversions,
                conversioni_tutte=row.metrics.all_conversions,
            ))

        modifiche = self._modifiche(cid, periodi, corrente.campagne)

        return DatiAccount(
            nome=nome, valuta=valuta, punteggio_ottimizzazione=punteggio,
            corrente=corrente, precedente=precedente, anno_prec=anno_prec,
            termini_ricerca=termini, keyword=keyword, modifiche=modifiche,
            due_mesi_prima=due_mesi_prima, dettaglio=det,
        )

    def _modifiche(self, cid: str, periodi: Periodi, campagne: dict[str, Campagna]) -> list[Modifica]:
        # La cronologia modifiche via API copre solo gli ultimi 30 giorni.
        da = max(periodi.corrente.inizio, periodi.oggi - timedelta(days=29))
        a = periodi.corrente.fine
        if da > a:
            return []
        q = f"""
            SELECT change_event.change_date_time, change_event.user_email,
                   change_event.change_resource_type, change_event.resource_change_operation,
                   change_event.changed_fields, change_event.campaign
            FROM change_event
            WHERE change_event.change_date_time >= '{da:%Y-%m-%d} 00:00:00'
              AND change_event.change_date_time <= '{a:%Y-%m-%d} 23:59:59'
            ORDER BY change_event.change_date_time DESC
            LIMIT 500
        """
        modifiche = []
        for row in self._query(cid, q):
            ev = row.change_event
            id_campagna = ev.campaign.rsplit("/", 1)[-1] if ev.campaign else ""
            modifiche.append(Modifica(
                quando=datetime.fromisoformat(ev.change_date_time),
                utente=ev.user_email or "sistema",
                risorsa=ev.change_resource_type.name,
                operazione=ev.resource_change_operation.name,
                campagna=campagne[id_campagna].nome if id_campagna in campagne else "",
                campi=list(ev.changed_fields.paths),
            ))
        return modifiche
