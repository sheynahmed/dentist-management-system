'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Filter,
  ArrowUpRight
} from 'lucide-react';

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const PREDEFINED_EXPENSES = [
  { name: 'rent', defaultAmount: 11000, category: 'Fixed' },
  { name: 'newspaper', defaultAmount: 320, category: 'Utilities' },
  { name: 'harithakarmasena', defaultAmount: 100, category: 'Utilities' },
  { name: 'sister salary', defaultAmount: 6500, category: 'Salaries' },
  { name: 'current bill', defaultAmount: 0, category: 'Utilities' }, // Variable
  { name: 'lab charge', defaultAmount: 0, category: 'Clinical' }, // Variable
  { name: 'material cost', defaultAmount: 0, category: 'Clinical' }, // Variable
  { name: 'image bill', defaultAmount: 0, category: 'Clinical' }, // Variable
  { name: 'maintenance', defaultAmount: 0, category: 'Maintenance' }, // Variable
  { name: 'orthodontist bill', defaultAmount: 0, category: 'Salaries' }, // Variable
  { name: 'endodontist bill', defaultAmount: 0, category: 'Salaries' }, // Variable
  { name: 'periodontist bill', defaultAmount: 0, category: 'Salaries' }, // Variable
];

const CATEGORIES = ['Fixed', 'Salaries', 'Utilities', 'Clinical', 'Maintenance', 'Miscellaneous'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPredefined, setSelectedPredefined] = useState('');
  const [customName, setCustomName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Fixed');
  const [notes, setNotes] = useState('');

  // Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
      } else {
        setError(data.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Predefined selection change
  const handlePredefinedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPredefined(val);

    if (val === 'custom') {
      setCustomName('');
      setAmount('');
    } else {
      const found = PREDEFINED_EXPENSES.find(item => item.name === val);
      if (found) {
        setAmount(found.defaultAmount > 0 ? found.defaultAmount.toString() : '');
        setCategory(found.category);
      }
    }
  };

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingId(null);
    setSelectedPredefined('');
    setCustomName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Fixed');
    setNotes('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    const isPredefined = PREDEFINED_EXPENSES.some(item => item.name === exp.name);
    if (isPredefined) {
      setSelectedPredefined(exp.name);
      setCustomName('');
    } else {
      setSelectedPredefined('custom');
      setCustomName(exp.name);
    }
    setAmount(exp.amount.toString());
    setDate(exp.date);
    setCategory(exp.category);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  // Submit form (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = selectedPredefined === 'custom' ? customName.trim() : selectedPredefined;
    if (!finalName) {
      showToast('Please select or input an expense name', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a date', 'error');
      return;
    }

    const payload = {
      id: editingId,
      name: finalName,
      amount: Number(amount),
      date,
      category,
      notes: notes.trim() || null
    };

    try {
      const url = '/api/expenses';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        showToast(editingId ? 'Expense updated successfully' : 'Expense logged successfully', 'success');
        setIsModalOpen(false);
        fetchExpenses();
      } else {
        showToast(result.message || 'Failed to save expense', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, failed to save expense', 'error');
    }
  };

  // Delete expense
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the expense for "${name.toUpperCase()}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast('Expense deleted successfully', 'success');
        fetchExpenses();
      } else {
        showToast(result.message || 'Failed to delete expense', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, failed to delete expense', 'error');
    }
  };

  // Filter logic
  const monthsList = Array.from(new Set(
    expenses.map(e => {
      const d = new Date(e.date);
      return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    })
  )).sort((a, b) => new Date(b) as any - (new Date(a) as any)); // Sorted newest first

  const filteredExpenses = expenses.filter(exp => {
    // Search matching
    const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category matching
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;

    // Month matching
    let matchesMonth = true;
    if (selectedMonth !== 'All') {
      const expMonthStr = new Date(exp.date).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      matchesMonth = expMonthStr === selectedMonth;
    }

    return matchesSearch && matchesCategory && matchesMonth;
  });

  // Calculate Overview metrics (of currently filtered or total depending on need; let's base it on filtered list to be dynamic)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const fixedExpenses = filteredExpenses
    .filter(e => e.category === 'Fixed' || e.name === 'rent')
    .reduce((sum, e) => sum + e.amount, 0);
  const clinicalExpenses = filteredExpenses
    .filter(e => e.category === 'Clinical')
    .reduce((sum, e) => sum + e.amount, 0);
  const utilitiesExpenses = filteredExpenses
    .filter(e => e.category === 'Utilities' || e.category === 'Maintenance')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl z-50 text-sm font-semibold transition-all border animate-slide-up ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expense Management</h1>
          <p className="text-slate-500 mt-1">Track fixed commitments, utility bills, clinical supplies, and variable costs.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 py-3 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Log New Expense
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform duration-250 hover:-translate-y-0.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{totalExpenses.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-rose-600 font-medium">Outflow this filtered period</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Fixed Outflows */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform duration-250 hover:-translate-y-0.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fixed Outflows</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{fixedExpenses.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-500">Rent and permanent fixed costs</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Clinical & Lab Costs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform duration-250 hover:-translate-y-0.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical & Lab Bills</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{clinicalExpenses.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-blue-600 font-medium">Materials & lab services</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Utilities & Upkeep */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform duration-250 hover:-translate-y-0.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilities & Maintenance</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{utilitiesExpenses.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-amber-600 font-medium">Power, cleaning, chair upkeep</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Table & Search Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search and Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl text-sm">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-slate-600 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-slate-600 cursor-pointer"
              >
                <option value="All">All Months</option>
                {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
              <p className="text-sm font-medium text-slate-500">Loading clinic expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No expenses logged matching the filters.</p>
              <p className="text-xs text-slate-400">Click &quot;Log New Expense&quot; above to log an entry.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase bg-slate-50/20">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Expense Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Notes</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800 capitalize">
                      {exp.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        exp.category === 'Fixed' ? 'bg-indigo-50 text-indigo-700' :
                        exp.category === 'Salaries' ? 'bg-emerald-50 text-emerald-700' :
                        exp.category === 'Utilities' ? 'bg-amber-50 text-amber-700' :
                        exp.category === 'Clinical' ? 'bg-rose-50 text-rose-700' :
                        exp.category === 'Maintenance' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 max-w-xs truncate" title={exp.notes || ''}>
                      {exp.notes || '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-900 text-base">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit expense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.name)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Clinic Expense' : 'Log New Expense'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Predefined Expense Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expense Item</label>
                <select
                  value={selectedPredefined}
                  onChange={handlePredefinedChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 capitalize cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Select Expense Option --</option>
                  <optgroup label="Fixed Price Items">
                    <option value="rent">Rent (₹11,000)</option>
                    <option value="sister salary">Sister Salary (₹6,500)</option>
                    <option value="newspaper">Newspaper (₹320)</option>
                    <option value="harithakarmasena">Harithakarmasena (₹100)</option>
                  </optgroup>
                  <optgroup label="Variable Price Items">
                    <option value="current bill">Current Bill</option>
                    <option value="lab charge">Lab Charge</option>
                    <option value="material cost">Material Cost</option>
                    <option value="image bill">Image Bill</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="orthodontist bill">Orthodontist Bill</option>
                    <option value="endodontist bill">Endodontist Bill</option>
                    <option value="periodontist bill">Periodontist Bill</option>
                  </optgroup>
                  <option value="custom">-- Custom (Write-In) --</option>
                </select>
              </div>

              {/* Custom Name input (only if custom is selected) */}
              {selectedPredefined === 'custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custom Expense Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom expense name..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Amount in Rupees"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-800"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  placeholder="Details, bill reference numbers, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/10 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  {editingId ? 'Save Changes' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
