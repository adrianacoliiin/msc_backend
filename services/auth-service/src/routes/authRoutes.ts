// src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { 
  validateRegister, 
  validateLogin, 
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors 
} from '../middleware/validation';
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

// Rutas de recuperación de contraseña (públicas)
router.post('/forgot-password',
  validateForgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

router.post('/reset-password',
  validateResetPassword,
  handleValidationErrors,
  authController.resetPassword
);

// Rutas protegida - usuario autenticado
router.get('/me', 
  authenticateToken,
  authController.me
);

// Rutas de administración - admins
router.get('/users', 
  authenticateToken,
  requireRole(['admin']),
  authController.getUsers
);

router.get('/users/pending', 
  authenticateToken,
  requireRole(['admin']),
  authController.getPendingUsers
);

router.patch('/users/:id/status', 
  authenticateToken,
  requireRole(['admin']),
  authController.updateUserStatus
);

export default router;