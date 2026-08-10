import React, { useState } from 'react';
import { useDocumentHead } from '../hooks/useDocumentHead';
import {
  ArrowRight,
  MessageSquare,
  Eye,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Phone,
  MapPin,
  Building2,
  Send,
  UserCheck,
  Share2,
  Wrench,
  Award,
  Clock,
  Car
} from 'lucide-react';
import { Question, Answer, User, UserRole, MechanicProfile } from '../types';

interface QuestionDetailViewProps {
  question: Question;
  currentUser: User | null;
  onBack: () => void;
  onSubmitAnswer: (questionId: number, body: string) => Promise<void>;
  onAcceptAnswer: (questionId: number, answerId: number) => Promise<void>;
  onVoteAnswer: (questionId: number, answerId: number, type: 'up' | 'down') => Promise<void>;
  onOpenContactLead: (mechanic: MechanicProfile, questionId: number) => void;
  onSelectMechanicSlug: (slug: string) => void;
}

export const QuestionDetailView: React.FC<QuestionDetailViewProps> = ({
  question,
  currentUser,
  onBack,
  onSubmitAnswer,
  onAcceptAnswer,
  onVoteAnswer,
  onOpenContactLead,
  onSelectMechanicSlug,
}) => {
  useDocumentHead({
    title: `${question.title} - ${question.carBrand} ${question.carModel} | سوال‌کار`,
    description: question.body ? question.body.slice(0, 160) : `سوال درباره ${question.carBrand} ${question.carModel} در پلتفرم سوال‌کار`,
    ogType: 'article',
  });
  const [newAnswerBody, setNewAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isQuestionOwner = currentUser?.id === question.authorId || currentUser?.role === UserRole.Admin;

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerBody.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitAnswer(question.id, newAnswerBody);
      setNewAnswerBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Back Header & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست سوالات</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-700 bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'لینک کپی شد!' : 'اشتراک‌گذاری'}</span>
        </button>
      </div>

      {/* Main Question Post */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Question Header & Meta */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {question.carBrand && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-sky-50 text-sky-800 text-xs font-bold border border-sky-100">
                <Car className="w-4 h-4 text-sky-600" />
                <span>{question.carBrand} {question.carModel ? `— ${question.carModel}` : ''} {question.carYear ? `(${question.carYear})` : ''}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              <Eye className="w-3.5 h-3.5" />
              <span>{question.viewCount} بازدید</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {question.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
            <img
              src={question.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={question.author?.username}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="font-bold text-slate-800">{question.author?.username}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(question.createdAt).toLocaleDateString('fa-IR')}</span>
            </span>
          </div>
        </div>

        {/* Question Body */}
        <div className="text-sm sm:text-base text-slate-800 leading-relaxed space-y-4 whitespace-pre-line font-medium">
          {question.body}
        </div>

        {/* Question Images */}
        {question.images && question.images.length > 0 && (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.images.map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-slate-200">
                <img src={img.url} alt={img.caption || 'تصویر خودرو'} className="w-full h-48 object-cover" />
                {img.caption && <p className="text-xs text-slate-500 p-2 bg-slate-50">{img.caption}</p>}
              </div>
            ))}
          </div>
        )}

        {/* AI Smart Preliminary Suggestion Box */}
        {question.aiSuggestion && (
          <div className="p-4 bg-gradient-to-r from-purple-50 via-sky-50 to-amber-50 rounded-2xl border border-purple-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>تحلیل پیش‌فرض هوش مصنوعی (بر اساس داده‌های مکانیکی):</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {question.aiSuggestion}
            </p>
          </div>
        )}

        {/* Tags */}
        {question.questionTags && question.questionTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {question.questionTags.map((tag) => (
              <span key={tag.id} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answers Section Header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <span>پاسخ‌های تخصصی ({question.answers?.length || 0})</span>
        </h2>
      </div>

      {/* Answers List */}
      <div className="space-y-5">
        {question.answers && question.answers.length > 0 ? (
          question.answers.map((answer) => {
            const mechanic = answer.mechanicProfile;

            return (
              <div
                key={answer.id}
                className={`bg-white rounded-2xl p-6 border transition-all ${
                  answer.isAccepted
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                    : 'border-slate-200/80 shadow-2xs'
                }`}
              >
                {/* Accepted Answer Ribbon */}
                {answer.isAccepted && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>پاسخ پذیرفته‌شده توسط پرسش‌کننده</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Answer Text & Content */}
                  <div className="flex-1 space-y-4">
                    
                    {/* Author/Mechanic Header */}
                    <div className="flex items-center gap-3">
                      <img
                        src={answer.author?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                        alt={mechanic?.displayName || answer.author?.username}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-sky-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => mechanic && onSelectMechanicSlug(mechanic.slug)}
                            className="font-black text-slate-900 text-base hover:text-sky-700 transition-colors text-right"
                          >
                            {mechanic?.displayName || answer.author?.username}
                          </button>
                          {mechanic?.isVerifiedBadge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                              <UserCheck className="w-3 h-3 text-sky-600" />
                              <span>مکانیک تأییدشده</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {mechanic?.workshopName || 'عضو تخصصی سوال‌کار'} • {new Date(answer.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>

                    {/* Answer Body */}
                    <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {answer.body}
                    </div>

                    {/* Vote & Accept Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onVoteAnswer(question.id, answer.id, 'up')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                            answer.userVote === 'Up'
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{answer.voteScore}</span>
                        </button>
                        <button
                          onClick={() => onVoteAnswer(question.id, answer.id, 'down')}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isQuestionOwner && !answer.isAccepted && (
                        <button
                          onClick={() => onAcceptAnswer(question.id, answer.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-extrabold transition-colors border border-emerald-200 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تأیید به‌عنوان بهترین پاسخ</span>
                        </button>
                      )}

                    </div>
                  </div>

                  {/* Mechanic Contact Sidebar Card (If answered by mechanic) */}
                  {mechanic && (
                    <div className="w-full md:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 shrink-0">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        <span>اطلاعات تعمیرگاه</span>
                      </div>

                      <div className="text-xs space-y-1.5 text-slate-600">
                        <p className="font-bold text-slate-900">{mechanic.workshopName}</p>
                        <p className="flex items-start gap-1 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{mechanic.address || mechanic.district}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => onOpenContactLead(mechanic, question.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>تماس و نوبت حضوری</span>
                      </button>

                      <button
                        onClick={() => onSelectMechanicSlug(mechanic.slug)}
                        className="w-full text-center text-[11px] font-bold text-sky-700 hover:underline block"
                      >
                        مشاهده کامل پروفایل
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800">هنوز پاسخی ثبت نشده است</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              اگر مکانیک یا متخصص خودرو هستید، می‌توانید اولین پاسخ راهگشا را برای این مالک خودرو بنویسید.
            </p>
          </div>
        )}
      </div>

      {/* Answer Submit Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Send className="w-4 h-4 text-sky-600" />
          <span>ارسال پاسخ به این سوال</span>
        </h3>

        {!currentUser ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
            برای ثبت پاسخ تخصصی ابتدا به حساب کاربری خود وارد شوید.
          </div>
        ) : (
          <form onSubmit={handleAnswerSubmit} className="space-y-4">
            <textarea
              rows={4}
              placeholder="پاسخ فنی و راهکار عیب‌یابی خود را به صورت مرحله‌به‌مرحله بنویسید..."
              value={newAnswerBody}
              onChange={(e) => setNewAnswerBody(e.target.value)}
              required
              className="w-full p-4 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500 focus:outline-hidden font-medium"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                با ثبت پاسخ، به کسب امتیاز اعتبار (Reputation) شما افزوده می‌شود.
              </span>
              <button
                type="submit"
                disabled={submitting || !newAnswerBody.trim()}
                className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت...' : 'ارسال پاسخ'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};
