import { useState, useEffect, useCallback } from 'react';
import { getRecommendationsAdapter } from '../../api/adapters/recommendationsAdapter';
import { getWatchlistsAdapter } from '../../api/adapters/watchlistsAdapter';
import type { Recommendation, RecommendationType } from '../../api/contracts/etoro-api.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import { quotesStore, StoredQuote } from '../../stores/quotesStore';
import './RecommendationsPanel.css';

interface RecommendationWithQuote extends Recommendation {
  quote?: StoredQuote;
  isStale?: boolean;
}

function formatPrice(price: number): string {
  if (price === 0) return '--';
  return price.toFixed(4);
}

function formatChange(change: number, changePercent: number): { text: string; className: string } {
  const sign = change >= 0 ? '+' : '';
  const text = `${sign}${changePercent.toFixed(2)}%`;
  const className = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  return { text, className };
}

function formatRecommendationType(type: RecommendationType): string {
  return type.replace('_', ' ');
}

export default function RecommendationsPanel(_props: PanelContentProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToWatchlist, setAddingToWatchlist] = useState<Set<number>>(new Set());
  const [addedToWatchlist, setAddedToWatchlist] = useState<Set<number>>(new Set());

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const adapter = getRecommendationsAdapter();
      const data = await adapter.getRecommendations();
      
      const withQuotes = data.map((rec) => {
        const quote = quotesStore.getQuote(rec.instrumentId);
        return {
          ...rec,
          quote,
          isStale: quote ? quotesStore.isStale(rec.instrumentId) : true,
        };
      });
      
      setRecommendations(withQuotes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    if (recommendations.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    recommendations.forEach((rec) => {
      const unsubscribe = quotesStore.subscribe(rec.instrumentId, (quote) => {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.instrumentId === quote.instrumentId
              ? { ...r, quote, isStale: false }
              : r
          )
        );
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [recommendations.length]);

  const handleAddToWatchlist = useCallback(async (instrumentId: number) => {
    if (addingToWatchlist.has(instrumentId) || addedToWatchlist.has(instrumentId)) {
      return;
    }

    setAddingToWatchlist((prev) => new Set(prev).add(instrumentId));

    try {
      const watchlistsAdapter = getWatchlistsAdapter();
      const watchlists = await watchlistsAdapter.getWatchlists();
      const defaultWatchlist = watchlists.find((w) => w.isDefault) || watchlists[0];

      if (!defaultWatchlist) {
        throw new Error('No watchlist available');
      }

      await watchlistsAdapter.addToWatchlist(defaultWatchlist.watchlistId, instrumentId);
      setAddedToWatchlist((prev) => new Set(prev).add(instrumentId));
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    } finally {
      setAddingToWatchlist((prev) => {
        const next = new Set(prev);
        next.delete(instrumentId);
        return next;
      });
    }
  }, [addingToWatchlist, addedToWatchlist]);

  if (loading) {
    return (
      <div className="recommendations-panel">
        <div className="recommendations-panel__loading">
          ▓▓▓ LOADING RECOMMENDATIONS ▓▓▓
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-panel">
        <div className="recommendations-panel__error">✗ ERROR: {error}</div>
        <button className="recommendations-panel__refresh" onClick={fetchRecommendations}>
          [ RETRY ]
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-panel">
        <div className="recommendations-panel__empty">
          <div className="recommendations-panel__empty-icon">☐</div>
          <div>No recommendations available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-panel">
      <div className="recommendations-panel__header">
        <span className="recommendations-panel__title">
          &gt; RECOMMENDATIONS ({recommendations.length})
        </span>
        <button
          className="recommendations-panel__refresh"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          [ REFRESH ]
        </button>
      </div>
      <div className="recommendations-panel__list">
        {recommendations.map((rec) => {
          const price = rec.quote?.lastPrice ?? 0;
          const change = rec.quote?.change ?? 0;
          const changePercent = rec.quote?.changePercent ?? 0;
          const changeInfo = formatChange(change, changePercent);
          const isAdding = addingToWatchlist.has(rec.instrumentId);
          const isAdded = addedToWatchlist.has(rec.instrumentId);

          return (
            <div key={rec.instrumentId} className="recommendations-panel__item">
              <div className="recommendations-panel__info">
                <span className="recommendations-panel__symbol">{rec.symbol}</span>
                <span className="recommendations-panel__name">{rec.displayName}</span>
              </div>
              <div className="recommendations-panel__price">
                <span
                  className={`recommendations-panel__price-value ${
                    rec.isStale ? 'recommendations-panel__price-value--stale' : ''
                  }`}
                >
                  {formatPrice(price)}
                </span>
                <span
                  className={`recommendations-panel__price-change recommendations-panel__price-change--${changeInfo.className}`}
                >
                  {changeInfo.text}
                </span>
              </div>
              <span
                className={`recommendations-panel__type recommendations-panel__type--${rec.recommendationType}`}
              >
                {formatRecommendationType(rec.recommendationType)}
              </span>
              <button
                className={`recommendations-panel__add-btn ${
                  isAdded ? 'recommendations-panel__add-btn--added' : ''
                }`}
                onClick={() => handleAddToWatchlist(rec.instrumentId)}
                disabled={isAdding || isAdded}
              >
                {isAdding ? '...' : isAdded ? '✓ ADDED' : '+ WATCHLIST'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { RecommendationsPanel };
