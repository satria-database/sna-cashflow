import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Calendar, 
  Trash2, 
  Edit3, 
  Send, 
  Download, 
  ExternalLink,
  TrendingDown,
  Sparkles,
  Check
} from 'lucide-react';
import { PaylaterItem, PaylaterProvider } from '../types';
import { 
  formatRupiah, 
  PROVIDER_META, 
  createWhatsAppReminderUrl, 
  createGoogleCalendarUrl, 
  downloadIcsCalendar,
  formatFullDateID 
} from '../utils/formatters';
import confetti from 'canvas-confetti';
import { ConfirmModal } from './ConfirmModal';

interface PaylaterManagerProps {
  items: PaylaterItem[];
  currentYear: number;
  currentMonth: number;
  onAddItem: (item: Omit<PaylaterItem, 'id' | 'createdAt' | 'paidHistory'>) => void;
  onUpdateItem: (item: PaylaterItem) => void;
  onDeleteItem: (id: string) => void;
  onTogglePayMonth: (id: string) => void;
  onPayOffEntirely: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const PaylaterManager: React.FC<PaylaterManagerProps> = ({
  items,
  currentYear,
  currentMonth,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onTogglePayMonth,
  onPayOffEntirely,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [editingItem, setEditingItem] = useState<PaylaterItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [payoffTarget, setPayoffTarget] = useState<{ id: string; title: string } | null>(null);
  // Form states for Add/Edit Modal
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState<PaylaterProvider>('spaylater');
  const [customProviderName, setCustomProviderName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [totalTenor, setTotalTenor] = useState('6');
  const [currentTenor, setCurrentTenor] = useState('1');
  const [dueDay, setDueDay] = useState('5');
  const [startMonth, setStartMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [interestRate, setInterestRate] = useState('0');
  const [adminFee, setAdminFee] = useState('0');
  const [notes, setNotes] = useState('');
  const [autoCalculateMonthly, setAutoCalculateMonthly] = useState(true);

  // Auto-calculate monthly installment when total amount or tenor changes
  const handleAmountChange = (val: string) => {
    setTotalAmount(val);
    if (autoCalculateMonthly && val && totalTenor) {
      const principal = parseFloat(val) || 0;
      const tenor = parseInt(totalTenor, 10) || 1;
      const interest = parseFloat(interestRate) || 0;
      const fee = parseFloat(adminFee) || 0;
      const calculated = Math.round((principal / tenor) + (principal * (interest / 100)) + fee);
      setMonthlyInstallment(calculated.toString());
    }
  };

  const handleTenorChange = (val: string) => {
    setTotalTenor(val);
    if (autoCalculateMonthly && totalAmount && val) {
      const principal = parseFloat(totalAmount) || 0;
      const tenor = parseInt(val, 10) || 1;
      const interest = parseFloat(interestRate) || 0;
      const fee = parseFloat(adminFee) || 0;
      const calculated = Math.round((principal / tenor) + (principal * (interest / 100)) + fee);
      setMonthlyInstallment(calculated.toString());
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setProvider('spaylater');
    setCustomProviderName('');
    setTotalAmount('');
    setMonthlyInstallment('');
    setTotalTenor('6');
    setCurrentTenor('1');
    setDueDay('5');
    setStartMonth(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    setInterestRate('0');
    setAdminFee('0');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: PaylaterItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setProvider(item.provider);
    setCustomProviderName(item.customProviderName || '');
    setTotalAmount(item.totalAmount.toString());
    setMonthlyInstallment(item.monthlyInstallment.toString());
    setTotalTenor(item.totalTenor.toString());
    setCurrentTenor(item.currentTenor.toString());
    setDueDay(item.dueDay.toString());
    setStartMonth(item.startDate || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    setInterestRate((item.interestRate || 0).toString());
    setAdminFee((item.adminFee || 0).toString());
    setNotes(item.notes || '');
    setAutoCalculateMonthly(false);
    setIsEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !totalAmount || !monthlyInstallment) return;

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        title: title.trim(),
        provider,
        customProviderName: provider === 'lainnya' ? customProviderName.trim() : undefined,
        totalAmount: parseFloat(totalAmount) || 0,
        monthlyInstallment: parseFloat(monthlyInstallment) || 0,
        totalTenor: parseInt(totalTenor, 10) || 1,
        currentTenor: parseInt(currentTenor, 10) || 1,
        dueDay: parseInt(dueDay, 10) || 1,
        startDate: startMonth || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        interestRate: parseFloat(interestRate) || 0,
        adminFee: parseFloat(adminFee) || 0,
        notes: notes.trim(),
      });
    } else {
      onAddItem({
        title: title.trim(),
        provider,
        customProviderName: provider === 'lainnya' ? customProviderName.trim() : undefined,
        totalAmount: parseFloat(totalAmount) || 0,
        monthlyInstallment: parseFloat(monthlyInstallment) || 0,
        totalTenor: parseInt(totalTenor, 10) || 1,
        currentTenor: parseInt(currentTenor, 10) || 1,
        dueDay: parseInt(dueDay, 10) || 1,
        startDate: startMonth || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        interestRate: parseFloat(interestRate) || 0,
        adminFee: parseFloat(adminFee) || 0,
        notes: notes.trim(),
        isPaidThisMonth: false,
      });
    }

    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesProvider = selectedProviderFilter === 'all' || item.provider === selectedProviderFilter;
    
    let matchesStatus = true;
    if (selectedStatusFilter === 'unpaid') matchesStatus = !item.isPaidThisMonth;
    if (selectedStatusFilter === 'paid') matchesStatus = item.isPaidThisMonth;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const totalMonthlyCommitment = items.reduce((sum, item) => sum + item.monthlyInstallment, 0);
  const totalPaidThisMonth = items.filter(i => i.isPaidThisMonth).reduce((sum, item) => sum + item.monthlyInstallment, 0);
  const totalRemainingDebt = items.reduce((sum, item) => {
    const remainingTenors = Math.max(0, item.totalTenor - item.currentTenor + (item.isPaidThisMonth ? 0 : 1));
    return sum + (remainingTenors * item.monthlyInstallment);
  }, 0);

  const handlePayClick = (item: PaylaterItem) => {
    if (!item.isPaidThisMonth) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00C49F', '#00BFA5', '#10B981', '#3B82F6'],
      });
    }
    onTogglePayMonth(item.id);
  };

  const handleFullPayoffClick = (id: string, title: string) => {
    setPayoffTarget({ id, title });
  };

  const confirmFullPayoff = () => {
    if (!payoffTarget) return;
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
    });
    onPayOffEntirely(payoffTarget.id);
    setPayoffTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteItem(deleteTarget.id);
    setDeleteTarget(null);
  };

  const today = new Date().getDate();

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
              Pusat Manajemen Paylater Terramora
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Daftar Tagihan & Cicilan Aktif</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Pantau seluruh cicilan e-commerce, paylater, dan kartu kredit. Cegah denda keterlambatan dengan pengingat otomatis.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#007a52] hover:bg-[#006644] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs self-start md:self-auto cursor-pointer text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tagihan Paylater</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Total Tagihan Bulan Ini</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatRupiah(totalMonthlyCommitment)}</div>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800">Sudah Terbayar Bulan Ini</span>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{formatRupiah(totalPaidThisMonth)}</div>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800">Estimasi Sisa Pokok Total</span>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5">{formatRupiah(totalRemainingDebt)}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi atau catatan paylater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <select
            value={selectedProviderFilter}
            onChange={(e) => setSelectedProviderFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Semua Layanan</option>
            <option value="spaylater">SPayLater</option>
            <option value="gopaylater">GoPay Later</option>
            <option value="kredivo">Kredivo</option>
            <option value="akulaku">Akulaku</option>
            <option value="indodana">Indodana</option>
            <option value="traveloka">Traveloka PayLater</option>
            <option value="kartu_kredit">Kartu Kredit</option>
            <option value="lainnya">Lainnya</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('unpaid')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedStatusFilter === 'unpaid' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Belum Bayar
            </button>
            <button
              onClick={() => setSelectedStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedStatusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Lunas
            </button>
          </div>
        </div>

      </div>

      {/* Paylater Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filteredItems.map((item) => {
            const providerInfo = PROVIDER_META[item.provider];
            const providerLabel = item.customProviderName || providerInfo.name;
            const progressPercent = Math.min(100, Math.round((item.currentTenor / item.totalTenor) * 100));
            const remainingTenors = Math.max(0, item.totalTenor - item.currentTenor);
            const remainingDebt = remainingTenors * item.monthlyInstallment;
            const daysLeft = item.dueDay - today;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl px-3 py-2 border transition-all shadow-xs hover:shadow-md ${
                  item.isPaidThisMonth
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : daysLeft < 0
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : daysLeft <= 3
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-2 md:grid md:grid-cols-[minmax(170px,1.15fr)_120px_120px_minmax(170px,1fr)_auto] md:items-center md:gap-5">
                  {/* Identity */}
                  <div className="min-w-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md border ${providerInfo.badgeBg}`}>
                        {providerLabel}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{item.title}</h4>
                    </div>
                    {item.isPaidThisMonth ? (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">Lunas</span>
                    ) : daysLeft < 0 ? (
                      <span className="shrink-0 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-md">Telat</span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" /> Tgl {item.dueDay}
                      </span>
                    )}
                  </div>

                  {/* Amounts */}
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tagihan / bulan</span>
                    <strong className="text-sm text-slate-900">{formatRupiah(item.monthlyInstallment)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Sisa pokok</span>
                    <strong className="text-sm text-amber-700">{formatRupiah(remainingDebt)}</strong>
                  </div>

                  {/* Progress */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-500">Tenor {item.currentTenor}/{item.totalTenor} bulan</span>
                      <strong className="text-emerald-700">{progressPercent}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 md:flex-col md:items-end md:justify-center">
                  
                  {/* Share & Calendar Quick Tools */}
                  <div className="flex items-center gap-1">
                    <a
                      href={createWhatsAppReminderUrl(item.title, item.monthlyInstallment, item.dueDay, providerLabel, daysLeft)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                      title="Kirim Pengingat ke WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={createGoogleCalendarUrl(item.title, item.monthlyInstallment, new Date(currentYear, currentMonth, item.dueDay), providerLabel)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                      title="Simpan ke Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      title="Edit Tagihan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                      title="Hapus Tagihan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Pay / Toggle Action */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {item.currentTenor < item.totalTenor && (
                      <button
                        onClick={() => handleFullPayoffClick(item.id, item.title)}
                        className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                        title="Tandai seluruh tenor selesai lunas"
                      >
                        Lunasi Penuh
                      </button>
                    )}

                    <button
                      onClick={() => handlePayClick(item)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs ${
                        item.isPaidThisMonth
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {item.isPaidThisMonth ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Batal Bayar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Bayar Bulan Ini</span>
                        </>
                      )}
                    </button>
                  </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Belum Ada Data Tagihan Paylater</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Mulai catat cicilan SPayLater, GoPay Later, Kredivo, atau tagihan kartu kredit Anda agar tidak ada pembayaran yang terlewat.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tagihan Pertama</span>
          </button>
        </div>
      )}

      {/* Add / Edit Paylater Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingItem ? 'Edit Tagihan Paylater' : 'Tambah Tagihan Paylater'}
                  </h3>
                  <p className="text-xs text-slate-500">Lengkapi data cicilan dan tanggal jatuh tempo</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Barang / Transaksi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama barang / transaksi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Provider Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Layanan / Platform <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as PaylaterProvider)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="spaylater">SPayLater (Shopee)</option>
                    <option value="gopaylater">GoPay Later (GoTo)</option>
                    <option value="kredivo">Kredivo</option>
                    <option value="akulaku">Akulaku</option>
                    <option value="indodana">Indodana</option>
                    <option value="traveloka">Traveloka PayLater</option>
                    <option value="homecredit">Home Credit</option>
                    <option value="kartu_kredit">Kartu Kredit</option>
                    <option value="lainnya">Lainnya / Custom</option>
                  </select>
                </div>

                {provider === 'lainnya' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Layanan Custom
                    </label>
                    <input
                      type="text"
                      placeholder="Nama penyedia paylater"
                      value={customProviderName}
                      onChange={(e) => setCustomProviderName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Tanggal {d} setiap bulan
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Billing start month */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bulan Mulai Tagihan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {Array.from({ length: 24 }, (_, index) => {
                    const date = new Date(currentYear, currentMonth + index - 6, 1);
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                    return <option key={value} value={value}>{label}</option>;
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih bulan saat cicilan pertama mulai ditagihkan.
                </p>
              </div>

              {/* Amount & Tenor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Harga / Pokok (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={totalAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Tenor (Bulan) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={totalTenor}
                    onChange={(e) => handleTenorChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1">1 Bulan (Bayar Bulan Depan)</option>
                    <option value="2">2 Bulan</option>
                    <option value="3">3 Bulan</option>
                    <option value="6">6 Bulan</option>
                    <option value="9">9 Bulan</option>
                    <option value="12">12 Bulan (1 Tahun)</option>
                    <option value="18">18 Bulan</option>
                    <option value="24">24 Bulan (2 Tahun)</option>
                  </select>
                </div>
              </div>

              {/* Current Tenor & Monthly Installment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cicilan Berjalan Saat Ini
                  </label>
                  <select
                    value={currentTenor}
                    onChange={(e) => setCurrentTenor(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: parseInt(totalTenor, 10) || 1 }, (_, i) => i + 1).map((t) => (
                      <option key={t} value={t}>
                        Cicilan ke-{t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Tagihan/Bulan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={monthlyInstallment}
                    onChange={(e) => {
                      setMonthlyInstallment(e.target.value);
                      setAutoCalculateMonthly(false);
                    }}
                    className="w-full px-3.5 py-2 text-sm bg-emerald-50/50 font-bold text-slate-900 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan tambahan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Tagihan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Tagihan Paylater"
        message={`Apakah Anda yakin ingin menghapus data tagihan "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirm Full Payoff Modal */}
      <ConfirmModal
        isOpen={!!payoffTarget}
        title="Lunasi Seluruh Cicilan"
        message={`Yakin ingin menandai seluruh sisa cicilan untuk "${payoffTarget?.title}" sebagai lunas sepenuhnya?`}
        confirmText="Ya, Lunasi Semua"
        cancelText="Batal"
        type="success"
        onConfirm={confirmFullPayoff}
        onCancel={() => setPayoffTarget(null)}
      />

    </div>
  );
};
