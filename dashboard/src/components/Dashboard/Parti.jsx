// Parti condivise dalle due versioni della Dashboard.
import { createPortal } from "react-dom";
import Icon from "../Icon";
import {
  dataBreve, getStatoTone, calcNetto, getCommessaLordoMensile, getLordoPerMese,
  pagamentiDelMese, orarioRealeCommessa, calcPatrimonio,
} from "../../utils/helpers";
import { fmtN } from "./calcoli";
import styles from "./Dashboard.module.css";

// Trattative: modifica in linea, probabilità e "simula"
export function PipelineEditor({ pipeline, setSetup, fattoreNetto, mediaOra }) {
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
export function ReportMese({ r }) {
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

export function KpiDrillModal({ drill, onClose, commesse, setCommesse, setup, setSetup, meseCorrente, meseRegistrato }) {
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
    patrimonio: { title: "Patrimonio", icon: "wallet", note: "La cassa è il punto di partenza del cash flow. Crypto e beni sono riserve: «vendi al %» è quanto incasseresti davvero vendendoli (commissioni, sconto per vendere in fretta); serve a calcolare quanti mesi in più ti danno." },
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
          <span className="valore-realizzo">
            <input className="input num" style={{ width: 120 }} type="number" min="0" value={setup.crypto ?? ""} onChange={(e) => setVal({ crypto: Number(e.target.value) || 0, cryptoAggiornato: new Date().toLocaleDateString("it-IT") })} aria-label="Valore crypto" />
            <label title="Quanto incasseresti vendendo, in % del valore">vendi al <input className="input num" type="number" min="0" max="100" value={setup.cryptoRealizzo ?? 95} onChange={(e) => setVal({ cryptoRealizzo: Math.min(100, Number(e.target.value) || 0) })} />%</label>
          </span>
        </div>
        {(setup.altriAsset || []).map((b) => (
          <div key={b.id} style={rowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input className="input" style={{ maxWidth: 220 }} value={b.nome} onChange={(e) => setBene(b.id, { nome: e.target.value })} />
              <button className="btn btn-quiet" title="Rimuovi" onClick={() => setSetup((prev) => ({ ...prev, altriAsset: (prev.altriAsset || []).filter((x) => x.id !== b.id) }))}><Icon name="trash" size={14} /></button>
            </div>
            <span className="valore-realizzo">
              <input className="input num" style={{ width: 120 }} type="number" min="0" value={b.valore ?? ""} onChange={(e) => setBene(b.id, { valore: Number(e.target.value) || 0 })} aria-label={`Valore ${b.nome}`} />
              <label title="Quanto incasseresti vendendo, in % del valore (commissioni, sconto per vendere in fretta)">vendi al <input className="input num" type="number" min="0" max="100" value={b.realizzo ?? 80} onChange={(e) => setBene(b.id, { realizzo: Math.min(100, Number(e.target.value) || 0) })} />%</label>
            </span>
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

