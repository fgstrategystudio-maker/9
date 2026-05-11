import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, Wand2, ExternalLink, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { getExams, createExam, deleteExam, getEpisodes, extractDocument } from '../api.js'
import Modal from '../components/Modal.jsx'
import FileUpload from '../components/FileUpload.jsx'

const formatDate = (d) => { try { return d ? format(parseISO(d), 'dd/MM/yyyy') : '-' } catch { return d || '-' } }

export default function Documents() {
  const [exams, setExams] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ date: '', type: '', reason: '', result_summary: '', episode_id: '', notes: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    Promise.all([getExams(), getEpisodes()]).then(([e, eps]) => {
      setExams(e)
      setEpisodes(eps)
    }).finally(() => setLoading(false))
  }, [])

  const handleExtract = async () => {
    if (!selectedFile) return
    setExtracting(true)
    try {
      const extracted = await extractDocument(selectedFile)
      setForm(f => ({
        ...f,
        date: extracted.date || f.date,
        type: extracted.type || f.type,
        reason: extracted.reason || f.reason,
        result_summary: extracted.result_summary || f.result_summary,
        notes: extracted.notes || f.notes,
      }))
    } catch (err) {
      console.error('Extract error:', err)
    } finally {
      setExtracting(false)
    }
  }

  const handleSubmit = async () => {
    const errs = {}
    if (!form.type) errs.type = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
    if (selectedFile) formData.append('file', selectedFile)

    const exam = await createExam(formData)
    setExams(e => [exam, ...e])
    setModalOpen(false)
    setForm({ date: '', type: '', reason: '', result_summary: '', episode_id: '', notes: '' })
    setSelectedFile(null)
    setErrors({})
  }

  const handleDelete = async (id) => {
    await deleteExam(id)
    setExams(e => e.filter(ex => ex.id !== id))
  }

  const inputCls = (err) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Caricamento...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documenti</h1>
          <p className="text-gray-500 mt-1">Esami, referti e documenti medici</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Aggiungi Documento
        </button>
      </div>

      {/* Exams table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Esami e Referti</h2>
        </div>
        {exams.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">Nessun documento caricato</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Risultato</th>
                  <th className="px-4 py-3 font-medium">Episodio</th>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {exams.map(ex => {
                  const ep = episodes.find(e => e.id === ex.episode_id)
                  return (
                    <tr key={ex.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{formatDate(ex.date)}</td>
                      <td className="px-4 py-3 text-gray-700">{ex.type || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{ex.reason || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{ex.result_summary || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{ep ? ep.diagnosis?.slice(0, 30) : '-'}</td>
                      <td className="px-4 py-3">
                        {ex.file_path ? (
                          <a href={`http://localhost:3001/uploads/${ex.file_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs">
                            <ExternalLink className="w-3.5 h-3.5" /> {ex.file_name?.slice(0, 20)}...
                          </a>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(ex.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setErrors({}); setSelectedFile(null) }} title="Aggiungi Documento Medico">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Carica documento (PDF o immagine)</label>
            <FileUpload onFileSelect={setSelectedFile} accept=".pdf,image/*" />
          </div>

          {selectedFile && (
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {extracting ? 'Estrazione in corso...' : 'Estrai automaticamente con AI'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Tipo esame *</label>
              <input value={form.type} placeholder="es. Ecografia, Radiografia..." onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls(errors.type)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Motivo</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Sintesi risultato</label>
              <textarea rows={3} value={form.result_summary} onChange={e => setForm(f => ({ ...f, result_summary: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Episodio collegato</label>
              <select value={form.episode_id} onChange={e => setForm(f => ({ ...f, episode_id: e.target.value }))} className={inputCls(false)}>
                <option value="">Nessuno</option>
                {episodes.map(ep => <option key={ep.id} value={ep.id}>{formatDate(ep.start_date)} — {ep.diagnosis?.slice(0, 40)}</option>)}
              </select></div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salva Documento</button>
            <button onClick={() => { setModalOpen(false); setErrors({}); setSelectedFile(null) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
