import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Timeline from './pages/Timeline.jsx'
import Injuries from './pages/Injuries.jsx'
import Documents from './pages/Documents.jsx'
import Patterns from './pages/Patterns.jsx'

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
