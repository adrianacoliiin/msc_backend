import { Request, Response, NextFunction } from 'express';
import { Telemetry } from '../models/Telemetry';

export class TelemetryController {
  async getByDevice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const from = req.query.from as string;
      const to = req.query.to as string;

      const filter: any = { deviceId: id };
      if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to)   filter.timestamp.$lte = new Date(to);
      }

      const data = await Telemetry.find(filter).sort({ timestamp: 1 });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /telemetry/latest/:id
   * Devuelve la última lectura de un dispositivo
   */
  async getLatest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await Telemetry
        .findOne({ deviceId: id })
        .sort({ timestamp: -1 })
        .lean();

      if (!doc) {
        res.status(404).json({ success: false, error: 'No telemetry found' });
        return;
      }

      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }
}
