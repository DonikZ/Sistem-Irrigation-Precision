/**
 * BLE Constants for PANGAN-SENSE ESP32 Communication
 * Standard Nordic UART Service (NUS) or Custom PANGAN-SENSE Service
 */

export const BLE_SERVICES = {
  // Custom PANGAN-SENSE Service UUID
  PRIMARY_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  // RX Characteristic (ESP32 receives commands from Web App)
  RX_CHARACTERISTIC: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  // TX Characteristic (ESP32 notifies telemetry JSON to Web App)
  TX_CHARACTERISTIC: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
};

export const COMMON_BLE_SERVICES = [
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
  '4fafc201-1fb5-459e-8fcc-c5c9c331914b', // ESP32 BLE default example service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard HC-08 / JDY BLE Serial
  '0000fff0-0000-1000-8000-00805f9b34fb', // Alternate Serial BLE
  '0000ffee-0000-1000-8000-00805f9b34fb',
  '19b10000-e8f2-537e-4f6c-d104768a1214', // Arduino BLE standard service
  '19b10001-e8f2-537e-4f6c-d104768a1214',
  '0000181a-0000-1000-8000-00805f9b34fb', // Environmental Sensing Service
  '0000abf0-0000-1000-8000-00805f9b34fb',
  '000000ff-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '91bad492-7d7f-495e-9988-5c4b5744e261',
  'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  'deca0001-f925-4a5c-bc3c-2402bbf6b55d'
];

export function normalizeBleUuid(uuid) {
  if (!uuid) return null;
  let str = uuid.trim().toLowerCase();
  if (str.startsWith('0x')) str = str.substring(2);
  if (str.length === 4) {
    return `0000${str}-0000-1000-8000-00805f9b34fb`;
  }
  return str;
}

export const BLE_DEVICE_NAME_PREFIX = 'PANGAN-SENSE';

export const BLE_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  UNSUPPORTED: 'UNSUPPORTED'
};

export const COMMAND_TYPES = {
  IRRIGATION: 'IRRIGATION',
  EMERGENCY_STOP: 'EMERGENCY_STOP',
  PUMP_TOGGLE: 'PUMP_TOGGLE',
  VALVE_TOGGLE: 'VALVE_TOGGLE',
  PING: 'PING',
  CONFIG_UPDATE: 'CONFIG_UPDATE'
};
