/**
 * PANGAN-SENSE Bluetooth BLE Implementation using ESP32 BLE Library
 */

#include "bluetooth.h"
#include "config.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

static BLEServer* pServer = nullptr;
static BLECharacteristic* pTxCharacteristic = nullptr;
static BLECharacteristic* pRxCharacteristic = nullptr;
static bool deviceConnected = false;
static bool oldDeviceConnected = false;
static unsigned long lastBleActivityTime = 0;
static BleCommandCallback commandHandler = nullptr;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    lastBleActivityTime = millis();
    digitalWrite(PIN_LED_BLE_STATUS, HIGH);
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    digitalWrite(PIN_LED_BLE_STATUS, LOW);
  }
};

class RxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
      lastBleActivityTime = millis();
      String commandStr = "";
      for (size_t i = 0; i < rxValue.length(); i++) {
        commandStr += rxValue[i];
      }
      if (commandHandler) {
        commandHandler(commandStr);
      }
    }
  }
};

void initBluetooth(BleCommandCallback onCommand) {
  commandHandler = onCommand;
  pinMode(PIN_LED_BLE_STATUS, OUTPUT);
  digitalWrite(PIN_LED_BLE_STATUS, LOW);

  BLEDevice::init(DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(BLE_SERVICE_UUID);

  // TX Characteristic (Notify to App)
  pTxCharacteristic = pService->createCharacteristic(
    BLE_CHARACTERISTIC_TX_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pTxCharacteristic->addDescriptor(new BLE2902());

  // RX Characteristic (Write from App)
  pRxCharacteristic = pService->createCharacteristic(
    BLE_CHARACTERISTIC_RX_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  pRxCharacteristic->setCallbacks(new RxCallbacks());

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // iPhone connection optimization
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
}

void notifyTelemetry(const String& jsonPayload) {
  if (deviceConnected && pTxCharacteristic) {
    // Send in chunks if longer than standard BLE MTU
    pTxCharacteristic->setValue((uint8_t*)jsonPayload.c_str(), jsonPayload.length());
    pTxCharacteristic->notify();
  }

  // Handle re-advertising on disconnect
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give Bluetooth stack time
    pServer->startAdvertising();
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}

bool isBleConnected() {
  return deviceConnected;
}

unsigned long getLastBleActivityTime() {
  return lastBleActivityTime;
}
