import React from 'react';
import { X, Calendar, Wrench, Clock, CheckCircle2, Edit, Trash2, Tag, Car, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MaintenanceSchedule, AssetItem, MaintenanceRecord } from '../../types';
import { 
  getMaintenanceStatusInfo, 
  getIntervalMethodLabel, 
  getReminderOptionLabel, 
  formatIndoDate 
} from '../../utils/maintenanceUtils';
import { formatRupiah } from '../../utils/formatters';

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: MaintenanceSchedule | null;
  asset?: AssetItem;
  records: MaintenanceRecord[];
  onOpenEdit: (schedule: MaintenanceSchedule) => void;
  onOpenComplete: (schedule: MaintenanceSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

export const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({
  isOpen,
  onClose,
  schedule,
  asset,
  records,
  onOpenEdit,
  onOpenComplete,
  onDeleteSchedule,
}) => {
  if (!isOpen || !schedule) return null;

  const statusInfo = getMaintenanceStatusInfo(schedule, asset);
  const relevantRecords = records.filter(
    (r) => r.scheduleId === schedule.id || (r.assetId === schedule.assetId && r.title === schedule.title)
  );

  const unit = asset?.meterUnit || (schedule.intervalMethod === 'hours' ? 'Jam' : 'KM');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                  {statusInfo.label}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {schedule.category}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-1">
                {schedule.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status highlight alert */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            statusInfo.status === 'overdue'
              ? 'bg-rose-50/80 border-rose-200 text-rose-800'
              : statusInfo.status === 'due'
                ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
          }`}>
            {statusInfo.status === 'overdue' || statusInfo.status === 'due' ? (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0" />
            )}
            <div className="text-xs font-medium">
              <span className="font-bold block">{statusInfo.reason}</span>
              <span>
                {statusInfo.status === 'overdue'
                  ? 'Segera lakukan perawatan untuk menghindari kerusakan aset.'
                  : statusInfo.status === 'due'
                    ? 'Perawatan jatuh tempo hari ini.'
                    : 'Kondisi jadwal perawatan terjadwal dengan baik.'}
              </span>
            </div>
          </div>

          {/* Grid Informasi Aset & Interval */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Aset Terkait</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-600" />
                <span>{asset?.name || 'Aset Terhapus'}</span>
              </div>
              <span className="text-[11px] text-slate-600 block">
                {asset?.brand} {asset?.model} {asset?.year ? `(${asset.year})` : ''}
              </span>
              {asset?.currentMeter !== undefined && (
                <span className="text-[11px] font-bold text-emerald-700 block">
                  Meter saat ini: {asset.currentMeter.toLocaleString('id-ID')} {unit}
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Metode & Interval</span>
              <div className="font-bold text-slate-900">
                {getIntervalMethodLabel(schedule.intervalMethod)}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                {schedule.intervalMonths && (
                  <div>Setiap {schedule.intervalMonths} bulan</div>
                )}
                {schedule.intervalKm && (
                  <div>Setiap {schedule.intervalKm.toLocaleString('id-ID')} km</div>
                )}
                {schedule.intervalHours && (
                  <div>Setiap {schedule.intervalHours} jam kerja</div>
                )}
              </div>
            </div>
          </div>

          {/* Next & Last Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Terakhir Dilakukan */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Terakhir Dilakukan</span>
              </span>
              <div className="font-bold text-slate-800">
                {schedule.lastDate ? formatIndoDate(schedule.lastDate) : 'Belum pernah dicatat'}
              </div>
              {schedule.lastMeter !== undefined && (
                <div className="text-[11px] text-slate-600">
                  Pada {schedule.lastMeter.toLocaleString('id-ID')} {unit}
                </div>
              )}
            </div>

            {/* Target Jatuh Tempo Berikutnya */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-700" />
                <span>Jadwal Berikutnya</span>
              </span>
              <div className="font-bold text-emerald-950">
                {schedule.nextDate ? formatIndoDate(schedule.nextDate) : '-'}
              </div>
              {schedule.nextMeter !== undefined && (
                <div className="text-[11px] font-bold text-emerald-800">
                  Target meter: {schedule.nextMeter.toLocaleString('id-ID')} {unit}
                </div>
              )}
            </div>
          </div>

          {/* Biaya, Prioritas & Reminder */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Estimasi Biaya</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {schedule.estimatedCost ? formatRupiah(schedule.estimatedCost) : '-'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Prioritas</span>
              <span className={`font-bold mt-0.5 block capitalize ${
                schedule.priority === 'high' ? 'text-rose-700' : schedule.priority === 'medium' ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {schedule.priority === 'high' ? 'Tinggi' : schedule.priority === 'medium' ? 'Sedang' : 'Rendah'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Pengingat</span>
              <span className="font-bold text-slate-800 mt-0.5 block text-[11px]">
                {getReminderOptionLabel(schedule.reminder)}
              </span>
            </div>
          </div>

          {/* Catatan */}
          {schedule.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-600 block mb-1">Catatan Khusus</span>
              <p className="text-slate-800 leading-relaxed">{schedule.notes}</p>
            </div>
          )}

          {/* Riwayat Servis Terdahulu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Riwayat Servis Terdahulu ({relevantRecords.length})
              </span>
            </div>

            {relevantRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                Belum ada riwayat penyelesaian untuk jadwal ini.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {relevantRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{formatIndoDate(rec.completionDate)}</div>
                      <div className="text-[11px] text-slate-500">
                        {rec.meterReading !== undefined && `Meter: ${rec.meterReading.toLocaleString('id-ID')} ${unit} • `}
                        {rec.notes || 'Servis selesai'}
                      </div>
                    </div>
                    <div className="text-right font-bold text-emerald-800">
                      {formatRupiah(rec.actualCost)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Hapus jadwal perawatan "${schedule.title}"?`)) {
                onDeleteSchedule(schedule.id);
                onClose();
              }
            }}
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Hapus Jadwal"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(schedule);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Jadwal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenComplete(schedule);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-[#007a52] hover:bg-[#006644] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tandai Selesai</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
