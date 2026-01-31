/**
 * Webhook Alerts Panel
 * Configure webhooks to receive alerts when conditions are met
 * Commands: WEBHOOK, HOOKS, NOTIFY
 */

import { useState, useEffect, useCallback } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './WebhookAlertsPanel.css';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

type AlertEvent = 
  | 'price_above'
  | 'price_below'
  | 'position_opened'
  | 'position_closed'
  | 'profit_target'
  | 'stop_loss'
  | 'daily_summary';

const EVENT_OPTIONS: { value: AlertEvent; label: string; description: string }[] = [
  { value: 'price_above', label: '📈 Price Above', description: 'When a symbol crosses above a threshold' },
  { value: 'price_below', label: '📉 Price Below', description: 'When a symbol drops below a threshold' },
  { value: 'position_opened', label: '🟢 Position Opened', description: 'When a new position is opened' },
  { value: 'position_closed', label: '🔴 Position Closed', description: 'When a position is closed' },
  { value: 'profit_target', label: '🎯 Profit Target', description: 'When profit reaches a target %' },
  { value: 'stop_loss', label: '🛑 Stop Loss', description: 'When a stop loss is triggered' },
  { value: 'daily_summary', label: '📊 Daily Summary', description: 'Daily portfolio summary at market close' },
];

const STORAGE_KEY = 'etoro-terminal-webhooks';

export default function WebhookAlertsPanel(_props: PanelContentProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWebhooks(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load webhooks:', e);
      }
    }
  }, []);

  // Save to localStorage
  const saveWebhooks = useCallback((newWebhooks: WebhookConfig[]) => {
    setWebhooks(newWebhooks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWebhooks));
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setUrl('');
    setSelectedEvents([]);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) {
      alert('Please fill in name, URL, and select at least one event');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    const webhook: WebhookConfig = {
      id: editingId || `webhook-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      enabled: true,
      events: selectedEvents,
      createdAt: editingId ? webhooks.find(w => w.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      triggerCount: editingId ? webhooks.find(w => w.id === editingId)?.triggerCount || 0 : 0,
    };

    if (editingId) {
      saveWebhooks(webhooks.map(w => w.id === editingId ? webhook : w));
    } else {
      saveWebhooks([...webhooks, webhook]);
    }

    resetForm();
  }, [name, url, selectedEvents, editingId, webhooks, saveWebhooks, resetForm]);

  const handleEdit = useCallback((webhook: WebhookConfig) => {
    setEditingId(webhook.id);
    setName(webhook.name);
    setUrl(webhook.url);
    setSelectedEvents(webhook.events);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Delete this webhook?')) {
      saveWebhooks(webhooks.filter(w => w.id !== id));
    }
  }, [webhooks, saveWebhooks]);

  const handleToggle = useCallback((id: string) => {
    saveWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  }, [webhooks, saveWebhooks]);

  const handleTest = useCallback(async (webhook: WebhookConfig) => {
    setTestResult({ id: webhook.id, success: false, message: 'Testing...' });
    
    try {
      // TODO: In a real implementation, send test payload to webhook URL
      // Test payload would be: { event: 'test', timestamp, source, message, data: {...} }
      // For now, we simulate the test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success (in production, would check actual response)
      setTestResult({
        id: webhook.id,
        success: true,
        message: `✅ Test payload sent successfully`,
      });

      // Update trigger count
      saveWebhooks(webhooks.map(w => 
        w.id === webhook.id 
          ? { ...w, lastTriggered: new Date().toISOString(), triggerCount: w.triggerCount + 1 }
          : w
      ));

    } catch (error) {
      setTestResult({
        id: webhook.id,
        success: false,
        message: `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Clear result after 5 seconds
    setTimeout(() => setTestResult(null), 5000);
  }, [webhooks, saveWebhooks]);

  const toggleEvent = useCallback((event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  }, []);

  return (
    <div className="webhook-alerts-panel">
      <div className="wa-header">
        <h3>🔔 Webhook Alerts</h3>
        <p className="wa-subtitle">Get notified when trading events occur</p>
      </div>

      {/* Add Button */}
      {!showForm && (
        <button className="wa-add-btn" onClick={() => setShowForm(true)}>
          ➕ Add Webhook
        </button>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="wa-form">
          <div className="wa-form-header">
            {editingId ? '✏️ Edit Webhook' : '➕ New Webhook'}
          </div>

          <div className="wa-form-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Discord Alert"
            />
          </div>

          <div className="wa-form-field">
            <label>Webhook URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
            />
            <span className="wa-hint">Discord, Slack, Telegram, or any HTTP endpoint</span>
          </div>

          <div className="wa-form-field">
            <label>Events to Trigger</label>
            <div className="wa-events-grid">
              {EVENT_OPTIONS.map(event => (
                <button
                  key={event.value}
                  className={`wa-event-btn ${selectedEvents.includes(event.value) ? 'active' : ''}`}
                  onClick={() => toggleEvent(event.value)}
                  title={event.description}
                >
                  {event.label}
                </button>
              ))}
            </div>
          </div>

          <div className="wa-form-actions">
            <button className="wa-cancel-btn" onClick={resetForm}>Cancel</button>
            <button className="wa-save-btn" onClick={handleSave}>
              {editingId ? '💾 Update' : '💾 Save'}
            </button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="wa-webhooks-list">
        {webhooks.length === 0 && !showForm && (
          <div className="wa-empty">
            <p>No webhooks configured.</p>
            <p className="wa-empty-hint">Add a webhook to receive alerts via Discord, Slack, or any HTTP endpoint.</p>
          </div>
        )}

        {webhooks.map(webhook => (
          <div key={webhook.id} className={`wa-webhook ${webhook.enabled ? 'enabled' : 'disabled'}`}>
            <div className="wa-webhook-header">
              <span className="wa-webhook-name">{webhook.name}</span>
              <label className="wa-toggle">
                <input
                  type="checkbox"
                  checked={webhook.enabled}
                  onChange={() => handleToggle(webhook.id)}
                />
                <span className="wa-toggle-slider"></span>
              </label>
            </div>
            
            <div className="wa-webhook-url">{webhook.url}</div>
            
            <div className="wa-webhook-events">
              {webhook.events.map(e => {
                const event = EVENT_OPTIONS.find(opt => opt.value === e);
                return event ? (
                  <span key={e} className="wa-event-tag">{event.label}</span>
                ) : null;
              })}
            </div>

            <div className="wa-webhook-stats">
              <span>Triggers: {webhook.triggerCount}</span>
              {webhook.lastTriggered && (
                <span>Last: {new Date(webhook.lastTriggered).toLocaleString()}</span>
              )}
            </div>

            {testResult?.id === webhook.id && (
              <div className={`wa-test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.message}
              </div>
            )}

            <div className="wa-webhook-actions">
              <button onClick={() => handleTest(webhook)}>🧪 Test</button>
              <button onClick={() => handleEdit(webhook)}>✏️ Edit</button>
              <button onClick={() => handleDelete(webhook.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* API Info */}
      <div className="wa-api-section">
        <details>
          <summary>📚 Webhook Payload Format</summary>
          <div className="wa-code-block">
            <pre>{`{
  "event": "price_above",
  "timestamp": "2026-01-31T02:30:00Z",
  "source": "eToro Terminal",
  "data": {
    "symbol": "AAPL",
    "price": 200.50,
    "threshold": 200.00,
    "portfolio_value": 10000
  }
}`}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}
