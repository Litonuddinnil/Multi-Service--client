import type { Locale } from './types';

/**
 * Reusable CTAs (buttons, links), escrow trust copy, and the live
 * video-room surfaces. Anything that drives an action lives here.
 */
export const ctaDictionary: Record<Locale, Record<string, string>> = {
  en: {
    // CTAs & Buttons
    bookSession: 'Book a Session',
    requestQuote: 'Request a Quote',
    viewDepartures: 'View Departures',
    subscribePlan: 'Subscribe to Plan',
    payNow: 'Pay with Escrow',
    joinLiveSession: 'Join Live Consultation',
    reschedule: 'Reschedule',
    cancelBooking: 'Cancel Booking',
    approveMilestone: 'Approve & Release Funds',
    leaveReview: 'Submit Review',
    confirmAction: 'Confirm',
    cancelAction: 'Dismiss',
    saveChanges: 'Save Changes',
    downloadReceipt: 'Download Receipt',
    printManifest: 'Print Visa Manifest',

    // Escrow & Trust copy
    escrowNoteSession:
      'Your payment is held safely in escrow and only released after your session completes.',
    escrowNoteProject:
      'Your payment is held safely and released to the expert only when you approve this milestone.',
    escrowNotePilgrimage:
      'Traveler funds remain in regulatory escrow until departure verification.',
    doctorJoinNotice:
      'Join the video room. The official duration is recorded by the server once both parties connect.',

    // Video Room CTA
    videoRoom: 'Video Room',
    videoRoomShort: 'Video',
    videoRoomLive: 'Live Video Room',
    joinVideoRoom: 'Join Video Room',
    videoRoomHint:
      'Open the encrypted HD video room — duration is recorded by the server.',
    details: 'Details',
    inPerson: 'In-Person',
  },
  bn: {
    // CTAs & Buttons
    bookSession: 'সেশন বুক করুন',
    requestQuote: 'কোটেশন চান',
    viewDepartures: 'ফ্�াইট সূচী দেখুন',
    subscribePlan: 'প্ল্যানে সাবস্ক্রাইব করুন',
    payNow: 'এসক্রো পেমেন্ট করুন',
    joinLiveSession: 'সরাসরি ভিডিও কনসালটে�নে যোগ দিন',
    reschedule: 'সময় পুনর্�ির্ধারণ',
    cancelBooking: 'বুকিং বাতি� করুন',
    approveMilestone: 'অনুমোদন � ফান্ড রিলিজ',
    leaveReview: 'রিভিউ দিন',
    confirmAction: 'নিশ্চিত করুন',
    cancelAction: 'ফিরে যান',
    saveChanges: 'সংরক্ষণ করুন',
    downloadReceipt: 'রশিদ ডা�নলোড করুন',
    printManifest: 'ভিসা ম্যানিফেস্ট প্রিন্ট করুন',

    // Escrow & Trust copy
    escrowNoteSession:
      'আপনার পেমেন্ট এসক্রোতে সুরক্ষিত থাকবে এবং সেশন সম্পন্ন হওয়ার পরেই কেবল বিশেষজ্ঞকে প্রদান করা হবে।',
    escrowNoteProject:
      'আপনার পেমেন্ট নিরাপদে সংরক্ষিত রয়েছে এবং আপনি সন্তুষ্ট হয়ে মাইলস্টোন অনুমোদন করলেই কেবল বিশেষজ্ঞ পাবেন।',
    escrowNotePilgrimage:
      '�াত্রার পূর্ব পর্যন্ত ট্রাভে�ারদের অর্থ নিয়ন্ত্রিত এসক্রো ফান্ডে সম্পূর্ণ নিরাপদ।',
    doctorJoinNotice:
      'ভিডিও রুমে প্রবেশ করুন। উভয় পক্ষ যুক্ত হওয়ার পর সার্ভারে আসল সময় গণনা শুরু হবে।',

    // Video Room CTA
    videoRoom: 'ভিডিও রুম',
    videoRoomShort: 'ভিডিও',
    videoRoomLive: 'লাইভ ভিডিও রুম',
    joinVideoRoom: 'ভিডিও রুমে যোগ দিন',
    videoRoomHint:
      'এনক্রিপ্টেড HD ভি�িও রুমে প্রবেশ করুন — সময়কাল সার্ভারে রেকর্ড হবে।',
    details: 'বি�্তারিত',
    inPerson: 'সরাসরি',
  },
};
