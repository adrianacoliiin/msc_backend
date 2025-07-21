// src/controllers/TelemetryController.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Telemetry } from '../models/Telemetry';
import { telemetryService } from '../services/telemetryService';

export class TelemetryController {
  
  /**
   * GET /telemetry/device/:id
   * Obtener histórico de telemetría por dispositivo
   */
  async getByDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const from = req.query.from as string;
      const to = req.query.to as string;
      const sensorType = req.query.sensorType as string;
      const metric = req.query.metric as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;

      const options = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensorType,
        metric,
        limit,
        page
      };

      const data = await telemetryService.getTelemetryByDevice(id, options);
      
      res.json({ 
        success: true, 
        data,
        pagination: {
          page,
          limit,
          total: data.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /telemetry/latest/:id
   * Obtener la última lectura de un dispositivo
   */
  async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sensorType = req.query.sensorType as string;

      const data = await telemetryService.getLatestTelemetry(id, sensorType);

      if (!data) {
        res.status(404).json({ success: false, error: 'No telemetry found' });
        return;
      }

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /telemetry/stats/:id/:metric
   * Obtener estadísticas de una métrica específica
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, metric } = req.params;
      const from = req.query.from as string;
      const to = req.query.to as string;
      const sensorType = req.query.sensorType as string;

      const options = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensorType
      };

      const stats = await telemetryService.getTelemetryStats(id, metric, options);

      if (!stats) {
        res.status(404).json({ success: false, error: 'No data found for the specified metric' });
        return;
      }

      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /telemetry/summary/:id/:metric
   * Obtener resumen agregado por intervalos
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, metric } = req.params;
      const interval = (req.query.interval as '1h' | '1d' | '1w') || '1h';
      const from = req.query.from as string;
      const to = req.query.to as string;
      const sensorType = req.query.sensorType as string;

      const options = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensorType
      };

      const summary = await telemetryService.getTelemetrySummary(id, metric, interval, options);

      res.json({ 
        success: true, 
        data: summary,
        interval,
        metric
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /telemetry/metrics/:id
   * Obtener lista de métricas disponibles para un dispositivo
   */
  async getAvailableMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sensorType = req.query.sensorType as string;

      const matchStage: any = {
        deviceId: new mongoose.Types.ObjectId(id)
      };

      if (sensorType) {
        matchStage.sensorType = sensorType;
      }

      const pipeline = [
        { $match: matchStage },
        { $unwind: '$readings' },
        {
          $group: {
            _id: {
              sensorType: '$sensorType',
              metric: '$readings.metric'
            },
            lastValue: { $last: '$readings.value' },
            lastTimestamp: { $last: '$readings.timestamp' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.sensorType',
            metrics: {
              $push: {
                metric: '$_id.metric',
                lastValue: '$lastValue',
                lastTimestamp: '$lastTimestamp',
                count: '$count'
              }
            }
          }
        }
      ];

      const result = await Telemetry.aggregate(pipeline);
      
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}