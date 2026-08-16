import { 
  User, 
  CategoryNode, 
  ExpertProfile, 
  ServiceItem, 
  PilgrimagePackage, 
  RetainerPlan, 
  BookingView, 
  ProjectView, 
  PilgrimageBooking, 
  RetainerSubscription, 
  ConsultationSession,
  OrderItem,
  ProviderLedgerRow,
  PayoutRequest,
  ReviewItem,
  ChatThread,
  MessageItem,
  NotificationItem,
  CommerceProduct,
  PayoutMethod
} from '../types';

import { 
  INITIAL_CATEGORIES 
} from '../constants/categories';

import { 
  INITIAL_EXPERTS, 
  INITIAL_SERVICES, 
  INITIAL_PILGRIMAGE_PACKAGES, 
  INITIAL_RETAINER_PLANS, 
  INITIAL_COMMERCE_PRODUCTS, 
  INITIAL_BOOKINGS, 
  INITIAL_CONSULTATIONS, 
  INITIAL_PROJECTS, 
  INITIAL_ORDERS, 
  INITIAL_LEDGER, 
  INITIAL_REVIEWS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_THREADS, 
  INITIAL_MESSAGES 
} from '../constants/initialData';

const STORAGE_KEYS = {
  USERS: 'withu_users_v1',
  AUTH_USER: 'withu_current_user_v1',
  AUTH_TOKEN: 'withu_auth_token_v1',
  CATEGORIES: 'withu_categories_v1',
  EXPERTS: 'withu_experts_v1',
  SERVICES: 'withu_services_v1',
  PILGRIMAGE_PACKAGES: 'withu_pilgrimage_v1',
  PILGRIMAGE_BOOKINGS: 'withu_pilgrimage_bookings_v1',
  RETAINER_PLANS: 'withu_retainer_plans_v1',
  RETAINER_SUBSCRIPTIONS: 'withu_retainer_subs_v1',
  BOOKINGS: 'withu_bookings_v1',
  PROJECTS: 'withu_projects_v1',
  CONSULTATIONS: 'withu_consultations_v1',
  ORDERS: 'withu_orders_v1',
  LEDGER: 'withu_ledger_v1',
  PAYOUT_REQUESTS: 'withu_payout_requests_v1',
  PAYOUT_METHODS: 'withu_payout_methods_v1',
  REVIEWS: 'withu_reviews_v1',
  THREADS: 'withu_threads_v1',
  MESSAGES: 'withu_messages_v1',
  NOTIFICATIONS: 'withu_notifications_v1',
  COMMERCE_PRODUCTS: 'withu_commerce_v1',
  COMMERCE_ENROLLMENTS: 'withu_enrollments_v1',
  COMMISSION_CONFIG: 'withu_commission_config_v1',
  RECENT_SEARCHES: 'withu_recent_searches_v1',
  IMPERSONATION: 'withu_impersonation_v1'
};

export interface ImpersonationRecord {
  active: boolean;
  originalAdminId: string | null;
  originalAdminName: string | null;
  asUserId: string | null;
  asUserName: string | null;
  startedAt: string | null;
}

const EMPTY_IMPERSONATION: ImpersonationRecord = {
  active: false,
  originalAdminId: null,
  originalAdminName: null,
  asUserId: null,
  asUserName: null,
  startedAt: null,
};

// Initial default registered users
const INITIAL_USERS: User[] = [
  {
    id: 'user-cust-1',
    email: 'mdniloyhasan544@gmail.com',
    name: 'Niloy Hasan (Client User)',
    phone: '01711223344',
    phoneVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    roles: ['CUSTOMER'],
    permissions: [],
    mfaEnabled: false,
    preferredLanguage: 'en',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'active'
  },
  {
    id: 'user-doc-1',
    email: 'dr.tanzim@withu.health',
    name: 'Dr. Tanzim Ahmed (Expert Provider)',
    phone: '01811998877',
    phoneVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    roles: ['CUSTOMER', 'EXPERT'],
    permissions: [],
    mfaEnabled: true,
    preferredLanguage: 'en',
    createdAt: '2026-01-10T09:00:00Z',
    status: 'active'
  },
  {
    id: 'user-admin-1',
    email: 'admin@withu.market',
    name: 'Platform Administrator',
    phone: '01911000000',
    phoneVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80',
    roles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'],
    permissions: ['expert:verify', 'catalog:manage', 'platform:manage', 'payment:manage', 'payment:refund', 'booking:manage', 'cms:manage'],
    mfaEnabled: true,
    preferredLanguage: 'en',
    createdAt: '2025-12-01T00:00:00Z',
    status: 'active'
  }
];

export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set failed', e);
    }
  }

  // Users
  static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  static getCurrentUser(): User | null {
    // Returning null on first visit ensures guests are NOT silently auto-logged-in
    // as a seeded user. The previously default value (INITIAL_USERS[0]) made every
    // first-time visitor appear to be the seeded customer account.
    return this.getItem<User | null>(STORAGE_KEYS.AUTH_USER, null);
  }

  static setCurrentUser(user: User | null): void {
    this.setItem(STORAGE_KEYS.AUTH_USER, user);
    if (user) {
      // Issue a lightweight opaque session token in localStorage. The token is
      // demo-only; in production it should be rotated by the backend.
      const token = `local-${user.id}-${Date.now().toString(36)}`;
      this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch {
        /* ignore quota/privacy errors */
      }
    }
  }

  static getAuthToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }

  // --- Impersonation (admin "act-as" sessions) ---
  static getImpersonation(): ImpersonationRecord {
    return this.getItem<ImpersonationRecord>(STORAGE_KEYS.IMPERSONATION, EMPTY_IMPERSONATION);
  }

  static setImpersonation(record: ImpersonationRecord): void {
    this.setItem(STORAGE_KEYS.IMPERSONATION, record);
  }

  static clearImpersonation(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATION);
    } catch {
      /* ignore quota / privacy errors */
    }
  }

  // Categories
  static getCategories(): CategoryNode[] {
    return this.getItem<CategoryNode[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  static saveCategories(categories: CategoryNode[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  // Experts
  static getExperts(): ExpertProfile[] {
    return this.getItem<ExpertProfile[]>(STORAGE_KEYS.EXPERTS, INITIAL_EXPERTS);
  }

  static saveExperts(experts: ExpertProfile[]): void {
    this.setItem(STORAGE_KEYS.EXPERTS, experts);
  }

  // Services
  static getServices(): ServiceItem[] {
    return this.getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }

  static saveServices(services: ServiceItem[]): void {
    this.setItem(STORAGE_KEYS.SERVICES, services);
  }

  // Pilgrimage Packages
  static getPilgrimagePackages(): PilgrimagePackage[] {
    return this.getItem<PilgrimagePackage[]>(STORAGE_KEYS.PILGRIMAGE_PACKAGES, INITIAL_PILGRIMAGE_PACKAGES);
  }

  static savePilgrimagePackages(pkgs: PilgrimagePackage[]): void {
    this.setItem(STORAGE_KEYS.PILGRIMAGE_PACKAGES, pkgs);
  }

  // Pilgrimage Bookings
  static getPilgrimageBookings(): PilgrimageBooking[] {
    return this.getItem<PilgrimageBooking[]>(STORAGE_KEYS.PILGRIMAGE_BOOKINGS, []);
  }

  static savePilgrimageBookings(bks: PilgrimageBooking[]): void {
    this.setItem(STORAGE_KEYS.PILGRIMAGE_BOOKINGS, bks);
  }

  // Retainers
  static getRetainerPlans(): RetainerPlan[] {
    return this.getItem<RetainerPlan[]>(STORAGE_KEYS.RETAINER_PLANS, INITIAL_RETAINER_PLANS);
  }

  static saveRetainerPlans(plans: RetainerPlan[]): void {
    this.setItem(STORAGE_KEYS.RETAINER_PLANS, plans);
  }

  static getRetainerSubscriptions(): RetainerSubscription[] {
    return this.getItem<RetainerSubscription[]>(STORAGE_KEYS.RETAINER_SUBSCRIPTIONS, []);
  }

  static saveRetainerSubscriptions(subs: RetainerSubscription[]): void {
    this.setItem(STORAGE_KEYS.RETAINER_SUBSCRIPTIONS, subs);
  }

  // Bookings
  static getBookings(): BookingView[] {
    return this.getItem<BookingView[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  }

  static saveBookings(bookings: BookingView[]): void {
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);
  }

  // Projects
  static getProjects(): ProjectView[] {
    return this.getItem<ProjectView[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  static saveProjects(projects: ProjectView[]): void {
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  // Consultations (with server-authoritative timestamps)
  static getConsultations(): ConsultationSession[] {
    return this.getItem<ConsultationSession[]>(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
  }

  static saveConsultations(consultations: ConsultationSession[]): void {
    this.setItem(STORAGE_KEYS.CONSULTATIONS, consultations);
  }

  // Orders & Financials
  static getOrders(): OrderItem[] {
    return this.getItem<OrderItem[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  static saveOrders(orders: OrderItem[]): void {
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  static getLedger(): ProviderLedgerRow[] {
    return this.getItem<ProviderLedgerRow[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
  }

  static saveLedger(ledger: ProviderLedgerRow[]): void {
    this.setItem(STORAGE_KEYS.LEDGER, ledger);
  }

  static getPayoutMethods(): PayoutMethod[] {
    return this.getItem<PayoutMethod[]>(STORAGE_KEYS.PAYOUT_METHODS, [
      {
        id: 'pm-1',
        type: 'BKASH',
        accountHolderName: 'Dr. Tanzim Ahmed',
        accountNumberMasked: '018*****877',
        isDefault: true
      },
      {
        id: 'pm-2',
        type: 'BANK',
        accountHolderName: 'NexusCloud Technologies Ltd',
        accountNumberMasked: '102*******891',
        bankName: 'City Bank PLC',
        branchName: 'Banani Branch',
        isDefault: true
      }
    ]);
  }

  static savePayoutMethods(methods: PayoutMethod[]): void {
    this.setItem(STORAGE_KEYS.PAYOUT_METHODS, methods);
  }

  static getPayoutRequests(): PayoutRequest[] {
    return this.getItem<PayoutRequest[]>(STORAGE_KEYS.PAYOUT_REQUESTS, [
      {
        id: 'po-1',
        payoutNumber: 'WU-PO-77481',
        expertId: 'exp-doc-1',
        expertName: 'Dr. Tanzim Ahmed',
        amountBDT: 15000,
        payoutMethod: {
          id: 'pm-1',
          type: 'BKASH',
          accountHolderName: 'Dr. Tanzim Ahmed',
          accountNumberMasked: '018*****877',
          isDefault: true
        },
        status: 'PAID',
        transactionReference: 'BK-DISBURSE-884910',
        requestedAt: '2026-02-01T10:00:00Z',
        processedAt: '2026-02-02T11:30:00Z'
      }
    ]);
  }

  static savePayoutRequests(requests: PayoutRequest[]): void {
    this.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, requests);
  }

  // Reviews
  static getReviews(): ReviewItem[] {
    return this.getItem<ReviewItem[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  }

  static saveReviews(reviews: ReviewItem[]): void {
    this.setItem(STORAGE_KEYS.REVIEWS, reviews);
  }

  // Notifications
  static getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static saveNotifications(notifs: NotificationItem[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Chat Threads & Messages
  static getThreads(): ChatThread[] {
    return this.getItem<ChatThread[]>(STORAGE_KEYS.THREADS, INITIAL_THREADS);
  }

  static saveThreads(threads: ChatThread[]): void {
    this.setItem(STORAGE_KEYS.THREADS, threads);
  }

  static getMessages(): MessageItem[] {
    return this.getItem<MessageItem[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  }

  static saveMessages(messages: MessageItem[]): void {
    this.setItem(STORAGE_KEYS.MESSAGES, messages);
  }

  // Commerce Products
  static getCommerceProducts(): CommerceProduct[] {
    return this.getItem<CommerceProduct[]>(STORAGE_KEYS.COMMERCE_PRODUCTS, INITIAL_COMMERCE_PRODUCTS);
  }

  static getCommerceEnrollments(): { productId: string; enrolledAt: string }[] {
    return this.getItem(STORAGE_KEYS.COMMERCE_ENROLLMENTS, [
      { productId: 'prod-mern-course', enrolledAt: '2026-02-01T10:00:00Z' }
    ]);
  }

  static saveCommerceEnrollments(enrollments: { productId: string; enrolledAt: string }[]): void {
    this.setItem(STORAGE_KEYS.COMMERCE_ENROLLMENTS, enrollments);
  }

  // Default platform commission rates
  static getCommissionConfig(): { defaultRate: number; categoryRates: Record<string, number> } {
    return this.getItem(STORAGE_KEYS.COMMISSION_CONFIG, {
      defaultRate: 0.12, // 12% default
      categoryRates: {
        'cat-healthcare': 0.12,
        'cat-it-digital': 0.15,
        'cat-hajj-umrah': 0.10,
        'cat-engineering': 0.15,
        'cat-ruqyah-tibbe': 0.10,
        'cat-career-education': 0.12,
        'cat-legal': 0.15,
        'cat-commerce': 0.15
      }
    });
  }

  static saveCommissionConfig(config: { defaultRate: number; categoryRates: Record<string, number> }): void {
    this.setItem(STORAGE_KEYS.COMMISSION_CONFIG, config);
  }

  static getCommissions(): { categoryId: string; categoryName: string; platformFeePercent: number }[] {
    const config = this.getCommissionConfig();
    const categories = this.getCategories();
    return categories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.nameEn,
      platformFeePercent: (config.categoryRates[cat.id] || config.defaultRate) * 100
    }));
  }

  static saveCommissions(commissions: { categoryId: string; categoryName: string; platformFeePercent: number }[]): void {
    const config = this.getCommissionConfig();
    commissions.forEach(c => {
      config.categoryRates[c.categoryId] = c.platformFeePercent / 100;
    });
    this.saveCommissionConfig(config);
  }

  static updateExpertStatus(expertId: string, status: any): void {
    const experts = this.getExperts();
    const found = experts.find(e => e.id === expertId);
    if (found) {
      found.status = status;
      found.updatedAt = new Date().toISOString();
      this.saveExperts(experts);
    }
  }

  /**
   * F3 KYC onboarding — upsert an expert profile submitted via the wizard.
   * Returns the persisted record. Idempotent on `userId` so re-submissions
   * (e.g. after admin rejection) update in place instead of duplicating.
   */
  static createExpert(profile: ExpertProfile): ExpertProfile {
    const experts = this.getExperts();
    const nowIso = new Date().toISOString();
    const existingIdx = experts.findIndex((e) => e.userId === profile.userId);

    if (existingIdx >= 0) {
      const merged: ExpertProfile = {
        ...experts[existingIdx],
        ...profile,
        id: experts[existingIdx].id,
        createdAt: experts[existingIdx].createdAt,
        updatedAt: nowIso,
      };
      experts[existingIdx] = merged;
      this.saveExperts(experts);
      return merged;
    }

    const created: ExpertProfile = {
      ...profile,
      id: profile.id || `expert-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    experts.push(created);
    this.saveExperts(experts);
    return created;
  }

  // --- RECENT SEARCHES ---
  static getRecentSearches(): string[] {
    return this.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES, [
      'Telemedicine Doctor',
      'Structural Engineer BNBC',
      'Corporate Lawyer',
      'Hajj Package 2026'
    ]);
  }

  static saveRecentSearches(searches: string[]): void {
    this.setItem(STORAGE_KEYS.RECENT_SEARCHES, searches);
  }

  static addRecentSearch(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed) return this.getRecentSearches();
    const current = this.getRecentSearches().filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...current].slice(0, 10);
    this.saveRecentSearches(updated);
    return updated;
  }

  static removeRecentSearch(query: string): string[] {
    const updated = this.getRecentSearches().filter(q => q.toLowerCase() !== query.trim().toLowerCase());
    this.saveRecentSearches(updated);
    return updated;
  }

  static clearRecentSearches(): void {
    this.saveRecentSearches([]);
  }

  // --- FULL-STACK SERVER & MONGODB / DYNAMIC JSON SYNC ---
  static async syncWithServer(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return false;

      // Hydrate collections from server dynamic JSON / MongoDB
      const [usersRes, expertsRes, servicesRes, bookingsRes, projectsRes, ordersRes] = await Promise.allSettled([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/experts').then(r => r.json()),
        fetch('/api/services').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/orders').then(r => r.json())
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
        this.saveUsers(usersRes.value);
      }
      if (expertsRes.status === 'fulfilled' && Array.isArray(expertsRes.value) && expertsRes.value.length > 0) {
        this.saveExperts(expertsRes.value);
      }
      if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) && servicesRes.value.length > 0) {
        this.saveServices(servicesRes.value);
      }
      if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value)) {
        this.saveBookings(bookingsRes.value);
      }
      if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value)) {
        this.saveProjects(projectsRes.value);
      }
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        this.saveOrders(ordersRes.value);
      }

      console.log('🔄 [StorageService] Client synced with Server Dynamic JSON / MongoDB store.');
      return true;
    } catch (e) {
      console.warn('⚠️ [StorageService] Running in local offline/cached mode:', e);
      return false;
    }
  }
}
