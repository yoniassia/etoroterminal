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
};

function TerminalContent({ onLogout, userInfo }: { onLogout: () => void; userInfo: { username: string; fullName: string } | null }) {
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
        {userInfo && (userInfo.fullName || userInfo.username) && (
          <div style={appStyles.userInfo}>
            {userInfo.fullName && <span style={appStyles.userFullName}>{userInfo.fullName}</span>}
            {userInfo.username && <span style={appStyles.userName}>@{userInfo.username}</span>}
          </div>
        )}
        
        <div style={appStyles.headerActions}>
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
  const [userInfo, setUserInfo] = useState<{ username: string; fullName: string } | null>(null);

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
        const fullName = [info.firstName, info.lastName].filter(Boolean).join(' ') || info.username || '';
        setUserInfo({
          username: info.username || '',
          fullName: fullName,
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
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <TradingModeProvider>
      <ActiveSymbolProvider>
        <WorkspaceProvider>
          <TerminalContent onLogout={handleLogout} userInfo={userInfo} />
        </WorkspaceProvider>
      </ActiveSymbolProvider>
    </TradingModeProvider>
  );
}
