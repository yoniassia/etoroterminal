/**
 * Health Service
 * Provides health check and status information for agents
 * Access via: window.terminalHealth or /api/health (if server-side)
 */

import { isDemoMode } from './demoDataService';
import { keyManager } from './keyManager';
import { streamingService } from './streamingService';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  mode: 'live' | 'demo';
  services: {
    api: ServiceStatus;
    streaming: ServiceStatus;
    storage: ServiceStatus;
  };
  features: string[];
  panels: string[];
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'unknown';
  latency?: number;
  lastCheck?: string;
  error?: string;
}

// Track when the app started
const APP_START_TIME = Date.now();

// Get terminal version from config
const getVersion = (): string => {
  try {
    // Try to get from window if available
    return (window as any).__TERMINAL_VERSION__ || '1.5.0';
  } catch {
    return '1.5.0';
  }
};

// Check API connectivity
const checkApiStatus = async (): Promise<ServiceStatus> => {
  const start = Date.now();
  try {
    // Simple connectivity check
    const response = await fetch('https://public-api.etoro.com/sapi/app-data/web-client/asset-settings', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return {
      status: 'up',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Check streaming service
const checkStreamingStatus = (): ServiceStatus => {
  try {
    const isConnected = streamingService.isConnected();
    return {
      status: isConnected ? 'up' : 'down',
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return {
      status: 'unknown',
      lastCheck: new Date().toISOString(),
    };
  }
};

// Check localStorage availability
const checkStorageStatus = (): ServiceStatus => {
  try {
    const testKey = '__health_check__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      error: 'localStorage not available',
    };
  }
};

// Get available panels
const getAvailablePanels = (): string[] => {
  return [
    'QT - Quote',
    'WL - Watchlists', 
    'WLM - Watchlist Monitor',
    'CUR - Curated Lists',
    'REC - Recommendations',
    'TRD - Trade Ticket',
    'ORD - Blotter',
    'PF - Portfolio',
    'CH - Chart',
    'AL - Alerts',
    'PI - Trader Search',
    'PIP - Trader Profile',
    'FEED - Feeds',
    'API - API Tester',
    'HELP - Help',
    'STATUS - Connection Status',
    'EXP - Asset Explorer',
    'ACT - Activity Log',
    'SB - Strategy Builder',
    'FB - Feedback',
    'QUANT - AI Chat',
  ];
};

// Get available features
const getFeatures = (): string[] => {
  const features = [
    'real-time-quotes',
    'portfolio-tracking',
    'watchlists',
    'alerts',
    'charts',
    'trade-execution',
    'strategy-builder',
    'ai-chat',
    'feedback-system',
    'json-export',
  ];
  
  if (isDemoMode()) {
    features.push('demo-mode');
  }
  
  if (keyManager.getKeys()) {
    features.push('authenticated');
  }
  
  return features;
};

// Main health check function
export const getHealth = async (): Promise<HealthStatus> => {
  const apiStatus = await checkApiStatus();
  const streamingStatus = checkStreamingStatus();
  const storageStatus = checkStorageStatus();
  
  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (apiStatus.status === 'down' && streamingStatus.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (apiStatus.status === 'down' || streamingStatus.status === 'down') {
    overallStatus = 'degraded';
  }
  
  return {
    status: overallStatus,
    version: getVersion(),
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - APP_START_TIME) / 1000),
    mode: isDemoMode() ? 'demo' : 'live',
    services: {
      api: apiStatus,
      streaming: streamingStatus,
      storage: storageStatus,
    },
    features: getFeatures(),
    panels: getAvailablePanels(),
  };
};

// Quick health check (sync, no network calls)
export const getHealthQuick = (): Partial<HealthStatus> => {
  return {
    status: 'healthy',
    version: getVersion(),
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - APP_START_TIME) / 1000),
    mode: isDemoMode() ? 'demo' : 'live',
    features: getFeatures(),
  };
};

// Expose to window for agent access
if (typeof window !== 'undefined') {
  (window as any).terminalHealth = {
    getHealth,
    getHealthQuick,
    version: getVersion(),
  };
}

export const healthService = {
  getHealth,
  getHealthQuick,
  getVersion,
  getAvailablePanels,
  getFeatures,
};

export default healthService;
