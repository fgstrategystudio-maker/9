import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { formatCurrency, sumLordoAnno } from "../../utils/helpers";
import Icon from "../Icon";
import styles from "./Storico.module.css";

const C = { pos: "#5E7E5A", accent: "#B5654A", info: "#5B7088", ink2: "#6E6456", ink3: "#9A8F7E", hair: "#E4DAC6" };
const TOOLTIP_STYLE = {
  background: "#221D18", border: "1px solid #392F26", borderRadius: 9,
  color: "#E9E0D0", fontSize: 12, boxShadow: "0 18px 40px -16px rgba(60,44,28,.20)",
};

const nf = new Intl.NumberFormat("it-IT");
const fmtN = (n) => nf.format(Math.round(n ?? 0));
const kfmt = (v) => {
  const a = Math.abs(v);
  if (a >= 1000) { const k = v / 1000; return (Number.isInteger(k) ? k : k.toFixed(1).replace(".", ",")) + "k"; }
  return String(Math.round(v));
};

export default function Storico({ setup, setSetup }) {
  const [newAnno, setNewAnno] = useState("");
  const [newImporto, setNewImporto] = useState("");

  const annoCorrente = new Date().getFullYear();
  const redditi = setup.redditiAnnuali || [];
  const lordoAnnoCorrente = sumLordoAnno(setup.incassatoStorico, annoCorrente);

  // Serie completa per il grafico: anni storici + anno in corso (dallo storico mensile)
  const serie = [
    ...redditi
      .filter((r) => r.importo != null && r.anno !== annoCorrente)
      .map((r) => ({ anno: r.anno, importo: r.importo, nota: r.nota, corrente: false })),
    ...(lordoAnnoCorrente > 0
      ? [{ anno: annoCorrente, importo: lordoAnnoCorrente, nota: "in corso", corrente: true }]
      : []),
  ].sort((a, b) => a.anno - b.anno);

  const valori = serie.map((s) => s.importo);
  const media = valori.length ? Math.round(valori.reduce((a, b) => a + b, 0) / valori.length) : 0;
  const migliore = serie.reduce((best, s) => (s.importo > (best?.importo ?? -1) ? s : best), null);

  // Confronto anno corrente vs precedente
  const prev = redditi.find((r) => r.anno === annoCorrente - 1);
  const prevImporto = prev?.importo ?? null;
  const deltaPct = prevImporto ? Math.round(((lordoAnnoCorrente - prevImporto) / prevImporto) * 100) : null;

  function updateReddito(anno, field, value) {
    setSetup((s) => ({
      ...s,
      redditiAnnuali: (s.redditiAnnuali || []).map((r) =>
        r.anno !== anno ? r : { ...r, [field]: field === "importo" ? (value === "" ? null : Number(value)) : value }
      ),
    }));
  }
  function deleteReddito(anno) {
    setSetup((s) => ({ ...s, redditiAnnuali: (s.redditiAnnuali || []).filter((r) => r.anno !== anno) }));
  }
  function addReddito(e) {
    e.preventDefault();
    const anno = Number(newAnno);
    if (!anno || (setup.redditiAnnuali || []).some((r) => r.anno === anno)) return;
    setSetup((s) => ({
      ...s,
      redditiAnnuali: [...(s.redditiAnnuali || []), { anno, importo: newImporto === "" ? null : Number(newImporto), nota: "" }]
        .sort((a, b) => a.anno - b.anno),
    }));
    setNewAnno(""); setNewImporto("");
  }

  const righeTabella = [...redditi].sort((a, b) => b.anno - a.anno);

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">Andamento</div>
          <h1 className="page-title">Storico redditi</h1>
          <p className="page-sub">Reddito lordo per anno e confronto con l&apos;anno precedente. L&apos;anno in corso si aggiorna dallo storico mensile.</p>
        </div>
      </header>

      {/* Confronto anno su anno */}
      <div className="mini-grid">
        <div className="mini">
          <div className="l">{annoCorrente} · in corso</div>
          <div className="v t-accent num">{fmtN(lordoAnnoCorrente)} €</div>
          <div className="s">lordo registrato quest&apos;anno</div>
        </div>
        <div className="mini">
          <div className="l">{annoCorrente - 1}</div>
          <div className="v num">{prevImporto != null ? `${fmtN(prevImporto)} €` : "—"}</div>
          <div className="s">{prev?.nota || "anno precedente"}</div>
        </div>
        <div className="mini">
          <div className="l">Variazione {annoCorrente - 1} → {annoCorrente}</div>
          <div className="v num" style={{ color: deltaPct == null ? "var(--ink-3)" : deltaPct >= 0 ? "var(--pos-ink)" : "var(--danger)" }}>
            {deltaPct == null ? "—" : `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`}
          </div>
          <div className="s">
            {prevImporto != null ? `${lordoAnnoCorrente >= prevImporto ? "+" : ""}${fmtN(lordoAnnoCorrente - prevImporto)} € sul ${annoCorrente - 1}` : "manca il dato del " + (annoCorrente - 1)}
          </div>
        </div>
      </div>

      {/* Grafico annuale */}
      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="bars" size={15} />Reddito per anno</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--ink)" }}>{fmtN(media)} €</div>
              <div className="l">Media annua</div>
            </div>
            {migliore && (
              <div className="si">
                <div className="v num" style={{ color: "var(--pos-ink)" }}>{fmtN(migliore.importo)} €</div>
                <div className="l">Anno migliore · {migliore.anno}</div>
              </div>
            )}
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 4 }}>
          {serie.length === 0 ? (
            <p style={{ color: "var(--ink-3)", fontSize: 13.5 }}>Nessun dato: aggiungi gli anni qui sotto.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="anno" tick={{ fill: C.ink2, fontSize: 11.5, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ink3, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${kfmt(v)}€`} width={46} />
                <Tooltip
                  cursor={{ fill: "rgba(60,44,28,.05)" }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#A39684", fontWeight: 700 }}
                  itemStyle={{ color: "#E9E0D0" }}
                  formatter={(v, n, p) => [formatCurrency(v) + (p.payload.nota ? ` · ${p.payload.nota}` : ""), p.payload.corrente ? "In corso" : "Lordo"]}
                />
                <Bar dataKey="importo" radius={[4, 4, 0, 0]} maxBarSize={46}>
                  {serie.map((s, i) => (
                    <Cell key={i} fill={s.corrente ? C.accent : C.pos} opacity={s.corrente ? 0.85 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="legend" style={{ marginTop: 8 }}>
            <span className="li"><span className="sw" style={{ background: C.pos }}></span>Anni chiusi</span>
            <span className="li"><span className="sw" style={{ background: C.accent }}></span>Anno in corso (da storico mensile)</span>
          </div>
        </div>
      </section>

      {/* Tabella editabile */}
      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="history" size={15} />Dettaglio per anno</div>
          <span className="panel-note">modificabile · importo lordo e nota</span>
        </div>
        <div className={styles.editTable}>
          <div className={styles.head}>
            <span>Anno</span>
            <span>Lordo (€)</span>
            <span>Nota</span>
            <span></span>
          </div>
          {righeTabella.map((r) => (
            <div key={r.anno} className={styles.row}>
              <span className="num" style={{ fontWeight: 600, color: "var(--ink)" }}>
                {r.anno}{r.anno === annoCorrente ? " · in corso" : ""}
              </span>
              {r.anno === annoCorrente ? (
                <span className="num" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                  {fmtN(lordoAnnoCorrente)} € <span style={{ fontSize: 11, color: "var(--ink-3)" }}>(auto)</span>
                </span>
              ) : (
                <input
                  className="input num"
                  type="number"
                  min="0"
                  value={r.importo ?? ""}
                  placeholder="—"
                  onChange={(e) => updateReddito(r.anno, "importo", e.target.value)}
                />
              )}
              <input
                className="input"
                value={r.nota || ""}
                placeholder="es. lordi, nero, versati…"
                onChange={(e) => updateReddito(r.anno, "nota", e.target.value)}
              />
              {r.anno === annoCorrente ? (
                <span />
              ) : (
                <button className={styles.removeBtn} onClick={() => deleteReddito(r.anno)} title="Rimuovi">✕</button>
              )}
            </div>
          ))}
        </div>
        <form className={styles.addRow} onSubmit={addReddito}>
          <input className="input num" type="number" placeholder="Anno" value={newAnno} onChange={(e) => setNewAnno(e.target.value)} style={{ width: 110 }} />
          <input className="input num" type="number" placeholder="Lordo €" value={newImporto} onChange={(e) => setNewImporto(e.target.value)} min="0" style={{ width: 140 }} />
          <button type="submit" className="btn btn-ghost"><Icon name="plus" size={15} /> Aggiungi anno</button>
        </form>
      </section>
    </div>
  );
}
