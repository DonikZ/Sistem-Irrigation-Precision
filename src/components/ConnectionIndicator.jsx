import React from 'react';
import { Bluetooth, Wifi, Cloud, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { BLE_STATUS } from '../bluetooth/bleConstants.js';

export default function ConnectionIndicator({ compact = false }) {
  const {
    bluetoothStatus,
    isVirtualBle,
    isOnline,
    cloudStatus,
    setBluetoothModalOpen,
    connectedDeviceName
  } = useApp();

  const isBleConnected = bluetoothStatus === BLE_STATUS.CONNECTED;
  const isBleConnecting = bluetoothStatus === BLE_STATUS.CONNECTING;

  const handleBleClick = () => {
    setBluetoothModalOpen(true);
  };

  const bleLabel = isBleConnected
    ? isVirtualBle ? 'VIRTUAL BLE' : 'BLE'
    : 'NO BLE';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* BLE */}
        <button
          onClick={handleBleClick}
          title={isBleConnected ? `Bluetooth ESP32: Terhubung (${isVirtualBle ? 'Gateway Virtual' : connectedDeviceName || 'Hardware Asli'}) - Klik untuk Kelola` : 'Pindai & Hubungkan Bluetooth ESP32'}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
            isBleConnected
              ? isVirtualBle
                ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
                : 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
              : isBleConnecting
              ? 'bg-[#FF7A00]/10 border-[#FF7A00]/30 text-[#FF9A3D] animate-pulse'
              : 'bg-[#141719] border-[#22272B] text-[#8A9198] hover:border-[#FF7A00]/40'
          }`}
        >
          <Bluetooth className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{bleLabel}</span>
        </button>

        {/* Internet */}
        <div
          title={`Internet: ${isOnline ? 'ONLINE' : 'OFFLINE'}`}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border ${
            isOnline
              ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isOnline ? 'NET' : 'OFF'}</span>
        </div>

        {/* Cloud */}
        <div
          title={`Cloud Sync: ${cloudStatus}`}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border ${
            cloudStatus === 'SYNCED'
              ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
              : 'bg-[#141719] border-[#22272B] text-[#8A9198]'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{cloudStatus === 'SYNCED' ? 'SYNC' : 'LOCAL'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-[#141719] border border-[#22272B] rounded-xl">
      {/* Bluetooth BLE Status */}
      <button
        type="button"
        onClick={handleBleClick}
        title={isBleConnected ? `Bluetooth ESP32: Terhubung (${isVirtualBle ? 'Gateway Virtual' : connectedDeviceName || 'Hardware Asli'}) - Klik untuk Kelola` : 'Klik untuk Buka Pemindai & Panduan Bluetooth ESP32'}
        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
          isBleConnected
            ? isVirtualBle
              ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
              : 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
            : isBleConnecting
            ? 'bg-[#FF7A00]/10 border-[#FF7A00]/40 text-[#FF9A3D] animate-pulse'
            : 'bg-[#1B1F21] border-[#282E33] text-[#8A9198] hover:border-[#FF7A00]/40'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${
            isBleConnected
              ? isVirtualBle ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-[#22C55E]/20 text-[#22C55E]'
              : 'bg-[#22272B] text-[#8A9198]'
          }`}>
            <Bluetooth className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#8A9198] uppercase tracking-wider font-mono">
              Bluetooth {isVirtualBle ? '(ESP32 Virtual)' : 'BLE'}
            </div>
            <div className="text-xs font-semibold">
              {isBleConnected ? (isVirtualBle ? 'Gateway Aktif' : (connectedDeviceName || 'Terhubung')) : bluetoothStatus}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono underline text-[#FF9A3D]">
          {isBleConnected ? 'Kelola' : isBleConnecting ? 'Mencari...' : 'Pindai'}
        </span>
      </button>

      {/* Internet Status */}
      <div
        className={`flex items-center justify-between p-2.5 rounded-lg border ${
          isOnline
            ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
            : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isOnline ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#8A9198] uppercase tracking-wider font-mono">Koneksi Internet</div>
            <div className="text-xs font-semibold">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#8A9198]">
          {isOnline ? 'BMKG Aktif' : 'Edge Mode'}
        </span>
      </div>

      {/* Supabase Cloud Status */}
      <div
        className={`flex items-center justify-between p-2.5 rounded-lg border ${
          cloudStatus === 'SYNCED'
            ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
            : 'bg-[#1B1F21] border-[#282E33] text-[#8A9198]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${cloudStatus === 'SYNCED' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-[#22272B] text-[#8A9198]'}`}>
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#8A9198] uppercase tracking-wider font-mono">Cloud Supabase</div>
            <div className="text-xs font-semibold">{cloudStatus}</div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#8A9198]">
          {cloudStatus === 'SYNCED' ? 'PostgreSQL' : 'Antrean Lokal'}
        </span>
      </div>
    </div>
  );
}
