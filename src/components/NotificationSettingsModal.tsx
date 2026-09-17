import React, { useState } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Check, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Send,
  Sparkles 
} from 'lucide-react';
import { ReminderSetting } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReminderSetting;
  onUpdateSettings: (settings: ReminderSetting) => void;
  onRequestBrowserPermission: () => Promise<boolean>;
  onTestNotification: () => void;
  permissionStatus: NotificationPermission | 'default';
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRequestBrowserPermission,
  onTestNotification,
  permissionStatus,
}) => {
  const [localSettings, setLocalSettings] = useState<ReminderSetting>(settings);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    const exists = localSettings.remindDaysBefore.includes(day);
    let updated: number[];
    if (exists) {
      updated = localSettings.remindDaysBefore.filter((d) => d !== day);
    } else {
      updated = [...localSettings.remindDaysBefore, day].sort((a, b) => b - a);
    }
    const newConfig = { ...localSettings, remindDaysBefore: updated };
    setLocalSettings(newConfig);
    onUpdateSettings(newConfig);
  };

  const handleToggleBrowserNotif = async () => {
    if (!localSettings.enableBrowserNotification) {
      const granted = await onRequestBrowserPermission();
      if (granted) {
        const newConfig = { ...localSettings, enableBrowserNotification: true };
        setLocalSettings(newConfig);
        onUpdateSettings(newConfig);
      }
    } else {
      const newConfig = { ...localSettings, enableBrowserNotification: false };
      setLocalSettings(newConfig);
      onUpdateSettings(newConfig);
    }
  };

  const handleTestClick = () => {
    onTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Pengaturan Pengingat Otomatis</h3>
              <p className="text-xs text-slate-500">Konfigurasi jadwal notifikasi tagihan paylater</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* 1. Browser Push Notification toggle */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-600" />
              Notifikasi Browser Web & HP
            </span>
            <p className="text-xs text-slate-500">
              Kirim pop-up banner otomatis saat mendekati jatuh tempo.
            </p>
            <div className="pt-1 text-[11px]">
              Status izin:{' '}
              <strong className={permissionStatus === 'granted' ? 'text-emerald-700' : 'text-amber-700'}>
                {permissionStatus === 'granted' ? 'Diizinkan (Aktif)' : 'Belum Diizinkan'}
              </strong>
            </div>
          </div>

          <button
            onClick={handleToggleBrowserNotif}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              localSettings.enableBrowserNotification && permissionStatus === 'granted'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {localSettings.enableBrowserNotification && permissionStatus === 'granted' ? 'Aktif' : 'Aktifkan'}
          </button>
        </div>

        {/* 2. Days before due date selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Kirim Pengingat Pada:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
            {[
              { days: 7, label: 'H-7 (1 Minggu)' },
              { days: 3, label: 'H-3 (3 Hari)' },
              { days: 1, label: 'H-1 (Besok)' },
              { days: 0, label: 'Hari-H (Hari Ini)' },
            ].map(({ days, label }) => {
              const isChecked = localSettings.remindDaysBefore.includes(days);
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => toggleDay(days)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Notification Time & Audio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Waktu Pengingat Pagi
            </label>
            <input
              type="time"
              value={localSettings.notificationTime}
              onChange={(e) => {
                const updated = { ...localSettings, notificationTime: e.target.value };
                setLocalSettings(updated);
                onUpdateSettings(updated);
              }}
              className="w-full px-2 py-1 text-sm bg-white font-bold rounded-lg border border-slate-300"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              {localSettings.autoSound ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              Suara Notifikasi
            </span>
            <button
              onClick={() => {
                const updated = { ...localSettings, autoSound: !localSettings.autoSound };
                setLocalSettings(updated);
                onUpdateSettings(updated);
              }}
              className="mt-1 text-xs font-semibold text-left text-slate-600 hover:text-slate-900"
            >
              {localSettings.autoSound ? '🔔 Suara diaktifkan' : '🔕 Mode hening'}
            </button>
          </div>
        </div>

        {/* 4. Test Notification Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleTestClick}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSent ? '✓ Notifikasi Terkirim!' : 'Kirim Tes Notifikasi'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#007a52] hover:bg-[#006644] rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
