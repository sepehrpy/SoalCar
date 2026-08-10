import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  Smartphone,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Save,
  Lock,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Wrench,
  ChevronLeft,
  Eye,
  EyeOff,
  Check,
  Globe,
  HardDrive,
  Bot,
  ExternalLink,
  MessageSquare,
  Bell,
  Calendar,
  Gauge,
  AlertCircle,
  Activity,
  Info
} from 'lucide-react';
import { User, UserRole, Question } from '../types';
import { apiService } from '../services/api';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { getAiHistory, deleteAiSession, clearAllAiHistory, AiSessionHistoryItem } from '../services/aiHistory';
import { VehicleHealthCard } from './VehicleHealthCard';

interface UserProfileViewProps {
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
  onNavigateToQuestion: (slug: string) => void;
  onOpenAskModalWithCar?: (brand: string, model: string) => void;
  onLogout: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onUpdateCurrentUser,
  onNavigateToQuestion,
  onOpenAskModalWithCar,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'garage' | 'security' | 'activity' | 'diagnoses'>('profile');

  // AI History state
  const [aiHistory, setAiHistory] = useState<AiSessionHistoryItem[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    setAiHistory(getAiHistory());
  }, [activeTab]);

  useDocumentHead({
    title: `پروفایل کاربری ${currentUser.username} | سوال‌کار`,
    description: `مدیریت اطلاعات حساب کاربری، امنیت ورود، گاراژ خودروها و تاریخچه سوالات در سوال‌کار.`,
  });

  // Profile Edit state
  const [editUsername, setEditUsername] = useState(currentUser.username || '');
  const [editEmail, setEditEmail] = useState(currentUser.email || '');
  const [editPhone, setEditPhone] = useState(currentUser.phoneNumber || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar presets
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  ];

  // Garage state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingGarage, setLoadingGarage] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newBrand, setNewBrand] = useState('پژو');
  const [newModel, setNewModel] = useState('۲۰۶ تیپ ۲');
  const [newYear, setNewYear] = useState('1398');
  const [newMileage, setNewMileage] = useState('80000');
  const [newFuel, setNewFuel] = useState('بنزین');
  const [newLicense, setNewLicense] = useState('۵۵ ج ۴۴۴ ایران ۱۱');
  const [newNotes, setNewNotes] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Periodic Service Logs & Smart Reminders State
  const [selectedVehicleForServiceModal, setSelectedVehicleForServiceModal] = useState<any | null>(null);
  const [selectedVehicleForHistoryModal, setSelectedVehicleForHistoryModal] = useState<any | null>(null);
  const [selectedVehicleForMileageModal, setSelectedVehicleForMileageModal] = useState<any | null>(null);

  // Service Form State
  const [serviceType, setServiceType] = useState('تعویض روغن موتور و فیلترها (10W-40)');
  const [serviceMileage, setServiceMileage] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [savingService, setSavingService] = useState(false);

  // Mileage Update State
  const [updatedMileage, setUpdatedMileage] = useState('');
  const [updatingMileage, setUpdatingMileage] = useState(false);

  const SERVICE_PRESETS = [
    { label: 'تعویض روغن موتور و فیلترها (10W-40 / 5W-30)', defaultInterval: 5000, icon: '🛢️' },
    { label: 'تعویض تسمه تایم و بلبرینگ سفت‌کن', defaultInterval: 60000, icon: '⛓️' },
    { label: 'تعویض لنت ترمز جلو / عقب', defaultInterval: 30000, icon: '🛑' },
    { label: 'تعویض روغن گیربکس (واسکازین)', defaultInterval: 35000, icon: '⚙️' },
    { label: 'تعویض شمع و وایر شمع موتور', defaultInterval: 30000, icon: '⚡' },
    { label: 'تعویض ضدیخ و مایع خنک‌کننده رادیاتور', defaultInterval: 30000, icon: '❄️' },
    { label: 'تعویض فیلتر بنزین و شستشوی انژکتور', defaultInterval: 15000, icon: '⛽' },
    { label: 'سایر سرویس‌های دوره‌ای و فنی', defaultInterval: 10000, icon: '🛠️' },
  ];

  // Helper to calculate smart service notifications across all vehicles
  const getVehicleServiceAlerts = () => {
    const alerts: Array<{
      vehicle: any;
      record: any;
      remainingKm: number;
      status: 'overdue' | 'dueSoon';
    }> = [];

    for (const v of vehicles) {
      const currentKm = Number(v.mileage) || 0;
      if (!v.serviceLogs || !Array.isArray(v.serviceLogs)) continue;

      for (const record of v.serviceLogs) {
        const targetKm = Number(record.nextServiceMileage) || 0;
        if (!targetKm) continue;

        const remainingKm = targetKm - currentKm;
        if (remainingKm <= 0) {
          alerts.push({ vehicle: v, record, remainingKm, status: 'overdue' });
        } else if (remainingKm <= 1000) {
          alerts.push({ vehicle: v, record, remainingKm, status: 'dueSoon' });
        }
      }
    }

    return alerts.sort((a, b) => a.remainingKm - b.remainingKm);
  };

  // Security state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [secMsg, setSecMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [twoFactor, setTwoFactor] = useState(currentUser.twoFactorEnabled || false);
  const [toggling2FA, setToggling2FA] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [secLogs, setSecLogs] = useState<any[]>([]);
  const [loadingSecData, setLoadingSecData] = useState(false);

  // Activity state
  const [userQuestions, setUserQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, text: 'ضعیف', color: 'bg-rose-500' };
    if (score <= 4) return { score: 66, text: 'متوسط و خوب', color: 'bg-amber-500' };
    return { score: 100, text: 'عالی و بسیار امن', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  useEffect(() => {
    loadGarage();
    loadSecurityData();
    loadUserQuestions();
  }, [currentUser.id]);

  const loadGarage = async () => {
    setLoadingGarage(true);
    try {
      const res = await apiService.getGarageVehicles(currentUser.id);
      setVehicles(res.vehicles || []);
    } catch {
      // fallback
    } finally {
      setLoadingGarage(false);
    }
  };

  const loadSecurityData = async () => {
    setLoadingSecData(true);
    try {
      const [sessRes, logsRes] = await Promise.all([
        apiService.getActiveSessions(currentUser.id),
        apiService.getSecurityLogs(currentUser.id),
      ]);
      setSessions(sessRes.sessions || []);
      setSecLogs(logsRes.logs || []);
    } catch {
      // fallback
    } finally {
      setLoadingSecData(false);
    }
  };

  const loadUserQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await apiService.getQuestions();
      const myQs = res.questions.filter((q) => q.authorId === currentUser.id);
      setUserQuestions(myQs);
    } catch {
      // fallback
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await apiService.updateProfile({
        username: editUsername,
        email: editEmail,
        phoneNumber: editPhone,
        avatarUrl: editAvatar,
      }, currentUser.id);

      onUpdateCurrentUser(res.user);
      setProfileMsg({ type: 'success', text: 'مشخصات حساب شما با موفقیت بروزرسانی شد.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'خطا در ویرایش مشخصات.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingVehicle(true);
    try {
      const res = await apiService.addGarageVehicle({
        carBrand: newBrand,
        carModel: newModel,
        carYear: newYear,
        mileage: newMileage,
        fuelType: newFuel,
        licensePlateTag: newLicense,
        notes: newNotes,
      }, currentUser.id);

      setVehicles([...vehicles, res.vehicle]);
      setShowAddVehicleModal(false);
      setNewNotes('');
    } catch {
      alert('خطا در اضافه کردن خودرو.');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('آیا از حذف این خودرو از گاراژ خود اطمینان دارید؟')) return;
    try {
      await apiService.deleteGarageVehicle(id);
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch {
      alert('خطا در حذف خودرو');
    }
  };

  // Service Record & Mileage Handlers
  const handleOpenAddServiceModal = (v: any) => {
    const currKm = Number(v.mileage) || 0;
    setSelectedVehicleForServiceModal(v);
    setServiceType('تعویض روغن موتور و فیلترها (10W-40 / 5W-30)');
    setServiceMileage(currKm.toString());
    setNextServiceMileage((currKm + 5000).toString());
    try {
      setServiceDate(new Date().toLocaleDateString('fa-IR'));
    } catch {
      setServiceDate('1403/05/20');
    }
    setNextServiceDate('');
    setServiceCost('');
    setServiceNotes('');
  };

  const handleSelectPreset = (presetLabel: string) => {
    setServiceType(presetLabel);
    const found = SERVICE_PRESETS.find((p) => p.label === presetLabel);
    const currentKm = parseInt(serviceMileage) || 0;
    if (found && currentKm > 0) {
      setNextServiceMileage((currentKm + found.defaultInterval).toString());
    }
  };

  const handleSaveServiceRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForServiceModal) return;
    setSavingService(true);
    try {
      const res = await apiService.addVehicleServiceRecord(selectedVehicleForServiceModal.id, {
        serviceType,
        mileageAtService: serviceMileage,
        nextServiceMileage,
        serviceDate,
        nextServiceDate,
        cost: serviceCost,
        notes: serviceNotes,
      });

      setVehicles((prev) =>
        prev.map((v) => (v.id === res.vehicle.id ? res.vehicle : v))
      );
      setSelectedVehicleForServiceModal(null);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سرویس دوره‌ای');
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteServiceRecord = async (vehicleId: number, serviceId: string) => {
    if (!confirm('آیا از حذف این سابقه سرویس اطمینان دارید؟')) return;
    try {
      const res = await apiService.deleteVehicleServiceRecord(vehicleId, serviceId);
      setVehicles((prev) =>
        prev.map((v) => (v.id === res.vehicle.id ? res.vehicle : v))
      );
      if (selectedVehicleForHistoryModal?.id === vehicleId) {
        setSelectedVehicleForHistoryModal(res.vehicle);
      }
    } catch (err: any) {
      alert(err.message || 'خطا در حذف سابقه سرویس');
    }
  };

  const handleOpenMileageModal = (v: any) => {
    setSelectedVehicleForMileageModal(v);
    setUpdatedMileage((v.mileage || 0).toString());
  };

  const handleSaveMileage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForMileageModal) return;
    setUpdatingMileage(true);
    try {
      const res = await apiService.updateVehicleMileage(
        selectedVehicleForMileageModal.id,
        parseInt(updatedMileage) || 0
      );
      setVehicles((prev) =>
        prev.map((v) => (v.id === res.vehicle.id ? res.vehicle : v))
      );
      setSelectedVehicleForMileageModal(null);
    } catch (err: any) {
      alert(err.message || 'خطا در به‌روزرسانی کارکرد کیلومتر');
    } finally {
      setUpdatingMileage(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsg(null);
    if (newPassword !== confirmPassword) {
      setSecMsg({ type: 'error', text: 'رمز عبور جدید و تکرار آن یکسان نیستند.' });
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await apiService.updatePassword(currPassword, newPassword, currentUser.id);
      setSecMsg({ type: 'success', text: res.message });
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadSecurityData();
    } catch (err: any) {
      setSecMsg({ type: 'error', text: err.message || 'خطا در تغییر رمز عبور.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const nextState = !twoFactor;
      const res = await apiService.toggle2FA(nextState, currentUser.id);
      setTwoFactor(res.twoFactorEnabled);
      onUpdateCurrentUser({ ...currentUser, twoFactorEnabled: res.twoFactorEnabled });
      loadSecurityData();
    } catch {
      alert('خطا در تغییر وضعیت 2FA');
    } finally {
      setToggling2FA(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!confirm('آیا می‌خواهید تمامی نشست‌های دیگر فعال در سایر مرورگرها را ببندید؟')) return;
    try {
      await apiService.terminateOtherSessions(currentUser.id);
      setSessions(sessions.filter((s) => s.isCurrent));
    } catch {
      alert('خطا در بستن نشست‌ها');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Avatar with preset picker */}
          <div className="relative group">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={currentUser.username}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-sky-500/30 shadow-2xl"
            />
            <button
              onClick={() => setActiveTab('profile')}
              className="absolute bottom-1 left-1 p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs shadow-md"
              title="تغییر تصویر"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Basic Info */}
          <div className="text-center md:text-right flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">
                {currentUser.mechanicProfile?.displayName || currentUser.username}
              </h1>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-300 text-xs font-black rounded-full border border-sky-500/30 flex items-center gap-1">
                {currentUser.role === UserRole.Mechanic ? (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    <span>مکانیک و متخصص تأییدشده</span>
                  </>
                ) : (
                  <>
                    <Car className="w-3.5 h-3.5" />
                    <span>مالک خودرو</span>
                  </>
                )}
              </span>
              {twoFactor && (
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>2FA فعال</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 flex items-center justify-center md:justify-start gap-3">
              <span>ایمیل: {currentUser.email}</span>
              <span>•</span>
              <span>نام کاربری: @{currentUser.username}</span>
            </p>

            {/* Quick Stats bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>سوالات ثبت‌شده: <strong>{userQuestions.length}</strong></span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                <span>خودروهای گاراژ: <strong>{vehicles.length}</strong></span>
              </div>
              {currentUser.mechanicProfile?.reputationScore && (
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>امتیاز اعتبار: <strong>{currentUser.mechanicProfile.reputationScore}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-rose-500/30 shadow-md cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </button>
          </div>

        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>ویرایش مشخصات شخصی</span>
        </button>

        <button
          onClick={() => setActiveTab('garage')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'garage'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>گاراژ خودروهای من ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>امنیت و تنظیمات ورود</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سوالات و فعالیت‌ها ({userQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnoses')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'diagnoses'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>سوابق عیب‌یابی AI ({aiHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-sky-700" />
              <span>ویرایش مشخصات و آواتار کاربری</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              اطلاعات حساب کاربری، نام نمایش و آواتار شخصی خود را به‌روزرسانی کنید.
            </p>
          </div>

          {profileMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Avatar Selectors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                انتخاب آواتار از تصاویر پیشنهادی یا لینک مستقیم:
              </label>
              <div className="flex flex-wrap gap-3 items-center">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditAvatar(preset)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                      editAvatar === preset ? 'border-sky-600 ring-2 ring-sky-200 scale-105' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-12 h-12 rounded-lg object-cover" />
                    {editAvatar === preset && (
                      <span className="absolute inset-0 bg-sky-900/30 flex items-center justify-center text-white">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <input
                  type="text"
                  placeholder="یا لینک آدرس عکس جدید (Image URL)"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام کاربری (مستعار)</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">آدرس ایمیل</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شماره تلفن همراه</label>
                <input
                  type="text"
                  placeholder="09120000000"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع حساب کاربری</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.role === UserRole.Mechanic ? 'مکانیک / متخصص فنی' : 'مالک خودرو'}
                  className="w-full p-3 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات مشخصات'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY VEHICLES GARAGE */}
      {activeTab === 'garage' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-700" />
                <span>گاراژ تخصصی و مدیریت سرویس‌های دوره‌ای</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ثبت دقیق کارکرد کیلومتر، تاریخچه تعویض روغن و قطعات مصرفی با سیستم یادآور هوشمند موعد سرویس بعدی.
              </p>
            </div>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن خودرو جدید</span>
            </button>
          </div>

          {/* OVERALL VEHICLE HEALTH STATUS CARD */}
          <VehicleHealthCard
            vehicles={vehicles}
            onOpenAddServiceModal={handleOpenAddServiceModal}
            onOpenUpdateMileageModal={handleOpenMileageModal}
            onOpenAskMechanicModal={onOpenAskModalWithCar}
          />

          {/* SMART SERVICE REMINDER NOTIFICATION BANNER */}
          {(() => {
            const alerts = getVehicleServiceAlerts();
            if (alerts.length === 0) return null;

            const overdueCount = alerts.filter((a) => a.status === 'overdue').length;
            const dueSoonCount = alerts.filter((a) => a.status === 'dueSoon').length;

            return (
              <div className={`p-5 rounded-2xl border transition-all space-y-4 animate-in fade-in ${
                overdueCount > 0
                  ? 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-300 shadow-xs'
                  : 'bg-gradient-to-r from-amber-50 via-sky-50 to-amber-50 border-amber-300 shadow-xs'
              }`}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      overdueCount > 0 ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-500 text-white'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>اعلان هوشمند یادآوری سرویس‌های دوره‌ای</span>
                        <span className={`px-2 py-0.5 text-[11px] font-black rounded-full text-white ${
                          overdueCount > 0 ? 'bg-rose-600' : 'bg-amber-600'
                        }`}>
                          {alerts.length} مورد نیازمند توجه
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {overdueCount > 0
                          ? `${overdueCount} سرویس دوره‌ای خودروهای شما از کیلومتر سررسید گذشته است!`
                          : `${dueSoonCount} سرویس دوره‌ای تا ۱۰۰۰ کیلومتر آینده نیازمند تعویض و رسیدگی است.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1 border-t border-slate-200/60">
                  {alerts.map((alt, idx) => {
                    const isOverdue = alt.status === 'overdue';
                    const overdueAmount = Math.abs(alt.remainingKm);

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-white/90 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900">
                              🚗 {alt.vehicle.carBrand} {alt.vehicle.carModel}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              (کارکرد فعلی: {alt.vehicle.mileage?.toLocaleString('fa-IR')} کیلومتر)
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {alt.record.serviceType}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                            {isOverdue ? (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span className="text-rose-700 font-black">
                                  هشدار: موعد سرویس در {alt.record.nextServiceMileage?.toLocaleString('fa-IR')} کیلومتر بوده و {overdueAmount.toLocaleString('fa-IR')} کیلومتر از آن گذشته است!
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="text-amber-800 font-bold">
                                  یادآوری: موعد سرویس بعدی {alt.record.nextServiceMileage?.toLocaleString('fa-IR')} کیلومتر است (تنها {alt.remainingKm.toLocaleString('fa-IR')} کیلومتر باقی مانده).
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleOpenAddServiceModal(alt.vehicle)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ثبت تعویض مجدد</span>
                          </button>
                          <button
                            onClick={() => onOpenAskModalWithCar?.(alt.vehicle.carBrand, alt.vehicle.carModel)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                            <span>پرسش از مکانیک</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {vehicles.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <Car className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">هیچ خودرویی در گاراژ شما ثبت نشده است.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                افزودن خودرو به مکانیک‌ها کمک می‌کند تا با آگاهی از کارکرد و مدل دقیق خودرو، پاسخ‌های دقیق‌تری ارائه دهند.
              </p>
              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="mt-2 px-4 py-2 bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-sky-800 cursor-pointer"
              >
                + افزودن اولین خودرو
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all space-y-4 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black shadow-xs">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          {v.carBrand} {v.carModel} ({v.carYear})
                        </h3>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">
                          نوع سوخت: {v.fuelType || 'بنزین'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف از گاراژ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {v.licensePlateTag && (
                    <div className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-[11px] font-extrabold rounded-lg border border-amber-200">
                      پلاک: {v.licensePlateTag}
                    </div>
                  )}

                  {/* PER-VEHICLE HEALTH STATUS BADGE */}
                  {(() => {
                    const currentKm = Number(v.mileage) || 0;
                    const logs = Array.isArray(v.serviceLogs) ? v.serviceLogs : [];
                    let overdue = 0;
                    let dueSoon = 0;
                    logs.forEach((s: any) => {
                      const rem = (Number(s.nextServiceMileage) || 0) - currentKm;
                      if (s.nextServiceMileage) {
                        if (rem <= 0) overdue++;
                        else if (rem <= 1000) dueSoon++;
                      }
                    });

                    let healthLabel = 'عالی (۹۵٪)';
                    let healthClass = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                    let healthIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;

                    if (overdue > 0 || (logs.length === 0 && currentKm > 5000)) {
                      healthLabel = 'نیازمند توجه (۵۵٪)';
                      healthClass = 'bg-rose-50 text-rose-900 border-rose-200';
                      healthIcon = <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
                    } else if (dueSoon > 0) {
                      healthLabel = 'خوب (۸۰٪)';
                      healthClass = 'bg-amber-50 text-amber-900 border-amber-200';
                      healthIcon = <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
                    }

                    return (
                      <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${healthClass}`}>
                        <span className="flex items-center gap-1.5">
                          {healthIcon}
                          <span className="text-slate-800">وضعیت سلامت فنی:</span>
                        </span>
                        <span className="font-black">{healthLabel}</span>
                      </div>
                    );
                  })()}

                  {/* CURRENT ODOMETER MILEAGE BOX WITH EDIT BUTTON */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Gauge className="w-4 h-4 text-sky-600" />
                      <span>کارکرد فعلی کیلومتر:</span>
                      <span className="text-slate-900 font-extrabold text-sm font-mono">
                        {v.mileage?.toLocaleString('fa-IR') || 0} km
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenMileageModal(v)}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="ویرایش کارکرد کیلومترشمار"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>به‌روزرسانی</span>
                    </button>
                  </div>

                  {/* PERIODIC SERVICE SUMMARY SECTION */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <Wrench className="w-3.5 h-3.5 text-sky-600" />
                        <span>سرویس‌های دوره‌ای (تعویض روغن، تسمه...)</span>
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black">
                        {v.serviceLogs?.length || 0} مورد ثبت‌شده
                      </span>
                    </div>

                    {v.serviceLogs && v.serviceLogs.length > 0 ? (
                      <div className="space-y-1.5">
                        {v.serviceLogs.slice(0, 2).map((s: any) => {
                          const rem = (s.nextServiceMileage || 0) - (v.mileage || 0);
                          return (
                            <div key={s.id} className="flex items-center justify-between text-[11px] font-bold p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="truncate pl-2">
                                <span className="text-slate-800">{s.serviceType}</span>
                              </div>
                              <div className="shrink-0">
                                {rem <= 0 ? (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[10px] border border-rose-200">
                                    منقضی ({Math.abs(rem).toLocaleString('fa-IR')}km گذشته)
                                  </span>
                                ) : rem <= 1000 ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[10px] border border-amber-200">
                                    نزدیک ({rem.toLocaleString('fa-IR')}km مانده)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] border border-emerald-200">
                                    {rem.toLocaleString('fa-IR')}km مانده
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium italic py-1">
                        هنوز هیچ سرویس دوره‌ای برای این خودرو ثبت نشده است.
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenAddServiceModal(v)}
                        className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ثبت سرویس جدید</span>
                      </button>
                      <button
                        onClick={() => setSelectedVehicleForHistoryModal(v)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                        <span>سوابق کامل ({v.serviceLogs?.length || 0})</span>
                      </button>
                    </div>
                  </div>

                  {v.notes && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 font-medium">
                      یادداشت: {v.notes}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-200/60">
                    <span className="text-slate-400 text-[11px]">آخرین سرویس: {v.lastServiceDate}</span>
                    <button
                      onClick={() => onOpenAskModalWithCar?.(v.carBrand, v.carModel)}
                      className="text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>ثبت سوال درباره این خودرو</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Vehicle Modal */}
          {showAddVehicleModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Car className="w-4 h-4 text-sky-700" />
                    <span>افزودن خودرو جدید به گاراژ</span>
                  </h3>
                  <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddVehicle} className="space-y-3 text-xs font-bold">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 mb-1">برند خودرو</label>
                      <select
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border rounded-xl"
                      >
                        <option value="پژو">پژو</option>
                        <option value="سمند">سمند</option>
                        <option value="پراید">پراید</option>
                        <option value="دنا">دنا</option>
                        <option value="تارا">تارا</option>
                        <option value="رنو">رنو (ساندرو/ال۹۰)</option>
                        <option value="هیوندای">هیوندای</option>
                        <option value="کیا">کیا</option>
                        <option value="جک">جک</option>
                        <option value="چری">چری / ام‌وی‌ام</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">مدل و تیپ</label>
                      <input
                        type="text"
                        required
                        placeholder="مثلاً: ۲۰۶ تیپ ۵ یا EF7"
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 mb-1">سال ساخت</label>
                      <input
                        type="number"
                        placeholder="1398"
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">کارکرد (کیلومتر)</label>
                      <input
                        type="number"
                        placeholder="85000"
                        value={newMileage}
                        onChange={(e) => setNewMileage(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">نوع سوخت</label>
                      <select
                        value={newFuel}
                        onChange={(e) => setNewFuel(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border rounded-xl"
                      >
                        <option value="بنزین">بنزین</option>
                        <option value="دوگانه‌سوز">دوگانه‌سوز</option>
                        <option value="هیبرید">هیبرید</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">شماره پلاک (اختیاری)</label>
                    <input
                      type="text"
                      placeholder="مثلاً: ۶۸ ج ۳۴۵ ایران ۴۴"
                      value={newLicense}
                      onChange={(e) => setNewLicense(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">یادداشت فنی / توضیحات</label>
                    <textarea
                      rows={2}
                      placeholder="مثلاً: گیربکس تازه تعمیر شده، روغن موتور ۱۰w۴۰..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddVehicleModal(false)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={addingVehicle}
                      className="px-4 py-2 bg-sky-700 text-white rounded-xl shadow-xs hover:bg-sky-800"
                    >
                      {addingVehicle ? 'در حال ثبت...' : 'ثبت خودرو در گاراژ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOGIN SECURITY & 2FA */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Change Password Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-sky-700" />
                <span>تغییر و ارتقای امنیت رمز عبور</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                برای امنیت بیشتر حساب خود، از رمز عبور مرکب شامل حروف و اعداد استفاده کنید.
              </p>
            </div>

            {secMsg && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold border ${
                  secMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {secMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز عبور فعلی</label>
                <input
                  type="password"
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">رمز عبور جدید</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'مخفی‌سازی' : 'نمایش رمز'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>قدرت رمز عبور:</span>
                      <span className="font-black text-slate-900">{strength.text}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تکرار رمز عبور جدید</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{updatingPassword ? 'در حال ثبت...' : 'تغییر رمز عبور'}</span>
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication (2FA) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-sky-700" />
                  <span>ورود ۲ مرحله‌ای امنیتی (2FA)</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  با فعال‌سازی ورود دو مرحله‌ای، هنگام ورود از دستگاه‌های جدید یک کد تایید یک‌بارمصرف به ایمیل یا پیامک شما ارسال می‌شود.
                </p>
              </div>

              <button
                onClick={handleToggle2FA}
                disabled={toggling2FA}
                className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border flex items-center gap-2 cursor-pointer ${
                  twoFactor
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Shield className={`w-4 h-4 ${twoFactor ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{twoFactor ? 'فعال است (غیرفعال‌سازی)' : 'فعال‌سازی 2FA'}</span>
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-700" />
                  <span>نشست‌های فعال و دستگاه‌های متصل</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  دستگاه‌ها و مرورگرهایی که هم‌اکنون به این حساب متصل هستند.
                </p>
              </div>

              <button
                onClick={handleTerminateOtherSessions}
                className="px-3.5 py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition-all"
              >
                خروج از سایر نشست‌ها
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{s.deviceName}</span>
                        {s.isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                            نشست کنونی
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        مرورگر: {s.browser} • آی‌پی: {s.ipAddress} • موقعیت: {s.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{s.lastActive}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Log */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-700" />
                <span>تاریخچه رویدادهای امنیتی حساب</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                آخرین ورودهای موفق، تغییرات رمز عبور و تنظیمات امنیتی ثبت‌شده در سامانه.
              </p>
            </div>

            <div className="space-y-2">
              {secLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{log.description}</p>
                      <p className="text-[10px] text-slate-400">آدرس آی‌پی: {log.ipAddress}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleDateString('fa-IR')} - {new Date(log.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: MY ACTIVITIES */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-700" />
              <span>تاریخچه پرسش‌های مطرح‌شده توسط شما</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              لیست کامل سوالات خودرویی ثبت‌شده به همراه وضعیت پاسخ مکانیک‌ها.
            </p>
          </div>

          {userQuestions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">هنوز هیچ سوالی ثبت نکرده‌اید.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                اگر خودرو شما صدا می‌دهد یا دچار افت شتاب شده، همین حالا سوال خود را از مکانیک‌ها بپرسید.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => onNavigateToQuestion(q.slug)}
                  className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 text-[11px] font-extrabold rounded-full">
                      {q.carBrand} {q.carModel}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      بازدید: {q.viewCount} • پاسخ‌ها: {q.answers?.length || 0}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{q.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{q.body}</p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60">
                    <span>ثبت در تاریخ: {new Date(q.createdAt).toLocaleDateString('fa-IR')}</span>
                    <span className="text-sky-700 font-bold flex items-center gap-1">
                      <span>مشاهده جزئیات و پاسخ‌ها</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI DIAGNOSTICS & CHAT HISTORY */}
      {activeTab === 'diagnoses' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>سوابق عیب‌یابی تکنیکال و گفتگوهای هوش مصنوعی (Gemini)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                لیست تمام آزمایش‌های عیب‌یابی هوشمند و گفتگوهای ثبت‌شده خودروهای شما.
              </p>
            </div>

            {aiHistory.length > 0 && (
              <button
                onClick={() => {
                  clearAllAiHistory();
                  setAiHistory([]);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی کامل سوابق AI</span>
              </button>
            )}
          </div>

          {aiHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <Sparkles className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">هنوز هیچ عیب‌یابی هوشمندی ثبت نشده است.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                شما می‌توانید با زدن روی دکمه دستیار هوشمند Gemini در منوی بالای سایت، تست عیب‌یابی خودروی خود را انجام دهید تا در اینجا ذخیره شود.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiHistory.map((item) => {
                const isExpanded = expandedSessionId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-slate-50/80 hover:bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              item.type === 'chat'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-sky-100 text-sky-900 border border-sky-200'
                            }`}
                          >
                            {item.type === 'chat' ? 'گفتگوی چت‌بات' : 'تست عیب‌یابی'}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            خودرو: {item.carBrand} {item.carModel} ({item.carYear || '۱۳۹۸'})
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono font-bold">{item.createdAt}</span>
                        <button
                          onClick={() => {
                            const updated = deleteAiSession(item.id);
                            setAiHistory(updated);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="حذف این سابقه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expand/Collapse Toggle Button */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : item.id)}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'بستن جزئیات پاسخ AI' : 'مشاهده متن کامل تحلیل هوش مصنوعی'}</span>
                        <ChevronLeft className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {item.type === 'diagnosis' && item.diagnosisResult && onOpenAskModalWithCar && (
                        <button
                          onClick={() => onOpenAskModalWithCar(item.carBrand || 'پژو', item.carModel || '۲۰۶')}
                          className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold rounded-lg border border-sky-200 flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                          <span>طرح سوال عمومی از مکانیک‌ها</span>
                        </button>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in">
                        {item.type === 'diagnosis' && item.diagnosisResult && (
                          <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                            {item.diagnosisResult.text}
                          </div>
                        )}

                        {item.type === 'chat' && item.messages && (
                          <div className="space-y-2 max-h-80 overflow-y-auto p-2 bg-slate-100/50 rounded-xl">
                            {item.messages.map((m) => (
                              <div
                                key={m.id}
                                className={`p-2.5 rounded-xl text-xs ${
                                  m.role === 'user'
                                    ? 'bg-sky-600 text-white mr-auto max-w-[85%]'
                                    : 'bg-white text-slate-800 ml-auto max-w-[85%] border border-slate-200'
                                }`}
                              >
                                <span className="block font-bold text-[10px] opacity-75 mb-0.5">
                                  {m.role === 'user' ? 'شما:' : 'هوش مصنوعی Gemini:'}
                                </span>
                                <p className="whitespace-pre-line">{m.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD SERVICE RECORD */}
      {selectedVehicleForServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-sky-700" />
                  <span>ثبت سرویس دوره‌ای جدید</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  خودرو: {selectedVehicleForServiceModal.carBrand} {selectedVehicleForServiceModal.carModel} (کارکرد فعلی: {selectedVehicleForServiceModal.mileage?.toLocaleString('fa-IR')} کیلومتر)
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicleForServiceModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Preset Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">
                انتخاب سریع نوع سرویس پیشنهادی:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                      serviceType === p.label
                        ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label.split('(')[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveServiceRecord} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">عنوان کامل سرویس دوره‌ای</label>
                <input
                  type="text"
                  required
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:border-sky-500 text-slate-900 font-bold"
                  placeholder="مثلاً: تعویض روغن موتور و فیلترها (10W-40)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">کیلومتر فعلی خودرو هنگام سرویس</label>
                  <input
                    type="number"
                    required
                    value={serviceMileage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setServiceMileage(val);
                      const num = parseInt(val) || 0;
                      if (num > 0) setNextServiceMileage((num + 5000).toString());
                    }}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">
                    کیلومتر سررسید سرویس بعدی (ارسال یادآور)
                  </label>
                  <input
                    type="number"
                    required
                    value={nextServiceMileage}
                    onChange={(e) => setNextServiceMileage(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">تاریخ انجام سرویس</label>
                  <input
                    type="text"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                    placeholder="1403/05/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">هزینه پرداختی به تومان (اختیاری)</label>
                  <input
                    type="number"
                    value={serviceCost}
                    onChange={(e) => setServiceCost(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                    placeholder="مثلاً: 1450000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">یادداشت، برند قطعه یا روغن مصرفی</label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                  placeholder="مثلاً: روغن بهران سوپر پیشتاز + فیلتر سرکان و فیلتر اتاق تعویض شد..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForServiceModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingService ? 'در حال ثبت...' : 'ثبت سرویس و تنظیم یادآور هوشمند'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SERVICE HISTORY LOGS */}
      {selectedVehicleForHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-700" />
                  <span>کارت سوابق کامل سرویس‌های دوره‌ای</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  خودرو: {selectedVehicleForHistoryModal.carBrand} {selectedVehicleForHistoryModal.carModel} • کارکرد فعلی: {selectedVehicleForHistoryModal.mileage?.toLocaleString('fa-IR')} کیلومتر
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicleForHistoryModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {(!selectedVehicleForHistoryModal.serviceLogs || selectedVehicleForHistoryModal.serviceLogs.length === 0) ? (
                <div className="text-center py-8 text-slate-500 text-xs font-bold space-y-2">
                  <p>هیچ سابقه سرویس دوره‌ای برای این خودرو ثبت نشده است.</p>
                  <button
                    onClick={() => {
                      const v = selectedVehicleForHistoryModal;
                      setSelectedVehicleForHistoryModal(null);
                      handleOpenAddServiceModal(v);
                    }}
                    className="px-4 py-2 bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + ثبت اولین سرویس
                  </button>
                </div>
              ) : (
                selectedVehicleForHistoryModal.serviceLogs.map((s: any) => {
                  const currentKm = Number(selectedVehicleForHistoryModal.mileage) || 0;
                  const targetKm = Number(s.nextServiceMileage) || 0;
                  const remKm = targetKm - currentKm;
                  const isOverdue = remKm <= 0;
                  const isDueSoon = remKm > 0 && remKm <= 1000;

                  return (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>{s.serviceType}</span>
                            {isOverdue ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md border border-rose-200">
                                🔴 سررسید گذشته ({Math.abs(remKm).toLocaleString('fa-IR')} کیلومتر)
                              </span>
                            ) : isDueSoon ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md border border-amber-200">
                                🟡 زمان تعویض نزدیک است ({remKm.toLocaleString('fa-IR')} کیلومتر مانده)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                                🟢 وضعیت عادی ({remKm.toLocaleString('fa-IR')} کیلومتر مانده)
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-bold mt-1">
                            تاریخ سرویس: {s.serviceDate} • کیلومتر زمان سرویس: {s.mileageAtService?.toLocaleString('fa-IR')} km • موعد سرویس بعدی: {s.nextServiceMileage?.toLocaleString('fa-IR')} km
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteServiceRecord(selectedVehicleForHistoryModal.id, s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="حذف این سابقه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {s.cost && (
                        <p className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg inline-block border border-sky-100">
                          هزینه پرداختی: {Number(s.cost).toLocaleString('fa-IR')} تومان
                        </p>
                      )}

                      {s.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 font-medium">
                          توضیحات: {s.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const v = selectedVehicleForHistoryModal;
                  setSelectedVehicleForHistoryModal(null);
                  handleOpenAddServiceModal(v);
                }}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت سرویس جدید برای این خودرو</span>
              </button>

              <button
                onClick={() => setSelectedVehicleForHistoryModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UPDATE MILEAGE */}
      {selectedVehicleForMileageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-700" />
                <span>به‌روزرسانی کیلومتر فعلی</span>
              </h3>
              <button
                onClick={() => setSelectedVehicleForMileageModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              کارکرد جدید کیلومترشمار خودروی <span className="font-bold text-slate-900">{selectedVehicleForMileageModal.carBrand} {selectedVehicleForMileageModal.carModel}</span> را وارد کنید:
            </p>

            <form onSubmit={handleSaveMileage} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">کارکرد جدید (کیلومتر)</label>
                <input
                  type="number"
                  required
                  value={updatedMileage}
                  onChange={(e) => setUpdatedMileage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-black text-sm"
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 font-medium">
                💡 با به روزرسانی کارکرد، زمان باقی‌مانده تعویض روغن و سرویس‌های دوره‌ای به صورت خودکار محاسبه مجدد می‌شود.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForMileageModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={updatingMileage}
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {updatingMileage ? 'در حال ثبت...' : 'ثبت و بروزرسانی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
