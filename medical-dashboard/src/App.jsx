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

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/infortuni" element={<Injuries />} />
        <Route path="/documenti" element={<Documents />} />
        <Route path="/pattern" element={<Patterns />} />
        <Route path="/misurazioni" element={<Measurements />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/diario" element={<Diary />} />
      </Routes>
    </Layout>
  )
}
