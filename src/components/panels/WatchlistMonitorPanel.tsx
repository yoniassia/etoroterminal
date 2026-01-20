// Standalone Watchlist Monitor Panel
// Fetches the default watchlist and displays streaming quotes

import { useState, useEffect, useCallback } from 'react';
import WatchlistMonitor from './WatchlistMonitor';
import { getWatchlistsAdapter } from '../../api/adapters/watchlistsAdapter';
import { streamingService } from '../../services/streamingService';
import { quotesPollingService } from '../../services/quotesPollingService';
import { symbolResolver } from '../../services/symbolResolver';
import type { Watchlist, WatchlistItem } from '../../api/contracts/etoro-api.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './WatchlistMonitor.css';

// Popular instrument symbols - IDs will be resolved dynamically
const POPULAR_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'BTC', 'ETH', 'SPY'];

// Fallback with known eToro instrument IDs (based on docs example AAPL -> 1001)
const FALLBACK_INSTRUMENTS: WatchlistItem[] = [
  { instrumentId: 1001, symbol: 'AAPL', displayName: 'Apple Inc.', order: 0 },
  { instrumentId: 1002, symbol: 'GOOGL', displayName: 'Alphabet Inc.', order: 1 },
  { instrumentId: 1004, symbol: 'MSFT', displayName: 'Microsoft Corporation', order: 2 },
  { instrumentId: 1005, symbol: 'TSLA', displayName: 'Tesla Inc.', order: 3 },
  { instrumentId: 1006, symbol: 'AMZN', displayName: 'Amazon.com Inc.', order: 4 },
  { instrumentId: 100000, symbol: 'BTC', displayName: 'Bitcoin', order: 5 },
  { instrumentId: 100001, symbol: 'ETH', displayName: 'Ethereum', order: 6 },
  { instrumentId: 2000, symbol: 'SPY', displayName: 'SPDR S&P 500 ETF', order: 7 },
];

export default function WatchlistMonitorPanel(_props: PanelContentProps) {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [popularInstruments, setPopularInstruments] = useState<WatchlistItem[]>(FALLBACK_INSTRUMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch popular instrument IDs from API on mount
  useEffect(() => {
    const fetchPopularIds = async () => {
      try {
        const resolved: WatchlistItem[] = [];
        
        for (let i = 0; i < POPULAR_SYMBOLS.length; i++) {
          const symbol = POPULAR_SYMBOLS[i];
          const result = await symbolResolver.resolveSymbol(symbol);
          if (result) {
            resolved.push({
              instrumentId: result.instrumentId,
              symbol: result.symbol,
              displayName: result.displayName,
              order: i,
            });
          }
        }
        
        if (resolved.length > 0) {
          console.log('[WatchlistMonitor] Resolved popular instruments:', resolved);
          setPopularInstruments(resolved);
          // Start polling quotes for resolved instruments immediately
          resolved.forEach(item => {
            quotesPollingService.subscribe(item.instrumentId);
          });
        } else {
          // Use fallback and start polling for those
          console.log('[WatchlistMonitor] Using fallback instruments, starting polling');
          FALLBACK_INSTRUMENTS.forEach(item => {
            quotesPollingService.subscribe(item.instrumentId);
          });
        }
      } catch (err) {
        console.warn('[WatchlistMonitor] Using fallback instruments:', err);
        // Start polling for fallback instruments
        FALLBACK_INSTRUMENTS.forEach(item => {
          quotesPollingService.subscribe(item.instrumentId);
        });
      }
    };
    
    fetchPopularIds();
    
    // Cleanup on unmount
    return () => {
      // Unsubscribe from all
      FALLBACK_INSTRUMENTS.forEach(item => {
        quotesPollingService.unsubscribe(item.instrumentId);
      });
    };
  }, []);

  const fetchWatchlists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const adapter = getWatchlistsAdapter();
      const data = await adapter.getWatchlists();
      console.log('[WatchlistMonitor] Fetched watchlists:', data);
      setWatchlists(data);

      // Use the default watchlist or the first one with items
      const defaultList = data.find((w) => w.isDefault && w.items.length > 0) 
        || data.find((w) => w.items.length > 0)
        || data[0];
      if (defaultList && defaultList.items.length > 0) {
        console.log('[WatchlistMonitor] Using watchlist:', defaultList.name, 'with', defaultList.items.length, 'items');
        setWatchlist(defaultList);
        
        // Subscribe to quotes for all items in the watchlist
        defaultList.items.forEach(item => {
          if (item.instrumentId > 0) {
            quotesPollingService.subscribe(item.instrumentId);
          }
        });
      } else {
        // No watchlist with items, will show popular instruments
        setWatchlist(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch watchlists';
      console.warn('[WatchlistMonitor] Watchlist fetch failed, showing popular:', message);
      setError(null); // Clear error to show popular instruments instead
      setWatchlist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const handleWsSubscribe = useCallback((topic: string) => {
    // Extract instrumentId from topic like "quotes.1234"
    const match = topic.match(/quotes\.(\d+)/);
    if (match) {
      const instrumentId = parseInt(match[1], 10);
      // Subscribe via WebSocket
      streamingService.subscribeToInstrument(instrumentId);
      // Also subscribe via REST polling as fallback
      quotesPollingService.subscribe(instrumentId);
    }
  }, []);

  const handleWsUnsubscribe = useCallback((topic: string) => {
    const match = topic.match(/quotes\.(\d+)/);
    if (match) {
      const instrumentId = parseInt(match[1], 10);
      streamingService.unsubscribeFromInstrument(instrumentId);
      quotesPollingService.unsubscribe(instrumentId);
    }
  }, []);

  const handleSelectWatchlist = useCallback((wl: Watchlist) => {
    setWatchlist(wl);
  }, []);

  const handleAddItem = useCallback(async (instrumentId: number, symbol: string, displayName: string) => {
    if (!watchlist) return;

    try {
      const adapter = getWatchlistsAdapter();
      await adapter.addToWatchlist(watchlist.watchlistId, instrumentId);
      
      // Update local state
      const newItem: WatchlistItem = {
        instrumentId,
        symbol,
        displayName,
        order: watchlist.items.length,
      };
      setWatchlist((prev) => prev ? {
        ...prev,
        items: [...prev.items, newItem],
      } : null);
      
      // Subscribe to quotes for the new instrument
      quotesPollingService.subscribe(instrumentId);
    } catch (err) {
      console.error('Failed to add item to watchlist:', err);
    }
  }, [watchlist]);

  const handleRemoveItem = useCallback(async (instrumentId: number) => {
    if (!watchlist) return;

    try {
      const adapter = getWatchlistsAdapter();
      await adapter.removeFromWatchlist(watchlist.watchlistId, instrumentId);
      
      // Update local state
      setWatchlist((prev) => prev ? {
        ...prev,
        items: prev.items.filter((item) => item.instrumentId !== instrumentId),
      } : null);
    } catch (err) {
      console.error('Failed to remove item from watchlist:', err);
    }
  }, [watchlist]);

  if (loading) {
    return (
      <div className="watchlist-monitor watchlist-monitor--loading">
        <div className="watchlist-monitor__loading-text">
          ▓▓▓ LOADING WATCHLIST ▓▓▓
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watchlist-monitor watchlist-monitor--error">
        <div className="watchlist-monitor__error-text">✗ {error}</div>
        <button className="watchlist-monitor__retry-btn" onClick={fetchWatchlists}>
          [ RETRY ]
        </button>
      </div>
    );
  }

  if (!watchlist || watchlist.items.length === 0) {
    return (
      <div className="watchlist-monitor-panel">
        <div className="watchlist-monitor-panel__popular-header">
          ▶ POPULAR INSTRUMENTS (Live Quotes)
        </div>
        <WatchlistMonitor
          items={popularInstruments}
          title="Popular Instruments"
          wsSubscribe={handleWsSubscribe}
          wsUnsubscribe={handleWsUnsubscribe}
        />
      </div>
    );
  }

  return (
    <div className="watchlist-monitor-panel">
      {watchlists.length > 1 && (
        <div className="watchlist-monitor-panel__selector">
          <select
            value={watchlist.watchlistId}
            onChange={(e) => {
              const selected = watchlists.find((w) => w.watchlistId === e.target.value);
              if (selected) handleSelectWatchlist(selected);
            }}
          >
            {watchlists.map((wl) => (
              <option key={wl.watchlistId} value={wl.watchlistId}>
                {wl.name} ({wl.items.length})
              </option>
            ))}
          </select>
        </div>
      )}
      <WatchlistMonitor
        items={watchlist.items}
        title={watchlist.name}
        watchlistId={watchlist.watchlistId}
        wsSubscribe={handleWsSubscribe}
        wsUnsubscribe={handleWsUnsubscribe}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}

export { WatchlistMonitorPanel };
