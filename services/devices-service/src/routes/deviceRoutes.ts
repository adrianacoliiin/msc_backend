import { Router } from 'express';
import { DeviceController } from '../controllers/DeviceController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateDevice, validateDeviceReading, handleValidationErrors } from '../middleware/validation';

const router = Router();
const deviceController = new DeviceController();

// Rutas protegidas - cualquier usuario autenticado puede ver
router.get('/', 
  authenticateToken, 
  deviceController.getAll
);

router.get('/:id', 
  authenticateToken, 
  deviceController.getById
);

router.get('/room/:roomId', 
  authenticateToken, 
  deviceController.getByRoom
);

// Rutas de modificación - solo admin y tech
router.post('/', 
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateDevice,
  handleValidationErrors,
  deviceController.create
);

router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'tech']),
  // validateDevice,
  handleValidationErrors,
  deviceController.update
);

// Solo admin puede eliminar
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  deviceController.delete
);

// Endpoint especial para actualizar lecturas (usado por telemetry-service)
router.put('/:id/reading',
  authenticateToken,
  requireRole(['admin', 'tech']), // En el futuro, esto será un service token
  validateDeviceReading,
  handleValidationErrors,
  deviceController.updateReading
);

export default router;