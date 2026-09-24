/**
 * PANGAN-SENSE ESP32 Precision Irrigation System
 * Hardware Configuration, Pin Mapping & Safety Thresholds
 */

#ifndef PANGAN_SENSE_CONFIG_H
#define PANGAN_SENSE_CONFIG_H

#include <Arduino.h>

// ================= Device Info =================
#define DEVICE_NAME "PANGAN-SENSE-ESP32"
#define FIRMWARE_VERSION "v1.4.2-BLE"

// ================= GPIO Pin Mappings =================
// Actuator Relays (Active LOW for standard relay modules)
#define PIN_RELAY_PUMP         26   // Main Submersible Water Pump Relay
#define PIN_RELAY_SOLENOID     27   // Solenoid Valve Control Relay

// Analog Sensors (ADC1 Pins recommended when BLE/WiFi is active)
#define PIN_SOIL_MOISTURE_ADC  34   // Capacitive Soil Moisture Sensor v1.2 / v2.0
#define PIN_WATER_LEVEL_ADC    35   // Hydrostatic / Capacitive Waterbank Depth Sensor
#define PIN_LDR_LIGHT_ADC      32   // Light Dependent Resistor / Ambient Lux Sensor

// Digital & OneWire Sensors
#define PIN_ONEWIRE_SOIL_TEMP  4    // DS18B20 Digital Waterproof Soil Probe
#define PIN_DHT22_AIR_SENSOR   18   // DHT22 Air Temp & Humidity
#define PIN_RAIN_PULSE_SENSOR  19   // Tipping Bucket Rain Gauge (Interrupt Pin)

// Status Indicator LEDs & Buzzer
#define PIN_LED_BLE_STATUS     2    // On-board LED for BLE link indicator
#define PIN_LED_PUMP_ACTIVE    25   // Relay active visual indicator
#define PIN_BUZZER_ALARM       33   // Emergency acoustic alarm

// ================= Safety & Fail-Safe Limits =================
#define RELAY_ACTIVE_LEVEL     LOW
#define RELAY_INACTIVE_LEVEL   HIGH

#define MAX_IRRIGATION_DURATION_SEC 1800  // Hard maximum 30 minutes emergency timeout
#define MIN_WATERBANK_SAFE_PERCENT  8.0f  // Cutoff below 8% to protect pump from dry-run
#define SENSOR_READ_INTERVAL_MS     3000  // 3-second telemetry update interval
#define BLE_HEARTBEAT_TIMEOUT_MS    30000 // Stop pump if BLE lost during active irrigation

// ================= BLE UUIDs (Nordic UART Service) =================
#define BLE_SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define BLE_CHARACTERISTIC_RX_UUID "6e400002-b5a3-f393-e0a9-e50e24dcca9e" // App -> ESP32
#define BLE_CHARACTERISTIC_TX_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca9e" // ESP32 -> App

#endif // PANGAN_SENSE_CONFIG_H
