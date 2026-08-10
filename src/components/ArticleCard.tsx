import React from 'react';
import { Clock, Eye, Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSelectArticle: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelectArticle,
  onSelectCategory,
}) => {
  const formattedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Cover Image */}
      <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
        <img
          src={article.coverImageUrl || 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80'}
          alt={article.coverImageAlt || article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {article.category && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCategory?.(article.category!.slug);
            }}
            className="absolute top-3 right-3 px-3 py-1 bg-sky-900/90 hover:bg-sky-950 text-white text-[11px] font-bold rounded-lg backdrop-blur-xs shadow-xs transition-colors"
          >
            {article.category.name}
          </button>
        )}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 text-white text-[10px] font-medium rounded-md backdrop-blur-xs flex items-center gap-1">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>{article.readingTimeMinutes} دقیقه مطالعه</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <h3
            onClick={() => onSelectArticle(article.slug)}
            className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {article.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{article.author?.username || 'کارشناس فنی سوال‌کار'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              {article.viewCount}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
