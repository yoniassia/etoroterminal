import { useState, useEffect, useCallback } from 'react';
import { activityStore, ActivityItem } from '../../stores/activityStore';
import type { PanelContentProps } from '../Workspace/PanelRegistry';
import './ActivityPanel.css';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getActivityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'trade_open':
      return '📈';
    case 'trade_close':
      return '📉';
    case 'order_rejected':
      return '❌';
    case 'error':
      return '⚠️';
    case 'connection':
      return '🔌';
    default:
      return '📋';
  }
}

function getModeClass(mode: ActivityItem['mode']): string {
  return mode === 'demo' ? 'activity--demo' : 'activity--real';
}

function getModeLabel(mode: ActivityItem['mode']): string {
  return mode === 'demo' ? 'DEMO' : 'REAL';
}

export default function ActivityPanel(_props: PanelContentProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'demo' | 'real'>('all');

  useEffect(() => {
    const unsubscribe = activityStore.subscribe(setActivities);
    return unsubscribe;
  }, []);

  const handleClearAll = useCallback(() => {
    activityStore.clearAll();
  }, []);

  const handleMarkAllRead = useCallback(() => {
    activityStore.markAllAsRead();
  }, []);

  const filteredActivities = activities.filter((a) => {
    if (filter === 'all') return true;
    return a.mode === filter;
  });

  const unreadCount = activities.filter((a) => !a.read).length;

  return (
    <div className="activity-panel">
      <div className="activity-panel__header">
        <span className="activity-panel__title">
          &gt; ACTIVITY LOG
          {unreadCount > 0 && (
            <span className="activity-panel__badge">{unreadCount}</span>
          )}
        </span>
        <div className="activity-panel__actions">
          <button
            className="activity-panel__btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            [ ✓ READ ]
          </button>
          <button
            className="activity-panel__btn activity-panel__btn--danger"
            onClick={handleClearAll}
            disabled={activities.length === 0}
          >
            [ CLEAR ]
          </button>
        </div>
      </div>

      <div className="activity-panel__filters">
        <button
          className={`activity-panel__filter ${filter === 'all' ? 'activity-panel__filter--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`activity-panel__filter activity-panel__filter--demo ${filter === 'demo' ? 'activity-panel__filter--active' : ''}`}
          onClick={() => setFilter('demo')}
        >
          Demo
        </button>
        <button
          className={`activity-panel__filter activity-panel__filter--real ${filter === 'real' ? 'activity-panel__filter--active' : ''}`}
          onClick={() => setFilter('real')}
        >
          Real
        </button>
      </div>

      <div className="activity-panel__list">
        {filteredActivities.length === 0 ? (
          <div className="activity-panel__empty">
            <div className="activity-panel__empty-icon">📋</div>
            <div>No activity yet</div>
            <div className="activity-panel__empty-hint">
              Trade executions and events will appear here
            </div>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`activity-panel__item ${getModeClass(activity.mode)} ${!activity.read ? 'activity-panel__item--unread' : ''}`}
              onClick={() => activityStore.markAsRead(activity.id)}
            >
              <div className="activity-panel__item-header">
                <span className="activity-panel__item-icon">
                  {getActivityIcon(activity.type)}
                </span>
                <span className={`activity-panel__item-mode ${getModeClass(activity.mode)}`}>
                  {getModeLabel(activity.mode)}
                </span>
                <span className="activity-panel__item-time">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
              <div className="activity-panel__item-message">
                {activity.message}
              </div>
              {activity.details && (
                <div className="activity-panel__item-details">
                  {activity.details}
                </div>
              )}
              {activity.profit !== undefined && (
                <div className={`activity-panel__item-profit ${activity.profit >= 0 ? 'profit--positive' : 'profit--negative'}`}>
                  {activity.profit >= 0 ? '+' : ''}{activity.profit.toFixed(2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { ActivityPanel };
