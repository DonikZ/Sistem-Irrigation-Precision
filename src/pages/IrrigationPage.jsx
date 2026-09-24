import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Power,
  Sliders,
  Timer,
  AlertOctagon,
  Clock,
  Droplets,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  ShieldAlert,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import PumpControl from '../components/PumpControl.jsx';
import ValveControl from '../components/ValveControl.jsx';
import IrrigationTimer from '../components/IrrigationTimer.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { storageService } from '../services/storageService.js';

export default function IrrigationPage() {
  const {
    irrigationState,
    triggerIrrigation,
    emergencyStop,
    togglePumpManual,
    toggleValveManual,
    sensorData,
    settings,
    updateSettings,
    aiPrediction,
    currentPlant
  } = useApp();

  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(10);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState({ title: '', message: '', type: 'start' });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    setRecentLogs(storageService.getIrrigationLogs());
  }, [irrigationState.totalWaterUsedToday, irrigationState.isActive]);

  const durationOptions = [
    { label: '30 dtk (Uji)', value: 0.5 },
    { label: '1 mnt', value: 1 },
    { label: '5 mnt', value: 5 },
    { label: '10 mnt', value: 10 },
    { label: '15 mnt', value: 15 },
    { label: '20 mnt', value: 20 },
    { label: '30 mnt', value: 30 },
  ];

  // Water estimate in liters based on selected duration (~4.5 liters per minute for standard drip emitter)
  const estimatedWaterLiters = (selectedDurationMinutes * 4.5).toFixed(1);

  const handleStartManualClick = () => {
    const durLabel = selectedDurationMinutes < 1 ? `${selectedDurationMinutes * 60} detik` : `${selectedDurationMinutes} menit`;
    setModalAction({
      title: 'Konfirmasi Mulai Irigasi Manual',
      message: `Anda akan memulai penyiraman manual selama ${durLabel} (~${estimatedWaterLiters} Liter air) untuk tanaman ${currentPlant.name}. Pompa dan Solenoid Valve akan diaktifkan.`,
      type: 'start'
    });
    setConfirmModalOpen(true);
  };

  const handleModalConfirm = () => {
    setConfirmModalOpen(false);
    if (modalAction.type === 'start') {
      triggerIrrigation(true, true, Math.round(selectedDurationMinutes * 60), 'MANUAL_USER');
    }
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>KONTROL AKTISUASI IRIGASI</span>
            <span className="text-[#FF7A00]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Pompa & Solenoid
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Pengendalian langsung sistem irigasi presisi: mode manual, timer presisi, dan perlindungan fail-safe hardware.
          </p>
        </div>

        {/* Mode Selector Pill (Automatic vs Manual) */}
        <div className="flex items-center p-1 bg-[#141719] border border-[#22272B] rounded-xl">
          <button
            onClick={() => updateSettings({ irrigationMode: 'automatic' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              settings.irrigationMode === 'automatic'
                ? 'bg-[#FF7A00] text-[#0B0D0E] shadow-md shadow-[#FF7A00]/20'
                : 'text-[#8A9198] hover:text-[#F5F5F5]'
            }`}
          >
            Mode Otomatis (AI)
          </button>
          <button
            onClick={() => updateSettings({ irrigationMode: 'manual' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              settings.irrigationMode === 'manual'
                ? 'bg-[#FF7A00] text-[#0B0D0E] shadow-md shadow-[#FF7A00]/20'
                : 'text-[#8A9198] hover:text-[#F5F5F5]'
            }`}
          >
            Mode Manual
          </button>
        </div>
      </div>

      {/* Informative Warning Banner if Waterbank < 10% on live sensor */}
      {sensorData.timestamp && sensorData.waterLevel > 0 && sensorData.waterLevel < 10 && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-xs font-mono text-[#F59E0B] flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold uppercase tracking-wider">PERINGATAN: WATERBANK RENDAH (&lt; 10%)</div>
            <div className="text-[#F5F5F5] mt-0.5">Level cadangan air tandon menipis. Pastikan pasokan air mencukupi saat mengaktifkan pompa.</div>
          </div>
        </div>
      )}

      {/* Standby Status Banner when 0 and not connected */}
      {!sensorData.timestamp && (
        <div className="p-3.5 rounded-xl bg-[#141719] border border-[#22272B] text-xs font-mono text-[#8A9198] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7A00]" />
            <span>Sistem dalam status Standby Proyek Dunia Nyata (Nilai Awal: 0).</span>
          </div>
          <span className="text-[#38BDF8] text-[11px]">Relay pompa & solenoid siap dikontrol manual kapan saja</span>
        </div>
      )}

      {/* Main Grid: Left Actuator Controls, Right Timer & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Actuator Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Actuator Relay Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PumpControl
              isActive={sensorData.pump}
              onToggle={togglePumpManual}
              disabled={false}
              disabledReason={sensorData.timestamp && sensorData.waterLevel > 0 && sensorData.waterLevel < 10 ? 'Perhatian: Waterbank <10%' : ''}
            />

            <ValveControl
              isActive={sensorData.valve}
              onToggle={toggleValveManual}
              disabled={false}
            />
          </div>

          {/* Timed Manual Cycle Trigger Box */}
          <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5]">
                  Jalankan Siklus Irigasi Terjadwal
                </h3>
              </div>
              <span className="text-xs font-mono text-[#38BDF8]">
                Estimasi Air: ~{estimatedWaterLiters} Liter
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8A9198] mb-2 uppercase">
                Pilih Durasi Penyiraman
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDurationMinutes(opt.value)}
                    className={`py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      selectedDurationMinutes === opt.value
                        ? 'bg-[#FF7A00]/20 border border-[#FF7A00] text-[#FF9A3D]'
                        : 'bg-[#1B1F21] border border-[#282E33] text-[#8A9198] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartManualClick}
              disabled={irrigationState.isActive}
              className="w-full py-3 bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>
                {irrigationState.isActive
                  ? 'Irigasi Sedang Berlangsung'
                  : `Mulai Irigasi (${selectedDurationMinutes < 1 ? `${selectedDurationMinutes * 60} Detik` : `${selectedDurationMinutes} Menit`})`}
              </span>
            </button>
          </div>

          {/* Automatic Mode Details Card */}
          {settings.irrigationMode === 'automatic' && (
            <div className="bg-[#1B1F21] border border-[#282E33] rounded-xl p-4 text-xs font-mono space-y-2">
              <div className="text-[#22C55E] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mode Otomatis Aktif</span>
              </div>
              <p className="text-[#CCCCCC] leading-relaxed">
                ESP32 dan Aplikasi PANGAN-SENSE akan menyelaraskan penyiraman secara otomatis saat kelembapan tanah turun di bawah ambang kritis ({currentPlant.criticalMoisture}%), kecuali jika ada prakiraan hujan BMKG atau Waterbank kosong.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Countdown Timer & Stats (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <IrrigationTimer
            isActive={irrigationState.isActive}
            remainingSeconds={irrigationState.remainingSeconds}
            targetDurationSeconds={irrigationState.targetDurationSeconds}
            waterUsed={irrigationState.totalWaterUsedToday}
            onEmergencyStop={emergencyStop}
          />

          {/* Operational Metrics Log Summary */}
          <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4 space-y-3 font-mono text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] pb-2 border-b border-[#22272B]">
              Metrik Irigasi Terakhir
            </h4>

            <div className="flex items-center justify-between">
              <span className="text-[#8A9198]">Waktu Terakhir:</span>
              <span className="text-[#F5F5F5] font-semibold">{irrigationState.lastIrrigationTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A9198]">Total Air Terpakai Hari Ini:</span>
              <span className="text-[#38BDF8] font-bold">{irrigationState.totalWaterUsedToday.toFixed(1)} Liter</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A9198]">Pemicu Terakhir:</span>
              <span className="text-[#FF9A3D] font-semibold">{irrigationState.triggerType}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A9198]">Status Relay Pompa:</span>
              <span className={sensorData.pump ? 'text-[#22C55E] font-bold' : 'text-[#8A9198]'}>
                {sensorData.pump ? 'ON (GPIO 26)' : 'OFF'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A9198]">Status Relay Solenoid:</span>
              <span className={sensorData.valve ? 'text-[#38BDF8] font-bold' : 'text-[#8A9198]'}>
                {sensorData.valve ? 'OPEN (GPIO 27)' : 'CLOSED'}
              </span>
            </div>
          </div>

          {/* Recent Executions Box */}
          <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#22272B]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>Riwayat Eksekusi Terkini</span>
              </h4>
              <span className="text-[10px] text-[#8A9198]">{recentLogs.length} Entri</span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-4 text-[#8A9198] text-[11px]">
                Belum ada siklus penyiraman tercatat hari ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-[#1B1F21] border border-[#282E33] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#F5F5F5] flex items-center gap-1.5">
                        <span className="text-[#FF7A00]">{log.duration}</span>
                        <span className="text-[#8A9198]">({log.waterUsed})</span>
                      </div>
                      <div className="text-[10px] text-[#8A9198]">{log.date} {log.time} • {log.trigger}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title={modalAction.title}
        message={modalAction.message}
        confirmText="Konfirmasi & Jalankan"
        cancelText="Batal"
        onConfirm={handleModalConfirm}
        onCancel={() => setConfirmModalOpen(false)}
        variant="warning"
      />
    </div>
  );
}
