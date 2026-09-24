/**
 * Location & Geolocation Service for PANGAN-SENSE
 * Supports live GPS field positioning, reverse geocoding, and nearest agro-station resolution
 */

export const INDONESIAN_AGRO_STATIONS = [
  { id: '32.17', name: 'Lembang, Kab. Bandung Barat', province: 'Jawa Barat', lat: -6.8167, lon: 107.6167 },
  { id: '32.15', name: 'Karawang (Sentra Padi)', province: 'Jawa Barat', lat: -6.3050, lon: 107.3015 },
  { id: '32.02', name: 'Sukabumi (Sayuran & Hortikultura)', province: 'Jawa Barat', lat: -6.9277, lon: 106.9299 },
  { id: '33.02', name: 'Banyumas', province: 'Jawa Tengah', lat: -7.5147, lon: 109.2941 },
  { id: '33.07', name: 'Wonosobo (Hortikultura Dataran Tinggi)', province: 'Jawa Tengah', lat: -7.3639, lon: 109.9000 },
  { id: '34.04', name: 'Sleman, D.I. Yogyakarta', province: 'D.I. Yogyakarta', lat: -7.7156, lon: 110.3556 },
  { id: '35.07', name: 'Batu / Malang (Apel & Sayur)', province: 'Jawa Timur', lat: -7.8711, lon: 112.5269 },
  { id: '35.09', name: 'Jember (Pangan & Tembakau)', province: 'Jawa Timur', lat: -8.1724, lon: 113.7007 },
  { id: '51.02', name: 'Tabanan (Subak Sawah Bali)', province: 'Bali', lat: -8.5411, lon: 115.1246 },
  { id: '52.01', name: 'Lombok Barat', province: 'Nusa Tenggara Barat', lat: -8.6833, lon: 116.1333 },
  { id: '12.07', name: 'Karo / Berastagi (Hortikultura)', province: 'Sumatera Utara', lat: 3.1833, lon: 98.5000 },
  { id: '73.06', name: 'Gowa (Sentra Padi & Jagung)', province: 'Sulawesi Selatan', lat: -5.3167, lon: 119.7500 }
];

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestStation(lat, lon) {
  let nearest = INDONESIAN_AGRO_STATIONS[0];
  let minDistance = calculateDistanceKm(lat, lon, nearest.lat, nearest.lon);

  for (let i = 1; i < INDONESIAN_AGRO_STATIONS.length; i++) {
    const station = INDONESIAN_AGRO_STATIONS[i];
    const dist = calculateDistanceKm(lat, lon, station.lat, station.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  return { station: nearest, distanceKm: Math.round(minDistance * 10) / 10 };
}

// Convert Open-Meteo WMO weather code to Indonesian text & icon
export function parseWmoWeatherCode(code) {
  if (code === 0) return { desc: 'Cerah', icon: 'Sun' };
  if (code === 1 || code === 2) return { desc: 'Cerah Berawan', icon: 'CloudSun' };
  if (code === 3) return { desc: 'Berawan Tebal', icon: 'Cloud' };
  if (code >= 45 && code <= 48) return { desc: 'Berkabut', icon: 'Cloud' };
  if (code >= 51 && code <= 55) return { desc: 'Gerimis Ringan', icon: 'CloudRain' };
  if (code >= 61 && code <= 63) return { desc: 'Hujan Ringan', icon: 'CloudRain' };
  if (code === 65) return { desc: 'Hujan Lebat', icon: 'CloudRain' };
  if (code >= 80 && code <= 82) return { desc: 'Hujan Deras Lokal', icon: 'CloudRain' };
  if (code >= 95) return { desc: 'Hujan Petir', icon: 'CloudRain' };
  return { desc: 'Berawan', icon: 'Cloud' };
}

export const locationService = {
  /**
   * Request live IP-based location when browser/iframe blocks hardware GPS
   */
  async fetchIpLocation() {
    const endpoints = [
      {
        url: 'https://ipwho.is/',
        extract: (d) => (d && d.success && typeof d.latitude === 'number') ? {
          lat: Number(d.latitude.toFixed(5)),
          lon: Number(d.longitude.toFixed(5)),
          accuracy: 1000,
          locationName: `${d.city || d.region || 'Bandung'}, ${d.region || d.country || 'Indonesia'}`,
          province: d.region || 'Jawa Barat',
          source: 'network_ip'
        } : null
      },
      {
        url: 'https://freeipapi.com/api/json',
        extract: (d) => (d && typeof d.latitude === 'number') ? {
          lat: Number(d.latitude.toFixed(5)),
          lon: Number(d.longitude.toFixed(5)),
          accuracy: 1500,
          locationName: `${d.cityName || d.regionName || 'Jakarta'}, ${d.countryName || 'Indonesia'}`,
          province: d.regionName || 'DKI Jakarta',
          source: 'network_ip'
        } : null
      },
      {
        url: 'https://ipapi.co/json/',
        extract: (d) => (d && typeof d.latitude === 'number') ? {
          lat: Number(d.latitude.toFixed(5)),
          lon: Number(d.longitude.toFixed(5)),
          accuracy: 1500,
          locationName: `${d.city || d.region}, ${d.country_name}`,
          province: d.region || 'Indonesia',
          source: 'network_ip'
        } : null
      }
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(ep.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          const parsed = ep.extract(json);
          if (parsed && !isNaN(parsed.lat) && !isNaN(parsed.lon)) {
            return parsed;
          }
        }
      } catch {
        // try next endpoint
      }
    }
    return null;
  },

  /**
   * Request live GPS coordinates from the device
   * If browser/iframe permissions policy blocks navigator.geolocation,
   * automatically fall back to IP/Network Geolocation and agro station center!
   */
  async getLiveCoordinates() {
    const tryHardwareGps = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error('Geolocation tidak didukung browser ini.'));
        }

        const options = {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: Number(position.coords.latitude.toFixed(5)),
              lon: Number(position.coords.longitude.toFixed(5)),
              accuracy: Math.round(position.coords.accuracy || 10),
              altitude: position.coords.altitude ? Math.round(position.coords.altitude) : null,
              source: 'satellite_gps',
              timestamp: new Date().toISOString()
            });
          },
          (error) => {
            reject(error);
          },
          options
        );
      });
    };

    // 1. First attempt hardware GPS
    try {
      const gpsResult = await tryHardwareGps();
      return gpsResult;
    } catch (gpsError) {
      console.warn('[LocationService] Hardware GPS unavailable or restricted by permissions policy:', gpsError.message || gpsError);

      // 2. Fall back to Network IP Geolocation
      try {
        const ipLocation = await this.fetchIpLocation();
        if (ipLocation) {
          return {
            lat: ipLocation.lat,
            lon: ipLocation.lon,
            accuracy: ipLocation.accuracy,
            altitude: null,
            source: 'network_ip',
            locationName: ipLocation.locationName,
            province: ipLocation.province,
            timestamp: new Date().toISOString(),
            isFallback: true,
            note: 'Izin Satelit GPS dibatasi oleh browser/iframe. Lokasi dialihkan secara otomatis ke estimasi jaringan internet (IP/Menara).'
          };
        }
      } catch (ipErr) {
        console.warn('[LocationService] IP Geolocation fallback failed:', ipErr);
      }

      // 3. Fall back to default agricultural station (Lembang / West Java Sentra Hortikultura)
      const defaultStation = INDONESIAN_AGRO_STATIONS[0];
      return {
        lat: defaultStation.lat,
        lon: defaultStation.lon,
        accuracy: 25,
        altitude: 1250,
        source: 'agro_station_preset',
        locationName: defaultStation.name,
        province: defaultStation.province,
        timestamp: new Date().toISOString(),
        isFallback: true,
        note: 'Satelit GPS tidak merespon. Menghubungkan ke Stasiun Agroklimat Lapangan terdekat.'
      };
    }
  },

  /**
   * Reverse geocode coordinates to district / city name in Indonesia
   */
  async reverseGeocode(lat, lon) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'id,en' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const village = addr.village || addr.suburb || addr.neighbourhood || '';
        const district = addr.county || addr.city_district || addr.district || '';
        const city = addr.city || addr.regency || addr.town || '';
        const state = addr.state || '';

        const parts = [village, district, city].filter(Boolean);
        const locationName = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 2).join(',') || 'Lokasi Langsung Petani');
        return {
          locationName,
          province: state || 'Indonesia',
          displayName: data.display_name
        };
      }
    } catch {
      // Ignore network timeout/failure
    }

    // Fallback: match nearest station name
    const { station, distanceKm } = findNearestStation(lat, lon);
    return {
      locationName: `Dekat ${station.name} (${distanceKm} km)`,
      province: station.province,
      displayName: `${station.name}, ${station.province}`
    };
  },

  /**
   * Fetch live weather data for exact coordinates using Open-Meteo
   */
  async fetchLiveWeatherByCoords(lat, lon, locationName = 'Lokasi Petani') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const current = json.current || {};
        const hourly = json.hourly || {};
        const daily = json.daily || {};

        const weatherInfo = parseWmoWeatherCode(current.weather_code || 0);

        // Next 8 time intervals (spaced every 3 hours)
        const forecast24h = [];
        const times = hourly.time || [];
        for (let i = 0; i < Math.min(24, times.length); i += 3) {
          const tDate = new Date(times[i]);
          const timeStr = tDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          const code = hourly.weather_code?.[i] ?? 0;
          forecast24h.push({
            time: timeStr,
            weatherDesc: parseWmoWeatherCode(code).desc,
            temp: Math.round(hourly.temperature_2m?.[i] ?? 25),
            humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 70),
            rainfallProb: Math.round(hourly.precipitation_probability?.[i] ?? 0),
            rainfall: Number((hourly.precipitation?.[i] ?? 0).toFixed(1))
          });
        }

        // Daily 5-day forecast
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const forecastDays = [];
        const dTimes = daily.time || [];
        for (let i = 0; i < Math.min(5, dTimes.length); i++) {
          const dDate = new Date(dTimes[i]);
          const dayName = i === 0 ? 'Hari Ini' : (i === 1 ? 'Besok' : dayNames[dDate.getDay()]);
          const dCode = daily.weather_code?.[i] ?? 0;
          forecastDays.push({
            day: dayName,
            date: dDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            weatherDesc: parseWmoWeatherCode(dCode).desc,
            tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 20),
            tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 30),
            rainTotal: Number((daily.precipitation_sum?.[i] ?? 0).toFixed(1))
          });
        }

        return {
          location: locationName,
          province: 'Kondisi Lapangan Langsung',
          coordinates: { lat, lon },
          isLiveGps: true,
          current: {
            weatherCode: current.weather_code || 0,
            weatherDesc: weatherInfo.desc,
            temperature: Number((current.temperature_2m ?? 26).toFixed(1)),
            humidity: Math.round(current.relative_humidity_2m ?? 75),
            rainfall: Number((current.precipitation ?? 0).toFixed(1)),
            windSpeed: Number((current.wind_speed_10m ?? 7.5).toFixed(1)),
            windDirection: 'Angin Lapangan',
            uvIndex: 4.5,
            airPressure: Math.round(current.surface_pressure ?? 1012),
            icon: weatherInfo.icon
          },
          forecast24h,
          forecastDays,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('[LocationService] Live Open-Meteo fetch failed:', e);
    }

    return null;
  }
};

export default locationService;
