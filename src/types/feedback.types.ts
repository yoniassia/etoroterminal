/**
 * Feedback System Types
 */

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'praise' | 'other';
export type FeedbackSource = 'user' | 'agent';
export type FeedbackStatus = 'pending' | 'reviewed' | 'implemented' | 'rejected';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Feedback {
  id: string;
  type: FeedbackType;
  source: FeedbackSource;
  title: string;
  description: string;
  category?: string;        // e.g., 'Strategy Builder', 'Quote Panel'
  rating?: number;          // 1-5 stars
  priority?: FeedbackPriority;
  status: FeedbackStatus;
  metadata?: {
    panelId?: string;
    version?: string;
    userAgent?: string;
    screenSize?: string;
  };
  createdAt: string;
  updatedAt: string;
  postedToX?: boolean;
  xPostId?: string;
}

export interface FeedbackSubmission {
  type: FeedbackType;
  source: FeedbackSource;
  title: string;
  description: string;
  category?: string;
  rating?: number;
  postToX?: boolean;
}

export interface FeedbackAnalysis {
  totalFeedback: number;
  byType: Record<FeedbackType, number>;
  byStatus: Record<FeedbackStatus, number>;
  averageRating: number;
  topCategories: { category: string; count: number }[];
  recentTrends: string[];
  actionItems: string[];
}
