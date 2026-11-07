'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface EarningsChartProps {
  data: { name: string; amount: number }[];
}

export default function EarningsChart({ data }: EarningsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No billing data available to display chart.
      </div>
    );
  }

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="name" 
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
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip 
            formatter={(value) => [`₹${value}`, 'Earnings']}
            contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
          />
          <Bar 
            dataKey="amount" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
