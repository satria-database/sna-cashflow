import React, { useState, useEffect } from 'react';
import { X, Calendar, Wrench, Clock, Check, Sparkles } from 'lucide-react';
import { 
  MaintenanceSchedule, 
  AssetItem, 
  MaintenanceIntervalMethod, 
  MaintenancePriority,
  MaintenanceReminderOption 
} from '../../types';
import { 
  MAINTENANCE_CATEGORIES, 
  calculateNextSchedule,
  getReminderOptionLabel,
  addMonthsToDate
} from '../../utils/maintenanceUtils';
import { formatRupiah } from '../../utils/formatters';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: MaintenanceSchedule) => void;
  scheduleToEdit?: MaintenanceSchedule | null;
  assets: AssetItem[];
  preselectedAssetId?: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  scheduleToEdit,
  assets,
  preselectedAssetId,
}) => {
  const [assetId, setAssetId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(MAINTENANCE_CATEGORIES[0] as string);
  const [intervalMethod, setIntervalMethod] = useState<MaintenanceIntervalMethod>('date');
  const [lastDate, setLastDate] = useState('');
  const [lastMeter, setLastMeter] = useState<string>('');
  const [intervalMonths, setIntervalMonths] = useState<string>('6');
  const [intervalKm, setIntervalKm] = useState<string>('5000');
  const [intervalHours, setIntervalHours] = useState<string>('100');
  const [nextDate, setNextDate] = useState('');
  const [nextMeter, setNextMeter] = useState<string>('');
  const [priority, setPriority] = useState<MaintenancePriority>('medium');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [reminder, setReminder] = useState<MaintenanceReminderOption>('7_days');
  const [isRecurring, setIsRecurring] = useState(true);
  const [notes, setNotes] = useState('');

  const selectedAsset = assets.find((a) => a.id === assetId);

  useEffect(() => {
    if (scheduleToEdit) {
      setAssetId(scheduleToEdit.assetId);
      setTitle(scheduleToEdit.title);
      setCategory(scheduleToEdit.category);
      setIntervalMethod(scheduleToEdit.intervalMethod);
      setLastDate(scheduleToEdit.lastDate || '');
      setLastMeter(scheduleToEdit.lastMeter !== undefined ? String(scheduleToEdit.lastMeter) : '');
      setIntervalMonths(scheduleToEdit.intervalMonths ? String(scheduleToEdit.intervalMonths) : '');
      setIntervalKm(scheduleToEdit.intervalKm ? String(scheduleToEdit.intervalKm) : '');
      setIntervalHours(scheduleToEdit.intervalHours ? String(scheduleToEdit.intervalHours) : '');
      setNextDate(scheduleToEdit.nextDate || '');
      setNextMeter(scheduleToEdit.nextMeter !== undefined ? String(scheduleToEdit.nextMeter) : '');
      setPriority(scheduleToEdit.priority);
      setEstimatedCost(scheduleToEdit.estimatedCost ? String(scheduleToEdit.estimatedCost) : '');
      setReminder(scheduleToEdit.reminder);
      setIsRecurring(scheduleToEdit.isRecurring);
      setNotes(scheduleToEdit.notes || '');
    } else {
      const initialAsset = preselectedAssetId || (assets.length > 0 ? assets[0].id : '');
      setAssetId(initialAsset);
      setTitle('');
      setCategory('Oli & Pelumas');
      setIntervalMethod('date_km');
      
      const today = new Date().toISOString().split('T')[0];
      setLastDate(today);

      const foundAsset = assets.find((a) => a.id === initialAsset);
      if (foundAsset?.currentMeter) {
        setLastMeter(String(foundAsset.currentMeter));
      } else {
        setLastMeter('');
      }

      setIntervalMonths('6');
      setIntervalKm('5000');
      setIntervalHours('100');
      
      // Auto default calculate
      const defNextDate = addMonthsToDate(today, 6);
      setNextDate(defNextDate);
      if (foundAsset?.currentMeter) {
        setNextMeter(String(foundAsset.currentMeter + 5000));
      } else {
        setNextMeter('5000');
      }

      setPriority('medium');
      setEstimatedCost('');
      setReminder('7_days');
      setIsRecurring(true);
      setNotes('');
    }
  }, [scheduleToEdit, isOpen, preselectedAssetId, assets]);

  // When changing asset in dropdown, pre-populate lastMeter if empty
  const handleAssetChange = (newAssetId: string) => {
    setAssetId(newAssetId);
    const a = assets.find((item) => item.id === newAssetId);
    if (a && a.currentMeter !== undefined && !lastMeter) {
      setLastMeter(String(a.currentMeter));
    }
  };

  // Auto calculation trigger
  const runAutoCalculation = (
    method: MaintenanceIntervalMethod = intervalMethod,
    baseLastDate: string = lastDate,
    baseLastMeter: string = lastMeter,
    monthsStr: string = intervalMonths,
    kmStr: string = intervalKm,
    hoursStr: string = intervalHours
  ) => {
    const lMeter = baseLastMeter ? parseFloat(baseLastMeter) : (selectedAsset?.currentMeter || 0);
    const months = monthsStr ? parseInt(monthsStr, 10) : undefined;
    const km = kmStr ? parseInt(kmStr, 10) : undefined;
    const hours = hoursStr ? parseInt(hoursStr, 10) : undefined;

    const result = calculateNextSchedule(
      baseLastDate,
      lMeter,
      method,
      months,
      km,
      hours
    );

    if (result.nextDate) {
      setNextDate(result.nextDate);
    }
    if (result.nextMeter !== undefined) {
      setNextMeter(String(result.nextMeter));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assetId) return;

    const newSchedule: MaintenanceSchedule = {
      id: scheduleToEdit ? scheduleToEdit.id : `sched-${Date.now()}`,
      assetId,
      title: title.trim(),
      category,
      intervalMethod,
      lastDate: lastDate || undefined,
      lastMeter: lastMeter !== '' ? parseFloat(lastMeter) : undefined,
      nextDate: nextDate || undefined,
      nextMeter: nextMeter !== '' ? parseFloat(nextMeter) : undefined,
      intervalMonths: intervalMonths ? parseInt(intervalMonths, 10) : undefined,
      intervalKm: intervalKm ? parseInt(intervalKm, 10) : undefined,
      intervalHours: intervalHours ? parseInt(intervalHours, 10) : undefined,
      priority,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      reminder,
      notes: notes.trim() || undefined,
      isRecurring,
      createdAt: scheduleToEdit ? scheduleToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {scheduleToEdit ? 'Edit Jadwal Perawatan' : 'Tambah Jadwal Perawatan'}
              </h3>
              <p className="text-xs text-slate-500">
                Otomatisasi pengingat dan perhitungan servis berkala
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Pilih Aset & Nama Perawatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Aset <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={assetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {assets.length === 0 && (
                  <option value="">(Belum ada aset - Buat aset terlebih dahulu)</option>
                )}
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Servis
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {MAINTENANCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Perawatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Perawatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Ganti Oli Mesin & Filter, Cuci AC Berkala, Servis CVT"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Metode Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Metode Interval Perawatan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'date', label: 'Berdasarkan Tanggal' },
                { id: 'km', label: 'Berdasarkan KM' },
                { id: 'hours', label: 'Jam Kerja (Hours)' },
                { id: 'date_km', label: 'Tanggal + KM' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    const m = item.id as MaintenanceIntervalMethod;
                    setIntervalMethod(m);
                    runAutoCalculation(m);
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    intervalMethod === item.id
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Baseline Terakhir & Interval */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Data Servis Terakhir & Interval</span>
              </span>
              <button
                type="button"
                onClick={() => runAutoCalculation()}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Hitung Otomatis</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tanggal Terakhir */}
              {(intervalMethod === 'date' || intervalMethod === 'date_km') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tanggal Terakhir Dilakukan
                  </label>
                  <input
                    type="date"
                    value={lastDate}
                    onChange={(e) => {
                      setLastDate(e.target.value);
                      runAutoCalculation(intervalMethod, e.target.value, lastMeter);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* KM/Hour Terakhir */}
              {(intervalMethod === 'km' || intervalMethod === 'date_km' || intervalMethod === 'hours') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {intervalMethod === 'hours' ? 'Hour Meter Terakhir' : 'Kilometer Terakhir'}
                  </label>
                  <input
                    type="number"
                    value={lastMeter}
                    onChange={(e) => {
                      setLastMeter(e.target.value);
                      runAutoCalculation(intervalMethod, lastDate, e.target.value);
                    }}
                    placeholder={intervalMethod === 'hours' ? 'Contoh: 245' : 'Contoh: 43500'}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Interval Bulan */}
              {(intervalMethod === 'date' || intervalMethod === 'date_km') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Interval Waktu (Bulan)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={intervalMonths}
                    onChange={(e) => {
                      setIntervalMonths(e.target.value);
                      runAutoCalculation(intervalMethod, lastDate, lastMeter, e.target.value, intervalKm, intervalHours);
                    }}
                    placeholder="Misal: 6 bulan"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Interval KM */}
              {(intervalMethod === 'km' || intervalMethod === 'date_km') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Interval Jarak (Kilometer)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={intervalKm}
                    onChange={(e) => {
                      setIntervalKm(e.target.value);
                      runAutoCalculation(intervalMethod, lastDate, lastMeter, intervalMonths, e.target.value, intervalHours);
                    }}
                    placeholder="Misal: 5000 km"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Interval Hours */}
              {intervalMethod === 'hours' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Interval Jam Kerja (Hours)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={intervalHours}
                    onChange={(e) => {
                      setIntervalHours(e.target.value);
                      runAutoCalculation(intervalMethod, lastDate, lastMeter, intervalMonths, intervalKm, e.target.value);
                    }}
                    placeholder="Misal: 100 jam"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Jadwal Berikutnya (Hasil Perhitungan Otomatis & Dapat Disesuaikan) */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Target Jadwal Berikutnya (Kondisi yang Lebih Dulu Tercapai)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(intervalMethod === 'date' || intervalMethod === 'date_km') && (
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Tanggal Jatuh Tempo Berikutnya
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {(intervalMethod === 'km' || intervalMethod === 'date_km' || intervalMethod === 'hours') && (
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Target {intervalMethod === 'hours' ? 'Hour Meter' : 'Kilometer'} Servis
                  </label>
                  <input
                    type="number"
                    value={nextMeter}
                    onChange={(e) => setNextMeter(e.target.value)}
                    placeholder="Target meter servis..."
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Prioritas & Estimasi Biaya */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">Rendah (Pemeriksaan ringan / opsional)</option>
                <option value="medium">Sedang (Servis standar berkala)</option>
                <option value="high">Tinggi (Krusial / Keselamatan / Oli Utama)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimasi Biaya (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="Contoh: 650000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {estimatedCost && !isNaN(parseFloat(estimatedCost)) && (
                <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
                  {formatRupiah(parseFloat(estimatedCost))}
                </span>
              )}
            </div>
          </div>

          {/* Pengingat (Reminder) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pengingat Jatuh Tempo (Reminder)
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value as MaintenanceReminderOption)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="30_days">{getReminderOptionLabel('30_days')}</option>
              <option value="14_days">{getReminderOptionLabel('14_days')}</option>
              <option value="7_days">{getReminderOptionLabel('7_days')}</option>
              <option value="1_day">{getReminderOptionLabel('1_day')}</option>
              <option value="on_due_date">{getReminderOptionLabel('on_due_date')}</option>
              <option value="none">{getReminderOptionLabel('none')}</option>
            </select>
          </div>

          {/* Opsi Jadwal Berulang ON / OFF */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Jadwal Berulang (Recurring)</span>
              <span className="text-[11px] text-slate-500">
                Otomatis jadwalkan servis berikutnya setelah Anda menandai selesai
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                isRecurring ? 'bg-[#007a52] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
            </button>
          </div>

          {/* Catatan / Instruksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Spesifikasi (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spesifikasi oli, kode part filter, bengkel langganan..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#007a52] hover:bg-[#006644] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{scheduleToEdit ? 'Perbarui Jadwal' : 'Simpan Jadwal'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
