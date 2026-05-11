import React, { useState } from 'react'
import { Plus, Trash2, Sparkles, ExternalLink, Loader, CheckSquare, Square, ChevronRight } from 'lucide-react'
import Modal from '../components/Modal'
import FileUpload from '../components/FileUpload'
import * as store from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const SOURCE_LABELS = {
  referto_esame: '📋 Referto esame', analisi_sangue: '🩸 Analisi del sangue',
  radiologia: '🔬 Radiologia / Imaging', lettera_medica: '✉️ Lettera medica',
  ricetta: '💊 Ricetta', prescrizione: '💊 Prescrizione',
  foto_documento: '📷 Foto documento', cartella_clinica: '📁 Cartella clinica', altro: '📄 Documento',
}

function Field({ label, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// Smart routing panel shown after AI extraction
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

const EMPTY_EXAM = { date: '', type: '', reason: '', result_summary: '', episode_id: '', notes: '' }

export default function Documents() {
  const [exams, setExams] = useState(() => store.exams.all())
  const [showModal, setShowModal] = useState(false)
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
      // pre-fill form fields
      setForm(f => ({
        ...f,
        date: data.date || f.date,
        type: data.type || f.type,
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
    const examItem = store.addExam({
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
    store.addExam({
      ...form,
      file_dataurl: selectedFile?.dataUrl || null,
      file_name: selectedFile?.filename || null,
      file_type: selectedFile?.mediaType || null,
    })
    setExams(store.exams.all())
    setShowModal(false)
    setForm(EMPTY_EXAM)
    setSelectedFile(null)
    setExtracted(null)
  }

  const del = (id) => { store.deleteExam(id); setExams(store.exams.all()) }

  const episodeName = (id) => {
    const ep = episodes.find(e => e.id === id)
    return ep ? `${ep.start_date} — ${ep.diagnosis || ep.type}` : ''
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(EMPTY_EXAM)
    setSelectedFile(null)
    setExtracted(null)
    setExtractError('')
    setSaved([])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Documenti ed esami</h1>
        <button onClick={() => setShowModal(true)} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm`}>
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
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 border-b bg-slate-50">
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Motivo</th>
              <th className="text-left px-4 py-3">Risultato</th>
              <th className="text-left px-4 py-3">Episodio</th>
              <th className="text-left px-4 py-3">File</th>
              <th />
            </tr></thead>
            <tbody>
              {exams.sort((a, b) => (b.date || b.created_at || '').localeCompare(a.date || a.created_at || '')).map(ex => (
                <tr key={ex.id} className="border-b border-gray-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-gray-600">{ex.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{ex.type}</td>
                  <td className="px-4 py-3 text-gray-500">{ex.reason}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{ex.result_summary}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ex.episode_id ? episodeName(ex.episode_id) : '—'}</td>
                  <td className="px-4 py-3">
                    {ex.file_dataurl && (
                      <a href={ex.file_dataurl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                        <ExternalLink size={12} />{ex.file_name || 'Apri'}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(ex.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title="Aggiungi documento">
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
                  <button
                    onClick={extractWithAI}
                    disabled={extracting}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ml-2 ${extracting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                  >
                    {extracting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {extracting ? 'Lettura in corso...' : 'Estrai con AI'}
                  </button>
                </div>
              )}
              {extractError && <p className="text-xs text-red-500 mt-1">{extractError}</p>}
            </div>

            {extracted && (
              <SmartRoutingPanel
                extracted={extracted}
                onConfirm={applyToSections}
                onSkip={saveDocumentOnly}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input type="date" className={input} value={form.date} onChange={e => set('date', e.target.value)} /></Field>
              <Field label="Tipo esame"><input className={input} placeholder="RMN, Analisi sangue..." value={form.type} onChange={e => set('type', e.target.value)} /></Field>
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
                <button onClick={saveDocumentOnly} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>Salva</button>
                <button onClick={closeModal} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
