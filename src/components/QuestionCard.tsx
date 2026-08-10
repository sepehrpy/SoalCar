import React from 'react';
import { MessageSquare, Eye, CheckCircle2, Clock, Car, Tag as TagIcon, Sparkles } from 'lucide-react';
import { Question, QuestionStatus } from '../types';

interface QuestionCardProps {
  question: Question;
  onClick: (question: Question) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
  const answerCount = question.answers?.length || 0;
  const hasAcceptedAnswer = question.answers?.some((a) => a.isAccepted);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'چند لحظه پیش';
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      if (diffDays === 1) return 'دیروز';
      return `${diffDays} روز پیش`;
    } catch {
      return 'اخیراً';
    }
  };

  return (
    <div
      onClick={() => onClick(question)}
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md card-hover cursor-pointer transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        {/* Main Content Side */}
        <div className="flex-1 min-w-0">
          
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {question.carBrand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                <Car className="w-3.5 h-3.5 text-sky-600" />
                <span>{question.carBrand} {question.carModel ? `— ${question.carModel}` : ''}</span>
              </span>
            )}

            {hasAcceptedAnswer ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>پاسخ پذیرفته‌شده</span>
              </span>
            ) : question.status === QuestionStatus.Answered ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>پاسخ داده شده</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>در انتظار پاسخ مکانیک</span>
              </span>
            )}

            {question.aiSuggestion && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>تحلیل AI دارد</span>
              </span>
            )}
          </div>

          {/* Question Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors leading-snug mb-2">
            {question.title}
          </h3>

          {/* Snippet */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {question.body}
          </p>

          {/* Question Tags */}
          {question.questionTags && question.questionTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {question.questionTags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Author Footer */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <img
              src={question.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={question.author?.username}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="font-semibold text-slate-700">{question.author?.username || 'کاربر خودرو'}</span>
            <span>•</span>
            <span>{formatRelativeTime(question.createdAt)}</span>
          </div>

        </div>

        {/* Stats Column */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 text-xs font-bold">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>{answerCount} پاسخ</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>{question.viewCount} بازدید</span>
          </div>
        </div>

      </div>
    </div>
  );
};
