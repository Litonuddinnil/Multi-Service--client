import React from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export type DashboardRole = 'customer' | 'expert' | 'admin';

export interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Optional badge text rendered as a small pill on the right. */
  badge?: string | number;
  /** Tailwind ring colour used when the item is active. Defaults to role colour. */
  accent?: 'emerald' | 'blue' | 'purple';
  /** When true, only the exact `to` matches. Useful for the index tab. */
  end?: boolean;
}

export interface RoleSidebarProps {
  role: DashboardRole;
  items: SidebarItem[];
  /** Optional override for the section header title. */
  title?: string;
  className?: string;
}

/**
 * Role-aware vertical navigation used inside each dashboard's `<index/>` shell.
 * Active route is driven by `NavLink`'s `isActive` callback so deep links
 * (e.g. `/portal/customer/orders`) still highlight the matching tab.
 */
export const RoleSidebar: React.FC<RoleSidebarProps> = ({
  role,
  items,
  title,
  className = '',
}) => {
  const accentText: Record<DashboardRole, string> = {
    customer: 'text-[#34C759]',
    expert: 'text-blue-400',
    admin: 'text-purple-400'
  };
  const accentRing: Record<DashboardRole, string> = {
    customer: 'ring-[#34C759]/60 bg-emerald-500/10',
    expert: 'ring-blue-400/60 bg-blue-500/10',
    admin: 'ring-purple-400/60 bg-purple-500/10'
  };
  const accentDot: Record<DashboardRole, string> = {
    customer: 'bg-[#34C759]',
    expert: 'bg-blue-400',
    admin: 'bg-purple-400'
  };

  const labelText: Record<DashboardRole, string> = {
    customer: 'Client Dashboard',
    expert: 'Expert Dashboard',
    admin: 'Admin Dashboard'
  };

  return (
    <aside
      className={`relative z-0 w-full lg:w-64 lg:sticky lg:top-24 self-start rounded-2xl border border-white/10 bg-[#0B1220]/80 p-3 space-y-1 ${className}`}
    >
      <div className="px-2 pb-2 mb-1 border-b border-white/10 flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${accentDot[role]} animate-pulse`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentText[role]}`}>
          {title ?? labelText[role]}
        </span>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? item.to === '.'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                isActive
                  ? `${accentRing[role]} text-white border-transparent ring-1`
                  : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${accentText[role]} bg-white/5`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </aside>
  );
};

export default RoleSidebar;