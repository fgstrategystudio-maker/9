import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Timeline from './pages/Timeline'
import Injuries from './pages/Injuries'
import Documents from './pages/Documents'
import Patterns from './pages/Patterns'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/infortuni" element={<Injuries />} />
        <Route path="/documenti" element={<Documents />} />
        <Route path="/pattern" element={<Patterns />} />
      </Routes>
    </Layout>
  )
}
