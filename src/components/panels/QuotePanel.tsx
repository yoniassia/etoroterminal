import { useState, useEffect, useCallback, useRef } from 'react';
import Panel from '../Workspace/Panel';
import { usePanelLink } from '../Workspace/usePanelLink';
import { LinkGroup } from '../Workspace/ActiveSymbolContext';
import { quotesStore, StoredQuote } from '../../stores/quotesStore';
import { symbolResolver, ResolvedSymbol } from '../../services/symbolResolver';
import { WS_TOPICS } from '../../api/contracts/endpoints';
import './QuotePanel.css';

const STALENESS_CHECK_INTERVAL_MS = 1000;

export interface QuotePanelProps {
  id: string;
  initialSymbol?: string;
  initialLinkGroup?: LinkGroup;
  onClose?: (id: string) => void;
  wsSubscribe?: (topic: string) => void;
  wsUnsubscribe?: (topic: string) => void;
}

interface DisplayQuote {
  bid: number;
  ask: number;
  lastPrice: number;
  spread: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

function formatPrice(price: number, decimals: number = 4): string {
  if (price === 0) return '--';
  return price.toFixed(decimals);
}

function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  } catch {
    return '--';
  }
}

export default function QuotePanel({
  id,
  initialSymbol,
  initialLinkGroup = 'A',
  onClose,
  wsSubscribe,
  wsUnsubscribe,
}: QuotePanelProps) {
  const {
    currentSymbol,
    linkGroup,
    isPinned,
    setLinkGroup,
    togglePin,
    pin,
  } = usePanelLink(initialLinkGroup);

  const [resolvedSymbol, setResolvedSymbol] = useState<ResolvedSymbol | null>(null);
  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribedInstrumentRef = useRef<number | null>(null);

  const effectiveSymbol = isPinned ? currentSymbol : (currentSymbol || initialSymbol || null);

  useEffect(() => {
    if (initialSymbol && !currentSymbol) {
      pin(initialSymbol);
    }
  }, [initialSymbol, currentSymbol, pin]);

  useEffect(() => {
    if (!effectiveSymbol) {
      setResolvedSymbol(null);
      setQuote(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    symbolResolver.resolveSymbol(effectiveSymbol).then((resolved) => {
      if (cancelled) return;
      setIsLoading(false);

      if (resolved) {
        setResolvedSymbol(resolved);
      } else {
        setResolvedSymbol(null);
        setError(`Symbol not found: ${effectiveSymbol}`);
      }
    }).catch((err) => {
      if (cancelled) return;
      setIsLoading(false);
      setError(`Failed to resolve symbol: ${err.message}`);
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveSymbol]);

  const handleQuoteUpdate = useCallback((storedQuote: StoredQuote) => {
    const spread = storedQuote.ask - storedQuote.bid;
    setQuote({
      bid: storedQuote.bid,
      ask: storedQuote.ask,
      lastPrice: storedQuote.lastPrice,
      spread,
      change: storedQuote.change ?? 0,
      changePercent: storedQuote.changePercent ?? 0,
      timestamp: storedQuote.timestamp,
    });
    setIsStale(false);
  }, []);

  useEffect(() => {
    if (!resolvedSymbol) {
      if (subscribedInstrumentRef.current !== null && wsUnsubscribe) {
        const topic = WS_TOPICS.QUOTES_INSTRUMENT(subscribedInstrumentRef.current);
        wsUnsubscribe(topic);
        subscribedInstrumentRef.current = null;
      }
      return;
    }

    const instrumentId = resolvedSymbol.instrumentId;

    if (subscribedInstrumentRef.current !== null && subscribedInstrumentRef.current !== instrumentId) {
      if (wsUnsubscribe) {
        const oldTopic = WS_TOPICS.QUOTES_INSTRUMENT(subscribedInstrumentRef.current);
        wsUnsubscribe(oldTopic);
      }
    }

    const topic = WS_TOPICS.QUOTES_INSTRUMENT(instrumentId);
    if (wsSubscribe) {
      wsSubscribe(topic);
    }
    subscribedInstrumentRef.current = instrumentId;

    const existingQuote = quotesStore.getQuote(instrumentId);
    if (existingQuote) {
      handleQuoteUpdate(existingQuote);
      setIsStale(quotesStore.isStale(instrumentId));
    } else {
      setQuote(null);
    }

    const unsubscribe = quotesStore.subscribe(instrumentId, handleQuoteUpdate);

    return () => {
      unsubscribe();
    };
  }, [resolvedSymbol, wsSubscribe, wsUnsubscribe, handleQuoteUpdate]);

  useEffect(() => {
    return () => {
      if (subscribedInstrumentRef.current !== null && wsUnsubscribe) {
        const topic = WS_TOPICS.QUOTES_INSTRUMENT(subscribedInstrumentRef.current);
        wsUnsubscribe(topic);
      }
    };
  }, [wsUnsubscribe]);

  useEffect(() => {
    if (!resolvedSymbol) return;

    const checkStaleness = () => {
      const stale = quotesStore.isStale(resolvedSymbol.instrumentId);
      setIsStale(stale);
    };

    const interval = setInterval(checkStaleness, STALENESS_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [resolvedSymbol]);

  const renderNoSymbol = () => (
    <div className="quote-panel-no-symbol">
      <div className="quote-panel-no-symbol-icon">[ ]</div>
      <div className="quote-panel-no-symbol-text">
        No symbol selected.<br />
        Use the command bar to select a symbol.
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="quote-panel-loading">
      <span className="quote-panel-loading-spinner">[...]</span>
      <span style={{ marginLeft: 8 }}>Loading...</span>
    </div>
  );

  const renderError = () => (
    <div className="quote-panel-no-symbol">
      <div className="quote-panel-no-symbol-icon">[!]</div>
      <div className="quote-panel-no-symbol-text" style={{ color: '#ff4444' }}>
        {error}
      </div>
    </div>
  );

  const renderQuote = () => {
    if (!resolvedSymbol) return renderNoSymbol();

    const changeClass = quote
      ? quote.change > 0 ? 'positive' : quote.change < 0 ? 'negative' : 'neutral'
      : 'neutral';

    return (
      <div className="quote-panel">
        <div className="quote-panel-header">
          <div>
            <div className="quote-panel-symbol">{resolvedSymbol.symbol}</div>
            <div className="quote-panel-name">{resolvedSymbol.name}</div>
          </div>
          {isStale && (
            <div className="quote-panel-stale">
              <span className="quote-panel-stale-dot" />
              <span>STALE</span>
            </div>
          )}
        </div>

        <div className="quote-panel-last">
          <span className="quote-panel-last-label">Last</span>
          <span className="quote-panel-last-value">
            {quote ? formatPrice(quote.lastPrice) : '--'}
          </span>
        </div>

        <div className="quote-panel-prices">
          <div className="quote-panel-price-box bid">
            <span className="quote-panel-price-label">Bid</span>
            <span className="quote-panel-price-value bid">
              {quote ? formatPrice(quote.bid) : '--'}
            </span>
          </div>
          <div className="quote-panel-price-box ask">
            <span className="quote-panel-price-label">Ask</span>
            <span className="quote-panel-price-value ask">
              {quote ? formatPrice(quote.ask) : '--'}
            </span>
          </div>
        </div>

        <div className="quote-panel-details">
          <div className="quote-panel-detail">
            <span className="quote-panel-detail-label">Spread</span>
            <span className="quote-panel-detail-value neutral">
              {quote ? formatPrice(quote.spread, 4) : '--'}
            </span>
          </div>
          <div className="quote-panel-detail">
            <span className="quote-panel-detail-label">Change</span>
            <span className={`quote-panel-detail-value ${changeClass}`}>
              {quote ? formatChange(quote.change, quote.changePercent) : '--'}
            </span>
          </div>
        </div>

        {quote && (
          <div className="quote-panel-timestamp">
            Last update: {formatTimestamp(quote.timestamp)}
          </div>
        )}
      </div>
    );
  };

  const panelTitle = resolvedSymbol ? `Quote: ${resolvedSymbol.symbol}` : 'Quote';

  return (
    <Panel
      id={id}
      title={panelTitle}
      onClose={onClose}
      linkGroup={linkGroup}
      isPinned={isPinned}
      onLinkGroupChange={setLinkGroup}
      onPinToggle={togglePin}
    >
      {isLoading ? renderLoading() : error ? renderError() : renderQuote()}
    </Panel>
  );
}
