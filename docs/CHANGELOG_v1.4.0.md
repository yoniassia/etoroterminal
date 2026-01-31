# Changelog v1.4.0 - Financial Data Integration

**Release Date:** 2026-01-31  
**Codename:** "Alpha Hunter"

---

## 🎯 Highlights

This release transforms the eToro Terminal into a comprehensive research platform by integrating professional-grade financial data from the Financial Datasets API.

---

## ✨ New Features

### 📊 INS - Insider Activity Panel
Track when CEOs, CFOs, and directors buy or sell their company's stock.

- Real-time insider transaction data
- 90-day sentiment analysis (bullish/bearish/neutral)
- Net value calculation
- Executive name and title display
- Commands: `INS`, `INSIDER`

### 🐋 INST - Institutional Ownership Panel
See what hedge funds and institutions are buying.

- 13F filing data (SEC-mandated quarterly disclosures)
- Two modes: "By Ticker" and "By Investor"
- Quick-select whale buttons (Berkshire, Citadel, Renaissance, BlackRock, etc.)
- Click investor to explore their full portfolio
- Commands: `INST`, `INSTITUTIONAL`, `WHALE`

### 📈 FD - Fundamentals Panel
Analyze company financial statements.

- Income statement data
- Key metrics: Revenue, Net Income, EPS, Gross Margin
- Multi-period comparison (up to 8 periods)
- QoQ/YoY growth rates
- Toggle: Quarterly / Annual / TTM
- Commands: `FD`, `FUND`, `FUNDAMENTALS`

### 📄 FILINGS - SEC Filings Browser
Access official SEC documents.

- Browse 10-K (annual), 10-Q (quarterly), 8-K (events), Form 4 (insider)
- Filter by filing type
- Click to open on SEC.gov
- "NEW" badge for recent filings
- Commands: `FILINGS`, `SEC`, `10K`, `8K`

---

## 🔧 Technical Changes

### New Files
```
src/services/financialDatasetsService.ts
src/types/financialDatasets.types.ts
src/components/panels/InsiderActivityPanel.tsx
src/components/panels/InsiderActivityPanel.css
src/components/panels/InstitutionalPanel.tsx
src/components/panels/InstitutionalPanel.css
src/components/panels/FundamentalsPanel.tsx
src/components/panels/FundamentalsPanel.css
src/components/panels/FilingsPanel.tsx
src/components/panels/FilingsPanel.css
docs/SPECKIT_ADDENDUM_v1.4.0_FINANCIAL_DATA.md
```

### API Integration
- **Provider:** Financial Datasets API (financialdatasets.ai)
- **Endpoints Used:**
  - `/insider-trades` - Insider transactions
  - `/institutional-ownership` - 13F holdings
  - `/financials/income-statements` - Income statements
  - `/filings` - SEC filings
  - `/prices/snapshot` - Real-time prices

### Command Bar
- Added 12 new command codes and aliases
- Updated FUNCTION_CODES array
- Updated FUNCTION_TO_PANEL mapping

---

## 📋 Commands Reference

| Command | Action |
|---------|--------|
| `INS NVDA` | Insider trades for NVIDIA |
| `INST AAPL` | Who owns Apple |
| `WHALE` | Open institutional panel |
| `FD TSLA` | Tesla fundamentals |
| `FUND MSFT` | Microsoft financials |
| `FILINGS GOOGL` | Google SEC filings |
| `SEC` | Open filings panel |
| `10K` | Open filings panel |

---

## 🐛 Bug Fixes

- None (new feature release)

---

## ⚠️ Breaking Changes

- None

---

## 📦 Dependencies

No new dependencies added. Uses native `fetch` API.

---

## 🔜 Coming Soon

- Balance Sheet panel
- Cash Flow Statement panel
- Company News panel
- Earnings Calendar
- Insider activity alerts
- Position change tracking

---

## 👥 Contributors

- YoniBotQuant (AI assistant)
- Yoni Assia (human)

---

## 📝 Notes

- Financial Datasets API key is stored in localStorage
- 13F data has a 45-day lag from quarter end (SEC requirement)
- All panels follow the terminal's green-on-black aesthetic
