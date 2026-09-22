import React, { useState, useCallback, useEffect } from 'react';
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
  MailCheck,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LazyThreeCanvas3D } from '../components/common/LazyThreeCanvas3D';
import { Alerts } from '../services/alerts';
import { getErrorMessage } from '../constants/errorCodes';
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
  const { register, verifyEmail, resendVerification, loginWithGoogle } = useAuth();
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

  /**
   * §1 makes sign-up two steps: `register` creates a PENDING_VERIFICATION
   * account and emails a 6-digit code, then `verify-email` consumes it and
   * signs the user in. `pendingEmail` is what switches this screen between
   * the two — non-null means "we are waiting on the code".
   */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  /** Only set when the deployment cannot actually deliver mail (dev / demo). */
  const [devCode, setDevCode] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  // Self-service role selector. PUBLIC sign-ups can pick CUSTOMER, EXPERT, or
  // ADMIN. The selected role is sent to the server. The server is the final
  // gate: ADMIN is only granted when the server was started with
  // `ALLOW_SELF_SERVICE_ADMIN=true`; otherwise the ADMIN claim is silently
  // downgraded to CUSTOMER and a warning is logged, so a tampered client
  // cannot mint privileges from the registration form. The dashboard landing
  // page reads the server's `res.user.roles` (not the submitted value) so
  // downgraded accounts still land in the customer portal.
  type SignupRole = 'CUSTOMER' | 'EXPERT' | 'ADMIN';
  const [role, setRole] = useState<SignupRole>('CUSTOMER');

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

      // The role choice flows through to the server. The server may downgrade
      // ADMIN→CUSTOMER if it was not started with ALLOW_SELF_SERVICE_ADMIN, and
      // it always rejects unknown role values.
      const res = await register({
        name,
        email,
        password,
        phone: phone || '01700000000',
        role: role as 'CUSTOMER' | 'EXPERT',
        avatarUrl: avatarUrl ?? undefined,
      });

      Alerts.close();

      // The account exists but is PENDING_VERIFICATION — move to the OTP step
      // rather than pretending the user is signed in.
      if (res.success) {
        setPendingEmail(res.email ?? email);
        setDevCode(res.verificationCode ?? null);
        setResendIn(60);
        await Alerts.toast(
          locale === 'bn' ? 'কোড পাঠানো হয়েছে — ইমেইল দেখুন' : 'Code sent — check your email',
        );
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

  /**
   * Land the user in the portal that matches the roles the SERVER granted.
   * A tampered client that asked for ADMIN but was downgraded to CUSTOMER
   * still ends up in the customer portal.
   */
  const landAfterSignIn = useCallback(
    (roles: string[]) => {
      const landing =
        roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
          ? 'admin'
          : roles.includes('EXPERT')
            ? 'expert'
            : 'customer';
      handleNavigate(landing);
      onSuccess?.();
    },
    [handleNavigate, onSuccess],
  );

  /** Tick the re-send cooldown down to zero. */
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail || otp.trim().length !== 6) {
      Alerts.error(
        locale === 'bn' ? 'কোড দিন' : 'Enter the code',
        locale === 'bn' ? '৬ সংখ্যার কোডটি লিখুন।' : 'Type the 6-digit code from your email.',
      );
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail(pendingEmail, otp.trim());
      if (res.success && res.user) {
        await Alerts.toast(locale === 'bn' ? 'অ্যাকাউন্ট যাচাই হয়েছে!' : 'Account verified!');
        landAfterSignIn((res.user.roles || []) as string[]);
        return;
      }
      Alerts.error(
        locale === 'bn' ? 'যাচাই ব্যর্থ' : 'Verification failed',
        getErrorMessage(res.errorCode, locale === 'bn' ? 'bn' : 'en'),
      );
    } catch (err: any) {
      Alerts.error(locale === 'bn' ? 'ত্রুটি' : 'Something went wrong', err?.message ?? 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail || resendIn > 0) return;
    setLoading(true);
    try {
      const res = await resendVerification(pendingEmail);
      if (res.success) {
        setResendIn(60);
        await Alerts.toast(locale === 'bn' ? 'নতুন কোড পাঠানো হয়েছে' : 'A new code is on its way');
      } else {
        // The server hands back how long is left on the cooldown; honour it
        // rather than letting the button look available while it 429s.
        if (res.retryAfterSeconds) setResendIn(res.retryAfterSeconds);
        Alerts.error(
          locale === 'bn' ? 'পাঠানো যায়নি' : 'Could not send',
          getErrorMessage(res.errorCode, locale === 'bn' ? 'bn' : 'en'),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Google sign-in always creates a CUSTOMER account; no role override is
      // accepted by the server (or by `loginWithGoogle`'s signature).
      const res = await loginWithGoogle();
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
          {pendingEmail
            ? locale === 'bn' ? 'ইমেইল যাচাই করুন 📧' : 'Confirm your email 📧'
            : locale === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন ✨' : 'Create Your Account ✨'}
        </h3>
        <p className="text-xs text-center text-gray-400 mb-5">
          {pendingEmail
            ? locale === 'bn'
              ? 'আপনার ইনবক্সে পাঠানো কোডটি দিন — এটিই আপনার প্রথম সাইন ইন।'
              : 'Enter the code we emailed you — confirming it signs you in.'
            : locale === 'bn'
              ? 'সেবা বুক করতে ও এসক্রো সুরক্ষা পেতে অ্যাকাউন্ট তৈরি করুন।'
              : 'Create an account to book services with escrow protection.'}
        </p>


        {/*
          §1 step two. The account already exists at this point — it is just
          PENDING_VERIFICATION until this code is consumed, which is why the
          screen swaps rather than stacking on top of the sign-up form.
        */}
        {pendingEmail ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-2xl border border-[#34C759]/30 bg-[#34C759]/5 p-4 text-center">
              <MailCheck className="w-8 h-8 text-[#34C759] mx-auto mb-2" />
              <p className="text-sm text-gray-200">
                {locale === 'bn' ? 'আমরা একটি ৬ সংখ্যার কোড পাঠিয়েছি' : 'We sent a 6-digit code to'}
              </p>
              <p className="text-sm font-semibold text-white break-all">{pendingEmail}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {locale === 'bn'
                  ? 'কোডটি ১৫ মিনিট পর্যন্ত বৈধ।'
                  : 'The code is valid for 15 minutes.'}
              </p>
            </div>

            {devCode && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                {locale === 'bn' ? 'ডেভ মোড — কোড: ' : 'Dev mode — no mail server configured. Code: '}
                <span className="font-mono font-bold tracking-widest">{devCode}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {locale === 'bn' ? 'ভেরিফিকেশন কোড' : 'Verification code'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder-gray-600 focus:outline-none focus:border-[#34C759]/60 focus:ring-2 focus:ring-[#34C759]/20 transition disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#34C759] to-emerald-500 text-[#0B0F19] font-bold py-3 rounded-xl hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {locale === 'bn' ? 'যাচাই করে সাইন ইন করুন' : 'Verify & sign in'}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendIn > 0}
                className="text-[#34C759] font-semibold hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendIn > 0
                  ? locale === 'bn'
                    ? `আবার পাঠান (${resendIn}s)`
                    : `Resend in ${resendIn}s`
                  : locale === 'bn'
                    ? 'কোড আবার পাঠান'
                    : 'Resend the code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingEmail(null);
                  setOtp('');
                  setDevCode(null);
                }}
                disabled={loading}
                className="text-gray-400 hover:text-white transition"
              >
                {locale === 'bn' ? 'অন্য ইমেইল ব্যবহার করুন' : 'Use a different email'}
              </button>
            </div>
          </form>
        ) : (
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

          {/* Account-type selector — three cards, always visible.
              CUSTOMER + EXPERT are honored by the server unconditionally.
              ADMIN is honored only when the server is started with
              ALLOW_SELF_SERVICE_ADMIN=true; otherwise the server silently
              downgrades an ADMIN claim to CUSTOMER and logs a warning. The
              landing-page routing reads the server's actual granted role. */}
          <div>
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1">
              {locale === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    value: 'CUSTOMER' as SignupRole,
                    label: locale === 'bn' ? 'গ্রাহক' : 'Customer',
                    hint: locale === 'bn' ? 'পরিষেবা বুক করুন' : 'Book services',
                    selectedClass:
                      'bg-[#34C759]/15 border-[#34C759]/60 text-white shadow-lg shadow-[#34C759]/10',
                    hoverClass: 'hover:border-[#34C759]/30',
                  },
                  {
                    value: 'EXPERT' as SignupRole,
                    label: locale === 'bn' ? 'বিশেষজ্ঞ' : 'Expert',
                    hint: locale === 'bn' ? 'পরিষেবা প্রদান করুন' : 'Offer services',
                    selectedClass:
                      'bg-cyan-500/15 border-cyan-400/60 text-white shadow-lg shadow-cyan-500/10',
                    hoverClass: 'hover:border-cyan-400/30',
                  },
                  {
                    value: 'ADMIN' as SignupRole,
                    label: locale === 'bn' ? 'অ্যাডমিন' : 'Admin',
                    hint:
                      locale === 'bn'
                        ? 'প্ল্যাটফর্ম অ্যাডমিন'
                        : 'Platform admin',
                    selectedClass:
                      'bg-amber-500/15 border-amber-500/60 text-white shadow-lg shadow-amber-500/10',
                    hoverClass: 'hover:border-amber-500/30',
                  },
                ]
              ).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={
                    'text-left rounded-xl border px-2.5 py-2 transition-all cursor-pointer ' +
                    (role === opt.value
                      ? opt.selectedClass
                      : 'bg-black/30 border-white/10 text-gray-300 ' + opt.hoverClass)
                  }
                >
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="block text-[11px] text-gray-400">{opt.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-gray-500 leading-snug">
              {locale === 'bn'
                ? 'নির্বাচিত ভূমিকা অনুযায়ী আপনাকে সংশ্লিষ্ট ড্যাশবোর্ডে পাঠানো হবে। অ্যাডমিন ড্যাশবোর্ড শুধুমাত্র সার্ভারে অনুমতি থাকলে প্রদান করা হয়।'
                : 'You will be routed to the dashboard that matches the role you select. Admin access is only granted when the server permits it.'}
            </p>
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
        )}

        {!pendingEmail && (
        <>
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