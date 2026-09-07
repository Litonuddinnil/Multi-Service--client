import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../components/common/Toast';
import { PdfService } from '../../services/pdfService';
import type { CommerceCertificate } from '../../types';

/**
 * F19 — Customer Dashboard → Certificates tab.
 *
 * Lists every certificate the logged-in customer has earned. Each
 * row can be opened as a PDF (via PdfService.generateCertificatePdf)
 * or clicked through to the program's verification URL.
 */
export const CustomerCertificatesTab: React.FC = () => {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [certs, setCerts] = useState<CommerceCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await ApiService.getMyCertificates(user.id);
      setCerts(list as CommerceCertificate[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = useCallback(
    (cert: CommerceCertificate) => {
      try {
        PdfService.generateCertificatePdf(cert, user, undefined);
      } catch (e: any) {
        showToast(e?.message || 'PDF generation failed', 'error');
      }
    },
    [user, showToast],
  );

  const empty = !loading && certs.length === 0;

  return (
    <div className="space-y-4">
      <header className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <h2 className="text-base font-bold ">
          {locale === 'bn' ? 'আমার সার্টিফিকেট' : 'My Certificates'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {locale === 'bn'
            ? 'যেসব কোর্স, টুল বা বই আপনি ১০০% সম্পন্ন করেছেন তার ডিজিটাল সার্টিফিকেট।'
            : 'Digital certificates for every course, tool, or book you have completed to 100%.'}
        </p>
      </header>

      {loading && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#34C759]" />
          <p className="text-xs">
            {locale === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'}
          </p>
        </div>
      )}

      {empty && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center space-y-3">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold ">
            {locale === 'bn'
              ? 'এখনও কোনো সার্টিফিকেট নেই'
              : 'No certificates yet'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {locale === 'bn'
              ? 'ক্যাটালগে একটি কোর্স কিনুন এবং সব লেসন সম্পন্ন করে সার্টিফিকেট অর্জন করুন।'
              : 'Enroll in a course from the catalog and complete every lesson to earn a verified certificate.'}
          </p>
          <Link
            to="/commerce"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            {locale === 'bn' ? 'ক্যাটালগ দেখুন' : 'Browse catalog'}
          </Link>
        </div>
      )}

      {!empty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((c) => (
            <article
              key={c.id}
              className="bg-white border border-[#E5E7EB] hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-amber-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {c.productType}
                  </span>
                  <h3 className="text-sm font-bold  mt-1 line-clamp-2">
                    {c.productTitle}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {locale === 'bn' ? 'প্রদান' : 'Issued'}{' '}
                    {new Date(c.issuedAt).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-gray-500">
                  <span>{locale === 'bn' ? 'সার্ট নং' : 'Cert №'}</span>
                  <span className="font-mono font-bold ">
                    {c.serial}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>{locale === 'bn' ? 'ভেরিফিকেশন' : 'Verification'}</span>
                  <span className="font-mono font-bold  truncate ml-2 max-w-50">
                    {c.verificationCode || c.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(c)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  <Download className="w-3.5 h-3.5" />
                  {locale === 'bn' ? 'পিডিএফ' : 'Download PDF'}
                </button>
                <a
                  href={c.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
                  title="Open verification page"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerCertificatesTab;
