import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Check, Printer } from 'lucide-react'
import * as store from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function Patterns() {
  const episodes = store.episodes.all()
  const profile = store.getProfile()
  const allergyList = store.allergies.all()
  const medList = store.medications.all()
  const condList = store.conditions.all()
  const examList = store.exams.all()

  const [familyList, setFamilyList] = useState(store.family.all)
  const [lifestyle, setLifestyle] = useState(store.getLifestyle)
  const [editLifestyle, setEditLifestyle] = useState(false)
  const [lsDraft, setLsDraft] = useState(lifestyle)
  const [newFamily, setNewFamily] = useState({ relative: '', condition: '', age_at_diagnosis: '', notes: '' })
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [editFamilyId, setEditFamilyId] = useState(null)
  const [familyDraft, setFamilyDraft] = useState({})

  // Patterns computation
  const areaGroups = episodes.reduce((acc, e) => {
    const key = e.body_area || 'Non specificata'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const typeGroups = episodes.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {})

  const addFamily = () => {
    if (!newFamily.relative || !newFamily.condition) return
    setFamilyList(store.family.add(newFamily))
    setNewFamily({ relative: '', condition: '', age_at_diagnosis: '', notes: '' })
    setShowFamilyForm(false)
  }

  const startEditFamily = (f) => { setEditFamilyId(f.id); setFamilyDraft({ ...f }) }
  const saveFamily = () => {
    setFamilyList(store.family.update(editFamilyId, familyDraft))
    setEditFamilyId(null)
  }

  const saveLifestyle = () => {
    store.saveLifestyle(lsDraft)
    setLifestyle(lsDraft)
    setEditLifestyle(false)
  }

  const recentEpisodes = [...episodes].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || '')).slice(0, 5)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Pattern e Famiglia</h1>

      {/* Ricorrenze */}
      <Card title="Ricorrenze per zona del corpo">
        {Object.keys(areaGroups).length === 0 ? (
          <p className="text-sm text-gray-400">Nessun dato. Aggiungi episodi dalla sezione Timeline.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2">Zona</th><th className="text-left pb-2">N. episodi</th><th className="text-left pb-2">Periodi</th><th className="text-left pb-2">Tipi</th>
            </tr></thead>
            <tbody>
              {Object.entries(areaGroups).sort((a, b) => b[1].length - a[1].length).map(([area, eps]) => (
                <tr key={area} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-700">{area}</td>
                  <td className="py-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{eps.length}</span></td>
                  <td className="py-2 text-gray-500 text-xs">{[...new Set(eps.map(e => e.start_date?.slice(0, 4)).filter(Boolean))].join(', ')}</td>
                  <td className="py-2 text-gray-500 text-xs">{[...new Set(eps.map(e => e.type))].join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Distribuzione per tipo di episodio">
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeGroups).map(([type, count]) => (
            <div key={type} className="bg-gray-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <div className="text-xs text-gray-500 capitalize">{type}</div>
            </div>
          ))}
          {Object.keys(typeGroups).length === 0 && <p className="text-sm text-gray-400">Nessun dato.</p>}
        </div>
      </Card>

      {/* Storia familiare */}
      <Card title="Storia familiare">
        {familyList.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead><tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2">Familiare</th><th className="text-left pb-2">Patologia</th><th className="text-left pb-2">Età diagnosi</th><th className="text-left pb-2">Note</th><th />
            </tr></thead>
            <tbody>{familyList.map(f => (
              editFamilyId === f.id ? (
                <tr key={f.id} className="border-b border-gray-50 bg-blue-50/30">
                  <td className="py-1 pr-2"><input className={input} value={familyDraft.relative} onChange={e => setFamilyDraft({ ...familyDraft, relative: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input className={input} value={familyDraft.condition} onChange={e => setFamilyDraft({ ...familyDraft, condition: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input type="number" className={input} value={familyDraft.age_at_diagnosis} onChange={e => setFamilyDraft({ ...familyDraft, age_at_diagnosis: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input className={input} value={familyDraft.notes} onChange={e => setFamilyDraft({ ...familyDraft, notes: e.target.value })} /></td>
                  <td className="py-1"><button onClick={saveFamily} className="text-green-600 hover:text-green-800"><Check size={14} /></button></td>
                </tr>
              ) : (
                <tr key={f.id} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-700">{f.relative}</td>
                  <td className="py-2 text-gray-600">{f.condition}</td>
                  <td className="py-2 text-gray-500">{f.age_at_diagnosis}</td>
                  <td className="py-2 text-gray-500">{f.notes}</td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => startEditFamily(f)} className="text-gray-300 hover:text-blue-500"><Edit2 size={13} /></button>
                    <button onClick={() => setFamilyList(store.family.remove(f.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                  </td>
                </tr>
              )
            ))}</tbody>
          </table>
        )}
        {showFamilyForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Familiare *"><input className={input} placeholder="Padre, Madre, Nonno..." value={newFamily.relative} onChange={e => setNewFamily({ ...newFamily, relative: e.target.value })} /></Field>
            <Field label="Patologia *"><input className={input} value={newFamily.condition} onChange={e => setNewFamily({ ...newFamily, condition: e.target.value })} /></Field>
            <Field label="Età diagnosi"><input type="number" className={input} value={newFamily.age_at_diagnosis} onChange={e => setNewFamily({ ...newFamily, age_at_diagnosis: e.target.value })} /></Field>
            <Field label="Note"><input className={input} value={newFamily.notes} onChange={e => setNewFamily({ ...newFamily, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2"><button onClick={addFamily} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button><button onClick={() => setShowFamilyForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button></div>
          </div>
        ) : (
          <button onClick={() => setShowFamilyForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}><Plus size={14} className="inline mr-1" />Aggiungi familiare</button>
        )}
      </Card>

      {/* Stile di vita */}
      <Card title="Stile di vita">
        {editLifestyle ? (
          <div className="grid grid-cols-2 gap-3">
            {[['Sport (tipo)', 'sport_type'], ['Frequenza sport', 'sport_frequency'], ['Intensità sport', 'sport_intensity'], ['Tipo lavoro', 'work_type'], ['Ore sonno', 'sleep_hours'], ['Qualità sonno', 'sleep_quality'], ['Note alimentazione', 'diet_notes'], ['Alcol', 'alcohol'], ['Fumo', 'smoking'], ['Ore PC al giorno', 'pc_hours'], ['Note stress', 'stress_notes']].map(([label, key]) => (
              <Field key={key} label={label}>
                <input className={input} type={['sleep_hours', 'pc_hours'].includes(key) ? 'number' : 'text'} value={lsDraft[key] || ''} onChange={e => setLsDraft({ ...lsDraft, [key]: e.target.value })} />
              </Field>
            ))}
            <div className="col-span-2 flex gap-2 mt-2">
              <button onClick={saveLifestyle} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Salva</button>
              <button onClick={() => { setEditLifestyle(false); setLsDraft(lifestyle) }} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[['Sport', lifestyle.sport_type], ['Frequenza', lifestyle.sport_frequency], ['Intensità', lifestyle.sport_intensity], ['Lavoro', lifestyle.work_type], ['Ore sonno', lifestyle.sleep_hours], ['Qualità sonno', lifestyle.sleep_quality], ['Alimentazione', lifestyle.diet_notes], ['Alcol', lifestyle.alcohol], ['Fumo', lifestyle.smoking], ['Ore PC', lifestyle.pc_hours], ['Stress', lifestyle.stress_notes]].map(([label, val]) => (
                <div key={label}><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700">{val || <span className="text-gray-300">—</span>}</div></div>
              ))}
            </div>
            <button onClick={() => { setEditLifestyle(true); setLsDraft(lifestyle) }} className={`${btn} mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              <Edit2 size={13} className="inline mr-1" />Modifica
            </button>
          </div>
        )}
      </Card>

      {/* Sintesi per il medico */}
      <Card title="Sintesi da portare al medico">
        <div id="doctor-summary" className="text-sm space-y-4">
          <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
            <div><div className="text-xs text-gray-400">Paziente</div><div className="font-semibold">{profile.name || '—'}</div></div>
            <div><div className="text-xs text-gray-400">Nato il</div><div>{profile.birth_date || '—'}</div></div>
            <div><div className="text-xs text-gray-400">Gruppo sanguigno</div><div className="font-semibold text-red-600">{profile.blood_type || '—'}</div></div>
          </div>

          {allergyList.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-red-600 uppercase mb-1">Allergie</div>
              <div className="flex flex-wrap gap-1">{allergyList.map(a => <span key={a.id} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full">{a.name} ({a.severity})</span>)}</div>
            </div>
          )}

          {condList.filter(c => c.status === 'active').length > 0 && (
            <div>
              <div className="text-xs font-semibold text-orange-600 uppercase mb-1">Patologie attive</div>
              <div className="flex flex-wrap gap-1">{condList.filter(c => c.status === 'active').map(c => <span key={c.id} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">{c.name}</span>)}</div>
            </div>
          )}

          {medList.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-blue-600 uppercase mb-1">Farmaci attuali</div>
              <div className="space-y-0.5">{medList.map(m => <div key={m.id} className="text-gray-700">{m.name} {m.dosage} — {m.frequency}</div>)}</div>
            </div>
          )}

          {recentEpisodes.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Episodi recenti</div>
              <div className="space-y-1">{recentEpisodes.map(e => <div key={e.id} className="text-gray-700">{e.start_date} — <strong>{e.diagnosis || e.type}</strong> ({e.body_area}) — {e.outcome}</div>)}</div>
            </div>
          )}

          {familyList.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Anamnesi familiare</div>
              <div className="space-y-0.5">{familyList.map(f => <div key={f.id} className="text-gray-700">{f.relative}: {f.condition}{f.age_at_diagnosis ? ` (età ${f.age_at_diagnosis})` : ''}</div>)}</div>
            </div>
          )}
        </div>

        <button onClick={() => window.print()} className={`${btn} mt-4 bg-gray-800 text-white hover:bg-gray-900 no-print`}>
          <Printer size={14} className="inline mr-1" />Stampa sintesi
        </button>
      </Card>
    </div>
  )
}
