import React, { useState } from 'react';
import {
  X,
  Plus,
  Sprout,
  MapPin,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Copy,
  Check,
  Compass,
  AlertCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import { formatLandArea, convertToAreaM2 } from '../utils/landArea.js';

export default function FieldManagementModal({ isOpen, onClose }) {
  const {
    lands,
    activeLandId,
    activeLand,
    switchActiveLand,
    addLand,
    updateLand,
    deleteLand,
    duplicateLand,
    changeCropForActiveLand,
    plantProfiles,
    detectLiveLocation,
    isDetectingLocation,
    settings
  } = useApp();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingLandId, setEditingLandId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null); // { id, name, isOnlyOne: boolean }

  // Form state for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    plantType: 'padi',
    customCropName: '',
    areaM2: 2500,
    areaUnit: 'm2', // 'm2' | 'cm_dims' | 'cm2' | 'ha'
    areaValue: 2500,
    dimLengthCm: 50,
    dimWidthCm: 50,
    plantingDate: new Date().toISOString().split('T')[0],
    soilType: 'lempung',
    waterbankCapacityLiters: 5000,
    notes: '',
    useLiveGpsCoords: true
  });

  if (!isOpen) return null;

  const calculateHst = (plantingDateStr) => {
    if (!plantingDateStr) return 0;
    const planting = new Date(plantingDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - planting);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleStartAdd = () => {
    setFormData({
      name: `Lahan Blok ${String.fromCharCode(65 + lands.length)}`,
      plantType: 'cabai',
      customCropName: '',
      areaM2: 2500,
      areaUnit: 'm2',
      areaValue: 2500,
      dimLengthCm: 50,
      dimWidthCm: 50,
      plantingDate: new Date().toISOString().split('T')[0],
      soilType: 'lempung',
      waterbankCapacityLiters: 5000,
      notes: '',
      useLiveGpsCoords: true
    });
    setActiveTab('add');
  };

  const handleStartEdit = (land) => {
    setEditingLandId(land.id);
    let unit = land.areaUnit || 'm2';
    let val = land.areaM2 || 2500;
    let len = 50;
    let wid = 50;

    if (land.dimensions && land.dimensions.length && land.dimensions.width) {
      unit = 'cm_dims';
      len = land.dimensions.length;
      wid = land.dimensions.width;
      val = len * wid;
    } else if (unit === 'cm2' || (land.areaM2 > 0 && land.areaM2 < 1)) {
      unit = 'cm2';
      val = Math.round((land.areaM2 || 0) * 10000);
    } else if (unit === 'ha' || (land.areaM2 && land.areaM2 >= 10000)) {
      unit = 'ha';
      val = Number((land.areaM2 / 10000).toFixed(2));
    }

    setFormData({
      name: land.name,
      plantType: land.plantType,
      customCropName: land.customCropName || '',
      areaM2: land.areaM2 || 2500,
      areaUnit: unit,
      areaValue: val,
      dimLengthCm: len,
      dimWidthCm: wid,
      plantingDate: land.plantingDate || new Date().toISOString().split('T')[0],
      soilType: land.soilType || 'lempung',
      waterbankCapacityLiters: land.waterbankCapacityLiters || 5000,
      notes: land.notes || '',
      useLiveGpsCoords: false
    });
    setActiveTab('edit');
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const calculatedAreaM2 = convertToAreaM2(
      formData.areaUnit,
      formData.areaValue,
      { length: formData.dimLengthCm, width: formData.dimWidthCm }
    );

    addLand({
      name: formData.name,
      plantType: formData.plantType,
      customCropName: formData.customCropName,
      areaM2: calculatedAreaM2,
      areaUnit: formData.areaUnit,
      dimensions: formData.areaUnit === 'cm_dims' ? { length: Number(formData.dimLengthCm), width: Number(formData.dimWidthCm) } : null,
      plantingDate: formData.plantingDate,
      soilType: formData.soilType,
      waterbankCapacityLiters: formData.waterbankCapacityLiters,
      notes: formData.notes
    });

    setActiveTab('list');
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingLandId) return;

    const calculatedAreaM2 = convertToAreaM2(
      formData.areaUnit,
      formData.areaValue,
      { length: formData.dimLengthCm, width: formData.dimWidthCm }
    );

    updateLand(editingLandId, {
      name: formData.name,
      plantType: formData.plantType,
      customCropName: formData.customCropName,
      areaM2: calculatedAreaM2,
      areaUnit: formData.areaUnit,
      dimensions: formData.areaUnit === 'cm_dims' ? { length: Number(formData.dimLengthCm), width: Number(formData.dimWidthCm) } : null,
      plantingDate: formData.plantingDate,
      soilType: formData.soilType,
      waterbankCapacityLiters: formData.waterbankCapacityLiters,
      notes: formData.notes
    });

    setActiveTab('list');
    setEditingLandId(null);
  };

  const handleRequestDelete = (land) => {
    setDeleteCandidate({
      id: land.id,
      name: land.name,
      isOnlyOne: lands.length <= 1
    });
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      deleteLand(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141719] border border-[#22272B] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22272B] flex items-center justify-between bg-[#101214]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
                <span>KELOLA LAHAN & TANAMAN</span>
                <span className="text-[#FF7A00]">//</span>
                <span className="text-xs font-normal text-[#8A9198]">
                  {lands.length} Petak Terdaftar
                </span>
              </h2>
              <p className="text-[11px] text-[#8A9198]">
                Sesuaikan nama petak lahan, ganti komoditas tanaman, dan atur fase pertumbuhan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A9198] hover:text-[#F5F5F5] hover:bg-[#1B1F21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="px-6 pt-3 border-b border-[#22272B] flex items-center justify-between bg-[#141719]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer ${
                activeTab === 'list'
                  ? 'border-[#FF7A00] text-[#FF7A00] bg-[#1B1F21]'
                  : 'border-transparent text-[#8A9198] hover:text-[#F5F5F5]'
              }`}
            >
              Daftar Lahan ({lands.length})
            </button>
            {activeTab === 'add' && (
              <button
                className="px-3 py-2 text-xs font-mono font-medium rounded-t-lg border-b-2 border-[#22C55E] text-[#22C55E] bg-[#1B1F21]"
              >
                + Tambah Lahan Baru
              </button>
            )}
            {activeTab === 'edit' && (
              <button
                className="px-3 py-2 text-xs font-mono font-medium rounded-t-lg border-b-2 border-[#38BDF8] text-[#38BDF8] bg-[#1B1F21]"
              >
                Edit Detail Lahan
              </button>
            )}
          </div>

          {activeTab === 'list' && (
            <button
              onClick={handleStartAdd}
              className="mb-2 px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-[#0B0D0E] font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#22C55E]/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Lahan</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Agronomic Summary Bar */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#101214] border border-[#22272B] text-xs font-mono">
                <div>
                  <span className="text-[#8A9198] text-[10px] uppercase block">Total Petak Lahan</span>
                  <span className="text-sm font-bold text-[#F5F5F5]">{lands.length} Petak</span>
                </div>
                <div>
                  <span className="text-[#8A9198] text-[10px] uppercase block">Total Luas Lahan</span>
                  <span className="text-sm font-bold text-[#22C55E]">
                    {lands.reduce((acc, l) => acc + (l.areaM2 || 0), 0).toLocaleString('id-ID')} m²
                    <span className="text-[10px] text-[#8A9198] font-normal ml-1">
                      ({(lands.reduce((acc, l) => acc + (l.areaM2 || 0), 0) / 10000).toFixed(2)} Ha)
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[#8A9198] text-[10px] uppercase block">Total Kapasitas Air</span>
                  <span className="text-sm font-bold text-[#38BDF8]">
                    {lands.reduce((acc, l) => acc + (l.waterbankCapacityLiters || 5000), 0).toLocaleString('id-ID')} L
                  </span>
                </div>
              </div>

              {lands.map((land) => {
                const isActive = land.id === activeLandId;
                const plant = plantProfiles[land.plantType] || plantProfiles.cabai;
                const hst = calculateHst(land.plantingDate);

                return (
                  <div
                    key={land.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-[#1B1F21] border-[#FF7A00]/50 ring-1 ring-[#FF7A00]/30'
                        : 'bg-[#101214] border-[#22272B] hover:border-[#2F363C]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#F5F5F5]">
                            {land.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF7A00]/15 text-[#FF9A3D] border border-[#FF7A00]/30 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              SEDANG AKTIF
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#8A9198]">
                          <span className="flex items-center gap-1 text-[#22C55E]">
                            <Sprout className="w-3.5 h-3.5" />
                            {land.customCropName || plant.name}
                          </span>
                          <span className="flex items-center gap-1 text-[#38BDF8]">
                            <Clock className="w-3.5 h-3.5" />
                            {hst} HST (Hari Setelah Tanam)
                          </span>
                          <span className="flex items-center gap-1 text-[#8A9198]">
                            <Layers className="w-3.5 h-3.5" />
                            {formatLandArea(land)}
                          </span>
                        </div>

                        {land.notes && (
                          <p className="text-[11px] text-[#5A626A] font-mono italic pt-1">
                            "{land.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive ? (
                          <button
                            onClick={() => switchActiveLand(land.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#FF7A00] text-xs font-mono text-[#F5F5F5] hover:text-[#FF7A00] transition-colors cursor-pointer"
                          >
                            Pilih Lahan Ini
                          </button>
                        ) : (
                          <div className="text-[11px] font-mono text-[#FF7A00] px-2 py-1">
                            Target: {plant.optimalMoisture}% RH
                          </div>
                        )}

                        <button
                          onClick={() => handleStartEdit(land)}
                          className="p-1.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#38BDF8] text-[#8A9198] hover:text-[#38BDF8] transition-colors cursor-pointer"
                          title="Edit Lahan & Ganti Tanaman"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => duplicateLand(land.id)}
                          className="p-1.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#22C55E] text-[#8A9198] hover:text-[#22C55E] transition-colors cursor-pointer"
                          title="Duplikasi Lahan Ini"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRequestDelete(land)}
                          className="p-1.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#EF4444] text-[#8A9198] hover:text-[#EF4444] transition-colors cursor-pointer"
                          title={lands.length <= 1 ? "Hapus & Reset Lahan" : "Hapus Lahan"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Crop Switcher Bar inside the card */}
                    <div className="mt-3 pt-3 border-t border-[#22272B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-[#8A9198] text-[11px]">
                        Ganti Tanaman Cepat:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(plantProfiles).slice(0, 5).map(([key, p]) => (
                          <button
                            key={key}
                            onClick={() => {
                              if (isActive) {
                                changeCropForActiveLand(key);
                              } else {
                                updateLand(land.id, { plantType: key, customCropName: p.name });
                              }
                            }}
                            className={`px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                              land.plantType === key
                                ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 font-bold'
                                : 'bg-[#101214] text-[#8A9198] border border-[#22272B] hover:text-[#F5F5F5]'
                            }`}
                          >
                            {p.id.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form: Add or Edit */}
          {(activeTab === 'add' || activeTab === 'edit') && (
            <form onSubmit={activeTab === 'add' ? handleSubmitAdd : handleSubmitEdit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Nama Lahan */}
                <div className="space-y-1">
                  <label className="block text-[#8A9198] uppercase">Nama Petak Lahan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lahan Blok C - Petak Selatan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#101214] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-[#5A626A] block">Nama pembeda petak lahan milik petani</span>
                </div>

                {/* 2. Komoditas Tanaman */}
                <div className="space-y-1">
                  <label className="block text-[#8A9198] uppercase">Komoditas Tanaman *</label>
                  <select
                    value={formData.plantType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const p = plantProfiles[newType];
                      setFormData({
                        ...formData,
                        plantType: newType,
                        customCropName: p ? p.name : ''
                      });
                    }}
                    className="w-full bg-[#101214] border border-[#282E33] focus:border-[#22C55E] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors cursor-pointer"
                  >
                    {Object.entries(plantProfiles).map(([key, p]) => (
                      <option key={key} value={key}>
                        {p.name} (Kc: {p.kc}) - {p.category}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-[#5A626A] block">Menyesuaikan koefisien air Kc dan ambang kelembapan</span>
                </div>

                {/* 3. Varietas / Nama Kustom */}
                <div className="space-y-1">
                  <label className="block text-[#8A9198] uppercase">Varietas / Keterangan Tanaman</label>
                  <input
                    type="text"
                    placeholder="Misal: Padi Inpari 32 / Cabai Rawit Ori 212"
                    value={formData.customCropName}
                    onChange={(e) => setFormData({ ...formData, customCropName: e.target.value })}
                    className="w-full bg-[#101214] border border-[#282E33] focus:border-[#22C55E] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
                  />
                </div>

                {/* 4. Tanggal Tanam */}
                <div className="space-y-1">
                  <label className="block text-[#8A9198] uppercase">Tanggal Tanam (Untuk Lacak HST) *</label>
                  <input
                    type="date"
                    required
                    value={formData.plantingDate}
                    onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                    className="w-full bg-[#101214] border border-[#282E33] focus:border-[#38BDF8] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-[#38BDF8] block">
                    Usia saat ini: {calculateHst(formData.plantingDate)} Hari Setelah Tanam
                  </span>
                </div>

                {/* 5. Luas Lahan & Satuan (m², cm P×L Uji/Simulasi, cm², Ha) */}
                <div className="space-y-2 md:col-span-2 bg-[#101214] p-3.5 rounded-xl border border-[#22272B]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-[#8A9198] text-xs font-bold uppercase font-mono">
                      Luas Lahan / Dimensi Petak Uji *
                    </label>
                    {/* Unit Switcher */}
                    <div className="flex flex-wrap items-center gap-1 bg-[#141719] p-1 rounded-lg border border-[#282E33] text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, areaUnit: 'm2', areaValue: formData.areaValue || 2500 })}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.areaUnit === 'm2' ? 'bg-[#FF7A00] text-[#0B0D0E] font-bold' : 'text-[#8A9198] hover:text-white'
                        }`}
                      >
                        m² (Meter)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, areaUnit: 'cm_dims' })}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.areaUnit === 'cm_dims' ? 'bg-[#FF7A00] text-[#0B0D0E] font-bold' : 'text-[#8A9198] hover:text-white'
                        }`}
                      >
                        cm (P × L Simulasi/Pot)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, areaUnit: 'cm2', areaValue: formData.areaValue || 2500 })}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.areaUnit === 'cm2' ? 'bg-[#FF7A00] text-[#0B0D0E] font-bold' : 'text-[#8A9198] hover:text-white'
                        }`}
                      >
                        cm² (Luas Sentimeter)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, areaUnit: 'ha', areaValue: formData.areaValue || 0.25 })}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          formData.areaUnit === 'ha' ? 'bg-[#FF7A00] text-[#0B0D0E] font-bold' : 'text-[#8A9198] hover:text-white'
                        }`}
                      >
                        Ha (Hektar)
                      </button>
                    </div>
                  </div>

                  {formData.areaUnit === 'cm_dims' ? (
                    <div className="space-y-2 pt-1 font-mono">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-[#8A9198] uppercase block mb-1">Panjang Petak (cm)</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            step="1"
                            value={formData.dimLengthCm}
                            onChange={(e) => setFormData({ ...formData, dimLengthCm: Math.max(1, Number(e.target.value)) })}
                            className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none"
                            placeholder="Contoh: 50 cm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8A9198] uppercase block mb-1">Lebar Petak (cm)</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            step="1"
                            value={formData.dimWidthCm}
                            onChange={(e) => setFormData({ ...formData, dimWidthCm: Math.max(1, Number(e.target.value)) })}
                            className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none"
                            placeholder="Contoh: 50 cm"
                          />
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#1B1F21] border border-[#282E33] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#38BDF8]">
                        <span>Dimensi Uji: {formData.dimLengthCm} cm × {formData.dimWidthCm} cm = {(formData.dimLengthCm * formData.dimWidthCm).toLocaleString('id-ID')} cm²</span>
                        <span className="text-[#22C55E] font-bold">Setara {((formData.dimLengthCm * formData.dimWidthCm) / 10000).toFixed(4)} m²</span>
                      </div>
                      <p className="text-[10px] text-[#8A9198]">
                        Mode simulasi sentimeter sangat cocok untuk pengujian prototipe meja pot tanaman mini atau baki persemaian sensor ESP32.
                      </p>
                    </div>
                  ) : formData.areaUnit === 'cm2' ? (
                    <div className="space-y-1.5 pt-1 font-mono">
                      <input
                        type="number"
                        min="1"
                        max="10000000"
                        step="10"
                        value={formData.areaValue}
                        onChange={(e) => setFormData({ ...formData, areaValue: Number(e.target.value) })}
                        className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none"
                        placeholder="Contoh: 2500 cm²"
                      />
                      <span className="text-[11px] text-[#38BDF8] block">
                        Mode Simulasi Pot: {Number(formData.areaValue || 0).toLocaleString('id-ID')} cm² = {(Number(formData.areaValue || 0) / 10000).toFixed(4)} m²
                      </span>
                    </div>
                  ) : formData.areaUnit === 'ha' ? (
                    <div className="space-y-1.5 pt-1 font-mono">
                      <input
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.05"
                        value={formData.areaValue}
                        onChange={(e) => setFormData({ ...formData, areaValue: Number(e.target.value) })}
                        className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none"
                        placeholder="Contoh: 0.5 Ha"
                      />
                      <span className="text-[11px] text-[#22C55E] block">
                        Setara {(Number(formData.areaValue || 0) * 10000).toLocaleString('id-ID')} m²
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 font-mono">
                      <input
                        type="number"
                        min="0.01"
                        max="500000"
                        step="10"
                        value={formData.areaValue}
                        onChange={(e) => setFormData({ ...formData, areaValue: Number(e.target.value) })}
                        className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none"
                        placeholder="Contoh: 2500 m²"
                      />
                      <span className="text-[11px] text-[#5A626A] block">
                        Setara {(Number(formData.areaValue || 0) / 10000).toFixed(2)} Hektar
                      </span>
                    </div>
                  )}
                </div>

                {/* 6. Jenis Tanah */}
                <div className="space-y-1">
                  <label className="block text-[#8A9198] uppercase">Tipe Tekstur Tanah</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full bg-[#101214] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors cursor-pointer"
                  >
                    <option value="lempung">Tanah Lempung (Loam) - Standar Retensi</option>
                    <option value="liat">Tanah Liat (Clay) - Sawah Basah</option>
                    <option value="pasir">Tanah Berpasir (Sandy) - Drainase Sangat Cepat</option>
                    <option value="gambut">Tanah Gambut / Organik</option>
                  </select>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div className="space-y-1">
                <label className="block text-[#8A9198] uppercase">Catatan Agronomi Lapangan</label>
                <textarea
                  rows="2"
                  placeholder="Misal: Sistem irigasi tetes, tanah ditutup mulsa plastik perak..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#101214] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
                />
              </div>

              {/* Live Location Action Bar */}
              <div className="p-3 rounded-xl bg-[#1B1F21] border border-[#282E33] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF7A00]" />
                  <div>
                    <div className="text-xs font-bold text-[#F5F5F5]">Lokasi Lahan</div>
                    <div className="text-[10px] text-[#8A9198]">
                      {settings.bmkgLocationName} {settings.liveCoordinates?.isLive ? '(GPS Aktif)' : ''}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={detectLiveLocation}
                  disabled={isDetectingLocation}
                  className="px-3 py-1.5 rounded-lg bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/30 text-[#FF9A3D] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Mencari GPS...' : 'Ambil Koordinat GPS Sekarang'}</span>
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#22272B]">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-lg border border-[#282E33] text-[#8A9198] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-bold uppercase transition-all shadow-md shadow-[#FF7A00]/20 cursor-pointer"
                >
                  {activeTab === 'add' ? 'Simpan & Aktifkan Lahan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#101214] border-t border-[#22272B] flex items-center justify-between text-[11px] font-mono text-[#8A9198]">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Pergantian tanaman otomatis memperbarui model prediksi Edge AI & ambang kelembapan.</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#F5F5F5] hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* In-app Confirmation Modal for Land Deletion */}
      <ConfirmationModal
        isOpen={Boolean(deleteCandidate)}
        title={deleteCandidate?.isOnlyOne ? 'Hapus & Reset Lahan Terakhir' : 'Konfirmasi Hapus Lahan'}
        message={
          deleteCandidate?.isOnlyOne
            ? `Lahan "${deleteCandidate?.name}" adalah satu-satunya lahan aktif. Menghapusnya akan me-reset sistem ke petak lahan baru yang bersih.`
            : `Apakah Anda yakin ingin menghapus lahan "${deleteCandidate?.name}"? Seluruh konfigurasi dan jadwal penyiraman untuk petak ini akan dihapus.`
        }
        confirmText={deleteCandidate?.isOnlyOne ? 'Hapus & Reset' : 'Hapus Lahan'}
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
