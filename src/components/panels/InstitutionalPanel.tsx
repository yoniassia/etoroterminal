/**
 * InstitutionalPanel - Track institutional ownership (13F filings)
 * Commands: INST, WHALES, 13F
 * 
 * Features:
 * - Top institutional holders
 * - Holdings value and shares
 * - "Follow the whales" tracking
 */

import React, { useState, useEffect } from 'react';
import { getInstitutionalOwnership, hasApiKey, setApiKey } from '../../services/financialDatasetsService';
import type { InstitutionalHolding } from '../../types/financialDatasets.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './InstitutionalPanel.css';

interface InstitutionalPanelProps extends PanelContentProps {
  ticker?: string;
}

export const InstitutionalPanel: React.FC<InstitutionalPanelProps> = ({ ticker: initialTicker, panelId: _panelId }) => {
  const [ticker, setTicker] = useState(initialTicker || 'AAPL');
  const [inputTicker, setInputTicker] = useState(initialTicker || 'AAPL');
  const [holdings, setHoldings] = useState<InstitutionalHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(hasApiKey());

  const fetchHoldings = async () => {
    if (!hasApiKey()) {
      setError('API key required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInstitutionalOwnership(ticker, { limit: 20 });
      setHoldings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasKey) {
      fetchHoldings();
    }
  }, [ticker, hasKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTicker(inputTicker.toUpperCase());
  };

  const handleSetApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setHasKey(true);
      setApiKeyInput('');
    }
  };

  const formatValue = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatShares = (shares: number): string => {
    if (shares >= 1e9) return `${(shares / 1e9).toFixed(2)}B`;
    if (shares >= 1e6) return `${(shares / 1e6).toFixed(2)}M`;
    if (shares >= 1e3) return `${(shares / 1e3).toFixed(0)}K`;
    return shares.toLocaleString();
  };

  const formatInvestorName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const totalValue = holdings.reduce((sum, h) => sum + (h.market_value || 0), 0);
  const totalShares = holdings.reduce((sum, h) => sum + (h.shares || 0), 0);

  if (!hasKey) {
    return (
      <div className="institutional-panel">
        <div className="panel-header">
          <h2>🐋 INSTITUTIONAL</h2>
        </div>
        <div className="api-key-setup">
          <p>Enter your Financial Datasets API key:</p>
          <div className="api-key-input-row">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter API key..."
            />
            <button onClick={handleSetApiKey}>Save Key</button>
          </div>
          <p className="api-key-hint">
            Get your key at <a href="https://financialdatasets.ai" target="_blank" rel="noopener">financialdatasets.ai</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="institutional-panel">
      <div className="panel-header">
        <h2>🐋 INSTITUTIONAL - {ticker}</h2>
        <form onSubmit={handleSearch} className="ticker-search">
          <input
            type="text"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
            placeholder="Ticker..."
            maxLength={5}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {holdings.length > 0 && (
        <div className="summary-row">
          <div className="summary-item">
            <span className="label">Top {holdings.length} Holders</span>
            <span className="value">{formatValue(totalValue)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Shares</span>
            <span className="value">{formatShares(totalShares)}</span>
          </div>
        </div>
      )}

      {loading && <div className="loading">Loading institutional data...</div>}
      {error && <div className="error">{error}</div>}

      <div className="holdings-list">
        <div className="holdings-header">
          <span className="col-investor">Investor</span>
          <span className="col-shares">Shares</span>
          <span className="col-value">Value</span>
          <span className="col-date">Report Date</span>
        </div>
        
        {holdings.map((holding, idx) => (
          <div key={idx} className="holding-row">
            <span className="col-investor">
              <span className="rank">#{idx + 1}</span>
              {formatInvestorName(holding.investor)}
            </span>
            <span className="col-shares">{formatShares(holding.shares)}</span>
            <span className="col-value">{formatValue(holding.market_value)}</span>
            <span className="col-date">{holding.report_period}</span>
          </div>
        ))}
        
        {!loading && holdings.length === 0 && !error && (
          <div className="no-data">No institutional holdings found for {ticker}</div>
        )}
      </div>
    </div>
  );
};

export default InstitutionalPanel;
