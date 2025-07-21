// src/config/mqttClient.ts
import mqtt from 'mqtt';
import { telemetryService } from '../services/telemetryService';
import { TelemetryInput } from '../types/telemetry';

let mqttClient: mqtt.MqttClient | null = null;

export const initMqtt = (): void => {
  const host = process.env.MQTT_HOST!;
  const port = parseInt(process.env.MQTT_PORT!);
  const username = process.env.MQTT_USERNAME!;
  const password = process.env.MQTT_PASSWORD!;

  if (!host || !port || !username || !password) {
    throw new Error('MQTT_HOST, MQTT_PORT, MQTT_USERNAME, and MQTT_PASSWORD are required');
  }

  const client = mqtt.connect({
    host,
    port,
    username,
    password,
    protocol: 'mqtt',
    reconnectPeriod: 5000,
    connectTimeout: 10000
  });

  // Guardar referencia del cliente
  mqttClient = client;

  client.on('connect', () => {
    console.log(`MQTT connected to ${host}:${port}`);
    
    client.subscribe('devices/+/sensors', (err) => {
      if (err) {
        console.error('MQTT subscribe error:', err);
      } else {
        console.log('Successfully subscribed to devices/+/sensors');
      }
    });
  });

  client.on('message', async (topic, payload) => {
    try {
      // Extraer deviceId del topic: devices/{deviceId}/sensors
      const topicParts = topic.split('/');
      if (topicParts.length !== 3 || topicParts[0] !== 'devices' || topicParts[2] !== 'sensors') {
        console.warn(`Invalid topic format: ${topic}`);
        return;
      }

      const deviceId = topicParts[1];
      if (!deviceId) {
        console.warn(`Missing deviceId in topic: ${topic}`);
        return;
      }

      // Parsear mensaje JSON
      const message: TelemetryInput = JSON.parse(payload.toString());
      
      // Validar estructura básica
      if (!message.sensorType) {
        console.warn(`Missing sensorType in message from device ${deviceId}`);
        return;
      }

      // Procesar telemetría
      await telemetryService.processTelemetry(deviceId, message);
      
    } catch (error) {
      console.error('MQTT message handling error:', {
        topic,
        payload: payload.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });

  client.on('reconnect', () => {
    console.log('MQTT reconnecting...');
  });

  client.on('close', () => {
    console.log('MQTT connection closed');
  });
};

// Función para cerrar el cliente MQTT
export const closeMqtt = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (mqttClient) {
      console.log('Closing MQTT connection...');
      mqttClient.end(false, {}, () => {
        mqttClient = null;
        console.log('MQTT connection closed successfully');
        resolve();
      });
    } else {
      resolve();
    }
  });
};