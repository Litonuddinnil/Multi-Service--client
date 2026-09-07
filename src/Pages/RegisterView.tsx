import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ChevronRight,
  Camera,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LazyThreeCanvas3D } from '../components/common/LazyThreeCanvas3D';
import { OtpInput } from '../components/OtpInput/OtpInput';
import { Alerts } from '../services/alerts';
import { uploadImage, ACCEPTED_IMAGE_TYPES } from '../services/imageUpload';
import logo from '../images/final_logo.jpeg';

interface RegisterViewProps {
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

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate, onSuccess }) => {
  const { register, verifyEmail, loginWithGoogle } = useAuth();
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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  // The server creates accounts as pending_verification, so registration hands off
  // to a code step rather than straight to a dashboard.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  // Profile photo. `preview` is a local object URL shown immediately; `avatarUrl`
  // is the hosted link, set once the upload finishes and sent with the account.
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setAvatarUrl(null);
    setUploading(true);
    const res = await uploadImage(file);
    setUploading(false);

    if (res.success && res.url) {
      setAvatarUrl(res.url);
    } else {
      // Keep the preview so the choice is not lost, but be explicit that the
      // picture will not be saved unless the upload succeeds.
      Alerts.warning(
        locale === 'bn' ? 'ছবি আপলোড হয়নি' : 'Photo not uploaded',
        res.error || 'You can continue without a photo.',
      );
    }
  };

  const clearImage = () => {
    setPreview(null);
    setAvatarUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      Alerts.warning(
        locale === 'bn' ? 'তথ্য অসম্পূর্ণ' : 'Missing details',
        locale === 'bn' ? 'অনুগ্রহ করে সব তথ্য পূরণ করুন।' : 'Please fill in every required field.',
      );
      return;
    }
    if (password.length < 8) {
      Alerts.warning(
        locale === 'bn' ? 'পাসওয়ার্ড ছোট' : 'Password too short',
        locale === 'bn' ? 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।' : 'Use at least 8 characters.',
      );
      return;
    }

    setLoading(true);
    Alerts.loading(locale === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating your account...');
    try {

      // Sign-up only ever creates a customer; expert and admin are granted by review.
      const res = await register({
        name,
        email,
        password,
        phone: phone || '01700000000',
        role: 'CUSTOMER',
        avatarUrl: avatarUrl ?? undefined,
      });

      Alerts.close();

      if (res.success && res.pendingVerification) {
        setPendingEmail(res.email ?? email);
        await Alerts.success(
          locale === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে' : 'Account created',
          locale === 'bn'
            ? 'ইমেইলে পাঠানো ৬ ডিজিটের কোডটি লিখুন।'
            : `Enter the 6-digit code we sent to ${res.email ?? email}.`,
        );
      } else if (res.success && res.user) {
        await Alerts.toast(locale === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে!' : 'Account created!');
        handleNavigate('customer');
        onSuccess?.();
      } else {
        Alerts.error(
          locale === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ' : 'Registration failed',
          res.error || 'Please try a different email address.',
        );
      }
    } catch (err: any) {
      Alerts.close();
      Alerts.error(locale === 'bn' ? 'ত্রুটি' : 'Something went wrong', err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail || otp.length !== 6) return;
    setLoading(true);
    Alerts.loading(locale === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...');
    try {
      const res = await verifyEmail(pendingEmail, otp);
      Alerts.close();
      if (res.success && res.user) {
        await Alerts.toast(locale === 'bn' ? 'যাচাই সম্পন্ন!' : 'Verified!');
        handleNavigate('customer');
        onSuccess?.();
      } else {
        Alerts.error(
          locale === 'bn' ? 'কোড গ্রহণযোগ্য নয়' : 'Code not accepted',
          res.error || 'Check the code and try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle('CUSTOMER');
      if (res.success && res.user) {
        await Alerts.toast(locale === 'bn' ? 'গুগল সাইন-ইন সফল!' : 'Signed in with Google!');
        handleNavigate('customer');
        onSuccess?.();
      } else {
        Alerts.error(locale === 'bn' ? 'সাইন-ইন ব্যর্থ' : 'Sign-in failed', res.error || 'Google sign-in failed.');
      }
    } catch (err: any) {
      Alerts.error(locale === 'bn' ? 'ত্রুটি' : 'Something went wrong', err.message || 'Google auth error.');
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
             <img src={logo} alt="WithU" className="w-14 h-14 rounded-lg object-cover"/>
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

        <h3 className="text-xl font-bold text-center mb-1">
          {locale === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন ✨' : 'Create Your Account ✨'}
        </h3>
        <p className="text-xs text-center text-gray-400 mb-5">
          {locale === 'bn'
            ? 'সেবা বুক করতে ও এসক্রো সুরক্ষা পেতে অ্যাকাউন্ট তৈরি করুন।'
            : 'Create an account to book services with escrow protection.'}
        </p>


        {pendingEmail ? (
          /* Step 2 — the emailed code. The account exists but stays inactive
             until this succeeds, so there is no way to skip past it. */
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white">
                {locale === 'bn' ? 'ইমেইল যাচাই করুন' : 'Verify your email'}
              </p>
              <p className="text-xs text-gray-400">
                {locale === 'bn' ? 'কোড পাঠানো হয়েছে' : 'We sent a 6-digit code to'}{' '}
                <span className="font-semibold text-gray-200">{pendingEmail}</span>
              </p>
            </div>

            <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#34C759] to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? (locale === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                : (locale === 'bn' ? 'যাচাই সম্পন্ন করুন' : 'Verify & Continue')}
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => { setPendingEmail(null); setOtp(''); }}
              className="w-full text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {locale === 'bn' ? 'অন্য ইমেইল ব্যবহার করুন' : 'Use a different email'}
            </button>
          </form>
        ) : (
        <>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="flex flex-col items-center gap-2 pb-1">
            <label
              className="relative group cursor-pointer"
              title={locale === 'bn' ? 'প্রোফাইল ছবি যোগ করুন' : 'Add a profile photo'}
            >
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handlePickImage}
                disabled={uploading || loading}
                className="sr-only"
              />
              <span className="block w-20 h-20 rounded-2xl overflow-hidden bg-black/30 border-2 border-dashed border-white/20 group-hover:border-[#34C759]/70 transition-colors">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-500 group-hover:text-[#34C759] transition-colors" />
                  </span>
                )}
              </span>

              {uploading && (
                <span className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#34C759] animate-spin" />
                </span>
              )}

              {/* Only a hosted image counts; a local preview alone is not saved. */}
              {avatarUrl && !uploading && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#34C759] border-2 border-[#111827] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              )}
            </label>

            {preview ? (
              <button
                type="button"
                onClick={clearImage}
                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                {locale === 'bn' ? 'ছবি সরান' : 'Remove photo'}
              </button>
            ) : (
              <span className="text-[11px] text-gray-500">
                {locale === 'bn' ? 'প্রোফাইল ছবি (ঐচ্ছিক)' : 'Profile photo (optional)'}
              </span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1">
              {locale === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Niloy Hasan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#34C759]/40 focus:border-[#34C759] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1">
              {locale === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#34C759]/40 focus:border-[#34C759] outline-none"
              />
            </div>
          </div>

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
                <span>{locale === 'bn' ? 'অ্যাকাউন্ট নিশ্চিত করুন' : 'Create & Access Dashboard'}</span>
                <ChevronRight className="w-4 h-4" />
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
        </>
        )}

        {/* Footer */}
        <div className="mt-6 space-y-1.5 text-center text-xs text-gray-400">
          <div>
            {locale === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
            <Link
              to="/login"
              className="text-[#34C759] font-bold hover:underline cursor-pointer ml-1"
            >
              {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
            </Link>
          </div>
          <div className="text-[11px] text-gray-500">
            {locale === 'bn' ? 'পেশাদার হিসেবে যোগ দিতে চান?' : 'Joining as a professional?'}{' '}
            <Link to="/become-expert" className="text-gray-300 font-semibold hover:underline cursor-pointer">
              {locale === 'bn' ? 'এক্সপার্ট হিসেবে আবেদন করুন' : 'Apply to become an expert'}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterView;