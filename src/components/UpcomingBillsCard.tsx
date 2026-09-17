import React from 'react';
import { PaylaterItem } from '../types';
import { formatRupiah, formatShortRupiah } from '../utils/formatters';
import { CalendarCheck, ChevronRight, Plus, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface UpcomingBillsCardProps {
  paylaterItems: PaylaterItem[];
  currentYear: number;
  currentMonth: number;
  onNavigateToCalendar: () => void;
  onNavigateToPaylater: () => void;
  onOpenAddModal: () => void;
  onMarkAsPaid: (id: string) => void;
}

export const UpcomingBillsCard: React.FC<UpcomingBillsCardProps> = ({
  paylaterItems,
  currentYear,
  currentMonth,
  onNavigateToCalendar,
  onNavigateToPaylater,
  onOpenAddModal,
  onMarkAsPaid,
}) => {
  const unpaidItems = paylaterItems.filter((item) => !item.isPaidThisMonth);
  const sortedUnpaid = [...unpaidItems].sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Tagihan Mendatang
          </h3>
        </div>
        <button
          onClick={onNavigateToCalendar}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
        >
          <span>Lihat Kalender</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="py-4">
        {sortedUnpaid.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Belum ada tagihan mendatang.
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                Catat tagihan untuk melihat jadwal jatuh tempo di sini.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="w-full mt-2 py-2.5 px-4 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Tagihan Baru</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedUnpaid.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Jatuh tempo Tgl {item.dueDay} • Cicilan {item.currentTenor}/{item.totalTenor}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {formatShortRupiah(item.monthlyInstallment)}
                  </span>
                  <button
                    onClick={() => onMarkAsPaid(item.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Bayar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sortedUnpaid.length > 0 && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{sortedUnpaid.length} tagihan belum dibayar</span>
          <button
            onClick={onNavigateToPaylater}
            className="font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Kelola Semua
          </button>
        </div>
      )}
    </div>
  );
};
