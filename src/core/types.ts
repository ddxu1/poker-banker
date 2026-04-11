export type PlayerID = string
export type View = 'lobby' | 'game' | 'settlement'

export interface Player {
  id: PlayerID
  name: string
}

export interface Transaction {
  id: string
  playerId: PlayerID
  type: 'buyin' | 'buyout'
  amountCents: number // always stored in cents
  timestamp: number
}

export interface GameSession {
  id: string
  createdAt: number
  players: Player[]
  transactions: Transaction[]
  buyinPresets: number[] // in cents
  status: 'active' | 'settled'
}

// Derived — never stored
export interface PlayerLedger {
  playerId: PlayerID
  name: string
  totalInCents: number
  totalOutCents: number
  netCents: number // positive = won, negative = lost
}

export interface Settlement {
  from: PlayerID
  fromName: string
  to: PlayerID
  toName: string
  amountCents: number
  paid: boolean
}
