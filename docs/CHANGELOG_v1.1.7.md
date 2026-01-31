# Changelog v1.1.7 - Activity Log & Connection Status Fix

**Date:** 2026-01-20  
**Status:** Implemented

---

## New Features

### 1. Activity Log Panel (ACT)

New panel that tracks trade executions and important events with Demo/Real mode labels.

**Features:**
- Shows trade opens with symbol, amount, and side (BUY/SELL)
- Shows trade closes with realized profit/loss
- Displays rejected orders with error messages
- Color-coded Demo (cyan) vs Real (orange) mode badges
- Filter by All/Demo/Real
- Unread count badge
- Mark all as read / Clear all buttons

**How to use:**
1. Open via command bar: type `ACT` and press Enter
2. Execute trades - they appear automatically in the log
3. Click items to mark as read

### 2. Connection Status Panel Improvements

Fixed the confusing connection status display.

**Before:** Only showed WebSocket status (which was disconnected)
**After:** Shows both REST API status (working) AND WebSocket status (optional)

**Changes:**
- Added "REST API" section showing connected status based on endpoint tests
- Renamed WebSocket section to "WebSocket Streaming (Optional)"
- Added note explaining WebSocket is optional (REST polling is fallback)
- Green REST API box when endpoints are working

### 3. Trade Execution Notifications

All trade operations now log to the Activity panel:

- **Trade Open:** When you open a position via Trade Ticket
- **Trade Close:** When you close a position from Portfolio
- **Order Rejected:** When a trade fails with error details
- **Errors:** General trading errors

---

## Files Changed

| File | Change |
|------|--------|
| `src/stores/activityStore.ts` | **NEW** - Activity tracking store |
| `src/components/panels/ActivityPanel.tsx` | **NEW** - Activity log panel |
| `src/components/panels/ActivityPanel.css` | **NEW** - Activity panel styles |
| `src/components/panels/PortfolioPanel.tsx` | Added activity logging for close trades |
| `src/components/panels/TradeTicket.tsx` | Added activity logging for open trades |
| `src/components/panels/ConnectionStatusPanel.tsx` | Added REST API status section |
| `src/components/panels/ConnectionStatusPanel.css` | Added REST API section styles |
| `src/App.tsx` | Registered ACT panel |

---

## Activity Store API

```typescript
import { activityStore } from './stores/activityStore';

// Add trade open notification
activityStore.addTradeOpen('demo', 'AAPL', 100, 'buy');

// Add trade close notification
activityStore.addTradeClose('demo', 'AAPL', 15.50);

// Add order rejected notification
activityStore.addOrderRejected('real', 'TSLA', 'Insufficient funds');

// Add general error
activityStore.addError('demo', 'Connection lost', 'WebSocket disconnected');

// Subscribe to activities
const unsubscribe = activityStore.subscribe((activities) => {
  console.log('Activities:', activities);
});

// Get unread count
const count = activityStore.getUnreadCount();

// Mark as read
activityStore.markAsRead('activity-123');
activityStore.markAllAsRead();

// Clear all
activityStore.clearAll();
```

---

## Testing

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| ACT-001 | Open ACT panel | Panel shows empty state |
| ACT-002 | Execute demo trade | Activity appears with DEMO badge |
| ACT-003 | Close position | Close activity shows profit/loss |
| ACT-004 | Filter by Demo | Only demo activities shown |
| ACT-005 | Mark all as read | Unread badge disappears |
| CS-001 | Check connection status | REST API shows CONNECTED |
| CS-002 | Check WebSocket note | Shows "optional" message |

---

## Panel Summary

Now 18 panels total:

| Code | Panel | Category |
|------|-------|----------|
| QT | Quote Tile | Market Data |
| WL | Watchlists | Market Data |
| WLM | Watchlist Monitor | Market Data |
| CH | Chart | Market Data |
| EXP | Asset Explorer | Market Data |
| PF | Portfolio | Trading |
| TRD | Trade Ticket | Trading |
| ORD | Blotter | Trading |
| ACT | **Activity Log** | Trading |
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

1. **Close Trade May Fail:** If the eToro API returns an error, check:
   - Position ID is valid
   - Market is open
   - You have sufficient permissions
   - The close endpoint format is correct

2. **WebSocket Not Connecting:** This is expected - eToro's WebSocket may require specific auth. REST polling works as fallback.

---

## Debugging Trade Closes

If close trade doesn't work, check the console for:

```
Failed to close position: [error message]
```

Common issues:
- **403 Forbidden:** Permissions issue
- **404 Not Found:** Position doesn't exist or already closed
- **400 Bad Request:** Invalid request format

The Activity panel will show the error details.
