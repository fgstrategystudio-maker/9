import { useState } from "react";
import styles from "./Network.module.css";

const CATEGORIE = ["Cliente", "Commercialista", "Ex Socio", "Partner", "Consulente", "Fornitore", "Contatto", "Altro"];

const CATEGORIA_COLORS = {
  "Cliente":        "#22d3ee",
  "Commercialista": "#60a5fa",
  "Ex Socio":       "#a78bfa",
  "Partner":        "#34d399",
  "Consulente":     "#f59e0b",
  "Fornitore":      "#fb923c",
  "Contatto":       "#94a3b8",
  "Altro":          "#64748b",
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Network</h1>
          <p className={styles.subtitle}>{network.length} contatti</p>
        </div>
        <button className={styles.addBtn} onClick={handleNew}>
          + Nuovo contatto
        </button>
      </header>

      {network.length > 0 && (
        <div className={styles.stats}>
          {CATEGORIE.filter((cat) => countsByCat[cat] > 0).map((cat) => (
            <button
              key={cat}
              className={`${styles.statChip} ${filterCat === cat ? styles.statChipActive : ""}`}
              style={{ "--chip-color": CATEGORIA_COLORS[cat] }}
              onClick={() => setFilterCat(filterCat === cat ? "Tutti" : cat)}
            >
              <span className={styles.statDot} style={{ background: CATEGORIA_COLORS[cat] }} />
              {cat}
              <span className={styles.statCount}>{countsByCat[cat]}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Cerca per nome, azienda, ruolo, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="Tutti">Tutte le categorie</option>
          {CATEGORIE.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {filtered.length === 0 && (
            <div className={styles.empty}>Nessun contatto trovato.</div>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`${styles.card} ${selectedId === c.id ? styles.cardActive : ""}`}
              onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
            >
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardNome}>{c.nome}</div>
                  {(c.azienda || c.ruolo) && (
                    <div className={styles.cardSub}>
                      {[c.ruolo, c.azienda].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <span
                  className={styles.catBadge}
                  style={{
                    background: (CATEGORIA_COLORS[c.categoria] || "#64748b") + "22",
                    color: CATEGORIA_COLORS[c.categoria] || "#64748b",
                  }}
                >
                  {c.categoria}
                </span>
              </div>
              <div className={styles.cardMeta}>
                {c.email && <span className={styles.metaIcon}>✉</span>}
                {c.telefono && <span className={styles.metaIcon}>📞</span>}
                {c.linkedin && <span className={styles.metaIcon}>in</span>}
                {c.ultimoContatto && (
                  <span className={styles.dataBadge}>
                    {formatDate(c.ultimoContatto)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <ContactDetail
            contatto={selected}
            onEdit={() => handleEdit(selected)}
            onDelete={() => handleDelete(selected.id)}
          />
        )}
      </div>

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
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div>
          <h2 className={styles.detailNome}>{c.nome}</h2>
          {(c.ruolo || c.azienda) && (
            <p className={styles.detailRuolo}>
              {[c.ruolo, c.azienda].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className={styles.detailActions}>
          <button className={styles.editBtn} onClick={onEdit}>Modifica</button>
          <button className={styles.deleteBtn} onClick={onDelete}>Elimina</button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <DetailRow label="Categoria" value={
          <span style={{ color: CATEGORIA_COLORS[c.categoria] || "#94a3b8", fontWeight: 600 }}>
            {c.categoria}
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
    </div>
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
              <label className={styles.label}>Nome *</label>
              <input
                className={styles.input}
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Nome e cognome"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Categoria</label>
              <select
                className={styles.input}
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
              <label className={styles.label}>Azienda</label>
              <input
                className={styles.input}
                value={form.azienda}
                onChange={(e) => set("azienda", e.target.value)}
                placeholder="Nome azienda o studio"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ruolo / Descrizione</label>
              <input
                className={styles.input}
                value={form.ruolo}
                onChange={(e) => set("ruolo", e.target.value)}
                placeholder="es. CEO, Commercialista"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@esempio.it"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Telefono</label>
              <input
                type="tel"
                className={styles.input}
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+39 333 000 0000"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>LinkedIn</label>
              <input
                className={styles.input}
                value={form.linkedin}
                onChange={(e) => set("linkedin", e.target.value)}
                placeholder="URL o username"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ultimo contatto</label>
              <input
                type="date"
                className={styles.input}
                value={form.ultimoContatto}
                onChange={(e) => set("ultimoContatto", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Note</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Contesto, come vi siete conosciuti, opportunità future…"
              rows={4}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className={styles.saveBtn}>
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
