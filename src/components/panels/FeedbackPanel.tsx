/**
 * Feedback Panel
 * Collect user feedback about the eToro Terminal
 */

import { useState, useEffect, useCallback } from 'react';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import type { 
  Feedback, 
  FeedbackType, 
  FeedbackSubmission,
  FeedbackAnalysis 
} from '../../types/feedback.types';
import { feedbackService } from '../../services/feedbackService';
import './FeedbackPanel.css';

export interface FeedbackPanelProps extends PanelContentProps {}

const CATEGORIES = [
  'Quote Panel',
  'Strategy Builder',
  'Trade Ticket',
  'Portfolio',
  'Watchlists',
  'Charts',
  'Blotter',
  'Alerts',
  'Command Bar',
  'General UX',
  'Performance',
  'Other',
];

const FEEDBACK_TYPES: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: 'bug', label: 'Bug Report', emoji: '🐛' },
  { value: 'feature', label: 'Feature Request', emoji: '✨' },
  { value: 'improvement', label: 'Improvement', emoji: '📈' },
  { value: 'praise', label: 'Praise', emoji: '🎉' },
  { value: 'other', label: 'Other', emoji: '💬' },
];

type ViewMode = 'submit' | 'history' | 'analysis';

export default function FeedbackPanel({}: FeedbackPanelProps = { panelId: '' }) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('submit');
  
  // Form state
  const [type, setType] = useState<FeedbackType>('improvement');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [postToX, setPostToX] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([]);
  const [analysis, setAnalysis] = useState<FeedbackAnalysis | null>(null);

  // Load feedback data
  useEffect(() => {
    setFeedbackHistory(feedbackService.getAllFeedback());
    setAnalysis(feedbackService.analyze());
    
    const unsubscribe = feedbackService.subscribe(() => {
      setFeedbackHistory(feedbackService.getAllFeedback());
      setAnalysis(feedbackService.analyze());
    });
    
    return unsubscribe;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const submission: FeedbackSubmission = {
        type,
        source: 'user',
        title: title.trim(),
        description: description.trim(),
        category: category || undefined,
        rating: rating || undefined,
        postToX,
      };
      
      await feedbackService.submitFeedback(submission);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setRating(0);
      setPostToX(false);
      setSubmitSuccess(true);
      
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [type, title, description, category, rating, postToX]);

  // Render star rating
  const renderStars = () => (
    <div className="fb-stars">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          className={`fb-star ${rating >= star ? 'active' : ''}`}
          onClick={() => setRating(rating === star ? 0 : star)}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );

  // Render submit form
  const renderSubmitForm = () => (
    <div className="fb-form">
      <div className="fb-form-group">
        <label className="fb-label">Feedback Type</label>
        <div className="fb-type-selector">
          {FEEDBACK_TYPES.map(ft => (
            <button
              key={ft.value}
              className={`fb-type-btn ${type === ft.value ? 'active' : ''}`}
              onClick={() => setType(ft.value)}
              type="button"
            >
              <span className="fb-type-emoji">{ft.emoji}</span>
              <span className="fb-type-label">{ft.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="fb-form-group">
        <label className="fb-label" htmlFor="fb-title">Title *</label>
        <input
          id="fb-title"
          type="text"
          className="fb-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Brief summary of your feedback"
          maxLength={100}
        />
      </div>
      
      <div className="fb-form-group">
        <label className="fb-label" htmlFor="fb-category">Category</label>
        <select
          id="fb-category"
          className="fb-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Select a category...</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div className="fb-form-group">
        <label className="fb-label" htmlFor="fb-description">Description *</label>
        <textarea
          id="fb-description"
          className="fb-textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Provide details about your feedback..."
          rows={4}
          maxLength={1000}
        />
        <span className="fb-char-count">{description.length}/1000</span>
      </div>
      
      <div className="fb-form-group">
        <label className="fb-label">Rating (optional)</label>
        {renderStars()}
      </div>
      
      <div className="fb-form-group fb-checkbox-group">
        <label className="fb-checkbox-label">
          <input
            type="checkbox"
            checked={postToX}
            onChange={e => setPostToX(e.target.checked)}
          />
          <span>Post to X/Twitter (public feedback)</span>
        </label>
      </div>
      
      {error && (
        <div className="fb-error">✗ {error}</div>
      )}
      
      {submitSuccess && (
        <div className="fb-success">✓ Feedback submitted successfully!</div>
      )}
      
      <button
        className="fb-submit-btn"
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim() || !description.trim()}
      >
        {isSubmitting ? 'Submitting...' : '[ SUBMIT FEEDBACK ]'}
      </button>
    </div>
  );

  // Render feedback history
  const renderHistory = () => (
    <div className="fb-history">
      {feedbackHistory.length === 0 ? (
        <div className="fb-empty">No feedback submitted yet.</div>
      ) : (
        feedbackHistory.map(fb => (
          <div key={fb.id} className={`fb-item fb-item--${fb.status}`}>
            <div className="fb-item-header">
              <span className="fb-item-type">
                {FEEDBACK_TYPES.find(t => t.value === fb.type)?.emoji}
              </span>
              <span className="fb-item-title">{fb.title}</span>
              <span className={`fb-item-status status--${fb.status}`}>
                {fb.status.toUpperCase()}
              </span>
            </div>
            <div className="fb-item-meta">
              {fb.category && <span className="fb-item-category">[{fb.category}]</span>}
              <span className="fb-item-date">
                {new Date(fb.createdAt).toLocaleDateString()}
              </span>
              {fb.rating && <span className="fb-item-rating">{'★'.repeat(fb.rating)}</span>}
              {fb.postedToX && <span className="fb-item-x">🐦</span>}
            </div>
            <div className="fb-item-desc">{fb.description}</div>
          </div>
        ))
      )}
    </div>
  );

  // Render analysis view
  const renderAnalysis = () => {
    if (!analysis) return <div className="fb-empty">Loading analysis...</div>;
    
    return (
      <div className="fb-analysis">
        <div className="fb-analysis-section">
          <h3 className="fb-analysis-title">Summary</h3>
          <div className="fb-analysis-stats">
            <div className="fb-stat">
              <span className="fb-stat-value">{analysis.totalFeedback}</span>
              <span className="fb-stat-label">Total</span>
            </div>
            <div className="fb-stat">
              <span className="fb-stat-value">{analysis.averageRating.toFixed(1)}★</span>
              <span className="fb-stat-label">Avg Rating</span>
            </div>
            <div className="fb-stat">
              <span className="fb-stat-value">{analysis.byStatus.pending}</span>
              <span className="fb-stat-label">Pending</span>
            </div>
          </div>
        </div>
        
        <div className="fb-analysis-section">
          <h3 className="fb-analysis-title">By Type</h3>
          <div className="fb-analysis-bars">
            {Object.entries(analysis.byType).map(([type, count]) => (
              <div key={type} className="fb-bar-row">
                <span className="fb-bar-label">
                  {FEEDBACK_TYPES.find(t => t.value === type)?.emoji} {type}
                </span>
                <div className="fb-bar-track">
                  <div 
                    className="fb-bar-fill" 
                    style={{ width: `${(count / Math.max(analysis.totalFeedback, 1)) * 100}%` }}
                  />
                </div>
                <span className="fb-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {analysis.recentTrends.length > 0 && (
          <div className="fb-analysis-section">
            <h3 className="fb-analysis-title">Trends</h3>
            <ul className="fb-analysis-list">
              {analysis.recentTrends.map((trend, i) => (
                <li key={i}>{trend}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.actionItems.length > 0 && (
          <div className="fb-analysis-section">
            <h3 className="fb-analysis-title">Action Items</h3>
            <ul className="fb-analysis-list fb-action-items">
              {analysis.actionItems.map((item, i) => (
                <li key={i}>☐ {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fb-panel">
      <div className="fb-header">
        <h2 className="fb-title">&gt; FEEDBACK</h2>
        <div className="fb-tabs">
          <button
            className={`fb-tab ${viewMode === 'submit' ? 'active' : ''}`}
            onClick={() => setViewMode('submit')}
          >
            Submit
          </button>
          <button
            className={`fb-tab ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
          >
            History ({feedbackHistory.length})
          </button>
          <button
            className={`fb-tab ${viewMode === 'analysis' ? 'active' : ''}`}
            onClick={() => setViewMode('analysis')}
          >
            Analysis
          </button>
        </div>
      </div>
      
      <div className="fb-content">
        {viewMode === 'submit' && renderSubmitForm()}
        {viewMode === 'history' && renderHistory()}
        {viewMode === 'analysis' && renderAnalysis()}
      </div>
    </div>
  );
}

export { FeedbackPanel };
