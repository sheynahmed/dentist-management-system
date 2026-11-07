'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  Pill, 
  Clock, 
  User, 
  X, 
  Check, 
  Share2, 
  MessageCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientGender: string;
  patientDob: string;
  dentistName: string;
  date: string;
  diagnosis: string;
  medications: string; // JSON
  advice: string | null;
  createdAt: string;
}

interface Patient {
  id: string;
  fullName: string;
  contactNumber: string;
}

const COMMON_DENTAL_DRUGS = [
  { name: 'Augmentin 625mg (Amox+Clav)', dosage: '625mg', frequency: '1-0-1 (Twice daily)', duration: '5 days', instructions: 'After food' },
  { name: 'Amoxicillin 500mg', dosage: '500mg', frequency: '1-1-1 (Thrice daily)', duration: '5 days', instructions: 'After food' },
  { name: 'Metronidazole 400mg', dosage: '400mg', frequency: '1-0-1 (Twice daily)', duration: '5 days', instructions: 'After food, avoid alcohol' },
  { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: '1-0-1 (Twice daily)', duration: '3 days', instructions: 'After food SOS for pain' },
  { name: 'Aceclofenac + Paracetamol', dosage: '100mg/325mg', frequency: '1-0-1 (Twice daily)', duration: '3 days', instructions: 'After food' },
  { name: 'Ketorolac Tromethamine 10mg DT', dosage: '10mg', frequency: '1 tab SOS', duration: '2 days', instructions: 'Disperse in water for acute pain' },
  { name: 'Chlorhexidine 0.2% Mouthwash', dosage: '10 ml', frequency: 'Twice daily', duration: '7 days', instructions: 'Rinse for 30s after brushing, do not swallow' },
  { name: 'Pantoprazole 40mg', dosage: '40mg', frequency: '1-0-0 (Morning)', duration: '5 days', instructions: '30 mins before breakfast' }
];

const COMMON_DIAGNOSES = [
  'Acute Irreversible Pulpitis',
  'Periapical Abscess',
  'Post-Extraction Healing / Pain',
  'Chronic Periodontitis',
  'Gingivitis & Oral Infection',
  'Pericoronitis (Wisdom Tooth)',
  'Deep Dental Caries',
  'Dental Trauma / Alveolar Fracture'
];

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [patientId, setPatientId] = useState('');
  const [dentistName, setDentistName] = useState('Dr. Saheen Ahmed');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('Maintain good oral hygiene. Warm saline gargles 3-4 times daily after 24 hours. Avoid chewing on the treated side.');
  const [medications, setMedications] = useState<Medication[]>([
    { name: 'Augmentin 625mg (Amox+Clav)', dosage: '625mg', frequency: '1-0-1 (Twice daily)', duration: '5 days', instructions: 'After food' },
    { name: 'Aceclofenac + Paracetamol', dosage: '100mg/325mg', frequency: '1-0-1 (Twice daily)', duration: '3 days', instructions: 'After food' }
  ]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/prescriptions');
      const data = await res.json();
      if (data.success) {
        setPrescriptions(data.prescriptions);
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '1-0-1', duration: '3 days', instructions: 'After food' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleUpdateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleAddPresetDrug = (drug: typeof COMMON_DENTAL_DRUGS[0]) => {
    setMedications([...medications, { ...drug }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !dentistName || !diagnosis || medications.length === 0) {
      setErrorMsg('Please select a patient, enter a diagnosis, and add at least one medication.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          dentistName,
          date,
          diagnosis,
          medications,
          advice
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPrescriptions();
        // Reset form
        setDiagnosis('');
        setMedications([
          { name: 'Augmentin 625mg', dosage: '625mg', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }
        ]);
      } else {
        setErrorMsg(data.error || 'Failed to save prescription');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    try {
      const res = await fetch(`/api/prescriptions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPrescriptions(prescriptions.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareWhatsApp = (p: Prescription) => {
    let medsList: Medication[] = [];
    try {
      medsList = JSON.parse(p.medications);
    } catch (e) {}

    const medsText = medsList.map((m, i) => `${i + 1}. *${m.name}* (${m.dosage})\n   - Frequency: ${m.frequency}\n   - Duration: ${m.duration} (${m.instructions})`).join('\n');

    const message = `*DentoCare Clinic - Dental Prescription (Rx)*\n\n` +
      `*Patient:* ${p.patientName}\n` +
      `*Doctor:* ${p.dentistName}\n` +
      `*Date:* ${p.date}\n` +
      `*Diagnosis:* ${p.diagnosis}\n\n` +
      `*Prescribed Medications (Rx):*\n${medsText}\n\n` +
      `*Clinical Advice:*\n${p.advice || 'Follow medication schedule carefully.'}\n\n` +
      `_DentoCare Clinic - For support or queries, call us anytime._`;

    const cleanPhone = p.patientPhone ? p.patientPhone.replace(/\D/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    p.dentistName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Pill className="h-8 w-8 text-emerald-600" />
            Digital Prescriptions (Rx)
          </h1>
          <p className="text-slate-500 mt-1">
            Write, manage, and print official clinical prescriptions with dental drug presets.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Write Prescription (Rx)
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, diagnosis, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{prescriptions.length}</span> Total Prescriptions Issued
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading clinical prescriptions...</div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Pill className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-medium">No prescriptions found</p>
            <p className="text-xs text-slate-400">Click &quot;Write Prescription (Rx)&quot; to generate an official dental prescription.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Diagnosis</th>
                  <th className="py-3.5 px-6">Medications (Rx)</th>
                  <th className="py-3.5 px-6">Doctor</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((rx) => {
                  let medsList: Medication[] = [];
                  try {
                    medsList = JSON.parse(rx.medications);
                  } catch (e) {}

                  return (
                    <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{rx.date}</span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{rx.patientName}</p>
                        <p className="text-xs text-slate-400">{rx.patientPhone}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                          {rx.diagnosis}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {medsList.slice(0, 2).map((m, idx) => (
                            <p key={idx} className="text-xs font-medium text-slate-700 truncate max-w-xs">
                              • {m.name} <span className="text-slate-400">({m.frequency})</span>
                            </p>
                          ))}
                          {medsList.length > 2 && (
                            <p className="text-[11px] text-emerald-600 font-semibold">
                              +{medsList.length - 2} more drugs
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {rx.dentistName}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/prescription/${rx.id}`}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Print / View Prescription Slip"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleShareWhatsApp(rx)}
                            className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rx.id)}
                            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Write Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">Write Dental Prescription (Rx)</h2>
                  <p className="text-xs text-slate-500">Official medication order and clinical instructions</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Patient & Doctor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Patient *
                  </label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.fullName} ({pat.contactNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Prescribing Doctor *
                  </label>
                  <input
                    type="text"
                    value={dentistName}
                    onChange={(e) => setDentistName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Diagnosis / Chief Complaint *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Irreversible Pulpitis #46"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none mb-2"
                />
                {/* Diagnosis chips */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map((diag, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setDiagnosis(diag)}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition-colors border border-slate-200/60"
                    >
                      {diag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Drug Chips */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Quick Dental Medication Presets (Click to add):
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DENTAL_DRUGS.map((drug, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleAddPresetDrug(drug)}
                      className="text-xs bg-white text-emerald-800 hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm transition-all font-medium cursor-pointer"
                    >
                      + {drug.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medications Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-600" />
                    Prescribed Medicines ({medications.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="text-xs text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Custom Drug
                  </button>
                </div>

                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1} Medication</span>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Medicine Name (e.g. Augmentin 625mg)"
                            value={med.name}
                            onChange={(e) => handleUpdateMedication(idx, 'name', e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Frequency (1-0-1)"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Duration (5 days)"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Instructions (After food)"
                            value={med.instructions}
                            onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Advice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Advice & Post-Op Instructions
                </label>
                <textarea
                  rows={3}
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Generating Rx...' : 'Save & Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
