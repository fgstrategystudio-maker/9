import React, { useState } from 'react'
import { Zap, AlertTriangle, X } from 'lucide-react'
import * as store from '../store'

const OUTCOME_COLOR = { in_corso: 'bg-yellow-100 text-yellow-700', risolto: 'bg-green-100 text-green-700', migliorato: 'bg-blue-100 text-blue-700', ricorrente: 'bg-orange-100 text-orange-700' }
const OUTCOME_LABEL = { in_corso: 'In corso', risolto: 'Risolto', migliorato: 'Migliorato', ricorrente: 'Ricorrente' }

// Zone definitions for body map
const ZONES = [
  { id: 'testa', label: 'Testa', keywords: ['testa', 'cranio', 'fronte', 'nuca'], paired: false },
  { id: 'collo', label: 'Collo', keywords: ['collo', 'cervicale'], paired: false },
  { id: 'petto', label: 'Petto', keywords: ['petto', 'torace', 'costol', 'sterno'], paired: false },
  { id: 'addome', label: 'Addome', keywords: ['addome', 'stomaco', 'pancia', 'addominale'], paired: false },
  { id: 'schiena', label: 'Schiena', keywords: ['schiena', 'lombar', 'dorsale', 'dorso'], paired: false },
  { id: 'spalla_sx', label: 'Spalla Sx', main: ['spalla'], side: ['sx', 'sinistr'], paired: true },
  { id: 'spalla_dx', label: 'Spalla Dx', main: ['spalla'], side: ['dx', 'destr'], paired: true },
  { id: 'braccio_sx', label: 'Braccio Sx', main: ['braccio', 'omero'], side: ['sx', 'sinistr'], paired: true },
  { id: 'braccio_dx', label: 'Braccio Dx', main: ['braccio', 'omero'], side: ['dx', 'destr'], paired: true },
  { id: 'coscia_sx', label: 'Coscia Sx', main: ['coscia', 'femore'], side: ['sx', 'sinistr'], paired: true },
  { id: 'coscia_dx', label: 'Coscia Dx', main: ['coscia', 'femore'], side: ['dx', 'destr'], paired: true },
  { id: 'ginocchio_sx', label: 'Ginocchio Sx', main: ['ginocchio'], side: ['sx', 'sinistr'], paired: true },
  { id: 'ginocchio_dx', label: 'Ginocchio Dx', main: ['ginocchio'], side: ['dx', 'destr'], paired: true },
  { id: 'polpaccio_sx', label: 'Polpaccio Sx', main: ['polpaccio', 'tibia'], side: ['sx', 'sinistr'], paired: true },
  { id: 'polpaccio_dx', label: 'Polpaccio Dx', main: ['polpaccio', 'tibia'], side: ['dx', 'destr'], paired: true },
  { id: 'piede_sx', label: 'Piede Sx', main: ['piede', 'caviglia'], side: ['sx', 'sinistr'], paired: true },
  { id: 'piede_dx', label: 'Piede Dx', main: ['piede', 'caviglia'], side: ['dx', 'destr'], paired: true },
]

function episodeMatchesZone(episode, zone) {
  const area = (episode.body_area || '').toLowerCase()
  if (!area) return false
  if (!zone.paired) {
    return zone.keywords.some(kw => area.includes(kw))
  }
  // paired zone: main keyword must match
  const mainMatch = zone.main.some(kw => area.includes(kw))
  if (!mainMatch) return false
  const sideMatch = zone.side.some(kw => area.includes(kw))
  if (sideMatch) return true
  // if no side specified at all, match both sides
  const allSideKws = ['sx', 'sinistr', 'dx', 'destr']
  const hasSide = allSideKws.some(kw => area.includes(kw))
  return !hasSide
}

function zoneColor(count) {
  if (count === 0) return '#e2e8f0'
  if (count === 1) return '#fde68a'
  if (count === 2) return '#fb923c'
  return '#ef4444'
}

function BodyMap({ injuries, onZoneClick, selectedZone }) {
  const [tooltip, setTooltip] = useState(null)

  const zoneCounts = {}
  ZONES.forEach(z => {
    zoneCounts[z.id] = injuries.filter(e => episodeMatchesZone(e, z)).length
  })

  const shapeProps = (zoneId) => ({
    fill: zoneColor(zoneCounts[zoneId]),
    stroke: selectedZone === zoneId ? '#1e40af' : '#94a3b8',
    strokeWidth: selectedZone === zoneId ? 2 : 0.8,
    style: { cursor: 'pointer', transition: 'fill 0.2s' },
    onClick: () => onZoneClick(zoneId),
    onMouseEnter: (e) => {
      const zone = ZONES.find(z => z.id === zoneId)
      setTooltip({ x: e.clientX, y: e.clientY, label: zone.label, count: zoneCounts[zoneId] })
    },
    onMouseLeave: () => setTooltip(null),
  })

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 400" width="200" height="400" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <ellipse cx="100" cy="28" rx="22" ry="26" {...shapeProps('testa')} />
        {/* Neck */}
        <rect x="91" y="54" width="18" height="16" rx="4" {...shapeProps('collo')} />
        {/* L Shoulder */}
        <ellipse cx="62" cy="82" rx="16" ry="13" {...shapeProps('spalla_sx')} />
        {/* R Shoulder */}
        <ellipse cx="138" cy="82" rx="16" ry="13" {...shapeProps('spalla_dx')} />
        {/* Chest/Torso */}
        <rect x="72" y="70" width="56" height="50" rx="8" {...shapeProps('petto')} />
        {/* Abdomen */}
        <rect x="75" y="118" width="50" height="40" rx="6" {...shapeProps('addome')} />
        {/* Hips/pelvis (schiena zone visually) */}
        <rect x="77" y="158" width="46" height="12" rx="5" {...shapeProps('schiena')} />
        {/* L Upper arm */}
        <rect x="44" y="95" width="16" height="42" rx="6" {...shapeProps('braccio_sx')} />
        {/* R Upper arm */}
        <rect x="140" y="95" width="16" height="42" rx="6" {...shapeProps('braccio_dx')} />
        {/* L Thigh */}
        <rect x="76" y="165" width="22" height="85" rx="6" {...shapeProps('coscia_sx')} />
        {/* R Thigh */}
        <rect x="102" y="165" width="22" height="85" rx="6" {...shapeProps('coscia_dx')} />
        {/* L Knee */}
        <ellipse cx="84" cy="255" rx="13" ry="12" {...shapeProps('ginocchio_sx')} />
        {/* R Knee */}
        <ellipse cx="116" cy="255" rx="13" ry="12" {...shapeProps('ginocchio_dx')} />
        {/* L Calf */}
        <rect x="78" y="268" width="18" height="60" rx="6" {...shapeProps('polpaccio_sx')} />
        {/* R Calf */}
        <rect x="104" y="268" width="18" height="60" rx="6" {...shapeProps('polpaccio_dx')} />
        {/* L Foot */}
        <ellipse cx="83" cy="338" rx="16" ry="9" {...shapeProps('piede_sx')} />
        {/* R Foot */}
        <ellipse cx="117" cy="338" rx="16" ry="9" {...shapeProps('piede_dx')} />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        {[['0', '#e2e8f0'], ['1', '#fde68a'], ['2', '#fb923c'], ['3+', '#ef4444']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.label}: {tooltip.count} episodi
        </div>
      )}
    </div>
  )
}

export default function Injuries() {
  const allEpisodes = store.episodes.all()
  const injuries = allEpisodes.filter(e => e.type === 'infortunio')

  const [view, setView] = useState('lista') // 'lista' | 'mappa'
  const [filterArea, setFilterArea] = useState('')
  const [filterYear, setFilterYear] = useState('tutti')
  const [filterOutcome, setFilterOutcome] = useState('tutti')
  const [onlyRecurrent, setOnlyRecurrent] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)

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

  // Zone panel episodes
  const zoneObj = selectedZone ? ZONES.find(z => z.id === selectedZone) : null
  const zoneEpisodes = zoneObj ? injuries.filter(e => episodeMatchesZone(e, zoneObj)) : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Infortuni</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setView('lista')}
            className={`px-4 py-2 transition-colors ${view === 'lista' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Vista lista
          </button>
          <button
            onClick={() => setView('mappa')}
            className={`px-4 py-2 transition-colors ${view === 'mappa' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Vista mappa
          </button>
        </div>
      </div>

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

      {view === 'mappa' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Mappa corporea</h2>
          {injuries.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              Nessun infortunio registrato. Aggiungi episodi di tipo "infortunio" dalla sezione Timeline.
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <BodyMap injuries={injuries} onZoneClick={(id) => setSelectedZone(id === selectedZone ? null : id)} selectedZone={selectedZone} />
              </div>
              <div className="flex-1">
                {selectedZone ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{ZONES.find(z => z.id === selectedZone)?.label} — {zoneEpisodes.length} episodi</h3>
                      <button onClick={() => setSelectedZone(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    {zoneEpisodes.length === 0 ? (
                      <p className="text-sm text-gray-400">Nessun infortunio per questa zona.</p>
                    ) : (
                      <div className="space-y-3">
                        {zoneEpisodes.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || '')).map(e => (
                          <div key={e.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap size={13} className="text-red-500" />
                              <span className="font-medium text-gray-800 text-sm">{e.diagnosis || 'Infortunio'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLOR[e.outcome]}`}>{OUTCOME_LABEL[e.outcome]}</span>
                            </div>
                            <div className="text-xs text-gray-500">{e.start_date ? e.start_date.split('-').reverse().join('/') : '—'}{e.body_area ? ` · ${e.body_area}` : ''}</div>
                            {e.stop_days && <div className="text-xs text-gray-400 mt-1">Stop: {e.stop_days} giorni</div>}
                            {e.therapy && <div className="text-xs text-gray-400">Terapia: {e.therapy}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    <div className="text-center">
                      <div className="text-4xl mb-2">👆</div>
                      <p>Clicca su una zona del corpo<br />per vedere gli episodi associati</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
