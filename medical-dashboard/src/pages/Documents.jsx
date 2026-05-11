import React, { useState } from 'react'
import { Plus, Trash2, Sparkles, ExternalLink, Loader } from 'lucide-react'
import Modal from '../components/Modal'
import FileUpload from '../components/FileUpload'
import * as store from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const EMPTY_EXAM = { date: '', type: '', reason: '', result_summary: '', episode_id: '', notes: '', file: null }

function Field({ label, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function Documents() {
  const [exams, setExams] = useState(() => store.exams.all())
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_EXAM)
  const [selectedFile, setSelectedFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')

  const episodes = store.episodes.all()

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleFileSelect = (fileData) => {
    setSelectedFile(fileData)
    setExtractError('')
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
      if (!res.ok) throw new Error('Errore dal server')
      const data = await res.json()
      setForm(f => ({
        ...f,
        date: data.date || f.date,
        type: data.type || f.type,
        reason: data.reason || f.reason,
        result_summary: data.result_summary || f.result_summary,
        notes: [f.notes, data.notes, data.diagnosis ? `Diagnosi: ${data.diagnosis}` : '', data.symptoms ? `Sintomi: ${data.symptoms}` : '', data.doctor ? `Medico: ${data.doctor}` : '', data.medications?.length ? `Farmaci: ${data.medications.join(', ')}` : ''].filter(Boolean).join('\n'),
      }))
    } catch (err) {
      setExtractError('Estrazione non riuscita. Compila i campi manualmente.')
    }
    setExtracting(false)
  }

  const save = () => {
    if (!form.date && !form.type) return
    const item = store.addExam({
      ...form,
      file_dataurl: selectedFile?.dataUrl || null,
      file_name: selectedFile?.filename || null,
      file_type: selectedFile?.mediaType || null,
    })
    setExams(store.exams.all())
    setShowModal(false)
    setForm(EMPTY_EXAM)
    setSelectedFile(null)
  }

  const del = (id) => {
    store.deleteExam(id)
    setExams(store.exams.all())
  }

  const episodeName = (id) => {
    const ep = episodes.find(e => e.id === id)
    return ep ? `${ep.start_date} — ${ep.diagnosis || ep.type}` : ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Documenti ed esami</h1>
        <button onClick={() => setShowModal(true)} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
          <Plus size={14} className="inline mr-1" />Aggiungi documento
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-gray-200">
          Nessun documento. Aggiungi referti, analisi e immagini.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 border-b bg-gray-50">
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
                <tr key={ex.id} className="border-b border-gray-50 hover:bg-gray-50">
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_EXAM); setSelectedFile(null) }} title="Aggiungi documento">
        <div className="mb-4">
          <FileUpload onFileSelect={handleFileSelect} />
          {selectedFile && (
            <div className="mt-2 flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-blue-700 font-medium">{selectedFile.filename}</span>
              <button
                onClick={extractWithAI}
                disabled={extracting}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium transition-colors ${extracting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {extracting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {extracting ? 'Estrazione...' : 'Estrai con AI'}
              </button>
            </div>
          )}
          {extractError && <p className="text-xs text-red-500 mt-1">{extractError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><input type="date" className={input} value={form.date} onChange={e => set('date', e.target.value)} /></Field>
          <Field label="Tipo esame"><input className={input} placeholder="RMN, Analisi sangue, Ecografia..." value={form.type} onChange={e => set('type', e.target.value)} /></Field>
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
        <div className="flex gap-2 mt-4">
          <button onClick={save} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Salva</button>
          <button onClick={() => { setShowModal(false); setForm(EMPTY_EXAM); setSelectedFile(null) }} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
        </div>
      </Modal>
    </div>
  )
}
