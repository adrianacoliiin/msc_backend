import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

export const validateCreateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase, one lowercase, one number, and one special character'
    ),
  body('role')
    .optional()
    .isIn(['admin', 'tech', 'user'])
    .withMessage('Role must be admin, tech, or user'),
];

export const validateUpdateUser = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['admin', 'tech', 'user'])
    .withMessage('Role must be admin, tech, or user'),
];

export const validateUpdateProfile = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

export const validateUpdateRole = [
  body('role')
    .isIn(['admin', 'tech', 'user'])
    .withMessage('Role must be admin, tech, or user'),
];

export const validateUserId = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];
