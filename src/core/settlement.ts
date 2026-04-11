import type { PlayerLedger, Settlement } from './types'

/**
 * Computes the minimum number of transactions to settle all debts.
 * Uses a greedy two-pointer approach: match the largest debtor to the
 * largest creditor each round, eliminating at least one person per transaction.
 */
export function computeSettlements(ledgers: PlayerLedger[]): Settlement[] {
  // Build mutable balance list (in cents, positive = owed money, negative = owes money)
  const balances = ledgers
    .filter((l) => l.netCents !== 0)
    .map((l) => ({ playerId: l.playerId, name: l.name, net: l.netCents }))

  const creditors = balances.filter((b) => b.net > 0).sort((a, b) => b.net - a.net)
  const debtors = balances.filter((b) => b.net < 0).sort((a, b) => a.net - b.net)

  const result: Settlement[] = []

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0]
    const creditor = creditors[0]
    const amount = Math.min(Math.abs(debtor.net), creditor.net)

    result.push({
      from: debtor.playerId,
      fromName: debtor.name,
      to: creditor.playerId,
      toName: creditor.name,
      amountCents: amount,
      paid: false,
    })

    debtor.net += amount
    creditor.net -= amount

    if (debtor.net === 0) debtors.shift()
    if (creditor.net === 0) creditors.shift()
  }

  return result
}

export function dollarsTocents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function centsToDollars(cents: number): number {
  return cents / 100
}

export function formatMoney(cents: number): string {
  const abs = Math.abs(cents)
  const dollars = abs / 100
  return '$' + (dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2))
}
