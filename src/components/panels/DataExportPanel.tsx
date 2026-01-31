/**
 * Data Export Panel
 * Export portfolio, watchlists, orders, and historical data as JSON/CSV
 * Commands: EXPORT, DATA
 */

import { useState, useCallback } from 'react';
import { portfolioStore } from '../../stores/portfolioStore';
import { ordersStore } from '../../stores/ordersStore';
import { getWatchlistsAdapter } from '../../api/adapters/watchlistsAdapter';
import { isDemoMode, getDemoPortfolio, getDemoWatchlist, getDemoOrders, getDemoAlerts } from '../../services/demoDataService';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './DataExportPanel.css';

type ExportFormat = 'json' | 'csv';
type DataType = 'portfolio' | 'watchlist' | 'orders' | 'alerts' | 'all';

interface ExportLog {
  timestamp: string;
  type: DataType;
  format: ExportFormat;
  records: number;
  filename: string;
}

export default function DataExportPanel(_props: PanelContentProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [logs, setLogs] = useState<ExportLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toCSV = useCallback((data: Record<string, unknown>[], columns?: string[]): string => {
    if (data.length === 0) return '';
    
    const headers = columns || Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(h => {
        const val = row[h];
        const str = String(val ?? '');
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }, []);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const addLog = useCallback((type: DataType, format: ExportFormat, records: number, filename: string) => {
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      type,
      format,
      records,
      filename,
    }, ...prev].slice(0, 10));
  }, []);

  const exportPortfolio = useCallback(async () => {
    setExporting(true);
    setError(null);
    
    try {
      let positions;
      if (isDemoMode()) {
        const demo = getDemoPortfolio();
        positions = demo.positions;
      } else {
        const state = portfolioStore.getState();
        positions = state.portfolio?.positions || [];
      }

      const exportData = positions.map(p => ({
        symbol: (p as any).symbol || (p as any).instrumentName?.split(' - ')[0] || `ID:${p.instrumentId}`,
        name: (p as any).name || (p as any).instrumentName?.split(' - ')[1] || '',
        side: p.isBuy ? 'LONG' : 'SHORT',
        amount: p.amount,
        units: p.units,
        openRate: p.openRate,
        currentRate: (p as any).currentRate || p.openRate,
        profit: (p as any).profit || 0,
        profitPercent: (p as any).profitPercent || 0,
        openDate: p.openDateTime,
        leverage: p.leverage,
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        const content = JSON.stringify({ 
          exportedAt: new Date().toISOString(),
          type: 'portfolio',
          positions: exportData 
        }, null, 2);
        downloadFile(content, `portfolio-${timestamp}.json`, 'application/json');
      } else {
        const content = toCSV(exportData);
        downloadFile(content, `portfolio-${timestamp}.csv`, 'text/csv');
      }

      addLog('portfolio', format, exportData.length, `portfolio-${timestamp}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, toCSV, downloadFile, addLog]);

  const exportWatchlist = useCallback(async () => {
    setExporting(true);
    setError(null);
    
    try {
      let items;
      if (isDemoMode()) {
        items = getDemoWatchlist();
      } else {
        const adapter = getWatchlistsAdapter();
        const watchlists = await adapter.getWatchlists();
        items = watchlists.flatMap(w => w.items.map(i => ({
          ...i,
          watchlistName: w.name,
        })));
      }

      const exportData = items.map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.displayName || '',
        instrumentId: item.instrumentId,
        watchlist: item.watchlistName || 'Default',
        price: item.price || '',
        change: item.change || '',
        changePercent: item.changePercent || '',
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        const content = JSON.stringify({ 
          exportedAt: new Date().toISOString(),
          type: 'watchlist',
          items: exportData 
        }, null, 2);
        downloadFile(content, `watchlist-${timestamp}.json`, 'application/json');
      } else {
        const content = toCSV(exportData);
        downloadFile(content, `watchlist-${timestamp}.csv`, 'text/csv');
      }

      addLog('watchlist', format, exportData.length, `watchlist-${timestamp}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, toCSV, downloadFile, addLog]);

  const exportOrders = useCallback(async () => {
    setExporting(true);
    setError(null);
    
    try {
      let orders;
      if (isDemoMode()) {
        orders = getDemoOrders();
      } else {
        orders = ordersStore.getState().orders;
      }

      const exportData = orders.map((o: any) => ({
        orderId: o.orderId || o.id,
        symbol: o.symbol,
        side: o.side,
        quantity: o.quantity,
        price: o.price,
        status: o.status,
        timestamp: o.timestamp || o.createdAt,
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        const content = JSON.stringify({ 
          exportedAt: new Date().toISOString(),
          type: 'orders',
          orders: exportData 
        }, null, 2);
        downloadFile(content, `orders-${timestamp}.json`, 'application/json');
      } else {
        const content = toCSV(exportData);
        downloadFile(content, `orders-${timestamp}.csv`, 'text/csv');
      }

      addLog('orders', format, exportData.length, `orders-${timestamp}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, toCSV, downloadFile, addLog]);

  const exportAlerts = useCallback(async () => {
    setExporting(true);
    setError(null);
    
    try {
      const alerts = isDemoMode() ? getDemoAlerts() : [];

      const exportData = alerts.map((a: any) => ({
        id: a.id,
        symbol: a.symbol,
        type: a.type,
        value: a.value,
        triggered: a.triggered,
        createdAt: a.createdAt,
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        const content = JSON.stringify({ 
          exportedAt: new Date().toISOString(),
          type: 'alerts',
          alerts: exportData 
        }, null, 2);
        downloadFile(content, `alerts-${timestamp}.json`, 'application/json');
      } else {
        const content = toCSV(exportData);
        downloadFile(content, `alerts-${timestamp}.csv`, 'text/csv');
      }

      addLog('alerts', format, exportData.length, `alerts-${timestamp}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, toCSV, downloadFile, addLog]);

  const exportAll = useCallback(async () => {
    setExporting(true);
    setError(null);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Gather all data
      const portfolio = isDemoMode() ? getDemoPortfolio() : portfolioStore.getState().portfolio;
      const watchlist = isDemoMode() ? getDemoWatchlist() : [];
      const orders = isDemoMode() ? getDemoOrders() : ordersStore.getState().orders;
      const alerts = isDemoMode() ? getDemoAlerts() : [];

      const allData = {
        exportedAt: new Date().toISOString(),
        mode: isDemoMode() ? 'demo' : 'live',
        portfolio: {
          totalValue: portfolio?.totalValue || 0,
          positions: portfolio?.positions || [],
        },
        watchlist,
        orders,
        alerts,
      };

      const content = JSON.stringify(allData, null, 2);
      downloadFile(content, `terminal-export-${timestamp}.json`, 'application/json');

      const totalRecords = (portfolio?.positions?.length || 0) + watchlist.length + orders.length + alerts.length;
      addLog('all', 'json', totalRecords, `terminal-export-${timestamp}.json`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [downloadFile, addLog]);

  return (
    <div className="data-export-panel">
      <div className="de-header">
        <h3>📤 Data Export</h3>
        <p className="de-subtitle">Export your data for backtesting and analysis</p>
      </div>

      {/* Format Selector */}
      <div className="de-section">
        <label className="de-label">Export Format</label>
        <div className="de-format-buttons">
          <button 
            className={`de-format-btn ${format === 'json' ? 'active' : ''}`}
            onClick={() => setFormat('json')}
          >
            JSON
          </button>
          <button 
            className={`de-format-btn ${format === 'csv' ? 'active' : ''}`}
            onClick={() => setFormat('csv')}
          >
            CSV
          </button>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="de-section">
        <label className="de-label">Export Data</label>
        <div className="de-export-grid">
          <button 
            className="de-export-btn"
            onClick={exportPortfolio}
            disabled={exporting}
          >
            <span className="de-btn-icon">📊</span>
            <span className="de-btn-text">Portfolio</span>
            <span className="de-btn-desc">Positions & P/L</span>
          </button>
          
          <button 
            className="de-export-btn"
            onClick={exportWatchlist}
            disabled={exporting}
          >
            <span className="de-btn-icon">📋</span>
            <span className="de-btn-text">Watchlist</span>
            <span className="de-btn-desc">Tracked symbols</span>
          </button>
          
          <button 
            className="de-export-btn"
            onClick={exportOrders}
            disabled={exporting}
          >
            <span className="de-btn-icon">📝</span>
            <span className="de-btn-text">Orders</span>
            <span className="de-btn-desc">Trade history</span>
          </button>
          
          <button 
            className="de-export-btn"
            onClick={exportAlerts}
            disabled={exporting}
          >
            <span className="de-btn-icon">🔔</span>
            <span className="de-btn-text">Alerts</span>
            <span className="de-btn-desc">Price alerts</span>
          </button>
        </div>

        <button 
          className="de-export-all-btn"
          onClick={exportAll}
          disabled={exporting}
        >
          {exporting ? '⏳ Exporting...' : '📦 Export All (JSON)'}
        </button>
      </div>

      {error && (
        <div className="de-error">
          ❌ {error}
        </div>
      )}

      {/* Export Log */}
      {logs.length > 0 && (
        <div className="de-section">
          <label className="de-label">Export History</label>
          <div className="de-logs">
            {logs.map((log, idx) => (
              <div key={idx} className="de-log-item">
                <span className="de-log-time">{log.timestamp}</span>
                <span className="de-log-type">{log.type.toUpperCase()}</span>
                <span className="de-log-records">{log.records} records</span>
                <span className="de-log-file">{log.filename}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Access Info */}
      <div className="de-section">
        <label className="de-label">Programmatic Access</label>
        <div className="de-code-block">
          <code>
            {`// Export all data via console
window.terminalExport.exportAll()

// Export specific data
window.terminalExport.exportPanel('PF')
window.terminalExport.exportPanel('WL')

// Get as object (no download)
const data = await window.terminalExport.exportPanel('PF', { download: false })`}
          </code>
        </div>
      </div>
    </div>
  );
}
