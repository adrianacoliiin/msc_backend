// src/services/telemetryService.ts
import { Telemetry } from '../models/Telemetry';
import { publishAlert } from '../utils/rabbitmq';
import mongoose from 'mongoose';
import { TelemetryInput, TelemetrySingle, TelemetryBatch, LatestReadingValue, DeviceUpdateEvent } from '../types/telemetry';
import { alertService } from './alertsService'; 

export class TelemetryService {
  
  /**
   * Función principal para procesar telemetría
   */
  async processTelemetry(deviceId: string, data: TelemetryInput): Promise<void> {
    try {
      // Detectar si es un batch o una lectura individual
      if ('readings' in data) {
        await this.processBatchTelemetry(deviceId, data);
      } else {
        await this.processSingleTelemetry(deviceId, data);
      }
    } catch (error) {
      console.error('Error processing telemetry:', error);
      throw error;
    }
  }

  /**
   * Procesar una sola lectura
   */
  private async processSingleTelemetry(deviceId: string, data: TelemetrySingle): Promise<void> {
    // Convertir a formato batch para reutilizar lógica
    const batchData: TelemetryBatch = {
      sensorType: data.sensorType,
      readings: [{
        metric: data.metric,
        value: data.value,
        timestamp: data.timestamp
      }]
    };
    
    await this.processBatchTelemetry(deviceId, batchData);
  }

  /**
   * Procesar múltiples lecturas
   */
  private async processBatchTelemetry(deviceId: string, data: TelemetryBatch): Promise<void> {
    if (!Array.isArray(data.readings) || data.readings.length === 0) {
      throw new Error('No readings provided in batch');
    }

    // Validar y convertir timestamps
    const validReadings = data.readings.map(reading => {
      const timestamp = new Date(reading.timestamp);
      if (isNaN(timestamp.getTime())) {
        throw new Error(`Invalid timestamp: ${reading.timestamp}`);
      }
      return {
        metric: reading.metric,
        value: reading.value,
        timestamp: timestamp
      };
    });

    // Crear documento de telemetría
    const telemetryDoc = new Telemetry({
      deviceId: new mongoose.Types.ObjectId(deviceId),
      sensorType: data.sensorType,
      readings: validReadings,
      timestamp: new Date()
    });

    await telemetryDoc.save();

    // Preparar datos para actualización del dispositivo
    const latestReadings: LatestReadingValue = {};
    validReadings.forEach(reading => {
      latestReadings[reading.metric] = {
        value: reading.value,
        timestamp: reading.timestamp.toISOString()
      };
    });

    // Publicar evento para actualización de latestReading en devices-service
    const updateEvent: DeviceUpdateEvent = {
      type: 'SENSOR_READING',
      deviceId,
      sensorType: data.sensorType,
      readings: latestReadings,
      timestamp: new Date().toISOString()
    };

    publishAlert(updateEvent);

    // 🚨 NUEVA FUNCIONALIDAD: Verificar y enviar alertas a IFTTT
    try {
      // Filtrar solo lecturas numéricas para alertas de umbral
      const numericReadings = validReadings.filter(reading => typeof reading.value === 'number') as Array<{ metric: string; value: number; timestamp: Date }>;
      
      if (numericReadings.length > 0) {
        await alertService.processBatchAlerts(deviceId, data.sensorType, numericReadings);
      }
    } catch (error) {
      console.error('Error processing alerts:', error);
      // No interrumpir el flujo principal si falla el sistema de alertas
    }

    console.log(`Processed ${validReadings.length} readings for device ${deviceId} (${data.sensorType})`);
  }

  /**
   * Obtener histórico de telemetría por dispositivo
   */
  async getTelemetryByDevice(
    deviceId: string,
    options: {
      from?: Date;
      to?: Date;
      sensorType?: string;
      metric?: string;
      limit?: number;
      page?: number;
    } = {}
  ) {
    const { from, to, sensorType, metric, limit = 1000, page = 1 } = options;

    const filter: any = { deviceId: new mongoose.Types.ObjectId(deviceId) };
    
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = from;
      if (to) filter.timestamp.$lte = to;
    }

    if (sensorType) {
      filter.sensorType = sensorType;
    }

    let query = Telemetry.find(filter).sort({ timestamp: -1 });

    if (limit > 0) {
      query = query.limit(limit).skip((page - 1) * limit);
    }

    const data = await query.lean();

    // Si se especifica una métrica específica, filtrar las lecturas
    if (metric) {
      return data.map(doc => ({
        ...doc,
        readings: doc.readings.filter((reading: any) => reading.metric === metric)
      })).filter(doc => doc.readings.length > 0);
    }

    return data;
  }

  /**
   * Obtener la última lectura de un dispositivo
   */
  async getLatestTelemetry(deviceId: string, sensorType?: string) {
    const filter: any = { deviceId: new mongoose.Types.ObjectId(deviceId) };
    
    if (sensorType) {
      filter.sensorType = sensorType;
    }

    const doc = await Telemetry
      .findOne(filter)
      .sort({ timestamp: -1 })
      .lean();

    return doc;
  }

  /**
   * Obtener estadísticas básicas de telemetría
   */
  async getTelemetryStats(
    deviceId: string,
    metric: string,
    options: {
      from?: Date;
      to?: Date;
      sensorType?: string;
    } = {}
  ) {
    const { from, to, sensorType } = options;

    const matchStage: any = {
      deviceId: new mongoose.Types.ObjectId(deviceId),
      'readings.metric': metric
    };

    if (from || to) {
      matchStage.timestamp = {};
      if (from) matchStage.timestamp.$gte = from;
      if (to) matchStage.timestamp.$lte = to;
    }

    if (sensorType) {
      matchStage.sensorType = sensorType;
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchStage },
      { $unwind: '$readings' },
      { $match: { 'readings.metric': metric } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$readings.value' },
          min: { $min: '$readings.value' },
          max: { $max: '$readings.value' },
          count: { $sum: 1 },
          latest: { $last: '$readings.value' },
          latestTimestamp: { $last: '$readings.timestamp' }
        }
      }
    ];

    const result = await Telemetry.aggregate(pipeline);
    return result[0] || null;
  }

  /**
   * Obtener resumen agregado por intervalos de tiempo
   */
  async getTelemetrySummary(
    deviceId: string,
    metric: string,
    interval: '1h' | '1d' | '1w' = '1h',
    options: {
      from?: Date;
      to?: Date;
      sensorType?: string;
    } = {}
  ) {
    const { from, to, sensorType } = options;

    // Convertir intervalo a formato MongoDB
    const intervalMap = {
      '1h': { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } },
      '1d': { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      '1w': { 
        $dateToString: { 
          format: '%Y-W%V', 
          date: '$timestamp' 
        } 
      }
    };

    const matchStage: any = {
      deviceId: new mongoose.Types.ObjectId(deviceId),
      'readings.metric': metric
    };

    if (from || to) {
      matchStage.timestamp = {};
      if (from) matchStage.timestamp.$gte = from;
      if (to) matchStage.timestamp.$lte = to;
    }

    if (sensorType) {
      matchStage.sensorType = sensorType;
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$readings' },
      { $match: { 'readings.metric': metric } },
      {
        $group: {
          _id: intervalMap[interval],
          avg: { $avg: '$readings.value' },
          min: { $min: '$readings.value' },
          max: { $max: '$readings.value' },
          count: { $sum: 1 },
          firstTimestamp: { $min: '$timestamp' },
          lastTimestamp: { $max: '$timestamp' }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    return await Telemetry.aggregate(pipeline as mongoose.PipelineStage[]);
  }

  // 🧪 MÉTODO PARA TESTING DE ALERTAS
  async testAlert(deviceId: string, message?: string): Promise<void> {
    try {
      await alertService.testAlert(deviceId, message);
      console.log('✅ Test alert executed successfully');
    } catch (error) {
      console.error('❌ Test alert failed:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const telemetryService = new TelemetryService();

// Función legacy para compatibilidad con código existente
export const processTelemetry = (deviceId: string, data: TelemetryInput) => {
  return telemetryService.processTelemetry(deviceId, data);
};