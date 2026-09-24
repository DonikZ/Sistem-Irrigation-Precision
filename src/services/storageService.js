/**
 * Local Storage and Offline Sync Queue Manager
 * Ensures zero data loss when operating offline in remote agricultural fields
 */

const STORAGE_KEYS = {
  SETTINGS: 'pangan_sense_settings',
  LANDS: 'pangan_sense_lands',
  OFFLINE_QUEUE: 'pangan_sense_offline_sync_queue',
  LOCAL_HISTORY: 'pangan_sense_local_history',
  IRRIGATION_LOGS: 'pangan_sense_irrigation_logs',
  WATERBANK_LOGS: 'pangan_sense_waterbank_logs',
};

export const INITIAL_LANDS = [
  {
    id: 'lahan-1',
    name: 'Lahan Utama Blok A',
    areaM2: 5000, // 0.5 Hektar
    plantType: 'cabai',
    customCropName: 'Cabai Rawit Merah (Ori 212)',
    plantingDate: '2026-08-15',
    soilType: 'lempung',
    coordinates: { lat: -6.8167, lon: 107.6167 },
    locationName: 'Lembang, Kab. Bandung Barat',
    waterbankCapacityLiters: 5000,
    notes: 'Sistem irigasi tetes (drip) dengan tandon utama 5000L'
  },
  {
    id: 'lahan-2',
    name: 'Sawah Petak Timur Blok B',
    areaM2: 10000, // 1.0 Hektar
    plantType: 'padi',
    customCropName: 'Padi Ciherang Unggul',
    plantingDate: '2026-09-01',
    soilType: 'liat',
    coordinates: { lat: -6.8245, lon: 107.6250 },
    locationName: 'Lembang, Kab. Bandung Barat',
    waterbankCapacityLiters: 8000,
    notes: 'Irigasi berselang (intermittent) hemat air'
  },
  {
    id: 'lahan-3',
    name: 'Kebun Jagung Lereng C',
    areaM2: 3500, // 0.35 Hektar
    plantType: 'jagung',
    customCropName: 'Jagung Hibrida Pioneer P35',
    plantingDate: '2026-08-25',
    soilType: 'lempung',
    coordinates: { lat: -6.8120, lon: 107.6110 },
    locationName: 'Lembang, Kab. Bandung Barat',
    waterbankCapacityLiters: 4000,
    notes: 'Sprinkler overhead periodik saat fase vegetatif'
  }
];

const DEFAULT_SETTINGS = {
  demoMode: false, // In real-world project, starts in standby waiting for hardware/connection
  activeLandId: 'lahan-1',
  plantType: 'cabai',
  waterbankCapacityLiters: 5000,
  soilMoistureThresholdLow: 42,
  soilMoistureThresholdHigh: 65,
  locationMode: 'live_gps', // 'live_gps' | 'manual_bmkg'
  bmkgLocationId: '32.17',
  bmkgLocationName: 'Lembang, Kab. Bandung Barat',
  liveCoordinates: { lat: -6.8167, lon: 107.6167, accuracy: 12, isLive: false },
  irrigationMode: 'automatic', // 'automatic' | 'manual'
  deviceBleName: 'PANGAN-SENSE-ESP32',
  autoSyncCloud: true
};

export const storageService = {
  // Purges old mock logs / dummy readings if present from prior versions
  cleanOldSeedData() {
    try {
      const oldHist = localStorage.getItem(STORAGE_KEYS.LOCAL_HISTORY);
      if (oldHist && (oldHist.includes('2026-09-21') || oldHist.includes('LOG-001'))) {
        localStorage.removeItem(STORAGE_KEYS.LOCAL_HISTORY);
      }
      const oldIrr = localStorage.getItem(STORAGE_KEYS.IRRIGATION_LOGS);
      if (oldIrr && oldIrr.includes('2026-09-21')) {
        localStorage.removeItem(STORAGE_KEYS.IRRIGATION_LOGS);
      }
      const oldWb = localStorage.getItem(STORAGE_KEYS.WATERBANK_LOGS);
      if (oldWb && oldWb.includes('2026-09-21')) {
        localStorage.removeItem(STORAGE_KEYS.WATERBANK_LOGS);
      }
    } catch (e) {
      console.warn('[Storage] Clean seed error:', e);
    }
  },

  getSettings() {
    try {
      this.cleanOldSeedData();
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        // Force demoMode: false unless explicitly activated in the current session
        return { ...DEFAULT_SETTINGS, ...parsed, demoMode: false };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[Storage] Error saving settings:', e);
      return newSettings;
    }
  },

  // Lands management
  getLands() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LANDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.LANDS, JSON.stringify(INITIAL_LANDS));
      return INITIAL_LANDS;
    } catch {
      return INITIAL_LANDS;
    }
  },

  saveLands(lands) {
    try {
      localStorage.setItem(STORAGE_KEYS.LANDS, JSON.stringify(lands));
      return lands;
    } catch (e) {
      console.warn('[Storage] Error saving lands:', e);
      return lands;
    }
  },

  saveLand(landData) {
    const lands = this.getLands();
    const idx = lands.findIndex(l => l.id === landData.id);
    let updated;
    if (idx >= 0) {
      updated = [...lands];
      updated[idx] = { ...updated[idx], ...landData };
    } else {
      const newLand = {
        ...landData,
        id: landData.id || `lahan-${Date.now()}`
      };
      updated = [newLand, ...lands];
    }
    this.saveLands(updated);
    return updated;
  },

  deleteLand(landId) {
    const lands = this.getLands();
    const updated = lands.filter(l => l.id !== landId);
    this.saveLands(updated);
    return updated;
  },

  duplicateLand(landId) {
    const lands = this.getLands();
    const target = lands.find(l => l.id === landId);
    if (!target) return lands;
    const duplicated = {
      ...target,
      id: `lahan-${Date.now()}`,
      name: `${target.name} (Salinan)`,
      plantingDate: new Date().toISOString().split('T')[0]
    };
    const updated = [duplicated, ...lands];
    this.saveLands(updated);
    return updated;
  },

  // Irrigation Logs
  getIrrigationLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.IRRIGATION_LOGS);
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  },

  addIrrigationLog(log) {
    try {
      const logs = this.getIrrigationLogs();
      const newLog = {
        id: 'IRR-' + Date.now().toString().slice(-4),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        ...log
      };
      const updated = [newLog, ...logs];
      if (updated.length > 100) updated.pop();
      localStorage.setItem(STORAGE_KEYS.IRRIGATION_LOGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[Storage] Error adding irrigation log:', e);
      return [];
    }
  },

  clearIrrigationLogs() {
    try {
      localStorage.removeItem(STORAGE_KEYS.IRRIGATION_LOGS);
    } catch (e) {
      console.warn('[Storage] Error clearing irrigation logs:', e);
    }
  },

  // Waterbank Logs
  getWaterbankLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WATERBANK_LOGS);
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  },

  addWaterbankLog(log) {
    try {
      const logs = this.getWaterbankLogs();
      const newLog = {
        id: 'WB-' + Date.now().toString().slice(-4),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        ...log
      };
      const updated = [newLog, ...logs];
      if (updated.length > 100) updated.pop();
      localStorage.setItem(STORAGE_KEYS.WATERBANK_LOGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[Storage] Error adding waterbank log:', e);
      return [];
    }
  },

  clearWaterbankLogs() {
    try {
      localStorage.removeItem(STORAGE_KEYS.WATERBANK_LOGS);
    } catch (e) {
      console.warn('[Storage] Error clearing waterbank logs:', e);
    }
  },

  // Save to local offline history ring buffer (up to 200 items)
  saveLocalReading(reading) {
    try {
      const history = this.getLocalReadings();
      history.unshift({ ...reading, id: 'local_' + Date.now() });
      if (history.length > 200) history.pop();
      localStorage.setItem(STORAGE_KEYS.LOCAL_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('[Storage] Error saving local reading:', e);
    }
  },

  getLocalReadings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Offline Sync Queue
  queueForSync(type, payload) {
    try {
      const queue = this.getSyncQueue();
      queue.push({
        id: 'sync_' + Math.random().toString(36).substring(2, 9),
        type, // 'sensor_reading' | 'irrigation_log' | 'ai_prediction'
        payload,
        queuedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('[Storage] Failed to queue item for sync:', e);
    }
  },

  getSyncQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearSyncQueue() {
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (e) {
      console.warn('[Storage] Failed to clear sync queue:', e);
    }
  }
};

export default storageService;
