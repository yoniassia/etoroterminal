import { useState, useEffect, useCallback } from 'react';
import { compareStore, CompareTrader } from '../stores/compareStore';
import './CompareTray.css';

export interface CompareTrayProps {
  onTraderClick?: (userId: string) => void;
}

function formatGain(gain: number): { text: string; className: string } {
  const sign = gain >= 0 ? '+' : '';
  const text = `${sign}${gain.toFixed(2)}%`;
  const className = gain > 0 ? 'positive' : gain < 0 ? 'negative' : 'neutral';
  return { text, className };
}

function formatDrawdown(drawdown?: number): { text: string; className: string } {
  if (drawdown === undefined) {
    return { text: '--', className: 'neutral' };
  }
  const text = `${drawdown.toFixed(2)}%`;
  const className = drawdown < -20 ? 'negative' : drawdown < -10 ? 'warning' : 'neutral';
  return { text, className };
}

function getRiskClass(score: number): string {
  if (score <= 3) return 'low';
  if (score <= 5) return 'medium';
  return 'high';
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

export default function CompareTray({ onTraderClick }: CompareTrayProps) {
  const [traders, setTraders] = useState<CompareTrader[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setTraders(compareStore.getTraders());
    const unsubscribe = compareStore.subscribe(() => {
      setTraders(compareStore.getTraders());
    });
    return unsubscribe;
  }, []);

  const handleRemove = useCallback((userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    compareStore.removeTrader(userId);
  }, []);

  const handleClearAll = useCallback(() => {
    compareStore.clearAll();
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleTraderClick = useCallback(
    (userId: string) => {
      if (onTraderClick) {
        onTraderClick(userId);
      }
    },
    [onTraderClick]
  );

  if (traders.length === 0) {
    return null;
  }

  return (
    <div className={`compare-tray ${isExpanded ? 'compare-tray--expanded' : ''}`}>
      <div className="compare-tray__header" onClick={handleToggleExpand}>
        <span className="compare-tray__title">
          &gt; COMPARE TRADERS ({traders.length}/5)
        </span>
        <div className="compare-tray__header-actions">
          <button
            className="compare-tray__clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
          >
            [ CLEAR ALL ]
          </button>
          <span className="compare-tray__expand-icon">
            {isExpanded ? '▼' : '▲'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="compare-tray__content">
          <div className="compare-tray__grid">
            <div className="compare-tray__labels">
              <div className="compare-tray__label-cell compare-tray__label-cell--header"></div>
              <div className="compare-tray__label-cell">GAIN</div>
              <div className="compare-tray__label-cell">DRAWDOWN</div>
              <div className="compare-tray__label-cell">RISK</div>
              <div className="compare-tray__label-cell">COPIERS</div>
            </div>
            {traders.map((trader) => {
              const gainInfo = formatGain(trader.gainPercent);
              const drawdownInfo = formatDrawdown(trader.maxDrawdown);
              const riskClass = getRiskClass(trader.riskScore);

              return (
                <div
                  key={trader.userId}
                  className="compare-tray__trader-col"
                  onClick={() => handleTraderClick(trader.userId)}
                >
                  <div className="compare-tray__trader-header">
                    <span className="compare-tray__trader-name">
                      {trader.displayName || trader.username}
                    </span>
                    <button
                      className="compare-tray__remove-btn"
                      onClick={(e) => handleRemove(trader.userId, e)}
                      title="Remove from compare"
                    >
                      ✕
                    </button>
                  </div>
                  <div className={`compare-tray__metric compare-tray__metric--${gainInfo.className}`}>
                    {gainInfo.text}
                  </div>
                  <div className={`compare-tray__metric compare-tray__metric--${drawdownInfo.className}`}>
                    {drawdownInfo.text}
                  </div>
                  <div className={`compare-tray__metric compare-tray__metric--risk-${riskClass}`}>
                    {trader.riskScore}/7
                  </div>
                  <div className="compare-tray__metric">
                    {formatCopiers(trader.copiers)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isExpanded && (
        <div className="compare-tray__preview">
          {traders.map((trader) => (
            <div key={trader.userId} className="compare-tray__preview-item">
              <span className="compare-tray__preview-name">
                {trader.displayName || trader.username}
              </span>
              <button
                className="compare-tray__remove-btn compare-tray__remove-btn--small"
                onClick={(e) => handleRemove(trader.userId, e)}
                title="Remove from compare"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { CompareTray };
