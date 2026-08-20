import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Tag,
  Globe
} from 'lucide-react';
import { CmsFaqItem } from '../types';
import { ApiService } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Public FAQ — categorised accordion with bilingual EN/BN toggle per row
 * and a search box that filters both question + answer text.
 */
const Faq: React.FC = () => {
  const { locale, setLocale } = useLanguage();
  const [faqs, setFaqs] = useState<CmsFaqItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, cats] = await Promise.all([
          ApiService.fetchFaqs(),
          ApiService.fetchFaqCategories(),
        ]);
        if (!cancelled) {
          setFaqs(list);
          setCategories(cats.length ? cats : ['All']);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      if (activeCategory !== 'All' && f.category !== activeCategory) return false;
      if (!q) return true;
      return (
        (f.questionEn || '').toLowerCase().includes(q) ||
        (f.questionBn || '').toLowerCase().includes(q) ||
        (f.answerEn || '').toLowerCase().includes(q) ||
        (f.answerBn || '').toLowerCase().includes(q)
      );
    });
  }, [faqs, activeCategory, query]);

  // Group by category for the accordion layout
  const grouped = useMemo(() => {
    const map = new Map<string, CmsFaqItem[]>();
    filtered.forEach((f) => {
      const list = map.get(f.category) || [];
      list.push(f);
      map.set(f.category, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#101A33] to-[#0F1A2E] text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-cyan-500/30 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-widest text-emerald-200">
            <HelpCircle className="w-3.5 h-3.5" />
            Help Centre
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
            {locale === 'bn' ? 'প্রায়শই জিজ্ঞাসিত প্রশ্ন' : 'Frequently Asked Questions'}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300 text-base md:text-lg">
            {locale === 'bn'
              ? 'এসক্রো, পেমেন্ট, বিশেষজ্ঞ যাচাই ও হজ্ব-উমরাহ সংক্রান্ত সাধারণ প্রশ্নের উত্তর।'
              : 'Answers to the most common questions about escrow, payments, expert verification, and Hajj/Umrah.'}
          </p>
          <div className="mt-8 flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={locale === 'bn' ? 'প্রশ্ন খুঁজুন…' : 'Search questions…'}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-200" />
              <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  locale === 'en' ? 'bg-white text-slate-900' : 'text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('bn')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  locale === 'bn' ? 'bg-white text-slate-900' : 'text-slate-300'
                }`}
              >
                বাং
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="max-w-5xl mx-auto px-6 -mt-6 relative z-10">
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <Tag className="w-3 h-3" />
            {locale === 'bn' ? 'বিভাগ' : 'Categories'}
          </span>
          {categories.map((c) => {
            const active = c === activeCategory;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      {/* FAQ body */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-2xl bg-white border border-slate-200 animate-pulse"
                aria-busy
              />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">
              {locale === 'bn' ? 'কোনো প্রশ্ন পাওয়া যায়নি' : 'No questions match your filter'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {locale === 'bn'
                ? 'অন্য বিভাগ নির্বাচন করুন বা অনুসন্ধান পরিষ্কার করুন।'
                : 'Try a different category or clear the search box.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3">
                  {category}
                </h2>
                <div className="space-y-2.5">
                  {items.map((f) => {
                    const open = openId === f.id;
                    const question = locale === 'bn' ? f.questionBn || f.questionEn : f.questionEn;
                    const answer = locale === 'bn' ? f.answerBn || f.answerEn : f.answerEn;
                    const otherAnswer =
                      locale === 'bn' ? f.answerEn : f.answerBn;
                    const showOther = Boolean(otherAnswer) && otherAnswer !== answer;
                    return (
                      <div
                        key={f.id}
                        className={`bg-white border rounded-2xl transition ${
                          open
                            ? 'border-emerald-300 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => setOpenId(open ? null : f.id)}
                          className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 cursor-pointer"
                          aria-expanded={open}
                        >
                          <span className="text-sm md:text-base font-bold text-slate-900">
                            {question}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                              open ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </button>
                        {open && (
                          <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                            <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
                            {showOther && (
                              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                                  {locale === 'bn' ? 'ইংরেজি' : 'English'}
                                </p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {otherAnswer}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Faq;