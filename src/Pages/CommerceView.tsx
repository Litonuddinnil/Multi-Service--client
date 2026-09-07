import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  FileText,
  Video,
  Check,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  PlayCircle,
  Trophy,
  Loader2,
  Award,
  Clock,
  ChevronRight,
  Sparkles,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { CommerceProduct } from '../types';
import { StorageService } from '../services/storage';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { MoneyValue } from '../components/common/MoneyValue';
import { ApiService } from '../services/api';

interface CommerceViewProps {
  // Legacy dispatcher callback - optional in the router world.
  onPayEscrow?: (entityType: any, entityId: string, amountBDT: number, title: string) => void;
}

type Tab = 'ALL' | 'COURSE' | 'TOOL' | 'BOOK';

/**
 * Public catalog `/commerce`.
 *
 * Renders a tabbed catalog (Courses / Tools / Books / All), a search
 * bar, and a product detail modal with two CTAs:
 *   - "Buy via bKash / Card" -> opens the existing PaymentModal
 *   - "Enroll & start learning" -> calls POST /api/commerce/enroll
 *     and jumps straight to /commerce/learn/:enrollmentId.
 *
 * Already-enrolled users see a "Resume learning" badge with direct
 * link to the CoursePlayer.
 */
export const CommerceView: React.FC<CommerceViewProps> = ({ onPayEscrow }) => {
  const { locale } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Seed products from localStorage so the first paint is instant.
  const seedProducts = StorageService.getCommerceProducts();

  const [products, setProducts] = useState<CommerceProduct[]>(seedProducts);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('ALL');
  const [q, setQ] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CommerceProduct | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Fallback chain: prop -> global withu:open-payment event (consumed by Main.tsx).
  const handlePayEscrow = useCallback(
    (entityType: any, entityId: string, amountBDT: number, title: string) => {
      if (onPayEscrow) {
        onPayEscrow(entityType, entityId, amountBDT, title);
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('withu:open-payment', {
            detail: { entityType, entityId, amountBDT, title },
          }),
        );
      }
    },
    [onPayEscrow],
  );

  // -------- Bootstrap: server catalog + my enrollments ---------------------
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ApiService.fetchCommerceProducts({
        category: tab,
        userId: user?.id,
      });
      setProducts(list);
      if (user?.id) {
        const mine = await ApiService.getMyEnrollments(user.id);
        setEnrollments(mine);
      } else {
        setEnrollments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------- Derived: filtered view + enrollment map ------------------------
  const enrolledProductIds = useMemo(() => {
    const s = new Set<string>();
    enrollments.forEach((e: any) => s.add(e.productId));
    return s;
  }, [enrollments]);

  const enrollmentByProductId = useMemo(() => {
    const m = new Map<string, any>();
    enrollments.forEach((e: any) => m.set(e.productId, e));
    return m;
  }, [enrollments]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) =>
      [p.title, p.authorName, p.category, p.description]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle)),
    );
  }, [products, q]);

  // -------- Enrollment flow ----------------------------------------------
  const handleEnroll = useCallback(
    async (p: CommerceProduct) => {
      if (!user?.id) {
        showToast(
          locale === 'bn'
            ? 'Please log in to enroll.'
            : 'Please log in to enroll in this program.',
          'error',
        );
        navigate('/login');
        return;
      }
      setEnrolling(true);
      try {
        const res = await ApiService.enrollInProduct({
          productId: p.id,
          userId: user.id,
        });
        if (!res.success) {
          showToast(res.error || 'Enrollment failed', 'error');
          return;
        }
        const enrollment = res.enrollment;
        showToast(
          locale === 'bn'
            ? 'Enrollment successful!'
            : res.alreadyEnrolled
              ? 'Already enrolled - resuming...'
              : 'Enrollment confirmed!',
          'success',
        );
        setSelectedProduct(null);
        if (enrollment?.id) {
          navigate(`/commerce/learn/${enrollment.id}`);
        } else {
          await refresh();
        }
      } finally {
        setEnrolling(false);
      }
    },
    [user, showToast, navigate, locale, refresh],
  );

  const resumeEnrollment = useCallback(
    (p: CommerceProduct) => {
      const e = enrollmentByProductId.get(p.id);
      if (e?.id) navigate(`/commerce/learn/${e.id}`);
    },
    [enrollmentByProductId, navigate],
  );

  // =========================================================================
  //  Render
  // =========================================================================
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'COURSE', label: 'Courses', icon: <PlayCircle className="w-3.5 h-3.5" /> },
    { key: 'TOOL', label: 'Tools', icon: <Wrench className="w-3.5 h-3.5" /> },
    { key: 'BOOK', label: 'Books', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#111827] text-white p-6 sm:p-10 rounded-3xl shadow-xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#34C759] bg-[#34C759]/20 px-3 py-1 rounded-full inline-block">
          Digital Library & Learning Network
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          Courses, Tools & Blueprints
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
          Verified engineering CAD drawings, Bangladeshi legal deed templates,
          medical masterclass videos, and Islamic reading tracks. Enroll
          directly into a program to start learning; finish every lesson to
          earn a verifiable certificate.
        </p>

        {/* Tabs + search */}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <div className="flex items-center gap-1 px-1 py-1 bg-white/10 backdrop-blur rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                  tab === t.key
                    ? 'bg-[#34C759] text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-45 flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl">
            <Search className="w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search catalog..."
              className="bg-transparent text-xs text-white placeholder-gray-400 outline-none flex-1"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
          <Loader2 className="w-7 h-7 animate-spin text-[#34C759]" />
          <p className="text-xs">Loading catalog...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center text-xs text-gray-500">
          No products match the current filters.
        </div>
      )}

      {/* Products Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((prod) => {
            const enrolled = enrolledProductIds.has(prod.id);
            const enrollment = enrollmentByProductId.get(prod.id);
            const completed = enrollment?.percentComplete === 100;
            return (
              <div
                key={prod.id}
                className="bg-white border border-[#E5E7EB] hover:border-[#34C759] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative overflow-hidden h-48 bg-gray-100">
                    <img
                      src={prod.thumbnailUrl}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-[#111827]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {prod.productType}
                    </span>
                    {enrolled && (
                      <span
                        className={`absolute top-3 right-3 ${
                          completed
                            ? 'bg-amber-500/95'
                            : 'bg-[#34C759]/95'
                        } text-white text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1`}
                      >
                        {completed ? (
                          <Trophy className="w-3 h-3" />
                        ) : (
                          <PlayCircle className="w-3 h-3" />
                        )}
                        {completed ? 'Completed' : 'Enrolled'}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <h3
                      onClick={() => setSelectedProduct(prod)}
                      className="text-base font-bold  group-hover:text-[#34C759] transition-colors cursor-pointer line-clamp-2"
                    >
                      {prod.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      By {prod.authorName}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" />
                        {prod.lessonsCount || 0} lessons
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {prod.durationHours || 0}h
                      </span>
                      {prod.courseLevel && (
                        <span className="inline-flex items-center gap-1 uppercase font-bold">
                          <Award className="w-3 h-3" />
                          {prod.courseLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Price</span>
                    <MoneyValue amount={prod.priceBDT} className="text-lg font-bold " />
                  </div>

                  <div className="flex items-center gap-2">
                    {enrolled ? (
                      <button
                        onClick={() => resumeEnrollment(prod)}
                        className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {completed ? 'Review' : 'Continue'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => addToCart(prod)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() =>
                            handlePayEscrow('COMMERCE', prod.id, prod.priceBDT, prod.title)
                          }
                          className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Buy Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedProduct.thumbnailUrl}
                alt={selectedProduct.title}
                className="w-20 h-20 rounded-2xl object-cover"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {selectedProduct.productType}
                </span>
                <h3 className="text-lg font-bold  mt-1">
                  {selectedProduct.title}
                </h3>
                <p className="text-xs text-gray-500">Author: {selectedProduct.authorName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <p>{selectedProduct.description}</p>

              {selectedProduct.outcomes && selectedProduct.outcomes.length > 0 && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    What you'll be able to do
                  </span>
                  <ul className="space-y-1 mt-1">
                    {selectedProduct.outcomes.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProduct.lessons && selectedProduct.lessons.length > 0 && (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 inline-flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" />
                    Curriculum ({selectedProduct.lessons.length} lessons)
                  </span>
                  <ol className="space-y-1 mt-1">
                    {selectedProduct.lessons.map((l, i) => (
                      <li key={l.id} className="flex items-center gap-2 text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate">{l.title}</span>
                        <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                          {l.videoUrl ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {l.duration}m
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
                <span>Finish every lesson to earn a verified completion certificate.</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3 flex-wrap">
              <MoneyValue amount={selectedProduct.priceBDT} className="text-xl font-bold " />
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {enrolledProductIds.has(selectedProduct.id) ? (
                  <button
                    onClick={() => resumeEnrollment(selectedProduct)}
                    className="px-5 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Continue learning
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const p = selectedProduct;
                        setSelectedProduct(null);
                        handlePayEscrow('COMMERCE', p.id, p.priceBDT, p.title);
                      }}
                      className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Buy via bKash / Card
                    </button>
                    <button
                      onClick={() => handleEnroll(selectedProduct)}
                      disabled={enrolling}
                      className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {enrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Enroll & start learning
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommerceView;
