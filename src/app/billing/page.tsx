'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Receipt, Plus, Search, Filter, Mail, Share2, Printer, 
  Trash2, PlusCircle, MinusCircle, CheckCircle, Clock, 
  DollarSign, Sparkles, Check, ShieldAlert, ArrowUpRight,
  FileDown, Landmark, ArrowRight, UserCheck, ReceiptIndianRupee
} from 'lucide-react';

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
}

interface Patient {
  id: string;
  fullName: string;
}

interface Treatment {
  id: string;
  name: string;
  cost: number;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
}

interface InvoiceItemForm {
  treatmentId: string;
  quantity: number;
}

interface SpecialistCommissions {
  totalRevenue: number;
  commission: number;
  treatments: {
    invoiceId: string;
    patientName: string;
    treatmentName: string;
    date: string;
    amount: number;
    commission: number;
  }[];
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commissions, setCommissions] = useState<Record<string, SpecialistCommissions>>({});
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PENDING' | 'PAID' | 'COMMISSIONS'>('All');

  // Form State
  const [formPatientId, setFormPatientId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formTaxRate, setFormTaxRate] = useState(5); // Default 5% tax
  const [formDiscount, setFormDiscount] = useState(0);
  const [formItems, setFormItems] = useState<InvoiceItemForm[]>([{ treatmentId: '', quantity: 1 }]);

  // Messaging/Loading States
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch billing/invoice basic data
      const res = await fetch('/api/billing');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
        setPatients(data.patients);
        setTreatments(data.treatments);
      } else {
        setErrorMessage(data.message || 'Failed to load billing records');
      }

      // Fetch expenses
      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      if (expData.success) {
        setExpenses(expData.expenses);
      }

      // Fetch commissions splits
      const commRes = await fetch('/api/commissions');
      const commData = await commRes.json();
      if (commData.success) {
        setCommissions(commData.commissions);
      }

    } catch (err) {
      console.error(err);
      setErrorMessage('Network error fetching billing and commissions data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormItems(prev => [...prev, { treatmentId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    setFormItems(prev =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Live calculation helpers
  const calculateSubtotal = () => {
    return formItems.reduce((acc, item) => {
      const treatment = treatments.find(t => t.id === item.treatmentId);
      if (!treatment) return acc;
      return acc + treatment.cost * (item.quantity || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * (formTaxRate / 100);
  const discountAmount = Number(formDiscount) || 0;
  const finalTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formDueDate) {
      setErrorMessage('Please select a patient and due date');
      return;
    }
    
    const validItems = formItems.filter(item => item.treatmentId !== '');
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one treatment item to the invoice');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          dueDate: formDueDate,
          taxRate: formTaxRate,
          discount: formDiscount,
          status: 'PENDING',
          items: validItems
        })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Invoice created successfully');
        setInvoices(prev => [data.invoice, ...prev]);
        setShowModal(false);
        setFormPatientId('');
        setFormDueDate('');
        setFormDiscount(0);
        setFormItems([{ treatmentId: '', quantity: 1 }]);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.message || 'Failed to create invoice');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error booking invoice onto server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAID' })
      });
      const data = await res.json();

      if (data.success) {
        setInvoices(prev =>
          prev.map(inv => (inv.id === id ? { ...inv, status: 'PAID', paidAmount: inv.total } : inv))
        );
        setSuccessMessage('Invoice marked as Paid');
        // Refresh commissions splits
        const commRes = await fetch('/api/commissions');
        const commData = await commRes.json();
        if (commData.success) {
          setCommissions(commData.commissions);
        }
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.message || 'Failed to update invoice');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error marking invoice paid');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/billing/${id}/email`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error sending email');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getWhatsAppLink = (invoice: Invoice) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceUrl = `${origin}/invoice/${invoice.id}`;
    const text = encodeURIComponent(
      `Hello ${invoice.patientName},\n\nThis is a message from DentoCare Clinic. Your invoice is ready for viewing.\n\nTotal Due: ₹${invoice.total.toFixed(2)}\nInvoice Status: ${invoice.status}\nLink: ${invoiceUrl}\n\nThank you for choosing DentoCare!`
    );
    return `https://wa.me/?text=${text}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This will remove all associated line items.')) return;

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/billing?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        setSuccessMessage('Invoice deleted successfully');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.message || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error deleting invoice');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark specialist commissions payout as settled & log as expense
  const handleSettleCommission = async (specialist: string, amount: number) => {
    if (amount <= 0) {
      setErrorMessage('No commission payout owed to settle.');
      return;
    }

    if (!confirm(`Are you sure you want to settle the ₹${amount.toLocaleString('en-IN')} commission payout to the ${specialist.toUpperCase()}? This will auto-log a corresponding Salaries expense outflow.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${specialist} split payout`,
          amount,
          date: new Date().toISOString().split('T')[0],
          category: 'Salaries',
          notes: `Settled 40% specialist commission payout for Orthodontist/Endo/Perio cases.`
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Commission payout settled! ₹${amount.toLocaleString('en-IN')} logged in expenses.`);
        fetchBillingData(); // Reload expenses and recalculate commissions
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage('Failed to log commission split settlement.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error logging payout settlement.');
    } finally {
      setLoading(false);
    }
  };

  // Compile and trigger browser download of Profit & Loss CSV Statement
  const handleExportPL = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    let csvContent = `DentoCare Clinic - Profit & Loss (P&L) Statement\r\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\r\n\r\n`;
    
    // Financial Summary
    csvContent += `FINANCIAL SUMMARY\r\n`;
    csvContent += `Total Settled Revenue (A),Total Expenses (B),Net Clinic Profit (A - B)\r\n`;
    csvContent += `₹${totalRevenue.toFixed(2)},₹${totalExpenses.toFixed(2)},₹${netProfit.toFixed(2)}\r\n\r\n`;

    // Revenue details
    csvContent += `SETTLED REVENUE INFLOWS\r\n`;
    csvContent += `Date,Invoice ID,Patient Name,Billed Amount\r\n`;
    paidInvoices.forEach(inv => {
      csvContent += `${inv.issueDate},INV-${inv.id.substring(0, 8).toUpperCase()},"${inv.patientName}",₹${inv.total.toFixed(2)}\r\n`;
    });
    csvContent += `,,Total Revenue,₹${totalRevenue.toFixed(2)}\r\n\r\n`;

    // Expense details
    csvContent += `CLINICAL EXPENSE OUTFLOWS\r\n`;
    csvContent += `Date,Expense Name,Category,Amount,Notes\r\n`;
    expenses.forEach(exp => {
      const cleanNotes = exp.notes ? exp.notes.replace(/"/g, '""') : '';
      csvContent += `${exp.date},"${exp.name.toUpperCase()}","${exp.category}",₹${exp.amount.toFixed(2)},"${cleanNotes}"\r\n`;
    });
    csvContent += `,,,Total Expenses,₹${totalExpenses.toFixed(2)}\r\n`;

    // Create dynamic download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DentoCare_PL_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMessage('Profit & Loss statement downloaded successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Filter invoices for display
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-7 w-7 text-emerald-500" />
            Billing & Invoices
          </h1>
          <p className="text-slate-500 mt-1">Manage client statements, calculate commissions splits, and export clinical accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPL}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            Export P&L Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium animate-fade-in flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700 font-bold ml-4">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fade-in flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filter and navigation tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name..."
            value={searchQuery}
            disabled={statusFilter === 'COMMISSIONS'}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 w-fit self-start md:self-auto">
          {(['All', 'PENDING', 'PAID', 'COMMISSIONS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-950'
              }`}
            >
              {tab === 'All' ? 'All Invoices' : tab === 'COMMISSIONS' ? 'Consultant splits' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Content Switcher */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading ledger...</p>
        </div>
      ) : statusFilter === 'COMMISSIONS' ? (
        /* SPECIALIST COMMISSIONS CONSOLE */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {Object.keys(commissions).map((specialist) => {
            const data = commissions[specialist];
            return (
              <div 
                key={specialist} 
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between min-h-[400px] relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-800 text-sm capitalize flex items-center gap-1.5">
                      <Landmark className="h-4.5 w-4.5 text-indigo-600" />
                      {specialist} Splits (40%)
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed</span>
                      <span className="text-sm font-extrabold text-slate-700">₹{data.totalRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-indigo-600">Commission Owed</span>
                      <span className="text-sm font-black text-indigo-700">₹{data.commission.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Associated Treatment Cases</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {data.treatments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No paid treatments logged for this specialty.</p>
                      ) : (
                        data.treatments.map((t, idx) => (
                          <div key={idx} className="bg-white border border-slate-200/50 p-2.5 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span className="truncate max-w-[130px]">{t.patientName}</span>
                              <span className="text-[10px] text-slate-400 font-medium">INV-{t.invoiceId.substring(0, 5).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1">
                              <span>{t.treatmentName}</span>
                              <span className="font-extrabold text-indigo-600">₹{t.commission.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => handleSettleCommission(specialist, data.commission)}
                    disabled={data.commission === 0}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-900/10 cursor-pointer active:scale-95"
                  >
                    <UserCheck className="h-4 w-4" />
                    Settle Specialist Splits
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD INVOICES LIST VIEW */
        filteredInvoices.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Receipt className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No invoices found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              We couldn't find any invoice sheets matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4.5 font-semibold">Patient Name</th>
                    <th className="px-6 py-4.5 font-semibold">Issue / Due Date</th>
                    <th className="px-6 py-4.5 font-semibold">Total Cost</th>
                    <th className="px-6 py-4.5 font-semibold">Status</th>
                    <th className="px-6 py-4.5 text-right font-semibold">Share & Send Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices
                    .filter(inv => statusFilter === 'All' || inv.status === statusFilter)
                    .map((inv) => {
                      const isPaid = inv.status === 'PAID';
                      const isPending = inv.status === 'PENDING';
                      const actionLoading = actionLoadingId === inv.id;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{inv.patientName}</div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono">INV-{inv.id.substring(0, 8).toUpperCase()}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400">Issued:</span>
                              <span className="font-medium text-slate-700">{inv.issueDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-slate-400">Due:</span>
                              <span className={`font-semibold ${isPending ? 'text-rose-500' : 'text-slate-600'}`}>{inv.dueDate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-950">
                            ₹{inv.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              isPaid 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                : 'bg-amber-50 text-amber-800 border-amber-100'
                            }`}>
                              {isPaid ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <button
                                  onClick={() => handleMarkAsPaid(inv.id)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 rounded-lg transition-all cursor-pointer"
                                  title="Mark as Paid"
                                >
                                  Collect Fee
                                </button>
                              )}

                              <Link
                                href={`/invoice/${inv.id}`}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="View / Print Invoice"
                              >
                                <Printer className="h-4 w-4" />
                              </Link>

                              <button
                                onClick={() => handleSendEmail(inv.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Email PDF Invoice to Patient"
                              >
                                <Mail className="h-4 w-4" />
                              </button>

                              <a
                                href={getWhatsAppLink(inv)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Share on WhatsApp"
                              >
                                <Share2 className="h-4 w-4" />
                              </a>

                              <button
                                onClick={() => handleDelete(inv.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Invoice"
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
          </div>
        )
      )}

      {/* Create Invoice Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 transform transition-all overflow-hidden">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Generate Patient Invoice</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Patient */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient</label>
                  <select
                    required
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Items List Header */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Treatment Procedures</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                {/* Items Builder */}
                <div className="space-y-3">
                  {formItems.map((item, index) => {
                    const selectedTreatment = treatments.find(t => t.id === item.treatmentId);
                    const cost = selectedTreatment ? selectedTreatment.cost : 0;
                    
                    return (
                      <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100/80">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service / Treatment</label>
                          <select
                            required
                            value={item.treatmentId}
                            onChange={(e) => handleItemChange(index, 'treatmentId', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-semibold cursor-pointer"
                          >
                            <option value="">-- Select Service --</option>
                            {treatments.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} (₹{t.cost.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-semibold"
                          />
                        </div>

                        <div className="w-24 text-right pr-2 pb-2">
                          <span className="text-slate-400 text-[10px] block font-bold uppercase mb-1">Total Cost</span>
                          <span className="text-xs font-bold text-slate-800">
                            ₹{(cost * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={formItems.length === 1}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                          title="Remove item"
                        >
                          <MinusCircle className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Taxation & Discount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Cost Summary Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2.5 font-sans border border-slate-800">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-200">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Tax ({formTaxRate}%):</span>
                  <span className="font-semibold text-slate-200">+ ₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Discount:</span>
                  <span className="font-semibold text-slate-200">- ₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 my-1 pt-2 flex justify-between text-base font-bold text-emerald-400">
                  <span>Grand Total:</span>
                  <span className="text-lg">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || patients.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/10 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
