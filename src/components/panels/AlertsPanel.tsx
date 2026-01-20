import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertsEngine,
  Alert,
  AlertType,
  AlertTriggerEvent,
  getDefaultAlertsEngine,
} from '../../services/alertsEngine';
import { ENDPOINTS } from '../../api/contracts/endpoints';
import { getDefaultAdapter } from '../../api/restAdapter';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './AlertsPanel.css';

interface SearchResult {
  instrumentId: number;
  symbol: string;
  displayName: string;
}

interface TriggeredAlert {
  id: string;
  alertId: string;
  instrumentId: number;
  symbol: string;
  type: AlertType;
  threshold?: number;
  currentValue: number;
  triggeredAt: number;
}

interface InstrumentInfo {
  instrumentId: number;
  symbol: string;
  displayName: string;
}

export interface AlertsPanelProps extends PanelContentProps {
  engine?: AlertsEngine;
}

function formatAlertType(type: AlertType): string {
  switch (type) {
    case 'price_above':
      return 'ABOVE';
    case 'price_below':
      return 'BELOW';
    case 'staleness':
      return 'STALE';
    default:
      return String(type).toUpperCase();
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatValue(value: number, type: AlertType): string {
  if (type === 'staleness') {
    return `${value.toFixed(1)}s`;
  }
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

export default function AlertsPanel({ engine }: AlertsPanelProps = { panelId: '' }) {
  const alertsEngine = engine ?? getDefaultAlertsEngine();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggeredLog, setTriggeredLog] = useState<TriggeredAlert[]>([]);
  const [instrumentMap, setInstrumentMap] = useState<Map<number, InstrumentInfo>>(new Map());
  const [toast, setToast] = useState<TriggeredAlert | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<SearchResult | null>(null);
  const [alertType, setAlertType] = useState<AlertType>('price_above');
  const [threshold, setThreshold] = useState('');
  const [stalenessSeconds, setStalenessSeconds] = useState('10');
  const [formError, setFormError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAlerts = useCallback(() => {
    setAlerts(alertsEngine.getAlerts());
  }, [alertsEngine]);

  useEffect(() => {
    loadAlerts();

    const unsubscribe = alertsEngine.onAlert((event: AlertTriggerEvent) => {
      const info = instrumentMap.get(event.alert.instrumentId);
      const triggered: TriggeredAlert = {
        id: `${event.alert.id}_${event.triggeredAt}`,
        alertId: event.alert.id,
        instrumentId: event.alert.instrumentId,
        symbol: info?.symbol ?? `ID:${event.alert.instrumentId}`,
        type: event.alert.type,
        threshold: event.alert.condition.threshold,
        currentValue: event.currentValue,
        triggeredAt: event.triggeredAt,
      };

      setTriggeredLog((prev) => [triggered, ...prev].slice(0, 50));
      showToast(triggered);
      loadAlerts();
    });

    return unsubscribe;
  }, [alertsEngine, instrumentMap, loadAlerts]);

  const showToast = useCallback((triggered: TriggeredAlert) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(triggered);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchInstruments = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const adapter = getDefaultAdapter();
      const response = await adapter.get<Record<string, unknown>>(
        `${ENDPOINTS.INSTRUMENTS_SEARCH}?query=${encodeURIComponent(query)}&limit=10`
      );

      const rawInstruments = (response.instruments ?? response.Instruments ?? []) as Record<string, unknown>[];
      const results = rawInstruments.map((inst) => ({
        instrumentId: (inst.instrumentId ?? inst.InstrumentId ?? inst.InstrumentID ?? 0) as number,
        symbol: (inst.symbol ?? inst.Symbol ?? '') as string,
        displayName: (inst.displayName ?? inst.DisplayName ?? inst.symbol ?? inst.Symbol ?? '') as string,
      }));

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setSelectedInstrument(null);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchInstruments(value);
      }, 300);
    },
    [searchInstruments]
  );

  const handleSelectInstrument = useCallback((result: SearchResult) => {
    setSelectedInstrument(result);
    setSearchQuery(result.symbol);
    setSearchResults([]);

    setInstrumentMap((prev) => {
      const next = new Map(prev);
      next.set(result.instrumentId, result);
      return next;
    });
  }, []);

  const handleCreateAlert = useCallback(() => {
    setFormError(null);

    if (!selectedInstrument) {
      setFormError('Please select an instrument');
      return;
    }

    let condition;
    if (alertType === 'staleness') {
      const seconds = parseFloat(stalenessSeconds);
      if (isNaN(seconds) || seconds <= 0) {
        setFormError('Invalid staleness threshold');
        return;
      }
      condition = { stalenessSeconds: seconds };
    } else {
      const value = parseFloat(threshold);
      if (isNaN(value) || value <= 0) {
        setFormError('Invalid price threshold');
        return;
      }
      condition = { threshold: value };
    }

    alertsEngine.createAlert(selectedInstrument.instrumentId, alertType, condition);
    loadAlerts();

    setShowForm(false);
    setSearchQuery('');
    setSelectedInstrument(null);
    setThreshold('');
    setStalenessSeconds('10');
    setAlertType('price_above');
  }, [alertsEngine, selectedInstrument, alertType, threshold, stalenessSeconds, loadAlerts]);

  const handleDeleteAlert = useCallback(
    (alertId: string) => {
      alertsEngine.deleteAlert(alertId);
      loadAlerts();
    },
    [alertsEngine, loadAlerts]
  );

  const handleToggleAlert = useCallback(
    (alertId: string, enabled: boolean) => {
      if (enabled) {
        alertsEngine.disableAlert(alertId);
      } else {
        alertsEngine.enableAlert(alertId);
      }
      loadAlerts();
    },
    [alertsEngine, loadAlerts]
  );

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  return (
    <div className="alerts-panel" role="region" aria-label="Price alerts">
      {toast && (
        <div 
          className="alerts-panel__toast" 
          onClick={dismissToast}
          role="alert"
          aria-live="assertive"
        >
          <span className="alerts-panel__toast-icon" aria-hidden="true">⚠</span>
          <span className="alerts-panel__toast-text">
            {toast.symbol} {formatAlertType(toast.type)}{' '}
            {toast.threshold !== undefined && formatValue(toast.threshold, toast.type)} →{' '}
            {formatValue(toast.currentValue, toast.type)}
          </span>
          <button className="alerts-panel__toast-close" aria-label="Dismiss alert notification">✕</button>
        </div>
      )}

      <div className="alerts-panel__header">
        <h2 className="alerts-panel__title" id="alerts-title">&gt; PRICE ALERTS</h2>
        <button
          className="alerts-panel__add-btn"
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
          aria-label={showForm ? 'Cancel creating alert' : 'Create new alert'}
        >
          {showForm ? '[ CANCEL ]' : '[ + NEW ]'}
        </button>
      </div>

      {showForm && (
        <div className="alerts-panel__form" role="form" aria-label="Create new alert">
          <div className="alerts-panel__form-row">
            <label className="alerts-panel__form-label" htmlFor="alert-instrument">Instrument</label>
            <div className="alerts-panel__search-container">
              <input
                id="alert-instrument"
                type="text"
                className="alerts-panel__input"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search symbol..."
                autoComplete="off"
                aria-autocomplete="list"
                aria-describedby={searchResults.length > 0 ? 'search-results' : undefined}
              />
              {searching && <span className="alerts-panel__spinner" aria-hidden="true">▓</span>}
              {searchResults.length > 0 && (
                <div className="alerts-panel__search-results" id="search-results" role="listbox">
                  {searchResults.map((result) => (
                    <div
                      key={result.instrumentId}
                      className="alerts-panel__search-result"
                      onClick={() => handleSelectInstrument(result)}
                      role="option"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectInstrument(result);
                        }
                      }}
                      aria-label={`${result.symbol} - ${result.displayName}`}
                    >
                      <span className="alerts-panel__search-result-symbol">
                        {result.symbol}
                      </span>
                      <span className="alerts-panel__search-result-name">
                        {result.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="alerts-panel__form-row">
            <label className="alerts-panel__form-label" htmlFor="alert-type">Type</label>
            <select
              id="alert-type"
              className="alerts-panel__select"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
            >
              <option value="price_above">Price Above</option>
              <option value="price_below">Price Below</option>
              <option value="staleness">Staleness</option>
            </select>
          </div>

          {alertType !== 'staleness' ? (
            <div className="alerts-panel__form-row">
              <label className="alerts-panel__form-label" htmlFor="alert-price">Price</label>
              <input
                id="alert-price"
                type="number"
                className="alerts-panel__input"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 150.00"
                step="any"
              />
            </div>
          ) : (
            <div className="alerts-panel__form-row">
              <label className="alerts-panel__form-label" htmlFor="alert-staleness">Seconds</label>
              <input
                id="alert-staleness"
                type="number"
                className="alerts-panel__input"
                value={stalenessSeconds}
                onChange={(e) => setStalenessSeconds(e.target.value)}
                placeholder="e.g. 10"
                min="1"
              />
            </div>
          )}

          {formError && (
            <div className="alerts-panel__form-error" role="alert">✕ {formError}</div>
          )}

          <button
            className="alerts-panel__form-submit"
            onClick={handleCreateAlert}
            aria-label="Create alert"
          >
            CREATE ALERT
          </button>
        </div>
      )}

      <div className="alerts-panel__section" role="region" aria-labelledby="active-alerts-header">
        <div className="alerts-panel__section-header">
          <span id="active-alerts-header">Active Alerts ({alerts.length})</span>
        </div>
        <div className="alerts-panel__list" role="list" aria-label="Active alerts">
          {alerts.length === 0 ? (
            <div className="alerts-panel__empty" role="status">No active alerts</div>
          ) : (
            alerts.map((alert) => {
              const info = instrumentMap.get(alert.instrumentId);
              const symbol = info?.symbol ?? `ID:${alert.instrumentId}`;
              const value =
                alert.type === 'staleness'
                  ? `${alert.condition.stalenessSeconds}s`
                  : formatValue(alert.condition.threshold ?? 0, alert.type);

              return (
                <div
                  key={alert.id}
                  className={`alerts-panel__alert ${!alert.enabled ? 'alerts-panel__alert--disabled' : ''}`}
                  role="listitem"
                  aria-label={`${symbol} ${formatAlertType(alert.type)} ${value}, ${alert.enabled ? 'enabled' : 'disabled'}`}
                >
                  <span className="alerts-panel__alert-symbol">{symbol}</span>
                  <span className="alerts-panel__alert-type">
                    {formatAlertType(alert.type)}
                  </span>
                  <span className="alerts-panel__alert-value">{value}</span>
                  <button
                    className="alerts-panel__alert-toggle"
                    onClick={() => handleToggleAlert(alert.id, alert.enabled)}
                    aria-label={alert.enabled ? `Disable alert for ${symbol}` : `Enable alert for ${symbol}`}
                    aria-pressed={alert.enabled}
                  >
                    {alert.enabled ? '●' : '○'}
                  </button>
                  <button
                    className="alerts-panel__alert-delete"
                    onClick={() => handleDeleteAlert(alert.id)}
                    aria-label={`Delete alert for ${symbol}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="alerts-panel__section" role="region" aria-labelledby="triggered-log-header">
        <div className="alerts-panel__section-header">
          <span id="triggered-log-header">Triggered Log ({triggeredLog.length})</span>
          {triggeredLog.length > 0 && (
            <button
              className="alerts-panel__clear-log"
              onClick={() => setTriggeredLog([])}
              aria-label="Clear triggered alerts log"
            >
              CLEAR
            </button>
          )}
        </div>
        <div className="alerts-panel__log" role="log" aria-label="Triggered alerts log">
          {triggeredLog.length === 0 ? (
            <div className="alerts-panel__empty" role="status">No triggered alerts</div>
          ) : (
            triggeredLog.map((item) => (
              <div key={item.id} className="alerts-panel__log-item">
                <span className="alerts-panel__log-time">
                  {formatTime(item.triggeredAt)}
                </span>
                <span className="alerts-panel__log-symbol">{item.symbol}</span>
                <span className="alerts-panel__log-type">
                  {formatAlertType(item.type)}
                </span>
                <span className="alerts-panel__log-value">
                  {item.threshold !== undefined && (
                    <>
                      {formatValue(item.threshold, item.type)} →{' '}
                    </>
                  )}
                  {formatValue(item.currentValue, item.type)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { AlertsPanel };
