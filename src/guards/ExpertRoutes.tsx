import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, FileSignature, ShieldAlert, ShieldOff } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { ApiService } from '../services/api';
import type { ExpertProfile } from '../types';

/**
 * Expert workspace guard.
 *
 * Holding the EXPERT role is not enough to enter the portal — the provider's
 * application has to have cleared compliance. The gate runs in the order the
 * onboarding flow does:
 *
 *   signed out                 → sign in
 *   no application on file     → complete the verification agreement
 *   SUBMITTED / UNDER_REVIEW   → pending screen, no portal access
 *   REJECTED                   → reason + re-submit
 *   SUSPENDED                  → contact compliance
 *   APPROVED                   → portal
 *
 * The role alone is still honoured for accounts that predate the agreement
 * (seeded demo experts), so an approved provider without an application record
 * is not locked out of their own workspace.
 */
const ExpertRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setProfile(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    (async () => {
      let found: ExpertProfile | null = null;
      try {
        found = await ApiService.getExpertByUserId(user.id);
      } catch {
        found = null;
      }
      if (cancelled) return;
      setProfile(found);

      // The session's access token predates approval and still lacks the
      // EXPERT role/permission claims — this guard already lets an APPROVED
      // applicant through below on `profile.status` alone, but every
      // `/api/expert/**` call the workspace makes on mount would 403 against
      // the stale token. Await the rotation here, before `checking` flips
      // false and the workspace renders, so its very first fetch already
      // carries the new claims instead of a round of 403s / demo fallback.
      if (found?.status === 'APPROVED' && !user.roles.includes('EXPERT')) {
        await refreshUser();
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <Gate
        icon={ShieldOff}
        tone="rose"
        title="Expert workspace"
        body="Sign in with your provider account to open the workspace."
        actionLabel="Sign in"
        actionTo="/login"
      />
    );
  }

  if (checking) {
    return (
      <div
        className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6"
        aria-busy="true"
      >
        <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-800/40" />
      </div>
    );
  }

  const hasExpertRole = user.roles.includes('EXPERT');

  // No application on file: an approved legacy/seeded provider keeps access,
  // anyone else is sent to the agreement first.
  if (!profile) {
    if (hasExpertRole) return <>{children}</>;
    return (
      <Gate
        icon={FileSignature}
        tone="cyan"
        title="Complete your verification"
        body="Submit the Expert Verification & Initial Agreement. Compliance reviews credentials within 12-24 hours, and your workspace opens as soon as it is approved."
        actionLabel="Start expert verification"
        actionTo="/become-expert"
      />
    );
  }

  if (profile.status === 'SUBMITTED' || profile.status === 'UNDER_REVIEW') {
    return (
      <Gate
        icon={Clock3}
        tone="amber"
        title="Verification in progress"
        body={`Your agreement is with the compliance team${
          profile.verificationBody ? `, who are confirming your ${profile.verificationBody} registration` : ''
        }. You will be notified as soon as your provider portal is unlocked.`}
        actionLabel="Review my agreement"
        actionTo="/become-expert"
      />
    );
  }

  if (profile.status === 'REJECTED') {
    return (
      <Gate
        icon={ShieldAlert}
        tone="rose"
        title="Application declined"
        body={
          profile.rejectionReason ||
          'Your application did not clear verification. Correct the details and submit again.'
        }
        actionLabel="Re-submit application"
        actionTo="/become-expert"
      />
    );
  }

  if (profile.status === 'SUSPENDED') {
    return (
      <Gate
        icon={ShieldOff}
        tone="rose"
        title="Profile suspended"
        body={
          profile.suspensionReason ||
          'Your provider profile is suspended. Contact withU compliance to restore access.'
        }
        actionLabel="Back to home"
        actionTo="/"
      />
    );
  }

  if (profile.status === 'DRAFT') {
    return (
      <Gate
        icon={FileSignature}
        tone="cyan"
        title="Finish your application"
        body="Your verification agreement was started but never submitted. Complete it to open your workspace."
        actionLabel="Finish application"
        actionTo="/become-expert"
      />
    );
  }

  // APPROVED
  return <>{children}</>;
};

const TONES: Record<'rose' | 'amber' | 'cyan', { icon: string; action: string }> = {
  rose: {
    icon: 'text-rose-400',
    action: 'bg-rose-500/10 text-rose-300 ring-rose-500/30 hover:bg-rose-500/20',
  },
  amber: {
    icon: 'text-amber-400',
    action: 'bg-amber-500/10 text-amber-300 ring-amber-500/30 hover:bg-amber-500/20',
  },
  cyan: {
    icon: 'text-cyan-400',
    action: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/30 hover:bg-cyan-500/20',
  },
};

const Gate: React.FC<{
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tone: 'rose' | 'amber' | 'cyan';
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}> = ({ icon: Icon, tone, title, body, actionLabel, actionTo }) => (
  <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
    <Icon className={`h-12 w-12 ${TONES[tone].icon}`} aria-hidden />
    <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
    <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    <Link
      to={actionTo}
      className={`mt-2 rounded-md px-4 py-2 text-sm font-medium ring-1 transition ${TONES[tone].action}`}
    >
      {actionLabel}
    </Link>
  </div>
);

export default ExpertRoutes;
