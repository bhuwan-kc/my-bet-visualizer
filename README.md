# My Bet Visualizer

Analytics and visualization tool for event-contract betting on Robinhood.

## Features

- 📊 Performance analytics (P&L, win rate, ROI, profit factor)
- 📈 Interactive charts and visualizations
- 🤖 AI-powered insights (OpenAI integration)
- 🎨 Modern dark theme
- 📤 CSV export
- 💾 Local storage (no backend required)

## Quick Setup

### Prerequisites

- Node.js 18+
- Python 3.8+

### Installation

**macOS/Linux:**
```bash
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

**Or manually:**
```bash
yarn install
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Run

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## Getting Started

### 1. Download Your Statements

1. Log in to [robinhood.com](https://robinhood.com)
2. Go to **Account** → **Statements & History**
3. Select **Futures & Event Contracts Monthly Statements** 
4. Download the PDFs you want to analyze

### 2. Upload & Analyze

1. Open the app and click **File Upload**
2. Upload your downloaded PDF statements
3. Wait for parsing to complete (✓ appears when done)
4. Explore your analytics in the dashboard

### 3. AI Insights (Optional)

1. Click **Settings** (⚙️) in the sidebar
2. Enter your OpenAI API key ([get one here](https://platform.openai.com/api-keys))
3. Go to **AI Insights** and click "Generate"

## Key Features

- **Sidebar Navigation**: Collapse/expand for more space (persists across sessions)
- **Filters**: Filter by date range and event types
- **Monthly Summary**: Performance breakdown by month
- **Position History**: Sortable table with pagination, export to CSV
- **Dark Mode**: Automatically matches your system preference

## Troubleshooting

**Build fails?**
```bash
yarn build --webpack
```

**Port already in use?**
```bash
yarn dev -p 3001
```

**Python parser issues?**
```bash
source .venv/bin/activate
python3 scripts/parse_pdf.py your-statement.pdf
```

## Documentation

- `docs/specifications.md` - Project requirements
- `docs/WORKFLOW.md` - Technical architecture
- `docs/PDF_FORMAT_ASSUMPTIONS.md` - PDF parsing details

## Tech Stack

Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, Python (pdfplumber), OpenAI API

## Privacy

All data is stored locally in your browser. Your OpenAI API key is stored locally and only used for AI insights. No data is sent to external servers.

---

Happy analyzing! 🎯
