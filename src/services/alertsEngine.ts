// Alerts Engine Service
// Local evaluator for price threshold and staleness alerts with de-duplication

import { quotesStore, StoredQuote } from '../stores/quotesStore';

// ============================================================================
// Types
// ============================================================================

export type AlertType = 'price_above' | 'price_below' | 'staleness';

export interface AlertCondition {
  threshold?: number;
  stalenessSeconds?: number;
}

export interface Alert {
  id: string;
  instrumentId: number;
  type: AlertType;
  condition: AlertCondition;
  createdAt: number;
  lastTriggeredAt: number | null;
  enabled: boolean;
}

export interface AlertTriggerEvent {
  alert: Alert;
  currentValue: number;
  triggeredAt: number;
}

export type AlertCallback = (event: AlertTriggerEvent) => void;

export interface AlertsEngineConfig {
  cooldownMs?: number;
  evaluationIntervalMs?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_EVALUATION_INTERVAL_MS = 1000; // 1 second for staleness checks

// ============================================================================
// Alerts Engine Class
// ============================================================================

export class AlertsEngine {
  private readonly cooldownMs: number;
  private readonly evaluationIntervalMs: number;

  private alerts: Map<string, Alert> = new Map();
  private callbacks: Set<AlertCallback> = new Set();
  private unsubscribers: Map<number, () => void> = new Map();
  private stalenessIntervalId: ReturnType<typeof setInterval> | null = null;
  private idCounter = 0;

  constructor(config: AlertsEngineConfig = {}) {
    this.cooldownMs = config.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.evaluationIntervalMs = config.evaluationIntervalMs ?? DEFAULT_EVALUATION_INTERVAL_MS;
  }

  createAlert(instrumentId: number, type: AlertType, condition: AlertCondition): string {
    const id = `alert_${Date.now()}_${++this.idCounter}`;

    const alert: Alert = {
      id,
      instrumentId,
      type,
      condition,
      createdAt: Date.now(),
      lastTriggeredAt: null,
      enabled: true,
    };

    this.alerts.set(id, alert);
    this.ensureSubscription(instrumentId);

    if (type === 'staleness') {
      this.ensureStalenessMonitoring();
    }

    console.log('[AlertsEngine] Alert created', { id, instrumentId, type, condition });
    return id;
  }

  deleteAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    this.alerts.delete(alertId);
    this.cleanupSubscriptions();

    console.log('[AlertsEngine] Alert deleted', { alertId });
    return true;
  }

  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  getAlertsByInstrument(instrumentId: number): Alert[] {
    return this.getAlerts().filter((a) => a.instrumentId === instrumentId);
  }

  enableAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }
    alert.enabled = true;
    return true;
  }

  disableAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }
    alert.enabled = false;
    return true;
  }

  onAlert(callback: AlertCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  clearAlerts(): void {
    this.alerts.clear();
    this.cleanupSubscriptions();
    console.log('[AlertsEngine] All alerts cleared');
  }

  destroy(): void {
    this.clearAlerts();
    this.callbacks.clear();
    if (this.stalenessIntervalId) {
      clearInterval(this.stalenessIntervalId);
      this.stalenessIntervalId = null;
    }
  }

  private ensureSubscription(instrumentId: number): void {
    if (this.unsubscribers.has(instrumentId)) {
      return;
    }

    const unsubscribe = quotesStore.subscribe(instrumentId, (quote) => {
      this.evaluatePriceAlerts(quote);
    });

    this.unsubscribers.set(instrumentId, unsubscribe);
  }

  private cleanupSubscriptions(): void {
    const activeInstruments = new Set(this.getAlerts().map((a) => a.instrumentId));

    for (const [instrumentId, unsubscribe] of this.unsubscribers) {
      if (!activeInstruments.has(instrumentId)) {
        unsubscribe();
        this.unsubscribers.delete(instrumentId);
      }
    }

    const hasStalenessAlerts = this.getAlerts().some((a) => a.type === 'staleness');
    if (!hasStalenessAlerts && this.stalenessIntervalId) {
      clearInterval(this.stalenessIntervalId);
      this.stalenessIntervalId = null;
    }
  }

  private ensureStalenessMonitoring(): void {
    if (this.stalenessIntervalId) {
      return;
    }

    this.stalenessIntervalId = setInterval(() => {
      this.evaluateStalenessAlerts();
    }, this.evaluationIntervalMs);
  }

  private evaluatePriceAlerts(quote: StoredQuote): void {
    const alerts = this.getAlertsByInstrument(quote.instrumentId);

    for (const alert of alerts) {
      if (!alert.enabled || alert.type === 'staleness') {
        continue;
      }

      if (!this.canTrigger(alert)) {
        continue;
      }

      const price = quote.lastPrice;
      const threshold = alert.condition.threshold;

      if (threshold === undefined) {
        continue;
      }

      let shouldTrigger = false;

      if (alert.type === 'price_above' && price > threshold) {
        shouldTrigger = true;
      } else if (alert.type === 'price_below' && price < threshold) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        this.triggerAlert(alert, price);
      }
    }
  }

  private evaluateStalenessAlerts(): void {
    const stalenessAlerts = this.getAlerts().filter((a) => a.type === 'staleness' && a.enabled);

    for (const alert of stalenessAlerts) {
      if (!this.canTrigger(alert)) {
        continue;
      }

      const quote = quotesStore.getQuote(alert.instrumentId);
      const stalenessSeconds = alert.condition.stalenessSeconds ?? 10;
      const stalenessMs = stalenessSeconds * 1000;

      if (!quote) {
        this.triggerAlert(alert, 0);
        continue;
      }

      const ageMs = Date.now() - quote.receivedAt;
      if (ageMs > stalenessMs) {
        this.triggerAlert(alert, ageMs / 1000);
      }
    }
  }

  private canTrigger(alert: Alert): boolean {
    if (!alert.lastTriggeredAt) {
      return true;
    }

    return Date.now() - alert.lastTriggeredAt >= this.cooldownMs;
  }

  private triggerAlert(alert: Alert, currentValue: number): void {
    const now = Date.now();
    alert.lastTriggeredAt = now;

    const event: AlertTriggerEvent = {
      alert: { ...alert },
      currentValue,
      triggeredAt: now,
    };

    console.log('[AlertsEngine] Alert triggered', {
      alertId: alert.id,
      type: alert.type,
      instrumentId: alert.instrumentId,
      currentValue,
    });

    this.notifyCallbacks(event);
  }

  private notifyCallbacks(event: AlertTriggerEvent): void {
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('[AlertsEngine] Callback error:', error);
      }
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAlertsEngine(config?: AlertsEngineConfig): AlertsEngine {
  return new AlertsEngine(config);
}

// ============================================================================
// Default Instance (singleton pattern)
// ============================================================================

let defaultEngine: AlertsEngine | null = null;

export function getDefaultAlertsEngine(): AlertsEngine {
  if (!defaultEngine) {
    defaultEngine = new AlertsEngine();
  }
  return defaultEngine;
}

export function setDefaultAlertsEngine(engine: AlertsEngine): void {
  defaultEngine = engine;
}
