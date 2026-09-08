import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LazyThreeCanvas3D } from '../components/common/LazyThreeCanvas3D';
import logo from '../images/final_logo.jpeg';

interface LoginViewProps {
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onSuccess?: () => void;
}

const PORTAL_ROUTES: Record<string, string> = {
  admin: '/admin',
  expert: '/portal/expert',
  customer: '/portal/customer',
  home: '/',
  catalog: '/catalog',
  'become-expert': '/become-expert',
  commerce: '/commerce',
};

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onSuccess }) => {
  const { login, loginWithGoogle } = useAuth();
  const { locale } = useLanguage();
  const reactNavigate = useNavigate();

  const handleNavigate = useCallback(
    (view: string, params?: Record<string, any>) => {
      if (onNavigate) {
        onNavigate(view, params);
        return;
      }
      reactNavigate(PORTAL_ROUTES[view] ?? '/');
    },
    [onNavigate, reactNavigate],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Compile-time flag, so these real credentials are stripped from the production bundle.
  const showDemoLogins = import.meta.env.DEV;

  const handleQuickDemo = (type: 'customer' | 'expert' | 'admin') => {
    if (!showDemoLogins) return;
    if (type === 'customer') {
      setEmail('mdniloyhasan544@gmail.com');
      setPassword('password123');
    } else if (type === 'expert') {
      setEmail('dr.tanzim@withu.health');
      setPassword('password123');
    } else if (type === 'admin') {
      setEmail('admin@withu.market');
      setPassword('adminPass!2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        setSuccessMsg(locale === 'bn' ? 'লগইন সফল হয়েছে! রিডাইরেক্ট হচ্ছে...' : 'Login successful! Redirecting...');
        setTimeout(() => {
          if (res.user?.roles.includes('ADMIN') || res.user?.roles.includes('SUPER_ADMIN')) {
            handleNavigate('admin');
          } else if (res.user?.roles.includes('EXPERT')) {
            handleNavigate('expert');
          } else {
            handleNavigate('customer');
          }
          onSuccess?.();
        }, 600);
      } else {
        setError(res.error || (locale === 'bn' ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' : 'Invalid email or password.'));
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      // A Google sign-in only ever creates a CUSTOMER account; EXPERT and ADMIN
      // are granted by review through the admin console. No role override is sent.
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        setSuccessMsg(locale === 'bn' ? 'গুগল সাইন-ইন সফল হয়েছে!' : 'Google sign-in verified!');
        setTimeout(() => {
          handleNavigate('customer');
          onSuccess?.();
        }, 600);
      } else {
        setError(res.error || 'Google sign-in failed');
      }
    } catch (err: any) {
      setError(err.message || 'Google Auth error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#0B0F19] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LazyThreeCanvas3D className="w-full h-full opacity-60" particleCount={90} theme="emerald" />
      </div>

      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#34C759]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl bg-[#111827]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="text-center space-y-2.5 mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#34C759]/20 via-cyan-500/10 to-transparent border border-[#34C759]/40 shadow-lg shadow-[#34C759]/10 relative">
            <img src={logo} alt="withU" className="w-14 h-14 rounded-lg object-cover" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34C759]" />
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              with<span className="text-[#34C759]">U</span> Multi-Services
              <Sparkles className="w-5 h-5 text-[#34C759]" />
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
              {locale === 'bn'
                ? 'বাংলাদেশ ট্রাস্টেড মাল্টি-সার্ভিসেস ও এসক্রো সিকিউরিটি প্ল্যাটফর্ম'
                : 'Bangladesh’s Unified Escrow Multi-Service & Professional Ecosystem'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Signature Escrow Protected</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center mb-1">
          {locale === 'bn' ? 'আবার স্বাগতম 👋' : 'Welcome Back 👋'}
        </h3>
        <p className="text-xs text-center text-gray-400 mb-5">
          {locale === 'bn'
            ? 'আপনার অ্যাকাউন্টে প্রবেশ করতে লগইন করুন।'
            : 'Sign in to access your dashboard and continue.'}
        </p>

        {/* Demo Quick Logins — development builds only. */}
        {showDemoLogins && (
          <div className="mb-5 grid grid-cols-3 gap-2">
            {(['customer', 'expert', 'admin'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleQuickDemo(t)}
                className="text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              >
                {t === 'customer' ? 'Customer' : t === 'expert' ? 'Expert' : 'Admin'} Demo
              </button>
            ))}
          </div>
        )}

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1">
              {locale === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#34C759]/40 focus:border-[#34C759] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1">
              {locale === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#34C759]/40 focus:border-[#34C759] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-white cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#34C759] to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {locale === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying Matrix Credentials...'}
              </span>
            ) : (
              <>
                <span>{locale === 'bn' ? 'লগইন করুন' : 'Log In to withU'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {locale === 'bn' ? 'অথবা গুগল দিয়ে সাইন-ইন' : 'OR SINGLE SIGN-ON'}
          </span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.3s.7 2.6 1.9 5l3.7-2.5z" />
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
          </svg>
          <span>Continue with Google Single Sign-On</span>
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          {locale === 'bn' ? 'withU-তে নতুন?' : 'New to withU Multi-Services?'}{' '}
          <Link
            to="/register"
            className="text-[#34C759] font-bold hover:underline cursor-pointer ml-1"
          >
            {locale === 'bn' ? 'সাইন আপ করুন' : 'Create an Account'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginView;