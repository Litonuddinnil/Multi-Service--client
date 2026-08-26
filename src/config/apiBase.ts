const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

function normalize(raw: string): string {
  if (!raw) return '';
  let base = raw;
  if (base.endsWith('/')) base = base.slice(0, -1);
  return base;
}

const NORMALIZED_HTTP_BASE = normalize(RAW_BASE);

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
