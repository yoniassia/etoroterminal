import { useState, useCallback, useEffect, useRef } from 'react';
import { ENDPOINTS } from '../../api/contracts/endpoints';
import { getDefaultAdapter } from '../../api/restAdapter';
import './AddToWatchlistDialog.css';

interface SearchResult {
  instrumentId: number;
  symbol: string;
  displayName: string;
  type: string;
}

interface AddToWatchlistDialogProps {
  watchlistId: string;
  existingInstrumentIds: Set<number>;
  onAdd: (instrumentId: number, symbol: string, displayName: string) => void;
  onClose: () => void;
}

export default function AddToWatchlistDialog({
  existingInstrumentIds,
  onAdd,
  onClose,
}: AddToWatchlistDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchInstruments = useCallback(async (query: string) => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adapter = getDefaultAdapter();
      // API uses internalSymbolFull parameter for symbol search
      const response = await adapter.get<Record<string, unknown> | Record<string, unknown>[]>(
        `${ENDPOINTS.INSTRUMENTS_SEARCH}?internalSymbolFull=${encodeURIComponent(query.toUpperCase())}`
      );
      
      // Handle both array and object response formats - API returns 'items' key
      const rawData = response as Record<string, unknown>;
      const rawInstruments = Array.isArray(response) 
        ? response as Record<string, unknown>[]
        : (rawData.items ?? rawData.Items ?? rawData.instruments ?? rawData.Instruments ?? []) as Record<string, unknown>[];
      
      const filteredResults = rawInstruments
        .map((inst) => ({
          instrumentId: (inst.instrumentId ?? inst.InstrumentId ?? inst.InstrumentID ?? 0) as number,
          symbol: String(inst.internalSymbolFull ?? inst.InternalSymbolFull ?? inst.symbol ?? inst.Symbol ?? ''),
          displayName: String(inst.instrumentDisplayName ?? inst.InstrumentDisplayName ?? inst.displayName ?? inst.DisplayName ?? inst.name ?? inst.Name ?? ''),
          type: String(inst.instrumentTypeId ?? inst.InstrumentTypeId ?? inst.type ?? inst.Type ?? 'stock'),
        }))
        .filter((inst) => inst.instrumentId > 0 && !existingInstrumentIds.has(inst.instrumentId))
        .slice(0, 20);

      setResults(filteredResults);
      setSelectedIndex(filteredResults.length > 0 ? 0 : -1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [existingInstrumentIds]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchInstruments(value);
      }, 300);
    },
    [searchInstruments]
  );

  const handleAddInstrument = useCallback(
    async (result: SearchResult) => {
      setAdding(true);
      try {
        onAdd(result.instrumentId, result.symbol, result.displayName);
      } finally {
        setAdding(false);
      }
    },
    [onAdd]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleAddInstrument(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, handleAddInstrument, onClose]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className="add-watchlist-dialog__overlay" onClick={handleOverlayClick} role="presentation">
      <div 
        className="add-watchlist-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-dialog-title"
      >
        <div className="add-watchlist-dialog__header">
          <span className="add-watchlist-dialog__title" id="add-dialog-title">+ ADD SYMBOL TO WATCHLIST</span>
          <button
            className="add-watchlist-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="add-watchlist-dialog__body">
          <div className="add-watchlist-dialog__search">
            <input
              ref={inputRef}
              type="text"
              className="add-watchlist-dialog__input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by symbol or name..."
              autoComplete="off"
              spellCheck={false}
              aria-label="Search instruments"
              aria-autocomplete="list"
              aria-controls="instrument-results"
              aria-activedescendant={selectedIndex >= 0 ? `result-${results[selectedIndex]?.instrumentId}` : undefined}
            />
            {loading && <span className="add-watchlist-dialog__spinner" aria-hidden="true">▓</span>}
          </div>

          {error && (
            <div className="add-watchlist-dialog__error" role="alert">✕ {error}</div>
          )}

          <div className="add-watchlist-dialog__results" id="instrument-results" role="listbox" aria-label="Search results">
            {results.length === 0 && searchQuery.length > 0 && !loading && (
              <div className="add-watchlist-dialog__empty" role="status">
                No instruments found matching "{searchQuery}"
              </div>
            )}

            {results.map((result, index) => (
              <div
                key={result.instrumentId}
                id={`result-${result.instrumentId}`}
                className={`add-watchlist-dialog__result ${
                  index === selectedIndex ? 'add-watchlist-dialog__result--selected' : ''
                }`}
                onClick={() => handleAddInstrument(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={index === selectedIndex}
                tabIndex={-1}
              >
                <div className="add-watchlist-dialog__result-main">
                  <span className="add-watchlist-dialog__result-symbol">
                    {result.symbol}
                  </span>
                  <span className="add-watchlist-dialog__result-name">
                    {result.displayName}
                  </span>
                </div>
                <span className="add-watchlist-dialog__result-type">
                  {result.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="add-watchlist-dialog__footer">
          <span className="add-watchlist-dialog__hint">
            ↑↓ Navigate • Enter Select • Esc Cancel
          </span>
          <button
            className="add-watchlist-dialog__btn add-watchlist-dialog__btn--cancel"
            onClick={onClose}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
