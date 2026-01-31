# eToro Terminal - SpecKit Addendum v1.1.0

**Date:** 2026-01-20  
**Status:** Implemented  
**Base Version:** eToroTerminalSpecKit.MD v1.0.0

---

## Changelog

### v1.1.6 (2026-01-20) - Panel Linking & Quick Trade
- ✅ **Panel Linking**: Clicking Watchlist Monitor or Asset Explorer items loads symbol in Quote panel
- ✅ **Active Symbol Context**: Cross-panel symbol synchronization via ActiveSymbolContext
- ✅ **Quick Trade Buttons**: BUY/SELL buttons on Quote panel open Trade Ticket with pre-filled symbol
- ✅ **Trade Ticket Symbol Loading**: Trade Ticket receives symbol from pending context or active symbol
- ✅ **Flex Grid Layout**: Workspace uses flex-wrap for better drag-drop panel ordering
- ✅ **Selected Row Highlighting**: Watchlist and Asset Explorer show selected row state

### v1.1.5 (2026-01-20) - Asset Explorer & Quote Autocomplete
- ✅ **Asset Explorer Panel (EXP)**: Browse entire asset universe by exchange, industry, or asset type
- ✅ **Exchange Filtering**: Filter by NYSE, NASDAQ, Hong Kong, and other exchanges
- ✅ **Asset Type Filtering**: Filter by Stocks, ETFs, Crypto, Indices
- ✅ **Search Within Results**: Search within filtered asset results
- ✅ **Add to Watchlist**: Click to view quote or add to watchlist from explorer
- ✅ **Pagination**: Paginated results for large asset sets
- ✅ **Quote Panel Autocomplete**: Symbol autocomplete from cached universe when typing
- ✅ **Autocomplete Display**: Shows matching symbols with name and exchange
- ✅ **Keyboard Navigation**: Up/down arrows and Enter to select from autocomplete
- ✅ **Debounced Search**: Debounced autocomplete search for performance
- ✅ **Scrollbar Fix**: Removed duplicate scrollbar issue in WatchlistMonitor panel

### v1.1.4 (2026-01-20) - Workspace Layout Persistence & Draggable Panels
- ✅ **Layout Persistence**: Users can save current panel configuration as default
- ✅ **Auto-Load Layout**: Saved layout loads automatically on next session
- ✅ **Reset to Factory Defaults**: Option to restore original panel layout
- ✅ **localStorage Storage**: Layout configuration persisted in browser localStorage
- ✅ **Draggable Panel Reordering**: Drag and drop panels to reorder within workspace
- ✅ **Drag Visual Feedback**: Visual indicators during panel drag operations
- ✅ **Keyboard Accessible Reorder**: Arrow keys + modifier for panel repositioning

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

---

## Workspace Features (v1.1.4)

### User Story 14 - Workspace Layout Persistence (Priority: P2)

As a pro trader,  
I want to save my current panel layout as my default workspace,  
so that my preferred configuration loads automatically on my next session.

Why this priority:
Traders develop muscle memory around their workspace layout; preserving it reduces friction and setup time.

Independent Test:
- Arrange panels in custom layout -> save as default -> reload page -> layout restored.
- Reset to factory defaults -> layout returns to DEFAULT_PANELS configuration.
- Clear browser data -> layout reverts to factory defaults.

Acceptance Scenarios:
- Given I have arranged panels in a custom layout, when I click "Save as Default", then the layout is stored in localStorage.
- Given I have saved a default layout, when I open the terminal in a new session, then my saved layout loads automatically.
- Given I want to start fresh, when I click "Reset to Factory Defaults", then the layout returns to the original DEFAULT_PANELS configuration.
- Given localStorage is unavailable or cleared, when I open the terminal, then the factory default layout loads.

---

### User Story 15 - Draggable Panel Reordering (Priority: P2)

As a pro trader,  
I want to drag and drop panels to reorder them in my workspace,  
so that I can quickly reorganize my screen without using menus.

Why this priority:
Direct manipulation of panels is faster and more intuitive than menu-based reordering for power users.

Independent Test:
- Drag a panel header and drop it in a new position -> panel order updates.
- Use keyboard (Ctrl+Arrow keys) to move focused panel -> panel repositions.
- Drag operation shows visual drop indicator.

Acceptance Scenarios:
- Given I am viewing multiple panels, when I drag a panel header, then I see a visual indicator showing the drop target.
- Given I am dragging a panel, when I drop it in a new position, then the panel order updates immediately.
- Given I am dragging a panel, when I drop it outside valid drop zones, then the panel returns to its original position.
- Given I am using keyboard navigation, when I press Ctrl+Arrow keys on a focused panel, then the panel moves in that direction.
- Given I have reordered panels, when I save layout as default, then the new order is persisted.

---

### User Story 16 - Asset Explorer Panel (Priority: P2)

As a pro trader,  
I want to browse the entire asset universe by exchange, industry, or asset type,  
so that I can discover new instruments to trade or add to my watchlists.

Why this priority:
Discovery of new trading opportunities is essential for active traders who want to expand beyond their current watchlists.

Independent Test:
- Open Asset Explorer -> filter by exchange (NYSE) -> results show only NYSE instruments.
- Filter by asset type (ETFs) -> results show only ETFs.
- Search within filtered results -> matching instruments displayed.
- Click instrument -> opens Quote panel or adds to watchlist.

Acceptance Scenarios:
- Given I open the Asset Explorer panel, when the panel loads, then I see filter options for exchange and asset type.
- Given I select an exchange filter (e.g., NASDAQ), when results load, then only instruments from that exchange are displayed.
- Given I select an asset type filter (e.g., Crypto), when results load, then only crypto instruments are displayed.
- Given I have filters applied, when I type in the search box, then results are filtered to match my search term.
- Given I see an instrument in the results, when I click it, then I can view its quote or add it to a watchlist.
- Given there are more than 50 results, when I scroll or click "Load More", then additional results are loaded (pagination).

---

### User Story 17 - Quote Panel Symbol Autocomplete (Priority: P2)

As a pro trader,  
I want symbol autocomplete when typing in the Quote panel,  
so that I can quickly find and select instruments without remembering exact symbols.

Why this priority:
Fast symbol entry reduces friction and errors when looking up quotes.

Independent Test:
- Type "AA" in Quote panel -> autocomplete shows AAPL, AAL, etc.
- Use arrow keys to navigate suggestions -> selection highlighted.
- Press Enter -> selected symbol loads in Quote panel.

Acceptance Scenarios:
- Given I am typing in the Quote panel symbol input, when I type 2+ characters, then matching symbols appear in a dropdown.
- Given autocomplete suggestions are visible, when I use up/down arrow keys, then the selection moves through the list.
- Given a suggestion is highlighted, when I press Enter, then that symbol is selected and loaded.
- Given I am typing quickly, when autocomplete searches, then searches are debounced for performance.
- Given autocomplete suggestions are visible, when I click a suggestion, then that symbol is selected and loaded.

---

### Functional Requirements (v1.1.5)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-046 | The system MUST provide an Asset Explorer panel to browse instruments by exchange and asset type | P2 | ✅ Specified |
| FR-047 | The system MUST provide symbol autocomplete in Quote panel from the cached symbol universe | P2 | ✅ Specified |
| FR-048 | The system MUST NOT display duplicate scrollbars in WatchlistMonitor panel | P2 | ✅ Specified |

---

### Testing Scenarios (v1.1.5)

#### Asset Explorer Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| EXP-001 | Open Asset Explorer panel | Panel displays with exchange and asset type filters |
| EXP-002 | Filter by exchange (NYSE) | Only NYSE instruments shown |
| EXP-003 | Filter by asset type (ETFs) | Only ETF instruments shown |
| EXP-004 | Combine exchange + asset type filters | Results match both filters |
| EXP-005 | Search within filtered results | Results filtered by search term |
| EXP-006 | Click instrument to view quote | Quote panel opens with selected instrument |
| EXP-007 | Click instrument to add to watchlist | Add to Watchlist dialog opens |
| EXP-008 | Pagination with 100+ results | Load More button or scroll loads additional results |

#### Quote Autocomplete Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| QT-AC-001 | Type "AA" in Quote panel | Autocomplete shows AAPL, AAL, etc. |
| QT-AC-002 | Arrow down through suggestions | Selection moves to next item |
| QT-AC-003 | Arrow up through suggestions | Selection moves to previous item |
| QT-AC-004 | Press Enter on highlighted suggestion | Symbol selected and loaded |
| QT-AC-005 | Click suggestion with mouse | Symbol selected and loaded |
| QT-AC-006 | Type rapidly | Debounced search (no request per keystroke) |
| QT-AC-007 | Press Escape | Autocomplete dropdown closes |

#### WatchlistMonitor Scrollbar Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| WLM-SB-001 | Open WatchlistMonitor with 50+ items | Single scrollbar visible |
| WLM-SB-002 | Resize WatchlistMonitor panel | No duplicate scrollbars appear |

---

### Functional Requirements (v1.1.4)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-041 | The system MUST persist workspace layout configuration to localStorage when user saves as default | P2 | ✅ Specified |
| FR-042 | The system MUST load saved layout from localStorage on application startup if available | P2 | ✅ Specified |
| FR-043 | The system MUST provide a "Reset to Factory Defaults" option that restores DEFAULT_PANELS configuration | P2 | ✅ Specified |
| FR-044 | The system MUST support drag-and-drop reordering of panels with visual feedback during drag | P2 | ✅ Specified |
| FR-045 | The system MUST provide keyboard-accessible panel reordering using Ctrl+Arrow keys | P2 | ✅ Specified |

---

### Testing Scenarios (v1.1.4)

#### Layout Persistence Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| WS-001 | Save default layout with 5 panels open | Layout JSON stored in localStorage under `etoro-terminal-layout` key |
| WS-002 | Load saved layout on fresh page load | All 5 panels restored in correct positions |
| WS-003 | Reset to factory defaults | Layout matches DEFAULT_PANELS; localStorage key removed or reset |
| WS-004 | Load with corrupted localStorage data | Graceful fallback to factory defaults; error logged |
| WS-005 | Load with localStorage disabled | Factory defaults load; warning shown in console |

#### Draggable Panel Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| DP-001 | Drag panel from position 1 to position 3 | Panel moves; other panels reflow |
| DP-002 | Drag panel and drop outside workspace | Panel returns to original position |
| DP-003 | Drag panel shows drop indicator | Visual highlight appears at valid drop targets |
| DP-004 | Keyboard: Ctrl+Right on first panel | Panel moves to position 2 |
| DP-005 | Keyboard: Ctrl+Left on first panel | No movement (already at start) |
| DP-006 | Drag and drop then save layout | New order persisted to localStorage |

---

## Next Steps (v1.2.0)

- [ ] Enable FEED panel after endpoint verification
- [ ] Add PI Copiers data (requires PI permission)
- [ ] Implement order history persistence
- [ ] Add chart timeframe switching
- [ ] Performance optimization for 500+ instruments
