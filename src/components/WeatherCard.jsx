import React from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Compass, Clock, RefreshCw } from 'lucide-react';

export default function WeatherCard({ weather, isLoading, onRefresh, compact = false }) {
  if (isLoading || !weather) {
    return (
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 animate-pulse">
        <div className="h-5 w-40 bg-[#1B1F21] rounded mb-4" />
        <div className="h-10 w-24 bg-[#1B1F21] rounded mb-3" />
        <div className="h-4 w-full bg-[#1B1F21] rounded" />
      </div>
    );
  }

  const { current, forecast24h, location, lastUpdated, isOfflineData } = weather;

  const getWeatherIcon = (desc = '') => {
    const lower = desc.toLowerCase();
    if (lower.includes('hujan')) return <CloudRain className="w-8 h-8 text-[#38BDF8]" />;
    if (lower.includes('cerah')) return <Sun className="w-8 h-8 text-[#FF9A3D]" />;
    return <Cloud className="w-8 h-8 text-[#8A9198]" />;
  };

  const formattedTime = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  if (compact) {
    return (
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getWeatherIcon(current.weatherDesc)}
          <div>
            <div className="text-xs font-mono text-[#8A9198] flex items-center gap-1.5">
              <span>BMKG: {location}</span>
              {isOfflineData && <span className="text-[10px] text-[#FF9A3D]">(Tersimpan)</span>}
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5]">
              {current.temperature}°C • <span className="text-sm font-normal text-[#8A9198]">{current.weatherDesc}</span>
            </div>
          </div>
        </div>
        <div className="text-right text-xs font-mono text-[#8A9198]">
          <div>Hujan: <span className="text-[#38BDF8]">{current.rainfall} mm</span></div>
          <div>Kelembapan: <span className="text-[#F5F5F5]">{current.humidity}%</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
          <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
            Prakiraan Cuaca BMKG ({location})
          </h3>
          {isOfflineData && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF7A00]/10 text-[#FF9A3D] border border-[#FF7A00]/30">
              Data Cache Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8A9198]">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedTime}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:text-[#FF7A00] transition-colors"
              title="Perbarui Cuaca BMKG"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Temp & Condition */}
      <div className="flex items-center justify-between my-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#1B1F21] border border-[#282E33]">
            {getWeatherIcon(current.weatherDesc)}
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-[#F5F5F5]">
              {current.temperature}°C
            </div>
            <div className="text-sm font-medium text-[#8A9198]">
              {current.weatherDesc}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-right">
          <div className="bg-[#1B1F21] px-3 py-1.5 rounded-lg border border-[#282E33]">
            <div className="text-[10px] text-[#8A9198] font-mono uppercase">Kelembapan</div>
            <div className="text-sm font-bold font-mono text-[#38BDF8]">{current.humidity}%</div>
          </div>
          <div className="bg-[#1B1F21] px-3 py-1.5 rounded-lg border border-[#282E33]">
            <div className="text-[10px] text-[#8A9198] font-mono uppercase">Curah Hujan</div>
            <div className="text-sm font-bold font-mono text-[#38BDF8]">{current.rainfall} mm</div>
          </div>
        </div>
      </div>

      {/* Hourly Mini Timeline */}
      {forecast24h && forecast24h.length > 0 && (
        <div>
          <div className="text-[11px] font-mono text-[#8A9198] mb-2 uppercase tracking-wider">
            Timeline Prakiraan 24 Jam
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 overflow-x-auto pb-1">
            {forecast24h.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#1B1F21] border border-[#282E33] rounded-lg p-2 text-center text-xs font-mono min-w-[65px]"
              >
                <div className="text-[10px] text-[#8A9198]">{item.time}</div>
                <div className="font-bold my-1 text-[#F5F5F5]">{item.temp}°</div>
                <div className="text-[9px] text-[#38BDF8] flex items-center justify-center gap-0.5">
                  <Droplets className="w-2.5 h-2.5" />
                  {item.rainfallProb}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
