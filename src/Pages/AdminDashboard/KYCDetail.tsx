import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, ShieldCheck } from 'lucide-react';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import { MoneyValue } from '../../components/common/MoneyValue';
import { EmptyState } from '../../components/common/EmptyState';
import { ApiService } from '../../services/api';
import {
  ATTACHMENTS,
  DECLARATION_CLAUSES,
  CONSULTATION_MODES,
  SESSION_MODES,
  WEEK_DAYS,
} from '../../constants/expertAgreement';
import type { ExpertDocument, ExpertProfile } from '../../types';
import type { AdminOutletContext } from './AdminOutletContext';
import { STATUS_LABEL } from './KYC';

/**
 * Admin → KYC → "Inspect Credentials", as its own route
 * (`/admin/kyc/:expertId`) instead of an overlay modal — so a reviewer can
 * bookmark, share, or open a specific application straight from a link
 * (e.g. from the "New Expert Application Submitted" notification) rather
 * than having to land on the queue first and click through to it.
 *
 * Renders everything the applicant submitted through the Expert
 * Verification & Initial Agreement, in the same three sections as the
 * paper form, plus the real uploaded documents and the reviewer audit
 * trail — the full record a compliance officer approves or declines from.
 */

const DOC_STATUS_STYLES: Record<ExpertDocument['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const KYCDetailTab: React.FC = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const { experts, loading, handleApproveExpert, handleRejectExpert, handleSuspendExpert } =
    useOutletContext<AdminOutletContext>();

  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const listExpert = useMemo(() => experts.find(e => e.id === expertId), [experts, expertId]);

  // The KYC queue list (`GET /api/experts`) deliberately strips document file
  // bytes/URLs for bandwidth — `listExpert.documents` only ever carries
  // filename/type/status metadata, never something to open. `GET
  // /api/experts/:id` is the endpoint built for exactly this screen (its own
  // server comment: "keep the document bytes so the admin inspection modal
  // ... can render them"), so fetch it once we know which expert we're on to
  // get real, openable file links.
  const [detailedDocuments, setDetailedDocuments] = useState<ExpertDocument[] | null>(null);

  useEffect(() => {
    setDetailedDocuments(null);
    if (!expertId) return;
    let cancelled = false;
    ApiService.getExpertByUserId(expertId).then((full: ExpertProfile | null) => {
      if (!cancelled && full?.documents) setDetailedDocuments(full.documents);
    });
    return () => {
      cancelled = true;
    };
  }, [expertId]);

  const expert = listExpert;
  const documents = detailedDocuments ?? expert?.documents ?? [];

  const goToQueue = () => navigate('/admin/kyc');

  const run = async (fn: () => void | Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      goToQueue();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64"
        aria-busy="true"
      />
    );
  }

  if (!expert) {
    return (
      <div className="space-y-4">
        <BackLink onClick={goToQueue} />
        <EmptyState
          title="Application Not Found"
          description="This expert application may have been removed, approved elsewhere, or the link is out of date. Go back to the queue and try again."
        />
      </div>
    );
  }

  const agreement = expert.agreement;
  const isPending = expert.status === 'SUBMITTED' || expert.status === 'UNDER_REVIEW';
  const isApproved = expert.status === 'APPROVED';
  const meta = STATUS_LABEL[expert.status];

  const availability = agreement?.availableDays?.length
    ? `${WEEK_DAYS.filter(d => agreement.availableDays.includes(d.id))
        .map(d => d.label.en)
        .join(', ')} · ${agreement.availableFrom}–${agreement.availableTo}`
    : undefined;

  return (
    <div className="space-y-6">
      <BackLink onClick={goToQueue} />

      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={
                expert.avatarUrl ||
                'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop&q=80'
              }
              alt={expert.displayName}
              className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-lg font-bold  truncate">{expert.displayName}</h3>
              <p className="text-xs text-blue-700 font-bold">{expert.profession}</p>
              <p className="text-[11px] text-gray-500 truncate">{expert.specialization}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${meta.className}`}>
            {meta.label}
          </span>
        </div>

        {/* Regulatory ID */}
        <div className="p-3 bg-gray-50 rounded-xl space-y-1">
          <span className="text-gray-400 block uppercase font-bold text-[10px]">
            Official Regulatory ID
          </span>
          <span className="font-mono font-bold text-sm ">
            {agreement?.associationMemberNo || expert.officialLicenseNumber || '—'}
          </span>
          <span className="block text-gray-500 text-xs">
            Board: {agreement?.associationName || expert.verificationBody || 'Not specified'}
          </span>
        </div>

        {agreement ? (
          <>
            <Section title="1. Expert Details">
              <Row label="Full name (as per NID)" value={agreement.fullNameAsPerNid} />
              <Row label="Designation" value={agreement.designation} />
              <Row label="Organization" value={agreement.organization} />
              <Row label="Mobile / WhatsApp" value={agreement.mobile} mono />
              <Row label="Email" value={agreement.email} />
              <Row label={`${agreement.idType} No.`} value={agreement.idNumberMasked} mono />
              <Row
                label="Highest degree & year"
                value={
                  agreement.highestDegreeYear
                    ? `${agreement.highestDegree} (${agreement.highestDegreeYear})`
                    : agreement.highestDegree
                }
              />
              <Row label="Field of expertise" value={agreement.fieldOfExpertise} />
              <Row label="Total experience" value={`${agreement.totalExperienceYears} years`} />
              <Row
                label="Association & member no."
                value={`${agreement.associationName} · ${agreement.associationMemberNo}`}
                mono
              />
              <Row label="Full address (internal only)" value={expert.address} />
              {expert.portfolioUrl && <Row label="Portfolio / Website" value={expert.portfolioUrl} />}
              {expert.linkedinUrl && <Row label="LinkedIn" value={expert.linkedinUrl} />}
            </Section>

            <Section title="2. Engagement Terms">
              <Row
                label="Session mode"
                value={
                  SESSION_MODES.find(m => m.id === agreement.sessionMode)?.label.en ||
                  agreement.sessionMode
                }
              />
              {(agreement.consultationModes ?? []).length > 0 && (
                <Row
                  label="Consultation mode"
                  value={(agreement.consultationModes ?? [])
                    .map(
                      (id: string) =>
                        CONSULTATION_MODES.find(m => m.id === id)?.label.en || id,
                    )
                    .join(', ')}
                />
              )}
              <Row label="Available days & time" value={availability} />
              <Row label="Session duration" value={`${agreement.sessionDurationMinutes} minutes`} />
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-gray-500 font-semibold">Agreed fee per session</span>
                <MoneyValue amount={agreement.agreedFeePerSessionBDT} className=" font-bold" />
              </div>
              <Row
                label="Payment method & no."
                value={`${agreement.paymentBankName || agreement.paymentMethod} · ${agreement.paymentAccountMasked}`}
                mono
              />
              <Row label="Effective from" value={agreement.effectiveFrom} />
            </Section>

            {/* Declaration */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold  uppercase tracking-wider">
                3. Declaration &amp; Consent
              </h4>
              <ul className="space-y-1.5">
                {DECLARATION_CLAUSES.map((clause, idx) => (
                  <li key={clause.key} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span
                      className={`mt-0.5 shrink-0 font-bold ${
                        agreement.consents[clause.key] ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {agreement.consents[clause.key] ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-600">
                      <span className="font-bold  mr-1">{idx + 1}.</span>
                      {clause.text.en}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2">
                {ATTACHMENTS.map(a => (
                  <span
                    key={a.key}
                    className={`text-[11px] font-semibold ${
                      agreement.attachments[a.key] ? 'text-emerald-700' : 'text-gray-400'
                    }`}
                  >
                    {agreement.attachments[a.key] ? '✓' : '○'} {a.label.en}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 pt-2">
                Signed by <span className="font-bold text-gray-800">{agreement.signatureName}</span> on{' '}
                <DateTimeValue isoUtcString={agreement.signedAt} />
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
            This provider predates the verification agreement, so only their profile fields are on
            file. Approve on the strength of the uploaded documents below.
          </p>
        )}

        {/* Uploaded documents — the real records, not a placeholder. */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold  uppercase tracking-wider">
            Uploaded Documents ({documents.length})
          </h4>
          {documents.length ? (
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
                      {doc.type}
                      {doc.documentNumber ? ` · ${doc.documentNumber}` : ''} ·{' '}
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={doc.fileName}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      View
                    </a>
                  ) : detailedDocuments === null ? (
                    <span className="text-[11px] text-gray-400 shrink-0 animate-pulse">
                      Loading link…
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 shrink-0">No file on record</span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${DOC_STATUS_STYLES[doc.status]}`}
                  >
                    {doc.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3">
              No documents were attached to this application.
            </p>
          )}
        </div>

        {/* Reviewer audit trail */}
        {expert.reviewerNotes?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold  uppercase tracking-wider">
              Review History
            </h4>
            <ul className="space-y-1.5">
              {expert.reviewerNotes.map(note => (
                <li key={note.id} className="text-[11px] text-gray-600 border-l-2 border-gray-200 pl-3">
                  <span className="font-bold text-gray-800">{note.action}</span> · {note.authorName} ·{' '}
                  <DateTimeValue isoUtcString={note.createdAt} />
                  <span className="block text-gray-500">{note.note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          {(isPending || isApproved) && (
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500">
                Reason {isApproved ? '(required to suspend)' : '(shown to the applicant if declined)'}
              </span>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. BMDC number could not be matched against the register"
                className="mt-1 w-full p-2 text-xs  bg-white border border-gray-300 rounded-xl outline-none focus:border-purple-500"
              />
            </label>
          )}

          <div className="flex items-center justify-end gap-3 flex-wrap">
            <button
              onClick={goToQueue}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Back to Queue
            </button>

            {isPending && (
              <>
                <button
                  disabled={busy}
                  onClick={() => run(() => handleRejectExpert(expert.id, reason))}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={busy}
                  onClick={() => run(() => handleApproveExpert(expert.id))}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Approve Provider
                </button>
              </>
            )}

            {isApproved && (
              <button
                disabled={busy}
                onClick={() => run(() => handleSuspendExpert(expert.id, reason))}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                Suspend Provider
              </button>
            )}

            {(expert.status === 'REJECTED' || expert.status === 'SUSPENDED') && (
              <button
                disabled={busy}
                onClick={() => run(() => handleApproveExpert(expert.id))}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                Reinstate Provider
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BackLink: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover: cursor-pointer"
  >
    <ArrowLeft className="w-3.5 h-3.5" />
    Back to KYC Queue
  </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-bold  uppercase tracking-wider">{title}</h4>
    <div className="divide-y divide-gray-100 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
      {children}
    </div>
  </div>
);

const Row: React.FC<{ label: string; value?: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
    <span className="text-gray-500 font-semibold">{label}</span>
    <span className={` font-bold text-right break-all ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export default KYCDetailTab;
