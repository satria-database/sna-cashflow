import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Send, ChevronRight as ArrowRightIcon, Wrench } from 'lucide-react';
import { ExpenseItem, PaylaterItem, MaintenanceSchedule, AssetItem } from '../types';
import { formatRupiah, PROVIDER_META, MONTH_NAMES_ID, createWhatsAppReminderUrl } from '../utils/formatters';

interface BillCalendarViewProps {
  currentYear: number;
  currentMonth: number;
  paylaterItems: PaylaterItem[];
  expenses: ExpenseItem[];
  maintenanceSchedules?: MaintenanceSchedule[];
  assets?: AssetItem[];
  onSelectMaintenance?: (schedule: MaintenanceSchedule) => void;
  onTogglePayMonth: (id: string) => void;
}

export const BillCalendarView: React.FC<BillCalendarViewProps> = ({
  currentYear,
  currentMonth,
  paylaterItems,
  expenses,
  maintenanceSchedules = [],
  assets = [],
  onSelectMaintenance,
  onTogglePayMonth,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const assetMap = useMemo(() => {
    const map = new Map<string, AssetItem>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  // Calendar math
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const currentDay = today.getDate();

  // Map paylater items by dueDay
  const paylaterByDay: Record<number, PaylaterItem[]> = {};
  paylaterItems.forEach((item) => {
    if (!paylaterByDay[item.dueDay]) paylaterByDay[item.dueDay] = [];
    paylaterByDay[item.dueDay].push(item);
  });

  // Map expenses by day of month
  const expensesByDay: Record<number, ExpenseItem[]> = {};
  expenses.forEach((exp) => {
    const expDate = new Date(exp.date);
    if (expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth) {
      const day = expDate.getDate();
      if (!expensesByDay[day]) expensesByDay[day] = [];
      expensesByDay[day].push(exp);
    }
  });

  // Map maintenance schedules by day of month
  const maintenancesByDay: Record<number, MaintenanceSchedule[]> = {};
  maintenanceSchedules.forEach((sched) => {
    if (sched.nextDate) {
      const [y, m, d] = sched.nextDate.split('-').map(Number);
      if (y === currentYear && m - 1 === currentMonth) {
        if (!maintenancesByDay[d]) maintenancesByDay[d] = [];
        maintenancesByDay[d].push(sched);
      }
    }
  });

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const selectedDayPaylaters = selectedDay ? paylaterByDay[selectedDay] || [] : [];
  const selectedDayExpenses = selectedDay ? expensesByDay[selectedDay] || [] : [];
  const selectedDayMaintenances = selectedDay ? maintenancesByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
              <span className="text-xs uppercase font-bold tracking-wider text-purple-600">
                Kalender Finansial & Pekerjaan
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Jadwal Tagihan & Pekerjaan {MONTH_NAMES_ID[currentMonth]} {currentYear}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Tagihan Jatuh Tempo
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Lunas
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007a52]" /> Pekerjaan
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Pengeluaran
            </span>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-bold text-slate-500 border-b border-slate-100">
          {dayNames.map((d, i) => (
            <div key={d} className={i === 0 ? 'text-rose-500' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[70px] sm:min-h-[90px] p-1 bg-slate-50/50 rounded-xl border border-transparent" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = isCurrentMonth && day === currentDay;
            const bills = paylaterByDay[day] || [];
            const exps = expensesByDay[day] || [];
            const maintenances = maintenancesByDay[day] || [];
            const hasUnpaidBill = bills.some((b) => !b.isPaidThisMonth);
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[75px] sm:min-h-[100px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30'
                    : isToday
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                      : bills.length > 0
                        ? hasUnpaidBill
                          ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                          : 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                        : maintenances.length > 0
                          ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300'
                          : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-amber-500 text-white font-black' : isSelected ? 'bg-emerald-600 text-white' : 'text-slate-800'
                  }`}>
                    {day}
                  </span>
                  <div className="flex items-center gap-1">
                    {bills.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                        {bills.length} tagihan
                      </span>
                    )}
                    {maintenances.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 hidden sm:inline">
                        🔧 {maintenances.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Content Badges */}
                <div className="mt-1 space-y-1 overflow-hidden">
                  {/* Maintenance Badges */}
                  {maintenances.slice(0, 2).map((m) => {
                    const asset = assetMap.get(m.assetId);
                    return (
                      <div
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectMaintenance) onSelectMaintenance(m);
                          setSelectedDay(day);
                        }}
                        className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate border bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200 flex items-center gap-1 transition-colors"
                        title={`🔧 ${m.title} (${asset?.name || 'Aset'})`}
                      >
                        <span className="shrink-0">🔧</span>
                        <span className="truncate">{m.title}</span>
                      </div>
                    );
                  })}

                  {/* Bills Badges */}
                  {bills.slice(0, 2).map((bill) => (
                    <div
                      key={bill.id}
                      className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate border ${
                        bill.isPaidThisMonth
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                      }`}
                      title={`${bill.title} - ${formatRupiah(bill.monthlyInstallment)}`}
                    >
                      {bill.isPaidThisMonth ? '✓ ' : '! '}
                      {bill.title}
                    </div>
                  ))}

                  {/* Overflow badge if items > 2 */}
                  {bills.length + maintenances.length > 2 && (
                    <div className="text-[9px] font-bold text-slate-500 text-center">
                      +{bills.length + maintenances.length - 2} lagi
                    </div>
                  )}

                  {exps.length > 0 && bills.length === 0 && maintenances.length === 0 && (
                    <div className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.5 rounded truncate">
                      {exps.length} Pengeluaran
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Drawer/Card */}
      {selectedDay && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              Detail Agenda Tanggal {selectedDay} {MONTH_NAMES_ID[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Paylater bills on this day */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tagihan Paylater ({selectedDayPaylaters.length})
              </h4>
              {selectedDayPaylaters.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayPaylaters.map((item) => {
                    const providerInfo = PROVIDER_META[item.provider];
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${providerInfo.badgeBg}`}>
                              {item.customProviderName || providerInfo.name}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs">{item.title}</h5>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Nominal: <strong className="text-slate-900">{formatRupiah(item.monthlyInstallment)}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={createWhatsAppReminderUrl(item.title, item.monthlyInstallment, item.dueDay, item.customProviderName || providerInfo.name, item.dueDay - currentDay)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-slate-200"
                            title="Kirim ke WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onTogglePayMonth(item.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.isPaidThisMonth
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {item.isPaidThisMonth ? 'Batal Bayar' : 'Bayar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Tidak ada tagihan jatuh tempo di tanggal ini.
                </p>
              )}
            </div>

            {/* Expenses on this day */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pengeluaran Tercatat ({selectedDayExpenses.length})
              </h4>
              {selectedDayExpenses.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDayExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{exp.title}</span>
                      <span className="font-bold text-slate-900">-{formatRupiah(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Belum ada pengeluaran tercatat di tanggal ini.
                </p>
              )}
            </div>

            {/* Jadwal Perawatan on this day */}
            <div className="space-y-2 md:col-span-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                <span>Jadwal Perawatan Aset ({selectedDayMaintenances.length})</span>
              </h4>
              {selectedDayMaintenances.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedDayMaintenances.map((m) => {
                    const asset = assetMap.get(m.assetId);
                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200">
                              {asset?.name || 'Aset'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{m.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Kategori: {m.category}
                            {m.estimatedCost ? ` • Est. Biaya: ${formatRupiah(m.estimatedCost)}` : ''}
                          </div>
                        </div>

                        {onSelectMaintenance && (
                          <button
                            onClick={() => onSelectMaintenance(m)}
                            className="px-3 py-1.5 text-xs font-bold bg-[#007a52] hover:bg-[#006644] text-white rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
                          >
                            Detail
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Tidak ada jadwal perawatan aset yang jatuh tempo pada tanggal ini.
                </p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
