import { useState } from 'react';
import Login from './components/Login';
import Portfolio from './components/Portfolio';
import { EToroApiService } from './services/etoroApi';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiService, setApiService] = useState<EToroApiService | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (publicKey: string, userKey: string) => {
    setLoggingIn(true);
    setLoginError(null);

    try {
      console.log('[App] Attempting login with provided keys...');

      // Create API service instance with provided keys
      const apiInstance = new EToroApiService(userKey, publicKey);

      // Validate by making a test API call
      console.log('[App] Testing API connection...');
      await apiInstance.getPortfolio();

      console.log('[App] ✅ API connection successful!');
      setApiService(apiInstance);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('[App] ❌ Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to eToro API';
      setLoginError(errorMessage);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setApiService(null);
    setLoginError(null);
  };

  return (
    <>
      {!isLoggedIn ? (
        <Login
          onLogin={handleLogin}
          error={loginError}
          loading={loggingIn}
        />
      ) : (
        <Portfolio
          apiService={apiService!}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
