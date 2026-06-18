import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import LoginScreen from './components/LoginScreen'
import { getSession, setSession, clearSession, loadUserData } from './lib/auth'
import './index.css'

function Root() {
  const [session, setSessionState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (s) {
      setSessionState(s)
    }
    setLoading(false)
  }, [])

  const handleLogin = async (userId, userName) => {
    setLoading(true)
    await loadUserData(userId)
    setSession(userId, userName)
    setSessionState({ userId, userName })
    setLoading(false)
  }

  const handleLogout = () => {
    clearSession()
    setSessionState(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <LoginScreen onLogin={handleLogin} />

  return <App session={session} onLogout={handleLogout} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><Root /></BrowserRouter>
)
