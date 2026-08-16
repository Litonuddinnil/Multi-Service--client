export interface ApiProblemDetail {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  instance?: string;
  errors?: Record<string, string>;
  suggestedAlternatives?: any[];
}

export const ERROR_MESSAGES_I18N: Record<string, { en: string; bn: string }> = {
  // Authentication & MFA
  invalid_credentials: {
    en: 'Incorrect email or password. Please check your credentials.',
    bn: 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
  },
  email_not_verified: {
    en: 'Your email is not verified yet. Please enter the 6-digit OTP sent to your inbox.',
    bn: 'আপনার ইমেইল ভেরিফাই করা হয়নি। অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোডটি দিন।'
  },
  mfa_required: {
    en: 'Two-factor authentication is required. Enter the 6-digit code or recovery code.',
    bn: 'টু-ফ্যাক্টর অথেনটিকেশন আবশ্যক। ৬-সংখ্যার কোড অথবা রিকভারি কোড দিন।'
  },
  account_temporarily_locked: {
    en: 'Account temporarily locked due to consecutive failed attempts. Please try again in 15 minutes.',
    bn: 'একাধিক ভুল চেষ্টার কারণে অ্যাকাউন্ট সাময়িক লক করা হয়েছে। ১৫ মিনিট পর চেষ্টা করুন।'
  },
  too_many_login_attempts: {
    en: 'Too many login attempts. Please slow down and wait a minute.',
    bn: 'খুব বেশি লগইন চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।'
  },
  too_many_attempts: {
    en: 'Maximum attempts reached. Please request a new verification code.',
    bn: 'সর্বোচ্চ চেষ্টা অতিক্রান্ত হয়েছে। নতুন ভেরিফিকেশন কোডের অনুরোধ করুন।'
  },
  verification_cooldown: {
    en: 'Please wait 60 seconds before requesting another verification code.',
    bn: 'অনুগ্রহ করে নতুন কোড পাঠানোর আগে ৬০ সেকেন্ড অপেক্ষা করুন।'
  },
  oauth_not_configured: {
    en: 'Google Sign-In is temporarily unavailable.',
    bn: 'গুগল সাইন-ইন সাময়িকভাবে অনুপলব্ধ।'
  },
  refresh_token_reused: {
    en: 'Security alert: Session token reused. You have been securely logged out.',
    bn: 'নিরাপত্তা সতর্কতা: সেশন টোকেন পুনরায় ব্যবহারের কারণে লগআউট করা হয়েছে।'
  },

  // Bookings & Slots
  slot_taken: {
    en: 'This time slot was just booked by another customer. Please select another slot.',
    bn: 'এই সময়টি অন্য একজন ব্যবহারকারী বুক করে ফেলেছেন। অনুগ্রহ করে অন্য সময় বেছে নিন।'
  },
  slot_not_available: {
    en: 'The selected slot is no longer available in the expert\'s calendar.',
    bn: 'নির্বাচিত স্লটটি বিশেষজ্ঞের ক্যালেন্ডারে আর খালি নেই।'
  },
  slot_too_soon: {
    en: 'Appointments must be booked at least 30 minutes in advance.',
    bn: 'সেশনের অন্তত ৩০ মিনিট পূর্বে বুকিং সম্পন্ন করতে হবে।'
  },
  slot_too_far: {
    en: 'Appointments can only be scheduled up to 31 days in advance.',
    bn: 'সর্বোচ্চ ৩১ দিন পূর্ব পর্যন্ত সেশনের শিডিউল করা যাবে।'
  },
  cannot_book_own_service: {
    en: 'You cannot book or request your own expert services.',
    bn: 'আপনি নিজের বিশেষজ্ঞ সার্ভিস বুক করতে পারবেন না।'
  },
  package_not_bookable: {
    en: 'This package requires a custom quote request rather than instant booking.',
    bn: 'এই প্যাকেজটির জন্য সরাসরি বুকিং প্রযোজ্য নয়, কাস্টম কোটেশনের আবেদন করুন।'
  },
  too_late_to_cancel: {
    en: 'The cancellation deadline has passed. Cancellation is no longer permitted for this booking.',
    bn: 'বাতিলের সময়সীমা পার হয়ে গেছে। এই বুকিংটি এখন বাতিল করা সম্ভব নয়।'
  },
  payment_required: {
    en: 'Customer payment is still pending. The booking cannot be confirmed until payment settles.',
    bn: 'গ্রাহকের পেমেন্ট এখনো অপেক্ষমান। পেমেন্ট সম্পন্ন না হওয়া পর্যন্ত কনফার্ম করা যাবে না।'
  },

  // Pilgrimage Packages
  sold_out: {
    en: 'This departure has just sold out. Please explore other available departure dates.',
    bn: 'এই ডিপারচারের সকল আসন পূর্ণ হয়ে গেছে। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।'
  },

  // Expert Onboarding & Verification
  category_locked: {
    en: 'Primary category cannot be changed once the application is submitted or approved.',
    bn: 'আবেদন জমা বা অনুমোদনের পর প্রাথমিক ক্যাটাগরি পরিবর্তন করা যাবে না।'
  },
  submission_incomplete: {
    en: 'Your application is missing required professional documents or information.',
    bn: 'আপনার আবেদনে প্রয়োজনীয় ডকুমেন্ট বা তথ্য বাকি রয়েছে।'
  },

  // Finance & Payouts
  insufficient_balance: {
    en: 'Insufficient released balance for payout. Note that escrowed funds are released upon service completion.',
    bn: 'উত্তোলনের জন্য পর্যাপ্ত ব্যালেন্স নেই। মনে রাখবেন এসক্রো ফান্ড সার্ভিস সমাপ্তিতে যুক্ত হয়।'
  },
  validation_failed: {
    en: 'Please resolve the highlighted field errors below.',
    bn: 'অনুগ্রহ করে নিচের চিহ্নিত ভুলগুলো সংশোধন করুন।'
  },
  network_error: {
    en: 'Network connection lost. Please check your internet and retry.',
    bn: 'নেটওয়ার্ক সংযোগ বিচ্ছিন্ন। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
  },
  unknown_error: {
    en: 'An unexpected error occurred. Please try again.',
    bn: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
  }
};

export function getErrorMessage(code?: string, locale: 'en' | 'bn' = 'en'): string {
  if (!code || !ERROR_MESSAGES_I18N[code]) {
    return locale === 'bn' ? ERROR_MESSAGES_I18N.unknown_error.bn : ERROR_MESSAGES_I18N.unknown_error.en;
  }
  return ERROR_MESSAGES_I18N[code][locale];
}
