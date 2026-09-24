-- ========================================================
-- PANGAN-SENSE Precision Irrigation PostgreSQL Database Schema
-- Supabase Schema for Devices, Sensors, Irrigation, AI & Weather
-- ========================================================

-- 1. Plants Reference Table
CREATE TABLE IF NOT EXISTS public.plants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(100),
    optimal_moisture_min NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    optimal_moisture_max NUMERIC(5, 2) NOT NULL DEFAULT 70.0,
    critical_moisture NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    crop_coefficient_kc NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    max_irrigation_duration_sec INT NOT NULL DEFAULT 1200,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial plant varieties
INSERT INTO public.plants (id, name, scientific_name, optimal_moisture_min, optimal_moisture_max, critical_moisture, crop_coefficient_kc, max_irrigation_duration_sec)
VALUES 
    ('cabai', 'Cabai Merah', 'Capsicum annuum', 55.0, 70.0, 42.0, 0.95, 900),
    ('padi', 'Padi Sawah', 'Oryza sativa', 70.0, 85.0, 55.0, 1.15, 1800),
    ('jagung', 'Jagung Palawija', 'Zea mays', 50.0, 65.0, 38.0, 0.85, 1200),
    ('tomat', 'Tomat', 'Solanum lycopersicum', 60.0, 75.0, 45.0, 1.05, 900),
    ('bawang', 'Bawang Merah', 'Allium cepa', 55.0, 68.0, 40.0, 0.90, 800),
    ('kentang', 'Kentang', 'Solanum tuberosum', 65.0, 78.0, 50.0, 1.10, 1200)
ON CONFLICT (id) DO NOTHING;

-- 2. IoT Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ble_mac_address VARCHAR(50),
    hardware_version VARCHAR(50) DEFAULT 'ESP32-WROOM-32',
    firmware_version VARCHAR(50) DEFAULT 'v1.4.2-BLE',
    assigned_plant_id VARCHAR(50) REFERENCES public.plants(id),
    waterbank_capacity_liters NUMERIC(8, 2) DEFAULT 5000.0,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'ACTIVE'
);

INSERT INTO public.devices (id, name, hardware_version, firmware_version, assigned_plant_id)
VALUES ('esp32_device_01', 'PANGAN-SENSE Field Node #01', 'ESP32-WROOM-32', 'v1.4.2-BLE', 'cabai')
ON CONFLICT (id) DO NOTHING;

-- 3. Sensor Readings Table (Timescale / Realtime)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) REFERENCES public.devices(id),
    soil_moisture NUMERIC(5, 2) NOT NULL,
    soil_temperature NUMERIC(5, 2) NOT NULL,
    air_temperature NUMERIC(5, 2) NOT NULL,
    air_humidity NUMERIC(5, 2) NOT NULL,
    rainfall NUMERIC(6, 2) DEFAULT 0.0,
    light_intensity INT DEFAULT 0,
    water_level NUMERIC(5, 2) NOT NULL,
    pump_state BOOLEAN DEFAULT FALSE,
    valve_state BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time 
ON public.sensor_readings (device_id, created_at DESC);

-- 4. Irrigation Execution Logs
CREATE TABLE IF NOT EXISTS public.irrigation_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) REFERENCES public.devices(id),
    mode VARCHAR(20) NOT NULL DEFAULT 'MANUAL', -- 'AUTOMATIC' or 'MANUAL'
    trigger_type VARCHAR(30) DEFAULT 'USER',    -- 'AI_RECOMMENDATION', 'SCHEDULE', 'USER', 'EMERGENCY_STOP'
    duration_seconds INT NOT NULL,
    water_used_liters NUMERIC(7, 2) DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'COMPLETED',     -- 'RUNNING', 'COMPLETED', 'ABORTED_FAILSAFE'
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_irrigation_logs_time 
ON public.irrigation_logs (started_at DESC);

-- 5. AI Predictions Table
CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) REFERENCES public.devices(id),
    plant_type VARCHAR(50) DEFAULT 'cabai',
    predicted_water_req NUMERIC(6, 2) NOT NULL,
    predicted_duration_sec INT NOT NULL,
    predicted_waterbank_days INT NOT NULL,
    recommendation TEXT NOT NULL,
    confidence NUMERIC(5, 2) DEFAULT 88.0,
    model_version VARCHAR(100) DEFAULT 'TFJS_LOCAL_EDGE_V1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Weather Forecast Cache Table
CREATE TABLE IF NOT EXISTS public.weather_data (
    id BIGSERIAL PRIMARY KEY,
    adm4_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    current_temp NUMERIC(5, 2),
    current_humidity NUMERIC(5, 2),
    current_weather_desc VARCHAR(100),
    forecast_rain_next_24h NUMERIC(6, 2) DEFAULT 0.0,
    raw_bmkg_payload JSONB,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) configuration for client anon read/insert
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write policies for IoT edge node telemetry
CREATE POLICY "Allow public read access on plants" ON public.plants FOR SELECT USING (true);
CREATE POLICY "Allow public read access on devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sensor_readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on sensor_readings" ON public.sensor_readings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on irrigation_logs" ON public.irrigation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on irrigation_logs" ON public.irrigation_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_predictions" ON public.ai_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on ai_predictions" ON public.ai_predictions FOR SELECT USING (true);
