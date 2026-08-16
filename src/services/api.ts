import { StorageService } from './storage';
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
  PilgrimagePackage, 
  RetainerPlan, 
  CommerceProduct 
} from '../types';

export class ApiService {
  // --- AUTH & USER ---
  static async getCurrentUser(): Promise<User | null> {
    return StorageService.getCurrentUser();
  }

  static async login(email: string, password?: string): Promise<{ user?: User; error?: string; errorCode?: string }> {
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

  static async registerWithRole(data: {
    name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'EXPERT' | 'ADMIN';
    profession?: string;
    specialization?: string;
    licenseNumber?: string;
    consultationFeeBDT?: number;
    avatarUrl?: string;
  }): Promise<{ success: boolean; user: User }> {
    const users = StorageService.getUsers();
    let existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());

    const roles: UserRole[] = data.role === 'ADMIN'
      ? ['ADMIN', 'SUPER_ADMIN', 'CUSTOMER']
      : data.role === 'EXPERT'
      ? ['EXPERT', 'CUSTOMER']
      : ['CUSTOMER'];

    const permissions: Permission[] = data.role === 'ADMIN'
      ? ['expert:verify', 'catalog:manage', 'platform:manage', 'payment:manage', 'payment:refund', 'booking:manage', 'cms:manage']
      : [];

    const userId = existing ? existing.id : `user-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: data.email,
      name: data.name,
      phone: data.phone || '01700000000',
      phoneVerified: true,
      avatarUrl: data.avatarUrl || (data.role === 'EXPERT'
        ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80'
        : data.role === 'ADMIN'
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'),
      roles,
      permissions,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      status: 'active'
    };

    if (existing) {
      const idx = users.findIndex(u => u.id === existing!.id);
      users[idx] = newUser;
    } else {
      users.push(newUser);
    }
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

  static async submitExpertOnboarding(data: Partial<ExpertProfile>): Promise<{ success: boolean; expert: ExpertProfile }> {
    const experts = StorageService.getExperts();
    const user = StorageService.getCurrentUser();
    
    const newExpert: ExpertProfile = {
      id: `exp-${Date.now()}`,
      userId: user ? user.id : `user-${Date.now()}`,
      displayName: data.displayName || 'Applicant',
      vendorType: data.vendorType || 'INDIVIDUAL',
      primaryCategoryId: data.primaryCategoryId || 'cat-healthcare',
      profession: data.profession || 'Professional',
      specialization: data.specialization || '',
      yearsOfExperience: data.yearsOfExperience || 1,
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
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
          createdAt: new Date().toISOString()
        }
      ],
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    experts.push(newExpert);
    StorageService.saveExperts(experts);

    // Notify Admins
    const notifs = StorageService.getNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-admin-1',
      title: 'New Expert Application Submitted',
      message: `${newExpert.displayName} applied for category ${newExpert.primaryCategoryId}.`,
      type: 'VERIFICATION',
      entityUrl: '/admin/verification',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    StorageService.saveNotifications(notifs);

    return { success: true, expert: newExpert };
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
    return newRev;
  }

  // --- COMMERCE PRODUCTS ---
  static async getCommerceProducts(): Promise<CommerceProduct[]> {
    return StorageService.getCommerceProducts();
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
      const res = await fetch('/api/database/status');
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
      const res = await fetch('/api/database/sync', { method: 'POST' });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to sync with MongoDB' };
    }
  }

  static async seedDatabase(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/database/seed', { method: 'POST' });
      const data = await res.json();
      await StorageService.syncWithServer();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // --- ADMIN ORDER REVIEW ---
  static async approveOrder(
    orderId: string,
    payload: { adminId: string; note?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
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
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
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
      const res = await fetch('/api/payments/sslcommerz/init', {
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
        const res = await fetch(`/api/payments/order/${encodeURIComponent(orderId)}`);
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
      const res = await fetch('/api/payments/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Wallet capture failed' };
    }
  }
}
