import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Calendar as CalendarIcon, 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Menu, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  LogOut,
  User,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { MONTH_NAMES_ID, formatShortRupiah } from '../utils/formatters';
import { UserProfile } from '../types';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentYear: number;
  currentMonth: number; // 0-11
  onMonthChange: (year: number, month: number) => void;
  unreadRemindersCount: number;
  onOpenReminderModal: () => void;
  onOpenAddModal: (type?: 'paylater' | 'expense' | 'income') => void;
  onOpenSettingsModal: (tab?: 'account' | 'database' | 'notifications' | 'backup') => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onToggleMobileSidebar: () => void;
  totalIncome: number;
  totalExpense: number;
  totalPaylaterDueThisMonth: number;
  user: UserProfile | null;
  onOpenGoogleAuth: () => void;
  onLogoutGoogle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentYear,
  currentMonth,
  onMonthChange,
  unreadRemindersCount,
  onOpenReminderModal,
  onOpenAddModal,
  onOpenSettingsModal,
  onExportData,
  onImportData,
  onResetData,
  activeTab,
  setActiveTab,
  onToggleMobileSidebar,
  totalIncome,
  totalExpense,
  totalPaylaterDueThisMonth,
  user,
  onOpenGoogleAuth,
  onLogoutGoogle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Keuangan', subtitle: 'Ringkasan Eksekutif & Arus Kas' },
    paylater: { title: 'Kelola Paylater & Cicilan', subtitle: 'Monitoring Tagihan & Tenor' },
    expenses: { title: 'Pengeluaran & Anggaran', subtitle: 'Catatan Belanja & Budget Planner' },
    calendar: { title: 'Kalender Finansial', subtitle: 'Jadwal Jatuh Tempo & Pengeluaran' },
    strategy: { title: 'Strategi Bebas Hutang', subtitle: 'Simulasi Debt Snowball & Avalanche' },
    ai: { title: 'Terramora AI Smart Advisor', subtitle: 'Konsultan & Audit Kesehatan Finansial' },
  };

  const currentMeta = pageTitles[activeTab] || pageTitles.dashboard;
  const netBalance = totalIncome - (totalExpense + totalPaylaterDueThisMonth);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 shrink-0 shadow-2xs">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Toggle + Page Title + Month Switcher */}
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Dynamic Page Title */}
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">
              {currentMeta.title}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {currentMeta.subtitle}
            </p>
          </div>

          {/* Month & Year Precision Switcher */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors font-bold text-xs cursor-pointer"
              title="Bulan Sebelumnya"
            >
              ◀
            </button>
            <div className="px-2 sm:px-3 text-xs font-extrabold text-slate-800 flex items-center gap-1.5 min-w-[110px] sm:min-w-[130px] justify-center">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>{MONTH_NAMES_ID[currentMonth]} {currentYear}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors font-bold text-xs cursor-pointer"
              title="Bulan Berikutnya"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Center: High-Density Live Metric Ticker Pills (Hidden on Mobile) */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Masuk: <strong>{formatShortRupiah(totalIncome)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-900">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Paylater: <strong>{formatShortRupiah(totalPaylaterDueThisMonth)}</strong></span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            netBalance >= 0 ? 'bg-slate-100/80 text-slate-800 border-slate-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            <span>Sisa: <strong>{formatShortRupiah(netBalance)}</strong></span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Automated Notification Bell */}
          <button
            onClick={onOpenReminderModal}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            title="Pengingat Tagihan & Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-4.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {unreadRemindersCount}
              </span>
            )}
          </button>

          {/* Quick Add Button */}
          <button
            onClick={() => onOpenAddModal('paylater')}
            className="flex items-center gap-1.5 bg-[#007a52] hover:bg-[#006644] text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Data</span>
          </button>

          {/* Backup / Export / Settings icons */}
          <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
            <button
              onClick={onExportData}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Ekspor Backup (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportData}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Impor Backup"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenSettingsModal('account')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Google Login / User Profile Component */}
          <div className="relative pl-1.5 sm:border-l sm:border-slate-200" ref={dropdownRef}>
            {user?.isLoggedIn ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer shadow-2xs"
                  title={`Akun: ${user.name} (${user.email})`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="hidden md:block text-xs font-bold text-slate-800 max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 space-y-2 z-50 animate-in fade-in">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-xs text-slate-900">{user.name}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                          Google
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettingsModal('account');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-left font-medium cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Kelola Akun & Pengaturan</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettingsModal('database');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-left font-medium cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Koneksi Database Cloud</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogoutGoogle();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-bold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar dari Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenGoogleAuth}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
                title="Masuk dengan Google"
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
                <span className="hidden sm:inline">Masuk Google</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
