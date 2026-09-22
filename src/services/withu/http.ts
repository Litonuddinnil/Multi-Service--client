/**
 * The HTTP core behind `withuApi`.
 *
 * Everything the API_REFERENCE conventions demand lives here so no call site
 * has to remember it:
 *
 *   • `Authorization: Bearer <accessToken>` on every non-public request.
 *   • 401 -> rotate the refresh token once, replay the request; if the
 *     refresh also fails, clear the session and surface the error.
 *   • RFC-7807 ProblemDetail decoded into a typed `ApiError` carrying the
 *     stable `code` — call sites switch on that, never on `detail`.
 *   • 204 responses resolve to `null` rather than blowing up in `res.json()`.
 *
 * The single-flight refresh matters: a dashboard fires six requests at once
 * and they all 401 together. Without it, six concurrent `/auth/refresh`
 * calls race, five of them present an already-rotated token, and the server
 * correctly reads that as theft and revokes every session the user has.
 */
import { apiBase } from '../../config/apiBase';
import { StorageService } from '../storage';
import { getErrorMessage, type ApiProblemDetail } from '../../constants/errorCodes';

/** A decoded ProblemDetail, thrown by every `withuApi` call that fails. */
export class ApiError extends Error {
  readonly status: number;
  /** Stable machine-readable code — switch on this. */
  readonly code: string;
  /** Field -> message, present on validation failures. */
  readonly errors?: Record<string, string>;
  readonly problem?: ApiProblemDetail;
  /** Seconds to wait before retrying, on 429s. */
  readonly retryAfterSeconds?: number;

  constructor(status: number, code: string, detail: string, extra: Partial<ApiProblemDetail> & { retryAfterSeconds?: number } = {}) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = extra.errors;
    this.retryAfterSeconds = extra.retryAfterSeconds;
    this.problem = extra as ApiProblemDetail;
  }

  /** The localised, user-facing sentence for this error. */
  localized(locale: 'en' | 'bn' = 'en'): string {
    return getErrorMessage(this.code, locale);
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Query-string parameters; null/undefined entries are dropped. */
  query?: Record<string, QueryValue>;
  /** JSON body. Mutually exclusive with `form`. */
  body?: unknown;
  /** `multipart/form-data` body — the browser sets the boundary itself. */
  form?: FormData;
  /** Skip the Authorization header (public endpoints). */
  anonymous?: boolean;
  /** `Accept-Language`, which the category endpoints honour. */
  locale?: string;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${apiBase()}/api${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * The in-flight refresh, shared by every 401 that lands while it runs.
 * Cleared as soon as it settles so a later 401 starts a fresh one.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function rotateRefreshToken(): Promise<boolean> {
  const refreshToken = StorageService.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      // `refresh_token_reused` means the server has just revoked EVERY
      // session for this user as a theft response. There is nothing to
      // retry — the only correct next step is a full re-login.
      StorageService.clearSession();
      return false;
    }
    const tokens = await res.json();
    StorageService.setSession(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rotateRefreshToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function decodeError(res: Response): Promise<ApiError> {
  let problem: any = null;
  try {
    problem = await res.json();
  } catch {
    /* not JSON — fall through to a generic code */
  }
  const code =
    typeof problem?.code === 'string'
      ? problem.code
      : res.status === 400
        ? 'validation_failed'
        : res.status === 403
          ? 'forbidden'
          : res.status === 404
            ? 'not_found'
            : 'unknown_error';
  const detail = problem?.detail ?? res.statusText ?? 'Request failed.';
  return new ApiError(res.status, code, detail, problem ?? {});
}

async function send(method: string, path: string, opts: RequestOptions, retrying = false): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!opts.anonymous) {
    const token = StorageService.getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (opts.locale) headers['Accept-Language'] = opts.locale;

  let body: BodyInit | undefined;
  if (opts.form) {
    // Deliberately no Content-Type: the browser has to set the multipart
    // boundary, and naming the type by hand strips it.
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, signal: opts.signal });
  } catch (err) {
    if ((err as any)?.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Could not reach the server.');
  }

  // Retry exactly once. A second 401 after a successful refresh is a real
  // authorisation failure, not an expired token, and looping on it would
  // hammer the server.
  if (res.status === 401 && !retrying && !opts.anonymous && StorageService.getRefreshToken()) {
    if (await refreshSession()) return send(method, path, opts, true);
  }

  return res;
}

/** Perform a request and decode the JSON body (or `null` on a 204). */
export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(method, path, opts);
  if (!res.ok) throw await decodeError(res);
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null as T;
  }
  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // A JSON endpoint that answered with HTML almost always means the request
    // reached a static host or an SPA fallback rather than the API.
    throw new ApiError(res.status, 'unknown_error', 'The server returned a response that was not JSON.');
  }
}

/** Fetch binary content (attachments, credential files, photos) as a Blob. */
export async function requestBlob(path: string, opts: RequestOptions = {}): Promise<Blob> {
  const res = await send('GET', path, opts);
  if (!res.ok) throw await decodeError(res);
  return res.blob();
}

/** Fetch a `text/csv` export as text, for the admin download screens. */
export async function requestText(path: string, opts: RequestOptions = {}): Promise<string> {
  const res = await send('GET', path, opts);
  if (!res.ok) throw await decodeError(res);
  return res.text();
}

/**
 * Download a file the browser will save, using an authorised fetch.
 *
 * The CSV exports sit behind `payment:manage`, so a plain `<a download>`
 * cannot reach them — the browser would send no Authorization header.
 */
export async function downloadFile(path: string, filename: string, opts: RequestOptions = {}): Promise<void> {
  const blob = await requestBlob(path, opts);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const get = <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts);
export const post = <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts);
export const put = <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts);
export const del = <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts);

/** Wrap a single file into the `file` part every upload endpoint expects. */
export function filePart(file: File | Blob, extra: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.append('file', file);
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return form;
}
