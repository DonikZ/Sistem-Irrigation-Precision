import React from 'react';
import { Sliders, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export default function ValveControl({
  isActive = false,
  onToggle,
  disabled = false
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isActive 
        ? 'bg-[#38BDF8]/10 border-[#38BDF8]/40 shadow-lg shadow-[#38BDF8]/5' 
        : 'bg-[#141719] border-[#22272B]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-mono font-bold ${
            isActive 
              ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40' 
              : 'bg-[#1B1F21] text-[#8A9198] border-[#282E33]'
          }`}>
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Solenoid Valve
            </h4>
            <span className="text-[11px] text-[#8A9198]">Relay GPIO 27</span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
          isActive 
            ? 'bg-[#38BDF8] text-[#0B0D0E]' 
            : 'bg-[#1B1F21] text-[#8A9198] border border-[#282E33]'
        }`}>
          {isActive ? 'TERBUKA' : 'TERTUTUP'}
        </span>
      </div>

      <button
        onClick={() => onToggle && onToggle(!isActive)}
        disabled={disabled}
        className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          isActive
            ? 'bg-[#1B1F21] hover:bg-[#252A2E] text-[#38BDF8] border border-[#38BDF8]/40'
            : 'bg-[#1B1F21] hover:bg-[#252A2E] text-[#8A9198] border border-[#282E33] hover:text-[#F5F5F5]'
        }`}
      >
        <Sliders className="w-4 h-4" />
        <span>{isActive ? 'Tutup Solenoid' : 'Buka Solenoid'}</span>
      </button>
    </div>
  );
}
