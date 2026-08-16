import { 
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
  CmsBlogPost,
  CmsFaqItem
} from '../types';

export const INITIAL_EXPERTS: ExpertProfile[] = [
  {
    id: 'exp-doc-1',
    userId: 'user-doc-1',
    displayName: 'Dr. Tanzim Ahmed, MBBS, FCPS',
    vendorType: 'INDIVIDUAL',
    primaryCategoryId: 'cat-healthcare',
    profession: 'Consultant Cardiologist & Internal Medicine Specialist',
    specialization: 'Hypertension, Ischemic Heart Disease & Preventive Tele-cardiology',
    yearsOfExperience: 14,
    bio: 'Associate Professor of Cardiology with over 14 years of clinical experience in Dhaka Medical College Hospital and specialized online telemedicine clinics. Dedicated to evidence-based, compassionate care.',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    portfolioUrl: 'https://drtanzimahmed.health',
    linkedinUrl: 'https://linkedin.com/in/drtanzimahmed',
    idType: 'NID',
    idNumberMasked: '1989*******4821',
    idNumberFull: '198926947214821',
    address: 'Dhanmondi 8/A, Dhaka-1209, Bangladesh',
    skills: ['Cardiology', 'ECG Analysis', 'Hypertension Protocol', 'Telemedicine', 'Echocardiography'],
    educations: [
      { institution: 'Dhaka Medical College', degree: 'MBBS', fieldOfStudy: 'Medicine & Surgery', year: 2010 },
      { institution: 'BCPS Bangladesh', degree: 'FCPS', fieldOfStudy: 'Cardiology', year: 2016 }
    ],
    experiences: [
      { company: 'Dhaka Medical College & Hospital', role: 'Associate Professor', fromYear: 2018, current: true },
      { company: 'National Institute of Cardiovascular Diseases', role: 'Registrar', fromYear: 2014, toYear: 2018 }
    ],
    certifications: [
      { title: 'BMDC Full Registration (No: A-54912)', issuer: 'Bangladesh Medical & Dental Council', year: 2011, isVerified: true },
      { title: 'Advanced Cardiac Life Support (ACLS)', issuer: 'American Heart Association', year: 2021, isVerified: true }
    ],
    documents: [
      {
        id: 'doc-bmdc-1',
        type: 'BMDC_REGISTRATION',
        documentNumber: 'BMDC-A54912',
        fileUrl: 'https://example.com/bmdc-certificate.pdf',
        fileName: 'BMDC_A54912_Certificate.pdf',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        expiryDate: '2029-12-31',
        status: 'ACCEPTED',
        uploadedAt: '2026-01-10T10:00:00Z'
      }
    ],
    status: 'APPROVED',
    categoryLocked: true,
    reviewerNotes: [
      {
        id: 'rev-note-1',
        authorId: 'admin-1',
        authorName: 'Admin Auditor',
        note: 'BMDC registration verified on official council registry. Degree certificates authenticated.',
        action: 'APPROVED',
        createdAt: '2026-01-12T14:30:00Z'
      }
    ],
    rating: 4.9,
    reviewCount: 142,
    customCommissionRate: 0.12,
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-12T14:30:00Z'
  },
  {
    id: 'exp-agency-hajj',
    userId: 'user-agency-1',
    displayName: 'Al-Madinah Hajj & Umrah Kafela Ltd.',
    vendorType: 'ORGANIZATION',
    primaryCategoryId: 'cat-hajj-umrah',
    profession: 'Government Approved VIP Pilgrimage Agency',
    specialization: 'Exclusive 5-Star Executive Umrah & Ministry Approved Hajj Groups',
    yearsOfExperience: 18,
    bio: 'Premier pilgrimage operator serving Bangladeshi pilgrims since 2008. Official licensee of Ministry of Religious Affairs (License #0482) and IATA accredited agency.',
    avatarUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    orgLegalName: 'Al-Madinah Hajj & Umrah Kafela Bangladesh Private Limited',
    tradeLicenseMasked: 'TRAD/****/8291',
    tradeLicenseFull: 'TRAD/DNCC/098291/2026',
    orgTinMasked: '4928******19',
    orgAddress: 'Suit 902, City Center, Motijheel C/A, Dhaka-1000',
    orgRepresentativeName: 'Haji Mohammad Faruk Hossain',
    orgRepresentativeDesignation: 'Managing Director',
    skills: ['Visa Processing', 'Haramain Hotel Reservation', 'Muallim Group Guide', 'Direct Saudia Airline Charter'],
    educations: [],
    experiences: [
      { company: 'Al-Madinah Kafela Ltd', role: 'Founding Director', fromYear: 2008, current: true }
    ],
    certifications: [
      { title: 'Ministry of Religious Affairs License (No: 0482)', issuer: 'Govt of Bangladesh', year: 2009, isVerified: true },
      { title: 'IATA Agent Accreditation', issuer: 'International Air Transport Association', year: 2012, isVerified: true }
    ],
    documents: [
      {
        id: 'doc-trade-1',
        type: 'TRADE_LICENSE',
        documentNumber: 'TRAD/DNCC/098291',
        fileUrl: 'https://example.com/trade-license.pdf',
        fileName: 'TradeLicense_2026.pdf',
        fileSize: 3120000,
        mimeType: 'application/pdf',
        status: 'ACCEPTED',
        uploadedAt: '2026-01-05T08:00:00Z'
      }
    ],
    status: 'APPROVED',
    categoryLocked: true,
    reviewerNotes: [
      {
        id: 'rev-note-2',
        authorId: 'admin-1',
        authorName: 'Admin Auditor',
        note: 'Ministry Hajj License checked against MoRA verified agency list for year 2026. Validated.',
        action: 'APPROVED',
        createdAt: '2026-01-08T11:00:00Z'
      }
    ],
    rating: 4.95,
    reviewCount: 318,
    customCommissionRate: 0.10,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-08T11:00:00Z'
  },
  {
    id: 'exp-it-dev',
    userId: 'user-it-1',
    displayName: 'NexusCloud Systems (Lead: Engr. Shamim Reza)',
    vendorType: 'ORGANIZATION',
    primaryCategoryId: 'cat-it-digital',
    profession: 'Senior Fullstack Cloud Architect & Team Lead',
    specialization: 'High-Scale MERN/Next.js Platforms, Microservices & 24/7 Support SLA',
    yearsOfExperience: 10,
    bio: 'Ex-Silicon Valley senior engineer leading a high-velocity product engineering team. Specializing in secure financial escrow, healthcare telehealth platforms, and cloud infrastructure.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    portfolioUrl: 'https://nexuscloud.io',
    linkedinUrl: 'https://linkedin.com/in/shamim-reza-cloud',
    orgLegalName: 'NexusCloud Software Technologies BD Ltd.',
    tradeLicenseMasked: 'TRAD/****/1129',
    orgAddress: 'Level 14, Banani Tech Tower, Dhaka',
    orgRepresentativeName: 'Engr. Shamim Reza',
    orgRepresentativeDesignation: 'Chief Technology Officer',
    skills: ['TypeScript', 'React 19', 'Node.js', 'PostgreSQL', 'Docker', 'Escrow Systems', 'WebRTC'],
    educations: [
      { institution: 'BUET', degree: 'B.Sc.', fieldOfStudy: 'Computer Science & Engineering', year: 2015 }
    ],
    experiences: [
      { company: 'NexusCloud', role: 'CTO & Principal Engineer', fromYear: 2020, current: true }
    ],
    certifications: [
      { title: 'AWS Certified Solutions Architect - Professional', issuer: 'Amazon Web Services', year: 2023, isVerified: true }
    ],
    documents: [
      {
        id: 'doc-it-1',
        type: 'TRADE_LICENSE',
        fileUrl: 'https://example.com/it-license.pdf',
        fileName: 'NexusCloud_TradeLicense.pdf',
        fileSize: 1890000,
        mimeType: 'application/pdf',
        status: 'ACCEPTED',
        uploadedAt: '2026-01-15T09:00:00Z'
      }
    ],
    status: 'APPROVED',
    categoryLocked: true,
    reviewerNotes: [],
    rating: 4.88,
    reviewCount: 96,
    customCommissionRate: 0.15,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'exp-eng-civil',
    userId: 'user-eng-1',
    displayName: 'Engr. Kazi Mainuddin, PE, MIEB',
    vendorType: 'INDIVIDUAL',
    primaryCategoryId: 'cat-engineering',
    profession: 'Structural Engineering Consultant (RAJUK Enlisted)',
    specialization: 'High-Rise RCC & Steel Structural Design, BNBC Compliance, Soil Test Vetting',
    yearsOfExperience: 16,
    bio: 'Professional Engineer with M.Sc. in Structural Engineering. Designed over 80 commercial and residential multi-story complexes across Dhaka and Chittagong.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    idType: 'NID',
    idNumberMasked: '1978*******9932',
    address: 'Gulshan 2, Dhaka, Bangladesh',
    skills: ['ETABS', 'STAAD Pro', 'BNBC 2020 Code', 'Earthquake Resistant Design', 'RAJUK Approval'],
    educations: [
      { institution: 'BUET', degree: 'B.Sc. in Civil Engineering', fieldOfStudy: 'Structures', year: 2008 },
      { institution: 'BUET', degree: 'M.Sc. in Structural Engineering', fieldOfStudy: 'Structural Dynamics', year: 2012 }
    ],
    experiences: [
      { company: 'Kazi Structural Consult', role: 'Principal Consultant', fromYear: 2014, current: true }
    ],
    certifications: [
      { title: 'IEB Membership (M-28491)', issuer: 'Institution of Engineers Bangladesh', year: 2009, isVerified: true },
      { title: 'RAJUK Specialist Structural Engineer Enlistment', issuer: 'RAJUK', year: 2015, isVerified: true }
    ],
    documents: [],
    status: 'APPROVED',
    categoryLocked: true,
    reviewerNotes: [],
    rating: 4.92,
    reviewCount: 64,
    customCommissionRate: 0.15,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-22T12:00:00Z'
  },
  {
    id: 'exp-ruqyah-1',
    userId: 'user-ruqyah-1',
    displayName: 'Ustadh Mufti Abdullah Al-Mamun',
    vendorType: 'INDIVIDUAL',
    primaryCategoryId: 'cat-ruqyah-tibbe',
    profession: 'Islamic Scholar & Certified Ruqyah Shari\'ah Practitioner',
    specialization: 'Prophetic Medicine Guidance, Hijama Protocol, Spiritual Counseling',
    yearsOfExperience: 12,
    bio: 'Graduate of Darul Uloom with specialization (Takhassus) in Islamic Jurisprudence. Dedicated to pure Sunnah-based Ruqyah without superstitious additions.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    idType: 'NID',
    idNumberMasked: '1984*******6712',
    address: 'Mirpur DOHS, Dhaka, Bangladesh',
    skills: ['Ruqyah Shari\'ah', 'Tibb-e-Nabawi', 'Cupping / Hijama', 'Islamic Counseling'],
    educations: [
      { institution: 'Jamia Darul Uloom', degree: 'Dawra-e-Hadith & Takhassus', fieldOfStudy: 'Hadith & Fiqh', year: 2012 }
    ],
    experiences: [
      { company: 'Markazul Ruqyah Shariah BD', role: 'Chief Consultant', fromYear: 2015, current: true }
    ],
    certifications: [
      { title: 'Certified Hijama & Prophetic Medicine Sanad', issuer: 'International Cupping Society', year: 2017, isVerified: true }
    ],
    documents: [],
    status: 'APPROVED',
    categoryLocked: true,
    reviewerNotes: [],
    rating: 4.96,
    reviewCount: 205,
    customCommissionRate: 0.10,
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-01-19T09:00:00Z'
  },
  {
    id: 'exp-legal-1',
    userId: 'user-legal-1',
    displayName: 'Advocate Barrister Nadia Rahman',
    vendorType: 'INDIVIDUAL',
    primaryCategoryId: 'cat-legal',
    profession: 'Advocate, Supreme Court of Bangladesh',
    specialization: 'Property Title Vetting, Corporate Compliance & Contract Vetting',
    yearsOfExperience: 11,
    bio: 'Called to the Bar from Lincoln’s Inn, London. Practicing advocate at the Supreme Court of Bangladesh specializing in property due diligence, land mutation, and corporate joint ventures.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    idType: 'NID',
    idNumberMasked: '1988*******3391',
    address: 'Supreme Court Bar Association, Dhaka',
    skills: ['Land Deed Vetting', 'Khatian & CS/RS Verification', 'Commercial Drafting', 'Company Law'],
    educations: [
      { institution: 'University of London', degree: 'LL.B. (Hons)', fieldOfStudy: 'Law', year: 2013 },
      { institution: 'City University London', degree: 'Bar Professional Training Course', fieldOfStudy: 'Bar at Law', year: 2015 }
    ],
    experiences: [
      { company: 'Rahman & Associates Chambers', role: 'Managing Partner', fromYear: 2017, current: true }
    ],
    certifications: [
      { title: 'Supreme Court Bar Council Enlistment (No: 18492)', issuer: 'Bangladesh Bar Council', year: 2016, isVerified: true }
    ],
    documents: [],
    status: 'APPROVED',
    categoryLocked: true,
    reviewerNotes: [],
    rating: 4.91,
    reviewCount: 88,
    customCommissionRate: 0.15,
    createdAt: '2026-01-25T11:00:00Z',
    updatedAt: '2026-01-26T15:00:00Z'
  }
];

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-telecardio-1',
    expertId: 'exp-doc-1',
    expertName: 'Dr. Tanzim Ahmed, MBBS, FCPS',
    expertAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    isExpertVerified: true,
    vendorType: 'INDIVIDUAL',
    title: 'Clinical Video Consultation for Hypertension & Cardiology',
    slug: 'telehealth-cardiology-consultation',
    categoryId: 'cat-healthcare',
    categoryName: 'Healthcare & Doctor Consultation',
    engagementType: 'SESSION',
    description: 'Comprehensive 30 or 45-minute live telemedicine session with Dr. Tanzim Ahmed. Includes live review of previous ECG/Echocardiogram reports, prescription generation, blood pressure medication optimization, and lifestyle advice. The consultation session is tracked in real-time on the server.',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    attributes: {
      bmdcNumber: 'BMDC-A54912',
      department: 'Cardiology',
      hospitalAffiliation: 'Dhaka Medical College & Hospital',
      consultationType: 'Video Call'
    },
    packages: [
      {
        id: 'pkg-cardio-30',
        serviceId: 'srv-telecardio-1',
        title: '30-Min Tele-Cardiology Standard Consultation',
        description: 'Detailed assessment, report analysis, digital prescription with official BMDC signature.',
        pricingType: 'SESSION',
        durationMinutes: 30,
        priceBDT: 1500,
        features: ['30 mins live video room', 'Digital PDF Prescription', 'Report analysis', '7-day follow-up text query'],
        isBookable: true
      },
      {
        id: 'pkg-cardio-45',
        serviceId: 'srv-telecardio-1',
        title: '45-Min Comprehensive Heart Check & Second Opinion',
        description: 'For complex multi-vessel CAD, angioplasty decision, and comprehensive medication audit.',
        pricingType: 'SESSION',
        durationMinutes: 45,
        priceBDT: 2200,
        features: ['45 mins live video room', 'In-depth Angiogram/Echo review', 'Digital Prescription & Next Steps', '14-day follow-up'],
        isBookable: true
      }
    ],
    status: 'PUBLISHED',
    rating: 4.9,
    reviewCount: 142,
    startingPriceBDT: 1500,
    consultationMode: 'ONLINE',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'srv-it-project-1',
    expertId: 'exp-it-dev',
    expertName: 'NexusCloud Systems (Lead: Engr. Shamim Reza)',
    expertAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    isExpertVerified: true,
    vendorType: 'ORGANIZATION',
    title: 'Custom Web & Mobile Application Development with Escrow Milestones',
    slug: 'custom-web-mobile-app-development',
    categoryId: 'cat-it-digital',
    categoryName: 'IT & Digital Services',
    engagementType: 'PROJECT',
    description: 'Enterprise fullstack development for SaaS, marketplaces, and ERP systems. Built with React 19, Node.js/Express, PostgreSQL or MongoDB. Work is scoped into distinct deliverables and funded per-milestone into Escrow. Payment is only released to our team when you approve each milestone delivery.',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    attributes: {
      techStack: 'React 19, TypeScript, Node.js, PostgreSQL/MongoDB, Tailwind CSS',
      deliveryMethod: 'Milestone Escrow'
    },
    packages: [
      {
        id: 'pkg-it-quote',
        serviceId: 'srv-it-project-1',
        title: 'Custom Milestone-Based Project Quote',
        description: 'Submit your requirements. We will prepare an exact breakdown with 1-10 milestones for your review.',
        pricingType: 'FIXED',
        durationMinutes: 0,
        priceBDT: 35000,
        features: ['Detailed Architecture & DB Schema', 'Per-milestone escrow protection', 'Deliverable git repository', 'Full testing & staging deployment'],
        isBookable: false // PROJECT requires Request a Quote
      }
    ],
    status: 'PUBLISHED',
    rating: 4.88,
    reviewCount: 96,
    startingPriceBDT: 35000,
    consultationMode: 'ONLINE',
    createdAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'srv-eng-structure-1',
    expertId: 'exp-eng-civil',
    expertName: 'Engr. Kazi Mainuddin, PE, MIEB',
    expertAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    isExpertVerified: true,
    vendorType: 'INDIVIDUAL',
    title: 'Building Structural Analysis, BNBC 2020 Compliance & RAJUK Vetting',
    slug: 'building-structural-analysis-rajuk-vetting',
    categoryId: 'cat-engineering',
    categoryName: 'Engineering Services',
    engagementType: 'PROJECT',
    description: 'Complete structural calculation, earthquake and wind dynamic analysis (ETABS), soil test vetting, and RAJUK drawing preparation for residential and commercial multi-story buildings.',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
    attributes: {
      iebNumber: 'IEB-M-28491',
      cadSoftware: 'ETABS 21, SAFE, AutoCAD',
      fieldOfEngineering: 'Civil & Structural'
    },
    packages: [
      {
        id: 'pkg-eng-quote',
        serviceId: 'srv-eng-structure-1',
        title: 'Full Building Structural Design & Clearance',
        description: 'Milestone escrow: Soil Vetting -> Framing System -> Final Calculation Sheet -> Signed RAJUK Submission Drawing.',
        pricingType: 'FIXED',
        durationMinutes: 0,
        priceBDT: 50000,
        features: ['BNBC 2020 & ACI code verification', 'ETABS 3D dynamic analysis', 'Signed IEB engineer endorsement', 'Site visit inspection support'],
        isBookable: false
      }
    ],
    status: 'PUBLISHED',
    rating: 4.92,
    reviewCount: 64,
    startingPriceBDT: 50000,
    consultationMode: 'HYBRID',
    location: 'Dhaka & Nationwide',
    createdAt: '2026-01-22T10:00:00Z'
  },
  {
    id: 'srv-ruqyah-1',
    expertId: 'exp-ruqyah-1',
    expertName: 'Ustadh Mufti Abdullah Al-Mamun',
    expertAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    isExpertVerified: true,
    vendorType: 'INDIVIDUAL',
    title: 'Authentic Quranic Ruqyah Shari\'ah & Prophetic Wellness Session',
    slug: 'ruqyah-shariah-prophetic-wellness',
    categoryId: 'cat-ruqyah-tibbe',
    categoryName: 'Tibb-e-Nabawi & Ruqyah',
    engagementType: 'SESSION',
    description: 'One-on-one session for spiritual diagnosis, authentic Ruqyah recitations according to Quran and Sahih Hadith, advice on evil eye (Ayn) / anxiety relief, and customized prophetic nutrition regimen.',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    attributes: {
      islamicQualification: 'Dawra-e-Hadith & Takhassus in Fiqh',
      ruqyahMethod: 'Pure Quran & Sunnah Only'
    },
    packages: [
      {
        id: 'pkg-ruqyah-45',
        serviceId: 'srv-ruqyah-1',
        title: '45-Min Ruqyah Consultation & Dua Protocol',
        description: 'Complete spiritual assessment and daily protection routine guidance.',
        pricingType: 'SESSION',
        durationMinutes: 45,
        priceBDT: 1000,
        features: ['45 mins live video session', 'Prescribed Quranic Ayats schedule', 'Prophetic wellness guide PDF', 'Family guidance'],
        isBookable: true
      }
    ],
    status: 'PUBLISHED',
    rating: 4.96,
    reviewCount: 205,
    startingPriceBDT: 1000,
    consultationMode: 'ONLINE',
    createdAt: '2026-01-24T12:00:00Z'
  },
  {
    id: 'srv-legal-vetting-1',
    expertId: 'exp-legal-1',
    expertName: 'Advocate Barrister Nadia Rahman',
    expertAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    isExpertVerified: true,
    vendorType: 'INDIVIDUAL',
    title: 'Land Property Deed Due Diligence & Khatian Vetting (Legal Opinion)',
    slug: 'land-property-title-vetting-legal-opinion',
    categoryId: 'cat-legal',
    categoryName: 'Legal & Compliance Support',
    engagementType: 'SESSION',
    description: 'Expert verification of CS, SA, RS, City Jarip Khatians, Bia Deeds, Namzari/Mutation certificates, and AC Land records before purchasing real estate in Bangladesh. Protect yourself from fraudulent land registrations.',
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    attributes: {
      barCouncilNo: 'BarCouncil-18492',
      barAssociation: 'Supreme Court Bar'
    },
    packages: [
      {
        id: 'pkg-legal-60',
        serviceId: 'srv-legal-vetting-1',
        title: '60-Min Property Deed Review & Written Legal Opinion',
        description: 'Thorough examination of property chain deeds + formal written legal report.',
        pricingType: 'SESSION',
        durationMinutes: 60,
        priceBDT: 3500,
        features: ['60 mins video or chamber consultation', 'Document title chain scrutiny', 'Signed written legal opinion letter', 'Risk checklist'],
        isBookable: true
      }
    ],
    status: 'PUBLISHED',
    rating: 4.91,
    reviewCount: 88,
    startingPriceBDT: 3500,
    consultationMode: 'HYBRID',
    createdAt: '2026-01-27T10:00:00Z'
  }
];

export const INITIAL_PILGRIMAGE_PACKAGES: PilgrimagePackage[] = [
  {
    id: 'pkg-umrah-vip-1',
    agencyExpertId: 'exp-agency-hajj',
    agencyName: 'Al-Madinah Hajj & Umrah Kafela Ltd.',
    agencyAvatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    isAgencyVerified: true,
    tier: 'PREMIUM_VIP',
    type: 'UMRAH',
    title: '14-Day VIP Executive Umrah with Clock Tower 5★ Hotels',
    description: 'Experience an unforgettable spiritual journey with maximum comfort. 5-Star luxury accommodation facing Haram in Makkah (Fairmont Clock Royal Tower) and Dar Al-Taqwa front row in Madinah. Private luxury GMC transfer and experienced Islamic guide.',
    coverImage: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&auto=format&fit=crop&q=80',
    durationDays: 14,
    makkahHotel: 'Fairmont Makkah Clock Royal Tower (0 meters from Haram)',
    madinahHotel: 'Dar Al-Taqwa Madinah (Front Row, Haram View)',
    distanceFromHaramMeters: 0,
    inclusions: [
      'Direct Saudia / Biman Airlines Return Flight',
      'Instant Umrah Electronic Visa & Ground Insurance',
      'Daily 5-Star Buffet Breakfast',
      'Private High-Speed Haramain Train Ticket Makkah-Madinah',
      'Full Historical Ziyarah in Makkah & Madinah with Muallim',
      '5 Liters Pure Zamzam Water per Pilgrim',
      'Dedicated 24/7 Ground Assistance'
    ],
    exclusions: [
      'Lunch and Dinner personal expenses',
      'Excess baggage charges beyond 46kg'
    ],
    pricePerTravelerBDT: 195000,
    departures: [
      {
        id: 'dep-umrah-sep-15',
        packageId: 'pkg-umrah-vip-1',
        departureDate: '2026-09-15',
        returnDate: '2026-09-29',
        totalSeats: 35,
        bookedSeats: 29,
        availableSeats: 6,
        status: 'OPEN'
      },
      {
        id: 'dep-umrah-oct-10',
        packageId: 'pkg-umrah-vip-1',
        departureDate: '2026-10-10',
        returnDate: '2026-10-24',
        totalSeats: 40,
        bookedSeats: 22,
        availableSeats: 18,
        status: 'OPEN'
      },
      {
        id: 'dep-umrah-nov-05',
        packageId: 'pkg-umrah-vip-1',
        departureDate: '2026-11-05',
        returnDate: '2026-11-19',
        totalSeats: 30,
        bookedSeats: 8,
        availableSeats: 22,
        status: 'OPEN'
      }
    ],
    status: 'PUBLISHED',
    rating: 4.95,
    reviewCount: 318
  },
  {
    id: 'pkg-umrah-econ-1',
    agencyExpertId: 'exp-agency-hajj',
    agencyName: 'Al-Madinah Hajj & Umrah Kafela Ltd.',
    agencyAvatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    isAgencyVerified: true,
    tier: 'ECONOMY',
    type: 'UMRAH',
    title: '15-Day Budget Family Umrah with 24/7 Shuttle Service',
    description: 'Affordable high-standard Umrah package with clean 3-star hotels in Ibrahim Al Khalil road and Markazia North in Madinah. 24-hour AC shuttle buses to Haram.',
    coverImage: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop&q=80',
    durationDays: 15,
    makkahHotel: 'Al Shohada 3-Star (650m / 24h AC Shuttle)',
    madinahHotel: 'Mubarak Silver Markazia (350m)',
    distanceFromHaramMeters: 650,
    inclusions: [
      'Return Air Ticket (Saudia / Air Arabia)',
      'Umrah Visa with Health Insurance',
      'AC Bus Transfer & Group Ziyarah',
      'Experienced Bengali Group Leader'
    ],
    exclusions: ['Food personal meals'],
    pricePerTravelerBDT: 135000,
    departures: [
      {
        id: 'dep-econ-sep-22',
        packageId: 'pkg-umrah-econ-1',
        departureDate: '2026-09-22',
        returnDate: '2026-10-07',
        totalSeats: 50,
        bookedSeats: 48,
        availableSeats: 2,
        status: 'OPEN'
      }
    ],
    status: 'PUBLISHED',
    rating: 4.86,
    reviewCount: 174
  }
];

export const INITIAL_RETAINER_PLANS: RetainerPlan[] = [
  {
    id: 'ret-it-infra-1',
    expertId: 'exp-it-dev',
    title: 'Enterprise Server & Cloud DevOps Retainer (24/7 SLA)',
    monthlyPriceBDT: 30000,
    slaBadge: 'Responds within 30 mins',
    description: 'Continuous monitoring of production servers, automated backups, security patching, Docker/Kubernetes container orchestration, and rapid incident response.',
    includedHours: 20,
    features: [
      '24/7 Critical Uptime Monitoring',
      'Automated Off-site DB Backups',
      'SSL & Security Certificate Renewals',
      '20 hours of custom feature/bugfix development included',
      'Dedicated Slack / WhatsApp priority channel'
    ],
    isActive: true
  },
  {
    id: 'ret-legal-corp-1',
    expertId: 'exp-legal-1',
    title: 'Corporate Legal Retainer for Growing Startups & Businesses',
    monthlyPriceBDT: 25000,
    slaBadge: 'Responds within 24h',
    description: 'Monthly legal counsel covering unlimited contract reviews, employment agreements, vendor NDAs, trade license compliance, and trademark filing guidance.',
    includedHours: 15,
    features: [
      'Up to 10 contract vettings per month',
      'Employee offer letter & policy review',
      'Formal legal notice drafting if needed',
      'Direct phone/meeting access with Barrister Nadia Rahman'
    ],
    isActive: true
  }
];

export const INITIAL_COMMERCE_PRODUCTS: CommerceProduct[] = [
  {
    id: 'prod-mern-course',
    title: 'Production MERN Architecture & Secure Escrow Systems Masterclass',
    slug: 'production-mern-escrow-systems-masterclass',
    type: 'COURSE',
    productType: 'COURSE',
    authorOrInstructor: 'Engr. Shamim Reza (NexusCloud)',
    authorName: 'Engr. Shamim Reza (NexusCloud)',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    priceBDT: 4500,
    rating: 4.97,
    reviewCount: 284,
    studentCount: 1240,
    description: 'Deep dive into building multi-vendor marketplace platforms with React 19, TypeScript, state-machine financial escrow, WebRTC video consultation, and robust security.',
    tags: ['React 19', 'TypeScript', 'Node.js', 'WebRTC', 'Escrow Security'],
    lessonsCount: 38,
    durationHours: 22,
    curriculum: [
      { title: '1. Multi-Tenant Architecture & Database Isolation', duration: '45 mins', previewAvailable: true },
      { title: '2. Implementing Strict Server-Authoritative Time Tracking', duration: '60 mins', previewAvailable: true },
      { title: '3. Webhook Verifications & SSLCommerz Integration', duration: '55 mins', previewAvailable: false },
      { title: '4. Milestone Escrow State Machines & Safe Release', duration: '75 mins', previewAvailable: false }
    ]
  },
  {
    id: 'prod-structural-tool',
    title: 'BNBC 2020 Structural Calculation & RAJUK Compliance Automation Tool',
    slug: 'bnbc-structural-calculation-automation-tool',
    type: 'TOOL',
    productType: 'TOOL',
    authorOrInstructor: 'Engr. Kazi Mainuddin, PE',
    authorName: 'Engr. Kazi Mainuddin, PE',
    coverImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80',
    priceBDT: 3200,
    rating: 4.91,
    reviewCount: 92,
    studentCount: 410,
    description: 'Automated Excel and Python worksheets for earthquake shear calculation, wind load analysis according to BNBC 2020, and RAJUK drawing checklist.',
    tags: ['Civil Engineering', 'BNBC 2020', 'ETABS Helper', 'Automation'],
    downloadFileSize: '48.5 MB'
  },
  {
    id: 'prod-tibb-book',
    title: 'The Comprehensive Guide to Tibb-e-Nabawi & Authentic Ruqyah Shari\'ah',
    slug: 'comprehensive-guide-tibb-e-nabawi-ruqyah',
    type: 'BOOK',
    productType: 'BOOK',
    authorOrInstructor: 'Ustadh Mufti Abdullah Al-Mamun',
    authorName: 'Ustadh Mufti Abdullah Al-Mamun',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    priceBDT: 850,
    rating: 4.98,
    reviewCount: 360,
    studentCount: 1850,
    description: 'Complete 420-page hardcover and digital reference on verified Hadith traditions concerning health, cupping therapy, black seed, honey, and Quranic protection.',
    tags: ['Islamic Medicine', 'Ruqyah', 'Tibb-e-Nabawi', 'PDF & EPUB'],
    downloadFileSize: '18.2 MB'
  }
];

export const INITIAL_CMS_BLOGS: CmsBlogPost[] = [
  {
    id: 'blog-1',
    title: 'Why Escrow is Transforming Service Quality in Bangladesh',
    slug: 'why-escrow-is-transforming-service-quality-bangladesh',
    category: 'Escrow & Trust',
    excerpt: 'Traditional advance payments create immense trust deficits. Learn how milestone escrow ensures safety for clients while guaranteeing payment for experts.',
    content: 'Trust is the bedrock of any thriving marketplace. In traditional transactions, clients often fear paying upfront because work may not meet standards, while service providers worry about delivering work without getting paid. withU bridges this gap by acting as a neutral, trusted intermediary with regulatory escrow protection...',
    author: 'withU Editorial Team',
    publishedAt: '2026-08-01T08:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'blog-2',
    title: 'Essential Checklist for Booking Umrah: Avoiding Fraudulent Agencies',
    slug: 'essential-checklist-booking-umrah-avoiding-fraud',
    category: 'Pilgrimage Guide',
    excerpt: 'Key indicators to verify when selecting an Umrah package: Ministry license validation, direct IATA tickets, and transparent hotel distances.',
    content: 'Every year thousands of devout pilgrims plan their journey to the holy Haramain. However, unverified middle-men and counterfeit agencies cause widespread harassment. Here is the verified step-by-step audit guide...',
    author: 'Haji Mohammad Faruk Hossain',
    publishedAt: '2026-08-08T10:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_CMS_FAQS: CmsFaqItem[] = [
  {
    id: 'faq-1',
    category: 'Escrow Protection',
    questionEn: 'How does withU protect my money with Escrow?',
    questionBn: 'withU কীভাবে এসক্রোর মাধ্যমে আমার টাকা সুরক্ষিত রাখে?',
    answerEn: 'When you book a session or fund a project milestone, your payment is held securely in the platform escrow account. It is never immediately paid to the provider. Only after the consultation takes place or you approve the milestone deliverable, the funds are released.',
    answerBn: 'আপনি যখন কোনো সেশন বুক করেন বা প্রজেক্ট মাইলস্টোন ফান্ড করেন, আপনার পেমেন্ট প্ল্যাটফর্মের এসক্রো একাউন্টে নিরাপদ থাকে। সেশন সম্পন্ন হওয়া অথবা আপনার সন্তুষ্টির পর মাইলস্টোন অনুমোদন করলেই কেবল বিশেষজ্ঞকে টাকা প্রদান করা হয়।'
  },
  {
    id: 'faq-2',
    category: 'Booking & Payment',
    questionEn: 'What payment methods are supported in Bangladesh?',
    questionBn: 'বাংলাদেশে কোন কোন পেমেন্ট মেথড গ্রহণ করা হয়?',
    answerEn: 'We support all major Bangladeshi payment channels through our secure gateway: bKash, Nagad, Rocket, Visa, MasterCard, and direct Internet Banking.',
    answerBn: 'আমাদের সিকিউর পেমেন্ট গেটওয়ের মাধ্যমে বিকাশ, নগদ, রকেট, ভিসা কার্ড, মাস্টারকার্ড এবং ইন্টারনেট ব্যাংকিং সাপোর্ট রয়েছে।'
  },
  {
    id: 'faq-3',
    category: 'Experts & Verification',
    questionEn: 'How are professionals verified on withU?',
    questionBn: 'withU-তে বিশেষজ্ঞদের কীভাবে ভেরিফাই করা হয়?',
    answerEn: 'Every expert undergoes stringent credential verification by our compliance officers. Doctors are cross-checked with BMDC registration, engineers with IEB membership, lawyers with the Bar Council, and Hajj agencies with the Ministry of Religious Affairs.',
    answerBn: 'প্রত্যেক বিশেষজ্ঞের সরকারি ও পেশাগত সনদ (যেমন ডাক্তারদের BMDC, ইঞ্জিনিয়ারদের IEB, আইনজীবীদের বার কাউন্সিল এবং ট্রাভেল এজেন্সির মন্ত্রণালয় লাইসেন্স) আমাদের টিম দ্বারা সরাসরি যাচাই করে তবেই ভেরিফাইড ব্যাজ দেওয়া হয়।'
  },
  {
    id: 'faq-4',
    category: 'Booking & Payment',
    questionEn: 'How does the doctor consultation duration tracking work?',
    questionBn: 'ডাক্তার কনসালটেশনের সময় কীভাবে সার্ভারে ট্র্যাক হয়?',
    answerEn: 'When you and the doctor enter the consultation video room, the server marks both timestamps. The timer is authoritative on the server to ensure high clinical transparency.',
    answerBn: 'আপনি এবং ডাক্তার যখন ভিডিও রুমে যুক্ত হন, সার্ভার স্বয়ংক্রিয়ভাবে দুজনের জয়েন করার সময় রেকর্ড করে। এর ফলে সেশনের নির্ভুল সময় গণনা নিশ্চিত হয়।'
  }
];

export const INITIAL_BOOKINGS: BookingView[] = [
  {
    id: 'bk-1001',
    bookingNumber: 'WU-BK-849201',
    customerId: 'user-cust-1',
    customerName: 'Niloy Hasan (You)',
    customerEmail: 'mdniloyhasan544@gmail.com',
    customerPhone: '01711223344',
    expertId: 'exp-doc-1',
    expertName: 'Dr. Tanzim Ahmed, MBBS, FCPS',
    expertAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    isExpertVerified: true,
    serviceId: 'srv-telecardio-1',
    serviceTitle: 'Clinical Video Consultation for Hypertension & Cardiology',
    packageId: 'pkg-cardio-30',
    packageTitle: '30-Min Tele-Cardiology Standard Consultation',
    categoryId: 'cat-healthcare',
    categoryName: 'Healthcare & Doctor Consultation',
    slotStartTimeUtc: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
    slotEndTimeUtc: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    durationMinutes: 30,
    consultationMode: 'ONLINE',
    meetingLink: '/consultation/room-849201',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    priceBDT: 1500,
    commissionRate: 0.12,
    commissionAmountBDT: 180,
    providerNetBDT: 1320,
    paidAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    customerNote: 'Recent blood pressure fluctuating between 145/95. Uploaded last week ECG.',
    consultationId: 'cons-849201',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export const INITIAL_CONSULTATIONS: ConsultationSession[] = [
  {
    consultationId: 'cons-849201',
    appointmentId: 'bk-1001',
    doctorId: 'exp-doc-1',
    doctorName: 'Dr. Tanzim Ahmed, MBBS, FCPS',
    userId: 'user-cust-1',
    userName: 'Niloy Hasan (You)',
    scheduledStartTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    scheduledEndTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    scheduledDurationMinutes: 30,
    sessionStatus: 'scheduled',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export const INITIAL_PROJECTS: ProjectView[] = [
  {
    id: 'proj-2001',
    projectNumber: 'WU-PR-109284',
    customerId: 'user-cust-1',
    customerName: 'Niloy Hasan (You)',
    expertId: 'exp-it-dev',
    expertName: 'NexusCloud Systems (Lead: Engr. Shamim Reza)',
    expertAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    serviceId: 'srv-it-project-1',
    serviceTitle: 'Custom Web & Mobile Application Development with Escrow Milestones',
    categoryName: 'IT & Digital Services',
    requirementsDescription: 'Build an automated multi-vendor services marketplace with strict server-authoritative time tracking for doctor telehealth and milestone payment escrow.',
    currency: 'BDT',
    totalAmountBDT: 75000,
    commissionRate: 0.15,
    status: 'IN_PROGRESS',
    quoteScopeNote: 'Full architecture with React 19, TypeScript, payment gateway integration, WebRTC consultation room and back-office verification.',
    milestones: [
      {
        id: 'ms-1',
        title: 'Phase 1: Architecture, UI Design System & Database Schema',
        description: 'Complete UI component library, database schema, and public discovery catalogue.',
        amountBDT: 25000,
        estimatedDays: 5,
        order: 1,
        status: 'APPROVED',
        fundedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        deliveryNote: 'Completed all UI design specifications according to withU design system rules.',
        approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString()
      },
      {
        id: 'ms-2',
        title: 'Phase 2: Booking Engine, Escrow Payments & Video Telehealth Room',
        description: 'Implementation of slot picker, SSLCommerz gateway simulator, WebRTC video consultation, and duration tracking.',
        amountBDT: 30000,
        estimatedDays: 7,
        order: 2,
        status: 'FUNDED',
        fundedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: 'ms-3',
        title: 'Phase 3: Back-Office Admin Verification Queue & Platform Analytics',
        description: 'Admin audit tools, document acceptance/rejection, commission splits, and automated reporting.',
        amountBDT: 20000,
        estimatedDays: 4,
        order: 3,
        status: 'PENDING'
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

export const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord-849201',
    orderNumber: 'WU-ORD-849201',
    customerId: 'user-cust-1',
    customerName: 'Niloy Hasan',
    entityType: 'SESSION',
    entityId: 'bk-1001',
    entityTitle: '30-Min Tele-Cardiology Standard Consultation (Dr. Tanzim Ahmed)',
    expertId: 'exp-doc-1',
    expertName: 'Dr. Tanzim Ahmed, MBBS, FCPS',
    grossAmountBDT: 1500,
    taxAmountBDT: 0,
    totalAmountBDT: 1500,
    commissionRate: 0.12,
    commissionAmountBDT: 180,
    providerNetAmountBDT: 1320,
    paymentGateway: 'BKASH',
    paymentReference: 'TRX-BK-99482184',
    paymentStatus: 'PAID',
    escrowStatus: 'HELD_IN_ESCROW',
    paidAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'ord-109284-1',
    orderNumber: 'WU-ORD-109284-1',
    customerId: 'user-cust-1',
    customerName: 'Niloy Hasan',
    entityType: 'PROJECT_MILESTONE',
    entityId: 'ms-1',
    entityTitle: 'Phase 1: Architecture & UI Design System (NexusCloud Systems)',
    expertId: 'exp-it-dev',
    expertName: 'NexusCloud Systems',
    grossAmountBDT: 25000,
    taxAmountBDT: 0,
    totalAmountBDT: 25000,
    commissionRate: 0.15,
    commissionAmountBDT: 3750,
    providerNetAmountBDT: 21250,
    paymentGateway: 'CARD',
    paymentReference: 'TRX-VISA-7729104',
    paymentStatus: 'PAID',
    escrowStatus: 'RELEASED_TO_PROVIDER',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  },
  {
    id: 'ord-109284-2',
    orderNumber: 'WU-ORD-109284-2',
    customerId: 'user-cust-1',
    customerName: 'Niloy Hasan',
    entityType: 'PROJECT_MILESTONE',
    entityId: 'ms-2',
    entityTitle: 'Phase 2: Booking Engine & Video Telehealth Room (NexusCloud Systems)',
    expertId: 'exp-it-dev',
    expertName: 'NexusCloud Systems',
    grossAmountBDT: 30000,
    taxAmountBDT: 0,
    totalAmountBDT: 30000,
    commissionRate: 0.15,
    commissionAmountBDT: 4500,
    providerNetAmountBDT: 25500,
    paymentGateway: 'NAGAD',
    paymentReference: 'TRX-NGD-3301984',
    paymentStatus: 'PAID',
    escrowStatus: 'HELD_IN_ESCROW',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

export const INITIAL_LEDGER: ProviderLedgerRow[] = [
  {
    id: 'ldg-1',
    type: 'EARNING_RELEASED',
    entityType: 'PROJECT_MILESTONE',
    entityTitle: 'Phase 1: Architecture & UI Design System',
    orderNumber: 'WU-ORD-109284-1',
    grossBDT: 25000,
    commissionBDT: 3750,
    netBDT: 21250,
    balanceAfterBDT: 21250,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString()
  },
  {
    id: 'ldg-2',
    type: 'ESCROW_HOLD',
    entityType: 'PROJECT_MILESTONE',
    entityTitle: 'Phase 2: Booking Engine & Video Telehealth Room',
    orderNumber: 'WU-ORD-109284-2',
    grossBDT: 30000,
    commissionBDT: 4500,
    netBDT: 25500,
    balanceAfterBDT: 21250, // not in available balance until released
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-101',
    entityType: 'EXPERT',
    entityId: 'exp-doc-1',
    serviceTitle: 'Clinical Video Consultation for Hypertension & Cardiology',
    customerId: 'user-rev-1',
    customerName: 'Kazi Mahbubur Rahman',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80',
    expertId: 'exp-doc-1',
    rating: 5,
    comment: 'Dr. Tanzim was exceptionally thorough. He took the time to listen to my symptoms and adjusted my medication after explaining the side effects. The video room and digital prescription were very smooth.',
    expertReply: {
      text: 'Thank you for your kind feedback. Please ensure regular blood pressure charting before our follow-up review.',
      repliedAt: '2026-02-02T10:00:00Z'
    },
    moderationStatus: 'APPROVED',
    createdAt: '2026-02-01T14:20:00Z'
  },
  {
    id: 'rev-102',
    entityType: 'PACKAGE',
    entityId: 'pkg-umrah-vip-1',
    serviceTitle: '14-Day VIP Executive Umrah with Clock Tower 5★ Hotels',
    customerId: 'user-rev-2',
    customerName: 'Advocate Shamsul Alam',
    customerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&auto=format&fit=crop&q=80',
    expertId: 'exp-agency-hajj',
    rating: 5,
    comment: 'Flawless arrangements by Al-Madinah Kafela. The Fairmont Clock Tower hotel room had direct Haram view, and having funds in escrow gave my whole family immense peace of mind. Highly recommended.',
    moderationStatus: 'APPROVED',
    createdAt: '2026-02-08T18:40:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'user-cust-1',
    title: 'Consultation Confirmed',
    message: 'Your video consultation with Dr. Tanzim Ahmed is confirmed for today. You can join the room 10 minutes prior.',
    type: 'BOOKING',
    entityUrl: '/consultation/room-849201',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'notif-2',
    userId: 'user-cust-1',
    title: 'Milestone Funded in Escrow',
    message: 'Milestone 2 (৳30,000) for your project has been successfully funded into Escrow.',
    type: 'PAYMENT',
    entityUrl: '/account/projects',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

export const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'th-1',
    entityType: 'SESSION',
    entityId: 'bk-1001',
    entityTitle: 'Dr. Tanzim Ahmed — Tele-Cardiology Consultation',
    customerId: 'user-cust-1',
    customerName: 'Niloy Hasan (You)',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    expertId: 'exp-doc-1',
    expertName: 'Dr. Tanzim Ahmed, MBBS, FCPS',
    expertAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    lastMessageText: 'Please keep your previous blood report ready when entering the video room.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unreadCountCustomer: 1,
    unreadCountExpert: 0
  }
];

export const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 'msg-1',
    threadId: 'th-1',
    senderId: 'user-cust-1',
    senderName: 'Niloy Hasan',
    senderRole: 'CUSTOMER',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    text: 'Salam Doctor, I have completed the booking payment. Looking forward to our session.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: 'msg-2',
    threadId: 'th-1',
    senderId: 'user-doc-1',
    senderName: 'Dr. Tanzim Ahmed',
    senderRole: 'EXPERT',
    senderAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    text: 'Please keep your previous blood report ready when entering the video room.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];
