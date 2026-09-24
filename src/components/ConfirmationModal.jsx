import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  variant = 'warning'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#141719] border border-[#282E33] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#8A9198] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${
            variant === 'danger' 
              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30' 
              : 'bg-[#FF7A00]/20 text-[#FF9A3D] border border-[#FF7A00]/30'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5] font-mono">
              {title}
            </h3>
            <span className="text-xs text-[#8A9198]">Verifikasi Sistem Presisi</span>
          </div>
        </div>

        <p className="text-sm text-[#CCCCCC] leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 font-mono text-xs">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-[#282E33] bg-[#1B1F21] text-[#8A9198] hover:text-white hover:border-[#38BDF8]/40 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-[#0B0D0E] transition-all cursor-pointer ${
              variant === 'danger'
                ? 'bg-[#EF4444] hover:bg-[#F87171] text-white shadow-lg shadow-[#EF4444]/30'
                : 'bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] shadow-lg shadow-[#FF7A00]/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
