import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ComposedChart, Line,
} from "recharts";
import {
  formatCurrency,
  daysUntil,
  getStatoColor,
  calcNetto,
  getCommessaLordoMensile,
  getRicavoOrario,
  getMeseCorrente,
  getLordoPerMese,
} from "../../utils/helpers";
import Icon from "../Icon";
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

export default function Dashboard({ commesse, setup, setSetup }) {
  const now = new Date();
  const anno = now.getFullYear();
  const meseIdx = now.getMonth();

  const attive = commesse.filter(
    (c) => c.stato === "In corso" || c.stato === "In scadenza"
  );

  const lordoMensileAttivo = getLordoPerMese(meseIdx, anno, commesse);
  const nettoMensileAttivo = calcNetto(lordoMensileAttivo, setup.fattoreNetto);

  const statoCount = STATO_ORDER.map((s) => ({
    name: s,
    value: commesse.filter((c) => c.stato === s).length,
    color: getStatoColor(s),
  })).filter((s) => s.value > 0);
  const statoTotal = statoCount.reduce((s, e) => s + e.value, 0);

  const upsellOpportunities = commesse
    .filter((c) => c.upsellTarget)
    .reduce((sum, c) => sum + c.upsellTarget, 0);

  const inScadenza = commesse
    .filter((c) => {
      if (!c.fine) return false;
      const days = daysUntil(c.fine);
      return days !== null && days >= 0 && days <= setup.alertScadenzaGiorni;
    })
    .sort((a, b) => daysUntil(a.fine) - daysUntil(b.fine));

  // — Tempo del mese / saturazione —
  const oreDisponibili = setup.oreMeseDisponibili ?? 160;
  const tempoData = attive
    .filter((c) => Number(c.oreMensili) > 0)
    .map((c) => {
      const orario = getRicavoOrario(c, setup.fattoreNetto);
      return {
        nome: c.cliente.length > 14 ? c.cliente.slice(0, 13) + "…" : c.cliente,
        ore: Number(c.oreMensili),
        tipo: c.tipo === "Progetto" ? "Progetto" : "Commessa",
        lordoOra: orario ? orario.lordoOra : null,
      };
    })
    .sort((a, b) => b.ore - a.ore);
  const oreTotali = tempoData.reduce((s, d) => s + d.ore, 0);
  const saturazione = oreDisponibili > 0 ? Math.round((oreTotali / oreDisponibili) * 100) : 0;
  const satColor = saturazione <= 60 ? C.pos : saturazione <= 85 ? C.warn : C.danger;
  const attiveSenzaOre = attive.filter((c) => !(Number(c.oreMensili) > 0)).length;

  const barData = commesse
    .filter((c) => getCommessaLordoMensile(c))
    .map((c) => ({
      nome: c.cliente.length > 12 ? c.cliente.slice(0, 11) + "…" : c.cliente,
      Lordo: getCommessaLordoMensile(c),
      Netto: calcNetto(getCommessaLordoMensile(c), setup.fattoreNetto),
    }));

  const revenueHistory = setup.incassatoStorico || [];
  const sortedStorico = [...revenueHistory].sort((a, b) => {
    const [mA, yA = "0"] = a.mese.split(" ");
    const [mB, yB = "0"] = b.mese.split(" ");
    const yearDiff = Number(yA) - Number(yB);
    if (yearDiff !== 0) return yearDiff;
    return MESI_IT.indexOf(mA) - MESI_IT.indexOf(mB);
  });

  const meseCorrente = getMeseCorrente();
  const meseCorrManc = !revenueHistory.some(
    (r) => r.mese.toLowerCase() === meseCorrente.toLowerCase()
  );

  const costiFissi = setup.costiFissi || [];
  const costiFissiMensili = costiFissi.filter((c) => c.tipo !== "annuale");
  const costiAnnuali = costiFissi.filter((c) => c.tipo === "annuale");
  const totaleCostiFissi = costiFissiMensili.reduce((s, c) => s + c.importo, 0);
  const totaleCostiAnnuali = costiAnnuali.reduce((s, c) => s + (c.importoAnnuale || c.importo * 12), 0);
  const totaleCostiAnnualiMensile = Math.round(totaleCostiAnnuali / 12);

  const cassaIniziale    = setup.cassaIniziale ?? 0;
  const cryptoVal        = setup.crypto ?? 0;
  const cryptoAggiornato = setup.cryptoAggiornato ?? null;

  const cashFlowData = (() => {
    let balance = cassaIniziale;
    return Array.from({ length: 12 }, (_, i) => {
      const d     = new Date(anno, meseIdx + i, 1);
      const mIdx  = d.getMonth();
      const y     = d.getFullYear();
      const label = `${MESI_IT[mIdx]} ${y}`;
      const recorded = revenueHistory.find(r => r.mese.toLowerCase() === label.toLowerCase());
      const netto = recorded
        ? recorded.netto
        : calcNetto(getLordoPerMese(mIdx, y, commesse), setup.fattoreNetto);
      const tipo  = recorded ? "reale" : (i === 0 ? "stimato" : "proiezione");
      const flusso = netto - totaleCostiFissi;
      balance += flusso;
      return { mese: MESI_SHORT[mIdx], netto, costi: totaleCostiFissi, flusso, cassa: balance, tipo };
    });
  })();
  const cassaFinale = cashFlowData[cashFlowData.length - 1]?.cassa ?? cassaIniziale;

  const profittoMensile = nettoMensileAttivo - totaleCostiFissi;
  const breakEvenLordo = totaleCostiFissi > 0
    ? Math.round(totaleCostiFissi / setup.fattoreNetto)
    : null;

  // YTD escluso mese corrente
  const storicoSenzaMeseCorrente = sortedStorico.filter(
    (r) => r.mese.toLowerCase() !== meseCorrente.toLowerCase()
  );
  const ytdLordo = storicoSenzaMeseCorrente.reduce((s, r) => s + r.lordo, 0);
  const ytdNetto = storicoSenzaMeseCorrente.reduce((s, r) => s + r.netto, 0);
  const ytdProfitto = totaleCostiFissi > 0
    ? ytdNetto - totaleCostiFissi * storicoSenzaMeseCorrente.length
    : null;

  // — Panoramica annuale —
  const annualData = MESI_IT.map((nome, i) => {
    const label = `${nome} ${anno}`;
    const recorded = revenueHistory.find(
      (r) => r.mese.toLowerCase() === label.toLowerCase()
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

  const kpis = [
    { label: "Lordo mensile attivo", value: fmtN(lordoMensileAttivo), cur: "€", sub: "commesse in corso + in scadenza", tone: "accent", icon: "card" },
    { label: "Netto mensile attivo", value: fmtN(nettoMensileAttivo), cur: "€", sub: `fattore ${(setup.fattoreNetto * 100).toFixed(0)}%`, tone: "pos", icon: "trend" },
    { label: "Commesse attive", value: attive.length, sub: `su ${commesse.length} totali`, tone: "ink", icon: "folder" },
    { label: "Potenziale upsell", value: fmtN(upsellOpportunities), cur: "€", sub: "obiettivo mensile aggregato", tone: "info", icon: "spark" },
    ...(totaleCostiFissi > 0 ? [
      { label: "Costi mensili", value: fmtN(totaleCostiFissi), cur: "€", sub: `${costiFissi.length} voci · ${meseCorrente.split(" ")[0]}`, tone: "danger", icon: "coin" },
      { label: "Profitto mensile", value: fmtN(profittoMensile), cur: "€", sub: `netto − ${fmtN(totaleCostiFissi)} € costi fissi`, tone: profittoMensile >= 0 ? "pos" : "danger", icon: "wallet" },
    ] : []),
    ...(costiAnnuali.length > 0 ? [
      { label: "Spese annuali", value: fmtN(totaleCostiAnnuali), cur: "€", sub: "promemoria · non le stai pagando ora", tone: "warn", icon: "calendar" },
      { label: "Equivalente mensile spese ann.", value: fmtN(totaleCostiAnnualiMensile), cur: "€", sub: "se le spalmassi ogni mese", tone: "warn", icon: "divide" },
    ] : []),
  ];

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }}>
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

      {inScadenza.length > 0 && (
        <div className="notice warn reveal">
          <div
            className="notice-ico"
            style={{ background: "var(--panel)", color: "var(--warn)", border: "1px solid color-mix(in oklab, var(--warn) 30%, var(--hair))" }}
          >
            <Icon name="alert" size={18} />
          </div>
          <div className="chip-row">
            <span className="lab" style={{ marginRight: 4 }}>Scadenze entro {setup.alertScadenzaGiorni} giorni</span>
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
          onAdd={(entry) =>
            setSetup((prev) => ({
              ...prev,
              incassatoStorico: [...(prev.incassatoStorico || []), entry],
            }))
          }
        />
      )}

      <div className="grid kpi-grid">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Tempo del mese / saturazione */}
      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="clock" size={15} />Tempo del mese — {meseCorrente}</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: "var(--ink)" }}>{oreTotali} h</div>
              <div className="l">Ore impegnate</div>
            </div>
            <div className="si">
              <div className="v num" style={{ color: satColor }}>{saturazione}%</div>
              <div className="l">Saturazione su {oreDisponibili} h</div>
            </div>
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div className="statbar-track" style={{ height: 10 }}>
            <div
              className="statbar-fill"
              style={{ width: Math.min(100, saturazione) + "%", background: satColor }}
            ></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-3)", marginTop: 6, marginBottom: 14 }}>
            <span>0 h</span>
            <span>{oreDisponibili} h disponibili</span>
          </div>

          {tempoData.length > 0 ? (
            <>
              <div className="legend" style={{ marginBottom: 4 }}>
                <span className="li"><span className="sw" style={{ background: "var(--accent)" }}></span>Commesse</span>
                <span className="li"><span className="sw" style={{ background: C.info }}></span>Progetti</span>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(120, tempoData.length * 46 + 36)}>
                <BarChart data={tempoData} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: C.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <YAxis type="category" dataKey="nome" width={112} tick={{ fill: C.ink2, fontSize: 11.5, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(60,44,28,.05)" }}
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "#A39684", fontWeight: 700 }}
                    itemStyle={{ color: "#E9E0D0" }}
                    formatter={(v, name, props) => [
                      `${v} h/mese${props.payload.lordoOra ? ` · ${fmtN(props.payload.lordoOra)} €/h lordo` : ""}`,
                      props.payload.tipo,
                    ]}
                  />
                  <Bar dataKey="ore" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {tempoData.map((d, i) => (
                      <Cell key={i} fill={d.tipo === "Progetto" ? C.info : "#B5654A"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p style={{ color: "var(--ink-3)", fontSize: 13 }}>
              Nessuna ora registrata: aggiungi le «Ore dedicate al mese» alle tue commesse per vedere lo spaccato del tempo.
            </p>
          )}
          {attiveSenzaOre > 0 && tempoData.length > 0 && (
            <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 6 }}>
              {attiveSenzaOre} {attiveSenzaOre === 1 ? "commessa attiva è senza" : "commesse attive sono senza"} stima ore — il totale potrebbe essere sottostimato.
            </p>
          )}
        </div>
      </section>

      {/* Panoramica annuale */}
      <section className="panel">
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
        <section className="panel">
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
                    const [m, y] = r.mese.split(" ");
                    const idx = MESI_IT.indexOf(m);
                    return idx >= 0 ? `${MESI_SHORT[idx]} '${(y || "").slice(2)}` : r.mese;
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
            {storicoSenzaMeseCorrente.length > 0 && (
              <div className="ytd-rail">
                <div className="ytd-item">
                  <div className="v t-info num">{fmtN(ytdLordo)} €</div>
                  <div className="l">Lordo incassato YTD</div>
                  <div className="s">{storicoSenzaMeseCorrente.length} mesi · escluso {meseCorrente.split(" ")[0]}</div>
                </div>
                <div className="ytd-item">
                  <div className="v t-pos num">{fmtN(ytdNetto)} €</div>
                  <div className="l">Netto incassato YTD</div>
                  <div className="s">fattore {(setup.fattoreNetto * 100).toFixed(0)}%</div>
                </div>
                {ytdProfitto !== null && (
                  <div className="ytd-item">
                    <div className={"v num " + (ytdProfitto >= 0 ? "t-pos" : "t-danger")}>
                      {ytdProfitto >= 0 ? "+" : ""}{fmtN(ytdProfitto)} €
                    </div>
                    <div className="l">Profitto YTD</div>
                    <div className="s">netto − {fmtN(totaleCostiFissi)} €/mese</div>
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
            <div className="panel-title"><Icon name="bars" size={15} />Fee mensile per cliente</div>
            <div className="legend">
              <span className="li"><span className="sw" style={{ background: "var(--accent)" }}></span>Lordo</span>
              <span className="li"><span className="sw" style={{ background: C.pos }}></span>Netto</span>
            </div>
          </div>
          <div className="panel-pad" style={{ paddingTop: 4 }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <XAxis dataKey="nome" tick={{ fill: C.ink2, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ink3, fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${kfmt(v)}€`} width={46} />
                <Tooltip cursor={{ fill: "rgba(60,44,28,.05)" }} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#A39684", fontWeight: 700 }} itemStyle={{ color: "#E9E0D0" }} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="Lordo" fill="#B5654A" radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Netto" fill={C.pos} radius={[3.5, 3.5, 0, 0]} maxBarSize={20} />
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

      {/* Cash Flow */}
      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="flow" size={15} />Cash flow — prossimi 12 mesi</div>
          <div className="stat-strip">
            <div className="si">
              <div className="v num" style={{ color: cassaFinale >= cassaIniziale ? "var(--pos-ink)" : "var(--danger)" }}>{formatCurrency(cassaFinale)}</div>
              <div className="l">Cassa fra 12 mesi</div>
            </div>
            {cryptoVal > 0 && (
              <div className="si">
                <div className="v num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(cassaIniziale + cryptoVal)}</div>
                <div className="l">Cassa + Crypto oggi</div>
              </div>
            )}
          </div>
        </div>
        <div className="panel-pad" style={{ paddingTop: 0 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 6, fontSize: 13, color: "var(--ink-2)" }}>
            <span>Cassa attuale: <b className="num" style={{ color: "var(--ink)" }}>{formatCurrency(cassaIniziale)}</b></span>
            {cryptoVal > 0 && (
              <span>
                Crypto: <b className="num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(cryptoVal)}</b>
                {cryptoAggiornato && <span style={{ color: "var(--ink-3)" }}> al {cryptoAggiornato}</span>}
              </span>
            )}
            <span>Costi fissi/mese: <b className="num" style={{ color: "var(--danger)" }}>{formatCurrency(totaleCostiFissi)}</b></span>
          </div>
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
              <Line
                yAxisId="cassa"
                type="monotone"
                dataKey="cassa"
                name="Cassa"
                stroke={C.info}
                strokeWidth={2.4}
                dot={{ fill: "#FBF8F2", stroke: C.info, strokeWidth: 2, r: 3.4 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function MonthlyPrompt({ mese, stimaLordo, fattoreNetto, commesseAttive, onAdd }) {
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
            <b style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{mese}</b> non è ancora nello storico
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3 }}>
            Stimato da commesse attive: <b className="num" style={{ color: "var(--accent-ink)" }}>{formatCurrency(stimaLordo)}</b>
            {commesseAttive.length > 0 && (
              <span> ({commesseAttive.map((c) => c.cliente).join(", ")})</span>
            )}
          </div>
        </div>
      </div>

      {!open ? (
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} /> Registra incassato
        </button>
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

function KpiCard({ label, value, cur, sub, tone, icon }) {
  return (
    <div className="kpi reveal">
      <span className={"kpi-accent-bar " + TONE_BAR[tone]}></span>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={"kpi-ico " + TONE_ICO[tone]}><Icon name={icon} size={15} /></span>
      </div>
      <div className={"kpi-val num " + TONE_TXT[tone]}>
        {value}{cur && <span className="cur">{cur}</span>}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
