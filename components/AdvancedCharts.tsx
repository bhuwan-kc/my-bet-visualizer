'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { Transaction } from '@/lib/types'
import {
  calculateROIByEventType,
  calculateRiskOfRuin,
} from '@/lib/analytics'

interface AdvancedChartsProps {
  transactions: Transaction[]
}

export default function AdvancedCharts({ transactions }: AdvancedChartsProps) {
  const [performanceMetric, setPerformanceMetric] = useState<'roi' | 'pnl'>('pnl')
  const roiByType = calculateROIByEventType(transactions)
  const riskOfRuin = calculateRiskOfRuin(transactions, 1000)

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Performance by Event Type */}
      {roiByType.length > 0 && (
        <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 group relative mb-3">
              Performance by Event Type
              <span className="text-sm text-gray-400 cursor-help">ⓘ
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-80 z-10 pointer-events-none">
                  <strong>ROI (Return on Investment)</strong> = (Total P&L ÷ Total Invested) × 100%. Shows profitability percentage for each event type.
                  <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </span>
            </h3>
            <div className="flex gap-2 border-b border-gray-200 dark:border-dark-border">
              <button
                onClick={() => setPerformanceMetric('pnl')}
                className={`px-4 py-2 font-medium transition-colors ${
                  performanceMetric === 'pnl'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Profit & Loss
              </button>
              <button
                onClick={() => setPerformanceMetric('roi')}
                className={`px-4 py-2 font-medium transition-colors ${
                  performanceMetric === 'roi'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                ROI %
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(300, roiByType.length * 40)}>
            <BarChart 
              data={[...roiByType].sort((a, b) => performanceMetric === 'roi' ? b.roi - a.roi : b.totalPnL - a.totalPnL)} 
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                label={{ 
                  value: performanceMetric === 'roi' ? 'ROI (%)' : 'Profit & Loss ($)', 
                  position: 'insideBottom', 
                  offset: -5 
                }} 
                tickFormatter={performanceMetric === 'pnl' ? formatCurrency : undefined}
              />
              <YAxis type="category" dataKey="eventType" width={100} />
              <Tooltip 
                formatter={(value: number) => 
                  performanceMetric === 'roi' ? `${value.toFixed(1)}%` : formatCurrency(value)
                } 
              />
              <ReferenceLine x={0} stroke="#000" />
              <Bar dataKey={performanceMetric === 'roi' ? 'roi' : 'totalPnL'} name={performanceMetric === 'roi' ? 'ROI (%)' : 'Profit & Loss'}>
                {roiByType.map((entry, index) => {
                  const value = performanceMetric === 'roi' ? entry.roi : entry.totalPnL
                  return <Cell key={`cell-${index}`} fill={value >= 0 ? '#10b981' : '#ef4444'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk of Ruin Analysis */}
      <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 group relative">
          Risk Analysis
          <span className="text-sm text-gray-400 cursor-help">ⓘ
            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-80 z-10 pointer-events-none">
              Analysis based on $1,000 bankroll. Risk of Ruin = probability of significant loss. Expected = projection after 100 bets.
              <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-surface rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Risk of Ruin</div>
                <div className={`text-3xl font-bold ${riskOfRuin.probability > 50 ? 'text-red-600' : riskOfRuin.probability > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {riskOfRuin.probability.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-surface rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Expected Bankroll (100 bets)</div>
                <div className="text-2xl font-bold">{formatCurrency(riskOfRuin.expectedBankroll)}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Best Case Scenario</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(riskOfRuin.bestCaseScenario)}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Worst Case Scenario</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(riskOfRuin.worstCaseScenario)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
