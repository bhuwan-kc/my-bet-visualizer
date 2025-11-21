import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import { TransactionSchema } from '@/lib/types'

interface ParsedTransaction {
  tradeDate: string
  assetType: string
  qtyLong: number
  qtyShort: number
  subtype: 'YES' | 'NO'
  symbol: string
  description: string | null
  exchange: string
  expDate: string | null
  tradePrice: number
  tradeType: 'Trade' | 'Final Settlement'
  commission: number
  exchangeFees: number
  nfaFees: number
  totalFees: number
  currency: string
  sourceFile: string
  tags: string[]
}

interface PythonParserResult {
  success: boolean
  filename: string
  transactionCount: number
  transactions: ParsedTransaction[]
  error?: string
}

function runPythonParser(pdfPath: string): Promise<PythonParserResult> {
  return new Promise((resolve, reject) => {
    const pythonVenv = join(process.cwd(), '.venv', 'bin', 'python3')
    const scriptPath = join(process.cwd(), 'scripts', 'parse_pdf.py')
    
    const python = spawn(pythonVenv, [scriptPath, pdfPath])
    
    let stdout = ''
    let stderr = ''
    
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python parser failed: ${stderr}`))
        return
      }
      
      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error}`))
      }
    })
    
    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error}`))
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      )
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const tempFilePath = join('/tmp', `${uuidv4()}-${file.name}`)
    await writeFile(tempFilePath, buffer)
    
    try {
      const result = await runPythonParser(tempFilePath)
      
      await unlink(tempFilePath)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Parsing failed' },
          { status: 500 }
        )
      }
      
      const validatedTransactions = result.transactions.map((t) => {
        const transaction = {
          ...t,
          id: uuidv4(),
        }
        
        try {
          return TransactionSchema.parse(transaction)
        } catch (error) {
          console.error('Validation error:', error)
          return null
        }
      }).filter(Boolean)
      
      return NextResponse.json({
        success: true,
        filename: result.filename,
        transactionCount: validatedTransactions.length,
        transactions: validatedTransactions,
      })
    } catch (error) {
      await unlink(tempFilePath).catch(() => {})
      throw error
    }
  } catch (error) {
    console.error('Parse PDF error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

