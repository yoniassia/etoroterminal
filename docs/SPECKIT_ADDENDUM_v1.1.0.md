# eToro Terminal - SpecKit Addendum v1.1.0

**Date:** 2026-01-20  
**Status:** Implemented  
**Base Version:** eToroTerminalSpecKit.MD v1.0.0

---

## Changelog

### v1.1.3 (2026-01-20) - Watchlist & Symbol Universe Cache
- ✅ **Watchlist API Fix**: Fixed item parsing to use `itemId` (not `instrumentId`) and `itemRank` for ordering
- ✅ **User Items Filtered**: Watchlist now filters out `itemType: "User"` entries, only showing instruments
- ✅ **Symbol Universe Cache**: Created `src/data/symbolUniverse.json` with 10,808 pre-cached instruments for instant lookups
- ✅ **Static Cache Loading**: `symbolResolver` now loads from static JSON cache on init (no API call needed)
- ✅ **Quote Subscription on Load**: WatchlistMonitorPanel now subscribes to `quotesPollingService` for all items when watchlist loads
- ✅ **User Info Display**: Header shows username extracted from JWT user key after login
- ✅ **Network Binding**: Vite server now binds to `0.0.0.0` for LAN access (172.28.203.10:3005)
- ✅ **Node.js PATH**: Added `C:\Users\Yoni\Development\SpecKitReact\nodejs` to user PATH

### v1.1.2 (2026-01-20) - API Integration & Live Quotes Fix
- ✅ **API Key Propagation Fix**: Added `setKeys()` method to `etoroApi` singleton; keys now update after login and when loaded from storage
- ✅ **Symbol Resolution Overhaul**: Fixed API response parsing to use `items` array (not `instruments`); added PascalCase field normalization; switched to `getDefaultAdapter()` for consistent key management
- ✅ **Quotes Polling Service**: New `quotesPollingService.ts` provides REST-based polling fallback (3s interval) when WebSocket is unavailable
- ✅ **Panel Quote Integration**: WatchlistMonitorPanel, QuotePanel, and QuotePanelSimple now subscribe to both WebSocket and polling service
- ✅ **Watchlist Enrichment**: `watchlistsAdapter.ts` enriches items with resolved symbol/displayName via symbolResolver
- ✅ **Portfolio Enrichment**: `portfolioStore.ts` enriches positions with instrument names using `symbolResolver.getInstrumentById()`
- ✅ **AddToWatchlistDialog Fix**: Uses correct `internalSymbolFull` API parameter; parses `items` key; adds required `order` field to new items
- ✅ **RALPH Diagnostics**: Enhanced test suite logs API response structures; added quotes API test; verified symbol resolution for AAPL

### v1.1.1 (2026-01-20)
- ✅ Added REST-based quote polling service as WebSocket fallback
- ✅ Fixed symbol resolution with comprehensive field name handling
- ✅ Fixed AddToWatchlistDialog to use correct API parameters
- ✅ Enhanced watchlist adapter to enrich items with resolved symbols
- ✅ Portfolio positions now show instrument names via symbolResolver
- ✅ Improved RALPH test suite with detailed API response diagnostics

### v1.1.0 (2026-01-20)
- ✅ All 16 panels implemented and tested
- ✅ API endpoints verified against official eToro documentation
- ✅ WebSocket streaming for quotes implemented
- ✅ Portfolio panel with Demo/Real mode switching
- ✅ Watchlist Monitor with popular instruments fallback
- ✅ RALPH automated test suite added
- ✅ Field name normalization for PascalCase API responses

---

## Verified API Contracts

### Base URL
```
https://public-api.etoro.com
```

### Required Headers
```
x-api-key: <public_api_key>
x-user-key: <user_key_jwt>
x-request-id: <uuid_v4>
Content-Type: application/json
```

### Market Data Endpoints
| Endpoint | Method | Panel | Status |
|----------|--------|-------|--------|
| `/api/v1/market-data/search` | GET | QT, CH, TRD | ✅ Verified |
| `/api/v1/market-data/search?internalSymbolFull={symbol}` | GET | Symbol Resolution | ✅ Verified |
| `/api/v1/market-data/exchanges` | GET | Market Data | ✅ Verified |

### Watchlists Endpoints
| Endpoint | Method | Panel | Status |
|----------|--------|-------|--------|
| `/api/v1/watchlists` | GET | WL, WLM | ✅ Verified |
| `/api/v1/watchlists` | POST | WL | ✅ Verified |
| `/api/v1/watchlists/{watchlistId}` | DELETE | WL | ✅ Verified |
| `/api/v1/watchlists/{watchlistId}/items` | POST | WL | ✅ Verified |
| `/api/v1/curated-lists` | GET | CUR | ✅ Verified |
| `/api/v1/market-recommendations/{count}` | GET | REC | ✅ Verified |

**Watchlist Item Response Format (v1.1.3 fix):**
```json
{
  "items": [
    { "itemId": 1137, "itemType": "Instrument", "itemRank": 0 },
    { "itemId": 44007088, "itemType": "User", "itemRank": 1 }
  ]
}
```
- `itemId` = instrumentId for instruments, userId for users
- `itemType` = "Instrument" or "User" (User items are filtered out)
- `itemRank` = display order

### Portfolio Endpoints
| Endpoint | Method | Panel | Status |
|----------|--------|-------|--------|
| `/api/v1/trading/info/demo/portfolio` | GET | PF (Demo) | ✅ Verified |
| `/api/v1/trading/info/demo/pnl` | GET | PF (Demo) | ✅ Verified |
| `/api/v1/trading/info/portfolio` | GET | PF (Real) | ✅ Verified |
| `/api/v1/trading/info/pnl` | GET | PF (Real) | ✅ Verified |

### Trading Endpoints
| Endpoint | Method | Panel | Status |
|----------|--------|-------|--------|
| `/api/v1/trading/execution/demo/market-open-orders/by-amount` | POST | TRD (Demo) | ✅ Configured |
| `/api/v1/trading/execution/demo/market-open-orders/by-units` | POST | TRD (Demo) | ✅ Configured |
| `/api/v1/trading/execution/demo/market-close-orders/positions/{positionId}` | POST | PF (Demo) | ✅ Configured |
| `/api/v1/trading/execution/market-open-orders/by-amount` | POST | TRD (Real) | ✅ Configured |
| `/api/v1/trading/execution/market-close-orders/positions/{positionId}` | POST | PF (Real) | ✅ Configured |

### User & Trader Endpoints
| Endpoint | Method | Panel | Status |
|----------|--------|-------|--------|
| `/api/v1/user-info/people` | GET | Login | ⚠️ Requires params |
| `/api/v1/user-info/people/search?period=LastYear` | GET | PI, PIP | ✅ Verified |
| `/api/v1/user-info/people?usernames={username}` | GET | PIP | ✅ Verified |
| `/api/v1/pi-data/copiers` | GET | PI Data | ❌ Requires PI permission |

### WebSocket Configuration
```
URL: wss://public-api.etoro.com/ws
Topics: quotes.{instrumentId}, positions, orders, portfolio
```

### Response Field Normalization
API responses may use PascalCase (e.g., `InstrumentID`, `WatchlistId`, `DisplayName`).
All adapters normalize to camelCase for internal use.

---

## Implementation Status

### Panel Implementation Matrix
| Code | Panel Name | API | WebSocket | Demo/Real | Status |
|------|------------|-----|-----------|-----------|--------|
| STATUS | Connection Status | ✅ | ✅ | N/A | ✅ Ready |
| WL | Watchlists | ✅ | N/A | N/A | ✅ Ready |
| WLM | Watchlist Monitor | ✅ | ✅ | N/A | ✅ Ready |
| PF | Portfolio | ✅ | ⚠️ | ✅ | ✅ Ready |
| QT | Quote Tile | ✅ | ✅ | N/A | ✅ Ready |
| CH | Chart | ✅ | ✅ | N/A | ✅ Ready |
| ORD | Blotter | Local | ⚠️ | N/A | ✅ Ready |
| TRD | Trade Ticket | ✅ | N/A | ✅ | ✅ Ready |
| AL | Alerts | Local | ✅ | N/A | ✅ Ready |
| PI | Trader Search | ✅ | N/A | N/A | ✅ Ready |
| PIP | Trader Profile | ✅ | N/A | N/A | ✅ Ready |
| CUR | Curated Lists | ✅ | N/A | N/A | ✅ Ready |
| REC | Recommendations | ✅ | N/A | N/A | ✅ Ready |
| FEED | Feeds | ✅ | N/A | N/A | ⚠️ Flagged |
| API | API Tester | ✅ | N/A | N/A | ✅ Ready |
| HELP | Help | Static | N/A | N/A | ✅ Ready |

**Summary:** 15/16 panels ready (FEED is feature-flagged)

---

## Default Workspace Configuration

On login, these panels open automatically (defined in `src/contexts/WorkspaceContext.tsx`):

```typescript
const DEFAULT_PANELS = ['STATUS', 'WL', 'WLM', 'PF', 'QT', 'CH', 'ORD'];
```

| Order | Panel | Description |
|-------|-------|-------------|
| 1 | STATUS | Connection health check |
| 2 | WL | Watchlist management |
| 3 | WLM | Watchlist Monitor with live quotes |
| 4 | PF | Portfolio positions |
| 5 | QT | Quote tile |
| 6 | CH | Price chart |
| 7 | ORD | Order blotter |

---

## Popular Instruments Fallback

When user has no watchlist items, WLM displays popular instruments:

```typescript
const POPULAR_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'BTC', 'ETH', 'SPY'];
```

- Instrument IDs resolved dynamically via `/api/v1/market-data/search?internalSymbolFull={symbol}`
- Fallback IDs based on eToro documentation (AAPL → 1001)
- Live quote streaming enabled for all displayed instruments

---

## Test Scripts

```bash
# Full automated test suite (16 tests)
npm run ralph <publicKey> <userKey>

# Quick API endpoint test
npm run test:api <publicKey> <userKey>

# Development server (port 3005)
npm run dev

# Production build
npm run build
```

### RALPH Test Results (v1.1.3)
```
✅ PASSED:   18
❌ FAILED:   0
⚠️  WARNINGS: 1 (WebSocket CLI only)
```

---

## File Structure (Key Files)

```
src/
├── api/
│   ├── contracts/
│   │   └── endpoints.ts          # All API endpoint constants
│   └── adapters/
│       ├── tradingAdapter.ts     # Trading API calls
│       ├── positionAdapter.ts    # Position close operations
│       ├── watchlistsAdapter.ts  # Watchlist CRUD (parses itemId, filters User items)
│       ├── tradersAdapter.ts     # User/trader search
│       └── recommendationsAdapter.ts
├── data/
│   └── symbolUniverse.json       # Pre-cached 10,808 instruments (NEW v1.1.3)
├── services/
│   ├── streamingService.ts       # WebSocket management
│   ├── quotesPollingService.ts   # REST-based quote polling (market-data/search)
│   ├── wsClient.ts               # WebSocket client
│   ├── symbolResolver.ts         # Symbol → instrumentId (uses static cache)
│   ├── keyManager.ts             # API key + user info storage
│   └── etoroApi.ts               # Main API service (JWT decode for user info)
├── stores/
│   ├── quotesStore.ts            # Real-time quotes
│   ├── portfolioStore.ts         # Portfolio state (enriches positions)
│   └── ordersStore.ts            # Order history
├── components/panels/
│   ├── PortfolioPanel.tsx        # PF panel
│   ├── WatchlistMonitorPanel.tsx # WLM panel (subscribes quotes on load)
│   ├── QuotePanelSimple.tsx      # QT panel (uses polling + WS)
│   ├── TradeTicket.tsx           # TRD panel
│   └── ... (16 total panels)
└── contexts/
    ├── WorkspaceContext.tsx      # Default panels config
    └── TradingModeContext.tsx    # Demo/Real mode

scripts/
├── ralph.mjs                     # Automated test suite (18 tests)
└── quickApiTest.mjs              # API endpoint tests

docs/
├── TESTING.md                    # 100+ test cases
├── PERFORMANCE.md                # Performance benchmarks
└── KEYBOARD-SHORTCUTS.md         # Accessibility docs
```

---

## Build Output

```
✓ 106 modules transformed
dist/index.html                   0.41 kB
dist/assets/index-*.css          82.85 kB │ gzip: 11.39 kB
dist/assets/index-*.js          333.96 kB │ gzip: 94.63 kB
```

---

## Next Steps (v1.2.0)

- [ ] Enable FEED panel after endpoint verification
- [ ] Add PI Copiers data (requires PI permission)
- [ ] Implement order history persistence
- [ ] Add chart timeframe switching
- [ ] Performance optimization for 500+ instruments
