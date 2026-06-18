import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Edit2, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { screeningStore } from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const DEFAULT_SCREENING = [
  { name: 'Analisi del sangue complete', category: 'Generale', frequency_months: 12 },
  { name: 'Pressione arteriosa', category: 'Cardiovascolare', frequency_months: 6 },
  { name: 'Colesterolo totale', category: 'Cardiovascolare', frequency_months: 12 },
  { name: 'ECG', category: 'Cardiovascolare', frequency_months: 24 },
  { name: 'Visita oculistica', category: 'Oculistica', frequency_months: 24 },
  { name: 'Visita dentistica', category: 'Dentale', frequency_months: 6 },
  { name: 'Dermatoscopia (nei)', category: 'Dermatologica', frequency_months: 12 },
  { name: 'Colonscopia', category: 'Gastroenterologica', frequency_months: 60 },
  { name: 'MOC (densità ossea)', category: 'Ortopedica', frequency_months: 24 },
  { name: 'PSA (prostata)', category: 'Urologica', frequency_months: 12 },
  { name: 'Mammografia', category: 'Oncologica', frequency_months: 24 },
  { name: 'PAP test / HPV', category: 'Ginecologica', frequency_months: 36 },
  { name: 'Spirometria', category: 'Pneumologica', frequency_months: 24 },
  { name: 'Glicemia / HbA1c', category: 'Endocrinologica', frequency_months: 12 },
  { name: 'TSH (tiroide)', category: 'Endocrinologica', frequency_months: 12 },
  { name: 'Visita urologica', category: 'Urologica', frequency_months: 24 },
  { name: 'Holter cardiaco', category: 'Cardiovascolare', frequency_months: 36 },
  { name: 'Ecografia addome', category: 'Generale', frequency_months: 24 },
]

function addMonths(dateStr, months) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function daysDiff(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  return Math.round((d - today) / 86400000)
}

function trafficLight(nextDate) {
  if (!nextDate) return { color: 'bg-gray-100 text-gray-500', label: 'Non pianificato', dot: 'bg-gray-400' }
  const days = daysDiff(nextDate)
  if (days < 0) return { color: 'bg-red-100 text-red-700', label: `Scaduto da ${-days} giorni`, dot: 'bg-red-500' }
  if (days < 30) return { color: 'bg-orange-100 text-orange-700', label: `Tra ${days} giorni`, dot: 'bg-orange-500' }
  if (days < 90) return { color: 'bg-yellow-100 text-yellow-700', label: `Tra ${days} giorni`, dot: 'bg-yellow-500' }
  return { color: 'bg-green-100 text-green-700', label: `Tra ${days} giorni`, dot: 'bg-green-500' }
}

const EMPTY_FORM = { name: '', category: 'Generale', frequency_months: 12, last_date: '', next_date: '', notes: '' }

function Modal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item ? { ...item } : EMPTY_FORM)
  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v }
    if (k === 'last_date' && v && next.frequency_months) {
      next.next_date = addMonths(v, Number(next.frequency_months))
    }
    if (k === 'frequency_months' && next.last_date && v) {
      next.next_date = addMonths(next.last_date, Number(v))
    }
    return next
  })

  const categories = [...new Set(DEFAULT_SCREENING.map(d => d.category))]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">{item ? 'Modifica screening' : 'Aggiungi screening'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome *</label>
            <input className={input} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoria</label>
              <select className={input} value={form.category} onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
                <option>Altro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Frequenza (mesi)</label>
              <input className={input} type="number" min="1" value={form.frequency_months} onChange={e => set('frequency_months', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ultima volta</label>
              <input className={input} type="date" value={form.last_date} onChange={e => set('last_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prossima scadenza</label>
              <input className={input} type="date" value={form.next_date} onChange={e => set('next_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note</label>
            <textarea className={input} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={() => { if (form.name.trim()) onSave(form) }}
            disabled={!form.name.trim()}
            className={`${btn} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
          >
            {item ? 'Salva' : 'Aggiungi'}
          </button>
          <button onClick={onClose} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
        </div>
      </div>
    </div>
  )
}

export default function Screening() {
  const [list, setList] = useState(screeningStore.all)
  const [modal, setModal] = useState(null)

  const reload = () => setList(screeningStore.all())

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const stats = useMemo(() => {
    let expiring = 0, overdue = 0, ok = 0
    list.forEach(item => {
      if (!item.next_date) return
      const days = daysDiff(item.next_date)
      if (days < 0) overdue++
      else if (days < 30) expiring++
      else ok++
    })
    return { expiring, overdue, ok }
  }, [list])

  const grouped = useMemo(() => {
    const g = {}
    list.forEach(item => {
      const cat = item.category || 'Altro'
      if (!g[cat]) g[cat] = []
      g[cat].push(item)
    })
    return g
  }, [list])

  const initDefaults = () => {
    DEFAULT_SCREENING.forEach(s => screeningStore.add(s))
    reload()
  }

  const handleSave = (form) => {
    if (modal && modal.id) {
      screeningStore.update(modal.id, form)
    } else {
      screeningStore.add(form)
    }
    reload()
    setModal(null)
  }

  const handleDone = (item) => {
    const last_date = new Date().toISOString().slice(0, 10)
    const next_date = addMonths(last_date, Number(item.frequency_months) || 12)
    screeningStore.update(item.id, { last_date, next_date })
    reload()
  }

  const handleDelete = (id) => {
    if (confirm('Eliminare questo screening?')) {
      screeningStore.remove(id)
      reload()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Screening e prevenzione</h1>
        <button
          onClick={() => setModal('add')}
          className={`${btn} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5`}
        >
          <Plus size={15} /> Aggiungi screening
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
          <div className="text-sm text-orange-700 mt-0.5">In scadenza (30 gg)</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-red-700 mt-0.5">Scaduti</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
          <div className="text-sm text-green-700 mt-0.5">In regola</div>
        </div>
      </div>

      {/* Init button */}
      {list.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🩺</div>
          <div className="font-medium text-gray-600 mb-2">Nessuno screening aggiunto</div>
          <div className="text-sm text-gray-400 mb-5">Puoi iniziare con la lista base di esami preventivi consigliati</div>
          <button
            onClick={initDefaults}
            className={`${btn} bg-lime-600 text-white hover:bg-lime-700`}
          >
            Inizializza lista base
          </button>
        </div>
      )}

      {/* Grouped list */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{cat}</h2>
          <div className="space-y-2">
            {items.map(item => {
              const tl = trafficLight(item.next_date)
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tl.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Ultima: <strong>{item.last_date || 'Mai'}</strong></span>
                      {item.next_date && (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${tl.color}`}>
                          {tl.label}
                        </span>
                      )}
                      {!item.next_date && <span className="text-gray-400">Non pianificato</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDone(item)}
                      title="Fatto oggi"
                      className="px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium flex items-center gap-1"
                    >
                      <CheckCircle size={13} /> Fatto oggi
                    </button>
                    <button onClick={() => setModal(item)} className="text-gray-300 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {modal && (
        <Modal
          item={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
