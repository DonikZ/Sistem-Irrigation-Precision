import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  CloudSun,
  Cpu,
  SlidersHorizontal,
  History,
  Settings,
  ShieldCheck,
  Radio,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const { settings, updateSettings, bluetoothStatus, currentPlant } = useApp();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Monitoring Lahan', path: '/monitoring', icon: Sprout },
    { name: 'Waterbank', path: '/waterbank', icon: Droplets },
    { name: 'Prakiraan Cuaca', path: '/cuaca', icon: CloudSun },
    { name: 'Edge AI Prediction', path: '/ai', icon: Cpu },
    { name: 'Kontrol Irigasi', path: '/irigasi', icon: SlidersHorizontal },
    { name: 'Riwayat Log', path: '/riwayat', icon: History },
    { name: 'Pengaturan', path: '/pengaturan', icon: Settings },
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0B0D0E] border-r border-[#1B1F21] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="h-16 px-5 border-b border-[#1B1F21] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00] flex items-center justify-center text-[#0B0D0E] font-black text-lg shadow-md shadow-[#FF7A00]/20">
              P
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wider font-mono text-[#F5F5F5] flex items-center gap-1">
                <span>PANGAN</span>
                <span className="text-[#FF7A00]">-SENSE</span>
              </div>
              <div className="text-[10px] text-[#8A9198] font-mono tracking-tight">
                IoT Precision Agri
              </div>
            </div>
          </div>

          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1B1F21] text-[#8A9198] border border-[#282E33]">
            v1.4
          </span>
        </div>

        {/* Selected Crop Profile Badge */}
        <div className="mx-4 my-3 p-2.5 rounded-lg bg-[#141719] border border-[#22272B] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#8A9198] uppercase font-mono">Tanaman Aktif</div>
            <div className="text-xs font-bold text-[#F5F5F5]">{currentPlant.name}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF7A00]/15 text-[#FF9A3D] border border-[#FF7A00]/30 shadow-sm font-semibold'
                      : 'text-[#8A9198] hover:text-[#F5F5F5] hover:bg-[#141719] border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Demo Mode Switch & Hardware Footer */}
      <div className="p-4 border-t border-[#1B1F21] space-y-3">
        {/* Demo Mode Toggle */}
        <div className="bg-[#141719] p-2.5 rounded-xl border border-[#22272B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${settings.demoMode ? 'text-[#FF9A3D] animate-pulse' : 'text-[#8A9198]'}`} />
            <div>
              <div className="text-[11px] font-bold font-mono text-[#F5F5F5]">Demo Mode</div>
              <div className="text-[9px] text-[#8A9198]">Simulator Sensor</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ demoMode: !settings.demoMode })}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              settings.demoMode ? 'bg-[#FF7A00]' : 'bg-[#252A2E]'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.demoMode ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Node Hardware Tag */}
        <div className="text-[10px] font-mono text-[#5A626A] flex items-center justify-between px-1">
          <span>ESP32 Node #01</span>
          <span>{bluetoothStatus}</span>
        </div>
      </div>
    </aside>
  );
}
