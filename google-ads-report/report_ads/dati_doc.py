"""Numeri dei report Word e PowerPoint, calcolati una volta sola.

Regole di calcolo:
- visite: reali se Google le misura, altrimenti 27% delle indicazioni stradali;
- campagne: Performance Max e Search brand separate, più il totale del locale;
- fee: visite × coperti × scontrino × percentuale; dalle visite si tolgono la campagna brand (per intero)
  e, se richiesto, la quota di conversioni Performance Max arrivate da ricerche del nome del locale;
- il mese fatturato è quello indicato dal compenso (mese precedente a dati consolidati, o mese chiuso).
"""

from __future__ import annotations

from .analisi import Analisi
from .config import Gruppo
from .modello import Campagna, DatiPeriodo, Metriche
from .periodi import MESI
from .report_locali import azioni

GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]


def _tipo(c: Campagna, gruppo: Gruppo) -> str:
    escluse = {t.upper() for t in (gruppo.compenso.escludi if gruppo.compenso else [])}
    if c.tipo == "PERFORMANCE_MAX":
        return "pmax"
    if c.tipo == "SEARCH" and ("brand" in c.nome.lower() or "SEARCH" in escluse):
        return "brand"
    return "altro"


def _metriche(m: Metriche) -> dict:
    conv = m.conversioni_google if m.conversioni_google is not None else m.conversioni
    return {
        "spesa": m.costo, "impressioni": m.impressioni, "clic": m.clic,
        "ctr": m.clic / m.impressioni if m.impressioni else None,
        "conversioni": conv, "azioni": azioni(m), "indicazioni": m.indicazioni, "contatti": m.contatti,
        "ordini": m.ordini, "visite": m.conversioni,
        "costo_visita": m.costo / m.conversioni if m.conversioni else None,
        "costo_conversione": m.costo / conv if conv else None,
        "costo_indicazione": m.costo / m.indicazioni if m.indicazioni else None,
    }


def _campagne(periodo: DatiPeriodo, gruppo: Gruppo, extra: dict | None) -> dict:
    """{"pmax": {...}, "brand": {...}, "altro": {...}} sommando le campagne dello stesso tipo."""
    gruppi: dict[str, list[Campagna]] = {}
    for c in periodo.campagne.values():
        if c.metriche.costo > 0 or c.metriche.impressioni > 0:
            gruppi.setdefault(_tipo(c, gruppo), []).append(c)
    risultato = {}
    for tipo, lista in gruppi.items():
        m = Metriche()
        for c in lista:
            for campo in ("costo", "impressioni", "clic", "indicazioni", "contatti", "ordini", "conversioni",
                          "visite_in_conversioni"):
                setattr(m, campo, getattr(m, campo) + getattr(c.metriche, campo))
            m.conversioni_google = (m.conversioni_google or 0) + (c.metriche.conversioni_google or 0)
        voce = _metriche(m)
        principale = max(lista, key=lambda c: c.metriche.costo)
        pos = (extra or {}).get("campagne", {}).get(principale.id, {})
        voce.update({
            "nomi": [c.nome for c in lista],
            "budget_giornaliero": sum(c.budget_giornaliero or 0 for c in lista) or None,
            "budget_consigliato": pos.get("budget_consigliato"),
            "quota_impr": pos.get("quota_impr", principale.metriche.quota_impr),
            "persa_budget": pos.get("persa_budget", principale.metriche.persa_budget),
            "persa_ranking": pos.get("persa_ranking", principale.metriche.persa_ranking),
            "in_cima": pos.get("in_cima"), "primo_posto": pos.get("primo_posto"), "cpc_medio": pos.get("cpc_medio"),
            "limitata_budget": any("BUDGET_CONSTRAINED" in c.motivi_stato for c in lista),
            "apprendimento": any(c.stato_primario == "LEARNING" or "BIDDING_STRATEGY_LEARNING" in c.motivi_stato
                                 for c in lista),
        })
        risultato[tipo] = voce
    return risultato


def _quota(extra: dict | None, chiave: str) -> float | None:
    q = (extra or {}).get("quota_nome", {}).get(chiave)
    return q["quota"] if q else None


def dati_locale(a: Analisi, gruppo: Gruppo) -> dict:
    c, d, per = a.cliente, a.dati, a.periodi
    comp = gruppo.compenso
    cor, pre = _metriche(d.corrente.totale), _metriche(d.precedente.totale)
    camp, camp_p = _campagne(d.corrente, gruppo, d.extra), _campagne(d.precedente, gruppo, None)
    giorni_attivi = sum(1 for _, costo, _ in d.corrente.giornaliero if costo > 0) or per.corrente.giorni
    det = d.dettaglio

    def visite_fee(campagne: dict, totale: dict, quota: float | None, mese: str) -> tuple[float, float, float]:
        """(visite per la fee, escluse brand, escluse nome in Performance Max)."""
        if comp and comp.escludi_dal and mese < comp.escludi_dal:
            return round(totale["visite"]), 0.0, 0.0
        brand = campagne.get("brand", {}).get("visite", 0.0) if comp and comp.escludi else 0.0
        pmax = totale["visite"] - brand
        nome = round(pmax * quota) if comp and comp.escludi_nome and quota else 0.0
        return max(round(pmax - nome), 0.0), brand, nome

    q_cor, q_pre = _quota(d.extra, "corrente"), _quota(d.extra, "precedente")
    fee_cor = visite_fee(camp, cor, q_cor, f"{per.corrente.inizio:%Y-%m}")
    fee_pre = visite_fee(camp_p, pre, q_pre, f"{per.precedente.inizio:%Y-%m}")
    comunicate = c.visite_comunicate.get(f"{per.precedente.inizio:%Y-%m}")
    ore = list(det.conversioni_per_ora) if det else [0.0] * 24
    lingue = []
    if det:
        for g in det.gruppi_asset:
            gm = g.metriche
            lingue.append({"nome": g.nome, "conversioni": gm.conversioni, "conversioni_prec": g.conversioni_prec,
                           "clic": gm.clic, "impressioni": gm.impressioni, "spesa": gm.costo,
                           "ctr": gm.ctr, "tasso": gm.conversioni / gm.clic if gm.clic else None,
                           "cpa": gm.costo / gm.conversioni if gm.conversioni else None})

    def canali(lista):
        return [{"nome": x.nome, "spesa": x.metriche.costo, "impressioni": x.metriche.impressioni,
                 "clic": x.metriche.clic, "indicazioni": x.metriche.indicazioni,
                 "visite": x.metriche.visite_reali if not d.visite_stimate
                 else x.metriche.indicazioni * c.quota_visite_indicazioni} for x in lista]

    termini_brand = sorted(((t.termine, t.clic) for t in d.termini_ricerca
                            if any(t.campagna == n for n in camp.get("brand", {}).get("nomi", []))),
                           key=lambda x: -x[1])[:6]
    return {
        "nome": c.nome, "breve": c.nome_breve or c.nome, "descrizione": c.descrizione,
        "stimate": d.visite_stimate, "quota_stima": c.quota_visite_indicazioni,
        "coperti": c.coperti_per_visita, "scontrino": c.scontrino_medio,
        "corrente": cor, "precedente": pre, "campagne": camp, "campagne_prec": camp_p,
        "giorni_attivi": giorni_attivi, "giorni_mese": per.corrente.giorni, "giorni_prec": per.precedente.giorni,
        "quota_nome": q_cor, "quota_nome_prec": q_pre,
        "quota_nome_esempi": ((d.extra or {}).get("quota_nome", {}).get("corrente") or {}).get("esempi", []),
        "visite_fee": fee_cor[0], "escluse_brand": fee_cor[1], "escluse_nome": fee_cor[2],
        "visite_fee_prec": fee_pre[0], "escluse_brand_prec": fee_pre[1], "escluse_nome_prec": fee_pre[2],
        "visite_comunicate_prec": comunicate,
        "ore": ore,
        "giorni_conv": list(det.conversioni_giorno_totale) if det else [0.0] * 7,
        "giorni_spesa": list(det.spesa_per_giorno) if det else [0.0] * 7,
        "canali": canali(det.canali) if det else [], "canali_prec": canali(det.canali_precedente) if det else [],
        "lingue": lingue, "termini_brand": termini_brand,
        "storico": [{"mese": f"{s.mese:%Y-%m}", "giorni": s.giorni, **_metriche(s.metriche)}
                    for s in d.storico if s.metriche.costo > 0],
        "errori_extra": (d.extra or {}).get("errori", []),
    }


def dati_report(gruppo: Gruppo, analisi: list[Analisi], numero: int | None) -> dict:
    per = analisi[0].periodi
    locali = [dati_locale(a, gruppo) for a in analisi]
    mese, mese_prec = MESI[per.corrente.inizio.month - 1], MESI[per.precedente.inizio.month - 1]
    comp = gruppo.compenso
    return {
        "cliente": gruppo.nome, "numero": numero, "mese": mese, "anno": per.corrente.inizio.year,
        "mese_prec": mese_prec, "mese_succ": MESI[per.corrente.fine.month % 12],
        "periodo": per.corrente.etichetta(), "inizio": per.corrente.inizio, "fine": per.corrente.fine,
        "mese_chiuso": per.mese_chiuso,
        "compenso": None if not comp else {
            "tipo": comp.tipo, "percentuale": comp.percentuale, "base": comp.base, "importo": comp.importo,
            "margine": comp.margine, "escludi": list(comp.escludi), "escludi_nome": comp.escludi_nome},
        "locali": locali,
        "fatto": gruppo.fatto, "prossimi_passi": list(gruppo.prossimi_passi), "focus": gruppo.focus,
        "sezioni": list(gruppo.sezioni),
    }
