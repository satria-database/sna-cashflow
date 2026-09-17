import { 
  AssetItem, 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  MaintenanceIntervalMethod,
  MaintenanceStatus,
  MaintenancePriority
} from '../types';

export const ASSET_CATEGORIES = [
  'Kendaraan',
  'Mesin',
  'Peralatan',
  'Elektronik',
  'Bangunan',
  'Keamanan',
  'Lainnya',
] as const;

export const MAINTENANCE_CATEGORIES = [
  'Oli & Pelumas',
  'Servis Berkala',
  'Pembersihan & Cuci',
  'Penggantian Filter',
  'Pemeriksaan Fisik',
  'Kalibrasi & Pengujian',
  'Sistem Rem & Suspensi',
  'Sistem Kelistrikan',
  'Perbaikan Mekanikal',
  'Masa Berlaku / Sertifikasi',
  'Lainnya',
] as const;

export const SAMPLE_ASSETS: AssetItem[] = [];

export const SAMPLE_MAINTENANCE_SCHEDULES: MaintenanceSchedule[] = [];

export const SAMPLE_MAINTENANCE_RECORDS: MaintenanceRecord[] = [];

export const SAMPLE_SCHEDULES: MaintenanceSchedule[] = [];
export const SAMPLE_RECORDS: MaintenanceRecord[] = [];

// Known sample/mock IDs to purge from persistent cache when starting fresh
export const LEGACY_MOCK_ASSET_IDS = new Set([
  'asset-avanza',
  'asset-beat',
  'asset-ac-meeting',
  'asset-genset',
  'asset-apar',
]);

export const LEGACY_MOCK_SCHEDULE_IDS = new Set([
  'sched-1',
  'sched-2',
  'sched-3',
  'sched-4',
  'sched-5',
]);

export const LEGACY_MOCK_RECORD_IDS = new Set([
  'rec-1',
  'rec-2',
]);

/**
 * Add months to date string (YYYY-MM-DD)
 */
export function addMonthsToDate(dateStr: string, months: number): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setMonth(date.getMonth() + months);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    const now = new Date();
    now.setMonth(now.getMonth() + months);
    return now.toISOString().split('T')[0];
  }
}

/**
 * Add days to date string (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now.toISOString().split('T')[0];
  }
}

/**
 * Calculates next date and next meter automatically
 */
export function calculateNextSchedule(
  lastDate?: string,
  lastMeter?: number,
  method: MaintenanceIntervalMethod = 'date',
  intervalMonths?: number,
  intervalKm?: number,
  intervalHours?: number
): { nextDate?: string; nextMeter?: number } {
  const baseDate = lastDate || new Date().toISOString().split('T')[0];
  let calculatedNextDate: string | undefined = undefined;
  let calculatedNextMeter: number | undefined = undefined;

  // Calculate Date if applicable
  if ((method === 'date' || method === 'date_km') && intervalMonths && intervalMonths > 0) {
    calculatedNextDate = addMonthsToDate(baseDate, intervalMonths);
  }

  // Calculate Meter if applicable
  if ((method === 'km' || method === 'date_km') && intervalKm && intervalKm > 0) {
    calculatedNextMeter = (lastMeter || 0) + intervalKm;
  } else if (method === 'hours' && intervalHours && intervalHours > 0) {
    calculatedNextMeter = (lastMeter || 0) + intervalHours;
  }

  return {
    nextDate: calculatedNextDate,
    nextMeter: calculatedNextMeter,
  };
}

/**
 * Calculates status automatically based on current date and asset meter
 */
export function getMaintenanceStatusInfo(
  schedule: MaintenanceSchedule,
  asset?: AssetItem,
  todayStr: string = new Date().toISOString().split('T')[0]
): {
  status: MaintenanceStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  reason: string;
  diffDays?: number;
  meterDiff?: number;
} {
  // If schedule is already marked completed and non-recurring
  if (schedule.status === 'completed' && !schedule.isRecurring) {
    return {
      status: 'completed',
      label: 'Selesai',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      dotColor: 'bg-blue-600',
      reason: 'Perawatan telah diselesaikan',
    };
  }

  let dateStatus: MaintenanceStatus = 'safe';
  let dateReason = '';
  let diffDays: number | undefined = undefined;

  if (schedule.nextDate) {
    const today = new Date(todayStr + 'T00:00:00');
    const target = new Date(schedule.nextDate + 'T00:00:00');
    diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      dateStatus = 'overdue';
      dateReason = `Terlambat ${Math.abs(diffDays)} hari`;
    } else if (diffDays === 0) {
      dateStatus = 'due';
      dateReason = 'Jatuh tempo hari ini';
    } else if (diffDays <= 7) {
      dateStatus = 'soon';
      dateReason = `${diffDays} hari lagi`;
    } else if (diffDays <= 14) {
      dateStatus = 'soon';
      dateReason = `${diffDays} hari lagi`;
    } else {
      dateStatus = 'safe';
      dateReason = `${diffDays} hari lagi`;
    }
  }

  let meterStatus: MaintenanceStatus = 'safe';
  let meterReason = '';
  let meterDiff: number | undefined = undefined;

  if (
    (schedule.intervalMethod === 'km' ||
      schedule.intervalMethod === 'date_km' ||
      schedule.intervalMethod === 'hours') &&
    schedule.nextMeter !== undefined &&
    asset?.currentMeter !== undefined
  ) {
    meterDiff = schedule.nextMeter - asset.currentMeter;
    const unit = asset.meterUnit || (schedule.intervalMethod === 'hours' ? 'jam' : 'km');

    if (meterDiff < 0) {
      meterStatus = 'overdue';
      meterReason = `Lewat ${Math.abs(meterDiff).toLocaleString('id-ID')} ${unit}`;
    } else if (meterDiff === 0) {
      meterStatus = 'due';
      meterReason = `Mencapai target meter (${schedule.nextMeter.toLocaleString('id-ID')} ${unit})`;
    } else {
      const threshold = schedule.intervalKm ? Math.min(500, schedule.intervalKm * 0.1) : 500;
      if (meterDiff <= threshold) {
        meterStatus = 'soon';
        meterReason = `Sisa ${meterDiff.toLocaleString('id-ID')} ${unit}`;
      } else {
        meterStatus = 'safe';
        meterReason = `Sisa ${meterDiff.toLocaleString('id-ID')} ${unit}`;
      }
    }
  }

  // Combine priorities: overdue > due > soon > safe
  const priorityRank: Record<MaintenanceStatus, number> = {
    overdue: 4,
    due: 3,
    soon: 2,
    safe: 1,
    completed: 0,
  };

  const rankDate = priorityRank[dateStatus] || 1;
  const rankMeter = priorityRank[meterStatus] || 1;

  let finalStatus: MaintenanceStatus = dateStatus;
  let finalReason = dateReason;

  if (rankMeter > rankDate) {
    finalStatus = meterStatus;
    finalReason = meterReason;
  } else if (rankMeter === rankDate && rankMeter > 1) {
    // Combine reason if both are urgent
    finalStatus = dateStatus;
    finalReason = [dateReason, meterReason].filter(Boolean).join(' • ');
  } else if (!finalReason) {
    finalReason = meterReason || 'Jadwal terjadwal aman';
  }

  switch (finalStatus) {
    case 'overdue':
      return {
        status: 'overdue',
        label: 'Terlambat',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
        dotColor: 'bg-rose-600',
        reason: finalReason || 'Jadwal telah terlewati',
        diffDays,
        meterDiff,
      };
    case 'due':
      return {
        status: 'due',
        label: 'Jatuh Tempo',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-300',
        dotColor: 'bg-amber-500',
        reason: finalReason || 'Perlu dilakukan hari ini',
        diffDays,
        meterDiff,
      };
    case 'soon':
      return {
        status: 'soon',
        label: 'Segera',
        badgeBg: 'bg-amber-50/70',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        dotColor: 'bg-amber-400',
        reason: finalReason || 'Mendekati jadwal perawatan',
        diffDays,
        meterDiff,
      };
    case 'safe':
    default:
      return {
        status: 'safe',
        label: 'Aman',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        dotColor: 'bg-[#007a52]',
        reason: finalReason || 'Masih dalam batas normal',
        diffDays,
        meterDiff,
      };
  }
}

/**
 * Checks if a maintenance schedule needs immediate attention
 */
export function isUrgentSchedule(schedule: MaintenanceSchedule, asset?: AssetItem): boolean {
  const { status } = getMaintenanceStatusInfo(schedule, asset);
  return status === 'overdue' || status === 'due';
}

/**
 * Counts total schedules that are overdue or due today
 */
export function getUrgentMaintenanceCount(schedules: MaintenanceSchedule[], assets: AssetItem[] = []): number {
  const assetMap = new Map<string, AssetItem>();
  assets.forEach((a) => assetMap.set(a.id, a));
  return schedules.filter((s) => isUrgentSchedule(s, assetMap.get(s.assetId))).length;
}

/**
 * Checks if reminder alert should be triggered based on user's reminder setting
 */
export function shouldShowReminderAlert(
  schedule: MaintenanceSchedule,
  asset?: AssetItem,
  todayStr: string = new Date().toISOString().split('T')[0]
): { showAlert: boolean; message: string } {
  if (schedule.status === 'completed' && !schedule.isRecurring) {
    return { showAlert: false, message: '' };
  }

  const assetName = asset ? asset.name : 'Aset';
  const { status, diffDays, meterDiff } = getMaintenanceStatusInfo(schedule, asset, todayStr);

  if (status === 'overdue') {
    return {
      showAlert: true,
      message: `⚠️ ${schedule.title} (${assetName}) sudah terlambat ${Math.abs(diffDays || 0)} hari! Harap segera lakukan perawatan.`,
    };
  }

  if (status === 'due') {
    return {
      showAlert: true,
      message: `🔔 ${schedule.title} (${assetName}) jatuh tempo hari ini!`,
    };
  }

  // Check reminder rule
  if (diffDays !== undefined && diffDays > 0) {
    let matchesReminder = false;
    switch (schedule.reminder) {
      case '30_days':
        matchesReminder = diffDays <= 30;
        break;
      case '14_days':
        matchesReminder = diffDays <= 14;
        break;
      case '7_days':
        matchesReminder = diffDays <= 7;
        break;
      case '1_day':
        matchesReminder = diffDays <= 1;
        break;
      case 'on_due_date':
        matchesReminder = diffDays === 0;
        break;
      case 'none':
      default:
        matchesReminder = false;
        break;
    }

    if (matchesReminder) {
      return {
        showAlert: true,
        message: `🔔 ${schedule.title} (${assetName}) akan jatuh tempo dalam ${diffDays} hari.`,
      };
    }
  }

  if (meterDiff !== undefined && meterDiff <= 500 && meterDiff >= 0) {
    const unit = asset?.meterUnit || 'km';
    return {
      showAlert: true,
      message: `🔔 ${schedule.title} (${assetName}) mendekati batas servis (sisa ${meterDiff.toLocaleString('id-ID')} ${unit}).`,
    };
  }

  return { showAlert: false, message: '' };
}

/**
 * Format interval method label in Indonesian
 */
export function getIntervalMethodLabel(method: MaintenanceIntervalMethod): string {
  switch (method) {
    case 'date':
      return 'Berdasarkan Tanggal';
    case 'km':
      return 'Berdasarkan Kilometer';
    case 'hours':
      return 'Berdasarkan Jam Kerja';
    case 'date_km':
      return 'Tanggal + Kilometer';
    default:
      return method;
  }
}

/**
 * Format reminder option label in Indonesian
 */
export function getReminderOptionLabel(reminder: string): string {
  switch (reminder) {
    case '30_days':
      return '30 hari sebelumnya';
    case '14_days':
      return '14 hari sebelumnya';
    case '7_days':
      return '7 hari sebelumnya';
    case '1_day':
      return '1 hari sebelumnya';
    case 'on_due_date':
      return 'Hari H (Jatuh Tempo)';
    case 'none':
      return 'Tidak ada pengingat';
    default:
      return reminder;
  }
}

/**
 * Helper to format date into Indonesian localized readable string
 */
export function formatIndoDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
