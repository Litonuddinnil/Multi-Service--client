/**
 * Wire types for the withU API, transcribed from API_REFERENCE.md.
 *
 * These describe what the SERVER sends, not what the UI renders — they are
 * deliberately separate from `src/types/index.ts`, whose shapes predate the
 * audience-split API and are still used by the local-fixture paths. Keeping
 * them apart means a change to one never silently reinterprets the other.
 *
 * Conventions that hold everywhere (§0):
 *   • money is a decimal `number` plus a separate 3-letter `currency`
 *   • time is a UTC ISO-8601 instant string
 *   • ids are UUID-ish strings, except category ids, which are numeric longs
 */

// --- §1 Authentication -----------------------------------------------------

export interface TokenPair {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface RegisterResult {
  email: string;
  verificationCodeExpiresAt: string;
  /** Present only when the deployment has no way to deliver the code. */
  verificationCode?: string;
}

export interface AuthMe {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  countryCode: string | null;
  preferredLanguage: string;
  timezone: string | null;
  status: string;
  dateOfBirth?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  avatarUrl?: string | null;
}

// --- §2 Account self-service -----------------------------------------------

export interface MfaSetup {
  secret: string;
  otpauthUri: string;
}

export interface AccountExport {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  countryCode: string | null;
  preferredLanguage: string;
  timezone: string | null;
  status: string;
  mfaEnabled: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string | null;
  roles: string[];
  sessions: Array<{ issuedAt: string | null; expiresAt: string | null; revokedAt: string | null }>;
  exportedAt: string;
}

// --- §3 Admin users --------------------------------------------------------

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface AdminUserView {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  countryCode: string | null;
  preferredLanguage: string | null;
  roles: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  lockedUntil: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  deletedAt: string | null;
  createdAt: string | null;
}

// --- §4 Audit --------------------------------------------------------------

export interface AuditEntry {
  id: string;
  actorId: string;
  actorEmail: string | null;
  action: string;
  subjectType: string;
  subjectId: string;
  summary: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

// --- §5 Platform reference data --------------------------------------------

export interface Country {
  code: string;
  name: string;
  defaultCurrency: string | null;
  defaultLocale: string | null;
}
export interface Currency {
  code: string;
  name: string;
  decimals: number;
}
export interface Language {
  code: string;
  name: string;
}
export interface TaxRule {
  id: string;
  countryCode: string;
  /** null = country-wide. */
  categoryId: string | null;
  /** Percent, not a fraction. */
  rate: number;
  validFrom: string;
  /** null = still open. */
  validTo: string | null;
}

// --- §6 Catalog ------------------------------------------------------------

export type CategoryKind = 'SERVICE' | 'PRODUCT';
export type EngagementType = 'SESSION' | 'PROJECT' | 'PACKAGE' | 'RETAINER';
export type ServiceMode = 'CHAT' | 'CALL' | 'VIDEO' | 'IN_PERSON';
export type PricingModel = 'SESSION' | 'FIXED' | 'HOURLY';
export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

export interface CategoryNodeView {
  id: string;
  parentId: string | null;
  slug: string;
  kind: CategoryKind;
  engagementType: EngagementType;
  icon: string | null;
  sortOrder: number;
  name: string;
  description?: string;
  attributesSchema: FieldSpec[] | null;
  children: CategoryNodeView[];
}

/** One field of a category's attribute or project-intake schema. */
export interface FieldSpec {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required?: boolean;
  options?: string[];
}

export interface AdminCategoryView {
  id: string;
  parentId: string | null;
  slug: string;
  kind: CategoryKind;
  engagementType: EngagementType;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  clinical: boolean;
  bookingMinLeadMinutes: number | null;
  bookingResponseMinutes: number | null;
  bookingCancellationMinutes: number | null;
  attributesSchema: FieldSpec[] | null;
  requirementsSchema?: FieldSpec[] | null;
  translations: Array<{ locale: string; name: string; description?: string }>;
}

export interface ServiceLocation {
  countryCode: string;
  district?: string;
  city?: string;
  area?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  inPersonKind?: 'VENUE' | 'TRAVELS';
  serviceRadiusKm?: number;
}

export interface ExpertSummary {
  expertId: string;
  displayName: string;
  profession: string | null;
  specialization?: string | null;
  hasPhoto: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export interface SearchItem {
  id: string;
  categoryId: string;
  title: string;
  minPrice?: number;
  currency?: string;
  location: ServiceLocation | null;
  /** Only when coordinates were supplied; 1 decimal. */
  distanceKm: number | null;
  expert: ExpertSummary | null;
}

export interface SearchPage {
  items: SearchItem[];
  page: number;
  size: number;
  total: number;
}

export interface PackageView {
  id: string;
  name: string;
  description?: string;
  pricingModel: PricingModel;
  durationMinutes?: number;
  mode: ServiceMode;
  price: number;
  currency: string;
  active: boolean;
  sortOrder: number;
}

export interface ServiceDetail {
  id: string;
  categoryId: string;
  categoryName: string | null;
  title: string;
  description: string | null;
  attributes: Record<string, unknown>;
  /** The category's project-intake form — render it when opening a request. */
  requirementsSchema: FieldSpec[] | null;
  minPrice?: number;
  currency?: string;
  location: ServiceLocation | null;
  packages: PackageView[];
  expert: ExpertSummary | null;
}

export interface ServiceOwnView extends ServiceDetail {
  status: ServiceStatus;
}

export interface AvailabilityWindow {
  start: string;
  end: string;
}

export interface AvailabilityRule {
  id?: string;
  weekday: string;
  startTime: string;
  endTime: string;
  /** IANA zone — rules live in the expert's local time. */
  timezone: string;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface AvailabilityOverride {
  id?: string;
  date: string;
  type: 'BLOCK' | 'EXTRA';
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface Recommendations {
  /** true -> "Because you booked…", false -> "Popular on withU". */
  personalized: boolean;
  items: Array<{
    serviceId: string;
    categoryId: string;
    title: string;
    minPrice?: number;
    currency?: string;
    expert: Omit<ExpertSummary, 'specialization'> | null;
  }>;
}

// --- §7 Expert onboarding --------------------------------------------------

export type ExpertStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type DocumentType =
  | 'DEGREE_COPY' | 'LICENSE' | 'EXPERIENCE_PROOF' | 'CV' | 'ID_COPY'
  | 'TRADE_LICENSE' | 'TIN_CERTIFICATE' | 'INCORPORATION_CERTIFICATE';

export interface ExpertDocument {
  id: string;
  type: DocumentType;
  originalFilename: string;
  contentType: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason: string | null;
  expiresAt: string | null;
  uploadedAt: string;
}

export interface ExpertOwnProfile {
  userId: string;
  vendorType: 'INDIVIDUAL' | 'ORGANIZATION';
  primaryCategoryId: string | null;
  displayName: string;
  profession: string | null;
  specialization: string | null;
  yearsOfExperience: number;
  shortBio: string | null;
  hasPhoto: boolean;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  professionalRegNo?: string | null;
  status: ExpertStatus;
  skills: string[];
  educations: Array<{ degree: string; institution: string; fieldOfStudy?: string; startYear?: number; endYear?: number }>;
  experiences: Array<{ title: string; organization: string; description?: string; startDate?: string; endDate?: string; current: boolean }>;
  certifications: Array<{ name: string; issuer?: string; issuedYear?: number; verified: boolean }>;
  /** Id number is ALWAYS masked (`***1234`). */
  identity?: { idType: 'NID' | 'PASSPORT'; idNumberMasked: string; fullAddress: string } | null;
  organization?: Record<string, unknown> | null;
  documents: ExpertDocument[];
}

// --- §8 Bookings -----------------------------------------------------------

export type BookingStatus =
  | 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'DECLINED'
  | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_EXPERT' | 'NO_SHOW' | 'EXPIRED';

export interface BookingView {
  id: string;
  customerId: string;
  expertId: string;
  serviceId: string | null;
  packageId: string | null;
  /** Snapshotted at request time — catalog edits never change them. */
  customerName: string | null;
  expertName: string | null;
  serviceTitle: string | null;
  packageName: string | null;
  durationMinutes: number;
  mode: string;
  price: number;
  currency: string;
  slotStart: string;
  slotEnd: string;
  status: BookingStatus;
  /** null until the payment webhook lands — poll for it. */
  paidAt: string | null;
  meetingLink: string | null;
  customerRecordingConsent: boolean | null;
  expertRecordingConsent: boolean | null;
  proposedSlotStart: string | null;
  proposedBy: string | null;
  customerNote: string | null;
  reason: string | null;
  createdAt: string;
}

export interface JoinCredentials {
  provider: 'LIVEKIT' | 'JITSI' | 'EXTERNAL';
  link: string | null;
  serverUrl?: string;
  roomName?: string;
  /** Short-lived — fetch at click time, never store. */
  accessToken?: string;
}

// --- §9 Payments -----------------------------------------------------------

export type OrderSubjectType = 'BOOKING' | 'PROJECT_MILESTONE' | 'PILGRIMAGE_BOOKING' | 'RETAINER_PERIOD';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';

export interface CheckoutView {
  orderId: string;
  /** The gateway `tran_id`. */
  paymentId: string;
  redirectUrl: string;
  total: number;
  currency: string;
}

export interface OrderView {
  id: string;
  subjectType: OrderSubjectType;
  subjectId: string | null;
  description: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: string | null;
}

export interface AdminOrderView extends OrderView {
  customerId: string | null;
  expertId: string | null;
  taxRate: number;
  commissionRate: number;
  commissionAmount: number;
  expertAmount: number;
}

export interface LedgerEntry {
  id: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface PayoutView {
  id: string;
  expertId: string;
  amount: number;
  currency: string;
  method: 'BANK' | 'BKASH' | 'NAGAD';
  reference: string;
  note: string | null;
  createdAt: string;
}

export interface Earnings {
  /** Available / earned — the payout basis. */
  balance: number;
  /** Captured, but the engagement has not completed yet. */
  pendingEscrow: number;
  currency: string;
  entries: LedgerEntry[];
  payouts: PayoutView[];
}

export interface PayoutMethod {
  type: 'BANK' | 'BKASH' | 'NAGAD';
  accountHolder: string;
  maskedAccountDetails: string;
  verified: boolean;
}

export interface PayoutsDue {
  currency: string;
  minAmount: number;
  count: number;
  totalDue: number;
  rows: Array<{
    expertId: string;
    expertName: string;
    balance: number;
    payoutMethod: PayoutMethod | null;
    lastPayoutAt?: string | null;
  }>;
}

export interface FinanceOverview {
  currency: string;
  from: string | null;
  to: string | null;
  page: number;
  size: number;
  totalExperts: number;
  totals: {
    earnedInPeriod: number;
    refundAdjustments: number;
    paidInPeriod: number;
    currentDue: number;
    pendingEscrow: number;
  };
  rows: Array<{
    expertId: string;
    expertName: string;
    earnedInPeriod: number;
    refundAdjustments: number;
    paidInPeriod: number;
    payoutCount: number;
    currentDue: number;
    pendingEscrow: number;
    lastPayoutAt?: string | null;
  }>;
}

export interface Statement {
  expertId: string;
  expertName: string;
  currency: string;
  from: string | null;
  to: string | null;
  openingBalance: number;
  closingBalance: number;
  totals: { earned: number; refunded: number; paid: number };
  pendingEscrowNow: number;
  /** Statements are capped at 1000 lines. */
  truncated: boolean;
  /** Oldest first. `amount` is SIGNED: positive earned, negative otherwise. */
  lines: Array<{
    date: string;
    type: 'EARNED' | 'REFUND_ADJUSTMENT' | 'PAYOUT';
    amount: number;
    description: string;
    orderId?: string;
  }>;
}

// --- §10 Disputes ----------------------------------------------------------

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'WITHDRAWN';
export type DisputeReason =
  | 'NOT_DELIVERED' | 'NOT_AS_DESCRIBED' | 'QUALITY'
  | 'UNAUTHORIZED_CHARGE' | 'MISCONDUCT' | 'OTHER';

export interface DisputeView {
  id: string;
  subjectType: OrderSubjectType;
  subjectId: string;
  customerId: string;
  expertId: string;
  openedBySide: 'CUSTOMER' | 'EXPERT';
  reason: DisputeReason;
  details: string;
  amount: number;
  currency: string;
  status: DisputeStatus;
  resolution: 'REFUND_CUSTOMER' | 'RELEASE_EXPERT' | 'SPLIT' | null;
  refundAmount: number | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CommentView {
  id: string;
  authorName: string | null;
  body: string;
  internal: boolean;
  mine: boolean;
  createdAt: string;
}

export interface DisputeDetail {
  dispute: DisputeView;
  comments: CommentView[];
}

// --- §11 Projects ----------------------------------------------------------

export type ProjectStatus = 'REQUESTED' | 'QUOTED' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'FUNDED' | 'DELIVERED' | 'APPROVED';

export interface MilestoneView {
  id: string;
  position: number;
  title: string;
  description: string | null;
  amount: number;
  status: MilestoneStatus;
  deliveredNote: string | null;
  deliveredAt: string | null;
  approvedAt: string | null;
}

export interface ProjectView {
  id: string;
  serviceId: string | null;
  customerId: string;
  expertId: string;
  customerName: string | null;
  expertName: string | null;
  title: string;
  requirements: string;
  requirementAnswers: Record<string, unknown> | null;
  scopeNote: string | null;
  currency: string | null;
  status: ProjectStatus;
  reason: string | null;
  /** Sum of the milestones. */
  total: number;
  milestones: MilestoneView[];
  createdAt: string;
}

export interface ProjectAttachment {
  id: string;
  uploaderId: string;
  mine: boolean;
  originalFilename: string;
  contentType: string;
  createdAt: string;
}

// --- §12 Pilgrimage --------------------------------------------------------

export interface DepartureView {
  id: string;
  packageId: string;
  departureDate: string;
  returnDate: string | null;
  totalSeats: number;
  seatsAvailable: number;
  status: 'OPEN' | 'CLOSED' | 'DEPARTED' | 'CANCELLED';
}

export interface PilgrimagePackageView {
  id: string;
  agencyId: string | null;
  categoryId: string | null;
  title: string;
  description: string | null;
  tier: 'VIP' | 'ECONOMY' | 'CUSTOM';
  /** Per traveler. */
  price: number;
  currency: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  departures: DepartureView[];
}

export interface Traveler {
  fullName: string;
  /** Masked (`***4567`) everywhere except the agency manifest. */
  passportNo: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface PilgrimageBookingView {
  id: string;
  departureId: string;
  packageId: string;
  packageTitle: string | null;
  tier: string | null;
  seatCount: number;
  total: number;
  currency: string;
  status: 'RESERVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paidAt: string | null;
  travelers: Traveler[];
  createdAt: string;
}

export interface ManifestRow {
  bookingId: string;
  customerName: string | null;
  /** FULL passport numbers — treat this screen as sensitive. */
  travelers: Traveler[];
}

// --- §13 Retainers ---------------------------------------------------------

export interface RetainerPlanView {
  id: string;
  expertId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  monthlyPrice: number;
  currency: string;
  slaHours: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface RetainerView {
  id: string;
  planId: string;
  expertId: string;
  customerId: string;
  customerName: string | null;
  expertName: string | null;
  /** Snapshots — plan edits do not touch a live retainer. */
  planTitle: string | null;
  monthlyPrice: number;
  currency: string;
  slaHours: number;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

export type RetainerCheckout = CheckoutView & { retainerId: string };

// --- §14 Messaging ---------------------------------------------------------

export interface ThreadView {
  id: string;
  subjectType: 'BOOKING' | 'PROJECT';
  subjectId: string | null;
  title: string;
  otherPartyName: string | null;
  /** Messaging unread lives here — there is no separate count endpoint. */
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface MessageView {
  /** A NUMBER — poll with the last id you hold as `after`. */
  id: number;
  senderId: string | null;
  mine: boolean;
  /** null on attachment messages. */
  body: string | null;
  attachmentName: string | null;
  attachmentContentType: string | null;
  createdAt: string;
}

// --- §15 Notifications -----------------------------------------------------

export interface NotificationView {
  id: number;
  type: string;
  title: string;
  body: string | null;
  /** A frontend route — navigate there on tap. */
  link: string | null;
  read: boolean;
  createdAt: string;
}

// --- §16 Support tickets ---------------------------------------------------

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketView {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  openerName: string | null;
  retainerId: string | null;
  expertId: string | null;
  assigneeId: string | null;
  slaDueAt: string | null;
  firstResponseAt: string | null;
  slaBreached: boolean;
  createdAt: string;
}

export interface TicketDetail {
  ticket: TicketView;
  comments: CommentView[];
}

// --- §17 Moderation --------------------------------------------------------

export type ReportSubjectType = 'SERVICE' | 'EXPERT' | 'MESSAGE' | 'REVIEW';
export type ReportReason =
  | 'SPAM' | 'FRAUD' | 'INAPPROPRIATE' | 'MISLEADING' | 'OFF_PLATFORM_CONTACT' | 'OTHER';
export type ReportAction = 'UNPUBLISH_SERVICE' | 'SUSPEND_EXPERT' | 'HIDE_REVIEW';

export interface ReportView {
  id: string;
  reporterName: string | null;
  source: 'USER' | 'SYSTEM';
  subjectType: ReportSubjectType;
  /** For SYSTEM MESSAGE reports this is the THREAD id. */
  subjectId: string;
  reason: ReportReason;
  details: string | null;
  status: 'OPEN' | 'ACTIONED' | 'DISMISSED';
  actionTaken: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

// --- §18 Reviews -----------------------------------------------------------

export interface ReviewView {
  id: string;
  subjectType: 'BOOKING' | 'PROJECT';
  subjectId: string;
  expertId: string;
  /** Snapshot — the customer id is never exposed. */
  customerName: string;
  serviceId: string | null;
  serviceTitle: string | null;
  rating: number;
  comment: string | null;
  expertReply: string | null;
  repliedAt: string | null;
  hidden: boolean;
  createdAt: string;
}

export interface PublicReviewBlock {
  averageRating: number;
  reviewCount: number;
  /** Always all five keys, even at zero. */
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  reviews: ReviewView[];
}

// --- §19 Clinical ----------------------------------------------------------

export interface ClinicalNoteView {
  id: string;
  bookingId: string;
  /** Decided by the booking's category, never by the caller. */
  clinical: boolean;
  sharedWithCustomer: boolean;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineLine {
  name: string;
  strength?: string | null;
  form?: string | null;
  /** e.g. "1+0+1". */
  dosage?: string | null;
  duration?: string | null;
  instruction?: string | null;
}

export interface InvestigationLine {
  name: string;
  instruction?: string | null;
}

export interface PrescriptionView {
  id: string;
  bookingId: string;
  status: 'DRAFT' | 'ISSUED';
  doctorName: string | null;
  doctorRegNo: string | null;
  patientName: string | null;
  /** Computed at issue. */
  patientAge: number | null;
  patientGender: string | null;
  chiefComplaint: string | null;
  examination: string | null;
  diagnosis: string | null;
  advice: string | null;
  followUpDate: string | null;
  supersedesId: string | null;
  issuedAt: string | null;
  medicines: MedicineLine[];
  investigations: InvestigationLine[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicineSuggestion {
  id: string;
  brandName: string;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  manufacturer: string | null;
}

export interface InvestigationSuggestion {
  id: string;
  name: string;
  category: string | null;
}

// --- §20 Recordings --------------------------------------------------------

export interface RecordingView {
  id: string;
  bookingId: string;
  status: 'RECORDING' | 'AVAILABLE';
  clinical: boolean;
  durationSeconds: number | null;
  sizeBytes: number | null;
  startedAt: string;
  finishedAt: string | null;
  /** "available until…" — default 90 days; a live dispute extends it. */
  expiresAt: string | null;
}

export interface PlaybackUrl {
  url: string;
  expiresInSeconds: number;
}

// --- §22 Admin dashboard ---------------------------------------------------

export interface DashboardView {
  generatedAt: string;
  windowStart: string;
  windowDays: number;
  money: {
    currency: string;
    grossCaptured: number;
    refunded: number;
    platformCommission: number;
    taxCollected: number;
    escrowHeld: number;
    expertPayable: number;
    paidOrders: number;
    awaitingPayment: number;
    refundedOrders: number;
    recentPaidOrders: number;
    recentGross: number;
    bySubjectType: Array<{ subjectType: string; orders: number; gross: number }>;
  };
  sessions: {
    awaitingResponse: number;
    confirmed: number;
    upcoming: number;
    completedInWindow: number;
    cancelledInWindow: number;
    createdInWindow: number;
  };
  experts: {
    awaitingVerification: number;
    approved: number;
    suspended: number;
    rejected: number;
    submittedInWindow: number;
  };
  listings: {
    published: number;
    draft: number;
    paused: number;
    archived: number;
    publishedInWindow: number;
  };
  users: {
    total: number;
    active: number;
    awaitingVerification: number;
    suspended: number;
    deleted: number;
    registeredInWindow: number;
  };
  queues: {
    support: { open: number; inProgress: number; slaBreached: number; openedInWindow: number; resolvedInWindow: number };
    moderation: { open: number; actionedInWindow: number; dismissedInWindow: number };
    disputes: { live: number; openedInWindow: number; resolvedInWindow: number };
  };
  /** Pre-ranked by consequence — render in the order received, never re-sort. */
  needsAttention: Array<{
    key: string;
    label: string;
    count: number;
    severity: 'critical' | 'warning' | 'info';
    link: string;
  }>;
}
