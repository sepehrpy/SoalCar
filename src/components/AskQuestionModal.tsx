import React, { useState, useEffect } from 'react';
import { X, Car, Plus, Sparkles, Image as ImageIcon, Send, AlertCircle, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { Tag } from '../types';
import { CAR_BRANDS_DATABASE, getModelsByBrandName, getTrimsByBrandAndModel } from '../data/carModels';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    body: string;
    carBrand: string;
    carModel: string;
    carYear: number;
    tagIds: number[];
  }) => Promise<void>;
  tags: Tag[];
  onAiDiagnose: (symptoms: string, carBrand: string, carModel: string) => Promise<string>;
  initialCarBrand?: string;
  initialCarModel?: string;
  initialCarYear?: number;
  initialTitle?: string;
  initialBody?: string;
}

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tags,
  onAiDiagnose,
  initialCarBrand,
  initialCarModel,
  initialCarYear,
  initialTitle,
  initialBody,
}) => {
  const [title, setTitle] = useState('');
  const [carBrand, setCarBrand] = useState('ایران خودرو');
  const [carModel, setCarModel] = useState('پژو ۲۰۶');
  const [carTrim, setCarTrim] = useState('تیپ ۵');
  const [carYear, setCarYear] = useState<number>(1399);
  const [body, setBody] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [restoredDraftMessage, setRestoredDraftMessage] = useState<string | null>(null);

  // Available models based on selected brand
  const availableModels = getModelsByBrandName(carBrand);
  const availableTrims = getTrimsByBrandAndModel(carBrand, carModel);

  // Load initial car or draft from localStorage
  useEffect(() => {
    if (isOpen) {
      if (initialCarBrand) setCarBrand(initialCarBrand);
      if (initialCarModel) setCarModel(initialCarModel);
      if (initialCarYear) setCarYear(initialCarYear);
      if (initialTitle) setTitle(initialTitle);
      if (initialBody) setBody(initialBody);

      // Only load draft from localStorage if NO explicit initialTitle or initialBody was passed
      if (!initialTitle && !initialBody) {
        try {
          const saved = localStorage.getItem('soalcar_draft_question_v2');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.title) setTitle(parsed.title);
            if (parsed.body) setBody(parsed.body);
            if (!initialCarBrand && parsed.carBrand) setCarBrand(parsed.carBrand);
            if (!initialCarModel && parsed.carModel) setCarModel(parsed.carModel);
            if (parsed.carTrim) setCarTrim(parsed.carTrim);
            if (parsed.carYear) setCarYear(parsed.carYear);
            setRestoredDraftMessage('پیش‌نویس قبلی شما به صورت خودکار بازیابی شد.');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen, initialCarBrand, initialCarModel, initialCarYear, initialTitle, initialBody]);

  // Auto-save to localStorage
  useEffect(() => {
    if (title || body) {
      const draft = { title, body, carBrand, carModel, carTrim, carYear };
      localStorage.setItem('soalcar_draft_question_v2', JSON.stringify(draft));
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [title, body, carBrand, carModel, carTrim, carYear]);

  if (!isOpen) return null;

  const handleClearDraft = () => {
    localStorage.removeItem('soalcar_draft_question_v2');
    setTitle('');
    setBody('');
    setRestoredDraftMessage(null);
  };

  const handleBrandChange = (newBrand: string) => {
    setCarBrand(newBrand);
    const models = getModelsByBrandName(newBrand);
    if (models.length > 0) {
      setCarModel(models[0].name);
      if (models[0].trims && models[0].trims.length > 0) {
        setCarTrim(models[0].trims[0]);
      } else {
        setCarTrim('');
      }
    }
  };

  const handleModelChange = (newModel: string) => {
    setCarModel(newModel);
    const trims = getTrimsByBrandAndModel(carBrand, newModel);
    if (trims.length > 0) {
      setCarTrim(trims[0]);
    } else {
      setCarTrim('');
    }
  };

  const handleTagToggle = (id: number) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter((tId) => tId !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  const handleAiQuickCheck = async () => {
    if (!body && !title) return;
    setAiAnalyzing(true);
    try {
      const fullCarInfo = `${carBrand} ${carModel} ${carTrim ? `(${carTrim})` : ''}`;
      const result = await onAiDiagnose(body || title, fullCarInfo, carModel);
      setAiDraft(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    const fullModelString = carTrim ? `${carModel} (${carTrim})` : carModel;
    try {
      await onSubmit({
        title,
        body,
        carBrand,
        carModel: fullModelString,
        carYear,
        tagIds: selectedTagIds,
      });
      localStorage.removeItem('soalcar_draft_question_v2');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-sky-600" />
              <span>ثبت سوال جدید درباره خودرو</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              سوال شما برای مکانیک‌های تأییدشده ارسال و در موتورهای جستجو ثبت می‌شود.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-save notification & Restored draft notice */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {restoredDraftMessage && (
            <div className="flex items-center gap-2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{restoredDraftMessage}</span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="mr-2 text-[10px] text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
              >
                پاکسازی پیش‌نویس
              </button>
            </div>
          )}

          {draftSaved && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg mr-auto">
              <Save className="w-3.5 h-3.5 animate-pulse" />
              <span>ذخیره خودکار پیش‌نویس...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Smart Car Brand, Model, Trim & Year Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">برند خودرو</label>
              <select
                value={carBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500 cursor-pointer"
              >
                {CAR_BRANDS_DATABASE.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">مدل خودرو</label>
              <select
                value={carModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500 cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
                {!availableModels.some(m => m.name === carModel) && (
                  <option value={carModel}>{carModel}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تیپ / تریم</label>
              <select
                value={carTrim}
                onChange={(e) => setCarTrim(e.target.value)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500 cursor-pointer"
              >
                {availableTrims.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سال ساخت</label>
              <input
                type="number"
                placeholder="۱۳۹۹"
                value={carYear}
                onChange={(e) => setCarYear(parseInt(e.target.value) || 1399)}
                className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                عنوان خلاصه مشکل (گوگل پسند) <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-bold ${title.length > 130 ? 'text-amber-600' : title.length >= 150 ? 'text-rose-600' : 'text-slate-400'}`}>
                {title.length} / 150 کاراکتر
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="مثال: علت ریپ زدن و بد کار کردن موتور پژو ۲۰۶ تیپ ۵ موقع شتاب‌گیری"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm font-bold rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                شرح کامل علامت یا صدای غیرعادی <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiQuickCheck}
                disabled={aiAnalyzing || (!body && !title)}
                className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{aiAnalyzing ? 'در حال پیش‌تحلیل...' : 'پیش‌تحلیل AI قبل از ثبت'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              required
              placeholder="توضیح دهید مشکل چه زمانی رخ می‌دهد؟ (در سرعت بالا، موقع ترمز گرفتن، صبح‌ها در سرما...). چه کارهایی تاکنون انجام شده؟"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3.5 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:border-sky-500"
            />
          </div>

          {/* AI Pre-Analysis Preview Box */}
          {aiDraft && (
            <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs space-y-2">
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                پیش‌تحلیل هوشمند سیستم (قبل از ثبت برای مکانیک‌ها):
              </span>
              <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                {aiDraft}
              </p>
            </div>
          )}

          {/* Tags Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">تگ‌های مربوطه</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {(title || body) ? (
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی فرم</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت سوال...' : 'ثبت سوال عمومی'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

