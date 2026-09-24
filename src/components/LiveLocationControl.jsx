import React from 'react';
import { MapPin, Compass, Navigation, RefreshCw, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function LiveLocationControl({ compact = false }) {
  const {
    settings,
    detectLiveLocation,
    isDetectingLocation,
    weather,
    isOnline
  } = useApp();

  const isLiveGps = settings.locationMode === 'live_gps' && settings.liveCoordinates?.isLive;
  const coords = settings.liveCoordinates || { lat: -6.8167, lon: 107.6167 };
  const locationName = settings.bmkgLocationName || 'Lembang, Jawa Barat';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={detectLiveLocation}
          disabled={isDetectingLocation}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
            isLiveGps
              ? 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E] hover:bg-[#22C55E]/20'
              : 'bg-[#141719] border-[#22272B] text-[#8A9198] hover:text-[#F5F5F5] hover:border-[#FF7A00]/40'
          }`}
          title="Sinkronkan dengan Lokasi Lapangan Langsung (GPS)"
        >
          <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-[#FF7A00]' : isLiveGps ? 'text-[#22C55E]' : 'text-[#8A9198]'}`} />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {isDetectingLocation ? 'Mencari GPS...' : isLiveGps ? `GPS: ${locationName}` : locationName}
          </span>
          {isLiveGps && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse shrink-0" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
      <div className="flex items-start sm:items-center gap-3">
        <div className={`p-2.5 rounded-xl border shrink-0 ${
          isLiveGps
            ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
            : 'bg-[#1B1F21] border-[#282E33] text-[#FF9A3D]'
        }`}>
          {isLiveGps ? (
            <Navigation className="w-5 h-5 animate-pulse" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5F5F5]">
              {locationName}
            </span>
            {isLiveGps ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                GPS AKTIF (±{coords.accuracy || 10}m)
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B1F21] text-[#8A9198] border border-[#282E33]">
                Stasiun Agroklimat BMKG
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#8A9198] flex items-center gap-3 mt-0.5">
            <span>Koordinat: {coords.lat.toFixed(4)}°, {coords.lon.toFixed(4)}°</span>
            {weather?.current && (
              <span className="text-[#38BDF8] hidden md:inline">
                • {weather.current.temperature}°C, {weather.current.weatherDesc}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={detectLiveLocation}
          disabled={isDetectingLocation}
          className="px-3.5 py-2 bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/40 text-[#FF9A3D] text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <Compass className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
          <span>{isDetectingLocation ? 'Mencari Sinyal GPS...' : 'Sesuaikan Lokasi Langsung'}</span>
        </button>
      </div>
    </div>
  );
}
