# SPECKIT ADDENDUM v1.2.0 - Strategy Builder

**Date:** 2026-01-31  
**Version:** 1.2.0  
**Feature:** AI-Powered Strategy Builder (SB)

---

## Overview

The Strategy Builder adds AI-powered quantitative trading capabilities to the eToro Terminal, enabling users to:
- Create trading strategies via natural language or templates
- Backtest strategies on historical data
- Execute strategies with human-in-the-loop approval
- Monitor strategy performance in real-time

---

## User Stories

### US-SB-001: Strategy Creation from Templates
**As a** trader  
**I want to** select from pre-built strategy templates  
**So that** I can quickly deploy proven trading strategies

**Acceptance Criteria:**
- [ ] User can browse strategy templates (Momentum, Mean Reversion, Breakout)
- [ ] User can customize template parameters (periods, thresholds, risk limits)
- [ ] Strategy is validated before saving
- [ ] Strategy is persisted to localStorage

### US-SB-002: AI Strategy Generation
**As a** trader  
**I want to** describe a strategy in natural language  
**So that** the AI can generate a structured strategy definition

**Acceptance Criteria:**
- [ ] User can type strategy description in chat interface
- [ ] AI generates StrategyDefinition with structured output
- [ ] User can iterate and refine the strategy via conversation
- [ ] Generated strategy can be saved and executed

### US-SB-003: Strategy Backtesting
**As a** trader  
**I want to** test my strategy on historical data  
**So that** I can validate performance before risking capital

**Acceptance Criteria:**
- [ ] User can select date range for backtest
- [ ] System fetches historical OHLCV data
- [ ] Backtest simulates trades and calculates metrics
- [ ] Results show: Sharpe, Max Drawdown, Win Rate, Equity Curve

### US-SB-004: Live Strategy Execution
**As a** trader  
**I want to** run my strategy on live market data  
**So that** I can automatically detect trade opportunities

**Acceptance Criteria:**
- [ ] Strategy monitors live quotes for entry/exit conditions
- [ ] When condition met, ProposedAction is generated
- [ ] User sees approval dialog with reasoning and risk score
- [ ] Approved trades execute via existing tradingAdapter
- [ ] All actions logged to Blotter

### US-SB-005: Risk Management
**As a** trader  
**I want to** enforce risk limits on all strategies  
**So that** I never exceed my risk tolerance

**Acceptance Criteria:**
- [ ] Max position size enforced (default: 10% of portfolio)
- [ ] Stop loss required on all trades
- [ ] Max leverage limits enforced (stocks: 5x, crypto: 2x)
- [ ] Daily loss limit triggers strategy pause
- [ ] Manual kill switch available

---

## Functional Requirements

### FR-SB-001: Strategy Definition Schema
```typescript
interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'mean-reversion' | 'breakout' | 'pairs' | 'custom';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  instruments: string[];
  entryConditions: Condition[];
  exitConditions: Condition[];
  riskParams: RiskParameters;
  status: 'draft' | 'active' | 'paused' | 'stopped';
  createdAt: string;
  updatedAt: string;
}
```

### FR-SB-002: Proposed Action Schema
```typescript
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
  riskScore: number;   // 0-100 (higher = riskier)
  preTradeChecks: PreTradeCheck[];
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  createdAt: string;
  executedAt?: string;
}
```

### FR-SB-003: AI Provider Integration
- Primary: OpenAI GPT-4 via Responses API
- Structured outputs required for all strategy/action generation
- store=false by default (privacy)
- Streaming enabled for real-time feedback
- Token budget: 4000 tokens per request default

### FR-SB-004: Pre-Trade Checks
All proposed actions must pass:
1. **Balance Check** - Sufficient available balance
2. **Position Limit** - Within max position size
3. **Leverage Limit** - Within allowed leverage
4. **Market Hours** - Market is open (or pending order allowed)
5. **Cooldown** - Not in trade cooldown period
6. **Daily Loss** - Not exceeded daily loss limit

### FR-SB-005: Cost Controls
- Max tokens per run: configurable (default: 10,000)
- Max tool calls per turn: 10
- Request timeout: 30 seconds
- Run timeout: 5 minutes
- Cost estimate shown before execution

---

## Technical Architecture

### Components

```
src/
├── components/panels/
│   ├── StrategyBuilderPanel.tsx    # Main SB panel
│   ├── StrategyBuilderPanel.css
│   ├── BacktestPanel.tsx           # Backtest results
│   └── BacktestPanel.css
├── types/
│   └── strategy.types.ts           # TypeScript interfaces
├── services/
│   ├── aiService.ts                # OpenAI integration
│   ├── strategyRunner.ts           # Live execution engine
│   └── backtestService.ts          # Historical testing
├── stores/
│   └── strategyStore.ts            # Strategy state management
└── config/
    └── strategyTemplates.ts        # Pre-built templates
```

### Data Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  AI Service     │ ◄── OpenAI API (structured output)
│  (aiService.ts) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Strategy Store  │ ◄── localStorage persistence
│(strategyStore)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌─────────────┐
│Backtest│  │Strategy     │
│Service │  │Runner       │
└───────┘  └──────┬──────┘
                  │
                  ▼
           ┌──────────────┐
           │Proposed      │
           │Action        │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │User Approval │
           │Dialog        │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │Trading       │
           │Adapter       │
           └──────────────┘
```

---

## Panel Wireframe

```
+--------------------------------- SB: Strategy Builder ---------------------------------+
| Mode: [Templates] [AI Chat] [My Strategies]                          [Settings ⚙]     |
|----------------------------------------------------------------------------------------|
| TEMPLATES                              │ STRATEGY DETAILS                              |
| ┌────────────────────────────────────┐ │ ┌────────────────────────────────────────┐   |
| │ 📈 SMA Crossover                   │ │ │ Name: SMA Crossover                    │   |
| │    Trend-following with MA cross   │ │ │ Type: Momentum                         │   |
| │ ────────────────────────────────── │ │ │                                        │   |
| │ 📊 RSI Momentum                    │ │ │ Entry: SMA(10) crosses above SMA(50)   │   |
| │    Oversold/Overbought signals     │ │ │ Exit:  SMA(10) crosses below SMA(50)   │   |
| │ ────────────────────────────────── │ │ │                                        │   |
| │ 📉 Bollinger Bounce                │ │ │ Risk:                                  │   |
| │    Mean reversion at bands         │ │ │   Stop Loss: 2%                        │   |
| │ ────────────────────────────────── │ │ │   Take Profit: 6%                      │   |
| │ 🔺 MACD Divergence                 │ │ │   Max Position: 10%                    │   |
| │    Momentum with histogram         │ │ │                                        │   |
| │ ────────────────────────────────── │ │ │ [Customize] [Backtest] [Activate]      │   |
| │ 🐢 Donchian Breakout               │ │ └────────────────────────────────────────┘   |
| │    Turtle Trading system           │ │                                              |
| └────────────────────────────────────┘ │                                              |
|----------------------------------------------------------------------------------------|
| PROPOSED ACTIONS                                                                       |
| ┌────────────────────────────────────────────────────────────────────────────────────┐|
| │ ⏳ AAPL BUY $500 (x2) - SMA crossover detected - Confidence: 85% - Risk: Low       │|
| │    [✓ APPROVE] [✗ REJECT] [📝 MODIFY]                                              │|
| └────────────────────────────────────────────────────────────────────────────────────┘|
+----------------------------------------------------------------------------------------+
```

---

## Command Bar Integration

| Command | Action |
|---------|--------|
| `SB` | Open Strategy Builder panel |
| `STRAT` | Open Strategy Builder panel |
| `SB LIST` | List all strategies |
| `SB NEW` | Create new strategy |
| `SB RUN <name>` | Activate strategy |
| `SB STOP` | Stop all strategies |
| `BT <symbol>` | Open Backtest panel |

---

## Tasks

### Phase 1: Foundation (T-SB-001 to T-SB-010)

| ID | Task | Priority | Est |
|----|------|----------|-----|
| T-SB-001 | Create strategy.types.ts with all interfaces | P0 | 1h |
| T-SB-002 | Create strategyStore.ts with Zustand | P0 | 2h |
| T-SB-003 | Create aiService.ts with OpenAI integration | P0 | 3h |
| T-SB-004 | Create StrategyBuilderPanel.tsx skeleton | P0 | 2h |
| T-SB-005 | Create StrategyBuilderPanel.css | P0 | 1h |
| T-SB-006 | Register SB panel in PanelRegistry | P0 | 0.5h |
| T-SB-007 | Add SB/STRAT commands to commandParser | P0 | 0.5h |
| T-SB-008 | Implement template selection UI | P1 | 2h |
| T-SB-009 | Implement strategy detail view | P1 | 2h |
| T-SB-010 | Add localStorage persistence | P1 | 1h |

### Phase 2: AI Chat (T-SB-011 to T-SB-020)

| ID | Task | Priority | Est |
|----|------|----------|-----|
| T-SB-011 | Implement chat interface UI | P0 | 3h |
| T-SB-012 | Implement streaming response display | P0 | 2h |
| T-SB-013 | Create strategy generation prompt | P0 | 2h |
| T-SB-014 | Implement structured output parsing | P0 | 2h |
| T-SB-015 | Add conversation history management | P1 | 1h |
| T-SB-016 | Implement strategy refinement flow | P1 | 2h |
| T-SB-017 | Add token/cost tracking UI | P1 | 1h |
| T-SB-018 | Implement error handling | P1 | 1h |
| T-SB-019 | Add rate limiting | P2 | 1h |
| T-SB-020 | Add provider settings drawer | P2 | 2h |

### Phase 3: Execution (T-SB-021 to T-SB-030)

| ID | Task | Priority | Est |
|----|------|----------|-----|
| T-SB-021 | Create strategyRunner.ts service | P0 | 4h |
| T-SB-022 | Implement condition evaluation | P0 | 3h |
| T-SB-023 | Create ProposedAction generation | P0 | 2h |
| T-SB-024 | Implement approval dialog | P0 | 2h |
| T-SB-025 | Connect to tradingAdapter | P0 | 1h |
| T-SB-026 | Implement pre-trade checks | P0 | 2h |
| T-SB-027 | Add kill switch | P0 | 1h |
| T-SB-028 | Add execution logging | P1 | 1h |
| T-SB-029 | Implement cooldown logic | P1 | 1h |
| T-SB-030 | Add notification on trade proposal | P2 | 1h |

---

## Security Considerations

1. **API Key Protection**
   - OpenAI key stored in .env.local (gitignored)
   - Never log or expose API keys in error messages
   - Key validation on startup

2. **Trade Safety**
   - All trades require explicit user approval
   - Real mode requires additional confirmation
   - Max position/leverage limits enforced server-side
   - Audit trail for all actions

3. **AI Safety**
   - store=false prevents OpenAI from retaining conversations
   - No PII sent to AI (anonymize user data)
   - Rate limiting prevents abuse

---

## Metrics & Success Criteria

| Metric | Target |
|--------|--------|
| Strategy creation time | < 2 minutes |
| AI response latency | < 5 seconds |
| Trade approval UX | < 3 clicks |
| Backtest execution | < 10 seconds |
| Zero unauthorized trades | 100% |

---

*End of Strategy Builder Specification*
