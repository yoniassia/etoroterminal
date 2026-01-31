/**
 * NewsPanel - Real-time company news with sentiment
 * Commands: NEWS, HEADLINES
 * 
 * Features:
 * - Real-time news from Financial Datasets API
 * - Sentiment indicators (bullish/bearish/neutral)
 * - Source attribution
 * - Click-through to full articles
 */

import React, { useState, useEffect } from 'react';
import { getNews, hasApiKey, setApiKey } from '../../services/financialDatasetsService';
import type { NewsArticle } from '../../types/financialDatasets.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './NewsPanel.css';

interface NewsPanelProps extends PanelContentProps {
  ticker?: string;
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ ticker: initialTicker, panelId: _panelId }) => {
  const [ticker, setTicker] = useState(initialTicker || 'AAPL');
  const [inputTicker, setInputTicker] = useState(initialTicker || 'AAPL');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(hasApiKey());

  const fetchNews = async () => {
    if (!hasApiKey()) {
      setError('API key required. Enter your Financial Datasets API key below.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getNews(ticker, { limit: 20 });
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasKey) {
      fetchNews();
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

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return <span className="sentiment-badge bullish">🟢 Bullish</span>;
      case 'bearish':
        return <span className="sentiment-badge bearish">🔴 Bearish</span>;
      default:
        return <span className="sentiment-badge neutral">⚪ Neutral</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (!hasKey) {
    return (
      <div className="news-panel">
        <div className="panel-header">
          <h2>📰 NEWS</h2>
        </div>
        <div className="api-key-setup">
          <p>Enter your Financial Datasets API key to access news:</p>
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
    <div className="news-panel">
      <div className="panel-header">
        <h2>📰 NEWS - {ticker}</h2>
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

      {loading && <div className="loading">Loading news...</div>}
      {error && <div className="error">{error}</div>}

      <div className="news-list">
        {news.map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
          >
            {article.image_url && (
              <img
                src={article.image_url}
                alt=""
                className="news-thumbnail"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <div className="news-content">
              <div className="news-meta">
                {getSentimentBadge(article.sentiment)}
                <span className="news-source">{article.source}</span>
                <span className="news-date">{formatDate(article.date)}</span>
              </div>
              <h3 className="news-title">{article.title}</h3>
              <p className="news-author">By {article.author}</p>
            </div>
          </a>
        ))}
        
        {!loading && news.length === 0 && !error && (
          <div className="no-data">No news found for {ticker}</div>
        )}
      </div>
    </div>
  );
};

export default NewsPanel;
