import { useState } from 'react';
import Login from './components/Login';
import Portfolio from './components/Portfolio';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState('');

  const handleLogin = (publicKey: string, userKey: string) => {
    // Store a shortened version of the public key for display
    // In production, these keys would be validated against the API
    const shortKey = publicKey.substring(0, 12) + '...';
    setUserIdentifier(shortKey);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserIdentifier('');
  };

  return (
    <>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Portfolio username={userIdentifier} onLogout={handleLogout} />
      )}
    </>
  );
}
