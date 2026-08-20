import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Calendar,
  User as UserIcon,
  BookOpen,
  Sparkles,
  Tag
} from 'lucide-react';
import { CmsBlogPost } from '../types';
import { ApiService } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Public Blog index — lists every blog post with category chips + search.
 * Clicking a card navigates to `/blog/:slug` for the full article.
 */
const Blog: React.FC = () => {
  const navigate = useNavigate();
  const { locale, formatDate } = useLanguage();

  const [blogs, setBlogs] = useState<CmsBlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, cats] = await Promise.all([
          ApiService.fetchBlogs(),
          ApiService.fetchBlogCategories(),
        ]);
        if (!cancelled) {
          setBlogs(list);
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
    return blogs.filter((b) => {
      if (activeCategory !== 'All' && b.category !== activeCategory) return false;
      if (!q) return true;
      return (
        (b.title || '').toLowerCase().includes(q) ||
        (b.excerpt || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q)
      );
    });
  }, [blogs, activeCategory, query]);

  const [hero, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#101A33] to-[#0F1A2E] text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/30 blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-violet-500/30 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-widest text-cyan-200">
            <BookOpen className="w-3.5 h-3.5" />
            withU Insights
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
            {locale === 'bn'
              ? 'বিশ্বস্ত সেবার গল্প ও গাইড'
              : 'Stories & guides from the withU community'}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300 text-base md:text-lg">
            {locale === 'bn'
              ? 'এসক্রো, পেমেন্ট, হজ্ব-উমরাহ ও বিশেষজ্ঞ যাচাই সংক্রান্ত প্রমাণিত নিবন্ধ।'
              : 'In-depth articles on escrow, payments, pilgrimage, and expert verification — written by the withU editorial team.'}
          </p>
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === 'bn' ? 'আর্টিকেল খুঁজুন…' : 'Search articles…'}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="max-w-6xl mx-auto px-6 -mt-6 relative z-10">
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

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-white border border-slate-200 animate-pulse"
                aria-busy
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">
              {locale === 'bn' ? 'কোনো আর্টিকেল পাওয়া যায়নি' : 'No articles match your filter'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {locale === 'bn'
                ? 'অন্য বিভাগ নির্বাচন করুন বা অনুসন্ধান পরিষ্কার করুন।'
                : 'Try a different category or clear the search box.'}
            </p>
          </div>
        ) : (
          <>
            {/* Hero post */}
            {hero && (
              <Link
                to={`/blog/${hero.slug}`}
                className="group block mb-10 rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                  <div className="lg:col-span-3 aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-100">
                    {hero.coverImage ? (
                      <img
                        src={hero.coverImage}
                        alt={hero.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30" />
                    )}
                  </div>
                  <div className="lg:col-span-2 p-7 flex flex-col justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-extrabold uppercase tracking-widest">
                        {hero.category}
                      </span>
                      <h2 className="mt-4 text-2xl font-extrabold text-slate-900 group-hover:text-cyan-700 transition leading-tight">
                        {hero.title}
                      </h2>
                      <p className="mt-3 text-sm text-slate-600 line-clamp-4">
                        {hero.excerpt}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" />
                          {hero.author}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(hero.publishedAt)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-cyan-700 font-bold">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of remaining posts */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/blog/${b.slug}`)}
                    className="group text-left bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition cursor-pointer flex flex-col"
                  >
                    <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                      {b.coverImage ? (
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-widest">
                        {b.category}
                      </span>
                      <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition leading-snug">
                        {b.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3">{b.excerpt}</p>
                      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(b.publishedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-cyan-700 font-bold">
                          {b.author.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Blog;