import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Eye, FileText, ShieldCheck, Star, X } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { ExpertProfile, ExpertStatus } from '../../types';
import type { AdminOutletContext } from './AdminOutletContext';


export const KYCTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    experts,
    loading,
    handleApproveExpert,
    handleRejectExpert,
    handleSuspendExpert,
  } = useOutletContext<AdminOutletContext>();

  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>(
    'PENDING',
  );

  const isPendingStatus = (s: ExpertStatus) => s === 'SUBMITTED' || s === 'UNDER_REVIEW';
  const isVerifiedStatus = (s: ExpertStatus) => s === 'APPROVED';
  const isRejectedStatus = (s: ExpertStatus) => s === 'REJECTED' || s === 'SUSPENDED';

  const filteredExperts = useMemo<ExpertProfile[]>(() => {
    if (statusFilter === 'ALL') return experts;
    if (statusFilter === 'PENDING') return experts.filter((e) => isPendingStatus(e.status));
    if (statusFilter === 'VERIFIED') return experts.filter((e) => isVerifiedStatus(e.status));
    return experts.filter((e) => isRejectedStatus(e.status));
  }, [experts, statusFilter]);

  const counts = useMemo(() => {
    const pending = experts.filter((e) => isPendingStatus(e.status)).length;
    const verified = experts.filter((e) => isVerifiedStatus(e.status)).length;
    const rejected = experts.filter((e) => isRejectedStatus(e.status)).length;
    return { pending, verified, rejected };
  }, [experts]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero card for the KYC pipeline */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-blue-300" />
            <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
              Provider Onboarding
            </span>
          </div>
          <h3 className="text-2xl font-extrabold mb-2">KYC &amp; Credentials Review</h3>
          <p className="text-blue-100 text-sm max-w-2xl">
            Inspect professional licenses, board certifications and uploaded BMDC documents for
            every expert on the platform. Verified providers can publish services and accept
            bookings.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <StatTile label="Pending" value={counts.pending} accent="amber" />
          <StatTile label="Verified" value={counts.verified} accent="emerald" />
          <StatTile label="Rejected" value={counts.rejected} accent="red" />
        </div>
      </div>

      {/* Filter pill bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all ${
              statusFilter === s
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-400'
            }`}
          >
            {s === 'ALL' ? 'All Providers' : `${s} Experts`}
            {s === 'PENDING' && counts.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredExperts.length === 0 ? (
        <EmptyState
          title="No Providers For This Filter"
          description="The KYC queue is empty for this status. Switch filters or refresh to pull latest onboarding submissions."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredExperts.map((expert) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              onInspect={() => navigate(`/admin/kyc/${expert.id}`)}
              onApprove={() => handleApproveExpert(expert.id)}
              onReject={() => handleRejectExpert(expert.id)}
              onSuspend={() => handleSuspendExpert(expert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Helper widgets                                                     */
/* ------------------------------------------------------------------ */

interface StatTileProps {
  label: string;
  value: number;
  accent: 'amber' | 'emerald' | 'red';
}

const StatTile: React.FC<StatTileProps> = ({ label, value, accent }) => {
  const accentMap = {
    amber: 'bg-amber-400/20 text-amber-100 border-amber-400/30',
    emerald: 'bg-emerald-400/20 text-emerald-100 border-emerald-400/30',
    red: 'bg-red-400/20 text-red-100 border-red-400/30',
  };
  return (
    <div className={`rounded-2xl border p-4 text-center min-w-[100px] ${accentMap[accent]}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-widest">{label}</p>
    </div>
  );
};

interface ExpertCardProps {
  expert: ExpertProfile;
  onInspect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
}

export const STATUS_LABEL: Record<ExpertStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  SUBMITTED: {
    label: 'PENDING REVIEW',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  UNDER_REVIEW: {
    label: 'UNDER REVIEW',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  APPROVED: {
    label: 'VERIFIED',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  REJECTED: { label: 'REJECTED', className: 'bg-red-100 text-red-700 border-red-200' },
  SUSPENDED: { label: 'SUSPENDED', className: 'bg-red-100 text-red-700 border-red-200' },
};

const ExpertCard: React.FC<ExpertCardProps> = ({
  expert,
  onInspect,
  onApprove,
  onReject,
  onSuspend,
}) => {
  const isPending = expert.status === 'SUBMITTED' || expert.status === 'UNDER_REVIEW';
  const isApproved = expert.status === 'APPROVED';
  const meta = STATUS_LABEL[expert.status];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      <div className="p-5 flex items-start gap-3">
        <img
          src={
            expert.avatarUrl ||
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop&q=80'
          }
          alt={expert.displayName}
          className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{expert.displayName}</p>
          <p className="text-xs text-blue-700 font-bold">{expert.profession}</p>
          <p className="text-[10px] text-gray-500 truncate">{expert.specialization}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.className}`}>
          {meta.label}
        </span>
      </div>

      <div className="px-5 pb-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            License
          </p>
          <p className="font-mono text-gray-700 truncate">
            {expert.officialLicenseNumber || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            Verification Body
          </p>
          <p className="font-bold text-gray-700 truncate">
            {expert.verificationBody || 'Not specified'}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-gray-700 text-sm">
              {expert.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-500">
              ({expert.reviewCount} reviews)
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {expert.yearsOfExperience} yr exp.
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 flex flex-wrap gap-2">
        <button
          onClick={onInspect}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Inspect Credentials
        </button>

        {isPending ? (
          <>
            <button
              onClick={onReject}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
            <button
              onClick={onApprove}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:opacity-90 text-white rounded-xl font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-opacity shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Approve
            </button>
          </>
        ) : (
          <button
            onClick={isApproved ? onSuspend : onApprove}
            className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
              isApproved
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
            }`}
          >
            {isApproved ? 'Suspend' : 'Reactivate'}
          </button>
        )}
      </div>
    </div>
  );
};

export default KYCTab;
