import React, { useState } from 'react'
import { Plus, Trash2, Sparkles, ExternalLink, Loader, CheckSquare, Square, ChevronRight, ChevronDown, Pencil, FileText } from 'lucide-react'
import Modal from '../components/Modal'
import FileUpload from '../components/FileUpload'
import * as store from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

// ─── Medical categories ───────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'analisi_sangue',        label: 'Analisi del sangue',      color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'ortopedia',             label: 'Ortopedia',               color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'cardiologia',           label: 'Cardiologia',             color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'neurologia',            label: 'Neurologia',              color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'radiologia',            label: 'Radiologia / Imaging',    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'oculistica',            label: 'Oculistica',              color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'gastroenterologia',     label: 'Gastroenterologia',       color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'dermatologia',          label: 'Dermatologia',            color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'endocrinologia',        label: 'Endocrinologia',          color: 'bg-lime-100 text-lime-700 border-lime-200' },
  { id: 'ginecologia',           label: 'Ginecologia',             color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'urologia',              label: 'Urologia',                color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { id: 'otorinolaringoiatria',  label: 'Otorinolaringoiatria',    color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'altro',                 label: 'Altro',                   color: 'bg-gray-100 text-gray-600 border-gray-200' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

function getCategoryStyle(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP['altro']
}

// Map AI source_type / type strings to a category id
function guessCategory(extracted) {
  if (!extracted) return 'altro'
  const raw = [extracted.source_type, extracted.type, extracted.category].join(' ').toLowerCase()

  if (/sangue|ematol|cbc|emocromo|gluc|colester|ferritin|tsv|analisi/.test(raw)) return 'analisi_sangue'
  if (/ortop|osso|fractur|articol|colonna|vertebr|ginocchi|anca|spalla|tendine/.test(raw)) return 'ortopedia'
  if (/cardio|ecg|elettrocard|ecocardio|holter|pressione|coronar/.test(raw)) return 'cardiologia'
  if (/neurol|cervell|eeg|risonanza.*cerebr|tac.*cerebr|encefalogr/.test(raw)) return 'neurologia'
  if (/radio|rmn|risonanza|tac|rx|raggi|ecografia|imaging|scintig/.test(raw)) return 'radiologia'
  if (/ocul|vista|retina|cornea|oculist/.test(raw)) return 'oculistica'
  if (/gastro|intestin|colon|endoscopia|gastr|epatit|fegat|colonscopia/.test(raw)) return 'gastroenterologia'
  if (/dermat|pelle|cute|biopsia.*cut|melanoma/.test(raw)) return 'dermatologia'
  if (/endocrin|tiroide|diabete|ormone|insulina|cortisol/.test(raw)) return 'endocrinologia'
  if (/ginecol|utero|ovaio|mammograf|pap.test|ginecologia/.test(raw)) return 'ginecologia'
  if (/urol|rene|vescica|prostata|urolog/.test(raw)) return 'urologia'
  if (/otorin|orecchio|naso|gola|ent|laringo|audiom/.test(raw)) return 'otorinolaringoiatria'
  return 'altro'
}

// ─── Source labels ────────────────────────────────────────────────────────────

const SOURCE_LABELS = {
  referto_esame: '📋 Referto esame', analisi_sangue: '🩸 Analisi del sangue',
  radiologia: '🔬 Radiologia / Imaging', lettera_medica: '✉️ Lettera medica',
  ricetta: '💊 Ricetta', prescrizione: '💊 Prescrizione',
  foto_documento: '📷 Foto documento', cartella_clinica: '📁 Cartella clinica', altro: '📄 Documento',
}

// ─── Helper components ────────────────────────────────────────────────────────

function Field({ label, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function CategoryBadge({ categoryId, small }) {
  const cat = getCategoryStyle(categoryId || 'altro')
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${cat.color}`}>
      {cat.label}
    </span>
  )
}

function FileThumbnail({ dataUrl, fileType, fileName }) {
  if (!dataUrl) return null
  if (fileType && fileType.startsWith('image/')) {
    return (
      <a href={dataUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
        <img src={dataUrl} alt={fileName || 'doc'} className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
      </a>
    )
  }
  return (
    <a href={dataUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
      <FileText size={22} className="text-red-400" />
    </a>
  )
}

// ─── Smart routing panel ──────────────────────────────────────────────────────

function SmartRoutingPanel({ extracted, onConfirm, onSkip }) {
  const sections = extracted.suggested_sections || ['documenti']
  const [selected, setSelected] = useState(new Set(sections))

  const toggle = (s) => setSelected(prev => {
    const next = new Set(prev)
    next.has(s) ? next.delete(s) : next.add(s)
    return next
  })

  const sectionInfo = {
    documenti: { label: 'Documenti', desc: 'Salva il referto nell\'archivio documenti', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    timeline: { label: 'Timeline episodi', desc: extracted.diagnosis ? `Crea episodio: "${extracted.diagnosis}"` : 'Crea un episodio in Timeline', color: 'bg-violet-50 border-violet-200 text-violet-700' },
    farmaci: { label: 'Farmaci attuali', desc: extracted.medications?.length ? `Aggiungi: ${extracted.medications.map(m => m.name).join(', ')}` : 'Aggiungi farmaci', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    allergie: { label: 'Allergie', desc: extracted.allergies?.length ? `Aggiungi: ${extracted.allergies.map(a => a.name).join(', ')}` : 'Aggiungi allergie', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-violet-600" />
        <span className="font-semibold text-violet-800 text-sm">Rilevato: {SOURCE_LABELS[extracted.source_type] || '📄 Documento'}</span>
      </div>
      <p className="text-xs text-violet-600 mb-3">Dove vuoi aggiungere i dati estratti?</p>
      <div className="space-y-2 mb-4">
        {sections.filter(s => sectionInfo[s]).map(s => {
          const { label, desc, color } = sectionInfo[s]
          const isSelected = selected.has(s)
          const isRequired = s === 'documenti'
          return (
            <button
              key={s}
              onClick={() => !isRequired && toggle(s)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${isSelected ? color : 'bg-white border-gray-200 text-gray-400'} ${isRequired ? 'cursor-default' : 'cursor-pointer hover:opacity-90'}`}
            >
              {isSelected ? <CheckSquare size={16} className="flex-shrink-0" /> : <Square size={16} className="flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{label}{isRequired && ' (obbligatorio)'}</div>
                <div className="text-xs opacity-70 truncate">{desc}</div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onConfirm(selected)} className={`${btn} bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-1`}>
          Aggiungi alle sezioni selezionate <ChevronRight size={14} />
        </button>
        <button onClick={onSkip} className={`${btn} bg-white border border-gray-200 text-gray-600 hover:bg-gray-50`}>Solo documenti</button>
      </div>
    </div>
  )
}

// ─── Document card ────────────────────────────────────────────────────────────

function DocumentCard({ ex, episodes, onEdit, onDelete }) {
  const episodeName = (id) => {
    const ep = episodes.find(e => e.id === id)
    return ep ? `${ep.start_date} — ${ep.diagnosis || ep.type}` : ''
  }

  return (
    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      {/* Thumbnail */}
      <FileThumbnail dataUrl={ex.file_dataurl} fileType={ex.file_type} fileName={ex.file_name} />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge categoryId={ex.category} small />
            {ex.date && <span className="text-xs text-gray-400">{ex.date}</span>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(ex)}
              className="text-gray-300 hover:text-blue-500 transition-colors p-1"
              title="Modifica"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(ex.id)}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
              title="Elimina"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {ex.type && <p className="text-sm font-semibold text-gray-800 truncate">{ex.type}</p>}
        {ex.reason && <p className="text-xs text-gray-500 truncate mt-0.5">{ex.reason}</p>}
        {ex.result_summary && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ex.result_summary}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {ex.file_dataurl && !ex.file_type?.startsWith('image/') && (
            <a
              href={ex.file_dataurl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
            >
              <ExternalLink size={11} />{ex.file_name || 'Apri file'}
            </a>
          )}
          {ex.episode_id && (
            <span className="text-xs text-violet-500 truncate">{episodeName(ex.episode_id)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Collapsible category group ───────────────────────────────────────────────

function CategoryGroup({ categoryId, docs, episodes, onEdit, onDelete }) {
  const [open, setOpen] = useState(true)
  const cat = getCategoryStyle(categoryId)

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 mb-2 group"
      >
        <span className={`inline-flex items-center border rounded-full text-xs px-2.5 py-1 font-semibold ${cat.color}`}>
          {cat.label}
        </span>
        <span className="text-xs text-gray-400 font-medium">{docs.length}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {open && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map(ex => (
            <DocumentCard
              key={ex.id}
              ex={ex}
              episodes={episodes}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Documents page ──────────────────────────────────────────────────────

const EMPTY_EXAM = { date: '', type: '', category: 'altro', reason: '', result_summary: '', episode_id: '', notes: '' }

export default function Documents() {
  const [exams, setExams] = useState(() => store.exams.all())
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)   // null = new doc, string = editing
  const [form, setForm] = useState(EMPTY_EXAM)
  const [selectedFile, setSelectedFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [extractError, setExtractError] = useState('')
  const [saved, setSaved] = useState([])

  const episodes = store.episodes.all()
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleFileSelect = (fileData) => {
    setSelectedFile(fileData)
    setExtracted(null)
    setExtractError('')
    setSaved([])
  }

  const extractWithAI = async () => {
    if (!selectedFile) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: selectedFile.base64, mediaType: selectedFile.mediaType, filename: selectedFile.filename }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExtracted(data)
      const mappedCategory = guessCategory(data)
      setForm(f => ({
        ...f,
        date: data.date || f.date,
        type: data.type || f.type,
        category: mappedCategory,
        reason: data.diagnosis || data.symptoms || f.reason,
        result_summary: data.result_summary || f.result_summary,
        notes: [data.notes, data.doctor ? `Medico: ${data.doctor}` : '', data.facility ? `Struttura: ${data.facility}` : ''].filter(Boolean).join('\n'),
      }))
    } catch {
      setExtractError('Estrazione non riuscita. Compila i campi manualmente.')
    }
    setExtracting(false)
  }

  const applyToSections = (selectedSections) => {
    const added = []

    // Always save to documents
    store.addExam({
      ...form,
      file_dataurl: selectedFile?.dataUrl || null,
      file_name: selectedFile?.filename || null,
      file_type: selectedFile?.mediaType || null,
    })
    setExams(store.exams.all())
    added.push('Documenti')

    if (selectedSections.has('timeline') && extracted) {
      store.addEpisode({
        start_date: extracted.date || new Date().toISOString().slice(0, 10),
        type: 'malattia',
        body_area: extracted.body_area || '',
        diagnosis: extracted.diagnosis || extracted.type || form.type,
        symptoms: extracted.symptoms || '',
        doctor: extracted.doctor || '',
        facility: extracted.facility || '',
        outcome: 'in_corso',
        notes: extracted.result_summary || '',
        is_positive: false,
      })
      added.push('Timeline')
    }

    if (selectedSections.has('farmaci') && extracted?.medications?.length) {
      extracted.medications.forEach(m => {
        store.medications.add({ name: m.name, dosage: m.dosage || '', frequency: m.frequency || '', reason: m.reason || extracted.diagnosis || '', notes: '' })
      })
      added.push('Farmaci')
    }

    if (selectedSections.has('allergie') && extracted?.allergies?.length) {
      extracted.allergies.forEach(a => {
        store.allergies.add({ name: a.name, type: a.type || 'altro', severity: a.severity || 'lieve', notes: '' })
      })
      added.push('Allergie')
    }

    setSaved(added)
    setExtracted(null)
    setForm(EMPTY_EXAM)
    setSelectedFile(null)
    setTimeout(() => { setShowModal(false); setSaved([]) }, 1800)
  }

  const saveDocumentOnly = () => {
    if (editingId) {
      store.updateExam(editingId, {
        ...form,
        ...(selectedFile ? {
          file_dataurl: selectedFile.dataUrl,
          file_name: selectedFile.filename,
          file_type: selectedFile.mediaType,
        } : {}),
      })
    } else {
      store.addExam({
        ...form,
        file_dataurl: selectedFile?.dataUrl || null,
        file_name: selectedFile?.filename || null,
        file_type: selectedFile?.mediaType || null,
      })
    }
    setExams(store.exams.all())
    closeModal()
  }

  const del = (id) => { store.deleteExam(id); setExams(store.exams.all()) }

  const openEdit = (ex) => {
    setEditingId(ex.id)
    setForm({
      date: ex.date || '',
      type: ex.type || '',
      category: ex.category || 'altro',
      reason: ex.reason || '',
      result_summary: ex.result_summary || '',
      episode_id: ex.episode_id || '',
      notes: ex.notes || '',
    })
    setSelectedFile(null)
    setExtracted(null)
    setExtractError('')
    setSaved([])
    setShowModal(true)
  }

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_EXAM)
    setSelectedFile(null)
    setExtracted(null)
    setExtractError('')
    setSaved([])
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_EXAM)
    setSelectedFile(null)
    setExtracted(null)
    setExtractError('')
    setSaved([])
  }

  // Group and sort documents by category
  const sortedExams = [...exams].sort((a, b) =>
    (b.date || b.created_at || '').localeCompare(a.date || a.created_at || '')
  )

  const grouped = {}
  sortedExams.forEach(ex => {
    const cat = ex.category || 'altro'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(ex)
  })

  // Show categories in defined order
  const orderedCategoryIds = CATEGORIES.map(c => c.id).filter(id => grouped[id])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Documenti ed esami</h1>
        <button onClick={openNew} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm`}>
          <Plus size={14} className="inline mr-1" />Aggiungi documento
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">📁</div>
          Nessun documento ancora.<br />
          <span className="text-sm">Carica referti, analisi o foto di documenti medici — l'AI estrae i dati automaticamente.</span>
        </div>
      ) : (
        <div>
          {orderedCategoryIds.map(catId => (
            <CategoryGroup
              key={catId}
              categoryId={catId}
              docs={grouped[catId]}
              episodes={episodes}
              onEdit={openEdit}
              onDelete={del}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Modifica documento' : 'Aggiungi documento'}>
        {saved.length > 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-gray-800 mb-2">Dati salvati con successo</div>
            <div className="text-sm text-gray-500">Aggiunti in: {saved.join(' · ')}</div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <FileUpload onFileSelect={handleFileSelect} />
              {selectedFile && (
                <div className="mt-2 flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm border border-slate-200">
                  <span className="text-slate-700 font-medium truncate max-w-xs">{selectedFile.filename}</span>
                  {!editingId && (
                    <button
                      onClick={extractWithAI}
                      disabled={extracting}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ml-2 ${extracting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                    >
                      {extracting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {extracting ? 'Lettura in corso...' : 'Estrai con AI'}
                    </button>
                  )}
                </div>
              )}
              {extractError && <p className="text-xs text-red-500 mt-1">{extractError}</p>}
            </div>

            {extracted && !editingId && (
              <SmartRoutingPanel
                extracted={extracted}
                onConfirm={applyToSections}
                onSkip={saveDocumentOnly}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input type="date" className={input} value={form.date} onChange={e => set('date', e.target.value)} /></Field>
              <Field label="Tipo esame"><input className={input} placeholder="RMN, Analisi sangue..." value={form.type} onChange={e => set('type', e.target.value)} /></Field>
              <Field label="Categoria" col2>
                <select className={input} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Motivo" col2><input className={input} value={form.reason} onChange={e => set('reason', e.target.value)} /></Field>
              <Field label="Sintesi risultato" col2><textarea className={`${input} h-20`} value={form.result_summary} onChange={e => set('result_summary', e.target.value)} /></Field>
              <Field label="Episodio collegato" col2>
                <select className={input} value={form.episode_id} onChange={e => set('episode_id', e.target.value)}>
                  <option value="">— nessuno —</option>
                  {episodes.map(ep => <option key={ep.id} value={ep.id}>{ep.start_date} — {ep.diagnosis || ep.type}</option>)}
                </select>
              </Field>
              <Field label="Note" col2><textarea className={`${input} h-16`} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
            </div>

            {!extracted && (
              <div className="flex gap-2 mt-4">
                <button onClick={saveDocumentOnly} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
                  {editingId ? 'Salva modifiche' : 'Salva'}
                </button>
                <button onClick={closeModal} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
