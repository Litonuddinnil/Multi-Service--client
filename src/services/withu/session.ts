/**
 * Session lifecycle — the few operations that own the stored token pair.
 *
 * The rest of `withuApi` is stateless: it reads whatever token
 * `StorageService` holds. These helpers are the only ones that WRITE it, so
 * there is one place to look when asking "how did this browser end up signed
 * in as that account?".
 */
import { StorageService } from '../storage';
import { auth } from './api';
import { ApiError } from './http';
import type { AuthMe, TokenPair } from './types';

function store(tokens: TokenPair): TokenPair {
  StorageService.setSession(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export const session = {
  /** True when this browser holds an access token the server might accept. */
  isAuthenticated: (): boolean => !!StorageService.getAuthToken(),

  /**
   * Password sign-in.
   *
   * Two 403s are NOT failures the user can do nothing about, and the caller
   * should branch on them rather than showing a generic error:
   *   • `mfa_required`      -> collect a code and call `loginWithMfa`
   *   • `email_not_verified` -> offer `auth.resendVerification`
   */
  login: async (email: string, password: string): Promise<TokenPair> =>
    store(await auth.login({ email, password })),

  loginWithMfa: async (email: string, password: string, code: string): Promise<TokenPair> =>
    store(await auth.loginMfa({ email, password, code })),

  /** Confirming the emailed OTP IS the first sign-in — it returns a pair. */
  verifyEmail: async (email: string, code: string): Promise<TokenPair> =>
    store(await auth.verifyEmail({ email, code })),

  loginWithGoogle: async (payload: { idToken?: string; email?: string; name?: string; avatarUrl?: string }): Promise<TokenPair> =>
    store(await auth.oauthGoogle(payload)),

  /**
   * Re-read the signed-in identity.
   *
   * Call this after expert approval or any role change: role and permission
   * gates read the TOKEN's claims, so a stale token keeps 403ing until it is
   * refreshed, and `/auth/me` is how the UI learns what it now carries.
   */
  me: (): Promise<AuthMe> => auth.me(),

  /**
   * Pull a fresh access token, e.g. right after expert approval.
   * Returns false when the session is gone and a full re-login is needed.
   */
  refresh: async (): Promise<boolean> => {
    const refreshToken = StorageService.getRefreshToken();
    if (!refreshToken) return false;
    try {
      store(await auth.refresh(refreshToken));
      return true;
    } catch {
      StorageService.clearSession();
      return false;
    }
  },

  /**
   * Sign out. The server call is best-effort — a network failure must not
   * leave the browser holding a token it believes is still live, so the
   * local session is cleared either way.
   */
  logout: async (): Promise<void> => {
    const refreshToken = StorageService.getRefreshToken();
    if (refreshToken) {
      try {
        await auth.logout(refreshToken);
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
      }
    }
    StorageService.clearSession();
    StorageService.setCurrentUser(null);
  },
};
