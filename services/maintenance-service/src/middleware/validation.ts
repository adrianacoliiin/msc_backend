//src/middleware/validation.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware para manejar errores de validación
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
      details: errors.array()
    });
    return;
  }
  next();
};

// Validación para crear un mantenimiento
export const validateCreateMaintenance = [
  body('date')
    .notEmpty()
    .withMessage('La fecha es obligatoria')
    .isISO8601()
    .withMessage('La fecha debe estar en formato ISO 8601 (ej. 2025-07-17T10:00:00Z)'),

  body('responsible_id')
    .notEmpty()
    .withMessage('El responsable es obligatorio')
    .isMongoId()
    .withMessage('El ID del responsable no es válido'),

  body('device_id')
    .notEmpty()
    .withMessage('El dispositivo es obligatorio')
    .isMongoId()
    .withMessage('El ID del dispositivo no es válido'),

  body('damage_image')
    .optional()
    .isString()
    .withMessage('La ruta de la imagen debe ser un string'),
];
