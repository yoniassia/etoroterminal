// Connection Health Monitor Service
// Monitors API connection health with periodic pings, latency tracking, and status reporting

import { RestAdapter, getDefaultAdapter } from '../api/restAdapter';
import { ENDPOINTS } from '../api/contracts/endpoints';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'healthy' | 'degraded' | 'offline';

export interface ConnectionMetrics {
  latency: number;
  lastSuccess: number | null;
  errorCount: number;
  consecutiveErrors: number;
  totalChecks: number;
  successRate: number;
}

export interface HealthCheckResult {
  success: boolean;
  latency: number;
  timestamp: number;
  error?: string;
}

export interface ConnectionHealthConfig {
  pingIntervalMs?: number;
  degradedThresholdMs?: number;
  offlineThresholdErrors?: number;
  maxHistorySize?: number;
  adapter?: RestAdapter;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PING_INTERVAL_MS = 30000;
const DEFAULT_DEGRADED_THRESHOLD_MS = 2000;
const DEFAULT_OFFLINE_THRESHOLD_ERRORS = 3;
const DEFAULT_MAX_HISTORY_SIZE = 100;

// ============================================================================
// Connection Health Monitor Class
// ============================================================================

export class ConnectionHealthMonitor {
  private readonly adapter: RestAdapter;
  private readonly pingIntervalMs: number;
  private readonly degradedThresholdMs: number;
  private readonly offlineThresholdErrors: number;
  private readonly maxHistorySize: number;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isMonitoring = false;

  private latency = 0;
  private lastSuccess: number | null = null;
  private errorCount = 0;
  private consecutiveErrors = 0;
  private totalChecks = 0;
  private successfulChecks = 0;
  private history: HealthCheckResult[] = [];

  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private previousStatus: ConnectionStatus = 'offline';

  constructor(config: ConnectionHealthConfig = {}) {
    this.adapter = config.adapter || getDefaultAdapter();
    this.pingIntervalMs = config.pingIntervalMs ?? DEFAULT_PING_INTERVAL_MS;
    this.degradedThresholdMs = config.degradedThresholdMs ?? DEFAULT_DEGRADED_THRESHOLD_MS;
    this.offlineThresholdErrors = config.offlineThresholdErrors ?? DEFAULT_OFFLINE_THRESHOLD_ERRORS;
    this.maxHistorySize = config.maxHistorySize ?? DEFAULT_MAX_HISTORY_SIZE;
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('[ConnectionHealth] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('[ConnectionHealth] Starting health monitoring', {
      intervalMs: this.pingIntervalMs,
    });

    this.performHealthCheck();

    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.pingIntervalMs);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('[ConnectionHealth] Not currently monitoring');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isMonitoring = false;
    console.log('[ConnectionHealth] Stopped health monitoring');
  }

  getStatus(): ConnectionStatus {
    if (this.consecutiveErrors >= this.offlineThresholdErrors) {
      return 'offline';
    }

    if (this.consecutiveErrors > 0 || this.latency > this.degradedThresholdMs) {
      return 'degraded';
    }

    if (this.lastSuccess === null) {
      return 'offline';
    }

    return 'healthy';
  }

  getMetrics(): ConnectionMetrics {
    return {
      latency: this.latency,
      lastSuccess: this.lastSuccess,
      errorCount: this.errorCount,
      consecutiveErrors: this.consecutiveErrors,
      totalChecks: this.totalChecks,
      successRate: this.totalChecks > 0 ? this.successfulChecks / this.totalChecks : 0,
    };
  }

  getHistory(): HealthCheckResult[] {
    return [...this.history];
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async checkNow(): Promise<HealthCheckResult> {
    return this.performHealthCheck();
  }

  reset(): void {
    this.latency = 0;
    this.lastSuccess = null;
    this.errorCount = 0;
    this.consecutiveErrors = 0;
    this.totalChecks = 0;
    this.successfulChecks = 0;
    this.history = [];
    this.previousStatus = 'offline';
    console.log('[ConnectionHealth] Metrics reset');
  }

  private async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    this.totalChecks++;

    try {
      await this.adapter.get(ENDPOINTS.USER_INFO, {
        timeout: 10000,
        retries: 0,
      });

      const latency = Date.now() - startTime;
      this.latency = latency;
      this.lastSuccess = Date.now();
      this.consecutiveErrors = 0;
      this.successfulChecks++;

      const result: HealthCheckResult = {
        success: true,
        latency,
        timestamp: Date.now(),
      };

      this.addToHistory(result);
      this.checkStatusChange();

      console.log('[ConnectionHealth] Health check passed', {
        latency: `${latency}ms`,
        status: this.getStatus(),
      });

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.errorCount++;
      this.consecutiveErrors++;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const result: HealthCheckResult = {
        success: false,
        latency,
        timestamp: Date.now(),
        error: errorMessage,
      };

      this.addToHistory(result);
      this.checkStatusChange();

      console.warn('[ConnectionHealth] Health check failed', {
        error: errorMessage,
        consecutiveErrors: this.consecutiveErrors,
        status: this.getStatus(),
      });

      return result;
    }
  }

  private addToHistory(result: HealthCheckResult): void {
    this.history.push(result);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private checkStatusChange(): void {
    const currentStatus = this.getStatus();
    if (currentStatus !== this.previousStatus) {
      console.log('[ConnectionHealth] Status changed', {
        from: this.previousStatus,
        to: currentStatus,
      });
      this.previousStatus = currentStatus;
      this.notifyListeners(currentStatus);
    }
  }

  private notifyListeners(status: ConnectionStatus): void {
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (error) {
        console.error('[ConnectionHealth] Listener error:', error);
      }
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createConnectionHealthMonitor(config?: ConnectionHealthConfig): ConnectionHealthMonitor {
  return new ConnectionHealthMonitor(config);
}

// ============================================================================
// Default Instance (singleton pattern)
// ============================================================================

let defaultMonitor: ConnectionHealthMonitor | null = null;

export function getDefaultMonitor(): ConnectionHealthMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new ConnectionHealthMonitor();
  }
  return defaultMonitor;
}

export function setDefaultMonitor(monitor: ConnectionHealthMonitor): void {
  defaultMonitor = monitor;
}
