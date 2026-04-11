import { useState, useRef } from 'react'
import { useGameStore, getLedgers, BUYIN_PRESETS_CENTS } from '../store/gameStore'
import { formatMoney } from '../core/settlement'
import BottomSheet from '../components/BottomSheet'
import NumPad from '../components/NumPad'
import type { PlayerID } from '../core/types'

type SheetMode = { playerId: PlayerID; type: 'buyin' | 'buyout' } | null

export default function GameView() {
  const { session, addBuyin, addBuyout, addPlayer, endGame } = useGameStore()
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showLedger, setShowLedger] = useState(false)
  const newPlayerRef = useRef<HTMLInputElement>(null)

  if (!session) return null

  const ledgers = getLedgers(session)
  const totalPotCents = ledgers.reduce((s, l) => s + l.totalInCents, 0)

  // Chronological transaction log, newest first
  const txLog = [...session.transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((tx) => {
      const player = session.players.find((p) => p.id === tx.playerId)
      return { ...tx, playerName: player?.name ?? 'Unknown' }
    })

  function handleConfirm(amountCents: number) {
    if (!sheet) return
    if (sheet.type === 'buyin') addBuyin(sheet.playerId, amountCents)
    else addBuyout(sheet.playerId, amountCents)
    setSheet(null)
  }

  function handleAddPlayer() {
    const name = newPlayerName.trim()
    if (!name) return
    addPlayer(name)
    setNewPlayerName('')
    setAddingPlayer(false)
  }

  const activePlayer = sheet ? session.players.find((p) => p.id === sheet.playerId) : null

  return (
    <div className="flex flex-col min-h-dvh" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-white font-bold text-xl">Live Game</h2>
          <p className="text-gray-500 text-xs">Pot: {formatMoney(totalPotCents)} in play</p>
        </div>
        <button
          onClick={() => setConfirmEnd(true)}
          className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold px-4 py-2 rounded-xl"
        >
          End Game
        </button>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-3 pb-6">
        {/* Player cards */}
        {ledgers.map((ledger) => {
          const isUp = ledger.netCents > 0
          const isDown = ledger.netCents < 0

          return (
            <div key={ledger.playerId} className="bg-gray-800/60 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-semibold text-lg">{ledger.name}</p>
                  <p className="text-gray-500 text-xs">
                    In: {formatMoney(ledger.totalInCents)}
                    {ledger.totalOutCents > 0 && ` · Out: ${formatMoney(ledger.totalOutCents)}`}
                  </p>
                </div>
                <div className="text-right">
                  {ledger.totalInCents === 0 ? (
                    <p className="text-gray-600 font-bold text-lg">—</p>
                  ) : (
                    <p className={`font-bold text-xl ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400'}`}>
                      {isUp ? '+' : ''}{formatMoney(ledger.netCents)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSheet({ playerId: ledger.playerId, type: 'buyin' })}
                  className="py-3 rounded-xl bg-blue-600/20 border border-blue-600/40 text-blue-400 font-semibold text-sm active:bg-blue-600/30"
                >
                  + Buy In
                </button>
                <button
                  onClick={() => setSheet({ playerId: ledger.playerId, type: 'buyout' })}
                  className="py-3 rounded-xl bg-gray-700/50 border border-gray-600/40 text-gray-300 font-semibold text-sm active:bg-gray-700"
                >
                  Cash Out
                </button>
              </div>
            </div>
          )
        })}

        {/* Add player button */}
        <button
          onClick={() => { setAddingPlayer(true); setTimeout(() => newPlayerRef.current?.focus(), 50) }}
          className="py-3.5 rounded-2xl border border-dashed border-gray-700 text-gray-500 font-medium text-sm active:border-gray-500 active:text-gray-400"
        >
          + Add Player
        </button>

        {/* Transaction ledger */}
        {txLog.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowLedger((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-gray-500 text-xs font-semibold uppercase tracking-widest"
            >
              <span>Transaction History · {txLog.length}</span>
              <span>{showLedger ? '▲' : '▼'}</span>
            </button>

            {showLedger && (
              <div className="flex flex-col gap-1 mt-1">
                {txLog.map((tx) => {
                  const isBuyin = tx.type === 'buyin'
                  const time = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={tx.id} className="flex items-center justify-between bg-gray-800/40 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isBuyin ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                          {isBuyin ? 'BUY IN' : 'CASH OUT'}
                        </span>
                        <span className="text-gray-300 text-sm">{tx.playerName}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold text-sm ${isBuyin ? 'text-blue-400' : 'text-gray-300'}`}>
                          {formatMoney(tx.amountCents)}
                        </span>
                        <p className="text-gray-600 text-xs">{time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NumPad sheet */}
      <BottomSheet open={!!sheet} onClose={() => setSheet(null)}>
        {sheet && activePlayer && (
          <NumPad
            presets={BUYIN_PRESETS_CENTS}
            title={`${activePlayer.name} · ${sheet.type === 'buyin' ? 'Buy In' : 'Cash Out'}`}
            onConfirm={handleConfirm}
            onCancel={() => setSheet(null)}
            allowZero={sheet.type === 'buyout'}
          />
        )}
      </BottomSheet>

      {/* Add player sheet */}
      <BottomSheet open={addingPlayer} onClose={() => { setAddingPlayer(false); setNewPlayerName('') }}>
        <div className="flex flex-col gap-4">
          <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest">Add Player</p>
          <input
            ref={newPlayerRef}
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            placeholder="Player name"
            className="bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setAddingPlayer(false); setNewPlayerName('') }}
              className="py-4 rounded-xl bg-gray-800 text-gray-400 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              className="py-4 rounded-xl bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold active:bg-green-500"
            >
              Add
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* End game confirmation */}
      <BottomSheet open={confirmEnd} onClose={() => setConfirmEnd(false)}>
        <div className="text-center px-2">
          <div className="text-4xl mb-3">🏁</div>
          <h3 className="text-white font-bold text-2xl mb-2">End the game?</h3>
          <p className="text-gray-400 text-sm mb-6">
            Make sure all players have cashed out before settling up.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConfirmEnd(false)}
              className="py-4 rounded-xl bg-gray-800 text-gray-400 font-semibold"
            >
              Keep Playing
            </button>
            <button
              onClick={() => { setConfirmEnd(false); endGame() }}
              className="py-4 rounded-xl bg-red-600 text-white font-bold active:bg-red-500"
            >
              Settle Up
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
