import { useState, useMemo } from "react";
import {
  formatCurrency,
  formatDate,
  daysUntil,
  getStatoTone,
  getPrioritaColor,
  calcNetto,
  getCommessaLordoMensile,
  getRicavoOrario,
  getAvatarColorByIndex,
  getInitials,
} from "../../utils/helpers";
import CommessaModal from "../CommessaModal/CommessaModal";
import Icon from "../Icon";
import styles from "./Commesse.module.css";

const STATI = ["In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso"];
const PRIORITA = ["Alta", "Media", "Bassa"];

const nf = new Intl.NumberFormat("it-IT");
const fmtN = (n) => nf.format(Math.round(n ?? 0));

export default function Commesse({ commesse, setCommesse, setup }) {
  const [search, setSearch] = useState("");
  const [filterStato, setFilterStato] = useState("Tutti");
  const [filterPriorita, setFilterPriorita] = useState("Tutti");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showArchivio, setShowArchivio] = useState(false);

  // Colore stabile per commessa (per posizione nella lista completa): ognuna distinta,
  // coerente tra tabella e dettaglio anche quando si filtra
  const colorById = useMemo(() => {
    const m = {};
    commesse.forEach((c, i) => { m[c.id] = getAvatarColorByIndex(i); });
    return m;
  }, [commesse]);

  const filtered = commesse.filter((c) => {
    const matchSearch =
      !search ||
      c.cliente.toLowerCase().includes(search.toLowerCase()) ||
      c.servizio.toLowerCase().includes(search.toLowerCase());
    const matchStato = filterStato === "Tutti" || c.stato === filterStato;
    const matchPriorita = filterPriorita === "Tutti" || c.priorita === filterPriorita;
    return matchSearch && matchStato && matchPriorita;
  });

  const selected = commesse.find((c) => c.id === selectedId);

  // Separo attive/lavorabili da concluse/archiviate
  const ARCHIVIATE = ["Concluso", "Perso"];
  const filteredAttive = filtered.filter((c) => !ARCHIVIATE.includes(c.stato));
  const filteredArchiviate = filtered.filter((c) => ARCHIVIATE.includes(c.stato));

  const attive = commesse.filter((c) => c.stato === "In corso" || c.stato === "In scadenza");
  const daChiarire = commesse.filter((c) => c.stato === "Da chiarire").length;
  const concluse = commesse.filter((c) => c.stato === "Concluso").length;
  const feeAggregato = attive.reduce((s, c) => s + (getCommessaLordoMensile(c) || 0), 0);
  const nettoAggregato = calcNetto(feeAggregato, setup.fattoreNetto);

  function handleNew() {
    setEditData(null);
    setModalOpen(true);
  }

  function handleEdit(commessa) {
    setEditData(commessa);
    setModalOpen(true);
  }

  function handleDelete(id) {
    if (!confirm("Eliminare questa commessa?")) return;
    setCommesse((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleSave(data) {
    if (data.id) {
      setCommesse((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      if (selectedId === data.id) setSelectedId(data.id);
    } else {
      const newId = Math.max(0, ...commesse.map((c) => c.id)) + 1;
      setCommesse((prev) => [...prev, { ...data, id: newId }]);
    }
    setModalOpen(false);
  }

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">Portfolio</div>
          <h1 className="page-title">Commesse</h1>
          <p className="page-sub">Tutte le commesse attive, da chiarire e concluse con fee e scadenze.</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={handleNew}>
            <Icon name="plus" size={16} /> Nuova commessa
          </button>
        </div>
      </header>

      <div className="mini-grid">
        <div className="mini">
          <div className="l">Commesse totali</div>
          <div className="v">{commesse.length}</div>
          <div className="s">{attive.length} attive · {daChiarire} da chiarire · {concluse} concluse</div>
        </div>
        <div className="mini">
          <div className="l">Fee lordo aggregato</div>
          <div className="v t-accent num">{fmtN(feeAggregato)} €</div>
          <div className="s">somma mensile ricorrente</div>
        </div>
        <div className="mini">
          <div className="l">Netto stimato</div>
          <div className="v t-pos num">{fmtN(nettoAggregato)} €</div>
          <div className="s">fattore {(setup.fattoreNetto * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Cerca cliente o servizio…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ width: "auto" }}
          value={filterStato}
          onChange={(e) => setFilterStato(e.target.value)}
        >
          <option value="Tutti">Tutti gli stati</option>
          {STATI.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: "auto" }}
          value={filterPriorita}
          onChange={(e) => setFilterPriorita(e.target.value)}
        >
          <option value="Tutti">Tutte le priorità</option>
          {PRIORITA.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="folder" size={15} />Commesse attive</div>
          <span className="panel-note">{filteredAttive.length} {filteredAttive.length === 1 ? "risultato" : "risultati"}</span>
        </div>
        {filteredAttive.length === 0 ? (
          <p style={{ color: "var(--ink-3)", fontSize: 13.5, padding: "14px var(--card-pad) 22px" }}>
            Nessuna commessa attiva{filtered.length > 0 ? " con questi filtri" : ""}.
          </p>
        ) : (
          <CommesseTable rows={filteredAttive} colorById={colorById} setup={setup} selectedId={selectedId} setSelectedId={setSelectedId} />
        )}
      </section>

      {filteredArchiviate.length > 0 && (
        <section className="panel">
          <button
            className={styles.archivioHead}
            onClick={() => setShowArchivio((v) => !v)}
          >
            <span className="panel-title" style={{ color: "var(--ink-3)" }}>
              <Icon name="history" size={15} />Concluse &amp; archiviate
              <span className="badge" style={{ marginLeft: 6 }}>{filteredArchiviate.length}</span>
            </span>
            <span className="panel-note">{showArchivio ? "nascondi ▲" : "mostra ▼"}</span>
          </button>
          {showArchivio && (
            <CommesseTable rows={filteredArchiviate} colorById={colorById} setup={setup} selectedId={selectedId} setSelectedId={setSelectedId} archived />
          )}
        </section>
      )}

      {selected && (
        <CommessaDetail
          commessa={selected}
          color={colorById[selected.id]}
          setup={setup}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {modalOpen && (
        <CommessaModal
          initial={editData}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function CommesseTable({ rows, colorById, setup, selectedId, setSelectedId, archived }) {
  return (
    <div className={styles.tableWrap}>
      <table className="table">
        <thead>
          <tr>
            <th>Commessa</th>
            <th>Tipo</th>
            <th>Stato</th>
            <th className="r">Fee lordo</th>
            <th className="r">Netto</th>
            <th className="r">Ore/mese</th>
            <th className="r">€/h</th>
            <th className="r">Scadenza</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const days = c.fine ? daysUntil(c.fine) : null;
            const lordo = getCommessaLordoMensile(c);
            const netto = calcNetto(lordo, setup.fattoreNetto);
            const orario = getRicavoOrario(c, setup.fattoreNetto);
            const scadColor =
              days === null ? "var(--ink-3)"
              : days <= 7 ? "var(--danger)"
              : days <= 21 ? "var(--warn)"
              : "var(--ink-2)";
            return (
              <tr
                key={c.id}
                className={selectedId === c.id ? styles.rowActive : ""}
                style={archived ? { opacity: 0.72 } : undefined}
                onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
              >
                <td>
                  <div className="client-cell">
                    <span className="client-ava" style={{ background: colorById[c.id] }}>
                      {getInitials(c.cliente)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{c.cliente}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.servizio}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--ink-2)" }}>{c.tipo || "—"}</td>
                <td>
                  <span className={"pill s-" + getStatoTone(c.stato)}>
                    <span className="d"></span>{c.stato}
                  </span>
                </td>
                <td className="r num" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {lordo ? `${fmtN(lordo)} €` : c.lordoProgetto ? `${fmtN(c.lordoProgetto)} €` : "—"}
                </td>
                <td className="r num t-pos" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {netto ? `${fmtN(netto)} €` : c.lordoProgetto ? `${fmtN(calcNetto(c.lordoProgetto, setup.fattoreNetto))} €` : "—"}
                </td>
                <td className="r num" style={{ color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                  {c.oreMensili ? `${c.oreMensili} h` : "—"}
                </td>
                <td className="r num t-info" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {orario ? `${fmtN(orario.lordoOra)} €` : "—"}
                </td>
                <td className="r num" style={{ color: scadColor, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {days !== null ? `${days} gg` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CommessaDetail({ commessa: c, color, setup, onEdit, onDelete }) {
  const lordo = getCommessaLordoMensile(c);
  const netto = calcNetto(lordo, setup.fattoreNetto);
  const nettoProgetto = calcNetto(c.lordoProgetto, setup.fattoreNetto);
  const upsellNetto = calcNetto(c.upsellTarget, setup.fattoreNetto);
  const orario = getRicavoOrario(c, setup.fattoreNetto);
  const days = c.fine ? daysUntil(c.fine) : null;

  return (
    <section className="panel reveal">
      <div className="panel-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="client-ava" style={{ background: color, width: 40, height: 40, borderRadius: 11, fontSize: 16 }}>
            {getInitials(c.cliente)}
          </span>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>
              {c.cliente}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{c.servizio}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onEdit}><Icon name="edit" size={15} /> Modifica</button>
          <button className="btn btn-danger" onClick={onDelete}><Icon name="trash" size={15} /> Elimina</button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <DetailRow label="Stato" value={
          <span className={"pill s-" + getStatoTone(c.stato)}><span className="d"></span>{c.stato}</span>
        } />
        <DetailRow label="Priorità" value={
          <span style={{ color: getPrioritaColor(c.priorita), fontWeight: 600 }}>{c.priorita}</span>
        } />
        <DetailRow label="Tipo" value={c.tipo || "—"} />
        <DetailRow label="Inizio" value={formatDate(c.inizio)} />
        <DetailRow label="Fine" value={
          c.fine ? (
            <span>
              {formatDate(c.fine)}
              {days !== null && (
                <span style={{ color: days <= 7 ? "var(--danger)" : days <= 21 ? "var(--warn)" : "var(--ink-3)", marginLeft: 8, fontSize: "0.8rem" }}>
                  ({days >= 0 ? `tra ${days} giorni` : `scaduta ${Math.abs(days)} giorni fa`})
                </span>
              )}
            </span>
          ) : "—"
        } />
        {lordo && <DetailRow label="Lordo mensile" value={<span className="num">{formatCurrency(lordo)}</span>} />}
        {netto && <DetailRow label="Netto mensile" value={<span className="num t-pos">{formatCurrency(netto)}</span>} />}
        {c.oreMensili && <DetailRow label="Ore dedicate/mese" value={<span className="num">{c.oreMensili} h</span>} />}
        {orario && <DetailRow label="Ricavo orario lordo" value={<span className="num t-info">{fmtN(orario.lordoOra)} €/h</span>} />}
        {orario && <DetailRow label="Ricavo orario netto" value={<span className="num t-pos">{fmtN(orario.nettoOra)} €/h</span>} />}
        {c.lordoProgetto && <DetailRow label="Lordo progetto" value={<span className="num">{formatCurrency(c.lordoProgetto)}</span>} />}
        {nettoProgetto && <DetailRow label="Netto progetto" value={<span className="num t-pos">{formatCurrency(nettoProgetto)}</span>} />}
        {c.upsellTarget && (
          <>
            <DetailRow label="Upsell target lordo" value={<span className="num t-info">{formatCurrency(c.upsellTarget)}</span>} />
            <DetailRow label="Upsell target netto" value={<span className="num t-info">{formatCurrency(upsellNetto)}</span>} />
          </>
        )}
      </div>

      {c.note && (
        <div className={styles.detailNote}>
          <div className={styles.noteLabel}>Note</div>
          <p className={styles.noteText}>{c.note}</p>
        </div>
      )}
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
