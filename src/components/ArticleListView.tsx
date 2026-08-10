import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Folder, Tag as TagIcon, Sparkles, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { Article, ArticleCategory, ArticleTag, User, UserRole } from '../types';
import { apiService } from '../services/api';
import { ArticleCard } from './ArticleCard';
import { useDocumentHead } from '../hooks/useDocumentHead';

interface ArticleListViewProps {
  currentUser: User | null;
  onSelectArticle: (slug: string) => void;
  onOpenAdminPanel?: () => void;
}

export const ArticleListView: React.FC<ArticleListViewProps> = ({
  currentUser,
  onSelectArticle,
  onOpenAdminPanel,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [tags, setTags] = useState<ArticleTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'newest' | 'most_viewed'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 9;

  // SEO
  useDocumentHead({
    title: 'مجله تخصصی خودرو و راهنمای نگهداری | سوال‌کار',
    description: 'مقالات تخصصی عیب‌یابی، آموزش نگهداری خودرو، راهنمای خرید قطعات و بررسی سیستم‌های برقی و مکانیکی خودروهای ایرانی و وارداتی.',
    canonicalUrl: 'https://soalcar.ir/articles',
  });

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedTag, sortOption, currentPage]);

  const fetchCategoriesAndTags = async () => {
    try {
      const [catList, tagList] = await Promise.all([
        apiService.getArticleCategories(),
        apiService.getArticleTags(),
      ]);
      setCategories(catList);
      setTags(tagList);
    } catch (err) {
      console.error('Failed to load categories/tags:', err);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await apiService.getArticles({
        categorySlug: selectedCategory || undefined,
        tagSlug: selectedTag || undefined,
        search: searchQuery || undefined,
        sort: sortOption,
        page: currentPage,
        pageSize,
      });
      setArticles(res.data);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? '' : slug);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 rounded-3xl p-8 md:p-12 text-white overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 text-xs font-bold rounded-full border border-sky-400/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            مجله تخصصی خودرو سوال‌کار
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
            دانشنامه عیب‌یابی، نگهداری و راهنمای کامل خودرو
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            مقالات تحلیلی، آموزش‌های کاربردی سرویس‌های دوره‌ای و نکات کلیدی مکانیک برای افزایش طول عمر و عملکرد بهینه خودروی شما.
          </p>

          {currentUser?.role === UserRole.Admin && (
            <div className="pt-2">
              <button
                onClick={onOpenAdminPanel}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                مدیریت و افزودن مقاله جدید
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در عنوان یا متن مقالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </form>

          {/* Sort selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" />
              مرتب‌سازی:
            </span>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-sky-500"
            >
              <option value="newest">جدیدترین مقالات</option>
              <option value="most_viewed">پربازدیدترین مقالات</option>
            </select>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 pl-2 whitespace-nowrap flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" /> دسته:
            </span>
            <button
              onClick={() => {
                setSelectedCategory('');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === ''
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              همه دسته‌ها
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat.slug
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                {cat.articleCount !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.slug ? 'bg-sky-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {cat.articleCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tags Horizontal Scroll */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 pl-2 whitespace-nowrap flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" /> تگ‌های محبوب:
            </span>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setSelectedTag(selectedTag === tag.slug ? '' : tag.slug);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag.slug
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Articles Grid / Loading / Empty */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 animate-pulse space-y-4">
              <div className="w-full h-44 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-200 rounded-md w-full" />
              <div className="h-3 bg-slate-200 rounded-md w-2/3" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 space-y-4">
          <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">مقاله‌ای با این مشخصات یا فیلتر یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            می‌توانید فیلترهای انتخاب شده را پاک کنید یا عبارات دیگری را برای جستجو امتحان نمایید.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedTag('');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onSelectArticle={onSelectArticle}
              onSelectCategory={(catSlug) => {
                setSelectedCategory(catSlug);
                setCurrentPage(1);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                currentPage === idx + 1
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
