/**
 * Financial Datasets API Types
 * https://docs.financialdatasets.ai/
 */

// ============ PRICE DATA ============

export interface PriceSnapshot {
  ticker: string;
  price: number;
  day_change: number;
  day_change_percent: number;
  volume: number;
  time: string;
  time_milliseconds: number;
  market_cap: number;
}

export interface HistoricalPrice {
  ticker: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============ INSIDER TRADES ============

export interface InsiderTrade {
  ticker: string;
  issuer: string;
  name: string;
  title: string;
  is_board_director: boolean;
  transaction_date: string;
  transaction_shares: number; // negative = sell
  transaction_price_per_share: number;
  transaction_value: number;
  shares_owned_before_transaction: number;
  shares_owned_after_transaction: number;
  security_title: string;
  filing_date: string;
}

export interface InsiderSentiment {
  ticker: string;
  totalBuys: number;
  totalSells: number;
  netShares: number;
  netValue: number;
  buyCount: number;
  sellCount: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

// ============ INSTITUTIONAL OWNERSHIP ============

export interface InstitutionalHolding {
  investor: string;
  report_period: string;
  price: number;
  shares: number;
  market_value: number;
  ticker?: string;
}

export interface InstitutionalOwnership {
  ticker: string;
  institutional_ownership: InstitutionalHolding[];
}

// ============ FINANCIALS ============

export interface IncomeStatement {
  ticker: string;
  report_period: string;
  fiscal_period: string;
  period: 'annual' | 'quarterly' | 'ttm';
  currency: string;
  revenue: number;
  cost_of_revenue: number;
  gross_profit: number;
  operating_expense: number;
  selling_general_and_administrative_expenses: number;
  research_and_development: number;
  operating_income: number;
  interest_expense: number | null;
  ebit: number;
  income_tax_expense: number;
  net_income_discontinued_operations: number | null;
  net_income_non_controlling_interests: number | null;
  net_income: number;
  net_income_common_stock: number;
  preferred_dividends_impact: number;
  consolidated_income: number;
  earnings_per_share: number;
  earnings_per_share_diluted: number;
  dividends_per_common_share: number;
  weighted_average_shares: number;
  weighted_average_shares_diluted: number;
}

export interface BalanceSheet {
  ticker: string;
  report_period: string;
  fiscal_period: string;
  period: 'annual' | 'quarterly';
  currency: string;
  total_assets: number;
  current_assets: number;
  cash_and_equivalents: number;
  inventory: number;
  total_liabilities: number;
  current_liabilities: number;
  long_term_debt: number;
  total_equity: number;
  retained_earnings: number;
  common_stock: number;
}

export interface CashFlowStatement {
  ticker: string;
  report_period: string;
  fiscal_period: string;
  period: 'annual' | 'quarterly';
  currency: string;
  net_cash_flow_from_operations: number;
  net_cash_flow_from_investing: number;
  net_cash_flow_from_financing: number;
  capital_expenditure: number;
  free_cash_flow: number;
  dividends_paid: number;
  share_repurchase: number;
}

// ============ SEC FILINGS ============

export interface SECFiling {
  ticker: string;
  cik: string;
  company_name: string;
  filing_type: '10-K' | '10-Q' | '8-K' | '4' | '144' | string;
  filing_date: string;
  report_date: string;
  filing_url: string;
  accession_number: string;
}

// ============ NEWS ============

export interface NewsArticle {
  ticker: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  published_at: string;
  source: string;
}

// ============ CRYPTO ============

export interface CryptoPrice {
  ticker: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoSnapshot {
  ticker: string;
  price: number;
  day_change: number;
  day_change_percent: number;
  volume: number;
  time: string;
  market_cap: number;
}

// ============ API RESPONSES ============

export interface FDApiResponse<T> {
  [key: string]: T | T[] | string | undefined;
  next_page_url?: string;
}

export interface PriceSnapshotResponse {
  snapshot: PriceSnapshot;
}

export interface HistoricalPricesResponse {
  prices: HistoricalPrice[];
  next_page_url?: string;
}

export interface InsiderTradesResponse {
  insider_trades: InsiderTrade[];
}

export interface InstitutionalOwnershipResponse {
  ticker?: string;
  investor?: string;
  institutional_ownership: InstitutionalHolding[];
}

export interface IncomeStatementsResponse {
  income_statements: IncomeStatement[];
}

export interface BalanceSheetsResponse {
  balance_sheets: BalanceSheet[];
}

export interface CashFlowStatementsResponse {
  cash_flow_statements: CashFlowStatement[];
}

export interface SECFilingsResponse {
  filings: SECFiling[];
}

export interface NewsResponse {
  news: NewsArticle[];
}

// ============ QUERY PARAMS ============

export interface FDBaseParams {
  ticker?: string;
  limit?: number;
}

export interface FDPriceParams extends FDBaseParams {
  interval: 'day' | 'week' | 'month' | 'year';
  interval_multiplier: number;
  start_date: string;
  end_date: string;
}

export interface FDFinancialParams extends FDBaseParams {
  period: 'annual' | 'quarterly' | 'ttm';
  report_period_gte?: string;
  report_period_lte?: string;
}

export interface FDInsiderParams extends FDBaseParams {
  filing_date_gte?: string;
  filing_date_lte?: string;
}

export interface FDInstitutionalParams {
  ticker?: string;
  investor?: string;
  limit?: number;
  report_period_gte?: string;
  report_period_lte?: string;
}

export interface FDFilingsParams extends FDBaseParams {
  filing_type?: '10-K' | '10-Q' | '8-K' | '4' | '144';
}

export interface FDNewsParams extends FDBaseParams {
  start_date?: string;
  end_date?: string;
}
