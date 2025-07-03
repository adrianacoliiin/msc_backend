import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateProfile,
  validateUpdateRole,
  validateUserId,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();
const ctrl = new UserController();

// Perfil propio
router.get(
  '/profile',
  authenticateToken,
  ctrl.getProfile
);
router.put(
  '/profile',
  authenticateToken,
  validateUpdateProfile,
  handleValidationErrors,
  ctrl.updateProfile
);

// ADMIN only
router.get(
  '/',
  authenticateToken,
  requireRole(['admin']),
  ctrl.getAllUsers
);
router.get(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validateUserId,
  handleValidationErrors,
  ctrl.getUserById
);
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  validateCreateUser,
  handleValidationErrors,
  ctrl.createUser
);
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validateUserId,
  validateUpdateUser,
  handleValidationErrors,
  ctrl.updateUser
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validateUserId,
  handleValidationErrors,
  ctrl.deleteUser
);
router.put(
  '/:id/role',
  authenticateToken,
  requireRole(['admin']),
  validateUserId,
  validateUpdateRole,
  handleValidationErrors,
  ctrl.updateUserRole
);

export default router;
