import { useState, useEffect } from 'react'
import { getEpisodes } from '../api.js'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Zap, Activity, AlertCircle, CheckCircle2 } from 'lucide-react'

const formatDate = (d) => { try { return d ? format(parseISO(d), 'dd/MM/yyyy') : '-' } catch { return d || '-' } }

const outcomeBadge = (o) => {
  const map = { in_corso: 'bg-yellow-100 text-yellow-700', risolto: 'bg-green-100 text-green-700', ricorrente: 'bg-orange-100 text-orange-700', migliorato: 'bg-blue-100 text-blue-700' }
  const labels = { in_corso: 'In corso', risolto: 'Risolto', ricorrente: 'Ricorrente', migliorato: 'Migliorato' }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[o] || 'bg-gray-100 text-gray-600'}`}>{labels[o] || o}</span>
}

export default function Injuries() {
  const [injuries, setInjuries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterArea, setFilterArea] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterOutcome, setFilterOutcome] = useState('')
  const [filterRecurrent, setFilterRecurrent] = useState(false)

  useEffect(() => {
    getEpisodes().then(eps => {
      setInjuries(eps.filter(e => e.type === 'infortunio'))
    }).finally(() => setLoading(false))
  }, [])

  const years = [...new Set(injuries.filter(i => i.start_date).map(i => i.start_date.slice(0, 4)))].sort().reverse()

  const filtered = injuries.filter(i => {
    if (filterArea && !i.body_area?.toLowerCase().includes(filterArea.toLowerCase())) return false
    if (filterYear && i.start_date?.slice(0, 4) !== filterYear) return false
    if (filterOutcome && filterOutcome !== 'tutto' && i.outcome !== filterOutcome) return false
    if (filterRecurrent && !(i.injury?.recurrences > 0)) return false
    return true
  })

  // Stats
  const totalActive = injuries.filter(i => i.outcome === 'in_corso').length
  const areaCount = injuries.reduce((acc, i) => { if (i.body_area) acc[i.body_area] = (acc[i.body_area] || 0) + 1; return acc }, {})
  const mostAffected = Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0]
  const avgRecovery = (() => {
    const valid = injuries.filter(i => i.start_date && i.end_date)
    if (!valid.length) return null
    const avg = valid.reduce((sum, i) => sum + differenceInDays(parseISO(i.end_date), parseISO(i.start_date)), 0) / valid.length
    return Math.round(avg)
  })()

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Caricamento...</div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Infortuni</h1>
        <p className="text-gray-500 mt-1">{injuries.length} infortuni registrati</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Totale infortuni', value: injuries.length, icon: Zap, color: 'text-red-500' },
          { label: 'Area più colpita', value: mostAffected ? `${mostAffected[0]} (${mostAffected[1]})` : '-', icon: Activity, color: 'text-orange-500' },
          { label: 'Recupero medio (gg)', value: avgRecovery !== null ? avgRecovery : '-', icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Attualmente attivi', value: totalActive, icon: AlertCircle, color: 'text-yellow-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${color}`} /></div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input placeholder="Filtra per area..." value={filterArea} onChange={e => setFilterArea(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1 min-w-32" />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">Tutti gli anni</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">Tutti gli esiti</option>
          <option value="in_corso">In corso</option><option value="risolto">Risolto</option>
          <option value="ricorrente">Ricorrente</option><option value="migliorato">Migliorato</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-600">
          <input type="checkbox" checked={filterRecurrent} onChange={e => setFilterRecurrent(e.target.checked)} className="rounded" />
          Solo ricorrenti
        </label>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Nessun infortunio trovato
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(ep => (
            <div key={ep.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ep.diagnosis || 'Diagnosi non specificata'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(ep.start_date)} — {formatDate(ep.end_date)}</p>
                </div>
                {outcomeBadge(ep.outcome)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                {ep.body_area && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-xs">Area:</span>
                    <span className="font-medium">{ep.body_area}</span>
                    {ep.injury?.body_side && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{ep.injury.body_side}</span>}
                  </div>
                )}
                {ep.injury?.sport && (
                  <div><span className="text-gray-400 text-xs">Sport:</span> <span>{ep.injury.sport}</span></div>
                )}
                {ep.injury?.pain_type && (
                  <div><span className="text-gray-400 text-xs">Dolore:</span> <span>{ep.injury.pain_type}</span></div>
                )}
                {ep.injury?.physiotherapy_sessions && (
                  <div><span className="text-gray-400 text-xs">Fisioterapia:</span> <span>{ep.injury.physiotherapy_sessions} sessioni</span></div>
                )}
              </div>

              {ep.injury && (
                <div className="flex gap-2 mb-3">
                  {ep.injury.swelling ? <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">Gonfiore</span> : null}
                  {ep.injury.hematoma ? <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">Ematoma</span> : null}
                  {ep.injury.continued_activity ? <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">Attività continuata</span> : null}
                  {ep.injury.recurrences > 0 ? <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">{ep.injury.recurrences} recidive</span> : null}
                </div>
              )}

              {ep.injury?.residual_limitations && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  <span className="font-medium">Limitazioni residue: </span>{ep.injury.residual_limitations}
                </div>
              )}

              {ep.intensity && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  Intensità:
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${ep.intensity * 10}%` }} />
                  </div>
                  {ep.intensity}/10
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
