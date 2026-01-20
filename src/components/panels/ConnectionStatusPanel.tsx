import { useState, useEffect, useCallback } from 'react';
import { keyManager } from '../../services/keyManager';
import { streamingService } from '../../services/streamingService';
import { ENDPOINTS } from '../../api/contracts/endpoints';
import type { ConnectionState, AuthState } from '../../services/wsClient';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './ConnectionStatusPanel.css';

interface ApiTestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  message?: string;
  latency?: number;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const TEST_ENDPOINTS = [
  { name: 'Market Data', path: ENDPOINTS.MARKET_DATA_SEARCH },
  { name: 'Exchanges', path: ENDPOINTS.MARKET_DATA_EXCHANGES },
  { name: 'Curated Lists', path: ENDPOINTS.CURATED_LISTS },
  { name: 'Watchlists', path: ENDPOINTS.WATCHLISTS },
  { name: 'Recommendations', path: ENDPOINTS.RECOMMENDATIONS(10) },
  { name: 'User Search', path: ENDPOINTS.TRADERS_SEARCH + '?period=LastYear' },
  { name: 'Demo Portfolio', path: ENDPOINTS.PORTFOLIO_DEMO },
  { name: 'Real Portfolio', path: ENDPOINTS.PORTFOLIO },
];

export default function ConnectionStatusPanel(_props: PanelContentProps) {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [keysConfigured, setKeysConfigured] = useState(false);
  const [wsState, setWsState] = useState<{connectionState: ConnectionState; authState: AuthState}>({
    connectionState: 'disconnected',
    authState: 'unauthenticated',
  });

  useEffect(() => {
    const keys = keyManager.getKeys();
    setKeysConfigured(!!keys);
  }, []);

  useEffect(() => {
    const unsubscribe = streamingService.subscribe((state) => {
      setWsState(state);
    });
    return unsubscribe;
  }, []);

  const testEndpoint = useCallback(async (name: string, path: string): Promise<ApiTestResult> => {
    const keys = keyManager.getKeys();
    if (!keys) {
      return { endpoint: name, status: 'error', message: 'No API keys configured' };
    }

    const startTime = performance.now();
    try {
      const res = await fetch(`https://public-api.etoro.com${path}`, {
        method: 'GET',
        headers: {
          'x-request-id': generateUUID(),
          'x-api-key': keys.apiKey,
          'x-user-key': keys.userKey,
        },
      });

      const latency = Math.round(performance.now() - startTime);
      
      if (res.ok) {
        return { 
          endpoint: name, 
          status: 'success', 
          statusCode: res.status,
          message: 'Connected',
          latency 
        };
      } else {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const json = JSON.parse(text);
          message = json.errorMessage || json.errorCode || message;
        } catch {
          message = text.slice(0, 100) || message;
        }
        return { 
          endpoint: name, 
          status: 'error', 
          statusCode: res.status,
          message,
          latency 
        };
      }
    } catch (err) {
      return { 
        endpoint: name, 
        status: 'error', 
        message: err instanceof Error ? err.message : 'Request failed' 
      };
    }
  }, []);

  const runAllTests = useCallback(async () => {
    setTesting(true);
    setResults(TEST_ENDPOINTS.map(ep => ({ endpoint: ep.name, status: 'pending' as const })));

    const newResults: ApiTestResult[] = [];
    for (const ep of TEST_ENDPOINTS) {
      const result = await testEndpoint(ep.name, ep.path);
      newResults.push(result);
      setResults([...newResults, ...TEST_ENDPOINTS.slice(newResults.length).map(e => ({ endpoint: e.name, status: 'pending' as const }))]);
    }

    setResults(newResults);
    setTesting(false);
  }, [testEndpoint]);

  useEffect(() => {
    if (keysConfigured) {
      runAllTests();
    }
  }, [keysConfigured]);

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="connection-status-panel">
      <div className="status-header">
        <h3>▓ API CONNECTION STATUS</h3>
        <button 
          className="refresh-btn"
          onClick={runAllTests}
          disabled={testing || !keysConfigured}
        >
          {testing ? '[ TESTING... ]' : '[ TEST ALL ]'}
        </button>
      </div>

      {!keysConfigured && (
        <div className="no-keys-warning">
          ⚠️ No API keys configured. Please login with valid eToro API keys.
          <br/><br/>
          Get keys from: <a href="https://www.etoro.com/settings/trade" target="_blank" rel="noopener noreferrer">eToro Settings → Trading</a>
        </div>
      )}

      {keysConfigured && (
        <>
          <div className="ws-status-section">
            <h4>📡 WebSocket Streaming</h4>
            <div className="ws-status-row">
              <span className="ws-label">Connection:</span>
              <span className={`ws-value ws-${wsState.connectionState}`}>
                {wsState.connectionState.toUpperCase()}
              </span>
            </div>
            <div className="ws-status-row">
              <span className="ws-label">Auth:</span>
              <span className={`ws-value ws-${wsState.authState}`}>
                {wsState.authState.toUpperCase()}
              </span>
            </div>
            <button 
              className="connect-btn"
              onClick={() => streamingService.connect()}
              disabled={wsState.connectionState === 'connected' || wsState.connectionState === 'connecting'}
            >
              {wsState.connectionState === 'connected' ? '[ CONNECTED ]' : '[ CONNECT ]'}
            </button>
          </div>

          <div className="summary-bar">
            <span className="summary-success">✓ {successCount} Connected</span>
            <span className="summary-error">✗ {errorCount} Failed</span>
          </div>

          <div className="results-list">
            {results.map((result, idx) => (
              <div key={idx} className={`result-item status-${result.status}`}>
                <div className="result-name">{result.endpoint}</div>
                <div className="result-status">
                  {result.status === 'pending' && <span className="pending">●</span>}
                  {result.status === 'success' && <span className="success">✓</span>}
                  {result.status === 'error' && <span className="error">✗</span>}
                </div>
                {result.statusCode && (
                  <div className="result-code">{result.statusCode}</div>
                )}
                {result.latency && (
                  <div className="result-latency">{result.latency}ms</div>
                )}
                {result.message && result.status === 'error' && (
                  <div className="result-message">{result.message}</div>
                )}
              </div>
            ))}
          </div>

          <div className="info-section">
            <h4>📋 Troubleshooting</h4>
            <ul>
              <li><strong>403 InsufficientPermissions:</strong> Your API keys may not have the required permissions. Generate new keys with Read/Write access.</li>
              <li><strong>400 BadRequest:</strong> Check if the endpoint requires specific parameters.</li>
              <li><strong>Network Error:</strong> Check your internet connection or if CORS is blocking requests.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
