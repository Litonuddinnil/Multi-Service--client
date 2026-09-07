import { StorageService } from './storage';
import { apiBase } from '../config/apiBase';
import { 
  User, 
  UserRole,
  Permission,
  CategoryNode, 
  ExpertProfile, 
  ServiceItem, 
  BookingView, 
  ProjectView, 
  PilgrimageBooking, 
  RetainerSubscription, 
  ConsultationSession, 
  OrderItem, 
  ReviewItem, 
  ChatThread, 
  MessageItem, 
  NotificationItem, 
  PayoutRequest, 
  PayoutMethod,
  ProviderLedgerRow,
  PilgrimagePackage, 
  RetainerPlan, 
  CommerceProduct,
  CmsBlogPost,
  CmsFaqItem,
  CommissionConfig
} from '../types';

export class ApiService {
  // --- AUTH & USER ---
  static async getCurrentUser(): Promise<User | null> {
    return StorageService.getCurrentUser();
  }

  /**
   * Sign in.
   *
   * Server first: `POST /auth/login` returns the JWT pair that every
   * permission-gated route needs (expert approval among them), and
   * `GET /me/profile` rehydrates the account behind it.
   *
   * We only fall back to the local fixture login when the server is
   * *unreachable*. A 401/403 from a running server is returned as-is —
   * falling back there would let a wrong password through, because the
   * fixture path below authenticates on the email alone.
   */
  static async login(email: string, password?: string): Promise<{ user?: User; error?: string; errorCode?: string }> {
    if (password) {
      let reachedServer = false;
      try {
        const res = await fetch(`${apiBase()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        reachedServer = true;

        if (res.ok) {
          const tokens = await res.json();
          StorageService.setSession(tokens.accessToken, tokens.refreshToken);

          const me = await fetch(`${apiBase()}/api/me/profile`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });
          if (me.ok) {
            const { user } = await me.json();
            StorageService.setCurrentUser(user);
            // Mirror into the local user table so offline reads agree with
            // the server about roles and status.
            const users = StorageService.getUsers();
            const idx = users.findIndex(u => u.id === user.id);
            if (idx >= 0) users[idx] = { ...users[idx], ...user };
            else users.push(user);
            StorageService.saveUsers(users);
            return { user };
          }
          // Token issued but the profile read failed — drop the half-session.
          StorageService.clearSession();
        } else {
          const problem = await res.json().catch(() => null);
          const code = problem?.code as string | undefined;
          if (code === 'mfa_required') {
            const local = StorageService.getUsers().find(
              u => u.email.toLowerCase() === email.toLowerCase(),
            );
            return { user: local, errorCode: 'mfa_required', error: 'MFA required.' };
          }
          return {
            errorCode: code || 'invalid_credentials',
            error: problem?.detail || 'Incorrect email or password.',
          };
        }
      } catch {
        // Network failure — fall through to the offline fixture login.
      }
      if (reachedServer) {
        return { errorCode: 'invalid_credentials', error: 'Incorrect email or password.' };
      }
    }

    const users = StorageService.getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return { errorCode: 'invalid_credentials', error: 'Incorrect email or password.' };
    }

    if (found.status === 'locked') {
      return { errorCode: 'account_temporarily_locked', error: 'Account temporarily locked. Try again later.' };
    }

    if (found.mfaEnabled) {
      return { user: found, errorCode: 'mfa_required', error: 'MFA required.' };
    }

    StorageService.setCurrentUser(found);
    return { user: found };
  }

  static async verifyMfa(userId: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = StorageService.getUsers();
    const found = users.find(u => u.id === userId);
    if (!found) return { success: false, error: 'User not found' };
    
    // In demo environment, 6 digits or recovery code
    if (code.length === 6 || code.includes('-')) {
      StorageService.setCurrentUser(found);
      return { success: true, user: found };
    }
    return { success: false, error: 'Invalid MFA verification code' };
  }

  static async register(name: string, email: string, phone?: string): Promise<{ success: boolean; user: User }> {
    const users = StorageService.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      StorageService.setCurrentUser(existing);
      return { success: true, user: existing };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      phone,
      phoneVerified: false,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80`,
      roles: ['CUSTOMER'],
      permissions: [],
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    users.push(newUser);
    StorageService.saveUsers(users);
    StorageService.setCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  /** Self-service sign-up: never mints an admin, and never overwrites an existing account. */
  static async registerWithRole(data: {
    name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'EXPERT';
    profession?: string;
    specialization?: string;
    licenseNumber?: string;
    consultationFeeBDT?: number;
    avatarUrl?: string;
    /** Defaults to 'reject', the safe choice for password sign-up. */
    onExisting?: 'reject' | 'reuse';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = StorageService.getUsers();
    let existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());

    if (existing) {
      if (data.onExisting !== 'reuse') {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }
      // Returned untouched, since re-deriving roles would demote an expert on every SSO sign-in.
      StorageService.setCurrentUser(existing);
      return { success: true, user: existing };
    }

    const roles: UserRole[] = data.role === 'EXPERT' ? ['EXPERT', 'CUSTOMER'] : ['CUSTOMER'];

    // A self-registered account starts with no elevated permissions.
    const permissions: Permission[] = [];

    const userId = `user-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: data.email,
      name: data.name,
      phone: data.phone || '01700000000',
      phoneVerified: true,
      avatarUrl: data.avatarUrl || (data.role === 'EXPERT'
        ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'),
      roles,
      permissions,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    users.push(newUser);
    StorageService.saveUsers(users);

    // If EXPERT role, register/update their expert profile and default service
    if (data.role === 'EXPERT') {
      const experts = StorageService.getExperts();
      const expertId = `exp-${userId}`;
      const existingExpIdx = experts.findIndex(e => e.userId === userId);

      const expProfile: ExpertProfile = {
        id: expertId,
        userId: userId,
        displayName: data.name,
        vendorType: 'INDIVIDUAL',
        primaryCategoryId: 'cat-healthcare',
        profession: data.profession || 'Specialist Consultant',
        specialization: data.specialization || 'General Consultation',
        yearsOfExperience: 5,
        bio: `${data.name} is a verified specialist on withU platform, dedicated to providing trusted consultations under milestone escrow protection.`,
        avatarUrl: newUser.avatarUrl || '',
        consultationModes: ['CHAT', 'CALL', 'VIDEO'],
        officialLicenseNumber: data.licenseNumber || 'REG-BD-' + Math.floor(100000 + Math.random() * 900000),
        verificationBody: data.profession?.toLowerCase().includes('doc') ? 'BMDC Bangladesh' : data.profession?.toLowerCase().includes('eng') ? 'IEB / RAJUK' : 'Bar Council / Govt Registry',
        skills: [data.specialization || 'Consultation', 'Advisory', 'Tele-Consultation'],
        educations: [{ institution: 'University of Dhaka / Medical College', degree: 'Professional Degree', fieldOfStudy: data.specialization || 'General', year: 2018 }],
        experiences: [{ company: 'Apex Specialist Chambers', role: data.profession || 'Senior Consultant', fromYear: 2019, current: true }],
        certifications: [{ title: 'Certified Practitioner License', issuer: 'National Licensing Authority', year: 2020, isVerified: true }],
        documents: [],
        status: 'APPROVED',
        categoryLocked: false,
        reviewerNotes: [],
        rating: 4.9,
        reviewCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingExpIdx >= 0) {
        experts[existingExpIdx] = expProfile;
      } else {
        experts.push(expProfile);
      }
      StorageService.saveExperts(experts);

      // Create a service item for this expert
      const services = StorageService.getServices();
      const serviceId = `srv-${userId}`;
      if (!services.some(s => s.id === serviceId)) {
        services.push({
          id: serviceId,
          expertId: expertId,
          expertName: data.name,
          expertAvatar: newUser.avatarUrl || '',
          isExpertVerified: true,
          vendorType: 'INDIVIDUAL',
          title: `${data.profession || 'Specialist'}: ${data.specialization || 'Consultation'} with ${data.name}`,
          slug: `specialist-${userId}`,
          categoryId: 'cat-healthcare',
          categoryName: 'Healthcare & Doctor Consultation',
          engagementType: 'SESSION',
          description: `Book real-time video consultation or in-person chamber session with verified specialist ${data.name}. Escrow protected.`,
          coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
          attributes: {},
          packages: [
            {
              id: `pkg-1-${userId}`,
              serviceId: serviceId,
              title: 'Standard 1-on-1 Consultation',
              description: 'Real-time video session with official prescription',
              pricingType: 'SESSION',
              durationMinutes: 30,
              priceBDT: data.consultationFeeBDT || 1200,
              features: ['1-on-1 Encrypted Video Call', 'BMDC Format e-Prescription', 'Follow-up Chat'],
              isBookable: true
            }
          ],
          status: 'PUBLISHED',
          rating: 4.9,
          reviewCount: 8,
          startingPriceBDT: data.consultationFeeBDT || 1200,
          consultationMode: 'ONLINE',
          createdAt: new Date().toISOString()
        });
        StorageService.saveServices(services);
      }
    }

    StorageService.setCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  static async getAllUsersWithStats(): Promise<Array<User & {
    totalSpentBDT: number;
    totalEarnedBDT: number;
    escrowHeldBDT: number;
    appointmentsCount: number;
    projectsCount: number;
    expertProfile?: ExpertProfile;
  }>> {
    const users = StorageService.getUsers();
    const bookings = StorageService.getBookings();
    const projects = StorageService.getProjects();
    const experts = StorageService.getExperts();
    const orders = StorageService.getOrders();

    return users.map(user => {
      // User bookings & projects as client
      const userBookings = bookings.filter(b => b.customerId === user.id);
      const userProjects = projects.filter(p => p.customerId === user.id);
      const userOrders = orders.filter(o => o.customerId === user.id);

      // User as expert
      const expertProf = experts.find(e => e.userId === user.id || e.id === user.id);
      const expertBookings = expertProf ? bookings.filter(b => b.expertId === expertProf.id) : [];
      const expertProjects = expertProf ? projects.filter(p => p.expertId === expertProf.id) : [];

      const totalSpentBDT = userOrders.reduce((sum, o) => sum + (o.totalAmountBDT || o.grossAmountBDT || 0), 0);
      const totalEarnedBDT = expertBookings.reduce((sum, b) => sum + (b.providerNetBDT || Math.round(b.priceBDT * 0.88)), 0);

      const escrowHeldBDT = userProjects.reduce((sum, p) => {
        const heldMilestones = p.milestones.filter(m => m.status === 'FUNDED' || m.status === 'DELIVERED');
        return sum + heldMilestones.reduce((mSum, m) => mSum + m.amountBDT, 0);
      }, 0);

      return {
        ...user,
        totalSpentBDT,
        totalEarnedBDT,
        escrowHeldBDT,
        appointmentsCount: userBookings.length + expertBookings.length,
        projectsCount: userProjects.length + expertProjects.length,
        expertProfile: expertProf
      };
    });
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User }> {
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { success: false };

    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    StorageService.saveUsers(users);

    const currentUser = StorageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      StorageService.setCurrentUser(updated);
    }
    return { success: true, user: updated };
  }

  static async deleteUser(userId: string): Promise<{ success: boolean }> {
    let users = StorageService.getUsers();
    users = users.filter(u => u.id !== userId);
    StorageService.saveUsers(users);
    return { success: true };
  }

  static async logout(): Promise<void> {
    StorageService.setCurrentUser(null);
    StorageService.clearSession();
  }

  /**
   * Rotate the access token so freshly-granted roles take effect.
   *
   * Role and permission gates read the JWT *claims*, not the live account —
   * so an expert approved a moment ago still carries a pre-approval token
   * without the EXPERT role. Refresh tokens are single-use: a successful
   * call returns a new pair and invalidates the old one, so never call this
   * concurrently with itself.
   *
   * Returns the refreshed user, or null when there is no server session.
   */
  static async refreshSession(): Promise<User | null> {
    const refreshToken = StorageService.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${apiBase()}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // A rotated/revoked refresh token is unrecoverable — clear it so the
        // app stops retrying and the user is asked to sign in again.
        if (res.status === 401) StorageService.clearSession();
        return null;
      }

      const tokens = await res.json();
      StorageService.setSession(tokens.accessToken, tokens.refreshToken);

      const me = await fetch(`${apiBase()}/api/me/profile`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!me.ok) return null;

      const { user } = await me.json();
      StorageService.setCurrentUser(user);
      return user as User;
    } catch {
      return null;
    }
  }

  static async switchActiveRole(role: 'CUSTOMER' | 'EXPERT' | 'ADMIN'): Promise<User | null> {
    const users = StorageService.getUsers();
    let target = users.find(u => u.roles.includes(role));
    if (!target) {
      target = users[0];
    }
    StorageService.setCurrentUser(target);
    return target;
  }

  // --- CATEGORIES ---
  static async getCategories(): Promise<CategoryNode[]> {
    return StorageService.getCategories();
  }

  static async saveCategory(category: CategoryNode): Promise<CategoryNode> {
    const categories = StorageService.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    StorageService.saveCategories(categories);
    return category;
  }

  // --- EXPERTS ---
  static async getExperts(categoryId?: string): Promise<ExpertProfile[]> {
    let experts = StorageService.getExperts().filter(e => e.status === 'APPROVED');
    if (categoryId) {
      experts = experts.filter(e => e.primaryCategoryId === categoryId);
    }
    return experts;
  }

  static async getExpertById(id: string): Promise<ExpertProfile | null> {
    const experts = StorageService.getExperts();
    return experts.find(e => e.id === id) || null;
  }

  /**
   * Resolve the expert profile owned by a signed-in user, whatever its
   * review status. The expert dashboard needs this so a SUBMITTED applicant
   * still sees their own agreement while compliance reviews it — unlike
   * getExperts(), which only ever returns APPROVED profiles.
   */
  static async getExpertByUserId(userId: string): Promise<ExpertProfile | null> {
    if (!userId) return null;

    // Server first: /experts/{id} resolves by expert id OR user id, and is
    // public, so the portal gate can read the authoritative review status
    // without a token. Mirror the result so an offline reload still gates
    // correctly instead of silently opening the portal.
    try {
      const res = await fetch(`${apiBase()}/api/experts/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const expert: ExpertProfile = await res.json();
        if (expert?.id) {
          const experts = StorageService.getExperts();
          const idx = experts.findIndex(e => e.id === expert.id);
          if (idx >= 0) experts[idx] = expert;
          else experts.unshift(expert);
          StorageService.saveExperts(experts);
          return expert;
        }
      }
    } catch {
      // Offline / server down — fall through to the local mirror.
    }

    const experts = StorageService.getExperts();
    return experts.find(e => e.userId === userId) || null;
  }

  /**
   * Every expert on the platform, whatever their review status — the admin
   * KYC queue. `GET /api/experts` is unfiltered, so the queue sees SUBMITTED
   * applications the public catalogue never returns.
   */
  static async getAllExpertsForReview(): Promise<ExpertProfile[]> {
    try {
      const res = await fetch(`${apiBase()}/api/experts`);
      if (res.ok) {
        const experts: ExpertProfile[] = await res.json();
        if (Array.isArray(experts)) {
          StorageService.saveExperts(experts);
          return experts;
        }
      }
    } catch {
      // Offline — the console falls back to the local mirror below.
    }
    return StorageService.getExperts();
  }

  static async submitExpertOnboarding(
    data: Partial<ExpertProfile> & {
      consultationFeeBDT?: number;
      payoutMethod?: {
        type: 'BKASH' | 'NAGAD' | 'BANK';
        accountHolderName?: string;
        accountNumber?: string;
        bankName?: string;
      };
    }
  ): Promise<{ success: boolean; expert: ExpertProfile }> {
    const user = StorageService.getCurrentUser();
    const userId = data.userId || (user ? user.id : `user-${Date.now()}`);

    // 1. Try the real server endpoint first.
    try {
      const res = await fetch(`${apiBase()}/api/experts/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId })
      });
      if (res.ok) {
        const json = await res.json();
        const expert: ExpertProfile = json.expert;
        // Mirror to local cache so the wizard success screen, expert portal,
        // and admin KYC queue all see the latest record without a refresh.
        const experts = StorageService.getExperts();
        const idx = experts.findIndex(e => e.userId === expert.userId);
        if (idx >= 0) experts[idx] = expert; else experts.unshift(expert);
        StorageService.saveExperts(experts);
        return { success: true, expert };
      }
    } catch {
      // Fall through to local fallback below.
    }

    // 2. Local fallback (offline / dev mode where the fetch fails).
    const now = new Date().toISOString();
    const newExpert: ExpertProfile = {
      id: `exp-${Date.now()}`,
      userId,
      displayName: data.displayName || 'Applicant',
      vendorType: data.vendorType || 'INDIVIDUAL',
      primaryCategoryId: data.primaryCategoryId || 'cat-healthcare',
      profession: data.profession || 'Professional',
      specialization: data.specialization || '',
      yearsOfExperience: data.yearsOfExperience || 1,
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      consultationModes:
        data.consultationModes && data.consultationModes.length > 0
          ? data.consultationModes
          : ['CHAT'],
      consultationFeeBDT: data.consultationFeeBDT,
      officialLicenseNumber: data.officialLicenseNumber,
      verificationBody: data.verificationBody,
      idType: data.idType,
      idNumberMasked: data.idNumberMasked,
      orgLegalName: data.orgLegalName,
      address: data.address,
      portfolioUrl: data.portfolioUrl,
      linkedinUrl: data.linkedinUrl,
      agreement: data.agreement,
      skills: data.skills || [],
      educations: data.educations || [],
      experiences: data.experiences || [],
      certifications: data.certifications || [],
      documents: data.documents || [],
      status: 'SUBMITTED',
      categoryLocked: true,
      reviewerNotes: [
        {
          id: `rev-${Date.now()}`,
          authorId: 'system',
          authorName: 'System',
          note: 'Application submitted and queued for compliance verification.',
          action: 'SUBMITTED',
          createdAt: now
        }
      ],
      rating: 5.0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const experts = StorageService.getExperts();
    const idx = experts.findIndex(e => e.userId === newExpert.userId);
    if (idx >= 0) experts[idx] = newExpert; else experts.push(newExpert);
    StorageService.saveExperts(experts);

    // Notify Admins
    const notifs = StorageService.getNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-admin-1',
      title: 'New Expert Application Submitted',
      message: `${newExpert.displayName} applied for category ${newExpert.primaryCategoryId}.`,
      type: 'VERIFICATION',
      entityUrl: '/admin/kyc',
      isRead: false,
      createdAt: now
    });
    StorageService.saveNotifications(notifs);

    return { success: true, expert: newExpert };
  }



  /**
   * Compliance decision on an expert application (the admin KYC queue).
   *
   * This is the single place a provider's review state changes, so it also
   * does the three things that must happen alongside the status flip:
   *   1. append a `ReviewerNote` so the decision has an audit trail,
   *   2. grant the EXPERT role on approval — a customer who onboarded later
   *      would otherwise be approved but still unable to reach the portal,
   *   3. notify the applicant so they know to come back.
   *
   * `reason` is required for REJECTED/SUSPENDED: the expert is shown it on
   * their dashboard so they know what to fix before re-submitting.
   */
  static async reviewExpertApplication(input: {
    expertId: string;
    action: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'SUSPENDED';
    reason?: string;
    reviewerId?: string;
    reviewerName?: string;
  }): Promise<{ success: boolean; expert: ExpertProfile | null }> {
    // Server first. /admin/experts/{id}/{approve,reject} is the authoritative
    // transition: it grants the EXPERT role, writes the verification history
    // and records an audit entry. It is permission-gated (`expert:verify`),
    // so it only succeeds once the console holds a real access token; without
    // one we fall through to the local mirror below and the same decision is
    // applied client-side.
    const token = StorageService.getAuthToken();
    if (token) {
      const path =
        input.action === 'APPROVED'
          ? 'approve'
          : input.action === 'REJECTED'
            ? 'reject'
            : input.action === 'UNDER_REVIEW'
              ? 'start-review'
              : null;
      if (path) {
        try {
          const res = await fetch(
            `${apiBase()}/api/admin/experts/${encodeURIComponent(input.expertId)}/${path}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ reason: input.reason }),
            },
          );
          if (res.ok) {
            // Re-read through the public endpoint so the local mirror holds a
            // full ExpertProfile rather than the admin projection.
            const refreshed = await this.getExpertByUserId(input.expertId).catch(() => null);
            const stored = StorageService.getExperts();
            const found =
              refreshed || stored.find(e => e.id === input.expertId) || null;
            if (found) return { success: true, expert: found };
          }
        } catch {
          // Network failure — fall through to the local path.
        }
      }
    }

    const experts = StorageService.getExperts();
    const idx = experts.findIndex(e => e.id === input.expertId);
    if (idx < 0) return { success: false, expert: null };

    const now = new Date().toISOString();
    const reviewer = StorageService.getCurrentUser();
    const reviewerId = input.reviewerId || reviewer?.id || 'system';
    const reviewerName = input.reviewerName || reviewer?.name || 'withU Compliance';

    const expert = experts[idx];
    expert.status = input.action;
    expert.updatedAt = now;
    expert.rejectionReason = input.action === 'REJECTED' ? input.reason : undefined;
    expert.suspensionReason = input.action === 'SUSPENDED' ? input.reason : undefined;

    if (input.action === 'APPROVED' && expert.agreement) {
      // Countersign the preliminary agreement so the expert's copy shows who
      // verified it and when — the "Office use" block on the paper form.
      expert.agreement = {
        ...expert.agreement,
        expertRefId: expert.id,
        verifiedBy: reviewerName,
        verifiedAt: now,
        authorisedSignatoryName: reviewerName,
      };
    }

    expert.reviewerNotes = [
      ...(expert.reviewerNotes || []),
      {
        id: `rev-${Date.now()}`,
        authorId: reviewerId,
        authorName: reviewerName,
        note:
          input.reason ||
          (input.action === 'APPROVED'
            ? 'Credentials verified with the issuing authority. Provider activated.'
            : `Application moved to ${input.action}.`),
        action: input.action,
        createdAt: now,
      },
    ];

    experts[idx] = expert;
    StorageService.saveExperts(experts);

    // Approval is what actually unlocks the portal, so make sure the account
    // carries the EXPERT role and the live session sees it immediately.
    if (input.action === 'APPROVED') {
      const users = StorageService.getUsers();
      const userIdx = users.findIndex(u => u.id === expert.userId);
      if (userIdx >= 0 && !users[userIdx].roles.includes('EXPERT')) {
        users[userIdx] = { ...users[userIdx], roles: [...users[userIdx].roles, 'EXPERT'] };
        StorageService.saveUsers(users);

        const current = StorageService.getCurrentUser();
        if (current?.id === expert.userId) {
          StorageService.setCurrentUser(users[userIdx]);
        }
      }
    }

    const copy: Record<string, { title: string; message: string }> = {
      APPROVED: {
        title: 'Your expert profile is verified',
        message: 'Compliance approved your credentials. Your provider portal is now open.',
      },
      REJECTED: {
        title: 'Expert application declined',
        message: input.reason || 'Your application was declined. Please review and re-submit.',
      },
      UNDER_REVIEW: {
        title: 'Application under review',
        message: 'A compliance officer is reviewing your documents.',
      },
      SUSPENDED: {
        title: 'Expert profile suspended',
        message: input.reason || 'Your provider profile has been suspended. Contact compliance.',
      },
    };

    const notifs = StorageService.getNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: expert.userId,
      title: copy[input.action].title,
      message: copy[input.action].message,
      type: 'VERIFICATION',
      entityUrl: '/portal/expert',
      isRead: false,
      createdAt: now,
    });
    StorageService.saveNotifications(notifs);

    return { success: true, expert };
  }

  // --- EXPERT FINANCE (ledger, payouts) ---

  /**
   * Provider earnings ledger, newest entry first.
   *
   * The fixture ledger has no per-expert column — it represents the signed-in
   * provider's own statement, which is how the server scopes it too (rows are
   * selected by the authenticated provider, not by a query parameter).
   */
  static async getProviderLedger(): Promise<ProviderLedgerRow[]> {
    const rows = [...StorageService.getLedger()];
    rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return rows;
  }

  /** Payout requests raised by one expert, newest first. */
  static async getExpertPayoutRequests(expertId: string): Promise<PayoutRequest[]> {
    const rows = StorageService.getPayoutRequests().filter(p => p.expertId === expertId);
    rows.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    return rows;
  }

  /** Verified disbursement destinations available to the expert. */
  static async getExpertPayoutMethods(): Promise<PayoutMethod[]> {
    return StorageService.getPayoutMethods();
  }

  /**
   * Raise a withdrawal request against cleared balance.
   *
   * Creates a PENDING request and queues an admin PAYOUT notification — funds
   * are only moved once finance marks it PAID, so nothing is deducted here.
   * The caller is responsible for checking the amount against the available
   * balance; this method re-checks nothing it cannot see.
   */
  static async requestExpertPayout(input: {
    expertId: string;
    expertName: string;
    amountBDT: number;
    payoutMethod: PayoutMethod;
  }): Promise<{ success: boolean; payout: PayoutRequest }> {
    const now = new Date().toISOString();
    const payout: PayoutRequest = {
      id: `po-${Date.now()}`,
      payoutNumber: `WU-PO-${Math.floor(100000 + Math.random() * 900000)}`,
      expertId: input.expertId,
      expertName: input.expertName,
      amountBDT: input.amountBDT,
      payoutMethod: input.payoutMethod,
      status: 'PENDING',
      requestedAt: now,
    };

    const requests = StorageService.getPayoutRequests();
    requests.unshift(payout);
    StorageService.savePayoutRequests(requests);

    const notifs = StorageService.getNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-admin-1',
      title: 'Payout Requested',
      message: `${input.expertName} requested BDT ${input.amountBDT.toLocaleString()} via ${input.payoutMethod.type}.`,
      type: 'PAYMENT',
      entityUrl: '/admin/overview',
      isRead: false,
      createdAt: now,
    });
    StorageService.saveNotifications(notifs);

    return { success: true, payout };
  }

  // --- SERVICES ---
  static async getServices(params?: { categoryId?: string; query?: string; mode?: string; sort?: string; priceMax?: number; expertId?: string }): Promise<ServiceItem[]> {
    let services = StorageService.getServices().filter(s => s.status === 'PUBLISHED');

    if (params?.expertId) {
      services = services.filter(s => s.expertId === params.expertId);
    }
    if (params?.categoryId) {
      services = services.filter(s => s.categoryId === params.categoryId);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      services = services.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) || 
        s.expertName.toLowerCase().includes(q)
      );
    }
    if (params?.mode && params.mode !== 'ALL') {
      services = services.filter(s => s.consultationMode === params.mode || s.consultationMode === 'HYBRID');
    }
    if (params?.priceMax) {
      services = services.filter(s => s.startingPriceBDT <= params.priceMax!);
    }
    if (params?.sort === 'price_asc') {
      services.sort((a, b) => a.startingPriceBDT - b.startingPriceBDT);
    } else if (params?.sort === 'price_desc') {
      services.sort((a, b) => b.startingPriceBDT - a.startingPriceBDT);
    } else if (params?.sort === 'rating') {
      services.sort((a, b) => b.rating - a.rating);
    }

    return services;
  }

  static async getServiceById(id: string): Promise<ServiceItem | null> {
    const services = StorageService.getServices();
    return services.find(s => s.id === id) || null;
  }

  // --- BOOKINGS & SESSIONS ---
  static async createBooking(data: {
    serviceId: string;
    packageId: string;
    slotStartTimeUtc: string;
    customerNote?: string;
  }): Promise<{ success: boolean; booking?: BookingView; error?: string; errorCode?: string }> {
    const service = await this.getServiceById(data.serviceId);
    if (!service) return { success: false, error: 'Service not found', errorCode: 'not_found' };
    
    const pkg = service.packages.find(p => p.id === data.packageId);
    if (!pkg || !pkg.isBookable) {
      return { success: false, error: 'This package requires quote request.', errorCode: 'package_not_bookable' };
    }

    const user = StorageService.getCurrentUser();
    if (!user) return { success: false, error: 'Please log in to book', errorCode: 'unauthorized' };

    if (user.id === service.expertId) {
      return { success: false, error: 'Cannot book own service', errorCode: 'cannot_book_own_service' };
    }

    // Commission calculation (10%-15% hierarchy on Server)
    const commissionConfig = StorageService.getCommissionConfig();
    let commissionRate = service.customCommissionRate || commissionConfig.categoryRates[service.categoryId] || commissionConfig.defaultRate;
    
    const priceBDT = pkg.priceBDT;
    const commissionAmountBDT = Math.round(priceBDT * commissionRate);
    const providerNetBDT = priceBDT - commissionAmountBDT;

    const durationMinutes = pkg.durationMinutes || 30;
    const startObj = new Date(data.slotStartTimeUtc);
    const endObj = new Date(startObj.getTime() + durationMinutes * 60000);

    const bookingId = `bk-${Date.now()}`;
    const consultationId = `cons-${Date.now()}`;

    const newBooking: BookingView = {
      id: bookingId,
      bookingNumber: `WU-BK-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      expertId: service.expertId,
      expertName: service.expertName,
      expertAvatar: service.expertAvatar,
      isExpertVerified: service.isExpertVerified,
      serviceId: service.id,
      serviceTitle: service.title,
      packageId: pkg.id,
      packageTitle: pkg.title,
      categoryId: service.categoryId,
      categoryName: service.categoryName,
      slotStartTimeUtc: startObj.toISOString(),
      slotEndTimeUtc: endObj.toISOString(),
      durationMinutes,
      consultationMode: service.consultationMode === 'IN_PERSON' ? 'IN_PERSON' : 'ONLINE',
      meetingLink: service.consultationMode === 'IN_PERSON' ? undefined : `/consultation/room-${bookingId}`,
      status: 'REQUESTED',
      paymentStatus: 'PENDING_PAYMENT',
      priceBDT,
      commissionRate,
      commissionAmountBDT,
      providerNetBDT,
      unpaidExpiresAt: new Date(Date.now() + 30 * 60000).toISOString(), // 30-minute unpaid expiry
      customerNote: data.customerNote,
      consultationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const bookings = StorageService.getBookings();
    bookings.unshift(newBooking);
    StorageService.saveBookings(bookings);

    // Prepare Consultation Session record
    const consultations = StorageService.getConsultations();
    consultations.unshift({
      consultationId,
      appointmentId: bookingId,
      doctorId: service.expertId,
      doctorName: service.expertName,
      userId: user.id,
      userName: user.name,
      scheduledStartTime: startObj.toISOString(),
      scheduledEndTime: endObj.toISOString(),
      scheduledDurationMinutes: durationMinutes,
      sessionStatus: 'scheduled',
      paymentStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    StorageService.saveConsultations(consultations);

    return { success: true, booking: newBooking };
  }

  // --- DOCTOR VIDEO CONSULTATION REAL-TIME SERVER ENGINE ---
  static async getConsultation(consultationId: string): Promise<ConsultationSession | null> {
    const consultations = StorageService.getConsultations();
    return consultations.find(c => c.consultationId === consultationId) || null;
  }

  static async joinConsultation(consultationId: string, role: 'DOCTOR' | 'PATIENT'): Promise<ConsultationSession | null> {
    const consultations = StorageService.getConsultations();
    const session = consultations.find(c => c.consultationId === consultationId);
    if (!session) return null;

    const now = new Date().toISOString();
    if (role === 'DOCTOR' && !session.doctorJoinedAt) {
      session.doctorJoinedAt = now;
      if (session.sessionStatus === 'waiting' || session.sessionStatus === 'scheduled') {
        session.sessionStatus = session.userJoinedAt ? 'in_progress' : 'doctor_joined';
      }
    } else if (role === 'PATIENT' && !session.userJoinedAt) {
      session.userJoinedAt = now;
      if (session.sessionStatus === 'waiting' || session.sessionStatus === 'scheduled') {
        session.sessionStatus = session.doctorJoinedAt ? 'in_progress' : 'user_joined';
      }
    }

    if (session.doctorJoinedAt && session.userJoinedAt && !session.consultationStartedAt) {
      session.consultationStartedAt = now;
      session.sessionStatus = 'in_progress';
    }

    session.updatedAt = now;
    StorageService.saveConsultations(consultations);
    return session;
  }

  static async endConsultation(consultationId: string, prescriptionNotes?: string, summary?: string): Promise<ConsultationSession | null> {
    const consultations = StorageService.getConsultations();
    const session = consultations.find(c => c.consultationId === consultationId);
    if (!session) return null;

    const now = new Date();
    session.consultationEndedAt = now.toISOString();
    session.sessionStatus = 'completed';
    session.prescriptionNotes = prescriptionNotes;
    session.clinicalSummary = summary;

    // Server calculates authoritative actual duration
    if (session.consultationStartedAt) {
      const start = new Date(session.consultationStartedAt);
      session.actualDurationSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
    } else {
      session.actualDurationSeconds = (session.scheduledDurationMinutes || 30) * 60;
    }

    StorageService.saveConsultations(consultations);

    // Update Booking to COMPLETED
    const bookings = StorageService.getBookings();
    const booking = bookings.find(b => b.id === session.appointmentId || b.consultationId === session.consultationId);
    if (booking) {
      booking.status = 'COMPLETED';
      booking.updatedAt = now.toISOString();
      StorageService.saveBookings(bookings);

      // Release Escrow to Provider Ledger
      const orders = StorageService.getOrders();
      const order = orders.find(o => o.entityId === booking.id);
      if (order) {
        order.escrowStatus = 'RELEASED_TO_PROVIDER';
        StorageService.saveOrders(orders);
      }

      const ledger = StorageService.getLedger();
      const lastBalance = ledger.length > 0 ? ledger[ledger.length - 1].balanceAfterBDT : 0;
      ledger.push({
        id: `ldg-${Date.now()}`,
        type: 'EARNING_RELEASED',
        entityType: 'SESSION',
        entityTitle: booking.packageTitle,
        orderNumber: booking.bookingNumber,
        grossBDT: booking.priceBDT,
        commissionBDT: booking.commissionAmountBDT,
        netBDT: booking.providerNetBDT,
        balanceAfterBDT: lastBalance + booking.providerNetBDT,
        timestamp: now.toISOString()
      });
      StorageService.saveLedger(ledger);
    }

    return session;
  }

  /**
   * Real-time consultation signaling helpers. These hit the server
   * signaling endpoints (REST auth token + ICE config, plus a separate
   * WebSocket transport for offer/answer/ICE). The legacy local-storage
   * `joinConsultation` above is kept for offline / demo mode.
   */
  static async fetchSignalingToken(
    consultationId: string,
    role: 'DOCTOR' | 'PATIENT',
    userId: string,
    name: string
  ): Promise<{
    token: string;
    wsPath: string;
    expiresInSec: number;
    iceServers: Array<{ urls: string | string[] }>;
    consultation: ConsultationSession;
  } | null> {
    try {
      const res = await fetch(`${apiBase()}/api/consultations/${encodeURIComponent(consultationId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId, name })
      });
      if (!res.ok) return null;
      const data = await res.json();
      // REST endpoint nests signaling metadata; merge consultation state into local cache.
      const cons: ConsultationSession = data.consultation;
      const consultations = StorageService.getConsultations();
      const idx = consultations.findIndex(c => c.consultationId === cons.consultationId);
      if (idx >= 0) consultations[idx] = cons; else consultations.push(cons);
      StorageService.saveConsultations(consultations);
      return data;
    } catch {
      return null;
    }
  }

  static async fetchIceConfig(consultationId: string): Promise<Array<{ urls: string | string[] }> | null> {
    try {
      const res = await fetch(`${apiBase()}/api/consultations/${encodeURIComponent(consultationId)}/ice-config`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.iceServers;
    } catch {
      return null;
    }
  }

  static async fetchConsultationPeers(consultationId: string): Promise<{
    live: boolean;
    doctorJoined: boolean;
    patientJoined: boolean;
    startedAt?: string;
  } | null> {
    try {
      const res = await fetch(`${apiBase()}/api/consultations/${encodeURIComponent(consultationId)}/peers`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async endConsultationRemote(
    consultationId: string,
    actualDurationSeconds: number,
    prescriptionNotes?: string,
    summary?: string
  ): Promise<ConsultationSession | null> {
    try {
      const res = await fetch(`${apiBase()}/api/consultations/${encodeURIComponent(consultationId)}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualDurationSeconds, prescriptionNotes, summary })
      });
      if (!res.ok) return null;
      const session: ConsultationSession = await res.json();
      const consultations = StorageService.getConsultations();
      const idx = consultations.findIndex(c => c.consultationId === session.consultationId);
      if (idx >= 0) consultations[idx] = session; else consultations.push(session);
      StorageService.saveConsultations(consultations);
      return session;
    } catch {
      return null;
    }
  }

  // --- PROJECTS (MILESTONE & ESCROW) ---
  static async createProjectRequest(data: {
    serviceId: string;
    requirementsDescription: string;
  }): Promise<{ success: boolean; project?: ProjectView }> {
    const service = await this.getServiceById(data.serviceId);
    if (!service) return { success: false };

    const user = StorageService.getCurrentUser();
    if (!user) return { success: false };

    const projectId = `proj-${Date.now()}`;
    const newProj: ProjectView = {
      id: projectId,
      projectNumber: `WU-PR-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: user.id,
      customerName: user.name,
      expertId: service.expertId,
      expertName: service.expertName,
      expertAvatar: service.expertAvatar,
      serviceId: service.id,
      serviceTitle: service.title,
      categoryName: service.categoryName,
      requirementsDescription: data.requirementsDescription,
      currency: 'BDT',
      totalAmountBDT: 0,
      commissionRate: service.customCommissionRate || 0.15,
      status: 'PENDING_QUOTE',
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const projects = StorageService.getProjects();
    projects.unshift(newProj);
    StorageService.saveProjects(projects);
    return { success: true, project: newProj };
  }

  static async submitProjectQuote(projectId: string, scopeNote: string, milestones: { title: string; description: string; amountBDT: number; estimatedDays: number }[]): Promise<ProjectView | null> {
    const projects = StorageService.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return null;

    const total = milestones.reduce((sum, m) => sum + m.amountBDT, 0);
    proj.quoteScopeNote = scopeNote;
    proj.totalAmountBDT = total;
    proj.status = 'QUOTE_RECEIVED';
    proj.milestones = milestones.map((m, idx) => ({
      id: `ms-${Date.now()}-${idx + 1}`,
      title: m.title,
      description: m.description,
      amountBDT: m.amountBDT,
      estimatedDays: m.estimatedDays,
      order: idx + 1,
      status: 'PENDING'
    }));
    proj.updatedAt = new Date().toISOString();

    StorageService.saveProjects(projects);
    return proj;
  }

  static async acceptProjectQuote(projectId: string): Promise<ProjectView | null> {
    const projects = StorageService.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return null;

    proj.status = 'IN_PROGRESS';
    proj.updatedAt = new Date().toISOString();
    StorageService.saveProjects(projects);
    return proj;
  }

  static async deliverMilestone(projectId: string, milestoneId: string, deliveryNote: string, files?: { name: string; url: string; size: number }[]): Promise<ProjectView | null> {
    const projects = StorageService.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return null;

    const ms = proj.milestones.find(m => m.id === milestoneId);
    if (ms) {
      ms.status = 'DELIVERED';
      ms.deliveredAt = new Date().toISOString();
      ms.deliveryNote = deliveryNote;
      ms.deliverableFiles = files || [{ name: 'Project_Deliverables.zip', url: '#', size: 14200000 }];
    }
    proj.updatedAt = new Date().toISOString();
    StorageService.saveProjects(projects);
    return proj;
  }

  static async approveMilestone(projectId: string, milestoneId: string): Promise<ProjectView | null> {
    const projects = StorageService.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return null;

    const ms = proj.milestones.find(m => m.id === milestoneId);
    if (ms) {
      ms.status = 'APPROVED';
      ms.approvedAt = new Date().toISOString();

      // Release Escrow to Provider Ledger
      const commissionRate = proj.commissionRate || 0.15;
      const commissionAmount = Math.round(ms.amountBDT * commissionRate);
      const providerNet = ms.amountBDT - commissionAmount;

      const ledger = StorageService.getLedger();
      const lastBalance = ledger.length > 0 ? ledger[ledger.length - 1].balanceAfterBDT : 0;
      ledger.push({
        id: `ldg-${Date.now()}`,
        type: 'EARNING_RELEASED',
        entityType: 'PROJECT_MILESTONE',
        entityTitle: `${proj.serviceTitle} — ${ms.title}`,
        orderNumber: proj.projectNumber,
        grossBDT: ms.amountBDT,
        commissionBDT: commissionAmount,
        netBDT: providerNet,
        balanceAfterBDT: lastBalance + providerNet,
        timestamp: new Date().toISOString()
      });
      StorageService.saveLedger(ledger);
    }

    const allApproved = proj.milestones.every(m => m.status === 'APPROVED');
    if (allApproved) {
      proj.status = 'COMPLETED';
    }
    proj.updatedAt = new Date().toISOString();
    StorageService.saveProjects(projects);
    return proj;
  }

  // --- PILGRIMAGE PACKAGES ---
  static async getPilgrimagePackages(): Promise<PilgrimagePackage[]> {
    return StorageService.getPilgrimagePackages();
  }

  static async bookPilgrimagePackage(data: {
    packageId: string;
    departureId: string;
    travelers: { fullName: string; passportNumber: string; dateOfBirth?: string; gender?: 'MALE' | 'FEMALE' }[];
  }): Promise<{ success: boolean; booking?: PilgrimageBooking; error?: string }> {
    const packages = StorageService.getPilgrimagePackages();
    const pkg = packages.find(p => p.id === data.packageId);
    if (!pkg) return { success: false, error: 'Package not found' };

    const dep = pkg.departures.find(d => d.id === data.departureId);
    if (!dep || dep.availableSeats < data.travelers.length) {
      return { success: false, error: 'Selected departure is sold out or has insufficient seats.' };
    }

    const user = StorageService.getCurrentUser();
    if (!user) return { success: false, error: 'Please log in' };

    const travelersCount = data.travelers.length;
    const totalAmountBDT = pkg.pricePerTravelerBDT * travelersCount;
    const commissionRate = 0.10; // 10%
    const commissionAmountBDT = Math.round(totalAmountBDT * commissionRate);
    const agencyNetBDT = totalAmountBDT - commissionAmountBDT;

    // Mask passports for privacy view
    const maskedTravelers = data.travelers.map(t => {
      const num = t.passportNumber || 'A0000000';
      const masked = num.length > 4 ? `${num.substring(0, 1)}****${num.substring(num.length - 3)}` : '****';
      return {
        fullName: t.fullName,
        passportNumber: t.passportNumber,
        passportNumberMasked: masked,
        dateOfBirth: t.dateOfBirth,
        gender: t.gender
      };
    });

    const bookingId = `pilg-${Date.now()}`;
    const newBooking: PilgrimageBooking = {
      id: bookingId,
      bookingNumber: `WU-HAJJ-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: user.id,
      customerName: user.name,
      packageId: pkg.id,
      packageTitle: pkg.title,
      departureId: dep.id,
      departureDate: dep.departureDate,
      agencyExpertId: pkg.agencyExpertId,
      agencyName: pkg.agencyName,
      travelersCount,
      travelers: maskedTravelers,
      pricePerTravelerBDT: pkg.pricePerTravelerBDT,
      totalAmountBDT,
      commissionRate,
      commissionAmountBDT,
      agencyNetBDT,
      status: 'RESERVED',
      paymentStatus: 'PENDING_PAYMENT',
      reservationExpiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      createdAt: new Date().toISOString()
    };

    // Decrement seats
    dep.bookedSeats += travelersCount;
    dep.availableSeats = dep.totalSeats - dep.bookedSeats;
    StorageService.savePilgrimagePackages(packages);

    const pilgrimageBookings = StorageService.getPilgrimageBookings();
    pilgrimageBookings.unshift(newBooking);
    StorageService.savePilgrimageBookings(pilgrimageBookings);

    return { success: true, booking: newBooking };
  }

  // --- RETAINERS ---
  static async getRetainerPlans(): Promise<RetainerPlan[]> {
    return StorageService.getRetainerPlans();
  }

  static async subscribeRetainer(planId: string): Promise<{ success: boolean; subscription?: RetainerSubscription }> {
    const plans = StorageService.getRetainerPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return { success: false };

    const user = StorageService.getCurrentUser();
    if (!user) return { success: false };

    const expert = StorageService.getExperts().find(e => e.id === plan.expertId);

    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60000);

    const sub: RetainerSubscription = {
      id: `sub-${Date.now()}`,
      subscriptionNumber: `WU-RET-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: user.id,
      customerName: user.name,
      expertId: plan.expertId,
      expertName: expert ? expert.displayName : 'Expert Provider',
      expertAvatar: expert ? expert.avatarUrl : '',
      planId: plan.id,
      planTitle: plan.title,
      monthlyPriceBDT: plan.monthlyPriceBDT,
      commissionRate: 0.10,
      status: 'ACTIVE',
      periodStart: now.toISOString(),
      periodEnd: nextMonth.toISOString(),
      autoRenew: true,
      createdAt: now.toISOString()
    };

    const subs = StorageService.getRetainerSubscriptions();
    subs.unshift(sub);
    StorageService.saveRetainerSubscriptions(subs);
    return { success: true, subscription: sub };
  }

  // --- PAYMENT CAPTURE ENGINE ---
  static async processPaymentCapture(data: {
    entityType: 'SESSION' | 'PROJECT_MILESTONE' | 'PACKAGE' | 'RETAINER' | 'COMMERCE';
    entityId: string;
    subEntityId?: string;
    amountBDT: number;
    gateway: 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD';
  }): Promise<{ success: boolean; order: OrderItem }> {
    const user = StorageService.getCurrentUser();
    const now = new Date().toISOString();
    const ref = `TRX-${data.gateway}-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const orders = StorageService.getOrders();
    const orderId = `ord-${Date.now()}`;

    let expertId = 'exp-doc-1';
    let expertName = 'Verified Expert';
    let entityTitle = 'Service Transaction';
    let commissionRate = 0.12;

    if (data.entityType === 'SESSION') {
      const bookings = StorageService.getBookings();
      const bk = bookings.find(b => b.id === data.entityId);
      if (bk) {
        bk.paymentStatus = 'PAID';
        bk.status = 'CONFIRMED';
        bk.paidAt = now;
        expertId = bk.expertId;
        expertName = bk.expertName;
        entityTitle = `${bk.packageTitle} (${bk.expertName})`;
        commissionRate = bk.commissionRate;
        StorageService.saveBookings(bookings);

        // Update consultation status
        const consultations = StorageService.getConsultations();
        const cons = consultations.find(c => c.appointmentId === bk.id);
        if (cons) {
          cons.paymentStatus = 'PAID';
          StorageService.saveConsultations(consultations);
        }
      }
    } else if (data.entityType === 'PROJECT_MILESTONE') {
      const projects = StorageService.getProjects();
      const proj = projects.find(p => p.id === data.entityId);
      if (proj && data.subEntityId) {
        const ms = proj.milestones.find(m => m.id === data.subEntityId);
        if (ms) {
          ms.status = 'FUNDED';
          ms.fundedAt = now;
          expertId = proj.expertId;
          expertName = proj.expertName;
          entityTitle = `${proj.serviceTitle} — ${ms.title}`;
          commissionRate = proj.commissionRate;
          StorageService.saveProjects(projects);
        }
      }
    } else if (data.entityType === 'PACKAGE') {
      const pilgs = StorageService.getPilgrimageBookings();
      const pb = pilgs.find(p => p.id === data.entityId);
      if (pb) {
        pb.paymentStatus = 'PAID';
        pb.status = 'CONFIRMED';
        pb.paidAt = now;
        expertId = pb.agencyExpertId;
        expertName = pb.agencyName;
        entityTitle = pb.packageTitle;
        commissionRate = pb.commissionRate;
        StorageService.savePilgrimageBookings(pilgs);
      }
    }

    const commissionAmount = Math.round(data.amountBDT * commissionRate);
    const providerNet = data.amountBDT - commissionAmount;

    const newOrder: OrderItem = {
      id: orderId,
      orderNumber: `WU-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: user ? user.id : 'user-cust-1',
      customerName: user ? user.name : 'Customer',
      entityType: data.entityType,
      entityId: data.entityId,
      entityTitle,
      expertId,
      expertName,
      grossAmountBDT: data.amountBDT,
      taxAmountBDT: 0,
      totalAmountBDT: data.amountBDT,
      commissionRate,
      commissionAmountBDT: commissionAmount,
      providerNetAmountBDT: providerNet,
      paymentGateway: data.gateway,
      paymentReference: ref,
      paymentStatus: 'PAID',
      escrowStatus: 'HELD_IN_ESCROW',
      paidAt: now,
      createdAt: now
    };

    orders.unshift(newOrder);
    StorageService.saveOrders(orders);

    return { success: true, order: newOrder };
  }

  // --- REVIEWS ---
  static async submitReview(data: {
    entityType: 'SERVICE' | 'EXPERT' | 'PACKAGE';
    entityId: string;
    serviceTitle: string;
    expertId: string;
    rating: number;
    comment: string;
  }): Promise<ReviewItem> {
    const user = StorageService.getCurrentUser();
    const reviews = StorageService.getReviews();
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      entityType: data.entityType,
      entityId: data.entityId,
      serviceTitle: data.serviceTitle,
      customerId: user ? user.id : 'user-cust-1',
      customerName: user ? user.name : 'Verified Customer',
      customerAvatar: user ? (user.avatarUrl || '') : '',
      expertId: data.expertId,
      rating: data.rating,
      comment: data.comment,
      moderationStatus: 'APPROVED',
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newRev);
    StorageService.saveReviews(reviews);

    // Best-effort: try the server too. If the server rejects (404 / offline)
    // we still keep the local copy so the wizard UX never breaks.
    try {
      await fetch(`${apiBase()}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          customerId: newRev.customerId,
          customerName: newRev.customerName,
          customerAvatar: newRev.customerAvatar,
        }),
      });
    } catch {
      /* offline — local cache is the source of truth */
    }
    return newRev;
  }

  /**
   * Fetch reviews filtered by expert, service, or moderation status.
   * Used by ExpertDetailView, ServiceDetailView, ExpertOverview, and the
   * admin moderation queue. Server is preferred; on failure we fall back
   * to the localStorage cache so the public pages still render.
   */
  static async fetchReviews(filters: {
    expertId?: string;
    entityId?: string;
    entityType?: 'SERVICE' | 'EXPERT' | 'PACKAGE' | 'PRODUCT';
    status?: 'APPROVED' | 'PENDING' | 'REMOVED';
    customerId?: string;
  } = {}): Promise<ReviewItem[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    try {
      const url = params.toString() ? `${apiBase()}/api/reviews?${params.toString()}` : `${apiBase()}/api/reviews`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as ReviewItem[];
        // Mirror to local cache so the wizard / inbox / moderation queue
        // can re-read this offline without round-tripping again.
        if (filters.expertId) {
          const all = StorageService.getReviews();
          const others = all.filter(r => r.expertId !== filters.expertId);
          StorageService.saveReviews([...data, ...others]);
        }
        return data;
      }
    } catch {
      /* fall through */
    }
    const all = StorageService.getReviews();
    return all.filter(r => {
      if (filters.expertId && r.expertId !== filters.expertId) return false;
      if (filters.entityId && r.entityId !== filters.entityId) return false;
      if (filters.entityType && r.entityType !== filters.entityType) return false;
      if (filters.status && r.moderationStatus !== filters.status) return false;
      if (filters.customerId && r.customerId !== filters.customerId) return false;
      return true;
    });
  }

  /**
   * Expert posts a public reply to a review. Server is authoritative —
   * on success we patch the local cache so the comment thread re-renders
   * without a full refetch.
   */
  static async replyToReview(reviewId: string, text: string): Promise<ReviewItem | null> {
    const user = StorageService.getCurrentUser();
    try {
      const res = await fetch(`${apiBase()}/api/reviews/${encodeURIComponent(reviewId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, expertId: user?.id }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated: ReviewItem = json.review;
        const all = StorageService.getReviews();
        const idx = all.findIndex(r => r.id === reviewId);
        if (idx >= 0) all[idx] = updated; else all.unshift(updated);
        StorageService.saveReviews(all);
        return updated;
      }
    } catch {
      /* fall through */
    }
    return null;
  }

  /**
   * Admin moderation action: approve / flag / remove a review.
   *
   * No hardcoded `user-admin-1` fallback: if there is no signed-in user we
   * return `null` so the caller can show a "session expired" toast. The
   * server still re-validates the role on every request.
   */
  static async moderateReview(
    reviewId: string,
    action: 'APPROVED' | 'PENDING' | 'REMOVED',
    reason?: string,
  ): Promise<ReviewItem | null> {
    const user = StorageService.getCurrentUser();
    if (!user) return null;
    try {
      const res = await fetch(`${apiBase()}/api/reviews/${encodeURIComponent(reviewId)}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, adminId: user.id }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated: ReviewItem = json.review;
        const all = StorageService.getReviews();
        const idx = all.findIndex(r => r.id === reviewId);
        if (idx >= 0) all[idx] = updated; else all.unshift(updated);
        StorageService.saveReviews(all);
        return updated;
      }
    } catch {
      /* fall through */
    }
    return null;
  }

  // --- COMMERCE PRODUCTS ---
  static async getCommerceProducts(): Promise<CommerceProduct[]> {
    return StorageService.getCommerceProducts();
  }

  // --- F19 COMMERCE — enrollment, lesson progress, certificates ---
  //
  // Every method hits the server directly; we deliberately do NOT mirror
  // enrollments / certificates into localStorage because they are
  // cross-device state and a stale cache would mislead the learner.

  /** Fetch the product catalog, optionally filtered + user-hydrated. */
  static async fetchCommerceProducts(filters?: {
    category?: 'ALL' | 'COURSE' | 'TOOL' | 'BOOK';
    q?: string;
    userId?: string;
  }): Promise<CommerceProduct[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
    if (filters?.q) params.set('q', filters.q);
    if (filters?.userId) params.set('userId', filters.userId);
    const qs = params.toString();
    try {
      const res = await fetch(`${apiBase()}/api/commerce/products${qs ? `?${qs}` : ''}`);
      if (res.ok) return (await res.json()) as CommerceProduct[];
    } catch {
      /* fallthrough */
    }
    return StorageService.getCommerceProducts();
  }

  static async fetchCommerceProduct(id: string): Promise<CommerceProduct | null> {
    try {
      const res = await fetch(`${apiBase()}/api/commerce/products/${encodeURIComponent(id)}`);
      if (res.ok) return (await res.json()) as CommerceProduct;
    } catch {
      /* fallthrough */
    }
    return (
      StorageService.getCommerceProducts().find((p) => p.id === id) || null
    );
  }

  /** Enroll the user in a product. Idempotent on the server. */
  static async enrollInProduct(input: {
    productId: string;
    userId: string;
  }): Promise<{ success: boolean; enrollment?: any; alreadyEnrolled?: boolean; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/commerce/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) return await res.json();
      return { success: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  /** Fetch every enrollment owned by a user (cross-device). */
  static async getMyEnrollments(userId: string): Promise<any[]> {
    try {
      const res = await fetch(
        `${apiBase()}/api/commerce/enrollments?userId=${encodeURIComponent(userId)}`,
      );
      if (res.ok) return (await res.json()) as any[];
    } catch {
      /* fallthrough */
    }
    return [];
  }

  /** Mark a single lesson complete (or revert with completed=false). */
  static async updateLessonProgress(input: {
    enrollmentId: string;
    lessonId: string;
    completed: boolean;
  }): Promise<{ success: boolean; enrollment?: any; completed?: boolean; error?: string }> {
    try {
      const res = await fetch(
        `${apiBase()}/api/commerce/enrollments/${encodeURIComponent(input.enrollmentId)}/progress`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: input.lessonId, completed: input.completed }),
        },
      );
      if (res.ok) return await res.json();
      return { success: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  /** Get the certificate attached to a completed enrollment (if any). */
  static async getCertificate(enrollmentId: string): Promise<any | null> {
    try {
      const res = await fetch(
        `${apiBase()}/api/commerce/enrollments/${encodeURIComponent(enrollmentId)}/certificate`,
      );
      if (res.ok) return await res.json();
    } catch {
      /* fallthrough */
    }
    return null;
  }

  /** List every certificate a user has earned. */
  static async getMyCertificates(userId: string): Promise<any[]> {
    try {
      const res = await fetch(
        `${apiBase()}/api/commerce/certificates?userId=${encodeURIComponent(userId)}`,
      );
      if (res.ok) return (await res.json()) as any[];
    } catch {
      /* fallthrough */
    }
    return [];
  }

  // ---- Admin commerce product CRUD ----

  static async adminCreateProduct(input: Partial<CommerceProduct>): Promise<{ success: boolean; product?: CommerceProduct; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/commerce/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) return await res.json();
      return { success: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  static async adminUpdateProduct(
    id: string,
    patch: Partial<CommerceProduct>,
  ): Promise<{ success: boolean; product?: CommerceProduct; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/commerce/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) return await res.json();
      return { success: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  static async adminDeleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/commerce/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) return await res.json();
      return { success: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  static async adminRefundEnrollment(input: {
    enrollmentId: string;
    reason?: string;
  }): Promise<{ success: boolean; enrollment?: any; error?: string }> {
    try {
      const res = await fetch(
        `${apiBase()}/api/commerce/enrollments/${encodeURIComponent(input.enrollmentId)}/refund`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: input.reason }),
        },
      );
      if (res.ok) return await res.json();
      return { success: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  // --- F16 MESSAGING & CHAT THREADS ---
  /**
   * Fetch the chat threads visible to the given participant. The server
   * filter is the source of truth; localStorage is only used as a
   * zero-network fallback so the inbox still renders offline.
   */
  static async fetchThreads(filters: {
    customerId?: string;
    expertId?: string;
  }): Promise<ChatThread[]> {
    const params = new URLSearchParams();
    if (filters.customerId) params.set('customerId', filters.customerId);
    if (filters.expertId) params.set('expertId', filters.expertId);
    try {
      const res = await fetch(`${apiBase()}/api/threads?${params.toString()}`);
      if (res.ok) {
        const remote = (await res.json()) as ChatThread[];
        // Mirror server-side threads into the local cache so the chat UI
        // can fall back to the same data if the next call fails.
        if (filters.customerId || filters.expertId) {
          const local = StorageService.getThreads();
          const key = filters.customerId ?? filters.expertId!;
          const other = local.filter(
            t =>
              (filters.customerId ? t.customerId !== key : t.expertId !== key),
          );
          StorageService.saveThreads([...remote, ...other]);
        }
        return remote;
      }
    } catch {
      /* offline */
    }
    const all = StorageService.getThreads();
    return all.filter(t => {
      if (filters.customerId && t.customerId !== filters.customerId) return false;
      if (filters.expertId && t.expertId !== filters.expertId) return false;
      return true;
    });
  }

  /**
   * Fetch the message history for a single thread. Server is preferred;
   * localStorage fallback covers the offline case.
   */
  static async fetchMessages(threadId: string): Promise<MessageItem[]> {
    try {
      const res = await fetch(`${apiBase()}/api/messages?threadId=${encodeURIComponent(threadId)}`);
      if (res.ok) {
        const remote = (await res.json()) as MessageItem[];
        // Mirror into local cache
        const all = StorageService.getMessages().filter(m => m.threadId !== threadId);
        StorageService.saveMessages([...all, ...remote]);
        return remote;
      }
    } catch {
      /* offline */
    }
    return StorageService.getMessages()
      .filter(m => m.threadId === threadId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  /**
   * Idempotent thread opener: if a thread already exists for the
   * (entity, customer, expert) tuple it is returned as-is; otherwise a
   * new GENERAL thread is created. Used by the "Message Provider"
   * button on ExpertDetailView and by the "Start new chat" action.
   */
  static async openOrCreateThread(input: {
    entityType: ChatThread['entityType'];
    entityId: string;
    entityTitle?: string;
    customerId: string;
    customerName: string;
    customerAvatar: string;
    expertId: string;
    expertName: string;
    expertAvatar: string;
  }): Promise<ChatThread> {
    try {
      const res = await fetch(`${apiBase()}/api/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const remote = (await res.json()) as ChatThread;
        const local = StorageService.getThreads();
        const others = local.filter(t => t.id !== remote.id);
        StorageService.saveThreads([remote, ...others]);
        return remote;
      }
    } catch {
      /* offline */
    }
    // Local-only fallback
    const local = StorageService.getThreads();
    const existing = local.find(
      t =>
        t.entityId === input.entityId &&
        t.customerId === input.customerId &&
        t.expertId === input.expertId,
    );
    if (existing) return existing;
    const fresh: ChatThread = {
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entityType: input.entityType,
      entityId: input.entityId,
      entityTitle: input.entityTitle || '',
      customerId: input.customerId,
      customerName: input.customerName,
      customerAvatar: input.customerAvatar,
      expertId: input.expertId,
      expertName: input.expertName,
      expertAvatar: input.expertAvatar,
      lastMessageText: '',
      lastMessageAt: new Date().toISOString(),
      unreadCountCustomer: 0,
      unreadCountExpert: 0,
    };
    StorageService.saveThreads([fresh, ...local]);
    return fresh;
  }

  /**
   * Send a chat message. Returns the persisted message on success.
   * Server is preferred; local fallback covers offline / 5xx.
   */
  static async sendMessage(input: {
    threadId: string;
    senderId: string;
    senderName: string;
    senderRole: ChatThread['entityType'] extends never ? never : 'CUSTOMER' | 'EXPERT' | 'ADMIN';
    senderAvatar: string;
    text: string;
    attachments?: { name: string; url: string; size: number; mimeType: string }[];
  }): Promise<MessageItem> {
    try {
      const res = await fetch(`${apiBase()}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const remote = (await res.json()) as MessageItem;
        StorageService.saveMessages([remote, ...StorageService.getMessages()]);
        return remote;
      }
    } catch {
      /* offline */
    }
    const local: MessageItem = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      threadId: input.threadId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderRole: input.senderRole as any,
      senderAvatar: input.senderAvatar,
      text: input.text,
      attachments: input.attachments || [],
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveMessages([local, ...StorageService.getMessages()]);
    return local;
  }

  /**
   * Mark all messages in a thread as read for the given role.
   * Resets the matching unread counter on the thread summary.
   */
  static async markThreadRead(
    threadId: string,
    role: 'CUSTOMER' | 'EXPERT',
  ): Promise<{ success: boolean; markedRead: number; thread?: ChatThread }> {
    try {
      const res = await fetch(`${apiBase()}/api/threads/${encodeURIComponent(threadId)}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) return await res.json();
    } catch {
      /* offline */
    }
    return { success: false, markedRead: 0 };
  }

  // --- PORTAL DATA RETRIEVAL HELPERS ---
  static async getCustomerAppointments(userId?: string): Promise<BookingView[]> {
    const user = StorageService.getCurrentUser();
    const targetUserId = userId || (user ? user.id : 'user-cust-1');
    const bookings = StorageService.getBookings();
    return bookings.filter(b => b.customerId === targetUserId);
  }

  static async getCustomerProjects(userId?: string): Promise<ProjectView[]> {
    const user = StorageService.getCurrentUser();
    const targetUserId = userId || (user ? user.id : 'user-cust-1');
    const projects = StorageService.getProjects();
    return projects.filter(p => p.customerId === targetUserId);
  }

  static async getCustomerPilgrimages(userId?: string): Promise<PilgrimageBooking[]> {
    const user = StorageService.getCurrentUser();
    const targetUserId = userId || (user ? user.id : 'user-cust-1');
    const pilgs = StorageService.getPilgrimageBookings();
    return pilgs.filter(p => p.customerId === targetUserId);
  }

  static async getCustomerRetainers(userId?: string): Promise<RetainerSubscription[]> {
    const user = StorageService.getCurrentUser();
    const targetUserId = userId || (user ? user.id : 'user-cust-1');
    const subs = StorageService.getRetainerSubscriptions();
    return subs.filter(s => s.customerId === targetUserId);
  }

  static async getCustomerOrders(userId?: string): Promise<OrderItem[]> {
    const user = StorageService.getCurrentUser();
    const targetUserId = userId || (user ? user.id : 'user-cust-1');
    const orders = StorageService.getOrders();
    return orders.filter(o => o.customerId === targetUserId);
  }

  static async releaseMilestoneEscrow(projectId: string, milestoneId: string): Promise<boolean> {
    const res = await this.approveMilestone(projectId, milestoneId);
    return !!res;
  }

  static async getExpertAppointments(expertId?: string): Promise<BookingView[]> {
    const user = StorageService.getCurrentUser();
    const targetExpertId = expertId || 'exp-doc-1';
    const bookings = StorageService.getBookings();
    return bookings.filter(b => b.expertId === targetExpertId || b.expertId === user?.id);
  }

  static async getExpertProjects(expertId?: string): Promise<ProjectView[]> {
    const user = StorageService.getCurrentUser();
    const targetExpertId = expertId || 'exp-doc-1';
    const projects = StorageService.getProjects();
    return projects.filter(p => p.expertId === targetExpertId || p.expertId === user?.id);
  }

  static async submitMilestoneDeliverable(projectId: string, milestoneId: string, fileUrl: string): Promise<boolean> {
    const res = await this.deliverMilestone(projectId, milestoneId, 'Milestone deliverable submitted by expert provider.', [
      { name: 'Deliverable_Package.pdf', url: fileUrl, size: 2450000 }
    ]);
    return !!res;
  }

  // --- DATABASE & MONGODB / DYNAMIC JSON DIAGNOSTICS ---
  static async getDatabaseStatus(): Promise<any> {
    try {
      const res = await fetch(`${apiBase()}/api/database/status`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      status: 'active',
      databaseType: 'Dynamic JSON Engine (Offline/Local)',
      isMongoConnected: false
    };
  }

  static async syncMongoDB(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/database/sync`, { method: 'POST' });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to sync with MongoDB' };
    }
  }

  static async seedDatabase(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/database/seed`, { method: 'POST' });
      const data = await res.json();
      await StorageService.syncWithServer();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // --- COMMISSION CONFIG (Admin → Services & Commission) ---
  /**
   * Server-first read of the live per-category commission rates. Previously
   * this tab only ever read `StorageService.getCommissions()` — a purely
   * local mirror that the server never populated — so every rate shown here
   * was disconnected from what bookings actually settle at. Falls back to
   * the local mirror only when the server is unreachable.
   */
  static async getCommissions(): Promise<CommissionConfig[]> {
    try {
      const res = await fetch(`${apiBase()}/api/commissions`);
      if (res.ok) {
        const rows: CommissionConfig[] = await res.json();
        if (Array.isArray(rows)) {
          StorageService.saveCommissions(rows);
          return rows;
        }
      }
    } catch {
      // Offline — fall through to the local mirror below.
    }
    return StorageService.getCommissions();
  }

  /**
   * Persist one category's flat rate to the server. Sliding-scale
   * categories (Legal) keep their tier rule regardless — this only ever
   * touches `categoryRates`, matching what `POST /api/commissions` accepts.
   */
  static async updateCommission(categoryId: string, ratePercent: number): Promise<boolean> {
    try {
      const res = await fetch(`${apiBase()}/api/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissions: [{ categoryId, platformFeePercent: ratePercent }] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- ADMIN ORDER REVIEW ---
  static async approveOrder(
    orderId: string,
    payload: { adminId: string; note?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/admin/orders/${orderId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Approval request failed' };
    }
  }

  static async rejectOrder(
    orderId: string,
    payload: { adminId: string; reason: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/admin/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Rejection request failed' };
    }
  }

  // --- F7 PAYMENT & ESCROW (SSLCOMMERZ pipeline) ---

  /**
   * Step 1 — ask the server to open an SSLCOMMERZ session. The server returns
   * a gatewayUrl (real sandbox/live) or a /sslcz-demo-return URL (demo mode).
   */
  static async initSSLCommerzPayment(payload: {
    orderId: string;
    entityType: string;
    entityId: string;
    subEntityId?: string;
    amountBDT: number;
    customerId: string;
    entityTitle: string;
  }): Promise<{
    success: boolean;
    gatewayUrl?: string;
    sessionKey?: string;
    transactionId?: string;
    mode?: 'sandbox' | 'live' | 'demo';
    error?: string;
  }> {
    try {
      const res = await fetch(`${apiBase()}/api/payments/sslcommerz/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'SSLCommerz init failed' };
    }
  }

  /**
   * Step 2 — poll for order status after a gateway redirect.
   * Resolves once paymentStatus moves out of PENDING_PAYMENT.
   */
  static async pollOrderStatus(
    orderId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<{
    success: boolean;
    paymentStatus?: string;
    escrowStatus?: string;
    paymentReference?: string;
    error?: string;
  }> {
    const interval = options.intervalMs ?? 2000;
    const timeout = options.timeoutMs ?? 5 * 60 * 1000;
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${apiBase()}/api/payments/order/${encodeURIComponent(orderId)}`);
        if (!res.ok) {
          return { success: false, error: `Poller HTTP ${res.status}` };
        }
        const data = await res.json();
        if (data?.success && data.order?.paymentStatus) {
          if (data.order.paymentStatus !== 'PENDING_PAYMENT') {
            return {
              success: true,
              paymentStatus: data.order.paymentStatus,
              escrowStatus: data.order.escrowStatus,
              paymentReference: data.order.paymentReference,
            };
          }
        }
      } catch {
        // transient — keep polling
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    return { success: false, error: 'Polling timed out waiting for gateway.' };
  }

  /**
   * Direct wallet capture — for BKASH/NAGAD/ROCKET (no hosted redirect).
   * Server still lands the order in PENDING_ADMIN_REVIEW; admin approves
   * before funds release to the provider.
   */
  static async initWalletPayment(payload: {
    entityType: 'SESSION' | 'PROJECT_MILESTONE' | 'PACKAGE' | 'RETAINER' | 'COMMERCE';
    entityId: string;
    subEntityId?: string;
    amountBDT: number;
    gateway: 'BKASH' | 'NAGAD' | 'ROCKET';
    customerId: string;
    mobileNumber: string;
    pinOrOtp: string;
  }): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const res = await fetch(`${apiBase()}/api/payments/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Wallet capture failed' };
    }
  }

  // ------------------------------------------------------------------------
  // F17 NOTIFICATIONS
  // ------------------------------------------------------------------------

  /** Canonical list of notification types — single source of truth on the server. */
  static async fetchNotificationTypes(): Promise<string[]> {
    try {
      const res = await fetch(`${apiBase()}/api/notifications/types`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data?.types) ? data.types : [];
      }
    } catch {
      /* offline */
    }
    return [];
  }

  /**
   * List notifications, optionally filtered by user, type, or read status.
   * Falls back to localStorage when the server is unreachable.
   */
  static async fetchNotifications(filters?: {
    userId?: string;
    type?: string | string[];
    unreadOnly?: boolean;
  }): Promise<NotificationItem[]> {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.type) {
      const t = Array.isArray(filters.type) ? filters.type.join(',') : filters.type;
      params.set('type', t);
    }
    if (filters?.unreadOnly) params.set('unreadOnly', 'true');

    const url = params.toString() ? `${apiBase()}/api/notifications?${params.toString()}` : `${apiBase()}/api/notifications`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as NotificationItem[];
        StorageService.saveNotifications(data);
        return data;
      }
    } catch {
      /* offline */
    }
    return StorageService.getNotifications();
  }

  /** Mark a single notification as read on the server (best effort). */
  static async markNotificationRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${apiBase()}/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PUT'
      });
      if (res.ok) return true;
    } catch {
      /* offline */
    }
    return false;
  }

  /** Mark all (optionally filtered by type/user) as read on the server. */
  static async markAllNotificationsRead(filters?: {
    userId?: string;
    type?: string | string[];
  }): Promise<number> {
    const type = filters?.type
      ? Array.isArray(filters.type) ? filters.type.join(',') : filters.type
      : undefined;
    try {
      const res = await fetch(`${apiBase()}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: filters?.userId, type })
      });
      if (res.ok) {
        const data = await res.json();
        return typeof data?.changed === 'number' ? data.changed : 0;
      }
    } catch {
      /* offline */
    }
    return 0;
  }

  /** Create a notification (admin / system use). Returns the persisted item. */
  static async createNotification(input: {
    userId: string;
    title: string;
    message: string;
    type: NotificationItem['type'];
    entityUrl?: string;
  }): Promise<NotificationItem | null> {
    try {
      const res = await fetch(`${apiBase()}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (res.ok) {
        const data = await res.json();
        return data?.notification ?? null;
      }
    } catch {
      /* offline */
    }
    return null;
  }

  /**
   * Open a Server-Sent Events stream for live notifications.
   * Returns an object with the EventSource and a `close()` helper.
   *
   * The stream only fires for the requested `userId` (admins always see all).
   * We auto-reconnect after 3s if the connection drops.
   */
  static subscribeNotificationStream(
    userId: string,
    handlers: {
      onNotification?: (n: NotificationItem) => void;
      onError?: (ev: Event) => void;
    } = {}
  ): { close: () => void } {
    let stopped = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const open = () => {
      if (stopped) return;
      es = new EventSource(`${apiBase()}/api/notifications/stream?userId=${encodeURIComponent(userId)}`);
      es.addEventListener('notification', (ev: MessageEvent) => {
        try {
          const n = JSON.parse(ev.data) as NotificationItem;
          handlers.onNotification?.(n);
        } catch {
          /* malformed payload */
        }
      });
      es.addEventListener('error', (ev) => {
        handlers.onError?.(ev);
        es?.close();
        if (!stopped) {
          reconnectTimer = setTimeout(open, 3000);
        }
      });
    };

    open();

    return {
      close: () => {
        stopped = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        es?.close();
      }
    };
  }

  // =========================================================================
  //  F18 CMS (Blog & FAQ)
  // =========================================================================
  // Public read endpoints + admin mutations. All calls land on the
  // `/api/cms/*` Express routes; results are returned as plain objects.

  static async fetchBlogs(filters?: { category?: string; q?: string }): Promise<CmsBlogPost[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters?.q) params.set('q', filters.q);
    const url = params.toString() ? `${apiBase()}/api/cms/blogs?${params.toString()}` : `${apiBase()}/api/cms/blogs`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as CmsBlogPost[];
  }

  /**
   * The CMS category endpoints are registered twice on the same path — the
   * router in `server/routes/public.ts` is mounted first and shadows the one
   * in `server/routes/api.ts` — so the payload is `{ id, name }[]` from one
   * and `string[]` from the other. Coerce both to the `string[]` these screens
   * render: passing a raw object through throws "Objects are not valid as a
   * React child" and blanks the page behind the router error boundary.
   */
  private static normalizeCategoryList(payload: unknown): string[] {
    if (!Array.isArray(payload)) return [];
    const names = payload
      .map(entry => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          const { name, id } = entry as { name?: unknown; id?: unknown };
          if (typeof name === 'string') return name;
          if (typeof id === 'string') return id;
        }
        return '';
      })
      .filter(name => name.length > 0);
    return Array.from(new Set(names));
  }

  static async fetchBlogCategories(): Promise<string[]> {
    try {
      const res = await fetch(`${apiBase()}/api/cms/blogs/categories`);
      if (!res.ok) return ['All'];
      const categories = ApiService.normalizeCategoryList(await res.json());
      // The blog screens render this list as their only category control, so
      // "All" has to be in it — without it there is no way to clear a filter.
      return ['All', ...categories.filter(c => c !== 'All')];
    } catch {
      return ['All'];
    }
  }

  static async fetchBlogBySlug(slug: string): Promise<CmsBlogPost | null> {
    const res = await fetch(`${apiBase()}/api/cms/blogs/${encodeURIComponent(slug)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as CmsBlogPost;
  }

  static async createBlog(input: Partial<CmsBlogPost>): Promise<{ success: boolean; blog?: CmsBlogPost; error?: string }> {
    const res = await fetch(`${apiBase()}/api/cms/blogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { success: false, error: e.error || 'Failed to create blog post' };
    }
    const json = await res.json();
    return { success: true, blog: json.blog };
  }

  static async updateBlog(id: string, patch: Partial<CmsBlogPost>): Promise<{ success: boolean; blog?: CmsBlogPost; error?: string }> {
    const res = await fetch(`${apiBase()}/api/cms/blogs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { success: false, error: e.error || 'Failed to update blog post' };
    }
    const json = await res.json();
    return { success: true, blog: json.blog };
  }

  static async deleteBlog(id: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${apiBase()}/api/cms/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { success: false, error: e.error || 'Failed to delete blog post' };
    }
    return { success: true };
  }

  static async fetchFaqs(filters?: { category?: string; q?: string }): Promise<CmsFaqItem[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters?.q) params.set('q', filters.q);
    const url = params.toString() ? `${apiBase()}/api/cms/faqs?${params.toString()}` : `${apiBase()}/api/cms/faqs`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as CmsFaqItem[];
  }

  static async fetchFaqCategories(): Promise<string[]> {
    try {
      const res = await fetch(`${apiBase()}/api/cms/faqs/categories`);
      if (!res.ok) return ['All'];
      // No "All" prepended here, unlike the blog list: the CMS filter select
      // already hard-codes that option, and the FAQ editor select beside it
      // must not offer "All" as a category an item can be saved under.
      return ApiService.normalizeCategoryList(await res.json());
    } catch {
      return ['All'];
    }
  }

  static async createFaq(input: Partial<CmsFaqItem>): Promise<{ success: boolean; faq?: CmsFaqItem; error?: string }> {
    const res = await fetch(`${apiBase()}/api/cms/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { success: false, error: e.error || 'Failed to create FAQ' };
    }
    const json = await res.json();
    return { success: true, faq: json.faq };
  }

  static async updateFaq(id: string, patch: Partial<CmsFaqItem>): Promise<{ success: boolean; faq?: CmsFaqItem; error?: string }> {
    const res = await fetch(`${apiBase()}/api/cms/faqs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { success: false, error: e.error || 'Failed to update FAQ' };
    }
    const json = await res.json();
    return { success: true, faq: json.faq };
  }

  static async deleteFaq(id: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${apiBase()}/api/cms/faqs/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { success: false, error: e.error || 'Failed to delete FAQ' };
    }
    return { success: true };
  }
}
