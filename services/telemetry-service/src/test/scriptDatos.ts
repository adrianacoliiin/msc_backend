// Script para insertar datos de prueba - DHT22, MQ4, PIR
import { telemetryService } from '../services/telemetryService';

const DEVICE_IDS = [
  '66a1b2c3d4e5f6789a1b2c3d', // Sensor DHT22 Oficina
  '66a1b2c3d4e5f6789a1b2c3e', // Sensor MQ4 Cocina
  '66a1b2c3d4e5f6789a1b2c3f', // Sensor PIR Pasillo
  '66a1b2c3d4e5f6789a1b2c40'  // Conjunto completo
];

async function insertTestData() {
  console.log('🚀 Insertando datos DHT22, MQ4, PIR...');

  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  for (let deviceIndex = 0; deviceIndex < DEVICE_IDS.length; deviceIndex++) {
    const deviceId = DEVICE_IDS[deviceIndex];
    
    for (let hours = 0; hours < 14 * 24; hours++) {
      const timestamp = new Date(twoWeeksAgo.getTime() + hours * 60 * 60 * 1000).toISOString();
      
      // DHT22 - Temperatura y Humedad
      const dht22Data = {
        sensorType: 'dht22',
        readings: [
          {
            metric: 'temperature',
            value: 18 + Math.random() * 12 + Math.sin(hours / 24 * Math.PI * 2) * 3,
            timestamp: timestamp
          },
          {
            metric: 'humidity', 
            value: 40 + Math.random() * 30 + Math.sin(hours / 12 * Math.PI) * 10,
            timestamp: timestamp
          }
        ]
      };

      await telemetryService.processTelemetry(deviceId, dht22Data);

      // MQ4 - Detector de Gas Metano
      const mq4Data = {
        sensorType: 'mq4',
        readings: [
          {
            metric: 'gas_level',
            value: 300 + Math.random() * 200, // ppm
            timestamp: timestamp
          },
          {
            metric: 'gas_detected',
            value: Math.random() > 0.9, // 10% probabilidad alerta
            timestamp: timestamp
          },
          {
            metric: 'analog_value',
            value: Math.floor(200 + Math.random() * 600), // 0-1023
            timestamp: timestamp
          }
        ]
      };

      await telemetryService.processTelemetry(deviceId, mq4Data);

      // PIR - Sensor de Movimiento
      const pirData = {
        sensorType: 'pir',
        readings: [
          {
            metric: 'motion_detected',
            value: Math.random() > 0.8, // 20% detección
            timestamp: timestamp
          },
          {
            metric: 'trigger_count',
            value: Math.floor(Math.random() * 5),
            timestamp: timestamp
          }
        ]
      };

      await telemetryService.processTelemetry(deviceId, pirData);

      if (hours % 24 === 0) {
        console.log(`📊 Dispositivo ${deviceIndex + 1}/4 - Día ${hours / 24 + 1}/14`);
      }
    }
  }

  // Datos recientes (últimas 2 horas)
  for (let minutes = 0; minutes < 120; minutes += 5) {
    const timestamp = new Date(now.getTime() - (120 - minutes) * 60 * 1000).toISOString();
    
    for (const deviceId of DEVICE_IDS) {
      const realtimeData = {
        sensorType: 'dht22',
        readings: [
          {
            metric: 'temperature',
            value: 22 + Math.random() * 6,
            timestamp: timestamp
          },
          {
            metric: 'humidity',
            value: 45 + Math.random() * 20,
            timestamp: timestamp
          }
        ]
      };

      await telemetryService.processTelemetry(deviceId, realtimeData);
    }
  }

  console.log('✅ Datos DHT22, MQ4, PIR insertados');
}

// Ejemplos individuales
async function insertDHT22Reading() {
  const dht22Reading = {
    sensorType: 'dht22',
    metric: 'temperature',
    value: 23.5,
    timestamp: new Date().toISOString()
  };
  
  await telemetryService.processTelemetry('66a1b2c3d4e5f6789a1b2c3d', dht22Reading);
}

async function insertMQ4Batch() {
  const mq4Data = {
    sensorType: 'mq4',
    readings: [
      {
        metric: 'gas_level',
        value: 450,
        timestamp: new Date().toISOString()
      },
      {
        metric: 'gas_detected',
        value: true,
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  await telemetryService.processTelemetry('66a1b2c3d4e5f6789a1b2c3e', mq4Data);
}

async function insertPIRData() {
  const pirData = {
    sensorType: 'pir',
    readings: [
      {
        metric: 'motion_detected',
        value: true,
        timestamp: new Date().toISOString()
      },
      {
        metric: 'trigger_count',
        value: 3,
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  await telemetryService.processTelemetry('66a1b2c3d4e5f6789a1b2c3f', pirData);
}

export { insertTestData, insertDHT22Reading, insertMQ4Batch, insertPIRData, DEVICE_IDS };