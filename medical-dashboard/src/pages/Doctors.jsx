import React, { useState } from 'react'
import { Plus, Trash2, Edit2, X, Stethoscope, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { doctorsStore } from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const SPECIALTIES = [
  'Medico di base', 'Cardiologo', 'Ortopedico', 'Fisiatra', 'Fisioterapista',
  'Dermatologo', 'Oculista', 'Dentista', 'Neurologo', 'Gastroenterologo',
  'Endocrinologo', 'Pneumologo', 'Urologo', 'Ginecologo', 'Allergologo',
  'Psichiatra', 'Psicologo', 'Otorinolaringoiatra', 'Nutrizionista', 'Altro',
]

const SPECIALTY_COLORS = {
  'Medico di base': 'bg-blue-100 text-blue-700',
  'Cardiologo': 'bg-red-100 text-red-700',
  'Ortopedico': 'bg-orange-100 text-orange-700',
}

const ROTATE_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
]

function specialtyColor(spec) {
  if (SPECIALTY_COLORS[spec]) return SPECIALTY_COLORS[spec]
  const idx = SPECIALTIES.indexOf(spec)
  return ROTATE_COLORS[((idx < 0 ? 0 : idx) - 3 + ROTATE_COLORS.length * 10) % ROTATE_COLORS.length]
}

function timeAgo(dateStr) {
  if (!dateStr) return null
  const days = Math.floor((new Date() - new Date(dateStr)) / 86400000)
  if (days < 0) return null
  if (days === 0) return 'oggi'
  if (days === 1) return 'ieri'
  if (days < 30) return `${days} giorni fa`
  if (days < 365) return `${Math.floor(days / 30)} mesi fa`
  const y = Math.floor(days / 365)
  return `${y} ann${y === 1 ? 'o' : 'i'} fa`
}

// Urgenza basata su ultima visita e prossima visita
function visitStatus(doc) {
  const today = new Date()
  if (doc.next_visit) {
    const daysToNext = Math.floor((new Date(doc.next_visit) - today) / 86400000)
    if (daysToNext < 0) return 'overdue'   // scaduta
    if (daysToNext <= 30) return 'soon'     // entro 30 giorni
  }
  if (doc.last_visit) {
    const daysSinceLast = Math.floor((today - new Date(doc.last_visit)) / 86400000)
    if (daysSinceLast > 365) return 'old'  // più di un anno fa
  }
  return 'ok'
}

const EMPTY = { name: '', specialty: 'Medico di base', facility: '', phone: '', email: '', address: '', last_visit: '', next_visit: '', notes: '' }

function Modal({ doc, onClose, onSave }) {
  const [form, setForm] = useState(doc || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">{doc ? 'Modifica medico' : 'Aggiungi medico'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Nome *</label>
            <input className={input} placeholder="Dr. Mario Rossi" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Specializzazione</label>
            <select className={input} value={form.specialty} onChange={e => set('specialty', e.target.value)}>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Studio / Clinica</label>
            <input className={input} value={form.facility} onChange={e => set('facility', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Telefono</label>
            <input className={input} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Indirizzo</label>
            <input className={input} value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ultima visita</label>
            <input className={input} type="date" value={form.last_visit} onChange={e => set('last_visit', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prossima visita</label>
            <input className={input} type="date" value={form.next_visit} onChange={e => set('next_visit', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Note</label>
            <textarea className={input} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={() => { if (valid) onSave(form) }}
            className={`${btn} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
            disabled={!valid}
          >
            {doc ? 'Salva modifiche' : 'Aggiungi'}
          </button>
          <button onClick={onClose} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>Annulla</button>
        </div>
      </div>
    </div>
  )
}

export default function Doctors() {
  const [list, setList] = useState(doctorsStore.all)
  const [modal, setModal] = useState(null) // null | 'add' | doctor obj
  const [filter, setFilter] = useState('Tutti')

  const reload = () => setList(doctorsStore.all())

  const handleSave = (form) => {
    if (modal && modal.id) {
      doctorsStore.update(modal.id, form)
    } else {
      doctorsStore.add(form)
    }
    reload()
    setModal(null)
  }

  const handleDelete = (id) => {
    if (confirm('Eliminare questo medico?')) {
      doctorsStore.remove(id)
      reload()
    }
  }

  const specialties = ['Tutti', ...new Set(list.map(d => d.specialty))]
  const filtered = filter === 'Tutti' ? list : list.filter(d => d.specialty === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Rubrica medici e specialisti</h1>
        <button
          onClick={() => setModal('add')}
          className={`${btn} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5`}
        >
          <Plus size={15} /> Aggiungi medico
        </button>
      </div>

      {/* Filter */}
      {list.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {specialties.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {list.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🩺</div>
          <div className="font-medium text-gray-500 mb-1">Nessun medico aggiunto</div>
          <div className="text-sm">Aggiungi i tuoi medici di riferimento</div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(doc => {
          const status = visitStatus(doc)
          const borderColor = status === 'overdue' ? 'border-l-red-400' : status === 'soon' ? 'border-l-amber-400' : status === 'old' ? 'border-l-orange-300' : 'border-l-gray-200'
          const ago = timeAgo(doc.last_visit)
          const nextDays = doc.next_visit ? Math.floor((new Date(doc.next_visit) - new Date()) / 86400000) : null

          return (
          <div key={doc.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} p-5`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${specialtyColor(doc.specialty)}`}>
                {doc.specialty}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setModal(doc)} className="text-gray-300 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="font-bold text-gray-800 text-base mb-1">{doc.name}</div>
            {doc.facility && <div className="text-sm text-gray-500 mb-2">{doc.facility}</div>}

            <div className="space-y-1 text-sm">
              {doc.phone && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${doc.phone}`} className="hover:text-blue-600">{doc.phone}</a>
                </div>
              )}
              {doc.email && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Mail size={13} className="text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${doc.email}`} className="hover:text-blue-600 truncate">{doc.email}</a>
                </div>
              )}
              {doc.address && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs">{doc.address}</span>
                </div>
              )}
            </div>

            {(doc.last_visit || doc.next_visit) && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                {doc.last_visit && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar size={11} />
                      <span>Ultima visita</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700 font-medium">{doc.last_visit.split('-').reverse().join('/')}</span>
                      {ago && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          status === 'old' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                        }`}>{ago}</span>
                      )}
                    </div>
                  </div>
                )}
                {doc.next_visit && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar size={11} />
                      <span>Prossima visita</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium ${status === 'overdue' ? 'text-red-600' : status === 'soon' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {doc.next_visit.split('-').reverse().join('/')}
                      </span>
                      {nextDays !== null && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          status === 'overdue' ? 'bg-red-100 text-red-700' :
                          status === 'soon' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {status === 'overdue' ? `${Math.abs(nextDays)}gg scaduta` : nextDays === 0 ? 'oggi' : `tra ${nextDays}gg`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {doc.notes && (
              <div className="mt-2 text-xs text-gray-400 line-clamp-2">{doc.notes}</div>
            )}
          </div>
          )
        })}
      </div>

      {modal && (
        <Modal
          doc={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
