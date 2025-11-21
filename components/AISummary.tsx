'use client'

import { useState, useEffect } from 'react'
import { AnalyticsData, AISummary as AISummaryType } from '@/lib/types'
import { Storage } from '@/lib/storage'

interface AISummaryProps {
  analyticsData: AnalyticsData
}

const AI_SUMMARY_STORAGE_KEY = 'ai-summary'

export default function AISummary({ analyticsData }: AISummaryProps) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<AISummaryType | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load saved summary from localStorage on mount
  useEffect(() => {
    const savedSummary = localStorage.getItem(AI_SUMMARY_STORAGE_KEY)
    if (savedSummary) {
      try {
        setSummary(JSON.parse(savedSummary))
      } catch (err) {
        console.error('Failed to parse saved AI summary:', err)
      }
    }
  }, [])

  const handleGenerate = async () => {
    const settings = Storage.getSettings()

    if (!settings.openaiApiKey) {
      setError('Please configure your OpenAI API key in settings')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: settings.openaiApiKey,
          analyticsData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const newSummary = {
          summary: result.summary,
          tips: result.tips,
          generatedAt: result.generatedAt,
        }
        setSummary(newSummary)
        // Save to localStorage
        localStorage.setItem(AI_SUMMARY_STORAGE_KEY, JSON.stringify(newSummary))
      } else {
        setError(result.error || 'Failed to generate summary')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!summary) return

    const text = `
Performance Summary
${summary.summary}

Actionable Tips:
${summary.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

Generated: ${new Date(summary.generatedAt).toLocaleString()}
    `.trim()

    navigator.clipboard.writeText(text)
    alert('Summary copied to clipboard!')
  }

  const handleClear = () => {
    setSummary(null)
    localStorage.removeItem(AI_SUMMARY_STORAGE_KEY)
  }

  return (
    <div className="bg-white dark:bg-dark-elevated rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">AI Performance Insights</h3>
        <div className="flex space-x-2">
          {summary && (
            <>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-dark-elevated transition-colors"
              >
                Copy
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-dark-elevated transition-colors"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm transition-colors"
          >
            {loading ? 'Generating...' : summary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
              Summary
            </h4>
            <p className="text-gray-900 dark:text-gray-100">{summary.summary}</p>
          </div>

          <div>
            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
              Actionable Tips
            </h4>
            <ul className="space-y-2">
              {summary.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-gray-900 dark:text-gray-100"
                >
                  <span className="font-bold text-purple-600 mt-0.5">
                    {index + 1}.
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-dark-border">
            Generated: {new Date(summary.generatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">Click "Generate" to get AI-powered insights</p>
          <p className="text-sm">
            Make sure to configure your OpenAI API key in settings
          </p>
        </div>
      )}
    </div>
  )
}

