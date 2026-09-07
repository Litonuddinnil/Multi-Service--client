import type * as React from 'react';
import type {
  User,
  ExpertProfile,
  CommissionConfig,
  BookingView,
  ProjectView,
  CommerceOrder,
} from '../../types';

 
export interface AdminUserRow {
  totalSpentBDT: number;
  totalEarnedBDT: number;
  escrowHeldBDT: number;
  appointmentsCount: number;
  projectsCount: number;
  expertProfile?: ExpertProfile;
}

export type AdminUserWithStats = User & AdminUserRow;

 
export interface AdminDbStatus {
  isMongoConnected?: boolean;
  databaseType?: string;
  dataDirectory?: string;
  collectionsCount?: number;
  collections?: Record<string, { count: number; sizeBytes: number }>;
}

 
export interface AdminOutletContext {
  // Aggregate data pre-fetched once by the shell.
  usersWithStats: AdminUserWithStats[];
  experts: ExpertProfile[];
  commissions: CommissionConfig[];
  bookings: BookingView[];
  projects: ProjectView[];
  orders: CommerceOrder[];
  dbStatus: AdminDbStatus | null;

  loading: boolean;
  reload: () => Promise<void>;

  // Mutator actions surfaced by the shell.
  handleApproveOrder: (orderId: string) => Promise<void>;
  handleRejectOrder: (orderId: string) => Promise<void>;
  handleSyncMongo: () => Promise<void>;
  handleExportJsonBackup: () => void;
  handleSeedDatabase: () => Promise<void>;
  handleUpdateCommission: (categoryId: string, ratePercent: number) => Promise<void>;
  handleApproveExpert: (expertId: string) => Promise<void>;
  handleRejectExpert: (expertId: string, reason?: string) => Promise<void>;
  handleSuspendExpert: (expertId: string, reason?: string) => Promise<void>;
  handleOpenEditUser: (user: User) => void;
  handleSaveUserEdit: (e: React.FormEvent) => Promise<void>;
  handleToggleUserStatus: (user: User) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;

  // Modal lifecycle (shell-level so the overlay renders above sidebar + main).
  viewingUser: AdminUserWithStats | null;
  setViewingUser: (user: AdminUserWithStats | null) => void;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  editForm: {
    name: string;
    email: string;
    phone: string;
    role: 'CUSTOMER' | 'EXPERT' | 'ADMIN';
    status: 'active' | 'suspended' | 'locked';
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      role: 'CUSTOMER' | 'EXPERT' | 'ADMIN';
      status: 'active' | 'suspended' | 'locked';
    }>
  >;
  // Toast notice (used by every tab for "saved / approved" feedback).
  showNotice: (msg: string, variant?: 'success' | 'error' | 'info' | 'warning') => void;
}
