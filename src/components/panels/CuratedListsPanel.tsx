import { useState, useEffect, useCallback } from 'react';
import { getDefaultCuratedListsAdapter } from '../../api/adapters/curatedListsAdapter';
import type { CuratedList, CuratedListItem } from '../../api/contracts/etoro-api.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './CuratedListsPanel.css';

export interface CuratedListsPanelProps extends PanelContentProps {
  onInstrumentSelect?: (instrumentId: number, symbol: string) => void;
}

export default function CuratedListsPanel({ onInstrumentSelect }: CuratedListsPanelProps = { panelId: '' }) {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const adapter = getDefaultCuratedListsAdapter();
      const data = await adapter.getCuratedLists();
      setLists(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch curated lists';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleListClick = (listId: string) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  const handleInstrumentClick = (item: CuratedListItem) => {
    if (onInstrumentSelect) {
      onInstrumentSelect(item.instrumentId, item.symbol);
    }
  };

  if (loading) {
    return (
      <div className="curated-lists-panel">
        <div className="curated-lists-loading">
          ▓▓▓ LOADING CURATED LISTS ▓▓▓
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="curated-lists-panel">
        <div className="curated-lists-error">
          ✗ ERROR: {error}
          <br />
          <button className="curated-lists-retry" onClick={fetchLists}>
            [ RETRY ]
          </button>
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="curated-lists-panel">
        <div className="curated-lists-empty">
          No curated lists available
        </div>
      </div>
    );
  }

  return (
    <div className="curated-lists-panel">
      {lists.map((list) => {
        const isExpanded = expandedListId === list.listId;
        return (
          <div key={list.listId} className="curated-list-item">
            <div
              className="curated-list-header"
              onClick={() => handleListClick(list.listId)}
            >
              <div className="curated-list-info">
                <div className="curated-list-name">{list.name}</div>
                <div className="curated-list-meta">
                  {list.category && (
                    <span className="curated-list-category">{list.category}</span>
                  )}
                  <span className="curated-list-count">
                    {list.itemCount} instrument{list.itemCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="curated-list-toggle">
                {isExpanded ? '[-]' : '[+]'}
              </div>
            </div>

            {list.description && (
              <div className="curated-list-description">
                {list.description}
              </div>
            )}

            {isExpanded && (
              <div className="curated-list-contents">
                <div className="curated-list-contents-header">
                  ═══ LIST CONTENTS ═══
                </div>
                {list.items.length > 0 ? (
                  <div className="curated-list-instruments">
                    {list.items.map((item) => (
                      <div
                        key={item.instrumentId}
                        className="curated-list-instrument"
                        onClick={() => handleInstrumentClick(item)}
                        style={{ cursor: onInstrumentSelect ? 'pointer' : 'default' }}
                      >
                        <div>
                          <span className="instrument-symbol">{item.symbol}</span>
                          <span className="instrument-name">{item.displayName}</span>
                        </div>
                        {item.weight !== undefined && (
                          <span className="instrument-weight">
                            {(item.weight * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="curated-list-no-items">
                    No instruments in this list
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
