import React from 'react';
import { Cpu, Sparkles, CheckCircle2, AlertTriangle, Clock, Droplets, Info, ArrowRight } from 'lucide-react';

export default function AIRecommendation({
  prediction,
  isLoading,
  onApplyRecommendation,
  compact = false
}) {
  if (isLoading || !prediction) {
    return (
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 animate-pulse">
        <div className="h-5 w-48 bg-[#1B1F21] rounded mb-3" />
        <div className="h-16 w-full bg-[#1B1F21] rounded mb-3" />
        <div className="h-6 w-3/4 bg-[#1B1F21] rounded" />
      </div>
    );
  }

  const {
    predictedWaterRequirement,
    predictedIrrigationDuration,
    predictedWaterbankDays,
    irrigationRecommendation,
    urgency,
    confidence,
    modelStatus,
    statusNote,
    explainableFactors
  } = prediction;

  const urgencyStyles = {
    STANDBY: 'border-[#8A9198]/40 bg-[#1B1F21] text-[#8A9198]',
    URGENT: 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]',
    HIGH: 'border-[#FF7A00]/40 bg-[#FF7A00]/10 text-[#FF9A3D]',
    NORMAL: 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]',
    DELAY: 'border-[#FF9A3D]/40 bg-[#FF7A00]/10 text-[#FF9A3D]',
    SAFE: 'border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]',
    CRITICAL: 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
  };

  const currentUrgencyClass = urgencyStyles[urgency] || urgencyStyles.NORMAL;

  if (compact) {
    return (
      <div className="bg-[#141719] border border-[#22272B] hover:border-[#FF7A00]/40 rounded-xl p-4 flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/30">
              <Cpu className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5]">
              Rekomendasi Edge AI
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${currentUrgencyClass}`}>
            {urgency}
          </span>
        </div>

        <p className="text-xs text-[#F5F5F5] font-medium my-1 line-clamp-2">
          {irrigationRecommendation}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#1F2428] text-xs font-mono text-[#8A9198]">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#FF9A3D]" />
            <span>{Math.round(predictedIrrigationDuration / 60)} m</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{predictedWaterRequirement} L</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
                Edge AI Decision Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1B1F21] text-[#8A9198] border border-[#282E33]">
                Lokal (Zero-Internet)
              </span>
            </div>
            <div className="text-[11px] text-[#8A9198] font-mono">
              Model: {modelStatus}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-mono text-[#8A9198]">Tingkat Kepercayaan</div>
          <div className="text-sm font-bold font-mono text-[#22C55E]">
            {confidence}% <span className="text-[10px] font-normal text-[#8A9198]">heuristik</span>
          </div>
        </div>
      </div>

      {/* Main Recommendation Text Box */}
      <div className={`my-4 p-4 rounded-xl border ${currentUrgencyClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Hasil Analisis Agronomi Presisi
            </span>
          </div>
          <p className="text-sm font-medium text-[#F5F5F5] leading-relaxed">
            {irrigationRecommendation}
          </p>
        </div>

        {onApplyRecommendation && predictedIrrigationDuration > 0 && (
          <button
            onClick={() => onApplyRecommendation(predictedIrrigationDuration)}
            className="w-full md:w-auto px-4 py-2.5 bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-bold text-xs uppercase font-mono tracking-wider rounded-lg transition-all shadow-md shadow-[#FF7A00]/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Jalankan Rekomendasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
          <div className="text-[10px] text-[#8A9198] font-mono uppercase flex items-center gap-1">
            <Droplets className="w-3 h-3 text-[#38BDF8]" /> Kebutuhan Air Tanaman
          </div>
          <div className="text-xl font-extrabold font-mono text-[#F5F5F5] mt-1">
            {predictedWaterRequirement} <span className="text-xs font-normal text-[#8A9198]">Liter / m²</span>
          </div>
        </div>

        <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
          <div className="text-[10px] text-[#8A9198] font-mono uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#FF9A3D]" /> Durasi Irigasi Ideal
          </div>
          <div className="text-xl font-extrabold font-mono text-[#F5F5F5] mt-1">
            {Math.round(predictedIrrigationDuration / 60)} <span className="text-xs font-normal text-[#8A9198]">Menit ({predictedIrrigationDuration}s)</span>
          </div>
        </div>

        <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
          <div className="text-[10px] text-[#8A9198] font-mono uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#22C55E]" /> Ketahanan Waterbank
          </div>
          <div className="text-xl font-extrabold font-mono text-[#F5F5F5] mt-1">
            ~{predictedWaterbankDays} <span className="text-xs font-normal text-[#8A9198]">Hari</span>
          </div>
        </div>
      </div>

      {/* "Why this recommendation?" Section */}
      <div className="pt-3 border-t border-[#22272B]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold font-mono text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
            Why This Recommendation? (Explainable Factors)
          </h4>
          <span className="text-[10px] font-mono text-[#8A9198]">
            Simulated / Agronomic Rules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {explainableFactors && explainableFactors.map((factor, idx) => (
            <div
              key={idx}
              className="bg-[#1B1F21] p-2.5 rounded-lg border border-[#282E33] flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-[#F5F5F5]">{factor.name}</div>
                <div className="text-[11px] text-[#8A9198]">{factor.value} • {factor.direction}</div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                factor.level === 'high' 
                  ? 'bg-[#FF7A00]/10 text-[#FF9A3D] border-[#FF7A00]/30' 
                  : factor.level === 'medium'
                  ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                  : 'bg-[#282E33] text-[#8A9198] border-[#353D44]'
              }`}>
                {factor.impact}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-[#8A9198] mt-2 italic">
          {statusNote}
        </p>
      </div>
    </div>
  );
}
