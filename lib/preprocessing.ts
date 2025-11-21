/**
 * Transaction Preprocessing Module
 * 
 * Handles all data preprocessing steps before storage:
 * - Combining transaction pairs (purchase + sale)
 * - Future: validation, enrichment, filtering, etc.
 * 
 * Why: Robinhood PDFs show each bet as two rows (purchase + sale).
 * We combine them to get one position per bet with net P&L.
 */

import { Transaction } from './types'

/**
 * Check if two transactions form a pair (same bet)
 */
function isPair(t1: Transaction, t2: Transaction): boolean {
  return (
    t1.tradeDate === t2.tradeDate &&
    t1.symbol === t2.symbol &&
    t1.description === t2.description
  )
}

/**
 * Combine pairs of transactions into single positions
 * 
 * @param transactions - Raw transactions from PDF parser
 * @returns Combined positions with net P&L
 * 
 * Example:
 *   Input:  [{ pnl: -19.00 }, { pnl: 25.00 }]  (purchase + sale)
 *   Output: [{ pnl: 6.00 }]                     (net position)
 */
export function combineTransactionPairs(transactions: Transaction[]): Transaction[] {
  const combined: Transaction[] = []
  let i = 0

  while (i < transactions.length) {
    const current = transactions[i]

    // Check if there's a next transaction that pairs with this one
    if (i + 1 < transactions.length) {
      const next = transactions[i + 1]

      if (isPair(current, next)) {
        // Combine the two transactions
        const netPnL = current.tradePrice + next.tradePrice

        combined.push({
          ...current,
          tradePrice: netPnL, // Net P&L
        })

        i += 2 // Skip both transactions
        continue
      }
    }

    // If no pair found, keep the transaction as-is
    combined.push(current)
    i += 1
  }

  return combined
}

