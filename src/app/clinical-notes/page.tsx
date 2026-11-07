'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  User, 
  X, 
  Activity, 
  AlertCircle,
  Clock,
  Sparkles,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  dentistName: string;
  date: string;
  toothNumber: string | null;
  chiefComplaint: string;
  clinicalFindings: string | null;
  procedureDone: string;
  nextVisitPlan: string | null;
  createdAt: string;
}

interface Patient {
  id: string;
  fullName: string;
  contactNumber: string;
}

const COMMON_PROCEDURES = [
  'RCT Phase 1: Access opening & canal extirpation',
  'RCT Phase 2: Biomechanical preparation & dressing',
  'RCT Phase 3: Obturation with Gutta Percha',
  'Tooth Extraction: Simple / Atraumatic',
  'Surgical Disimpaction of 3rd Molar',
  'Composite / GIC Filling & Restoration',
  'Ultrasonic Scaling & Subgingival Root Planing',
  'Crown Preparation & Digital Impression',
  'Crown Cementation & Occlusal Adjustment',
  'Direct / Indirect Pulp Capping'
];

export default function ClinicalNotesPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [patientId, setPatientId] = useState('');
  const [dentistName, setDentistName] = useState('Dr. Saheen Ahmed');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [toothNumber, setToothNumber] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [procedureDone, setProcedureDone] = useState('');
  const [nextVisitPlan, setNextVisitPlan] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [selectedPatientFilter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const url = selectedPatientFilter 
        ? `/api/clinical-notes?patientId=${selectedPatientFilter}`
        : '/api/clinical-notes';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
        if (data.patients) setPatients(data.patients);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !dentistName || !chiefComplaint || !procedureDone) {
      setErrorMsg('Please fill in patient, doctor, chief complaint, and procedure done.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          dentistName,
          date,
          toothNumber,
          chiefComplaint,
          clinicalFindings,
          procedureDone,
          nextVisitPlan
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchNotes();
        // Reset form
        setToothNumber('');
        setChiefComplaint('');
        setClinicalFindings('');
        setProcedureDone('');
        setNextVisitPlan('');
      } else {
        setErrorMsg(data.error || 'Failed to save note');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clinical case note?')) return;
    try {
      const res = await fetch(`/api/clinical-notes?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.patientName.toLowerCase().includes(search.toLowerCase()) ||
    n.chiefComplaint.toLowerCase().includes(search.toLowerCase()) ||
    n.procedureDone.toLowerCase().includes(search.toLowerCase()) ||
    (n.toothNumber && n.toothNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-emerald-600" />
            Clinical Notes & Case Sheets
          </h1>
          <p className="text-slate-500 mt-1">
            Log patient examination findings, clinical procedures, tooth numbers, and multi-visit progression.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Log Clinical Visit
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes, procedures, complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <select
            value={selectedPatientFilter}
            onChange={(e) => setSelectedPatientFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">-- All Patients --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium shrink-0">
          {filteredNotes.length} Case Records Logged
        </span>
      </div>

      {/* Case Notes Timeline / Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400">
          Loading clinical records...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
          <Stethoscope className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">No clinical case notes found</p>
          <p className="text-xs text-slate-400">Click &quot;Log Clinical Visit&quot; to add procedure details for a patient.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {note.patientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{note.patientName}</h3>
                    <p className="text-xs text-slate-400">Attending: {note.dentistName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {note.toothNumber && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      Tooth: {note.toothNumber}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {note.date}
                  </span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Chief Complaint:</span>
                  <p className="font-semibold text-slate-800 text-sm">{note.chiefComplaint}</p>
                </div>

                {note.clinicalFindings && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Clinical Findings:</span>
                    <p className="text-slate-700">{note.clinicalFindings}</p>
                  </div>
                )}

                <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Procedure Completed:</span>
                  <p className="font-bold text-slate-900 text-sm">{note.procedureDone}</p>
                </div>

                {note.nextVisitPlan && (
                  <div className="md:col-span-2 flex items-center gap-2 text-indigo-700 bg-indigo-50/60 px-3 py-2 rounded-lg border border-indigo-100">
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <span><strong className="font-semibold">Next Visit Plan:</strong> {note.nextVisitPlan}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">Log Clinical Visit & Case Sheet</h2>
                  <p className="text-xs text-slate-500">Record procedure, tooth findings, and treatment plan</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Patient *
                  </label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor *
                  </label>
                  <input
                    type="text"
                    value={dentistName}
                    onChange={(e) => setDentistName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tooth Number / Quadrant (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tooth #46 (Lower Right 1st Molar)"
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chief Complaint *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pain and food lodgement in lower right molar for 3 days"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Examination & Findings
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deep disto-occlusal caries, tender on vertical percussion, no sinus tract"
                  value={clinicalFindings}
                  onChange={(e) => setClinicalFindings(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Procedure Completed *
                  </label>
                  <span className="text-[11px] text-slate-400">Click preset below or type</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Access cavity preparation, pulp extirpation, temporary dressing"
                  value={procedureDone}
                  onChange={(e) => setProcedureDone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PROCEDURES.map((proc, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setProcedureDone(proc)}
                      className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition-colors border border-slate-200/60"
                    >
                      {proc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Next Appointment Plan
                </label>
                <input
                  type="text"
                  placeholder="e.g. Canal obturation & permanent restoration next Tuesday"
                  value={nextVisitPlan}
                  onChange={(e) => setNextVisitPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

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
                  {submitting ? 'Saving...' : 'Save Case Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
