import { useState, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export default function LobbyView() {
  const { startSession, session, resumeSession } = useGameStore()
  const [playerNames, setPlayerNames] = useState<string[]>(['', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const validNames = playerNames.map((n) => n.trim()).filter(Boolean)
  const canStart = validNames.length >= 2

  function updateName(i: number, value: string) {
    setPlayerNames((prev) => {
      const next = [...prev]
      next[i] = value
      if (i === prev.length - 1 && value.trim() && prev.length < 12) {
        next.push('')
      }
      return next
    })
  }

  function removeName(i: number) {
    setPlayerNames((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      return next.length < 2 ? [...next, ''] : next
    })
  }

  function handleStart() {
    if (!canStart) return
    startSession(validNames)
  }

  return (
    <div className="flex flex-col min-h-dvh px-4" style={{ paddingTop: 'max(2rem, var(--safe-top))' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🃏</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Poker Banker</h1>
        <p className="text-gray-500 text-sm mt-1">Settle up with minimum transactions</p>
      </div>

      {/* Resume banner */}
      {session?.status === 'active' && (
        <button
          onClick={resumeSession}
          className="mb-6 w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-left"
        >
          <p className="text-yellow-400 font-semibold text-sm">Game in progress</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {session.players.length} players · Tap to resume
          </p>
        </button>
      )}

      {/* Players */}
      <div className="mb-6">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Players</p>
        <div className="flex flex-col gap-2">
          {playerNames.map((name, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                ref={(el) => { inputRefs.current[i] = el }}
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') inputRefs.current[i + 1]?.focus()
                }}
                placeholder={`Player ${i + 1}`}
                className="flex-1 bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-green-600"
              />
              {playerNames.length > 2 && (
                <button
                  onClick={() => removeName(i)}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 bg-gray-800 rounded-xl text-xl"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="mt-auto pb-8" style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}>
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-5 rounded-2xl bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold text-lg transition-colors active:bg-green-500"
        >
          {canStart ? `Start Game · ${validNames.length} Players` : 'Add at least 2 players'}
        </button>
      </div>
    </div>
  )
}
