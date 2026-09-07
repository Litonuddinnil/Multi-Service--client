import React, { useCallback, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Star,
  ArrowRight,
  Stethoscope,
  Compass,
  Code,
  Plane,
  Scale,
  Briefcase,
  CheckCircle2,
  Users,
  Calendar,
  Lock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Moon,
  GraduationCap,
  Landmark,
  HeartHandshake
} from 'lucide-react';
import { DISCIPLINES } from '../constants/expertAgreement';
import { useLanguage } from '../hooks/useLanguage';
import { ServiceItem, ExpertProfile, PilgrimagePackage, RetainerPlan, CommerceProduct } from '../types';
import { StorageService } from '../services/storage';
import { MoneyValue } from '../components/common/MoneyValue';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ExpertSummaryCard } from '../components/common/ExpertSummaryCard';

/** Keyed by `DisciplineOption.icon` so every discipline resolves to a real glyph. */
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

const DISCIPLINE_STYLES: Record<string, { bg: string }> = {
  'cat-healthcare': { bg: 'bg-rose-50 text-rose-700' },
  'cat-engineering': { bg: 'bg-amber-50 text-amber-700' },
  'cat-legal': { bg: 'bg-purple-50 text-purple-700' },
  'cat-it-digital': { bg: 'bg-blue-50 text-blue-700' },
  'cat-hajj-umrah': { bg: 'bg-emerald-50 text-emerald-700' },
  'cat-ruqyah-tibbe': { bg: 'bg-teal-50 text-teal-700' },
  'cat-career-education': { bg: 'bg-indigo-50 text-indigo-700' },
  'cat-financial-advisory': { bg: 'bg-sky-50 text-sky-700' },
  'cat-religious-social': { bg: 'bg-orange-50 text-orange-700' },
  'cat-family-consultancy': { bg: 'bg-fuchsia-50 text-fuchsia-700' },
};

interface HomeViewProps {
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onBookService?: (service: ServiceItem) => void;
}

/** Outlet context shape provided by `router/Layout/Main.tsx`. */
interface HomeOutletContext {
  currentView: string;
  viewParams: Record<string, any>;
  navigate: (view: string, params?: Record<string, any>) => void;
  onOpenAuth: () => void;
  onPayEscrow: (payload: unknown, ...rest: unknown[]) => void;
}

export const HomeView: React.FC<HomeViewProps> = (props) => {
  const { t, locale, formatBDT } = useLanguage();
  const [heroSearch, setHeroSearch] = useState('');
  const reactNavigate = useNavigate();
  const ctx = useOutletContext<HomeOutletContext>();

  // Use the prop callbacks if the host passed them (legacy dispatcher),
  // otherwise fall back to the outlet context exposed by Main.tsx.
  const onNavigate =
    props.onNavigate ??
    ((view: string, params?: Record<string, any>) =>
      ctx?.navigate(view, params));

  const onBookService = useCallback(
    (service: ServiceItem) => {
      // 1. Honour legacy prop callback if the host provided one.
      if (props.onBookService) {
        props.onBookService(service);
        return;
      }
      // 2. Fall back to outlet context (the modern router path).
      if (ctx?.navigate) {
        ctx.navigate('service-detail', { serviceId: service.id });
        return;
      }
      // 3. Last resort: navigate directly via react-router.
      reactNavigate(`/services/${service.id}`);
    },
    [ctx, props.onBookService, reactNavigate],
  );

  const services = StorageService.getServices().filter(s => s.status === 'PUBLISHED');
  const experts = StorageService.getExperts().filter(e => e.status === 'APPROVED');
  const pilgrimagePackages = StorageService.getPilgrimagePackages();
  const retainerPlans = StorageService.getRetainerPlans();
  const commerceProducts = StorageService.getCommerceProducts().slice(0, 3);

  // Built from the same DISCIPLINES table the expert wizard uses, so this list cannot
  // drift from it: three hand-written ids here were wrong and filtered to nothing.
  const categories = DISCIPLINES.map(d => ({
    id: d.id,
    name: locale === 'bn' ? d.label.bn : d.label.en,
    association: d.association,
    icon: DISCIPLINE_ICONS[d.icon] ?? Briefcase,
    ...(DISCIPLINE_STYLES[d.id] ?? { bg: 'bg-gray-50 text-gray-700' }),
  }));

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      onNavigate('catalog', { query: heroSearch.trim() });
    } else {
      onNavigate('catalog');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#111827] via-[#1F2937] to-[#111827] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#34C759_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#34C759]/15 border border-[#34C759]/30 text-[#34C759] text-xs font-semibold animate-fadeIn">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('escrowGuarantee')} — 100% Protected Payments</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {t('heroTitle')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34C759] to-[#68D391]">
              Trusted Support.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Big Search Input */}
          <form onSubmit={handleHeroSearch} className="max-w-2xl mx-auto relative pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl shadow-2xl border border-gray-100">
              <div className="flex items-center flex-1 w-full pl-3 gap-2">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Find Experts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-gray-400">
            <span className="font-semibold text-gray-300">Popular:</span>
            {['Cardiologist', 'Civil Structural', 'Full-Stack React', 'VIP Umrah', 'Company Registration'].map((tag) => (
              <button
                key={tag}
                onClick={() => onNavigate('catalog', { query: tag })}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Explore Disciplines</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Verified Professional Categories</h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-[#34C759] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {t('viewAllServices')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('catalog', { categoryId: cat.id })}
                className="group p-6 bg-white border border-[#E5E7EB] hover:border-[#34C759] rounded-2xl shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 group-hover:text-[#34C759] flex items-center gap-1">
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#34C759] transition-colors">
                    {cat.name}
                  </h3>
                  {/* The regulator that issues this discipline's licence, as the
                      verification wizard shows it. */}
                  <p className="text-xs text-gray-500 mt-1">{cat.association}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Services Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Featured Consultations</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Book Top-Rated Specialists Instantly</h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-[#34C759] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {t('viewAllServices')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.slice(0, 6).map((service) => (
            <div
              key={service.id}
              className="bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="p-6">
                {/* Header: Expert Avatar & Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={service.expertAvatar}
                    alt={service.expertName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#34C759]/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 truncate">{service.expertName}</span>
                      {service.isExpertVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{service.categoryName}</p>
                  </div>
                </div>

                <h4 
                  onClick={() => onNavigate('service-detail', { serviceId: service.id })}
                  className="text-base font-bold text-gray-900 group-hover:text-[#34C759] transition-colors line-clamp-2 cursor-pointer"
                >
                  {service.title}
                </h4>

                <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Rating & Mode Pill */}
                <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{service.rating.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal">({service.reviewCount})</span>
                  </div>

                  <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {service.consultationMode === 'ONLINE' ? 'Video Call' : service.consultationMode === 'IN_PERSON' ? 'In-Person' : 'Hybrid'}
                  </span>
                </div>
              </div>

              {/* Bottom Action Card */}
              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Starting from</span>
                  <MoneyValue amount={service.startingPriceBDT} className="text-base text-gray-900 font-bold" />
                </div>

                <button
                  onClick={() => onBookService(service)}
                  className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>{t('BookNow')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pilgrimage Hajj & Umrah Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#064E3B] to-[#047857] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-200 border border-white/20">
              <Plane className="w-3.5 h-3.5" />
              <span>Direct Ministry Approved Travel Partners</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Hajj & Umrah Pilgrimage Packages with Guaranteed Seat Locks
            </h2>

            <p className="text-sm text-emerald-100 leading-relaxed">
              Book comprehensive pilgrimage journeys with authentic 5-star Makkah & Madinah accommodations, VIP transport, dedicated Muallim guidance, and Escrow-protected visa processing.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('catalog', { categoryId: 'cat-hajj-umrah' })}
                className="px-6 py-3 bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                View Hajj & Umrah Departures
              </button>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                100% Escrow protected until visa confirmation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Retainer Plans Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Dedicated Retainers</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ongoing Professional Care & Advisory</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Subscribe for continuous monthly access to dedicated medical consultants, legal retainers, or CTO advisory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {retainerPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border-2 border-gray-200 hover:border-[#34C759] rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    SLA: {plan.slaHours}h Response
                  </span>
                  <span className="text-xs font-bold text-gray-500">{plan.categoryName}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-3">{plan.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{plan.description}</p>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <MoneyValue amount={plan.monthlyPriceBDT} className="text-xl text-gray-900 font-bold" />
                  <span className="text-[10px] text-gray-400 block">per month (Auto-Renewable)</span>
                </div>

                <button
                  onClick={() => onNavigate('service-detail', { serviceId: 'srv-doc-1' })}
                  className="px-5 py-2.5 bg-[#111827] hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Subscribe Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Digital Products & Books Preview */}
      {/* Verified experts, rendered as short-display profile cards. */}
      {experts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">
                Verified Experts
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Consult a Verified Expert</h2>
            </div>
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs font-bold text-[#34C759] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Browse All Experts <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {experts.slice(0, 4).map(expert => (
              <ExpertSummaryCard
                key={expert.id}
                expert={{
                  expertId: expert.id,
                  photoUrl: expert.avatarUrl || null,
                  displayName: expert.displayName,
                  profession: expert.profession,
                  specialization: expert.specialization,
                  shortBio: expert.bio,
                  // Falls back to the agreement fee for profiles onboarded before this field.
                  consultationFeeBDT:
                    expert.consultationFeeBDT ??
                    expert.agreement?.agreedFeePerSessionBDT ??
                    null,
                  rating: expert.rating,
                  reviewCount: expert.reviewCount,
                  isVerified: expert.status === 'APPROVED',
                  vendorType: expert.vendorType,
                }}
                onClick={() => onNavigate('catalog')}
              />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Digital Library & Toolkits</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Courses, Blueprints & Toolkits</h2>
          </div>
          <button
            onClick={() => onNavigate('commerce')}
            className="text-xs font-bold text-[#34C759] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Visit Digital Store <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commerceProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onNavigate('commerce')}
              className="bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <img
                  src={prod.thumbnailUrl}
                  alt={prod.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {prod.productType}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 mt-2 line-clamp-1 group-hover:text-[#34C759] transition-colors">
                    {prod.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{prod.authorName}</p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between">
                <MoneyValue amount={prod.priceBDT} className="text-base text-gray-900 font-bold" />
                <span className="text-xs text-[#34C759] font-bold group-hover:underline flex items-center gap-1">
                  Access Now <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escrow Guarantee Infographic */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">The withU Escrow Promise</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">How Your Payments Are 100% Protected</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Book & Fund Escrow</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pay securely via bKash, Nagad, or Cards. Your funds are deposited into withU Escrow Trust.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Service Delivery & Review</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Conduct the live video consultation, receive your prescription, or inspect project milestones.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Approved & Released</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Funds are credited to the verified expert only upon successful completion. Full dispute protection.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
