import React, { useState } from 'react'
import { Heart, Delete } from 'lucide-react'
import { getPin, setPin } from '../lib/auth'

const USERS = [
  { id: 'anna',      name: 'Anna',      color: 'from-rose-400 to-pink-600',    bg: 'bg-rose-100',    text: 'text-rose-600',    ring: 'ring-rose-300' },
  { id: 'nando',     name: 'Nando',     color: 'from-blue-400 to-blue-600',    bg: 'bg-blue-100',    text: 'text-blue-600',    ring: 'ring-blue-300' },
  { id: 'francesco', name: 'Francesco', color: 'from-violet-400 to-violet-600', bg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-300' },
  { id: 'federica',  name: 'Federica',  color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-300' },
]

function Avatar({ user, size = 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-9 h-9 text-base'
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-bold shadow-md`}>
      {user.name[0]}
    </div>
  )
}

function PinDots({ pin }) {
  return (
    <div className="flex gap-3 justify-center my-4">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full transition-all duration-150 ${
            i < pin.length ? 'bg-violet-600 scale-110' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function PinPad({ onDigit, onBack, disabled }) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back']
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {digits.map((d, i) => {
        if (d === '') return <div key={i} />
        if (d === 'back') return (
          <button
            key={i}
            onClick={onBack}
            disabled={disabled}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all active:scale-95 disabled:opacity-40"
          >
            <Delete size={18} />
          </button>
        )
        return (
          <button
            key={i}
            onClick={() => onDigit(d)}
            disabled={disabled}
            className="h-12 rounded-xl bg-gray-100 hover:bg-violet-100 hover:text-violet-700 font-semibold text-gray-800 text-lg transition-all active:scale-95 disabled:opacity-40"
          >
            {d}
          </button>
        )
      })}
    </div>
  )
}

export default function LoginScreen({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const [pin, setPin_] = useState('')
  const [step, setStep] = useState('select') // select | pin | create1 | create2
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const handleSelectUser = async (user) => {
    setSelectedUser(user)
    setPin_('')
    setConfirmPin('')
    setError('')
    setLoading(true)
    try {
      const existingPin = await getPin(user.id)
      if (existingPin === null || existingPin === '') {
        setIsFirstLogin(true)
        setStep('create1')
      } else {
        setIsFirstLogin(false)
        setStep('pin')
      }
    } catch {
      setError('Errore di connessione')
      setStep('pin')
    }
    setLoading(false)
  }

  const handlePinDigit = async (d) => {
    if (pin.length >= 4) return
    const newPin = pin + d
    setPin_(newPin)
    setError('')
    if (newPin.length === 4) {
      setLoading(true)
      try {
        const storedPin = await getPin(selectedUser.id)
        if (newPin === storedPin) {
          await onLogin(selectedUser.id, selectedUser.name)
        } else {
          triggerShake()
          setError('PIN errato')
          setTimeout(() => setPin_(''), 600)
        }
      } catch {
        setError('Errore di connessione')
        setTimeout(() => setPin_(''), 600)
      }
      setLoading(false)
    }
  }

  const handlePinBack = () => {
    setPin_(p => p.slice(0, -1))
    setError('')
  }

  const handleCreate1Digit = (d) => {
    if (pin.length >= 4) return
    const newPin = pin + d
    setPin_(newPin)
    setError('')
    if (newPin.length === 4) {
      setStep('create2')
    }
  }

  const handleCreate1Back = () => {
    setPin_(p => p.slice(0, -1))
    setError('')
  }

  const handleCreate2Digit = async (d) => {
    if (confirmPin.length >= 4) return
    const newConfirm = confirmPin + d
    setConfirmPin(newConfirm)
    setError('')
    if (newConfirm.length === 4) {
      if (newConfirm !== pin) {
        triggerShake()
        setError('I PIN non coincidono. Riprova.')
        setTimeout(() => { setPin_(''); setConfirmPin(''); setStep('create1') }, 700)
      } else {
        setLoading(true)
        try {
          await setPin(selectedUser.id, newConfirm)
          await onLogin(selectedUser.id, selectedUser.name)
        } catch {
          setError('Errore nel salvataggio del PIN')
          setLoading(false)
        }
      }
    }
  }

  const handleCreate2Back = () => {
    setConfirmPin(p => p.slice(0, -1))
    setError('')
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPin_('')
    setConfirmPin('')
    setError('')
    setStep('select')
    setIsFirstLogin(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #1e3a5f 100%)' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg mx-auto mb-3">
            <Heart size={22} className="text-white" fill="white" />
          </div>
          <div className="font-bold text-gray-800 text-lg">Cartella Clinica</div>
          <div className="text-gray-400 text-xs mt-0.5">Personal Health Record</div>
        </div>

        <div className="px-6 pb-8">
          {/* Step: select user */}
          {step === 'select' && (
            <>
              <div className="text-center text-sm text-gray-500 mb-5">Chi sei?</div>
              <div className="grid grid-cols-2 gap-3">
                {USERS.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none relative`}
                  >
                    <Avatar user={user} size="lg" />
                    <span className="font-medium text-gray-700 text-sm">{user.name}</span>
                    {loading && selectedUser?.id === user.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: enter PIN */}
          {step === 'pin' && selectedUser && (
            <>
              <button onClick={handleBack} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 transition-colors">
                ← Cambia utente
              </button>
              <div className="text-center">
                <Avatar user={selectedUser} size="lg" />
                <div className="font-semibold text-gray-800 mt-2">{selectedUser.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">Inserisci il tuo PIN</div>
              </div>
              {loading ? (
                <div className="flex justify-center my-6">
                  <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className={shake ? 'animate-shake' : ''}>
                    <PinDots pin={pin} />
                  </div>
                  {error && <div className="text-red-500 text-xs text-center mb-1">{error}</div>}
                  <PinPad onDigit={handlePinDigit} onBack={handlePinBack} disabled={loading} />
                </>
              )}
            </>
          )}

          {/* Step: create PIN (step 1) */}
          {step === 'create1' && selectedUser && (
            <>
              <button onClick={handleBack} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 transition-colors">
                ← Cambia utente
              </button>
              <div className="text-center">
                <Avatar user={selectedUser} size="lg" />
                <div className="font-semibold text-gray-800 mt-2">Benvenuto/a, {selectedUser.name}!</div>
                <div className="text-xs text-gray-400 mt-1">Primo accesso — Crea il tuo PIN (4 cifre)</div>
              </div>
              {loading ? (
                <div className="flex justify-center my-6">
                  <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <PinDots pin={pin} />
                  {error && <div className="text-red-500 text-xs text-center mb-1">{error}</div>}
                  <PinPad onDigit={handleCreate1Digit} onBack={handleCreate1Back} disabled={loading} />
                </>
              )}
            </>
          )}

          {/* Step: create PIN (step 2 - confirm) */}
          {step === 'create2' && selectedUser && (
            <>
              <div className="text-center">
                <Avatar user={selectedUser} size="lg" />
                <div className="font-semibold text-gray-800 mt-2">{selectedUser.name}</div>
                <div className="text-xs text-gray-400 mt-1">Conferma il PIN</div>
              </div>
              {loading ? (
                <div className="flex justify-center my-6">
                  <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className={shake ? 'animate-shake' : ''}>
                    <PinDots pin={confirmPin} />
                  </div>
                  {error && <div className="text-red-500 text-xs text-center mb-1">{error}</div>}
                  <PinPad onDigit={handleCreate2Digit} onBack={handleCreate2Back} disabled={loading} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
