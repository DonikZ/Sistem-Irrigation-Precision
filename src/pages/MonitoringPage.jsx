import React, { useState } from 'react';
import {
  Droplet,
  Thermometer,
  Wind,
  Sun,
  CloudRain,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import SensorCard from '../components/SensorCard.jsx';
import LiveChart from '../components/LiveChart.jsx';
import ConnectionIndicator from '../components/ConnectionIndicator.jsx';

export default function MonitoringPage() {
  const {
    sensorData,
    telemetryHistory,
    bluetoothStatus,
    settings,
    currentPlant,
    weather,
    weatherLoading,
    fetchWeather,
    simulateSensorChange,
    addNotification
  } = useApp();

  const [selectedRange, setSelectedRange] = useState('1h');
  const [showSimulator, setShowSimulator] = useState(false);

  // BMKG Weather integration for Air Temperature and Rainfall
  const bmkgAirTemp = weather?.current?.temperature !== undefined
    ? Number(weather.current.temperature)
    : (sensorData.airTemperature || 25.0);
  const bmkgRainfall = weather?.current?.rainfall !== undefined
    ? Number(weather.current.rainfall)
    : (sensorData.rainfall || 0.0);
  const bmkgLocationName = weather?.location || settings.bmkgLocationName || 'Stasiun Agroklimat BMKG';
  const bmkgWeatherDesc = weather?.current?.weatherDesc || 'Berawan';

  const formattedLastUpdate = sensorData.timestamp
    ? new Date(sensorData.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const handleApplyPreset = (presetName, values) => {
    simulateSensorChange(values);
    addNotification(`Parameter simulasi '${presetName}' diterapkan.`, 'info', 'Simulasi Sensor');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>MONITORING LAHAN REAL-TIME</span>
            <span className="text-[#FF7A00]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Multi-Sensor Telemetry
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Pengawasan parameter fisik tanah, kondisi mikroklimat lingkungan, dan pasokan air tanaman secara kontinu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              showSimulator
                ? 'bg-[#FF7A00] text-[#0B0D0E] font-bold border-[#FF7A00]'
                : 'bg-[#141719] border-[#22272B] text-[#FF9A3D] hover:border-[#FF7A00]/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimulator ? 'Tutup Kalibrator' : 'Simulasi Sensor'}</span>
            {showSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141719] border border-[#22272B] text-xs font-mono text-[#8A9198]">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Terakhir: <strong className="text-[#F5F5F5]">{formattedLastUpdate}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141719] border border-[#22272B] text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${sensorData.timestamp ? 'bg-[#22C55E] animate-pulse' : 'bg-[#FF7A00]'}`} />
            <span className={sensorData.timestamp ? 'text-[#22C55E]' : 'text-[#FF9A3D]'}>
              {sensorData.timestamp ? 'Live Transmisi' : 'Standby (0)'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sensor Simulator & Calibration Drawer */}
      {showSimulator && (
        <div className="bg-[#141719] border border-[#FF7A00]/40 rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22272B] pb-3">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FF7A00]" />
                <span>Panel Uji Coba & Kalibrasi Nilai Sensor (Demo Sandbox)</span>
              </h3>
              <p className="text-[11px] text-[#8A9198]">
                Geser nilai untuk menguji respon sistem otomatis, logika fail-safe Waterbank, dan rekomendasi AI.
              </p>
            </div>

            {/* Quick Scenario Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleApplyPreset('Kekeringan Kritis', { soilMoisture: 28, waterLevel: 65, rainfall: 0 })}
                className="px-2.5 py-1 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[11px] font-mono hover:bg-[#EF4444]/25 cursor-pointer"
              >
                🚨 Kekeringan Kritis
              </button>
              <button
                onClick={() => handleApplyPreset('Hujan Deras', { soilMoisture: 80, rainfall: 35, waterLevel: 90 })}
                className="px-2.5 py-1 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] text-[11px] font-mono hover:bg-[#38BDF8]/25 cursor-pointer"
              >
                🌧️ Hujan Deras
              </button>
              <button
                onClick={() => handleApplyPreset('Tandon Kritis', { waterLevel: 8 })}
                className="px-2.5 py-1 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[11px] font-mono hover:bg-[#F59E0B]/25 cursor-pointer"
              >
                ⚠️ Tandon Kritis (Fail-Safe)
              </button>
              <button
                onClick={() => handleApplyPreset('Kondisi Optimal', { soilMoisture: 55, airTemperature: 28, airHumidity: 65, rainfall: 0, waterLevel: 80 })}
                className="px-2.5 py-1 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-[11px] font-mono hover:bg-[#22C55E]/25 cursor-pointer"
              >
                🌱 Optimal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 text-xs font-mono">
            {/* Slider 1: Soil Moisture */}
            <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A9198]">Kelembapan Tanah:</span>
                <span className="font-bold text-[#FF7A00]">{sensorData.soilMoisture}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="1"
                value={sensorData.soilMoisture}
                onChange={(e) => simulateSensorChange({ soilMoisture: Number(e.target.value) })}
                className="w-full accent-[#FF7A00] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5A626A] mt-1">
                <span>0% (Standby/Kering)</span>
                <span>Optimal: {currentPlant.optimalMoisture}%</span>
                <span>95% (Jenuh)</span>
              </div>
            </div>

            {/* Slider 2: Waterbank Level */}
            <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A9198]">Level Waterbank:</span>
                <span className="font-bold text-[#38BDF8]">{sensorData.waterLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sensorData.waterLevel}
                onChange={(e) => simulateSensorChange({ waterLevel: Number(e.target.value) })}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5A626A] mt-1">
                <span>0% (Standby)</span>
                <span>50%</span>
                <span>100% (Penuh)</span>
              </div>
            </div>

            {/* Slider 3: Air Temperature (BMKG Sync) */}
            <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A9198]">Suhu Udara (BMKG Live):</span>
                <span className="font-bold text-[#F59E0B]">{bmkgAirTemp}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="0.5"
                value={bmkgAirTemp}
                onChange={(e) => simulateSensorChange({ airTemperature: Number(e.target.value) })}
                className="w-full accent-[#FF9A3D] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5A626A] mt-1">
                <span>0°C (Standby)</span>
                <span>BMKG: {bmkgAirTemp}°C</span>
                <span>45°C (Ekstrem)</span>
              </div>
            </div>

            {/* Slider 4: Air Humidity */}
            <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A9198]">Kelembapan Udara:</span>
                <span className="font-bold text-[#38BDF8]">{sensorData.airHumidity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="98"
                step="1"
                value={sensorData.airHumidity}
                onChange={(e) => simulateSensorChange({ airHumidity: Number(e.target.value) })}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5A626A] mt-1">
                <span>0% (Standby)</span>
                <span>65%</span>
                <span>98% (Sangat Lembap)</span>
              </div>
            </div>

            {/* Slider 5: Rainfall (BMKG Sync) */}
            <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A9198]">Curah Hujan (BMKG Live):</span>
                <span className="font-bold text-[#38BDF8]">{bmkgRainfall} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={bmkgRainfall}
                onChange={(e) => simulateSensorChange({ rainfall: Number(e.target.value) })}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5A626A] mt-1">
                <span>0 mm (Cerah)</span>
                <span>BMKG: {bmkgRainfall} mm</span>
                <span>60 mm (Lebat)</span>
              </div>
            </div>

            {/* Reset / Sync Button */}
            <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33] flex flex-col justify-between">
              <div className="text-[11px] text-[#8A9198]">
                Suhu udara & curah hujan disinkronkan langsung dari data satelit / API BMKG.
              </div>
              <button
                onClick={() => {
                  fetchWeather();
                  addNotification('Data cuaca & suhu udara disinkronkan kembali dari API BMKG.', 'success', 'BMKG Sync');
                }}
                disabled={weatherLoading}
                className="mt-2 w-full py-1.5 px-3 rounded bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Ulang BMKG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BMKG Weather Integration Status Bar */}
      <div className="bg-[#141719] border border-[#38BDF8]/25 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[#F5F5F5] font-bold">
              <span>Sinkronisasi Data Agroklimat BMKG</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                API BMKG Live
              </span>
            </div>
            <div className="text-[11px] text-[#8A9198] mt-0.5">
              Suhu Udara (<strong className="text-[#F59E0B]">{bmkgAirTemp}°C</strong>) & Curah Hujan (<strong className="text-[#38BDF8]">{bmkgRainfall} mm</strong>) disinkronkan langsung dari {bmkgLocationName} ({bmkgWeatherDesc}).
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            fetchWeather();
            addNotification('Memperbarui prakiraan cuaca & suhu udara dari API BMKG...', 'info', 'Refresh BMKG');
          }}
          disabled={weatherLoading}
          className="px-3 py-1.5 rounded-lg bg-[#1B1F21] hover:bg-[#22272B] border border-[#282E33] text-[#38BDF8] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 self-end sm:self-auto"
          title="Perbarui Data BMKG"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
          <span>{weatherLoading ? 'Memuat...' : 'Refresh BMKG'}</span>
        </button>
      </div>

      {/* Connectivity Status Notice */}
      <ConnectionIndicator />

      {/* Sensor Cards Grid (Suhu Tanah dihapus, Suhu Udara & Curah Hujan dari BMKG) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Soil Moisture */}
        <SensorCard
          title="Kelembapan Tanah"
          value={sensorData.soilMoisture}
          unit="%"
          icon={Droplet}
          status={sensorData.soilMoisture < currentPlant.criticalMoisture ? 'danger' : 'optimal'}
          statusLabel={sensorData.soilMoisture < currentPlant.criticalMoisture ? 'Perlu Air' : 'Optimal'}
          min={38.0}
          avg={46.5}
          max={62.0}
          target={currentPlant.optimalMoisture}
          accentColor="#FF7A00"
          description="Kapasitansi Lapisan Perakaran"
        />

        {/* 2. Air Temperature (BMKG API) */}
        <SensorCard
          title="Suhu Udara"
          value={bmkgAirTemp}
          unit="°C"
          icon={Thermometer}
          status={bmkgAirTemp > 32 ? 'warning' : 'optimal'}
          statusLabel={weatherLoading ? 'Sinkronisasi...' : 'API BMKG'}
          min={21.5}
          avg={26.4}
          max={34.0}
          accentColor="#F59E0B"
          description={`Stasiun: ${bmkgLocationName}`}
        />

        {/* 3. Rainfall (BMKG API) */}
        <SensorCard
          title="Curah Hujan"
          value={bmkgRainfall}
          unit="mm"
          icon={CloudRain}
          status={bmkgRainfall > 0 ? 'optimal' : 'normal'}
          statusLabel={weatherLoading ? 'Sinkronisasi...' : bmkgRainfall > 0 ? 'Presipitasi BMKG' : 'Cerah (0 mm)'}
          min={0.0}
          avg={1.2}
          max={25.0}
          accentColor="#38BDF8"
          description={`Prakiraan: ${bmkgWeatherDesc}`}
        />

        {/* 4. Air Humidity */}
        <SensorCard
          title="Kelembapan Udara"
          value={sensorData.airHumidity}
          unit="%"
          icon={Wind}
          status={sensorData.airHumidity < 50 ? 'warning' : 'optimal'}
          statusLabel={sensorData.airHumidity < 50 ? 'Kering' : 'Lembap'}
          min={52.0}
          avg={71.2}
          max={89.0}
          accentColor="#38BDF8"
          description="Relatif Humidity (RH)"
        />

        {/* 5. Light Intensity */}
        <SensorCard
          title="Intensitas Cahaya"
          value={sensorData.lightIntensity}
          unit="Lux"
          icon={Sun}
          status={sensorData.lightIntensity > 50000 ? 'warning' : 'optimal'}
          statusLabel={sensorData.lightIntensity > 30000 ? 'Terik' : 'Cukup'}
          min={2500}
          avg={18200}
          max={64000}
          accentColor="#EAB308"
          description="Radiasi Matahari / LDR"
        />

        {/* 6. Water Level */}
        <SensorCard
          title="Water Level Tandon"
          value={sensorData.waterLevel}
          unit="%"
          icon={Layers}
          status={sensorData.waterLevel < 20 ? 'danger' : 'optimal'}
          statusLabel={sensorData.waterLevel < 20 ? 'Kritis' : 'Tersedia'}
          min={18.0}
          avg={74.0}
          max={100.0}
          accentColor="#0EA5E9"
          description="Sensor Kedalaman Hidrostatik"
        />

        {/* 7. Plant Target Info Card */}
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4 flex flex-col justify-between sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-[#8A9198]">
              Profil Tanaman
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
              Aktif
            </span>
          </div>

          <div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5]">
              {currentPlant.name}
            </div>
            <div className="text-xs text-[#8A9198] mt-1">
              Koefisien Tanaman (Kc): <strong className="text-[#F5F5F5]">{currentPlant.kc}</strong>
            </div>
            <div className="text-xs text-[#8A9198]">
              Target Basah: <strong className="text-[#38BDF8]">{currentPlant.optimalMoisture}%</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1F2428] text-[10px] font-mono text-[#8A9198]">
            Ambang Kritis Irigasi: &le; {currentPlant.criticalMoisture}%
          </div>
        </div>
      </div>

      {/* Primary Streaming Real-Time Chart */}
      <div>
        <LiveChart
          data={telemetryHistory}
          height={300}
          title="Dinamika Telemetri Lahan Real-Time (Live Stream)"
        />
      </div>

      {/* Statistical Summary Table */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5] mb-4">
          Ringkasan Statistik Sensor Lahan
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#22272B] text-[#8A9198]">
                <th className="pb-3 font-semibold">Parameter Sensor</th>
                <th className="pb-3 font-semibold">Nilai Sekarang</th>
                <th className="pb-3 font-semibold">Batas Minimum</th>
                <th className="pb-3 font-semibold">Rata-Rata</th>
                <th className="pb-3 font-semibold">Batas Maksimum</th>
                <th className="pb-3 font-semibold">Status Agronomi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2428] text-[#F5F5F5]">
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF7A00]" />
                  Kelembapan Tanah
                </td>
                <td className="py-3 font-bold text-[#FF7A00]">{sensorData.soilMoisture}%</td>
                <td className="py-3 text-[#8A9198]">38.0%</td>
                <td className="py-3">46.5%</td>
                <td className="py-3 text-[#8A9198]">62.0%</td>
                <td className="py-3 text-[#22C55E]">Optimal Terjaga</td>
              </tr>
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  Suhu Udara (API BMKG)
                </td>
                <td className="py-3 font-bold text-[#F59E0B]">{bmkgAirTemp}°C</td>
                <td className="py-3 text-[#8A9198]">21.5°C</td>
                <td className="py-3">26.4°C</td>
                <td className="py-3 text-[#8A9198]">34.0°C</td>
                <td className="py-3 text-[#38BDF8]">{bmkgWeatherDesc}</td>
              </tr>
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                  Curah Hujan (API BMKG)
                </td>
                <td className="py-3 font-bold text-[#38BDF8]">{bmkgRainfall} mm</td>
                <td className="py-3 text-[#8A9198]">0.0 mm</td>
                <td className="py-3">1.2 mm</td>
                <td className="py-3 text-[#8A9198]">25.0 mm</td>
                <td className="py-3 text-[#22C55E]">{bmkgRainfall > 0 ? 'Presipitasi Aktif' : 'Cerah / Kering'}</td>
              </tr>
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  Kelembapan Udara
                </td>
                <td className="py-3 font-bold">{sensorData.airHumidity}%</td>
                <td className="py-3 text-[#8A9198]">52.0%</td>
                <td className="py-3">71.2%</td>
                <td className="py-3 text-[#8A9198]">89.0%</td>
                <td className="py-3 text-[#22C55E]">Cukup Lembap</td>
              </tr>
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                  Level Waterbank
                </td>
                <td className="py-3 font-bold text-[#38BDF8]">{sensorData.waterLevel}%</td>
                <td className="py-3 text-[#8A9198]">18.0%</td>
                <td className="py-3">74.0%</td>
                <td className="py-3 text-[#8A9198]">100.0%</td>
                <td className="py-3 text-[#22C55E]">Kapasitas Aman</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

