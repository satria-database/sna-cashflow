import React, { useState } from 'react';
import { 
  Plus, 
  Receipt, 
  Search, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { CategoryBudget, ExpenseCategory, ExpenseItem } from '../types';
import { 
  formatRupiah, 
  EXPENSE_CATEGORY_META, 
  formatFullDateID 
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface ExpenseManagerProps {
  expenses: ExpenseItem[];
  budgets: CategoryBudget[];
  currentYear: number;
  currentMonth: number;
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateBudget: (category: ExpenseCategory, newLimit: number) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  budgets,
  currentYear,
  currentMonth,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateBudget,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('makanan');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const openAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setCategory('makanan');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsRecurring(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDate(exp.date);
    setNotes(exp.notes || '');
    setIsRecurring(exp.isRecurring || false);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        category,
        date,
        notes: notes.trim(),
        isRecurring,
      });
    } else {
      onAddExpense({
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        category,
        date,
        notes: notes.trim(),
        isRecurring,
      });
    }

    setIsAddModalOpen(false);
  };

  // Calculate spending per category
  const spendingByCategory: Record<ExpenseCategory, number> = {
    makanan: 0,
    transportasi: 0,
    belanja: 0,
    tagihan_rumah: 0,
    hiburan: 0,
    kesehatan: 0,
    pendidikan: 0,
    keluarga: 0,
    investasi: 0,
    lainnya: 0,
  };

  expenses.forEach((e) => {
    if (spendingByCategory[e.category] !== undefined) {
      spendingByCategory[e.category] += e.amount;
    }
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
              Pengeluaran & Anggaran Bulanan
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Catatan Pengeluaran Rutin</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total tercatat: <strong className="text-slate-900">{formatRupiah(totalExpenseAmount)}</strong> ({expenses.length} transaksi)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBudgetDrawerOpen(!isBudgetDrawerOpen)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>{isBudgetDrawerOpen ? 'Tutup Atur Budget' : 'Atur Batas Budget'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Budget Limit Progress Bars (Collapsible or visible) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Batas Anggaran per Kategori (Budget Planner)
          </h3>
          <span className="text-xs text-slate-400">Realisasi Pengeluaran vs Budget Limit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map((b) => {
            const meta = EXPENSE_CATEGORY_META[b.category];
            const spent = spendingByCategory[b.category] || 0;
            const percent = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
            const isOver = spent > b.monthlyLimit;

            return (
              <div key={b.category} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </span>
                  <span className={`font-extrabold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                    {percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Terpakai: <strong className="text-slate-800">{formatRupiah(spent)}</strong></span>
                  <span>Limit: {formatRupiah(b.monthlyLimit)}</span>
                </div>

                {/* Inline budget adjuster */}
                {isBudgetDrawerOpen && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Ubah Limit:</span>
                    <input
                      type="number"
                      step="50000"
                      value={b.monthlyLimit}
                      onChange={(e) => onUpdateBudget(b.category, parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-semibold px-2 py-0.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi pengeluaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            {Object.entries(EXPENSE_CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* List items */}
        {filteredExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => {
              const meta = EXPENSE_CATEGORY_META[exp.category];

              return (
                <div
                  key={exp.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{exp.title}</h4>
                        {exp.isRecurring && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md">
                            Rutin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{meta.label}</span>
                        <span>•</span>
                        <span>{formatFullDateID(exp.date)}</span>
                        {exp.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-xs">{exp.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-extrabold text-slate-900">
                        -{formatRupiah(exp.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: exp.id, title: exp.title })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500 text-sm">
            Tidak ada transaksi pengeluaran yang cocok.
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama pengeluaran"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500"
                    />
                    <span>Tagihan Rutin Bulanan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan tambahan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingExpense ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${deleteTarget?.title}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteExpense(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
