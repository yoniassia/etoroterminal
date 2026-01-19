import { useState, useEffect } from 'react';
import { etoroApi } from '../services/etoroApi';

interface PortfolioProps {
  username: string;
  onLogout: () => void;
}

export default function Portfolio({ username, onLogout }: PortfolioProps) {
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioValue = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching portfolio data...');
      const data = await etoroApi.getPortfolio();
      console.log('Portfolio data received:', data);
      setPortfolioValue(data.totalValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio data';
      console.error('Portfolio fetch error:', err);
      console.error('Error details:', errorMessage);
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
            <span style={{ color: '#00cc00' }}>&gt; USER:</span> {username}
          </div>
          <button className="logout-button" onClick={onLogout}>
            [ LOGOUT ]
          </button>
        </div>

        <button
          className="terminal-button"
          onClick={fetchPortfolioValue}
          disabled={loading}
        >
          {loading ? '[ LOADING... ]' : '[ FETCH PORTFOLIO VALUE ]'}
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

        {portfolioValue !== null && !loading && (
          <>
            <div className="portfolio-label">
              ═══════════════════════════════
            </div>
            <div className="portfolio-label">
              TOTAL PORTFOLIO VALUE
            </div>
            <div className="portfolio-value">
              ${portfolioValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="portfolio-label">
              ═══════════════════════════════
            </div>
          </>
        )}
      </div>
    </div>
  );
}
