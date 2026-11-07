'use client';

import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

interface CashFlowItem {
  month: string;
  earnings: number;
  expenses: number;
}

interface ExpenseBreakdownItem {
  name: string;
  value: number;
}

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
];

// Helper to format currency
const formatRupee = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export function CashFlowChart({ data }: { data: CashFlowItem[] }) {
  const [activeSeries, setActiveSeries] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-slate-100">
        No financial data available to display cash flow chart.
      </div>
    );
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
          />
          <Tooltip 
            formatter={(value: any, name: string) => {
              const formattedName = name === 'earnings' ? 'Earnings' : 'Expenses';
              return [formatRupee(Number(value)), formattedName];
            }}
            contentStyle={{ 
              background: 'rgba(15, 23, 42, 0.9)', 
              borderRadius: '16px', 
              color: '#fff', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="earnings" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEarnings)" 
            name="earnings"
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpenses)" 
            name="expenses"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseBreakdownChart({ data }: { data: ExpenseBreakdownItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-slate-100">
        No expense category data available.
      </div>
    );
  }

  // Calculate total expenses for percentage display
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-72 w-full mt-4 flex flex-col md:flex-row items-center justify-around">
      <div className="h-56 w-56 shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [formatRupee(Number(value)), 'Total Spent']}
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.9)', 
                borderRadius: '16px', 
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total Expenses</span>
          <span className="text-lg font-bold text-slate-800">₹{total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto px-4 w-full md:w-auto">
        {data.map((item, idx) => {
          const percent = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={item.name} className="flex items-center gap-3 text-xs">
              <div 
                className="h-3 w-3 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
              />
              <span className="font-semibold text-slate-600 capitalize w-24 truncate">{item.name}</span>
              <span className="font-extrabold text-slate-800">{percent}%</span>
              <span className="text-slate-400 font-medium">({formatRupee(item.value)})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
