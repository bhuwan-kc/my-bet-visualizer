'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import FileUpload from '@/components/FileUpload'
import MetricsCards from '@/components/MetricsCards'
import Charts from '@/components/Charts'
import MonthlyPerformance from '@/components/MonthlyPerformance'
import AdvancedCharts from '@/components/AdvancedCharts'
import TransactionTable from '@/components/TransactionTable'
import AISummary from '@/components/AISummary'
import Settings from '@/components/Settings'
import { Storage } from '@/lib/storage'
import { Transaction, Filters, DateRangePreset } from '@/lib/types'
import {
  calculateAnalytics,
  getDateRangeFromPreset,
  getAllTags,
} from '@/lib/analytics'
import { parseISO } from 'date-fns'

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<Filters>({
    dateRange: { start: null, end: null },
    dateRangePreset: 'alltime',
    tags: [],
  })
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const loadData = () => {
    const loadedTransactions = Storage.getTransactions()
    setTransactions(loadedTransactions)
    setAvailableTags(getAllTags(loadedTransactions))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDateRangeChange = (preset: DateRangePreset) => {
    const dateRange = getDateRangeFromPreset(preset)
    setFilters({
      ...filters,
      dateRangePreset: preset,
      dateRange,
    })
  }

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      ...filters,
      dateRangePreset: 'custom',
      dateRange: {
        start: start ? new Date(start) : null,
        end: end ? new Date(end) : null,
      },
    })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    setFilters({ ...filters, tags: newTags })
  }

  const analyticsData = calculateAnalytics(transactions, filters)
  
  // Get filtered transactions for advanced charts
  const filteredTransactions = transactions.filter((t) => {
    // Date range filter
    if (filters.dateRange.start) {
      if (parseISO(t.expDate || t.tradeDate) < filters.dateRange.start) {
        return false
      }
    }
    if (filters.dateRange.end) {
      if (parseISO(t.expDate || t.tradeDate) > filters.dateRange.end) {
        return false
      }
    }
    // Tag filter
    if (filters.tags.length > 0) {
      if (!t.tags.some((tag) => filters.tags.includes(tag))) {
        return false
      }
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-surface flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSettingsClick={() => setShowSettings(true)}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} px-6 lg:px-12 py-4 lg:py-8 pt-16 lg:pt-8 space-y-8 ${isHydrated ? 'transition-all duration-300' : ''}`}>
        {/* File Upload Section */}
        <section id="file-upload">
          <h2 className="text-2xl font-bold mb-4">File Upload</h2>
          <FileUpload onUploadComplete={loadData} />
        </section>

        {transactions.length > 0 && (
          <>
            {/* Filters Section */}
            <section id="filters">
              <h2 className="text-2xl font-bold mb-4">Filters</h2>
              <div className="bg-white dark:bg-dark-elevated rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-border">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Date Range Preset */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRangePreset}
                    onChange={(e) => handleDateRangeChange(e.target.value as DateRangePreset)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm min-w-[150px]"
                  >
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="ytd">Year to Date</option>
                    <option value="alltime">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Custom Date Range */}
                {filters.dateRangePreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        onChange={(e) =>
                          handleCustomDateChange(
                            e.target.value,
                            filters.dateRange.end?.toISOString().split('T')[0] || ''
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        onChange={(e) =>
                          handleCustomDateChange(
                            filters.dateRange.start?.toISOString().split('T')[0] || '',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                      />
                    </div>
                  </div>
                )}

                {/* Tag Filters */}
                {availableTags.length > 0 && (
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Event Types {filters.tags.length > 0 && `(${filters.tags.length} selected)`}
                    </label>
                    <div className="relative">
                      <details className="group">
                        <summary className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm cursor-pointer list-none flex items-center justify-between min-w-[200px]">
                          <span>
                            {filters.tags.length === 0 
                              ? 'All Event Types' 
                              : filters.tags.length === availableTags.length
                              ? 'All Selected'
                              : filters.tags.join(', ')}
                          </span>
                          <span className="ml-2 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => setFilters({ ...filters, tags: [] })}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-elevated rounded"
                            >
                              Clear All
                            </button>
                            <button
                              onClick={() => setFilters({ ...filters, tags: availableTags })}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-elevated rounded"
                            >
                              Select All
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-600" />
                            {availableTags.map((tag) => (
                              <button
                                key={tag}
                                onClick={() => handleTagToggle(tag)}
                                className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${
                                  filters.tags.includes(tag)
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'hover:bg-gray-100 dark:hover:bg-dark-elevated'
                                }`}
                              >
                                <span className="w-4">
                                  {filters.tags.includes(tag) && '✓'}
                                </span>
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </section>

            {/* Overview Section */}
            <section id="overview">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <MetricsCards metrics={analyticsData.coreMetrics} transactions={filteredTransactions} />
            </section>

            {/* Performance Charts Section */}
            <section id="performance">
              <h2 className="text-2xl font-bold mb-4">Performance</h2>
              <div className="space-y-6">
                <MonthlyPerformance transactions={filteredTransactions} />
                <Charts
                  timeSeriesData={analyticsData.timeSeriesData}
                  categoryMetrics={analyticsData.categoryMetrics}
                  stakeSizeDistribution={analyticsData.stakeSizeDistribution}
                  coreMetrics={analyticsData.coreMetrics}
                />
              </div>
            </section>

            {/* Advanced Analytics Section */}
            <section id="analytics">
              <h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2>
              <AdvancedCharts transactions={filteredTransactions} />
            </section>

            {/* Position History Section */}
            <section id="positions">
              <h2 className="text-2xl font-bold mb-4">Position History</h2>
              <TransactionTable
                transactions={transactions}
                onUpdate={loadData}
              />
            </section>

            {/* AI Insights Section */}
            <section id="ai-insights">
              <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
              <AISummary analyticsData={analyticsData} />
            </section>
          </>
        )}

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">
              No Data Yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Upload your Robinhood monthly statements to get started
            </p>
          </div>
        )}
      </main>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

