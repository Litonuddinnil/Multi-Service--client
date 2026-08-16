import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Bell,
  ShoppingBag,
  User as UserIcon,
  Globe,
  ChevronDown,
  Menu,
  X,
  Briefcase,
  Sparkles,
  ArrowRight,
  LogOut,
  Stethoscope,
  Plane,
  Scale,
  Code,
  Compass,
  PhoneCall,
  CheckCircle2,
  Lock,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  LayoutGrid,
  Star,
  Clock,
  BadgeCheck,
  Filter,
  Trash2,
  Command,
  CornerDownLeft,
  History,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useNotifications } from '../../hooks/useNotifications';
import { useCart } from '../../hooks/useCart';
import { StorageService } from '../../services/storage';

interface NavbarProps {
  currentView?: string;
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onOpenAuth?: () => void;
}

/**
 * Map the legacy `view` string + `params` object (used by the original
 * App.tsx view-router) to a real React Router `pathname`. This lets the
 * Navbar fall back to `useNavigate()` in any layout that doesn't supply
 * the legacy `onNavigate` callback.
 */
const viewToPath = (
  view: string,
  params?: Record<string, any>,
): string => {
  const p = (params ?? {}) as Record<string, string | undefined>;
  switch (view) {
    case 'home':
      return '/';
    case 'catalog': {
      const search = new URLSearchParams();
      if (p.categoryId) search.set('category', p.categoryId);
      if (p.query) search.set('q', p.query);
      const qs = search.toString();
      return qs ? `/catalog?${qs}` : '/catalog';
    }
    case 'service-detail':
      return p.serviceId ? `/services/${p.serviceId}` : '/catalog';
    case 'expert-detail':
      return p.expertId ? `/experts/${p.expertId}` : '/catalog';
    case 'commerce': {
      const qs = p.openProduct ? `?product=${encodeURIComponent(p.openProduct)}` : '';
      return `/commerce${qs}`;
    }
    case 'checkout':
      return '/checkout';
    case 'become-expert':
      return '/become-expert';
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'customer':
      return '/portal/customer';
    case 'expert':
      return '/portal/expert';
    case 'admin':
      return '/admin';
    default:
      // Fallback: treat as a literal path if it starts with '/', else 404.
      return view.startsWith('/') ? view : '/';
  }
};

/**
 * Inverse of `viewToPath`: take a pathname and return the closest matching
 * legacy view name, used for active-state highlighting when no
 * `currentView` prop is supplied.
 */
const pathToView = (pathname: string): string => {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/catalog')) return 'catalog';
  if (pathname.startsWith('/services/')) return 'service-detail';
  if (pathname.startsWith('/experts/')) return 'expert-detail';
  if (pathname.startsWith('/commerce')) return 'commerce';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/become-expert')) return 'become-expert';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/register')) return 'register';
  if (pathname.startsWith('/portal/customer')) return 'customer';
  if (pathname.startsWith('/portal/expert')) return 'expert';
  if (pathname.startsWith('/admin')) return 'admin';
  return pathname;
};

export const Navbar: React.FC<NavbarProps> = (props) => {
  // Parent-provided callbacks are optional. When the Navbar is dropped into a
  // layout that doesn't supply them (e.g. the DashBoard wrapper which renders
  // it bare), we fall back to React Router's `useNavigate` + `useLocation` so
  // every nav button/link still works.
  const parentOnNavigate = props.onNavigate;
  const parentOnOpenAuth = props.onOpenAuth;
  const routerNavigate = useNavigate();
  const location = useLocation();
  const navigate = useMemo<(view: string, params?: Record<string, any>) => void>(
    () => (view, params) => {
      const target = viewToPath(view, params);
      routerNavigate(target);
    },
    [routerNavigate],
  );
  const onNavigate = parentOnNavigate ?? navigate;

  // Active-state source: prefer the legacy `currentView` prop if a parent
  // still supplies it; otherwise derive from the current URL pathname.
  const currentView = props.currentView ?? pathToView(location.pathname);
  const onOpenAuth = parentOnOpenAuth ?? (() => {
    routerNavigate('/login');
  });

  const { user, isAuthenticated, activeRole, switchRole, logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { cart, cartCount, cartTotalBDT, removeFromCart, clearCart } = useCart();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const cartMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsCategoriesDropdownOpen(false);
        setIsUserMenuOpen(false);
        setIsNotifOpen(false);
        setIsCartOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (cartMenuRef.current && !cartMenuRef.current.contains(target)) {
        setIsCartOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(target)) {
        setIsCategoriesDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
      if (mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); 
  useEffect(() => {
    if (isSearchOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Focus the mobile input once the panel is mounted.
      requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isSearchOpen]); 
  useEffect(() => {
    const forceVisibleText = (el: HTMLInputElement | null) => {
      if (!el) return;
      el.style.setProperty('color', '#0f172a', 'important');
      el.style.setProperty('-webkit-text-fill-color', '#0f172a', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('caret-color', '#10b981', 'important');
    };
    forceVisibleText(searchInputRef.current);
    forceVisibleText(mobileSearchInputRef.current);
  }, [searchQuery, isSearchOpen, isSearchFocused]);

  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (query) {
      recordSearch(query);
      routerNavigate(viewToPath('catalog', { query }));
      setIsSearchOpen(false);
      setIsSearchFocused(false);
      setIsMobileMenuOpen(false);
    }
  }; 
  type SearchHit = {
    id: string;
    title: string;
    subtitle: string;
    category: 'service' | 'expert' | 'package' | 'product';
    icon: React.ComponentType<{ className?: string }>;
    badgeColor: string;
    target:
      | { kind: 'service-detail'; serviceId: string }
      | { kind: 'expert-detail'; expertId: string }
      | { kind: 'commerce-product'; productId: string }
      | { kind: 'catalog'; categoryId?: string; query: string };
  };

  const searchIndex = useMemo<SearchHit[]>(() => {
    const hits: SearchHit[] = [];

    StorageService.getServices()
      .filter((s) => s.status === 'PUBLISHED')
      .forEach((s) => {
        hits.push({
          id: `svc-${s.id}`,
          title: s.title,
          subtitle: s.expertName,
          category: 'service',
          icon: Briefcase,
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
          target: { kind: 'service-detail', serviceId: s.id },
        });
      });

    StorageService.getExperts()
      .filter((e) => e.status === 'APPROVED')
      .forEach((e) => {
        hits.push({
          id: `exp-${e.id}`,
          title: e.displayName,
          subtitle: e.specialization,
          category: 'expert',
          icon: Stethoscope,
          badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200/80',
          target: { kind: 'expert-detail', expertId: e.id },
        });
      });

    StorageService.getPilgrimagePackages().forEach((p) => {
      hits.push({
        id: `pkg-${p.id}`,
        title: p.title,
        subtitle: p.agencyName,
        category: 'package',
        icon: Plane,
        badgeColor: 'text-violet-700 bg-violet-50 border-violet-200/80',
        target: { kind: 'catalog', categoryId: 'cat-hajj', query: p.title },
      });
    });

    StorageService.getCommerceProducts().forEach((p) => {
      hits.push({
        id: `prd-${p.id}`,
        title: p.title,
        subtitle: p.authorOrInstructor,
        category: 'product',
        icon: ShoppingBag,
        badgeColor: 'text-amber-700 bg-amber-50 border-amber-200/80',
        target: { kind: 'commerce-product', productId: p.id },
      });
    });

    return hits;
  }, []); 
  type CategoryScope = 'all' | 'service' | 'expert' | 'package' | 'product';
  type SortMode = 'relevance' | 'recent' | 'rating';

  const [categoryScope, setCategoryScope] = useState<CategoryScope>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>('relevance');

  // Recent searches (persisted in localStorage, max 5)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('withu:recent-searches');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.filter((s): s is string => typeof s === 'string').slice(0, 5);
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const persistRecent = (next: string[]) => {
    const trimmed = next.slice(0, 5);
    setRecentSearches(trimmed);
    try {
      localStorage.setItem('withu:recent-searches', JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  };

  const recordSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const filtered = recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    persistRecent([trimmed, ...filtered]);
  };

  const clearRecentSearches = () => persistRecent([]);

  // Category scope options shared by the desktop filter rail AND the
  // mobile chip row, so both stay in sync automatically.
  const categoryScopeOptions = [
    { id: 'all' as const, label: t('searchInAll'), icon: Sparkles, color: 'text-slate-700' },
    { id: 'service' as const, label: t('searchInServices'), icon: Briefcase, color: 'text-emerald-700' },
    { id: 'expert' as const, label: t('searchInExperts'), icon: Stethoscope, color: 'text-cyan-700' },
    { id: 'package' as const, label: t('searchInPackages'), icon: Plane, color: 'text-violet-700' },
    { id: 'product' as const, label: t('searchInProducts'), icon: ShoppingBag, color: 'text-amber-700' },
  ];

  // Derived: filtered + sorted results based on scope/verified/sort
  const advancedResults = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    let pool = searchIndex.filter((h) => {
      if (q && !(h.title.toLowerCase().includes(q) || h.subtitle.toLowerCase().includes(q))) return false;
      if (categoryScope !== 'all' && h.category !== categoryScope) return false;
      // "verified only" maps to: services PUBLISHED, experts APPROVED, packages + products always verified
      if (verifiedOnly) {
        if (h.category === 'service' || h.category === 'expert') return true; // index already filters these
        if (h.category === 'package' || h.category === 'product') return true;
      }
      return true;
    });

    if (sortBy === 'relevance') {
      // Title-match sorts above subtitle-match
      pool = [...pool].sort((a, b) => {
        const at = a.title.toLowerCase().includes(q) ? 0 : 1;
        const bt = b.title.toLowerCase().includes(q) ? 0 : 1;
        if (at !== bt) return at - bt;
        return a.title.localeCompare(b.title);
      });
    } else if (sortBy === 'rating') {
      // No numeric rating on the search hit; fall back to category priority: expert > service > package > product
      const order: Record<typeof pool[number]['category'], number> = {
        expert: 0,
        service: 1,
        package: 2,
        product: 3,
      };
      pool = [...pool].sort((a, b) => order[a.category] - order[b.category]);
    } else if (sortBy === 'recent') {
      // Reverse insertion order (most recently added at the end of the index → first)
      pool = [...pool].reverse();
    }

    return pool.slice(0, 8);
  }, [searchQuery, searchIndex, categoryScope, verifiedOnly, sortBy]);

  const navigateToHit = (hit: SearchHit) => {
    setIsSearchFocused(false);
    setIsSearchOpen(false);
    switch (hit.target.kind) {
      case 'service-detail':
        routerNavigate(viewToPath('service-detail', { serviceId: hit.target.serviceId }));
        return;
      case 'expert-detail':
        routerNavigate(viewToPath('expert-detail', { expertId: hit.target.expertId }));
        return;
      case 'commerce-product':
        routerNavigate(viewToPath('commerce', { openProduct: hit.target.productId }));
        return;
      case 'catalog':
        routerNavigate(
          viewToPath('catalog', {
            categoryId: hit.target.categoryId,
            query: hit.target.query,
          })
        );
        return;
    }
  };

  const renderHitRow = (hit: SearchHit) => {
    const Icon = hit.icon;
    const q = searchQuery.trim();
    return (
      <button
        key={hit.id}
        type="button"
        onMouseDown={(e) => {
          // Prevent the outer mousedown handler from stealing focus
          // before our click handler runs.
          e.preventDefault();
        }}
        onClick={() => navigateToHit(hit)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200/60 transition-all group"
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${hit.badgeColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700">
            {highlightMatch(hit.title, q)}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">{hit.subtitle}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>
    );
  };

  /**
   * Highlight matching text in a result title. Splits at the query boundary
   * and wraps matches in <mark>. Returns ReactNodes — never use dangerouslySetInnerHTML.
   */
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    const lower = text.toLowerCase();
    const needle = trimmed.toLowerCase();
    if (!lower.includes(needle)) return text;
    const parts: React.ReactNode[] = [];
    let i = 0;
    let key = 0;
    while (i < text.length) {
      const idx = lower.indexOf(needle, i);
      if (idx === -1) {
        parts.push(text.slice(i));
        break;
      }
      if (idx > i) parts.push(text.slice(i, idx));
      parts.push(
        <mark
          key={`hl-${key++}`}
          className="bg-emerald-100 text-emerald-900 rounded px-0.5"
        >
          {text.slice(idx, idx + needle.length)}
        </mark>,
      );
      i = idx + needle.length;
    }
    return <>{parts}</>;
  };

  const categories = [
    { 
      id: 'cat-healthcare', 
      name: locale === 'bn' ? 'স্বাস্থ্য ও টেলিমেডিসিন' : 'Healthcare & Telemedicine', 
      subtitle: locale === 'bn' ? 'BMDC সার্টিফাইড বিশেষজ্ঞ ডাক্তার' : 'BMDC Certified Doctors',
      icon: Stethoscope, 
      color: 'text-rose-600 bg-rose-500/10 border-rose-200/60 dark:border-rose-900/40',
      badge: 'BMDC'
    },
    { 
      id: 'cat-engineering', 
      name: locale === 'bn' ? 'প্রকৌশল ও নির্মাণ' : 'Engineering & Construction', 
      subtitle: locale === 'bn' ? 'রাজউক ও IEB অনুমোদিত স্থপতি' : 'Rajuk & IEB Registered',
      icon: Compass, 
      color: 'text-amber-600 bg-amber-500/10 border-amber-200/60 dark:border-amber-900/40',
      badge: 'IEB'
    },
    { 
      id: 'cat-it', 
      name: locale === 'bn' ? 'আইটি ও সফটওয়্যার' : 'IT & Software Engineering', 
      subtitle: locale === 'bn' ? 'ক্লাউড, ওয়েব ও এআই সমাধান' : 'Full-Stack, Cloud & AI',
      icon: Code, 
      color: 'text-cyan-600 bg-cyan-500/10 border-cyan-200/60 dark:border-cyan-900/40',
      badge: 'PRO'
    },
    { 
      id: 'cat-hajj', 
      name: locale === 'bn' ? 'হজ ও ওমরাহ কাফেলা' : 'Hajj & Umrah Pilgrimage', 
      subtitle: locale === 'bn' ? 'ধর্ম মন্ত্রণালয় অনুমোদিত এজেন্সি' : 'Govt Approved Agencies',
      icon: Plane, 
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-900/40',
      badge: 'HAJJ'
    },
    { 
      id: 'cat-legal', 
      name: locale === 'bn' ? 'আইন ও কর্পোরেট পরামর্শ' : 'Legal & Corporate Advisory', 
      subtitle: locale === 'bn' ? 'হাইকোর্ট ও সুপ্রিম কোর্ট আইনজীবী' : 'Supreme Court Advocates',
      icon: Scale, 
      color: 'text-indigo-600 bg-indigo-500/10 border-indigo-200/60 dark:border-indigo-900/40',
      badge: 'BAR'
    },
    { 
      id: 'cat-business', 
      name: locale === 'bn' ? 'ব্যবসা ও ট্যাক্স কনসালটেন্সি' : 'Business & Tax Consultancy', 
      subtitle: locale === 'bn' ? 'টিন, ভ্যাট, অডিট ও কোম্পানি ফাইল' : 'TIN, VAT, RJSC & Audit',
      icon: Briefcase, 
      color: 'text-violet-600 bg-violet-500/10 border-violet-200/60 dark:border-violet-900/40',
      badge: 'NBR'
    },
  ];

  const popularSearches = locale === 'bn' ? [
    'কার্ডিওলজিস্ট',
    'রাজউক বিল্ডিং প্ল্যান',
    'ওমরাহ প্যাকেজ ২০২৬',
    'জমির দলিল যাচাই',
    'ফুলস্ট্যাক ডেভেলপার',
    'কোম্পানি রেজিস্ট্রেশন'
  ] : [
    'Cardiologist',
    'Rajuk Building Plan',
    'Umrah Package 2026',
    'Land Deed Verification',
    'Full-Stack Developer',
    'Company Tax Registration'
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/*
        Scoped, high-specificity override for the navbar search inputs.
        If typed text is invisible even with an inline `style`, the cause is a
        global CSS rule using `!important` (e.g. a dark-mode reset, or a blanket
        `input { color: ... }` rule) — a plain inline style always loses to any
        `!important` rule. An ID selector + `!important` here outranks a generic
        element-selector `!important` rule, so this wins regardless of load order.
      */}
      <style>{`
        #main-navbar-search-input,
        #mobile-navbar-search-input {
          color: #0f172a !important;
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #10b981 !important;
          background-color: transparent !important;
          opacity: 1 !important;
        }
        #main-navbar-search-input::placeholder,
        #mobile-navbar-search-input::placeholder {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          opacity: 1 !important;
        }
        #main-navbar-search-input:-webkit-autofill,
        #mobile-navbar-search-input:-webkit-autofill {
          -webkit-text-fill-color: #0f172a !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
        }
      `}</style>
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800/80 text-[11px] font-medium select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold tracking-tight shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {t('escrowGuarantee')}
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden sm:inline text-slate-300 text-[11px] truncate">
              {locale === 'bn' 
                ? '১০০% ভেরিফাইড পেশাদার এবং এসক্রো সুরক্ষিত মাইলস্টোন লেনদেন' 
                : '100% Verified Credentials & Protected Milestone Escrow'}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <a 
              href="tel:0961294848" 
              className="hidden lg:inline-flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span className="font-medium tracking-wide">০৯৬১২-WITHU</span>
            </a>

            <span className="hidden lg:inline text-slate-700">|</span>

            <div className="flex items-center bg-slate-900/90 border border-slate-750 p-0.5 rounded-lg shadow-inner">
              <Globe className="w-3 h-3 text-slate-400 mx-1.5 shrink-0" />
              <button 
                id="lang-btn-en"
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                  locale === 'en' 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-950' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button 
                id="lang-btn-bn"
                type="button"
                onClick={() => setLocale('bn')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                  locale === 'bn' 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-950' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ${
        scrolled 
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)]' 
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[70px] gap-2 sm:gap-4 lg:gap-6">
            
            <div className="flex items-center gap-3 md:gap-5 xl:gap-7 shrink-0">
              <Link
                id="brand-logo-button"
                to="/"
                className="flex items-center gap-2.5 sm:gap-3 group select-none text-left focus:outline-none"
              >
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-white border border-emerald-200/80 shadow-md shadow-emerald-500/15 group-hover:shadow-emerald-500/30 group-hover:scale-105 transition-all duration-300">
                  <img
                    src="/src/images/logo.jpeg"
                    alt="withU logo"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none group-hover:text-emerald-600 transition-colors">
                      with<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">U</span>
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                    {locale === 'bn' ? 'এক্সপার্ট অ্যাডভাইজরি' : 'Expert Advisory'}
                  </span>
                </div>
              </Link>

              <div className="relative hidden xl:block" ref={categoriesMenuRef}>
                <button
                  id="categories-menu-button"
                  type="button"
                  onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-200 border ${
                    isCategoriesDropdownOpen 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                      : 'bg-slate-100/80 hover:bg-slate-200/70 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <LayoutGrid className={`w-3.5 h-3.5 transition-colors ${isCategoriesDropdownOpen ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>{t('categories')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
                </button>

                {isCategoriesDropdownOpen && (
                  <div className="absolute left-0 top-full mt-3 w-[min(460px,calc(100vw-3rem))] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 mb-2">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        {t('allCategories')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                        {locale === 'bn' ? '৬টি মূল সেক্টর' : '6 Core Sectors'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <Link
                            key={cat.id}
                            id={`nav-category-${cat.id}`}
                            to={viewToPath('catalog', { categoryId: cat.id })}
                            onClick={() => setIsCategoriesDropdownOpen(false)}
                            className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm ${cat.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                                  {cat.name}
                                </p>
                                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  {cat.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {cat.subtitle}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 px-2 flex justify-between items-center text-xs">
                      <Link
                        id="categories-dropdown-view-all"
                        to={viewToPath('catalog')}
                        onClick={() => setIsCategoriesDropdownOpen(false)}
                        className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1.5 transition-colors group"
                      >
                        <span>{t('viewAllServices')}</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                       
                    </div>
                  </div>
                )}
              </div>

              <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-600">
                <Link
                  id="nav-all-services"
                  to="/catalog"
                  className={`px-3 py-2 rounded-xl transition-all ${
                    currentView === 'catalog'
                      ? 'text-emerald-700 bg-emerald-50 shadow-xs'
                      : 'hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {t('allServices')}
                </Link>
                <Link
                  id="nav-doctors"
                  to="/catalog?category=cat-healthcare"
                  className="px-3 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100/70 transition-all"
                >
                  {t('doctors')}
                </Link>
                <Link
                  id="nav-pilgrimage"
                  to="/catalog?category=cat-hajj-umrah"
                  className="px-3 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100/70 transition-all"
                >
                  {t('pilgrimage')}
                </Link>
                <Link
                  id="nav-store"
                  to="/commerce"
                  className={`px-3 py-2 rounded-xl transition-all ${
                    currentView === 'commerce'
                      ? 'text-emerald-700 bg-emerald-50 shadow-xs'
                      : 'hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {t('storeProducts')}
                </Link>
              </nav>
            </div>

            <div className="flex-1 max-w-md xl:max-w-lg hidden md:block relative" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className={`relative flex items-center transition-all duration-300 rounded-full border ${
                  isSearchFocused || searchQuery
                    ? 'bg-white border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' 
                    : 'bg-slate-100/80 hover:bg-slate-100 border-slate-200/80'
                }`}>
                  <Search className={`w-4 h-4 ml-3.5 shrink-0 transition-colors ${isSearchFocused ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <input
                    ref={searchInputRef}
                    id="main-navbar-search-input"
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    placeholder={t('searchPlaceholder')}
                    autoComplete="off"
                    spellCheck={false}
                    // Explicit, forced text color — guards against any global/autofill
                    // CSS that could otherwise render typed text invisible.
                    style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a', opacity: 1 }}
                    className="relative z-10 w-full pl-2.5 pr-14 py-2 bg-transparent text-sm sm:text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none caret-emerald-600 selection:bg-emerald-100 selection:text-emerald-900"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="hidden lg:flex items-center gap-0.5 mr-3 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 shadow-xs">
                      <span>⌘</span>
                      <span>K</span>
                    </div>
                  )}
                </div>
              </form>

              {isSearchFocused && (
                <div
                  className="absolute right-0 top-full mt-3 bg-white/98 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/15 z-50 animate-in fade-in slide-in-from-top-2 duration-150 w-[calc(100vw-2rem)] sm:w-[min(680px,calc(100vw-3rem))] max-w-[760px] overflow-hidden"
                  role="dialog"
                  aria-label={t('advancedSearch')}
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <Filter className="w-3.5 h-3.5 text-emerald-400" />
                      {t('advancedSearch')}
                    </span>
                    <span className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-slate-300">
                      <span className="flex items-center gap-1">
                        <Command className="w-3 h-3" /> K
                      </span>
                      <span className="flex items-center gap-1">
                        <CornerDownLeft className="w-3 h-3" />
                        {locale === 'bn' ? 'নির্বাচন' : 'Select'}
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded border border-white/20">
                        Esc
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row max-h-[70vh]">
                    {/* ---------- LEFT FILTER RAIL ---------- */}
                    <aside className="sm:w-[240px] shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/60 p-4 space-y-5 overflow-y-auto">
                      {/* Category scope */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <LayoutGrid className="w-3 h-3" />
                          {t('categories')}
                        </div>
                        <div className="space-y-1">
                          {categoryScopeOptions.map((opt) => {
                            const Icon = opt.icon;
                            const active = categoryScope === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setCategoryScope(opt.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  active
                                    ? 'bg-white border border-emerald-200 shadow-sm text-emerald-700'
                                    : 'border border-transparent text-slate-600 hover:bg-white hover:border-slate-200'
                                }`}
                              >
                                <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-600' : opt.color}`} />
                                <span className="flex-1 text-left">{opt.label}</span>
                                {active && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Verified-only toggle */}
                      <div>
                        <label className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {t('verifiedOnly')}
                          </span>
                          <span className="relative inline-block w-8 h-4.5">
                            <input
                              type="checkbox"
                              checked={verifiedOnly}
                              onChange={(e) => setVerifiedOnly(e.target.checked)}
                              className="peer sr-only"
                            />
                            <span className="absolute inset-0 rounded-full bg-slate-200 peer-checked:bg-emerald-500 transition-colors" />
                            <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3.5" />
                          </span>
                        </label>
                      </div>

                      {/* Sort by */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <SlidersHorizontal className="w-3 h-3" />
                          {t('sortBy')}
                        </div>
                        <div className="space-y-1">
                          {[
                            { id: 'relevance' as const, label: t('sortRelevance'), icon: Sparkles },
                            { id: 'recent' as const, label: t('sortRecent'), icon: Clock },
                            { id: 'rating' as const, label: t('sortRating'), icon: Star },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const active = sortBy === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setSortBy(opt.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'text-slate-600 hover:bg-white border border-transparent'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="flex-1 text-left">{opt.label}</span>
                                {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent searches */}
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <History className="w-3 h-3" />
                              {t('recentSearches')}
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={clearRecentSearches}
                              className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                              title={t('clearHistory')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-0.5">
                            {recentSearches.map((term, idx) => (
                              <button
                                key={`${term}-${idx}`}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSearchSubmit(undefined, term)}
                                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-white hover:text-emerald-700 transition-colors text-left"
                              >
                                <History className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate flex-1">{term}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </aside>

                    {/* ---------- RIGHT RESULTS PANE ---------- */}
                    <section className="flex-1 min-w-0 flex flex-col">
                      {searchQuery.trim().length < 2 ? (
                        <div className="flex-1 p-4 overflow-y-auto">
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              {t('quickSearchTags')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-3">
                            {popularSearches.map((tag, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSearchSubmit(undefined, tag)}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-left"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          {recentSearches.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2.5">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <History className="w-3.5 h-3.5 text-emerald-600" />
                                  {t('recentSearches')}
                                </span>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={clearRecentSearches}
                                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  {t('clearHistory')}
                                </button>
                              </div>
                              <div className="space-y-0.5">
                                {recentSearches.map((term, idx) => (
                                  <button
                                    key={`${term}-${idx}`}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSearchSubmit(undefined, term)}
                                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                                  >
                                    <History className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate flex-1">{term}</span>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : advancedResults.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <Search className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-black">
                                {advancedResults.length}
                              </span>
                              {locale === 'bn' ? 'টি ফলাফল' : 'results'}
                            </span>
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                              <BadgeCheck className="w-3 h-3 text-emerald-500" />
                              {verifiedOnly ? t('verifiedOnly') : t('searchInAll')}
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {advancedResults.map(renderHitRow)}
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSearchSubmit()}
                            className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all text-xs font-bold border-t border-emerald-700/20"
                          >
                            <span className="flex items-center gap-2">
                              <Search className="w-3.5 h-3.5" />
                              {locale === 'bn' ? 'সব ফলাফল দেখুন' : 'See all results for'} &ldquo;{searchQuery}&rdquo;
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <Search className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="font-semibold text-slate-700 mb-1">
                            {t('noResultsFor')} &ldquo;{searchQuery}&rdquo;
                          </p>
                          <p className="text-xs text-slate-400 mb-3">
                            {locale === 'bn' ? 'ফিল্টার সরিয়ে বা অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন' : 'Try a different keyword or reset filters'}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCategoryScope('all');
                                setVerifiedOnly(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                            >
                              <X className="w-3 h-3" />
                              {locale === 'bn' ? 'ফিল্টার রিসেট' : 'Reset filters'}
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSearchSubmit()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            >
                              {locale === 'bn' ? 'ক্যাটালগে খুঁজুন' : 'Search catalog anyway'}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                id="become-expert-nav-btn"
                to="/become-expert"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 rounded-xl transition-all shadow-xs hover:shadow hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>{t('becomeExpert')}</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`md:hidden p-2 rounded-xl transition-all ${
                  isSearchOpen ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                aria-label="Search"
                aria-expanded={isSearchOpen}
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="relative" ref={cartMenuRef}>
                <button
                  id="header-cart-button"
                  type="button"
                  onClick={() => {
                    setIsCartOpen(!isCartOpen);
                    setIsNotifOpen(false);
                  }}
                  className={`relative p-2 rounded-xl transition-all ${
                    isCartOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  title="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-in zoom-in-50 duration-200">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>

                {isCartOpen && (
                  <div className="absolute right-0 mt-3 w-[min(320px,calc(100vw-2rem))] sm:w-[380px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {locale === 'bn' ? 'আপনার কার্ট' : 'Your Cart'}
                        </h4>
                        {cartCount > 0 && (
                          <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-200/60 text-emerald-700 px-2 py-0.5 rounded-full">
                            {cartCount} {locale === 'bn' ? 'টি আইটেম' : 'items'}
                          </span>
                        )}
                      </div>
                      {cart.length > 0 && (
                        <button
                          type="button"
                          onClick={() => clearCart()}
                          className="text-[11px] text-rose-500 font-bold hover:underline"
                        >
                          {locale === 'bn' ? 'সব মুছুন' : 'Clear all'}
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                      {cart.length === 0 ? (
                        <div className="text-center py-8 text-sm text-slate-400">
                          <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          <p className="font-semibold text-slate-600 mb-0.5">
                            {locale === 'bn' ? 'কার্ট খালি' : 'Your cart is empty'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {locale === 'bn'
                              ? 'হালাল স্টোর থেকে কিছু যোগ করুন'
                              : 'Browse the Halal Store to add products'}
                          </p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.product.id} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-2xl transition-colors">
                            <img
                              src={item.product.coverImage}
                              alt={item.product.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                                {item.product.title}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {locale === 'bn' ? 'পরিমাণ' : 'Qty'}: <span className="font-bold text-slate-700">{item.quantity}</span>
                              </p>
                              <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                                ৳{(item.product.priceBDT * item.quantity).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {cart.length > 0 && (
                      <div className="pt-3 mt-1 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">
                            {locale === 'bn' ? 'মোট' : 'Subtotal'}
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            ৳{cartTotalBDT.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            id="cart-dropdown-browse-store"
                            to={viewToPath('commerce')}
                            onClick={() => setIsCartOpen(false)}
                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          >
                            {locale === 'bn' ? 'স্টোর দেখুন' : 'Browse store'}
                          </Link>
                          <Link
                            id="cart-dropdown-checkout"
                            to={viewToPath('checkout')}
                            onClick={() => setIsCartOpen(false)}
                            className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-sm transition-all"
                          >
                            {locale === 'bn' ? 'চেকআউট' : 'Checkout'}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={notifMenuRef}>
                <button
                  id="header-notifications-button"
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative p-2 rounded-xl transition-all ${
                    isNotifOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-ping" />
                  )}
                  {unreadCount > 0 && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm ${
                        unreadCount > 9 ? 'px-1.5' : ''
                      }`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 sm:right-0 mt-3 w-[min(300px,calc(100vw-2rem))] sm:w-[360px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{t('notifications')}</h4>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-extrabold bg-rose-50 border border-rose-200/60 text-rose-600 px-2 py-0.5 rounded-full">
                            {unreadCount} {locale === 'bn' ? 'নতুন' : 'new'}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-600 font-bold hover:underline"
                        >
                          {t('markAllRead')}
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-sm text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          {t('noNotifications')}
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.entityUrl) {
                                if (notif.entityUrl.startsWith('/portal/customer') || notif.entityUrl.startsWith('/customer')) routerNavigate('/portal/customer');
                                else if (notif.entityUrl.startsWith('/portal/expert') || notif.entityUrl.startsWith('/expert')) routerNavigate('/portal/expert');
                                else if (notif.entityUrl.startsWith('/admin')) routerNavigate('/admin');
                              }
                              setIsNotifOpen(false);
                            }}
                            className={`p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors ${
                              !notif.isRead ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="user-profile-menu-button"
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full hover:bg-slate-100/90 border border-slate-200/80 transition-all"
                  >
                    <div className="relative">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 leading-tight max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-tight">
                        {activeRole}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-[min(288px,calc(100vw-2rem))] sm:w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl mb-1.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold truncate">{user.name}</p>
                          <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase">
                            {activeRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-300">
                          <span className="flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Verified Account
                          </span>
                          <span className="text-emerald-400 font-bold">100% ID</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 text-xs font-bold">
                        <Link
                          id="user-menu-customer-dashboard"
                          to="/portal/customer"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                            currentView === 'customer' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <UserIcon className="w-4 h-4 text-emerald-600" />
                            <span>{t('myAccount')}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>

                        <Link
                          id="user-menu-expert-portal"
                          to="/portal/expert"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                            currentView === 'expert' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <span>{t('expertPortal')}</span>
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                            Pro
                          </span>
                        </Link>

                        <Link
                          id="user-menu-admin-audit"
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                            currentView === 'admin' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            <span>{t('adminDashboard')}</span>
                          </div>
                          <Lock className="w-3.5 h-3.5 text-purple-400" />
                        </Link>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 mt-1">
                        <button
                          id="user-menu-logout"
                          type="button"
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  id="header-login-button"
                  to={viewToPath('login')}
                  className="whitespace-nowrap px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-full transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95 border border-emerald-400/40"
                >
                  {t('login')}
                </Link>
              )}

              <button
                id="mobile-menu-toggle-btn"
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl transition-all ${
                  isMobileMenuOpen ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* ===== Mobile search panel — mirrors the desktop advanced search:
               live results, category chips, popular tags, recent searches. ===== */}
          {isSearchOpen && (
            <div
              ref={mobileSearchContainerRef}
              className="md:hidden pb-3 pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={mobileSearchInputRef}
                  id="mobile-navbar-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a', opacity: 1 }}
                  className={`relative z-10 w-full pl-9 pr-8 py-2.5 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors ${
                    searchQuery ? 'bg-white border-emerald-400' : 'bg-slate-100/90 border-slate-200 focus:bg-white'
                  }`}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Category scope chips — horizontally scrollable on narrow screens */}
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 -mx-4 px-4">
                {categoryScopeOptions.map((opt) => {
                  const active = categoryScope === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCategoryScope(opt.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Live results / suggestions */}
              <div className="mt-2.5 max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white">
                {searchQuery.trim().length < 2 ? (
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {t('quickSearchTags')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSearchSubmit(undefined, tag)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-700"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {recentSearches.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <History className="w-3.5 h-3.5 text-emerald-600" />
                            {t('recentSearches')}
                          </span>
                          <button type="button" onClick={clearRecentSearches} className="text-slate-400" title={t('clearHistory')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {recentSearches.map((term, idx) => (
                            <button
                              key={`${term}-${idx}`}
                              type="button"
                              onClick={() => handleSearchSubmit(undefined, term)}
                              className="w-full flex items-center gap-2 px-1 py-1.5 text-xs text-slate-700 text-left"
                            >
                              <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate flex-1">{term}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : advancedResults.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600">
                        <span className="text-emerald-700">{advancedResults.length}</span>{' '}
                        {locale === 'bn' ? 'টি ফলাফল' : 'results'}
                      </span>
                    </div>
                    <div className="p-2 space-y-1">{advancedResults.map(renderHitRow)}</div>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold"
                    >
                      <Search className="w-3.5 h-3.5" />
                      {locale === 'bn' ? 'সব ফলাফল দেখুন' : 'See all results'}
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                      <Search className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      {t('noResultsFor')} &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
                    >
                      {locale === 'bn' ? 'ক্যাটালগে খুঁজুন' : 'Search catalog anyway'}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[calc(100%)] max-h-[calc(100vh-100px)] overflow-y-auto bg-white/95 backdrop-blur-2xl border-b border-slate-200 shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-4 duration-200 z-40">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400/50"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase">
                {activeRole}
              </span>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/70 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-emerald-950">
                  {locale === 'bn' ? 'withU একাউন্টে সাইন ইন করুন' : 'Sign in to withU'}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {locale === 'bn' ? 'পরামর্শ ও এসক্রো ট্র্যাক করুন' : 'Track consultations & escrow'}
                </p>
              </div>
              <Link
                id="mobile-menu-login"
                to={viewToPath('login')}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 rounded-xl shadow-sm"
              >
                {t('login')}
              </Link>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                {t('roleSwitcher')}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">{activeRole}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => { switchRole('CUSTOMER'); setIsMobileMenuOpen(false); }}
                className={`py-2 rounded-xl transition-all ${
                  activeRole === 'CUSTOMER' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => { switchRole('EXPERT'); setIsMobileMenuOpen(false); }}
                className={`py-2 rounded-xl transition-all ${
                  activeRole === 'EXPERT' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Expert
              </button>
              <button
                type="button"
                onClick={() => { switchRole('ADMIN'); setIsMobileMenuOpen(false); }}
                className={`py-2 rounded-xl transition-all ${
                  activeRole === 'ADMIN' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <Link
            id="mobile-menu-become-expert"
            to={viewToPath('become-expert')}
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-600/20 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-extrabold">{t('becomeExpert')}</p>
                <p className="text-[10px] text-emerald-100">
                  {locale === 'bn' ? '�াক্তার, প্রকৌশলী ও আইনজীবীদের জন্য' : 'Join verified practitioner network'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white shrink-0" />
          </Link>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
              {t('categories')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.id}
                    id={`mobile-menu-category-${cat.id}`}
                    to={viewToPath('catalog', { categoryId: cat.id })}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-xl text-left transition-all"
                  >
                    <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 text-xs font-bold">
            <Link
              id="mobile-menu-home"
              to={viewToPath('home')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t('home')}
            </Link>
            <Link
              id="mobile-menu-catalog"
              to={viewToPath('catalog')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t('allServices')}
            </Link>
            <Link
              id="mobile-menu-commerce"
              to={viewToPath('commerce')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t('storeProducts')}
            </Link>
            <Link
              id="mobile-menu-customer"
              to="/portal/customer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 text-slate-800 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>{t('myAccount')}</span>
              <UserIcon className="w-4 h-4 text-emerald-600" />
            </Link>
            <Link
              id="mobile-menu-expert"
              to="/portal/expert"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl flex items-center justify-between"
            >
              <span>{t('expertPortal')}</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </Link>
            <Link
              id="mobile-menu-admin"
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 text-purple-600 hover:bg-purple-50 rounded-xl flex items-center justify-between"
            >
              <span>{t('adminDashboard')}</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <a 
              href="tel:0961294848" 
              className="flex items-center gap-1.5 text-emerald-700 font-extrabold"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>০৯৬১২-WITHU</span>
            </a>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="text-rose-600 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('logout')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};