import React, { useState, useEffect } from 'react';
import { X, Building, Check, Car, Cpu, Wrench, Shield, Laptop, Layers } from 'lucide-react';
import { AssetItem, AssetCategory } from '../../types';
import { ASSET_CATEGORIES } from '../../utils/maintenanceUtils';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: AssetItem) => void;
  assetToEdit?: AssetItem | null;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetToEdit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Kendaraan');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<string>('');
  const [currentMeter, setCurrentMeter] = useState<string>('');
  const [meterUnit, setMeterUnit] = useState<'km' | 'hours'>('km');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name);
      setCategory(assetToEdit.category);
      setBrand(assetToEdit.brand);
      setModel(assetToEdit.model);
      setYear(assetToEdit.year ? String(assetToEdit.year) : '');
      setCurrentMeter(assetToEdit.currentMeter !== undefined ? String(assetToEdit.currentMeter) : '');
      setMeterUnit(assetToEdit.meterUnit || 'km');
      setNotes(assetToEdit.notes || '');
      setIsActive(assetToEdit.isActive ?? true);
    } else {
      setName('');
      setCategory('Kendaraan');
      setBrand('');
      setModel('');
      setYear(String(new Date().getFullYear()));
      setCurrentMeter('');
      setMeterUnit('km');
      setNotes('');
      setIsActive(true);
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAsset: AssetItem = {
      id: assetToEdit ? assetToEdit.id : `asset-${Date.now()}`,
      name: name.trim(),
      category,
      brand: brand.trim(),
      model: model.trim(),
      year: year ? parseInt(year, 10) : undefined,
      currentMeter: currentMeter !== '' ? parseFloat(currentMeter) : undefined,
      meterUnit: category === 'Kendaraan' ? 'km' : meterUnit,
      notes: notes.trim() || undefined,
      isActive,
      createdAt: assetToEdit ? assetToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newAsset);
    onClose();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              {getCategoryIcon(category)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {assetToEdit ? 'Edit Data Aset' : 'Tambah Aset Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Aset yang akan dipantau jadwal perawatannya
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Nama Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aset <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Toyota Avanza, AC Ruang Meeting, Genset"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Kategori Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as AssetCategory;
                setCategory(cat);
                if (cat === 'Kendaraan') setMeterUnit('km');
                else if (cat === 'Mesin') setMeterUnit('hours');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Merk & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merk
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Contoh: Toyota, Daikin, Yanmar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model / Tipe
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Contoh: Veloz 1.5 AT, Inverter 2 PK"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Tahun & Meter Reading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Pembuatan (Opsional)
              </label>
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Contoh: 2022"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kilometer / Hour Meter Saat Ini
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={currentMeter}
                  onChange={(e) => setCurrentMeter(e.target.value)}
                  placeholder="Contoh: 48500"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <select
                  value={meterUnit}
                  onChange={(e) => setMeterUnit(e.target.value as 'km' | 'hours')}
                  className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="km">KM</option>
                  <option value="hours">Jam</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Aset
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan nomor pelat, lokasi penempatan, atau garansi..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="assetActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="assetActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Status Aset Aktif (Dipersiapkan untuk jadwal perawatan rutin)
            </label>
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
              <span>{assetToEdit ? 'Simpan Perubahan' : 'Simpan Aset'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
