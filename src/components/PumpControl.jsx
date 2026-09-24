import React from 'react';
import { Power, Activity, AlertOctagon } from 'lucide-react';

export default function PumpControl({
  isActive = false,
  onToggle,
  disabled = false,
  disabledReason = ''
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isActive 
        ? 'bg-[#22C55E]/10 border-[#22C55E]/40 shadow-lg shadow-[#22C55E]/5' 
        : 'bg-[#141719] border-[#22272B]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-mono font-bold ${
            isActive 
              ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40' 
              : 'bg-[#1B1F21] text-[#8A9198] border-[#282E33]'
          }`}>
            <Power className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
              Pompa Submersible
            </h4>
            <span className="text-[11px] text-[#8A9198]">Relay GPIO 26</span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
          isActive 
            ? 'bg-[#22C55E] text-[#0B0D0E]' 
            : 'bg-[#1B1F21] text-[#8A9198] border border-[#282E33]'
        }`}>
          {isActive ? 'MENYALA' : 'MATI'}
        </span>
      </div>

      {disabledReason && (
        <div className="mb-3 p-2 rounded bg-[#EF4444]/10 border border-[#EF4444]/20 text-[11px] text-[#EF4444] flex items-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
          <span>{disabledReason}</span>
        </div>
      )}

      <button
        onClick={() => onToggle && onToggle(!isActive)}
        disabled={disabled}
        className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          isActive
            ? 'bg-[#EF4444] hover:bg-[#F87171] text-white shadow-md shadow-[#EF4444]/20'
            : 'bg-[#22C55E] hover:bg-[#4ADE80] text-[#0B0D0E] shadow-md shadow-[#22C55E]/20'
        }`}
      >
        <Power className="w-4 h-4" />
        <span>{isActive ? 'Matikan Pompa' : 'Nyalakan Pompa'}</span>
      </button>
    </div>
  );
}
