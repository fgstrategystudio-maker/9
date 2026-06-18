import React, { useState, useMemo } from 'react'
import { Plus, X, BookOpen, Filter } from 'lucide-react'
import { diaryStore } from '../store'

const PRESET_SYMPTOMS = [
  'Mal di testa', 'Stanchezza', 'Dolore', 'Nausea', 'Febbre', 'Tosse',
  'Mal di gola', 'Insonnia', 'Ansia', 'Gonfiore', 'Bruciore', 'Vertigini',
]

const MOODS = ['😞', '😔', '😐', '🙂', '😊']

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('-').reverse().join('/')
}

function groupByMonth(entries) {
  const groups = {}
  entries.forEach(entry => {
    const key = entry.date ? entry.date.slice(0, 7) : 'sconosciuto'
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  })
  return groups
}

function monthLabel(key) {
  if (key === 'sconosciuto') return 'Data sconosciuta'
  const [year, month] = key.split('-')
  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

function EnergyDots({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= value ? 'bg-amber-400' : 'bg-gray-200'}`} />
      ))}
    </div>
  )
}

function IntensityBar({ value }) {
  const color = value <= 3 ? 'bg-green-400' : value <= 6 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value * 10}%` }} />
      </div>
      <span className="text-xs text-gray-400">{value}/10</span>
    </div>
  )
}

function SymptomPill({ label, selected, onClick, colored = false }) {
  const colors = [
    'bg-rose-100 text-rose-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700',
    'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-700', 'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700', 'bg-sky-100 text-sky-700', 'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-pink-100 text-pink-700',
  ]
  const idx = PRESET_SYMPTOMS.indexOf(label)
  const colorClass = colored && idx >= 0 ? colors[idx % colors.length] : (selected ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${colorClass} ${!colored ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {label}
    </button>
  )
}

export default function Diary() {
  const [entries, setEntries] = useState(() => diaryStore.all())
  const [showForm, setShowForm] = useState(false)
  const [filterSymptom, setFilterSymptom] = useState(null)
  const [customSymptom, setCustomSymptom] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: today,
    symptoms: [],
    intensity: 5,
    mood: 2,
    energy: 3,
    notes: '',
  })

  const toggleSymptom = (sym) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(sym)
        ? f.symptoms.filter(s => s !== sym)
        : [...f.symptoms, sym],
    }))
  }

  const addCustomSymptom = () => {
    const s = customSymptom.trim()
    if (!s) return
    if (!form.symptoms.includes(s)) {
      setForm(f => ({ ...f, symptoms: [...f.symptoms, s] }))
    }
    setCustomSymptom('')
  }

  const handleSave = () => {
    if (!form.date) return
    setEntries(diaryStore.add({ ...form }))
    setForm({ date: today, symptoms: [], intensity: 5, mood: 2, energy: 3, notes: '' })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setEntries(diaryStore.remove(id))
  }

  // Filter
  const filtered = filterSymptom
    ? entries.filter(e => e.symptoms && e.symptoms.includes(filterSymptom))
    : entries

  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const grouped = groupByMonth(sorted)
  const monthKeys = Object.keys(grouped).sort().reverse()

  // Top symptoms
  const symptomCounts = useMemo(() => {
    const counts = {}
    entries.forEach(e => {
      (e.symptoms || []).forEach(s => { counts[s] = (counts[s] || 0) + 1 })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [entries])

  // All unique symptoms for filter
  const allSymptoms = useMemo(() => {
    const s = new Set()
    entries.forEach(e => (e.symptoms || []).forEach(sym => s.add(sym)))
    return [...s]
  }, [entries])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Diario sintomi</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors shadow-sm"
        >
          <Plus size={16} />{showForm ? 'Annulla' : 'Aggiungi voce'}
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-pink-200 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Nuova voce diario</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data</label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Sintomi</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_SYMPTOMS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      form.symptoms.includes(s) ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
                  placeholder="Sintomo personalizzato..."
                  value={customSymptom}
                  onChange={e => setCustomSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSymptom()}
                />
                <button type="button" onClick={addCustomSymptom}
                  className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200">
                  Aggiungi
                </button>
              </div>
              {form.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.symptoms.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-pink-50 text-pink-700 text-xs px-2 py-0.5 rounded-full">
                      {s}
                      <button onClick={() => toggleSymptom(s)} className="hover:text-pink-900"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Intensità: {form.intensity}/10</label>
              <input type="range" min="1" max="10" value={form.intensity}
                onChange={e => setForm({ ...form, intensity: parseInt(e.target.value) })}
                className="w-full accent-pink-500" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Umore</label>
              <div className="flex gap-3">
                {MOODS.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, mood: i })}
                    className={`text-2xl rounded-xl p-1 transition-all ${form.mood === i ? 'ring-2 ring-pink-500 scale-110' : 'opacity-50 hover:opacity-80'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Energia: {form.energy}/5</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, energy: i })}
                    className={`w-7 h-7 rounded-full transition-colors ${i <= form.energy ? 'bg-amber-400' : 'bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Note</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3}
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="flex gap-2">
              <button onClick={handleSave}
                className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors">
                Salva
              </button>
              <button onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {allSymptoms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400 mr-1">Filtra per sintomo:</span>
            <button
              onClick={() => setFilterSymptom(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!filterSymptom ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tutti
            </button>
            {allSymptoms.map(s => (
              <button
                key={s}
                onClick={() => setFilterSymptom(filterSymptom === s ? null : s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterSymptom === s ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nessuna voce nel diario.<br />Clicca "Aggiungi voce" per iniziare a registrare i tuoi sintomi.</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Nessuna voce con il sintomo selezionato.
        </div>
      ) : (
        <div className="space-y-6">
          {monthKeys.map(monthKey => (
            <div key={monthKey}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{monthLabel(monthKey)}</h2>
              <div className="space-y-3">
                {grouped[monthKey].map(entry => (
                  <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">{formatDate(entry.date)}</span>
                        <span className="text-xl">{MOODS[entry.mood ?? 2]}</span>
                      </div>
                      <button onClick={() => handleDelete(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <X size={15} />
                      </button>
                    </div>

                    {entry.symptoms && entry.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {entry.symptoms.map(s => (
                          <button
                            key={s}
                            onClick={() => setFilterSymptom(filterSymptom === s ? null : s)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              PRESET_SYMPTOMS.includes(s)
                                ? (() => {
                                    const colors = ['bg-rose-100 text-rose-700','bg-orange-100 text-orange-700','bg-amber-100 text-amber-700','bg-yellow-100 text-yellow-700','bg-green-100 text-green-700','bg-teal-100 text-teal-700','bg-cyan-100 text-cyan-700','bg-sky-100 text-sky-700','bg-blue-100 text-blue-700','bg-indigo-100 text-indigo-700','bg-violet-100 text-violet-700','bg-pink-100 text-pink-700']
                                    return colors[PRESET_SYMPTOMS.indexOf(s) % colors.length]
                                  })()
                                : 'bg-gray-100 text-gray-600'
                            } hover:opacity-80 cursor-pointer`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <span>Intensità:</span>
                        <IntensityBar value={entry.intensity ?? 5} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Energia:</span>
                        <EnergyDots value={entry.energy ?? 3} />
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="mt-2 text-sm text-gray-600 border-t border-gray-50 pt-2">{entry.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pattern note */}
      {symptomCounts.length > 0 && (
        <div className="bg-pink-50 rounded-xl border border-pink-100 p-4 mt-5">
          <div className="text-xs font-semibold text-pink-700 mb-2">Sintomi più frequenti</div>
          <div className="flex flex-wrap gap-2">
            {symptomCounts.map(([sym, count]) => (
              <span key={sym} className="text-xs bg-white border border-pink-200 text-pink-700 px-2.5 py-1 rounded-full">
                {sym} <span className="font-bold">{count}×</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
