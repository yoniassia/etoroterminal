/**
 * Export Service
 * Provides JSON export functionality for all panels
 * Access via: window.terminalExport or exportService methods
 */

import { demoDataService, isDemoMode } from './demoDataService';

export interface ExportData {
  exportedAt: string;
  version: string;
  mode: 'live' | 'demo';
  panelType: string;
  data: unknown;
}

export interface ExportOptions {
  format?: 'json' | 'csv';
  filename?: string;
  download?: boolean;
}

// Registry of panel data exporters
const panelExporters: Map<string, () => Promise<unknown>> = new Map();

// Register a panel exporter
export const registerPanelExporter = (panelType: string, exporter: () => Promise<unknown>): void => {
  panelExporters.set(panelType.toUpperCase(), exporter);
};

// Export data from a specific panel
export const exportPanel = async (panelType: string, options: ExportOptions = {}): Promise<ExportData> => {
  const type = panelType.toUpperCase();
  const exporter = panelExporters.get(type);
  
  let data: unknown;
  
  if (exporter) {
    data = await exporter();
  } else {
    // Fallback to demo data for known panels
    data = await getDefaultPanelData(type);
  }
  
  const exportData: ExportData = {
    exportedAt: new Date().toISOString(),
    version: '1.5.0',
    mode: isDemoMode() ? 'demo' : 'live',
    panelType: type,
    data,
  };
  
  if (options.download !== false) {
    downloadJson(exportData, options.filename || `${type.toLowerCase()}-export.json`);
  }
  
  return exportData;
};

// Get default/demo data for panels
const getDefaultPanelData = async (panelType: string): Promise<unknown> => {
  switch (panelType) {
    case 'PF':
    case 'PORTFOLIO':
      return demoDataService.getDemoPortfolio();
    
    case 'WL':
    case 'WATCHLIST':
    case 'WLM':
      return { watchlist: demoDataService.getDemoWatchlist() };
    
    case 'AL':
    case 'ALERTS':
      return { alerts: demoDataService.getDemoAlerts() };
    
    case 'ORD':
    case 'BLOTTER':
      return { orders: demoDataService.getDemoOrders() };
    
    case 'QT':
    case 'QUOTE':
      // Export all available quotes
      return { 
        quotes: demoDataService.getDemoWatchlist().map(item => 
          demoDataService.getDemoQuote(item.symbol)
        ) 
      };
    
    default:
      return { message: `No export available for panel: ${panelType}` };
  }
};

// Export all panels at once
export const exportAll = async (options: ExportOptions = {}): Promise<Record<string, ExportData>> => {
  const panels = ['PF', 'WL', 'AL', 'ORD', 'QT'];
  const exports: Record<string, ExportData> = {};
  
  for (const panel of panels) {
    try {
      exports[panel] = await exportPanel(panel, { ...options, download: false });
    } catch (error) {
      console.warn(`Failed to export ${panel}:`, error);
    }
  }
  
  if (options.download !== false) {
    downloadJson({ 
      exportedAt: new Date().toISOString(),
      version: '1.5.0',
      mode: isDemoMode() ? 'demo' : 'live',
      panels: exports 
    }, options.filename || 'terminal-full-export.json');
  }
  
  return exports;
};

// Download JSON helper
const downloadJson = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Convert to CSV (for tabular data)
export const toCSV = (data: Record<string, unknown>[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return String(val ?? '');
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

// Export portfolio as CSV
export const exportPortfolioCSV = async (): Promise<string> => {
  const portfolio = demoDataService.getDemoPortfolio();
  return toCSV(portfolio.positions.map(p => ({
    symbol: p.symbol,
    name: p.name,
    side: p.isBuy ? 'LONG' : 'SHORT',
    amount: p.amount,
    units: p.units,
    openRate: p.openRate,
    currentRate: p.currentRate,
    profit: p.profit,
    profitPercent: p.profitPercent,
    openDate: p.openDateTime,
  })));
};

// Expose to window for agent access
if (typeof window !== 'undefined') {
  (window as any).terminalExport = {
    exportPanel,
    exportAll,
    exportPortfolioCSV,
    toCSV,
    registerPanelExporter,
  };
}

export const exportService = {
  exportPanel,
  exportAll,
  exportPortfolioCSV,
  toCSV,
  registerPanelExporter,
};

export default exportService;
