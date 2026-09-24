/**
 * PANGAN-SENSE Bluetooth BLE Header
 */

#ifndef PANGAN_SENSE_BLUETOOTH_H
#define PANGAN_SENSE_BLUETOOTH_H

#include <Arduino.h>

typedef void (*BleCommandCallback)(const String& commandJson);

void initBluetooth(BleCommandCallback onCommand);
void notifyTelemetry(const String& jsonPayload);
bool isBleConnected();
unsigned long getLastBleActivityTime();

#endif // PANGAN_SENSE_BLUETOOTH_H
