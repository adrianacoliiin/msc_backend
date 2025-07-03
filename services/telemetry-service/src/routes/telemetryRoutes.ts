import { Router, Request, Response, NextFunction } from 'express';
import { TelemetryController } from '../controller/TelemetryController';
import { authenticateToken } from '../middleware/auth';
import { validateQueryDates, handleValidationErrors } from '../middleware/validation';

const router = Router();
const ctrl = new TelemetryController();

// Histórico por dispositivo
router.get(
  '/telemetry/device/:id',
  authenticateToken,
  validateQueryDates,
  handleValidationErrors,
  (req: Request, res: Response, next: NextFunction) => {
    return ctrl.getByDevice(req, res, next);
  }
);

// Última lectura
router.get(
  '/telemetry/latest/:id',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => {
    return ctrl.getLatest(req, res, next);
  }
);

export default router;
