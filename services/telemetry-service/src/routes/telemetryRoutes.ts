// src/routes/telemetryRoutes.ts
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

// Estadísticas de una métrica
router.get(
  '/telemetry/stats/:id/:metric',
  authenticateToken,
  validateQueryDates,
  handleValidationErrors,
  (req: Request, res: Response, next: NextFunction) => {
    return ctrl.getStats(req, res, next);
  }
);

// Resumen agregado por intervalos
router.get(
  '/telemetry/summary/:id/:metric',
  authenticateToken,
  validateQueryDates,
  handleValidationErrors,
  (req: Request, res: Response, next: NextFunction) => {
    return ctrl.getSummary(req, res, next);
  }
);

// Métricas disponibles para un dispositivo
router.get(
  '/telemetry/metrics/:id',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => {
    return ctrl.getAvailableMetrics(req, res, next);
  }
);

export default router;