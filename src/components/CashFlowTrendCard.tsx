import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { ExpenseItem, IncomeItem, PaylaterItem } from '../types';
import { formatRupiah, formatShortRupiah, MONTH_NAMES_ID } from '../utils/formatters';
import { TrendingUp, Bell, ChevronDown } from 'lucide-react';

interface CashFlowTrendCardProps {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  paylaterItems: PaylaterItem[];
  currentYear: number;
  currentMonth: number;
}

export const CashFlowTrendCard: React.FC<CashFlowTrendCardProps> = ({
  incomes,
  expenses,
  paylaterItems,
  currentYear,
  currentMonth,
}) => {
  const [rangeMonths, setRangeMonths] = useState<number>(6);

  // Generate historical data points for the selected range
  const chartData = [];
  let hasAnyData = false;

  for (let i = rangeMonths - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const mIndex = d.getMonth();
    const yVal = d.getFullYear();
    const mLabel = `${MONTH_NAMES_ID[mIndex].slice(0, 3)} ${yVal === currentYear ? '' : yVal}`.trim();

    // In a production setup this aggregates past months
    let monthIncome = 0;
    let monthExpense = 0;

    if (i === 0) {
      // Current active month
      monthIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
      const regExp = expenses.reduce((sum, item) => sum + item.amount, 0);
      const paylaterDue = paylaterItems.reduce((sum, item) => sum + item.monthlyInstallment, 0);
      monthExpense = regExp + paylaterDue;
    }

    if (monthIncome > 0 || monthExpense > 0) {
      hasAnyData = true;
    }

    chartData.push({
      month: mLabel,
      pemasukan: monthIncome,
      pengeluaran: monthExpense,
    });
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Ringkasan Arus Kas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan pemasukan dan pengeluaran {rangeMonths} bulan terakhir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Pengeluaran</span>
            </div>
          </div>

          {/* Time range selector */}
          <div className="relative">
            <select
              value={rangeMonths}
              onChange={(e) => setRangeMonths(Number(e.target.value))}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 pr-7 focus:outline-none cursor-pointer"
            >
              <option value={3}>3 Bulan Terakhir</option>
              <option value={6}>6 Bulan Terakhir</option>
              <option value={12}>12 Bulan Terakhir</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chart Body */}
      <div className="pt-4 h-64 w-full">
        {hasAnyData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748B', fontSize: 10 }} 
                tickFormatter={(v) => formatShortRupiah(v)} 
              />
              <Tooltip 
                formatter={(val: number) => [formatRupiah(val), 'Nominal']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
              />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#F43F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Belum ada data arus kas.</p>
              <p className="text-[11px] text-slate-500">Catat pemasukan dan pengeluaran untuk melihat grafik di sini.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
