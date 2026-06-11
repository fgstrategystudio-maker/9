import { daysUntil } from "../../utils/helpers";
import Icon from "../Icon";
import styles from "./Fiscale.module.css";

const MESI_IT = {
  gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
  luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
};

const SOGLIA_FORFETTARIO = 85000;

const nf = new Intl.NumberFormat("it-IT");
const fmtN = (n) => nf.format(Math.round(n ?? 0));

function parseMese(meseStr) {
  if (!meseStr) return null;
  const parts = meseStr.toLowerCase().trim().split(/\s+/);
  if (parts.length < 2) return null;
  const mIdx = MESI_IT[parts[0]];
  const year = parseInt(parts[1]);
  if (mIdx === undefined || isNaN(year)) return null;
  return { month: mIdx, year };
}

function getQuarter(month) {
  return Math.floor(month / 3);
}

function getScadenzaIVA(quarter, year) {
  const map = [
    { label: "Q1 (gen–mar)", deadline: `${year}-05-16` },
    { label: "Q2 (apr–giu)", deadline: `${year}-08-16` },
    { label: "Q3 (lug–set)", deadline: `${year}-11-16` },
    { label: "Q4 (ott–dic)", deadline: `${year + 1}-02-16` },
  ];
  return map[quarter];
}

export default function Fiscale({ setup }) {
  const fiscale = setup.fiscale || {};
  const {
    regime = "forfettario",
    aliquotaIVA = 0,
    aliquotaIRPEF = 15,
    aliquotaINPS = 26.23,
    bufferExtra = 5,
  } = fiscale;

  const storico = setup.incassatoStorico || [];

  const totalLordo = storico.reduce((s, r) => s + r.lordo, 0);

  const ivaRate = aliquotaIVA / 100;
  const irpefRate = aliquotaIRPEF / 100;
  const inpsRate = aliquotaINPS / 100;
  const bufferRate = bufferExtra / 100;

  const totIVA = Math.round(totalLordo * ivaRate);
  const totIRPEF = Math.round(totalLordo * irpefRate);
  const totINPS = Math.round(totalLordo * inpsRate);
  const totBuffer = Math.round(totalLordo * bufferRate);
  const totDaMettere = totIVA + totIRPEF + totINPS + totBuffer;
  const totTieni = totalLordo - totDaMettere;
  const percAccantonamento = totalLordo > 0 ? Math.round((totDaMettere / totalLordo) * 100) : 0;

  const pctSoglia = Math.min(100, Math.round((totalLordo / SOGLIA_FORFETTARIO) * 100));

  // Raggruppa per trimestre per scadenze IVA
  const quarterMap = {};
  storico.forEach((r) => {
    const parsed = parseMese(r.mese);
    if (!parsed) return;
    const q = getQuarter(parsed.month);
    const key = `${parsed.year}-Q${q}`;
    if (!quarterMap[key]) {
      quarterMap[key] = { quarter: q, year: parsed.year, lordo: 0, iva: 0 };
    }
    quarterMap[key].lordo += r.lordo;
    quarterMap[key].iva += Math.round(r.lordo * ivaRate);
  });

  const scadenzeIVA = Object.values(quarterMap)
    .map((q) => {
      const info = getScadenzaIVA(q.quarter, q.year);
      const days = daysUntil(info.deadline);
      return { ...q, ...info, days };
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">Tasse &amp; contributi</div>
          <h1 className="page-title">Fiscale</h1>
          <p className="page-sub">
            Soglia forfettario, accantonamenti e prossime scadenze fiscali — regime {regime} · accantonamento consigliato {percAccantonamento}% del lordo.
          </p>
        </div>
      </header>

      {storico.length === 0 && (
        <div className="notice">
          <div className="notice-ico ico-warn"><Icon name="alert" size={18} /></div>
          <span className="lab">Aggiungi gli incassi nella sezione Setup → Storico incassato per attivare i calcoli.</span>
        </div>
      )}

      {storico.length > 0 && (
        <>
          <div className="grid cols-2-asym">
            {/* Soglia regime forfettario */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title"><Icon name="shield" size={15} />Soglia regime forfettario</div>
                <span className="panel-note" style={{ textTransform: "capitalize" }}>{regime} {aliquotaIRPEF}%</span>
              </div>
              <div className="panel-pad" style={{ paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 500, letterSpacing: "-.02em" }}>
                    {fmtN(totalLordo)} €
                  </span>
                  <span style={{ color: "var(--ink-3)", fontSize: 15 }}>/ {fmtN(SOGLIA_FORFETTARIO)} €</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>
                  Fatturato YTD · <b style={{ color: "var(--accent-ink)" }}>{pctSoglia}%</b> della soglia annua
                </div>
                <div className="statbar-track" style={{ height: 10, marginTop: 16 }}>
                  <div
                    className="statbar-fill"
                    style={{ width: pctSoglia + "%", background: "linear-gradient(90deg, var(--pos), var(--accent))" }}
                  ></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-3)", marginTop: 8 }}>
                  <span>0 €</span>
                  <span>{fmtN(SOGLIA_FORFETTARIO)} €</span>
                </div>
              </div>
            </section>

            {/* Accantonato */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title"><Icon name="coin" size={15} />Accantonamento</div>
                <span className="panel-note">calcolato su {fmtN(totalLordo)} € lordo incassato</span>
              </div>
              <div className="panel-pad" style={{ paddingTop: 4, display: "grid", gap: 14 }}>
                <div className="mini" style={{ padding: 16, boxShadow: "none", background: "var(--panel-2)" }}>
                  <div className="l">Da accantonare (stima)</div>
                  <div className="v t-warn num" style={{ fontSize: 26 }}>{fmtN(totDaMettere)} €</div>
                  <div className="s">
                    imposta sostitutiva {aliquotaIRPEF}% + contributi INPS {aliquotaINPS}%{bufferExtra > 0 ? ` + buffer ${bufferExtra}%` : ""}{aliquotaIVA > 0 ? ` + IVA ${aliquotaIVA}%` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 110 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>Imposta sostitutiva</div>
                    <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--info)" }}>{fmtN(totIRPEF)} €</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 110 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>Contributi INPS</div>
                    <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--danger)" }}>{fmtN(totINPS)} €</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 110 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>Puoi spendere</div>
                    <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--pos-ink)" }}>{fmtN(totTieni)} €</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Dettaglio per incasso */}
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title"><Icon name="receipt" size={15} />Dettaglio per incasso</div>
              <span className="panel-note">accantonamento {percAccantonamento}% del lordo</span>
            </div>
            <div className={styles.tableWrap}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mese</th>
                    <th className="r">Lordo</th>
                    {aliquotaIVA > 0 && <th className="r">IVA</th>}
                    <th className="r">Imposta</th>
                    <th className="r">INPS</th>
                    <th className="r">Accantona</th>
                    <th className="r">Tieni</th>
                  </tr>
                </thead>
                <tbody>
                  {storico.map((r, i) => {
                    const iva = Math.round(r.lordo * ivaRate);
                    const irpef = Math.round(r.lordo * irpefRate);
                    const inps = Math.round(r.lordo * inpsRate);
                    const buf = Math.round(r.lordo * bufferRate);
                    const accantona = iva + irpef + inps + buf;
                    const tieni = r.lordo - accantona;
                    return (
                      <tr key={i} style={{ cursor: "default" }}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{r.mese}</td>
                        <td className="r num">{fmtN(r.lordo)} €</td>
                        {aliquotaIVA > 0 && <td className="r num t-warn">{fmtN(iva)} €</td>}
                        <td className="r num t-info">{fmtN(irpef)} €</td>
                        <td className="r num" style={{ color: "var(--accent-ink)" }}>{fmtN(inps)} €</td>
                        <td className="r num t-danger" style={{ fontWeight: 700 }}>{fmtN(accantona)} €</td>
                        <td className="r num t-pos" style={{ fontWeight: 700 }}>{fmtN(tieni)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scadenze IVA */}
          {aliquotaIVA > 0 && scadenzeIVA.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title"><Icon name="calendar" size={15} />Prossime scadenze fiscali</div>
              </div>
              <div className="row-list">
                {scadenzeIVA.map((s) => {
                  const isPast = s.days !== null && s.days < 0;
                  return (
                    <div
                      key={`${s.year}-${s.quarter}`}
                      className="lrow"
                      style={{ gridTemplateColumns: "auto 1fr auto auto", gap: 16, cursor: "default" }}
                    >
                      <span className="kpi-ico ico-warn" style={{ width: 36, height: 36 }}><Icon name="clock" size={16} /></span>
                      <div>
                        <div className="nm">IVA {s.label} — {s.year}</div>
                        <div className="meta">
                          {new Date(s.deadline).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                      </div>
                      <span
                        className={"deadline-chip" + (s.days !== null && s.days >= 0 && s.days <= 7 ? " urgent" : "")}
                        style={{ justifySelf: "end" }}
                      >
                        <b>{isPast ? `scaduta ${Math.abs(s.days)}gg fa` : s.days === 0 ? "Oggi" : `${s.days}gg`}</b>
                      </span>
                      <span className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--warn)", minWidth: 90, textAlign: "right" }}>
                        {fmtN(s.iva)} €
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Nota regime forfettario */}
          {regime === "forfettario" && aliquotaIVA === 0 && (
            <div className="notice">
              <div className="notice-ico ico-info"><Icon name="shield" size={18} /></div>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
                <b style={{ color: "var(--ink)" }}>Regime forfettario:</b> esente IVA — non addebiti né versi IVA.
                L&apos;imposta sostitutiva al {aliquotaIRPEF}% si paga in acconto (novembre) e saldo (giugno) dell&apos;anno successivo.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
