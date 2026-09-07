import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Edit3,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { CmsBlogPost, CmsFaqItem } from '../../types';
import { ApiService } from '../../services/api';

type Tab = 'BLOG' | 'FAQ';

interface BlogFormState {
  id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage: string;
  publishedAt: string;
}

const EMPTY_BLOG: BlogFormState = {
  title: '',
  slug: '',
  category: 'General',
  excerpt: '',
  content: '',
  author: 'withU Editorial Team',
  coverImage: '',
  publishedAt: new Date().toISOString().slice(0, 16),
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const CmsTab: React.FC = () => {
  const [tab, setTab] = useState<Tab>('BLOG');

  // ----- BLOG state -----
  const [blogs, setBlogs] = useState<CmsBlogPost[]>([]);
  const [blogCategories, setBlogCategories] = useState<string[]>(['All']);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategory, setBlogCategory] = useState<string>('All');
  const [blogForm, setBlogForm] = useState<BlogFormState | null>(null);
  const [blogSubmitting, setBlogSubmitting] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);

  // ----- FAQ state -----
  const [faqs, setFaqs] = useState<CmsFaqItem[]>([]);
  const [faqCategories, setFaqCategories] = useState<string[]>([
    'General',
    'Booking & Payment',
    'Escrow Protection',
    'Experts & Verification',
    'Hajj & Umrah',
  ]);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<string>('All');
  const [faqForm, setFaqForm] = useState<CmsFaqItem | null>(null);
  const [faqSubmitting, setFaqSubmitting] = useState(false);
  const [faqError, setFaqError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [b, bc, f, fc] = await Promise.all([
        ApiService.fetchBlogs(),
        ApiService.fetchBlogCategories(),
        ApiService.fetchFaqs(),
        ApiService.fetchFaqCategories(),
      ]);
      setBlogs(b);
      setBlogCategories(bc.length ? bc : ['All']);
      setFaqs(f);
      if (fc.length) setFaqCategories(fc);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ---------- BLOG handlers ----------
  const filteredBlogs = blogs.filter((b) => {
    if (blogCategory !== 'All' && b.category !== blogCategory) return false;
    const q = blogSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.excerpt || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q)
    );
  });

  const handleEditBlog = (b: CmsBlogPost) => {
    setBlogError(null);
    setBlogForm({
      id: b.id,
      title: b.title,
      slug: b.slug,
      category: b.category,
      excerpt: b.excerpt,
      content: b.content,
      author: b.author,
      coverImage: b.coverImage,
      publishedAt: b.publishedAt ? b.publishedAt.slice(0, 16) : '',
    });
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    const res = await ApiService.deleteBlog(id);
    if (res.success) {
      showToast('Blog post deleted');
      await refreshAll();
    } else {
      showToast(res.error || 'Delete failed');
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm) return;
    setBlogError(null);
    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      setBlogError('Title and content are required.');
      return;
    }
    setBlogSubmitting(true);
    try {
      const payload: Partial<CmsBlogPost> = {
        title: blogForm.title,
        slug: blogForm.slug || slugify(blogForm.title),
        category: blogForm.category || 'General',
        excerpt: blogForm.excerpt,
        content: blogForm.content,
        author: blogForm.author || 'withU Editorial Team',
        coverImage: blogForm.coverImage,
        publishedAt: blogForm.publishedAt
          ? new Date(blogForm.publishedAt).toISOString()
          : new Date().toISOString(),
      };
      const res = blogForm.id
        ? await ApiService.updateBlog(blogForm.id, payload)
        : await ApiService.createBlog(payload);
      if (!res.success) {
        setBlogError(res.error || 'Save failed');
        return;
      }
      showToast(blogForm.id ? 'Blog post updated' : 'Blog post created');
      setBlogForm(null);
      await refreshAll();
    } finally {
      setBlogSubmitting(false);
    }
  };

  // ---------- FAQ handlers ----------
  const filteredFaqs = faqs.filter((f) => {
    if (faqCategory !== 'All' && f.category !== faqCategory) return false;
    const q = faqSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (f.questionEn || '').toLowerCase().includes(q) ||
      (f.questionBn || '').toLowerCase().includes(q) ||
      (f.answerEn || '').toLowerCase().includes(q) ||
      (f.answerBn || '').toLowerCase().includes(q)
    );
  });

  const handleEditFaq = (f: CmsFaqItem) => {
    setFaqError(null);
    setFaqForm({ ...f });
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ entry?')) return;
    const res = await ApiService.deleteFaq(id);
    if (res.success) {
      showToast('FAQ deleted');
      await refreshAll();
    } else {
      showToast(res.error || 'Delete failed');
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm) return;
    setFaqError(null);
    if (!faqForm.questionEn.trim() || !faqForm.answerEn.trim()) {
      setFaqError('English question and answer are required.');
      return;
    }
    setFaqSubmitting(true);
    try {
      const res = faqForm.id.startsWith('faq-')
        ? await ApiService.updateFaq(faqForm.id, faqForm)
        : await ApiService.createFaq(faqForm);
      if (!res.success) {
        setFaqError(res.error || 'Save failed');
        return;
      }
      showToast(faqForm.id.startsWith('faq-') ? 'FAQ updated' : 'FAQ created');
      setFaqForm(null);
      await refreshAll();
    } finally {
      setFaqSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-cyan-900 to-blue-900 rounded-3xl p-7 text-white shadow-xl flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-cyan-300" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase font-bold tracking-widest text-cyan-200 mb-1">
            Content Management
          </p>
          <h3 className="text-2xl font-extrabold mb-2">Blog & FAQ Engine</h3>
          <p className="text-cyan-100 text-sm max-w-3xl">
            Create, edit, and publish marketing blog posts and bilingual FAQ entries. Blog
            posts appear at <code className="px-1.5 py-0.5 rounded bg-white/10">/blog</code>{' '}
            and FAQs at <code className="px-1.5 py-0.5 rounded bg-white/10">/faq</code>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setTab('BLOG')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition ${
            tab === 'BLOG' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Blog Posts ({blogs.length})
        </button>
        <button
          onClick={() => setTab('FAQ')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition ${
            tab === 'FAQ' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          FAQ ({faqs.length})
        </button>
      </div>

      {tab === 'BLOG' && (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold ">Blog Posts</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <select
                value={blogCategory}
                onChange={(e) => setBlogCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
              >
                {blogCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setBlogError(null);
                  setBlogForm({ ...EMPTY_BLOG });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Post
              </button>
            </div>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No blog posts match your filters yet. Click <strong>New Post</strong> to create
              one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredBlogs.map((b) => (
                <div
                  key={b.id}
                  className="p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  {b.coverImage && (
                    <img
                      src={b.coverImage}
                      alt=""
                      className="w-20 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
                      {b.category}
                    </p>
                    <h4 className="font-bold  truncate">{b.title}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      /{b.slug} · {b.author}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditBlog(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(b.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'FAQ' && (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold ">FAQ Entries</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <select
                value={faqCategory}
                onChange={(e) => setFaqCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
              >
                <option value="All">All</option>
                {faqCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setFaqError(null);
                  setFaqForm({
                    id: `faq-new-${Date.now()}`,
                    category: 'General',
                    questionEn: '',
                    questionBn: '',
                    answerEn: '',
                    answerBn: '',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New FAQ
              </button>
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No FAQ entries match your filters yet. Click <strong>New FAQ</strong> to add
              one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFaqs.map((f) => (
                <div key={f.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
                        {f.category}
                      </p>
                      <h4 className="font-bold ">{f.questionEn}</h4>
                      {f.questionBn && (
                        <p className="text-xs text-gray-500 mt-0.5">{f.questionBn}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {f.answerEn}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditFaq(f)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(f.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BLOG form modal */}
      {blogForm && (
        <Modal title={blogForm.id ? 'Edit Blog Post' : 'New Blog Post'} onClose={() => setBlogForm(null)}>
          <form onSubmit={handleSaveBlog} className="space-y-4">
            <Field label="Title" required>
              <input
                value={blogForm.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setBlogForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          title: v,
                          slug: prev.slug && prev.slug !== slugify(prev.title)
                            ? prev.slug
                            : slugify(v),
                        }
                      : prev,
                  );
                }}
                className="input"
                placeholder="Why Escrow Transforms Service Quality"
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="URL Slug">
                <input
                  value={blogForm.slug}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, slug: slugify(e.target.value) })
                  }
                  className="input font-mono"
                  placeholder="auto-generated from title"
                />
              </Field>
              <Field label="Category">
                <input
                  value={blogForm.category}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, category: e.target.value })
                  }
                  className="input"
                  placeholder="General"
                />
              </Field>
            </div>
            <Field label="Excerpt" hint={`${blogForm.excerpt.length}/500 chars`}>
              <textarea
                value={blogForm.excerpt}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, excerpt: e.target.value.slice(0, 500) })
                }
                rows={2}
                className="input"
                placeholder="One-paragraph summary shown on the index page."
              />
            </Field>
            <Field label="Cover Image URL">
              <input
                value={blogForm.coverImage}
                onChange={(e) => setBlogForm({ ...blogForm, coverImage: e.target.value })}
                className="input"
                placeholder="https://images.unsplash.com/…"
              />
            </Field>
            <Field label="Content" required>
              <textarea
                value={blogForm.content}
                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                rows={8}
                className="input"
                placeholder="Full article body. Use blank lines for paragraph breaks."
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Author">
                <input
                  value={blogForm.author}
                  onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Published At">
                <input
                  type="datetime-local"
                  value={blogForm.publishedAt}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, publishedAt: e.target.value })
                  }
                  className="input"
                />
              </Field>
            </div>
            {blogError && (
              <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {blogError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlogForm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={blogSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer disabled:opacity-60"
              >
                {blogSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {blogForm.id ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* FAQ form modal */}
      {faqForm && (
        <Modal
          title={faqForm.id.startsWith('faq-') && faqs.some((f) => f.id === faqForm.id) ? 'Edit FAQ' : 'New FAQ'}
          onClose={() => setFaqForm(null)}
        >
          <form onSubmit={handleSaveFaq} className="space-y-4">
            <Field label="Category">
              <select
                value={faqForm.category}
                onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                className="input"
              >
                {faqCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Question (English)" required>
                <textarea
                  value={faqForm.questionEn}
                  onChange={(e) =>
                    setFaqForm({ ...faqForm, questionEn: e.target.value })
                  }
                  rows={2}
                  className="input"
                />
              </Field>
              <Field label="Question (বাংলা)">
                <textarea
                  value={faqForm.questionBn}
                  onChange={(e) =>
                    setFaqForm({ ...faqForm, questionBn: e.target.value })
                  }
                  rows={2}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Answer (English)" required>
              <textarea
                value={faqForm.answerEn}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, answerEn: e.target.value })
                }
                rows={4}
                className="input"
              />
            </Field>
            <Field label="Answer (বাংলা)">
              <textarea
                value={faqForm.answerBn}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, answerBn: e.target.value })
                }
                rows={4}
                className="input"
              />
            </Field>
            {faqError && (
              <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {faqError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFaqForm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={faqSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer disabled:opacity-60"
              >
                {faqSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {faqs.some((f) => f.id === faqForm.id) ? 'Update FAQ' : 'Publish FAQ'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

// ---------- Inline sub-components ----------

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <label className="block">
    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
      {label}
      {required && <span className="text-rose-600 ml-1">*</span>}
      {hint && <span className="ml-2 text-slate-400 normal-case font-medium tracking-normal">{hint}</span>}
    </span>
    {children}
  </label>
);

export default CmsTab;
