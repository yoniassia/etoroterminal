import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Panel from '../Workspace/Panel';
import { usePanelLink } from '../Workspace/usePanelLink';
import { LinkGroup } from '../Workspace/ActiveSymbolContext';
import { quotesStore, StoredQuote } from '../../stores/quotesStore';
import { symbolResolver, ResolvedSymbol } from '../../services/symbolResolver';
import { WS_TOPICS } from '../../api/contracts/endpoints';
import './ChartPanel.css';

type Timeframe = '1m' | '5m' | '15m';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface AggregatedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartPanelProps {
  id: string;
  initialSymbol?: string;
  initialLinkGroup?: LinkGroup;
  onClose?: (id: string) => void;
  wsSubscribe?: (topic: string) => void;
  wsUnsubscribe?: (topic: string) => void;
}

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
};

const MAX_TICKS = 500;
const MAX_CACHED_TICKS = 1000;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = 'chart_ticks_';
const CHART_PADDING = 20;

interface CachedChartData {
  instrumentId: number;
  ticks: PricePoint[];
  cachedAt: number;
}

function getCacheKey(instrumentId: number): string {
  return `${CACHE_KEY_PREFIX}${instrumentId}`;
}

function loadCachedTicks(instrumentId: number): PricePoint[] {
  try {
    const key = getCacheKey(instrumentId);
    const cached = sessionStorage.getItem(key);
    if (!cached) return [];

    const data: CachedChartData = JSON.parse(cached);
    
    if (Date.now() - data.cachedAt > CACHE_EXPIRY_MS) {
      sessionStorage.removeItem(key);
      return [];
    }

    return data.ticks || [];
  } catch {
    return [];
  }
}

function saveCachedTicks(instrumentId: number, ticks: PricePoint[]): void {
  try {
    const key = getCacheKey(instrumentId);
    const ticksToCache = ticks.slice(-MAX_CACHED_TICKS);
    const data: CachedChartData = {
      instrumentId,
      ticks: ticksToCache,
      cachedAt: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function clearCachedTicks(instrumentId: number): void {
  try {
    const key = getCacheKey(instrumentId);
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

function formatPrice(price: number): string {
  if (price === 0) return '--';
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}

export default function ChartPanel({
  id,
  initialSymbol,
  initialLinkGroup = 'A',
  onClose,
  wsSubscribe,
  wsUnsubscribe,
}: ChartPanelProps) {
  const {
    currentSymbol,
    linkGroup,
    isPinned,
    setLinkGroup,
    togglePin,
    pin,
  } = usePanelLink(initialLinkGroup);

  const [resolvedSymbol, setResolvedSymbol] = useState<ResolvedSymbol | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [ticks, setTicks] = useState<PricePoint[]>([]);
  const [currentQuote, setCurrentQuote] = useState<StoredQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const subscribedInstrumentRef = useRef<number | null>(null);

  const effectiveSymbol = isPinned ? currentSymbol : (currentSymbol || initialSymbol || null);

  useEffect(() => {
    if (initialSymbol && !currentSymbol) {
      pin(initialSymbol);
    }
  }, [initialSymbol, currentSymbol, pin]);

  useEffect(() => {
    if (!effectiveSymbol) {
      setResolvedSymbol(null);
      setTicks([]);
      setCurrentQuote(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    symbolResolver.resolveSymbol(effectiveSymbol).then((resolved) => {
      if (cancelled) return;
      setIsLoading(false);

      if (resolved) {
        setResolvedSymbol(resolved);
        const cachedTicks = loadCachedTicks(resolved.instrumentId);
        setTicks(cachedTicks);
      } else {
        setResolvedSymbol(null);
        setTicks([]);
        setError(`Symbol not found: ${effectiveSymbol}`);
      }
    }).catch((err) => {
      if (cancelled) return;
      setIsLoading(false);
      setError(`Failed to resolve symbol: ${err.message}`);
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveSymbol]);

  const handleQuoteUpdate = useCallback((quote: StoredQuote) => {
    setCurrentQuote(quote);
    const newPoint: PricePoint = {
      timestamp: quote.receivedAt,
      price: quote.lastPrice,
    };
    setTicks((prev) => {
      const updated = [...prev, newPoint];
      if (updated.length > MAX_TICKS) {
        return updated.slice(-MAX_TICKS);
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (resolvedSymbol && ticks.length > 0) {
      saveCachedTicks(resolvedSymbol.instrumentId, ticks);
    }
  }, [resolvedSymbol, ticks]);

  const handleClearCache = useCallback(() => {
    if (resolvedSymbol) {
      clearCachedTicks(resolvedSymbol.instrumentId);
      setTicks([]);
    }
  }, [resolvedSymbol]);

  useEffect(() => {
    if (!resolvedSymbol) {
      if (subscribedInstrumentRef.current !== null && wsUnsubscribe) {
        const topic = WS_TOPICS.QUOTES_INSTRUMENT(subscribedInstrumentRef.current);
        wsUnsubscribe(topic);
        subscribedInstrumentRef.current = null;
      }
      return;
    }

    const instrumentId = resolvedSymbol.instrumentId;

    if (subscribedInstrumentRef.current !== null && subscribedInstrumentRef.current !== instrumentId) {
      if (wsUnsubscribe) {
        const oldTopic = WS_TOPICS.QUOTES_INSTRUMENT(subscribedInstrumentRef.current);
        wsUnsubscribe(oldTopic);
      }
    }

    const topic = WS_TOPICS.QUOTES_INSTRUMENT(instrumentId);
    if (wsSubscribe) {
      wsSubscribe(topic);
    }
    subscribedInstrumentRef.current = instrumentId;

    const existingQuote = quotesStore.getQuote(instrumentId);
    if (existingQuote) {
      handleQuoteUpdate(existingQuote);
    }

    const unsubscribe = quotesStore.subscribe(instrumentId, handleQuoteUpdate);

    return () => {
      unsubscribe();
    };
  }, [resolvedSymbol, wsSubscribe, wsUnsubscribe, handleQuoteUpdate]);

  useEffect(() => {
    return () => {
      if (subscribedInstrumentRef.current !== null && wsUnsubscribe) {
        const topic = WS_TOPICS.QUOTES_INSTRUMENT(subscribedInstrumentRef.current);
        wsUnsubscribe(topic);
      }
    };
  }, [wsUnsubscribe]);

  const aggregatedData = useMemo((): AggregatedCandle[] => {
    if (ticks.length === 0) return [];

    const intervalMs = TIMEFRAME_MS[timeframe];
    const candles: Map<number, AggregatedCandle> = new Map();

    for (const tick of ticks) {
      const candleTime = Math.floor(tick.timestamp / intervalMs) * intervalMs;
      const existing = candles.get(candleTime);

      if (existing) {
        existing.high = Math.max(existing.high, tick.price);
        existing.low = Math.min(existing.low, tick.price);
        existing.close = tick.price;
      } else {
        candles.set(candleTime, {
          timestamp: candleTime,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
        });
      }
    }

    return Array.from(candles.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [ticks, timeframe]);

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
  }, []);

  const drawChart = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = CHART_PADDING + ((height - 2 * CHART_PADDING) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(CHART_PADDING, y);
      ctx.lineTo(width - CHART_PADDING, y);
      ctx.stroke();
    }

    if (aggregatedData.length < 2) {
      ctx.fillStyle = '#444';
      ctx.font = '14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for data...', width / 2, height / 2);
      return;
    }

    const prices = aggregatedData.map(c => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const chartWidth = width - 2 * CHART_PADDING;
    const chartHeight = height - 2 * CHART_PADDING;

    const scaleX = (index: number) => CHART_PADDING + (index / (aggregatedData.length - 1)) * chartWidth;
    const scaleY = (price: number) => height - CHART_PADDING - ((price - minPrice) / priceRange) * chartHeight;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < aggregatedData.length; i++) {
      const x = scaleX(i);
      const y = scaleY(aggregatedData[i].close);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    const lastCandle = aggregatedData[aggregatedData.length - 1];
    const lastX = scaleX(aggregatedData.length - 1);
    const lastY = scaleY(lastCandle.close);

    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(formatPrice(maxPrice), width - 5, CHART_PADDING + 10);
    ctx.fillText(formatPrice(minPrice), width - 5, height - CHART_PADDING);
  }, [aggregatedData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawChart(ctx, canvas.width, canvas.height);
  }, [aggregatedData, drawChart]);

  const renderNoSymbol = () => (
    <div className="chart-panel-no-symbol">
      <div className="chart-panel-no-symbol-icon">[~]</div>
      <div className="chart-panel-no-symbol-text">
        No symbol selected.<br />
        Use the command bar to select a symbol.
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="chart-panel-loading">
      <span className="chart-panel-loading-spinner">[...]</span>
      <span style={{ marginLeft: 8 }}>Loading...</span>
    </div>
  );

  const renderError = () => (
    <div className="chart-panel-no-symbol">
      <div className="chart-panel-no-symbol-icon">[!]</div>
      <div className="chart-panel-no-symbol-text" style={{ color: '#ff4444' }}>
        {error}
      </div>
    </div>
  );

  const changeClass = currentQuote
    ? (currentQuote.change ?? 0) > 0 ? 'positive' : (currentQuote.change ?? 0) < 0 ? 'negative' : 'neutral'
    : 'neutral';

  const renderChart = () => {
    if (!resolvedSymbol) return renderNoSymbol();

    return (
      <div className="chart-panel">
        <div className="chart-panel-header">
          <div className="chart-panel-info">
            <span className="chart-panel-symbol">{resolvedSymbol.symbol}</span>
            <span className="chart-panel-price">
              {currentQuote ? formatPrice(currentQuote.lastPrice) : '--'}
            </span>
            <span className={`chart-panel-change ${changeClass}`}>
              {currentQuote ? formatChange(currentQuote.change ?? 0, currentQuote.changePercent ?? 0) : '--'}
            </span>
          </div>
          <div className="chart-panel-controls">
            {(['1m', '5m', '15m'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                className={`chart-panel-tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-panel-canvas-container" ref={containerRef}>
          <canvas ref={canvasRef} className="chart-panel-canvas" />
        </div>
        <div className="chart-panel-footer">
          <span className="chart-panel-tick-count">{ticks.length} ticks</span>
          <span className="chart-panel-candle-count">{aggregatedData.length} candles ({timeframe})</span>
          <button
            className="chart-panel-clear-btn"
            onClick={handleClearCache}
            title="Clear cached chart data"
          >
            [CLR]
          </button>
        </div>
      </div>
    );
  };

  const panelTitle = resolvedSymbol ? `Chart: ${resolvedSymbol.symbol}` : 'Chart';

  return (
    <Panel
      id={id}
      title={panelTitle}
      onClose={onClose}
      linkGroup={linkGroup}
      isPinned={isPinned}
      onLinkGroupChange={setLinkGroup}
      onPinToggle={togglePin}
    >
      {isLoading ? renderLoading() : error ? renderError() : renderChart()}
    </Panel>
  );
}
