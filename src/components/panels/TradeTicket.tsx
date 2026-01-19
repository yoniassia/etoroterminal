import { useState, useCallback, KeyboardEvent } from 'react';
import { useTradingMode, TradingMode } from '../../contexts/TradingModeContext';
import { keyManager } from '../../services/keyManager';
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

export interface TradeTicketProps {
  symbol?: string;
  onSubmit?: (data: TradeTicketData) => void;
  onCancel?: () => void;
}

const LEVERAGE_OPTIONS: LeverageOption[] = ['1x', '2x', '5x', '10x', '20x'];

export default function TradeTicket({ symbol = '', onSubmit, onCancel }: TradeTicketProps) {
  const { mode, isRealMode, requiresConfirmation } = useTradingMode();
  const hasApiKeys = keyManager.hasKeys();

  const [inputMode, setInputMode] = useState<InputMode>('amount');
  const [inputValue, setInputValue] = useState<string>('');
  const [leverage, setLeverage] = useState<LeverageOption>('1x');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSide, setPendingSide] = useState<OrderSide | null>(null);

  const isDisabled = !hasApiKeys;
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

  const handleTrade = useCallback((side: OrderSide) => {
    if (isDisabled || value <= 0) return;

    if (requiresConfirmation()) {
      setPendingSide(side);
      setShowConfirmation(true);
      return;
    }

    onSubmit?.(buildTradeData(side));
  }, [isDisabled, value, requiresConfirmation, onSubmit, symbol, inputMode, leverage, stopLoss, takeProfit]);

  const confirmTrade = useCallback(() => {
    if (pendingSide) {
      onSubmit?.(buildTradeData(pendingSide));
    }
    setShowConfirmation(false);
    setPendingSide(null);
  }, [pendingSide, onSubmit, symbol, inputMode, value, leverage, stopLoss, takeProfit]);

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
