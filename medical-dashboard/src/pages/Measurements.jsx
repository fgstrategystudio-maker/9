import React, { useState } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { measurementsStore } from '../store'

const METRIC_TYPES = [
  { id: 'pressione', label: 'Pressione', unit: 'mmHg', color: '#ef4444', hasSecondary: true, secondaryLabel: 'Diastolica', refMin: 60, refMax: 80, refMin2: 100, refMax2: 130 },
  { id: 'peso', label: 'Peso', unit: 'kg', color: '#6366f1', hasSecondary: false },
  { id: 'glicemia', label: 'Glicemia', unit: 'mg/dL', color: '#f59e0b', hasSecondary: false, refMin: 70, refMax: 100 },
  { id: 'colesterolo', label: 'Colesterolo', unit: 'mg/dL', color: '#8b5cf6', hasSecondary: false, refMin: 0, refMax: 200 },
  { id: 'frequenza_cardiaca', label: 'Freq. Cardiaca', unit: 'bpm', color: '#ec4899', hasSecondary: false, refMin: 60, refMax: 100 },
  { id: 'saturazione', label: 'Saturazione O₂', unit: '%', color: '#06b6d4', hasSecondary: false, refMin: 95, refMax: 100 },
  { id: 'temperatura', label: 'Temperatura', unit: '°C', color: '#10b981', hasSecondary: false, refMin: 36, refMax: 37.5 },
]

const METRIC_EMOJI = {
  pressione: '🩺',
  peso: '⚖️',
  glicemia: '🩸',
  colesterolo: '💊',
  frequenza_cardiaca: '❤️',
  saturazione: '🫁',
  temperatura: '🌡️',
}

function MiniLineChart({ data, color, width = 100, height = 40 }) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1="5" y1={height / 2} x2={width - 5} y2={height / 2}
          stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
      </svg>
    )
  }

  const vals = data.map(d => Number(d.value)).filter(v => !isNaN(v))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pad = 4

  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (Number(d.value) - min) / range) * (height - pad * 2)
    return [x, y]
  })

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} />
      ))}
    </svg>
  )
}

function FullLineChart({ data, color, unit, refMin, refMax, width = 500, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Nessun dato da visualizzare
      </div>
    )
  }

  const padL = 48, padR = 16, padT = 16, padB = 32

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const vals = sorted.map(d => Number(d.value)).filter(v => !isNaN(v))
  const allVals = refMin != null && refMax != null ? [...vals, refMin, refMax] : vals
  const rawMin = Math.min(...allVals)
  const rawMax = Math.max(...allVals)
  const margin = (rawMax - rawMin) * 0.1 || 5
  const yMin = rawMin - margin
  const yMax = rawMax + margin
  const yRange = yMax - yMin

  const chartW = width - padL - padR
  const chartH = height - padT - padB

  const toX = (i) => padL + (i / Math.max(sorted.length - 1, 1)) * chartW
  const toY = (v) => padT + (1 - (v - yMin) / yRange) * chartH

  const pts = sorted.map((d, i) => [toX(i), toY(Number(d.value))])
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

  // Y axis ticks
  const tickCount = 4
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (yRange * i) / tickCount)

  // X axis labels (max 6)
  const step = Math.ceil(sorted.length / 6)
  const xLabels = sorted.filter((_, i) => i % step === 0 || i === sorted.length - 1)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {/* Reference band */}
      {refMin != null && refMax != null && (
        <rect
          x={padL} y={toY(refMax)}
          width={chartW} height={toY(refMin) - toY(refMax)}
          fill={color} opacity="0.08"
        />
      )}

      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={toY(v)} x2={padL + chartW} y2={toY(v)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={padL - 4} y={toY(v)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#9ca3af">
            {v.toFixed(v % 1 === 0 ? 0 : 1)}
          </text>
        </g>
      ))}

      {/* Reference lines */}
      {refMin != null && (
        <line x1={padL} y1={toY(refMin)} x2={padL + chartW} y2={toY(refMin)} stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      )}
      {refMax != null && (
        <line x1={padL} y1={toY(refMax)} x2={padL + chartW} y2={toY(refMax)} stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      )}

      {/* Data line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {/* Data points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="white" stroke={color} strokeWidth="2" />
          <title>{sorted[i].date}: {sorted[i].value} {unit}</title>
        </g>
      ))}

      {/* X axis labels */}
      {xLabels.map((d, i) => {
        const idx = sorted.indexOf(d)
        return (
          <text key={i} x={toX(idx)} y={height - 8} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {d.date.slice(5).split('-').reverse().join('/')}
          </text>
        )
      })}

      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#d1d5db" strokeWidth="1" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#d1d5db" strokeWidth="1" />
    </svg>
  )
}

function AddModal({ onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ date: today, type: 'pressione', value: '', value2: '', notes: '' })

  const metric = METRIC_TYPES.find(m => m.id === form.type)

  const handleSave = () => {
    if (!form.value) return
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Aggiungi misurazione</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.type} onChange={e => setForm({ ...form, type: e.target.value, value: '', value2: '' })}>
              {METRIC_TYPES.map(m => <option key={m.id} value={m.id}>{m.label} ({m.unit})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {metric?.hasSecondary ? 'Sistolica' : 'Valore'} ({metric?.unit})
            </label>
            <input type="number" step="0.1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
          </div>
          {metric?.hasSecondary && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">{metric.secondaryLabel} ({metric.unit})</label>
              <input type="number" step="0.1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.value2} onChange={e => setForm({ ...form, value2: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-rose-700 transition-colors">Salva</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors">Annulla</button>
        </div>
      </div>
    </div>
  )
}

export default function Measurements() {
  const [measurements, setMeasurements] = useState(() => measurementsStore.all())
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('pressione')

  const handleSave = (form) => {
    setMeasurements(measurementsStore.add({
      type: form.type,
      date: form.date,
      value: parseFloat(form.value),
      value2: form.value2 ? parseFloat(form.value2) : null,
      notes: form.notes,
    }))
  }

  const handleDelete = (id) => {
    setMeasurements(measurementsStore.remove(id))
  }

  const getMetricData = (metricId) =>
    measurements
      .filter(m => m.type === metricId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)

  const getLastValue = (metricId) => {
    const data = measurements.filter(m => m.type === metricId).sort((a, b) => a.date.localeCompare(b.date))
    return data[data.length - 1] || null
  }

  const getTrend = (metricId) => {
    const data = measurements.filter(m => m.type === metricId).sort((a, b) => a.date.localeCompare(b.date))
    if (data.length < 2) return 0
    const diff = Number(data[data.length - 1].value) - Number(data[data.length - 2].value)
    return diff
  }

  const activeMetric = METRIC_TYPES.find(m => m.id === activeTab)
  const activeData = measurements.filter(m => m.type === activeTab).sort((a, b) => b.date.localeCompare(a.date))
  const activeChartData = [...activeData].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Misurazioni nel tempo</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
        >
          <Plus size={16} />Aggiungi misurazione
        </button>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {METRIC_TYPES.map(metric => {
          const last = getLastValue(metric.id)
          const trend = getTrend(metric.id)
          const miniData = getMetricData(metric.id)

          return (
            <button
              key={metric.id}
              onClick={() => setActiveTab(metric.id)}
              className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-md ${activeTab === metric.id ? 'border-2 shadow-md' : 'border-gray-200'}`}
              style={activeTab === metric.id ? { borderColor: metric.color } : {}}
            >
              <div className="text-lg mb-1">{METRIC_EMOJI[metric.id]}</div>
              <div className="text-xs text-gray-500 leading-tight mb-2">{metric.label}</div>
              {last ? (
                <>
                  <div className="font-bold text-gray-800 text-sm leading-tight">
                    {last.value}
                    {metric.hasSecondary && last.value2 ? `/${last.value2}` : ''}
                  </div>
                  <div className="text-xs text-gray-400">{metric.unit}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {trend > 0 ? <TrendingUp size={10} className="text-red-500" /> : trend < 0 ? <TrendingDown size={10} className="text-green-500" /> : <Minus size={10} className="text-gray-400" />}
                    <MiniLineChart data={miniData} color={metric.color} width={70} height={28} />
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-300 mt-2">Nessun dato</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail tab */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4" style={{ color: activeMetric.color }}>
          {METRIC_EMOJI[activeMetric.id]} {activeMetric.label}
        </h2>

        {/* Full chart */}
        <div className="mb-6">
          <FullLineChart
            data={activeChartData}
            color={activeMetric.color}
            unit={activeMetric.unit}
            refMin={activeMetric.refMin}
            refMax={activeMetric.refMax}
          />
        </div>

        {/* History table */}
        {activeData.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Nessuna misurazione registrata per {activeMetric.label}.<br />
            Clicca "Aggiungi misurazione" per iniziare.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="text-left pb-2">Data</th>
                <th className="text-left pb-2">
                  {activeMetric.hasSecondary ? 'Sistolica / Diastolica' : 'Valore'}
                </th>
                <th className="text-left pb-2">Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {activeData.map(m => (
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-600">{m.date.split('-').reverse().join('/')}</td>
                  <td className="py-2 font-semibold text-gray-800">
                    {m.value}
                    {activeMetric.hasSecondary && m.value2 != null ? `/${m.value2}` : ''}
                    <span className="text-xs text-gray-400 font-normal ml-1">{activeMetric.unit}</span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs">{m.notes || '—'}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDelete(m.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
