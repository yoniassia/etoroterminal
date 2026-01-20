// eToro Public API - Endpoint Constants
// Base URL: https://public-api.etoro.com
// Updated based on official eToro API documentation

export const API_BASE_URL = 'https://public-api.etoro.com';

// ============================================================================
// REST Endpoints
// ============================================================================

export const ENDPOINTS = {
  // User Info
  USER_INFO: '/api/v1/user-info/people',
  USER_INFO_SEARCH: '/api/v1/user-info/people/search',
  USER_SETTINGS: '/api/v1/user-info/settings',

  // Market Data
  MARKET_DATA_SEARCH: '/api/v1/market-data/search',
  MARKET_DATA_EXCHANGES: '/api/v1/market-data/exchanges',
  MARKET_DATA_INSTRUMENT_TYPES: '/api/v1/market-data/instrument-types',
  MARKET_DATA_INDUSTRIES: '/api/v1/market-data/industries',

  // Instruments (via market-data/search)
  INSTRUMENTS_LIST: '/api/v1/market-data/search',
  INSTRUMENTS_SEARCH: '/api/v1/market-data/search',
  INSTRUMENT_RATES: '/api/v1/instruments/rates',

  // Curated Lists & Recommendations
  CURATED_LISTS: '/api/v1/curated-lists',
  RECOMMENDATIONS: (count: number = 10) => `/api/v1/market-recommendations/${count}`,

  // Watchlists
  WATCHLISTS: '/api/v1/watchlists',
  WATCHLIST: (watchlistId: string) => `/api/v1/watchlists/${watchlistId}`,
  WATCHLIST_ITEMS: (watchlistId: string) => `/api/v1/watchlists/${watchlistId}/items`,

  // PI Data (Popular Investors / Traders)
  PI_DATA_COPIERS: '/api/v1/pi-data/copiers',

  // Portfolio - Demo Account
  PORTFOLIO_DEMO: '/api/v1/trading/info/demo/portfolio',
  PORTFOLIO_DEMO_PNL: '/api/v1/trading/info/demo/pnl',
  PORTFOLIO_DEMO_POSITIONS: '/api/v1/trading/info/demo/positions',
  PORTFOLIO_DEMO_HISTORY: '/api/v1/trading/info/demo/history',

  // Portfolio - Real Account
  PORTFOLIO: '/api/v1/trading/info/portfolio',
  PORTFOLIO_PNL: '/api/v1/trading/info/pnl',
  PORTFOLIO_POSITIONS: '/api/v1/trading/info/positions',
  PORTFOLIO_HISTORY: '/api/v1/trading/info/history',

  // Trading - Demo Account (Market Orders)
  TRADING_DEMO_OPEN_BY_AMOUNT: '/api/v1/trading/execution/demo/market-open-orders/by-amount',
  TRADING_DEMO_OPEN_BY_UNITS: '/api/v1/trading/execution/demo/market-open-orders/by-units',
  TRADING_DEMO_CLOSE: (positionId: number) => `/api/v1/trading/execution/demo/market-close-orders/positions/${positionId}`,
  TRADING_DEMO_LIMIT_ORDERS: '/api/v1/trading/execution/demo/limit-orders',

  // Trading - Real Account (Market Orders)
  TRADING_OPEN_BY_AMOUNT: '/api/v1/trading/execution/market-open-orders/by-amount',
  TRADING_OPEN_BY_UNITS: '/api/v1/trading/execution/market-open-orders/by-units',
  TRADING_CLOSE: (positionId: number) => `/api/v1/trading/execution/market-close-orders/positions/${positionId}`,
  TRADING_LIMIT_ORDERS: '/api/v1/trading/execution/limit-orders',

  // Legacy aliases for backward compatibility
  TRADING_DEMO_OPEN: '/api/v1/trading/execution/demo/market-open-orders/by-amount',
  TRADING_OPEN: '/api/v1/trading/execution/market-open-orders/by-amount',
  TRADING_DEMO_MODIFY: '/api/v1/trading/execution/demo/modify',
  TRADING_MODIFY: '/api/v1/trading/execution/modify',
  TRADING_DEMO_ORDERS: '/api/v1/trading/execution/demo/orders',
  TRADING_ORDERS: '/api/v1/trading/execution/orders',

  // Quotes
  QUOTES_LIVE: '/api/v1/quotes/live',
  QUOTES_HISTORY: '/api/v1/quotes/history',
  QUOTES_INSTRUMENT: (instrumentId: number) => `/api/v1/quotes/${instrumentId}`,

  // Feeds
  FEED_USER: (userId: string) => `/api/v1/feeds/user/${userId}`,
  FEED_INSTRUMENT: (instrumentId: number) => `/api/v1/feeds/instrument/${instrumentId}`,
  FEED_CREATE_POST: '/api/v1/feeds/posts',

  // Traders (via user-info/people/search)
  TRADERS_SEARCH: '/api/v1/user-info/people/search',
  TRADER_PROFILE: (userId: string) => `/api/v1/user-info/people?usernames=${userId}`,
} as const;

// ============================================================================
// WebSocket Configuration
// ============================================================================

export const WEBSOCKET_URL = 'wss://public-api.etoro.com/ws';

export const WS_TOPICS = {
  QUOTES: 'quotes',
  QUOTES_INSTRUMENT: (instrumentId: number) => `quotes.${instrumentId}`,
  POSITIONS: 'positions',
  POSITION: (positionId: number) => `positions.${positionId}`,
  ORDERS: 'orders',
  ORDER: (orderId: string) => `orders.${orderId}`,
  PORTFOLIO: 'portfolio',
} as const;

// ============================================================================
// Required Headers
// ============================================================================

export const REQUIRED_HEADERS = {
  REQUEST_ID: 'x-request-id',
  API_KEY: 'x-api-key',
  USER_KEY: 'x-user-key',
} as const;

export const CONTENT_TYPE_JSON = 'application/json';

// ============================================================================
// API Response Codes
// ============================================================================

export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
} as const;
