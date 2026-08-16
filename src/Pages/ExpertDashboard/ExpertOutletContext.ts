import type { AppointmentBooking, ProjectContract, ServiceItem } from '../../types';

/**
 * Outlet context shared by `ExpertDashboard/index.tsx` with all of its
 * tab children (Overview / Consultations / Projects).
 */
export interface ExpertOutletContext {
  appointments: AppointmentBooking[];
  projects: ProjectContract[];
  services: ServiceItem[];
  loading: boolean;
  reload: () => Promise<void>;

  // Financial computations (memoised in the shell).
  totalHeldEscrow: number;
  availableBalance: number;

  // Cross-cutting actions.
  handleJoinConsultation: (consultationId: string) => void;
  openPayoutModal: () => void;
  openDeliverableModal: (projectId: string, milestoneId: string) => void;
}