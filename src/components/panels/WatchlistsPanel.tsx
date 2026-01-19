import { useState, useEffect, useCallback } from 'react';
import { getWatchlistsAdapter } from '../../api/adapters/watchlistsAdapter';
import type { Watchlist } from '../../api/contracts/etoro-api.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './WatchlistsPanel.css';

interface WatchlistsPanelProps extends PanelContentProps {
  onSelectWatchlist?: (watchlist: Watchlist) => void;
}

export default function WatchlistsPanel({ onSelectWatchlist }: WatchlistsPanelProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultWatchlistId, setDefaultWatchlistId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Watchlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWatchlists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const adapter = getWatchlistsAdapter();
      const data = await adapter.getWatchlists();
      setWatchlists(data);

      const defaultList = data.find((w) => w.isDefault);
      if (defaultList) {
        setDefaultWatchlistId(defaultList.watchlistId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch watchlists';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const handleSetDefault = useCallback((watchlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultWatchlistId(watchlistId);
    setWatchlists((prev) =>
      prev.map((w) => ({
        ...w,
        isDefault: w.watchlistId === watchlistId,
      }))
    );
    localStorage.setItem('defaultWatchlistId', watchlistId);
  }, []);

  useEffect(() => {
    const savedDefault = localStorage.getItem('defaultWatchlistId');
    if (savedDefault) {
      setDefaultWatchlistId(savedDefault);
    }
  }, []);

  const handleCreateWatchlist = useCallback(async () => {
    if (!newWatchlistName.trim()) return;
    setCreating(true);
    try {
      const adapter = getWatchlistsAdapter();
      const newWatchlist = await adapter.createWatchlist(newWatchlistName.trim());
      setWatchlists((prev) => [...prev, newWatchlist]);
      setNewWatchlistName('');
      setShowCreateDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create watchlist';
      setError(message);
    } finally {
      setCreating(false);
    }
  }, [newWatchlistName]);

  const handleDeleteWatchlist = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const targetId = deleteTarget.watchlistId;
    setWatchlists((prev) => prev.filter((w) => w.watchlistId !== targetId));
    try {
      const adapter = getWatchlistsAdapter();
      await adapter.deleteWatchlist(targetId);
      setDeleteTarget(null);
    } catch (err) {
      await fetchWatchlists();
      const message = err instanceof Error ? err.message : 'Failed to delete watchlist';
      setError(message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchWatchlists]);

  const handleSelectWatchlist = useCallback(
    (watchlist: Watchlist) => {
      if (onSelectWatchlist) {
        onSelectWatchlist(watchlist);
      }
    },
    [onSelectWatchlist]
  );

  if (loading) {
    return (
      <div className="watchlists-panel">
        <div className="watchlists-panel__loading">
          ▓▓▓ LOADING WATCHLISTS ▓▓▓
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watchlists-panel">
        <div className="watchlists-panel__error">✗ ERROR: {error}</div>
        <button className="watchlists-panel__refresh" onClick={fetchWatchlists}>
          [ RETRY ]
        </button>
      </div>
    );
  }

  const renderCreateDialog = () => (
    <div className="watchlists-panel__overlay" role="presentation">
      <div 
        className="watchlists-panel__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-dialog-title"
      >
        <div className="watchlists-panel__dialog-header" id="create-dialog-title">+ NEW WATCHLIST</div>
        <div className="watchlists-panel__dialog-body">
          <label className="watchlists-panel__dialog-label" htmlFor="new-watchlist-name">Watchlist Name:</label>
          <input
            id="new-watchlist-name"
            type="text"
            className="watchlists-panel__dialog-input"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            placeholder="Enter watchlist name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateWatchlist();
              if (e.key === 'Escape') setShowCreateDialog(false);
            }}
          />
        </div>
        <div className="watchlists-panel__dialog-actions">
          <button
            className="watchlists-panel__dialog-btn watchlists-panel__dialog-btn--primary"
            onClick={handleCreateWatchlist}
            disabled={creating || !newWatchlistName.trim()}
          >
            {creating ? 'CREATING...' : 'CREATE'}
          </button>
          <button
            className="watchlists-panel__dialog-btn watchlists-panel__dialog-btn--cancel"
            onClick={() => {
              setShowCreateDialog(false);
              setNewWatchlistName('');
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );

  const renderDeleteDialog = () => (
    <div className="watchlists-panel__overlay" role="presentation">
      <div 
        className="watchlists-panel__dialog watchlists-panel__dialog--danger"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className="watchlists-panel__dialog-header watchlists-panel__dialog-header--danger" id="delete-dialog-title">
          ⚠ DELETE WATCHLIST
        </div>
        <div className="watchlists-panel__dialog-body" id="delete-dialog-desc">
          <p>Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?</p>
          <p className="watchlists-panel__dialog-warning">This action cannot be undone.</p>
        </div>
        <div className="watchlists-panel__dialog-actions">
          <button
            className="watchlists-panel__dialog-btn watchlists-panel__dialog-btn--danger"
            onClick={handleDeleteWatchlist}
            disabled={deleting}
          >
            {deleting ? 'DELETING...' : 'DELETE'}
          </button>
          <button
            className="watchlists-panel__dialog-btn watchlists-panel__dialog-btn--cancel"
            onClick={() => setDeleteTarget(null)}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );

  if (watchlists.length === 0) {
    return (
      <div className="watchlists-panel">
        <div className="watchlists-panel__header">
          <span className="watchlists-panel__title">&gt; WATCHLISTS (0)</span>
          <button
            className="watchlists-panel__btn-new"
            onClick={() => setShowCreateDialog(true)}
          >
            [ + NEW ]
          </button>
        </div>
        <div className="watchlists-panel__empty">
          <div className="watchlists-panel__empty-icon">☐</div>
          <div>No watchlists found</div>
        </div>
        {showCreateDialog && renderCreateDialog()}
      </div>
    );
  }

  return (
    <div className="watchlists-panel" role="region" aria-label="Watchlists">
      <div className="watchlists-panel__header">
        <h2 className="watchlists-panel__title" id="watchlists-title">
          &gt; WATCHLISTS ({watchlists.length})
        </h2>
        <div className="watchlists-panel__header-actions">
          <button
            className="watchlists-panel__btn-new"
            onClick={() => setShowCreateDialog(true)}
            aria-label="Create new watchlist"
          >
            [ + NEW ]
          </button>
          <button
            className="watchlists-panel__refresh"
            onClick={fetchWatchlists}
            disabled={loading}
            aria-label={loading ? 'Loading watchlists' : 'Refresh watchlists'}
          >
            [ ↻ ]
          </button>
        </div>
      </div>
      <div className="watchlists-panel__list" role="list" aria-label="Watchlists">
        {watchlists.map((watchlist) => {
          const isDefault = watchlist.watchlistId === defaultWatchlistId;
          return (
            <div
              key={watchlist.watchlistId}
              className={`watchlists-panel__item ${isDefault ? 'watchlists-panel__item--default' : ''}`}
              onClick={() => handleSelectWatchlist(watchlist)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectWatchlist(watchlist);
                }
              }}
              aria-label={`${watchlist.name}, ${watchlist.items.length} items${isDefault ? ', default' : ''}`}
            >
              <button
                className={`watchlists-panel__star ${isDefault ? 'watchlists-panel__star--active' : ''}`}
                onClick={(e) => handleSetDefault(watchlist.watchlistId, e)}
                aria-label={isDefault ? 'Default watchlist' : `Set ${watchlist.name} as default`}
                aria-pressed={isDefault}
              >
                {isDefault ? '★' : '☆'}
              </button>
              <div className="watchlists-panel__info">
                <span className="watchlists-panel__name">{watchlist.name}</span>
                <span className="watchlists-panel__count">
                  {watchlist.items.length} {watchlist.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                className="watchlists-panel__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(watchlist);
                }}
                aria-label={`Delete ${watchlist.name}`}
              >
                ✕
              </button>
              <span className="watchlists-panel__arrow" aria-hidden="true">&gt;</span>
            </div>
          );
        })}
      </div>
      {showCreateDialog && renderCreateDialog()}
      {deleteTarget && renderDeleteDialog()}
    </div>
  );
}

export { WatchlistsPanel };
