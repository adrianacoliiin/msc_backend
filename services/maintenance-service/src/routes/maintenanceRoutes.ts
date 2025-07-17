import { Router } from 'express';
import { MaintenanceController } from '../controllers/MaintenanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { handleValidationErrors, validateCreateMaintenance } from '../middleware/validation.js';

const router = Router();
const maintenanceController = new MaintenanceController();

// Rutas de lectura - cualquier usuario autenticado
router.get('/', 
  authenticateToken,
  maintenanceController.getAll
);

router.get('/:id',
  authenticateToken,
  maintenanceController.getById
);

// Rutas de modificación - solo admin y tech
router.post('/',
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateCreateMaintenance,
  handleValidationErrors,
  maintenanceController.create
);

// Futuras rutas opcionales:
// router.put('/:id',
//   authenticateToken,
//   requireRole(['admin', 'tech']),
//   handleValidationErrors,
//   maintenanceController.update // (si lo implementas)
// );

// router.delete('/:id',
//   authenticateToken,
//   requireRole(['admin']),
//   maintenanceController.delete // (si lo implementas)
// );

export default router;
