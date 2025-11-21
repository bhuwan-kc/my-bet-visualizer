#!/usr/bin/env python3
"""
PDF Parser for Robinhood Event-Contract Monthly Statements

IMPORTANT: This parser ONLY extracts from "Purchase and Sale Summary" section.
See docs/PDF_FORMAT_ASSUMPTIONS.md for detailed format documentation.

Why only Purchase and Sale Summary?
- Contains all closed positions with P&L data
- Each bet appears as two rows (purchase + sale)
- Pairing/combining happens in frontend (lib/preprocessing.ts)

Format: Date AT QtyLong QtyShort Subtype Symbol Exchange ExpDate GrossPnL Currency Description
Example: 2025-09-01 SW 20 0 YES KXEPLGAME-25SEP14MCIMUN-MCI Kalshi 2025-09-14 -10.08 USD Manchester City
"""

import sys
import json
import re
import pdfplumber
from datetime import datetime
from typing import List, Dict, Any, Optional


def clean_value(value: Any) -> Any:
    """Clean and normalize extracted values"""
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip().replace('\n', ' ')
        if value == '' or value == 'None':
            return None
    return value


def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to ISO format"""
    if not date_str:
        return None
    try:
        date_str = date_str.strip().replace('\n', '-')
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return dt.isoformat()
    except:
        return None


def parse_float(value: str) -> float:
    """Parse float value, handling scientific notation"""
    if not value or value == '':
        return 0.0
    try:
        value = value.strip().replace('\n', '')
        if 'E-8' in value or 'e-8' in value:
            return 0.0
        return float(value)
    except:
        return 0.0


def parse_int(value: str) -> int:
    """Parse integer value"""
    if not value or value == '':
        return 0
    try:
        return int(value.strip().replace('\n', ''))
    except:
        return 0


def extract_tags(description: str, symbol: str) -> List[str]:
    """Extract basic tags from description and symbol"""
    tags = []
    
    # Sport/league detection
    sports_keywords = {
        'NFL': ['NFL'],
        'NBA': ['NBA'],
        'EPL': ['EPL', 'EPLGAME'],
        'Premier League': ['PREMIERLEAGUE'],
        'MLB': ['MLB'],
        'NHL': ['NHL'],
        'Soccer': ['SOCCER'],
        'Football': ['FOOTBALL']
    }
    
    text = f"{description} {symbol}".upper()
    
    for tag, keywords in sports_keywords.items():
        if any(keyword in text for keyword in keywords):
            tags.append(tag)
            break
    
    # Team names from description
    if description:
        tags.append(description.strip())
    
    return tags


def parse_monthly_trade_confirmations(table: List[List[str]], filename: str) -> List[Dict[str, Any]]:
    """Parse Monthly Trade Confirmations table (page 2)"""
    transactions = []
    
    if not table or len(table) < 2:
        return transactions
    
    headers = table[0]
    
    for row in table[1:]:
        # Handle different table formats
        if len(row) < 8:
            continue
        
        try:
            # Clean and combine multi-line values
            cleaned_row = [clean_value(cell) for cell in row]
            
            # Standard format (13+ columns)
            if len(row) >= 13:
                trade_date = parse_date(cleaned_row[0])
                asset_type = cleaned_row[1]
                qty_long = parse_int(cleaned_row[2])
                qty_short = parse_int(cleaned_row[3])
                subtype = cleaned_row[4]
                symbol = cleaned_row[5]
                exp_date = parse_date(cleaned_row[8])
                trade_price = parse_float(cleaned_row[9])
                currency = cleaned_row[10]
                trade_type = cleaned_row[11]
                description = cleaned_row[12] if len(row) > 12 else ''
            # Compact format (8-12 columns) - dates/symbols may be split
            else:
                trade_date = parse_date(cleaned_row[0])
                asset_type = cleaned_row[1]
                qty_long = parse_int(cleaned_row[2])
                qty_short = parse_int(cleaned_row[3])
                subtype = cleaned_row[4]
                trade_price = parse_float(cleaned_row[5])
                symbol = cleaned_row[7] if len(row) > 7 else ''
                exp_date = None
                currency = 'USD'
                trade_type = 'Trade'
                description = cleaned_row[8] if len(row) > 8 else ''
            
            if not trade_date or not symbol:
                continue
            
            tags = extract_tags(description or '', symbol or '')
            
            transaction = {
                'tradeDate': trade_date,
                'assetType': asset_type,
                'qtyLong': qty_long,
                'qtyShort': qty_short,
                'subtype': subtype,
                'symbol': symbol,
                'description': description,
                'exchange': 'Kalshi',
                'expDate': exp_date,
                'tradePrice': trade_price,
                'tradeType': trade_type,
                'commission': 0.0,
                'exchangeFees': 0.0,
                'nfaFees': 0.0,
                'totalFees': 0.0,
                'currency': currency,
                'sourceFile': filename,
                'tags': tags
            }
            
            transactions.append(transaction)
        except Exception as e:
            print(f"Error parsing row: {e}", file=sys.stderr)
            continue
    
    return transactions


def parse_trade_confirmation_summary(table: List[List[str]], filename: str) -> List[Dict[str, Any]]:
    """Parse Trade Confirmation Summary table - handles both full and compact formats"""
    transactions = []
    
    if not table or len(table) < 2:
        return transactions
    
    for row in table[1:]:
        if len(row) < 8:
            continue
        
        try:
            # Clean all cells, removing newlines
            cleaned_row = [clean_value(cell) for cell in row]
            
            # Determine format based on column count
            if len(row) >= 17:
                # Full format with fees
                trade_date = parse_date(cleaned_row[0])
                asset_type = cleaned_row[1]
                qty_long = parse_int(cleaned_row[2])
                qty_short = parse_int(cleaned_row[3])
                subtype = cleaned_row[4]
                avg_long = parse_float(cleaned_row[5])
                symbol = cleaned_row[7]
                description = cleaned_row[8]
                exp_date = parse_date(cleaned_row[11]) if len(row) > 11 else None
                commission = parse_float(cleaned_row[12]) if len(row) > 12 else 0.0
                exchange_fees = parse_float(cleaned_row[13]) if len(row) > 13 else 0.0
                nfa_fees = parse_float(cleaned_row[14]) if len(row) > 14 else 0.0
                total_fees = parse_float(cleaned_row[15]) if len(row) > 15 else 0.0
                currency = cleaned_row[16] if len(row) > 16 else 'USD'
                trade_type = 'Trade'
            elif len(row) >= 10:
                # Compact format (10-16 columns)
                trade_date = parse_date(cleaned_row[0])
                asset_type = cleaned_row[1]
                qty_long = parse_int(cleaned_row[2])
                qty_short = parse_int(cleaned_row[3])
                subtype = cleaned_row[4]
                avg_long = parse_float(cleaned_row[5])
                symbol = cleaned_row[7] if len(row) > 7 else ''
                description = cleaned_row[8] if len(row) > 8 else ''
                exp_date = None
                commission = 0.0
                exchange_fees = 0.0
                nfa_fees = 0.0
                total_fees = 0.0
                currency = 'USD'
                trade_type = 'Trade'
            else:
                # Very compact format (8-9 columns)
                trade_date = parse_date(cleaned_row[0])
                asset_type = cleaned_row[1]
                qty_long = parse_int(cleaned_row[2])
                qty_short = parse_int(cleaned_row[3])
                subtype = cleaned_row[4]
                avg_long = parse_float(cleaned_row[5])
                symbol = cleaned_row[6] if len(row) > 6 else ''
                description = cleaned_row[7] if len(row) > 7 else ''
                exp_date = None
                commission = 0.0
                exchange_fees = 0.0
                nfa_fees = 0.0
                total_fees = 0.0
                currency = 'USD'
                trade_type = 'Trade'
            
            if not trade_date or not symbol:
                continue
            
            tags = extract_tags(description or '', symbol or '')
            
            transaction = {
                'tradeDate': trade_date,
                'assetType': asset_type,
                'qtyLong': qty_long,
                'qtyShort': qty_short,
                'subtype': subtype,
                'symbol': symbol,
                'description': description,
                'exchange': 'Kalshi',
                'expDate': exp_date,
                'tradePrice': avg_long,
                'tradeType': trade_type,
                'commission': commission,
                'exchangeFees': exchange_fees,
                'nfaFees': nfa_fees,
                'totalFees': total_fees,
                'currency': currency,
                'sourceFile': filename,
                'tags': tags
            }
            
            transactions.append(transaction)
        except Exception as e:
            print(f"Error parsing summary row: {e}", file=sys.stderr)
            continue
    
    return transactions


def parse_text_transactions(text: str, filename: str) -> List[Dict[str, Any]]:
    """Parse transactions from plain text format (newer PDFs)"""
    transactions = []
    
    # Pattern: Date AT Qty1 Qty2 Type Symbol Exchange ExpDate Price Currency TradeType Description
    pattern = r'^(\d{4}-\d{2}-\d{2})\s+(\w+)\s+(\d+)\s+(\d+)\s+(YES|NO)\s+(\S+)\s+(\w+)\s+(\d{4}-\d{2}-\d{2})\s+([\d.E-]+)\s+(\w+)\s+(.*?)\s+(.+)$'
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        match = re.match(pattern, line)
        if not match:
            continue
        
        try:
            groups = match.groups()
            trade_date = parse_date(groups[0])
            asset_type = groups[1]
            qty_long = parse_int(groups[2])
            qty_short = parse_int(groups[3])
            subtype = groups[4]
            symbol = groups[5]
            exchange = groups[6]
            exp_date = parse_date(groups[7])
            trade_price = parse_float(groups[8])
            currency = groups[9]
            trade_type = groups[10].strip()
            description = groups[11].strip()
            
            if not trade_date or not symbol:
                continue
            
            tags = extract_tags(description, symbol)
            
            transaction = {
                'tradeDate': trade_date,
                'assetType': asset_type,
                'qtyLong': qty_long,
                'qtyShort': qty_short,
                'subtype': subtype,
                'symbol': symbol,
                'description': description,
                'exchange': exchange,
                'expDate': exp_date,
                'tradePrice': trade_price,
                'tradeType': trade_type,
                'commission': 0.0,
                'exchangeFees': 0.0,
                'nfaFees': 0.0,
                'totalFees': 0.0,
                'currency': currency,
                'sourceFile': filename,
                'tags': tags
            }
            
            transactions.append(transaction)
        except Exception as e:
            print(f"Error parsing text line: {e}", file=sys.stderr)
            continue
    
    return transactions


def parse_purchase_and_sale_summary_text(text: str, filename: str) -> List[Dict[str, Any]]:
    """Parse Purchase and Sale Summary from text - the definitive P&L section
    
    Extracts raw transactions from the PDF. Each bet appears as TWO rows:
    - Row 1: Purchase (usually negative P&L)
    - Row 2: Sale (positive/zero/negative P&L)
    
    Pairing/combining happens in the frontend (lib/preprocessing.ts).
    
    See docs/PDF_FORMAT_ASSUMPTIONS.md for details.
    """
    transactions = []
    
    # Pattern for Purchase and Sale Summary lines
    # Format: Date AT QtyLong QtyShort Subtype Symbol Exchange ExpDate GrossPnL Currency Description
    # Groups: (1)Date (2)AT (3)QtyLong (4)QtyShort (5)Subtype (6)Symbol (7)Exchange (8)ExpDate (9)GrossPnL (10)Currency (11)Description
    pattern = r'^(\d{4}-\d{2}-\d{2})\s+(\w+)\s+(\d+)\s+(\d+)\s+(YES|NO)\s+(\S+)\s+(\w+)\s+(\d{4}-\d{2}-\d{2})\s+([-\d.E-]+)\s+(\w+)\s+(.+)$'
    
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Stop parsing if we hit the next section header
        if any(section in line for section in ['Journal Entries', 'Open Positions', 'Account Summary']):
            break
        
        # Try to match transaction pattern
        match = re.match(pattern, line)
        if not match:
            continue
        
        try:
            groups = match.groups()
            trade_date = parse_date(groups[0])
            asset_type = groups[1]
            qty_long = parse_int(groups[2])
            qty_short = parse_int(groups[3])
            subtype = groups[4]
            symbol = groups[5]
            exchange = groups[6]
            exp_date = parse_date(groups[7])
            gross_pnl = parse_float(groups[8])
            currency = groups[9]
            description = groups[10].strip()
            
            if not trade_date or not symbol:
                continue
            
            tags = extract_tags(description, symbol)
            
            transaction = {
                'tradeDate': trade_date,
                'assetType': asset_type,
                'qtyLong': qty_long,
                'qtyShort': qty_short,
                'subtype': subtype,
                'symbol': symbol,
                'description': description,
                'exchange': exchange,
                'expDate': exp_date,
                'tradePrice': gross_pnl,  # Gross P&L from PDF
                'tradeType': 'Closed Position',
                'commission': 0.0,
                'exchangeFees': 0.0,
                'nfaFees': 0.0,
                'totalFees': 0.0,
                'currency': currency,
                'sourceFile': filename,
                'tags': tags
            }
            
            transactions.append(transaction)
        except Exception as e:
            print(f"Error parsing line: {e}", file=sys.stderr)
            continue
    
    return transactions


def parse_pdf(pdf_path: str) -> Dict[str, Any]:
    """Main PDF parsing function - extracts all text, finds the section, parses it
    
    Strategy:
    1. Extract ALL text from entire PDF (not page-by-page)
    2. Find "Purchase and Sale Summary" header
    3. Parse from line after header until next section
    4. Extract only lines matching transaction pattern
    
    This approach handles multi-page sections automatically without tracking pages.
    See docs/PDF_FORMAT_ASSUMPTIONS.md for format details.
    """
    import os
    filename = os.path.basename(pdf_path)
    
    try:
        # Extract all text from the PDF
        all_text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text += text + "\n"
        
        # Find the "Purchase and Sale Summary" section
        # NOTE: If this section name changes in future PDFs, update here
        if 'Purchase and Sale Summary' not in all_text:
            return {
                'success': False,
                'error': 'Purchase and Sale Summary section not found',
                'filename': filename,
                'transactionCount': 0,
                'transactions': []
            }
        
        # Split into lines
        lines = all_text.split('\n')
        
        # Find where the section starts (line after the header)
        start_idx = None
        for i, line in enumerate(lines):
            if 'Purchase and Sale Summary' in line:
                start_idx = i + 1  # Start parsing from the line AFTER the header
                break
        
        # Find where the section ends (next major section header)
        # NOTE: If new sections are added between P&S Summary and these, update this list
        end_idx = len(lines)
        for i in range(start_idx, len(lines)):
            if any(section in lines[i] for section in ['Journal Entries', 'Open Positions', 'Account Summary']):
                end_idx = i
                break
        
        # Extract the section text
        section_lines = lines[start_idx:end_idx]
        section_text = '\n'.join(section_lines)
        
        print(f"Found Purchase and Sale Summary section: {len(section_lines)} lines", file=sys.stderr)
        
        # Parse transactions from this section
        transactions = parse_purchase_and_sale_summary_text(section_text, filename)
        
        print(f"Parsed {len(transactions)} transactions", file=sys.stderr)
        
        return {
            'success': True,
            'filename': filename,
            'transactionCount': len(transactions),
            'transactions': transactions
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'filename': filename,
            'transactionCount': 0,
            'transactions': []
        }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No PDF path provided'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = parse_pdf(pdf_path)
    print(json.dumps(result))


if __name__ == '__main__':
    main()

