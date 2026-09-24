/**
 * Mock BMKG Weather Data
 * Realistic data based on BMKG Open Data schema for Indonesian agricultural centers
 */

export const MOCK_BMKG_LOCATIONS = [
  { id: '32.17', name: 'Lembang, Kab. Bandung Barat', province: 'Jawa Barat' },
  { id: '34.04', name: 'Sleman, D.I. Yogyakarta', province: 'D.I. Yogyakarta' },
  { id: '35.07', name: 'Batu / Malang', province: 'Jawa Timur' },
  { id: '33.02', name: 'Banyumas', province: 'Jawa Tengah' },
  { id: '51.02', name: 'Tabanan', province: 'Bali' },
];

export const MOCK_WEATHER_DATA = {
  location: 'Lembang, Kab. Bandung Barat',
  province: 'Jawa Barat',
  coordinates: { lat: -6.8167, lon: 107.6167 },
  current: {
    weatherCode: 3,
    weatherDesc: 'Berawan',
    temperature: 24.8,
    humidity: 78,
    rainfall: 0.0,
    windSpeed: 8.5,
    windDirection: 'Tenggara',
    uvIndex: 4.2,
    airPressure: 1012,
    icon: 'Cloudy'
  },
  forecast24h: [
    { time: '06:00', weatherDesc: 'Cerah Berawan', temp: 21.0, humidity: 85, rainfallProb: 10, rainfall: 0 },
    { time: '09:00', weatherDesc: 'Cerah', temp: 25.5, humidity: 72, rainfallProb: 15, rainfall: 0 },
    { time: '12:00', weatherDesc: 'Berawan', temp: 28.2, humidity: 65, rainfallProb: 25, rainfall: 0 },
    { time: '15:00', weatherDesc: 'Hujan Ringan', temp: 26.0, humidity: 82, rainfallProb: 75, rainfall: 4.5 },
    { time: '18:00', weatherDesc: 'Hujan Sedang', temp: 23.5, humidity: 90, rainfallProb: 85, rainfall: 8.2 },
    { time: '21:00', weatherDesc: 'Berawan Tebal', temp: 22.0, humidity: 88, rainfallProb: 40, rainfall: 1.0 },
    { time: '00:00', weatherDesc: 'Berawan', temp: 20.5, humidity: 92, rainfallProb: 20, rainfall: 0 },
    { time: '03:00', weatherDesc: 'Kabut/Berawan', temp: 19.8, humidity: 95, rainfallProb: 15, rainfall: 0 }
  ],
  forecastDays: [
    { day: 'Hari Ini', date: 'Senin', weatherDesc: 'Hujan Sore', tempMin: 20, tempMax: 28, rainTotal: 13.7 },
    { day: 'Besok', date: 'Selasa', weatherDesc: 'Hujan Ringan', tempMin: 19, tempMax: 27, rainTotal: 6.5 },
    { day: 'Lusa', date: 'Rabu', weatherDesc: 'Cerah Berawan', tempMin: 20, tempMax: 29, rainTotal: 1.2 },
    { day: 'Kamis', date: 'Kamis', weatherDesc: 'Berawan', tempMin: 21, tempMax: 28, rainTotal: 2.0 },
    { day: 'Jumat', date: 'Jumat', weatherDesc: 'Hujan Petir', tempMin: 20, tempMax: 26, rainTotal: 22.4 }
  ],
  lastUpdated: new Date().toISOString()
};
