'use client';

import React, { useState, useEffect } from 'react';
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
  Package,
  Pill,
  FileText,
  Search,
  Download,
  MessageCircle,
  Command
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import ExportDataModal from './ExportDataModal';
import WhatsAppPostOpModal from './WhatsAppPostOpModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>({});
  const [isMounted, setIsMounted] = useState(false);

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPostOpModalOpen, setIsPostOpModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState<any[]>([]);

  // Check if we should bypass the dashboard sidebar layout (for invoice view, prescription slip, and login screen)
  const isBypassed = pathname.startsWith('/invoice/') || pathname.startsWith('/prescription/') || pathname === '/login';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Prescriptions (Rx)', path: '/prescriptions', icon: Pill },
    { name: 'Clinical Notes', path: '/clinical-notes', icon: FileText },
    { name: 'Billing & Invoices', path: '/billing', icon: Receipt },
    { name: 'Treatments', path: '/treatments', icon: Stethoscope },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Expenses', path: '/expenses', icon: Wallet },
    { name: 'Inventory & Stock', path: '/inventory', icon: Package },
  ];

  const handleLogout = () => {
    localStorage.removeItem('dentist_session');
    router.push('/login');
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsExportModalOpen(false);
        setIsPostOpModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch patients for modals
  useEffect(() => {
    if (!isBypassed) {
      fetch('/api/patients')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.patients) {
            setPatientsList(data.patients);
          }
        })
        .catch(console.error);
    }
  }, [isBypassed]);

  // Check login session (mock client-side check) and set mounted state
  useEffect(() => {
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

          {/* Quick Action Tools in Sidebar */}
          <div className="pt-4 mt-2 border-t border-slate-800/80 space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Clinical Tools
            </p>
            <button
              onClick={() => setIsPostOpModalOpen(true)}
              className="flex items-center gap-3 w-full px-3.5 py-2 rounded-lg text-xs font-semibold text-green-400 hover:bg-slate-800 hover:text-green-300 transition-colors cursor-pointer text-left"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>Post-Op WhatsApp</span>
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-3 w-full px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors cursor-pointer text-left"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Export Reports (CSV)</span>
            </button>
          </div>
        </nav>

        {/* User profile / Logout at bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role ? user.role.toLowerCase() : 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-rose-400 hover:bg-slate-800 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header - Desktop & Mobile */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3 flex items-center justify-between shadow-xs">
          
          {/* Mobile brand & toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-base text-slate-900">DentoCare</span>
            </div>
          </div>

          {/* Quick Command Bar Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2.5 w-full max-w-md bg-slate-100 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border border-slate-200/60 cursor-pointer"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="flex-1 text-left truncate">Search patients, commands, or records...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
              Ctrl+K
            </kbd>
          </button>

          {/* Header Action Shortcuts */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPostOpModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Post-Op Care</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[57px] bg-slate-900/95 text-white z-40 flex flex-col p-6 space-y-6">
            <nav className="flex-1 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setIsPostOpModalOpen(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-green-400 hover:bg-slate-800 rounded-lg text-left"
                >
                  <MessageCircle className="h-4 w-4" />
                  Post-Op Care (WhatsApp)
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setIsExportModalOpen(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-slate-800 rounded-lg text-left"
                >
                  <Download className="h-4 w-4" />
                  Export Reports (CSV)
                </button>
              </div>
            </nav>

            <div className="border-t border-slate-800 pt-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-slate-800 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenPostOp={() => setIsPostOpModalOpen(true)}
      />

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <WhatsAppPostOpModal
        isOpen={isPostOpModalOpen}
        onClose={() => setIsPostOpModalOpen(false)}
        patients={patientsList}
      />
    </div>
  );
}
