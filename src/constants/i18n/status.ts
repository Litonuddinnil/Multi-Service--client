import type { Locale } from './types';

/**
 * Status labels used across bookings, projects, payments, and admin lists.
 * Keys follow the `status_*` convention so they can be looked up
 * programmatically from a status string.
 */
export const statusDictionary: Record<Locale, Record<string, string>> = {
  en: {
    status_draft: 'Draft',
    status_pending: 'Pending',
    status_submitted: 'Under Review',
    status_approved: 'Approved',
    status_active: 'Active',
    status_in_progress: 'In Progress',
    status_confirmed: 'Confirmed',
    status_completed: 'Completed',
    status_requested_unpaid: 'Awaiting Payment',
    status_requested_paid: 'Awaiting Expert',
    status_declined: 'Declined',
    status_cancelled: 'Cancelled',
    status_expired: 'Expired',
    status_no_show: 'No Show',
    status_suspended: 'Suspended',
    status_held_in_escrow: 'Held in Escrow',
    status_released: 'Released to Expert',
  },
  bn: {
    status_draft: 'ড্রাফট',
    status_pending: 'অপেক্ষমান',
    status_submitted: 'রিভিউতে রয়েছে',
    status_approved: 'অনুমোদিত',
    status_active: 'সক্রিয়',
    status_in_progress: 'চলমান',
    status_confirmed: 'নিশ্চিতকৃত',
    status_completed: 'সম্পন্ন',
    status_requested_unpaid: 'পেমেন্টের অপেক্ষায়',
    status_requested_paid: 'বিশেষজ্ঞের সম্মতির অপেক্ষায়',
    status_declined: 'প্রত্যাখ্যাত',
    status_cancelled: 'বাতিলকৃত',
    status_expired: 'মেয়াদোত্তীর্ণ',
    status_no_show: 'অনুপস্থিত',
    status_suspended: 'স্থগিত',
    status_held_in_escrow: 'এসক্রোতে সুরক্ষিত',
    status_released: 'বিশেষজ্ঞকে প্রদানকৃত',
  },
};
