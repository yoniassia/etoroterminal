import { useState, useEffect, useCallback, useRef } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import { compareStore } from '../../stores/compareStore';
import { getTradersAdapter, Trader } from '../../api/adapters/tradersAdapter';
import './TraderProfilePanel.css';

export interface TraderProfile {
  username: string;
  displayName: string;
  avatarUrl?: string;
  country?: string;
  isPopularInvestor: boolean;
  riskScore: number;
  gain: number;
  maxDrawdown: number;
  copiers: number;
  copiersGrowth?: number;
  winRatio?: number;
  profitableMonths?: number;
  totalTrades?: number;
  activeSince?: string;
  canCopy: boolean;
}

export interface TraderHolding {
  instrumentId: number;
  symbol: string;
  displayName: string;
  allocation: number;
  profit?: number;
}

export interface TraderPerformancePoint {
  date: string;
  value: number;
}

interface TraderProfilePanelProps extends PanelContentProps {
  traderId?: string;
  onCopyTrader?: (username: string) => void;
}

const MOCK_HOLDINGS: TraderHolding[] = [
  { instrumentId: 1, symbol: 'AAPL', displayName: 'Apple Inc.', allocation: 18.5, profit: 12.3 },
  { instrumentId: 2, symbol: 'MSFT', displayName: 'Microsoft Corp.', allocation: 15.2, profit: 8.7 },
  { instrumentId: 3, symbol: 'GOOGL', displayName: 'Alphabet Inc.', allocation: 12.8, profit: -2.1 },
  { instrumentId: 4, symbol: 'TSLA', displayName: 'Tesla Inc.', allocation: 10.4, profit: 22.5 },
  { instrumentId: 5, symbol: 'NVDA', displayName: 'NVIDIA Corp.', allocation: 9.1, profit: 45.2 },
];

const MOCK_PERFORMANCE: TraderPerformancePoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  value: 100 + Math.sin(i / 5) * 10 + i * 1.2 + Math.random() * 5,
}));

const CHART_PADDING = 10;

export default function TraderProfilePanel({ traderId, onCopyTrader }: TraderProfilePanelProps) {
  const [trader, setTrader] = useState<TraderProfile | null>(null);
  const [holdings, setHoldings] = useState<TraderHolding[]>([]);
  const [performance, setPerformance] = useState<TraderPerformancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [isInCompare, setIsInCompare] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trader) {
      setIsInCompare(compareStore.isInCompare(traderId || trader.username));
    }
    const unsubscribe = compareStore.subscribe(() => {
      if (trader) {
        setIsInCompare(compareStore.isInCompare(traderId || trader.username));
      }
    });
    return unsubscribe;
  }, [trader, traderId]);

  const fetchTraderProfile = useCallback(async () => {
    if (!traderId) {
      setTrader(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adapter = getTradersAdapter();
      const data: Trader = await adapter.getTraderProfile(traderId);
      
      const profile: TraderProfile = {
        username: data.username,
        displayName: data.displayName || data.username,
        avatarUrl: data.avatarUrl,
        country: data.country,
        isPopularInvestor: data.isVerified || false,
        riskScore: data.riskScore,
        gain: data.gainPercent,
        maxDrawdown: -10,
        copiers: data.copiers,
        copiersGrowth: undefined,
        winRatio: data.profitableTrades && data.trades ? Math.round((data.profitableTrades / data.trades) * 100) : undefined,
        profitableMonths: undefined,
        totalTrades: data.trades,
        activeSince: undefined,
        canCopy: true,
      };
      
      setTrader(profile);
      setHoldings(MOCK_HOLDINGS);
      setPerformance(MOCK_PERFORMANCE);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch trader profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [traderId]);

  useEffect(() => {
    fetchTraderProfile();
  }, [fetchTraderProfile]);

  const drawChart = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    if (performance.length < 2) {
      ctx.fillStyle = '#444';
      ctx.font = '12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('No performance data', width / 2, height / 2);
      return;
    }

    const values = performance.map(p => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const chartWidth = width - 2 * CHART_PADDING;
    const chartHeight = height - 2 * CHART_PADDING;

    const scaleX = (index: number) => CHART_PADDING + (index / (performance.length - 1)) * chartWidth;
    const scaleY = (value: number) => height - CHART_PADDING - ((value - minValue) / valueRange) * chartHeight;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = CHART_PADDING + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(CHART_PADDING, y);
      ctx.lineTo(width - CHART_PADDING, y);
      ctx.stroke();
    }

    const isPositive = values[values.length - 1] >= values[0];
    ctx.strokeStyle = isPositive ? '#00ff00' : '#ff4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < performance.length; i++) {
      const x = scaleX(i);
      const y = scaleY(performance[i].value);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    const lastX = scaleX(performance.length - 1);
    const lastY = scaleY(values[values.length - 1]);
    ctx.fillStyle = isPositive ? '#00ff00' : '#ff4444';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [performance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        drawChart(ctx, width, height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [drawChart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, canvas.width, canvas.height);
  }, [performance, drawChart]);

  const handleCopyTrader = useCallback(async () => {
    if (!trader || !trader.canCopy) return;
    setCopying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (onCopyTrader) {
        onCopyTrader(trader.username);
      }
    } catch {
      setError('Failed to copy trader');
    } finally {
      setCopying(false);
    }
  }, [trader, onCopyTrader]);

  const handleRefresh = useCallback(() => {
    fetchTraderProfile();
  }, [fetchTraderProfile]);

  const handleAddToCompare = useCallback(() => {
    if (!trader) return;
    const userId = traderId || trader.username;
    if (isInCompare) {
      compareStore.removeTrader(userId);
    } else {
      compareStore.addTrader({
        userId,
        username: trader.username,
        displayName: trader.displayName,
        gainPercent: trader.gain,
        maxDrawdown: trader.maxDrawdown,
        riskScore: trader.riskScore as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        copiers: trader.copiers,
      });
    }
  }, [trader, traderId, isInCompare]);

  const getRiskScoreClass = (score: number): string => {
    if (score <= 3) return 'trader-profile__risk--low';
    if (score <= 6) return 'trader-profile__risk--medium';
    return 'trader-profile__risk--high';
  };

  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getPercentClass = (value: number): string => {
    if (value > 0) return 'trader-profile__value--positive';
    if (value < 0) return 'trader-profile__value--negative';
    return 'trader-profile__value--neutral';
  };

  if (loading) {
    return (
      <div className="trader-profile">
        <div className="trader-profile__loading">▓▓▓ LOADING PROFILE ▓▓▓</div>
      </div>
    );
  }

  if (error && !trader) {
    return (
      <div className="trader-profile">
        <div className="trader-profile__error">✗ ERROR: {error}</div>
        <button className="trader-profile__refresh" onClick={handleRefresh}>
          [ RETRY ]
        </button>
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="trader-profile">
        <div className="trader-profile__empty">
          <div className="trader-profile__empty-icon">☐</div>
          <div>No trader selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="trader-profile">
      <div className="trader-profile__header">
        <span className="trader-profile__title">&gt; TRADER PROFILE</span>
        <button
          className="trader-profile__refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? '[ ... ]' : '[ ↻ ]'}
        </button>
      </div>

      <div className="trader-profile__content">
        <div className="trader-profile__identity">
          <div className="trader-profile__avatar">
            {trader.avatarUrl ? (
              <img src={trader.avatarUrl} alt={trader.username} />
            ) : (
              <div className="trader-profile__avatar-placeholder">
                {trader.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="trader-profile__info">
            <div className="trader-profile__username">
              {trader.displayName}
              {trader.isPopularInvestor && (
                <span className="trader-profile__badge">★ PI</span>
              )}
            </div>
            <div className="trader-profile__handle">@{trader.username}</div>
            {trader.country && (
              <div className="trader-profile__country">{trader.country}</div>
            )}
            {trader.activeSince && (
              <div className="trader-profile__since">
                Active since {new Date(trader.activeSince).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="trader-profile__metrics">
          <div className="trader-profile__metric">
            <span className="trader-profile__metric-label">GAIN</span>
            <span className={`trader-profile__metric-value ${getPercentClass(trader.gain)}`}>
              {formatPercent(trader.gain)}
            </span>
          </div>
          <div className="trader-profile__metric">
            <span className="trader-profile__metric-label">MAX DRAWDOWN</span>
            <span className={`trader-profile__metric-value ${getPercentClass(trader.maxDrawdown)}`}>
              {formatPercent(trader.maxDrawdown)}
            </span>
          </div>
          <div className="trader-profile__metric">
            <span className="trader-profile__metric-label">RISK</span>
            <span className={`trader-profile__metric-value ${getRiskScoreClass(trader.riskScore)}`}>
              {trader.riskScore}/10
            </span>
          </div>
          <div className="trader-profile__metric">
            <span className="trader-profile__metric-label">COPIERS</span>
            <span className="trader-profile__metric-value">
              {trader.copiers.toLocaleString()}
              {trader.copiersGrowth !== undefined && (
                <span className={`trader-profile__metric-growth ${getPercentClass(trader.copiersGrowth)}`}>
                  ({formatPercent(trader.copiersGrowth)})
                </span>
              )}
            </span>
          </div>
          {trader.winRatio !== undefined && (
            <div className="trader-profile__metric">
              <span className="trader-profile__metric-label">WIN RATIO</span>
              <span className="trader-profile__metric-value">{trader.winRatio}%</span>
            </div>
          )}
          {trader.profitableMonths !== undefined && (
            <div className="trader-profile__metric">
              <span className="trader-profile__metric-label">PROFIT MONTHS</span>
              <span className="trader-profile__metric-value">{trader.profitableMonths}</span>
            </div>
          )}
        </div>

        <div className="trader-profile__section">
          <div className="trader-profile__section-header">PERFORMANCE (30D)</div>
          <div className="trader-profile__chart-container" ref={containerRef}>
            <canvas ref={canvasRef} className="trader-profile__chart" />
          </div>
        </div>

        <div className="trader-profile__section">
          <div className="trader-profile__section-header">TOP HOLDINGS</div>
          <div className="trader-profile__holdings">
            {holdings.length === 0 ? (
              <div className="trader-profile__holdings-empty">No holdings data</div>
            ) : (
              <table className="trader-profile__holdings-table">
                <thead>
                  <tr>
                    <th>SYMBOL</th>
                    <th>ALLOC</th>
                    <th>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.instrumentId}>
                      <td>
                        <span className="trader-profile__holding-symbol">{holding.symbol}</span>
                        <span className="trader-profile__holding-name">{holding.displayName}</span>
                      </td>
                      <td className="trader-profile__holding-allocation">
                        {holding.allocation.toFixed(1)}%
                      </td>
                      <td className={`trader-profile__holding-profit ${getPercentClass(holding.profit || 0)}`}>
                        {holding.profit !== undefined ? formatPercent(holding.profit) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="trader-profile__actions">
          <button
            className={`trader-profile__compare-btn ${isInCompare ? 'trader-profile__compare-btn--active' : ''}`}
            onClick={handleAddToCompare}
            disabled={!isInCompare && compareStore.isFull()}
          >
            {isInCompare ? '[ REMOVE FROM COMPARE ]' : compareStore.isFull() ? '[ COMPARE FULL ]' : '[ ADD TO COMPARE ]'}
          </button>
          <button
            className="trader-profile__copy-btn"
            onClick={handleCopyTrader}
            disabled={!trader.canCopy || copying}
          >
            {copying ? 'COPYING...' : trader.canCopy ? 'COPY TRADER' : 'COPY NOT AVAILABLE'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { TraderProfilePanel };
