import React, { useState } from 'react';
import {
  Settings,
  Save,
  Radio,
  Cpu,
  Layers,
  MapPin,
  Sprout,
  Sliders,
  Shield,
  RefreshCw,
  CheckCircle,
  Database,
  Compass,
  Navigation,
  Plus,
  Edit2,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Download,
  Upload,
  HardDrive,
  AlertTriangle,
  Bluetooth
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { MOCK_BMKG_LOCATIONS } from '../services/mockWeather.js';
import FieldManagementModal from '../components/FieldManagementModal.jsx';
import { formatLandArea } from '../utils/landArea.js';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { storageService } from '../services/storageService.js';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    addNotification,
    lands,
    activeLandId,
    activeLand,
    switchActiveLand,
    addLand,
    updateLand,
    deleteLand,
    changeCropForActiveLand,
    plantProfiles,
    detectLiveLocation,
    isDetectingLocation,
    bluetoothStatus,
    connectedDeviceName,
    isVirtualBle,
    setBluetoothModalOpen
  } = useApp();

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clearLogsModalOpen, setClearLogsModalOpen] = useState(false);

  const [form, setForm] = useState({
    deviceId: settings.deviceId || 'ESP32-PANGAN-01',
    locationMode: settings.locationMode || 'live_gps',
    bmkgLocationId: settings.bmkgLocationId || '32.17',
    bmkgLocationName: settings.bmkgLocationName || 'Lembang, Jawa Barat',
    irrigationMode: settings.irrigationMode || 'automatic',
    demoMode: settings.demoMode || false,
    autoIrrigationEnabled: settings.autoIrrigationEnabled || false,
    soilMoistureThresholdLow: settings.soilMoistureThresholdLow || 40,
    soilMoistureThresholdHigh: settings.soilMoistureThresholdHigh || 65,
    waterbankCapacityLiters: settings.waterbankCapacityLiters || 5000
  });

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(form);
    setSavedSuccess(true);
    addNotification('Konfigurasi sistem berhasil disimpan ke penyimpanan lokal.', 'success', 'Pengaturan Tersimpan');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleConfirmResetDefaults = () => {
    setResetModalOpen(false);
    const defaults = {
      deviceId: 'ESP32-PANGAN-01',
      locationMode: 'live_gps',
      bmkgLocationId: '32.17',
      bmkgLocationName: 'Lembang, Jawa Barat',
      irrigationMode: 'automatic',
      demoMode: false,
      autoIrrigationEnabled: true,
      soilMoistureThresholdLow: 40,
      soilMoistureThresholdHigh: 65,
      waterbankCapacityLiters: 5000
    };
    setForm(defaults);
    updateSettings(defaults);
    addNotification('Pengaturan telah di-reset ke nilai bawaan pabrik.', 'info', 'Reset Selesai');
  };

  // Export Full System Backup JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        app: 'PANGAN-SENSE',
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        settings: storageService.getSettings(),
        lands: storageService.getLands(),
        irrigationLogs: storageService.getIrrigationLogs(),
        waterbankLogs: storageService.getWaterbankLogs(),
        localReadings: storageService.getLocalReadings()
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pangan-sense-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addNotification('Cadangan sistem berhasil diunduh (JSON).', 'success', 'Backup Berhasil');
    } catch (err) {
      addNotification('Gagal membuat cadangan: ' + err.message, 'danger', 'Kesalahan Backup');
    }
  };

  // Import / Restore System from JSON
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.lands && !data.settings) {
          throw new Error('Format berkas tidak valid.');
        }
        if (data.settings) {
          storageService.saveSettings(data.settings);
          setForm(prev => ({ ...prev, ...data.settings }));
          updateSettings(data.settings);
        }
        if (data.lands && Array.isArray(data.lands)) {
          storageService.saveLands(data.lands);
        }
        addNotification('Data sistem dan lahan berhasil dipulihkan dari cadangan.', 'success', 'Pemulihan Sukses');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        addNotification('Gagal memulihkan cadangan: ' + err.message, 'danger', 'Kesalahan Pemulihan');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear Logs Confirm
  const handleConfirmClearLogs = () => {
    setClearLogsModalOpen(false);
    storageService.clearIrrigationLogs();
    storageService.clearWaterbankLogs();
    storageService.clearSyncQueue();
    addNotification('Riwayat log sensor, irigasi, dan waterbank telah dibersihkan.', 'info', 'Cache Dibersihkan');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>PENGATURAN SISTEM</span>
            <span className="text-[#FF7A00]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Parameter Operasional & Lahan
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Konfigurasi mikrokontroler ESP32, penyesuaian lokasi langsung GPS, dan pengelolaan komoditas tanaman per petak lahan.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs font-mono text-[#22C55E] flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Perubahan Tersimpan</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Petak Lahan & Komoditas Tanaman (Direct User Request Focus) */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[#22C55E]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">
                1. Manajemen Petak Lahan & Pilihan Komoditas Tanaman
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setFieldModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kelola & Tambah Lahan Baru</span>
            </button>
          </div>

          {/* Quick Active Land Selector & Crop Changer */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#8A9198] mb-1.5 uppercase">Pilih Petak Lahan yang Sedang Dipantau</label>
                <select
                  value={activeLandId}
                  onChange={(e) => switchActiveLand(e.target.value)}
                  className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#22C55E] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors cursor-pointer font-bold"
                >
                  {lands.map(land => (
                    <option key={land.id} value={land.id}>
                      {land.name} - ({land.customCropName || land.plantType.toUpperCase()})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#5A626A] mt-1 block">
                  Luas lahan aktif: {(activeLand?.areaM2 || 2500).toLocaleString('id-ID')} m²
                </span>
              </div>

              <div>
                <label className="block text-[#8A9198] mb-1.5 uppercase">Ubah Komoditas Tanaman Lahan Ini</label>
                <select
                  value={activeLand?.plantType || 'cabai'}
                  onChange={(e) => changeCropForActiveLand(e.target.value)}
                  className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#FF7A00] text-[#FF9A3D] rounded-lg p-2.5 outline-none transition-colors cursor-pointer font-bold"
                >
                  {Object.entries(plantProfiles).map(([key, p]) => (
                    <option key={key} value={key}>
                      {p.name} (Koefisien Kc: {p.kc}) - {p.category}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#5A626A] mt-1 block">
                  Otomatis menyetel target kelembapan optimal: {plantProfiles[activeLand?.plantType || 'cabai']?.optimalMoisture}%
                </span>
              </div>
            </div>

            {/* List preview of all registered lands */}
            <div className="pt-2">
              <div className="text-[11px] text-[#8A9198] mb-2 uppercase flex items-center justify-between">
                <span>Daftar Lahan Terdaftar ({lands.length} Petak)</span>
                <span className="text-[10px] text-[#5A626A]">Klik untuk beralih</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {lands.map(l => {
                  const isCurrent = l.id === activeLandId;
                  const plant = plantProfiles[l.plantType] || plantProfiles.cabai;
                  return (
                    <div
                      key={l.id}
                      onClick={() => switchActiveLand(l.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-[#1B1F21] border-[#22C55E]/50 ring-1 ring-[#22C55E]/30'
                          : 'bg-[#101214] border-[#22272B] hover:border-[#282E33]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#F5F5F5]">
                        <span className="truncate">{l.name}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />}
                      </div>
                      <div className="text-[11px] text-[#22C55E] mt-0.5">
                        {l.customCropName || plant.name}
                      </div>
                      <div className="text-[10px] text-[#8A9198] mt-1 flex items-center justify-between">
                        <span>{formatLandArea(l)}</span>
                        <span>{l.soilType}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Penyesuaian Lokasi Langsung (Kondisi Lapangan / GPS) */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF7A00]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">
                2. Penyesuaian Lokasi Berdasarkan Kondisi Langsung (GPS vs BMKG)
              </h3>
            </div>

            <button
              type="button"
              onClick={detectLiveLocation}
              disabled={isDetectingLocation}
              className="px-3.5 py-1.5 rounded-lg bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/30 text-[#FF9A3D] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              <span>{isDetectingLocation ? 'Mencari Satelit GPS...' : 'Ambil Lokasi Langsung Sekarang'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Mode Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                form.locationMode === 'live_gps'
                  ? 'bg-[#1B1F21] border-[#FF7A00]/50 ring-1 ring-[#FF7A00]/30 text-[#F5F5F5]'
                  : 'bg-[#101214] border-[#22272B] text-[#8A9198]'
              }`}>
                <input
                  type="radio"
                  name="locationMode"
                  value="live_gps"
                  checked={form.locationMode === 'live_gps'}
                  onChange={() => handleInputChange('locationMode', 'live_gps')}
                  className="mt-0.5 accent-[#FF7A00]"
                />
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-xs text-[#F5F5F5]">
                    <Navigation className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Mode GPS Langsung (Real-Time Posisi Lapangan)</span>
                  </div>
                  <p className="text-[11px] text-[#8A9198] mt-1">
                    Koordinat otomatis disesuaikan dengan posisi GPS fisik perangkat smartphone/laptop petani di sawah.
                  </p>
                </div>
              </label>

              <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                form.locationMode === 'manual_bmkg'
                  ? 'bg-[#1B1F21] border-[#FF7A00]/50 ring-1 ring-[#FF7A00]/30 text-[#F5F5F5]'
                  : 'bg-[#101214] border-[#22272B] text-[#8A9198]'
              }`}>
                <input
                  type="radio"
                  name="locationMode"
                  value="manual_bmkg"
                  checked={form.locationMode === 'manual_bmkg'}
                  onChange={() => handleInputChange('locationMode', 'manual_bmkg')}
                  className="mt-0.5 accent-[#FF7A00]"
                />
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-xs text-[#F5F5F5]">
                    <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Mode Stasiun Agroklimat BMKG Manual</span>
                  </div>
                  <p className="text-[11px] text-[#8A9198] mt-1">
                    Pilih stasiun pengamatan cuaca BMKG terdekat secara manual berdasarkan kabupaten/kota.
                  </p>
                </div>
              </label>
            </div>

            {/* Current Position Status */}
            <div className="p-3.5 rounded-lg bg-[#101214] border border-[#22272B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-[#8A9198] uppercase block">Lokasi Lapangan Terpasang Saat Ini</span>
                <span className="text-sm font-bold text-[#F5F5F5]">
                  {settings.bmkgLocationName}
                </span>
                <div className="text-[11px] text-[#5A626A] mt-0.5">
                  Koordinat: {settings.liveCoordinates?.lat?.toFixed(5) || '-6.8167'}°, {settings.liveCoordinates?.lon?.toFixed(5) || '107.6167'}°
                  {settings.liveCoordinates?.isLive ? ' (Satelit GPS Aktif)' : ' (Titik Tetap)'}
                </div>
              </div>

              {form.locationMode === 'manual_bmkg' && (
                <div className="w-full sm:w-64">
                  <label className="block text-[#8A9198] mb-1 uppercase text-[10px]">Stasiun BMKG Terpilih</label>
                  <select
                    value={form.bmkgLocationId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const loc = MOCK_BMKG_LOCATIONS.find(l => l.id === id);
                      handleInputChange('bmkgLocationId', id);
                      handleInputChange('bmkgLocationName', loc ? `${loc.name}, ${loc.province}` : '');
                    }}
                    className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2 outline-none cursor-pointer text-xs"
                  >
                    {MOCK_BMKG_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}, {loc.province}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Hardware & Connectivity Profile */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4 font-mono">
          <div className="flex items-center gap-2 pb-3 border-b border-[#22272B]">
            <Radio className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">
              3. Identitas Hardware & Bluetooth BLE
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#8A9198] mb-1.5 uppercase">Device Name / Node ID</label>
              <input
                type="text"
                value={form.deviceId}
                onChange={(e) => handleInputChange('deviceId', e.target.value)}
                className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
              />
              <span className="text-[10px] text-[#5A626A] mt-1 block">Nama advertised BLE ESP32 di lapangan</span>
            </div>

            <div>
              <label className="block text-[#8A9198] mb-1.5 uppercase">Mode Simulator (Demo Mode)</label>
              <div className="flex items-center justify-between p-2.5 bg-[#1B1F21] border border-[#282E33] rounded-lg">
                <span className="text-[#F5F5F5]">Simulasi Telemetri Sensor Lapangan</span>
                <input
                  type="checkbox"
                  checked={form.demoMode}
                  onChange={(e) => handleInputChange('demoMode', e.target.checked)}
                  className="w-4 h-4 accent-[#FF7A00] cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-[#5A626A] mt-1 block">Uji coba interaksi tanpa memerlukan ESP32 fisik</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#22272B] flex-wrap gap-2">
            <span className="text-[11px] text-[#8A9198]">
              Status Bluetooth: <strong className={bluetoothStatus === 'CONNECTED' ? (isVirtualBle ? 'text-[#38BDF8]' : 'text-[#22C55E]') : 'text-[#8A9198]'}>
                {bluetoothStatus === 'CONNECTED' ? (isVirtualBle ? 'Gateway Virtual' : connectedDeviceName || 'Terhubung') : 'Belum Terhubung'}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setBluetoothModalOpen(true)}
              className="px-3.5 py-2 bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/40 text-[#FF9A3D] text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Buka Pemindai Bluetooth & Panduan</span>
            </button>
          </div>
        </div>

        {/* 4. Ambang Batas Irigasi & Kapasitas Tandon */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4 font-mono">
          <div className="flex items-center gap-2 pb-3 border-b border-[#22272B]">
            <Layers className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">
              4. Ambang Batas Irigasi & Kapasitas Waterbank
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#8A9198] mb-1.5 uppercase">Kelembapan Kritis (%)</label>
              <input
                type="number"
                min="10"
                max="80"
                value={form.soilMoistureThresholdLow}
                onChange={(e) => handleInputChange('soilMoistureThresholdLow', Number(e.target.value))}
                className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#38BDF8] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
              />
              <span className="text-[10px] text-[#5A626A] mt-1 block">Batas bawah memicu alarm penyiraman</span>
            </div>

            <div>
              <label className="block text-[#8A9198] mb-1.5 uppercase">Kelembapan Target (%)</label>
              <input
                type="number"
                min="40"
                max="95"
                value={form.soilMoistureThresholdHigh}
                onChange={(e) => handleInputChange('soilMoistureThresholdHigh', Number(e.target.value))}
                className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#38BDF8] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
              />
              <span className="text-[10px] text-[#5A626A] mt-1 block">Target kebasahan optimal perakaran</span>
            </div>

            <div>
              <label className="block text-[#8A9198] mb-1.5 uppercase">Kapasitas Tandon (Liter)</label>
              <input
                type="number"
                min="500"
                max="50000"
                step="500"
                value={form.waterbankCapacityLiters}
                onChange={(e) => handleInputChange('waterbankCapacityLiters', Number(e.target.value))}
                className="w-full bg-[#1B1F21] border border-[#282E33] focus:border-[#38BDF8] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors"
              />
              <span className="text-[10px] text-[#5A626A] mt-1 block">Volume total tandon Waterbank</span>
            </div>
          </div>
        </div>

        {/* Data Persistence, Backup & Restore Card */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5]">
              Penyimpanan Lokal, Cadangan & Pemulihan (Backup & Restore)
            </h3>
          </div>
          <p className="text-xs text-[#8A9198]">
            Seluruh data lahan, konfigurasi ambang batas, dan log telemetri tersimpan aman secara offline-first. Anda dapat mengunduh berkas cadangan JSON atau memulihkannya sewaktu-waktu.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#38BDF8] text-[#F5F5F5] hover:text-[#38BDF8] font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Cadangan (JSON)</span>
            </button>

            <label className="px-4 py-2.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#22C55E] text-[#F5F5F5] hover:text-[#22C55E] font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95">
              <Upload className="w-3.5 h-3.5" />
              <span>Pulihkan dari File (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setClearLogsModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#1B1F21] border border-[#282E33] hover:border-[#EF4444] text-[#8A9198] hover:text-[#EF4444] font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Cache Log</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#282E33] bg-[#1B1F21] text-[#8A9198] hover:text-[#EF4444] hover:border-[#EF4444]/40 font-mono text-xs transition-colors cursor-pointer"
          >
            Reset ke Pengaturan Default
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Seluruh Perubahan</span>
          </button>
        </div>
      </form>

      {/* Field & Crop Management Modal */}
      <FieldManagementModal
        isOpen={fieldModalOpen}
        onClose={() => setFieldModalOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        title="Reset Pengaturan ke Standar Pabrik"
        message="Apakah Anda yakin ingin mengembalikan seluruh konfigurasi perangkat dan ambang batas ke setelan default? Data lahan yang tersimpan tidak akan terhapus."
        confirmText="Ya, Reset Default"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmResetDefaults}
        onCancel={() => setResetModalOpen(false)}
      />

      {/* Clear Cache/Logs Modal */}
      <ConfirmationModal
        isOpen={clearLogsModalOpen}
        title="Bersihkan Cache & Riwayat Log"
        message="Tindakan ini akan menghapus riwayat log telemetri sensor, eksekusi pompa irigasi, dan catatan perubahan waterbank dari penyimpanan browser."
        confirmText="Bersihkan Riwayat"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmClearLogs}
        onCancel={() => setClearLogsModalOpen(false)}
      />
    </div>
  );
}
