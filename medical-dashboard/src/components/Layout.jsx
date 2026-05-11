import React from 'react'
import { NavLink } from 'react-router-dom'
import { Heart, Home, Activity, Zap, FileText, TrendingUp } from 'lucide-react'

const nav = [
  { to: '/', icon: Home, label: 'Overview' },
  { to: '/timeline', icon: Activity, label: 'Timeline episodi' },
  { to: '/infortuni', icon: Zap, label: 'Infortuni' },
  { to: '/documenti', icon: FileText, label: 'Documenti' },
  { to: '/pattern', icon: TrendingUp, label: 'Pattern e Famiglia' },
]

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 h-full z-10">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <Heart className="text-blue-600" size={20} />
          <span className="font-semibold text-gray-800 text-sm">Cartella Clinica</span>
        </div>
        <nav className="flex-1 py-3 px-2">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="ml-60 flex-1 p-8 max-w-6xl">{children}</main>
    </div>
  )
}
