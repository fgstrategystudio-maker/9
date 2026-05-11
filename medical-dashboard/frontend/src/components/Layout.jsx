import { NavLink } from 'react-router-dom'
import { Heart, Home, Activity, Zap, FileText, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Overview' },
  { to: '/timeline', icon: Activity, label: 'Timeline' },
  { to: '/infortuni', icon: Zap, label: 'Infortuni' },
  { to: '/documenti', icon: FileText, label: 'Documenti' },
  { to: '/pattern', icon: TrendingUp, label: 'Pattern e Famiglia' },
]

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-full flex flex-col z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-blue-600 fill-blue-100" />
            <h1 className="text-lg font-bold text-gray-800">Cartella Clinica</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">Storico Medico Personale</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Dati personali e riservati</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
