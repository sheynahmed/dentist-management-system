'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Command, 
  X, 
  Users, 
  Calendar, 
  Receipt, 
  Pill, 
  Stethoscope, 
  Package, 
  Wallet, 
  FileSpreadsheet, 
  Plus, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  contactNumber: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport?: () => void;
  onOpenPostOp?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenExport,
  onOpenPostOp
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/patients')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.patients) {
            setPatients(data.patients);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const filteredPatients = query.trim()
    ? patients.filter(p => 
        p.fullName.toLowerCase().includes(query.toLowerCase()) ||
        p.contactNumber.includes(query)
      ).slice(0, 5)
    : [];

  const actions = [
    { title: 'Write Dental Prescription (Rx)', category: 'Quick Action', icon: Pill, color: 'text-emerald-600 bg-emerald-50', action: () => navigateTo('/prescriptions') },
    { title: 'Log Clinical Visit & Case Sheet', category: 'Quick Action', icon: Stethoscope, color: 'text-indigo-600 bg-indigo-50', action: () => navigateTo('/clinical-notes') },
    { title: 'Book New Appointment', category: 'Quick Action', icon: Calendar, color: 'text-blue-600 bg-blue-50', action: () => navigateTo('/appointments') },
    { title: 'Register New Patient (Intake)', category: 'Quick Action', icon: Plus, color: 'text-teal-600 bg-teal-50', action: () => navigateTo('/patients/intake') },
    { title: 'Generate Billing Invoice', category: 'Quick Action', icon: Receipt, color: 'text-amber-600 bg-amber-50', action: () => navigateTo('/billing') },
    { title: 'Send Post-Op Care via WhatsApp', category: 'Quick Action', icon: Plus, color: 'text-green-600 bg-green-50', action: () => { onClose(); if (onOpenPostOp) onOpenPostOp(); } },
    { title: 'Export Clinic Data to CSV / Excel', category: 'Quick Action', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50', action: () => { onClose(); if (onOpenExport) onOpenExport(); } }
  ];

  const navigationItems = [
    { title: 'Clinic Dashboard', path: '/', icon: ArrowRight },
    { title: 'Patients Master Directory', path: '/patients', icon: Users },
    { title: 'Prescriptions (Rx)', path: '/prescriptions', icon: Pill },
    { title: 'Clinical Notes & Case Sheets', path: '/clinical-notes', icon: Stethoscope },
    { title: 'Appointments Calendar', path: '/appointments', icon: Calendar },
    { title: 'Billing & Invoices', path: '/billing', icon: Receipt },
    { title: 'Expenses & Overhead Ledger', path: '/expenses', icon: Wallet },
    { title: 'Inventory & Stock Upkeep', path: '/inventory', icon: Package }
  ];

  const filteredActions = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredNav = navigationItems.filter(n => 
    n.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a patient name, command, or shortcut..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          {/* Patient Matches */}
          {filteredPatients.length > 0 && (
            <div>
              <p className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Patients
              </p>
              <div className="space-y-1">
                {filteredPatients.map(pat => (
                  <button
                    key={pat.id}
                    onClick={() => navigateTo(`/patients?id=${pat.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {pat.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{pat.fullName}</p>
                        <p className="text-[11px] text-slate-400">{pat.contactNumber}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Quick Actions
              </p>
              <div className="space-y-1">
                {filteredActions.map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={i}
                      onClick={act.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${act.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-slate-800 text-xs">{act.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Navigation
              </p>
              <div className="space-y-1">
                {filteredNav.map((nav, i) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => navigateTo(nav.path)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left text-slate-700 font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{nav.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{nav.path}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredPatients.length === 0 && filteredActions.length === 0 && filteredNav.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No matching clinical commands or patient records found.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Press <strong>ESC</strong> to dismiss</span>
          <span>DentoCare Command Palette</span>
        </div>

      </div>
    </div>
  );
}
