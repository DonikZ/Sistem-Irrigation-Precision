import React, { useState, useEffect, useRef } from 'react';
import {
  Bluetooth,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Cpu,
  Info,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Power,
  Terminal,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { BLE_STATUS } from '../bluetooth/bleConstants.js';

export default function BluetoothModal({ isOpen, onClose }) {
  const {
    bluetoothStatus,
    connectedDeviceName,
    isVirtualBle,
    isBluetoothSupported,
    isInsideIframe,
    connectBluetooth,
    disconnectBluetooth,
    settings,
    bleManager
  } = useApp();

  const [acceptAll, setAcceptAll] = useState(false);
  const [customPrefix, setCustomPrefix] = useState(settings?.deviceId || 'ESP32');
  const [serviceUuid, setServiceUuid] = useState(settings?.bleServiceUuid || '6e400001-b5a3-f393-e0a9-e50e24dcca9e');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [liveLogs, setLiveLogs] = useState(() => bleManager ? bleManager.getLogs() : []);
  const logsEndRef = useRef(null);

  // Subscribe to real-time BLE logs
  useEffect(() => {
    if (!isOpen || !bleManager) return;
    setLiveLogs(bleManager.getLogs());

    const unsub = bleManager.onLog((item, allLogs) => {
      setLiveLogs([...allLogs]);
    });
    return unsub;
  }, [isOpen, bleManager]);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs]);

  if (!isOpen) return null;

  const isConnected = bluetoothStatus === BLE_STATUS.CONNECTED;
  const isConnecting = bluetoothStatus === BLE_STATUS.CONNECTING || isScanning;

  const handleStartScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const res = await connectBluetooth({
        acceptAllDevices: acceptAll,
        namePrefix: customPrefix.trim(),
        serviceUuid: serviceUuid.trim()
      });
      if (!res && !isConnected) {
        // Cancelled or unsupported
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memindai perangkat Bluetooth.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectVirtual = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      await connectBluetooth({ forceVirtual: true });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectBluetooth();
  };

  const handleOpenStandaloneTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#141719] border border-[#282E33] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#22272B] flex items-center justify-between sticky top-0 bg-[#141719]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isConnected
                ? isVirtualBle
                  ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                  : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                : isConnecting
                ? 'bg-[#FF7A00]/10 text-[#FF9A3D] border-[#FF7A00]/30 animate-pulse'
                : 'bg-[#1B1F21] text-[#8A9198] border-[#282E33]'
            }`}>
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-[#F5F5F5] uppercase tracking-wider">
                Pindai & Hubungkan Bluetooth (BLE ESP32)
              </h2>
              <p className="text-xs text-[#8A9198] mt-0.5">
                Koneksi langsung mikrokontroler IoT untuk telemetri sensor & kontrol irigasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8A9198] hover:text-[#F5F5F5] rounded-lg hover:bg-[#1F2428] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* 1. Connection Status Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected
              ? isVirtualBle
                ? 'bg-[#38BDF8]/10 border-[#38BDF8]/40 text-[#38BDF8]'
                : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]'
              : isConnecting
              ? 'bg-[#FF7A00]/10 border-[#FF7A00]/40 text-[#FF9A3D]'
              : 'bg-[#1B1F21] border-[#282E33] text-[#8A9198]'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  isConnected
                    ? isVirtualBle ? 'bg-[#38BDF8] animate-pulse' : 'bg-[#22C55E] animate-pulse'
                    : isConnecting
                    ? 'bg-[#FF7A00] animate-ping'
                    : 'bg-[#5A626A]'
                }`} />
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5]">
                    Status: {isConnected ? (isVirtualBle ? 'Gateway Virtual Aktif' : 'Terhubung ke ESP32') : isConnecting ? 'Sedang Memindai / Menghubungkan...' : 'Belum Terhubung'}
                  </div>
                  <div className="text-xs text-[#8A9198] mt-0.5 font-mono">
                    {isConnected
                      ? `Perangkat: ${connectedDeviceName || (isVirtualBle ? 'ESP32 Virtual Gateway' : 'ESP32 PANGAN-SENSE')}`
                      : 'Menunggu inisiasi pemindaian Bluetooth LE'}
                  </div>
                </div>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/40 text-[#EF4444] rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Putuskan Sambungan</span>
                </button>
              ) : (
                <div className="text-[11px] font-mono text-[#8A9198] flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span>Siap Memindai</span>
                </div>
              )}
            </div>
          </div>

          {/* Iframe Notice & Standalone Tab Button */}
          {isInsideIframe && (
            <div className="p-3.5 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-xs font-mono text-[#FF9A3D] space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF7A00]" />
                <div className="space-y-1">
                  <div className="font-bold text-[#F5F5F5]">Pemberitahuan Izin Browser (Iframe Mode):</div>
                  <p className="text-[#CCCCCC] leading-relaxed text-[11px]">
                    Beberapa browser (seperti Chrome) membatasi akses dialog Web Bluetooth di dalam frame preview. Jika dialog pop-up tidak muncul, Anda dapat membuka aplikasi di <strong>Tab Baru</strong> untuk akses hardware langsung tanpa batas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="px-3 py-1.5 bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru (Akses Bluetooth Penuh)</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs font-mono text-[#EF4444] flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 2. Scanning Options & Action Buttons */}
          <div className="bg-[#1B1F21] border border-[#282E33] rounded-xl p-5 space-y-4 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5F5F5] uppercase tracking-wider pb-2 border-b border-[#282E33]">
              <SlidersHorizontal className="w-4 h-4 text-[#FF7A00]" />
              <span>Opsi Pemindaian (Scan Filter)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#8A9198] mb-1.5 uppercase">
                  Awalan Nama ESP32 (Name Prefix)
                </label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="Contoh: ESP32, PANGAN-SENSE"
                  disabled={acceptAll || isConnected}
                  className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#F5F5F5] rounded-lg p-2.5 outline-none transition-colors disabled:opacity-40"
                />
                <span className="text-[10px] text-[#5A626A] mt-1 block">
                  Akan mencocokkan nama perangkat yang berawalan kata ini.
                </span>
              </div>

              <div className="flex flex-col justify-between">
                <label className="block text-[#8A9198] mb-1.5 uppercase">
                  Mode Pindai Bebas
                </label>
                <label className="flex items-center gap-2.5 p-2.5 bg-[#141719] border border-[#282E33] rounded-lg cursor-pointer hover:border-[#FF7A00]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptAll}
                    onChange={(e) => setAcceptAll(e.target.checked)}
                    disabled={isConnected}
                    className="w-4 h-4 accent-[#FF7A00] cursor-pointer"
                  />
                  <div className="text-[11px] text-[#F5F5F5]">
                    Pindai Semua Perangkat (Accept All)
                  </div>
                </label>
                <span className="text-[10px] text-[#5A626A] mt-1 block">
                  Tampilkan seluruh perangkat BLE terdekat tanpa filter nama.
                </span>
              </div>

              {/* Service UUID Configuration */}
              <div className="col-span-1 sm:col-span-2 pt-2 border-t border-[#22272B]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#8A9198] uppercase text-[11px] font-bold">
                    Service UUID ESP32 (Sesuai Sketsa Arduino)
                  </label>
                  <span className="text-[10px] text-[#38BDF8]">
                    #define SERVICE_UUID
                  </span>
                </div>
                <input
                  type="text"
                  value={serviceUuid}
                  onChange={(e) => setServiceUuid(e.target.value)}
                  placeholder="6e400001-b5a3-f393-e0a9-e50e24dcca9e atau 4fafc201-..."
                  disabled={isConnected}
                  className="w-full bg-[#141719] border border-[#282E33] focus:border-[#FF7A00] text-[#38BDF8] font-mono text-xs rounded-lg p-2.5 outline-none transition-colors"
                />
                
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                  <span className="text-[#5A626A]">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setServiceUuid('6e400001-b5a3-f393-e0a9-e50e24dcca9e')}
                    className="px-2 py-0.5 rounded bg-[#1B1F21] hover:bg-[#252A2E] text-[#CCCCCC] border border-[#282E33] cursor-pointer"
                  >
                    Nordic NUS (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceUuid('4fafc201-1fb5-459e-8fcc-c5c9c331914b')}
                    className="px-2 py-0.5 rounded bg-[#1B1F21] hover:bg-[#252A2E] text-[#CCCCCC] border border-[#282E33] cursor-pointer"
                  >
                    ESP32 BLE Server (4fafc201...)
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceUuid('0000ffe0-0000-1000-8000-00805f9b34fb')}
                    className="px-2 py-0.5 rounded bg-[#1B1F21] hover:bg-[#252A2E] text-[#CCCCCC] border border-[#282E33] cursor-pointer"
                  >
                    HC-08 Serial (FFE0)
                  </button>
                </div>
                <span className="text-[10px] text-[#5A626A] mt-1.5 block">
                  Jika muncul error <em>"Tidak dapat menemukan Service BLE"</em>, buka sketsa Arduino Anda, cari baris <code>#define SERVICE_UUID</code> atau <code>createService(...)</code>, lalu salin dan tempel UUID-nya ke sini.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleStartScan}
                disabled={isConnecting || isConnected}
                className="w-full sm:flex-1 py-3 bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membuka Dialog Pemindai Browser...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    <span>Mulai Scanning Bluetooth</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleConnectVirtual}
                disabled={isConnecting || isConnected}
                className="w-full sm:w-auto px-4 py-3 bg-[#141719] hover:bg-[#22272B] border border-[#282E33] text-[#38BDF8] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Cpu className="w-4 h-4" />
                <span>Simulasi Virtual</span>
              </button>
            </div>
          </div>

          {/* Live BLE Serial / Activity Terminal */}
          <div className="bg-[#0B0D0E] border border-[#282E33] rounded-xl p-4 font-mono space-y-2">
            <div className="flex items-center justify-between border-b border-[#1E2326] pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Log Serial & Telemetri BLE Real-Time
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B1F21] text-[#8A9198] border border-[#282E33]">
                  {liveLogs.length} pesan
                </span>
              </div>
              {liveLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLiveLogs([])}
                  className="text-[11px] text-[#8A9198] hover:text-[#EF4444] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Bersihkan
                </button>
              )}
            </div>

            <div className="bg-[#060809] border border-[#1B1F21] rounded-lg p-3 h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
              {liveLogs.length === 0 ? (
                <div className="text-[#5A626A] text-[11px] py-4 text-center">
                  Belum ada transmisi data. Klik "Mulai Scanning Bluetooth" untuk menghubungkan ESP32.
                </div>
              ) : (
                liveLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed break-all text-[11px]">
                    <span className="text-[#5A626A] shrink-0">{log.time}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                      log.type === 'rx'
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : log.type === 'tx'
                        ? 'bg-[#38BDF8]/10 text-[#38BDF8]'
                        : log.type === 'error'
                        ? 'bg-[#EF4444]/10 text-[#EF4444]'
                        : log.type === 'warn'
                        ? 'bg-[#FF7A00]/10 text-[#FF9A3D]'
                        : 'bg-[#8A9198]/10 text-[#8A9198]'
                    }`}>
                      {log.type}
                    </span>
                    <span className={
                      log.type === 'rx' ? 'text-[#A3E635]' :
                      log.type === 'tx' ? 'text-[#38BDF8]' :
                      log.type === 'error' ? 'text-[#F87171]' :
                      log.type === 'warn' ? 'text-[#FBBF24]' :
                      'text-[#CCCCCC]'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
            <p className="text-[10px] text-[#5A626A]">
              Menampilkan paket mentah yang diterima dari modul ESP32 secara langsung (termasuk status online, JSON, dan telemetri).
            </p>
          </div>

          {/* 3. Step-by-Step Guide & Troubleshooting */}
          <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5F5F5] uppercase tracking-wider pb-2 border-b border-[#22272B]">
              <Info className="w-4 h-4 text-[#38BDF8]" />
              <span>Panduan & Solusi Masalah Koneksi ESP32</span>
            </div>

            <div className="p-3 bg-[#FF7A00]/10 border border-[#FF7A00]/30 rounded-lg text-xs text-[#FF9A3D] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>PENTING: Batasan 1 Perangkat ESP32 (Single Central)</span>
              </div>
              <p className="text-[11px] text-[#E08A38] leading-relaxed">
                ESP32 BLE hanya dapat terhubung ke <strong>1 perangkat dalam satu waktu</strong>. Jika ESP32 Anda masih terhubung ke aplikasi Bluetooth di HP (seperti nRF Connect atau Serial Bluetooth Terminal), putuskan sambungan (disconnect) di HP terlebih dahulu agar browser web dapat terhubung.
              </p>
            </div>

            <div className="space-y-3 text-xs text-[#CCCCCC]">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00] text-[#FF9A3D] flex items-center justify-center shrink-0 text-[11px] font-bold">
                  1
                </div>
                <div>
                  <span className="font-bold text-[#F5F5F5]">Nyalakan Perangkat ESP32:</span>
                  <p className="text-[#8A9198] text-[11px] mt-0.5">
                    Pastikan board ESP32 teraliri daya (LED menyala) dan kode program Arduino/ESP-IDF BLE UART (Nordic UART Service) telah diunggah.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00] text-[#FF9A3D] flex items-center justify-center shrink-0 text-[11px] font-bold">
                  2
                </div>
                <div>
                  <span className="font-bold text-[#F5F5F5]">Aktifkan Bluetooth Komputer / HP:</span>
                  <p className="text-[#8A9198] text-[11px] mt-0.5">
                    Pastikan Bluetooth pada laptop, PC, atau smartphone Android Anda dalam posisi <strong>ON / Aktif</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00] text-[#FF9A3D] flex items-center justify-center shrink-0 text-[11px] font-bold">
                  3
                </div>
                <div>
                  <span className="font-bold text-[#F5F5F5]">Gunakan Browser yang Mendukung:</span>
                  <p className="text-[#8A9198] text-[11px] mt-0.5">
                    Web Bluetooth didukung resmi di <strong>Google Chrome, Microsoft Edge, Opera, dan Chrome Android</strong> melalui protokol HTTPS.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00] text-[#FF9A3D] flex items-center justify-center shrink-0 text-[11px] font-bold">
                  4
                </div>
                <div>
                  <span className="font-bold text-[#F5F5F5]">Klik Tombol "Mulai Scanning Bluetooth":</span>
                  <p className="text-[#8A9198] text-[11px] mt-0.5">
                    Jendela dialog pop-up resmi browser akan muncul di bagian atas layar dan memindai semua sinyal Bluetooth LE terdekat.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00] text-[#FF9A3D] flex items-center justify-center shrink-0 text-[11px] font-bold">
                  5
                </div>
                <div>
                  <span className="font-bold text-[#F5F5F5]">Pilih ESP32 & Pasangkan (Pair):</span>
                  <p className="text-[#8A9198] text-[11px] mt-0.5">
                    Klik nama modul ESP32 Anda pada daftar, lalu klik tombol <strong>"Pair" / "Hubungkan"</strong>. Sistem akan langsung terkoneksi dan data sensor mengalir ke dashboard secara real-time!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Telemetry Format Reference */}
          <div className="bg-[#1B1F21] border border-[#282E33] rounded-xl p-4 text-xs font-mono text-[#8A9198] space-y-2">
            <div className="flex items-center gap-1.5 text-[#F5F5F5] font-bold text-[11px] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Format Data JSON Telemetri yang Dikirim ESP32</span>
            </div>
            <div className="bg-[#0B0D0E] p-2.5 rounded-lg border border-[#22272B] text-[11px] text-[#38BDF8] overflow-x-auto">
              <code>{`{"sm":48.2,"st":28.4,"at":29.1,"ah":65,"wl":82,"rf":0.0,"p":0,"v":0}`}</code>
            </div>
            <p className="text-[10px] text-[#5A626A] leading-relaxed">
              Keterangan: <code>sm</code>: Kelembapan Tanah (%), <code>st</code>: Suhu Tanah (°C), <code>at</code>: Suhu Udara (°C), <code>ah</code>: Kelembapan Udara (%), <code>wl</code>: Level Tandon (%), <code>rf</code>: Curah Hujan (mm), <code>p</code>: Pompa (0/1), <code>v</code>: Solenoid (0/1).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#22272B] bg-[#141719] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1B1F21] hover:bg-[#22272B] border border-[#282E33] text-xs font-mono font-bold text-[#F5F5F5] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
