import type {
  AppointmentBooking,
  ExpertAgreement,
  ExpertProfile,
  PayoutMethod,
  PayoutRequest,
  ProjectContract,
  ProviderLedgerRow,
  ServiceItem,
} from '../../types';

/**
 * Outlet context shared by `ExpertDashboard/index.tsx` with all of its tab
 * children (Overview / Consultations / Projects / Services / Earnings /
 * Reviews / Threads / Agreement).
 */
export interface ExpertOutletContext {
  appointments: AppointmentBooking[];
  projects: ProjectContract[];
  services: ServiceItem[];
  ledger: ProviderLedgerRow[];
  payouts: PayoutRequest[];
  payoutMethods: PayoutMethod[];
  loading: boolean;
  /** Logged-in expert's profile id; used by the Reviews tab to fetch reviews. */
  expertId: string;
  /** Full profile for the signed-in expert; null until onboarding is submitted. */
  profile: ExpertProfile | null;
  /** Signed verification & initial agreement, when one has been submitted. */
  agreement: ExpertAgreement | null;
  reload: () => Promise<void>;

  // Financial figures (all derived in the shell from the ledger + bookings).
  /** Cleared funds minus anything already requested for withdrawal. */
  availableBalance: number;
  /** Provider net still locked in escrow against unfinished engagements. */
  totalHeldEscrow: number;
  /** Withdrawal requests raised but not yet settled. */
  pendingPayoutTotal: number;
  /** Lifetime provider net across every released ledger entry. */
  lifetimeEarnings: number;
  /** Platform commission withheld across every released ledger entry. */
  lifetimeCommission: number;
  /** Consultations + projects that reached a completed state. */
  completedEngagements: number;
  /** Effective platform commission rate, e.g. 0.12. */
  commissionRate: number;

  // Cross-cutting actions.
  handleJoinConsultation: (consultationId: string) => void;
  openPayoutModal: () => void;
  openDeliverableModal: (projectId: string, milestoneId: string) => void;
}
