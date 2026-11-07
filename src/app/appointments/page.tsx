'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  User, 
  Check, 
  X, 
  Trash2, 
  CalendarDays, 
  Search, 
  Filter, 
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  MessageCircle,
  LayoutGrid,
  List
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  dateTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  patientName: string;
  dentistName: string;
}

interface Patient {
  id: string;
  fullName: string;
  contactNumber: string;
}

interface Dentist {
  id: string;
  name: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'scheduler' | 'list'>('scheduler');

  // Form state
  const [formPatientId, setFormPatientId] = useState('');
  const [formDentistId, setFormDentistId] = useState('');
  const [formDateTime, setFormDateTime] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filters state
  const [filterDentist, setFilterDentist] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Weekly scheduler navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    // Set to Monday of the current week
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Action loading states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // WhatsApp reminder state
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedApptForWhatsapp, setSelectedApptForWhatsapp] = useState<Appointment | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState<'standard' | 'confirm' | 'followup'>('standard');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
        setPatients(data.patients);
        setDentists(data.dentists);
        
        if (data.dentists.length > 0) {
          setFormDentistId(data.dentists[0].id);
        }
      } else {
        setErrorMsg(data.message || 'Failed to load appointments');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to appointments server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formDentistId || !formDateTime) {
      setErrorMsg('Please select a patient, a dentist, and appointment date/time');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          dentistId: formDentistId,
          dateTime: formDateTime,
          notes: formNotes
        })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Appointment scheduled successfully');
        setAppointments(prev => [data.appointment, ...prev]);
        setShowModal(false);
        // Reset form
        setFormPatientId('');
        setFormNotes('');
        setFormDateTime('');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to schedule appointment');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error creating appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();

      if (data.success) {
        setAppointments(prev =>
          prev.map(a => (a.id === id ? { ...a, status } : a))
        );
        setSuccessMsg(`Appointment status updated to ${status}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const res = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        setSuccessMsg('Appointment deleted successfully');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to delete appointment');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error deleting appointment');
    }
  };

  // Helper to format date strings nicely
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  // Check if date is in the future
  const isFuture = (isoString: string) => {
    try {
      return new Date(isoString).getTime() > Date.now();
    } catch (e) {
      return false;
    }
  };

  // Filtered appointments list
  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDentist = filterDentist === 'All' || a.dentistId === filterDentist;
    const matchesStatus = filterStatus === 'All' || 
                          (filterStatus === 'UPCOMING' && a.status === 'SCHEDULED' && isFuture(a.dateTime)) ||
                          (filterStatus === 'SCHEDULED' && a.status === 'SCHEDULED') ||
                          (filterStatus === 'COMPLETED' && a.status === 'COMPLETED') ||
                          (filterStatus === 'CANCELLED' && a.status === 'CANCELLED');
    
    return matchesSearch && matchesDentist && matchesStatus;
  });

  // Weekly scheduler hours (9:00 AM to 5:00 PM)
  const hours = Array.from({ length: 9 }, (_, i) => i + 9); // [9, 10, 11, 12, 13, 14, 15, 16, 17]

  // Get current week dates
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeekStart(newStart);
  };

  const navigateToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getWeekRangeLabel = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Find appointments on a specific day and hour range
  const getAppointmentsForCell = (day: Date, hour: number) => {
    return filteredAppointments.filter(appt => {
      const apptDate = new Date(appt.dateTime);
      return (
        apptDate.getDate() === day.getDate() &&
        apptDate.getMonth() === day.getMonth() &&
        apptDate.getFullYear() === day.getFullYear() &&
        apptDate.getHours() === hour
      );
    });
  };

  // Open scheduler click booking
  const handleCellClick = (day: Date, hour: number) => {
    const bookingDate = new Date(day);
    bookingDate.setHours(hour, 0, 0, 0);
    // Convert to datetime-local expected string format: YYYY-MM-DDTHH:MM
    const tzOffset = bookingDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(bookingDate.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormDateTime(localISOTime);
    setShowModal(true);
  };

  // Open WhatsApp reminder modal
  const openWhatsappModal = (appt: Appointment) => {
    const patientPhone = patients.find(p => p.id === appt.patientId)?.contactNumber || 'N/A';
    setSelectedApptForWhatsapp(appt);
    updateWhatsappTemplateText(appt, 'standard', patientPhone);
    setWhatsappModalOpen(true);
  };

  const updateWhatsappTemplateText = (appt: Appointment, template: 'standard' | 'confirm' | 'followup', patientPhone: string) => {
    setWhatsappTemplate(template);
    const dateFormatted = new Date(appt.dateTime).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
    const timeFormatted = new Date(appt.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    let text = '';
    if (template === 'standard') {
      text = `Hello ${appt.patientName},\n\nThis is a friendly reminder for your dental checkup scheduled at DentoCare on *${dateFormatted} at ${timeFormatted}* with Dr. ${appt.dentistName}.\n\nIf you have any symptoms or need to reschedule, please let us know. See you soon!`;
    } else if (template === 'confirm') {
      text = `Dear ${appt.patientName},\n\nYour appointment with Dr. ${appt.dentistName} on *${dateFormatted} at ${timeFormatted}* is confirmed. Please arrive 10 minutes prior for paperwork.\n\nReply 'CONFIRM' to let us know you're coming.`;
    } else {
      text = `Hi ${appt.patientName},\n\nHope you're recovering well! Dr. ${appt.dentistName} has scheduled a routine follow-up visit for you on *${dateFormatted} at ${timeFormatted}*.\n\nThank you for choosing DentoCare.`;
    }
    setWhatsappMessage(text);
  };

  const handleSendWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptForWhatsapp) return;
    
    try {
      setSendingWhatsapp(true);
      // Simulate API send delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const phone = patients.find(p => p.id === selectedApptForWhatsapp.patientId)?.contactNumber || 'N/A';
      setSuccessMsg(`Mock WhatsApp dispatch successful. Notification sent to ${selectedApptForWhatsapp.patientName} (${phone})`);
      setWhatsappModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to dispatch WhatsApp reminder');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-emerald-500" />
            Appointments & Scheduling
          </h1>
          <p className="text-slate-500 mt-1">Book new patient visits, assign dentists, and manage treatment schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle view mode */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('scheduler')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'scheduler' 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Scheduler Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List View
            </button>
          </div>
          <button
            onClick={() => {
              // Reset dateTime default to today at next hour
              const now = new Date();
              now.setMinutes(0, 0, 0);
              now.setHours(now.getHours() + 1);
              const tzOffset = now.getTimezoneOffset() * 60000;
              const defaultISOStr = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
              setFormDateTime(defaultISOStr);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md shadow-emerald-900/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Schedule Appointment
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium animate-fade-in flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fade-in flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="UPCOMING">Upcoming / Future Only</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="relative">
          <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={filterDentist}
            onChange={(e) => setFilterDentist(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 appearance-none cursor-pointer"
          >
            <option value="All">All Dentists</option>
            {dentists.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading appointments...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        filteredAppointments.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No appointments found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              We couldn't find any scheduled appointments matching your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appt) => {
              let statusStyle = '';
              if (appt.status === 'SCHEDULED') {
                statusStyle = 'bg-blue-50 text-blue-800 border-blue-100';
              } else if (appt.status === 'COMPLETED') {
                statusStyle = 'bg-emerald-50 text-emerald-800 border-emerald-100';
              } else {
                statusStyle = 'bg-slate-100 text-slate-600 border-slate-200';
              }

              return (
                <div 
                  key={appt.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 relative overflow-hidden group"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    appt.status === 'SCHEDULED' ? 'bg-blue-500' :
                    appt.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />

                  <div className="space-y-3.5 pl-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                          {appt.patientName}
                        </h4>
                        <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(appt.dateTime)} at {formatTime(appt.dateTime)}</span>
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle}`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="text-sm bg-slate-50 p-2.5 rounded-xl space-y-1.5 border border-slate-100">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Dentist: <span className="font-bold text-slate-700">{appt.dentistName}</span>
                      </p>
                      {appt.notes && (
                        <p className="text-xs text-slate-600 border-t border-slate-200/60 pt-1.5 leading-relaxed font-normal">
                          {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 pl-2">
                    <div className="flex gap-2.5">
                      {appt.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="Mark as Completed"
                          >
                            <Check className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Cancel Appointment"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => openWhatsappModal(appt)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Alert
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(appt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete appointment"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )) : (
          /* Weekly Scheduler Grid View */
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            {/* Week navigation bar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={navigateToCurrentWeek}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm">
                {getWeekRangeLabel()}
              </h3>
            </div>

            {/* Grid Schedule Container */}
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/20 text-slate-400 font-semibold text-xs uppercase">
                    <th className="py-4 px-3 w-24 text-center border-r border-slate-100">Time</th>
                    {weekDays.map((day, idx) => {
                      const isToday = new Date().toDateString() === day.toDateString();
                      return (
                        <th 
                          key={idx} 
                          className={`py-4 px-3 text-center border-r border-slate-100 ${
                            isToday ? 'bg-emerald-50/50 text-emerald-800 border-b-2 border-b-emerald-600' : ''
                          }`}
                        >
                          <p className="text-[10px] tracking-wide text-slate-400">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className={`text-base font-extrabold mt-0.5 ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {day.getDate()}
                          </p>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {hours.map(hour => {
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    const hourLabel = `${displayHour}:00 ${ampm}`;

                    return (
                      <tr key={hour} className="border-b border-slate-100 hover:bg-slate-50/20 group">
                        {/* Time Label */}
                        <td className="py-6 px-3 border-r border-slate-100 text-center font-bold text-slate-400 text-xs bg-slate-50/10">
                          {hourLabel}
                        </td>
                        {/* Day Cells */}
                        {weekDays.map((day, idx) => {
                          const cellAppts = getAppointmentsForCell(day, hour);
                          return (
                            <td 
                              key={idx} 
                              className="p-1 border-r border-slate-100 relative group/cell min-h-[80px]"
                            >
                              {cellAppts.length > 0 ? (
                                <div className="space-y-1.5">
                                  {cellAppts.map(appt => {
                                    let statusBg = 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800';
                                    if (appt.status === 'COMPLETED') {
                                      statusBg = 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800';
                                    } else if (appt.status === 'CANCELLED') {
                                      statusBg = 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500';
                                    }

                                    return (
                                      <div 
                                        key={appt.id} 
                                        className={`p-2 rounded-xl border text-[10px] leading-snug font-medium transition-all shadow-sm relative group/block ${statusBg}`}
                                      >
                                        <div className="flex justify-between items-start gap-1">
                                          <p className="font-bold truncate max-w-[80px]">{appt.patientName}</p>
                                          {appt.status === 'SCHEDULED' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openWhatsappModal(appt);
                                              }}
                                              className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded transition-all shrink-0 bg-white shadow-sm border border-emerald-100"
                                              title="Send Whatsapp Alert"
                                            >
                                              <MessageCircle className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-[9px] text-slate-500 truncate mt-0.5">Dr. {appt.dentistName}</p>
                                        {appt.notes && <p className="text-[9px] text-slate-400 italic mt-0.5 truncate">{appt.notes}</p>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Quick book trigger */
                                <button
                                  onClick={() => handleCellClick(day, hour)}
                                  className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 hover:bg-emerald-500/5 flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Plus className="h-5.5 w-5.5 text-emerald-600/40" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 transform transition-all overflow-hidden">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Schedule Appointment</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient</label>
                <select
                  required
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">No patients found. Please add a patient first.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Dentist</label>
                <select
                  required
                  value={formDentistId}
                  onChange={(e) => setFormDentistId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium cursor-pointer"
                >
                  {dentists.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formDateTime}
                  onChange={(e) => setFormDateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes / Treatment Plan</label>
                <textarea
                  placeholder="E.g., Root canal session 1, regular checkup, extraction..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || patients.length === 0}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/10 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mock WhatsApp Dialog */}
      {whatsappModalOpen && selectedApptForWhatsapp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 transform transition-all overflow-hidden">
            {/* Header style matching WhatsApp top bar */}
            <div className="px-6 py-4 bg-[#075e54] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedApptForWhatsapp.patientName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-snug">{selectedApptForWhatsapp.patientName}</h3>
                  <p className="text-[10px] text-emerald-100">WhatsApp Alert Dispatcher</p>
                </div>
              </div>
              <button 
                onClick={() => setWhatsappModalOpen(false)}
                className="text-white hover:bg-slate-100/10 p-1.5 rounded-lg cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWhatsapp} className="p-6 space-y-4">
              {/* Template Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message Template</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateWhatsappTemplateText(selectedApptForWhatsapp, 'standard', patients.find(p => p.id === selectedApptForWhatsapp.patientId)?.contactNumber || 'N/A')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      whatsappTemplate === 'standard' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWhatsappTemplateText(selectedApptForWhatsapp, 'confirm', patients.find(p => p.id === selectedApptForWhatsapp.patientId)?.contactNumber || 'N/A')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      whatsappTemplate === 'confirm' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWhatsappTemplateText(selectedApptForWhatsapp, 'followup', patients.find(p => p.id === selectedApptForWhatsapp.patientId)?.contactNumber || 'N/A')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      whatsappTemplate === 'followup' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Follow-Up
                  </button>
                </div>
              </div>

              {/* Message Input / Edit */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message Body</label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Phone display */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Destination Number</span>
                <span className="text-xs font-extrabold text-slate-700">
                  +91 {patients.find(p => p.id === selectedApptForWhatsapp.patientId)?.contactNumber || 'N/A'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWhatsappModalOpen(false)}
                  disabled={sendingWhatsapp}
                  className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingWhatsapp}
                  className="px-5 py-3 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/10 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {sendingWhatsapp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Mock WhatsApp
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
