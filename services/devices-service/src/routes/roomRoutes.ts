import { Router } from 'express';
import { RoomController } from '../controllers/RoomController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRoom, handleValidationErrors, validateUpdateRoom } from '../middleware/validation';

const router = Router();
const roomController = new RoomController();

// Rutas protegidas - cualquier usuario autenticado puede ver
router.get('/', 
  authenticateToken, 
  roomController.getAll
);

router.get('/:id', 
  authenticateToken, 
  roomController.getById
);

// Rutas de modificación - solo admin y tech
router.post('/', 
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateRoom,
  handleValidationErrors,
  roomController.create
);

router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'tech']),
  validateUpdateRoom,
  handleValidationErrors,
  roomController.update
);

// Solo admin puede eliminar
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  roomController.delete
);

export default router;
