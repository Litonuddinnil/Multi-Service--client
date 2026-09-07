import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Smartphone,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { ApiService } from '../../services/api';
import { MoneyValue } from '../common/MoneyValue';
import { CountdownTimer } from '../common/CountdownTimer';
import { FormField } from '../common/FormField';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'SESSION' | 'PROJECT_MILESTONE' | 'PACKAGE' | 'RETAINER' | 'COMMERCE';
  entityId: string;
  subEntityId?: string;
  title: string;
  amountBDT: number;
  onPaymentComplete: (orderNumber: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  subEntityId,
  title,
  amountBDT,
  onPaymentComplete
}) => {
  const { t, formatBDT } = useLanguage();
  const { effectiveUser } = useAuth();
  const { showToast } = useToast();
  const [gateway, setGateway] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD'>('BKASH');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pinOrOtp, setPinOrOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    const customerId = effectiveUser?.id || 'user-cust-1';

    try {
      // ---- Step 1: server-side gateway init ----
      // Wallet gateways (bKash/Nagad/Rocket) go straight through the
      // /capture endpoint. CARD/NET-BANKING go through SSLCOMMERZ and
      // return a redirect URL. We unify both flows by first creating a
      // pending order, then redirecting or completing inline.
      const init = await ApiService.initSSLCommerzPayment({
        orderId: '',                // empty → server creates one
        entityType,
        entityId,
        subEntityId,
        amountBDT,
        customerId,
        entityTitle: title,
      }).catch(() => null);

      // For CARD: server returned a gatewayUrl to open in a new tab.
      if (gateway === 'CARD' && init?.success && init.gatewayUrl) {
        const orderId = init.orderId;
        // Try to open in a new tab. Popup blockers may reject; surface a
        // toast with the URL so the user can paste/click it.
        const popup = window.open(init.gatewayUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          showToast(
            `Pop-up blocked. Open this URL in a new tab to complete payment: ${init.gatewayUrl}`,
            'warning',
            8000,
          );
        }

        showToast(
          `Redirecting to ${init.mode === 'demo' ? 'demo' : 'SSLCOMMERZ'} gateway…`,
          'info',
        );

        // Poll until the server-side validate/cancel changes the order
        // state. Succeed if it lands in PENDING_ADMIN_REVIEW or PAID.
        const polled = await ApiService.pollOrderStatus(orderId, {
          intervalMs: 2500,
          timeoutMs: 4 * 60 * 1000,
        });

        if (polled.success && polled.paymentStatus) {
          setPaymentSuccess({
            orderNumber: orderId,
            paymentReference: polled.paymentReference || init.transactionId,
            mode: init.mode,
          });
          showToast(
            `Payment confirmed. Status: ${polled.paymentStatus}.`,
            'success',
          );
        } else {
          setError(polled.error || 'Gateway did not confirm payment in time.');
          showToast(
            'Gateway did not confirm payment. Please try again.',
            'error',
          );
        }
        return;
      }

      // ---- Step 2: wallet capture (bKash / Nagad / Rocket) ----
      const res = await ApiService.initWalletPayment({
        entityType,
        entityId,
        subEntityId,
        amountBDT,
        gateway,
        customerId,
        mobileNumber,
        pinOrOtp,
      });

      if (res.success && res.order) {
        setPaymentSuccess(res.order);
        showToast(
          `${gateway} payment received. Awaiting admin review.`,
          'success',
        );
      } else {
        setError('Payment gateway authorization failed. Please try again.');
        showToast('Payment authorization failed.', 'error');
      }
    } catch (err) {
      setError('An error occurred during payment processing.');
      showToast('An error occurred during payment processing.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const gateways = [
    { id: 'BKASH', name: 'bKash', color: 'bg-[#E2136E] text-white', border: 'border-[#E2136E]', icon: Smartphone },
    { id: 'NAGAD', name: 'Nagad', color: 'bg-[#F7941D] text-white', border: 'border-[#F7941D]', icon: Smartphone },
    { id: 'ROCKET', name: 'Rocket', color: 'bg-[#8B2D88] text-white', border: 'border-[#8B2D88]', icon: Smartphone },
    { id: 'CARD', name: 'Card / Net Banking', color: 'bg-blue-600 text-white', border: 'border-blue-600', icon: CreditCard },
  ];

  return (
    <div 
      id="payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        id="payment-modal-card"
        className="relative w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
      >
        {/* Success Screen */}
        {paymentSuccess ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto ring-8 ring-[#34C759]/5 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Payment Escrow Captured</span>
              <h3 className="text-xl font-bold text-[#111827] mt-1">Transaction Successful!</h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Order #{paymentSuccess.orderNumber} • Reference: {paymentSuccess.paymentReference}
              </p>
            </div>

            <div className="p-4 bg-[#F6F7F8] border border-[#E5E7EB] rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Service Item:</span>
                <span className="font-semibold text-[#111827] truncate max-w-[200px]">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total Paid:</span>
                <MoneyValue amount={amountBDT} className="text-sm font-bold text-[#111827]" />
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-[#6B7280]">Escrow Status:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  HELD IN ESCROW
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Your funds are held securely in withU Escrow. Payment will only be released when your consultation or milestone is approved.
            </p>

            <button
              onClick={() => {
                onPaymentComplete(paymentSuccess.orderNumber);
                onClose();
              }}
              className="w-full py-3 px-4 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to My Bookings & Sessions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="bg-[#111827] text-white p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between pr-8">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#34C759] font-semibold uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    withU Escrow Checkout
                  </div>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{title}</h3>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-800">
                <span className="text-gray-400">Provisional Hold:</span>
                <CountdownTimer durationSeconds={1800} prefixText="Expires in:" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePayNow} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Gateway Selection Tabs */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {gateways.map((gw) => {
                    const isSelected = gateway === gw.id;
                    const Icon = gw.icon;
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setGateway(gw.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-[#34C759] bg-[#34C759]/5 ring-2 ring-[#34C759]/20'
                            : 'border-[#E5E7EB] hover:bg-[#F6F7F8] bg-white'
                        }`}
                      >
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${gw.color}`}>
                          {gw.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gateway Input Fields */}
              <div className="p-4 bg-[#F6F7F8] border border-[#E5E7EB] rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>{gateway} Gateway Authorization</span>
                  <span className="text-[10px] text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded">
                    Instant Demo Mode
                  </span>
                </div>

                {gateway === 'CARD' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Card Number (4111 2222 3333 4444)"
                      defaultValue="4111 2222 3333 4444"
                      className="w-full p-2 text-xs font-mono bg-white border border-[#E5E7EB] rounded-lg outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="12/28"
                        className="w-full p-2 text-xs font-mono bg-white border border-[#E5E7EB] rounded-lg outline-none"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        defaultValue="123"
                        className="w-full p-2 text-xs font-mono bg-white border border-[#E5E7EB] rounded-lg outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FormField label={`${gateway} Wallet Mobile Number`} required>
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        aria-label={`${gateway} Wallet Mobile Number`}
                        className="w-full p-2 text-xs font-mono bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759]"
                      />
                    </FormField>
                    <FormField label="Enter 5-digit PIN / OTP" required>
                      <input
                        type="password"
                        maxLength={6}
                        value={pinOrOtp}
                        onChange={(e) => setPinOrOtp(e.target.value)}
                        placeholder="•••••"
                        aria-label="Enter 5-digit PIN / OTP"
                        className="w-full p-2 text-xs font-mono tracking-widest bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759]"
                      />
                    </FormField>
                  </div>
                )}
              </div>

              {/* Escrow Payment Summary */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Amount:</span>
                  <MoneyValue amount={amountBDT} className="" />
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform Protection & Escrow Fee:</span>
                  <span className="text-[#34C759] font-medium">৳0 (Waived)</span>
                </div>
                <div className="flex justify-between text-sm font-bold  border-t border-gray-100 pt-2">
                  <span>Total Payable:</span>
                  <MoneyValue amount={amountBDT} className="text-base text-[#111827]" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>
                  {isProcessing
                    ? gateway === 'CARD'
                      ? 'Awaiting gateway confirmation…'
                      : 'Capturing Escrow…'
                    : `Authorize & Pay ${formatBDT(amountBDT)}`}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
