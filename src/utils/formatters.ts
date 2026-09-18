import { ExpenseCategory, IncomeSource, PaylaterProvider } from '../types';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatShortRupiah = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
};

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const getMonthName = (monthIndex: number): string => {
  return MONTH_NAMES_ID[monthIndex] || '';
};

export const formatFullDateID = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export const PROVIDER_META: Record<
  PaylaterProvider,
  { name: string; color: string; bgLight: string; textColor: string; badgeBg: string }
> = {
  spaylater: {
    name: 'SPayLater',
    color: '#EE4D2D',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  gopaylater: {
    name: 'GoPay Later',
    color: '#00AA13',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  kredivo: {
    name: 'Kredivo',
    color: '#F47C20',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  akulaku: {
    name: 'Akulaku',
    color: '#E53935',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  indodana: {
    name: 'Indodana',
    color: '#0083CA',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-600',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  traveloka: {
    name: 'Traveloka PayLater',
    color: '#0194F3',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  homecredit: {
    name: 'Home Credit',
    color: '#D32F2F',
    bgLight: 'bg-red-50',
    textColor: 'text-red-600',
    badgeBg: 'bg-red-100 text-red-800 border-red-200',
  },
  kartu_kredit: {
    name: 'Kartu Kredit',
    color: '#4F46E5',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  lainnya: {
    name: 'Paylater / Cicilan Lain',
    color: '#0F766E',
    bgLight: 'bg-teal-50',
    textColor: 'text-teal-600',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
  },
};

export const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; iconName: string; color: string; bg: string }
> = {
  makanan: { label: 'Makanan & Minuman', iconName: 'Utensils', color: '#F97316', bg: 'bg-orange-100 text-orange-700' },
  transportasi: { label: 'Transportasi & Bensin', iconName: 'Car', color: '#3B82F6', bg: 'bg-blue-100 text-blue-700' },
  belanja: { label: 'Belanja & Lifestyle', iconName: 'ShoppingBag', color: '#EC4899', bg: 'bg-pink-100 text-pink-700' },
  tagihan_rumah: { label: 'Tagihan Rumah & Utilitas', iconName: 'Home', color: '#8B5CF6', bg: 'bg-purple-100 text-purple-700' },
  hiburan: { label: 'Hiburan & Hobi', iconName: 'Film', color: '#EAB308', bg: 'bg-yellow-100 text-yellow-800' },
  kesehatan: { label: 'Kesehatan & Medis', iconName: 'HeartPulse', color: '#EF4444', bg: 'bg-red-100 text-red-700' },
  pendidikan: { label: 'Pendidikan & Kursus', iconName: 'GraduationCap', color: '#06B6D4', bg: 'bg-cyan-100 text-cyan-700' },
  keluarga: { label: 'Keluarga & Anak', iconName: 'Users', color: '#10B981', bg: 'bg-emerald-100 text-emerald-700' },
  investasi: { label: 'Investasi & Tabungan', iconName: 'TrendingUp', color: '#059669', bg: 'bg-teal-100 text-teal-700' },
  lainnya: { label: 'Pengeluaran Lainnya', iconName: 'MoreHorizontal', color: '#64748B', bg: 'bg-slate-100 text-slate-700' },
};

export const INCOME_SOURCE_META: Record<
  IncomeSource,
  { label: string; color: string; bg: string }
> = {
  gaji: { label: 'Gaji Pokok / Kantor', color: '#10B981', bg: 'bg-emerald-100 text-emerald-800' },
  freelance: { label: 'Freelance & Side Job', color: '#06B6D4', bg: 'bg-cyan-100 text-cyan-800' },
  bisnis: { label: 'Hasil Usaha / Bisnis', color: '#8B5CF6', bg: 'bg-purple-100 text-purple-800' },
  investasi: { label: 'Dividen & Investasi', color: '#F59E0B', bg: 'bg-amber-100 text-amber-800' },
  bonus: { label: 'Bonus / THR / Reward', color: '#EC4899', bg: 'bg-pink-100 text-pink-800' },
  lainnya: { label: 'Pemasukan Lainnya', color: '#64748B', bg: 'bg-slate-100 text-slate-800' },
};

/**
 * Generate Google Calendar reminder URL
 */
export const createGoogleCalendarUrl = (title: string, amount: number, dueDate: Date, providerName: string): string => {
  const formattedAmount = formatRupiah(amount);
  const eventTitle = encodeURIComponent(`[Terramora] Bayar Tagihan ${providerName}: ${title} (${formattedAmount})`);
  const details = encodeURIComponent(
    `Pengingat Tagihan Paylater Terramora:\nBarang/Transaksi: ${title}\nProvider: ${providerName}\nNominal: ${formattedAmount}\n\nSegera lunasi sebelum jatuh tempo agar terhindar dari denda!`
  );
  
  // Format date YYYYMMDD
  const y = dueDate.getFullYear();
  const m = String(dueDate.getMonth() + 1).padStart(2, '0');
  const d = String(dueDate.getDate()).padStart(2, '0');
  const dateString = `${y}${m}${d}`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${dateString}/${dateString}&details=${details}&location=Online`;
};

/**
 * Generate WhatsApp reminder share link
 */
export const createWhatsAppReminderUrl = (title: string, amount: number, dueDay: number, providerName: string, daysLeft: number): string => {
  let statusText = `Jatuh tempo: Tanggal ${dueDay}`;
  if (daysLeft < 0) {
    statusText = `⚠️ SUDAH LEWAT JATUH TEMPO (${Math.abs(daysLeft)} hari lalu)`;
  } else if (daysLeft === 0) {
    statusText = `🔴 JATUH TEMPO HARI INI!`;
  } else if (daysLeft === 1) {
    statusText = `⚡ Jatuh tempo BESOK!`;
  } else {
    statusText = `🗓️ Jatuh tempo ${daysLeft} hari lagi (Tgl ${dueDay})`;
  }

  const message = `*🔔 PENGINGAT TAGIHAN TERRAVA*\n\n` +
    `*Tagihan:* ${title}\n` +
    `*Layanan:* ${providerName}\n` +
    `*Nominal:* ${formatRupiah(amount)}\n` +
    `*Status:* ${statusText}\n\n` +
    `_Dicatat otomatis via Terramora Financial Manager_ 💳✨`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};

/**
 * Download .ics calendar event
 */
export const downloadIcsCalendar = (title: string, amount: number, dueDate: Date, providerName: string) => {
  const formattedAmount = formatRupiah(amount);
  const y = dueDate.getFullYear();
  const m = String(dueDate.getMonth() + 1).padStart(2, '0');
  const d = String(dueDate.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Terramora Paylater Manager//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:Bayar Tagihan ${providerName}: ${title} (${formattedAmount})`,
    `DESCRIPTION:Pengingat Tagihan Terramora untuk ${title} sebesar ${formattedAmount}.`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT9H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Pembayaran Tagihan Paylater',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `tagihan-${providerName.toLowerCase()}-${dateStr}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
