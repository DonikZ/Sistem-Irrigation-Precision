/**
 * PANGAN-SENSE Sensor Management Header
 */

#ifndef PANGAN_SENSE_SENSORS_H
#define PANGAN_SENSE_SENSORS_H

#include <Arduino.h>

struct SensorTelemetry {
  float soilMoisture;      // % (0 - 100)
  float soilTemperature;   // °C
  float airTemperature;    // °C
  float airHumidity;       // % (0 - 100)
  float rainfall;          // mm
  int   lightIntensity;    // Lux
  float waterLevel;        // % (0 - 100)
  bool  isValid;           // Data integrity verification flag
};

void initSensors();
SensorTelemetry readAllSensors();
String serializeTelemetryToJson(const SensorTelemetry& data, bool pumpState, bool valveState);

#endif // PANGAN_SENSE_SENSORS_H
