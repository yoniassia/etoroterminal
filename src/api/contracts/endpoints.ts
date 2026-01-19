// eToro Public API - Endpoint Constants
// Base URL: https://public-api.etoro.com

export const API_BASE_URL = 'https://public-api.etoro.com';

// ============================================================================
// REST Endpoints
// ============================================================================

export const ENDPOINTS = {
  // User Info
  USER_INFO: '/api/v1/user-info/people',
  USER_SETTINGS: '/api/v1/user-info/settings',

  // Portfolio - Real Account
  PORTFOLIO_PNL: '/api/v1/trading/info/pnl',
  PORTFOLIO_POSITIONS: '/api/v1/trading/info/positions',
  PORTFOLIO_HISTORY: '/api/v1/trading/info/history',

  // Portfolio - Demo Account
  PORTFOLIO_DEMO_PNL: '/api/v1/trading/info/demo/pnl',
  PORTFOLIO_DEMO_POSITIONS: '/api/v1/trading/info/demo/positions',
  PORTFOLIO_DEMO_HISTORY: '/api/v1/trading/info/demo/history',

  // Quotes
  QUOTES_LIVE: '/api/v1/quotes/live',
  QUOTES_HISTORY: '/api/v1/quotes/history',
  QUOTES_INSTRUMENT: (instrumentId: number) => `/api/v1/quotes/${instrumentId}`,

  // Instruments
  INSTRUMENTS_LIST: '/api/v1/instruments',
  INSTRUMENTS_SEARCH: '/api/v1/instruments/search',
  INSTRUMENT_DETAILS: (instrumentId: number) => `/api/v1/instruments/${instrumentId}`,

  // Curated Lists
  CURATED_LISTS: '/api/v1/curated-lists',

  // Recommendations
  RECOMMENDATIONS: '/api/v1/recommendations',

  // Traders (Copy Trading)
  TRADERS_SEARCH: '/api/v1/traders/search',
  TRADER_PROFILE: (userId: string) => `/api/v1/traders/${userId}`,

  // Watchlists
  WATCHLISTS: '/api/v1/watchlists',
  WATCHLIST: (watchlistId: string) => `/api/v1/watchlists/${watchlistId}`,
  WATCHLIST_ITEMS: (watchlistId: string) => `/api/v1/watchlists/${watchlistId}/items`,

  // Trading - Real Account
  TRADING_OPEN: '/api/v1/trading/open',
  TRADING_CLOSE: '/api/v1/trading/close',
  TRADING_MODIFY: '/api/v1/trading/modify',
  TRADING_ORDERS: '/api/v1/trading/orders',

  // Trading - Demo Account
  TRADING_DEMO_OPEN: '/api/v1/trading/demo/open',
  TRADING_DEMO_CLOSE: '/api/v1/trading/demo/close',
  TRADING_DEMO_MODIFY: '/api/v1/trading/demo/modify',
  TRADING_DEMO_ORDERS: '/api/v1/trading/demo/orders',

  // Feeds
  FEED_USER: (userId: string) => `/api/v1/feeds/user/${userId}`,
  FEED_INSTRUMENT: (instrumentId: number) => `/api/v1/feeds/instrument/${instrumentId}`,
  FEED_CREATE_POST: '/api/v1/feeds/posts',
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
