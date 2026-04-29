import { useState, useRef, useEffect } from 'react'
import { useGameStore, getLedgers, BUYIN_PRESETS_CENTS } from '../store/gameStore'
import { formatMoney } from '../core/settlement'
import BottomSheet from '../components/BottomSheet'
import NumPad from '../components/NumPad'
import type { PlayerID } from '../core/types'

type SheetMode = { playerId: PlayerID; type: 'buyin' | 'buyout' } | null
type EditMode = { txId: string; txType: 'buyin' | 'buyout'; playerName: string; currentCents: number } | null

function pad(n: number) { return n.toString().padStart(2, '0') }
function tsToLocalInput(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function localInputToTs(s: string): number {
  const t = new Date(s).getTime()
  return Number.isNaN(t) ? Date.now() : t
}
function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function GameView() {
  const { session, addBuyin, addBuyout, addPlayer, removePlayer, editTransaction, removeTransaction, setSessionDate, endGame } = useGameStore()
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [editSheet, setEditSheet] = useState<EditMode>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [removingPlayerId, setRemovingPlayerId] = useState<PlayerID | null>(null)
  const newPlayerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  if (!session) return null

  const ledgers = getLedgers(session)
  const totalPotCents = ledgers.reduce((s, l) => s + l.totalInCents, 0)
  const totalOutCents = ledgers.reduce((s, l) => s + l.totalOutCents, 0)
  const inPlayCents = totalPotCents - totalOutCents

  function handleConfirm(amountCents: number) {
    if (!sheet) return
    if (sheet.type === 'buyin') addBuyin(sheet.playerId, amountCents)
    else addBuyout(sheet.playerId, amountCents)
    setSheet(null)
  }

  function handleEndGame() {
    if (!session) return
    const playersWithBuyins = session.players.filter((p) =>
      session.transactions.some((t) => t.playerId === p.id && t.type === 'buyin')
    )
    const allCashedOut = playersWithBuyins.every((p) =>
      session.transactions.some((t) => t.playerId === p.id && t.type === 'buyout')
    )
    if (!allCashedOut) {
      setToast('Warning: some players have not cashed out yet')
      return
    }
    endGame()
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
      <div className="flex items-center justify-between px-4 mb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
          <h2 className="text-white font-bold text-base uppercase tracking-[0.18em] truncate">Live Game</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setRemoveMode((v) => !v)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl uppercase tracking-wider border ${
              removeMode
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                : 'bg-gray-800/60 border-gray-700/50 text-gray-400'
            }`}
          >
            {removeMode ? 'Done Removing' : 'Remove Player(s)'}
          </button>
          <button
            onClick={handleEndGame}
            className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold px-3 py-2 rounded-xl uppercase tracking-wider"
          >
            End Game
          </button>
        </div>
      </div>

      {/* Started-at */}
      <div className="px-4 mb-3">
        {editingDate ? (
          <input
            type="datetime-local"
            autoFocus
            defaultValue={tsToLocalInput(session.createdAt)}
            onChange={(e) => setSessionDate(localInputToTs(e.target.value))}
            onBlur={() => setEditingDate(false)}
            className="bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-1.5 outline-none border border-violet-500/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 tabular-nums [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-datetime-edit]:text-gray-200"
          />
        ) : (
          <button
            onClick={() => setEditingDate(true)}
            className="text-gray-500 text-xs active:text-gray-300 underline decoration-dotted underline-offset-2"
          >
            Started {formatDateTime(session.createdAt)}
          </button>
        )}
      </div>

      {/* Ledger summary */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-violet-900/40 via-violet-950/40 to-gray-900/60 border border-violet-700/30 p-4">
        <p className="text-violet-300/70 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">Ledger</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bought In</p>
            <p className="text-white font-bold text-lg tabular-nums">{formatMoney(totalPotCents)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cashed Out</p>
            <p className="text-gray-300 font-bold text-lg tabular-nums">{formatMoney(totalOutCents)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">On Table</p>
            <p className="text-violet-300 font-bold text-lg tabular-nums">{formatMoney(inPlayCents)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-3 pb-6">
        {/* Player cards with inline transactions */}
        {ledgers.map((ledger) => {
          const isUp = ledger.netCents > 0
          const isDown = ledger.netCents < 0
          const playerTxs = [...session.transactions]
            .filter((t) => t.playerId === ledger.playerId)
            .sort((a, b) => b.timestamp - a.timestamp)

          return (
            <div
              key={ledger.playerId}
              className={`rounded-2xl p-4 border ${
                isUp
                  ? 'bg-emerald-950/20 border-emerald-700/30'
                  : isDown
                  ? 'bg-rose-950/20 border-rose-800/30'
                  : 'bg-gray-800/60 border-gray-700/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {removeMode && (
                    <button
                      onClick={() => setRemovingPlayerId(ledger.playerId)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-900/30 border border-rose-700/40 text-rose-400 active:bg-rose-800/50 text-base leading-none"
                      aria-label={`Remove ${ledger.name}`}
                      title="Remove player"
                    >
                      ×
                    </button>
                  )}
                  <div>
                    <p className="text-white font-semibold text-lg">{ledger.name}</p>
                    <p className="text-gray-500 text-xs">
                      In: {formatMoney(ledger.totalInCents)}
                      {ledger.totalOutCents > 0 && ` · Out: ${formatMoney(ledger.totalOutCents)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {ledger.totalInCents > 0 && (
                    <p className={`font-bold text-xl ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-gray-400'}`}>
                      {isUp ? '+' : ''}{formatMoney(ledger.netCents)}
                    </p>
                  )}
                </div>
              </div>

              {/* Inline transaction history */}
              {playerTxs.length > 0 && (
                <div className="flex flex-col gap-1 mb-3">
                  {playerTxs.map((tx) => {
                    const isBuyin = tx.type === 'buyin'
                    const time = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                      <button
                        key={tx.id}
                        onClick={() => setEditSheet({ txId: tx.id, txType: tx.type, playerName: ledger.name, currentCents: tx.amountCents })}
                        className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2 w-full text-left active:bg-gray-700/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isBuyin ? 'bg-violet-900/50 text-violet-400' : 'bg-gray-700 text-gray-400'}`}>
                            {isBuyin ? 'IN' : 'OUT'}
                          </span>
                          <span className={`font-semibold text-sm ${isBuyin ? 'text-violet-400' : 'text-gray-300'}`}>
                            {formatMoney(tx.amountCents)}
                          </span>
                          <span className="text-gray-600 text-xs">{time}</span>
                        </div>
                        <span className="text-gray-600 text-xs uppercase tracking-wider">Edit</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSheet({ playerId: ledger.playerId, type: 'buyin' })}
                  className="py-3 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-400 font-semibold text-sm active:bg-violet-600/30"
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

      {/* Remove player confirmation */}
      <BottomSheet open={!!removingPlayerId} onClose={() => setRemovingPlayerId(null)}>
        {(() => {
          const target = session.players.find((p) => p.id === removingPlayerId)
          if (!target) return null
          const txCount = session.transactions.filter((t) => t.playerId === target.id).length
          return (
            <div className="text-center px-2">
              <h3 className="text-white font-bold text-xl mb-2">Remove {target.name}?</h3>
              <p className="text-gray-400 text-sm mb-6">
                {txCount > 0
                  ? `This will also delete ${txCount} transaction${txCount === 1 ? '' : 's'}.`
                  : 'No transactions to remove.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRemovingPlayerId(null)}
                  className="py-4 rounded-xl bg-gray-800 text-gray-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { removePlayer(target.id); setRemovingPlayerId(null) }}
                  className="py-4 rounded-xl bg-rose-600 text-white font-bold active:bg-rose-500"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })()}
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
            className="bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-violet-500"
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
              className="py-4 rounded-xl bg-violet-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold active:bg-violet-500"
            >
              Add
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit transaction sheet */}
      <BottomSheet open={!!editSheet} onClose={() => setEditSheet(null)}>
        {editSheet && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest">
              Edit {editSheet.txType === 'buyin' ? 'Buy In' : 'Cash Out'} · {editSheet.playerName}
            </p>
            <NumPad
              presets={BUYIN_PRESETS_CENTS}
              title={`Currently ${formatMoney(editSheet.currentCents)}`}
              onConfirm={(newAmount) => {
                editTransaction(editSheet.txId, newAmount)
                setEditSheet(null)
              }}
              onCancel={() => setEditSheet(null)}
              allowZero={editSheet.txType === 'buyout'}
            />
            <button
              onClick={() => { removeTransaction(editSheet.txId); setEditSheet(null) }}
              className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm"
            >
              Remove Transaction
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-rose-500/90 backdrop-blur text-white font-semibold text-sm shadow-lg shadow-rose-950/50 max-w-[90%] text-center"
          style={{ bottom: 'calc(max(2rem, var(--safe-bottom)) + 4rem)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
