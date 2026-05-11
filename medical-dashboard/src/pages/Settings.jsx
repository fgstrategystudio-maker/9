import React, { useState, useRef } from 'react'
import { Download, Upload, Trash2, Shield, Info, Eye, EyeOff, User, LogOut, KeyRound } from 'lucide-react'
import { clearSession, getPin, setPin } from '../lib/auth'
import { getSession } from '../lib/auth'

const btn = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors'
const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ---- Backup helpers ----
function exportData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('mcd_')) {
      try { data[k] = JSON.parse(localStorage.getItem(k)) }
      catch { data[k] = localStorage.getItem(k) }
    }
  }
  const blob = new Blob(
    [JSON.stringify({ version: 1, exported_at: new Date().toISOString(), data }, null, 2)],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cartella-clinica-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  localStorage.setItem('mcd_last_backup', new Date().toISOString())
}

function getStorageStats() {
  const sections = {
    'Episodi': 'mcd_episodes',
    'Allergie': 'mcd_allergies',
    'Farmaci': 'mcd_medications',
    'Patologie': 'mcd_conditions',
    'Vaccinazioni': 'mcd_vaccinations',
    'Documenti': 'mcd_exams',
    'Misurazioni': 'mcd_measurements',
    'Promemoria': 'mcd_reminders',
    'Diario': 'mcd_diary',
    'Medici': 'mcd_doctors',
    'Screening': 'mcd_screening',
    'Famiglia': 'mcd_family',
  }
  return Object.entries(sections).map(([label, key]) => {
    try {
      const data = JSON.parse(localStorage.getItem(key))
      return { label, count: Array.isArray(data) ? data.length : (data ? 1 : 0) }
    } catch {
      return { label, count: 0 }
    }
  }).filter(s => s.count > 0)
}

// ---- PIN input with show/hide ----
function PinInput({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          className={input}
          type={show ? 'text' : 'password'}
          maxLength={4}
          pattern="[0-9]*"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

// ---- Account section (Supabase-based) ----
function AccountSection({ onLogout }) {
  const session = getSession()
  const [changingPin, setChangingPin] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setCurrentPin(''); setNewPin(''); setConfirmPin(''); setError(''); setChangingPin(false)
  }

  const handleChangePin = async () => {
    if (currentPin.length !== 4) { setError('Inserisci il PIN attuale (4 cifre)'); return }
    if (newPin.length !== 4) { setError('Il nuovo PIN deve essere di 4 cifre'); return }
    if (newPin !== confirmPin) { setError('I nuovi PIN non coincidono'); return }
    setLoading(true)
    setError('')
    try {
      const stored = await getPin(session.userId)
      if (stored !== currentPin) { setError('PIN attuale non corretto'); setLoading(false); return }
      await setPin(session.userId, newPin)
      setSuccess('PIN aggiornato con successo')
      setTimeout(() => { setSuccess(''); resetForm() }, 2000)
    } catch {
      setError('Errore durante l\'aggiornamento del PIN')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      clearSession()
      if (onLogout) { onLogout() } else { window.location.reload() }
    }
  }

  if (!session) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-5 flex items-center gap-2">
        <User size={15} className="text-gray-400" /> Account
      </h2>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg">
          {session.userName?.[0] ?? '?'}
        </div>
        <div>
          <div className="font-semibold text-gray-800">{session.userName}</div>
          <div className="text-xs text-gray-400">ID: {session.userId}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {!changingPin && (
          <button
            onClick={() => setChangingPin(true)}
            className={`${btn} bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-1.5`}
          >
            <KeyRound size={15} /> Cambia PIN
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5`}
        >
          <LogOut size={15} /> Esci dall'account
        </button>
      </div>

      {changingPin && (
        <div className="bg-violet-50 rounded-xl p-4 space-y-3">
          <PinInput label="PIN attuale" value={currentPin} onChange={setCurrentPin} />
          <PinInput label="Nuovo PIN (4 cifre)" value={newPin} onChange={setNewPin} />
          <PinInput label="Conferma nuovo PIN" value={confirmPin} onChange={setConfirmPin} />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <div className="flex gap-2">
            <button
              onClick={handleChangePin}
              disabled={loading}
              className={`${btn} bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50`}
            >
              {loading ? 'Salvataggio…' : 'Aggiorna PIN'}
            </button>
            <button onClick={resetForm} className={`${btn} bg-gray-200 text-gray-700`}>Annulla</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Settings({ onLogout }) {
  const fileRef = useRef()
  const [importMsg, setImportMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [toast, setToast] = useState('')

  const stats = getStorageStats()
  const lastBackup = localStorage.getItem('mcd_last_backup')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleExport = () => {
    exportData()
    showToast('Backup scaricato con successo')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        if (!json.version) { setImportMsg('File non valido: campo version mancante'); return }
        Object.entries(json.data || {}).forEach(([k, v]) => {
          localStorage.setItem(k, JSON.stringify(v))
        })
        showToast('Dati ripristinati con successo')
        setTimeout(() => window.location.reload(), 1200)
      } catch {
        setImportMsg('Errore nella lettura del file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleDeleteAll = () => {
    if (deleteConfirm !== 'CANCELLA') { setDeleteError('Scrivi CANCELLA per confermare'); return }
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('mcd_')) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <div className="max-w-2xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-800 mb-8">Impostazioni</h1>

      {/* Section 0: Account (Supabase multi-user) */}
      <AccountSection onLogout={onLogout} />

      {/* Section A: Backup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-5 flex items-center gap-2">
          <Download size={15} className="text-gray-400" /> Backup e Dati
        </h2>

        {/* Storage stats */}
        {stats.length > 0 && (
          <div className="mb-5">
            <div className="text-xs text-gray-500 mb-2 font-medium">Dati salvati nel browser</div>
            <div className="flex flex-wrap gap-2">
              {stats.map(s => (
                <span key={s.label} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                  {s.label}: <strong>{s.count}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {lastBackup && (
          <div className="text-xs text-gray-400 mb-4">
            Ultimo backup: {new Date(lastBackup).toLocaleString('it-IT')}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className={`${btn} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2`}
          >
            <Download size={15} /> Esporta tutti i dati (JSON)
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2`}
          >
            <Upload size={15} /> Importa dati da backup
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {importMsg && <div className="mt-3 text-red-500 text-sm">{importMsg}</div>}

        {/* Delete all */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="text-sm font-medium text-red-600 mb-2">Zona pericolosa</div>
          <div className="text-xs text-gray-500 mb-3">
            Elimina permanentemente tutti i dati salvati nel browser. Questa azione non è reversibile.
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 w-48"
              placeholder="Scrivi CANCELLA"
              value={deleteConfirm}
              onChange={e => { setDeleteConfirm(e.target.value); setDeleteError('') }}
            />
            <button
              onClick={handleDeleteAll}
              className={`${btn} bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5`}
            >
              <Trash2 size={14} /> Cancella tutti i dati
            </button>
          </div>
          {deleteError && <div className="text-red-500 text-sm mt-1">{deleteError}</div>}
        </div>
      </div>

      {/* Section B: Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
          <Info size={15} className="text-gray-400" /> Informazioni
        </h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div><span className="text-gray-400">Versione app:</span> 1.0.0</div>
          <div><span className="text-gray-400">Tecnologie:</span> React 18, Vite, Tailwind CSS v3, Supabase</div>
          <div><span className="text-gray-400">Archiviazione:</span> localStorage + Supabase cloud sync</div>
          {lastBackup && (
            <div><span className="text-gray-400">Ultimo backup:</span> {new Date(lastBackup).toLocaleString('it-IT')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
