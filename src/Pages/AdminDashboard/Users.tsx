import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ban, CheckCircle2, Pencil, Search, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../hooks/useLanguage';
import type { AdminOutletContext, AdminUserWithStats } from './AdminOutletContext';

type RoleFilter = 'ALL' | 'CUSTOMER' | 'EXPERT' | 'ADMIN';

/** The single role shown per account, highest privilege first. */
function primaryRole(user: AdminUserWithStats): 'ADMIN' | 'EXPERT' | 'CUSTOMER' {
  if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) return 'ADMIN';
  if (user.roles.includes('EXPERT')) return 'EXPERT';
  return 'CUSTOMER';
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  EXPERT: 'bg-blue-50 text-blue-700 border-blue-200',
  CUSTOMER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  locked: 'bg-amber-50 text-amber-800 border-amber-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
};

/**
 * Admin → Accounts.
 *
 * Lists every registered account so an admin can change a role or suspend
 * someone. The shell already owned the edit modal and every mutator; there was
 * simply no screen listing the users to open it from.
 */
export const AdminUsersTab: React.FC = () => {
  const {
    usersWithStats,
    loading,
    handleOpenEditUser,
    handleToggleUserStatus,
    handleDeleteUser,
    setViewingUser,
  } = useOutletContext<AdminOutletContext>();

  const { locale, formatBDT } = useLanguage();
  const bn = locale === 'bn';

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const counts = useMemo(() => {
    const c = { ALL: usersWithStats.length, CUSTOMER: 0, EXPERT: 0, ADMIN: 0 };
    usersWithStats.forEach(u => {
      c[primaryRole(u)] += 1;
    });
    return c;
  }, [usersWithStats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return usersWithStats
      .filter(u => roleFilter === 'ALL' || primaryRole(u) === roleFilter)
      .filter(
        u =>
          !q ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q),
      )
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [usersWithStats, roleFilter, query]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  const filterTabs: { id: RoleFilter; label: string }[] = [
    { id: 'ALL', label: bn ? 'সব' : 'All' },
    { id: 'CUSTOMER', label: bn ? 'কাস্টমার' : 'Customers' },
    { id: 'EXPERT', label: bn ? 'এক্সপার্ট' : 'Experts' },
    { id: 'ADMIN', label: bn ? 'অ্যাডমিন' : 'Admins' },
  ];

  return (
    <div className="space-y-5">
      {/* Header + search */}
      <header className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{bn ? 'সকল অ্যাকাউন্ট' : 'All Accounts'}</h2>
              <p className="text-xs text-gray-500">
                {bn
                  ? 'রেজিস্টার করা সব ইউজার — এখান থেকে রোল ও স্ট্যাটাস পরিবর্তন করুন।'
                  : 'Every registered user. Change a role or account status from here.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600">
            {counts.ALL} {bn ? 'অ্যাকাউন্ট' : 'accounts'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={bn ? 'নাম, ইমেইল বা ফোন দিয়ে খুঁজুন' : 'Search by name, email or phone'}
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRoleFilter(t.id)}
                aria-pressed={roleFilter === t.id}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                  roleFilter === t.id
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {t.label} <span className="opacity-60">({counts[t.id]})</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={bn ? 'কোনো অ্যাকাউন্ট মেলেনি' : 'No accounts match'}
          description={
            bn
              ? 'অন্য রোল বেছে নিন বা সার্চ পরিবর্তন করুন।'
              : 'Try a different role filter or search term.'
          }
        />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-xs overflow-hidden">
          {/* Wide content scrolls inside its own container so the page never scrolls sideways. */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-bold">{bn ? 'অ্যাকাউন্ট' : 'Account'}</th>
                  <th className="px-4 py-3 font-bold">{bn ? 'রোল' : 'Role'}</th>
                  <th className="px-4 py-3 font-bold">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="px-4 py-3 font-bold text-right">{bn ? 'খরচ' : 'Spent'}</th>
                  <th className="px-4 py-3 font-bold text-right">{bn ? 'আয়' : 'Earned'}</th>
                  <th className="px-4 py-3 font-bold text-right">{bn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => {
                  const role = primaryRole(u);
                  const status = u.status || 'active';
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setViewingUser(u)}
                          className="flex items-center gap-3 text-left cursor-pointer group"
                        >
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt=""
                              loading="lazy"
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-gray-200 shrink-0"
                            />
                          ) : (
                            <span className="w-9 h-9 rounded-xl bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center shrink-0">
                              <UserRound className="w-4 h-4 text-gray-400" />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block font-bold truncate group-hover:text-purple-700">
                              {u.name}
                            </span>
                            <span className="block text-gray-500 truncate">{u.email}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-bold ${ROLE_STYLES[role]}`}
                        >
                          {role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                          {role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border font-bold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.active}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {formatBDT(u.totalSpentBDT || 0)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {formatBDT(u.totalEarnedBDT || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <IconButton
                            label={bn ? 'রোল পরিবর্তন' : 'Edit role'}
                            onClick={() => handleOpenEditUser(u)}
                            className="hover:bg-purple-50 hover:text-purple-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            label={status === 'active' ? (bn ? 'সাসপেন্ড' : 'Suspend') : (bn ? 'সক্রিয় করুন' : 'Reactivate')}
                            onClick={() => handleToggleUserStatus(u)}
                            className={
                              status === 'active'
                                ? 'hover:bg-amber-50 hover:text-amber-700'
                                : 'hover:bg-emerald-50 hover:text-emerald-700'
                            }
                          >
                            {status === 'active' ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </IconButton>
                          <IconButton
                            label={bn ? 'মুছে ফেলুন' : 'Delete'}
                            onClick={() => handleDeleteUser(u.id)}
                            className="hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const IconButton: React.FC<{
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ label, onClick, className = '', children }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`p-2 rounded-lg text-gray-500 transition-colors cursor-pointer ${className}`}
  >
    {children}
  </button>
);

export default AdminUsersTab;
