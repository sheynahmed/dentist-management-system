'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Activity, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  Stethoscope,
  Wallet,
  Package
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>({});
  const [isMounted, setIsMounted] = useState(false);

  // Check if we should bypass the dashboard sidebar layout (for invoice view and login screen)
  const isBypassed = pathname.startsWith('/invoice/') || pathname === '/login';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Billing & Invoices', path: '/billing', icon: Receipt },
    { name: 'Treatments', path: '/treatments', icon: Stethoscope },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Expenses', path: '/expenses', icon: Wallet },
    { name: 'Inventory & Stock', path: '/inventory', icon: Package },
  ];

  const handleLogout = () => {
    // Simple mock logout: delete session marker from localStorage and redirect
    localStorage.removeItem('dentist_session');
    router.push('/login');
  };

  // Check login session (mock client-side check) and set mounted state
  React.useEffect(() => {
    setIsMounted(true);
    if (isBypassed) return;
    const session = localStorage.getItem('dentist_session');
    if (!session) {
      router.push('/login');
    } else {
      setActiveUser(JSON.parse(session));
    }
  }, [pathname, router, isBypassed]);

  if (isBypassed) {
    return <>{children}</>;
  }

  // Use a fallback user object if not mounted to prevent SSR hydration errors
  const user = isMounted ? activeUser : { name: '', role: '' };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 shadow-xl border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">DentoCare</h1>
            <p className="text-xs text-slate-400">Dental Clinic Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout at bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role ? user.role.toLowerCase() : 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-slate-800 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 shadow-md z-30">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg">DentoCare</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[60px] bg-slate-900/95 text-white z-40 flex flex-col p-6 space-y-6">
            <nav className="flex-1 space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div>
                  <p className="font-semibold">{user.name || 'User'}</p>
                  <p className="text-xs text-slate-400 capitalize">{user.role ? user.role.toLowerCase() : 'Staff'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-4 w-full px-4 py-3.5 text-base font-semibold text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
