import { nanoid } from 'nanoid'
import type { GameSession, Player, Transaction } from '../core/types'

const DAY = 24 * 60 * 60 * 1000

interface SeedSpec {
  daysAgo: number
  players: { name: string; buyins: number[]; cashout: number }[] // dollars
}

const SPECS: SeedSpec[] = [
  {
    daysAgo: 2,
    players: [
      { name: 'Danny',  buyins: [100, 100],       cashout: 340 },
      { name: 'Mira',   buyins: [100],            cashout: 0 },
      { name: 'Theo',   buyins: [100, 50],        cashout: 80 },
      { name: 'Priya',  buyins: [100],            cashout: 130 },
      { name: 'Jonas',  buyins: [100, 100],       cashout: 0 },
    ],
  },
  {
    daysAgo: 9,
    players: [
      { name: 'Danny',  buyins: [50],             cashout: 220 },
      { name: 'Sam',    buyins: [50, 50, 50],     cashout: 0 },
      { name: 'Lin',    buyins: [50, 50],         cashout: 80 },
      { name: 'Theo',   buyins: [50, 50],         cashout: 50 },
    ],
  },
  {
    daysAgo: 21,
    players: [
      { name: 'Mira',   buyins: [100],            cashout: 90 },
      { name: 'Priya',  buyins: [100],            cashout: 110 },
      { name: 'Danny',  buyins: [100],            cashout: 100 },
    ],
  },
  {
    daysAgo: 47,
    players: [
      { name: 'Jonas',  buyins: [200, 100],       cashout: 0 },
      { name: 'Sam',    buyins: [200],            cashout: 460 },
      { name: 'Lin',    buyins: [200],            cashout: 180 },
      { name: 'Theo',   buyins: [200, 100],       cashout: 60 },
      { name: 'Danny',  buyins: [200],            cashout: 200 },
    ],
  },
]

function buildSession(spec: SeedSpec): GameSession {
  const createdAt = Date.now() - spec.daysAgo * DAY
  const players: Player[] = spec.players.map((p) => ({ id: nanoid(8), name: p.name }))

  const transactions: Transaction[] = []
  spec.players.forEach((p, i) => {
    const player = players[i]
    let t = createdAt + 5 * 60 * 1000
    p.buyins.forEach((amt) => {
      transactions.push({
        id: nanoid(8),
        playerId: player.id,
        type: 'buyin',
        amountCents: amt * 100,
        timestamp: t,
      })
      t += 35 * 60 * 1000
    })
    transactions.push({
      id: nanoid(8),
      playerId: player.id,
      type: 'buyout',
      amountCents: p.cashout * 100,
      timestamp: createdAt + 4 * 60 * 60 * 1000 + i * 60 * 1000,
    })
  })

  return {
    id: nanoid(8),
    createdAt,
    players,
    transactions,
    buyinPresets: [1000, 2000, 5000, 10000, 20000, 50000],
    status: 'settled',
  }
}

export function buildSeedHistory(): GameSession[] {
  return SPECS.map(buildSession)
}
