// Simple Quote Panel - displays a quote tile with streaming price
// Simpler version that works as a standalone panel content

import { useState, useEffect, useCallback } from 'react';
import { quotesStore, StoredQuote } from '../../stores/quotesStore';
import { symbolResolver, ResolvedSymbol } from '../../services/symbolResolver';
import { streamingService } from '../../services/streamingService';
import { quotesPollingService } from '../../services/quotesPollingService';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './QuotePanel.css';

const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];

interface DisplayQuote {
  bid: number;
  ask: number;
  lastPrice: number;
  spread: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

function formatPrice(price: number): string {
  if (price === 0) return '--';
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatChange(change: number, changePercent: number): string {
  if (change === 0 && changePercent === 0) return '--';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '--';
  }
}

export default function QuotePanelSimple(_props: PanelContentProps) {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [inputSymbol, setInputSymbol] = useState<string>('AAPL');
  const [resolvedSymbol, setResolvedSymbol] = useState<ResolvedSymbol | null>(null);
  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve symbol
  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    symbolResolver.resolveSymbol(symbol).then((resolved) => {
      if (cancelled) return;
      setLoading(false);
      if (resolved) {
        setResolvedSymbol(resolved);
      } else {
        setResolvedSymbol(null);
        setError(`Symbol not found: ${symbol}`);
      }
    }).catch((err) => {
      if (cancelled) return;
      setLoading(false);
      setError(err.message);
    });

    return () => { cancelled = true; };
  }, [symbol]);

  // Subscribe to quotes
  useEffect(() => {
    if (!resolvedSymbol) return;

    const instrumentId = resolvedSymbol.instrumentId;

    // Subscribe to streaming via WebSocket
    streamingService.subscribeToInstrument(instrumentId);
    // Also subscribe via REST polling as fallback
    quotesPollingService.subscribe(instrumentId);

    // Get existing quote
    const existingQuote = quotesStore.getQuote(instrumentId);
    if (existingQuote) {
      updateQuote(existingQuote);
    }

    // Subscribe to updates
    const unsubscribe = quotesStore.subscribe(instrumentId, updateQuote);

    return () => {
      unsubscribe();
      streamingService.unsubscribeFromInstrument(instrumentId);
      quotesPollingService.unsubscribe(instrumentId);
    };
  }, [resolvedSymbol]);

  const updateQuote = useCallback((stored: StoredQuote) => {
    setQuote({
      bid: stored.bid,
      ask: stored.ask,
      lastPrice: stored.lastPrice,
      spread: stored.ask - stored.bid,
      change: stored.change ?? 0,
      changePercent: stored.changePercent ?? 0,
      timestamp: stored.timestamp,
    });
    setIsStale(false);
  }, []);

  // Check staleness periodically
  useEffect(() => {
    if (!resolvedSymbol) return;

    const interval = setInterval(() => {
      setIsStale(quotesStore.isStale(resolvedSymbol.instrumentId));
    }, 1000);

    return () => clearInterval(interval);
  }, [resolvedSymbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim().toUpperCase());
    }
  };

  const handleQuickSelect = (sym: string) => {
    setInputSymbol(sym);
    setSymbol(sym);
  };

  const changeClass = quote && quote.change >= 0 ? 'quote-panel__positive' : 'quote-panel__negative';

  return (
    <div className="quote-panel">
      <form className="quote-panel__search" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol..."
          className="quote-panel__input"
        />
        <button type="submit" className="quote-panel__search-btn">GO</button>
      </form>

      <div className="quote-panel__quick-select">
        {DEFAULT_SYMBOLS.map((sym) => (
          <button
            key={sym}
            className={`quote-panel__quick-btn ${sym === symbol ? 'quote-panel__quick-btn--active' : ''}`}
            onClick={() => handleQuickSelect(sym)}
          >
            {sym}
          </button>
        ))}
      </div>

      {loading && (
        <div className="quote-panel__loading">Loading {symbol}...</div>
      )}

      {error && (
        <div className="quote-panel__error">✗ {error}</div>
      )}

      {resolvedSymbol && !loading && !error && (
        <div className={`quote-panel__tile ${isStale ? 'quote-panel__tile--stale' : ''}`}>
          <div className="quote-panel__header">
            <span className="quote-panel__symbol">{resolvedSymbol.symbol}</span>
            <span className="quote-panel__name">{resolvedSymbol.displayName}</span>
          </div>

          {quote ? (
            <>
              <div className="quote-panel__price">
                <span className="quote-panel__last">{formatPrice(quote.lastPrice)}</span>
                <span className={`quote-panel__change ${changeClass}`}>
                  {formatChange(quote.change, quote.changePercent)}
                </span>
              </div>

              <div className="quote-panel__bid-ask">
                <div className="quote-panel__bid">
                  <span className="quote-panel__label">BID</span>
                  <span className="quote-panel__value">{formatPrice(quote.bid)}</span>
                </div>
                <div className="quote-panel__spread">
                  <span className="quote-panel__label">SPREAD</span>
                  <span className="quote-panel__value">{formatPrice(quote.spread)}</span>
                </div>
                <div className="quote-panel__ask">
                  <span className="quote-panel__label">ASK</span>
                  <span className="quote-panel__value">{formatPrice(quote.ask)}</span>
                </div>
              </div>

              <div className="quote-panel__footer">
                <span className="quote-panel__time">{formatTime(quote.timestamp)}</span>
                {isStale && <span className="quote-panel__stale-badge">STALE</span>}
              </div>
            </>
          ) : (
            <div className="quote-panel__waiting">Waiting for quote data...</div>
          )}
        </div>
      )}
    </div>
  );
}

export { QuotePanelSimple };
