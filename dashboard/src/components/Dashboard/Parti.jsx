// Parti condivise dalle due versioni della Dashboard.
import { createPortal } from "react-dom";
import Icon from "../Icon";
import { dataBreve } from "../../utils/helpers";
import { fmtN } from "./calcoli";

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
