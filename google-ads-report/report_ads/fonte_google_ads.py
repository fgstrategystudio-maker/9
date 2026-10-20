"""Lettura dei dati dalla Google Ads API (libreria ufficiale `google-ads`).

Le credenziali arrivano da variabili d'ambiente (in GitHub Actions dai
Secrets): nessuna chiave sta nel codice o nel repository.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from .modello import (
    Campagna, DatiAccount, DatiPeriodo, Keyword, Metriche, Modifica, TermineRicerca,
)
from .periodi import Intervallo, Periodi

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
        """Indicazioni stradali e visite al negozio, da "tutte le conversioni"
        (spesso sono azioni secondarie, escluse dalla colonna Conversioni)."""
        campi = {"GET_DIRECTIONS": "indicazioni", "STORE_VISIT": "visite_reali"}
        q = f"""
            SELECT segments.conversion_action_category, metrics.all_conversions
            FROM customer WHERE {intervallo.gaql()}
        """
        for row in self._query(cid, q):
            campo = campi.get(row.segments.conversion_action_category.name)
            if campo:
                setattr(totale, campo, getattr(totale, campo) + row.metrics.all_conversions)
        q = f"""
            SELECT campaign.id, segments.conversion_action_category, metrics.all_conversions
            FROM campaign WHERE {intervallo.gaql()} AND campaign.status != 'REMOVED'
        """
        for row in self._query(cid, q):
            campo = campi.get(row.segments.conversion_action_category.name)
            c = campagne.get(str(row.campaign.id))
            if campo and c:
                setattr(c.metriche, campo, getattr(c.metriche, campo) + row.metrics.all_conversions)

    def scarica(self, customer_id: str, periodi: Periodi) -> DatiAccount:
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
