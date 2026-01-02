import { z } from 'zod'

export const TransactionSchema = z.object({
  id: z.string(),
  tradeDate: z.string(),
  assetType: z.string(),
  qtyLong: z.number(),
  qtyShort: z.number(),
  subtype: z.enum(['YES', 'NO']),
  symbol: z.string(),
  description: z.string().nullable(),
  exchange: z.string(),
  expDate: z.string().nullable(),
  tradePrice: z.number(),
  tradeType: z.enum(['Trade', 'Final Settlement', 'Closed Position']),
  commission: z.number(),
  exchangeFees: z.number(),
  nfaFees: z.number(),
  totalFees: z.number(),
  currency: z.string(),
  sourceFile: z.string(),
  tags: z.array(z.string()),
})

export type Transaction = z.infer<typeof TransactionSchema>

export interface UploadedFile {
  id: string
  filename: string
  uploadDate: string
  parseStatus: 'pending' | 'parsing' | 'success' | 'error'
  positionCount: number
  error?: string
}

export interface DateRange {
  start: Date | null
  end: Date | null
}

export type DateRangePreset = 'last7days' | 'last30days' | 'ytd' | 'alltime' | 'custom'

export interface Filters {
  dateRange: DateRange
  dateRangePreset: DateRangePreset
  tags: string[]
}

export interface CoreMetrics {
  totalPnL: number
  winRate: number
  totalBets: number
  avgStakeSize: number
  totalFees: number
  winningBets: number
  losingBets: number
}

export interface TimeSeriesDataPoint {
  date: string
  pnl: number
  cumulativePnL: number
  tradeCount: number
}

export interface CategoryMetrics {
  category: string
  pnl: number
  tradeCount: number
  winRate: number
  avgStakeSize: number
}

export interface StakeSizeDistribution {
  range: string
  count: number
  totalPnL?: number
}

export interface AnalyticsData {
  coreMetrics: CoreMetrics
  timeSeriesData: TimeSeriesDataPoint[]
  categoryMetrics: CategoryMetrics[]
  stakeSizeDistribution: StakeSizeDistribution[]
}

export interface AppSettings {
  openaiApiKey: string | null
  ignoredTags: string[]
}

export interface AISummary {
  summary: string
  tips: string[]
  generatedAt: string
}

