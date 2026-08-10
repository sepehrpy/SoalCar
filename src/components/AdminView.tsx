import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, MessageSquare, Wrench, CheckCircle2, Award } from 'lucide-react';
import { apiService } from '../services/api';
import { MechanicProfile } from '../types';

interface AdminViewProps {
  mechanics: MechanicProfile[];
  onVerifyMechanic: (id: number) => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({ mechanics, onVerifyMechanic }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await apiService.getAdminStats();
        setStats(s);
      } catch (e) {
        console.error(e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-purple-950 text-white p-8 rounded-3xl border border-purple-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900 text-purple-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>پنل مدیریت سیستم سوال‌کار</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">نظارت بر محتوا و تأیید مکانیک‌ها</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-2xl font-black text-slate-900 block">{stats.totalQuestions}</span>
            <span className="text-xs text-slate-500 font-bold">کل سوالات خودرو</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-2xl font-black text-sky-600 block">{stats.totalAnswers}</span>
            <span className="text-xs text-slate-500 font-bold">کل پاسخ‌های ثبت‌شده</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-2xl font-black text-emerald-600 block">{stats.totalMechanics}</span>
            <span className="text-xs text-slate-500 font-bold">مکانیک‌های ثبت‌شده</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-2xl font-black text-purple-600 block">{stats.totalUsers}</span>
            <span className="text-xs text-slate-500 font-bold">کل کاربران فعال</span>
          </div>
        </div>
      )}

      {/* Mechanics Verification Management Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600" />
          <span>مدیریت نشان مکانیک‌های تأییدشده</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">استادکار</th>
                <th className="p-3">نام تعمیرگاه</th>
                <th className="p-3">منطقه</th>
                <th className="p-3">امتیاز</th>
                <th className="p-3">وضعیت نشان</th>
                <th className="p-3 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mechanics.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-black text-slate-900">{m.displayName}</td>
                  <td className="p-3 text-slate-700 font-medium">{m.workshopName}</td>
                  <td className="p-3 text-slate-600">{m.district}</td>
                  <td className="p-3 font-bold text-amber-700">{m.reputationScore}</td>
                  <td className="p-3">
                    {m.isVerifiedBadge ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تأییدشده</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold">در انتظار بررسی</span>
                    )}
                  </td>
                  <td className="p-3 text-left">
                    {!m.isVerifiedBadge && (
                      <button
                        onClick={() => onVerifyMechanic(m.id)}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        اعطای نشان تأیید
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
