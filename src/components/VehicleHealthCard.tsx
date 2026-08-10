import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Gauge,
  Wrench,
  Plus,
  HelpCircle,
  Car,
  ChevronDown,
  Clock,
  Zap,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export interface VehicleHealthCardProps {
  vehicles: any[];
  onOpenAddServiceModal?: (vehicle: any) => void;
  onOpenUpdateMileageModal?: (vehicle: any) => void;
  onOpenAskMechanicModal?: (brand: string, model: string) => void;
}

export const VehicleHealthCard: React.FC<VehicleHealthCardProps> = ({
  vehicles,
  onOpenAddServiceModal,
  onOpenUpdateMileageModal,
  onOpenAskMechanicModal,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    vehicles.length > 0 ? vehicles[0].id : null
  );

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  // Ensure selected vehicle exists, or default to first
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Helper to compute vehicle health details
  const getHealthData = (v: any) => {
    const currentKm = Number(v.mileage) || 0;
    const serviceLogs = Array.isArray(v.serviceLogs) ? v.serviceLogs : [];

    let overdueCount = 0;
    let dueSoonCount = 0;
    let upToDateCount = 0;

    const detailsList: Array<{
      categoryKey: 'oil' | 'belt' | 'brake' | 'plugs' | 'general';
      title: string;
      icon: string;
      status: 'ok' | 'warning' | 'danger' | 'unknown';
      statusText: string;
      remainingKm: number | null;
      lastMileage?: number;
      nextMileage?: number;
    }> = [
      {
        categoryKey: 'oil',
        title: 'روغن موتور و فیلترها',
        icon: '🛢️',
        status: 'unknown',
        statusText: 'ثبت نشده',
        remainingKm: null,
      },
      {
        categoryKey: 'belt',
        title: 'تسمه تایم و تسمه دینام',
        icon: '⚙️',
        status: 'unknown',
        statusText: 'ثبت نشده',
        remainingKm: null,
      },
      {
        categoryKey: 'brake',
        title: 'لنت و دیسک ترمز',
        icon: '🛑',
        status: 'unknown',
        statusText: 'ثبت نشده',
        remainingKm: null,
      },
      {
        categoryKey: 'plugs',
        title: 'شمع و سیستم احتراق',
        icon: '⚡',
        status: 'unknown',
        statusText: 'ثبت نشده',
        remainingKm: null,
      },
    ];

    // Evaluate each log
    serviceLogs.forEach((s: any) => {
      const targetKm = Number(s.nextServiceMileage) || 0;
      const rem = targetKm - currentKm;

      if (targetKm > 0) {
        if (rem <= 0) {
          overdueCount++;
        } else if (rem <= 1000) {
          dueSoonCount++;
        } else {
          upToDateCount++;
        }
      }

      // Map to category
      const typeLower = (s.serviceType || '').toLowerCase();
      let cat = detailsList.find((d) => {
        if (d.categoryKey === 'oil' && (typeLower.includes('روغن') || typeLower.includes('oil'))) return true;
        if (d.categoryKey === 'belt' && (typeLower.includes('تسمه') || typeLower.includes('belt'))) return true;
        if (d.categoryKey === 'brake' && (typeLower.includes('ترمز') || typeLower.includes('لنت') || typeLower.includes('brake'))) return true;
        if (d.categoryKey === 'plugs' && (typeLower.includes('شمع') || typeLower.includes('انژکتور') || typeLower.includes('plug'))) return true;
        return false;
      });

      if (!cat) {
        cat = detailsList[0]; // fallback
      }

      if (targetKm > 0) {
        let st: 'ok' | 'warning' | 'danger' = 'ok';
        let txt = '';
        if (rem <= 0) {
          st = 'danger';
          txt = `${Math.abs(rem).toLocaleString('fa-IR')} کیلومتر منقضی!`;
        } else if (rem <= 1000) {
          st = 'warning';
          txt = `تنها ${rem.toLocaleString('fa-IR')} کیلومتر مانده`;
        } else {
          st = 'ok';
          txt = `${rem.toLocaleString('fa-IR')} کیلومتر باقی مانده`;
        }

        cat.status = st;
        cat.statusText = txt;
        cat.remainingKm = rem;
        cat.lastMileage = s.mileageAtService;
        cat.nextMileage = s.nextServiceMileage;
      }
    });

    // Score calculation
    let baseScore = 100;

    if (serviceLogs.length === 0) {
      baseScore = currentKm > 5000 ? 55 : 80;
    } else {
      baseScore -= overdueCount * 28;
      baseScore -= dueSoonCount * 12;
      if (upToDateCount > 0 && overdueCount === 0) {
        baseScore = Math.min(100, baseScore + 5);
      }
    }

    const score = Math.max(20, Math.min(100, baseScore));

    let status: 'excellent' | 'good' | 'needs_attention' = 'excellent';
    let statusLabel = 'عالی';
    let summaryText = '';
    let statusColor = 'emerald';

    if (score >= 85) {
      status = 'excellent';
      statusLabel = 'عالی';
      statusColor = 'emerald';
      summaryText = 'تمام سرویس‌های دوره‌ای خودرو در محدوده زمان و کارکرد استاندارد و ایمن قرار دارند.';
    } else if (score >= 65) {
      status = 'good';
      statusLabel = 'خوب';
      statusColor = 'amber';
      summaryText = 'وضعیت خودرو مطلوب است؛ اما موعد تعویض برخی قطعات/روغن به زودی (زیر ۱۰۰۰ کیلومتر) فرامی‌رسد.';
    } else {
      status = 'needs_attention';
      statusLabel = 'نیازمند توجه';
      statusColor = 'rose';
      summaryText = serviceLogs.length === 0
        ? 'هنوز هیچ سرویس دوره‌ای برای این خودرو ثبت نشده است. برای پایش دقیق سلامت، اولین سرویس را ثبت کنید.'
        : 'توجه: موعد تعویض حداقل یک قطعه یا روغن مصرفی سپری شده است. پیشنهاد می‌شود سریع‌تر به تعمیرگاه مراجعه فرمایید.';
    }

    return {
      score,
      status,
      statusLabel,
      summaryText,
      statusColor,
      overdueCount,
      dueSoonCount,
      upToDateCount,
      detailsList,
      serviceLogsCount: serviceLogs.length,
      currentKm,
    };
  };

  const health = getHealthData(currentVehicle);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden space-y-6">
      
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 -ml-16 -mt-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Vehicle Selector */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-sky-400">
              <Activity className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white">کارت وضعیت سلامت کلی خودرو</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-bold border border-sky-500/30">
                پایش آنلاین گاراژ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تحلیل هوشمند فواصل تعویض روغن، تسمه‌ها، ترمز و شمع بر اساس کارکرد کیلومترشمار
            </p>
          </div>
        </div>

        {/* Multi-vehicle Tab Pills */}
        {vehicles.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-x-auto">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  currentVehicle.id === v.id
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{v.carBrand} {v.carModel}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Health Dashboard Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Dial / Gauge Score Card */}
        <div className="lg:col-span-5 bg-slate-800/60 rounded-2xl p-6 border border-slate-700/60 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-md">
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circular Progress Meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-700"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="9"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - health.score / 100)}
                strokeLinecap="round"
                stroke={
                  health.status === 'excellent'
                    ? '#10b981'
                    : health.status === 'good'
                    ? '#f59e0b'
                    : '#f43f5e'
                }
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center Content inside Dial */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {health.score}٪
              </span>
              <span className="text-[10px] font-bold text-slate-400">امتیاز سلامت</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-black text-xs shadow-md border animate-in fade-in"
              style={{
                backgroundColor: health.status === 'excellent' ? 'rgba(16, 185, 129, 0.15)' : health.status === 'good' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: health.status === 'excellent' ? '#34d399' : health.status === 'good' ? '#fbbf24' : '#fb7185',
                borderColor: health.status === 'excellent' ? 'rgba(52, 211, 153, 0.3)' : health.status === 'good' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 113, 133, 0.3)',
              }}
            >
              {health.status === 'excellent' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : health.status === 'good' ? (
                <Clock className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>وضعیت سلامت: {health.statusLabel}</span>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs mx-auto pt-1">
              {health.summaryText}
            </p>
          </div>

          {/* Quick Mileage Pill */}
          <div className="pt-2 border-t border-slate-700/60 w-full flex items-center justify-between text-xs text-slate-400 font-bold px-2">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>کارکرد فعلی:</span>
            </span>
            <span className="text-white font-mono font-extrabold">
              {health.currentKm.toLocaleString('fa-IR')} کیلومتر
            </span>
          </div>
        </div>

        {/* Right Categories Grid & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>ارزیابی اجزای مصرفی و سرویس‌های اصلی</span>
            </span>
            <span className="text-slate-400">
              {health.serviceLogsCount} سابقه ثبت‌شده
            </span>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health.detailsList.map((item, idx) => {
              const isDanger = item.status === 'danger';
              const isWarning = item.status === 'warning';
              const isOk = item.status === 'ok';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    isDanger
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                      : isWarning
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : isOk
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="text-xl shrink-0 mt-0.5">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-black text-white truncate">{item.title}</h4>
                      {isDanger && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      {isWarning && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {isOk && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <p className={`text-[11px] font-extrabold ${
                      isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : isOk ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {item.statusText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Toolbar */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenAddServiceModal?.(currentVehicle)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت سرویس دوره‌ای جدید</span>
            </button>

            <button
              onClick={() => onOpenUpdateMileageModal?.(currentVehicle)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>به‌روزرسانی کیلومترشمار</span>
            </button>

            <button
              onClick={() => onOpenAskMechanicModal?.(currentVehicle.carBrand, currentVehicle.carModel)}
              className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>مشاوره آنلاین مکانیک</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
