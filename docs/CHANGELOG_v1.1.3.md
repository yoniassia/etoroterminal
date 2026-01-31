# eToro Terminal - Changelog v1.1.3

**Date:** 2026-01-20  
**Thread:** T-019bdd3a-17f1-71d4-9d81-e677d6430634  
**Status:** Implemented & Tested

---

## Summary

This release fixes critical issues with watchlist instrument display and real-time quote updates. Added a pre-cached symbol universe for instant lookups.

---

## Files Modified

### Core Services

| File | Changes |
|------|---------|
| `src/services/symbolResolver.ts` | Added static cache loading from `symbolUniverse.json`; `getInstrumentById()` now does direct API lookup if not in cache |
| `src/services/quotesPollingService.ts` | Changed endpoint from `/api/v1/quotes/live` (404) to `/api/v1/market-data/search?instrumentIds=` |
| `src/services/etoroApi.ts` | Added JWT decoding for user info extraction (`getUserInfo()` method) |
| `src/services/keyManager.ts` | Added `username` and `fullName` fields; added `setUserInfo()` and `getUserInfo()` methods |

### API Adapters

| File | Changes |
|------|---------|
| `src/api/adapters/watchlistsAdapter.ts` | Fixed `normalizeWatchlistItem()` to read `itemId` and `itemType`; filters out "User" items |

### Components

| File | Changes |
|------|---------|
| `src/App.tsx` | Added user info display in header; fetches user info after login |
| `src/components/panels/WatchlistMonitorPanel.tsx` | Subscribes to `quotesPollingService` for all items when watchlist loads |
| `src/components/Login.tsx` | No changes (reverted username/fullName fields) |

### Configuration

| File | Changes |
|------|---------|
| `vite.config.ts` | Added `host: '0.0.0.0'` for LAN network access |

### New Files

| File | Description |
|------|-------------|
| `src/data/symbolUniverse.json` | Pre-cached 10,808 instruments with id, symbol, name, type, exchange |

### Test Suite

| File | Changes |
|------|---------|
| `scripts/ralph.mjs` | Updated quotes test to use `/api/v1/market-data/search?instrumentIds=` endpoint |

---

## Bug Fixes

### 1. Watchlist Items Not Displaying Names

**Problem:** Watchlist API returns `itemId` and `itemType`, not `instrumentId`.

**API Response:**
```json
{
  "items": [
    { "itemId": 1137, "itemType": "Instrument", "itemRank": 0 },
    { "itemId": 44007088, "itemType": "User", "itemRank": 1 }
  ]
}
```

**Fix:** Updated `watchlistsAdapter.ts`:
- Read `itemId` as `instrumentId`
- Filter out `itemType: "User"` (show only instruments)
- Read `itemRank` as `order`

### 2. Real-Time Quotes Not Updating

**Problem:** `/api/v1/quotes/live` returns 404 (route not found).

**Fix:** Changed `quotesPollingService.ts` to use `/api/v1/market-data/search?instrumentIds=` which returns:
- `currentRate` (live price)
- `dailyPriceChange` (percentage change)
- `internalInstrumentId` (instrument ID)

### 3. Symbol Resolution Too Slow

**Problem:** Symbol resolution required API call for every lookup.

**Fix:** Created `src/data/symbolUniverse.json`:
- 10,808 instruments pre-cached
- Loaded on app initialization
- Instant lookups without API calls
- Fallback to API for missing instruments

---

## Test Results (RALPH)

```
✅ PASSED:   18
❌ FAILED:   0
⚠️  WARNINGS: 1 (WebSocket CLI only)

Panel Readiness: 15/16 (FEED is feature-flagged)
```

### Sample Verified Data

**Watchlist Resolution:**
```
1137 => NVDA - NVIDIA Corporation
1111 => TSLA - Tesla Motors, Inc.
100000 => BTC - Bitcoin
1005 => AMZN - Amazon.com Inc
1004 => MSFT - Microsoft
```

**Live Quotes:**
```
NVDA @ $178.49 (+0.24%)
TSLA @ $418.66 (-0.14%)
BTC @ $89,477.99 (+0.03%)
```

---

## Server Access

- **Local:** http://localhost:3005
- **LAN:** http://172.28.203.10:3005

---

## Environment Notes

- Node.js PATH: `C:\Users\Yoni\Development\SpecKitReact\nodejs` (added to user PATH)
- Node version: v22.13.1
- npm version: 10.9.2

---

## Related Documentation

- `docs/SPECKIT_ADDENDUM_v1.1.0.md` - Updated with v1.1.3 changelog
- `eToroTerminalSpecKit.MD` - Master document updated to v1.1.3
