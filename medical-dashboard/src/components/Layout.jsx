import React, { useRef } from 'react'
import { NavLink } from 'react-router-dom'

// Vitae icon set (path data from the brand package shell.js)
const ICON = {
  home: 'M3 11.5 12 4l9 7.5M5 10v10h14V10',
  pulse: 'M3 12h4l2-6 4 14 2-8h6',
  bolt: 'M13 3 4 14h6l-1 7 9-11h-6l1-7Z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 3v16',
  bars: 'M5 20V10M12 20V4M19 20v-7',
  shield: 'M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h.01',
  trend: 'M3 17l6-6 4 4 7-8M14 7h5v5',
  clip: 'M9 4h6v3H9zM7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5',
  steth: 'M6 3v5a4 4 0 0 0 8 0V3M10 16v1a4 4 0 0 0 8 0v-2M18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3a8 8 0 0 0-.2-1.8l2-1.5-2-3.4-2.3 1a8 8 0 0 0-3-1.7L14 1h-4l-.5 2.6a8 8 0 0 0-3 1.7l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12a8 8 0 0 0 .2 1.8l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 3 1.7L10 23h4l.5-2.6a8 8 0 0 0 3-1.7l2.3 1 2-3.4-2-1.5A8 8 0 0 0 20 12Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z',
  power: 'M12 3v9M6.4 6.4a8 8 0 1 0 11.2 0',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
  upload: 'M12 21V9m0 0 4 4m-4-4-4 4M5 3h14',
}

function Ic({ name, ...p }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d={ICON[name]} />
    </svg>
  )
}

// Grouped navigation (Vitae structure) mapping the existing routes
const NAV = [
  ['Panoramica', [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/timeline', icon: 'pulse', label: 'Timeline episodi' },
  ]],
  ['Diario clinico', [
    { to: '/infortuni', icon: 'bolt', label: 'Infortuni' },
    { to: '/diario', icon: 'book', label: 'Diario sintomi' },
    { to: '/misurazioni', icon: 'bars', label: 'Misurazioni' },
  ]],
  ['Prevenzione', [
    { to: '/screening', icon: 'shield', label: 'Screening' },
    { to: '/watchlist', icon: 'alert', label: 'Sintomi da monitorare' },
    { to: '/pattern', icon: 'trend', label: 'Pattern e Famiglia' },
  ]],
  ['Archivio', [
    { to: '/documenti', icon: 'file', label: 'Documenti' },
    { to: '/medici', icon: 'steth', label: 'Medici' },
    { to: '/agenda', icon: 'clip', label: 'Agenda sanitaria' },
  ]],
  ['Sistema', [
    { to: '/impostazioni', icon: 'gear', label: 'Impostazioni' },
  ]],
]

const MOBILE = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/timeline', icon: 'pulse', label: 'Timeline' },
  { to: '/documenti', icon: 'file', label: 'Documenti' },
  { to: '/misurazioni', icon: 'bars', label: 'Misure' },
  { to: '/impostazioni', icon: 'gear', label: 'Impostazioni' },
]

const USER_COLORS = {
  anna:      'linear-gradient(135deg,#f87fa0,#db2777)',
  nando:     'linear-gradient(135deg,#60a5fa,#2563eb)',
  francesco: 'var(--vitae-grad-brand)',
  federica:  'linear-gradient(135deg,#6ee7b7,#059669)',
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
  a.download = `vitae-backup-${new Date().toISOString().slice(0, 10)}.json`
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
          // Non sovrascrivere il PIN impostato su questo dispositivo
          if (k.startsWith('mcd_pin_')) return
          localStorage.setItem(k, JSON.stringify(v))
        })
        window.location.reload()
      } catch { alert('Errore nella lettura del file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) onLogout?.()
  }

  const userName = session?.userName ?? ''
  const userBg = session?.userId ? (USER_COLORS[session.userId] || 'var(--vitae-grad-brand)') : 'var(--vitae-grad-brand)'

  return (
    <div className="vt-app">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sb-logo">
          <span className="mark"><Ic name="heart" /></span>
          <div>
            <div className="name">Vitae</div>
            <div className="sub">Cartella clinica personale</div>
          </div>
        </div>

        {/* Nav */}
        <nav>
          {NAV.map(([group, items]) => (
            <React.Fragment key={group}>
              <div className="sb-group">{group}</div>
              {items.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}>
                  <Ic name={icon} />
                  <span className="lbl">{label}</span>
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer: backup + user */}
        <div className="sb-foot">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 10px' }}>
            <span style={{ fontSize: 11, color: 'var(--vitae-muted)', fontWeight: 600 }}>Backup locale</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sb-iconbtn" title="Esporta backup JSON" onClick={exportData}><Ic name="download" style={{ width: 15, height: 15 }} /></button>
              <button className="sb-iconbtn" title="Importa da backup JSON" onClick={() => importRef.current?.click()}><Ic name="upload" style={{ width: 15, height: 15 }} /></button>
            </div>
          </div>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          {session && (
            <div className="sb-user">
              <span className="sb-ava" style={{ background: userBg }}>{(userName[0] || '?').toUpperCase()}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{userName}</div>
                <div className="sb-sub">Paziente</div>
              </div>
              <button className="sb-iconbtn" title="Esci" onClick={handleLogout} style={{ border: 'none', background: 'transparent' }}><Ic name="power" /></button>
            </div>
          )}
        </div>
      </aside>

      <main className="vt-main">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {MOBILE.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `mn-item${isActive ? ' active' : ''}`}>
            <Ic name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
