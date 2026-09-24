import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import MobileNav from './components/MobileNav.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import BluetoothScanModal from './components/BluetoothScanModal.jsx';
import { useApp } from './context/AppContext.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import MonitoringPage from './pages/MonitoringPage.jsx';
import WaterbankPage from './pages/WaterbankPage.jsx';
import WeatherPage from './pages/WeatherPage.jsx';
import AIPredictionPage from './pages/AIPredictionPage.jsx';
import IrrigationPage from './pages/IrrigationPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isBluetoothModalOpen, closeBluetoothModal } = useApp();

  return (
    <div className="min-h-screen bg-[#0B0D0E] text-[#F5F5F5] flex overflow-x-hidden font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Primary Content Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/waterbank" element={<WaterbankPage />} />
            <Route path="/cuaca" element={<WeatherPage />} />
            <Route path="/ai" element={<AIPredictionPage />} />
            <Route path="/irigasi" element={<IrrigationPage />} />
            <Route path="/riwayat" element={<HistoryPage />} />
            <Route path="/pengaturan" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Bluetooth BLE Scanner & Connection Modal */}
        <BluetoothScanModal isOpen={isBluetoothModalOpen} onClose={closeBluetoothModal} />

        {/* Global Notifications */}
        <NotificationToast />

        {/* Bottom Navigation for Mobile */}
        <MobileNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
}
