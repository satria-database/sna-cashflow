import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Bell, 
  BellRing, 
  Clock, 
  Check, 
  Volume2, 
  VolumeX, 
  Send, 
  User, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  Upload, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  Copy
} from 'lucide-react';
import { ReminderSetting, UserProfile } from '../types';
import { 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA
} from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'account' | 'database' | 'notifications' | 'backup';
  user: UserProfile | null;
  onOpenGoogleAuth: () => void;
  onLogoutGoogle: () => void;
  isSupabaseConnected: boolean;
  onRefreshSupabaseData: () => Promise<void>;
  reminderSettings: ReminderSetting;
  onUpdateReminderSettings: (settings: ReminderSetting) => void;
  onRequestBrowserPermission: () => Promise<boolean>;
  onTestNotification: () => void;
  permissionStatus: NotificationPermission | 'default';
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'account',
  user,
  onOpenGoogleAuth,
  onLogoutGoogle,
  isSupabaseConnected,
  onRefreshSupabaseData,
  reminderSettings,
  onUpdateReminderSettings,
  onRequestBrowserPermission,
  onTestNotification,
  permissionStatus,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'database' | 'notifications' | 'backup'>(initialTab);
  
  // Notification states
  const [localReminders, setLocalReminders] = useState<ReminderSetting>(reminderSettings);
  const [testNotifSent, setTestNotifSent] = useState(false);

  // Supabase states
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbTesting, setSbTesting] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSqlCopied, setIsSqlCopied] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setLocalReminders(reminderSettings);
      const config = getSupabaseConfig();
      setSbUrl(config.url || '');
      setSbKey(config.anonKey || '');
      setSbTestResult(null);
    }
  }, [isOpen, initialTab, reminderSettings]);

  if (!isOpen) return null;

  // Reminder Handlers
  const toggleDay = (day: number) => {
    const exists = localReminders.remindDaysBefore.includes(day);
    let updated: number[];
    if (exists) {
      updated = localReminders.remindDaysBefore.filter((d) => d !== day);
    } else {
      updated = [...localReminders.remindDaysBefore, day].sort((a, b) => b - a);
    }
    const newConfig = { ...localReminders, remindDaysBefore: updated };
    setLocalReminders(newConfig);
    onUpdateReminderSettings(newConfig);
  };

  const handleToggleBrowserNotif = async () => {
    if (!localReminders.enableBrowserNotification) {
      const granted = await onRequestBrowserPermission();
      if (granted) {
        const newConfig = { ...localReminders, enableBrowserNotification: true };
        setLocalReminders(newConfig);
        onUpdateReminderSettings(newConfig);
      }
    } else {
      const newConfig = { ...localReminders, enableBrowserNotification: false };
      setLocalReminders(newConfig);
      onUpdateReminderSettings(newConfig);
    }
  };

  const handleSendTestNotif = () => {
    onTestNotification();
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  // Supabase Handlers
  const handleTestSupabase = async () => {
    setSbTesting(true);
    setSbTestResult(null);
    try {
      const res = await testSupabaseConnection(sbUrl.trim(), sbKey.trim());
      setSbTestResult(res);
      if (res.success) {
        saveCustomSupabaseConfig(sbUrl.trim(), sbKey.trim());
        await onRefreshSupabaseData();
      }
    } catch (e: any) {
      setSbTestResult({ success: false, message: e?.message || 'Koneksi gagal.' });
    } finally {
      setSbTesting(false);
    }
  };

  const handleSaveSupabase = async () => {
    saveCustomSupabaseConfig(sbUrl.trim(), sbKey.trim());
    await handleTestSupabase();
  };

  const handleClearSupabase = () => {
    clearCustomSupabaseConfig();
    setSbUrl('');
    setSbKey('');
    setSbTestResult(null);
    onRefreshSupabaseData();
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await onRefreshSupabaseData();
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <Settings className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Pusat Pengaturan</h3>
              <p className="text-xs text-slate-500">Konfigurasi akun Google, database Supabase, dan notifikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'account' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span>Akun & Google</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'database' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-700" />
            <span>Database Cloud</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-emerald-700" />
            <span>Notifikasi Tagihan</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'backup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Data & Backup</span>
          </button>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
          
          {/* ============================================================ */}
          {/* TAB 1: GOOGLE ACCOUNT & PROFILE */}
          {/* ============================================================ */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Status Akun Pengguna
                </span>

                {user?.isLoggedIn ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border border-emerald-300 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold text-base flex items-center justify-center shadow-2xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{user.name}</h4>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Google Connected
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={onOpenGoogleAuth}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Ganti Akun
                      </button>
                      <button
                        onClick={onLogoutGoogle}
                        className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Belum Masuk dengan Google</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hubungkan akun Google Anda untuk mengamankan data dan sinkronisasi otomatis antar perangkat.
                      </p>
                    </div>
                    <button
                      onClick={onOpenGoogleAuth}
                      className="flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  </div>
                )}
              </div>

              {/* Security & Sync Details */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Keamanan Data & Privasi Terrava</span>
                </div>
                <p>
                  Sesi login Anda disimpan secara aman. Semua data pencatatan cicilan dan anggaran tetap terenkripsi dan dapat dihubungkan ke database pribadi Supabase Anda.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SUPABASE CLOUD DATABASE */}
          {/* ============================================================ */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              
              {/* Connection Status Card */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isSupabaseConnected 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isSupabaseConnected ? 'bg-emerald-700 text-white' : 'bg-amber-700 text-white'
                    }`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm">
                          {isSupabaseConnected ? 'Terhubung ke Supabase Cloud' : 'Mode Offline / Penyimpanan Lokal'}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      </div>
                      <p className="text-xs opacity-80 mt-0.5">
                        {isSupabaseConnected 
                          ? 'Perubahan data disinkronkan secara realtime ke database cloud Anda.' 
                          : 'Data saat ini tersimpan di browser (localStorage).'}
                      </p>
                    </div>
                  </div>

                  {isSupabaseConnected && (
                    <button
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Data'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Supabase Credentials Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Konfigurasi Kredensial Supabase
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzprojectid.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-[11px]"
                  />
                </div>

                {sbTestResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    sbTestResult.success ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'bg-rose-100 text-rose-900'
                  }`}>
                    {sbTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />}
                    <span>{sbTestResult.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveSupabase}
                      disabled={sbTesting || !sbUrl || !sbKey}
                      className="bg-[#007a52] hover:bg-[#006644] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {sbTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{sbTesting ? 'Menguji...' : 'Simpan & Hubungkan'}</span>
                    </button>

                    <button
                      onClick={handleTestSupabase}
                      disabled={sbTesting || !sbUrl || !sbKey}
                      className="bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      Tes Koneksi
                    </button>
                  </div>

                  {(sbUrl || sbKey) && (
                    <button
                      onClick={handleClearSupabase}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                    >
                      Putuskan / Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Skema SQL Supabase */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Skema SQL Supabase (Lengkap dengan Tabel Pekerjaan)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                      setIsSqlCopied(true);
                      setTimeout(() => setIsSqlCopied(false), 3000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    {isSqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isSqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Semua SQL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Jalankan seluruh skrip SQL ini pada menu <strong>SQL Editor</strong> di Supabase Dashboard untuk membuat tabel <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800">tasks</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800">paylater_items</code>, dan tabel lainnya.
                </p>
                <div className="max-h-52 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed select-all">
                  <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: NOTIFICATIONS & REMINDERS */}
          {/* ============================================================ */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              
              {/* Push Notif Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-700" />
                    Notifikasi Browser & Web Push
                  </span>
                  <p className="text-xs text-slate-500">
                    Kirim pop-up banner otomatis saat mendekati jadwal jatuh tempo tagihan.
                  </p>
                  <div className="pt-1 text-[11px]">
                    Status izin browser:{' '}
                    <strong className={permissionStatus === 'granted' ? 'text-emerald-700' : 'text-amber-700'}>
                      {permissionStatus === 'granted' ? 'Diizinkan (Aktif)' : 'Belum Diizinkan'}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={handleToggleBrowserNotif}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    localReminders.enableBrowserNotification && permissionStatus === 'granted'
                      ? 'bg-[#007a52] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {localReminders.enableBrowserNotification && permissionStatus === 'granted' ? 'Aktif' : 'Aktifkan'}
                </button>
              </div>

              {/* Days Before Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Jadwal Pengiriman Pengingat:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                  {[
                    { days: 7, label: 'H-7 (1 Minggu)' },
                    { days: 3, label: 'H-3 (3 Hari)' },
                    { days: 1, label: 'H-1 (Besok)' },
                    { days: 0, label: 'Hari-H (Hari Ini)' },
                  ].map(({ days, label }) => {
                    const isChecked = localReminders.remindDaysBefore.includes(days);
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => toggleDay(days)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Time & Sound */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Waktu Pengingat Harian
                  </label>
                  <input
                    type="time"
                    value={localReminders.notificationTime}
                    onChange={(e) => {
                      const updated = { ...localReminders, notificationTime: e.target.value };
                      setLocalReminders(updated);
                      onUpdateReminderSettings(updated);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white font-bold rounded-lg border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {localReminders.autoSound ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    Suara Pengingat
                  </span>
                  <button
                    onClick={() => {
                      const updated = { ...localReminders, autoSound: !localReminders.autoSound };
                      setLocalReminders(updated);
                      onUpdateReminderSettings(updated);
                    }}
                    className="mt-1 text-xs font-semibold text-left text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    {localReminders.autoSound ? '🔔 Bunyi diaktifkan' : '🔕 Mode hening'}
                  </button>
                </div>
              </div>

              {/* Test Notification Button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={handleSendTestNotif}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testNotifSent ? '✓ Notifikasi Terkirim!' : 'Kirim Tes Notifikasi'}</span>
                </button>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: BACKUP & DATA MANAGEMENT */}
          {/* ============================================================ */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cadangan & Pemulihan (JSON)
                </span>
                <p className="text-xs text-slate-600">
                  Unduh seluruh catatan tagihan paylater, pengeluaran, dan pemasukan Anda ke dalam format file JSON offline.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={onExportData}
                    className="flex items-center gap-1.5 bg-[#007a52] hover:bg-[#006644] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Cadangan (JSON)</span>
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
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pulihkan dari File JSON</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                  Zona Bahaya
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-rose-950 text-xs">Kosongkan Data (Mulai Dari 0)</h4>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Hapus seluruh data cicilan paylater, riwayat pengeluaran, dan pemasukan untuk memulai pencatatan dari nol.
                    </p>
                  </div>
                  <button
                    onClick={onResetData}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Data</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">Terrava OS • Versi 2.0</span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#007a52] hover:bg-[#006644] rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
