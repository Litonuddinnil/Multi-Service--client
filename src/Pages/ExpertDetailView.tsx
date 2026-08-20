import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  Award,
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Video,
  ArrowRight,
  GraduationCap,
  Briefcase,
  MessageCircle
} from 'lucide-react';
import { ExpertProfile, ServiceItem } from '../types';
import { ApiService } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { MoneyValue } from '../components/common/MoneyValue';
import { ReviewList } from '../components/common/ReviewList';

/** Outlet context provided by `Layout/Main.tsx`. */
interface ExpertOutletContext {
  currentView: string;
  viewParams: Record<string, any>;
  navigate: (view: string, params?: Record<string, any>) => void;
  onOpenAuth: () => void;
  onPayEscrow: (payload: unknown, ...rest: unknown[]) => void;
}

interface ExpertDetailViewProps {
  expertId?: string;
  // Legacy dispatcher callbacks — optional in the router world.
  onBack?: () => void;
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onBookService?: (service: ServiceItem) => void;
}

export const ExpertDetailView: React.FC<ExpertDetailViewProps> = ({
  expertId: expertIdProp,
  onBack,
  onNavigate,
  onBookService
}) => {
  const reactNavigate = useNavigate();
  const ctx = useOutletContext<ExpertOutletContext>();
  const params = useParams<{ expertId: string }>();
  const expertId = expertIdProp ?? params.expertId ?? '';
  const { t, formatDate } = useLanguage();
  const { user: currentUser } = useAuth();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const exp = await ApiService.getExpertById(expertId);
      if (exp) {
        setExpert(exp);
        const allServices = await ApiService.getServices({ expertId: exp.id });
        setServices(allServices);
      }
      setLoading(false);
    };
    load();
  }, [expertId]);

  // --- Fallback chain for legacy dispatcher callbacks ---
  // 1. Honour the prop if a host provided one (legacy dispatcher pattern).
  // 2. Fall back to outlet context (modern router path through Main.tsx).
  // 3. Last resort: navigate directly via react-router.
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    if (ctx?.navigate) {
      ctx.navigate('catalog');
      return;
    }
    reactNavigate('/catalog');
  }, [onBack, ctx, reactNavigate]);

  const handleNavigate = useCallback(
    (view: string, params?: Record<string, any>) => {
      if (onNavigate) {
        onNavigate(view, params);
        return;
      }
      if (view === 'service-detail' && params?.serviceId) {
        reactNavigate(`/services/${params.serviceId}`);
        return;
      }
      if (view === 'expert-detail' && params?.expertId) {
        reactNavigate(`/experts/${params.expertId}`);
        return;
      }
      if (ctx?.navigate) {
        ctx.navigate(view, params);
        return;
      }
      reactNavigate('/catalog');
    },
    [onNavigate, ctx, reactNavigate],
  );

  const handleBookService = useCallback(
    (service: ServiceItem) => {
      if (onBookService) {
        onBookService(service);
        return;
      }
      reactNavigate(`/book/${service.id}`);
    },
    [onBookService, reactNavigate],
  );

  const handleMessageExpert = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!currentUser) {
        ctx?.onOpenAuth?.();
        return;
      }
      try {
        await ApiService.openOrCreateThread({
          entityType: 'GENERAL',
          entityId: expert.id,
          entityTitle: expert.name,
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerAvatar: currentUser.avatarUrl,
          expertId: expert.id,
          expertName: expert.name,
          expertAvatar: expert.avatarUrl,
        });
      } catch {
        // openOrCreateThread swallows network errors itself; safety net.
      }
      reactNavigate('/portal/customer/threads');
    },
    [currentUser, ctx, expert, reactNavigate],
  );

  if (loading || !expert) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#34C759] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-500">Loading verified expert profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile Header Card */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E5E7EB] shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={expert.avatarUrl}
            alt={expert.name}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-[#34C759]/20 shadow-md"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{expert.name}</h1>
              {expert.isVerified && <VerifiedBadge size="md" />}
            </div>

            <p className="text-sm font-semibold text-emerald-800">{expert.title}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">{expert.rating.toFixed(1)}</span>
                <span className="text-gray-400 font-normal">({expert.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-[#34C759]" />
                <span className="font-semibold">{expert.experienceYears}+ Years Experience</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{expert.completedOrdersCount}+ Completed Consultations</span>
              </div>
            </div>
          </div>

          {/* Regulatory Verification Seal Card */}
          <div className="bg-[#F8FAFC] border border-gray-200 p-4 rounded-2xl space-y-3 text-xs w-full md:w-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                Official Board Verification
              </div>
              <p className="text-gray-600 text-[11px]">
                License: <strong className="font-mono text-gray-900">{expert.officialLicenseNumber}</strong>
              </p>
              <p className="text-[11px] text-gray-500">
                Authority: <strong>{expert.verificationBody}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleMessageExpert}
              className="w-full px-4 py-2 bg-white border border-[#34C759] text-[#34C759] hover:bg-[#34C759] hover:text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Message Expert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Biography / Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bio & Qualifications */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#34C759]" />
              Professional Background
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {expert.bio}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#34C759]" />
              Degrees & Certifications
            </h3>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-1.5 shrink-0" />
                <span>Doctor of Medicine (MD) — Cardiology, NICVD</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-1.5 shrink-0" />
                <span>FCPS (Internal Medicine) — BCPS Bangladesh</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-1.5 shrink-0" />
                <span>MBBS — Dhaka Medical College (DMC)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right 2 Columns: Services Offered */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              Services Offered by {expert.name} ({services.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white border border-[#E5E7EB] hover:border-[#34C759] rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded">
                      {srv.categoryName}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {srv.consultationMode === 'ONLINE' ? <Video className="w-3 h-3 text-blue-600" /> : <MapPin className="w-3 h-3 text-amber-600" />}
                      {srv.consultationMode}
                    </span>
                  </div>

                  <h4
                    onClick={() => handleNavigate('service-detail', { serviceId: srv.id })}
                    className="text-base font-bold text-gray-900 hover:text-[#34C759] transition-colors cursor-pointer"
                  >
                    {srv.title}
                  </h4>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block">From</span>
                    <MoneyValue amount={srv.startingPriceBDT} className="text-base text-gray-900 font-bold" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleMessageExpert(e)}
                      title="Message about this service"
                      className="px-3 py-2 bg-white border border-gray-200 hover:border-[#34C759] text-gray-700 hover:text-[#34C759] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleBookService(srv)}
                      className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      {/* F15 Reviews — read-more, expert reply, public list */}
      <section className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Customer Reviews for {expert.name}
          </h3>
          <span className="text-xs text-gray-400">
            {expert.reviewCount} verified
          </span>
        </div>
        <ReviewList
          expertId={expert.id}
          showExpertReply
          emptyText="No customer reviews yet for this provider."
        />
      </section>
      </div>
    </div>
  );
};

export default ExpertDetailView;
