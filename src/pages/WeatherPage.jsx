import React, { useState } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Compass,
  Clock,
  RefreshCw,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import LiveLocationControl from '../components/LiveLocationControl.jsx';
import { MOCK_BMKG_LOCATIONS } from '../services/mockWeather.js';

export default function WeatherPage() {
  const { weather, weatherLoading, fetchWeather, settings, updateSettings, isOnline } = useApp();
  const [selectedLoc, setSelectedLoc] = useState(settings.bmkgLocationId || '32.17');

  const handleLocationChange = (e) => {
    const newLocId = e.target.value;
    setSelectedLoc(newLocId);
    const locObj = MOCK_BMKG_LOCATIONS.find(l => l.id === newLocId);
    updateSettings({
      bmkgLocationId: newLocId,
      bmkgLocationName: locObj ? `${locObj.name}, ${locObj.province}` : 'Jawa Barat'
    });
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>INTEGRASI CUACA BMKG</span>
            <span className="text-[#38BDF8]">//</span>
            <span className="text-sm font-normal text-[#8A9198]">
              Prakiraan Presisi
            </span>
          </h1>
          <p className="text-xs text-[#8A9198]">
            Sinkronisasi data resmi Badan Meteorologi, Klimatologi, dan Geofisika untuk pertimbangan irigasi cerdas.
          </p>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141719] border border-[#22272B] text-xs font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#FF9A3D]" />
            <select
              value={selectedLoc}
              onChange={handleLocationChange}
              className="bg-transparent text-[#F5F5F5] focus:outline-none cursor-pointer"
            >
              {MOCK_BMKG_LOCATIONS.map(loc => (
                <option key={loc.id} value={loc.id} className="bg-[#141719] text-[#F5F5F5]">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchWeather}
            disabled={weatherLoading}
            className="p-2 rounded-lg bg-[#141719] border border-[#22272B] text-[#8A9198] hover:text-[#FF7A00] transition-colors cursor-pointer"
            title="Refresh BMKG Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${weatherLoading ? 'animate-spin text-[#FF7A00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live GPS / Agro-station Location Control Bar */}
      <LiveLocationControl compact={false} />

      {/* Offline Notice banner if internet is lost */}
      {!isOnline && (
        <div className="p-3 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-xs font-mono text-[#FF9A3D] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Mode Offline: Aplikasi menggunakan cache data BMKG terakhir yang disimpan pada penyimpanan lokal.
          </span>
        </div>
      )}

      {/* Primary Weather Card Component */}
      <WeatherCard
        weather={weather}
        isLoading={weatherLoading}
        onRefresh={fetchWeather}
      />

      {/* Multi-Day Extended Forecast */}
      {weather && weather.forecastDays && (
        <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5]">
              Prakiraan Cuaca 5 Hari ke Depan (BMKG Agro-Agrikultur)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {weather.forecastDays.map((f, i) => (
              <div
                key={i}
                className="bg-[#1B1F21] border border-[#282E33] rounded-xl p-3.5 text-center flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold font-mono text-[#FF9A3D]">{f.day}</div>
                  <div className="text-[10px] text-[#8A9198] font-mono mb-2">{f.date}</div>

                  <div className="my-2 flex justify-center text-[#38BDF8]">
                    {f.weatherDesc.includes('Hujan') ? (
                      <CloudRain className="w-7 h-7" />
                    ) : f.weatherDesc.includes('Cerah') ? (
                      <Sun className="w-7 h-7 text-[#FF9A3D]" />
                    ) : (
                      <Cloud className="w-7 h-7 text-[#8A9198]" />
                    )}
                  </div>

                  <div className="text-xs font-semibold text-[#F5F5F5]">{f.weatherDesc}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22272B] text-[11px] font-mono">
                  <div className="text-[#8A9198]">
                    {f.tempMin}° / <strong className="text-[#F5F5F5]">{f.tempMax}°C</strong>
                  </div>
                  <div className="text-[10px] text-[#38BDF8] mt-1">
                    Curah: {f.rainTotal} mm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agro-Meteorological Impact Matrix */}
      <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F5F5F5] mb-3">
          Korelasi Cuaca BMKG terhadap Logika Irigasi Presisi
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <div className="text-[#38BDF8] font-bold mb-1">Pencegahan Over-Watering</div>
            <p className="text-[#8A9198] leading-relaxed">
              Jika BMKG memprediksi probabilitas hujan &gt; 60% dalam kurun waktu 12 jam, sistem AI secara otomatis menunda jadwal irigasi untuk mencegah genangan air dan pembusukan akar.
            </p>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <div className="text-[#FF9A3D] font-bold mb-1">Kompensasi Evapotranspirasi</div>
            <p className="text-[#8A9198] leading-relaxed">
              Saat suhu mencapai &gt; 32°C dan kelembapan udara rendah (&lt; 50%), laju evaporasi meningkat. Durasi penyiraman ditingkatkan 15-20% pada waktu fajar atau senja.
            </p>
          </div>

          <div className="bg-[#1B1F21] p-3 rounded-lg border border-[#282E33]">
            <div className="text-[#22C55E] font-bold mb-1">Konservasi Cadangan Air</div>
            <p className="text-[#8A9198] leading-relaxed">
              Air hujan yang jatuh ke tanah dan penampung diperhitungkan sebagai pasokan gratis alami, menghemat siklus pompa submersible hingga 35% per musim tanam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
