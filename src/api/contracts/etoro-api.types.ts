// eToro Public API - TypeScript Contracts
// Base URL: https://public-api.etoro.com

// ============================================================================
// Common Types
// ============================================================================

export interface ApiHeaders {
  'x-request-id': string;
  'x-api-key': string;
  'x-user-key': string;
  'Content-Type'?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// User Info Types
// ============================================================================

export interface UserInfo {
  username: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  country?: string;
  isVerified?: boolean;
}

// ============================================================================
// Portfolio Types
// ============================================================================

export interface Position {
  positionId: number;
  instrumentId: number;
  instrumentName?: string;
  isBuy: boolean;
  amount: number;
  leverage: number;
  units: number;
  openRate: number;
  currentRate?: number;
  openDateTime: string;
  takeProfitRate?: number;
  stopLossRate?: number;
  profit?: number;
  profitPercentage?: number;
}

export interface Portfolio {
  totalValue: number;
  equity: number;
  credit: number;
  bonusCredit: number;
  profit: number;
  profitPercentage?: number;
  positions: Position[];
}

export interface PortfolioResponse {
  clientPortfolio: {
    credit: number;
    bonusCredit: number;
    positions: Position[];
  };
}

// ============================================================================
// Quote Types
// ============================================================================

export interface Quote {
  instrumentId: number;
  symbol: string;
  displayName: string;
  bid: number;
  ask: number;
  lastPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume?: number;
  timestamp: string;
}

export interface QuoteHistoryPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface QuoteHistory {
  instrumentId: number;
  symbol: string;
  period: 'D1' | 'W1' | 'M1' | 'H1' | 'M5' | 'M15';
  data: QuoteHistoryPoint[];
}

// ============================================================================
// Watchlist Types
// ============================================================================

export interface WatchlistItem {
  instrumentId: number;
  symbol: string;
  displayName: string;
  order: number;
}

export interface Watchlist {
  watchlistId: string;
  name: string;
  items: WatchlistItem[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Trading Types
// ============================================================================

export type OrderType = 'market' | 'limit' | 'stop';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'executed' | 'cancelled' | 'rejected';

export interface TradeRequest {
  instrumentId: number;
  orderType: OrderType;
  side: OrderSide;
  amount: number;
  leverage?: number;
  limitRate?: number;
  stopLossRate?: number;
  takeProfitRate?: number;
}

export interface TradeResponse {
  orderId: string;
  positionId?: number;
  status: OrderStatus;
  executedRate?: number;
  executedAt?: string;
  message?: string;
}

export interface ClosePositionRequest {
  positionId: number;
}

export interface ClosePositionResponse {
  positionId?: number;
  positionID?: number;
  closedRate?: number;
  closeRate?: number;
  closedAt?: string;
  openDateTime?: string;
  profit?: number;
  orderForClose?: {
    positionID: number;
    instrumentID: number;
    orderID: number;
    orderType: number;
    statusID: number;
    CID: number;
    openDateTime: string;
    lastUpdate: string;
  };
  token?: string;
}

export interface ModifyPositionRequest {
  positionId: number;
  takeProfitRate?: number;
  stopLossRate?: number;
}

export interface ModifyPositionResponse {
  positionId: number;
  takeProfitRate?: number;
  stopLossRate?: number;
  updatedAt: string;
}

// ============================================================================
// Curated List Types
// ============================================================================

export interface CuratedListItem {
  instrumentId: number;
  symbol: string;
  displayName: string;
  weight?: number;
}

export interface CuratedList {
  listId: string;
  name: string;
  description?: string;
  category?: string;
  items: CuratedListItem[];
  itemCount: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CuratedListsResponse {
  lists: CuratedList[];
  total: number;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export type RecommendationType = 'buy' | 'sell' | 'hold' | 'strong_buy' | 'strong_sell';

export interface Recommendation {
  instrumentId: number;
  symbol: string;
  displayName: string;
  recommendationType: RecommendationType;
  confidence?: number;
  targetPrice?: number;
  reason?: string;
  updatedAt?: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
}

// ============================================================================
// Instrument Types
// ============================================================================

export type InstrumentType = 'stock' | 'etf' | 'crypto' | 'currency' | 'commodity' | 'index';

export interface Instrument {
  instrumentId: number;
  symbol: string;
  displayName: string;
  type: InstrumentType;
  exchange?: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  availableLeverage: number[];
  tradingHours?: TradingHours;
}

export interface TradingHours {
  timezone: string;
  sessions: {
    dayOfWeek: number;
    open: string;
    close: string;
  }[];
}

// ============================================================================
// WebSocket Types
// ============================================================================

export interface WebSocketMessage<T = unknown> {
  topic: string;
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error';
  payload: T;
  timestamp: string;
}

export interface QuoteUpdatePayload {
  instrumentId: number;
  bid: number;
  ask: number;
  lastPrice: number;
  change: number;
  changePercent: number;
}

export interface PositionUpdatePayload {
  positionId: number;
  currentRate: number;
  profit: number;
  profitPercentage: number;
}

export interface OrderUpdatePayload {
  orderId: string;
  status: OrderStatus;
  executedRate?: number;
  executedAt?: string;
}

// ============================================================================
// Feed Types
// ============================================================================

export interface FeedAuthor {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isPopularInvestor?: boolean;
}

export interface FeedPost {
  postId: string;
  author: FeedAuthor;
  content: string;
  instrumentId?: number;
  instrumentSymbol?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePostRequest {
  content: string;
  instrumentId?: number;
}

export interface CreatePostResponse {
  post: FeedPost;
}

export interface FeedResponse {
  posts: FeedPost[];
  nextCursor?: string;
  hasMore: boolean;
}
