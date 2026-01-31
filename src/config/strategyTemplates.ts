/**
 * Pre-built Strategy Templates
 * Classic quantitative trading strategies
 */

import type { StrategyTemplate } from '../types/strategy.types';

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  // ==========================================================================
  // MOMENTUM STRATEGIES
  // ==========================================================================
  {
    id: 'sma-crossover',
    name: 'SMA Crossover',
    description: 'Classic trend-following strategy using fast/slow moving average crossovers. Buy when fast MA crosses above slow MA, sell when it crosses below.',
    type: 'momentum',
    icon: '📈',
    defaultTimeframe: '1d',
    defaultInstruments: ['AAPL', 'GOOGL', 'MSFT'],
    entryConditions: [
      {
        indicator: 'SMA',
        params: { period: 10 },
        operator: 'crosses_above',
        value: 'SMA',
        valueParams: { period: 50 }
      }
    ],
    exitConditions: [
      {
        indicator: 'SMA',
        params: { period: 10 },
        operator: 'crosses_below',
        value: 'SMA',
        valueParams: { period: 50 }
      }
    ],
    riskParams: {
      stopLossPercent: 2,
      takeProfitPercent: 6,
      maxPositionSize: 10,
      maxLeverage: 2
    },
    tags: ['trend-following', 'moving-average', 'beginner']
  },

  {
    id: 'rsi-momentum',
    name: 'RSI Momentum',
    description: 'Enter positions when RSI indicates oversold conditions, exit when overbought. Classic mean-reversion with momentum confirmation.',
    type: 'momentum',
    icon: '📊',
    defaultTimeframe: '4h',
    defaultInstruments: ['SPY', 'QQQ', 'AAPL'],
    entryConditions: [
      {
        indicator: 'RSI',
        params: { period: 14 },
        operator: '<',
        value: 30
      }
    ],
    exitConditions: [
      {
        indicator: 'RSI',
        params: { period: 14 },
        operator: '>',
        value: 70
      }
    ],
    riskParams: {
      stopLossPercent: 3,
      takeProfitPercent: 8,
      maxPositionSize: 8,
      maxLeverage: 2
    },
    tags: ['rsi', 'oversold', 'overbought', 'beginner']
  },

  {
    id: 'macd-divergence',
    name: 'MACD Crossover',
    description: 'Trade MACD line crossing signal line. Classic momentum indicator with histogram confirmation.',
    type: 'momentum',
    icon: '🔺',
    defaultTimeframe: '1h',
    defaultInstruments: ['TSLA', 'NVDA', 'AMD'],
    entryConditions: [
      {
        indicator: 'MACD',
        params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        operator: 'crosses_above',
        value: 'MACD_SIGNAL',
        valueParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
      }
    ],
    exitConditions: [
      {
        indicator: 'MACD',
        params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        operator: 'crosses_below',
        value: 'MACD_SIGNAL',
        valueParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
      }
    ],
    riskParams: {
      stopLossPercent: 2.5,
      takeProfitPercent: 7,
      maxPositionSize: 8,
      maxLeverage: 3
    },
    tags: ['macd', 'momentum', 'intermediate']
  },

  {
    id: 'ema-ribbon',
    name: 'EMA Ribbon',
    description: 'Multiple EMAs (8, 13, 21, 34, 55) forming a ribbon. Enter when price breaks above all EMAs with alignment.',
    type: 'momentum',
    icon: '🎀',
    defaultTimeframe: '1d',
    defaultInstruments: ['AAPL', 'MSFT', 'AMZN'],
    entryConditions: [
      {
        indicator: 'price',
        operator: '>',
        value: 'EMA',
        valueParams: { period: 8 }
      },
      {
        indicator: 'EMA',
        params: { period: 8 },
        operator: '>',
        value: 'EMA',
        valueParams: { period: 21 }
      }
    ],
    exitConditions: [
      {
        indicator: 'price',
        operator: '<',
        value: 'EMA',
        valueParams: { period: 21 }
      }
    ],
    riskParams: {
      stopLossPercent: 3,
      takeProfitPercent: 10,
      maxPositionSize: 10,
      maxLeverage: 2
    },
    tags: ['ema', 'trend', 'intermediate']
  },

  // ==========================================================================
  // MEAN REVERSION STRATEGIES
  // ==========================================================================
  {
    id: 'bollinger-bounce',
    name: 'Bollinger Band Bounce',
    description: 'Mean reversion strategy buying at lower Bollinger Band and selling at upper band. Works best in ranging markets.',
    type: 'mean-reversion',
    icon: '📉',
    defaultTimeframe: '4h',
    defaultInstruments: ['SPY', 'IWM', 'DIA'],
    entryConditions: [
      {
        indicator: 'price',
        operator: '<=',
        value: 'BB_LOWER',
        valueParams: { period: 20, stdDev: 2 }
      }
    ],
    exitConditions: [
      {
        indicator: 'price',
        operator: '>=',
        value: 'BB_UPPER',
        valueParams: { period: 20, stdDev: 2 }
      },
      {
        indicator: 'price',
        operator: '>=',
        value: 'BB_MIDDLE',
        valueParams: { period: 20, stdDev: 2 }
      }
    ],
    riskParams: {
      stopLossPercent: 2,
      takeProfitPercent: 4,
      maxPositionSize: 8,
      maxLeverage: 2
    },
    tags: ['bollinger', 'mean-reversion', 'beginner']
  },

  {
    id: 'rsi-mean-reversion',
    name: 'RSI Mean Reversion',
    description: 'Fade extreme RSI readings. Buy when RSI < 20, sell when RSI normalizes above 50.',
    type: 'mean-reversion',
    icon: '↩️',
    defaultTimeframe: '1h',
    defaultInstruments: ['AAPL', 'MSFT', 'GOOGL'],
    entryConditions: [
      {
        indicator: 'RSI',
        params: { period: 14 },
        operator: '<',
        value: 20
      }
    ],
    exitConditions: [
      {
        indicator: 'RSI',
        params: { period: 14 },
        operator: '>',
        value: 50
      }
    ],
    riskParams: {
      stopLossPercent: 2.5,
      takeProfitPercent: 5,
      maxPositionSize: 8,
      maxLeverage: 2
    },
    tags: ['rsi', 'mean-reversion', 'intermediate']
  },

  // ==========================================================================
  // BREAKOUT STRATEGIES
  // ==========================================================================
  {
    id: 'donchian-breakout',
    name: 'Donchian Channel Breakout',
    description: 'Turtle Trading system - buy on 20-day high breakout, sell on 10-day low. Classic trend-following breakout strategy.',
    type: 'breakout',
    icon: '🐢',
    defaultTimeframe: '1d',
    defaultInstruments: ['GLD', 'SLV', 'USO'],
    entryConditions: [
      {
        indicator: 'high',
        operator: '>=',
        value: 'high',
        params: { period: 20 }  // 20-day high
      }
    ],
    exitConditions: [
      {
        indicator: 'low',
        operator: '<=',
        value: 'low',
        params: { period: 10 }  // 10-day low
      }
    ],
    riskParams: {
      stopLossPercent: 2,
      takeProfitPercent: 8,
      maxPositionSize: 5,
      maxLeverage: 2
    },
    tags: ['breakout', 'turtle', 'trend-following', 'intermediate']
  },

  {
    id: 'volume-breakout',
    name: 'Volume Breakout',
    description: 'Enter when price breaks recent high with above-average volume. Volume confirms the breakout validity.',
    type: 'breakout',
    icon: '📢',
    defaultTimeframe: '1d',
    defaultInstruments: ['TSLA', 'NVDA', 'META'],
    entryConditions: [
      {
        indicator: 'high',
        operator: '>',
        value: 'high',
        params: { period: 20 }
      },
      {
        indicator: 'VOLUME',
        operator: '>',
        value: 'SMA',
        valueParams: { period: 20 }  // Volume > 20-day avg volume
      }
    ],
    exitConditions: [
      {
        indicator: 'price',
        operator: '<',
        value: 'SMA',
        valueParams: { period: 20 }
      }
    ],
    riskParams: {
      stopLossPercent: 3,
      takeProfitPercent: 10,
      maxPositionSize: 8,
      maxLeverage: 2
    },
    tags: ['breakout', 'volume', 'intermediate']
  },

  {
    id: 'atr-breakout',
    name: 'ATR Channel Breakout',
    description: 'Volatility-adjusted breakout using ATR bands. Adapts to market volatility conditions.',
    type: 'breakout',
    icon: '📏',
    defaultTimeframe: '4h',
    defaultInstruments: ['SPY', 'QQQ', 'IWM'],
    entryConditions: [
      {
        indicator: 'price',
        operator: '>',
        value: 'ATR',
        params: { period: 14 }  // Price > 2 * ATR above SMA
      }
    ],
    exitConditions: [
      {
        indicator: 'price',
        operator: '<',
        value: 'SMA',
        valueParams: { period: 20 }
      }
    ],
    riskParams: {
      stopLossPercent: 2,
      takeProfitPercent: 6,
      maxPositionSize: 8,
      maxLeverage: 2
    },
    tags: ['atr', 'volatility', 'breakout', 'advanced']
  }
];

// Helper function to get template by ID
export function getTemplateById(id: string): StrategyTemplate | undefined {
  return STRATEGY_TEMPLATES.find(t => t.id === id);
}

// Helper function to get templates by type
export function getTemplatesByType(type: StrategyTemplate['type']): StrategyTemplate[] {
  return STRATEGY_TEMPLATES.filter(t => t.type === type);
}

// Helper function to get templates by tag
export function getTemplatesByTag(tag: string): StrategyTemplate[] {
  return STRATEGY_TEMPLATES.filter(t => t.tags.includes(tag));
}
