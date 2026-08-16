import React from 'react';
import { ShieldCheck } from 'lucide-react';

export type DashboardRoleBadge = 'Client' | 'Expert' | 'Admin';

export interface DashboardHeaderProps {
  /** Display name shown next to the avatar. */
  name: string;
  email?: string;
  avatarUrl?: string;
  /** Short caption ("Member since Jan 2026"). */
  memberSince?: string;
  /** Role label rendered above the name in caps. */
  roleBadge: DashboardRoleBadge;
  /** Tailwind colour class for the role badge (e.g. text-[#34C759]). */
  roleAccent: string;
  /** Tailwind ring colour class for the avatar. */
  avatarAccent: string;
  /** Right-side escrow-protection widget. Pass `null` to hide it. */
  escrowNote?: string;
  /** Right-side CTA buttons (e.g. "Book again", "Verify expert"). */
  actions?: React.ReactNode;
}

/**
 * Shared dashboard page header used by every role's `index.tsx`. Keeps the
 * avatar / name / role badge / escrow widget trio consistent across the three
 * dashboards while still letting each role theme its accent colour.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  name,
  email,
  avatarUrl,
  memberSince,
  roleBadge,
  roleAccent,
  avatarAccent,
  escrowNote = 'All consultation & project funds secured',
  actions
}) => {
  return (
    <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <img
          src={
            avatarUrl ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
          }
          alt={name}
          className={`w-16 h-16 rounded-full object-cover ring-4 ${avatarAccent}`}
        />
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${roleAccent}`}>
            {roleBadge} Account
          </span>
          <h1 className="text-2xl font-black text-white">{name}</h1>
          {email && (
            <p className="text-xs text-gray-300">
              {email}
              {memberSince ? ` • Member since ${memberSince}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white/10 border border-white/15 p-4 rounded-2xl text-xs space-y-2 w-full md:w-auto flex flex-col items-start md:items-end">
        <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-[#34C759]" />
          Active Escrow Protection
        </div>
        <p className="text-gray-300 text-[11px]">{escrowNote}</p>
        {actions}
      </div>
    </div>
  );
};

export default DashboardHeader;