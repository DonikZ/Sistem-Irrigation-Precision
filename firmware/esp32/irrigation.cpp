/**
 * PANGAN-SENSE Actuator Controller Implementation with Safety Fail-Safe
 */

#include "irrigation.h"
#include "config.h"

static bool pumpActive = false;
static bool valveActive = false;
static unsigned long irrigationStartTime = 0;
static unsigned long requestedDurationMs = 0;
static IrrigationState currentState = IRR_IDLE;

void initIrrigation() {
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  pinMode(PIN_RELAY_SOLENOID, OUTPUT);
  pinMode(PIN_LED_PUMP_ACTIVE, OUTPUT);
  pinMode(PIN_BUZZER_ALARM, OUTPUT);

  // Default initial safe state: strictly turned OFF
  digitalWrite(PIN_RELAY_PUMP, RELAY_INACTIVE_LEVEL);
  digitalWrite(PIN_RELAY_SOLENOID, RELAY_INACTIVE_LEVEL);
  digitalWrite(PIN_LED_PUMP_ACTIVE, LOW);
  digitalWrite(PIN_BUZZER_ALARM, LOW);
}

void startIrrigation(bool pump, bool valve, unsigned long durationSeconds) {
  // Bound check requested duration to hard safety limit
  if (durationSeconds > MAX_IRRIGATION_DURATION_SEC) {
    durationSeconds = MAX_IRRIGATION_DURATION_SEC;
  }
  if (durationSeconds == 0) {
    emergencyStopIrrigation("Zero duration requested");
    return;
  }

  pumpActive = pump;
  valveActive = valve;
  requestedDurationMs = durationSeconds * 1000UL;
  irrigationStartTime = millis();
  currentState = IRR_ACTIVE;

  // Set hardware relays
  digitalWrite(PIN_RELAY_PUMP, pumpActive ? RELAY_ACTIVE_LEVEL : RELAY_INACTIVE_LEVEL);
  digitalWrite(PIN_RELAY_SOLENOID, valveActive ? RELAY_ACTIVE_LEVEL : RELAY_INACTIVE_LEVEL);
  digitalWrite(PIN_LED_PUMP_ACTIVE, pumpActive ? HIGH : LOW);
}

void emergencyStopIrrigation(const String& reason) {
  pumpActive = false;
  valveActive = false;
  requestedDurationMs = 0;
  currentState = IRR_EMERGENCY_STOP;

  // Immediate physical cutoff
  digitalWrite(PIN_RELAY_PUMP, RELAY_INACTIVE_LEVEL);
  digitalWrite(PIN_RELAY_SOLENOID, RELAY_INACTIVE_LEVEL);
  digitalWrite(PIN_LED_PUMP_ACTIVE, LOW);

  // Brief warning beep
  digitalWrite(PIN_BUZZER_ALARM, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER_ALARM, LOW);
}

void updateIrrigation(float currentWaterLevel, bool sensorDataValid) {
  if (currentState != IRR_ACTIVE) {
    return;
  }

  // FAIL-SAFE 1: Sensor data missing or corrupted
  if (!sensorDataValid) {
    emergencyStopIrrigation("Fail-Safe: Sensor data invalid during irrigation");
    currentState = IRR_FAILSAFE_CUTOFF;
    return;
  }

  // FAIL-SAFE 2: Waterbank empty or dangerously low (protect dry run pump damage)
  if (currentWaterLevel < MIN_WATERBANK_SAFE_PERCENT) {
    emergencyStopIrrigation("Fail-Safe: Waterbank below minimum safety cutoff");
    currentState = IRR_FAILSAFE_CUTOFF;
    return;
  }

  // FAIL-SAFE 3: Duration timeout reached
  unsigned long elapsed = millis() - irrigationStartTime;
  if (elapsed >= requestedDurationMs) {
    pumpActive = false;
    valveActive = false;
    digitalWrite(PIN_RELAY_PUMP, RELAY_INACTIVE_LEVEL);
    digitalWrite(PIN_RELAY_SOLENOID, RELAY_INACTIVE_LEVEL);
    digitalWrite(PIN_LED_PUMP_ACTIVE, LOW);
    currentState = IRR_IDLE;
    requestedDurationMs = 0;
  }
}

bool isPumpActive() {
  return pumpActive;
}

bool isValveActive() {
  return valveActive;
}

unsigned long getRemainingDurationSeconds() {
  if (currentState != IRR_ACTIVE) return 0;
  unsigned long elapsed = millis() - irrigationStartTime;
  if (elapsed >= requestedDurationMs) return 0;
  return (requestedDurationMs - elapsed) / 1000UL;
}

IrrigationState getIrrigationState() {
  return currentState;
}
