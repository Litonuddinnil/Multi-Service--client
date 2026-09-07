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
// the CDN with nothing in the console to explain why. Say so once, loudly.
if (
  !NORMALIZED_HTTP_BASE &&
  typeof window !== 'undefined' &&
  !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
) {
  console.error(
    `[withU] VITE_API_BASE_URL is not set, so API requests go to ${window.location.origin}, ` +
      'which serves only the static client. Set it to the backend URL in your host\'s ' +
      'environment variables and redeploy.',
  );
}

export function apiBase(): string {
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
