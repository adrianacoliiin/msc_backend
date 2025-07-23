// src/services/alertService.ts
import axios from 'axios';

// 📏 UMBRALES DE ALERTA
const SENSOR_THRESHOLDS = {
  mq4: {
    gas: 50 // Umbral de gas peligroso
  },
  dht22: {
    temperature: 25 // Umbral de temperatura excesiva (Celsius)
  }
};

// 🔗 Configuración IFTTT
const IFTTT_WEBHOOK_URL = 'https://maker.ifttt.com/trigger/sensor_alert/json/with/key/dftHPVy4tahhqaT9x--9FueP8FIWEaJN8hHqmRImBoH';
const DEVICES_SERVICE_URL = process.env.DEVICES_SERVICE_URL || 'http://devices-service:3003'; // Ajustar según tu configuración

// 🔒 Sistema de cooldown para evitar spam de alertas
const alertCooldowns = new Map<string, number>();
const COOLDOWN_DURATION = 60000; // 60 segundos

interface DeviceInfo {
  _id: string;
  roomId: {
    _id: string;
    number: string;
    name: string;
    floor: number;
  };
}

interface IFTTTPayload {
  alerta: string; // Mensaje de alerta
  alertaa: string; // Mensaje de alerta adicional
  value1?: string; // Campo opcional
//   value2: string; // Device ID
//   value3: string; // Timestamp
}

export class AlertService {
  
  /**
   * Verifica si una lectura excede los umbrales y envía alerta si es necesario
   */
  async checkAndSendAlert(
    deviceId: string, 
    sensorType: string, 
    metric: string, 
    value: number, 
    timestamp: Date
  ): Promise<void> {
    try {
      // 1. Verificar si existe umbral para este sensor/métrica
      const threshold = this.getThreshold(sensorType, metric);
      if (!threshold) {
        return; // No hay umbral definido para esta métrica
      }

      // 2. Verificar si excede el umbral
      if (value <= threshold) {
        return; // Valor dentro de límites normales
      }

      // 3. Verificar cooldown para evitar spam
      const cooldownKey = `${deviceId}-${sensorType}-${metric}`;
      if (this.isInCooldown(cooldownKey)) {
        console.log(`⏰ Alert cooldown active for ${cooldownKey}, skipping alert`);
        return;
      }

      // 4. Obtener información del dispositivo y cuarto
      const deviceInfo = await this.getDeviceInfo(deviceId);
      if (!deviceInfo) {
        console.error(`❌ Could not get device info for ${deviceId}`);
        return;
      }

      // 5. Construir mensaje personalizado
      const alertMessage = this.buildAlertMessage(sensorType, metric, value, deviceInfo);

      // 6. Enviar alerta a IFTTT
      await this.sendIFTTTAlert(alertMessage, deviceId, timestamp);

      // 7. Activar cooldown
      this.setCooldown(cooldownKey);

      console.log(`🚨 Alert sent for device ${deviceId} (${sensorType}/${metric}): ${value} > ${threshold}`);

    } catch (error) {
      console.error('Error in checkAndSendAlert:', error);
    }
  }

  /**
   * Obtiene el umbral definido para un sensor/métrica específica
   */
  private getThreshold(sensorType: string, metric: string): number | null {
    const sensorConfig = SENSOR_THRESHOLDS[sensorType as keyof typeof SENSOR_THRESHOLDS];
    if (!sensorConfig) return null;
    
    return sensorConfig[metric as keyof typeof sensorConfig] || null;
  }

  /**
   * Verifica si un sensor está en cooldown
   */
  private isInCooldown(cooldownKey: string): boolean {
    const lastAlert = alertCooldowns.get(cooldownKey);
    if (!lastAlert) return false;
    
    return Date.now() - lastAlert < COOLDOWN_DURATION;
  }

  /**
   * Establece cooldown para un sensor
   */
  private setCooldown(cooldownKey: string): void {
    alertCooldowns.set(cooldownKey, Date.now());
  }

  /**
   * Obtiene información del dispositivo desde el microservicio
   */
  private async getDeviceInfo(deviceId: string): Promise<DeviceInfo | null> {
    try {
      const response = await axios.get(`${DEVICES_SERVICE_URL}/api/devices/${deviceId}`, {
        timeout: 5000 // 5 segundos timeout
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data as DeviceInfo;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching device info for ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Construye el mensaje de alerta personalizado
   */
  private buildAlertMessage(
    sensorType: string, 
    metric: string, 
    value: number, 
    deviceInfo: DeviceInfo
  ): string {
    const roomName = deviceInfo.roomId.name || `Cuarto ${deviceInfo.roomId.number}`;
    
    switch (sensorType) {
      case 'mq4':
        if (metric === 'gas') {
          return `¡Peligro! Nivel alto de gas detectado en ${roomName}`;
        }
        break;
        
      case 'dht22':
        if (metric === 'temperature') {
          return `¡Alerta! Temperatura excesiva en ${roomName}`;
        }
        if (metric === 'humidity') {
          return `¡Aviso! Humedad crítica en ${roomName}`;
        }
        break;
    }

    // Mensaje genérico como fallback
    return `¡Alerta! Sensor ${sensorType} excede límites en ${roomName}`;
  }

  /**
   * Envía la alerta a IFTTT mediante webhook
   */
  private async sendIFTTTAlert(
    message: string, 
    deviceId: string, 
    timestamp: Date
  ): Promise<void> {
    try {
      const payload: IFTTTPayload = {
        alerta: message,
        alertaa: message,
        // value3: timestamp.toISOString()
      };

      const response = await axios.post(IFTTT_WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos timeout
      });

      if (response.status === 200) {
        console.log(`IFTTT alert sent successfully: "${message}"`);
      } else {
        console.error(`IFTTT webhook returned status ${response.status}`);
      }

    } catch (error) {
      console.error('Error sending IFTTT alert:', error);
      throw error;
    }
  }

  /**
   * Procesa múltiples lecturas de un batch y verifica alertas
   */
  async processBatchAlerts(
    deviceId: string, 
    sensorType: string, 
    readings: Array<{ metric: string; value: number | boolean; timestamp: Date }>
  ): Promise<void> {
    // Procesar cada lectura individualmente, solo las numéricas
    for (const reading of readings) {
      // Solo procesar valores numéricos para alertas de umbral
      if (typeof reading.value === 'number') {
        await this.checkAndSendAlert(
          deviceId,
          sensorType,
          reading.metric,
          reading.value,
          reading.timestamp
        );
      }
      // Los valores booleanos (como PIR motion) se ignoran para alertas de umbral
    }
  }

  /**
   * Método para testing - permite forzar una alerta
   */
  async testAlert(deviceId: string, message: string = "🧪 Alerta de prueba"): Promise<void> {
    try {
      await this.sendIFTTTAlert(message, deviceId, new Date());
      console.log('✅ Test alert sent successfully');
    } catch (error) {
      console.error('❌ Test alert failed:', error);
      throw error;
    }
  }

  /**
   * Limpia cooldowns antiguos (ejecutar periódicamente)
   */
  cleanupCooldowns(): void {
    const now = Date.now();
    for (const [key, timestamp] of alertCooldowns.entries()) {
      if (now - timestamp > COOLDOWN_DURATION) {
        alertCooldowns.delete(key);
      }
    }
  }
}

// Instancia singleton del servicio
export const alertService = new AlertService();

// Limpiar cooldowns cada 5 minutos
setInterval(() => {
  alertService.cleanupCooldowns();
}, 5 * 60 * 1000);
