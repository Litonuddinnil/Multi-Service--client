import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Check, ChevronDown, Clock, X } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { CommerceOrder, PaymentStatus } from '../../types';
import type { AdminOutletContext } from './AdminOutletContext';

 
export const BookingsTab: React.FC = () => {
  const { orders, loading, handleApproveOrder, handleRejectOrder } =
    useOutletContext<AdminOutletContext>();

  type FilterValue = 'PENDING_ADMIN_REVIEW' | 'PAID' | 'CANCELLED' | 'ALL';

  const [statusFilter, setStatusFilter] = useState<FilterValue>('PENDING_ADMIN_REVIEW');

  const filteredOrders = useMemo<CommerceOrder[]>(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.paymentStatus === statusFilter);
  }, [orders, statusFilter]);

  const totals = useMemo(() => {
    const pending = orders.filter((o) => o.paymentStatus === 'PENDING_ADMIN_REVIEW').length;
    const paid = orders.filter((o) => o.paymentStatus === 'PAID').length;
    const cancelled = orders.filter(
      (o) => o.paymentStatus === 'CANCELLED' || o.paymentStatus === 'REFUNDED',
    ).length;
    return { pending, paid, cancelled };
  }, [orders]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  return (
    <div className="space-y-6">
      {totals.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              {totals.pending} Order{totals.pending > 1 ? 's' : ''} Awaiting Manual Review
            </p>
            <p className="text-xs text-amber-700">
              These orders have been paid but you have not yet approved release of escrow to the
              expert. Approve to mark them cleared, or reject to trigger an automatic refund.
            </p>
          </div>
        </div>
      )}

      {/* Status filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Filter Status:
        </span>
        {(['PENDING_ADMIN_REVIEW', 'PAID', 'CANCELLED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all ${
              statusFilter === s
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-[#7C3AED]'
            }`}
          >
            {s === 'ALL' ? 'All Orders' : s.replace(/_/g, ' ')}
            {s === 'PENDING_ADMIN_REVIEW' && totals.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                {totals.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <EmptyState
            title="No Orders For This Filter"
            description="Try selecting a different status or refresh to pull latest gateway records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-gray-500 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Order / Customer</th>
                  <th className="p-4">Item Breakdown</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Gateway Ref</th>
                  <th className="p-4">Placed On</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const placedDate = new Date(order.createdAt);
                  const localDate = placedDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-[#5B21B6] block">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-gray-700 font-medium">{order.customerName}</span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900">{order.entityTitle || 'N/A'}</p>
                          <p className="text-[10px] text-gray-500 uppercase">
                            {order.entityType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Vendor: <span className="font-bold">{order.expertName}</span>
                          </p>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-gray-900 text-sm">
                          ৳{order.totalAmountBDT.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-gray-500">
                          Net to expert: ৳{order.providerNetAmountBDT.toLocaleString()}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-mono text-[10px] text-gray-700 break-all">
                          {order.paymentReference}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {order.paymentGateway}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-xs text-gray-700 font-medium">{localDate}</p>
                      </td>

                      <td className="p-4">
                        <OrderStatusPill status={order.paymentStatus} />
                      </td>

                      <td className="p-4 text-right">
                        {order.paymentStatus === 'PENDING_ADMIN_REVIEW' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium italic">
                            Decision Finalised
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer / helper text */}
      <div className="text-[11px] text-gray-500 flex items-center gap-1 px-2">
        <ChevronDown className="w-3.5 h-3.5" />
        <span>
          Approval queues are sourced from <code className="font-mono">/api/orders</code>.
          Decisions are immutable once recorded.
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* OrderStatusPill                                                     */
/* ------------------------------------------------------------------ */

const OrderStatusPill: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const colorMap: Partial<Record<PaymentStatus, string>> = {
    PENDING_ADMIN_REVIEW: 'bg-amber-100 text-amber-700',
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
    PAID: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
    PARTIALLY_REFUNDED: 'bg-purple-100 text-purple-700',
    EXPIRED: 'bg-gray-100 text-gray-700',
  };

  const iconMap: Partial<Record<PaymentStatus, React.ReactNode>> = {
    PENDING_ADMIN_REVIEW: <Clock className="w-3 h-3" />,
    PENDING_PAYMENT: <Clock className="w-3 h-3" />,
    PAID: <Check className="w-3 h-3" />,
    CANCELLED: <X className="w-3 h-3" />,
    REFUNDED: <X className="w-3 h-3" />,
    PARTIALLY_REFUNDED: <X className="w-3 h-3" />,
    EXPIRED: <Clock className="w-3 h-3" />,
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
        colorMap[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {iconMap[status] || <Clock className="w-3 h-3" />}
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default BookingsTab;
