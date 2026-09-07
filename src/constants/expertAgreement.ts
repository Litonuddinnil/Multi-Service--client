import type { ConsultationMode, SessionMode, WeekDay } from '../types';

/**
 * Copy + option tables for the "Expert Verification & Initial Agreement"
 * (এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র).
 *
 * Shared by the public onboarding wizard (`Pages/BecomeExpertView`) and the
 * read-only agreement view inside the expert dashboard, so the wording the
 * expert signed is byte-identical to the wording they are shown later.
 */

export interface Bilingual {
  en: string;
  bn: string;
}

export interface DisciplineOption {
  id: string;
  label: Bilingual;
  /** Regulatory body that issues the membership number for this discipline. */
  association: string;
  /** lucide-react icon name resolved by the consumer. */
  icon:
    | 'stethoscope'
    | 'compass'
    | 'scale'
    | 'code'
    | 'plane'
    | 'moon'
    | 'graduation-cap'
    | 'landmark'
    | 'heart-handshake'
    | 'users';
}

/**
 * One card per live platform category (`server/data/categories.json`), so a
 * wizard pick always lands on a `primaryCategoryId` the rest of the system
 * recognises — the admin KYC queue's per-category document requirements,
 * the public catalogue's category filter, and commission config all key off
 * this same id. `cat-commerce` (the products/courses marketplace) is left
 * out: that's a listing surface, not a personal-consultancy discipline this
 * wizard verifies.
 *
 * IDs and bilingual names are copied verbatim from `categories.json` — do
 * not hand-roll a label here without checking that file first, or a card
 * will point at a category that doesn't exist.
 */
export const DISCIPLINES: DisciplineOption[] = [
  {
    id: 'cat-healthcare',
    label: { en: 'Health & Medical Service', bn: 'স্বাস্থ্যসেবা ও ডাক্তার পরামর্শ' },
    association: 'BMDC',
    icon: 'stethoscope',
  },
  {
    id: 'cat-engineering',
    label: { en: 'Engineering Consultancy', bn: 'ইঞ্জিনিয়ারিং সার্ভিসেস' },
    association: 'IEB',
    icon: 'compass',
  },
  {
    id: 'cat-legal',
    label: { en: 'Legal Consultancy', bn: 'আইনি ও কমপ্লায়েন্স সাপোর্ট' },
    association: 'Bangladesh Bar Council',
    icon: 'scale',
  },
  {
    id: 'cat-it-digital',
    label: { en: 'IT & Digital Services', bn: 'আইটি ও ডিজিটাল সার্ভিসেস' },
    association: 'BASIS',
    icon: 'code',
  },
  {
    id: 'cat-hajj-umrah',
    label: { en: 'Hajj & Umrah Agency', bn: 'হজ্ব ও ওমরাহ সার্ভিসেস' },
    association: 'Ministry of Religious Affairs',
    icon: 'plane',
  },
  {
    id: 'cat-ruqyah-tibbe',
    label: { en: 'Ruqyah Consultancy', bn: 'তিব্বে নববী ও শারঈ রুকইয়াহ' },
    association: 'Islamic Degree (Takhassus)',
    icon: 'moon',
  },
  {
    id: 'cat-career-education',
    label: { en: 'Career, Education & Parenting', bn: 'ক্যারিয়ার, উচ্চশিক্ষা ও প্যারেন্টিং' },
    association: 'University Degree',
    icon: 'graduation-cap',
  },
  {
    id: 'cat-financial-advisory',
    label: { en: 'Financial & Business Advisory', bn: 'আর্থিক ও ব্যবসায়িক পরামর্শ' },
    association: 'ICAB / ICMAB',
    icon: 'landmark',
  },
  {
    id: 'cat-religious-social',
    label: { en: 'Religious & Social Services', bn: 'ধর্মীয় ও সামাজিক সেবা' },
    association: 'Community Service Certificate',
    icon: 'heart-handshake',
  },
  {
    id: 'cat-family-consultancy',
    label: { en: 'Family Consultancy', bn: 'পারিবারিক পরামর্শ' },
    association: 'Family Counseling Certificate',
    icon: 'users',
  },
];

export const WEEK_DAYS: { id: WeekDay; label: Bilingual }[] = [
  { id: 'SAT', label: { en: 'Sat', bn: 'শনি' } },
  { id: 'SUN', label: { en: 'Sun', bn: 'রবি' } },
  { id: 'MON', label: { en: 'Mon', bn: 'সোম' } },
  { id: 'TUE', label: { en: 'Tue', bn: 'মঙ্গল' } },
  { id: 'WED', label: { en: 'Wed', bn: 'বুধ' } },
  { id: 'THU', label: { en: 'Thu', bn: 'বৃহঃ' } },
  { id: 'FRI', label: { en: 'Fri', bn: 'শুক্র' } },
];

export const SESSION_MODES: { id: SessionMode; label: Bilingual }[] = [
  { id: 'ONLINE', label: { en: 'Online', bn: 'অনলাইন' } },
  { id: 'IN_PERSON', label: { en: 'In-person', bn: 'সরাসরি' } },
  { id: 'BOTH', label: { en: 'Both', bn: 'উভয়' } },
];

/** The four consultation channels shown on the public profile. */
export const CONSULTATION_MODES: { id: ConsultationMode; label: Bilingual }[] = [
  { id: 'CHAT', label: { en: 'Chat', bn: 'চ্যাট' } },
  { id: 'CALL', label: { en: 'Call', bn: 'কল' } },
  { id: 'VIDEO', label: { en: 'Video', bn: 'ভিডিও' } },
  { id: 'IN_PERSON', label: { en: 'In-person', bn: 'সরাসরি' } },
];

/** Derived so the signed agreement and the public card can never contradict each other. */
export function sessionModeFromConsultationModes(modes: ConsultationMode[]): SessionMode {
  const inPerson = modes.includes('IN_PERSON');
  const remote = modes.some(m => m !== 'IN_PERSON');
  if (inPerson && remote) return 'BOTH';
  if (inPerson) return 'IN_PERSON';
  return 'ONLINE';
}

export const SESSION_DURATIONS = [15, 20, 30, 45, 60, 90];

/** Keys match `ExpertAgreement['consents']`. */
export type ConsentKey =
  | 'informationTrue'
  | 'publicityUse'
  | 'noGuaranteedOutcome'
  | 'confidentiality'
  | 'preliminaryTerms';

export const DECLARATION_CLAUSES: { key: ConsentKey; text: Bilingual }[] = [
  {
    key: 'informationTrue',
    text: {
      en: 'All information given above is true and complete, and withU may verify it with the relevant institution or authority.',
      bn: 'উপরে প্রদত্ত সকল তথ্য সত্য ও সম্পূর্ণ, এবং withU সংশ্লিষ্ট প্রতিষ্ঠান বা কর্তৃপক্ষের কাছে তা যাচাই করতে পারবে।',
    },
  },
  {
    key: 'publicityUse',
    text: {
      en: 'I permit withU to use my name, photograph, designation and credentials on its website, social media and promotional materials.',
      bn: 'আমি withU-কে তার ওয়েবসাইট, সোশ্যাল মিডিয়া ও প্রচারণামূলক উপকরণে আমার নাম, ছবি, পদবি ও যোগ্যতা ব্যবহারের অনুমতি দিচ্ছি।',
    },
  },
  {
    key: 'noGuaranteedOutcome',
    text: {
      en: 'I will not make any guaranteed-outcome claim (medical, legal, academic or financial) in my name on any withU platform.',
      bn: 'আমি withU-এর কোনো প্ল্যাটফর্মে আমার নামে নিশ্চিত ফলাফলের (চিকিৎসা, আইনি, একাডেমিক বা আর্থিক) কোনো দাবি করব না।',
    },
  },
  {
    key: 'confidentiality',
    text: {
      en: "I will keep all client information confidential and follow withU's code of conduct for experts.",
      bn: 'আমি সকল ক্লায়েন্টের তথ্য গোপন রাখব এবং এক্সপার্টদের জন্য withU-এর আচরণবিধি মেনে চলব।',
    },
  },
  {
    key: 'preliminaryTerms',
    text: {
      en: "This is a preliminary agreement. A detailed service contract will follow after document verification. Either party may withdraw with 7 days' written notice.",
      bn: 'এটি একটি প্রাথমিক সম্মতিপত্র। নথি যাচাইয়ের পর বিস্তারিত সেবা চুক্তি সম্পাদিত হবে। উভয় পক্ষ ৭ দিনের লিখিত নোটিশে চুক্তি প্রত্যাহার করতে পারবে।',
    },
  },
];

/** Keys match `ExpertAgreement['attachments']`. */
export type AttachmentKey = 'cv' | 'photo' | 'nidCopy' | 'certificates';

export const ATTACHMENTS: {
  key: AttachmentKey;
  label: Bilingual;
  /** Document `type` written onto the resulting `ExpertDocument`. */
  documentType: string;
  accept: string;
  required: boolean;
}[] = [
  {
    key: 'cv',
    label: { en: 'CV', bn: 'সিভি' },
    documentType: 'CV',
    accept: 'application/pdf,.doc,.docx',
    required: true,
  },
  {
    key: 'photo',
    label: { en: 'Photo', bn: 'ছবি' },
    documentType: 'PHOTO',
    accept: 'image/jpeg,image/png',
    required: true,
  },
  {
    key: 'nidCopy',
    label: { en: 'NID copy', bn: 'এনআইডি কপি' },
    documentType: 'NID',
    accept: 'application/pdf,image/jpeg,image/png',
    required: true,
  },
  {
    key: 'certificates',
    label: { en: 'Certificates / Licence', bn: 'সনদ / লাইসেন্স' },
    documentType: 'LICENSE',
    accept: 'application/pdf,image/jpeg,image/png',
    required: true,
  },
];

/** Max upload size accepted by the wizard, in bytes. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Mask an identity/account number for storage and display: keep the first and
 * last few characters, star out the middle. Short values are fully starred so
 * a 4-digit PIN-like value can never leak.
 */
export const maskNumber = (raw: string, lead = 3, tail = 3): string => {
  const value = raw.replace(/\s+/g, '');
  if (value.length <= lead + tail) return '*'.repeat(Math.max(value.length, 4));
  return `${value.slice(0, lead)}${'*'.repeat(value.length - lead - tail)}${value.slice(-tail)}`;
};

/** `SessionMode` → the label pair shown on the agreement summary. */
export const sessionModeLabel = (mode: SessionMode): Bilingual =>
  SESSION_MODES.find(m => m.id === mode)?.label ?? { en: mode, bn: mode };
