import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { WatchlistItem } from '../../api/contracts/etoro-api.types';
import { quotesStore, StoredQuote } from '../../stores/quotesStore';
import { quotesPollingService } from '../../services/quotesPollingService';
import { WS_TOPICS } from '../../api/contracts/endpoints';
import AddToWatchlistDialog from './AddToWatchlistDialog';
import './WatchlistMonitor.css';

const ROW_HEIGHT = 32;
const OVERSCAN = 5;

export interface WatchlistMonitorProps {
  items: WatchlistItem[];
  title?: string;
  watchlistId?: string;
  onSelectSymbol?: (symbol: string, instrumentId: number) => void;
  selectedInstrumentId?: number;
  wsSubscribe?: (topic: string) => void;
  wsUnsubscribe?: (topic: string) => void;
  onAddItem?: (instrumentId: number, symbol: string, displayName: string) => void;
  onRemoveItem?: (instrumentId: number) => void;
}

interface RowQuote {
  bid: number;
  ask: number;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume?: number;
  isStale: boolean;
  flashDirection?: 'up' | 'down' | null;
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
  return `${sign}${changePercent.toFixed(2)}%`;
}

function formatVolume(volume?: number): string {
  if (volume === undefined || volume === 0) return '--';
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

export default function WatchlistMonitor({
  items,
  title = 'WATCHLIST',
  watchlistId,
  onSelectSymbol,
  selectedInstrumentId,
  wsSubscribe,
  wsUnsubscribe,
  onAddItem,
  onRemoveItem,
}: WatchlistMonitorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const [quotes, setQuotes] = useState<Map<number, RowQuote>>(new Map());
  const subscribedIdsRef = useRef<Set<number>>(new Set());
  const flashTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const totalHeight = items.length * ROW_HEIGHT;

  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT);
    const end = Math.min(items.length - 1, start + visibleCount + OVERSCAN * 2);
    
    return {
      startIndex: start,
      visibleItems: items.slice(start, end + 1).map((item, idx) => ({
        ...item,
        virtualIndex: start + idx,
      })),
    };
  }, [items, scrollTop, viewportHeight]);

  const visibleInstrumentIds = useMemo(() => {
    return new Set(visibleItems.map((item) => item.instrumentId));
  }, [visibleItems]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(viewport);
    setViewportHeight(viewport.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    const currentSubscribed = subscribedIdsRef.current;
    const toSubscribe: number[] = [];
    const toUnsubscribe: number[] = [];

    visibleInstrumentIds.forEach((id) => {
      if (!currentSubscribed.has(id)) {
        toSubscribe.push(id);
      }
    });

    currentSubscribed.forEach((id) => {
      if (!visibleInstrumentIds.has(id)) {
        toUnsubscribe.push(id);
      }
    });

    if (toUnsubscribe.length > 0) {
      toUnsubscribe.forEach((id) => {
        if (wsUnsubscribe) {
          wsUnsubscribe(WS_TOPICS.QUOTES_INSTRUMENT(id));
        }
        quotesPollingService.unsubscribe(id);
        currentSubscribed.delete(id);
      });
    }

    if (toSubscribe.length > 0) {
      toSubscribe.forEach((id) => {
        if (wsSubscribe) {
          wsSubscribe(WS_TOPICS.QUOTES_INSTRUMENT(id));
        }
        quotesPollingService.subscribe(id);
        currentSubscribed.add(id);
      });
    }
  }, [visibleInstrumentIds, wsSubscribe, wsUnsubscribe]);

  useEffect(() => {
    return () => {
      subscribedIdsRef.current.forEach((id) => {
        if (wsUnsubscribe) {
          wsUnsubscribe(WS_TOPICS.QUOTES_INSTRUMENT(id));
        }
        quotesPollingService.unsubscribe(id);
      });
      subscribedIdsRef.current.clear();
      flashTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      flashTimeoutsRef.current.clear();
    };
  }, [wsUnsubscribe]);

  const handleQuoteUpdate = useCallback((instrumentId: number, storedQuote: StoredQuote) => {
    setQuotes((prev) => {
      const existing = prev.get(instrumentId);
      const priceChanged = existing && existing.lastPrice !== storedQuote.lastPrice;
      const flashDirection = priceChanged
        ? storedQuote.lastPrice > existing.lastPrice
          ? 'up'
          : 'down'
        : null;

      const newQuotes = new Map(prev);
      newQuotes.set(instrumentId, {
        bid: storedQuote.bid,
        ask: storedQuote.ask,
        lastPrice: storedQuote.lastPrice,
        change: storedQuote.change ?? 0,
        changePercent: storedQuote.changePercent ?? 0,
        isStale: quotesStore.isStale(instrumentId),
        flashDirection,
      });

      if (flashDirection) {
        const existingTimeout = flashTimeoutsRef.current.get(instrumentId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
          setQuotes((q) => {
            const quote = q.get(instrumentId);
            if (quote) {
              const updated = new Map(q);
              updated.set(instrumentId, { ...quote, flashDirection: null });
              return updated;
            }
            return q;
          });
          flashTimeoutsRef.current.delete(instrumentId);
        }, 300);
        flashTimeoutsRef.current.set(instrumentId, timeout);
      }

      return newQuotes;
    });
  }, []);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    visibleItems.forEach((item) => {
      const existingQuote = quotesStore.getQuote(item.instrumentId);
      if (existingQuote) {
        handleQuoteUpdate(item.instrumentId, existingQuote);
      }

      const unsubscribe = quotesStore.subscribe(item.instrumentId, (quote) => {
        handleQuoteUpdate(item.instrumentId, quote);
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [visibleItems, handleQuoteUpdate]);

  const handleRowClick = useCallback(
    (item: WatchlistItem) => {
      if (onSelectSymbol) {
        onSelectSymbol(item.symbol, item.instrumentId);
      }
    },
    [onSelectSymbol]
  );

  const handleRemoveItem = useCallback(
    (e: React.MouseEvent, instrumentId: number) => {
      e.stopPropagation();
      if (onRemoveItem && !removingIds.has(instrumentId)) {
        setRemovingIds((prev) => new Set(prev).add(instrumentId));
        onRemoveItem(instrumentId);
      }
    },
    [onRemoveItem, removingIds]
  );

  const handleAddSymbol = useCallback(
    (instrumentId: number, symbol: string, displayName: string) => {
      if (onAddItem) {
        onAddItem(instrumentId, symbol, displayName);
      }
      setShowAddDialog(false);
    },
    [onAddItem]
  );

  const existingInstrumentIds = useMemo(() => {
    return new Set(items.map((item) => item.instrumentId));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="watchlist-monitor">
        <div className="watchlist-monitor__header">
          <span className="watchlist-monitor__title">&gt; {title}</span>
          {onAddItem && watchlistId && (
            <button
              className="watchlist-monitor__add-btn"
              onClick={() => setShowAddDialog(true)}
            >
              [ + ADD ]
            </button>
          )}
        </div>
        <div className="watchlist-monitor__empty">
          <div>No instruments in watchlist</div>
          {onAddItem && watchlistId && (
            <button
              className="watchlist-monitor__add-btn watchlist-monitor__add-btn--large"
              onClick={() => setShowAddDialog(true)}
            >
              [ + ADD SYMBOL ]
            </button>
          )}
        </div>
        {showAddDialog && watchlistId && (
          <AddToWatchlistDialog
            watchlistId={watchlistId}
            existingInstrumentIds={existingInstrumentIds}
            onAdd={handleAddSymbol}
            onClose={() => setShowAddDialog(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="watchlist-monitor">
      <div className="watchlist-monitor__header">
        <span className="watchlist-monitor__title">
          &gt; {title} ({items.length})
        </span>
        <div className="watchlist-monitor__header-actions">
          {onAddItem && watchlistId && (
            <button
              className="watchlist-monitor__add-btn"
              onClick={() => setShowAddDialog(true)}
            >
              [ + ADD ]
            </button>
          )}
          <div className="watchlist-monitor__stats">
            <span>Visible: {visibleItems.length}</span>
            <span>Subscribed: {subscribedIdsRef.current.size}</span>
          </div>
        </div>
      </div>

      <div className="watchlist-monitor__table-header">
        <span>Symbol</span>
        <span>Last</span>
        <span>Change</span>
        <span>Bid</span>
        <span>Ask</span>
        <span>Volume</span>
        {onRemoveItem && <span></span>}
      </div>

      <div
        ref={viewportRef}
        className="watchlist-monitor__viewport"
        onScroll={handleScroll}
      >
        <div
          className="watchlist-monitor__scroll-content"
          style={{ height: totalHeight }}
        >
          <div
            className="watchlist-monitor__rows-container"
            style={{ top: startIndex * ROW_HEIGHT }}
          >
            {visibleItems.map((item) => {
              const quote = quotes.get(item.instrumentId);
              const isSelected = item.instrumentId === selectedInstrumentId;
              const isRemoving = removingIds.has(item.instrumentId);
              const changeClass = quote
                ? quote.change > 0
                  ? 'positive'
                  : quote.change < 0
                  ? 'negative'
                  : 'neutral'
                : 'neutral';

              let rowClass = 'watchlist-monitor__row';
              if (isSelected) rowClass += ' watchlist-monitor__row--selected';
              if (quote?.isStale) rowClass += ' watchlist-monitor__row--stale';
              if (quote?.flashDirection === 'up') rowClass += ' watchlist-monitor__flash';
              if (quote?.flashDirection === 'down') rowClass += ' watchlist-monitor__flash--down';
              if (isRemoving) rowClass += ' watchlist-monitor__row--removing';

              return (
                <div
                  key={item.instrumentId}
                  className={rowClass}
                  onClick={() => handleRowClick(item)}
                >
                  <span className="watchlist-monitor__cell watchlist-monitor__cell--symbol">
                    {item.symbol}
                  </span>
                  <span className="watchlist-monitor__cell watchlist-monitor__cell--price">
                    {quote ? formatPrice(quote.lastPrice) : '--'}
                  </span>
                  <span className={`watchlist-monitor__cell watchlist-monitor__cell--change ${changeClass}`}>
                    {quote ? formatChange(quote.change, quote.changePercent) : '--'}
                  </span>
                  <span className="watchlist-monitor__cell watchlist-monitor__cell--bid">
                    {quote ? formatPrice(quote.bid) : '--'}
                  </span>
                  <span className="watchlist-monitor__cell watchlist-monitor__cell--ask">
                    {quote ? formatPrice(quote.ask) : '--'}
                  </span>
                  <span className="watchlist-monitor__cell watchlist-monitor__cell--volume">
                    {formatVolume(quote?.volume)}
                  </span>
                  {onRemoveItem && (
                    <button
                      className="watchlist-monitor__remove-btn"
                      onClick={(e) => handleRemoveItem(e, item.instrumentId)}
                      disabled={isRemoving}
                      title="Remove from watchlist"
                    >
                      {isRemoving ? '...' : '✕'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showAddDialog && watchlistId && (
        <AddToWatchlistDialog
          watchlistId={watchlistId}
          existingInstrumentIds={existingInstrumentIds}
          onAdd={handleAddSymbol}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}

export { WatchlistMonitor };
