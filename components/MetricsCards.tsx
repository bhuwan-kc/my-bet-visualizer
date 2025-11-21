'use client'

import { CoreMetrics } from '@/lib/types'
import { Transaction } from '@/lib/types'
import { calculateProfitFactor } from '@/lib/analytics'

interface MetricsCardsProps {
  metrics: CoreMetrics
  transactions?: Transaction[]
}

export default function MetricsCards({ metrics, transactions = [] }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const profitFactor = transactions.length > 0 ? calculateProfitFactor(transactions) : 0
  const profitFactorColor = 
    profitFactor >= 2 ? 'text-green-600' : 
    profitFactor >= 1.5 ? 'text-lime-600' : 
    profitFactor >= 1 ? 'text-yellow-600' : 
    'text-red-600'

  // Calculate ROI
  const totalInvested = transactions.reduce((sum, t) => sum + Math.abs(t.qtyLong * 0.5), 0)
  const roi = totalInvested > 0 ? (metrics.totalPnL / totalInvested) * 100 : 0

  const cards = [
    {
      label: 'Total P&L',
      value: formatCurrency(metrics.totalPnL),
      color: metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'ROI',
      value: `${roi.toFixed(1)}%`,
      color: roi >= 0 ? 'text-green-600' : 'text-red-600',
      tooltip: 'Return on Investment = (Total P&L ÷ Total Invested) × 100%',
    },
    {
      label: 'Win Rate',
      value: formatPercent(metrics.winRate),
      color: 'text-blue-600',
    },
    {
      label: 'Total Bets',
      value: metrics.totalBets.toString(),
      color: 'text-gray-900 dark:text-gray-100',
      subtitle: `${metrics.winningBets}W / ${metrics.losingBets}L`,
    },
    {
      label: 'Avg Stake Size',
      value: formatCurrency(metrics.avgStakeSize),
      color: 'text-gray-900 dark:text-gray-100',
    },
    {
      label: 'Profit Factor',
      value: profitFactor.toFixed(2),
      color: profitFactorColor,
      subtitle: profitFactor >= 2 ? 'Excellent' : profitFactor >= 1.5 ? 'Good' : profitFactor >= 1 ? 'Break-even' : 'Losing',
      tooltip: 'Total Wins ÷ Total Losses. Higher is better.',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gradient-to-br dark:from-dark-elevated dark:to-dark-surface rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-border relative group hover:shadow-lg dark:hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-purple-500/0 dark:group-hover:from-blue-500/5 dark:group-hover:to-purple-500/5 rounded-lg transition-all duration-300 pointer-events-none"></div>
          <div className="relative z-10">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            {card.label}
            {(card as any).tooltip && (
              <span className="relative">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                  {(card as any).tooltip}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </span>
            )}
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>
            {card.value}
          </div>
          {(card as any).subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(card as any).subtitle}
            </div>
          )}
          </div>
        </div>
      ))}
    </div>
  )
}

