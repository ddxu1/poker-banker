import { useGameStore, getLedgers } from '../store/gameStore'
import { formatMoney } from '../core/settlement'

export default function SettlementView() {
  const { session, settlements, paidMap, togglePaid, newGame } = useGameStore()

  if (!session) return null

  const ledgers = getLedgers(session)
  const totalPotCents = ledgers.reduce((s, l) => s + l.totalInCents, 0)
  const totalOutCents = ledgers.reduce((s, l) => s + l.totalOutCents, 0)
  const discrepancyCents = totalOutCents - totalPotCents

  const allPaid = settlements.length > 0 && settlements.every((_, i) => paidMap[i])

  function shareText() {
    const lines = [
      '🃏 Poker Game Results',
      '',
      ...ledgers
        .sort((a, b) => b.netCents - a.netCents)
        .map((l) => {
          const sign = l.netCents > 0 ? '+' : ''
          return `${l.name}: ${sign}${formatMoney(l.netCents)}`
        }),
      '',
      '💸 Transfers',
      ...settlements.map((s) => `${s.fromName} → ${s.toName}: ${formatMoney(s.amountCents)}`),
    ]
    navigator.clipboard?.writeText(lines.join('\n'))
  }

  return (
    <div
      className="flex flex-col min-h-dvh px-4"
      style={{ paddingTop: 'max(1.5rem, var(--safe-top))' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{allPaid ? '🎉' : '💰'}</div>
        <h1 className="text-3xl font-bold text-white">{allPaid ? 'All Settled!' : 'Settle Up'}</h1>
        <p className="text-gray-500 text-sm mt-1">Pot: {formatMoney(totalPotCents)}</p>
      </div>

      {/* Discrepancy warning */}
      {discrepancyCents !== 0 && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <p className="text-yellow-400 font-semibold text-sm">⚠️ Balance mismatch</p>
          <p className="text-gray-400 text-xs mt-1">
            Cash-outs are {formatMoney(Math.abs(discrepancyCents))}{' '}
            {discrepancyCents > 0 ? 'more' : 'less'} than buy-ins. Double-check the numbers.
          </p>
        </div>
      )}

      {/* Player results */}
      <div className="mb-6">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">Results</p>
        <div className="flex flex-col gap-2">
          {ledgers
            .sort((a, b) => b.netCents - a.netCents)
            .map((l) => (
              <div key={l.playerId} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3">
                <p className="text-white font-medium">{l.name}</p>
                <p
                  className={`font-bold text-lg ${
                    l.netCents > 0 ? 'text-green-400' : l.netCents < 0 ? 'text-red-400' : 'text-gray-500'
                  }`}
                >
                  {l.netCents > 0 ? '+' : ''}{formatMoney(l.netCents)}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Transfers */}
      <div className="mb-6">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
          Transfers · {settlements.length} {settlements.length === 1 ? 'payment' : 'payments'}
        </p>
        {settlements.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p className="text-lg">Everyone broke even 🤝</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {settlements.map((s, i) => {
              const paid = paidMap[i]
              return (
                <button
                  key={i}
                  onClick={() => togglePaid(i)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 border transition-all ${
                    paid
                      ? 'bg-green-900/20 border-green-700/40'
                      : 'bg-gray-800/60 border-gray-700/40 active:bg-gray-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paid ? 'border-green-500 bg-green-500' : 'border-gray-600'
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
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto pb-8 flex flex-col gap-3" style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}>
        <button
          onClick={shareText}
          className="w-full py-4 rounded-2xl bg-gray-800 text-gray-300 font-semibold text-base active:bg-gray-700"
        >
          Copy Summary
        </button>
        <button
          onClick={newGame}
          className="w-full py-5 rounded-2xl bg-green-600 text-white font-bold text-lg active:bg-green-500"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
