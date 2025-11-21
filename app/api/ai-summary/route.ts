import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AnalyticsData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, analyticsData } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is required' },
        { status: 400 }
      )
    }

    if (!analyticsData) {
      return NextResponse.json(
        { success: false, error: 'Analytics data is required' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    const data = analyticsData as AnalyticsData

    const prompt = `You are a sports betting analytics expert. Analyze the following betting performance data and provide insights.

Performance Summary:
- Total P&L: $${data.coreMetrics.totalPnL.toFixed(2)}
- Win Rate: ${(data.coreMetrics.winRate * 100).toFixed(1)}%
- Total Bets: ${data.coreMetrics.totalBets}
- Average Stake Size: $${data.coreMetrics.avgStakeSize.toFixed(2)}
- Winning Bets: ${data.coreMetrics.winningBets}
- Losing Bets: ${data.coreMetrics.losingBets}
- Total Fees: $${data.coreMetrics.totalFees.toFixed(2)}

Top Performing Categories:
${data.categoryMetrics
  .slice(0, 5)
  .map(
    (c) =>
      `- ${c.category}: P&L $${c.pnl.toFixed(2)}, Win Rate ${(c.winRate * 100).toFixed(1)}%, ${c.tradeCount} bets`
  )
  .join('\n')}

Worst Performing Categories:
${data.categoryMetrics
  .slice(-5)
  .reverse()
  .map(
    (c) =>
      `- ${c.category}: P&L $${c.pnl.toFixed(2)}, Win Rate ${(c.winRate * 100).toFixed(1)}%, ${c.tradeCount} bets`
  )
  .join('\n')}

Please provide:
1. A concise 2-3 sentence summary of overall performance
2. 3-5 specific, actionable tips for improving betting performance based on this data

Format your response as JSON with this structure:
{
  "summary": "your summary here",
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful sports betting analytics assistant. Provide clear, actionable insights based on data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      summary: result.summary || '',
      tips: result.tips || [],
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI Summary error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      },
      { status: 500 }
    )
  }
}

