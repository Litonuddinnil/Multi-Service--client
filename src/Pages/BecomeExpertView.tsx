import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Code,
  Compass,
  FileText,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Moon,
  Plane,
  Scale,
  ShieldCheck,
  Stethoscope,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../components/common/Toast';
import { FormField } from '../components/common/FormField';
import { Stepper } from '../components/common/Stepper';
import { ApiService } from '../services/api';
import {
  ATTACHMENTS,
  CONSULTATION_MODES,
  DECLARATION_CLAUSES,
  DISCIPLINES,
  MAX_ATTACHMENT_BYTES,
  SESSION_DURATIONS,
  WEEK_DAYS,
  maskNumber,
  sessionModeFromConsultationModes,
  type AttachmentKey,
  type ConsentKey,
} from '../constants/expertAgreement';
import type { ConsultationMode, ExpertAgreement, ExpertDocument, WeekDay } from '../types';

interface BecomeExpertViewProps {
  /** Legacy dispatcher callback — optional in the router world. */
  onNavigate?: (view: string) => void;
}

const DISCIPLINE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  stethoscope: Stethoscope,
  compass: Compass,
  scale: Scale,
  code: Code,
  plane: Plane,
  moon: Moon,
  'graduation-cap': GraduationCap,
  landmark: Landmark,
  'heart-handshake': HeartHandshake,
  users: Users,
};

const inputCls =
  'w-full p-2.5 text-sm text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal bg-white border border-gray-300 rounded-xl outline-none focus:border-[#34C759] focus:ring-2 focus:ring-[#34C759]/20 transition';

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/**
 * Become an Expert — "Expert Verification & Initial Agreement"
 * (এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র).
 *
 * The four wizard steps map onto the paper form so a scanned copy and the
 * stored record line up field-for-field:
 *   1 → Section 1 Expert Details
 *   2 → the "Documents attached" checklist
 *   3 → Section 2 Engagement Terms
 *   4 → Section 3 Declaration & Consent, plus the review summary
 *
 * Identity and payout numbers are masked before they leave this component;
 * only the masked form is written onto the agreement record.
 */
export const BecomeExpertView: React.FC<BecomeExpertViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const reactNavigate = useNavigate();
  const bn = locale === 'bn';

  const handleNavigate = useCallback(
    (view: string) => {
      if (onNavigate) {
        onNavigate(view);
        return;
      }
      reactNavigate(view === 'expert' ? '/portal/expert' : '/');
    },
    [onNavigate, reactNavigate],
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // --- Section 1: Expert Details ---
  const [discipline, setDiscipline] = useState('cat-healthcare');
  const [fullName, setFullName] = useState(user?.name || '');
  const [designation, setDesignation] = useState('');
  const [organization, setOrganization] = useState('');
  const [mobile, setMobile] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [idType, setIdType] = useState<'NID' | 'PASSPORT'>('NID');
  const [idNumber, setIdNumber] = useState('');
  const [highestDegree, setHighestDegree] = useState('');
  const [degreeYear, setDegreeYear] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [associationName, setAssociationName] = useState('BMDC');
  const [memberNo, setMemberNo] = useState('');
  const [address, setAddress] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');

  // --- Documents attached ---
  const [files, setFiles] = useState<Partial<Record<AttachmentKey, File>>>({});

  // --- Section 2: Engagement Terms ---
  const [consultationModes, setConsultationModes] = useState<ConsultationMode[]>(['CHAT', 'VIDEO']);
  const [availableDays, setAvailableDays] = useState<WeekDay[]>(['SAT', 'MON', 'WED']);
  const [availableFrom, setAvailableFrom] = useState('18:00');
  const [availableTo, setAvailableTo] = useState('21:00');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [feePerSession, setFeePerSession] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'BANK'>('BKASH');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());

  // --- Section 3: Declaration & Consent ---
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    informationTrue: false,
    publicityUse: false,
    noGuaranteedOutcome: false,
    confidentiality: false,
    preliminaryTerms: false,
  });
  const [signatureName, setSignatureName] = useState('');

  const disciplineLabel = useMemo(
    () => DISCIPLINES.find(d => d.id === discipline)?.label,
    [discipline],
  );

  const fieldOfExpertise = useMemo(() => {
    const line = disciplineLabel ? (bn ? disciplineLabel.bn : disciplineLabel.en) : '';
    return specialization.trim() ? `${line} — ${specialization.trim()}` : line;
  }, [disciplineLabel, specialization, bn]);

  const steps = useMemo(
    () => [
      { label: bn ? 'এক্সপার্টের তথ্য' : 'Expert Details' },
      { label: bn ? 'সংযুক্ত নথি' : 'Documents' },
      { label: bn ? 'সেবার শর্ত' : 'Engagement Terms' },
      { label: bn ? 'ঘোষণা ও সম্মতি' : 'Declaration' },
    ],
    [bn],
  );

  // --- per-step validation -------------------------------------------------
  const stepErrors = useMemo(() => {
    const e: Record<1 | 2 | 3 | 4, string[]> = { 1: [], 2: [], 3: [], 4: [] };

    if (!fullName.trim() || fullName.trim().length < 3) e[1].push('fullName');
    if (!designation.trim()) e[1].push('designation');
    if (mobile.replace(/\D/g, '').length < 11) e[1].push('mobile');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e[1].push('email');
    if (idNumber.replace(/\s/g, '').length < 8) e[1].push('idNumber');
    if (!highestDegree.trim()) e[1].push('highestDegree');
    if (!specialization.trim()) e[1].push('specialization');
    if (
      !experienceYears.trim() ||
      Number.isNaN(Number(experienceYears)) ||
      Number(experienceYears) < 0
    ) {
      e[1].push('experienceYears');
    }
    if (!associationName.trim()) e[1].push('associationName');
    if (memberNo.trim().length < 4) e[1].push('memberNo');
    if (!address.trim() || address.trim().length < 10) e[1].push('address');
    if (bio.trim().length < 20) e[1].push('bio');

    ATTACHMENTS.forEach(a => {
      if (a.required && !files[a.key]) e[2].push(a.key);
    });

    if (consultationModes.length === 0) e[3].push('consultationModes');
    if (availableDays.length === 0) e[3].push('availableDays');
    if (availableFrom >= availableTo) e[3].push('availableWindow');
    if (!feePerSession.trim() || Number(feePerSession) <= 0) e[3].push('feePerSession');
    if (paymentAccount.replace(/\s/g, '').length < 8) e[3].push('paymentAccount');
    if (paymentMethod === 'BANK' && !bankName.trim()) e[3].push('bankName');
    if (!effectiveFrom) e[3].push('effectiveFrom');

    if (DECLARATION_CLAUSES.some(c => !consents[c.key])) e[4].push('consents');
    if (signatureName.trim().length < 3) e[4].push('signatureName');

    return e;
  }, [
    fullName,
    designation,
    mobile,
    email,
    idNumber,
    highestDegree,
    specialization,
    experienceYears,
    associationName,
    memberNo,
    bio,
    files,
    consultationModes,
    availableDays,
    availableFrom,
    availableTo,
    feePerSession,
    paymentAccount,
    paymentMethod,
    bankName,
    effectiveFrom,
    consents,
    signatureName,
  ]);

  const isStepValid = (step: number): boolean =>
    (stepErrors[step as 1 | 2 | 3 | 4] ?? ['unknown']).length === 0;

  /** Resolve a localized message for `key`, or undefined when the field is clean. */
  const err = (step: 1 | 2 | 3 | 4, key: string, en: string, bnMsg: string): string | undefined =>
    stepErrors[step].includes(key) ? (bn ? bnMsg : en) : undefined;

  const handleNext = () => {
    if (isStepValid(currentStep) && currentStep < 4) setCurrentStep(s => s + 1);
  };
  const handlePrev = () => setCurrentStep(s => Math.max(1, s - 1));

  const handleFileChange = (key: AttachmentKey) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showToast(
        bn ? 'ফাইলের আকার ১০MB এর বেশি হতে পারবে না।' : 'File must be 10MB or smaller.',
        'error',
      );
      ev.target.value = '';
      return;
    }
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const clearFile = (key: AttachmentKey) =>
    setFiles(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const toggleDay = (day: WeekDay) =>
    setAvailableDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));

  const toggleConsultationMode = (mode: ConsultationMode) =>
    setConsultationModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode],
    );

  // Derived rather than asked twice, since the paper agreement still carries this field.
  const sessionMode = sessionModeFromConsultationModes(consultationModes);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isStepValid(4) || isSubmitting) return;

    // Guard the whole form — the stepper lets the applicant walk back and edit
    // an earlier step after reaching the declaration.
    for (const step of [1, 2, 3] as const) {
      if (!isStepValid(step)) {
        setCurrentStep(step);
        showToast(bn ? `ধাপ ${step} এর তথ্য অসম্পূর্ণ।` : `Step ${step} is incomplete.`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const uploadedAt = new Date().toISOString();
      const documents: ExpertDocument[] = await Promise.all(
        ATTACHMENTS.filter(a => files[a.key]).map(async (a, index) => {
          const file = files[a.key] as File;
          return {
            id: `doc-${Date.now()}-${index}`,
            type: a.documentType,
            documentNumber: a.documentType === 'LICENSE' ? memberNo.trim() : undefined,
            fileUrl: await readFileAsDataUrl(file),
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            status: 'PENDING' as const,
            uploadedAt,
          };
        }),
      );

      const agreement: ExpertAgreement = {
        fullNameAsPerNid: fullName.trim(),
        designation: designation.trim(),
        organization: organization.trim() || undefined,
        mobile: mobile.trim(),
        email: email.trim(),
        idType,
        idNumberMasked: maskNumber(idNumber, 4, 3),
        highestDegree: highestDegree.trim(),
        highestDegreeYear: degreeYear ? Number(degreeYear) : undefined,
        fieldOfExpertise,
        totalExperienceYears: Number(experienceYears) || 0,
        associationName: associationName.trim(),
        associationMemberNo: memberNo.trim(),

        sessionMode,
        consultationModes,
        availableDays,
        availableFrom,
        availableTo,
        sessionDurationMinutes: sessionDuration,
        agreedFeePerSessionBDT: Number(feePerSession),
        paymentMethod,
        paymentAccountMasked: maskNumber(paymentAccount),
        paymentBankName: paymentMethod === 'BANK' ? bankName.trim() : undefined,
        effectiveFrom,

        consents: {
          informationTrue: consents.informationTrue,
          publicityUse: consents.publicityUse,
          noGuaranteedOutcome: consents.noGuaranteedOutcome,
          confidentiality: consents.confidentiality,
          preliminaryTerms: consents.preliminaryTerms,
        },
        attachments: {
          cv: !!files.cv,
          photo: !!files.photo,
          nidCopy: !!files.nidCopy,
          certificates: !!files.certificates,
        },
        signatureName: signatureName.trim(),
        signedAt: new Date().toISOString(),
      };

      const result = await ApiService.submitExpertOnboarding({
        userId: user?.id,
        displayName: fullName.trim(),
        vendorType: organization.trim() ? 'ORGANIZATION' : 'INDIVIDUAL',
        primaryCategoryId: discipline,
        profession: designation.trim(),
        specialization: specialization.trim(),
        yearsOfExperience: Number(experienceYears) || 0,
        bio: bio.trim(),
        avatarUrl: '',
        officialLicenseNumber: memberNo.trim(),
        verificationBody: associationName.trim(),
        idType,
        idNumberMasked: agreement.idNumberMasked,
        orgLegalName: organization.trim() || undefined,
        address: address.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        documents,
        status: 'SUBMITTED',
        agreement,
        consultationModes,
        consultationFeeBDT: Number(feePerSession),
        payoutMethod: {
          type: paymentMethod,
          accountHolderName: fullName.trim(),
          accountNumber: paymentAccount.trim(),
          bankName: paymentMethod === 'BANK' ? bankName.trim() : undefined,
        },
      });

      if (!result?.success) {
        throw new Error('submitExpertOnboarding returned a non-success response');
      }

      setIsSubmitted(true);
      showToast(
        bn
          ? 'আবেদন কমপ্লায়েন্স টিমের কাছে পাঠানো হয়েছে। ১২-২৪ ঘন্টার মধ্যে যাচাই হবে।'
          : 'Application submitted for board verification. Compliance will review within 12-24 hours.',
        'success',
      );
    } catch (error) {
      showToast(
        error instanceof Error && error.message
          ? error.message
          : bn
            ? 'আবেদন জমা দেওয়া যায়নি — আবার চেষ্টা করুন।'
            : 'Could not submit your application. Please try again.',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------- render

  // An application must be tied to a real account: approval grants the EXPERT role to
  // `expert.userId`, so a signed-out submission would be approved and still never log in.
  if (!user?.id) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#34C759]/5">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black">
          {bn ? 'আগে অ্যাকাউন্টে প্রবেশ করুন' : 'Sign in to apply'}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {bn
            ? 'আপনার আবেদন আপনার অ্যাকাউন্টের সাথে যুক্ত থাকে। যাচাই সম্পন্ন হলে একই ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করলেই এক্সপার্ট ড্যাশবোর্ড খুলে যাবে।'
            : 'Your application is linked to your account. Once compliance approves it, signing in with the same email and password unlocks your expert dashboard.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm transition"
          >
            {bn ? 'লগইন করুন' : 'Log in'}
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-gray-300 font-bold text-sm transition"
          >
            {bn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create an account'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">
          {bn ? 'withU যাচাইকৃত নেটওয়ার্কে যোগ দিন' : 'Join the withU Verified Network'}
        </span>
        <h1 className="text-3xl font-black ">
          {bn ? 'এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র' : 'Expert Verification & Initial Agreement'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          {bn
            ? 'মেন্টরশিপ ও কনসালটেন্সি প্ল্যাটফর্ম। নথি যাচাইয়ের পর বিস্তারিত সেবা চুক্তি সম্পাদিত হবে।'
            : 'Mentorship & Consultancy Platform. A detailed service contract follows after document verification.'}
        </p>
      </header>

      <Stepper
        steps={steps.map((s, i) => ({ id: i + 1, label: s.label }))}
        currentStepIndex={currentStep - 1}
        onStepClick={idx => {
          // Only allow jumping back to an already-completed step.
          if (idx < currentStep - 1) setCurrentStep(idx + 1);
        }}
        className="max-w-2xl mx-auto"
      />

      {isSubmitted ? (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#34C759]/5">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {bn ? 'সম্মতিপত্র জমা হয়েছে!' : 'Agreement Submitted!'}
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            {bn
              ? `আমাদের কমপ্লায়েন্স টিম ১২-২৪ ঘন্টার মধ্যে ${associationName} এর মাধ্যমে আপনার সদস্য নম্বর যাচাই করবে। প্রোফাইল সক্রিয় হলে আপনি SMS ও ইমেল পাবেন।`
              : `Our compliance team will verify your membership number with ${associationName} within 12-24 hours. You will receive an SMS and email once your profile is activated.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
            >
              {bn ? 'হোমপেজে ফিরুন' : 'Return to Homepage'}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('expert')}
              className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {bn ? 'এক্সপার্ট ড্যাশবোর্ডে যান' : 'Go to Expert Dashboard'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-xl">
            {/* ================= STEP 1 — Expert Details ================= */}
            {currentStep === 1 && (
              <section className="space-y-6">
                <SectionHeading index="1" en="Expert Details" bnText="এক্সপার্টের তথ্য" bn={bn} />

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DISCIPLINES.map(item => {
                    const Icon = DISCIPLINE_ICONS[item.icon] ?? Building2;
                    const selected = discipline === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setDiscipline(item.id);
                          setAssociationName(item.association);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-start text-left w-full ${
                          selected
                            ? 'border-[#34C759] bg-[#34C759]/5 ring-2 ring-[#34C759]/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-6 h-6 text-[#34C759] mb-2" />
                        <span className="text-xs font-bold text-gray-900">
                          {bn ? item.label.bn : item.label.en}
                        </span>
                        <span className="text-[10px] text-gray-500">{item.association}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={bn ? 'পুরো নাম (এনআইডি অনুযায়ী)' : 'Full Name (as per NID)'}
                    required
                    error={err(
                      1,
                      'fullName',
                      'Please enter at least 3 characters',
                      'অন্তত ৩ অক্ষরের নাম লিখুন',
                    )}
                  >
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder={bn ? 'যেমন: ডা. সাবরিনা ইসলাম' : 'e.g. Dr. Sabrina Islam'}
                      className={inputCls}
                    />
                  </FormField>

                  <FormField
                    label={bn ? 'পদবি' : 'Designation'}
                    required
                    error={err(1, 'designation', 'Designation is required', 'পদবি আবশ্যক')}
                  >
                    <input
                      type="text"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder={bn ? 'যেমন: শিশুরোগ বিশেষজ্ঞ' : 'e.g. Consultant Pediatrician'}
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <FormField
                  label={bn ? 'প্রতিষ্ঠান' : 'Organization'}
                  helpText={
                    bn
                      ? 'হাসপাতাল / ফার্ম / এজেন্সির নাম — ব্যক্তিগত প্র্যাকটিস হলে ফাঁকা রাখুন'
                      : 'Hospital / firm / agency name — leave blank for private practice'
                  }
                >
                  <input
                    type="text"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    placeholder={bn ? 'যেমন: স্কয়ার হাসপাতাল' : 'e.g. Square Hospitals Ltd.'}
                    className={inputCls}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={bn ? 'মোবাইল / হোয়াটসঅ্যাপ' : 'Mobile / WhatsApp'}
                    required
                    error={err(
                      1,
                      'mobile',
                      'Enter a valid 11-digit number',
                      'একটি বৈধ ১১-সংখ্যার নম্বর লিখুন',
                    )}
                  >
                    <div className="flex items-stretch">
                      <span className="px-3 flex items-center text-xs font-bold text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl">
                        +880
                      </span>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={e => setMobile(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className={`${inputCls} rounded-l-none font-mono`}
                      />
                    </div>
                  </FormField>

                  <FormField
                    label={bn ? 'ইমেল' : 'Email'}
                    required
                    error={err(
                      1,
                      'email',
                      'Enter a valid email address',
                      'একটি বৈধ ইমেল ঠিকানা লিখুন',
                    )}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={bn ? 'এনআইডি / পাসপোর্ট নম্বর' : 'NID / Passport No.'}
                    required
                    error={err(1, 'idNumber', 'Enter at least 8 characters', 'অন্তত ৮ অক্ষর লিখুন')}
                    helpText={
                      bn
                        ? 'সংরক্ষণের আগে নম্বরটি মাস্ক করা হয় — শুধু কমপ্লায়েন্স টিম পূর্ণ নম্বর দেখতে পায়'
                        : 'Masked before storage — only compliance sees the full number'
                    }
                  >
                    <div className="flex items-stretch gap-2">
                      <select
                        value={idType}
                        onChange={e => setIdType(e.target.value as 'NID' | 'PASSPORT')}
                        className="p-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl outline-none focus:border-[#34C759] cursor-pointer"
                      >
                        <option value="NID">{bn ? 'এনআইডি' : 'NID'}</option>
                        <option value="PASSPORT">{bn ? 'পাসপোর্ট' : 'Passport'}</option>
                      </select>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={e => setIdNumber(e.target.value)}
                        placeholder={idType === 'NID' ? '1990123456789' : 'BR0123456'}
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                  </FormField>

                  <FormField
                    label={bn ? 'সর্বোচ্চ ডিগ্রি ও সাল' : 'Highest Degree & Year'}
                    required
                    error={err(
                      1,
                      'highestDegree',
                      'Highest degree is required',
                      'সর্বোচ্চ ডিগ্রি আবশ্যক',
                    )}
                  >
                    <div className="flex items-stretch gap-2">
                      <input
                        type="text"
                        value={highestDegree}
                        onChange={e => setHighestDegree(e.target.value)}
                        placeholder={bn ? 'যেমন: এমবিবিএস, এফসিপিএস' : 'e.g. MBBS, FCPS'}
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min={1950}
                        max={new Date().getFullYear()}
                        value={degreeYear}
                        onChange={e => setDegreeYear(e.target.value)}
                        placeholder={bn ? 'সাল' : 'Year'}
                        className={`${inputCls} w-28 shrink-0`}
                      />
                    </div>
                  </FormField>
                </div>

                <FormField
                  label={bn ? 'দক্ষতার ক্ষেত্র' : 'Field of Expertise'}
                  required
                  error={err(
                    1,
                    'specialization',
                    'Specialization is required',
                    'বিশেষায়িত ক্ষেত্র আবশ্যক',
                  )}
                  helpText={
                    bn
                      ? `সার্ভিস লাইন + বিশেষায়ন — সংরক্ষিত হবে: ${fieldOfExpertise || '—'}`
                      : `Service line + specialization — will be stored as: ${fieldOfExpertise || '—'}`
                  }
                >
                  <input
                    type="text"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    placeholder={bn ? 'যেমন: শিশু হৃদরোগ' : 'e.g. Paediatric Cardiology'}
                    className={inputCls}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    label={bn ? 'মোট অভিজ্ঞতা (বছর)' : 'Total Experience (years)'}
                    required
                    error={err(
                      1,
                      'experienceYears',
                      'Enter years of experience',
                      'অভিজ্ঞতার বছর লিখুন',
                    )}
                  >
                    <input
                      type="number"
                      min={0}
                      max={70}
                      value={experienceYears}
                      onChange={e => setExperienceYears(e.target.value)}
                      placeholder={bn ? 'যেমন: ৮' : 'e.g. 8'}
                      className={inputCls}
                    />
                  </FormField>

                  <FormField
                    label={bn ? 'অ্যাসোসিয়েশন' : 'Association'}
                    required
                    error={err(
                      1,
                      'associationName',
                      'Association is required',
                      'অ্যাসোসিয়েশন আবশ্যক',
                    )}
                    helpText="BMDC / Bar Council / IEB"
                  >
                    <input
                      type="text"
                      value={associationName}
                      onChange={e => setAssociationName(e.target.value)}
                      className={inputCls}
                    />
                  </FormField>

                  <FormField
                    label={bn ? 'সদস্য নম্বর' : 'Member No.'}
                    required
                    error={err(1, 'memberNo', 'Enter at least 4 characters', 'অন্তত ৪ অক্ষর লিখুন')}
                  >
                    <input
                      type="text"
                      value={memberNo}
                      onChange={e => setMemberNo(e.target.value.toUpperCase())}
                      placeholder="A-98721"
                      className={`${inputCls} font-mono font-bold uppercase`}
                    />
                  </FormField>
                </div>

                <FormField
                  label={bn ? 'পূর্ণ ঠিকানা' : 'Full Address'}
                  required
                  error={err(1, 'address', 'Enter at least 10 characters', 'অন্তত ১০ অক্ষরের ঠিকানা লিখুন')}
                  helpText={
                    bn
                      ? 'কমপ্লায়েন্স যাচাইয়ের জন্য — পাবলিক প্রোফাইলে দেখানো হয় না'
                      : 'For compliance verification only — never shown on your public profile'
                  }
                >
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={
                      bn
                        ? 'যেমন: ৪৫/এ, রোড ৭, ধানমন্ডি, ঢাকা ১২০৫'
                        : 'e.g. House 45/A, Road 7, Dhanmondi, Dhaka 1205'
                    }
                    className={`${inputCls} resize-none`}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={bn ? 'পোর্টফোলিও / ওয়েবসাইট' : 'Portfolio / Website'}
                    helpText={bn ? '(ঐচ্ছিক)' : '(Optional)'}
                  >
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourpractice.com"
                      className={inputCls}
                    />
                  </FormField>

                  <FormField label="LinkedIn" helpText={bn ? '(ঐচ্ছিক)' : '(Optional)'}>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourname"
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <FormField
                  label={bn ? 'পেশাগত সারাংশ' : 'Professional Summary'}
                  required
                  error={err(
                    1,
                    'bio',
                    'Please write at least 20 characters',
                    'অন্তত ২০ অক্ষরের সারাংশ লিখুন',
                  )}
                  helpText={
                    bn
                      ? 'অনুমোদনের পর এটি আপনার পাবলিক প্রোফাইলে দেখানো হবে'
                      : 'Shown on your public profile once approved'
                  }
                >
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder={
                      bn
                        ? 'আপনার ডিগ্রি, হাসপাতাল/ফার্মের সাথে সংযুক্তি ও অভিজ্ঞতা সংক্ষেপে লিখুন...'
                        : 'Summarize your degrees, hospital/firm affiliations, and years in practice...'
                    }
                    className={`${inputCls} resize-none`}
                  />
                </FormField>
              </section>
            )}

            {/* ================= STEP 2 — Documents attached ================= */}
            {currentStep === 2 && (
              <section className="space-y-6">
                <SectionHeading index="2" en="Documents Attached" bnText="সংযুক্ত নথি" bn={bn} />
                <p className="text-xs text-gray-500 -mt-3">
                  {bn
                    ? 'প্রতিটি ফাইল সর্বোচ্চ ১০MB। কমপ্লায়েন্স টিম এগুলো সংশ্লিষ্ট কর্তৃপক্ষের সাথে মিলিয়ে দেখবে।'
                    : 'Each file up to 10MB. Compliance will reconcile these against the issuing authority.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ATTACHMENTS.map(item => {
                    const file = files[item.key];
                    const invalid = stepErrors[2].includes(item.key);
                    return (
                      <FormField
                        key={item.key}
                        label={bn ? item.label.bn : item.label.en}
                        required={item.required}
                        error={
                          invalid
                            ? bn
                              ? 'এই নথিটি আবশ্যক'
                              : 'This document is required'
                            : undefined
                        }
                      >
                        {file ? (
                          <div className="flex items-center gap-2 p-3 bg-[#34C759]/5 border border-[#34C759]/30 rounded-2xl">
                            <FileText className="w-5 h-5 text-[#34C759] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB ·{' '}
                                {bn ? 'আপলোডের জন্য প্রস্তুত' : 'Ready to upload'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => clearFile(item.key)}
                              aria-label={bn ? 'ফাইল সরান' : 'Remove file'}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`upload-${item.key}`}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center bg-gray-50 transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                              invalid
                                ? 'border-red-300 hover:border-red-400'
                                : 'border-gray-300 hover:border-[#34C759]'
                            }`}
                          >
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">
                              {bn ? 'আপলোড করতে ক্লিক করুন' : 'Click to upload'}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {item.accept.includes('image') && !item.accept.includes('pdf')
                                ? 'JPG, PNG'
                                : 'PDF, JPG, PNG'}{' '}
                              · {bn ? 'সর্বোচ্চ' : 'up to'} 10MB
                            </span>
                            <input
                              id={`upload-${item.key}`}
                              type="file"
                              accept={item.accept}
                              onChange={handleFileChange(item.key)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </FormField>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================= STEP 3 — Engagement Terms ================= */}
            {currentStep === 3 && (
              <section className="space-y-6">
                <SectionHeading index="3" en="Engagement Terms" bnText="সেবার শর্ত" bn={bn} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={bn ? 'পরামর্শের মাধ্যম' : 'Consultation Mode'}
                    required
                    error={err(3, 'consultationModes', 'Select at least one channel.', 'অন্তত একটি মাধ্যম নির্বাচন করুন।')}
                    helpText={
                      bn
                        ? 'একাধিক নির্বাচন করা যাবে — আপনার প্রোফাইলে দেখানো হবে'
                        : 'Choose all that apply — shown on your public profile'
                    }
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {CONSULTATION_MODES.map(m => {
                        const active = consultationModes.includes(m.id);
                        return (
                          <button
                            type="button"
                            key={m.id}
                            aria-pressed={active}
                            onClick={() => toggleConsultationMode(m.id)}
                            className={`py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                              active
                                ? 'border-[#34C759] bg-[#34C759]/5 text-gray-900'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {bn ? m.label.bn : m.label.en}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>

                  <FormField
                    label={bn ? 'সেশনের সময়কাল' : 'Session Duration'}
                    required
                    helpText={bn ? 'প্রতি সেশনে মিনিট' : 'Minutes per session'}
                  >
                    <select
                      value={sessionDuration}
                      onChange={e => setSessionDuration(Number(e.target.value))}
                      className={`${inputCls} cursor-pointer`}
                    >
                      {SESSION_DURATIONS.map(d => (
                        <option key={d} value={d}>
                          {d} {bn ? 'মিনিট' : 'minutes'}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField
                  label={bn ? 'উপলব্ধ দিনসমূহ' : 'Available Days'}
                  required
                  error={err(
                    3,
                    'availableDays',
                    'Select at least one day',
                    'অন্তত একটি দিন নির্বাচন করুন',
                  )}
                >
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map(d => (
                      <button
                        type="button"
                        key={d.id}
                        aria-pressed={availableDays.includes(d.id)}
                        onClick={() => toggleDay(d.id)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border-2 transition ${
                          availableDays.includes(d.id)
                            ? 'border-[#34C759] bg-[#34C759]/5 text-gray-900'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {bn ? d.label.bn : d.label.en}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField
                  label={bn ? 'উপলব্ধ সময় (এশিয়া/ঢাকা)' : 'Available Time (Asia/Dhaka)'}
                  required
                  error={err(
                    3,
                    'availableWindow',
                    'End time must be after start time',
                    'শেষ সময় শুরুর সময়ের পরে হতে হবে',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={availableFrom}
                      onChange={e => setAvailableFrom(e.target.value)}
                      className={inputCls}
                    />
                    <span className="text-xs font-semibold text-gray-400">
                      {bn ? 'থেকে' : 'to'}
                    </span>
                    <input
                      type="time"
                      value={availableTo}
                      onChange={e => setAvailableTo(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={bn ? 'প্রতি সেশনে সম্মত ফি (BDT)' : 'Agreed Fee per Session (BDT)'}
                    required
                    error={err(
                      3,
                      'feePerSession',
                      'Enter a fee greater than zero',
                      'শূন্যের বেশি ফি লিখুন',
                    )}
                  >
                    <input
                      type="number"
                      min={1}
                      value={feePerSession}
                      onChange={e => setFeePerSession(e.target.value)}
                      placeholder={bn ? 'যেমন: ১২০০' : 'e.g. 1200'}
                      className={inputCls}
                    />
                  </FormField>

                  <FormField
                    label={bn ? 'কার্যকর তারিখ' : 'Effective From'}
                    required
                    error={err(
                      3,
                      'effectiveFrom',
                      'Pick an effective date',
                      'কার্যকর তারিখ নির্বাচন করুন',
                    )}
                  >
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={e => setEffectiveFrom(e.target.value)}
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <FormField label={bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'} required>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BKASH', 'NAGAD', 'BANK'] as const).map(m => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                          paymentMethod === m
                            ? 'border-[#34C759] bg-[#34C759]/5 text-gray-900'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {{ BKASH: 'bKash', NAGAD: 'Nagad', BANK: bn ? 'ব্যাংক' : 'Bank' }[m]}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paymentMethod === 'BANK' && (
                    <FormField
                      label={bn ? 'ব্যাংকের নাম' : 'Bank Name'}
                      required
                      error={err(3, 'bankName', 'Bank name is required', 'ব্যাংকের নাম আবশ্যক')}
                    >
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder={bn ? 'যেমন: ডাচ্-বাংলা ব্যাংক' : 'e.g. Dutch-Bangla Bank'}
                        className={inputCls}
                      />
                    </FormField>
                  )}

                  <FormField
                    label={
                      paymentMethod === 'BANK'
                        ? bn
                          ? 'হিসাব নম্বর'
                          : 'Account Number'
                        : bn
                          ? 'মোবাইল ওয়ালেট নম্বর'
                          : 'Mobile Wallet Number'
                    }
                    required
                    error={err(
                      3,
                      'paymentAccount',
                      'Enter at least 8 characters',
                      'অন্তত ৮ অক্ষর লিখুন',
                    )}
                    helpText={
                      paymentAccount
                        ? `${bn ? 'সংরক্ষিত হবে' : 'Stored as'}: ${maskNumber(paymentAccount)}`
                        : undefined
                    }
                  >
                    <input
                      type="text"
                      value={paymentAccount}
                      onChange={e => setPaymentAccount(e.target.value)}
                      placeholder={paymentMethod === 'BANK' ? '1234567890123' : '017XXXXXXXX'}
                      className={`${inputCls} font-mono`}
                    />
                  </FormField>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                    {bn ? 'সরাসরি BDT স্বয়ংক্রিয় নিষ্পত্তি' : 'Direct BDT Automatic Settlement'}
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    {bn
                      ? 'সেশন ফি withU এসক্রোতে নিরাপদে রাখা হয় এবং সেশন শেষে প্ল্যাটফর্ম কমিশন কর্তনের পরে আপনার যাচাইকৃত ওয়ালেটে জমা হয়।'
                      : 'Session fees are held safely in withU Escrow until the session concludes, then credited to your verified wallet after platform commission.'}
                  </p>
                </div>
              </section>
            )}

            {/* ================= STEP 4 — Declaration & Consent ================= */}
            {currentStep === 4 && (
              <section className="space-y-6">
                <SectionHeading
                  index="4"
                  en="Declaration & Consent"
                  bnText="ঘোষণা ও সম্মতি"
                  bn={bn}
                />

                <ol className="space-y-3">
                  {DECLARATION_CLAUSES.map((clause, idx) => (
                    <li key={clause.key}>
                      <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer p-3 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={consents[clause.key]}
                          onChange={e =>
                            setConsents(prev => ({ ...prev, [clause.key]: e.target.checked }))
                          }
                          className="mt-0.5 accent-[#34C759] h-4 w-4 shrink-0"
                        />
                        <span className="leading-relaxed">
                          <span className="font-bold text-gray-900 mr-1">{idx + 1}.</span>
                          {bn ? clause.text.bn : clause.text.en}
                        </span>
                      </label>
                    </li>
                  ))}
                </ol>
                {stepErrors[4].includes('consents') && (
                  <p className="text-xs text-red-600 font-medium -mt-3">
                    {bn
                      ? 'জমা দেওয়ার আগে পাঁচটি ধারাতেই সম্মতি দিন'
                      : 'Please accept all five clauses before submitting'}
                  </p>
                )}

                {/* Documents attached — mirrors the step-2 uploads */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <h3 className="text-xs font-bold text-gray-900">
                    {bn ? 'সংযুক্ত নথি' : 'Documents attached'}
                  </h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {ATTACHMENTS.map(a => (
                      <span
                        key={a.key}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          files[a.key] ? 'text-[#248a3d]' : 'text-gray-400'
                        }`}
                      >
                        {files[a.key] ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="w-3.5 h-3.5 border border-gray-300 rounded-xs" />
                        )}
                        {bn ? a.label.bn : a.label.en}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Review summary */}
                <div className="divide-y divide-gray-100 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                  <ReviewRow label={bn ? 'নাম' : 'Name'} value={fullName} />
                  <ReviewRow label={bn ? 'পদবি' : 'Designation'} value={designation} />
                  <ReviewRow label={bn ? 'প্রতিষ্ঠান' : 'Organization'} value={organization} />
                  <ReviewRow
                    label={bn ? 'মোবাইল' : 'Mobile'}
                    value={mobile ? `+880 ${mobile}` : ''}
                    mono
                  />
                  <ReviewRow label={bn ? 'ইমেল' : 'Email'} value={email} />
                  <ReviewRow label={bn ? 'ঠিকানা' : 'Address'} value={address} />
                  {portfolioUrl.trim() && (
                    <ReviewRow label={bn ? 'পোর্টফোলিও' : 'Portfolio'} value={portfolioUrl} />
                  )}
                  {linkedinUrl.trim() && <ReviewRow label="LinkedIn" value={linkedinUrl} />}
                  <ReviewRow
                    label={idType === 'NID' ? (bn ? 'এনআইডি' : 'NID') : bn ? 'পাসপোর্ট' : 'Passport'}
                    value={idNumber ? maskNumber(idNumber, 4, 3) : ''}
                    mono
                  />
                  <ReviewRow
                    label={bn ? 'সর্বোচ্চ ডিগ্রি' : 'Highest Degree'}
                    value={degreeYear ? `${highestDegree} (${degreeYear})` : highestDegree}
                  />
                  <ReviewRow
                    label={bn ? 'দক্ষতার ক্ষেত্র' : 'Field of Expertise'}
                    value={fieldOfExpertise}
                  />
                  <ReviewRow
                    label={bn ? 'অভিজ্ঞতা' : 'Total Experience'}
                    value={experienceYears ? `${experienceYears} ${bn ? 'বছর' : 'years'}` : ''}
                  />
                  <ReviewRow
                    label={bn ? 'অ্যাসোসিয়েশন ও সদস্য নং' : 'Association & Member No.'}
                    value={`${associationName} · ${memberNo}`}
                    mono
                  />
                  <ReviewRow
                    label={bn ? 'পরামর্শের মাধ্যম' : 'Consultation Mode'}
                    value={CONSULTATION_MODES.filter(m => consultationModes.includes(m.id))
                      .map(m => (bn ? m.label.bn : m.label.en))
                      .join(', ')}
                  />
                  <ReviewRow
                    label={bn ? 'উপলব্ধ দিন ও সময়' : 'Available Days & Time'}
                    value={
                      availableDays.length
                        ? `${WEEK_DAYS.filter(d => availableDays.includes(d.id))
                            .map(d => (bn ? d.label.bn : d.label.en))
                            .join(', ')} · ${availableFrom}–${availableTo}`
                        : ''
                    }
                  />
                  <ReviewRow
                    label={bn ? 'সেশনের সময়কাল' : 'Session Duration'}
                    value={`${sessionDuration} ${bn ? 'মিনিট' : 'minutes'}`}
                  />
                  <ReviewRow
                    label={bn ? 'সম্মত ফি' : 'Agreed Fee'}
                    value={feePerSession ? `BDT ${feePerSession}` : ''}
                  />
                  <ReviewRow
                    label={bn ? 'পেমেন্ট পদ্ধতি ও নম্বর' : 'Payment Method & No.'}
                    value={
                      paymentAccount
                        ? `${paymentMethod === 'BANK' ? bankName || 'Bank' : paymentMethod} · ${maskNumber(
                            paymentAccount,
                          )}`
                        : ''
                    }
                    mono
                  />
                  <ReviewRow label={bn ? 'কার্যকর তারিখ' : 'Effective From'} value={effectiveFrom} />
                </div>

                <FormField
                  label={bn ? 'এক্সপার্টের স্বাক্ষর — নাম ও তারিখ' : 'Signature of Expert — Name & Date'}
                  required
                  error={err(
                    4,
                    'signatureName',
                    'Type your full name to sign',
                    'স্বাক্ষরের জন্য পুরো নাম লিখুন',
                  )}
                  helpText={
                    bn
                      ? `আপনার পুরো নাম টাইপ করাই ইলেকট্রনিক স্বাক্ষর হিসেবে গণ্য হবে · ${todayIso()}`
                      : `Typing your full name counts as your electronic signature · ${todayIso()}`
                  }
                >
                  <input
                    type="text"
                    value={signatureName}
                    onChange={e => setSignatureName(e.target.value)}
                    placeholder={fullName || (bn ? 'আপনার পুরো নাম' : 'Your full name')}
                    className={`${inputCls} font-semibold`}
                  />
                </FormField>
              </section>
            )}

            {/* ===================== Navigation ===================== */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8 gap-3">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {bn ? 'পিছনে' : 'Back'}
              </button>

              {currentStep < 4 ? (
                <div className="flex items-center gap-3">
                  {!isStepValid(currentStep) && (
                    <span className="text-[11px] font-semibold text-amber-600 hidden sm:inline">
                      {bn ? 'প্রয়োজনীয় সব তথ্য পূরণ করুন' : 'Please fill all required fields'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#34C759] transition"
                  >
                    <span>{bn ? 'পরবর্তী' : 'Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isStepValid(4) || isSubmitting}
                  className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#34C759] transition"
                >
                  {isSubmitting
                    ? bn
                      ? 'জমা হচ্ছে…'
                      : 'Submitting…'
                    : bn
                      ? 'সম্মতিপত্র জমা দিন'
                      : 'Submit Agreement'}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const SectionHeading: React.FC<{ index: string; en: string; bnText: string; bn: boolean }> = ({
  index,
  en,
  bnText,
  bn,
}) => (
  <div className="space-y-0.5">
    <h2 className="text-lg font-bold text-gray-900">
      {index}. {bn ? bnText : en}
    </h2>
    <p className="text-[11px] text-gray-400">{bn ? en : bnText}</p>
  </div>
);

const ReviewRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
    <span className="text-gray-500 font-semibold">{label}</span>
    <span className={`text-gray-900 font-bold text-right break-all ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export default BecomeExpertView;
