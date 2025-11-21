'use client'

import { Transaction } from '@/lib/types'
import { calculateMonthlyPerformance } from '@/lib/analytics'

interface MonthlyPerformanceProps {
  transactions: Transaction[]
}

export default function MonthlyPerformance({ transactions }: MonthlyPerformanceProps) {
  const monthlyPerf = calculateMonthlyPerformance(transactions)

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  if (monthlyPerf.length === 0) return null

  return (
    <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
      <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-dark-surface">
            <tr>
              <th className="px-4 py-2 text-left">Month</th>
              <th className="px-4 py-2 text-right">Bets</th>
              <th className="px-4 py-2 text-right">Win Rate</th>
              <th className="px-4 py-2 text-right">Total P&L</th>
              <th className="px-4 py-2 text-right">ROI</th>
              <th className="px-4 py-2 text-right">Avg P&L</th>
              <th className="px-4 py-2 text-left">Best Bet</th>
              <th className="px-4 py-2 text-left">Worst Bet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {monthlyPerf.map((month, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2 font-medium">{month.month}</td>
                <td className="px-4 py-2 text-right">{month.totalBets}</td>
                <td className="px-4 py-2 text-right">{formatPercent(month.winRate)}</td>
                <td className={`px-4 py-2 text-right font-medium ${month.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(month.totalPnL)}
                </td>
                <td className={`px-4 py-2 text-right ${month.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(month.roi)}
                </td>
                <td className={`px-4 py-2 text-right ${month.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(month.avgPnL)}
                </td>
                <td className="px-4 py-2 text-green-600">
                  {month.bestBet.description} ({formatCurrency(month.bestBet.pnl)})
                </td>
                <td className="px-4 py-2 text-red-600">
                  {month.worstBet.description} ({formatCurrency(month.worstBet.pnl)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

