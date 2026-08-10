import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  FolderPlus,
  Tag,
  Clock,
  ArrowRight,
  Sparkles,
  Link2,
  AlertCircle
} from 'lucide-react';
import { Article, ArticleCategory, ArticleTag, ArticleStatus, Question } from '../types';
import { apiService } from '../services/api';

interface ArticleAdminViewProps {
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const ArticleAdminView: React.FC<ArticleAdminViewProps> = ({
  onClose,
  onShowToast,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [tags, setTags] = useState<ArticleTag[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'All' | 'Draft' | 'Published'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [status, setStatus] = useState<ArticleStatus>(ArticleStatus.Published);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Quick Add Category / Tag modals
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  const [newTagName, setNewTagName] = useState('');
  const [showAddTagModal, setShowAddTagModal] = useState(false);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [artRes, catList, tagList, qRes] = await Promise.all([
        apiService.getArticles({ includeDrafts: true, pageSize: 50 }),
        apiService.getArticleCategories(),
        apiService.getArticleTags(),
        apiService.getQuestions(),
      ]);
      setArticles(artRes.data);
      setCategories(catList);
      setTags(tagList);
      setQuestions(qRes.questions || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
      onShowToast?.('خطا در بارگذاری اطلاعات مقالات.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSummary('');
    setContent('');
    setCoverImageUrl('https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80');
    setCoverImageAlt('');
    setCategoryId(categories[0]?.id || 1);
    setSelectedTagIds([]);
    setSelectedQuestionIds([]);
    setStatus(ArticleStatus.Published);
    setMetaTitle('');
    setMetaDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSummary(article.summary);
    setContent(article.content);
    setCoverImageUrl(article.coverImageUrl || '');
    setCoverImageAlt(article.coverImageAlt || '');
    setCategoryId(article.categoryId);
    setSelectedTagIds(article.tags?.map((t) => t.id) || []);
    setSelectedQuestionIds(article.relatedQuestionIds || []);
    setStatus(article.status);
    setMetaTitle(article.metaTitle || '');
    setMetaDescription(article.metaDescription || '');
    setIsModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      onShowToast?.('لطفاً عنوان، خلاصه و بدنه مقاله را تکمیل نمایید.', 'error');
      return;
    }

    try {
      const payload = {
        title,
        summary,
        content,
        coverImageUrl,
        coverImageAlt: coverImageAlt || title,
        categoryId,
        tagIds: selectedTagIds,
        relatedQuestionIds: selectedQuestionIds,
        status,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || summary,
      };

      if (editingArticle) {
        await apiService.updateArticle(editingArticle.id, payload);
        onShowToast?.('مقاله با موفقیت بروزرسانی شد.', 'success');
      } else {
        await apiService.createArticle(payload);
        onShowToast?.('مقاله جدید با موفقیت ایجاد گردید.', 'success');
      }

      setIsModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      onShowToast?.(err.message || 'خطا در ثبت مقاله.', 'error');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('آیا از حذف این مقاله اطمینان دارید؟')) return;
    try {
      await apiService.deleteArticle(id);
      onShowToast?.('مقاله با موفقیت حذف گردید.', 'success');
      loadAdminData();
    } catch (err) {
      onShowToast?.('خطا در حذف مقاله.', 'error');
    }
  };

  const handleToggleStatus = async (article: Article) => {
    const nextStatus = article.status === ArticleStatus.Published ? ArticleStatus.Draft : ArticleStatus.Published;
    try {
      await apiService.updateArticleStatus(article.id, nextStatus);
      onShowToast?.(`وضعیت مقاله به ${nextStatus === ArticleStatus.Published ? 'منتشرشده' : 'پیش‌نویس'} تغییر یافت.`, 'success');
      loadAdminData();
    } catch (err) {
      onShowToast?.('خطا در تغییر وضعیت.', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await apiService.createArticleCategory({ name: newCatName, description: newCatDesc });
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.id);
      setNewCatName('');
      setNewCatDesc('');
      setShowAddCatModal(false);
      onShowToast?.('دسته جدید ایجاد شد.', 'success');
    } catch (err) {
      onShowToast?.('خطا در ایجاد دسته.', 'error');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const created = await apiService.createArticleTag({ name: newTagName });
      setTags((prev) => [...prev, created]);
      setSelectedTagIds((prev) => [...prev, created.id]);
      setNewTagName('');
      setShowAddTagModal(false);
      onShowToast?.('تگ جدید ایجاد شد.', 'success');
    } catch (err) {
      onShowToast?.('خطا در ایجاد تگ.', 'error');
    }
  };

  const insertHtmlTag = (tagOpen: string, tagClose: string) => {
    setContent((prev) => prev + `${tagOpen}متن جدید${tagClose}`);
  };

  // Filtered Articles List
  const filteredArticles = articles.filter((a) => {
    if (activeTab === 'Draft' && a.status !== ArticleStatus.Draft) return false;
    if (activeTab === 'Published' && a.status !== ArticleStatus.Published) return false;
    if (searchQuery.trim()) {
      return a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <ArrowRight className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900">پنل مدیریت و تحریریه مقالات سوال‌کار</h1>
          </div>
          <p className="text-xs text-slate-500 pr-7">
            تولید و مدیریت محتوای سئومحور جهت جذب ترافیک ارگانیک و تقویت شبکه لینک‌دهی داخلی
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          نگارش مقاله جدید
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'All' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('Published')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'Published' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            منتشرشده ({articles.filter((a) => a.status === ArticleStatus.Published).length})
          </button>
          <button
            onClick={() => setActiveTab('Draft')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'Draft' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            پیش‌نویس ({articles.filter((a) => a.status === ArticleStatus.Draft).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در پنل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">در حال دریافت لیست مقالات...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">هیچ مقاله‌ای یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th className="p-4">عنوان مقاله</th>
                  <th className="p-4">دسته</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">زمان مطالعه</th>
                  <th className="p-4">بازدید</th>
                  <th className="p-4">تاریخ انتشار</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px]">
                        {article.category?.name || 'عمومی'}
                      </span>
                    </td>
                    <td className="p-4">
                      {article.status === ArticleStatus.Published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                          <CheckCircle className="w-3 h-3" /> منتشرشده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold">
                          <Clock className="w-3 h-3" /> پیش‌نویس
                        </span>
                      )}
                    </td>
                    <td className="p-4">{article.readingTimeMinutes} دقیقه</td>
                    <td className="p-4 font-mono">{article.viewCount}</td>
                    <td className="p-4 text-slate-500">
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(article)}
                          title="تغییر وضعیت"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                        >
                          {article.status === ArticleStatus.Published ? (
                            <XCircle className="w-4 h-4 text-amber-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(article)}
                          title="ویرایش"
                          className="p-1.5 hover:bg-slate-100 text-sky-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          title="حذف"
                          className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ARTICLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingArticle ? 'ویرایش مقاله' : 'نگارش و انتشار مقاله جدید'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-6">
              {/* Title + Slug preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">عنوان مقاله (الزامی)</label>
                  <span className="text-[10px] text-slate-400">{title.length} / ۲۰۰ کاراکتر</span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  required
                  placeholder="مثال: علل اصلی لرزش فرمان خودرو در سرعت بالا"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">خلاصه مقاله / Meta Description (الزامی)</label>
                  <span className="text-[10px] text-slate-400">{summary.length} / ۳۰۰ کاراکتر</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={300}
                  required
                  placeholder="خلاصه‌ای جذاب شامل کلمات کلیدی برای نمایش در گوگل و لید کارت..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Content Formatting Toolbar & Textarea */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl">
                  <span className="text-xs font-bold text-slate-700 pr-2">بدنه مقاله (HTML)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<h2>', '</h2>')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<h3>', '</h3>')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<ul><li>', '</li></ul>')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      لیست
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<blockquote>', '</blockquote>')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      نقل‌قول
                    </button>
                  </div>
                </div>
                <textarea
                  rows={10}
                  required
                  placeholder="بدنه اصلی مقاله را با ساختار تگ‌های h2، h3 و ul بنویسید..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              {/* Category & Cover Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">دسته‌بندی مقاله</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(true)}
                      className="text-[11px] text-sky-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> جدید
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800">آدرس تصویر کاور (URL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Tags Multi Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">تگ‌های مقاله</label>
                  <button
                    type="button"
                    onClick={() => setShowAddTagModal(true)}
                    className="text-[11px] text-sky-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> افزودن تگ
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => {
                          setSelectedTagIds((prev) =>
                            isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                          );
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isSelected ? 'bg-sky-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Internal Linking Picker: Related Questions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Link2 className="w-4 h-4 text-sky-700" />
                  انتخاب سوالات مرتبط جهت لینک‌دهی داخلی (Internal Linking)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {questions.map((q) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestionIds((prev) => [...prev, q.id]);
                            } else {
                              setSelectedQuestionIds((prev) => prev.filter((id) => id !== q.id));
                            }
                          }}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="truncate">
                          [{q.carBrand}] {q.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">وضعیت مقاله</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value={ArticleStatus.Published}>منتشرشده در سایت (Public)</option>
                  <option value={ArticleStatus.Draft}>پیش‌نویس (Draft)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  ذخیره و انتشار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900">افزودن دسته جدید</h3>
            <input
              type="text"
              placeholder="نام دسته (مثال: سیستم ترمز)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-1.5 bg-sky-700 text-white text-xs font-bold rounded-xl"
              >
                ثبت دسته
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD TAG MODAL */}
      {showAddTagModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900">افزودن تگ جدید</h3>
            <input
              type="text"
              placeholder="نام تگ (مثال: دنا توربو)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTagModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-1.5 bg-sky-700 text-white text-xs font-bold rounded-xl"
              >
                ثبت تگ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
