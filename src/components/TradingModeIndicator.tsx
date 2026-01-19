import { useTradingMode, TradingMode } from '../contexts/TradingModeContext';

interface TradingModeIndicatorProps {
  showToggle?: boolean;
}

export default function TradingModeIndicator({ showToggle = true }: TradingModeIndicatorProps) {
  const { mode, setTradingMode, isRealMode } = useTradingMode();

  const handleToggle = () => {
    setTradingMode(mode === TradingMode.DEMO ? TradingMode.REAL : TradingMode.DEMO);
  };

  return (
    <div className="trading-mode-indicator">
      {isRealMode() ? (
        <div className="mode-banner mode-real">
          ⚠ REAL TRADING MODE - Trades require explicit confirmation
        </div>
      ) : (
        <div className="mode-banner mode-demo">
          ◉ DEMO MODE - Simulated trading environment
        </div>
      )}

      {showToggle && (
        <button
          className={`mode-toggle ${isRealMode() ? 'toggle-real' : 'toggle-demo'}`}
          onClick={handleToggle}
        >
          [ Switch to {mode === TradingMode.DEMO ? 'REAL' : 'DEMO'} ]
        </button>
      )}
    </div>
  );
}
