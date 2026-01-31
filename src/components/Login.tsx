import { useState } from 'react';
import { APP_VERSION } from '../config/version';
import { demoDataService } from '../services/demoDataService';

interface LoginProps {
  onLogin: (publicKey: string, userKey: string) => Promise<void>;
  onDemoMode: () => void;
  error: string | null;
  loading: boolean;
}

type RequestType = 'access' | 'feedback' | 'bug' | 'other';

const FEEDBACK_API = '/api/feedback';

export default function Login({ onLogin, onDemoMode, error, loading }: LoginProps) {
  const [publicKey, setPublicKey] = useState(import.meta.env.VITE_ETORO_PUBLIC_KEY || 'sdgdskldFPLGfjHn1421dgnlxdGTbngdflg6290bRjslfihsjhSDsdgGHH25hjf');
  const [userKey, setUserKey] = useState('');
  
  // Feedback/Request state
  const [showRequest, setShowRequest] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('access');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publicKey && userKey && !loading) {
      await onLogin(publicKey, userKey);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setSubmitError('All fields are required');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Send to feedback API
      const response = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: requestType === 'access' ? 'feature' : requestType,
          source: 'login-page',
          title: requestType === 'access' 
            ? `API Access Request from ${name}`
            : `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} from ${name}`,
          description: message,
          category: 'Login Page',
          metadata: {
            name,
            email,
            requestType,
            version: APP_VERSION,
            timestamp: new Date().toISOString(),
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
        setShowRequest(false);
      }, 5000);

    } catch {
      // Store locally if server fails
      const requests = JSON.parse(localStorage.getItem('etoro-terminal-requests') || '[]');
      requests.push({
        type: requestType,
        name,
        email,
        message,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('etoro-terminal-requests', JSON.stringify(requests));
      
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowRequest(false);
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const requestTypeLabels: Record<RequestType, { label: string; emoji: string }> = {
    access: { label: 'Request API Access', emoji: '🔑' },
    feedback: { label: 'General Feedback', emoji: '💬' },
    bug: { label: 'Report a Bug', emoji: '🐛' },
    other: { label: 'Other', emoji: '📝' },
  };

  return (
    <div className="terminal" style={{ maxWidth: '500px' }}>
      <a 
        href="/changelog.html" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'block',
          textAlign: 'center',
          marginBottom: '10px',
          color: '#00ff41',
          textDecoration: 'none',
          fontSize: '12px',
          opacity: 0.8,
          transition: 'opacity 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        v{APP_VERSION} - View Changelog
      </a>
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

        {/* Demo Mode Button */}
        <button
          type="button"
          onClick={() => {
            demoDataService.setDemoMode(true);
            onDemoMode();
          }}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '12px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #4a4a8a',
            color: '#8888ff',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#252545';
              e.currentTarget.style.borderColor = '#6666aa';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a2e';
            e.currentTarget.style.borderColor = '#4a4a8a';
          }}
        >
          [ 🎮 DEMO MODE - NO CREDENTIALS NEEDED ]
        </button>
        <div style={{
          fontSize: '10px',
          color: '#666',
          textAlign: 'center',
          marginTop: '5px',
        }}>
          Try the terminal with sample data (perfect for agents & testing)
        </div>

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

      {/* Divider */}
      <div style={{
        margin: '25px 0 15px',
        borderTop: '1px dashed #333',
        paddingTop: '15px',
        textAlign: 'center',
      }}>
        <button
          onClick={() => setShowRequest(!showRequest)}
          style={{
            background: 'none',
            border: '1px solid #00cc00',
            color: '#00cc00',
            padding: '8px 16px',
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#002200';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {showRequest ? '[ − CLOSE ]' : '[ 💬 FEEDBACK / REQUEST ACCESS ]'}
        </button>
      </div>

      {/* Request/Feedback Form */}
      {showRequest && (
        <div style={{
          marginTop: '10px',
          padding: '15px',
          border: '1px solid #333',
          backgroundColor: '#0a0a0a',
        }}>
          {submitted ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#00ff00',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>✓</div>
              <div>Thank you! We'll get back to you soon.</div>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit}>
              {/* Request Type Selector */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#888',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                }}>
                  What would you like to do?
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Object.keys(requestTypeLabels) as RequestType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRequestType(type)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid',
                        borderColor: requestType === type ? '#00cc00' : '#444',
                        backgroundColor: requestType === type ? '#002200' : '#111',
                        color: requestType === type ? '#00ff00' : '#888',
                        fontFamily: '"Courier New", monospace',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {requestTypeLabels[type].emoji} {requestTypeLabels[type].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="reqName" style={{ color: '#888', fontSize: '11px' }}>
                  &gt; YOUR NAME:
                </label>
                <input
                  id="reqName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#111',
                    border: '1px solid #333',
                    color: '#00ff00',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="reqEmail" style={{ color: '#888', fontSize: '11px' }}>
                  &gt; EMAIL:
                </label>
                <input
                  id="reqEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#111',
                    border: '1px solid #333',
                    color: '#00ff00',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Message */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="reqMessage" style={{ color: '#888', fontSize: '11px' }}>
                  &gt; {requestType === 'access' ? 'WHY DO YOU NEED ACCESS?' : 'YOUR MESSAGE:'}
                </label>
                <textarea
                  id="reqMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    requestType === 'access'
                      ? "Tell us about yourself and why you'd like access to the API..."
                      : "Your feedback or message..."
                  }
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#111',
                    border: '1px solid #333',
                    color: '#00ff00',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {submitError && (
                <div style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginBottom: '10px',
                  padding: '8px',
                  backgroundColor: '#331111',
                  border: '1px solid #662222',
                }}>
                  ✗ {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#002200',
                  border: '1px solid #00cc00',
                  color: '#00ff00',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? '[ SENDING... ]' : '[ SUBMIT ]'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '10px',
        color: '#444',
      }}>
        Don't have API keys? Click "Feedback / Request Access" above.
      </div>
    </div>
  );
}
