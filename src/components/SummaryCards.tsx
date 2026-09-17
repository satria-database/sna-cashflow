import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  ArrowUpRight,
  Building2,
  Layers,
  ArrowDownLeft,
  Coins
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { BankSettlement } from '../types';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  totalPaylaterDueThisMonth: number;
  totalPaylaterPaidThisMonth: number;
  unpaidPaylaterCount: number;
  settlement?: BankSettlement | null;
  settlements?: BankSettlement[];
  onNavigateToPaylater: () => void;
  onNavigateToExpenses: () => void;
  onNavigateToSettlement: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  totalPaylaterDueThisMonth,
  totalPaylaterPaidThisMonth,
  unpaidPaylaterCount,
  settlement,
  settlements = [],
  onNavigateToPaylater,
  onNavigateToExpenses,
  onNavigateToSettlement,
}) => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'latest'>('cumulative');

  const totalCommitment = totalExpense + totalPaylaterDueThisMonth;
  const netCashFlow = totalIncome - totalCommitment;
  const remainingPaylaterToPay = Math.max(0, totalPaylaterDueThisMonth - totalPaylaterPaidThisMonth);

  // Determine active settlements array
  const activeSettlementsList = settlements.length > 0 
    ? settlements 
    : (settlement ? [settlement] : []);

  const totalPeriods = activeSettlementsList.length;
  const latestSettlement = activeSettlementsList[0] || null;

  // Cumulative Calculations across all settlements (e.g. 7 files)
  const cumulativeCredit = activeSettlementsList.reduce((sum, s) => sum + (Number(s.totalCredit) || 0), 0);
  const cumulativeDebit = activeSettlementsList.reduce((sum, s) => sum + (Number(s.totalDebit) || 0), 0);
  const cumulativeNet = cumulativeCredit - cumulativeDebit;
  const cumulativeTransactions = activeSettlementsList.reduce(
    (sum, s) => sum + (s.transactions?.length || s.transactionsCount || 0), 
    0
  );
  const latestEndingBalance = latestSettlement?.endingBalance ?? 0;
  const bankName = latestSettlement?.bankName || 'BNI';

  // Active displayed metrics depending on toggle
  const isCumulativeView = totalPeriods > 1 && viewMode === 'cumulative';
  
  const displayedCredit = isCumulativeView ? cumulativeCredit : (latestSettlement?.totalCredit ?? cumulativeCredit);
  const displayedDebit = isCumulativeView ? cumulativeDebit : (latestSettlement?.totalDebit ?? cumulativeDebit);
  const displayedNet = isCumulativeView ? cumulativeNet : (latestSettlement?.netSettlement ?? cumulativeNet);
  const displayedBalance = latestEndingBalance;
  const displayedTxCount = isCumulativeView 
    ? cumulativeTransactions 
    : (latestSettlement?.transactions?.length || latestSettlement?.transactionsCount || 0);

  // Debt Service Ratio (DSR)
  const dsr = totalIncome > 0 ? (totalPaylaterDueThisMonth / totalIncome) * 100 : 0;

  // DSR Status evaluation
  let dsrStatus = {
    badge: 'Aman & Sehat',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Porsi cicilan di bawah 30% pemasukan. Ideal sesuai standar OJK.',
    icon: CheckCircle2,
  };

  if (dsr > 40) {
    dsrStatus = {
      badge: 'Overlimit (Bahaya)',
      color: 'rose',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      description: 'Porsi cicilan melebihi 40% pemasukan. Hindari menambah paylater baru!',
      icon: ShieldAlert,
    };
  } else if (dsr > 30) {
    dsrStatus = {
      badge: 'Waspada (Batas Maks)',
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Porsi cicilan 30%-40%. Ketatkan pengeluaran tidak mendesak.',
      icon: AlertTriangle,
    };
  }

  const DsrIcon = dsrStatus.icon;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total Pemasukan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(totalIncome)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
          <span>Arus Kas Masuk</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">Bulan Aktif</span>
        </div>
      </div>

      {/* 2. Pengeluaran Rutin */}
      <div 
        onClick={onNavigateToExpenses}
        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Pengeluaran Rutin</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(totalExpense)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
          <span>Kebutuhan & Belanja</span>
          <span className="text-blue-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Detail <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 3. Tagihan Paylater Bulan Ini */}
      <div 
        onClick={onNavigateToPaylater}
        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Tagihan Paylater</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(totalPaylaterDueThisMonth)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {totalPaylaterDueThisMonth === 0 ? (
            <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              0 Tagihan Aktif
            </span>
          ) : unpaidPaylaterCount > 0 ? (
            <span className="text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
              Sisa: {formatRupiah(remainingPaylaterToPay)} ({unpaidPaylaterCount} belum bayar)
            </span>
          ) : (
            <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Semua Lunas Bulan Ini
            </span>
          )}
          <span className="text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Kelola <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 4. Sisa Saldo & Skor Rasio DSR */}
      <div className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
        netCashFlow >= 0 
          ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md' 
          : 'border-rose-200 hover:border-rose-400 hover:shadow-md'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              netCashFlow >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              Sisa Saldo Bersih
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              netCashFlow >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${
            netCashFlow >= 0 ? 'text-slate-900' : 'text-rose-600'
          }`}>
            {formatRupiah(netCashFlow)}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <DsrIcon className={`w-3.5 h-3.5 ${
              dsr > 40 ? 'text-rose-500' : dsr > 30 ? 'text-amber-500' : 'text-emerald-600'
            }`} />
            <span className="text-slate-600 text-[11px]">DSR: <strong className="text-slate-900">{dsr.toFixed(1)}%</strong></span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] ${
            dsr > 40 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : dsr > 30 
              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {dsrStatus.badge}
          </span>
        </div>
      </div>

      {/* 5. Bank Settlement Grand Total Highlight Widget (Green & White Theme) */}
      {activeSettlementsList.length > 0 && (
        <div 
          className="sm:col-span-2 lg:col-span-4 bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          onClick={onNavigateToSettlement}
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    SETTLEMENT BANK ({bankName})
                  </span>
                  <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <strong className="text-slate-900">{totalPeriods} Dokumen Laporan</strong> ({displayedTxCount} Transaksi)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isCumulativeView 
                    ? `Ringkasan Total Keseluruhan dari Seluruh Dokumen Rekening Terunggah` 
                    : `Periode: ${latestSettlement?.period || 'Terbaru'}`}
                </p>
              </div>
            </div>

            {/* View Mode Toggle Button & Direct Link */}
            <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
              {totalPeriods > 1 && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setViewMode('cumulative')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      viewMode === 'cumulative' 
                        ? 'bg-[#007a52] text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Jumlah Keseluruhan ({totalPeriods})
                  </button>
                  <button
                    onClick={() => setViewMode('latest')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      viewMode === 'latest' 
                        ? 'bg-[#007a52] text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Periode Terakhir
                  </button>
                </div>
              )}

              <button
                onClick={onNavigateToSettlement}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors shrink-0 cursor-pointer"
              >
                <span>Buka Mutasi & PDF</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metric KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
            {/* Saldo Akhir Terkini */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-600" />
                  Saldo Akhir Terkini
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {formatRupiah(displayedBalance)}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1 truncate">
                {latestSettlement?.period || 'Laporan Terakhir'}
              </div>
            </div>

            {/* Total Mutasi Masuk (Kredit) */}
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/70">
              <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                  {isCumulativeView ? 'Total Mutasi Masuk (+)' : 'Mutasi Masuk (+)'}
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-700 tracking-tight">
                +{formatRupiah(displayedCredit)}
              </div>
              <div className="text-[10.5px] text-emerald-800/80 mt-1">
                Kredit Keseluruhan
              </div>
            </div>

            {/* Total Mutasi Keluar (Debit) */}
            <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/70">
              <div className="flex items-center justify-between text-[11px] text-rose-800 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-rose-600" />
                  {isCumulativeView ? 'Total Mutasi Keluar (-)' : 'Mutasi Keluar (-)'}
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-rose-600 tracking-tight">
                -{formatRupiah(displayedDebit)}
              </div>
              <div className="text-[10.5px] text-rose-800/80 mt-1">
                Debit Keseluruhan
              </div>
            </div>

            {/* Net Mutasi Keseluruhan */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold mb-1">
                <span>{isCumulativeView ? 'Net Mutasi Total' : 'Net Periode'}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                  displayedNet >= 0 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  {displayedNet >= 0 ? 'Surplus' : 'Defisit'}
                </span>
              </div>
              <div className={`text-base sm:text-lg font-extrabold tracking-tight ${
                displayedNet >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {displayedNet >= 0 ? '+' : ''}{formatRupiah(displayedNet)}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1">
                {displayedNet >= 0 ? 'Pemasukan > Pengeluaran' : 'Pengeluaran > Pemasukan'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

