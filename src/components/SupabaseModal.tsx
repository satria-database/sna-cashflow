import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Key, 
  Link as LinkIcon, 
  ShieldAlert,
  Sparkles,
  Layers,
  Save,
  Trash2
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA,
  SupabaseConfig 
} from '../lib/supabase';
import { ConfirmModal } from './ConfirmModal';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  isConnected: boolean;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  isConnected,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>({ url: '', anonKey: '', source: 'none' });
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'schema' | 'tables'>('config');

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getSupabaseConfig();
      setConfig(currentConfig);
      setInputUrl(currentConfig.url);
      setInputKey(currentConfig.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection(inputUrl.trim(), inputKey.trim());
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Gagal mengetes koneksi.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setValidationError(null);
    if (!inputUrl.trim() || !inputKey.trim()) {
      setValidationError('Mohon lengkapi Supabase Project URL dan Anon Key terlebih dahulu.');
      return;
    }
    saveCustomSupabaseConfig(inputUrl.trim(), inputKey.trim());
    setConfig(getSupabaseConfig());
    setIsSyncing(true);
    await onRefreshData();
    setIsSyncing(false);
    handleTestConnection();
  };

  const handleClearConfig = () => {
    setIsConfirmClearOpen(true);
  };

  const confirmClearConfig = async () => {
    clearCustomSupabaseConfig();
    setConfig(getSupabaseConfig());
    setInputUrl('');
    setInputKey('');
    setTestResult(null);
    setValidationError(null);
    await onRefreshData();
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onRefreshData();
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-600 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">Koneksi Database Supabase</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isConnected 
                    ? 'bg-emerald-600 text-white border border-emerald-500' 
                    : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
                  {isConnected ? 'Terhubung (Cloud)' : 'Belum Terhubung'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">Sinkronisasi data real-time, persistent storage, dan skema tabel PostgreSQL</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'config' 
                ? 'border-emerald-600 text-emerald-700 bg-white -mb-px rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Kredensial & Pengaturan</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'schema' 
                ? 'border-emerald-600 text-emerald-700 bg-white -mb-px rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Skema SQL Database</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'tables' 
                ? 'border-emerald-600 text-emerald-700 bg-white -mb-px rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tabel & Struktur Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* TAB 1: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Koneksi Supabase Siap Digunakan</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed pl-6">
                  Masukkan Project URL dan Anon Key dari Dashboard Supabase Anda (bisa didapatkan di <strong>Project Settings → API</strong>).
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://xyzproject.supabase.co"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Supabase Public Anon Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {config.source === 'env' && (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Terdeteksi dari variabel lingkungan (.env)</span>
                  </div>
                )}

                {testResult && (
                  <div className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                    testResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{testResult.success ? 'Koneksi Sukses' : 'Koneksi Gagal'}</div>
                      <div className="text-[11px] mt-0.5">{testResult.message}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting || !inputUrl || !inputKey}
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Tes Koneksi</span>
                    </button>

                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing || !isConnected}
                      className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sinkronisasi...' : 'Tarik Data Cloud'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {config.source === 'custom' && (
                      <button
                        onClick={handleClearConfig}
                        className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}

                    <button
                      onClick={handleSaveConfig}
                      disabled={!inputUrl || !inputKey}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan & Hubungkan</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SQL SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Skema SQL Pembuatan Tabel</h4>
                  <p className="text-[11px] text-slate-500">Salin dan jalankan di Supabase <strong>SQL Editor</strong> untuk membuat seluruh tabel yang dibutuhkan.</p>
                </div>
                <button
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Tersalin!' : 'Salin SQL (1-Click)'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[10.5px] rounded-xl overflow-x-auto max-h-72 leading-relaxed border border-slate-800 selection:bg-emerald-600 selection:text-white">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Langkah Cepat di Supabase:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                  <li>Buka project Anda di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3 inline" /></a></li>
                  <li>Pilih menu <strong>SQL Editor</strong> di bilah navigasi kiri.</li>
                  <li>Klik <strong>New Query</strong>, tempel (paste) script SQL di atas, lalu klik <strong>Run</strong>.</li>
                  <li>Selesai! Tabel `paylater_items`, `expenses`, `incomes`, `budgets`, dan `reminder_settings` langsung aktif.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: TABLES OVERVIEW */}
          {activeTab === 'tables' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-600">
                Berikut adalah 5 tabel yang dikelola secara otomatis oleh sistem Terrava:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="font-mono font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>paylater_items</span>
                    <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Utama</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Menyimpan daftar fasilitas cicilan, tenor (misal 6 bln), nominal per bulan, tanggal jatuh tempo, bunga, dan riwayat pembayaran.</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="font-mono font-bold text-slate-900 text-xs">expenses</div>
                  <p className="text-[11px] text-slate-500 mt-1">Mencatat pengeluaran harian, kategori (makanan, transportasi, belanja, dll), tanggal transaksi, dan status recurring.</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="font-mono font-bold text-slate-900 text-xs">incomes</div>
                  <p className="text-[11px] text-slate-500 mt-1">Mencatat arus kas masuk, sumber penghasilan (gaji, freelance, bisnis), tanggal terima, dan catatan.</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="font-mono font-bold text-slate-900 text-xs">budgets</div>
                  <p className="text-[11px] text-slate-500 mt-1">Batas maksimal pengeluaran bulanan per kategori untuk mengontrol gaya hidup & cash flow.</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 md:col-span-2">
                  <div className="font-mono font-bold text-slate-900 text-xs">reminder_settings</div>
                  <p className="text-[11px] text-slate-500 mt-1">Preferensi pengingat jatuh tempo otomatis (H-7, H-3, H-1, H-0), waktu notifikasi, dan audio alert.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        {validationError && (
          <div className="mx-6 mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{validationError}</span>
          </div>
        )}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terrava Multi-Storage Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#007a52] hover:bg-[#006644] text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Confirm Clear Supabase Modal */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Hapus Kredensial Supabase Kustom"
        message="Apakah Anda yakin ingin menghapus konfigurasi database Supabase kustom ini? Aplikasi akan beralih ke penyimpanan lokal browser."
        confirmText="Ya, Hapus Konfigurasi"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmClearConfig}
        onCancel={() => setIsConfirmClearOpen(false)}
      />

    </div>
  );
};
