/**
 * Position Sizing Calculator Panel
 * Calculate optimal position sizes using Kelly Criterion and Fixed Fractional methods
 * Commands: PS, SIZE, KELLY
 */

import { useState, useMemo } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './PositionSizingPanel.css';

type SizingMethod = 'kelly' | 'fixed' | 'volatility';

interface CalculationResult {
  positionSize: number;
  dollarAmount: number;
  riskAmount: number;
  rewardAmount: number;
  shares: number;
  percentOfPortfolio: number;
}

export default function PositionSizingPanel(_props: PanelContentProps) {
  // Portfolio inputs
  const [portfolioValue, setPortfolioValue] = useState<string>('10000');
  const [method, setMethod] = useState<SizingMethod>('fixed');
  
  // Trade inputs
  const [entryPrice, setEntryPrice] = useState<string>('100');
  const [stopLoss, setStopLoss] = useState<string>('95');
  const [takeProfit, setTakeProfit] = useState<string>('115');
  
  // Fixed fractional inputs
  const [riskPercent, setRiskPercent] = useState<string>('2');
  
  // Kelly inputs
  const [winRate, setWinRate] = useState<string>('55');
  const [avgWin, setAvgWin] = useState<string>('15');
  const [avgLoss, setAvgLoss] = useState<string>('10');
  
  // Volatility inputs
  const [atr, setAtr] = useState<string>('5');
  const [atrMultiplier, setAtrMultiplier] = useState<string>('2');

  const calculation = useMemo((): CalculationResult | null => {
    const portfolio = parseFloat(portfolioValue) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const stop = parseFloat(stopLoss) || 0;
    const target = parseFloat(takeProfit) || 0;
    
    if (portfolio <= 0 || entry <= 0 || stop <= 0) return null;
    
    const riskPerShare = Math.abs(entry - stop);
    const rewardPerShare = Math.abs(target - entry);
    
    if (riskPerShare <= 0) return null;
    
    let positionSizePercent = 0;
    
    switch (method) {
      case 'fixed': {
        // Fixed Fractional: Risk X% of portfolio per trade
        const risk = parseFloat(riskPercent) || 2;
        const riskDollars = portfolio * (risk / 100);
        const shares = Math.floor(riskDollars / riskPerShare);
        positionSizePercent = (shares * entry / portfolio) * 100;
        break;
      }
      
      case 'kelly': {
        // Kelly Criterion: f* = (bp - q) / b
        // b = odds (avg win / avg loss)
        // p = probability of winning
        // q = probability of losing (1 - p)
        const p = (parseFloat(winRate) || 50) / 100;
        const q = 1 - p;
        const avgW = parseFloat(avgWin) || 10;
        const avgL = parseFloat(avgLoss) || 10;
        const b = avgW / avgL;
        
        const kelly = (b * p - q) / b;
        // Use half Kelly for safety
        positionSizePercent = Math.max(0, Math.min(kelly * 100 * 0.5, 25));
        break;
      }
      
      case 'volatility': {
        // Volatility-based: Position size based on ATR
        const atrValue = parseFloat(atr) || 5;
        const multiplier = parseFloat(atrMultiplier) || 2;
        const riskPerUnit = atrValue * multiplier;
        const riskBudget = portfolio * 0.02; // 2% risk budget
        const units = riskBudget / riskPerUnit;
        positionSizePercent = (units * entry / portfolio) * 100;
        break;
      }
    }
    
    // Cap at 25% of portfolio
    positionSizePercent = Math.min(positionSizePercent, 25);
    
    const dollarAmount = portfolio * (positionSizePercent / 100);
    const shares = Math.floor(dollarAmount / entry);
    const actualDollarAmount = shares * entry;
    const riskAmount = shares * riskPerShare;
    const rewardAmount = shares * rewardPerShare;
    
    return {
      positionSize: positionSizePercent,
      dollarAmount: actualDollarAmount,
      riskAmount,
      rewardAmount,
      shares,
      percentOfPortfolio: (actualDollarAmount / portfolio) * 100,
    };
  }, [portfolioValue, method, entryPrice, stopLoss, takeProfit, riskPercent, winRate, avgWin, avgLoss, atr, atrMultiplier]);

  const riskRewardRatio = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const stop = parseFloat(stopLoss) || 0;
    const target = parseFloat(takeProfit) || 0;
    
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    
    if (risk <= 0) return 0;
    return reward / risk;
  }, [entryPrice, stopLoss, takeProfit]);

  return (
    <div className="position-sizing-panel">
      <div className="ps-header">
        <h3>📐 Position Sizing Calculator</h3>
        <p className="ps-subtitle">Calculate optimal position sizes for risk management</p>
      </div>

      {/* Method Selector */}
      <div className="ps-section">
        <label className="ps-label">Sizing Method</label>
        <div className="ps-method-buttons">
          <button 
            className={`ps-method-btn ${method === 'fixed' ? 'active' : ''}`}
            onClick={() => setMethod('fixed')}
          >
            Fixed %
          </button>
          <button 
            className={`ps-method-btn ${method === 'kelly' ? 'active' : ''}`}
            onClick={() => setMethod('kelly')}
          >
            Kelly
          </button>
          <button 
            className={`ps-method-btn ${method === 'volatility' ? 'active' : ''}`}
            onClick={() => setMethod('volatility')}
          >
            Volatility
          </button>
        </div>
      </div>

      {/* Portfolio Value */}
      <div className="ps-section">
        <label className="ps-label">Portfolio Value ($)</label>
        <input
          type="number"
          className="ps-input"
          value={portfolioValue}
          onChange={(e) => setPortfolioValue(e.target.value)}
          placeholder="10000"
        />
      </div>

      {/* Trade Parameters */}
      <div className="ps-section">
        <label className="ps-label">Trade Parameters</label>
        <div className="ps-row">
          <div className="ps-field">
            <span>Entry $</span>
            <input
              type="number"
              className="ps-input-small"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />
          </div>
          <div className="ps-field">
            <span>Stop $</span>
            <input
              type="number"
              className="ps-input-small"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
          <div className="ps-field">
            <span>Target $</span>
            <input
              type="number"
              className="ps-input-small"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Method-specific inputs */}
      {method === 'fixed' && (
        <div className="ps-section">
          <label className="ps-label">Risk Per Trade (%)</label>
          <input
            type="number"
            className="ps-input"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            placeholder="2"
            min="0.5"
            max="10"
            step="0.5"
          />
          <span className="ps-hint">Recommended: 1-2% for conservative, 2-5% for aggressive</span>
        </div>
      )}

      {method === 'kelly' && (
        <div className="ps-section">
          <label className="ps-label">Kelly Criterion Inputs</label>
          <div className="ps-row">
            <div className="ps-field">
              <span>Win Rate %</span>
              <input
                type="number"
                className="ps-input-small"
                value={winRate}
                onChange={(e) => setWinRate(e.target.value)}
              />
            </div>
            <div className="ps-field">
              <span>Avg Win %</span>
              <input
                type="number"
                className="ps-input-small"
                value={avgWin}
                onChange={(e) => setAvgWin(e.target.value)}
              />
            </div>
            <div className="ps-field">
              <span>Avg Loss %</span>
              <input
                type="number"
                className="ps-input-small"
                value={avgLoss}
                onChange={(e) => setAvgLoss(e.target.value)}
              />
            </div>
          </div>
          <span className="ps-hint">Using Half-Kelly for safety (capped at 25%)</span>
        </div>
      )}

      {method === 'volatility' && (
        <div className="ps-section">
          <label className="ps-label">Volatility Parameters</label>
          <div className="ps-row">
            <div className="ps-field">
              <span>ATR $</span>
              <input
                type="number"
                className="ps-input-small"
                value={atr}
                onChange={(e) => setAtr(e.target.value)}
              />
            </div>
            <div className="ps-field">
              <span>ATR Multiple</span>
              <input
                type="number"
                className="ps-input-small"
                value={atrMultiplier}
                onChange={(e) => setAtrMultiplier(e.target.value)}
              />
            </div>
          </div>
          <span className="ps-hint">Stop at {atrMultiplier}x ATR from entry</span>
        </div>
      )}

      {/* Results */}
      {calculation && (
        <div className="ps-results">
          <div className="ps-result-header">📊 Recommended Position</div>
          
          <div className="ps-result-grid">
            <div className="ps-result-item highlight">
              <span className="ps-result-label">Shares to Buy</span>
              <span className="ps-result-value">{calculation.shares}</span>
            </div>
            <div className="ps-result-item highlight">
              <span className="ps-result-label">Dollar Amount</span>
              <span className="ps-result-value">${calculation.dollarAmount.toFixed(2)}</span>
            </div>
            <div className="ps-result-item">
              <span className="ps-result-label">% of Portfolio</span>
              <span className="ps-result-value">{calculation.percentOfPortfolio.toFixed(1)}%</span>
            </div>
            <div className="ps-result-item">
              <span className="ps-result-label">Risk/Reward</span>
              <span className="ps-result-value">{riskRewardRatio.toFixed(2)}:1</span>
            </div>
            <div className="ps-result-item risk">
              <span className="ps-result-label">$ at Risk</span>
              <span className="ps-result-value">-${calculation.riskAmount.toFixed(2)}</span>
            </div>
            <div className="ps-result-item reward">
              <span className="ps-result-label">$ Potential</span>
              <span className="ps-result-value">+${calculation.rewardAmount.toFixed(2)}</span>
            </div>
          </div>

          {riskRewardRatio < 1.5 && (
            <div className="ps-warning">
              ⚠️ Risk/Reward below 1.5:1 - Consider a better entry or tighter stop
            </div>
          )}
          
          {calculation.percentOfPortfolio > 10 && (
            <div className="ps-warning">
              ⚠️ Position is {'>'}10% of portfolio - High concentration risk
            </div>
          )}
        </div>
      )}

      {/* Educational Footer */}
      <div className="ps-footer">
        <details>
          <summary>📚 Position Sizing Methods</summary>
          <div className="ps-education">
            <p><strong>Fixed Fractional:</strong> Risk a fixed % of portfolio per trade. Simple and consistent.</p>
            <p><strong>Kelly Criterion:</strong> Mathematically optimal sizing based on edge. f* = (bp - q) / b. We use Half-Kelly for safety.</p>
            <p><strong>Volatility-Based:</strong> Size based on ATR (Average True Range). Adapts to market conditions.</p>
            <p className="ps-quote">"Rule #1: Never lose money. Rule #2: Never forget Rule #1." - Warren Buffett</p>
          </div>
        </details>
      </div>
    </div>
  );
}
