import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ComposedChart, Line, LineChart,
} from "recharts";
import {
  formatCurrency,
  daysUntil,
  getStatoColor,
  getStatoTone,
  calcNetto,
  getCommessaLordoMensile,
  getMeseCorrente,
  getLordoPerMese,
  sumLordoAnno,
  pagamentiDelMese,
  stessoMese,
  chiaveMese,
  statPagamentiCommessa,
  oreCommessaMese,
  orarioRealeCommessa,
  templateMese,
  mesiRimanenti,
  valoreResiduo,
  calcPatrimonio,
  dataBreve,
  pipelineCommessa,
  lordoPipelineMesi,
  scadenzaF24,
  icsPromemoria,
  serieOrarioClienti,
  importoCompetenzaMese,
} from "../../utils/helpers";
import Icon from "../Icon";
import Assistente from "../Assistente/Assistente";
import styles from "./Dashboard.module.css";

const MESI_IT = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre",
];
const MESI_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

// Palette grafici — design system Crema & Terracotta
const C = {
  pos: "#5E7E5A",
  warn: "#B5862F",
  info: "#5B7088",
  danger: "#AE4A3A",
  hair: "#E4DAC6",
  ink2: "#6E6456",
  ink3: "#9A8F7E",
};

const TOOLTIP_STYLE = {
  background: "#221D18",
  border: "1px solid #392F26",
  borderRadius: 9,
  color: "#E9E0D0",
  fontSize: 12,
  boxShadow: "0 2px 4px rgba(60,44,28,.05), 0 18px 40px -16px rgba(60,44,28,.20)",
};

const STATO_ORDER = ["In corso","In scadenza","Da chiarire","Sospeso","Concluso","Perso"];

const nf = new Intl.NumberFormat("it-IT");
const fmtN = (n) => nf.format(Math.round(n ?? 0));

// Formattazione assi in migliaia senza tick duplicati (es. 0,5k invece di due "0k")
const kfmt = (v) => {
  const a = Math.abs(v);
  if (a >= 1000) {
    const k = v / 1000;
    return (Number.isInteger(k) ? k : k.toFixed(1).replace(".", ",")) + "k";
  }
  return String(Math.round(v));
};

// Colori per cliente (ordine fisso, palette validata per daltonismo)
const SERIE_CLIENTI = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};
// Palette grafici in tema scuro (stessi ruoli di C)
const C_DARK = { pos: "#7FA27A", warn: "#D2A24A", info: "#8AA0BA", danger: "#D0705F", hair: "#3A3229", ink2: "#B9AE9C", ink3: "#8C8172" };

export default function Dashboard({ commesse, setCommesse, setup, setSetup, theme = "light" }) {
  const P = theme === "dark" ? { ...C, ...C_DARK, impegnate: "#C9785C", libere: "#3B4A38", dotFill: "#211C17" } : { ...C, impegnate: "#B5654A", libere: "#CFE0CB", dotFill: "#FBF8F2" };
  const tipoColor = { reale: P.pos, stimato: P.warn, proiezione: P.info, mancante: P.hair };
  const serieClienti = SERIE_CLIENTI[theme === "dark" ? "dark" : "light"];
  const [drill, setDrill] = useState(null);
  // Testo precompilato per l'assistente (aggiornamento mensile)
  const [seed, setSeed] = useState(null);
  const rootRef = useRef(null);

  // Le sezioni compaiono mentre scorri (una volta sola). Un solo observer per
  // tutta la vita della pagina: se venisse ricreato a ogni render, le sezioni
  // già marcate resterebbero nascoste per sempre (bug dopo il caricamento cloud).
  const ioRef = useRef(null);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        // visibile, oppure già superata (salto veloce dalla barra delle sezioni)
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    ioRef.current = io;
    // Rete di sicurezza: dopo qualche secondo tutto è comunque visibile
    const t = setTimeout(() => {
      rootRef.current?.querySelectorAll(".scroll-reveal:not(.in-view)").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.5) el.classList.add("in-view");
      });
    }, 2500);
    return () => { io.disconnect(); ioRef.current = null; clearTimeout(t); };
  }, []);
  useEffect(() => {
    const root = rootRef.current, io = ioRef.current;
    if (!root || !io) return;
    const vh = window.innerHeight;
    root.querySelectorAll(":scope > section.panel, :scope > .grid > section.panel").forEach((el) => {
      if (el.dataset.rev) return;
      el.dataset.rev = "1";
      if (el.getBoundingClientRect().top < vh) return; // già visibile: niente animazione
      el.classList.add("scroll-reveal");
      io.observe(el);
    });
  });
  const now = new Date();
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

  function handleConfermaScaduta(c) {
    const giorni = daysUntil(c.fine);
    const quando = giorni === 0 ? "scade oggi" : `scaduta da ${Math.abs(giorni)} giorni`;
    if (!confirm(`Confermi che «${c.cliente}» (${quando}) è conclusa? Verrà archiviata come Conclusa e tolta dalle scadenze.`)) return;
    setCommesse((prev) => prev.map((x) => (x.id === c.id ? { ...x, stato: "Concluso" } : x)));
  }

  // — Tempo e guadagno orario —
  const oreDisponibili = setup.oreMeseDisponibili ?? 160;
  const righeTempo = attive
    .map((c) => {
      const ore = oreCommessaMese(c, meseIdx, anno) || Number(c.oreMensili) || 0;
      const lordo = getCommessaLordoMensile(c) || 0;
      const reale = orarioRealeCommessa(c);
      return {
        c, ore, lordo,
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
  const satColor = saturazione <= 60 ? P.pos : saturazione <= 85 ? P.warn : P.danger;
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
    return st > 0 ? st : null;
  };
  const tasseAnno = (y) => { const l = lordoAnnoNoto(y); return l == null ? null : Math.round(l * taxRate); };
  const f24Override = setup.f24 || {};
  const modoTasse = setup.cashTasse || "f24";
  const tasseMaturate = Math.round(lordoAnnoCorrente * taxRate);
  const tPrec = tasseAnno(anno - 1);
  // Acconti per l'anno in corso già versati (giugno 40%, novembre 60% delle tasse dell'anno prima)
  const accontiVersati = tPrec == null ? 0 : Math.round(tPrec * ((meseIdx > 5 ? 0.4 : 0) + (meseIdx > 10 ? 0.6 : 0)));
  const debitoFiscale = Math.max(0, tasseMaturate - accontiVersati);
  const cassaLibera = cassaIniziale - debitoFiscale;
  // Scadenze F24 di giugno e novembre nei prossimi 12 mesi (anche senza stima,
  // così puoi inserire l'importo del commercialista)
  const prossimiF24 = mesi12
    .filter(({ m }) => m === 5 || m === 10)
    .map(({ m, y }) => {
      const f = scadenzaF24(m, y, tasseAnno, f24Override);
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
  const calcCash = (lista) => Array.from({ length: 12 }, (_, i) => {
    const d     = new Date(inizioCash.getFullYear(), inizioCash.getMonth() + i, 1);
    const mIdx  = d.getMonth();
    const y     = d.getFullYear();
    const label = `${MESI_IT[mIdx]} ${y}`;
    const recorded = revenueHistory.find(r => stessoMese(r.mese, label));
    const lordo = recorded ? recorded.lordo : getLordoPerMese(mIdx, y, lista);
    const netto = recorded ? recorded.netto : calcNetto(lordo, setup.fattoreNetto);
    const f24 = modoTasse === "f24" ? scadenzaF24(mIdx, y, tasseAnno, f24Override) : null;
    const tasse = f24?.importo || 0;
    const entrate = modoTasse === "f24" ? lordo : netto;
    const tipo  = recorded ? "reale" : "proiezione";
    return { mese: `${MESI_SHORT[mIdx]}${y !== anno ? " '" + String(y).slice(2) : ""}`, entrate, costi: usciteMensili, tasse, flusso: entrate - usciteMensili - tasse, tipo };
  }).map((row, i, arr) => ({
    ...row,
    // cassa accumulata = saldo di partenza + somma dei flussi fino a questo mese
    cassa: cassaIniziale + arr.slice(0, i + 1).reduce((s, r) => s + r.flusso, 0),
  }));
  const cashFlowData = calcCash(commesse);
  if (scenarioAttivo) calcCash(commesseScenario).forEach((r, i) => { cashFlowData[i].cassaScenario = r.cassa; });
  const cassaFinale = cashFlowData[cashFlowData.length - 1]?.cassa ?? cassaIniziale;
  const cassaFinaleScenario = scenarioAttivo ? cashFlowData[cashFlowData.length - 1].cassaScenario : null;
  // Primo mese in cui la cassa scende sotto zero (se succede)
  const meseRosso = cashFlowData.find((d) => d.cassa < 0) || null;
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

  const scaricaPromemoria = () => {
    const blob = new Blob([icsPromemoria(window.location.origin)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "promemoria-dashboard.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const upsellOpportunities = commesse.reduce((s, c) => s + (Number(c.upsellTarget) || 0), 0);
  const pctMese = meseRegistrato && lordoMensileAttivo > 0 ? Math.round((lordoMese / lordoMensileAttivo) * 100) : null;
  const tasseMese = Math.round(lordoMese * taxRate);
  const prossimoF24 = prossimiF24.find((f) => f.importo > 0) || null;
  const satTone = saturazione > 85 ? "danger" : saturazione > 60 ? "warn" : "pos";
  const sezioni = SEZIONI.filter(([id]) => id !== "sez-storico" || sortedStorico.length > 0);
  const apri = (id) => {
    if (id.startsWith("sez-")) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    else setDrill(id);
  };

  const gruppi = [
    { titolo: "Lavoro", icon: "clock", righe: [
      { id: "orario", label: "Guadagno orario medio", value: lordoOraMedio != null ? `${fmtN(lordoOraMedio)} €/h` : "—", tone: "info",
        sub: lordoOraMedio != null ? `netto ${fmtN(nettoOraMedio)} €/h${lordoOraReale != null ? ` · reale ${fmtN(lordoOraReale)} €/h` : ""}` : "aggiungi le ore alle commesse" },
      { id: "tempo", label: `Ore libere · ${nomeMese}`, value: `${fmtN(oreLibere)} h`, tone: satTone, sub: `${fmtN(oreTotali)} h impegnate su ${oreDisponibili} · ${saturazione}%` },
      { id: "commesseAttive", label: "Commesse attive", value: String(attive.length), tone: "ink", sub: `su ${commesse.length} totali` },
      { id: "upsell", label: "Potenziale upsell", value: `${fmtN(upsellOpportunities)} €`, tone: "info", sub: "obiettivo mensile aggregato" },
      { id: "sez-pipeline", label: "Pipeline pesata", value: `${fmtN(pipelinePesata)} €`, tone: "accent", sub: pipeline.length ? `${pipeline.length} ${pipeline.length === 1 ? "trattativa" : "trattative"} · 12 mesi` : "aggiungi le trattative" },
    ] },
    { titolo: "Costi e tasse", icon: "coin", righe: [
      { id: "costiMensili", label: "Costi fissi mensili", value: `${fmtN(totaleCostiFissi)} €`, tone: "danger", sub: `${costiFissiMensili.length} voci · ogni mese` },
      { id: "speseAnnuali", label: "Spese annuali", value: `${fmtN(totaleCostiAnnuali)} €`, tone: "warn", sub: "promemoria · non le stai pagando ora" },
      { id: "equivMensile", label: "Equivalente mensile", value: `${fmtN(totaleCostiAnnualiMensile)} €`, tone: "warn", sub: "se le spalmassi ogni mese · nel cash flow" },
      { id: "tasse", label: "Prossimo F24", value: prossimoF24 ? `${fmtN(prossimoF24.importo)} €` : "—", tone: "warn", sub: prossimoF24 ? `${dataBreve(prossimoF24.data)} · ${prossimoF24.manuale ? "importo reale" : "stima"}` : "nessuna stima: inserisci l'importo" },
    ] },
    { titolo: "Patrimonio", icon: "wallet", righe: [
      { id: "patrimonio", label: "Patrimonio totale", value: `${fmtN(patrimonio.totale)} €`, tone: "ink", sub: `crypto ${fmtN(patrimonio.crypto)}${patrimonio.totaleAltri ? ` · beni ${fmtN(patrimonio.totaleAltri)}` : ""}` },
      { id: "patrimonio", label: "Cassa sul conto", value: `${fmtN(patrimonio.cassa)} €`, tone: "info", sub: `libera dalle tasse ${fmtN(cassaLibera)} €${cassaData ? ` · al ${dataBreve(cassaData)}` : ""}` },
      { id: "sez-cash", label: "Cassa fra 12 mesi", value: `${fmtN(cassaFinale)} €`, tone: cassaFinale >= cassaIniziale ? "pos" : "danger", sub: mesiAutonomia != null ? `autonomia ${mesiAutonomia} mesi senza incassi` : "cash flow" },
    ] },
  ];

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }} ref={rootRef}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">
            Panoramica generale
            <span className="badge"><span className="badge-dot"></span>anno fiscale {anno}</span>
          </div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => window.print()} title="Apre la stampa: scegli «Salva come PDF»">
            <Icon name="file" size={16} /> Report PDF
          </button>
          <button className="btn btn-ghost" onClick={scaricaPromemoria} title="Evento ricorrente il 1° di ogni mese alle 9:00">
            <Icon name="bell" size={16} /> Promemoria mensile
          </button>
        </div>
      </header>

      <SectionNav sezioni={sezioni} />

      {/* Il mese in un colpo d'occhio */}
      <section className="panel summary" id="sez-mese">
        <div className="sum-hero">
          <div className="sum-eyebrow">{meseCorrente} · {meseRegistrato ? "incassato" : "previsto dai contratti"}</div>
          <button className="sum-big" onClick={() => setDrill("lordoAttivo")} aria-label="Dettaglio lordo del mese">
            <span className="num"><AnimatedNumber value={fmtN(lordoMese)} /></span>
            <span className="cur">€ lordi</span>
          </button>
          <div className="sum-progress">
            {meseRegistrato ? (
              <>
                <div className="statbar-track"><div className="statbar-fill" style={{ width: Math.min(100, pctMese ?? 0) + "%", background: "var(--accent)" }}></div></div>
                <span>{pctMese}% del previsto dai contratti ({fmtN(lordoMensileAttivo)} €)</span>
              </>
            ) : (
              <span>{nomeMese} non ancora registrato · {attive.length} {attive.length === 1 ? "commessa attiva" : "commesse attive"}</span>
            )}
          </div>
          <div className="sum-trio">
            <SumStat label="Netto" value={nettoMese} tone="pos" sub={meseRegistrato ? `incassato · previsto ${fmtN(nettoMensileAttivo)}` : `previsto · lordo × ${Math.round(setup.fattoreNetto * 100)}%`} onClick={() => setDrill("nettoAttivo")} />
            <SumStat label="Profitto" value={profittoMensile} tone={profittoMensile >= 0 ? "pos" : "danger"} sub={`netto − ${fmtN(totaleCostiFissi)} € fissi`} onClick={() => setDrill("profitto")} />
            <SumStat label="Tasse da parte" value={tasseMese} tone="warn" sub={`${Math.round(taxRate * 100)}% del lordo`} onClick={() => setDrill("tasse")} />
          </div>
        </div>
        <div className="sum-groups">
          {gruppi.map((g) => (
            <div key={g.titolo} className="sum-group">
              <div className="sum-gtitle"><Icon name={g.icon} size={13} />{g.titolo}</div>
              {g.righe.map((r, i) => (
                <button key={r.label} className="sum-row" style={{ "--i": i }} onClick={() => apri(r.id)}>
                  <span className="sr-l">
                    <span className="sr-lab">{r.label}</span>
                    <span className="sr-sub">{r.sub}</span>
                  </span>
                  <span className={"sr-v num " + TONE_TXT[r.tone]}>{r.value}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="sum-goals">
          <span className="sum-gtitle"><Icon name="target" size={13} />Obiettivi</span>
          {goals.length === 0 ? (
            <button className="btn btn-quiet" onClick={() => setDrill("obiettivi")}>Imposta lordo annuo, €/h minimo e ore libere →</button>
          ) : (
            <>
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.val / g.target) * 100));
                const ok = g.val >= g.target;
                return (
                  <button key={g.id} className="goal" onClick={() => setDrill("obiettivi")} title={g.nota}>
                    <span className="goal-top">
                      <span>{g.label}</span>
                      <b className={"num " + (ok ? "t-pos" : "t-warn")}>{g.fmt(g.val)} <span>/ {g.fmt(g.target)}</span></b>
                    </span>
                    <span className="statbar-track"><span className="statbar-fill" style={{ display: "block", width: pct + "%", background: ok ? "var(--pos)" : "var(--warn)" }}></span></span>
                  </button>
                );
              })}
              <button className="btn btn-quiet" onClick={() => setDrill("obiettivi")} aria-label="Modifica obiettivi"><Icon name="edit" size={14} /></button>
            </>
          )}
        </div>
      </section>

      {(inScadenza.length > 0 || scadute.length > 0) && (
        <div className="notice warn reveal">
          <div
            className="notice-ico"
            style={{ background: "var(--panel)", color: "var(--warn)", border: "1px solid color-mix(in oklab, var(--warn) 30%, var(--hair))" }}
          >
            <Icon name="alert" size={18} />
          </div>
          <div className="chip-row">
            <span className="lab" style={{ marginRight: 4 }}>Scadenze entro {setup.alertScadenzaGiorni} giorni</span>
            {scadute.map((c) => (
              <span key={c.id} className="deadline-chip urgent">
                {c.cliente} <b>scaduta</b>
              </span>
            ))}
            {inScadenza.map((c) => {
              const days = daysUntil(c.fine);
              return (
                <span key={c.id} className={"deadline-chip" + (days <= 7 ? " urgent" : "")}>
                  {c.cliente} <b>{days}gg</b>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {meseCorrManc && (
        <MonthlyPrompt
          mese={meseCorrente}
          stimaLordo={lordoMensileAttivo}
          fattoreNetto={setup.fattoreNetto}
          commesseAttive={attive}
          onAggiorna={() => setSeed((prev) => ({ testo: templateMese(commesse, meseCorrente), n: (prev?.n || 0) + 1 }))}
          onAdd={(entry) =>
            setSetup((prev) => ({
              ...prev,
              incassatoStorico: [...(prev.incassatoStorico || []), entry],
            }))
          }
        />
      )}

      <div id="sez-ai"><Assistente commesse={commesse} setCommesse={setCommesse} setup={setup} setSetup={setSetup} seed={seed} /></div>

      {/* Tempo e guadagno orario per commessa */}
      <section className="panel" id="sez-tempo">
        <div className="panel-head">
          <div className="panel-title"><Icon name="clock" size={15} />Tempo e €/h · {nomeMese}</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--info)" }}>{lordoOraMedio != null ? `${fmtN(lordoOraMedio)} €/h` : "—"}</div>
              <div className="l">Lordo orario medio</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: satColor }}>{fmtN(oreLibere)} h</div>
              <div className="l">Ore libere su {oreDisponibili}</div>
            </div>
            {residuoTotale > 0 && (
              <div className="si">
                <div className="v num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(residuoTotale)}</div>
                <div className="l">Ancora da incassare</div>
              </div>
            )}
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div className="statbar-track" style={{ height: 10 }}>
            <div className="statbar-fill" style={{ width: Math.min(100, saturazione) + "%", background: satColor }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-3)", marginTop: 6, marginBottom: 8 }}>
            <span>{fmtN(oreTotali)} h impegnate · saturazione {saturazione}%</span>
            <span>{oreDisponibili} h disponibili (Setup)</span>
          </div>
        </div>
        {righeTempo.length > 0 ? (
          <>
          <div className="tempo-cards">
            {righeTempo.map((r) => (
              <div key={r.c.id} className="tempo-card row-in">
                <div className="tc-top">
                  <span className="tc-nome">{r.c.cliente}</span>
                  <span className="tc-ora num" style={{ color: r.lordoOra == null ? "var(--ink-3)" : r.lordoOra >= (lordoOraMedio ?? 0) ? "var(--pos-ink)" : "var(--warn)" }}>
                    {r.lordoOra != null ? `${fmtN(r.lordoOra)} €/h` : "—"}
                  </span>
                </div>
                <div className="tc-riga">
                  {r.ore ? `${fmtN(r.ore)} h/mese` : "ore mancanti"} · {r.lordo ? `${fmtN(r.lordo)} €/mese` : "senza fee"}
                  {r.nettoOra != null && ` · netto ${fmtN(r.nettoOra)} €/h`}{r.realeOra != null && ` · reale ${fmtN(r.realeOra)} €/h`}
                </div>
                <div className="tc-riga">
                  {r.c.fine ? `fine ${dataBreve(r.c.fine)} (${r.mesi === 0 ? "scaduta" : `${r.mesi} ${r.mesi === 1 ? "mese" : "mesi"}`})` : "senza data di fine"}
                  {r.residuo != null && <> · da incassare <b className="num" style={{ color: "var(--accent-ink)" }}>{fmtN(r.residuo)} €</b></>}
                </div>
              </div>
            ))}
          </div>
          <div className="tempo-table" style={{ overflowX: "auto" }}>
            <table className="table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Commessa</th>
                  <th className="r">Ore/mese</th>
                  <th className="r">Lordo/mese</th>
                  <th className="r">€/h lordo</th>
                  <th className="r">€/h netto</th>
                  <th className="r" title="Dai pagamenti registrati con le ore lavorate">€/h reale</th>
                  <th className="r">Fine</th>
                  <th className="r">Da incassare</th>
                </tr>
              </thead>
              <tbody>
                {righeTempo.map((r, i) => {
                  const sopraMedia = r.lordoOra != null && lordoOraMedio != null && r.lordoOra >= lordoOraMedio;
                  return (
                    <tr key={r.c.id} className="row-in" style={{ cursor: "default", "--i": i }}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.c.cliente}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.c.tipo === "Progetto" ? "progetto" : "mensile"}{r.c.servizio ? ` · ${r.c.servizio}` : ""}</div>
                      </td>
                      <td className="r num">{r.ore ? `${fmtN(r.ore)} h` : <span style={{ color: "var(--warn)" }}>manca</span>}</td>
                      <td className="r num">{r.lordo ? `${fmtN(r.lordo)} €` : "—"}</td>
                      <td className="r num" style={{ fontWeight: 700, color: r.lordoOra == null ? "var(--ink-3)" : sopraMedia ? "var(--pos-ink)" : "var(--warn)" }}>{r.lordoOra != null ? `${fmtN(r.lordoOra)} €` : "—"}</td>
                      <td className="r num" style={{ color: "var(--ink-2)" }}>{r.nettoOra != null ? `${fmtN(r.nettoOra)} €` : "—"}</td>
                      <td className="r num" style={{ color: "var(--ink-2)" }} title={r.realeMesi ? `media su ${r.realeMesi} ${r.realeMesi === 1 ? "mese" : "mesi"} con ore registrate` : "nessun mese con ore lavorate registrate"}>{r.realeOra != null ? `${fmtN(r.realeOra)} €` : "—"}</td>
                      <td className="r" style={{ fontSize: 13 }}>
                        {r.c.fine ? (
                          <>
                            <div className="num">{dataBreve(r.c.fine)}</div>
                            <div style={{ fontSize: 11.5, color: r.mesi <= 1 ? "var(--danger)" : r.mesi <= 3 ? "var(--warn)" : "var(--ink-3)" }}>{r.mesi === 0 ? "scaduta" : `${r.mesi} ${r.mesi === 1 ? "mese" : "mesi"}`}</div>
                          </>
                        ) : <span style={{ color: "var(--ink-3)" }}>senza fine</span>}
                      </td>
                      <td className="r num" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>{r.residuo != null ? `${fmtN(r.residuo)} €` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <p style={{ color: "var(--ink-3)", fontSize: 13, padding: "0 var(--card-pad) var(--card-pad)" }}>Nessuna commessa attiva.</p>
        )}
        <p style={{ color: "var(--ink-3)", fontSize: 12, padding: "10px var(--card-pad) var(--card-pad)" }}>
          €/h verde = sopra la tua media, ocra = sotto. Il «reale» arriva dai mesi in cui dici all&apos;assistente anche le ore lavorate.
          {attiveSenzaOre > 0 && ` ${attiveSenzaOre} ${attiveSenzaOre === 1 ? "commessa è senza" : "commesse sono senza"} stima ore: il tempo libero è sovrastimato.`}
        </p>
      </section>

      {/* Tempo libero nei prossimi 12 mesi */}
      <section className="panel" id="sez-liberi">
        <div className="panel-head">
          <div className="panel-title"><Icon name="calendar" size={15} />Tempo libero · prossimi 12 mesi</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--pos-ink)" }}>{fmtN(oreLibere12)} h{scenarioAttivo && <span style={{ fontSize: 15, color: "var(--warn)" }}> → {fmtN(oreLibere12Scenario)} h</span>}</div>
              <div className="l">Ore libere in 12 mesi{scenarioAttivo ? " · con scenario" : ""}</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(tempo12.reduce((s, t) => s + t.lordo, 0))}</div>
              <div className="l">Lordo da contratti</div>
            </div>
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div className="legend" style={{ marginBottom: 8 }}>
            <span className="li"><span className="sw" style={{ background: P.impegnate }}></span>Ore impegnate</span>
            {scenarioAttivo && <span className="li"><span className="sw" style={{ background: P.warn }}></span>Trattative simulate</span>}
            <span className="li"><span className="sw" style={{ background: P.libere }}></span>Ore libere</span>
            <span className="li"><span className="sw line" style={{ background: P.info }}></span>Lordo previsto (asse destro)</span>
            {scenarioAttivo && <span className="li"><span className="sw line" style={{ background: P.warn }}></span>Lordo con scenario</span>}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={tempo12} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="mese" tick={{ fill: P.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="ore" tick={{ fill: P.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} width={44} />
              <YAxis yAxisId="eur" orientation="right" tick={{ fill: P.info, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={kfmt} width={44} />
              <Tooltip
                cursor={{ fill: "rgba(60,44,28,.05)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#A39684", fontWeight: 700 }}
                itemStyle={{ color: "#E9E0D0" }}
                formatter={(v, name) => (name.startsWith("Lordo") ? [formatCurrency(v), name] : [`${fmtN(v)} h`, name])}
              />
              <Bar yAxisId="ore" dataKey="impegnate" name="Ore impegnate" stackId="ore" fill={P.impegnate} maxBarSize={38} />
              {scenarioAttivo && <Bar yAxisId="ore" dataKey="scenario" name="Trattative simulate" stackId="ore" fill={P.warn} maxBarSize={38} />}
              <Bar yAxisId="ore" dataKey="libere" name="Ore libere" stackId="ore" fill={P.libere} radius={[3, 3, 0, 0]} maxBarSize={38} />
              <Line yAxisId="eur" type="monotone" dataKey="lordo" name="Lordo previsto" stroke={P.info} strokeWidth={2.2} dot={{ fill: P.dotFill, stroke: P.info, strokeWidth: 2, r: 3 }} />
              {scenarioAttivo && <Line yAxisId="eur" type="monotone" dataKey="lordoScenario" name="Lordo con scenario" stroke={P.warn} strokeWidth={2} strokeDasharray="5 4" dot={false} />}
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 6 }}>
            Le ore libere crescono quando le commesse finiscono: è il tempo da vendere. Base: ore/mese di ogni commessa nelle sue date di inizio e fine.
          </p>
        </div>
      </section>

      {/* Pipeline delle trattative e simulatore "e se…" */}
      <section className="panel" id="sez-pipeline">
        <div className="panel-head">
          <div className="panel-title"><Icon name="funnel" size={15} />Pipeline e simulatore</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(pipelinePesata)}</div>
              <div className="l">Valore pesato · 12 mesi</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: "var(--ink-2)" }}>{formatCurrency(pipelinePiena)}</div>
              <div className="l">Se chiudi tutto</div>
            </div>
          </div>
        </div>
        <PipelineEditor pipeline={pipeline} setSetup={setSetup} fattoreNetto={setup.fattoreNetto} mediaOra={lordoOraMedio} />
        {scenarioAttivo ? (
          <div className="scenario anim-in">
            <div className="sum-gtitle"><Icon name="spark" size={13} />Scenario con {simulate.length} {simulate.length === 1 ? "trattativa simulata" : "trattative simulate"}</div>
            <div className="scenario-grid">
              {[
                { l: "Cassa fra 12 mesi", da: cassaFinale, a: cassaFinaleScenario, f: (v) => `${fmtN(v)} €` },
                { l: "Ore libere in 12 mesi", da: oreLibere12, a: oreLibere12Scenario, f: (v) => `${fmtN(v)} h`, inverso: true },
                { l: "€/h medio · 12 mesi", da: orario12(commesse), a: orario12(commesseScenario), f: (v) => (v == null ? "—" : `${fmtN(v)} €/h`) },
                { l: "Lordo prossimi 12 mesi", da: tempo12.reduce((s, t) => s + t.lordo, 0), a: tempo12.reduce((s, t) => s + (t.lordoScenario || 0), 0), f: (v) => `${fmtN(v)} €` },
              ].map((x) => {
                const d = (x.a ?? 0) - (x.da ?? 0);
                const buono = x.inverso ? d <= 0 : d >= 0;
                return (
                  <div key={x.l} className="scn">
                    <div className="scn-l">{x.l}</div>
                    <div className="scn-v num">{x.f(x.da)} <span className="scn-arr">→</span> <b className={buono ? "t-pos" : "t-warn"}>{x.f(x.a)}</b></div>
                    {d !== 0 && x.da != null && x.a != null && <div className="scn-d">{d > 0 ? "+" : "−"}{x.f(Math.abs(d))}</div>}
                  </div>
                );
              })}
            </div>
            <p className="scn-note">Lo scenario appare anche nei grafici del tempo libero e del cash flow (linee tratteggiate). Non cambia i dati reali.</p>
          </div>
        ) : (
          <p style={{ color: "var(--ink-3)", fontSize: 12, padding: "10px var(--card-pad) var(--card-pad)" }}>
            Spunta «Simula» su una trattativa per vedere cosa succede a cassa, tempo libero e €/h se la chiudi. Il valore pesato = lordo dei prossimi 12 mesi × probabilità.
          </p>
        )}
      </section>

      <section className="panel" id="sez-cash">
        <div className="panel-head">
          <div className="panel-title"><Icon name="flow" size={15} />Cash flow — prossimi 12 mesi</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: cassaFinale >= cassaIniziale ? "var(--pos-ink)" : "var(--danger)" }}>{formatCurrency(cassaFinale)}</div>
              <div className="l">Cassa fra 12 mesi</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: "var(--ink)" }}>{formatCurrency(cassaFinale + patrimonio.crypto + patrimonio.totaleAltri)}</div>
              <div className="l">Patrimonio fra 12 mesi</div>
            </div>
            {scenarioAttivo && (
              <div className="si">
                <div className="v num" style={{ color: "var(--warn)" }}>{formatCurrency(cassaFinaleScenario)}</div>
                <div className="l">Cassa con scenario</div>
              </div>
            )}
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 6, fontSize: 13, color: "var(--ink-2)" }}>
            <span>Parte da: <b className="num" style={{ color: "var(--ink)" }}>{formatCurrency(cassaIniziale)}</b>{cassaData && <span style={{ color: "var(--ink-3)" }}> al {dataBreve(cassaData)}</span>}</span>
            <span>Uscite/mese: <b className="num" style={{ color: "var(--danger)" }}>{formatCurrency(usciteMensili)}</b> <span style={{ color: "var(--ink-3)" }}>({fmtN(totaleCostiFissi)} fissi + {fmtN(totaleCostiAnnualiMensile)} spese annuali spalmate)</span></span>
            <span>{modoTasse === "f24"
              ? <>Entrate lorde · F24 in 12 mesi: <b className="num" style={{ color: "var(--warn)" }}>{formatCurrency(tasseCash)}</b></>
              : <>Entrate nette (tasse tolte ogni mese)</>}
            </span>
          </div>
          {meseRosso && (
            <div className="notice warn" style={{ margin: "8px 0" }}>
              <span className="lab">Con i contratti attuali la cassa va sotto zero a {meseRosso.mese}: servono nuove commesse prima di allora.</span>
            </div>
          )}
          <div className="legend" style={{ marginBottom: 8 }}>
            <span className="li"><span className="sw" style={{ background: P.pos }}></span>Flusso positivo</span>
            <span className="li"><span className="sw" style={{ background: P.danger }}></span>Flusso negativo</span>
            <span className="li"><span className="sw line" style={{ background: P.info }}></span>Cassa accumulata</span>
            {scenarioAttivo && <span className="li"><span className="sw line" style={{ background: P.warn }}></span>Cassa con scenario</span>}
            {modoTasse === "f24" && tasseCash > 0 && <span className="li">▼ mesi con F24</span>}
            <span className="li"><span className="sw" style={{ background: P.hair }}></span>Barre chiare = proiezione</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cashFlowData.map((r) => ({ ...r, etichetta: r.tasse > 0 ? `${r.mese} ▼` : r.mese }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="etichetta" tick={{ fill: P.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="flow" tick={{ fill: P.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={kfmt} width={44} />
              <YAxis yAxisId="cassa" orientation="right" tick={{ fill: P.info, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={kfmt} width={44} />
              <Tooltip
                cursor={{ fill: "rgba(60,44,28,.05)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#A39684", fontWeight: 700 }}
                itemStyle={{ color: "#E9E0D0" }}
                content={<CashTooltip />}
              />
              <ReferenceLine yAxisId="flow" y={0} stroke={P.hair} strokeWidth={1.4} />
              <Bar yAxisId="flow" dataKey="flusso" name="Flusso netto" radius={[3, 3, 0, 0]} maxBarSize={40}>
                {cashFlowData.map((entry, i) => (
                  <Cell key={i} fill={entry.flusso >= 0 ? P.pos : P.danger} opacity={entry.tipo === "proiezione" ? 0.62 : 1} />
                ))}
              </Bar>
              <Line yAxisId="cassa" type="monotone" dataKey="cassa" name="Cassa" stroke={P.info} strokeWidth={2.4} dot={{ fill: P.dotFill, stroke: P.info, strokeWidth: 2, r: 3.4 }} activeDot={{ r: 5 }} />
              {scenarioAttivo && <Line yAxisId="cassa" type="monotone" dataKey="cassaScenario" name="Cassa con scenario" stroke={P.warn} strokeWidth={2} strokeDasharray="5 4" dot={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid cols-2">
      {/* Tasse e scadenze F24 */}
      <section className="panel" id="sez-tasse">
        <div className="panel-head">
          <div className="panel-title"><Icon name="receipt" size={15} />Tasse e F24</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--warn)" }}>{formatCurrency(debitoFiscale)}</div>
              <div className="l">Da tenere da parte oggi</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: cassaLibera >= 0 ? "var(--pos-ink)" : "var(--danger)" }}>{formatCurrency(cassaLibera)}</div>
              <div className="l">Cassa libera</div>
            </div>
          </div>
        </div>
        <div className="row-list">
          <div className="lrow" style={{ gridTemplateColumns: "1fr auto", cursor: "default" }}>
            <div>
              <div className="nm">Tasse maturate nel {anno}</div>
              <div className="meta">{fmtN(lordoAnnoCorrente)} € lordi registrati × {Math.round(taxRate * 100)}%{accontiVersati > 0 ? ` · acconti già versati ${fmtN(accontiVersati)} €` : ""}</div>
            </div>
            <span className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>{fmtN(tasseMaturate)} €</span>
          </div>
          {prossimiF24.map((f) => (
            <div key={f.key} className="lrow" style={{ gridTemplateColumns: "1fr auto", cursor: "default" }}>
              <div>
                <div className="nm">F24 · {dataBreve(f.data)}</div>
                <div className="meta">{f.voce} · {f.manuale ? "importo reale" : f.importo != null ? "stima" : "manca la stima: inserisci l'importo"}</div>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input className="input num" style={{ width: 110 }} type="number" min="0" placeholder={f.importo != null ? String(f.importo) : "€"}
                  value={f.manuale ? f24Override[f.key] : ""}
                  onChange={(e) => setSetup((prev) => { const o = { ...(prev.f24 || {}) }; if (e.target.value === "") delete o[f.key]; else o[f.key] = Number(e.target.value); return { ...prev, f24: o }; })}
                  aria-label={`Importo F24 ${dataBreve(f.data)}`} />
                <span style={{ color: "var(--ink-3)", fontSize: 12 }}>€</span>
              </span>
            </div>
          ))}
        </div>
        <div className="panel-pad" style={{ paddingTop: 10 }}>
          <div className="seg" role="group" aria-label="Tasse nel cash flow">
            <button className={modoTasse === "f24" ? "on" : ""} onClick={() => setSetup((prev) => ({ ...prev, cashTasse: "f24" }))}>Cash flow con F24</button>
            <button className={modoTasse === "mensile" ? "on" : ""} onClick={() => setSetup((prev) => ({ ...prev, cashTasse: "mensile" }))}>Tasse tolte ogni mese</button>
          </div>
          <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 10 }}>
            Stima semplificata: aliquota complessiva {Math.round(taxRate * 100)}% (Setup), metodo storico, acconti 40% a giugno e 60% a novembre. Scrivi negli spazi gli importi del commercialista: sostituiscono la stima.
          </p>
        </div>
      </section>

      <section className="panel" id="sez-patrimonio">
        <div className="panel-head">
          <div className="panel-title"><Icon name="wallet" size={15} />Patrimonio</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--ink)" }}>{formatCurrency(patrimonio.totale)}</div>
              <div className="l">Totale oggi</div>
            </div>
            {mesiAutonomia != null && (
              <div className="si">
                <div className="v num" style={{ color: mesiAutonomia >= 6 ? "var(--pos-ink)" : "var(--warn)" }}>{mesiAutonomia} mesi</div>
                <div className="l">Autonomia della cassa</div>
              </div>
            )}
          </div>
        </div>
        <div className="row-list">
          {[
            { nome: "Cassa sul conto", valore: patrimonio.cassa, nota: cassaData ? `al ${dataBreve(cassaData)}` : "data non indicata", colore: P.info },
            { nome: "Crypto", valore: patrimonio.crypto, nota: cryptoAggiornato ? `al ${dataBreve(cryptoAggiornato)}` : "", colore: P.warn },
            ...patrimonio.altri.map((a) => ({ nome: a.nome, valore: a.valore, nota: a.aggiornato ? `al ${dataBreve(a.aggiornato)}` : "", colore: "#8A5A8A" })),
          ].map((v) => {
            const pct = patrimonio.totale > 0 ? Math.round((v.valore / patrimonio.totale) * 100) : 0;
            return (
              <div key={v.nome} className="statbar-row">
                <div className="statbar-top">
                  <span className="statbar-lab"><span className="d" style={{ background: v.colore }}></span>{v.nome}{v.nota && <span style={{ fontWeight: 400, color: "var(--ink-3)", fontSize: 12 }}>{v.nota}</span>}</span>
                  <span className="statbar-val"><b className="num">{fmtN(v.valore)} €</b>{pct}%</span>
                </div>
                <div className="statbar-track"><div className="statbar-fill" style={{ width: pct + "%", background: v.colore }}></div></div>
              </div>
            );
          })}
        </div>
        <p style={{ color: "var(--ink-3)", fontSize: 12, padding: "4px var(--card-pad) var(--card-pad)" }}>
          Aggiorna i valori dal riquadro «Patrimonio» in alto, da Setup, oppure scrivendo all&apos;assistente (es. «cassa 16.900 €, carte Pokémon 11.000 €»). Solo la cassa entra nel cash flow: crypto e beni sono riserve.
        </p>
      </section>

      </div>

      <div className={annoPrecImporto != null ? "grid cols-2" : "grid"}>
      <section className="panel" id="sez-conto">
        <div className="panel-head">
          <div className="panel-title"><Icon name="bars" size={15} />Conto dell&apos;anno {anno}</div>
          <span className="panel-note">mesi registrati + previsione dai contratti{mesiMancanti > 0 ? ` · ${mesiMancanti} ${mesiMancanti === 1 ? "mese non registrato" : "mesi non registrati"} contano 0` : ""}</span>
        </div>
        <div className="row-list">
          {[
            { l: "Entrate lorde", v: contoAnno.lordo, c: "var(--ink)" },
            { l: `− Tasse e contributi (${100 - Math.round(setup.fattoreNetto * 100)}%)`, v: -contoAnno.tasse, c: "var(--ink-2)" },
            { l: "= Netto", v: contoAnno.netto, c: "var(--pos-ink)", b: true },
            { l: "− Costi fissi (12 mesi)", v: -contoAnno.costiFissiAnno, c: "var(--danger)" },
            { l: "− Spese annuali", v: -contoAnno.speseAnnuali, c: "var(--warn)" },
            { l: "= Risparmio dell'anno", v: contoAnno.risparmio, c: contoAnno.risparmio >= 0 ? "var(--pos-ink)" : "var(--danger)", b: true },
          ].map((r) => (
            <div key={r.l} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "11px var(--card-pad)", borderTop: "1px solid var(--hair-soft)", fontWeight: r.b ? 700 : 500 }}>
              <span style={{ color: "var(--ink)" }}>{r.l}</span>
              <span className="num" style={{ color: r.c }}>{r.v < 0 ? "− " : ""}{fmtN(Math.abs(r.v))} €</span>
            </div>
          ))}
        </div>
      </section>
      {annoPrecImporto != null && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="trend" size={15} />{anno} vs {anno - 1}</div>
            <span className="panel-note">lordo incassato · si aggiorna a ogni mese registrato</span>
          </div>
          <div className="panel-pad" style={{ paddingTop: 4 }}>
            <div style={{ display: "flex", gap: 26, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
              <div>
                <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 500, letterSpacing: "-.02em", color: "var(--accent)" }}>{fmtN(lordoAnnoCorrente)} €</div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{anno} · in corso</div>
              </div>
              <div style={{ fontSize: 22, color: "var(--ink-3)", paddingBottom: 6 }}>vs</div>
              <div>
                <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-2)" }}>{fmtN(annoPrecImporto)} €</div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{anno - 1} · totale</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 500, color: yoyDeltaPct >= 0 ? "var(--pos-ink)" : "var(--danger)" }}>
                  {yoyDeltaPct >= 0 ? "+" : ""}{yoyDeltaPct}%
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{yoyDeltaAbs >= 0 ? "+" : ""}{fmtN(yoyDeltaAbs)} € sul {anno - 1}</div>
              </div>
            </div>
            <div className="statbar-track" style={{ height: 8 }}>
              <div className="statbar-fill" style={{ width: Math.min(100, annoPrecImporto ? (lordoAnnoCorrente / annoPrecImporto) * 100 : 0) + "%", background: yoyDeltaPct >= 0 ? "var(--pos)" : "var(--danger)" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-3)", marginTop: 6 }}>
              <span>0 €</span>
              <span>obiettivo {anno - 1}: {fmtN(annoPrecImporto)} €</span>
            </div>
          </div>
        </section>
      )}

      </div>

      {/* Panoramica annuale */}
      <section className="panel" id="sez-anno">
        <div className="panel-head">
          <div className="panel-title"><Icon name="bars" size={15} />Panoramica {anno}</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v" style={{ color: "var(--pos-ink)" }}>{formatCurrency(totReale)}</div>
              <div className="l">Netto reale</div>
            </div>
            <div className="si">
              <div className="v" style={{ color: "var(--info)" }}>{formatCurrency(totProiezione)}</div>
              <div className="l">Proiezione netto</div>
            </div>
            <div className="si">
              <div className="v" style={{ color: "var(--ink)" }}>{formatCurrency(totAnno)}</div>
              <div className="l">Totale netto anno</div>
            </div>
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div className="legend" style={{ marginBottom: 10 }}>
            <span className="li"><span className="sw" style={{ background: P.pos }}></span>Registrato</span>
            <span className="li"><span className="sw" style={{ background: P.warn }}></span>Stimato</span>
            <span className="li"><span className="sw" style={{ background: P.info }}></span>Proiezione</span>
            {breakEvenLordo && <span className="li"><span className="sw" style={{ background: P.danger }}></span>Sotto soglia costi</span>}
            <span className="li"><span className="sw" style={{ background: P.hair }}></span>Mancante</span>
            {hasSplit && <span className="li" style={{ color: "var(--ink-3)" }}>½ alcuni clienti sono a competenza 50/50</span>}
          </div>

          {mesiMancanti > 0 && (
            <div className={styles.annualWarning}>
              <Icon name="alert" size={14} />
              {mesiMancanti} {mesiMancanti === 1 ? "mese passato non registrato" : "mesi passati non registrati"} — il totale anno è sottostimato. Aggiornali in Setup → Storico.
            </div>
          )}

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={annualData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="mese" tick={{ fill: P.ink2, fontSize: 11.5, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: P.ink3, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${kfmt(v)}€`} width={46} />
              <Tooltip
                cursor={{ fill: "rgba(60,44,28,.05)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#A39684", fontWeight: 700 }}
                itemStyle={{ color: "#E9E0D0" }}
                formatter={(v, name, props) => [
                  formatCurrency(v),
                  props.payload.tipo === "reale" ? "Netto reale" : props.payload.tipo === "mancante" ? "Non registrato" : props.payload.tipo === "stimato" ? "Netto stimato" : "Netto proiez.",
                ]}
              />
              <Bar dataKey="netto" radius={[4, 4, 0, 0]} maxBarSize={46}>
                {annualData.map((entry, i) => {
                  let fill = tipoColor[entry.tipo];
                  if (totaleCostiFissi > 0 && entry.tipo !== "reale" && entry.tipo !== "mancante" && entry.netto < totaleCostiFissi) {
                    fill = P.danger;
                  }
                  return <Cell key={i} fill={fill} opacity={entry.tipo === "mancante" ? 0.5 : 1} />;
                })}
              </Bar>
              {totaleCostiFissi > 0 && (
                <ReferenceLine
                  y={totaleCostiFissi}
                  stroke={P.danger}
                  strokeDasharray="5 5"
                  strokeOpacity={0.8}
                  label={{ value: `costi fissi ${fmtN(totaleCostiFissi)} €`, position: "insideTopRight", fill: P.danger, fontSize: 11, fontWeight: 600 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Andamento del guadagno orario reale per cliente */}
      <section className="panel" id="sez-clienti">
        <div className="panel-head">
          <div className="panel-title"><Icon name="trend" size={15} />Andamento €/h per cliente</div>
          <span className="panel-note">€/h reale lordo, mese per mese · dai mesi con le ore lavorate</span>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          {datiClienti.length >= 2 ? (
            <>
              <div className="legend" style={{ marginBottom: 8 }}>
                {serieClientiDati.clienti.map((c, i) => (
                  <span key={c.id} className="li"><span className="sw line" style={{ background: serieClienti[i % serieClienti.length] }}></span>{c.nome}</span>
                ))}
                {lordoOraMedio != null && <span className="li"><span className="sw line" style={{ background: P.ink3 }}></span>media attuale {fmtN(lordoOraMedio)} €/h</span>}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={datiClienti} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <XAxis dataKey="mese" tick={{ fill: P.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: P.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} width={46} />
                  <Tooltip
                    cursor={{ stroke: P.hair, strokeWidth: 1 }}
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "#A39684", fontWeight: 700 }}
                    itemStyle={{ color: "#E9E0D0" }}
                    formatter={(v, name) => [`${fmtN(v)} €/h`, name]}
                  />
                  {lordoOraMedio != null && <ReferenceLine y={lordoOraMedio} stroke={P.ink3} strokeDasharray="4 4" />}
                  {serieClientiDati.clienti.map((c, i) => (
                    <Line key={c.id} type="monotone" dataKey={c.id} name={c.nome} stroke={serieClienti[i % serieClienti.length]} strokeWidth={2}
                      connectNulls dot={{ r: 4, strokeWidth: 2, fill: P.dotFill }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 6 }}>
                Se una linea scende, quel cliente ti sta chiedendo più ore per lo stesso compenso: è il momento di rinegoziare.
              </p>
            </>
          ) : (
            <p style={{ color: "var(--ink-3)", fontSize: 13 }}>
              Servono almeno due mesi con le ore lavorate. Ogni mese, nell&apos;aggiornamento con l&apos;assistente, scrivi anche le ore per cliente: qui vedrai come cambia il tuo €/h reale con ognuno.
            </p>
          )}
        </div>
      </section>


      {/* Incassato storico */}
      {sortedStorico.length > 0 && (
        <section className="panel" id="sez-storico">
          <div className="panel-head">
            <div className="panel-title"><Icon name="history" size={15} />Incassato storico</div>
            <span className="panel-note">{sortedStorico.length} mesi · valori lordi e netti</span>
          </div>
          <div className={styles.storicoLayout}>
            <div className="hist">
              {(() => {
                const half = Math.ceil(sortedStorico.length / 2);
                const cols = [sortedStorico.slice(0, half), sortedStorico.slice(half)];
                const renderRow = (r, i) => {
                  const meseShort = (() => {
                    const k = chiaveMese(r.mese);
                    if (!k) return r.mese;
                    const [y, m] = k.split("-");
                    return `${MESI_SHORT[Number(m) - 1]} '${y.slice(2)}`;
                  })();
                  const profR = totaleCostiFissi > 0 ? r.netto - totaleCostiFissi : null;
                  return (
                    <div key={i} className="hrow">
                      <span className="mo">{meseShort}</span>
                      <span className="amts num">
                        <span className="g">{fmtN(r.lordo)} €</span>
                        <span className="n">{fmtN(r.netto)} €</span>
                      </span>
                      {profR !== null && (
                        <span className={"delta num" + (profR < 0 ? " neg" : "")}>
                          {profR >= 0 ? "+" : ""}{fmtN(profR)} €
                        </span>
                      )}
                    </div>
                  );
                };
                return (
                  <>
                    <div>{cols[0].map(renderRow)}</div>
                    <div>{cols[1].map(renderRow)}</div>
                  </>
                );
              })()}
            </div>
            {ytdMesi > 0 && (
              <div className="ytd-rail">
                <div className="ytd-item">
                  <div className="v t-info num">{fmtN(ytdLordo)} €</div>
                  <div className="l">Lordo incassato YTD</div>
                  <div className="s">{ytdMesi} {ytdMesi === 1 ? "mese registrato" : "mesi registrati"}</div>
                </div>
                <div className="ytd-item">
                  <div className="v t-pos num">{fmtN(ytdNetto)} €</div>
                  <div className="l">Netto incassato YTD</div>
                  <div className="s">somma dei netti registrati</div>
                </div>
                {ytdProfitto !== null && (
                  <div className="ytd-item">
                    <div className={"v num " + (ytdProfitto >= 0 ? "t-pos" : "t-danger")}>
                      {ytdProfitto >= 0 ? "+" : ""}{fmtN(ytdProfitto)} €
                    </div>
                    <div className="l">Profitto YTD</div>
                    <div className="s">netto − {fmtN(totaleCostiFissi)} €/mese × {ytdMesi}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stato commesse + Fee per cliente */}
      <div className="grid cols-2-asym">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="pie" size={15} />Stato commesse</div>
            <span className="panel-note">{statoTotal} commesse totali</span>
          </div>
          <div className="row-list" style={{ paddingBottom: 8 }}>
            {statoCount.map((entry) => {
              const pct = statoTotal > 0 ? Math.round((entry.value / statoTotal) * 100) : 0;
              return (
                <div className="statbar-row" key={entry.name}>
                  <div className="statbar-top">
                    <span className="statbar-lab">
                      <span className="d" style={{ background: entry.color }}></span>
                      {entry.name}
                    </span>
                    <span className="statbar-val"><b>{entry.value}</b>{pct}%</span>
                  </div>
                  <div className="statbar-track">
                    <div className="statbar-fill" style={{ width: pct + "%", background: entry.color }}></div>
                  </div>
                </div>
              );
            })}
            {statoTotal === 0 && (
              <p style={{ color: "var(--ink-3)", fontSize: 13.5, padding: "14px var(--card-pad)" }}>Nessuna commessa</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="bars" size={15} />{hasIncassatoReale ? "Fee vs incassato per cliente" : "Fee mensile per cliente"}</div>
            <div className="legend">
              <span className="li"><span className="sw" style={{ background: "var(--accent)" }}></span>Fee lorda</span>
              <span className="li"><span className="sw" style={{ background: P.pos }}></span>Netto</span>
              {hasIncassatoReale && <span className="li"><span className="sw" style={{ background: P.info }}></span>Incassato reale (media/mese)</span>}
            </div>
          </div>
          <div className="panel-pad" style={{ paddingTop: 4 }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <XAxis dataKey="nome" tick={{ fill: P.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: P.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${kfmt(v)}€`} width={46} />
                <Tooltip
                  cursor={{ fill: "rgba(60,44,28,.05)" }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#A39684", fontWeight: 700 }}
                  itemStyle={{ color: "#E9E0D0" }}
                  formatter={(v, name, props) => [
                    formatCurrency(v),
                    name === "Incassato"
                      ? `Incassato reale (media su ${props.payload.mesiIncassati} ${props.payload.mesiIncassati === 1 ? "mese" : "mesi"})`
                      : name === "Lordo" ? "Fee lorda" : name,
                  ]}
                />
                <Bar dataKey="Lordo" fill={P.impegnate} radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Netto" fill={P.pos} radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />
                {hasIncassatoReale && <Bar dataKey="Incassato" fill={P.info} radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Scadute — da confermare */}
      {scadute.length > 0 && (
        <section className="panel" style={{ borderColor: "color-mix(in oklab, var(--danger) 30%, var(--hair))" }}>
          <div className="panel-head">
            <div className="panel-title" style={{ color: "var(--danger)" }}>
              <Icon name="alert" size={15} />Scadute — da confermare
            </div>
            <span className="panel-note">confermi tu la chiusura · poi vengono archiviate</span>
          </div>
          <div className="row-list">
            {scadute.map((c) => {
              const days = daysUntil(c.fine);
              return (
                <div key={c.id} className="lrow" style={{ gridTemplateColumns: "1fr auto auto", gap: 14 }}>
                  <div>
                    <div className="nm">{c.cliente}</div>
                    <div className="meta">{c.servizio}</div>
                  </div>
                  <span className="deadline-chip urgent" style={{ justifySelf: "end" }}>
                    <b>{days === 0 ? "scade oggi" : `scaduta ${Math.abs(days)}gg fa`}</b>
                  </span>
                  <button className="btn btn-primary" onClick={() => handleConfermaScaduta(c)}>
                    <Icon name="check" size={16} /> Conferma chiusura
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Commesse in scadenza */}
      {inScadenza.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="clock" size={15} />Commesse in scadenza</div>
            <span className="panel-note">ordinate per urgenza · finestra {setup.alertScadenzaGiorni} giorni</span>
          </div>
          <div className="row-list">
            {inScadenza.map((c) => {
              const days = daysUntil(c.fine);
              const col = days <= 7 ? "var(--danger)" : days <= 21 ? "var(--warn)" : "var(--pos)";
              const maxDays = setup.alertScadenzaGiorni || 60;
              return (
                <div key={c.id} className="lrow dl-row">
                  <div>
                    <div className="nm">{c.cliente}</div>
                    <div className="meta">{c.servizio}</div>
                    <div className="dl-bar">
                      <i style={{ width: (100 - Math.min(100, (days / maxDays) * 100)) + "%", background: col }}></i>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="dl-days num" style={{ color: col }}>{days === 0 ? "Oggi" : days}</span>
                    {days > 0 && <span style={{ fontSize: 12.5, color: "var(--ink-3)", marginLeft: 4 }}>giorni</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ReportMese r={{
        mese: meseCorrente, meseRegistrato, lordo: lordoMese, netto: nettoMese, costi: totaleCostiFissi, profitto: profittoMensile,
        tasse: tasseMese, ora: lordoOraMedio, oraNetto: nettoOraMedio, oreImpegnate: oreTotali, oreLibere, righe: righeTempo,
        anno, tasseMaturate, debito: debitoFiscale, f24: prossimiF24, patrimonio, cassaLibera, cash: cashFlowData, conto: contoAnno, taxRate,
      }} />

      <KpiDrillModal
        drill={drill}
        onClose={() => setDrill(null)}
        commesse={commesse}
        setCommesse={setCommesse}
        setup={setup}
        setSetup={setSetup}
        meseCorrente={meseCorrente}
        meseRegistrato={meseRegistrato}
      />
    </div>
  );
}

// Blocco "incassato reale del mese": totale registrato + pagamenti per cliente
function IncassatoReale({ meseRegistrato, meseCorrente, commesse, rowStyle, money, netto }) {
  const pagamenti = pagamentiDelMese(commesse, meseCorrente);
  const sommaClienti = pagamenti.reduce((s, p) => s + p.importo, 0);
  const totale = netto ? meseRegistrato.netto : meseRegistrato.lordo;
  const nonAttribuito = meseRegistrato.lordo - sommaClienti;
  return (
    <>
      <div style={{ ...rowStyle, fontWeight: 700, background: "var(--panel-2)" }}>
        <span>{netto ? "Netto" : "Lordo"} incassato · {meseCorrente}</span>
        <span className={"num " + (netto ? "t-pos" : "t-accent")}>{money(totale)}</span>
      </div>
      {!netto && pagamenti.map((p, i) => (
        <div key={i} style={rowStyle}>
          <div><div className="nm">{p.cliente}</div>{p.nota && <div className="meta">{p.nota}</div>}</div>
          <span className="num">{money(p.importo)}</span>
        </div>
      ))}
      {!netto && pagamenti.length > 0 && nonAttribuito !== 0 && (
        <div style={rowStyle}>
          <span className="meta">{nonAttribuito > 0 ? "Non attribuito a un cliente" : "Pagamenti clienti oltre il totale registrato"}</span>
          <span className="num" style={{ color: "var(--warn)" }}>{money(nonAttribuito)}</span>
        </div>
      )}
      {!netto && pagamenti.length === 0 && (
        <p style={{ padding: "8px var(--card-pad)", fontSize: 12.5, color: "var(--ink-3)" }}>
          Nessun pagamento per cliente registrato questo mese: dillo all&apos;assistente (es. «Domò mi ha pagato 1.690 €») per vedere il dettaglio.
        </p>
      )}
      <div style={{ padding: "14px var(--card-pad) 4px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        Previsto da contratti
      </div>
    </>
  );
}

function KpiDrillModal({ drill, onClose, commesse, setCommesse, setup, setSetup, meseCorrente, meseRegistrato }) {
  if (!drill) return null;
  const factor = setup.fattoreNetto;
  const attive = commesse.filter((c) => c.stato === "In corso" || c.stato === "In scadenza");
  const costiFissi = setup.costiFissi || [];
  const costiMensili = costiFissi.filter((c) => c.tipo !== "annuale");
  const costiAnnuali = costiFissi.filter((c) => c.tipo === "annuale");

  const setCommessaField = (id, field, val) =>
    setCommesse((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val === "" ? null : Number(val) } : c)));
  const setCostoField = (id, field, val) =>
    setSetup((prev) => ({
      ...prev,
      costiFissi: (prev.costiFissi || []).map((c) => (c.id === id ? { ...c, [field]: Number(val) } : c)),
    }));

  const META = {
    lordoAttivo: meseRegistrato
      ? { title: `Lordo · ${meseCorrente}`, icon: "card", note: "Incassato reale del mese (dallo storico) con i pagamenti per cliente; sotto, le fee da contratto." }
      : { title: "Lordo mensile attivo", icon: "card", note: "Fee lorda mensile delle commesse in corso e in scadenza. Modifica qui la fee mensile." },
    nettoAttivo: meseRegistrato
      ? { title: `Netto · ${meseCorrente}`, icon: "trend", note: `Netto reale del mese dallo storico; sotto, il previsto = lordo × ${(factor * 100).toFixed(0)}%.` }
      : { title: "Netto mensile attivo", icon: "trend", note: `Netto stimato = lordo × ${(factor * 100).toFixed(0)}% (fattore in Setup).` },
    commesseAttive: { title: "Commesse attive", icon: "folder", note: "Commesse in corso o in scadenza." },
    upsell: { title: "Potenziale upsell", icon: "spark", note: "Obiettivo di upsell per commessa. Modifica i target qui." },
    costiMensili: { title: "Costi mensili", icon: "coin", note: "Voci di costo fisso mensile. Modifica gli importi qui." },
    profitto: { title: "Profitto mensile", icon: "wallet", note: meseRegistrato ? "Netto reale del mese meno i costi fissi mensili." : "Netto mensile previsto meno i costi fissi mensili." },
    speseAnnuali: { title: "Spese annuali", icon: "calendar", note: "Spese annuali promemoria. Modifica gli importi annui qui." },
    equivMensile: { title: "Equivalente mensile spese annuali", icon: "divide", note: "Spese annuali divise per 12." },
    orario: { title: "Guadagno orario per commessa", icon: "clock", note: `Lordo/mese diviso ore/mese stimate; netto = lordo × ${(factor * 100).toFixed(0)}%. Il reale arriva dai pagamenti registrati con le ore lavorate.` },
    tempo: { title: `Ore del mese · ${meseCorrente}`, icon: "calendar", note: "Ore stimate al mese per commessa: modificale qui. Le ore disponibili si cambiano in Setup." },
    tasse: { title: "Tasse da accantonare", icon: "receipt", note: `Ogni mese metti da parte il ${Math.round((1 - factor) * 100)}% del lordo per tasse e contributi (aliquota in Setup). Le scadenze F24 sono nella sezione «Tasse e F24».` },
    obiettivi: { title: "Obiettivi", icon: "target", note: "Lascia vuoto un campo per non usarlo. Il riepilogo in alto mostra a che punto sei." },
    patrimonio: { title: "Patrimonio", icon: "wallet", note: "Aggiorna i valori: la cassa è il punto di partenza del cash flow, crypto e beni sono riserve." },
  };
  const meta = META[drill];

  const money = (n) => `${fmtN(n)} €`;
  const rowStyle = { display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "11px var(--card-pad)", borderTop: "1px solid var(--hair-soft)" };

  let body = null;

  if (drill === "lordoAttivo") {
    const tot = attive.reduce((s, c) => s + (getCommessaLordoMensile(c) || 0), 0);
    body = (
      <>
        {meseRegistrato && (
          <IncassatoReale meseRegistrato={meseRegistrato} meseCorrente={meseCorrente} commesse={commesse} rowStyle={rowStyle} money={money} />
        )}
        {attive.map((c) => {
          const mensile = c.lordoMensile != null;
          const val = getCommessaLordoMensile(c);
          return (
            <div key={c.id} style={rowStyle}>
              <div><div className="nm">{c.cliente}</div><div className="meta">{mensile ? "fee mensile" : "progetto · mensilizzato"}</div></div>
              {mensile ? (
                <input className="input num" style={{ width: 130 }} type="number" min="0" value={c.lordoMensile ?? ""} onChange={(e) => setCommessaField(c.id, "lordoMensile", e.target.value)} />
              ) : (
                <span className="num" style={{ color: "var(--ink-2)" }}>{val ? money(val) : "—"}</span>
              )}
            </div>
          );
        })}
        {attive.length === 0 && <p style={{ padding: "12px var(--card-pad)", color: "var(--ink-3)" }}>Nessuna commessa attiva.</p>}
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Totale fee commesse attive</span><span className="num t-accent">{money(tot)}</span></div>
        {(() => {
          const now = new Date();
          const competenza = getLordoPerMese(now.getMonth(), now.getFullYear(), commesse);
          if (Math.round(competenza) === Math.round(tot)) return null;
          return (
            <div style={rowStyle}>
              <div>
                <div className="nm">Di competenza di {meseCorrente}</div>
                <div className="meta">conta solo le commesse attive nelle loro date di inizio/fine, con lo split 50/50 dove impostato</div>
              </div>
              <span className="num t-accent">{money(competenza)}</span>
            </div>
          );
        })()}
      </>
    );
  } else if (drill === "nettoAttivo") {
    const totLordo = attive.reduce((s, c) => s + (getCommessaLordoMensile(c) || 0), 0);
    body = (
      <>
        {meseRegistrato && (
          <IncassatoReale meseRegistrato={meseRegistrato} meseCorrente={meseCorrente} commesse={commesse} rowStyle={rowStyle} money={money} netto />
        )}
        {attive.map((c) => {
          const l = getCommessaLordoMensile(c) || 0;
          return (
            <div key={c.id} style={rowStyle}>
              <div><div className="nm">{c.cliente}</div><div className="meta">lordo {money(l)}</div></div>
              <span className="num t-pos">{money(calcNetto(l, factor))}</span>
            </div>
          );
        })}
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Netto totale ({(factor * 100).toFixed(0)}%)</span><span className="num t-pos">{money(calcNetto(totLordo, factor))}</span></div>
      </>
    );
  } else if (drill === "commesseAttive") {
    body = (
      <>
        {attive.map((c) => (
          <div key={c.id} style={rowStyle}>
            <div><div className="nm">{c.cliente}</div><div className="meta">{c.servizio}</div></div>
            <span className={"pill s-" + getStatoTone(c.stato)}><span className="d"></span>{c.stato}</span>
          </div>
        ))}
        {attive.length === 0 && <p style={{ padding: "12px var(--card-pad)", color: "var(--ink-3)" }}>Nessuna commessa attiva.</p>}
      </>
    );
  } else if (drill === "upsell") {
    const conUpsell = commesse.filter((c) => c.upsellTarget || c.stato === "In corso" || c.stato === "In scadenza" || c.stato === "Da chiarire");
    const tot = commesse.reduce((s, c) => s + (Number(c.upsellTarget) || 0), 0);
    body = (
      <>
        {conUpsell.map((c) => (
          <div key={c.id} style={rowStyle}>
            <div><div className="nm">{c.cliente}</div><div className="meta">{c.servizio}</div></div>
            <input className="input num" style={{ width: 130 }} type="number" min="0" placeholder="0" value={c.upsellTarget ?? ""} onChange={(e) => setCommessaField(c.id, "upsellTarget", e.target.value)} />
          </div>
        ))}
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Totale upsell</span><span className="num t-info">{money(tot)}</span></div>
      </>
    );
  } else if (drill === "costiMensili") {
    const tot = costiMensili.reduce((s, c) => s + c.importo, 0);
    body = (
      <>
        {costiMensili.map((c) => (
          <div key={c.id} style={rowStyle}>
            <span className="nm">{c.nome}</span>
            <input className="input num" style={{ width: 120 }} type="number" min="0" value={c.importo} onChange={(e) => setCostoField(c.id, "importo", e.target.value)} />
          </div>
        ))}
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Totale mensile</span><span className="num t-danger">{money(tot)}</span></div>
      </>
    );
  } else if (drill === "profitto") {
    const totLordo = attive.reduce((s, c) => s + (getCommessaLordoMensile(c) || 0), 0);
    const netto = meseRegistrato ? meseRegistrato.netto : calcNetto(totLordo, factor);
    const costi = costiMensili.reduce((s, c) => s + c.importo, 0);
    body = (
      <>
        <div style={rowStyle}><span className="nm">{meseRegistrato ? `Netto incassato · ${meseCorrente}` : "Netto mensile previsto"}</span><span className="num t-pos">{money(netto)}</span></div>
        <div style={rowStyle}><span className="nm">− Costi fissi mensili</span><span className="num t-danger">− {money(costi)}</span></div>
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>= Profitto mensile</span><span className={"num " + (netto - costi >= 0 ? "t-pos" : "t-danger")}>{money(netto - costi)}</span></div>
      </>
    );
  } else if (drill === "speseAnnuali") {
    const tot = costiAnnuali.reduce((s, c) => s + (c.importoAnnuale || c.importo * 12), 0);
    body = (
      <>
        {costiAnnuali.map((c) => (
          <div key={c.id} style={rowStyle}>
            <span className="nm">{c.nome}</span>
            <input className="input num" style={{ width: 130 }} type="number" min="0" value={c.importoAnnuale || c.importo * 12} onChange={(e) => setCostoField(c.id, "importoAnnuale", e.target.value)} />
          </div>
        ))}
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Totale annuo</span><span className="num t-warn">{money(tot)}</span></div>
      </>
    );
  } else if (drill === "orario" || drill === "tempo") {
    const righe = attive.map((c) => {
      const lordo = getCommessaLordoMensile(c) || 0;
      const ore = Number(c.oreMensili) || 0;
      const reale = orarioRealeCommessa(c);
      return { c, lordo, ore, lordoOra: ore && lordo ? Math.round(lordo / ore) : null, reale };
    });
    const oreTot = righe.reduce((s, r) => s + r.ore, 0);
    const oreDisp = setup.oreMeseDisponibili ?? 160;
    body = (
      <>
        {righe.map(({ c, lordo, lordoOra, reale }) => (
          <div key={c.id} style={rowStyle}>
            <div>
              <div className="nm">{c.cliente}</div>
              <div className="meta">
                {lordo ? `${money(lordo)}/mese` : "senza fee"}
                {lordoOra != null && ` · ${fmtN(lordoOra)} €/h lordo · ${fmtN(lordoOra * factor)} €/h netto`}
                {reale && ` · reale ${fmtN(reale.lordoOra)} €/h su ${reale.mesi} ${reale.mesi === 1 ? "mese" : "mesi"}`}
              </div>
            </div>
            {drill === "tempo" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input className="input num" style={{ width: 90 }} type="number" min="0" step="0.5" placeholder="ore" value={c.oreMensili ?? ""} onChange={(e) => setCommessaField(c.id, "oreMensili", e.target.value)} />
                <span style={{ color: "var(--ink-3)", fontSize: 12 }}>h/mese</span>
              </span>
            ) : (
              <span className="num t-info" style={{ fontWeight: 700 }}>{lordoOra != null ? `${fmtN(lordoOra)} €/h` : "—"}</span>
            )}
          </div>
        ))}
        {attive.length === 0 && <p style={{ padding: "12px var(--card-pad)", color: "var(--ink-3)" }}>Nessuna commessa attiva.</p>}
        <div style={{ ...rowStyle, fontWeight: 700 }}>
          <span>{drill === "tempo" ? `Impegnate ${fmtN(oreTot)} h su ${oreDisp} h` : "Media pesata sulle ore"}</span>
          <span className={"num " + (drill === "tempo" ? "t-pos" : "t-info")}>
            {drill === "tempo"
              ? `${fmtN(Math.max(0, oreDisp - oreTot))} h libere`
              : (() => { const l = righe.filter((r) => r.ore).reduce((s, r) => s + r.lordo, 0); return oreTot ? `${fmtN(l / oreTot)} €/h` : "—"; })()}
          </span>
        </div>
      </>
    );
  } else if (drill === "patrimonio") {
    const p = calcPatrimonio(setup);
    const oggiIso = new Date().toISOString().slice(0, 10);
    const setVal = (patch) => setSetup((prev) => ({ ...prev, ...patch }));
    const setBene = (id, patch) => setSetup((prev) => ({ ...prev, altriAsset: (prev.altriAsset || []).map((b) => (b.id === id ? { ...b, ...patch, aggiornato: oggiIso } : b)) }));
    body = (
      <>
        <div style={rowStyle}>
          <div><div className="nm">Cassa sul conto</div><div className="meta">{setup.cassaData ? `al ${dataBreve(setup.cassaData)}` : "data non indicata"} · base del cash flow</div></div>
          <input className="input num" style={{ width: 130 }} type="number" min="0" value={setup.cassaIniziale ?? ""} onChange={(e) => setVal({ cassaIniziale: Number(e.target.value) || 0, cassaData: oggiIso })} />
        </div>
        <div style={rowStyle}>
          <div><div className="nm">Crypto</div><div className="meta">{setup.cryptoAggiornato ? `al ${dataBreve(setup.cryptoAggiornato)}` : ""}</div></div>
          <input className="input num" style={{ width: 130 }} type="number" min="0" value={setup.crypto ?? ""} onChange={(e) => setVal({ crypto: Number(e.target.value) || 0, cryptoAggiornato: new Date().toLocaleDateString("it-IT") })} />
        </div>
        {(setup.altriAsset || []).map((b) => (
          <div key={b.id} style={rowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input className="input" style={{ maxWidth: 220 }} value={b.nome} onChange={(e) => setBene(b.id, { nome: e.target.value })} />
              <button className="btn btn-quiet" title="Rimuovi" onClick={() => setSetup((prev) => ({ ...prev, altriAsset: (prev.altriAsset || []).filter((x) => x.id !== b.id) }))}><Icon name="trash" size={14} /></button>
            </div>
            <input className="input num" style={{ width: 130 }} type="number" min="0" value={b.valore ?? ""} onChange={(e) => setBene(b.id, { valore: Number(e.target.value) || 0 })} />
          </div>
        ))}
        <div style={{ ...rowStyle, gridTemplateColumns: "1fr" }}>
          <button className="btn btn-ghost" style={{ justifySelf: "start" }} onClick={() => setSetup((prev) => {
            const beni = prev.altriAsset || [];
            return { ...prev, altriAsset: [...beni, { id: Math.max(0, ...beni.map((x) => x.id || 0)) + 1, nome: "Nuovo bene", valore: 0, aggiornato: oggiIso }] };
          })}><Icon name="plus" size={14} /> Aggiungi un bene</button>
        </div>
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Totale patrimonio</span><span className="num t-accent">{money(p.totale)}</span></div>
      </>
    );
  } else if (drill === "tasse") {
    const lordo = meseRegistrato ? meseRegistrato.lordo : attive.reduce((s, c) => s + (getCommessaLordoMensile(c) || 0), 0);
    body = (
      <>
        <div style={rowStyle}><span className="nm">{meseRegistrato ? `Lordo incassato · ${meseCorrente}` : "Lordo previsto del mese"}</span><span className="num t-accent">{money(lordo)}</span></div>
        <div style={rowStyle}>
          <div><div className="nm">Aliquota complessiva</div><div className="meta">imposta + contributi INPS</div></div>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input className="input num" style={{ width: 80 }} type="number" min="0" max="80" value={Math.round((1 - factor) * 100)}
              onChange={(e) => { const v = Number(e.target.value); if (v >= 0 && v <= 80) setSetup((prev) => ({ ...prev, fattoreNetto: Math.round(100 - v) / 100 })); }} />
            <span style={{ color: "var(--ink-3)" }}>%</span>
          </span>
        </div>
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Da mettere da parte</span><span className="num t-warn">{money(lordo * (1 - factor))}</span></div>
      </>
    );
  } else if (drill === "obiettivi") {
    const ob = setup.obiettivi || {};
    const setOb = (k, v) => setSetup((prev) => ({ ...prev, obiettivi: { ...(prev.obiettivi || {}), [k]: v === "" ? null : Number(v) } }));
    body = (
      <>
        {[
          ["lordoAnno", `Lordo dell'anno ${new Date().getFullYear()}`, "€", "es. 45000"],
          ["orarioMin", "Guadagno orario minimo", "€/h", "es. 60"],
          ["oreLibereMin", "Ore libere al mese", "h", "es. 40"],
        ].map(([k, l, u, ph]) => (
          <div key={k} style={rowStyle}>
            <span className="nm">{l}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input className="input num" style={{ width: 120 }} type="number" min="0" placeholder={ph} value={ob[k] ?? ""} onChange={(e) => setOb(k, e.target.value)} />
              <span style={{ color: "var(--ink-3)", fontSize: 12, width: 28 }}>{u}</span>
            </span>
          </div>
        ))}
      </>
    );
  } else if (drill === "equivMensile") {
    const totAnnuo = costiAnnuali.reduce((s, c) => s + (c.importoAnnuale || c.importo * 12), 0);
    body = (
      <>
        {costiAnnuali.map((c) => {
          const annuo = c.importoAnnuale || c.importo * 12;
          return (
            <div key={c.id} style={rowStyle}>
              <div><div className="nm">{c.nome}</div><div className="meta">{money(annuo)}/anno</div></div>
              <span className="num t-warn">{money(Math.round(annuo / 12))}/mese</span>
            </div>
          );
        })}
        <div style={{ ...rowStyle, fontWeight: 700 }}><span>Equivalente mensile</span><span className="num t-warn">{money(Math.round(totAnnuo / 12))}</span></div>
      </>
    );
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div className="panel-title"><Icon name={meta.icon} size={15} />{meta.title}</div>
          <button className="btn btn-quiet" onClick={onClose} aria-label="Chiudi"><Icon name="x" size={16} /></button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", padding: "0 var(--card-pad) 6px" }}>{meta.note}</p>
        <div className="row-list">{body}</div>
        <div style={{ padding: "14px var(--card-pad)", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose}>Fatto</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MonthlyPrompt({ mese, stimaLordo, fattoreNetto, commesseAttive, onAdd, onAggiorna }) {
  const [open, setOpen] = useState(false);
  const [lordo, setLordo] = useState(stimaLordo);

  function handleAdd() {
    if (!lordo) return;
    const netto = Math.round(Number(lordo) * fattoreNetto);
    onAdd({ mese, lordo: Number(lordo), netto });
  }

  return (
    <div className="notice reveal register-notice" style={{ justifyContent: "space-between" }}>
      <div className="register">
        <div className="cal"><Icon name="calendar" size={20} /></div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>
            Aggiornamento di <b style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{mese}</b>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3, maxWidth: 560 }}>
            Scrivi all&apos;assistente, per ogni commessa, incassato, ore lavorate, data di fine e quanto incasserai:
            aggiorna lui pagamenti, €/h, tempo libero e cash flow. Previsto dai contratti: <b className="num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(stimaLordo)}</b>
            {commesseAttive.length > 0 && <span> ({commesseAttive.length} {commesseAttive.length === 1 ? "commessa" : "commesse"})</span>}
          </div>
        </div>
      </div>

      {!open ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={onAggiorna}>
            <Icon name="spark" size={16} /> Aggiorna con l&apos;assistente
          </button>
          <button className="btn btn-ghost" onClick={() => setOpen(true)}>Solo il totale</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label className="field-label">Lordo incassato (€)</label>
            <input
              type="number"
              className="input num"
              style={{ width: 150 }}
              value={lordo}
              onChange={(e) => setLordo(e.target.value)}
              min="0"
              autoFocus
            />
            {lordo > 0 && (
              <span className="field-note">
                Netto: {formatCurrency(Math.round(Number(lordo) * fattoreNetto))}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Annulla</button>
            <button className="btn btn-primary" onClick={handleAdd}>Aggiungi</button>
          </div>
        </div>
      )}
    </div>
  );
}

const TONE_TXT = { accent: "t-accent", pos: "t-pos", warn: "t-warn", danger: "t-danger", info: "t-info", ink: "t-ink" };

// Numero che "conta" fino al valore (formato it-IT con punti delle migliaia).
// Aggiorna il testo direttamente, senza ri-render; nessuna animazione se il
// dispositivo chiede movimento ridotto o il valore non è numerico.
function AnimatedNumber({ value }) {
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    const target = Number(String(value).replace(/\./g, "").replace(",", "."));
    if (!el || !Number.isFinite(target) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (el) el.textContent = value;
      return;
    }
    const from = prev.current, t0 = performance.now(), dur = 900;
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = nf.format(Math.round(from + (target - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
      else { el.textContent = value; prev.current = target; }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

// Barra fissa per saltare tra le sezioni; evidenzia quella visibile.
const SEZIONI = [
  ["sez-mese", "Questo mese"], ["sez-ai", "Assistente"], ["sez-tempo", "Tempo e €/h"], ["sez-liberi", "Tempo libero"],
  ["sez-pipeline", "Pipeline"], ["sez-cash", "Cash flow"], ["sez-tasse", "Tasse"], ["sez-patrimonio", "Patrimonio"],
  ["sez-conto", "Conto dell'anno"], ["sez-anno", "Anno"], ["sez-clienti", "Clienti"], ["sez-storico", "Storico"],
];
function SectionNav({ sezioni }) {
  const [attiva, setAttiva] = useState("sez-mese");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setAttiva(vis[0].target.id);
    }, { rootMargin: "-70px 0px -60% 0px" });
    SEZIONI.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="section-nav" aria-label="Sezioni della dashboard">
      {sezioni.map(([id, l]) => (
        <button key={id} className={attiva === id ? "on" : ""} aria-current={attiva === id ? "true" : undefined}
          onClick={() => { setAttiva(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{l}</button>
      ))}
    </nav>
  );
}

// Cifra secondaria del riepilogo (netto, profitto, tasse)
function SumStat({ label, value, sub, tone, onClick }) {
  return (
    <button className="sum-stat" onClick={onClick}>
      <span className="ss-lab">{label}</span>
      <span className={"ss-v num " + TONE_TXT[tone]}><AnimatedNumber value={fmtN(value)} /><span className="cur"> €</span></span>
      {sub && <span className="ss-sub">{sub}</span>}
    </button>
  );
}

// Dettaglio del mese nel cash flow: entrate, uscite, F24 e cassa
function CashTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  const riga = (l, v, c) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}><span style={{ color: "#A39684" }}>{l}</span><b style={{ color: c || "#E9E0D0" }} className="num">{formatCurrency(v)}</b></div>
  );
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: "10px 12px", minWidth: 210 }}>
      <div style={{ color: "#A39684", fontWeight: 700, marginBottom: 6 }}>{r.mese} · {r.tipo === "reale" ? "registrato" : "proiezione"}</div>
      {riga("Entrate", r.entrate)}
      {riga("Costi e spese", -r.costi)}
      {r.tasse > 0 && riga("F24", -r.tasse, "#E3A27F")}
      {riga("Flusso del mese", r.flusso, r.flusso >= 0 ? "#9CC496" : "#E3A27F")}
      <div style={{ borderTop: "1px solid #392F26", margin: "6px 0" }}></div>
      {riga("Cassa", r.cassa)}
      {r.cassaScenario != null && riga("Cassa con scenario", r.cassaScenario, "#E2BE6E")}
    </div>
  );
}

// Trattative: modifica in linea, probabilità e "simula"
function PipelineEditor({ pipeline, setSetup, fattoreNetto, mediaOra }) {
  const aggiorna = (id, patch) => setSetup((prev) => ({ ...prev, pipeline: (prev.pipeline || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const togli = (id) => setSetup((prev) => ({ ...prev, pipeline: (prev.pipeline || []).filter((p) => p.id !== id) }));
  const aggiungi = () => setSetup((prev) => {
    const lista = prev.pipeline || [];
    const d = new Date();
    const inizio = `${d.getFullYear() + (d.getMonth() === 11 ? 1 : 0)}-${String(((d.getMonth() + 1) % 12) + 1).padStart(2, "0")}-01`;
    return { ...prev, pipeline: [...lista, { id: Math.max(0, ...lista.map((p) => p.id || 0)) + 1, cliente: "", lordoMensile: "", oreMensili: "", probabilita: 50, inizio, mesi: 6, simula: false }] };
  });
  const num = (v) => (v === "" ? "" : Number(v));
  return (
    <div className="pipe">
      {pipeline.length > 0 && (
        <div className="pipe-head">
          <span>Cliente / progetto</span><span>€/mese</span><span>Ore/mese</span><span>Inizio</span><span>Mesi</span><span>Probabilità</span><span>Simula</span><span></span>
        </div>
      )}
      {pipeline.map((p, i) => {
        const ora = Number(p.oreMensili) > 0 && Number(p.lordoMensile) > 0 ? Math.round(p.lordoMensile / p.oreMensili) : null;
        return (
          <div key={p.id} className="pipe-row anim-in" style={{ "--i": i }}>
            <span className="pc-nome">
              <input className="input" placeholder="es. Rossi srl" value={p.cliente} onChange={(e) => aggiorna(p.id, { cliente: e.target.value })} aria-label="Cliente" />
              {ora != null && (
                <small className={mediaOra != null && ora < mediaOra ? "t-warn" : "t-pos"}>
                  {fmtN(ora)} €/h lordi · {fmtN(ora * fattoreNetto)} netti{mediaOra != null ? (ora >= mediaOra ? " · sopra la tua media" : " · sotto la tua media") : ""}
                </small>
              )}
            </span>
            <label className="pf"><span className="pl">€/mese</span><input className="input num" type="number" min="0" placeholder="€" value={p.lordoMensile} onChange={(e) => aggiorna(p.id, { lordoMensile: num(e.target.value) })} /></label>
            <label className="pf"><span className="pl">Ore/mese</span><input className="input num" type="number" min="0" placeholder="h" value={p.oreMensili} onChange={(e) => aggiorna(p.id, { oreMensili: num(e.target.value) })} /></label>
            <label className="pf"><span className="pl">Inizio</span><input className="input" type="month" value={(p.inizio || "").slice(0, 7)} onChange={(e) => aggiorna(p.id, { inizio: e.target.value ? `${e.target.value}-01` : "" })} /></label>
            <label className="pf"><span className="pl">Mesi</span><input className="input num" type="number" min="1" value={p.mesi} onChange={(e) => aggiorna(p.id, { mesi: num(e.target.value) })} /></label>
            <span className="pc-prob">
              <input type="range" min="0" max="100" step="5" value={p.probabilita ?? 50} onChange={(e) => aggiorna(p.id, { probabilita: Number(e.target.value) })} aria-label="Probabilità" />
              <b className="num">{p.probabilita ?? 50}%</b>
            </span>
            <label className="pc-sim"><input type="checkbox" checked={!!p.simula} onChange={(e) => aggiorna(p.id, { simula: e.target.checked })} /><span>Simula</span></label>
            <button className="btn btn-quiet" title="Rimuovi" onClick={() => togli(p.id)} aria-label="Rimuovi trattativa"><Icon name="trash" size={14} /></button>
          </div>
        );
      })}
      <div style={{ padding: "12px var(--card-pad) 0" }}>
        <button className="btn btn-ghost" onClick={aggiungi}><Icon name="plus" size={14} /> Aggiungi trattativa</button>
      </div>
    </div>
  );
}

// Report del mese: invisibile a schermo, è ciò che esce con "Report PDF"
function ReportMese({ r }) {
  const riga = (l, v, b) => <tr key={l} style={b ? { fontWeight: 700 } : null}><td>{l}</td><td className="r">{v}</td></tr>;
  return createPortal(
    <div className="print-report">
      <h1>Report di {r.mese}</h1>
      <p className="pr-sub">Freelance Dashboard · generato il {new Date().toLocaleDateString("it-IT")}</p>
      <h2>Il mese</h2>
      <table><tbody>
        {riga(r.meseRegistrato ? "Lordo incassato" : "Lordo previsto", `${fmtN(r.lordo)} €`, true)}
        {riga("Netto", `${fmtN(r.netto)} €`)}
        {riga("Costi fissi del mese", `${fmtN(r.costi)} €`)}
        {riga("Profitto", `${fmtN(r.profitto)} €`, true)}
        {riga("Tasse da accantonare", `${fmtN(r.tasse)} €`)}
        {riga("€/h medio (lordo / netto)", r.ora != null ? `${fmtN(r.ora)} / ${fmtN(r.oraNetto)} €/h` : "—")}
        {riga("Ore impegnate / libere", `${fmtN(r.oreImpegnate)} h / ${fmtN(r.oreLibere)} h`)}
      </tbody></table>
      <h2>Commesse attive</h2>
      <table>
        <thead><tr><th>Commessa</th><th className="r">Ore/mese</th><th className="r">Lordo/mese</th><th className="r">€/h</th><th className="r">Fine</th><th className="r">Da incassare</th></tr></thead>
        <tbody>{r.righe.map((x) => (
          <tr key={x.c.id}><td>{x.c.cliente}</td><td className="r">{x.ore ? `${fmtN(x.ore)} h` : "—"}</td><td className="r">{x.lordo ? `${fmtN(x.lordo)} €` : "—"}</td><td className="r">{x.lordoOra != null ? `${fmtN(x.lordoOra)} €` : "—"}</td><td className="r">{x.c.fine ? dataBreve(x.c.fine) : "—"}</td><td className="r">{x.residuo != null ? `${fmtN(x.residuo)} €` : "—"}</td></tr>
        ))}</tbody>
      </table>
      <h2>Tasse e F24</h2>
      <table><tbody>
        {riga(`Tasse maturate nel ${r.anno}`, `${fmtN(r.tasseMaturate)} €`)}
        {riga("Da tenere da parte oggi", `${fmtN(r.debito)} €`, true)}
        {r.f24.map((f) => riga(`F24 ${dataBreve(f.data)} · ${f.voce}`, f.importo != null ? `${fmtN(f.importo)} €${f.manuale ? "" : " (stima)"}` : "—"))}
      </tbody></table>
      <h2>Patrimonio</h2>
      <table><tbody>
        {riga("Cassa sul conto", `${fmtN(r.patrimonio.cassa)} €`)}
        {riga("Cassa libera dalle tasse", `${fmtN(r.cassaLibera)} €`)}
        {riga("Crypto", `${fmtN(r.patrimonio.crypto)} €`)}
        {r.patrimonio.altri.map((a) => riga(a.nome, `${fmtN(a.valore)} €`))}
        {riga("Totale", `${fmtN(r.patrimonio.totale)} €`, true)}
      </tbody></table>
      <h2>Cash flow · prossimi 12 mesi</h2>
      <table>
        <thead><tr><th>Mese</th><th className="r">Entrate</th><th className="r">Uscite</th><th className="r">F24</th><th className="r">Cassa</th></tr></thead>
        <tbody>{r.cash.map((x) => (
          <tr key={x.mese}><td>{x.mese}</td><td className="r">{fmtN(x.entrate)} €</td><td className="r">{fmtN(x.costi)} €</td><td className="r">{x.tasse ? `${fmtN(x.tasse)} €` : "—"}</td><td className="r">{fmtN(x.cassa)} €</td></tr>
        ))}</tbody>
      </table>
      <h2>Conto dell&apos;anno {r.anno}</h2>
      <table><tbody>
        {riga("Entrate lorde", `${fmtN(r.conto.lordo)} €`)}
        {riga("Tasse e contributi", `− ${fmtN(r.conto.tasse)} €`)}
        {riga("Costi fissi (12 mesi)", `− ${fmtN(r.conto.costiFissiAnno)} €`)}
        {riga("Spese annuali", `− ${fmtN(r.conto.speseAnnuali)} €`)}
        {riga("Risparmio dell'anno", `${fmtN(r.conto.risparmio)} €`, true)}
      </tbody></table>
      <p className="pr-sub">Stime: tasse con aliquota complessiva {Math.round(r.taxRate * 100)}% e metodo storico; i mesi futuri vengono dai contratti.</p>
    </div>,
    document.body
  );
}
