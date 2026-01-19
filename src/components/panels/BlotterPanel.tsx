import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderStatus } from '../../api/contracts/etoro-api.types';
import { ordersStore, StoredOrder } from '../../stores/ordersStore';
import './BlotterPanel.css';

export interface BlotterPanelProps {
  onOrderSelect?: (order: StoredOrder) => void;
  selectedOrderId?: string;
}

type StatusFilter = 'all' | OrderStatus;

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

function formatRate(rate?: number): string {
  if (rate === undefined) return '--';
  if (rate >= 1000) return rate.toFixed(2);
  if (rate >= 1) return rate.toFixed(4);
  return rate.toFixed(6);
}

function getStatusClass(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'status--pending';
    case 'executed':
      return 'status--filled';
    case 'cancelled':
      return 'status--cancelled';
    case 'rejected':
      return 'status--rejected';
    default:
      return '';
  }
}

function getStatusLabel(status: OrderStatus, isUnknown?: boolean): string {
  if (isUnknown) {
    return 'UNKNOWN';
  }
  switch (status) {
    case 'pending':
      return 'PENDING';
    case 'executed':
      return 'FILLED';
    case 'cancelled':
      return 'CANCELLED';
    case 'rejected':
      return 'REJECTED';
    default:
      return status.toUpperCase();
  }
}

function getRowClassName(order: StoredOrder, isSelected: boolean): string {
  const classes = ['blotter-panel__row'];
  
  if (isSelected) {
    classes.push('blotter-panel__row--selected');
  }
  
  const isUnknown = (order as StoredOrder & { isUnknown?: boolean }).isUnknown;
  
  if (order.isOptimistic) {
    if (isUnknown) {
      classes.push('blotter-panel__row--unknown');
    } else {
      classes.push('blotter-panel__row--optimistic');
    }
  }
  
  return classes.join(' ');
}

export default function BlotterPanel({ onOrderSelect, selectedOrderId }: BlotterPanelProps) {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [drawerOrder, setDrawerOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    setOrders(ordersStore.getAllOrders());

    const unsubscribe = ordersStore.subscribeToChanges((updatedOrders) => {
      setOrders(updatedOrders);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (drawerOrder) {
      const unsubscribe = ordersStore.subscribeToOrder(drawerOrder.orderId, (updatedOrder) => {
        setDrawerOrder(updatedOrder);
      });
      return unsubscribe;
    }
  }, [drawerOrder?.orderId]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const handleRowClick = useCallback(
    (order: StoredOrder) => {
      setDrawerOrder(order);
      onOrderSelect?.(order);
    },
    [onOrderSelect]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOrder(null);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as StatusFilter);
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, executed: 0, cancelled: 0, rejected: 0 };
    orders.forEach((order) => {
      if (order.status in counts) {
        counts[order.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [orders]);

  return (
    <div className="blotter-panel" role="region" aria-label="Order blotter">
      <div className="blotter-panel__header">
        <h2 className="blotter-panel__title" id="blotter-title">&gt; ORDER BLOTTER</h2>
        <div className="blotter-panel__controls">
          <select
            className="blotter-panel__filter"
            value={statusFilter}
            onChange={handleFilterChange}
            aria-label="Filter orders by status"
          >
            <option value="all">All ({orders.length})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="executed">Filled ({statusCounts.executed})</option>
            <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
          </select>
        </div>
      </div>

      <div className="blotter-panel__table-header" role="row" aria-hidden="true">
        <span>Time</span>
        <span>Symbol</span>
        <span>Side</span>
        <span>Amount</span>
        <span>Status</span>
      </div>

      <div className="blotter-panel__viewport" role="table" aria-label="Orders table" aria-describedby="blotter-title">
        {filteredOrders.length === 0 ? (
          <div className="blotter-panel__empty" role="status">
            <div>No orders to display</div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = order.orderId === selectedOrderId || order.orderId === drawerOrder?.orderId;
            const isUnknown = (order as StoredOrder & { isUnknown?: boolean }).isUnknown;

            return (
              <div
                key={order.orderId}
                className={getRowClassName(order, isSelected)}
                onClick={() => handleRowClick(order)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(order);
                  }
                }}
                aria-label={`Order ${order.symbol}, ${order.side}, ${formatAmount(order.amount)}, ${getStatusLabel(order.status, isUnknown)}`}
              >
                <span className="blotter-panel__cell blotter-panel__cell--time" role="cell">
                  {formatTime(order.createdAt)}
                </span>
                <span className="blotter-panel__cell blotter-panel__cell--symbol" role="cell">
                  {order.isOptimistic && (
                    <span className={isUnknown ? 'blotter-panel__unknown-indicator' : 'blotter-panel__optimistic-indicator'} aria-hidden="true" />
                  )}
                  {order.symbol}
                </span>
                <span className={`blotter-panel__cell blotter-panel__cell--side side--${order.side}`} role="cell">
                  {order.side.toUpperCase()}
                </span>
                <span className="blotter-panel__cell blotter-panel__cell--amount" role="cell">
                  {formatAmount(order.amount)}
                </span>
                <span className={`blotter-panel__cell blotter-panel__cell--status ${isUnknown ? 'status--unknown' : getStatusClass(order.status)}`} role="cell">
                  {getStatusLabel(order.status, isUnknown)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {drawerOrder && (
        <div 
          className="blotter-panel__drawer" 
          role="complementary" 
          aria-label="Order details"
        >
          <div className="blotter-panel__drawer-header">
            <span className="blotter-panel__drawer-title" id="drawer-title">Order Details</span>
            <button 
              className="blotter-panel__drawer-close" 
              onClick={handleCloseDrawer}
              aria-label="Close order details"
            >
              ×
            </button>
          </div>
          <div className="blotter-panel__drawer-content">
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Order ID</span>
              <span className="blotter-panel__drawer-value">{drawerOrder.orderId}</span>
            </div>
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Symbol</span>
              <span className="blotter-panel__drawer-value">{drawerOrder.symbol}</span>
            </div>
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Name</span>
              <span className="blotter-panel__drawer-value">{drawerOrder.displayName}</span>
            </div>
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Side</span>
              <span className={`blotter-panel__drawer-value side--${drawerOrder.side}`}>
                {drawerOrder.side.toUpperCase()}
              </span>
            </div>
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Order Type</span>
              <span className="blotter-panel__drawer-value">{drawerOrder.orderType.toUpperCase()}</span>
            </div>
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Amount</span>
              <span className="blotter-panel__drawer-value">{formatAmount(drawerOrder.amount)}</span>
            </div>
            {drawerOrder.leverage && (
              <div className="blotter-panel__drawer-row">
                <span className="blotter-panel__drawer-label">Leverage</span>
                <span className="blotter-panel__drawer-value">x{drawerOrder.leverage}</span>
              </div>
            )}
            {drawerOrder.limitRate && (
              <div className="blotter-panel__drawer-row">
                <span className="blotter-panel__drawer-label">Limit Rate</span>
                <span className="blotter-panel__drawer-value">{formatRate(drawerOrder.limitRate)}</span>
              </div>
            )}
            {drawerOrder.stopLossRate && (
              <div className="blotter-panel__drawer-row">
                <span className="blotter-panel__drawer-label">Stop Loss</span>
                <span className="blotter-panel__drawer-value">{formatRate(drawerOrder.stopLossRate)}</span>
              </div>
            )}
            {drawerOrder.takeProfitRate && (
              <div className="blotter-panel__drawer-row">
                <span className="blotter-panel__drawer-label">Take Profit</span>
                <span className="blotter-panel__drawer-value">{formatRate(drawerOrder.takeProfitRate)}</span>
              </div>
            )}
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Status</span>
              <span className={`blotter-panel__drawer-value ${getStatusClass(drawerOrder.status)}`}>
                {getStatusLabel(drawerOrder.status)}
              </span>
            </div>
            {drawerOrder.executedRate && (
              <div className="blotter-panel__drawer-row">
                <span className="blotter-panel__drawer-label">Executed Rate</span>
                <span className="blotter-panel__drawer-value">{formatRate(drawerOrder.executedRate)}</span>
              </div>
            )}
            {drawerOrder.executedAt && (
              <div className="blotter-panel__drawer-row">
                <span className="blotter-panel__drawer-label">Executed At</span>
                <span className="blotter-panel__drawer-value">{formatTime(drawerOrder.executedAt)}</span>
              </div>
            )}
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Created</span>
              <span className="blotter-panel__drawer-value">{formatTime(drawerOrder.createdAt)}</span>
            </div>
            <div className="blotter-panel__drawer-row">
              <span className="blotter-panel__drawer-label">Updated</span>
              <span className="blotter-panel__drawer-value">{formatTime(drawerOrder.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { BlotterPanel };
