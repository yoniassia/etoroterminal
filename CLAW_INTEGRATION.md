# Claw Agent Integration Guide

> eToro Terminal v1.8.0 - Designed for AI Agent Automation

## Overview

eToro Terminal provides a structured API layer optimized for Claw agents. All responses follow a consistent format with versioning, error handling, and recovery suggestions.

## Quick Start

```bash
# Check service status
curl http://localhost:5173/api/claw/status

# Get a stock quote
curl http://localhost:5173/api/claw/quote/AAPL

# Execute a terminal command
curl -X POST http://localhost:5173/api/claw/command \
  -H "Content-Type: application/json" \
  -d '{"command": "Q AAPL"}'
```

## Response Format

All endpoints return a standardized `ClawResponse`:

```typescript
interface ClawResponse<T> {
  success: boolean;        // Request succeeded
  version: string;         // API version
  timestamp: string;       // ISO 8601 timestamp
  data: T;                 // Response payload
  meta?: {
    requestId: string;     // Unique request ID
    duration: number;      // Processing time (ms)
    cached: boolean;       // Response from cache
    source: string;        // Data source
  };
  error?: {
    code: string;          // Error code
    message: string;       // Human-readable message
    details?: object;      // Additional context
    recoverable: boolean;  // Can retry
    suggestion?: string;   // Recovery hint
  };
}
```

## Available Endpoints

### Status & Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claw/status` | GET | Service status, version, capabilities |

### Market Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claw/quote/:symbol` | GET | Real-time quote |
| `/api/claw/news` | GET | Market news feed |
| `/api/claw/alerts` | GET | Active price alerts |

### Financial Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claw/fundamentals/:symbol` | GET | Financial statements |
| `/api/claw/insider/:symbol` | GET | Insider trading activity |
| `/api/claw/institutional/:symbol` | GET | 13F institutional holdings |
| `/api/claw/filings/:symbol` | GET | SEC filings (10-K, 10-Q, 8-K) |

### Portfolio & Trading

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claw/portfolio` | GET | Current positions |
| `/api/claw/watchlist` | GET | Watchlist symbols |

### Strategy Builder

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claw/strategy/list` | GET | List strategies |
| `/api/claw/strategy/create` | POST | Create strategy |

### Terminal Commands

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claw/command` | POST | Execute any terminal command |

## Terminal Commands Reference

Commands can be executed via `/api/claw/command`:

| Command | Action |
|---------|--------|
| `Q <symbol>` | Quote panel |
| `NEWS` | News headlines |
| `INS <symbol>` | Insider activity |
| `INST <symbol>` | Institutional holdings |
| `FD <symbol>` | Fundamentals |
| `FILINGS <symbol>` | SEC filings |
| `SB` | Strategy builder |
| `FB` | Feedback panel |
| `ALERTS` | Alert manager |
| `PORT` | Portfolio view |

## Error Codes

| Code | Description | Recoverable |
|------|-------------|-------------|
| `AUTH_REQUIRED` | API keys not configured | Yes - configure keys |
| `SYMBOL_NOT_FOUND` | Invalid symbol | Yes - check symbol |
| `RATE_LIMITED` | Too many requests | Yes - wait and retry |
| `API_ERROR` | Upstream API failure | Yes - retry |
| `INVALID_COMMAND` | Unknown command | Yes - check syntax |

## For Claw Agent Developers

### Best Practices

1. **Always check `success` field** before accessing `data`
2. **Use `meta.requestId`** for debugging/logging
3. **Handle `recoverable` errors** with retry logic
4. **Cache responses** when `meta.cached: true`

### Example Agent Integration

```python
import requests

class EtoroTerminalClient:
    def __init__(self, base_url="http://localhost:5173"):
        self.base_url = base_url
    
    def get_quote(self, symbol: str) -> dict:
        resp = requests.get(f"{self.base_url}/api/claw/quote/{symbol}")
        data = resp.json()
        if not data["success"]:
            raise Exception(data["error"]["message"])
        return data["data"]
    
    def execute_command(self, command: str) -> dict:
        resp = requests.post(
            f"{self.base_url}/api/claw/command",
            json={"command": command}
        )
        return resp.json()
```

## Version History

- **v1.8.0** - Claw Agent API layer, structured responses
- **v1.7.3** - Financial Datasets panels (INS, INST, FD, FILINGS)
- **v1.3.0** - Strategy Builder with AI chat

---

*Built for [OpenClaw](https://openclaw.ai) agents*
