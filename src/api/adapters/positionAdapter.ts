// Position Close Adapter
// Provides operations for closing positions (full and partial)

import { ENDPOINTS } from '../contracts/endpoints';
import type { ClosePositionResponse } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

// ============================================================================
// Types
// ============================================================================

export interface ClosePositionRequest {
  positionId: number;
  units?: number; // Optional: for partial close
}

export interface ClosePositionResult {
  positionId: number;
  closedRate: number;
  closedAt: string;
  profit: number;
  isPartialClose: boolean;
  closedUnits?: number;
}

// ============================================================================
// Position Adapter Class
// ============================================================================

export class PositionAdapter {
  private readonly rest: RestAdapter;
  private readonly isDemo: boolean;

  constructor(restAdapter?: RestAdapter, isDemo: boolean = true) {
    this.rest = restAdapter || getDefaultAdapter();
    this.isDemo = isDemo;
  }

  private getCloseEndpoint(positionId: number): string {
    return this.isDemo 
      ? ENDPOINTS.TRADING_DEMO_CLOSE(positionId) 
      : ENDPOINTS.TRADING_CLOSE(positionId);
  }

  async closePosition(positionId: number): Promise<ClosePositionResult> {
    const response = await this.rest.post<ClosePositionResponse>(
      this.getCloseEndpoint(positionId),
      {}
    );

    return {
      positionId: response.positionId,
      closedRate: response.closedRate,
      closedAt: response.closedAt,
      profit: response.profit,
      isPartialClose: false,
    };
  }

  async closePositionPartial(positionId: number, units: number): Promise<ClosePositionResult> {
    if (units <= 0) {
      throw new Error('Units must be greater than 0 for partial close');
    }

    const request = { UnitsToDeduct: units };
    const response = await this.rest.post<ClosePositionResponse>(
      this.getCloseEndpoint(positionId),
      request
    );

    return {
      positionId: response.positionId,
      closedRate: response.closedRate,
      closedAt: response.closedAt,
      profit: response.profit,
      isPartialClose: true,
      closedUnits: units,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createPositionAdapter(restAdapter?: RestAdapter, isDemo: boolean = true): PositionAdapter {
  return new PositionAdapter(restAdapter, isDemo);
}

// ============================================================================
// Default Instances (singleton pattern)
// ============================================================================

let defaultRealAdapter: PositionAdapter | null = null;
let defaultDemoAdapter: PositionAdapter | null = null;

export function getPositionAdapter(isDemo: boolean = true): PositionAdapter {
  if (isDemo) {
    if (!defaultDemoAdapter) {
      defaultDemoAdapter = new PositionAdapter(undefined, true);
    }
    return defaultDemoAdapter;
  }

  if (!defaultRealAdapter) {
    defaultRealAdapter = new PositionAdapter(undefined, false);
  }
  return defaultRealAdapter;
}

export function setPositionAdapter(adapter: PositionAdapter, isDemo: boolean = true): void {
  if (isDemo) {
    defaultDemoAdapter = adapter;
  } else {
    defaultRealAdapter = adapter;
  }
}
