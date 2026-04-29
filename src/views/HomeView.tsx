import { useState } from 'react'
import { useGameStore, getLedgers } from '../store/gameStore'
import { computeSettlements, formatMoney } from '../core/settlement'
import type { GameSession } from '../core/types'

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
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function CopyIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function HistoryEntry({ session }: { session: GameSession }) {
  const togglePaidInHistory = useGameStore((s) => s.togglePaidInHistory)
  const setHistoryDate = useGameStore((s) => s.setHistoryDate)
  const [expanded, setExpanded] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [copied, setCopied] = useState(false)

  const ledgers = getLedgers(session)
  const settlements = computeSettlements(ledgers)
  const totalInCents = ledgers.reduce((s, l) => s + l.totalInCents, 0)
  const totalOutCents = ledgers.reduce((s, l) => s + l.totalOutCents, 0)
  const paidMap = session.paidMap ?? {}
  const paidCount = settlements.filter((_, i) => paidMap[i]).length
  const allPaid = settlements.length > 0 && paidCount === settlements.length

  const dateTime = formatDateTime(session.createdAt)

  const sortedLedgers = [...ledgers].sort((a, b) => b.netCents - a.netCents)

  function copyHistory(e: React.MouseEvent) {
    e.stopPropagation()
    const lines = [
      `PokerBank — ${dateTime}`,
      '',
      ...sortedLedgers.map((l) => `${l.name}: ${l.netCents > 0 ? '+' : ''}${formatMoney(l.netCents)}`),
      '',
      'Transfers',
      ...settlements.map((s, i) => {
        const mark = paidMap[i] ? '[x]' : '[ ]'
        return `${mark} ${s.fromName} -> ${s.toName}: ${formatMoney(s.amountCents)}`
      }),
    ]
    navigator.clipboard?.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between px-4 py-3.5 text-left active:bg-gray-700/40"
      >
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm">{dateTime}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate tabular-nums">
            {session.players.length}-handed · {Math.round(totalInCents / 100)}→{Math.round(totalOutCents / 100)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {settlements.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  allPaid
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                    : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]'
                }`}
              />
              <span className="text-gray-500 text-xs tabular-nums">
                {paidCount}/{settlements.length}
              </span>
            </span>
          )}
          <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-700/50 pt-2 pb-3 flex flex-col gap-3">
          {/* Editable date row */}
          <div className="px-4 flex items-center justify-between gap-2 -mb-1">
            {editingDate ? (
              <input
                type="datetime-local"
                autoFocus
                defaultValue={tsToLocalInput(session.createdAt)}
                onChange={(e) => setHistoryDate(session.id, localInputToTs(e.target.value))}
                onBlur={() => setEditingDate(false)}
                className="bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-1.5 outline-none border border-violet-500/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 tabular-nums [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-datetime-edit]:text-gray-200"
              />
            ) : (
              <button
                onClick={() => setEditingDate(true)}
                className="text-gray-500 text-xs active:text-gray-300 underline decoration-dotted underline-offset-2"
              >
                {dateTime}
              </button>
            )}
            <button
              onClick={copyHistory}
              className={`p-1.5 rounded-md transition-colors ${copied ? 'text-emerald-400' : 'text-gray-500 active:text-gray-200'}`}
              aria-label="Copy summary"
              title={copied ? 'Copied' : 'Copy summary'}
            >
              <CopyIcon />
            </button>
          </div>

          <div className="flex flex-col">
            {sortedLedgers.map((l, idx) => (
              <div
                key={l.playerId}
                className={`flex justify-between text-sm px-4 py-2 ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}
              >
                <span className="text-gray-200">{l.name}</span>
                <span className={`font-semibold tabular-nums ${l.netCents > 0 ? 'text-emerald-400' : l.netCents < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                  {l.netCents > 0 ? '+' : ''}{formatMoney(l.netCents)}
                </span>
              </div>
            ))}
          </div>

          {settlements.length > 0 && (
            <div className="border-t border-gray-700/50 pt-2 flex flex-col">
              {settlements.map((s, i) => {
                const paid = !!paidMap[i]
                return (
                  <button
                    key={i}
                    onClick={() => togglePaidInHistory(session.id, i)}
                    className={`flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                      i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                    } active:bg-white/[0.06]`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          paid ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'
                        }`}
                      >
                        {paid && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                      </span>
                      <span className={`text-sm truncate ${paid ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                        {s.fromName} → {s.toName}
                      </span>
                    </div>
                    <span className={`font-semibold text-sm tabular-nums shrink-0 ml-2 ${paid ? 'text-gray-600' : 'text-gray-100'}`}>
                      {formatMoney(s.amountCents)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

const DEV_PANEL_ENABLED =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && window.location.search.includes('playground'))

export default function HomeView() {
  const { history, session, resumeSession, goToLobby, seedDemoHistory, clearAll } = useGameStore()

  return (
    <div className="flex flex-col min-h-dvh px-4" style={{ paddingTop: 'max(2rem, var(--safe-top))' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black tracking-tight">
          <span className="text-violet-400">Poker</span>
          <span className="text-white">Bank</span>
        </h1>
      </div>

      {/* Resume banner */}
      {session?.status === 'active' && (
        <button
          onClick={resumeSession}
          className="mb-4 w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-left active:bg-yellow-500/20"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <p className="text-yellow-400 font-semibold text-sm">Game in progress</p>
          </div>
          <p className="text-gray-400 text-xs ml-4">
            {session.players.length} players · Tap to resume
          </p>
        </button>
      )}

      {/* New game CTA */}
      <button
        onClick={goToLobby}
        className="mb-6 w-full py-5 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-700 to-violet-950 border border-violet-500/40 text-white font-bold text-lg shadow-lg shadow-violet-950/50 active:from-violet-600 transition-colors"
      >
        + Start New Game
      </button>

      {/* Dev playground panel */}
      {DEV_PANEL_ENABLED && (
        <div className="mb-6 rounded-2xl border border-dashed border-violet-700/40 bg-violet-950/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.2em]">Playground</p>
            <span className="text-[10px] text-gray-500 font-mono">
              {import.meta.env.DEV ? 'dev' : '?playground'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={seedDemoHistory}
              className="py-2.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-semibold active:bg-violet-600/40"
            >
              Seed demo games
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all sessions and history?')) clearAll()
              }}
              className="py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold active:bg-gray-700"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Past games */}
      <div className="flex-1 pb-8" style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Past Games {history.length > 0 && <span className="text-gray-600">· {history.length}</span>}
        </p>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-800/20 px-6 py-12 text-center">
            <p className="text-gray-400 font-medium text-sm">No games yet</p>
            <p className="text-gray-600 text-xs mt-1">Start your first game to see it here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((s) => (
              <HistoryEntry key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
