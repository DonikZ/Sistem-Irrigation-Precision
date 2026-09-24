import React from 'react';

export default function StatusBadge({ status, type = 'info', label, size = 'md' }) {
  const typeStyles = {
    success: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
    danger: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
    warning: 'bg-[#FF7A00]/10 text-[#FF9A3D] border-[#FF7A00]/30',
    info: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
    neutral: 'bg-[#1B1F21] text-[#8A9198] border-[#282E33]',
  };

  const dotColors = {
    success: 'bg-[#22C55E]',
    danger: 'bg-[#EF4444]',
    warning: 'bg-[#FF7A00]',
    info: 'bg-[#38BDF8]',
    neutral: 'bg-[#8A9198]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const chosenStyle = typeStyles[type] || typeStyles.info;
  const chosenDot = dotColors[type] || dotColors.info;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wide whitespace-nowrap ${chosenStyle} ${sizeStyles[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${chosenDot} animate-pulse`} />
      {label || status}
    </span>
  );
}
