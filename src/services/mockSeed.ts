/**
 * Fake-data seed loader.
 *
 * The demo catalogue (experts, services, packages, orders, threads, …) lives in
 * `public/mock/*.json` and is fetched over HTTP at boot rather than compiled
 * into the bundle. That keeps the fixtures editable without a rebuild: change a
 * JSON file, refresh, and the new data is picked up.
 *
 * `StorageService` reads these synchronously, so `loadMockSeeds()` must resolve
 * before the app renders — see `src/main.tsx`.
 */

export type SeedKey =
  | 'categories'
  | 'users'
  | 'experts'
  | 'services'
  | 'pilgrimagePackages'
  | 'retainerPlans'
  | 'commerceProducts'
  | 'cmsBlogs'
  | 'cmsFaqs'
  | 'bookings'
  | 'consultations'
  | 'projects'
  | 'orders'
  | 'ledger'
  | 'reviews'
  | 'notifications'
  | 'threads'
  | 'messages';

const SEED_FILES: Record<SeedKey, string> = {
  categories: 'categories.json',
  users: 'users.json',
  experts: 'experts.json',
  services: 'services.json',
  pilgrimagePackages: 'pilgrimage-packages.json',
  retainerPlans: 'retainer-plans.json',
  commerceProducts: 'commerce-products.json',
  cmsBlogs: 'cms-blogs.json',
  cmsFaqs: 'cms-faqs.json',
  bookings: 'bookings.json',
  consultations: 'consultations.json',
  projects: 'projects.json',
  orders: 'orders.json',
  ledger: 'ledger.json',
  reviews: 'reviews.json',
  notifications: 'notifications.json',
  threads: 'threads.json',
  messages: 'messages.json',
};

/**
 * `{{now+7200000}}` / `{{now-1800000}}` — a timestamp expressed as a millisecond
 * offset from page load. Fixtures use these for anything that has to stay
 * relative to today (the upcoming consultation slot, "paid 30 minutes ago"),
 * because a frozen ISO string would rot into the past and break countdowns and
 * the join-consultation window.
 */
const TIME_TOKEN = /^\{\{now([+-])(\d+)\}\}$/;

function rehydrate(value: unknown, now: number): unknown {
  if (Array.isArray(value)) return value.map((v) => rehydrate(v, now));

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rehydrate(v, now);
    }
    return out;
  }

  if (typeof value === 'string') {
    const match = TIME_TOKEN.exec(value);
    if (match) {
      const offset = Number(match[2]) * (match[1] === '-' ? -1 : 1);
      return new Date(now + offset).toISOString();
    }
  }

  return value;
}

const registry = new Map<SeedKey, unknown>();
/** Hash of each fixture's raw text, taken before time tokens are resolved. */
const rawHashes = new Map<SeedKey, string>();
let loadPromise: Promise<void> | null = null;

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function seedUrl(file: string): string {
  // BASE_URL keeps this correct when the SPA is served from a sub-path.
  return `${import.meta.env.BASE_URL}mock/${file}`;
}

async function fetchSeed(key: SeedKey, file: string, now: number): Promise<void> {
  try {
    const res = await fetch(seedUrl(file), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    rawHashes.set(key, hashText(text));
    registry.set(key, rehydrate(JSON.parse(text), now));
  } catch (err) {
    // An empty collection keeps the app bootable; the console line is what tells
    // you a fixture is missing, rather than a silently blank page.
    console.error(`[mockSeed] failed to load public/mock/${file} —`, err);
    rawHashes.set(key, 'missing');
    registry.set(key, []);
  }
}

/** Fetches every fixture once. Never rejects: a broken file degrades to `[]`. */
export function loadMockSeeds(): Promise<void> {
  if (!loadPromise) {
    const now = Date.now();
    loadPromise = Promise.all(
      (Object.entries(SEED_FILES) as Array<[SeedKey, string]>).map(([key, file]) =>
        fetchSeed(key, file, now)
      )
    ).then(() => undefined);
  }
  return loadPromise;
}

/**
 * Synchronous accessor for a loaded fixture. Returns a structural clone so a
 * caller mutating the array cannot corrupt the shared seed for the next reader.
 */
export function seed<T>(key: SeedKey): T {
  const value = registry.get(key);
  if (value === undefined) {
    console.error(`[mockSeed] "${key}" read before loadMockSeeds() resolved.`);
    return [] as unknown as T;
  }
  return structuredClone(value) as T;
}

/**
 * Fingerprint of the currently loaded fixtures. `StorageService` compares this
 * against the copy it stamped into localStorage so that editing a JSON file
 * actually re-seeds on the next refresh instead of losing to a stale cache.
 */
export function seedSignature(): string {
  // Built from the raw file text, not the rehydrated objects — otherwise the
  // `{{now±ms}}` tokens would resolve differently on every load and the
  // signature would never match.
  const keys = (Object.keys(SEED_FILES) as SeedKey[]).sort();
  return hashText(keys.map((k) => `${k}:${rawHashes.get(k) ?? '-'}`).join('|'));
}
