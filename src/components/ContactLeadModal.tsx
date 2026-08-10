import React, { useState } from 'react';
import { X, Phone, Building2, User, Send, CheckCircle2 } from 'lucide-react';
import { MechanicProfile } from '../types';
import { apiService } from '../services/api';

interface ContactLeadModalProps {
  isOpen: boolean;
  mechanic: MechanicProfile | null;
  questionId?: number;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ContactLeadModal: React.FC<ContactLeadModalProps> = ({
  isOpen,
  mechanic,
  questionId,
  onClose,
  onSuccess,
}) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !mechanic) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiService.sendLeadReferral(mechanic.id, {
        contactName,
        contactPhone,
        questionId,
        notes,
      });
      onSuccess(res.message);
      onClose();
    } catch (e: any) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">درخواست تماس با {mechanic.displayName}</h3>
              <p className="text-[11px] text-slate-500 font-medium">{mechanic.workshopName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نام و نام خانوادگی شما</label>
            <input
              type="text"
              required
              placeholder="مثلاً: علی رضایی"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">شماره همراه جهت تماس مکانیک</label>
            <input
              type="tel"
              required
              placeholder="09121112233"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات تکمیلی یا زمان پیشنهادی حضور</label>
            <textarea
              rows={2}
              placeholder="مثلاً: جهت عیب‌یابی گیربکس روز پنجشنبه بعد از ظهر"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-medium rounded-xl border border-slate-200"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">شماره مستقیم تعمیرگاه:</p>
            <p className="text-emerald-700 font-bold">{mechanic.phonePublic || '021-66554433'}</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'در حال ارسال...' : 'ارسال درخواست نوبت'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
