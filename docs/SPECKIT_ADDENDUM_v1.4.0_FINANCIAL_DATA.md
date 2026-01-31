# SPECKIT ADDENDUM v1.4.0 - Financial Data Integration

**Date:** 2026-01-31  
**Version:** 1.4.0  
**Feature:** Financial Datasets API Integration

---

## Overview

Version 1.4.0 integrates the Financial Datasets API to provide professional-grade market intelligence:
- **Insider Activity Tracking** - Monitor CEO/CFO/Director buying and selling
- **Institutional Ownership** - Track hedge fund and institutional positions (13F filings)
- **Company Fundamentals** - Income statements, balance sheets, key metrics
- **SEC Filings Browser** - Access 10-K, 10-Q, 8-K, and Form 4 documents

This transforms the terminal from a pure trading interface into a comprehensive research platform.

---

## User Stories

### US-FD-001: View Insider Trading Activity
**As a** trader  
**I want to** see when company insiders buy or sell stock  
**So that** I can identify potential alpha signals from executive behavior

**Acceptance Criteria:**
- [x] User opens INS panel with `INS NVDA` or `INS` command
- [x] Panel displays insider transactions (buys/sells)
- [x] 90-day sentiment calculated (bullish/bearish/neutral)
- [x] Net value shows aggregate insider conviction
- [x] Transaction details: name, title, shares, value, price, date

### US-FD-002: Track Institutional Ownership
**As a** trader  
**I want to** see which institutions own a stock  
**So that** I can understand smart money positioning

**Acceptance Criteria:**
- [x] User opens INST panel with `INST AAPL` command
- [x] Panel shows institutional holders from 13F filings
- [x] Market value and share counts displayed
- [x] Percentage of total holdings visualized
- [x] Click investor name to view their full portfolio

### US-FD-003: View Investor Portfolios
**As a** trader  
**I want to** see what stocks a specific investor owns  
**So that** I can follow successful investment strategies

**Acceptance Criteria:**
- [x] User can switch to "By Investor" mode
- [x] Quick-select buttons for popular investors (Berkshire, Citadel, etc.)
- [x] Portfolio shows all holdings with values
- [x] Report period indicates data freshness

### US-FD-004: Analyze Company Fundamentals
**As a** trader  
**I want to** view financial statements for a company  
**So that** I can make informed investment decisions

**Acceptance Criteria:**
- [x] User opens FD panel with `FD TSLA` command
- [x] Income statement metrics displayed (Revenue, EPS, Net Income)
- [x] Multiple periods shown side-by-side
- [x] Growth rates calculated (QoQ/YoY)
- [x] Toggle between quarterly, annual, and TTM views

### US-FD-005: Browse SEC Filings
**As a** trader  
**I want to** access official SEC filings for a company  
**So that** I can read detailed financial disclosures

**Acceptance Criteria:**
- [x] User opens FILINGS panel with `FILINGS MSFT` or `SEC` command
- [x] Filings listed with type, date, and description
- [x] Filter by filing type (10-K, 10-Q, 8-K, Form 4)
- [x] Click to open filing on SEC.gov
- [x] "NEW" badge for recent filings (< 7 days)

---

## New Panels

### INS - Insider Activity Panel
**Commands:** `INS`, `INSIDER`  
**Default Size:** 650 x 500

| Component | Description |
|-----------|-------------|
| Symbol Input | Search any US stock ticker |
| Sentiment Badge | 90-day bullish/bearish/neutral indicator |
| Summary Stats | Net value, buy count, sell count |
| Trades Table | Name, title, action, shares, value, price, date |

### INST - Institutional Ownership Panel
**Commands:** `INST`, `INSTITUTIONAL`, `WHALE`  
**Default Size:** 700 x 500

| Component | Description |
|-----------|-------------|
| Mode Tabs | Switch between "By Ticker" and "By Investor" |
| Quick Investors | Preset buttons (BRK, Citadel, Renaissance, etc.) |
| Holdings Table | Investor/ticker, shares, value, price, % of total |
| Progress Bars | Visual representation of position sizes |

### FD - Fundamentals Panel
**Commands:** `FD`, `FUND`, `FUNDAMENTALS`  
**Default Size:** 750 x 500

| Component | Description |
|-----------|-------------|
| Period Tabs | Toggle quarterly / annual / TTM |
| Key Metrics | Revenue, Net Income, EPS, Gross Margin cards |
| Financials Table | Multi-period comparison with growth rates |

### FILINGS - SEC Filings Panel
**Commands:** `FILINGS`, `SEC`, `10K`, `8K`  
**Default Size:** 550 x 500

| Component | Description |
|-----------|-------------|
| Type Filter | ALL, 10-K, 10-Q, 8-K, Form 4 |
| Stats Bar | Filing counts by type |
| Filing Cards | Icon, type, description, date, click to view |

---

## Technical Implementation

### API Integration

**Service:** `src/services/financialDatasetsService.ts`

```typescript
// Core functions
getPriceSnapshot(ticker: string)
getInsiderTrades(ticker: string, params?)
getInsiderSentiment(ticker: string, daysBack: number)
getInstitutionalOwnersByTicker(ticker: string, params?)
getInvestorHoldings(investor: string, params?)
getIncomeStatements(ticker: string, params?)
getSECFilings(ticker: string, params?)
```

**API Key Storage:** localStorage (`fd_api_key`)

**Base URL:** `https://api.financialdatasets.ai`

### Type Definitions

**File:** `src/types/financialDatasets.types.ts`

Key types:
- `InsiderTrade` - Individual insider transaction
- `InsiderSentiment` - Aggregated sentiment analysis
- `InstitutionalHolding` - Single institutional position
- `IncomeStatement` - Full income statement
- `SECFiling` - Filing metadata

### File Structure

```
src/
├── services/
│   └── financialDatasetsService.ts    # API client
├── types/
│   └── financialDatasets.types.ts     # TypeScript types
├── components/panels/
│   ├── InsiderActivityPanel.tsx       # INS panel
│   ├── InsiderActivityPanel.css
│   ├── InstitutionalPanel.tsx         # INST panel
│   ├── InstitutionalPanel.css
│   ├── FundamentalsPanel.tsx          # FD panel
│   ├── FundamentalsPanel.css
│   ├── FilingsPanel.tsx               # FILINGS panel
│   └── FilingsPanel.css
```

---

## Command Bar Updates

New commands added to `FUNCTION_CODES`:

| Code | Panel | Description |
|------|-------|-------------|
| INS | Insider Activity | View insider trades & sentiment |
| INSIDER | Insider Activity | Alias |
| INST | Institutional | Who owns what - 13F filings |
| INSTITUTIONAL | Institutional | Alias |
| WHALE | Institutional | Track whale portfolios |
| FD | Fundamentals | Income statements, EPS, margins |
| FUND | Fundamentals | Alias |
| FUNDAMENTALS | Fundamentals | Alias |
| FILINGS | SEC Filings | 10-K, 10-Q, 8-K filings |
| SEC | SEC Filings | Alias |
| 10K | SEC Filings | Alias |
| 8K | SEC Filings | Alias |

---

## UI/UX Design

### Color Scheme (Terminal Style)
- Background: `#0a0a0a` (near black)
- Text: `#00ff00` (terminal green)
- Positive: `#00ff00` (green)
- Negative: `#ff4444` (red)
- Neutral: `#888` (gray)
- Links: `#00aaff` (blue)
- Borders: `#333` (dark gray)

### Interaction Patterns
- Symbol input with GO button
- Clickable investor names to explore portfolios
- Hover effects on table rows
- External links open in new tab
- Refresh button on all panels

---

## Data Sources

| Endpoint | Data | Refresh |
|----------|------|---------|
| `/insider-trades` | Insider buys/sells | Real-time (SEC filings) |
| `/institutional-ownership` | 13F holdings | Quarterly (45-day lag) |
| `/financials/income-statements` | Income statements | Quarterly |
| `/filings` | SEC filings | Real-time |
| `/prices/snapshot` | Current price | Real-time |

---

## Future Enhancements

### Phase 2
- [ ] Balance Sheet panel
- [ ] Cash Flow Statement panel
- [ ] Company News panel
- [ ] Crypto Prices panel

### Phase 3
- [ ] Insider activity alerts
- [ ] Institutional position change tracking
- [ ] Earnings calendar integration
- [ ] AI-powered fundamental analysis

---

## Testing Checklist

- [ ] INS panel loads for valid ticker
- [ ] INS panel shows error for invalid ticker
- [ ] INST "By Ticker" mode works
- [ ] INST "By Investor" mode works
- [ ] INST investor quick-select buttons work
- [ ] FD period toggle (quarterly/annual/TTM) works
- [ ] FD growth rates calculated correctly
- [ ] FILINGS type filter works
- [ ] FILINGS opens SEC.gov links
- [ ] All panels handle API errors gracefully
- [ ] All panels show loading state
- [ ] Symbol search works in all panels

---

## Changelog

### v1.4.0 (2026-01-31)
- **Added:** INS (Insider Activity) panel
- **Added:** INST (Institutional Ownership) panel  
- **Added:** FD (Fundamentals) panel
- **Added:** FILINGS (SEC Filings) panel
- **Added:** Financial Datasets API service
- **Added:** Type definitions for financial data
- **Added:** 12 new command aliases
- **Added:** Whale tracking quick-select (Buffett, Citadel, etc.)
