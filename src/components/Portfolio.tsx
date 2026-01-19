import { useState, useEffect } from 'react';
import { etoroApi, PortfolioData, UserInfo, Position } from '../services/etoroApi';

interface PortfolioProps {
  username: string;
  onLogout: () => void;
}

export default function Portfolio({ username, onLogout }: PortfolioProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching portfolio and user data...');

      // Fetch both portfolio and user info in parallel
      const [portfolio, user] = await Promise.all([
        etoroApi.getPortfolio(),
        etoroApi.getUserInfo(),
      ]);

      console.log('Portfolio data received:', portfolio);
      console.log('User info received:', user);

      setPortfolioData(portfolio);
      setUserInfo(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('Fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        ╔═════════════════════════════╗<br />
        ║   eTORO PORTFOLIO TERMINAL  ║<br />
        ╚═════════════════════════════╝
      </div>

      <div className="portfolio-container">
        <div className="portfolio-header">
          <div>
            <span style={{ color: '#00cc00' }}>&gt; USER:</span> {userInfo?.username || username}
            {userInfo?.customerId && (
              <span style={{ color: '#008800', fontSize: '12px', marginLeft: '10px' }}>
                (ID: {userInfo.customerId})
              </span>
            )}
          </div>
          <button className="logout-button" onClick={onLogout}>
            [ LOGOUT ]
          </button>
        </div>

        <button
          className="terminal-button"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? '[ LOADING... ]' : '[ FETCH PORTFOLIO DATA ]'}
        </button>

        {loading && (
          <div className="loading">
            ▓▓▓ CONNECTING TO eTORO API ▓▓▓
          </div>
        )}

        {error && (
          <div className="error-message">
            ✗ ERROR: {error}
          </div>
        )}

        {portfolioData && !loading && (
          <>
            <div className="portfolio-label">
              ═══════════════════════════════
            </div>

            {/* Total Value */}
            <div className="portfolio-label">
              TOTAL PORTFOLIO VALUE
            </div>
            <div className="portfolio-value">
              ${portfolioData.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>

            {/* Breakdown */}
            <div className="portfolio-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">&gt; Available Credit:</span>
                <span className="breakdown-value">
                  ${portfolioData.credit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {portfolioData.bonusCredit > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-label">&gt; Bonus Credit:</span>
                  <span className="breakdown-value">
                    ${portfolioData.bonusCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="breakdown-item">
                <span className="breakdown-label">&gt; Positions Value:</span>
                <span className="breakdown-value">
                  ${portfolioData.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Positions */}
            {portfolioData.positions && portfolioData.positions.length > 0 && (
              <>
                <div className="portfolio-label" style={{ marginTop: '20px' }}>
                  ═══════════════════════════════
                </div>
                <div className="portfolio-label">
                  OPEN POSITIONS ({portfolioData.positions.length})
                </div>
                <div className="positions-list">
                  {portfolioData.positions.map((position: Position, index: number) => (
                    <div key={position.positionId} className="position-item">
                      <div className="position-header">
                        <span className="position-label">Position #{index + 1}</span>
                        <span className="position-badge" style={{
                          color: position.isBuy ? '#00ff00' : '#ff4444'
                        }}>
                          {position.isBuy ? 'BUY' : 'SELL'}
                        </span>
                      </div>
                      <div className="position-details">
                        <div className="position-row">
                          <span>&gt; Instrument ID:</span>
                          <span>{position.instrumentId}</span>
                        </div>
                        <div className="position-row">
                          <span>&gt; Amount:</span>
                          <span>${position.amount.toFixed(2)}</span>
                        </div>
                        <div className="position-row">
                          <span>&gt; Units:</span>
                          <span>{position.units.toFixed(6)}</span>
                        </div>
                        <div className="position-row">
                          <span>&gt; Open Rate:</span>
                          <span>{position.openRate.toFixed(4)}</span>
                        </div>
                        <div className="position-row">
                          <span>&gt; Leverage:</span>
                          <span>x{position.leverage}</span>
                        </div>
                        <div className="position-row">
                          <span>&gt; Opened:</span>
                          <span>{new Date(position.openDateTime).toLocaleString()}</span>
                        </div>
                        {position.stopLossRate && position.stopLossRate > 0 && (
                          <div className="position-row">
                            <span>&gt; Stop Loss:</span>
                            <span>{position.stopLossRate.toFixed(4)}</span>
                          </div>
                        )}
                        {position.takeProfitRate && position.takeProfitRate > 0 && (
                          <div className="position-row">
                            <span>&gt; Take Profit:</span>
                            <span>{position.takeProfitRate.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="portfolio-label" style={{ marginTop: '20px' }}>
              ═══════════════════════════════
            </div>
          </>
        )}
      </div>
    </div>
  );
}
