/**
 * PANGAN-SENSE Precision Irrigation Firmware
 * Main ESP32 System Orchestrator
 */

#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "bluetooth.h"
#include "irrigation.h"

static unsigned long lastSensorReadTime = 0;
static SensorTelemetry currentTelemetry;

// Minimal JSON parser for incoming commands without requiring external heavy libraries
void handleIncomingCommand(const String& cmdJson) {
  // Check for Emergency Stop
  if (cmdJson.indexOf("EMERGENCY_STOP") != -1) {
    emergencyStopIrrigation("Emergency Stop command received from Web App");
    return;
  }

  // Check for Irrigation Command: {"command":"IRRIGATION","pump":true,"valve":true,"duration":600}
  if (cmdJson.indexOf("IRRIGATION") != -1) {
    bool pump = (cmdJson.indexOf("\"pump\":true") != -1);
    bool valve = (cmdJson.indexOf("\"valve\":true") != -1);

    // Extract duration in seconds
    unsigned long duration = 600; // default 10 minutes
    int durationIdx = cmdJson.indexOf("\"duration\":");
    if (durationIdx != -1) {
      int endIdx = cmdJson.indexOf("}", durationIdx);
      int commaIdx = cmdJson.indexOf(",", durationIdx);
      if (commaIdx != -1 && commaIdx < endIdx) endIdx = commaIdx;
      String durStr = cmdJson.substring(durationIdx + 11, endIdx);
      durStr.trim();
      long parsedVal = durStr.toInt();
      if (parsedVal > 0) duration = (unsigned long)parsedVal;
    }

    startIrrigation(pump, valve, duration);
    return;
  }

  // Manual pump toggle
  if (cmdJson.indexOf("PUMP_TOGGLE") != -1) {
    bool pump = (cmdJson.indexOf("\"pump\":true") != -1);
    if (pump) {
      startIrrigation(true, isValveActive(), 600);
    } else {
      startIrrigation(false, isValveActive(), 0);
    }
    return;
  }

  // Manual valve toggle
  if (cmdJson.indexOf("VALVE_TOGGLE") != -1) {
    bool valve = (cmdJson.indexOf("\"valve\":true") != -1);
    startIrrigation(isPumpActive(), valve, getRemainingDurationSeconds() > 0 ? getRemainingDurationSeconds() : 600);
    return;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[PANGAN-SENSE] Initializing ESP32 Precision Irrigation Node...");

  initSensors();
  initIrrigation();
  initBluetooth(handleIncomingCommand);

  Serial.println("[PANGAN-SENSE] Ready. BLE Advertising active.");
}

void loop() {
  unsigned long now = millis();

  // 1. Read sensors on scheduled interval
  if (now - lastSensorReadTime >= SENSOR_READ_INTERVAL_MS) {
    lastSensorReadTime = now;
    currentTelemetry = readAllSensors();

    // Serialize and stream via BLE TX characteristic
    if (isBleConnected()) {
      String json = serializeTelemetryToJson(currentTelemetry, isPumpActive(), isValveActive());
      notifyTelemetry(json);
    }
  }

  // 2. Continuous Safety Fail-Safe & Duration Watchdog
  updateIrrigation(currentTelemetry.waterLevel, currentTelemetry.isValid);

  // 3. BLE Heartbeat Timeout Guard during active pumping
  if (isPumpActive() && isBleConnected()) {
    if (now - getLastBleActivityTime() > BLE_HEARTBEAT_TIMEOUT_MS) {
      // If BLE connection is completely silent during active pumping, safety cutoff
      emergencyStopIrrigation("Safety Cutoff: BLE Heartbeat Silent during pumping");
    }
  }

  delay(20); // Cooperative multitasking yield
}
