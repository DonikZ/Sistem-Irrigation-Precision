import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sprout, Droplets, SlidersHorizontal, Cpu } from 'lucide-react';

export default function MobileNav() {
  const items = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Lahan', path: '/monitoring', icon: Sprout },
    { name: 'Waterbank', path: '/waterbank', icon: Droplets },
    { name: 'Irigasi', path: '/irigasi', icon: SlidersHorizontal },
    { name: 'Edge AI', path: '/ai', icon: Cpu },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0B0D0E]/95 backdrop-blur-md border-t border-[#1B1F21] px-2 py-1.5 flex items-center justify-around z-40">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-all ${
                isActive
                  ? 'text-[#FF9A3D] font-bold'
                  : 'text-[#8A9198] hover:text-[#F5F5F5]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
