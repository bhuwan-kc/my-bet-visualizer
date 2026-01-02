'use client'

import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import FileUpload from '@/components/FileUpload'
import MetricsCards from '@/components/MetricsCards'
import Charts from '@/components/Charts'
import MonthlyPerformance from '@/components/MonthlyPerformance'
import AdvancedCharts from '@/components/AdvancedCharts'
import TransactionTable from '@/components/TransactionTable'
import AISummary from '@/components/AISummary'
import Settings from '@/components/Settings'
import EventTypePerformance from '@/components/EventTypePerformance'
import { Storage } from '@/lib/storage'
import { Transaction, Filters } from '@/lib/types'
import { calculateAnalytics } from '@/lib/analytics'

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [settingsVersion, setSettingsVersion] = useState(0)
  const [ignoredTags, setIgnoredTags] = useState<string[]>([])

  useEffect(() => {
    setIsHydrated(true)
    const settings = Storage.getSettings()
    setIgnoredTags(settings.ignoredTags || [])
  }, [settingsVersion])

  const loadData = () => {
    const loadedTransactions = Storage.getTransactions()
    setTransactions(loadedTransactions)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSettingsChange = () => {
    setSettingsVersion(prev => prev + 1)
  }

  const filters: Filters = {
    dateRange: { start: null, end: null },
    dateRangePreset: 'alltime',
    tags: [],
  }

  const analyticsData = useMemo(
    () => calculateAnalytics(transactions, filters, ignoredTags),
    [transactions, ignoredTags]
  )

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
            {/* Overview Section */}
            <section id="overview">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <MetricsCards metrics={analyticsData.coreMetrics} transactions={transactions} />
            </section>

            {/* Performance Charts Section */}
            <section id="performance">
              <h2 className="text-2xl font-bold mb-4">Performance</h2>
              <div className="space-y-6">
                <MonthlyPerformance transactions={transactions} />
                <EventTypePerformance key={settingsVersion} transactions={transactions} />
                <Charts
                  timeSeriesData={analyticsData.timeSeriesData}
                  categoryMetrics={analyticsData.categoryMetrics}
                  stakeSizeDistribution={[]}
                  coreMetrics={analyticsData.coreMetrics}
                />
              </div>
            </section>

            {/* Advanced Analytics Section */}
            <section id="analytics">
              <h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2>
              <AdvancedCharts 
                key={settingsVersion} 
                transactions={transactions}
                stakeSizeDistribution={analyticsData.stakeSizeDistribution}
              />
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

      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}

