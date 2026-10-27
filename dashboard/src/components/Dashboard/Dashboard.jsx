import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ComposedChart, Line,
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

const TIPO_COLOR = {
  reale: C.pos,
  stimato: C.warn,
  proiezione: C.info,
  mancante: C.hair,
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

export default function Dashboard({ commesse, setCommesse, setup, setSetup }) {
  const [drill, setDrill] = useState(null);
  // Testo precompilato per l'assistente (aggiornamento mensile)
  const [seed, setSeed] = useState(null);
  const rootRef = useRef(null);

  // Le sezioni compaiono mentre scorri (una volta sola)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    const vh = window.innerHeight;
    root.querySelectorAll(":scope > section.panel, :scope > .grid > section.panel").forEach((el) => {
      if (el.dataset.rev) return;
      el.dataset.rev = "1";
      if (el.getBoundingClientRect().top < vh) return; // già visibile: niente animazione
      el.classList.add("scroll-reveal");
      io.observe(el);
    });
    return () => io.disconnect();
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
  const satColor = saturazione <= 60 ? C.pos : saturazione <= 85 ? C.warn : C.danger;
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

  // Prossimi 12 mesi: ore impegnate, ore libere e lordo previsto
  const tempo12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(anno, meseIdx + i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const impegnate = commesse.reduce((s, c) => s + oreCommessaMese(c, m, y), 0);
    const lordo = getLordoPerMese(m, y, commesse);
    return {
      mese: `${MESI_SHORT[m]}${y !== anno ? " '" + String(y).slice(2) : ""}`,
      impegnate,
      libere: Math.max(0, oreDisponibili - impegnate),
      lordo,
    };
  });
  const oreLibere12 = tempo12.reduce((s, t) => s + t.libere, 0);

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
  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const d     = new Date(inizioCash.getFullYear(), inizioCash.getMonth() + i, 1);
    const mIdx  = d.getMonth();
    const y     = d.getFullYear();
    const label = `${MESI_IT[mIdx]} ${y}`;
    const recorded = revenueHistory.find(r => stessoMese(r.mese, label));
    const netto = recorded
      ? recorded.netto
      : calcNetto(getLordoPerMese(mIdx, y, commesse), setup.fattoreNetto);
    const tipo  = recorded ? "reale" : "proiezione";
    return { mese: `${MESI_SHORT[mIdx]}${y !== anno ? " '" + String(y).slice(2) : ""}`, netto, costi: usciteMensili, flusso: netto - usciteMensili, tipo };
  }).map((row, i, arr) => ({
    ...row,
    // cassa accumulata = saldo di partenza + somma dei flussi fino a questo mese
    cassa: cassaIniziale + arr.slice(0, i + 1).reduce((s, r) => s + r.flusso, 0),
  }));
  const cassaFinale = cashFlowData[cashFlowData.length - 1]?.cassa ?? cassaIniziale;
  // Primo mese in cui la cassa scende sotto zero (se succede)
  const meseRosso = cashFlowData.find((d) => d.cassa < 0) || null;
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

  const kpis = [
    meseRegistrato
      ? { id: "lordoAttivo", label: `Lordo incassato · ${nomeMese}`, value: fmtN(lordoMese), cur: "€", sub: `reale · previsto ${fmtN(lordoMensileAttivo)} €`, tone: "accent", icon: "card" }
      : { id: "lordoAttivo", label: `Lordo previsto · ${nomeMese}`, value: fmtN(lordoMensileAttivo), cur: "€", sub: `da contratti · ${nomeMese} non ancora registrato`, tone: "accent", icon: "card" },
    meseRegistrato
      ? { id: "nettoAttivo", label: `Netto incassato · ${nomeMese}`, value: fmtN(nettoMese), cur: "€", sub: `reale · previsto ${fmtN(nettoMensileAttivo)} €`, tone: "pos", icon: "trend" }
      : { id: "nettoAttivo", label: `Netto previsto · ${nomeMese}`, value: fmtN(nettoMensileAttivo), cur: "€", sub: `lordo × ${(setup.fattoreNetto * 100).toFixed(0)}%`, tone: "pos", icon: "trend" },
    { id: "orario", label: "Guadagno orario medio", value: lordoOraMedio != null ? fmtN(lordoOraMedio) : "—", cur: lordoOraMedio != null ? "€/h" : null,
      sub: lordoOraMedio != null ? `netto ${fmtN(nettoOraMedio)} €/h${lordoOraReale != null ? ` · reale ${anno} ${fmtN(lordoOraReale)} €/h` : ""}` : "aggiungi le ore alle commesse", tone: "info", icon: "clock" },
    { id: "tempo", label: `Ore libere · ${nomeMese}`, value: fmtN(oreLibere), cur: "h", sub: `${fmtN(oreTotali)} h impegnate su ${oreDisponibili} · ${saturazione}%`, tone: saturazione > 85 ? "danger" : saturazione > 60 ? "warn" : "pos", icon: "calendar" },
    { id: "patrimonio", label: "Patrimonio", value: fmtN(patrimonio.totale), cur: "€", sub: `cassa ${fmtN(patrimonio.cassa)} · crypto ${fmtN(patrimonio.crypto)}${patrimonio.totaleAltri ? ` · beni ${fmtN(patrimonio.totaleAltri)}` : ""}`, tone: "ink", icon: "wallet" },
    ...(totaleCostiFissi > 0 ? [
      { id: "profitto", label: `Profitto · ${nomeMese}`, value: fmtN(profittoMensile), cur: "€", sub: `${meseRegistrato ? "netto reale" : "netto previsto"} − ${fmtN(totaleCostiFissi)} € costi fissi`, tone: profittoMensile >= 0 ? "pos" : "danger", icon: "spark" },
      { id: "costiMensili", label: "Costi fissi mensili", value: fmtN(totaleCostiFissi), cur: "€", sub: `${costiFissiMensili.length} voci`, tone: "danger", icon: "coin" },
    ] : []),
    ...(costiAnnuali.length > 0 ? [
      { id: "speseAnnuali", label: "Spese annuali", value: fmtN(totaleCostiAnnuali), cur: "€", sub: `≈ ${fmtN(totaleCostiAnnualiMensile)} €/mese · nel cash flow`, tone: "warn", icon: "divide" },
    ] : []),
  ];

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }} ref={rootRef}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">
            Panoramica generale
            <span className="badge"><span className="badge-dot"></span>v2 · cash flow</span>
          </div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Panoramica commesse, incassato e cash flow — anno fiscale {anno}.</p>
        </div>
      </header>

      <SectionNav />

      <div id="sez-ai"><Assistente commesse={commesse} setCommesse={setCommesse} setup={setup} setSetup={setSetup} seed={seed} /></div>

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

      <div className="grid kpi-grid" id="sez-mese">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} i={i} onOpen={() => setDrill(k.id)} />)}
      </div>

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
              <div className="v num" style={{ color: "var(--pos-ink)" }}>{fmtN(oreLibere12)} h</div>
              <div className="l">Ore libere in 12 mesi</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(tempo12.reduce((s, t) => s + t.lordo, 0))}</div>
              <div className="l">Lordo da contratti</div>
            </div>
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div className="legend" style={{ marginBottom: 8 }}>
            <span className="li"><span className="sw" style={{ background: "#B5654A" }}></span>Ore impegnate</span>
            <span className="li"><span className="sw" style={{ background: "#CFE0CB" }}></span>Ore libere</span>
            <span className="li"><span className="sw line" style={{ background: C.info }}></span>Lordo previsto (asse destro)</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={tempo12} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="mese" tick={{ fill: C.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="ore" tick={{ fill: C.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} width={44} />
              <YAxis yAxisId="eur" orientation="right" tick={{ fill: C.info, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={kfmt} width={44} />
              <Tooltip
                cursor={{ fill: "rgba(60,44,28,.05)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#A39684", fontWeight: 700 }}
                itemStyle={{ color: "#E9E0D0" }}
                formatter={(v, name) => (name === "Lordo previsto" ? [formatCurrency(v), name] : [`${fmtN(v)} h`, name])}
              />
              <Bar yAxisId="ore" dataKey="impegnate" name="Ore impegnate" stackId="ore" fill="#B5654A" maxBarSize={38} />
              <Bar yAxisId="ore" dataKey="libere" name="Ore libere" stackId="ore" fill="#CFE0CB" radius={[3, 3, 0, 0]} maxBarSize={38} />
              <Line yAxisId="eur" type="monotone" dataKey="lordo" name="Lordo previsto" stroke={C.info} strokeWidth={2.2} dot={{ fill: "#FBF8F2", stroke: C.info, strokeWidth: 2, r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 6 }}>
            Le ore libere crescono quando le commesse finiscono: è il tempo da vendere. Base: ore/mese di ogni commessa nelle sue date di inizio e fine.
          </p>
        </div>
      </section>

      {/* Confronto anno su anno */}
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
            <span className="li"><span className="sw" style={{ background: C.pos }}></span>Registrato</span>
            <span className="li"><span className="sw" style={{ background: C.warn }}></span>Stimato</span>
            <span className="li"><span className="sw" style={{ background: C.info }}></span>Proiezione</span>
            {breakEvenLordo && <span className="li"><span className="sw" style={{ background: C.danger }}></span>Sotto soglia costi</span>}
            <span className="li"><span className="sw" style={{ background: C.hair }}></span>Mancante</span>
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
              <XAxis dataKey="mese" tick={{ fill: C.ink2, fontSize: 11.5, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.ink3, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${kfmt(v)}€`} width={46} />
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
                  let fill = TIPO_COLOR[entry.tipo];
                  if (totaleCostiFissi > 0 && entry.tipo !== "reale" && entry.tipo !== "mancante" && entry.netto < totaleCostiFissi) {
                    fill = C.danger;
                  }
                  return <Cell key={i} fill={fill} opacity={entry.tipo === "mancante" ? 0.5 : 1} />;
                })}
              </Bar>
              {totaleCostiFissi > 0 && (
                <ReferenceLine
                  y={totaleCostiFissi}
                  stroke={C.danger}
                  strokeDasharray="5 5"
                  strokeOpacity={0.8}
                  label={{ value: `costi fissi ${fmtN(totaleCostiFissi)} €`, position: "insideTopRight", fill: C.danger, fontSize: 11, fontWeight: 600 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
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
              <span className="li"><span className="sw" style={{ background: C.pos }}></span>Netto</span>
              {hasIncassatoReale && <span className="li"><span className="sw" style={{ background: C.info }}></span>Incassato reale (media/mese)</span>}
            </div>
          </div>
          <div className="panel-pad" style={{ paddingTop: 4 }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <XAxis dataKey="nome" tick={{ fill: C.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${kfmt(v)}€`} width={46} />
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
                <Bar dataKey="Lordo" fill="#B5654A" radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Netto" fill={C.pos} radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />
                {hasIncassatoReale && <Bar dataKey="Incassato" fill={C.info} radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />}
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

      {/* Patrimonio, conto dell'anno e cash flow */}
      <div className="grid cols-2">
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
            { nome: "Cassa sul conto", valore: patrimonio.cassa, nota: cassaData ? `al ${dataBreve(cassaData)}` : "data non indicata", colore: C.info },
            { nome: "Crypto", valore: patrimonio.crypto, nota: cryptoAggiornato ? `al ${dataBreve(cryptoAggiornato)}` : "", colore: C.warn },
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
      </div>

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
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 6, fontSize: 13, color: "var(--ink-2)" }}>
            <span>Parte da: <b className="num" style={{ color: "var(--ink)" }}>{formatCurrency(cassaIniziale)}</b>{cassaData && <span style={{ color: "var(--ink-3)" }}> al {dataBreve(cassaData)}</span>}</span>
            <span>Uscite/mese: <b className="num" style={{ color: "var(--danger)" }}>{formatCurrency(usciteMensili)}</b> <span style={{ color: "var(--ink-3)" }}>({fmtN(totaleCostiFissi)} fissi + {fmtN(totaleCostiAnnualiMensile)} spese annuali spalmate)</span></span>
          </div>
          {meseRosso && (
            <div className="notice warn" style={{ margin: "8px 0" }}>
              <span className="lab">Con i contratti attuali la cassa va sotto zero a {meseRosso.mese}: servono nuove commesse prima di allora.</span>
            </div>
          )}
          <div className="legend" style={{ marginBottom: 8 }}>
            <span className="li"><span className="sw" style={{ background: C.pos }}></span>Flusso positivo</span>
            <span className="li"><span className="sw" style={{ background: C.danger }}></span>Flusso negativo</span>
            <span className="li"><span className="sw line" style={{ background: C.info }}></span>Cassa accumulata</span>
            <span className="li"><span className="sw" style={{ background: C.hair }}></span>Barre chiare = proiezione</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cashFlowData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="mese" tick={{ fill: C.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="flow" tick={{ fill: C.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={kfmt} width={44} />
              <YAxis yAxisId="cassa" orientation="right" tick={{ fill: C.info, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={kfmt} width={44} />
              <Tooltip
                cursor={{ fill: "rgba(60,44,28,.05)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#A39684", fontWeight: 700 }}
                itemStyle={{ color: "#E9E0D0" }}
                formatter={(value, name) => {
                  if (name === "Cassa") return [formatCurrency(value), "Cassa accumulata"];
                  return [formatCurrency(value), name];
                }}
              />
              <ReferenceLine yAxisId="flow" y={0} stroke="#E4DAC6" strokeWidth={1.4} />
              <Bar yAxisId="flow" dataKey="flusso" name="Flusso netto" radius={[3, 3, 0, 0]} maxBarSize={40}>
                {cashFlowData.map((entry, i) => (
                  <Cell key={i} fill={entry.flusso >= 0 ? C.pos : C.danger} opacity={entry.tipo === "proiezione" ? 0.62 : 1} />
                ))}
              </Bar>
              <Line yAxisId="cassa" type="monotone" dataKey="cassa" name="Cassa" stroke={C.info} strokeWidth={2.4} dot={{ fill: "#FBF8F2", stroke: C.info, strokeWidth: 2, r: 3.4 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

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

const TONE_ICO = { accent: "ico-accent", pos: "ico-pos", warn: "ico-warn", danger: "ico-danger", info: "ico-info", ink: "" };
const TONE_TXT = { accent: "t-accent", pos: "t-pos", warn: "t-warn", danger: "t-danger", info: "t-info", ink: "t-ink" };
const TONE_BAR = { accent: "bar-accent", pos: "bar-pos", warn: "bar-warn", danger: "bar-danger", info: "bar-info", ink: "bar-ink" };

function KpiCard({ label, value, cur, sub, tone, icon, onOpen, i = 0 }) {
  return (
    <div
      style={{ "--i": i }}
      className={"kpi reveal" + (onOpen ? " " + styles.kpiClickable : "")}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}
    >
      <span className={"kpi-accent-bar " + TONE_BAR[tone]}></span>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={"kpi-ico " + TONE_ICO[tone]}><Icon name={icon} size={15} /></span>
      </div>
      <div className={"kpi-val num " + TONE_TXT[tone]}>
        <AnimatedNumber value={value} />{cur && <span className="cur">{cur}</span>}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {onOpen && <span className={styles.kpiHint}>Dettaglio →</span>}
    </div>
  );
}

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
  ["sez-ai", "Assistente"], ["sez-mese", "Questo mese"], ["sez-tempo", "Tempo e €/h"], ["sez-liberi", "Tempo libero"],
  ["sez-anno", "Anno"], ["sez-storico", "Storico"], ["sez-patrimonio", "Patrimonio"], ["sez-conto", "Conto dell'anno"], ["sez-cash", "Cash flow"],
];
function SectionNav() {
  const [attiva, setAttiva] = useState("sez-ai");
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
      {SEZIONI.map(([id, l]) => (
        <button key={id} className={attiva === id ? "on" : ""} aria-current={attiva === id ? "true" : undefined}
          onClick={() => { setAttiva(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{l}</button>
      ))}
    </nav>
  );
}
