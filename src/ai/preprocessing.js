/**
 * Input Preprocessing for Precision Irrigation ML Model
 * Normalizes agronomic and environmental features into scaled tensors
 */

// Plant crop coefficient factor (Kc), moisture thresholds, and agronomic profiles
export const PLANT_PROFILES = {
  padi: {
    id: 'padi',
    name: 'Padi Sawah (Oryza sativa)',
    category: 'Pangan Utama',
    optimalMoisture: 75,
    criticalMoisture: 55,
    kc: 1.15,
    maxDurationSec: 1800,
    growthDurationDays: 115,
    soilPreference: 'liat',
    waterDemand: 'Tinggi (Kebutuhan air tergenang periodik)'
  },
  jagung: {
    id: 'jagung',
    name: 'Jagung Hibrida (Zea mays)',
    category: 'Palawija',
    optimalMoisture: 55,
    criticalMoisture: 38,
    kc: 0.85,
    maxDurationSec: 1200,
    growthDurationDays: 100,
    soilPreference: 'lempung',
    waterDemand: 'Sedang (Peka saat pembungaan)'
  },
  cabai: {
    id: 'cabai',
    name: 'Cabai Rawit / Merah (Capsicum)',
    category: 'Hortikultura',
    optimalMoisture: 60,
    criticalMoisture: 42,
    kc: 0.95,
    maxDurationSec: 900,
    growthDurationDays: 90,
    soilPreference: 'lempung',
    waterDemand: 'Sedang (Hindari genangan, rentan busuk akar)'
  },
  bawang: {
    id: 'bawang',
    name: 'Bawang Merah (Allium cepa)',
    category: 'Hortikultura',
    optimalMoisture: 60,
    criticalMoisture: 40,
    kc: 0.90,
    maxDurationSec: 800,
    growthDurationDays: 70,
    soilPreference: 'lempung berpasir',
    waterDemand: 'Sedang (Irigasi teratur tapi drainase cepat)'
  },
  tomat: {
    id: 'tomat',
    name: 'Tomat Sayur & Buah (Solanum lycopersicum)',
    category: 'Hortikultura',
    optimalMoisture: 65,
    criticalMoisture: 45,
    kc: 1.05,
    maxDurationSec: 900,
    growthDurationDays: 85,
    soilPreference: 'lempung',
    waterDemand: 'Sedang-Tinggi (Konsisten untuk cegah blossom end rot)'
  },
  kedelai: {
    id: 'kedelai',
    name: 'Kedelai (Glycine max)',
    category: 'Palawija',
    optimalMoisture: 58,
    criticalMoisture: 40,
    kc: 0.95,
    maxDurationSec: 1000,
    growthDurationDays: 85,
    soilPreference: 'lempung',
    waterDemand: 'Sedang'
  },
  kentang: {
    id: 'kentang',
    name: 'Kentang Dataran Tinggi (Solanum tuberosum)',
    category: 'Hortikultura',
    optimalMoisture: 70,
    criticalMoisture: 50,
    kc: 1.10,
    maxDurationSec: 1200,
    growthDurationDays: 105,
    soilPreference: 'gambut/lempung gembur',
    waterDemand: 'Tinggi (Kebutuhan kelembapan seragam)'
  },
  melon: {
    id: 'melon',
    name: 'Melon / Semangka (Cucurbitaceae)',
    category: 'Buah Semusim',
    optimalMoisture: 62,
    criticalMoisture: 42,
    kc: 0.90,
    maxDurationSec: 900,
    growthDurationDays: 75,
    soilPreference: 'lempung berpasir',
    waterDemand: 'Tinggi saat pembesaran buah, dikurangi saat pematangan'
  },
  terong: {
    id: 'terong',
    name: 'Terong Ungu (Solanum melongena)',
    category: 'Sayuran Buah',
    optimalMoisture: 65,
    criticalMoisture: 44,
    kc: 0.95,
    maxDurationSec: 900,
    growthDurationDays: 95,
    soilPreference: 'lempung',
    waterDemand: 'Sedang-Tinggi'
  },
  sayuran: {
    id: 'sayuran',
    name: 'Sayuran Daun / Selada / Pakcoy (Brassica)',
    category: 'Sayuran Daun',
    optimalMoisture: 72,
    criticalMoisture: 50,
    kc: 1.00,
    maxDurationSec: 600,
    growthDurationDays: 40,
    soilPreference: 'gembur organik',
    waterDemand: 'Frekuensi tinggi dengan volume ringan'
  }
};

/**
 * Normalizes input vector to standard [0, 1] range for Neural Network input
 * @param {Object} rawInput 
 * @returns {Array<number>} 10-dimensional normalized feature array
 */
export function preprocessFeatures(rawInput) {
  const {
    soilMoisture = 50,         // % (0 - 100)
    soilTemperature = 28,      // °C (15 - 45)
    airTemperature = 30,       // °C (15 - 45)
    airHumidity = 65,          // % (20 - 100)
    rainfall = 0,              // mm (0 - 100)
    lightIntensity = 20000,    // Lux (0 - 120000)
    waterLevel = 75,           // % (0 - 100)
    plantType = 'cabai',       // string key
    forecastRainfall = 0,      // mm next 24h (0 - 100)
    historicalWaterUsage = 40  // Liters/day (10 - 200)
  } = rawInput;

  const plant = PLANT_PROFILES[plantType] || PLANT_PROFILES.cabai;

  // Feature Normalization (Min-Max scaling to [0, 1])
  const normSoilMoisture = Math.min(Math.max(soilMoisture / 100, 0), 1);
  const normSoilTemp = Math.min(Math.max((soilTemperature - 15) / 30, 0), 1);
  const normAirTemp = Math.min(Math.max((airTemperature - 15) / 30, 0), 1);
  const normAirHumidity = Math.min(Math.max((airHumidity - 20) / 80, 0), 1);
  const normRainfall = Math.min(Math.max(rainfall / 50, 0), 1);
  const normLight = Math.min(Math.max(lightIntensity / 100000, 0), 1);
  const normWaterLevel = Math.min(Math.max(waterLevel / 100, 0), 1);
  const normPlantKc = Math.min(Math.max((plant.kc - 0.5) / 1.0, 0), 1);
  const normForecastRain = Math.min(Math.max(forecastRainfall / 50, 0), 1);
  const normHistUsage = Math.min(Math.max((historicalWaterUsage - 10) / 190, 0), 1);

  return [
    normSoilMoisture,
    normSoilTemp,
    normAirTemp,
    normAirHumidity,
    normRainfall,
    normLight,
    normWaterLevel,
    normPlantKc,
    normForecastRain,
    normHistUsage
  ];
}
