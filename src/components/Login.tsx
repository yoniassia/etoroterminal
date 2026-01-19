import { useState } from 'react';

interface LoginProps {
  onLogin: (publicKey: string, userKey: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [publicKey, setPublicKey] = useState(import.meta.env.VITE_ETORO_PUBLIC_KEY || '');
  const [userKey, setUserKey] = useState(import.meta.env.VITE_ETORO_USER_KEY || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (publicKey && userKey) {
      onLogin(publicKey, userKey);
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        ╔═══════════════════════════╗<br />
        ║   eTORO TERMINAL LOGIN   ║<br />
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

        <button type="submit" className="terminal-button">
          [ LOGIN ]
        </button>
      </form>
    </div>
  );
}
