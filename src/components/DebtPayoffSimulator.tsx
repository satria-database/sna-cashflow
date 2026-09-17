import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingDown, 
  Flame, 
  Snowflake, 
  ArrowRight, 
  Calculator, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { PaylaterItem } from '../types';
import { formatRupiah, PROVIDER_META } from '../utils/formatters';

interface DebtPayoffSimulatorProps {
  items: PaylaterItem[];
  totalIncome: number;
}

export const DebtPayoffSimulator: React.FC<DebtPayoffSimulatorProps> = ({
  items,
  totalIncome,
}) => {
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(500000);

  // Active debts calculation
  const activeDebts = items.map((item) => {
    const remainingTenors = Math.max(1, item.totalTenor - item.currentTenor + (item.isPaidThisMonth ? 0 : 1));
    const remainingBalance = remainingTenors * item.monthlyInstallment;
    const interest = item.interestRate || 2.5;

    return {
      ...item,
      remainingTenors,
      remainingBalance,
      interest,
    };
  });

  // Sort by Snowball (smallest remaining balance first)
  const snowballSorted = [...activeDebts].sort((a, b) => a.remainingBalance - b.remainingBalance);

  // Sort by Avalanche (highest interest rate first)
  const avalancheSorted = [...activeDebts].sort((a, b) => b.interest - a.interest);

  const currentList = strategy === 'snowball' ? snowballSorted : avalancheSorted;

  const totalRemainingDebt = activeDebts.reduce((sum, d) => sum + d.remainingBalance, 0);
  const totalMonthlyMinimum = activeDebts.reduce((sum, d) => sum + d.monthlyInstallment, 0);

  // Approximate payoff months without extra payment
  const maxTenorLeft = Math.max(...activeDebts.map((d) => d.remainingTenors), 0);

  // Approximate accelerated payoff months with extra payment
  const totalAcceleratedMonthly = totalMonthlyMinimum + extraPayment;
  const acceleratedMonths = totalAcceleratedMonthly > 0 
    ? Math.max(1, Math.ceil(totalRemainingDebt / totalAcceleratedMonthly))
    : maxTenorLeft;
  
  const monthsSaved = Math.max(0, maxTenorLeft - acceleratedMonths);
  const estimatedInterestSaved = Math.round(totalRemainingDebt * 0.025 * monthsSaved);

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
              Strategi Bebas Paylater
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Kalkulator & Rencana Pelunasan Hutang</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Simulasi pelunasan Snowball & Avalanche untuk menghitung percepatan pelunasan dan penghematan bunga.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Belum Ada Tagihan Paylater Tercatat</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Tambahkan data tagihan paylater pada menu Tagihan Paylater untuk melihat urutan prioritas pelunasan dan simulasi ekstra pembayaran.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Strategy Header Hero */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
                Strategi Bebas Paylater
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Kalkulator & Rencana Pelunasan Hutang</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Gunakan metode finansial teruji (Snowball vs Avalanche) untuk memprioritaskan pelunasan paylater secara cerdas.
            </p>
          </div>

          {/* Strategy Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start md:self-auto gap-1">
            <button
              onClick={() => setStrategy('snowball')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                strategy === 'snowball' ? 'bg-[#007a52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Debt Snowball</span>
            </button>
            <button
              onClick={() => setStrategy('avalanche')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                strategy === 'avalanche' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Debt Avalanche</span>
            </button>
          </div>
        </div>

        {/* Strategy Explanations */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 flex items-start gap-3">
          {strategy === 'snowball' ? (
            <>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <Snowflake className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold">Metode Debt Snowball (Kemenangan Psikologis Cepat):</strong> Fokus melunasi tagihan dengan sisa saldo terkecil terlebih dahulu, sambil membayar cicilan minimum pada tagihan lainnya. Sangat ampuh memberi dorongan motivasi cepat karena jumlah pinjaman berkurang lebih cepat.
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold">Metode Debt Avalanche (Hemat Bunga Finansial):</strong> Fokus melunasi tagihan yang memiliki tingkat bunga/biaya admin tertinggi terlebih dahulu. Metode ini secara matematis menghemat paling banyak uang bunga dan biaya admin.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Extra Payment Accelerator Simulator */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Simulasi Percepatan Pelunasan (Extra Payment)</h3>
              <p className="text-xs text-slate-500">Berapa anggaran ekstra yang bisa Anda alokasikan setiap bulan?</p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {[200000, 500000, 1000000, 1500000].map((preset) => (
              <button
                key={preset}
                onClick={() => setExtraPayment(preset)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  extraPayment === preset
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                +{formatRupiah(preset).replace(',00', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Custom Input */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Ekstra Bulanan</label>
              <input
                type="number"
                step="50000"
                min="0"
                value={extraPayment}
                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                className="w-full text-base font-extrabold px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              Ditambahkan ke cicilan tagihan prioritas urutan #1.
            </span>
          </div>

          {/* Output: Accelerated Time */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-950 uppercase">Estimasi Waktu Bebas Hutang</span>
              <div className="text-2xl font-extrabold text-emerald-950 mt-1">
                {acceleratedMonths} Bulan
              </div>
            </div>
            <div className="text-xs text-emerald-800 font-semibold mt-2">
              ⚡ Lebih cepat <span className="underline font-bold">{monthsSaved} bulan</span> dibanding pembayaran normal ({maxTenorLeft} bulan).
            </div>
          </div>

          {/* Output: Interest Savings */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-950 uppercase">Estimasi Penghematan Bunga</span>
              <div className="text-2xl font-extrabold text-amber-950 mt-1">
                ~{formatRupiah(estimatedInterestSaved)}
              </div>
            </div>
            <div className="text-xs text-amber-800 font-semibold mt-2">
              💰 Uang yang terselamatkan dari bunga & biaya admin.
            </div>
          </div>

        </div>
      </div>

      {/* Priority Payoff Queue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base">
            Urutan Prioritas Pelunasan ({strategy === 'snowball' ? 'Snowball Queue' : 'Avalanche Queue'})
          </h3>
          <span className="text-xs text-slate-500">
            Fokuskan pembayaran ekstra pada Urutan #1 sampai lunas total!
          </span>
        </div>

        <div className="space-y-3">
          {currentList.map((item, index) => {
            const providerInfo = PROVIDER_META[item.provider];
            const isPriorityOne = index === 0;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPriorityOne
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                    isPriorityOne ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                  }`}>
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${providerInfo.badgeBg}`}>
                        {item.customProviderName || providerInfo.name}
                      </span>
                      {isPriorityOne && (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Target Utama
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>Cicilan: <strong className="text-slate-800">{formatRupiah(item.monthlyInstallment)}/bln</strong></span>
                      <span>•</span>
                      <span>Sisa Tenor: <strong>{item.remainingTenors} bln</strong></span>
                      <span>•</span>
                      <span>Bunga: <strong>{item.interest}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Sisa Pokok Hutang</span>
                  <div className="text-base font-extrabold text-slate-900">
                    {formatRupiah(item.remainingBalance)}
                  </div>
                  {isPriorityOne && extraPayment > 0 && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                      Bayar: {formatRupiah(item.monthlyInstallment + extraPayment)}/bln
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
