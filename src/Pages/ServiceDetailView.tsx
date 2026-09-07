import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext, useSearchParams, useParams } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  Check,
  Video,
  MapPin,
  Clock,
  Calendar,
  Briefcase,
  ArrowLeft,
  MessageSquare,
  Award,
  ChevronRight,
  Send,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { ServiceItem, ExpertProfile, ServicePackage } from '../types';
import { ApiService } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { MoneyValue } from '../components/common/MoneyValue';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ProjectQuoteModal } from '../components/booking/ProjectQuoteModal';
import { DoctorConsultationRoom } from '../components/consultation/DoctorConsultationRoom';
import { ReviewList } from '../components/common/ReviewList';
 
interface ServiceDetailOutletContext {
  currentView: string;
  viewParams: Record<string, any>;
  navigate: (view: string, params?: Record<string, any>) => void;
  onOpenAuth: () => void;
  onPayEscrow: (payload: unknown, ...rest: unknown[]) => void;
}

interface ServiceDetailViewProps {
  serviceId: string; 
  onBack?: () => void;
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onBookService?: (service: ServiceItem, pkg?: ServicePackage) => void;
  onRequestQuote?: (service: ServiceItem) => void;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({
  serviceId,
  onBack,
  onNavigate,
  onBookService,
  onRequestQuote
}) => {
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();
  const reactNavigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ctx = useOutletContext<ServiceDetailOutletContext>();

  // The router renders this view as `<ServiceDetailView />` with no props, so
  // `serviceId` (prop) is undefined and we must fall back to the URL param.
  // This mirrors how ExpertDetailView and BookingPage resolve their IDs.
  const routeParams = useParams<{ serviceId: string }>();
  const resolvedServiceId = serviceId ?? routeParams.serviceId ?? '';

  const [service, setService] = useState<ServiceItem | null>(null);
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);

   
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false); 
  // Tracks the resolved consultation ID for the live video room. The button
  // used to pass `service.id` which produced an empty session — see
  // `handleJoinVideoRoom` for the lookup.
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);

  // Stable ref to `handleJoinVideoRoom` so the URL-driven deep link effect
  // below can call the latest callback without re-firing on every identity change.
  const handleJoinVideoRoomRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // When ?room=video is present, route through the resolver so a stale URL
    // (e.g. shared before login) doesn't open an empty room.
    if (searchParams.get('room') === 'video' && service && service.consultationMode === 'ONLINE') {
      const next = new URLSearchParams(searchParams);
      next.delete('room');
      setSearchParams(next, { replace: true });
      handleJoinVideoRoomRef.current?.();
    }
  }, [searchParams, service, setSearchParams]);

  useEffect(() => {
    if (!resolvedServiceId) return;
    const load = async () => {
      setLoading(true);
      const s = await ApiService.getServiceById(resolvedServiceId);
      if (s) {
        setService(s);
        setSelectedPackage(s.packages[0] || null);
        const exp = await ApiService.getExpertById(s.expertId);
        setExpert(exp);
      }
      setLoading(false);
    };
    load();
  }, [resolvedServiceId]);

 
  const handleBookService = useCallback(
    (_service: ServiceItem, pkg?: ServicePackage) => {
      if (onBookService) {
        onBookService(_service, pkg);
        return;
      } 
      const tierId = pkg?.id ?? selectedPackage?.id;
      const target = tierId
        ? `/book/${_service.id}?packageId=${tierId}`
        : `/book/${_service.id}`;
      reactNavigate(target);
    },
    [onBookService, selectedPackage, reactNavigate],
  );

  const handleRequestQuote = useCallback(
    (_service: ServiceItem) => {
      if (onRequestQuote) {
        onRequestQuote(_service);
        return;
      }
      setIsQuoteModalOpen(true);
    },
    [onRequestQuote],
  );

  const handleOpenAuth = useCallback(() => {
    if (ctx?.onOpenAuth) {
      ctx.onOpenAuth();
      return;
    }
    reactNavigate('/login');
  }, [ctx, reactNavigate]);

  const handleViewExpert = useCallback(() => {
    // Guard against firing before `service` is loaded — this callback is
    // safely callable on every render now that it lives above the early return.
    if (!service) return;
    const params = { expertId: service.expertId };
    if (onNavigate) {
      onNavigate('expert-detail', params);
      return;
    }
    if (ctx?.navigate) {
      ctx.navigate('expert-detail', params);
      return;
    }
    reactNavigate(`/experts/${service.expertId}`);
  }, [onNavigate, ctx, reactNavigate, service?.expertId]);

  // Open the live video room for a CONFIRMED appointment.
  // Previously the button passed `service.id` as `consultationId`, which
  // produced a blank room because the consultation API looks up by
  // `consultationId` (e.g. `cons-849201`), not `serviceId`.
  // Now we resolve the user's existing confirmed booking for THIS service and
  // pass its consultation ID. If no confirmed booking exists, send the user
  // through the booking flow first.
  const handleJoinVideoRoom = useCallback(async () => {
    if (!service) return;

    // Not signed in → auth gate, then return here.
    if (!user) {
      if (ctx?.onOpenAuth) ctx.onOpenAuth();
      else reactNavigate('/login?redirect=' + encodeURIComponent(`/services/${service.id}`));
      return;
    }

    try {
      // 1. Look up this user's confirmed booking for the current service.
      const myBookings = await ApiService.getCustomerAppointments(user.id);
      const candidate = myBookings.find(
        (b) => b.serviceId === service.id && b.status === 'CONFIRMED',
      );

      let consultationId: string | null = candidate?.consultationId ?? null;

      // 2. If we have a consultationId, also confirm the consultation record
      //    still exists server-side before opening the room.
      if (consultationId) {
        const session = await ApiService.getConsultation(consultationId);
        if (!session) consultationId = null;
      }

      if (consultationId) {
        setActiveConsultationId(consultationId);
        return;
      }

      // 3. Otherwise, send the user to the booking page (picks first package).
      const pkg = service.packages.find((p) => p.isBookable) ?? service.packages[0];
      if (pkg) {
        reactNavigate(`/book/${service.id}?packageId=${pkg.id}`);
      } else {
        reactNavigate(`/book/${service.id}`);
      }
    } catch {
      // Fallback: route to booking page on any unexpected error.
      reactNavigate(`/book/${service.id}`);
    }
  }, [service, user, ctx, reactNavigate]);

  // Keep the ref in sync for the URL-driven ?room=video effect above.
  useEffect(() => {
    handleJoinVideoRoomRef.current = handleJoinVideoRoom;
  }, [handleJoinVideoRoom]);

  if (loading || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#34C759] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading service specifications...</p>
      </div>
    );
  }

  const isMilestoneProject = service.categoryId === 'cat-engineering' || service.categoryId === 'cat-it-digital';

  // --- Fallback chain for legacy dispatcher callbacks ---
  // 1. Honour the prop if a host provided one (legacy dispatcher pattern).
  // 2. Fall back to outlet context (modern router path through Main.tsx).
  // 3. Last resort: navigate directly via react-router.
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (ctx?.navigate) {
      ctx.navigate('catalog');
      return;
    }
    reactNavigate('/catalog');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </button>

      {/* Hero Service Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Service Specs, Details, Packages */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#34C759] bg-[#34C759]/10 px-2.5 py-1 rounded-full">
                {service.categoryName}
              </span>
              {service.consultationMode === 'ONLINE' ? (
                <button
                  type="button"
                  onClick={handleJoinVideoRoom}
                  className="text-xs text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  aria-label={t('joinVideoRoom')}
                >
                  <Video className="w-3.5 h-3.5" />
                  {t('videoRoomLive')}
                </button>
              ) : (
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {t('inPerson')}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
              {service.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">{service.rating.toFixed(1)}</span>
                <span className="text-gray-400 font-normal">({service.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                <span className="font-semibold text-emerald-800">Escrow Payment Protection</span>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-gray-900">About This Service</h3>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3 whitespace-pre-line">
              {service.description}
            </div>

            {/* Consultation Delivery Guarantees */}
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-gray-50 rounded-xl flex items-start gap-3">
                <FileCheck className="w-4 h-4 text-[#34C759] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Digital Prescription / Deliverables</span>
                  <span className="text-gray-500">Official digitally signed documentation stored in your portal.</span>
                </div>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Punctual HD Video Call</span>
                  <span className="text-gray-500">Encrypted room with zero wait time and countdown timer.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tiered Packages Comparison Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Tiered Options</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">Select Service Package</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {service.packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#34C759] bg-[#34C759]/5 ring-2 ring-[#34C759]/20 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-gray-900">{pkg.title}</h4>
                        {pkg.durationMinutes && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {pkg.durationMinutes}m
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <MoneyValue amount={pkg.priceBDT} className="text-xl text-gray-900 font-bold" />
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        {pkg.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookService(service, pkg)}
                      className={`mt-6 w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#34C759] hover:bg-[#2fb34f] text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      Book This Tier
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Quote Banner for Complex Engineering / IT */}
          {isMilestoneProject && (
            <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Custom Architectural / IT Milestone</span>
                <h4 className="text-lg font-bold text-white">Need a comprehensive multi-week milestone project?</h4>
                <p className="text-xs text-gray-300">
                  Request custom scope, BNBC structural engineering calculations, or full-stack software delivery.
                </p>
              </div>
              <button
                onClick={() => handleRequestQuote(service)}
                className="px-6 py-3 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Custom Quote</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Expert Card & Direct Booking Sticky Box */}
        <div className="space-y-6">
          {/* Expert Profile Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center gap-4">
              <img
                src={service.expertAvatar}
                alt={service.expertName}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-[#34C759]/20"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-gray-900">{service.expertName}</h3>
                  {service.isExpertVerified && <VerifiedBadge size="sm" />}
                </div>
                <p className="text-xs text-gray-500 font-medium">{service.categoryName}</p>
                <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mt-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{service.rating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({service.reviewCount})</span>
                </div>
              </div>
            </div>

            {expert && (
              <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Board License:</span>
                  <span className="font-mono font-bold text-gray-900">{expert.officialLicenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Verification:</span>
                  <span className="text-emerald-700 font-semibold">{expert.verificationBody} Checked</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Sessions:</span>
                  <span className="font-bold text-gray-900">{expert.completedOrdersCount}+</span>
                </div>
              </div>
            )}

            <button
              onClick={handleViewExpert}
              className="w-full py-2 text-xs font-bold text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              View Full Expert Credentials
            </button>

            {/* Quick Action Button */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Selected Package:</span>
                <span className="font-bold text-gray-900">{selectedPackage?.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Price:</span>
                <MoneyValue amount={selectedPackage?.priceBDT || service.startingPriceBDT} className="text-xl font-bold text-gray-900" />
              </div>

              <button
                onClick={() => handleBookService(service, selectedPackage || undefined)}
                className="w-full py-3.5 px-4 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book Appointment Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {service.consultationMode === 'ONLINE' && (
                <button
                  type="button"
                  onClick={handleJoinVideoRoom}
                  className="w-full py-3 px-4 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 font-bold text-sm rounded-xl border border-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  aria-label={t('joinVideoRoom')}
                >
                  <Video className="w-4 h-4" />
                  <span>{t('joinVideoRoom')}</span>
                </button>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
                <span>100% Escrow Protected by withU.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* F15 Reviews — read-more, expert reply, public list */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Customer Reviews for {service.title}
          </h3>
          <span className="text-xs text-gray-400">
            {service.reviewCount} verified
          </span>
        </div>
        <ReviewList
          entityId={service.id}
          entityType="SERVICE"
          expertId={service.expertId}
          emptyText="No reviews yet for this service package."
        />
      </section>

      {/* Project Quote Modal — opened by "Request Custom Quote" (engineering / IT) */}
      <ProjectQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        service={service}
        onSuccess={() => setIsQuoteModalOpen(false)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Video Room — DoctorConsultationRoom renders its own fixed full-screen overlay.
          Mount it only when we have a real consultation ID (see handleJoinVideoRoom).
          Passing `service.id` previously produced an empty session because the
          consultation API looks up by `consultationId`, not `serviceId`. */}
      {activeConsultationId && (
        <DoctorConsultationRoom
          consultationId={activeConsultationId}
          onExit={() => setActiveConsultationId(null)}
        />
      )}
    </div>
  );
};

export default ServiceDetailView;
