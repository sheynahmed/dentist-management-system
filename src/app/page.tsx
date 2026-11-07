import React from 'react';
import { query } from '@/lib/db';
import { CashFlowChart, ExpenseBreakdownChart } from '@/components/DashboardCharts';
import { 
  Users, 
  IndianRupee, 
  Receipt, 
  Calendar, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Disable caching so dashboard shows real-time DB data

export default function Dashboard() {
  // 1. Fetch dashboard metrics from sqlite db
  const patientsCount = query.getPatients().length;
  
  const invoices = query.getInvoices();
  const totalEarnings = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const pendingInvoicesCount = invoices.filter(inv => inv.status === 'PENDING').length;
  
  const appointments = query.getAppointments();
  const scheduledAppointmentsCount = appointments.filter(app => app.status === 'SCHEDULED').length;

  const expenses = query.getExpenses();
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalProfit = totalEarnings - totalExpenses;

  // 2. Prepare Cash Flow Data (Earnings vs Expenses for last 6 months)
  const monthlyData: Record<string, { month: string; earnings: number; expenses: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthlyData[label] = { month: label, earnings: 0, expenses: 0 };
  }
  
  invoices.forEach(inv => {
    if (inv.status === 'PAID') {
      const label = new Date(inv.issueDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (monthlyData[label]) {
        monthlyData[label].earnings += inv.paidAmount;
      }
    }
  });
  
  expenses.forEach(exp => {
    const label = new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (monthlyData[label]) {
      monthlyData[label].expenses += exp.amount;
    }
  });

  const cashFlowData = Object.values(monthlyData).sort((a, b) => {
    const parseDate = (lbl: string) => {
      const [m, y] = lbl.split(' ');
      // e.g., "Jan 26" -> Jan 1, 2026
      return new Date(Date.parse(`${m} 1, 20${y}`));
    };
    return parseDate(a.month).getTime() - parseDate(b.month).getTime();
  });

  // 3. Prepare Expense Breakdown Category Data
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(exp => {
    const category = exp.category || 'Other';
    expensesByCategory[category] = (expensesByCategory[category] || 0) + exp.amount;
  });
  
  const expenseBreakdownData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // 4. Operational Alerts & Upkeep Center
  const inventoryItems = query.getInventory();
  const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minThreshold);

  // Compute pending/due utility bills
  const currentMonthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const rentPaid = currentMonthExpenses.some(exp => exp.name.toLowerCase() === 'rent');
  const currentBillPaid = currentMonthExpenses.some(exp => exp.name.toLowerCase() === 'current bill');
  const newspaperPaid = currentMonthExpenses.some(exp => exp.name.toLowerCase() === 'newspaper');

  const pendingBills: { name: string; amount?: number; dueDateText: string; category: string }[] = [];
  if (!rentPaid) {
    pendingBills.push({ name: 'Rent Outflow', amount: 11000, dueDateText: `Due for current month`, category: 'Fixed' });
  }
  if (!currentBillPaid) {
    pendingBills.push({ name: 'Electricity/Current Bill', dueDateText: 'Current month reading pending', category: 'Utilities' });
  }
  if (!newspaperPaid) {
    pendingBills.push({ name: 'Newspaper Bill', amount: 320, dueDateText: 'Due end of month', category: 'Utilities' });
  }

  // Find any future logged expenses (which act as scheduled bills)
  const futureExpenses = expenses.filter(exp => new Date(exp.date) > new Date());
  futureExpenses.forEach(exp => {
    pendingBills.push({
      name: exp.name,
      amount: exp.amount,
      dueDateText: `Scheduled: ${new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
      category: exp.category
    });
  });

  const totalAlertsCount = lowStockItems.length + pendingBills.length;

  // 5. Get recent invoices (up to 5)
  const recentInvoices = invoices.slice(0, 5);

  // 6. Get upcoming appointments (up to 5)
  const upcomingAppointments = appointments
    .filter(app => app.status === 'SCHEDULED')
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clinic Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here is the operational summary of DentoCare.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl px-4 py-2 font-medium">
          <Clock className="h-4 w-4" />
          <span>Live Operations Console</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Card 1: Total Earnings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Earnings</p>
            <h3 className="text-2xl font-extrabold text-slate-800">₹{totalEarnings.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-600 font-medium">From settled invoices</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Total Profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</p>
            <h3 className={`text-2xl font-extrabold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{totalProfit.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-400 truncate">Expenses: ₹{totalExpenses.toLocaleString('en-IN')}</p>
          </div>
          <div className={`p-3 rounded-2xl shrink-0 ${totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Patients */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{patientsCount}</h3>
            <p className="text-xs text-slate-500">Registered in clinic</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Pending Invoices */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Invoices</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{pendingInvoicesCount}</h3>
            <p className="text-xs text-amber-600 font-medium">Awaiting payment</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        {/* Card 5: Appointments */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Appts</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{scheduledAppointmentsCount}</h3>
            <p className="text-xs text-indigo-600 font-medium">Active sessions</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Analytics Row: Dual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Net Cash Flow</h2>
              <p className="text-xs text-slate-400">Monthly comparison of clinic earnings and expenses</p>
            </div>
            <Link href="/billing" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1">
              Manage Billing
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <CashFlowChart data={cashFlowData} />
        </div>

        {/* Expense Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Expense Share</h2>
            <p className="text-xs text-slate-400">Expenditure breakdown by category type</p>
          </div>
          <ExpenseBreakdownChart data={expenseBreakdownData} />
        </div>
      </div>

      {/* Alert Center Panel & Appointments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operations & Alert Center Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Operations & Alert Center
                {totalAlertsCount > 0 && (
                  <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-100 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {totalAlertsCount} Alerts
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Material stocks and due utility accounts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Low Stock Alerts */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-500" />
                  Inventory Stock Upkeep
                </h3>
                
                <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {lowStockItems.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <CheckCircle className="h-4 w-4" />
                      All essential materials are fully stocked.
                    </div>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-white border border-slate-200/60 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-700">{item.name}</p>
                          <p className="text-[10px] text-slate-400">Threshold: {item.minThreshold} {item.unit}</p>
                        </div>
                        <span className="bg-rose-50 text-rose-700 font-extrabold px-2 py-1 rounded-lg border border-rose-100 text-[10px]">
                          {item.quantity} {item.unit} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200/50">
                <Link 
                  href="/inventory"
                  className="w-full flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 group"
                >
                  Go to Inventory Controller
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Upcoming Bills & Utilities */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  Upcoming Utilities & Bills
                </h3>

                <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {pendingBills.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <CheckCircle className="h-4 w-4" />
                      All standard utility bills are logged and settled.
                    </div>
                  ) : (
                    pendingBills.map((bill, index) => (
                      <div key={index} className="flex justify-between items-center text-xs p-2.5 bg-white border border-slate-200/60 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-700">{bill.name}</p>
                          <p className="text-[10px] text-slate-400">{bill.dueDateText}</p>
                        </div>
                        <span className="bg-amber-50 text-amber-700 font-extrabold px-2 py-1 rounded-lg border border-amber-100 text-[10px]">
                          {bill.amount ? `₹${bill.amount.toLocaleString('en-IN')}` : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200/50">
                <Link 
                  href="/expenses"
                  className="w-full flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 group"
                >
                  Go to Expense Ledger
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Appointments</h2>
              <p className="text-xs text-slate-400">Next scheduled sessions</p>
            </div>
            <Link href="/appointments" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1">
              Calendar
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-8 space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-300" />
                <span>No upcoming appointments</span>
              </div>
            ) : (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-slate-700">{app.patientName}</p>
                    <p className="text-xs text-slate-400">Dr. {app.dentistName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600">
                      {new Date(app.dateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(app.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recents section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700">{inv.patientName}</td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      ₹{inv.total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link 
                        href={`/invoice/${inv.id}`}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-500"
                      >
                        View Invoice
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
