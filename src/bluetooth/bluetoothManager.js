/**
 * Web Bluetooth API Manager for PANGAN-SENSE
 * Abstracts low-level GATT operations and provides clean lifecycle hooks
 * Includes automatic Virtual ESP32 Gateway fallback when running inside an iframe
 * or when Web Bluetooth is disallowed by Permissions Policy.
 */
import { BLE_SERVICES, COMMON_BLE_SERVICES, normalizeBleUuid, BLE_STATUS, COMMAND_TYPES } from './bleConstants.js';
import { parseIncomingBleChunk, resetBuffer, validateSensorData } from './bleParser.js';

class BluetoothManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.status = BLE_STATUS.DISCONNECTED;
    this.isVirtual = false;
    this.virtualInterval = null;
    this.virtualState = {
      soilMoisture: 0,
      soilTemperature: 0,
      airTemperature: 0,
      airHumidity: 0,
      rainfall: 0.0,
      lightIntensity: 0,
      waterLevel: 0,
      pump: false,
      valve: false
    };

    this.logs = [];
    this.pollingInterval = null;
    this.onLogCallbacks = new Set();
    this.onStatusChangeCallbacks = new Set();
    this.onDataReceivedCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
  }

  addLog(type, text) {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logItem = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      time,
      type, // 'info' | 'rx' | 'tx' | 'warn' | 'error' | 'success'
      text: typeof text === 'string' ? text : JSON.stringify(text)
    };
    this.logs.push(logItem);
    if (this.logs.length > 80) this.logs.shift();
    this.onLogCallbacks.forEach(cb => {
      try { cb(logItem, this.logs); } catch {}
    });
  }

  getLogs() {
    return [...this.logs];
  }

  onLog(callback) {
    this.onLogCallbacks.add(callback);
    return () => this.onLogCallbacks.delete(callback);
  }

  isSupported() {
    return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
  }

  /**
   * Checks whether the current document / iframe permissions policy disallows Bluetooth
   */
  isPolicyDisallowed() {
    try {
      if (typeof document !== 'undefined') {
        if (document.permissionsPolicy && typeof document.permissionsPolicy.allowsFeature === 'function') {
          return !document.permissionsPolicy.allowsFeature('bluetooth');
        }
        if (document.featurePolicy && typeof document.featurePolicy.allowsFeature === 'function') {
          return !document.featurePolicy.allowsFeature('bluetooth');
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * Checks if running inside an iframe (such as AI Studio preview or embed)
   */
  isInsideIframe() {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  isVirtualDevice() {
    return Boolean(this.isVirtual);
  }

  getStatus() {
    return this.status;
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach(cb => cb(newStatus));
  }

  onStatusChange(callback) {
    this.onStatusChangeCallbacks.add(callback);
    return () => this.onStatusChangeCallbacks.delete(callback);
  }

  onDataReceived(callback) {
    this.onDataReceivedCallbacks.add(callback);
    return () => this.onDataReceivedCallbacks.delete(callback);
  }

  onError(callback) {
    this.onErrorCallbacks.add(callback);
    return () => this.onErrorCallbacks.delete(callback);
  }

  emitError(errorMsg) {
    this.onErrorCallbacks.forEach(cb => cb(errorMsg));
  }

  /**
   * Connects to a virtual ESP32 Gateway with realistic telemetry streaming & bidirectional command handling
   */
  connectVirtual(reason = 'permissions_policy') {
    this.cleanUpReferences();
    this.isVirtual = true;
    this.setStatus(BLE_STATUS.CONNECTED);

    console.info(`[BLE] Gateway ESP32 Virtual aktif (Alasan: ${reason}). Streaming telemetri & penerimaan perintah siap digunakan.`);

    // Emit immediate telemetry
    this.emitVirtualTelemetry();

    // Start periodic telemetry update every 3.5s
    if (this.virtualInterval) clearInterval(this.virtualInterval);
    this.virtualInterval = setInterval(() => {
      if (!this.isVirtual) return;
      // Slight realistic fluctuations
      const dMoisture = this.virtualState.pump ? 0.4 : -0.06;
      const dWater = this.virtualState.pump ? -0.25 : 0;
      this.virtualState.soilMoisture = Math.min(95, Math.max(12, Number((this.virtualState.soilMoisture + dMoisture).toFixed(1))));
      this.virtualState.waterLevel = Math.min(100, Math.max(5, Number((this.virtualState.waterLevel + dWater).toFixed(1))));
      this.emitVirtualTelemetry();
    }, 3500);

    return {
      deviceName: 'ESP32-PANGAN-VIRTUAL (Gateway)',
      deviceId: 'VIRTUAL-ESP32-GATEWAY',
      isVirtual: true,
      reason
    };
  }

  emitVirtualTelemetry() {
    const validated = validateSensorData({
      soilMoisture: this.virtualState.soilMoisture,
      soilTemperature: this.virtualState.soilTemperature,
      airTemperature: this.virtualState.airTemperature,
      airHumidity: this.virtualState.airHumidity,
      rainfall: this.virtualState.rainfall,
      lightIntensity: this.virtualState.lightIntensity,
      waterLevel: this.virtualState.waterLevel,
      pump: this.virtualState.pump,
      valve: this.virtualState.valve
    });
    if (validated) {
      this.onDataReceivedCallbacks.forEach(cb => cb(validated));
    }
  }

  async connect(options = {}) {
    if (options.forceVirtual) {
      return this.connectVirtual('user_manual_selection');
    }

    // 1. If running in an environment where Bluetooth is disallowed by Permissions Policy,
    // seamlessly activate the Virtual ESP32 Gateway without triggering SecurityError.
    if (this.isPolicyDisallowed()) {
      return this.connectVirtual('permissions_policy_restricted');
    }

    // 2. If navigator.bluetooth is not supported by the browser, fallback to Virtual ESP32
    if (!this.isSupported()) {
      console.info('[BLE] Web Bluetooth API tidak didukung pada browser ini. Mengalihkan ke Gateway ESP32 Virtual.');
      return this.connectVirtual('unsupported_browser');
    }

    // 3. Attempt hardware Bluetooth connection
    try {
      this.setStatus(BLE_STATUS.CONNECTING);
      resetBuffer();

      this.addLog('info', 'Membuka dialog pencarian Bluetooth...');
      console.info('[BLE] Requesting Bluetooth Device...', options);

      let activeServicesList = [...COMMON_BLE_SERVICES];
      const targetCustomUuid = normalizeBleUuid(options.serviceUuid);
      if (targetCustomUuid && !activeServicesList.includes(targetCustomUuid)) {
        activeServicesList.unshift(targetCustomUuid);
      }

      let requestOptions;
      if (options.acceptAllDevices) {
        requestOptions = {
          acceptAllDevices: true,
          optionalServices: activeServicesList
        };
      } else {
        const filters = [
          { namePrefix: 'PANGAN-SENSE' },
          { namePrefix: 'ESP32' },
          { namePrefix: 'pangan' },
          { namePrefix: 'esp32' }
        ];
        if (options.namePrefix && options.namePrefix.trim()) {
          filters.unshift({ namePrefix: options.namePrefix.trim() });
        }
        requestOptions = {
          filters,
          optionalServices: activeServicesList
        };
      }

      this.device = await navigator.bluetooth.requestDevice(requestOptions);
      this.addLog('success', `Perangkat dipilih: ${this.device.name || 'ESP32'}`);

      this.device.addEventListener('gattserverdisconnected', () => {
        console.warn('[BLE] Device disconnected unexpectedly');
        this.addLog('warn', 'GATT Server ESP32 terputus.');
        this.setStatus(BLE_STATUS.DISCONNECTED);
        this.cleanUpReferences();
      });

      this.addLog('info', 'Menghubungkan ke GATT Server ESP32...');
      console.info('[BLE] Connecting to GATT Server...');
      this.server = await this.device.gatt.connect();
      this.addLog('success', 'GATT Server ESP32 terhubung.');

      // Wait 400ms for OS GATT service table discovery and MTU exchange to stabilize
      this.addLog('info', 'Menunggu inisialisasi tabel GATT...');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step A: Robust Primary Service Discovery
      console.info('[BLE] Discovering Primary Service...');
      this.service = null;

      // 1. If user provided a specific service UUID, try it first
      if (targetCustomUuid) {
        try {
          this.addLog('info', `Mencari Service UUID target: ${targetCustomUuid}`);
          this.service = await this.server.getPrimaryService(targetCustomUuid);
          if (this.service) {
            this.addLog('success', `Service target cocok: ${targetCustomUuid}`);
          }
        } catch (err) {
          console.warn(`[BLE] Target custom service ${targetCustomUuid} not found:`, err);
        }
      }

      // 2. Try known services from activeServicesList
      if (!this.service) {
        for (const sUuid of activeServicesList) {
          try {
            this.service = await this.server.getPrimaryService(sUuid);
            if (this.service) {
              console.info('[BLE] Matched service UUID:', sUuid);
              this.addLog('success', `Service BLE ditemukan: ${sUuid}`);
              break;
            }
          } catch {
            // try next
          }
        }
      }

      // 3. Fallback: query all primary services granted by browser
      if (!this.service) {
        try {
          const allServices = await this.server.getPrimaryServices();
          if (allServices && allServices.length > 0) {
            this.addLog('info', `Daftar service tersedia: ${allServices.map(s => s.uuid).join(', ')}`);
            const nonGeneric = allServices.filter(s => {
              const u = s.uuid.toLowerCase();
              return !u.startsWith('00001800') && !u.startsWith('00001801') && !u.startsWith('0000180a');
            });
            this.service = nonGeneric[0] || allServices[0];
          }
        } catch (e) {
          console.warn('[BLE] Fallback getPrimaryServices failed:', e);
        }
      }

      if (!this.service) {
        this.addLog('error', 'Service BLE tidak ditemukan pada ESP32.');
        this.addLog('info', 'Tips: Buka kode Arduino Anda, lihat baris #define SERVICE_UUID "...", lalu salin UUID tersebut ke kolom Service UUID di atas.');
        throw new Error('Tidak dapat menemukan Service BLE pada ESP32. Pastikan Service UUID sesuai dengan kode Arduino Anda.');
      }
      this.addLog('info', `Menggunakan Service: ${this.service.uuid}`);

      // Step B: Robust Characteristic Auto-Discovery
      console.info('[BLE] Discovering Characteristics...');
      this.txCharacteristic = null;
      this.rxCharacteristic = null;

      try {
        const chars = await this.service.getCharacteristics();
        console.info('[BLE] Available characteristics in service:', chars.map(c => ({
          uuid: c.uuid,
          notify: c.properties.notify,
          indicate: c.properties.indicate,
          write: c.properties.write,
          writeWithoutResponse: c.properties.writeWithoutResponse
        })));

        // Find notify or indicate characteristic for TX (ESP32 -> Web)
        this.txCharacteristic = chars.find(c => c.properties.notify || c.properties.indicate);

        // Find write characteristic for RX (Web -> ESP32)
        this.rxCharacteristic = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);

        if (!this.txCharacteristic && chars.length > 0) {
          this.txCharacteristic = chars[0];
        }
        if (!this.rxCharacteristic && chars.length > 0) {
          this.rxCharacteristic = chars[0];
        }
      } catch (err) {
        console.warn('[BLE] Could not enumerate characteristics, trying default UUIDs...', err);
        try {
          this.txCharacteristic = await this.service.getCharacteristic(BLE_SERVICES.TX_CHARACTERISTIC);
        } catch {}
        try {
          this.rxCharacteristic = await this.service.getCharacteristic(BLE_SERVICES.RX_CHARACTERISTIC);
        } catch {}
      }

      if (!this.txCharacteristic) {
        throw new Error('Karakteristik BLE untuk data tidak ditemukan.');
      }
      this.addLog('info', `Karakteristik TX: ${this.txCharacteristic.uuid}`);

      // Step C: Start Notifications or Polling on TX
      let notificationsActive = false;
      const canNotify = Boolean(
        this.txCharacteristic.properties?.notify ||
        this.txCharacteristic.properties?.indicate
      );

      if (canNotify) {
        try {
          this.addLog('info', 'Mengaktifkan notifikasi data masuk (startNotifications)...');
          await this.txCharacteristic.startNotifications();
          notificationsActive = true;
          this.addLog('success', 'Berhasil subscribe notifikasi BLE!');

          this.txCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value;
            const decoded = this.textDecoder.decode(value);
            this.addLog('rx', decoded);
            parseIncomingBleChunk(decoded, (validTelemetry) => {
              if (validTelemetry.isStatusPacket) {
                this.addLog('success', `Status ESP32: ${validTelemetry.deviceStatus || 'ONLINE'}`);
              }
              this.onDataReceivedCallbacks.forEach(cb => cb(validTelemetry));
            });
          });
        } catch (notifErr) {
          console.warn('[BLE] startNotifications rejected by ESP32:', notifErr);
          this.addLog('warn', `startNotifications ditolak: ${notifErr.message}`);
          this.addLog('info', 'Tips: Pada Arduino, tambahkan "pCharacteristic->addDescriptor(new BLE2902());" untuk mengaktifkan notifikasi GATT.');
        }
      } else {
        this.addLog('warn', 'Karakteristik tidak memiliki flag Notify/Indicate.');
      }

      // If notifications could not be enabled, activate Read Polling fallback if readable
      if (!notificationsActive) {
        if (this.txCharacteristic.properties?.read) {
          this.addLog('info', 'Mengaktifkan fallback Read Polling (membaca data periodik)...');
          this.startReadPolling();
        } else {
          this.addLog('info', 'Koneksi GATT aktif. Siap menerima/mengirim data.');
        }
      }

      this.isVirtual = false;
      this.setStatus(BLE_STATUS.CONNECTED);
      this.addLog('success', `ESP32 Terhubung (${this.device.name || 'PANGAN-SENSE'})`);
      return {
        deviceName: this.device.name || 'ESP32 PANGAN-SENSE',
        deviceId: this.device.id,
        isVirtual: false
      };
    } catch (error) {
      this.cleanUpReferences();
      this.addLog('error', `Koneksi gagal: ${error.message || error.name}`);

      // Check if error is caused by iframe permissions policy
      const isSecurityOrPolicyError =
        error.name === 'SecurityError' ||
        (error.message && (
          error.message.toLowerCase().includes('permissions policy') ||
          error.message.toLowerCase().includes('disallowed') ||
          error.message.toLowerCase().includes('not allowed')
        ));

      if (isSecurityOrPolicyError) {
        console.info('[BLE] Akses Bluetooth fisik dibatasi oleh izin iframe browser. Mengaktifkan Gateway ESP32 Virtual.');
        return this.connectVirtual('permissions_policy_blocked');
      }

      if (error.name === 'NotFoundError') {
        // User cancelled the browser Bluetooth picker dialog - cleanly set back to disconnected
        console.info('[BLE] Pemilihan perangkat Bluetooth dibatalkan oleh pengguna.');
        this.setStatus(BLE_STATUS.DISCONNECTED);
        return null;
      }

      console.warn('[BLE] Koneksi Bluetooth fisik gagal:', error.message);
      this.setStatus(BLE_STATUS.DISCONNECTED);
      this.emitError(error.message || 'Gagal menyambungkan Bluetooth.');
      throw error;
    }
  }

  async disconnect() {
    if (this.virtualInterval) {
      clearInterval(this.virtualInterval);
      this.virtualInterval = null;
    }
    this.isVirtual = false;

    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try {
        await this.device.gatt.disconnect();
      } catch (err) {
        console.warn('[BLE] Error during disconnect:', err);
      }
    }
    this.cleanUpReferences();
    this.setStatus(BLE_STATUS.DISCONNECTED);
  }

  cleanUpReferences() {
    if (this.virtualInterval) {
      clearInterval(this.virtualInterval);
      this.virtualInterval = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.server = null;
    this.service = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    resetBuffer();
  }

  startReadPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(async () => {
      if (!this.txCharacteristic || this.status !== BLE_STATUS.CONNECTED) return;
      try {
        const val = await this.txCharacteristic.readValue();
        const decoded = this.textDecoder.decode(val);
        if (decoded && decoded.trim()) {
          this.addLog('rx', decoded);
          parseIncomingBleChunk(decoded, (validTelemetry) => {
            if (validTelemetry.isStatusPacket) {
              this.addLog('success', `Status ESP32: ${validTelemetry.deviceStatus || 'ONLINE'}`);
            }
            this.onDataReceivedCallbacks.forEach(cb => cb(validTelemetry));
          });
        }
      } catch (err) {
        console.warn('[BLE] Read polling error:', err);
      }
    }, 2500);
  }

  async sendCommand(commandJsonString) {
    if (this.status !== BLE_STATUS.CONNECTED) {
      throw new Error('Tidak dapat mengirim command: ESP32 belum terhubung.');
    }

    // If in Virtual mode, simulate actuator acknowledgement and state update
    if (this.isVirtual) {
      try {
        const parsed = JSON.parse(commandJsonString);
        if (parsed.command === COMMAND_TYPES.IRRIGATION || parsed.command === COMMAND_TYPES.PUMP_TOGGLE) {
          this.virtualState.pump = Boolean(parsed.pump);
          this.virtualState.valve = Boolean(parsed.valve);
        } else if (parsed.command === COMMAND_TYPES.VALVE_TOGGLE) {
          this.virtualState.valve = Boolean(parsed.valve);
        } else if (parsed.command === COMMAND_TYPES.EMERGENCY_STOP) {
          this.virtualState.pump = false;
          this.virtualState.valve = false;
        }
        this.emitVirtualTelemetry();
        console.info('[Virtual ESP32 Gateway] Perintah diterima & dieksekusi:', parsed);
      } catch (e) {
        console.warn('[Virtual ESP32 Gateway] Gagal mem-parse command:', e);
      }
      return true;
    }

    if (!this.rxCharacteristic) {
      throw new Error('Tidak dapat mengirim command: Karakteristik RX tidak tersedia.');
    }

    try {
      const data = this.textEncoder.encode(commandJsonString + '\n');
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.rxCharacteristic.writeValueWithoutResponse(chunk);
      }
      return true;
    } catch (err) {
      console.warn('[BLE] Failed to send command to hardware:', err);
      this.emitError('Gagal mengirim perintah ke ESP32: ' + err.message);
      throw err;
    }
  }

  getDeviceName() {
    if (this.isVirtual) return 'ESP32 Virtual Gateway';
    return this.device?.name || (this.status === BLE_STATUS.CONNECTED ? 'ESP32 Terhubung' : null);
  }
}

export const bleManager = new BluetoothManager();
export default bleManager;
