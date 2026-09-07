import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { useLanguage } from '../../hooks/useLanguage';
import { PdfService } from '../../services/pdfService';
import type { CustomerOutletContext } from './CustomerOutletContext';

/**
 * Customer Dashboard → Payment Ledger & Invoices tab.
 *
 * Lists every commerce / escrow order with:
 *  - Order number + payment status pill
 *  - Gateway + reference + timestamp
 *  - Conditional banner for PENDING_ADMIN_REVIEW or CANCELLED+reason
 *  - Total amount + tax invoice PDF download
 */
export const OrdersTab: React.FC = () => {
  const { orders, loading } = useOutletContext<CustomerOutletContext>();
  const { formatDateTime } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No Transactions Found"
        description="Your bKash, Nagad, and Card escrow transactions will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((ord) => (
        <div
          key={ord.id}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">Order #{ord.orderNumber}</span>
              <StatusPill status={ord.paymentStatus} />
            </div>
            <p className="text-xs text-gray-500">
              Gateway: <strong className="text-gray-800">{ord.paymentGateway}</strong> • Ref:{' '}
              {ord.paymentReference}
            </p>
            <p className="text-[11px] text-gray-400">Date: {formatDateTime(ord.createdAt)}</p>
            {ord.paymentStatus === 'PENDING_ADMIN_REVIEW' && (
              <p className="text-[11px] text-amber-700 font-semibold pt-1">
                ⏳ Payment captured in escrow. Your booking will be confirmed once our admin team
                verifies the gateway reference.
              </p>
            )}
            {ord.paymentStatus === 'CANCELLED' && (ord as any).rejectionReason && (
              <p className="text-[11px] text-red-700 font-semibold pt-1">
                Rejected: {(ord as any).rejectionReason}
              </p>
            )}
          </div>

          <div className="text-right flex flex-col items-end gap-1.5">
            <MoneyValue
              amount={ord.totalAmountBDT || ord.grossAmountBDT}
              className="text-lg font-bold text-gray-900"
            />
            <button
              onClick={() => PdfService.generateInvoicePdf(ord)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Tax Invoice PDF</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersTab;