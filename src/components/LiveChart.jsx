import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function LiveChart({ data = [], height = 240, title = 'Grafik Telemetri Real-Time' }) {
  const [selectedMetric, setSelectedMetric] = useState('soilMoisture');

  const metricConfigs = {
    soilMoisture: { label: 'Kelembapan Tanah (%)', color: '#FF7A00', unit: '%', domain: [0, 100] },
    soilTemperature: { label: 'Suhu Tanah (°C)', color: '#FF9A3D', unit: '°C', domain: [15, 45] },
    airTemperature: { label: 'Suhu Udara (°C)', color: '#F59E0B', unit: '°C', domain: [15, 45] },
    airHumidity: { label: 'Kelembapan Udara (%)', color: '#38BDF8', unit: '%', domain: [20, 100] },
    waterLevel: { label: 'Level Waterbank (%)', color: '#0EA5E9', unit: '%', domain: [0, 100] },
  };

  const currentConfig = metricConfigs[selectedMetric] || metricConfigs.soilMoisture;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141719] border border-[#282E33] p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-[#8A9198] mb-1">{label}</div>
          <div className="font-bold flex items-center gap-1.5" style={{ color: currentConfig.color }}>
            <span>{currentConfig.label}:</span>
            <span className="text-[#F5F5F5]">{payload[0].value} {currentConfig.unit}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#141719] border border-[#22272B] rounded-xl p-5 flex flex-col justify-between">
      {/* Header and Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF7A00] animate-pulse" />
          <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
            {title}
          </h3>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(metricConfigs).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all ${
                selectedMetric === key
                  ? 'bg-[#FF7A00]/20 text-[#FF9A3D] border border-[#FF7A00]/40 font-semibold'
                  : 'bg-[#1B1F21] text-[#8A9198] hover:text-[#F5F5F5] border border-transparent'
              }`}
            >
              {config.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Container */}
      <div style={{ width: '100%', height }} className="relative">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#282E33] rounded-xl bg-[#101214]/60 text-center p-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00] animate-ping mb-2" />
            <p className="text-xs font-mono font-bold text-[#F5F5F5]">Menunggu Aliran Data Projek ESP32 (Standby 0)</p>
            <p className="text-[11px] font-mono text-[#8A9198] max-w-sm mt-1">
              Grafik telemetri akan langsung terisi secara otomatis begitu mikrokontroler proyek terhubung via BLE atau kalibrasi diaktifkan.
            </p>
          </div>
        ) : (
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1F2428" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#5A626A"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#22272B' }}
              />
              <YAxis
                domain={currentConfig.domain}
                stroke="#5A626A"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#22272B' }}
                tickFormatter={(v) => `${v}${currentConfig.unit}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={currentConfig.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${selectedMetric})`}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#8A9198] pt-2 border-t border-[#1F2428] mt-2">
        <span>Interval Telemetri: 3 Detik</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${data.length > 0 ? 'bg-[#22C55E]' : 'bg-[#FF7A00]'}`} />
          {data.length > 0 ? 'Streaming Aktif' : 'Standby (0 Paket)'}
        </span>
      </div>
    </div>
  );
}
