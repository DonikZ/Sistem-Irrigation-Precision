/**
 * PANGAN-SENSE Central Application Context
 * Coordinates BLE, Offline Telemetry, Demo Simulator, AI Prediction, and Actuators
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import bleManager from '../bluetooth/bluetoothManager.js';
import { BLE_STATUS } from '../bluetooth/bleConstants.js';
import { buildIrrigationCommand, buildEmergencyStopCommand, buildPumpCommand, buildValveCommand } from '../bluetooth/bleCommands.js';
import { predictIrrigation } from '../ai/predictor.js';
import { PLANT_PROFILES } from '../ai/preprocessing.js';
import { weatherService } from '../services/weatherService.js';
import { locationService } from '../services/locationService.js';
import { supabaseService } from '../services/supabaseService.js';
import { storageService } from '../services/storageService.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // 1. Settings state
  const [settings, setSettings] = useState(() => storageService.getSettings());

  // 1.1 Lands & Farm Parcels state
  const [lands, setLands] = useState(() => storageService.getLands());
  const [activeLandId, setActiveLandId] = useState(() => settings.activeLandId || 'lahan-1');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Compute active land and active plant
  const activeLand = lands.find(l => l.id === activeLandId) || lands[0] || {
    id: 'lahan-1',
    name: 'Lahan Utama Blok A',
    plantType: settings.plantType || 'cabai',
    areaM2: 5000,
    plantingDate: '2026-08-15',
    soilType: 'lempung'
  };

  const currentPlant = PLANT_PROFILES[activeLand.plantType] || PLANT_PROFILES[settings.plantType] || PLANT_PROFILES.cabai;

  // 2. Connectivity Triple-Status
  const [bluetoothStatus, setBluetoothStatus] = useState(BLE_STATUS.DISCONNECTED);
  const [connectedDeviceName, setConnectedDeviceName] = useState(null);
  const [bluetoothModalOpen, setBluetoothModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [cloudStatus, setCloudStatus] = useState(() => supabaseService.isCloudAvailable() ? 'SYNCED' : 'NOT SYNCED');

  // 3. Sensor Real-Time Telemetry State (Real-World initial state: 0 until connected to project)
  const [sensorData, setSensorData] = useState({
    soilMoisture: 0,
    soilTemperature: 0,
    airTemperature: 0,
    airHumidity: 0,
    rainfall: 0.0,
    lightIntensity: 0,
    waterLevel: 0,
    pump: false,
    valve: false,
    timestamp: null
  });

  // Historical Telemetry Ring Buffer for Charts (Empty until data stream is received)
  const [telemetryHistory, setTelemetryHistory] = useState([]);

  // 4. Waterbank State (Real-world initial state: 0 until connected)
  const [waterbank, setWaterbank] = useState({
    capacityLiters: settings.waterbankCapacityLiters || 5000,
    currentVolumeLiters: 0,
    percentage: 0,
    inflowRateLpm: 0.0,
    consumptionLpm: 0.0,
    averageDailyUsageLiters: 0.0,
    remainingDays: 0
  });

  // 5. Weather State
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // 6. AI Prediction State
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiPredicting, setAiPredicting] = useState(false);

  // 7. Irrigation Actuator State (Real-world initial state: 0)
  const [irrigationState, setIrrigationState] = useState({
    mode: settings.irrigationMode || 'automatic', // 'automatic' | 'manual'
    isActive: false,
    pumpActive: false,
    valveActive: false,
    targetDurationSeconds: 0,
    remainingSeconds: 0,
    lastIrrigationTime: null,
    totalWaterUsedToday: 0.0, // Liters
    triggerType: 'IDLE'
  });

  // 8. Notification & Toast System
  const [notifications, setNotifications] = useState([]);
  const addNotification = useCallback((message, type = 'info', title = 'PANGAN-SENSE') => {
    const id = Date.now() + Math.random().toString();
    const newNotif = { id, message, type, title, time: new Date().toLocaleTimeString('id-ID') };
    setNotifications(prev => [newNotif, ...prev.slice(0, 7)]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Update settings wrapper
  const updateSettings = useCallback((newPartial) => {
    const updated = storageService.saveSettings(newPartial);
    setSettings(updated);
    addNotification('Pengaturan berhasil disimpan.', 'success', 'Konfigurasi');
  }, [addNotification]);

  // Land Management Handlers
  const switchActiveLand = useCallback((landId) => {
    const target = lands.find(l => l.id === landId);
    if (!target) return;
    setActiveLandId(landId);
    const targetPlant = PLANT_PROFILES[target.plantType] || PLANT_PROFILES.cabai;
    const updated = storageService.saveSettings({
      activeLandId: landId,
      plantType: target.plantType,
      soilMoistureThresholdLow: targetPlant.criticalMoisture || 40,
      soilMoistureThresholdHigh: targetPlant.optimalMoisture || 65,
      waterbankCapacityLiters: target.waterbankCapacityLiters || settings.waterbankCapacityLiters
    });
    setSettings(updated);
    addNotification(`Beralih ke lahan: ${target.name} (${target.customCropName || targetPlant.name})`, 'success', 'Lahan Aktif');
  }, [lands, settings.waterbankCapacityLiters, addNotification]);

  const addLand = useCallback((newLandData) => {
    const newId = `lahan-${Date.now()}`;
    const plant = PLANT_PROFILES[newLandData.plantType] || PLANT_PROFILES.padi;
    const landWithDefaults = {
      id: newId,
      name: newLandData.name?.trim() || `Lahan Petak ${lands.length + 1}`,
      areaM2: typeof newLandData.areaM2 === 'number' ? newLandData.areaM2 : (Number(newLandData.areaM2) || 2500),
      areaUnit: newLandData.areaUnit || (newLandData.areaM2 < 1 ? 'cm2' : 'm2'),
      dimensions: newLandData.dimensions || null,
      plantType: newLandData.plantType || 'padi',
      customCropName: newLandData.customCropName?.trim() || plant.name,
      plantingDate: newLandData.plantingDate || new Date().toISOString().split('T')[0],
      soilType: newLandData.soilType || 'lempung',
      coordinates: newLandData.coordinates || settings.liveCoordinates || { lat: -6.8167, lon: 107.6167 },
      locationName: newLandData.locationName || settings.bmkgLocationName || 'Lahan Lapangan',
      waterbankCapacityLiters: Number(newLandData.waterbankCapacityLiters) || 5000,
      notes: newLandData.notes || ''
    };
    const updatedLands = storageService.saveLand(landWithDefaults);
    setLands(updatedLands);
    setActiveLandId(newId);
    storageService.saveSettings({
      activeLandId: newId,
      plantType: landWithDefaults.plantType,
      soilMoistureThresholdLow: plant.criticalMoisture,
      soilMoistureThresholdHigh: plant.optimalMoisture
    });
    addNotification(`Lahan baru "${landWithDefaults.name}" berhasil didaftarkan dan diaktifkan.`, 'success', 'Lahan Ditambahkan');
    return landWithDefaults;
  }, [lands.length, settings.liveCoordinates, settings.bmkgLocationName, addNotification]);

  const updateLand = useCallback((landId, partialData) => {
    const updatedLands = lands.map(l => l.id === landId ? { ...l, ...partialData } : l);
    storageService.saveLands(updatedLands);
    setLands(updatedLands);

    if (landId === activeLandId && partialData.plantType) {
      const plant = PLANT_PROFILES[partialData.plantType] || PLANT_PROFILES.cabai;
      storageService.saveSettings({
        plantType: partialData.plantType,
        soilMoistureThresholdLow: plant.criticalMoisture,
        soilMoistureThresholdHigh: plant.optimalMoisture
      });
      setSettings(prev => ({
        ...prev,
        plantType: partialData.plantType,
        soilMoistureThresholdLow: plant.criticalMoisture,
        soilMoistureThresholdHigh: plant.optimalMoisture
      }));
    }
    addNotification('Data lahan berhasil diperbarui.', 'success', 'Lahan Disimpan');
  }, [lands, activeLandId, addNotification]);

  const deleteLand = useCallback((landId) => {
    if (lands.length <= 1) {
      const freshLand = {
        id: `lahan-${Date.now()}`,
        name: 'Lahan Petak 1 (Baru)',
        areaM2: 2500,
        plantType: 'cabai',
        customCropName: 'Cabai Rawit Merah',
        plantingDate: new Date().toISOString().split('T')[0],
        soilType: 'lempung',
        coordinates: { lat: -6.8167, lon: 107.6167 },
        locationName: 'Lembang, Jawa Barat',
        waterbankCapacityLiters: 5000,
        notes: 'Petak lahan baru siap dikonfigurasi'
      };
      const updated = [freshLand];
      storageService.saveLands(updated);
      setLands(updated);
      setActiveLandId(freshLand.id);
      storageService.saveSettings({ activeLandId: freshLand.id, plantType: freshLand.plantType });
      addNotification('Lahan telah dihapus dan di-reset menjadi petak lahan baru.', 'info', 'Lahan Dihapus & Direset');
      return true;
    }
    const updated = storageService.deleteLand(landId);
    setLands(updated);
    if (activeLandId === landId) {
      const nextActive = updated[0];
      setActiveLandId(nextActive.id);
      storageService.saveSettings({ activeLandId: nextActive.id, plantType: nextActive.plantType });
    }
    addNotification('Lahan berhasil dihapus.', 'info', 'Lahan Dihapus');
    return true;
  }, [lands.length, activeLandId, addNotification]);

  const duplicateLand = useCallback((landId) => {
    const updated = storageService.duplicateLand(landId);
    setLands(updated);
    addNotification('Petak lahan berhasil diduplikasi.', 'success', 'Duplikasi Lahan');
    return true;
  }, [addNotification]);

  const changeCropForActiveLand = useCallback((cropKey, customName = null) => {
    const plant = PLANT_PROFILES[cropKey];
    if (!plant) return;
    const updatedLands = lands.map(l => {
      if (l.id === activeLandId) {
        return {
          ...l,
          plantType: cropKey,
          customCropName: customName || plant.name
        };
      }
      return l;
    });
    storageService.saveLands(updatedLands);
    setLands(updatedLands);
    const updated = storageService.saveSettings({
      plantType: cropKey,
      soilMoistureThresholdLow: plant.criticalMoisture,
      soilMoistureThresholdHigh: plant.optimalMoisture
    });
    setSettings(updated);
    addNotification(`Tanaman lahan diubah ke: ${plant.name}. Ambang batas & AI telah disesuaikan.`, 'success', 'Tanaman Diubah');
  }, [lands, activeLandId, addNotification]);

  // Fetch Weather Forecast (supports Live GPS and BMKG Station)
  const fetchWeather = useCallback(async (currentSettings = settings) => {
    setWeatherLoading(true);
    try {
      const isLiveGps = currentSettings.locationMode === 'live_gps' && currentSettings.liveCoordinates?.lat;
      const data = await weatherService.getWeatherForecast(currentSettings.bmkgLocationId, {
        useLiveGps: isLiveGps,
        coordinates: currentSettings.liveCoordinates,
        locationName: currentSettings.bmkgLocationName
      });
      setWeather(data);
      if (data?.current?.rainfall > 2) {
        addNotification(`Prakiraan Cuaca: Terdeteksi potensi hujan (${data.current.rainfall} mm).`, 'info', 'Kondisi Cuaca');
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, [settings, addNotification]);

  // Live Location Detection via GPS
  const detectLiveLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      addNotification('Mengakses sensor satelit GPS perangkat...', 'info', 'Deteksi GPS');
      const coords = await locationService.getLiveCoordinates();
      const geoInfo = await locationService.reverseGeocode(coords.lat, coords.lon);

      const locName = coords.locationName || geoInfo?.locationName || `GPS (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`;

      const newSettings = storageService.saveSettings({
        locationMode: 'live_gps',
        liveCoordinates: { ...coords, isLive: true },
        bmkgLocationName: locName
      });
      setSettings(newSettings);

      // Attach detected GPS coordinates to the active land
      setLands(prevLands => {
        const next = prevLands.map(l => l.id === activeLandId ? { ...l, coordinates: coords, locationName: locName } : l);
        storageService.saveLands(next);
        return next;
      });

      if (coords.isFallback) {
        addNotification(
          `${coords.note || 'Lokasi terdeteksi via Jaringan IP'} -> ${locName}. Cuaca langsung disinkronkan.`,
          'info',
          'Lokasi Jaringan Terdeteksi'
        );
      } else {
        addNotification(
          `Sinyal Satelit GPS terhubung: ${locName} (Akurasi: ±${coords.accuracy}m). Mengunduh data cuaca langsung...`,
          'success',
          'GPS Satelit Aktif'
        );
      }

      // Fetch live weather immediately for these coordinates
      await fetchWeather(newSettings);
      return coords;
    } catch (err) {
      addNotification(err.message || 'Gagal mendeteksi lokasi GPS.', 'danger', 'Gagal Deteksi GPS');
      return null;
    } finally {
      setIsDetectingLocation(false);
    }
  }, [activeLandId, fetchWeather, addNotification]);

  // Network Online/Offline Listeners
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      addNotification('Koneksi internet pulih. Memulai sinkronisasi Cloud...', 'info', 'Internet Online');
      const syncResult = await supabaseService.syncPendingOfflineData();
      if (syncResult && syncResult.syncedCount > 0) {
        addNotification(`${syncResult.syncedCount} data offline berhasil disinkronkan ke Supabase.`, 'success', 'Cloud Synced');
      }
      setCloudStatus(supabaseService.isCloudAvailable() ? 'SYNCED' : 'NOT SYNCED');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCloudStatus('NOT SYNCED');
      addNotification('Koneksi internet terputus. Mode lokal & BLE tetap aktif.', 'warning', 'Internet Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(), 15 * 60 * 1000); // refresh every 15 mins
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Run AI Prediction on sensor or plant updates
  const runPrediction = useCallback(async (currentSensor = sensorData) => {
    setAiPredicting(true);
    try {
      const result = await predictIrrigation({
        soilMoisture: currentSensor.soilMoisture,
        soilTemperature: currentSensor.soilTemperature,
        airTemperature: currentSensor.airTemperature,
        airHumidity: currentSensor.airHumidity,
        rainfall: currentSensor.rainfall,
        lightIntensity: currentSensor.lightIntensity,
        waterLevel: currentSensor.waterLevel,
        plantType: settings.plantType,
        forecastRainfall: weather?.current?.rainfall || 0,
        historicalWaterUsage: waterbank.averageDailyUsageLiters
      });
      setAiPrediction(result);
      await supabaseService.saveAiPrediction(result);
    } catch (err) {
      console.warn('Prediction run error:', err);
    } finally {
      setAiPredicting(false);
    }
  }, [sensorData, settings.plantType, weather, waterbank.averageDailyUsageLiters]);

  // Run initial prediction once weather is loaded
  useEffect(() => {
    if (weather) {
      runPrediction();
    }
  }, [weather, settings.plantType]);

  // Handle Incoming Sensor Telemetry (either from BLE or Demo Simulator)
  const processIncomingTelemetry = useCallback((telemetry) => {
    if (!telemetry) return;

    // Handle heartbeat/status packets (e.g. {"status":"online"})
    if (telemetry.isStatusPacket) {
      console.info('[BLE] ESP32 status / heartbeat confirmed:', telemetry);
      setBluetoothStatus(BLE_STATUS.CONNECTED);
      setConnectedDeviceName(bleManager.getDeviceName() || 'ESP32 (Online)');
      return;
    }

    setSensorData(prev => {
      const updated = { ...prev, ...telemetry, timestamp: new Date().toISOString() };

      // Update Waterbank calculations
      const currentVol = Math.round((updated.waterLevel / 100) * settings.waterbankCapacityLiters);
      const remainingDays = Math.max(1, Math.round(currentVol / Math.max(10, waterbank.averageDailyUsageLiters)));
      setWaterbank(wb => ({
        ...wb,
        percentage: updated.waterLevel,
        currentVolumeLiters: currentVol,
        remainingDays
      }));

      // Check critical alerts
      if (updated.soilMoisture < settings.soilMoistureThresholdLow) {
        addNotification(`Peringatan: Kelembapan tanah rendah (${updated.soilMoisture}%). Tanaman membutuhkan air.`, 'warning', 'Tanah Terlalu Kering');
      }
      if (updated.waterLevel < 15) {
        addNotification(`Peringatan: Level Waterbank rendah (${updated.waterLevel}%). Harap isi ulang tandon.`, 'danger', 'Waterbank Rendah');
      }

      // Add to ring buffer history every few ticks
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTelemetryHistory(history => {
        const next = [...history, {
          time: nowStr,
          soilMoisture: updated.soilMoisture,
          soilTemperature: updated.soilTemperature,
          airTemperature: updated.airTemperature,
          airHumidity: updated.airHumidity,
          rainfall: updated.rainfall,
          waterLevel: updated.waterLevel
        }];
        return next.length > 25 ? next.slice(-25) : next;
      });

      // Save to Supabase / Local storage
      supabaseService.saveSensorReading(updated);

      return updated;
    });
  }, [settings.waterbankCapacityLiters, settings.soilMoistureThresholdLow, waterbank.averageDailyUsageLiters, addNotification]);

  // Bluetooth Manager Subscriptions
  useEffect(() => {
    const unsubStatus = (status) => {
      setBluetoothStatus(status);
      setConnectedDeviceName(bleManager.getDeviceName());
      if (status === BLE_STATUS.CONNECTED) {
        if (bleManager.isVirtualDevice()) {
          addNotification('Gateway ESP32 Virtual aktif (Izin Bluetooth fisik dibatasi oleh izin iframe). Streaming telemetri & perintah pompa siap beroperasi.', 'success', 'ESP32 Virtual Aktif');
        } else {
          addNotification('ESP32 PANGAN-SENSE berhasil terhubung via Bluetooth BLE.', 'success', 'Bluetooth Terhubung');
        }
      } else if (status === BLE_STATUS.DISCONNECTED) {
        setConnectedDeviceName(null);
        addNotification('Koneksi Bluetooth dengan ESP32 terputus.', 'warning', 'Bluetooth Terputus');
      }
    };
    const unsub = bleManager.onStatusChange(unsubStatus);

    const unsubData = bleManager.onDataReceived((data) => {
      processIncomingTelemetry(data);
    });

    const unsubError = bleManager.onError((errorMsg) => {
      addNotification(errorMsg, 'warning', 'Info Bluetooth');
    });

    return () => {
      unsub();
      unsubData();
      unsubError();
    };
  }, [processIncomingTelemetry, addNotification]);

  // Active Irrigation Timer Countdown Effect
  useEffect(() => {
    let timer = null;
    if (irrigationState.isActive && irrigationState.remainingSeconds > 0) {
      timer = setInterval(() => {
        setIrrigationState(prev => {
          if (prev.remainingSeconds <= 1) {
            // Finished
            addNotification('Siklus irigasi selesai sesuai durasi yang ditentukan.', 'success', 'Irigasi Selesai');
            return {
              ...prev,
              isActive: false,
              pumpActive: false,
              valveActive: false,
              remainingSeconds: 0,
              totalWaterUsedToday: prev.totalWaterUsedToday + 12.5,
              lastIrrigationTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
          }
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
            totalWaterUsedToday: prev.totalWaterUsedToday + 0.05
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [irrigationState.isActive, irrigationState.remainingSeconds, addNotification]);

  // Demo Simulator Interval (when ESP32 is NOT connected and Demo Mode is ON)
  useEffect(() => {
    if (bluetoothStatus === BLE_STATUS.CONNECTED || !settings.demoMode) {
      return;
    }

    const interval = setInterval(() => {
      setSensorData(prev => {
        // Natural fluctuations
        let nextMoisture = prev.soilMoisture;
        let nextWaterLevel = prev.waterLevel;
        let nextRainfall = prev.rainfall;

        // If pump is active, moisture goes up and waterbank goes down!
        if (irrigationState.isActive) {
          nextMoisture = Math.min(100, nextMoisture + 0.35);
          nextWaterLevel = Math.max(0, nextWaterLevel - 0.12);
        } else {
          // Natural drying
          nextMoisture = Math.max(25, nextMoisture - 0.06);
        }

        // Random subtle temperature & humidity jitter
        const tempJitter = (Math.random() - 0.5) * 0.2;
        const humJitter = (Math.random() - 0.5) * 0.4;

        const simulated = {
          soilMoisture: Number(nextMoisture.toFixed(1)),
          soilTemperature: Number(Math.max(20, Math.min(36, prev.soilTemperature + tempJitter)).toFixed(1)),
          airTemperature: Number(Math.max(22, Math.min(38, prev.airTemperature + tempJitter)).toFixed(1)),
          airHumidity: Number(Math.max(30, Math.min(95, prev.airHumidity + humJitter)).toFixed(1)),
          rainfall: nextRainfall,
          lightIntensity: Math.round(15000 + Math.random() * 4000),
          waterLevel: Number(nextWaterLevel.toFixed(1)),
          pump: irrigationState.isActive,
          valve: irrigationState.isActive,
          timestamp: new Date().toISOString()
        };

        const currentVol = Math.round((simulated.waterLevel / 100) * settings.waterbankCapacityLiters);
        setWaterbank(wb => ({
          ...wb,
          percentage: simulated.waterLevel,
          currentVolumeLiters: currentVol,
          consumptionLpm: irrigationState.isActive ? 4.5 : 0.0
        }));

        // History recording every ~10s
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTelemetryHistory(hist => {
          const next = [...hist, {
            time: nowStr,
            soilMoisture: simulated.soilMoisture,
            soilTemperature: simulated.soilTemperature,
            airTemperature: simulated.airTemperature,
            airHumidity: simulated.airHumidity,
            rainfall: simulated.rainfall,
            waterLevel: simulated.waterLevel
          }];
          return next.length > 25 ? next.slice(-25) : next;
        });

        return simulated;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [bluetoothStatus, settings.demoMode, irrigationState.isActive, settings.waterbankCapacityLiters]);

  // Actuator Control Handlers
  const triggerIrrigation = async (pump = true, valve = true, durationSeconds = 600, triggerType = 'MANUAL') => {
    // Non-blocking waterbank check: Informative warning only if waterlevel sensor is active and low
    if (sensorData.timestamp && sensorData.waterLevel > 0 && sensorData.waterLevel < 10) {
      addNotification('Perhatian: Level Waterbank terdeteksi rendah (< 10%). Pastikan pasokan air tersedia.', 'warning', 'Peringatan Tandon');
    }

    try {
      if (bluetoothStatus === BLE_STATUS.CONNECTED) {
        const cmd = buildIrrigationCommand(pump, valve, durationSeconds);
        await bleManager.sendCommand(cmd);
      }

      setIrrigationState({
        mode: settings.irrigationMode,
        isActive: true,
        pumpActive: pump,
        valveActive: valve,
        targetDurationSeconds: durationSeconds,
        remainingSeconds: durationSeconds,
        lastIrrigationTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        totalWaterUsedToday: irrigationState.totalWaterUsedToday,
        triggerType
      });

      addNotification(`Irigasi dimulai (${Math.round(durationSeconds / 60)} menit). Pompa & Solenoid aktif.`, 'success', 'Irigasi Dimulai');

      await supabaseService.saveIrrigationLog({
        mode: settings.irrigationMode,
        triggerType,
        durationSeconds,
        waterUsedLiters: Number(((durationSeconds / 60) * 4.5).toFixed(1)),
        status: 'RUNNING',
        startedAt: new Date().toISOString()
      });

      storageService.addIrrigationLog({
        duration: `${Math.round(durationSeconds / 60)} Menit`,
        waterUsed: `${((durationSeconds / 60) * 4.5).toFixed(1)} L`,
        trigger: triggerType === 'AI_RECOMMENDATION' ? 'Rekomendasi Edge AI' : triggerType === 'MANUAL_USER' ? 'Manual Pengguna' : 'Otomatis',
        status: 'Selesai'
      });

      return true;
    } catch (err) {
      addNotification('Gagal mengaktifkan irigasi: ' + err.message, 'danger', 'Kesalahan Kontrol');
      return false;
    }
  };

  const emergencyStop = async () => {
    try {
      if (bluetoothStatus === BLE_STATUS.CONNECTED) {
        const cmd = buildEmergencyStopCommand();
        await bleManager.sendCommand(cmd);
      }
    } catch (e) {
      console.warn('BLE emergency stop error:', e);
    }

    setIrrigationState(prev => ({
      ...prev,
      isActive: false,
      pumpActive: false,
      valveActive: false,
      remainingSeconds: 0
    }));

    setSensorData(prev => ({ ...prev, pump: false, valve: false }));

    addNotification('EMERGENCY STOP DIAKTIFKAN: Semua pompa dan solenoid dimatikan seketika.', 'danger', 'Emergency Stop');

    await supabaseService.saveIrrigationLog({
      mode: settings.irrigationMode,
      triggerType: 'EMERGENCY_STOP',
      durationSeconds: 0,
      waterUsedLiters: 0,
      status: 'ABORTED_FAILSAFE',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });
  };

  const togglePumpManual = async (state) => {
    if (state && sensorData.timestamp && sensorData.waterLevel > 0 && sensorData.waterLevel < 10) {
      addNotification('Perhatian: Level Waterbank terdeteksi rendah (<10%).', 'warning', 'Peringatan Tandon');
    }
    if (bluetoothStatus === BLE_STATUS.CONNECTED) {
      await bleManager.sendCommand(buildPumpCommand(state));
    }
    setIrrigationState(prev => ({ ...prev, pumpActive: state, isActive: state || prev.valveActive }));
    setSensorData(prev => ({ ...prev, pump: state, timestamp: prev.timestamp || new Date().toISOString() }));
    addNotification(`Pompa air ${state ? 'DINYALAKAN' : 'DIMATIKAN'}.`, state ? 'success' : 'info', 'Kontrol Pompa');
  };

  const toggleValveManual = async (state) => {
    if (bluetoothStatus === BLE_STATUS.CONNECTED) {
      await bleManager.sendCommand(buildValveCommand(state));
    }
    setIrrigationState(prev => ({ ...prev, valveActive: state, isActive: state || prev.pumpActive }));
    setSensorData(prev => ({ ...prev, valve: state, timestamp: prev.timestamp || new Date().toISOString() }));
    addNotification(`Solenoid valve ${state ? 'DIBUKA' : 'DITUTUP'}.`, state ? 'success' : 'info', 'Kontrol Valve');
  };

  // Refill Waterbank (interactive real tank level update)
  const refillWaterbank = useCallback((amountLiters = null) => {
    const capacity = settings.waterbankCapacityLiters || 5000;
    let newVolume = capacity;
    if (amountLiters && typeof amountLiters === 'number') {
      newVolume = Math.min(capacity, (waterbank.currentVolumeLiters || 0) + amountLiters);
    }
    const newPercentage = Number(((newVolume / capacity) * 100).toFixed(1));
    setWaterbank(prev => ({
      ...prev,
      currentVolumeLiters: newVolume,
      percentage: newPercentage,
      remainingDays: Math.max(1, Math.round(newVolume / Math.max(10, prev.averageDailyUsageLiters)))
    }));
    setSensorData(prev => ({
      ...prev,
      waterLevel: newPercentage
    }));
    storageService.addWaterbankLog({
      event: amountLiters ? `Pengisian Pasokan (+${amountLiters}L)` : 'Pengisian Penuh Tandon (100%)',
      volume: `+${amountLiters || capacity} L`,
      currentLevel: `${newPercentage}%`,
      note: 'Pengisian via sistem pompa / manual waterbank'
    });
    addNotification(
      amountLiters ? `Tandon air ditambah ${amountLiters} L (Level: ${newPercentage}%).` : 'Tandon Waterbank berhasil diisi ulang hingga 100%.',
      'success',
      'Tandon Terisi'
    );
  }, [settings.waterbankCapacityLiters, waterbank.currentVolumeLiters, waterbank.averageDailyUsageLiters, addNotification]);

  // Direct sensor simulation (used in Demo mode to test AI & alerts)
  const simulateSensorChange = useCallback((partialSensors) => {
    setSensorData(prev => {
      const updated = { ...prev, ...partialSensors };
      if (partialSensors.waterLevel !== undefined) {
        const capacity = settings.waterbankCapacityLiters || 5000;
        const vol = Math.round((partialSensors.waterLevel / 100) * capacity);
        setWaterbank(wb => ({
          ...wb,
          currentVolumeLiters: vol,
          percentage: partialSensors.waterLevel,
          remainingDays: Math.max(1, Math.round(vol / Math.max(10, wb.averageDailyUsageLiters)))
        }));
      }
      return updated;
    });
  }, [settings.waterbankCapacityLiters]);

  // Connect BLE helper
  const connectBluetooth = async (options = {}) => {
    try {
      const res = await bleManager.connect(options);
      if (res && res.deviceName) {
        setConnectedDeviceName(res.deviceName);
      }
      return res;
    } catch (err) {
      console.warn('[BLE] connectBluetooth failed:', err);
      throw err;
    }
  };

  const disconnectBluetooth = async () => {
    await bleManager.disconnect();
    setConnectedDeviceName(null);
  };

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      lands,
      activeLandId,
      activeLand,
      switchActiveLand,
      addLand,
      updateLand,
      deleteLand,
      duplicateLand,
      changeCropForActiveLand,
      detectLiveLocation,
      isDetectingLocation,
      bluetoothStatus,
      connectedDeviceName,
      bleManager,
      bluetoothModalOpen,
      setBluetoothModalOpen,
      isBluetoothModalOpen: bluetoothModalOpen,
      openBluetoothModal: () => setBluetoothModalOpen(true),
      closeBluetoothModal: () => setBluetoothModalOpen(false),
      isBluetoothSupported: bleManager.isSupported(),
      isPolicyDisallowed: bleManager.isPolicyDisallowed(),
      isInsideIframe: bleManager.isInsideIframe(),
      isVirtualBle: bleManager.isVirtualDevice(),
      isOnline,
      cloudStatus,
      connectBluetooth,
      disconnectBluetooth,
      sensorData,
      telemetryHistory,
      waterbank,
      refillWaterbank,
      simulateSensorChange,
      weather,
      weatherLoading,
      fetchWeather,
      aiPrediction,
      aiPredicting,
      runPrediction,
      irrigationState,
      triggerIrrigation,
      emergencyStop,
      togglePumpManual,
      toggleValveManual,
      notifications,
      addNotification,
      removeNotification,
      plantProfiles: PLANT_PROFILES,
      currentPlant
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
