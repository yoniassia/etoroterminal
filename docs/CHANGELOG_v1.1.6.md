# Changelog v1.1.6 - Panel Linking & Quick Trade

**Date:** 2026-01-20  
**Status:** Implemented

---

## New Features

### 1. Panel Linking - Watchlist/Explorer → Quote

Clicking an instrument in Watchlist Monitor or Asset Explorer now loads it in the Quote panel.

**How it works:**
1. Click any row in Watchlist Monitor or Asset Explorer
2. The symbol is set as "active symbol" via context
3. Quote panel automatically updates to show that symbol

**Technical:**
- Uses `ActiveSymbolContext` for cross-panel communication
- WatchlistMonitorPanel and AssetExplorerPanel call `setActiveSymbol()`
- QuotePanelSimple listens to `activeSymbol` changes

### 2. Quick Trade Buttons

Quote panel now has clickable BUY/SELL buttons that open Trade Ticket.

**How it works:**
1. View any quote in the Quote panel
2. Click the blue "SELL" button (left) to open Trade Ticket for selling
3. Click the orange "BUY" button (right) to open Trade Ticket for buying
4. Trade Ticket opens with the symbol pre-filled

**UI Changes:**
- BID box renamed to "SELL" with hover glow effect
- ASK box renamed to "BUY" with hover glow effect
- Both are now clickable buttons

### 3. Improved Panel Grid Layout

Changed workspace grid from CSS Grid to Flexbox for better drag-drop support.

**Before:** `display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))`
**After:** `display: flex; flex-wrap: wrap` with panel wrappers

**Benefits:**
- More predictable drag-drop ordering
- Panels flow naturally left-to-right, top-to-bottom
- Better support for vertical reordering

---

## Files Changed

| File | Change |
|------|--------|
| `src/contexts/WorkspaceContext.tsx` | Added `pendingSymbol` state and `getPendingSymbol()` |
| `src/components/panels/QuotePanelSimple.tsx` | Added active symbol listening, trade buttons |
| `src/components/panels/QuotePanel.css` | Added trade button hover styles |
| `src/components/panels/WatchlistMonitorPanel.tsx` | Added `handleSelectSymbol` callback |
| `src/components/panels/AssetExplorerPanel.tsx` | Added row click → setActiveSymbol |
| `src/components/panels/TradeTicket.tsx` | Added pending symbol and active symbol support |
| `src/components/Workspace/Workspace.tsx` | Changed grid to flex layout |

---

## User Flow Examples

### Flow 1: Research → Quote → Trade

1. Open Asset Explorer (`EXP`)
2. Filter by "NASDAQ" and type "Stocks"
3. Click "AAPL" row
4. Quote panel updates to show AAPL
5. Click "BUY" on Quote panel
6. Trade Ticket opens with AAPL pre-selected

### Flow 2: Watchlist → Trade

1. Open Watchlist Monitor (`WLM`)
2. Click any symbol in your watchlist
3. Quote panel updates
4. Click "SELL" to open Trade Ticket

---

## Technical Details

### Active Symbol Context

```typescript
// Set active symbol from any panel
const { setActiveSymbol } = useActiveSymbol();
setActiveSymbol('AAPL');

// Listen to active symbol changes
const { activeSymbol } = useActiveSymbol();
useEffect(() => {
  if (activeSymbol) {
    // Load this symbol
  }
}, [activeSymbol]);
```

### Pending Symbol for New Panels

```typescript
// Open panel with specific symbol
const { openPanelForSymbol } = useWorkspaceContext();
openPanelForSymbol('TRD', 'AAPL', 1001);

// In the panel, retrieve pending symbol
const { getPendingSymbol } = useWorkspaceContext();
const pending = getPendingSymbol();
if (pending?.symbol) {
  setSymbol(pending.symbol);
}
```

---

## Testing

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| PL-001 | Click item in Watchlist Monitor | Quote panel shows that symbol |
| PL-002 | Click item in Asset Explorer | Quote panel shows that symbol |
| PL-003 | Click BUY button on Quote panel | Trade Ticket opens with symbol |
| PL-004 | Click SELL button on Quote panel | Trade Ticket opens with symbol |
| PL-005 | Drag panel to new position | Panel reorders in flex grid |

---

## Known Limitations

1. **Single active symbol** - Only one symbol can be active at a time across all panels
2. **No link groups yet** - Link groups (A/B/C) are defined but not fully implemented
3. **Trade side not pre-selected** - Trade Ticket opens but doesn't pre-select buy/sell

---

## Future Enhancements

- Link groups: panels can subscribe to different symbol feeds
- Double-click to open Chart panel
- Right-click context menu on rows
- Pre-select Buy/Sell in Trade Ticket based on which button was clicked
