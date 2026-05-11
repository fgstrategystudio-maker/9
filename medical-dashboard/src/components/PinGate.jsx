import React, { useState, useEffect, useCallback } from 'react'
import { Heart, Delete } from 'lucide-react'

export default function PinGate({ children }) {
  const [pin, setPin] = useState(() => localStorage.getItem('mcd_pin') || null)
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('mcd_unlocked') === '1')
  const [digits, setDigits] = useState([])
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  // Re-check if pin changes from outside (settings page)
  useEffect(() => {
    const handler = () => {
      setPin(localStorage.getItem('mcd_pin') || null)
    }
    window.addEventListener('mcd_pin_changed', handler)
    return () => window.removeEventListener('mcd_pin_changed', handler)
  }, [])

  const handleDigit = useCallback((d) => {
    setDigits(prev => {
      if (prev.length >= 4) return prev
      const next = [...prev, d]
      if (next.length === 4) {
        const entered = next.join('')
        if (entered === pin) {
          sessionStorage.setItem('mcd_unlocked', '1')
          setUnlocked(true)
        } else {
          setTimeout(() => {
            setShake(true)
            setError('PIN errato')
            setTimeout(() => {
              setShake(false)
              setDigits([])
              setError('')
            }, 600)
          }, 0)
          return next
        }
      }
      return next
    })
  }, [pin])

  const handleBackspace = useCallback(() => {
    setDigits(prev => prev.slice(0, -1))
    setError('')
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleBackspace()
    }
    if (pin && !unlocked) {
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [pin, unlocked, handleDigit, handleBackspace])

  if (!pin || unlocked) return children

  const digitButtons = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-xl mb-3">
          <Heart size={28} className="text-white" fill="white" />
        </div>
        <div className="text-white font-bold text-xl">Cartella Clinica</div>
        <div className="text-slate-400 text-sm">Inserisci il PIN per accedere</div>
      </div>

      {/* Dot indicators */}
      <div className={`flex gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}>
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              digits.length > i
                ? 'bg-white border-white'
                : 'bg-transparent border-slate-500'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm mb-4 font-medium">{error}</div>
      )}
      {!error && <div className="h-5 mb-4" />}

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-3">
        {digitButtons.map((d, i) => {
          if (d === '') return <div key={i} />
          if (d === '⌫') return (
            <button
              key={i}
              onClick={handleBackspace}
              className="w-16 h-16 rounded-2xl bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 active:scale-95 transition-all"
            >
              <Delete size={20} />
            </button>
          )
          return (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-16 h-16 rounded-2xl bg-slate-700 text-white text-xl font-semibold hover:bg-slate-600 active:scale-95 transition-all"
            >
              {d}
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s ease; }
      `}</style>
    </div>
  )
}
