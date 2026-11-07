'use client';

import React, { useState } from 'react';
import { Download, X, FileSpreadsheet, Users, Receipt, Wallet, Package, Pill, Check } from 'lucide-react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (type: string) => {
    setDownloading(type);
    window.location.href = `/api/export?type=${type}`;
    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  };

  const exportOptions = [
    {
      type: 'patients',
      title: 'Patients Master Directory',
      desc: 'All registered patients with contacts, DOB, emergency details, and registration dates.',
      icon: Users,
      color: 'bg-blue-50 text-blue-700'
    },
    {
      type: 'invoices',
      title: 'Billing & Invoices Ledger',
      desc: 'Full clinical billing statements, settled vs pending accounts, taxes, and discounts.',
      icon: Receipt,
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      type: 'expenses',
      title: 'Expense & Overhead Register',
      desc: 'Clinic operational expenses categorized by utilities, rent, supplies, and dates.',
      icon: Wallet,
      color: 'bg-amber-50 text-amber-700'
    },
    {
      type: 'inventory',
      title: 'Inventory & Materials Stock',
      desc: 'Stock item balances, unit values, reorder thresholds, and low-stock alerts.',
      icon: Package,
      color: 'bg-indigo-50 text-indigo-700'
    },
    {
      type: 'prescriptions',
      title: 'Digital Prescriptions History',
      desc: 'All issued prescriptions, diagnosed conditions, and prescribed dental drug regimens.',
      icon: Pill,
      color: 'bg-rose-50 text-rose-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Clinic Data Export Center</h2>
              <p className="text-xs text-slate-500">Download formatted CSV spreadsheets for Excel or accounting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {exportOptions.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = downloading === opt.type;

            return (
              <div
                key={opt.type}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-emerald-300 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl ${opt.color} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{opt.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(opt.type)}
                  disabled={isCurrent}
                  className="flex items-center gap-2 bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isCurrent ? 'Downloading...' : 'Export CSV'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-400">
          <span>All exports are generated in UTF-8 CSV format.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
