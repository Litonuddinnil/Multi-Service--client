import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface FooterProps {
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { locale, t } = useLanguage();

  return (
    <footer className="bg-[#111827] text-white border-t border-gray-800">
      {/* Escrow & Trust Highlight Bar */}
      <div className="border-b border-gray-800 bg-[#1F2937]/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 border border-[#34C759]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#34C759]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{t('escrowGuarantee')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {locale === 'bn' 
                    ? 'আপনার অর্থ মাইলস্টোন বা সেশন সম্পন্ন না হওয়া পর্যন্ত সুরক্ষিত থাকে।'
                    : 'Funds held in trust until service or milestone delivery is verified.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {locale === 'bn' ? 'ভেরিফাইড লাইসেন্স ও সনদ' : 'BMDC & Board Verified'}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {locale === 'bn'
                    ? 'ডাক্তার, প্রকৌশলী, আইনজীবী ও ট্রাভেল এজেন্সির আনুষ্ঠানিক লাইসেন্স যাচাইকৃত।'
                    : 'Every expert is validated via official regulatory boards.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {locale === 'bn' ? 'লোকাল পেমেন্ট গেটওয়ে' : 'bKash, Nagad & Cards'}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {locale === 'bn'
                    ? 'বিকাশ, নগদ, রকেট ও ভিসা/মাস্টারকার্ডের মাধ্যমে তাত্ক্ষণিক সুরক্ষিত পেমেন্ট।'
                    : 'Instant, transparent BDT payments with zero hidden fees.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-emerald-400/40 shadow-sm shadow-emerald-500/20 flex items-center justify-center">
                <img
                  src="/src/images/logo.jpeg"
                  alt="withU logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                with<span className="text-[#34C759]">U</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              {locale === 'bn'
                ? 'উইথইউ বাংলাদেশের শীর্ষস্থানীয় মাল্টি-ভেন্ডার সার্ভিস মার্কেটপ্লেস—স্বাস্থ্যসেবা, ইঞ্জিনিয়ারিং, সফটওয়্যার, হজ-ওমরাহ এবং আইনি পরামর্শে বিশ্বস্ত সেবা।'
                : 'Bangladesh’s premier multi-vendor expert service marketplace. Trusted consultations, milestone contracts, and pilgrimage journeys under escrow security.'}
            </p>

            <div className="pt-2">
              <span className="text-xs font-semibold text-gray-300 block mb-2">Supported Payment Gateways</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-[#E2136E]/20 text-[#E2136E] text-xs font-bold rounded border border-[#E2136E]/40">bKash</span>
                <span className="px-2.5 py-1 bg-[#F7941D]/20 text-[#F7941D] text-xs font-bold rounded border border-[#F7941D]/40">Nagad</span>
                <span className="px-2.5 py-1 bg-[#8B2D88]/20 text-[#be4dc0] text-xs font-bold rounded border border-[#8B2D88]/40">Rocket</span>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/40">Visa / MC</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">{t('categories')}</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <button onClick={() => onNavigate('catalog', { categoryId: 'cat-healthcare' })} className="hover:text-white transition-colors">
                  Healthcare & Telemedicine
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoryId: 'cat-engineering' })} className="hover:text-white transition-colors">
                  Engineering & Structural Design
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoryId: 'cat-it' })} className="hover:text-white transition-colors">
                  IT & Full-Stack Development
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoryId: 'cat-hajj' })} className="hover:text-white transition-colors">
                  Hajj & Umrah Packages
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoryId: 'cat-legal' })} className="hover:text-white transition-colors">
                  Legal & Company Registration
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">{t('quickLinks')}</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  {t('allServices')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('commerce')} className="hover:text-white transition-colors">
                  {t('storeProducts')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('customer')} className="hover:text-white transition-colors">
                  {t('myAccount')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('expert')} className="hover:text-white transition-colors">
                  {t('expertPortal')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
                  {t('adminDashboard')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Emergency Notice */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Contact & Support</h5>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#34C759]" />
                <span>support@withu.com.bd</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#34C759]" />
                <span>+880 9612-000000</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#34C759] shrink-0 mt-0.5" />
                <span>Gulshan-2, Dhaka 1212, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Medical and Legal Disclaimer */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex items-start gap-3 text-[11px] text-gray-500 bg-gray-900/40 p-4 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> withU is a digital technology platform facilitating professional connections. In medical emergencies, please immediately visit the nearest hospital or call national emergency 999. Video medical consultations are intended for non-emergency guidance and follow-ups.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} withU Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Escrow Trust Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
