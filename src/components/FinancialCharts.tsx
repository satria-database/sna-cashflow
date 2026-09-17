import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { ExpenseItem, IncomeItem, PaylaterItem } from '../types';
import { formatRupiah, formatShortRupiah, EXPENSE_CATEGORY_META, MONTH_NAMES_ID } from '../utils/formatters';
import { PieChart as PieIcon, BarChart3, TrendingDown, Calendar, Info, ShieldCheck } from 'lucide-react';

interface FinancialChartsProps {
  expenses: ExpenseItem[];
  paylaterItems: PaylaterItem[];
  incomes: IncomeItem[];
  currentYear: number;
  currentMonth: number;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  expenses,
  paylaterItems,
  incomes,
  currentYear,
  currentMonth,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'distribution' | 'timeline' | 'cashflow'>('distribution');

  // 1. Data for Expense & Paylater Donut Chart
  const categoryTotals: Record<string, { name: string; value: number; color: string }> = {};

  // Add regular expenses by category
  expenses.forEach((exp) => {
    const meta = EXPENSE_CATEGORY_META[exp.category];
    const catName = meta ? meta.label : exp.category;
    const catColor = meta ? meta.color : '#64748B';

    if (!categoryTotals[exp.category]) {
      categoryTotals[exp.category] = {
        name: catName,
        value: 0,
        color: catColor,
      };
    }
    categoryTotals[exp.category].value += exp.amount;
  });

  // Add Paylater as its own slice in expense distribution
  const totalPaylaterThisMonth = paylaterItems.reduce((sum, item) => sum + item.monthlyInstallment, 0);
  if (totalPaylaterThisMonth > 0) {
    categoryTotals['paylater'] = {
      name: 'Cicilan Paylater (Semua)',
      value: totalPaylaterThisMonth,
      color: '#00BFA5', // Terrava brand teal
    };
  }

  const distributionData = Object.values(categoryTotals).filter((item) => item.value > 0);
  const totalAllSpending = distributionData.reduce((sum, d) => sum + d.value, 0);

  // 2. Data for 6-Month Debt Projection Timeline
  const projectionMonths = 6;
  const projectionData: { monthName: string; totalInstallment: number; activeDebtsCount: number }[] = [];

  for (let i = 0; i < projectionMonths; i++) {
    const futureDate = new Date(currentYear, currentMonth + i, 1);
    const monthIndex = futureDate.getMonth();
    const year = futureDate.getFullYear();
    const monthLabel = `${MONTH_NAMES_ID[monthIndex].slice(0, 3)} ${year}`;

    // Check which paylater items are still active at month offset i
    let monthTotal = 0;
    let activeCount = 0;

    paylaterItems.forEach((item) => {
      // Remaining tenors after current month
      const remainingTenors = item.totalTenor - item.currentTenor;
      // If i == 0, it's current month installment
      // If i > 0, it's future installment as long as i <= remainingTenors
      if (i <= remainingTenors) {
        monthTotal += item.monthlyInstallment;
        activeCount++;
      }
    });

    projectionData.push({
      monthName: monthLabel,
      totalInstallment: monthTotal,
      activeDebtsCount: activeCount,
    });
  }

  // 3. Cash Flow Summary Data
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalRegularExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netSavings = Math.max(0, totalIncome - (totalRegularExpense + totalPaylaterThisMonth));

  const cashFlowData = [
    { name: 'Pemasukan', amount: totalIncome, fill: '#10B981' },
    { name: 'Pengeluaran Rutin', amount: totalRegularExpense, fill: '#3B82F6' },
    { name: 'Tagihan Paylater', amount: totalPaylaterThisMonth, fill: '#F59E0B' },
    { name: 'Sisa Bersih', amount: Math.max(0, totalIncome - (totalRegularExpense + totalPaylaterThisMonth)), fill: '#6366F1' },
  ];

  // DSR calculation
  const dsrPercent = totalIncome > 0 ? (totalPaylaterThisMonth / totalIncome) * 100 : 0;
  const paylaterPercentOfExpense = totalAllSpending > 0 ? (totalPaylaterThisMonth / totalAllSpending) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Visualisasi & Grafik Keuangan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis proporsi pengeluaran, perbandingan arus kas, dan proyeksi cicilan paylater.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveChartTab('distribution')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'distribution'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Proporsi Pengeluaran</span>
          </button>
          <button
            onClick={() => setActiveChartTab('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'timeline'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Proyeksi Pelunasan</span>
          </button>
          <button
            onClick={() => setActiveChartTab('cashflow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'cashflow'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>Arus Kas</span>
          </button>
        </div>
      </div>

      {/* Chart Content Body */}
      <div className="pt-4">
        {activeChartTab === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Donut Chart / Empty State */}
            <div className="lg:col-span-7 h-64 w-full">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [
                        `${formatRupiah(val)} (${((val / totalAllSpending) * 100).toFixed(1)}%)`,
                        'Nominal'
                      ]}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                      itemStyle={{ color: '#E2E8F0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Belum ada data pengeluaran bulan ini.
                  </p>
                </div>
              )}
            </div>

            {/* Legend & Stats breakdown */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="text-xs text-slate-600 font-semibold mb-1">Total Beban Finansial Bulan Ini</div>
                <div className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalAllSpending)}</div>
                
                {/* Paylater percentage callout */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Porsi Cicilan Paylater:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {paylaterPercentOfExpense.toFixed(1)}% ({formatRupiah(totalPaylaterThisMonth)})
                  </span>
                </div>
              </div>

              {/* Top Category List */}
              {distributionData.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                  {distributionData
                    .sort((a, b) => b.value - a.value)
                    .map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-700 font-medium line-clamp-1">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900">{formatRupiah(item.value)}</span>
                          <span className="text-slate-600 text-[11px] ml-1.5">
                            ({((item.value / totalAllSpending) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeChartTab === 'timeline' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Grafik proyeksi total cicilan paylater yang harus dibayar selama 6 bulan ke depan hingga lunas:
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Otomatis Berkurang Setiap Tenor Berakhir
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paylaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00BFA5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00BFA5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="monthName" tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} 
                    tickFormatter={(val) => formatShortRupiah(val)} 
                  />
                  <Tooltip
                    formatter={(val: number, name: string, props: any) => [
                      formatRupiah(val),
                      `Total Tagihan (${props.payload.activeDebtsCount} Cicilan Aktif)`
                    ]}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInstallment"
                    stroke="#00BFA5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#paylaterGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {projectionData.map((d, i) => (
                <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
                  <div className="text-[11px] font-semibold text-slate-500">{d.monthName}</div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{formatShortRupiah(d.totalInstallment)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.activeDebtsCount} cicilan</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChartTab === 'cashflow' && (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Perbandingan Arus Kas Masuk vs Pengeluaran Rutin vs Beban Paylater</span>
              <span className="font-semibold text-slate-700">
                Rasio DSR: <strong className="text-slate-900">{dsrPercent.toFixed(1)}%</strong>
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }} 
                    tickFormatter={(val) => formatShortRupiah(val)} 
                  />
                  <Tooltip
                    formatter={(val: number) => [formatRupiah(val), 'Nominal']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Health Tip */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Pedoman Kesehatan Arus Kas:</strong> Alokasi yang disarankan adalah 50% Kebutuhan Pokok, 30% Keinginan/Lifestyle, dan minimal 20% Tabungan/Investasi. Total seluruh cicilan hutang (termasuk Paylater) sebaiknya tidak melebihi <strong>30% dari total pemasukan bulanan</strong>.
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
