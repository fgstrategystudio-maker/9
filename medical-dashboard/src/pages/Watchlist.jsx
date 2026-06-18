import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Modal from '../components/Modal'
import { watchlistStore } from '../store'

const BODY_AREAS = [
  'Testa', 'Occhi', 'Orecchie', 'Naso', 'Gola', 'Collo', 'Petto', 'Cuore',
  'Addome', 'Schiena', 'Spalle', 'Braccia', 'Mani', 'Gambe', 'Ginocchia',
  'Caviglie', 'Piedi', 'Pelle', 'Psicologico', 'Generale', 'Altro',
]

const FREQUENCY = ['Una volta', 'Occasionale', 'Ricorrente', 'Costante']

const STATUS = {
  da_controllare: { label: 'Da controllare', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', border: 'border-l-amber-400', icon: Clock },
  controllato:    { label: 'Controllato',    color: 'bg-sky-100 text-sky-700 border-sky-200',     dot: 'bg-sky-400',   border: 'border-l-sky-400',   icon: Eye },
  risolto:        { label: 'Risolto',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', border: 'border-l-emerald-400', icon: CheckCircle },
}

const PRIORITY = {
  bassa:  { label: 'Bassa',  color: 'bg-gray-100 text-gray-600' },
  media:  { label: 'Media',  color: 'bg-orange-100 text-orange-700' },
  alta:   { label: 'Alta',   color: 'bg-red-100 text-red-700' },
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const EMPTY = {
  title: '', body_area: '', date_noticed: new Date().toISOString().slice(0, 10),
  context: '', frequency: 'Una volta', priority: 'media',
  status: 'da_controllare', doctor_told: false, notes: '',
}

const STATUS_ORDER = { da_controllare: 0, controllato: 1, risolto: 2 }

export default function Watchlist() {
  const [items, setItems] = useState(watchlistStore.all)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filterStatus, setFilterStatus] = useState('tutti')

  const reload = () => setItems(watchlistStore.all())
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (item) => { setEditingId(item.id); setForm({ ...EMPTY, ...item }); setShowModal(true) }

  const handleSave = () => {
    if (!form.title.trim()) return
    if (editingId) {
      watchlistStore.update(editingId, form)
    } else {
      watchlistStore.add(form)
    }
    reload()
    setShowModal(false)
    setEditingId(null)
  }

  const handleDelete = (id) => {
    if (confirm('Eliminare questa osservazione?')) {
      watchlistStore.remove(id)
      reload()
    }
  }

  const quickStatus = (id, status) => {
    watchlistStore.update(id, { status })
    reload()
  }

  const filtered = (filterStatus === 'tutti' ? items : items.filter(i => i.status === filterStatus))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.date_noticed || '').localeCompare(a.date_noticed || ''))

  const counts = {
    da_controllare: items.filter(i => i.status === 'da_controllare').length,
    controllato: items.filter(i => i.status === 'controllato').length,
    risolto: items.filter(i => i.status === 'risolto').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sintomi da monitorare</h1>
          <p className="text-sm text-gray-400 mt-0.5">Annota sensazioni anomale da tenere sott'occhio o riferire al medico</p>
        </div>
        <button onClick={openAdd} className={`${btn} bg-violet-600 text-white hover:bg-violet-700 shadow-sm flex items-center gap-1.5`}>
          <Plus size={14} />Aggiungi
        </button>
      </div>

      {/* Contatori */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {Object.entries(STATUS).map(([key, s]) => {
            const Icon = s.icon
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? 'tutti' : key)}
                className={`rounded-xl border p-3 text-left transition-all ${filterStatus === key ? s.color + ' shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={filterStatus === key ? '' : 'text-gray-400'} />
                  <span className="text-xs font-semibold">{s.label}</span>
                </div>
                <div className="text-2xl font-bold">{counts[key]}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <AlertCircle size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Nessuna osservazione</p>
          <p className="text-gray-400 text-sm">Annotare sensazioni anomale aiuta a tenerne traccia<br />e a parlarne con il medico al momento giusto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const s = STATUS[item.status] || STATUS.da_controllare
            const p = PRIORITY[item.priority] || PRIORITY.media
            const Icon = s.icon
            return (
              <div key={item.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.border} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-800">{item.title}</span>
                      {item.body_area && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.body_area}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.color}`}>{p.label}</span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-2">
                      {item.date_noticed && <span>📅 {item.date_noticed.split('-').reverse().join('/')}</span>}
                      {item.frequency && <span>🔁 {item.frequency}</span>}
                      {item.context && <span>📍 {item.context}</span>}
                      {item.doctor_told && <span className="text-emerald-600 font-medium">✓ Detto al medico</span>}
                    </div>

                    {item.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Quick status cycle */}
                    <div className="flex gap-1 mr-1">
                      {Object.entries(STATUS).map(([key, st]) => (
                        <button
                          key={key}
                          title={st.label}
                          onClick={() => quickStatus(item.id, key)}
                          className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${item.status === key ? st.dot : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <button onClick={() => openEdit(item)} className="text-gray-300 hover:text-violet-500 p-1"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Status badge */}
                <div className="mt-2 flex items-center gap-1.5">
                  <Icon size={12} className="opacity-60" />
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null) }} title={editingId ? 'Modifica osservazione' : 'Nuova osservazione'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrizione *</label>
            <input className={input} placeholder="es. Pulsazione all'orecchio sinistro in sauna" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Zona del corpo</label>
              <select className={input} value={form.body_area} onChange={e => set('body_area', e.target.value)}>
                <option value="">— nessuna —</option>
                {BODY_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data in cui l'hai notato</label>
              <input type="date" className={input} value={form.date_noticed} onChange={e => set('date_noticed', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Contesto / quando succede</label>
            <input className={input} placeholder="es. in sauna, dopo corsa, la mattina, sotto sforzo..." value={form.context} onChange={e => set('context', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Frequenza</label>
              <select className={input} value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                {FREQUENCY.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorità</label>
              <select className={input} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Stato</label>
            <div className="flex gap-2">
              {Object.entries(STATUS).map(([key, s]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('status', key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${form.status === key ? s.color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input type="checkbox" className="rounded accent-violet-500" checked={form.doctor_told} onChange={e => set('doctor_told', e.target.checked)} />
              Ho già detto al medico
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Note</label>
            <textarea className={`${input} h-20`} placeholder="Dettagli, sensazioni, variazioni nel tempo..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} className={`${btn} bg-violet-600 text-white hover:bg-violet-700`}>
            {editingId ? 'Aggiorna' : 'Salva'}
          </button>
          <button onClick={() => { setShowModal(false); setEditingId(null) }} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
        </div>
      </Modal>
    </div>
  )
}
