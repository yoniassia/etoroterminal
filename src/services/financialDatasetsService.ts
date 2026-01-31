/**
 * Financial Datasets API Service
 * https://docs.financialdatasets.ai/
 * 
 * Premium financial data for the eToro Terminal:
 * - Real-time & historical prices
 * - Insider trades (CEO/CFO buys/sells)
 * - Institutional ownership (13F filings)
 * - Financial statements (income, balance, cash flow)
 * - SEC filings (10-K, 10-Q, 8-K)
 * - Company news
 */

import {
  PriceSnapshot,
  PriceSnapshotResponse,
  HistoricalPrice,
  HistoricalPricesResponse,
  InsiderTrade,
  InsiderTradesResponse,
  InsiderSentiment,
  InstitutionalHolding,
  InstitutionalOwnershipResponse,
  IncomeStatement,
  IncomeStatementsResponse,
  BalanceSheet,
  BalanceSheetsResponse,
  CashFlowStatement,
  CashFlowStatementsResponse,
  SECFiling,
  SECFilingsResponse,
  NewsArticle,
  NewsResponse,
  FDPriceParams,
  FDFinancialParams,
  FDInsiderParams,
  FDInstitutionalParams,
  FDFilingsParams,
  FDNewsParams,
} from '../types/financialDatasets.types';

const BASE_URL = 'https://api.financialdatasets.ai';

// API key stored in localStorage for user configuration
const getApiKey = (): string | null => {
  return localStorage.getItem('fd_api_key');
};

export const setApiKey = (key: string): void => {
  localStorage.setItem('fd_api_key', key);
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

// Generic fetch wrapper with auth
async function fdFetch<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Financial Datasets API key not configured. Use setApiKey() or configure in settings.');
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Financial Datasets API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============ PRICE DATA ============

export async function getPriceSnapshot(ticker: string): Promise<PriceSnapshot> {
  const response = await fdFetch<PriceSnapshotResponse>('/prices/snapshot', { ticker });
  return response.snapshot;
}

export async function getHistoricalPrices(params: FDPriceParams): Promise<HistoricalPrice[]> {
  const response = await fdFetch<HistoricalPricesResponse>('/prices/', {
    ticker: params.ticker,
    interval: params.interval,
    interval_multiplier: params.interval_multiplier,
    start_date: params.start_date,
    end_date: params.end_date,
    limit: params.limit,
  });
  return response.prices;
}

// ============ INSIDER TRADES ============

export async function getInsiderTrades(
  ticker: string,
  params?: Partial<FDInsiderParams>
): Promise<InsiderTrade[]> {
  const response = await fdFetch<InsiderTradesResponse>('/insider-trades', {
    ticker,
    limit: params?.limit ?? 100,
    filing_date_gte: params?.filing_date_gte,
    filing_date_lte: params?.filing_date_lte,
  });
  return response.insider_trades;
}

/**
 * Calculate insider sentiment from trades
 * Positive = net buying (bullish), Negative = net selling (bearish)
 */
export function calculateInsiderSentiment(trades: InsiderTrade[]): InsiderSentiment {
  const ticker = trades[0]?.ticker ?? '';
  
  let totalBuys = 0;
  let totalSells = 0;
  let buyCount = 0;
  let sellCount = 0;

  trades.forEach(trade => {
    if (trade.transaction_shares > 0) {
      totalBuys += trade.transaction_value;
      buyCount++;
    } else {
      totalSells += Math.abs(trade.transaction_value);
      sellCount++;
    }
  });

  const netValue = totalBuys - totalSells;
  const netShares = trades.reduce((sum, t) => sum + t.transaction_shares, 0);
  
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (netValue > 100000) sentiment = 'bullish';
  else if (netValue < -100000) sentiment = 'bearish';

  return {
    ticker,
    totalBuys,
    totalSells,
    netShares,
    netValue,
    buyCount,
    sellCount,
    sentiment,
  };
}

export async function getInsiderSentiment(
  ticker: string,
  daysBack: number = 90
): Promise<InsiderSentiment> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const trades = await getInsiderTrades(ticker, {
    filing_date_gte: startDate.toISOString().split('T')[0],
    limit: 500,
  });
  
  return calculateInsiderSentiment(trades);
}

// ============ INSTITUTIONAL OWNERSHIP ============

/**
 * Get institutional holders of a stock
 */
export async function getInstitutionalOwnersByTicker(
  ticker: string,
  params?: Partial<FDInstitutionalParams>
): Promise<InstitutionalHolding[]> {
  const response = await fdFetch<InstitutionalOwnershipResponse>('/institutional-ownership/', {
    ticker,
    limit: params?.limit ?? 50,
    report_period_gte: params?.report_period_gte,
    report_period_lte: params?.report_period_lte,
  });
  return response.institutional_ownership;
}

/**
 * Get holdings of a specific investor (e.g., BERKSHIRE_HATHAWAY_INC)
 */
export async function getInvestorHoldings(
  investor: string,
  params?: Partial<FDInstitutionalParams>
): Promise<InstitutionalHolding[]> {
  const response = await fdFetch<InstitutionalOwnershipResponse>('/institutional-ownership/', {
    investor,
    limit: params?.limit ?? 100,
    report_period_gte: params?.report_period_gte,
    report_period_lte: params?.report_period_lte,
  });
  return response.institutional_ownership;
}

/**
 * Get list of available investors
 */
export async function getAvailableInvestors(): Promise<string[]> {
  const response = await fdFetch<{ investors: string[] }>('/institutional-ownership/investors/');
  return response.investors;
}

// ============ FINANCIAL STATEMENTS ============

export async function getIncomeStatements(
  ticker: string,
  params?: Partial<FDFinancialParams>
): Promise<IncomeStatement[]> {
  const response = await fdFetch<IncomeStatementsResponse>('/financials/income-statements', {
    ticker,
    period: params?.period ?? 'quarterly',
    limit: params?.limit ?? 8,
    report_period_gte: params?.report_period_gte,
    report_period_lte: params?.report_period_lte,
  });
  return response.income_statements;
}

export async function getBalanceSheets(
  ticker: string,
  params?: Partial<FDFinancialParams>
): Promise<BalanceSheet[]> {
  const response = await fdFetch<BalanceSheetsResponse>('/financials/balance-sheets', {
    ticker,
    period: params?.period ?? 'quarterly',
    limit: params?.limit ?? 8,
    report_period_gte: params?.report_period_gte,
    report_period_lte: params?.report_period_lte,
  });
  return response.balance_sheets;
}

export async function getCashFlowStatements(
  ticker: string,
  params?: Partial<FDFinancialParams>
): Promise<CashFlowStatement[]> {
  const response = await fdFetch<CashFlowStatementsResponse>('/financials/cash-flow-statements', {
    ticker,
    period: params?.period ?? 'quarterly',
    limit: params?.limit ?? 8,
    report_period_gte: params?.report_period_gte,
    report_period_lte: params?.report_period_lte,
  });
  return response.cash_flow_statements;
}

// ============ SEC FILINGS ============

export async function getSECFilings(
  ticker: string,
  params?: Partial<FDFilingsParams>
): Promise<SECFiling[]> {
  const response = await fdFetch<SECFilingsResponse>('/filings', {
    ticker,
    filing_type: params?.filing_type,
    limit: params?.limit ?? 20,
  });
  return response.filings;
}

// ============ NEWS ============

export async function getCompanyNews(
  ticker: string,
  params?: Partial<FDNewsParams>
): Promise<NewsArticle[]> {
  const response = await fdFetch<NewsResponse>('/news/', {
    ticker,
    start_date: params?.start_date,
    end_date: params?.end_date,
    limit: params?.limit ?? 20,
  });
  return response.news;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Format large numbers for display
 */
export function formatValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/**
 * Calculate growth rate between two values
 */
export function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Aliases for panel imports
export const getNews = getCompanyNews;
export const getInstitutionalOwnership = getInstitutionalOwnersByTicker;

// Export the service as a unified object
export const financialDatasetsService = {
  // Config
  setApiKey,
  hasApiKey,
  
  // Prices
  getPriceSnapshot,
  getHistoricalPrices,
  
  // Insider Trading
  getInsiderTrades,
  getInsiderSentiment,
  calculateInsiderSentiment,
  
  // Institutional
  getInstitutionalOwnersByTicker,
  getInvestorHoldings,
  getAvailableInvestors,
  
  // Financials
  getIncomeStatements,
  getBalanceSheets,
  getCashFlowStatements,
  
  // SEC
  getSECFilings,
  
  // News
  getCompanyNews,
  
  // Utils
  formatValue,
  formatPercent,
  calcGrowth,
};

export default financialDatasetsService;
