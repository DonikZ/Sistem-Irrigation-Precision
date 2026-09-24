/**
 * BLE Command Builders for ESP32
 */
import { COMMAND_TYPES } from './bleConstants.js';

/**
 * Creates irrigation command payload
 * @param {boolean} pump 
 * @param {boolean} valve 
 * @param {number} durationSeconds 
 * @returns {string} Stringified JSON command
 */
export function buildIrrigationCommand(pump = true, valve = true, durationSeconds = 600) {
  const payload = {
    command: COMMAND_TYPES.IRRIGATION,
    pump: Boolean(pump),
    valve: Boolean(valve),
    duration: Math.max(1, Math.min(7200, Math.round(durationSeconds)))
  };
  return JSON.stringify(payload);
}

/**
 * Creates Emergency Stop command payload
 * @returns {string} Stringified JSON command
 */
export function buildEmergencyStopCommand() {
  const payload = {
    command: COMMAND_TYPES.EMERGENCY_STOP,
    pump: false,
    valve: false,
    duration: 0
  };
  return JSON.stringify(payload);
}

/**
 * Creates manual pump control command
 * @param {boolean} state 
 * @returns {string}
 */
export function buildPumpCommand(state) {
  const payload = {
    command: COMMAND_TYPES.PUMP_TOGGLE,
    pump: Boolean(state)
  };
  return JSON.stringify(payload);
}

/**
 * Creates manual solenoid valve control command
 * @param {boolean} state 
 * @returns {string}
 */
export function buildValveCommand(state) {
  const payload = {
    command: COMMAND_TYPES.VALVE_TOGGLE,
    valve: Boolean(state)
  };
  return JSON.stringify(payload);
}
