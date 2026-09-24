/**
 * BLE Telemetry Parser and Validator for ESP32
 * Handles streaming chunks, JSON extraction, and bounds checking
 */

let rxBuffer = '';

/**
 * Validates and sanitizes sensor reading values within realistic agronomic bounds
 * Supports both full keys and short keys (e.g., sm, st, at, ah, rf, wl, lux, p, v)
 * Also detects device status / heartbeat packets (e.g. {"status":"online"})
 * @param {Object} rawData 
 * @returns {Object|null} Sanitized sensor data or status packet
 */
export function validateSensorData(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }

  // 1. Detect Status / Heartbeat packet (e.g. {"status":"online"})
  if (rawData.status !== undefined || rawData.state !== undefined || rawData.msg !== undefined || rawData.event !== undefined) {
    const statusVal = String(rawData.status ?? rawData.state ?? rawData.msg ?? rawData.event).toLowerCase();
    if (statusVal.includes('online') || statusVal.includes('connect') || statusVal.includes('ready') || statusVal.includes('alive')) {
      return {
        isStatusPacket: true,
        deviceStatus: rawData.status || rawData.state || 'online',
        timestamp: new Date().toISOString()
      };
    }
  }

  // 2. Extract values supporting multiple naming conventions (short, camelCase, snake_case)
  const rawMoisture = rawData.sm ?? rawData.soilMoisture ?? rawData.soil_moisture ?? rawData.moisture ?? rawData.kelembapan;
  const rawSoilTemp = rawData.st ?? rawData.soilTemperature ?? rawData.soil_temp ?? rawData.soil_t ?? rawData.suhu_tanah;
  const rawAirTemp = rawData.at ?? rawData.airTemperature ?? rawData.air_temp ?? rawData.temp ?? rawData.suhu;
  const rawAirHumidity = rawData.ah ?? rawData.airHumidity ?? rawData.air_humidity ?? rawData.humidity ?? rawData.hum;
  const rawRainfall = rawData.rf ?? rawData.rainfall ?? rawData.rain ?? rawData.hujan;
  const rawLight = rawData.lux ?? rawData.lightIntensity ?? rawData.light;
  const rawWaterLevel = rawData.wl ?? rawData.waterLevel ?? rawData.water_level ?? rawData.tandon ?? rawData.level;
  const rawPump = rawData.p ?? rawData.pump ?? rawData.pompa;
  const rawValve = rawData.v ?? rawData.valve ?? rawData.kran ?? rawData.solenoid;

  // Check if at least one recognizable field exists
  const hasValidFields = [
    rawMoisture, rawSoilTemp, rawAirTemp, rawAirHumidity,
    rawRainfall, rawLight, rawWaterLevel, rawPump, rawValve
  ].some(v => v !== undefined);

  if (!hasValidFields) {
    // If it's another non-empty object, treat as status acknowledgement
    return {
      isStatusPacket: true,
      raw: rawData,
      timestamp: new Date().toISOString()
    };
  }

  const result = {
    isLiveWaiting: false,
    timestamp: new Date().toISOString()
  };

  if (rawMoisture !== undefined) {
    const val = Number(rawMoisture);
    result.soilMoisture = !isNaN(val) ? Math.max(0, Math.min(100, Number(val.toFixed(1)))) : 0;
  }
  if (rawSoilTemp !== undefined) {
    const val = Number(rawSoilTemp);
    result.soilTemperature = !isNaN(val) ? Math.max(0, Math.min(70, Number(val.toFixed(1)))) : 0;
  }
  if (rawAirTemp !== undefined) {
    const val = Number(rawAirTemp);
    result.airTemperature = !isNaN(val) ? Math.max(0, Math.min(60, Number(val.toFixed(1)))) : 0;
  }
  if (rawAirHumidity !== undefined) {
    const val = Number(rawAirHumidity);
    result.airHumidity = !isNaN(val) ? Math.max(0, Math.min(100, Number(val.toFixed(1)))) : 0;
  }
  if (rawRainfall !== undefined) {
    const val = Number(rawRainfall);
    result.rainfall = !isNaN(val) ? Math.max(0, Math.min(500, Number(val.toFixed(1)))) : 0.0;
  }
  if (rawLight !== undefined) {
    const val = Number(rawLight);
    result.lightIntensity = !isNaN(val) ? Math.max(0, Math.min(150000, Math.round(val))) : 0;
  }
  if (rawWaterLevel !== undefined) {
    const val = Number(rawWaterLevel);
    result.waterLevel = !isNaN(val) ? Math.max(0, Math.min(100, Number(val.toFixed(1)))) : 0;
  }
  if (rawPump !== undefined) {
    result.pump = Boolean(rawPump);
  }
  if (rawValve !== undefined) {
    result.valve = Boolean(rawValve);
  }

  return result;
}

/**
 * Appends received BLE chunk and parses complete JSON objects
 * @param {string} chunk 
 * @param {Function} onPacketReceived 
 */
export function parseIncomingBleChunk(chunk, onPacketReceived) {
  rxBuffer += chunk;

  // If buffer has junk before first '{', discard the junk
  const firstBrace = rxBuffer.indexOf('{');
  if (firstBrace > 0) {
    rxBuffer = rxBuffer.substring(firstBrace);
  }

  // Attempt to parse complete JSON payloads enclosed in { ... }
  let firstOpen = rxBuffer.indexOf('{');
  while (firstOpen !== -1) {
    let depth = 0;
    let endIdx = -1;
    for (let i = firstOpen; i < rxBuffer.length; i++) {
      if (rxBuffer[i] === '{') depth++;
      else if (rxBuffer[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      const jsonCandidate = rxBuffer.substring(firstOpen, endIdx + 1);
      rxBuffer = rxBuffer.substring(endIdx + 1);

      try {
        const parsed = JSON.parse(jsonCandidate);
        const validated = validateSensorData(parsed);
        if (validated && onPacketReceived) {
          onPacketReceived(validated);
        }
      } catch (err) {
        console.warn('[BLE Parser] Malformed JSON chunk received:', jsonCandidate, err);
      }

      // Check next JSON in buffer
      const nextBrace = rxBuffer.indexOf('{');
      if (nextBrace > 0) {
        rxBuffer = rxBuffer.substring(nextBrace);
      }
      firstOpen = rxBuffer.indexOf('{');
    } else {
      // Incomplete JSON in buffer, wait for more chunks
      break;
    }
  }

  // Prevent memory leak if buffer grows unreasonably without closing brace
  if (rxBuffer.length > 4096) {
    rxBuffer = rxBuffer.slice(-512);
  }
}

export function resetBuffer() {
  rxBuffer = '';
}
