import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import * as store from '../store'

const SEVERITY = ['lieve', 'moderata', 'grave']
const CONDITION_STATUS = ['active', 'risolto', 'monitorato']
const STATUS_LABEL = { active: 'Attiva', risolto: 'Risolta', monitorato: 'Monitorata' }
const STATUS_COLOR = { active: 'bg-red-100 text-red-700', risolto: 'bg-green-100 text-green-700', monitorato: 'bg-yellow-100 text-yellow-700' }

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

export default function Overview() {
  const [profile, setProfile] = useState(store.getProfile)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  const [allergyList, setAllergyList] = useState(store.allergies.all)
  const [medList, setMedList] = useState(store.medications.all)
  const [condList, setCondList] = useState(store.conditions.all)
  const [vaccList, setVaccList] = useState(store.vaccinations.all)

  const [newAllergy, setNewAllergy] = useState({ type: '', name: '', severity: 'lieve', notes: '' })
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', reason: '', notes: '' })
  const [newCond, setNewCond] = useState({ name: '', diagnosed_date: '', status: 'active', notes: '' })
  const [newVacc, setNewVacc] = useState({ name: '', date: '', next_date: '', notes: '' })

  const [showAllergyForm, setShowAllergyForm] = useState(false)
  const [showMedForm, setShowMedForm] = useState(false)
  const [showCondForm, setShowCondForm] = useState(false)
  const [showVaccForm, setShowVaccForm] = useState(false)

  const saveProfile = () => {
    store.saveProfile(draft)
    setProfile(draft)
    setEditing(false)
  }

  const addAllergy = () => {
    if (!newAllergy.name) return
    setAllergyList(store.allergies.add(newAllergy))
    setNewAllergy({ type: '', name: '', severity: 'lieve', notes: '' })
    setShowAllergyForm(false)
  }

  const addMed = () => {
    if (!newMed.name) return
    setMedList(store.medications.add(newMed))
    setNewMed({ name: '', dosage: '', frequency: '', reason: '', notes: '' })
    setShowMedForm(false)
  }

  const addCond = () => {
    if (!newCond.name) return
    setCondList(store.conditions.add(newCond))
    setNewCond({ name: '', diagnosed_date: '', status: 'active', notes: '' })
    setShowCondForm(false)
  }

  const addVacc = () => {
    if (!newVacc.name) return
    setVaccList(store.vaccinations.add(newVacc))
    setNewVacc({ name: '', date: '', next_date: '', notes: '' })
    setShowVaccForm(false)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Overview personale</h1>

      {/* Profilo */}
      <Card title="Profilo sanitario">
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            {[['Nome e cognome', 'name'], ['Data di nascita', 'birth_date'], ['Altezza (cm)', 'height'], ['Peso (kg)', 'weight'], ['Gruppo sanguigno', 'blood_type'], ['Medico di base', 'gp_name'], ['Contatto medico', 'gp_contact']].map(([label, key]) => (
              <Field key={key} label={label}>
                <input
                  className={input}
                  value={draft[key] || ''}
                  type={['height', 'weight'].includes(key) ? 'number' : key === 'birth_date' ? 'date' : 'text'}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              </Field>
            ))}
            <div className="col-span-2 flex gap-2 mt-2">
              <button onClick={saveProfile} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
                <Check size={14} className="inline mr-1" />Salva
              </button>
              <button onClick={() => { setEditing(false); setDraft(profile) }} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[['Nome', profile.name], ['Nascita', profile.birth_date], ['Altezza', profile.height ? `${profile.height} cm` : ''], ['Peso', profile.weight ? `${profile.weight} kg` : ''], ['Gruppo sanguigno', profile.blood_type], ['Medico di base', profile.gp_name], ['Contatto medico', profile.gp_contact]].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className="text-gray-700 font-medium">{val || <span className="text-gray-300">—</span>}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { setEditing(true); setDraft(profile) }} className={`${btn} mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              <Edit2 size={13} className="inline mr-1" />Modifica
            </button>
          </div>
        )}
      </Card>

      {/* Allergie */}
      <Card title="Allergie e intolleranze">
        {allergyList.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead><tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2">Tipo</th><th className="text-left pb-2">Nome</th><th className="text-left pb-2">Gravità</th><th className="text-left pb-2">Note</th><th />
            </tr></thead>
            <tbody>{allergyList.map(a => (
              <tr key={a.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-500">{a.type}</td>
                <td className="py-2 font-medium text-gray-700">{a.name}</td>
                <td className="py-2"><span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{a.severity}</span></td>
                <td className="py-2 text-gray-500">{a.notes}</td>
                <td className="py-2"><button onClick={() => setAllergyList(store.allergies.remove(a.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {showAllergyForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Tipo"><input className={input} placeholder="farmaco, alimento..." value={newAllergy.type} onChange={e => setNewAllergy({ ...newAllergy, type: e.target.value })} /></Field>
            <Field label="Nome *"><input className={input} placeholder="Penicillina, Glutine..." value={newAllergy.name} onChange={e => setNewAllergy({ ...newAllergy, name: e.target.value })} /></Field>
            <Field label="Gravità"><select className={input} value={newAllergy.severity} onChange={e => setNewAllergy({ ...newAllergy, severity: e.target.value })}>{SEVERITY.map(s => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Note"><input className={input} value={newAllergy.notes} onChange={e => setNewAllergy({ ...newAllergy, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2"><button onClick={addAllergy} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button><button onClick={() => setShowAllergyForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button></div>
          </div>
        ) : (
          <button onClick={() => setShowAllergyForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}><Plus size={14} className="inline mr-1" />Aggiungi allergia</button>
        )}
      </Card>

      {/* Farmaci attuali */}
      <Card title="Farmaci attuali">
        {medList.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead><tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2">Farmaco</th><th className="text-left pb-2">Dosaggio</th><th className="text-left pb-2">Frequenza</th><th className="text-left pb-2">Motivo</th><th />
            </tr></thead>
            <tbody>{medList.map(m => (
              <tr key={m.id} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-700">{m.name}</td>
                <td className="py-2 text-gray-500">{m.dosage}</td>
                <td className="py-2 text-gray-500">{m.frequency}</td>
                <td className="py-2 text-gray-500">{m.reason}</td>
                <td className="py-2"><button onClick={() => setMedList(store.medications.remove(m.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {showMedForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Farmaco *"><input className={input} value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} /></Field>
            <Field label="Dosaggio"><input className={input} placeholder="es. 500mg" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} /></Field>
            <Field label="Frequenza"><input className={input} placeholder="es. 2x al giorno" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} /></Field>
            <Field label="Motivo"><input className={input} value={newMed.reason} onChange={e => setNewMed({ ...newMed, reason: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2"><button onClick={addMed} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button><button onClick={() => setShowMedForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button></div>
          </div>
        ) : (
          <button onClick={() => setShowMedForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}><Plus size={14} className="inline mr-1" />Aggiungi farmaco</button>
        )}
      </Card>

      {/* Patologie */}
      <Card title="Patologie croniche">
        {condList.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead><tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2">Patologia</th><th className="text-left pb-2">Diagnosi</th><th className="text-left pb-2">Stato</th><th className="text-left pb-2">Note</th><th />
            </tr></thead>
            <tbody>{condList.map(c => (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-700">{c.name}</td>
                <td className="py-2 text-gray-500">{c.diagnosed_date}</td>
                <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                <td className="py-2 text-gray-500">{c.notes}</td>
                <td className="py-2"><button onClick={() => setCondList(store.conditions.remove(c.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {showCondForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Patologia *"><input className={input} value={newCond.name} onChange={e => setNewCond({ ...newCond, name: e.target.value })} /></Field>
            <Field label="Data diagnosi"><input type="date" className={input} value={newCond.diagnosed_date} onChange={e => setNewCond({ ...newCond, diagnosed_date: e.target.value })} /></Field>
            <Field label="Stato"><select className={input} value={newCond.status} onChange={e => setNewCond({ ...newCond, status: e.target.value })}>{CONDITION_STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
            <Field label="Note"><input className={input} value={newCond.notes} onChange={e => setNewCond({ ...newCond, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2"><button onClick={addCond} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button><button onClick={() => setShowCondForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button></div>
          </div>
        ) : (
          <button onClick={() => setShowCondForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}><Plus size={14} className="inline mr-1" />Aggiungi patologia</button>
        )}
      </Card>

      {/* Vaccinazioni */}
      <Card title="Vaccinazioni">
        {vaccList.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead><tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2">Vaccino</th><th className="text-left pb-2">Data</th><th className="text-left pb-2">Prossima dose</th><th className="text-left pb-2">Note</th><th />
            </tr></thead>
            <tbody>{vaccList.map(v => (
              <tr key={v.id} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-700">{v.name}</td>
                <td className="py-2 text-gray-500">{v.date}</td>
                <td className="py-2 text-gray-500">{v.next_date}</td>
                <td className="py-2 text-gray-500">{v.notes}</td>
                <td className="py-2"><button onClick={() => setVaccList(store.vaccinations.remove(v.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {showVaccForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Vaccino *"><input className={input} value={newVacc.name} onChange={e => setNewVacc({ ...newVacc, name: e.target.value })} /></Field>
            <Field label="Data"><input type="date" className={input} value={newVacc.date} onChange={e => setNewVacc({ ...newVacc, date: e.target.value })} /></Field>
            <Field label="Prossima dose"><input type="date" className={input} value={newVacc.next_date} onChange={e => setNewVacc({ ...newVacc, next_date: e.target.value })} /></Field>
            <Field label="Note"><input className={input} value={newVacc.notes} onChange={e => setNewVacc({ ...newVacc, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2"><button onClick={addVacc} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button><button onClick={() => setShowVaccForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button></div>
          </div>
        ) : (
          <button onClick={() => setShowVaccForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}><Plus size={14} className="inline mr-1" />Aggiungi vaccinazione</button>
        )}
      </Card>
    </div>
  )
}
