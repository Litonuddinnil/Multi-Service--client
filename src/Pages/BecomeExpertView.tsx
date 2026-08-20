import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Building2,
  Stethoscope,
  Scale,
  Compass,
  Code,
  Plane,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../components/common/Toast';
import { FormField } from '../components/common/FormField';
import { Stepper } from '../components/common/Stepper';
import { ApiService } from '../services/api';
import type { ExpertDocument } from '../types';

interface BecomeExpertViewProps {
  // Legacy dispatcher callback — optional in the router world.
  onNavigate?: (view: string) => void;
}

interface DisciplineOption {
  id: string;
  label: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DISCIPLINES: DisciplineOption[] = [
  { id: 'cat-healthcare', label: 'Doctor / Medical', body: 'BMDC', icon: Stethoscope },
  { id: 'cat-engineering', label: 'Civil / Structural', body: 'IEB', icon: Compass },
  { id: 'cat-legal', label: 'Advocate / Legal', body: 'Supreme Court Bar', icon: Scale },
  { id: 'cat-it', label: 'Software / IT', body: 'BASIS / Verified', icon: Code },
  { id: 'cat-hajj', label: 'Hajj & Umrah Agency', body: 'Ministry of Religious Affairs', icon: Plane },
  { id: 'cat-business', label: 'Management Consultant', body: 'ICMAB / BIDA', icon: Building2 },
];

const inputCls =
  'w-full p-2.5 text-sm text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal bg-white border border-gray-300 rounded-xl outline-none focus:border-[#34C759] focus:ring-2 focus:ring-[#34C759]/20 transition';

export const BecomeExpertView: React.FC<BecomeExpertViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const reactNavigate = useNavigate();

  const handleNavigate = useCallback(
    (view: string) => {
      if (onNavigate) {
        onNavigate(view);
        return;
      }
      switch (view) {
        case 'home':
          reactNavigate('/');
          return;
        case 'expert':
          reactNavigate('/portal/expert');
          return;
        default:
          reactNavigate('/');
      }
    },
    [onNavigate, reactNavigate],
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [discipline, setDiscipline] = useState('cat-healthcare');
  const [fullName, setFullName] = useState(user?.name || '');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [verificationBody, setVerificationBody] = useState('BMDC');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [experienceYears, setExperienceYears] = useState('');
  const [consultationFeeBDT, setConsultationFeeBDT] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'BKASH' | 'NAGAD' | 'BANK'>('BKASH');
  const [payoutMobile, setPayoutMobile] = useState('');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountName, setPayoutAccountName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const steps = useMemo(
    () => [
      { label: locale === 'bn' ? 'প্রোফাইল ও ক্যাটাগরি' : 'Profile & Category' },
      { label: locale === 'bn' ? 'লাইসেন্স যাচাই' : 'License Verification' },
      { label: locale === 'bn' ? 'পেআউট সেটআপ' : 'Payout Setup' },
      { label: locale === 'bn' ? 'পর্যালোচনা ও জমা' : 'Review & Submit' },
    ],
    [locale],
  );

  // --- per-step validation ---
  const stepErrors = useMemo(() => {
    const errors: { step1: string[]; step2: string[]; step3: string[]; step4: string[] } = {
      step1: [],
      step2: [],
      step3: [],
      step4: [],
    };
    if (!discipline) errors.step1.push('discipline');
    if (!fullName.trim() || fullName.trim().length < 3) errors.step1.push('fullName');
    if (!title.trim()) errors.step1.push('title');
    if (!bio.trim() || bio.trim().length < 20) errors.step1.push('bio');

    if (!licenseNumber.trim() || licenseNumber.trim().length < 4) errors.step2.push('licenseNumber');
    if (!certificateFile) errors.step2.push('certificate');

    if (!payoutMobile.trim() || payoutMobile.replace(/\D/g, '').length < 11) errors.step3.push('payoutMobile');
    if (payoutMethod === 'BANK') {
      if (!payoutBankName.trim()) errors.step3.push('payoutBankName');
      if (!payoutAccountName.trim()) errors.step3.push('payoutAccountName');
    }

    if (!agreed) errors.step4.push('agreed');
    return errors;
  }, [discipline, fullName, title, bio, licenseNumber, certificateFile, payoutMobile, payoutMethod, payoutBankName, payoutAccountName, agreed]);

  const isStepValid = (step: number): boolean => {
    if (step === 1) return stepErrors.step1.length === 0;
    if (step === 2) return stepErrors.step2.length === 0;
    if (step === 3) return stepErrors.step3.length === 0;
    if (step === 4) return stepErrors.step4.length === 0;
    return false;
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) return;
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCertificateFile(file);
  };

  /**
   * F3 KYC onboarding — read the uploaded certificate into a data URL so the
   * admin "Document Inspection" modal can render it without a server roundtrip.
   * Resolves to empty string if the file vanished or read failed.
   */
  const readCertificateDataUrl = useCallback(
    (file: File): Promise<string> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      }),
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid(4) || !certificateFile || !user?.id) return;

    setIsSubmitting(true);
    try {
      const fileDataUrl = await readCertificateDataUrl(certificateFile);

      const document: ExpertDocument = {
        id: `doc-${Date.now()}`,
        type: 'LICENSE',
        documentNumber: licenseNumber.trim(),
        fileUrl: fileDataUrl,
        fileName: certificateFile.name,
        fileSize: certificateFile.size,
        mimeType: certificateFile.type || 'application/octet-stream',
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      };

      // Build the server-side payload from wizard state. The API service
      // posts to /api/experts/onboard which then:
      //   - writes the expert (status SUBMITTED) to the server,
      //   - registers the payout method (bKash/Nagad/bank) with masked number,
      //   - queues an admin VERIFICATION notification,
      // and mirrors the saved expert into local experts cache for offline view.
      const result = await ApiService.submitExpertOnboarding({
        userId: user.id,
        displayName: fullName.trim(),
        vendorType: payoutMethod === 'BANK' ? 'ORGANIZATION' : 'INDIVIDUAL',
        primaryCategoryId: discipline,
        profession: title.trim(),
        specialization: verificationBody,
        yearsOfExperience: Number(experienceYears) || 0,
        bio: bio.trim(),
        avatarUrl: '',
        officialLicenseNumber: licenseNumber.trim(),
        verificationBody: verificationBody,
        documents: [document],
        status: 'SUBMITTED',
        consultationFeeBDT: Number(consultationFeeBDT) || undefined,
        payoutMethod: {
          type: payoutMethod,
          accountHolderName:
            payoutMethod === 'BANK' ? payoutAccountName.trim() : fullName.trim(),
          accountNumber:
            payoutMethod === 'BANK' ? payoutBankName.trim() : payoutMobile.trim(),
          bankName: payoutMethod === 'BANK' ? payoutBankName.trim() : undefined,
        },
      });

      if (!result?.success) {
        throw new Error('submitExpertOnboarding returned a non-success response');
      }

      setIsSubmitted(true);
      showToast(
        locale === 'bn'
          ? 'আবেদন কমপ্লায়েন্স টিমের কাছে পাঠানো হয়েছে। ১২-২৪ ঘন্টার মধ্যে যাচাই হবে।'
          : 'Application submitted for board verification. Compliance will review within 12-24 hours.',
        'success',
      );
    } catch (err: any) {
      showToast(
        err?.message ||
          (locale === 'bn'
            ? 'আবেদন জমা দেওয়া যায়নি — আবার চেষ্টা করুন।'
            : 'Could not submit your application. Please try again.'),
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">
          {locale === 'bn' ? 'WithU যাচাইকৃত নেটওয়ার্কে যোগ দিন' : 'Join withU Verified Network'}
        </span>
        <h1 className="text-3xl font-black ">
          {locale === 'bn' ? 'যাচাইকৃত পেশাদার হিসেবে যোগ দিন' : 'Partner as a Verified Professional'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          {locale === 'bn'
            ? 'বাংলাদেশের হাজারো রোগী ও ক্লায়েন্টের সাথে যুক্ত হন। শূন্য পেমেন্ট বিরোধ সহ নিশ্চিত এসক্রো পেআউট।'
            : 'Connect with thousands of patients and clients across Bangladesh. Guaranteed Escrow payouts with zero payment disputes.'}
        </p>
      </div>

      {/* Progress indicator — brand-green connector fills in as each part is completed */}
      <Stepper
        steps={steps.map((s, i) => ({ id: i + 1, label: s.label }))}
        currentStepIndex={currentStep - 1}
        onStepClick={(idx) => {
          // Only allow jumping back to previously-completed steps.
          if (idx < currentStep - 1) setCurrentStep(idx + 1);
        }}
        className="max-w-2xl mx-auto"
      />

      <form onSubmit={handleSubmit}>
        {isSubmitted ? (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#34C759]/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {locale === 'bn' ? 'বোর্ড যাচাইয়ের জন্য আবেদন জমা হয়েছে!' : 'Application Submitted for Board Verification!'}
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              {locale === 'bn'
                ? `আমাদের কমপ্লায়েন্স টিম ১২-২৪ ঘন্টার মধ্যে আপনার লাইসেন্স ${verificationBody} এর মাধ্যমে যাচাই করবে। প্রোফাইল সক্রিয় হলে আপনি SMS ও ইমেল পাবেন।`
                : `Our compliance team will verify your license with ${verificationBody} within 12-24 hours. You will receive an SMS and email when your profile is activated.`}
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {locale === 'bn' ? 'হোমপেজে ফিরুন' : 'Return to Homepage'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-xl">
            {/* ============== STEP 1 ============== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {locale === 'bn' ? '১. আপনার বিভাগ নির্বাচন করুন' : '1. Select Your Discipline'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DISCIPLINES.map(item => {
                    const Icon = item.icon;
                    const isSelected = discipline === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setDiscipline(item.id);
                          setVerificationBody(item.body);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-start text-left w-full ${
                          isSelected
                            ? 'border-[#34C759] bg-[#34C759]/5 ring-2 ring-[#34C759]/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-6 h-6 text-[#34C759] mb-2" />
                        <h4 className="text-xs font-bold text-gray-900">{item.label}</h4>
                        <span className="text-[10px] text-gray-500 block">{item.body}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <FormField
                    label={locale === 'bn' ? 'পুরো নাম' : 'Full Official Name'}
                    required
                    error={
                      stepErrors.step1.includes('fullName')
                        ? locale === 'bn'
                          ? 'অন্তত ৩ অক্ষরের নাম লিখুন'
                          : 'Please enter at least 3 characters'
                        : undefined
                    }
                  >
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder={locale === 'bn' ? 'যেমন: ডা. সাবরিনা ইসলাম' : 'e.g. Dr. Sabrina Islam'}
                      className={inputCls}
                    />
                  </FormField>

                  <FormField
                    label={locale === 'bn' ? 'পেশাগত পদবি / উপাধি' : 'Professional Designation / Title'}
                    required
                    error={
                      stepErrors.step1.includes('title')
                        ? locale === 'bn'
                          ? 'পদবি আবশ্যক'
                          : 'Designation is required'
                        : undefined
                    }
                  >
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={locale === 'bn' ? 'যেমন: শিশুরোগ বিশেষজ্ঞ' : 'e.g. Consultant Pediatrician'}
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={locale === 'bn' ? 'অভিজ্ঞতার বছর' : 'Years of Experience'}
                    helpText={locale === 'bn' ? 'প্র্যাকটিসের বছর' : 'How many years in practice'}
                  >
                    <input
                      type="number"
                      min={0}
                      max={70}
                      value={experienceYears}
                      onChange={e => setExperienceYears(e.target.value)}
                      placeholder={locale === 'bn' ? 'যেমন: ৮' : 'e.g. 8'}
                      className={inputCls}
                    />
                  </FormField>

                  <FormField
                    label={locale === 'bn' ? 'পরামর্শ ফি (BDT)' : 'Consultation Fee (BDT)'}
                    helpText={locale === 'bn' ? 'প্রতি সেশন' : 'Per session'}
                  >
                    <input
                      type="number"
                      min={0}
                      value={consultationFeeBDT}
                      onChange={e => setConsultationFeeBDT(e.target.value)}
                      placeholder={locale === 'bn' ? 'যেমন: ১২০০' : 'e.g. 1200'}
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <FormField
                  label={locale === 'bn' ? 'পেশাগত সারাংশ ও অভিজ্ঞতা' : 'Professional Summary & Experience'}
                  required
                  error={
                    stepErrors.step1.includes('bio')
                      ? locale === 'bn'
                        ? 'অন্তত ২০ অক্ষরের সারাংশ লিখুন'
                        : 'Please write at least 20 characters'
                      : undefined
                  }
                  helpText={
                    locale === 'bn'
                      ? 'আপনার ডিগ্রি, হাসপাতাল/ফার্মের সাথে সংযুক্তি ও অভিজ্ঞতার বছর উল্লেখ করুন'
                      : 'Mention your degrees, hospital/firm affiliations, and years in practice'
                  }
                >
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder={
                      locale === 'bn'
                        ? 'আপনার ডিগ্রি, হাসপাতাল ও অভিজ্ঞতা সংক্ষেপে লিখুন...'
                        : 'Summarize your degrees, hospital/firm affiliations, and years in practice...'
                    }
                    className={`${inputCls} resize-none`}
                  />
                </FormField>
              </div>
            )}

            {/* ============== STEP 2 ============== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {locale === 'bn' ? '২. নিয়ন্ত্রক লাইসেন্স যাচাই' : '2. Regulatory License Validation'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={locale === 'bn' ? 'নিয়ন্ত্রক বোর্ড / যাচাইকারী সংস্থা' : 'Regulatory Board / Verification Body'}
                    required
                    helpText={locale === 'bn' ? 'ধাপ ১ থেকে নির্বাচিত' : 'Set from Step 1'}
                  >
                    <input
                      type="text"
                      disabled
                      value={verificationBody}
                      className="w-full p-2.5 text-sm text-gray-700 font-bold bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                    />
                  </FormField>

                  <FormField
                    label={locale === 'bn' ? 'সরকারি নিবন্ধন / লাইসেন্স নং' : 'Official Registration / License No.'}
                    required
                    error={
                      stepErrors.step2.includes('licenseNumber')
                        ? locale === 'bn'
                          ? 'অন্তত ৪ অক্ষরের লাইসেন্স নম্বর লিখুন'
                          : 'Please enter at least 4 characters'
                        : undefined
                    }
                  >
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. BMDC Reg A-98721 or IEB M-14502"
                      className={`${inputCls} font-mono font-bold uppercase`}
                    />
                  </FormField>
                </div>

                <FormField
                  label={locale === 'bn' ? 'সার্টিফিকেট / বার আইডি স্ক্যান আপলোড' : 'Upload Certificate / Bar ID Scan'}
                  required
                  error={
                    stepErrors.step2.includes('certificate')
                      ? locale === 'bn'
                        ? 'সার্টিফিকেট স্ক্যান আপলোড আবশ্যক'
                        : 'Please upload your certificate scan'
                      : undefined
                  }
                  helpText={locale === 'bn' ? 'PDF, JPG, PNG সর্বোচ্চ ১০MB' : 'PDF, JPG, PNG up to 10MB'}
                >
                  <label
                    htmlFor="certificate-upload"
                    className={`border-2 border-dashed rounded-2xl p-8 text-center bg-gray-50 transition-colors cursor-pointer flex flex-col items-center gap-2 ${
                      stepErrors.step2.includes('certificate')
                        ? 'border-red-300 hover:border-red-400'
                        : 'border-gray-300 hover:border-[#34C759]'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    {certificateFile ? (
                      <>
                        <p className="text-xs font-bold text-gray-900">
                          {certificateFile.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {(certificateFile.size / 1024).toFixed(1)} KB · {locale === 'bn' ? 'আপলোড সম্পন্ন' : 'Ready to upload'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-gray-700">
                          {locale === 'bn' ? 'আপলোড করতে ক্লিক করুন বা ফাইল টেনে আনুন' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {locale === 'bn' ? 'অফিসিয়াল সনদপত্র' : 'Official credentials'} · PDF, JPG, PNG {locale === 'bn' ? 'সর্বোচ্চ' : 'up to'} 10MB
                        </p>
                      </>
                    )}
                    <input
                      id="certificate-upload"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={handleCertificateChange}
                      className="hidden"
                    />
                  </label>
                </FormField>
              </div>
            )}

            {/* ============== STEP 3 ============== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {locale === 'bn' ? '৩. পেআউট ও এসক্রো বিতরণ' : '3. Payout & Escrow Disbursement'}
                </h3>

                <FormField
                  label={locale === 'bn' ? 'পেআউট পদ্ধতি' : 'Payout Method'}
                  required
                >
                  <div className="grid grid-cols-3 gap-2">
                    {(['BKASH', 'NAGAD', 'BANK'] as const).map(m => {
                      const isSelected = payoutMethod === m;
                      const labels = { BKASH: 'bKash', NAGAD: 'Nagad', BANK: 'Bank' };
                      return (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setPayoutMethod(m)}
                          className={`py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                            isSelected
                              ? 'border-[#34C759] bg-[#34C759]/5 text-gray-900'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {labels[m]}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                {payoutMethod === 'BANK' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label={locale === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'}
                      required
                      error={
                        stepErrors.step3.includes('payoutBankName')
                          ? locale === 'bn'
                            ? 'ব্যাংকের নাম আবশ্যক'
                            : 'Bank name is required'
                          : undefined
                      }
                    >
                      <input
                        type="text"
                        value={payoutBankName}
                        onChange={e => setPayoutBankName(e.target.value)}
                        placeholder={locale === 'bn' ? 'যেমন: ডাচ বাংলা ব্যাংক' : 'e.g. Dutch Bangla Bank'}
                        className={inputCls}
                      />
                    </FormField>
                    <FormField
                      label={locale === 'bn' ? 'হিসাবের নাম' : 'Account Name'}
                      required
                      error={
                        stepErrors.step3.includes('payoutAccountName')
                          ? locale === 'bn'
                            ? 'হিসাবের নাম আবশ্যক'
                            : 'Account name is required'
                          : undefined
                      }
                    >
                      <input
                        type="text"
                        value={payoutAccountName}
                        onChange={e => setPayoutAccountName(e.target.value)}
                        placeholder={locale === 'bn' ? 'হিসাবধারীর নাম' : 'Account holder name'}
                        className={inputCls}
                      />
                    </FormField>
                  </div>
                ) : null}

                <FormField
                  label={
                    payoutMethod === 'BANK'
                      ? locale === 'bn'
                        ? 'হিসাব নম্বর'
                        : 'Account Number'
                      : locale === 'bn'
                        ? `${payoutMethod === 'BKASH' ? 'bKash' : 'Nagad'} মোবাইল নম্বর`
                        : `${payoutMethod === 'BKASH' ? 'bKash' : 'Nagad'} Mobile Number`
                  }
                  required
                  error={
                    stepErrors.step3.includes('payoutMobile')
                      ? locale === 'bn'
                        ? 'একটি বৈধ ১১-সংখ্যার নম্বর লিখুন'
                        : 'Please enter a valid 11-digit number'
                      : undefined
                  }
                >
                  <input
                    type="text"
                    value={payoutMobile}
                    onChange={e => setPayoutMobile(e.target.value)}
                    placeholder={
                      payoutMethod === 'BANK'
                        ? locale === 'bn'
                          ? 'যেমন: ১২৩৪৫৬৭৮৯০'
                          : 'e.g. 1234567890'
                        : '017XXXXXXXX'
                    }
                    className={`${inputCls} font-mono`}
                  />
                </FormField>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                    {locale === 'bn' ? 'সরাসরি BDT স্বয়ংক্রিয় নিষ্পত্তি' : 'Direct BDT Automatic Settlement'}
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    {locale === 'bn'
                      ? 'পরামর্শ ফি withU এসক্রোতে নিরাপদে রাখা হয় এবং অ্যাপয়েন্টমেন্ট শেষে আপনার যাচাইকৃত ওয়ালেটে ১০-১৫% প্ল্যাটফর্ম ব্রোকারেজ কর্তনের পরে তাৎক্ষণিকভাবে জমা হয়।'
                      : 'Consultation fees are held safely in withU Escrow until the appointment concludes, and credited to your verified wallet immediately with 10-15% platform brokerage deduction.'}
                  </p>
                </div>
              </div>
            )}

            {/* ============== STEP 4 ============== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {locale === 'bn' ? '৪. তথ্য পর্যালোচনা' : '4. Review Information'}
                </h3>

                <div className="divide-y divide-gray-100 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                  <ReviewRow label={locale === 'bn' ? 'নাম' : 'Name'} value={fullName} />
                  <ReviewRow label={locale === 'bn' ? 'পদবি' : 'Designation'} value={title} />
                  <ReviewRow label={locale === 'bn' ? 'বিভাগ' : 'Discipline'} value={DISCIPLINES.find(d => d.id === discipline)?.label || ''} />
                  <ReviewRow label={locale === 'bn' ? 'যাচাইকারী সংস্থা' : 'Verification Body'} value={verificationBody} />
                  <ReviewRow label={locale === 'bn' ? 'লাইসেন্স নম্বর' : 'License No.'} value={licenseNumber} mono />
                  <ReviewRow label={locale === 'bn' ? 'অভিজ্ঞতা' : 'Experience'} value={experienceYears ? `${experienceYears} ${locale === 'bn' ? 'বছর' : 'years'}` : '—'} />
                  <ReviewRow
                    label={locale === 'bn' ? 'পরামর্শ ফি' : 'Consultation Fee'}
                    value={consultationFeeBDT ? `৳${consultationFeeBDT}` : '—'}
                  />
                  <ReviewRow
                    label={locale === 'bn' ? 'পেআউট গন্তব্য' : 'Payout Destination'}
                    value={
                      payoutMethod === 'BANK'
                        ? `${payoutBankName} · ${payoutMobile}`
                        : `${payoutMethod} · ${payoutMobile}`
                    }
                  />
                  <ReviewRow
                    label={locale === 'bn' ? 'সার্টিফিকেট' : 'Certificate'}
                    value={certificateFile?.name || (locale === 'bn' ? 'আপলোড হয়নি' : 'Not uploaded')}
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 accent-[#34C759] h-4 w-4"
                  />
                  <span>
                    {locale === 'bn'
                      ? 'আমি ঘোষণা করছি যে প্রদত্ত সমস্ত পেশাগত সার্টিফিকেট ও লাইসেন্স বাংলাদেশের আইন অনুযায়ী প্রকৃত ও অনুমোদিত।'
                      : 'I declare that all professional certificates and license credentials provided are genuine and authorized under the laws of Bangladesh.'}
                  </span>
                </label>
                {stepErrors.step4.includes('agreed') && (
                  <p className="text-xs text-red-600 font-medium -mt-2">
                    {locale === 'bn'
                      ? 'আবেদন জমা দিতে ঘোষণায় সম্মত হন'
                      : 'Please agree to the declaration before submitting'}
                  </p>
                )}
              </div>
            )}

            {/* ===== Navigation ===== */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8 gap-3">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {locale === 'bn' ? 'পিছনে' : 'Back'}
              </button>

              {currentStep < 4 ? (
                <div className="flex items-center gap-3">
                  {!isStepValid(currentStep) && (
                    <span className="text-[11px] font-semibold text-amber-600 hidden sm:inline">
                      {locale === 'bn' ? 'প্রয়োজনীয় সব তথ্য পূরণ করুন' : 'Please fill all required fields'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#34C759] transition"
                  >
                    <span>{locale === 'bn' ? 'পরবর্তী' : 'Continue'}</span>
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
                    ? locale === 'bn'
                      ? 'জমা হচ্ছে…'
                      : 'Submitting…'
                    : locale === 'bn'
                    ? 'আবেদন জমা দিন'
                    : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

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