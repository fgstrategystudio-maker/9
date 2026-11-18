// Calcoli della Dashboard, condivisi dalle due versioni (attuale e nuova):
// funzioni pure, nessuno stato React. calcolaDashboard ritorna tutti i valori
// derivati da commesse e setup; calcolaNote le frasi di "Da sapere".
import {
  daysUntil, getStatoColor, calcNetto, getCommessaLordoMensile, getMeseCorrente,
  getLordoPerMese, sumLordoAnno, stessoMese, chiaveMese, statPagamentiCommessa,
  oreCommessaMese, orarioRealeCommessa, mesiRimanenti, valoreResiduo, calcPatrimonio,
  dataBreve, pipelineCommessa, lordoPipelineMesi, creaPianoF24, serieOrarioClienti,
  importoCompetenzaMese, variabileSuggerito,
} from "../../utils/helpers";

export const MESI_IT = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre",
];
export const MESI_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
export const STATO_ORDER = ["In corso","In scadenza","Da chiarire","Sospeso","Concluso","Perso"];

const nf = new Intl.NumberFormat("it-IT");
export const fmtN = (n) => nf.format(Math.round(n ?? 0));

export function calcolaDashboard(commesse, setup, now = new Date()) {
  const anno = now.getFullYear();
  const meseIdx = now.getMonth();

  const attive = commesse.filter(
    (c) => c.stato === "In corso" || c.stato === "In scadenza"
  );
  const hasSplit = commesse.some((c) => c.splitMezzoMese);

  const lordoMensileAttivo = getLordoPerMese(meseIdx, anno, commesse);
  const nettoMensileAttivo = calcNetto(lordoMensileAttivo, setup.fattoreNetto);

  const statoCount = STATO_ORDER.map((s) => ({
    name: s,
    value: commesse.filter((c) => c.stato === s).length,
    color: getStatoColor(s),
  })).filter((s) => s.value > 0);
  const statoTotal = statoCount.reduce((s, e) => s + e.value, 0);


  // Commesse attive con scadenza entro la finestra: in arrivo (giorni > 0) e
  // scadute (giorni <= 0, oggi o passate). Le scadute NON spariscono da sole:
  // restano finche non confermi tu la chiusura.
  const conScadenza = commesse
    .filter((c) => {
      if (c.stato !== "In corso" && c.stato !== "In scadenza") return false;
      if (!c.fine) return false;
      const days = daysUntil(c.fine);
      return days !== null && days <= setup.alertScadenzaGiorni;
    })
    .sort((a, b) => daysUntil(a.fine) - daysUntil(b.fine));
  const scadute = conScadenza.filter((c) => daysUntil(c.fine) <= 0);
  const inScadenza = conScadenza.filter((c) => daysUntil(c.fine) > 0);


  // — Tempo e guadagno orario —
  const oreDisponibili = setup.oreMeseDisponibili ?? 160;
  const righeTempo = attive
    .map((c) => {
      const ore = oreCommessaMese(c, meseIdx, anno) || Number(c.oreMensili) || 0;
      const lordo = getCommessaLordoMensile(c) || 0;
      const reale = orarioRealeCommessa(c);
      return {
        c, ore, lordo,
        variabile: Number(c.variabileMensile) || 0,
        suggerito: c.variabileMensile ? null : variabileSuggerito(c),
        lordoOra: ore > 0 && lordo ? Math.round(lordo / ore) : null,
        nettoOra: ore > 0 && lordo ? Math.round((lordo * setup.fattoreNetto) / ore) : null,
        realeOra: reale ? reale.lordoOra : null,
        realeMesi: reale ? reale.mesi : 0,
        mesi: mesiRimanenti(c),
        residuo: valoreResiduo(c),
      };
    })
    .sort((a, b) => (b.lordoOra ?? -1) - (a.lordoOra ?? -1));
  const oreTotali = righeTempo.reduce((s, r) => s + r.ore, 0);
  const oreLibere = Math.max(0, oreDisponibili - oreTotali);
  const saturazione = oreDisponibili > 0 ? Math.round((oreTotali / oreDisponibili) * 100) : 0;
  const attiveSenzaOre = righeTempo.filter((r) => !r.ore).length;
  // €/h medio: solo sulle commesse con ore stimate (pesato sulle ore)
  const lordoConOre = righeTempo.filter((r) => r.ore > 0).reduce((s, r) => s + r.lordo, 0);
  const lordoOraMedio = oreTotali > 0 ? Math.round(lordoConOre / oreTotali) : null;
  const nettoOraMedio = lordoOraMedio != null ? Math.round(lordoOraMedio * setup.fattoreNetto) : null;
  // €/h reale dell'anno: dai pagamenti registrati insieme alle ore lavorate
  const realeAnno = commesse.reduce((acc, c) => {
    const r = orarioRealeCommessa(c, anno);
    return r ? { ore: acc.ore + r.ore, importo: acc.importo + r.importo } : acc;
  }, { ore: 0, importo: 0 });
  const lordoOraReale = realeAnno.ore > 0 ? Math.round(realeAnno.importo / realeAnno.ore) : null;
  const residuoTotale = righeTempo.reduce((s, r) => s + (r.residuo || 0), 0);

  // Trattative in pipeline: quelle con "simula" entrano nello scenario
  const pipeline = setup.pipeline || [];
  const simulate = pipeline.filter((p) => p.simula && Number(p.lordoMensile) > 0);
  const scenarioAttivo = simulate.length > 0;
  const commesseSimulate = simulate.map(pipelineCommessa);
  const commesseScenario = scenarioAttivo ? [...commesse, ...commesseSimulate] : commesse;
  const mesi12 = Array.from({ length: 12 }, (_, i) => { const d = new Date(anno, meseIdx + i, 1); return { m: d.getMonth(), y: d.getFullYear() }; });

  // Prossimi 12 mesi: ore impegnate, ore libere e lordo previsto (+ scenario)
  const tempo12 = mesi12.map(({ m, y }) => {
    const impegnate = commesse.reduce((s, c) => s + oreCommessaMese(c, m, y), 0);
    const libereBase = Math.max(0, oreDisponibili - impegnate);
    const scenario = Math.min(libereBase, commesseSimulate.reduce((s, c) => s + oreCommessaMese(c, m, y), 0));
    return {
      mese: `${MESI_SHORT[m]}${y !== anno ? " '" + String(y).slice(2) : ""}`,
      impegnate,
      scenario,
      libere: libereBase - scenario,
      libereBase,
      lordo: getLordoPerMese(m, y, commesse),
      lordoScenario: scenarioAttivo ? getLordoPerMese(m, y, commesseScenario) : null,
    };
  });
  const oreLibere12 = tempo12.reduce((s, t) => s + t.libereBase, 0);

  const barData = commesse
    .filter((c) => getCommessaLordoMensile(c) || statPagamentiCommessa(c, anno))
    .map((c) => {
      const stat = statPagamentiCommessa(c, anno);
      return {
        nome: c.cliente.length > 12 ? c.cliente.slice(0, 11) + "…" : c.cliente,
        Lordo: getCommessaLordoMensile(c) || 0,
        Netto: calcNetto(getCommessaLordoMensile(c) || 0, setup.fattoreNetto),
        // media mensile realmente incassata nei mesi con pagamenti registrati
        Incassato: stat ? stat.mediaMensile : null,
        mesiIncassati: stat ? stat.mesi : 0,
      };
    });
  const hasIncassatoReale = barData.some((d) => d.Incassato != null);

  const revenueHistory = setup.incassatoStorico || [];
  const sortedStorico = [...revenueHistory].sort((a, b) =>
    (chiaveMese(a.mese) || "").localeCompare(chiaveMese(b.mese) || "")
  );

  const meseCorrente = getMeseCorrente();
  const meseCorrManc = !revenueHistory.some(
    (r) => stessoMese(r.mese, meseCorrente)
  );
  // Mese corrente già registrato nello storico? Allora i box del mese mostrano
  // l'incassato reale; altrimenti la previsione dai contratti.
  const meseRegistrato = revenueHistory.find(
    (r) => stessoMese(r.mese, meseCorrente)
  ) || null;
  const lordoMese = meseRegistrato ? meseRegistrato.lordo : lordoMensileAttivo;
  const nettoMese = meseRegistrato ? meseRegistrato.netto : nettoMensileAttivo;
  const nomeMese = meseCorrente.split(" ")[0];

  const costiFissi = setup.costiFissi || [];
  const costiFissiMensili = costiFissi.filter((c) => c.tipo !== "annuale");
  const costiAnnuali = costiFissi.filter((c) => c.tipo === "annuale");
  const totaleCostiFissi = costiFissiMensili.reduce((s, c) => s + c.importo, 0);
  const totaleCostiAnnuali = costiAnnuali.reduce((s, c) => s + (c.importoAnnuale || c.importo * 12), 0);
  const totaleCostiAnnualiMensile = Math.round(totaleCostiAnnuali / 12);

  const cassaIniziale    = setup.cassaIniziale ?? 0;
  const cryptoAggiornato = setup.cryptoAggiornato ?? null;
  const patrimonio       = calcPatrimonio(setup);

  // Cash flow: parte dalla cassa reale alla sua data. Il saldo include già
  // gli incassi fino a quel giorno, quindi la proiezione inizia dal mese
  // successivo. Uscite = costi fissi mensili + spese annuali spalmate.
  const cassaData = setup.cassaData || null;
  const inizioCash = cassaData
    ? (() => { const [y, m] = cassaData.split("-").map(Number); return new Date(y, m, 1); })()
    : new Date(anno, meseIdx, 1);
  const usciteMensili = totaleCostiFissi + totaleCostiAnnualiMensile;
  // Mesi di autonomia: quanti mesi copre la cassa con le sole uscite
  const mesiAutonomia = usciteMensili > 0 ? Math.floor(cassaIniziale / usciteMensili) : null;

  const profittoMensile = nettoMese - totaleCostiFissi;
  const breakEvenLordo = totaleCostiFissi > 0
    ? Math.round(totaleCostiFissi / setup.fattoreNetto)
    : null;

  // YTD su tutti i mesi effettivamente registrati nello storico (incluso il mese
  // corrente se gia incassato): cosi il totale coincide sempre con la somma delle righe.
  const ytdLordo = sortedStorico.reduce((s, r) => s + r.lordo, 0);
  const ytdNetto = sortedStorico.reduce((s, r) => s + r.netto, 0);
  const ytdMesi = sortedStorico.length;
  const ytdProfitto = totaleCostiFissi > 0
    ? ytdNetto - totaleCostiFissi * ytdMesi
    : null;

  // — Confronto anno su anno (lordo) —
  const lordoAnnoCorrente = sumLordoAnno(revenueHistory, anno);
  const redditiAnnuali = setup.redditiAnnuali || [];
  const annoPrecImporto = redditiAnnuali.find((r) => r.anno === anno - 1)?.importo ?? null;
  const yoyDeltaPct = annoPrecImporto ? Math.round(((lordoAnnoCorrente - annoPrecImporto) / annoPrecImporto) * 100) : null;
  const yoyDeltaAbs = annoPrecImporto != null ? lordoAnnoCorrente - annoPrecImporto : null;

  // — Panoramica annuale —
  const annualData = MESI_IT.map((nome, i) => {
    const label = `${nome} ${anno}`;
    const recorded = revenueHistory.find(
      (r) => stessoMese(r.mese, label)
    );
    let tipo, lordo;
    if (recorded) {
      tipo = "reale";
      lordo = recorded.lordo;
    } else if (i < meseIdx) {
      tipo = "mancante";
      lordo = 0;
    } else if (i === meseIdx) {
      tipo = "stimato";
      lordo = getLordoPerMese(i, anno, commesse);
    } else {
      tipo = "proiezione";
      lordo = getLordoPerMese(i, anno, commesse);
    }
    return { mese: MESI_SHORT[i], lordo, tipo, netto: calcNetto(lordo, setup.fattoreNetto) };
  });

  const totReale = annualData.filter((d) => d.tipo === "reale").reduce((s, d) => s + d.netto, 0);
  const totProiezione = annualData.filter((d) => d.tipo !== "reale" && d.tipo !== "mancante").reduce((s, d) => s + d.netto, 0);
  const totAnno = totReale + totProiezione;
  const mesiMancanti = annualData.filter((d) => d.tipo === "mancante").length;

  // Conto dell'anno: entrate (reali + previste) meno tasse, costi e spese annuali
  const contoAnno = (() => {
    const lordo = annualData.reduce((s, d) => s + d.lordo, 0);
    const netto = annualData.reduce((s, d) => s + d.netto, 0);
    const costiFissiAnno = totaleCostiFissi * 12;
    return {
      lordo, netto, tasse: lordo - netto, costiFissiAnno, speseAnnuali: totaleCostiAnnuali,
      risparmio: netto - costiFissiAnno - totaleCostiAnnuali,
    };
  })();

  // — Tasse e F24 (stima, metodo storico) —
  const taxRate = 1 - setup.fattoreNetto;
  const lordoAnnoNoto = (y) => {
    if (y === anno) return contoAnno.lordo;
    const dichiarato = redditiAnnuali.find((r) => r.anno === y)?.importo;
    if (dichiarato != null) return dichiarato;
    const st = sumLordoAnno(revenueHistory, y);
    if (st > 0) return st;
    // anni futuri: lordo previsto dai contratti
    if (y > anno) return MESI_IT.reduce((s, _, m) => s + getLordoPerMese(m, y, commesse), 0);
    return null;
  };
  const tasseAnno = (y) => { const l = lordoAnnoNoto(y); return l == null ? null : Math.round(l * taxRate); };
  const f24Override = setup.f24 || {};
  const modoTasse = setup.cashTasse || "f24";
  const tasseMaturate = Math.round(lordoAnnoCorrente * taxRate);
  const f24Pagati = setup.f24Pagati || {};
  const pianoF24 = creaPianoF24(tasseAnno, f24Override, f24Pagati);
  // Acconti per l'anno in corso già versati (giugno, e novembre se passato)
  const accontiVersati = pianoF24.accontiVersati(anno, meseIdx);
  const keyGiugno = `${anno}-06`;
  const giugnoPagato = f24Pagati[keyGiugno] || {};
  const debitoFiscale = Math.max(0, tasseMaturate - accontiVersati);
  const cassaLibera = cassaIniziale - debitoFiscale;
  // Scadenze F24 di giugno e novembre nei prossimi 12 mesi (anche senza stima,
  // così puoi inserire l'importo del commercialista)
  const prossimiF24 = mesi12
    .filter(({ m }) => m === 5 || m === 10)
    .map(({ m, y }) => {
      const f = pianoF24(m, y);
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      return {
        key, m, y, data: `${key}-30`,
        importo: f?.importo ?? null,
        manuale: !!f?.manuale,
        voce: m === 10 ? `2° acconto ${y}` : `saldo ${y - 1} + 1° acconto ${y}`,
      };
    });

  // — Pipeline e scenario —
  const pipelinePesata = pipeline.reduce((s, p) => s + lordoPipelineMesi(p, mesi12) * (Number(p.probabilita) || 0) / 100, 0);
  const pipelinePiena = pipeline.reduce((s, p) => s + lordoPipelineMesi(p, mesi12), 0);
  // €/h medio sui prossimi 12 mesi (solo commesse con ore stimate)
  const orario12 = (lista) => {
    let lordo = 0, ore = 0;
    mesi12.forEach(({ m, y }) => lista.forEach((c) => {
      const o = oreCommessaMese(c, m, y);
      if (o > 0) { ore += o; lordo += importoCompetenzaMese(c, m, y); }
    }));
    return ore > 0 ? Math.round(lordo / ore) : null;
  };
  const oreLibere12Scenario = tempo12.reduce((s, t) => s + t.libere, 0);

  // — Cash flow: parte dalla cassa reale; con "f24" entra il lordo e le tasse
  // escono alle scadenze di giugno e novembre, altrimenti entra il netto —
  const calcCash = (lista, mesi = 12) => Array.from({ length: mesi }, (_, i) => {
    const d     = new Date(inizioCash.getFullYear(), inizioCash.getMonth() + i, 1);
    const mIdx  = d.getMonth();
    const y     = d.getFullYear();
    const label = `${MESI_IT[mIdx]} ${y}`;
    const recorded = revenueHistory.find(r => stessoMese(r.mese, label));
    const lordo = recorded ? recorded.lordo : getLordoPerMese(mIdx, y, lista);
    const netto = recorded ? recorded.netto : calcNetto(lordo, setup.fattoreNetto);
    const f24 = modoTasse === "f24" ? pianoF24(mIdx, y) : null;
    const tasse = f24?.importo || 0;
    const entrate = modoTasse === "f24" ? lordo : netto;
    const tipo  = recorded ? "reale" : "proiezione";
    // da chi arrivano i soldi del mese (solo per i mesi previsti)
    const dettaglio = recorded ? [] : lista
      .map((c) => ({ nome: c.cliente, v: importoCompetenzaMese(c, mIdx, y), concluso: c.stato === "Concluso" }))
      .filter((d) => d.v > 0);
    return { mese: `${MESI_SHORT[mIdx]}${y !== anno ? " '" + String(y).slice(2) : ""}`, m: mIdx, y, entrate, costi: usciteMensili, tasse, flusso: entrate - usciteMensili - tasse, tipo, dettaglio };
  }).map((row, i, arr) => ({
    ...row,
    // cassa accumulata = saldo di partenza + somma dei flussi fino a questo mese
    cassa: cassaIniziale + arr.slice(0, i + 1).reduce((s, r) => s + r.flusso, 0),
  }));
  // Riserve vendibili: crypto e beni (es. carte Pokémon) al prezzo realistico di vendita
  const riserve = [
    { id: "crypto", nome: "Crypto", valore: patrimonio.crypto, pct: setup.cryptoRealizzo ?? 95 },
    ...patrimonio.altri.map((a) => ({ id: a.id, nome: a.nome, valore: a.valore, pct: a.realizzo ?? 80 })),
  ].filter((r) => r.valore > 0);
  const riserveVendibili = Math.round(riserve.reduce((s, r) => s + (r.valore * r.pct) / 100, 0));
  const cashFlowData = calcCash(commesse).map((r) => ({ ...r, cassaRiserve: riserveVendibili > 0 ? r.cassa + riserveVendibili : null }));
  if (scenarioAttivo) calcCash(commesseScenario).forEach((r, i) => { cashFlowData[i].cassaScenario = r.cassa; });
  // Fino a quando bastano i soldi: proiezione su 3 anni con i contratti attuali
  const lungo = calcCash(commesse, 36);
  const fineCassa = lungo.find((r) => r.cassa < 0) || null;
  const fineRiserve = lungo.find((r) => r.cassa + riserveVendibili < 0) || null;
  const mesiAutonomiaRiserve = usciteMensili > 0 ? Math.floor((cassaIniziale + riserveVendibili) / usciteMensili) : null;
  const cassaFinale = cashFlowData[cashFlowData.length - 1]?.cassa ?? cassaIniziale;
  const cassaFinaleScenario = scenarioAttivo ? cashFlowData[cashFlowData.length - 1].cassaScenario : null;
  const tasseCash = cashFlowData.reduce((s, r) => s + r.tasse, 0);

  // — Obiettivi —
  const obiettivi = setup.obiettivi || {};
  const goals = [
    obiettivi.lordoAnno ? { id: "lordo", label: `Lordo ${anno}`, val: contoAnno.lordo, target: obiettivi.lordoAnno, fmt: (v) => `${fmtN(v)} €`, nota: `registrato ${fmtN(lordoAnnoCorrente)} € + previsto` } : null,
    obiettivi.orarioMin ? { id: "orario", label: "€/h medio", val: lordoOraReale ?? lordoOraMedio ?? 0, target: obiettivi.orarioMin, fmt: (v) => `${fmtN(v)} €/h`, nota: lordoOraReale != null ? "reale dell'anno" : "stimato dai contratti" } : null,
    obiettivi.oreLibereMin ? { id: "ore", label: "Ore libere/mese", val: oreLibere, target: obiettivi.oreLibereMin, fmt: (v) => `${fmtN(v)} h`, nota: nomeMese } : null,
  ].filter(Boolean);

  // — Andamento €/h per cliente —
  const serieClientiDati = serieOrarioClienti(commesse);
  const datiClienti = serieClientiDati.righe.map((r) => {
    const [y, m] = r.k.split("-");
    return { ...r, mese: `${MESI_SHORT[Number(m) - 1]} '${y.slice(2)}` };
  });

  // Lordo degli ultimi sei mesi (il corrente previsto se non ancora registrato)
  const storia6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anno, meseIdx - 5 + i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const r = revenueHistory.find((x) => stessoMese(x.mese, `${MESI_IT[m]} ${y}`));
    const corrente = i === 5;
    return { m, y, lordo: r ? r.lordo : corrente ? getLordoPerMese(m, y, commesse) : 0, prev: !r && corrente, corrente };
  });

  return {
    setup, now, storia6, anno, meseIdx, attive, hasSplit, lordoMensileAttivo, nettoMensileAttivo, statoCount, statoTotal, conScadenza, scadute, inScadenza, oreDisponibili, righeTempo, oreTotali, oreLibere, saturazione, attiveSenzaOre, lordoConOre, lordoOraMedio, nettoOraMedio, realeAnno, lordoOraReale, residuoTotale, pipeline, simulate, scenarioAttivo, commesseSimulate, commesseScenario, mesi12, tempo12, oreLibere12, barData, hasIncassatoReale, revenueHistory, sortedStorico, meseCorrente, meseCorrManc, meseRegistrato, lordoMese, nettoMese, nomeMese, costiFissi, costiFissiMensili, costiAnnuali, totaleCostiFissi, totaleCostiAnnuali, totaleCostiAnnualiMensile, cassaIniziale, cryptoAggiornato, patrimonio, cassaData, inizioCash, usciteMensili, mesiAutonomia, profittoMensile, breakEvenLordo, ytdLordo, ytdNetto, ytdMesi, ytdProfitto, lordoAnnoCorrente, redditiAnnuali, annoPrecImporto, yoyDeltaPct, yoyDeltaAbs, annualData, totReale, totProiezione, totAnno, mesiMancanti, contoAnno, taxRate, lordoAnnoNoto, tasseAnno, f24Override, modoTasse, tasseMaturate, f24Pagati, pianoF24, accontiVersati, keyGiugno, giugnoPagato, debitoFiscale, cassaLibera, prossimiF24, pipelinePesata, pipelinePiena, orario12, oreLibere12Scenario, calcCash, riserve, riserveVendibili, cashFlowData, lungo, fineCassa, fineRiserve, mesiAutonomiaRiserve, cassaFinale, cassaFinaleScenario, tasseCash, obiettivi, goals, serieClientiDati, datiClienti,
  };
}

// Frasi su ciò che richiede attenzione, in ordine di urgenza. `vai` è la
// sezione da aprire; `azione.fn` un'azione immediata.
export function calcolaNote(D, { conferma, inserisciOre }) {
  const { anno, meseIdx, now, scadute, fineCassa, fineRiserve, riserveVendibili, prossimiF24, cassaLibera, inScadenza, attiveSenzaOre, serieClientiDati, saturazione, obiettivi, contoAnno, setup } = D;
  const PESO = { danger: 0, warn: 1, info: 2 };
  const giorniA = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Math.round((new Date(y, m - 1, d) - new Date(anno, meseIdx, now.getDate())) / 864e5); };
  const note = [];
  scadute.forEach((c) => {
    const g = Math.abs(daysUntil(c.fine));
    note.push({ k: `scad-${c.id}`, livello: "danger", icon: "alert", testo: `«${c.cliente}» è ${g === 0 ? "scaduta oggi" : `scaduta da ${g} giorni`}: è conclusa?`, azione: { label: "Conferma chiusura", fn: () => conferma(c) } });
  });
  if (fineCassa) {
    note.push({ k: "cassa", livello: "danger", icon: "flow", vai: "sez-cash",
      testo: riserveVendibili > 0
        ? `Con i contratti attuali la cassa finisce a ${fineCassa.mese}. Vendendo crypto e beni (≈ ${fmtN(riserveVendibili)} €) ${fineRiserve ? `arrivi a ${fineRiserve.mese}` : "copri oltre 3 anni"}.`
        : `Con i contratti attuali la cassa finisce a ${fineCassa.mese}: servono nuove commesse prima di allora.` });
  }
  prossimiF24.filter((f) => f.importo > 0 && giorniA(f.data) >= 0 && giorniA(f.data) <= 60).forEach((f) => {
    note.push({ k: `f24-${f.key}`, livello: "warn", icon: "receipt", vai: "sez-tasse",
      testo: `F24 del ${dataBreve(f.data)}: ${fmtN(f.importo)} € (${f.manuale ? "importo reale" : "stima"}). Cassa libera dalle tasse oggi: ${fmtN(cassaLibera)} €.` });
  });
  if (inScadenza.length > 0) {
    const ore = inScadenza.reduce((s, c) => s + (Number(c.oreMensili) || 0), 0);
    const fee = inScadenza.reduce((s, c) => s + (getCommessaLordoMensile(c) || 0), 0);
    const nomi = inScadenza.map((c) => c.cliente).join(", ");
    note.push({ k: "fine", livello: "info", icon: "calendar", vai: "sez-liberi",
      testo: `${nomi} ${inScadenza.length === 1 ? "finisce" : "finiscono"} entro ${setup.alertScadenzaGiorni} giorni: ${ore ? `liberano ${fmtN(ore)} h/mese` : "liberano tempo"}${fee ? ` e tolgono ${fmtN(fee)} €/mese` : ""}. Rinnovo o nuovo cliente?` });
  }
  if (attiveSenzaOre > 0) {
    note.push({ k: "ore", livello: "warn", icon: "clock", azione: { label: "Inserisci le ore", fn: inserisciOre },
      testo: `${attiveSenzaOre} ${attiveSenzaOre === 1 ? "commessa è senza" : "commesse sono senza"} stima delle ore: tempo libero ed €/h sono incompleti.` });
  }
  serieClientiDati.clienti.forEach((c) => {
    const punti = serieClientiDati.righe.map((r) => r[c.id]).filter((v) => v != null);
    if (punti.length >= 2 && punti[punti.length - 1] < punti[0] * 0.9) {
      note.push({ k: `calo-${c.id}`, livello: "warn", icon: "trend", vai: "sez-clienti",
        testo: `Con ${c.nome} il tuo €/h reale è sceso da ${fmtN(punti[0])} a ${fmtN(punti[punti.length - 1])} €/h: lavori di più per lo stesso compenso.` });
    }
  });
  if (saturazione > 85) note.push({ k: "sat", livello: "warn", icon: "clock", vai: "sez-tempo", testo: `Sei al ${saturazione}% delle ore disponibili: poco spazio per nuovi clienti.` });
  if (obiettivi.lordoAnno && contoAnno.lordo < obiettivi.lordoAnno) {
    note.push({ k: "obiettivo", livello: "info", icon: "target", vai: "sez-pipeline",
      testo: `Per l'obiettivo di ${fmtN(obiettivi.lordoAnno)} € nel ${anno} mancano ${fmtN(obiettivi.lordoAnno - contoAnno.lordo)} € rispetto a quanto previsto.` });
  }
  note.sort((a, b) => PESO[a.livello] - PESO[b.livello]);
  return note;
}
