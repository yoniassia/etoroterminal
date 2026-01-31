# Strategy Builder Implementation Plan

## Overview

Adding an AI-powered Strategy Builder to the eToro Terminal - a Bloomberg-style quant trading copilot that can analyze markets, create strategies, and propose trades with human approval.

---

## Available API Keys

| Provider | Status | Use Case |
|----------|--------|----------|
| **OpenAI** | ✅ Available | Primary LLM for strategy generation, structured outputs |
| **Anthropic** | ✅ Available | Alternative LLM, good for analysis |
| **xAI/Grok** | ❌ Not configured | Future: real-time market sentiment |
| **Browser Use** | ✅ Available | Web research, news scraping |

---

## Phase 1: Foundation (Week 1-2)
**Goal:** Basic Strategy Builder panel with OpenAI integration

### Tasks

#### 1.1 Create StrategyBuilderPanel
```
src/components/panels/StrategyBuilderPanel.tsx
src/components/panels/StrategyBuilderPanel.css
```

**UI Components:**
- Strategy chat interface (conversation with AI)
- Strategy definition display (JSON view)
- Proposed actions list
- Approval buttons (Approve/Reject/Modify)

#### 1.2 Define TypeScript Contracts
```typescript
// src/types/strategy.types.ts

interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'mean-reversion' | 'breakout' | 'pairs' | 'custom';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  instruments: string[];  // symbols
  entryConditions: Condition[];
  exitConditions: Condition[];
  riskParams: RiskParameters;
  createdAt: string;
  updatedAt: string;
}

interface Condition {
  indicator: string;  // 'SMA', 'RSI', 'MACD', 'price', etc.
  operator: '>' | '<' | '>=' | '<=' | '==' | 'crosses_above' | 'crosses_below';
  value: number | string;  // number or another indicator
  params?: Record<string, number>;  // e.g., { period: 20 }
}

interface RiskParameters {
  maxPositionSize: number;      // % of portfolio
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDrawdownPercent: number;
  maxDailyLoss: number;
  maxConcurrentPositions: number;
}

interface ProposedAction {
  id: string;
  strategyId: string;
  type: 'open' | 'close' | 'modify';
  side: 'buy' | 'sell';
  symbol: string;
  amount: number;
  leverage: number;
  reasoning: string;
  confidence: number;  // 0-100
  riskScore: number;   // 0-100
  preTradeChecks: PreTradeCheck[];
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface PreTradeCheck {
  name: string;
  passed: boolean;
  message: string;
}
```

#### 1.3 OpenAI Service
```
src/services/aiService.ts
```

**Features:**
- OpenAI Responses API integration
- Structured outputs with JSON Schema
- Streaming support
- Token/cost tracking
- store=false by default

#### 1.4 Register Panel
- Add to PanelRegistry
- Add command: `SB` or `STRAT` to open Strategy Builder
- Add keyboard shortcut

---

## Phase 2: Strategy Templates (Week 3)
**Goal:** Pre-built strategy templates that users can customize

### Built-in Strategies (from quant knowledge)

#### 2.1 Momentum Strategies
```typescript
const MOMENTUM_TEMPLATES = {
  'sma-crossover': {
    name: 'SMA Crossover',
    description: 'Classic trend-following using fast/slow moving averages',
    entryConditions: [
      { indicator: 'SMA', params: { period: 10 }, operator: 'crosses_above', value: 'SMA_50' }
    ],
    exitConditions: [
      { indicator: 'SMA', params: { period: 10 }, operator: 'crosses_below', value: 'SMA_50' }
    ],
    riskParams: { stopLossPercent: 2, takeProfitPercent: 6 }
  },
  'rsi-momentum': {
    name: 'RSI Momentum',
    description: 'Enter on RSI oversold, exit on overbought',
    entryConditions: [
      { indicator: 'RSI', params: { period: 14 }, operator: '<', value: 30 }
    ],
    exitConditions: [
      { indicator: 'RSI', params: { period: 14 }, operator: '>', value: 70 }
    ]
  },
  'macd-divergence': {
    name: 'MACD Divergence',
    description: 'Trade MACD histogram divergences',
    // ...
  }
};
```

#### 2.2 Mean Reversion Strategies
```typescript
const MEAN_REVERSION_TEMPLATES = {
  'bollinger-bounce': {
    name: 'Bollinger Band Bounce',
    description: 'Buy at lower band, sell at upper band',
    entryConditions: [
      { indicator: 'price', operator: '<=', value: 'BB_LOWER' }
    ],
    exitConditions: [
      { indicator: 'price', operator: '>=', value: 'BB_UPPER' }
    ]
  },
  'zscore-reversion': {
    name: 'Z-Score Reversion',
    description: 'Trade when price deviates 2+ std from mean',
    // ...
  }
};
```

#### 2.3 Breakout Strategies
```typescript
const BREAKOUT_TEMPLATES = {
  'donchian-breakout': {
    name: 'Donchian Channel Breakout',
    description: 'Enter on 20-day high/low breakout (Turtle Trading)',
    // ...
  },
  'volume-breakout': {
    name: 'Volume Breakout',
    description: 'Enter when price breaks resistance with high volume',
    // ...
  }
};
```

---

## Phase 3: AI Strategy Generation (Week 4-5)
**Goal:** Natural language strategy creation with AI

### 3.1 Conversation Flow
```
User: "Create a strategy for AAPL that buys on dips and sells on rallies"

AI: {
  "thinking": "Analyzing request for mean-reversion strategy on AAPL...",
  "strategy": {
    "name": "AAPL Dip Buyer",
    "type": "mean-reversion",
    "instruments": ["AAPL"],
    "entryConditions": [...],
    "exitConditions": [...],
    "riskParams": {...}
  },
  "explanation": "I've created a mean-reversion strategy that..."
}
```

### 3.2 AI System Prompt
```typescript
const STRATEGY_SYSTEM_PROMPT = `
You are a quantitative trading strategist integrated into an eToro trading terminal.

Your role:
1. Help users create, analyze, and optimize trading strategies
2. Generate structured strategy definitions from natural language
3. Propose trades with reasoning and confidence scores
4. Enforce risk management rules

Available indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Volume, VWAP
Available instruments: Stocks, ETFs, Crypto, Forex (via eToro)

Risk Rules (ALWAYS enforce):
- Max position size: 10% of portfolio
- Always require stop loss
- Max leverage: 5x for stocks, 2x for crypto
- Max drawdown alert at 5%

Output Format: Always use structured JSON for strategies and proposed actions.
`;
```

### 3.3 Structured Output Schema
```typescript
const STRATEGY_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    type: { type: "string", enum: ["momentum", "mean-reversion", "breakout", "pairs", "custom"] },
    // ... full schema
  },
  required: ["name", "type", "instruments", "entryConditions", "exitConditions", "riskParams"]
};
```

---

## Phase 4: Backtesting Integration (Week 6)
**Goal:** Test strategies on historical data before deploying

### 4.1 Backtest Service
```
src/services/backtestService.ts
```

**Features:**
- Fetch historical data (via yfinance or eToro API)
- Simulate strategy execution
- Calculate metrics: Sharpe, Sortino, Max Drawdown, Win Rate
- Generate equity curve

### 4.2 Backtest Panel
```
src/components/panels/BacktestPanel.tsx
```

**UI:**
- Date range selector
- Equity curve chart
- Performance metrics table
- Trade log

---

## Phase 5: Live Execution (Week 7-8)
**Goal:** Execute approved strategies on eToro

### 5.1 Strategy Runner Service
```
src/services/strategyRunner.ts
```

**Features:**
- Monitor conditions in real-time
- Generate ProposedAction when conditions met
- Queue for user approval
- Execute via existing tradingAdapter

### 5.2 Approval Workflow
```
1. Strategy detects entry condition
2. Generate ProposedAction with reasoning
3. Display in UI with APPROVE/REJECT buttons
4. If approved → Execute trade via tradingAdapter
5. Log to Blotter
```

### 5.3 Safety Guards
- **Pre-trade checks:**
  - Sufficient balance
  - Within position limits
  - Market is open
  - Not in cooldown period
- **Rate limiting:** Max 1 trade per symbol per 5 min
- **Kill switch:** Manual stop-all button

---

## Phase 6: MCP Gateway (Week 9-10)
**Goal:** Expose terminal tools to AI via MCP protocol

### 6.1 eToro MCP Server
```
src/mcp/etoroMcpServer.ts
```

**Read Tools (no approval needed):**
- `get_quote(symbol)` - Get current price
- `get_portfolio()` - Get positions
- `get_watchlist(name)` - Get watchlist
- `get_historical(symbol, period)` - Get OHLCV data
- `search_instruments(query)` - Search symbols

**Trade Tools (require approval):**
- `open_position(symbol, side, amount, leverage, sl, tp)`
- `close_position(positionId)`
- `modify_position(positionId, sl, tp)`

### 6.2 Tool Allow-listing
```typescript
const MCP_TOOL_ALLOWLIST = {
  read: ['get_quote', 'get_portfolio', 'get_watchlist', 'get_historical', 'search_instruments'],
  trade: ['open_position', 'close_position', 'modify_position']
};
```

---

## Phase 7: Multi-Provider Support (Week 11-12)
**Goal:** Support OpenAI, Anthropic, and xAI

### 7.1 Provider Adapter Interface
```typescript
interface ProviderAdapter {
  name: string;
  capabilities: {
    supports_mcp: boolean;
    supports_structured_outputs: boolean;
    supports_streaming: boolean;
    supports_tools: boolean;
  };
  
  createResponse(request: ProviderRequest): Promise<ProviderResponse>;
  streamResponse(request: ProviderRequest, onChunk: ChunkHandler): Promise<ProviderResponse>;
}
```

### 7.2 Provider Implementations
- `OpenAIAdapter` - Primary, full features
- `AnthropicAdapter` - Claude for analysis
- `XAIAdapter` - Grok for sentiment (future)

---

## Immediate Next Steps

### This Week
1. **Create StrategyBuilderPanel** skeleton UI
2. **Define TypeScript types** for strategies
3. **Add OpenAI service** with streaming
4. **Register panel** in workspace

### To Start Now
```bash
# Files to create:
touch src/components/panels/StrategyBuilderPanel.tsx
touch src/components/panels/StrategyBuilderPanel.css
touch src/types/strategy.types.ts
touch src/services/aiService.ts
touch src/stores/strategyStore.ts
```

---

## Cost Estimates

| Feature | Provider | Est. Cost/Day |
|---------|----------|---------------|
| Strategy generation | OpenAI GPT-4 | ~$0.50 |
| Backtesting analysis | OpenAI GPT-4 | ~$0.20 |
| Real-time monitoring | Local compute | $0 |
| Browser research | Browser Use | ~$0.10 |

**Total:** ~$0.80/day for active usage

---

## Questions for You

1. **Priority:** Start with strategy templates or AI generation first?
2. **Backtesting:** Use eToro historical data or external source (yfinance)?
3. **xAI:** Want me to add Grok for real-time Twitter/X sentiment?
4. **Risk limits:** What max position size / leverage do you want hardcoded?

---

*Created: 2026-01-31*
*Version: 0.1.0-draft*
