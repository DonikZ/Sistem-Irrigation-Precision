/**
 * BMKG Weather Service
 * Handles online fetching with caching, timeout protection, and seamless offline fallback
 */
import { MOCK_WEATHER_DATA, MOCK_BMKG_LOCATIONS } from './mockWeather.js';
import { locationService } from './locationService.js';

const STORAGE_KEY = 'pangan_sense_bmkg_weather_cache';

class WeatherService {
  constructor() {
    this.apiUrl = import.meta.env.VITE_BMKG_API_URL || 'https://api.bmkg.go.id';
  }

  /**
   * Get cached weather data from localStorage
   */
  getCachedWeather() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('[Weather Service] Failed to read weather cache:', e);
    }
    return null;
  }

  /**
   * Save weather to localStorage cache
   */
  saveToCache(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[Weather Service] Failed to save weather cache:', e);
    }
  }

  /**
   * Fetches latest weather forecast
   * Supports Live GPS coordinates mode and BMKG Station mode
   * Falls back gracefully to cache or mock if offline or API unavailable
   */
  async getWeatherForecast(locationId = '32.17', options = {}) {
    const { useLiveGps = false, coordinates = null, locationName = '' } = options;

    // 1. If Live GPS mode is requested and we have valid coordinates
    if (useLiveGps && coordinates?.lat && coordinates?.lon) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const liveWeather = await locationService.fetchLiveWeatherByCoords(
          coordinates.lat,
          coordinates.lon,
          locationName || 'Lokasi Lapangan GPS'
        );
        if (liveWeather) {
          this.saveToCache(liveWeather);
          return { ...liveWeather, isOfflineData: false };
        }
      }
    }

    // 2. If browser is offline, return cached or fallback immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = this.getCachedWeather();
      if (cached) {
        return { ...cached, isOfflineData: true };
      }
      return { ...MOCK_WEATHER_DATA, isOfflineData: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      // Attempt fetch from BMKG API endpoint
      const response = await fetch(`${this.apiUrl}/publik/prakiraan-cuaca?adm4=${locationId}`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const json = await response.json();
        // Transform BMKG response
        const transformed = this.transformBmkgData(json);
        this.saveToCache(transformed);
        return { ...transformed, isOfflineData: false };
      }
    } catch (err) {
      console.warn('[Weather Service] BMKG live fetch failed, using cached/mock fallback:', err);
    }

    // Fallback to cache or realistic mock data matched to location
    const cached = this.getCachedWeather();
    if (cached) {
      return { ...cached, isOfflineData: false, isFallback: true };
    }

    const matchedLoc = MOCK_BMKG_LOCATIONS.find(l => l.id === locationId);
    const fallbackData = {
      ...MOCK_WEATHER_DATA,
      location: matchedLoc ? matchedLoc.name : (locationName || MOCK_WEATHER_DATA.location),
      province: matchedLoc ? matchedLoc.province : MOCK_WEATHER_DATA.province,
      lastUpdated: new Date().toISOString(),
      isOfflineData: false,
      isFallback: true
    };
    this.saveToCache(fallbackData);
    return fallbackData;
  }

  transformBmkgData(raw) {
    if (!raw || !raw.data) {
      return MOCK_WEATHER_DATA;
    }
    // Return structured payload matching app contract
    return {
      location: raw.lokasi?.desa || raw.lokasi?.kecamatan || 'Lembang, Jawa Barat',
      province: raw.lokasi?.provinsi || 'Jawa Barat',
      coordinates: {
        lat: raw.lokasi?.lat || -6.81,
        lon: raw.lokasi?.lon || 107.61
      },
      current: {
        weatherDesc: raw.data[0]?.cuaca_desc || 'Berawan',
        temperature: raw.data[0]?.t || 25,
        humidity: raw.data[0]?.hu || 75,
        rainfall: 0,
        windSpeed: raw.data[0]?.ws || 8,
        windDirection: raw.data[0]?.wd || 'Tenggara',
        uvIndex: 4
      },
      forecast24h: MOCK_WEATHER_DATA.forecast24h,
      forecastDays: MOCK_WEATHER_DATA.forecastDays,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const weatherService = new WeatherService();
export default weatherService;
