import { useState, useCallback } from 'react';
import { keyManager } from '../../services/keyManager';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './ApiTesterPanel.css';

// Available API endpoints from eToro Public API
const API_ENDPOINTS = [
  // Market Data
  { category: 'Market Data', method: 'GET', path: '/api/v1/market-data/exchanges', description: 'Get available exchanges' },
  { category: 'Market Data', method: 'GET', path: '/api/v1/market-data/instruments', description: 'Get all instruments' },
  { category: 'Market Data', method: 'GET', path: '/api/v1/market-data/instrument-types', description: 'Get instrument types' },
  { category: 'Market Data', method: 'GET', path: '/api/v1/market-data/stocks-industries', description: 'Get stocks industries' },
  
  // Watchlists
  { category: 'Watchlists', method: 'GET', path: '/api/v1/curated-lists', description: 'Get curated lists' },
  { category: 'Watchlists', method: 'GET', path: '/api/v1/market-recommendations/{itemsCount}', description: 'Get market recommendations', params: ['itemsCount'] },
  { category: 'Watchlists', method: 'GET', path: '/api/v1/watchlists', description: 'Get user watchlists' },
  
  // Trading - Demo
  { category: 'Trading Demo', method: 'GET', path: '/api/v1/trading/info/demo/pnl', description: 'Get demo account PnL' },
  { category: 'Trading Demo', method: 'GET', path: '/api/v1/trading/info/demo/portfolio', description: 'Get demo portfolio' },
  
  // Trading - Real
  { category: 'Trading Real', method: 'GET', path: '/api/v1/trading/info/pnl', description: 'Get real account PnL' },
  { category: 'Trading Real', method: 'GET', path: '/api/v1/trading/info/portfolio', description: 'Get real portfolio' },
  { category: 'Trading Real', method: 'GET', path: '/api/v1/trading/info/trade/history', description: 'Get trading history' },
  
  // Users Info
  { category: 'Users Info', method: 'GET', path: '/api/v1/user-info/people', description: 'Get user profiles', params: ['usernames', 'cidList'] },
  { category: 'Users Info', method: 'GET', path: '/api/v1/user-info/people/search', description: 'Search users' },
  { category: 'Users Info', method: 'GET', path: '/api/v1/user-info/people/{username}/gain', description: 'Get user gain', params: ['username', 'minDate', 'maxDate', 'type'] },
  { category: 'Users Info', method: 'GET', path: '/api/v1/user-info/people/{username}/portfolio/live', description: 'Get user live portfolio', params: ['username'] },
  { category: 'Users Info', method: 'GET', path: '/api/v1/user-info/people/{username}/tradeinfo', description: 'Get user trade info', params: ['username'] },
  
  // Feeds
  { category: 'Feeds', method: 'GET', path: '/api/v1/feeds/user/{userId}', description: 'Get user feed', params: ['userId'] },
  { category: 'Feeds', method: 'GET', path: '/api/v1/feeds/instrument/{marketId}', description: 'Get instrument feed', params: ['marketId'] },
];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function ApiTesterPanel(_props: PanelContentProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const handleEndpointChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const endpoint = API_ENDPOINTS.find(ep => ep.path === e.target.value);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setParams({});
      setQueryParams('');
      setResponse(null);
      setError(null);
    }
  }, []);

  const handleParamChange = useCallback((param: string, value: string) => {
    setParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const executeRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setLatency(null);

    const keys = keyManager.getKeys();
    if (!keys) {
      setError('No API keys configured. Please login first.');
      setLoading(false);
      return;
    }

    // Build URL with path parameters
    let url = `https://public-api.etoro.com${selectedEndpoint.path}`;
    
    // Replace path parameters like {username}
    for (const [key, value] of Object.entries(params)) {
      if (url.includes(`{${key}}`)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    // Add query parameters
    const queryParts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (!selectedEndpoint.path.includes(`{${key}}`) && value) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    if (queryParams) {
      queryParts.push(queryParams);
    }
    if (queryParts.length > 0) {
      url += '?' + queryParts.join('&');
    }

    const requestId = generateUUID();
    const startTime = performance.now();

    try {
      const res = await fetch(url, {
        method: selectedEndpoint.method,
        headers: {
          'x-request-id': requestId,
          'x-api-key': keys.apiKey,
          'x-user-key': keys.userKey,
        },
      });

      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setStatusCode(res.status);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedEndpoint, params, queryParams]);

  // Group endpoints by category
  const categories = Array.from(new Set(API_ENDPOINTS.map(ep => ep.category)));

  return (
    <div className="api-tester-panel">
      <div className="api-tester-header">
        <h3>▓ API TESTER</h3>
        <p className="api-tester-description">
          Test eToro Public API endpoints directly. Select an endpoint, fill parameters, and click Execute.
        </p>
      </div>

      <div className="api-tester-controls">
        <div className="control-group">
          <label>Endpoint:</label>
          <select value={selectedEndpoint.path} onChange={handleEndpointChange}>
            {categories.map(category => (
              <optgroup key={category} label={category}>
                {API_ENDPOINTS.filter(ep => ep.category === category).map(ep => (
                  <option key={ep.path} value={ep.path}>
                    {ep.method} {ep.path}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="endpoint-description">
          {selectedEndpoint.description}
        </div>

        {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
          <div className="params-section">
            <label>Parameters:</label>
            {selectedEndpoint.params.map(param => (
              <div key={param} className="param-input">
                <span className="param-name">{param}:</span>
                <input
                  type="text"
                  value={params[param] || ''}
                  onChange={(e) => handleParamChange(param, e.target.value)}
                  placeholder={`Enter ${param}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="control-group">
          <label>Additional Query Params:</label>
          <input
            type="text"
            value={queryParams}
            onChange={(e) => setQueryParams(e.target.value)}
            placeholder="e.g., limit=10&offset=0"
          />
        </div>

        <button 
          className="execute-button"
          onClick={executeRequest}
          disabled={loading}
        >
          {loading ? '[ EXECUTING... ]' : '[ EXECUTE ]'}
        </button>
      </div>

      {(statusCode !== null || latency !== null) && (
        <div className="response-meta">
          {statusCode !== null && (
            <span className={`status-code ${statusCode >= 200 && statusCode < 300 ? 'success' : 'error'}`}>
              Status: {statusCode}
            </span>
          )}
          {latency !== null && (
            <span className="latency">Latency: {latency}ms</span>
          )}
        </div>
      )}

      {error && (
        <div className="api-error">
          ✗ {error}
        </div>
      )}

      {response && (
        <div className="response-section">
          <label>Response:</label>
          <pre className="response-body">{response}</pre>
        </div>
      )}
    </div>
  );
}
