import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Printer } from 'lucide-react'
import { format, parseISO, differenceInYears } from 'date-fns'
import { getEpisodes, getFamily, createFamily, updateFamily, deleteFamily, getLifestyle, updateLifestyle, getProfile } from '../api.js'

const formatDate = (d) => { try { return d ? format(parseISO(d), 'dd/MM/yyyy') : '-' } catch { return d || '-' } }

const inputCls = (err) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function Patterns() {
  const [episodes, setEpisodes] = useState([])
  const [family, setFamily] = useState([])
  const [lifestyle, setLifestyle] = useState({})
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(true)

  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyForm, setFamilyForm] = useState({ relative: '', condition: '', age_at_diagnosis: '', notes: '' })
  const [editingFamily, setEditingFamily] = useState(null)
  const [familyErrors, setFamilyErrors] = useState({})

  const [lifestyleForm, setLifestyleForm] = useState({})
  const [savingLifestyle, setSavingLifestyle] = useState(false)

  useEffect(() => {
    Promise.all([getEpisodes(), getFamily(), getLifestyle(), getProfile()]).then(([eps, fam, ls, pr]) => {
      setEpisodes(eps)
      setFamily(fam)
      setLifestyle(ls)
      setLifestyleForm(ls)
      setProfile(pr.profile || {})
    }).finally(() => setLoading(false))
  }, [])

  // Patterns
  const areaCount = episodes.reduce((acc, e) => {
    if (e.body_area) acc[e.body_area] = (acc[e.body_area] || 0) + 1
    return acc
  }, {})
  const typeCount = episodes.reduce((acc, e) => {
    if (e.type) acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {})

  const handleAddFamily = async () => {
    const errs = {}
    if (!familyForm.relative) errs.relative = true
    if (!familyForm.condition) errs.condition = true
    if (Object.keys(errs).length) { setFamilyErrors(errs); return }
    const entry = await createFamily(familyForm)
    setFamily(f => [...f, entry])
    setFamilyForm({ relative: '', condition: '', age_at_diagnosis: '', notes: '' })
    setShowFamilyForm(false)
    setFamilyErrors({})
  }

  const handleUpdateFamily = async (id) => {
    const entry = await updateFamily(id, editingFamily)
    setFamily(f => f.map(x => x.id === id ? entry : x))
    setEditingFamily(null)
  }

  const handleDeleteFamily = async (id) => {
    await deleteFamily(id)
    setFamily(f => f.filter(x => x.id !== id))
  }

  const handleSaveLifestyle = async () => {
    setSavingLifestyle(true)
    try {
      const updated = await updateLifestyle(lifestyleForm)
      setLifestyle(updated)
    } finally {
      setSavingLifestyle(false)
    }
  }

  const age = profile.birth_date ? differenceInYears(new Date(), parseISO(profile.birth_date)) : null

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Caricamento...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pattern e Famiglia</h1>
        <p className="text-gray-500 mt-1">Ricorrenze, storia familiare e stile di vita</p>
      </div>

      {/* Patterns */}
      <SectionCard title="Ricorrenze e Pattern">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Per area corporea</h3>
            {Object.keys(areaCount).length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nessun dato disponibile</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Area</th><th className="pb-2 font-medium">Episodi</th>
                </tr></thead>
                <tbody>
                  {Object.entries(areaCount).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                    <tr key={area} className="border-b border-gray-50">
                      <td className="py-2 font-medium">{area}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(count / episodes.length) * 100}%` }} />
                          </div>
                          <span className="text-gray-600">{count}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Per tipo</h3>
            {Object.keys(typeCount).length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nessun dato disponibile</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Tipo</th><th className="pb-2 font-medium">Episodi</th>
                </tr></thead>
                <tbody>
                  {Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <tr key={type} className="border-b border-gray-50">
                      <td className="py-2 font-medium capitalize">{type}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${(count / episodes.length) * 100}%` }} />
                          </div>
                          <span className="text-gray-600">{count}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Family history */}
      <SectionCard title="Storia Familiare">
        {family.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Familiare</th><th className="pb-2 font-medium">Patologia</th>
              <th className="pb-2 font-medium">Età diagnosi</th><th className="pb-2 font-medium">Note</th><th></th>
            </tr></thead>
            <tbody>{family.map(f => (
              <tr key={f.id} className="border-b border-gray-50 last:border-0">
                {editingFamily?.id === f.id ? (
                  <>
                    <td className="py-2"><input value={editingFamily.relative} onChange={e => setEditingFamily(x => ({ ...x, relative: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2"><input value={editingFamily.condition} onChange={e => setEditingFamily(x => ({ ...x, condition: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2"><input type="number" value={editingFamily.age_at_diagnosis || ''} onChange={e => setEditingFamily(x => ({ ...x, age_at_diagnosis: e.target.value }))} className="w-20 px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2"><input value={editingFamily.notes || ''} onChange={e => setEditingFamily(x => ({ ...x, notes: e.target.value }))} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2 flex gap-1">
                      <button onClick={() => handleUpdateFamily(f.id)} className="p-1 text-green-600"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingFamily(null)} className="p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 font-medium">{f.relative}</td>
                    <td className="py-2">{f.condition}</td>
                    <td className="py-2 text-gray-600">{f.age_at_diagnosis || '-'}</td>
                    <td className="py-2 text-gray-500">{f.notes || '-'}</td>
                    <td className="py-2 flex gap-1">
                      <button onClick={() => setEditingFamily({ ...f })} className="p-1 text-gray-300 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteFamily(f.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="text-sm text-gray-400 italic mb-4">Nessuna storia familiare registrata</p>}
        {showFamilyForm ? (
          <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Familiare *</label>
              <input placeholder="es. Padre, Madre, Nonno..." value={familyForm.relative} onChange={e => setFamilyForm(f => ({ ...f, relative: e.target.value }))} className={inputCls(familyErrors.relative)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Patologia *</label>
              <input value={familyForm.condition} onChange={e => setFamilyForm(f => ({ ...f, condition: e.target.value }))} className={inputCls(familyErrors.condition)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Età alla diagnosi</label>
              <input type="number" value={familyForm.age_at_diagnosis} onChange={e => setFamilyForm(f => ({ ...f, age_at_diagnosis: e.target.value }))} className={inputCls(false)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Note</label>
              <input value={familyForm.notes} onChange={e => setFamilyForm(f => ({ ...f, notes: e.target.value }))} className={inputCls(false)} /></div>
            <div className="col-span-2 flex gap-2">
              <button onClick={handleAddFamily} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Aggiungi</button>
              <button onClick={() => { setShowFamilyForm(false); setFamilyErrors({}) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowFamilyForm(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Aggiungi</button>
        )}
      </SectionCard>

      {/* Lifestyle */}
      <SectionCard title="Stile di Vita">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">Tipo di sport</label>
            <input value={lifestyleForm.sport_type || ''} onChange={e => setLifestyleForm(f => ({ ...f, sport_type: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Frequenza sport</label>
            <input placeholder="es. 3 volte a settimana" value={lifestyleForm.sport_frequency || ''} onChange={e => setLifestyleForm(f => ({ ...f, sport_frequency: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Intensità sport</label>
            <select value={lifestyleForm.sport_intensity || ''} onChange={e => setLifestyleForm(f => ({ ...f, sport_intensity: e.target.value }))} className={inputCls(false)}>
              <option value="">-</option><option>Bassa</option><option>Media</option><option>Alta</option><option>Agonistica</option>
            </select></div>
          <div><label className="block text-xs text-gray-500 mb-1">Tipo di lavoro</label>
            <input placeholder="es. Sedentario, Manuale..." value={lifestyleForm.work_type || ''} onChange={e => setLifestyleForm(f => ({ ...f, work_type: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Ore di sonno</label>
            <input type="number" step="0.5" value={lifestyleForm.sleep_hours || ''} onChange={e => setLifestyleForm(f => ({ ...f, sleep_hours: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Qualità del sonno</label>
            <select value={lifestyleForm.sleep_quality || ''} onChange={e => setLifestyleForm(f => ({ ...f, sleep_quality: e.target.value }))} className={inputCls(false)}>
              <option value="">-</option><option>Scarsa</option><option>Discreta</option><option>Buona</option><option>Ottima</option>
            </select></div>
          <div><label className="block text-xs text-gray-500 mb-1">Alcol</label>
            <input placeholder="es. Occasionale, Nessuno..." value={lifestyleForm.alcohol || ''} onChange={e => setLifestyleForm(f => ({ ...f, alcohol: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Fumo</label>
            <input placeholder="es. Non fumatore, 10 sig/die..." value={lifestyleForm.smoking || ''} onChange={e => setLifestyleForm(f => ({ ...f, smoking: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Ore PC al giorno</label>
            <input type="number" step="0.5" value={lifestyleForm.pc_hours || ''} onChange={e => setLifestyleForm(f => ({ ...f, pc_hours: e.target.value }))} className={inputCls(false)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Stress</label>
            <input placeholder="Note sullo stress..." value={lifestyleForm.stress_notes || ''} onChange={e => setLifestyleForm(f => ({ ...f, stress_notes: e.target.value }))} className={inputCls(false)} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Note alimentazione</label>
            <textarea rows={2} value={lifestyleForm.diet_notes || ''} onChange={e => setLifestyleForm(f => ({ ...f, diet_notes: e.target.value }))} className={inputCls(false)} /></div>
          <div className="col-span-2">
            <button onClick={handleSaveLifestyle} disabled={savingLifestyle} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {savingLifestyle ? 'Salvataggio...' : 'Salva Stile di Vita'}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Doctor summary */}
      <SectionCard title="Sintesi per il Medico">
        <div className="print:block" id="doctor-summary">
          <div className="bg-gray-50 rounded-lg p-6 mb-4 print:p-0 print:bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{profile.name || 'Paziente'}</h3>
                {age && <p className="text-sm text-gray-600">{age} anni — Gruppo sanguigno: {profile.blood_type || 'n/d'}</p>}
                {profile.gp_name && <p className="text-sm text-gray-500">Medico di base: {profile.gp_name}</p>}
              </div>
              <button onClick={() => window.print()} className="print:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">
                <Printer className="w-4 h-4" /> Stampa
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Farmaci attuali</h4>
                {/* This would need medications_current data - simplified for now */}
                <p className="text-gray-500 italic text-xs">Vedere sezione Overview</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Ultimi episodi</h4>
                {episodes.slice(0, 5).map(ep => (
                  <div key={ep.id} className="mb-1 text-xs">
                    <span className="text-gray-500">{formatDate(ep.start_date)}</span> — <span className="font-medium">{ep.diagnosis}</span>
                  </div>
                ))}
                {episodes.length === 0 && <p className="text-gray-500 italic text-xs">Nessun episodio</p>}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Storia familiare</h4>
                {family.slice(0, 5).map(f => (
                  <div key={f.id} className="mb-1 text-xs">
                    <span className="font-medium">{f.relative}:</span> <span className="text-gray-600">{f.condition}</span>
                  </div>
                ))}
                {family.length === 0 && <p className="text-gray-500 italic text-xs">Nessun dato</p>}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Stile di vita</h4>
                <div className="text-xs text-gray-600 space-y-0.5">
                  {lifestyle.sport_type && <p>Sport: {lifestyle.sport_type} ({lifestyle.sport_frequency})</p>}
                  {lifestyle.sleep_hours && <p>Sonno: {lifestyle.sleep_hours}h/notte</p>}
                  {lifestyle.smoking && <p>Fumo: {lifestyle.smoking}</p>}
                  {lifestyle.alcohol && <p>Alcol: {lifestyle.alcohol}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
