import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Lock,
  PlayCircle,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../components/common/Toast';
import { MoneyValue } from '../../components/common/MoneyValue';
import { PdfService } from '../../services/pdfService';
import type {
  CommerceCertificate,
  CommerceEnrollment,
  CommerceProduct,
  CourseLesson,
} from '../../types';

/**
 * F19 — `/commerce/learn/:enrollmentId`
 *
 * Full lesson player: lesson list sidebar, video/text content panel,
 * mark-complete toggle, progress bar, and a "Download certificate"
 * call-to-action that unlocks the moment progress hits 100%.
 */
export const CoursePlayer: React.FC = () => {
  const { enrollmentId = '' } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, formatBDT } = useLanguage();
  const { showToast } = useToast();

  const [enrollment, setEnrollment] = useState<CommerceEnrollment | null>(null);
  const [product, setProduct] = useState<CommerceProduct | null>(null);
  const [certificate, setCertificate] = useState<CommerceCertificate | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  // -------- Bootstrap: enrollment + product + (existing) certificate -------
  const loadAll = useCallback(async () => {
    if (!user?.id || !enrollmentId) return;
    setLoading(true);
    try {
      const enrollments = await ApiService.getMyEnrollments(user.id);
      const mine = (enrollments as CommerceEnrollment[]).find(
        (e) => e.id === enrollmentId,
      );
      if (!mine) {
        showToast(
          locale === 'bn'
            ? 'এই এনরোলমেন্ট পাওয়া যায়নি বা আপনার নয়।'
            : 'Enrollment not found or does not belong to you.',
          'error',
        );
        navigate('/commerce', { replace: true });
        return;
      }
      setEnrollment(mine);

      const product = await ApiService.fetchCommerceProduct(mine.productId);
      if (!product) {
        showToast(
          locale === 'bn' ? 'পণ্য পাওয়া যায়নি।' : 'Product not found.',
          'error',
        );
        return;
      }
      setProduct(product);

      // Pick last accessed lesson or the first one.
      const firstLessonId =
        mine.lastAccessedLessonId ||
        product.lessons?.[0]?.id ||
        null;
      setActiveLessonId(firstLessonId);

      // If already completed, fetch the certificate once.
      if (mine.percentComplete === 100 || mine.certificateId) {
        const cert = await ApiService.getCertificate(mine.id);
        if (cert) setCertificate(cert as CommerceCertificate);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, enrollmentId, showToast, locale, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const lessons: CourseLesson[] = useMemo(
    () =>
      product?.lessons
        ? [...product.lessons].sort((a, b) => a.order - b.order)
        : [],
    [product],
  );

  const activeLesson: CourseLesson | null = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) || null,
    [lessons, activeLessonId],
  );

  const completedSet = useMemo(() => {
    const ids = enrollment?.completedLessonIds || [];
    return new Set(ids);
  }, [enrollment?.completedLessonIds]);

  // -------- Mark lesson complete / incomplete (optimistic) -----------------
  const handleToggleComplete = useCallback(
    async (lesson: CourseLesson) => {
      if (!enrollment) return;
      const wasCompleted = completedSet.has(lesson.id);
      setPending(true);
      try {
        const res = await ApiService.updateLessonProgress({
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          completed: !wasCompleted,
        });
        if (!res.success || !res.enrollment) {
          showToast(res.error || 'Progress update failed', 'error');
          return;
        }
        const next = res.enrollment as CommerceEnrollment;
        setEnrollment(next);

        if (next.percentComplete === 100 && !certificate) {
          const cert = await ApiService.getCertificate(next.id);
          if (cert) setCertificate(cert as CommerceCertificate);
          showToast(
            locale === 'bn'
              ? 'অভিনন্দন! আপনার সার্টিফিকেট প্রস্তুত।'
              : '🎉 Course complete! Your certificate is ready.',
            'success',
          );
        }
      } finally {
        setPending(false);
      }
    },
    [enrollment, completedSet, certificate, showToast, locale],
  );

  // -------- Lesson navigation (prev / next) --------------------------------
  const goToLesson = useCallback(
    (dir: -1 | 1) => {
      if (!activeLesson) return;
      const idx = lessons.findIndex((l) => l.id === activeLesson.id);
      const next = lessons[idx + dir];
      if (next) {
        setActiveLessonId(next.id);
        // Update server-side lastAccessedLessonId opportunistically.
        if (enrollment) {
          ApiService.updateLessonProgress({
            enrollmentId: enrollment.id,
            lessonId: next.id,
            completed: completedSet.has(next.id),
          }).catch(() => {
            /* swallow — non-critical */
          });
          setEnrollment({
            ...enrollment,
            lastAccessedLessonId: next.id,
          });
        }
      }
    },
    [activeLesson, lessons, enrollment, completedSet],
  );

  const handleDownloadCertificate = useCallback(() => {
    if (!certificate) {
      showToast(
        locale === 'bn'
          ? 'সার্টিফিকেট এখনও প্রস্তুত হয়নি।'
          : 'Certificate not ready yet — finish all lessons.',
        'error',
      );
      return;
    }
    PdfService.generateCertificatePdf(
      certificate,
      user,
      product?.authorName,
    );
  }, [certificate, user, product, showToast, locale]);

  // =========================================================================
  //  Render
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin text-[#34C759]" />
        <p className="text-xs">
          {locale === 'bn' ? 'লোড হচ্ছে…' : 'Loading your learning space…'}
        </p>
      </div>
    );
  }

  if (!enrollment || !product) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <Lock className="w-10 h-10 text-gray-300 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">
          {locale === 'bn' ? 'অ্যাক্সেস নেই' : 'No access'}
        </h2>
        <p className="text-sm text-gray-500">
          {locale === 'bn'
            ? 'এই কোর্সে আপনার এনরোলমেন্ট নেই।'
            : 'You are not enrolled in this course.'}
        </p>
        <Link
          to="/commerce"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#34C759] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'bn' ? 'ক্যাটালগে �িরে যান' : 'Browse catalog'}
        </Link>
      </div>
    );
  }

  const percent = enrollment.percentComplete ?? 0;
  const isFullyComplete = percent === 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/commerce"
              className="text-[11px] text-gray-500 hover:text-[#34C759] inline-flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              {locale === 'bn' ? 'ক্যাটালগে ফিরে যান' : 'Back to catalog'}
            </Link>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 truncate">
              {product.title}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {product.authorName} · {lessons.length}{' '}
              {locale === 'bn' ? 'টি লেসন' : 'lessons'} ·{' '}
              <MoneyValue amount={product.priceBDT} className="inline font-semibold" />
            </p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
            {product.productType}
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {completedSet.size} / {lessons.length}{' '}
              {locale === 'bn' ? 'লেসন সম্পন্ন' : 'lessons completed'}
            </span>
            <span className="font-bold text-gray-900">{percent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#34C759] to-emerald-400 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {isFullyComplete && (
          <div className="mt-2 p-3.5 bg-linear-to-r from-emerald-50 to-amber-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-emerald-900">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs font-bold">
                  {locale === 'bn'
                    ? 'অভিনন্দন — আপনি সম্পূর্ণ করেছেন!'
                    : 'You completed this program!'}
                </p>
                <p className="text-[11px] text-emerald-700">
                  {certificate
                    ? locale === 'bn'
                      ? `সার্টিফিকেট নং: ${certificate.serial}`
                      : `Certificate № ${certificate.serial}`
                    : locale === 'bn'
                      ? 'সার্টি�িকেট প্রস্তুত হচ্ছে…'
                      : 'Preparing your certificate…'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadCertificate}
              disabled={!certificate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {locale === 'bn' ? 'সার্টিফিকেট ডাউনলোড' : 'Download certificate'}
            </button>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Lesson list */}
        <aside className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[80vh] lg:overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {locale === 'bn' ? 'লেসন তালিকা' : 'Lessons'}
          </div>
          {lessons.map((lesson, i) => {
            const done = completedSet.has(lesson.id);
            const active = lesson.id === activeLessonId;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                    done
                      ? 'bg-[#34C759] text-white'
                      : active
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold truncate ${
                      active ? 'text-emerald-900' : 'text-gray-900'
                    }`}
                  >
                    {lesson.title}
                  </p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    {lesson.videoUrl ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    {lesson.duration} min {lesson.isPreview && '· Free preview'}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Active lesson */}
        <main className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 min-h-[60vh]">
          {!activeLesson && (
            <div className="text-center text-gray-500 py-12">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm">
                {locale === 'bn'
                  ? 'একটি �েসন নির্বাচন করুন।'
                  : 'Select a lesson from the list to begin.'}
              </p>
            </div>
          )}

          {activeLesson && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">
                    {activeLesson.title}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {locale === 'bn' ? 'সময়কাল' : 'Duration'}:{' '}
                    {activeLesson.duration} min
                    {activeLesson.isPreview && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                        Preview
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleToggleComplete(activeLesson)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                    completedSet.has(activeLesson.id)
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-[#34C759] text-white hover:bg-emerald-600'
                  }`}
                >
                  {pending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : completedSet.has(activeLesson.id) ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {completedSet.has(activeLesson.id)
                    ? locale === 'bn'
                      ? 'সম্পন্ন — পূর্বাবস্থায় আনুন'
                      : 'Completed — undo'
                    : locale === 'bn'
                      ? 'সম্পন্ন হিসেবে চিহ্নিত করুন'
                      : 'Mark as complete'}
                </button>
              </div>

              {/* Media */}
              {activeLesson.videoUrl ? (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                  <video
                    key={activeLesson.id}
                    controls
                    poster={product.thumbnailUrl}
                    className="w-full h-full"
                    src={activeLesson.videoUrl}
                  >
                    {locale === 'bn'
                      ? 'আপনার ব্রাউজার ভিডিও ট্যাগ সমর্থন করে না।'
                      : 'Your browser does not support the video tag.'}
                  </video>
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-linear-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-emerald-700" />
                </div>
              )}

              {/* Text content */}
              {activeLesson.textContent && (
                <article className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {activeLesson.textContent}
                </article>
              )}

              {/* Materials */}
              {activeLesson.materials && activeLesson.materials.length > 0 && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    {locale === 'bn' ? 'রিসোর্স' : 'Resources'}
                  </p>
                  {activeLesson.materials.map((m, idx) => (
                    <a
                      key={idx}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-xs text-gray-700"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="flex-1 truncate">{m.title}</span>
                      {m.size && (
                        <span className="text-[10px] text-gray-400">
                          {m.size}
                        </span>
                      )}
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}

              {/* Prev/Next */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => goToLesson(-1)}
                  disabled={
                    !lessons.find(
                      (l) => l.id === activeLesson.id,
                    ) ||
                    lessons.findIndex((l) => l.id === activeLesson.id) === 0
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {locale === 'bn' ? 'আগের' : 'Previous'}
                </button>
                <button
                  type="button"
                  onClick={() => goToLesson(1)}
                  disabled={
                    lessons.findIndex((l) => l.id === activeLesson.id) ===
                    lessons.length - 1
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#111827] hover:bg-black text-white rounded-xl disabled:opacity-30"
                >
                  {locale === 'bn' ? 'পরবর্তী' : 'Next lesson'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CoursePlayer;
