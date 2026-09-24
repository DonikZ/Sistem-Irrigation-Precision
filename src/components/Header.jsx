import React, { useState } from 'react';
import { Menu, ShieldAlert, Sparkles, Radio } from 'lucide-react';
import ConnectionIndicator from './ConnectionIndicator.jsx';
import ActiveLandBadge from './ActiveLandBadge.jsx';
import LiveLocationControl from './LiveLocationControl.jsx';
import FieldManagementModal from './FieldManagementModal.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Header({ onMenuClick }) {
  const { irrigationState, emergencyStop } = useApp();
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-[#0B0D0E]/80 backdrop-blur-md border-b border-[#1B1F21] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile hamburger & Land/Crop Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg bg-[#141719] border border-[#22272B] text-[#8A9198] hover:text-[#F5F5F5]"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Land & Crop Pill */}
          <ActiveLandBadge onOpenManageModal={() => setFieldModalOpen(true)} />

          {/* Live GPS Location Pill */}
          <div className="hidden md:block">
            <LiveLocationControl compact={true} />
          </div>
        </div>

        {/* Right: Emergency Stop Guard & Connectivity Indicators */}
        <div className="flex items-center gap-3">
          {irrigationState.isActive && (
            <button
              onClick={emergencyStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-md shadow-[#EF4444]/30 animate-pulse cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden md:inline">EMERGENCY STOP</span>
            </button>
          )}

          <ConnectionIndicator compact={true} />
        </div>
      </header>

      {/* Field & Crop Management Modal */}
      <FieldManagementModal
        isOpen={fieldModalOpen}
        onClose={() => setFieldModalOpen(false)}
      />
    </>
  );
}
