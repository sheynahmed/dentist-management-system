'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Check, Phone, User } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  contactNumber: string;
}

interface WhatsAppPostOpModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients?: Patient[];
  defaultPatient?: Patient;
}

const TEMPLATES = [
  {
    id: 'extraction',
    title: 'Post-Extraction (Tooth Removal)',
    body: (name: string) => 
      `Dear ${name || 'Patient'},\n\n` +
      `Here are your essential Post-Extraction Care Instructions from *DentoCare Dental Clinic*:\n\n` +
      `1. 🩸 *Gauze Pressure:* Keep the cotton gauze firmly in place for 45 minutes, then discard.\n` +
      `2. 🚫 *No Spitting or Straws:* Do NOT spit, gargle forcefully, or drink through a straw for 24 hours to prevent dry socket.\n` +
      `3. 🍦 *Diet:* Eat soft, cold, or room temperature foods (ice cream, yogurt, khichdi). Avoid hot, spicy, or hard foods.\n` +
      `4. 💊 *Medicines:* Take your prescribed pain relief and antibiotics strictly on time.\n` +
      `5. 🧂 *Warm Salt Water:* Starting tomorrow, gently rinse with warm saline water 3-4 times daily.\n\n` +
      `If you experience severe pain or prolonged bleeding, contact DentoCare Clinic immediately at +91 98765 43210.`
  },
  {
    id: 'rct',
    title: 'Post-Root Canal Treatment (RCT)',
    body: (name: string) => 
      `Dear ${name || 'Patient'},\n\n` +
      `Your Root Canal Treatment visit at *DentoCare* is complete. Please follow these care tips:\n\n` +
      `1. 🦷 *Avoid Chewing on Treated Side:* Avoid chewing hard, sticky foods on the treated tooth until your permanent crown is fitted.\n` +
      `2. 😌 *Mild Tenderness:* Mild soreness on touch/chewing is completely normal for 2-3 days.\n` +
      `3. 💊 *Medication Course:* Complete your prescribed antibiotic & pain medication course as directed.\n` +
      `4. 📅 *Next Visit:* Please attend your scheduled follow-up for final canal sealing / crown placement.\n\n` +
      `Warm regards,\nDentoCare Clinic Team`
  },
  {
    id: 'scaling',
    title: 'Post-Scaling & Polishing (Cleaning)',
    body: (name: string) => 
      `Dear ${name || 'Patient'},\n\n` +
      `Thank you for completing your dental scaling and teeth cleaning at *DentoCare*.\n\n` +
      `1. ❄️ *Sensitivity:* Mild sensitivity to cold or hot liquids is temporary and will subside in 2-3 days.\n` +
      `2. 🪥 *Brushing:* Use a soft-bristled toothbrush with gentle circular motions.\n` +
      `3. 🌿 *Mouthwash:* If prescribed, use the antiseptic oral rinse for 30 seconds after brushing.\n\n` +
      `Keep smiling!\nDentoCare Dental Clinic`
  },
  {
    id: 'whitening',
    title: 'Post-Teeth Whitening (Bleaching)',
    body: (name: string) => 
      `Dear ${name || 'Patient'},\n\n` +
      `Congratulations on your brighter smile from *DentoCare*! For the next 48 hours, enamel pores are susceptible to staining. Please follow the *White Diet*:\n\n` +
      `1. ☕ *Avoid Dark Staining Items:* No coffee, black tea, dark colas, red wine, turmeric curry, soy sauce, or smoking.\n` +
      `2. 🥛 *Recommended Foods:* Milk, water, plain rice, white pasta, chicken, yogurt, bread.\n` +
      `3. ❄️ Use a desensitizing toothpaste if you experience mild zingers/sensitivity.\n\n` +
      `DentoCare Dental Clinic`
  }
];

export default function WhatsAppPostOpModal({
  isOpen,
  onClose,
  patients = [],
  defaultPatient
}: WhatsAppPostOpModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatient?.id || '');
  const [customPhone, setCustomPhone] = useState(defaultPatient?.contactNumber || '');
  const [customName, setCustomName] = useState(defaultPatient?.fullName || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('extraction');
  const [message, setMessage] = useState(() => TEMPLATES[0].body(defaultPatient?.fullName || 'Patient'));

  if (!isOpen) return null;

  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    const pat = patients.find(p => p.id === patId);
    if (pat) {
      setCustomName(pat.fullName);
      setCustomPhone(pat.contactNumber);
      const tmpl = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
      setMessage(tmpl.body(pat.fullName));
    }
  };

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = TEMPLATES.find(t => t.id === tmplId) || TEMPLATES[0];
    setMessage(tmpl.body(customName));
  };

  const handleSend = () => {
    if (!customPhone) {
      alert('Please provide a patient phone number');
      return;
    }

    const cleanPhone = customPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Send Post-Op Care Instructions</h2>
              <p className="text-xs text-slate-500">Send clinical recovery guidelines directly via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Patient Selector */}
          {patients.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="">-- Choose Patient or enter phone manually --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} ({p.contactNumber})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  const tmpl = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
                  setMessage(tmpl.body(e.target.value));
                }}
                placeholder="Patient Name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Phone Number *
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Procedure Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Choose Clinical Procedure Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl.id}
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview & Edit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Message Preview (Editable)
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-green-900/20 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Open & Send on WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
}
