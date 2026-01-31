import { useState, useEffect, useCallback } from 'react';
import { getTradersAdapter, Trader, TraderSearchParams, RiskScore } from '../../api/adapters/tradersAdapter';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import { compareStore } from '../../stores/compareStore';
import './TraderSearchPanel.css';

type SortField = 'username' | 'gainPercent' | 'copiers' | 'riskScore';
type SortOrder = 'asc' | 'desc';

interface SortState {
  field: SortField;
  order: SortOrder;
}

export interface TraderSearchPanelProps extends PanelContentProps {
  onTraderSelect?: (userId: string, username: string) => void;
}

const PAGE_SIZE = 20;

function formatGain(gain: number): { text: string; className: string } {
  const sign = gain >= 0 ? '+' : '';
  const text = `${sign}${gain.toFixed(2)}%`;
  const className = gain > 0 ? 'positive' : gain < 0 ? 'negative' : 'neutral';
  return { text, className };
}

function formatRiskScore(score: RiskScore): { text: string; className: string } {
  const className = score <= 2 ? 'low' : score <= 4 ? 'medium' : 'high';
  return { text: score.toString(), className };
}

function formatCopiers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function TraderSearchPanel({ onTraderSelect }: TraderSearchPanelProps) {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [compareState, setCompareState] = useState({ count: 0, traders: new Set<string>() });

  // Search filters
  const [username, setUsername] = useState('');
  const [minGainPercent, setMinGainPercent] = useState<string>('');
  const [minCopiers, setMinCopiers] = useState<string>('');
  const [maxRiskScore, setMaxRiskScore] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  // Sorting
  const [sort, setSort] = useState<SortState>({ field: 'gainPercent', order: 'desc' });

  useEffect(() => {
    const updateCompareState = () => {
      const traders = compareStore.getTraders();
      setCompareState({
        count: traders.length,
        traders: new Set(traders.map((t) => t.userId)),
      });
    };
    updateCompareState();
    const unsubscribe = compareStore.subscribe(updateCompareState);
    return unsubscribe;
  }, []);

  const handleAddToCompare = useCallback((trader: Trader, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareStore.isInCompare(trader.userId)) {
      compareStore.removeTrader(trader.userId);
    } else {
      compareStore.addFromTrader(trader);
    }
  }, []);

  const searchTraders = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    setSearchExecuted(true);

    try {
      const adapter = getTradersAdapter();
      const params: TraderSearchParams = {
        page,
        pageSize: PAGE_SIZE,
        sortBy: sort.field,
        sortOrder: sort.order,
      };

      if (username.trim()) {
        params.username = username.trim();
      }
      if (minGainPercent !== '' && !isNaN(Number(minGainPercent))) {
        params.minGainPercent = Number(minGainPercent);
      }
      if (minCopiers !== '' && !isNaN(Number(minCopiers))) {
        params.minCopiers = Number(minCopiers);
      }
      if (maxRiskScore !== '' && !isNaN(Number(maxRiskScore))) {
        const risk = Number(maxRiskScore);
        if (risk >= 1 && risk <= 7) {
          params.maxRiskScore = risk as RiskScore;
        }
      }

      const response = await adapter.searchTraders(params);
      setTraders(response.traders);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalResults(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search traders';
      setError(message);
      setTraders([]);
    } finally {
      setLoading(false);
    }
  }, [username, minGainPercent, minCopiers, maxRiskScore, sort]);

  const handleSearch = () => {
    setCurrentPage(1);
    searchTraders(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSort = (field: SortField) => {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      return { field, order: 'desc' };
    });
  };

  useEffect(() => {
    if (searchExecuted) {
      searchTraders(currentPage);
    }
  }, [sort]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      searchTraders(page);
    }
  };

  const handleTraderClick = (trader: Trader) => {
    if (onTraderSelect) {
      onTraderSelect(trader.userId, trader.username);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sort.field !== field) return null;
    return sort.order === 'asc' ? ' ▲' : ' ▼';
  };

  const handleClearFilters = () => {
    setUsername('');
    setMinGainPercent('');
    setMinCopiers('');
    setMaxRiskScore('');
  };

  return (
    <div className="trader-search-panel">
      <div className="trader-search-panel__header">
        <span className="trader-search-panel__title">&gt; TRADER DISCOVERY (PI)</span>
      </div>

      <div className="trader-search-panel__filters">
        <div className="trader-search-panel__filter-row">
          <div className="trader-search-panel__filter-group trader-search-panel__filter-group--wide">
            <label className="trader-search-panel__label">USERNAME:</label>
            <input
              type="text"
              className="trader-search-panel__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by username..."
            />
          </div>
        </div>

        <div className="trader-search-panel__filter-row">
          <div className="trader-search-panel__filter-group">
            <label className="trader-search-panel__label">MIN GAIN %:</label>
            <input
              type="number"
              className="trader-search-panel__input trader-search-panel__input--small"
              value={minGainPercent}
              onChange={(e) => setMinGainPercent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
            />
          </div>

          <div className="trader-search-panel__filter-group">
            <label className="trader-search-panel__label">MIN COPIERS:</label>
            <input
              type="number"
              className="trader-search-panel__input trader-search-panel__input--small"
              value={minCopiers}
              onChange={(e) => setMinCopiers(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="trader-search-panel__filter-group">
            <label className="trader-search-panel__label">MAX RISK:</label>
            <select
              className="trader-search-panel__select"
              value={maxRiskScore}
              onChange={(e) => setMaxRiskScore(e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
            </select>
          </div>
        </div>

        <div className="trader-search-panel__actions">
          <button
            className="trader-search-panel__btn trader-search-panel__btn--primary"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? '[ SEARCHING... ]' : '[ SEARCH ]'}
          </button>
          <button
            className="trader-search-panel__btn"
            onClick={handleClearFilters}
            disabled={loading}
          >
            [ CLEAR ]
          </button>
        </div>
      </div>

      {error && (
        <div className="trader-search-panel__error">
          ✗ ERROR: {error}
        </div>
      )}

      {loading && (
        <div className="trader-search-panel__loading">
          ▓▓▓ SEARCHING TRADERS ▓▓▓
        </div>
      )}

      {!loading && searchExecuted && traders.length === 0 && !error && (
        <div className="trader-search-panel__empty">
          <div className="trader-search-panel__empty-icon">☐</div>
          <div>No traders found matching your criteria</div>
          <div className="trader-search-panel__empty-hint">
            Try adjusting your filters or search terms
          </div>
        </div>
      )}

      {!loading && !searchExecuted && (
        <div className="trader-search-panel__empty">
          <div className="trader-search-panel__empty-icon">⌕</div>
          <div>Enter search criteria and click SEARCH</div>
          <div className="trader-search-panel__empty-hint">
            Filter by username, minimum gain, copiers, or risk score
          </div>
        </div>
      )}

      {!loading && traders.length > 0 && (
        <>
          <div className="trader-search-panel__results-info">
            Showing {traders.length} of {totalResults} traders
            {totalPages > 1 && ` (Page ${currentPage}/${totalPages})`}
          </div>

          <div className="trader-search-panel__table-container">
            <table className="trader-search-panel__table">
              <thead>
                <tr>
                  <th
                    className="trader-search-panel__th trader-search-panel__th--sortable"
                    onClick={() => handleSort('username')}
                  >
                    USERNAME{renderSortIndicator('username')}
                  </th>
                  <th
                    className="trader-search-panel__th trader-search-panel__th--sortable trader-search-panel__th--right"
                    onClick={() => handleSort('gainPercent')}
                  >
                    GAIN %{renderSortIndicator('gainPercent')}
                  </th>
                  <th
                    className="trader-search-panel__th trader-search-panel__th--sortable trader-search-panel__th--right"
                    onClick={() => handleSort('copiers')}
                  >
                    COPIERS{renderSortIndicator('copiers')}
                  </th>
                  <th
                    className="trader-search-panel__th trader-search-panel__th--sortable trader-search-panel__th--center"
                    onClick={() => handleSort('riskScore')}
                  >
                    RISK{renderSortIndicator('riskScore')}
                  </th>
                  <th className="trader-search-panel__th trader-search-panel__th--center">
                    CMP
                  </th>
                </tr>
              </thead>
              <tbody>
                {traders.map((trader) => {
                  const gainInfo = formatGain(trader.gainPercent);
                  const riskInfo = formatRiskScore(trader.riskScore);

                  return (
                    <tr
                      key={trader.userId}
                      className="trader-search-panel__row"
                      onClick={() => handleTraderClick(trader)}
                    >
                      <td className="trader-search-panel__td">
                        <div className="trader-search-panel__username">
                          {trader.username}
                          {trader.isVerified && (
                            <span className="trader-search-panel__verified">✓</span>
                          )}
                        </div>
                        {trader.displayName && trader.displayName !== trader.username && (
                          <div className="trader-search-panel__display-name">
                            {trader.displayName}
                          </div>
                        )}
                      </td>
                      <td className={`trader-search-panel__td trader-search-panel__td--right trader-search-panel__gain--${gainInfo.className}`}>
                        {gainInfo.text}
                      </td>
                      <td className="trader-search-panel__td trader-search-panel__td--right">
                        {formatCopiers(trader.copiers)}
                      </td>
                      <td className="trader-search-panel__td trader-search-panel__td--center">
                        <span className={`trader-search-panel__risk trader-search-panel__risk--${riskInfo.className}`}>
                          {riskInfo.text}
                        </span>
                      </td>
                      <td className="trader-search-panel__td trader-search-panel__td--center">
                        <button
                          className={`trader-search-panel__compare-btn ${compareState.traders.has(trader.userId) ? 'trader-search-panel__compare-btn--active' : ''}`}
                          onClick={(e) => handleAddToCompare(trader, e)}
                          disabled={!compareState.traders.has(trader.userId) && compareState.count >= 5}
                          title={compareState.traders.has(trader.userId) ? 'Remove from compare' : 'Add to compare'}
                        >
                          {compareState.traders.has(trader.userId) ? '−' : '+'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="trader-search-panel__pagination">
              <button
                className="trader-search-panel__page-btn"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                [&lt;&lt;]
              </button>
              <button
                className="trader-search-panel__page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                [&lt;]
              </button>
              <span className="trader-search-panel__page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="trader-search-panel__page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                [&gt;]
              </button>
              <button
                className="trader-search-panel__page-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                [&gt;&gt;]
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { TraderSearchPanel };
