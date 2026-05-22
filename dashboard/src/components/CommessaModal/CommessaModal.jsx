import { useState } from "react";
import styles from "./CommessaModal.module.css";

const STATI    = ["In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso"];
const PRIORITA = ["Alta", "Media", "Bassa"];

export const TIPI_PAGAMENTO = [
  { id: "Mensile",             label: "Mensile",              desc: "Canone ricorrente ogni mese" },
  { id: "Una tantum",          label: "Una tantum",           desc: "Pagamento unico alla firma / inizio" },
  { id: "Acconto + saldo",     label: "Acconto + saldo",      desc: "Acconto iniziale + saldo a fine progetto" },
  { id: "Saldo fine progetto", label: "Saldo fine progetto",  desc: "Pagamento intero al completamento" },
];

const EMPTY = {
  cliente: "",
  servizio: "",
  tipo: "Mensile",
  inizio: "",
  fine: "",
  stato: "In corso",
  lordoMensile: "",
  lordoProgetto: "",
  acconto: "",
  saldo: "",
  upsellTarget: "",
  priorita: "Media",
  note: "",
};

export default function CommessaModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    return {
      ...EMPTY,
      ...initial,
      lordoMensile:  initial.lordoMensile  ?? "",
      lordoProgetto: initial.lordoProgetto ?? "",
      acconto:       initial.acconto       ?? "",
      saldo:         initial.saldo         ?? "",
      upsellTarget:  initial.upsellTarget  ?? "",
      inizio:        initial.inizio        ?? "",
      fine:          initial.fine          ?? "",
    };
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.cliente.trim()) return;
    onSave({
      ...form,
      id:            initial?.id ?? null,
      lordoMensile:  form.lordoMensile  !== "" ? Number(form.lordoMensile)  : null,
      lordoProgetto: form.lordoProgetto !== "" ? Number(form.lordoProgetto) : null,
      acconto:       form.acconto       !== "" ? Number(form.acconto)       : null,
      saldo:         form.saldo         !== "" ? Number(form.saldo)         : null,
      upsellTarget:  form.upsellTarget  !== "" ? Number(form.upsellTarget)  : null,
      inizio:        form.inizio || null,
      fine:          form.fine   || null,
    });
  }

  const tipo = form.tipo;
  const accontoN = Number(form.acconto) || 0;
  const saldoN   = Number(form.saldo)   || 0;
  const totaleAccontoSaldo = accontoN + saldoN;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {initial ? "Modifica commessa" : "Nuova commessa"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Cliente + priorità */}
          <div className={styles.row}>
            <Field label="Cliente *">
              <input
                required
                className={styles.input}
                value={form.cliente}
                onChange={(e) => set("cliente", e.target.value)}
                placeholder="Nome cliente"
              />
            </Field>
            <Field label="Priorità">
              <select className={styles.input} value={form.priorita} onChange={(e) => set("priorita", e.target.value)}>
                {PRIORITA.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          {/* Servizio */}
          <Field label="Servizio">
            <input
              className={styles.input}
              value={form.servizio}
              onChange={(e) => set("servizio", e.target.value)}
              placeholder="Descrizione del servizio"
            />
          </Field>

          {/* Tipo pagamento */}
          <Field label="Tipo pagamento">
            <div className={styles.tipoGrid}>
              {TIPI_PAGAMENTO.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.tipoBtn} ${tipo === t.id ? styles.tipoBtnActive : ""}`}
                  onClick={() => set("tipo", t.id)}
                >
                  <span className={styles.tipoBtnLabel}>{t.label}</span>
                  <span className={styles.tipoBtnDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Stato + date */}
          <div className={styles.row}>
            <Field label="Stato">
              <select className={styles.input} value={form.stato} onChange={(e) => set("stato", e.target.value)}>
                {STATI.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className={styles.row}>
            <Field label="Data inizio">
              <input type="date" className={styles.input} value={form.inizio} onChange={(e) => set("inizio", e.target.value)} />
            </Field>
            <Field label="Data fine">
              <input type="date" className={styles.input} value={form.fine} onChange={(e) => set("fine", e.target.value)} />
            </Field>
          </div>

          {/* Campi specifici per tipo */}
          {tipo === "Mensile" && (
            <div className={styles.row}>
              <Field label="Lordo mensile (€)">
                <input
                  type="number" className={styles.input} min="0"
                  value={form.lordoMensile}
                  onChange={(e) => set("lordoMensile", e.target.value)}
                  placeholder="es. 1000"
                />
              </Field>
              <Field label="Upsell target lordo (€)">
                <input
                  type="number" className={styles.input} min="0"
                  value={form.upsellTarget}
                  onChange={(e) => set("upsellTarget", e.target.value)}
                  placeholder="Obiettivo upsell"
                />
              </Field>
            </div>
          )}

          {(tipo === "Una tantum" || tipo === "Saldo fine progetto") && (
            <Field label={`Importo totale lordo (€) — pagato ${tipo === "Una tantum" ? "alla firma" : "a fine progetto"}`}>
              <input
                type="number" className={styles.input} min="0"
                value={form.lordoProgetto}
                onChange={(e) => set("lordoProgetto", e.target.value)}
                placeholder="es. 3500"
              />
            </Field>
          )}

          {tipo === "Acconto + saldo" && (
            <>
              <div className={styles.row}>
                <Field label="Acconto (€) — pagato alla firma">
                  <input
                    type="number" className={styles.input} min="0"
                    value={form.acconto}
                    onChange={(e) => set("acconto", e.target.value)}
                    placeholder="es. 1000"
                  />
                </Field>
                <Field label="Saldo (€) — pagato a fine progetto">
                  <input
                    type="number" className={styles.input} min="0"
                    value={form.saldo}
                    onChange={(e) => set("saldo", e.target.value)}
                    placeholder="es. 2500"
                  />
                </Field>
              </div>
              {totaleAccontoSaldo > 0 && (
                <div className={styles.totaleRiga}>
                  Totale progetto: <strong>{totaleAccontoSaldo.toLocaleString("it-IT")} €</strong>
                  {accontoN > 0 && <span> · Acconto {Math.round(accontoN / totaleAccontoSaldo * 100)}%</span>}
                </div>
              )}
            </>
          )}

          {/* Note */}
          <Field label="Note">
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Note interne, reminder, contesto…"
              rows={3}
            />
          </Field>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Annulla</button>
            <button type="submit" className={styles.saveBtn}>
              {initial ? "Salva modifiche" : "Crea commessa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}
