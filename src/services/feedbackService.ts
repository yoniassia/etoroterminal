/**
 * Feedback Service
 * Handles feedback collection, storage, and submission
 */

import type { 
  Feedback, 
  FeedbackSubmission, 
  FeedbackAnalysis,
  FeedbackType,
  FeedbackStatus 
} from '../types/feedback.types';
import { APP_VERSION } from '../config/version';

const FEEDBACK_STORAGE_KEY = 'etoro-terminal-feedback';
const FEEDBACK_API_ENDPOINT = '/api/feedback';

type Listener = () => void;

class FeedbackService {
  private feedback: Feedback[] = [];
  private listeners: Set<Listener> = new Set();

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
  // CRUD Operations
  // ---------------------------------------------------------------------------

  getAllFeedback(): Feedback[] {
    return [...this.feedback];
  }

  getFeedbackById(id: string): Feedback | undefined {
    return this.feedback.find(f => f.id === id);
  }

  getPendingFeedback(): Feedback[] {
    return this.feedback.filter(f => f.status === 'pending');
  }

  async submitFeedback(submission: FeedbackSubmission): Promise<Feedback> {
    const now = new Date().toISOString();
    
    const feedback: Feedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: submission.type,
      source: submission.source,
      title: submission.title,
      description: submission.description,
      category: submission.category,
      rating: submission.rating,
      status: 'pending',
      metadata: {
        version: APP_VERSION,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
      createdAt: now,
      updatedAt: now,
      postedToX: false,
    };

    // Store locally
    this.feedback.unshift(feedback);
    this.saveToStorage();
    this.notify();

    // Send to server (non-blocking, silent fail)
    this.sendToServer(feedback).catch(() => {
      // Silent fail - feedback is stored locally
    });

    // Mark postToX flag if requested (agent will handle actual posting)
    if (submission.postToX) {
      feedback.postedToX = true;
    }

    return feedback;
  }

  updateFeedbackStatus(id: string, status: FeedbackStatus): void {
    const index = this.feedback.findIndex(f => f.id === id);
    if (index !== -1) {
      this.feedback[index] = {
        ...this.feedback[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      this.saveToStorage();
      this.notify();
    }
  }

  deleteFeedback(id: string): void {
    this.feedback = this.feedback.filter(f => f.id !== id);
    this.saveToStorage();
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Server Communication
  // ---------------------------------------------------------------------------

  private async sendToServer(feedback: Feedback): Promise<void> {
    try {
      const response = await fetch(FEEDBACK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (response.ok) {
        console.log('[FeedbackService] Feedback sent to server:', feedback.id);
      }
    } catch {
      // Silent fail - feedback is stored locally regardless
    }
  }

  formatForX(feedback: Feedback): string {
    const typeEmoji: Record<FeedbackType, string> = {
      bug: '🐛',
      feature: '✨',
      improvement: '📈',
      praise: '🎉',
      other: '💬',
    };

    const emoji = typeEmoji[feedback.type] || '💬';
    const rating = feedback.rating ? '⭐'.repeat(feedback.rating) : '';
    const category = feedback.category ? `[${feedback.category}]` : '';
    
    let tweet = `${emoji} eToro Terminal Feedback ${category}\n\n`;
    tweet += `"${feedback.title}"\n\n`;
    
    if (feedback.description.length <= 150) {
      tweet += feedback.description;
    } else {
      tweet += feedback.description.substring(0, 147) + '...';
    }
    
    if (rating) {
      tweet += `\n\n${rating}`;
    }
    
    tweet += `\n\n#eToroTerminal #TradingTools #Quant`;
    
    return tweet;
  }

  // ---------------------------------------------------------------------------
  // Analysis
  // ---------------------------------------------------------------------------

  analyze(): FeedbackAnalysis {
    const byType: Record<FeedbackType, number> = {
      bug: 0,
      feature: 0,
      improvement: 0,
      praise: 0,
      other: 0,
    };

    const byStatus: Record<FeedbackStatus, number> = {
      pending: 0,
      reviewed: 0,
      implemented: 0,
      rejected: 0,
    };

    const categoryCount: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;

    this.feedback.forEach(f => {
      byType[f.type]++;
      byStatus[f.status]++;
      
      if (f.category) {
        categoryCount[f.category] = (categoryCount[f.category] || 0) + 1;
      }
      
      if (f.rating) {
        totalRating += f.rating;
        ratingCount++;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate trends and action items
    const recentTrends: string[] = [];
    const actionItems: string[] = [];

    if (byType.bug > 2) {
      recentTrends.push(`${byType.bug} bug reports - needs attention`);
      actionItems.push('Review and prioritize bug fixes');
    }

    if (byType.feature > 3) {
      recentTrends.push(`${byType.feature} feature requests - users want more`);
      actionItems.push('Evaluate top feature requests for roadmap');
    }

    if (ratingCount > 0) {
      const avgRating = totalRating / ratingCount;
      if (avgRating >= 4) {
        recentTrends.push(`High satisfaction (${avgRating.toFixed(1)}★)`);
      } else if (avgRating < 3) {
        recentTrends.push(`Low satisfaction (${avgRating.toFixed(1)}★) - needs improvement`);
        actionItems.push('Investigate causes of low ratings');
      }
    }

    if (byStatus.pending > 5) {
      actionItems.push(`Review ${byStatus.pending} pending feedback items`);
    }

    return {
      totalFeedback: this.feedback.length,
      byType,
      byStatus,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      topCategories,
      recentTrends,
      actionItems,
    };
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (stored) {
        this.feedback = JSON.parse(stored);
      }
    } catch (err) {
      console.error('[FeedbackService] Failed to load from storage:', err);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.feedback));
    } catch (err) {
      console.error('[FeedbackService] Failed to save to storage:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Export for Agent Analysis
  // ---------------------------------------------------------------------------

  exportForAnalysis(): string {
    const analysis = this.analyze();
    const pending = this.getPendingFeedback();
    
    let report = `# eToro Terminal Feedback Report\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += `## Summary\n`;
    report += `- Total Feedback: ${analysis.totalFeedback}\n`;
    report += `- Average Rating: ${analysis.averageRating.toFixed(1)}/5\n`;
    report += `- Pending Review: ${analysis.byStatus.pending}\n\n`;
    
    report += `## By Type\n`;
    Object.entries(analysis.byType).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`;
    });
    
    report += `\n## Top Categories\n`;
    analysis.topCategories.forEach(({ category, count }) => {
      report += `- ${category}: ${count}\n`;
    });
    
    report += `\n## Trends\n`;
    analysis.recentTrends.forEach(trend => {
      report += `- ${trend}\n`;
    });
    
    report += `\n## Action Items\n`;
    analysis.actionItems.forEach(item => {
      report += `- [ ] ${item}\n`;
    });
    
    report += `\n## Pending Feedback\n`;
    pending.slice(0, 10).forEach(f => {
      report += `\n### ${f.title}\n`;
      report += `- Type: ${f.type}\n`;
      report += `- Source: ${f.source}\n`;
      report += `- Category: ${f.category || 'N/A'}\n`;
      report += `- Rating: ${f.rating ? '⭐'.repeat(f.rating) : 'N/A'}\n`;
      report += `- Description: ${f.description}\n`;
    });
    
    return report;
  }
}

export const feedbackService = new FeedbackService();
