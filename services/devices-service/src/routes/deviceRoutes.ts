import { Router } from 'express';
import { DeviceController } from '../controllers/DeviceController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { 
  validateDevice, 
  validateUpdateDevice,
  validateDeviceReading, 
  validateRegisterDevice,
  validateActivateDevice,
  handleValidationErrors 
} from '../middleware/validation';

const router = Router();
const deviceController = new DeviceController();

// Rutas públicas para registro y activación de dispositivos
router.post('/register', 
  validateRegisterDevice,
  handleValidationErrors,
  deviceController.registerDevice
);

router.post('/activate', 
  validateActivateDevice,
  handleValidationErrors,
  deviceController.activateDevice
);

// Rutas protegidas - cualquier usuario autenticado puede ver
router.get('/', 
  authenticateToken, 
  deviceController.getDevices
);

router.get('/:id', 
  // authenticateToken, 
  deviceController.getDeviceById
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
  validateUpdateDevice,
  handleValidationErrors,
  deviceController.updateDevice
);

// Solo admin puede eliminar
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  deviceController.deleteDevice
);

// Endpoint para actualizar lecturas (usado por telemetry-service)
router.put('/:id/reading',
  authenticateToken,
  requireRole(['admin', 'tech']), // En el futuro, esto será un service token
  validateDeviceReading,
  handleValidationErrors,
  deviceController.updateReading
);

// Endpoint stub para ingestión de datos (Fase 2)
router.post('/:id/data',
  authenticateToken,
  requireRole(['admin', 'tech']),
  deviceController.ingestData
);

export default router;