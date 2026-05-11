import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, User, Pill, AlertTriangle, Shield, Syringe } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  getProfile, updateProfile,
  addAllergy, deleteAllergy,
  addMedication, deleteMedication,
  addCondition, updateCondition, deleteCondition,
  addVaccination, deleteVaccination
} from '../api.js'

const formatDate = (d) => { try { return d ? format(parseISO(d), 'dd/MM/yyyy') : '-' } catch { return d || '-' } }

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Icon className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function EmptyState({ message }) {
  return <p className="text-sm text-gray-400 italic text-center py-4">{message}</p>
}

export default function Overview() {
  const [data, setData] = useState({ profile: {}, allergies: [], medications_current: [], conditions: [], vaccinations: [] })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [errors, setErrors] = useState({})

  // Forms for adding
  const [showAllergyForm, setShowAllergyForm] = useState(false)
  const [allergyForm, setAllergyForm] = useState({ type: '', name: '', severity: '', notes: '' })
  const [showMedForm, setShowMedForm] = useState(false)
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', reason: '', notes: '' })
  const [showCondForm, setShowCondForm] = useState(false)
  const [condForm, setCondForm] = useState({ name: '', diagnosed_date: '', status: 'active', notes: '' })
  const [editingCond, setEditingCond] = useState(null)
  const [showVaxForm, setShowVaxForm] = useState(false)
  const [vaxForm, setVaxForm] = useState({ name: '', date: '', next_date: '', notes: '' })

  useEffect(() => {
    getProfile().then(d => {
      setData(d)
      setProfileForm(d.profile || {})
    }).finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    const errs = {}
    if (!profileForm.name) errs.name = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const updated = await updateProfile(profileForm)
    setData(d => ({ ...d, profile: updated }))
    setEditing(false)
    setErrors({})
  }

  const handleAddAllergy = async () => {
    const errs = {}
    if (!allergyForm.name) errs.name = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const allergy = await addAllergy(allergyForm)
    setData(d => ({ ...d, allergies: [...d.allergies, allergy] }))
    setAllergyForm({ type: '', name: '', severity: '', notes: '' })
    setShowAllergyForm(false)
    setErrors({})
  }

  const handleDeleteAllergy = async (id) => {
    await deleteAllergy(id)
    setData(d => ({ ...d, allergies: d.allergies.filter(a => a.id !== id) }))
  }

  const handleAddMed = async () => {
    const errs = {}
    if (!medForm.name) errs.medName = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const med = await addMedication(medForm)
    setData(d => ({ ...d, medications_current: [...d.medications_current, med] }))
    setMedForm({ name: '', dosage: '', frequency: '', reason: '', notes: '' })
    setShowMedForm(false)
    setErrors({})
  }

  const handleDeleteMed = async (id) => {
    await deleteMedication(id)
    setData(d => ({ ...d, medications_current: d.medications_current.filter(m => m.id !== id) }))
  }

  const handleAddCond = async () => {
    const errs = {}
    if (!condForm.name) errs.condName = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const cond = await addCondition(condForm)
    setData(d => ({ ...d, conditions: [...d.conditions, cond] }))
    setCondForm({ name: '', diagnosed_date: '', status: 'active', notes: '' })
    setShowCondForm(false)
    setErrors({})
  }

  const handleUpdateCond = async (id) => {
    const cond = await updateCondition(id, editingCond)
    setData(d => ({ ...d, conditions: d.conditions.map(c => c.id === id ? cond : c) }))
    setEditingCond(null)
  }

  const handleDeleteCond = async (id) => {
    await deleteCondition(id)
    setData(d => ({ ...d, conditions: d.conditions.filter(c => c.id !== id) }))
  }

  const handleAddVax = async () => {
    const errs = {}
    if (!vaxForm.name) errs.vaxName = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const vax = await addVaccination(vaxForm)
    setData(d => ({ ...d, vaccinations: [...d.vaccinations, vax] }))
    setVaxForm({ name: '', date: '', next_date: '', notes: '' })
    setShowVaxForm(false)
    setErrors({})
  }

  const handleDeleteVax = async (id) => {
    await deleteVaccination(id)
    setData(d => ({ ...d, vaccinations: d.vaccinations.filter(v => v.id !== id) }))
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Caricamento...</div>

  const inputCls = (err) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panoramica</h1>
        <p className="text-gray-500 mt-1">La tua cartella clinica personale</p>
      </div>

      {/* Profile */}
      <SectionCard title="Profilo Personale" icon={User}>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Nome completo *</label>
              <input value={profileForm.name || ''} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className={inputCls(errors.name)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Data di nascita</label>
              <input type="date" value={profileForm.birth_date || ''} onChange={e => setProfileForm(f => ({ ...f, birth_date: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Altezza (cm)</label>
              <input type="number" value={profileForm.height || ''} onChange={e => setProfileForm(f => ({ ...f, height: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
              <input type="number" value={profileForm.weight || ''} onChange={e => setProfileForm(f => ({ ...f, weight: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Gruppo sanguigno</label>
              <select value={profileForm.blood_type || ''} onChange={e => setProfileForm(f => ({ ...f, blood_type: e.target.value }))} className={inputCls(false)}>
                <option value="">-</option>
                {['A+','A-','B+','B-','AB+','AB-','0+','0-'].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Medico di base</label>
              <input value={profileForm.gp_name || ''} onChange={e => setProfileForm(f => ({ ...f, gp_name: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Contatto medico</label>
              <input value={profileForm.gp_contact || ''} onChange={e => setProfileForm(f => ({ ...f, gp_contact: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2 flex gap-2">
              <button onClick={saveProfile} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Save className="w-4 h-4" /> Salva</button>
              <button onClick={() => { setEditing(false); setErrors({}) }} className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><X className="w-4 h-4" /> Annulla</button>
            </div>
          </div>
        ) : (
          <div>
            {data.profile?.name ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-400">Nome:</span> <span className="font-medium">{data.profile.name}</span></div>
                <div><span className="text-gray-400">Nascita:</span> <span className="font-medium">{formatDate(data.profile.birth_date)}</span></div>
                <div><span className="text-gray-400">Gruppo:</span> <span className="font-medium text-red-600">{data.profile.blood_type || '-'}</span></div>
                <div><span className="text-gray-400">Altezza:</span> <span className="font-medium">{data.profile.height ? `${data.profile.height} cm` : '-'}</span></div>
                <div><span className="text-gray-400">Peso:</span> <span className="font-medium">{data.profile.weight ? `${data.profile.weight} kg` : '-'}</span></div>
                <div><span className="text-gray-400">Medico:</span> <span className="font-medium">{data.profile.gp_name || '-'}</span></div>
                {data.profile.gp_contact && <div className="col-span-3"><span className="text-gray-400">Contatto medico:</span> <span className="font-medium">{data.profile.gp_contact}</span></div>}
              </div>
            ) : (
              <EmptyState message="Nessun profilo compilato" />
            )}
            <button onClick={() => setEditing(true)} className="mt-4 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><Edit2 className="w-3.5 h-3.5" /> Modifica</button>
          </div>
        )}
      </SectionCard>

      {/* Allergies */}
      <SectionCard title="Allergie" icon={AlertTriangle}>
        {data.allergies.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Tipo</th><th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">Gravità</th><th className="pb-2 font-medium">Note</th><th></th>
            </tr></thead>
            <tbody>{data.allergies.map(a => (
              <tr key={a.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-600">{a.type || '-'}</td>
                <td className="py-2 font-medium">{a.name}</td>
                <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${a.severity === 'grave' ? 'bg-red-100 text-red-700' : a.severity === 'moderata' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{a.severity || '-'}</span></td>
                <td className="py-2 text-gray-500">{a.notes || '-'}</td>
                <td className="py-2"><button onClick={() => handleDeleteAllergy(a.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <EmptyState message="Nessuna allergia registrata" />}
        {showAllergyForm ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <input placeholder="es. Farmaci, Alimentare" value={allergyForm.type} onChange={e => setAllergyForm(f => ({ ...f, type: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Nome *</label>
              <input placeholder="es. Penicillina" value={allergyForm.name} onChange={e => setAllergyForm(f => ({ ...f, name: e.target.value }))} className={inputCls(errors.name)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Gravità</label>
              <select value={allergyForm.severity} onChange={e => setAllergyForm(f => ({ ...f, severity: e.target.value }))} className={inputCls(false)}>
                <option value="">-</option><option value="lieve">Lieve</option><option value="moderata">Moderata</option><option value="grave">Grave</option>
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Note</label>
              <input value={allergyForm.notes} onChange={e => setAllergyForm(f => ({ ...f, notes: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2 flex gap-2">
              <button onClick={handleAddAllergy} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Aggiungi</button>
              <button onClick={() => { setShowAllergyForm(false); setErrors({}) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAllergyForm(true)} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Aggiungi allergia</button>
        )}
      </SectionCard>

      {/* Current medications */}
      <SectionCard title="Farmaci Attuali" icon={Pill}>
        {data.medications_current.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Nome</th><th className="pb-2 font-medium">Dosaggio</th>
              <th className="pb-2 font-medium">Frequenza</th><th className="pb-2 font-medium">Motivo</th><th></th>
            </tr></thead>
            <tbody>{data.medications_current.map(m => (
              <tr key={m.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium">{m.name}</td>
                <td className="py-2 text-gray-600">{m.dosage || '-'}</td>
                <td className="py-2 text-gray-600">{m.frequency || '-'}</td>
                <td className="py-2 text-gray-500">{m.reason || '-'}</td>
                <td className="py-2"><button onClick={() => handleDeleteMed(m.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <EmptyState message="Nessun farmaco attuale" />}
        {showMedForm ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Nome *</label>
              <input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} className={inputCls(errors.medName)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Dosaggio</label>
              <input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Frequenza</label>
              <input placeholder="es. 1 volta al giorno" value={medForm.frequency} onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Motivo</label>
              <input value={medForm.reason} onChange={e => setMedForm(f => ({ ...f, reason: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2 flex gap-2">
              <button onClick={handleAddMed} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Aggiungi</button>
              <button onClick={() => { setShowMedForm(false); setErrors({}) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowMedForm(true)} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Aggiungi farmaco</button>
        )}
      </SectionCard>

      {/* Chronic conditions */}
      <SectionCard title="Patologie Croniche" icon={Shield}>
        {data.conditions.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Nome</th><th className="pb-2 font-medium">Diagnosi</th>
              <th className="pb-2 font-medium">Stato</th><th className="pb-2 font-medium">Note</th><th></th>
            </tr></thead>
            <tbody>{data.conditions.map(c => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0">
                {editingCond?.id === c.id ? (
                  <>
                    <td className="py-2"><input value={editingCond.name} onChange={e => setEditingCond(f => ({ ...f, name: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2"><input type="date" value={editingCond.diagnosed_date || ''} onChange={e => setEditingCond(f => ({ ...f, diagnosed_date: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2"><select value={editingCond.status} onChange={e => setEditingCond(f => ({ ...f, status: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm">
                      <option value="active">Attiva</option><option value="risolto">Risolta</option><option value="monitorato">Monitorata</option>
                    </select></td>
                    <td className="py-2"><input value={editingCond.notes || ''} onChange={e => setEditingCond(f => ({ ...f, notes: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2 flex gap-1">
                      <button onClick={() => handleUpdateCond(c.id)} className="p-1 text-green-600 hover:text-green-700"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingCond(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-gray-600">{formatDate(c.diagnosed_date)}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'active' ? 'bg-yellow-100 text-yellow-700' : c.status === 'risolto' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{c.status === 'active' ? 'Attiva' : c.status === 'risolto' ? 'Risolta' : 'Monitorata'}</span></td>
                    <td className="py-2 text-gray-500">{c.notes || '-'}</td>
                    <td className="py-2 flex gap-1">
                      <button onClick={() => setEditingCond({ ...c })} className="p-1 text-gray-300 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCond(c.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}</tbody>
          </table>
        ) : <EmptyState message="Nessuna patologia cronica" />}
        {showCondForm ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Nome *</label>
              <input value={condForm.name} onChange={e => setCondForm(f => ({ ...f, name: e.target.value }))} className={inputCls(errors.condName)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Data diagnosi</label>
              <input type="date" value={condForm.diagnosed_date} onChange={e => setCondForm(f => ({ ...f, diagnosed_date: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Stato</label>
              <select value={condForm.status} onChange={e => setCondForm(f => ({ ...f, status: e.target.value }))} className={inputCls(false)}>
                <option value="active">Attiva</option><option value="risolto">Risolta</option><option value="monitorato">Monitorata</option>
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Note</label>
              <input value={condForm.notes} onChange={e => setCondForm(f => ({ ...f, notes: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2 flex gap-2">
              <button onClick={handleAddCond} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Aggiungi</button>
              <button onClick={() => { setShowCondForm(false); setErrors({}) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCondForm(true)} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Aggiungi patologia</button>
        )}
      </SectionCard>

      {/* Vaccinations */}
      <SectionCard title="Vaccinazioni" icon={Syringe}>
        {data.vaccinations.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Vaccino</th><th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Prossima dose</th><th className="pb-2 font-medium">Note</th><th></th>
            </tr></thead>
            <tbody>{data.vaccinations.map(v => (
              <tr key={v.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium">{v.name}</td>
                <td className="py-2 text-gray-600">{formatDate(v.date)}</td>
                <td className="py-2 text-gray-600">{formatDate(v.next_date)}</td>
                <td className="py-2 text-gray-500">{v.notes || '-'}</td>
                <td className="py-2"><button onClick={() => handleDeleteVax(v.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <EmptyState message="Nessuna vaccinazione registrata" />}
        {showVaxForm ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Vaccino *</label>
              <input value={vaxForm.name} onChange={e => setVaxForm(f => ({ ...f, name: e.target.value }))} className={inputCls(errors.vaxName)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Data</label>
              <input type="date" value={vaxForm.date} onChange={e => setVaxForm(f => ({ ...f, date: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Prossima dose</label>
              <input type="date" value={vaxForm.next_date} onChange={e => setVaxForm(f => ({ ...f, next_date: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Note</label>
              <input value={vaxForm.notes} onChange={e => setVaxForm(f => ({ ...f, notes: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2 flex gap-2">
              <button onClick={handleAddVax} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Aggiungi</button>
              <button onClick={() => { setShowVaxForm(false); setErrors({}) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowVaxForm(true)} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Aggiungi vaccinazione</button>
        )}
      </SectionCard>
    </div>
  )
}
