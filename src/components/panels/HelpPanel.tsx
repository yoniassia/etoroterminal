import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './HelpPanel.css';

export default function HelpPanel(_props: PanelContentProps) {
  return (
    <div className="help-panel">
      <div className="help-header">
        <h2>▓ eTORO TERMINAL HELP</h2>
      </div>

      <div className="help-content">
        <section className="help-section">
          <h3>📋 Overview</h3>
          <p>
            This is a Bloomberg-like terminal for eToro traders. It provides real-time 
            streaming quotes, watchlist management, trading capabilities, and portfolio 
            monitoring using eToro's Public APIs.
          </p>
        </section>

        <section className="help-section">
          <h3>🚀 Getting Started</h3>
          <ol>
            <li>
              <strong>Get API Keys:</strong> Visit{' '}
              <a href="https://www.etoro.com/settings/trade" target="_blank" rel="noopener noreferrer">
                eToro Settings → Trading
              </a>{' '}
              to generate your API keys
            </li>
            <li><strong>Login:</strong> Enter your Public Key and User Key on the login screen</li>
            <li><strong>Start Trading:</strong> Use the command bar or toolbar to open panels</li>
          </ol>
        </section>

        <section className="help-section">
          <h3>⌨️ Command Bar</h3>
          <p>Type commands in the command bar at the top:</p>
          <table className="command-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>AAPL</td><td>Set AAPL as active symbol</td></tr>
              <tr><td>AAPL QT</td><td>Open Quote panel for AAPL</td></tr>
              <tr><td>AAPL TRD</td><td>Open Trade Ticket for AAPL</td></tr>
              <tr><td>WL</td><td>Open Watchlists panel</td></tr>
              <tr><td>ORD</td><td>Open Orders Blotter</td></tr>
              <tr><td>PF</td><td>Open Portfolio panel</td></tr>
              <tr><td>CH</td><td>Open Chart panel</td></tr>
              <tr><td>AL</td><td>Open Alerts panel</td></tr>
              <tr><td>PI</td><td>Open Trader Search</td></tr>
            </tbody>
          </table>
        </section>

        <section className="help-section">
          <h3>🖥️ Default Panels</h3>
          <p>On login, the terminal automatically opens:</p>
          <ul>
            <li><strong>Quote (QT)</strong> - Real-time bid/ask/last prices</li>
            <li><strong>Chart (CH)</strong> - Price chart with live updates</li>
            <li><strong>Watchlist Monitor (WLM)</strong> - Streaming watchlist table</li>
            <li><strong>Trade Ticket (TRD)</strong> - Quick order entry</li>
          </ul>
        </section>

        <section className="help-section">
          <h3>🔗 Panel Linking</h3>
          <p>Panels can be linked to follow the same symbol:</p>
          <ul>
            <li><strong>Follow Active:</strong> Panel updates when active symbol changes</li>
            <li><strong>Group A/B/C:</strong> Panels in same group sync together</li>
            <li><strong>Pinned:</strong> Panel stays on its current symbol</li>
          </ul>
        </section>

        <section className="help-section">
          <h3>⚡ Keyboard Shortcuts</h3>
          <table className="command-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>/</td><td>Focus command bar</td></tr>
              <tr><td>Escape</td><td>Close dropdowns/modals</td></tr>
              <tr><td>↑ ↓</td><td>Navigate lists</td></tr>
              <tr><td>Enter</td><td>Select/confirm</td></tr>
              <tr><td>Ctrl+B</td><td>Buy (in trade ticket)</td></tr>
              <tr><td>Ctrl+S</td><td>Sell (in trade ticket)</td></tr>
            </tbody>
          </table>
        </section>

        <section className="help-section">
          <h3>📡 WebSocket Streaming</h3>
          <p>
            Live prices stream via WebSocket. Look for the connection indicator:
          </p>
          <ul>
            <li><span className="status-indicator connected">●</span> Connected - Live data flowing</li>
            <li><span className="status-indicator reconnecting">●</span> Reconnecting - Attempting to reconnect</li>
            <li><span className="status-indicator disconnected">●</span> Disconnected - No live data</li>
          </ul>
        </section>

        <section className="help-section">
          <h3>🔒 Demo vs Real Mode</h3>
          <p>Toggle between Demo and Real trading modes:</p>
          <ul>
            <li><strong>Demo Mode:</strong> Practice trading with virtual money</li>
            <li><strong>Real Mode:</strong> Live trading (requires confirmation for orders)</li>
          </ul>
          <p className="warning">
            ⚠️ Real trading involves real money. Always confirm your orders carefully.
          </p>
        </section>

        <section className="help-section">
          <h3>🧪 API Tester</h3>
          <p>
            Use the <strong>API</strong> panel to test eToro API endpoints directly.
            Select an endpoint, fill in parameters, and click Execute to see the response.
          </p>
        </section>

        <section className="help-section">
          <h3>🔧 Diagnostics</h3>
          <p>
            Click the <strong>[ DIAG ]</strong> button to open the diagnostics drawer.
            View REST logs, WebSocket events, and export support bundles.
          </p>
        </section>

        <section className="help-section">
          <h3>📚 API Documentation</h3>
          <p>
            Full API documentation:{' '}
            <a href="https://public-api.etoro.com/index.html" target="_blank" rel="noopener noreferrer">
              eToro Public API Docs
            </a>
          </p>
          <p>
            OpenAPI Spec:{' '}
            <a href="https://public-api.etoro.com/swagger/swagger.json" target="_blank" rel="noopener noreferrer">
              swagger.json
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
