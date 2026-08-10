import React, { useState } from 'react';
import { Building2, MessageSquare, Award, CheckCircle2, PhoneCall, Save, Sparkles, Wrench, Clock, Send } from 'lucide-react';
import { User, MechanicProfile, Question } from '../types';

interface MechanicDashboardViewProps {
  currentUser: User;
  openQuestions: Question[];
  onSelectQuestion: (question: Question) => void;
  onUpdateProfile: (updated: Partial<MechanicProfile>) => Promise<void>;
}

export const MechanicDashboardView: React.FC<MechanicDashboardViewProps> = ({
  currentUser,
  openQuestions,
  onSelectQuestion,
  onUpdateProfile,
}) => {
  const profile = currentUser.mechanicProfile;

  const [displayName, setDisplayName] = useState(profile?.displayName || currentUser.username);
  const [workshopName, setWorkshopName] = useState(profile?.workshopName || '');
  const [district, setDistrict] = useState(profile?.district || 'منطقه ۲ (ستارخان)');
  const [address, setAddress] = useState(profile?.address || '');
  const [phonePublic, setPhonePublic] = useState(profile?.phonePublic || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile({
        displayName,
        workshopName,
        district,
        address,
        phonePublic,
        bio,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
            alt={currentUser.username}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sky-400 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">{profile?.displayName || currentUser.username}</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-400/30">
                پنل مکانیک
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{profile?.workshopName || 'تعمیرگاه تخصصی خودرو'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700">
            <span className="text-xl font-black text-amber-400 block">{profile?.reputationScore || 100}</span>
            <span className="text-[10px] text-slate-400 font-bold block">امتیاز اعتبار</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700">
            <span className="text-xl font-black text-emerald-400 block">{profile?.answersCount || 0}</span>
            <span className="text-[10px] text-slate-400 font-bold block">پاسخ‌های ثبت‌شده</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Open Questions to Answer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              <span>سوالات اخیر کاربران برای پاسخ‌دهی شما</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">پاسخ به هر سوال = +۱۵ امتیاز اعتبار</span>
          </div>

          <div className="space-y-4">
            {openQuestions.slice(0, 5).map((q) => (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q)}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-md cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                    {q.carBrand} {q.carModel}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">
                    {new Date(q.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors text-base">
                  {q.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {q.body}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>ارسال شده توسط {q.author?.username}</span>
                  <span className="font-bold text-sky-700 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال پاسخ کارشناسی</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Edit Mechanic Profile Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 h-fit">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>ویرایش مشخصات عمومی تعمیرگاه</span>
          </h2>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
              تغییرات پروفایل با موفقیت ذخیره شد.
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام نمایش (استادکار/مهندس)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام تعمیرگاه / مرکز خدماتی</label>
              <input
                type="text"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">منطقه فعالیت</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">آدرس دقیق تعمیرگاه</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-medium rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس عمومی (برای مشتریان)</label>
              <input
                type="text"
                value={phonePublic}
                onChange={(e) => setPhonePublic(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رزومه و تخصص‌ها</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-medium rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
