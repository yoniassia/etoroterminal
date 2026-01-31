/**
 * Correlation Matrix Panel
 * Show correlation between assets for portfolio diversification
 * Commands: CORR, MATRIX, DIVERSIFY
 */

import { useState, useMemo } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './CorrelationMatrixPanel.css';

// Simulated correlation data (in production, would calculate from historical prices)
const DEMO_CORRELATIONS: Record<string, Record<string, number>> = {
  'AAPL': { 'AAPL': 1.00, 'MSFT': 0.85, 'GOOGL': 0.78, 'TSLA': 0.45, 'NVDA': 0.72, 'BTC': 0.35, 'GLD': -0.15, 'SPY': 0.92 },
  'MSFT': { 'AAPL': 0.85, 'MSFT': 1.00, 'GOOGL': 0.82, 'TSLA': 0.40, 'NVDA': 0.75, 'BTC': 0.30, 'GLD': -0.12, 'SPY': 0.90 },
  'GOOGL': { 'AAPL': 0.78, 'MSFT': 0.82, 'GOOGL': 1.00, 'TSLA': 0.38, 'NVDA': 0.70, 'BTC': 0.32, 'GLD': -0.10, 'SPY': 0.88 },
  'TSLA': { 'AAPL': 0.45, 'MSFT': 0.40, 'GOOGL': 0.38, 'TSLA': 1.00, 'NVDA': 0.55, 'BTC': 0.52, 'GLD': -0.05, 'SPY': 0.65 },
  'NVDA': { 'AAPL': 0.72, 'MSFT': 0.75, 'GOOGL': 0.70, 'TSLA': 0.55, 'NVDA': 1.00, 'BTC': 0.42, 'GLD': -0.08, 'SPY': 0.82 },
  'BTC': { 'AAPL': 0.35, 'MSFT': 0.30, 'GOOGL': 0.32, 'TSLA': 0.52, 'NVDA': 0.42, 'BTC': 1.00, 'GLD': 0.15, 'SPY': 0.45 },
  'GLD': { 'AAPL': -0.15, 'MSFT': -0.12, 'GOOGL': -0.10, 'TSLA': -0.05, 'NVDA': -0.08, 'BTC': 0.15, 'GLD': 1.00, 'SPY': -0.20 },
  'SPY': { 'AAPL': 0.92, 'MSFT': 0.90, 'GOOGL': 0.88, 'TSLA': 0.65, 'NVDA': 0.82, 'BTC': 0.45, 'GLD': -0.20, 'SPY': 1.00 },
};

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTC', 'GLD', 'SPY'];

export default function CorrelationMatrixPanel(_props: PanelContentProps) {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [inputSymbol, setInputSymbol] = useState('');
  const [showEducation, setShowEducation] = useState(false);

  const correlations = useMemo(() => {
    // Return correlations for selected symbols
    const matrix: Record<string, Record<string, number>> = {};
    symbols.forEach(s1 => {
      matrix[s1] = {};
      symbols.forEach(s2 => {
        matrix[s1][s2] = DEMO_CORRELATIONS[s1]?.[s2] ?? 0;
      });
    });
    return matrix;
  }, [symbols]);

  const getCorrelationColor = (corr: number): string => {
    if (corr >= 0.7) return '#00aa00'; // Strong positive - green
    if (corr >= 0.3) return '#88aa00'; // Moderate positive - yellow-green
    if (corr >= -0.3) return '#888888'; // Weak/neutral - gray
    if (corr >= -0.7) return '#aa8800'; // Moderate negative - orange
    return '#aa0000'; // Strong negative - red
  };

  const getCorrelationBg = (corr: number): string => {
    const intensity = Math.abs(corr);
    if (corr > 0) {
      return `rgba(0, 255, 0, ${intensity * 0.3})`;
    } else if (corr < 0) {
      return `rgba(255, 100, 100, ${intensity * 0.3})`;
    }
    return 'transparent';
  };

  const handleAddSymbol = () => {
    const sym = inputSymbol.trim().toUpperCase();
    if (sym && !symbols.includes(sym) && DEMO_CORRELATIONS[sym]) {
      setSymbols([...symbols, sym]);
      setInputSymbol('');
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    if (symbols.length > 2) {
      setSymbols(symbols.filter(s => s !== sym));
    }
  };

  // Calculate average correlation for diversification score
  const diversificationScore = useMemo(() => {
    let totalCorr = 0;
    let count = 0;
    symbols.forEach((s1, i) => {
      symbols.forEach((s2, j) => {
        if (i < j) { // Only upper triangle, exclude diagonal
          totalCorr += Math.abs(correlations[s1]?.[s2] || 0);
          count++;
        }
      });
    });
    const avgCorr = count > 0 ? totalCorr / count : 0;
    // Lower average correlation = better diversification
    return Math.max(0, Math.min(100, (1 - avgCorr) * 100));
  }, [symbols, correlations]);

  return (
    <div className="correlation-matrix-panel">
      <div className="cm-header">
        <h3>📊 Correlation Matrix</h3>
        <p className="cm-subtitle">Understand how your assets move together</p>
      </div>

      {/* Diversification Score */}
      <div className="cm-score-section">
        <div className="cm-score">
          <span className="cm-score-value" style={{
            color: diversificationScore >= 60 ? '#00ff00' : diversificationScore >= 40 ? '#ffcc00' : '#ff6666'
          }}>
            {diversificationScore.toFixed(0)}%
          </span>
          <span className="cm-score-label">Diversification Score</span>
        </div>
        <div className="cm-score-hint">
          {diversificationScore >= 60 
            ? '✅ Good diversification - assets have low correlation'
            : diversificationScore >= 40
            ? '⚠️ Moderate diversification - consider adding uncorrelated assets'
            : '❌ Poor diversification - assets move together, higher risk'}
        </div>
      </div>

      {/* Symbol Management */}
      <div className="cm-symbols-section">
        <label className="cm-label">Symbols ({symbols.length})</label>
        <div className="cm-symbol-tags">
          {symbols.map(sym => (
            <span key={sym} className="cm-symbol-tag">
              {sym}
              <button onClick={() => handleRemoveSymbol(sym)}>×</button>
            </span>
          ))}
        </div>
        <div className="cm-add-symbol">
          <input
            type="text"
            value={inputSymbol}
            onChange={e => setInputSymbol(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
            placeholder="Add symbol..."
          />
          <button onClick={handleAddSymbol}>+</button>
        </div>
        <span className="cm-hint">Available: AAPL, MSFT, GOOGL, TSLA, NVDA, BTC, GLD, SPY</span>
      </div>

      {/* Correlation Matrix */}
      <div className="cm-matrix-container">
        <table className="cm-matrix">
          <thead>
            <tr>
              <th></th>
              {symbols.map(sym => (
                <th key={sym}>{sym}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map(s1 => (
              <tr key={s1}>
                <td className="cm-row-header">{s1}</td>
                {symbols.map(s2 => {
                  const corr = correlations[s1]?.[s2] ?? 0;
                  return (
                    <td 
                      key={s2}
                      className="cm-cell"
                      style={{
                        backgroundColor: getCorrelationBg(corr),
                        color: getCorrelationColor(corr),
                      }}
                      title={`${s1} vs ${s2}: ${corr.toFixed(2)}`}
                    >
                      {s1 === s2 ? '—' : corr.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="cm-legend">
        <span className="cm-legend-item" style={{ color: '#00aa00' }}>■ Strong +</span>
        <span className="cm-legend-item" style={{ color: '#88aa00' }}>■ Moderate +</span>
        <span className="cm-legend-item" style={{ color: '#888888' }}>■ Neutral</span>
        <span className="cm-legend-item" style={{ color: '#aa8800' }}>■ Moderate -</span>
        <span className="cm-legend-item" style={{ color: '#aa0000' }}>■ Strong -</span>
      </div>

      {/* Education Toggle */}
      <div className="cm-education-section">
        <button 
          className="cm-education-toggle"
          onClick={() => setShowEducation(!showEducation)}
        >
          {showEducation ? '▼' : '▶'} 📚 Understanding Correlation
        </button>
        
        {showEducation && (
          <div className="cm-education">
            <p><strong>Correlation ranges from -1 to +1:</strong></p>
            <ul>
              <li><strong>+1.0:</strong> Perfect positive - assets move exactly together</li>
              <li><strong>+0.5 to +1.0:</strong> Strong positive - usually move same direction</li>
              <li><strong>0 to +0.5:</strong> Weak positive - slight tendency to move together</li>
              <li><strong>-0.5 to 0:</strong> Weak negative - slight tendency to move opposite</li>
              <li><strong>-1.0 to -0.5:</strong> Strong negative - usually move opposite</li>
            </ul>
            <p><strong>For diversification:</strong> Mix assets with low or negative correlation. When one falls, others may hold or rise.</p>
            <p className="cm-quote">"Diversification is protection against ignorance." - Warren Buffett</p>
          </div>
        )}
      </div>
    </div>
  );
}
