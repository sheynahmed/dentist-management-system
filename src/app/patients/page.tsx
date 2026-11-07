'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  FileSpreadsheet,
  X,
  PlusCircle,
  Trash2,
  ChevronLeft,
  Activity,
  CheckCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string | null;
  emergencyContact: string;
  medicalHistory: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

interface MedicalHistoryJSON {
  allergies: string[];
  chronicConditions: string[];
  notes: string;
  toothMap?: Record<number, 'Healthy' | 'Caries' | 'RCT' | 'Crown' | 'Missing'>;
  signature?: string;
  consentDate?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  status: string;
  notes: string | null;
  dentistName: string;
}

interface Invoice {
  id: string;
  patientId: string;
  status: string;
  issueDate: string;
  total: number;
  paidAmount: number;
}

const TOOTH_STATUS_OPTIONS = [
  { value: 'Healthy', label: 'Healthy', colorBg: 'bg-emerald-50 text-emerald-700 border-emerald-300', colorCode: '#10b981' },
  { value: 'Caries', label: 'Caries (Cavity)', colorBg: 'bg-rose-50 text-rose-700 border-rose-300', colorCode: '#ef4444' },
  { value: 'RCT', label: 'RCT Required', colorBg: 'bg-amber-50 text-amber-700 border-amber-300', colorCode: '#f59e0b' },
  { value: 'Crown', label: 'Crown / Prosthesis', colorBg: 'bg-indigo-50 text-indigo-700 border-indigo-300', colorCode: '#6366f1' },
  { value: 'Missing', label: 'Missing / Extracted', colorBg: 'bg-slate-100 text-slate-500 border-slate-300', colorCode: '#94a3b8' }
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selected Patient for detailed profile view (Odontogram & Timeline)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTooth, setActiveTooth] = useState<number | null>(null);

  // Profile Edit / Register Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  
  // Medical history states inside modal
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [historyNotes, setHistoryNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch patients
      const pRes = await fetch('/api/patients');
      const pData = await pRes.json();
      if (pData.success) {
        setPatients(pData.patients);
        // Sync selected patient details if open
        if (selectedPatient) {
          const fresh = pData.patients.find((p: Patient) => p.id === selectedPatient.id);
          if (fresh) setSelectedPatient(fresh);
        }
      }

      // Fetch appointments for timeline
      const aRes = await fetch('/api/appointments');
      const aData = await aRes.json();
      if (aData.success) {
        setAppointments(aData.appointments);
      }

      // Fetch invoices for timeline
      const iRes = await fetch('/api/billing');
      const iData = await iRes.json();
      if (iData.success) {
        setInvoices(iData.invoices);
      }

    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRegisterModal = () => {
    setEditingPatient(null);
    setFullName('');
    setDateOfBirth('');
    setGender('MALE');
    setContactNumber('');
    setEmail('');
    setEmergencyContact('');
    setAllergies([]);
    setConditions([]);
    setHistoryNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Patient, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details row selection
    setEditingPatient(p);
    setFullName(p.fullName);
    setDateOfBirth(p.dateOfBirth.split('T')[0]);
    setGender(p.gender);
    setContactNumber(p.contactNumber);
    setEmail(p.email || '');
    setEmergencyContact(p.emergencyContact);

    let history: MedicalHistoryJSON = { allergies: [], chronicConditions: [], notes: '' };
    try {
      history = JSON.parse(p.medicalHistory);
    } catch (err) {}

    setAllergies(history.allergies || []);
    setConditions(history.chronicConditions || []);
    setHistoryNotes(history.notes || '');
    setIsModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dateOfBirth || !contactNumber || !emergencyContact) {
      alert('Please fill out all required fields');
      return;
    }

    // Preserve existing signature and tooth map if editing
    let existingHistory: any = {};
    if (editingPatient) {
      try {
        existingHistory = JSON.parse(editingPatient.medicalHistory);
      } catch (err) {}
    }

    const payload = {
      id: editingPatient?.id,
      fullName,
      dateOfBirth: new Date(dateOfBirth).toISOString(),
      gender,
      contactNumber,
      email: email || null,
      emergencyContact,
      medicalHistory: {
        ...existingHistory,
        allergies,
        chronicConditions: conditions,
        notes: historyNotes
      }
    };

    try {
      const method = editingPatient ? 'PUT' : 'POST';
      const res = await fetch('/api/patients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.message || 'Failed to save patient');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving patient');
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (idx: number) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  // Update tooth status in patient odontogram
  const updateToothStatus = async (toothNumber: number, status: 'Healthy' | 'Caries' | 'RCT' | 'Crown' | 'Missing') => {
    if (!selectedPatient) return;

    let history: MedicalHistoryJSON = { allergies: [], chronicConditions: [], notes: '', toothMap: {} };
    try {
      history = JSON.parse(selectedPatient.medicalHistory);
    } catch (err) {}

    if (!history.toothMap) {
      history.toothMap = {};
    }

    history.toothMap[toothNumber] = status;

    const payload = {
      id: selectedPatient.id,
      medicalHistory: history
    };

    try {
      const res = await fetch('/api/patients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setActiveTooth(null); // Close tooth picker
      } else {
        alert('Failed to update tooth status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating tooth map.');
    }
  };

  // Filter patients by name/phone
  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.contactNumber.includes(search)
  );

  // Compute Selected Patient Details
  const getSelectedPatientDetails = () => {
    if (!selectedPatient) return null;

    let history: MedicalHistoryJSON = { allergies: [], chronicConditions: [], notes: '', toothMap: {} };
    try {
      history = JSON.parse(selectedPatient.medicalHistory);
    } catch (err) {}

    const patientAppts = appointments
      .filter(a => a.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    const patientInvoices = invoices
      .filter(i => i.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    // Create sorted, unified timeline list
    const timeline: { type: 'appointment' | 'invoice'; date: string; title: string; subtitle: string; status: string; amount?: number; notes?: string | null }[] = [];

    patientAppts.forEach(a => {
      timeline.push({
        type: 'appointment',
        date: a.dateTime,
        title: `Appointment with Dr. ${a.dentistName}`,
        subtitle: a.notes || 'Routine checkup session',
        status: a.status,
        notes: a.notes
      });
    });

    patientInvoices.forEach(i => {
      timeline.push({
        type: 'invoice',
        date: i.issueDate,
        title: `Invoice Billed (${i.status})`,
        subtitle: `Tax-inclusive charges`,
        status: i.status,
        amount: i.total
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      history,
      timeline,
      appointments: patientAppts,
      invoices: patientInvoices
    };
  };

  const details = getSelectedPatientDetails();

  return (
    <div className="space-y-6 pb-10">
      {/* Detail view header toggle */}
      {selectedPatient ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedPatient(null);
              setActiveTooth(null);
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Patients
          </button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {selectedPatient ? selectedPatient.fullName : 'Patients Directory'}
          </h1>
          <p className="text-slate-500 mt-1">
            {selectedPatient 
              ? `Patient UID: ${selectedPatient.id.substring(0, 8)} | Medical Intake Profile` 
              : 'Register, view and update clinic patient records.'}
          </p>
        </div>
        {!selectedPatient ? (
          <div className="flex items-center gap-2">
            <Link
              href="/patients/intake"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              Patient Intake Portal
            </Link>
            <button
              onClick={openRegisterModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-950/10 text-xs cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              Register Patient
            </button>
          </div>
        ) : null}
      </div>

      {!selectedPatient ? (
        /* Patient Grid list view */
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by patient name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Patients Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                Loading patient directories...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
                <FileSpreadsheet className="h-10 w-10 text-slate-300" />
                <span>No patients registered matching your search query.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase bg-slate-50/50">
                      <th className="py-3.5 px-6">Full Name</th>
                      <th className="py-3.5 px-6">Age / Gender</th>
                      <th className="py-3.5 px-6">Contact details</th>
                      <th className="py-3.5 px-6">Medical History Summary</th>
                      <th className="py-3.5 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => {
                      let history: MedicalHistoryJSON = { allergies: [], chronicConditions: [], notes: '' };
                      try {
                        history = JSON.parse(p.medicalHistory);
                      } catch (e) {}

                      // Calculate age
                      const birthDate = new Date(p.dateOfBirth);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }

                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => setSelectedPatient(p)}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors">{p.fullName}</p>
                            <p className="text-[10px] text-slate-400">UID: {p.id.substring(0, 8)}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-slate-700">{age} yrs</p>
                            <p className="text-xs text-slate-400 capitalize">{p.gender.toLowerCase()}</p>
                          </td>
                          <td className="py-4 px-6 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{p.contactNumber}</span>
                            </div>
                            {p.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{p.email}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 space-y-1 max-w-xs">
                            {history.allergies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">Allergies:</span>
                                {history.allergies.slice(0, 2).map((all, i) => (
                                  <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md truncate">{all}</span>
                                ))}
                                {history.allergies.length > 2 && <span className="text-[9px] text-slate-400 font-bold">+{history.allergies.length - 2} more</span>}
                              </div>
                            )}
                            {history.chronicConditions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">Conditions:</span>
                                {history.chronicConditions.slice(0, 2).map((cond, i) => (
                                  <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md truncate">{cond}</span>
                                ))}
                                {history.chronicConditions.length > 2 && <span className="text-[9px] text-slate-400 font-bold">+{history.chronicConditions.length - 2} more</span>}
                              </div>
                            )}
                            {history.notes && !history.allergies.length && !history.chronicConditions.length && (
                              <p className="text-xs text-slate-400 italic truncate max-w-xs">{history.notes}</p>
                            )}
                            {history.allergies.length === 0 && history.chronicConditions.length === 0 && !history.notes && (
                              <span className="text-xs text-slate-300 italic">No flags logged</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => openEditModal(p, e)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit patient profile"
                              >
                                <Edit2 className="h-4 w-4" />
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
        </div>
      ) : (
        /* Detailed Patient Profile with Odontogram & Timeline */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Patient info & consent signature */}
          <div className="space-y-6 lg:col-span-1">
            {/* Info Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-extrabold text-slate-800 text-base">Patient Profile</h3>
                <button
                  onClick={(e) => openEditModal(selectedPatient, e)}
                  className="p-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DOB / Age</span>
                    <span className="font-bold text-slate-700">
                      {new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span>
                    <span className="font-bold text-slate-700 capitalize">{selectedPatient.gender.toLowerCase()}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {selectedPatient.contactNumber}
                  </span>
                </div>

                {selectedPatient.email && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {selectedPatient.email}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                  <span className="font-bold text-slate-700 block mt-0.5">{selectedPatient.emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Medical History Tags */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Medical Summary</h3>
              
              <div className="space-y-3">
                {/* Allergies list */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Drug / Material Allergies</span>
                  {details?.history.allergies.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">None logged</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {details?.history.allergies.map((all, i) => (
                        <span key={i} className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-lg">{all}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronic conditions */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Chronic Medical Conditions</span>
                  {details?.history.chronicConditions.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">None logged</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {details?.history.chronicConditions.map((cond, i) => (
                        <span key={i} className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-lg">{cond}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remarks notes */}
                {details?.history.notes && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinic Medical Remarks</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 border border-slate-100 rounded-xl leading-relaxed italic">{details.history.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Consent verification */}
            {details?.history.signature ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                    Consent Signature
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    <UserCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                
                <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl flex items-center justify-center h-28 relative">
                  <img 
                    src={details.history.signature} 
                    alt="Intake signature consent"
                    className="max-h-24 object-contain"
                  />
                </div>
                
                {details.history.consentDate && (
                  <p className="text-[10px] text-slate-400 text-center">
                    Signed on {new Date(details.history.consentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(details.history.consentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200/60 text-center space-y-3.5">
                <div className="flex justify-center text-amber-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-800">Intake Consent Pending</h4>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    This patient has not signed their digital consent intake form. You can load the tablet intake panel for them.
                  </p>
                </div>
                <Link
                  href="/patients/intake"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-950/10"
                >
                  <ExternalLink className="h-3 w-3" />
                  Launch Intake Screen
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Odontogram & Treatment Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Interactive Odontogram Map */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Interactive Tooth Map (Odontogram)</h3>
                <p className="text-xs text-slate-400">Click a tooth to log dental pathology status (Caries, RCT, Crown, Missing).</p>
              </div>

              {/* Grid map arches */}
              <div className="py-4 space-y-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center">
                {/* Upper arch (1-16) */}
                <div className="w-full max-w-xl">
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2.5">Upper Dental Arch (Right to Left)</p>
                  <div className="flex justify-between px-4">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => {
                      const status = details?.history.toothMap?.[num] || 'Healthy';
                      const foundOption = TOOTH_STATUS_OPTIONS.find(opt => opt.value === status);
                      
                      return (
                        <button
                          key={num}
                          onClick={() => setActiveTooth(activeTooth === num ? null : num)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all cursor-pointer shadow-sm select-none ${
                            foundOption ? foundOption.colorBg : 'bg-emerald-50 text-emerald-700'
                          } ${activeTooth === num ? 'ring-2 ring-emerald-500 scale-110 shadow-md' : 'hover:scale-105'}`}
                          title={`Tooth #${num}: ${status}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lower arch (17-32) */}
                <div className="w-full max-w-xl border-t border-slate-200/60 pt-5">
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2.5">Lower Dental Arch (Left to Right)</p>
                  <div className="flex justify-between px-4">
                    {Array.from({ length: 16 }, (_, i) => i + 17).map((num) => {
                      const status = details?.history.toothMap?.[num] || 'Healthy';
                      const foundOption = TOOTH_STATUS_OPTIONS.find(opt => opt.value === status);

                      return (
                        <button
                          key={num}
                          onClick={() => setActiveTooth(activeTooth === num ? null : num)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all cursor-pointer shadow-sm select-none ${
                            foundOption ? foundOption.colorBg : 'bg-emerald-50 text-emerald-700'
                          } ${activeTooth === num ? 'ring-2 ring-emerald-500 scale-110 shadow-md' : 'hover:scale-105'}`}
                          title={`Tooth #${num}: ${status}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tooth status popup option list */}
              {activeTooth !== null && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700">Set pathology status for Tooth #{activeTooth}</span>
                    <button 
                      onClick={() => setActiveTooth(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {TOOTH_STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateToothStatus(activeTooth, opt.value as any)}
                        className={`px-3 py-2 border rounded-xl font-bold text-xs transition-all cursor-pointer hover:shadow-sm ${opt.colorBg}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status color-code map legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                {TOOTH_STATUS_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: opt.colorCode }} />
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment Timeline Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base">Treatment & Billing Timeline</h3>

              <div className="relative border-l-2 border-slate-100 pl-5 ml-2.5 space-y-6 py-2">
                {details?.timeline.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No clinical transactions or scheduled appointments logged yet.
                  </div>
                ) : (
                  details?.timeline.map((item, index) => {
                    const isAppt = item.type === 'appointment';
                    return (
                      <div key={index} className="relative group">
                        {/* Timeline bubble icon depending on type */}
                        <span className={`absolute -left-[31px] top-0 h-5 w-5 rounded-full flex items-center justify-center border shadow-sm ${
                          isAppt 
                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                          <Activity className="h-2.5 w-2.5" />
                        </span>

                        <div className="space-y-1">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                            <span className="text-xs font-bold text-slate-800 leading-snug">{item.title}</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed font-normal">{item.subtitle}</p>

                          {/* Extra info details */}
                          {item.amount !== undefined && (
                            <p className="text-[10px] font-extrabold text-slate-800">
                              Amount Outflow: ₹{item.amount.toLocaleString('en-IN')}
                            </p>
                          )}

                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            item.status === 'COMPLETED' || item.status === 'PAID'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : item.status === 'SCHEDULED' || item.status === 'PENDING'
                              ? 'bg-blue-50 border-blue-100 text-blue-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPatient ? 'Edit Patient Profile' : 'Register New Patient'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePatient} className="p-6 space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter patient full name"
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                {/* DOB */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-700"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Contact phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 7592918984"
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Emergency Contact *</label>
                  <input
                    type="text"
                    required
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Name and contact number"
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Medical History section */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Medical History & Flags</h3>

                {/* Allergies list */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Allergies</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an allergy (e.g. Penicillin)"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="flex-1 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {allergies.map((all, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
                          {all}
                          <button type="button" onClick={() => removeAllergy(i)} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronic Conditions list */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Chronic Conditions</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add condition (e.g. Hypertension)"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      className="flex-1 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addCondition}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  {conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {conditions.map((cond, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
                          {cond}
                          <button type="button" onClick={() => removeCondition(i)} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">General Medical Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter surgical history, general notes or diagnostic remarks..."
                    value={historyNotes}
                    onChange={(e) => setHistoryNotes(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl text-sm text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-md shadow-emerald-950/10"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
