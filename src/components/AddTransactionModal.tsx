import React, { useState } from 'react';
import { CreditCard, Receipt, TrendingUp, Plus } from 'lucide-react';
import { ExpenseCategory, IncomeSource, PaylaterItem, PaylaterProvider } from '../types';
import { EXPENSE_CATEGORY_META, INCOME_SOURCE_META, PROVIDER_META } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'paylater' | 'expense' | 'income';
  currentYear: number;
  currentMonth: number;
  onAddPaylater: (item: Omit<PaylaterItem, 'id' | 'createdAt' | 'paidHistory'>) => void;
  onAddExpense: (expense: any) => void;
  onAddIncome: (income: any) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'paylater',
  currentYear,
  currentMonth,
  onAddPaylater,
  onAddExpense,
  onAddIncome,
}) => {
  const [activeType, setActiveType] = useState<'paylater' | 'expense' | 'income'>(initialType);

  // Paylater form states
  const [plTitle, setPlTitle] = useState('');
  const [plProvider, setPlProvider] = useState<PaylaterProvider>('spaylater');
  const [plCustomProvider, setPlCustomProvider] = useState('');
  const [plTotalAmount, setPlTotalAmount] = useState('');
  const [plMonthlyInstallment, setPlMonthlyInstallment] = useState('');
  const [plTotalTenor, setPlTotalTenor] = useState('6');
  const [plCurrentTenor, setPlCurrentTenor] = useState('1');
  const [plDueDay, setPlDueDay] = useState('5');
  const [plNotes, setPlNotes] = useState('');

  // Expense form states
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('makanan');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [expRecurring, setExpRecurring] = useState(false);

  // Income form states
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incSource, setIncSource] = useState<IncomeSource>('gaji');
  const [incDate, setIncDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incNotes, setIncNotes] = useState('');

  if (!isOpen) return null;

  const handlePaylaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plTitle || !plTotalAmount || !plMonthlyInstallment) return;

    onAddPaylater({
      title: plTitle.trim(),
      provider: plProvider,
      customProviderName: plProvider === 'lainnya' ? plCustomProvider.trim() : undefined,
      totalAmount: parseFloat(plTotalAmount) || 0,
      monthlyInstallment: parseFloat(plMonthlyInstallment) || 0,
      totalTenor: parseInt(plTotalTenor, 10) || 1,
      currentTenor: parseInt(plCurrentTenor, 10) || 1,
      dueDay: parseInt(plDueDay, 10) || 1,
      notes: plNotes.trim(),
      startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      isPaidThisMonth: false,
    });
    onClose();
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    onAddExpense({
      title: expTitle.trim(),
      amount: parseFloat(expAmount) || 0,
      category: expCategory,
      date: expDate,
      notes: expNotes.trim(),
      isRecurring: expRecurring,
    });
    onClose();
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incAmount) return;

    onAddIncome({
      title: incTitle.trim(),
      amount: parseFloat(incAmount) || 0,
      source: incSource,
      date: incDate,
      notes: incNotes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-lg">Tambah Data Keuangan</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* 3 Type Pills */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveType('paylater')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeType === 'paylater' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paylater</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveType('expense')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeType === 'expense' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveType('income')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeType === 'income' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>
        </div>

        {/* Form 1: Paylater */}
        {activeType === 'paylater' && (
          <form onSubmit={handlePaylaterSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Barang / Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama barang / transaksi"
                value={plTitle}
                onChange={(e) => setPlTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Layanan Paylater <span className="text-rose-500">*</span>
                </label>
                <select
                  value={plProvider}
                  onChange={(e) => setPlProvider(e.target.value as PaylaterProvider)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="spaylater">SPayLater</option>
                  <option value="gopaylater">GoPay Later</option>
                  <option value="kredivo">Kredivo</option>
                  <option value="akulaku">Akulaku</option>
                  <option value="indodana">Indodana</option>
                  <option value="traveloka">Traveloka PayLater</option>
                  <option value="kartu_kredit">Kartu Kredit</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tgl Jatuh Tempo <span className="text-rose-500">*</span>
                </label>
                <select
                  value={plDueDay}
                  onChange={(e) => setPlDueDay(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Tanggal {d} tiap bulan
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Pokok (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={plTotalAmount}
                  onChange={(e) => {
                    setPlTotalAmount(e.target.value);
                    if (e.target.value && plTotalTenor) {
                      const calculated = Math.round(parseFloat(e.target.value) / parseInt(plTotalTenor, 10));
                      setPlMonthlyInstallment(calculated.toString());
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Tenor (Bulan) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={plTotalTenor}
                  onChange={(e) => {
                    setPlTotalTenor(e.target.value);
                    if (plTotalAmount && e.target.value) {
                      const calculated = Math.round(parseFloat(plTotalAmount) / parseInt(e.target.value, 10));
                      setPlMonthlyInstallment(calculated.toString());
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">1 Bulan</option>
                  <option value="3">3 Bulan</option>
                  <option value="6">6 Bulan</option>
                  <option value="9">9 Bulan</option>
                  <option value="12">12 Bulan</option>
                  <option value="18">18 Bulan</option>
                  <option value="24">24 Bulan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nominal Tagihan per Bulan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={plMonthlyInstallment}
                onChange={(e) => setPlMonthlyInstallment(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-emerald-50/50 font-bold rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Simpan Tagihan Paylater
              </button>
            </div>
          </form>
        )}

        {/* Form 2: Expense */}
        {activeType === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama pengeluaran"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(EXPENSE_CATEGORY_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Catat Pengeluaran
              </button>
            </div>
          </form>
        )}

        {/* Form 3: Income */}
        {activeType === 'income' && (
          <form onSubmit={handleIncomeSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sumber Pemasukan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama sumber pemasukan"
                value={incTitle}
                onChange={(e) => setIncTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Pemasukan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={incSource}
                  onChange={(e) => setIncSource(e.target.value as IncomeSource)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(INCOME_SOURCE_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Diterima <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={incDate}
                onChange={(e) => setIncDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
              >
                Simpan Pemasukan
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
