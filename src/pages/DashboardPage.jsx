import React, { useState } from 'react';
import {
  Thermometer,
  Droplet,
  CloudRain,
  Sun,
  Activity,
  Zap,
  Power,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  Sprout,
  MapPin,
  Clock,
  Layers,
  Settings2,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import SensorCard from '../components/SensorCard.jsx';
import WaterbankGauge from '../components/WaterbankGauge.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import AIRecommendation from '../components/AIRecommendation.jsx';
import LiveChart from '../components/LiveChart.jsx';
import ConnectionIndicator from '../components/ConnectionIndicator.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import LiveLocationControl from '../components/LiveLocationControl.jsx';
import FieldManagementModal from '../components/FieldManagementModal.jsx';
import { formatLandArea } from '../utils/landArea.js';

export default function DashboardPage() {
  const {
    sensorData,
    telemetryHistory,
    waterbank,
    weather,
    weatherLoading,
    fetchWeather,
    aiPrediction,
    aiPredicting,
    irrigationState,
    triggerIrrigation,
    emergencyStop,
    currentPlant,
    activeLand,
    lands
  } = useApp();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetDuration, setTargetDuration] = useState(600);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const calculateHst = (plantingDateStr) => {
    if (!plantingDateStr) return 0;
    const planting = new Date(plantingDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - planting);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const hst = calculateHst(activeLand?.plantingDate);

  const handleApplyRecommendation = (durationSec) => {
    setTargetDuration(durationSec || 600);
    setConfirmModalOpen(true);
  };

  const handleConfirmIrrigation = () => {
    setConfirmModalOpen(false);
    triggerIrrigation(true, true, targetDuration, 'AI_RECOMMENDATION');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* 1. Header & Connectivity Status Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
              <span>DASHBOARD OPERASIONAL</span>
              <span className="text-[#FF7A00]">//</span>
              <span className="text-sm font-normal text-[#8A9198]">
                {activeLand?.name || 'Lahan Utama'}
              </span>
            </h1>
            <p className="text-xs text-[#8A9198]">
              Pusat monitoring telemetri sensor, cadangan air, dan rekomendasi irigasi cerdas.
            </p>
          </div>

          {/* Quick Actuator Pill */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              irrigationState.isActive 
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' 
                : 'bg-[#141719] border-[#22272B] text-[#8A9198]'
            }`}>
              <Power className="w-3.5 h-3.5" />
              <span>Pompa: {sensorData.pump ? 'ON' : 'OFF'}</span>
            </div>

            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              sensorData.valve 
                ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]' 
                : 'bg-[#141719] border-[#22272B] text-[#8A9198]'
            }`}>
              <Sliders className="w-3.5 h-3.5" />
              <span>Valve: {sensorData.valve ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        </div>

        {/* 1.1 Active Land & Agronomic Summary Ribbon */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E]">
                <Sprout className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-[#8A9198] uppercase block">Petak Lahan Aktif</span>
                <span className="text-xs font-bold text-[#F5F5F5]">
                  {activeLand?.name} ({activeLand?.customCropName || currentPlant.name})
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#22272B] hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-[#38BDF8]">
              <Clock className="w-3.5 h-3.5" />
              <span>Usia: <strong>{hst} HST</strong> ({currentPlant.category})</span>
            </div>

            <div className="h-6 w-px bg-[#22272B] hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-[#8A9198]">
              <Layers className="w-3.5 h-3.5" />
              <span>Luas: {formatLandArea(activeLand)} • Tanah {activeLand?.soilType || 'Lempung'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => setFieldModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1B1F21] hover:bg-[#282E33] border border-[#282E33] hover:border-[#FF7A00]/50 text-xs font-mono text-[#F5F5F5] hover:text-[#FF7A00] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Ubah Tanaman / Lahan</span>
            </button>
          </div>
        </div>

        {/* 1.2 Live GPS Location Dynamic Bar */}
        <LiveLocationControl compact={false} />

        {/* 1.3 Triple Connectivity Indicator Bar */}
        <ConnectionIndicator />
      </div>

      {/* 2. Key Sensor Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Soil Moisture */}
        <SensorCard
          title="Kelembapan Tanah"
          value={sensorData.soilMoisture || 0}
          unit="%"
          icon={Droplet}
          status={
            !sensorData.timestamp ? 'normal' :
            sensorData.soilMoisture < currentPlant.criticalMoisture ? 'danger' :
            sensorData.soilMoisture > currentPlant.optimalMoisture ? 'optimal' : 'normal'
          }
          statusLabel={
            !sensorData.timestamp ? 'Standby (0%)' :
            sensorData.soilMoisture < currentPlant.criticalMoisture ? 'Kritis Rendah' :
            sensorData.soilMoisture > currentPlant.optimalMoisture ? 'Optimal Basah' : 'Cukup'
          }
          target={!sensorData.timestamp ? undefined : currentPlant.optimalMoisture}
          accentColor="#FF7A00"
          description="Kapasitif Analog ADC"
        />

        {/* Soil Temperature */}
        <SensorCard
          title="Suhu Tanah"
          value={sensorData.soilTemperature || 0}
          unit="°C"
          icon={Thermometer}
          status={!sensorData.timestamp ? 'normal' : sensorData.soilTemperature > 34 ? 'warning' : 'optimal'}
          statusLabel={!sensorData.timestamp ? 'Standby (0°C)' : sensorData.soilTemperature > 34 ? 'Tinggi' : 'Normal'}
          min={!sensorData.timestamp ? undefined : 0}
          avg={!sensorData.timestamp ? undefined : (sensorData.soilTemperature || 0)}
          max={!sensorData.timestamp ? undefined : (sensorData.soilTemperature || 0)}
          accentColor="#FF9A3D"
          description="Probe DS18B20"
        />

        {/* Air Temperature & Humidity */}
        <SensorCard
          title="Suhu Udara"
          value={sensorData.airTemperature || 0}
          unit="°C"
          icon={Sun}
          status={!sensorData.timestamp ? 'normal' : sensorData.airTemperature > 33 ? 'warning' : 'normal'}
          statusLabel={!sensorData.timestamp ? 'Standby (0% RH)' : `${sensorData.airHumidity}% RH`}
          min={!sensorData.timestamp ? undefined : 0}
          avg={!sensorData.timestamp ? undefined : (sensorData.airTemperature || 0)}
          max={!sensorData.timestamp ? undefined : (sensorData.airTemperature || 0)}
          accentColor="#F59E0B"
          description="Sensor DHT22"
        />

        {/* Rainfall / Curah Hujan */}
        <SensorCard
          title="Curah Hujan Aktif"
          value={sensorData.rainfall || 0}
          unit="mm"
          icon={CloudRain}
          status={sensorData.rainfall > 0 ? 'optimal' : 'normal'}
          statusLabel={!sensorData.timestamp ? 'Standby (0 mm)' : sensorData.rainfall > 0 ? 'Hujan' : 'Kering'}
          min={!sensorData.timestamp ? undefined : 0}
          avg={!sensorData.timestamp ? undefined : 0}
          max={!sensorData.timestamp ? undefined : (sensorData.rainfall || 0)}
          accentColor="#38BDF8"
          description="Tipping Bucket Rain Gauge"
        />
      </div>

      {/* 3. AI Recommendation & Waterbank Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Recommendation Box (7 cols) */}
        <div className="lg:col-span-7">
          <AIRecommendation
            prediction={aiPrediction}
            isLoading={aiPredicting}
            onApplyRecommendation={handleApplyRecommendation}
          />
        </div>

        {/* Right Column: Interactive Waterbank Tank (5 cols) */}
        <div className="lg:col-span-5">
          <WaterbankGauge
            percentage={waterbank.percentage}
            currentVolume={waterbank.currentVolumeLiters}
            capacity={waterbank.capacityLiters}
            inflowRate={waterbank.inflowRateLpm}
            consumptionRate={waterbank.consumptionLpm}
            remainingDays={waterbank.remainingDays}
            isMlPredicted={true}
          />
        </div>
      </div>

      {/* 4. Live Telemetry Chart */}
      <div>
        <LiveChart
          data={telemetryHistory}
          height={260}
          title="Streaming Telemetri Real-Time Lahan & Tandon"
        />
      </div>

      {/* 5. BMKG Weather Grounding Overview */}
      <div>
        <WeatherCard
          weather={weather}
          isLoading={weatherLoading}
          onRefresh={fetchWeather}
        />
      </div>

      {/* Confirmation Modal for Irrigation Execution */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Jalankan Irigasi Rekomendasi AI"
        message={`Sistem akan mengaktifkan Pompa Air dan Solenoid Valve selama ${Math.round(targetDuration / 60)} menit (${targetDuration} detik) sesuai rekomendasi Edge ML untuk tanaman ${currentPlant.name}. Pastikan jalur irigasi bebas hambatan.`}
        confirmText="Mulai Irigasi Sekarang"
        cancelText="Batalkan"
        onConfirm={handleConfirmIrrigation}
        onCancel={() => setConfirmModalOpen(false)}
        variant="warning"
      />

      {/* Field & Crop Management Modal */}
      <FieldManagementModal
        isOpen={fieldModalOpen}
        onClose={() => setFieldModalOpen(false)}
      />
    </div>
  );
}
