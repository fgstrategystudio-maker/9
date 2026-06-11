import { useState, useRef } from "react";
import { formatCurrency } from "../../utils/helpers";
import Icon from "../Icon";
import styles from "./Setup.module.css";
import { exportData } from "../../lib/backup";
import { syncToSupabase } from "../../lib/supabase";

const nf = new Intl.NumberFormat("it-IT");
const fmtN = (n) => nf.format(Math.round(n ?? 0));

export default function Setup({ setup, setSetup }) {
  const [form, setForm] = useState({
    fattoreNetto: (setup.fattoreNetto * 100).toFixed(0),
    alertScadenzaGiorni: setup.alertScadenzaGiorni,
  });
  const [saved, setSaved] = useState(false);

  const fiscale = setup.fiscale || {};
  const [fiscaleForm, setFiscaleForm] = useState({
    regime: fiscale.regime || "forfettario",
    aliquotaIVA: fiscale.aliquotaIVA ?? 0,
    aliquotaIRPEF: fiscale.aliquotaIRPEF ?? 15,
    aliquotaINPS: fiscale.aliquotaINPS ?? 26.23,
    bufferExtra: fiscale.bufferExtra ?? 5,
  });
  const [fiscaleSaved, setFiscaleSaved] = useState(false);

  function handleSaveFiscale(e) {
    e.preventDefault();
    setSetup((prev) => ({
      ...prev,
      fiscale: {
        regime: fiscaleForm.regime,
        aliquotaIVA: Number(fiscaleForm.aliquotaIVA),
        aliquotaIRPEF: Number(fiscaleForm.aliquotaIRPEF),
        aliquotaINPS: Number(fiscaleForm.aliquotaINPS),
        bufferExtra: Number(fiscaleForm.bufferExtra),
      },
    }));
    setFiscaleSaved(true);
    setTimeout(() => setFiscaleSaved(false), 2500);
  }

  function setFf(field, value) {
    setFiscaleForm((f) => ({ ...f, [field]: value }));
    if (field === "regime") {
      setFiscaleForm((f) => ({
        ...f,
        regime: value,
        aliquotaIVA: value === "forfettario" ? 0 : 22,
        aliquotaIRPEF: value === "forfettario" ? 15 : 23,
      }));
    }
  }

  const [newMese, setNewMese] = useState("");
  const [newLordo, setNewLordo] = useState("");
  const [newCostoNome, setNewCostoNome] = useState("");
  const [newCostoImporto, setNewCostoImporto] = useState("");

  function handleSaveSetup(e) {
    e.preventDefault();
    setSetup((prev) => ({
      ...prev,
      fattoreNetto: Number(form.fattoreNetto) / 100,
      alertScadenzaGiorni: Number(form.alertScadenzaGiorni),
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleAddIncassato(e) {
    e.preventDefault();
    if (!newMese || !newLordo) return;
    const lordo = Number(newLordo);
    const netto = Math.round(lordo * setup.fattoreNetto);
    setSetup((prev) => ({
      ...prev,
      incassatoStorico: [
        ...(prev.incassatoStorico || []),
        { mese: newMese, lordo, netto },
      ],
    }));
    setNewMese("");
    setNewLordo("");
  }

  function handleDeleteIncassato(idx) {
    setSetup((prev) => ({
      ...prev,
      incassatoStorico: prev.incassatoStorico.filter((_, i) => i !== idx),
    }));
  }

  function handleEditIncassato(idx, field, value) {
    setSetup((prev) => {
      const updated = prev.incassatoStorico.map((r, i) => {
        if (i !== idx) return r;
        const newRow = { ...r, [field]: field === "mese" ? value : Number(value) };
        // ricalcola netto se cambia lordo
        if (field === "lordo") newRow.netto = Math.round(Number(value) * prev.fattoreNetto);
        return newRow;
      });
      return { ...prev, incassatoStorico: updated };
    });
  }

  function handleAddCosto() {
    if (!newCostoNome || !newCostoImporto) return;
    setSetup((prev) => ({
      ...prev,
      costiFissi: [
        ...(prev.costiFissi || []),
        { id: Date.now(), nome: newCostoNome, importo: Number(newCostoImporto) },
      ],
    }));
    setNewCostoNome("");
    setNewCostoImporto("");
  }

  function handleDeleteCosto(id) {
    setSetup((prev) => ({
      ...prev,
      costiFissi: (prev.costiFissi || []).filter((c) => c.id !== id),
    }));
  }

  function handleEditCosto(id, field, value) {
    setSetup((prev) => ({
      ...prev,
      costiFissi: (prev.costiFissi || []).map((c) =>
        c.id !== id ? c : { ...c, [field]: field === "nome" ? value : Number(value) }
      ),
    }));
  }

  function handleResetAll() {
    if (!confirm("Resettare tutti i dati? L'operazione è irreversibile.")) return;
    localStorage.clear();
    window.location.reload();
  }

  const storico = setup.incassatoStorico || [];
  const totLordo = storico.reduce((s, r) => s + r.lordo, 0);
  const totNetto = storico.reduce((s, r) => s + r.netto, 0);
  const costiFissi = setup.costiFissi || [];
  const costiFissiMensili = costiFissi.filter((c) => c.tipo !== "annuale");
  const costiAnnuali = costiFissi.filter((c) => c.tipo === "annuale");
  const totaleCostiFissi = costiFissiMensili.reduce((s, c) => s + c.importo, 0);
  const totaleCostiAnnuali = costiAnnuali.reduce((s, c) => s + (c.importoAnnuale || c.importo * 12), 0);

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">Configurazione</div>
          <h1 className="page-title">Setup</h1>
          <p className="page-sub">Parametri di calcolo, patrimonio, storico ed export dei dati.</p>
        </div>
      </header>

      <div className="grid cols-2" style={{ alignItems: "start" }}>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="sliders" size={15} />Parametri di calcolo</div>
          </div>
          <form className={styles.formPad} onSubmit={handleSaveSetup}>
            <div>
              <label className="field-label">Fattore netto (%)</label>
              <input
                type="number"
                className="input num"
                value={form.fattoreNetto}
                onChange={(e) => setForm((f) => ({ ...f, fattoreNetto: e.target.value }))}
                min="1"
                max="100"
                step="1"
              />
              <span className="field-note">{form.fattoreNetto}% del lordo = netto stimato</span>
            </div>
            <div>
              <label className="field-label">Alert scadenze (giorni)</label>
              <input
                type="number"
                className="input num"
                value={form.alertScadenzaGiorni}
                onChange={(e) => setForm((f) => ({ ...f, alertScadenzaGiorni: e.target.value }))}
                min="1"
                max="365"
              />
              <span className="field-note">
                Alert quando la fine commessa è entro {form.alertScadenzaGiorni} giorni
              </span>
            </div>
            <div className={styles.formFooter}>
              {saved && <span className={styles.savedMsg}><Icon name="check" size={14} /> Salvato</span>}
              <button type="submit" className="btn btn-primary">Salva parametri</button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="plus" size={15} />Aggiungi incassato</div>
          </div>
          <form className={styles.formPad} onSubmit={handleAddIncassato}>
            <div>
              <label className="field-label">Mese (es. Aprile 2026)</label>
              <input
                className="input"
                value={newMese}
                onChange={(e) => setNewMese(e.target.value)}
                placeholder="Aprile 2026"
              />
            </div>
            <div>
              <label className="field-label">Lordo incassato (€)</label>
              <input
                type="number"
                className="input num"
                value={newLordo}
                onChange={(e) => setNewLordo(e.target.value)}
                placeholder="es. 4200"
                min="0"
              />
              {newLordo && (
                <span className="field-note">
                  Netto stimato: {formatCurrency(Math.round(Number(newLordo) * setup.fattoreNetto))}
                </span>
              )}
            </div>
            <div className={styles.formFooter}>
              <button type="submit" className="btn btn-primary">Aggiungi</button>
            </div>
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="history" size={15} />Storico incassato</div>
          {storico.length > 0 && (
            <span className="panel-note">
              Totale lordo <b className="num" style={{ color: "var(--ink)" }}>{fmtN(totLordo)} €</b>
              {" · "}netto <b className="num" style={{ color: "var(--pos-ink)" }}>{fmtN(totNetto)} €</b>
            </span>
          )}
        </div>

        {storico.length === 0 ? (
          <p className={styles.emptyText}>Nessun dato ancora registrato.</p>
        ) : (
          <div className={styles.editTable}>
            <div className={styles.editHead4}>
              <span>Mese</span>
              <span>Lordo</span>
              <span>Netto</span>
              <span></span>
            </div>
            {storico.map((row, i) => (
              <div key={i} className={styles.editRow4}>
                <input
                  className="input"
                  value={row.mese}
                  onChange={(e) => handleEditIncassato(i, "mese", e.target.value)}
                  placeholder="es. Maggio 2026"
                />
                <input
                  className="input num"
                  type="number"
                  value={row.lordo}
                  min="0"
                  onChange={(e) => handleEditIncassato(i, "lordo", e.target.value)}
                />
                <span className="num" style={{ color: "var(--pos-ink)", fontWeight: 600, fontSize: 14 }}>
                  {formatCurrency(row.netto)}
                </span>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleDeleteIncassato(i)}
                  title="Rimuovi"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="coin" size={15} />Costi fissi mensili</div>
          {costiFissiMensili.length > 0 && (
            <span className="panel-note">
              Totale <b className="num" style={{ color: "var(--danger)" }}>{fmtN(totaleCostiFissi)} €</b>/mese
            </span>
          )}
        </div>

        {costiFissiMensili.length > 0 && (
          <div className={styles.editTable}>
            <div className={styles.editHead3}>
              <span>Voce</span>
              <span>€/mese</span>
              <span></span>
            </div>
            {costiFissiMensili.map((c) => (
              <div key={c.id} className={styles.editRow3}>
                <input
                  className="input"
                  value={c.nome}
                  onChange={(e) => handleEditCosto(c.id, "nome", e.target.value)}
                />
                <input
                  className="input num"
                  type="number"
                  value={c.importo}
                  min="0"
                  onChange={(e) => handleEditCosto(c.id, "importo", e.target.value)}
                />
                <button className={styles.removeBtn} onClick={() => handleDeleteCosto(c.id)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {costiAnnuali.length > 0 && (
          <>
            <div className="panel-head" style={{ paddingTop: 8 }}>
              <div className="panel-title" style={{ color: "var(--warn)" }}>
                <Icon name="calendar" size={15} />Spese annuali (promemoria)
              </div>
              <span className="panel-note">
                Totale <b className="num" style={{ color: "var(--warn)" }}>{fmtN(totaleCostiAnnuali)} €</b>/anno · non nel conteggio mensile
              </span>
            </div>
            <div className={styles.editTable}>
              <div className={styles.editHead3}>
                <span>Voce</span>
                <span>€/anno</span>
                <span></span>
              </div>
              {costiAnnuali.map((c) => (
                <div key={c.id} className={`${styles.editRow3} ${styles.annualRow}`}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <input
                      className="input"
                      value={c.nome}
                      onChange={(e) => handleEditCosto(c.id, "nome", e.target.value)}
                    />
                    <span className="field-note">{fmtN(c.importo)} €/mese equivalente</span>
                  </div>
                  <input
                    className="input num"
                    type="number"
                    value={c.importoAnnuale || c.importo * 12}
                    min="0"
                    onChange={(e) => handleEditCosto(c.id, "importoAnnuale", e.target.value)}
                  />
                  <button className={styles.removeBtn} onClick={() => handleDeleteCosto(c.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.addRow}>
          <input
            className="input"
            placeholder="Nome voce (es. Affitto)"
            value={newCostoNome}
            onChange={(e) => setNewCostoNome(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            className="input num"
            type="number"
            placeholder="€/mese"
            value={newCostoImporto}
            onChange={(e) => setNewCostoImporto(e.target.value)}
            min="0"
            style={{ width: 110 }}
          />
          <button className="btn btn-ghost" onClick={handleAddCosto}>
            <Icon name="plus" size={15} /> Aggiungi
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-title"><Icon name="receipt" size={15} />Configurazione fiscale</div>
        </div>
        <form className={styles.formPad} onSubmit={handleSaveFiscale}>
          <div>
            <label className="field-label">Regime fiscale</label>
            <select
              className="select"
              value={fiscaleForm.regime}
              onChange={(e) => setFf("regime", e.target.value)}
            >
              <option value="forfettario">Forfettario</option>
              <option value="ordinario">Ordinario</option>
            </select>
          </div>
          <div className={styles.fiscaleGrid}>
            <div>
              <label className="field-label">IVA (%)</label>
              <input
                type="number"
                className="input num"
                value={fiscaleForm.aliquotaIVA}
                onChange={(e) => setFiscaleForm((f) => ({ ...f, aliquotaIVA: e.target.value }))}
                min="0" max="30" step="1"
              />
              <span className="field-note">
                {fiscaleForm.regime === "forfettario" ? "0% — esente IVA" : "Di norma 22%"}
              </span>
            </div>
            <div>
              <label className="field-label">IRPEF / imp. sostitutiva (%)</label>
              <input
                type="number"
                className="input num"
                value={fiscaleForm.aliquotaIRPEF}
                onChange={(e) => setFiscaleForm((f) => ({ ...f, aliquotaIRPEF: e.target.value }))}
                min="0" max="50" step="0.5"
              />
              <span className="field-note">
                {fiscaleForm.regime === "forfettario" ? "15% forfettario (5% start-up)" : "Aliquota marginale stimata"}
              </span>
            </div>
            <div>
              <label className="field-label">Contributi INPS (%)</label>
              <input
                type="number"
                className="input num"
                value={fiscaleForm.aliquotaINPS}
                onChange={(e) => setFiscaleForm((f) => ({ ...f, aliquotaINPS: e.target.value }))}
                min="0" max="40" step="0.01"
              />
              <span className="field-note">26.23% gestione separata</span>
            </div>
            <div>
              <label className="field-label">Buffer extra (%)</label>
              <input
                type="number"
                className="input num"
                value={fiscaleForm.bufferExtra}
                onChange={(e) => setFiscaleForm((f) => ({ ...f, bufferExtra: e.target.value }))}
                min="0" max="20" step="1"
              />
              <span className="field-note">Riserva aggiuntiva per imprevisti</span>
            </div>
          </div>
          <div className={styles.formFooter}>
            {fiscaleSaved && <span className={styles.savedMsg}><Icon name="check" size={14} /> Salvato</span>}
            <button type="submit" className="btn btn-primary">Salva configurazione fiscale</button>
          </div>
        </form>
      </section>

      <div className="grid cols-2" style={{ alignItems: "start" }}>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="wallet" size={15} />Patrimonio</div>
            <span className="panel-note">usato per il grafico Cash Flow in Dashboard</span>
          </div>
          <CashSetup setup={setup} setSetup={setSetup} />
        </section>

        <BackupSection />
      </div>

      <section className={`panel ${styles.dangerZone}`}>
        <div className="panel-head">
          <div className="panel-title" style={{ color: "var(--danger)" }}>
            <Icon name="alert" size={15} />Zona pericolosa
          </div>
        </div>
        <div className={styles.formPad} style={{ paddingTop: 0 }}>
          <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
            Resetta tutti i dati salvati (commesse, setup, storico) e ricarica i dati iniziali.
          </p>
          <div>
            <button className="btn btn-danger" onClick={handleResetAll}>
              Reset completo dati
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function BackupSection() {
  const fileRef = useRef(null)
  const [importMsg, setImportMsg] = useState("")

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        const data = json.data || json
        const KEYS = ["commesse", "setup", "network"]
        KEYS.forEach(k => {
          if (data[k] !== undefined) {
            localStorage.setItem(k, JSON.stringify(data[k]))
            syncToSupabase(k, data[k])
          }
        })
        setImportMsg("Backup importato. La pagina si ricaricherà...")
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        setImportMsg("File non valido.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="panel-title"><Icon name="download" size={15} />Backup &amp; Ripristino</div>
      </div>
      <div className={styles.formPad} style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="kpi-ico ico-accent" style={{ width: 40, height: 40 }}><Icon name="download" size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>Esporta dati</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>scarica un backup completo in JSON</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-ghost" onClick={exportData}>
            <Icon name="download" size={15} /> Scarica backup
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={15} /> Importa backup
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
          {importMsg && (
            <span style={{ fontSize: 12.5, color: importMsg.includes("valido") ? "var(--danger)" : "var(--pos-ink)" }}>
              {importMsg}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

function CashSetup({ setup, setSetup }) {
  const [cassa, setCassa] = useState(setup.cassaIniziale ?? 0);
  const [crypto, setCrypto] = useState(setup.crypto ?? 0);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const today = new Date().toLocaleDateString("it-IT");
    setSetup(prev => ({
      ...prev,
      cassaIniziale: Number(cassa),
      crypto: Number(crypto),
      cryptoAggiornato: today,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.formPad} style={{ paddingTop: 0 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="field-label">Cassa disponibile (€)</label>
          <input type="number" min="0" className="input num" value={cassa} onChange={e => setCassa(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="field-label">Valore crypto (€)</label>
          <input type="number" min="0" className="input num" value={crypto} onChange={e => setCrypto(e.target.value)} />
          {setup.cryptoAggiornato && <span className="field-note">aggiornato {setup.cryptoAggiornato}</span>}
        </div>
      </div>
      <div className={styles.formFooter}>
        {saved && <span className={styles.savedMsg}><Icon name="check" size={14} /> Salvato</span>}
        <button className="btn btn-primary" onClick={handleSave}>Salva</button>
      </div>
    </div>
  );
}
