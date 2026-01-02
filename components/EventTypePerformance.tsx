'use client'

import { useState, useEffect } from 'react'
import { Transaction } from '@/lib/types'
import { calculateEventTypePerformance, TimePeriod, EventTypePerformance as EventTypePerformanceData } from '@/lib/analytics'
import { Storage } from '@/lib/storage'

interface EventTypePerformanceProps {
  transactions: Transaction[]
}

type SortField = 'eventType' | 'totalBets' | 'wins' | 'losses' | 'totalPnL' | 'roi' | 'winRate'
type SortDirection = 'asc' | 'desc'

export default function EventTypePerformance({ transactions }: EventTypePerformanceProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('alltime')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('totalBets')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [ignoredTags, setIgnoredTags] = useState<string[]>([])
  const itemsPerPage = 10
  
  useEffect(() => {
    const settings = Storage.getSettings()
    setIgnoredTags(settings.ignoredTags || [])
  }, [])

  const allPerformanceData = calculateEventTypePerformance(transactions, timePeriod)
  const performanceData = allPerformanceData.filter(data => !ignoredTags.includes(data.eventType))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  // Sort data
  const sortedData = [...performanceData].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'eventType':
        aValue = a.eventType.toLowerCase()
        bValue = b.eventType.toLowerCase()
        break
      case 'totalBets':
        aValue = a.totalBets
        bValue = b.totalBets
        break
      case 'wins':
        aValue = a.wins
        bValue = b.wins
        break
      case 'losses':
        aValue = a.losses
        bValue = b.losses
        break
      case 'totalPnL':
        aValue = a.totalPnL
        bValue = b.totalPnL
        break
      case 'roi':
        aValue = a.roi
        bValue = b.roi
        break
      case 'winRate':
        aValue = a.winRate
        bValue = b.winRate
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)

  const handleTimePeriodChange = (newPeriod: TimePeriod) => {
    setTimePeriod(newPeriod)
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400 ml-1">↕</span>
    return sortDirection === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>
  }

  if (performanceData.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Event Type Summary</h3>
          <select
            value={timePeriod}
            onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriod)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="alltime">All Time</option>
          </select>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available for the selected time period
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Event Type Summary</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {performanceData.length} event types
          </p>
        </div>
        <select
          value={timePeriod}
          onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriod)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="alltime">All Time</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-dark-surface">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('eventType')}
              >
                Event Type <SortIcon field="eventType" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('totalBets')}
              >
                Total Bets <SortIcon field="totalBets" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('wins')}
              >
                Wins <SortIcon field="wins" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('losses')}
              >
                Losses <SortIcon field="losses" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('totalPnL')}
              >
                Total P&L <SortIcon field="totalPnL" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('roi')}
              >
                ROI <SortIcon field="roi" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('winRate')}
              >
                Win Rate <SortIcon field="winRate" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((data, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-3 font-medium">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    {data.eventType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{data.totalBets}</td>
                <td className="px-4 py-3 text-right text-green-600">{data.wins}</td>
                <td className="px-4 py-3 text-right text-red-600">{data.losses}</td>
                <td className={`px-4 py-3 text-right font-medium ${
                  data.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(data.totalPnL)}
                </td>
                <td className={`px-4 py-3 text-right ${
                  data.roi >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(data.roi)}
                </td>
                <td className="px-4 py-3 text-right">{formatPercent(data.winRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {performanceData.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-border">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} event types
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-dark-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-dark-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-dark-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-dark-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

