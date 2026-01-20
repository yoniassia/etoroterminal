import { useState, useEffect, useMemo, useCallback } from 'react';
import { useActiveSymbol } from '../Workspace/ActiveSymbolContext';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './AssetExplorerPanel.css';

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

const PAGE_SIZE = 50;

export default function AssetExplorerPanel(_props: PanelContentProps) {
  const { setActiveSymbol } = useActiveSymbol();
  const [universe, setUniverse] = useState<UniverseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    loadUniverse().then((data) => {
      setUniverse(data);
      setLoading(false);
    });
  }, []);

  const exchanges = useMemo(() => {
    const set = new Set(universe.map((item) => item.exchange));
    return ['All', ...Array.from(set).sort()];
  }, [universe]);

  const assetTypes = useMemo(() => {
    const set = new Set(universe.map((item) => item.type));
    return ['All', ...Array.from(set).sort()];
  }, [universe]);

  const filteredItems = useMemo(() => {
    let items = universe;

    if (selectedExchange !== 'All') {
      items = items.filter((item) => item.exchange === selectedExchange);
    }

    if (selectedType !== 'All') {
      items = items.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.sym.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
      );
    }

    return items;
  }, [universe, selectedExchange, selectedType, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  
  const pagedItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const handleExchangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExchange(e.target.value);
    setCurrentPage(0);
  }, []);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setCurrentPage(0);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const handleRowClick = useCallback((item: UniverseItem) => {
    setSelectedId(item.id);
    setActiveSymbol(item.sym);
    console.log('[AssetExplorer] Selected:', item.sym, item.id);
  }, [setActiveSymbol]);

  if (loading) {
    return (
      <div className="asset-explorer asset-explorer--loading">
        <div className="asset-explorer__loading-text">
          ▓▓▓ LOADING ASSET UNIVERSE ▓▓▓
        </div>
      </div>
    );
  }

  return (
    <div className="asset-explorer">
      <div className="asset-explorer__filters">
        <div className="asset-explorer__filter-row">
          <div className="asset-explorer__filter-group">
            <label>Exchange:</label>
            <select value={selectedExchange} onChange={handleExchangeChange}>
              {exchanges.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>
          <div className="asset-explorer__filter-group">
            <label>Type:</label>
            <select value={selectedType} onChange={handleTypeChange}>
              {assetTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="asset-explorer__search">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search symbol or name..."
            className="asset-explorer__search-input"
          />
        </div>
      </div>

      <div className="asset-explorer__stats">
        <span>{filteredItems.length.toLocaleString()} instruments</span>
        <span>Page {currentPage + 1} of {Math.max(1, totalPages)}</span>
      </div>

      <div className="asset-explorer__table-header">
        <span>Symbol</span>
        <span>Name</span>
        <span>Type</span>
        <span>Exchange</span>
      </div>

      <div className="asset-explorer__list">
        {pagedItems.length === 0 ? (
          <div className="asset-explorer__empty">
            No instruments match your filters
          </div>
        ) : (
          pagedItems.map((item) => (
            <div 
              key={item.id} 
              className={`asset-explorer__row ${selectedId === item.id ? 'asset-explorer__row--selected' : ''}`}
              onClick={() => handleRowClick(item)}
            >
              <span className="asset-explorer__cell asset-explorer__cell--symbol">
                {item.sym}
              </span>
              <span className="asset-explorer__cell asset-explorer__cell--name">
                {item.name}
              </span>
              <span className="asset-explorer__cell asset-explorer__cell--type">
                {item.type}
              </span>
              <span className="asset-explorer__cell asset-explorer__cell--exchange">
                {item.exchange}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="asset-explorer__pagination">
        <button
          className="asset-explorer__page-btn"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
        >
          [ ◀ PREV ]
        </button>
        <span className="asset-explorer__page-info">
          {currentPage + 1} / {Math.max(1, totalPages)}
        </span>
        <button
          className="asset-explorer__page-btn"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages - 1}
        >
          [ NEXT ▶ ]
        </button>
      </div>
    </div>
  );
}

export { AssetExplorerPanel };
