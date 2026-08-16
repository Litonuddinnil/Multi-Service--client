import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  Video,
  MapPin,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  X,
  Sparkles,
  History,
  Trash2,
  ChevronDown,
  ListChecks
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { ServiceItem } from '../types';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { MoneyValue } from '../components/common/MoneyValue';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';

/** Outlet context provided by `Layout/Main.tsx`. */
interface CatalogOutletContext {
  currentView: string;
  viewParams: Record<string, any>;
  navigate: (view: string, params?: Record<string, any>) => void;
  onOpenAuth: () => void;
  onPayEscrow: (payload: unknown, ...rest: unknown[]) => void;
}

interface ServicesCatalogViewProps {
  initialCategoryId?: string;
  initialQuery?: string;
  // Legacy dispatcher callbacks — optional in the router world.
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onBookService?: (service: ServiceItem) => void;
}

export const ServicesCatalogView: React.FC<ServicesCatalogViewProps> = ({
  initialCategoryId,
  initialQuery,
  onNavigate,
  onBookService
}) => {
  const reactNavigate = useNavigate();
  const ctx = useOutletContext<CatalogOutletContext>();
  const [searchParams] = useSearchParams();
  const urlCategoryId = searchParams.get('category') ?? undefined;
  const urlQuery = searchParams.get('q') ?? undefined;

  // --- Fallback chain for legacy dispatcher callbacks ---
  // 1. Honour the prop if a host provided one (legacy dispatcher pattern).
  // 2. Fall back to outlet context (modern router path through Main.tsx).
  // 3. Last resort: navigate directly via react-router.
  const handleNavigate = useCallback(
    (view: string, params?: Record<string, any>) => {
      if (onNavigate) {
        onNavigate(view, params);
        return;
      }
      const v = view;
      if (v === 'service-detail' && params?.serviceId) {
        reactNavigate(`/services/${params.serviceId}`);
        return;
      }
      if (v === 'expert-detail' && params?.expertId) {
        reactNavigate(`/experts/${params.expertId}`);
        return;
      }
      if (v === 'catalog') {
        const qs = new URLSearchParams();
        if (params?.categoryId) qs.set('category', String(params.categoryId));
        if (params?.query) qs.set('q', String(params.query));
        reactNavigate(`/catalog${qs.toString() ? `?${qs}` : ''}`);
        return;
      }
      if (ctx?.navigate) {
        ctx.navigate(v, params);
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
      const hasBookablePackage =
        Array.isArray(service.packages) &&
        service.packages.some((pkg) => pkg.isBookable);
      if (hasBookablePackage) {
        reactNavigate(`/book/${service.id}`);
      } else {
        reactNavigate(`/services/${service.id}`);
      }
    },
    [onBookService, reactNavigate],
  );
  const { t, locale } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId ?? urlCategoryId ?? 'ALL',
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery ?? urlQuery ?? '');

  // Re-sync filter state whenever the URL ?category / ?q change
  // (e.g. user clicks a navbar chip or search hit).
  useEffect(() => {
    setSelectedCategory(urlCategoryId ?? 'ALL');
  }, [urlCategoryId]);

  useEffect(() => {
    setSearchQuery(urlQuery ?? '');
  }, [urlQuery]);
  const [consultationMode, setConsultationMode] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('recommended');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load initial recent searches from localStorage
  useEffect(() => {
    setRecentSearches(StorageService.getRecentSearches());
  }, []);

  // Handle outside click for search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save search to recent searches when query changes and is meaningful
  const handleSaveSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      const updated = StorageService.addRecentSearch(trimmed);
      setRecentSearches(updated);
    }
  };

  const handleSelectRecentSearch = (query: string) => {
    setSearchQuery(query);
    handleSaveSearch(query);
    setIsSearchFocused(false);
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updated = StorageService.removeRecentSearch(query);
    setRecentSearches(updated);
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveSearch(searchQuery);
      setIsSearchFocused(false);
    }
  };

  const categories = [
    { id: 'ALL', name: t('allCategories') },
    { id: 'cat-healthcare', name: 'Healthcare & Telemedicine' },
    { id: 'cat-engineering', name: 'Engineering & Construction' },
    { id: 'cat-it', name: 'IT & Software Development' },
    { id: 'cat-hajj-umrah', name: 'Hajj & Umrah Pilgrimage' },
    { id: 'cat-legal', name: 'Legal & Corporate Advisory' },
    { id: 'cat-business', name: 'Business Consultancy' },
  ];

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      const data = await ApiService.getServices({
        categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
        query: searchQuery,
        mode: consultationMode,
        sort: sortOption,
        priceMax: maxPrice
      });
      setServices(data);
      setIsLoading(false);
    };

    fetchServices();
  }, [selectedCategory, searchQuery, consultationMode, sortOption, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="bg-[#111827] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-visible">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34C759]/20 text-[#34C759] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Verified Professional Services
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Explore Experts & Verified Consultations
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Select top-tier doctors, structural engineers, IT architects, and legal consultants. Book instant appointments or initiate milestone contracts.
          </p>

          {/* Search bar inside header with recent searches support */}
          <div ref={searchContainerRef} className="relative pt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (searchQuery.trim().length >= 2) {
                    handleSaveSearch(searchQuery);
                  }
                }}
                placeholder="Search by doctor name, specialty, engineering, or legal service..."
                className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 rounded-2xl text-sm font-medium outline-none shadow-lg focus:ring-2 focus:ring-[#34C759]"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions / Recent Searches when focused */}
            {isSearchFocused && recentSearches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 px-4 z-50 text-gray-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-gray-400" />
                    Recent Searches
                  </span>
                  <button
                    onMouseDown={handleClearAllRecentSearches}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto py-1">
                  {recentSearches.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={() => handleSelectRecentSearch(item)}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-[#34C759]/10 text-gray-700 hover:text-[#248a3d] text-xs font-medium cursor-pointer transition-all border border-gray-200/70 hover:border-[#34C759]/30"
                    >
                      <Clock className="w-3 h-3 text-gray-400 group-hover:text-[#34C759]" />
                      <span>{item}</span>
                      <button
                        onMouseDown={(e) => handleRemoveRecentSearch(e, item)}
                        className="text-gray-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-gray-200/60 ml-0.5 transition-colors"
                        title="Remove search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Always visible Recent Searches chip bar below search input */}
            {recentSearches.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-300">
                  <History className="w-3.5 h-3.5 text-[#34C759]" />
                  <span>Recent:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {recentSearches.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectRecentSearch(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                        searchQuery.toLowerCase() === item.toLowerCase()
                          ? 'bg-[#34C759] text-white border-[#34C759]'
                          : 'bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border-white/10'
                      }`}
                    >
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">{item}</span>
                      <button
                        onClick={(e) => handleRemoveRecentSearch(e, item)}
                        className="text-gray-400 hover:text-rose-300 p-0.5 rounded-full hover:bg-white/10 ml-0.5 transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {recentSearches.length > 5 && (
                    <button
                      onClick={() => setIsSearchFocused(true)}
                      className="text-[11px] text-[#34C759] hover:underline px-1 py-0.5 cursor-pointer font-medium"
                    >
                      +{recentSearches.length - 5} more
                    </button>
                  )}

                  <button
                    onClick={handleClearAllRecentSearches}
                    className="text-[11px] text-gray-400 hover:text-gray-200 px-1 py-0.5 cursor-pointer ml-1 underline decoration-dotted transition-colors"
                  >
                    Clear history
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#34C759]" />
              {t('filterTitle')}
            </h3>
            {(selectedCategory !== 'ALL' || consultationMode !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setConsultationMode('ALL');
                  setSearchQuery('');
                  setMaxPrice(100000);
                }}
                className="text-xs text-[#34C759] font-semibold hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
              Category
            </label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#34C759]/10 text-[#248a3d]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {selectedCategory === cat.id && <span className="w-2 h-2 rounded-full bg-[#34C759]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Consultation Mode */}
          <div className="pt-4 border-t border-gray-100">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
              Consultation Mode
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { id: 'ALL', label: 'All Modes' },
                { id: 'ONLINE', label: 'Video Call (Online)' },
                { id: 'IN_PERSON', label: 'In-Person (Clinic/Office)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setConsultationMode(m.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    consultationMode === m.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-[#F6F7F8] text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-bold uppercase tracking-wider text-gray-400">Max Budget</label>
              <MoneyValue amount={maxPrice} className="text-gray-900 font-bold" />
            </div>
            <input
              type="range"
              min={500}
              max={100000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#34C759] cursor-pointer"
            />
          </div>
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">
                {services.length} Services Available
              </span>
              {selectedCategory !== 'ALL' && (
                <span className="text-xs bg-[#34C759]/10 text-[#34C759] font-semibold px-2 py-0.5 rounded-full">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden px-3 py-1.5 text-xs font-bold bg-[#F6F7F8] hover:bg-gray-200 rounded-xl flex items-center gap-1.5 text-gray-700"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-medium">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-[#F6F7F8] border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="recommended">Top Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <SkeletonLoader variant="card-grid" count={6} />
          ) : services.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState
                title="No services match your criteria"
                description="Try adjusting your keyword, resetting filters, or selecting another category."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setConsultationMode('ALL');
                  setMaxPrice(100000);
                }}
              />
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {services.map((service, idx) => (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -12 }}
                    transition={{
                      duration: 0.28,
                      ease: [0.16, 1, 0.3, 1],
                      delay: Math.min(idx * 0.035, 0.18)
                    }}
                    className="bg-white border border-[#E5E7EB] hover:border-[#34C759] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-shadow flex flex-col justify-between group"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={service.expertAvatar}
                            alt={service.expertName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#34C759]/20"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-900">{service.expertName}</span>
                              {service.isExpertVerified && <VerifiedBadge size="sm" />}
                            </div>
                            <span className="text-[11px] text-gray-500 block">{service.categoryName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{service.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Service Title */}
                      <h3
                        onClick={() => handleNavigate('service-detail', { serviceId: service.id })}
                        className="text-base font-bold text-gray-900 group-hover:text-[#34C759] transition-colors line-clamp-2 cursor-pointer"
                      >
                        {service.title}
                      </h3>

                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Mode & Package highlights */}
                      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                        {service.consultationMode === 'ONLINE' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reactNavigate(`/services/${service.id}?room=video`);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors font-bold border border-blue-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                            aria-label={`${t('joinVideoRoom')} — ${service.title}`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            {t('videoRoom')}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            {t('inPerson')}
                          </span>
                        )}

                        <span className="text-[11px] text-gray-400 font-mono">
                          {service.packages.length} {locale === 'bn' ? 'টায়ার্ড প্যাকেজ' : 'Tiered Packages'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable "What's Included" panel */}
                    <div className="px-6 pb-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedServiceId(
                            expandedServiceId === service.id ? null : service.id,
                          );
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#34C759]/20 bg-[#34C759]/5 hover:bg-[#34C759]/10 text-[#248a3d] text-[11px] font-bold transition-colors cursor-pointer"
                        aria-expanded={expandedServiceId === service.id}
                      >
                        <span className="flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5" />
                          {expandedServiceId === service.id
                            ? locale === 'bn'
                              ? 'প্যাকেজ লুকান'
                              : 'Hide packages'
                            : locale === 'bn'
                              ? 'কী কী অন্তর্ভুক্ত দেখুন'
                              : "View what's included"}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            expandedServiceId === service.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedServiceId === service.id && (
                          <motion.div
                            key="included"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-3 pt-3 border-t border-dashed border-gray-200">
                              {service.packages.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">
                                  {locale === 'bn'
                                    ? 'কোনো প্যাকেজ কনফিগার করা হয়নি।'
                                    : 'No packages configured yet.'}
                                </p>
                              ) : (
                                service.packages.map((pkg) => (
                                  <div
                                    key={pkg.id}
                                    className="rounded-xl border border-gray-200 bg-white p-3"
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <p className="text-xs font-extrabold text-gray-900 leading-snug">
                                        {pkg.title}
                                      </p>
                                      <MoneyValue
                                        amount={pkg.priceBDT}
                                        className="text-xs font-bold text-[#248a3d] shrink-0"
                                      />
                                    </div>
                                    {pkg.description && (
                                      <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                                        {pkg.description}
                                      </p>
                                    )}
                                    <ul className="space-y-1">
                                      {pkg.features.map((feature, fIdx) => (
                                        <li
                                          key={fIdx}
                                          className="flex items-start gap-1.5 text-[11px] text-gray-700"
                                        >
                                          <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0">
                                            <svg
                                              viewBox="0 0 12 12"
                                              className="w-2.5 h-2.5"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              aria-hidden="true"
                                            >
                                              <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                                            </svg>
                                          </span>
                                          <span className="leading-snug">{feature}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom Action bar */}
                    <div className="px-6 py-4 bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Starting from</span>
                        <MoneyValue amount={service.startingPriceBDT} className="text-base text-gray-900 font-bold" />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate('service-detail', { serviceId: service.id });
                          }}
                          className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        >
                          {t('details')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookService(service);
                          }}
                          className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{t('bookNow')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesCatalogView;
