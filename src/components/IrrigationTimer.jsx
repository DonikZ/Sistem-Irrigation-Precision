import React from 'react';
import { Timer, AlertOctagon, Droplets, CheckCircle2 } from 'lucide-react';

export default function IrrigationTimer({
  isActive = false,
  remainingSeconds = 0,
  targetDurationSeconds = 600,
  waterUsed = 0,
  onEmergencyStop
}) {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const progress = targetDurationSeconds > 0 
    ? Math.max(0, Math.min(100, ((targetDurationSeconds - remainingSeconds) / targetDurationSeconds) * 100))
    : 0;

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      isActive 
        ? 'bg-[#141719] border-[#FF7A00]/50 shadow-xl shadow-[#FF7A00]/10' 
        : 'bg-[#141719] border-[#22272B]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#FF7A00]/20 text-[#FF7A00] animate-pulse' : 'bg-[#1B1F21] text-[#8A9198]'}`}>
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Timer Siklus Irigasi
            </h4>
            <span className="text-[11px] text-[#8A9198]">
              {isActive ? 'Aktif Mengalir' : 'Siaga / Standby'}
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
          isActive 
            ? 'bg-[#FF7A00] text-[#0B0D0E] animate-pulse' 
            : 'bg-[#1B1F21] text-[#8A9198] border border-[#282E33]'
        }`}>
          {isActive ? 'IRIGASI BERJALAN' : 'STANDBY'}
        </span>
      </div>

      {/* Countdown and Progress */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className="text-5xl font-black font-mono tracking-tight text-[#F5F5F5] drop-shadow-md">
          {formatTime(remainingSeconds)}
        </div>
        <div className="text-xs font-mono text-[#8A9198] mt-1">
          {isActive ? `Dari total ${Math.round(targetDurationSeconds / 60)} menit yang dijadwalkan` : 'Tidak ada siklus aktif'}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1B1F21] h-2 rounded-full overflow-hidden mt-4 border border-[#282E33]">
          <div
            className="h-full bg-gradient-to-r from-[#FF7A00] to-[#FF9A3D] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats during active cycle */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#8A9198] pt-3 border-t border-[#1F2428] mb-4">
        <div>
          <span>Estimasi Air Terpakai:</span>
          <div className="text-[#38BDF8] font-bold text-sm mt-0.5">{waterUsed.toFixed(1)} Liter</div>
        </div>
        <div className="text-right">
          <span>Progres Siklus:</span>
          <div className="text-[#F5F5F5] font-bold text-sm mt-0.5">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Emergency Stop Button */}
      {isActive && (
        <button
          onClick={onEmergencyStop}
          className="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white font-mono font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-lg shadow-[#EF4444]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Emergency Stop (Hentikan Paksa)</span>
        </button>
      )}
    </div>
  );
}
