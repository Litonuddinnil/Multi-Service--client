import type { Locale } from './types';

/**
 * Home / landing page hero, quick-link band, filter rail and "Book Now"
 * surface copy.
 */
export const homepageDictionary: Record<Locale, Record<string, string>> = {
  en: {
    heroTitle: "Verified Expert Hub",
    heroSubtitle:
       "Premium Service. Trusted Place.",
    quickLinks: 'Quick Links',
    BookNow: 'Book Now',
    filterTitle: 'Filters',
    bookNow: 'Book Now',
  },
  bn: {
    heroTitle: 'বিশেষজ্ঞ পরামর্শ, প্রকৌশল ও স্বাস্থ্�সেবা',
    heroSubtitle:
      'বাংলাদেশের যাচাইকৃত মাল্টি-সার্ভিস প্ল্যাটফর্ম — ডাক্তার, ইঞ্জিনিয়ার ও হজ প্যাকেজ বুক করুন এসক্রো সুরক্ষায়।',
    quickLinks: 'দ্রুত �িঙ্ক',
    BookNow: 'বুক করুন',
    filterTitle: 'ফিল্টার',
    bookNow: 'বুক করুন',
  },
};
