'use client'

import { useState, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { UploadedFile, Transaction } from '@/lib/types'
import { Storage } from '@/lib/storage'
import { combineTransactionPairs } from '@/lib/preprocessing'

interface FileUploadProps {
  onUploadComplete: () => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const loadFiles = useCallback(() => {
    setFiles(Storage.getFiles())
  }, [])

  useEffect(() => {
    loadFiles()
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.endsWith('.pdf')
    )

    if (droppedFiles.length > 0) {
      await uploadFiles(droppedFiles)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      await uploadFiles(Array.from(selectedFiles))
    }
    e.target.value = ''
  }

  const uploadFiles = async (filesToUpload: File[]) => {
    setUploading(true)

    for (const file of filesToUpload) {
      const fileId = uuidv4()
      const uploadedFile: UploadedFile = {
        id: fileId,
        filename: file.name,
        uploadDate: new Date().toISOString(),
        parseStatus: 'parsing',
        positionCount: 0,
      }

      Storage.addFile(uploadedFile)
      loadFiles()

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          // Combine transaction pairs (purchase + sale) into single positions
          const combinedTransactions = combineTransactionPairs(result.transactions)
          
          const existingTransactions = Storage.getTransactions()
          const allTransactions = [...existingTransactions, ...combinedTransactions]
          Storage.saveTransactions(allTransactions)

          Storage.updateFile(fileId, {
            parseStatus: 'success',
            positionCount: combinedTransactions.length,
          })
        } else {
          Storage.updateFile(fileId, {
            parseStatus: 'error',
            error: result.error || 'Parsing failed',
          })
        }
      } catch (error) {
        Storage.updateFile(fileId, {
          parseStatus: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }

      loadFiles()
    }

    setUploading(false)
    onUploadComplete()
  }

  const handleDeleteFile = (fileId: string) => {
    Storage.deleteFile(fileId)
    loadFiles()
    onUploadComplete()
  }

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all data?')) {
      Storage.deleteAllData()
      loadFiles()
      onUploadComplete()
    }
  }

  return (
    <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 space-y-4">
      {/* Upload Section */}
      <div>
        {files.length > 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-dark-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div>
                <p className="text-sm font-medium">Upload More Files</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Drop PDFs here or click to browse
                </p>
              </div>
            </div>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm inline-block">
                {uploading ? 'Uploading...' : 'Add Files'}
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-dark-border'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📄</div>
            <div>
              <p className="text-lg font-medium">
                Drop PDF files here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload Robinhood monthly statements (PDF format)
              </p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
                {uploading ? 'Uploading...' : 'Select Files'}
              </span>
            </label>
          </div>
        </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex justify-between items-center mb-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 p-2 rounded-lg transition-colors"
          >
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploaded Files ({files.length})
            </h3>
            <span className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isExpanded && (
            <div className="space-y-2">
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleDeleteAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete All Data
                </button>
              </div>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {file.filename}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {file.parseStatus === 'success' && (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ {file.positionCount} positions
                        </span>
                      )}
                      {file.parseStatus === 'parsing' && (
                        <span className="text-blue-600 dark:text-blue-400">
                          ⏳ Parsing...
                        </span>
                      )}
                      {file.parseStatus === 'error' && (
                        <span className="text-red-600 dark:text-red-400">
                          ✗ Error: {file.error}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="ml-4 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

