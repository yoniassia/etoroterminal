# Changelog v1.1.5 - Asset Explorer & Autocomplete

**Date:** 2026-01-20  
**Status:** Implemented

---

## New Features

### 1. Asset Explorer Panel (EXP)

Browse the entire instrument universe (10,800+ assets) with powerful filtering.

**How to use:**
1. Open via command bar: type `EXP` and press Enter
2. Filter by Exchange (dropdown with all exchanges)
3. Filter by Type (Stocks, ETFs, Crypto, Indices, etc.)
4. Search by symbol or name
5. Navigate with pagination (50 items per page)

**Filters:**
- **Exchange**: NYSE, NASDAQ, Hong Kong Exchanges, London Stock Exchange, etc.
- **Type**: Stocks, ETFs, Crypto, Indices, Commodities
- **Search**: Filters by symbol prefix or name contains

### 2. Quote Panel Symbol Autocomplete

Type in the Quote panel and get instant symbol suggestions from the cached universe.

**Features:**
- Suggestions appear after typing 1+ characters
- Shows symbol, company name, and exchange
- Keyboard navigation: Arrow Up/Down, Enter to select, Escape to close
- Smart ranking: exact matches first, then prefix matches, then name matches
- Maximum 8 suggestions displayed

**Usage:**
1. Focus the Quote panel input
2. Start typing a symbol (e.g., "AA")
3. Select from dropdown or keep typing
4. Press Enter to load quote

### 3. Watchlist Monitor Scrollbar Fix

Fixed the double scrollbar issue in WatchlistMonitor panel.

**Root cause:** Both the Panel content container AND the WatchlistMonitor viewport had `overflow: auto`.

**Solution:** 
- Panel content now uses `overflow: hidden` with flex layout
- Child components manage their own scrolling
- Added `min-height: 0` for proper flex shrinking

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/panels/AssetExplorerPanel.tsx` | **NEW** - Asset universe browser |
| `src/components/panels/AssetExplorerPanel.css` | **NEW** - Styles for explorer |
| `src/components/panels/QuotePanelSimple.tsx` | Added autocomplete functionality |
| `src/components/panels/QuotePanel.css` | Added autocomplete dropdown styles |
| `src/components/panels/WatchlistMonitor.css` | Fixed scrollbar overflow |
| `src/components/Workspace/Panel.tsx` | Changed content overflow to hidden |
| `src/App.tsx` | Registered EXP panel |
| `docs/SPECKIT_ADDENDUM_v1.1.0.md` | Added v1.1.5 specs |

---

## Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-046 | System MUST provide Asset Explorer panel to browse instruments by exchange and type | ✅ |
| FR-047 | System MUST provide symbol autocomplete in Quote panel from cached universe | ✅ |
| FR-048 | System MUST NOT display duplicate scrollbars in WatchlistMonitor panel | ✅ |

---

## Testing

### Asset Explorer Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| EXP-001 | Open EXP panel via command bar | Panel opens showing all instruments |
| EXP-002 | Filter by NASDAQ exchange | Only NASDAQ instruments shown |
| EXP-003 | Filter by Crypto type | Only crypto assets shown |
| EXP-004 | Search for "AAPL" | Apple Inc. appears in results |
| EXP-005 | Navigate pagination | Pages change, content updates |

### Autocomplete Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| QT-AC-001 | Type "AA" in Quote input | Suggestions dropdown appears |
| QT-AC-002 | Arrow Down/Up | Selection moves through suggestions |
| QT-AC-003 | Press Enter on suggestion | Symbol loads, dropdown closes |
| QT-AC-004 | Press Escape | Dropdown closes, input unchanged |
| QT-AC-005 | Click suggestion | Symbol loads, dropdown closes |

### Scrollbar Fix Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| WLM-SB-001 | Open WatchlistMonitor with many items | Single scrollbar visible |
| WLM-SB-002 | Scroll through large watchlist | Smooth scrolling, no double bars |

---

## Panel Summary

Now 17 panels total:

| Code | Panel | Category |
|------|-------|----------|
| QT | Quote Tile | Market Data |
| WL | Watchlists | Market Data |
| WLM | Watchlist Monitor | Market Data |
| CH | Chart | Market Data |
| EXP | **Asset Explorer** | Market Data |
| PF | Portfolio | Trading |
| TRD | Trade Ticket | Trading |
| ORD | Blotter | Trading |
| CUR | Curated Lists | Discovery |
| REC | Recommendations | Discovery |
| PI | Trader Search | Copy Trading |
| PIP | Trader Profile | Copy Trading |
| FEED | Social Feed | Social |
| AL | Alerts | Notifications |
| API | API Tester | Developer |
| HELP | Help | System |
| STATUS | Connection Status | System |

---

## Known Issues

1. **Large universe loading**: Initial load of 10,800 instruments may briefly flash loading state
2. **Autocomplete delay**: First autocomplete may be slow while universe loads in background

---

## Future Enhancements

- Add "Quick Add to Watchlist" button in Asset Explorer rows
- Add "View Quote" button in Asset Explorer rows
- Industry/sector filtering (requires API enhancement)
- Save filter presets in Asset Explorer
