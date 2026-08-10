import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Star,
  Building2,
  ChevronLeft,
  ShieldCheck,
  Phone,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { MechanicProfile } from '../types';

interface InteractiveMechanicMapProps {
  mechanics: MechanicProfile[];
  onSelectMechanic?: (slug: string) => void;
  selectedDistrict?: string;
  onDistrictSelect?: (district: string) => void;
}

// Coordinates mapping for Tehran major districts on our interactive canvas (percentages x, y)
const DISTRICT_MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  'ستارخان': { x: 38, y: 48 },
  'عباس‌آباد (بهشتی)': { x: 55, y: 42 },
  'تجریش / شمال تهران': { x: 52, y: 18 },
  'خیابان آزادی': { x: 32, y: 58 },
  'تهرانپارس': { x: 80, y: 35 },
  'پیروزی': { x: 75, y: 62 },
  'سهروردی': { x: 58, y: 46 },
};

export const InteractiveMechanicMap: React.FC<InteractiveMechanicMapProps> = ({
  mechanics,
  onSelectMechanic,
  selectedDistrict,
  onDistrictSelect,
}) => {
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicProfile | null>(
    mechanics.length > 0 ? mechanics[0] : null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Assign relative coordinates to mechanics
  const mechanicsWithCoords = mechanics.map((m, idx) => {
    const pos = DISTRICT_MAP_POSITIONS[m.district] || {
      x: 35 + (idx * 15) % 50,
      y: 30 + (idx * 12) % 40,
    };
    return { ...m, coords: pos };
  });

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-100 space-y-0 relative">
      
      {/* Map Control Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">نقشه تعاملی تعمیرگاه‌ها و مکانیک‌ها (تهران)</h3>
            <p className="text-[10px] text-slate-400 font-medium">موقعیت زنده همراه با لینک مستقیم گوگل مپ و امتیاز مشتریان</p>
          </div>
        </div>

        {/* Zoom & District filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.6))}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="بزرگ‌نمایی"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-1 font-bold text-slate-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="کوچک‌نمایی"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="بازنشانی"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Popup Overlay */}
      <div className="relative min-h-[380px] sm:min-h-[440px] bg-[#0f172a] overflow-hidden select-none">
        
        {/* Dark Styled Map Grid Canvas Background */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Custom SVG Stylized Map Layout representing Tehran Major Highways & Districts */}
          <svg className="w-full h-full opacity-40" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Simulated Main Highways (Hemmat, Hakim, Chamran, Resalat) */}
            <path d="M 50 200 Q 500 220 950 180" stroke="#38bdf8" strokeWidth="4" fill="none" opacity="0.6" strokeDasharray="6 6" />
            <path d="M 50 300 Q 500 320 950 280" stroke="#0ea5e9" strokeWidth="5" fill="none" opacity="0.7" />
            <path d="M 50 420 Q 500 400 950 450" stroke="#0284c7" strokeWidth="4" fill="none" opacity="0.5" />
            <path d="M 380 50 Q 400 300 350 550" stroke="#38bdf8" strokeWidth="4" fill="none" opacity="0.6" />
            <path d="M 580 50 Q 560 300 600 550" stroke="#0284c7" strokeWidth="3" fill="none" opacity="0.5" />

            {/* District Labels on SVG */}
            <text x="380" y="270" fill="#94a3b8" fontSize="14" fontWeight="bold">بزرگراه یادگار امام / ستارخان</text>
            <text x="550" y="240" fill="#94a3b8" fontSize="14" fontWeight="bold">بزرگراه مدرس / عباس‌آباد</text>
            <text x="520" y="100" fill="#94a3b8" fontSize="14" fontWeight="bold">میدان تجریش / نیاوران</text>
            <text x="280" y="380" fill="#94a3b8" fontSize="14" fontWeight="bold">میدان آزادی / استاد معین</text>
            <text x="780" y="200" fill="#94a3b8" fontSize="14" fontWeight="bold">تهرانپارس / فلکه اول</text>
          </svg>

          {/* Mechanic Pins on Map */}
          {mechanicsWithCoords.map((m) => {
            const isSelected = selectedMechanic?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMechanic(m)}
                style={{ left: `${m.coords.x}%`, top: `${m.coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {/* Pin Pulse Glow */}
                <div
                  className={`absolute -inset-2 rounded-full transition-opacity ${
                    isSelected ? 'bg-amber-400/40 animate-ping' : 'bg-sky-400/20 group-hover:bg-sky-400/40'
                  }`}
                />

                {/* Marker Badge */}
                <div
                  className={`relative px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-300 scale-110 z-30 shadow-amber-500/20'
                      : 'bg-slate-800/90 text-white font-bold border-sky-500/40 hover:scale-105 hover:bg-slate-800'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-sky-400'}`} />
                  <span className="text-[11px] whitespace-nowrap">{m.workshopName || m.displayName}</span>
                  <div className="flex items-center gap-0.5 mr-1 text-[10px] text-amber-300 bg-black/30 px-1.5 py-0.5 rounded-lg">
                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                    <span>{m.ratingAverage || 4.9}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Mechanic Floating Card / Bottom Drawer */}
        {selectedMechanic && (
          <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:max-w-md bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl border border-slate-700/80 shadow-2xl z-40 space-y-3 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedMechanic.avatarUrl || selectedMechanic.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                  alt={selectedMechanic.displayName}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-sky-500/40 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm text-white">{selectedMechanic.workshopName}</h4>
                    {selectedMechanic.isVerifiedBadge && (
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">مدیریت: {selectedMechanic.displayName}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="bg-amber-400/10 border border-amber-400/30 text-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black">{selectedMechanic.ratingAverage || 4.9}</span>
                <span className="text-[10px] text-amber-200 font-bold">({selectedMechanic.ratingCount || 28})</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-slate-300 font-medium bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/50">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>{selectedMechanic.address || selectedMechanic.district}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedMechanic.workshopName || selectedMechanic.displayName} ${selectedMechanic.address || selectedMechanic.district}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>مسیریابی در Google Maps</span>
              </a>

              {onSelectMechanic && (
                <button
                  onClick={() => onSelectMechanic(selectedMechanic.slug)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                >
                  <span>پروفایل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
