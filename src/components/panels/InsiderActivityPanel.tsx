/**
 * Insider Activity Panel
 * Commands: INS, INSIDER
 * Shows insider trades and sentiment from Financial Datasets API
 */
import { useState, useEffect } from 'react';
import { useActiveSymbol } from '../Workspace/ActiveSymbolContext';
import { getInsiderTrades, getInsiderSentiment, hasApiKey, formatValue } from '../../services/financialDatasetsService';
import type { InsiderTrade, InsiderSentiment } from '../../types/financialDatasets.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './InsiderActivityPanel.css';

export default function InsiderActivityPanel({ config }: PanelContentProps) {
  const { activeSymbol } = useActiveSymbol();
  const ticker = config?.symbol || activeSymbol || null;
  
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [sentiment, setSentiment] = useState<InsiderSentiment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    
    if (!hasApiKey()) {
      setError('Financial Datasets API key required. Set fd_api_key in localStorage.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [tradesData, sentimentData] = await Promise.all([
          getInsiderTrades(ticker, { limit: 50 }),
          getInsiderSentiment(ticker, 90),
        ]);
        setTrades(tradesData);
        setSentiment(sentimentData);
      } catch (err) {
        console.error('[InsiderActivityPanel] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load insider data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  const getSentimentClass = (sentiment: 'bullish' | 'bearish' | 'neutral'): string => {
    switch (sentiment) {
      case 'bullish': return 'sentiment-bullish';
      case 'bearish': return 'sentiment-bearish';
      default: return 'sentiment-neutral';
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  };

  if (!ticker) {
    return (
      <div className="insider-panel">
        <div className="insider-header">
          <h2>👤 INSIDER ACTIVITY</h2>
        </div>
        <div className="insider-empty">
          <p>Enter a symbol to view insider trades</p>
          <p className="hint">Example: INS AAPL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insider-panel">
      <div className="insider-header">
        <h2>👤 INSIDER ACTIVITY - {ticker}</h2>
        {loading && <span className="loading-indicator">Loading...</span>}
      </div>

      {error && (
        <div className="insider-error">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {sentiment && !loading && (
        <div className="sentiment-summary">
          <div className={`sentiment-badge ${getSentimentClass(sentiment.sentiment)}`}>
            {sentiment.sentiment.toUpperCase()}
          </div>
          <div className="sentiment-stats">
            <div className="stat">
              <span className="stat-label">Net Value (90d)</span>
              <span className={`stat-value ${sentiment.netValue >= 0 ? 'positive' : 'negative'}`}>
                {sentiment.netValue >= 0 ? '+' : ''}{formatValue(sentiment.netValue)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Buys</span>
              <span className="stat-value positive">{sentiment.buyCount} (${formatValue(sentiment.totalBuys)})</span>
            </div>
            <div className="stat">
              <span className="stat-label">Sells</span>
              <span className="stat-value negative">{sentiment.sellCount} (${formatValue(sentiment.totalSells)})</span>
            </div>
          </div>
        </div>
      )}

      <div className="trades-container">
        <div className="trades-header">
          <span className="col-date">Date</span>
          <span className="col-name">Insider</span>
          <span className="col-title">Title</span>
          <span className="col-type">Type</span>
          <span className="col-shares">Shares</span>
          <span className="col-value">Value</span>
        </div>

        {!loading && trades.length === 0 && !error && (
          <div className="no-data">No insider trades found for {ticker}</div>
        )}

        <div className="trades-list">
          {trades.map((trade, idx) => (
            <div key={idx} className={`trade-row ${trade.transaction_shares > 0 ? 'buy' : 'sell'}`}>
              <span className="col-date">{formatDate(trade.filing_date)}</span>
              <span className="col-name" title={trade.name}>{trade.name.split(' ').slice(0, 2).join(' ')}</span>
              <span className="col-title" title={trade.title}>{trade.title.length > 12 ? trade.title.slice(0, 12) + '...' : trade.title}</span>
              <span className={`col-type ${trade.transaction_shares > 0 ? 'buy-text' : 'sell-text'}`}>
                {trade.transaction_shares > 0 ? 'BUY' : 'SELL'}
              </span>
              <span className="col-shares">{Math.abs(trade.transaction_shares).toLocaleString()}</span>
              <span className={`col-value ${trade.transaction_shares > 0 ? 'positive' : 'negative'}`}>
                ${formatValue(Math.abs(trade.transaction_value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
