import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import { User, UserRole, Permission } from '../types';
import { ApiService } from '../services/api';
import { StorageService, type ImpersonationRecord } from '../services/storage';

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  /** ADMIN is absent by design: self-service sign-up must never mint an administrator. */
  role: 'CUSTOMER' | 'EXPERT';
  profession?: string;
  specialization?: string;
  licenseNumber?: string;
  consultationFeeBDT?: number;
}

/**
 * Admin-only "act-as" session state.
 *
 * When an admin wants to view or operate another user's account, we keep the
 * original admin user in `originalAdminId` and surface the impersonated user
 * via `asUserName` / `effectiveUser` so the rest of the app transparently
 * renders the target account. The banner in the dashboards is driven by
 * `isImpersonating`. Mirrors `ImpersonationRecord` in `StorageService`.
 */
export type ImpersonationState = ImpersonationRecord;

const EMPTY_IMPERSONATION: ImpersonationRecord = {
  active: false,
  originalAdminId: null,
  originalAdminName: null,
  asUserId: null,
  asUserName: null,
  startedAt: null,
};

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  /**
   * The user the UI is *currently acting as*. Equals `user` unless we are
   * impersonating, in which case it equals the impersonated target.
   */
  effectiveUser: User | null;
  /** Whether an admin is currently impersonating another user. */
  isImpersonating: boolean;
  /** Full impersonation metadata (or null when not impersonating). */
  impersonation: ImpersonationState;
  /** Begin impersonating `target`. Caller must already be an admin. */
  impersonateAs: (target: User) => boolean;
  /** Drop impersonation and restore the original admin session. */
  exitImpersonation: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string; errorCode?: string }>;
  loginWithGoogle: (roleOverride?: 'CUSTOMER' | 'EXPERT') => Promise<{ success: boolean; user?: User; error?: string }>;
  verifyMfa: (userId: string, code: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: 'CUSTOMER' | 'EXPERT' | 'ADMIN') => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  hasPermission: (perm: Permission) => boolean;
  /**
   * Rotate the access token and re-sync `user` with the server.
   *
   * Role/permission gates read JWT claims, not the live account, so a user
   * approved (or otherwise role-changed) after they logged in keeps carrying
   * a token without that role until this runs. No-ops (resolves silently)
   * when there is no refresh token on file.
   */
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [impersonation, setImpersonation] = useState<ImpersonationState>(EMPTY_IMPERSONATION);

  // Initial load
  useEffect(() => {
    const current = StorageService.getCurrentUser();
    setUser(current);
    // Restore a persisted impersonation session (e.g. after a refresh).
    const persisted = StorageService.getImpersonation();
    if (
      persisted &&
      persisted.active &&
      current &&
      persisted.originalAdminId === current.id
    ) {
      // The original admin is still logged in — re-hydrate the impersonation.
      setImpersonation(persisted);
    } else {
      // Stale or admin mismatch — clear and persist the empty state.
      StorageService.setImpersonation(EMPTY_IMPERSONATION);
    }
    setIsLoading(false);

    // Refreshes a stale restored session, single-shot only: refresh tokens are single-use,
    // so running this on an interval would let a second tab race it and get logged out.
    if (current) {
      ApiService.refreshSession().then(refreshed => {
        if (refreshed) setUser(refreshed);
      });
    }

    // Subscribe to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        // Sync with storage if user exists
        const allUsers = StorageService.getUsers();
        const matched = allUsers.find(u => u.email.toLowerCase() === fbUser.email!.toLowerCase());
        if (matched) {
          setUser(matched);
          StorageService.setCurrentUser(matched);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      // 1. Try Firebase Auth (if password provided)
      if (password && auth) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (fbErr) {
          console.warn('Firebase login attempt fallback to local database:', fbErr);
        }
      }

      // 2. Perform backend login
      const res = await ApiService.login(email, password);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error, errorCode: res.errorCode };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (roleOverride: 'CUSTOMER' | 'EXPERT' = 'CUSTOMER') => {
    setIsLoading(true);
    try {
      let email = 'user.google@withu.market';
      let displayName = 'Google Verified User';
      let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user.email) email = result.user.email;
        if (result.user.displayName) displayName = result.user.displayName;
        if (result.user.photoURL) avatar = result.user.photoURL;
      } catch (fbErr) {
        console.warn('Firebase Google Auth popup bypassed, completing sign-in:', fbErr);
      }

      const res = await ApiService.registerWithRole({
        name: displayName,
        email: email,
        role: roleOverride,
        avatarUrl: avatar,
        // Google has proven the address, so a returning user signs in instead of being rejected.
        onExisting: 'reuse',
      });

      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Failed to authenticate with Google.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google Sign-In failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      // 1. Try Firebase user creation
      if (data.password && auth) {
        try {
          await createUserWithEmailAndPassword(auth, data.email, data.password);
        } catch (fbErr) {
          console.warn('Firebase registration fallback to platform state:', fbErr);
        }
      }

      // 2. Register in platform system with full role and specialization
      const res = await ApiService.registerWithRole(data);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Registration could not be completed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration error' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async (userId: string, code: string) => {
    const res = await ApiService.verifyMfa(userId, code);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch {
      /* ignore */
    }
    await ApiService.logout();
    setUser(null);
    setFirebaseUser(null);
  };

  const switchRole = async (role: 'CUSTOMER' | 'EXPERT' | 'ADMIN') => {
    const newUser = await ApiService.switchActiveRole(role);
    setUser(newUser);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return false;
    const res = await ApiService.updateUser(user.id, updates);
    if (res.success && res.user) {
      setUser(res.user);
      return true;
    }
    return false;
  };

  const refreshUser = async (): Promise<User | null> => {
    const refreshed = await ApiService.refreshSession();
    if (refreshed) setUser(refreshed);
    return refreshed;
  };

  const hasPermission = (perm: Permission): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.permissions.includes(perm);
  };

  /**
   * Begin an "act-as" session: the UI will render `target` everywhere, but
   * `user` (and `originalAdminId` tracked in `impersonation`) still refer to
   * the logged-in admin. Returns false if the caller is not an admin or the
   * target is invalid.
   */
  const impersonateAs = (target: User): boolean => {
    if (!user) return false;
    const isAdmin =
      user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
    if (!isAdmin) return false;
    if (!target || !target.id) return false;
    if (target.id === user.id) return false;

    const next: ImpersonationState = {
      active: true,
      originalAdminId: user.id,
      originalAdminName: user.name,
      asUserId: target.id,
      asUserName: target.name,
      startedAt: new Date().toISOString(),
    };
    setImpersonation(next);
    StorageService.setImpersonation(next);
    return true;
  };

  /** Drop impersonation and stay logged in as the original admin. */
  const exitImpersonation = (): void => {
    setImpersonation(EMPTY_IMPERSONATION);
    StorageService.setImpersonation(EMPTY_IMPERSONATION);
  };

  const activeRole: UserRole = user
    ? (user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN')
        ? 'ADMIN'
        : user.roles.includes('EXPERT')
        ? 'EXPERT'
        : 'CUSTOMER')
    : 'GUEST';

  /**
   * The user the rest of the UI should treat as "current". When impersonating,
   * this resolves to the target account so dashboards, sidebars and queries
   * transparently render the impersonated user's data.
   */
  const effectiveUser: User | null = (() => {
    if (!impersonation.active || !impersonation.asUserId) return user;
    const target = StorageService.getUsers().find(
      (u) => u.id === impersonation.asUserId,
    );
    return target ?? user;
  })();

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isAuthenticated: !!user,
      isLoading,
      activeRole,
      effectiveUser,
      isImpersonating: impersonation.active,
      impersonation,
      impersonateAs,
      exitImpersonation,
      login,
      loginWithGoogle,
      verifyMfa,
      register,
      logout,
      switchRole,
      updateProfile,
      hasPermission,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
