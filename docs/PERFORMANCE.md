# Performance Baselines

This document defines performance targets and baselines for the eToro Terminal application.

## Target Metrics

### Frame Rate
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| FPS (idle) | 60 | 55+ | <30 |
| FPS (active trading) | 60 | 45+ | <30 |
| Dropped frames/min | 0 | <5 | >20 |

### Memory Limits
| Scenario | Target | Warning | Critical |
|----------|--------|---------|----------|
| Initial load | <50 MB | 75 MB | >100 MB |
| 200 symbol watchlist | <100 MB | 150 MB | >200 MB |
| Extended session (1hr) | <150 MB | 200 MB | >300 MB |

### Quote Update Performance
| Metric | Target | Acceptable |
|--------|--------|------------|
| Updates/second (200 symbols) | 12,000+ | 6,000+ |
| Single update cycle (200 symbols) | <16ms | <33ms |
| Store population (200 symbols) | <10ms | <50ms |

### Render Cycle Targets
| Metric | Target | Acceptable |
|--------|--------|------------|
| Average frame time | <16.67ms | <33ms |
| Max frame time | <50ms | <100ms |
| Frame time variance | <5ms | <10ms |

## Performance Test Utilities

### Running Performance Tests

The performance test utilities are available in `src/utils/performanceTest.ts`.

#### Browser Console Usage

```javascript
// Run full performance test suite
window.performanceTest.runFullPerformanceTest();

// Individual tests
window.performanceTest.populateQuotesStore(200);
window.performanceTest.simulateRapidQuoteUpdates({
  symbolCount: 200,
  updatesPerSecond: 60,
  durationSeconds: 5
});
window.performanceTest.measureRenderCycles(5000);
```

#### Import Usage

```typescript
import {
  simulateLargeWatchlist,
  populateQuotesStore,
  simulateRapidQuoteUpdates,
  measureRenderCycles,
  runFullPerformanceTest
} from './utils/performanceTest';

// Generate 200 mock quotes
const quotes = simulateLargeWatchlist(200);

// Populate the quotes store
populateQuotesStore(200);

// Simulate rapid updates
const metrics = await simulateRapidQuoteUpdates({
  symbolCount: 200,
  updatesPerSecond: 60,
  durationSeconds: 5,
  onUpdate: ({ current, total, elapsed }) => {
    console.log(`Progress: ${current}/${total} (${elapsed}ms)`);
  }
});

// Measure render performance
const renderMetrics = await measureRenderCycles(5000);
```

## Test Scenarios

### 1. Large Watchlist Test
- **Goal**: Verify UI remains responsive with 200 symbols
- **Method**: Populate quotes store with 200 symbols, measure render cycles
- **Pass criteria**: FPS > 45, no visible lag

### 2. Rapid Quote Updates Test
- **Goal**: Verify system handles real-time quote streaming
- **Method**: Simulate 60 updates/second for 200 symbols (12,000 updates/sec)
- **Pass criteria**: All updates processed, no backlog, memory stable

### 3. Chart Rapid Updates Test
- **Goal**: Verify chart component handles frequent price changes
- **Method**: Update chart data at 60Hz
- **Pass criteria**: Chart renders smoothly, no dropped frames

### 4. Memory Stability Test
- **Goal**: Verify no memory leaks during extended use
- **Method**: Run rapid updates for 10 minutes, monitor heap size
- **Pass criteria**: Memory stays within 200MB, no continuous growth

## Optimization Guidelines

### Quote Updates
1. Use throttling for UI updates (max 30 updates/sec per component)
2. Batch DOM updates using requestAnimationFrame
3. Implement virtual scrolling for large watchlists

### Memory Management
1. Limit quote history retention (keep last 1000 points)
2. Clear unused subscriptions on component unmount
3. Use WeakMap for component-specific caches

### Rendering
1. Memoize expensive calculations with useMemo/React.memo
2. Virtualize lists with more than 50 items
3. Debounce resize/scroll handlers (100ms)

## Baseline Measurements

Run `window.performanceTest.runFullPerformanceTest()` in the browser console and record results here after each significant change.

### Baseline (Initial Implementation)
- Date: [Record date]
- Browser: Chrome [version]
- Watchlist population (200 symbols): [x]ms
- Rapid updates (200 symbols @ 60Hz): [x] updates/sec
- Render FPS: [x]
- Memory (200 symbols): [x]MB

## Monitoring in Production

Consider implementing:
1. Performance Observer API for Long Tasks
2. Web Vitals reporting (LCP, FID, CLS)
3. Memory usage tracking via Performance.memory
4. Custom metrics for trade execution latency
