import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ComposedChart, Line, LineChart,
} from "recharts";
import {
  formatCurrency,
  daysUntil,
  chiaveMese,
  dataBreve,
  icsPromemoria,
} from "../../utils/helpers";
import Icon from "../Icon";
import { calcolaDashboard, calcolaNote, fmtN, MESI_SHORT } from "./calcoli";
import { PipelineEditor, ReportMese, KpiDrillModal } from "./Parti";
import Assistente from "../Assistente/Assistente";
import styles from "./Dashboard.module.css";


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
  // Scheda aperta sotto il riepilogo (ricordata tra una visita e l'altra)
  const [tab, setTabState] = useState(() => {
    try { return localStorage.getItem("dashTab") || "tempo"; } catch { return "tempo"; }
  });
  const setTab = (t) => { setTabState(t); try { localStorage.setItem("dashTab", t); } catch { /* storage non disponibile */ } };
  const [tutteNote, setTutteNote] = useState(false);

  const D = calcolaDashboard(commesse, setup);
  const {
    storia6, anno, meseIdx, attive, hasSplit, lordoMensileAttivo, nettoMensileAttivo, statoCount, statoTotal, inScadenza, oreDisponibili, righeTempo, oreTotali, oreLibere, saturazione, attiveSenzaOre, lordoOraMedio, nettoOraMedio, lordoOraReale, residuoTotale, pipeline, simulate, scenarioAttivo, commesseScenario, tempo12, oreLibere12, barData, hasIncassatoReale, sortedStorico, meseCorrente, meseCorrManc, meseRegistrato, lordoMese, nettoMese, nomeMese, costiFissiMensili, totaleCostiFissi, totaleCostiAnnuali, totaleCostiAnnualiMensile, cassaIniziale, cryptoAggiornato, patrimonio, cassaData, usciteMensili, mesiAutonomia, profittoMensile, breakEvenLordo, ytdLordo, ytdNetto, ytdMesi, ytdProfitto, lordoAnnoCorrente, annoPrecImporto, yoyDeltaPct, yoyDeltaAbs, annualData, totReale, totProiezione, totAnno, mesiMancanti, contoAnno, taxRate, f24Override, modoTasse, tasseMaturate, accontiVersati, keyGiugno, giugnoPagato, debitoFiscale, cassaLibera, prossimiF24, pipelinePesata, pipelinePiena, orario12, oreLibere12Scenario, riserve, riserveVendibili, cashFlowData, fineCassa, fineRiserve, mesiAutonomiaRiserve, cassaFinale, cassaFinaleScenario, tasseCash, goals, serieClientiDati, datiClienti,
  } = D;

  function handleConfermaScaduta(c) {
    const giorni = daysUntil(c.fine);
    const quando = giorni === 0 ? "scade oggi" : `scaduta da ${Math.abs(giorni)} giorni`;
    if (!confirm(`Confermi che «${c.cliente}» (${quando}) è conclusa? Verrà archiviata come Conclusa e tolta dalle scadenze.`)) return;
    setCommesse((prev) => prev.map((x) => (x.id === c.id ? { ...x, stato: "Concluso" } : x)));
  }
  const satColor = saturazione <= 60 ? P.pos : saturazione <= 85 ? P.warn : P.danger;
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
  // Sezioni → scheda in cui stanno (per i link dal riepilogo e dalle note)
  const TAB_DI = {
    "sez-tempo": "tempo", "sez-liberi": "tempo", "sez-clienti": "tempo",
    "sez-cash": "cassa", "sez-tasse": "cassa", "sez-patrimonio": "cassa",
    "sez-conto": "anno", "sez-anno": "anno", "sez-storico": "anno",
    "sez-pipeline": "pipeline",
  };
  const apri = (id) => {
    if (!id.startsWith("sez-")) { setDrill(id); return; }
    const t = TAB_DI[id];
    const cambia = t && t !== tab;
    if (cambia) setTab(t);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), cambia ? 90 : 0);
  };

  const note = calcolaNote(D, { conferma: handleConfermaScaduta, inserisciOre: () => setDrill("tempo") });
  const noteVisibili = tutteNote ? note : note.slice(0, 3);

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
      { id: "patrimonio", label: "Cassa sul conto", value: `${fmtN(patrimonio.cassa)} €`, tone: "info", sub: `libera dalle tasse ${fmtN(cassaLibera)} €` },
      { id: "sez-cash", label: "Cassa fra 12 mesi", value: `${fmtN(cassaFinale)} €`, tone: cassaFinale >= 0 ? "pos" : "danger", sub: riserveVendibili > 0 ? `${fmtN(cassaFinale + riserveVendibili)} € vendendo crypto e beni` : "cash flow" },
      { id: "sez-cash", label: "Autonomia senza incassi", value: mesiAutonomia != null ? `${mesiAutonomia} mesi` : "—", tone: "ink", sub: mesiAutonomiaRiserve != null && riserveVendibili > 0 ? `${mesiAutonomiaRiserve} mesi vendendo le riserve` : "solo con la cassa" },
    ] },
  ];

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }} >
      <header className="topbar" style={{ marginBottom: 0 }}>
        <h1 className="page-title">{meseCorrente}</h1>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => window.print()} title="Apre la stampa: scegli «Salva come PDF»">
            <Icon name="file" size={16} /><span>Report PDF</span>
          </button>
          <button className="btn btn-ghost" onClick={scaricaPromemoria} title="Evento ricorrente il 1° di ogni mese alle 9:00">
            <Icon name="bell" size={16} /><span>Promemoria</span>
          </button>
        </div>
      </header>

      {/* L'assistente è sempre in cima: è dove scrivi ogni volta */}
      <div id="sez-ai">
        <Assistente commesse={commesse} setCommesse={setCommesse} setup={setup} setSetup={setSetup}
          sempreAperto meseDaRegistrare={meseCorrManc ? meseCorrente : null} />
      </div>

      {/* Il mese in un colpo d'occhio */}
      <section className="panel summary" id="sez-mese">
        <div className="sum-hero">
          <div className="sum-eyebrow">{meseRegistrato ? "Lordo incassato" : "Lordo previsto dai contratti"}</div>
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
          <div className="storia" role="img" aria-label="Lordo degli ultimi sei mesi">
            {storia6.map((x, i) => (
              <span key={i} className={(x.corrente ? "ora" : "") + (x.prev ? " prev" : "")} title={`${MESI_SHORT[x.m]} ${x.y}: ${fmtN(x.lordo)} €${x.prev ? " previsti" : ""}`}>
                <b><i style={{ height: `${Math.max(x.lordo ? 4 : 0, (x.lordo / Math.max(1, ...storia6.map((z) => z.lordo))) * 100)}%`, "--i": i }} /></b>
                {MESI_SHORT[x.m]}
              </span>
            ))}
          </div>
          <div className="sum-trio">
            <SumStat label="Netto" value={nettoMese} tone="pos" sub={meseRegistrato ? `incassato · previsto ${fmtN(nettoMensileAttivo)}` : `previsto · lordo × ${Math.round(setup.fattoreNetto * 100)}%`} onClick={() => setDrill("nettoAttivo")} />
            <SumStat label="Profitto" value={profittoMensile} tone={profittoMensile >= 0 ? "pos" : "danger"} sub={`netto − ${fmtN(totaleCostiFissi)} € fissi`} onClick={() => setDrill("profitto")} />
            <SumStat label="Tasse" value={tasseMese} tone="warn" sub={`da parte · ${Math.round(taxRate * 100)}% del lordo`} onClick={() => setDrill("tasse")} />
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

      {/* Da sapere: solo ciò che richiede attenzione */}
      {note.length > 0 && (
        <section className="panel note-box" aria-label="Da sapere">
          <div className="note-head">
            <span className="sum-gtitle"><Icon name="bell" size={13} />Da sapere</span>
            {note.length > 3 && (
              <button className="btn btn-quiet" onClick={() => setTutteNote((v) => !v)}>
                {tutteNote ? "Mostra meno" : `Mostra tutte (${note.length})`}
              </button>
            )}
          </div>
          {noteVisibili.map((n, i) => (
            <div key={n.k} className={"nota nota-" + n.livello} style={{ "--i": i }}>
              <span className="nota-ico"><Icon name={n.icon} size={15} /></span>
              <span className="nota-testo">{n.testo}</span>
              {n.azione && <button className="btn btn-ghost" onClick={n.azione.fn}>{n.azione.label}</button>}
              {n.vai && <button className="btn btn-quiet" onClick={() => apri(n.vai)}>Vedi →</button>}
            </div>
          ))}
        </section>
      )}

      {/* Il resto, diviso per argomento */}
      <div className="tab-bar" role="tablist" aria-label="Approfondimenti">
        {TABS.map(([id, label, icon, corto]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <Icon name={icon} size={15} /><span className="lungo">{label}</span><span className="corto">{corto}</span>
          </button>
        ))}
      </div>

      <div key={tab} className="tab-body grid" style={{ gap: "var(--gap)" }} role="tabpanel">
        {tab === "tempo" && (
          <>
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
                        <td className="r num">
                          {r.lordo ? `${fmtN(r.lordo)} €` : "—"}
                          {r.variabile > 0 && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>di cui {fmtN(r.variabile)} variabile</div>}
                        </td>
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
            {righeTempo.filter((r) => r.suggerito).map((r) => (
              <span key={r.c.id} className="variabile-hint">
                {r.c.cliente}: ultimo mese {fmtN(r.suggerito.ultimoTotale)} €, oltre la fee fissa di {fmtN(r.c.lordoMensile)} €.{" "}
                <button className="btn btn-ghost" onClick={() => setCommesse((prev) => prev.map((x) => (x.id === r.c.id ? { ...x, variabileMensile: r.suggerito.media } : x)))}>
                  Conta {fmtN(r.suggerito.media)} €/mese di variabile
                </button>
              </span>
            ))}
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


          </>
        )}
        {tab === "cassa" && (
          <>
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
              {riserveVendibili > 0 && (
                <div className="si">
                  <div className="v num" style={{ color: "var(--pos-ink)" }}>{formatCurrency(cassaFinale + riserveVendibili)}</div>
                  <div className="l">Vendendo le riserve</div>
                </div>
              )}
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
            <div className="runway">
              <div>
                <span className="rw-l">Senza nuovi clienti la cassa finisce a</span>
                <b className={"num " + (fineCassa ? "t-danger" : "t-pos")}>{fineCassa ? fineCassa.mese : "oltre 3 anni"}</b>
                <span className="rw-s">{mesiAutonomia != null ? `${mesiAutonomia} mesi anche senza nessun incasso` : ""}</span>
              </div>
              {riserveVendibili > 0 && (
                <div>
                  <span className="rw-l">Vendendo anche crypto e beni (≈ {fmtN(riserveVendibili)} €)</span>
                  <b className={"num " + (fineRiserve ? "t-warn" : "t-pos")}>{fineRiserve ? fineRiserve.mese : "oltre 3 anni"}</b>
                  <span className="rw-s">{riserve.map((r) => `${r.nome} ${fmtN((r.valore * r.pct) / 100)} € (${r.pct}%)`).join(" · ")}</span>
                </div>
              )}
              <button className="btn btn-quiet" onClick={() => setDrill("patrimonio")}>Prezzi di vendita →</button>
            </div>
            <div className="legend" style={{ marginBottom: 8 }}>
              <span className="li"><span className="sw" style={{ background: P.pos }}></span>Flusso positivo</span>
              <span className="li"><span className="sw" style={{ background: P.danger }}></span>Flusso negativo</span>
              <span className="li"><span className="sw line" style={{ background: P.info }}></span>Cassa accumulata</span>
              {riserveVendibili > 0 && <span className="li"><span className="sw line" style={{ background: P.pos }}></span>Cassa + riserve vendute</span>}
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
                {riserveVendibili > 0 && <Line yAxisId="cassa" type="monotone" dataKey="cassaRiserve" name="Cassa + riserve vendute" stroke={P.pos} strokeWidth={1.6} strokeDasharray="2 4" dot={false} />}
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
            {meseIdx > 5 && (
              <div className="lrow f24-pagato" style={{ cursor: "default" }}>
                <div>
                  <div className="nm">F24 · 30 giu {anno} · pagato</div>
                  <div className="meta">saldo {anno - 1} + 1° acconto {anno}: scrivi il totale pagato e quanto era acconto</div>
                </div>
                <span className="f24-campi">
                  <label>totale <input className="input num" type="number" min="0" placeholder="€" value={giugnoPagato.importo ?? ""}
                    onChange={(e) => setSetup((prev) => ({ ...prev, f24Pagati: { ...(prev.f24Pagati || {}), [keyGiugno]: { ...((prev.f24Pagati || {})[keyGiugno] || {}), importo: e.target.value === "" ? null : Number(e.target.value) } } }))} /></label>
                  <label>di cui acconto <input className="input num" type="number" min="0" placeholder="€" value={giugnoPagato.acconto ?? ""}
                    onChange={(e) => setSetup((prev) => ({ ...prev, f24Pagati: { ...(prev.f24Pagati || {}), [keyGiugno]: { ...((prev.f24Pagati || {})[keyGiugno] || {}), acconto: e.target.value === "" ? null : Number(e.target.value) } } }))} /></label>
                </span>
              </div>
            )}
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
              Stima semplificata: aliquota complessiva {Math.round(taxRate * 100)}% (Setup), metodo storico, acconti in due rate del 50% (giugno e novembre) calcolate sulle tasse dell'anno prima. Scrivi negli spazi gli importi del commercialista: sostituiscono la stima.
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
            Aggiorna i valori dal riquadro «Patrimonio» in alto, da Setup, oppure scrivendo all&apos;assistente (es. «cassa 16.900 €, carte Pokémon 11.000 €»). Nel cash flow la cassa è la base; crypto e beni compaiono come riserve vendibili, al prezzo di vendita che imposti (tocca «Patrimonio» nel riepilogo).
          </p>
        </section>

        </div>

          </>
        )}
        {tab === "anno" && (
          <>
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

          </>
        )}
        {tab === "pipeline" && (
          <>
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

          </>
        )}
        {tab === "commesse" && (
          <>
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
          </>
        )}
      </div>

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
      el.textContent = fmtN(from + (target - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else { el.textContent = value; prev.current = target; }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

const TABS = [
  ["tempo", "Tempo e €/h", "clock", "Tempo"],
  ["cassa", "Cassa e tasse", "flow", "Cassa"],
  ["anno", "Anno", "bars", "Anno"],
  ["pipeline", "Pipeline", "funnel", "Pipeline"],
  ["commesse", "Commesse", "folder", "Commesse"],
];

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
      {riga(r.tipo === "reale" ? "Entrate" : "Entrate previste", r.entrate)}
      {r.dettaglio?.map((d) => (
        <div key={d.nome} style={{ display: "flex", justifyContent: "space-between", gap: 18, fontSize: 11.5, paddingLeft: 10 }}>
          <span style={{ color: "#A39684" }}>{d.nome}{d.concluso ? " · saldo progetto" : ""}</span><span className="num" style={{ color: "#CFC4B2" }}>{formatCurrency(d.v)}</span>
        </div>
      ))}
      {riga("Costi e spese", -r.costi)}
      {r.tasse > 0 && riga("F24", -r.tasse, "#E3A27F")}
      {riga("Flusso del mese", r.flusso, r.flusso >= 0 ? "#9CC496" : "#E3A27F")}
      <div style={{ borderTop: "1px solid #392F26", margin: "6px 0" }}></div>
      {riga("Cassa", r.cassa)}
      {r.cassaRiserve != null && riga("Con riserve vendute", r.cassaRiserve, "#9CC496")}
      {r.cassaScenario != null && riga("Cassa con scenario", r.cassaScenario, "#E2BE6E")}
    </div>
  );
}
