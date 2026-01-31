/**
 * FilingsPanel - SEC Filings browser
 * Commands: FILINGS, SEC, 10K, 10Q, 8K
 * 
 * Features:
 * - Browse 10-K, 10-Q, 8-K filings
 * - Direct links to SEC.gov
 * - Filing type filters
 */

import React, { useState, useEffect } from 'react';
import { getSECFilings, hasApiKey, setApiKey } from '../../services/financialDatasetsService';
import type { SECFiling, FDFilingsParams } from '../../types/financialDatasets.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './FilingsPanel.css';

interface FilingsPanelProps extends PanelContentProps {
  ticker?: string;
}

type FilingType = '10-K' | '10-Q' | '8-K' | '4' | 'all';

export const FilingsPanel: React.FC<FilingsPanelProps> = ({ ticker: initialTicker, panelId: _panelId }) => {
  const [ticker, setTicker] = useState(initialTicker || 'AAPL');
  const [inputTicker, setInputTicker] = useState(initialTicker || 'AAPL');
  const [filings, setFilings] = useState<SECFiling[]>([]);
  const [filingType, setFilingType] = useState<FilingType>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(hasApiKey());

  const fetchFilings = async () => {
    if (!hasApiKey()) {
      setError('API key required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params: Partial<FDFilingsParams> = { limit: 50 };
      if (filingType !== 'all') {
        params.filing_type = filingType as '10-K' | '10-Q' | '8-K' | '4' | '144';
      }
      const data = await getSECFilings(ticker, params);
      setFilings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasKey) {
      fetchFilings();
    }
  }, [ticker, filingType, hasKey]);

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

  const getFilingBadgeClass = (type: string): string => {
    switch (type) {
      case '10-K': return 'badge-10k';
      case '10-Q': return 'badge-10q';
      case '8-K': return 'badge-8k';
      case '4': return 'badge-4';
      default: return 'badge-other';
    }
  };

  const getFilingDescription = (type: string): string => {
    switch (type) {
      case '10-K': return 'Annual Report';
      case '10-Q': return 'Quarterly Report';
      case '8-K': return 'Material Event';
      case '4': return 'Insider Trade';
      case '144': return 'Sale Notice';
      default: return type;
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!hasKey) {
    return (
      <div className="filings-panel">
        <div className="panel-header">
          <h2>📄 SEC FILINGS</h2>
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
    <div className="filings-panel">
      <div className="panel-header">
        <h2>📄 SEC FILINGS - {ticker}</h2>
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

      <div className="filter-row">
        {(['all', '10-K', '10-Q', '8-K', '4'] as FilingType[]).map(type => (
          <button
            key={type}
            className={`filter-btn ${filingType === type ? 'active' : ''}`}
            onClick={() => setFilingType(type)}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Loading filings...</div>}
      {error && <div className="error">{error}</div>}

      <div className="filings-list">
        {filings.map((filing, idx) => (
          <a
            key={idx}
            href={filing.filing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="filing-item"
          >
            <span className={`filing-badge ${getFilingBadgeClass(filing.filing_type)}`}>
              {filing.filing_type}
            </span>
            <div className="filing-info">
              <span className="filing-desc">{getFilingDescription(filing.filing_type)}</span>
              <span className="filing-date">{formatDate(filing.report_date)}</span>
            </div>
            <span className="filing-link">View on SEC →</span>
          </a>
        ))}
        
        {!loading && filings.length === 0 && !error && (
          <div className="no-data">No filings found for {ticker}</div>
        )}
      </div>
    </div>
  );
};

export default FilingsPanel;
