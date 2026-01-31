/**
 * Strategy Builder Panel
 * AI-powered quantitative trading strategy creation and management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import type { 
  StrategyDefinition, 
  StrategyTemplate, 
  ProposedAction,
  AIMessage,
  StrategyView 
} from '../../types/strategy.types';
import { STRATEGY_TEMPLATES } from '../../config/strategyTemplates';
import { strategyStore } from '../../stores/strategyStore';
import { aiService } from '../../services/aiService';
import './StrategyBuilderPanel.css';

export interface StrategyBuilderPanelProps extends PanelContentProps {}

export default function StrategyBuilderPanel({}: StrategyBuilderPanelProps = { panelId: '' }) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [view, setView] = useState<StrategyView>('templates');
  const [strategies, setStrategies] = useState<StrategyDefinition[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDefinition | null>(null);
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasApiKey = aiService.hasApiKey();

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    // Load strategies from store
    setStrategies(strategyStore.getStrategies());
    setProposedActions(strategyStore.getProposedActions());
    
    const unsubscribe = strategyStore.subscribe(() => {
      setStrategies(strategyStore.getStrategies());
      setProposedActions(strategyStore.getProposedActions());
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingContent]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleTemplateSelect = useCallback((template: StrategyTemplate) => {
    setSelectedTemplate(template);
    setSelectedStrategy(null);
  }, []);

  const handleStrategySelect = useCallback((strategy: StrategyDefinition) => {
    setSelectedStrategy(strategy);
    setSelectedTemplate(null);
  }, []);

  const handleCreateFromTemplate = useCallback(() => {
    if (!selectedTemplate) return;
    
    const now = new Date().toISOString();
    const strategy: StrategyDefinition = {
      id: `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      type: selectedTemplate.type,
      timeframe: selectedTemplate.defaultTimeframe,
      instruments: [...selectedTemplate.defaultInstruments],
      entryConditions: selectedTemplate.entryConditions.map((c, i) => ({
        ...c,
        id: `entry_${i}`,
      })),
      exitConditions: selectedTemplate.exitConditions.map((c, i) => ({
        ...c,
        id: `exit_${i}`,
      })),
      riskParams: {
        maxPositionSize: 10,
        stopLossPercent: 2,
        takeProfitPercent: 6,
        maxDrawdownPercent: 5,
        maxDailyLoss: 500,
        maxConcurrentPositions: 5,
        maxLeverage: 5,
        cooldownSeconds: 300,
        ...selectedTemplate.riskParams,
      },
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    
    strategyStore.addStrategy(strategy);
    setSelectedStrategy(strategy);
    setSelectedTemplate(null);
    setView('my-strategies');
  }, [selectedTemplate]);

  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const userMessage: AIMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsGenerating(true);
    setError(null);
    setStreamingContent('');
    
    try {
      // Use streaming for real-time feedback
      let fullContent = '';
      
      for await (const chunk of aiService.streamChat([...chatMessages, userMessage])) {
        fullContent += chunk.content;
        setStreamingContent(fullContent);
        
        if (chunk.done) {
          break;
        }
      }
      
      // Add assistant message
      const assistantMessage: AIMessage = { role: 'assistant', content: fullContent };
      setChatMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      
      // Try to extract strategy from response
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const strategy = await aiService.generateStrategy(chatInput);
          if (strategy) {
            strategyStore.addStrategy(strategy);
            setSelectedStrategy(strategy);
          }
        } catch {
          // Strategy extraction failed, but that's okay
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI request failed';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [chatInput, chatMessages, isGenerating]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  }, [handleChatSubmit]);

  const handleActivateStrategy = useCallback((strategy: StrategyDefinition) => {
    strategyStore.setStrategyStatus(strategy.id, 'active');
  }, []);

  const handlePauseStrategy = useCallback((strategy: StrategyDefinition) => {
    strategyStore.setStrategyStatus(strategy.id, 'paused');
  }, []);

  const handleDeleteStrategy = useCallback((strategy: StrategyDefinition) => {
    if (confirm(`Delete strategy "${strategy.name}"?`)) {
      strategyStore.deleteStrategy(strategy.id);
      setSelectedStrategy(null);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const renderTemplateList = () => (
    <div className="sb-template-list">
      {STRATEGY_TEMPLATES.map(template => (
        <div
          key={template.id}
          className={`sb-template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
          onClick={() => handleTemplateSelect(template)}
        >
          <span className="sb-template-icon">{template.icon}</span>
          <div className="sb-template-info">
            <div className="sb-template-name">{template.name}</div>
            <div className="sb-template-desc">{template.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStrategyList = () => (
    <div className="sb-strategy-list">
      {strategies.length === 0 ? (
        <div className="sb-empty">No strategies yet. Create one from a template or use AI chat.</div>
      ) : (
        strategies.map(strategy => (
          <div
            key={strategy.id}
            className={`sb-strategy-item ${selectedStrategy?.id === strategy.id ? 'selected' : ''}`}
            onClick={() => handleStrategySelect(strategy)}
          >
            <div className="sb-strategy-header">
              <span className="sb-strategy-name">{strategy.name}</span>
              <span className={`sb-strategy-status status--${strategy.status}`}>
                {strategy.status.toUpperCase()}
              </span>
            </div>
            <div className="sb-strategy-meta">
              {strategy.type} · {strategy.instruments.join(', ')}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderChat = () => (
    <div className="sb-chat">
      {!hasApiKey && (
        <div className="sb-chat-warning">
          ⚠ OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env.local
        </div>
      )}
      
      <div className="sb-chat-messages">
        {chatMessages.length === 0 && !streamingContent && (
          <div className="sb-chat-placeholder">
            <div className="sb-chat-placeholder-title">AI Strategy Assistant</div>
            <div className="sb-chat-placeholder-text">
              Describe a trading strategy and I'll help you create it.
            </div>
            <div className="sb-chat-examples">
              <div className="sb-chat-example" onClick={() => setChatInput('Create a momentum strategy for AAPL that buys when RSI is oversold')}>
                "Create a momentum strategy for AAPL..."
              </div>
              <div className="sb-chat-example" onClick={() => setChatInput('Build a mean reversion strategy using Bollinger Bands for SPY')}>
                "Build a mean reversion strategy..."
              </div>
              <div className="sb-chat-example" onClick={() => setChatInput('Design a breakout strategy for TSLA with volume confirmation')}>
                "Design a breakout strategy..."
              </div>
            </div>
          </div>
        )}
        
        {chatMessages.map((msg, i) => (
          <div key={i} className={`sb-chat-message sb-chat-message--${msg.role}`}>
            <div className="sb-chat-message-role">
              {msg.role === 'user' ? 'You' : 'AI'}
            </div>
            <div className="sb-chat-message-content">
              {msg.content}
            </div>
          </div>
        ))}
        
        {streamingContent && (
          <div className="sb-chat-message sb-chat-message--assistant">
            <div className="sb-chat-message-role">AI</div>
            <div className="sb-chat-message-content">
              {streamingContent}
              <span className="sb-chat-cursor">▊</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      {error && (
        <div className="sb-chat-error">✗ {error}</div>
      )}
      
      <div className="sb-chat-input-container">
        <textarea
          className="sb-chat-input"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasApiKey ? "Describe your strategy..." : "API key required"}
          disabled={!hasApiKey || isGenerating}
          rows={2}
        />
        <button
          className="sb-chat-send"
          onClick={handleChatSubmit}
          disabled={!hasApiKey || isGenerating || !chatInput.trim()}
        >
          {isGenerating ? '...' : '→'}
        </button>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (selectedTemplate) {
      return (
        <div className="sb-details">
          <div className="sb-details-header">
            <span className="sb-details-icon">{selectedTemplate.icon}</span>
            <span className="sb-details-name">{selectedTemplate.name}</span>
          </div>
          <div className="sb-details-type">Type: {selectedTemplate.type}</div>
          <div className="sb-details-desc">{selectedTemplate.description}</div>
          
          <div className="sb-details-section">
            <div className="sb-details-section-title">Entry Conditions</div>
            {selectedTemplate.entryConditions.map((c, i) => (
              <div key={i} className="sb-condition">
                {c.indicator}({c.params?.period || ''}) {c.operator} {String(c.value)}
                {c.valueParams?.period && `(${c.valueParams.period})`}
              </div>
            ))}
          </div>
          
          <div className="sb-details-section">
            <div className="sb-details-section-title">Exit Conditions</div>
            {selectedTemplate.exitConditions.map((c, i) => (
              <div key={i} className="sb-condition">
                {c.indicator}({c.params?.period || ''}) {c.operator} {String(c.value)}
                {c.valueParams?.period && `(${c.valueParams.period})`}
              </div>
            ))}
          </div>
          
          <div className="sb-details-section">
            <div className="sb-details-section-title">Risk Parameters</div>
            <div className="sb-risk-param">Stop Loss: {selectedTemplate.riskParams.stopLossPercent}%</div>
            <div className="sb-risk-param">Take Profit: {selectedTemplate.riskParams.takeProfitPercent}%</div>
            <div className="sb-risk-param">Max Position: {selectedTemplate.riskParams.maxPositionSize}%</div>
            <div className="sb-risk-param">Max Leverage: {selectedTemplate.riskParams.maxLeverage}x</div>
          </div>
          
          <div className="sb-details-actions">
            <button className="sb-btn sb-btn--primary" onClick={handleCreateFromTemplate}>
              Create Strategy
            </button>
          </div>
        </div>
      );
    }
    
    if (selectedStrategy) {
      return (
        <div className="sb-details">
          <div className="sb-details-header">
            <span className="sb-details-name">{selectedStrategy.name}</span>
            <span className={`sb-strategy-status status--${selectedStrategy.status}`}>
              {selectedStrategy.status.toUpperCase()}
            </span>
          </div>
          <div className="sb-details-type">Type: {selectedStrategy.type} · {selectedStrategy.timeframe}</div>
          <div className="sb-details-instruments">
            Instruments: {selectedStrategy.instruments.join(', ')}
          </div>
          
          <div className="sb-details-section">
            <div className="sb-details-section-title">Entry Conditions</div>
            {selectedStrategy.entryConditions.map((c, i) => (
              <div key={i} className="sb-condition">
                {c.indicator}({c.params?.period || ''}) {c.operator} {String(c.value)}
              </div>
            ))}
          </div>
          
          <div className="sb-details-section">
            <div className="sb-details-section-title">Exit Conditions</div>
            {selectedStrategy.exitConditions.map((c, i) => (
              <div key={i} className="sb-condition">
                {c.indicator}({c.params?.period || ''}) {c.operator} {String(c.value)}
              </div>
            ))}
          </div>
          
          <div className="sb-details-section">
            <div className="sb-details-section-title">Risk Parameters</div>
            <div className="sb-risk-param">Stop Loss: {selectedStrategy.riskParams.stopLossPercent}%</div>
            <div className="sb-risk-param">Take Profit: {selectedStrategy.riskParams.takeProfitPercent || 'N/A'}%</div>
            <div className="sb-risk-param">Max Position: {selectedStrategy.riskParams.maxPositionSize}%</div>
            <div className="sb-risk-param">Max Leverage: {selectedStrategy.riskParams.maxLeverage}x</div>
          </div>
          
          <div className="sb-details-actions">
            {selectedStrategy.status === 'draft' && (
              <button className="sb-btn sb-btn--primary" onClick={() => handleActivateStrategy(selectedStrategy)}>
                Activate
              </button>
            )}
            {selectedStrategy.status === 'active' && (
              <button className="sb-btn sb-btn--warning" onClick={() => handlePauseStrategy(selectedStrategy)}>
                Pause
              </button>
            )}
            {selectedStrategy.status === 'paused' && (
              <button className="sb-btn sb-btn--primary" onClick={() => handleActivateStrategy(selectedStrategy)}>
                Resume
              </button>
            )}
            <button className="sb-btn sb-btn--danger" onClick={() => handleDeleteStrategy(selectedStrategy)}>
              Delete
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="sb-details sb-details--empty">
        Select a template or strategy to view details
      </div>
    );
  };

  const renderProposedActions = () => {
    const pending = proposedActions.filter(a => a.status === 'pending');
    if (pending.length === 0) return null;
    
    return (
      <div className="sb-actions">
        <div className="sb-actions-title">Proposed Actions ({pending.length})</div>
        {pending.map(action => (
          <div key={action.id} className="sb-action">
            <div className="sb-action-header">
              <span className={`sb-action-side side--${action.side}`}>
                {action.side.toUpperCase()}
              </span>
              <span className="sb-action-symbol">{action.symbol}</span>
              <span className="sb-action-amount">${action.amount}</span>
            </div>
            <div className="sb-action-reasoning">{action.reasoning}</div>
            <div className="sb-action-meta">
              Confidence: {action.confidence}% · Risk: {action.riskScore}%
            </div>
            <div className="sb-action-buttons">
              <button 
                className="sb-btn sb-btn--success"
                onClick={() => strategyStore.approveAction(action.id)}
              >
                ✓ Approve
              </button>
              <button 
                className="sb-btn sb-btn--danger"
                onClick={() => strategyStore.rejectAction(action.id)}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="sb-panel">
      <div className="sb-header">
        <h2 className="sb-title">&gt; STRATEGY BUILDER</h2>
        <div className="sb-tabs">
          <button
            className={`sb-tab ${view === 'templates' ? 'active' : ''}`}
            onClick={() => setView('templates')}
          >
            Templates
          </button>
          <button
            className={`sb-tab ${view === 'chat' ? 'active' : ''}`}
            onClick={() => setView('chat')}
          >
            AI Chat
          </button>
          <button
            className={`sb-tab ${view === 'my-strategies' ? 'active' : ''}`}
            onClick={() => setView('my-strategies')}
          >
            My Strategies ({strategies.length})
          </button>
        </div>
      </div>
      
      <div className="sb-body">
        <div className="sb-main">
          {view === 'templates' && renderTemplateList()}
          {view === 'chat' && renderChat()}
          {view === 'my-strategies' && renderStrategyList()}
        </div>
        <div className="sb-sidebar">
          {renderDetails()}
        </div>
      </div>
      
      {renderProposedActions()}
    </div>
  );
}

export { StrategyBuilderPanel };
