'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  TimeSeriesDataPoint,
  CategoryMetrics,
  StakeSizeDistribution,
  CoreMetrics,
} from '@/lib/types'

interface ChartsProps {
  timeSeriesData: TimeSeriesDataPoint[]
  categoryMetrics: CategoryMetrics[]
  stakeSizeDistribution: StakeSizeDistribution[]
  coreMetrics: CoreMetrics
}

export default function Charts({
  timeSeriesData,
  categoryMetrics,
  stakeSizeDistribution,
  coreMetrics,
}: ChartsProps) {
  const [pnlTimeframe, setPnlTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [pnlMetric, setPnlMetric] = useState<'cumulative' | 'net'>('cumulative')
  const [sizeMetric, setSizeMetric] = useState<'frequency' | 'pnl'>('frequency')

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatXAxisDate = (date: string) => {
    // Parse date string properly to avoid timezone issues
    const parts = date.split('-')
    if (pnlTimeframe === 'yearly') {
      // For yearly, the date is just the year string
      return parts[0]
    } else if (pnlTimeframe === 'monthly') {
      // For monthly, format as "MMM YYYY"
      const year = parts[0]
      const month = parseInt(parts[1]) - 1
      const monthName = new Date(2000, month).toLocaleString('default', { month: 'short' })
      return `${monthName} ${year}`
    } else {
      // For daily/weekly, show M/D
      const d = new Date(date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    }
  }

  // Aggregate time series data based on timeframe
  const aggregatedTimeSeriesData = () => {
    if (pnlTimeframe === 'daily' || timeSeriesData.length === 0) {
      return timeSeriesData
    }

    // Group by timeframe
    const grouped = new Map<string, { pnl: number; count: number; cumulative: number }>()
    
    timeSeriesData.forEach((point, index) => {
      const date = new Date(point.date)
      let key: string
      
      if (pnlTimeframe === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else if (pnlTimeframe === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else { // yearly
        key = date.getFullYear().toString()
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, { pnl: 0, count: 0, cumulative: point.cumulativePnL })
      }
      const existing = grouped.get(key)!
      existing.pnl += point.pnl
      existing.count++
      existing.cumulative = point.cumulativePnL // Use last cumulative value
    })
    
    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      pnl: data.pnl,
      cumulativePnL: data.cumulative,
    }))
  }

  const displayData = aggregatedTimeSeriesData()

  return (
    <div className="space-y-6">
      {/* Profit & Loss Over Time */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-dark-elevated dark:to-dark-surface rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Profit & Loss Over Time</h3>
            <select
              value={pnlTimeframe}
              onChange={(e) => setPnlTimeframe(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex gap-2 border-b border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setPnlMetric('cumulative')}
              className={`px-4 py-2 font-medium transition-colors ${
                pnlMetric === 'cumulative'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Cumulative
            </button>
            <button
              onClick={() => setPnlMetric('net')}
              className={`px-4 py-2 font-medium transition-colors ${
                pnlMetric === 'net'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Net P&L
            </button>
          </div>
        </div>
        {displayData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            {pnlMetric === 'cumulative' ? (
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisDate}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativePnL"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Cumulative P&L"
                  dot={{ r: 3 }}
                />
              </LineChart>
            ) : (
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisDate}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Bar
                  dataKey="pnl"
                  fill="#10b981"
                  name="Net P&L"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
        </div>
      </div>

      {/* Position Size Distribution */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-dark-elevated dark:to-dark-surface rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">Position Size Distribution</h3>
          <div className="flex gap-2 border-b border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setSizeMetric('frequency')}
              className={`px-4 py-2 font-medium transition-colors ${
                sizeMetric === 'frequency'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Frequency
            </button>
            <button
              onClick={() => setSizeMetric('pnl')}
              className={`px-4 py-2 font-medium transition-colors ${
                sizeMetric === 'pnl'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Net P&L
            </button>
          </div>
        </div>
          {stakeSizeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stakeSizeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  label={{ value: 'Position Size (contracts)', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis 
                  label={{ 
                    value: sizeMetric === 'frequency' ? 'Frequency' : 'Net P&L ($)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={sizeMetric === 'pnl' ? formatCurrency : undefined}
                />
                <Tooltip 
                  formatter={(value: number) => 
                    sizeMetric === 'pnl' ? formatCurrency(value) : value
                  }
                />
                <Bar
                  dataKey={sizeMetric === 'frequency' ? 'count' : 'totalPnL'}
                  fill={sizeMetric === 'frequency' ? '#10b981' : '#2563eb'}
                  name={sizeMetric === 'frequency' ? 'Frequency' : 'Net P&L'}
                >
                  {sizeMetric === 'pnl' && stakeSizeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry.totalPnL ?? 0) >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

