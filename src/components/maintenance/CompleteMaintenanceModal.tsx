import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Gauge, FileText, ArrowRight } from 'lucide-react';
import { MaintenanceSchedule, AssetItem, MaintenanceRecord } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface CompleteMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: MaintenanceSchedule | null;
  asset?: AssetItem;
  onComplete: (data: {
    record: MaintenanceRecord;
    updatedAssetMeter?: number;
    recordAsExpense: boolean;
  }) => void;
}

export const CompleteMaintenanceModal: React.FC<CompleteMaintenanceModalProps> = ({
  isOpen,
  onClose,
  schedule,
  asset,
  onComplete,
}) => {
  const [completionDate, setCompletionDate] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [notes, setNotes] = useState('');
  const [recordAsExpense, setRecordAsExpense] = useState(true);

  useEffect(() => {
    if (schedule && isOpen) {
      setCompletionDate(new Date().toISOString().split('T')[0]);
      // If schedule had target nextMeter or asset has current meter, default to that
      const defaultMeter = schedule.nextMeter || asset?.currentMeter;
      setMeterReading(defaultMeter !== undefined ? String(defaultMeter) : '');
      setActualCost(schedule.estimatedCost ? String(schedule.estimatedCost) : '');
      setNotes(schedule.notes ? `Selesai sesuai instruksi: ${schedule.notes}` : '');
      setRecordAsExpense(true);
    }
  }, [schedule, asset, isOpen]);

  if (!isOpen || !schedule) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = actualCost ? parseFloat(actualCost) : 0;
    const meterNum = meterReading !== '' ? parseFloat(meterReading) : undefined;

    const record: MaintenanceRecord = {
      id: `rec-${Date.now()}`,
      scheduleId: schedule.id,
      assetId: schedule.assetId,
      assetName: asset?.name || 'Aset',
      title: schedule.title,
      completionDate: completionDate || new Date().toISOString().split('T')[0],
      meterReading: meterNum,
      actualCost: costNum,
      notes: notes.trim() || undefined,
      recordedAsExpense: recordAsExpense,
      createdAt: new Date().toISOString(),
    };

    onComplete({
      record,
      updatedAssetMeter: meterNum,
      recordAsExpense,
    });
    onClose();
  };

  const unit = asset?.meterUnit || (schedule.intervalMethod === 'hours' ? 'Jam' : 'KM');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-emerald-300 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Tandai Selesai Perawatan
              </h3>
              <p className="text-xs text-emerald-800 font-medium truncate max-w-xs sm:max-w-sm">
                {schedule.title} • {asset?.name || 'Aset'}
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Tanggal Selesai */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Selesai Dilakukan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Kilometer / Hour Meter Aktual */}
          {(schedule.intervalMethod === 'km' ||
            schedule.intervalMethod === 'date_km' ||
            schedule.intervalMethod === 'hours' ||
            asset?.currentMeter !== undefined) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{schedule.intervalMethod === 'hours' ? 'Hour Meter Aktual' : 'Kilometer Odometer Aktual'}</span>
                {asset?.currentMeter !== undefined && (
                  <span className="text-[11px] text-slate-500 font-normal">
                    Meter tercatat saat ini: {asset.currentMeter.toLocaleString('id-ID')} {unit}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  placeholder={`Masukkan ${unit} aktual...`}
                  className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Data meter ini akan otomatis memperbarui pembacaan aset {asset?.name}.
              </p>
            </div>
          )}

          {/* Biaya Aktual */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biaya Aktual Servis / Perawatan
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            {actualCost && !isNaN(parseFloat(actualCost)) && (
              <span className="text-xs font-bold text-emerald-700 mt-1 block">
                {formatRupiah(parseFloat(actualCost))}
              </span>
            )}
          </div>

          {/* Integrasi Pengeluaran & Budget Checkbox */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={recordAsExpense}
                onChange={(e) => setRecordAsExpense(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  ☑ Catat sebagai pengeluaran
                </span>
                <span className="text-[11px] text-emerald-800">
                  Otomatis membuat pembukuan transaksi di menu <strong>Pengeluaran & Budget</strong> (Kategori Transportasi/Lainnya).
                </span>
              </div>
            </label>
          </div>

          {/* Info Jadwal Berulang Otomatis */}
          {schedule.isRecurring && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Jadwal ini berulang. Sistem akan <strong>otomatis menghitung dan membuat jadwal servis berikutnya</strong> sesuai interval yang ditentukan.
              </span>
            </div>
          )}

          {/* Catatan Penyelesaian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Penyelesaian & Nama Bengkel / Teknisi (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Selesai di Bengkel Resmi, teknisi Mas Budi. Oli dan filter baru."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
              className="px-5 py-2.5 bg-[#007a52] hover:bg-[#006644] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Tandai Selesai</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
