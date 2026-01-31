# eToro Public API Contract

**Base URL:** `https://public-api.etoro.com`  
**WebSocket URL:** `wss://public-api.etoro.com/ws`

## Required Headers

All requests must include these headers:

| Header | Description |
|--------|-------------|
| `x-request-id` | UUID v4 for request tracing |
| `x-api-key` | Your eToro Public API key |
| `x-user-key` | User-specific authentication key |
| `Content-Type` | `application/json` (for POST/PUT/DELETE) |

---

## REST Endpoints

### User Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/user-info/people` | Get user profile information |
| GET | `/api/v1/user-info/settings` | Get user settings |

### Portfolio (Real Account)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/trading/info/pnl` | Get portfolio PnL and positions |
| GET | `/api/v1/trading/info/positions` | Get open positions |
| GET | `/api/v1/trading/info/history` | Get trading history |

### Portfolio (Demo Account)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/trading/info/demo/pnl` | Get demo portfolio PnL |
| GET | `/api/v1/trading/info/demo/positions` | Get demo positions |
| GET | `/api/v1/trading/info/demo/history` | Get demo trading history |

### Quotes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/quotes/live` | Get live quotes for instruments |
| GET | `/api/v1/quotes/history` | Get historical price data |
| GET | `/api/v1/quotes/{instrumentId}` | Get quote for specific instrument |

### Instruments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/instruments` | List all tradeable instruments |
| GET | `/api/v1/instruments/search` | Search instruments by name/symbol |
| GET | `/api/v1/instruments/{instrumentId}` | Get instrument details |

### Watchlists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/watchlists` | Get all watchlists |
| GET | `/api/v1/watchlists/{watchlistId}` | Get specific watchlist |
| POST | `/api/v1/watchlists` | Create watchlist |
| PUT | `/api/v1/watchlists/{watchlistId}` | Update watchlist |
| DELETE | `/api/v1/watchlists/{watchlistId}` | Delete watchlist |
| GET | `/api/v1/watchlists/{watchlistId}/items` | Get watchlist items |
| POST | `/api/v1/watchlists/{watchlistId}/items` | Add item to watchlist |
| DELETE | `/api/v1/watchlists/{watchlistId}/items/{instrumentId}` | Remove item |

### Trading (Real Account)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trading/open` | Open a new position |
| POST | `/api/v1/trading/close` | Close a position |
| PUT | `/api/v1/trading/modify` | Modify SL/TP |
| GET | `/api/v1/trading/orders` | Get pending orders |

### Trading (Demo Account)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trading/demo/open` | Open demo position |
| POST | `/api/v1/trading/demo/close` | Close demo position |
| PUT | `/api/v1/trading/demo/modify` | Modify demo SL/TP |
| GET | `/api/v1/trading/demo/orders` | Get demo pending orders |

---

## WebSocket Topics

Connect to: `wss://public-api.etoro.com/ws`

### Available Topics

| Topic | Description |
|-------|-------------|
| `quotes` | All quote updates |
| `quotes.{instrumentId}` | Specific instrument quotes |
| `positions` | All position updates |
| `positions.{positionId}` | Specific position updates |
| `orders` | All order status updates |
| `orders.{orderId}` | Specific order updates |
| `portfolio` | Portfolio value updates |

### Message Format

```json
{
  "topic": "quotes.1234",
  "type": "subscribe | unsubscribe | data | error",
  "payload": { ... },
  "timestamp": "2026-01-19T12:00:00Z"
}
```

### Quote Update Payload

```json
{
  "instrumentId": 1234,
  "bid": 150.25,
  "ask": 150.30,
  "lastPrice": 150.27,
  "change": 2.50,
  "changePercent": 1.69
}
```

### Position Update Payload

```json
{
  "positionId": 5678,
  "currentRate": 150.27,
  "profit": 125.50,
  "profitPercentage": 2.5
}
```

---

## TypeScript Types

See `src/api/contracts/etoro-api.types.ts` for complete TypeScript interfaces:

- `UserInfo` - User profile data
- `Portfolio` - Portfolio summary with positions
- `Position` - Individual trading position
- `Quote` - Real-time price quote
- `QuoteHistory` - Historical price data
- `Watchlist` - User watchlist
- `TradeRequest` / `TradeResponse` - Trading operations
- `Instrument` - Tradeable instrument details

---

## Error Handling

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |
| 500 | Server Error |

Error response format:
```json
{
  "code": "INVALID_INSTRUMENT",
  "message": "Instrument not found",
  "details": { "instrumentId": 9999 }
}
```
