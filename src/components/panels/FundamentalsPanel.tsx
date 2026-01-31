/**
 * Fundamentals Panel
 * Commands: FD, FUNDAMENTALS
 * Shows financial statements from Financial Datasets API
 */
import { useState, useEffect } from 'react';
import { useActiveSymbol } from '../Workspace/ActiveSymbolContext';
import { 
  getIncomeStatements, 
  getBalanceSheets, 
  getCashFlowStatements,
  hasApiKey, 
  formatValue,
  calcGrowth,
  formatPercent
} from '../../services/financialDatasetsService';
import type { IncomeStatement, BalanceSheet, CashFlowStatement } from '../../types/financialDatasets.types';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './FundamentalsPanel.css';

type TabType = 'income' | 'balance' | 'cashflow';

export default function FundamentalsPanel({ config }: PanelContentProps) {
  const { activeSymbol } = useActiveSymbol();
  const ticker = config?.symbol || activeSymbol || null;
  
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [period, setPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  const [income, setIncome] = useState<IncomeStatement[]>([]);
  const [balance, setBalance] = useState<BalanceSheet[]>([]);
  const [cashflow, setCashflow] = useState<CashFlowStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    
    if (!hasApiKey()) {
      setError('Financial Datasets API key required. Set fd_api_key in localStorage.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [incomeData, balanceData, cashflowData] = await Promise.all([
          getIncomeStatements(ticker, { period, limit: 8 }),
          getBalanceSheets(ticker, { period, limit: 8 }),
          getCashFlowStatements(ticker, { period, limit: 8 }),
        ]);
        setIncome(incomeData);
        setBalance(balanceData);
        setCashflow(cashflowData);
      } catch (err) {
        console.error('[FundamentalsPanel] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load fundamentals');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, period]);

  const formatPeriod = (reportPeriod: string, fiscalPeriod: string): string => {
    const date = new Date(reportPeriod);
    const quarter = fiscalPeriod.replace('FY', '').replace('Q', 'Q');
    return `${quarter} ${date.getFullYear()}`;
  };

  if (!ticker) {
    return (
      <div className="fundamentals-panel">
        <div className="fundamentals-header">
          <h2>📊 FUNDAMENTALS</h2>
        </div>
        <div className="fundamentals-empty">
          <p>Enter a symbol to view fundamentals</p>
          <p className="hint">Example: FD AAPL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fundamentals-panel">
      <div className="fundamentals-header">
        <h2>📊 FUNDAMENTALS - {ticker}</h2>
        {loading && <span className="loading-indicator">Loading...</span>}
      </div>

      {error && (
        <div className="fundamentals-error">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="fundamentals-controls">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            Income
          </button>
          <button 
            className={`tab ${activeTab === 'balance' ? 'active' : ''}`}
            onClick={() => setActiveTab('balance')}
          >
            Balance
          </button>
          <button 
            className={`tab ${activeTab === 'cashflow' ? 'active' : ''}`}
            onClick={() => setActiveTab('cashflow')}
          >
            Cash Flow
          </button>
        </div>
        <div className="period-toggle">
          <button 
            className={`period-btn ${period === 'quarterly' ? 'active' : ''}`}
            onClick={() => setPeriod('quarterly')}
          >
            QTR
          </button>
          <button 
            className={`period-btn ${period === 'annual' ? 'active' : ''}`}
            onClick={() => setPeriod('annual')}
          >
            ANN
          </button>
        </div>
      </div>

      <div className="fundamentals-content">
        {activeTab === 'income' && (
          <IncomeTable data={income} formatPeriod={formatPeriod} />
        )}
        {activeTab === 'balance' && (
          <BalanceTable data={balance} formatPeriod={formatPeriod} />
        )}
        {activeTab === 'cashflow' && (
          <CashFlowTable data={cashflow} formatPeriod={formatPeriod} />
        )}
      </div>
    </div>
  );
}

interface TableProps<T> {
  data: T[];
  formatPeriod: (reportPeriod: string, fiscalPeriod: string) => string;
}

function IncomeTable({ data, formatPeriod }: TableProps<IncomeStatement>) {
  if (data.length === 0) {
    return <div className="no-data">No income statement data available</div>;
  }

  const metrics = [
    { label: 'Revenue', key: 'revenue' },
    { label: 'Gross Profit', key: 'gross_profit' },
    { label: 'Operating Income', key: 'operating_income' },
    { label: 'Net Income', key: 'net_income' },
    { label: 'EPS', key: 'earnings_per_share', format: 'decimal' },
    { label: 'EPS Diluted', key: 'earnings_per_share_diluted', format: 'decimal' },
  ];

  return (
    <div className="data-table">
      <div className="table-header">
        <span className="metric-label">Metric</span>
        {data.slice(0, 4).map((item, idx) => (
          <span key={idx} className="period-col">{formatPeriod(item.report_period, item.fiscal_period)}</span>
        ))}
      </div>
      {metrics.map(metric => (
        <div key={metric.key} className="table-row">
          <span className="metric-label">{metric.label}</span>
          {data.slice(0, 4).map((item, idx) => {
            const value = (item as Record<string, number>)[metric.key];
            const prev = data[idx + 1] ? (data[idx + 1] as Record<string, number>)[metric.key] : null;
            const growth = prev ? calcGrowth(value, prev) : null;
            
            return (
              <span key={idx} className="value-col">
                <span className="value">
                  {metric.format === 'decimal' ? value?.toFixed(2) : formatValue(value)}
                </span>
                {growth !== null && (
                  <span className={`growth ${growth >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(growth)}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BalanceTable({ data, formatPeriod }: TableProps<BalanceSheet>) {
  if (data.length === 0) {
    return <div className="no-data">No balance sheet data available</div>;
  }

  const metrics = [
    { label: 'Total Assets', key: 'total_assets' },
    { label: 'Cash & Equiv', key: 'cash_and_equivalents' },
    { label: 'Total Liabilities', key: 'total_liabilities' },
    { label: 'Long-term Debt', key: 'long_term_debt' },
    { label: 'Total Equity', key: 'total_equity' },
    { label: 'Retained Earnings', key: 'retained_earnings' },
  ];

  return (
    <div className="data-table">
      <div className="table-header">
        <span className="metric-label">Metric</span>
        {data.slice(0, 4).map((item, idx) => (
          <span key={idx} className="period-col">{formatPeriod(item.report_period, item.fiscal_period)}</span>
        ))}
      </div>
      {metrics.map(metric => (
        <div key={metric.key} className="table-row">
          <span className="metric-label">{metric.label}</span>
          {data.slice(0, 4).map((item, idx) => {
            const value = (item as Record<string, number>)[metric.key];
            return (
              <span key={idx} className="value-col">
                <span className="value">{formatValue(value)}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function CashFlowTable({ data, formatPeriod }: TableProps<CashFlowStatement>) {
  if (data.length === 0) {
    return <div className="no-data">No cash flow data available</div>;
  }

  const metrics = [
    { label: 'Operating CF', key: 'net_cash_flow_from_operations' },
    { label: 'Investing CF', key: 'net_cash_flow_from_investing' },
    { label: 'Financing CF', key: 'net_cash_flow_from_financing' },
    { label: 'CapEx', key: 'capital_expenditure' },
    { label: 'Free Cash Flow', key: 'free_cash_flow' },
    { label: 'Dividends Paid', key: 'dividends_paid' },
  ];

  return (
    <div className="data-table">
      <div className="table-header">
        <span className="metric-label">Metric</span>
        {data.slice(0, 4).map((item, idx) => (
          <span key={idx} className="period-col">{formatPeriod(item.report_period, item.fiscal_period)}</span>
        ))}
      </div>
      {metrics.map(metric => (
        <div key={metric.key} className="table-row">
          <span className="metric-label">{metric.label}</span>
          {data.slice(0, 4).map((item, idx) => {
            const value = (item as Record<string, number>)[metric.key];
            return (
              <span key={idx} className="value-col">
                <span className={`value ${value < 0 ? 'negative' : ''}`}>{formatValue(value)}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
