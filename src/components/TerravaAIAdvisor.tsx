import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight,
  Bot,
  Lightbulb,
  DollarSign
} from 'lucide-react';
import { CategoryBudget, ExpenseItem, IncomeItem, PaylaterItem } from '../types';
import { formatRupiah } from '../utils/formatters';

interface TerramoraAIAdvisorProps {
  paylaterItems: PaylaterItem[];
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  budgets: CategoryBudget[];
  currentYear: number;
  currentMonth: number;
}

export const TerramoraAIAdvisor: React.FC<TerramoraAIAdvisorProps> = ({
  paylaterItems,
  expenses,
  incomes,
  budgets,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [customAdvice, setCustomAdvice] = useState<string | null>(null);

  // Financial metrics
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaylaterMonthly = paylaterItems.reduce((sum, p) => sum + p.monthlyInstallment, 0);
  const totalDebt = paylaterItems.reduce((sum, p) => sum + (p.monthlyInstallment * Math.max(1, p.totalTenor - p.currentTenor + (p.isPaidThisMonth ? 0 : 1))), 0);
  const netCashFlow = totalIncome - (totalExpense + totalPaylaterMonthly);
  
  // DSR percentage
  const dsr = totalIncome > 0 ? (totalPaylaterMonthly / totalIncome) * 100 : 0;

  // Find highest expense category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCategories[0] ? sortedCategories[0][0] : 'Umum';
  const highestCategoryAmount = sortedCategories[0] ? sortedCategories[0][1] : 0;

  const handleAskQuestion = (questionText: string) => {
    setAnalyzing(true);
    setUserQuery(questionText);

    setTimeout(() => {
      let response = '';
      const q = questionText.toLowerCase();

      if (q.includes('aman') || q.includes('paylater baru') || q.includes('tambah cicilan')) {
        if (dsr >= 35) {
          response = `⚠️ **Peringatan Risiko Tinggi:** Rasio hutang (DSR) Anda saat ini sudah mencapai **${dsr.toFixed(1)}%** dari pemasukan. Standar batas aman finansial OJK adalah maksimal 30%. **Sangat tidak disarankan** mengambil paylater atau cicilan baru sampai setidaknya 1–2 cicilan yang ada saat ini lunas.`;
        } else {
          const maxAdditionalInstallment = Math.max(0, (totalIncome * 0.3) - totalPaylaterMonthly);
          response = `✅ **Kondisi Relatif Aman:** DSR Anda saat ini **${dsr.toFixed(1)}%** (di bawah batas 30%). Jika Anda harus mengambil cicilan baru untuk kebutuhan produktif, batas maksimal cicilan tambahan yang aman untuk arus kas Anda adalah **${formatRupiah(maxAdditionalInstallment)}/bulan**.`;
        }
      } else if (q.includes('hemat') || q.includes('kurangi pengeluaran') || q.includes('boros')) {
        response = `💡 **Strategi Penghematan Berdasarkan Data Anda:**
1. Pengeluaran terbesar Anda bulan ini ada pada kategori **${highestCategory.toUpperCase()}** (${formatRupiah(highestCategoryAmount)}). Cobalah buat batasan harian agar kategori ini turun 15-20%.
2. Total beban paylater Anda adalah **${formatRupiah(totalPaylaterMonthly)}/bulan**. Jangan tergoda promo voucher diskon yang mengharuskan metode pembayaran cicilan tenor panjang.
3. Selalu alokasikan tabungan dana darurat di awal gajian (Pay Yourself First) minimal 10% dari pemasukan.`;
      } else if (q.includes('snowball') || q.includes('avalanche') || q.includes('cepat lunas')) {
        response = `🎯 **Rekomendasi Pelunasan Terramora:**
- Jika Anda membutuhkan **dorongan motivasi cepat**: Gunakan metode **Debt Snowball**. Lunasi tagihan dengan sisa saldo terkecil terlebih dahulu agar jumlah daftar tagihan berkurang cepat.
- Jika Anda ingin **menghemat total uang bunga**: Gunakan metode **Debt Avalanche**. Prioritaskan tagihan dengan bunga % tertinggi.
- Alokasikan sisa saldo bersih Anda (${formatRupiah(Math.max(0, netCashFlow))}) sebesar 50% untuk mempercepat cicilan prioritas #1.`;
      } else {
        response = `🤖 **Analisis Kesehatan Finansial Terramora AI:**
- **Pemasukan:** ${formatRupiah(totalIncome)}
- **Beban Paylater Bulanan:** ${formatRupiah(totalPaylaterMonthly)} (DSR: ${dsr.toFixed(1)}%)
- **Pengeluaran Operasional:** ${formatRupiah(totalExpense)}
- **Sisa Arus Kas:** ${formatRupiah(netCashFlow)}

Status keseluruhan Anda berada di zona **${dsr <= 30 ? 'AMAN & SEHAT' : dsr <= 40 ? 'WASPADA' : 'OVERLIMIT'}**. Pertahankan kedisiplinan pembayaran jatuh tempo untuk menjaga skor BI Checking/SLIK Anda tetap bersih.`;
      }

      setCustomAdvice(response);
      setAnalyzing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* AI Advisor Hero */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
                  Terramora Smart Advisor
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  AI Powered
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">Konsultan & Audit Finansial Pintar</h2>
            </div>
          </div>

          <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Skor Rasio Hutang (DSR)</span>
            <div className={`text-xl font-extrabold ${dsr > 40 ? 'text-rose-600' : dsr > 30 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {dsr.toFixed(1)}% ({dsr <= 30 ? 'Sehat' : dsr <= 40 ? 'Waspada' : 'Bahaya'})
            </div>
          </div>
        </div>

        {/* 3 Automated Smart Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          
          {/* Insight 1: DSR status */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Beban Paylater</span>
            </div>
            <p className="text-xs text-slate-600">
              {dsr <= 30
                ? 'Rasio cicilan Anda masih di bawah ambang batas 30%. Arus kas stabil dan aman.'
                : 'Porsi cicilan Anda cukup tinggi. Tahan keinginan menambah transaksi paylater baru.'}
            </p>
          </div>

          {/* Insight 2: Highest spending */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
              <Lightbulb className="w-4 h-4" />
              <span>Fokus Penghematan</span>
            </div>
            <p className="text-xs text-slate-600">
              Pengeluaran terbesar ada di kategori <strong className="text-slate-900">{highestCategory}</strong> ({formatRupiah(highestCategoryAmount)}).
            </p>
          </div>

          {/* Insight 3: Net cash flow */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
              <DollarSign className="w-4 h-4" />
              <span>Kapasitas Tabungan</span>
            </div>
            <p className="text-xs text-slate-600">
              Sisa saldo bersih Anda bulan ini adalah <strong className="text-slate-900">{formatRupiah(netCashFlow)}</strong>. Alokasikan 20% ke dana darurat.
            </p>
          </div>

        </div>
      </div>

      {/* Interactive AI Query Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Tanyakan Apapun Tentang Keuangan Anda</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih pertanyaan cepat di bawah atau tulis pertanyaan konsultasi finansial Anda.
          </p>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleAskQuestion('Apakah aman jika saya mengambil paylater baru saat ini?')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold border border-slate-200 transition-colors text-left cursor-pointer"
          >
            🤔 Apakah aman ambil cicilan paylater baru?
          </button>
          <button
            onClick={() => handleAskQuestion('Bagaimana cara paling cepat melunasi semua cicilan paylater saya?')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold border border-slate-200 transition-colors text-left cursor-pointer"
          >
            ⚡ Tips strategi pelunasan tercepat (Snowball vs Avalanche)?
          </button>
          <button
            onClick={() => handleAskQuestion('Di mana pos pengeluaran saya yang paling boros bulan ini?')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold border border-slate-200 transition-colors text-left cursor-pointer"
          >
            💡 Rekomendasi pos penghematan anggaran bulanan
          </button>
        </div>

        {/* Custom question input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tulis pertanyaan konsultasi keuangan Anda..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userQuery.trim()) {
                handleAskQuestion(userQuery.trim());
              }
            }}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
          <button
            onClick={() => {
              if (userQuery.trim()) handleAskQuestion(userQuery.trim());
            }}
            disabled={analyzing || !userQuery.trim()}
            className="bg-[#007a52] hover:bg-[#006644] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            {analyzing ? 'Menganalisis...' : 'Analisis AI'}
          </button>
        </div>

        {/* AI Output Card */}
        {customAdvice && (
          <div className="mt-4 p-5 bg-emerald-50/80 text-slate-900 rounded-2xl border border-emerald-200 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4 text-emerald-700" />
              <span>Hasil Analisis Konsultan Finansial Terramora:</span>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {customAdvice}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
