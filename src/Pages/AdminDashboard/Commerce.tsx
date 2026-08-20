import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  FileText,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../components/common/Toast';
import { MoneyValue } from '../../components/common/MoneyValue';
import type { CommerceProduct } from '../../types';

interface ProductFormState {
  id?: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
  priceBDT: number;
  productType: 'COURSE' | 'TOOL' | 'BOOK';
  category: string;
  description: string;
  lessonsCount: number;
  durationHours: number;
  courseLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  outcomes: string;
}

const EMPTY_FORM: ProductFormState = {
  title: '',
  authorName: 'withU Verified Author',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80',
  priceBDT: 0,
  productType: 'COURSE',
  category: 'Engineering',
  description: '',
  lessonsCount: 0,
  durationHours: 0,
  courseLevel: 'BEGINNER',
  language: 'English',
  outcomes: '',
};

type CategoryFilter = 'ALL' | 'COURSE' | 'TOOL' | 'BOOK';

/**
 * F19 — Admin Dashboard → Commerce tab.
 *
 * Admin CRUD for the commerce product catalog. Create, edit, and
 * archive Courses, Tools, and Books from a single screen.
 */
export const AdminCommerceTab: React.FC = () => {
  const { locale, formatBDT } = useLanguage();
  const { showToast } = useToast();

  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('ALL');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CommerceProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ApiService.fetchCommerceProducts({ category: filter });
      setProducts(list);

      // Enrollments — pull all through the admin scope (server ignores userId).
      const allEnrollments: any[] = [];
      // We approximate by polling for each product author; for the prototype,
      // it's enough to show local enrollments count placeholder.
      setEnrollments(allEnrollments);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) =>
      [p.title, p.authorName, p.category, p.description]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle)),
    );
  }, [products, q]);

  // -------- Form helpers --------------------------------------------------
  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setCreating(true);
  }, []);

  const openEdit = useCallback((p: CommerceProduct) => {
    setEditing(p);
    setForm({
      id: p.id,
      title: p.title,
      authorName: p.authorName,
      thumbnailUrl: p.thumbnailUrl,
      priceBDT: p.priceBDT,
      productType: p.productType,
      category: p.category,
      description: p.description,
      lessonsCount: p.lessonsCount || 0,
      durationHours: p.durationHours || 0,
      courseLevel: p.courseLevel || 'BEGINNER',
      language: p.language || 'English',
      outcomes: (p.outcomes || []).join('\n'),
    });
  }, []);

  const closeForm = useCallback(() => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_FORM);
  }, []);

  const submitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (pending) return;
      if (!form.title.trim() || form.priceBDT < 0) {
        showToast('Title and valid price are required', 'error');
        return;
      }
      setPending(true);
      const payload: Partial<CommerceProduct> = {
        title: form.title.trim(),
        authorName: form.authorName.trim() || 'withU Verified Author',
        thumbnailUrl: form.thumbnailUrl.trim(),
        priceBDT: Number(form.priceBDT) || 0,
        productType: form.productType,
        category: form.category.trim() || 'General',
        description: form.description.trim(),
        lessonsCount: Number(form.lessonsCount) || 0,
        durationHours: Number(form.durationHours) || 0,
        courseLevel: form.courseLevel,
        language: form.language.trim() || 'English',
        outcomes: form.outcomes
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = editing
        ? await ApiService.adminUpdateProduct(editing.id, payload)
        : await ApiService.adminCreateProduct(payload);

      setPending(false);
      if (!res.success) {
        showToast(res.error || 'Save failed', 'error');
        return;
      }
      showToast(
        editing
          ? locale === 'bn'
            ? 'পণ্য আপডেট হয়েছে।'
            : 'Product updated.'
          : locale === 'bn'
            ? 'পণ্য তৈরি হয়েছে।'
            : 'Product created.',
        'success',
      );
      closeForm();
      await load();
    },
    [pending, form, editing, showToast, locale, closeForm, load],
  );

  const handleDelete = useCallback(
    async (p: CommerceProduct) => {
      if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
      const res = await ApiService.adminDeleteProduct(p.id);
      if (!res.success) {
        showToast(res.error || 'Delete failed', 'error');
        return;
      }
      showToast(locale === 'bn' ? 'মুছে ফেলা হয়েছে।' : 'Product deleted.', 'success');
      await load();
    },
    [showToast, locale, load],
  );

  // =========================================================================
  //  Render
  // =========================================================================
  return (
    <div className="space-y-4">
      <header className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              {locale === 'bn' ? 'কমার্স ও কোর্স' : 'Commerce & Courses'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {locale === 'bn'
                ? 'কোর্স, টুল ও বইয়ের ক্যাটালগ পরিচালনা করুন।'
                : 'Manage the catalog of courses, tools, and books offered to learners.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              {locale === 'bn' ? 'নতুন পণ্য' : 'New product'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <div className="flex items-center gap-1 px-1 py-1 bg-gray-100 rounded-xl">
            {(['ALL', 'COURSE', 'TOOL', 'BOOK'] as CategoryFilter[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                  filter === c
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-45 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                locale === 'bn'
                  ? 'শিরোনাম, লেখক, বিভাগ…'
                  : 'Title, author, category…'
              }
              className="bg-transparent text-xs outline-none flex-1"
            />
          </div>
          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {filtered.length} / {products.length}
          </span>
        </div>
      </header>

      {loading && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#34C759]" />
          <p className="text-xs">
            {locale === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'}
          </p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center text-xs text-gray-500">
          {locale === 'bn'
            ? 'কোনো পণ্য নেই।'
            : 'No products match the current filters.'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="bg-white border border-[#E5E7EB] hover:border-emerald-300 rounded-2xl overflow-hidden shadow-xs flex"
            >
              <img
                src={p.thumbnailUrl}
                alt={p.title}
                className="w-24 h-full object-cover bg-gray-100 hidden sm:block"
              />
              <div className="flex-1 p-4 space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {p.productType}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {p.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-[11px] text-gray-500 truncate">
                  {p.authorName}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>
                    {p.lessonsCount} {locale === 'bn' ? 'লেসন' : 'lessons'} ·{' '}
                    {p.durationHours}h
                  </span>
                  <MoneyValue
                    amount={p.priceBDT}
                    className="font-bold text-gray-900"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit3 className="w-3 h-3" />
                    {locale === 'bn' ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit / Create modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                {editing
                  ? locale === 'bn'
                    ? 'পণ্য সম্পাদনা'
                    : 'Edit product'
                  : locale === 'bn'
                    ? 'নতুন পণ্য'
                    : 'New product'}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'শিরোনাম' : 'Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'লেখক' : 'Author'}
                  </label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={(e) =>
                      setForm({ ...form, authorName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {locale === 'bn' ? 'ছবির URL' : 'Thumbnail URL'}
                </label>
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm({ ...form, thumbnailUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {locale === 'bn' ? 'বিবরণ' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'ধরন' : 'Type'}
                  </label>
                  <select
                    value={form.productType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        productType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                  >
                    <option value="COURSE">COURSE</option>
                    <option value="TOOL">TOOL</option>
                    <option value="BOOK">BOOK</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'বিভাগ' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'মূল্য (৳)' : 'Price (BDT)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.priceBDT}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceBDT: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'লেসন সংখ্যা' : 'Lesson count'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.lessonsCount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lessonsCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'সময়কাল (ঘণ্টা)' : 'Duration (hours)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.durationHours}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationHours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'স্তর' : 'Level'}
                  </label>
                  <select
                    value={form.courseLevel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        courseLevel: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {locale === 'bn' ? 'ভাষা' : 'Language'}
                  </label>
                  <input
                    type="text"
                    value={form.language}
                    onChange={(e) =>
                      setForm({ ...form, language: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {locale === 'bn'
                    ? 'শেখার ফলাফল (একটি প্রতি লাইনে)'
                    : 'Learning outcomes (one per line)'}
                </label>
                <textarea
                  rows={3}
                  value={form.outcomes}
                  onChange={(e) =>
                    setForm({ ...form, outcomes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 resize-none"
                  placeholder="e.g.&#10;Build production-grade MERN apps&#10;Implement escrow & SSLCommerz flows"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {pending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editing
                    ? locale === 'bn'
                      ? 'আপডেট করুন'
                      : 'Save changes'
                    : locale === 'bn'
                      ? 'তৈরি করুন'
                      : 'Create product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommerceTab;
