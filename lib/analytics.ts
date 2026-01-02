import {
  Transaction,
  Filters,
  CoreMetrics,
  TimeSeriesDataPoint,
  CategoryMetrics,
  StakeSizeDistribution,
  AnalyticsData,
} from './types'
import { format, parseISO } from 'date-fns'

export function filterTransactions(
  transactions: Transaction[],
  filters: Filters
): Transaction[] {
  let filtered = [...transactions]

  // Filter by expiration date (when contract settles and P&L is realized)
  if (filters.dateRange.start) {
    filtered = filtered.filter(
      (t) => parseISO(t.expDate || t.tradeDate) >= filters.dateRange.start!
    )
  }

  if (filters.dateRange.end) {
    filtered = filtered.filter(
      (t) => parseISO(t.expDate || t.tradeDate) <= filters.dateRange.end!
    )
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((t) =>
      t.tags.some((tag) => filters.tags.includes(tag))
    )
  }

  return filtered
}

export function getDateRangeFromPreset(preset: string): {
  start: Date | null
  end: Date | null
} {
  const now = new Date()
  const start = new Date()

  switch (preset) {
    case 'last7days':
      start.setDate(now.getDate() - 7)
      return { start, end: now }
    case 'last30days':
      start.setDate(now.getDate() - 30)
      return { start, end: now }
    case 'ytd':
      start.setMonth(0, 1)
      return { start, end: now }
    case 'alltime':
      return { start: null, end: null }
    case 'custom':
      return { start: null, end: null }
    default:
      return { start: null, end: null }
  }
}

function calculatePnL(transaction: Transaction): number {
  // IMPORTANT: For "Purchase and Sale Summary" transactions,
  // tradePrice already contains the NET P&L (not a price to calculate from)
  // The parser combines purchase + sale pairs and stores net P&L in tradePrice
  if (transaction.tradeType === 'Closed Position') {
    // tradePrice is already the net P&L
    return transaction.tradePrice - transaction.totalFees
  }
  
  // Legacy logic for other trade types (if any)
  if (transaction.tradeType === 'Final Settlement') {
    return transaction.qtyLong * transaction.tradePrice - transaction.totalFees
  } else {
    return -transaction.qtyLong * transaction.tradePrice - transaction.totalFees
  }
}

export function calculateCoreMetrics(
  transactions: Transaction[]
): CoreMetrics {
  if (transactions.length === 0) {
    return {
      totalPnL: 0,
      winRate: 0,
      totalBets: 0,
      avgStakeSize: 0,
      totalFees: 0,
      winningBets: 0,
      losingBets: 0,
    }
  }

  const totalPnL = transactions.reduce((sum, t) => sum + calculatePnL(t), 0)
  const totalFees = transactions.reduce((sum, t) => sum + t.totalFees, 0)

  // Each transaction is now a complete position (after pairing)
  // Win/loss is determined by P&L for each individual transaction
  const winningTrades = transactions.filter((t) => calculatePnL(t) > 0).length
  const losingTrades = transactions.filter((t) => calculatePnL(t) < 0).length
  const totalTrades = transactions.length
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0

  // For "Closed Position" transactions, tradePrice is P&L, not stake
  // Stake size would be the cost basis, which we don't have directly
  // Use qtyLong as a proxy for position size
  const avgStakeSize = totalTrades > 0
    ? transactions.reduce((sum, t) => sum + t.qtyLong, 0) / totalTrades
    : 0

  return {
    totalPnL,
    winRate,
    totalBets: totalTrades,
    avgStakeSize,
    totalFees,
    winningBets: winningTrades,
    losingBets: losingTrades,
  }
}

export function calculateTimeSeriesData(
  transactions: Transaction[]
): TimeSeriesDataPoint[] {
  if (transactions.length === 0) return []

  // Sort by expiration date (when contract settles and P&L is determined)
  const sortedTransactions = [...transactions].sort(
    (a, b) => parseISO(a.expDate || a.tradeDate).getTime() - parseISO(b.expDate || b.tradeDate).getTime()
  )

  const dailyData = new Map<string, { pnl: number; count: number }>()

  sortedTransactions.forEach((t) => {
    // Use expiration date for grouping (when P&L is realized)
    const date = (t.expDate || t.tradeDate).split('T')[0]
    const pnl = calculatePnL(t)

    if (dailyData.has(date)) {
      const existing = dailyData.get(date)!
      dailyData.set(date, {
        pnl: existing.pnl + pnl,
        count: existing.count + 1,
      })
    } else {
      dailyData.set(date, { pnl, count: 1 })
    }
  })

  let cumulativePnL = 0
  const timeSeriesData: TimeSeriesDataPoint[] = []

  Array.from(dailyData.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([date, data]) => {
      cumulativePnL += data.pnl
      timeSeriesData.push({
        date,
        pnl: data.pnl,
        cumulativePnL,
        tradeCount: data.count,
      })
    })

  return timeSeriesData
}

export function calculateCategoryMetrics(
  transactions: Transaction[],
  ignoredTags: string[] = []
): CategoryMetrics[] {
  if (transactions.length === 0) return []

  const categoryMap = new Map<
    string,
    { transactions: Transaction[]; symbols: Set<string> }
  >()

  transactions.forEach((t) => {
    t.tags.forEach((tag) => {
      // Skip ignored tags
      if (ignoredTags.includes(tag)) return
      
      if (!categoryMap.has(tag)) {
        categoryMap.set(tag, { transactions: [], symbols: new Set() })
      }
      const category = categoryMap.get(tag)!
      category.transactions.push(t)
      category.symbols.add(t.symbol)
    })
  })

  const categoryMetrics: CategoryMetrics[] = []

  categoryMap.forEach((data, category) => {
    const pnl = data.transactions.reduce((sum, t) => sum + calculatePnL(t), 0)
    
    // Each transaction is now a complete position
    const totalTrades = data.transactions.length
    const winningTrades = data.transactions.filter((t) => calculatePnL(t) > 0).length
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0

    // Use qtyLong as proxy for position size
    const avgStakeSize = totalTrades > 0
      ? data.transactions.reduce((sum, t) => sum + t.qtyLong, 0) / totalTrades
      : 0

    categoryMetrics.push({
      category,
      pnl,
      tradeCount: totalTrades,
      winRate,
      avgStakeSize,
    })
  })

  return categoryMetrics.sort((a, b) => b.pnl - a.pnl)
}

export function calculateStakeSizeDistribution(
  transactions: Transaction[]
): StakeSizeDistribution[] {
  // For "Closed Position" transactions, use qtyLong as position size
  if (transactions.length === 0) return []

  // Count frequency and calculate net P&L for each position size
  const sizeData = new Map<number, { count: number; totalPnL: number }>()
  
  transactions.forEach((t) => {
    const size = t.qtyLong
    const pnl = calculatePnL(t)
    
    if (sizeData.has(size)) {
      const existing = sizeData.get(size)!
      sizeData.set(size, {
        count: existing.count + 1,
        totalPnL: existing.totalPnL + pnl,
      })
    } else {
      sizeData.set(size, { count: 1, totalPnL: pnl })
    }
  })

  // Convert to array and sort by size, only include sizes with count > 0
  const distribution: StakeSizeDistribution[] = Array.from(sizeData.entries())
    .filter(([_, data]) => data.count > 0)
    .map(([size, data]) => ({
      range: size.toString(),
      count: data.count,
      totalPnL: data.totalPnL,
    }))
    .sort((a, b) => parseInt(a.range) - parseInt(b.range))

  return distribution
}

export function calculateAnalytics(
  transactions: Transaction[],
  filters: Filters,
  ignoredTags: string[] = []
): AnalyticsData {
  const filteredTransactions = filterTransactions(transactions, filters)

  return {
    coreMetrics: calculateCoreMetrics(filteredTransactions),
    timeSeriesData: calculateTimeSeriesData(filteredTransactions),
    categoryMetrics: calculateCategoryMetrics(filteredTransactions, ignoredTags),
    stakeSizeDistribution: calculateStakeSizeDistribution(filteredTransactions),
  }
}

export function getAllTags(transactions: Transaction[]): string[] {
  const tagSet = new Set<string>()
  transactions.forEach((t) => {
    t.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}

// Advanced Analytics Functions

// ROI by Event Type
export interface ROIByType {
  eventType: string
  roi: number
  totalInvested: number
  totalPnL: number
  betCount: number
  winRate: number
}

export function calculateROIByEventType(
  transactions: Transaction[],
  ignoredTags: string[] = []
): ROIByType[] {
  if (transactions.length === 0) return []

  const grouped = new Map<string, Transaction[]>()

  transactions.forEach((t) => {
    t.tags.forEach((tag) => {
      // Skip ignored tags
      if (ignoredTags.includes(tag)) return
      
      if (!grouped.has(tag)) {
        grouped.set(tag, [])
      }
      grouped.get(tag)!.push(t)
    })
  })

  const results: ROIByType[] = []
  grouped.forEach((txns, eventType) => {
    const totalPnL = txns.reduce((sum, t) => sum + calculatePnL(t), 0)
    const totalInvested = txns.reduce((sum, t) => sum + Math.abs(t.qtyLong * 0.5), 0) // Approximate investment
    const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
    const wins = txns.filter((t) => calculatePnL(t) > 0).length
    const winRate = (wins / txns.length) * 100

    results.push({
      eventType,
      roi,
      totalInvested,
      totalPnL,
      betCount: txns.length,
      winRate,
    })
  })

  return results.sort((a, b) => b.roi - a.roi)
}

// Monthly Performance Summary
export interface MonthlyPerformance {
  month: string
  monthKey: string
  totalBets: number
  winRate: number
  totalPnL: number
  roi: number
  bestBet: { description: string; pnl: number }
  worstBet: { description: string; pnl: number }
  avgPnL: number
}

export function calculateMonthlyPerformance(
  transactions: Transaction[]
): MonthlyPerformance[] {
  if (transactions.length === 0) return []

  const grouped = new Map<string, Transaction[]>()

  transactions.forEach((t) => {
    if (!t.expDate) return // Skip transactions without expDate
    const month = format(parseISO(t.expDate), 'yyyy-MM')
    if (!grouped.has(month)) {
      grouped.set(month, [])
    }
    grouped.get(month)!.push(t)
  })

  const results: MonthlyPerformance[] = []
  grouped.forEach((txns, month) => {
    const pnls = txns.map((t) => ({ t, pnl: calculatePnL(t) }))
    const wins = pnls.filter((p) => p.pnl > 0).length
    const totalPnL = pnls.reduce((sum, p) => sum + p.pnl, 0)
    const totalInvested = txns.reduce((sum, t) => sum + Math.abs(t.qtyLong * 0.5), 0)
    const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    const sortedByPnL = pnls.sort((a, b) => b.pnl - a.pnl)
    const best = sortedByPnL[0]
    const worst = sortedByPnL[sortedByPnL.length - 1]

    results.push({
      month: format(parseISO(month + '-01'), 'MMM yyyy'),
      monthKey: month, // Keep the original yyyy-MM format for sorting
      totalBets: txns.length,
      winRate: (wins / txns.length) * 100,
      totalPnL,
      roi,
      bestBet: {
        description: best.t.description || 'Unknown',
        pnl: best.pnl,
      },
      worstBet: {
        description: worst.t.description || 'Unknown',
        pnl: worst.pnl,
      },
      avgPnL: totalPnL / txns.length,
    })
  })

  // Sort by monthKey descending (most recent first)
  return results.sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

// Profit Factor
export function calculateProfitFactor(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0

  const wins = transactions
    .map((t) => calculatePnL(t))
    .filter((pnl) => pnl > 0)
    .reduce((sum, pnl) => sum + pnl, 0)

  const losses = Math.abs(
    transactions
      .map((t) => calculatePnL(t))
      .filter((pnl) => pnl < 0)
      .reduce((sum, pnl) => sum + pnl, 0)
  )

  return losses > 0 ? wins / losses : wins > 0 ? 999 : 0
}

// Risk of Ruin
export interface RiskOfRuin {
  probability: number
  expectedBankroll: number
  worstCaseScenario: number
  bestCaseScenario: number
  recommendation: string
}

export function calculateRiskOfRuin(
  transactions: Transaction[],
  currentBankroll: number = 1000
): RiskOfRuin {
  if (transactions.length === 0) {
    return {
      probability: 0,
      expectedBankroll: currentBankroll,
      worstCaseScenario: currentBankroll,
      bestCaseScenario: currentBankroll,
      recommendation: 'No data available',
    }
  }

  const pnls = transactions.map((t) => calculatePnL(t))
  const wins = pnls.filter((p) => p > 0).length
  const losses = pnls.filter((p) => p < 0).length
  const winRate = wins / transactions.length
  const lossRate = 1 - winRate
  
  const totalWinAmount = pnls.filter((p) => p > 0).reduce((sum, p) => sum + p, 0)
  const totalLossAmount = Math.abs(pnls.filter((p) => p < 0).reduce((sum, p) => sum + p, 0))
  
  const avgWin = wins > 0 ? totalWinAmount / wins : 0
  const avgLoss = losses > 0 ? totalLossAmount / losses : 0
  
  // Average bet size in dollars (using contract qty as proxy for bet size)
  const avgBetSize = transactions.reduce((sum, t) => sum + t.qtyLong, 0) / transactions.length
  
  // Calculate net edge per bet
  const netEdge = winRate * avgWin - lossRate * avgLoss
  
  // Risk of Ruin formula based on gambler's ruin problem
  // For a player with edge, RoR = ((1-p)/p)^(bankroll/avgBet) where p is win probability
  // Adjusted for actual P&L outcomes
  let riskOfRuin = 0
  
  if (netEdge <= 0) {
    // Negative or zero edge means eventual ruin with certainty
    riskOfRuin = Math.min(0.95, 0.5 + Math.abs(netEdge) / avgBetSize)
  } else {
    // Positive edge - calculate based on bankroll units
    const avgBetRisk = avgBetSize / currentBankroll
    const bankrollUnits = currentBankroll / avgBetSize
    
    // Simplified risk of ruin: higher bet size relative to bankroll = higher risk
    // Even with positive edge, over-betting increases risk
    if (avgBetRisk > 0.1) {
      // Betting more than 10% of bankroll per bet is very risky
      riskOfRuin = Math.min(0.8, 0.3 + avgBetRisk * 2)
    } else if (avgBetRisk > 0.05) {
      // 5-10% per bet is moderately risky
      riskOfRuin = 0.15 + avgBetRisk * 2
    } else {
      // Conservative betting with positive edge = low risk
      // Risk decreases with more bankroll units
      riskOfRuin = Math.max(0.01, Math.pow(lossRate / winRate, bankrollUnits / 10))
    }
  }

  // Monte Carlo simulation (simplified) - project 100 bets forward
  const expectedBankroll = currentBankroll + netEdge * 100
  const stdDev = Math.sqrt(
    winRate * Math.pow(avgWin, 2) + lossRate * Math.pow(avgLoss, 2)
  )
  const worstCase = Math.max(0, currentBankroll + netEdge * 100 - 2 * stdDev * Math.sqrt(100))
  const bestCase = currentBankroll + netEdge * 100 + 2 * stdDev * Math.sqrt(100)

  let recommendation = ''
  if (riskOfRuin > 0.5) {
    recommendation = 'High risk! Consider reducing bet sizes significantly.'
  } else if (riskOfRuin > 0.2) {
    recommendation = 'Moderate risk. Reduce bet sizes or improve win rate.'
  } else if (riskOfRuin > 0.05) {
    recommendation = 'Low risk. Current strategy is sustainable.'
  } else {
    recommendation = 'Very low risk. Well-managed bankroll.'
  }

  return {
    probability: riskOfRuin * 100,
    expectedBankroll,
    worstCaseScenario: Math.max(0, worstCase),
    bestCaseScenario: bestCase,
    recommendation,
  }
}

// Event Type Performance by Time Period
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime'

export interface EventTypePerformance {
  eventType: string
  totalBets: number
  wins: number
  losses: number
  totalPnL: number
  roi: number
  winRate: number
}

export function calculateEventTypePerformance(
  transactions: Transaction[],
  timePeriod: TimePeriod = 'alltime'
): EventTypePerformance[] {
  if (transactions.length === 0) return []

  // Filter transactions based on time period
  const now = new Date()
  const filteredTransactions = transactions.filter((t) => {
    if (timePeriod === 'alltime') return true
    
    const expDate = parseISO(t.expDate || t.tradeDate)
    
    switch (timePeriod) {
      case 'daily':
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        return expDate >= yesterday
      case 'weekly':
        const lastWeek = new Date(now)
        lastWeek.setDate(now.getDate() - 7)
        return expDate >= lastWeek
      case 'monthly':
        const lastMonth = new Date(now)
        lastMonth.setMonth(now.getMonth() - 1)
        return expDate >= lastMonth
      case 'yearly':
        const lastYear = new Date(now)
        lastYear.setFullYear(now.getFullYear() - 1)
        return expDate >= lastYear
      default:
        return true
    }
  })

  // Group by event type (tags)
  const grouped = new Map<string, Transaction[]>()

  filteredTransactions.forEach((t) => {
    t.tags.forEach((tag) => {
      if (!grouped.has(tag)) {
        grouped.set(tag, [])
      }
      grouped.get(tag)!.push(t)
    })
  })

  const results: EventTypePerformance[] = []
  
  grouped.forEach((txns, eventType) => {
    const pnls = txns.map((t) => calculatePnL(t))
    const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0)
    const wins = pnls.filter((pnl) => pnl > 0).length
    const losses = pnls.filter((pnl) => pnl < 0).length
    const totalBets = txns.length
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0
    
    // Calculate ROI based on total invested (approximate using qtyLong)
    const totalInvested = txns.reduce((sum, t) => sum + Math.abs(t.qtyLong * 0.5), 0)
    const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    results.push({
      eventType,
      totalBets,
      wins,
      losses,
      totalPnL,
      roi,
      winRate,
    })
  })

  return results.sort((a, b) => b.totalPnL - a.totalPnL)
}

