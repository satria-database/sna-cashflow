import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Car, 
  Layers, 
  Search, 
  Filter, 
  ArrowRight, 
  Info,
  ShieldAlert,
  Building,
  Laptop,
  Shield,
  Cpu,
  Receipt,
  Edit,
  Trash2,
  Bell
} from 'lucide-react';
import { 
  AssetItem, 
  MaintenanceSchedule, 
  MaintenanceRecord,
  MaintenanceStatus,
  AssetCategory 
} from '../../types';
import { 
  getMaintenanceStatusInfo, 
  getIntervalMethodLabel, 
  formatIndoDate,
  shouldShowReminderAlert,
  calculateNextSchedule,
} from '../../utils/maintenanceUtils';
import { formatRupiah } from '../../utils/formatters';
import { AssetModal } from './AssetModal';
import { ScheduleModal } from './ScheduleModal';
import { CompleteMaintenanceModal } from './CompleteMaintenanceModal';
import { MaintenanceDetailModal } from './MaintenanceDetailModal';

interface MaintenanceManagerProps {
  assets: AssetItem[];
  schedules: MaintenanceSchedule[];
  records: MaintenanceRecord[];
  onAddAsset: (asset: AssetItem) => void;
  onUpdateAsset: (asset: AssetItem) => void;
  onDeleteAsset: (assetId: string) => void;
  onAddSchedule: (schedule: MaintenanceSchedule) => void;
  onUpdateSchedule: (schedule: MaintenanceSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onCompleteSchedule: (data: {
    schedule: MaintenanceSchedule;
    record: MaintenanceRecord;
    nextSchedule?: MaintenanceSchedule;
  }) => void;
  onDeleteRecord?: (recordId: string) => void;
  showToast: (message: string) => void;
  onOpenAddSchedule?: (assetId?: string) => void;
  onOpenAddAsset?: () => void;
  onOpenEditAsset?: (asset: AssetItem) => void;
  onOpenScheduleDetail?: (schedule: MaintenanceSchedule) => void;
  onOpenCompleteSchedule?: (schedule: MaintenanceSchedule) => void;
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
  assets,
  schedules,
  records,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onCompleteSchedule,
  onDeleteRecord,
  showToast,
  onOpenAddSchedule: onOpenAddScheduleProp,
  onOpenAddAsset: onOpenAddAssetProp,
  onOpenEditAsset: onOpenEditAssetProp,
  onOpenScheduleDetail: onOpenScheduleDetailProp,
  onOpenCompleteSchedule: onOpenCompleteScheduleProp,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedules' | 'assets' | 'history'>('schedules');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('all');

  // Internal Modal States
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<AssetItem | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<MaintenanceSchedule | null>(null);
  const [preselectedAssetId, setPreselectedAssetId] = useState<string | undefined>(undefined);

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [scheduleToComplete, setScheduleToComplete] = useState<MaintenanceSchedule | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [scheduleForDetail, setScheduleForDetail] = useState<MaintenanceSchedule | null>(null);

  // Asset Map for fast lookup
  const assetMap = useMemo(() => {
    const map = new Map<string, AssetItem>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  // Modal Handlers
  const handleOpenAddAsset = () => {
    if (onOpenAddAssetProp) {
      onOpenAddAssetProp();
    } else {
      setAssetToEdit(null);
      setIsAssetModalOpen(true);
    }
  };

  const handleOpenEditAsset = (asset: AssetItem) => {
    if (onOpenEditAssetProp) {
      onOpenEditAssetProp(asset);
    } else {
      setAssetToEdit(asset);
      setIsAssetModalOpen(true);
    }
  };

  const handleOpenAddSchedule = (assetId?: string) => {
    if (onOpenAddScheduleProp) {
      onOpenAddScheduleProp(assetId);
    } else {
      setScheduleToEdit(null);
      setPreselectedAssetId(assetId);
      setIsScheduleModalOpen(true);
    }
  };

  const handleOpenEditSchedule = (schedule: MaintenanceSchedule) => {
    setScheduleForDetail(null);
    setIsDetailModalOpen(false);
    setScheduleToEdit(schedule);
    setPreselectedAssetId(schedule.assetId);
    setIsScheduleModalOpen(true);
  };

  const handleOpenCompleteSchedule = (schedule: MaintenanceSchedule) => {
    if (onOpenCompleteScheduleProp) {
      onOpenCompleteScheduleProp(schedule);
    } else {
      setScheduleForDetail(null);
      setIsDetailModalOpen(false);
      setScheduleToComplete(schedule);
      setIsCompleteModalOpen(true);
    }
  };

  const handleOpenScheduleDetail = (schedule: MaintenanceSchedule) => {
    if (onOpenScheduleDetailProp) {
      onOpenScheduleDetailProp(schedule);
    } else {
      setScheduleForDetail(schedule);
      setIsDetailModalOpen(true);
    }
  };

  const handleSaveAsset = (savedAsset: AssetItem) => {
    if (assetToEdit) {
      onUpdateAsset(savedAsset);
      showToast(`Aset "${savedAsset.name}" berhasil diperbarui.`);
    } else {
      onAddAsset(savedAsset);
      showToast(`Aset "${savedAsset.name}" berhasil ditambahkan.`);
    }
    setIsAssetModalOpen(false);
    setAssetToEdit(null);
  };

  const handleSaveSchedule = (savedSchedule: MaintenanceSchedule) => {
    if (scheduleToEdit) {
      onUpdateSchedule(savedSchedule);
      showToast(`Jadwal "${savedSchedule.title}" diperbarui.`);
    } else {
      onAddSchedule(savedSchedule);
      showToast(`Jadwal "${savedSchedule.title}" berhasil dibuat.`);
    }
    setIsScheduleModalOpen(false);
    setScheduleToEdit(null);
    setPreselectedAssetId(undefined);
  };

  const handleCompleteSubmit = (data: {
    record: MaintenanceRecord;
    updatedAssetMeter?: number;
    recordAsExpense: boolean;
  }) => {
    if (!scheduleToComplete) return;

    let nextSchedule: MaintenanceSchedule | undefined = undefined;
    if (scheduleToComplete.isRecurring) {
      const { nextDate, nextMeter } = calculateNextSchedule(
        data.record.completionDate,
        data.updatedAssetMeter !== undefined ? data.updatedAssetMeter : scheduleToComplete.lastMeter,
        scheduleToComplete.intervalMethod,
        scheduleToComplete.intervalMonths,
        scheduleToComplete.intervalKm,
        scheduleToComplete.intervalHours
      );
      nextSchedule = {
        ...scheduleToComplete,
        lastDate: data.record.completionDate,
        lastMeter: data.updatedAssetMeter !== undefined ? data.updatedAssetMeter : scheduleToComplete.lastMeter,
        lastCost: data.record.actualCost,
        nextDate: nextDate || scheduleToComplete.nextDate,
        nextMeter: nextMeter !== undefined ? nextMeter : scheduleToComplete.nextMeter,
        status: 'aman',
        updatedAt: new Date().toISOString(),
      };
    }

    // Update asset odometer if higher
    const targetAsset = assetMap.get(scheduleToComplete.assetId);
    if (targetAsset && data.updatedAssetMeter !== undefined && data.updatedAssetMeter > (targetAsset.currentMeter || 0)) {
      onUpdateAsset({
        ...targetAsset,
        currentMeter: data.updatedAssetMeter,
      });
    }

    onCompleteSchedule({
      schedule: scheduleToComplete,
      record: data.record,
      nextSchedule,
    });

    setIsCompleteModalOpen(false);
    setScheduleToComplete(null);
  };

  // Enhanced Schedules with dynamic status calculation
  const enhancedSchedules = useMemo(() => {
    return schedules.map((schedule) => {
      const asset = assetMap.get(schedule.assetId);
      const statusInfo = getMaintenanceStatusInfo(schedule, asset);
      return {
        ...schedule,
        asset,
        statusInfo,
      };
    });
  }, [schedules, assetMap]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let total = enhancedSchedules.length;
    let dueToday = 0;
    let soon = 0;
    let overdue = 0;

    enhancedSchedules.forEach((item) => {
      if (item.statusInfo.status === 'overdue') overdue++;
      else if (item.statusInfo.status === 'due') dueToday++;
      else if (item.statusInfo.status === 'soon') soon++;
    });

    return { total, dueToday, soon, overdue };
  }, [enhancedSchedules]);

  // Active Reminder alerts to highlight in banner
  const activeAlerts = useMemo(() => {
    const alerts: { id: string; message: string; isOverdue: boolean }[] = [];
    enhancedSchedules.forEach((item) => {
      const alert = shouldShowReminderAlert(item, item.asset);
      if (alert.showAlert) {
        alerts.push({
          id: item.id,
          message: alert.message,
          isOverdue: item.statusInfo.status === 'overdue',
        });
      }
    });
    return alerts;
  }, [enhancedSchedules]);

  // Split schedules into "Perlu Perhatian" vs "Jadwal Mendatang"
  const { urgentSchedules, upcomingSchedules } = useMemo(() => {
    const urgent: typeof enhancedSchedules = [];
    const upcoming: typeof enhancedSchedules = [];

    // Filter by search & category first
    const filtered = enhancedSchedules.filter((item) => {
      const matchSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.asset && item.asset.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchAsset = selectedAssetFilter === 'all' || item.assetId === selectedAssetFilter;

      return matchSearch && matchCat && matchAsset;
    });

    filtered.forEach((item) => {
      if (item.statusInfo.status === 'overdue' || item.statusInfo.status === 'due' || item.statusInfo.status === 'soon') {
        urgent.push(item);
      } else {
        upcoming.push(item);
      }
    });

    // Prioritaskan Perlu Perhatian: 1. Terlambat, 2. Jatuh tempo hari ini, 3. Segera
    const rank: Record<MaintenanceStatus, number> = {
      overdue: 1,
      due: 2,
      soon: 3,
      safe: 4,
      completed: 5,
    };

    urgent.sort((a, b) => {
      const rA = rank[a.statusInfo.status] || 99;
      const rB = rank[b.statusInfo.status] || 99;
      if (rA !== rB) return rA - rB;
      // Secondary: nextDate
      if (a.nextDate && b.nextDate) return a.nextDate.localeCompare(b.nextDate);
      return 0;
    });

    // Sort upcoming by nextDate ascending
    upcoming.sort((a, b) => {
      if (a.nextDate && b.nextDate) return a.nextDate.localeCompare(b.nextDate);
      return 0;
    });

    return { urgentSchedules: urgent, upcomingSchedules: upcoming };
  }, [enhancedSchedules, searchQuery, categoryFilter, selectedAssetFilter]);

  // Filtered Records for Riwayat Perawatan
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch = 
        rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchAsset = selectedAssetFilter === 'all' || rec.assetId === selectedAssetFilter;
      return matchSearch && matchAsset;
    }).sort((a, b) => b.completionDate.localeCompare(a.completionDate));
  }, [records, searchQuery, selectedAssetFilter]);

  // Total biaya riwayat perawatan
  const totalHistoryCost = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.actualCost, 0);
  }, [filteredRecords]);

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case 'Kendaraan': return <Car className="w-4 h-4 text-emerald-600" />;
      case 'Mesin': return <Wrench className="w-4 h-4 text-emerald-600" />;
      case 'Peralatan': return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'Elektronik': return <Laptop className="w-4 h-4 text-emerald-600" />;
      case 'Bangunan': return <Building className="w-4 h-4 text-emerald-600" />;
      case 'Keamanan': return <Shield className="w-4 h-4 text-emerald-600" />;
      default: return <Cpu className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Jadwal & Perawatan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium ml-0 sm:ml-10">
            Kelola jadwal perawatan dan pengingat aset Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenAddAsset()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>+ Tambah Aset</span>
          </button>
          <button
            onClick={() => handleOpenAddSchedule()}
            className="px-4 py-2.5 bg-[#007a52] hover:bg-[#006644] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Reminder Alert Banner (Pengingat Aktif) */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                alert.isOverdue
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {alert.isOverdue ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </div>
                <p className="text-xs sm:text-sm font-semibold">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => {
                  const target = schedules.find((s) => s.id === alert.id);
                  if (target) handleOpenScheduleDetail(target);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                Lihat Jadwal
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Semua Jadwal */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Semua Jadwal</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-500 font-medium">Jadwal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total jadwal aset terdaftar</p>
        </div>

        {/* Hari Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hari Ini</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              metrics.dueToday > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              metrics.dueToday > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {metrics.dueToday}
            </span>
            <span className="text-xs text-slate-500 font-medium">Jatuh Tempo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Jadwal servis hari ini</p>
        </div>

        {/* Segera */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Segera</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.soon}</span>
            <span className="text-xs text-slate-500 font-medium">Perawatan</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Jatuh tempo 1 - 14 hari lagi</p>
        </div>

        {/* Terlambat */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Terlambat</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              metrics.overdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              metrics.overdue > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {metrics.overdue}
            </span>
            <span className="text-xs text-slate-500 font-medium">Terlewat</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Perlu segera dilakukan servis</p>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'schedules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jadwal Perawatan ({schedules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('assets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'assets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Aset ({assets.length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Perawatan ({records.length})
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jadwal atau aset..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeSubTab !== 'assets' && (
            <select
              value={selectedAssetFilter}
              onChange={(e) => setSelectedAssetFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Aset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: JADWAL PERAWATAN */}
      {/* ======================================================== */}
      {activeSubTab === 'schedules' && (
        <div className="space-y-8">
          {schedules.length === 0 ? (
            <div className="p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                <Wrench className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Belum Ada Jadwal Perawatan
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Mulai pencatatan pemeliharaan aset Anda dari 0. Daftarkan aset kendaraan atau fasilitas, lalu tetapkan jadwal servis berkala agar pengingat otomatis aktif.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                {assets.length === 0 ? (
                  <button
                    onClick={() => handleOpenAddAsset()}
                    className="px-5 py-2.5 bg-[#007a52] hover:bg-[#006644] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Aset Pertama</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAddSchedule()}
                    className="px-5 py-2.5 bg-[#007a52] hover:bg-[#006644] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Buat Jadwal Pertama</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: PERLU PERHATIAN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Perlu Perhatian</span>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {urgentSchedules.length}
                      </span>
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    Prioritas: Terlambat &bull; Jatuh tempo hari ini &bull; Segera
                  </span>
                </div>

                {urgentSchedules.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Semua Perawatan Aman!
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Tidak ada jadwal servis yang terlambat atau mendesak saat ini. Seluruh aset Anda dalam kondisi terawat dengan baik.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {urgentSchedules.map((item) => (
                      <ScheduleCard
                        key={item.id}
                        schedule={item}
                        asset={item.asset}
                        onOpenDetail={() => handleOpenScheduleDetail(item)}
                        onOpenComplete={() => handleOpenCompleteSchedule(item)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: JADWAL MENDATANG */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Jadwal Mendatang</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {upcomingSchedules.length}
                    </span>
                  </h2>
                  <span className="text-xs text-slate-400">
                    Terjadwal rapi dan berulang
                  </span>
                </div>

                {upcomingSchedules.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
                    <p className="text-xs text-slate-400 italic">
                      Belum ada jadwal mendatang lainnya. Klik <strong>"+ Tambah Jadwal"</strong> untuk menambahkan servis berkala.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {upcomingSchedules.map((item) => (
                      <ScheduleCard
                        key={item.id}
                        schedule={item}
                        asset={item.asset}
                        onOpenDetail={() => handleOpenScheduleDetail(item)}
                        onOpenComplete={() => handleOpenCompleteSchedule(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: DAFTAR ASET */}
      {/* ======================================================== */}
      {activeSubTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Aset Terdaftar
              </h3>
              <p className="text-xs text-slate-500">
                Kelola data unit kendaraan, mesin pabrik, dan inventaris penting.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddAsset()}
              className="px-3.5 py-2 bg-[#007a52] hover:bg-[#006644] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Aset Baru</span>
            </button>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Car className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Belum Ada Aset Terdaftar
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tambahkan aset Anda (seperti mobil, motor, genset, AC) untuk mulai menjadwalkan perawatannya.
              </p>
              <button
                onClick={() => handleOpenAddAsset()}
                className="px-4 py-2 bg-[#007a52] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                + Buat Aset Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => {
                const assetSchedules = schedules.filter((s) => s.assetId === asset.id);
                const unit = asset.meterUnit || 'km';

                return (
                  <div
                    key={asset.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Category & Status Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            {getCategoryIcon(asset.category)}
                          </div>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {asset.category}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          asset.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {asset.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      {/* Asset Title & Details */}
                      <h4 className="font-black text-slate-900 text-base">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {asset.brand} {asset.model} {asset.year ? `(${asset.year})` : ''}
                      </p>

                      {/* Meter Reading Info */}
                      {asset.currentMeter !== undefined && (
                        <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {asset.category === 'Mesin' ? 'Hour Meter' : 'Odometer'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {asset.currentMeter.toLocaleString('id-ID')} {unit}
                          </span>
                        </div>
                      )}

                      {/* Notes if available */}
                      {asset.notes && (
                        <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 italic">
                          "{asset.notes}"
                        </p>
                      )}

                      {/* Active Schedules Badge */}
                      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{assetSchedules.length} Jadwal Perawatan Terdaftar</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenAddSchedule(asset.id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Jadwal</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditAsset(asset)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Aset"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus aset "${asset.name}" beserta jadwal perawatannya?`)) {
                              onDeleteAsset(asset.id);
                              showToast('Aset berhasil dihapus');
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Aset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: RIWAYAT PERAWATAN */}
      {/* ======================================================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Riwayat Perawatan Aset
              </h3>
              <p className="text-xs text-slate-500">
                Daftar perawatan dan perbaikan yang telah selesai dilakukan.
              </p>
            </div>
            <div className="flex items-baseline gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800">Total Biaya Perawatan:</span>
              <span className="text-base font-black text-emerald-950">
                {formatRupiah(totalHistoryCost)}
              </span>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <p className="text-xs text-slate-400 italic">
                Belum ada data riwayat perawatan. Tandai selesai jadwal perawatan untuk mencatatnya ke riwayat.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Aset</th>
                      <th className="py-3 px-4">Perawatan</th>
                      <th className="py-3 px-4">KM / Hour Meter</th>
                      <th className="py-3 px-4 text-right">Biaya Aktual</th>
                      <th className="py-3 px-4">Catatan</th>
                      {onDeleteRecord && <th className="py-3 px-4 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {formatIndoDate(rec.completionDate)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {rec.assetName}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{rec.title}</span>
                            {rec.recordedAsExpense && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Tercatat otomatis di Pengeluaran & Budget">
                                <Receipt className="w-3 h-3" />
                                <span>Pengeluaran</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {rec.meterReading !== undefined
                            ? `${rec.meterReading.toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-800 whitespace-nowrap">
                          {formatRupiah(rec.actualCost)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {rec.notes || '-'}
                        </td>
                        {onDeleteRecord && (
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                if (window.confirm('Hapus entri riwayat ini?')) {
                                  onDeleteRecord(rec.id);
                                  showToast('Riwayat berhasil dihapus');
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Riwayat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setAssetToEdit(null);
        }}
        onSave={handleSaveAsset}
        assetToEdit={assetToEdit}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
          setPreselectedAssetId(undefined);
        }}
        onSave={handleSaveSchedule}
        scheduleToEdit={scheduleToEdit}
        assets={assets}
        preselectedAssetId={preselectedAssetId}
      />

      <CompleteMaintenanceModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setScheduleToComplete(null);
        }}
        schedule={scheduleToComplete}
        asset={scheduleToComplete ? assetMap.get(scheduleToComplete.assetId) : undefined}
        onComplete={handleCompleteSubmit}
      />

      <MaintenanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setScheduleForDetail(null);
        }}
        schedule={scheduleForDetail}
        asset={scheduleForDetail ? assetMap.get(scheduleForDetail.assetId) : undefined}
        records={scheduleForDetail ? records.filter((r) => r.scheduleId === scheduleForDetail.id) : []}
        onOpenEdit={handleOpenEditSchedule}
        onOpenComplete={handleOpenCompleteSchedule}
        onDeleteSchedule={(schedId) => {
          onDeleteSchedule(schedId);
          showToast('Jadwal perawatan berhasil dihapus');
          setIsDetailModalOpen(false);
          setScheduleForDetail(null);
        }}
      />

    </div>
  );
};

// ==========================================
// SUB-COMPONENT: SCHEDULE CARD
// ==========================================
interface ScheduleCardProps {
  schedule: MaintenanceSchedule & {
    asset?: AssetItem;
    statusInfo: ReturnType<typeof getMaintenanceStatusInfo>;
  };
  asset?: AssetItem;
  onOpenDetail: () => void;
  onOpenComplete: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  asset,
  onOpenDetail,
  onOpenComplete,
}) => {
  const { statusInfo } = schedule;
  const unit = asset?.meterUnit || (schedule.intervalMethod === 'hours' ? 'Jam' : 'KM');

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
      <div>
        
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            {statusInfo.label}
          </span>

          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {schedule.category}
          </span>
        </div>

        {/* Asset Title & Perawatan */}
        <div className="text-xs font-semibold text-emerald-800 mb-0.5 flex items-center gap-1">
          <Car className="w-3.5 h-3.5" />
          <span>{asset?.name || 'Aset Terkait'}</span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-[#007a52] transition-colors">
          {schedule.title}
        </h3>

        {/* Status Reason Callout */}
        <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between text-slate-700">
          <span className="font-semibold text-[11px] text-slate-500">Status Waktu / Meter:</span>
          <span className="font-bold text-[11px] text-slate-900">{statusInfo.reason}</span>
        </div>

        {/* Due Date & Targets */}
        <div className="mt-3 space-y-1 text-xs">
          {schedule.nextDate && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Jatuh Tempo:</span>
              </span>
              <span className="font-bold text-slate-800">{formatIndoDate(schedule.nextDate)}</span>
            </div>
          )}

          {schedule.nextMeter !== undefined && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-slate-400" />
                <span>Target {unit}:</span>
              </span>
              <span className="font-bold text-slate-800">
                {schedule.nextMeter.toLocaleString('id-ID')} {unit}
              </span>
            </div>
          )}

          {schedule.estimatedCost !== undefined && (
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Estimasi Biaya:</span>
              <span className="font-bold text-emerald-800">{formatRupiah(schedule.estimatedCost)}</span>
            </div>
          )}
        </div>

      </div>

      {/* Footer Buttons */}
      <div className="flex items-center gap-2 pt-3.5 mt-3.5 border-t border-slate-100">
        <button
          onClick={onOpenDetail}
          className="flex-1 py-2 px-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors text-center cursor-pointer"
        >
          Detail
        </button>
        <button
          onClick={onOpenComplete}
          className="flex-1 py-2 px-2.5 text-xs font-bold text-white bg-[#007a52] hover:bg-[#006644] rounded-xl transition-colors shadow-2xs text-center flex items-center justify-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Tandai Selesai</span>
        </button>
      </div>

    </div>
  );
};
