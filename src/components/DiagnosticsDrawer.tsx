import { useState, useEffect, useCallback, useRef } from 'react';
import {
  diagnosticsStore,
  LogEntry,
  RequestLogData,
  ResponseLogData,
  WSEventData,
  ErrorLogData,
} from '../services/diagnosticsStore';
import { WSSubscriptionManager } from '../services/wsSubscriptionManager';
import { useTradingMode } from '../contexts/TradingModeContext';
import { featureFlags } from '../config/featureFlags';
import './DiagnosticsDrawer.css';

export interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionManager?: WSSubscriptionManager;
}

type TabType = 'rest' | 'websocket' | 'subscriptions' | 'errors';

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'diagnostics-drawer__status--success';
  if (status >= 400 && status < 500) return 'diagnostics-drawer__status--client-error';
  if (status >= 500) return 'diagnostics-drawer__status--server-error';
  return '';
}

function getEventColor(event: string): string {
  switch (event) {
    case 'connect':
      return 'diagnostics-drawer__event--connect';
    case 'disconnect':
    case 'error':
      return 'diagnostics-drawer__event--error';
    case 'reconnect':
      return 'diagnostics-drawer__event--reconnect';
    case 'subscribe':
    case 'unsubscribe':
      return 'diagnostics-drawer__event--subscription';
    default:
      return '';
  }
}

export default function DiagnosticsDrawer({
  isOpen,
  onClose,
  subscriptionManager,
}: DiagnosticsDrawerProps) {
  const { mode } = useTradingMode();
  const [activeTab, setActiveTab] = useState<TabType>('rest');
  const [restLogs, setRestLogs] = useState<LogEntry[]>([]);
  const [wsLogs, setWsLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<LogEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshLogs = useCallback(() => {
    const requests = diagnosticsStore.getLogs('request');
    const responses = diagnosticsStore.getLogs('response');
    
    const combinedRest = [...requests, ...responses].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setRestLogs(combinedRest.slice(0, 100));
    
    const wsEvents = diagnosticsStore.getLogs('ws_event');
    setWsLogs(wsEvents.slice().reverse().slice(0, 100));
    
    setErrors(diagnosticsStore.getErrors().slice().reverse());
    
    if (subscriptionManager) {
      setSubscriptions(subscriptionManager.getActiveSubscriptions());
    }
  }, [subscriptionManager]);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      refreshIntervalRef.current = setInterval(refreshLogs, 1000);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isOpen, refreshLogs]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClearLogs = useCallback(() => {
    diagnosticsStore.clear();
    refreshLogs();
  }, [refreshLogs]);

  const handleExport = useCallback(() => {
    const bundle = diagnosticsStore.exportBundle({
      tradingMode: mode,
      featureFlags,
    });
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    a.download = `etoro-terminal-bundle-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mode]);

  if (!isOpen) return null;

  const renderRestTab = () => (
    <div className="diagnostics-drawer__content">
      {restLogs.length === 0 ? (
        <div className="diagnostics-drawer__empty">No REST logs</div>
      ) : (
        restLogs.map((log) => {
          const isRequest = log.type === 'request';
          const data = log.data as unknown as RequestLogData | ResponseLogData;
          const isExpanded = expandedItems.has(log.id);
          
          if (isRequest) {
            const req = data as RequestLogData;
            return (
              <div
                key={log.id}
                className="diagnostics-drawer__log-item diagnostics-drawer__log-item--request"
                onClick={() => toggleExpand(log.id)}
              >
                <div className="diagnostics-drawer__log-header">
                  <span className="diagnostics-drawer__time">{formatTimestamp(log.timestamp)}</span>
                  <span className="diagnostics-drawer__method">{req.method}</span>
                  <span className="diagnostics-drawer__url">{req.url}</span>
                  <span className="diagnostics-drawer__expand">{isExpanded ? '▼' : '▶'}</span>
                </div>
                {isExpanded && (
                  <div className="diagnostics-drawer__log-details">
                    {req.headers && (
                      <div className="diagnostics-drawer__section">
                        <div className="diagnostics-drawer__section-title">Headers</div>
                        <pre className="diagnostics-drawer__pre">
                          {JSON.stringify(req.headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {req.body != null && (
                      <div className="diagnostics-drawer__section">
                        <div className="diagnostics-drawer__section-title">Body</div>
                        <pre className="diagnostics-drawer__pre">
                          {JSON.stringify(req.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else {
            const res = data as ResponseLogData;
            return (
              <div
                key={log.id}
                className="diagnostics-drawer__log-item diagnostics-drawer__log-item--response"
                onClick={() => toggleExpand(log.id)}
              >
                <div className="diagnostics-drawer__log-header">
                  <span className="diagnostics-drawer__time">{formatTimestamp(log.timestamp)}</span>
                  <span className={`diagnostics-drawer__status ${getStatusColor(res.status)}`}>
                    {res.status}
                  </span>
                  <span className="diagnostics-drawer__url">{res.url}</span>
                  {res.durationMs !== undefined && (
                    <span className="diagnostics-drawer__duration">{formatDuration(res.durationMs)}</span>
                  )}
                  <span className="diagnostics-drawer__expand">{isExpanded ? '▼' : '▶'}</span>
                </div>
                {isExpanded && (
                  <div className="diagnostics-drawer__log-details">
                    {res.headers && (
                      <div className="diagnostics-drawer__section">
                        <div className="diagnostics-drawer__section-title">Headers</div>
                        <pre className="diagnostics-drawer__pre">
                          {JSON.stringify(res.headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {res.body != null && (
                      <div className="diagnostics-drawer__section">
                        <div className="diagnostics-drawer__section-title">Body</div>
                        <pre className="diagnostics-drawer__pre">
                          {JSON.stringify(res.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
        })
      )}
    </div>
  );

  const renderWebSocketTab = () => (
    <div className="diagnostics-drawer__content">
      {wsLogs.length === 0 ? (
        <div className="diagnostics-drawer__empty">No WebSocket events</div>
      ) : (
        wsLogs.map((log) => {
          const data = log.data as unknown as WSEventData;
          const isExpanded = expandedItems.has(log.id);
          
          return (
            <div
              key={log.id}
              className="diagnostics-drawer__log-item"
              onClick={() => toggleExpand(log.id)}
            >
              <div className="diagnostics-drawer__log-header">
                <span className="diagnostics-drawer__time">{formatTimestamp(log.timestamp)}</span>
                <span className={`diagnostics-drawer__event ${getEventColor(data.event)}`}>
                  {data.event.toUpperCase()}
                </span>
                {data.topic && (
                  <span className="diagnostics-drawer__topic">{data.topic}</span>
                )}
                {data.error && (
                  <span className="diagnostics-drawer__error-text">{data.error}</span>
                )}
                <span className="diagnostics-drawer__expand">{isExpanded ? '▼' : '▶'}</span>
              </div>
              {isExpanded && data.payload != null && (
                <div className="diagnostics-drawer__log-details">
                  <div className="diagnostics-drawer__section">
                    <div className="diagnostics-drawer__section-title">Payload</div>
                    <pre className="diagnostics-drawer__pre">
                      {JSON.stringify(data.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div className="diagnostics-drawer__content">
      <div className="diagnostics-drawer__subscriptions-header">
        <span>Active Subscriptions: {subscriptions.length}</span>
      </div>
      {subscriptions.length === 0 ? (
        <div className="diagnostics-drawer__empty">No active subscriptions</div>
      ) : (
        <div className="diagnostics-drawer__subscriptions-list">
          {subscriptions.map((topic, index) => (
            <div key={topic} className="diagnostics-drawer__subscription-item">
              <span className="diagnostics-drawer__subscription-index">{index + 1}</span>
              <span className="diagnostics-drawer__subscription-topic">{topic}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderErrorsTab = () => (
    <div className="diagnostics-drawer__content">
      {errors.length === 0 ? (
        <div className="diagnostics-drawer__empty">No errors logged</div>
      ) : (
        errors.map((log) => {
          const data = log.data as unknown as ErrorLogData;
          const isExpanded = expandedItems.has(log.id);
          
          return (
            <div
              key={log.id}
              className="diagnostics-drawer__log-item diagnostics-drawer__log-item--error"
              onClick={() => toggleExpand(log.id)}
            >
              <div className="diagnostics-drawer__log-header">
                <span className="diagnostics-drawer__time">{formatTimestamp(log.timestamp)}</span>
                {data.source && (
                  <span className="diagnostics-drawer__error-source">[{data.source}]</span>
                )}
                <span className="diagnostics-drawer__error-message">{data.message}</span>
                <span className="diagnostics-drawer__expand">{isExpanded ? '▼' : '▶'}</span>
              </div>
              {isExpanded && (
                <div className="diagnostics-drawer__log-details">
                  {data.stack && (
                    <div className="diagnostics-drawer__section">
                      <div className="diagnostics-drawer__section-title">Stack Trace</div>
                      <pre className="diagnostics-drawer__pre diagnostics-drawer__stack">
                        {data.stack}
                      </pre>
                    </div>
                  )}
                  {data.context && (
                    <div className="diagnostics-drawer__section">
                      <div className="diagnostics-drawer__section-title">Context</div>
                      <pre className="diagnostics-drawer__pre">
                        {JSON.stringify(data.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <div className="diagnostics-drawer__overlay" onClick={onClose} />
      <div className="diagnostics-drawer">
        <div className="diagnostics-drawer__header">
          <span className="diagnostics-drawer__title">&gt; DIAGNOSTICS</span>
          <div className="diagnostics-drawer__actions">
            <button className="diagnostics-drawer__action-btn" onClick={handleExport}>
              EXPORT
            </button>
            <button className="diagnostics-drawer__action-btn" onClick={handleClearLogs}>
              CLEAR
            </button>
            <button className="diagnostics-drawer__close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="diagnostics-drawer__tabs">
          <button
            className={`diagnostics-drawer__tab ${activeTab === 'rest' ? 'diagnostics-drawer__tab--active' : ''}`}
            onClick={() => setActiveTab('rest')}
          >
            REST ({restLogs.length})
          </button>
          <button
            className={`diagnostics-drawer__tab ${activeTab === 'websocket' ? 'diagnostics-drawer__tab--active' : ''}`}
            onClick={() => setActiveTab('websocket')}
          >
            WebSocket ({wsLogs.length})
          </button>
          <button
            className={`diagnostics-drawer__tab ${activeTab === 'subscriptions' ? 'diagnostics-drawer__tab--active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            className={`diagnostics-drawer__tab ${activeTab === 'errors' ? 'diagnostics-drawer__tab--active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            Errors ({errors.length})
          </button>
        </div>

        <div className="diagnostics-drawer__body">
          {activeTab === 'rest' && renderRestTab()}
          {activeTab === 'websocket' && renderWebSocketTab()}
          {activeTab === 'subscriptions' && renderSubscriptionsTab()}
          {activeTab === 'errors' && renderErrorsTab()}
        </div>
      </div>
    </>
  );
}

export { DiagnosticsDrawer };
