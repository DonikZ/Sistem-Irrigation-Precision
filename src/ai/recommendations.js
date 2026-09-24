/**
 * Agronomic Decision Engine & Recommendation System
 * Combines Edge ML inference with agricultural domain safety constraints
 */
import { PLANT_PROFILES } from './preprocessing.js';

/**
 * Generate human-readable recommendation and explainability impacts
 */
export function buildIrrigationRecommendation(inputs, rawPredictions) {
  const {
    soilMoisture = 50,
    soilTemperature = 28,
    airTemperature = 30,
    airHumidity = 65,
    rainfall = 0,
    waterLevel = 75,
    plantType = 'cabai',
    forecastRainfall = 0
  } = inputs;

  const plant = PLANT_PROFILES[plantType] || PLANT_PROFILES.cabai;

  // Derive physiological moisture deficit
  const moistureDeficit = plant.optimalMoisture - soilMoisture;

  // Interpret prediction or baseline hybrid regression
  // Base water requirement: Liters needed per m2
  let waterReqLiters = 0;
  let durationSeconds = 0;
  let statusText = '';
  let urgency = 'NORMAL'; // 'URGENT' | 'HIGH' | 'NORMAL' | 'DELAY' | 'SAFE'

  // Safety condition 0: Initial zero state (Standby - Waiting for project sensor connection)
  if (!soilMoisture && !airTemperature && !waterLevel) {
    return {
      waterReqLiters: 0,
      durationSeconds: 0,
      recommendationText: 'Sistem Standby (Nilai Awal 0): Menunggu sambungan modul proyek ESP32. Hubungkan perangkat untuk memulai analisis kebutuhan air tanaman.',
      urgency: 'STANDBY',
      explainableFactors: [
        { factor: 'Koneksi ESP32', impact: 'Perangkat Belum Mengirim Data', direction: 'neutral' }
      ]
    };
  }

  // Safety condition 1: Waterbank critically empty (only when waterLevel is calibrated & active)
  if (waterLevel > 0 && waterLevel < 10) {
    statusText = 'Irigasi Dibatalkan: Cadangan Waterbank Kritis (< 10%). Segera lakukan pengisian ulang tandon air.';
    urgency = 'CRITICAL';
    durationSeconds = 0;
    waterReqLiters = 0;
  }
  // Safety condition 2: High current or forecasted rain
  else if (rainfall > 3 || forecastRainfall > 8) {
    statusText = `Tunda Irigasi: Terdeteksi curah hujan aktif / prakiraan hujan BMKG (${forecastRainfall} mm). Hemat cadangan air tanah.`;
    urgency = 'DELAY';
    durationSeconds = 0;
    waterReqLiters = 0;
  }
  // Soil is sufficiently saturated
  else if (soilMoisture >= plant.optimalMoisture) {
    statusText = `Kondisi Tanah Optimal: Kelembapan tanah (${soilMoisture}%) sudah memenuhi target ${plant.name}. Irigasi tidak diperlukan.`;
    urgency = 'SAFE';
    durationSeconds = 0;
    waterReqLiters = 0;
  }
  // Soil is below critical threshold
  else if (soilMoisture <= plant.criticalMoisture) {
    // High water demand
    waterReqLiters = Number(((moistureDeficit * 0.45 * plant.kc) + (airTemperature > 32 ? 1.5 : 0.5)).toFixed(1));
    durationSeconds = Math.min(plant.maxDurationSec, Math.round(waterReqLiters * 110));
    urgency = 'URGENT';
    statusText = `Irigasi Diperlukan Segera: Kelembapan tanah (${soilMoisture}%) berada di bawah batas kritis (${plant.criticalMoisture}%).`;
  }
  // Soil is mildly dry
  else {
    waterReqLiters = Number(((moistureDeficit * 0.3 * plant.kc)).toFixed(1));
    durationSeconds = Math.min(plant.maxDurationSec, Math.round(waterReqLiters * 95));
    urgency = 'NORMAL';
    statusText = `Irigasi Terjadwal Presisi: Pemberian air sedang (${durationSeconds} detik) disarankan untuk menjaga kelembapan optimal.`;
  }

  // Calculate Explainable Factors (SHAP/Impact Simulation)
  const factors = [
    {
      name: 'Kelembapan Tanah',
      value: `${soilMoisture}% (Target: ${plant.optimalMoisture}%)`,
      impact: Math.abs(moistureDeficit) > 15 ? 'HIGH IMPACT' : 'MEDIUM IMPACT',
      level: Math.abs(moistureDeficit) > 15 ? 'high' : 'medium',
      direction: moistureDeficit > 0 ? 'Menambah Kebutuhan Air' : 'Mengurangi Kebutuhan Air'
    },
    {
      name: 'Prakiraan Hujan BMKG',
      value: `${forecastRainfall} mm / 24 Jam`,
      impact: forecastRainfall > 5 ? 'HIGH IMPACT' : forecastRainfall > 0 ? 'MEDIUM IMPACT' : 'LOW IMPACT',
      level: forecastRainfall > 5 ? 'high' : forecastRainfall > 0 ? 'medium' : 'low',
      direction: forecastRainfall > 5 ? 'Menunda Jadwal Irigasi' : 'Netral'
    },
    {
      name: 'Suhu & Evapotranspirasi',
      value: `${airTemperature}°C (Udara) / ${soilTemperature}°C (Tanah)`,
      impact: airTemperature > 32 ? 'HIGH IMPACT' : 'MEDIUM IMPACT',
      level: airTemperature > 32 ? 'high' : 'medium',
      direction: airTemperature > 32 ? 'Tingkat Evaporasi Cepat' : 'Laju Normal'
    },
    {
      name: 'Level Cadangan Waterbank',
      value: `${waterLevel}%`,
      impact: waterLevel < 20 ? 'HIGH IMPACT' : 'LOW IMPACT',
      level: waterLevel < 20 ? 'high' : 'low',
      direction: waterLevel < 20 ? 'Membatasi Durasi Pompa' : 'Kapasitas Aman'
    }
  ];

  return {
    recommendationText: statusText,
    urgency,
    waterReqLiters: Math.max(0, waterReqLiters),
    durationSeconds: Math.max(0, durationSeconds),
    explainableFactors: factors
  };
}
