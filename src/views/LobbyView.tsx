import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export default function LobbyView() {
  const { startSession, goHome } = useGameStore()
  const [playerNames, setPlayerNames] = useState<string[]>([''])
  const [toast, setToast] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const focusIndexRef = useRef<number | null>(null)

  const validNames = playerNames.map((n) => n.trim()).filter(Boolean)
  const lowerNames = validNames.map((n) => n.toLowerCase())
  const hasDuplicates = lowerNames.length !== new Set(lowerNames).size

  // Focus the most-recently-added input after render
  useEffect(() => {
    if (focusIndexRef.current !== null) {
      inputRefs.current[focusIndexRef.current]?.focus()
      focusIndexRef.current = null
    }
  }, [playerNames.length])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  function updateName(i: number, value: string) {
    setPlayerNames((prev) => {
      const next = [...prev]
      next[i] = value
      return next
    })
  }

  function addPlayer(focusIndex?: number) {
    if (playerNames.length >= 12) return
    setPlayerNames((prev) => [...prev, ''])
    focusIndexRef.current = focusIndex ?? playerNames.length
  }

  function handleEnter(i: number) {
    const current = playerNames[i].trim()
    if (!current) return
    // If a later input already exists, focus it; otherwise add a new one
    if (i < playerNames.length - 1) {
      inputRefs.current[i + 1]?.focus()
    } else if (playerNames.length < 12) {
      addPlayer(i + 1)
    }
  }

  function removeName(i: number) {
    setPlayerNames((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleStart() {
    if (hasDuplicates) {
      setToast('Each player needs a unique name')
      return
    }
    if (validNames.length < 2) {
      setToast('Add at least 2 players')
      return
    }
    startSession(validNames)
  }

  return (
    <div className="flex flex-col min-h-dvh px-4" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
      {/* Top bar: home icon + "new" label */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goHome}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800/60 text-gray-400 active:text-white active:bg-gray-700"
          aria-label="Home"
          title="Home"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12 12 3l9 9" />
            <path d="M5 10v10h14V10" />
          </svg>
        </button>
        <span className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em]">new</span>
        <span className="w-9" aria-hidden="true" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Who's playing?</h1>
      </div>

      {/* Players */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Players {validNames.length > 0 && <span className="text-gray-600">· {validNames.length}</span>}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {playerNames.map((name, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                ref={(el) => { inputRefs.current[i] = el }}
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleEnter(i)
                  }
                }}
                placeholder={`Player ${i + 1}`}
                className="flex-1 bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={() => removeName(i)}
                disabled={playerNames.length <= 1}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-xl shrink-0 bg-gray-800 text-red-500 disabled:text-gray-700 disabled:bg-gray-800/40"
                aria-label="Remove player"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add player button */}
        <button
          onClick={() => addPlayer()}
          disabled={playerNames.length >= 12}
          className="mt-3 w-full py-3.5 rounded-xl border border-gray-700 bg-gray-800/50 text-gray-400 font-semibold text-sm disabled:opacity-40 active:bg-gray-700"
        >
          + Add Player
        </button>
      </div>

      {/* Start button */}
      <div className="mt-auto pb-8" style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}>
        <button
          onClick={handleStart}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-700 to-violet-950 border border-violet-500/40 text-white font-bold text-lg shadow-lg shadow-violet-950/50 active:from-violet-600 transition-colors"
        >
          Start Game
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-rose-500/90 backdrop-blur text-white font-semibold text-sm shadow-lg shadow-rose-950/50"
          style={{ bottom: 'calc(max(2rem, var(--safe-bottom)) + 6rem)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
