import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowUpRight, Banknote, Wallet } from 'lucide-react';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import type { ProviderLedgerRow } from '../../types';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Earnings tab.
 *
 * Three stacked panels: the balance summary, the provider ledger (every
 * escrow hold, release and transfer), and the payout request history.
 * The withdrawal form itself lives in the shell so it can overlay the page.
 */

const LEDGER_LABELS: Record<ProviderLedgerRow['type'], { label: string; className: string }> = {
  EARNING_RELEASED: { label: 'Earning released', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ESCROW_HOLD: { label: 'Escrow hold', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  PAYOUT_TRANSFERRED: { label: 'Payout transferred', className: 'text-blue-700 bg-blue-50 border-blue-200' },
  REFUND_DEDUCTION: { label: 'Refund deduction', className: 'text-rose-700 bg-rose-50 border-rose-200' },
};

export const ExpertEarningsTab: React.FC = () => {
  const {
    ledger,
    payouts,
    payoutMethods,
    loading,
    availableBalance,
    totalHeldEscrow,
    pendingPayoutTotal,
    lifetimeEarnings,
    lifetimeCommission,
    openPayoutModal,
  } = useOutletContext<ExpertOutletContext>();

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map(i => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-48"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance summary */}
      <section className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              Earnings &amp; Payouts
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Funds clear out of escrow when an engagement completes, then become
              available to withdraw.
            </p>
          </div>
          <button
            onClick={openPayoutModal}
            disabled={availableBalance <= 0}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-4 h-4" />
            Request Payout
          </button>
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Figure label="Available now" value={availableBalance} tone="text-gray-900" />
          <Figure label="Held in escrow" value={totalHeldEscrow} tone="text-amber-600" />
          <Figure label="Payout in transit" value={pendingPayoutTotal} tone="text-blue-600" />
          <Figure label="Lifetime net" value={lifetimeEarnings} tone="text-emerald-600" />
        </dl>

        <p className="text-[11px] text-gray-400">
          Platform commission withheld to date: <MoneyValue amount={lifetimeCommission} />
        </p>
      </section>

      {/* Ledger */}
      <section className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Provider Ledger</h3>

        {ledger.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No ledger movements yet"
            description="Escrow holds, releases and transfers will be itemised here."
            className="my-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="text-left text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <th className="py-2 pr-3 font-bold">Entry</th>
                  <th className="py-2 px-3 font-bold text-right">Gross</th>
                  <th className="py-2 px-3 font-bold text-right">Commission</th>
                  <th className="py-2 px-3 font-bold text-right">Net</th>
                  <th className="py-2 pl-3 font-bold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.map(row => {
                  const kind = LEDGER_LABELS[row.type];
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border mb-1 ${kind.className}`}
                        >
                          {kind.label}
                        </span>
                        <span className="block font-semibold text-gray-900">
                          {row.entityTitle}
                        </span>
                        <span className="block text-[11px] text-gray-400 font-mono">
                          {row.orderNumber} · <DateTimeValue isoDate={row.timestamp} />
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600">
                        <MoneyValue amount={row.grossBDT} />
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600">
                        −<MoneyValue amount={row.commissionBDT} />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        <MoneyValue amount={row.netBDT} />
                      </td>
                      <td className="py-3 pl-3 text-right text-gray-500">
                        <MoneyValue amount={row.balanceAfterBDT} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payout history */}
      <section className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Payout Requests</h3>

        {payouts.length === 0 ? (
          <EmptyState
            icon={ArrowUpRight}
            title="No payouts requested"
            description="Withdrawals you raise will be tracked here until finance settles them."
            className="my-0"
          />
        ) : (
          <ul className="space-y-2">
            {payouts.map(payout => (
              <li
                key={payout.id}
                className="flex items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl flex-wrap"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 font-mono">
                    {payout.payoutNumber}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {payout.payoutMethod.bankName || payout.payoutMethod.type} ·{' '}
                    <span className="font-mono">{payout.payoutMethod.accountNumberMasked}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Requested <DateTimeValue isoDate={payout.requestedAt} />
                    {payout.transactionReference ? ` · Ref ${payout.transactionReference}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <MoneyValue amount={payout.amountBDT} className="text-sm font-bold text-gray-900" />
                  <StatusPill status={payout.status} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Destinations */}
        {payoutMethods.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-gray-900">Verified destinations</h4>
            <div className="flex flex-wrap gap-2">
              {payoutMethods.map(method => (
                <span
                  key={method.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px]"
                >
                  <Banknote className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-800">
                    {method.bankName || method.type}
                  </span>
                  <span className="font-mono text-gray-500">{method.accountNumberMasked}</span>
                  {method.isDefault && (
                    <span className="text-[10px] font-bold uppercase text-blue-600">Default</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const Figure: React.FC<{ label: string; value: number; tone: string }> = ({
  label,
  value,
  tone,
}) => (
  <div className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl">
    <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
    <dd className={`text-lg font-bold mt-0.5 ${tone}`}>
      <MoneyValue amount={value} />
    </dd>
  </div>
);

export default ExpertEarningsTab;
