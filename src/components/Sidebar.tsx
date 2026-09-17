import React, { useRef } from 'react';
import { TerravaLogo } from './TerravaLogo';
import { 
  LayoutDashboard, 
  CreditCard, 
  Receipt, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Database,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  FileSpreadsheet,
  Settings,
  Bell,
  Download,
  Upload,
  LogOut,
  User,
  Cloud,
  Wrench
} from 'lucide-react';
import { PaylaterItem, UserProfile } from '../types';
import { formatShortRupiah, MONTH_NAMES_ID, PROVIDER_META } from '../utils/formatters';

export type NavTab = 'dashboard' | 'settlement' | 'paylater' | 'expenses' | 'calendar' | 'maintenance' | 'strategy' | 'ai';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  paylaterItems: PaylaterItem[];
  totalIncome: number;
  totalPaylaterDueThisMonth: number;
  unpaidPaylaterCount: number;
  urgentMaintenanceCount?: number;
  onOpenAddModal: (type?: 'paylater' | 'expense' | 'income') => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isSupabaseConnected?: boolean;
  onOpenSupabaseModal?: () => void;
  // Pengaturan & Informasi Pengguna
  user: UserProfile | null;
  onOpenGoogleAuth: () => void;
  onLogoutGoogle: () => void;
  onOpenSettingsModal: (tab?: 'account' | 'database' | 'notifications' | 'backup') => void;
  onOpenReminderModal?: () => void;
  unreadRemindersCount?: number;
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
  onExportData?: () => void;
  onImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  paylaterItems,
  totalIncome,
  totalPaylaterDueThisMonth,
  unpaidPaylaterCount,
  urgentMaintenanceCount = 0,
  onOpenAddModal,
  isMobileOpen = false,
  setIsMobileOpen,
  isSupabaseConnected = false,
  onOpenSupabaseModal,
  user,
  onOpenGoogleAuth,
  onLogoutGoogle,
  onOpenSettingsModal,
  onOpenReminderModal,
  unreadRemindersCount = 0,
  currentYear,
  currentMonth,
  onMonthChange,
  onExportData,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DSR calculation
  const dsr = totalIncome > 0 ? (totalPaylaterDueThisMonth / totalIncome) * 100 : 0;

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(currentYear - 1, 11);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(currentYear + 1, 0);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'settlement' as const,
      label: 'Settlement Bank',
      icon: Building2,
      badge: null,
    },
    {
      id: 'paylater' as const,
      label: 'Kelola Paylater',
      icon: CreditCard,
      badge: unpaidPaylaterCount > 0 ? `${unpaidPaylaterCount} Tagihan` : null,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'expenses' as const,
      label: 'Pengeluaran & Budget',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'calendar' as const,
      label: 'Kalender Tagihan',
      icon: CalendarIcon,
      badge: null,
    },
    {
      id: 'maintenance' as const,
      label: 'Jadwal & Perawatan',
      icon: Wrench,
      badge: urgentMaintenanceCount > 0 ? `${urgentMaintenanceCount} Perlu Cek` : null,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  ];

  const toolItems = [
    {
      id: 'strategy' as const,
      label: 'Strategi Bebas Hutang',
      icon: ShieldCheck,
      desc: 'Snowball & Avalanche',
    },
    {
      id: 'ai' as const,
      label: 'Terrava AI Advisor',
      icon: Sparkles,
      desc: 'Audit Finansial Pintar',
      isSpecial: true,
    },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 lg:w-72 bg-white text-slate-700 flex flex-col border-r border-slate-200 shrink-0 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header with Official TERRAVA Logo */}
      <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex flex-col items-start focus:outline-none group cursor-pointer"
          title="Terrava Dashboard"
        >
          <div className="py-1 px-1 -ml-1 rounded-lg transition-transform group-hover:scale-[1.02]">
            <TerravaLogo
              size="md"
              inverted={false}
              width={165}
              height={32}
            />
          </div>
        </button>

        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Tutup Menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Periode Kalender Switcher */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>{MONTH_NAMES_ID[currentMonth]} {currentYear}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Nav Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4.5 no-scrollbar">
        
        {/* Section 1: Main Menu */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
            Menu Utama
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: AI & Tools */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
            Alat & Strategi
          </div>
          <nav className="space-y-1">
            {toolItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.isSpecial && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 3: Pengaturan & Sistem */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
            Pengaturan & Sistem
          </div>
          <nav className="space-y-1 text-xs font-semibold">
            {/* Tombol Tunggal Pengaturan & Sistem */}
            <button
              onClick={() => {
                onOpenSettingsModal('account');
                if (setIsMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate font-semibold">Pengaturan</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                isSupabaseConnected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isSupabaseConnected ? 'Supabase Terhubung' : 'Lokal'}
              </span>
            </button>
          </nav>
        </div>

        {/* Section 4: Live Connected Paylater List */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Paylater Aktif ({paylaterItems.length})
            </span>
            <button
              onClick={() => handleNavClick('paylater')}
              className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          {paylaterItems.length === 0 ? (
            <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <p className="text-[11px] text-slate-500">Belum ada tagihan paylater.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {paylaterItems.slice(0, 3).map((item) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavClick('paylater')}
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.isPaidThisMonth ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-semibold text-slate-800 truncate text-[11px]">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 pl-3">
                        Tgl {item.dueDay} • {item.currentTenor}/{item.totalTenor} bln
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-800 text-[11px]">
                        {formatShortRupiah(item.monthlyInstallment)}
                      </div>
                      <span className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                        item.isPaidThisMonth ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.isPaidThisMonth ? 'Lunas' : 'Belum'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Health & User Profile Section */}
      <div className="p-3 border-t border-slate-100 bg-white space-y-2.5 shrink-0">
        
        {/* DSR Health Bar */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rasio Beban (DSR)</span>
            <span className={`text-[11px] font-extrabold ${dsr > 40 ? 'text-rose-600' : dsr > 30 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {totalIncome > 0 ? `${dsr.toFixed(1)}%` : '0%'}
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                dsr > 40 ? 'bg-rose-500' : dsr > 30 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (dsr / 50) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Beban: {formatShortRupiah(totalPaylaterDueThisMonth)}</span>
            <span className="text-slate-700 font-semibold">{dsr <= 30 ? 'Zona Aman' : 'Waspada'}</span>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => onOpenAddModal('paylater')}
          className="w-full flex items-center justify-center gap-1.5 bg-[#007a52] hover:bg-[#006644] text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Data</span>
        </button>

        {/* User Profile & Account Information Card */}
        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
          {user?.isLoggedIn ? (
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={() => onOpenSettingsModal('account')}
                className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                title="Kelola Akun"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onOpenSettingsModal('account')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Pengaturan Akun"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onLogoutGoogle}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Keluar dari Akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenGoogleAuth}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          )}
        </div>

      </div>

    </aside>
  );
};
