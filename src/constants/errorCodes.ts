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


  // ── §1 Email verification & password reset ────────────────────────────
  email_not_verified: {
    en: 'Confirm your email address before signing in. We can send the code again.',
    bn: 'সাইন ইন করার আগে আপনার ইমেইল ঠিকানা নিশ্চিত করুন। আমরা কোডটি আবার পাঠাতে পারি।'
  },
  email_already_verified: {
    en: 'This email is already verified — just sign in.',
    bn: 'এই ইমেইলটি ইতিমধ্যে যাচাই করা হয়েছে — সরাসরি সাইন ইন করুন।'
  },
  email_already_registered: {
    en: 'An account with this email already exists. Try signing in instead.',
    bn: 'এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। সাইন ইন করার চেষ্টা করুন।'
  },
  invalid_verification_code: {
    en: 'That code is not valid. Check the digits and try again.',
    bn: 'কোডটি সঠিক নয়। সংখ্যাগুলো মিলিয়ে আবার চেষ্টা করুন।'
  },
  verification_code_expired: {
    en: 'That code has expired. Request a new one.',
    bn: 'কোডের মেয়াদ শেষ। নতুন কোডের অনুরোধ করুন।'
  },
  invalid_mfa_code: {
    en: 'That verification code is not valid. Check your authenticator app.',
    bn: 'ভেরিফিকেশন কোডটি সঠিক নয়। আপনার অথেনটিকেটর অ্যাপ দেখুন।'
  },
  invalid_refresh_token: {
    en: 'Your session could not be renewed. Please sign in again.',
    bn: 'আপনার সেশন নবায়ন করা যায়নি। অনুগ্রহ করে আবার সাইন ইন করুন।'
  },
  refresh_token_expired: {
    en: 'Your session has expired. Please sign in again.',
    bn: 'আপনার সেশনের মেয়াদ শেষ। অনুগ্রহ করে আবার সাইন ইন করুন।'
  },
  account_not_active: {
    en: 'This account is not active. Contact support if you think this is a mistake.',
    bn: 'এই অ্যাকাউন্টটি সক্রিয় নয়। ভুল মনে হলে সাপোর্টে যোগাযোগ করুন।'
  },
  user_not_found: {
    en: 'We could not find that account.',
    bn: 'সেই অ্যাকাউন্টটি খুঁজে পাওয়া যায়নি।'
  },
  malformed_request: {
    en: 'The request could not be read. Please try again.',
    bn: 'অনুরোধটি পড়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
  },

  // ── §2 Account self-service ───────────────────────────────────────────
  mfa_already_enabled: {
    en: 'Two-factor authentication is already on for this account.',
    bn: 'এই অ্যাকাউন্টে টু-ফ্যাক্টর অথেনটিকেশন ইতিমধ্যে চালু আছে।'
  },
  mfa_not_initialized: {
    en: 'Scan the QR code first, then enter a code from your authenticator app.',
    bn: 'প্রথমে QR কোড স্ক্যান করুন, তারপর অথেনটিকেটর অ্যাপ থেকে কোড দিন।'
  },
  mfa_not_enabled: {
    en: 'Two-factor authentication is not turned on.',
    bn: 'টু-ফ্যাক্টর অথেনটিকেশন চালু নেই।'
  },
  super_admin_protected: {
    en: 'The platform owner account is protected and cannot be changed here.',
    bn: 'প্ল্যাটফর্ম মালিকের অ্যাকাউন্ট সুরক্ষিত এবং এখান থেকে পরিবর্তন করা যায় না।'
  },
  cannot_act_on_self: {
    en: 'You cannot perform this action on your own account.',
    bn: 'আপনি নিজের অ্যাকাউন্টে এই কাজটি করতে পারবেন না।'
  },
  account_deleted: {
    en: 'This account has been deleted.',
    bn: 'এই অ্যাকাউন্টটি মুছে ফেলা হয়েছে।'
  },
  not_suspended: {
    en: 'This account is not suspended.',
    bn: 'এই অ্যাকাউন্টটি স্থগিত নয়।'
  },
  last_super_admin: {
    en: 'The last platform owner must keep their role.',
    bn: 'শেষ প্ল্যাটফর্ম মালিককে অবশ্যই তার ভূমিকা রাখতে হবে।'
  },
  role_not_found: {
    en: 'That role does not exist.',
    bn: 'সেই ভূমিকাটি নেই।'
  },

  // ── §5 Platform reference data ────────────────────────────────────────
  country_not_found: {
    en: 'That country is not on the platform yet.',
    bn: 'সেই দেশটি এখনো প্ল্যাটফর্মে নেই।'
  },
  tax_rule_overlap: {
    en: 'A tax rule for this scope already covers that date. Pick a later start date.',
    bn: 'এই ক্ষেত্রের একটি কর নিয়ম ইতিমধ্যে সেই তারিখ অন্তর্ভুক্ত করে। পরবর্তী তারিখ বেছে নিন।'
  },

  // ── §11 Projects ──────────────────────────────────────────────────────
  project_not_found: {
    en: 'We could not find that project.',
    bn: 'সেই প্রজেক্টটি খুঁজে পাওয়া যায়নি।'
  },
  service_not_projectable: {
    en: 'That listing does not take project requests.',
    bn: 'সেই সার্ভিসটি প্রজেক্ট অনুরোধ গ্রহণ করে না।'
  },
  cannot_request_own_service: {
    en: 'You cannot request your own service.',
    bn: 'আপনি নিজের সার্ভিসের অনুরোধ করতে পারবেন না।'
  },
  invalid_requirements: {
    en: 'Some answers on the project form need fixing.',
    bn: 'প্রজেক্ট ফর্মের কিছু উত্তর ঠিক করতে হবে।'
  },
  quote_not_accepted: {
    en: 'Accept the quote before funding a milestone.',
    bn: 'মাইলস্টোনে অর্থ প্রদানের আগে কোটেশন গ্রহণ করুন।'
  },
  milestone_not_fundable: {
    en: 'This milestone is no longer awaiting payment.',
    bn: 'এই মাইলস্টোনটি আর পেমেন্টের অপেক্ষায় নেই।'
  },
  milestone_not_found: {
    en: 'We could not find that milestone.',
    bn: 'সেই মাইলস্টোনটি খুঁজে পাওয়া যায়নি।'
  },
  project_closed: {
    en: 'This project is closed — files can no longer be added or removed.',
    bn: 'এই প্রজেক্টটি বন্ধ — ফাইল যোগ বা মুছে ফেলা যাবে না।'
  },
  unsupported_attachment_type: {
    en: 'Attachments must be a PDF, JPEG, PNG or WebP file.',
    bn: 'সংযুক্তি অবশ্যই PDF, JPEG, PNG বা WebP ফাইল হতে হবে।'
  },
  too_many_attachments: {
    en: 'This conversation has reached its file limit.',
    bn: 'এই আলোচনায় ফাইলের সীমা পূর্ণ হয়েছে।'
  },
  not_the_uploader: {
    en: 'Only the person who uploaded a file can remove it.',
    bn: 'যিনি ফাইলটি আপলোড করেছেন কেবল তিনিই এটি মুছতে পারবেন।'
  },

  // ── §12 Pilgrimage ────────────────────────────────────────────────────
  departure_not_open: {
    en: 'This departure is no longer taking bookings.',
    bn: 'এই যাত্রাটি আর বুকিং নিচ্ছে না।'
  },
  departure_not_found: {
    en: 'We could not find that departure.',
    bn: 'সেই যাত্রাটি খুঁজে পাওয়া যায়নি।'
  },
  departure_in_future: {
    en: 'You can complete a departure on or after its date.',
    bn: 'যাত্রার তারিখে বা তার পরে এটি সম্পন্ন করা যাবে।'
  },
  package_not_available: {
    en: 'That package is not on sale.',
    bn: 'সেই প্যাকেজটি বিক্রির জন্য নেই।'
  },
  cannot_book_own_package: {
    en: 'You cannot book your own package.',
    bn: 'আপনি নিজের প্যাকেজ বুক করতে পারবেন না।'
  },
  category_not_package: {
    en: 'Pilgrimage packages need a package-type category.',
    bn: 'হজ/উমরাহ প্যাকেজের জন্য প্যাকেজ-ধরনের ক্যাটাগরি প্রয়োজন।'
  },

  // ── §13 Retainers ─────────────────────────────────────────────────────
  plan_not_found: {
    en: 'We could not find that plan.',
    bn: 'সেই প্ল্যানটি খুঁজে পাওয়া যায়নি।'
  },
  cannot_subscribe_own_plan: {
    en: 'You cannot subscribe to your own plan.',
    bn: 'আপনি নিজের প্ল্যানে সাবস্ক্রাইব করতে পারবেন না।'
  },
  not_renewable: {
    en: 'This retainer cannot be renewed right now.',
    bn: 'এই রিটেইনারটি এখন নবায়ন করা যাবে না।'
  },

  // ── §14 / §15 Messaging & notifications ───────────────────────────────
  thread_not_found: {
    en: 'We could not find that conversation.',
    bn: 'সেই কথোপকথনটি খুঁজে পাওয়া যায়নি।'
  },
  message_not_found: {
    en: 'We could not find that message.',
    bn: 'সেই বার্তাটি খুঁজে পাওয়া যায়নি।'
  },
  notification_not_found: {
    en: 'We could not find that notification.',
    bn: 'সেই নোটিফিকেশনটি খুঁজে পাওয়া যায়নি।'
  },

  // ── §16 Support tickets ───────────────────────────────────────────────
  ticket_not_found: {
    en: 'We could not find that ticket.',
    bn: 'সেই টিকিটটি খুঁজে পাওয়া যায়নি।'
  },
  ticket_closed: {
    en: 'This ticket is closed. Reopen it to add a reply.',
    bn: 'এই টিকিটটি বন্ধ। উত্তর দিতে এটি পুনরায় খুলুন।'
  },
  retainer_not_active: {
    en: 'That retainer is not active.',
    bn: 'সেই রিটেইনারটি সক্রিয় নয়।'
  },
  not_retainer_owner: {
    en: 'That retainer belongs to someone else.',
    bn: 'সেই রিটেইনারটি অন্য কারো।'
  },

  // ── §17 Moderation ────────────────────────────────────────────────────
  report_not_found: {
    en: 'We could not find that report.',
    bn: 'সেই রিপোর্টটি খুঁজে পাওয়া যায়নি।'
  },
  report_already_open: {
    en: 'You already have an open report on this — it is being reviewed.',
    bn: 'এটি নিয়ে আপনার একটি রিপোর্ট ইতিমধ্যে পর্যালোচনাধীন আছে।'
  },
  report_already_decided: {
    en: 'This report has already been decided.',
    bn: 'এই রিপোর্টের সিদ্ধান্ত ইতিমধ্যে নেওয়া হয়েছে।'
  },
  action_required: {
    en: 'Pick an action, or dismiss the report instead.',
    bn: 'একটি পদক্ষেপ বাছুন, অথবা রিপোর্টটি বাতিল করুন।'
  },
  action_subject_mismatch: {
    en: 'That action does not apply to this kind of report.',
    bn: 'এই ধরনের রিপোর্টে সেই পদক্ষেপটি প্রযোজ্য নয়।'
  },
  action_not_applicable: {
    en: 'The subject is gone, or the action has already been enforced.',
    bn: 'বিষয়টি আর নেই, অথবা পদক্ষেপটি ইতিমধ্যে নেওয়া হয়েছে।'
  },

  // ── §18 Reviews ───────────────────────────────────────────────────────
  review_not_found: {
    en: 'We could not find that review.',
    bn: 'সেই রিভিউটি খুঁজে পাওয়া যায়নি।'
  },
  review_locked: {
    en: 'This review can no longer be edited — the expert has replied to it.',
    bn: 'এই রিভিউটি আর সম্পাদনা করা যাবে না — বিশেষজ্ঞ উত্তর দিয়েছেন।'
  },
  review_hidden: {
    en: 'This review was removed by moderation.',
    bn: 'এই রিভিউটি মডারেশনের মাধ্যমে সরানো হয়েছে।'
  },
  review_window_closed: {
    en: 'The 60-day review window for this engagement has closed.',
    bn: 'এই সেবার ৬০ দিনের রিভিউ সময়সীমা শেষ হয়েছে।'
  },
  already_reviewed: {
    en: 'You have already reviewed this.',
    bn: 'আপনি ইতিমধ্যে এটির রিভিউ দিয়েছেন।'
  },
  engagement_not_reviewable: {
    en: 'You can review this once it is finished.',
    bn: 'এটি শেষ হলে রিভিউ দিতে পারবেন।'
  },
  not_your_engagement: {
    en: 'You can only review your own completed engagements.',
    bn: 'আপনি কেবল নিজের সম্পন্ন সেবার রিভিউ দিতে পারবেন।'
  },

  // ── §19 Clinical ──────────────────────────────────────────────────────
  note_not_found: {
    en: 'We could not find that note.',
    bn: 'সেই নোটটি খুঁজে পাওয়া যায়নি।'
  },
  not_clinical_booking: {
    en: 'Prescriptions are only available on clinical consultations.',
    bn: 'প্রেসক্রিপশন কেবল ক্লিনিক্যাল পরামর্শে পাওয়া যায়।'
  },
  prescription_not_found: {
    en: 'We could not find that prescription.',
    bn: 'সেই প্রেসক্রিপশনটি খুঁজে পাওয়া যায়নি।'
  },
  prescription_issued: {
    en: 'An issued prescription is permanent. Issue a correction that supersedes it.',
    bn: 'ইস্যু করা প্রেসক্রিপশন স্থায়ী। সংশোধনের জন্য নতুন একটি ইস্যু করুন।'
  },
  invalid_supersedes: {
    en: 'The prescription being corrected must be an issued one on this booking.',
    bn: 'সংশোধনযোগ্য প্রেসক্রিপশনটি এই বুকিংয়ের ইস্যু করা প্রেসক্রিপশন হতে হবে।'
  },
  file_too_large: {
    en: 'That file is too large.',
    bn: 'ফাইলটি অনেক বড়।'
  },

  // ── §20 / §21 Recordings & meetings ───────────────────────────────────
  recording_not_found: {
    en: 'We could not find that recording.',
    bn: 'সেই রেকর্ডিংটি খুঁজে পাওয়া যায়নি।'
  },
  recording_not_available: {
    en: 'This recording is not available to play yet.',
    bn: 'এই রেকর্ডিংটি এখনো চালানোর জন্য প্রস্তুত নয়।'
  },
  playback_unavailable: {
    en: 'Playback is temporarily unavailable. Please try again later.',
    bn: 'প্লেব্যাক সাময়িকভাবে অনুপলব্ধ। পরে আবার চেষ্টা করুন।'
  },
  invalid_signature: {
    en: 'The request signature could not be verified.',
    bn: 'অনুরোধের স্বাক্ষর যাচাই করা যায়নি।'
  },
  meetings_not_configured: {
    en: 'Video meetings are not configured on this deployment.',
    bn: 'এই ডিপ্লয়মেন্টে ভিডিও মিটিং কনফিগার করা নেই।'
  },

  // ── Generic ───────────────────────────────────────────────────────────
  forbidden: {
    en: 'You do not have permission to do that.',
    bn: 'এই কাজটি করার অনুমতি আপনার নেই।'
  },
  not_found: {
    en: 'We could not find what you were looking for.',
    bn: 'আপনি যা খুঁজছেন তা পাওয়া যায়নি।'
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
