import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Timeline from './pages/Timeline'
import Injuries from './pages/Injuries'
import Documents from './pages/Documents'
import Patterns from './pages/Patterns'
import Measurements from './pages/Measurements'
import Agenda from './pages/Agenda'
import Diary from './pages/Diary'
import Doctors from './pages/Doctors'
import Screening from './pages/Screening'
import Settings from './pages/Settings'
import Watchlist from './pages/Watchlist'

export default function App({ session, onLogout }) {
  return (
    <Layout session={session} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/infortuni" element={<Injuries />} />
        <Route path="/documenti" element={<Documents />} />
        <Route path="/pattern" element={<Patterns />} />
        <Route path="/misurazioni" element={<Measurements />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/diario" element={<Diary />} />
        <Route path="/medici" element={<Doctors />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/screening" element={<Screening />} />
        <Route path="/impostazioni" element={<Settings onLogout={onLogout} />} />
      </Routes>
    </Layout>
  )
}
