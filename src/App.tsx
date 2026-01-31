import { useState, useEffect } from 'react';
import Login from './components/Login';
import Workspace from './components/Workspace/Workspace';
import { CommandBar, CommandBarCommand } from './components/CommandBar';
import { ActiveSymbolProvider } from './components/Workspace/ActiveSymbolContext';
import { TradingModeProvider } from './contexts/TradingModeContext';
import { WorkspaceProvider, useWorkspaceContext } from './contexts/WorkspaceContext';
import TradingModeIndicator from './components/TradingModeIndicator';
import DiagnosticsDrawer from './components/DiagnosticsDrawer';
import { PanelRegistry } from './components/Workspace/PanelRegistry';
import { keyManager } from './services/keyManager';
import { streamingService } from './services/streamingService';
import { etoroApi } from './services/etoroApi';
// These services initialize on import (side effects)
import './services/healthService';
import './services/exportService';
import { demoDataService } from './services/demoDataService';

// Import all panels
import QuotePanelSimple from './components/panels/QuotePanelSimple';
import WatchlistsPanel from './components/panels/WatchlistsPanel';
import WatchlistMonitorPanel from './components/panels/WatchlistMonitorPanel';
import CuratedListsPanel from './components/panels/CuratedListsPanel';
import RecommendationsPanel from './components/panels/RecommendationsPanel';
import TradeTicket from './components/panels/TradeTicket';
import BlotterPanel from './components/panels/BlotterPanel';
import PortfolioPanel from './components/panels/PortfolioPanel';
import ChartPanel from './components/panels/ChartPanel';
import AlertsPanel from './components/panels/AlertsPanel';
import TraderSearchPanel from './components/panels/TraderSearchPanel';
import TraderProfilePanel from './components/panels/TraderProfilePanel';
import FeedsPanel from './components/panels/FeedsPanel';
import ApiTesterPanel from './components/panels/ApiTesterPanel';
import HelpPanel from './components/panels/HelpPanel';
import ConnectionStatusPanel from './components/panels/ConnectionStatusPanel';
import AssetExplorerPanel from './components/panels/AssetExplorerPanel';
import ActivityPanel from './components/panels/ActivityPanel';
import StrategyBuilderPanel from './components/panels/StrategyBuilderPanel';
import FeedbackPanel from './components/panels/FeedbackPanel';
import QuantChatPanel from './components/panels/QuantChatPanel';
import PositionSizingPanel from './components/panels/PositionSizingPanel';
import DataExportPanel from './components/panels/DataExportPanel';
import TradeJournalPanel from './components/panels/TradeJournalPanel';
import CorrelationMatrixPanel from './components/panels/CorrelationMatrixPanel';
import WebhookAlertsPanel from './components/panels/WebhookAlertsPanel';
import NewsPanel from './components/panels/NewsPanel';
import InstitutionalPanel from './components/panels/InstitutionalPanel';
import FilingsPanel from './components/panels/FilingsPanel';

// Register all panel types
function registerPanels() {
  PanelRegistry.register({
    typeId: 'QT',
    title: 'Quote',
    component: QuotePanelSimple,
    defaultWidth: 400,
    defaultHeight: 350,
  });

  PanelRegistry.register({
    typeId: 'WL',
    title: 'Watchlists',
    component: WatchlistsPanel,
    defaultWidth: 300,
    defaultHeight: 400,
  });

  PanelRegistry.register({
    typeId: 'WLM',
    title: 'Watchlist Monitor',
    component: WatchlistMonitorPanel,
    defaultWidth: 500,
    defaultHeight: 400,
  });

  PanelRegistry.register({
    typeId: 'CUR',
    title: 'Curated Lists',
    component: CuratedListsPanel,
    defaultWidth: 400,
    defaultHeight: 400,
  });

  PanelRegistry.register({
    typeId: 'REC',
    title: 'Recommendations',
    component: RecommendationsPanel,
    defaultWidth: 400,
    defaultHeight: 400,
  });

  PanelRegistry.register({
    typeId: 'TRD',
    title: 'Trade Ticket',
    component: TradeTicket,
    defaultWidth: 350,
    defaultHeight: 450,
  });

  PanelRegistry.register({
    typeId: 'ORD',
    title: 'Blotter',
    component: BlotterPanel,
    defaultWidth: 600,
    defaultHeight: 400,
  });

  PanelRegistry.register({
    typeId: 'PF',
    title: 'Portfolio',
    component: PortfolioPanel,
    defaultWidth: 600,
    defaultHeight: 400,
  });

  PanelRegistry.register({
    typeId: 'CH',
    title: 'Chart',
    component: ChartPanel,
    defaultWidth: 500,
    defaultHeight: 350,
  });

  PanelRegistry.register({
    typeId: 'AL',
    title: 'Alerts',
    component: AlertsPanel,
    defaultWidth: 400,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'PI',
    title: 'Trader Search',
    component: TraderSearchPanel,
    defaultWidth: 600,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'PIP',
    title: 'Trader Profile',
    component: TraderProfilePanel,
    defaultWidth: 500,
    defaultHeight: 600,
  });

  PanelRegistry.register({
    typeId: 'FEED',
    title: 'Feeds',
    component: FeedsPanel,
    defaultWidth: 400,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'API',
    title: 'API Tester',
    component: ApiTesterPanel,
    defaultWidth: 500,
    defaultHeight: 600,
  });

  PanelRegistry.register({
    typeId: 'HELP',
    title: 'Help',
    component: HelpPanel,
    defaultWidth: 450,
    defaultHeight: 600,
  });

  PanelRegistry.register({
    typeId: 'STATUS',
    title: 'Connection Status',
    component: ConnectionStatusPanel,
    defaultWidth: 450,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'EXP',
    title: 'Asset Explorer',
    component: AssetExplorerPanel,
    defaultWidth: 600,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'ACT',
    title: 'Activity Log',
    component: ActivityPanel,
    defaultWidth: 400,
    defaultHeight: 450,
  });

  PanelRegistry.register({
    typeId: 'SB',
    title: 'Strategy Builder',
    component: StrategyBuilderPanel,
    defaultWidth: 800,
    defaultHeight: 600,
  });

  PanelRegistry.register({
    typeId: 'FB',
    title: 'Feedback',
    component: FeedbackPanel,
    defaultWidth: 450,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'QUANT',
    title: 'Quant Chat',
    component: QuantChatPanel,
    defaultWidth: 450,
    defaultHeight: 550,
  });

  PanelRegistry.register({
    typeId: 'PS',
    title: 'Position Sizing',
    component: PositionSizingPanel,
    defaultWidth: 400,
    defaultHeight: 600,
  });

  PanelRegistry.register({
    typeId: 'EXPORT',
    title: 'Data Export',
    component: DataExportPanel,
    defaultWidth: 400,
    defaultHeight: 550,
  });

  PanelRegistry.register({
    typeId: 'JOURNAL',
    title: 'Trade Journal',
    component: TradeJournalPanel,
    defaultWidth: 500,
    defaultHeight: 650,
  });

  PanelRegistry.register({
    typeId: 'CORR',
    title: 'Correlation Matrix',
    component: CorrelationMatrixPanel,
    defaultWidth: 550,
    defaultHeight: 600,
  });

  PanelRegistry.register({
    typeId: 'WEBHOOK',
    title: 'Webhook Alerts',
    component: WebhookAlertsPanel,
    defaultWidth: 450,
    defaultHeight: 600,
  });

  // v1.7.0 - Financial Datasets API panels
  PanelRegistry.register({
    typeId: 'NEWS',
    title: 'News',
    component: NewsPanel,
    defaultWidth: 450,
    defaultHeight: 550,
  });

  PanelRegistry.register({
    typeId: 'INST',
    title: 'Institutional Ownership',
    component: InstitutionalPanel,
    defaultWidth: 500,
    defaultHeight: 500,
  });

  PanelRegistry.register({
    typeId: 'FILINGS',
    title: 'SEC Filings',
    component: FilingsPanel,
    defaultWidth: 450,
    defaultHeight: 500,
  });
}

// Register panels on module load
registerPanels();
console.log('Panels registered:', PanelRegistry.getRegisteredTypes());

const appStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#00ff00',
    fontFamily: '"Courier New", monospace',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: '#0a0a0a',
    borderBottom: '2px solid #00ff00',
    gap: '16px',
  },
  commandBarContainer: {
    flex: 1,
    maxWidth: '800px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontFamily: '"Courier New", monospace',
    textAlign: 'center' as const,
    minWidth: '200px',
  },
  userFullName: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#00ff00',
  },
  userName: {
    fontSize: '11px',
    color: '#00cc00',
  },
  diagButton: {
    background: 'none',
    border: '1px solid #666',
    color: '#666',
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: '"Courier New", monospace',
    fontSize: '11px',
  },
  logoutButton: {
    background: 'none',
    border: '1px solid #cc0000',
    color: '#cc0000',
    padding: '4px 12px',
    cursor: 'pointer',
    fontFamily: '"Courier New", monospace',
    fontSize: '12px',
  },
  workspaceContainer: {
    flex: 1,
    overflow: 'hidden',
  },
};

// Map function codes to panel type IDs
const FUNCTION_TO_PANEL: Record<string, string> = {
  'QT': 'QT',
  'WL': 'WL',
  'WLM': 'WLM',
  'CUR': 'CUR',
  'REC': 'REC',
  'TRD': 'TRD',
  'ORD': 'ORD',
  'PF': 'PF',
  'PI': 'PI',
  'PIP': 'PIP',
  'CH': 'CH',
  'AL': 'AL',
  'FEED': 'FEED',
  'API': 'API',
  'HELP': 'HELP',
  'STATUS': 'STATUS',
  'EXP': 'EXP',
  'ACT': 'ACT',
  'SB': 'SB',
  'STRAT': 'SB',  // Alias for Strategy Builder
  'FB': 'FB',
  'FEEDBACK': 'FB',  // Alias for Feedback
  'QUANT': 'QUANT',
  'PS': 'PS',
  'SIZE': 'PS',  // Alias for Position Sizing
  'KELLY': 'PS',  // Alias for Position Sizing
  'RISK': 'PS',  // Alias for Position Sizing
  'EXPORT': 'EXPORT',
  'DATA': 'EXPORT',  // Alias for Data Export
  'CSV': 'EXPORT',  // Alias for Data Export
  'JSON': 'EXPORT',  // Alias for Data Export
  'JOURNAL': 'JOURNAL',
  'LOG': 'JOURNAL',  // Alias for Trade Journal
  'DIARY': 'JOURNAL',  // Alias for Trade Journal
  'TRADES': 'JOURNAL',  // Alias for Trade Journal
  'CORR': 'CORR',
  'MATRIX': 'CORR',  // Alias for Correlation Matrix
  'DIVERSIFY': 'CORR',  // Alias for Correlation Matrix
  'CORRELATION': 'CORR',  // Alias for Correlation Matrix
  'WEBHOOK': 'WEBHOOK',
  'HOOKS': 'WEBHOOK',  // Alias for Webhook Alerts
  'NOTIFY': 'WEBHOOK',  // Alias for Webhook Alerts
  'ALERTS': 'WEBHOOK',  // Alias for Webhook Alerts
  'CHAT': 'QUANT',
  'AI': 'QUANT',
};

function TerminalContent({ onLogout, userInfo, isDemo }: { onLogout: () => void; userInfo: { username: string; fullName: string; customerId: string } | null; isDemo: boolean }) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { addPanel, openPanelForSymbol } = useWorkspaceContext();

  const handleCommand = (command: CommandBarCommand) => {
    console.log('Command received:', command);
    
    if (command.type === 'function' && command.code) {
      const panelType = FUNCTION_TO_PANEL[command.code];
      if (panelType) {
        if (command.symbol) {
          openPanelForSymbol(panelType, command.symbol.symbol);
        } else {
          addPanel(panelType);
        }
      }
    } else if (command.type === 'symbol' && command.symbol) {
      openPanelForSymbol('QT', command.symbol.symbol);
    }
  };

  return (
    <div style={appStyles.container}>
      {/* Header with Command Bar */}
      <div style={appStyles.header}>
        <div style={appStyles.commandBarContainer}>
          <CommandBar onCommand={handleCommand} />
        </div>
        
        {/* User Info - Center */}
        {userInfo && (userInfo.fullName || userInfo.username || userInfo.customerId) && (
          <div style={appStyles.userInfo}>
            {userInfo.fullName && <span style={appStyles.userFullName}>{userInfo.fullName}</span>}
            {userInfo.username && <span style={appStyles.userName}>@{userInfo.username}</span>}
            {userInfo.customerId && <span style={appStyles.userName}> (CID: {userInfo.customerId})</span>}
          </div>
        )}
        
        <div style={appStyles.headerActions}>
          {isDemo && (
            <span style={{
              padding: '4px 10px',
              backgroundColor: '#1a1a2e',
              border: '1px solid #4a4a8a',
              color: '#8888ff',
              fontSize: '11px',
              fontFamily: '"Courier New", monospace',
            }}>
              🎮 DEMO
            </span>
          )}
          <TradingModeIndicator />
          <button
            style={appStyles.diagButton}
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            [ DIAG ]
          </button>
          <button style={appStyles.logoutButton} onClick={onLogout}>
            [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={appStyles.workspaceContainer}>
        <Workspace />
      </div>

      {/* Diagnostics Drawer */}
      <DiagnosticsDrawer
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
      />
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; fullName: string; customerId: string } | null>(null);

  // Check if keys are already stored and connect streaming
  useEffect(() => {
    const keys = keyManager.getKeys();
    if (keys) {
      // Update etoroApi with stored keys
      etoroApi.setKeys(keys.userKey, keys.apiKey);
      setIsLoggedIn(true);
      streamingService.connect();
      
      // Fetch user info
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const info = await etoroApi.getUserInfo();
      if (info) {
        const fullName = [info.firstName, info.lastName].filter(Boolean).join(' ') || '';
        setUserInfo({
          username: info.username || '',
          fullName: fullName,
          customerId: info.customerId || '',
        });
        keyManager.setUserInfo(info.username || '', fullName);
      }
    } catch (err) {
      console.warn('[App] Failed to fetch user info:', err);
    }
  };

  const handleLogin = async (publicKey: string, userKey: string) => {
    keyManager.setKeys(userKey, publicKey);
    // Update etoroApi singleton with new keys
    etoroApi.setKeys(userKey, publicKey);
    setIsLoggedIn(true);
    // Initialize streaming connection
    streamingService.connect();
    
    // Fetch user info from API after login
    await fetchUserInfo();
  };

  const handleLogout = () => {
    streamingService.disconnect();
    keyManager.clearKeys();
    demoDataService.setDemoMode(false);
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  const handleDemoMode = () => {
    demoDataService.setDemoMode(true);
    const demoInfo = demoDataService.getDemoUserInfo();
    setUserInfo({
      username: demoInfo.username,
      fullName: demoInfo.fullName,
      customerId: demoInfo.customerId,
    });
    setIsLoggedIn(true);
    console.log('[App] Demo mode enabled');
  };

  // Check for demo mode on mount
  useEffect(() => {
    if (demoDataService.isDemoMode()) {
      handleDemoMode();
    }
  }, []);

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} onDemoMode={handleDemoMode} error={null} loading={false} />;
  }

  return (
    <TradingModeProvider>
      <ActiveSymbolProvider>
        <WorkspaceProvider>
          <TerminalContent onLogout={handleLogout} userInfo={userInfo} isDemo={demoDataService.isDemoMode()} />
        </WorkspaceProvider>
      </ActiveSymbolProvider>
    </TradingModeProvider>
  );
}
