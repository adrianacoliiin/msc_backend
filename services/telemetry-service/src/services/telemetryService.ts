import { Telemetry } from '../models/Telemetry';
import { publishAlert } from '../utils/rabbitmq';
import mongoose from 'mongoose';

// Formato para lectura individual
interface TelemetryReading {
  metric: string;
  value: number | boolean;
  timestamp: string; // ISO
}

// Formato para mensaje con múltiples lecturas
interface TelemetryBatch {
  sensorType: string;
  readings: TelemetryReading[];
}

// Formato para lectura individual (mantenemos compatibilidad)
interface TelemetryInput {
  sensorType: string;
  metric: string;
  value: number | boolean;
  timestamp: string; // ISO
}

// Función para procesar una sola lectura
export const processSingleTelemetry = async (
  deviceId: string,
  data: TelemetryInput
): Promise<void> => {
  // 1) Validar timestamp
  const timestamp = new Date(data.timestamp);
  if (isNaN(timestamp.getTime())) {
    throw new Error(`Invalid timestamp: ${data.timestamp}`);
  }

  // 2) Insertar lectura en histórico
  const doc = new Telemetry({
    deviceId: new mongoose.Types.ObjectId(deviceId),
    sensorType: data.sensorType,
    metric: data.metric,
    value: data.value,
    timestamp: timestamp
  });
  await doc.save();

  // 3) Publicar evento para actualización de latestReading en devices-service
  publishAlert({
    type: 'SENSOR_READING',
    deviceId,
    sensorType: data.sensorType,
    metric: data.metric,
    value: data.value,
    timestamp: data.timestamp
  });
};

// Función para procesar múltiples lecturas
export const processBatchTelemetry = async (
  deviceId: string,
  data: TelemetryBatch
): Promise<void> => {
  if (!Array.isArray(data.readings) || data.readings.length === 0) {
    throw new Error('No readings provided in batch');
  }

  // Procesar cada lectura
  for (const reading of data.readings) {
    try {
      await processSingleTelemetry(deviceId, {
        sensorType: data.sensorType,
        metric: reading.metric,
        value: reading.value,
        timestamp: reading.timestamp
      });
    } catch (error) {
      console.error(`Error processing reading ${reading.metric}:`, error);
      // Continuar con las demás lecturas aunque una falle
    }
  }
};

// Función principal que detecta el formato automáticamente
export const processTelemetry = async (
  deviceId: string,
  data: TelemetryInput | TelemetryBatch
): Promise<void> => {
  try {
    // Detectar si es un batch o una lectura individual
    if ('readings' in data) {
      // Es un batch
      await processBatchTelemetry(deviceId, data);
    } else {
      // Es una lectura individual
      await processSingleTelemetry(deviceId, data);
    }
  } catch (error) {
    console.error('Error processing telemetry:', error);
    throw error;
  }
};