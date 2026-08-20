import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Tag,
  Share2,
  Sparkles
} from 'lucide-react';
import { CmsBlogPost } from '../types';
import { ApiService } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Public Blog detail — full article view. Resolves a post by `:slug`,
 * shows cover + content + related posts from the same category.
 */
const BlogPost: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { locale, formatDate } = useLanguage();

  const [post, setPost] = useState<CmsBlogPost | null>(null);
  const [related, setRelated] = useState<CmsBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const found = await ApiService.fetchBlogBySlug(slug);
      if (cancelled) return;
      if (!found) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(found);
      const all = await ApiService.fetchBlogs({ category: found.category });
      if (!cancelled) {
        setRelated(all.filter((b) => b.id !== found.id).slice(0, 3));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: post?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled share */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-slate-900">
            {locale === 'bn' ? 'আর্টিকেল পাওয়া যায়নি' : 'Article not found'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {locale === 'bn'
              ? '�ই লিংকটি আর বিদ্যমান নে� বা মুছে ফেলা হয়েছে।'
              : 'The link may have changed or the article was removed.'}
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> {locale === 'bn' ? 'ব্লগে ফিরে যান' : 'Back to blog'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <article className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {locale === 'bn' ? 'সব আর্টিকেল' : 'All articles'}
        </button>

        <header className="mt-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-extrabold uppercase tracking-widest">
            <Tag className="w-3 h-3" />
            {post.category}
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                {post.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.publishedAt)}
              </span>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied
                ? locale === 'bn'
                  ? 'লিংক কপি হয়েছে'
                  : 'Link copied'
                : locale === 'bn'
                  ? 'শেয়ার'
                  : 'Share'}
            </button>
          </div>
        </header>

        {post.coverImage && (
          <div className="mt-8 rounded-3xl overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-100">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-slate mt-10 max-w-none">
          {post.content.split(/\n\n+/).map((para, i) => (
            <p
              key={i}
              className="text-base text-slate-700 leading-relaxed mb-5 first-letter:text-slate-900"
            >
              {para}
            </p>
          ))}
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-200">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === 'bn' ? 'ব্লগে ফিরে যান' : 'Back to blog'}
          </Link>
        </footer>
      </article>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="text-xl font-extrabold text-slate-900 mb-5">
            {locale === 'bn' ? 'সম্পর্কিত আর্টিকেল' : 'Related articles'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((b) => (
              <Link
                key={b.id}
                to={`/blog/${b.slug}`}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col"
              >
                <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                  {b.coverImage && (
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
                    {b.category}
                  </p>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-cyan-700 line-clamp-2">
                    {b.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPost;