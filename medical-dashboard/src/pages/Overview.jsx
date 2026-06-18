import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import * as store from '../store'

const SEVERITY = ['lieve', 'moderata', 'grave']
const CONDITION_STATUS = ['active', 'risolto', 'monitorato']
const STATUS_LABEL = { active: 'Attiva', risolto: 'Risolta', monitorato: 'Monitorata' }
const STATUS_COLOR = {
  active: 'bg-red-100 text-red-700',
  risolto: 'bg-green-100 text-green-700',
  monitorato: 'bg-yellow-100 text-yellow-700',
}
const SEVERITY_COLOR = {
  lieve: 'bg-sky-100 text-sky-700',
  moderata: 'bg-orange-100 text-orange-700',
  grave: 'bg-red-100 text-red-700',
}

function Card({ title, accent, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 shadow-sm">
      <h2 className={`font-semibold text-sm uppercase tracking-wide mb-4 ${accent || 'text-gray-700'}`}>{title}</h2>
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

// ─── Inline edit form wrappers ────────────────────────────────────────────────

function AllergyEditForm({ item, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...item })
  const d = (field, val) => setDraft(p => ({ ...p, [field]: val }))
  return (
    <div className="grid grid-cols-2 gap-2 bg-blue-50/60 rounded-lg p-3 mt-1">
      <Field label="Tipo"><input className={input} placeholder="farmaco, alimento..." value={draft.type} onChange={e => d('type', e.target.value)} /></Field>
      <Field label="Nome *"><input className={input} value={draft.name} onChange={e => d('name', e.target.value)} /></Field>
      <Field label="Gravità">
        <select className={input} value={draft.severity} onChange={e => d('severity', e.target.value)}>
          {SEVERITY.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Note"><input className={input} value={draft.notes} onChange={e => d('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex gap-2">
        <button onClick={() => onSave(draft)} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}><Check size={13} className="inline mr-1" />Salva</button>
        <button onClick={onCancel} className={`${btn} bg-gray-200 text-gray-600 hover:bg-gray-300`}><X size={13} className="inline mr-1" />Annulla</button>
      </div>
    </div>
  )
}

function MedEditForm({ item, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...item })
  const d = (field, val) => setDraft(p => ({ ...p, [field]: val }))
  return (
    <div className="grid grid-cols-2 gap-2 bg-violet-50/60 rounded-lg p-3 mt-1">
      <Field label="Farmaco *"><input className={input} value={draft.name} onChange={e => d('name', e.target.value)} /></Field>
      <Field label="Dosaggio"><input className={input} placeholder="es. 500mg" value={draft.dosage} onChange={e => d('dosage', e.target.value)} /></Field>
      <Field label="Frequenza"><input className={input} placeholder="es. 2x al giorno" value={draft.frequency} onChange={e => d('frequency', e.target.value)} /></Field>
      <Field label="Motivo"><input className={input} value={draft.reason} onChange={e => d('reason', e.target.value)} /></Field>
      <Field label="Note" ><input className={input} value={draft.notes} onChange={e => d('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex gap-2">
        <button onClick={() => onSave(draft)} className={`${btn} bg-violet-600 text-white hover:bg-violet-700`}><Check size={13} className="inline mr-1" />Salva</button>
        <button onClick={onCancel} className={`${btn} bg-gray-200 text-gray-600 hover:bg-gray-300`}><X size={13} className="inline mr-1" />Annulla</button>
      </div>
    </div>
  )
}

function CondEditForm({ item, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...item })
  const d = (field, val) => setDraft(p => ({ ...p, [field]: val }))
  return (
    <div className="grid grid-cols-2 gap-2 bg-red-50/60 rounded-lg p-3 mt-1">
      <Field label="Patologia *"><input className={input} value={draft.name} onChange={e => d('name', e.target.value)} /></Field>
      <Field label="Data diagnosi"><input type="date" className={input} value={draft.diagnosed_date} onChange={e => d('diagnosed_date', e.target.value)} /></Field>
      <Field label="Stato">
        <select className={input} value={draft.status} onChange={e => d('status', e.target.value)}>
          {CONDITION_STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </Field>
      <Field label="Note"><input className={input} value={draft.notes} onChange={e => d('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex gap-2">
        <button onClick={() => onSave(draft)} className={`${btn} bg-red-600 text-white hover:bg-red-700`}><Check size={13} className="inline mr-1" />Salva</button>
        <button onClick={onCancel} className={`${btn} bg-gray-200 text-gray-600 hover:bg-gray-300`}><X size={13} className="inline mr-1" />Annulla</button>
      </div>
    </div>
  )
}

function VaccEditForm({ item, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...item })
  const d = (field, val) => setDraft(p => ({ ...p, [field]: val }))
  return (
    <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 rounded-lg p-3 mt-1">
      <Field label="Vaccino *"><input className={input} value={draft.name} onChange={e => d('name', e.target.value)} /></Field>
      <Field label="Data"><input type="date" className={input} value={draft.date} onChange={e => d('date', e.target.value)} /></Field>
      <Field label="Prossima dose"><input type="date" className={input} value={draft.next_date} onChange={e => d('next_date', e.target.value)} /></Field>
      <Field label="Note"><input className={input} value={draft.notes} onChange={e => d('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex gap-2">
        <button onClick={() => onSave(draft)} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}><Check size={13} className="inline mr-1" />Salva</button>
        <button onClick={onCancel} className={`${btn} bg-gray-200 text-gray-600 hover:bg-gray-300`}><X size={13} className="inline mr-1" />Annulla</button>
      </div>
    </div>
  )
}

// ─── Row components ────────────────────────────────────────────────────────────

function AllergyRow({ item, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const handleSave = (draft) => {
    if (!draft.name) return
    onUpdate(item.id, draft)
    setEditing(false)
  }
  return (
    <div className="rounded-lg border-l-4 border-l-orange-400 border border-gray-100 bg-white hover:shadow-md transition-shadow px-4 py-3 mb-2">
      {editing ? (
        <AllergyEditForm item={item} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {item.type && (
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">{item.type}</span>
            )}
            <span className="font-medium text-gray-800 text-sm truncate">{item.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLOR[item.severity] || 'bg-gray-100 text-gray-600'}`}>{item.severity}</span>
            {item.notes && <span className="text-xs text-gray-400 hidden sm:block">{item.notes}</span>}
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors ml-1"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function MedRow({ item, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const handleSave = (draft) => {
    if (!draft.name) return
    onUpdate(item.id, draft)
    setEditing(false)
  }
  return (
    <div className="rounded-lg border-l-4 border-l-violet-400 border border-gray-100 bg-white hover:shadow-md transition-shadow px-4 py-3 mb-2">
      {editing ? (
        <MedEditForm item={item} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium text-gray-800 text-sm">{item.name}</span>
            {item.dosage && <span className="text-xs text-gray-400">{item.dosage}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.frequency && (
              <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">{item.frequency}</span>
            )}
            {item.reason && <span className="text-xs text-gray-400 hidden sm:block">{item.reason}</span>}
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors ml-1"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function CondRow({ item, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const handleSave = (draft) => {
    if (!draft.name) return
    onUpdate(item.id, draft)
    setEditing(false)
  }
  return (
    <div className="rounded-lg border-l-4 border-l-red-400 border border-gray-100 bg-white hover:shadow-md transition-shadow px-4 py-3 mb-2">
      {editing ? (
        <CondEditForm item={item} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium text-gray-800 text-sm">{item.name}</span>
            {item.diagnosed_date && <span className="text-xs text-gray-400">dal {item.diagnosed_date}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[item.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[item.status]}</span>
            {item.notes && <span className="text-xs text-gray-400 hidden sm:block">{item.notes}</span>}
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors ml-1"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function VaccRow({ item, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const handleSave = (draft) => {
    if (!draft.name) return
    onUpdate(item.id, draft)
    setEditing(false)
  }
  const today = new Date().toISOString().slice(0, 10)
  const due = item.next_date && item.next_date < today
  return (
    <div className="rounded-lg border-l-4 border-l-emerald-400 border border-gray-100 bg-white hover:shadow-md transition-shadow px-4 py-3 mb-2">
      {editing ? (
        <VaccEditForm item={item} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium text-gray-800 text-sm">{item.name}</span>
            {item.date && <span className="text-xs text-gray-400">{item.date}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.next_date && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${due ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {due ? 'Scaduto' : `Prossima: ${item.next_date}`}
              </span>
            )}
            {item.notes && <span className="text-xs text-gray-400 hidden sm:block">{item.notes}</span>}
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors ml-1"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

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

  const updateAllergy = (id, data) => setAllergyList(store.allergies.update(id, data))
  const updateMed = (id, data) => setMedList(store.medications.update(id, data))
  const updateCond = (id, data) => setCondList(store.conditions.update(id, data))
  const updateVacc = (id, data) => setVaccList(store.vaccinations.update(id, data))

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
        <div className="mb-3">
          {allergyList.map(a => (
            <AllergyRow
              key={a.id}
              item={a}
              onDelete={() => setAllergyList(store.allergies.remove(a.id))}
              onUpdate={updateAllergy}
            />
          ))}
        </div>
        {showAllergyForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Tipo"><input className={input} placeholder="farmaco, alimento..." value={newAllergy.type} onChange={e => setNewAllergy({ ...newAllergy, type: e.target.value })} /></Field>
            <Field label="Nome *"><input className={input} placeholder="Penicillina, Glutine..." value={newAllergy.name} onChange={e => setNewAllergy({ ...newAllergy, name: e.target.value })} /></Field>
            <Field label="Gravità">
              <select className={input} value={newAllergy.severity} onChange={e => setNewAllergy({ ...newAllergy, severity: e.target.value })}>
                {SEVERITY.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Note"><input className={input} value={newAllergy.notes} onChange={e => setNewAllergy({ ...newAllergy, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2">
              <button onClick={addAllergy} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button>
              <button onClick={() => setShowAllergyForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAllergyForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}>
            <Plus size={14} className="inline mr-1" />Aggiungi allergia
          </button>
        )}
      </Card>

      {/* Farmaci attuali */}
      <Card title="Farmaci attuali">
        <div className="mb-3">
          {medList.map(m => (
            <MedRow
              key={m.id}
              item={m}
              onDelete={() => setMedList(store.medications.remove(m.id))}
              onUpdate={updateMed}
            />
          ))}
        </div>
        {showMedForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Farmaco *"><input className={input} value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} /></Field>
            <Field label="Dosaggio"><input className={input} placeholder="es. 500mg" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} /></Field>
            <Field label="Frequenza"><input className={input} placeholder="es. 2x al giorno" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} /></Field>
            <Field label="Motivo"><input className={input} value={newMed.reason} onChange={e => setNewMed({ ...newMed, reason: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2">
              <button onClick={addMed} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button>
              <button onClick={() => setShowMedForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowMedForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}>
            <Plus size={14} className="inline mr-1" />Aggiungi farmaco
          </button>
        )}
      </Card>

      {/* Patologie */}
      <Card title="Patologie croniche">
        <div className="mb-3">
          {condList.map(c => (
            <CondRow
              key={c.id}
              item={c}
              onDelete={() => setCondList(store.conditions.remove(c.id))}
              onUpdate={updateCond}
            />
          ))}
        </div>
        {showCondForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Patologia *"><input className={input} value={newCond.name} onChange={e => setNewCond({ ...newCond, name: e.target.value })} /></Field>
            <Field label="Data diagnosi"><input type="date" className={input} value={newCond.diagnosed_date} onChange={e => setNewCond({ ...newCond, diagnosed_date: e.target.value })} /></Field>
            <Field label="Stato">
              <select className={input} value={newCond.status} onChange={e => setNewCond({ ...newCond, status: e.target.value })}>
                {CONDITION_STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
            <Field label="Note"><input className={input} value={newCond.notes} onChange={e => setNewCond({ ...newCond, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2">
              <button onClick={addCond} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button>
              <button onClick={() => setShowCondForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCondForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}>
            <Plus size={14} className="inline mr-1" />Aggiungi patologia
          </button>
        )}
      </Card>

      {/* Vaccinazioni */}
      <Card title="Vaccinazioni">
        <div className="mb-3">
          {vaccList.map(v => (
            <VaccRow
              key={v.id}
              item={v}
              onDelete={() => setVaccList(store.vaccinations.remove(v.id))}
              onUpdate={updateVacc}
            />
          ))}
        </div>
        {showVaccForm ? (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
            <Field label="Vaccino *"><input className={input} value={newVacc.name} onChange={e => setNewVacc({ ...newVacc, name: e.target.value })} /></Field>
            <Field label="Data"><input type="date" className={input} value={newVacc.date} onChange={e => setNewVacc({ ...newVacc, date: e.target.value })} /></Field>
            <Field label="Prossima dose"><input type="date" className={input} value={newVacc.next_date} onChange={e => setNewVacc({ ...newVacc, next_date: e.target.value })} /></Field>
            <Field label="Note"><input className={input} value={newVacc.notes} onChange={e => setNewVacc({ ...newVacc, notes: e.target.value })} /></Field>
            <div className="col-span-2 flex gap-2">
              <button onClick={addVacc} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Aggiungi</button>
              <button onClick={() => setShowVaccForm(false)} className={`${btn} bg-gray-200 text-gray-600`}>Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowVaccForm(true)} className={`${btn} border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600`}>
            <Plus size={14} className="inline mr-1" />Aggiungi vaccinazione
          </button>
        )}
      </Card>
    </div>
  )
}
