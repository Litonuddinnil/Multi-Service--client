/**
 * `withuApi` — the single entry point for the withU backend.
 *
 *   import { withuApi, ApiError } from '../services/withu';
 *
 *   const page = await withuApi.catalog.search({ q: 'cardiology', size: 20 });
 *   await withuApi.admin.dashboard.get({ currency: 'BDT', days: 30 });
 *
 * Section numbers in the sub-modules match API_REFERENCE.md, so any question
 * about a rule ("when does escrow release?", "who can edit a review?") has
 * exactly one place to be answered.
 */
import * as api from './api';
import * as admin from './admin';
import { session } from './session';

export const withuApi = {
  /** §1 */ auth: api.auth,
  /** §2 */ account: api.account,
  /** §5 */ platform: api.platform,
  /** §6 */ catalog: api.catalog,
  expertServices: api.expertServices,
  expertAvailability: api.expertAvailability,
  /** §7 */ expertProfile: api.expertProfile,
  /** §8 */ bookings: api.bookings,
  expertBookings: api.expertBookings,
  /** §9 */ payments: api.payments,
  /** §10 */ disputes: api.disputes,
  /** §11 */ projects: api.projects,
  expertProjects: api.expertProjects,
  /** §12 */ pilgrimage: api.pilgrimage,
  agency: api.agency,
  /** §13 */ retainers: api.retainers,
  expertRetainers: api.expertRetainers,
  /** §14 */ messages: api.messages,
  /** §15 */ notifications: api.notifications,
  /** §16 */ tickets: api.tickets,
  expertTickets: api.expertTickets,
  /** §17 */ reports: api.reports,
  /** §18 */ reviews: api.reviews,
  expertReviews: api.expertReviews,
  /** §19 */ clinical: api.clinical,
  /** §20 */ recordings: api.recordings,
  /** §3–§5, §16–§19, §22 */ admin,
  /** Sign-in / sign-out helpers that own the stored token pair. */
  session,
};

export { ApiError, downloadFile } from './http';
export * from './types';
export type { ServiceInput } from './api';
