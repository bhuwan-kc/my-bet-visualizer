# Data Flow Overview

## High-Level Workflow

```
PDF Upload → Parse → Preprocess → Store → Filter → Analytics → Visualize → AI Insights
```

## Detailed Flow

### 1. **PDF Upload** (`components/FileUpload.tsx`)
- User drops/selects PDF files
- Files sent to `/api/parse-pdf` endpoint

### 2. **Parse** (`app/api/parse-pdf/route.ts` → `scripts/parse_pdf.py`)
- Python script extracts all text from PDF
- Finds "Purchase and Sale Summary" section
- Parses raw transactions (each bet = 2 rows)
- Returns JSON with validated transactions

### 3. **Preprocess** (`lib/preprocessing.ts`)
- Combines purchase + sale pairs into single positions
- Calculates net P&L (purchase P&L + sale P&L)
- Each position now represents one complete bet
- Extensible for future preprocessing steps (validation, enrichment, etc.)

### 4. **Store** (`lib/storage.ts`)
- Combined positions saved to browser localStorage
- No deduplication (each position is unique)
- File metadata tracked separately

### 5. **Filter** (`lib/analytics.ts`)
- User selects date range (last 30 days, YTD, all time, custom)
- User selects tags (EPL, NBA, team names)
- Positions filtered by criteria

### 6. **Analytics** (`lib/analytics.ts`)
- **Core Metrics**: Total P&L, win rate, trade count, avg position size
- **Time Series**: Daily P&L aggregation, cumulative P&L
- **Category Metrics**: P&L and win rate per tag
- **Distribution**: Position size histogram

### 7. **Visualize** (`components/Charts.tsx`)
- Recharts renders 4 interactive charts
- Metrics displayed in cards
- Transaction table with sorting/editing

### 8. **AI Insights** (`app/api/ai-summary/route.ts` → OpenAI)
- Analytics data sent to OpenAI API
- GPT-4o-mini generates summary + tips
- Results displayed in UI

## Key Data Transformations

```
PDF File (binary)
  ↓
Raw Text (pdfplumber)
  ↓
Purchase & Sale Summary Section (text extraction)
  ↓
Raw Transactions (regex parsing) [2× per bet]
  ↓
Validated Transactions (Zod schema)
  ↓
Combined Positions (lib/preprocessing.ts) [1× per bet]
  ↓
Stored Positions (localStorage)
  ↓
Filtered Dataset (date/tag filters)
  ↓
Analytics Metrics (calculations)
  ↓
Visualizations (Recharts)
```

## Critical Data Points

- **Input**: PDF with "Purchase and Sale Summary" section
- **Raw Transactions**: 2× per bet (purchase + sale rows)
- **Pairing**: Combines consecutive rows with same date/symbol/description
- **Combined Positions**: 1× per bet (net P&L = purchase + sale)
- **Storage**: Browser localStorage (no backend database)
- **No Deduplication**: Each position is unique across PDFs

