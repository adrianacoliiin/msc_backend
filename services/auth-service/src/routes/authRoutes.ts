// src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRegister, validateLogin, handleValidationErrors } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Rutas públicas
router.post('/register', 
  validateRegister, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  validateLogin, 
  handleValidationErrors, 
  authController.login
);

// Rutas protegidas
router.get('/me', 
  authenticateToken,
  // requireRole(['admin']),
  authController.me
);

export default router;