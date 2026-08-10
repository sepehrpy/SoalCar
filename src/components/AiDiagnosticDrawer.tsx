import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Wrench,
  Send,
  MessageSquare,
  MapPin,
  ExternalLink,
  Bot,
  User as UserIcon,
  Search,
  Globe,
  Navigation,
  Phone,
  RefreshCw,
  Star,
  Building2,
  ChevronLeft,
  History,
  Trash2,
  PlusCircle,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';
import { MechanicProfile } from '../types';
import {
  getAiHistory,
  saveAiSession,
  deleteAiSession,
  clearAllAiHistory,
  AiSessionHistoryItem
} from '../services/aiHistory';

interface AiDiagnosticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuestionFromAi: (data: {
    symptoms: string;
    carBrand: string;
    carModel: string;
    carYear?: number;
    aiDiagnosis?: string;
  }) => void;
  initialTab?: 'chat' | 'diagnose' | 'maps' | 'history';
  onSelectMechanic?: (slug: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Array<{ title: string; uri: string }>;
  timestamp: string;
}

export const AiDiagnosticDrawer: React.FC<AiDiagnosticDrawerProps> = ({
  isOpen,
  onClose,
  onAskQuestionFromAi,
  initialTab = 'chat',
  onSelectMechanic,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnose' | 'maps' | 'history'>(initialTab);

  // Active Session Tracking
  const [currentSessionId, setCurrentSessionId] = useState<string>(`session-${Date.now()}`);

  // Tab 1: Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'سلام! من چت‌بات تخصصی خودرو «سوال‌کار» با قدرت هوش مصنوعی Gemini و متصل به جستجوی آنلاین گوگل هستم. چطور می‌توانم در عیب‌یابی، کدهای خطا، قیمت قطعات یا انتخاب مکانیک به شما کمک کنم؟',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Tab 2: Smart Diagnosis Form
  const [symptoms, setSymptoms] = useState('');
  const [carBrand, setCarBrand] = useState('پژو');
  const [carModel, setCarModel] = useState('۲۰۶');
  const [carYear, setCarYear] = useState('۱۳۹۸');
  const [diagLoading, setDiagLoading] = useState(false);
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);

  // Tab 3: Maps Mechanic Locator
  const [issueQuery, setIssueQuery] = useState('تعمیر گیربکس اتوماتیک و دیاگ');
  const [locationQuery, setLocationQuery] = useState('تهران، ستارخان');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    recommendation: string;
    sources: Array<{ title: string; uri: string }>;
    mechanics: MechanicProfile[];
  } | null>(null);

  // Tab 4: History list state
  const [historyList, setHistoryList] = useState<AiSessionHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistoryList(getAiHistory());
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const handleStartNewChat = () => {
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setChatMessages([
      {
        id: 'welcome-msg',
        role: 'model',
        text: 'سلام! من چت‌بات تخصصی خودرو «سوال‌کار» هستم. یک گفت‌وگوی جدید شروع شد. چطور می‌توانم به شما کمک کنم؟',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Handle Multi-turn Chat Send
  const handleSendChatMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || chatLoading) return;

    const userMsgObj: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatMessages, userMsgObj];
    setChatMessages(newHistory);
    if (!customText) setInputMsg('');
    setChatLoading(true);

    try {
      const formattedHistory = newHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await apiService.chatWithGemini(formattedHistory, {
        carBrand,
        carModel,
        carYear: parseInt(carYear) || 1398,
      });

      const botMsgObj: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: res.reply,
        sources: res.groundingSources,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newHistory, botMsgObj];
      setChatMessages(finalMessages);

      // Auto save chat session to history
      saveAiSession({
        id: currentSessionId,
        type: 'chat',
        title: textToSend.slice(0, 60),
        carBrand,
        carModel,
        carYear,
        messages: finalMessages,
        createdAt: new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
      setHistoryList(getAiHistory());

    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'خطا در ارتباط با چت‌بات هوشمند. لطفاً مجدداً تلاش کنید.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Smart Single-Shot Diagnostic Analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || diagLoading) return;

    setDiagLoading(true);
    try {
      const res = await apiService.diagnoseVehicleSymptoms(
        symptoms,
        carBrand,
        carModel,
        parseInt(carYear) || 1398
      );
      const diagData = {
        text: res.diagnosis,
        sources: res.groundingSources || [],
      };
      setDiagResult(diagData);

      // Auto save diagnosis session to history
      const diagId = `diag-${Date.now()}`;
      saveAiSession({
        id: diagId,
        type: 'diagnosis',
        title: symptoms.slice(0, 60),
        carBrand,
        carModel,
        carYear,
        symptoms,
        diagnosisResult: diagData,
        createdAt: new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
      setHistoryList(getAiHistory());

    } catch (err) {
      console.error(err);
      setDiagResult({
        text: 'خطا در ارتباط با سرویس هوش مصنوعی. لطفاً مجدداً تلاش کنید.',
        sources: [],
      });
    } finally {
      setDiagLoading(false);
    }
  };

  // Handle Google Maps Mechanic Finder
  const handleSearchMapsMechanics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mapsLoading) return;

    setMapsLoading(true);
    try {
      const res = await apiService.findMechanicsWithMaps(issueQuery, locationQuery);
      setMapsResult({
        recommendation: res.recommendation,
        sources: res.groundingSources || [],
        mechanics: res.mechanics || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setMapsLoading(false);
    }
  };

  const handleLoadHistorySession = (session: AiSessionHistoryItem) => {
    if (session.type === 'chat' && session.messages) {
      setCurrentSessionId(session.id);
      setChatMessages(session.messages);
      if (session.carBrand) setCarBrand(session.carBrand);
      if (session.carModel) setCarModel(session.carModel);
      setActiveTab('chat');
    } else if (session.type === 'diagnosis' && session.diagnosisResult) {
      if (session.symptoms) setSymptoms(session.symptoms);
      if (session.carBrand) setCarBrand(session.carBrand);
      if (session.carModel) setCarModel(session.carModel);
      if (session.carYear) setCarYear(session.carYear);
      setDiagResult(session.diagnosisResult);
      setActiveTab('diagnose');
    }
  };

  const handleDeleteHistorySession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteAiSession(id);
    setHistoryList(updated);
  };

  const handleClearHistory = () => {
    clearAllAiHistory();
    setHistoryList([]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-3 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-sky-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">دستیار و چت‌بات جمینای (Gemini AI)</h2>
                <p className="text-[11px] text-slate-500 font-medium">متصل به سرچ و نقشه آنلاین گوگل جهت پاسخگویی دقیق</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>چت‌بات</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnose')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'diagnose'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>عیب‌یابی</span>
            </button>

            <button
              onClick={() => setActiveTab('maps')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'maps'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>مکانیک‌یاب</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer relative ${
                activeTab === 'history'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>تاریخچه</span>
              {historyList.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-purple-600 absolute top-1 left-1" />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Gemini Chatbot */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {/* Quick Prompts Bar & New Chat Button */}
            <div className="p-3 bg-white border-b border-slate-100 overflow-x-auto flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">پیشنهادات:</span>
                {[
                  'علت لرزش فرمان در سرعت ۱۲۰',
                  'زمان تعویض تسمه تایم پژو ۲۰۶',
                  'کد خطای P0300 چیست؟',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChatMessage(undefined, prompt)}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer border border-purple-100 shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleStartNewChat}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>گفت‌وگوی جدید</span>
              </button>
            </div>

            {/* Chat Thread Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-sky-600'
                        : 'bg-gradient-to-tr from-purple-600 to-sky-600 shadow-xs'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <UserIcon className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs font-medium leading-relaxed space-y-2 ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white rounded-tl-none'
                        : 'bg-white text-slate-800 rounded-tr-none border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Grounding Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                          <Globe className="w-3 h-3 text-sky-500" />
                          منابع آنلاین نتایج گوگل:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-sky-600 hover:underline bg-sky-50 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold"
                            >
                              <span>{src.title || 'منبع متصل'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <span
                      className={`text-[9px] block text-left font-mono font-bold ${
                        msg.role === 'user' ? 'text-sky-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-3 rounded-2xl border border-purple-100 w-max animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
                  <span>جمینای در حال تحلیل سوال و جستجوی منابع هوشمند...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="سوال خود را درباره خودرو بپرسید..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMsg.trim()}
                className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Smart Single Diagnostic Form */}
        {activeTab === 'diagnose' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
            <form onSubmit={handleAnalyze} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Wrench className="w-4 h-4 text-purple-600" />
                <span>مشخصات خودرو و شرح علائم برای تست هوشمند</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">برند</label>
                  <input
                    type="text"
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    className="w-full p-2 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">مدل</label>
                  <input
                    type="text"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full p-2 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">سال ساخت</label>
                  <input
                    type="text"
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value)}
                    className="w-full p-2 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">شرح علائم یا صدای غیرعادی</label>
                <textarea
                  rows={4}
                  required
                  placeholder="مثال: موقع ترمز گرفتن در سرعت بالا، فرمان شدیداً می‌لرزد و صدای سوت کم می‌آید..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={diagLoading || !symptoms.trim()}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{diagLoading ? 'در حال تحلیل با هوش مصنوعی Gemini...' : 'شروع عیب‌یابی تکنیکال'}</span>
              </button>
            </form>

            {/* Diagnosis Result Output */}
            {diagResult && (
              <div className="bg-white p-5 rounded-2xl border border-purple-200 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black text-purple-950">نتیجه عیب‌یابی تکنیکال هوش مصنوعی:</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                    Gemini 3.1
                  </span>
                </div>

                <div className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                  {diagResult.text}
                </div>

                {/* Grounding sources */}
                {diagResult.sources && diagResult.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">منابع معتبر گوگل:</span>
                    <div className="flex flex-wrap gap-1">
                      {diagResult.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold border border-purple-100"
                        >
                          <span>{src.title || 'منبع آنلاین'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    onAskQuestionFromAi({
                      symptoms,
                      carBrand,
                      carModel,
                      carYear: parseInt(carYear) || 1398,
                      aiDiagnosis: diagResult.text,
                    })
                  }
                  className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>ثبت عمومی این عیب‌یابی جهت پاسخ مکانیک‌های تاییدشده</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Google Maps Locator */}
        {activeTab === 'maps' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
            <form onSubmit={handleSearchMapsMechanics} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>جستجوی آنلاین تعمیرگاه در گوگل مپ بر اساس محدوده</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع خدمت یا تعمیر مورد نیاز</label>
                  <input
                    type="text"
                    value={issueQuery}
                    onChange={(e) => setIssueQuery(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">شهر و محدوده / محله شما</label>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={mapsLoading}
                className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-4 h-4 text-sky-200" />
                <span>{mapsLoading ? 'در حال جستجو روی نقشه گوگل...' : 'یافتن بهترین مکانیک با Google Maps'}</span>
              </button>
            </form>

            {mapsResult && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-sky-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-sky-900 pb-2 border-b border-sky-100">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    <span>توصیه هوشمند مکانیک بر اساس نقشه گوگل:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {mapsResult.recommendation}
                  </p>
                </div>

                {/* Verified Mechanics Cards with Shop Profile & Google Maps Links & Ratings */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900">پروفایل مغازه‌ها و لینک گوگل مپ همراه با امتیاز:</h3>
                  {mapsResult.mechanics.map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <h4 className="font-black text-xs text-slate-900">{m.workshopName || m.displayName}</h4>
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 mt-0.5">مدیریت: {m.displayName}</p>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="text-xs font-black">{m.ratingAverage || 4.9}</span>
                          <span className="text-[9px] font-bold text-amber-700">({m.ratingCount || m.reviews?.length || 28} نظر)</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-1 text-[11px] text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{m.address || m.district}</span>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.workshopName || m.displayName} ${m.address || m.district}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] rounded-xl border border-sky-200 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-sky-600" />
                          <span>لینک گوگل مپ مغازه</span>
                        </a>

                        {onSelectMechanic && (
                          <button
                            onClick={() => {
                              onSelectMechanic(m.slug);
                              onClose();
                            }}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>پروفایل مغازه</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: History Panel */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black text-slate-900">تاریخچه گفت‌وگوها و عیب‌یابی‌ها ({historyList.length})</h3>
              </div>

              {historyList.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاکسازی کامل تاریخچه</span>
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-white p-6 rounded-2xl border border-slate-200">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">هنوز هیچ تاریخچه‌ای ثبت نشده است.</p>
                <p className="text-[11px] text-slate-400">با انجام تست عیب‌یابی یا گفت‌وگو با چت‌بات، سوابق شما در اینجا ذخیره می‌شود.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistorySession(item)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            item.type === 'chat'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {item.type === 'chat' ? 'چت‌بات' : 'تست عیب‌یابی'}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                      </div>

                      <button
                        onClick={(e) => handleDeleteHistorySession(item.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="حذف این مورد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>خودرو: {item.carBrand} {item.carModel}</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
