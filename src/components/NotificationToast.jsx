import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function NotificationToast() {
  const { notifications, removeNotification } = useApp();

  if (!notifications || notifications.length === 0) return null;

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#FF9A3D] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#38BDF8] shrink-0" />,
  };

  const borders = {
    success: 'border-[#22C55E]/40 bg-[#141719]/95 text-[#F5F5F5]',
    danger: 'border-[#EF4444]/40 bg-[#141719]/95 text-[#F5F5F5]',
    warning: 'border-[#FF7A00]/40 bg-[#141719]/95 text-[#F5F5F5]',
    info: 'border-[#38BDF8]/40 bg-[#141719]/95 text-[#F5F5F5]',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
            borders[item.type] || borders.info
          }`}
        >
          {icons[item.type] || icons.info}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#FF9A3D]">
                {item.title || 'PANGAN-SENSE'}
              </span>
              <span className="text-[10px] font-mono text-[#8A9198]">{item.time}</span>
            </div>
            <p className="text-xs text-[#E5E5E5] mt-0.5 leading-snug break-words">
              {item.message}
            </p>
          </div>
          <button
            onClick={() => removeNotification(item.id)}
            className="text-[#8A9198] hover:text-white transition-colors p-0.5"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
