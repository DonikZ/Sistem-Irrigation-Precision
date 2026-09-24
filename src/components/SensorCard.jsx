import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SensorCard({
  title,
  value,
  unit,
  icon: Icon,
  status = 'normal',
  statusLabel = 'Normal',
  min,
  max,
  avg,
  target,
  accentColor = '#FF7A00',
  description
}) {
  const statusColorMap = {
    optimal: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30',
    normal: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30',
    warning: 'text-[#FF9A3D] bg-[#FF7A00]/10 border-[#FF7A00]/30',
    danger: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
  };

  const badgeClass = statusColorMap[status] || statusColorMap.normal;

  return (
    <div className="relative group bg-[#141719] hover:bg-[#181C1E] border border-[#22272B] hover:border-[#FF7A00]/40 rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#FF7A00]/5 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#282E33] bg-[#1B1F21] group-hover:border-[#FF7A00]/50 transition-colors"
            style={{ color: accentColor }}
          >
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#8A9198] uppercase tracking-wider font-mono">
              {title}
            </h3>
            {description && <p className="text-[11px] text-[#5A626A] line-clamp-1">{description}</p>}
          </div>
        </div>

        <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="my-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight font-mono text-[#F5F5F5] group-hover:text-white transition-colors">
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-[#8A9198] font-mono">
            {unit}
          </span>
        )}
      </div>

      {/* Target or Sub-stats */}
      <div className="pt-2 border-t border-[#1F2428] flex items-center justify-between text-[11px] font-mono text-[#8A9198]">
        {target !== undefined ? (
          <div>Target: <span className="text-[#F5F5F5] font-semibold">{target}{unit}</span></div>
        ) : (min !== undefined || avg !== undefined || max !== undefined) ? (
          <div className="flex items-center gap-2">
            {min !== undefined && <span>Min: <span className="text-[#F5F5F5]">{min}</span></span>}
            {avg !== undefined && <span>Rata: <span className="text-[#F5F5F5]">{avg}</span></span>}
            {max !== undefined && <span>Maks: <span className="text-[#F5F5F5]">{max}</span></span>}
          </div>
        ) : (
          <div className="text-[10px] text-[#5A626A] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
            <span>Menunggu pembacaan ESP32 (0)</span>
          </div>
        )}
        <div className="w-2 h-2 rounded-full bg-[#22272B] group-hover:bg-[#FF7A00] transition-colors" />
      </div>
    </div>
  );
}
