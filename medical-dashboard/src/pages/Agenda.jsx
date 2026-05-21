import React, { useState, useMemo } from 'react'
import { Plus, X, Check, Trash2, CalendarClock, AlertTriangle, Clock, CheckCircle2, Mail, Edit2 } from 'lucide-react'
import { remindersStore, vaccinations, conditions } from '../store'

const CATEGORIES = ['vaccino', 'controllo', 'farmaco', 'visita', 'esame', 'altro']
const CATEGORY_COLOR = {
  vaccino: 'bg-blue-100 text-blue-700',
  controllo: 'bg-purple-100 text-purple-700',
  farmaco: 'bg-rose-100 text-rose-700',
  visita: 'bg-teal-100 text-teal-700',
  esame: 'bg-amber-100 text-amber-700',
  altro: 'bg-gray-100 text-gray-600',
}

function daysDiff(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / (1000 * 60 * 60 * 24))
}

function urgencyOf(item) {
  if (item.done) return 'done'
  const diff = daysDiff(item.due_date)
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'week'
  if (diff <= 30) return 'month'
  return 'future'
}

const URGENCY_CONFIG = {
  overdue: { label: 'Scaduti', dot: 'bg-red-500', border: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  week: { label: 'Entro 7 giorni', dot: 'bg-orange-400', border: 'border-l-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  month: { label: 'Entro 30 giorni', dot: 'bg-yellow-400', border: 'border-l-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  future: { label: 'Futuri', dot: 'bg-green-500', border: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-600' },
  done: { label: 'Completati', dot: 'bg-gray-300', border: 'border-l-gray-300', bg: 'bg-gray-50', text: 'text-gray-400' },
}

function formatDue(dateStr, done) {
  if (!dateStr) return ''
  const diff = daysDiff(dateStr)
  if (done) return dateStr.split('-').reverse().join('/')
  if (diff === 0) return 'Oggi'
  if (diff === 1) return 'Domani'
  if (diff === -1) return 'Ieri'
  if (diff > 1) return `Tra ${diff} giorni`
  return `Scaduto ${Math.abs(diff)} giorni fa`
}

function ReminderModal({ onClose, onSave, initial }) {
  const today = new Date().toISOString().slice(0, 10)
  const isEdit = !!initial
  const [form, setForm] = useState(
    initial
      ? { title: initial.title, due_date: initial.due_date, category: initial.category, notes: initial.notes || '', email: initial.email || '' }
      : { title: '', due_date: today, category: 'controllo', notes: '', email: '' }
  )

  const handleSave = () => {
    if (!form.title || !form.due_date) return
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Modifica promemoria' : 'Aggiungi promemoria'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Titolo *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Es. Visita cardiologica"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data scadenza *</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoria</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3}
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email per notifica</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Email per notifica"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} className="flex-1 bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 transition-colors">Salva</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors">Annulla</button>
        </div>
      </div>
    </div>
  )
}

function ReminderItem({ item, onToggle, onDelete, onEdit, isAuto = false }) {
  const urgency = urgencyOf(item)
  const cfg = URGENCY_CONFIG[urgency]
  const [emailSent, setEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleSendEmail = async () => {
    if (!item.email) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: item.email,
          title: item.title,
          due_date: item.due_date,
          category: item.category,
          notes: item.notes || '',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setEmailSent(true)
      } else {
        alert(data.error || 'Errore nell\'invio email')
      }
    } catch {
      alert('Errore di rete nell\'invio email')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${cfg.bg} ${cfg.border} ${item.done ? 'opacity-60' : ''}`}>
      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.title}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLOR[item.category] || 'bg-gray-100 text-gray-600'}`}>
            {item.category}
          </span>
          {isAuto && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">auto</span>}
          {emailSent && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Inviata</span>
          )}
        </div>
        <div className={`text-xs mt-0.5 ${cfg.text}`}>{formatDue(item.due_date, item.done)}</div>
        {item.notes && <div className="text-xs text-gray-500 mt-1 truncate">{item.notes}</div>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isAuto && (
          <>
            {item.email && (
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || emailSent}
                className={`p-1 rounded transition-colors ${emailSent ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'} disabled:opacity-50`}
                title="Invia promemoria email"
              >
                <Mail size={14} />
              </button>
            )}
            <button
              onClick={() => onEdit(item)}
              className="p-1 rounded text-gray-300 hover:text-teal-500 transition-colors"
              title="Modifica promemoria"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onToggle(item.id)}
              className={`p-1 rounded transition-colors ${item.done ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-500'}`}
              title={item.done ? 'Segna come non fatto' : 'Segna come fatto'}
            >
              <Check size={15} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Agenda() {
  const [reminders, setReminders] = useState(() => remindersStore.all())
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const today = new Date().toISOString().slice(0, 10)

  // Auto-generated reminders from vaccinations
  const autoReminders = useMemo(() => {
    const vaccs = vaccinations.all()
    const conds = conditions.all()
    const list = []

    vaccs.forEach(v => {
      if (v.next_date) {
        list.push({
          id: `auto_vacc_${v.id}`,
          title: `Richiamo vaccino: ${v.name}`,
          due_date: v.next_date,
          category: 'vaccino',
          notes: v.notes || '',
          done: false,
        })
      }
    })

    conds.filter(c => c.status === 'active' && c.next_checkup).forEach(c => {
      list.push({
        id: `auto_cond_${c.id}`,
        title: `Controllo: ${c.name}`,
        due_date: c.next_checkup,
        category: 'controllo',
        notes: '',
        done: false,
      })
    })

    return list
  }, [])

  const handleSave = (form) => {
    setReminders(remindersStore.add({ ...form, done: false }))
  }

  const handleEdit = (item) => {
    setEditingItem(item)
  }

  const handleEditSave = (form) => {
    setReminders(remindersStore.update(editingItem.id, form))
    setEditingItem(null)
  }

  const handleToggle = (id) => {
    const item = reminders.find(r => r.id === id)
    if (!item) return
    setReminders(remindersStore.update(id, { done: !item.done }))
  }

  const handleDelete = (id) => {
    setReminders(remindersStore.remove(id))
  }

  // Stats
  const todayCount = reminders.filter(r => !r.done && r.due_date === today).length
  const weekCount = reminders.filter(r => !r.done && daysDiff(r.due_date) >= 0 && daysDiff(r.due_date) <= 7).length
  const overdueCount = reminders.filter(r => !r.done && daysDiff(r.due_date) < 0).length
  const doneCount = reminders.filter(r => r.done).length

  // Group by urgency
  const ORDER = ['overdue', 'week', 'month', 'future', 'done']
  const grouped = ORDER.reduce((acc, key) => {
    acc[key] = reminders.filter(r => urgencyOf(r) === key)
    return acc
  }, {})

  const activeAutoReminders = autoReminders.filter(r => daysDiff(r.due_date) >= -30)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Agenda sanitaria</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus size={16} />Aggiungi promemoria
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Scadono oggi', value: todayCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Entro 7 giorni', value: weekCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Scaduti', value: overdueCount, icon: CalendarClock, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Completati', value: doneCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon size={20} className={color} />
            <div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual reminders */}
      {reminders.length === 0 && autoReminders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CalendarClock size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nessun promemoria. Clicca "Aggiungi promemoria" per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {ORDER.map(urgency => {
            const items = grouped[urgency]
            if (items.length === 0) return null
            const cfg = URGENCY_CONFIG[urgency]
            return (
              <div key={urgency} className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className={`font-semibold text-sm uppercase tracking-wide mb-3 ${cfg.text}`}>
                  {cfg.label} ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.sort((a, b) => a.due_date.localeCompare(b.due_date)).map(item => (
                    <ReminderItem key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Auto reminders */}
      {activeAutoReminders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide mb-3 text-indigo-600">
            Promemoria automatici ({activeAutoReminders.length})
          </h2>
          <p className="text-xs text-gray-400 mb-3">Derivati da vaccinazioni e patologie attive — sola lettura</p>
          <div className="space-y-2">
            {activeAutoReminders.sort((a, b) => a.due_date.localeCompare(b.due_date)).map(item => (
              <ReminderItem key={item.id} item={item} onToggle={() => {}} onDelete={() => {}} onEdit={() => {}} isAuto />
            ))}
          </div>
        </div>
      )}

      {showModal && <ReminderModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      {editingItem && (
        <ReminderModal
          onClose={() => setEditingItem(null)}
          onSave={handleEditSave}
          initial={editingItem}
        />
      )}
    </div>
  )
}
