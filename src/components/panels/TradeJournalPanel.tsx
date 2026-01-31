/**
 * Trade Journal Panel
 * Log trades with reasoning, review performance, learn from mistakes
 * Commands: JOURNAL, LOG, DIARY
 */

import { useState, useEffect, useCallback } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './TradeJournalPanel.css';

interface JournalEntry {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  status: 'open' | 'closed' | 'stopped';
  reasoning: string;
  emotions: string[];
  setup: string;
  lessons?: string;
  profit?: number;
  profitPercent?: number;
  tags: string[];
}

type ViewMode = 'list' | 'add' | 'stats';

const EMOTION_OPTIONS = ['😊 Confident', '😰 Anxious', '😤 FOMO', '🤔 Uncertain', '😎 Calm', '😡 Revenge'];
const SETUP_OPTIONS = ['Breakout', 'Pullback', 'Trend Follow', 'Mean Reversion', 'News', 'Earnings', 'Technical', 'Fundamental'];

const STORAGE_KEY = 'etoro-terminal-journal';

export default function TradeJournalPanel(_props: PanelContentProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  // Form state
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [setup, setSetup] = useState('');
  const [lessons, setLessons] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'open' | 'closed' | 'stopped'>('open');

  // Load entries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load journal entries:', e);
      }
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = useCallback((newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  }, []);

  const resetForm = useCallback(() => {
    setSymbol('');
    setSide('BUY');
    setEntryPrice('');
    setExitPrice('');
    setQuantity('');
    setReasoning('');
    setSelectedEmotions([]);
    setSetup('');
    setLessons('');
    setTags('');
    setStatus('open');
    setEditingEntry(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!symbol || !entryPrice || !quantity || !reasoning) {
      alert('Please fill in required fields: Symbol, Entry Price, Quantity, Reasoning');
      return;
    }

    const entry = parseFloat(entryPrice);
    const exit = exitPrice ? parseFloat(exitPrice) : undefined;
    const qty = parseFloat(quantity);
    
    let profit: number | undefined;
    let profitPercent: number | undefined;
    
    if (exit && status !== 'open') {
      profit = side === 'BUY' 
        ? (exit - entry) * qty 
        : (entry - exit) * qty;
      profitPercent = side === 'BUY'
        ? ((exit - entry) / entry) * 100
        : ((entry - exit) / entry) * 100;
    }

    const newEntry: JournalEntry = {
      id: editingEntry?.id || `trade-${Date.now()}`,
      timestamp: editingEntry?.timestamp || new Date().toISOString(),
      symbol: symbol.toUpperCase(),
      side,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      status,
      reasoning,
      emotions: selectedEmotions,
      setup,
      lessons,
      profit,
      profitPercent,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (editingEntry) {
      saveEntries(entries.map(e => e.id === editingEntry.id ? newEntry : e));
    } else {
      saveEntries([newEntry, ...entries]);
    }

    resetForm();
    setViewMode('list');
  }, [symbol, side, entryPrice, exitPrice, quantity, status, reasoning, selectedEmotions, setup, lessons, tags, editingEntry, entries, saveEntries, resetForm]);

  const handleEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setSymbol(entry.symbol);
    setSide(entry.side);
    setEntryPrice(entry.entryPrice.toString());
    setExitPrice(entry.exitPrice?.toString() || '');
    setQuantity(entry.quantity.toString());
    setReasoning(entry.reasoning);
    setSelectedEmotions(entry.emotions);
    setSetup(entry.setup);
    setLessons(entry.lessons || '');
    setTags(entry.tags.join(', '));
    setStatus(entry.status);
    setViewMode('add');
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Delete this journal entry?')) {
      saveEntries(entries.filter(e => e.id !== id));
    }
  }, [entries, saveEntries]);

  const toggleEmotion = useCallback((emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  }, []);

  // Stats calculations
  const stats = {
    totalTrades: entries.length,
    openTrades: entries.filter(e => e.status === 'open').length,
    closedTrades: entries.filter(e => e.status !== 'open').length,
    winners: entries.filter(e => (e.profit || 0) > 0).length,
    losers: entries.filter(e => (e.profit || 0) < 0).length,
    winRate: entries.filter(e => e.status !== 'open').length > 0 
      ? (entries.filter(e => (e.profit || 0) > 0).length / entries.filter(e => e.status !== 'open').length * 100).toFixed(1)
      : 0,
    totalProfit: entries.reduce((sum, e) => sum + (e.profit || 0), 0),
    avgProfit: entries.filter(e => e.profit).length > 0
      ? entries.reduce((sum, e) => sum + (e.profit || 0), 0) / entries.filter(e => e.profit).length
      : 0,
  };

  return (
    <div className="trade-journal-panel">
      <div className="tj-header">
        <h3>📔 Trade Journal</h3>
        <div className="tj-tabs">
          <button 
            className={`tj-tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => { setViewMode('list'); resetForm(); }}
          >
            📋 Entries
          </button>
          <button 
            className={`tj-tab ${viewMode === 'add' ? 'active' : ''}`}
            onClick={() => setViewMode('add')}
          >
            ➕ {editingEntry ? 'Edit' : 'New'}
          </button>
          <button 
            className={`tj-tab ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
          >
            📊 Stats
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="tj-entries">
          {entries.length === 0 ? (
            <div className="tj-empty">
              <p>No journal entries yet.</p>
              <p className="tj-empty-hint">Start logging your trades to track performance and learn from mistakes.</p>
              <button className="tj-add-first-btn" onClick={() => setViewMode('add')}>
                ➕ Add First Entry
              </button>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className={`tj-entry ${entry.status}`}>
                <div className="tj-entry-header">
                  <span className={`tj-entry-side ${entry.side.toLowerCase()}`}>{entry.side}</span>
                  <span className="tj-entry-symbol">{entry.symbol}</span>
                  <span className="tj-entry-status">{entry.status.toUpperCase()}</span>
                  {entry.profit !== undefined && (
                    <span className={`tj-entry-profit ${entry.profit >= 0 ? 'positive' : 'negative'}`}>
                      {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(2)} ({entry.profitPercent?.toFixed(1)}%)
                    </span>
                  )}
                </div>
                <div className="tj-entry-details">
                  <span>Entry: ${entry.entryPrice}</span>
                  {entry.exitPrice && <span>Exit: ${entry.exitPrice}</span>}
                  <span>Qty: {entry.quantity}</span>
                </div>
                <div className="tj-entry-reasoning">
                  <strong>Why:</strong> {entry.reasoning}
                </div>
                {entry.lessons && (
                  <div className="tj-entry-lessons">
                    <strong>Lessons:</strong> {entry.lessons}
                  </div>
                )}
                <div className="tj-entry-meta">
                  <span className="tj-entry-date">{new Date(entry.timestamp).toLocaleDateString()}</span>
                  {entry.setup && <span className="tj-entry-setup">{entry.setup}</span>}
                  {entry.emotions.length > 0 && (
                    <span className="tj-entry-emotions">{entry.emotions.join(' ')}</span>
                  )}
                </div>
                <div className="tj-entry-actions">
                  <button onClick={() => handleEdit(entry)}>✏️ Edit</button>
                  <button onClick={() => handleDelete(entry.id)}>🗑️ Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'add' && (
        <div className="tj-form">
          <div className="tj-form-row">
            <div className="tj-form-field">
              <label>Symbol *</label>
              <input 
                type="text" 
                value={symbol} 
                onChange={e => setSymbol(e.target.value)}
                placeholder="AAPL"
              />
            </div>
            <div className="tj-form-field">
              <label>Side</label>
              <div className="tj-side-buttons">
                <button 
                  className={`tj-side-btn buy ${side === 'BUY' ? 'active' : ''}`}
                  onClick={() => setSide('BUY')}
                >BUY</button>
                <button 
                  className={`tj-side-btn sell ${side === 'SELL' ? 'active' : ''}`}
                  onClick={() => setSide('SELL')}
                >SELL</button>
              </div>
            </div>
          </div>

          <div className="tj-form-row">
            <div className="tj-form-field">
              <label>Entry Price *</label>
              <input 
                type="number" 
                value={entryPrice} 
                onChange={e => setEntryPrice(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="tj-form-field">
              <label>Exit Price</label>
              <input 
                type="number" 
                value={exitPrice} 
                onChange={e => setExitPrice(e.target.value)}
                placeholder="105.00"
              />
            </div>
            <div className="tj-form-field">
              <label>Quantity *</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <div className="tj-form-field">
            <label>Status</label>
            <div className="tj-status-buttons">
              {(['open', 'closed', 'stopped'] as const).map(s => (
                <button 
                  key={s}
                  className={`tj-status-btn ${status === s ? 'active' : ''}`}
                  onClick={() => setStatus(s)}
                >{s.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div className="tj-form-field">
            <label>Setup Type</label>
            <div className="tj-setup-grid">
              {SETUP_OPTIONS.map(s => (
                <button 
                  key={s}
                  className={`tj-setup-btn ${setup === s ? 'active' : ''}`}
                  onClick={() => setSetup(s)}
                >{s}</button>
              ))}
            </div>
          </div>

          <div className="tj-form-field">
            <label>Emotions</label>
            <div className="tj-emotion-grid">
              {EMOTION_OPTIONS.map(e => (
                <button 
                  key={e}
                  className={`tj-emotion-btn ${selectedEmotions.includes(e) ? 'active' : ''}`}
                  onClick={() => toggleEmotion(e)}
                >{e}</button>
              ))}
            </div>
          </div>

          <div className="tj-form-field">
            <label>Reasoning / Thesis *</label>
            <textarea 
              value={reasoning} 
              onChange={e => setReasoning(e.target.value)}
              placeholder="Why did you take this trade? What was your thesis?"
              rows={3}
            />
          </div>

          <div className="tj-form-field">
            <label>Lessons Learned</label>
            <textarea 
              value={lessons} 
              onChange={e => setLessons(e.target.value)}
              placeholder="What did you learn? What would you do differently?"
              rows={2}
            />
          </div>

          <div className="tj-form-field">
            <label>Tags (comma separated)</label>
            <input 
              type="text" 
              value={tags} 
              onChange={e => setTags(e.target.value)}
              placeholder="swing, tech, earnings"
            />
          </div>

          <div className="tj-form-actions">
            <button className="tj-cancel-btn" onClick={() => { resetForm(); setViewMode('list'); }}>
              Cancel
            </button>
            <button className="tj-save-btn" onClick={handleSave}>
              {editingEntry ? '💾 Update Entry' : '💾 Save Entry'}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'stats' && (
        <div className="tj-stats">
          <div className="tj-stat-grid">
            <div className="tj-stat-card">
              <span className="tj-stat-value">{stats.totalTrades}</span>
              <span className="tj-stat-label">Total Trades</span>
            </div>
            <div className="tj-stat-card">
              <span className="tj-stat-value">{stats.openTrades}</span>
              <span className="tj-stat-label">Open</span>
            </div>
            <div className="tj-stat-card">
              <span className="tj-stat-value">{stats.winRate}%</span>
              <span className="tj-stat-label">Win Rate</span>
            </div>
            <div className="tj-stat-card">
              <span className={`tj-stat-value ${stats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                ${stats.totalProfit.toFixed(2)}
              </span>
              <span className="tj-stat-label">Total P/L</span>
            </div>
            <div className="tj-stat-card">
              <span className="tj-stat-value positive">{stats.winners}</span>
              <span className="tj-stat-label">Winners</span>
            </div>
            <div className="tj-stat-card">
              <span className="tj-stat-value negative">{stats.losers}</span>
              <span className="tj-stat-label">Losers</span>
            </div>
          </div>

          <div className="tj-stat-insight">
            <h4>📈 Insights</h4>
            {stats.winRate >= 50 ? (
              <p className="positive">Your win rate is above 50%. Focus on position sizing to maximize gains.</p>
            ) : stats.closedTrades > 0 ? (
              <p className="negative">Your win rate is below 50%. Review your losing trades for patterns.</p>
            ) : (
              <p>Close some trades to see performance insights.</p>
            )}
          </div>

          <div className="tj-quote">
            "The goal of a successful trader is to make the best trades. Money is secondary." - Alexander Elder
          </div>
        </div>
      )}
    </div>
  );
}
