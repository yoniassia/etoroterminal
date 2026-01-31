import { useState, useEffect, useCallback, useMemo } from 'react';
import { portfolioStore, PortfolioState, AutoRefreshInterval } from '../../stores/portfolioStore';
import { ordersStore, StoredOrder } from '../../stores/ordersStore';
import { activityStore } from '../../stores/activityStore';
import { useTradingMode } from '../../contexts/TradingModeContext';
import { getPositionAdapter, ClosePositionResult } from '../../api/adapters/positionAdapter';
import type { Position } from '../../api/contracts/etoro-api.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './PortfolioPanel.css';

interface CloseConfirmation {
  position: Position;
}

interface CloseResultState {
  success: boolean;
  profit: number;
  position: Position;
}

interface PortfolioPanelProps extends PanelContentProps {
  onSelectPosition?: (position: Position) => void;
}

const INTERVAL_OPTIONS: { value: AutoRefreshInterval; label: string }[] = [
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
  { value: 300000, label: '5m' },
];

export default function PortfolioPanel({ onSelectPosition }: PortfolioPanelProps) {
  const [state, setState] = useState<PortfolioState>(portfolioStore.getState());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [closing, setClosing] = useState(false);
  const [showPartialClose, setShowPartialClose] = useState(false);
  const [partialUnits, setPartialUnits] = useState('');
  const [partialCloseError, setPartialCloseError] = useState<string | null>(null);
  const [showPartialConfirmation, setShowPartialConfirmation] = useState(false);
  const [partialCloseResult, setPartialCloseResult] = useState<ClosePositionResult | null>(null);
  const [closeConfirmation, setCloseConfirmation] = useState<CloseConfirmation | null>(null);
  const [closeResult, setCloseResult] = useState<CloseResultState | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { isDemoMode, isRealMode, mode } = useTradingMode();

  useEffect(() => {
    const unsubscribe = portfolioStore.subscribe(setState);
    portfolioStore.fetchPortfolio().catch(() => {});
    return unsubscribe;
  }, []);

  useEffect(() => {
    portfolioStore.setDemoMode(isDemoMode());
  }, [mode, isDemoMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const isStale = useMemo(() => {
    if (!state.lastUpdated) return true;
    return currentTime - state.lastUpdated > 5 * 60 * 1000;
  }, [state.lastUpdated, currentTime]);

  const formatLastUpdated = useCallback((timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  }, []);

  const handleAutoRefreshToggle = useCallback(() => {
    portfolioStore.setAutoRefresh(!state.autoRefreshEnabled);
  }, [state.autoRefreshEnabled]);

  const handleIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const interval = parseInt(e.target.value, 10) as AutoRefreshInterval;
    portfolioStore.setAutoRefreshInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    portfolioStore.fetchPortfolio().catch(() => {});
  }, []);

  const handleRowClick = useCallback(
    (position: Position) => {
      setSelectedPosition(position);
      if (onSelectPosition) {
        onSelectPosition(position);
      }
    },
    [onSelectPosition]
  );

  const initiateClose = useCallback(
    (position: Position, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      if (isRealMode()) {
        setCloseConfirmation({ position });
      } else {
        executeClose(position);
      }
    },
    [isRealMode]
  );

  const executeClose = useCallback(
    async (position: Position) => {
      setClosing(true);
      setCloseConfirmation(null);
      try {
        const adapter = getPositionAdapter(isDemoMode());
        const result = await adapter.closePosition(position.positionId, position.instrumentId);

        const closeOrder: StoredOrder = {
          orderId: `close-${position.positionId}-${Date.now()}`,
          instrumentId: position.instrumentId,
          symbol: position.instrumentName || `#${position.instrumentId}`,
          displayName: position.instrumentName || `Instrument ${position.instrumentId}`,
          side: position.isBuy ? 'sell' : 'buy',
          orderType: 'market',
          amount: position.amount,
          leverage: position.leverage,
          status: 'executed',
          executedRate: result.closedRate,
          executedAt: result.closedAt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        ordersStore.addOrder(closeOrder);

        // Add activity notification
        const activityMode = isDemoMode() ? 'demo' : 'real';
        activityStore.addTradeClose(
          activityMode,
          position.instrumentName || `#${position.instrumentId}`,
          result.profit
        );

        if (state.portfolio) {
          // Trigger portfolio refresh to update positions after close
          portfolioStore.fetchPortfolio().catch(() => {});
        }

        setCloseResult({
          success: true,
          profit: result.profit,
          position,
        });
        setSelectedPosition(null);
      } catch (err) {
        console.error('Failed to close position:', err);
        
        // Add error activity
        const activityMode = isDemoMode() ? 'demo' : 'real';
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        activityStore.addError(
          activityMode,
          `Failed to close ${position.instrumentName || `#${position.instrumentId}`}`,
          errorMsg
        );
        
        setCloseResult({
          success: false,
          profit: 0,
          position,
        });
      } finally {
        setClosing(false);
      }
    },
    [isDemoMode, state.portfolio]
  );

  const handleClosePosition = useCallback(
    (positionId: number, e?: React.MouseEvent) => {
      const position = state.portfolio?.positions.find((p) => p.positionId === positionId);
      if (position) {
        initiateClose(position, e);
      }
    },
    [state.portfolio, initiateClose]
  );

  const handlePartialCloseClick = useCallback(() => {
    setShowPartialClose(true);
    setPartialUnits('');
    setPartialCloseError(null);
    setPartialCloseResult(null);
  }, []);

  const validatePartialUnits = useCallback((units: string, position: Position): string | null => {
    const numUnits = parseFloat(units);
    if (!units || isNaN(numUnits)) {
      return 'Please enter a valid number of units';
    }
    if (numUnits <= 0) {
      return 'Units must be greater than 0';
    }
    if (numUnits > position.units) {
      return `Units cannot exceed position units (${position.units.toFixed(6)})`;
    }
    if (numUnits === position.units) {
      return 'Use "Close Position" to close all units';
    }
    return null;
  }, []);

  const handlePartialCloseSubmit = useCallback(() => {
    if (!selectedPosition) return;
    
    const error = validatePartialUnits(partialUnits, selectedPosition);
    if (error) {
      setPartialCloseError(error);
      return;
    }

    if (isRealMode()) {
      setShowPartialConfirmation(true);
    } else {
      executePartialClose();
    }
  }, [selectedPosition, partialUnits, isRealMode, validatePartialUnits]);

  const executePartialClose = useCallback(async () => {
    if (!selectedPosition) return;

    const units = parseFloat(partialUnits);
    setClosing(true);
    setPartialCloseError(null);
    setShowPartialConfirmation(false);

    try {
      const adapter = getPositionAdapter(isDemoMode());
      const result = await adapter.closePositionPartial(selectedPosition.positionId, units);
      setPartialCloseResult(result);

      await portfolioStore.fetchPortfolio();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to partial close position';
      setPartialCloseError(message);
    } finally {
      setClosing(false);
    }
  }, [selectedPosition, partialUnits, isDemoMode]);

  const cancelPartialClose = useCallback(() => {
    setShowPartialClose(false);
    setPartialUnits('');
    setPartialCloseError(null);
    setShowPartialConfirmation(false);
    setPartialCloseResult(null);
  }, []);

  const calculateEstimatedPnL = useCallback((position: Position, units: number): number => {
    if (!position.currentRate || !position.profit) return 0;
    const pnlPerUnit = position.profit / position.units;
    return pnlPerUnit * units;
  }, []);

  const formatPnl = (value: number | undefined): string => {
    if (value === undefined || value === null) return '$0.00';
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const getPnlClass = (value: number | undefined): string => {
    if (value === undefined || value === null || value === 0) {
      return 'portfolio-panel__pnl--neutral';
    }
    return value > 0 ? 'portfolio-panel__pnl--positive' : 'portfolio-panel__pnl--negative';
  };

  const { portfolio, loading, error } = state;

  if (loading && !portfolio) {
    return (
      <div className="portfolio-panel">
        <div className="portfolio-panel__loading">▓▓▓ LOADING PORTFOLIO ▓▓▓</div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="portfolio-panel">
        <div className="portfolio-panel__error">✗ ERROR: {error}</div>
        <button className="portfolio-panel__refresh" onClick={handleRefresh}>
          [ RETRY ]
        </button>
      </div>
    );
  }

  const positions = portfolio?.positions || [];

  const renderDrawer = () => {
    if (!selectedPosition) return null;

    return (
      <div
        className="portfolio-panel__drawer-overlay"
        onClick={() => setSelectedPosition(null)}
      >
        <div
          className="portfolio-panel__drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="portfolio-panel__drawer-header">
            <span>POSITION DETAILS #{selectedPosition.positionId}</span>
            <button
              className="portfolio-panel__drawer-close"
              onClick={() => setSelectedPosition(null)}
            >
              ✕
            </button>
          </div>
          <div className="portfolio-panel__drawer-body">
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Instrument ID:</span>
              <span className="portfolio-panel__drawer-value">
                {selectedPosition.instrumentId}
              </span>
            </div>
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Instrument:</span>
              <span className="portfolio-panel__drawer-value">
                {selectedPosition.instrumentName || `ID: ${selectedPosition.instrumentId}`}
              </span>
            </div>
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Side:</span>
              <span
                className={`portfolio-panel__drawer-value ${
                  selectedPosition.isBuy
                    ? 'portfolio-panel__drawer-value--buy'
                    : 'portfolio-panel__drawer-value--sell'
                }`}
              >
                {selectedPosition.isBuy ? 'BUY' : 'SELL'}
              </span>
            </div>
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Amount:</span>
              <span className="portfolio-panel__drawer-value">
                ${selectedPosition.amount.toFixed(2)}
              </span>
            </div>
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Units:</span>
              <span className="portfolio-panel__drawer-value">
                {selectedPosition.units.toFixed(6)}
              </span>
            </div>
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Leverage:</span>
              <span className="portfolio-panel__drawer-value">
                x{selectedPosition.leverage}
              </span>
            </div>
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Open Rate:</span>
              <span className="portfolio-panel__drawer-value">
                {selectedPosition.openRate.toFixed(4)}
              </span>
            </div>
            {selectedPosition.currentRate && (
              <div className="portfolio-panel__drawer-row">
                <span className="portfolio-panel__drawer-label">Current Rate:</span>
                <span className="portfolio-panel__drawer-value">
                  {selectedPosition.currentRate.toFixed(4)}
                </span>
              </div>
            )}
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">Opened:</span>
              <span className="portfolio-panel__drawer-value">
                {new Date(selectedPosition.openDateTime).toLocaleString()}
              </span>
            </div>
            {selectedPosition.stopLossRate && selectedPosition.stopLossRate > 0 && (
              <div className="portfolio-panel__drawer-row">
                <span className="portfolio-panel__drawer-label">Stop Loss:</span>
                <span className="portfolio-panel__drawer-value">
                  {selectedPosition.stopLossRate.toFixed(4)}
                </span>
              </div>
            )}
            {selectedPosition.takeProfitRate && selectedPosition.takeProfitRate > 0 && (
              <div className="portfolio-panel__drawer-row">
                <span className="portfolio-panel__drawer-label">Take Profit:</span>
                <span className="portfolio-panel__drawer-value">
                  {selectedPosition.takeProfitRate.toFixed(4)}
                </span>
              </div>
            )}
            <div className="portfolio-panel__drawer-row">
              <span className="portfolio-panel__drawer-label">P&L:</span>
              <span
                className={`portfolio-panel__drawer-value ${getPnlClass(selectedPosition.profit)}`}
              >
                {formatPnl(selectedPosition.profit)}
              </span>
            </div>
          </div>

          {showPartialClose && !partialCloseResult && (
            <div className="portfolio-panel__partial-close">
              <div className="portfolio-panel__partial-close-header">
                PARTIAL CLOSE
              </div>
              <div className="portfolio-panel__partial-close-body">
                <div className="portfolio-panel__partial-close-row">
                  <label className="portfolio-panel__partial-close-label" htmlFor="partial-units">
                    Units to close:
                  </label>
                  <input
                    id="partial-units"
                    type="number"
                    className="portfolio-panel__partial-close-input"
                    value={partialUnits}
                    onChange={(e) => {
                      setPartialUnits(e.target.value);
                      setPartialCloseError(null);
                    }}
                    placeholder="0.000000"
                    min="0"
                    max={selectedPosition.units}
                    step="0.000001"
                    disabled={closing}
                    autoFocus
                  />
                </div>
                <div className="portfolio-panel__partial-close-info">
                  <span>Max: {selectedPosition.units.toFixed(6)} units</span>
                </div>
                {partialUnits && !isNaN(parseFloat(partialUnits)) && parseFloat(partialUnits) > 0 && (
                  <div className="portfolio-panel__partial-close-estimate">
                    <span className="portfolio-panel__partial-close-label">Est. P&L:</span>
                    <span className={getPnlClass(calculateEstimatedPnL(selectedPosition, parseFloat(partialUnits)))}>
                      {formatPnl(calculateEstimatedPnL(selectedPosition, parseFloat(partialUnits)))}
                    </span>
                  </div>
                )}
                {partialCloseError && (
                  <div className="portfolio-panel__partial-close-error">
                    ✗ {partialCloseError}
                  </div>
                )}
              </div>
              <div className="portfolio-panel__partial-close-actions">
                <button
                  className="portfolio-panel__drawer-btn portfolio-panel__drawer-btn--partial"
                  onClick={handlePartialCloseSubmit}
                  disabled={closing || !partialUnits}
                >
                  {closing ? 'CLOSING...' : 'EXECUTE PARTIAL CLOSE'}
                </button>
                <button
                  className="portfolio-panel__drawer-btn portfolio-panel__drawer-btn--cancel"
                  onClick={cancelPartialClose}
                  disabled={closing}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {partialCloseResult && (
            <div className="portfolio-panel__partial-close-result">
              <div className="portfolio-panel__partial-close-result-header">
                ✓ PARTIAL CLOSE SUCCESSFUL
              </div>
              <div className="portfolio-panel__partial-close-result-body">
                <div className="portfolio-panel__drawer-row">
                  <span className="portfolio-panel__drawer-label">Closed Units:</span>
                  <span className="portfolio-panel__drawer-value">
                    {partialCloseResult.closedUnits?.toFixed(6)}
                  </span>
                </div>
                <div className="portfolio-panel__drawer-row">
                  <span className="portfolio-panel__drawer-label">Closed Rate:</span>
                  <span className="portfolio-panel__drawer-value">
                    {partialCloseResult.closedRate.toFixed(4)}
                  </span>
                </div>
                <div className="portfolio-panel__drawer-row">
                  <span className="portfolio-panel__drawer-label">Realized P&L:</span>
                  <span className={`portfolio-panel__drawer-value ${getPnlClass(partialCloseResult.profit)}`}>
                    {formatPnl(partialCloseResult.profit)}
                  </span>
                </div>
              </div>
              <div className="portfolio-panel__partial-close-actions">
                <button
                  className="portfolio-panel__drawer-btn portfolio-panel__drawer-btn--cancel"
                  onClick={cancelPartialClose}
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}

          {showPartialConfirmation && (
            <div className="portfolio-panel__confirmation-overlay">
              <div className="portfolio-panel__confirmation-dialog">
                <div className="portfolio-panel__confirmation-header">
                  ⚠ CONFIRM PARTIAL CLOSE
                </div>
                <div className="portfolio-panel__confirmation-body">
                  <p>You are about to partially close a position in <strong>REAL MODE</strong>.</p>
                  <p>Position ID: <strong>#{selectedPosition.positionId}</strong></p>
                  <p>Instrument: <strong>{selectedPosition.instrumentName || `#${selectedPosition.instrumentId}`}</strong></p>
                  <p>Units to close: <strong>{parseFloat(partialUnits).toFixed(6)}</strong></p>
                  <p>Est. P&L: <strong className={getPnlClass(calculateEstimatedPnL(selectedPosition, parseFloat(partialUnits)))}>
                    {formatPnl(calculateEstimatedPnL(selectedPosition, parseFloat(partialUnits)))}
                  </strong></p>
                </div>
                <div className="portfolio-panel__confirmation-actions">
                  <button
                    className="portfolio-panel__confirmation-btn portfolio-panel__confirmation-btn--confirm"
                    onClick={executePartialClose}
                    disabled={closing}
                  >
                    {closing ? 'CLOSING...' : 'CONFIRM'}
                  </button>
                  <button
                    className="portfolio-panel__confirmation-btn portfolio-panel__confirmation-btn--cancel"
                    onClick={() => setShowPartialConfirmation(false)}
                    disabled={closing}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="portfolio-panel__drawer-actions">
            <button
              className="portfolio-panel__drawer-btn portfolio-panel__drawer-btn--close"
              onClick={() => handleClosePosition(selectedPosition.positionId)}
              disabled={closing || showPartialClose}
            >
              {closing && !showPartialClose ? 'CLOSING...' : 'CLOSE POSITION'}
            </button>
            <button
              className="portfolio-panel__drawer-btn portfolio-panel__drawer-btn--partial"
              onClick={handlePartialCloseClick}
              disabled={closing || showPartialClose}
            >
              PARTIAL CLOSE
            </button>
            <button
              className="portfolio-panel__drawer-btn portfolio-panel__drawer-btn--cancel"
              onClick={() => setSelectedPosition(null)}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="portfolio-panel" role="region" aria-label="Portfolio positions">
      <div className="portfolio-panel__header">
        <h2 className="portfolio-panel__title" id="portfolio-title">
          &gt; POSITIONS ({positions.length})
        </h2>
        <div className="portfolio-panel__header-actions">
          <span 
            className={`portfolio-panel__last-updated ${isStale ? 'portfolio-panel__last-updated--stale' : ''}`}
            aria-live="polite"
          >
            {isStale && '⚠ '}
            {formatLastUpdated(state.lastUpdated)}
          </span>
          <button
            className="portfolio-panel__refresh"
            onClick={handleRefresh}
            disabled={loading}
            aria-label={loading ? 'Loading portfolio' : 'Refresh portfolio'}
          >
            {loading ? '[ ... ]' : '[ ↻ ]'}
          </button>
        </div>
      </div>

      <div className="portfolio-panel__refresh-controls" role="group" aria-label="Refresh settings">
        <label className="portfolio-panel__auto-refresh-toggle">
          <input
            type="checkbox"
            checked={state.autoRefreshEnabled}
            onChange={handleAutoRefreshToggle}
            aria-label="Enable auto-refresh"
          />
          <span>Auto-refresh</span>
        </label>
        {state.autoRefreshEnabled && (
          <select
            className="portfolio-panel__interval-select"
            value={state.autoRefreshInterval}
            onChange={handleIntervalChange}
            aria-label="Auto-refresh interval"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {portfolio && (
        <div className="portfolio-panel__summary">
          <div className="portfolio-panel__summary-item">
            <span className="portfolio-panel__summary-label">Total:</span>
            <span className="portfolio-panel__summary-value">
              ${portfolio.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="portfolio-panel__summary-item">
            <span className="portfolio-panel__summary-label">Credit:</span>
            <span className="portfolio-panel__summary-value">
              ${portfolio.credit.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="portfolio-panel__error">✗ {error}</div>
      )}

      {positions.length === 0 && !loading ? (
        <div className="portfolio-panel__empty" role="status">
          <div className="portfolio-panel__empty-icon" aria-hidden="true">☐</div>
          <div>No open positions</div>
        </div>
      ) : (
        <div className="portfolio-panel__list" role="list" aria-label="Open positions">
          {positions.map((position) => (
            <div
              key={position.positionId}
              className="portfolio-panel__position"
              onClick={() => handleRowClick(position)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick(position);
                }
              }}
              aria-label={`${position.instrumentName || `#${position.instrumentId}`}, ${position.isBuy ? 'Buy' : 'Sell'}, $${position.amount.toFixed(2)}, P&L ${formatPnl(position.profit)}`}
            >
              <div className="portfolio-panel__position-row">
                <div className="portfolio-panel__position-main">
                  <span className="portfolio-panel__instrument">
                    {position.instrumentName || `#${position.instrumentId}`}
                  </span>
                  <span
                    className={`portfolio-panel__side ${
                      position.isBuy
                        ? 'portfolio-panel__side--buy'
                        : 'portfolio-panel__side--sell'
                    }`}
                  >
                    {position.isBuy ? 'BUY' : 'SELL'}
                  </span>
                  <span className="portfolio-panel__amount">
                    ${position.amount.toFixed(2)}
                  </span>
                  <span className="portfolio-panel__leverage">x{position.leverage}</span>
                </div>
                <span className={`portfolio-panel__pnl ${getPnlClass(position.profit)}`}>
                  {formatPnl(position.profit)}
                </span>
                <button
                  className="portfolio-panel__close-btn"
                  onClick={(e) => handleClosePosition(position.positionId, e)}
                  disabled={closing}
                  aria-label={`Close ${position.instrumentName || `position ${position.positionId}`}`}
                >
                  CLOSE
                </button>
              </div>
              <div className="portfolio-panel__position-details">
                <div className="portfolio-panel__detail">
                  <span className="portfolio-panel__detail-label">Open:</span>
                  <span className="portfolio-panel__detail-value">
                    {position.openRate.toFixed(4)}
                  </span>
                </div>
                <div className="portfolio-panel__detail">
                  <span className="portfolio-panel__detail-label">Units:</span>
                  <span className="portfolio-panel__detail-value">
                    {position.units.toFixed(4)}
                  </span>
                </div>
                <div className="portfolio-panel__detail">
                  <span className="portfolio-panel__detail-label">Opened:</span>
                  <span className="portfolio-panel__detail-value">
                    {new Date(position.openDateTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderDrawer()}

      {closeConfirmation && (
        <div
          className="portfolio-panel__drawer-overlay"
          onClick={() => setCloseConfirmation(null)}
          role="presentation"
        >
          <div
            className="portfolio-panel__confirmation-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="close-confirm-title"
            aria-describedby="close-confirm-desc"
          >
            <div className="portfolio-panel__confirmation-header" id="close-confirm-title">
              ⚠ CONFIRM CLOSE
            </div>
            <div className="portfolio-panel__confirmation-body" id="close-confirm-desc">
              <p>
                Close position for{' '}
                <strong>${closeConfirmation.position.amount.toFixed(2)}</strong>?
              </p>
              <p>
                {closeConfirmation.position.instrumentName || `#${closeConfirmation.position.instrumentId}`}{' '}
                ({closeConfirmation.position.isBuy ? 'BUY' : 'SELL'})
              </p>
              <p className={getPnlClass(closeConfirmation.position.profit)}>
                Current P&L: {formatPnl(closeConfirmation.position.profit)}
              </p>
            </div>
            <div className="portfolio-panel__confirmation-actions">
              <button
                className="portfolio-panel__confirmation-btn portfolio-panel__confirmation-btn--confirm"
                onClick={() => executeClose(closeConfirmation.position)}
                disabled={closing}
              >
                {closing ? 'CLOSING...' : 'CONFIRM CLOSE'}
              </button>
              <button
                className="portfolio-panel__confirmation-btn portfolio-panel__confirmation-btn--cancel"
                onClick={() => setCloseConfirmation(null)}
                disabled={closing}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {closeResult && (
        <div
          className="portfolio-panel__drawer-overlay"
          onClick={() => setCloseResult(null)}
        >
          <div
            className="portfolio-panel__result-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`portfolio-panel__result-header ${closeResult.success ? 'portfolio-panel__result-header--success' : 'portfolio-panel__result-header--error'}`}>
              {closeResult.success ? '✓ POSITION CLOSED' : '✗ CLOSE FAILED'}
            </div>
            <div className="portfolio-panel__result-body">
              <p>
                {closeResult.position.instrumentName || `#${closeResult.position.instrumentId}`}
              </p>
              {closeResult.success && (
                <p className={getPnlClass(closeResult.profit)}>
                  Realized P&L: {formatPnl(closeResult.profit)}
                </p>
              )}
              {!closeResult.success && (
                <p className="portfolio-panel__result-error">
                  Failed to close position. Please try again.
                </p>
              )}
            </div>
            <div className="portfolio-panel__result-actions">
              <button
                className="portfolio-panel__result-btn"
                onClick={() => setCloseResult(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PortfolioPanel };
