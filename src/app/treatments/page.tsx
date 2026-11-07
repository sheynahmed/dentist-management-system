'use client';

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Check, X, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface Treatment {
  id: string;
  name: string;
  category: string;
  cost: number;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/treatments');
      const data = await res.json();
      if (data.success) {
        setTreatments(data.treatments);
      } else {
        showFeedback('error', data.message || 'Failed to load treatments');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Error fetching treatments from server');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const startEditing = (treatment: Treatment) => {
    setEditingId(treatment.id);
    setEditValue(treatment.cost.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveCost = async (id: string) => {
    const numericCost = parseFloat(editValue);
    if (isNaN(numericCost) || numericCost < 0) {
      showFeedback('error', 'Please enter a valid positive number for the cost');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/treatments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, cost: numericCost }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTreatments(prev =>
          prev.map(t => (t.id === id ? { ...t, cost: data.treatment.cost } : t))
        );
        setEditingId(null);
        showFeedback('success', `Price updated to ₹${data.treatment.cost.toFixed(2)}`);
      } else {
        showFeedback('error', data.message || 'Failed to update cost');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Network error updating treatment cost');
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique categories for filters
  const categories = ['All', ...Array.from(new Set(treatments.map(t => t.category)))];

  // Filter and search logic
  const filteredTreatments = treatments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500 animate-pulse" />
            Treatment & Services Pricing
          </h1>
          <p className="text-slate-500 mt-1">Configure, search, and update prices for dental operations and treatments.</p>
        </div>
        <button
          onClick={fetchTreatments}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-200 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm transition-all duration-300 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Control Bar: Search and Category Filter Tabs */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search treatments or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>

        {/* Categories Carousel/Tabs */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Treatments List Grid/Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading treatments list...</p>
        </div>
      ) : filteredTreatments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No treatments found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Try adjusting your search criteria or category filter to find the treatments you need.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4.5 font-semibold">Treatment Service</th>
                  <th className="px-6 py-4.5 font-semibold">Category</th>
                  <th className="px-6 py-4.5 font-semibold text-right">Cost Price</th>
                  <th className="px-6 py-4.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTreatments.map((treatment) => {
                  const isEditing = editingId === treatment.id;

                  return (
                    <tr 
                      key={treatment.id} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{treatment.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">ID: {treatment.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {treatment.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-500 font-semibold">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              disabled={submitting}
                              className="w-24 px-2 py-1 text-sm text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-800"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            ₹{treatment.cost.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveCost(treatment.id)}
                              disabled={submitting}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Save changes"
                            >
                              <Check className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={submitting}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(treatment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit Price
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
