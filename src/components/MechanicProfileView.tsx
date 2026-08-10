import React, { useState, useEffect } from 'react';
import { useDocumentHead } from '../hooks/useDocumentHead';
import {
  Wrench,
  MapPin,
  Phone,
  Award,
  CheckCircle2,
  Instagram,
  ArrowRight,
  MessageSquare,
  Building2,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Star,
  Send,
  User,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';
import { MechanicProfile, MechanicReview } from '../types';
import { apiService } from '../services/api';

interface MechanicProfileViewProps {
  slug: string;
  onBack: () => void;
  onSelectQuestion: (slug: string) => void;
  onOpenContactLead: (mechanic: MechanicProfile) => void;
}

export const MechanicProfileView: React.FC<MechanicProfileViewProps> = ({
  slug,
  onBack,
  onSelectQuestion,
  onOpenContactLead,
}) => {
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [recentAnswers, setRecentAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review submission state
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [authorName, setAuthorName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await apiService.getMechanicBySlug(slug);
        setMechanic(res.mechanic);
        setRecentAnswers(res.recentAnswers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mechanic) return;
    if (!comment.trim()) {
      setReviewError('لطفاً متن بازخورد خود را بنویسید.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await apiService.submitMechanicReview(mechanic.id, {
        rating: selectedStars,
        comment,
        authorName: authorName.trim() || 'کاربر سوال‌کار',
        serviceType: serviceType.trim() || undefined,
      });

      setMechanic(res.mechanic);
      setReviewSuccess('با تشکر! امتیاز و بازخورد شما برای این مکانیک با موفقیت ثبت شد.');
      setComment('');
      setServiceType('');
      setAuthorName('');
    } catch (err: any) {
      setReviewError(err.message || 'خطا در ثبت امتیاز و بازخورد');
    } finally {
      setSubmittingReview(false);
    }
  };

  useDocumentHead({
    title: mechanic
      ? `${mechanic.displayName} - ${mechanic.workshopName} (${mechanic.district}) | سوال‌کار`
      : 'پروفایل مکانیک | سوال‌کار',
    description: mechanic
      ? `${mechanic.bio || mechanic.workshopName} - آدرس: ${mechanic.address || mechanic.district}`
      : 'مشخصات رزومه، آدرس و شماره تماس تعمیرگاه تخصصی',
    ogType: 'profile',
    ogImage: mechanic?.user?.avatarUrl,
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">در حال دریافت پروفایل مکانیک...</p>
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-sm text-slate-700 font-bold">پروفایل مکانیک مورد نظر یافت نشد.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
        >
          بازگشت
        </button>
      </div>
    );
  }

  const ratingAvg = mechanic.ratingAverage || 4.9;
  const ratingCnt = mechanic.ratingCount || mechanic.reviews?.length || 28;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Back Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
      >
        <ArrowRight className="w-4 h-4" />
        <span>بازگشت به دایرکتوری</span>
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          
          <div className="flex items-start gap-4">
            <img
              src={mechanic.user?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
              alt={mechanic.displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-sky-100 shrink-0"
            />
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{mechanic.displayName}</h1>
                {mechanic.isVerifiedBadge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-xs font-extrabold">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>مکانیک تأییدشده</span>
                  </span>
                )}
              </div>
              
              <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>{mechanic.workshopName}</span>
              </p>

              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{mechanic.address || mechanic.district}</span>
              </p>

              {/* Star Rating summary badge */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-slate-900">{ratingAvg} از ۵</span>
                <span className="text-[11px] text-slate-500 font-bold">({ratingCnt} نظر مشتریان)</span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
            <div className="text-right sm:text-left">
              <div className="flex items-center gap-1 justify-end">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span className="text-2xl font-black text-amber-600 block">{ratingAvg}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 block">میانگین امتیاز رضایت</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mechanic.workshopName || mechanic.displayName} ${mechanic.address || mechanic.district}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl border border-sky-200 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>نقشه گوگل</span>
              </a>

              <button
                onClick={() => onOpenContactLead(mechanic)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>تماس و اخذ نوبت</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bio */}
        {mechanic.bio && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">درباره تعمیرگاه و رزومه کاری</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {mechanic.bio}
            </p>
          </div>
        )}

        {/* Specialties Tags */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">تخصص‌های اصلی</h3>
          <div className="flex flex-wrap gap-2">
            {mechanic.specialties.map((spec) => (
              <span key={spec.id} className="px-3 py-1.5 bg-sky-50 text-sky-900 border border-sky-100 text-xs font-bold rounded-xl">
                {spec.name}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <span className="text-lg font-black text-slate-900 block">{mechanic.answersCount || recentAnswers.length}</span>
            <span className="text-[11px] font-bold text-slate-500">پاسخ‌های ثبت‌شده</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <span className="text-lg font-black text-emerald-600 block">{mechanic.acceptedAnswersCount || 0}</span>
            <span className="text-[11px] font-bold text-slate-500">پاسخ‌های پذیرفته‌شده</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 rounded-xl text-center">
            <span className="text-lg font-black text-sky-600 block">{mechanic.district || 'تهران'}</span>
            <span className="text-[11px] font-bold text-slate-500">منطقه فعالیت</span>
          </div>
        </div>

      </div>

      {/* Star Rating & Feedback Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>امتیاز ستاره‌ای و نظرات مشتریان</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              تجربه خود از خدمات فنی و رفتار کاری {mechanic.displayName} را ثبت کنید.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
            <span className="text-2xl font-black text-amber-600">{ratingAvg}</span>
            <div className="text-right">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-amber-800">{ratingCnt} نظر ثبت‌شده</span>
            </div>
          </div>
        </div>

        {/* Submit Review Form */}
        <form onSubmit={handleSubmitReview} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-xs font-black text-slate-900">ثبت امتیاز و بازخورد جدید:</h3>

          {reviewSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reviewSuccess}</span>
            </div>
          )}

          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
              {reviewError}
            </div>
          )}

          {/* Star Rating Picker */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">امتیاز شما (از ۱ تا ۵ ستاره):</label>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  title={`${star} ستاره`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoverStars || selectedStars)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 mr-2">
                {hoverStars || selectedStars} ستاره
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام و نام خانوادگی شما:</label>
              <input
                type="text"
                placeholder="مثلاً: علی محمدی"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full p-2.5 bg-white text-xs font-medium rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع خدمات دریافت شده:</label>
              <input
                type="text"
                placeholder="مثلاً: تعویض تسمه تایم، عیب‌یابی دیاگ..."
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-2.5 bg-white text-xs font-medium rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و تجربه مراجعه به این مکانیک:</label>
            <textarea
              rows={3}
              placeholder="شرح برخورد، سرعت عمل، منصف بودن در هزینه و کیفیت تعمیرات..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 bg-white text-xs font-medium rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submittingReview}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submittingReview ? 'در حال ثبت امتیاز...' : 'ثبت امتیاز و نظر من'}</span>
          </button>
        </form>

        {/* Existing Reviews List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-slate-900">نظرات و بازخوردهای ثبت‌شده اخیر:</h3>
          {mechanic.reviews && mechanic.reviews.length > 0 ? (
            <div className="space-y-3">
              {mechanic.reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {rev.authorName ? rev.authorName[0] : 'ک'}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{rev.authorName}</span>
                        {rev.serviceType && (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                            خدمات: {rev.serviceType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
                    {rev.comment}
                  </p>

                  <div className="text-[10px] text-slate-400 text-left pt-1">
                    {new Date(rev.createdAt).toLocaleDateString('fa-IR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl text-center">
              هنوز نظری برای این مکانیک ثبت نشده است. اولین نفری باشید که امتیاز و بازخورد ثبت می‌کند!
            </p>
          )}
        </div>

      </div>

      {/* Answers History Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <span>آخرین پاسخ‌های کارشناسی {mechanic.displayName} در سایت</span>
        </h2>

        {recentAnswers.length > 0 ? (
          <div className="space-y-3">
            {recentAnswers.map((ans) => (
              <div
                key={ans.id}
                onClick={() => ans.questionSlug && onSelectQuestion(ans.questionSlug)}
                className="p-4 bg-slate-50 hover:bg-sky-50/50 rounded-2xl border border-slate-200/80 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    سوال: {ans.questionTitle}
                  </h4>
                  {ans.isAccepted && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>بهترین پاسخ</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ans.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">پاسخی از این مکانیک ثبت نشده است.</p>
        )}
      </div>

    </div>
  );
};
