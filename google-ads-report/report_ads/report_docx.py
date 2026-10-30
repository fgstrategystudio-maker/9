"""Report Word (A4 orizzontale, antracite e oro): sintesi, cosa abbiamo fatto, un locale per sezione, attribuzione e fee, proposte.

Qui si preparano i blocchi del documento (numeri, tabelle, grafici, testi); l'impaginazione è in
docx/render.js. I testi di base sono automatici e Claude li riscrive (vedi testi_doc.py); le parti che
Google Ads non fornisce (aste, temi incrementali, profili, rilevazioni su Maps) arrivano dalla mail
dei dati del mese (posta.py) o restano segnate "da completare".
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image

from . import grafici_doc as gr
from .report_locali import _art_pct, _it, eur, num

CARTELLA_JS = Path(__file__).parent / "docx"
GIORNI_MESE = 30.4


def _pct(x, dec=0):
    return "–" if x is None else f"{_it(x * 100, dec)}%"


def _img(path: Path, width: int, cap: str = "") -> dict:
    w, h = Image.open(path).size
    return {"t": "img", "path": str(path), "w": w, "h": h, "width": width, "cap": cap}


def budget_necessario(c: dict) -> tuple[float | None, float | None, str]:
    """(budget oggi, budget necessario, perché) per una campagna, come nel report N.4."""
    oggi = c.get("budget_giornaliero")
    if not oggi:
        return None, None, ""
    qi, pb, pr = c.get("quota_impr"), c.get("persa_budget") or 0, c.get("persa_ranking") or 0
    if c.get("budget_consigliato") and c["budget_consigliato"] > oggi * 1.05:
        return oggi, c["budget_consigliato"], (f"è limitata dal budget e perde il {_pct(pb)} delle ricerche per budget; "
                                                f"{eur(c['budget_consigliato'], 0)} è il budget consigliato da Google")
    if pb >= 0.05 and qi:
        nec = round(oggi * (qi + pb) / qi)
        return oggi, nec, f"perde il {_pct(pb)} delle ricerche per budget" + (
            f" e il {_pct(pr)} perché perde l'asta" if pr >= 0.05 else "")
    if pr >= 0.1:
        return oggi, oggi, f"il budget basta, ma perde il {_pct(pr)} delle ricerche per posizione: la leva è il costo per clic"
    return oggi, oggi, "non è limitata dal budget"


def testi_base(d: dict, manuali: dict) -> dict:
    """Testi automatici: Claude li riscrive, ma il report deve stare in piedi anche senza."""
    mese, mese_prec = d["mese"], d["mese_prec"]
    t: dict = {"locali": {}}
    tot_spesa = sum(x["corrente"]["spesa"] for x in d["locali"])
    tot_brand_sp = sum(x["campagne"].get("brand", {}).get("spesa", 0) for x in d["locali"])
    tot_vis = sum(x["corrente"]["visite"] for x in d["locali"])
    tot_brand_v = sum(x["campagne"].get("brand", {}).get("visite", 0) for x in d["locali"])
    t["novita"] = d["focus"] or ""
    t["cards"] = [
        [f"Spesa e visite di {mese}", f"{eur(tot_spesa)} di spesa e {num(tot_vis)} visite in negozio sui "
                                      f"{len(d['locali'])} locali."],
        ["La difesa del nome", f"Le campagne brand hanno preso il {_pct(tot_brand_sp / tot_spesa if tot_spesa else 0)} "
                               f"della spesa e portato il {_pct(tot_brand_v / tot_vis if tot_vis else 0)} delle visite."]
        if tot_brand_sp else ["Performance Max", "Tutta la spesa è sulla Performance Max."],
        [f"{mese.capitalize()} è ancora provvisorio", "Le visite si attribuiscono fino a 30 giorni dopo il clic: i valori "
                                                       f"definitivi arriveranno a fine {d['mese_succ']} e saranno più alti."],
    ]
    t["fatto"] = [[x.split(":", 1)[0].strip(), x.split(":", 1)[1].strip() if ":" in x else ""]
                  for x in ([d["fatto"]] if d["fatto"] else [])]
    for x in d["locali"]:
        br, pm = x["campagne"].get("brand"), x["campagne"].get("pmax")
        tl: dict = {}
        if br:
            tl["takeaways"] = [
                [f"La Brand pesa il {_pct(br['spesa'] / x['corrente']['spesa'] if x['corrente']['spesa'] else 0)}",
                 f"della spesa e porta il {_pct(br['visite'] / x['corrente']['visite'] if x['corrente']['visite'] else 0)} "
                 "delle visite."],
                ["Quota sul nome", f"la campagna compare sul {_pct(br.get('quota_impr'))} delle ricerche del nome."],
                ["Acquisizione", f"la Performance Max porta {num(x['visite_fee'])} visite al netto delle ricerche del nome."],
            ]
            tl["brand"] = [
                f"La campagna brand ha preso il {_pct(br['spesa'] / x['corrente']['spesa'] if x['corrente']['spesa'] else 0)} "
                f"della spesa e portato **{num(br['visite'])} visite**, con un CTR del {_pct(br['ctr'], 1)}.",
                f"Compare sul {_pct(br.get('quota_impr'))} delle ricerche del nome. Non compare nel "
                f"{_pct(br.get('persa_budget'))} dei casi perché **il budget del giorno è già esaurito** e nel "
                f"{_pct(br.get('persa_ranking'))} perché **perde l'asta** contro un altro inserzionista."]
        else:
            tl["takeaways"] = [["Visite", f"{num(x['corrente']['visite'])} visite in negozio a {mese}."],
                               ["Costo per visita", f"{eur(x['corrente']['costo_visita'])}."],
                               ["Indicazioni stradali", f"{num(x['corrente']['indicazioni'])}."]]
            tl["brand"] = []
        tl["aste"] = ""
        tl["pmax"] = []
        if pm:
            q = x["quota_nome"]
            tl["pmax"].append(
                (f"Il {_pct(q, 1)} delle conversioni da ricerca della Performance Max è sul nome del locale; al netto, "
                 if q is not None else "")
                + f"la Performance Max ha **{num(x['visite_fee'])} visite** provvisorie"
                + (f", {eur(pm['spesa'] * (1 - (q or 0)) / x['visite_fee'])} a visita" if x["visite_fee"] else "") + ".")
        tl["temi"] = ["", ""]
        t["locali"][x["nome"]] = tl
    t["attribuzione"] = [f"Le visite di {mese_prec} crescono con la chiusura dell'attribuzione a 30 giorni."]
    t["tutto"] = ("Il fatturato attribuibile su cui si calcola la fee è solo una parte di quello che Google Ads porta "
                  "nei locali: qui ci sono tutte le visite misurate, comprese quelle delle ricerche del nome.")
    t["proposte"] = {}
    for x in d["locali"]:
        prop = {}
        for chiave, c in (("brand", x["campagne"].get("brand")), ("pmax", x["campagne"].get("pmax"))):
            if not c:
                prop[chiave] = "–"
                continue
            oggi, nec, _ = budget_necessario(c)
            prop[chiave] = (f"Budget {eur(oggi, 0)} → {eur(nec, 0)}" if oggi and nec and nec > oggi * 1.05
                            else "Invariata")
        t["proposte"][x["nome"]] = prop
    t["chiusura"] = [f"A fine {d['mese_succ']} rileggiamo le visite di {mese} consolidate."] + list(d["prossimi_passi"])
    return t


def blocchi_word(d: dict, t: dict, manuali: dict, cartella: Path) -> dict:
    cartella.mkdir(parents=True, exist_ok=True)
    loc = d["locali"]
    mese, mese_prec, anno = d["mese"], d["mese_prec"], d["anno"]
    comp = d["compenso"] or {}
    perc = comp.get("percentuale") or 0.01
    ha_brand = any("brand" in x["campagne"] for x in loc)
    B: list[dict] = []
    nomi = [x["breve"] for x in loc]

    # --- copertina
    B.append({"t": "cover", "occhiello": f"{d['cliente'].upper()}   ·   REPORT N.{d['numero']}" if d["numero"]
              else d["cliente"].upper(),
              "titolo": "Report Google Ads", "sottotitolo": f"{mese.capitalize()} {anno}",
              "locali": "   ·   ".join(x["breve"] for x in loc),
              "righe": [f"Periodo: {d['inizio'].day}-{d['fine'].day} {mese} {anno}. "
                        f"{mese_prec.capitalize()} a dati consolidati, {mese} provvisorio."]
              + ([f"Novità del mese: {t['novita']}"] if t.get("novita") else [])})

    # --- 1 sintesi
    n = 1
    B.append({"t": "h1", "n": n, "titolo": "Sintesi del mese"})
    righe = []
    for x in loc:
        br = x["campagne"].get("brand", {})
        righe.append([x["nome"], eur(x["corrente"]["spesa"]), num(x["corrente"]["conversioni"]),
                      num(x["corrente"]["visite"]), num(br.get("visite", 0)) if ha_brand else ""])
    tot = lambda k: sum(x["corrente"][k] for x in loc)  # noqa: E731
    righe.append(["Totale", eur(tot("spesa")), num(tot("conversioni")), num(tot("visite")),
                  num(sum(x["campagne"].get("brand", {}).get("visite", 0) for x in loc)) if ha_brand else ""])
    B.append({"t": "table", "head": ["Locale", "Spesa", "Conversioni", "Visite in negozio", "di cui Brand" if ha_brand else ""],
              "rows": righe, "widths": [2626, 1600, 1600, 1600, 1600], "total": True})
    pm_v = [x["corrente"]["visite"] - x["campagne"].get("brand", {}).get("visite", 0) for x in loc]
    br_v = [x["campagne"].get("brand", {}).get("visite", 0) for x in loc]
    g1 = gr.visite_impilate(cartella, nomi, pm_v, br_v, mese)
    if ha_brand:
        g2 = gr.ripartizione_spesa(cartella, nomi, [x["campagne"].get("pmax", {}).get("spesa", 0) for x in loc],
                                   [x["campagne"].get("brand", {}).get("spesa", 0) for x in loc])
        B.append({"t": "cols", "items": [[_img(g1, 400)], [_img(g2, 400)]]})
    else:
        B.append(_img(g1, 520))
    B.append({"t": "cards", "items": t["cards"]})
    B.append({"t": "pb"})

    # --- 2 cosa abbiamo fatto
    n += 1
    B.append({"t": "h1", "n": n, "titolo": f"Cosa abbiamo fatto a {mese}"})
    if t["fatto"]:
        B.append({"t": "num", "items": [f"**{a}.** {b}" if b else a for a, b in t["fatto"]]})
    else:
        B.append({"t": "box", "s": "**Da completare.** Scrivi le attività del mese in NOTE_MESE (fatto) o nella mail dei dati."})
    for s in d["sezioni"]:
        B.append({"t": "h2", "s": s["titolo"]})
        for par in [y.strip() for y in s["testo"].split("\n") if y.strip()]:
            B.append({"t": "p", "s": par})
    B.append({"t": "pb"})

    # --- 3 perché la brand
    if ha_brand:
        n += 1
        B.append({"t": "h1", "n": n, "titolo": "Perché una parte del budget va alla difesa del nome"})
        B += [{"t": "p", "s": "**Chi cerca il nome del locale è il cliente più vicino alla visita.** Sa già dove vuole andare. "
                              "Se sopra il nostro annuncio compare TheFork o un altro ristorante, rischiamo di perderlo proprio all'ultimo passaggio."},
              {"t": "p", "s": "**Con una campagna dedicata** le ricerche del nome sono presidiate in cima alla pagina con un costo per "
                              "clic che governiamo noi, e si misurano a parte."},
              {"t": "p", "s": "**La Performance Max continua a lavorare anche sul nome,** perché su Google Maps resta lo strumento che "
                              "difende i locali. Le due campagne si completano: quando la campagna brand esaurisce il budget, la "
                              "Performance Max copre le ricerche rimaste."}]
        if comp.get("escludi"):
            B.append({"t": "box", "s": "**Brand fuori dalla fee.** Il fatturato attribuibile su cui si calcola la fee esclude le visite che "
                                       "arrivano da ricerche del nome: quelle della campagna brand"
                                       + (" e la quota di ricerche sul nome passate dalla Performance Max (calcolata dai termini di ricerca)"
                                          if comp.get("escludi_nome") else "")
                                       + ". La fee si calcola così solo sui clienti portati dall'acquisizione."})
        B.append({"t": "h2", "s": "Come leggere i dati delle campagne brand"})
        B.append({"t": "table", "head": ["Indicatore", "Cosa significa"], "widths": [2700, 6326], "rows": [
            ["Quota impressioni", "Su 100 ricerche del nome del locale, in quante compare il nostro annuncio."],
            ["Persa per budget", "Ricerche in cui non compariamo perché il budget del giorno è già stato speso. Si recupera aumentando il budget."],
            ["Persa per posizione (ranking)", "Ricerche in cui non compariamo perché nell'asta vince un altro inserzionista: Google confronta "
                                              "l'offerta massima e la qualità degli annunci. Si recupera alzando il costo per clic massimo."],
            ["In cima alla pagina", "Quando compariamo, quante volte siamo sopra i risultati non sponsorizzati."],
            ["Primo posto", "Quando compariamo, quante volte siamo il primo annuncio in assoluto."],
            ["Ci supera", "Quante volte, sulla stessa ricerca, un concorrente compare sopra di noi."]]})
        B.append({"t": "pb"})

    # --- un locale per sezione
    for i, x in enumerate(loc):
        n += 1
        tl = t["locali"][x["nome"]]
        cor, br, pm = x["corrente"], x["campagne"].get("brand"), x["campagne"].get("pmax")
        chiave = f"l{i + 1}"
        B.append({"t": "h1", "n": n, "titolo": x["nome"]})
        provv = " (provvisorio)" if d["mese_chiuso"] else ""
        B.append({"t": "kpis", "items": [[eur(cor["spesa"]), "Spesa"], [num(cor["conversioni"]), "Conversioni"],
                                         [num(cor["visite"]), "Visite stimate" if x["stimate"] else "Visite in negozio"],
                                         [eur(cor["costo_visita"]), "Costo per visita" + provv]]})
        if br:
            g = gr.ciambelle(cartella, chiave, x["breve"], (pm["spesa"] if pm else 0, br["spesa"]),
                             (pm["visite"] if pm else 0, br["visite"]))
            B.append({"t": "cols", "ratio": [0.38, 0.62], "vcenter": True,
                      "items": [[_img(g, 380)], [{"t": "takeaways", "items": tl["takeaways"]}]]})
            righe = []
            for et, k, f in (("Spesa", "spesa", eur), ("Quota della spesa", None, None), ("Clic", "clic", num),
                             ("CTR", "ctr", lambda v: _pct(v, 1)), ("Conversioni", "conversioni", num),
                             ("Visite in negozio", "visite", num), ("Costo per visita", "costo_visita", eur)):
                if k is None:
                    sp_tot = cor["spesa"] or 1
                    righe.append([et, _pct((pm or {}).get("spesa", 0) / sp_tot), _pct(br["spesa"] / sp_tot), ""])
                else:
                    righe.append([et, f((pm or {}).get(k)) if pm else "–", f(br.get(k)), f(cor.get(k))])
            B.append({"t": "table", "head": ["", "Performance Max", "Brand", "Totale"], "rows": righe,
                      "widths": [3226, 1900, 1900, 2000], "boldFirst": True})
            B.append({"t": "h2", "s": "La campagna Brand"})
            B += [{"t": "p", "s": s} for s in tl["brand"]]
            if x["termini_brand"]:
                B.append({"t": "note", "s": "Ricerche più frequenti sul nome: " + ", ".join(
                    f'"{a}" ({num(b)} clic)' for a, b in x["termini_brand"][:4]) + "."})
            B.append({"t": "h2", "s": "Chi c'è sul nome del locale"})
            aste = (manuali.get(x["nome"]) or {}).get("aste")
            if aste:
                B.append({"t": "table", "head": ["", "Quota impressioni", "In cima alla pagina", "Primo posto", "Ci supera"],
                          "rows": aste, "widths": [2626, 1600, 1600, 1600, 1600], "boldFirst": True})
            else:
                B.append({"t": "table", "head": ["", "Quota impressioni", "In cima alla pagina", "Primo posto", "Ci supera"],
                          "rows": [[f"{x['breve']} (noi)", _pct(br.get("quota_impr"), 1), _pct(br.get("in_cima"), 1),
                                    _pct(br.get("primo_posto"), 1), ""]],
                          "widths": [2626, 1600, 1600, 1600, 1600], "boldFirst": True})
                B.append({"t": "note", "s": "Da completare: per i concorrenti sul nome serve l'export Informazioni aste "
                                            "della campagna Brand (mail dei dati del mese)."})
            if tl.get("aste"):
                B.append({"t": "p", "s": tl["aste"]})
            sezione_budget = []
            for nome_c, c in (("Brand", br), ("Performance Max", pm)):
                if c:
                    oggi, nec, perche = budget_necessario(c)
                    if oggi:
                        sezione_budget.append([nome_c, f"{eur(oggi, 0)} al giorno", f"{eur(nec, 0)} al giorno", perche])
            if sezione_budget:
                B.append({"t": "h2", "s": "Budget necessario per coprire bene le ricerche"})
                B.append({"t": "table", "head": ["Campagna", "Budget oggi", "Budget necessario", "Perché"],
                          "rows": sezione_budget, "widths": [1800, 1500, 1700, 5000]})
        else:
            B.append({"t": "takeaways", "items": tl["takeaways"]})
        B.append({"t": "h2", "s": "Performance Max"})
        B += [{"t": "p", "s": s} for s in tl["pmax"]]
        g = gr.orari(cartella, chiave, x["breve"], x["ore"])
        if g:
            B.append(_img(g, 500))
        B.append({"t": "pb"})

    # --- temi di ricerca (dati dalla mail)
    temi = {x["nome"]: (manuali.get(x["nome"]) or {}).get("temi") for x in loc}
    n += 1
    B.append({"t": "h1", "n": n, "titolo": "Temi di ricerca: prima e dopo"})
    if any(temi.values()):
        prima = sum(sum(v["prima"]) for v in temi.values() if v)
        dopo = sum(sum(v["dopo"]) for v in temi.values() if v)
        B.append({"t": "p", "s": "I temi di ricerca indicano alla Performance Max quali ricerche intercettare. Google segnala con "
                                 "un'icona verde i temi che portano traffico nuovo, cioè persone che la campagna non avrebbe "
                                 "raggiunto solo con il sito e gli annunci."})
        B.append({"t": "kpis", "items": [[num(prima), "Temi incrementali a inizio mese"],
                                         [num(dopo), "Temi incrementali a fine mese"],
                                         [f"{'+' if dopo >= prima else '−'}{_it(abs(dopo / prima - 1) * 100, 0)}%" if prima else "–",
                                          "Crescita sul gruppo"]]})
        for i, x in enumerate(loc):
            v = temi[x["nome"]]
            if not v:
                continue
            g = gr.temi(cartella, f"l{i + 1}", x["breve"], v["lingue"], v["prima"], v["dopo"])
            testo = t["locali"][x["nome"]].get("temi") or ["", ""]
            B.append({"t": "h2", "s": x["nome"]})
            B.append({"t": "cols", "ratio": [0.45, 0.55], "items": [[_img(g, 430)],
                      [{"t": "p", "s": s} for s in testo if s]]})
    else:
        B.append({"t": "box", "s": "**Da completare.** I temi incrementali non sono disponibili tramite Google Ads API: "
                                   "mandali nella mail dei dati del mese (es. \"temi italiano: 29 > 37\" sotto il nome del locale)."})
    B.append({"t": "pb"})

    # --- concorrenza e profili (dalla mail)
    for titolo, chiave_m in (("Concorrenza su Google Maps", "concorrenza"), ("Profili Google e siti", "profilo")):
        n += 1
        B.append({"t": "h1", "n": n, "titolo": titolo})
        presenti = False
        for x in loc:
            m = manuali.get(x["nome"]) or {}
            testo, immagini = m.get(chiave_m), m.get(f"immagini_{chiave_m}", [])
            if not testo and not immagini:
                continue
            presenti = True
            B.append({"t": "h2", "s": x["nome"]})
            parti = [{"t": "p", "s": s} for s in (testo or "").split("\n") if s.strip()]
            if immagini:
                B.append({"t": "cols", "ratio": [0.42, 0.58], "items": [[_img(Path(f), 400, cap) for f, cap in immagini[:2]], parti]})
            else:
                B += parti
        if not presenti:
            B.append({"t": "box", "s": f"**Da completare.** {titolo}: rilevazioni e screenshot non sono disponibili tramite "
                                       "Google Ads API. Mandali nella mail dei dati del mese, con il nome del locale nel testo."})
        B.append({"t": "pb"})

    # --- attribuzione e fee
    n += 1
    B.append({"t": "h1", "n": n, "titolo": "Attribuzione e fee"})
    scontrini = ", ".join(f"{x['breve']} {eur(x['scontrino'])}" for x in loc if x["scontrino"])
    B.append({"t": "p", "s": f"Fatturato attribuibile = visite in negozio × {_it(loc[0]['coperti'] or 2.5, 1)} coperti × "
                             f"scontrino medio ({scontrini}). La fee è {_art_pct(perc)}{_it(perc * 100, 0)}%. Le visite si "
                             "attribuiscono fino a 30 giorni dopo il clic, quindi ogni mese si fattura il mese precedente a "
                             "dati consolidati."})
    B.append({"t": "h2", "s": f"{mese_prec.capitalize()}: dati consolidati e confronto con il report precedente"})
    prima = [x["visite_comunicate_prec"] or 0 for x in loc]
    ora = [x["precedente"]["visite"] for x in loc]
    if any(prima):
        B.append(_img(gr.consolidamento(cartella, nomi, prima, ora, mese_prec), 620))
    righe, tot_attr, tot_fee = [], 0.0, 0.0
    for x in loc:
        attr = x["visite_fee_prec"] * (x["coperti"] or 0) * (x["scontrino"] or 0)
        fee = attr * perc
        tot_attr, tot_fee = tot_attr + attr, tot_fee + fee
        righe.append([x["nome"], num(x["visite_comunicate_prec"]) if x["visite_comunicate_prec"] else "–",
                      num(x["precedente"]["visite"]) + (" stimate" if x["stimate"] else ""),
                      num(x["visite_fee_prec"]), eur(attr), eur(fee)])
    righe.append(["Totale", "", "", "", eur(tot_attr), eur(tot_fee)])
    B.append({"t": "table", "head": ["Locale", "Visite (prima)", "Visite (ora)", "Visite per la fee", "Attribuibile",
                                     f"Fee {_it(perc * 100, 0)}%"], "rows": righe, "total": True,
              "widths": [2400, 1400, 1400, 1400, 1700, 1400]})
    B.append({"t": "bul", "items": t["attribuzione"]})
    if d["mese_chiuso"]:
        B.append({"t": "h2", "s": f"{mese.capitalize()}: dati provvisori, senza le ricerche del nome"})
        righe, tv = [], [0.0, 0.0, 0.0, 0.0]
        tot_attr = 0.0
        for x in loc:
            pmv = x["corrente"]["visite"] - x["escluse_brand"]
            attr = x["visite_fee"] * (x["coperti"] or 0) * (x["scontrino"] or 0)
            tot_attr += attr
            q = x["quota_nome"]
            righe.append([x["nome"], num(pmv), f"{num(x['escluse_nome'])}" + (f" ({_pct(q, 1)})" if q is not None else ""),
                          num(x["visite_fee"]), eur(attr)])
            for k, v in enumerate((pmv, x["escluse_nome"], x["visite_fee"], x["escluse_brand"])):
                tv[k] += v
        righe.append(["Totale", num(tv[0]), num(tv[1]), num(tv[2]), eur(tot_attr)])
        B.append({"t": "table", "head": ["Locale", "Visite PMax", "Escluse (nome)", "Visite fee", "Attribuibile"],
                  "rows": righe, "total": True, "widths": [2626, 1600, 1600, 1600, 1600]})
        B.append({"t": "p", "s": (f"Le visite della campagna brand ({num(tv[3])}) sono escluse per intero. " if tv[3] else "")
                  + f"La fee di {mese} provvisoria sarebbe di **{eur(tot_attr * perc)}**; quella definitiva si calcola "
                    f"a fine {d['mese_succ']} sui dati consolidati."})
        if any(x["quota_nome"] is None for x in loc) and comp.get("escludi_nome"):
            B.append({"t": "note", "s": "Da verificare: per alcuni locali la quota di ricerche sul nome nella Performance Max non "
                                        "è disponibile da Google Ads API; il calcolo la considera zero."})
        # tutto quello che genera Google Ads
        B.append({"t": "h2", "s": f"{mese.capitalize()}: tutto quello che genera Google Ads"})
        righe, fg, fn, fa = [], 0.0, 0.0, 0.0
        for x in loc:
            k = (x["coperti"] or 0) * (x["scontrino"] or 0)
            gen, attr = x["corrente"]["visite"] * k, x["visite_fee"] * k
            fg, fa = fg + gen, fa + attr
            fn += gen - attr
            righe.append([x["nome"], num(x["corrente"]["visite"]), eur(gen), eur(gen - attr), eur(attr)])
        righe.append(["Totale", num(tot("visite")), eur(fg), eur(fn), eur(fa)])
        spesa = tot("spesa")
        B.append({"t": "kpis", "items": [[eur(fg), "Fatturato generato da Google Ads"], [eur(spesa), "Spesa pubblicitaria"],
                                         [f"{_it(fg / spesa, 1)} volte" if spesa else "–", "Fatturato per euro investito"],
                                         [_pct(fa / fg if fg else 0), "Quota su cui si calcola la fee"]]})
        B.append({"t": "table", "head": ["Locale", "Visite totali", "Fatturato generato", "di cui ricerche del nome",
                                         "Attribuibile per la fee"], "rows": righe, "total": True,
                  "widths": [2626, 1600, 1600, 1600, 1600]})
        B.append({"t": "p", "s": t["tutto"]})
    B.append({"t": "pb"})

    # --- proposte
    n += 1
    B.append({"t": "h1", "n": n, "titolo": f"Proposte per {d['mese_succ']}"})
    B.append({"t": "table", "head": ["Locale", "Campagna brand", "Performance Max"],
              "rows": [[x["breve"], t["proposte"].get(x["nome"], {}).get("brand", "–"),
                        t["proposte"].get(x["nome"], {}).get("pmax", "–")] for x in loc],
              "widths": [2400, 3313, 3313]})
    righe, tot_o, tot_n = [], 0.0, 0.0
    for x in loc:
        br, pm = x["campagne"].get("brand", {}), x["campagne"].get("pmax", {})
        bo, bn, _ = budget_necessario(br) if br else (None, None, "")
        po, pn, _ = budget_necessario(pm) if pm else (None, None, "")
        oggi = ((bo or 0) + (po or 0)) * GIORNI_MESE
        nec = ((bn or 0) + (pn or 0)) * GIORNI_MESE
        tot_o, tot_n = tot_o + oggi, tot_n + nec
        righe.append([x["breve"], f"{eur(bo, 0)} → {eur(bn, 0)}" if bo else "–", f"{eur(po, 0)} → {eur(pn, 0)}" if po else "–",
                      eur(round(oggi, -1), 0), eur(round(nec, -1), 0)])
    righe.append(["Totale", "", "", eur(round(tot_o, -1), 0), eur(round(tot_n, -1), 0)])
    B.append({"t": "h2", "s": "Budget necessario per coprire bene le ricerche"})
    B.append({"t": "table", "head": ["Locale", "Brand al giorno", "Performance Max al giorno", "Totale al mese oggi",
                                     "Totale al mese necessario"], "rows": righe, "total": True,
              "widths": [2200, 1700, 2000, 1800, 1800]})
    B += [{"t": "p", "s": s} for s in t["chiusura"]]

    return {"blocchi": B, "titolo": f"{d['cliente']}, Report Google Ads {mese} {anno}",
            "testata_oro": d["cliente"].upper(), "testata": f"Report Google Ads · {mese.capitalize()} {anno}",
            "piede": f"{d['cliente']} · Report {mese} {anno}", "autore": ""}


def scrivi_docx(spec: dict, percorso: Path) -> Path:
    file_spec = percorso.with_suffix(".json")
    file_spec.write_text(json.dumps(spec, ensure_ascii=False), encoding="utf-8")
    subprocess.run(["node", str(CARTELLA_JS / "render.js"), str(file_spec), str(percorso)], check=True,
                   capture_output=True, timeout=180)
    file_spec.unlink()
    return percorso
