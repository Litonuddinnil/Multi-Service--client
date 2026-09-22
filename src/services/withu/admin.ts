/**
 * The permission-gated `/admin/**` surface.
 *
 * Every group here is gated by a specific authority (`hasAuthority`), NOT by
 * the ADMIN role — so a screen should decide what to render from the
 * `permissions` array on `/auth/me`, not from `roles`. The comment above each
 * group names the permission the server checks.
 */
import { del, downloadFile, get, post, put, requestText } from './http';
import type * as T from './types';

const encode = encodeURIComponent;

/** §3 — `user:manage`. */
export const users = {
  list: (query: { status?: T.UserStatus; q?: string; page?: number; size?: number } = {}) =>
    get<T.AdminUserView[]>('/admin/users', { query }),
  get: (userId: string) => get<T.AdminUserView>(`/admin/users/${encode(userId)}`),
  /** Suspends AND kills every session. */
  suspend: (userId: string, reason: string) =>
    post<T.AdminUserView>(`/admin/users/${encode(userId)}/suspend`, { body: { reason } }),
  reactivate: (userId: string) => post<T.AdminUserView>(`/admin/users/${encode(userId)}/reactivate`),
  grantRole: (userId: string, roleCode: string) =>
    post<T.AdminUserView>(`/admin/users/${encode(userId)}/roles`, { body: { roleCode } }),
  revokeRole: (userId: string, roleCode: string) =>
    del<T.AdminUserView>(`/admin/users/${encode(userId)}/roles/${encode(roleCode)}`),
  revokeSessions: (userId: string) => post<null>(`/admin/users/${encode(userId)}/revoke-sessions`),
  /** Anonymises in place; the financial trail keeps its references. */
  remove: (userId: string) => del<null>(`/admin/users/${encode(userId)}`),
};

/** §4 — `audit:read`. */
export const audit = {
  search: (query: {
    action?: string; subjectType?: string; subjectId?: string; actorId?: string;
    from?: string; to?: string; page?: number; size?: number;
  } = {}) => get<T.AuditEntry[]>('/admin/audit', { query }),
};

/** §5 — `platform:manage`. History is never edited, only closed and replaced. */
export const taxRules = {
  list: (country?: string) => get<T.TaxRule[]>('/admin/platform/tax-rules', { query: { country } }),
  create: (body: { countryCode: string; categoryId?: string | null; rate: number; validFrom: string }) =>
    post<T.TaxRule>('/admin/platform/tax-rules', { body }),
};

/** §6 — `catalog:manage`. Re-parenting a category is deliberately impossible. */
export const categories = {
  list: () => get<T.AdminCategoryView[]>('/admin/categories'),
  create: (body: { slug: string; kind: T.CategoryKind; parentId?: string; icon?: string; sortOrder?: number }) =>
    post<T.AdminCategoryView>('/admin/categories', { body }),
  /** PATCH-ish: only the fields you send change. */
  update: (id: string, body: Partial<{
    icon: string; sortOrder: number; active: boolean; clinical: boolean;
    engagementType: T.EngagementType;
    bookingMinLeadMinutes: number; bookingResponseMinutes: number; bookingCancellationMinutes: number;
    attributesSchema: string; requirementsSchema: string;
  }>) => put<T.AdminCategoryView>(`/admin/categories/${encode(id)}`, { body }),
  /** Insert-or-replace one locale. */
  setTranslation: (id: string, body: { locale: string; name: string; description?: string }) =>
    put<T.AdminCategoryView>(`/admin/categories/${encode(id)}/translations`, { body }),
};

/** §7 — `expert:verify`. Identity stays masked even here. */
export const experts = {
  queue: (status: T.ExpertStatus = 'SUBMITTED') => get<any[]>('/admin/experts', { query: { status } }),
  get: (expertId: string) => get<any>(`/admin/experts/${encode(expertId)}`),
  startReview: (expertId: string) => post<any>(`/admin/experts/${encode(expertId)}/start-review`),
  /** Grants the EXPERT role — the applicant must refresh their token. */
  approve: (expertId: string) => post<any>(`/admin/experts/${encode(expertId)}/approve`),
  reject: (expertId: string, reason: string) =>
    post<any>(`/admin/experts/${encode(expertId)}/reject`, { body: { reason } }),
  addNote: (expertId: string, note: string) =>
    post<any>(`/admin/experts/${encode(expertId)}/notes`, { body: { note } }),
  reviewDocument: (documentId: string, accepted: boolean, reason?: string) =>
    post<null>(`/admin/experts/documents/${encode(documentId)}/review`, { body: { accepted, reason } }),
  documentUrl: (documentId: string) => `/api/admin/experts/documents/${encode(documentId)}/file`,
  requirements: (categoryId?: string) =>
    get<any>('/admin/experts/requirements', { query: { categoryId } }),
  setRequirements: (categoryId: string, documentTypes: T.DocumentType[]) =>
    put<any>(`/admin/experts/requirements/${encode(categoryId)}`, { body: { documentTypes } }),
  verifyCertification: (certificationId: string, verified: boolean) =>
    post<any>(`/admin/experts/certifications/${encode(certificationId)}/verify`, { body: { verified } }),
};

/** §8 — `booking:manage`. Read-only oversight. */
export const bookings = {
  list: (status?: T.BookingStatus) => get<T.BookingView[]>('/admin/bookings', { query: { status } }),
};

/** §9 — `payment:manage` / `payment:refund`. */
export const finance = {
  orders: (status?: T.OrderStatus) => get<T.AdminOrderView[]>('/admin/orders', { query: { status } }),
  /** `amount: null` refunds the full remaining balance. */
  refund: (body: { orderId: string; amount?: number | null; reason: string }) =>
    post<any>('/admin/refunds', { body }),
  expertBalance: (expertId: string, currency = 'BDT') =>
    get<{ expertId: string; currency: string; balance: number }>(`/admin/experts/${encode(expertId)}/balance`, { query: { currency } }),

  recordPayout: (body: {
    expertId: string; amount: number; currency: string;
    method: 'BANK' | 'BKASH' | 'NAGAD'; reference: string; note?: string;
  }) => post<T.PayoutView>('/admin/payouts', { body }),
  /** ALL-OR-NOTHING: one invalid row rolls back the whole batch. */
  recordPayoutBatch: (payouts: Array<Parameters<typeof finance.recordPayout>[0]>) =>
    post<T.PayoutView[]>('/admin/payouts/batch', { body: { payouts } }),

  /** The payout run's work list. Balances are EARNED money only. */
  payoutsDue: (query: { currency?: string; minAmount?: number } = {}) =>
    get<T.PayoutsDue>('/admin/payouts/due', { query }),
  /** The only endpoint that returns raw account numbers. Every call is audited. */
  downloadPayoutSheet: (query: { currency?: string; minAmount?: number } = {}) =>
    downloadFile('/admin/payouts/due/export', `payouts-${query.currency ?? 'BDT'}.csv`, { query }),

  overview: (query: {
    currency?: string; from?: string; to?: string; minDue?: number;
    sort?: 'due' | 'earned' | 'paid'; page?: number; size?: number;
  } = {}) => get<T.FinanceOverview>('/admin/finance/experts', { query }),
  statement: (expertId: string, query: { currency?: string; from?: string; to?: string } = {}) =>
    get<T.Statement>(`/admin/finance/experts/${encode(expertId)}/statement`, { query }),

  /** Accountant-ready CSVs — no account numbers. */
  downloadOverviewCsv: (query: Record<string, string | number | undefined> = {}) =>
    downloadFile('/admin/finance/experts/export', 'expert-finance.csv', { query }),
  downloadStatementCsv: (expertId: string, query: Record<string, string | number | undefined> = {}) =>
    downloadFile(`/admin/finance/experts/${encode(expertId)}/statement/export`, `statement-${expertId}.csv`, { query }),
  statementCsvText: (expertId: string, query: Record<string, string | number | undefined> = {}) =>
    requestText(`/admin/finance/experts/${encode(expertId)}/statement/export`, { query }),
};

/** §10 — `dispute:manage`. No status defaults to OPEN, oldest first. */
export const disputes = {
  queue: (status?: T.DisputeStatus) => get<T.DisputeView[]>('/admin/disputes', { query: { status } }),
  /** Includes internal notes. */
  get: (id: string) => get<T.DisputeDetail>(`/admin/disputes/${encode(id)}`),
  startReview: (id: string) => post<T.DisputeView>(`/admin/disputes/${encode(id)}/start-review`),
  comment: (id: string, body: string, internal = false) =>
    post<T.CommentView>(`/admin/disputes/${encode(id)}/comments`, { body: { body, internal } }),
  /** FINAL — confirm in the UI first. A second attempt 409s `dispute_closed`. */
  resolve: (id: string, body: { resolution: 'REFUND_CUSTOMER' | 'RELEASE_EXPERT' | 'SPLIT'; refundAmount?: number; note?: string }) =>
    post<T.DisputeView>(`/admin/disputes/${encode(id)}/resolve`, { body }),
};

/** §16 — `support:manage`. No status = ALL tickets (note: reports default to OPEN). */
export const tickets = {
  queue: (status?: T.TicketStatus) => get<T.TicketView[]>('/admin/tickets', { query: { status } }),
  /** Includes internal notes. */
  get: (id: string) => get<T.TicketDetail>(`/admin/tickets/${encode(id)}`),
  /** Self-assign; an OPEN ticket auto-moves to IN_PROGRESS. */
  assign: (id: string) => post<T.TicketView>(`/admin/tickets/${encode(id)}/assign`),
  /** `internal` is honoured ONLY here: it does not notify and does not stop the SLA. */
  comment: (id: string, body: string, internal = false) =>
    post<T.CommentView>(`/admin/tickets/${encode(id)}/comments`, { body: { body, internal } }),
  setStatus: (id: string, to: T.TicketStatus) =>
    post<T.TicketView>(`/admin/tickets/${encode(id)}/status`, { query: { to } }),
};

/** §17 — `content:moderate`. FIFO: no status means OPEN only, OLDEST first. */
export const reports = {
  queue: (status?: 'OPEN' | 'ACTIONED' | 'DISMISSED') =>
    get<T.ReportView[]>('/admin/reports', { query: { status } }),
  dismiss: (id: string, note?: string) =>
    post<T.ReportView>(`/admin/reports/${encode(id)}/dismiss`, { body: { note } }),
  /** Folds every other OPEN report on the same subject into this decision. */
  action: (id: string, action: T.ReportAction, note?: string) =>
    post<T.ReportView>(`/admin/reports/${encode(id)}/action`, { body: { action, note } }),
};

/** §18 — `catalog:manage`. Idempotent; scores also update on every review write. */
export const recommendations = {
  recompute: () => post<{ expertsRecomputed: number }>('/admin/recommendations/recompute'),
};

/** §19 — `clinical:manage`. Additive imports with de-duplication. */
export const clinicalDictionary = {
  importMedicines: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return post<{ imported: number; skipped: number }>('/admin/clinical/medicines/import', { form });
  },
  importInvestigations: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return post<{ imported: number; skipped: number }>('/admin/clinical/investigations/import', { form });
  },
  medicines: (q?: string) => get<T.MedicineSuggestion[]>('/admin/clinical/medicines', { query: { q } }),
  investigations: (q?: string) => get<T.InvestigationSuggestion[]>('/admin/clinical/investigations', { query: { q } }),
  removeMedicine: (id: string) => del<null>(`/admin/clinical/medicines/${encode(id)}`),
  removeInvestigation: (id: string) => del<null>(`/admin/clinical/investigations/${encode(id)}`),
};

/** §22 — `dashboard:view`. The whole back office in one call. */
export const dashboard = {
  get: (query: { currency?: string; days?: number } = {}) =>
    get<T.DashboardView>('/admin/dashboard', { query }),
};
