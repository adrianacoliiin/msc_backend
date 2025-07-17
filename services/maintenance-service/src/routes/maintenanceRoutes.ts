import { Router } from 'express';
import { MaintenanceController } from '../controllers/MaintenanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  handleValidationErrors, 
  validateCreateMaintenance,
  validateUpdateStatus,
  validateCancelMaintenance 
} from '../middleware/validation.js';

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

router.get('/:id/history',
  authenticateToken,
  maintenanceController.getStatusHistory
);

// Rutas de creación - solo admin y tech
router.post('/',
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateCreateMaintenance,
  handleValidationErrors,
  maintenanceController.create
);

// Rutas de gestión de estados

// Cambiar estado general (pending -> in_progress -> completed)
router.patch('/:id/status',
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateUpdateStatus,
  handleValidationErrors,
  maintenanceController.updateStatus
);

// Aprobar mantenimiento - solo admins
router.patch('/:id/approve',
  authenticateToken,
  requireRole(['admin']),
  maintenanceController.approveMaintenance
);

// Cancelar mantenimiento - admins o responsable asignado
router.patch('/:id/cancel',
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateCancelMaintenance,
  handleValidationErrors,
  maintenanceController.cancelMaintenance
);

// Rutas de modificación - solo admin y tech
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'tech']),
  handleValidationErrors,
  maintenanceController.update
);

// Eliminar - solo admin
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  maintenanceController.delete
);

export default router;