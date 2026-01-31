/**
 * Strategy Store - State management for Strategy Builder
 * Uses Zustand pattern (simple store without library dependency)
 */

import type {
  StrategyDefinition,
  ProposedAction,
  AIMessage,
  StrategyStatus,
  ActionStatus,
  RiskParameters,
} from '../types/strategy.types';

// =============================================================================
// Store State
// =============================================================================

interface StrategyStoreState {
  strategies: StrategyDefinition[];
  activeStrategyId: string | null;
  proposedActions: ProposedAction[];
  conversationHistory: AIMessage[];
  isGenerating: boolean;
  error: string | null;
}

type Listener = () => void;

// =============================================================================
// Strategy Store Implementation
// =============================================================================

class StrategyStore {
  private state: StrategyStoreState = {
    strategies: [],
    activeStrategyId: null,
    proposedActions: [],
    conversationHistory: [],
    isGenerating: false,
    error: null,
  };

  private listeners: Set<Listener> = new Set();
  private STORAGE_KEY = 'etoro-terminal-strategies';

  constructor() {
    this.loadFromStorage();
  }

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  getState(): StrategyStoreState {
    return { ...this.state };
  }

  getStrategies(): StrategyDefinition[] {
    return [...this.state.strategies];
  }

  getActiveStrategy(): StrategyDefinition | null {
    if (!this.state.activeStrategyId) return null;
    return this.state.strategies.find(s => s.id === this.state.activeStrategyId) || null;
  }

  getStrategyById(id: string): StrategyDefinition | undefined {
    return this.state.strategies.find(s => s.id === id);
  }

  getProposedActions(): ProposedAction[] {
    return [...this.state.proposedActions];
  }

  getPendingActions(): ProposedAction[] {
    return this.state.proposedActions.filter(a => a.status === 'pending');
  }

  getConversationHistory(): AIMessage[] {
    return [...this.state.conversationHistory];
  }

  isGenerating(): boolean {
    return this.state.isGenerating;
  }

  getError(): string | null {
    return this.state.error;
  }

  // ---------------------------------------------------------------------------
  // Strategy CRUD
  // ---------------------------------------------------------------------------

  addStrategy(strategy: StrategyDefinition): void {
    this.state.strategies.push(strategy);
    this.saveToStorage();
    this.notify();
  }

  updateStrategy(id: string, updates: Partial<StrategyDefinition>): void {
    const index = this.state.strategies.findIndex(s => s.id === id);
    if (index !== -1) {
      this.state.strategies[index] = {
        ...this.state.strategies[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveToStorage();
      this.notify();
    }
  }

  deleteStrategy(id: string): void {
    this.state.strategies = this.state.strategies.filter(s => s.id !== id);
    if (this.state.activeStrategyId === id) {
      this.state.activeStrategyId = null;
    }
    this.saveToStorage();
    this.notify();
  }

  setActiveStrategy(id: string | null): void {
    this.state.activeStrategyId = id;
    this.notify();
  }

  setStrategyStatus(id: string, status: StrategyStatus): void {
    this.updateStrategy(id, { status });
  }

  // ---------------------------------------------------------------------------
  // Proposed Actions
  // ---------------------------------------------------------------------------

  addProposedAction(action: ProposedAction): void {
    this.state.proposedActions.unshift(action);
    this.notify();
  }

  updateActionStatus(id: string, status: ActionStatus, extra?: Partial<ProposedAction>): void {
    const index = this.state.proposedActions.findIndex(a => a.id === id);
    if (index !== -1) {
      this.state.proposedActions[index] = {
        ...this.state.proposedActions[index],
        status,
        ...extra,
      };
      this.notify();
    }
  }

  approveAction(id: string): ProposedAction | null {
    const action = this.state.proposedActions.find(a => a.id === id);
    if (action && action.status === 'pending') {
      this.updateActionStatus(id, 'approved', { approvedAt: new Date().toISOString() });
      return this.state.proposedActions.find(a => a.id === id) || null;
    }
    return null;
  }

  rejectAction(id: string, reason?: string): void {
    this.updateActionStatus(id, 'rejected', {
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
  }

  markActionExecuted(id: string, orderId: string): void {
    this.updateActionStatus(id, 'executed', {
      executedAt: new Date().toISOString(),
      orderId,
    });
  }

  markActionFailed(id: string, error: string): void {
    this.updateActionStatus(id, 'failed', { error });
  }

  clearProposedActions(): void {
    this.state.proposedActions = [];
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Conversation
  // ---------------------------------------------------------------------------

  addMessage(message: AIMessage): void {
    this.state.conversationHistory.push(message);
    this.notify();
  }

  clearConversation(): void {
    this.state.conversationHistory = [];
    this.notify();
  }

  setGenerating(isGenerating: boolean): void {
    this.state.isGenerating = isGenerating;
    this.notify();
  }

  setError(error: string | null): void {
    this.state.error = error;
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state.strategies = data.strategies || [];
        // Don't restore active strategy or proposed actions
      }
    } catch (err) {
      console.error('[StrategyStore] Failed to load from storage:', err);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        strategies: this.state.strategies,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[StrategyStore] Failed to save to storage:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  createStrategy(
    name: string,
    type: StrategyDefinition['type'],
    instruments: string[],
    entryConditions: StrategyDefinition['entryConditions'],
    exitConditions: StrategyDefinition['exitConditions'],
    riskParams?: Partial<RiskParameters>
  ): StrategyDefinition {
    const now = new Date().toISOString();
    const strategy: StrategyDefinition = {
      id: `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: '',
      type,
      timeframe: '1d',
      instruments,
      entryConditions,
      exitConditions,
      riskParams: {
        maxPositionSize: 10,
        stopLossPercent: 2,
        takeProfitPercent: 6,
        maxDrawdownPercent: 5,
        maxDailyLoss: 500,
        maxConcurrentPositions: 5,
        maxLeverage: 5,
        cooldownSeconds: 300,
        ...riskParams,
      },
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    return strategy;
  }
}

// Export singleton instance
export const strategyStore = new StrategyStore();
