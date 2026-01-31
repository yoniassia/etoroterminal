/**
 * Strategy Builder Type Definitions
 * Version: 1.2.0
 */

// =============================================================================
// Core Strategy Types
// =============================================================================

export type StrategyType = 'momentum' | 'mean-reversion' | 'breakout' | 'pairs' | 'custom';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type StrategyStatus = 'draft' | 'active' | 'paused' | 'stopped';
export type OrderSide = 'buy' | 'sell';
export type ActionType = 'open' | 'close' | 'modify';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';

// =============================================================================
// Condition Types
// =============================================================================

export type IndicatorType = 
  | 'SMA' 
  | 'EMA' 
  | 'RSI' 
  | 'MACD' 
  | 'MACD_SIGNAL'
  | 'MACD_HISTOGRAM'
  | 'BB_UPPER' 
  | 'BB_MIDDLE' 
  | 'BB_LOWER'
  | 'ATR'
  | 'VOLUME'
  | 'VWAP'
  | 'price'
  | 'high'
  | 'low'
  | 'open'
  | 'close';

export type ConditionOperator = 
  | '>' 
  | '<' 
  | '>=' 
  | '<=' 
  | '==' 
  | 'crosses_above' 
  | 'crosses_below';

export interface IndicatorParams {
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  stdDev?: number;
  [key: string]: number | undefined;
}

export interface Condition {
  id: string;
  indicator: IndicatorType;
  operator: ConditionOperator;
  value: number | IndicatorType;
  params?: IndicatorParams;
  valueParams?: IndicatorParams;  // params for the comparison indicator
}

// =============================================================================
// Risk Management Types
// =============================================================================

export interface RiskParameters {
  maxPositionSize: number;        // % of portfolio (e.g., 10 = 10%)
  stopLossPercent: number;        // Required stop loss %
  takeProfitPercent?: number;     // Optional take profit %
  maxDrawdownPercent: number;     // Alert threshold
  maxDailyLoss: number;           // $ amount
  maxConcurrentPositions: number; // Max open positions
  maxLeverage: number;            // Max allowed leverage
  cooldownSeconds: number;        // Seconds between trades on same symbol
}

export const DEFAULT_RISK_PARAMS: RiskParameters = {
  maxPositionSize: 10,
  stopLossPercent: 2,
  takeProfitPercent: 6,
  maxDrawdownPercent: 5,
  maxDailyLoss: 500,
  maxConcurrentPositions: 5,
  maxLeverage: 5,
  cooldownSeconds: 300,
};

// =============================================================================
// Strategy Definition
// =============================================================================

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  timeframe: Timeframe;
  instruments: string[];          // symbols to monitor
  entryConditions: Condition[];   // AND logic (all must be true)
  exitConditions: Condition[];    // OR logic (any triggers exit)
  riskParams: RiskParameters;
  status: StrategyStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  stats?: StrategyStats;
}

export interface StrategyStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
}

// =============================================================================
// Proposed Action Types
// =============================================================================

export interface PreTradeCheck {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;  // If critical and failed, block trade
}

export interface ProposedAction {
  id: string;
  strategyId: string;
  strategyName: string;
  type: ActionType;
  side: OrderSide;
  symbol: string;
  displayName?: string;
  instrumentId?: number;
  amount: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  reasoning: string;
  confidence: number;     // 0-100
  riskScore: number;      // 0-100 (higher = riskier)
  preTradeChecks: PreTradeCheck[];
  status: ActionStatus;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  orderId?: string;
  error?: string;
}

// =============================================================================
// AI Service Types
// =============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'xai';
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  store: boolean;  // Whether provider can store conversation
}

export interface AIRequest {
  messages: AIMessage[];
  config: AIProviderConfig;
  structuredOutput?: {
    name: string;
    schema: Record<string, unknown>;
  };
}

export interface AIResponse {
  content: string;
  structuredOutput?: StrategyDefinition | ProposedAction | unknown;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  model: string;
  finishReason: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

// =============================================================================
// Backtest Types
// =============================================================================

export interface BacktestConfig {
  strategyId: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
  metrics: {
    totalReturn: number;
    totalReturnPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
  };
  equityCurve: { date: string; equity: number }[];
  runTime: number;
}

// =============================================================================
// Template Types
// =============================================================================

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  icon: string;
  defaultTimeframe: Timeframe;
  defaultInstruments: string[];
  entryConditions: Omit<Condition, 'id'>[];
  exitConditions: Omit<Condition, 'id'>[];
  riskParams: Partial<RiskParameters>;
  tags: string[];
}

// =============================================================================
// Store Types
// =============================================================================

export interface StrategyState {
  strategies: StrategyDefinition[];
  activeStrategyId: string | null;
  proposedActions: ProposedAction[];
  conversationHistory: AIMessage[];
  isGenerating: boolean;
  error: string | null;
}

export type StrategyView = 'templates' | 'chat' | 'my-strategies' | 'backtest';
