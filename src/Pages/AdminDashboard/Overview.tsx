import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Edit3, Eye, Filter, Lock, Search, Trash2, Unlock } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { User } from '../../types';
import type { AdminOutletContext, AdminUserWithStats } from './AdminOutletContext';

 
export const OverviewTab: React.FC = () => {
  const {
    usersWithStats,
    loading,
    setViewingUser,
    handleOpenEditUser,
    handleToggleUserStatus,
    handleDeleteUser,
  } = useOutletContext<AdminOutletContext>();

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'EXPERT' | 'ADMIN'>('ALL');

  const filteredUsers = useMemo<AdminUserWithStats[]>(() => {
    return usersWithStats.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch)) ||
        (u.expertProfile?.officialLicenseNumber &&
          u.expertProfile.officialLicenseNumber.toLowerCase().includes(userSearch.toLowerCase()));

      const matchesRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'ADMIN'
            ? u.roles.includes('ADMIN') || u.roles.includes('SUPER_ADMIN')
            : roleFilter === 'EXPERT'
              ? u.roles.includes('EXPERT')
              : !u.roles.includes('EXPERT') &&
                !u.roles.includes('ADMIN') &&
                !u.roles.includes('SUPER_ADMIN');

      return matchesSearch && matchesRole;
    });
  }, [usersWithStats, userSearch, roleFilter]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold  flex items-center gap-2">
            <span>All Users &amp; Specialist Tracking Control</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
              Live Database
            </span>
          </h3>
          <p className="text-xs text-gray-500">
            Track, view activity, edit permissions, change roles, and lock/unlock accounts in real-time.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, license..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Clients Only</option>
              <option value="EXPERT">Experts Only</option>
              <option value="ADMIN">Admins Only</option>
            </select>
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No Users Match"
          description="Adjust your search or role filter to see more accounts."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Assigned Roles</th>
                <th className="p-4">Activity / Spending</th>
                <th className="p-4">Escrow In Vault</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isSuperAdmin =
                  user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN');
                const isExpert = user.roles.includes('EXPERT');

                return (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={
                          user.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold  block text-sm">{user.name}</span>
                        <span className="text-[11px] text-gray-500 font-mono">{user.email}</span>
                        {user.phone && (
                          <span className="text-[10px] text-gray-400 block">{user.phone}</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {isSuperAdmin ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[10px]">
                            Super Admin
                          </span>
                        ) : isExpert ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold text-[10px]">
                            {user.expertProfile?.profession || 'Verified Expert'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            Client User
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-medium text-gray-700">
                      <div className="space-y-0.5">
                        <div>
                          <span className="text-gray-400">Total Spent: </span>
                          <span className="font-bold text-gray-900">
                            ৳{user.totalSpentBDT.toLocaleString()}
                          </span>
                        </div>
                        {isExpert && (
                          <div>
                            <span className="text-gray-400">Earned: </span>
                            <span className="font-bold text-emerald-600">
                              ৳{user.totalEarnedBDT.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400">
                          {user.appointmentsCount} Appointments • {user.projectsCount} Projects
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-emerald-700 font-mono">
                        ৳{user.escrowHeldBDT.toLocaleString()}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        {user.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors"
                          title="View Complete User Dossier & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditUser(user as User)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer transition-colors"
                          title="Edit Role & Permissions"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleUserStatus(user as User)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            user.status === 'active'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          }`}
                          title={user.status === 'active' ? 'Lock Account' : 'Unlock Account'}
                        >
                          {user.status === 'active' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
