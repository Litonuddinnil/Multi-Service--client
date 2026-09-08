const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

function normalize(raw: string): string {
  if (!raw) return '';
  let base = raw;
  if (base.endsWith('/')) base = base.slice(0, -1);
  return base;
}

const NORMALIZED_HTTP_BASE = normalize(RAW_BASE);

// An empty base sends every call to the page's own origin. That is correct in local dev,
// where Vite runs inside Express, but on a static host it makes each request 404 against
// the CDN with nothing in the console to explain why. Log once on module load, then log
// again on the first API call so the developer sees it next to the failing request.
let warnedAboutMissingBase = false;
function warnAboutMissingBase() {
  if (warnedAboutMissingBase) return;
  warnedAboutMissingBase = true;
  if (typeof window === 'undefined') return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;
  // eslint-disable-next-line no-console
  console.error(
    `[withU] VITE_API_BASE_URL is not set, so API requests go to ${window.location.origin}, ` +
      'which serves only the static client. Set it to the backend URL in your host\'s ' +
      'environment variables and redeploy. Every request will return 404 until this is fixed.',
  );
}

if (
  !NORMALIZED_HTTP_BASE &&
  typeof window !== 'undefined' &&
  !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
) {
  warnAboutMissingBase();
}

export function apiBase(): string {
  if (!NORMALIZED_HTTP_BASE) warnAboutMissingBase();
  return NORMALIZED_HTTP_BASE;
}

export function wsBase(): string {
  if (!NORMALIZED_HTTP_BASE) {
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}`;
    }
    return '';
  }
  return NORMALIZED_HTTP_BASE.replace(/^http/, 'ws');
}

export function buildApiUrl(path: string): string {
  const prefix = path.startsWith('/') ? '' : '/';
  return `${NORMALIZED_HTTP_BASE}${prefix}${path}`;
}
