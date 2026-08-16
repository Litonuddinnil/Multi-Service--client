import type { Locale } from './types';

/**
 * Cart, checkout, and order-confirmation surfaces (including dynamic
 * placeholders like `{amount}` in `checkoutPayButton`).
 */
export const checkoutDictionary: Record<Locale, Record<string, string>> = {
  en: {
    checkout: 'Checkout',
    checkoutTitle: 'Review your order',
    checkoutSubtitle:
      'Confirm items, choose a payment method and complete your purchase securely.',
    checkoutEmpty: 'Your cart is empty.',
    checkoutBrowseStore: 'Browse the store',
    checkoutOrderSummary: 'Order summary',
    checkoutItemsCount: 'items',
    checkoutSubtotal: 'Subtotal',
    checkoutDelivery: 'Delivery',
    checkoutFree: 'Free',
    checkoutTotal: 'Total',
    checkoutPlaceOrder: 'Place order',
    checkoutProcessing: 'Processing…',
    checkoutContinueShopping: 'Continue shopping',
    checkoutContactTitle: 'Contact information',
    checkoutFullName: 'Full name',
    checkoutPhone: 'Phone number',
    checkoutAddress: 'Delivery address',
    checkoutAddressPlaceholder: 'House, road, area, city',
    checkoutNotes: 'Order notes (optional)',
    checkoutNotesPlaceholder: 'Any special instructions for delivery',
    checkoutPaymentTitle: 'Payment method',
    checkoutPaymentCod: 'Cash on delivery',
    checkoutPaymentCodDesc: 'Pay when your order arrives at your door.',
    checkoutPaymentOnline: 'Online payment (Escrow)',
    checkoutPaymentOnlineDesc:
      'Funds are held safely in escrow until delivery is confirmed.',
    checkoutPayButton: 'Pay ৳{amount} now',
    checkoutOrderPlaced: 'Order placed successfully!',
    checkoutOrderPlacedDesc:
      'Your order has been recorded. Track it from your client dashboard.',
    checkoutBackHome: 'Back to home',
    checkoutViewDashboard: 'View dashboard',
    checkoutLoginRequired: 'Please log in to complete checkout.',
    checkoutLoginCta: 'Log in to continue',
  },
  bn: {
    checkout: 'চেকআউট',
    checkoutTitle: 'অর্ডার যাচাই করুন',
    checkoutSubtitle:
      'পণ্যগুলো দেখুন, পেমেন্� পদ্ধতি বেছে নিন এবং নিরাপদে ক্রয় সম্পন্ন করুন।',
    checkoutEmpty: '�পনার কার্ট খালি।',
    checkoutBrowseStore: 'স্টোর দেখুন',
    checkoutOrderSummary: 'অর্ডার সারাংশ',
    checkoutItemsCount: 'টি পণ্য',
    checkoutSubtotal: 'সাবটোটাল',
    checkoutDelivery: 'ডেলিভারি',
    checkoutFree: 'ফ্রি',
    checkoutTotal: 'মোট',
    checkoutPlaceOrder: 'অর্ডার দিন',
    checkoutProcessing: 'প্রক্রিয়া চলছে…',
    checkoutContinueShopping: 'শপিং চালিয়ে যান',
    checkoutContactTitle: 'যোগাযোগের তথ্য',
    checkoutFullName: 'পুরো নাম',
    checkoutPhone: 'ফোন নম্বর',
    checkoutAddress: 'ডে�িভারি ঠিকানা',
    checkoutAddressPlaceholder: 'বাসা, রোড, এলাকা, শহর',
    checkoutNotes: 'অর্ডার নোট (ঐচ্ছিক)',
    checkoutNotesPlaceholder: 'ডেলিভারির জন্য বিশেষ নির্দেশনা',
    checkoutPaymentTitle: 'পেমেন্ট পদ্ধতি',
    checkoutPaymentCod: 'ক্যাশ অন ডেলিভারি',
    checkoutPaymentCodDesc: 'পণ্য পৌঁছালে পেমেন্ট করুন।',
    checkoutPaymentOnline: 'অনলা�ন পেমেন্ট (এসক্রো)',
    checkoutPaymentOnlineDesc:
      'ডেলিভারি নিশ্চিত না হওয়া পর্যন্ত অর্থ এসক্রোতে সুরক্�িত থাকবে।',
    checkoutPayButton: 'এখনই �{amount} পেমেন্ট করুন',
    checkoutOrderPlaced: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
    checkoutOrderPlacedDesc:
      'আপনার অর্ডার রেকর্ড করা হয়েছে। ক্লায়েন্ট ড্যা�বোর্ড থেকে ট্র্যাক করুন।',
    checkoutBackHome: 'হোমে ফিরুন',
    checkoutViewDashboard: 'ড্যাশবোর্ড দেখুন',
    checkoutLoginRequired: 'চেকআউট সম্পন্ন করতে লগইন করুন।',
    checkoutLoginCta: 'লগইন করুন',
  },
};
