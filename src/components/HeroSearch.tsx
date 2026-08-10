import React from 'react';
import { Search, Sparkles, CheckCircle, ShieldCheck, Car, Wrench, CheckCircle2 } from 'lucide-react';
import { Tag } from '../types';

interface HeroSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: () => void;
  popularTags: Tag[];
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  onOpenAskModal: () => void;
  onOpenAiDrawer: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  popularTags,
  selectedBrand,
  setSelectedBrand,
  onOpenAskModal,
  onOpenAiDrawer,
}) => {
  const brands = [
    { name: 'همه برندها', value: 'All' },
    { name: 'ایران خودرو', value: 'ایران خودرو' },
    { name: 'سایپا', value: 'سایپا' },
    { name: 'پژو', value: 'پژو' },
    { name: 'هیوندای و کیا', value: 'هیوندای' },
    { name: 'چینی (جک/چری)', value: 'جک' },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/80 text-sky-300 text-xs font-bold mb-6">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>پاسخ‌های تأییدشده توسط مکانیک‌های فنی تهران و شهرستان‌ها</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-tight mb-4">
          سوال خودرویی داری؟ <br className="hidden sm:inline" />
          از <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300">مکانیک‌های باسابقه</span> بپرس
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
          مرجع تخصصی عیب‌یابی صدای موتور، مشکل گیربکس اتوماتیک، دیاگ و برق خودروهای ایرانی و وارداتی با پاسخ سریع استادیارهای فنی.
        </p>

        {/* Search First Bar */}
        <div className="bg-white/10 backdrop-blur-xl p-2 sm:p-3 rounded-2xl border border-white/20 shadow-2xl max-w-3xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="مشکل خودروت چیه؟ (مثال: تقه زدن گیربکس، روشن شدن چراغ چک...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                className="w-full h-12 pr-11 pl-4 bg-white text-slate-900 placeholder-slate-400 font-semibold text-sm rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-inner"
              />
              <Search className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400" />
            </div>

            <button
              onClick={onSearchSubmit}
              className="h-12 px-6 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>جستجو در سوالات</span>
            </button>
          </div>
        </div>

        {/* Car Brands Quick Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs">
          <span className="text-slate-400 font-bold ml-1">فیلتر برند:</span>
          {brands.map((b) => (
            <button
              key={b.value}
              onClick={() => setSelectedBrand(b.value)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedBrand === b.value
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Feature stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>+۱,۴۵۰ سوال پاسخ داده شده</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs font-bold">
            <Wrench className="w-4 h-4 text-sky-400" />
            <span>+۳۸۰ مکانیک تأییدشده</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 text-slate-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
            <button onClick={onOpenAiDrawer} className="text-amber-300 hover:underline">
              دستیار هوشمند عیب‌یابی (AI)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
