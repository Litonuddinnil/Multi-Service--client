import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShoppingBag,
  Truck,
  CreditCard,
  Wallet,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Lock,
  PackageCheck,
  Home as HomeIcon,
  LayoutDashboard,
  MapPin,
  User,
  Phone,
  StickyNote,
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { StorageService } from '../services/storage';
import type { OrderItem } from '../types';

type PaymentChoice = 'COD' | 'ESCROW';

const CheckoutView: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotalBDT, removeFromCart, clearCart, addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { t, locale, formatBDT } = useLanguage();

  const [name, setName] = useState<string>(user?.name ?? '');
  const [phone, setPhone] = useState<string>(user?.phone ?? '');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [payment, setPayment] = useState<PaymentChoice>('ESCROW');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryBDT = cartTotalBDT > 0 ? 0 : 0; // free delivery for now
  const totalBDT = cartTotalBDT + deliveryBDT;

  const isFormValid = useMemo(() => {
    if (cart.length === 0) return false;
    if (!isAuthenticated) return false;
    if (!name.trim() || !phone.trim() || !address.trim()) return false;
    return true;
  }, [cart.length, isAuthenticated, name, phone, address]);

  const handleQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    if (delta < 0) {
      removeFromCart(productId);
    } else if (delta > 0) {
      addToCart(item.product);
    }
  };

  const buildOrderNumber = (): string => {
    const ts = new Date();
    const yy = ts.getFullYear().toString().slice(-2);
    const mm = (ts.getMonth() + 1).toString().padStart(2, '0');
    const dd = ts.getDate().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `WU-${yy}${mm}${dd}-${rand}`;
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid || !user) return;
    setIsProcessing(true);

    // Simulate payment processing latency for nicer UX
    await new Promise<void>(resolve => setTimeout(resolve, 700));

    const now = new Date().toISOString();
    const orderNumber = buildOrderNumber();
    const commissionRate = 0.05; // 5% platform fee for store products

    const newOrders: OrderItem[] = cart.map(item => {
      const gross = item.product.priceBDT * item.quantity;
      const commission = Math.round(gross * commissionRate);
      return {
        id: `order_${Date.now()}_${item.product.id}`,
        orderNumber,
        customerId: user.id,
        customerName: user.name,
        entityType: 'COMMERCE',
        entityId: item.product.id,
        entityTitle: item.product.title,
        expertId: 'withu-store',
        expertName: 'WithU Store',
        grossAmountBDT: gross,
        taxAmountBDT: 0,
        totalAmountBDT: gross,
        commissionRate,
        commissionAmountBDT: commission,
        providerNetAmountBDT: gross - commission,
        paymentGateway: payment === 'ESCROW' ? 'CARD' : 'CARD',
        paymentReference:
          payment === 'ESCROW'
            ? `ESC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
            : `COD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        paymentStatus: payment === 'ESCROW' ? 'PAID' : 'PENDING_PAYMENT',
        escrowStatus:
          payment === 'ESCROW' ? 'HELD_IN_ESCROW' : 'HELD_IN_ESCROW',
        paidAt: payment === 'ESCROW' ? now : undefined,
        createdAt: now,
      };
    });

    const existing = StorageService.getOrders();
    StorageService.saveOrders([...newOrders, ...existing]);
    clearCart();
    setPlacedOrderNumber(orderNumber);
    setIsProcessing(false);
  };

  // ---------- Success screen ----------
  if (placedOrderNumber) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
        <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 sm:p-12 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
            <PackageCheck className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {t('checkoutOrderPlaced')}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            {t('checkoutOrderPlacedDesc')}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">
              {locale === 'bn' ? 'অর্ডার নম্বর' : 'Order #'}
            </span>
            <span className="font-mono text-sm font-black text-emerald-700">
              {placedOrderNumber}
            </span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition"
            >
              <HomeIcon className="h-4 w-4" />
              {t('checkoutBackHome')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/portal/customer')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('checkoutViewDashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Empty cart ----------
  if (cart.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 ring-8 ring-slate-50">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight ">
          {t('checkoutTitle')}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400">
          {t('checkoutEmpty')}
        </p>
        <div className="mt-8">
          <Link
            to="/commerce"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition"
          >
            <ShoppingBag className="h-4 w-4" />
            {t('checkoutBrowseStore')}
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Main checkout ----------
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('checkoutContinueShopping')}
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight ">
            {t('checkoutTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            {t('checkoutSubtitle')}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          {t('escrowGuarantee')}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* LEFT — Form */}
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {t('checkoutContactTitle')}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  {t('checkoutFullName')}
                </span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('checkoutFullName')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  {t('checkoutPhone')}
                </span>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-bold text-slate-700">
                {t('checkoutAddress')}
              </span>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('checkoutAddressPlaceholder')}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-bold text-slate-700">
                {t('checkoutNotes')}
              </span>
              <div className="relative">
                <StickyNote className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('checkoutNotesPlaceholder')}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>
          </section>

          {/* Payment */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {t('checkoutPaymentTitle')}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayment('ESCROW')}
                className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                  payment === 'ESCROW'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  payment === 'ESCROW' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-900">
                    {t('checkoutPaymentOnline')}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {t('checkoutPaymentOnlineDesc')}
                  </div>
                </div>
                {payment === 'ESCROW' && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPayment('COD')}
                className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                  payment === 'COD'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  payment === 'COD' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-900">
                    {t('checkoutPaymentCod')}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {t('checkoutPaymentCodDesc')}
                  </div>
                </div>
                {payment === 'COD' && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                )}
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT — Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {t('checkoutOrderSummary')}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                {itemCount} {t('checkoutItemsCount')}
              </span>
            </div>

            <ul className="space-y-3 max-h-72 overflow-auto pr-1">
              {cart.map(item => (
                <li
                  key={item.product.id}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200">
                    {item.product.coverImage ? (
                      <img
                        src={item.product.coverImage}
                        alt={item.product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-xs font-bold text-slate-900">
                        {item.product.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => handleQuantity(item.product.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[20px] text-center text-[11px] font-black text-slate-700">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantity(item.product.id, +1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs font-black text-slate-900">
                        {formatBDT(item.product.priceBDT * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t('checkoutSubtotal')}</span>
                <span className="font-bold text-slate-900">
                  {formatBDT(cartTotalBDT)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  {t('checkoutDelivery')}
                </span>
                <span className="font-bold text-emerald-600">
                  {t('checkoutFree')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                <span className="font-black text-slate-900">{t('checkoutTotal')}</span>
                <span className="font-black text-emerald-700">
                  {formatBDT(totalBDT)}
                </span>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="mt-5">
                <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  {t('checkoutLoginRequired')}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/checkout')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition"
                >
                  <Lock className="h-4 w-4" />
                  {t('checkoutLoginCta')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!isFormValid || isProcessing}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none transition"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t('checkoutProcessing')}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    {t('checkoutPlaceOrder')} · {formatBDT(totalBDT)}
                  </>
                )}
              </button>
            )}

            <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
              {locale === 'bn'
                ? 'আপনার পেমেন্ট নিরাপদে এনক্রিপ্ট করা হয়েছে'
                : 'Your payment is securely encrypted'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutView;
