import { useState } from "react";
import Assistente from "../Assistente/Assistente";
import Icon from "../Icon";
import { calcolaDashboard, calcolaNote, fmtN, MESI_IT } from "../Dashboard/calcoli";
import { PipelineEditor, ReportMese, KpiDrillModal } from "../Dashboard/Parti";
import { importoCompetenzaMese, oreCommessaMese, pipelineCommessa, dataBreve, icsPromemoria } from "../../utils/helpers";
import s from "./DashboardB.module.css";

// Versione "Orario": la dashboard come un orario dei prossimi 12 mesi.
// In alto scrivi all'assistente; sotto, il punto della situazione in frasi;
// poi una griglia mesi × commesse dove il colore è il guadagno orario e le
// righe in fondo dicono ore libere, entrate, F24 e cassa mese per mese.

const RAMPA = 5; // gradini di colore per il €/h

const meseLungo = (r) => (r ? `${MESI_IT[r.m].toLowerCase()} ${r.y}` : null);
// 2071 → "2,1k", 750 → "750"
const breve = (v) => {
  const a = Math.abs(v);
  const t = a >= 1000 ? `${(a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(".", ",")}k` : String(Math.round(a));
  return v < 0 ? `−${t}` : t;
};

// Dove portano le note di "Da sapere" in questa versione
const VAI = { "sez-cash": "vb-soldi", "sez-tasse": "vb-soldi", "sez-liberi": "vb-orario", "sez-clienti": "vb-commesse", "sez-tempo": "vb-commesse", "sez-pipeline": "vb-orario" };

// Numero in evidenza dentro una frase
function N({ children, tono, onClick }) {
  const cls = s.n + (tono ? " " + s[tono] : "");
  if (onClick) return <button className={cls + " " + s.nBtn} onClick={onClick}>{children}</button>;
  return <b className={cls}>{children}</b>;
}

export default function DashboardB({ commesse, setCommesse, setup, setSetup }) {
  const [seed, setSeed] = useState(null);
  const [trattativeAperte, setTrattativeAperte] = useState(false);
  const [drill, setDrill] = useState(null);
  const D = calcolaDashboard(commesse, setup);
  const {
    anno, meseIdx, meseCorrente, nomeMese, meseCorrManc, meseRegistrato, lordoMese, nettoMese,
    attive, righeTempo, oreTotali, oreLibere, oreDisponibili, lordoOraMedio, nettoOraMedio, lordoOraReale,
    mesi12, tempo12, cashFlowData, fineCassa, fineRiserve, riserve, riserveVendibili, cassaIniziale, cassaData,
    patrimonio, debitoFiscale, cassaLibera, tasseMaturate, accontiVersati, prossimiF24, f24Override, modoTasse,
    taxRate, contoAnno, annualData, lordoAnnoCorrente, annoPrecImporto, yoyDeltaPct, totaleCostiFissi, usciteMensili,
    pipeline, simulate, scenarioAttivo, mesiAutonomia, mesiAutonomiaRiserve, profittoMensile, totaleCostiAnnuali,
    goals, serieClientiDati, costiFissiMensili, totaleCostiAnnualiMensile, statoCount, statoTotal,
  } = D;

  const tasseMese = Math.round(lordoMese * taxRate);
  const conferma = (c) => {
    if (!confirm(`Confermi che «${c.cliente}» è conclusa? Verrà archiviata come Conclusa.`)) return;
    setCommesse((prev) => prev.map((x) => (x.id === c.id ? { ...x, stato: "Concluso" } : x)));
  };
  const senzaOre = attive.filter((c) => !Number(c.oreMensili));
  const note = calcolaNote(D, {
    conferma,
    inserisciOre: () => setSeed((p) => ({
      testo: ["Ore al mese stimate:", ...senzaOre.map((c) => `- ${c.cliente}: … ore`)].join("\n"),
      n: (p?.n || 0) + 1,
    })),
  });
  const vai = (id) => document.getElementById(VAI[id] || id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // — Righe dell'orario: commesse attive, concluse con un incasso nei 12 mesi, ipotesi simulate —
  const inFinestra = (c) => mesi12.some(({ m, y }) => importoCompetenzaMese(c, m, y) > 0);
  const righe = [
    ...commesse.filter((c) => (c.stato === "In corso" || c.stato === "In scadenza" || c.stato === "Concluso") && inFinestra(c)),
    ...simulate.map((p) => ({ ...pipelineCommessa(p), ipotesi: true, probabilita: p.probabilita })),
  ].map((c) => {
    const ore = Number(c.oreMensili) || 0;
    const fee = Number(c.lordoMensile) || 0;
    const ora = ore > 0 && fee > 0 ? Math.round(fee / ore) : null;
    return {
      c, ora,
      celle: mesi12.map(({ m, y }) => ({ v: importoCompetenzaMese(c, m, y), ore: oreCommessaMese(c, m, y) })),
    };
  }).sort((a, b) => (b.ora ?? -1) - (a.ora ?? -1));
  const ore = righe.map((r) => r.ora).filter((v) => v != null);
  const oraMin = ore.length ? Math.min(...ore) : 0;
  const oraMax = ore.length ? Math.max(...ore) : 0;
  const gradino = (ora) => {
    if (ora == null) return 0;
    if (oraMax === oraMin) return RAMPA;
    return 1 + Math.round(((ora - oraMin) / (oraMax - oraMin)) * (RAMPA - 1));
  };
  // Cassa e F24 allineati ai mesi dell'orario (il cash flow parte dal mese dopo la data della cassa)
  const cassaDi = (m, y) => cashFlowData.find((r) => r.m === m && r.y === y) || null;

  // — Commesse ordinate per €/h —
  const perOra = [...righeTempo].sort((a, b) => (b.lordoOra ?? -1) - (a.lordoOra ?? -1));
  const maxOra = Math.max(1, ...perOra.map((r) => r.lordoOra || 0));

  // — Anno mese per mese —
  const maxAnno = Math.max(1, ...annualData.map((d) => d.lordo));

  const prossimoF24 = prossimiF24.find((f) => f.importo > 0) || null;
  // €/h reale mese per mese di una commessa (dai mesi con le ore registrate)
  const andamento = (id) => {
    const punti = serieClientiDati.righe.filter((r) => r[id] != null).map((r) => ({ k: r.k, v: r[id] }));
    if (!punti.length) return null;
    const ultimi = punti.slice(-4);
    const primo = ultimi[0].v, ultimo = ultimi[ultimi.length - 1].v;
    return (
      <div className={s.trend}>
        €/h reale: {ultimi.map((p, i) => {
          const [y, m] = p.k.split("-");
          return <span key={p.k}>{i > 0 ? " → " : ""}{MESI_IT[Number(m) - 1].slice(0, 3).toLowerCase()}{y !== String(anno) ? ` ${y.slice(2)}` : ""} <b>{fmtN(p.v)}</b></span>;
        })}
        {ultimi.length > 1 && ultimo < primo * 0.9 && <span className={s.warn}> · in calo</span>}
      </div>
    );
  };
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
  const setRealizzo = (id, pct) => setSetup((prev) => (id === "crypto"
    ? { ...prev, cryptoRealizzo: pct }
    : { ...prev, altriAsset: (prev.altriAsset || []).map((a) => (a.id === id ? { ...a, realizzo: pct } : a)) }));

  const scaricaPromemoria = () => {
    const blob = new Blob([icsPromemoria(window.location.origin)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "promemoria-dashboard.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className={s.root}>
      <header className={s.testa}>
        <h1 className="page-title">{meseCorrente}</h1>
        <div className={s.azioniTesta}>
          <button className="btn btn-ghost" onClick={() => window.print()} title="Apre la stampa: scegli «Salva come PDF»" aria-label="Report PDF"><Icon name="file" size={16} /><span>Report PDF</span></button>
          <button className="btn btn-ghost" onClick={scaricaPromemoria} title="Evento ricorrente il 1° di ogni mese alle 9:00" aria-label="Promemoria mensile"><Icon name="bell" size={16} /><span>Promemoria</span></button>
        </div>
      </header>

      <div id="vb-ai">
        <Assistente commesse={commesse} setCommesse={setCommesse} setup={setup} setSetup={setSetup}
          sempreAperto meseDaRegistrare={meseCorrManc ? meseCorrente : null} seed={seed} />
      </div>

      {/* Il punto della situazione, in frasi */}
      <section className={s.punto} aria-label="Il punto">
        <p className={s.frase}>
          {nomeMese}: <N onClick={() => setDrill("lordoAttivo")}>{fmtN(lordoMese)} €</N> lordi {meseRegistrato ? "incassati" : "previsti"} (<N onClick={() => setDrill("nettoAttivo")}>{fmtN(nettoMese)}</N> netti, <N onClick={() => setDrill("profitto")}>{fmtN(profittoMensile)}</N> di profitto dopo i costi fissi)
          {" "}da {attive.length} {attive.length === 1 ? "commessa" : "commesse"}, con <N>{fmtN(oreTotali)} ore</N> di lavoro
          {lordoOraMedio != null && <>: <N onClick={() => setDrill("orario")}>{fmtN(lordoOraMedio)} €/h</N> ({fmtN(nettoOraMedio)} netti)</>}.
          {" "}Ti restano <N tono="pos" onClick={() => setDrill("tempo")}>{fmtN(oreLibere)} ore libere</N> su {oreDisponibili}.
        </p>
        <p className={s.frase}>
          {fineCassa
            ? <>Senza nuovi clienti la cassa basta fino a <N tono="neg">{meseLungo(fineCassa)}</N></>
            : <>Con i contratti attuali la cassa regge <N tono="pos">oltre tre anni</N></>}
          {fineCassa && riserveVendibili > 0 && (fineRiserve
            ? <>; vendendo crypto e beni fino a <N>{meseLungo(fineRiserve)}</N></>
            : <>; vendendo crypto e beni oltre tre anni</>)}
          .
        </p>

        <div className={s.fatti}>
          <button className={s.fatto} onClick={() => setDrill("patrimonio")}><span className={s.fl}>Cassa sul conto</span><span className={s.fv}>{fmtN(cassaIniziale)} €</span><span>{cassaData ? `al ${dataBreve(cassaData)}` : "aggiornala con l'assistente"}</span></button>
          <button className={s.fatto} onClick={() => setDrill("tasse")}><span className={s.fl}>Da tenere per le tasse</span><span className={s.fv}>{fmtN(debitoFiscale)} €</span><span>libera {fmtN(cassaLibera)} €</span></button>
          <button className={s.fatto} onClick={() => vai("sez-tasse")}><span className={s.fl}>Prossimo F24</span><span className={s.fv}>{prossimoF24 ? `${fmtN(prossimoF24.importo)} €` : "—"}</span><span>{prossimoF24 ? `${dataBreve(prossimoF24.data)} · ${prossimoF24.manuale ? "reale" : "stima"}` : "nessuna scadenza"}</span></button>
          <button className={s.fatto} onClick={() => setDrill("patrimonio")}><span className={s.fl}>Patrimonio</span><span className={s.fv}>{fmtN(patrimonio.totale)} €</span><span>{mesiAutonomia != null ? `${mesiAutonomia} mesi senza incassi` : ""}</span></button>
        </div>

        <div className={s.obiettivi}>
          <span><Icon name="target" size={14} />Obiettivi</span>
          {goals.length === 0 ? (
            <button className={s.link} onClick={() => setDrill("obiettivi")}>Imposta lordo annuo, €/h minimo e ore libere</button>
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

        {note.length > 0 && (
          <ul className={s.avvisi}>
            {note.map((n) => (
              <li key={n.k} className={s["av_" + n.livello]}>
                <span className={s.avTesto}>{n.testo}</span>
                {n.azione && <button className={s.link} onClick={n.azione.fn}>{n.azione.label}</button>}
                {n.vai && <button className={s.link} onClick={() => vai(n.vai)}>Vedi</button>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Firma: l'orario dei prossimi 12 mesi */}
      <section id="vb-orario" className={s.blocco}>
        <div className={s.bloccoTesta}>
          <h2><Icon name="calendar" size={15} />I prossimi 12 mesi</h2>
          <p>Ogni riga è una commessa: la cella dice quanto incassi quel mese, il colore quanto guadagni all&apos;ora. In fondo, il tempo e i soldi che restano.</p>
        </div>

        <div className={s.orarioWrap}>
          <table className={s.orario}>
            <thead>
              <tr>
                <th className={s.colNome} scope="col">Commessa</th>
                <th className={s.colOra} scope="col">€/h</th>
                {mesi12.map(({ m, y }, i) => (
                  <th key={i} scope="col" className={i === 0 ? s.oggi : undefined}>
                    {MESI_IT[m].slice(0, 3)}{(m === 0 || i === 0) && <small>{y}</small>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => (
                <tr key={r.c.id} className={r.c.ipotesi ? s.ipotesi : undefined}>
                  <th scope="row" className={s.colNome}>
                    <span className={s.nome}>{r.c.cliente}</span>
                    <span className={s.meta}>
                      {r.c.ipotesi ? `ipotesi · ${r.c.probabilita ?? 50}%` : r.c.stato === "Concluso" ? "saldo progetto" : r.c.fine ? `fino a ${dataBreve(r.c.fine)}` : "senza fine"}
                    </span>
                  </th>
                  <td className={s.colOra}>{r.ora != null ? fmtN(r.ora) : "—"}</td>
                  {r.celle.map((cella, i) => {
                    const piena = cella.v > 0;
                    const fine = piena && !(r.celle[i + 1]?.v > 0);
                    return (
                      <td key={i} className={i === 0 ? s.oggi : undefined}>
                        {piena && (
                          <span className={`${s.cella} ${s["g" + gradino(r.ora)]}${fine ? " " + s.ultima : ""}`} style={{ "--i": i }}
                            title={`${r.c.cliente} · ${MESI_IT[mesi12[i].m]} ${mesi12[i].y}: ${fmtN(cella.v)} €${cella.ore ? `, ${fmtN(cella.ore)} h` : ""}`}>
                            {breve(cella.v)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {righe.length === 0 && (
                <tr><td colSpan={14} className={s.vuoto}>Nessuna commessa nei prossimi 12 mesi. Scrivi all&apos;assistente i tuoi contratti.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className={s.colNome}>Ore libere</th><td className={s.colOra}></td>
                {tempo12.map((t, i) => (
                  <td key={i} className={(i === 0 ? s.oggi + " " : "") + (t.libere < 20 ? s.warn : "")}>{fmtN(t.libere)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={s.colNome}>Entrate lorde</th><td className={s.colOra}></td>
                {tempo12.map((t, i) => <td key={i} className={i === 0 ? s.oggi : undefined}>{t.lordo ? breve(scenarioAttivo ? t.lordoScenario : t.lordo) : "—"}</td>)}
              </tr>
              {modoTasse === "f24" && (
                <tr>
                  <th scope="row" className={s.colNome}>F24</th><td className={s.colOra}></td>
                  {mesi12.map(({ m, y }, i) => {
                    const r = cassaDi(m, y);
                    return <td key={i} className={(i === 0 ? s.oggi + " " : "") + (r?.tasse ? s.warn : "")}>{r?.tasse ? `−${breve(r.tasse)}` : ""}</td>;
                  })}
                </tr>
              )}
              <tr className={s.rigaCassa}>
                <th scope="row" className={s.colNome}>Cassa a fine mese{scenarioAttivo && <span className={s.meta}>con le ipotesi</span>}</th><td className={s.colOra}></td>
                {mesi12.map(({ m, y }, i) => {
                  const r = cassaDi(m, y);
                  const v = r ? (scenarioAttivo ? r.cassaScenario : r.cassa) : null;
                  return <td key={i} className={(i === 0 ? s.oggi + " " : "") + (v != null && v < 0 ? s.neg : "")}>{v != null ? breve(v) : "—"}</td>;
                })}
              </tr>
              {riserveVendibili > 0 && (
                <tr className={s.rigaRiserve}>
                  <th scope="row" className={s.colNome}>Con riserve vendute</th><td className={s.colOra}></td>
                  {mesi12.map(({ m, y }, i) => {
                    const r = cassaDi(m, y);
                    const v = r ? (scenarioAttivo ? r.cassaScenario : r.cassa) + riserveVendibili : null;
                    return <td key={i} className={(i === 0 ? s.oggi + " " : "") + (v != null && v < 0 ? s.neg : "")}>{v != null ? breve(v) : "—"}</td>;
                  })}
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        {/* Telefono: un mese per riga */}
        <ol className={s.mesiMobile}>
          {mesi12.map(({ m, y }, i) => {
            const t = tempo12[i];
            const r = cassaDi(m, y);
            const cassa = r ? (scenarioAttivo ? r.cassaScenario : r.cassa) : null;
            const chi = righe.filter((x) => x.celle[i].v > 0);
            return (
              <li key={i} className={i === 0 ? s.oggiMobile : undefined}>
                <div className={s.mmTesta}>
                  <span className={s.mmMese}>{MESI_IT[m]} {y !== anno ? y : ""}{i === 0 ? " · questo mese" : ""}</span>
                  <span className={s.mmCassa + (cassa != null && cassa < 0 ? " " + s.neg : "")}>{cassa != null ? `cassa ${fmtN(cassa)} €` : ""}</span>
                </div>
                <div className={s.mmRiga}>
                  <span>{fmtN(t.libere)} h libere</span>
                  <span>{fmtN(scenarioAttivo ? t.lordoScenario : t.lordo)} € lordi</span>
                  {r?.tasse > 0 && <span className={s.warn}>F24 −{fmtN(r.tasse)} €</span>}
                </div>
                {chi.length > 0 && (
                  <div className={s.mmChi}>
                    {chi.map((x) => (
                      <span key={x.c.id} className={`${s.chip} ${s["g" + gradino(x.ora)]}${x.c.ipotesi ? " " + s.chipIpotesi : ""}`}>{x.c.cliente} {breve(x.celle[i].v)}</span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className={s.legenda}>
          <span>€/h</span>
          <span className={s.rampa} aria-hidden="true">{Array.from({ length: RAMPA }, (_, i) => <i key={i} className={s["g" + (i + 1)]} />)}</span>
          <span>{ore.length ? `da ${fmtN(oraMin)} a ${fmtN(oraMax)} €/h` : "inserisci le ore delle commesse"}</span>
          <button className={s.link} onClick={() => setTrattativeAperte((v) => !v)} aria-expanded={trattativeAperte}>
            {trattativeAperte ? "Chiudi le trattative" : `Trattative e ipotesi${pipeline.length ? ` (${pipeline.length})` : ""}`}
          </button>
        </div>
        {trattativeAperte && (
          <div className={s.trattative}>
            <p className={s.nota}>Spunta «Simula» per vedere una trattativa nell&apos;orario (righe tratteggiate) e nella cassa.</p>
            <PipelineEditor pipeline={pipeline} setSetup={setSetup} fattoreNetto={setup.fattoreNetto} mediaOra={lordoOraMedio} />
          </div>
        )}
      </section>

      <div className={s.due}>
        {/* Commesse per guadagno orario */}
        <section id="vb-commesse" className={s.blocco}>
          <div className={s.bloccoTesta}>
            <h2><Icon name="clock" size={15} />Quanto vale la tua ora</h2>
            <p>Media {lordoOraMedio != null ? `${fmtN(lordoOraMedio)} €/h lordi` : "—"}{lordoOraReale != null ? ` · reale ${anno} ${fmtN(lordoOraReale)} €/h` : ""}</p>
          </div>
          <ul className={s.classifica}>
            {perOra.map((r) => (
              <li key={r.c.id}>
                <div className={s.clTesta}>
                  <span className={s.nome}>{r.c.cliente}</span>
                  <span className={s.clOra}>{r.lordoOra != null ? `${fmtN(r.lordoOra)} €/h` : "ore mancanti"}</span>
                </div>
                <div className={s.barra}><i className={s["g" + gradino(r.lordoOra)]} style={{ width: r.lordoOra ? `${(r.lordoOra / maxOra) * 100}%` : 0 }} /></div>
                <div className={s.meta}>
                  {r.ore ? `${fmtN(r.ore)} h/mese` : "ore da stimare"} · {r.lordo ? `${fmtN(r.lordo)} €/mese` : "senza fee"}
                  {r.nettoOra != null && ` · ${fmtN(r.nettoOra)} netti`}
                  {r.realeOra != null && ` · reale ${fmtN(r.realeOra)}`}
                  {r.mesi != null && ` · ${r.mesi === 0 ? "scaduta" : `${r.mesi} ${r.mesi === 1 ? "mese" : "mesi"}`}`}
                </div>
                {andamento(r.c.id)}
              </li>
            ))}
            {perOra.length === 0 && <li className={s.meta}>Nessuna commessa attiva.</li>}
          </ul>
          <h3 className={s.sotto}>Le tue commesse</h3>
          <button className={s.statiBtn} onClick={() => setDrill("commesseAttive")} aria-label="Commesse attive">
            <span className={s.stati}>
              {statoCount.map((x) => <i key={x.name} style={{ flex: x.value, background: x.color }} />)}
            </span>
          </button>
          <div className={s.statiLeg}>
            {statoCount.map((x) => <span key={x.name}><i style={{ background: x.color }} />{x.name} {x.value}</span>)}
            <span>· {statoTotal} in tutto</span>
            <button className={s.link} onClick={() => setDrill("upsell")}>Upsell</button>
          </div>
        </section>

        {/* Soldi: cassa, tasse, riserve */}
        <section id="vb-soldi" className={s.blocco}>
          <div className={s.bloccoTesta}>
            <h2><Icon name="wallet" size={15} />Soldi</h2>
            <p>Uscite {fmtN(usciteMensili)} €/mese ({fmtN(totaleCostiFissi)} fissi + spese annuali spalmate)</p>
          </div>
          <dl className={s.libro}>
            <button onClick={() => setDrill("costiMensili")}><dt>Costi fissi mensili <small>{costiFissiMensili.length} voci · ogni mese</small></dt><dd>{fmtN(totaleCostiFissi)} €</dd></button>
            <button onClick={() => setDrill("speseAnnuali")}><dt>Spese annuali <small>promemoria · non le stai pagando ora</small></dt><dd>{fmtN(totaleCostiAnnuali)} €</dd></button>
            <button onClick={() => setDrill("equivMensile")}><dt>Equivalente mensile <small>se le spalmassi ogni mese · nel cash flow</small></dt><dd>{fmtN(totaleCostiAnnualiMensile)} €</dd></button>
          </dl>
          <h3 className={s.sotto}>Cassa e tasse</h3>
          <dl className={s.libro}>
            <button onClick={() => setDrill("patrimonio")}><dt>Cassa sul conto</dt><dd>{fmtN(cassaIniziale)} €</dd></button>
            <div><dt>Tasse {anno} maturate <small>{fmtN(lordoAnnoCorrente)} € × {Math.round(taxRate * 100)}%{accontiVersati ? `, versati ${fmtN(accontiVersati)}` : ""}</small></dt><dd>{fmtN(tasseMaturate)} €</dd></div>
            <div className={s.totale}><dt>Cassa libera dalle tasse</dt><dd className={cassaLibera < 0 ? s.neg : undefined}>{fmtN(cassaLibera)} €</dd></div>
          </dl>

          <h3 className={s.sotto}>Scadenze F24</h3>
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

          <h3 className={s.sotto}>Riserve vendibili</h3>
          <dl className={s.libro}>
            {riserve.map((r) => (
              <div key={r.id}>
                <dt>{r.nome} <small>valore {fmtN(r.valore)} €, vendi al
                  <input className={"input num " + s.pct} type="number" min="0" max="100" value={r.pct} aria-label={`Percentuale di vendita ${r.nome}`}
                    onChange={(e) => setRealizzo(r.id, Math.min(100, Number(e.target.value) || 0))} />%</small></dt>
                <dd>{fmtN((r.valore * r.pct) / 100)} €</dd>
              </div>
            ))}
            {riserve.length > 0 && (
              <div className={s.totale}><dt>Mesi di autonomia <small>senza incassi: {mesiAutonomia ?? "—"} con la cassa</small></dt><dd>{mesiAutonomiaRiserve ?? "—"}</dd></div>
            )}
          </dl>
          <p className={s.nota}>Stima: aliquota {Math.round(taxRate * 100)}%, acconti 50% a giugno e 50% a novembre. Scrivi gli importi reali negli spazi.</p>
        </section>
      </div>

      {/* L'anno */}
      <section className={s.blocco}>
        <div className={s.bloccoTesta}>
          <h2><Icon name="bars" size={15} />{anno}, mese per mese</h2>
          <p>
            {fmtN(contoAnno.lordo)} € lordi tra registrati e previsti
            {yoyDeltaPct != null && <> · <span className={yoyDeltaPct >= 0 ? s.pos : s.neg}>{yoyDeltaPct >= 0 ? "+" : ""}{yoyDeltaPct}%</span> sul {anno - 1} ({fmtN(annoPrecImporto)} €)</>}
            {" "}· risparmio dell&apos;anno <span className={contoAnno.risparmio >= 0 ? s.pos : s.neg}>{fmtN(contoAnno.risparmio)} €</span>
          </p>
        </div>
        <div className={s.anno} role="img" aria-label={`Lordo per mese nel ${anno}`}>
          {annualData.map((d, i) => (
            <div key={i} className={s.annoCol + (i === meseIdx ? " " + s.annoOggi : "")} tabIndex={0}
              title={`${MESI_IT[i]}: ${fmtN(d.lordo)} € lordi (${d.tipo === "reale" ? "registrato" : d.tipo === "mancante" ? "non registrato" : "previsto"})`}>
              <span className={s.annoVal}>{d.lordo ? breve(d.lordo) : ""}</span>
              <span className={s.annoBarra}>
                <i className={s["t_" + d.tipo]} style={{ height: `${Math.max(d.lordo ? 3 : 0, (d.lordo / maxAnno) * 100)}%` }} />
              </span>
              <span className={s.annoMese}>{MESI_IT[i].slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className={s.legenda}>
          <span><i className={s.sw} style={{ background: "var(--pos)" }} />registrato</span>
          <span><i className={s.sw} style={{ background: "var(--warn)" }} />questo mese, stimato</span>
          <span><i className={s.sw} style={{ background: "var(--info)" }} />previsto dai contratti</span>
          <span>Costi dell&apos;anno {fmtN(contoAnno.costiFissiAnno + totaleCostiAnnuali)} € · tasse {fmtN(contoAnno.tasse)} €</span>
        </div>
      </section>

      <KpiDrillModal drill={drill} onClose={() => setDrill(null)} commesse={commesse} setCommesse={setCommesse}
        setup={setup} setSetup={setSetup} meseCorrente={meseCorrente} meseRegistrato={meseRegistrato} />

      <ReportMese r={{
        mese: meseCorrente, meseRegistrato, lordo: lordoMese, netto: nettoMese, costi: totaleCostiFissi, profitto: profittoMensile,
        tasse: tasseMese, ora: lordoOraMedio, oraNetto: nettoOraMedio, oreImpegnate: oreTotali, oreLibere, righe: righeTempo,
        anno, tasseMaturate, debito: debitoFiscale, f24: prossimiF24, patrimonio, cassaLibera, cash: cashFlowData, conto: contoAnno, taxRate,
      }} />
    </div>
  );
}
