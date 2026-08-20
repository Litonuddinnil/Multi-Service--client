import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Star, MessageSquareReply, ShieldCheck, Flag, Trash2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from './Toast';
import type { ReviewItem } from '../../types';

/**
 * F15 — Reviews UI primitives.
 *
 * Three coordinated pieces, all in one file so the read-more ↔ reply ↔
 * moderation flow stays in sync:
 *
 *   1. {@link ReviewList} — public-facing list (Expert / Service / Booking
 *      completion pages). Renders a rating distribution, a reverse-chron
 *      feed, and inline "Read more" toggle for long comments.
 *   2. {@link ExpertReplyComposer} — single-review reply form reused on
 *      ExpertDetail (logged-in expert only) and the ExpertPortal.
 *   3. {@link ReviewModerationRow} — admin row with approve / flag / hide
 *      actions, used by the moderation queue.
 */

interface ReviewListProps {
  /** Either fetch by expertId (ExpertDetail) or by entityId (ServiceDetail). */
  expertId?: string;
  entityId?: string;
  entityType?: 'SERVICE' | 'EXPERT' | 'PACKAGE' | 'PRODUCT';
  /** If supplied, the component only renders reviews belonging to this expert. */
  showExpertReply?: boolean;
  /** Skips approved-only filter so admins can see hidden reviews. */
  allowAllStatuses?: boolean;
  /** Hide reviews whose moderationStatus is REMOVED. Default true. */
  hideRemoved?: boolean;
  /** Maximum number of reviews to render before the "Show more" button. */
  initialLimit?: number;
  /** Empty-state copy override. */
  emptyText?: string;
  /** Called after a reply / moderation action so the parent can refetch. */
  onChange?: () => void;
}

/**
 * Public ReviewList — read-more, rating breakdown, reply thread.
 * Mounts on ExpertDetailView and ServiceDetailView.
 */
export const ReviewList: React.FC<ReviewListProps> = ({
  expertId,
  entityId,
  entityType,
  showExpertReply = true,
  hideRemoved = true,
  initialLimit = 5,
  emptyText = 'No reviews yet. Be the first to leave feedback.',
  onChange,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [replyFor, setReplyFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.fetchReviews({
        expertId,
        entityId,
        entityType,
        status: hideRemoved ? 'APPROVED' : undefined,
      });
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, [expertId, entityId, entityType, hideRemoved]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (hideRemoved) return reviews.filter(r => r.moderationStatus !== 'REMOVED');
    return reviews;
  }, [reviews, hideRemoved]);

  const stats = useMemo(() => {
    const total = visible.length;
    const sum = visible.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = total ? sum / total : 0;
    const buckets: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    visible.forEach(r => {
      const k = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      buckets[k] += 1;
    });
    return { total, avg, buckets };
  }, [visible]);

  const handleAfterChange = useCallback((updated: ReviewItem) => {
    setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    onChange?.();
  }, [onChange]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const renderList = showAll ? visible : visible.slice(0, initialLimit);

  return (
    <section className="space-y-5" aria-label="Reviews">
      {/* Rating breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="text-4xl font-black text-gray-900">{stats.total ? stats.avg.toFixed(1) : '—'}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    stats.avg >= i - 0.5
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{stats.total} verified reviews</span>
          </div>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.buckets[star as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = stats.total ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-gray-500 font-bold">{star}★</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {renderList.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              expanded={!!expanded[review.id]}
              onToggle={() => setExpanded(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
              showReply
              replying={replyFor === review.id}
              onOpenReply={() => setReplyFor(review.id)}
              onCancelReply={() => setReplyFor(null)}
              onReplied={updated => {
                handleAfterChange(updated);
                setReplyFor(null);
                showToast('Public reply posted to the customer review.', 'success');
              }}
              isOwnExpert={!!user?.id && (!review.expertId || user.id === review.expertId)}
              onChange={onChange}
            />
          ))}
        </div>
      )}

      {visible.length > initialLimit && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="text-xs font-bold text-[#34C759] hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show fewer reviews
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> View all {visible.length} reviews
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
};

// --- internal: single review card --------------------------------------------

interface ReviewCardProps {
  review: ReviewItem;
  expanded: boolean;
  onToggle: () => void;
  showReply: boolean;
  replying: boolean;
  onOpenReply: () => void;
  onCancelReply: () => void;
  onReplied: (updated: ReviewItem) => void;
  isOwnExpert: boolean;
  onChange?: () => void;
}

const REVIEW_BODY_LIMIT = 240;

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  expanded,
  onToggle,
  showReply,
  replying,
  onOpenReply,
  onCancelReply,
  onReplied,
  isOwnExpert,
  onChange,
}) => {
  const isLong = (review.comment || '').length > REVIEW_BODY_LIMIT;
  const truncated = isLong
    ? `${(review.comment || '').slice(0, REVIEW_BODY_LIMIT).trim()}…`
    : review.comment;
  const created = new Date(review.createdAt);
  const dateStr = created.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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
            <span className="font-bold text-sm text-gray-900 truncate">
              {review.customerName}
            </span>
            <span className="text-[11px] text-gray-400">• {dateStr}</span>
            {review.entityType === 'SERVICE' && review.serviceTitle && (
              <span className="text-[11px] text-gray-500">
                on <span className="font-semibold">{review.serviceTitle}</span>
              </span>
            )}
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
          </div>
        </div>
        {review.moderationStatus !== 'APPROVED' && (
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {review.moderationStatus === 'REMOVED' ? 'Hidden' : 'Pending review'}
          </span>
        )}
      </header>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {expanded ? review.comment : truncated}
      </p>
      {isLong && (
        <button
          onClick={onToggle}
          className="text-[11px] font-bold text-[#34C759] hover:text-emerald-700 cursor-pointer"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Expert reply thread */}
      {review.expertReply && (
        <div className="ml-4 sm:ml-12 border-l-2 border-[#34C759] pl-4 py-1 bg-emerald-50/40 rounded-r-xl">
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
            Official Response from Expert
            <span className="text-emerald-600/80 font-normal">
              {new Date(review.expertReply.repliedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed mt-1 whitespace-pre-line">
            {review.expertReply.text}
          </p>
        </div>
      )}

      {/* Reply composer (expert only) */}
      {showReply && isOwnExpert && !review.expertReply && (
        replying ? (
          <ExpertReplyComposer
            onCancel={onCancelReply}
            onPosted={onReplied}
            reviewId={review.id}
          />
        ) : (
          <button
            onClick={onOpenReply}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#34C759] hover:text-emerald-700 cursor-pointer"
          >
            <MessageSquareReply className="w-3.5 h-3.5" /> Reply to this review
          </button>
        )
      )}

      {onChange && (
        <ModerationControls review={review} onChange={onChange} />
      )}
    </article>
  );
};

// --- internal: reply composer -------------------------------------------------

interface ReplyComposerProps {
  reviewId: string;
  onCancel: () => void;
  onPosted: (updated: ReviewItem) => void;
}

export const ExpertReplyComposer: React.FC<ReplyComposerProps> = ({
  reviewId,
  onCancel,
  onPosted,
}) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const updated = await ApiService.replyToReview(reviewId, text.trim());
      if (updated) {
        onPosted(updated);
      } else {
        showToast(
          'Could not post reply — please ensure you are signed in as the expert on this profile.',
          'error',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Write a public reply visible to everyone on this profile…"
        className="w-full text-xs p-3 border border-gray-300 rounded-xl outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759]"
      />
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>{text.length}/1000</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="px-4 py-1.5 bg-[#34C759] hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer"
          >
            {submitting ? 'Posting…' : 'Post Reply'}
          </button>
        </div>
      </div>
    </form>
  );
};

// --- internal: moderation controls (admin / self) ----------------------------

const ModerationControls: React.FC<{
  review: ReviewItem;
  onChange: () => void;
}> = ({ review, onChange }) => {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<'APPROVED' | 'PENDING' | 'REMOVED' | null>(null);
  const user = ApiService['currentUser']; // not really — fall back to dialog prompts below

  // The moderate action is gated to admin users; we render the buttons
  // optimistically and let the server reject if the caller is not authorised.
  const run = async (action: 'APPROVED' | 'PENDING' | 'REMOVED') => {
    const reason =
      action === 'REMOVED'
        ? (window.prompt('Reason for hiding this review?') || 'Hidden by moderator')
        : action === 'PENDING'
          ? (window.prompt('Flag this review for review. Reason?') || 'Flagged')
          : undefined;
    setBusy(action);
    try {
      const updated = await ApiService.moderateReview(review.id, action, reason);
      if (updated) {
        showToast(
          action === 'APPROVED'
            ? 'Review approved.'
            : action === 'REMOVED'
              ? 'Review hidden from public view.'
              : 'Review flagged for review.',
          'success',
        );
        onChange();
      } else {
        showToast('Moderation failed — admin role required.', 'error');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
      <span className="text-[10px] uppercase font-bold text-gray-400 mr-auto">Moderation</span>
      <button
        onClick={() => run('APPROVED')}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 rounded-md cursor-pointer"
      >
        <CheckCircle2 className="w-3 h-3" /> Approve
      </button>
      <button
        onClick={() => run('PENDING')}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-md cursor-pointer"
      >
        <Flag className="w-3 h-3" /> Flag
      </button>
      <button
        onClick={() => run('REMOVED')}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-md cursor-pointer"
      >
        <Trash2 className="w-3 h-3" /> Hide
      </button>
    </div>
  );
};

// --- Expert review inbox (used inside ExpertPortalView) -----------------------

interface ExpertReviewInboxProps {
  expertId: string;
  /** When true, shows a small header suitable for embedding into a tab. */
  compact?: boolean;
}

export const ExpertReviewInbox: React.FC<ExpertReviewInboxProps> = ({ expertId, compact }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.fetchReviews({ expertId });
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, [expertId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const unanswered = reviews.filter(r => !r.expertReply).length;
    const avg = total
      ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total
      : 0;
    return { total, unanswered, avg };
  }, [reviews]);

  const handleChange = useCallback(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-32" aria-busy="true" />
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KPIBox label="Total Reviews" value={stats.total.toString()} tone="blue" />
          <KPIBox label="Average Rating" value={stats.avg.toFixed(1)} tone="amber" />
          <KPIBox label="Awaiting Reply" value={stats.unanswered.toString()} tone="purple" />
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
          <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          You have no reviews yet. Encourage customers to leave feedback after their first session.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              expanded={!!expanded[review.id]}
              onToggle={() => setExpanded(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
              showReply
              replying={replyFor === review.id}
              onOpenReply={() => setReplyFor(review.id)}
              onCancelReply={() => setReplyFor(null)}
              onReplied={updated => {
                setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)));
                setReplyFor(null);
                showToast('Reply saved.', 'success');
              }}
              isOwnExpert
              onChange={handleChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const KPIBox: React.FC<{ label: string; value: string; tone: 'blue' | 'amber' | 'purple' }> = ({
  label,
  value,
  tone,
}) => {
  const palette: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
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
