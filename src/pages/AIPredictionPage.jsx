import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Droplets,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import AIRecommendation from '../components/AIRecommendation.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

export default function AIPredictionPage() {
  const {
    aiPrediction,
    aiPredicting,
    runPrediction,
    sensorData,
    triggerIrrigation,
    currentPlant,
    settings,
    waterbank
  } = useApp();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [durationToApply, setDurationToApply] = useState(600);

  const handleApply = (dur) => {
    setDurationToApply(dur);
    setConfirmModalOpen(true);
  };

  const handleConfirm = () => {
    setConfirmModalOpen(false);
    triggerIrrigation(true, true, durationToApply, 'AI_RECOMMENDATION');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>EDGE AI & MACHINE LEARNING</span>
            <span className="text-[#FF7A00]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Inference Offline
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Model Neural Network lokal (TensorFlow.js) menghitung kebutuhan air presisi tanpa ketergantungan koneksi cloud.
          </p>
        </div>

        <button
          onClick={() => runPrediction()}
          disabled={aiPredicting}
          className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF9A3D] text-[#0B0D0E] font-mono font-bold text-xs uppercase rounded-lg transition-all shadow-md shadow-[#FF7A00]/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${aiPredicting ? 'animate-spin' : ''}`} />
          <span>Jalankan Prediksi Ulang</span>
        </button>
      </div>

      {/* Main AI Recommendation Detailed Card */}
      <AIRecommendation
        prediction={aiPrediction}
        isLoading={aiPredicting}
        onApplyRecommendation={handleApply}
      />

      {/* Input Features Vector Inspection */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FF7A00]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5]">
              Vektor Masukan Fitur Model (10 Dimensi)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#8A9198]">
            Input Tensor: [1, 10]
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">1. Soil Moisture</span>
            <div className="text-base font-bold text-[#FF7A00] mt-1">{sensorData.soilMoisture}%</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">2. Soil Temp</span>
            <div className="text-base font-bold text-[#F5F5F5] mt-1">{sensorData.soilTemperature}°C</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">3. Air Temp</span>
            <div className="text-base font-bold text-[#F5F5F5] mt-1">{sensorData.airTemperature}°C</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">4. Air Humidity</span>
            <div className="text-base font-bold text-[#38BDF8] mt-1">{sensorData.airHumidity}%</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">5. Rainfall</span>
            <div className="text-base font-bold text-[#38BDF8] mt-1">{sensorData.rainfall} mm</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">6. Light Intensity</span>
            <div className="text-base font-bold text-[#F5F5F5] mt-1">{sensorData.lightIntensity} Lux</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">7. Water Level</span>
            <div className="text-base font-bold text-[#38BDF8] mt-1">{sensorData.waterLevel}%</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">8. Plant Kc</span>
            <div className="text-base font-bold text-[#22C55E] mt-1">{currentPlant.kc} ({currentPlant.name})</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">9. Forecast Rain</span>
            <div className="text-base font-bold text-[#38BDF8] mt-1">BMKG 24h</div>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <span className="text-[#8A9198] text-[10px] uppercase">10. Hist Usage</span>
            <div className="text-base font-bold text-[#FF9A3D] mt-1">{waterbank.averageDailyUsageLiters || 0} L/hari</div>
          </div>
        </div>
      </div>

      {/* Model Architecture & Transparency Statement */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#38BDF8]" />
          Arsitektur Edge Machine Learning & Transparansi Model
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#1B1F21] p-3.5 rounded-lg border border-[#282E33]">
            <div className="text-[#FF7A00] font-bold mb-1">1. Edge Runtime (Zero-Internet)</div>
            <p className="text-[#8A9198] leading-relaxed">
              Model dijalankan langsung pada mesin peramban pengguna melalui TensorFlow.js. Jika koneksi internet di kebun mati total, komputasi inferensi tensor tetap berlangsung 100% secara lokal.
            </p>
          </div>

          <div className="bg-[#1B1F21] p-3.5 rounded-lg border border-[#282E33]">
            <div className="text-[#38BDF8] font-bold mb-1">2. Multi-Task Regression</div>
            <p className="text-[#8A9198] leading-relaxed">
              Topologi neural network memiliki 3 unit keluaran bersamaan: Kebutuhan Air (Liter/m²), Durasi Pompa Presisi (Detik), dan Sisa Hari Ketahanan Waterbank (Hari).
            </p>
          </div>

          <div className="bg-[#1B1F21] p-3.5 rounded-lg border border-[#282E33]">
            <div className="text-[#22C55E] font-bold mb-1">3. Transparansi & Validitas</div>
            <p className="text-[#8A9198] leading-relaxed">
              Model berada pada tahap baseline agronomis (bobot neural teruji). Tidak ada klaim akurasi palsu sampai model melewati siklus fine-tuning dataset riil pertanian Indonesia.
            </p>
          </div>
        </div>
      </div>

      {/* Execution Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Jalankan Irigasi Presisi AI"
        message={`Perintah irigasi sebesar ${Math.round(durationToApply / 60)} menit (${durationToApply}s) akan dikirimkan ke mikrokontroler ESP32 via Bluetooth BLE.`}
        confirmText="Jalankan Sekarang"
        cancelText="Batal"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModalOpen(false)}
        variant="warning"
      />
    </div>
  );
}
