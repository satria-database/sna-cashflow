import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  INITIAL_PAYLATER_ITEMS, 
  INITIAL_EXPENSES, 
  INITIAL_INCOMES, 
  INITIAL_BUDGETS, 
  INITIAL_REMINDER_SETTINGS 
} from './data/initialData';
import { 
  CategoryBudget, 
  ExpenseCategory, 
  ExpenseItem, 
  IncomeItem, 
  PaylaterItem, 
  ReminderSetting,
  UserProfile,
  BankSettlement,
  AssetItem,
  MaintenanceSchedule,
  MaintenanceRecord
} from './types';
import {
  saveBankSettlementsPersistent,
  loadBankSettlementsPersistent,
  clearBankSettlementsPersistent,
  saveMaintenanceDataPersistent,
  loadMaintenanceDataPersistent,
} from './utils/storage';
import {
  SAMPLE_ASSETS,
  SAMPLE_SCHEDULES,
  SAMPLE_RECORDS,
  LEGACY_MOCK_ASSET_IDS,
  LEGACY_MOCK_SCHEDULE_IDS,
  LEGACY_MOCK_RECORD_IDS,
  getUrgentMaintenanceCount,
} from './utils/maintenanceUtils';
import { MaintenanceManager } from './components/maintenance/MaintenanceManager';
import { MaintenanceDetailModal } from './components/maintenance/MaintenanceDetailModal';
import { SAMPLE_BNI_SETTLEMENT } from './services/pdfSettlementParser';
import { Sidebar, NavTab } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { BankSettlementManager } from './components/BankSettlementManager';
import { ReminderBanner } from './components/ReminderBanner';
import { FinancialCharts } from './components/FinancialCharts';
import { CashFlowTrendCard } from './components/CashFlowTrendCard';
import { UpcomingBillsCard } from './components/UpcomingBillsCard';
import { PaylaterManager } from './components/PaylaterManager';
import { ExpenseManager } from './components/ExpenseManager';
import { IncomeManager } from './components/IncomeManager';
import { DebtPayoffSimulator } from './components/DebtPayoffSimulator';
import { BillCalendarView } from './components/BillCalendarView';
import { TerravaAIAdvisor } from './components/TerravaAIAdvisor';
import { SettingsModal } from './components/SettingsModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginPage } from './components/LoginPage';
import { 
  fetchPaylaterFromSupabase,
  upsertPaylaterToSupabase,
  deletePaylaterFromSupabase,
  fetchExpensesFromSupabase,
  upsertExpenseToSupabase,
  deleteExpenseFromSupabase,
  fetchIncomesFromSupabase,
  upsertIncomeToSupabase,
  deleteIncomeFromSupabase,
  fetchBudgetsFromSupabase,
  upsertBudgetToSupabase,
  fetchReminderSettingsFromSupabase,
  upsertReminderSettingsToSupabase,
  fetchSettlementFromSupabase,
  fetchSettlementsFromSupabase,
  syncSettlementsToSupabase,
  upsertSettlementToSupabase,
  deleteSettlementFromSupabase,
  deleteAllSettlementsFromSupabase,
} from './services/supabaseService';
import { testSupabaseConnection } from './lib/supabase';
import { 
  CheckCircle2, 
  CreditCard, 
  ArrowRight,
  Database,
  Plus,
  Sparkles,
  Menu
} from 'lucide-react';
import { formatRupiah, MONTH_NAMES_ID } from './utils/formatters';

export default function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Supabase connection state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // User Profile & Google Authentication State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('terrava_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Calculate isolated user identifier
  const activeUserId = userProfile?.id || (userProfile?.email ? `usr_${userProfile.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : 'default_user');

  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'database' | 'notifications' | 'backup'>('account');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User-isolated financial states
  const [paylaterItems, setPaylaterItems] = useState<PaylaterItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(INITIAL_BUDGETS);
  const [reminderSettings, setReminderSettings] = useState<ReminderSetting>(INITIAL_REMINDER_SETTINGS);

  // Maintenance & Assets states
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedCalendarSchedule, setSelectedCalendarSchedule] = useState<MaintenanceSchedule | null>(null);

  // Urgent maintenance count for badge in sidebar
  const urgentMaintenanceCount = useMemo(() => {
    return getUrgentMaintenanceCount(schedules);
  }, [schedules]);
  
  // Bank Settlements collection state (Persisted per user - Multi-Month Support with IndexedDB)
  const [bankSettlements, setBankSettlements] = useState<BankSettlement[]>(() => {
    try {
      const savedMulti = localStorage.getItem(`terrava_settlements_${activeUserId}`);
      if (savedMulti !== null) {
        const parsed = JSON.parse(savedMulti);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const savedSingle = localStorage.getItem(`terrava_settlement_${activeUserId}`);
      if (savedSingle !== null) {
        const parsed = JSON.parse(savedSingle);
        if (parsed) return [parsed];
      }
      return [SAMPLE_BNI_SETTLEMENT];
    } catch {
      return [SAMPLE_BNI_SETTLEMENT];
    }
  });

  // Primary/Latest settlement for overview cards
  const latestBankSettlement = bankSettlements.length > 0 ? bankSettlements[0] : null;

  // Save settlement changes (Multi-month cumulative with IndexedDB + Cloud Sync)
  const handleUpdateSettlements = (newSettlements: BankSettlement[]) => {
    setBankSettlements(newSettlements);
    
    // Save to IndexedDB & localStorage without size limit issues
    saveBankSettlementsPersistent(activeUserId, newSettlements).catch((err) => {
      console.warn('Persistent settlement save error:', err);
    });

    // Cloud sync with isolated user_id
    syncSettlementsToSupabase(newSettlements, activeUserId).catch((err) => {
      console.warn('Supabase settlement save fallback:', err);
    });
  };

  const handleUpdateSettlementSingle = (newSettlement: BankSettlement) => {
    handleUpdateSettlements([newSettlement]);
  };

  // Modal states
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [addTransactionType, setAddTransactionType] = useState<'paylater' | 'expense' | 'income'>('paylater');

  // Browser notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Show temporary toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Sync / Pull from Supabase for current active user
  const loadFromSupabase = useCallback(async (userId: string) => {
    const test = await testSupabaseConnection();
    if (test.success) {
      setIsSupabaseConnected(true);
      
      const [dbPaylater, dbExpenses, dbIncomes, dbBudgets, dbReminders, dbSettlements] = await Promise.all([
        fetchPaylaterFromSupabase(userId),
        fetchExpensesFromSupabase(userId),
        fetchIncomesFromSupabase(userId),
        fetchBudgetsFromSupabase(userId),
        fetchReminderSettingsFromSupabase(userId),
        fetchSettlementsFromSupabase(userId),
      ]);

      if (dbPaylater !== null) setPaylaterItems(dbPaylater);
      if (dbExpenses !== null) setExpenses(dbExpenses);
      if (dbIncomes !== null) setIncomes(dbIncomes);
      if (dbBudgets !== null) setBudgets(dbBudgets);
      if (dbReminders !== null) setReminderSettings(dbReminders);
      if (dbSettlements !== null && dbSettlements.length > 0) {
        setBankSettlements(dbSettlements);
        saveBankSettlementsPersistent(userId, dbSettlements).catch(() => {});
      }

      showToast(`Data akun berhasil disinkronkan dari Supabase Cloud! 🚀`);
    } else {
      setIsSupabaseConnected(false);
    }
  }, [showToast]);

  // Load user data on mount or when activeUserId changes
  useEffect(() => {
    const uid = activeUserId;
    
    // 1. Asynchronously load high-capacity settlements from IndexedDB
    loadBankSettlementsPersistent(uid).then((persistedSettlements) => {
      if (persistedSettlements && persistedSettlements.length > 0) {
        setBankSettlements(persistedSettlements);
      }
    }).catch((err) => {
      console.warn('Error loading settlements from IndexedDB:', err);
    });

    // 2. Load financial data from local storage
    try {
      const savedPl = localStorage.getItem(`terrava_paylater_${uid}`);
      const savedExp = localStorage.getItem(`terrava_expenses_${uid}`);
      const savedInc = localStorage.getItem(`terrava_incomes_${uid}`);
      const savedBg = localStorage.getItem(`terrava_budgets_${uid}`);
      const savedRem = localStorage.getItem(`terrava_reminder_${uid}`);

      if (savedPl) setPaylaterItems(JSON.parse(savedPl));
      if (savedExp) setExpenses(JSON.parse(savedExp));
      if (savedInc) setIncomes(JSON.parse(savedInc));
      if (savedBg) setBudgets(JSON.parse(savedBg));
      if (savedRem) setReminderSettings(JSON.parse(savedRem));
    } catch (e) {
      console.warn('Error parsing cached local storage:', e);
    }

    // 3. Load maintenance data (assets, schedules, records) - pure user data starting from 0
    loadMaintenanceDataPersistent(uid).then((data) => {
      if (data) {
        // Strip out any legacy mock items so the feature starts clean from 0
        const cleanAssets = (data.assets || []).filter((a) => !LEGACY_MOCK_ASSET_IDS.has(a.id));
        const cleanSchedules = (data.schedules || []).filter(
          (s) => !LEGACY_MOCK_SCHEDULE_IDS.has(s.id) && !LEGACY_MOCK_ASSET_IDS.has(s.assetId)
        );
        const cleanRecords = (data.records || []).filter(
          (r) => !LEGACY_MOCK_RECORD_IDS.has(r.id) && !LEGACY_MOCK_ASSET_IDS.has(r.assetId)
        );

        setAssets(cleanAssets);
        setSchedules(cleanSchedules);
        setMaintenanceRecords(cleanRecords);
        saveMaintenanceDataPersistent(uid, cleanAssets, cleanSchedules, cleanRecords).catch(() => {});
      } else {
        setAssets([]);
        setSchedules([]);
        setMaintenanceRecords([]);
      }
    }).catch((err) => {
      console.warn('Error loading maintenance data:', err);
      setAssets([]);
      setSchedules([]);
      setMaintenanceRecords([]);
    });

    // 4. Fetch fresh data from Supabase if connected
    loadFromSupabase(uid);
  }, [activeUserId, loadFromSupabase]);

  // Save maintenance changes to persistent storage
  useEffect(() => {
    saveMaintenanceDataPersistent(activeUserId, assets, schedules, maintenanceRecords).catch(() => {});
  }, [assets, schedules, maintenanceRecords, activeUserId]);

  // Save changes to user-scoped local storage
  useEffect(() => {
    saveBankSettlementsPersistent(activeUserId, bankSettlements).catch(() => {});
  }, [bankSettlements, activeUserId]);

  // Save changes to user-scoped local storage
  useEffect(() => {
    try {
      localStorage.setItem(`terrava_paylater_${activeUserId}`, JSON.stringify(paylaterItems));
    } catch {}
  }, [paylaterItems, activeUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`terrava_expenses_${activeUserId}`, JSON.stringify(expenses));
    } catch {}
  }, [expenses, activeUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`terrava_incomes_${activeUserId}`, JSON.stringify(incomes));
    } catch {}
  }, [incomes, activeUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`terrava_budgets_${activeUserId}`, JSON.stringify(budgets));
    } catch {}
  }, [budgets, activeUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`terrava_reminder_${activeUserId}`, JSON.stringify(reminderSettings));
    } catch {}
  }, [reminderSettings, activeUserId]);

  const handleLoginGoogle = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('terrava_user_profile', JSON.stringify(profile));
    } catch {}
    showToast(`Selamat datang, ${profile.name}! Akun terhubung.`);
  }, [showToast]);

  const handleLogoutGoogle = useCallback(() => {
    setUserProfile(null);
    try {
      localStorage.removeItem('terrava_user_profile');
    } catch {}
    showToast('Berhasil keluar dari akun.');
  }, [showToast]);

  // Request browser notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setNotificationPermission(res);
        if (res === 'granted') {
          showToast('Notifikasi browser berhasil diaktifkan!');
          new Notification('Terrava Financial Manager', {
            body: 'Pengingat tagihan otomatis telah aktif untuk akun Anda.',
            icon: '/favicon.ico',
          });
          return true;
        }
      } catch (err) {
        console.error('Notification permission error', err);
      }
    }
    return false;
  };

  // Test Notification
  const handleTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 [Tes Terrava] Tagihan Paylater Jatuh Tempo', {
        body: 'Cicilan tagihan jatuh tempo dalam waktu dekat. Pastikan saldo tercukupi!',
      });
      showToast('Tes notifikasi browser terkirim!');
    } else {
      showToast('🔔 [Pengingat Terrava] Segera lunasi tagihan paylater sebelum jatuh tempo!');
    }
  };

  // Paylater Handlers
  const handleAddPaylater = async (item: Omit<PaylaterItem, 'id' | 'createdAt' | 'paidHistory'>) => {
    const newItem: PaylaterItem = {
      ...item,
      id: `pl-${Date.now()}`,
      paidHistory: [],
      createdAt: new Date().toISOString(),
    };
    setPaylaterItems((prev) => [newItem, ...prev]);
    showToast(`Tagihan paylater "${item.title}" berhasil ditambahkan.`);
    
    // Cloud sync with isolated user_id
    await upsertPaylaterToSupabase(newItem, activeUserId);
  };

  const handleUpdatePaylater = async (updated: PaylaterItem) => {
    setPaylaterItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Tagihan "${updated.title}" diperbarui.`);

    // Cloud sync with isolated user_id
    await upsertPaylaterToSupabase(updated, activeUserId);
  };

  const handleDeletePaylater = async (id: string) => {
    setPaylaterItems((prev) => prev.filter((p) => p.id !== id));
    showToast('Tagihan paylater dihapus.');

    // Cloud sync with isolated user_id
    await deletePaylaterFromSupabase(id, activeUserId);
  };

  const handleTogglePayMonth = async (id: string) => {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let updatedItem: PaylaterItem | null = null;

    setPaylaterItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isNowPaid = !item.isPaidThisMonth;
          let newHistory = [...item.paidHistory];
          let newCurrentTenor = item.currentTenor;

          if (isNowPaid) {
            newHistory.push({
              monthKey,
              paidAt: new Date().toISOString(),
              amount: item.monthlyInstallment,
            });
            newCurrentTenor = Math.min(item.totalTenor, item.currentTenor + 1);
            showToast(`Tagihan "${item.title}" ditandai lunas bulan ini! 🎉`);
          } else {
            newHistory = newHistory.filter((h) => h.monthKey !== monthKey);
            newCurrentTenor = Math.max(1, item.currentTenor - 1);
            showToast(`Pembayaran "${item.title}" dibatalkan.`);
          }

          updatedItem = {
            ...item,
            isPaidThisMonth: isNowPaid,
            currentTenor: newCurrentTenor,
            paidHistory: newHistory,
          };
          return updatedItem;
        }
        return item;
      })
    );

    if (updatedItem) {
      await upsertPaylaterToSupabase(updatedItem, activeUserId);
    }
  };

  const handlePayOffEntirely = async (id: string) => {
    let targetItem: PaylaterItem | null = null;
    setPaylaterItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          showToast(`Selamat! Cicilan "${item.title}" telah lunas sepenuhnya! 🚀`);
          targetItem = {
            ...item,
            currentTenor: item.totalTenor,
            isPaidThisMonth: true,
          };
          return targetItem;
        }
        return item;
      })
    );

    if (targetItem) {
      await upsertPaylaterToSupabase(targetItem, activeUserId);
    }
  };

  // Expense Handlers
  const handleAddExpense = async (exp: Omit<ExpenseItem, 'id'> | ExpenseItem) => {
    const newExp: ExpenseItem = {
      ...exp,
      id: ('id' in exp && exp.id) ? exp.id : `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    showToast(`Pengeluaran "${exp.title}" berhasil dicatat.`);

    // Cloud sync with isolated user_id
    await upsertExpenseToSupabase(newExp, activeUserId);
  };

  const handleUpdateExpense = async (updated: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    showToast(`Pengeluaran "${updated.title}" diperbarui.`);

    // Cloud sync with isolated user_id
    await upsertExpenseToSupabase(updated, activeUserId);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Pengeluaran dihapus.');

    // Cloud sync with isolated user_id
    await deleteExpenseFromSupabase(id, activeUserId);
  };

  const handleUpdateBudget = async (category: ExpenseCategory, newLimit: number) => {
    const updatedBudget: CategoryBudget = { category, monthlyLimit: newLimit };
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? updatedBudget : b))
    );
    showToast('Batas anggaran kategori diperbarui.');

    // Cloud sync with isolated user_id
    await upsertBudgetToSupabase(updatedBudget, activeUserId);
  };

  // Income Handlers
  const handleAddIncome = async (inc: Omit<IncomeItem, 'id'>) => {
    const newInc: IncomeItem = {
      ...inc,
      id: `inc-${Date.now()}`,
    };
    setIncomes((prev) => [newInc, ...prev]);
    showToast(`Pemasukan "${inc.title}" berhasil ditambahkan.`);

    // Cloud sync with isolated user_id
    await upsertIncomeToSupabase(newInc, activeUserId);
  };

  const handleUpdateIncome = async (updated: IncomeItem) => {
    setIncomes((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    showToast(`Pemasukan "${updated.title}" diperbarui.`);

    // Cloud sync with isolated user_id
    await upsertIncomeToSupabase(updated, activeUserId);
  };

  const handleDeleteIncome = async (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
    showToast('Pemasukan dihapus.');

    // Cloud sync with isolated user_id
    await deleteIncomeFromSupabase(id, activeUserId);
  };

  // Maintenance & Asset Handlers
  const handleAddAsset = (asset: AssetItem) => {
    setAssets((prev) => [asset, ...prev]);
    showToast(`Aset "${asset.name}" berhasil ditambahkan! 🚗`);
  };

  const handleUpdateAsset = (asset: AssetItem) => {
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? asset : a)));
    showToast(`Aset "${asset.name}" berhasil diperbarui.`);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSchedules((prev) => prev.filter((s) => s.assetId !== id));
    showToast('Aset dan jadwal perawatan terkait berhasil dihapus.');
  };

  const handleAddSchedule = (schedule: MaintenanceSchedule) => {
    setSchedules((prev) => [schedule, ...prev]);
    showToast(`Jadwal "${schedule.title}" berhasil dibuat! 🔧`);
  };

  const handleUpdateSchedule = (schedule: MaintenanceSchedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? schedule : s)));
    showToast(`Jadwal "${schedule.title}" diperbarui.`);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Jadwal perawatan dihapus.');
  };

  const handleCompleteSchedule = (data: {
    schedule: MaintenanceSchedule;
    record: MaintenanceRecord;
    nextSchedule?: MaintenanceSchedule;
  }) => {
    // 1. Update existing schedule with updated lastDate and nextDate
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === data.schedule.id) {
          return {
            ...s,
            lastDate: data.record.completionDate,
            lastCost: data.record.actualCost || s.lastCost,
            nextDate: data.nextSchedule?.nextDate || s.nextDate,
            status: 'aman',
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    // 2. Add maintenance record to history
    setMaintenanceRecords((prev) => [data.record, ...prev]);

    // 3. If checkbox "Catat sebagai pengeluaran" is active and cost > 0, auto create transaction
    if (data.record.recordedAsExpense && data.record.actualCost && data.record.actualCost > 0) {
      const asset = assets.find((a) => a.id === data.schedule.assetId);
      const expenseCat: ExpenseCategory =
        asset?.category === 'Kendaraan'
          ? 'transportasi'
          : asset?.category === 'Bangunan'
          ? 'tagihan_rumah'
          : 'lainnya';

      const newExpense: ExpenseItem = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Perawatan: ${data.schedule.title} - ${asset?.name || 'Aset'}`,
        amount: data.record.actualCost,
        category: expenseCat,
        date: data.record.completionDate || new Date().toISOString().split('T')[0],
        notes: `Otomatis dari perawatan ${data.schedule.title}. Bengkel/Teknisi: ${data.record.serviceProvider || '-'}`,
      };
      handleAddExpense(newExpense);
      showToast(`Perawatan selesai! Pengeluaran Rp ${data.record.actualCost.toLocaleString('id-ID')} otomatis dicatat.`);
    } else {
      showToast(`Perawatan "${data.schedule.title}" berhasil ditandai selesai!`);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setMaintenanceRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Riwayat perawatan berhasil dihapus.');
  };

  const handleUpdateReminderSettings = async (settings: ReminderSetting) => {
    setReminderSettings(settings);
    await upsertReminderSettingsToSupabase(settings, activeUserId);
  };

  // Export / Import / Reset Handlers
  const handleExportData = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      paylaterItems,
      expenses,
      incomes,
      budgets,
      reminderSettings,
      assets,
      schedules,
      maintenanceRecords,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `terrava-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Data backup berhasil diekspor (JSON).');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.paylaterItems) {
          setPaylaterItems(parsed.paylaterItems);
          for (const item of parsed.paylaterItems) {
            await upsertPaylaterToSupabase(item, activeUserId);
          }
        }
        if (parsed.expenses) {
          setExpenses(parsed.expenses);
          for (const exp of parsed.expenses) {
            await upsertExpenseToSupabase(exp, activeUserId);
          }
        }
        if (parsed.incomes) {
          setIncomes(parsed.incomes);
          for (const inc of parsed.incomes) {
            await upsertIncomeToSupabase(inc, activeUserId);
          }
        }
        if (parsed.budgets) {
          setBudgets(parsed.budgets);
          for (const b of parsed.budgets) {
            await upsertBudgetToSupabase(b, activeUserId);
          }
        }
        if (parsed.reminderSettings) {
          setReminderSettings(parsed.reminderSettings);
          await upsertReminderSettingsToSupabase(parsed.reminderSettings, activeUserId);
        }
        if (parsed.assets) setAssets(parsed.assets);
        if (parsed.schedules) setSchedules(parsed.schedules);
        if (parsed.maintenanceRecords) setMaintenanceRecords(parsed.maintenanceRecords);

        showToast('Data backup Terrava berhasil diimpor & disinkronkan!');
      } catch (err) {
        showToast('Gagal membaca file backup JSON. Pastikan format valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToZero = () => {
    setIsResetConfirmOpen(true);
  };

  const confirmResetToZero = () => {
    setPaylaterItems([]);
    setExpenses([]);
    setIncomes([]);
    setBudgets(INITIAL_BUDGETS);
    setReminderSettings(INITIAL_REMINDER_SETTINGS);
    setAssets([]);
    setSchedules([]);
    setMaintenanceRecords([]);
    saveMaintenanceDataPersistent(activeUserId, [], [], []).catch(() => {});
    if (activeUserId) {
      localStorage.removeItem(`terrava_paylater_${activeUserId}`);
      localStorage.removeItem(`terrava_expenses_${activeUserId}`);
      localStorage.removeItem(`terrava_incomes_${activeUserId}`);
    }
    showToast('Data telah dikosongkan (mulai dari 0).');
  };

  // Calculations for current month view
  const currentMonthExpenses = expenses.filter((exp) => {
    const d = new Date(exp.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const currentMonthIncomes = incomes.filter((inc) => {
    const d = new Date(inc.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpense = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPaylaterDueThisMonth = paylaterItems.reduce((sum, item) => sum + item.monthlyInstallment, 0);
  const totalPaylaterPaidThisMonth = paylaterItems
    .filter((item) => item.isPaidThisMonth)
    .reduce((sum, item) => sum + item.monthlyInstallment, 0);
  const unpaidPaylaterCount = paylaterItems.filter((item) => !item.isPaidThisMonth).length;

  // Gatekeeper: If user is not logged in, render the dedicated LoginPage
  if (!userProfile || !userProfile.isLoggedIn) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-emerald-700 flex items-center gap-2.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <LoginPage onLogin={handleLoginGoogle} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-emerald-700 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar - Clean Emerald & White Theme with Official TERRAVA Logo */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        paylaterItems={paylaterItems}
        totalIncome={totalIncome}
        totalPaylaterDueThisMonth={totalPaylaterDueThisMonth}
        unpaidPaylaterCount={unpaidPaylaterCount}
        urgentMaintenanceCount={urgentMaintenanceCount}
        onOpenAddModal={(type) => {
          setAddTransactionType(type || 'paylater');
          setIsAddTransactionModalOpen(true);
        }}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseModal={() => {
          setSettingsTab('database');
          setIsSettingsModalOpen(true);
        }}
        user={userProfile}
        onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
        onLogoutGoogle={handleLogoutGoogle}
        onOpenSettingsModal={(tab) => {
          setSettingsTab(tab || 'account');
          setIsSettingsModalOpen(true);
        }}
        onOpenReminderModal={() => {
          setSettingsTab('notifications');
          setIsSettingsModalOpen(true);
        }}
        unreadRemindersCount={unpaidPaylaterCount}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onMonthChange={(y, m) => {
          setCurrentYear(y);
          setCurrentMonth(m);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Main Column: Content Area (Header Navbar dihapus, berpindah ke Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile-Only Header Bar (lg:hidden) */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="text-xs font-bold text-slate-800">
            {MONTH_NAMES_ID[currentMonth]} {currentYear}
          </div>

          <button
            onClick={() => {
              setAddTransactionType('paylater');
              setIsAddTransactionModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-[#007a52] text-white hover:bg-[#006644] cursor-pointer"
            title="Tambah Data"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Main Canvas Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-6 w-full">
          
          {/* View 1: Main Overview Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 w-full">
              
              {/* Automated Bill Reminder Banner */}
              <ReminderBanner
                paylaterItems={paylaterItems}
                currentYear={currentYear}
                currentMonth={currentMonth}
                onMarkAsPaid={handleTogglePayMonth}
                onNavigateToPaylater={() => setActiveTab('paylater')}
                onEnableNotification={requestNotificationPermission}
                notificationPermission={notificationPermission}
              />

              {/* Financial Summary KPI Cards with DSR indicator & Bank Settlement summary */}
              <SummaryCards
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                totalPaylaterDueThisMonth={totalPaylaterDueThisMonth}
                totalPaylaterPaidThisMonth={totalPaylaterPaidThisMonth}
                unpaidPaylaterCount={unpaidPaylaterCount}
                settlement={latestBankSettlement}
                settlements={bankSettlements}
                onNavigateToPaylater={() => setActiveTab('paylater')}
                onNavigateToExpenses={() => setActiveTab('expenses')}
                onNavigateToSettlement={() => setActiveTab('settlement')}
              />

              {/* Main Dashboard 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
                
                {/* Left Column (8 cols): Visualisasi & Grafik + Ringkasan Arus Kas */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Visualisasi & Grafik Keuangan */}
                  <FinancialCharts
                    expenses={currentMonthExpenses}
                    paylaterItems={paylaterItems}
                    incomes={currentMonthIncomes}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                  />

                  {/* Ringkasan Arus Kas */}
                  <CashFlowTrendCard
                    incomes={currentMonthIncomes}
                    expenses={currentMonthExpenses}
                    paylaterItems={paylaterItems}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                  />
                </div>

                {/* Right Column (4 cols): Tagihan Mendatang + Total Beban + Tips AI */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Tagihan Mendatang */}
                  <UpcomingBillsCard
                    paylaterItems={paylaterItems}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    onNavigateToCalendar={() => setActiveTab('calendar')}
                    onNavigateToPaylater={() => setActiveTab('paylater')}
                    onOpenAddModal={() => {
                      setAddTransactionType('paylater');
                      setIsAddTransactionModalOpen(true);
                    }}
                    onMarkAsPaid={handleTogglePayMonth}
                  />

                  {/* Total Beban Finansial Bulan Ini */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="text-xs font-semibold text-slate-500">
                      Total Beban Finansial Bulan Ini
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {formatRupiah(totalExpense + totalPaylaterDueThisMonth)}
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>Porsi Cicilan Paylater:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {(totalExpense + totalPaylaterDueThisMonth) > 0 
                          ? ((totalPaylaterDueThisMonth / (totalExpense + totalPaylaterDueThisMonth)) * 100).toFixed(1) 
                          : '0.0'}% ({formatRupiah(totalPaylaterDueThisMonth)})
                      </span>
                    </div>
                  </div>

                  {/* Tips Terrava AI */}
                  <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-2xl p-4.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Tips Terrava AI</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                        AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Yuk mulai catat transaksi dan tagihan kamu agar keuangan lebih terkontrol dan sehat!
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* View: Bank Settlement & PDF Converter */}
          {activeTab === 'settlement' && (
            <div className="w-full">
              <BankSettlementManager
                settlements={bankSettlements}
                onUpdateSettlements={handleUpdateSettlements}
                settlement={latestBankSettlement}
                onUpdateSettlement={handleUpdateSettlementSingle}
                paylaterItems={paylaterItems}
                onAddExpense={handleAddExpense}
                onAddIncome={handleAddIncome}
                showToast={showToast}
              />
            </div>
          )}

          {/* View 2: Full Paylater Manager */}
          {activeTab === 'paylater' && (
            <div className="w-full">
              <PaylaterManager
                items={paylaterItems}
                currentYear={currentYear}
                currentMonth={currentMonth}
                onAddItem={handleAddPaylater}
                onUpdateItem={handleUpdatePaylater}
                onDeleteItem={handleDeletePaylater}
                onTogglePayMonth={handleTogglePayMonth}
                onPayOffEntirely={handlePayOffEntirely}
                isAddModalOpen={false}
                setIsAddModalOpen={(open) => {
                  if (open) {
                    setAddTransactionType('paylater');
                    setIsAddTransactionModalOpen(true);
                  }
                }}
              />
            </div>
          )}

          {/* View 3: Full Expenses & Budget Manager */}
          {activeTab === 'expenses' && (
            <div className="w-full">
              <ExpenseManager
                expenses={currentMonthExpenses}
                budgets={budgets}
                currentYear={currentYear}
                currentMonth={currentMonth}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                onUpdateBudget={handleUpdateBudget}
                isAddModalOpen={false}
                setIsAddModalOpen={(open) => {
                  if (open) {
                    setAddTransactionType('expense');
                    setIsAddTransactionModalOpen(true);
                  }
                }}
              />
            </div>
          )}

          {/* View 4: Bill Calendar View */}
          {activeTab === 'calendar' && (
            <div className="w-full">
              <BillCalendarView
                currentYear={currentYear}
                currentMonth={currentMonth}
                paylaterItems={paylaterItems}
                expenses={currentMonthExpenses}
                maintenanceSchedules={schedules}
                assets={assets}
                onSelectMaintenance={(sched) => setSelectedCalendarSchedule(sched)}
                onTogglePayMonth={handleTogglePayMonth}
              />
            </div>
          )}

          {/* View: Jadwal & Perawatan (Maintenance & Assets) */}
          {activeTab === 'maintenance' && (
            <div className="w-full">
              <MaintenanceManager
                assets={assets}
                schedules={schedules}
                records={maintenanceRecords}
                onAddAsset={handleAddAsset}
                onUpdateAsset={handleUpdateAsset}
                onDeleteAsset={handleDeleteAsset}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onCompleteSchedule={handleCompleteSchedule}
                onDeleteRecord={handleDeleteRecord}
                showToast={showToast}
              />
            </div>
          )}

          {/* View 5: Debt Payoff Strategy Simulator */}
          {activeTab === 'strategy' && (
            <div className="w-full">
              <DebtPayoffSimulator
                items={paylaterItems}
                totalIncome={totalIncome}
              />
            </div>
          )}

          {/* View 6: Terrava AI Financial Consultant */}
          {activeTab === 'ai' && (
            <div className="w-full">
              <TerravaAIAdvisor
                paylaterItems={paylaterItems}
                expenses={currentMonthExpenses}
                incomes={currentMonthIncomes}
                budgets={budgets}
                currentYear={currentYear}
                currentMonth={currentMonth}
              />
            </div>
          )}

        </main>

      </div>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        initialType={addTransactionType}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onAddPaylater={handleAddPaylater}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
      />

      {/* Unified Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialTab={settingsTab}
        user={userProfile}
        onOpenGoogleAuth={() => {
          setIsSettingsModalOpen(false);
          setIsGoogleAuthModalOpen(true);
        }}
        onLogoutGoogle={handleLogoutGoogle}
        isSupabaseConnected={isSupabaseConnected}
        onRefreshSupabaseData={loadFromSupabase}
        reminderSettings={reminderSettings}
        onUpdateReminderSettings={handleUpdateReminderSettings}
        onRequestBrowserPermission={requestNotificationPermission}
        onTestNotification={handleTestNotification}
        permissionStatus={notificationPermission}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetToZero}
      />

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthModalOpen}
        onClose={() => setIsGoogleAuthModalOpen(false)}
        user={userProfile}
        onLogin={handleLoginGoogle}
        onLogout={handleLogoutGoogle}
      />

      {/* Confirm Reset to Zero Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Mulai Dari 0 Data"
        message="Semua data tagihan paylater, riwayat pengeluaran, dan pemasukan saat ini akan dikosongkan. Anda yakin ingin melanjutkan?"
        confirmText="Ya, Kosongkan Semua Data"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmResetToZero}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Calendar Maintenance Detail Modal */}
      {selectedCalendarSchedule && (
        <MaintenanceDetailModal
          schedule={selectedCalendarSchedule}
          asset={assets.find((a) => a.id === selectedCalendarSchedule.assetId)}
          records={maintenanceRecords.filter((r) => r.scheduleId === selectedCalendarSchedule.id)}
          isOpen={true}
          onClose={() => setSelectedCalendarSchedule(null)}
          onEdit={() => {
            setActiveTab('maintenance');
            setSelectedCalendarSchedule(null);
          }}
          onComplete={() => {
            setActiveTab('maintenance');
            setSelectedCalendarSchedule(null);
          }}
        />
      )}

    </div>
  );
}
