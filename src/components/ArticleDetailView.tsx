import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Clock,
  Eye,
  Calendar,
  User,
  Share2,
  Copy,
  MessageSquare,
  List,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Send,
  HelpCircle,
  Tag as TagIcon
} from 'lucide-react';
import { Article, Question } from '../types';
import { apiService } from '../services/api';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { QuestionCard } from './QuestionCard';

interface ArticleDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectArticle: (slug: string) => void;
  onSelectQuestion: (question: Question) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  slug,
  onBack,
  onSelectArticle,
  onSelectQuestion,
  onShowToast,
}) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    fetchArticleData();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchArticleData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getArticleBySlug(slug);
      const art = res.article;
      setArticle(art);
      setRelatedArticles(art.relatedArticles || []);
      setRelatedQuestions(art.relatedQuestions || []);

      // Extract Table of Contents (TOC) from HTML
      if (art.content) {
        parseToc(art.content);
      }
    } catch (err) {
      console.error('Error fetching article detail:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse Table of Contents from HTML h2 / h3 tags
  const parseToc = (contentHtml: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      const level = heading.tagName.toLowerCase() === 'h2' ? 2 : 3;
      const text = heading.textContent || `بخش ${index + 1}`;
      const id = `section-${index}`;
      items.push({ id, text, level });
    });

    setToc(items);
  };

  // Inject Table of Contents IDs into rendered HTML
  const processHtmlContent = (htmlString: string) => {
    let index = 0;
    return htmlString.replace(/<(h[23])(.*?)>/gi, (match, p1, p2) => {
      const id = `section-${index++}`;
      return `<${p1} id="${id}" ${p2}>`;
    });
  };

  // Dynamic Document Head Meta Tags
  useDocumentHead({
    title: article?.metaTitle || article?.title || 'مقاله آموزشی | سوال‌کار',
    description: article?.metaDescription || article?.summary || 'مطالعه مقاله تخصصی خودرو در سوال‌کار.',
    canonicalUrl: `https://soalcar.ir/articles/${article?.slug || slug}`,
    ogType: 'article',
    ogImage: article?.coverImageUrl,
  });

  // Inject Structured Data (JSON-LD Article + BreadcrumbList Schema)
  useEffect(() => {
    if (!article) return;

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.summary,
      image: [article.coverImageUrl],
      datePublished: article.publishedAt || article.createdAt,
      dateModified: article.updatedAt || article.createdAt,
      author: {
        '@type': 'Person',
        name: article.author?.username || 'کارشناس فنی سوال‌کار',
      },
      publisher: {
        '@type': 'Organization',
        name: 'سوال‌کار',
        logo: {
          '@type': 'ImageObject',
          url: 'https://soalcar.ir/icon.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://soalcar.ir/articles/${article.slug}`,
      },
    };

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'صفحه اصلی',
          item: 'https://soalcar.ir/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'مجله و مقالات',
          item: 'https://soalcar.ir/articles',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `https://soalcar.ir/articles/${article.slug}`,
        },
      ],
    };

    const script1 = document.createElement('script');
    script1.type = 'application/ld+json';
    script1.id = 'article-jsonld';
    script1.text = JSON.stringify(articleJsonLd);

    const script2 = document.createElement('script');
    script2.type = 'application/ld+json';
    script2.id = 'breadcrumb-jsonld';
    script2.text = JSON.stringify(breadcrumbJsonLd);

    document.head.appendChild(script1);
    document.head.appendChild(script2);

    return () => {
      document.getElementById('article-jsonld')?.remove();
      document.getElementById('breadcrumb-jsonld')?.remove();
    };
  }, [article]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    onShowToast?.('لینک مقاله در حافظه کپی شد.', 'success');
  };

  const handleShareTelegram = () => {
    if (!article) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`📌 ${article.title}\n\n${article.summary}`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleShareWhatsapp = () => {
    if (!article) return;
    const text = encodeURIComponent(`📌 ${article.title}\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-md w-1/3" />
        <div className="h-10 bg-slate-200 rounded-md w-3/4" />
        <div className="h-64 bg-slate-200 rounded-2xl w-full" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded-md w-full" />
          <div className="h-4 bg-slate-200 rounded-md w-full" />
          <div className="h-4 bg-slate-200 rounded-md w-2/3" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">مقاله مورد نظر یافت نشد.</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-700 text-white rounded-xl text-xs font-bold"
        >
          بازگشت به فهرست مقالات
        </button>
      </div>
    );
  }

  const formattedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={onBack} className="hover:text-sky-700 whitespace-nowrap">
          خانه
        </button>
        <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <button onClick={onBack} className="hover:text-sky-700 whitespace-nowrap">
          مقالات و مجله
        </button>
        {article.category && (
          <>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-600 font-medium whitespace-nowrap">{article.category.name}</span>
          </>
        )}
        <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
      </nav>

      {/* Main Article Header */}
      <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        {article.category && (
          <span className="inline-block px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-lg">
            {article.category.name}
          </span>
        )}

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
          {article.title}
        </h1>

        {/* Article Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-4 border-b border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <div className="w-7 h-7 bg-sky-100 text-sky-800 rounded-full flex items-center justify-center font-bold text-xs">
                {article.author?.username?.charAt(0) || 'ک'}
              </div>
              <span>{article.author?.username || 'کارشناس فنی سوال‌کار'}</span>
            </div>

            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {article.readingTimeMinutes} دقیقه مطالعه
            </span>

            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {article.viewCount} بازدید
            </span>
          </div>

          {/* Social Share Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="کپی لینک مقاله"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleShareTelegram}
              title="اشتراک در تلگرام"
              className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Lead Box */}
        <p className="text-sm font-medium text-slate-700 bg-slate-50 border-r-4 border-sky-700 p-4 rounded-xl leading-relaxed">
          {article.summary}
        </p>

        {/* Cover Image */}
        <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 shadow-xs my-4">
          <img
            src={article.coverImageUrl || 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80'}
            alt={article.coverImageAlt || article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Table of Contents (TOC) */}
        {toc.length > 0 && (
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 my-6 space-y-3">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
              <List className="w-4 h-4 text-sky-700" />
              <span>فهرست مطالب مقاله</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 pr-2">
              {toc.map((item) => (
                <li
                  key={item.id}
                  style={{ paddingRight: item.level === 3 ? '1.25rem' : '0' }}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-sky-700 hover:underline flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full inline-block shrink-0" />
                    <span>{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body HTML Content */}
        <div
          className="article-content space-y-6 text-sm text-slate-800 leading-loose pt-4"
          dangerouslySetInnerHTML={{ __html: processHtmlContent(article.content) }}
        />

        {/* Tags Footer */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" /> برچسب‌های مرتبط:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Internal Linking Engine: Related Questions */}
      {relatedQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <HelpCircle className="w-4 h-4" />
                شبکه پرسش و پاسخ خودرویی
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                سوالات و عیب‌یابی‌های مرتبط رانندگان درباره این موضوع
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {relatedQuestions.map((q) => (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q)}
                className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800">
                    {q.carBrand} - {q.carModel}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                    {q.title}
                  </h4>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-sky-400 group-hover:-translate-x-1 transition-all shrink-0 mr-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-5 bg-sky-700 rounded-full inline-block" />
            پیشنهاد مطالعه مقالات مرتبط
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectArticle(rel.slug)}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-sky-300 cursor-pointer shadow-xs transition-all flex gap-4 items-center group"
              >
                <img
                  src={rel.coverImageUrl || 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=200&fit=crop'}
                  alt={rel.title}
                  className="w-20 h-20 object-cover rounded-xl shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 block">
                    {rel.readingTimeMinutes} دقیقه مطالعه
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
