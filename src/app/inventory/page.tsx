'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  DollarSign, 
  RefreshCw,
  Info
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  updatedAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  
  // Create / Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formMinThreshold, setFormMinThreshold] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formCostPerUnit, setFormCostPerUnit] = useState('');

  // Restock form state
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Log usage form state
  const [isUseOpen, setIsUseOpen] = useState(false);
  const [useItem, setUseItem] = useState<InventoryItem | null>(null);
  const [useAmount, setUseAmount] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      } else {
        setError(data.message || 'Failed to fetch inventory items.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred loading material inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Restock calculation auto-fill
  useEffect(() => {
    if (restockItem && restockAmount) {
      const calculated = Number(restockAmount) * restockItem.costPerUnit;
      setTotalCost(calculated.toFixed(2));
    } else {
      setTotalCost('');
    }
  }, [restockAmount, restockItem]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormQuantity('');
    setFormMinThreshold('');
    setFormUnit('pcs');
    setFormCostPerUnit('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormQuantity(item.quantity.toString());
    setFormMinThreshold(item.minThreshold.toString());
    setFormUnit(item.unit);
    setFormCostPerUnit(item.costPerUnit.toString());
    setIsModalOpen(true);
  };

  const handleOpenRestockModal = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockAmount('');
    setTotalCost('');
    setIsRestockOpen(true);
  };

  const handleOpenUseModal = (item: InventoryItem) => {
    setUseItem(item);
    setUseAmount('');
    setIsUseOpen(true);
  };

  // Submit Add / Edit Item
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formQuantity === '' || formMinThreshold === '' || formCostPerUnit === '') {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const payload = {
      id: editingId,
      name: formName.trim(),
      quantity: Number(formQuantity),
      minThreshold: Number(formMinThreshold),
      unit: formUnit.trim(),
      costPerUnit: Number(formCostPerUnit)
    };

    try {
      setActionLoading(true);
      const url = '/api/inventory';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(editingId ? 'Material details updated successfully.' : 'New material added to inventory.', 'success');
        setIsModalOpen(false);
        fetchInventory();
      } else {
        showToast(data.message || 'Failed to save inventory item.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, failed to save item.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Restock operation (updates inventory and creates a clinical expense)
  const handleSubmitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || !restockAmount || Number(restockAmount) <= 0) {
      showToast('Please enter a valid restock quantity.', 'error');
      return;
    }

    const newQty = restockItem.quantity + Number(restockAmount);
    const calculatedCost = Number(totalCost) || (Number(restockAmount) * restockItem.costPerUnit);

    try {
      setActionLoading(true);
      // 1. Update inventory stock level
      const invRes = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restockItem.id,
          quantity: newQty
        })
      });
      const invData = await invRes.json();

      if (!invData.success) {
        showToast(invData.message || 'Failed to update inventory stock.', 'error');
        return;
      }

      // 2. Log corresponding purchase outflow to Expense Ledger
      const expRes = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'material cost',
          amount: calculatedCost,
          date: new Date().toISOString().split('T')[0],
          category: 'Clinical',
          notes: `Restock: ${restockItem.name} (x${restockAmount} ${restockItem.unit})`
        })
      });
      const expData = await expRes.json();

      if (expData.success) {
        showToast(`Stock updated & ₹${calculatedCost.toLocaleString('en-IN')} logged in expenses.`, 'success');
        setIsRestockOpen(false);
        fetchInventory();
      } else {
        showToast('Inventory updated, but failed to log expense auto-outflow.', 'error');
      }

    } catch (err) {
      console.error(err);
      showToast('Error during restock operation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Log Use operation
  const handleSubmitUse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useItem || !useAmount || Number(useAmount) <= 0) {
      showToast('Please enter a valid usage quantity.', 'error');
      return;
    }

    const amt = Number(useAmount);
    if (amt > useItem.quantity) {
      showToast(`Cannot use more than current stock (${useItem.quantity} ${useItem.unit}).`, 'error');
      return;
    }

    const newQty = useItem.quantity - amt;

    try {
      setActionLoading(true);
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: useItem.id,
          quantity: newQty
        })
      });
      const data = await res.json();

      if (data.success) {
        const isBelowThreshold = newQty <= useItem.minThreshold;
        if (isBelowThreshold) {
          showToast(`Logged usage of ${amt} ${useItem.unit}. Warning: stock is below threshold!`, 'error');
        } else {
          showToast(`Successfully logged usage of ${amt} ${useItem.unit}.`, 'success');
        }
        setIsUseOpen(false);
        fetchInventory();
      } else {
        showToast(data.message || 'Failed to update stock.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error during usage logging operation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;

    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Material removed from inventory.', 'success');
        fetchInventory();
      } else {
        showToast(data.message || 'Failed to delete inventory item.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, failed to delete material.', 'error');
    }
  };

  // Filtered inventory
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStock = true;
    if (filterStock === 'LOW') {
      matchesStock = item.quantity <= item.minThreshold;
    } else if (filterStock === 'OK') {
      matchesStock = item.quantity > item.minThreshold;
    }

    return matchesSearch && matchesStock;
  });

  const lowStockCount = items.filter(item => item.quantity <= item.minThreshold).length;
  const totalMaterialValue = items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  return (
    <div className="space-y-8 pb-10">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl z-50 text-sm font-semibold transition-all border animate-slide-up ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-emerald-600" />
            Inventory & Supply Control
          </h1>
          <p className="text-slate-500 mt-1">Track clinical stock levels, safety thresholds, and log material purchases.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 py-3 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Supply Material
        </button>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Card 1: Total Supplies */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Items Cataloged</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{items.length}</h3>
            <p className="text-xs text-slate-500">Essential dental supplies</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Warnings</p>
            <h3 className={`text-3xl font-extrabold ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockCount}
            </h3>
            <p className="text-xs text-slate-500">Below minimum safety levels</p>
          </div>
          <div className={`p-4 rounded-2xl ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Est Stock Asset Value */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supplies Asset Valuation</p>
            <h3 className="text-3xl font-extrabold text-slate-800">₹{totalMaterialValue.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-600 font-medium">Estimated replacement cost</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Supplies Grid / Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search & Filters bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search supply inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Status:</span>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">All Stocks</option>
              <option value="LOW">Low Stock Alerts Only</option>
              <option value="OK">In-Stock Only</option>
            </select>
          </div>
        </div>

        {/* Inventory List Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
              <p className="text-sm font-medium text-slate-500">Loading supply catalog...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-600">No supply items found.</p>
              <p className="text-xs text-slate-400">Click &quot;Add Supply Material&quot; to catalog a new product.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase bg-slate-50/20">
                  <th className="py-4 px-6">Material Name</th>
                  <th className="py-4 px-6 text-right">In-Stock Level</th>
                  <th className="py-4 px-6 text-right">Safety Threshold</th>
                  <th className="py-4 px-6 text-right">Unit Price</th>
                  <th className="py-4 px-6">Status Badge</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minThreshold;
                  return (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="py-4.5 px-6 font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-4.5 px-6 text-right font-extrabold text-slate-900 text-sm">
                        {item.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                      </td>
                      <td className="py-4.5 px-6 text-right font-semibold text-slate-600 text-xs">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-4.5 px-6 text-right font-semibold text-slate-600 text-xs">
                        ₹{item.costPerUnit.toFixed(2)}
                      </td>
                      <td className="py-4.5 px-6">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            Reorder Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Adequate Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenUseModal(item)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 transition-all cursor-pointer"
                            title="Log material usage"
                          >
                            Use Stock
                          </button>
                          <button
                            onClick={() => handleOpenRestockModal(item)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer"
                            title="Restock material"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit supply details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete material"
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
          )}
        </div>
      </div>

      {/* Add / Edit Supply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Material Supply' : 'Add New Material Supply'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitItem} className="p-6 space-y-5">
              {/* Material Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Material / Supply Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Latex Gloves (M), Composite Resins"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Units of Measure */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit of Measure *</label>
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 cursor-pointer"
                >
                  <option value="pcs">pieces (pcs)</option>
                  <option value="tubes">tubes</option>
                  <option value="bags">bags</option>
                  <option value="cartridges">cartridges</option>
                  <option value="jars">jars</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Initial Stock Level *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Current quantity in stock"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-800"
                  />
                </div>

                {/* Min Threshold */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Safety Threshold *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Alert when stock hits this"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Unit Cost */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost Per Unit (₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Cost price in Rupees"
                  value={formCostPerUnit}
                  onChange={(e) => setFormCostPerUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/10 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  {actionLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Catalog Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Tracker Modal */}
      {isRestockOpen && restockItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#059669] text-white">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-200" />
                <h2 className="text-lg font-bold">Restock supply: {restockItem.name}</h2>
              </div>
              <button 
                onClick={() => setIsRestockOpen(false)}
                className="text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitRestock} className="p-6 space-y-5">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs text-slate-500">
                <Info className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <p>Current Stock Level: <span className="font-bold text-slate-700">{restockItem.quantity} {restockItem.unit}</span></p>
                  <p>Restock operations will auto-log a corresponding <span className="font-bold text-emerald-600">&quot;material cost&quot;</span> clinical expense.</p>
                </div>
              </div>

              {/* Restock Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purchase Quantity *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={`Quantity to purchase`}
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-800"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold uppercase">{restockItem.unit}</span>
                </div>
              </div>

              {/* Total Cost auto-calculation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Purchase Outflow Cost (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="Total cost price in Rupees"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-extrabold text-slate-900 text-lg"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Calculated from standard catalog price (₹{restockItem.costPerUnit} / unit)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  disabled={actionLoading}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/10 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  {actionLoading ? 'Restocking...' : 'Confirm Restock Outflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Material Usage Modal */}
      {isUseOpen && useItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-600 text-white">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-200 rotate-180" />
                <h2 className="text-lg font-bold">Log Material Usage: {useItem.name}</h2>
              </div>
              <button 
                onClick={() => setIsUseOpen(false)}
                className="text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitUse} className="p-6 space-y-5">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/60 p-4 rounded-2xl text-xs text-amber-800">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p>Current Stock Level: <span className="font-bold">{useItem.quantity} {useItem.unit}</span></p>
                  <p>Safety Threshold: <span className="font-bold">{useItem.minThreshold} {useItem.unit}</span></p>
                </div>
              </div>

              {/* Deduction Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity Used *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max={useItem.quantity}
                    placeholder="Enter quantity consumed"
                    value={useAmount}
                    onChange={(e) => setUseAmount(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold text-slate-800"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold uppercase">{useItem.unit}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUseOpen(false)}
                  disabled={actionLoading}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-950/10 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  {actionLoading ? 'Logging...' : 'Log Usage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
