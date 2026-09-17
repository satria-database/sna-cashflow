import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Send, 
  Calendar as CalendarIcon, 
  Download, 
  BellRing,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { PaylaterItem } from '../types';
import { 
  formatRupiah, 
  PROVIDER_META, 
  createWhatsAppReminderUrl, 
  createGoogleCalendarUrl, 
  downloadIcsCalendar 
} from '../utils/formatters';
import confetti from 'canvas-confetti';

interface ReminderBannerProps {
  paylaterItems: PaylaterItem[];
  currentYear: number;
  currentMonth: number;
  onMarkAsPaid: (id: string) => void;
  onNavigateToPaylater: () => void;
  onEnableNotification: () => void;
  notificationPermission: NotificationPermission | 'default';
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  paylaterItems,
  currentYear,
  currentMonth,
  onMarkAsPaid,
  onNavigateToPaylater,
  onEnableNotification,
  notificationPermission,
}) => {
  const today = new Date();
  const currentDay = today.getDate();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  if (paylaterItems.length === 0) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Belum Ada Tagihan Paylater Aktif
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Mulai catat cicilan dan tanggal jatuh tempo agar sistem dapat memberi pengingat otomatis sebelum batas bayar.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToPaylater}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
        >
          <span>+ Catat Tagihan</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Filter items that are not paid this month
  const unpaidItems = paylaterItems.filter((item) => !item.isPaidThisMonth);

  if (unpaidItems.length === 0) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
              Luar Biasa! Semua Tagihan Paylater Bulan Ini Sudah Lunas 🎉
            </h4>
            <p className="text-xs sm:text-sm text-emerald-800">
              Tidak ada tagihan tertunda. Arus keuangan dan riwayat kredit Anda aman terjaga.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToPaylater}
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors"
        >
          Lihat Riwayat <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Calculate urgency for each unpaid item
  const reminders = unpaidItems.map((item) => {
    const dueDate = new Date(currentYear, currentMonth, item.dueDay);
    const diffTime = dueDate.getTime() - new Date(currentYear, currentMonth, currentDay).getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgency: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later' = 'later';
    if (daysLeft < 0) urgency = 'overdue';
    else if (daysLeft === 0) urgency = 'today';
    else if (daysLeft === 1) urgency = 'tomorrow';
    else if (daysLeft <= 7) urgency = 'soon';

    return {
      item,
      dueDate,
      daysLeft,
      urgency,
    };
  });

  // Sort by urgency: overdue first, then today, then soonest
  reminders.sort((a, b) => a.daysLeft - b.daysLeft);

  const urgentItems = reminders.filter((r) => r.daysLeft <= 7);
  const overdueCount = reminders.filter((r) => r.daysLeft < 0).length;
  const todayCount = reminders.filter((r) => r.daysLeft === 0).length;

  const handlePayClick = (id: string, title: string) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00C49F', '#00BFA5', '#10B981', '#F59E0B'],
    });
    onMarkAsPaid(id);
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Alert Header bar */}
      <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs transition-all ${
        overdueCount > 0 
          ? 'bg-rose-50/90 border-rose-200'
          : todayCount > 0 
            ? 'bg-amber-50/90 border-amber-200' 
            : 'bg-teal-50/70 border-teal-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              overdueCount > 0 ? 'bg-rose-100 text-rose-700' : todayCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {overdueCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Pengingat Tagihan Otomatis Terrava
                </h3>
                {overdueCount > 0 && (
                  <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {overdueCount} Lewat Jatuh Tempo!
                  </span>
                )}
                {todayCount > 0 && (
                  <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {todayCount} Jatuh Tempo Hari Ini
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {unpaidItems.length} tagihan belum dibayar bulan ini. Bayar tepat waktu untuk menjaga skor SLIK/BI Checking tetap prima.
              </p>
            </div>
          </div>

          {/* Browser Notification Switch */}
          {typeof window !== 'undefined' && 'Notification' in window && notificationPermission !== 'granted' && (
            <button
              onClick={onEnableNotification}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-colors shrink-0"
              title="Aktifkan Notifikasi Browser Otomatis"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aktifkan Notifikasi Desktop/HP</span>
            </button>
          )}
        </div>

        {/* List of Urgent Items */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reminders.slice(0, 3).map(({ item, daysLeft, urgency }) => {
            const providerInfo = PROVIDER_META[item.provider];
            const providerLabel = item.customProviderName || providerInfo.name;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${providerInfo.badgeBg}`}>
                      {providerLabel}
                    </span>
                    
                    {/* Status Badge */}
                    {daysLeft < 0 ? (
                      <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Telat {Math.abs(daysLeft)} hr
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="text-[11px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                        Hari Ini (Tgl {item.dueDay})
                      </span>
                    ) : daysLeft === 1 ? (
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                        Besok (Tgl {item.dueDay})
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {daysLeft} hari lagi (Tgl {item.dueDay})
                      </span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-800 text-sm line-clamp-1" title={item.title}>
                    {item.title}
                  </h5>

                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Cicilan ke-{item.currentTenor}/{item.totalTenor}</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatRupiah(item.monthlyInstallment)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  
                  {/* Share to WhatsApp */}
                  <a
                    href={createWhatsAppReminderUrl(item.title, item.monthlyInstallment, item.dueDay, providerLabel, daysLeft)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Kirim Pengingat ke WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>

                  {/* Google Calendar Link */}
                  <a
                    href={createGoogleCalendarUrl(item.title, item.monthlyInstallment, new Date(currentYear, currentMonth, item.dueDay), providerLabel)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Tambahkan ke Google Calendar"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </a>

                  {/* Download ICS */}
                  <button
                    onClick={() => downloadIcsCalendar(item.title, item.monthlyInstallment, new Date(currentYear, currentMonth, item.dueDay), providerLabel)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download Kalender (.ics) HP/Mac/Windows"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Mark Paid */}
                  <button
                    onClick={() => handlePayClick(item.id, item.title)}
                    className="ml-auto flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Bayar</span>
                  </button>

                </div>
              </div>
            );
          })}
        </div>

        {reminders.length > 3 && (
          <div className="mt-2 text-right">
            <button
              onClick={onNavigateToPaylater}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:underline"
            >
              Lihat {reminders.length - 3} tagihan lainnya &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
