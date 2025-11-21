# Testing Guide

## Manual Testing Checklist

### 1. Setup Verification
- [ ] Run `./setup.sh` successfully
- [ ] Start dev server with `yarn dev`
- [ ] App loads at http://localhost:3000

### 2. PDF Upload
- [ ] Drag and drop sample.pdf onto upload area
- [ ] Verify parsing completes successfully
- [ ] Check transaction count displayed (should be 20)
- [ ] Try uploading the same file again (should deduplicate)

### 3. Analytics Display
- [ ] Verify all 6 metric cards display correct values
- [ ] Check cumulative P&L chart renders
- [ ] Verify P&L by category bar chart shows data
- [ ] Confirm win/loss distribution displays
- [ ] Check stake size distribution chart

### 4. Filters
- [ ] Test "Last 30 Days" filter
- [ ] Test "Year to Date" filter
- [ ] Test "All Time" filter
- [ ] Test "Custom" date range with specific dates
- [ ] Click tag filters and verify data updates

### 5. Transaction Table
- [ ] Click "Show Transaction History"
- [ ] Verify all transactions display
- [ ] Sort by different columns (Date, Description, Price, P&L)
- [ ] Edit tags on a transaction
- [ ] Save edited tags and verify persistence
- [ ] Export to CSV and verify file downloads

### 6. AI Summary
- [ ] Open Settings and add OpenAI API key
- [ ] Click "Generate" in AI Insights panel
- [ ] Verify summary generates successfully
- [ ] Check that 3-5 tips are provided
- [ ] Click "Copy" and verify text copies to clipboard
- [ ] Test "Regenerate" button

### 7. Settings
- [ ] Open settings modal
- [ ] Add API key and save
- [ ] Close and reopen to verify persistence
- [ ] Update API key and verify changes save

### 8. Data Management
- [ ] Upload a second PDF (or same one)
- [ ] Verify deduplication works
- [ ] Delete a single file
- [ ] Verify associated transactions removed
- [ ] Click "Delete All Data"
- [ ] Confirm all data cleared

### 9. Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px width)
- [ ] Test on mobile (375px width)
- [ ] Verify all components are usable on mobile

### 10. Error Handling
- [ ] Try uploading a non-PDF file (should show error)
- [ ] Try generating AI summary without API key (should show error)
- [ ] Test with invalid API key (should show error message)

## Expected Results

### Sample PDF Metrics (All Time)
Based on the included sample.pdf, you should see approximately:
- Total P&L: ~$-37.80 (varies based on fees)
- Win Rate: ~50%
- Total Trades: 20 transactions
- Multiple EPL (English Premier League) tags
- Teams: Arsenal, Manchester City, Liverpool, Chelsea, Newcastle, etc.

## Automated Testing (Future)

To add automated tests:
```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e
```

## Performance Testing

- Upload multiple large PDFs (10+ files)
- Verify parsing completes within reasonable time
- Check that UI remains responsive with 1000+ transactions
- Monitor browser memory usage

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

