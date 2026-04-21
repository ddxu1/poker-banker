import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { GameSession, Player, PlayerID, Settlement, View } from '../core/types'
import { computeSettlements } from '../core/settlement'

export const BUYIN_PRESETS_CENTS = [1000, 2000, 5000, 10000, 20000, 50000] // $10,$20,$50,$100,$200,$500

interface GameStore {
  view: View
  session: GameSession | null
  settlements: Settlement[]
  paidMap: Record<string, boolean>
  history: GameSession[]

  // Lobby actions
  startSession: (playerNames: string[]) => void
  resumeSession: () => void

  // Game actions
  addPlayer: (name: string) => void
  addBuyin: (playerId: PlayerID, amountCents: number) => void
  addBuyout: (playerId: PlayerID, amountCents: number) => void
  editTransaction: (txId: string, newAmountCents: number) => void
  removeTransaction: (txId: string) => void
  endGame: () => void

  // Settlement actions
  togglePaid: (index: number) => void
  newGame: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      view: 'lobby',
      session: null,
      settlements: [],
      paidMap: {},
      history: [],

      startSession: (playerNames) => {
        const players: Player[] = playerNames.map((name) => ({
          id: nanoid(8),
          name: name.trim(),
        }))

        const session: GameSession = {
          id: nanoid(8),
          createdAt: Date.now(),
          players,
          transactions: [],
          buyinPresets: BUYIN_PRESETS_CENTS,
          status: 'active',
        }

        set({ session, view: 'game', settlements: [], paidMap: {} })
      },

      resumeSession: () => {
        const { session } = get()
        if (session?.status === 'active') {
          set({ view: 'game' })
        }
      },

      addPlayer: (name) => {
        const { session } = get()
        if (!session) return
        const player: Player = { id: nanoid(8), name: name.trim() }
        set({ session: { ...session, players: [...session.players, player] } })
      },

      addBuyin: (playerId, amountCents) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            transactions: [
              ...session.transactions,
              { id: nanoid(8), playerId, type: 'buyin', amountCents, timestamp: Date.now() },
            ],
          },
        })
      },

      addBuyout: (playerId, amountCents) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            transactions: [
              ...session.transactions,
              { id: nanoid(8), playerId, type: 'buyout', amountCents, timestamp: Date.now() },
            ],
          },
        })
      },

      editTransaction: (txId, newAmountCents) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            transactions: session.transactions.map((t) =>
              t.id === txId ? { ...t, amountCents: newAmountCents } : t
            ),
          },
        })
      },

      removeTransaction: (txId) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            transactions: session.transactions.filter((t) => t.id !== txId),
          },
        })
      },

      endGame: () => {
        const { session } = get()
        if (!session) return

        const ledgers = session.players.map((p) => {
          const txs = session.transactions.filter((t) => t.playerId === p.id)
          const totalInCents = txs.filter((t) => t.type === 'buyin').reduce((s, t) => s + t.amountCents, 0)
          const totalOutCents = txs.filter((t) => t.type === 'buyout').reduce((s, t) => s + t.amountCents, 0)
          return { playerId: p.id, name: p.name, totalInCents, totalOutCents, netCents: totalOutCents - totalInCents }
        })

        const settlements = computeSettlements(ledgers)

        set({
          session: { ...session, status: 'settled' },
          settlements,
          paidMap: {},
          view: 'settlement',
        })
      },

      togglePaid: (index) => {
        const { paidMap } = get()
        set({ paidMap: { ...paidMap, [index]: !paidMap[index] } })
      },

      newGame: () => {
        const { session, history } = get()
        const updatedHistory =
          session?.status === 'settled'
            ? [session, ...history].slice(0, 10)
            : history
        set({ session: null, settlements: [], paidMap: {}, view: 'lobby', history: updatedHistory })
      },
    }),
    {
      name: 'poker-banker-v1',
    }
  )
)

export function getLedgers(session: GameSession) {
  return session.players.map((p) => {
    const txs = session.transactions.filter((t) => t.playerId === p.id)
    const totalInCents = txs.filter((t) => t.type === 'buyin').reduce((s, t) => s + t.amountCents, 0)
    const totalOutCents = txs.filter((t) => t.type === 'buyout').reduce((s, t) => s + t.amountCents, 0)
    return { playerId: p.id, name: p.name, totalInCents, totalOutCents, netCents: totalOutCents - totalInCents }
  })
}
