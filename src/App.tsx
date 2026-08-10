import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { QuestionCard } from './components/QuestionCard';
import { QuestionDetailView } from './components/QuestionDetailView';
import { AskQuestionModal } from './components/AskQuestionModal';
import { MechanicDirectoryView } from './components/MechanicDirectoryView';
import { MechanicProfileView } from './components/MechanicProfileView';
import { MechanicDashboardView } from './components/MechanicDashboardView';
import { AiDiagnosticDrawer } from './components/AiDiagnosticDrawer';
import { ContactLeadModal } from './components/ContactLeadModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileView } from './components/UserProfileView';
import { AdminView } from './components/AdminView';
import { ArticleListView } from './components/ArticleListView';
import { ArticleDetailView } from './components/ArticleDetailView';
import { ArticleAdminView } from './components/ArticleAdminView';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ToastContainer, ToastMessage } from './components/Toast';

import { Question, MechanicProfile, Tag, User, UserRole, QuestionStatus } from './types';
import { apiService, getStoredUser, setStoredUser } from './services/api';
import { updateDocumentHead } from './hooks/useDocumentHead';
import { usePushNotifications } from './hooks/usePushNotifications';
import { MessageSquare, Sparkles, Filter, Car, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mechanics, setMechanics] = useState<MechanicProfile[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Selections
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedMechanicSlug, setSelectedMechanicSlug] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [contactMechanicTarget, setContactMechanicTarget] = useState<MechanicProfile | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'most_viewed' | 'unanswered'>('newest');

  // Modals
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [prefilledCarBrand, setPrefilledCarBrand] = useState<string | undefined>(undefined);
  const [prefilledCarModel, setPrefilledCarModel] = useState<string | undefined>(undefined);
  const [prefilledCarYear, setPrefilledCarYear] = useState<number | undefined>(undefined);
  const [prefilledTitle, setPrefilledTitle] = useState<string | undefined>(undefined);
  const [prefilledBody, setPrefilledBody] = useState<string | undefined>(undefined);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiInitialTab, setAiInitialTab] = useState<'chat' | 'diagnose' | 'maps'>('chat');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const pushNotifications = usePushNotifications(currentUser);

  const handleOpenAskModal = async (brand?: string, model?: string) => {
    setPrefilledTitle(undefined);
    setPrefilledBody(undefined);
    setPrefilledCarYear(undefined);
    if (brand && model) {
      setPrefilledCarBrand(brand);
      setPrefilledCarModel(model);
    } else if (currentUser) {
      try {
        const res = await apiService.getGarageVehicles(currentUser.id);
        if (res.vehicles && res.vehicles.length > 0) {
          setPrefilledCarBrand(res.vehicles[0].carBrand);
          setPrefilledCarModel(res.vehicles[0].carModel);
        } else {
          setPrefilledCarBrand(undefined);
          setPrefilledCarModel(undefined);
        }
      } catch {
        setPrefilledCarBrand(undefined);
        setPrefilledCarModel(undefined);
      }
    } else {
      setPrefilledCarBrand(undefined);
      setPrefilledCarModel(undefined);
    }
    setAskModalOpen(true);
  };

  const handleOpenAskModalFromAi = (data: {
    symptoms: string;
    carBrand: string;
    carModel: string;
    carYear?: number;
    aiDiagnosis?: string;
    title?: string;
    body?: string;
  }) => {
    const brand = data.carBrand || 'ایران خودرو';
    const model = data.carModel || '';
    const year = data.carYear || 1398;
    const symptoms = data.symptoms || '';

    setPrefilledCarBrand(brand);
    setPrefilledCarModel(model);
    setPrefilledCarYear(year);

    // If AI generated a structured title and body, use them directly
    if (data.title && data.body) {
      setPrefilledTitle(data.title);
      setPrefilledBody(data.body);
    } else {
      // Fallback formatting
      const shortSymptom = symptoms.length > 60 ? symptoms.slice(0, 60) + '...' : symptoms;
      const title = `علت ${shortSymptom} در ${brand} ${model}`;
      setPrefilledTitle(title);

      let body = `شرح کامل علائم و مشکل خودرو:\n${symptoms}`;
      if (data.aiDiagnosis) {
        body += `\n\n--- نتیجه عیب‌یابی اولیه هوش مصنوعی (Gemini AI) ---\n${data.aiDiagnosis}\n\nجهت بررسی نهایی و ارائه پاسخ تخصصی توسط مکانیک‌های محترم.`;
      }
      setPrefilledBody(body);
    }

    setAskModalOpen(true);
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = { id: Date.now().toString(), type, title, message };
    setToasts((prev) => [newToast, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Load
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    } else {
      // Load default user
      apiService.getCurrentUser(1).then((u) => {
        if (u) {
          setCurrentUser(u);
          setStoredUser(u);
        }
      });
    }

    fetchInitialData();
  }, []);

  // Update Document Head on activeTab changes
  useEffect(() => {
    if (activeTab === 'home') {
      updateDocumentHead({
        title: 'سوال‌کار | پلتفرم تخصصی پرسش و پاسخ و عیب‌یابی خودرو',
        description: 'مشاوره فنی آنلاین خودرو، عیب‌یابی هوشمند هوش مصنوعی و پاسخ‌دهی توسط تعمیرکاران و مکانیک‌های تأییدشده.',
        ogType: 'website',
      });
    } else if (activeTab === 'questions') {
      updateDocumentHead({
        title: 'بانک سوالات و عیب‌یابی خودرو | سوال‌کار',
        description: 'جستجو در بانک سوالات فنی، ایرادات گیربکس، موتور و سیستم برق انواع خودروهای ایرانی و خارجی.',
        ogType: 'website',
      });
    } else if (activeTab === 'mechanics') {
      updateDocumentHead({
        title: 'دایرکتوری مکانیک‌ها و تعمیرگاه‌های تخصصی | سوال‌کار',
        description: 'فهرست برترین تعمیرگاه‌ها، معتمدین فنی و متخصصین گیربکس، برق و تعلیق خودرو.',
        ogType: 'website',
      });
    } else if (activeTab === 'dashboard') {
      updateDocumentHead({
        title: 'پنل مدیریت مکانیک | سوال‌کار',
        description: 'مدیریت سوالات تخصصی کاربران، ارسال پاسخ کارشناسی و ارتقای امتیاز اعتبار.',
        ogType: 'website',
      });
    } else if (activeTab === 'admin') {
      updateDocumentHead({
        title: 'پنل مدیریت سیستم | سوال‌کار',
        description: 'نظارت بر محتوا و اعطای نشان تأیید به مکانیک‌های معتمد.',
        ogType: 'website',
      });
    }
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoadingQuestions(true);
    try {
      const [qData, mData, tData] = await Promise.all([
        apiService.getQuestions(),
        apiService.getMechanics(),
        apiService.getPopularTags(),
      ]);
      setQuestions(qData.questions);
      setMechanics(mData.mechanics);
      setPopularTags(tData.tags);
    } catch (e) {
      console.error('Failed to load data:', e);
      addToast('error', 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Switch Role helper for demo testing
  const handleSwitchUserRole = (newRole: UserRole) => {
    if (!currentUser) return;
    let updatedProfile = currentUser.mechanicProfile;
    if (newRole === UserRole.Mechanic && mechanics.length > 0) {
      updatedProfile = mechanics[0];
    }

    const updatedUser: User = {
      ...currentUser,
      role: newRole,
      mechanicProfile: updatedProfile,
    };
    setCurrentUser(updatedUser);
    setStoredUser(updatedUser);
    addToast('info', 'تغییر نقش کاربر', `نقش شما به ${newRole === UserRole.Mechanic ? 'مکانیک' : newRole === UserRole.Admin ? 'مدیر' : 'مالک خودرو'} تغییر یافت.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStoredUser(null);
    addToast('info', 'خروج از حساب', 'از حساب کاربری خارج شدید.');
  };

  // Question Click
  const handleSelectQuestion = async (q: Question) => {
    try {
      const res = await apiService.getQuestionBySlug(q.slug);
      setSelectedQuestion(res.question);
      setActiveTab('question-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setSelectedQuestion(q);
      setActiveTab('question-detail');
    }
  };

  // Mechanic Click
  const handleSelectMechanicSlug = (slug: string) => {
    setSelectedMechanicSlug(slug);
    setActiveTab('mechanic-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Question Handler
  const handleCreateQuestion = async (data: any) => {
    try {
      const res = await apiService.createQuestion({
        ...data,
        authorId: currentUser?.id || 1,
      });
      addToast('success', 'ثبت سوال با موفقیت انجام شد', res.message);
      await fetchInitialData();
      handleSelectQuestion(res.question);
    } catch (e: any) {
      addToast('error', 'خطا در ثبت سوال', e.message);
    }
  };

  // Submit Answer Handler
  const handleSubmitAnswer = async (questionId: number, body: string) => {
    try {
      const res = await apiService.submitAnswer(questionId, body, currentUser?.id || 2);
      addToast('success', 'پاسخ با موفقیت ارسال شد', res.message);
      
      // Refresh current question detail
      if (selectedQuestion) {
        const refreshed = await apiService.getQuestionBySlug(selectedQuestion.slug);
        setSelectedQuestion(refreshed.question);
      }
      fetchInitialData();
      pushNotifications.refreshNotifications();
    } catch (e: any) {
      addToast('error', 'خطا در ارسال پاسخ', e.message);
    }
  };

  // Accept Answer Handler
  const handleAcceptAnswer = async (questionId: number, answerId: number) => {
    try {
      const res = await apiService.acceptAnswer(questionId, answerId);
      addToast('success', 'پاسخ تأیید شد', res.message);
      if (selectedQuestion) {
        const refreshed = await apiService.getQuestionBySlug(selectedQuestion.slug);
        setSelectedQuestion(refreshed.question);
      }
      fetchInitialData();
    } catch (e: any) {
      addToast('error', 'خطا در تأیید پاسخ', e.message);
    }
  };

  // Vote Answer Handler
  const handleVoteAnswer = async (questionId: number, answerId: number, type: 'up' | 'down') => {
    try {
      await apiService.voteAnswer(questionId, answerId, type);
      if (selectedQuestion) {
        const refreshed = await apiService.getQuestionBySlug(selectedQuestion.slug);
        setSelectedQuestion(refreshed.question);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Admin Verify Mechanic
  const handleVerifyMechanic = async (id: number) => {
    try {
      const res = await apiService.verifyMechanic(id);
      addToast('success', 'تأیید مکانیک', res.message);
      fetchInitialData();
    } catch (e: any) {
      addToast('error', 'خطا در عملیات', e.message);
    }
  };

  // Update Mechanic Profile
  const handleUpdateMechanicProfile = async (updated: Partial<MechanicProfile>) => {
    if (!currentUser || !currentUser.mechanicProfile) return;
    const newProf = { ...currentUser.mechanicProfile, ...updated };
    const newU = { ...currentUser, mechanicProfile: newProf };
    setCurrentUser(newU);
    setStoredUser(newU);
    addToast('success', 'پروفایل به‌روزرسانی شد');
  };

  // Search Submit
  const handleSearchSubmit = () => {
    setActiveTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter questions list
  const displayQuestions = questions.filter((q) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const match =
        q.title.toLowerCase().includes(query) ||
        q.body.toLowerCase().includes(query) ||
        q.carBrand?.toLowerCase().includes(query) ||
        q.carModel?.toLowerCase().includes(query);
      if (!match) return false;
    }

    if (selectedBrandFilter !== 'All' && q.carBrand !== selectedBrandFilter) {
      return false;
    }

    if (selectedStatusFilter !== 'All' && q.status !== selectedStatusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a] font-['Vazirmatn'] selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAskModal={() => handleOpenAskModal()}
        onOpenAiDrawer={() => setAiDrawerOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSwitchUserRole={handleSwitchUserRole}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onOpenNotificationModal={() => setNotificationModalOpen(true)}
        unreadNotificationsCount={pushNotifications.unreadCount}
      />

      {/* Main Body Routing based on activeTab */}
      <main className="flex-1">
        
        {/* HOMEPAGE VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-12 pb-16">
            
            {/* Hero Banner with Search First */}
            <HeroSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              popularTags={popularTags}
              selectedBrand={selectedBrandFilter}
              setSelectedBrand={setSelectedBrandFilter}
              onOpenAskModal={() => handleOpenAskModal()}
              onOpenAiDrawer={() => setAiDrawerOpen(true)}
            />

            {/* Popular Questions Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-sky-700" />
                    <span>آخرین سوالات پربازدید خودرویی</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    پاسخ داده شده توسط کارشناسان فنی و مکانیک‌های مجرب
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('questions')}
                  className="px-4 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold rounded-xl transition-colors self-start sm:self-auto"
                >
                  مشاهده همه سوالات ({questions.length})
                </button>
              </div>

              {/* Questions List */}
              {loadingQuestions ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">در حال دریافت جدیدترین سوالات...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayQuestions.slice(0, 6).map((q) => (
                    <QuestionCard key={q.id} question={q} onClick={handleSelectQuestion} />
                  ))}
                </div>
              )}

            </section>

            {/* Featured Mechanics Preview */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      متخصصین برتر هفته
                    </span>
                    <h2 className="text-2xl font-black">مکانیک‌ها و استادیاران برجسته سوال‌کار</h2>
                  </div>

                  <button
                    onClick={() => setActiveTab('mechanics')}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                  >
                    دایرکتوری کامل مکانیک‌ها
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mechanics.slice(0, 2).map((m) => (
                    <div key={m.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.user?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                          alt={m.displayName}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-sky-400"
                        />
                        <div>
                          <h3 className="font-bold text-white text-base">{m.displayName}</h3>
                          <p className="text-xs text-slate-300 font-medium">{m.workshopName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{m.district}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {m.bio}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                        <span className="text-xs font-bold text-amber-400">
                          {m.reputationScore} امتیاز اعتبار
                        </span>
                        <button
                          onClick={() => handleSelectMechanicSlug(m.slug)}
                          className="text-xs font-bold text-sky-400 hover:underline"
                        >
                          مشاهده رزومه و تماس
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

          </div>
        )}

        {/* QUESTIONS DIRECTORY VIEW */}
        {activeTab === 'questions' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">بانک سوالات و عیب‌یابی خودرو</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    جستجو در تمام سوالات ثبت‌شده مالکان خودرو
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAskModal()}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  ثبت سوال جدید
                </button>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">فیلتر برند خودرو</label>
                  <select
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                  >
                    <option value="All">همه برندها</option>
                    <option value="ایران خودرو">ایران خودرو</option>
                    <option value="سایپا">سایپا</option>
                    <option value="پژو">پژو</option>
                    <option value="جک (JAC)">جک (JAC)</option>
                    <option value="هیوندای">هیوندای</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">وضعیت پاسخ‌دهی</label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                  >
                    <option value="All">همه سوالات</option>
                    <option value={QuestionStatus.Answered}>پاسخ داده شده</option>
                    <option value={QuestionStatus.Open}>در انتظار پاسخ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">مرتب‌سازی</label>
                  <select
                    value={selectedSort}
                    onChange={(e: any) => setSelectedSort(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                  >
                    <option value="newest">جدیدترین سوالات</option>
                    <option value="most_viewed">پربازدیدترین‌ها</option>
                    <option value="unanswered">بدون پاسخ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions Cards List */}
            {displayQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 space-y-4">
                <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-600">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">سوالی با این مشخصات یا فیلتر یافت نشد</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  می‌توانید فیلترهای جستجو را بازنشانی کنید یا خودتان سوال جدیدی درباره خودروی خود مطرح نمایید.
                </p>
                <button
                  onClick={() => handleOpenAskModal()}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-block"
                >
                  ثبت سوال جدید
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayQuestions.map((q) => (
                  <QuestionCard key={q.id} question={q} onClick={handleSelectQuestion} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUESTION DETAIL VIEW */}
        {activeTab === 'question-detail' && selectedQuestion && (
          <QuestionDetailView
            question={selectedQuestion}
            currentUser={currentUser}
            onBack={() => setActiveTab('questions')}
            onSubmitAnswer={handleSubmitAnswer}
            onAcceptAnswer={handleAcceptAnswer}
            onVoteAnswer={handleVoteAnswer}
            onOpenContactLead={(mech, qId) => {
              setContactMechanicTarget(mech);
              setContactModalOpen(true);
            }}
            onSelectMechanicSlug={handleSelectMechanicSlug}
          />
        )}

        {/* MECHANICS DIRECTORY VIEW */}
        {activeTab === 'mechanics' && (
          <MechanicDirectoryView
            mechanics={mechanics}
            onSelectMechanic={handleSelectMechanicSlug}
            onOpenContactLead={(mech) => {
              setContactMechanicTarget(mech);
              setContactModalOpen(true);
            }}
          />
        )}

        {/* MECHANIC PROFILE VIEW */}
        {activeTab === 'mechanic-profile' && selectedMechanicSlug && (
          <MechanicProfileView
            slug={selectedMechanicSlug}
            onBack={() => setActiveTab('mechanics')}
            onSelectQuestion={(slug) => {
              const found = questions.find((q) => q.slug === slug);
              if (found) handleSelectQuestion(found);
            }}
            onOpenContactLead={(mech) => {
              setContactMechanicTarget(mech);
              setContactModalOpen(true);
            }}
          />
        )}

        {/* MECHANIC DASHBOARD VIEW */}
        {activeTab === 'dashboard' && currentUser && (
          <MechanicDashboardView
            currentUser={currentUser}
            openQuestions={questions.filter((q) => q.status === QuestionStatus.Open)}
            onSelectQuestion={handleSelectQuestion}
            onUpdateProfile={handleUpdateMechanicProfile}
          />
        )}

        {/* USER PROFILE & GARAGE & SECURITY VIEW */}
        {activeTab === 'profile' && currentUser && (
          <UserProfileView
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              setStoredUser(updated);
              addToast('success', 'به‌روزرسانی موفق', 'مشخصات حساب شما با موفقیت بروز شد.');
            }}
            onNavigateToQuestion={(slug) => {
              const found = questions.find((q) => q.slug === slug);
              if (found) handleSelectQuestion(found);
            }}
            onOpenAskModalWithCar={(brand, model) => {
              handleOpenAskModal(brand, model);
            }}
            onLogout={handleLogout}
          />
        )}

        {/* ADMIN VIEW */}
        {activeTab === 'admin' && (
          <AdminView mechanics={mechanics} onVerifyMechanic={handleVerifyMechanic} />
        )}

        {/* ARTICLES CATALOG VIEW */}
        {activeTab === 'articles' && (
          <ArticleListView
            currentUser={currentUser}
            onSelectArticle={(slug) => {
              setSelectedArticleSlug(slug);
              setActiveTab('article-detail');
            }}
            onOpenAdminPanel={() => setActiveTab('article-admin')}
          />
        )}

        {/* ARTICLE DETAIL VIEW */}
        {activeTab === 'article-detail' && selectedArticleSlug && (
          <ArticleDetailView
            slug={selectedArticleSlug}
            onBack={() => setActiveTab('articles')}
            onSelectArticle={(slug) => {
              setSelectedArticleSlug(slug);
              setActiveTab('article-detail');
            }}
            onSelectQuestion={(q) => handleSelectQuestion(q)}
            onShowToast={(msg, type) => addToast(type === 'error' ? 'error' : 'success', msg)}
          />
        )}

        {/* ARTICLE ADMIN VIEW */}
        {activeTab === 'article-admin' && (
          <ArticleAdminView
            onClose={() => setActiveTab('articles')}
            onShowToast={(msg, type) => addToast(type === 'error' ? 'error' : 'success', msg)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
          <div>
            <span className="text-xl font-black text-white block">سوال‌کار.ir</span>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              پلتفرم تخصصی پرسش و پاسخ خودرو و مشاوره فنی با مکانیک‌های تأییدشده. تمامی حقوق محفوظ است.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
            <button onClick={() => setActiveTab('home')} className="hover:text-white">صفحه اصلی</button>
            <button onClick={() => setActiveTab('questions')} className="hover:text-white">سوالات</button>
            <button onClick={() => setActiveTab('mechanics')} className="hover:text-white">دایرکتوری مکانیک‌ها</button>
            <button onClick={() => setActiveTab('articles')} className="hover:text-white">مجله و مقالات</button>
          </div>
        </div>
      </footer>

      {/* Floating Gemini AI Chatbot Trigger */}
      <button
        onClick={() => {
          setAiInitialTab('chat');
          setAiDrawerOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-tr from-purple-600 via-sky-600 to-indigo-600 hover:scale-105 text-white font-extrabold rounded-full shadow-2xl flex items-center gap-2 cursor-pointer border-2 border-white/80 transition-all group"
        title="چت‌بات هوشمند جمینای و عیب‌یابی خودرو"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="text-xs hidden sm:inline font-black">چت‌بات جمینای (Gemini AI)</span>
      </button>

      {/* Modals & Drawers */}
      <AskQuestionModal
        isOpen={askModalOpen}
        onClose={() => {
          setAskModalOpen(false);
          setPrefilledCarBrand(undefined);
          setPrefilledCarModel(undefined);
          setPrefilledCarYear(undefined);
          setPrefilledTitle(undefined);
          setPrefilledBody(undefined);
        }}
        initialCarBrand={prefilledCarBrand}
        initialCarModel={prefilledCarModel}
        initialCarYear={prefilledCarYear}
        initialTitle={prefilledTitle}
        initialBody={prefilledBody}
        onSubmit={handleCreateQuestion}
        tags={popularTags}
        onAiDiagnose={async (symptoms, carBrand, carModel) => {
          const res = await apiService.diagnoseVehicleSymptoms(symptoms, carBrand, carModel);
          return res.diagnosis;
        }}
      />

      <AiDiagnosticDrawer
        isOpen={aiDrawerOpen}
        initialTab={aiInitialTab}
        onClose={() => setAiDrawerOpen(false)}
        onAskQuestionFromAi={(data) => {
          handleOpenAskModalFromAi(data);
        }}
        onSelectMechanic={(slug) => {
          setSelectedMechanicSlug(slug);
          setActiveTab('mechanics');
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          addToast('success', 'ورود موفقیت‌آمیز', `خوش آمدید ${user.username}`);
        }}
      />

      <ContactLeadModal
        isOpen={contactModalOpen}
        mechanic={contactMechanicTarget}
        questionId={selectedQuestion?.id}
        onClose={() => setContactModalOpen(false)}
        onSuccess={(msg) => addToast('success', 'ارسال درخواست', msg)}
      />

      <NotificationCenterModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        isSupported={pushNotifications.isSupported}
        permission={pushNotifications.permission}
        subscription={pushNotifications.subscription}
        notifications={pushNotifications.notifications}
        unreadCount={pushNotifications.unreadCount}
        loading={pushNotifications.loading}
        onEnableNotifications={pushNotifications.enableNotifications}
        onDisableNotifications={pushNotifications.disableNotifications}
        onSendTestNotification={pushNotifications.sendTestNotification}
        onMarkAsRead={pushNotifications.markAsRead}
        onCheckServiceReminders={pushNotifications.checkServiceReminders}
        onNavigateToUrl={async (url) => {
          if (url.includes('/question/')) {
            const slug = url.split('/question/')[1];
            if (slug) {
              try {
                const res = await apiService.getQuestionBySlug(slug);
                handleSelectQuestion(res.question);
              } catch {
                setActiveTab('questions');
              }
            } else {
              setActiveTab('questions');
            }
          } else if (url.includes('/profile')) {
            setActiveTab('profile');
          } else {
            setActiveTab('home');
          }
        }}
      />

    </div>
  );
}
