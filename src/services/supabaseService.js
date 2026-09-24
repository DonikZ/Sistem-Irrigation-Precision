/**
 * Supabase Repository & Service Layer for PANGAN-SENSE
 * Coordinates Cloud Sync, Telemetry Archival, and Fallback Handling
 */
import { createClient } from '@supabase/supabase-js';
import { storageService } from './storageService.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

    if (this.isConfigured) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false }
        });
        console.log('[Supabase Service] Initialized successfully with Cloud Endpoint.');
      } catch (err) {
        console.warn('[Supabase Service] Initialization error:', err);
        this.client = null;
        this.isConfigured = false;
      }
    } else {
      console.log('[Supabase Service] Running in Local Offline/Demo mode (VITE_SUPABASE_URL not configured).');
    }
  }

  isCloudAvailable() {
    return this.isConfigured && (typeof navigator === 'undefined' || navigator.onLine);
  }

  /**
   * Save a single sensor reading
   */
  async saveSensorReading(reading) {
    storageService.saveLocalReading(reading);

    if (!this.isCloudAvailable()) {
      storageService.queueForSync('sensor_reading', reading);
      return { success: true, localOnly: true };
    }

    try {
      const { data, error } = await this.client
        .from('sensor_readings')
        .insert([{
          device_id: reading.deviceId || 'esp32_device_01',
          soil_moisture: reading.soilMoisture,
          soil_temperature: reading.soilTemperature,
          air_temperature: reading.airTemperature,
          air_humidity: reading.airHumidity,
          rainfall: reading.rainfall,
          light_intensity: reading.lightIntensity,
          water_level: reading.waterLevel,
          pump_state: reading.pump,
          valve_state: reading.valve,
          created_at: reading.timestamp || new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('[Supabase] Failed to write sensor reading to cloud, queuing locally:', err);
      storageService.queueForSync('sensor_reading', reading);
      return { success: false, error: err.message, localOnly: true };
    }
  }

  /**
   * Fetch sensor readings with filtering
   */
  async getSensorReadings(limit = 50) {
    if (!this.isCloudAvailable()) {
      return storageService.getLocalReadings().slice(0, limit);
    }

    try {
      const { data, error } = await this.client
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data && data.length > 0 ? data : storageService.getLocalReadings().slice(0, limit);
    } catch (err) {
      console.warn('[Supabase] Read error, falling back to local history:', err);
      return storageService.getLocalReadings().slice(0, limit);
    }
  }

  /**
   * Save irrigation execution log
   */
  async saveIrrigationLog(log) {
    if (!this.isCloudAvailable()) {
      storageService.queueForSync('irrigation_log', log);
      return { success: true, localOnly: true };
    }

    try {
      const { data, error } = await this.client
        .from('irrigation_logs')
        .insert([{
          device_id: log.deviceId || 'esp32_device_01',
          mode: log.mode || 'manual',
          trigger_type: log.triggerType || 'user',
          duration_seconds: log.durationSeconds,
          water_used_liters: log.waterUsedLiters,
          status: log.status || 'COMPLETED',
          started_at: log.startedAt,
          completed_at: log.completedAt
        }]);

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('[Supabase] Irrigation log sync failed:', err);
      storageService.queueForSync('irrigation_log', log);
      return { success: false, localOnly: true };
    }
  }

  /**
   * Save AI prediction outcome
   */
  async saveAiPrediction(prediction) {
    if (!this.isCloudAvailable()) {
      storageService.queueForSync('ai_prediction', prediction);
      return { success: true, localOnly: true };
    }

    try {
      const { data, error } = await this.client
        .from('ai_predictions')
        .insert([{
          device_id: 'esp32_device_01',
          plant_type: prediction.plantType || 'cabai',
          predicted_water_req: prediction.predictedWaterRequirement,
          predicted_duration_sec: prediction.predictedIrrigationDuration,
          predicted_waterbank_days: prediction.predictedWaterbankDays,
          recommendation: prediction.irrigationRecommendation,
          confidence: prediction.confidence,
          model_version: prediction.modelStatus,
          created_at: prediction.lastPrediction || new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      storageService.queueForSync('ai_prediction', prediction);
      return { success: false, localOnly: true };
    }
  }

  /**
   * Synchronize queued offline records to cloud database
   */
  async syncPendingOfflineData() {
    if (!this.isCloudAvailable()) {
      return { syncedCount: 0, reason: 'Cloud or internet unavailable' };
    }

    const queue = storageService.getSyncQueue();
    if (queue.length === 0) {
      return { syncedCount: 0 };
    }

    let successCount = 0;
    try {
      for (const item of queue) {
        if (item.type === 'sensor_reading') {
          await this.client.from('sensor_readings').insert([{
            device_id: item.payload.deviceId || 'esp32_device_01',
            soil_moisture: item.payload.soilMoisture,
            soil_temperature: item.payload.soilTemperature,
            air_temperature: item.payload.airTemperature,
            air_humidity: item.payload.airHumidity,
            rainfall: item.payload.rainfall,
            light_intensity: item.payload.lightIntensity,
            water_level: item.payload.waterLevel,
            pump_state: item.payload.pump,
            valve_state: item.payload.valve,
            created_at: item.payload.timestamp
          }]);
          successCount++;
        }
      }
      storageService.clearSyncQueue();
      return { syncedCount: successCount };
    } catch (err) {
      console.warn('[Supabase Sync] Sync partially aborted:', err);
      return { syncedCount: successCount, error: err.message };
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;
