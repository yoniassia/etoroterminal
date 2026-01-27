import { useState } from 'react';

interface LoginProps {
  onLogin: (publicKey: string, userKey: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export default function Login({ onLogin, error, loading }: LoginProps) {
  const [publicKey, setPublicKey] = useState(import.meta.env.VITE_ETORO_PUBLIC_KEY || '');
  const [userKey, setUserKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publicKey && userKey && !loading) {
      await onLogin(publicKey, userKey);
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        ╔═══════════════════════════╗<br />
        ║   ETORO TERMINAL LOGIN   ║<br />
        ╚═══════════════════════════╝
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="publicKey">&gt; PUBLIC KEY:</label>
          <input
            id="publicKey"
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="Enter your public key"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="userKey">&gt; USER KEY:</label>
          <input
            id="userKey"
            type="text"
            value={userKey}
            onChange={(e) => setUserKey(e.target.value)}
            placeholder="Enter your user key"
            required
          />
        </div>

        <button type="submit" className="terminal-button" disabled={loading}>
          {loading ? '[ CONNECTING TO ETORO API... ]' : '[ LOGIN ]'}
        </button>

        {error && (
          <div className="error-message" style={{ marginTop: '15px' }}>
            ✗ ERROR: {error}
          </div>
        )}

        {loading && (
          <div className="loading" style={{ marginTop: '15px' }}>
            ▓▓▓ VALIDATING API KEYS ▓▓▓
          </div>
        )}
      </form>
    </div>
  );
}
