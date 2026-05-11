import React from 'react'
import { NavLink } from 'react-router-dom'
import { Heart, Home, Activity, Zap, FileText, TrendingUp, BarChart2, CalendarClock, BookOpen } from 'lucide-react'

const nav = [
  { to: '/', icon: Home, label: 'Overview', color: 'text-sky-300' },
  { to: '/timeline', icon: Activity, label: 'Timeline episodi', color: 'text-violet-300' },
  { to: '/infortuni', icon: Zap, label: 'Infortuni', color: 'text-red-300' },
  { to: '/documenti', icon: FileText, label: 'Documenti', color: 'text-emerald-300' },
  { to: '/pattern', icon: TrendingUp, label: 'Pattern e Famiglia', color: 'text-amber-300' },
  { to: '/misurazioni', icon: BarChart2, label: 'Misurazioni', color: 'text-rose-300' },
  { to: '/agenda', icon: CalendarClock, label: 'Agenda sanitaria', color: 'text-teal-300' },
  { to: '/diario', icon: BookOpen, label: 'Diario sintomi', color: 'text-pink-300' },
]

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 flex flex-col fixed top-0 left-0 h-full z-10"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #1e3a5f 100%)' }}>
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Cartella Clinica</div>
            <div className="text-slate-400 text-xs">Personal Health Record</div>
          </div>
        </div>

        <nav className="flex-1 py-2 px-3">
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
          <div className="text-xs text-slate-500 text-center">I dati sono salvati nel tuo browser</div>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8 max-w-5xl">{children}</main>
    </div>
  )
}
