'use client'

import { useState, useEffect } from 'react'
import { Storage } from '@/lib/storage'
import { getAllTags } from '@/lib/analytics'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange?: () => void
}

export default function Settings({ isOpen, onClose, onSettingsChange }: SettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [ignoredTags, setIgnoredTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const settings = Storage.getSettings()
      const transactions = Storage.getTransactions()
      const allTags = getAllTags(transactions)
      
      setApiKey(settings.openaiApiKey || '')
      setIgnoredTags(settings.ignoredTags || [])
      setAvailableTags(allTags)
      setSaved(false)
    }
  }, [isOpen])

  const handleSave = () => {
    Storage.saveSettings({ openaiApiKey: apiKey, ignoredTags })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (onSettingsChange) {
      onSettingsChange()
    }
  }

  const toggleTag = (tag: string) => {
    setIgnoredTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-dark-elevated rounded-lg p-6 max-w-2xl w-full mx-4 my-8 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <label className="block text-sm font-medium mb-2">
              Ignore Tags in Event Type Summary
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Select tags to exclude from the Event Type Summary table (e.g., secondary tags like EPL, Tie)
            </p>
            {availableTags.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                      ignoredTags.includes(tag)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <span className="w-4">
                      {ignoredTags.includes(tag) && '✓'}
                    </span>
                    <span className="truncate">{tag}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No tags available. Upload transactions to see tags.
              </p>
            )}
            {ignoredTags.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {ignoredTags.length} tag{ignoredTags.length !== 1 ? 's' : ''} ignored
              </p>
            )}
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-elevated"
            >
              Close
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

