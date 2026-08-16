import type { Locale } from './types';
import { brandDictionary } from './brand';
import { homepageDictionary } from './homepage';
import { statusDictionary } from './status';
import { ctaDictionary } from './cta';
import { commonDictionary } from './common';
import { checkoutDictionary } from './checkout';

export type { Locale };

/**
 * Merge all per-domain dictionaries into one shape for the legacy
 * `DICTIONARY[locale][key]` lookup used by `LanguageProvider.t()`.
 *
 * Adding a new dictionary domain:
 *   1. Create `i18n/<domain>.ts` exporting `Record<Locale, Record<string, string>>`
 *   2. Import it here and spread it into both locale branches.
 */
export const DICTIONARY: Record<Locale, Record<string, string>> = {
  en: {
    ...brandDictionary.en,
    ...homepageDictionary.en,
    ...statusDictionary.en,
    ...ctaDictionary.en,
    ...commonDictionary.en,
    ...checkoutDictionary.en,
  },
  bn: {
    ...brandDictionary.bn,
    ...homepageDictionary.bn,
    ...statusDictionary.bn,
    ...ctaDictionary.bn,
    ...commonDictionary.bn,
    ...checkoutDictionary.bn,
  },
};

/**
 * Convenience helper: union of every translation key in `DICTIONARY.en`.
 * Matches the previous `keyof typeof DICTIONARY.en` type, so existing
 * `t('foo')` calls across the codebase continue to type-check.
 */
export type TranslationKey = keyof typeof DICTIONARY.en;
