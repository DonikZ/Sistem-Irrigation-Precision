import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Filter,
  CheckCircle,
  Cloud,
  CloudOff,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  Clock,
  Droplets,
  Sliders,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { storageService } from '../services/storageService.js';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

export default function HistoryPage() {
  const { isOnline, addNotification, syncQueueCount, irrigationState } = useApp();
  const [activeTab, setActiveTab] = useState('sensor'); // 'sensor' | 'irrigation' | 'waterbank'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const [sensorLogs, setSensorLogs] = useState([]);
  const [irrigationLogs, setIrrigationLogs] = useState([]);
  const [waterbankLogs, setWaterbankLogs] = useState([]);

  const loadData = () => {
    // Sensor logs from local reading history or real project readings
    const local = storageService.getLocalReadings();
    if (local && local.length > 0) {
      setSensorLogs(local.map((item, idx) => ({
        id: item.id || `LOG-${String(idx + 1).padStart(3, '0')}`,
        time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--',
        date: item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '--',
        soilM: item.soilMoisture ?? 0,
        soilT: item.soilTemperature ?? 0,
        airT: item.airTemperature ?? 0,
        airH: item.airHumidity ?? 0,
        rain: item.rainfall ?? 0.0,
        sync: isOnline
      })));
    } else {
      setSensorLogs([]);
    }

    setIrrigationLogs(storageService.getIrrigationLogs());
    setWaterbankLogs(storageService.getWaterbankLogs());
  };

  useEffect(() => {
    loadData();
  }, [irrigationState.totalWaterUsedToday]);

  const handleClearLogsConfirm = () => {
    setConfirmClearOpen(false);
    if (activeTab === 'irrigation') {
      storageService.clearIrrigationLogs();
      setIrrigationLogs([]);
      addNotification('Riwayat log irigasi telah dibersihkan.', 'info', 'Log Dibersihkan');
    } else if (activeTab === 'waterbank') {
      storageService.clearWaterbankLogs();
      setWaterbankLogs([]);
      addNotification('Riwayat log waterbank telah dibersihkan.', 'info', 'Log Dibersihkan');
    } else {
      localStorage.removeItem('pangan_sense_local_history');
      setSensorLogs([]);
      addNotification('Riwayat log sensor lahan telah dibersihkan.', 'info', 'Log Dibersihkan');
    }
  };

  // Filtered sensor logs
  const filteredSensorLogs = sensorLogs.filter(log => {
    const matchesSearch = log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.time.includes(searchQuery) ||
      log.date.includes(searchQuery);
    if (selectedFilter === 'critical') return matchesSearch && log.soilM < 40;
    if (selectedFilter === 'rain') return matchesSearch && log.rain > 0;
    return matchesSearch;
  });

  const filteredIrrigationLogs = irrigationLogs.filter(log => {
    return log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.trigger?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.date?.includes(searchQuery);
  });

  const filteredWaterbankLogs = waterbankLogs.filter(log => {
    return log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.date?.includes(searchQuery);
  });

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'sensor') {
      filename = 'pangan-sense-sensor-logs.csv';
      csvContent = 'ID,Waktu,Tanggal,KelembapanTanah(%),SuhuTanah(C),SuhuUdara(C),KelembapanUdara(%),CurahHujan(mm),Tersinkron\n' +
        filteredSensorLogs.map(l => `${l.id},${l.time},${l.date},${l.soilM},${l.soilT},${l.airT},${l.airH},${l.rain},${l.sync ? 'Ya' : 'Belum'}`).join('\n');
    } else if (activeTab === 'irrigation') {
      filename = 'pangan-sense-irrigation-logs.csv';
      csvContent = 'ID,Waktu,Tanggal,Durasi,AirTerpakai,Pemicu,Status\n' +
        filteredIrrigationLogs.map(l => `${l.id},${l.time},${l.date},${l.duration},${l.waterUsed},${l.trigger},${l.status}`).join('\n');
    } else {
      filename = 'pangan-sense-waterbank-logs.csv';
      csvContent = 'ID,Waktu,Tanggal,Peristiwa,Volume,LevelTandon,Keterangan\n' +
        filteredWaterbankLogs.map(l => `${l.id},${l.time},${l.date},${l.event},${l.volume},${l.currentLevel},${l.note}`).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification(`Berhasil mengekspor berkas ${filename}`, 'success', 'Export CSV');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>RIWAYAT & AUDIT SISTEM</span>
            <span className="text-[#FF7A00]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Log Telemetri & Cloud Sync
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Perekaman log parameter tanah, riwayat eksekusi pompa, dan antrean sinkronisasi cloud PostgreSQL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmClearOpen(true)}
            className="px-3 py-2 bg-[#1B1F21] hover:bg-[#282E33] text-[#8A9198] hover:text-[#EF4444] border border-[#282E33] hover:border-[#EF4444]/40 font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Bersihkan log tab aktif"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bersihkan Log</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#1B1F21] hover:bg-[#252A2E] text-[#F5F5F5] border border-[#282E33] hover:border-[#FF7A00]/50 font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-[#FF7A00]" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Strip */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOnline ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#FF7A00]/10 text-[#FF9A3D]'}`}>
            {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#F5F5F5] flex items-center gap-2">
              <span>Status Sinkronisasi Supabase:</span>
              <span className={isOnline ? 'text-[#22C55E]' : 'text-[#FF9A3D]'}>
                {isOnline ? 'ONLINE (Real-time Mirror)' : 'OFFLINE (Tersimpan Lokal)'}
              </span>
            </div>
            <div className="text-[11px] text-[#8A9198] font-mono">
              Antrean data offline menunggu sinkronisasi: <strong className="text-[#F5F5F5]">{syncQueueCount} item</strong>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-[#8A9198]">
          Sinkronisasi Terakhir: <span className="text-[#F5F5F5]">Baru saja</span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#22272B] pb-1">
        <button
          onClick={() => setActiveTab('sensor')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'sensor'
              ? 'text-[#FF9A3D] border-b-2 border-[#FF7A00] bg-[#141719]'
              : 'text-[#8A9198] hover:text-[#F5F5F5]'
          }`}
        >
          Log Sensor Lahan
        </button>
        <button
          onClick={() => setActiveTab('irrigation')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'irrigation'
              ? 'text-[#FF9A3D] border-b-2 border-[#FF7A00] bg-[#141719]'
              : 'text-[#8A9198] hover:text-[#F5F5F5]'
          }`}
        >
          Log Siklus Irigasi
        </button>
        <button
          onClick={() => setActiveTab('waterbank')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
            activeTab === 'waterbank'
              ? 'text-[#FF9A3D] border-b-2 border-[#FF7A00] bg-[#141719]'
              : 'text-[#8A9198] hover:text-[#F5F5F5]'
          }`}
        >
          Log Waterbank
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'sensor' && (
            filteredSensorLogs.length === 0 ? (
              <div className="text-center py-12 text-[#8A9198] text-xs font-mono space-y-1.5">
                <p className="text-sm font-semibold text-[#CCCCCC]">Belum Ada Catatan Riwayat Sensor (Standby 0)</p>
                <p className="text-[11px] text-[#5A626A]">Data telemetri sensor akan tercatat secara riil saat modul ESP32 proyek terhubung.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1B1F21] text-[#8A9198] border-b border-[#22272B]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Waktu</th>
                    <th className="py-3 px-4 font-semibold">Kelembapan</th>
                    <th className="py-3 px-4 font-semibold">Suhu Tanah</th>
                    <th className="py-3 px-4 font-semibold">Suhu Udara</th>
                    <th className="py-3 px-4 font-semibold">Kelembapan Udara</th>
                    <th className="py-3 px-4 font-semibold">Hujan</th>
                    <th className="py-3 px-4 font-semibold">Cloud Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2428] text-[#F5F5F5]">
                  {filteredSensorLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#181C1E] transition-colors">
                      <td className="py-3 px-4 text-[#8A9198]">{log.id}</td>
                      <td className="py-3 px-4">{log.date} {log.time}</td>
                      <td className="py-3 px-4 font-bold text-[#FF7A00]">{log.soilM}%</td>
                      <td className="py-3 px-4">{log.soilT}°C</td>
                      <td className="py-3 px-4">{log.airT}°C</td>
                      <td className="py-3 px-4">{log.airH}%</td>
                      <td className="py-3 px-4">{log.rain} mm</td>
                      <td className="py-3 px-4">
                        {log.sync ? (
                          <span className="text-[10px] text-[#22C55E] flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Tersinkron
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#FF9A3D] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Antrean
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'irrigation' && (
            filteredIrrigationLogs.length === 0 ? (
              <div className="text-center py-12 text-[#8A9198] text-xs font-mono space-y-1.5">
                <p className="text-sm font-semibold text-[#CCCCCC]">Belum Ada Catatan Riwayat Irigasi (Standby 0)</p>
                <p className="text-[11px] text-[#5A626A]">Riwayat eksekusi pompa dan solenoid valve akan tercatat otomatis saat penyiraman dijalankan.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1B1F21] text-[#8A9198] border-b border-[#22272B]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Waktu Eksekusi</th>
                    <th className="py-3 px-4 font-semibold">Durasi</th>
                    <th className="py-3 px-4 font-semibold">Air Terpakai</th>
                    <th className="py-3 px-4 font-semibold">Pemicu</th>
                    <th className="py-3 px-4 font-semibold">Status Operasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2428] text-[#F5F5F5]">
                  {filteredIrrigationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#181C1E] transition-colors">
                      <td className="py-3 px-4 text-[#8A9198]">{log.id}</td>
                      <td className="py-3 px-4">{log.date} {log.time}</td>
                      <td className="py-3 px-4 font-bold text-[#F5F5F5]">{log.duration}</td>
                      <td className="py-3 px-4 text-[#38BDF8] font-bold">{log.waterUsed}</td>
                      <td className="py-3 px-4 text-[#FF9A3D]">{log.trigger}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'waterbank' && (
            filteredWaterbankLogs.length === 0 ? (
              <div className="text-center py-12 text-[#8A9198] text-xs font-mono space-y-1.5">
                <p className="text-sm font-semibold text-[#CCCCCC]">Belum Ada Catatan Riwayat Waterbank (Standby 0)</p>
                <p className="text-[11px] text-[#5A626A]">Peristiwa pengisian dan fluktuasi air tandon akan tercatat otomatis saat perangkat terpasang.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1B1F21] text-[#8A9198] border-b border-[#22272B]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Waktu</th>
                    <th className="py-3 px-4 font-semibold">Peristiwa</th>
                    <th className="py-3 px-4 font-semibold">Perubahan Volume</th>
                    <th className="py-3 px-4 font-semibold">Sisa Level</th>
                    <th className="py-3 px-4 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2428] text-[#F5F5F5]">
                  {filteredWaterbankLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#181C1E] transition-colors">
                      <td className="py-3 px-4 text-[#8A9198]">{log.id}</td>
                      <td className="py-3 px-4">{log.date} {log.time}</td>
                      <td className="py-3 px-4 font-semibold">{log.event}</td>
                      <td className={`py-3 px-4 font-bold ${log.volume.startsWith('+') ? 'text-[#22C55E]' : 'text-[#FF9A3D]'}`}>
                        {log.volume}
                      </td>
                      <td className="py-3 px-4 text-[#38BDF8]">{log.currentLevel}</td>
                      <td className="py-3 px-4 text-[#8A9198]">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Clear Logs Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmClearOpen}
        title={`Konfirmasi Pembersihan Log (${activeTab.toUpperCase()})`}
        message={`Apakah Anda yakin ingin menghapus seluruh rekaman log untuk kategori '${activeTab}'? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Log"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleClearLogsConfirm}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
