import React, { useState, useEffect } from 'react';
import {
  Droplets,
  ArrowDown,
  ArrowUp,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  TrendingDown,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import WaterbankGauge from '../components/WaterbankGauge.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { storageService } from '../services/storageService.js';

export default function WaterbankPage() {
  const { waterbank, updateSettings, settings, addNotification, refillWaterbank } = useApp();
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [refillAmount, setRefillAmount] = useState(null); // null means full capacity
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    setRecentLogs(storageService.getWaterbankLogs());
  }, [waterbank.currentVolumeLiters]);

  // 7-day Historical Water Usage Data (Initial Real-World State: 0 until project records data)
  const usageHistory = React.useMemo(() => {
    const baseDays = [
      { day: 'Senin', usage: 0, rainfallInflow: 0 },
      { day: 'Selasa', usage: 0, rainfallInflow: 0 },
      { day: 'Rabu', usage: 0, rainfallInflow: 0 },
      { day: 'Kamis', usage: 0, rainfallInflow: 0 },
      { day: 'Jumat', usage: 0, rainfallInflow: 0 },
      { day: 'Sabtu', usage: 0, rainfallInflow: 0 },
      { day: 'Minggu', usage: 0, rainfallInflow: 0 },
    ];

    if (!recentLogs || recentLogs.length === 0) {
      return baseDays;
    }

    // Populate from real logs if available
    recentLogs.forEach(log => {
      const volNum = Math.abs(parseFloat(log.volume) || 0);
      const isUsage = log.event?.toLowerCase().includes('irigasi') || (log.volume && log.volume.startsWith('-'));
      const dIndex = new Date(log.date || Date.now()).getDay();
      const mappedIdx = (dIndex + 6) % 7; // Monday = 0
      if (baseDays[mappedIdx]) {
        if (isUsage) {
          baseDays[mappedIdx].usage += Math.round(volNum);
        } else {
          baseDays[mappedIdx].rainfallInflow += Math.round(volNum);
        }
      }
    });

    return baseDays;
  }, [recentLogs]);

  const handleOpenRefill = (amount = null) => {
    setRefillAmount(amount);
    setRefillModalOpen(true);
  };

  const handleRefillConfirm = () => {
    setRefillModalOpen(false);
    refillWaterbank(refillAmount);
    setRecentLogs(storageService.getWaterbankLogs());
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141719] border border-[#282E33] p-3 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-[#8A9198] mb-1 font-bold">{label}</div>
          <div className="text-[#FF9A3D]">Konsumsi Irigasi: {payload[0].value} L</div>
          {payload[1] && <div className="text-[#38BDF8]">Inflow Hujan: {payload[1].value} L</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>MANAJEMEN WATERBANK</span>
            <span className="text-[#38BDF8]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Cadangan Air Presisi
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Monitoring volume tandon terpusat, laju konsumsi pompa, dan estimasi ketahanan pasokan air tanaman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenRefill(1000)}
            className="px-3 py-2 bg-[#1B1F21] hover:bg-[#282E33] text-[#38BDF8] border border-[#282E33] font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+1.000 L</span>
          </button>
          <button
            onClick={() => handleOpenRefill(2500)}
            className="px-3 py-2 bg-[#1B1F21] hover:bg-[#282E33] text-[#38BDF8] border border-[#282E33] font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+2.500 L</span>
          </button>
          <button
            onClick={() => handleOpenRefill(null)}
            className="px-4 py-2 bg-[#38BDF8] hover:bg-[#0284C7] text-[#0B0D0E] font-mono font-bold text-xs uppercase rounded-lg transition-all shadow-md shadow-[#38BDF8]/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Isi Tandon Penuh (100%)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Tank & Overview */}
      <WaterbankGauge
        percentage={waterbank.percentage}
        currentVolume={waterbank.currentVolumeLiters}
        capacity={waterbank.capacityLiters}
        inflowRate={waterbank.inflowRateLpm}
        consumptionRate={waterbank.consumptionLpm}
        remainingDays={waterbank.remainingDays}
        isMlPredicted={true}
      />

      {/* Detailed Technical Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8A9198] uppercase">
            <Layers className="w-4 h-4 text-[#38BDF8]" />
            Volume Air Efektif
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#F5F5F5] mt-2">
            {waterbank.currentVolumeLiters.toLocaleString('id-ID')} <span className="text-xs font-normal text-[#8A9198]">Liter</span>
          </div>
          <p className="text-[11px] text-[#8A9198] mt-1 font-mono">
            {waterbank.percentage.toFixed(1)}% dari {waterbank.capacityLiters.toLocaleString('id-ID')} L
          </p>
        </div>

        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8A9198] uppercase">
            <TrendingDown className="w-4 h-4 text-[#FF9A3D]" />
            Rata-rata Konsumsi Harian
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#F5F5F5] mt-2">
            {waterbank.averageDailyUsageLiters} <span className="text-xs font-normal text-[#8A9198]">L / hari</span>
          </div>
          <p className="text-[11px] text-[#8A9198] mt-1 font-mono">
            Dihitung dari log siklus irigasi
          </p>
        </div>

        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8A9198] uppercase">
            <Calendar className="w-4 h-4 text-[#22C55E]" />
            Ketahanan Tanpa Hujan
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#F5F5F5] mt-2">
            {waterbank.currentVolumeLiters === 0 ? 0 : `~${waterbank.remainingDays}`} <span className="text-xs font-normal text-[#8A9198]">Hari</span>
          </div>
          <p className="text-[11px] text-[#22C55E] mt-1 font-mono">
            Model AI + Rumus Ketahanan
          </p>
        </div>

        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8A9198] uppercase">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            Status Keamanan Pompa
          </div>
          <div className="text-lg font-bold font-mono text-[#22C55E] mt-2">
            SIAP OPERASI
          </div>
          <p className="text-[11px] text-[#8A9198] mt-1 font-mono">
            Ambang batas cutoff kering: &lt; 8%
          </p>
        </div>
      </div>

      {/* Historical Water Usage Chart */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5]">
              Riwayat Konsumsi Air & Inflow Hujan (7 Hari Terakhir)
            </h3>
            <p className="text-xs text-[#8A9198]">
              Perbandingan air yang dikeluarkan pompa dan air yang masuk dari penampung hujan.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#FF9A3D]">
              <span className="w-2.5 h-2.5 rounded bg-[#FF7A00]" />
              <span>Konsumsi Irigasi (L)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#38BDF8]">
              <span className="w-2.5 h-2.5 rounded bg-[#38BDF8]" />
              <span>Inflow Hujan (L)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={usageHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1F2428" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#5A626A" fontSize={11} tickLine={false} axisLine={{ stroke: '#22272B' }} />
              <YAxis stroke="#5A626A" fontSize={11} tickLine={false} axisLine={{ stroke: '#22272B' }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="usage" fill="#FF7A00" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="rainfallInflow" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Waterbank Activity Logs Table */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5]">
              Catatan Log Peristiwa & Pengisian Tandon Terkini
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#8A9198]">
            {recentLogs.length} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#22272B] text-[#8A9198]">
                <th className="pb-3 font-semibold">ID / Waktu</th>
                <th className="pb-3 font-semibold">Peristiwa</th>
                <th className="pb-3 font-semibold">Perubahan Volume</th>
                <th className="pb-3 font-semibold">Level Tandon</th>
                <th className="pb-3 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2428] text-[#F5F5F5]">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8A9198]">
                    <div className="flex flex-col items-center justify-center gap-1.5 font-mono">
                      <span className="text-xs text-[#CCCCCC]">Belum Ada Catatan Log Peristiwa (Standby 0)</span>
                      <span className="text-[10px] text-[#5A626A]">Catatan log peristiwa dan pengisian tandon akan terisi otomatis saat mikrokontroler proyek terhubung dan mendeteksi perubahan volume air atau irigasi.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentLogs.slice(0, 5).map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 text-[#8A9198]">
                      <span className="text-[#F5F5F5] font-semibold">{log.time}</span> ({log.date})
                    </td>
                    <td className="py-3 font-semibold flex items-center gap-1.5">
                      {log.volume?.startsWith('+') ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#22C55E]" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-[#FF7A00]" />
                      )}
                      {log.event}
                    </td>
                    <td className={`py-3 font-bold ${log.volume?.startsWith('+') ? 'text-[#22C55E]' : 'text-[#FF7A00]'}`}>
                      {log.volume}
                    </td>
                    <td className="py-3 text-[#38BDF8] font-bold">
                      {log.currentLevel}
                    </td>
                    <td className="py-3 text-[#8A9198]">
                      {log.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Formula Transparency Card */}
      <div className="bg-[#1B1F21] border border-[#282E33] rounded-xl p-4 text-xs font-mono text-[#8A9198] space-y-1">
        <div className="text-[#F5F5F5] font-bold uppercase tracking-wider flex items-center gap-2">
          <span>Catatan Metodologi Perhitungan Ketahanan Waterbank</span>
        </div>
        <p className="text-[#CCCCCC]">
          Formula Sementara: <code className="text-[#FF9A3D]">remainingDays = currentWater / averageDailyUsage</code>
        </p>
        <p className="italic text-[#8A9198]">
          Tanda Pengenal: Hasil final diintegrasikan dengan model Machine Learning Edge (TensorFlow.js) yang mempertimbangkan evapotranspirasi tanah dan prakiraan cuaca BMKG 24 jam ke depan untuk prediksi yang lebih presisi.
        </p>
      </div>

      {/* Refill Confirmation Modal */}
      <ConfirmationModal
        isOpen={refillModalOpen}
        title={refillAmount ? `Konfirmasi Penambahan +${refillAmount.toLocaleString('id-ID')} Liter` : 'Konfirmasi Pengisian Penuh Tandon'}
        message={
          refillAmount
            ? `Apakah Anda ingin menambahkan pasokan air sebesar ${refillAmount.toLocaleString('id-ID')} Liter ke dalam tandon Waterbank? Level persentase dan ketahanan pasokan akan diperbarui.`
            : `Apakah Anda ingin mengisi ulang volume Waterbank ke kapasitas penuh (${(waterbank.capacityLiters || 5000).toLocaleString('id-ID')} Liter)? Status ketahanan air akan diperbarui ke 100%.`
        }
        confirmText={refillAmount ? `Tambah +${refillAmount} L` : 'Isi Tandon Penuh (100%)'}
        cancelText="Batal"
        onConfirm={handleRefillConfirm}
        onCancel={() => setRefillModalOpen(false)}
        variant="warning"
      />
    </div>
  );
}
