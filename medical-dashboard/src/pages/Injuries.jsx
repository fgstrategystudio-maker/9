import React, { useState } from 'react'
import { Zap, AlertTriangle } from 'lucide-react'
import * as store from '../store'

const OUTCOME_COLOR = { in_corso: 'bg-yellow-100 text-yellow-700', risolto: 'bg-green-100 text-green-700', migliorato: 'bg-blue-100 text-blue-700', ricorrente: 'bg-orange-100 text-orange-700' }
const OUTCOME_LABEL = { in_corso: 'In corso', risolto: 'Risolto', migliorato: 'Migliorato', ricorrente: 'Ricorrente' }

export default function Injuries() {
  const allEpisodes = store.episodes.all()
  const injuries = allEpisodes.filter(e => e.type === 'infortunio')

  const [filterArea, setFilterArea] = useState('')
  const [filterYear, setFilterYear] = useState('tutti')
  const [filterOutcome, setFilterOutcome] = useState('tutti')
  const [onlyRecurrent, setOnlyRecurrent] = useState(false)

  const years = [...new Set(injuries.map(e => e.start_date?.slice(0, 4)).filter(Boolean))].sort().reverse()

  const filtered = injuries.filter(e => {
    if (filterYear !== 'tutti' && !e.start_date?.startsWith(filterYear)) return false
    if (filterOutcome !== 'tutti' && e.outcome !== filterOutcome) return false
    if (filterArea && !e.body_area?.toLowerCase().includes(filterArea.toLowerCase())) return false
    if (onlyRecurrent && !(e.injury?.recurrences > 0)) return false
    return true
  })

  const areaCounts = injuries.reduce((acc, e) => {
    if (e.body_area) acc[e.body_area] = (acc[e.body_area] || 0) + 1
    return acc
  }, {})
  const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const avgStop = injuries.filter(e => e.stop_days).reduce((s, e, _, a) => s + Number(e.stop_days) / a.length, 0)
  const active = injuries.filter(e => e.outcome === 'in_corso').length

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Infortuni</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['Totale infortuni', injuries.length, 'text-gray-700'],
          ['Zona più colpita', topArea || '—', 'text-blue-700'],
          ['Giorni medi di stop', avgStop ? Math.round(avgStop) : '—', 'text-gray-700'],
          ['Attualmente attivi', active, active > 0 ? 'text-red-600' : 'text-gray-700'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Zona del corpo..." value={filterArea} onChange={e => setFilterArea(e.target.value)} />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="tutti">Tutti gli anni</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}>
          <option value="tutti">Tutti gli esiti</option>
          <option value="in_corso">In corso</option>
          <option value="risolto">Risolto</option>
          <option value="ricorrente">Ricorrente</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={onlyRecurrent} onChange={e => setOnlyRecurrent(e.target.checked)} />
          Solo con recidive
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-gray-200">
          Nessun infortunio trovato. Aggiungi episodi di tipo "infortunio" dalla sezione Timeline.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || '')).map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-red-500" />
                    <h3 className="font-semibold text-gray-800">{e.diagnosis || 'Infortunio'}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLOR[e.outcome]}`}>{OUTCOME_LABEL[e.outcome]}</span>
                    {e.injury?.recurrences > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} />{e.injury.recurrences} recidive</span>}
                  </div>
                  <div className="text-sm text-gray-500">{e.start_date}{e.end_date ? ` → ${e.end_date}` : ''}</div>
                </div>
                <div className="text-right">
                  {e.body_area && <div className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{e.body_area}{e.injury?.body_side ? ` (${e.injury.body_side})` : ''}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {e.injury?.sport && <div><span className="text-gray-400">Sport: </span><span className="text-gray-700">{e.injury.sport}</span></div>}
                {e.injury?.movement && <div><span className="text-gray-400">Movimento: </span><span className="text-gray-700">{e.injury.movement}</span></div>}
                {e.injury?.pain_type && <div><span className="text-gray-400">Dolore: </span><span className="text-gray-700">{e.injury.pain_type}</span></div>}
                {e.stop_days && <div><span className="text-gray-400">Stop: </span><span className="text-gray-700">{e.stop_days} giorni</span></div>}
                {e.injury?.physiotherapy_sessions && <div><span className="text-gray-400">Fisioterapia: </span><span className="text-gray-700">{e.injury.physiotherapy_sessions} sedute</span></div>}
                {e.therapy && <div><span className="text-gray-400">Terapia: </span><span className="text-gray-700">{e.therapy}</span></div>}
                {e.injury?.residual_limitations && <div className="col-span-2"><span className="text-gray-400">Limitazioni residue: </span><span className="text-gray-700">{e.injury.residual_limitations}</span></div>}
              </div>

              {(e.injury?.swelling || e.injury?.hematoma || e.injury?.continued_activity) && (
                <div className="flex gap-2 mt-3">
                  {e.injury.swelling && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Gonfiore</span>}
                  {e.injury.hematoma && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Ematoma</span>}
                  {e.injury.continued_activity && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Ha continuato l'attività</span>}
                </div>
              )}

              {e.intensity && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-gray-400 text-xs">Intensità</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-32"><div className="bg-red-400 h-2 rounded-full" style={{ width: `${e.intensity * 10}%` }} /></div>
                  <span className="text-xs text-gray-500">{e.intensity}/10</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
