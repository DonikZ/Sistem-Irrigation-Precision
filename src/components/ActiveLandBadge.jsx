import React, { useState, useRef, useEffect } from 'react';
import { Sprout, ChevronDown, Check, Plus, Settings2, Clock, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatLandArea } from '../utils/landArea.js';

export default function ActiveLandBadge({ onOpenManageModal }) {
  const {
    lands,
    activeLandId,
    activeLand,
    switchActiveLand,
    currentPlant,
    changeCropForActiveLand,
    plantProfiles
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateHst = (plantingDateStr) => {
    if (!plantingDateStr) return 0;
    const planting = new Date(plantingDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - planting);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const hst = calculateHst(activeLand?.plantingDate);

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141719] border border-[#22272B] hover:border-[#FF7A00]/50 text-xs text-[#F5F5F5] transition-all cursor-pointer"
        title="Klik untuk memilih petak lahan atau mengubah tanaman"
      >
        <span className="p-1 rounded bg-[#22C55E]/15 text-[#22C55E]">
          <Sprout className="w-3.5 h-3.5" />
        </span>

        <div className="text-left hidden sm:block">
          <div className="text-[11px] font-bold text-[#F5F5F5] truncate max-w-[150px]">
            {activeLand?.name || 'Lahan Utama'}
          </div>
          <div className="text-[9px] text-[#8A9198] truncate max-w-[150px]">
            {activeLand?.customCropName || currentPlant.name} • {hst} HST
          </div>
        </div>

        <div className="sm:hidden text-left">
          <span className="text-[11px] font-bold text-[#F5F5F5]">
            {activeLand?.name?.split('-')[0] || 'Lahan'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#8A9198] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#141719] border border-[#282E33] rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-[#22272B] flex items-center justify-between text-[11px] text-[#8A9198]">
            <span className="font-bold uppercase tracking-wider text-[#F5F5F5]">PILIH PETAK LAHAN</span>
            <span>{lands.length} Lahan</span>
          </div>

          {/* List of Lands */}
          <div className="max-h-52 overflow-y-auto py-1 space-y-1">
            {lands.map((land) => {
              const isSelected = land.id === activeLandId;
              const p = plantProfiles[land.plantType] || currentPlant;
              const landHst = calculateHst(land.plantingDate);

              return (
                <button
                  key={land.id}
                  onClick={() => {
                    switchActiveLand(land.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B1F21] text-[#FF7A00] font-bold'
                      : 'hover:bg-[#1B1F21]/60 text-[#F5F5F5]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs flex items-center gap-1.5">
                      <span>{land.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                    </div>
                    <div className="text-[10px] text-[#8A9198]">
                      {land.customCropName || p.name} • {landHst} HST
                    </div>
                  </div>
                  <div className="text-[10px] text-[#5A626A] font-mono text-right">
                    {formatLandArea(land)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions Bar */}
          <div className="pt-2 border-t border-[#22272B] space-y-1">
            <button
              onClick={() => {
                setDropdownOpen(false);
                if (onOpenManageModal) onOpenManageModal();
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Nama Lahan Baru</span>
            </button>

            <button
              onClick={() => {
                setDropdownOpen(false);
                if (onOpenManageModal) onOpenManageModal();
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-[#1B1F21] hover:bg-[#282E33] text-[#8A9198] hover:text-[#F5F5F5] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Kelola Lahan & Ganti Tanaman Lengkap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
