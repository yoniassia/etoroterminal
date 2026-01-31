// Claw Agent Adapter for eToro Terminal
// Provides structured API responses optimized for AI agent consumption

import { RestAdapter } from './restAdapter';
import type { RequestOptions } from './restAdapter';

// ============================================================================
// Types
// ============================================================================

export interface ClawResponse<T = unknown> {
  success: boolean;
  version: string;
  timestamp: string;
  data: T;
  meta?: ClawMeta;
  error?: ClawError;
}

export interface ClawMeta {
  requestId: string;
  duration: number;
  cached: boolean;
  source: string;
}

export interface ClawError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  suggestion?: string;
}

export interface ClawCapabilities {
  endpoints: ClawEndpoint[];
  version: string;
  features: string[];
}

export interface ClawEndpoint {
  path: string;
  method: string;
  description: string;
  params?: ClawParam[];
  example?: string;
}

export interface ClawParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

// ============================================================================
// Version
// ============================================================================

export const CLAW_VERSION = '1.8.0';
export const APP_VERSION = '1.8.0';

// ============================================================================
// Claw Adapter
// ============================================================================

export class ClawAdapter {
  private restAdapter: RestAdapter | null = null;

  constructor(config?: { apiKey?: string; userKey?: string }) {
    if (config?.apiKey && config?.userKey) {
      this.restAdapter = new RestAdapter({
        apiKey: config.apiKey,
        userKey: config.userKey
      });
    }
  }

  /**
   * Get service status and capabilities
   */
  getStatus(): ClawResponse<ClawCapabilities> {
    return this.wrapResponse({
      endpoints: this.getEndpoints(),
      version: APP_VERSION,
      features: [
        'real-time-quotes',
        'portfolio-management',
        'strategy-builder',
        'insider-activity',
        'fundamentals',
        'sec-filings',
        'institutional-holdings',
        'news-feed',
        'alerts',
        'watchlists'
      ]
    });
  }

  /**
   * Get available endpoints for Claw agents
   */
  private getEndpoints(): ClawEndpoint[] {
    return [
      {
        path: '/api/claw/status',
        method: 'GET',
        description: 'Get service status, version, and capabilities'
      },
      {
        path: '/api/claw/quote/:symbol',
        method: 'GET',
        description: 'Get real-time quote for a symbol',
        params: [{ name: 'symbol', type: 'string', required: true, description: 'Stock/crypto symbol' }],
        example: '/api/claw/quote/AAPL'
      },
      {
        path: '/api/claw/portfolio',
        method: 'GET',
        description: 'Get current portfolio positions and P&L'
      },
      {
        path: '/api/claw/insider/:symbol',
        method: 'GET',
        description: 'Get insider trading activity for a symbol',
        params: [{ name: 'symbol', type: 'string', required: true, description: 'Stock symbol' }],
        example: '/api/claw/insider/AAPL'
      },
      {
        path: '/api/claw/fundamentals/:symbol',
        method: 'GET',
        description: 'Get financial statements (income, balance, cash flow)',
        params: [
          { name: 'symbol', type: 'string', required: true, description: 'Stock symbol' },
          { name: 'period', type: 'string', required: false, description: 'quarterly|annual', default: 'quarterly' }
        ],
        example: '/api/claw/fundamentals/AAPL?period=annual'
      },
      {
        path: '/api/claw/filings/:symbol',
        method: 'GET',
        description: 'Get SEC filings (10-K, 10-Q, 8-K)',
        params: [{ name: 'symbol', type: 'string', required: true, description: 'Stock symbol' }],
        example: '/api/claw/filings/AAPL'
      },
      {
        path: '/api/claw/institutional/:symbol',
        method: 'GET',
        description: 'Get institutional holdings (13F)',
        params: [{ name: 'symbol', type: 'string', required: true, description: 'Stock symbol' }],
        example: '/api/claw/institutional/AAPL'
      },
      {
        path: '/api/claw/strategy/list',
        method: 'GET',
        description: 'List all trading strategies'
      },
      {
        path: '/api/claw/strategy/create',
        method: 'POST',
        description: 'Create a new trading strategy from template or AI',
        params: [
          { name: 'name', type: 'string', required: true, description: 'Strategy name' },
          { name: 'template', type: 'string', required: false, description: 'Template ID to use' },
          { name: 'prompt', type: 'string', required: false, description: 'AI prompt for custom strategy' }
        ]
      },
      {
        path: '/api/claw/alerts',
        method: 'GET',
        description: 'Get active price alerts'
      },
      {
        path: '/api/claw/command',
        method: 'POST',
        description: 'Execute a terminal command',
        params: [{ name: 'command', type: 'string', required: true, description: 'Command to execute (e.g., "Q AAPL", "NEWS")' }],
        example: '{ "command": "Q AAPL" }'
      }
    ];
  }

  /**
   * Wrap data in standard Claw response format
   */
  private wrapResponse<T>(data: T, meta?: Partial<ClawMeta>): ClawResponse<T> {
    return {
      success: true,
      version: CLAW_VERSION,
      timestamp: new Date().toISOString(),
      data,
      meta: {
        requestId: this.generateRequestId(),
        duration: meta?.duration ?? 0,
        cached: meta?.cached ?? false,
        source: meta?.source ?? 'etoro-terminal'
      }
    };
  }

  /**
   * Create error response
   */
  private wrapError(error: Partial<ClawError>): ClawResponse<null> {
    return {
      success: false,
      version: CLAW_VERSION,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        code: error.code ?? 'UNKNOWN_ERROR',
        message: error.message ?? 'An unknown error occurred',
        details: error.details,
        recoverable: error.recoverable ?? true,
        suggestion: error.suggestion
      }
    };
  }

  private generateRequestId(): string {
    return `claw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton for easy access
export const clawAdapter = new ClawAdapter();
