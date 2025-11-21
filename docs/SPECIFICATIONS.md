# Product Requirements Specification (PRS)

**Project:** Robinhood Event-Contract History Parser & Analytics  
**Working Name:** My Bet Visualizer 
**Version:** Draft v1  
**Owner:** TBD  
**Last Updated:** TBD  

---

## 1. Overview

Robinhood monthly statements do not provide usable performance analytics for event contracts (including sports-related markets).  

This product ingests user-uploaded **PDF monthly statements**, extracts **event-contract transactions**, normalizes them into a consistent structure (**schema TBD**), and provides:

1. Historical performance analytics  
2. Interactive visualizations  
3. An AI-generated summary with actionable tips  

The system operates on **local user-uploaded PDFs**, supporting one or multiple statement files.

Technology stack is intentionally left **open**. The implementation agent may choose tools appropriate for PDF extraction, charting, and optional backend usage.

---

## 2. Goals

- Convert Robinhood’s raw monthly PDF statements into a structured transaction dataset (schema TBD).  
- Provide clear visualizations of historical event-contract performance.  
- Offer an AI-generated summary of performance patterns and improvement tips.  
- Work with **multiple PDF uploads** seamlessly.  
- Ensure user data remains private, processed locally or securely depending on final architecture (TBD).

---

## 3. Scope

### 3.1 In Scope

- PDF upload (single or bulk).  
- PDF parsing for all event-contract sections/tables.  
- Extraction of trade-level data into normalized records (fields TBD based on sample statements).  
- Deduplication of transactions across multiple statements.  
- Analytics dashboard:
  - PnL over time  
  - Win/loss metrics  
  - Category-level stats (tags)  
  - Exposure/volume analytics (if possible)  
- Visualizations (charts/graphs, charting technology TBD).  
- AI-generated performance summary and improvement tips.  
- Export of parsed data to CSV (optional but recommended).

### 3.2 Out of Scope (Initial Version)

- Direct Robinhood login or API integration.  
- Real-time syncing with Robinhood.  
- Tax reporting functionality.  
- Full automatic sport/team/market classification using external sports APIs (can be added later).

---

## 4. Functional Requirements

### 4.1 PDF Upload

- **FR1:** User can upload **one or multiple PDF files**.  
- **FR2:** System validates that files are PDFs.  
- **FR3:** System provides feedback (success/error messages) for each uploaded file.  
- **FR4:** Uploaded files are stored in a temporary session workspace (exact mechanism TBD).

### 4.2 PDF Parsing

- **FR5:** System extracts event-contract-related tables and text sections from monthly statement PDFs.  
- **FR6:** System handles common table formats in Robinhood statements.  
- **FR7:** Parser tolerates minor formatting differences between months/years.  
- **FR8:** For each event-contract trade, system extracts at minimum:
  - Trade date/time (if present)  
  - Symbol/identifier  
  - Contract description  
  - Quantity  
  - Buy/Sell indicator  
  - Price  
  - Fees (if present)  
  - Gross/Net amounts  
  - Additional fields discovered during implementation (**TBD**)

- **FR9:** Parsing errors are surfaced with human-readable messages.  
- **FR10:** Parsed transactions are traceable back to the originating PDF (for debugging and audits).

### 4.3 Data Normalization

- **FR11:** A canonical “normalized transaction” structure will be defined **during implementation** using actual PDFs (**data model TBD**).  
- **FR12:** System deduplicates transactions across overlapping statements (e.g., re-uploaded or overlapping periods).  
- **FR13:** Tagging system:
  - **Basic tags** extracted heuristically (e.g., “NFL”, “NBA”) — *optional, TBD*.  
  - **User-defined tags** editable in UI — *recommended for MVP*.  

### 4.4 Analytics & Metrics

_All metrics are computed from the normalized dataset._

- **FR14:** Cumulative PnL over time.  
- **FR15:** PnL by category/tag.  
- **FR16:** Number of trades over time.  
- **FR17:** Win rate metrics.  
- **FR18:** Average stake size and stake-size distribution.  
- **FR19:** Max drawdown over time (**TBD/optional**).  
- **FR20:** Exposure analysis (e.g., peak daily stake), if inferable from data (**TBD**).

**Time range options:**

- Last 30 days  
- Year to date  
- All time (based on uploaded data)  
- Custom date range  

### 4.5 Visualization

_Charting library/framework is TBD by the implementation agent._

Required visuals:

- **FR21:** Cumulative PnL time-series line chart.  
- **FR22:** PnL by category/tag (bar chart).  
- **FR23:** Win/loss distribution chart (e.g., bar or summary graphic).  
- **FR24:** Bet size histogram (distribution of stake sizes).  
- **FR25:** Interactive tooltips showing key values on hover.  
- **FR26:** Click-to-filter or click-to-drill-down on categories/dates (**TBD**).  
- **FR27:** Export charts as PNG or SVG (**optional**).

### 4.6 AI Summary & Coaching

- **FR28:** System generates a concise AI summary once analytics are available for the selected date range.  
- **FR29:** Summary includes:
  - Overall performance (profit/loss)  
  - Best-performing categories/tags  
  - Worst-performing categories/tags  
  - Behavioral or temporal patterns (if detectable)

- **FR30:** Provide **3–5 actionable improvement tips**, grounded in the observed data.  
- **FR31:** Summary and tips must be easily copyable by the user.  
- **FR32:** Choice of LLM/model provider and prompts is **TBD** (may depend on runtime environment and privacy requirements).

### 4.7 User Interface

- **FR33:** File upload area supporting drag-and-drop plus traditional file picker.  
- **FR34:** File management list showing:
  - File name  
  - Parse status  
  - Number of transactions extracted  

- **FR35:** Dashboard layout including:
  - Filter controls (date range, tags)  
  - Key metrics (PnL, win rate, etc.)  
  - Visualizations (charts)  
  - AI summary panel  

- **FR36:** Data export button to download parsed transaction history as CSV.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR1:** Support multiple years of monthly statements.  
- **NFR2:** Handle thousands of transactions without noticeable UI lag in typical environments.

### 5.2 Privacy & Security

_Exact architecture (local-only vs. hosted) is **TBD**._

- **NFR3:** If hosted, all uploads must use secure transport (HTTPS).  
- **NFR4:** Provide a clear “delete all my data” action.  
- **NFR5:** If local-only, no data should leave the user’s device or browser environment.

### 5.3 Portability

- **NFR6:** Parsed dataset must be exportable to CSV so the user can reuse it in other tools.

### 5.4 Extensibility

- **NFR7:** Design should allow future integration with:
  - Kalshi API  
  - Additional brokers or books  
  - External sports metadata / classification services  
  - More advanced performance modeling and evaluation modules  

---

## 6. Open Questions (TBD Decisions)

These decisions are deferred to the implementation phase and may depend on sample statements and environment constraints:

1. Final data model / schema for normalized transactions.  
2. Complete list of extractable fields from Robinhood event-contract sections.  
3. Robust rules/heuristics for identifying event-contract rows vs. other activity.  
4. Automatic tagging heuristics (detecting sport, league, teams, market type from description).  
5. Need for multi-threaded parsing or background jobs for large batches.  
6. Whether the AI summary runs entirely locally (if possible) or via external LLM API.  
7. Choice of charting library and UI framework (e.g., React + X, or other).  
8. Whether a backend is required (e.g., for heavy PDF parsing) or if a frontend-only approach is feasible.

---

## 7. Next Steps

1. Acquire **sample Robinhood event-contract PDF statement(s)**.  
2. Analyze PDF structure to define the parsing approach.  
3. Define the **final data model** for normalized transactions based on real statement data.  
4. Build a parsing prototype; validate correctness and deduplication.  
5. Implement analytics computation on normalized data.  
6. Connect analytics to:
   - Visualizations (charts)  
   - AI summary & tip generation  

---
