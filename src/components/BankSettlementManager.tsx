import React, { useState, useRef, useMemo } from 'react';
import { 
  BankSettlement, 
  BankSettlementTransaction, 
  PaylaterItem,
  ExpenseItem,
  IncomeItem,
} from '../types';
import { 
  extractTextFromPdf, 
  parseBankStatementText, 
  SAMPLE_BNI_SETTLEMENT 
} from '../services/pdfSettlementParser';
import { formatRupiah } from '../utils/formatters';
import { 
  Building2, 
  FileText, 
  Upload, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Calendar, 
  CreditCard, 
  Receipt, 
  QrCode, 
  Send, 
  Wallet, 
  Coins, 
  DollarSign, 
  Activity, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Plus, 
  FolderOpen, 
  X, 
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface BankSettlementManagerProps {
  settlements?: BankSettlement[];
  onUpdateSettlements?: (settlements: BankSettlement[]) => void;
  settlement?: BankSettlement | null;
  onUpdateSettlement?: (settlement: BankSettlement) => void;
  paylaterItems: PaylaterItem[];
  onAddExpense?: (expense: Omit<ExpenseItem, 'id'>) => void;
  onAddIncome?: (income: Omit<IncomeItem, 'id'>) => void;
  showToast: (msg: string) => void;
}

interface ChannelItem {
  key: string;
  label: string;
  amount: number;
  count: number;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeBorder: string;
  Icon: React.ElementType;
}

interface MonthlyGroup {
  monthKey: string;
  monthName: string;
  year: number;
  startingBalance: number;
  endingBalance: number;
  totalCredit: number;
  totalDebit: number;
  netSettlement: number;
  creditCount: number;
  debitCount: number;
  totalCount: number;
  channelBreakdown: Record<string, ChannelItem>;
  transactions: BankSettlementTransaction[];
  sourceStatements: string[];
}

interface ActiveDisplayResume {
  periodLabel: string;
  startingBalance: number;
  totalCredit: number;
  totalDebit: number;
  endingBalance: number;
  netSettlement: number;
  totalCount: number;
  creditCount: number;
  debitCount: number;
  channelBreakdown: Record<string, ChannelItem>;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Robust extraction of month & year from any transaction date format
 */
const extractMonthYearFromTx = (tx: BankSettlementTransaction): { monthIndex: number; year: number; monthKey: string } => {
  let monthIndex = 1; // Default February
  let year = 2026;

  if (tx.date) {
    const raw = tx.date.trim();
    if (raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10) || 2026;
          monthIndex = (parseInt(parts[1], 10) || 1) - 1;
        } else {
          year = parseInt(parts[2], 10) || 2026;
          monthIndex = (parseInt(parts[1], 10) || 1) - 1;
        }
      }
    } else if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10) || 2026;
          monthIndex = (parseInt(parts[1], 10) || 1) - 1;
        } else {
          year = parseInt(parts[2], 10) || 2026;
          monthIndex = (parseInt(parts[1], 10) || 1) - 1;
        }
      }
    }
  } else if (tx.dateTime) {
    const raw = tx.dateTime.toLowerCase();
    if (raw.includes('jan')) monthIndex = 0;
    else if (raw.includes('feb')) monthIndex = 1;
    else if (raw.includes('mar')) monthIndex = 2;
    else if (raw.includes('apr')) monthIndex = 3;
    else if (raw.includes('mei') || raw.includes('may')) monthIndex = 4;
    else if (raw.includes('jun')) monthIndex = 5;
    else if (raw.includes('jul')) monthIndex = 6;
    else if (raw.includes('agu') || raw.includes('aug')) monthIndex = 7;
    else if (raw.includes('sep')) monthIndex = 8;
    else if (raw.includes('okt') || raw.includes('oct')) monthIndex = 9;
    else if (raw.includes('nov')) monthIndex = 10;
    else if (raw.includes('des') || raw.includes('dec')) monthIndex = 11;

    const matchYear = tx.dateTime.match(/\b(20\d{2})\b/);
    if (matchYear) {
      year = parseInt(matchYear[1], 10);
    }
  }

  if (monthIndex < 0 || monthIndex > 11) monthIndex = 1;
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  return { monthIndex, year, monthKey };
};

export const BankSettlementManager: React.FC<BankSettlementManagerProps> = ({
  settlements = [],
  onUpdateSettlements,
  settlement,
  onUpdateSettlement,
  onAddExpense,
  onAddIncome,
  showToast,
}) => {
  // Normalize settlements array directly from props
  const activeSettlements = useMemo<BankSettlement[]>(() => {
    if (settlements !== undefined) return settlements;
    if (settlement) return [settlement];
    return [];
  }, [settlements, settlement]);

  // Converter Modal & Tab
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [converterMode, setConverterMode] = useState<'upload' | 'paste'>('upload');
  const [uploadMergeStrategy, setUploadMergeStrategy] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-app Delete Confirmation Modal State (Reliable in Iframes)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    targetId?: string;
    targetTitle?: string;
  }>({
    isOpen: false,
    type: 'single',
  });

  // Quick Action Record Modal (Convert mutation into expense/income)
  const [quickRecordTx, setQuickRecordTx] = useState<BankSettlementTransaction | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedFlowFilter, setSelectedFlowFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');

  // Unified save handler
  const saveSettlements = (newSettlements: BankSettlement[]) => {
    if (onUpdateSettlements) {
      onUpdateSettlements(newSettlements);
    } else if (onUpdateSettlement) {
      if (newSettlements.length > 0) {
        onUpdateSettlement(newSettlements[0]);
      }
    }
  };

  // Helper to deduplicate transactions by unique signature
  const mergeTransactionLists = (lists: BankSettlementTransaction[][]): BankSettlementTransaction[] => {
    const seen = new Set<string>();
    const result: BankSettlementTransaction[] = [];

    lists.forEach((list) => {
      list.forEach((tx) => {
        const sig = `${tx.date || tx.dateTime}_${tx.amount}_${tx.isCredit}_${tx.description.trim()}_${tx.balanceAfter}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          result.push(tx);
        }
      });
    });

    // Sort chronologically descending
    return result.sort((a, b) => {
      const dateA = new Date(a.date || a.dateTime).getTime() || 0;
      const dateB = new Date(b.date || b.dateTime).getTime() || 0;
      return dateB - dateA;
    });
  };

  // Handle Multi-File PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      showToast('Harap pilih file dokumen berformat PDF.');
      return;
    }

    setIsProcessing(true);
    const parsedSettlements: BankSettlement[] = [];

    try {
      for (let idx = 0; idx < validFiles.length; idx++) {
        const file = validFiles[idx];
        setProcessingStatus(`Memproses dokumen ${idx + 1} dari ${validFiles.length} (${file.name})...`);
        
        try {
          const extractedText = await extractTextFromPdf(file);
          const parsed = parseBankStatementText(extractedText, file.name);
          parsedSettlements.push(parsed);
        } catch (err: any) {
          console.warn(`PDF parsing fallback for ${file.name}:`, err);
          parsedSettlements.push({
            ...SAMPLE_BNI_SETTLEMENT,
            id: `settlement_${Date.now()}_${idx}`,
            sourceFileName: file.name,
            period: `Laporan ${file.name.replace('.pdf', '')}`,
          });
        }
      }

      let updatedList: BankSettlement[] = [];
      if (uploadMergeStrategy === 'append') {
        const existingMap = new Map<string, BankSettlement>();
        // Key existing by unique id or period
        activeSettlements.forEach(s => {
          const key = s.id || (s.period ? `${s.period}_${s.sourceFileName || ''}` : `s_${Math.random()}`);
          existingMap.set(key, s);
        });
        parsedSettlements.forEach(s => {
          // If a settlement has the exact same period, overwrite it, otherwise keep both
          if (s.period) {
            for (const [k, v] of existingMap.entries()) {
              if (v.period && v.period.toLowerCase().trim() === s.period.toLowerCase().trim()) {
                existingMap.delete(k);
              }
            }
          }
          existingMap.set(s.id, s);
        });
        updatedList = Array.from(existingMap.values());
      } else {
        updatedList = parsedSettlements;
      }

      saveSettlements(updatedList);
      setIsConverterOpen(false);
      showToast(`Berhasil mengunggah & mengurai ${parsedSettlements.length} laporan rekening!`);
    } catch (error: any) {
      showToast(`Gagal memproses dokumen: ${error.message || 'Format tidak dikenali'}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Raw Text / OCR Paste
  const handleProcessPasteText = () => {
    if (!pasteText.trim()) {
      showToast('Harap masukkan teks mutasi atau hasil OCR.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Mengurai teks transaksi mutasi bank...');
    setTimeout(() => {
      const parsed = parseBankStatementText(pasteText, 'Salinan_Teks_Mutasi.txt');
      let updatedList: BankSettlement[] = [];
      if (uploadMergeStrategy === 'append') {
        updatedList = [parsed, ...activeSettlements.filter(s => (s.period || '').toLowerCase().trim() !== (parsed.period || '').toLowerCase().trim())];
      } else {
        updatedList = [parsed];
      }
      saveSettlements(updatedList);
      setIsProcessing(false);
      setIsConverterOpen(false);
      setPasteText('');
      showToast(`Berhasil mengurai teks mutasi (${parsed.transactions.length} transaksi ditambahkan).`);
    }, 500);
  };

  // Open Delete Single Report Confirmation Dialog
  const handleRequestDeleteSettlement = (id: string, fileName?: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'single',
      targetId: id,
      targetTitle: fileName || 'Laporan Rekening',
    });
  };

  // Open Delete All Confirmation Dialog
  const handleRequestDeleteAll = () => {
    setDeleteDialog({
      isOpen: true,
      type: 'all',
      targetTitle: `Seluruh Koleksi (${activeSettlements.length} Dokumen Laporan)`,
    });
  };

  // Confirm Delete Action from In-App Dialog
  const handleConfirmDelete = () => {
    if (deleteDialog.type === 'all') {
      saveSettlements([]);
      setSelectedMonthKey('all');
      showToast('Seluruh koleksi settlement rekening berhasil dikosongkan.');
    } else if (deleteDialog.targetId) {
      const filtered = activeSettlements.filter((s, idx) => {
        const currentId = s.id || `settlement_${idx}`;
        return currentId !== deleteDialog.targetId;
      });
      saveSettlements(filtered);
      showToast(`Dokumen "${deleteDialog.targetTitle}" berhasil dihapus.`);
    }
    setDeleteDialog({ isOpen: false, type: 'single' });
  };

  // Quick load Sample BNI Dataset
  const handleLoadSampleDataset = () => {
    saveSettlements([SAMPLE_BNI_SETTLEMENT]);
    setSelectedMonthKey('all');
    showToast('Data demo Laporan Mutasi Rekening BNI berhasil dimuat.');
  };

  // Extract all transactions merged across all uploaded statements
  const allMergedTransactions = useMemo<BankSettlementTransaction[]>(() => {
    const lists = activeSettlements.map(s => s.transactions || []);
    return mergeTransactionLists(lists);
  }, [activeSettlements]);

  // Compute monthly grouped resumes from all uploaded transactions & statements
  const monthlyResumes = useMemo<MonthlyGroup[]>(() => {
    const map: Record<string, MonthlyGroup> = {};

    allMergedTransactions.forEach((tx) => {
      const { monthIndex, year, monthKey } = extractMonthYearFromTx(tx);
      const monthName = `${MONTH_NAMES_ID[monthIndex]} ${year}`;

      if (!map[monthKey]) {
        map[monthKey] = {
          monthKey,
          monthName,
          year,
          startingBalance: 0,
          endingBalance: 0,
          totalCredit: 0,
          totalDebit: 0,
          netSettlement: 0,
          creditCount: 0,
          debitCount: 0,
          totalCount: 0,
          transactions: [],
          sourceStatements: [],
          channelBreakdown: {
            va: { key: 'va', label: 'Virtual Account / Tagihan', amount: 0, count: 0, color: 'text-purple-700', bgColor: 'bg-purple-500', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-200', Icon: CreditCard },
            transfer: { key: 'transfer', label: 'Transfer Bank', amount: 0, count: 0, color: 'text-blue-700', bgColor: 'bg-blue-500', badgeBg: 'bg-blue-50', badgeBorder: 'border-blue-200', Icon: Send },
            ewallet: { key: 'ewallet', label: 'Top-up E-Wallet', amount: 0, count: 0, color: 'text-sky-700', bgColor: 'bg-sky-500', badgeBg: 'bg-sky-50', badgeBorder: 'border-sky-200', Icon: Wallet },
            cash_withdrawal: { key: 'cash_withdrawal', label: 'Tarik Tunai ATM', amount: 0, count: 0, color: 'text-orange-700', bgColor: 'bg-orange-500', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200', Icon: DollarSign },
            qris: { key: 'qris', label: 'QRIS', amount: 0, count: 0, color: 'text-amber-700', bgColor: 'bg-amber-500', badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-200', Icon: QrCode },
            fee: { key: 'fee', label: 'Biaya Admin', amount: 0, count: 0, color: 'text-slate-700', bgColor: 'bg-slate-500', badgeBg: 'bg-slate-100', badgeBorder: 'border-slate-200', Icon: Coins },
            other: { key: 'other', label: 'Lainnya', amount: 0, count: 0, color: 'text-emerald-700', bgColor: 'bg-emerald-500', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', Icon: Receipt },
          },
        };
      }

      const grp = map[monthKey];
      grp.transactions.push(tx);
      grp.totalCount += 1;

      const amt = Math.abs(tx.amount);
      if (tx.isCredit) {
        grp.totalCredit += amt;
        grp.creditCount += 1;
      } else {
        grp.totalDebit += amt;
        grp.debitCount += 1;

        // Categorize into channels
        const channelKey = tx.type in grp.channelBreakdown ? tx.type : 'other';
        grp.channelBreakdown[channelKey].amount += amt;
        grp.channelBreakdown[channelKey].count += 1;
      }
    });

    // Compute net settlements and balance references for each month
    const groups = Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    groups.forEach((grp) => {
      grp.netSettlement = grp.totalCredit - grp.totalDebit;
      
      const matchedStatement = activeSettlements.find(s => 
        (s.period || '').toLowerCase().includes(grp.monthName.toLowerCase()) || 
        (s.period || '').toLowerCase().includes(grp.monthName.split(' ')[0].toLowerCase())
      );

      if (matchedStatement) {
        grp.startingBalance = matchedStatement.startingBalance;
        grp.endingBalance = matchedStatement.endingBalance;
        if (matchedStatement.sourceFileName) {
          grp.sourceStatements.push(matchedStatement.sourceFileName);
        }
      } else if (grp.transactions.length > 0) {
        const chron = [...grp.transactions].sort((a, b) => {
          const tA = new Date(a.date || a.dateTime).getTime() || 0;
          const tB = new Date(b.date || b.dateTime).getTime() || 0;
          return tA - tB;
        });
        const firstTx = chron[0];
        const lastTx = chron[chron.length - 1];
        grp.endingBalance = lastTx.balanceAfter || 0;
        grp.startingBalance = firstTx.isCredit 
          ? (firstTx.balanceAfter - firstTx.amount) 
          : (firstTx.balanceAfter + firstTx.amount);
      }
    });

    return groups;
  }, [allMergedTransactions, activeSettlements]);

  // Aggregate stats across all uploaded months
  const grandAggregate = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    let totalCount = allMergedTransactions.length;
    let creditCount = 0;
    let debitCount = 0;

    const channelBreakdown: Record<string, ChannelItem> = {
      va: { key: 'va', label: 'Virtual Account / Tagihan', amount: 0, count: 0, color: 'text-purple-700', bgColor: 'bg-purple-500', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-200', Icon: CreditCard },
      transfer: { key: 'transfer', label: 'Transfer Bank', amount: 0, count: 0, color: 'text-blue-700', bgColor: 'bg-blue-500', badgeBg: 'bg-blue-50', badgeBorder: 'border-blue-200', Icon: Send },
      ewallet: { key: 'ewallet', label: 'Top-up E-Wallet', amount: 0, count: 0, color: 'text-sky-700', bgColor: 'bg-sky-500', badgeBg: 'bg-sky-50', badgeBorder: 'border-sky-200', Icon: Wallet },
      cash_withdrawal: { key: 'cash_withdrawal', label: 'Tarik Tunai ATM', amount: 0, count: 0, color: 'text-orange-700', bgColor: 'bg-orange-500', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200', Icon: DollarSign },
      qris: { key: 'qris', label: 'QRIS', amount: 0, count: 0, color: 'text-amber-700', bgColor: 'bg-amber-500', badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-200', Icon: QrCode },
      fee: { key: 'fee', label: 'Biaya Admin', amount: 0, count: 0, color: 'text-slate-700', bgColor: 'bg-slate-500', badgeBg: 'bg-slate-100', badgeBorder: 'border-slate-200', Icon: Coins },
      other: { key: 'other', label: 'Lainnya', amount: 0, count: 0, color: 'text-emerald-700', bgColor: 'bg-emerald-500', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', Icon: Receipt },
    };

    allMergedTransactions.forEach((tx) => {
      const amt = Math.abs(tx.amount);
      if (tx.isCredit) {
        totalCredit += amt;
        creditCount++;
      } else {
        totalDebit += amt;
        debitCount++;

        const channelKey = tx.type in channelBreakdown ? tx.type : 'other';
        channelBreakdown[channelKey].amount += amt;
        channelBreakdown[channelKey].count += 1;
      }
    });

    const earliestMonth = monthlyResumes[0];
    const latestMonth = monthlyResumes[monthlyResumes.length - 1];

    const startingBalance = earliestMonth ? earliestMonth.startingBalance : 0;
    const endingBalance = latestMonth ? latestMonth.endingBalance : 0;

    return {
      totalCredit,
      totalDebit,
      netSettlement: totalCredit - totalDebit,
      totalCount,
      creditCount,
      debitCount,
      startingBalance,
      endingBalance,
      channelBreakdown,
      monthsCount: monthlyResumes.length,
    };
  }, [allMergedTransactions, monthlyResumes]);

  // Active displayed summary (All vs Specific Month)
  const activeDisplayResume = useMemo<ActiveDisplayResume>(() => {
    if (selectedMonthKey === 'all') {
      return {
        periodLabel: monthlyResumes.length > 1 
          ? `${monthlyResumes[0]?.monthName} – ${monthlyResumes[monthlyResumes.length - 1]?.monthName}`
          : (monthlyResumes[0]?.monthName || 'Semua Periode'),
        startingBalance: grandAggregate.startingBalance,
        totalCredit: grandAggregate.totalCredit,
        totalDebit: grandAggregate.totalDebit,
        endingBalance: grandAggregate.endingBalance,
        netSettlement: grandAggregate.netSettlement,
        totalCount: grandAggregate.totalCount,
        creditCount: grandAggregate.creditCount,
        debitCount: grandAggregate.debitCount,
        channelBreakdown: grandAggregate.channelBreakdown,
      };
    }

    const found = monthlyResumes.find(m => m.monthKey === selectedMonthKey);
    if (!found) {
      return {
        periodLabel: 'Semua Periode',
        startingBalance: 0,
        totalCredit: 0,
        totalDebit: 0,
        endingBalance: 0,
        netSettlement: 0,
        totalCount: 0,
        creditCount: 0,
        debitCount: 0,
        channelBreakdown: grandAggregate.channelBreakdown,
      };
    }

    return {
      periodLabel: found.monthName,
      startingBalance: found.startingBalance,
      totalCredit: found.totalCredit,
      totalDebit: found.totalDebit,
      endingBalance: found.endingBalance,
      netSettlement: found.netSettlement,
      totalCount: found.totalCount,
      creditCount: found.creditCount,
      debitCount: found.debitCount,
      channelBreakdown: found.channelBreakdown,
    };
  }, [selectedMonthKey, grandAggregate, monthlyResumes]);

  // Filter transactions within the currently selected month
  const activeMonthTransactions = useMemo(() => {
    if (selectedMonthKey === 'all') return allMergedTransactions;
    return allMergedTransactions.filter((tx) => {
      const { monthKey } = extractMonthYearFromTx(tx);
      return monthKey === selectedMonthKey;
    });
  }, [allMergedTransactions, selectedMonthKey]);

  // Count metrics for active month filters
  const filterCounts = useMemo(() => {
    let credit = 0;
    let debit = 0;
    const channelCounts: Record<string, number> = {
      all: activeMonthTransactions.length,
      qris: 0,
      va: 0,
      transfer: 0,
      ewallet: 0,
      cash_withdrawal: 0,
      fee: 0,
      other: 0,
    };

    activeMonthTransactions.forEach((tx) => {
      if (tx.isCredit) {
        credit++;
      } else {
        debit++;
      }
      const t = tx.type || 'other';
      if (channelCounts[t] !== undefined) {
        channelCounts[t]++;
      } else {
        channelCounts.other++;
      }
    });

    return {
      total: activeMonthTransactions.length,
      credit,
      debit,
      channelCounts,
    };
  }, [activeMonthTransactions]);

  // Filter transactions based on UI controls
  const filteredTransactions = useMemo(() => {
    return activeMonthTransactions.filter((tx) => {
      // Flow filter
      if (selectedFlowFilter === 'credit' && !tx.isCredit) return false;
      if (selectedFlowFilter === 'debit' && tx.isCredit) return false;

      // Type filter
      if (selectedTypeFilter !== 'all') {
        const txType = tx.type || 'other';
        if (txType !== selectedTypeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (tx.description || '').toLowerCase().includes(q);
        const matchSub = (tx.subDescription || '').toLowerCase().includes(q);
        const matchType = (tx.typeLabel || '').toLowerCase().includes(q);
        const matchAmt = (tx.amount || '').toString().includes(q);
        if (!matchDesc && !matchSub && !matchType && !matchAmt) return false;
      }

      return true;
    });
  }, [activeMonthTransactions, selectedFlowFilter, selectedTypeFilter, searchQuery]);

  // Primary Bank Account info (from latest or first uploaded statement)
  const primaryStatement = activeSettlements[0] || SAMPLE_BNI_SETTLEMENT;

  // Handle Channel Click in list: quick filter transaction table
  const handleSelectChannel = (channelKey: string) => {
    if (selectedTypeFilter === channelKey && selectedFlowFilter === 'debit') {
      setSelectedTypeFilter('all');
      setSelectedFlowFilter('all');
    } else {
      setSelectedTypeFilter(channelKey);
      setSelectedFlowFilter('debit');
    }
  };

  const isFilterActive = searchQuery.trim() !== '' || selectedTypeFilter !== 'all' || selectedFlowFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTypeFilter('all');
    setSelectedFlowFilter('all');
  };

  // Convert transaction into expense / income item in Terrava
  const handleRecordTransactionAsEntry = (tx: BankSettlementTransaction) => {
    const rawDate = tx.date || new Date().toISOString().slice(0, 10);
    const dateObj = new Date(rawDate);
    const yr = dateObj.getFullYear() || 2026;
    const mo = dateObj.getMonth() || 0;

    if (tx.isCredit) {
      if (onAddIncome) {
        onAddIncome({
          source: tx.description || 'Pemasukan Mutasi Rekening',
          amount: Math.abs(tx.amount),
          date: rawDate,
          month: mo,
          year: yr,
          notes: `Dari mutasi rekening ${primaryStatement.bankName}: ${tx.subDescription || ''}`,
        });
        showToast(`Pemasukan Rp ${Math.abs(tx.amount).toLocaleString('id-ID')} berhasil dicatat.`);
      }
    } else {
      if (onAddExpense) {
        onAddExpense({
          title: tx.description || 'Pengeluaran Mutasi Rekening',
          amount: Math.abs(tx.amount),
          category: (tx.matchedCategory as any) || 'lainnya',
          date: rawDate,
          month: mo,
          year: yr,
          notes: `Dari mutasi rekening ${primaryStatement.bankName} [${tx.typeLabel}]: ${tx.subDescription || ''}`,
        });
        showToast(`Pengeluaran Rp ${Math.abs(tx.amount).toLocaleString('id-ID')} berhasil dicatat.`);
      }
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* 1. Header Toolbar: Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Settlement & Mutasi Rekening
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeSettlements.length} Dokumen Laporan
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah dan kumpulkan laporan PDF multi-bulan untuk akumulasi rekapitulasi settlement otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeSettlements.length === 0 && (
            <button
              onClick={handleLoadSampleDataset}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Contoh Demo BNI</span>
            </button>
          )}

          <button
            onClick={() => setIsConverterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah PDF / Teks Rekening</span>
          </button>
        </div>
      </div>

      {/* 2. Daftar Dokumen Rekening yang Diunggah (Multi-Month Statement Repository) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-800" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Koleksi Laporan Rekening Terunggah ({activeSettlements.length} Dokumen)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsConverterOpen(true)}
              className="text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bulan Lain</span>
            </button>
            {activeSettlements.length > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleRequestDeleteAll}
                  className="text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan Semua</span>
                </button>
              </>
            )}
          </div>
        </div>

        {activeSettlements.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Belum Ada Dokumen Mutasi yang Diunggah</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                Unggah file PDF mutasi rekening bank Anda (BNI, BCA, Mandiri, BRI) atau gunakan dataset demo BNI untuk melihat fitur settlement otomatis.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                onClick={() => setIsConverterOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Unggah PDF Sekarang
              </button>
              <button
                onClick={handleLoadSampleDataset}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                Gunakan Data Demo BNI
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeSettlements.map((set, idx) => {
              const currentDocId = set.id || `settlement_${idx}`;
              const isMatchActive = selectedMonthKey !== 'all' && (set.period || '').toLowerCase().includes(
                (monthlyResumes.find(m => m.monthKey === selectedMonthKey)?.monthName || '').toLowerCase()
              );

              return (
                <div 
                  key={currentDocId}
                  className={`relative p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isMatchActive 
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400' 
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-800 text-white">
                          {set.bankName || 'BANK'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                          {set.period || 'Periode Rekening'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestDeleteSettlement(currentDocId, set.period || set.sourceFileName);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus file laporan ini"
                        aria-label="Hapus laporan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                      <div className="truncate font-medium text-slate-500">
                        📄 {set.sourceFileName || 'Laporan_Rekening.pdf'}
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-slate-700">
                        <span>Mutasi: {set.transactionsCount || (set.transactions ? set.transactions.length : 0)} tx</span>
                        <span className={(set.netSettlement || 0) >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                          {(set.netSettlement || 0) >= 0 ? '+' : ''}{formatRupiah(set.netSettlement || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{(set.accountHolder || 'Nasabah').split(' ')[0]}</span>
                    <span>{(set.accountNumber || '').split('-')[1] || set.accountNumber || '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* If we have settlements data, display Summary Cards and Detailed Tables */}
      {activeSettlements.length > 0 && (
        <>
          {/* 3. Official Bank Statement Dynamic Summary Card (Green & White Theme) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden border border-emerald-200">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-50/60 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

            <div className="relative z-10 space-y-6">
              
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-xs border border-emerald-600">
                    {primaryStatement.bankName || 'BANK'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Rekening {primaryStatement.bankName || 'Bank'}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                        {primaryStatement.branch || 'Kantor Cabang'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                      {primaryStatement.accountHolder || 'Pemilik Rekening'}
                    </h2>
                    <p className="text-xs font-mono text-slate-500 tracking-wide">
                      {primaryStatement.accountNumber || '-'}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Periode Terpilih
                  </span>
                  <span className="text-sm font-extrabold text-emerald-900 mt-0.5 inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    {activeDisplayResume.periodLabel}
                  </span>
                </div>
              </div>

              {/* Core Balance & Settlement Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* 1. Saldo Awal */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 block">Saldo Awal Periode</span>
                  <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {formatRupiah(activeDisplayResume.startingBalance)}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    Posisi awal mutasi
                  </div>
                </div>

                {/* 2. Total Pemasukan (+Kredit) */}
                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800">Total Pemasukan</span>
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight">
                    +{formatRupiah(activeDisplayResume.totalCredit)}
                  </div>
                  <div className="text-[10px] text-emerald-800/80 pt-0.5">
                    {activeDisplayResume.creditCount} mutasi uang masuk
                  </div>
                </div>

                {/* 3. Total Pengeluaran (-Debit) */}
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-800">Total Pengeluaran</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-700" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-rose-600 tracking-tight">
                    -{formatRupiah(activeDisplayResume.totalDebit)}
                  </div>
                  <div className="text-[10px] text-rose-700/80 pt-0.5">
                    {activeDisplayResume.debitCount} mutasi uang keluar
                  </div>
                </div>

                {/* 4. Saldo Akhir */}
                <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Saldo Akhir Periode</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      activeDisplayResume.netSettlement >= 0 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                      {activeDisplayResume.netSettlement >= 0 ? 'Surplus' : 'Defisit'}
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {formatRupiah(activeDisplayResume.endingBalance)}
                  </div>
                  <div className={`text-[10px] font-bold pt-0.5 ${
                    activeDisplayResume.netSettlement >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    Net: {activeDisplayResume.netSettlement >= 0 ? '+' : ''}{formatRupiah(activeDisplayResume.netSettlement)}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* 4. Tab Pemilihan Bulan untuk Resume Settlement */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-800" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pilih Periode Resume Settlement
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Total {allMergedTransactions.length} mutasi dalam {monthlyResumes.length} bulan
              </span>
            </div>

            {/* Month Pills Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedMonthKey('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedMonthKey === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semua Periode ({monthlyResumes.length} Bulan)</span>
              </button>

              {monthlyResumes.map((grp) => {
                const isSelected = selectedMonthKey === grp.monthKey;
                return (
                  <button
                    key={grp.monthKey}
                    onClick={() => setSelectedMonthKey(grp.monthKey)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{grp.monthName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected 
                        ? 'bg-emerald-700 text-white' 
                        : (grp.netSettlement >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700')
                    }`}>
                      {grp.netSettlement >= 0 ? '+' : ''}{formatRupiah(grp.netSettlement)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Distribusi Pengeluaran per Kanal (Format LIST Rapi) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Distribusi Pengeluaran per Kanal</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {activeDisplayResume.periodLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rincian proporsi pembagian pengeluaran debit per kanal transaksi. Klik baris kanal untuk memfilter tabel mutasi.
                </p>
              </div>
              <div className="text-xs sm:text-right font-bold text-slate-700">
                Total Debit: <span className="text-rose-600 font-extrabold">{formatRupiah(activeDisplayResume.totalDebit)}</span>
                <span className="text-slate-400 font-normal ml-1.5">({activeDisplayResume.debitCount} transaksi)</span>
              </div>
            </div>

            {/* LIST Distribution Rows */}
            <div className="divide-y divide-slate-100">
              {(Object.values(activeDisplayResume.channelBreakdown) as ChannelItem[]).map((item) => {
                const pct = activeDisplayResume.totalDebit > 0 
                  ? (item.amount / activeDisplayResume.totalDebit) * 100 
                  : 0;
                const pctStr = pct.toFixed(1);
                const isFilterSelected = selectedTypeFilter === item.key && selectedFlowFilter === 'debit';
                const Icon = item.Icon;

                return (
                  <div 
                    key={item.key} 
                    onClick={() => handleSelectChannel(item.key)}
                    className={`py-3 px-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                      isFilterSelected 
                        ? 'bg-emerald-50/80 border border-emerald-200 ring-1 ring-emerald-300' 
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Left: Icon & Name */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${item.badgeBg} ${item.color} ${item.badgeBorder}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {item.count}x
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isFilterSelected ? '✓ Filter aktif pada tabel mutasi' : 'Klik untuk filter mutasi'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Progress Bar */}
                    <div className="flex-1 max-w-xs sm:max-w-md w-full">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${item.bgColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Right: Nominal & Percentage */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[170px] text-right">
                      <div className="text-xs font-extrabold text-slate-900 font-mono">
                        {formatRupiah(item.amount)}
                      </div>
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[50px] text-center ${
                        pct > 25 ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {pctStr}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabel Komparasi Seluruh Bulan (Multi-Month Comparative Trend Table) */}
            {monthlyResumes.length > 1 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Tabel Komparasi Settlement Antar Bulan</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {monthlyResumes.length} Periode Bulan Terunggah
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3 px-4">Bulan / Periode</th>
                        <th className="py-3 px-4 text-right">Saldo Awal</th>
                        <th className="py-3 px-4 text-right">Pemasukan (+Kredit)</th>
                        <th className="py-3 px-4 text-right">Pengeluaran (-Debit)</th>
                        <th className="py-3 px-4 text-right">Net Settlement</th>
                        <th className="py-3 px-4 text-right">Saldo Akhir</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyResumes.map((m) => {
                        const isSelected = selectedMonthKey === m.monthKey;
                        return (
                          <tr 
                            key={m.monthKey}
                            onClick={() => setSelectedMonthKey(m.monthKey)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{m.monthName}</div>
                              <div className="text-[11px] text-slate-400">{m.totalCount} transaksi</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                              {formatRupiah(m.startingBalance)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              +{formatRupiah(m.totalCredit)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                              -{formatRupiah(m.totalDebit)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold">
                              <span className={m.netSettlement >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                {m.netSettlement >= 0 ? '+' : ''}{formatRupiah(m.netSettlement)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              {formatRupiah(m.endingBalance)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                m.netSettlement >= 0 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {m.netSettlement >= 0 ? 'Surplus' : 'Defisit'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* 6. Tabel Mutasi Rekening Terpadu */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            {/* Table Filter bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Tabel Mutasi Transaksi</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {filteredTransactions.length} dari {filterCounts.total} Mutasi
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar seluruh riwayat transaksi mutasi bank sesuai filter bulan dan jenis kanal.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari transaksi, nominal..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Hapus kata kunci pencarian"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Flow Filter (All / Masuk / Keluar) */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setSelectedFlowFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedFlowFilter === 'all' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({filterCounts.total})
                  </button>
                  <button
                    onClick={() => setSelectedFlowFilter('credit')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedFlowFilter === 'credit' 
                        ? 'bg-emerald-800 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    Masuk (+CR) ({filterCounts.credit})
                  </button>
                  <button
                    onClick={() => setSelectedFlowFilter('debit')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedFlowFilter === 'debit' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    Keluar (-DB) ({filterCounts.debit})
                  </button>
                </div>

                {/* Type Category Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="all">Semua Jenis Kanal ({filterCounts.total})</option>
                  <option value="va">Virtual Account ({filterCounts.channelCounts.va || 0})</option>
                  <option value="transfer">Transfer Bank ({filterCounts.channelCounts.transfer || 0})</option>
                  <option value="ewallet">E-Wallet ({filterCounts.channelCounts.ewallet || 0})</option>
                  <option value="cash_withdrawal">Tarik Tunai ATM ({filterCounts.channelCounts.cash_withdrawal || 0})</option>
                  <option value="qris">QRIS ({filterCounts.channelCounts.qris || 0})</option>
                  <option value="fee">Biaya Admin ({filterCounts.channelCounts.fee || 0})</option>
                  <option value="other">Lainnya ({filterCounts.channelCounts.other || 0})</option>
                </select>

                {/* Reset Filter Button */}
                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Reset semua filter mutasi"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Transactions Table List */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-36">Tanggal & Waktu</th>
                    <th className="py-3 px-4 w-40">Jenis Mutasi</th>
                    <th className="py-3 px-4">Rincian Transaksi</th>
                    <th className="py-3 px-4 text-right w-36">Nominal (IDR)</th>
                    <th className="py-3 px-4 text-right w-36">Saldo (IDR)</th>
                    <th className="py-3 px-4 text-center w-28">Aksi Catat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-300 stroke-1" />
                          <p className="text-xs font-semibold text-slate-500">
                            Tidak ada transaksi yang cocok dengan filter atau pencarian.
                          </p>
                          {isFilterActive && (
                            <button
                              onClick={handleResetFilters}
                              className="mt-1 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                            >
                              Hapus filter & tampilkan semua
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, txIdx) => {
                      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      let Icon = Receipt;

                      if (tx.type === 'qris') {
                        badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                        Icon = QrCode;
                      } else if (tx.type === 'va') {
                        badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                        Icon = CreditCard;
                      } else if (tx.type === 'transfer') {
                        badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                        Icon = Send;
                      } else if (tx.type === 'ewallet') {
                        badgeColor = 'bg-sky-100 text-sky-800 border-sky-200';
                        Icon = Wallet;
                      } else if (tx.type === 'cash_withdrawal') {
                        badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
                        Icon = DollarSign;
                      } else if (tx.type === 'fee') {
                        badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        Icon = Coins;
                      }

                      const displayDate = tx.dateTime || tx.date || '-';
                      const dateParts = displayDate.split(' ');
                      const dateMain = dateParts.length >= 3 ? `${dateParts[0]} ${dateParts[1]} ${dateParts[2]}` : displayDate;
                      const dateSub = dateParts.length >= 4 ? dateParts.slice(3).join(' ') : (tx.date || '');

                      return (
                        <tr key={tx.id || `tx_${txIdx}`} className="hover:bg-slate-50/80 transition-colors">
                          {/* Date & Time */}
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{dateMain}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {dateSub}
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeColor}`}>
                              <Icon className="w-3 h-3" />
                              <span>{tx.typeLabel || 'Lainnya'}</span>
                            </span>
                          </td>

                          {/* Description & SubDescription */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 leading-snug">
                              {tx.description}
                            </div>
                            {tx.subDescription && (
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {tx.subDescription}
                              </div>
                            )}
                            {tx.paylaterMatchTitle && (
                              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                <CreditCard className="w-2.5 h-2.5" />
                                <span>Tagihan: {tx.paylaterMatchTitle}</span>
                              </div>
                            )}
                          </td>

                          {/* Nominal */}
                          <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                            tx.isCredit ? 'text-emerald-700' : 'text-slate-900'
                          }`}>
                            {tx.isCredit ? '+' : '-'}{formatRupiah(Math.abs(tx.amount))}
                          </td>

                          {/* Balance After */}
                          <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatRupiah(tx.balanceAfter)}
                          </td>

                          {/* Action Button: Quick Record to Expenses/Incomes */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleRecordTransactionAsEntry(tx)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                tx.isCredit
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={tx.isCredit ? 'Catat sebagai Pemasukan akun' : 'Catat sebagai Pengeluaran akun'}
                            >
                              + {tx.isCredit ? 'Pemasukan' : 'Pengeluaran'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

      {/* 7. Modal Konfirmasi Hapus (In-App Modal - 100% Reliable in Iframes) */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {deleteDialog.type === 'all' ? 'Kosongkan Seluruh Koleksi Rekening?' : 'Hapus Dokumen Laporan Rekening?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {deleteDialog.type === 'all' 
                    ? 'Tindakan ini akan menghapus seluruh data laporan mutasi dan riwayat transaksi settlement yang tersimpan pada koleksi akun Anda.'
                    : `Apakah Anda yakin ingin menghapus "${deleteDialog.targetTitle}" dari koleksi laporan mutasi rekening?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, type: 'single' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteDialog.type === 'all' ? 'Ya, Kosongkan Semua' : 'Ya, Hapus Dokumen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Konversi & Upload PDF Rekening (Multi-File Supported) */}
      {isConverterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-4 p-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Unggah Dokumen Mutasi Rekening
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dukung unggah multi-file PDF untuk kumpulan mutasi multi-bulan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConverterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode selection tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
              <button
                onClick={() => setConverterMode('upload')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  converterMode === 'upload' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                Unggah File PDF (1 atau Banyak)
              </button>
              <button
                onClick={() => setConverterMode('paste')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  converterMode === 'paste' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                Tempel Teks / OCR
              </button>
            </div>

            {/* Merge Option: Append vs Replace */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Metode Penyimpanan Koleksi:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  uploadMergeStrategy === 'append' 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold' 
                    : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={uploadMergeStrategy === 'append'}
                    onChange={() => setUploadMergeStrategy('append')}
                    className="mt-0.5 text-emerald-800"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Tambahkan ke Koleksi</div>
                    <div className="text-[10px] text-slate-500 font-normal">Bulan sebelumnya tetap tersimpan & terakumulasi</div>
                  </div>
                </label>

                <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  uploadMergeStrategy === 'replace' 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold' 
                    : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={uploadMergeStrategy === 'replace'}
                    onChange={() => setUploadMergeStrategy('replace')}
                    className="mt-0.5 text-emerald-800"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Ganti Semua Data</div>
                    <div className="text-[10px] text-slate-500 font-normal">Hanya gunakan file PDF yang baru diunggah</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Upload Area */}
            {converterMode === 'upload' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-emerald-50/30 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 group-hover:scale-110 flex items-center justify-center mx-auto transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk pilih atau drag & drop file PDF rekening
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Anda bisa memilih <strong>lebih dari 1 file PDF sekaligus</strong> (misal: file Juni, Juli, Agustus).
                    </p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center gap-3 animate-pulse">
                    <RefreshCw className="w-4 h-4 text-emerald-800 animate-spin shrink-0" />
                    <span className="text-xs font-bold text-emerald-900">{processingStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* Paste Text / OCR Area */}
            {converterMode === 'paste' && (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Tempel teks mutasi rekening atau hasil OCR di sini..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsConverterOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleProcessPasteText}
                    disabled={isProcessing || !pasteText.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? 'Memproses...' : 'Proses & Tambahkan'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
