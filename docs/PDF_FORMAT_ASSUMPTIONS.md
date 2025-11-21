# Robinhood PDF Format Assumptions

This document describes the assumptions made about Robinhood monthly statement PDF format for parsing.

## Document Structure

### Expected Sections (in order)
1. **Header Page** - Account information, statement date
2. **Monthly Trade Confirmations** - Individual trade executions (NOT PARSED)
3. **Trade Confirmation Summary** - Aggregated trades (NOT PARSED)
4. **Purchase and Sale** - Individual buy/sell transactions (NOT PARSED)
5. **Purchase and Sale Summary** - ✅ **THIS IS WHAT WE PARSE**
6. **Journal Entries** - Account adjustments
7. **Open Positions** - Current holdings
8. **Account Summary** - Balance information
9. **Disclaimers** - Legal text

### Why Only "Purchase and Sale Summary"?

**This section contains the definitive P&L for each closed position.**

- Each row = one complete betting position with its final outcome
- Shows net P&L after all buys, sells, and settlements
- No duplicates - each position appears once
- Already aggregated - no need to match buys with sells

Other sections show individual trade executions (buy, sell, settlement) which would create duplicates if parsed.

## Purchase and Sale Summary Format

### Section Header
```
Purchase and Sale Summary
```

### IMPORTANT: Transaction Pairing

**Transactions come in PAIRS representing one complete bet:**

Each betting position appears as **two consecutive rows**:
1. **Purchase transaction** (usually negative P&L - money spent to buy)
2. **Sale transaction** (positive/zero/negative P&L - money received on settlement)

**Identifying Pairs:**
- Same `Trade Date`
- Same `Symbol`
- Same `Description`
- Consecutive rows

**Net P&L Calculation:**
```
Net P&L = Purchase P&L + Sale P&L
```

**Examples:**
```
Row 1: 2025-09-01 SW 20 0 YES KXEPLGAME-25SEP14BURLFC-LFC Kalshi 2025-09-14 -19.00 USD Liverpool
Row 2: 2025-09-01 SW 20 0 YES KXEPLGAME-25SEP14BURLFC-LFC Kalshi 2025-09-14  25.00 USD Liverpool
→ Combined: Liverpool, Net P&L = $6.00 (WIN)

Row 3: 2025-09-01 SW 25 0 YES KXEPLGAME-25SEP20MUNCHE-CHE Kalshi 2025-09-20 -10.25 USD Chelsea
Row 4: 2025-09-01 SW 25 0 YES KXEPLGAME-25SEP20MUNCHE-CHE Kalshi 2025-09-20   0.00 USD Chelsea
→ Combined: Chelsea, Net P&L = $-10.25 (LOSS)
```

**Why This Matters:**
- Raw transaction count = 2× actual betting positions
- Must combine pairs to get accurate position count
- Net P&L is the only meaningful metric (not individual buy/sell amounts)

### Transaction Line Format
```
Date AT QtyLong QtyShort Subtype Symbol Exchange ExpDate GrossPnL Currency Description
```

### Field Breakdown

| Position | Field | Type | Example | Description |
|----------|-------|------|---------|-------------|
| 1 | Trade Date | Date | `2025-09-01` | Date position was opened |
| 2 | Asset Type | String | `SW` | Asset type (SW = Sports/Event contracts) |
| 3 | Qty Long | Integer | `20` | Quantity of long contracts |
| 4 | Qty Short | Integer | `0` | Quantity of short contracts |
| 5 | Subtype | Enum | `YES` or `NO` | Contract type |
| 6 | Symbol | String | `KXEPLGAME-25SEP14MCIMUN-MCI` | Unique contract identifier |
| 7 | Exchange | String | `Kalshi` | Exchange name |
| 8 | Exp Date | Date | `2025-09-14` | Contract expiration date |
| 9 | Gross P&L | Float | `-10.08` or `20.00` | Net profit/loss for this position |
| 10 | Currency | String | `USD` | Currency code |
| 11 | Description | String | `Manchester City` | Human-readable description |

### Regex Pattern
```regex
^(\d{4}-\d{2}-\d{2})\s+(\w+)\s+(\d+)\s+(\d+)\s+(YES|NO)\s+(\S+)\s+(\w+)\s+(\d{4}-\d{2}-\d{2})\s+([-\d.E-]+)\s+(\w+)\s+(.+)$
```

### Example Lines
```
2025-09-01 SW 20 0 YES KXEPLGAME-25SEP14MCIMUN-MCI Kalshi 2025-09-14 -10.08 USD Manchester City
2025-09-01 SW 10 0 NO KXEPLGAME-25SEP29EVEWHU-WHU Kalshi 2025-09-29 0.00 USD West Ham
2025-09-16 SW 20 0 YES KXUCLGAME-25SEP16JUVBVB-TIE Kalshi 2025-09-16 -20.00 USD Tie
```

## Multi-Page Handling

### Assumptions
1. **Section can span multiple pages** - The "Purchase and Sale Summary" section may continue across several pages
2. **Header appears once** - "Purchase and Sale Summary" header appears only on the first page of the section
3. **Continuation pages have no header** - Subsequent pages continue with transaction lines directly
4. **Next section ends parsing** - Section ends when we encounter: "Journal Entries", "Open Positions", or "Account Summary"

### Parsing Strategy
```
1. Extract ALL text from entire PDF (not page-by-page)
2. Find "Purchase and Sale Summary" header
3. Start parsing from the line AFTER the header
4. Continue parsing until next section header is found
5. Extract all matching transaction lines
```

## Special Cases

### P&L Values
- **Positive values** (e.g., `20.00`) = Winning position
- **Negative values** (e.g., `-10.08`) = Losing position
- **Zero** (e.g., `0.00`) = Break-even position
- **Scientific notation** (e.g., `0E-8`) = Treated as `0.00`

### Date Formats
- Standard format: `YYYY-MM-DD` (e.g., `2025-09-01`)
- All dates are in this format consistently

### Symbol Format
- Pattern: `KX[LEAGUE][GAME]-[DATE][TEAMS]-[TEAM]`
- Examples:
  - `KXEPLGAME-25SEP14MCIMUN-MCI` (EPL game)
  - `KXUCLGAME-25SEP16ATHARS-ARS` (UCL game)
  - `KXPREMIERLEAGUE-26-MCI` (Season-long bet)

### Description Parsing
- Team names extracted from description field
- Used for auto-tagging (EPL, NBA, NFL, etc.)
- May contain multi-word names (e.g., "Manchester City")

## What We DON'T Parse

### Sections Intentionally Skipped
1. **Monthly Trade Confirmations** - Individual trade executions
   - Would create duplicates (buy + sell + settlement = 3 rows for 1 bet)
   
2. **Trade Confirmation Summary** - Aggregated trades with fees
   - Still shows individual executions, not final outcomes
   
3. **Purchase and Sale** - Individual buy/sell transactions
   - Same as Trade Confirmations, just different format

### Why Skip These?
These sections show the **process** of making a bet (buying contracts, settling them), not the **outcome**. 

Example for one bet:
- Trade Confirmations: 3 rows (buy YES, buy YES again, final settlement)
- Purchase and Sale Summary: 1 row (net P&L: -$10.08)

We only care about the outcome, so we parse only the Summary.

## Data Model Mapping

### How Fields Are Used

| PDF Field | Stored As | Notes |
|-----------|-----------|-------|
| Trade Date | `tradeDate` | ISO format |
| Asset Type | `assetType` | Always "SW" for sports |
| Qty Long | `qtyLong` | Number of contracts |
| Qty Short | `qtyShort` | Usually 0 |
| Subtype | `subtype` | YES or NO |
| Symbol | `symbol` | Unique identifier |
| Exchange | `exchange` | Always "Kalshi" |
| Exp Date | `expDate` | ISO format |
| Gross P&L | `tradePrice` | ⚠️ **Actually P&L, not price!** |
| Currency | `currency` | Always "USD" |
| Description | `description` | Team/event name |
| - | `tradeType` | Set to "Closed Position" |
| - | `commission` | Set to 0.0 (included in P&L) |
| - | `exchangeFees` | Set to 0.0 (included in P&L) |
| - | `nfaFees` | Set to 0.0 (included in P&L) |
| - | `totalFees` | Set to 0.0 (included in P&L) |
| - | `tags` | Auto-extracted from description |

### Important Note on `tradePrice`
The field is named `tradePrice` for historical reasons, but it actually contains the **Gross P&L** (profit/loss) for the position, not the entry price.

## Potential Format Changes to Watch For

### If Parsing Breaks, Check:

1. **Section name changed**
   - Current: "Purchase and Sale Summary"
   - Update: Line 464 in `parse_pdf.py`

2. **Column order changed**
   - Update: Regex pattern (line 389)
   - Update: Field extraction (lines 408-418)

3. **New section added between P&S Summary and Journal Entries**
   - Update: Section end detection (line 471)

4. **Date format changed**
   - Update: `parse_date()` function (lines 26-36)

5. **New asset types besides "SW"**
   - May need to filter or handle differently

6. **Symbol format changed**
   - Update: `extract_tags()` function (lines 63-88)

## Testing Checklist

When validating with new PDFs:

- [ ] Verify section header is found
- [ ] Check transaction count matches manual count
- [ ] Verify first transaction parses correctly
- [ ] Verify last transaction parses correctly
- [ ] Check P&L values are correct (positive/negative)
- [ ] Verify dates are in correct format
- [ ] Check tags are extracted properly
- [ ] Ensure no duplicates across multiple PDFs
- [ ] Test with multi-page Purchase and Sale Summary sections

## Version History

- **v1.1** (2025-11-21) - Added transaction pairing
  - Combines purchase + sale pairs into single positions
  - Net P&L calculated from both transactions
  - Actual position count (not raw transaction count)
  
- **v1.0** (2025-11-21) - Initial documentation
  - Parses "Purchase and Sale Summary" section only
  - Text-based parsing (no table parsing)
  - Multi-page section support
  - Tested with August, September, October 2025 statements

