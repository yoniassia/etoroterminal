import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import { useTradingMode } from '../../contexts/TradingModeContext';
import { keyManager } from '../../services/keyManager';
import { getTradingAdapter } from '../../api/adapters/tradingAdapter';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import { useActiveSymbol } from '../Workspace/ActiveSymbolContext';
import { symbolResolver } from '../../services/symbolResolver';
import { activityStore } from '../../stores/activityStore';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './TradeTicket.css';

export type InputMode = 'amount' | 'units';
export type LeverageOption = '1x' | '2x' | '5x' | '10x' | '20x';
export type OrderSide = 'buy' | 'sell';

export interface TradeTicketData {
  symbol: string;
  side: OrderSide;
  inputMode: InputMode;
  value: number;
  leverage: LeverageOption;
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradeTicketProps extends PanelContentProps {
  symbol?: string;
  instrumentId?: number;
  onSubmit?: (data: TradeTicketData) => void;
  onCancel?: () => void;
}

const LEVERAGE_OPTIONS: LeverageOption[] = ['1x', '2x', '5x', '10x', '20x'];

export default function TradeTicket({ symbol: propSymbol = '', instrumentId: propInstrumentId, onSubmit, onCancel }: TradeTicketProps = { panelId: '' }) {
  const { isRealMode, isDemoMode, requiresConfirmation } = useTradingMode();
  const { getPendingSymbol } = useWorkspaceContext();
  const { activeSymbol } = useActiveSymbol();
  const hasApiKeys = keyManager.hasKeys();
  const initializedRef = useRef(false);

  const [symbol, setSymbol] = useState(propSymbol);
  const [instrumentId, setInstrumentId] = useState<number | undefined>(propInstrumentId);
  const [inputMode, setInputMode] = useState<InputMode>('amount');
  const [inputValue, setInputValue] = useState<string>('');
  const [leverage, setLeverage] = useState<LeverageOption>('1x');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSide, setPendingSide] = useState<OrderSide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastOrderStatus, setLastOrderStatus] = useState<'success' | 'rejected' | null>(null);

  // Check for pending symbol on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const pending = getPendingSymbol();
      if (pending?.symbol) {
        setSymbol(pending.symbol);
        if (pending.instrumentId) {
          setInstrumentId(pending.instrumentId);
        } else {
          // Resolve the symbol to get instrumentId
          symbolResolver.resolveSymbol(pending.symbol).then((resolved) => {
            if (resolved) {
              setInstrumentId(resolved.instrumentId);
            }
          });
        }
      }
    }
  }, [getPendingSymbol]);

  // Also listen to active symbol changes
  useEffect(() => {
    if (activeSymbol && activeSymbol !== symbol) {
      setSymbol(activeSymbol);
      symbolResolver.resolveSymbol(activeSymbol).then((resolved) => {
        if (resolved) {
          setInstrumentId(resolved.instrumentId);
        }
      });
    }
  }, [activeSymbol]);

  const isDisabled = !hasApiKeys || isSubmitting;
  const value = parseFloat(inputValue) || 0;

  const buildTradeData = (side: OrderSide): TradeTicketData => ({
    symbol,
    side,
    inputMode,
    value,
    leverage,
    stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
    takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
  });

  const executeTrade = useCallback(async (side: OrderSide) => {
    if (!instrumentId) {
      setSubmitError('No instrument selected');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const tradingAdapter = getTradingAdapter();
      tradingAdapter.setDemoMode(isDemoMode());

      const leverageValue = parseInt(leverage.replace('x', ''), 10);
      const isBuy = side === 'buy';
      const instrumentInfo = { symbol, displayName: symbol };

      if (inputMode === 'amount') {
        await tradingAdapter.openPositionByAmount(
          instrumentId,
          value,
          isBuy,
          leverageValue,
          stopLoss ? parseFloat(stopLoss) : undefined,
          takeProfit ? parseFloat(takeProfit) : undefined,
          instrumentInfo
        );
      } else {
        await tradingAdapter.openPositionByUnits(
          instrumentId,
          value,
          isBuy,
          leverageValue,
          stopLoss ? parseFloat(stopLoss) : undefined,
          takeProfit ? parseFloat(takeProfit) : undefined,
          instrumentInfo,
          value
        );
      }

      // Add activity notification for successful trade
      const activityMode = isDemoMode() ? 'demo' : 'real';
      activityStore.addTradeOpen(activityMode, symbol, value, side);

      setLastOrderStatus('success');
      onSubmit?.(buildTradeData(side));
      setInputValue('');
      setStopLoss('');
      setTakeProfit('');
      
      // Clear success status after 5 seconds
      setTimeout(() => setLastOrderStatus(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Trade failed';
      setSubmitError(message);
      setLastOrderStatus('rejected');
      
      // Add activity notification for failed trade
      const activityMode = isDemoMode() ? 'demo' : 'real';
      activityStore.addOrderRejected(activityMode, symbol, message);
    } finally {
      setIsSubmitting(false);
    }
  }, [instrumentId, isDemoMode, leverage, inputMode, value, stopLoss, takeProfit, symbol, onSubmit]);

  const handleTrade = useCallback((side: OrderSide) => {
    if (isDisabled || value <= 0) return;

    setSubmitError(null);

    if (requiresConfirmation()) {
      setPendingSide(side);
      setShowConfirmation(true);
      return;
    }

    executeTrade(side);
  }, [isDisabled, value, requiresConfirmation, executeTrade]);

  const confirmTrade = useCallback(() => {
    if (pendingSide) {
      executeTrade(pendingSide);
    }
    setShowConfirmation(false);
    setPendingSide(null);
  }, [pendingSide, executeTrade]);

  const cancelConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setPendingSide(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      onCancel?.();
    }
  }, [onCancel]);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    
    if (e.key === 'b' && e.ctrlKey) {
      e.preventDefault();
      handleTrade('buy');
    } else if (e.key === 's' && e.ctrlKey) {
      e.preventDefault();
      handleTrade('sell');
    }
  }, [isDisabled, handleTrade]);

  return (
    <div 
      className="trade-ticket" 
      onKeyDown={handleGlobalKeyDown} 
      tabIndex={0}
      role="region"
      aria-label={`Trade ticket${symbol ? ` for ${symbol}` : ''}`}
    >
      <div className="trade-ticket-header">
        <h2 className="trade-ticket-title" id="trade-ticket-title">TRADE TICKET</h2>
        {symbol && <span className="trade-ticket-symbol" aria-label={`Symbol: ${symbol}`}>{symbol}</span>}
      </div>

      {!hasApiKeys && (
        <div className="trade-ticket-warning" role="alert">
          ⚠ API keys not configured. Please set keys to enable trading.
        </div>
      )}

      {isRealMode() && (
        <div className="trade-ticket-real-warning" role="alert">
          ⚠ REAL MODE - Trades will execute with real money
        </div>
      )}

      {lastOrderStatus === 'rejected' && (
        <div className="trade-ticket-status trade-ticket-status--rejected" role="alert">
          <div className="trade-ticket-status-icon">✗</div>
          <div className="trade-ticket-status-text">
            <strong>ORDER REJECTED</strong>
            {submitError && <span className="trade-ticket-status-reason">{submitError}</span>}
          </div>
          <button 
            className="trade-ticket-status-dismiss" 
            onClick={() => { setLastOrderStatus(null); setSubmitError(null); }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {lastOrderStatus === 'success' && (
        <div className="trade-ticket-status trade-ticket-status--success" role="status">
          <div className="trade-ticket-status-icon">✓</div>
          <div className="trade-ticket-status-text">
            <strong>ORDER SUBMITTED</strong>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="trade-ticket-status trade-ticket-status--loading" role="status" aria-live="polite">
          <div className="trade-ticket-status-icon spinning">◐</div>
          <div className="trade-ticket-status-text">
            <strong>SUBMITTING ORDER...</strong>
          </div>
        </div>
      )}

      <div className="trade-ticket-body">
        <div className="trade-ticket-row">
          <span className="trade-ticket-label" id="input-type-label">Input Type:</span>
          <div className="trade-ticket-toggle" role="group" aria-labelledby="input-type-label">
            <button
              className={`toggle-btn ${inputMode === 'amount' ? 'active' : ''}`}
              onClick={() => setInputMode('amount')}
              disabled={isDisabled}
              aria-pressed={inputMode === 'amount'}
            >
              Amount ($)
            </button>
            <button
              className={`toggle-btn ${inputMode === 'units' ? 'active' : ''}`}
              onClick={() => setInputMode('units')}
              disabled={isDisabled}
              aria-pressed={inputMode === 'units'}
            >
              Units
            </button>
          </div>
        </div>

        <div className="trade-ticket-row">
          <label className="trade-ticket-label" htmlFor="trade-value">
            {inputMode === 'amount' ? 'Amount ($):' : 'Units:'}
          </label>
          <input
            id="trade-value"
            type="number"
            className="trade-ticket-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputMode === 'amount' ? '0.00' : '0'}
            min="0"
            step={inputMode === 'amount' ? '0.01' : '1'}
            disabled={isDisabled}
            autoFocus
          />
        </div>

        <div className="trade-ticket-row">
          <label className="trade-ticket-label" htmlFor="trade-leverage">Leverage:</label>
          <select
            id="trade-leverage"
            className="trade-ticket-select"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value as LeverageOption)}
            disabled={isDisabled}
          >
            {LEVERAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="trade-ticket-row">
          <label className="trade-ticket-label" htmlFor="trade-sl">Stop Loss:</label>
          <input
            id="trade-sl"
            type="number"
            className="trade-ticket-input"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Optional"
            min="0"
            step="0.01"
            disabled={isDisabled}
          />
        </div>

        <div className="trade-ticket-row">
          <label className="trade-ticket-label" htmlFor="trade-tp">Take Profit:</label>
          <input
            id="trade-tp"
            type="number"
            className="trade-ticket-input"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Optional"
            min="0"
            step="0.01"
            disabled={isDisabled}
          />
        </div>

        <div className="trade-ticket-actions" role="group" aria-label="Trade actions">
          <button
            className="trade-btn buy-btn"
            onClick={() => handleTrade('buy')}
            disabled={isDisabled || value <= 0}
            aria-label={`Buy ${symbol || 'instrument'}, keyboard shortcut Ctrl+B`}
            aria-keyshortcuts="Control+B"
          >
            BUY
          </button>
          <button
            className="trade-btn sell-btn"
            onClick={() => handleTrade('sell')}
            disabled={isDisabled || value <= 0}
            aria-label={`Sell ${symbol || 'instrument'}, keyboard shortcut Ctrl+S`}
            aria-keyshortcuts="Control+S"
          >
            SELL
          </button>
        </div>

        <div className="trade-ticket-shortcuts">
          <span className="shortcut-hint">Ctrl+B: Buy | Ctrl+S: Sell | Esc: Cancel</span>
        </div>
      </div>

      {showConfirmation && (
        <div className="trade-confirmation-overlay" role="presentation">
          <div 
            className="trade-confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
          >
            <div className="confirmation-header" id="confirm-dialog-title">⚠ CONFIRM {pendingSide?.toUpperCase()} ORDER</div>
            <div className="confirmation-body" id="confirm-dialog-desc">
              <p>You are about to place a <strong>{pendingSide?.toUpperCase()}</strong> order in <strong>REAL MODE</strong>.</p>
              <p>Symbol: <strong>{symbol}</strong></p>
              <p>{inputMode === 'amount' ? 'Amount' : 'Units'}: <strong>{value}</strong></p>
              <p>Leverage: <strong>{leverage}</strong></p>
              {stopLoss && <p>Stop Loss: <strong>{stopLoss}</strong></p>}
              {takeProfit && <p>Take Profit: <strong>{takeProfit}</strong></p>}
            </div>
            <div className="confirmation-actions">
              <button className="confirm-btn" onClick={confirmTrade} aria-label="Confirm trade order">CONFIRM</button>
              <button className="cancel-btn" onClick={cancelConfirmation} aria-label="Cancel trade order">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
