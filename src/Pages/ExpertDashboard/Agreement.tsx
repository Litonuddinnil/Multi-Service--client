import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CheckCircle2, FileSignature, FileText, XCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { EmptyState } from '../../components/common/EmptyState';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import { MoneyValue } from '../../components/common/MoneyValue';
import {
  ATTACHMENTS,
  CONSULTATION_MODES,
  DECLARATION_CLAUSES,
  SESSION_MODES,
  WEEK_DAYS,
} from '../../constants/expertAgreement';
import type { ExpertDocument, ExpertStatus } from '../../types';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Agreement tab.
 *
 * Read-only rendering of the "Expert Verification & Initial Agreement"
 * (এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র) the expert signed during onboarding,
 * laid out in the same three sections as the paper form so a scanned copy can
 * be reconciled against it line by line.
 *
 * Nothing here is editable: changing agreed terms is a compliance action, so
 * the tab links back to the onboarding wizard instead of writing in place.
 */

const STATUS_COPY: Record<ExpertStatus, { label: string; className: string; note: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    note: 'This application has not been submitted yet.',
  },
  SUBMITTED: {
    label: 'Pending Verification',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    note: 'Compliance verifies membership numbers with the issuing authority within 12-24 hours.',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    note: 'A compliance officer is reviewing your documents right now.',
  },
  APPROVED: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    note: 'Your profile is live. A detailed service contract supersedes this preliminary agreement.',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    note: 'Your application was not accepted. See the reviewer notes below.',
  },
  SUSPENDED: {
    label: 'Suspended',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    note: 'Your profile is suspended. Contact withU compliance to restore it.',
  },
};

const DOC_STATUS_STYLES: Record<ExpertDocument['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const ExpertAgreementTab: React.FC = () => {
  const { agreement, profile, loading } = useOutletContext<ExpertOutletContext>();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const bn = locale === 'bn';

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-48" />
        ))}
      </div>
    );
  }

  if (!agreement) {
    return (
      <EmptyState
        icon={FileSignature}
        title={bn ? 'কোনো সম্মতিপত্র জমা হয়নি' : 'No agreement on file'}
        description={
          bn
            ? 'এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র পূরণ করলে সেটি এখানে দেখা যাবে।'
            : 'Complete the Expert Verification & Initial Agreement and the signed copy will appear here.'
        }
        actionLabel={bn ? 'সম্মতিপত্র পূরণ করুন' : 'Complete Verification'}
        onAction={() => navigate('/become-expert')}
      />
    );
  }

  const status = profile?.status ?? 'SUBMITTED';
  const statusCopy = STATUS_COPY[status];
  const documents = profile?.documents ?? [];

  const availability = agreement.availableDays.length
    ? `${WEEK_DAYS.filter(d => agreement.availableDays.includes(d.id))
        .map(d => (bn ? d.label.bn : d.label.en))
        .join(', ')} · ${agreement.availableFrom}–${agreement.availableTo}`
    : '—';

  const sessionModeLabel = (() => {
    const m = SESSION_MODES.find(x => x.id === agreement.sessionMode);
    return m ? (bn ? m.label.bn : m.label.en) : agreement.sessionMode;
  })();

  // Empty for agreements signed before the four-channel model, so the row is hidden below.
  const consultationModeLabel = (agreement.consultationModes ?? [])
    .map(id => {
      const m = CONSULTATION_MODES.find(x => x.id === id);
      return m ? (bn ? m.label.bn : m.label.en) : id;
    })
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Status header */}
      <header className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {bn ? 'এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র' : 'Expert Verification & Initial Agreement'}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {bn ? 'Expert Verification & Initial Agreement' : 'এক্সপার্ট যাচাই ও প্রাথমিক সম্মতিপত্র'}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${statusCopy.className}`}
          >
            {statusCopy.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{statusCopy.note}</p>
        {profile?.rejectionReason && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
            {profile.rejectionReason}
          </p>
        )}
      </header>

      {/* 1. Expert Details */}
      <AgreementSection
        index="1"
        en="Expert Details"
        bnText="এক্সপার্টের তথ্য"
        bn={bn}
      >
        <Row label={bn ? 'পুরো নাম' : 'Full Name'} value={agreement.fullNameAsPerNid} />
        <Row label={bn ? 'পদবি' : 'Designation'} value={agreement.designation} />
        <Row label={bn ? 'প্রতিষ্ঠান' : 'Organization'} value={agreement.organization} />
        <Row label={bn ? 'মোবাইল / হোয়াটসঅ্যাপ' : 'Mobile / WhatsApp'} value={agreement.mobile} mono />
        <Row label={bn ? 'ইমেল' : 'Email'} value={agreement.email} />
        <Row
          label={agreement.idType === 'NID' ? (bn ? 'এনআইডি নম্বর' : 'NID No.') : bn ? 'পাসপোর্ট নম্বর' : 'Passport No.'}
          value={agreement.idNumberMasked}
          mono
        />
        <Row
          label={bn ? 'সর্বোচ্চ ডিগ্রি ও সাল' : 'Highest Degree & Year'}
          value={
            agreement.highestDegreeYear
              ? `${agreement.highestDegree} (${agreement.highestDegreeYear})`
              : agreement.highestDegree
          }
        />
        <Row label={bn ? 'দক্ষতার ক্ষেত্র' : 'Field of Expertise'} value={agreement.fieldOfExpertise} />
        <Row
          label={bn ? 'মোট অভিজ্ঞতা' : 'Total Experience'}
          value={`${agreement.totalExperienceYears} ${bn ? 'বছর' : 'years'}`}
        />
        <Row
          label={bn ? 'অ্যাসোসিয়েশন ও সদস্য নং' : 'Association & Member No.'}
          value={`${agreement.associationName} · ${agreement.associationMemberNo}`}
          mono
        />
      </AgreementSection>

      {/* 2. Engagement Terms */}
      <AgreementSection index="2" en="Engagement Terms" bnText="সেবার শর্ত" bn={bn}>
        <Row label={bn ? 'সেশনের ধরন' : 'Session Mode'} value={sessionModeLabel} />
        {consultationModeLabel && (
          <Row label={bn ? 'পরামর্শের মাধ্যম' : 'Consultation Mode'} value={consultationModeLabel} />
        )}
        <Row label={bn ? 'উপলব্ধ দিন ও সময়' : 'Available Days & Time'} value={availability} />
        <Row
          label={bn ? 'সেশনের সময়কাল' : 'Session Duration'}
          value={`${agreement.sessionDurationMinutes} ${bn ? 'মিনিট' : 'minutes'}`}
        />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-gray-500 font-semibold">
            {bn ? 'প্রতি সেশনে সম্মত ফি' : 'Agreed Fee per Session'}
          </span>
          <MoneyValue
            amount={agreement.agreedFeePerSessionBDT}
            className=" font-bold"
          />
        </div>
        <Row
          label={bn ? 'পেমেন্ট পদ্ধতি ও নম্বর' : 'Payment Method & No.'}
          value={`${agreement.paymentBankName || agreement.paymentMethod} · ${agreement.paymentAccountMasked}`}
          mono
        />
        <Row label={bn ? 'কার্যকর তারিখ' : 'Effective From'} value={agreement.effectiveFrom} />
      </AgreementSection>

      {/* 3. Declaration & Consent */}
      <section className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 space-y-4">
        <SectionHeading index="3" en="Declaration & Consent" bnText="ঘোষণা ও সম্মতি" bn={bn} />
        <ol className="space-y-2.5">
          {DECLARATION_CLAUSES.map((clause, idx) => {
            const accepted = agreement.consents[clause.key];
            return (
              <li key={clause.key} className="flex items-start gap-2.5 text-xs leading-relaxed">
                {accepted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className={accepted ? 'text-gray-700' : 'text-gray-400'}>
                  <span className="font-bold  mr-1">{idx + 1}.</span>
                  {bn ? clause.text.bn : clause.text.en}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Documents attached */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-bold text-gray-900">
            {bn ? 'সংযুক্ত নথি' : 'Documents attached'}
          </h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {ATTACHMENTS.map(a => {
              const attached = agreement.attachments[a.key];
              return (
                <span
                  key={a.key}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    attached ? 'text-[#248a3d]' : 'text-gray-400'
                  }`}
                >
                  {attached ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="w-3.5 h-3.5 border border-gray-300 rounded-xs" />
                  )}
                  {bn ? a.label.bn : a.label.en}
                </span>
              );
            })}
          </div>

          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map(doc => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl"
                >
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold  truncate">{doc.fileName}</p>
                    <p className="text-[11px] text-gray-500">
                      {doc.type} · {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${
                      DOC_STATUS_STYLES[doc.status]
                    }`}
                  >
                    {doc.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Signature */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {bn ? 'এক্সপার্টের স্বাক্ষর' : 'Signature of Expert'}
            </span>
            <p className="text-sm font-bold  mt-1">{agreement.signatureName}</p>
            <p className="text-[11px] text-gray-500">
              <DateTimeValue isoDate={agreement.signedAt} />
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {bn ? 'withU — অনুমোদিত স্বাক্ষরকারী' : 'For withU — Authorised Signatory'}
            </span>
            <p className="text-sm font-bold  mt-1">
              {agreement.authorisedSignatoryName ||
                (status === 'APPROVED' ? 'withU Compliance' : '—')}
            </p>
            <p className="text-[11px] text-gray-500">
              {agreement.verifiedAt ? <DateTimeValue isoDate={agreement.verifiedAt} /> : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Office use */}
      <footer className="bg-[#F8FAFC] border border-gray-200 rounded-2xl px-5 py-4 flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-gray-500">
        <span>
          {bn ? 'অফিস ব্যবহার — এক্সপার্ট আইডি' : 'Office use — Expert ID'}:{' '}
          <span className="font-mono font-bold text-gray-800">
            {agreement.expertRefId || profile?.id || '—'}
          </span>
        </span>
        <span>
          {bn ? 'যাচাই করেছেন' : 'Verified by'}:{' '}
          <span className="font-bold text-gray-800">{agreement.verifiedBy || '—'}</span>
        </span>
        <span>
          {bn ? 'তারিখ' : 'Date'}:{' '}
          <span className="font-bold text-gray-800">
            {agreement.verifiedAt ? <DateTimeValue isoDate={agreement.verifiedAt} /> : '—'}
          </span>
        </span>
      </footer>
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
    <h3 className="text-base font-bold text-gray-900">
      {index}. {bn ? bnText : en}
    </h3>
    <p className="text-[11px] text-gray-400">{bn ? en : bnText}</p>
  </div>
);

const AgreementSection: React.FC<{
  index: string;
  en: string;
  bnText: string;
  bn: boolean;
  children: React.ReactNode;
}> = ({ index, en, bnText, bn, children }) => (
  <section className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 space-y-4">
    <SectionHeading index={index} en={en} bnText={bnText} bn={bn} />
    <div className="divide-y divide-gray-100 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
      {children}
    </div>
  </section>
);

const Row: React.FC<{ label: string; value?: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
    <span className="text-gray-500 font-semibold">{label}</span>
    <span className={` font-bold text-right break-all ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export default ExpertAgreementTab;
