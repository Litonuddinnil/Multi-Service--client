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
    en: 'Appointments can only be scheduled up to 90 days in advance.',
    bn: 'সর্বোচ্চ ৯০ দিন পূর্ব পর্যন্ত সেশনের শিডিউল করা যাবে।'
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
  // Disputes
  dispute_not_found: {
    en: 'That dispute no longer exists.',
    bn: 'এই ডিসপিউটটি আর নেই।'
  },
  dispute_open: {
    en: 'A dispute is open on this item — the funds are held until it is resolved.',
    bn: 'এই আইটেমে একটি ডিসপিউট চলছে — সমাধান না হওয়া পর্যন্ত অর্থ আটকে থাকবে।'
  },
  dispute_closed: {
    en: 'This dispute is closed and can no longer be changed.',
    bn: 'এই ডিসপিউটটি বন্ধ হয়ে গেছে, আর পরিবর্তন করা যাবে না।'
  },
  dispute_already_open: {
    en: 'A dispute is already open on this item.',
    bn: 'এই আইটেমে ইতিমধ্যে একটি ডিসপিউট খোলা রয়েছে।'
  },
  no_order_for_subject: {
    en: 'Nothing has been paid for this item, so there is nothing to dispute.',
    bn: 'এই আইটেমের জন্য কোনো পেমেন্ট হয়নি, তাই ডিসপিউট করার কিছু নেই।'
  },
  order_not_disputable: {
    en: 'The payment for this item is not in a state that can be disputed.',
    bn: 'এই আইটেমের পেমেন্ট এমন অবস্থায় নেই যা নিয়ে ডিসপিউট করা যায়।'
  },
  not_a_party: {
    en: 'You are not a party to this transaction.',
    bn: 'আপনি এই লেনদেনের কোনো পক্ষ নন।'
  },
  not_the_opener: {
    en: 'Only the party who opened this dispute can withdraw it.',
    bn: 'যিনি ডিসপিউটটি খুলেছেন কেবল তিনিই এটি প্রত্যাহার করতে পারবেন।'
  },
  invalid_split_amount: {
    en: 'A split refund must be more than zero and less than the full amount.',
    bn: 'আংশিক ফেরত অবশ্যই শূন্যের বেশি এবং সম্পূর্ণ পরিমাণের কম হতে হবে।'
  },

  // Payments
  order_not_found: {
    en: 'That order no longer exists.',
    bn: 'এই অর্ডারটি আর নেই।'
  },
  payout_method_not_found: {
    en: 'No payout method on file yet. Add one to receive your earnings.',
    bn: 'কোনো পেআউট মেথড যোগ করা হয়নি। আয় গ্রহণ করতে একটি যোগ করুন।'
  },
  no_captured_payment: {
    en: 'There is no captured payment on this order to refund.',
    bn: 'এই অর্ডারে ফেরত দেওয়ার মতো কোনো গৃহীত পেমেন্ট নেই।'
  },
  invalid_refund_amount: {
    en: 'The refund amount must be greater than zero and no more than the remaining balance.',
    bn: 'ফেরতের পরিমাণ শূন্যের বেশি এবং অবশিষ্ট ব্যালেন্সের মধ্যে হতে হবে।'
  },
  refund_failed: {
    en: 'The payment gateway refused the refund. Please retry or contact support.',
    bn: 'পেমেন্ট গেটওয়ে ফেরত প্রত্যাখ্যান করেছে। পুনরায় চেষ্টা করুন বা সাপোর্টে যোগাযোগ করুন।'
  },

  // Bookings (sessions)
  booking_not_found: {
    en: 'That booking no longer exists.',
    bn: 'এই বুকিংটি আর নেই।'
  },
  not_payable: {
    en: 'This booking is no longer awaiting payment.',
    bn: 'এই বুকিংটি আর পেমেন্টের অপেক্ষায় নেই।'
  },
  already_paid: {
    en: 'This booking has already been paid for.',
    bn: 'এই বুকিংয়ের পেমেন্ট ইতিমধ্যে সম্পন্ন হয়েছে।'
  },
  not_confirmed: {
    en: 'The expert has not confirmed this booking yet.',
    bn: 'বিশেষজ্ঞ এখনো এই বুকিংটি নিশ্চিত করেননি।'
  },
  no_meeting_room: {
    en: 'This is an in-person session — there is no online meeting room.',
    bn: 'এটি সরাসরি সাক্ষাতের সেশন — কোনো অনলাইন মিটিং রুম নেই।'
  },
  not_reschedulable: {
    en: 'This booking can no longer be rescheduled.',
    bn: 'এই বুকিংয়ের সময় আর পরিবর্তন করা যাবে না।'
  },
  slot_passed: {
    en: 'That time slot has already passed.',
    bn: 'এই সময়টি ইতিমধ্যে পার হয়ে গেছে।'
  },
  no_pending_reschedule: {
    en: 'There is no pending reschedule request.',
    bn: 'সময় পরিবর্তনের কোনো অনুরোধ অপেক্ষমাণ নেই।'
  },
  cannot_respond_own_proposal: {
    en: 'You proposed this change — the other party needs to respond.',
    bn: 'আপনি এই পরিবর্তনের প্রস্তাব দিয়েছেন — অপর পক্ষকে সাড়া দিতে হবে।'
  },
  session_not_finished: {
    en: 'The session has not finished yet.',
    bn: 'সেশনটি এখনো শেষ হয়নি।'
  },
  invalid_meeting_link: {
    en: 'The meeting link must be a valid https:// URL.',
    bn: 'মিটিং লিংকটি অবশ্যই একটি বৈধ https:// ঠিকানা হতে হবে।'
  },

  // Contact-info screening (public / pre-payment free text)
  contact_info_not_allowed: {
    en: "Sharing contact details isn't allowed here — it protects your payment.",
    bn: 'এখানে যোগাযোগের তথ্য দেওয়া যাবে না — এটি আপনার পেমেন্ট সুরক্ষিত রাখে।'
  },

  // Catalog — categories
  category_not_found: {
    en: 'That category no longer exists. Please pick another one.',
    bn: 'এই ক্যাটাগরিটি আর নেই। অনুগ্রহ করে অন্য একটি নির্বাচন করুন।'
  },
  category_not_bookable: {
    en: 'This category does not accept service listings.',
    bn: 'এই ক্যাটাগরিতে সার্ভিস তালিকাভুক্ত করা যায় না।'
  },
  slug_taken: {
    en: 'That slug is already in use. Please choose a different one.',
    bn: 'এই স্লাগটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে ভিন্ন একটি দিন।'
  },
  kind_mismatch: {
    en: 'A category must match the kind of its parent category.',
    bn: 'ক্যাটাগরির ধরন অবশ্যই তার প্যারেন্ট ক্যাটাগরির ধরনের সাথে মিলতে হবে।'
  },
  max_depth_exceeded: {
    en: 'Categories can be nested at most three levels deep.',
    bn: 'ক্যাটাগরি সর্বোচ্চ তিন স্তর পর্যন্ত নেস্ট করা যায়।'
  },
  invalid_attribute_schema: {
    en: 'The attribute schema is not valid. Please review the field definitions.',
    bn: 'অ্যাট্রিবিউট স্কিমাটি সঠিক নয়। অনুগ্রহ করে ফিল্ডগুলো পুনরায় দেখুন।'
  },

  // Catalog — services
  service_not_found: {
    en: 'This service is no longer available.',
    bn: 'এই সার্ভিসটি আর উপলব্ধ নেই।'
  },
  service_archived: {
    en: 'This service has been archived and can no longer be edited.',
    bn: 'এই সার্ভিসটি আর্কাইভ করা হয়েছে, এটি আর সম্পাদনা করা যাবে না।'
  },
  invalid_attributes: {
    en: 'Some category-specific details are missing or invalid.',
    bn: 'ক্যাটাগরি-নির্দিষ্ট কিছু তথ্য অনুপস্থিত বা ভুল রয়েছে।'
  },
  unknown_country: {
    en: 'That country is not supported yet.',
    bn: 'এই দেশটি এখনো সমর্থিত নয়।'
  },
  expert_not_approved: {
    en: 'Your expert profile must be approved before you can publish a service.',
    bn: 'সার্ভিস প্রকাশের আগে আপনার এক্সপার্ট প্রোফাইল অনুমোদিত হতে হবে।'
  },
  publish_requirements_not_met: {
    en: 'Add at least one active package before publishing this service.',
    bn: 'প্রকাশের আগে অন্তত একটি সক্রিয় প্যাকেজ যোগ করুন।'
  },
  location_required: {
    en: 'An in-person package needs a complete location with map coordinates.',
    bn: 'সরাসরি সেবার জন্য মানচিত্রের অবস্থানসহ সম্পূর্ণ ঠিকানা প্রয়োজন।'
  },
  service_radius_required: {
    en: 'Set how far you are willing to travel before publishing.',
    bn: 'প্রকাশের আগে আপনি কত দূর যেতে ইচ্ছুক তা নির্ধারণ করুন।'
  },
  invalid_status_transition: {
    en: 'This service cannot move to that state from its current one.',
    bn: 'বর্তমান অবস্থা থেকে এই সার্ভিসটি ঐ অবস্থায় নেওয়া যাবে না।'
  },

  // Catalog — packages
  too_many_packages: {
    en: 'A service can have at most 10 packages.',
    bn: 'একটি সার্ভিসে সর্বোচ্চ ১০টি প্যাকেজ রাখা যায়।'
  },
  duration_required: {
    en: 'A session package needs a duration between 5 and 480 minutes.',
    bn: 'সেশন প্যাকেজের জন্য ৫ থেকে ৪৮০ মিনিটের সময়কাল প্রয়োজন।'
  },
  currency_not_active: {
    en: 'That currency is not available at the moment.',
    bn: 'এই মুদ্রাটি এই মুহূর্তে উপলব্ধ নয়।'
  },
  mixed_currencies: {
    en: 'All packages of one service must share the same currency.',
    bn: 'একটি সার্ভিসের সব প্যাকেজে একই মুদ্রা ব্যবহার করতে হবে।'
  },
  package_not_found: {
    en: 'That package no longer exists.',
    bn: 'এই প্যাকেজটি আর নেই।'
  },

  // Catalog — availability
  expert_not_found: {
    en: 'This expert is not available.',
    bn: 'এই বিশেষজ্ঞকে পাওয়া যায়নি।'
  },
  invalid_range: {
    en: 'Please pick a date range of 31 days or fewer.',
    bn: 'অনুগ্রহ করে ৩১ দিন বা তার কম সময়ের একটি সীমা নির্বাচন করুন।'
  },
  invalid_timezone: {
    en: 'That time zone is not recognised.',
    bn: 'এই টাইম জোনটি সঠিক নয়।'
  },
  invalid_time_range: {
    en: 'The end time must be later than the start time.',
    bn: 'শেষ সময় অবশ্যই শুরুর সময়ের পরে হতে হবে।'
  },
  invalid_date_range: {
    en: 'Please check the dates — the end date cannot precede the start date.',
    bn: 'তারিখগুলো দেখুন — শেষ তারিখ শুরুর তারিখের আগে হতে পারে না।'
  },
  too_many_rules: {
    en: 'You can have at most 50 availability rules.',
    bn: 'আপনি সর্বোচ্চ ৫০টি অ্যাভেইলেবিলিটি রুল রাখতে পারবেন।'
  },
  overlapping_rule: {
    en: 'This slot overlaps an existing availability rule.',
    bn: 'এই সময়টি বিদ্যমান একটি রুলের সাথে ওভারল্যাপ করছে।'
  },
  rule_not_found: {
    en: 'That availability rule no longer exists.',
    bn: 'এই অ্যাভেইলেবিলিটি রুলটি আর নেই।'
  },
  times_required: {
    en: 'Extra availability needs both a start and an end time.',
    bn: 'অতিরিক্ত সময়ের জন্য শুরু ও শেষ উভয় সময় প্রয়োজন।'
  },
  override_not_found: {
    en: 'That availability exception no longer exists.',
    bn: 'এই অ্যাভেইলেবিলিটি ব্যতিক্রমটি আর নেই।'
  },

  // Expert onboarding & verification
  expert_profile_not_found: {
    en: "You don't have an expert profile yet. Start the “become an expert” flow to apply.",
    bn: 'আপনার এখনো কোনো এক্সপার্ট প্রোফাইল নেই। আবেদন করতে "এক্সপার্ট হন" ধাপটি শুরু করুন।'
  },
  profile_locked: {
    en: 'Your profile is locked while it is under review.',
    bn: 'পর্যালোচনা চলাকালীন আপনার প্রোফাইল সম্পাদনা করা যাবে না।'
  },
  identity_locked: {
    en: 'Identity details cannot be changed while your application is under review.',
    bn: 'আবেদন পর্যালোচনাধীন থাকা অবস্থায় পরিচয়ের তথ্য পরিবর্তন করা যাবে না।'
  },
  documents_locked: {
    en: 'Documents cannot be changed while your application is under review.',
    bn: 'আবেদন পর্যালোচনাধীন থাকা অবস্থায় ডকুমেন্ট পরিবর্তন করা যাবে না।'
  },
  invalid_skills: {
    en: 'Please check your skills list — at most 30 entries, each up to 80 characters.',
    bn: 'আপনার দক্ষতার তালিকা দেখুন — সর্বোচ্চ ৩০টি, প্রতিটি ৮০ অক্ষরের মধ্যে।'
  },
  too_many_items: {
    en: 'That list can hold at most 20 entries.',
    bn: 'এই তালিকায় সর্বোচ্চ ২০টি এন্ট্রি রাখা যায়।'
  },
  unsupported_photo_type: {
    en: 'A profile photo must be a JPEG, PNG, or WebP image.',
    bn: 'প্রোফাইল ছবি অবশ্যই JPEG, PNG অথবা WebP ফরম্যাটে হতে হবে।'
  },
  empty_file: {
    en: 'No file was selected. Please choose a file and try again.',
    bn: 'কোনো ফাইল নির্বাচন করা হয়নি। অনুগ্রহ করে একটি ফাইল বেছে নিন।'
  },
  unsupported_document_type: {
    en: 'That document type is not accepted. Upload a PDF, JPEG, or PNG.',
    bn: 'এই ধরনের ডকুমেন্ট গ্রহণযোগ্য নয়। PDF, JPEG অথবা PNG আপলোড করুন।'
  },
  invalid_expiry: {
    en: 'The expiry date must be a valid date in the future.',
    bn: 'মেয়াদ উত্তীর্ণের তারিখ অবশ্যই ভবিষ্যতের একটি বৈধ তারিখ হতে হবে।'
  },
  too_many_documents: {
    en: 'You can upload at most 15 documents.',
    bn: 'আপনি সর্বোচ্চ ১৫টি ডকুমেন্ট আপলোড করতে পারবেন।'
  },
  document_not_found: {
    en: 'That document no longer exists.',
    bn: 'এই ডকুমেন্টটি আর নেই।'
  },
  certification_not_found: {
    en: 'That certification no longer exists.',
    bn: 'এই সার্টিফিকেশনটি আর নেই।'
  },
  reason_required: {
    en: 'Please provide a reason.',
    bn: 'অনুগ্রহ করে একটি কারণ উল্লেখ করুন।'
  },
  photo_not_found: {
    en: 'No profile photo has been uploaded yet.',
    bn: 'এখনো কোনো প্রোফাইল ছবি আপলোড করা হয়নি।'
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
