import { useState, useEffect, useRef, useCallback } from 'react';
import { featureFlags } from '../../config/featureFlags';
import { getFeedsAdapter } from '../../api/adapters/feedsAdapter';
import type { FeedPost, FeedResponse } from '../../api/contracts/etoro-api.types';
import './FeedsPanel.css';

export interface FeedsPanelProps {
  className?: string;
  userId?: string;
  instrumentId?: number;
}

type FeedTab = 'my-feed' | 'instrument-feed';

interface FeedState {
  posts: FeedPost[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function FeedPostItem({ post }: { post: FeedPost }) {
  return (
    <div className="feeds-panel__post">
      <div className="feeds-panel__post-header">
        <span className="feeds-panel__post-author">
          {post.author.isPopularInvestor && <span className="feeds-panel__pi-badge">★</span>}
          @{post.author.username}
          {post.author.isVerified && <span className="feeds-panel__verified">✓</span>}
        </span>
        <span className="feeds-panel__post-time">{formatTimestamp(post.createdAt)}</span>
      </div>
      <div className="feeds-panel__post-content">{post.content}</div>
      {post.instrumentSymbol && (
        <span className="feeds-panel__post-instrument">${post.instrumentSymbol}</span>
      )}
      <div className="feeds-panel__post-stats">
        <span className="feeds-panel__stat">♡ {post.likes}</span>
        <span className="feeds-panel__stat">◇ {post.comments}</span>
      </div>
    </div>
  );
}

export default function FeedsPanel({ className, userId, instrumentId }: FeedsPanelProps) {
  const isEnabled = featureFlags.FEEDS_ENABLED;
  const [activeTab, setActiveTab] = useState<FeedTab>('my-feed');
  const [feedState, setFeedState] = useState<FeedState>({
    posts: [],
    cursor: null,
    hasMore: true,
    loading: false,
    error: null,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchFeed = useCallback(async (reset: boolean = false) => {
    if (loadingRef.current) return;
    if (!reset && !feedState.hasMore) return;

    loadingRef.current = true;
    setFeedState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const adapter = getFeedsAdapter();
      const cursor = reset ? undefined : feedState.cursor ?? undefined;
      let response: FeedResponse;

      if (activeTab === 'my-feed') {
        const targetUserId = userId ?? 'me';
        response = await adapter.getUserFeed(targetUserId, { cursor, limit: 20 });
      } else {
        const targetInstrumentId = instrumentId ?? 1;
        response = await adapter.getInstrumentFeed(targetInstrumentId, { cursor, limit: 20 });
      }

      setFeedState(prev => ({
        posts: reset ? response.posts : [...prev.posts, ...response.posts],
        cursor: response.nextCursor ?? null,
        hasMore: response.hasMore,
        loading: false,
        error: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      setFeedState(prev => ({ ...prev, loading: false, error: message }));
    } finally {
      loadingRef.current = false;
    }
  }, [activeTab, userId, instrumentId, feedState.cursor, feedState.hasMore]);

  useEffect(() => {
    if (isEnabled) {
      setFeedState({
        posts: [],
        cursor: null,
        hasMore: true,
        loading: false,
        error: null,
      });
      fetchFeed(true);
    }
  }, [isEnabled, activeTab]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100;

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      fetchFeed(false);
    }
  }, [fetchFeed]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleTabChange = (tab: FeedTab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  const handleRetry = () => {
    fetchFeed(true);
  };

  if (!isEnabled) {
    return (
      <div className={`feeds-panel ${className ?? ''}`}>
        <div className="feeds-panel__header">
          <span className="feeds-panel__title">&gt; FEEDS</span>
        </div>
        <div className="feeds-panel__content feeds-panel__content--centered">
          <div className="feeds-panel__disabled">
            <span className="feeds-panel__disabled-icon">○</span>
            <span className="feeds-panel__disabled-text">
              Feeds feature is not yet enabled
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`feeds-panel ${className ?? ''}`}>
      <div className="feeds-panel__header">
        <span className="feeds-panel__title">&gt; FEEDS</span>
      </div>
      <div className="feeds-panel__tabs">
        <button
          className={`feeds-panel__tab ${activeTab === 'my-feed' ? 'feeds-panel__tab--active' : ''}`}
          onClick={() => handleTabChange('my-feed')}
        >
          MY FEED
        </button>
        <button
          className={`feeds-panel__tab ${activeTab === 'instrument-feed' ? 'feeds-panel__tab--active' : ''}`}
          onClick={() => handleTabChange('instrument-feed')}
        >
          INSTRUMENT
        </button>
      </div>
      <div
        className="feeds-panel__scroll-container"
        ref={scrollContainerRef}
      >
        {feedState.error && (
          <div className="feeds-panel__error">
            <span className="feeds-panel__error-icon">✕</span>
            <span className="feeds-panel__error-text">{feedState.error}</span>
            <button className="feeds-panel__retry-btn" onClick={handleRetry}>
              RETRY
            </button>
          </div>
        )}

        {feedState.posts.map(post => (
          <FeedPostItem key={post.postId} post={post} />
        ))}

        {feedState.loading && (
          <div className="feeds-panel__loading">
            <span className="feeds-panel__loading-spinner">◌</span>
            <span className="feeds-panel__loading-text">Loading...</span>
          </div>
        )}

        {!feedState.loading && !feedState.error && feedState.posts.length === 0 && (
          <div className="feeds-panel__empty">
            <span className="feeds-panel__empty-icon">◇</span>
            <span className="feeds-panel__empty-text">No posts yet</span>
          </div>
        )}

        {!feedState.hasMore && feedState.posts.length > 0 && (
          <div className="feeds-panel__end">
            <span className="feeds-panel__end-text">— End of feed —</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { FeedsPanel };
