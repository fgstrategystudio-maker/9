import React, { useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Heart, Home, Activity, Zap, FileText, TrendingUp, BarChart2, CalendarClock, BookOpen, Stethoscope, ShieldCheck, Settings, Download, Upload, LogOut, AlertCircle } from 'lucide-react'

const nav = [
  { to: '/', icon: Home, label: 'Overview', color: 'text-sky-300' },
  { to: '/timeline', icon: Activity, label: 'Timeline episodi', color: 'text-violet-300' },
  { to: '/infortuni', icon: Zap, label: 'Infortuni', color: 'text-red-300' },
  { to: '/documenti', icon: FileText, label: 'Documenti', color: 'text-emerald-300' },
  { to: '/watchlist', icon: AlertCircle, label: 'Sintomi da monitorare', color: 'text-yellow-300' },
  { to: '/pattern', icon: TrendingUp, label: 'Pattern e Famiglia', color: 'text-amber-300' },
  { to: '/misurazioni', icon: BarChart2, label: 'Misurazioni', color: 'text-rose-300' },
  { to: '/agenda', icon: CalendarClock, label: 'Agenda sanitaria', color: 'text-teal-300' },
  { to: '/diario', icon: BookOpen, label: 'Diario sintomi', color: 'text-pink-300' },
  { to: '/medici', icon: Stethoscope, label: 'Medici', color: 'text-cyan-300' },
  { to: '/screening', icon: ShieldCheck, label: 'Screening', color: 'text-lime-300' },
  { to: '/impostazioni', icon: Settings, label: 'Impostazioni', color: 'text-slate-300' },
]

// Colors matching LoginScreen
const USER_COLORS = {
  anna:      'from-rose-400 to-pink-600',
  nando:     'from-blue-400 to-blue-600',
  francesco: 'from-violet-400 to-violet-600',
  federica:  'from-emerald-400 to-emerald-600',
}

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

export default function Layout({ children, session, onLogout }) {
  const importRef = useRef()

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        if (!json.version) { alert('File non valido'); return }
        Object.entries(json.data || {}).forEach(([k, v]) => {
          localStorage.setItem(k, JSON.stringify(v))
        })
        window.location.reload()
      } catch { alert('Errore nella lettura del file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      onLogout?.()
    }
  }

  const userColor = session?.userId ? (USER_COLORS[session.userId] || 'from-slate-400 to-slate-600') : 'from-slate-400 to-slate-600'
  const userName = session?.userName ?? ''

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 flex flex-col fixed top-0 left-0 h-full z-10"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #1e3a5f 100%)' }}>

        {/* App logo */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Cartella Clinica</div>
            <div className="text-slate-400 text-xs">Personal Health Record</div>
          </div>
        </div>

        {/* User bar */}
        {session && (
          <div className="flex items-center gap-2 px-4 pb-3 border-b border-white/10">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${userColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {userName[0] ?? '?'}
            </div>
            <span className="text-slate-200 text-sm font-medium flex-1 truncate">{userName}</span>
            <button
              onClick={handleLogout}
              title="Esci"
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        <nav className="flex-1 py-2 px-3 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-medium shadow-sm backdrop-blur-sm'
                    : 'text-slate-400 hover:bg-white/8 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : color} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Backup</span>
            <div className="flex gap-1">
              <button
                onClick={exportData}
                title="Esporta backup JSON"
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => importRef.current?.click()}
                title="Importa da backup JSON"
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <Upload size={14} />
              </button>
            </div>
          </div>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <div className="text-xs text-slate-500 text-center">I dati sono salvati nel tuo browser</div>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8 max-w-5xl">{children}</main>
    </div>
  )
}
