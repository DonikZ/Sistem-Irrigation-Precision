/**
 * PANGAN-SENSE Actuator & Irrigation Controller Header
 */

#ifndef PANGAN_SENSE_IRRIGATION_H
#define PANGAN_SENSE_IRRIGATION_H

#include <Arduino.h>

enum IrrigationState {
  IRR_IDLE,
  IRR_ACTIVE,
  IRR_EMERGENCY_STOP,
  IRR_FAILSAFE_CUTOFF
};

void initIrrigation();
void startIrrigation(bool pump, bool valve, unsigned long durationSeconds);
void emergencyStopIrrigation(const String& reason);
void updateIrrigation(float currentWaterLevel, bool sensorDataValid);
bool isPumpActive();
bool isValveActive();
unsigned long getRemainingDurationSeconds();
IrrigationState getIrrigationState();

#endif // PANGAN_SENSE_IRRIGATION_H
