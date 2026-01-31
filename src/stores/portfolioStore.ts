import type { Position, Portfolio } from '../api/contracts/etoro-api.types';
import { etoroApi } from '../services/etoroApi';
import { symbolResolver } from '../services/symbolResolver';
import { demoDataService, isDemoMode as isGlobalDemoMode } from '../services/demoDataService';

export type AutoRefreshInterval = 30000 | 60000 | 300000;

export interface PortfolioState {
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: AutoRefreshInterval;
  isDemo: boolean;
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export type PortfolioUpdateCallback = (state: PortfolioState) => void;

class PortfolioStore {
  private state: PortfolioState = {
    portfolio: null,
    loading: false,
    error: null,
    lastUpdated: null,
    autoRefreshEnabled: false,
    autoRefreshInterval: 60000,
    isDemo: true,
  };
  private subscribers: Set<PortfolioUpdateCallback> = new Set();
  private autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

  getState(): PortfolioState {
    return { ...this.state };
  }

  getPositions(): Position[] {
    return this.state.portfolio?.positions || [];
  }

  getPosition(positionId: number): Position | undefined {
    return this.state.portfolio?.positions.find((p) => p.positionId === positionId);
  }

  subscribe(callback: PortfolioUpdateCallback): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.subscribers.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('[PortfolioStore] Subscriber error:', error);
      }
    });
  }

  private setState(updates: Partial<PortfolioState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  setDemoMode(isDemo: boolean): void {
    if (isDemo !== this.state.isDemo) {
      etoroApi.setDemoMode(isDemo);
      this.setState({ isDemo, portfolio: null, lastUpdated: null, error: null });
      this.fetchPortfolio().catch(() => {});
    }
  }

  isDemoMode(): boolean {
    return this.state.isDemo;
  }

  async fetchPortfolio(): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      // Check if we're in global demo mode (from login page)
      if (isGlobalDemoMode()) {
        const demoPortfolio = demoDataService.getDemoPortfolio();
        const positions: Position[] = demoPortfolio.positions.map(p => ({
          positionId: p.positionId,
          instrumentId: p.instrumentId,
          instrumentName: `${p.symbol} - ${p.name}`,
          isBuy: p.isBuy,
          amount: p.amount,
          leverage: p.leverage,
          units: p.units,
          openRate: p.openRate,
          openDateTime: p.openDateTime,
          currentRate: p.currentRate,
          profit: p.profit,
          profitPercent: p.profitPercent,
        }));
        const portfolio: Portfolio = {
          totalValue: demoPortfolio.totalValue,
          equity: demoPortfolio.equity,
          credit: 0,
          bonusCredit: 0,
          profit: demoPortfolio.profit,
          positions,
        };
        this.setState({
          portfolio,
          loading: false,
          lastUpdated: Date.now(),
          isDemo: true,
        });
        return;
      }
      
      etoroApi.setDemoMode(this.state.isDemo);
      const data = await etoroApi.getPortfolio();
      
      // Enrich positions with instrument names from symbolResolver
      const enrichedPositions: Position[] = await Promise.all(
        data.positions.map(async (position) => {
          if (position.instrumentName) {
            return position as Position;
          }
          try {
            const resolved = await symbolResolver.getInstrumentById(position.instrumentId);
            if (resolved) {
              return {
                ...position,
                instrumentName: `${resolved.symbol} - ${resolved.displayName}`,
              } as Position;
            }
          } catch (e) {
            console.warn(`[PortfolioStore] Failed to resolve instrument ${position.instrumentId}:`, e);
          }
          return position as Position;
        })
      );
      
      const portfolio: Portfolio = {
        totalValue: data.totalValue,
        equity: data.equity,
        credit: data.credit,
        bonusCredit: data.bonusCredit,
        profit: data.profit,
        positions: enrichedPositions,
      };
      this.setState({
        portfolio,
        loading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch portfolio';
      this.setState({ loading: false, error: message });
      throw err;
    }
  }

  async closePosition(positionId: number): Promise<void> {
    const position = this.getPosition(positionId);
    if (!position) {
      throw new Error(`Position ${positionId} not found`);
    }

    this.setState({ loading: true, error: null });
    try {
      // Note: This is a placeholder - actual close endpoint would be called here
      // await etoroApi.closePosition(positionId);

      // Optimistically remove position from state
      if (this.state.portfolio) {
        const updatedPositions = this.state.portfolio.positions.filter(
          (p) => p.positionId !== positionId
        );
        this.setState({
          portfolio: {
            ...this.state.portfolio,
            positions: updatedPositions,
          },
          loading: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close position';
      this.setState({ loading: false, error: message });
      throw err;
    }
  }

  clear(): void {
    this.stopAutoRefresh();
    this.setState({
      portfolio: null,
      loading: false,
      error: null,
      lastUpdated: null,
      autoRefreshEnabled: false,
      autoRefreshInterval: 60000,
      isDemo: true,
    });
  }

  isStale(): boolean {
    if (!this.state.lastUpdated) return true;
    return Date.now() - this.state.lastUpdated > STALE_THRESHOLD_MS;
  }

  setAutoRefresh(enabled: boolean): void {
    if (enabled === this.state.autoRefreshEnabled) return;
    this.setState({ autoRefreshEnabled: enabled });
    if (enabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  setAutoRefreshInterval(interval: AutoRefreshInterval): void {
    if (interval === this.state.autoRefreshInterval) return;
    this.setState({ autoRefreshInterval: interval });
    if (this.state.autoRefreshEnabled) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.autoRefreshTimer = setInterval(() => {
      this.fetchPortfolio().catch(() => {});
    }, this.state.autoRefreshInterval);
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }
}

export const portfolioStore = new PortfolioStore();

// Auto-fetch portfolio on initialization
portfolioStore.fetchPortfolio().catch((err) => {
  console.log('[PortfolioStore] Initial fetch (demo mode):', err.message);
});
