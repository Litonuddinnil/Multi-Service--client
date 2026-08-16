import type {
  AppointmentBooking,
  ProjectContract,
  PilgrimageBooking,
  RetainerSubscription,
  CommerceOrder,
  ConsultationSession,
} from '../../types';

/**
 * Outlet context shared by `CustomerDashboard/index.tsx` with all of its
 * tab children (Appointments / Projects / Pilgrimage / Retainers / Orders).
 *
 * Each child renders as `<Outlet context={ctx} />` consumer via
 * `useOutletContext<CustomerOutletContext>()`.
 *
 * Keeping this here (instead of co-located with the shell) lets each tab
 * file `import type { CustomerOutletContext }` without re-export ceremony.
 */
export interface CustomerOutletContext {
  // Shared data — pre-fetched once by the shell so individual tabs don't
  // re-hit the API when the user switches between them.
  appointments: AppointmentBooking[];
  projects: ProjectContract[];
  pilgrimages: PilgrimageBooking[];
  retainers: RetainerSubscription[];
  orders: CommerceOrder[];

  // Loading + manual refresh so tabs can show skeletons consistently.
  loading: boolean;
  reload: () => Promise<void>;

  // Cross-cutting actions shared across tabs.
  handleNavigate: (view: string, params?: Record<string, any>) => void;
  handlePayEscrow: (
    entityType: 'SESSION' | 'PROJECT' | 'PILGRIMAGE' | 'COMMERCE',
    entityId: string,
    amountBDT: number,
    title: string,
  ) => void;
  handleViewPrescription: (consultation: ConsultationSession) => void;

  // Video room overlay — opening the room is shell-level because the
  // overlay must render above sidebar + main content. Tab fires the
  // action, shell mounts `<DoctorConsultationRoom />`.
  openVideoRoom: (consultationId: string) => void;
}