'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  Activity, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Link as LinkIcon,
  Unlink,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  patientId: string;
  status: 'PENDING' | 'PAID';
  issueDate: string;
  dueDate: string;
  taxRate: number;
  discount: number;
  subtotal: number;
  total: number;
  paidAmount: number;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string;
}

interface InvoiceItem {
  id: string;
  treatmentName: string;
  cost: number;
  quantity: number;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
  invoiceId: string | null;
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [linkedExpenses, setLinkedExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch single invoice details
      const invRes = await fetch(`/api/billing/${id}`);
      const invData = await invRes.json();
      if (invData.success) {
        setInvoice(invData.invoice);
        setItems(invData.items);
        setLinkedExpenses(invData.linkedExpenses);
      } else {
        setErrorMessage(invData.message || 'Invoice not found');
      }

      // 2. Fetch all expenses for link selection
      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      if (expData.success) {
        setAllExpenses(expData.expenses);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error loading invoice records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleLinkExpense = async (expenseId: string, shouldLink: boolean) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          invoiceId: shouldLink ? id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(shouldLink ? 'Expense linked to invoice.' : 'Expense unlinked from invoice.');
        // Refresh local data
        loadData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update expense linkage.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error updating expense linkage.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading invoice statement...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-lg text-center space-y-6 animate-scale-up">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoice Not Found</h1>
            <p className="text-slate-500 mt-2">The invoice identifier you are trying to access does not exist or has been deleted.</p>
          </div>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Profit Margins
  const totalLinkedExpenseAmount = linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netMargin = invoice.total - totalLinkedExpenseAmount;
  const marginPercentage = invoice.total > 0 ? (netMargin / invoice.total) * 100 : 0;

  // Filter clinical expenses that can be linked
  // Show expenses that are either unlinked OR linked to this specific invoice
  const linkableExpenses = allExpenses.filter(exp => 
    exp.invoiceId === null || exp.invoiceId === undefined || exp.invoiceId === id
  );

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16 font-sans">
      {/* Sticky action bar (Hidden on print) */}
      <div className="no-print sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/billing"
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">Invoice Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${invoice.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="font-bold text-sm tracking-wide capitalize">{invoice.status.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.print();
                }
              }}
              className="inline-flex items-center gap-2 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/10 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side = A4 Invoice Sheet, Right Side = Margins & Expense Linking Panel (Hidden on print) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: A4 Invoice Sheet (Takes 2 cols) */}
        <div className="lg:col-span-2 print-container">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 md:p-14 min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50/50 via-white to-white">
            
            <div className="space-y-10">
              {/* Header: Clinic Branding & Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white">
                    <Activity className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">DENTO CARE</h1>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Dental Clinic & Surgery</p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-800 text-sm">DentoCare Medical Center Ltd.</p>
                  <p>123 Clinic Boulevard, Suite 400</p>
                  <p>Kochi, Kerala, PIN 682016</p>
                  <p>Phone: +91 484 234 5678 | billing@dentocare.com</p>
                </div>
              </div>

              {/* Billing Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoiced To</h3>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-tight">{invoice.patientName}</h4>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      {invoice.patientPhone && <p className="flex items-center gap-1.5"><span className="text-slate-400 font-medium">Phone:</span> <span className="font-semibold text-slate-700">{invoice.patientPhone}</span></p>}
                      {invoice.patientEmail && <p className="flex items-center gap-1.5"><span className="text-slate-400 font-medium">Email:</span> <span className="font-semibold text-slate-700">{invoice.patientEmail}</span></p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:border-l md:border-slate-200/60 md:pl-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Invoice No:</span>
                      <span className="font-bold text-slate-800 font-mono uppercase">INV-{invoice.id.substring(0, 8)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Payment Status:</span>
                      <span className={`font-bold ${invoice.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{invoice.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Issue Date:</span>
                      <span className="font-semibold text-slate-700">{invoice.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Due Date:</span>
                      <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-3 font-semibold">Dental Procedure / Service Description</th>
                        <th className="py-3 text-right font-semibold w-24">Unit Cost</th>
                        <th className="py-3 text-center font-semibold w-16">Qty</th>
                        <th className="py-3 text-right font-semibold w-32">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-4 font-semibold text-slate-900">
                            {item.treatmentName}
                          </td>
                          <td className="py-4 text-right font-mono">
                            ₹{item.cost.toFixed(2)}
                          </td>
                          <td className="py-4 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-4 text-right font-bold text-slate-950 font-mono">
                            ₹{(item.cost * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-80 space-y-2.5 text-sm border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800 font-mono">₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax ({invoice.taxRate}%):</span>
                      <span className="font-bold text-slate-800 font-mono">+ ₹{(invoice.subtotal * (invoice.taxRate / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Discount applied:</span>
                      <span className="font-bold text-emerald-600 font-mono">- ₹{invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-950 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    <span>Amount Due:</span>
                    <span className="text-lg text-emerald-700 font-mono">₹{invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer & Notes */}
            <div className="border-t border-slate-100 pt-8 mt-12 text-center text-xs text-slate-400 space-y-3">
              <p className="font-medium text-slate-500">Please pay this invoice before the due date. Thank you for trusting DentoCare with your smile!</p>
              <div className="flex justify-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-350">
                <span>Standard Terms</span>
                <span>•</span>
                <span>All sales are final</span>
                <span>•</span>
                <span>24h cancellation notice required</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Profit Margins & Clinic Expense Linker (Hidden on Print!) */}
        <div className="no-print lg:col-span-1 space-y-6">
          
          {/* Action Status Messages */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              {errorMessage}
            </div>
          )}

          {/* Profit Margin Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">Invoice Profit Margin</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed</span>
                <span className="text-sm font-extrabold text-slate-700">₹{invoice.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Expenses</span>
                <span className="text-sm font-extrabold text-slate-700">₹{totalLinkedExpenseAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Margin Score Panel */}
            <div className={`p-4 rounded-2xl border text-center space-y-1 ${
              netMargin >= 0 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-850' 
                : 'bg-rose-50 border-rose-200 text-rose-850'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-widest block opacity-70">Net Profit Margin</span>
              <h2 className="text-2xl font-black font-mono">₹{netMargin.toLocaleString('en-IN')}</h2>
              
              <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold opacity-80">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Margin Share: {marginPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Clinic Expense Linking Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4 flex flex-col justify-between min-h-[300px]">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <LinkIcon className="h-4.5 w-4.5 text-emerald-600" />
                Link Clinical Expenses
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Link specific lab charges, material cost, or specialist payments incurred for this treatment invoice.
              </p>
            </div>

            {/* Expense selection list */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 my-3 flex-1">
              {linkableExpenses.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No clinical expenses available in ledger.
                </div>
              ) : (
                linkableExpenses.map(exp => {
                  const isLinked = exp.invoiceId === id;
                  return (
                    <label 
                      key={exp.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50 ${
                        isLinked 
                          ? 'border-emerald-300 bg-emerald-50/20' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isLinked}
                        disabled={actionLoading}
                        onChange={() => handleLinkExpense(exp.id, !isLinked)}
                        className="mt-1 h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                      />
                      <div className="text-xs flex-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span className="capitalize">{exp.name}</span>
                          <span className="font-extrabold text-slate-900 font-mono">₹{exp.amount}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>{exp.category} • {exp.date}</span>
                          {exp.notes && <span className="italic truncate max-w-[120px]" title={exp.notes}>{exp.notes}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-center">
              Linking updates expenses ledger in real-time.
            </div>
          </div>

        </div>
      </div>
      
      {/* Custom print CSS styling to ensure print layout fits nicely */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          aside, header, footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
