/**
 * Demo Data Service
 * Provides mock data for agents and users to test the terminal without eToro credentials
 * Enable with: localStorage.setItem('demo_mode', 'true')
 */

export interface DemoPosition {
  positionId: number;
  instrumentId: number;
  symbol: string;
  name: string;
  isBuy: boolean;
  amount: number;
  leverage: number;
  units: number;
  openRate: number;
  currentRate: number;
  openDateTime: string;
  profit: number;
  profitPercent: number;
}

export interface DemoPortfolio {
  totalValue: number;
  equity: number;
  availableBalance: number;
  profit: number;
  profitPercent: number;
  positions: DemoPosition[];
}

export interface DemoWatchlistItem {
  instrumentId: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface DemoQuote {
  instrumentId: number;
  symbol: string;
  name: string;
  price: number;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  week52High: number;
  week52Low: number;
}

// Demo mode flag
export const isDemoMode = (): boolean => {
  return localStorage.getItem('demo_mode') === 'true';
};

export const setDemoMode = (enabled: boolean): void => {
  localStorage.setItem('demo_mode', enabled ? 'true' : 'false');
};

// Mock positions for demo portfolio
const DEMO_POSITIONS: DemoPosition[] = [
  {
    positionId: 1001,
    instrumentId: 1001,
    symbol: 'AAPL',
    name: 'Apple Inc',
    isBuy: true,
    amount: 5000,
    leverage: 1,
    units: 25.5,
    openRate: 185.50,
    currentRate: 196.20,
    openDateTime: '2024-11-15T10:30:00Z',
    profit: 272.85,
    profitPercent: 5.77,
  },
  {
    positionId: 1002,
    instrumentId: 1002,
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    isBuy: true,
    amount: 8000,
    leverage: 1,
    units: 15.2,
    openRate: 480.25,
    currentRate: 526.50,
    openDateTime: '2024-10-22T14:15:00Z',
    profit: 703.00,
    profitPercent: 9.63,
  },
  {
    positionId: 1003,
    instrumentId: 1003,
    symbol: 'TSLA',
    name: 'Tesla Inc',
    isBuy: true,
    amount: 3000,
    leverage: 2,
    units: 24.0,
    openRate: 250.00,
    currentRate: 242.80,
    openDateTime: '2025-01-05T09:45:00Z',
    profit: -172.80,
    profitPercent: -2.88,
  },
  {
    positionId: 1004,
    instrumentId: 1004,
    symbol: 'GOOGL',
    name: 'Alphabet Inc',
    isBuy: true,
    amount: 4500,
    leverage: 1,
    units: 25.7,
    openRate: 165.00,
    currentRate: 175.10,
    openDateTime: '2024-12-10T11:00:00Z',
    profit: 259.57,
    profitPercent: 6.12,
  },
  {
    positionId: 1005,
    instrumentId: 1005,
    symbol: 'BTC',
    name: 'Bitcoin',
    isBuy: true,
    amount: 10000,
    leverage: 1,
    units: 0.15,
    openRate: 62000.00,
    currentRate: 66750.00,
    openDateTime: '2024-09-20T08:00:00Z',
    profit: 712.50,
    profitPercent: 7.66,
  },
];

// Watchlist items
const DEMO_WATCHLIST: DemoWatchlistItem[] = [
  { instrumentId: 1001, symbol: 'AAPL', name: 'Apple Inc', price: 196.20, change: 2.45, changePercent: 1.26, volume: 52300000 },
  { instrumentId: 1002, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 526.50, change: 12.30, changePercent: 2.39, volume: 41200000 },
  { instrumentId: 1003, symbol: 'TSLA', name: 'Tesla Inc', price: 242.80, change: -5.20, changePercent: -2.10, volume: 98500000 },
  { instrumentId: 1004, symbol: 'GOOGL', name: 'Alphabet Inc', price: 175.10, change: 1.85, changePercent: 1.07, volume: 22100000 },
  { instrumentId: 1005, symbol: 'BTC', name: 'Bitcoin', price: 66750.00, change: 1250.00, changePercent: 1.91, volume: 28000000000 },
  { instrumentId: 1006, symbol: 'MSFT', name: 'Microsoft Corp', price: 415.80, change: 3.20, changePercent: 0.78, volume: 18900000 },
  { instrumentId: 1007, symbol: 'AMZN', name: 'Amazon.com Inc', price: 186.50, change: -1.10, changePercent: -0.59, volume: 35400000 },
  { instrumentId: 1008, symbol: 'META', name: 'Meta Platforms', price: 512.30, change: 8.70, changePercent: 1.73, volume: 14200000 },
  { instrumentId: 1009, symbol: 'ETH', name: 'Ethereum', price: 3420.00, change: 85.00, changePercent: 2.55, volume: 15000000000 },
  { instrumentId: 1010, symbol: 'AMD', name: 'Advanced Micro Devices', price: 124.60, change: 2.90, changePercent: 2.38, volume: 45600000 },
];

// Get demo portfolio
export const getDemoPortfolio = (): DemoPortfolio => {
  const totalProfit = DEMO_POSITIONS.reduce((sum, p) => sum + p.profit, 0);
  const totalInvested = DEMO_POSITIONS.reduce((sum, p) => sum + p.amount, 0);
  
  return {
    totalValue: 50000 + totalProfit,
    equity: 50000 + totalProfit,
    availableBalance: 19500,
    profit: totalProfit,
    profitPercent: (totalProfit / totalInvested) * 100,
    positions: DEMO_POSITIONS,
  };
};

// Get demo positions
export const getDemoPositions = (): DemoPosition[] => {
  return DEMO_POSITIONS;
};

// Get demo watchlist
export const getDemoWatchlist = (): DemoWatchlistItem[] => {
  return DEMO_WATCHLIST;
};

// Get demo quote for a symbol
export const getDemoQuote = (symbol: string): DemoQuote | null => {
  const item = DEMO_WATCHLIST.find(w => w.symbol.toUpperCase() === symbol.toUpperCase());
  if (!item) return null;
  
  const price = item.price;
  return {
    instrumentId: item.instrumentId,
    symbol: item.symbol,
    name: item.name,
    price: price,
    bid: price - (price * 0.001),
    ask: price + (price * 0.001),
    open: price - item.change,
    high: price * 1.02,
    low: price * 0.98,
    close: price,
    change: item.change,
    changePercent: item.changePercent,
    volume: item.volume,
    marketCap: price * 1000000000 * (Math.random() * 2 + 1),
    pe: 15 + Math.random() * 30,
    eps: price / (15 + Math.random() * 30),
    week52High: price * 1.25,
    week52Low: price * 0.65,
  };
};

// Demo user info
export const getDemoUserInfo = () => ({
  username: 'DemoTrader',
  fullName: 'Demo Account',
  customerId: 'DEMO-12345',
});

// Demo alerts
export const getDemoAlerts = () => [
  { id: 1, symbol: 'AAPL', type: 'price_above', value: 200, triggered: false, createdAt: '2025-01-20T10:00:00Z' },
  { id: 2, symbol: 'TSLA', type: 'price_below', value: 240, triggered: true, createdAt: '2025-01-15T14:30:00Z' },
  { id: 3, symbol: 'BTC', type: 'price_above', value: 70000, triggered: false, createdAt: '2025-01-10T09:00:00Z' },
];

// Demo orders (blotter)
export const getDemoOrders = () => [
  { orderId: 'ORD-001', symbol: 'AAPL', side: 'BUY', quantity: 10, price: 195.50, status: 'FILLED', timestamp: '2025-01-28T10:30:00Z' },
  { orderId: 'ORD-002', symbol: 'NVDA', side: 'BUY', quantity: 5, price: 520.00, status: 'FILLED', timestamp: '2025-01-27T14:15:00Z' },
  { orderId: 'ORD-003', symbol: 'TSLA', side: 'SELL', quantity: 8, price: 248.00, status: 'FILLED', timestamp: '2025-01-26T11:00:00Z' },
  { orderId: 'ORD-004', symbol: 'GOOGL', side: 'BUY', quantity: 15, price: 173.00, status: 'PENDING', timestamp: '2025-01-29T09:00:00Z' },
];

export const demoDataService = {
  isDemoMode,
  setDemoMode,
  getDemoPortfolio,
  getDemoPositions,
  getDemoWatchlist,
  getDemoQuote,
  getDemoUserInfo,
  getDemoAlerts,
  getDemoOrders,
};

export default demoDataService;
