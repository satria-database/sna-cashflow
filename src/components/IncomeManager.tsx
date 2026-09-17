import React, { useState } from 'react';
import { Plus, TrendingUp, Trash2, Edit3, DollarSign, Wallet } from 'lucide-react';
import { IncomeItem, IncomeSource } from '../types';
import { formatRupiah, INCOME_SOURCE_META, formatFullDateID } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface IncomeManagerProps {
  incomes: IncomeItem[];
  onAddIncome: (income: Omit<IncomeItem, 'id'>) => void;
  onUpdateIncome: (income: IncomeItem) => void;
  onDeleteIncome: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const IncomeManager: React.FC<IncomeManagerProps> = ({
  incomes,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('gaji');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingIncome(null);
    setTitle('');
    setAmount('');
    setSource('gaji');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (inc: IncomeItem) => {
    setEditingIncome(inc);
    setTitle(inc.title);
    setAmount(inc.amount.toString());
    setSource(inc.source);
    setDate(inc.date);
    setNotes(inc.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    if (editingIncome) {
      onUpdateIncome({
        ...editingIncome,
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        source,
        date,
        notes: notes.trim(),
      });
    } else {
      onAddIncome({
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        source,
        date,
        notes: notes.trim(),
      });
    }
    setIsAddModalOpen(false);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Sumber Pemasukan Bulan Ini
          </h3>
          <p className="text-xs text-slate-500">
            Total Pemasukan: <strong className="text-emerald-700">{formatRupiah(totalIncome)}</strong>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-[#007a52] hover:bg-[#006644] text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pemasukan</span>
        </button>
      </div>

      {incomes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {incomes.map((inc) => {
            const meta = INCOME_SOURCE_META[inc.source];
            return (
              <div
                key={inc.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{inc.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className={`font-semibold px-2 py-0.5 rounded-md ${meta.bg}`}>
                        {meta.label}
                      </span>
                      <span>•</span>
                      <span>{formatFullDateID(inc.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-emerald-700">
                      +{formatRupiah(inc.amount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                    <button
                      onClick={() => openEditModal(inc)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: inc.id, title: inc.title })}
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
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Belum Ada Pemasukan Bulan Ini</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Catat pemasukan bulanan Anda untuk memantau arus kas dan menghitung rasio beban hutang (DSR).
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pemasukan Pertama</span>
          </button>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingIncome ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
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
                  Nama Sumber Pemasukan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama sumber pemasukan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Sumber <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as IncomeSource)}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
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
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {editingIncome ? 'Simpan Perubahan' : 'Catat Pemasukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Pemasukan"
        message={`Apakah Anda yakin ingin menghapus catatan pemasukan "${deleteTarget?.title}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteIncome(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
