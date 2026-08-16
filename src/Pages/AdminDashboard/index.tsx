import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Database,
  DollarSign,
  Download,
  Edit3,
  Eye,
  HardDrive,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';
import { PdfService } from '../../services/pdfService';
import { ThreeCanvas3D } from '../../components/common/ThreeCanvas3D';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/Toast';
import { RoleSidebar, SidebarItem } from '../../components/layout/RoleSidebar';
import type {
  AdminDbStatus,
  AdminOutletContext,
  AdminUserWithStats,
} from './AdminOutletContext';
import { User, ExpertProfile } from '../../types';

 
export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { locale } = useLanguage();

  // Aggregate data.
  const [usersWithStats, setUsersWithStats] = useState<AdminUserWithStats[]>([]);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<AdminDbStatus | null>(null);
  const [isSyncingMongo, setIsSyncingMongo] = useState(false);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal / selection state.
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUserWithStats | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'EXPERT' | 'ADMIN',
    status: 'active' as 'active' | 'suspended' | 'locked',
  });

  const { showToast: showNotice } = useToast();

  // ---- Confirmation dialog state (F0: replaces window.prompt / window.confirm) --
  const [pendingApproveOrderId, setPendingApproveOrderId] = useState<string | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [pendingRejectOrderId, setPendingRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);

  /** Single source of truth refresh. Used on mount + after every mutation. */
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const enrichedUsers = await ApiService.getAllUsersWithStats();
      setUsersWithStats(enrichedUsers as AdminUserWithStats[]);
      setExperts(StorageService.getExperts());
      setCommissions(StorageService.getCommissions());
      setBookings(StorageService.getBookings());
      setProjects(StorageService.getProjects());
      setOrders(StorageService.getOrders());
      try {
        const status = await ApiService.getDatabaseStatus();
        setDbStatus(status as AdminDbStatus);
      } catch {
        // Keep existing status on transient MongoDB errors.
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // ---- Order approval actions -------------------------------------------------
  const handleApproveOrder = useCallback(
    async (orderId: string) => {
      setPendingApproveOrderId(orderId);
      setApproveNote('Customer verified, gateway reference matched.');
    },
    [],
  );

  const submitApproveOrder = useCallback(async () => {
    if (!pendingApproveOrderId) return;
    const orderId = pendingApproveOrderId;
    try {
      await ApiService.approveOrder(orderId, {
        adminId: user?.id || 'user-admin-1',
        note: approveNote,
      });
      const updated = StorageService.getOrders().map((o: any) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: 'PAID',
              escrowStatus: 'HELD_IN_ESCROW',
              reviewedAt: new Date().toISOString(),
              reviewerNote: approveNote,
            }
          : o,
      );
      StorageService.saveOrders(updated);
      setOrders(updated);
      showNotice(
        locale === 'bn'
          ? 'অর্ডার অনুমোদিত — গ্রাহক ভিডিও রুমে প্রবেশ করতে পারবে।'
          : 'Order approved. Customer can now join the video room.',
        'success',
      );
    } catch (e: any) {
      showNotice(e.message || 'Approval failed', 'error');
    } finally {
      setPendingApproveOrderId(null);
      setApproveNote('');
    }
  }, [pendingApproveOrderId, approveNote, locale, showNotice, user?.id]);

  const handleRejectOrder = useCallback(
    (orderId: string) => {
      setPendingRejectOrderId(orderId);
      setRejectReason('Gateway reference could not be verified.');
    },
    [],
  );

  const submitRejectOrder = useCallback(async () => {
    if (!pendingRejectOrderId || !rejectReason.trim()) return;
    const orderId = pendingRejectOrderId;
    try {
      await ApiService.rejectOrder(orderId, {
        adminId: user?.id || 'user-admin-1',
        reason: rejectReason.trim(),
      });
      const updated = StorageService.getOrders().map((o: any) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: 'CANCELLED',
              escrowStatus: 'REFUND_INITIATED',
              rejectionReason: rejectReason.trim(),
              reviewedAt: new Date().toISOString(),
            }
          : o,
      );
      StorageService.saveOrders(updated);
      setOrders(updated);
      showNotice(
        locale === 'bn'
          ? 'অর্ডার প্রত্যাখ্যাত। রিফান্ড প্রক্রিয়া শুরু হয়েছে।'
          : 'Order rejected. Refund process initiated.',
        'success',
      );
    } catch (e: any) {
      showNotice(e.message || 'Rejection failed', 'error');
    } finally {
      setPendingRejectOrderId(null);
      setRejectReason('');
    }
  }, [pendingRejectOrderId, rejectReason, locale, showNotice, user?.id]);

  // ---- MongoDB / dynamic JSON actions ----------------------------------------
  const handleSyncMongo = useCallback(async () => {
    setIsSyncingMongo(true);
    try {
      const res = await ApiService.syncMongoDB();
      if (res.success) {
        showNotice(
          locale === 'bn'
            ? 'MongoDB ক্লাউডে সমস্ত ডেটা সফলভাবে সিঙ্ক হয়েছে।'
            : 'Dynamic JSON database synchronized with MongoDB.',
        );
      } else {
        showNotice(res.error || 'MongoDB sync error');
      }
      await loadAdminData();
    } catch (e: any) {
      showNotice(e.message || 'Sync failed');
    } finally {
      setIsSyncingMongo(false);
    }
  }, [locale, showNotice, loadAdminData]);

  const handleSeedDatabase = useCallback(async () => {
    setConfirmSeedOpen(true);
  }, []);

  const confirmSeedDatabase = useCallback(async () => {
    setConfirmSeedOpen(false);
    setIsSeedingDb(true);
    try {
      await ApiService.seedDatabase();
      await loadAdminData();
      showNotice(
        locale === 'bn'
          ? 'ডায়নামিক ডেটাবেস সফলভাবে রিসেট ও সিড করা হয়েছে।'
          : 'Database successfully reseeded.',
        'success',
      );
    } finally {
      setIsSeedingDb(false);
    }
  }, [locale, showNotice, loadAdminData]);

  const handleExportJsonBackup = useCallback(() => {
    if (!dbStatus) return;
    const backupObj = {
      timestamp: new Date().toISOString(),
      databaseType: dbStatus.databaseType,
      users: StorageService.getUsers(),
      experts: StorageService.getExperts(),
      services: StorageService.getServices(),
      bookings: StorageService.getBookings(),
      projects: StorageService.getProjects(),
      orders: StorageService.getOrders(),
      commissions: StorageService.getCommissions(),
    };
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `withU_database_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice(
      locale === 'bn'
        ? 'সম্পূর্ণ ডেটাবেস ব্যাকআপ JSON ফাইল ডাউনলোড হয়েছে।'
        : 'Database backup JSON exported successfully.',
    );
  }, [dbStatus, locale, showNotice]);

  // ---- User CRUD actions ------------------------------------------------------
  const handleOpenEditUser = useCallback((targetUser: User) => {
    setEditingUser(targetUser);
    const mainRole: 'CUSTOMER' | 'EXPERT' | 'ADMIN' =
      targetUser.roles.includes('ADMIN') || targetUser.roles.includes('SUPER_ADMIN')
        ? 'ADMIN'
        : targetUser.roles.includes('EXPERT')
          ? 'EXPERT'
          : 'CUSTOMER';

    setEditForm({
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone || '',
      role: mainRole,
      status: targetUser.status as 'active' | 'suspended' | 'locked',
    });
  }, []);

  const handleSaveUserEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;

      const newRoles =
        editForm.role === 'ADMIN'
          ? (['ADMIN', 'SUPER_ADMIN', 'CUSTOMER'] as any)
          : editForm.role === 'EXPERT'
            ? (['EXPERT', 'CUSTOMER'] as any)
            : (['CUSTOMER'] as any);

      await ApiService.updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        roles: newRoles,
        status: editForm.status,
      });

      setEditingUser(null);
      await loadAdminData();
      showNotice(
        locale === 'bn'
          ? 'ব্যবহারকারীর তথ্য সফলভাবে আপডেট হয়েছে।'
          : 'User profile and permissions updated.',
      );
    },
    [editingUser, editForm, locale, showNotice, loadAdminData],
  );

  const handleToggleUserStatus = useCallback(
    async (targetUser: User) => {
      const nextStatus = targetUser.status === 'active' ? 'locked' : 'active';
      await ApiService.updateUser(targetUser.id, { status: nextStatus });
      await loadAdminData();
      showNotice(`User status updated to ${nextStatus.toUpperCase()}`);
    },
    [showNotice, loadAdminData],
  );

  const handleDeleteUser = useCallback(
    (userId: string) => {
      setPendingDeleteUserId(userId);
    },
    [],
  );

  const confirmDeleteUser = useCallback(async () => {
    if (!pendingDeleteUserId) return;
    const userId = pendingDeleteUserId;
    setPendingDeleteUserId(null);
    try {
      await ApiService.deleteUser(userId);
      await loadAdminData();
      showNotice('User record deleted.', 'success');
    } catch (e: any) {
      showNotice(e.message || 'Delete failed', 'error');
    }
  }, [pendingDeleteUserId, showNotice, loadAdminData]);

  // ---- Expert approval actions ------------------------------------------------
  const handleApproveExpert = useCallback(
    (expertId: string) => {
      StorageService.updateExpertStatus(expertId, 'APPROVED');
      loadAdminData();
      setSelectedExpert(null);
      showNotice('Expert credentials verified & approved.');
    },
    [showNotice, loadAdminData],
  );

  const handleRejectExpert = useCallback(
    (expertId: string) => {
      StorageService.updateExpertStatus(expertId, 'REJECTED');
      loadAdminData();
      setSelectedExpert(null);
      showNotice('Expert verification application declined.');
    },
    [showNotice, loadAdminData],
  );

  const handleUpdateCommission = useCallback(
    (categoryId: string, ratePercent: number) => {
      const updated = commissions.map((c) =>
        c.categoryId === categoryId ? { ...c, platformFeePercent: ratePercent } : c,
      );
      setCommissions(updated);
      StorageService.saveCommissions(updated);
    },
    [commissions],
  );

  // ---- Derived metrics for the KPI tiles -------------------------------------
  const pendingVerificationCount = useMemo(
    () => experts.filter((e) => e.status === 'PENDING').length,
    [experts],
  );
  const totalEscrowInVault = useMemo(
    () => usersWithStats.reduce((sum, u) => sum + u.escrowHeldBDT, 0),
    [usersWithStats],
  );

  // ---- Outlet context (memoised so tab memo doesn't churn) -------------------
  const reload = useCallback(async () => {
    await loadAdminData();
  }, [loadAdminData]);

  const outletCtx = useMemo<AdminOutletContext>(
    () => ({
      usersWithStats,
      experts,
      commissions,
      bookings,
      projects,
      orders,
      dbStatus,
      loading,
      reload,
      handleApproveOrder,
      handleRejectOrder,
      handleSyncMongo,
      handleExportJsonBackup,
      handleSeedDatabase,
      handleUpdateCommission,
      handleApproveExpert,
      handleRejectExpert,
      handleOpenEditUser,
      handleSaveUserEdit,
      handleToggleUserStatus,
      handleDeleteUser,
      viewingUser,
      setViewingUser,
      editingUser,
      setEditingUser,
      editForm,
      setEditForm,
      selectedExpert,
      setSelectedExpert,
      showNotice,
    }),
    [
      usersWithStats,
      experts,
      commissions,
      bookings,
      projects,
      orders,
      dbStatus,
      loading,
      reload,
      handleApproveOrder,
      handleRejectOrder,
      handleSyncMongo,
      handleExportJsonBackup,
      handleSeedDatabase,
      handleUpdateCommission,
      handleApproveExpert,
      handleRejectExpert,
      handleOpenEditUser,
      handleSaveUserEdit,
      handleToggleUserStatus,
      handleDeleteUser,
      viewingUser,
      editingUser,
      editForm,
      selectedExpert,
      showNotice,
    ],
  );

  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      { label: 'Operating Cockpit', to: '/admin/overview', icon: Sparkles, accent: 'purple', end: true },
      { label: 'Order Approvals', to: '/admin/bookings', icon: Database, badge: orders.filter((o: any) => o.paymentStatus === 'PENDING_ADMIN_REVIEW').length, accent: 'purple' },
      { label: 'KYC / Provider Queue', to: '/admin/kyc', icon: ShieldCheck, badge: pendingVerificationCount, accent: 'purple' },
      { label: 'Services & Commission', to: '/admin/content', icon: Award, accent: 'purple' },
      { label: 'MongoDB & JSON Storage', to: '/admin/database', icon: HardDrive, accent: 'purple' },
    ],
    [orders, pendingVerificationCount],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Total Tracked Users</span>
            <span className="text-xl font-black text-gray-900">
              {usersWithStats.length} Accounts
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Verified Experts</span>
            <span className="text-xl font-black text-gray-900">
              {experts.length} Specialists
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Escrow in Multi-Sig</span>
            <span className="text-xl font-black text-gray-900">
              ৳{totalEscrowInVault.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">
              Pending Verifications
            </span>
            <span className="text-xl font-black text-amber-600">
              {pendingVerificationCount} Applications
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar + Outlet */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RoleSidebar role="admin" title="Admin Control" items={sidebarItems} />
        </aside>

        <main className="space-y-6 min-w-0">
          <Outlet context={outletCtx} />
        </main>
      </div>

      {/* ========== MODALS (shell-level so they overlay sidebar + main) ========== */}

      {/* MODAL 1: Viewing User Complete Dossier */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    viewingUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={viewingUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{viewingUser.name}</h3>
                  <p className="text-xs text-gray-500">
                    {viewingUser.email} • {viewingUser.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Role</span>
                <span className="font-bold text-gray-900">{viewingUser.roles.join(', ')}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 uppercase font-bold text-[10px] block">
                  Total Spent
                </span>
                <span className="font-bold text-gray-900">
                  ৳{viewingUser.totalSpentBDT.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 uppercase font-bold text-[10px] block">
                  Escrow In Vault
                </span>
                <span className="font-bold text-emerald-600">
                  ৳{viewingUser.escrowHeldBDT.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 uppercase font-bold text-[10px] block">
                  Status
                </span>
                <span className="font-bold text-gray-900 uppercase">{viewingUser.status}</span>
              </div>
            </div>

            {viewingUser.expertProfile && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-950">
                <span className="font-bold text-blue-900 uppercase text-[11px] block">
                  Expert Professional Credentials
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Profession:</strong> {viewingUser.expertProfile.profession}
                  </div>
                  <div>
                    <strong>License:</strong> {viewingUser.expertProfile.officialLicenseNumber}
                  </div>
                  <div>
                    <strong>Board:</strong> {viewingUser.expertProfile.verificationBody}
                  </div>
                  <div>
                    <strong>Rating:</strong> ⭐ {viewingUser.expertProfile.rating} (
                    {viewingUser.expertProfile.reviewCount} reviews)
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingUser(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Role & Details */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit User & Permission Settings</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Assign Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                  >
                    <option value="CUSTOMER">Client / Customer</option>
                    <option value="EXPERT">Expert / Doctor</option>
                    <option value="ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Expert Document Inspection */}
      {selectedExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedExpert.avatarUrl}
                  alt={selectedExpert.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedExpert.displayName}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedExpert.profession}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExpert(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="text-gray-400 block uppercase font-bold text-[10px]">
                  Official Regulatory ID
                </span>
                <span className="font-mono font-bold text-sm text-gray-900">
                  {selectedExpert.officialLicenseNumber}
                </span>
                <span className="block text-gray-500">
                  Board: {selectedExpert.verificationBody}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">
                  Uploaded License Scans
                </span>
                <div className="mt-1 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900">
                  <span className="font-semibold">
                    BMDC_Official_Registration_Certificate_2026.pdf
                  </span>
                  <span className="text-[11px] text-blue-600 font-bold">Verified Hash</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedExpert(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              {selectedExpert.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleRejectExpert(selectedExpert.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveExpert(selectedExpert.id)}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Approve Provider
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== F0 Confirmation Dialogs (replace window.prompt/window.confirm) ========== */}

      <ConfirmationDialog
        open={pendingApproveOrderId !== null}
        title="Approve Order & Release Escrow"
        message="Capture an optional audit-log note. The customer will be granted video-room access."
        confirmLabel="Approve Order"
        confirmVariant="success"
        onConfirm={submitApproveOrder}
        onCancel={() => {
          setPendingApproveOrderId(null);
          setApproveNote('');
        }}
      >
        <textarea
          value={approveNote}
          onChange={(e) => setApproveNote(e.target.value)}
          placeholder="e.g. Customer verified, gateway reference matched."
          rows={3}
          className="w-full mt-2 p-2 text-xs border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759]"
        />
      </ConfirmationDialog>

      <ConfirmationDialog
        open={pendingRejectOrderId !== null}
        title="Reject Order & Initiate Refund"
        message="Provide a rejection reason. This will be sent to the customer."
        confirmLabel="Reject & Refund"
        confirmVariant="danger"
        onConfirm={submitRejectOrder}
        onCancel={() => {
          setPendingRejectOrderId(null);
          setRejectReason('');
        }}
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Gateway reference could not be verified."
          rows={3}
          className="w-full mt-2 p-2 text-xs border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759]"
        />
      </ConfirmationDialog>

      <ConfirmationDialog
        open={confirmSeedOpen}
        title="Reset & Reseed Database"
        message="This will wipe the dynamic JSON store and reload the seed catalogue. Continue?"
        confirmLabel="Reseed Database"
        confirmVariant="danger"
        onConfirm={confirmSeedDatabase}
        onCancel={() => setConfirmSeedOpen(false)}
      />

      <ConfirmationDialog
        open={pendingDeleteUserId !== null}
        title="Delete User Record"
        message="This action cannot be undone. The user account and all its audit metadata will be permanently removed."
        confirmLabel="Delete User"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setPendingDeleteUserId(null)}
      />
    </div>
  );
};

export default AdminDashboard;
export { AdminDashboard as AdminDashboardComponent };
