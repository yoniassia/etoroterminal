// Trading REST Adapter
// Provides operations for opening positions (market orders)

import { ENDPOINTS } from '../contracts/endpoints';
import type { TradeResponse, OrderSide, OrderType } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';
import { ordersStore } from '../../stores/ordersStore';

// ============================================================================
// Types
// ============================================================================

export interface OpenPositionByAmountRequest {
  instrumentId: number;
  amount: number;
  isBuy: boolean;
  leverage: number;
  stopLossRate?: number;
  takeProfitRate?: number;
}

export interface OpenPositionByUnitsRequest {
  instrumentId: number;
  units: number;
  isBuy: boolean;
  leverage: number;
  stopLossRate?: number;
  takeProfitRate?: number;
}

export interface OrderResult {
  orderId: string;
  positionId: number | null;
  status: string;
  executedRate?: number;
  executedAt?: string;
  message?: string;
  tempOrderId?: string;
}

export interface InstrumentInfo {
  symbol: string;
  displayName: string;
}

// ============================================================================
// Trading Adapter Class
// ============================================================================

export class TradingAdapter {
  private readonly rest: RestAdapter;
  private isDemo: boolean;

  constructor(restAdapter?: RestAdapter, isDemo: boolean = true) {
    this.rest = restAdapter || getDefaultAdapter();
    this.isDemo = isDemo;
  }

  setDemoMode(isDemo: boolean): void {
    this.isDemo = isDemo;
  }

  isDemoMode(): boolean {
    return this.isDemo;
  }

  private getOpenByAmountEndpoint(): string {
    return this.isDemo ? ENDPOINTS.TRADING_DEMO_OPEN_BY_AMOUNT : ENDPOINTS.TRADING_OPEN_BY_AMOUNT;
  }

  private getOpenByUnitsEndpoint(): string {
    return this.isDemo ? ENDPOINTS.TRADING_DEMO_OPEN_BY_UNITS : ENDPOINTS.TRADING_OPEN_BY_UNITS;
  }

  async openPositionByAmount(
    instrumentId: number,
    amount: number,
    isBuy: boolean,
    leverage: number,
    stopLossRate?: number,
    takeProfitRate?: number,
    instrumentInfo?: InstrumentInfo
  ): Promise<OrderResult> {
    const side: OrderSide = isBuy ? 'buy' : 'sell';
    const orderType: OrderType = 'market';

    let tempOrderId: string | undefined;
    if (instrumentInfo) {
      tempOrderId = ordersStore.addOptimisticOrder({
        instrumentId,
        symbol: instrumentInfo.symbol,
        displayName: instrumentInfo.displayName,
        side,
        orderType,
        amount,
        leverage,
        stopLossRate,
        takeProfitRate,
      });
    }

    const request = {
      InstrumentID: instrumentId,
      IsBuy: isBuy,
      Amount: amount,
      Leverage: leverage,
      StopLossRate: stopLossRate,
      TakeProfitRate: takeProfitRate,
    };

    try {
      const response = await this.rest.post<TradeResponse>(
        this.getOpenByAmountEndpoint(),
        request
      );

      if (tempOrderId) {
        ordersStore.reconcileOptimisticOrder(tempOrderId, response.orderId, {
          status: response.status,
          executedRate: response.executedRate,
          executedAt: response.executedAt,
        });
      }

      return {
        orderId: response.orderId,
        positionId: response.positionId ?? null,
        status: response.status,
        executedRate: response.executedRate,
        executedAt: response.executedAt,
        message: response.message,
        tempOrderId,
      };
    } catch (error) {
      if (tempOrderId) {
        ordersStore.updateOrder(tempOrderId, { status: 'rejected' });
      }
      throw error;
    }
  }

  async openPositionByUnits(
    instrumentId: number,
    units: number,
    isBuy: boolean,
    leverage: number,
    stopLossRate?: number,
    takeProfitRate?: number,
    instrumentInfo?: InstrumentInfo,
    amount?: number
  ): Promise<OrderResult> {
    const side: OrderSide = isBuy ? 'buy' : 'sell';
    const orderType: OrderType = 'market';

    let tempOrderId: string | undefined;
    if (instrumentInfo) {
      tempOrderId = ordersStore.addOptimisticOrder({
        instrumentId,
        symbol: instrumentInfo.symbol,
        displayName: instrumentInfo.displayName,
        side,
        orderType,
        amount: amount ?? 0,
        leverage,
        stopLossRate,
        takeProfitRate,
      });
    }

    const request = {
      InstrumentID: instrumentId,
      IsBuy: isBuy,
      AmountInUnits: units,
      Leverage: leverage,
      StopLossRate: stopLossRate,
      TakeProfitRate: takeProfitRate,
    };

    try {
      const response = await this.rest.post<TradeResponse>(
        this.getOpenByUnitsEndpoint(),
        request
      );

      if (tempOrderId) {
        ordersStore.reconcileOptimisticOrder(tempOrderId, response.orderId, {
          status: response.status,
          executedRate: response.executedRate,
          executedAt: response.executedAt,
        });
      }

      return {
        orderId: response.orderId,
        positionId: response.positionId ?? null,
        status: response.status,
        executedRate: response.executedRate,
        executedAt: response.executedAt,
        message: response.message,
        tempOrderId,
      };
    } catch (error) {
      if (tempOrderId) {
        ordersStore.updateOrder(tempOrderId, { status: 'rejected' });
      }
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTradingAdapter(restAdapter?: RestAdapter, isDemo: boolean = true): TradingAdapter {
  return new TradingAdapter(restAdapter, isDemo);
}

// ============================================================================
// Default Instance (singleton pattern)
// ============================================================================

let defaultAdapter: TradingAdapter | null = null;

export function getTradingAdapter(): TradingAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new TradingAdapter();
  }
  return defaultAdapter;
}

export function setTradingAdapter(adapter: TradingAdapter): void {
  defaultAdapter = adapter;
}
