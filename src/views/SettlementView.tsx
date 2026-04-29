import { useState } from 'react'
import { useGameStore, getLedgers } from '../store/gameStore'
import { formatMoney } from '../core/settlement'

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default function SettlementView() {
  const { session, settlements, paidMap, togglePaid, newGame, goToLobby } = useGameStore()
  const [copied, setCopied] = useState(false)

  if (!session) return null

  const ledgers = getLedgers(session)
  const totalPotCents = ledgers.reduce((s, l) => s + l.totalInCents, 0)
  const totalOutCents = ledgers.reduce((s, l) => s + l.totalOutCents, 0)
  const discrepancyCents = totalOutCents - totalPotCents

  const allPaid = settlements.length > 0 && settlements.every((_, i) => paidMap[i])

  function shareText() {
    const lines = [
      'PokerBank Results',
      '',
      ...ledgers
        .sort((a, b) => b.netCents - a.netCents)
        .map((l) => {
          const sign = l.netCents > 0 ? '+' : ''
          return `${l.name}: ${sign}${formatMoney(l.netCents)}`
        }),
      '',
      'Transfers',
      ...settlements.map((s) => `${s.fromName} → ${s.toName}: ${formatMoney(s.amountCents)}`),
    ]
    navigator.clipboard?.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div
      className="flex flex-col min-h-dvh px-4"
      style={{ paddingTop: 'max(1.5rem, var(--safe-top))' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
          {allPaid ? 'Closed Out' : 'Final Ledger'}
        </p>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {allPaid ? 'All Settled' : 'Settle Up'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Pot {formatMoney(totalPotCents)}</p>
      </div>

      {/* Discrepancy warning */}
      {discrepancyCents !== 0 && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <p className="text-yellow-400 font-semibold text-sm">Balance mismatch</p>
          <p className="text-gray-400 text-xs mt-1">
            Cash-outs are {formatMoney(Math.abs(discrepancyCents))}{' '}
            {discrepancyCents > 0 ? 'more' : 'less'} than buy-ins. Double-check the numbers.
          </p>
        </div>
      )}

      {/* Player ledger */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Ledger</p>
          <button
            onClick={shareText}
            className={`p-1.5 rounded-md transition-colors ${copied ? 'text-emerald-400' : 'text-gray-500 active:text-gray-200'}`}
            aria-label="Copy summary"
            title={copied ? 'Copied' : 'Copy summary'}
          >
            <CopyIcon />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {ledgers
            .sort((a, b) => b.netCents - a.netCents)
            .map((l) => {
              const isUp = l.netCents > 0
              const isDown = l.netCents < 0
              return (
                <div
                  key={l.playerId}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    isUp
                      ? 'bg-emerald-950/30 border-emerald-700/30'
                      : isDown
                      ? 'bg-rose-950/20 border-rose-800/30'
                      : 'bg-gray-800/60 border-gray-700/40'
                  }`}
                >
                  <div>
                    <p className="text-white font-medium">{l.name}</p>
                    <p className="text-gray-500 text-xs">
                      In {formatMoney(l.totalInCents)} · Out {formatMoney(l.totalOutCents)}
                    </p>
                  </div>
                  <p
                    className={`font-bold text-lg tabular-nums ${
                      isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-gray-500'
                    }`}
                  >
                    {isUp ? '+' : ''}{formatMoney(l.netCents)}
                  </p>
                </div>
              )
            })}
        </div>
      </div>

      {/* Transfers */}
      {settlements.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
            Transfers · {settlements.length} {settlements.length === 1 ? 'payment' : 'payments'}
          </p>
          <div className="flex flex-col gap-2">
            {settlements.map((s, i) => {
              const paid = paidMap[i]
              return (
                <button
                  key={i}
                  onClick={() => togglePaid(i)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 border transition-all ${
                    paid
                      ? 'bg-emerald-900/20 border-emerald-700/40'
                      : 'bg-gray-800/60 border-gray-700/40 active:bg-gray-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paid ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'
                      }`}
                    >
                      {paid && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${paid ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {s.fromName} → {s.toName}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold text-xl ${paid ? 'text-gray-600' : 'text-white'}`}>
                    {formatMoney(s.amountCents)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pb-8 flex gap-3" style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}>
        <button
          onClick={newGame}
          className="w-16 shrink-0 rounded-2xl bg-gray-800 text-gray-300 font-bold flex items-center justify-center active:bg-gray-700"
          aria-label="Home"
          title="Home"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12 12 3l9 9" />
            <path d="M5 10v10h14V10" />
          </svg>
        </button>
        <button
          onClick={() => { newGame(); goToLobby() }}
          className="flex-1 py-5 rounded-2xl bg-violet-600 text-white font-bold text-lg active:bg-violet-500"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
