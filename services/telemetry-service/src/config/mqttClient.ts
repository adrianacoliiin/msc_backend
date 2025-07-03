import mqtt from 'mqtt';
import { processTelemetry } from '../services/telemetryService';

export const initMqtt = (): void => {
  const host = process.env.MQTT_HOST!;
  const port = parseInt(process.env.MQTT_PORT!);
  const client = mqtt.connect({ host, port });

  client.on('connect', () => {
    console.log(`MQTT connected to ${host}:${port}`);
    client.subscribe('devices/+/sensors', (err) => {
      if (err) console.error('MQTT subscribe error:', err);
    });
  });

  client.on('message', async (topic, payload) => {
    try {
      const [, deviceId] = topic.split('/'); // topic: devices/{deviceId}/sensors
      const message = JSON.parse(payload.toString());
      await processTelemetry(deviceId, message);
    } catch (e) {
      console.error('MQTT message handling error:', e);
    }
  });

  client.on('error', console.error);
};
