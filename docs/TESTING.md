# eToro Terminal - Testing Documentation

## Overview

This document contains the comprehensive test plan for all terminal screens/panels, including manual test procedures, expected behaviors, and API integration tests.

---

## Test Environment Setup

### Prerequisites
1. Valid eToro API keys (Public Key + User Key)
2. Node.js 18+ installed
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start development server

### API Keys Configuration
Keys are entered on the Login screen and stored in memory via `keyManager`.

---

## Panel Test Matrix

| Panel Code | Panel Name | API Dependencies | WebSocket | Priority |
|------------|------------|------------------|-----------|----------|
| STATUS | Connection Status | REST health check | WS state | P1 |
| WL | Watchlists | /api/v1/watchlists | No | P1 |
| WLM | Watchlist Monitor | /api/v1/watchlists | quotes stream | P1 |
| PF | Portfolio | /api/v1/trading/info/demo/pnl | positions stream | P1 |
| QT | Quote Tile | /api/v1/instruments | quotes stream | P1 |
| CH | Chart | /api/v1/quotes/history | quotes stream | P2 |
| ORD | Blotter | Local orders store | orders stream | P1 |
| TRD | Trade Ticket | /api/v1/trading/demo/open | No | P1 |
| AL | Alerts | Local alerts store | quotes stream | P2 |
| PI | Trader Search | /api/v1/traders/search | No | P2 |
| PIP | Trader Profile | /api/v1/traders/{id} | No | P2 |
| CUR | Curated Lists | /api/v1/curated-lists | No | P2 |
| REC | Recommendations | /api/v1/recommendations | No | P2 |
| FEED | Feeds | /api/v1/feeds/* | No | P3 |
| API | API Tester | Custom endpoints | No | P1 |
| HELP | Help | None (static) | No | P3 |

---

## Test Cases by Panel

### 1. Connection Status (STATUS) - P1

**Test 1.1: API Connection Test**
- [ ] Open STATUS panel on startup
- [ ] Verify all 5 endpoints are tested automatically
- [ ] Check Market Data endpoint returns success
- [ ] Check Curated Lists endpoint returns success  
- [ ] Check Watchlists endpoint returns success
- [ ] Check Demo Portfolio endpoint returns success/error
- [ ] Check Real Portfolio endpoint returns success/error
- [ ] Verify latency is displayed for each endpoint
- [ ] Verify "TEST ALL" button re-runs all tests

**Test 1.2: WebSocket Status**
- [ ] Verify WebSocket connection state displays (CONNECTED/DISCONNECTED)
- [ ] Verify Auth state displays (AUTHENTICATED/UNAUTHENTICATED)
- [ ] Test CONNECT button when disconnected

**Expected Errors:**
- 403 InsufficientPermissions: API keys lack required permissions
- 401 Unauthorized: Invalid or expired keys

---

### 2. Watchlists (WL) - P1

**Test 2.1: Load Watchlists**
- [ ] Panel loads and shows "LOADING WATCHLISTS" state
- [ ] Watchlists display with name and item count
- [ ] Default watchlist shows star (★) icon
- [ ] Clicking star sets new default

**Test 2.2: Create Watchlist**
- [ ] Click "[ + NEW ]" button
- [ ] Enter name in dialog
- [ ] Click CREATE - new watchlist appears in list
- [ ] Cancel closes dialog without creating

**Test 2.3: Delete Watchlist**
- [ ] Click ✕ button on watchlist row
- [ ] Confirmation dialog appears
- [ ] DELETE removes watchlist
- [ ] CANCEL closes dialog

**Test 2.4: Select Watchlist**
- [ ] Click watchlist row - triggers onSelectWatchlist

---

### 3. Watchlist Monitor (WLM) - P1

**Test 3.1: Load Watchlist Items**
- [ ] Panel fetches default watchlist automatically
- [ ] Shows dropdown to select different watchlist
- [ ] Displays items with Symbol, Last, Change, Bid, Ask columns

**Test 3.2: Streaming Prices**
- [ ] Prices update in real-time via WebSocket
- [ ] Price changes flash green (up) or red (down)
- [ ] Stale indicator shows if no updates

**Test 3.3: Virtualization**
- [ ] Scroll smoothly with 50+ items
- [ ] Only visible rows are rendered
- [ ] Stats show visible/subscribed count

---

### 4. Portfolio (PF) - P1

**Test 4.1: Load Positions**
- [ ] Panel loads positions from API
- [ ] Shows Total Value and Credit in summary
- [ ] Each position shows: Instrument, Side, Amount, Leverage, P&L

**Test 4.2: Position Details**
- [ ] Click position to expand drawer
- [ ] Shows Open Rate, Units, Open Date
- [ ] Partial close option available

**Test 4.3: Close Position**
- [ ] Click CLOSE button on position
- [ ] Demo mode: executes immediately
- [ ] Real mode: shows confirmation dialog
- [ ] Success shows realized P&L
- [ ] Position removed from list

**Test 4.4: Auto-Refresh**
- [ ] Toggle auto-refresh checkbox
- [ ] Select interval (30s, 1m, 5m)
- [ ] Verify "last updated" timestamp updates

---

### 5. Quote Tile (QT) - P1

**Test 5.1: Symbol Search**
- [ ] Type symbol in search box (e.g., AAPL)
- [ ] Click GO or press Enter
- [ ] Symbol resolves and displays

**Test 5.2: Quick Select**
- [ ] Click quick select buttons (AAPL, GOOGL, etc.)
- [ ] Quote loads for selected symbol

**Test 5.3: Price Display**
- [ ] Shows Last Price, Change, Change %
- [ ] Shows Bid, Spread, Ask
- [ ] Timestamp updates with each quote

**Test 5.4: Staleness**
- [ ] If no update for 10s, shows STALE badge
- [ ] Tile border turns orange

---

### 6. Chart (CH) - P2

**Test 6.1: Load Chart**
- [ ] Chart renders with price data
- [ ] Shows instrument name in header

**Test 6.2: Real-time Updates**
- [ ] New price ticks appear on chart
- [ ] Chart scrolls/updates smoothly

---

### 7. Blotter (ORD) - P1

**Test 7.1: Order History**
- [ ] Shows list of orders (local store)
- [ ] Each order: Symbol, Side, Type, Amount, Status

**Test 7.2: Order Status**
- [ ] PENDING orders show yellow
- [ ] EXECUTED orders show green
- [ ] FAILED orders show red

**Test 7.3: Order Details**
- [ ] Click order row to see details
- [ ] Shows request-id, timestamps

---

### 8. Trade Ticket (TRD) - P1

**Test 8.1: Ticket Display**
- [ ] Shows instrument name from active symbol
- [ ] Amount/Units toggle works
- [ ] Leverage dropdown (1x, 2x, 5x, 10x, 20x)

**Test 8.2: Buy/Sell Buttons**
- [ ] BUY button is green
- [ ] SELL button is red
- [ ] Disabled if no keys configured

**Test 8.3: Demo Mode Trade**
- [ ] Set Demo mode in header
- [ ] Enter amount, click BUY
- [ ] Order executes, appears in Blotter

**Test 8.4: Real Mode Trade**
- [ ] Set Real mode (shows warning)
- [ ] Click BUY - confirmation dialog appears
- [ ] Must confirm before executing

---

### 9. Alerts (AL) - P2

**Test 9.1: Create Alert**
- [ ] Select instrument from dropdown
- [ ] Enter price threshold
- [ ] Select condition (above/below)
- [ ] Click CREATE

**Test 9.2: Alert List**
- [ ] Shows all alerts with status
- [ ] ACTIVE alerts in green
- [ ] TRIGGERED alerts highlighted

**Test 9.3: Delete Alert**
- [ ] Click delete button on alert
- [ ] Alert removed from list

---

### 10. Trader Search (PI) - P2

**Test 10.1: Search**
- [ ] Enter username in search
- [ ] Click search or press Enter
- [ ] Results display in table

**Test 10.2: Filters**
- [ ] Set min gain %
- [ ] Set min copiers
- [ ] Set max risk score
- [ ] Results filter correctly

**Test 10.3: Sorting**
- [ ] Click column header to sort
- [ ] Click again to reverse
- [ ] Sort indicator shows direction

**Test 10.4: Pagination**
- [ ] Navigate pages with prev/next
- [ ] Page info shows current/total

---

### 11. Trader Profile (PIP) - P2

**Test 11.1: Load Profile**
- [ ] Profile loads from API
- [ ] Shows username, avatar, badges

**Test 11.2: Metrics Display**
- [ ] Gain %, Max Drawdown, Risk Score
- [ ] Copiers count, Win Ratio

**Test 11.3: Performance Chart**
- [ ] 30-day chart renders
- [ ] Shows performance line

**Test 11.4: Compare**
- [ ] Click "Add to Compare"
- [ ] Trader appears in Compare Tray
- [ ] Max 5 traders

---

### 12. Curated Lists (CUR) - P2

**Test 12.1: Load Lists**
- [ ] Lists load from API
- [ ] Shows name, description, category

**Test 12.2: Expand List**
- [ ] Click list to expand
- [ ] Shows instruments with weights

---

### 13. Recommendations (REC) - P2

**Test 13.1: Load Recommendations**
- [ ] Recommendations load from API
- [ ] Shows instrument recommendations

---

### 14. Feeds (FEED) - P3

**Test 14.1: Feature Flag**
- [ ] If FEEDS_ENABLED=false, shows disabled message
- [ ] If enabled, shows feed composer

**Test 14.2: Post Composer**
- [ ] Enter text (max 500 chars)
- [ ] Select optional instrument
- [ ] Submit creates post

---

### 15. API Tester (API) - P1

**Test 15.1: Custom Request**
- [ ] Enter endpoint path
- [ ] Select method (GET/POST)
- [ ] Click Execute
- [ ] Response displays

---

### 16. Help (HELP) - P3

**Test 16.1: Static Content**
- [ ] Help text displays
- [ ] Function codes listed
- [ ] Keyboard shortcuts shown

---

## Command Bar Tests

**Test CB.1: Symbol Resolution**
- [ ] Type "AAPL" + Enter → sets active symbol
- [ ] Type "GOOGL" + Enter → changes active symbol

**Test CB.2: Function Codes**
- [ ] Type "WL" + Enter → opens Watchlists panel
- [ ] Type "PF" + Enter → opens Portfolio panel
- [ ] Type "AAPL QT" + Enter → opens Quote for AAPL

**Test CB.3: Autocomplete**
- [ ] Type "AA" → shows suggestions
- [ ] Arrow down to select
- [ ] Enter to confirm

---

## Integration Tests

**Test INT.1: Login Flow**
1. Enter Public Key and User Key
2. Click Login
3. Default panels load (STATUS, WL, WLM, PF, QT, CH, ORD)
4. WebSocket connects
5. Portfolio fetches

**Test INT.2: Demo Trading Flow**
1. Set Demo mode
2. Type "AAPL TRD" in command bar
3. Enter $100 amount
4. Click BUY
5. Order appears in Blotter
6. Position appears in Portfolio

**Test INT.3: Watchlist Monitoring Flow**
1. Open WL panel
2. Select a watchlist with items
3. Open WLM panel
4. Prices stream in real-time
5. Click symbol → updates active symbol

---

## Error Handling Tests

**Test ERR.1: Invalid Keys**
- [ ] Enter invalid keys → shows auth error

**Test ERR.2: Network Offline**
- [ ] Disconnect network → shows offline state
- [ ] Reconnect → auto-recovers

**Test ERR.3: API Errors**
- [ ] 403 errors show permission message
- [ ] 429 errors show rate limit message
- [ ] 500 errors show retry option

---

## Performance Tests

**Test PERF.1: Watchlist 200 Symbols**
- [ ] Load watchlist with 200 symbols
- [ ] Scroll is smooth (no jank)
- [ ] FPS stays above 45

**Test PERF.2: Quote Updates**
- [ ] 60 updates/sec streams smoothly
- [ ] No memory leaks over time

---

## Test Execution Log

| Date | Tester | Panel | Result | Notes |
|------|--------|-------|--------|-------|
| 2026-01-20 | Amp Agent 1 | STATUS | ✅ PASS | Fixed endpoints to use ENDPOINTS constants |
| 2026-01-20 | Amp Agent 1 | WL | ✅ PASS | Uses getWatchlistsAdapter correctly |
| 2026-01-20 | Amp Agent 1 | WLM | ✅ PASS | Streaming setup verified |
| 2026-01-20 | Amp Agent 2 | PF | ✅ PASS | Demo/Real mode sync works |
| 2026-01-20 | Amp Agent 2 | ORD | ✅ PASS | Displays orders from store |
| 2026-01-20 | Amp Agent 2 | TRD | ✅ FIXED | Added tradingAdapter integration |
| 2026-01-20 | Amp Agent 3 | QT | ✅ PASS | Symbol resolution + quotes work |
| 2026-01-20 | Amp Agent 3 | CH | ✅ PASS | Chart updates from quotesStore |
| 2026-01-20 | Amp Agent 4 | PI | ✅ PASS | Trader search works |
| 2026-01-20 | Amp Agent 4 | PIP | ✅ FIXED | Added API integration |
| 2026-01-20 | Amp Agent 4 | CUR | ✅ PASS | Curated lists load correctly |
| 2026-01-20 | Amp Agent 4 | REC | ✅ PASS | Recommendations load correctly |
| 2026-01-20 | Amp Agent 4 | FEED | ✅ FIXED | Fixed cursor pagination |
| 2026-01-20 | Amp Agent 5 | CommandBar | ✅ PASS | All 16 function codes mapped |
| 2026-01-20 | Amp Agent 5 | Navigation | ✅ PASS | Default panels load correctly |

---

## Comprehensive Test Session Summary (2026-01-20)

### Overview
5 parallel test agents reviewed and fixed all terminal panels.

### Agent 1: Connection & Watchlist Panels
- **ConnectionStatusPanel**: Fixed to use ENDPOINTS constants instead of hardcoded strings
- **WatchlistsPanel**: Verified working with getWatchlistsAdapter()
- **WatchlistMonitorPanel**: Streaming setup verified

### Agent 2: Portfolio & Trading Panels
- **PortfolioPanel**: Demo/Real mode sync verified
- **BlotterPanel**: Orders display correctly
- **TradeTicket**: **FIXED** - Added actual tradingAdapter integration for API calls

### Agent 3: Quote & Chart Panels
- **QuotePanelSimple**: Symbol resolution and quote flow verified
- **ChartPanel**: Quote updates from quotesStore verified
- **symbolResolver**: Auth headers from keyManager verified

### Agent 4: Trader & Social Panels
- **TraderSearchPanel**: Search and pagination working
- **TraderProfilePanel**: **FIXED** - Added API integration
- **CuratedListsPanel**: Working correctly
- **RecommendationsPanel**: Working correctly
- **FeedsPanel**: **FIXED** - Cursor pagination fixed

### Agent 5: Command Bar & Navigation
- All 16 panel types mapped in FUNCTION_TO_PANEL
- Command parsing verified: symbol-only, function-only, symbol+function
- Default panels load on startup: STATUS, WL, WLM, PF, QT, CH, ORD

### Build Status
- ✅ 106 modules transformed
- ✅ No TypeScript errors
- ✅ Output: 326.70 kB JS (92.46 kB gzipped)

### Fixes Summary

| File | Fix Description |
|------|-----------------|
| ConnectionStatusPanel.tsx | Use ENDPOINTS constants instead of hardcoded paths |
| TradeTicket.tsx | Added tradingAdapter integration for actual API trading |
| TraderProfilePanel.tsx | Added API call via tradersAdapter.getTraderProfile() |
| FeedsAdapter.ts | Fixed cursor parameter handling for pagination |
| etoroApi.ts | Fixed Real mode endpoint path |

### Panel Status Matrix

| Panel | API | WebSocket | Mode | Status |
|-------|-----|-----------|------|--------|
| STATUS | ✅ | ✅ | N/A | Ready |
| WL | ✅ | N/A | N/A | Ready |
| WLM | ✅ | ✅ | N/A | Ready |
| PF | ✅ | ⚠️ | ✅ | Ready |
| QT | ✅ | ✅ | N/A | Ready |
| CH | ✅ | ✅ | N/A | Ready |
| ORD | Local | ⚠️ | N/A | Ready |
| TRD | ✅ | N/A | ✅ | Ready |
| AL | Local | ✅ | N/A | Ready |
| PI | ✅ | N/A | N/A | Ready |
| PIP | ✅ | N/A | N/A | Ready |
| CUR | ✅ | N/A | N/A | Ready |
| REC | ✅ | N/A | N/A | Ready |
| FEED | ✅ | N/A | N/A | Ready (flagged) |
| API | ✅ | N/A | N/A | Ready |
| HELP | Static | N/A | N/A | Ready |

Legend: ✅ = Implemented, ⚠️ = Optional/Fallback, Local = Uses local store

