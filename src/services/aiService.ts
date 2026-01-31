/**
 * AI Service - OpenAI Integration for Strategy Builder
 * Uses Responses API with structured outputs
 */

import type {
  AIMessage,
  AIProviderConfig,
  AIResponse,
  AIStreamChunk,
  StrategyDefinition,
} from '../types/strategy.types';

// =============================================================================
// Configuration
// =============================================================================

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Default config - API key from environment
const getDefaultConfig = (): AIProviderConfig => ({
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  maxTokens: 4000,
  temperature: 0.7,
  store: false, // Privacy: don't store conversations
});

// =============================================================================
// System Prompts
// =============================================================================

const STRATEGY_SYSTEM_PROMPT = `You are a quantitative trading strategist integrated into an eToro trading terminal.

Your role:
1. Help users create, analyze, and optimize trading strategies
2. Generate structured strategy definitions from natural language
3. Propose trades with reasoning and confidence scores
4. Enforce risk management rules

Available indicators: SMA, EMA, RSI, MACD, Bollinger Bands (BB_UPPER, BB_MIDDLE, BB_LOWER), ATR, VOLUME, VWAP
Available timeframes: 1m, 5m, 15m, 1h, 4h, 1d
Available instruments: Stocks (AAPL, GOOGL, TSLA, etc.), ETFs (SPY, QQQ), Crypto (BTC, ETH)

Risk Rules (ALWAYS enforce):
- Max position size: 10% of portfolio
- Always require stop loss (2-5% typical)
- Max leverage: 5x for stocks, 2x for crypto
- Max drawdown alert at 5%
- Cooldown between trades on same symbol

When generating strategies:
1. Use clear entry and exit conditions
2. Set reasonable risk parameters
3. Explain your reasoning
4. Consider market conditions

Output structured JSON for strategies using this format:
{
  "name": "Strategy Name",
  "description": "What the strategy does",
  "type": "momentum" | "mean-reversion" | "breakout" | "pairs" | "custom",
  "timeframe": "1d",
  "instruments": ["AAPL", "GOOGL"],
  "entryConditions": [
    {
      "id": "unique_id",
      "indicator": "RSI",
      "operator": "<",
      "value": 30,
      "params": { "period": 14 }
    }
  ],
  "exitConditions": [...],
  "riskParams": {
    "maxPositionSize": 10,
    "stopLossPercent": 2,
    "takeProfitPercent": 6,
    "maxLeverage": 2
  }
}`;

// =============================================================================
// JSON Schema for Structured Output
// =============================================================================

// Schema for future structured output use
export const STRATEGY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Strategy name' },
    description: { type: 'string', description: 'Strategy description' },
    type: { 
      type: 'string', 
      enum: ['momentum', 'mean-reversion', 'breakout', 'pairs', 'custom'] 
    },
    timeframe: { 
      type: 'string', 
      enum: ['1m', '5m', '15m', '1h', '4h', '1d'] 
    },
    instruments: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'List of symbols to trade'
    },
    entryConditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          indicator: { type: 'string' },
          operator: { type: 'string' },
          value: {},
          params: { type: 'object' }
        },
        required: ['indicator', 'operator', 'value']
      }
    },
    exitConditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          indicator: { type: 'string' },
          operator: { type: 'string' },
          value: {},
          params: { type: 'object' }
        },
        required: ['indicator', 'operator', 'value']
      }
    },
    riskParams: {
      type: 'object',
      properties: {
        maxPositionSize: { type: 'number' },
        stopLossPercent: { type: 'number' },
        takeProfitPercent: { type: 'number' },
        maxLeverage: { type: 'number' },
        maxDrawdownPercent: { type: 'number' },
        maxDailyLoss: { type: 'number' },
        maxConcurrentPositions: { type: 'number' },
        cooldownSeconds: { type: 'number' }
      }
    }
  },
  required: ['name', 'type', 'instruments', 'entryConditions', 'exitConditions']
};

// =============================================================================
// AI Service Class
// =============================================================================

class AIService {
  private config: AIProviderConfig;
  private abortController: AbortController | null = null;

  constructor() {
    this.config = getDefaultConfig();
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  hasApiKey(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 10;
  }

  // ---------------------------------------------------------------------------
  // Chat Completion (Non-streaming)
  // ---------------------------------------------------------------------------

  async chat(
    messages: AIMessage[],
    options?: Partial<AIProviderConfig>
  ): Promise<AIResponse> {
    const config = { ...this.config, ...options };
    
    if (!this.hasApiKey()) {
      throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env.local');
    }

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: STRATEGY_SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        store: config.store,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      cost: this.calculateCost(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0, config.model),
      model: config.model,
      finishReason: choice?.finish_reason || 'unknown',
    };
  }

  // ---------------------------------------------------------------------------
  // Streaming Chat
  // ---------------------------------------------------------------------------

  async *streamChat(
    messages: AIMessage[],
    options?: Partial<AIProviderConfig>
  ): AsyncGenerator<AIStreamChunk> {
    const config = { ...this.config, ...options };
    
    if (!this.hasApiKey()) {
      throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env.local');
    }

    this.abortController = new AbortController();

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: STRATEGY_SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        store: config.store,
        stream: true,
      }),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            const finishReason = data.choices?.[0]?.finish_reason;

            if (content) {
              yield { content, done: false };
            }

            if (finishReason === 'stop') {
              yield { content: '', done: true };
            }
          } catch {
            // Ignore parse errors for SSE
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Strategy Generation
  // ---------------------------------------------------------------------------

  async generateStrategy(prompt: string): Promise<StrategyDefinition | null> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Generate a trading strategy based on this description: "${prompt}"
        
Return ONLY valid JSON matching the strategy schema. Include:
- Clear entry and exit conditions with specific indicators and values
- Appropriate risk parameters
- A descriptive name and explanation

Do not include any text outside the JSON.`
      }
    ];

    const response = await this.chat(messages);
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AIService] No JSON found in response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Add required fields
      const now = new Date().toISOString();
      const strategy: StrategyDefinition = {
        id: `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: parsed.name || 'Generated Strategy',
        description: parsed.description || '',
        type: parsed.type || 'custom',
        timeframe: parsed.timeframe || '1d',
        instruments: parsed.instruments || [],
        entryConditions: (parsed.entryConditions || []).map((c: any, i: number) => ({
          id: c.id || `entry_${i}`,
          indicator: c.indicator,
          operator: c.operator,
          value: c.value,
          params: c.params,
          valueParams: c.valueParams,
        })),
        exitConditions: (parsed.exitConditions || []).map((c: any, i: number) => ({
          id: c.id || `exit_${i}`,
          indicator: c.indicator,
          operator: c.operator,
          value: c.value,
          params: c.params,
          valueParams: c.valueParams,
        })),
        riskParams: {
          maxPositionSize: parsed.riskParams?.maxPositionSize || 10,
          stopLossPercent: parsed.riskParams?.stopLossPercent || 2,
          takeProfitPercent: parsed.riskParams?.takeProfitPercent || 6,
          maxDrawdownPercent: parsed.riskParams?.maxDrawdownPercent || 5,
          maxDailyLoss: parsed.riskParams?.maxDailyLoss || 500,
          maxConcurrentPositions: parsed.riskParams?.maxConcurrentPositions || 5,
          maxLeverage: parsed.riskParams?.maxLeverage || 5,
          cooldownSeconds: parsed.riskParams?.cooldownSeconds || 300,
        },
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };

      return strategy;
    } catch (err) {
      console.error('[AIService] Failed to parse strategy:', err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Cost Calculation
  // ---------------------------------------------------------------------------

  private calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    // Pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4o': { prompt: 0.005, completion: 0.015 },
      'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o'];
    const cost = (promptTokens / 1000) * modelPricing.prompt + 
                 (completionTokens / 1000) * modelPricing.completion;
    
    return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
  }
}

// Export singleton instance
export const aiService = new AIService();
