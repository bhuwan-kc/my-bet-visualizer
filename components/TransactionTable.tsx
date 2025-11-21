'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/types'
import { Storage } from '@/lib/storage'
import Papa from 'papaparse'
import { parseISO } from 'date-fns'

interface TransactionTableProps {
  transactions: Transaction[]
  onUpdate: () => void
}

type SortField = 'tradeDate' | 'expDate' | 'description' | 'pnl' | 'tradePrice'
type SortDirection = 'asc' | 'desc'

export default function TransactionTable({
  transactions,
  onUpdate,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>('expDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTags, setEditingTags] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const calculatePnL = (transaction: Transaction): number => {
    // For "Closed Position" transactions, tradePrice is already the net P&L
    if (transaction.tradeType === 'Closed Position') {
      return transaction.tradePrice - transaction.totalFees
    }
    // Legacy logic for other trade types
    if (transaction.tradeType === 'Final Settlement') {
      return transaction.qtyLong * transaction.tradePrice - transaction.totalFees
    }
    return -transaction.qtyLong * transaction.tradePrice - transaction.totalFees
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset to page 1 when sorting changes
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'tradeDate':
        aValue = parseISO(a.tradeDate).getTime()
        bValue = parseISO(b.tradeDate).getTime()
        break
      case 'expDate':
        aValue = parseISO(a.expDate || a.tradeDate).getTime()
        bValue = parseISO(b.expDate || b.tradeDate).getTime()
        break
      case 'description':
        aValue = a.description || ''
        bValue = b.description || ''
        break
      case 'pnl':
        aValue = calculatePnL(a)
        bValue = calculatePnL(b)
        break
      case 'tradePrice':
        aValue = a.tradePrice
        bValue = b.tradePrice
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)

  const handleEditTags = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditingTags(transaction.tags.join(', '))
  }

  const handleSaveTags = (id: string) => {
    const tags = editingTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    Storage.updateTransaction(id, { tags })
    setEditingId(null)
    onUpdate()
  }

  const handleExportCSV = () => {
    const csvData = transactions.map((t) => ({
      'Trade Date': parseISO(t.tradeDate).toLocaleDateString(),
      Symbol: t.symbol,
      Description: t.description,
      Type: t.subtype,
      'Trade Type': t.tradeType,
      Quantity: t.qtyLong,
      Price: t.tradePrice,
      'Total Fees': t.totalFees,
      'P&L': calculatePnL(t).toFixed(2),
      Tags: t.tags.join('; '),
      'Source File': t.sourceFile,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `positions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  return (
    <div className="bg-white dark:bg-dark-elevated rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">All Positions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {transactions.length} positions • Sorted by expiration date
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-surface">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('expDate')}
              >
                Exp Date <SortIcon field="expDate" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('description')}
              >
                Event <SortIcon field="description" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Qty
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('pnl')}
              >
                P&L <SortIcon field="pnl" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedTransactions.map((transaction) => {
              const pnl = calculatePnL(transaction)
              return (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {parseISO(transaction.expDate || transaction.tradeDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{transaction.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {transaction.symbol}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.subtype === 'YES'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {transaction.subtype}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{transaction.qtyLong}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formatCurrency(pnl)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === transaction.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingTags}
                          onChange={(e) => setEditingTags(e.target.value)}
                          className="px-2 py-1 border rounded text-sm w-full dark:bg-gray-700 dark:border-gray-600"
                          placeholder="tag1, tag2"
                        />
                        <button
                          onClick={() => handleSaveTags(transaction.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-wrap gap-1">
                          {transaction.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {transaction.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{transaction.tags.length - 2}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditTags(transaction)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No transactions to display
        </div>
      )}

      {/* Pagination Controls */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedTransactions.length)} of {sortedTransactions.length} positions
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
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

