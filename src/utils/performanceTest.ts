import { quotesStore, StoredQuote } from '../stores/quotesStore';
import type { Quote, QuoteUpdatePayload } from '../api/contracts/etoro-api.types';

export interface PerformanceMetrics {
  testName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  updateCount: number;
  updatesPerSecond: number;
  avgUpdateTimeMs: number;
  maxUpdateTimeMs: number;
  minUpdateTimeMs: number;
  memoryUsageMB?: number;
}

export interface RenderCycleMetrics {
  frameCount: number;
  totalTimeMs: number;
  avgFrameTimeMs: number;
  fps: number;
  droppedFrames: number;
}

const SYMBOL_NAMES = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
  'WMT', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'NFLX', 'ADBE', 'CRM',
  'INTC', 'CSCO', 'PFE', 'VZ', 'KO', 'PEP', 'ABT', 'NKE', 'MRK', 'T',
  'XOM', 'CVX', 'WFC', 'BAC', 'C', 'GS', 'MS', 'AXP', 'BLK', 'SCHW',
  'AMD', 'QCOM', 'TXN', 'AVGO', 'ORCL', 'IBM', 'NOW', 'SNOW', 'CRM', 'TEAM',
];

function generateSymbolName(index: number): string {
  const base = SYMBOL_NAMES[index % SYMBOL_NAMES.length];
  const suffix = Math.floor(index / SYMBOL_NAMES.length);
  return suffix > 0 ? `${base}${suffix}` : base;
}

function generateRandomQuote(instrumentId: number): QuoteUpdatePayload {
  const basePrice = 100 + Math.random() * 900;
  const spread = basePrice * 0.001;
  const change = (Math.random() - 0.5) * 10;
  
  return {
    instrumentId,
    bid: basePrice - spread / 2,
    ask: basePrice + spread / 2,
    lastPrice: basePrice,
    change,
    changePercent: (change / basePrice) * 100,
  };
}

function generateFullQuote(instrumentId: number): Quote {
  const basePrice = 100 + Math.random() * 900;
  const spread = basePrice * 0.001;
  const change = (Math.random() - 0.5) * 10;
  
  return {
    instrumentId,
    symbol: generateSymbolName(instrumentId),
    displayName: `Test Symbol ${instrumentId}`,
    bid: basePrice - spread / 2,
    ask: basePrice + spread / 2,
    lastPrice: basePrice,
    change,
    changePercent: (change / basePrice) * 100,
    high: basePrice * 1.05,
    low: basePrice * 0.95,
    open: basePrice * 0.99,
    previousClose: basePrice - change,
    volume: Math.floor(Math.random() * 10000000),
    timestamp: new Date().toISOString(),
  };
}

export function simulateLargeWatchlist(symbolCount: number = 200): Quote[] {
  console.log(`[PerformanceTest] Generating ${symbolCount} symbols for watchlist...`);
  const startTime = performance.now();
  
  const quotes: Quote[] = [];
  for (let i = 1; i <= symbolCount; i++) {
    quotes.push(generateFullQuote(i));
  }
  
  const endTime = performance.now();
  console.log(`[PerformanceTest] Generated ${symbolCount} quotes in ${(endTime - startTime).toFixed(2)}ms`);
  
  return quotes;
}

export function populateQuotesStore(symbolCount: number = 200): void {
  console.log(`[PerformanceTest] Populating quotes store with ${symbolCount} symbols...`);
  const startTime = performance.now();
  
  for (let i = 1; i <= symbolCount; i++) {
    quotesStore.updateQuote(i, generateRandomQuote(i));
  }
  
  const endTime = performance.now();
  console.log(`[PerformanceTest] Populated store in ${(endTime - startTime).toFixed(2)}ms`);
}

export interface RapidUpdateOptions {
  symbolCount: number;
  updatesPerSecond: number;
  durationSeconds: number;
  onUpdate?: (metrics: { current: number; total: number; elapsed: number }) => void;
}

export async function simulateRapidQuoteUpdates(
  options: RapidUpdateOptions
): Promise<PerformanceMetrics> {
  const { symbolCount = 200, updatesPerSecond = 60, durationSeconds = 5, onUpdate } = options;
  
  console.log(`[PerformanceTest] Starting rapid update simulation:`);
  console.log(`  - Symbols: ${symbolCount}`);
  console.log(`  - Updates/sec: ${updatesPerSecond}`);
  console.log(`  - Duration: ${durationSeconds}s`);
  
  const intervalMs = 1000 / updatesPerSecond;
  const totalUpdates = updatesPerSecond * durationSeconds * symbolCount;
  const updateTimes: number[] = [];
  
  let updateCount = 0;
  const startTime = performance.now();
  
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const cycleStart = performance.now();
      
      for (let i = 1; i <= symbolCount; i++) {
        quotesStore.updateQuote(i, generateRandomQuote(i));
        updateCount++;
      }
      
      const cycleEnd = performance.now();
      updateTimes.push(cycleEnd - cycleStart);
      
      const elapsed = cycleEnd - startTime;
      onUpdate?.({ current: updateCount, total: totalUpdates, elapsed });
      
      if (elapsed >= durationSeconds * 1000) {
        clearInterval(interval);
        
        const endTime = performance.now();
        const durationMs = endTime - startTime;
        
        const metrics: PerformanceMetrics = {
          testName: 'Rapid Quote Updates',
          startTime,
          endTime,
          durationMs,
          updateCount,
          updatesPerSecond: updateCount / (durationMs / 1000),
          avgUpdateTimeMs: updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length,
          maxUpdateTimeMs: Math.max(...updateTimes),
          minUpdateTimeMs: Math.min(...updateTimes),
          memoryUsageMB: getMemoryUsage(),
        };
        
        logMetrics(metrics);
        resolve(metrics);
      }
    }, intervalMs);
  });
}

export function measureRenderCycles(durationMs: number = 5000): Promise<RenderCycleMetrics> {
  console.log(`[PerformanceTest] Measuring render cycles for ${durationMs}ms...`);
  
  return new Promise((resolve) => {
    const frameTimes: number[] = [];
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let droppedFrames = 0;
    const targetFrameTime = 1000 / 60; // 60 FPS target
    
    const startTime = performance.now();
    
    function measureFrame(currentTime: number) {
      const frameTime = currentTime - lastFrameTime;
      frameTimes.push(frameTime);
      frameCount++;
      
      if (frameTime > targetFrameTime * 1.5) {
        droppedFrames++;
      }
      
      lastFrameTime = currentTime;
      
      if (currentTime - startTime < durationMs) {
        requestAnimationFrame(measureFrame);
      } else {
        const totalTimeMs = performance.now() - startTime;
        const avgFrameTimeMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        
        const metrics: RenderCycleMetrics = {
          frameCount,
          totalTimeMs,
          avgFrameTimeMs,
          fps: frameCount / (totalTimeMs / 1000),
          droppedFrames,
        };
        
        console.log(`[PerformanceTest] Render Cycle Results:`);
        console.log(`  - Frame count: ${frameCount}`);
        console.log(`  - Avg frame time: ${avgFrameTimeMs.toFixed(2)}ms`);
        console.log(`  - FPS: ${metrics.fps.toFixed(2)}`);
        console.log(`  - Dropped frames: ${droppedFrames}`);
        
        resolve(metrics);
      }
    }
    
    requestAnimationFrame(measureFrame);
  });
}

export function getMemoryUsage(): number | undefined {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    if (memory) {
      return memory.usedJSHeapSize / (1024 * 1024);
    }
  }
  return undefined;
}

function logMetrics(metrics: PerformanceMetrics): void {
  console.log(`\n[PerformanceTest] ===== ${metrics.testName} Results =====`);
  console.log(`  Duration: ${metrics.durationMs.toFixed(2)}ms`);
  console.log(`  Total updates: ${metrics.updateCount}`);
  console.log(`  Updates/sec: ${metrics.updatesPerSecond.toFixed(2)}`);
  console.log(`  Avg update time: ${metrics.avgUpdateTimeMs.toFixed(2)}ms`);
  console.log(`  Max update time: ${metrics.maxUpdateTimeMs.toFixed(2)}ms`);
  console.log(`  Min update time: ${metrics.minUpdateTimeMs.toFixed(2)}ms`);
  if (metrics.memoryUsageMB !== undefined) {
    console.log(`  Memory usage: ${metrics.memoryUsageMB.toFixed(2)}MB`);
  }
  console.log(`================================================\n`);
}

export async function runFullPerformanceTest(): Promise<{
  watchlistTest: PerformanceMetrics;
  rapidUpdateTest: PerformanceMetrics;
  renderTest: RenderCycleMetrics;
}> {
  console.log('\n[PerformanceTest] ========================================');
  console.log('[PerformanceTest] STARTING FULL PERFORMANCE TEST SUITE');
  console.log('[PerformanceTest] ========================================\n');
  
  // Test 1: Watchlist with 200 symbols
  const watchlistStartTime = performance.now();
  populateQuotesStore(200);
  const watchlistEndTime = performance.now();
  
  const watchlistTest: PerformanceMetrics = {
    testName: 'Watchlist Population (200 symbols)',
    startTime: watchlistStartTime,
    endTime: watchlistEndTime,
    durationMs: watchlistEndTime - watchlistStartTime,
    updateCount: 200,
    updatesPerSecond: 200 / ((watchlistEndTime - watchlistStartTime) / 1000),
    avgUpdateTimeMs: (watchlistEndTime - watchlistStartTime) / 200,
    maxUpdateTimeMs: (watchlistEndTime - watchlistStartTime) / 200,
    minUpdateTimeMs: (watchlistEndTime - watchlistStartTime) / 200,
    memoryUsageMB: getMemoryUsage(),
  };
  logMetrics(watchlistTest);
  
  // Test 2: Rapid quote updates
  const rapidUpdateTest = await simulateRapidQuoteUpdates({
    symbolCount: 200,
    updatesPerSecond: 60,
    durationSeconds: 3,
  });
  
  // Test 3: Render cycle measurement
  const renderTest = await measureRenderCycles(3000);
  
  console.log('\n[PerformanceTest] ========================================');
  console.log('[PerformanceTest] PERFORMANCE TEST SUITE COMPLETE');
  console.log('[PerformanceTest] ========================================\n');
  
  return { watchlistTest, rapidUpdateTest, renderTest };
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as Window & { performanceTest?: typeof import('./performanceTest') }).performanceTest = {
    simulateLargeWatchlist,
    populateQuotesStore,
    simulateRapidQuoteUpdates,
    measureRenderCycles,
    getMemoryUsage,
    runFullPerformanceTest,
  };
}
