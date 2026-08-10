import React, { useState } from 'react';
import { Wrench, MapPin, Phone, Award, Search, UserCheck, ShieldCheck, ChevronLeft, Filter, Star, LayoutGrid, Map as MapIcon, Navigation } from 'lucide-react';
import { MechanicProfile } from '../types';
import { InteractiveMechanicMap } from './InteractiveMechanicMap';

interface MechanicDirectoryViewProps {
  mechanics: MechanicProfile[];
  onSelectMechanic: (slug: string) => void;
  onOpenContactLead: (mechanic: MechanicProfile) => void;
}

export const MechanicDirectoryView: React.FC<MechanicDirectoryViewProps> = ({
  mechanics,
  onSelectMechanic,
  onOpenContactLead,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const districts = ['All', 'ستارخان', 'عباس‌آباد', 'پاسداران', 'تجریش', 'آزادگان', 'شرق تهران'];
  const specialtiesList = ['All', 'موتور', 'گیربکس اتوماتیک', 'برق و دیاگ', 'تنظیم موتور', 'توربوشارژ'];

  const filtered = mechanics.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        m.displayName.toLowerCase().includes(q) ||
        m.workshopName?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (selectedDistrict !== 'All' && !m.district?.includes(selectedDistrict)) {
      return false;
    }

    if (selectedSpecialty !== 'All') {
      const hasSpec = m.specialties.some((s) => s.name.includes(selectedSpecialty));
      if (!hasSpec) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950 text-sky-300 text-xs font-bold border border-sky-800">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>دایرکتوری متخصصین و استادکاران تأییدشده</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            یافتن بهترین مکانیک و تعمیرگاه خودرو
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            مستقیماً با استادکاران مجرب در مناطق مختلف تماس بگیرید، روی نقشه زنده موقعیت تعمیرگاه‌ها را بررسی کنید و نوبت حضوری دریافت نمایید.
          </p>
        </div>
      </div>

      {/* Filter Bar & View Toggle */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black text-slate-800">فیلتر هوشمند و انتخاب نوع نمایش:</h3>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-600" />
              <span>نمای کارتی</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>نقشه زنده گوگل مپ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="جستجوی نام مکانیک یا نام تعمیرگاه..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>

          {/* District Filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500 cursor-pointer"
            >
              <option value="All">همه مناطق تهران</option>
              {districts.filter((d) => d !== 'All').map((d) => (
                <option key={d} value={d}>
                  منطقه: {d}
                </option>
              ))}
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500 cursor-pointer"
            >
              <option value="All">همه تخصص‌ها (موتور، گیربکس، دیاگ...)</option>
              {specialtiesList.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  تخصص: {s}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* View Modes Rendering */}
      {viewMode === 'map' ? (
        <InteractiveMechanicMap
          mechanics={filtered}
          onSelectMechanic={onSelectMechanic}
          selectedDistrict={selectedDistrict}
          onDistrictSelect={setSelectedDistrict}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Top Row: Name, Verified Badge, Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.user?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                      alt={m.displayName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-sky-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => onSelectMechanic(m.slug)}
                          className="font-black text-slate-900 text-base hover:text-sky-700 cursor-pointer transition-colors"
                        >
                          {m.displayName}
                        </h3>
                        {m.isVerifiedBadge && (
                          <ShieldCheck className="w-4 h-4 text-sky-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{m.workshopName}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="text-xs font-black">{m.ratingAverage || 4.9}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{m.address || m.district}</span>
                </div>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.specialties.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.workshopName || m.displayName} ${m.address || m.district}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl border border-sky-200 flex items-center justify-center transition-colors"
                  title="مسیریابی مستقیم با گوگل مپ"
                >
                  <Navigation className="w-4 h-4 text-sky-600" />
                </a>

                <button
                  onClick={() => onOpenContactLead(m)}
                  className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تماس و اخذ نوبت</span>
                </button>

                <button
                  onClick={() => onSelectMechanic(m.slug)}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>مشاهده پروفایل</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
