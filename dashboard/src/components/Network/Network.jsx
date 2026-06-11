import { useState } from "react";
import Icon from "../Icon";
import { getInitials } from "../../utils/helpers";
import styles from "./Network.module.css";

const CATEGORIE = ["Cliente", "Commercialista", "Ex Socio", "Partner", "Consulente", "Fornitore", "Contatto", "Altro"];

// Tinte piatte del design system per categoria
const CATEGORIA_COLORS = {
  "Cliente":        "#5E7E5A",
  "Commercialista": "#5B7088",
  "Ex Socio":       "#8A5A8A",
  "Partner":        "#46897A",
  "Consulente":     "#B5862F",
  "Fornitore":      "#B5654A",
  "Contatto":       "#9A8F7E",
  "Altro":          "#6E6456",
};

const EMPTY_FORM = {
  id: null,
  nome: "",
  categoria: "Contatto",
  azienda: "",
  ruolo: "",
  email: "",
  telefono: "",
  linkedin: "",
  ultimoContatto: "",
  note: "",
};

export default function Network({ network, setNetwork }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tutti");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const filtered = network.filter((c) => {
    const matchSearch =
      !search ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.azienda || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.ruolo || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.note || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "Tutti" || c.categoria === filterCat;
    return matchSearch && matchCat;
  });

  const selected = network.find((c) => c.id === selectedId);

  function handleNew() {
    setEditData(null);
    setModalOpen(true);
  }

  function handleEdit(contatto) {
    setEditData(contatto);
    setModalOpen(true);
  }

  function handleDelete(id) {
    if (!confirm("Eliminare questo contatto?")) return;
    setNetwork((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleSave(data) {
    if (data.id) {
      setNetwork((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    } else {
      const newId = Math.max(0, ...network.map((c) => c.id)) + 1;
      setNetwork((prev) => [...prev, { ...data, id: newId }]);
    }
    setModalOpen(false);
  }

  const countsByCat = CATEGORIE.reduce((acc, cat) => {
    acc[cat] = network.filter((c) => c.categoria === cat).length;
    return acc;
  }, {});

  const clienti = countsByCat["Cliente"] || 0;
  const categorieAttive = CATEGORIE.filter((cat) => countsByCat[cat] > 0).length;

  return (
    <div className="view-enter grid" style={{ gap: "var(--gap)" }}>
      <header className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-eyebrow">Relazioni</div>
          <h1 className="page-title">Network</h1>
          <p className="page-sub">Clienti, partner e relazioni professionali.</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={handleNew}>
            <Icon name="plus" size={16} /> Nuovo contatto
          </button>
        </div>
      </header>

      <div className="mini-grid">
        <div className="mini">
          <div className="l">Relazioni totali</div>
          <div className="v">{network.length}</div>
          <div className="s">
            {CATEGORIE.filter((cat) => countsByCat[cat] > 0)
              .map((cat) => `${countsByCat[cat]} ${cat.toLowerCase()}`)
              .slice(0, 3)
              .join(" · ") || "nessun contatto"}
          </div>
        </div>
        <div className="mini">
          <div className="l">Clienti</div>
          <div className="v t-accent">{clienti}</div>
          <div className="s">categoria Cliente</div>
        </div>
        <div className="mini">
          <div className="l">Categorie attive</div>
          <div className="v t-pos">{categorieAttive}</div>
          <div className="s">tipologie di relazione presenti</div>
        </div>
      </div>

      {network.length > 0 && (
        <div className={styles.chips}>
          {CATEGORIE.filter((cat) => countsByCat[cat] > 0).map((cat) => (
            <button
              key={cat}
              className={`${styles.chip} ${filterCat === cat ? styles.chipActive : ""}`}
              onClick={() => setFilterCat(filterCat === cat ? "Tutti" : cat)}
            >
              <span className={styles.chipDot} style={{ background: CATEGORIA_COLORS[cat] }} />
              {cat}
              <span className={styles.chipCount}>{countsByCat[cat]}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.filters}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Cerca per nome, azienda, ruolo, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ width: "auto" }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="Tutti">Tutte le categorie</option>
          {CATEGORIE.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="notice">
          <div className="notice-ico ico-accent"><Icon name="network" size={18} /></div>
          <span className="lab">Nessun contatto trovato.</span>
        </div>
      )}

      <div className={styles.cardGrid}>
        {filtered.map((c) => {
          const color = CATEGORIA_COLORS[c.categoria] || "#9A8F7E";
          return (
            <div
              key={c.id}
              className={`panel panel-pad ${styles.card} ${selectedId === c.id ? styles.cardActive : ""}`}
              onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
            >
              <span className="client-ava" style={{ width: 46, height: 46, borderRadius: 12, background: color, fontSize: 17 }}>
                {getInitials(c.nome)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.cardName}>{c.nome}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                  <span className="pill" style={{ background: color + "22", color }}>
                    <span className="d" style={{ background: color }}></span>{c.categoria}
                  </span>
                  {(c.ruolo || c.azienda) && (
                    <span style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {[c.ruolo, c.azienda].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none", whiteSpace: "nowrap", paddingLeft: 14 }}>
                <div className="num" style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--ink)" }}>
                  {c.ultimoContatto ? formatDate(c.ultimoContatto) : "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>ultimo contatto</div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <ContactDetail
          contatto={selected}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {modalOpen && (
        <NetworkModal
          initial={editData}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function ContactDetail({ contatto: c, onEdit, onDelete }) {
  const color = CATEGORIA_COLORS[c.categoria] || "#9A8F7E";
  return (
    <section className="panel reveal">
      <div className="panel-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="client-ava" style={{ background: color, width: 40, height: 40, borderRadius: 11, fontSize: 16 }}>
            {getInitials(c.nome)}
          </span>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink)" }}>
              {c.nome}
            </div>
            {(c.ruolo || c.azienda) && (
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                {[c.ruolo, c.azienda].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onEdit}><Icon name="edit" size={15} /> Modifica</button>
          <button className="btn btn-danger" onClick={onDelete}><Icon name="trash" size={15} /> Elimina</button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <DetailRow label="Categoria" value={
          <span className="pill" style={{ background: color + "22", color }}>
            <span className="d" style={{ background: color }}></span>{c.categoria}
          </span>
        } />
        {c.email && (
          <DetailRow label="Email" value={
            <a href={`mailto:${c.email}`} className={styles.contactLink}>{c.email}</a>
          } />
        )}
        {c.telefono && (
          <DetailRow label="Telefono" value={
            <a href={`tel:${c.telefono}`} className={styles.contactLink}>{c.telefono}</a>
          } />
        )}
        {c.linkedin && (
          <DetailRow label="LinkedIn" value={
            <a
              href={c.linkedin.startsWith("http") ? c.linkedin : `https://linkedin.com/in/${c.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              {c.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
            </a>
          } />
        )}
        {c.ultimoContatto && (
          <DetailRow label="Ultimo contatto" value={formatDate(c.ultimoContatto)} />
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

function NetworkModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial || {}),
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    onSave({ ...form, nome: form.nome.trim() });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {form.id ? "Modifica contatto" : "Nuovo contatto"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className="field-label">Nome *</label>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Nome e cognome"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className="field-label">Categoria</label>
              <select
                className="select"
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
              >
                {CATEGORIE.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className="field-label">Azienda</label>
              <input
                className="input"
                value={form.azienda}
                onChange={(e) => set("azienda", e.target.value)}
                placeholder="Nome azienda o studio"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className="field-label">Ruolo / Descrizione</label>
              <input
                className="input"
                value={form.ruolo}
                onChange={(e) => set("ruolo", e.target.value)}
                placeholder="es. CEO, Commercialista"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className="field-label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@esempio.it"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className="field-label">Telefono</label>
              <input
                type="tel"
                className="input"
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+39 333 000 0000"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className="field-label">LinkedIn</label>
              <input
                className="input"
                value={form.linkedin}
                onChange={(e) => set("linkedin", e.target.value)}
                placeholder="URL o username"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className="field-label">Ultimo contatto</label>
              <input
                type="date"
                className="input"
                value={form.ultimoContatto}
                onChange={(e) => set("ultimoContatto", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className="field-label">Note</label>
            <textarea
              className="textarea"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Contesto, come vi siete conosciuti, opportunità future…"
              rows={4}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary">
              {form.id ? "Salva modifiche" : "Aggiungi contatto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
