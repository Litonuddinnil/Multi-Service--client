export type UserRole = 'GUEST' | 'CUSTOMER' | 'EXPERT' | 'MODERATOR' | 'SUPPORT_AGENT' | 'ADMIN' | 'SUPER_ADMIN';

export type Permission = 
  | 'expert:verify' 
  | 'catalog:manage' 
  | 'platform:manage' 
  | 'payment:manage' 
  | 'payment:refund' 
  | 'booking:manage'
  | 'cms:manage';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  phoneVerified?: boolean;
  avatarUrl?: string;
  roles: UserRole[];
  permissions: Permission[];
  mfaEnabled?: boolean;
  mfaSecret?: string;
  otpauthUri?: string;
  recoveryCodes?: string[];
  preferredLanguage?: 'en' | 'bn';
  createdAt: string;
  status: 'active' | 'locked' | 'suspended';
}

export type EngagementType = 'SESSION' | 'PROJECT' | 'PACKAGE' | 'RETAINER' | 'COMMERCE';

export interface CategoryAttributeSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  descriptionEn?: string;
  descriptionBn?: string;
  iconName?: string;
  imageUrl?: string;
  parentId?: string | null;
  children?: CategoryNode[];
  engagementType: EngagementType;
  bookingPolicyMinutes?: number; // 0 clears override
  commissionRate: number; // e.g. 0.12 (12%)
  attributesSchema: CategoryAttributeSchema[];
  requiredDocumentTypes?: string[]; // e.g. ["BMDC_LICENSE", "NID", "TRADE_LICENSE"]
  isActive: boolean;
  order: number;
}

export type ExpertStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type VendorType = 'INDIVIDUAL' | 'ORGANIZATION';

export interface ExpertEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  year: number;
}

export interface ExpertExperience {
  company: string;
  role: string;
  fromYear: number;
  toYear?: number;
  current?: boolean;
}

export interface ExpertCertification {
  title: string;
  issuer: string;
  year: number;
  isVerified?: boolean;
}

export interface ExpertDocument {
  id: string;
  type: string;
  documentNumber?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface ReviewerNote {
  id: string;
  authorId: string;
  authorName: string;
  note: string;
  action: 'NOTE' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'DOC_ACCEPTED' | 'DOC_REJECTED';
  createdAt: string;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  displayName: string;
  vendorType: VendorType;
  primaryCategoryId: string;
  profession: string;
  specialization: string;
  yearsOfExperience: number;
  bio: string;
  avatarUrl: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  officialLicenseNumber?: string;
  verificationBody?: string;
  
  // Identity info (masked for privacy)
  idType?: 'NID' | 'PASSPORT';
  idNumberMasked?: string;
  idNumberFull?: string; // sensitive
  address?: string;

  // Organization info
  orgLegalName?: string;
  tradeLicenseMasked?: string;
  tradeLicenseFull?: string;
  orgTinMasked?: string;
  orgAddress?: string;
  orgRepresentativeName?: string;
  orgRepresentativeDesignation?: string;

  // Background
  skills: string[];
  educations: ExpertEducation[];
  experiences: ExpertExperience[];
  certifications: ExpertCertification[];
  documents: ExpertDocument[];

  // Review & Admin fields
  status: ExpertStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  categoryLocked: boolean;
  reviewerNotes: ReviewerNote[];
  rating: number;
  reviewCount: number;
  customCommissionRate?: number; // overrides category if set

  createdAt: string;
  updatedAt: string;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  pricingType: 'SESSION' | 'FIXED' | 'HOURLY';
  durationMinutes: number; // For SESSION
  priceBDT: number; // Scale-4 decimal representation
  features: string[];
  isBookable: boolean;
}

export interface ServiceItem {
  id: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  isExpertVerified: boolean;
  vendorType: VendorType;
  title: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  engagementType: EngagementType;
  description: string;
  coverImage: string;
  attributes: Record<string, any>;
  packages: ServicePackage[];
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
  rating: number;
  reviewCount: number;
  startingPriceBDT: number;
  consultationMode: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  location?: string;
  customCommissionRate?: number;
  createdAt: string;
}

export interface TimeSlotWindow {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDurationMinutes: number;
}

export interface DateOverride {
  date: string; // "YYYY-MM-DD"
  isUnavailable: boolean;
  customWindows?: { startTime: string; endTime: string }[];
}

export interface ExpertAvailability {
  expertId: string;
  timezone: string; // "Asia/Dhaka"
  weeklyWindows: TimeSlotWindow[];
  dateOverrides: DateOverride[];
}

export type BookingStatus =
  | 'REQUESTED'
  | 'PENDING_ADMIN_REVIEW'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'COMPLETED';

export type PaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_ADMIN_REVIEW'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface BookingView {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  isExpertVerified: boolean;
  serviceId: string;
  serviceTitle: string;
  packageId: string;
  packageTitle: string;
  categoryId: string;
  categoryName: string;
  
  // Timing
  slotStartTimeUtc: string; // ISO 8601 UTC
  slotEndTimeUtc: string;
  durationMinutes: number;
  consultationMode: 'ONLINE' | 'IN_PERSON';
  meetingLink?: string; // only for ONLINE confirmed
  location?: string;

  // Status & Financials
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  priceBDT: number;
  commissionRate: number; // e.g. 0.15 (15%)
  commissionAmountBDT: number;
  providerNetBDT: number;
  paidAt?: string;
  unpaidExpiresAt?: string; // 30-min countdown

  // Notes & Reasons
  customerNote?: string;
  declinedReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  
  // Reschedule
  rescheduleProposal?: {
    proposedBy: 'CUSTOMER' | 'EXPERT';
    newSlotStartUtc: string;
    newSlotEndUtc: string;
    note?: string;
    createdAt: string;
  };

  // Consultation state tracking
  consultationId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  amountBDT: number;
  estimatedDays: number;
  order: number;
  status: 'PENDING' | 'FUNDED' | 'DELIVERED' | 'APPROVED';
  fundedAt?: string;
  deliveredAt?: string;
  deliveryNote?: string;
  deliverableFiles?: { name: string; url: string; size: number }[];
  approvedAt?: string;
  disputeReason?: string;
}

export interface ProjectView {
  id: string;
  projectNumber: string;
  customerId: string;
  customerName: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  serviceId: string;
  serviceTitle: string;
  categoryName: string;
  
  requirementsDescription: string;
  currency: string; // "BDT"
  totalAmountBDT: number;
  commissionRate: number;
  
  status: 'PENDING_QUOTE' | 'QUOTE_RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  quoteScopeNote?: string;
  milestones: ProjectMilestone[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PilgrimageTraveler {
  fullName: string;
  passportNumber: string; // sensitive
  passportNumberMasked: string; // "A****4821"
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
}

export interface PilgrimageDeparture {
  id: string;
  packageId: string;
  departureDate: string; // "YYYY-MM-DD"
  returnDate: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  status: 'OPEN' | 'SOLD_OUT' | 'CLOSED' | 'COMPLETED';
}

export interface PilgrimagePackage {
  id: string;
  agencyExpertId: string;
  agencyName: string;
  agencyAvatar: string;
  isAgencyVerified: boolean;
  tier: 'ECONOMY' | 'STANDARD' | 'PREMIUM_VIP';
  title: string;
  type: 'HAJJ' | 'UMRAH';
  description: string;
  coverImage: string;
  durationDays: number;
  makkahHotel: string;
  madinahHotel: string;
  distanceFromHaramMeters: number;
  inclusions: string[];
  exclusions: string[];
  pricePerTravelerBDT: number;
  departures: PilgrimageDeparture[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  rating: number;
  reviewCount: number;
}

export interface PilgrimageBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  packageId: string;
  packageTitle: string;
  departureId: string;
  departureDate: string;
  agencyExpertId: string;
  agencyName: string;
  travelersCount: number;
  travelers: PilgrimageTraveler[];
  pricePerTravelerBDT: number;
  totalAmountBDT: number;
  commissionRate: number;
  commissionAmountBDT: number;
  agencyNetBDT: number;
  status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: PaymentStatus;
  reservationExpiresAt: string; // 30-min countdown
  paidAt?: string;
  createdAt: string;
}

export interface RetainerPlan {
  id: string;
  expertId: string;
  title: string;
  monthlyPriceBDT: number;
  slaBadge?: string; // "Responds within 24h"
  slaHours?: number;
  categoryName?: string;
  description: string;
  includedHours: number;
  features: string[];
  isActive: boolean;
}

export interface RetainerSubscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  planId: string;
  planTitle: string;
  monthlyPriceBDT: number;
  commissionRate: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  periodStart: string;
  periodEnd: string; // "renews until YYYY-MM-DD"
  autoRenew: boolean;
  createdAt: string;
  nextRenewalDate?: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  instruction: string;
}

export interface CommissionConfig {
  categoryId: string;
  categoryName: string;
  platformFeePercent: number;
}

export type AppointmentBooking = BookingView;
export type ProjectContract = ProjectView;
export type CommerceOrder = OrderItem;

export type ConsultationSessionState = 
  | 'scheduled' 
  | 'waiting' 
  | 'doctor_joined' 
  | 'user_joined' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show' 
  | 'expired';

export interface ConsultationSession {
  consultationId: string;
  appointmentId: string; // maps to BookingView.id
  doctorId: string;
  doctorName: string;
  userId: string;
  userName: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDurationMinutes: number;
  
  // Server-authoritative timestamps
  doctorJoinedAt?: string;
  userJoinedAt?: string;
  consultationStartedAt?: string;
  consultationEndedAt?: string;
  actualDurationSeconds?: number;
  
  sessionStatus: ConsultationSessionState;
  paymentStatus: PaymentStatus;
  
  prescriptionNotes?: string;
  clinicalSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  entityType: 'SESSION' | 'PROJECT_MILESTONE' | 'PACKAGE' | 'RETAINER' | 'COMMERCE';
  entityId: string;
  entityTitle: string;
  expertId: string;
  expertName: string;
  
  // Split amounts
  grossAmountBDT: number;
  taxAmountBDT: number;
  totalAmountBDT: number;
  commissionRate: number; // e.g. 0.12 (12%)
  commissionAmountBDT: number;
  providerNetAmountBDT: number;
  
  paymentGateway: 'SSLCOMMERZ' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD';
  paymentReference: string;
  paymentStatus: PaymentStatus;
  escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED_TO_PROVIDER' | 'REFUNDED_TO_CUSTOMER';
  
  paidAt?: string;
  refundedAmountBDT?: number;
  refundReason?: string;
  createdAt: string;
}

export interface ProviderLedgerRow {
  id: string;
  type: 'EARNING_RELEASED' | 'ESCROW_HOLD' | 'PAYOUT_TRANSFERRED' | 'REFUND_DEDUCTION';
  entityType: 'SESSION' | 'PROJECT_MILESTONE' | 'PACKAGE' | 'RETAINER';
  entityTitle: string;
  orderNumber: string;
  grossBDT: number;
  commissionBDT: number;
  netBDT: number;
  balanceAfterBDT: number;
  timestamp: string;
}

export interface PayoutMethod {
  id: string;
  type: 'BANK' | 'BKASH' | 'NAGAD';
  accountHolderName: string;
  accountNumberMasked: string; // "017*****123" or "102*******892"
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  isDefault: boolean;
}

export interface PayoutRequest {
  id: string;
  payoutNumber: string;
  expertId: string;
  expertName: string;
  amountBDT: number;
  payoutMethod: PayoutMethod;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED';
  adminNotes?: string;
  transactionReference?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface ReviewItem {
  id: string;
  entityType: 'SERVICE' | 'EXPERT' | 'PACKAGE' | 'PRODUCT';
  entityId: string;
  serviceTitle: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  expertId: string;
  rating: number; // 1-5
  comment: string;
  expertReply?: {
    text: string;
    repliedAt: string;
  };
  isFlagged?: boolean;
  flagReason?: string;
  moderationStatus: 'APPROVED' | 'PENDING' | 'REMOVED';
  createdAt: string;
}

export interface MessageItem {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  text: string;
  attachments?: { name: string; url: string; size: number; mimeType: string }[];
  isRead: boolean;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  entityType: 'SESSION' | 'PROJECT' | 'RETAINER' | 'GENERAL';
  entityId: string;
  entityTitle: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCountCustomer: number;
  unreadCountExpert: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'PROJECT' | 'VERIFICATION' | 'SYSTEM';
  entityUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface CommerceProduct {
  id: string;
  title: string;
  slug: string;
  type: 'COURSE' | 'TOOL' | 'BOOK';
  productType?: string;
  authorOrInstructor: string;
  authorName?: string;
  coverImage: string;
  thumbnailUrl?: string;
  priceBDT: number;
  rating: number;
  reviewCount: number;
  studentCount?: number;
  description: string;
  tags: string[];
  lessonsCount?: number;
  durationHours?: number;
  downloadFileSize?: string;
  // F19 — catalog category (e.g. 'Engineering', 'Medical', 'Legal').
  category?: string;
  // F19 — course-only metadata.
  courseLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language?: string;
  // F19 — bullet-list of "what you'll be able to do" outcomes.
  outcomes?: string[];
  curriculum?: { title: string; duration: string; previewAvailable?: boolean }[];
  // F19 — detailed lesson content for COURSE products. Each lesson has a
  // short video URL or external link (e.g. a YouTube/Vimeo embed), a
  // transcript-style description, and an ordered index. Tools & books
  // leave this empty and surface a download link instead.
  lessons?: CourseLesson[];
  // F19 — downloadable asset for TOOL / BOOK products (relative URL to
  // the file served from the server `/uploads` folder, or a CDN link).
  downloadUrl?: string;
}

/**
 * F19 — single lesson inside a course product. The `videoUrl` is the
 * primary playable source the client streams in the CoursePlayer; the
 * `description` is the on-screen transcript / outline. `previewAvailable`
 * mirrors the legacy `curriculum[].previewAvailable` flag so non-enrolled
 * visitors can still watch the first 1-2 lessons.
 */
export interface CourseLesson {
  id: string;
  order: number;
  title: string;
  duration: string;
  // Optional numeric duration in minutes (parsed from `duration` if present).
  durationMinutes?: number;
  videoUrl: string;
  description: string;
  previewAvailable?: boolean;
  // Optional alias used in newer CoursePlayer markup ("Free preview").
  isPreview?: boolean;
  // Optional rich-text transcript shown below the video player.
  textContent?: string;
  // Optional downloadable resources for the lesson (PDFs, worksheets, code files).
  materials?: { title: string; url: string; size?: string }[];
}

/**
 * F19 — issued enrollment. One per (userId, productId). The server
 * tracks which lessons have been marked complete so progress can be
 * restored across devices. When all lessons are complete a
 * certificate is minted automatically.
 */
export interface CommerceEnrollment {
  id: string;
  productId: string;
  userId: string;
  enrolledAt: string;
  completedAt?: string;
  completedLessonIds: string[];
  // Legacy camelCase alias for legacy routes that return percentComplete.
  percentComplete?: number;
  progress: number; // 0..100
  status: 'ACTIVE' | 'COMPLETED' | 'REFUNDED';
  certificateId?: string;
  // Server tracks the most recently opened lesson so the CoursePlayer
  // can resume exactly where the user left off.
  lastAccessedLessonId?: string;
  // Optional enrichment pushed by the server response.
  productTitle?: string;
  productThumbnail?: string;
}

/**
 * F19 — completion certificate. Auto-generated by the server when an
 * enrollment reaches 100% lesson completion. The `serial` is a
 * human-readable, verification-friendly identifier (e.g. CERT-2026-A3F1).
 */
export interface CommerceCertificate {
  id: string;
  serial: string;
  enrollmentId: string;
  userId: string;
  productId: string;
  productTitle: string;
  productType: 'COURSE' | 'TOOL' | 'BOOK';
  productInstructor?: string;
  userName: string;
  issuedAt: string;
  score?: number;
  verificationUrl: string;
  verificationCode?: string;
}

export interface CmsBlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  coverImage: string;
}

export interface CmsFaqItem {
  id: string;
  category: 'General' | 'Booking & Payment' | 'Escrow Protection' | 'Experts & Verification' | 'Hajj & Umrah';
  questionEn: string;
  questionBn: string;
  answerEn: string;
  answerBn: string;
}
