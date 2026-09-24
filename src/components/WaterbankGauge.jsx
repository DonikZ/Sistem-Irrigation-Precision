import React from 'react';
import { Droplets, ArrowDown, ArrowUp, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function WaterbankGauge({
  percentage = 0,
  currentVolume = 0,
  capacity = 5000,
  inflowRate = 0,
  consumptionRate = 0,
  remainingDays = 0,
  isMlPredicted = true,
  onRefillClick
}) {
  const clampedPercent = Math.min(100, Math.max(0, percentage));

  // Determine fluid color based on remaining water percentage
  const getFluidColor = () => {
    if (clampedPercent === 0) return 'from-[#22272B] to-[#141719]';
    if (clampedPercent < 15) return 'from-[#EF4444] via-[#F87171] to-[#EF4444]';
    if (clampedPercent < 35) return 'from-[#FF7A00] via-[#FF9A3D] to-[#FF7A00]';
    return 'from-[#0284C7] via-[#38BDF8] to-[#0EA5E9]';
  };

  const isStandby = clampedPercent === 0 && currentVolume === 0;
  const isLow = !isStandby && clampedPercent < 20;

  return (
    <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
              <Droplets className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Waterbank Reservoir
            </h3>
          </div>
          <p className="text-xs text-[#8A9198] mt-0.5">
            Tandon Air Presisi untuk Pasokan Irigasi Otomatis
          </p>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
          isStandby
            ? 'bg-[#1B1F21] text-[#8A9198] border-[#282E33]'
            : isLow 
            ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 animate-pulse' 
            : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
        }`}>
          {isStandby ? 'STANDBY (0%)' : isLow ? 'KRITIS (<20%)' : 'CADANGAN AMAN'}
        </span>
      </div>

      {/* Main Reservoir Visualizer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-2">
        {/* Interactive Fluid Tank Container (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-36 h-52 bg-[#0B0D0E] border-2 border-[#252A2E] rounded-2xl overflow-hidden shadow-inner flex flex-col justify-end p-1">
            {/* Graduated volumetric measurement ticks */}
            <div className="absolute inset-y-2 left-2 flex flex-col justify-between text-[9px] font-mono text-[#5A626A] select-none pointer-events-none z-10">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Warning indicator if critical */}
            {isLow && (
              <div className="absolute top-4 right-2 text-[#EF4444] z-10 animate-bounce">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}

            {/* Fluid Column with dynamic height */}
            <div
              className={`w-full rounded-xl bg-gradient-to-t ${getFluidColor()} transition-all duration-700 relative overflow-hidden shadow-lg`}
              style={{ height: `${clampedPercent}%` }}
            >
              {/* Animated wave surface effect */}
              <div className="absolute inset-x-0 top-0 h-3 bg-white/25 animate-water-wave rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Numerical Overlay in Center of Tank */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <span className="text-2xl font-black font-mono text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {clampedPercent.toFixed(1)}%
              </span>
              <span className="text-[11px] font-mono text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {currentVolume.toLocaleString('id-ID')} L
              </span>
            </div>
          </div>
        </div>

        {/* Metric Details Breakdown (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          {/* Capacity Breakdown */}
          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33] flex items-center justify-between">
            <span className="text-xs text-[#8A9198]">Kapasitas Total Tandon</span>
            <span className="text-sm font-bold font-mono text-[#F5F5F5]">
              {capacity.toLocaleString('id-ID')} Liter
            </span>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33] flex items-center justify-between">
            <span className="text-xs text-[#8A9198]">Volume Air Tersisa</span>
            <span className="text-sm font-bold font-mono text-[#38BDF8]">
              {currentVolume.toLocaleString('id-ID')} Liter
            </span>
          </div>

          {/* Inflow vs Consumption */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1B1F21] p-2.5 rounded-lg border border-[#282E33]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#22C55E]">
                <ArrowDown className="w-3.5 h-3.5" /> Inflow (Air Masuk)
              </div>
              <div className="text-sm font-bold font-mono text-[#F5F5F5] mt-1">
                {inflowRate} <span className="text-[10px] text-[#8A9198]">L/menit</span>
              </div>
            </div>

            <div className="bg-[#1B1F21] p-2.5 rounded-lg border border-[#282E33]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#FF9A3D]">
                <ArrowUp className="w-3.5 h-3.5" /> Konsumsi Irigasi
              </div>
              <div className="text-sm font-bold font-mono text-[#F5F5F5] mt-1">
                {consumptionRate} <span className="text-[10px] text-[#8A9198]">L/menit</span>
              </div>
            </div>
          </div>

          {/* Days Remaining Estimate Box */}
          <div className="p-3 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#38BDF8] font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Estimasi Ketahanan Air
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8]">
                {isMlPredicted ? 'AI / ML Dynamic' : 'Rumus Dasar'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-[#F5F5F5]">
                {isStandby ? '0' : `~${remainingDays}`}
              </span>
              <span className="text-xs text-[#8A9198]">
                Hari operasional normal irigasi
              </span>
            </div>

            <p className="text-[10px] text-[#8A9198] mt-1 italic">
              Formula: Volume Tersisa / Rata-rata Pemakaian Harian (Diperhalus oleh Edge ML).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
