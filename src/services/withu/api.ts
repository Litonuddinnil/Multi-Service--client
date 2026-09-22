/**
 * `withuApi` — a typed client for every endpoint in API_REFERENCE.md.
 *
 * Grouped by the spec's own sections so a screen can be traced straight back
 * to the documentation: `withuApi.bookings.request(...)` is §8, and §8 is the
 * only place its rules are written down.
 *
 * Everything here throws `ApiError` on failure (see `./http`), carrying the
 * stable `code`. Switch on `err.code`, never on `err.message`.
 *
 *   try { await withuApi.bookings.request({...}); }
 *   catch (err) {
 *     if (err instanceof ApiError && err.code === 'slot_taken') offerAnotherSlot();
 *     else toast(err.localized(locale));
 *   }
 */
import { del, filePart, get, post, put, requestBlob } from './http';
import type * as T from './types';

const encode = encodeURIComponent;

// ---------------------------------------------------------------------------
// §1 Authentication — all public
// ---------------------------------------------------------------------------

export const auth = {
  register: (body: { fullName: string; email: string; phone?: string; password: string; role?: 'CUSTOMER' | 'EXPERT' }) =>
    post<T.RegisterResult>('/auth/register', { body, anonymous: true }),

  verifyEmail: (body: { email: string; code: string }) =>
    post<T.TokenPair>('/auth/verify-email', { body, anonymous: true }),

  resendVerification: (email: string) =>
    post<null>('/auth/resend-verification', { body: { email }, anonymous: true }),

  login: (body: { email: string; password: string }) =>
    post<T.TokenPair>('/auth/login', { body, anonymous: true }),

  /** Password plus a 6-digit TOTP or an `XXXX-XXXX` recovery code. */
  loginMfa: (body: { email: string; password: string; code: string }) =>
    post<T.TokenPair>('/auth/login/mfa', { body, anonymous: true }),

  /** Google sign-in bypasses MFA by design. */
  oauthGoogle: (body: { idToken?: string; email?: string; name?: string; avatarUrl?: string }) =>
    post<T.TokenPair>('/auth/oauth/google', { body, anonymous: true }),

  forgotPassword: (email: string) =>
    post<null>('/auth/forgot-password', { body: { email }, anonymous: true }),

  /** Consumes the code, sets the password and revokes EVERY session. */
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    post<null>('/auth/reset-password', { body, anonymous: true }),

  /** Returns a NEW pair; the old refresh token is dead. Normally the HTTP
   *  layer does this for you on a 401. */
  refresh: (refreshToken: string) =>
    post<T.TokenPair>('/auth/refresh', { body: { refreshToken }, anonymous: true }),

  /** Idempotent — an unknown token is not an error. */
  logout: (refreshToken: string) =>
    post<null>('/auth/logout', { body: { refreshToken }, anonymous: true }),

  me: () => get<T.AuthMe>('/auth/me'),
};

// ---------------------------------------------------------------------------
// §2 Account self-service
// ---------------------------------------------------------------------------

export const account = {
  setPhone: (phone: string) => post<null>('/me/phone', { body: { phone } }),
  verifyPhone: (code: string) => post<null>('/me/phone/verify', { body: { code } }),

  /** Returns the TOTP secret and the otpauth URI to render as a QR code. */
  mfaSetup: () => post<T.MfaSetup>('/me/mfa/setup'),
  /** Returns 8 recovery codes shown EXACTLY once — make the user save them. */
  mfaEnable: (code: string) => post<{ recoveryCodes: string[] }>('/me/mfa/enable', { body: { code } }),
  mfaDisable: (code: string) => post<null>('/me/mfa/disable', { body: { code } }),

  export: () => get<T.AccountExport>('/me/account/export'),

  /** Irreversible. The email is freed for re-registration. */
  delete: (password: string) => del<null>('/me/account', { body: { password } }),

  updateProfile: (body: {
    fullName?: string;
    dateOfBirth?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    avatarUrl?: string;
    countryCode?: string;
    preferredLanguage?: string;
    timezone?: string;
  }) => put<T.AuthMe>('/me/profile', { body }),
};

// ---------------------------------------------------------------------------
// §5 Platform reference data
// ---------------------------------------------------------------------------

export const platform = {
  countries: () => get<T.Country[]>('/public/platform/countries', { anonymous: true }),
  currencies: () => get<T.Currency[]>('/public/platform/currencies', { anonymous: true }),
  languages: () => get<T.Language[]>('/public/platform/languages', { anonymous: true }),
};

// ---------------------------------------------------------------------------
// §6 Catalog — public reads
// ---------------------------------------------------------------------------

export const catalog = {
  /** Honours `Accept-Language`: pass 'bn' for Bangla where a translation exists. */
  categories: (locale?: string) => get<T.CategoryNodeView[]>('/public/categories', { anonymous: true, locale }),

  search: (query: {
    category?: string;
    q?: string;
    mode?: T.ServiceMode;
    minPrice?: number;
    maxPrice?: number;
    district?: string;
    city?: string;
    /** lat AND lng together activate proximity search. */
    lat?: number;
    lng?: number;
    radiusKm?: number;
    sort?: 'recommended' | 'price_asc' | 'price_desc' | 'distance';
    page?: number;
    size?: number;
  } = {}) => get<T.SearchPage>('/public/services/search', { query, anonymous: true }),

  /** Only SCORED services appear — an empty list is normal, not an error. */
  recommended: (query: { category?: string; limit?: number } = {}) =>
    get<T.SearchItem[]>('/public/services/recommended', { query, anonymous: true }),

  /** The personalised feed. `personalized: false` means show the platform fallback. */
  myRecommendations: (limit = 10) => get<T.Recommendations>('/me/recommendations', { query: { limit } }),

  service: (serviceId: string, locale?: string) =>
    get<T.ServiceDetail>(`/public/services/${encode(serviceId)}`, { anonymous: true, locale }),

  expertServices: (expertId: string) =>
    get<T.SearchItem[]>(`/public/experts/${encode(expertId)}/services`, { anonymous: true }),

  /** Already expanded to UTC instants. Both dates required, span <= 31 days. */
  availability: (expertId: string, from: string, to: string) =>
    get<T.AvailabilityWindow[]>(`/public/experts/${encode(expertId)}/availability`, {
      query: { from, to },
      anonymous: true,
    }),

  expert: (expertId: string) => get<any>(`/public/experts/${encode(expertId)}`, { anonymous: true }),
  expertPhotoUrl: (expertId: string) => `/api/public/experts/${encode(expertId)}/photo`,
};

// ---------------------------------------------------------------------------
// §6 Catalog — the expert's own listings
// ---------------------------------------------------------------------------

export interface ServiceInput {
  categoryId: string;
  title: string;
  description?: string;
  attributes?: Record<string, unknown>;
  location?: T.ServiceLocation;
}

export const expertServices = {
  list: () => get<T.ServiceOwnView[]>('/expert/services'),
  get: (id: string) => get<T.ServiceOwnView>(`/expert/services/${encode(id)}`),
  create: (body: ServiceInput) => post<T.ServiceOwnView>('/expert/services', { body }),
  /** PUT replaces `location` wholesale — omitting it DELETES the stored one. */
  update: (id: string, body: ServiceInput) => put<T.ServiceOwnView>(`/expert/services/${encode(id)}`, { body }),
  publish: (id: string) => post<T.ServiceOwnView>(`/expert/services/${encode(id)}/publish`),
  pause: (id: string) => post<T.ServiceOwnView>(`/expert/services/${encode(id)}/pause`),
  /** Terminal. */
  archive: (id: string) => post<T.ServiceOwnView>(`/expert/services/${encode(id)}/archive`),

  /** All package writes answer with the refreshed ServiceOwnView. */
  addPackage: (serviceId: string, body: Partial<T.PackageView> & { name: string; mode: T.ServiceMode; price: number; currency: string }) =>
    post<T.ServiceOwnView>(`/expert/services/${encode(serviceId)}/packages`, { body }),
  updatePackage: (serviceId: string, packageId: string, body: Partial<T.PackageView>) =>
    put<T.ServiceOwnView>(`/expert/services/${encode(serviceId)}/packages/${encode(packageId)}`, { body }),
  removePackage: (serviceId: string, packageId: string) =>
    del<null>(`/expert/services/${encode(serviceId)}/packages/${encode(packageId)}`),
};

export const expertAvailability = {
  rules: () => get<T.AvailabilityRule[]>('/expert/availability/rules'),
  addRule: (body: T.AvailabilityRule) => post<T.AvailabilityRule>('/expert/availability/rules', { body }),
  removeRule: (ruleId: string) => del<null>(`/expert/availability/rules/${encode(ruleId)}`),
  overrides: (from: string, to: string) =>
    get<T.AvailabilityOverride[]>('/expert/availability/overrides', { query: { from, to } }),
  addOverride: (body: T.AvailabilityOverride) =>
    post<T.AvailabilityOverride>('/expert/availability/overrides', { body }),
  removeOverride: (id: string) => del<null>(`/expert/availability/overrides/${encode(id)}`),
};

// ---------------------------------------------------------------------------
// §7 Expert onboarding
// ---------------------------------------------------------------------------

export const expertProfile = {
  /** 404 `expert_profile_not_found` -> show the "become an expert" flow. */
  get: () => get<T.ExpertOwnProfile>('/expert/profile'),
  update: (body: Partial<T.ExpertOwnProfile> & { displayName: string }) =>
    put<T.ExpertOwnProfile>('/expert/profile', { body }),

  setSkills: (skills: string[]) => put<T.ExpertOwnProfile>('/expert/profile/skills', { body: skills }),
  setEducations: (rows: T.ExpertOwnProfile['educations']) =>
    put<T.ExpertOwnProfile>('/expert/profile/educations', { body: rows }),
  setExperiences: (rows: T.ExpertOwnProfile['experiences']) =>
    put<T.ExpertOwnProfile>('/expert/profile/experiences', { body: rows }),
  /** Replacing the list RESETS every `verified` flag. */
  setCertifications: (rows: Array<{ name: string; issuer?: string; issuedYear?: number }>) =>
    put<T.ExpertOwnProfile>('/expert/profile/certifications', { body: rows }),

  setIdentity: (body: { idType: 'NID' | 'PASSPORT'; idNumber: string; fullAddress: string }) =>
    put<T.ExpertOwnProfile>('/expert/profile/identity', { body }),
  setOrganization: (body: Record<string, unknown>) =>
    put<T.ExpertOwnProfile>('/expert/profile/organization', { body }),

  requirements: (categoryId: string) =>
    get<{ categoryId: string; documentTypes: T.DocumentType[] }>('/expert/requirements', { query: { categoryId } }),

  uploadPhoto: (file: File) => post<null>('/expert/profile/photo', { form: filePart(file) }),
  photo: () => requestBlob('/expert/profile/photo'),

  documents: () => get<T.ExpertDocument[]>('/expert/documents'),
  uploadDocument: (file: File, type: T.DocumentType, expiresAt?: string) =>
    post<T.ExpertDocument>('/expert/documents', {
      form: filePart(file, expiresAt ? { type, expiresAt } : { type }),
    }),
  removeDocument: (id: string) => del<null>(`/expert/documents/${encode(id)}`),

  /** After approval, REFRESH the token — the EXPERT role is not in older ones. */
  submit: () => post<T.ExpertOwnProfile>('/expert/profile/submit'),
};

// ---------------------------------------------------------------------------
// §8 Bookings
// ---------------------------------------------------------------------------

export const bookings = {
  request: (body: { packageId: string; slotStart: string; note?: string; recordingConsent?: boolean }) =>
    post<T.BookingView>('/me/bookings', { body }),
  list: () => get<T.BookingView[]>('/me/bookings'),
  get: (id: string) => get<T.BookingView>(`/me/bookings/${encode(id)}`),

  /** Send the browser to `redirectUrl`, then POLL `get(id)` until `paidAt`. */
  pay: (id: string) => post<T.CheckoutView>(`/me/bookings/${encode(id)}/pay`),

  /** Short-lived — fetch at click time. */
  join: (id: string) => get<T.JoinCredentials>(`/me/bookings/${encode(id)}/join`),

  cancel: (id: string, reason?: string) =>
    post<T.BookingView>(`/me/bookings/${encode(id)}/cancel`, { body: { reason } }),

  /** Rescheduling moves the slot; the status never changes. */
  proposeReschedule: (id: string, slotStart: string) =>
    post<T.BookingView>(`/me/bookings/${encode(id)}/reschedule`, { body: { slotStart } }),
  acceptReschedule: (id: string) => post<T.BookingView>(`/me/bookings/${encode(id)}/reschedule/accept`),
  declineReschedule: (id: string) => post<T.BookingView>(`/me/bookings/${encode(id)}/reschedule/decline`),
};

export const expertBookings = {
  list: (status?: T.BookingStatus) => get<T.BookingView[]>('/expert/bookings', { query: { status } }),
  /** 409 `payment_required` until the webhook has stamped `paidAt`. */
  confirm: (id: string, recordingConsent?: boolean) =>
    post<T.BookingView>(`/expert/bookings/${encode(id)}/confirm`, { body: { recordingConsent } }),
  decline: (id: string, reason: string) =>
    post<T.BookingView>(`/expert/bookings/${encode(id)}/decline`, { body: { reason } }),
  cancel: (id: string, reason: string) =>
    post<T.BookingView>(`/expert/bookings/${encode(id)}/cancel`, { body: { reason } }),
  join: (id: string) => get<T.JoinCredentials>(`/expert/bookings/${encode(id)}/join`),
  complete: (id: string) => post<T.BookingView>(`/expert/bookings/${encode(id)}/complete`),
  /** No refund is issued. */
  noShow: (id: string, reason?: string) =>
    post<T.BookingView>(`/expert/bookings/${encode(id)}/no-show`, { body: { reason } }),
  setMeetingLink: (id: string, url: string) =>
    put<T.BookingView>(`/expert/bookings/${encode(id)}/meeting-link`, { body: { url } }),
  proposeReschedule: (id: string, slotStart: string) =>
    post<T.BookingView>(`/expert/bookings/${encode(id)}/reschedule`, { body: { slotStart } }),
  acceptReschedule: (id: string) => post<T.BookingView>(`/expert/bookings/${encode(id)}/reschedule/accept`),
  declineReschedule: (id: string) => post<T.BookingView>(`/expert/bookings/${encode(id)}/reschedule/decline`),
};

// ---------------------------------------------------------------------------
// §9 Payments
// ---------------------------------------------------------------------------

export const payments = {
  orders: () => get<T.OrderView[]>('/me/orders'),
  order: (id: string) => get<T.OrderView>(`/me/orders/${encode(id)}`),

  /** Dev-mode capture; only active when SSLCommerz is not configured. */
  mockCapture: (paymentId: string, valId = `val-${Date.now()}`) =>
    post<{ received: boolean; captured?: boolean }>('/public/payments/webhook/MOCK', {
      query: { tran_id: paymentId, val_id: valId, status: 'VALID' },
      anonymous: true,
    }),

  earnings: (currency = 'BDT') => get<T.Earnings>('/expert/earnings', { query: { currency } }),
  /** 404 `payout_method_not_found` -> show the setup form. */
  payoutMethod: () => get<T.PayoutMethod>('/expert/payout-method'),
  savePayoutMethod: (body: { type: 'BANK' | 'BKASH' | 'NAGAD'; accountHolder: string; accountDetails: string }) =>
    put<T.PayoutMethod>('/expert/payout-method', { body }),
  /** Invariant to display: openingBalance + sum(line amounts) = closingBalance. */
  statement: (query: { currency?: string; from?: string; to?: string } = {}) =>
    get<T.Statement>('/expert/finance/statement', { query }),
};

// ---------------------------------------------------------------------------
// §10 Disputes
// ---------------------------------------------------------------------------

export const disputes = {
  open: (body: { subjectType: T.OrderSubjectType; subjectId: string; reason: T.DisputeReason; details: string }) =>
    post<T.DisputeView>('/me/disputes', { body }),
  list: () => get<T.DisputeView[]>('/me/disputes'),
  /** Internal admin notes are filtered out here. */
  get: (id: string) => get<T.DisputeDetail>(`/me/disputes/${encode(id)}`),
  comment: (id: string, body: string) => post<T.CommentView>(`/me/disputes/${encode(id)}/comments`, { body: { body } }),
  withdraw: (id: string) => post<T.DisputeView>(`/me/disputes/${encode(id)}/withdraw`),
};

// ---------------------------------------------------------------------------
// §11 Projects
// ---------------------------------------------------------------------------

export const projects = {
  /** `requirementAnswers` fills the category's `requirementsSchema` form. */
  request: (body: { serviceId: string; requirements: string; requirementAnswers?: Record<string, unknown> }) =>
    post<T.ProjectView>('/me/projects', { body }),
  list: () => get<T.ProjectView[]>('/me/projects'),
  get: (id: string) => get<T.ProjectView>(`/me/projects/${encode(id)}`),
  /** Opens the message thread. */
  accept: (id: string) => post<T.ProjectView>(`/me/projects/${encode(id)}/accept`),
  /** REQUESTED / QUOTED only — an ACCEPTED project needs a dispute instead. */
  cancel: (id: string, reason: string) => post<T.ProjectView>(`/me/projects/${encode(id)}/cancel`, { body: { reason } }),

  /** Escrow. Poll `get(id)` until the milestone reads FUNDED. */
  payMilestone: (id: string, milestoneId: string) =>
    post<T.CheckoutView>(`/me/projects/${encode(id)}/milestones/${encode(milestoneId)}/pay`),
  /** Releases escrow to the expert. 409 `dispute_open` while money is frozen. */
  approveMilestone: (id: string, milestoneId: string) =>
    post<T.ProjectView>(`/me/projects/${encode(id)}/milestones/${encode(milestoneId)}/approve`),

  attachments: (projectId: string) =>
    get<T.ProjectAttachment[]>(`/me/projects/${encode(projectId)}/attachments`),
  addAttachment: (projectId: string, file: File) =>
    post<T.ProjectAttachment>(`/me/projects/${encode(projectId)}/attachments`, { form: filePart(file) }),
  attachmentBlob: (projectId: string, attachmentId: string) =>
    requestBlob(`/me/projects/${encode(projectId)}/attachments/${encode(attachmentId)}`),
  removeAttachment: (projectId: string, attachmentId: string) =>
    del<null>(`/me/projects/${encode(projectId)}/attachments/${encode(attachmentId)}`),
};

export const expertProjects = {
  list: () => get<T.ProjectView[]>('/expert/projects'),
  get: (id: string) => get<T.ProjectView>(`/expert/projects/${encode(id)}`),
  /** Re-quoting REPLACES all milestones — their ids change. */
  quote: (id: string, body: {
    scopeNote?: string;
    currency: string;
    milestones: Array<{ title: string; description?: string; amount: number }>;
  }) => post<T.ProjectView>(`/expert/projects/${encode(id)}/quote`, { body }),
  decline: (id: string, reason: string) =>
    post<T.ProjectView>(`/expert/projects/${encode(id)}/decline`, { body: { reason } }),
  /** FUNDED milestones only. */
  deliverMilestone: (id: string, milestoneId: string, note: string) =>
    post<T.ProjectView>(`/expert/projects/${encode(id)}/milestones/${encode(milestoneId)}/deliver`, { body: { note } }),
};

// ---------------------------------------------------------------------------
// §12 Pilgrimage
// ---------------------------------------------------------------------------

export const pilgrimage = {
  packages: () => get<T.PilgrimagePackageView[]>('/public/pilgrimage/packages', { anonymous: true }),

  /** The traveler list IS the seat count. Unpaid reservations expire in 30 min. */
  reserve: (body: { departureId: string; travelers: Array<{ fullName: string; passportNo: string; dateOfBirth?: string; gender?: string }> }) =>
    post<T.PilgrimageBookingView>('/me/pilgrimage-bookings', { body }),
  list: () => get<T.PilgrimageBookingView[]>('/me/pilgrimage-bookings'),
  get: (id: string) => get<T.PilgrimageBookingView>(`/me/pilgrimage-bookings/${encode(id)}`),
  /** One order for all seats. Poll until the booking reads CONFIRMED. */
  pay: (id: string) => post<T.CheckoutView>(`/me/pilgrimage-bookings/${encode(id)}/pay`),
  cancel: (id: string, reason?: string) =>
    post<T.PilgrimageBookingView>(`/me/pilgrimage-bookings/${encode(id)}/cancel`, { body: { reason } }),
};

export const agency = {
  createPackage: (body: {
    categoryId: string; title: string; description?: string;
    tier: 'VIP' | 'ECONOMY' | 'CUSTOM'; price: number; currency: string;
  }) => post<T.PilgrimagePackageView>('/expert/pilgrimage/packages', { body }),
  packages: () => get<T.PilgrimagePackageView[]>('/expert/pilgrimage/packages'),
  publishPackage: (id: string) => post<T.PilgrimagePackageView>(`/expert/pilgrimage/packages/${encode(id)}/publish`),
  addDeparture: (packageId: string, body: { departureDate: string; returnDate?: string; totalSeats: number }) =>
    post<T.DepartureView>(`/expert/pilgrimage/packages/${encode(packageId)}/departures`, { body }),
  closeDeparture: (departureId: string) =>
    post<T.DepartureView>(`/expert/pilgrimage/departures/${encode(departureId)}/close`),
  /** On or after the date only. Completes every CONFIRMED booking. */
  completeDeparture: (departureId: string) =>
    post<{ departure: T.DepartureView; bookingsCompleted: number }>(`/expert/pilgrimage/departures/${encode(departureId)}/complete`),
  /** FULL passport numbers — treat this screen as sensitive. */
  manifest: (departureId: string) =>
    get<T.ManifestRow[]>(`/expert/pilgrimage/departures/${encode(departureId)}/manifest`),
};

// ---------------------------------------------------------------------------
// §13 Retainers
// ---------------------------------------------------------------------------

export const retainers = {
  plansOf: (expertId: string) =>
    get<T.RetainerPlanView[]>(`/public/experts/${encode(expertId)}/retainer-plans`, { anonymous: true }),

  /** Returns a CHECKOUT, not a retainer: it is usable only after payment. */
  subscribe: (planId: string) => post<T.RetainerCheckout>('/me/retainers', { body: { planId } }),
  list: () => get<T.RetainerView[]>('/me/retainers'),
  /** ACTIVE stacks 30 days; EXPIRED restarts from now. */
  renew: (id: string) => post<T.RetainerCheckout>(`/me/retainers/${encode(id)}/renew`),
  /** No refund — remaining coverage is abandoned. Warn before calling. */
  cancel: (id: string) => post<T.RetainerView>(`/me/retainers/${encode(id)}/cancel`),
};

export const expertRetainers = {
  createPlan: (body: {
    categoryId?: string; title: string; description?: string;
    monthlyPrice: number; currency: string; slaHours: number;
  }) => post<T.RetainerPlanView>('/expert/retainer-plans', { body }),
  plans: () => get<T.RetainerPlanView[]>('/expert/retainer-plans'),
  publishPlan: (planId: string) => post<T.RetainerPlanView>(`/expert/retainer-plans/${encode(planId)}/publish`),
  subscribers: () => get<T.RetainerView[]>('/expert/retainer-plans/subscribers'),
};

// ---------------------------------------------------------------------------
// §14 Messaging
// ---------------------------------------------------------------------------

export const messages = {
  /** Unread lives here — there is no separate messaging unread endpoint. */
  threads: () => get<T.ThreadView[]>('/me/messages/threads'),
  /** Poll with the last id you hold as `after`. */
  read: (threadId: string, after?: number) =>
    get<T.MessageView[]>(`/me/messages/threads/${encode(threadId)}`, { query: { after } }),
  /** Contact info is DELIVERED but auto-flagged to moderation — say so in the UI. */
  send: (threadId: string, body: string) =>
    post<T.MessageView>(`/me/messages/threads/${encode(threadId)}`, { body: { body } }),
  sendAttachment: (threadId: string, file: File) =>
    post<T.MessageView>(`/me/messages/threads/${encode(threadId)}/attachments`, { form: filePart(file) }),
  markRead: (threadId: string) => post<null>(`/me/messages/threads/${encode(threadId)}/read`),
  attachmentBlob: (messageId: number) => requestBlob(`/me/messages/attachments/${messageId}`),
};

// ---------------------------------------------------------------------------
// §15 Notifications
// ---------------------------------------------------------------------------

export const notifications = {
  list: (unreadOnly = false) => get<T.NotificationView[]>('/me/notifications', { query: { unreadOnly } }),
  unreadCount: () => get<{ unread: number }>('/me/notifications/unread-count'),
  markRead: (id: number) => post<null>(`/me/notifications/${id}/read`),
  markAllRead: () => post<null>('/me/notifications/read-all'),
};

// ---------------------------------------------------------------------------
// §16 Support tickets
// ---------------------------------------------------------------------------

export const tickets = {
  /** `retainerId` makes it an SLA ticket bound to that plan's expert. */
  open: (body: { title: string; description: string; retainerId?: string }) =>
    post<T.TicketView>('/me/tickets', { body }),
  list: () => get<T.TicketView[]>('/me/tickets'),
  get: (id: string) => get<T.TicketDetail>(`/me/tickets/${encode(id)}`),
  comment: (id: string, body: string) => post<T.CommentView>(`/me/tickets/${encode(id)}/comments`, { body: { body } }),
  close: (id: string) => post<T.TicketView>(`/me/tickets/${encode(id)}/close`),
  /** From RESOLVED only. */
  reopen: (id: string) => post<T.TicketView>(`/me/tickets/${encode(id)}/reopen`),
};

export const expertTickets = {
  list: () => get<T.TicketView[]>('/expert/tickets'),
  get: (id: string) => get<T.TicketDetail>(`/expert/tickets/${encode(id)}`),
  /** The first PUBLIC reply stops the SLA clock. */
  comment: (id: string, body: string) => post<T.CommentView>(`/expert/tickets/${encode(id)}/comments`, { body: { body } }),
  resolve: (id: string) => post<T.TicketView>(`/expert/tickets/${encode(id)}/resolve`),
};

// ---------------------------------------------------------------------------
// §17 Moderation reports
// ---------------------------------------------------------------------------

export const reports = {
  file: (body: { subjectType: T.ReportSubjectType; subjectId: string; reason: T.ReportReason; details?: string }) =>
    post<T.ReportView>('/me/reports', { body }),
  mine: () => get<T.ReportView[]>('/me/reports'),
};

// ---------------------------------------------------------------------------
// §18 Reviews
// ---------------------------------------------------------------------------

export const reviews = {
  /** Only COMPLETED engagements; there is no "verified purchase" flag to send. */
  create: (body: { subjectType: 'BOOKING' | 'PROJECT'; subjectId: string; rating: number; comment?: string }) =>
    post<T.ReviewView>('/me/reviews', { body }),
  mine: () => get<T.ReviewView[]>('/me/reviews'),
  /** Editable UNTIL the expert replies — hide the button once `expertReply` is set. */
  update: (id: string, body: { rating?: number; comment?: string }) =>
    put<T.ReviewView>(`/me/reviews/${encode(id)}`, { body }),

  /** Non-hidden reviews plus the aggregate, for a public profile page. */
  ofExpert: (expertId: string) =>
    get<T.PublicReviewBlock>(`/public/experts/${encode(expertId)}/reviews`, { anonymous: true }),
};

export const expertReviews = {
  list: () => get<T.ReviewView[]>('/expert/reviews'),
  /** One reply, and it permanently locks the review for the customer. */
  reply: (id: string, body: string) => post<T.ReviewView>(`/expert/reviews/${encode(id)}/reply`, { body: { body } }),
};

// ---------------------------------------------------------------------------
// §19 Clinical notes, prescriptions and dictionaries
// ---------------------------------------------------------------------------

export const clinical = {
  /** Expert side: private + shared, oldest first. Reads are audit-logged. */
  notes: (bookingId: string) => get<T.ClinicalNoteView[]>(`/expert/bookings/${encode(bookingId)}/notes`),
  createNote: (bookingId: string, body: { body: string; sharedWithCustomer?: boolean }) =>
    post<T.ClinicalNoteView>(`/expert/bookings/${encode(bookingId)}/notes`, { body }),
  /** FULL update — omitting `sharedWithCustomer` UN-SHARES the note. */
  updateNote: (bookingId: string, noteId: string, body: { body: string; sharedWithCustomer?: boolean }) =>
    put<T.ClinicalNoteView>(`/expert/bookings/${encode(bookingId)}/notes/${encode(noteId)}`, { body }),
  /** Customer side: shared notes only. An empty list is normal. */
  sharedNotes: (bookingId: string) => get<T.ClinicalNoteView[]>(`/me/bookings/${encode(bookingId)}/notes`),

  prescriptions: (bookingId: string) =>
    get<T.PrescriptionView[]>(`/expert/bookings/${encode(bookingId)}/prescriptions`),
  createPrescription: (bookingId: string, body: Partial<T.PrescriptionView>) =>
    post<T.PrescriptionView>(`/expert/bookings/${encode(bookingId)}/prescriptions`, { body }),
  /** DRAFT only. */
  updatePrescription: (bookingId: string, id: string, body: Partial<T.PrescriptionView>) =>
    put<T.PrescriptionView>(`/expert/bookings/${encode(bookingId)}/prescriptions/${encode(id)}`, { body }),
  /** Computes patientAge, notifies the patient and LOCKS the document forever. */
  issuePrescription: (bookingId: string, id: string) =>
    post<T.PrescriptionView>(`/expert/bookings/${encode(bookingId)}/prescriptions/${encode(id)}/issue`),
  deletePrescription: (bookingId: string, id: string) =>
    del<null>(`/expert/bookings/${encode(bookingId)}/prescriptions/${encode(id)}`),
  /** Patient side: ISSUED only. */
  myPrescriptions: (bookingId: string) =>
    get<T.PrescriptionView[]>(`/me/bookings/${encode(bookingId)}/prescriptions`),

  /** Safe to call per keystroke — under 2 chars returns []. Debounce ~200ms. */
  searchMedicines: (q: string) => get<T.MedicineSuggestion[]>('/expert/medicines/search', { query: { q } }),
  searchInvestigations: (q: string) =>
    get<T.InvestigationSuggestion[]>('/expert/investigations/search', { query: { q } }),
};

// ---------------------------------------------------------------------------
// §20 Recordings
// ---------------------------------------------------------------------------

export const recordings = {
  mine: (bookingId: string) => get<T.RecordingView[]>(`/me/bookings/${encode(bookingId)}/recordings`),
  /** Fetch at PLAY time, never store — the URL lives ~15 minutes. */
  playbackUrl: (bookingId: string, recordingId: string) =>
    get<T.PlaybackUrl>(`/me/bookings/${encode(bookingId)}/recordings/${encode(recordingId)}/url`),

  expert: (bookingId: string) => get<T.RecordingView[]>(`/expert/bookings/${encode(bookingId)}/recordings`),
  expertPlaybackUrl: (bookingId: string, recordingId: string) =>
    get<T.PlaybackUrl>(`/expert/bookings/${encode(bookingId)}/recordings/${encode(recordingId)}/url`),
};

