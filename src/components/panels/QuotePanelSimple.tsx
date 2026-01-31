// Simple Quote Panel - displays a quote tile with streaming price
// With symbol autocomplete from the cached universe

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { quotesStore, StoredQuote } from '../../stores/quotesStore';
import { symbolResolver, ResolvedSymbol } from '../../services/symbolResolver';
import { streamingService } from '../../services/streamingService';
import { quotesPollingService } from '../../services/quotesPollingService';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import { useActiveSymbol } from '../Workspace/ActiveSymbolContext';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './QuotePanel.css';

interface UniverseItem {
  id: number;
  sym: string;
  name: string;
  type: string;
  exchange: string;
}

let universeCache: UniverseItem[] | null = null;

async function loadUniverse(): Promise<UniverseItem[]> {
  if (universeCache) return universeCache;
  try {
    const data = await import('../../data/symbolUniverse.json');
    universeCache = data.default as UniverseItem[];
    return universeCache;
  } catch (err) {
    console.error('Failed to load symbol universe:', err);
    return [];
  }
}

const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
const MAX_SUGGESTIONS = 8;

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
  const { getPendingSymbol, openPanelForSymbol } = useWorkspaceContext();
  const { activeSymbol, setActiveSymbol } = useActiveSymbol();
  
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [inputSymbol, setInputSymbol] = useState<string>('AAPL');
  const [resolvedSymbol, setResolvedSymbol] = useState<ResolvedSymbol | null>(null);
  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete state
  const [universe, setUniverse] = useState<UniverseItem[]>([]);
  const [suggestions, setSuggestions] = useState<UniverseItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Load universe on mount and check for pending symbol
  useEffect(() => {
    loadUniverse().then(setUniverse);
    
    // Check if opened with a specific symbol
    if (!initializedRef.current) {
      initializedRef.current = true;
      const pending = getPendingSymbol();
      if (pending?.symbol) {
        setSymbol(pending.symbol);
        setInputSymbol(pending.symbol);
      }
    }
  }, [getPendingSymbol]);

  // Listen for active symbol changes from other panels
  useEffect(() => {
    if (activeSymbol && activeSymbol !== symbol) {
      setSymbol(activeSymbol);
      setInputSymbol(activeSymbol);
    }
  }, [activeSymbol]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!inputSymbol.trim() || inputSymbol.length < 1) return [];
    
    const query = inputSymbol.toLowerCase();
    const matches = universe.filter(
      (item) =>
        item.sym.toLowerCase().startsWith(query) ||
        item.name.toLowerCase().includes(query)
    );
    
    // Sort: exact symbol match first, then symbol starts with, then name contains
    matches.sort((a, b) => {
      const aExact = a.sym.toLowerCase() === query;
      const bExact = b.sym.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      
      const aStarts = a.sym.toLowerCase().startsWith(query);
      const bStarts = b.sym.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      return a.sym.localeCompare(b.sym);
    });
    
    return matches.slice(0, MAX_SUGGESTIONS);
  }, [universe, inputSymbol]);

  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setSelectedSuggestionIndex(-1);
  }, [filteredSuggestions]);

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

    streamingService.subscribeToInstrument(instrumentId);
    quotesPollingService.subscribe(instrumentId);

    const existingQuote = quotesStore.getQuote(instrumentId);
    if (existingQuote) {
      updateQuote(existingQuote);
    }

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

  // Check staleness
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
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputSymbol(value);
    setShowSuggestions(value.length > 0);
  };

  const handleInputFocus = () => {
    if (inputSymbol.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          const selected = suggestions[selectedSuggestionIndex];
          selectSuggestion(selected);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const selectSuggestion = (item: UniverseItem) => {
    setInputSymbol(item.sym);
    setSymbol(item.sym);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleQuickSelect = (sym: string) => {
    setInputSymbol(sym);
    setSymbol(sym);
  };

  const handleTrade = (_side: 'buy' | 'sell') => {
    if (resolvedSymbol) {
      // Set active symbol so Trade Ticket picks it up
      // Side is passed but we open the trade ticket which handles direction
      setActiveSymbol(resolvedSymbol.symbol);
      openPanelForSymbol('TRD', resolvedSymbol.symbol, resolvedSymbol.instrumentId);
    }
  };

  const changeClass = quote && quote.change >= 0 ? 'quote-panel__positive' : 'quote-panel__negative';

  return (
    <div className="quote-panel">
      <form className="quote-panel__search" onSubmit={handleSubmit}>
        <div className="quote-panel__input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputSymbol}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter symbol..."
            className="quote-panel__input"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="quote-panel__suggestions">
              {suggestions.map((item, index) => (
                <div
                  key={item.id}
                  className={`quote-panel__suggestion ${
                    index === selectedSuggestionIndex ? 'quote-panel__suggestion--selected' : ''
                  }`}
                  onMouseDown={() => selectSuggestion(item)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <span className="quote-panel__suggestion-symbol">{item.sym}</span>
                  <span className="quote-panel__suggestion-name">{item.name}</span>
                  <span className="quote-panel__suggestion-exchange">{item.exchange}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
                <button 
                  className="quote-panel__bid quote-panel__trade-btn"
                  onClick={() => handleTrade('sell')}
                  title="Sell at bid price"
                >
                  <span className="quote-panel__label">SELL</span>
                  <span className="quote-panel__value">{formatPrice(quote.bid)}</span>
                </button>
                <div className="quote-panel__spread">
                  <span className="quote-panel__label">SPREAD</span>
                  <span className="quote-panel__value">{formatPrice(quote.spread)}</span>
                </div>
                <button 
                  className="quote-panel__ask quote-panel__trade-btn"
                  onClick={() => handleTrade('buy')}
                  title="Buy at ask price"
                >
                  <span className="quote-panel__label">BUY</span>
                  <span className="quote-panel__value">{formatPrice(quote.ask)}</span>
                </button>
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
