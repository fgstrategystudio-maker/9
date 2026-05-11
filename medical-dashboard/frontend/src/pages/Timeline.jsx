import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { getEpisodes, createEpisode, deleteEpisode } from '../api.js'
import Modal from '../components/Modal.jsx'

const formatDate = (d) => { try { return d ? format(parseISO(d), 'dd/MM/yyyy') : '-' } catch { return d || '-' } }

const outcomeBadge = (o) => {
  const map = { in_corso: 'bg-yellow-100 text-yellow-700', risolto: 'bg-green-100 text-green-700', ricorrente: 'bg-orange-100 text-orange-700', migliorato: 'bg-blue-100 text-blue-700' }
  const labels = { in_corso: 'In corso', risolto: 'Risolto', ricorrente: 'Ricorrente', migliorato: 'Migliorato' }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[o] || 'bg-gray-100 text-gray-600'}`}>{labels[o] || o}</span>
}

const typeBadge = (t) => {
  const map = { infortunio: 'bg-red-100 text-red-700', malattia: 'bg-blue-100 text-blue-700', intervento: 'bg-purple-100 text-purple-700', ricaduta: 'bg-orange-100 text-orange-700' }
  const labels = { infortunio: 'Infortunio', malattia: 'Malattia', intervento: 'Intervento', ricaduta: 'Ricaduta' }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[t] || 'bg-gray-100 text-gray-600'}`}>{labels[t] || t}</span>
}

const emptyForm = {
  start_date: '', end_date: '', type: 'malattia', body_area: '', diagnosis: '', symptoms: '',
  intensity: 5, probable_cause: '', doctor: '', facility: '', therapy: '', stop_days: '',
  outcome: 'in_corso', notes: '',
  injury: { sport: '', movement: '', body_side: '', pain_type: '', swelling: false, hematoma: false, continued_activity: false, physiotherapy_sessions: '', recurrences: 0, residual_limitations: '' }
}

export default function Timeline() {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [filterYear, setFilterYear] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterOutcome, setFilterOutcome] = useState('')
  const [filterArea, setFilterArea] = useState('')

  useEffect(() => {
    getEpisodes().then(setEpisodes).finally(() => setLoading(false))
  }, [])

  const years = [...new Set(episodes.filter(e => e.start_date).map(e => e.start_date.slice(0, 4)))].sort().reverse()

  const filtered = episodes.filter(e => {
    if (filterYear && e.start_date?.slice(0, 4) !== filterYear) return false
    if (filterType && filterType !== 'tutto' && e.type !== filterType) return false
    if (filterOutcome && filterOutcome !== 'tutto' && e.outcome !== filterOutcome) return false
    if (filterArea && !e.body_area?.toLowerCase().includes(filterArea.toLowerCase())) return false
    return true
  })

  const handleSubmit = async () => {
    const errs = {}
    if (!form.start_date) errs.start_date = true
    if (!form.diagnosis) errs.diagnosis = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = { ...form }
    if (form.type !== 'infortunio') delete payload.injury

    const ep = await createEpisode(payload)
    setEpisodes(eps => [ep, ...eps])
    setModalOpen(false)
    setForm(emptyForm)
    setErrors({})
  }

  const handleDelete = async (id) => {
    await deleteEpisode(id)
    setEpisodes(eps => eps.filter(e => e.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const inputCls = (err) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Caricamento...</div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeline Episodi</h1>
          <p className="text-gray-500 mt-1">{episodes.length} episodi registrati</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nuovo Episodio
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">Tutti gli anni</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">Tutti i tipi</option>
          <option value="tutto">Tutto</option>
          {['malattia', 'infortunio', 'intervento', 'ricaduta'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">Tutti gli esiti</option>
          <option value="tutto">Tutto</option>
          <option value="in_corso">In corso</option>
          <option value="risolto">Risolto</option>
          <option value="ricorrente">Ricorrente</option>
          <option value="migliorato">Migliorato</option>
        </select>
        <input placeholder="Filtra per area corpo..." value={filterArea} onChange={e => setFilterArea(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1 min-w-40" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Nessun episodio trovato</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-400">
                <th className="px-4 py-3 font-medium">Inizio</th>
                <th className="px-4 py-3 font-medium">Fine</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Diagnosi</th>
                <th className="px-4 py-3 font-medium">Intensità</th>
                <th className="px-4 py-3 font-medium">Esito</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ep => (
                <>
                  <tr key={ep.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === ep.id ? null : ep.id)}>
                    <td className="px-4 py-3 font-medium">{formatDate(ep.start_date)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(ep.end_date)}</td>
                    <td className="px-4 py-3">{typeBadge(ep.type)}</td>
                    <td className="px-4 py-3 text-gray-600">{ep.body_area || '-'}</td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{ep.diagnosis || '-'}</td>
                    <td className="px-4 py-3">
                      {ep.intensity ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${ep.intensity * 10}%` }} />
                          </div>
                          <span className="text-gray-500">{ep.intensity}/10</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">{outcomeBadge(ep.outcome)}</td>
                    <td className="px-4 py-3 flex items-center gap-1">
                      {expanded === ep.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      <button onClick={e => { e.stopPropagation(); handleDelete(ep.id) }} className="p-1 text-gray-300 hover:text-red-500 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                  {expanded === ep.id && (
                    <tr key={`exp-${ep.id}`} className="border-t border-gray-100">
                      <td colSpan={8} className="px-4 py-4 bg-blue-50">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {ep.symptoms && <div><span className="text-gray-500 text-xs">Sintomi:</span><p className="mt-0.5">{ep.symptoms}</p></div>}
                          {ep.therapy && <div><span className="text-gray-500 text-xs">Terapia:</span><p className="mt-0.5">{ep.therapy}</p></div>}
                          {ep.probable_cause && <div><span className="text-gray-500 text-xs">Causa probabile:</span><p className="mt-0.5">{ep.probable_cause}</p></div>}
                          {ep.doctor && <div><span className="text-gray-500 text-xs">Medico:</span><p className="mt-0.5">{ep.doctor}</p></div>}
                          {ep.facility && <div><span className="text-gray-500 text-xs">Struttura:</span><p className="mt-0.5">{ep.facility}</p></div>}
                          {ep.stop_days && <div><span className="text-gray-500 text-xs">Giorni di stop:</span><p className="mt-0.5">{ep.stop_days}</p></div>}
                          {ep.notes && <div className="col-span-3"><span className="text-gray-500 text-xs">Note:</span><p className="mt-0.5">{ep.notes}</p></div>}
                          {ep.injury && (
                            <div className="col-span-3 border-t border-blue-200 pt-3 mt-1">
                              <p className="text-xs font-semibold text-gray-500 mb-2">Dettagli Infortunio</p>
                              <div className="grid grid-cols-3 gap-3">
                                {ep.injury.sport && <div><span className="text-gray-400 text-xs">Sport:</span><p>{ep.injury.sport}</p></div>}
                                {ep.injury.movement && <div><span className="text-gray-400 text-xs">Movimento:</span><p>{ep.injury.movement}</p></div>}
                                {ep.injury.body_side && <div><span className="text-gray-400 text-xs">Lato:</span><p>{ep.injury.body_side}</p></div>}
                                {ep.injury.pain_type && <div><span className="text-gray-400 text-xs">Tipo dolore:</span><p>{ep.injury.pain_type}</p></div>}
                                <div><span className="text-gray-400 text-xs">Gonfiore:</span><p>{ep.injury.swelling ? 'Sì' : 'No'}</p></div>
                                <div><span className="text-gray-400 text-xs">Ematoma:</span><p>{ep.injury.hematoma ? 'Sì' : 'No'}</p></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setErrors({}) }} title="Nuovo Episodio">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">Data inizio *</label>
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls(errors.start_date)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Data fine</label>
            <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls(false)}>
              <option value="malattia">Malattia</option><option value="infortunio">Infortunio</option>
              <option value="intervento">Intervento</option><option value="ricaduta">Ricaduta</option>
            </select></div>
          <div><label className="block text-xs text-gray-500 mb-1">Area corpo</label>
            <input value={form.body_area} onChange={e => setForm(f => ({ ...f, body_area: e.target.value }))} className={inputCls(false)} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Diagnosi *</label>
            <input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} className={inputCls(errors.diagnosis)} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Sintomi</label>
            <textarea rows={2} value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} className={inputCls(false)} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Intensità: {form.intensity}/10</label>
            <input type="range" min="1" max="10" value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: parseInt(e.target.value) }))} className="w-full" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Causa probabile</label>
            <input value={form.probable_cause} onChange={e => setForm(f => ({ ...f, probable_cause: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Medico</label>
            <input value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Struttura</label>
            <input value={form.facility} onChange={e => setForm(f => ({ ...f, facility: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Giorni di stop</label>
            <input type="number" value={form.stop_days} onChange={e => setForm(f => ({ ...f, stop_days: e.target.value }))} className={inputCls(false)} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Terapia</label>
            <textarea rows={2} value={form.therapy} onChange={e => setForm(f => ({ ...f, therapy: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Esito</label>
            <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} className={inputCls(false)}>
              <option value="in_corso">In corso</option><option value="risolto">Risolto</option>
              <option value="ricorrente">Ricorrente</option><option value="migliorato">Migliorato</option>
            </select></div>
          <div><label className="block text-xs text-gray-500 mb-1">Note</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls(false)} /></div>

          {form.type === 'infortunio' && (
            <div className="col-span-2 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Dettagli Infortunio</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Sport / Attività</label>
                  <input value={form.injury.sport} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, sport: e.target.value } }))} className={inputCls(false)} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Movimento</label>
                  <input value={form.injury.movement} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, movement: e.target.value } }))} className={inputCls(false)} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Lato del corpo</label>
                  <select value={form.injury.body_side} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, body_side: e.target.value } }))} className={inputCls(false)}>
                    <option value="">-</option><option>Sinistro</option><option>Destro</option><option>Bilaterale</option>
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Tipo di dolore</label>
                  <select value={form.injury.pain_type} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, pain_type: e.target.value } }))} className={inputCls(false)}>
                    <option value="">-</option><option>Immediato</option><option>Progressivo</option><option>Ritardato</option>
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Sessioni fisioterapia</label>
                  <input type="number" value={form.injury.physiotherapy_sessions} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, physiotherapy_sessions: e.target.value } }))} className={inputCls(false)} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Recidive</label>
                  <input type="number" value={form.injury.recurrences} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, recurrences: e.target.value } }))} className={inputCls(false)} /></div>
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Limitazioni residue</label>
                  <input value={form.injury.residual_limitations} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, residual_limitations: e.target.value } }))} className={inputCls(false)} /></div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.injury.swelling} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, swelling: e.target.checked } }))} className="rounded" />
                    Gonfiore
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.injury.hematoma} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, hematoma: e.target.checked } }))} className="rounded" />
                    Ematoma
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.injury.continued_activity} onChange={e => setForm(f => ({ ...f, injury: { ...f.injury, continued_activity: e.target.checked } }))} className="rounded" />
                    Attività continuata
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="col-span-2 flex gap-2 pt-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salva Episodio</button>
            <button onClick={() => { setModalOpen(false); setErrors({}) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
