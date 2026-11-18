import { useState } from "react";
import Assistente from "../Assistente/Assistente";
import Icon from "../Icon";
import { calcolaDashboard, calcolaNote, fmtN, MESI_IT } from "../Dashboard/calcoli";
import { PipelineEditor, ReportMese, KpiDrillModal } from "../Dashboard/Parti";
import { importoCompetenzaMese, oreCommessaMese, registroMese, dataBreve, icsPromemoria } from "../../utils/helpers";
import s from "./DashboardC.module.css";

// Tre direzioni sulla stessa base (Impeccable, modalità Operate):
// - olivetti: la tastiera dei 12 mesi, premi un mese e la pagina mostra quel mese
// - rosa: il listino delle commesse (€/h e variazione) e il calendario in tabella
// - standard: il grafico della cassa nei 12 mesi e la tabella delle commesse
// In tutte: assistente in cima, le tre risposte (ora, tempo, soldi) con lo stesso peso.

const breve = (v) => {
  const a = Math.abs(v);
  const t = a >= 1000 ? `${(a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(".", ",")}k` : String(Math.round(a));
  return v < 0 ? `−${t}` : t;
};
const euro = (v) => `${v < 0 ? "−" : ""}${fmtN(Math.abs(v))} €`;
const meseLungo = (r) => (r ? `${MESI_IT[r.m].toLowerCase()} ${r.y}` : null);
const corto = (m) => MESI_IT[m].slice(0, 3);

export default function DashboardC({ variante = "olivetti", commesse, setCommesse, setup, setSetup }) {
  const [drill, setDrill] = useState(null);
  const [scelto, setScelto] = useState(0); // mese selezionato (olivetti)
  const [trattative, setTrattative] = useState(false);
  const [tuttiAvvisi, setTuttiAvvisi] = useState(false);
  const D = calcolaDashboard(commesse, setup);
  const {
    anno, meseIdx, meseCorrente, meseCorrManc, meseRegistrato, lordoMese, nettoMese,
    attive, righeTempo, oreTotali, oreLibere, oreDisponibili, lordoOraMedio, lordoOraReale,
    mesi12, tempo12, cashFlowData, fineCassa, fineRiserve, riserveVendibili, cassaIniziale, cassaData,
    patrimonio, debitoFiscale, cassaLibera, tasseMaturate, accontiVersati, prossimiF24, f24Override, taxRate,
    contoAnno, annualData, annoPrecImporto, yoyDeltaPct, lordoAnnoCorrente, totaleCostiFissi, totaleCostiAnnuali, totaleCostiAnnualiMensile,
    usciteMensili, pipeline, mesiAutonomia, mesiAutonomiaRiserve, goals, serieClientiDati, statoCount, statoTotal,
    costiFissiMensili, saturazione, aliquotaEffettiva, taxRateF24,
  } = D;

  const conferma = (c) => {
    if (!confirm(`Confermi che «${c.cliente}» è conclusa? Verrà archiviata come Conclusa.`)) return;
    setCommesse((prev) => prev.map((x) => (x.id === c.id ? { ...x, stato: "Concluso" } : x)));
  };
  const note = calcolaNote(D, { conferma, inserisciOre: () => setDrill("tempo") });
  const vaiA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const VAI = { "sez-cash": "vc-mesi", "sez-tasse": "vc-soldi", "sez-liberi": "vc-mesi", "sez-clienti": "vc-commesse", "sez-tempo": "vc-commesse", "sez-pipeline": "vc-commesse" };

  // — I 12 mesi, ognuno con le sue commesse (nel mese in corso valgono incassi e ore registrati) —
  const cassaDi = (m, y) => cashFlowData.find((r) => r.m === m && r.y === y) || null;
  const mesi = mesi12.map(({ m, y }, i) => {
    const corrente = i === 0;
    const voci = commesse.map((c) => {
      const reg = corrente ? registroMese(c, m, y) : null;
      const v = reg?.presente ? reg.importo : importoCompetenzaMese(c, m, y);
      const ore = reg?.ore > 0 ? reg.ore : oreCommessaMese(c, m, y);
      return { c, v, ore, reale: !!reg?.presente, ora: ore > 0 ? Math.round(v / ore) : null };
    }).filter((x) => x.v > 0 || x.ore > 0).sort((a, b) => (b.ora ?? -1) - (a.ora ?? -1));
    const cf = cassaDi(m, y);
    return {
      m, y, i, voci,
      libere: tempo12[i].libere, impegnate: tempo12[i].impegnate,
      entrate: corrente ? voci.reduce((t, x) => t + x.v, 0) : tempo12[i].lordo,
      f24: cf?.tasse || 0, uscite: cf?.costi ?? usciteMensili,
      // il cash flow parte dal mese dopo la data della cassa: nel mese in corso vale la cassa di oggi
      cassa: cf ? cf.cassa : corrente ? cassaIniziale : null,
    };
  });
  const tutteOre = mesi.flatMap((x) => x.voci.map((v) => v.ora)).filter((v) => v != null);
  const oraMin = tutteOre.length ? Math.min(...tutteOre) : 0;
  const oraMax = tutteOre.length ? Math.max(...tutteOre) : 0;
  const gradino = (ora) => (ora == null ? 0 : oraMax === oraMin ? 5 : 1 + Math.round(((ora - oraMin) / (oraMax - oraMin)) * 4));
  const maxLibere = Math.max(1, oreDisponibili);

  // — Commesse: €/h di adesso e variazione rispetto al mese reale precedente —
  const perOra = [...righeTempo].sort((a, b) => (b.lordoOra ?? -1) - (a.lordoOra ?? -1));
  const maxOra = Math.max(1, ...perOra.map((r) => r.lordoOra || 0));
  const variazione = (r) => {
    const punti = serieClientiDati.righe.map((x) => x[r.c.id]).filter((v) => v != null);
    const prima = punti.length >= 2 ? punti[punti.length - 2] : null;
    if (prima == null || r.lordoOra == null || !prima) return null;
    return Math.round(((r.lordoOra - prima) / prima) * 100);
  };

  const prossimoF24 = prossimiF24.find((f) => f.importo > 0) || null;
  // L'anno con lo stesso lordo del mese in corso usato da riepilogo e tabella
  const annoDati = annualData.map((d, i) => (i === meseIdx && d.tipo !== "reale" ? { ...d, lordo: mesi[0].entrate } : d));
  const lordoAnnoC = annoDati.reduce((t, d) => t + d.lordo, 0);
  const risparmioAnnoC = Math.round(lordoAnnoC * (1 - taxRateF24)) - contoAnno.costiFissiAnno - contoAnno.speseAnnuali;
  const maxAnno = Math.max(1, ...annoDati.map((d) => d.lordo));
  const sel = mesi[scelto];
  // Un solo lordo e una sola aliquota per il mese: il lordo è quello della tabella
  // del mese (registrato dove c'è, contratti altrove), le tasse usano l'aliquota
  // effettiva dei tuoi F24 quando c'è (altrimenti quella del Setup).
  const fattoreEff = 1 - taxRateF24;
  const lordoDelMese = meseRegistrato ? lordoMese : mesi[0].entrate;
  const nettoDelMese = meseRegistrato ? nettoMese : Math.round(lordoDelMese * fattoreEff);
  const profittoDelMese = nettoDelMese - totaleCostiFissi;
  const tasseMese = Math.round(lordoDelMese * taxRateF24);
  const nettoOra = (lordo) => (lordo != null ? Math.round(lordo * fattoreEff) : null);
  // Cassa a fine mese e ore di lavoro nei 12 mesi (per le tre risposte)
  const maxCassaMesi = Math.max(1, ...mesi.map((x) => Math.abs(x.cassa ?? 0)));
  const maxImpegnate = Math.max(1, ...mesi.map((x) => x.impegnate));

  const setOverride = (key, val) => setSetup((prev) => {
    const o = { ...(prev.f24 || {}) };
    if (val === "") delete o[key]; else o[key] = Number(val);
    return { ...prev, f24: o };
  });
  const keyGiugno = `${anno}-06`;
  const giugnoPagato = (setup.f24Pagati || {})[keyGiugno] || {};
  const setGiugno = (campo, val) => setSetup((prev) => ({
    ...prev,
    f24Pagati: { ...(prev.f24Pagati || {}), [keyGiugno]: { ...((prev.f24Pagati || {})[keyGiugno] || {}), [campo]: val === "" ? null : Number(val) } },
  }));
  const scaricaPromemoria = () => {
    const blob = new Blob([icsPromemoria(window.location.origin)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "promemoria-dashboard.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  // ───────────────────────── blocchi ─────────────────────────

  const treRisposte = (
    <section className={s.tre} aria-label="Le tre risposte">
      <button className={s.risposta} onClick={() => setDrill("orario")}>
        <span className={s.rLab}><Icon name="clock" size={14} />La tua ora</span>
        <span className={s.rNum}>{lordoOraMedio != null ? fmtN(lordoOraMedio) : "—"}<small> €/h</small></span>
        <span className={s.rSub}>{lordoOraMedio != null ? `${fmtN(nettoOra(lordoOraMedio))} netti` : "inserisci le ore"}{lordoOraReale != null ? ` · reale ${anno} ${fmtN(lordoOraReale)}` : ""}</span>
        <span className={s.rMini}>
          {perOra.slice(0, 3).map((r) => (
            <span key={r.c.id} className={s.rRiga}>
              <span className={s.rNome}>{r.c.cliente}</span>
              <span className={s.rBarra}><i className={s["g" + gradino(r.lordoOra)]} style={{ width: `${((r.lordoOra || 0) / maxOra) * 100}%` }} /></span>
              <b>{r.lordoOra != null ? fmtN(r.lordoOra) : "—"}</b>
            </span>
          ))}
        </span>
      </button>
      <button className={s.risposta} onClick={() => vaiA("vc-mesi")}>
        <span className={s.rLab}><Icon name="calendar" size={14} />Il tuo tempo</span>
        <span className={s.rNum}>{fmtN(oreLibere)}<small> h libere</small></span>
        <span className={s.rSub}>{fmtN(oreTotali)} h di lavoro su {oreDisponibili} a {MESI_IT[meseIdx].toLowerCase()} · {saturazione}%</span>
        <span className={s.rVis} role="img" aria-label="Ore di lavoro nei prossimi 12 mesi">
          {mesi.map((x) => <i key={x.i} style={{ height: `${Math.max(x.impegnate ? 6 : 0, (x.impegnate / maxImpegnate) * 100)}%` }} title={`${MESI_IT[x.m]}: ${fmtN(x.impegnate)} h di lavoro, ${fmtN(x.libere)} libere`} />)}
        </span>
        <span className={s.rVisLab}>ore di lavoro nei prossimi 12 mesi: quando calano hai tempo da vendere</span>
      </button>
      <button className={s.risposta} onClick={() => vaiA("vc-soldi")}>
        <span className={s.rLab}><Icon name="wallet" size={14} />I tuoi soldi</span>
        <span className={s.rNum}>{fineCassa ? meseLungo(fineCassa) : "oltre 3 anni"}</span>
        <span className={s.rSub}>
          {fineCassa ? "la cassa basta fino a qui" : "la cassa regge con i contratti attuali"}
          {fineCassa && riserveVendibili > 0 && ` · vendendo crypto e beni: ${fineRiserve ? meseLungo(fineRiserve) : "oltre 3 anni"}`}
        </span>
        <span className={s.rSub}>Cassa {euro(cassaIniziale)} · libera dalle tasse {euro(cassaLibera)}</span>
        <span className={s.rVis + " " + s.rVisCassa} role="img" aria-label="Cassa a fine mese nei prossimi 12 mesi">
          {mesi.map((x) => (
            <i key={x.i} className={x.cassa != null && x.cassa < 0 ? s.sotto0 : undefined}
              style={{ height: `${Math.max(4, (Math.abs(x.cassa ?? 0) / maxCassaMesi) * 100)}%` }}
              title={`${MESI_IT[x.m]}: cassa ${x.cassa != null ? euro(x.cassa) : "—"}`} />
          ))}
        </span>
        <span className={s.rVisLab}>cassa a fine mese nei prossimi 12 mesi</span>
      </button>
    </section>
  );

  const avvisi = note.length > 0 && (
    <ul className={s.avvisi}>
      {(tuttiAvvisi ? note : note.slice(0, 3)).map((n) => (
        <li key={n.k} className={s["av_" + n.livello]}>
          <span className={s.avTesto}>{n.testo}</span>
          {n.azione && <button className={s.link} onClick={n.azione.fn}>{n.azione.label}</button>}
          {n.vai && <button className={s.link} onClick={() => vaiA(VAI[n.vai] || n.vai)}>Vedi</button>}
        </li>
      ))}
      {note.length > 3 && (
        <li className={s.altri}><button className={s.link} onClick={() => setTuttiAvvisi((v) => !v)}>{tuttiAvvisi ? "Mostra meno" : `Mostra tutti (${note.length})`}</button></li>
      )}
    </ul>
  );

  const obiettivi = (
    <div className={s.obiettivi}>
      <span className={s.oLab}><Icon name="target" size={14} />Obiettivi</span>
      {goals.length === 0 ? (
        <button className={s.link} onClick={() => setDrill("obiettivi")}>Imposta lordo annuo, €/h minimo e ore libere</button>
      ) : goals.map((g) => {
        const pct = Math.min(100, Math.round((g.val / g.target) * 100));
        const ok = g.val >= g.target;
        return (
          <button key={g.id} className="goal" onClick={() => setDrill("obiettivi")} title={g.nota}>
            <span className="goal-top"><span>{g.label}</span><b className={"num " + (ok ? "t-pos" : "t-warn")}>{g.fmt(g.val)} <span>/ {g.fmt(g.target)}</span></b></span>
            <span className="statbar-track"><span className="statbar-fill" style={{ display: "block", width: pct + "%", background: ok ? "var(--pos)" : "var(--warn)" }}></span></span>
          </button>
        );
      })}
    </div>
  );

  // Dettaglio di un mese: commesse e conti
  const dettaglioMese = (x) => (
    <div className={s.dettaglio}>
      <div className={s.dCommesse}>
        <table className={s.tab}>
          <thead><tr><th>Commessa</th><th className={s.r}>Ore</th><th className={s.r}>Incasso</th><th className={s.r}>€/h</th></tr></thead>
          <tbody>
            {x.voci.map((v) => (
              <tr key={v.c.id}>
                <td><span className={s.nome}>{v.c.cliente}</span>{v.reale && <span className={s.meta}>registrato</span>}</td>
                <td className={s.r}>{v.ore ? `${fmtN(v.ore)} h` : "—"}</td>
                <td className={s.r}>{euro(v.v)}</td>
                <td className={s.r}><span className={`${s.chip} ${s["g" + gradino(v.ora)]}`}>{v.ora != null ? fmtN(v.ora) : "—"}</span></td>
              </tr>
            ))}
            {x.voci.length === 0 && <tr><td colSpan={4} className={s.vuoto}>Nessuna commessa in questo mese: è tutto tempo da vendere.</td></tr>}
          </tbody>
        </table>
      </div>
      <dl className={s.conti}>
        <div><dt>Ore libere</dt><dd className={s.tempoTxt}>{fmtN(x.libere)} h</dd></div>
        <div><dt>Entrate lorde</dt><dd>{euro(x.entrate)}</dd></div>
        <div><dt>Costi e spese</dt><dd>{euro(-x.uscite)}</dd></div>
        {x.f24 > 0 && <div><dt>F24</dt><dd className={s.warn}>{euro(-x.f24)}</dd></div>}
        <div className={s.totale}><dt>Cassa a fine mese</dt><dd className={x.cassa != null && x.cassa < 0 ? s.neg : undefined}>{x.cassa != null ? euro(x.cassa) : "—"}</dd></div>
        {riserveVendibili > 0 && x.cassa != null && <div><dt>con riserve vendute</dt><dd>{euro(x.cassa + riserveVendibili)}</dd></div>}
      </dl>
    </div>
  );

  // ── Firma Olivetti: la tastiera dei 12 mesi ──
  const tastiera = (
    <section id="vc-mesi" className={s.blocco}>
      <div className={s.testaBlocco}>
        <h2><Icon name="calendar" size={15} />I prossimi 12 mesi</h2>
        <p>Premi un mese: sotto vedi le sue commesse, il €/h e la cassa.</p>
      </div>
      <div className={s.tasti} role="tablist" aria-label="Mesi">
        {mesi.map((x) => (
          <button key={x.i} role="tab" aria-selected={scelto === x.i} className={s.tasto + (scelto === x.i ? " " + s.premuto : "")} onClick={() => setScelto(x.i)}>
            <span className={s.tMese}>{corto(x.m)}{(x.m === 0 || x.i === 0) && <small> {x.y}</small>}</span>
            <span className={s.tOre}>{fmtN(x.libere)}<small>h</small></span>
            <span className={s.tCassa + (x.cassa != null && x.cassa < 0 ? " " + s.neg : "")}>
              {x.cassa != null ? breve(x.cassa) : "—"}{x.f24 > 0 && <b className={s.tF24} title={`F24 ${euro(x.f24)}`}> F24</b>}
            </span>
          </button>
        ))}
      </div>
      <h3 className={s.sotto}>{MESI_IT[sel.m]} {sel.y}{scelto === 0 ? " · questo mese" : ""}</h3>
      {dettaglioMese(sel)}
    </section>
  );

  // ── Firma Pagine rosa: listino e calendario ──
  const listino = (
    <section id="vc-commesse" className={s.blocco}>
      <div className={s.testaBlocco}>
        <h2>Listino delle commesse</h2>
        <p>€/h di {MESI_IT[meseIdx].toLowerCase()} (reale se hai registrato le ore) e variazione sul mese precedente</p>
      </div>
      <div className={s.scorri}>
        <table className={s.tab + " " + s.tabListino}>
          <thead><tr><th>Commessa</th><th className={s.r}>€/h</th><th className={s.r}>Var.</th><th className={s.r}>Netto/h</th><th className={s.r}>Ore</th><th className={s.r}>Lordo/mese</th><th className={s.r}>Fine</th><th className={s.r}>Da incassare</th></tr></thead>
          <tbody>
            {perOra.map((r) => {
              const v = variazione(r);
              return (
                <tr key={r.c.id}>
                  <td><span className={s.nome}>{r.c.cliente}</span>{r.variabile > 0 && <span className={s.meta}>fisso + variabile</span>}</td>
                  <td className={s.r + " " + s.big}>{r.lordoOra != null ? fmtN(r.lordoOra) : "—"}</td>
                  <td className={s.r + " " + (v == null ? "" : v >= 0 ? s.pos : s.neg)}>{v == null ? "—" : `${v >= 0 ? "▲ +" : "▼ −"}${Math.abs(v)}%`}</td>
                  <td className={s.r}>{r.lordoOra != null ? fmtN(nettoOra(r.lordoOra)) : "—"}</td>
                  <td className={s.r}>{r.ore ? `${fmtN(r.ore)}${r.oreReali ? "*" : ""}` : "—"}</td>
                  <td className={s.r}>{r.lordo ? fmtN(r.lordo) : "—"}</td>
                  <td className={s.r}>{r.c.fine ? dataBreve(r.c.fine) : "—"}</td>
                  <td className={s.r}>{r.residuo != null ? fmtN(r.residuo) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={s.nota}>* ore registrate questo mese. Media: {lordoOraMedio != null ? `${fmtN(lordoOraMedio)} €/h` : "—"}.</p>
      <div className={s.testaBlocco} id="vc-mesi">
        <h2>Calendario dei prossimi 12 mesi</h2>
      </div>
      <div className={s.scorri}>
        <table className={s.tab + " " + s.tabMesi}>
          <thead><tr><th></th>{mesi.map((x) => <th key={x.i} className={s.r + (x.i === 0 ? " " + s.oggi : "")}>{corto(x.m)}{(x.m === 0 || x.i === 0) && <small> {String(x.y).slice(2)}</small>}</th>)}</tr></thead>
          <tbody>
            <tr><th>Ore libere</th>{mesi.map((x) => <td key={x.i} className={s.r + " " + s.tempoTxt}>{fmtN(x.libere)}</td>)}</tr>
            <tr><th>Entrate</th>{mesi.map((x) => <td key={x.i} className={s.r}>{x.entrate ? breve(x.entrate) : "—"}</td>)}</tr>
            <tr><th>F24</th>{mesi.map((x) => <td key={x.i} className={s.r + (x.f24 ? " " + s.warn : "")}>{x.f24 ? `−${breve(x.f24)}` : ""}</td>)}</tr>
            <tr className={s.rigaForte}><th>Cassa</th>{mesi.map((x) => <td key={x.i} className={s.r + (x.cassa != null && x.cassa < 0 ? " " + s.neg : "")}>{x.cassa != null ? breve(x.cassa) : "—"}</td>)}</tr>
            {riserveVendibili > 0 && <tr><th>+ riserve</th>{mesi.map((x) => <td key={x.i} className={s.r}>{x.cassa != null ? breve(x.cassa + riserveVendibili) : "—"}</td>)}</tr>}
          </tbody>
        </table>
      </div>
    </section>
  );

  // ── Firma Standard: grafico della cassa ──
  const W = 720, H = 220, PX = 40, PY = 16;
  const valori = mesi.map((x) => x.cassa ?? 0);
  const conRis = valori.map((v) => v + riserveVendibili);
  const yMax = Math.max(1, ...valori, ...(riserveVendibili ? conRis : []));
  const yMin = Math.min(0, ...valori);
  const X = (i) => PX + (i * (W - PX * 2)) / 11;
  const Y = (v) => PY + ((yMax - v) * (H - PY * 2)) / (yMax - yMin || 1);
  const linea = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const grafico = (
    <section id="vc-mesi" className={s.blocco}>
      <div className={s.testaBlocco}>
        <h2><Icon name="flow" size={15} />Cassa nei prossimi 12 mesi</h2>
        <p>Entrate dei contratti meno costi, spese annuali e F24{riserveVendibili > 0 ? "; tratteggio: vendendo crypto e beni" : ""}</p>
      </div>
      <svg className={s.svg} viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Andamento della cassa nei prossimi 12 mesi">
        <line x1={PX} x2={W - PX} y1={Y(0)} y2={Y(0)} className={s.zero} />
        <path d={`${linea(valori)} L${X(11)},${Y(Math.max(0, yMin))} L${X(0)},${Y(Math.max(0, yMin))} Z`} className={s.area} />
        {riserveVendibili > 0 && <path d={linea(conRis)} className={s.lineaRis} />}
        <path d={linea(valori)} className={s.linea} />
        {mesi.map((x, i) => (
          <g key={i}>
            <circle cx={X(i)} cy={Y(valori[i])} r={4} className={valori[i] < 0 ? s.puntoNeg : s.punto}>
              <title>{`${MESI_IT[x.m]} ${x.y}: cassa ${euro(valori[i])}${x.f24 ? `, F24 ${euro(x.f24)}` : ""}`}</title>
            </circle>
            {x.f24 > 0 && <text x={X(i)} y={Y(valori[i]) + 20} className={s.etF24}>F24</text>}
            <text x={X(i)} y={H + 18} className={s.etMese}>{corto(x.m)}</text>
          </g>
        ))}
        <text x={X(0)} y={Y(valori[0]) - 10} className={s.etVal}>{breve(valori[0])}</text>
        <text x={X(11)} y={Y(valori[11]) - 10} className={s.etVal + " " + s.etFine}>{breve(valori[11])}</text>
      </svg>
      <div className={s.tempoRiga} aria-label="Ore libere per mese">
        {mesi.map((x) => (
          <span key={x.i} title={`${MESI_IT[x.m]}: ${fmtN(x.libere)} h libere`}>
            <i style={{ height: `${(x.libere / maxLibere) * 100}%` }} />
            <small>{fmtN(x.libere)}</small>
          </span>
        ))}
      </div>
      <p className={s.nota}>Barre verdi: ore libere per mese (su {oreDisponibili}).</p>
    </section>
  );
  const tabellaCommesse = (
    <section id="vc-commesse" className={s.blocco}>
      <div className={s.testaBlocco}><h2><Icon name="clock" size={15} />Commesse</h2><p>Media {lordoOraMedio != null ? `${fmtN(lordoOraMedio)} €/h` : "—"}</p></div>
      <div className={s.scorri}>
        <table className={s.tab}>
          <thead><tr><th>Commessa</th><th className={s.r}>Ore/mese</th><th className={s.r}>Lordo/mese</th><th className={s.r}>€/h</th><th className={s.r}>Netto/h</th><th className={s.r}>Fine</th></tr></thead>
          <tbody>
            {perOra.map((r) => (
              <tr key={r.c.id}>
                <td><span className={s.nome}>{r.c.cliente}</span></td>
                <td className={s.r}>{r.ore ? `${fmtN(r.ore)}${r.oreReali ? " (reali)" : ""}` : "—"}</td>
                <td className={s.r}>{r.lordo ? euro(r.lordo) : "—"}</td>
                <td className={s.r}><span className={`${s.chip} ${s["g" + gradino(r.lordoOra)]}`}>{r.lordoOra != null ? fmtN(r.lordoOra) : "—"}</span></td>
                <td className={s.r}>{r.lordoOra != null ? fmtN(nettoOra(r.lordoOra)) : "—"}</td>
                <td className={s.r}>{r.c.fine ? dataBreve(r.c.fine) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  // ── Comuni: soldi, anno, commesse e trattative ──
  const soldi = (
    <section id="vc-soldi" className={s.blocco}>
      <div className={s.testaBlocco}><h2><Icon name="wallet" size={15} />Soldi</h2><p>Uscite {euro(usciteMensili)} al mese</p></div>
      <dl className={s.libro}>
        <button onClick={() => setDrill("costiMensili")}><dt>Costi fissi mensili<small>{costiFissiMensili.length} voci · ogni mese</small></dt><dd>{euro(totaleCostiFissi)}</dd></button>
        <button onClick={() => setDrill("speseAnnuali")}><dt>Spese annuali<small>promemoria · non le stai pagando ora</small></dt><dd>{euro(totaleCostiAnnuali)}</dd></button>
        <button onClick={() => setDrill("equivMensile")}><dt>Equivalente mensile<small>se le spalmassi ogni mese · nel cash flow</small></dt><dd>{euro(totaleCostiAnnualiMensile)}</dd></button>
        <button onClick={() => setDrill("patrimonio")}><dt>Cassa sul conto<small>{cassaData ? `al ${dataBreve(cassaData)}` : "aggiornala con l'assistente"}</small></dt><dd>{euro(cassaIniziale)}</dd></button>
        <button onClick={() => setDrill("tasse")}><dt>Tasse {anno} maturate<small>{Math.round(taxRateF24 * 100)}% del lordo · {aliquotaEffettiva != null ? "aliquota effettiva dai tuoi F24" : "aliquota del Setup"}{accontiVersati ? `, versati ${fmtN(accontiVersati)}` : ""}</small></dt><dd>{euro(tasseMaturate)}</dd></button>
        <div className={s.totale}><dt>Da tenere da parte · cassa libera</dt><dd>{euro(debitoFiscale)} · {euro(cassaLibera)}</dd></div>
      </dl>
      <h3 className={s.sotto}>F24</h3>
      <div className={s.f24}>
        {meseIdx > 5 && (
          <div className={s.f24Riga}>
            <span>30 giu {anno} · pagato<small>totale e quota di acconto</small></span>
            <span className={s.campi}>
              <input className="input num" type="number" min="0" placeholder="totale" aria-label="Totale F24 giugno" value={giugnoPagato.importo ?? ""} onChange={(e) => setGiugno("importo", e.target.value)} />
              <input className="input num" type="number" min="0" placeholder="acconto" aria-label="Di cui acconto" value={giugnoPagato.acconto ?? ""} onChange={(e) => setGiugno("acconto", e.target.value)} />
            </span>
          </div>
        )}
        {prossimiF24.map((f) => (
          <div key={f.key} className={s.f24Riga}>
            <span>{dataBreve(f.data)}<small>{f.voce} · {f.manuale ? "importo reale" : "stima"}</small></span>
            <span className={s.campi}>
              <input className="input num" type="number" min="0" placeholder={f.importo != null ? String(f.importo) : "€"} aria-label={`Importo F24 ${dataBreve(f.data)}`}
                value={f.manuale ? f24Override[f.key] : ""} onChange={(e) => setOverride(f.key, e.target.value)} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  // Riserve: crypto e beni modificabili in qualsiasi momento; ogni modifica
  // ricalcola patrimonio, fine cassa con le riserve, autonomia e avvisi.
  const oggiIso = new Date().toISOString().slice(0, 10);
  const numero = (v) => (v === "" ? 0 : Math.max(0, Number(v) || 0));
  const setCrypto = (patch) => setSetup((prev) => ({ ...prev, ...patch, cryptoAggiornato: new Date().toLocaleDateString("it-IT") }));
  const setBene = (id, patch) => setSetup((prev) => ({
    ...prev, altriAsset: (prev.altriAsset || []).map((x) => (x.id === id ? { ...x, ...patch, aggiornato: oggiIso } : x)),
  }));
  const togliBene = (b) => {
    if (!confirm(`Togliere «${b.nome || "bene"}» dalle riserve?`)) return;
    setSetup((prev) => ({ ...prev, altriAsset: (prev.altriAsset || []).filter((x) => x.id !== b.id) }));
  };
  const aggiungiBene = () => setSetup((prev) => {
    const beni = prev.altriAsset || [];
    return { ...prev, altriAsset: [...beni, { id: Math.max(0, ...beni.map((x) => Number(x.id) || 0)) + 1, nome: "", valore: 0, realizzo: 80, aggiornato: oggiIso }] };
  });
  const voci = [
    { id: "crypto", nome: "Crypto", valore: Number(setup.crypto) || 0, pct: setup.cryptoRealizzo ?? 95, data: setup.cryptoAggiornato, fisso: true },
    ...(setup.altriAsset || []).map((x) => ({ id: x.id, nome: x.nome, valore: Number(x.valore) || 0, pct: x.realizzo ?? 80, data: x.aggiornato, bene: x })),
  ];
  const riserveBlocco = (
    <section className={s.blocco} id="vc-riserve">
      <div className={s.testaBlocco}>
        <h2><Icon name="wallet" size={15} />Riserve vendibili</h2>
        <p>cambia i valori quando vuoi: si aggiorna tutto</p>
      </div>
      <div className={s.riserve}>
        <div className={s.risTesta} aria-hidden="true"><span>Voce</span><span>Valore</span><span>Vendi al</span><span>Incasseresti</span><span></span></div>
        {voci.map((v) => (
          <div key={v.id} className={s.risRiga}>
            <span className={s.risNome}>
              {v.fisso ? <b>{v.nome}</b> : (
                <input className="input" value={v.nome} placeholder="es. Orologio" aria-label="Nome del bene"
                  onChange={(e) => setBene(v.id, { nome: e.target.value })} />
              )}
              <small>{v.data ? `aggiornato al ${dataBreve(v.data)}` : "mai aggiornato"}</small>
            </span>
            <label className={s.risCampo}><span>Valore</span>
              <input className="input num" type="number" min="0" step="50" value={v.valore || ""} placeholder="0" aria-label={`Valore ${v.nome || "bene"} in euro`}
                onChange={(e) => (v.fisso ? setCrypto({ crypto: numero(e.target.value) }) : setBene(v.id, { valore: numero(e.target.value) }))} />
            </label>
            <label className={s.risCampo}><span>Vendi al %</span>
              <input className="input num" type="number" min="0" max="100" value={v.pct} aria-label={`Percentuale di vendita ${v.nome || "bene"}`}
                onChange={(e) => { const pct = Math.min(100, numero(e.target.value)); if (v.fisso) setCrypto({ cryptoRealizzo: pct }); else setBene(v.id, { realizzo: pct }); }} />
            </label>
            <span className={s.risIncasso}>{euro((v.valore * v.pct) / 100)}</span>
            {v.fisso ? <span /> : (
              <button className="btn btn-quiet" onClick={() => togliBene(v.bene)} aria-label={`Togli ${v.nome || "bene"}`}><Icon name="trash" size={15} /></button>
            )}
          </div>
        ))}
        <button className="btn btn-ghost" onClick={aggiungiBene}><Icon name="plus" size={15} /> Aggiungi un bene</button>
      </div>
      <dl className={s.libro}>
        <div><dt>Patrimonio totale<small>cassa {fmtN(cassaIniziale)} + riserve {fmtN(patrimonio.crypto + patrimonio.totaleAltri)} €</small></dt><dd>{euro(patrimonio.totale)}</dd></div>
        <div><dt>Vendendo tutto oggi incasseresti</dt><dd>{euro(riserveVendibili)}</dd></div>
        <div className={s.totale}><dt>Mesi di autonomia senza incassi<small>{mesiAutonomia ?? "—"} con la sola cassa{fineRiserve || fineCassa ? ` · con le riserve la cassa basta fino a ${fineRiserve ? meseLungo(fineRiserve) : "oltre 3 anni"}` : ""}</small></dt><dd>{mesiAutonomiaRiserve ?? "—"}</dd></div>
      </dl>
    </section>
  );

  const annoBlocco = (
    <section className={s.blocco}>
      <div className={s.testaBlocco}>
        <h2><Icon name="bars" size={15} />{anno}, mese per mese</h2>
        <p>
          {euro(lordoAnnoC)} lordi tra registrati e previsti
          {yoyDeltaPct != null && <> · registrato finora {fmtN(lordoAnnoCorrente)} €, <span className={yoyDeltaPct >= 0 ? s.pos : s.neg}>{yoyDeltaPct >= 0 ? "+" : "−"}{Math.abs(yoyDeltaPct)}%</span> su tutto il {anno - 1} ({fmtN(annoPrecImporto)} €)</>}
          {" "}· risparmio dell&apos;anno <span className={risparmioAnnoC >= 0 ? s.pos : s.neg}>{euro(risparmioAnnoC)}</span> (tasse al {Math.round(taxRateF24 * 100)}%)
        </p>
      </div>
      <div className={s.anno} role="img" aria-label={`Lordo per mese nel ${anno}`}>
        {annoDati.map((d, i) => (
          <div key={i} className={s.annoCol + (i === meseIdx ? " " + s.annoOggi : "")} tabIndex={0}
            title={`${MESI_IT[i]}: ${fmtN(d.lordo)} € lordi (${d.tipo === "reale" ? "registrato" : d.tipo === "mancante" ? "non registrato" : "previsto"})`}>
            <span className={s.annoVal}>{d.lordo ? breve(d.lordo) : ""}</span>
            <span className={s.annoBarra}><i className={s["t_" + d.tipo]} style={{ height: `${Math.max(d.lordo ? 3 : 0, (d.lordo / maxAnno) * 100)}%` }} /></span>
            <span className={s.annoMese}>{corto(i)}</span>
          </div>
        ))}
      </div>
      <div className={s.legenda}>
        <span><i className={s.sw + " " + s.t_reale} />registrato</span>
        <span><i className={s.sw + " " + s.t_stimato} />questo mese</span>
        <span><i className={s.sw + " " + s.t_proiezione} />previsto dai contratti</span>
      </div>
    </section>
  );

  const commesseBlocco = (
    <section className={s.blocco} id={variante === "olivetti" ? "vc-commesse" : undefined}>
      <div className={s.testaBlocco}><h2><Icon name="folder" size={15} />Commesse e trattative</h2><p>{statoTotal} commesse in tutto</p></div>
      <button className={s.statiBtn} onClick={() => setDrill("commesseAttive")} aria-label="Commesse attive">
        <span className={s.stati}>{statoCount.map((x) => <i key={x.name} style={{ flex: x.value, background: x.color }} />)}</span>
      </button>
      <div className={s.legenda}>
        {statoCount.map((x) => <span key={x.name}><i className={s.sw} style={{ background: x.color, borderRadius: 99 }} />{x.name} {x.value}</span>)}
        <button className={s.link} onClick={() => setDrill("upsell")}>Upsell</button>
        <button className={s.link} onClick={() => setTrattative((v) => !v)} aria-expanded={trattative}>{trattative ? "Chiudi le trattative" : `Trattative e ipotesi${pipeline.length ? ` (${pipeline.length})` : ""}`}</button>
      </div>
      {trattative && <PipelineEditor pipeline={pipeline} setSetup={setSetup} fattoreNetto={setup.fattoreNetto} mediaOra={lordoOraMedio} />}
    </section>
  );

  const firma = variante === "olivetti" ? tastiera : variante === "rosa" ? listino : (<>{grafico}{tabellaCommesse}</>);

  return (
    <div className={`${s.root} ${s[variante]}`}>
      <header className={s.testa}>
        <h1 className="page-title">{meseCorrente}</h1>
        <div className={s.azioni}>
          <button className="btn btn-ghost" onClick={() => window.print()} title="Apre la stampa: scegli «Salva come PDF»" aria-label="Report PDF"><Icon name="file" size={16} /><span>Report PDF</span></button>
          <button className="btn btn-ghost" onClick={scaricaPromemoria} title="Evento ricorrente il 1° di ogni mese alle 9:00" aria-label="Promemoria mensile"><Icon name="bell" size={16} /><span>Promemoria</span></button>
        </div>
      </header>

      <div id="vc-ai">
        <Assistente commesse={commesse} setCommesse={setCommesse} setup={setup} setSetup={setSetup}
          sempreAperto meseDaRegistrare={meseCorrManc ? meseCorrente : null} />
      </div>

      <p className={s.riassunto}>
        {MESI_IT[meseIdx]}: <button className={s.nBtn} onClick={() => setDrill("lordoAttivo")}>{euro(lordoDelMese)}</button> lordi {meseRegistrato ? "incassati" : "tra registrati e previsti"},{" "}
        <button className={s.nBtn} onClick={() => setDrill("nettoAttivo")}>{euro(nettoDelMese)}</button> netti,{" "}
        <button className={s.nBtn} onClick={() => setDrill("profitto")}>{euro(profittoDelMese)}</button> di profitto dopo i costi fissi · tasse da parte {euro(tasseMese)} ({Math.round(taxRateF24 * 100)}%{aliquotaEffettiva != null ? ", dai tuoi F24" : ""})
        {prossimoF24 && <> · prossimo F24 {euro(prossimoF24.importo)} il {dataBreve(prossimoF24.data)}</>}
        {" "}· {attive.length} {attive.length === 1 ? "commessa attiva" : "commesse attive"}
      </p>

      {treRisposte}
      {avvisi}
      {obiettivi}
      {firma}
      <div className={s.due}>
        <div className={s.colonna}>
          {annoBlocco}
          {commesseBlocco}
          {riserveBlocco}
        </div>
        {soldi}
      </div>

      <KpiDrillModal drill={drill} onClose={() => setDrill(null)} commesse={commesse} setCommesse={setCommesse}
        setup={setup} setSetup={setSetup} meseCorrente={meseCorrente} meseRegistrato={meseRegistrato} />
      <ReportMese r={{
        mese: meseCorrente, meseRegistrato, lordo: lordoDelMese, netto: nettoDelMese, costi: totaleCostiFissi, profitto: profittoDelMese,
        tasse: tasseMese, ora: lordoOraMedio, oraNetto: nettoOra(lordoOraMedio), oreImpegnate: oreTotali, oreLibere, righe: righeTempo,
        anno, tasseMaturate, debito: debitoFiscale, f24: prossimiF24, patrimonio, cassaLibera, cash: cashFlowData, conto: contoAnno, taxRate,
      }} />
    </div>
  );
}
