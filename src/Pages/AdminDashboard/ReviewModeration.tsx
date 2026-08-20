import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, Flag, Search, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EmptyState } from '../../components/common/EmptyState';
import type { ReviewItem } from '../../types';

/**
 * Admin Dashboard → Reviews Moderation tab.
 *
 * Lists all reviews in the system (any status) with eager filters for
 * Pending / Approved / Hidden. Each row exposes one-click moderation
 * actions. After every action the server recomputes the expert's
 * aggregated rating via `recomputeExpertRating`, so the public expert
 * profile updates without a refresh.
 */
export const ReviewModerationTab: React.FC = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REMOVED'>('PENDING');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingModeration, setPendingModeration] = useState<
    { review: ReviewItem; action: 'APPROVED' | 'PENDING' | 'REMOVED'; reason: string } | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.fetchReviews();
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (statusFilter !== 'ALL' && r.moderationStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.customerName.toLowerCase().includes(q) ||
          r.serviceTitle.toLowerCase().includes(q) ||
          (r.expertId || '').toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      pending: reviews.filter(r => r.moderationStatus === 'PENDING').length,
      approved: reviews.filter(r => r.moderationStatus === 'APPROVED').length,
      removed: reviews.filter(r => r.moderationStatus === 'REMOVED').length,
      total: reviews.length,
    };
  }, [reviews]);

  const moderate = useCallback(
    (review: ReviewItem, action: 'APPROVED' | 'PENDING' | 'REMOVED') => {
      // F0 dialog replaces window.prompt: open the dialog with a sensible
      // default reason that the admin can edit before confirming.
      const defaultReason =
        action === 'REMOVED'
          ? 'Hidden by moderator'
          : action === 'PENDING'
            ? 'Flagged for moderator review'
            : '';
      setPendingModeration({ review, action, reason: defaultReason });
    },
    [],
  );

  const submitModeration = useCallback(async () => {
    if (!pendingModeration) return;
    const { review, action, reason } = pendingModeration;
    setPendingModeration(null);
    setBusyId(review.id);
    try {
      const finalReason = reason.trim() || undefined;
      const updated = await ApiService.moderateReview(review.id, action, finalReason);
      if (updated) {
        setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)));
        showToast(
          action === 'APPROVED'
            ? 'Review approved.'
            : action === 'REMOVED'
              ? 'Review hidden from public view.'
              : 'Review flagged for review.',
          'success',
        );
      } else {
        showToast('Moderation action failed.', 'error');
      }
    } finally {
      setBusyId(null);
    }
  }, [pendingModeration, showToast]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Reviews Moderation Queue</h2>
            <p className="text-xs text-gray-500">
              Approve, flag, or hide customer reviews. Changes immediately
              update the expert's aggregated rating on the public profile.
            </p>
          </div>
        </div>
      </div>

      {/* Filters + counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CountTile label="Pending" value={counts.pending} tone="amber" />
        <CountTile label="Approved" value={counts.approved} tone="green" />
        <CountTile label="Hidden" value={counts.removed} tone="red" />
        <CountTile label="Total" value={counts.total} tone="purple" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1">
          {(['PENDING', 'APPROVED', 'REMOVED', 'ALL'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                statusFilter === s
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, service, or expert…"
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={`No ${statusFilter === 'ALL' ? '' : statusFilter.toLowerCase() + ' '}reviews`}
          description="When customers post reviews that need attention, they will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <ModerationRow
              key={review.id}
              review={review}
              busy={busyId === review.id}
              onApprove={() => moderate(review, 'APPROVED')}
              onFlag={() => moderate(review, 'PENDING')}
              onHide={() => moderate(review, 'REMOVED')}
            />
          ))}
        </div>
      )}

      {/* ========== F0 Confirmation Dialog (replaces window.prompt) ========== */}
      <ConfirmationDialog
        open={pendingModeration !== null}
        title={
          pendingModeration?.action === 'REMOVED'
            ? 'Hide this review'
            : pendingModeration?.action === 'PENDING'
              ? 'Flag for moderation'
              : 'Approve review'
        }
        message={
          pendingModeration?.action === 'REMOVED'
            ? 'Provide a reason. The customer will not see this reason publicly.'
            : pendingModeration?.action === 'PENDING'
              ? 'Flag this review for further review. Add a short note (optional).'
              : 'Approve this review? It will be visible to all users.'
        }
        confirmLabel={
          pendingModeration?.action === 'REMOVED'
            ? 'Hide review'
            : pendingModeration?.action === 'PENDING'
              ? 'Flag review'
              : 'Approve review'
        }
        confirmVariant={
          pendingModeration?.action === 'APPROVED'
            ? 'success'
            : pendingModeration?.action === 'REMOVED'
              ? 'danger'
              : 'warning'
        }
        onConfirm={submitModeration}
        onCancel={() => setPendingModeration(null)}
      >
        {pendingModeration && pendingModeration.action !== 'APPROVED' && (
          <textarea
            value={pendingModeration.reason}
            onChange={(e) =>
              setPendingModeration({
                ...pendingModeration,
                reason: e.target.value,
              })
            }
            placeholder={
              pendingModeration.action === 'REMOVED'
                ? 'Reason for hiding this review...'
                : 'Reason for flagging...'
            }
            rows={3}
            className="w-full p-2 text-xs border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759]"
          />
        )}
      </ConfirmationDialog>
    </div>
  );
};

const CountTile: React.FC<{ label: string; value: number; tone: 'amber' | 'green' | 'red' | 'purple' }> = ({
  label,
  value,
  tone,
}) => {
  const palette: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${palette[tone]}`}>
        <Star className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[10px] uppercase font-bold text-gray-400 block">{label}</span>
        <span className="text-lg font-black text-gray-900">{value}</span>
      </div>
    </div>
  );
};

interface ModerationRowProps {
  review: ReviewItem;
  busy: boolean;
  onApprove: () => void;
  onFlag: () => void;
  onHide: () => void;
}

const ModerationRow: React.FC<ModerationRowProps> = ({
  review,
  busy,
  onApprove,
  onFlag,
  onHide,
}) => {
  const [expanded, setExpanded] = useState(false);
  const created = new Date(review.createdAt);
  const dateStr = created.toLocaleString();
  const isLong = (review.comment || '').length > 240;
  const body = expanded || !isLong ? review.comment : `${review.comment.slice(0, 240).trim()}…`;

  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <header className="flex items-start gap-3">
        <img
          src={
            review.customerAvatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
          }
          alt={review.customerName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-gray-900">{review.customerName}</span>
            <span className="text-xs text-gray-500">→ {review.serviceTitle || '—'}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  review.rating >= i
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-[11px] text-gray-400 ml-2">{dateStr}</span>
          </div>
        </div>
        <StatusBadge status={review.moderationStatus} />
      </header>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{body}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(p => !p)}
          className="text-[11px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {review.expertReply && (
        <div className="ml-4 sm:ml-12 border-l-2 border-emerald-300 pl-3 py-1 bg-emerald-50/40 rounded-r-xl">
          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Expert already replied
          </span>
          <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">
            {review.expertReply.text}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <span className="text-[10px] text-gray-400 mr-auto font-mono">
          expert:{review.expertId}
        </span>
        <button
          onClick={onApprove}
          disabled={busy || review.moderationStatus === 'APPROVED'}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 rounded-lg cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
        </button>
        <button
          onClick={onFlag}
          disabled={busy || review.moderationStatus === 'PENDING'}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-lg cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" /> Flag
        </button>
        <button
          onClick={onHide}
          disabled={busy || review.moderationStatus === 'REMOVED'}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Hide
        </button>
      </div>
    </article>
  );
};

const StatusBadge: React.FC<{ status: ReviewItem['moderationStatus'] }> = ({ status }) => {
  const cfg: Record<ReviewItem['moderationStatus'], { label: string; className: string }> = {
    APPROVED: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    REMOVED: { label: 'Hidden', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = cfg[status];
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${c.className}`}>
      {c.label}
    </span>
  );
};

export default ReviewModerationTab;