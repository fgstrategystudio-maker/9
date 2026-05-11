import React, { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../components/Modal'
import * as store from '../store'

const TYPES = ['malattia', 'infortunio', 'intervento', 'ricaduta']
const OUTCOMES = ['in_corso', 'risolto', 'migliorato', 'ricorrente']
const OUTCOME_LABEL = { in_corso: 'In corso', risolto: 'Risolto', migliorato: 'Migliorato', ricorrente: 'Ricorrente' }
const OUTCOME_COLOR = { in_corso: 'bg-yellow-100 text-yellow-700', risolto: 'bg-green-100 text-green-700', migliorato: 'bg-blue-100 text-blue-700', ricorrente: 'bg-orange-100 text-orange-700' }
const TYPE_COLOR = { malattia: 'bg-blue-100 text-blue-700', infortunio: 'bg-red-100 text-red-700', intervento: 'bg-purple-100 text-purple-700', ricaduta: 'bg-orange-100 text-orange-700' }

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const EMPTY = {
  start_date: '', end_date: '', type: 'malattia', body_area: '', diagnosis: '', symptoms: '',
  intensity: 5, probable_cause: '', doctor: '', facility: '', therapy: '', stop_days: '',
  outcome: 'in_corso', notes: '',
  injury: { sport: '', movement: '', body_side: '', pain_type: 'progressivo', swelling: false, hematoma: false, continued_activity: false, physiotherapy_sessions: '', recurrences: 0, residual_limitations: '' }
}

function Field({ label, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function Timeline() {
  const [episodes, setEpisodes] = useState(store.episodes.all)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [expanded, setExpanded] = useState(null)
  const [filterYear, setFilterYear] = useState('tutti')
  const [filterType, setFilterType] = useState('tutti')
  const [filterOutcome, setFilterOutcome] = useState('tutti')
  const [filterArea, setFilterArea] = useState('')

  const years = [...new Set(episodes.map(e => e.start_date?.slice(0, 4)).filter(Boolean))].sort().reverse()

  const filtered = episodes.filter(e => {
    if (filterYear !== 'tutti' && !e.start_date?.startsWith(filterYear)) return false
    if (filterType !== 'tutti' && e.type !== filterType) return false
    if (filterOutcome !== 'tutti' && e.outcome !== filterOutcome) return false
    if (filterArea && !e.body_area?.toLowerCase().includes(filterArea.toLowerCase())) return false
    return true
  }).sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''))

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const setInj = (field, val) => setForm(f => ({ ...f, injury: { ...f.injury, [field]: val } }))

  const save = () => {
    if (!form.start_date || !form.type) return
    const item = addEpisode(form)
    setEpisodes(store.episodes.all)
    setShowModal(false)
    setForm(EMPTY)
  }

  const addEpisode = (data) => {
    const { injury, ...rest } = data
    const ep = store.addEpisode(rest)
    if (data.type === 'infortunio') {
      const inj = store.episodes.all().find(e => e.id === ep.id)
      // store injury details inside episode for simplicity
      store.updateEpisode(ep.id, { injury })
    }
    return ep
  }

  const del = (id) => {
    store.deleteEpisode(id)
    setEpisodes(store.episodes.all)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Timeline episodi</h1>
        <button onClick={() => setShowModal(true)} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
          <Plus size={14} className="inline mr-1" />Nuovo episodio
        </button>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="tutti">Tutti gli anni</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="tutti">Tutti i tipi</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}>
          <option value="tutti">Tutti gli esiti</option>
          {OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
        </select>
        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Filtra per zona..." value={filterArea} onChange={e => setFilterArea(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-gray-200">
          Nessun episodio trovato. Aggiungi il primo con il pulsante in alto.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 border-b bg-gray-50">
              <th className="text-left px-4 py-3">Inizio</th>
              <th className="text-left px-4 py-3">Fine</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Zona</th>
              <th className="text-left px-4 py-3">Diagnosi</th>
              <th className="text-left px-4 py-3">Int.</th>
              <th className="text-left px-4 py-3">Esito</th>
              <th />
            </tr></thead>
            <tbody>
              {filtered.map(e => (
                <React.Fragment key={e.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                    <td className="px-4 py-3 text-gray-600">{e.start_date}</td>
                    <td className="px-4 py-3 text-gray-500">{e.end_date || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR[e.type]}`}>{e.type}</span></td>
                    <td className="px-4 py-3 text-gray-700">{e.body_area}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{e.diagnosis}</td>
                    <td className="px-4 py-3">
                      {e.intensity && <div className="flex items-center gap-1"><div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${e.intensity * 10}%` }} /></div><span className="text-xs text-gray-400">{e.intensity}</span></div>}
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLOR[e.outcome]}`}>{OUTCOME_LABEL[e.outcome]}</span></td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      {expanded === e.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      <button onClick={(ev) => { ev.stopPropagation(); del(e.id) }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                  {expanded === e.id && (
                    <tr className="bg-blue-50/40">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {[['Sintomi', e.symptoms], ['Terapia', e.therapy], ['Causa probabile', e.probable_cause], ['Medico', e.doctor], ['Struttura', e.facility], ['Giorni di stop', e.stop_days], ['Note', e.notes]].map(([label, val]) => val ? (
                            <div key={label}><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700">{val}</div></div>
                          ) : null)}
                          {e.injury && e.type === 'infortunio' && (
                            <div className="col-span-3 mt-2 border-t border-blue-100 pt-3">
                              <div className="text-xs text-gray-400 mb-2 font-medium">Dettaglio infortunio</div>
                              <div className="grid grid-cols-3 gap-3">
                                {[['Sport', e.injury.sport], ['Movimento', e.injury.movement], ['Lato', e.injury.body_side], ['Tipo dolore', e.injury.pain_type], ['Sedute fisioterapia', e.injury.physiotherapy_sessions], ['Recidive', e.injury.recurrences], ['Limitazioni residue', e.injury.residual_limitations]].map(([label, val]) => val ? (
                                  <div key={label}><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700">{val}</div></div>
                                ) : null)}
                                <div className="flex gap-3">
                                  {e.injury.swelling && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Gonfiore</span>}
                                  {e.injury.hematoma && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Ematoma</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuovo episodio */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY) }} title="Nuovo episodio">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data inizio *"><input type="date" className={input} value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
          <Field label="Data fine"><input type="date" className={input} value={form.end_date} onChange={e => set('end_date', e.target.value)} /></Field>
          <Field label="Tipo *"><select className={input} value={form.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Zona del corpo"><input className={input} placeholder="ginocchio dx, schiena..." value={form.body_area} onChange={e => set('body_area', e.target.value)} /></Field>
          <Field label="Diagnosi" col2><input className={input} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} /></Field>
          <Field label="Sintomi" col2><input className={input} value={form.symptoms} onChange={e => set('symptoms', e.target.value)} /></Field>
          <Field label={`Intensità: ${form.intensity}/10`} col2>
            <input type="range" min={1} max={10} className="w-full" value={form.intensity} onChange={e => set('intensity', Number(e.target.value))} />
          </Field>
          <Field label="Causa probabile"><input className={input} value={form.probable_cause} onChange={e => set('probable_cause', e.target.value)} /></Field>
          <Field label="Medico"><input className={input} value={form.doctor} onChange={e => set('doctor', e.target.value)} /></Field>
          <Field label="Struttura"><input className={input} value={form.facility} onChange={e => set('facility', e.target.value)} /></Field>
          <Field label="Terapia" col2><input className={input} value={form.therapy} onChange={e => set('therapy', e.target.value)} /></Field>
          <Field label="Giorni di stop"><input type="number" className={input} value={form.stop_days} onChange={e => set('stop_days', e.target.value)} /></Field>
          <Field label="Esito"><select className={input} value={form.outcome} onChange={e => set('outcome', e.target.value)}>{OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}</select></Field>
          <Field label="Note" col2><textarea className={`${input} h-20`} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>

          {form.type === 'infortunio' && (
            <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Dettaglio infortunio</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sport/attività"><input className={input} value={form.injury.sport} onChange={e => setInj('sport', e.target.value)} /></Field>
                <Field label="Movimento che ha causato"><input className={input} value={form.injury.movement} onChange={e => setInj('movement', e.target.value)} /></Field>
                <Field label="Lato"><select className={input} value={form.injury.body_side} onChange={e => setInj('body_side', e.target.value)}><option value="">—</option><option>sinistro</option><option>destro</option><option>bilaterale</option></select></Field>
                <Field label="Tipo dolore"><select className={input} value={form.injury.pain_type} onChange={e => setInj('pain_type', e.target.value)}><option>progressivo</option><option>immediato</option></select></Field>
                <Field label="Sedute fisioterapia"><input type="number" className={input} value={form.injury.physiotherapy_sessions} onChange={e => setInj('physiotherapy_sessions', e.target.value)} /></Field>
                <Field label="Recidive"><input type="number" className={input} value={form.injury.recurrences} onChange={e => setInj('recurrences', Number(e.target.value))} /></Field>
                <Field label="Limitazioni residue" col2><input className={input} value={form.injury.residual_limitations} onChange={e => setInj('residual_limitations', e.target.value)} /></Field>
                <div className="col-span-2 flex gap-4">
                  {[['swelling', 'Gonfiore'], ['hematoma', 'Ematoma'], ['continued_activity', "Ha continuato l'attività"]].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={form.injury[key]} onChange={e => setInj(key, e.target.checked)} className="rounded" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={save} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Salva episodio</button>
          <button onClick={() => { setShowModal(false); setForm(EMPTY) }} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
        </div>
      </Modal>
    </div>
  )
}
