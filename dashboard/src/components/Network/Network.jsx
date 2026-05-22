import { useState } from "react";
import styles from "./Network.module.css";

const CATEGORIE = ["Commercialista", "Ex Socio", "Partner", "Consulente", "Fornitore", "Contatto", "Altro"];

const CATEGORIA_COLORS = {
  "Commercialista": "#60a5fa",
  "Ex Socio":       "#a78bfa",
  "Partner":        "#34d399",
  "Consulente":     "#f59e0b",
  "Fornitore":      "#fb923c",
  "Contatto":       "#94a3b8",
  "Altro":          "#64748b",
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
      (c.ruolo || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.note || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase());
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

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Cerca per nome, ruolo, email…"
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
                <div className={styles.cardNome}>{c.nome}</div>
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
              {c.ruolo && <div className={styles.cardRuolo}>{c.ruolo}</div>}
              <div className={styles.cardContacts}>
                {c.email && (
                  <a
                    className={styles.contactLink}
                    href={`mailto:${c.email}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ✉ {c.email}
                  </a>
                )}
                {c.telefono && (
                  <a
                    className={styles.contactLink}
                    href={`tel:${c.telefono}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ☎ {c.telefono}
                  </a>
                )}
              </div>
              <div className={styles.cardMeta}>
                {c.ultimoContatto && (
                  <span className={styles.dataBadge}>
                    Ultimo contatto: {formatDate(c.ultimoContatto)}
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
          {c.ruolo && <p className={styles.detailRuolo}>{c.ruolo}</p>}
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
            <a className={styles.detailLink} href={`mailto:${c.email}`}>{c.email}</a>
          } />
        )}
        {c.telefono && (
          <DetailRow label="Telefono" value={
            <a className={styles.detailLink} href={`tel:${c.telefono}`}>{c.telefono}</a>
          } />
        )}
        {c.linkedin && (
          <DetailRow label="LinkedIn" value={
            <a
              className={styles.detailLink}
              href={c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
            </a>
          } />
        )}
        {c.sito && (
          <DetailRow label="Sito web" value={
            <a
              className={styles.detailLink}
              href={c.sito.startsWith("http") ? c.sito : `https://${c.sito}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.sito.replace(/^https?:\/\//, "")}
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
    id: initial?.id || null,
    nome: initial?.nome || "",
    categoria: initial?.categoria || "Contatto",
    ruolo: initial?.ruolo || "",
    email: initial?.email || "",
    telefono: initial?.telefono || "",
    linkedin: initial?.linkedin || "",
    sito: initial?.sito || "",
    ultimoContatto: initial?.ultimoContatto || "",
    note: initial?.note || "",
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

          <div className={styles.fieldRow}>
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
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ruolo / Descrizione</label>
              <input
                className={styles.input}
                value={form.ruolo}
                onChange={(e) => set("ruolo", e.target.value)}
                placeholder="es. Commercialista di fiducia"
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
                placeholder="nome@esempio.com"
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
                placeholder="linkedin.com/in/nomeutente"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Sito web</label>
              <input
                className={styles.input}
                value={form.sito}
                onChange={(e) => set("sito", e.target.value)}
                placeholder="www.esempio.com"
              />
            </div>
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

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Note</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Annotazioni, contesto, come vi siete conosciuti…"
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
