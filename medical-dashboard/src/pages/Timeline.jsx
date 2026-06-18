import React, { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, LayoutList, GitBranch, Edit2 } from 'lucide-react'
import Modal from '../components/Modal'
import * as store from '../store'

const TYPES = ['malattia', 'infortunio', 'intervento', 'ricaduta', 'evento_positivo']
const OUTCOMES = ['in_corso', 'risolto', 'migliorato', 'ricorrente']
const OUTCOME_LABEL = { in_corso: 'In corso', risolto: 'Risolto', migliorato: 'Migliorato', ricorrente: 'Ricorrente' }
const OUTCOME_COLOR = {
  in_corso: 'bg-amber-100 text-amber-700',
  risolto: 'bg-emerald-100 text-emerald-700',
  migliorato: 'bg-sky-100 text-sky-700',
  ricorrente: 'bg-orange-100 text-orange-700',
}
const TYPE_COLOR = {
  malattia: 'bg-blue-100 text-blue-700',
  infortunio: 'bg-red-100 text-red-700',
  intervento: 'bg-purple-100 text-purple-700',
  ricaduta: 'bg-orange-100 text-orange-700',
  evento_positivo: 'bg-emerald-100 text-emerald-700',
}

// polarity: true=positivo(green), false=negativo(red)
const defaultPolarity = (type) => type === 'evento_positivo'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const EMPTY = {
  start_date: '', end_date: '', type: 'malattia', body_area: '', diagnosis: '', symptoms: '',
  intensity: 5, probable_cause: '', doctor: '', facility: '', therapy: '', stop_days: '',
  outcome: 'in_corso', notes: '', is_positive: false,
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

// ─── Visual year-by-year chart ────────────────────────────────────────────────
function TimelineChart({ episodes, onEditEpisode }) {
  if (episodes.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-200">
        Nessun episodio. Aggiungine uno per vedere il grafico.
      </div>
    )
  }

  const byYear = episodes.reduce((acc, ep) => {
    const y = ep.start_date?.slice(0, 4)
    if (!y) return acc
    if (!acc[y]) acc[y] = []
    acc[y].push(ep)
    return acc
  }, {})

  const minYear = Math.min(...Object.keys(byYear).map(Number))
  const maxYear = Math.max(...Object.keys(byYear).map(Number))
  const years = []
  for (let y = maxYear; y >= minYear; y--) years.push(String(y))

  const pillStyle = (ep) => {
    if (ep.is_positive || ep.type === 'evento_positivo')
      return { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-200' }
    if (ep.type === 'ricaduta')
      return { pill: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-200' }
    return { pill: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500', bar: 'bg-red-200' }
  }

  const durationDays = (ep) => {
    if (!ep.start_date || !ep.end_date) return null
    const ms = new Date(ep.end_date) - new Date(ep.start_date)
    return Math.round(ms / 86400000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 overflow-hidden">
      <div className="relative">
        {/* vertical spine */}
        <div className="absolute left-14 top-3 bottom-3 w-0.5 bg-gradient-to-b from-violet-300 via-slate-200 to-violet-300" />

        {years.map((year) => {
          const evs = byYear[year] || []
          const hasEvents = evs.length > 0
          const shown = evs
            .sort((a, b) => (b.intensity || 0) - (a.intensity || 0))
            .slice(0, 4)
          const extra = evs.length - 4

          return (
            <div key={year} className="flex gap-4 mb-5 relative items-start">
              {/* year */}
              <div className={`w-12 text-right text-sm font-bold pt-1 flex-shrink-0 ${hasEvents ? 'text-slate-700' : 'text-slate-300'}`}>
                {year}
              </div>

              {/* dot */}
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ring-2 ring-white ${hasEvents ? 'bg-violet-500' : 'bg-slate-200'}`} />

              {/* events or empty */}
              {hasEvents ? (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {shown.map((ep) => {
                    const s = pillStyle(ep)
                    const days = durationDays(ep)
                    return (
                      <button
                        key={ep.id}
                        title={[ep.diagnosis, ep.body_area, ep.symptoms].filter(Boolean).join(' • ') + (days ? ` — ${days} giorni` : '') + ' — clicca per modificare'}
                        onClick={() => onEditEpisode(ep)}
                        className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-xs font-medium border select-none transition-transform hover:scale-105 hover:shadow-sm ${s.pill}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          {ep.diagnosis || ep.type}
                          {ep.body_area && <span className="opacity-60">· {ep.body_area}</span>}
                          <Edit2 size={10} className="opacity-40 ml-0.5" />
                        </div>
                        {days !== null && (
                          <div className="w-full mt-1.5 flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-black/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.bar}`}
                                style={{ width: `${Math.min(100, (days / 180) * 100)}%`, minWidth: '8%' }}
                              />
                            </div>
                            <span className="opacity-60 text-[10px] whitespace-nowrap">{days}gg</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {extra > 0 && (
                    <div className="px-3 py-1 rounded-full text-xs text-slate-400 border border-dashed border-slate-200">
                      +{extra} altri
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-300 pt-1.5">—</div>
              )}
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />Malattia / infortunio / intervento
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Ricaduta
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Positivo / guarigione / traguardo
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-10 h-1 rounded-full bg-red-200 inline-block" />Durata recupero (giorni)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Edit2 size={10} className="text-gray-400" />Clicca per modificare
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Timeline() {
  const [episodes, setEpisodes] = useState(store.episodes.all)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [view, setView] = useState('chart') // 'chart' | 'list'
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

  const set = (field, val) => setForm(f => {
    const next = { ...f, [field]: val }
    if (field === 'type') next.is_positive = defaultPolarity(val)
    return next
  })
  const setInj = (field, val) => setForm(f => ({ ...f, injury: { ...f.injury, [field]: val } }))

  const openEdit = (ep) => {
    setEditingId(ep.id)
    setForm({ ...EMPTY, ...ep, injury: ep.injury || EMPTY.injury })
    setShowModal(true)
  }

  const save = () => {
    if (!form.start_date || !form.type) return
    const { injury, ...rest } = form
    if (editingId) {
      store.updateEpisode(editingId, rest)
      if (form.type === 'infortunio') store.updateEpisode(editingId, { injury })
    } else {
      const ep = store.addEpisode(rest)
      if (form.type === 'infortunio') store.updateEpisode(ep.id, { injury })
    }
    setEpisodes(store.episodes.all())
    setShowModal(false)
    setForm(EMPTY)
    setEditingId(null)
  }

  const del = (id) => {
    store.deleteEpisode(id)
    setEpisodes(store.episodes.all())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Timeline episodi</h1>
        <div className="flex items-center gap-2">
          {/* view toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'chart' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <GitBranch size={13} />Grafico
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutList size={13} />Lista
            </button>
          </div>
          <button onClick={() => { setEditingId(null); setForm(EMPTY); setShowModal(true) }} className={`${btn} bg-violet-600 text-white hover:bg-violet-700 shadow-sm`}>
            <Plus size={14} className="inline mr-1" />Nuovo episodio
          </button>
        </div>
      </div>

      {view === 'chart' ? (
        <TimelineChart episodes={episodes} onEditEpisode={openEdit} />
      ) : (
        <>
          {/* Filtri */}
          <div className="flex flex-wrap gap-2 mb-5">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="tutti">Tutti gli anni</option>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="tutti">Tutti i tipi</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}>
              <option value="tutti">Tutti gli esiti</option>
              {OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Filtra per zona..." value={filterArea} onChange={e => setFilterArea(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200">
              Nessun episodio trovato.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400 border-b bg-slate-50">
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
                      <tr
                        className={`border-b border-gray-50 hover:bg-slate-50 cursor-pointer ${e.is_positive || e.type === 'evento_positivo' ? 'border-l-2 border-l-emerald-400' : ''}`}
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                      >
                        <td className="px-4 py-3 text-gray-600">{e.start_date}</td>
                        <td className="px-4 py-3 text-gray-500">{e.end_date || '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR[e.type]}`}>{e.type}</span></td>
                        <td className="px-4 py-3 text-gray-700">{e.body_area}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{e.diagnosis}</td>
                        <td className="px-4 py-3">
                          {e.intensity && (
                            <div className="flex items-center gap-1">
                              <div className="w-14 bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${e.is_positive || e.type === 'evento_positivo' ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${e.intensity * 10}%` }} />
                              </div>
                              <span className="text-xs text-gray-400">{e.intensity}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLOR[e.outcome]}`}>{OUTCOME_LABEL[e.outcome]}</span></td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          {expanded === e.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          <button onClick={(ev) => { ev.stopPropagation(); openEdit(e) }} className="text-gray-300 hover:text-violet-500"><Edit2 size={14} /></button>
                          <button onClick={(ev) => { ev.stopPropagation(); del(e.id) }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                      {expanded === e.id && (
                        <tr className="bg-violet-50/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              {[['Sintomi', e.symptoms], ['Terapia', e.therapy], ['Causa probabile', e.probable_cause], ['Medico', e.doctor], ['Struttura', e.facility], ['Giorni di stop', e.stop_days], ['Note', e.notes]].map(([label, val]) => val ? (
                                <div key={label}><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700">{val}</div></div>
                              ) : null)}
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
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY); setEditingId(null) }} title={editingId ? 'Modifica episodio' : 'Nuovo episodio'}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data inizio *"><input type="date" className={input} value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
          <Field label="Data fine"><input type="date" className={input} value={form.end_date} onChange={e => set('end_date', e.target.value)} /></Field>
          <Field label="Tipo *">
            <select className={input} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Zona del corpo"><input className={input} placeholder="ginocchio dx, schiena..." value={form.body_area} onChange={e => set('body_area', e.target.value)} /></Field>
          <Field label="Diagnosi / descrizione" col2><input className={input} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} /></Field>
          <Field label="Sintomi" col2><input className={input} value={form.symptoms} onChange={e => set('symptoms', e.target.value)} /></Field>
          <Field label={`Intensità: ${form.intensity}/10`} col2>
            <input type="range" min={1} max={10} className="w-full accent-violet-500" value={form.intensity} onChange={e => set('intensity', Number(e.target.value))} />
          </Field>
          <Field label="Causa probabile"><input className={input} value={form.probable_cause} onChange={e => set('probable_cause', e.target.value)} /></Field>
          <Field label="Medico"><input className={input} value={form.doctor} onChange={e => set('doctor', e.target.value)} /></Field>
          <Field label="Struttura"><input className={input} value={form.facility} onChange={e => set('facility', e.target.value)} /></Field>
          <Field label="Terapia" col2><input className={input} value={form.therapy} onChange={e => set('therapy', e.target.value)} /></Field>
          <Field label="Giorni di stop"><input type="number" className={input} value={form.stop_days} onChange={e => set('stop_days', e.target.value)} /></Field>
          <Field label="Esito">
            <select className={input} value={form.outcome} onChange={e => set('outcome', e.target.value)}>
              {OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
            </select>
          </Field>
          <Field label="Note" col2><textarea className={`${input} h-20`} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>

          {/* polarity toggle */}
          <div className="col-span-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => set('is_positive', !form.is_positive)}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.is_positive ? 'bg-emerald-500' : 'bg-red-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_positive ? 'left-5' : 'left-1'}`} />
              </div>
              <span className={`text-sm font-medium ${form.is_positive ? 'text-emerald-700' : 'text-red-600'}`}>
                {form.is_positive ? '🟢 Evento positivo (verde nel grafico)' : '🔴 Evento negativo (rosso nel grafico)'}
              </span>
            </label>
          </div>

          {form.type === 'infortunio' && (
            <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Dettaglio infortunio</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sport/attività"><input className={input} value={form.injury.sport} onChange={e => setInj('sport', e.target.value)} /></Field>
                <Field label="Movimento che ha causato"><input className={input} value={form.injury.movement} onChange={e => setInj('movement', e.target.value)} /></Field>
                <Field label="Lato">
                  <select className={input} value={form.injury.body_side} onChange={e => setInj('body_side', e.target.value)}>
                    <option value="">—</option><option>sinistro</option><option>destro</option><option>bilaterale</option>
                  </select>
                </Field>
                <Field label="Tipo dolore">
                  <select className={input} value={form.injury.pain_type} onChange={e => setInj('pain_type', e.target.value)}>
                    <option>progressivo</option><option>immediato</option>
                  </select>
                </Field>
                <Field label="Sedute fisioterapia"><input type="number" className={input} value={form.injury.physiotherapy_sessions} onChange={e => setInj('physiotherapy_sessions', e.target.value)} /></Field>
                <Field label="Recidive"><input type="number" className={input} value={form.injury.recurrences} onChange={e => setInj('recurrences', Number(e.target.value))} /></Field>
                <Field label="Limitazioni residue" col2><input className={input} value={form.injury.residual_limitations} onChange={e => setInj('residual_limitations', e.target.value)} /></Field>
                <div className="col-span-2 flex gap-4">
                  {[['swelling', 'Gonfiore'], ['hematoma', 'Ematoma'], ['continued_activity', "Ha continuato l'attività"]].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={form.injury[key]} onChange={e => setInj(key, e.target.checked)} className="rounded accent-violet-500" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={save} className={`${btn} bg-violet-600 text-white hover:bg-violet-700`}>{editingId ? 'Aggiorna episodio' : 'Salva episodio'}</button>
          <button onClick={() => { setShowModal(false); setForm(EMPTY); setEditingId(null) }} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
        </div>
      </Modal>
    </div>
  )
}
