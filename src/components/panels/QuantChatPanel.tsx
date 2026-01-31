/**
 * Quant Chat Panel
 * Direct chat with Quant (OpenClaw AI) from the terminal
 * Commands: QUANT, CHAT, AI
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './QuantChatPanel.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function QuantChatPanel(_props: PanelContentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: '🤖 Quant here! Your trading co-pilot. Ask me about strategies, market analysis, or terminal features.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isConnected] = useState(false); // Will be used when gateway is connected
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // For now, use a simple REST approach or localStorage queue
  // Full WebSocket integration would need gateway token
  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Store message for Quant to pick up via heartbeat/polling
    const pendingMessages = JSON.parse(localStorage.getItem('quant_pending_messages') || '[]');
    pendingMessages.push({
      id: userMessage.id,
      content: userMessage.content,
      timestamp: userMessage.timestamp.toISOString(),
    });
    localStorage.setItem('quant_pending_messages', JSON.stringify(pendingMessages));

    // Simulate response for now (will be replaced with real gateway integration)
    setTimeout(() => {
      const responses = [
        "I've noted your message! For real-time responses, we need to connect the OpenClaw gateway. Ask Yoni to set up the integration.",
        "Great question! I'm currently in async mode. Your message has been queued for my next check-in.",
        "Message received! Once the gateway is connected, I'll respond instantly. For now, I'll pick this up on my next heartbeat.",
      ];
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);

  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Quick action buttons
  const quickActions = [
    { label: '📊 Market Analysis', prompt: 'Give me a quick market analysis for today' },
    { label: '🎯 Strategy Ideas', prompt: 'Suggest some trading strategies based on current market conditions' },
    { label: '🐋 Whale Activity', prompt: 'What are the latest insider and institutional moves?' },
    { label: '📈 Top Movers', prompt: 'What stocks should I watch today?' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="quant-chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <span className="bot-avatar">🤖</span>
          <div className="bot-info">
            <span className="bot-name">Quant</span>
            <span className={`bot-status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '● Online' : '○ Async Mode'}
            </span>
          </div>
        </div>
        <div className="header-right">
          <span className="version">v1.4.0</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action.prompt)}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.role === 'assistant' && <span className="msg-avatar">🤖</span>}
              <div className="msg-bubble">
                <p>{msg.content}</p>
                <span className="msg-time">{formatTime(msg.timestamp)}</span>
              </div>
              {msg.role === 'user' && <span className="msg-avatar">👤</span>}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant">
            <div className="message-content">
              <span className="msg-avatar">🤖</span>
              <div className="msg-bubble typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Quant anything..."
          className="chat-input"
        />
        <button 
          onClick={sendMessage} 
          className="send-btn"
          disabled={!input.trim()}
        >
          SEND
        </button>
      </div>

      {/* Footer */}
      <div className="chat-footer">
        <span>💡 Tip: Use INS, INST, FD, FILINGS for data panels</span>
      </div>
    </div>
  );
}
