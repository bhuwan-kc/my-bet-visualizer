import { Transaction, UploadedFile, AppSettings } from './types'

const STORAGE_KEYS = {
  TRANSACTIONS: 'bet-visualizer-transactions',
  FILES: 'bet-visualizer-files',
  SETTINGS: 'bet-visualizer-settings',
} as const

export class Storage {
  private static isBrowser = typeof window !== 'undefined'

  static getTransactions(): Transaction[] {
    if (!this.isBrowser) return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading transactions:', error)
      return []
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    if (!this.isBrowser) return
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
    } catch (error) {
      console.error('Error saving transactions:', error)
    }
  }

  static addTransactions(newTransactions: Transaction[]): void {
    const existing = this.getTransactions()
    const combined = [...existing, ...newTransactions]
    this.saveTransactions(combined)
  }

  static updateTransaction(id: string, updates: Partial<Transaction>): void {
    const transactions = this.getTransactions()
    const index = transactions.findIndex((t) => t.id === id)
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates }
      this.saveTransactions(transactions)
    }
  }

  static deleteTransaction(id: string): void {
    const transactions = this.getTransactions().filter((t) => t.id !== id)
    this.saveTransactions(transactions)
  }

  static getFiles(): UploadedFile[] {
    if (!this.isBrowser) return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FILES)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading files:', error)
      return []
    }
  }

  static saveFiles(files: UploadedFile[]): void {
    if (!this.isBrowser) return
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files))
    } catch (error) {
      console.error('Error saving files:', error)
    }
  }

  static addFile(file: UploadedFile): void {
    const files = this.getFiles()
    files.push(file)
    this.saveFiles(files)
  }

  static updateFile(id: string, updates: Partial<UploadedFile>): void {
    const files = this.getFiles()
    const index = files.findIndex((f) => f.id === id)
    if (index !== -1) {
      files[index] = { ...files[index], ...updates }
      this.saveFiles(files)
    }
  }

  static deleteFile(id: string): void {
    const files = this.getFiles()
    const fileToDelete = files.find((f) => f.id === id)
    
    if (!fileToDelete) {
      return
    }
    
    // Remove the file
    const updatedFiles = files.filter((f) => f.id !== id)
    this.saveFiles(updatedFiles)
    
    // Remove all transactions from this file
    // Note: sourceFile includes UUID prefix (e.g., "uuid-august.pdf")
    // so we need to check if it ends with the filename
    const allTransactions = this.getTransactions()
    const transactionsToKeep = allTransactions.filter(
      (t) => !t.sourceFile.endsWith(fileToDelete.filename)
    )
    this.saveTransactions(transactionsToKeep)
  }

  static getSettings(): AppSettings {
    if (!this.isBrowser) return { openaiApiKey: null, ignoredTags: [] }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      const settings = data ? JSON.parse(data) : { openaiApiKey: null, ignoredTags: [] }
      // Ensure ignoredTags exists for backward compatibility
      if (!settings.ignoredTags) {
        settings.ignoredTags = []
      }
      return settings
    } catch (error) {
      console.error('Error reading settings:', error)
      return { openaiApiKey: null, ignoredTags: [] }
    }
  }

  static saveSettings(settings: AppSettings): void {
    if (!this.isBrowser) return
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  static deleteAllData(): void {
    if (!this.isBrowser) return
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
      localStorage.removeItem(STORAGE_KEYS.FILES)
    } catch (error) {
      console.error('Error deleting data:', error)
    }
  }
}

